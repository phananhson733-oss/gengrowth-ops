import { createHash, randomUUID } from "node:crypto";
import { isDeepStrictEqual } from "node:util";

import { ShortDramaError } from "./errors.mjs";
import { BASE_FIELD_SPECS, TABLES, fieldOwner } from "./schema.mjs";
import { parseQualifiedInstantMs } from "./qualified-iso.mjs";

const TABLE_REPOSITORIES = Object.freeze({
  "账号台账": "accounts",
  "选剧池": "dramas",
  "采集数据": "captures",
  "发布记录": "releases",
});
const QUERY_KEYS = new Set(["actorId", "table", "filter", "sort"]);
const METRIC_KEYS = new Set(["actorId", "groupBy"]);
const SINGLE_KEYS = new Set(["actorId", "chatId", "table", "key", "field", "value"]);
const PREVIEW_KEYS = new Set(["actorId", "chatId", "action", "table", "key", "patch", "items"]);
const APPLY_KEYS = new Set(["actorId", "chatId", "receiptId"]);
const ARCHIVE_KEYS = new Set(["actorId", "chatId", "table", "key"]);
const METRICS = Object.freeze(["播放量", "点赞", "收藏", "转发", "评论", "RS收益"]);
const RECEIPT_VERSION = 1;
const RECEIPT_ID_PATTERN = /^sdp_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MUTATION_LEASE_SECONDS = 300;
const MUTATION_HEARTBEAT_MILLISECONDS = 1_000;
const UNSAFE_KEYS = new Set(["__proto__", "prototype", "constructor"]);
const APPLY_QUEUES = new Map();

function fail(code, message, details = {}) {
  throw new ShortDramaError(code, message, details);
}

function plainObject(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function requiredString(value, field, code = "human_ops_input_invalid") {
  if (typeof value !== "string" || value.length === 0 || value.trim() !== value) {
    fail(code, "Value must be a normalized non-empty string", { field });
  }
  return value;
}

function receiptString(value) {
  const receiptId = requiredString(value, "receiptId", "receipt_id_invalid");
  if (!RECEIPT_ID_PATTERN.test(receiptId)) {
    fail("receipt_id_invalid", "Receipt ID must be sdp_ followed by a randomUUID v4");
  }
  return receiptId;
}

function exactKeys(value, allowed, code) {
  if (!plainObject(value) || Object.keys(value).some((key) => !allowed.has(key))) {
    fail(code, "Request shape is invalid");
  }
}

function safeValue(value, path = "value", seen = new WeakSet()) {
  if (value === null || typeof value === "string" || typeof value === "boolean") return;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) fail("mutation_value_invalid", "Mutation value must be finite", { path });
    return;
  }
  if (Array.isArray(value)) {
    if (seen.has(value) || Object.keys(value).length !== value.length) {
      fail("mutation_value_invalid", "Mutation value must be acyclic JSON", { path });
    }
    seen.add(value);
    value.forEach((item, index) => safeValue(item, `${path}[${index}]`, seen));
    seen.delete(value);
    return;
  }
  if (!plainObject(value)) fail("mutation_value_invalid", "Mutation value must be JSON-safe", { path });
  if (seen.has(value)) fail("mutation_value_invalid", "Mutation value must be acyclic JSON", { path });
  const descriptors = Object.getOwnPropertyDescriptors(value);
  if (Reflect.ownKeys(value).some((key) => typeof key !== "string") ||
      Object.values(descriptors).some((descriptor) => descriptor.get || descriptor.set || !descriptor.enumerable)) {
    fail("mutation_value_invalid", "Mutation value must contain plain data properties", { path });
  }
  seen.add(value);
  for (const [key, descriptor] of Object.entries(descriptors)) {
    if (UNSAFE_KEYS.has(key)) fail("mutation_value_invalid", "Mutation value contains an unsafe key", { path });
    safeValue(descriptor.value, `${path}.${key}`, seen);
  }
  seen.delete(value);
}

function clone(value) {
  safeValue(value);
  return structuredClone(value);
}

function stableJson(value) {
  safeValue(value);
  if (value === null) return "null";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
}

function canonicalHash(value) {
  return createHash("sha256").update(stableJson(value)).digest("hex");
}

function baseBinding(repos) {
  const coordinates = {};
  const appTokens = new Set();
  for (const [binding, table] of Object.entries(TABLE_REPOSITORIES)) {
    const repository = repos?.[table];
    if (!repository || repository.tableName !== binding ||
        typeof repository.appToken !== "string" || repository.appToken.length === 0 || repository.appToken.trim() !== repository.appToken ||
        typeof repository.tableId !== "string" || repository.tableId.length === 0 || repository.tableId.trim() !== repository.tableId) {
      return null;
    }
    appTokens.add(repository.appToken);
    coordinates[table] = repository.tableId;
  }
  if (appTokens.size !== 1 || new Set(Object.values(coordinates)).size !== Object.keys(TABLE_REPOSITORIES).length) return null;
  const appToken = [...appTokens][0];
  if (repos.appToken !== undefined && repos.appToken !== appToken) return null;
  return canonicalHash({ appToken, tables: coordinates });
}

function equal(left, right) {
  return isDeepStrictEqual(left, right);
}

function mutationLeaseLoss(error) {
  const code = ["mutation_lease_mismatch", "mutation_lease_lost"].includes(error?.code)
    ? error.code
    : "mutation_lease_lost";
  if (error instanceof ShortDramaError && error.code === code) return error;
  return new ShortDramaError(code, "Human Base mutation lease ownership was lost", {
    cause_code: typeof error?.code === "string" ? error.code : "internal_error",
  });
}

function cellState(fields, field) {
  return Object.hasOwn(fields, field)
    ? { present: true, value: clone(fields[field]) }
    : { present: false };
}

