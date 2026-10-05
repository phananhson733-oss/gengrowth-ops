import { isDeepStrictEqual } from "node:util";

import { captureMatchVersion, canonicalCapturePostUrl } from "./match-candidates.mjs";
import { canonicalDateTimePatch } from "./feishu-client.mjs";
import { ShortDramaError } from "./errors.mjs";
import { assertPatchAllowed, BASE_FIELD_SPECS, TABLES, fieldOwner, isEmptyBusinessRecord } from "./schema.mjs";

const TABLE_BINDINGS = Object.freeze({
  accounts: "账号台账",
  dramas: "选剧池",
  captures: "采集数据",
  releases: "发布记录",
});
const MATCH_INPUT_FIELDS = Object.freeze(["Post ID", "视频链接", "账号", "日期"]);
// Base makes a freshly written record visible asynchronously. The single-record reader
// already polls for it (MAX_RECORD_VISIBILITY_ATTEMPTS in feishu-client); the bulk
// readback needs the same, otherwise a lagging row reads as a lost write.
const MAX_BULK_READBACK_ATTEMPTS = 3;
const MAX_UPDATE_READBACK_ATTEMPTS = 5;
const defaultSleep = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });

function fail(code, message, details = {}) {
  throw new ShortDramaError(code, message, details);
}

function assertNotAborted(signal) {
  if (signal?.aborted) fail("base_operation_aborted", "Feishu Base operation was aborted");
}

function concurrentHumanChange(message, phase) {
  fail("concurrent_human_change", message, {
    next_step: "manual_repair",
    relation_preserved: true,
    phase,
  });
}

function plainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function clone(value) {
  try {
    return structuredClone(value);
  } catch {
    fail("base_response_invalid", "Base value is not cloneable");
  }
}

function normalizedString(value, code, message) {
  if (typeof value !== "string" || value.trim().length === 0) fail(code, message);
  return value.trim();
}

function normalizeKey(value) {
  return normalizedString(value, "base_key_invalid", "Base primary key must be a non-empty string");
}

function normalizeRecordId(value) {
  const id = normalizedString(value, "base_response_invalid", "Base record ID must be a non-empty string");
  if (id !== value) fail("base_response_invalid", "Base record ID must already be normalized");
  return id;
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (plainObject(value)) {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableValue(value[key])]));
  }
  return value;
}

function equalValue(left, right) {
  return isDeepStrictEqual(stableValue(left), stableValue(right));
}

function fieldValue(fields, fieldName) {
  return Object.hasOwn(fields, fieldName) ? fields[fieldName] : undefined;
}

function assertPatchObject(patch) {
  if (!plainObject(patch)) fail("base_response_invalid", "Base patch must be an object");
}

function assertExpectedObject(expected) {
  if (!plainObject(expected)) fail("base_response_invalid", "Expected Base fields must be an object");
}

function validateRecord(record, tableName, primaryField = null) {
  if (!plainObject(record) || !plainObject(record.fields)) {
    fail("base_response_invalid", "Base record is malformed", { table: tableName });
  }
  const recordId = normalizeRecordId(record.record_id);
  let key = null;
  if (primaryField !== null) {
    const rawKey = record.fields[primaryField];
    if (typeof rawKey !== "string" || rawKey.trim().length === 0) {
      fail("duplicate_base_key", "Base primary key is blank", { table: tableName });
    }
    key = rawKey.trim();
  }
  return { record: clone(record), recordId, key };
}

function validateWriteResult(result, expectedCount, tableName, expectedIds = null) {
  if (!Array.isArray(result) || result.length !== expectedCount) {
    fail("base_response_invalid", "Base write result count is invalid", { table: tableName });
  }
  const ids = result.map((record) => {
    if (!plainObject(record)) fail("base_response_invalid", "Base write result is malformed", { table: tableName });
    if (record.record_id === null && expectedIds === null) return null;
    return normalizeRecordId(record.record_id);
  });
  const knownIds = ids.filter((id) => id !== null);
  if (new Set(knownIds).size !== knownIds.length) {
    fail("base_response_invalid", "Base write result contains duplicate record IDs", { table: tableName });
  }
  if (expectedIds && ids.some((id, index) => id !== expectedIds[index])) {
    fail("base_response_invalid", "Base update result IDs do not match the request", { table: tableName });
  }
  return ids;
}

function exactRelation(value) {
  if (!Array.isArray(value)) return false;
  const ids = new Set();
  for (const cell of value) {
    if (!plainObject(cell) || Object.keys(cell).length !== 1 || typeof cell.id !== "string" ||
        cell.id.length === 0 || cell.id.trim() !== cell.id || ids.has(cell.id)) return false;
    ids.add(cell.id);
  }
  return true;
}

function tableLinkTargets(tableName) {
  return new Map(
    BASE_FIELD_SPECS[tableName]
      .filter((spec) => spec.kind === "link")
      .map((spec) => [spec.name, spec.targetTable]),
  );
}

function writableFields(tableName) {
  const definition = TABLES[tableName];
  return [...definition.human, ...definition.machine, ...definition.shared];
}

function assertRequestedFields(record, expected, tableName) {
  for (const [fieldName, expectedValue] of Object.entries(expected)) {
    fieldOwner(tableName, fieldName);
    if (!equalValue(fieldValue(record.fields, fieldName), expectedValue)) {
      fail("readback_mismatch", "Base readback does not match requested fields", {
        table: tableName,
        field: fieldName,
      });
    }
  }
}

export class TableRepository {
  constructor({ owner, client, appToken, tableId, tableName, sleep = defaultSleep, writableOnly = false }) {
    this.owner = owner;
    this.client = client;
    this.sleep = sleep;
    this.writableOnly = writableOnly;
    this.appToken = appToken;
    this.tableId = tableId;
    this.tableName = tableName;
    this.primaryField = TABLES[tableName].primaryField;
    this.linkTargets = tableLinkTargets(tableName);
    this.index = null;
  }

