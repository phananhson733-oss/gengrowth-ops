import { isDeepStrictEqual } from "node:util";

import { ShortDramaError } from "./errors.mjs";
import { assertPatchAllowed, BASE_FIELD_SPECS, TABLES, fieldOwner } from "./schema.mjs";

const TABLE_BINDINGS = Object.freeze({
  accounts: "账号台账",
  dramas: "选剧池",
  captures: "采集数据",
  releases: "发布记录",
});
const MATCH_INPUT_FIELDS = Object.freeze(["Post ID", "视频链接", "账号", "日期"]);

function fail(code, message, details = {}) {
  throw new ShortDramaError(code, message, details);
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
    return normalizeRecordId(record.record_id);
  });
  if (new Set(ids).size !== ids.length) {
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
  constructor({ owner, client, appToken, tableId, tableName }) {
    this.owner = owner;
    this.client = client;
    this.appToken = appToken;
    this.tableId = tableId;
    this.tableName = tableName;
    this.primaryField = TABLES[tableName].primaryField;
    this.linkTargets = tableLinkTargets(tableName);
    this.index = null;
  }

  async loadIndex() {
    this.index = null;
    const result = await this.client.listRecords(this.appToken, this.tableId);
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

  async readRecordById(recordId, { requirePrimary = false, validate = null } = {}) {
    const normalizedId = normalizeRecordId(recordId);
    try {
      const rawRecord = await this.client.getRecord(this.appToken, this.tableId, normalizedId);
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

  async getByKey(key) {
    const normalizedKey = normalizeKey(key);
    if (!this.index) await this.loadIndex();
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
    return { key: normalizedKey, patch: fields };
  }

  async validateRelations(patch) {
    for (const [fieldName, targetTable] of this.linkTargets) {
      if (!Object.hasOwn(patch, fieldName)) continue;
      const relation = patch[fieldName];
      if (!exactRelation(relation)) {
        fail("relation_value_invalid", "Relation field must be a unique Base v3 record-ID array", {
          table: this.tableName,
          field: fieldName,
        });
      }
      const targetRepository = this.owner.repositoryForTable(targetTable);
      if (!targetRepository.index) await targetRepository.loadIndex();
      const knownIds = new Set([...targetRepository.index.values()].map((record) => record.record_id));
      if (relation.some((cell) => !knownIds.has(cell.id))) {
        fail("relation_target_not_found", "Relation target was not found in a complete index", {
          table: this.tableName,
          field: fieldName,
        });
      }
    }
  }

  async upsertByKey(key, patch, actorKind) {
    const prepared = this.preparePatch(key, patch, actorKind);
    await this.validateRelations(prepared.patch);
    if (!this.index) await this.loadIndex();
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
        });
        this.index.set(prepared.key, checked);
        return { record: clone(checked), readback: "verified" };
      }
      this.index = null;
      written = await this.client.updateRecords(this.appToken, this.tableId, [
        { record_id: existing.record_id, fields: clone(writeFields) },
      ]);
      validateWriteResult(written, 1, this.tableName, [existing.record_id]);
    } else {
      assertPatchAllowed(this.tableName, { [this.primaryField]: prepared.key }, "migration");
      writeFields = { ...prepared.patch, [this.primaryField]: prepared.key };
      this.index = null;
      written = await this.client.createRecords(this.appToken, this.tableId, [{ fields: clone(writeFields) }]);
      validateWriteResult(written, 1, this.tableName);
    }
    const recordId = written[0].record_id;
    const readback = await this.readRecordById(recordId, {
      requirePrimary: true,
      validate: (record) => {
        if (normalizeKey(record.fields[this.primaryField]) !== prepared.key) {
          fail("readback_mismatch", "Base readback primary key changed", { table: this.tableName });
        }
        assertRequestedFields(record, writeFields, this.tableName);
      },
    });
    verifiedIndex.set(prepared.key, readback);
    this.index = verifiedIndex;
    return { record: clone(readback), readback: "verified" };
  }

  async syncManyByKey(entries, actorKind) {
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
    for (const item of prepared) await this.validateRelations(item.patch);

    await this.loadIndex();
    const creates = [];
    const updates = [];
    const expectations = new Map();
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
      updates.push({ record_id: existing.record_id, fields: clone(changedFields) });
      expectations.set(item.key, clone(item.patch));
    }

    if (creates.length > 0 || updates.length > 0) this.index = null;
    if (creates.length > 0) {
      const result = await this.client.createRecords(this.appToken, this.tableId, creates);
      validateWriteResult(result, creates.length, this.tableName);
    }
    if (updates.length > 0) {
      const result = await this.client.updateRecords(this.appToken, this.tableId, updates);
      validateWriteResult(result, updates.length, this.tableName, updates.map((record) => record.record_id));
    }

    try {
      await this.loadIndex();
      for (const [changedKey, expected] of expectations) {
        const readback = this.index.get(changedKey);
        if (!readback) fail("readback_mismatch", "Changed Base record is missing after bulk sync", { table: this.tableName });
        assertRequestedFields(readback, expected, this.tableName);
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

  syncManyMachine(entries) {
    return this.syncManyByKey(entries, "machine");
  }

  async machineUpsertWithInvariant(key, patch) {
    const prepared = this.preparePatch(key, patch, "machine");
    await this.validateRelations(prepared.patch);
    if (!this.index) await this.loadIndex();
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
      ]);
      validateWriteResult(written, 1, this.tableName, [before.record_id]);
    } else {
      assertPatchAllowed(this.tableName, { [this.primaryField]: prepared.key }, "migration");
      expected = { ...prepared.patch, [this.primaryField]: prepared.key };
      this.index = null;
      written = await this.client.createRecords(this.appToken, this.tableId, [{ fields: clone(expected) }]);
      validateWriteResult(written, 1, this.tableName);
    }

    const after = await this.readRecordById(written[0].record_id, {
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
    });
    verifiedIndex.set(prepared.key, after);
    this.index = verifiedIndex;
    return { record: clone(after), readback: "verified" };
  }

  async verify(recordId, expected) {
    const normalizedId = normalizeRecordId(recordId);
    assertExpectedObject(expected);
    const record = await this.readRecordById(normalizedId, {
      validate: (readback) => assertRequestedFields(readback, expected, this.tableName),
    });
    return { record: clone(record), readback: "verified" };
  }
}