function changedRecord(recordId, fields, patch, readbackFields) {
  const changed = Object.keys(patch)
    .filter((field) => !equal(cellState(fields, field), { present: true, value: patch[field] }))
    .sort();
  if (changed.length === 0) return null;
  return {
    record_id: recordId,
    fields: Object.fromEntries(changed.map((field) => [field, {
      before: cellState(fields, field),
      after: { present: true, value: clone(patch[field]) },
      readback: cellState(readbackFields, field),
    }])),
  };
}

function compareCell(left, right) {
  if (equal(left, right)) return 0;
  if (typeof left === "number" && Number.isFinite(left) && typeof right === "number" && Number.isFinite(right)) {
    return left < right ? -1 : 1;
  }
  const rank = (value) => {
    if (value === undefined) return 0;
    if (value === null) return 1;
    if (typeof value === "boolean") return 2;
    if (typeof value === "number") return 3;
    if (typeof value === "string") return 4;
    if (Array.isArray(value)) return 5;
    return 6;
  };
  const rankDifference = rank(left) - rank(right);
  if (rankDifference !== 0) return rankDifference;
  if (typeof left === "boolean") return left ? 1 : -1;
  if (typeof left === "string") return left.localeCompare(right);
  return stableJson(left).localeCompare(stableJson(right));
}

async function serializeBaseApply(binding, operation) {
  const predecessor = APPLY_QUEUES.get(binding) ?? Promise.resolve();
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  const wait = predecessor.catch(() => {});
  const tail = wait.then(() => gate);
  APPLY_QUEUES.set(binding, tail);
  await wait;
  try {
    return await operation();
  } finally {
    release();
    if (APPLY_QUEUES.get(binding) === tail) APPLY_QUEUES.delete(binding);
  }
}

function normalizedSet(value) {
  if (!(value instanceof Set)) return null;
  const result = new Set();
  for (const item of value) {
    if (typeof item !== "string" || item.length === 0 || item.trim() !== item) return null;
    result.add(item);
  }
  return result;
}

function tableRepository(repos, table) {
  const binding = TABLE_REPOSITORIES[table];
  if (!binding) fail("table_not_allowed", "Unknown table", { table });
  return repos[binding];
}

function fieldSpec(table, field) {
  fieldOwner(table, field);
  return BASE_FIELD_SPECS[table].find((spec) => spec.name === field);
}

function exactCalendarDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function normalizeFieldValue(table, field, value, { internalRelation = false } = {}) {
  safeValue(value, field);
  const spec = fieldSpec(table, field);
  if (spec.kind === "link") {
    if (!internalRelation || !Array.isArray(value) || value.length !== 1 || !plainObject(value[0]) ||
        Object.keys(value[0]).length !== 1 || typeof value[0].id !== "string" ||
        value[0].id.length === 0 || value[0].id.trim() !== value[0].id) {
      fail("relation_value_invalid", "Relation must be resolved internally to one record", { table, field });
    }
    return value;
  }
  if (value === null) return value;
  if (spec.kind === "number") {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      fail("mutation_value_invalid", "Numeric field requires a finite number", { table, field });
    }
    return value;
  }
  if (spec.kind === "multi_select") {
    if (!Array.isArray(value) || value.some((item) => typeof item !== "string" || item.length === 0 || item.trim() !== item) ||
        new Set(value).size !== value.length) {
      fail("mutation_value_invalid", "Multi-select field requires unique normalized strings", { table, field });
    }
    return value;
  }
  if (["text", "url", "date", "datetime", "single_select"].includes(spec.kind)) {
    if (typeof value !== "string" || value.trim() !== value || value.length > 10_000) {
      fail("mutation_value_invalid", "Field requires a normalized bounded string", { table, field });
    }
    if (spec.kind === "url") {
      let parsed;
      try { parsed = new URL(value); } catch { fail("mutation_value_invalid", "URL field is invalid", { table, field }); }
      if (parsed.protocol !== "https:") fail("mutation_value_invalid", "URL field must use HTTPS", { table, field });
    }
    if (spec.kind === "date" && !exactCalendarDate(value)) {
      fail("mutation_value_invalid", "Date field requires an exact calendar YYYY-MM-DD", { table, field });
    }
    if (spec.kind === "datetime") {
      if (exactCalendarDate(value)) return value;
      const milliseconds = parseQualifiedInstantMs(value);
      if (milliseconds === null) {
        fail("mutation_value_invalid", "Datetime field requires a date or timezone-qualified ISO instant", { table, field });
      }
      return new Date(milliseconds).toISOString();
    }
    return value;
  }
  fail("field_not_allowed", "Field is not writable", { table, field });
}

function validateFieldValue(table, field, value, options) {
  normalizeFieldValue(table, field, value, options);
}

function assertHumanField(table, field, { allowRelation = true } = {}) {
  const owner = fieldOwner(table, field);
  if (!["human", "shared"].includes(owner)) {
    fail("field_owner_violation", "Human operation cannot write this field", { table, field, owner });
  }
  if (field === TABLES[table].primaryField) {
    fail("field_owner_violation", "Primary fields are repository-managed", { table, field });
  }
  if (!allowRelation && fieldSpec(table, field).kind === "link") {
    fail("field_owner_violation", "Single-field relation changes require preview", { table, field });
  }
}

