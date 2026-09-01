import { ShortDramaError } from "./errors.mjs";
import { BASE_FIELD_SPECS, TABLE_ORDER, TABLES } from "./schema.mjs";

const FEISHU_ORIGIN = "https://open.feishu.cn";
const AUTH_PATH = "/open-apis/auth/v3/tenant_access_token/internal";
const BASE_V3_PREFIX = "/open-apis/base/v3/";
const MAX_WRITE_BATCH = 200;
const MAX_REQUEST_ATTEMPTS = 3;
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

function mappedFailure(value, path) {
  const details = { code: codeOf(value), status: statusOf(value), path: diagnosticPath(path) };
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
  if (!plainObject(entity) || typeof entity[idName] !== "string" || entity[idName].length === 0) {
    throw invalidResponse(`Feishu ${entityName} response is missing ${idName}`);
  }
  return entity;
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
    return { name: spec.name, type: "select", multiple: spec.kind === "multi_select" };
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

function firstSeenFields(records) {
  const fields = [];
  const seen = new Set();
  for (const record of records) {
    for (const field of Object.keys(record.fields)) {
      if (!seen.has(field)) {
        seen.add(field);
        fields.push(field);
      }
    }
  }
  return fields;
}

function transposeCreateGroup(records, fields) {
  return { fields, rows: records.map((record) => fields.map((field) => Object.hasOwn(record.fields, field) ? record.fields[field] : null)) };
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (plainObject(value)) return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableValue(value[key])]));
  return value;
}

function patchKey(patch) {
  return JSON.stringify(stableValue(patch));
}

