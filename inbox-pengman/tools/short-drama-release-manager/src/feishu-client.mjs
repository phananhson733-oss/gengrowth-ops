import { ShortDramaError } from "./errors.mjs";
import { BASE_FIELD_SPECS, TABLE_ORDER, TABLES, fieldOwner } from "./schema.mjs";

const FEISHU_ORIGIN = "https://open.feishu.cn";
const AUTH_PATH = "/open-apis/auth/v3/tenant_access_token/internal";
const BASE_V3_PREFIX = "/open-apis/base/v3/";
const MAX_WRITE_BATCH = 200;
const MAX_REQUEST_ATTEMPTS = 3;
const MAX_RECORD_VISIBILITY_ATTEMPTS = 3;
const AUTH_ERROR_CODES = new Set([99991663, 99991664, 99991668, 99991671, 99991672]);
const SCHEMA_ERROR_CODES = new Set([1254044, 1254045, 1254060, 1254061, 1254062]);
const DASHBOARD_NAME = "短剧发行管理仪表盘";
const CANARY_PRIMARY = /^CANARY-SDRUN-\d{8}-\d{6}(?:-[A-F0-9]+)?$/;

function fail(code, message, details = {}) {
  throw new ShortDramaError(code, message, details);
}

function invalidResponse(message, details = {}) {
  return new ShortDramaError("base_response_invalid", message, details);
}

function abortFailure() {
  return new ShortDramaError("base_operation_aborted", "Feishu Base operation was aborted");
}

function assertNotAborted(signal) {
  if (signal === undefined || signal === null) return;
  if (typeof signal.aborted !== "boolean" || typeof signal.addEventListener !== "function") {
    fail("base_response_invalid", "Abort signal is invalid");
  }
  if (signal.aborted) throw abortFailure();
}

async function awaitWithAbort(value, signal) {
  assertNotAborted(signal);
  if (!signal) return await value;
  let onAbort;
  const aborted = new Promise((_resolve, reject) => {
    onAbort = () => reject(abortFailure());
    signal.addEventListener("abort", onAbort, { once: true });
  });
  try {
    const result = await Promise.race([Promise.resolve(value), aborted]);
    assertNotAborted(signal);
    return result;
  } finally {
    signal.removeEventListener?.("abort", onAbort);
  }
}

function defaultSleep(ms, { signal } = {}) {
  assertNotAborted(signal);
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (callback, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal?.removeEventListener?.("abort", onAbort);
      callback(value);
    };
    const onAbort = () => finish(reject, abortFailure());
    const timer = setTimeout(() => finish(resolve), ms);
    signal?.addEventListener?.("abort", onAbort, { once: true });
    if (signal?.aborted) onAbort();
  });
}

function encoded(value) {
  if (typeof value !== "string" || value.length === 0) {
    fail("base_response_invalid", "Feishu identifier must be a non-empty string");
  }
  return encodeURIComponent(value);
}

function plainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function headerValue(headers, name) {
  if (!headers) return undefined;
  if (typeof headers.get === "function") return headers.get(name);
  const target = name.toLowerCase();
  return Object.entries(headers).find(([key]) => key.toLowerCase() === target)?.[1];
}

function statusOf(value) {
  const status = Number(value?.status ?? value?.statusCode ?? value?.response?.status);
  return Number.isFinite(status) ? status : null;
}

function codeOf(value) {
  const raw = value?.code ?? value?.response?.data?.code;
  return typeof raw === "number" && Number.isFinite(raw) ? raw : null;
}

function isRateLimited(value) {
  return statusOf(value) === 429 || codeOf(value) === 1254291;
}

function isAuthorizationFailure(value) {
  const status = statusOf(value);
  return status === 401 || status === 403 || AUTH_ERROR_CODES.has(codeOf(value));
}

function retryDelay(value, attempt) {
  const headers = value?.headers ?? value?.response?.headers;
  const retryAfter = headerValue(headers, "retry-after");
  if (retryAfter !== undefined && retryAfter !== null && retryAfter !== "") {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1000;
    const retryAt = Date.parse(String(retryAfter));
    if (Number.isFinite(retryAt)) return Math.max(0, retryAt - Date.now());
  }
  const explicitMs = Number(value?.retry_after_ms ?? value?.response?.data?.retry_after_ms);
  if (Number.isFinite(explicitMs) && explicitMs >= 0) return explicitMs;
  return attempt * 1000;
}

function mappedFailure(value, path, attempts = null) {
  const details = { code: codeOf(value), status: statusOf(value), path: diagnosticPath(path), ...(attempts ? { attempts } : {}) };
  if (isRateLimited(value)) return new ShortDramaError("base_rate_limited", "Feishu Base rate limit retry budget exhausted", details);
  if (isAuthorizationFailure(value)) {
    return new ShortDramaError("base_auth_failed", "Feishu Base authorization failed", details);
  }
  if (SCHEMA_ERROR_CODES.has(codeOf(value))) {
    return new ShortDramaError("base_schema_drift", "Feishu Base schema drift detected", details);
  }
  return new ShortDramaError("base_request_failed", "Feishu Base request failed", details);
}

function diagnosticPath(path) {
  if (typeof path !== "string") return "[redacted]";
  const [pathname] = path.split("?", 1);
  const parts = pathname.split("/");
  const resourceIds = new Set(["bases", "tables", "dashboards", "blocks", "views", "fields"]);
  for (let index = 0; index < parts.length - 1; index += 1) {
    const segment = parts[index];
    const next = parts[index + 1];
    if (resourceIds.has(segment) || segment === "records" && !next.startsWith("batch_")) {
      parts[index + 1] = "[redacted]";
    }
  }
  return parts.join("/");
}

function validateToken(token) {
  if (typeof token !== "string" || token.length === 0) {
    throw invalidResponse("Feishu token provider returned an invalid token");
  }
  return token;
}

function assertPayload(payload, path = undefined) {
  if (!plainObject(payload) || typeof payload.code !== "number" || !Number.isFinite(payload.code)) {
    throw invalidResponse("Feishu response must be an object with a numeric code", path ? { path: diagnosticPath(path) } : {});
  }
}

function hasIgnoredFields(value, seen = new Set()) {
  if (!value || typeof value !== "object" || seen.has(value)) return false;
  seen.add(value);
  for (const [key, child] of Object.entries(value)) {
    if ((key === "ignored_fields" || key === "ignored_field_list") &&
        ((Array.isArray(child) && child.length > 0) || (plainObject(child) && Object.keys(child).length > 0))) {
      return true;
    }
    if (hasIgnoredFields(child, seen)) return true;
  }
  return false;
}

function requireEntity(payload, entityName, idName) {
  if (hasIgnoredFields(payload.data)) {
    throw invalidResponse("Feishu response reports ignored fields", { entity: entityName });
  }
  const entity = payload.data?.[entityName] ?? payload.data;
  const identifier = entity?.[idName] ?? entity?.id;
  if (!plainObject(entity) || typeof identifier !== "string" || identifier.length === 0 ||
      entity[idName] !== undefined && entity.id !== undefined && entity[idName] !== entity.id) {
    throw invalidResponse(`Feishu ${entityName} response is missing ${idName}`);
  }
  return { ...entity, [idName]: identifier };
}