  async loadIndex({ signal } = {}) {
    assertNotAborted(signal);
    this.index = null;
    let result;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try { result = await this.client.listRecords(this.appToken, this.tableId, { signal, tableName: this.tableName, ...(this.writableOnly ? { writableOnly: true } : {}) }); break; }
      catch (error) {
        const onlyRevisionChanged = error.code === "base_response_invalid" && ["rev", "total"].includes(error.details?.pagination_metadata_key) &&
          (!Array.isArray(error.details?.changed_metadata) || error.details.changed_metadata.every(k => ["rev", "total"].includes(k)));
        if (!onlyRevisionChanged || attempt === 3) throw error;
        assertNotAborted(signal); await this.sleep(attempt * 1000, {signal});
      }
    }
    assertNotAborted(signal);
    if (!plainObject(result) || result.complete !== true) {
      if (plainObject(result) && result.complete === false) {
        fail("base_response_incomplete", "Base list response is incomplete", { table: this.tableName });
      }
      fail("base_response_invalid", "Base list response is malformed", { table: this.tableName });
    }
    if (!Array.isArray(result.items)) {
      fail("base_response_invalid", "Base list response items are malformed", { table: this.tableName });
    }
    const nextIndex = new Map();
    const recordIds = new Set();
    for (const rawRecord of result.items) {
      if (isEmptyBusinessRecord(this.tableName, rawRecord?.fields)) continue;
      const { record, recordId, key } = validateRecord(rawRecord, this.tableName, this.primaryField);
      if (recordIds.has(recordId)) {
        fail("duplicate_record_id", "Base list contains a duplicate record ID", { table: this.tableName });
      }
      if (nextIndex.has(key)) {
        fail("duplicate_base_key", "Base list contains a duplicate primary key", { table: this.tableName });
      }
      recordIds.add(recordId);
      nextIndex.set(key, record);
    }
    this.index = nextIndex;
    return new Map([...nextIndex].map(([key, record]) => [key, clone(record)]));
  }

  async readRecordById(recordId, { requirePrimary = false, validate = null, signal = undefined } = {}) {
    assertNotAborted(signal);
    const normalizedId = normalizeRecordId(recordId);
    try {
      const rawRecord = await this.client.getRecord(this.appToken, this.tableId, normalizedId, { signal, tableName: this.tableName });
      assertNotAborted(signal);
      if (!plainObject(rawRecord) || !plainObject(rawRecord.fields) || rawRecord.record_id !== normalizedId) {
        fail("readback_mismatch", "Base readback record ID does not match the request", {
          table: this.tableName,
          recordId: normalizedId,
        });
      }
      const record = validateRecord(rawRecord, this.tableName, requirePrimary ? this.primaryField : null).record;
      if (validate) validate(record);
      return record;
    } catch (error) {
      this.index = null;
      throw error;
    }
  }

  async getByKey(key, { signal } = {}) {
    const normalizedKey = normalizeKey(key);
    assertNotAborted(signal);
    if (!this.index) await this.loadIndex({ signal });
    assertNotAborted(signal);
    const record = this.index.get(normalizedKey);
    return record ? clone(record) : null;
  }

  preparePatch(key, patch, actorKind) {
    const normalizedKey = normalizeKey(key);
    assertPatchObject(patch);
    const fields = clone(patch);
    if (Object.hasOwn(fields, this.primaryField)) {
      const patchKey = normalizeKey(fields[this.primaryField]);
      if (patchKey !== normalizedKey) {
        fail("primary_key_conflict", "Patch primary key conflicts with method key", { table: this.tableName });
      }
      fields[this.primaryField] = normalizedKey;
    }
    assertPatchAllowed(this.tableName, fields, actorKind);
    return { key: normalizedKey, patch: canonicalDateTimePatch(this.tableName, fields) };
  }

  async validateRelations(patch, { signal } = {}) {
    for (const [fieldName, targetTable] of this.linkTargets) {
      assertNotAborted(signal);
      if (!Object.hasOwn(patch, fieldName)) continue;
      const relation = patch[fieldName];
      if (!exactRelation(relation)) {
        fail("relation_value_invalid", "Relation field must be a unique Base v3 record-ID array", {
          table: this.tableName,
          field: fieldName,
        });
      }
      const targetRepository = this.owner.repositoryForTable(targetTable);
      if (!targetRepository.index) await targetRepository.loadIndex({ signal });
      assertNotAborted(signal);
      const knownIds = new Set([...targetRepository.index.values()].map((record) => record.record_id));
      if (relation.some((cell) => !knownIds.has(cell.id))) {
        fail("relation_target_not_found", "Relation target was not found in a complete index", {
          table: this.tableName,
          field: fieldName,
        });
      }
    }
  }

  async createWithGeneratedId(patch, actorKind, options = {}) {
    const result = await this.createManyWithGeneratedIds([patch], actorKind, options);
    return {record: result.records[0], readback: result.readback};
  }

  async createManyWithGeneratedIds(patches, actorKind, {signal, beforeWrite} = {}) {
    let writeAttempted = false;
    let acknowledged = [];
    const verified = [];
    try {
      assertNotAborted(signal);
      if (!Array.isArray(patches) || patches.length < 1 || patches.length > 30) fail("mutation_shape_invalid", "Generated create supports 1 to 30 records");
      const fields = [];
      for (const patch of patches) {
        assertPatchObject(patch);
        if (!this.serverGeneratedIds || Object.hasOwn(patch, this.primaryField)) fail("primary_key_conflict", "Base generated create must omit the primary field", {table: this.tableName});
        assertPatchAllowed(this.tableName, patch, actorKind);
        const value = canonicalDateTimePatch(this.tableName, clone(patch));
        await this.validateRelations(value, {signal});
        fields.push(value);
      }
      const metadata = await this.client.listFields(this.appToken, this.tableId, {signal});
      const primary = metadata?.items?.find(field => field.name === this.primaryField);
      const spec = BASE_FIELD_SPECS[this.tableName].find(field => field.name === this.primaryField);
      const rules = [{text: spec?.autoNumberPrefix, type: "text"}, {length: 6, type: "incremental_number"}];
      if (metadata?.complete !== true || !spec?.autoNumberPrefix || primary?.type !== "auto_number" || !equalValue(primary.style?.rules, rules)) {
        fail("base_schema_drift", "Base generated ID contract changed before create", {table: this.tableName, field: this.primaryField});
      }
      const before = await this.loadIndex({signal});
      const existingIds = new Set([...before.values()].map(r => r.record_id));
      this.index = null;
      // The client invokes this only after its last read-only schema validation.
      const commit = async () => {
        assertNotAborted(signal);
        await beforeWrite?.(before);
        writeAttempted = true;
      };
      const written = await this.client.createRecords(this.appToken, this.tableId, fields.map(fields => ({fields})), {signal, tableName: this.tableName, beforeWrite: commit});
      if (beforeWrite && !writeAttempted) fail("readback_mismatch", "Create transport omitted the before-write gate");
      writeAttempted = true;
      acknowledged = validateWriteResult(written, fields.length, this.tableName);
      if (acknowledged.some(id => !id || existingIds.has(id))) fail("readback_mismatch", "Generated create requires new acknowledged record IDs; do not replay", {table: this.tableName});
      const remaining = new Set(fields.map((_, i) => i));
      const records = new Array(fields.length);
      for (const recordId of acknowledged) {
        let checked,index;
        for(let attempt=1;attempt<=MAX_UPDATE_READBACK_ATTEMPTS;attempt++){
          const record = await this.client.getRecord(this.appToken, this.tableId, recordId, {
            signal, tableName: this.tableName, waitForVisibility: true,
            selectFields: [...new Set([this.primaryField, ...fields.flatMap(value => Object.keys(value))])],
          });
          checked = validateRecord(record, this.tableName, this.primaryField);
          if (checked.recordId !== recordId || !new RegExp(`^${spec.autoNumberPrefix}\\d{6}$`).test(checked.key) || before.has(checked.key)) {
            fail("readback_mismatch", "Generated ID is invalid or already claimed", {table: this.tableName, record_id: recordId});
          }
          // Bind by actual fields, not acknowledgement order. A known blank cell
          // may lag an acknowledged create; never retry the POST or accept a third-party value.
          index = [...remaining].find(i => Object.entries(fields[i]).every(([name, value]) => equalValue(fieldValue(record.fields, name), value)));
          if(index!==undefined)break;
          const possiblyLagging=[...remaining].some(i=>Object.entries(fields[i]).every(([name,value])=>{
            const actual=fieldValue(record.fields,name);
            return equalValue(actual,value)||actual===null||actual===undefined||actual===''||Array.isArray(actual)&&actual.length===0;
          }));
          if(!possiblyLagging||attempt===MAX_UPDATE_READBACK_ATTEMPTS){
            const mismatched_fields=[...new Set([...remaining].flatMap(i=>Object.entries(fields[i]).filter(([name,value])=>!equalValue(fieldValue(record.fields,name),value)).map(([name])=>name)))];
            fail("readback_mismatch", "Generated record does not match an approved item", {table:this.tableName,record_id:recordId,mismatched_fields});
          }
          await this.sleep(attempt*1000,{signal});assertNotAborted(signal);
        }
        assertRequestedFields(checked.record, fields[index], this.tableName);
        remaining.delete(index);
        before.set(checked.key, checked.record);
        records[index] = clone(checked.record);
        verified.push({record_id: recordId, key: checked.key, index});
      }
      this.index = before;
      return {records, readback: "verified"};
    } catch (error) {
      this.index = null;
      error.details = {...(error.details ?? {}), phase: error.details?.phase ?? (writeAttempted ? "generated_create_write_or_readback" : "generated_create_preflight"),
        write_attempted: writeAttempted, ...(acknowledged.length ? {record_ids: acknowledged, ...(acknowledged.length === 1 ? {record_id: acknowledged[0]} : {})} : {}),
        ...(verified.length ? {verified_records: verified} : {})};
      throw error;
    }
  }

  async upsertByKey(key, patch, actorKind, { signal } = {}) {
    assertNotAborted(signal);
    const prepared = this.preparePatch(key, patch, actorKind);
    await this.validateRelations(prepared.patch, { signal });
    assertNotAborted(signal);
    if (!this.index) await this.loadIndex({ signal });
    assertNotAborted(signal);
    const verifiedIndex = this.index;
    const existing = this.index.get(prepared.key);
    let writeFields;
    let written;
    if (existing) {
      writeFields = prepared.patch;
      if (Object.keys(writeFields).length === 0) {
        const checked = await this.readRecordById(existing.record_id, {
          requirePrimary: true,
          validate: (record) => {
            if (normalizeKey(record.fields[this.primaryField]) !== prepared.key) {
              fail("readback_mismatch", "Base readback primary key changed", { table: this.tableName });
            }
          },
          signal,
        });
        this.index.set(prepared.key, checked);
        return { record: clone(checked), readback: "verified" };
      }
      this.index = null;
      written = await this.client.updateRecords(this.appToken, this.tableId, [
        { record_id: existing.record_id, fields: clone(writeFields) },
      ], { signal, tableName: this.tableName });
      assertNotAborted(signal);
      validateWriteResult(written, 1, this.tableName, [existing.record_id]);
    } else {
      assertPatchAllowed(this.tableName, { [this.primaryField]: prepared.key }, "migration");
      writeFields = { ...prepared.patch, [this.primaryField]: prepared.key };
      this.index = null;
      written = await this.client.createRecords(this.appToken, this.tableId, [{ fields: clone(writeFields) }], { signal, tableName: this.tableName });
      assertNotAborted(signal);
      validateWriteResult(written, 1, this.tableName);
    }
    const recordId = written[0].record_id;
    if (recordId === null) {
      await this.loadIndex({ signal });
      const readback = this.index.get(prepared.key);
      if (!readback) fail("readback_mismatch", "Created Base record is missing after acknowledged write", { table: this.tableName });
      assertRequestedFields(readback, writeFields, this.tableName);
      return { record: clone(readback), readback: "verified" };
    }
    let readback;
    for (let attempt = 1; ; attempt += 1) {
      readback = await this.readRecordById(recordId, {
        requirePrimary: true,
        validate: (record) => {
          if (normalizeKey(record.fields[this.primaryField]) !== prepared.key) {
            fail("readback_mismatch", "Base readback primary key changed", { table: this.tableName });
          }
        },
        signal,
      });
      const mismatches = Object.entries(writeFields).filter(([field, value]) =>
        !equalValue(fieldValue(readback.fields, field), value));
      if (mismatches.length === 0) break;
      // An acknowledged update may still read its previous cells briefly. Poll
      // only that known old state; a different value is a conflict, not lag.
      // Never replay the write, and never accept an unverified acknowledgement.
      const stale = existing && mismatches.every(([field]) =>
        equalValue(fieldValue(readback.fields, field), fieldValue(existing.fields, field)));
      if (!stale || attempt >= MAX_UPDATE_READBACK_ATTEMPTS) {
        assertRequestedFields(readback, writeFields, this.tableName);
      }
      await this.sleep(attempt * 1_000, { signal });
      assertNotAborted(signal);
    }
    verifiedIndex.set(prepared.key, readback);
    this.index = verifiedIndex;
    return { record: clone(readback), readback: "verified" };
  }

  async syncManyByKey(entries, actorKind, { signal } = {}) {
    assertNotAborted(signal);
    if (!Array.isArray(entries)) fail("base_response_invalid", "Bulk sync entries must be an array");
    const prepared = [];
    const keys = new Set();
    for (const entry of entries) {
      if (!plainObject(entry) || Object.keys(entry).some((name) => !["key", "patch"].includes(name))) {
        fail("base_response_invalid", "Bulk sync entry is malformed", { table: this.tableName });
      }
      const item = this.preparePatch(entry.key, entry.patch, actorKind);
      if (keys.has(item.key)) {
        fail("duplicate_input_key", "Bulk sync contains a duplicate primary key", { table: this.tableName });
      }
      keys.add(item.key);
      prepared.push(item);
    }
    for (const item of prepared) {
      assertNotAborted(signal);
      await this.validateRelations(item.patch, { signal });
    }

    await this.loadIndex({ signal });
    assertNotAborted(signal);
    const creates = [];
    const updates = [];
    const expectations = new Map();
    const beforeWrites = new Map();
    let unchanged = 0;
    for (const item of prepared) {
      const existing = this.index.get(item.key);
      if (!existing) {
        assertPatchAllowed(this.tableName, { [this.primaryField]: item.key }, "migration");
        const fields = { ...item.patch, [this.primaryField]: item.key };
        creates.push({ fields: clone(fields) });
        expectations.set(item.key, fields);
        continue;
      }
      const changedFields = Object.fromEntries(
        Object.entries(item.patch).filter(([fieldName, value]) => !equalValue(fieldValue(existing.fields, fieldName), value)),
      );
      if (Object.keys(changedFields).length === 0) {
        unchanged += 1;
        continue;
      }
      beforeWrites.set(item.key, clone(existing));
      updates.push({ record_id: existing.record_id, fields: clone(changedFields) });
      expectations.set(item.key, clone(item.patch));
    }

    if (creates.length > 0 || updates.length > 0) this.index = null;
    if (creates.length > 0) {
      assertNotAborted(signal);
      const result = await this.client.createRecords(this.appToken, this.tableId, creates, { signal, tableName: this.tableName });
      assertNotAborted(signal);
      validateWriteResult(result, creates.length, this.tableName);
    }
    if (updates.length > 0) {
      assertNotAborted(signal);
      const result = await this.client.updateRecords(this.appToken, this.tableId, updates, { signal, tableName: this.tableName });
      assertNotAborted(signal);
      validateWriteResult(result, updates.length, this.tableName, updates.map((record) => record.record_id));
    }

    try {
      for (let attempt = 1; ; attempt += 1) {
        // Complete-read consistency retries are bounded inside loadIndex; do not multiply them here.
        await this.loadIndex({ signal });
        assertNotAborted(signal);
        const missing = [...expectations.keys()].filter((key) => !this.index.has(key));
        let stale = false;
        for (const [key, expected] of expectations) {
          const actual = this.index.get(key), before = beforeWrites.get(key);
          if (!actual) continue;
          if (before && before.record_id !== actual.record_id) fail("readback_mismatch", "Bulk update target identity changed", { table: this.tableName });
          for (const [field, value] of Object.entries(expected)) {
            if (equalValue(fieldValue(actual.fields, field), value)) continue;
            if (!before || !equalValue(fieldValue(actual.fields, field), fieldValue(before.fields, field))) {
              assertRequestedFields(actual, expected, this.tableName);
            }
            stale = true;
          }
        }
        if (missing.length === 0 && !stale) break;
        if (attempt >= MAX_BULK_READBACK_ATTEMPTS) {
          fail("readback_mismatch", missing.length ? "Changed Base record is missing after bulk sync" : "Acknowledged bulk values remained stale", {
            table: this.tableName, missing: missing.length, attempts: attempt,
          });
        }
        await this.sleep(attempt * 1_000, { signal });
        assertNotAborted(signal);
      }
      for (const [changedKey, expected] of expectations) {
        assertRequestedFields(this.index.get(changedKey), expected, this.tableName);
      }
    } catch (error) {
      this.index = null;
      throw error;
    }
    return {
      created: creates.length,
      updated: updates.length,
      unchanged,
      readback: "verified",
    };
  }

  syncManyMachine(entries, options = {}) {
    return this.syncManyByKey(entries, "machine", options);
  }

  async machineUpsertWithInvariant(key, patch, { signal } = {}) {
    assertNotAborted(signal);
    const prepared = this.preparePatch(key, patch, "machine");
    await this.validateRelations(prepared.patch, { signal });
    if (!this.index) await this.loadIndex({ signal });
    assertNotAborted(signal);
    const verifiedIndex = this.index;
    const indexed = this.index.get(prepared.key);
    let before = null;
    if (indexed) {
      before = await this.readRecordById(indexed.record_id, {
        requirePrimary: true,
        validate: (record) => {
          if (normalizeKey(record.fields[this.primaryField]) !== prepared.key) {
            fail("readback_mismatch", "Base record primary key changed before machine write", { table: this.tableName });
          }
        },
        signal,
      });
    }

    let written;
    let expected;
    if (before) {
      if (Object.keys(prepared.patch).length === 0) return { record: clone(before), readback: "verified" };
      expected = prepared.patch;
      this.index = null;
      written = await this.client.updateRecords(this.appToken, this.tableId, [
        { record_id: before.record_id, fields: clone(prepared.patch) },
      ], { signal, tableName: this.tableName });
      assertNotAborted(signal);
      validateWriteResult(written, 1, this.tableName, [before.record_id]);
    } else {
      assertPatchAllowed(this.tableName, { [this.primaryField]: prepared.key }, "migration");
      expected = { ...prepared.patch, [this.primaryField]: prepared.key };
      this.index = null;
      written = await this.client.createRecords(this.appToken, this.tableId, [{ fields: clone(expected) }], { signal, tableName: this.tableName });
      assertNotAborted(signal);
      validateWriteResult(written, 1, this.tableName);
    }

    let after;
    if (written[0].record_id === null) {
      await this.loadIndex({ signal });
      after = this.index.get(prepared.key);
      if (!after) fail("readback_mismatch", "Created Base record is missing after acknowledged machine write", { table: this.tableName });
      assertRequestedFields(after, expected, this.tableName);
    } else after = await this.readRecordById(written[0].record_id, {
      requirePrimary: true,
      validate: (record) => {
        assertRequestedFields(record, expected, this.tableName);
        const requested = new Set(Object.keys(expected));
        for (const fieldName of writableFields(this.tableName)) {
          if (requested.has(fieldName)) continue;
          const beforeValue = before ? fieldValue(before.fields, fieldName) : undefined;
          const afterValue = fieldValue(record.fields, fieldName);
          if (!equalValue(beforeValue, afterValue)) {
            fail("machine_invariant_violation", "Machine write changed a non-request writable field", {
              table: this.tableName,
              field: fieldName,
            });
          }
        }
      },
      signal,
    });
    verifiedIndex.set(prepared.key, after);
    this.index = verifiedIndex;
    return { record: clone(after), readback: "verified" };
  }

  async verify(recordId, expected, { signal } = {}) {
    const normalizedId = normalizeRecordId(recordId);
    assertExpectedObject(expected);
    const record = await this.readRecordById(normalizedId, {
      validate: (readback) => assertRequestedFields(readback, expected, this.tableName),
      signal,
    });
    return { record: clone(record), readback: "verified" };
  }
}