function assertProtectedAction(action, table, patch, { stored = false, caller = false } = {}) {
  const code = stored ? "preview_payload_invalid" : "field_action_violation";
  const reject = (message, field) => fail(code, message, { action, table, field });
  const hasArchive = Object.hasOwn(patch, "归档状态");
  const hasPostId = Object.hasOwn(patch, "Post ID");
  const hasVideo = Object.hasOwn(patch, "视频链接");

  if (hasArchive) {
    const internalCreateDefault = !caller && action === "create" && ["选剧池", "发布记录"].includes(table) && patch.归档状态 === "active";
    const fixedArchive = action === "archive" && patch.归档状态 === "archived";
    const fixedBatchArchive = action === "batch_update" && Object.keys(patch).length === 1 && patch.归档状态 === "archived";
    if (!internalCreateDefault && !fixedArchive && !fixedBatchArchive) reject("Archive state is reserved for fixed create/archive flows", "归档状态");
  }
  if (!caller && action === "create" && ["选剧池", "发布记录"].includes(table) && patch.归档状态 !== "active") {
    reject("Create must carry the service-owned active archive state", "归档状态");
  }
  if (action === "archive" && (!hasArchive || Object.keys(patch).length !== 1 || patch.归档状态 !== "archived")) {
    reject("Archive flow accepts only the fixed archived state", "归档状态");
  }

  if (table === "发布记录" && (hasPostId || hasVideo)) {
    if (action !== "attach-post" || !hasPostId || !hasVideo || Object.keys(patch).length !== 2) {
      reject("Post ID and video URL are reserved for exact paired attach-post", hasPostId ? "Post ID" : "视频链接");
    }
  }
  if (action === "attach-post" && (table !== "发布记录" || !hasPostId || !hasVideo || Object.keys(patch).length !== 2)) {
    reject("attach-post requires exactly Post ID and video URL on a release", "Post ID");
  }
}

function projectedRecord(table, record) {
  if (!record || !plainObject(record.fields)) fail("base_response_invalid", "Repository record is malformed", { table });
  const names = [TABLES[table].primaryField, ...TABLES[table].human, ...TABLES[table].shared];
  return {
    record_id: requiredString(record.record_id, "record_id", "base_response_invalid"),
    fields: Object.fromEntries(names.map((name) => [name, Object.hasOwn(record.fields, name)
      ? { present: true, value: clone(record.fields[name]) }
      : { present: false }])),
  };
}

function absenceSnapshot(table, key) {
  return { table, key, exists: false };
}

function recordSnapshot(table, key, record) {
  return { table, key, exists: true, record: projectedRecord(table, record) };
}

function mutationResult({ status = "success", actor, recordId, changedFields, readback = "verified", nextStep = "none" }) {
  return clone({
    status,
    actor,
    record_id: recordId,
    changed_fields: [...changedFields].sort((left, right) => left.record_id.localeCompare(right.record_id)),
    readback,
    next_step: nextStep,
  });
}

function normalizeLookupStable(value) {
  if (typeof value === "string" && value.length > 0 && value.trim() === value) return value;
  if (Array.isArray(value) && value.length === 1 && typeof value[0] === "string" && value[0].length > 0 && value[0].trim() === value[0]) {
    return value[0];
  }
  return null;
}

function parseTikTokPost(url) {
  let parsed;
  try { parsed = new URL(url); } catch { fail("post_url_invalid", "TikTok post URL is invalid"); }
  if (parsed.protocol !== "https:" || !["tiktok.com", "www.tiktok.com"].includes(parsed.hostname.toLowerCase()) ||
      parsed.search || parsed.hash) fail("post_url_invalid", "TikTok post URL must be canonical");
  const match = /^\/@([A-Za-z0-9._]+)\/(?:video|photo)\/(\d+)$/.exec(parsed.pathname);
  if (!match) fail("post_url_invalid", "TikTok post URL path is invalid");
  return { handle: match[1], postId: match[2] };
}

export class HumanOpsService {
  #repos;
  #jobs;
  #operators;
  #privileged;
  #now;
  #makeReceiptId;
  #allocateDramaId;
  #allocateReleaseId;
  #baseBinding;

  constructor({ repos, jobs, operators, privileged, now, makeReceiptId, allocateDramaId, allocateReleaseId } = {}) {
    const requiredRepos = Object.values(TABLE_REPOSITORIES);
    const repositoriesValid = repos && typeof repos === "object" && requiredRepos.every((name) => {
      const repository = repos[name];
      return repository && ["loadIndex", "getByKey", "upsertByKey"].every((method) => typeof repository[method] === "function");
    });
    const jobsValid = jobs && [
      "createPreview", "getPreview", "consumePreview", "appendAudit",
      "acquireMutationLease", "renewMutationLease", "releaseMutationLease",
    ].every((method) => typeof jobs[method] === "function");
    const normalizedOperators = normalizedSet(operators);
    const normalizedPrivileged = normalizedSet(privileged);
    const binding = repositoriesValid ? baseBinding(repos) : null;
    if (!repositoriesValid || !jobsValid || !normalizedOperators || !normalizedPrivileged ||
        !binding || ![now, makeReceiptId, allocateDramaId, allocateReleaseId].every((fn) => typeof fn === "function")) {
      fail("human_ops_config_invalid", "Human operations configuration is invalid");
    }
    this.#repos = repos;
    this.#jobs = jobs;
    this.#operators = normalizedOperators;
    this.#privileged = normalizedPrivileged;
    this.#now = now;
    this.#makeReceiptId = makeReceiptId;
    this.#allocateDramaId = allocateDramaId;
    this.#allocateReleaseId = allocateReleaseId;
    this.#baseBinding = binding;
  }