function normalizedResourceItems(data, resource) {
  if (resource !== "items" && data?.[resource] !== undefined && data?.items !== undefined) {
    throw invalidResponse(`Feishu ${resource} response is ambiguous`);
  }
  const raw = data?.[resource] ?? data?.items;
  if (!Array.isArray(raw)) throw invalidResponse(`Feishu ${resource} response must be an array`);
  const idNames = { tables: "table_id", fields: "field_id", views: "view_id", dashboards: "dashboard_id", blocks: "block_id" };
  const idName = idNames[resource];
  if (!idName) return raw;
  return raw.map((item) => {
    const identifier = item?.[idName] ?? item?.id;
    if (!plainObject(item) || typeof identifier !== "string" || identifier.length === 0 ||
        item[idName] !== undefined && item.id !== undefined && item[idName] !== item.id) {
      throw invalidResponse(`Feishu ${resource} item identifier is malformed`);
    }
    const normalized = { ...item, [idName]: identifier };
    if (resource === "fields" && item.options !== undefined) {
      if (!Array.isArray(item.options)) throw invalidResponse("Feishu field options are malformed");
      const optionIdPresence = item.options.map((option) => plainObject(option) && Object.hasOwn(option, "id"));
      if (optionIdPresence.some(Boolean) && !optionIdPresence.every(Boolean)) {
        throw invalidResponse("Feishu field options are malformed or duplicate");
      }
      const requireIds = optionIdPresence.length > 0 && optionIdPresence.every(Boolean);
      const ids = new Set();
      const names = new Set();
      normalized.options = item.options.map((option) => {
        if (!plainObject(option) || requireIds && (typeof option.id !== "string" || option.id.length === 0 || option.id.trim() !== option.id || ids.has(option.id)) ||
            typeof option.name !== "string" || option.name.length === 0 || option.name.trim() !== option.name || names.has(option.name)) {
          throw invalidResponse("Feishu field options are malformed or duplicate");
        }
        if (requireIds) ids.add(option.id);
        names.add(option.name);
        return { name: option.name };
      });
    }
    return normalized;
  });
}

function fieldSpecOrNull(tableName, fieldName) {
  return BASE_FIELD_SPECS[tableName]?.find((spec) => spec.name === fieldName) ?? null;
}

function validCalendarParts(year, month, day, hour = 0, minute = 0, second = 0) {
  return month >= 1 && month <= 12 && day >= 1 && day <= new Date(Date.UTC(year, month, 0)).getUTCDate() &&
    hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59 && second >= 0 && second <= 59;
}

function shanghaiRaw(value) {
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (dateOnly) {
    if (!validCalendarParts(...dateOnly.slice(1).map(Number))) throw invalidResponse("Datetime write value is invalid");
    return `${value} 00:00:00`;
  }
  const qualified = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/.exec(value);
  if (!qualified || !validCalendarParts(...qualified.slice(1, 7).map(Number))) throw invalidResponse("Datetime write value is invalid");
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) throw invalidResponse("Datetime write value is invalid");
  return new Date(parsed.getTime() + 8 * 60 * 60 * 1000).toISOString().slice(0, 19).replace("T", " ");
}

function exactIdCells(value, context) {
  if (!Array.isArray(value) || value.some((item) => !plainObject(item) || Object.keys(item).length !== 1 ||
      typeof item.id !== "string" || item.id.length === 0 || item.id.trim() !== item.id) ||
      new Set(value.map((item) => item.id)).size !== value.length) {
    throw invalidResponse(`${context} cell value is malformed`);
  }
  return value;
}

function encodeCell(tableName, fieldName, value) {
  const spec = fieldSpecOrNull(tableName, fieldName);
  if (!spec || value === null || value === undefined) return value;
  if (spec.kind === "single_select") {
    if (typeof value !== "string" || spec.options && !spec.options.includes(value)) throw invalidResponse("Single-select write value is invalid");
    return [value];
  }
  if (spec.kind === "multi_select") {
    if (!Array.isArray(value) || value.some((item) => typeof item !== "string" || spec.options && !spec.options.includes(item)) ||
        new Set(value).size !== value.length) throw invalidResponse("Multi-select write value is invalid");
    return value;
  }
  if (spec.kind === "date" || spec.kind === "datetime") return shanghaiRaw(value);
  if (spec.kind === "link") return exactIdCells(value, "Link");
  return value;
}

function decodeCell(tableName, fieldName, value) {
  const spec = fieldSpecOrNull(tableName, fieldName);
  if (!spec || value === null || value === undefined) return value;
  if (spec.kind === "single_select") {
    if (!Array.isArray(value) || value.length > 1 || value.some((item) => typeof item !== "string" || spec.options && !spec.options.includes(item))) throw invalidResponse("Single-select read value is malformed");
    return value[0] ?? null;
  }
  if (spec.kind === "multi_select") {
    if (!Array.isArray(value) || value.some((item) => typeof item !== "string" || spec.options && !spec.options.includes(item)) ||
        new Set(value).size !== value.length) throw invalidResponse("Multi-select read value is malformed");
    return value;
  }
  if (spec.kind === "date" || spec.kind === "datetime") {
    const raw = typeof value === "string" ? /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/.exec(value) : null;
    if (!raw || !validCalendarParts(...raw.slice(1).map(Number))) throw invalidResponse("Datetime read value is malformed");
    if (spec.kind === "date") return value.slice(0, 10);
    if (tableName === "发布记录" && fieldName === "日期" && value.endsWith(" 00:00:00")) return value.slice(0, 10);
    const parsed = new Date(`${value.replace(" ", "T")}+08:00`);
    if (!Number.isFinite(parsed.getTime())) throw invalidResponse("Datetime read value is invalid");
    return parsed.toISOString();
  }
  if (spec.kind === "link") return exactIdCells(value, "Link");
  if (spec.kind === "lookup") {
    const linkSpec = fieldSpecOrNull(tableName, spec.linkField);
    const sourceSpec = linkSpec ? fieldSpecOrNull(linkSpec.targetTable, spec.sourceField) : null;
    if (sourceSpec?.kind === "number") {
      if (value === "") return null;
      if (typeof value !== "string" || !/^(?:0|[1-9]\d*)$/.test(value)) throw invalidResponse("Numeric lookup read value is malformed");
      const numeric = Number(value);
      if (!Number.isSafeInteger(numeric) || numeric < 0) throw invalidResponse("Numeric lookup read value is unsafe");
      return numeric;
    }
  }
  return value;
}

function expectedVendorFieldTypes(spec) {
  const mapping = {
    text: ["text"], url: ["text", "url"], number: ["number"], single_select: ["single_select", "select"],
    multi_select: ["multi_select", "select"], date: ["datetime"], datetime: ["datetime"], link: ["link"],
    lookup: ["lookup"], formula: ["formula"], system: [spec?.systemType],
  };
  return new Set((mapping[spec?.kind] ?? []).filter(Boolean));
}

function encodeFields(tableName, fields) {
  return Object.fromEntries(Object.entries(fields).map(([field, value]) => [field, encodeCell(tableName, field, value)]));
}

function recordProjection(value) {
  if (!Array.isArray(value) || value.some((field) =>
    typeof field !== "string" || field.length === 0 || field.trim() !== field) || new Set(value).size !== value.length) {
    throw invalidResponse("Feishu record projection is malformed or duplicate");
  }
  return [...value];
}