class ReleaseRepository extends TableRepository {
  async detachDuplicateCaptureSafely(request, expected) {
    const target = await this.readRecordById(request.release_record_id, {requirePrimary:true});
    const owner = await this.readRecordById(request.owner_record_id, {requirePrimary:true});
    const protectedFields = [...TABLES["发布记录"].human, ...TABLES["发布记录"].shared, "发布ID", "采集记录", "匹配方式", "匹配置信度"];
    const snapshot = row => ({record_id:row.record_id,fields:Object.fromEntries(protectedFields.map(key=>[key,row.fields[key]??null]))});
    if (!equalValue(snapshot(target), {record_id:expected.target.record_id,fields:Object.fromEntries(protectedFields.map(key=>[key,expected.target.fields[key]??null]))}) ||
        !equalValue(snapshot(owner), {record_id:expected.owner.record_id,fields:Object.fromEntries(protectedFields.map(key=>[key,expected.owner.fields[key]??null]))})) {
      fail("duplicate_relation_repair_conflict", "Release changed before relation repair");
    }
    this.index = null;
    const written = await this.client.updateRecords(this.appToken,this.tableId,[{record_id:target.record_id,fields:{采集记录:[]}}],{tableName:this.tableName});
    validateWriteResult(written,1,this.tableName,[target.record_id]);
    for (let attempt=1;attempt<=MAX_UPDATE_READBACK_ATTEMPTS;attempt++) {
      const afterTarget = await this.readRecordById(target.record_id,{requirePrimary:true});
      const afterOwner = await this.readRecordById(owner.record_id,{requirePrimary:true});
      const unchangedFields = equalValue(snapshot(afterOwner),snapshot(owner)) &&
        equalValue(snapshot({...afterTarget,fields:{...afterTarget.fields,采集记录:target.fields.采集记录}}),snapshot(target));
      if (!unchangedFields)fail("readback_mismatch","Duplicate relation repair changed protected fields");
      if (equalValue(afterTarget.fields.采集记录,[]))return {target:afterTarget,owner:afterOwner,readback:"verified"};
      if (!equalValue(afterTarget.fields.采集记录,target.fields.采集记录) || attempt===MAX_UPDATE_READBACK_ATTEMPTS) {
        fail("readback_mismatch","Duplicate relation repair did not read back exactly");
      }
      await this.sleep(attempt*1000);
    }
  }