class ReleaseRepository extends TableRepository {
  async linkCaptureSafely(releaseId, captureRecordId, expectedMatchInputs) {
    const releaseKey = normalizeKey(releaseId);
    const captureId = normalizeRecordId(captureRecordId);
    assertExpectedObject(expectedMatchInputs);
    if (Object.keys(expectedMatchInputs).length === 0 ||
        Object.keys(expectedMatchInputs).some((fieldName) => !MATCH_INPUT_FIELDS.includes(fieldName))) {
      fail("base_response_invalid", "Expected match inputs are missing or contain unsupported fields");
    }

    if (!this.owner.captures.index) await this.owner.captures.loadIndex();
    const captureExists = [...this.owner.captures.index.values()].some((record) => record.record_id === captureId);
    if (!captureExists) {
      fail("relation_target_not_found", "Capture relation target was not found in a complete index", {
        table: this.tableName,
        field: "采集记录",
      });
    }

    if (!this.index) await this.loadIndex();
    const verifiedIndex = this.index;
    const indexedRelease = this.index.get(releaseKey);
    if (!indexedRelease) fail("base_record_not_found", "Release record was not found");
    const before = await this.readRecordById(indexedRelease.record_id, {
      requirePrimary: true,
      validate: (record) => {
        if (normalizeKey(record.fields[this.primaryField]) !== releaseKey) {
          fail("readback_mismatch", "Release primary key changed before relation write", { table: this.tableName });
        }
        for (const [fieldName, expectedValue] of Object.entries(expectedMatchInputs)) {
          if (!equalValue(fieldValue(record.fields, fieldName), expectedValue)) {
            fail("match_inputs_changed", "Release match inputs changed before relation write", { field: fieldName });
          }
        }
      },
    });
    const matchSnapshot = Object.fromEntries(
      MATCH_INPUT_FIELDS.map((fieldName) => [fieldName, clone(fieldValue(before.fields, fieldName))]),
    );
    const relation = [{ id: captureId }];
    assertPatchAllowed(this.tableName, { 采集记录: relation }, "machine");
    await this.validateRelations({ 采集记录: relation });
    this.index = null;
    const written = await this.client.updateRecords(this.appToken, this.tableId, [
      { record_id: before.record_id, fields: { 采集记录: clone(relation) } },
    ]);
    validateWriteResult(written, 1, this.tableName, [before.record_id]);

    let matchChanged = false;
    const after = await this.readRecordById(before.record_id, {
      requirePrimary: true,
      validate: (record) => {
        matchChanged = MATCH_INPUT_FIELDS.some(
          (fieldName) => !equalValue(fieldValue(record.fields, fieldName), matchSnapshot[fieldName]),
        );
        if (!matchChanged && !equalValue(fieldValue(record.fields, "采集记录"), relation)) {
          fail("readback_mismatch", "Capture relation readback did not match the write", { table: this.tableName });
        }
      },
    });
    if (matchChanged) {
      if (equalValue(fieldValue(after.fields, "采集记录"), relation)) {
        assertPatchAllowed(this.tableName, { 采集记录: [] }, "machine");
        const cleared = await this.client.updateRecords(this.appToken, this.tableId, [
          { record_id: before.record_id, fields: { 采集记录: [] } },
        ]);
        validateWriteResult(cleared, 1, this.tableName, [before.record_id]);
        await this.readRecordById(before.record_id, {
          requirePrimary: true,
          validate: (record) => {
            if (!equalValue(fieldValue(record.fields, "采集记录"), [])) {
              fail("readback_mismatch", "Concurrent relation cleanup was not verified", { table: this.tableName });
            }
          },
        });
      }
      fail("concurrent_human_change", "Release match inputs changed during relation write");
    }
    verifiedIndex.set(releaseKey, after);
    this.index = verifiedIndex;
    return { record: clone(after), readback: "verified" };
  }
}

export class BaseRepositories {
  constructor({ client, appToken, tableIds } = {}) {
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
    this.accounts = new TableRepository({ owner: this, client, appToken, tableId: tableIds.accounts, tableName: TABLE_BINDINGS.accounts });
    this.dramas = new TableRepository({ owner: this, client, appToken, tableId: tableIds.dramas, tableName: TABLE_BINDINGS.dramas });
    this.captures = new TableRepository({ owner: this, client, appToken, tableId: tableIds.captures, tableName: TABLE_BINDINGS.captures });
    this.releases = new ReleaseRepository({ owner: this, client, appToken, tableId: tableIds.releases, tableName: TABLE_BINDINGS.releases });
  }

  repositoryForTable(tableName) {
    const binding = Object.entries(TABLE_BINDINGS).find(([, name]) => name === tableName)?.[0];
    if (!binding || !this[binding]) fail("base_schema_drift", "Relation target table is not configured");
    return this[binding];
  }
}