function decodedRecordMatrix(data, { tableName = null, writableOnly = false, projectionActive = false, strictList = false } = {}) {
  const { fields, field_id_list: fieldIds, field_type_list: fieldTypes, record_id_list: recordIds, data: rows } = data ?? {};
  if (!Array.isArray(fields) || !Array.isArray(recordIds) || !Array.isArray(rows) ||
      fields.some((field) => typeof field !== "string" || field.length === 0) ||
      fieldIds !== undefined && (!Array.isArray(fieldIds) || fieldIds.some((field) => typeof field !== "string" || field.length === 0)) ||
      recordIds.some((recordId) => typeof recordId !== "string" || recordId.length === 0) ||
      fieldIds !== undefined && fields.length !== fieldIds.length || fieldTypes !== undefined && (!Array.isArray(fieldTypes) || fieldTypes.length !== fields.length) || new Set(fields).size !== fields.length ||
      fieldIds !== undefined && new Set(fieldIds).size !== fieldIds.length || new Set(recordIds).size !== recordIds.length ||
      rows.length !== recordIds.length || rows.some((row) => !Array.isArray(row) || row.length !== fields.length)) {
    throw invalidResponse("Feishu record matrix response is malformed");
  }
  if (strictList) {
    if (data.time_zone !== undefined || data.revision !== undefined || data.revision_id !== undefined) {
      throw invalidResponse("Feishu record list uses unsupported metadata aliases");
    }
    if (data.timezone !== undefined && data.timezone !== "Asia/Shanghai") {
      throw invalidResponse("Feishu record list timezone is invalid");
    }
    if (data.rev !== undefined && data.rev !== null && (!Number.isSafeInteger(data.rev) || data.rev < 0)) {
      throw invalidResponse("Feishu record list revision is invalid");
    }
    if (data.query_context !== undefined && (!plainObject(data.query_context) ||
        data.query_context.record_scope !== "all_records" ||
        data.query_context.field_scope !== (writableOnly || projectionActive ? "selected_fields" : "all_fields"))) {
      throw invalidResponse("Feishu record query_context scope is invalid");
    }
  } else if (data.query_context !== undefined && (!plainObject(data.query_context) ||
      typeof data.query_context.record_scope !== "string" || typeof data.query_context.field_scope !== "string")) {
    throw invalidResponse("Feishu record query_context is incomplete");
  }
  if (Array.isArray(data.ignored_fields) && data.ignored_fields.length > 0) {
    const expectedDerived = writableOnly && typeof tableName === "string" && data.ignored_fields.every((item) => {
      try { return plainObject(item) && typeof item.name === "string" && fieldOwner(tableName, item.name) === "derived"; }
      catch { return false; }
    });
    if (!expectedDerived) throw invalidResponse("Feishu record response contains ignored fields");
  } else if (data.ignored_fields !== undefined && !Array.isArray(data.ignored_fields)) {
    throw invalidResponse("Feishu ignored_fields is malformed");
  }
  let recordNotFound = [];
  if (data.record_not_found !== undefined) {
    if (!Array.isArray(data.record_not_found) || data.record_not_found.some((recordId) =>
      typeof recordId !== "string" || recordId.length === 0 || recordId.trim() !== recordId) ||
      new Set(data.record_not_found).size !== data.record_not_found.length ||
      data.record_not_found.some((recordId) => !recordIds.includes(recordId))) {
      throw invalidResponse("Feishu record_not_found metadata is malformed");
    }
    recordNotFound = [...data.record_not_found];
    for (const recordId of recordNotFound) {
      const row = rows[recordIds.indexOf(recordId)];
      if (row.some((value) => value !== null)) {
        throw invalidResponse("Feishu record_not_found metadata contradicts returned values");
      }
    }
  }
  if (fieldTypes !== undefined && typeof tableName === "string") {
    fields.forEach((field, index) => {
      const spec = fieldSpecOrNull(tableName, field);
      if (spec && !expectedVendorFieldTypes(spec).has(fieldTypes[index])) {
        throw invalidResponse("Feishu record field_type_list conflicts with the fixed schema");
      }
    });
  }
  return {
    records: rows.map((row, index) => ({
      record_id: recordIds[index],
      fields: Object.fromEntries(fields.map((field, at) => [field, decodeCell(tableName, field, row[at])])),
    })),
    signature: strictList ? {
      fields: [...fields],
      ...(data.total === undefined ? {} : { total: data.total }),
      ...(fieldIds === undefined ? {} : { field_ids: [...fieldIds] }),
      ...(fieldTypes === undefined ? {} : { field_types: [...fieldTypes] }),
      ...(data.timezone === undefined ? {} : { timezone: data.timezone }),
      ...(data.rev === undefined || data.rev === null ? {} : { rev: data.rev }),
      ...(data.query_context === undefined ? {} : {
        record_scope: data.query_context.record_scope,
        field_scope: data.query_context.field_scope,
      }),
    } : null,
    recordNotFound,
  };
}

function viewFieldIndex(fields) {
  if (!Array.isArray(fields) || fields.length === 0) throw invalidResponse("Complete view field index is required");
  const byId = new Map();
  const names = new Set();
  for (const field of fields) {
    if (!plainObject(field) || typeof field.field_id !== "string" || field.field_id.length === 0 ||
        typeof field.name !== "string" || field.name.length === 0 || byId.has(field.field_id) || names.has(field.name)) {
      throw invalidResponse("View field index is malformed or duplicate");
    }
    byId.set(field.field_id, field.name);
    names.add(field.name);
  }
  const resolveField = (value) => {
    if (typeof value !== "string" || (!byId.has(value) && !names.has(value))) throw invalidResponse("View configuration references an unknown field");
    return byId.get(value) ?? value;
  };
  return { resolveField };
}

function normalizeViewConfiguration(configuration, fields) {
  const { resolveField } = viewFieldIndex(fields);
  const result = structuredClone(configuration);
  if (!plainObject(result.filter) || Object.keys(result.filter).some((key) => !["logic", "conditions"].includes(key)) ||
      !["and", "or"].includes(result.filter.logic) || !Array.isArray(result.filter.conditions)) {
    throw invalidResponse("View filter configuration is malformed");
  }
  const operators = new Set(["==", "!=", ">", ">=", "<", "<=", "intersects", "disjoint", "empty", "non_empty"]);
  const validateValue = (value) => {
    const validScalar = (item) => item === null || typeof item === "string" || typeof item === "boolean" ||
      typeof item === "number" && Number.isFinite(item);
    if (Array.isArray(value)) {
      if (value.length === 0 || value.some((item) => !validScalar(item))) throw invalidResponse("View filter value is malformed");
    } else if (!validScalar(value)) throw invalidResponse("View filter value is malformed");
    return structuredClone(value);
  };
  result.filter.conditions = result.filter.conditions.map((condition) => {
    let field;
    let operator;
    let hasValue;
    let value;
    if (Array.isArray(condition)) {
      [field, operator] = condition;
      hasValue = condition.length === 3;
      value = condition[2];
      const expectedLength = ["empty", "non_empty"].includes(operator) ? 2 : 3;
      if (condition.length !== expectedLength) throw invalidResponse("View filter tuple condition is malformed");
    } else if (plainObject(condition)) {
      const keys = Object.keys(condition);
      field = condition.field_name;
      operator = condition.operator;
      hasValue = Object.hasOwn(condition, "value");
      value = condition.value;
      const expectedKeys = ["empty", "non_empty"].includes(operator)
        ? ["field_name", "operator"]
        : ["field_name", "operator", "value"];
      if (keys.length !== expectedKeys.length || keys.some((key) => !expectedKeys.includes(key))) {
        throw invalidResponse("View filter object condition is malformed");
      }
    } else throw invalidResponse("View filter condition is malformed");
    if (!operators.has(operator) || typeof field !== "string") throw invalidResponse("View filter condition is malformed");
    const normalized = [resolveField(field), operator];
    if (hasValue) normalized.push(validateValue(value));
    return normalized;
  });
  for (const [part, key] of [["sort", "sort_config"], ["group", "group_config"]]) {
    if (!plainObject(result[part]) || !Array.isArray(result[part][key]) ||
        result[part][key].some((item) => !plainObject(item) || typeof item.field !== "string")) {
      throw invalidResponse(`View ${part} configuration is malformed`);
    }
    result[part][key] = result[part][key].map((item) => ({ ...item, field: resolveField(item.field) }));
  }
  if (!plainObject(result.visible_fields) || !Array.isArray(result.visible_fields.visible_fields)) {
    throw invalidResponse("View visible fields configuration is malformed");
  }
  result.visible_fields.visible_fields = result.visible_fields.visible_fields.map(resolveField);
  return result;
}

function requireRecordIds(payload, expectedIds = null, expectedCount = null) {
  if (hasIgnoredFields(payload.data)) throw invalidResponse("Feishu batch response reports ignored fields");
  const ids = payload.data?.record_id_list;
  if (!Array.isArray(ids) || ids.some((id) => typeof id !== "string" || id.length === 0) ||
      new Set(ids).size !== ids.length) {
    throw invalidResponse("Feishu batch response record_id_list is malformed");
  }
  if (expectedCount !== null && ids.length !== expectedCount) {
    throw invalidResponse("Feishu batch create response count does not match request");
  }
  if (expectedIds !== null && (ids.length !== expectedIds.length || ids.some((id, index) => id !== expectedIds[index]))) {
    throw invalidResponse("Feishu batch update response IDs do not match request order");
  }
  return ids;
}