  // Authorized system-only blank-fill. Callers must hold the human Base mutation
  // lease and a durable automatic-match journal; no human receipt is fabricated.
  async registerRecognizedPostSafely(releaseId,postId,expectedRelease,expectedCaptureVersion,{signal,expectedDramaRecordId=null,reviewReason=null,recognizedTitle=null,captureRepository}={}) {
    assertNotAborted(signal);
    if(!/^\d+$/.test(postId)||!expectedRelease?.record_id||!captureRepository)fail('caption_input_invalid','Explicit release and capture evidence are required');
    const one=value=>Array.isArray(value)&&value.length===1?value[0]?.id:null;
    const [releases,captures,accounts]=await Promise.all([this.loadIndex({signal}),captureRepository.loadIndex({signal}),this.owner.accounts.loadIndex({signal})]);
    const indexed=releases.get(releaseId),capture=captures.get(postId);
    if(!indexed||indexed.record_id!==expectedRelease.record_id||!capture||captureMatchVersion(capture)!==expectedCaptureVersion)fail('caption_plan_changed','Release or capture changed');
    const protectedFields=[...TABLES['发布记录'].human,...TABLES['发布记录'].shared,'发布ID','采集记录'];
    const snapshot=row=>Object.fromEntries(protectedFields.map(k=>[k,row.fields[k]??null]));
    const before=await this.readRecordById(indexed.record_id,{requirePrimary:true,signal});
    if(!equalValue(snapshot(before),snapshot(expectedRelease)))fail('caption_plan_changed','Human release fields changed');
    const f=before.fields,cf=capture.fields,url=canonicalCapturePostUrl(cf.视频链接);
    const account=[...accounts.values()].find(a=>a.record_id===one(f.账号));
    const identity=url?.match(/^https:\/\/www\.tiktok\.com\/@([^/]+)\/(?:video|photo)\/(\d+)$/);
    if(!account||account.fields.表现形式!=='AI真人剧'||!identity||identity[1]!==account.fields.账号ID||identity[2]!==postId||
       one(cf.账号)!==one(f.账号)||f.归档状态&&f.归档状态!=='active'||
       (f.采集记录?.length&&!(f.采集记录.length===1&&one(f.采集记录)===capture.record_id))||
       f['Post ID']&&f['Post ID']!==postId||f.视频链接&&canonicalCapturePostUrl(f.视频链接)!==url||
       one(f.剧)&&one(f.剧)!==expectedDramaRecordId)fail('caption_identity_conflict','Cannot replace a different post, account, or human drama');
    if((cf.关联发布记录??[]).some(link=>link.id!==before.record_id)||[...releases].some(([id,r])=>id!==releaseId&&
       (r.fields['Post ID']===postId||canonicalCapturePostUrl(r.fields.视频链接)===url||(r.fields.采集记录??[]).some(x=>x.id===capture.record_id))))fail('post_id_claimed','Post has another owner');
    const patch={'Post ID':postId,视频链接:url,采集记录:[{id:capture.record_id}],匹配方式:'exact_post_id',匹配置信度:null};
    if(!one(f.剧)&&expectedDramaRecordId)patch.剧=[{id:expectedDramaRecordId}];
    if(reviewReason==='drama_title_conflict')patch.待处理原因=`Caption剧名与原记录不一致，需负责人核对${recognizedTitle?`：${String(recognizedTitle).slice(0,160)}`:''}`;
    else if(!expectedDramaRecordId)patch.待处理原因='剧名待人工匹配';
    const prepared=this.preparePatch(releaseId,patch,'caption_backfill');await this.validateRelations(prepared.patch,{signal});
    this.index=null;
    const written=await this.client.updateRecords(this.appToken,this.tableId,[{record_id:before.record_id,fields:prepared.patch}],{signal,tableName:this.tableName});
    validateWriteResult(written,1,this.tableName,[before.record_id]);
    const expected={...snapshot(before),...Object.fromEntries(Object.entries(patch).filter(([k])=>protectedFields.includes(k)))};
    for(let attempt=1;attempt<=MAX_UPDATE_READBACK_ATTEMPTS;attempt++){
      const after=await this.readRecordById(before.record_id,{requirePrimary:true,signal});
      if(protectedFields.some(k=>!Object.hasOwn(patch,k)&&!equalValue(after.fields[k]??null,before.fields[k]??null)))fail('caption_plan_changed','Protected release fields changed');
      const mismatches=Object.keys(patch).filter(k=>!equalValue(after.fields[k]??null,patch[k]));
      if(!mismatches.length&&equalValue(snapshot(after),expected))return {record:clone(after),readback:'verified'};
      if(attempt===MAX_UPDATE_READBACK_ATTEMPTS||mismatches.some(k=>!equalValue(after.fields[k]??null,before.fields[k]??null)))fail('readback_mismatch','Recognized caption update is uncertain');
      await this.sleep(attempt*1000,{signal});
    }
  }