function contiguousUpdateGroups(records) {
  const groups = [];
  let group = null;
  for (const record of records) {
    const key = patchKey(record.fields);
    if (!group || group.key !== key || group.records.length === MAX_WRITE_BATCH) {
      group = { key, patch: record.fields, records: [] };
      groups.push(group);
    }
    group.records.push(record);
  }
  return groups;
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
        throw mappedFailure(error, path);
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
      throw mappedFailure(payload, path);
    }
    throw new ShortDramaError("base_request_failed", "Feishu Base request attempt budget exhausted", { path: diagnosticPath(path) });
  }

  async list(path, { mode = "offset", pageSize = 200, signal = undefined } = {}) {
    if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 200) {
      fail("base_response_invalid", "Feishu list page size is invalid");
    }
    return this.operation(async (context) => {
      const items = [];
      const seenCursors = new Set();
      let cursor = "";
      let revision;
      let revisionObserved = false;
      do {
        assertNotAborted(signal);
        const query = new URLSearchParams(mode === "token" ? { page_size: String(pageSize) } : { limit: String(pageSize) });
        if (cursor) query.set(mode === "token" ? "page_token" : "offset", cursor);
        const payload = await this.request(`${path}?${query}`, { context, signal });
        assertNotAborted(signal);
        if (!plainObject(payload.data) || !Array.isArray(payload.data.items)) {
          throw invalidResponse("Feishu list response items must be an array", { path: diagnosticPath(path) });
        }
        if (typeof payload.data.has_more !== "boolean") {
          throw invalidResponse("Feishu list response has_more must be boolean", { path: diagnosticPath(path) });
        }
        const pageRevision = payload.data.revision ?? payload.data.revision_id ?? null;
        if (revisionObserved && pageRevision !== revision) {
          throw invalidResponse("Feishu list revision changed during pagination", { path: diagnosticPath(path) });
        }
        revision = pageRevision;
        revisionObserved = true;
        items.push(...payload.data.items);
        if (!payload.data.has_more) {
          cursor = "";
          continue;
        }
        const rawCursor = mode === "token"
          ? payload.data.page_token
          : (payload.data.offset ?? payload.data.next_offset);
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

  listTables(baseToken, { signal } = {}) {
    return this.list(`${this.basePath(baseToken)}/tables`, { pageSize: 100, signal });
  }

  listFields(baseToken, tableId, { signal } = {}) {
    return this.list(`${this.basePath(baseToken)}/tables/${encoded(tableId)}/fields`, { signal });
  }

  listRecords(baseToken, tableId, { signal } = {}) {
    return this.list(`${this.basePath(baseToken)}/tables/${encoded(tableId)}/records`, { signal });
  }

  listViews(baseToken, tableId, { signal } = {}) {
    return this.list(`${this.basePath(baseToken)}/tables/${encoded(tableId)}/views`, { signal });
  }

  listDashboards(baseToken, { signal } = {}) {
    return this.list(`${this.basePath(baseToken)}/dashboards`, { mode: "token", pageSize: 100, signal });
  }

  listDashboardBlocks(baseToken, dashboardId, { signal } = {}) {
    return this.list(`${this.basePath(baseToken)}/dashboards/${encoded(dashboardId)}/blocks`, { mode: "token", pageSize: 100, signal });
  }

  async getRecord(baseToken, tableId, recordId, { signal } = {}) {
    return this.operation(async (context) => {
      const payload = await this.request(
        `${this.basePath(baseToken)}/tables/${encoded(tableId)}/records/${encoded(recordId)}`,
        { context, signal },
      );
      if (!plainObject(payload.data?.record) || typeof payload.data.record.record_id !== "string" ||
          payload.data.record.record_id.length === 0) {
        throw invalidResponse("Feishu record response is malformed");
      }
      return payload.data.record;
    }, { signal });
  }

  createRecords(baseToken, tableId, records, { signal } = {}) {
    validateCreateRecords(records);
    const queueKey = `records:${baseToken}:${tableId}`;
    return this.serializeWrite(queueKey, () => this.operation(async (context) => {
      const written = [];
      const fields = firstSeenFields(records);
      for (let start = 0; start < records.length; start += MAX_WRITE_BATCH) {
        assertNotAborted(signal);
        const group = records.slice(start, start + MAX_WRITE_BATCH);
        const body = transposeCreateGroup(group, fields);
        const payload = await this.request(
          `${this.basePath(baseToken)}/tables/${encoded(tableId)}/records/batch_create`,
          { method: "POST", body, context, signal },
        );
        assertNotAborted(signal);
        const ids = requireRecordIds(payload, null, group.length);
        written.push(...group.map((record, index) => ({ record_id: ids[index], fields: record.fields })));
      }
      return written;
    }, { signal }), { signal });
  }

  updateRecords(baseToken, tableId, records, { signal } = {}) {
    validateUpdateRecords(records);
    const queueKey = `records:${baseToken}:${tableId}`;
    return this.serializeWrite(queueKey, () => this.operation(async (context) => {
      const written = [];
      for (const group of contiguousUpdateGroups(records)) {
        assertNotAborted(signal);
        const ids = group.records.map((record) => record.record_id);
        const payload = await this.request(
          `${this.basePath(baseToken)}/tables/${encoded(tableId)}/records/batch_update`,
          { method: "POST", body: { record_id_list: ids, patch: group.patch }, context, signal },
        );
        assertNotAborted(signal);
        requireRecordIds(payload, ids);
        written.push(...group.records);
      }
      return written;
    }, { signal }), { signal });
  }

  deleteCanaryRecords(baseToken, tableId, tableName, recordIds, { signal } = {}) {
    if (!TABLE_ORDER.includes(tableName) || !Array.isArray(recordIds) || recordIds.length !== 1 ||
        typeof recordIds[0] !== "string" || recordIds[0].length === 0 || recordIds[0].trim() !== recordIds[0]) {
      fail("canary_target_invalid", "Canary cleanup accepts exactly one fixed-table record ID");
    }
    const recordId = recordIds[0];
    const primaryField = TABLES[tableName].primaryField;
    const queueKey = `records:${baseToken}:${tableId}`;
    return this.serializeWrite(queueKey, () => this.operation(async (context) => {
      const readback = await this.request(
        `${this.basePath(baseToken)}/tables/${encoded(tableId)}/records/${encoded(recordId)}`,
        { context, signal },
      );
      const record = readback.data?.record;
      if (!plainObject(record) || record.record_id !== recordId || !plainObject(record.fields) ||
          typeof record.fields[primaryField] !== "string" || !CANARY_PRIMARY.test(record.fields[primaryField])) {
        fail("canary_target_invalid", "Canary cleanup target did not read back as the fixed canary record", {
          table: tableName,
        });
      }
      const payload = await this.request(
        `${this.basePath(baseToken)}/tables/${encoded(tableId)}/records/batch_delete`,
        { method: "POST", body: { record_id_list: [recordId] }, context, signal },
      );
      requireRecordIds(payload, [recordId]);
      return [recordId];
    }, { signal }), { signal });
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

  readViewConfiguration(baseToken, tableId, viewId, tableName, viewName, { signal } = {}) {
    fixedViewDescriptor(tableName, viewName);
    return this.operation(async (context) => {
      const root = `${this.basePath(baseToken)}/tables/${encoded(tableId)}/views/${encoded(viewId)}`;
      const result = {};
      for (const part of ["filter", "sort", "group", "visible_fields"]) {
        assertNotAborted(signal);
        const payload = await this.request(`${root}/${part}`, { context, signal });
        if (!plainObject(payload.data?.[part])) throw invalidResponse(`Feishu view ${part} response is malformed`);
        result[part] = structuredClone(payload.data[part]);
      }
      return result;
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
      const block = payload.data?.block;
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
    if (!plainObject(terminal) || !["success", "partial", "failed"].includes(terminal.state) ||
        typeof terminal.runId !== "string" || terminal.runId.length === 0 || terminal.runId.trim() !== terminal.runId ||
        /[\r\n]/.test(terminal.runId) || typeof terminal.finishedAt !== "string" ||
        !/T.*(?:Z|[+-]\d{2}:\d{2})$/.test(terminal.finishedAt) || !Number.isFinite(Date.parse(terminal.finishedAt)) ||
        Object.keys(terminal).some((key) => !["state", "runId", "finishedAt"].includes(key))) {
      fail("base_response_invalid", "Dashboard terminal state is malformed");
    }
    const body = {
      name: "最近一次同步终态",
      data_config: {
        text: `**最近一次同步终态**\n状态：${terminal.state}\nrun_id：${terminal.runId}\n完成时间：${terminal.finishedAt}`,
      },
    };
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