function findFieldSpec(tableName, fieldName) {
  const specs = BASE_FIELD_SPECS[tableName];
  if (!specs || typeof fieldName !== "string") {
    fail("base_schema_drift", "Field is not part of the fixed Base schema", { table: tableName ?? null });
  }
  const spec = specs.find((candidate) => candidate.name === fieldName);
  if (!spec) {
    fail("base_schema_drift", "Field is not part of the fixed Base schema", { table: tableName, field: fieldName });
  }
  return spec;
}

function assertBindings(spec, bindings) {
  if (!plainObject(bindings)) {
    fail("base_schema_drift", "Field bindings must be a fixed identifier map", { field: spec.name });
  }
  const allowed = spec.kind === "link" ? ["targetTableId"] : [];
  if (Object.keys(bindings).some((key) => !allowed.includes(key))) {
    fail("base_schema_drift", "Field bindings contain unsupported input", { field: spec.name });
  }
  if (spec.kind === "link" && (typeof bindings.targetTableId !== "string" || bindings.targetTableId.length === 0)) {
    fail("base_schema_drift", "Resolved link table is required", { field: spec.name });
  }
}

function canonicalFieldBody(tableName, spec, bindings = {}) {
  assertBindings(spec, bindings);
  if (spec.kind === "system") return { name: spec.name, type: spec.systemType };
  if (spec.kind === "text") return { name: spec.name, type: "text" };
  if (spec.kind === "url") return { name: spec.name, type: "text", style: { type: "url" } };
  if (spec.kind === "number") return { name: spec.name, type: "number" };
  if (spec.kind === "single_select" || spec.kind === "multi_select") {
    return {
      name: spec.name,
      type: "select",
      multiple: spec.kind === "multi_select",
      ...(spec.options ? { options: spec.options.map((name) => ({ name })) } : {}),
    };
  }
  if (spec.kind === "date" || spec.kind === "datetime") {
    return { name: spec.name, type: "datetime", style: { format: spec.kind === "date" ? "yyyy-MM-dd" : "yyyy-MM-dd HH:mm" } };
  }
  if (spec.kind === "link") {
    const body = { name: spec.name, type: "link", link_table: bindings.targetTableId };
    if (spec.bidirectional) {
      if (typeof spec.reverseField !== "string" || spec.reverseField.length === 0) {
        fail("base_schema_drift", "Bidirectional link reverse field is missing", { field: spec.name });
      }
      body.bidirectional = true;
      body.bidirectional_link_field_name = spec.reverseField;
    }
    return body;
  }
  if (spec.kind === "formula") {
    return { name: spec.name, type: "formula", expression: spec.expression };
  }
  if (spec.kind === "lookup") {
    const linkSpec = findFieldSpec(tableName, spec.linkField);
    if (linkSpec.kind !== "link") fail("base_schema_drift", "Lookup relationship is not a fixed link", { field: spec.name });
    const targetPrimary = TABLES[linkSpec.targetTable]?.primaryField;
    if (!targetPrimary) fail("base_schema_drift", "Lookup target primary field is missing", { field: spec.name });
    return {
      type: "lookup",
      name: spec.name,
      from: linkSpec.targetTable,
      select: spec.sourceField,
      where: {
        logic: "and",
        conditions: [[targetPrimary, "intersects", { type: "field_ref", field: spec.linkField }]],
      },
      aggregate: "raw_value",
    };
  }
  fail("base_schema_drift", "Unsupported fixed field kind", { field: spec.name, kind: spec.kind });
}

export function fixedFieldDescriptor(tableName, fieldName, bindings = {}) {
  return structuredClone(canonicalFieldBody(tableName, findFieldSpec(tableName, fieldName), bindings));
}

const allVisibleFields = (tableName) => BASE_FIELD_SPECS[tableName].map((spec) => spec.name);
const emptyFilter = () => ({ logic: "and", conditions: [] });
const noGrouping = () => [];

const VIEW_SPECS = Object.freeze({
  "账号台账": Object.freeze({
    "在用账号": { filter: { logic: "and", conditions: [["状态", "intersects", ["发布中"]]] }, sort: [{ field: "指标同步时间", desc: true }], group: [{ field: "所属组", desc: false }] },
    "需处理账号": { filter: { logic: "and", conditions: [["同步状态", "intersects", ["partial", "failed"]]] }, sort: [{ field: "指标同步时间", desc: true }], group: [{ field: "所属组", desc: false }] },
  }),
  "选剧池": Object.freeze({
    "未排期": { filter: { logic: "and", conditions: [["是否已排期", "==", "否"]] }, sort: [{ field: "上线日期", desc: true }], group: noGrouping() },
    "已排期": { filter: { logic: "and", conditions: [["是否已排期", "==", "是"]] }, sort: [{ field: "上线日期", desc: true }], group: noGrouping() },
    "按平台": { filter: emptyFilter(), sort: [{ field: "上线日期", desc: true }], group: [{ field: "平台", desc: false }] },
    "按语言": { filter: emptyFilter(), sort: [{ field: "上线日期", desc: true }], group: [{ field: "语言", desc: false }] },
  }),
  "发布记录": Object.freeze({
    "已排期": { filter: { logic: "and", conditions: [["发布状态", "==", "已排期"]] }, sort: [{ field: "播放量", desc: true }], group: noGrouping() },
    "待公开": { filter: { logic: "and", conditions: [["发布状态", "==", "待公开"]] }, sort: [{ field: "播放量", desc: true }], group: noGrouping() },
    "已公开待回填": { filter: { logic: "and", conditions: [["发布状态", "==", "已公开"]] }, sort: [{ field: "播放量", desc: true }], group: noGrouping() },
    "已回填": { filter: { logic: "and", conditions: [["发布状态", "==", "已回填"]] }, sort: [{ field: "播放量", desc: true }], group: noGrouping() },
    "按账号表现": { filter: emptyFilter(), sort: [{ field: "播放量", desc: true }], group: [{ field: "账号名", desc: false }] },
    "按剧表现": { filter: emptyFilter(), sort: [{ field: "播放量", desc: true }], group: [{ field: "剧名", desc: false }] },
  }),
  "采集数据": Object.freeze({
    "完整": { filter: { logic: "and", conditions: [["采集状态", "intersects", ["complete"]]] }, sort: [{ field: "采集时间", desc: true }], group: noGrouping() },
    "部分缺失": { filter: { logic: "and", conditions: [["采集状态", "intersects", ["partial"]]] }, sort: [{ field: "采集时间", desc: true }], group: noGrouping() },
    "未关联发布": { filter: { logic: "and", conditions: [["关联发布记录", "empty"]] }, sort: [{ field: "采集时间", desc: true }], group: noGrouping() },
  }),
});

export function fixedViewDescriptor(tableName, viewName) {
  const spec = typeof viewName === "string" ? VIEW_SPECS[tableName]?.[viewName] : null;
  if (!spec) {
    fail("base_schema_drift", "View is not part of the fixed Base presentation schema", {
      table: tableName ?? null,
      view: typeof viewName === "string" ? viewName : null,
    });
  }
  return {
    name: viewName,
    type: "grid",
    filter: structuredClone(spec.filter),
    sort: { sort_config: structuredClone(spec.sort) },
    group: { group_config: structuredClone(spec.group) },
    visible_fields: { visible_fields: allVisibleFields(tableName) },
  };
}