  async registerCaptionPostSafely(releaseId, postId, expectedRelease, expectedCaptureVersion, {signal,expectedDramaRecordId,captureRepository} = {}) {
    if(expectedDramaRecordId!==null&&(typeof expectedDramaRecordId!=="string"||!expectedDramaRecordId))fail("caption_backfill_input_invalid","A stable or explicitly blank drama relation is required");
    return this.registerBatchPostSafely(releaseId,postId,expectedRelease,expectedCaptureVersion,
      {signal,matchMethod:"exact_post_id",captionMode:true,expectedDramaRecordId,captureRepository});
  }

  async archiveErroneousCaptionReleaseSafely({releaseId,releaseRecordId,postId,captureRecordId,accountRecordId},{signal}={}){
    assertNotAborted(signal);
    const [releases,captures,accounts]=await Promise.all([this.loadIndex({signal}),this.owner.captures.loadIndex({signal}),this.owner.accounts.loadIndex({signal})]);
    const release=releases.get(releaseId),capture=captures.get(postId);
    const account=[...accounts.values()].find(row=>row.record_id===accountRecordId);
    const one=value=>Array.isArray(value)&&value.length===1?value[0]?.id:null;
    if(!release||release.record_id!==releaseRecordId||!capture||capture.record_id!==captureRecordId||
       !account||account.fields.表现形式==='AI真人剧')fail('caption_repair_conflict','Repair target or non-drama account changed');
    const f=release.fields,cf=capture.fields,url=canonicalCapturePostUrl(cf.视频链接);
    if(f.归档状态!=='active'||f['Post ID']!==postId||canonicalCapturePostUrl(f.视频链接)!==url||
       one(f.采集记录)!==captureRecordId||one(f.账号)!==accountRecordId||one(cf.账号)!==accountRecordId||
       one(f.剧)||f.批次ID||f.备注||f.RS收益||f.处理负责人?.length||f.匹配方式!=='exact_post_id'||
       f.待处理原因!=='剧名待人工匹配'||one(cf.关联发布记录)!==releaseRecordId||
       [...releases].some(([id,row])=>id!==releaseId&&(row.fields['Post ID']===postId||canonicalCapturePostUrl(row.fields.视频链接)===url||
        (row.fields.采集记录??[]).some(link=>link.id===captureRecordId))))fail('caption_repair_conflict','Release is not the exact unmodified mistaken creation');
    const before=await this.readRecordById(releaseRecordId,{requirePrimary:true,signal});
    for(const key of ['发布ID','日期','账号','剧','归档状态','Post ID','视频链接','采集记录','匹配方式','待处理原因','备注','批次ID'])
      if(!equalValue(before.fields[key]??null,f[key]??null))fail('caption_repair_conflict','Release changed before repair');
    const patch={'Post ID':null,视频链接:null,采集记录:[],匹配方式:null,匹配置信度:null,归档状态:'archived',待处理原因:'非短剧账号误建，已解除关联'};
    const prepared=this.preparePatch(releaseId,patch,'caption_backfill');
    this.index=null;
    const written=await this.client.updateRecords(this.appToken,this.tableId,[{record_id:releaseRecordId,fields:prepared.patch}],{signal,tableName:this.tableName});
    validateWriteResult(written,1,this.tableName,[releaseRecordId]);
    let after;
    for(let attempt=1;attempt<=5;attempt++){
      after=await this.readRecordById(releaseRecordId,{requirePrimary:true,signal});
      const cleared=['Post ID','视频链接','匹配方式','匹配置信度'].every(key=>!after.fields[key]);
      const captureAfter=(await this.owner.captures.loadIndex({signal})).get(postId);
      if(cleared&&after.fields.归档状态==='archived'&&after.fields.待处理原因===patch.待处理原因&&
         Array.isArray(after.fields.采集记录)&&after.fields.采集记录.length===0&&
         Array.isArray(captureAfter?.fields.关联发布记录)&&captureAfter.fields.关联发布记录.length===0)return {record:clone(after),capture:clone(captureAfter),readback:'verified'};
      if(attempt===5)fail('readback_mismatch','Archive and reverse unlink were not independently verified');
      await this.sleep(attempt*1000,{signal});
    }
  }