  #actor(value) {
    return requiredString(value, "actorId");
  }

  #chat(value) {
    return requiredString(value, "chatId");
  }

  #assertWriter(actor) {
    if (!this.#operators.has(actor) && !this.#privileged.has(actor)) {
      fail("actor_write_denied", "Actor is not allowed to write", { actor });
    }
  }

  #assertPrivileged(actor) {
    if (!this.#privileged.has(actor)) fail("privileged_required", "Action requires a privileged actor", { actor });
  }

  async #withMutationLock(operation) {
    return serializeBaseApply(this.#baseBinding, async () => {
      const lockKey = `human-base:${this.#baseBinding}`;
      const ownerId = `human-${randomUUID()}`;
      const acquired = this.#jobs.acquireMutationLease({
        lockKey,
        ownerId,
        now: this.#now(),
        leaseSeconds: MUTATION_LEASE_SECONDS,
      });
      if (!acquired) fail("mutation_busy", "Another process holds the human Base mutation lease");
      const renew = () => this.#jobs.renewMutationLease({
        lockKey,
        ownerId,
        now: this.#now(),
        leaseSeconds: MUTATION_LEASE_SECONDS,
      });
      try {
        return await operation(renew);
      } finally {
        this.#jobs.releaseMutationLease({ lockKey, ownerId });
      }
    });
  }

  async #leasedStep(renew, operation) {
    // A remote write cannot be rolled back if ownership is lost mid-flight.
    // Heartbeat loss is surfaced before any later receipt/write/audit step or success result.
    const performRenew = async () => {
      try {
        return await renew();
      } catch (error) {
        throw mutationLeaseLoss(error);
      }
    };
    await performRenew();
    let heartbeatError = null;
    let heartbeatPromise = null;
    const heartbeat = () => {
      if (heartbeatPromise || heartbeatError) return;
      const active = performRenew()
        .catch((error) => { heartbeatError ??= error; })
        .finally(() => {
          if (heartbeatPromise === active) heartbeatPromise = null;
        });
      heartbeatPromise = active;
    };
    const timer = setInterval(heartbeat, MUTATION_HEARTBEAT_MILLISECONDS);
    timer.unref?.();
    let result;
    let operationError = null;
    try {
      result = await operation();
    } catch (error) {
      operationError = error;
    } finally {
      clearInterval(timer);
      const active = heartbeatPromise;
      if (active) await active;
    }
    if (heartbeatError) throw heartbeatError;
    if (operationError) throw operationError;
    await performRenew();
    return result;
  }

  async #index(table) {
    const index = await tableRepository(this.#repos, table).loadIndex();
    if (!(index instanceof Map)) fail("base_response_invalid", "Repository index is invalid", { table });
    return index;
  }

  async #resolve(table, selector) {
    const key = requiredString(selector, "key");
    const index = await this.#index(table);
    if (index.has(key)) return { key, record: clone(index.get(key)) };
    let nameField = null;
    if (table === "账号台账") nameField = "账号名";
    if (table === "选剧池") nameField = "剧名";
    if (!nameField) fail("business_record_not_found", "Business record was not found", { table, key });
    const candidates = [...index]
      .filter(([, record]) => record.fields?.[nameField] === key)
      .map(([candidate]) => candidate)
      .sort();
    if (candidates.length === 0) fail("business_record_not_found", "Business record was not found", { table, key });
    if (candidates.length > 1) fail("ambiguous_business_key", "Business key is ambiguous", { table, key, candidates });
    return { key: candidates[0], record: clone(index.get(candidates[0])) };
  }

  async #resolveRelation(table, selector) {
    const resolved = await this.#resolve(table, selector);
    return { key: resolved.key, relation: [{ id: requiredString(resolved.record.record_id, "record_id", "base_response_invalid") }] };
  }

  async #normalizePatch(table, patch, { create = false, internal = false } = {}) {
    if (!plainObject(patch) || Object.keys(patch).length === 0 || Object.keys(patch).some((key) => UNSAFE_KEYS.has(key))) {
      fail("mutation_shape_invalid", "Mutation patch must be a non-empty plain object");
    }
    const result = {};
    for (const [field, rawValue] of Object.entries(patch)) {
      assertHumanField(table, field);
      let value = clone(rawValue);
      const spec = fieldSpec(table, field);
      if (spec.kind === "link" && !internal) {
        if (typeof value !== "string") fail("relation_value_invalid", "Relation input must be a stable ID or unique name", { table, field });
        const target = field === "账号" ? "账号台账" : field === "剧" ? "选剧池" : null;
        if (!target) fail("field_owner_violation", "Relation is not human-writable", { table, field });
        value = (await this.#resolveRelation(target, value)).relation;
      }
      value = normalizeFieldValue(table, field, value, { internalRelation: internal || spec.kind === "link" });
      if (spec.kind === "link" && internal) {
        const target = field === "账号" ? "账号台账" : field === "剧" ? "选剧池" : null;
        if (!target) fail("field_owner_violation", "Relation is not human-writable", { table, field });
        const targetIndex = await this.#index(target);
        if (![...targetIndex.values()].some((record) => record.record_id === value[0].id)) {
          fail("relation_target_not_found", "Resolved relation target no longer exists", { table, field });
        }
      }
      result[field] = value;
    }
    if (Object.hasOwn(result, "归档状态") && !["active", "archived"].includes(result.归档状态)) {
      fail("mutation_value_invalid", "Archive state must be active or archived");
    }
    if (create && table === "选剧池" && (typeof result.剧名 !== "string" || result.剧名.length === 0)) {
      fail("mutation_shape_invalid", "Drama create requires 剧名");
    }
    if (create && table === "发布记录") {
      for (const field of ["日期", "账号", "剧"]) {
        if (!Object.hasOwn(result, field)) fail("mutation_shape_invalid", "Release create is missing a required field", { field });
      }
    }
    return result;
  }

  async query(request) {
    exactKeys(request, QUERY_KEYS, "query_shape_invalid");
    const actor = this.#actor(request.actorId);
    const table = requiredString(request.table, "table");
    tableRepository(this.#repos, table);
    if (request.filter !== undefined) {
      if (!plainObject(request.filter)) fail("query_shape_invalid", "Query filter must be an object");
      for (const [field, value] of Object.entries(request.filter)) {
        fieldOwner(table, field);
        safeValue(value);
      }
    }
    const primary = TABLES[table].primaryField;
    const sort = request.sort ?? { field: primary, direction: "asc" };
    if (!plainObject(sort) || Object.keys(sort).some((key) => !["field", "direction"].includes(key)) ||
        typeof sort.field !== "string" || !["asc", "desc"].includes(sort.direction)) {
      fail("query_shape_invalid", "Query sort must contain field and asc/desc direction");
    }
    fieldOwner(table, sort.field);
    const input = clone({ actor, table, filter: request.filter ?? null, sort });
    const index = await this.#index(input.table);
    let rows = [...index.values()].map((record) => clone(record.fields));
    if (input.filter !== null) {
      rows = rows.filter((row) => Object.entries(input.filter).every(([field, value]) => equal(row[field], value)));
    }
    const direction = input.sort.direction === "asc" ? 1 : -1;
    rows.sort((left, right) => {
      const leftSort = Object.hasOwn(left, input.sort.field) ? left[input.sort.field] : undefined;
      const rightSort = Object.hasOwn(right, input.sort.field) ? right[input.sort.field] : undefined;
      const compared = compareCell(leftSort, rightSort) * direction;
      return compared || compareCell(left[primary], right[primary]);
    });
    return clone(rows);
  }

  async queryMetrics(request) {
    exactKeys(request, METRIC_KEYS, "query_shape_invalid");
    this.#actor(request.actorId);
    const groupBy = request.groupBy;
    if (!["drama", "account"].includes(groupBy)) fail("query_shape_invalid", "Metrics group is invalid");
    let releases;
    try {
      releases = await this.#index("发布记录");
    } catch (error) {
      return clone({
        status: "unavailable", groups: [],
        unavailable: [{ reason: "release_index_unavailable", error_code: typeof error?.code === "string" ? error.code : "internal_error" }],
      });
    }
    let accountByRecordId = null;
    if (groupBy === "account") {
      let accounts;
      try {
        accounts = await this.#index("账号台账");
      } catch (error) {
        return clone({
          status: "unavailable", groups: [],
          unavailable: [{ reason: "account_index_unavailable", error_code: typeof error?.code === "string" ? error.code : "internal_error" }],
        });
      }
      accountByRecordId = new Map([...accounts].map(([key, record]) => [record.record_id, key]));
    }
    const groups = new Map();
    const unavailable = [];
    for (const [releaseId, record] of [...releases].sort(([left], [right]) => left.localeCompare(right))) {
      const fields = record.fields;
      if (fields.归档状态 === "archived") continue;
      if (fields.归档状态 !== "active") {
        unavailable.push({
          record_id: releaseId,
          field: "归档状态",
          reason: Object.hasOwn(fields, "归档状态") ? "archive_state_invalid" : "archive_state_missing",
        });
        continue;
      }
      let key;
      if (groupBy === "drama") {
        key = normalizeLookupStable(fields.剧ID);
        if (!key) unavailable.push({ record_id: releaseId, field: "剧ID", reason: "stable_drama_unavailable" });
      } else {
        const relation = fields.账号;
        const relationId = Array.isArray(relation) && relation.length === 1 && plainObject(relation[0]) ? relation[0].id : null;
        key = typeof relationId === "string" ? accountByRecordId.get(relationId) : null;
        if (!key) unavailable.push({ record_id: releaseId, field: "账号", reason: "stable_account_unavailable" });
      }
      if (!key) continue;
      if (!groups.has(key)) groups.set(key, {
        key, releases: 0,
        values: Object.fromEntries(METRICS.map((metric) => [metric, 0])),
        available: Object.fromEntries(METRICS.map((metric) => [metric, true])),
      });
      const group = groups.get(key);
      group.releases += 1;
      for (const metric of METRICS) {
        const value = fields[metric];
        if (typeof value !== "number" || !Number.isFinite(value)) {
          group.available[metric] = false;
          unavailable.push({ record_id: releaseId, field: metric, reason: value === null || value === undefined ? "metric_unavailable" : "metric_invalid" });
        } else {
          group.values[metric] += value;
        }
      }
    }
    const result = [...groups.values()].sort((left, right) => left.key.localeCompare(right.key)).map((group) => ({
      key: group.key,
      releases: group.releases,
      ...Object.fromEntries(METRICS.map((metric) => [metric, group.available[metric] ? group.values[metric] : null])),
    }));
    if (unavailable.length === 0) return clone(result);
    unavailable.sort((left, right) => left.record_id.localeCompare(right.record_id) || left.field.localeCompare(right.field));
    return clone({ status: "partial", groups: result, unavailable });
  }

  async applySingleField(request) {
    exactKeys(request, SINGLE_KEYS, "mutation_shape_invalid");
    const input = clone(request);
    const actor = this.#actor(input.actorId);
    this.#chat(input.chatId);
    this.#assertWriter(actor);
    const table = requiredString(input.table, "table");
    const field = requiredString(input.field, "field");
    assertHumanField(table, field, { allowRelation: false });
    assertProtectedAction("update", table, { [field]: input.value }, { caller: true });
    const normalizedValue = normalizeFieldValue(table, field, input.value);
    const key = requiredString(input.key, "key");
    return this.#withMutationLock(async (renew) => {
      const index = await this.#leasedStep(renew, () => this.#index(table));
      const record = index.get(key);
      if (!record) fail("business_record_not_found", "Business record was not found", { table, key });
      const beforeState = cellState(record.fields, field);
      if (equal(beforeState, { present: true, value: normalizedValue })) {
        return mutationResult({ status: "unchanged", actor, recordId: key, changedFields: [], nextStep: "none" });
      }
      const patch = { [field]: clone(normalizedValue) };
      const result = await this.#leasedStep(renew, () => tableRepository(this.#repos, table).upsertByKey(key, patch, "human"));
      const readback = result.record?.fields?.[field];
      if (!equal(readback, normalizedValue) || result.readback !== "verified") {
        fail("readback_mismatch", "Human mutation readback did not match", { table, key, field });
      }
      await this.#leasedStep(renew, () => this.#jobs.appendAudit({
        actorId: actor, action: "update", targetTable: table, targetKey: key,
        before: { [field]: beforeState },
        after: { [field]: { present: true, value: clone(normalizedValue) } },
        readback: { [field]: cellState(result.record.fields, field) },
        now: this.#now(),
      }));
      return mutationResult({
        actor,
        recordId: key,
        changedFields: [changedRecord(key, record.fields, patch, result.record.fields)],
      });
    });
  }

  async previewMutation(request) {
    exactKeys(request, PREVIEW_KEYS, "mutation_shape_invalid");
    const input = clone(request);
    const actor = this.#actor(input.actorId);
    const chat = this.#chat(input.chatId);
    this.#assertWriter(actor);
    const action = requiredString(input.action, "action");
    if (!["create", "update", "batch_update", "attach-post", "archive"].includes(action)) {
      fail("mutation_action_invalid", "Mutation action is not supported", { action });
    }
    const envelope = await this.#prepareEnvelope({ ...input, actor, chat, action });
    return this.#savePreview(actor, chat, envelope);
  }

  async applyPreview(request) {
    exactKeys(request, APPLY_KEYS, "mutation_shape_invalid");
    const input = clone(request);
    // Task 9's single launchd/job-queue worker remains defense in depth over this durable lease.
    return this.#withMutationLock((renew) => this.#applyReceipt(input, false, renew));
  }

  async previewArchive(request) {
    exactKeys(request, ARCHIVE_KEYS, "mutation_shape_invalid");
    const actor = this.#actor(request.actorId);
    const chat = this.#chat(request.chatId);
    this.#assertWriter(actor);
    const table = requiredString(request.table, "table");
    if (!["选剧池", "发布记录"].includes(table)) fail("mutation_action_invalid", "Table cannot be archived", { table });
    const envelope = await this.#prepareEnvelope({ actor, chat, action: "archive", table, key: request.key, patch: { 归档状态: "archived" } });
    return this.#savePreview(actor, chat, envelope);
  }

  async applyArchive(request) {
    exactKeys(request, APPLY_KEYS, "mutation_shape_invalid");
    const input = clone(request);
    return this.#withMutationLock((renew) => this.#applyReceipt(input, true, renew));
  }

  async #prepareEnvelope(request) {
    const { action } = request;
    const table = requiredString(request.table, "table");
    tableRepository(this.#repos, table);
    if (table === "采集数据") fail("mutation_action_invalid", "Capture data is machine-owned");
    if (action === "create") {
      if (!["账号台账", "选剧池", "发布记录"].includes(table) || request.items !== undefined) {
        fail("mutation_action_invalid", "Create table or input is invalid");
      }
      let key;
      if (plainObject(request.patch)) assertProtectedAction(action, table, request.patch, { caller: true });
      const patch = await this.#normalizePatch(table, request.patch, { create: true });
      if (["选剧池", "发布记录"].includes(table)) patch.归档状态 = "active";
      assertProtectedAction(action, table, patch);
      if (table === "账号台账") {
        if (typeof request.key !== "string" || request.key.length === 0 || request.key.trim() !== request.key) {
          fail("account_id_required", "Account create requires a canonical account ID");
        }
        key = request.key;
        if (!/^[a-z0-9._]+$/.test(key)) fail("account_id_required", "Account create requires a canonical account ID");
      } else {
        if (request.key !== undefined) fail("mutation_shape_invalid", "Allocated create does not accept a caller key");
        key = table === "选剧池" ? this.#allocateDramaId() : this.#allocateReleaseId();
        requiredString(key, "allocated_id", "business_id_invalid");
        const pattern = table === "选剧池" ? /^SD-\d{6}$/ : /^SR-\d{6}$/;
        if (!pattern.test(key)) fail("business_id_invalid", "Allocated business ID is invalid", { table });
      }
      const index = await this.#index(table);
      if (index.has(key)) fail("business_key_conflict", "Business key already exists", { table, key });
      return { v: RECEIPT_VERSION, base_binding: this.#baseBinding, action, table, targets: [{ key, patch }], before: [absenceSnapshot(table, key)] };
    }
    if (action === "batch_update") {
      if (request.key !== undefined || request.patch !== undefined || !Array.isArray(request.items) || request.items.length === 0) {
        fail("mutation_shape_invalid", "Batch update requires non-empty items only");
      }
      if (request.items.some((item) => !plainObject(item) || Object.keys(item).some((key) => !["key", "patch"].includes(key)))) {
        fail("mutation_shape_invalid", "Batch item shape is invalid");
      }
      const targets = [];
      const seen = new Set();
      for (const item of request.items) {
        const resolved = await this.#resolve(table, item.key);
        if (seen.has(resolved.key)) fail("duplicate_input_key", "Batch contains a duplicate target", { key: resolved.key });
        seen.add(resolved.key);
        if (plainObject(item.patch)) assertProtectedAction(action, table, item.patch, { caller: true });
        const patch = await this.#normalizePatch(table, item.patch);
        assertProtectedAction(action, table, patch);
        targets.push({ key: resolved.key, patch, record: resolved.record });
      }
      if (targets.some((target) => target.patch.归档状态 === "archived")) this.#assertPrivileged(request.actor);
      targets.sort((left, right) => left.key.localeCompare(right.key));
      return {
        v: RECEIPT_VERSION, base_binding: this.#baseBinding, action, table,
        targets: targets.map(({ key, patch }) => ({ key, patch })),
        before: targets.map(({ key, record }) => recordSnapshot(table, key, record)),
      };
    }
    if (!["update", "attach-post", "archive"].includes(action) || request.items !== undefined) {
      fail("mutation_action_invalid", "Mutation action input is invalid");
    }
    if (action === "attach-post" && table !== "发布记录") fail("mutation_action_invalid", "attach-post is release-only");
    if (action === "archive" && !["选剧池", "发布记录"].includes(table)) fail("mutation_action_invalid", "Table cannot be archived");
    const resolved = await this.#resolve(table, request.key);
    if (plainObject(request.patch)) assertProtectedAction(action, table, request.patch, { caller: true });
    let patch = await this.#normalizePatch(table, request.patch);
    assertProtectedAction(action, table, patch);
    if (action === "attach-post") {
      if (Object.keys(patch).sort().join("|") !== ["Post ID", "视频链接"].sort().join("|")) {
        fail("mutation_shape_invalid", "attach-post requires exactly 视频链接 and Post ID");
      }
      await this.#validateAttachPost(resolved.key, resolved.record, patch);
    }
    if (action === "archive" && !equal(patch, { 归档状态: "archived" })) {
      fail("mutation_shape_invalid", "Archive patch is fixed");
    }
    return {
      v: RECEIPT_VERSION, base_binding: this.#baseBinding, action, table,
      targets: [{ key: resolved.key, patch }],
      before: [recordSnapshot(table, resolved.key, resolved.record)],
    };
  }

  async #validateAttachPost(releaseKey, releaseRecord, patch) {
    if (typeof patch["Post ID"] !== "string" || !/^\d+$/.test(patch["Post ID"])) {
      fail("post_id_invalid", "Post ID must contain digits only");
    }
    const parsed = parseTikTokPost(patch.视频链接);
    if (parsed.postId !== patch["Post ID"]) fail("post_id_mismatch", "URL Post ID does not match patch Post ID");
    const relation = releaseRecord.fields?.账号;
    if (!Array.isArray(relation) || relation.length !== 1 || !plainObject(relation[0]) || typeof relation[0].id !== "string") {
      fail("post_account_unavailable", "Release stable account relation is unavailable");
    }
    const accounts = await this.#index("账号台账");
    const account = [...accounts].find(([, record]) => record.record_id === relation[0].id)?.[0];
    if (!account) fail("post_account_unavailable", "Release account relation cannot be resolved");
    if (parsed.handle !== account) fail("post_account_mismatch", "TikTok URL handle does not match the stable account ID", { expected: account });
    const releases = await this.#index("发布记录");
    const claimant = [...releases].find(([key, record]) => key !== releaseKey && record.fields?.归档状态 === "active" && record.fields?.["Post ID"] === patch["Post ID"]);
    if (claimant) fail("post_id_claimed", "Post ID is already claimed by another active release", { release_id: claimant[0] });
  }

  #savePreview(actor, chat, envelope) {
    const receiptId = receiptString(this.#makeReceiptId());
    if (this.#jobs.getPreview(receiptId)) fail("receipt_id_conflict", "Receipt ID already exists");
    const beforeHash = canonicalHash(envelope.before);
    const targetKey = envelope.targets.length === 1 ? envelope.targets[0].key : envelope.targets.map((target) => target.key).join(",");
    const receipt = this.#jobs.createPreview({
      receiptId, actorId: actor, chatId: chat, action: envelope.action,
      targetTable: envelope.table, targetKey, beforeHash, patch: clone(envelope), now: this.#now(),
    });
    return clone({
      status: "preview", actor, receipt_id: receipt.receipt_id,
      record_id: envelope.targets.length === 1 ? envelope.targets[0].key : envelope.targets.map((target) => target.key),
      action: envelope.action, table: envelope.table, patch: envelope.targets.length === 1 ? envelope.targets[0].patch : envelope.targets,
      expires_at: receipt.expires_at, next_step: envelope.action === "archive" ? "apply_archive" : "apply_preview",
    });
  }

  async #currentBefore(envelope) {
    const index = await this.#index(envelope.table);
    return envelope.targets.map((target) => {
      const record = index.get(target.key);
      return record ? recordSnapshot(envelope.table, target.key, record) : absenceSnapshot(envelope.table, target.key);
    });
  }

  #validateReceiptEnvelope(receipt, envelope) {
    if (!plainObject(envelope) || Object.keys(envelope).some((key) => !["v", "base_binding", "action", "table", "targets", "before"].includes(key)) ||
        envelope.v !== RECEIPT_VERSION || !["create", "update", "batch_update", "attach-post", "archive"].includes(envelope.action) ||
        typeof envelope.base_binding !== "string" || !/^[0-9a-f]{64}$/.test(envelope.base_binding) ||
        !TABLE_REPOSITORIES[envelope.table] || !Array.isArray(envelope.targets) || envelope.targets.length === 0 || !Array.isArray(envelope.before) ||
        envelope.before.length !== envelope.targets.length || receipt.action !== envelope.action || receipt.target_table !== envelope.table) {
      fail("preview_payload_invalid", "Preview payload is invalid");
    }
    if (envelope.base_binding !== this.#baseBinding) fail("preview_base_mismatch", "Preview belongs to a different Base binding");
    const expectedTarget = envelope.targets.length === 1 ? envelope.targets[0].key : envelope.targets.map((target) => target.key).join(",");
    if (receipt.target_key !== expectedTarget) fail("preview_payload_invalid", "Preview target binding is invalid");
    const allowedTable = ["账号台账", "选剧池", "发布记录"].includes(envelope.table);
    const combinationValid = allowedTable &&
      (envelope.action !== "attach-post" || envelope.table === "发布记录") &&
      (envelope.action !== "archive" || (["选剧池", "发布记录"].includes(envelope.table) && envelope.targets.length === 1)) &&
      (envelope.action !== "update" || envelope.targets.length === 1) &&
      (envelope.action !== "create" || envelope.targets.length === 1);
    if (!combinationValid) fail("preview_payload_invalid", "Preview action and table combination is invalid");
    const targetKeys = new Set();
    for (let index = 0; index < envelope.targets.length; index += 1) {
      const target = envelope.targets[index];
      if (!plainObject(target) || Object.keys(target).some((key) => !["key", "patch"].includes(key))) fail("preview_payload_invalid", "Preview target is invalid");
      requiredString(target.key, "target.key", "preview_payload_invalid");
      if (targetKeys.has(target.key)) fail("preview_payload_invalid", "Preview has duplicate targets");
      targetKeys.add(target.key);
      if (!plainObject(target.patch) || Object.keys(target.patch).length === 0) fail("preview_payload_invalid", "Preview patch is invalid");
      safeValue(target.patch);
      assertProtectedAction(envelope.action, envelope.table, target.patch, { stored: true });
      if (envelope.action === "attach-post" && Object.keys(target.patch).sort().join("|") !== ["Post ID", "视频链接"].sort().join("|")) {
        fail("preview_payload_invalid", "attach-post preview patch is invalid");
      }
      if (envelope.action === "archive" && !equal(target.patch, { 归档状态: "archived" })) {
        fail("preview_payload_invalid", "Archive preview patch is invalid");
      }
      const before = envelope.before[index];
      const allowedBefore = before?.exists === true
        ? ["table", "key", "exists", "record"]
        : ["table", "key", "exists"];
      if (!plainObject(before) || Object.keys(before).some((key) => !allowedBefore.includes(key)) ||
          before.table !== envelope.table || before.key !== target.key || typeof before.exists !== "boolean" ||
          (before.exists === true && (!plainObject(before.record) || Object.keys(before.record).some((key) => !["record_id", "fields"].includes(key)) || !plainObject(before.record.fields)))) {
        fail("preview_payload_invalid", "Preview before snapshot is invalid");
      }
    }
  }

  async #applyReceipt(request, archiveOnly, renew) {
    const actor = this.#actor(request.actorId);
    const chat = this.#chat(request.chatId);
    const receiptId = receiptString(request.receiptId);
    this.#assertWriter(actor);
    const receipt = this.#jobs.getPreview(receiptId);
    if (!receipt) fail("preview_not_found", "Preview receipt was not found", { receipt_id: receiptId });
    if (receipt.actor_id !== actor) fail("preview_actor_mismatch", "Preview actor does not match");
    if (receipt.chat_id !== chat) fail("preview_chat_mismatch", "Preview chat does not match");
    const envelope = clone(receipt.patch);
    this.#validateReceiptEnvelope(receipt, envelope);
    if (archiveOnly !== (envelope.action === "archive")) {
      fail("preview_action_mismatch", "Preview must be applied through its matching method");
    }
    if (envelope.action === "batch_update" && envelope.targets.some((target) => target.patch.归档状态 === "archived")) {
      this.#assertPrivileged(actor);
    }
    for (const target of envelope.targets) {
      const normalizedPatch = await this.#leasedStep(
        renew,
        () => this.#normalizePatch(envelope.table, target.patch, { create: envelope.action === "create", internal: true }),
      );
      if (!equal(normalizedPatch, target.patch)) {
        fail("preview_payload_invalid", "Preview patch is not in canonical storage form");
      }
    }
    const currentBefore = await this.#leasedStep(renew, () => this.#currentBefore(envelope));
    if (envelope.action === "attach-post") {
      await this.#leasedStep(renew, async () => {
        const current = (await this.#index("发布记录")).get(envelope.targets[0].key);
        if (!current) fail("preview_stale", "Preview target is stale");
        await this.#validateAttachPost(envelope.targets[0].key, current, envelope.targets[0].patch);
      });
    }
    const beforeHash = canonicalHash(currentBefore);
    await this.#leasedStep(renew, () => this.#jobs.consumePreview(receiptId, { actorId: actor, chatId: chat, beforeHash, now: this.#now() }));

    const repository = tableRepository(this.#repos, envelope.table);
    const results = [];
    for (let index = 0; index < envelope.targets.length; index += 1) {
      const target = envelope.targets[index];
      const beforeSnapshot = currentBefore[index];
      const beforeFields = beforeSnapshot.exists
        ? Object.fromEntries(Object.entries(beforeSnapshot.record.fields)
          .filter(([, cell]) => cell.present)
          .map(([field, cell]) => [field, clone(cell.value)]))
        : {};
      const changed = Object.keys(target.patch)
        .filter((field) => !equal(cellState(beforeFields, field), { present: true, value: target.patch[field] }))
        .sort();
      if (changed.length === 0) {
        results.push({ key: target.key, change: null });
        continue;
      }
      const written = await this.#leasedStep(renew, () => repository.upsertByKey(target.key, target.patch, "human"));
      if (written.readback !== "verified" || !plainObject(written.record?.fields)) {
        fail("readback_mismatch", "Human mutation did not return verified readback", { table: envelope.table, key: target.key });
      }
      for (const field of Object.keys(target.patch)) {
        if (!equal(written.record.fields[field], target.patch[field])) {
          fail("readback_mismatch", "Human mutation readback did not match", { table: envelope.table, key: target.key, field });
        }
      }
      const change = changedRecord(target.key, beforeFields, target.patch, written.record.fields);
      const beforeAudit = Object.fromEntries(changed.map((field) => [field, clone(change.fields[field].before)]));
      const afterAudit = Object.fromEntries(changed.map((field) => [field, clone(change.fields[field].after)]));
      const readbackAudit = Object.fromEntries(changed.map((field) => [field, clone(change.fields[field].readback)]));
      await this.#leasedStep(renew, () => this.#jobs.appendAudit({
        actorId: actor, action: envelope.action, targetTable: envelope.table, targetKey: target.key,
        before: beforeAudit, after: afterAudit, readback: readbackAudit, now: this.#now(),
      }));
      results.push({ key: target.key, change });
    }
    const allChanged = results.map((result) => result.change).filter(Boolean);
    const allUnchanged = allChanged.length === 0;
    return mutationResult({
      status: allUnchanged ? "unchanged" : "success",
      actor,
      recordId: results.length === 1 ? results[0].key : results.map((result) => result.key),
      changedFields: allChanged,
      nextStep: "none",
    });
  }
}