const performanceSeries = Object.freeze(["播放量", "点赞", "收藏", "转发", "评论", "RS收益"].map(
  (fieldName) => ({ field_name: fieldName, rollup: "SUM" }),
));
const dashboardFilter = (fieldName, value) => ({
  conjunction: "and",
  conditions: [{ field_name: fieldName, operator: "is", value }],
});
const DASHBOARD_BLOCK_SPECS = Object.freeze({
  "活跃账号数": { type: "statistics", data_config: { table_name: "账号台账", count_all: true, filter: dashboardFilter("状态", "发布中") } },
  "待公开数": { type: "statistics", data_config: { table_name: "发布记录", count_all: true, filter: dashboardFilter("发布状态", "待公开") } },
  "待回填数": { type: "statistics", data_config: { table_name: "发布记录", count_all: true, filter: dashboardFilter("发布状态", "已公开") } },
  "按账号最新累计表现": { type: "column", data_config: { table_name: "发布记录", series: performanceSeries, group_by: [{ field_name: "账号名", mode: "integrated" }] } },
  "按剧最新累计表现": { type: "column", data_config: { table_name: "发布记录", series: performanceSeries, group_by: [{ field_name: "剧名", mode: "integrated" }] } },
  "最近一次同步终态": { type: "text", data_config: { text: "尚无成功同步记录" } },
});

export function fixedDashboardBlockDescriptor(blockName) {
  const spec = typeof blockName === "string" ? DASHBOARD_BLOCK_SPECS[blockName] : null;
  if (!spec) fail("base_schema_drift", "Dashboard block is not part of the fixed Base presentation schema");
  return { name: blockName, type: spec.type, data_config: structuredClone(spec.data_config) };
}

export function fixedDashboardDescriptor() {
  return { name: DASHBOARD_NAME, blocks: Object.keys(DASHBOARD_BLOCK_SPECS).map((name) => fixedDashboardBlockDescriptor(name)) };
}

export function fixedTerminalDashboardBlockDescriptor(terminal) {
  if (!plainObject(terminal) || !["success", "partial", "failed"].includes(terminal.state) ||
      typeof terminal.runId !== "string" || terminal.runId.length === 0 || terminal.runId.trim() !== terminal.runId ||
      /[\r\n]/.test(terminal.runId) || typeof terminal.finishedAt !== "string" ||
      !/T.*(?:Z|[+-]\d{2}:\d{2})$/.test(terminal.finishedAt) || !Number.isFinite(Date.parse(terminal.finishedAt)) ||
      Object.keys(terminal).some((key) => !["state", "runId", "finishedAt"].includes(key))) {
    fail("base_response_invalid", "Dashboard terminal state is malformed");
  }
  return {
    name: "最近一次同步终态",
    data_config: {
      text: `**最近一次同步终态**\n状态：${terminal.state}\nrun_id：${terminal.runId}\n完成时间：${terminal.finishedAt}`,
    },
  };
}

function assertFields(fields, context) {
  if (!plainObject(fields) || Object.keys(fields).length === 0) {
    fail("base_response_invalid", `${context} fields must be a non-empty object`);
  }
}

function validateCreateRecords(records) {
  if (!Array.isArray(records) || records.length === 0) fail("base_response_invalid", "Create records must be a non-empty array");
  for (const record of records) {
    if (!plainObject(record) || Object.keys(record).some((key) => key !== "fields")) {
      fail("base_response_invalid", "Create record contains unsupported keys");
    }
    assertFields(record.fields, "Create record");
  }
}

function validateUpdateRecords(records) {
  if (!Array.isArray(records) || records.length === 0) fail("base_response_invalid", "Update records must be a non-empty array");
  for (const record of records) {
    if (!plainObject(record) || Object.keys(record).some((key) => !["record_id", "fields"].includes(key)) ||
        typeof record.record_id !== "string" || record.record_id.length === 0) {
      fail("base_response_invalid", "Update record is malformed");
    }
    assertFields(record.fields, "Update record");
  }
}

async function defaultFetchJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  let payload;
  try {
    payload = await response.json();
  } catch (cause) {
    const error = new SyntaxError("Feishu response was not valid JSON", { cause });
    error.status = response.status;
    error.headers = response.headers;
    throw error;
  }
  if (!plainObject(payload)) return payload;
  return { ...payload, status: response.status, headers: response.headers };
}

export function createTenantTokenProvider({ appId, appSecret, fetchJson = defaultFetchJson, now = Date.now } = {}) {
  if (typeof appId !== "string" || appId.length === 0 || typeof appSecret !== "string" || appSecret.length === 0) {
    fail("base_auth_failed", "Feishu application credentials are required");
  }
  let cachedToken = null;
  let expiresAt = 0;
  let inFlight = null;

  const provider = async () => {
    const currentTime = Number(now());
    if (cachedToken && Number.isFinite(currentTime) && currentTime < expiresAt) return cachedToken;
    if (inFlight) return inFlight;
    inFlight = (async () => {
      let payload;
      try {
        payload = await fetchJson(`${FEISHU_ORIGIN}${AUTH_PATH}`, {
          method: "POST",
          headers: { "content-type": "application/json; charset=utf-8" },
          body: { app_id: appId, app_secret: appSecret },
        });
      } catch (error) {
        if (error instanceof ShortDramaError) throw error;
        if (error instanceof SyntaxError) throw invalidResponse("Feishu authentication response was not valid JSON");
        throw new ShortDramaError("base_auth_failed", "Feishu tenant authentication failed", {
          status: statusOf(error), code: codeOf(error),
        });
      }
      assertPayload(payload);
      if (payload.code !== 0) {
        throw new ShortDramaError("base_auth_failed", "Feishu tenant authentication failed", {
          status: statusOf(payload), code: codeOf(payload),
        });
      }
      if (typeof payload.tenant_access_token !== "string" || payload.tenant_access_token.length === 0 ||
          typeof payload.expire !== "number" || !Number.isFinite(payload.expire) || payload.expire < 0) {
        throw invalidResponse("Feishu authentication response is malformed");
      }
      cachedToken = payload.tenant_access_token;
      expiresAt = Number(now()) + Math.max(0, payload.expire - 300) * 1000;
      return cachedToken;
    })();
    try {
      return await inFlight;
    } finally {
      inFlight = null;
    }
  };
  provider.invalidate = (token) => {
    if (token === undefined || token === cachedToken) {
      cachedToken = null;
      expiresAt = 0;
    }
  };
  return provider;
}

export class FeishuClient {
  constructor({
    tokenProvider,
    fetchJson = defaultFetchJson,
    sleep = defaultSleep,
    logger = null,
    runId = null,
  } = {}) {
    if (typeof tokenProvider !== "function") fail("base_auth_failed", "Feishu token provider is required");
    if (typeof fetchJson !== "function" || typeof sleep !== "function") {
      fail("base_response_invalid", "Feishu client dependencies must be functions");
    }
    this.tokenProvider = tokenProvider;
    this.fetchJson = fetchJson;
    this.sleep = sleep;
    this.logger = typeof logger === "function" ? logger : null;
    this.runId = runId;
    this.writeQueues = new Map();
  }

  log(method, path, status) {
    this.logger?.({ method, path: diagnosticPath(path), status, run_id: this.runId });
  }

  async operation(callback, { signal } = {}) {
    assertNotAborted(signal);
    const token = validateToken(await awaitWithAbort(this.tokenProvider(), signal));
    assertNotAborted(signal);
    return callback({ token, authRetried: false });
  }

  async serializeWrite(key, callback, { signal } = {}) {
    assertNotAborted(signal);
    const previous = this.writeQueues.get(key) ?? Promise.resolve();
    const run = previous.catch(() => {}).then(() => {
      assertNotAborted(signal);
      return callback();
    });
    const tail = run.then(() => undefined, () => undefined);
    this.writeQueues.set(key, tail);
    void tail.then(() => {
      if (this.writeQueues.get(key) === tail) this.writeQueues.delete(key);
    });
    return await awaitWithAbort(run, signal);
  }