  async registerBatchPostSafely(releaseId, postId, expectedRelease, expectedCaptureVersion, { signal, matchMethod = "batch_title_sequence", captionMode = false, expectedDramaRecordId = null, captureRepository = null } = {}) {
    assertNotAborted(signal);
    if (typeof postId !== "string" || !/^\d+$/.test(postId) || !plainObject(expectedRelease?.fields) ||
        !captionMode&&!expectedRelease.fields.批次ID || !["batch_title_sequence","account_time","exact_post_id"].includes(matchMethod) ||
        captionMode&&(expectedDramaRecordId!==null&&typeof expectedDramaRecordId!=="string"||matchMethod!=="exact_post_id")) fail("batch_auto_input_invalid", "Explicit release and capture identity required");
    const releases = await this.loadIndex({signal});
    const captures = await (captureRepository??this.owner.captures).loadIndex({signal});
    const accounts = await this.owner.accounts.loadIndex({signal});
    const indexed = releases.get(releaseId), capture = captures.get(postId);
    if (!indexed || indexed.record_id !== expectedRelease.record_id || !capture || captureMatchVersion(capture) !== expectedCaptureVersion) fail("batch_auto_stale", "Release or capture identity changed");
    const fields = [...TABLES["发布记录"].human, ...TABLES["发布记录"].shared, "发布ID", "采集记录"];
    const snapshot = record => Object.fromEntries(fields.map(k => [k, record.fields[k] ?? null]));
    const before = await this.readRecordById(indexed.record_id, {requirePrimary:true, signal});
    if (!equalValue(snapshot(before), snapshot(expectedRelease))) fail("batch_auto_stale", "Human fields changed before automatic write");
    const f = before.fields, cf = capture.fields;
    const one = value => Array.isArray(value) && value.length === 1 ? value[0]?.id : null;
    const account = [...accounts.values()].find(a => a.record_id === one(f.账号));
    const url = canonicalCapturePostUrl(cf.视频链接);
    const parsed = url ? new URL(url).pathname.match(/^\/@([^/]+)\/(?:video|photo)\/(\d+)$/) : null;
    if (f.归档状态 !== "active" || (f["Post ID"] && (!captionMode || f["Post ID"] !== postId)) ||
        (f.视频链接 && (!captionMode || canonicalCapturePostUrl(f.视频链接) !== url)) || f.采集记录?.length ||
        captionMode&&one(f.剧)!==expectedDramaRecordId || !account || one(cf.账号) !== one(f.账号) || !parsed || parsed[1] !== account.fields.账号ID || parsed[2] !== postId) fail("batch_auto_identity_conflict", "Automatic match cannot replace input or cross account identity");
    const claimedByOther = [...releases].some(([id,r]) => id !== releaseId && (r.fields["Post ID"] === postId || canonicalCapturePostUrl(r.fields.视频链接)?.match(/\/(?:video|photo)\/(\d+)$/)?.[1] === postId || (r.fields.采集记录 ?? []).some(x=>x.id===capture.record_id)));
    if (claimedByOther || (cf.关联发布记录 ?? []).some(x=>x.id!==before.record_id)) fail("post_id_claimed", "Capture is already occupied");
    const patch = {"Post ID":postId, 视频链接:url, 采集记录:[{id:capture.record_id}], 匹配方式:matchMethod, 匹配置信度:null};
    const prepared = this.preparePatch(releaseId, patch, captionMode?"caption_backfill":"batch_match");
    this.index = null;
    const written = await this.client.updateRecords(this.appToken, this.tableId, [{record_id:before.record_id,fields:prepared.patch}], {signal,tableName:this.tableName});
    validateWriteResult(written, 1, this.tableName, [before.record_id]);
    const expected = {...snapshot(before),...Object.fromEntries(Object.entries(patch).filter(([k])=>fields.includes(k)))};
    let after;
    for(let attempt=1;attempt<=MAX_UPDATE_READBACK_ATTEMPTS;attempt++) {
      assertNotAborted(signal);
      after = await this.readRecordById(before.record_id, {requirePrimary:true,signal});
      const humanChanged = TABLES["发布记录"].human.some(k=>!equalValue(after.fields[k]??null,before.fields[k]??null));
      if(humanChanged) fail("batch_auto_stale", "Human fields changed during automatic write");
      const mismatches = Object.keys(patch).filter(k=>!equalValue(after.fields[k]??null,patch[k]));
      if(!mismatches.length && equalValue(snapshot(after),expected)) return {record:clone(after),readback:"verified"};
      if(attempt===MAX_UPDATE_READBACK_ATTEMPTS || mismatches.some(k=>!equalValue(after.fields[k]??null,before.fields[k]??null))) fail("readback_mismatch", "Automatic batch write has uncertain readback");
      await this.sleep(attempt*1000,{signal});
    }
  }