  async request(path, { method = "GET", body = undefined, context = undefined, signal = undefined } = {}) {
    if (typeof path !== "string" || !path.startsWith(BASE_V3_PREFIX) || path.includes("://")) {
      fail("base_response_invalid", "Only fixed Feishu Base v3 API paths are allowed");
    }
    assertNotAborted(signal);
    if (!context) return this.operation(
      (operationContext) => this.request(path, { method, body, context: operationContext, signal }),
      { signal },
    );

    for (let attempt = 1; attempt <= MAX_REQUEST_ATTEMPTS; attempt += 1) {
      let payload;
      try {
        assertNotAborted(signal);
        payload = await awaitWithAbort(this.fetchJson(`${FEISHU_ORIGIN}${path}`, {
          method,
          headers: {
            authorization: `Bearer ${context.token}`,
            "content-type": "application/json; charset=utf-8",
          },
          body,
          signal,
        }), signal);
        assertNotAborted(signal);
      } catch (error) {
        assertNotAborted(signal);
        this.log(method, path, statusOf(error) ?? "error");
        if (isRateLimited(error) && attempt < MAX_REQUEST_ATTEMPTS) {
          await awaitWithAbort(this.sleep(retryDelay(error, attempt), { signal }), signal);
          continue;
        }
        if (isAuthorizationFailure(error) && !context.authRetried && attempt < MAX_REQUEST_ATTEMPTS) {
          context.authRetried = true;
          this.tokenProvider.invalidate?.(context.token);
          context.token = validateToken(await awaitWithAbort(this.tokenProvider(), signal));
          assertNotAborted(signal);
          continue;
        }
        if (error instanceof SyntaxError) throw invalidResponse("Feishu response was not valid JSON", { path: diagnosticPath(path) });
        if (error instanceof ShortDramaError) throw error;
        throw mappedFailure(error, path, attempt);
      }

      assertPayload(payload, path);
      const status = statusOf(payload) ?? (payload.code === 0 ? 200 : payload.code);
      this.log(method, path, status);
      if (payload.code === 0 && (statusOf(payload) === null || statusOf(payload) < 400)) {
        if (method !== "GET" && hasIgnoredFields(payload.data)) {
          throw invalidResponse("Feishu write response reports ignored fields", { path: diagnosticPath(path) });
        }
        return payload;
      }
      if (isRateLimited(payload) && attempt < MAX_REQUEST_ATTEMPTS) {
        await awaitWithAbort(this.sleep(retryDelay(payload, attempt), { signal }), signal);
        continue;
      }
      if (isAuthorizationFailure(payload) && !context.authRetried && attempt < MAX_REQUEST_ATTEMPTS) {
        context.authRetried = true;
        this.tokenProvider.invalidate?.(context.token);
        context.token = validateToken(await awaitWithAbort(this.tokenProvider(), signal));
        assertNotAborted(signal);
        continue;
      }
      throw mappedFailure(payload, path, attempt);
    }
    throw new ShortDramaError("base_request_failed", "Feishu Base request attempt budget exhausted", { path: diagnosticPath(path) });
  }