  async upsertEvidenceSafely(releaseId, patch, expectedMatchInputs, expectedCaptureRecordId, { signal } = {}) {
    assertNotAborted(signal);
    const releaseKey = normalizeKey(releaseId);
    const captureId = normalizeRecordId(expectedCaptureRecordId);
    assertExpectedObject(expectedMatchInputs);
    if (Object.keys(expectedMatchInputs).length !== MATCH_INPUT_FIELDS.length ||
        MATCH_INPUT_FIELDS.some((fieldName) => !Object.hasOwn(expectedMatchInputs, fieldName))) {
      fail("base_response_invalid", "Expected evidence match inputs must contain exactly four fields");
    }
    const prepared = this.preparePatch(releaseKey, patch, "machine");
    if (Object.hasOwn(prepared.patch, "采集记录") || Object.hasOwn(prepared.patch, this.primaryField)) {
      fail("field_owner_violation", "Evidence patch cannot change release identity or relation");
    }
    await this.validateRelations(prepared.patch, { signal });
    if (!this.index) await this.loadIndex({ signal });
    assertNotAborted(signal);
    const indexed = this.index.get(releaseKey);
    if (!indexed) fail("base_record_not_found", "Release record was not found");
    const expectedRelation = [{ id: captureId }];

    const inputsChanged = (record) => MATCH_INPUT_FIELDS.some(
      (fieldName) => !equalValue(fieldValue(record.fields, fieldName), expectedMatchInputs[fieldName]),
    );
    const before = await this.readRecordById(indexed.record_id, {
      requirePrimary: true,
      signal,
      validate: (record) => {
        if (normalizeKey(record.fields[this.primaryField]) !== releaseKey) {
          fail("readback_mismatch", "Release primary key changed before evidence write", { table: this.tableName });
        }
      },
    });
    if (inputsChanged(before) || !equalValue(fieldValue(before.fields, "采集记录"), expectedRelation)) {
      this.index = null;
      concurrentHumanChange("Release match inputs or relation changed before evidence write", "evidence_prewrite");
    }

    if (Object.keys(prepared.patch).length === 0) {
      return { record: clone(before), readback: "verified" };
    }
    this.index = null;
    const written = await this.client.updateRecords(this.appToken, this.tableId, [
      { record_id: before.record_id, fields: clone(prepared.patch) },
    ], { signal, tableName: this.tableName });
    assertNotAborted(signal);
    validateWriteResult(written, 1, this.tableName, [before.record_id]);
    let after;
    for (let attempt = 1; ; attempt += 1) {
      after = await this.readRecordById(before.record_id, { requirePrimary: true, signal });
      if (normalizeKey(after.fields[this.primaryField]) !== releaseKey) fail("readback_mismatch", "Release identity changed during evidence write");
      if (inputsChanged(after) || !equalValue(fieldValue(after.fields, "采集记录"), expectedRelation)) {
        this.index = null;
        concurrentHumanChange("Release match inputs or relation changed during evidence write", "evidence_readback");
      }
      const mismatches = Object.entries(prepared.patch).filter(([field, value]) => !equalValue(fieldValue(after.fields, field), value));
      if (!mismatches.length) break;
      const knownOld = mismatches.every(([field]) => equalValue(fieldValue(after.fields, field), fieldValue(before.fields, field)));
      if (!knownOld || attempt >= MAX_UPDATE_READBACK_ATTEMPTS) assertRequestedFields(after, prepared.patch, this.tableName);
      await this.sleep(attempt * 1_000, { signal });
      assertNotAborted(signal);
    }
    // A concurrent unrelated edit may have happened; force the next caller to reload a complete index.
    this.index = null;
    return { record: clone(after), readback: "verified" };
  }

  async linkCaptureSafely(releaseId, captureRecordId, expectedMatchInputs, { signal } = {}) {
    assertNotAborted(signal);
    const releaseKey = normalizeKey(releaseId);
    const captureId = normalizeRecordId(captureRecordId);
    assertExpectedObject(expectedMatchInputs);
    if (Object.keys(expectedMatchInputs).length === 0 ||
        Object.keys(expectedMatchInputs).some((fieldName) => !MATCH_INPUT_FIELDS.includes(fieldName))) {
      fail("base_response_invalid", "Expected match inputs are missing or contain unsupported fields");
    }

    if (!this.owner.captures.index) await this.owner.captures.loadIndex({ signal });
    assertNotAborted(signal);
    const captureExists = [...this.owner.captures.index.values()].some((record) => record.record_id === captureId);
    if (!captureExists) {
      fail("relation_target_not_found", "Capture relation target was not found in a complete index", {
        table: this.tableName,
        field: "采集记录",
      });
    }

    if (!this.index) await this.loadIndex({ signal });
    assertNotAborted(signal);
    const verifiedIndex = this.index;
    const indexedRelease = this.index.get(releaseKey);
    if (!indexedRelease) fail("base_record_not_found", "Release record was not found");
    const indexedRelation = clone(fieldValue(indexedRelease.fields, "采集记录"));
    const before = await this.readRecordById(indexedRelease.record_id, {
      requirePrimary: true,
      validate: (record) => {
        if (normalizeKey(record.fields[this.primaryField]) !== releaseKey) {
          fail("readback_mismatch", "Release primary key changed before relation write", { table: this.tableName });
        }
      },
      signal,
    });
    const prewriteInputsChanged = Object.entries(expectedMatchInputs).some(
      ([fieldName, expectedValue]) => !equalValue(fieldValue(before.fields, fieldName), expectedValue),
    );
    if (prewriteInputsChanged || !equalValue(fieldValue(before.fields, "采集记录"), indexedRelation)) {
      this.index = null;
      concurrentHumanChange("Release match inputs or relation changed before relation write", "relation_prewrite");
    }
    const matchSnapshot = Object.fromEntries(
      MATCH_INPUT_FIELDS.map((fieldName) => [fieldName, clone(fieldValue(before.fields, fieldName))]),
    );
    const relation = [{ id: captureId }];
    assertPatchAllowed(this.tableName, { 采集记录: relation }, "machine");
    await this.validateRelations({ 采集记录: relation }, { signal });
    assertNotAborted(signal);
    this.index = null;
    const written = await this.client.updateRecords(this.appToken, this.tableId, [
      { record_id: before.record_id, fields: { 采集记录: clone(relation) } },
    ], { signal, tableName: this.tableName });
    assertNotAborted(signal);
    validateWriteResult(written, 1, this.tableName, [before.record_id]);

    const after = await this.readRecordById(before.record_id, {
      requirePrimary: true,
      signal,
    });
    const matchChanged = MATCH_INPUT_FIELDS.some(
      (fieldName) => !equalValue(fieldValue(after.fields, fieldName), matchSnapshot[fieldName]),
    );
    if (matchChanged || !equalValue(fieldValue(after.fields, "采集记录"), relation)) {
      this.index = null;
      concurrentHumanChange("Release match inputs or relation changed during relation write", "relation_readback");
    }
    verifiedIndex.set(releaseKey, after);
    this.index = verifiedIndex;
    return { record: clone(after), readback: "verified" };
  }
}

export class BaseRepositories {
  constructor({ client, appToken, tableIds, sleep = defaultSleep, writableOnly = false } = {}) {
    const clientMethods = ["listRecords", "createRecords", "updateRecords", "getRecord"];
    const tableIdKeys = Object.keys(TABLE_BINDINGS);
    const validClient = plainObject(client) && clientMethods.every((method) => typeof client[method] === "function");
    const validApp = typeof appToken === "string" && appToken.length > 0 && appToken.trim() === appToken;
    const validTableIds = plainObject(tableIds) && tableIdKeys.every((key) =>
      typeof tableIds[key] === "string" && tableIds[key].length > 0 && tableIds[key].trim() === tableIds[key]
    );
    const uniqueTableIds = validTableIds && new Set(tableIdKeys.map((key) => tableIds[key])).size === tableIdKeys.length;
    if (!validClient || !validApp || !validTableIds || !uniqueTableIds) {
      fail("base_repository_config_invalid", "Base repository configuration is invalid");
    }
    this.client = client;
    this.appToken = appToken;
    this.accounts = new TableRepository({ owner: this, client, appToken, tableId: tableIds.accounts, tableName: TABLE_BINDINGS.accounts, sleep, writableOnly });
    this.dramas = new TableRepository({ owner: this, client, appToken, tableId: tableIds.dramas, tableName: TABLE_BINDINGS.dramas, sleep, writableOnly });
    this.captures = new TableRepository({ owner: this, client, appToken, tableId: tableIds.captures, tableName: TABLE_BINDINGS.captures, sleep, writableOnly });
    this.releases = new ReleaseRepository({ owner: this, client, appToken, tableId: tableIds.releases, tableName: TABLE_BINDINGS.releases, sleep, writableOnly });
  }

  repositoryForTable(tableName) {
    const binding = Object.entries(TABLE_BINDINGS).find(([, name]) => name === tableName)?.[0];
    if (!binding || !this[binding]) fail("base_schema_drift", "Relation target table is not configured");
    return this[binding];
  }
}