  async list(path, { mode = "offset", pageSize = 200, resource = "items", tableName = null, writableOnly = false, selectFields = [], signal = undefined } = {}) {
    if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 200) {
      fail("base_response_invalid", "Feishu list page size is invalid");
    }
    return this.operation(async (context) => {
      const items = [];
      const seenCursors = new Set();
      let cursor = mode === "offset" ? "0" : "";
      let revision;
      let revisionObserved = false;
      const recordMetadataBaselines = new Map();
      do {
        assertNotAborted(signal);
        const query = new URLSearchParams(mode === "token" ? { page_size: String(pageSize) } : { limit: String(pageSize) });
        for (const field of selectFields) query.append("field_id", field);
        if (cursor || mode === "offset") query.set(mode === "token" ? "page_token" : "offset", cursor);
        const payload = await this.request(`${path}?${query}`, { context, signal });
        assertNotAborted(signal);
        if (!plainObject(payload.data)) throw invalidResponse("Feishu list response data must be an object", { path: diagnosticPath(path) });
        const vendorRecords = resource === "records" && payload.data.record_id_list !== undefined;
        if (vendorRecords && payload.data.items !== undefined) {
          throw invalidResponse("Feishu records response is ambiguous", { path: diagnosticPath(path) });
        }
        const decoded = vendorRecords
          ? decodedRecordMatrix(payload.data, {
            tableName, writableOnly, projectionActive: selectFields.length > 0, strictList: typeof tableName === "string",
          })
          : null;
        const pageItems = decoded ? decoded.records : normalizedResourceItems(payload.data, resource);
        if (decoded?.signature) {
          for (const [key, value] of Object.entries(decoded.signature)) {
            if (recordMetadataBaselines.has(key) && JSON.stringify(recordMetadataBaselines.get(key)) !== JSON.stringify(value)) {
              throw invalidResponse("Feishu record list schema changed during pagination", { path: diagnosticPath(path) });
            }
            if (!recordMetadataBaselines.has(key)) recordMetadataBaselines.set(key, structuredClone(value));
          }
        }
        const pageRevision = vendorRecords ? payload.data.rev ?? null : payload.data.revision ?? payload.data.revision_id ?? null;
        if (pageRevision !== null) {
          if (revisionObserved && pageRevision !== revision) {
            throw invalidResponse("Feishu list revision changed during pagination", { path: diagnosticPath(path) });
          }
          revision = pageRevision;
          revisionObserved = true;
        }
        items.push(...pageItems);
        let hasMore;
        let rawCursor;
        const vendorOffset = mode === "offset" && (vendorRecords || payload.data[resource] !== undefined);
        if (vendorRecords && mode === "offset" && payload.data.total === undefined) {
          const offset = Number(cursor);
          if (!Number.isSafeInteger(offset) || offset < 0 || typeof payload.data.has_more !== "boolean") {
            throw invalidResponse("Feishu record pagination is malformed", { path: diagnosticPath(path) });
          }
          hasMore = payload.data.has_more;
          if (hasMore && pageItems.length === 0) {
            throw invalidResponse("Feishu pagination made no progress", { path: diagnosticPath(path) });
          }
          rawCursor = String(offset + pageItems.length);
        } else if (vendorOffset) {
          const total = payload.data.total;
          const offset = Number(cursor);
          if (!Number.isSafeInteger(total) || total < 0 || !Number.isSafeInteger(offset) || offset < 0 ||
              offset + pageItems.length > total) {
            throw invalidResponse("Feishu offset/total pagination is malformed", { path: diagnosticPath(path) });
          }
          hasMore = offset + pageItems.length < total;
          if (payload.data.has_more !== undefined &&
              (typeof payload.data.has_more !== "boolean" || payload.data.has_more !== hasMore)) {
            throw invalidResponse("Feishu has_more contradicts offset/total completeness", { path: diagnosticPath(path) });
          }
          if (hasMore && pageItems.length === 0) throw invalidResponse("Feishu pagination made no progress", { path: diagnosticPath(path) });
          rawCursor = String(offset + pageItems.length);
        } else {
          if (typeof payload.data.has_more !== "boolean") {
            throw invalidResponse("Feishu list response has_more must be boolean", { path: diagnosticPath(path) });
          }
          hasMore = payload.data.has_more;
          rawCursor = mode === "token" ? payload.data.page_token : (payload.data.offset ?? payload.data.next_offset);
        }
        if (!hasMore) {
          cursor = "";
          continue;
        }
        if ((typeof rawCursor !== "string" && typeof rawCursor !== "number") || String(rawCursor).length === 0 ||
            seenCursors.has(String(rawCursor))) {
          throw invalidResponse(`Feishu list response ${mode === "token" ? "page_token" : "offset"} is missing or repeated`, { path: diagnosticPath(path) });
        }
        cursor = String(rawCursor);
        seenCursors.add(cursor);
      } while (cursor);
      return { items, complete: true, revision: revision ?? null };
    }, { signal });
  }

  basePath(baseToken) {
    return `/open-apis/base/v3/bases/${encoded(baseToken)}`;
  }

  async getTable(baseToken, tableId, { signal } = {}) {
    return this.operation(async (context) => {
      const payload = await this.request(
        `${this.basePath(baseToken)}/tables/${encoded(tableId)}`,
        { context, signal },
      );
      const table = requireEntity(payload, "table", "table_id");
      if (table.table_id !== tableId || typeof table.name !== "string" || table.name.length === 0 ||
          typeof table.primary_field !== "string" || table.primary_field.length === 0) {
        throw invalidResponse("Feishu table detail is incomplete");
      }
      return table;
    }, { signal });
  }

  listTables(baseToken, { signal } = {}) {
    return this.list(`${this.basePath(baseToken)}/tables`, { pageSize: 100, resource: "tables", signal });
  }

  listFields(baseToken, tableId, { signal } = {}) {
    return this.list(`${this.basePath(baseToken)}/tables/${encoded(tableId)}/fields`, { resource: "fields", signal });
  }

  listRecords(baseToken, tableId, { tableName = null, writableOnly = false, selectFields = null, signal } = {}) {
    if (selectFields !== null && writableOnly) throw invalidResponse("Explicit and writable-only record projections cannot be combined");
    const projection = selectFields === null
      ? writableOnly && typeof tableName === "string"
        ? BASE_FIELD_SPECS[tableName].filter((spec) => fieldOwner(tableName, spec.name) !== "derived").map((spec) => spec.name)
        : []
      : recordProjection(selectFields);
    return this.list(`${this.basePath(baseToken)}/tables/${encoded(tableId)}/records`, {
      resource: "records", tableName, writableOnly, selectFields: projection, signal,
    });
  }

  listViews(baseToken, tableId, { signal } = {}) {
    return this.list(`${this.basePath(baseToken)}/tables/${encoded(tableId)}/views`, { resource: "views", signal });
  }

  listDashboards(baseToken, { signal } = {}) {
    return this.list(`${this.basePath(baseToken)}/dashboards`, { mode: "token", pageSize: 100, resource: "items", signal });
  }

  listDashboardBlocks(baseToken, dashboardId, { signal } = {}) {
    return this.list(`${this.basePath(baseToken)}/dashboards/${encoded(dashboardId)}/blocks`, { mode: "token", pageSize: 100, resource: "items", signal });
  }

  async getRecord(baseToken, tableId, recordId, { tableName = null, waitForVisibility = false, selectFields = [], signal } = {}) {
    if (typeof waitForVisibility !== "boolean" || waitForVisibility && !TABLES[tableName]) {
      throw invalidResponse("Feishu record visibility options are invalid");
    }
    const projection = recordProjection(selectFields);
    if (waitForVisibility && projection.length > 0 && !projection.includes(TABLES[tableName].primaryField)) {
      throw invalidResponse("Feishu visibility projection must include the fixed primary field");
    }
    return this.operation(async (context) => {
      const path = `${this.basePath(baseToken)}/tables/${encoded(tableId)}/records/batch_get`;
      const attempts = waitForVisibility ? MAX_RECORD_VISIBILITY_ATTEMPTS : 1;
      const primaryField = waitForVisibility ? TABLES[tableName].primaryField : null;
      for (let attempt = 1; attempt <= attempts; attempt += 1) {
        const payload = await this.request(path, {
          method: "POST",
          body: { record_id_list: [recordId], ...(projection.length > 0 ? { select_fields: projection } : {}) },
          context,
          signal,
        });
        const decoded = decodedRecordMatrix(payload.data, { tableName });
        if (decoded.records.length !== 1 || decoded.records[0].record_id !== recordId) {
          throw invalidResponse("Feishu record response is malformed");
        }
        if (decoded.recordNotFound.length > 0) {
          if (decoded.recordNotFound.length !== 1 || decoded.recordNotFound[0] !== recordId) {
            throw invalidResponse("Feishu record_not_found metadata does not match the requested record");
          }
        }
        const record = decoded.records[0];
        if (waitForVisibility && !Object.hasOwn(record.fields, primaryField)) {
          throw invalidResponse("Feishu record visibility readback omitted the fixed primary field");
        }
        const pending = decoded.recordNotFound.length === 1 || waitForVisibility && record.fields[primaryField] === null;
        if (!pending) return record;
        if (attempt === attempts) {
          throw new ShortDramaError("readback_mismatch", "Feishu record remained unavailable after bounded visibility polling", {
            path: diagnosticPath(path), attempts: attempt,
          });
        }
        await awaitWithAbort(this.sleep(attempt * 1_000, { signal }), signal);
      }
      throw new ShortDramaError("readback_mismatch", "Feishu record visibility polling exhausted unexpectedly");
    }, { signal });
  }

  createRecords(baseToken, tableId, records, { tableName = null, signal } = {}) {
    validateCreateRecords(records);
    const queueKey = `records:${baseToken}:${tableId}`;
    return this.serializeWrite(queueKey, () => this.operation(async (context) => {
      const written = [];
      for (let start = 0; start < records.length; start += MAX_WRITE_BATCH) {
        assertNotAborted(signal);
        const group = records.slice(start, start + MAX_WRITE_BATCH);
        const body = { create_records: group.map((record) => encodeFields(tableName, record.fields)) };
        const payload = await this.request(
          `${this.basePath(baseToken)}/tables/${encoded(tableId)}/records/batch_create`,
          { method: "POST", body, context, signal },
        );
        assertNotAborted(signal);
        const ids = payload.data?.record_id_list === undefined ? null : requireRecordIds(payload, null, group.length);
        if (ids === null && hasIgnoredFields(payload.data)) throw invalidResponse("Feishu batch create reports ignored fields");
        written.push(...group.map((record, index) => ({ record_id: ids?.[index] ?? null, fields: record.fields })));
      }
      return written;
    }, { signal }), { signal });
  }

  updateRecords(baseToken, tableId, records, { tableName = null, signal } = {}) {
    validateUpdateRecords(records);
    const queueKey = `records:${baseToken}:${tableId}`;
    return this.serializeWrite(queueKey, () => this.operation(async (context) => {
      const written = [];
      for (let start = 0; start < records.length; start += MAX_WRITE_BATCH) {
        assertNotAborted(signal);
        const group = records.slice(start, start + MAX_WRITE_BATCH);
        const ids = group.map((record) => record.record_id);
        const body = { update_records: Object.fromEntries(group.map((record) => [record.record_id, encodeFields(tableName, record.fields)])) };
        const payload = await this.request(
          `${this.basePath(baseToken)}/tables/${encoded(tableId)}/records/batch_update`,
          { method: "POST", body, context, signal },
        );
        assertNotAborted(signal);
        if (payload.data?.record_id_list !== undefined) requireRecordIds(payload, ids);
        if (hasIgnoredFields(payload.data)) throw invalidResponse("Feishu batch update reports ignored fields");
        written.push(...group);
      }
      return written;
    }, { signal }), { signal });
  }

  deleteCanaryRecords(baseToken, tableId, tableName, recordIds, { canaryId = null, signal } = {}) {
    if (!TABLE_ORDER.includes(tableName) || !Array.isArray(recordIds) || recordIds.length !== 1 ||
        typeof recordIds[0] !== "string" || recordIds[0].length === 0 || recordIds[0].trim() !== recordIds[0] ||
        typeof canaryId !== "string" || !CANARY_PRIMARY.test(canaryId)) {
      fail("canary_target_invalid", "Canary cleanup accepts exactly one fixed-table record ID");
    }
    const recordId = recordIds[0];
    const primaryField = TABLES[tableName].primaryField;
    const queueKey = `records:${baseToken}:${tableId}`;
    return this.serializeWrite(queueKey, async () => {
      const record = await this.getRecord(baseToken, tableId, recordId, {
        tableName, waitForVisibility: true, selectFields: [primaryField], signal,
      });
      if (!plainObject(record) || record.record_id !== recordId || !plainObject(record.fields) ||
          record.fields[primaryField] !== canaryId) {
        fail("canary_target_invalid", "Canary cleanup target did not read back as the fixed canary record", {
          table: tableName,
        });
      }
      return this.operation(async (context) => {
        const payload = await this.request(
          `${this.basePath(baseToken)}/tables/${encoded(tableId)}/records/batch_delete`,
          { method: "POST", body: { record_id_list: [recordId] }, context, signal },
        );
        requireRecordIds(payload, [recordId]);
        return [recordId];
      }, { signal });
    }, { signal });
  }

  async createField(baseToken, tableId, tableName, fieldName, bindings = {}, { signal } = {}) {
    const spec = findFieldSpec(tableName, fieldName);
    if (spec.managedReverseOf) {
      fail("base_schema_drift", "Managed reverse links are created only with their bidirectional owner", {
        table: tableName,
        field: fieldName,
        owner: spec.managedReverseOf,
      });
    }
    if (spec.primary) {
      fail("base_schema_drift", "Primary fields must be created with the table or recovered through updateField", { field: fieldName });
    }
    const body = canonicalFieldBody(tableName, spec, bindings);
    return this.serializeWrite(`schema:${baseToken}:${tableId}`, () => this.operation(async (context) => {
      const payload = await this.request(
        `${this.basePath(baseToken)}/tables/${encoded(tableId)}/fields`,
        { method: "POST", body, context, signal },
      );
      return requireEntity(payload, "field", "field_id");
    }, { signal }), { signal });
  }

  async updateField(baseToken, tableId, fieldId, tableName, fieldName, { signal } = {}) {
    const spec = findFieldSpec(tableName, fieldName);
    if (!spec.primary || spec.name !== TABLES[tableName].primaryField) {
      fail("base_schema_drift", "updateField is reserved for fixed primary-field recovery", { field: fieldName });
    }
    const body = canonicalFieldBody(tableName, spec);
    return this.serializeWrite(`schema:${baseToken}:${tableId}`, () => this.operation(async (context) => {
      const payload = await this.request(
        `${this.basePath(baseToken)}/tables/${encoded(tableId)}/fields/${encoded(fieldId)}`,
        { method: "PUT", body, context, signal },
      );
      return requireEntity(payload, "field", "field_id");
    }, { signal }), { signal });
  }

  async createView(baseToken, tableId, tableName, viewName, { signal } = {}) {
    const view = fixedViewDescriptor(tableName, viewName);
    const body = { name: view.name, type: view.type };
    return this.serializeWrite(`presentation:${baseToken}:${tableId}`, () => this.operation(async (context) => {
      const payload = await this.request(
        `${this.basePath(baseToken)}/tables/${encoded(tableId)}/views`,
        { method: "POST", body, context, signal },
      );
      return requireEntity(payload, "view", "view_id");
    }, { signal }), { signal });
  }

  async updateView(baseToken, tableId, viewId, tableName, viewName, { signal } = {}) {
    const view = fixedViewDescriptor(tableName, viewName);
    return this.serializeWrite(`presentation:${baseToken}:${tableId}`, () => this.operation(async (context) => {
      const root = `${this.basePath(baseToken)}/tables/${encoded(tableId)}/views/${encoded(viewId)}`;
      for (const part of ["filter", "sort", "group", "visible_fields"]) {
        assertNotAborted(signal);
        await this.request(`${root}/${part}`, { method: "PUT", body: view[part], context, signal });
      }
      return { view_id: viewId, name: view.name, configured: true };
    }, { signal }), { signal });
  }

  readViewConfiguration(baseToken, tableId, viewId, tableName, viewName, { fields, signal } = {}) {
    fixedViewDescriptor(tableName, viewName);
    return this.operation(async (context) => {
      const root = `${this.basePath(baseToken)}/tables/${encoded(tableId)}/views/${encoded(viewId)}`;
      const result = {};
      for (const part of ["filter", "sort", "group", "visible_fields"]) {
        assertNotAborted(signal);
        const payload = await this.request(`${root}/${part}`, { context, signal });
        if (plainObject(payload.data?.[part])) {
          result[part] = structuredClone(payload.data[part]);
          continue;
        }
        if (part === "filter" && plainObject(payload.data)) result.filter = structuredClone(payload.data);
        else if (part !== "filter" && Array.isArray(payload.data)) {
          const key = part === "visible_fields" ? "visible_fields" : `${part}_config`;
          result[part] = { [key]: structuredClone(payload.data) };
        } else throw invalidResponse(`Feishu view ${part} response is malformed`);
      }
      return normalizeViewConfiguration(result, fields);
    }, { signal });
  }

  async createDashboard(baseToken, dashboardName, { signal } = {}) {
    if (dashboardName !== DASHBOARD_NAME) {
      fail("base_schema_drift", "Dashboard is not part of the fixed Base presentation schema");
    }
    return this.serializeWrite(`dashboard:${baseToken}`, () => this.operation(async (context) => {
      const payload = await this.request(`${this.basePath(baseToken)}/dashboards`, {
        method: "POST", body: { name: DASHBOARD_NAME }, context, signal,
      });
      return requireEntity(payload, "dashboard", "dashboard_id");
    }, { signal }), { signal });
  }

  async createDashboardBlock(baseToken, dashboardId, blockName, { signal } = {}) {
    const body = fixedDashboardBlockDescriptor(blockName);
    return this.serializeWrite(`dashboard:${baseToken}:${dashboardId}`, () => this.operation(async (context) => {
      const payload = await this.request(
        `${this.basePath(baseToken)}/dashboards/${encoded(dashboardId)}/blocks`,
        { method: "POST", body, context, signal },
      );
      return requireEntity(payload, "block", "block_id");
    }, { signal }), { signal });
  }

  readDashboardBlock(baseToken, dashboardId, blockId, blockName, { signal } = {}) {
    fixedDashboardBlockDescriptor(blockName);
    return this.operation(async (context) => {
      const payload = await this.request(
        `${this.basePath(baseToken)}/dashboards/${encoded(dashboardId)}/blocks/${encoded(blockId)}`,
        { context, signal },
      );
      const block = payload.data?.block ?? payload.data;
      if (!plainObject(block) || block.block_id !== blockId || block.name !== blockName || typeof block.type !== "string" || !plainObject(block.data_config)) {
        throw invalidResponse("Feishu dashboard block response is malformed");
      }
      return structuredClone(block);
    }, { signal });
  }

  updateDashboardBlock(baseToken, dashboardId, blockId, blockName, { signal } = {}) {
    const fixed = fixedDashboardBlockDescriptor(blockName);
    const body = { name: fixed.name, data_config: fixed.data_config };
    return this.serializeWrite(`dashboard:${baseToken}:${dashboardId}`, () => this.operation(async (context) => {
      const payload = await this.request(
        `${this.basePath(baseToken)}/dashboards/${encoded(dashboardId)}/blocks/${encoded(blockId)}`,
        { method: "PATCH", body, context, signal },
      );
      const block = requireEntity(payload, "block", "block_id");
      if (block.block_id !== blockId) throw invalidResponse("Feishu dashboard block response ID does not match request");
      return block;
    }, { signal }), { signal });
  }

  updateDashboardTerminalBlock(baseToken, dashboardId, blockId, terminal, { signal } = {}) {
    const body = fixedTerminalDashboardBlockDescriptor(terminal);
    return this.serializeWrite(`dashboard:${baseToken}:${dashboardId}`, () => this.operation(async (context) => {
      const payload = await this.request(
        `${this.basePath(baseToken)}/dashboards/${encoded(dashboardId)}/blocks/${encoded(blockId)}`,
        { method: "PATCH", body, context, signal },
      );
      const block = requireEntity(payload, "block", "block_id");
      if (block.block_id !== blockId) {
        throw invalidResponse("Feishu dashboard block response ID does not match request");
      }
      return block;
    }, { signal }), { signal });
  }
}
