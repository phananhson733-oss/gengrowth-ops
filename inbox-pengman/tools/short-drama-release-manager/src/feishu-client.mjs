import { ShortDramaError } from "./errors.mjs";
import { BASE_FIELD_SPECS, TABLE_ORDER } from "./schema.mjs";

const FEISHU_ORIGIN = "https://open.feishu.cn";
const AUTH_PATH = "/open-apis/auth/v3/tenant_access_token/internal";
const BITABLE_PREFIX = "/open-apis/bitable/v1/";
const MAX_PAGE_SIZE = 200;
const MAX_RATE_ATTEMPTS = 3;
const AUTH_ERROR_CODES = new Set([99991663, 99991664, 99991668, 99991671, 99991672]);
const SCHEMA_ERROR_CODES = new Set([1254044, 1254045, 1254060, 1254061, 1254062]);

const FIELD_TYPES = Object.freeze({
  text: 1,
  number: 2,
  single_select: 3,
  multi_select: 4,
  date: 5,
  datetime: 5,
  url: 15,
  link: 21,
  lookup: 19,
  formula: 20,
});

const SYSTEM_FIELD_TYPES = Object.freeze({
  created_time: 1001,
  last_modified_time: 1002,
  created_by: 1003,
  last_successful_sync_time: 5,
});

const VIEW_SPECS = Object.freeze({
  "账号台账": Object.freeze(["在用账号", "需处理账号"]),
  "选剧池": Object.freeze(["未排期", "已排期", "按平台", "按语言"]),
  "发布记录": Object.freeze(["已排期", "待公开", "已公开待回填", "已回填", "按账号表现", "按剧表现"]),
  "采集数据": Object.freeze(["完整", "部分缺失", "未关联发布"]),
});

const DASHBOARD_NAMES = new Set(["短剧发行总览"]);
const DASHBOARD_BLOCK_NAMES = new Set([
  "活跃账号数",
  "待公开数",
  "待回填数",
  "按账号最新累计表现",
  "按剧最新累计表现",
  "最近一次同步终态",
]);

const batches = (rows, size = MAX_PAGE_SIZE) =>
  Array.from({ length: Math.ceil(rows.length / size) }, (_unused, index) =>
    rows.slice(index * size, (index + 1) * size));

function fail(code, message, details = {}) {
  throw new ShortDramaError(code, message, details);
}

function encoded(value) {
  if (typeof value !== "string" || value.length === 0) {
    fail("base_response_invalid", "Feishu identifier must be a non-empty string");
  }
  return encodeURIComponent(value);
}

function headerValue(headers, name) {
  if (!headers) return undefined;
  if (typeof headers.get === "function") return headers.get(name);
  const target = name.toLowerCase();
  const entry = Object.entries(headers).find(([key]) => key.toLowerCase() === target);
  return entry?.[1];
}

function statusOf(value) {
  const status = Number(value?.status ?? value?.statusCode ?? value?.response?.status);
  return Number.isFinite(status) ? status : null;
}

function codeOf(value) {
  const code = Number(value?.code ?? value?.response?.data?.code);
  return Number.isFinite(code) ? code : null;
}

function isRateLimited(value) {
  return statusOf(value) === 429 || codeOf(value) === 1254291;
}

function isAuthorizationFailure(value) {
  const status = statusOf(value);
  const code = codeOf(value);
  return status === 401 || status === 403 || AUTH_ERROR_CODES.has(code);
}

function isSchemaFailure(value) {
  return SCHEMA_ERROR_CODES.has(codeOf(value));
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

function invalidResponse(message, details = {}) {
  return new ShortDramaError("base_response_invalid", message, details);
}

function mappedFailure(value, path) {
  const details = { code: codeOf(value), status: statusOf(value), path };
  if (isAuthorizationFailure(value)) {
    return new ShortDramaError("base_auth_failed", "Feishu Base authorization failed", details);
  }
  if (isSchemaFailure(value)) {
    return new ShortDramaError("base_schema_drift", "Feishu Base schema drift detected", details);
  }
  return new ShortDramaError("base_request_failed", "Feishu Base request failed", details);
}

function assertPayload(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload) ||
      typeof payload.code !== "number" || !Number.isFinite(payload.code)) {
    throw invalidResponse("Feishu response must be an object with a numeric code");
  }
}

function assertRecords(records) {
  if (!Array.isArray(records)) fail("base_response_invalid", "Records must be an array");
}

function findFieldSpec(tableName, fieldName) {
  const specs = BASE_FIELD_SPECS[tableName];
  if (!specs || typeof fieldName !== "string") {
    fail("base_schema_drift", "Field is not part of the fixed Base schema", { table: tableName });
  }
  const spec = specs.find((candidate) => candidate.name === fieldName);
  if (!spec) {
    fail("base_schema_drift", "Field is not part of the fixed Base schema", {
      table: tableName,
      field: fieldName,
    });
  }
  return spec;
}

function requiredBinding(bindings, key, spec) {
  const value = bindings?.[key];
  if (typeof value !== "string" || value.length === 0) {
    fail("base_schema_drift", "Resolved schema binding is required", { field: spec.name, binding: key });
  }
  return value;
}

function fieldBody(spec, bindings) {
  if (bindings === null || typeof bindings !== "object" || Array.isArray(bindings)) {
    fail("base_schema_drift", "Field bindings must be a fixed identifier map", { field: spec.name });
  }
  const allowedBindings = spec.kind === "link"
    ? new Set(["targetTableId"])
    : spec.kind === "lookup"
      ? new Set(["linkFieldId", "sourceFieldId"])
      : new Set();
  if (Object.keys(bindings).some((key) => !allowedBindings.has(key))) {
    fail("base_schema_drift", "Field bindings contain unsupported input", { field: spec.name });
  }
  if (spec.kind === "system") {
    const type = SYSTEM_FIELD_TYPES[spec.systemType];
    if (!type) fail("base_schema_drift", "Unsupported fixed system field", { field: spec.name });
    return { field_name: spec.name, type };
  }
  const type = FIELD_TYPES[spec.kind];
  if (!type) fail("base_schema_drift", "Unsupported fixed field kind", { field: spec.name, kind: spec.kind });
  const body = { field_name: spec.name, type };
  if (spec.kind === "date" || spec.kind === "datetime") {
    body.property = { date_formatter: spec.kind === "date" ? "yyyy-MM-dd" : "yyyy-MM-dd HH:mm" };
  } else if (spec.kind === "link") {
    body.property = { table_id: requiredBinding(bindings, "targetTableId", spec), multiple: true };
  } else if (spec.kind === "lookup") {
    body.property = {
      relation_field_id: requiredBinding(bindings, "linkFieldId", spec),
      target_field_id: requiredBinding(bindings, "sourceFieldId", spec),
    };
  } else if (spec.kind === "formula") {
    body.property = { formula_expression: spec.expression };
  }
  return body;
}

function fixedView(tableName, viewName) {
  if (typeof viewName !== "string" || !VIEW_SPECS[tableName]?.includes(viewName)) {
    fail("base_schema_drift", "View is not part of the fixed Base presentation schema", {
      table: tableName,
      view: typeof viewName === "string" ? viewName : null,
    });
  }
  return { view_name: viewName, view_type: "grid" };
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
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return payload;
  return { ...payload, status: response.status, headers: response.headers };
}

export function createTenantTokenProvider({
  appId,
  appSecret,
  fetchJson = defaultFetchJson,
  now = Date.now,
} = {}) {
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
          status: statusOf(error),
          code: codeOf(error),
        });
      }
      assertPayload(payload);
      if (payload.code !== 0) {
        throw new ShortDramaError("base_auth_failed", "Feishu tenant authentication failed", {
          status: statusOf(payload),
          code: codeOf(payload),
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
    sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
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
  }

  log(method, path, status) {
    this.logger?.({ method, path, status, run_id: this.runId });
  }

  async operation(callback) {
    const token = await this.tokenProvider();
    if (typeof token !== "string" || token.length === 0) {
      throw invalidResponse("Feishu token provider returned an invalid token");
    }
    return callback({ token, authRetried: false });
  }

  async request(path, { method = "GET", body = undefined, context = undefined } = {}) {
    if (typeof path !== "string" || !path.startsWith(BITABLE_PREFIX) || path.includes("://")) {
      fail("base_response_invalid", "Only fixed Feishu Bitable API paths are allowed");
    }
    if (!context) return this.operation((operationContext) => this.request(path, { method, body, context: operationContext }));

    let rateAttempts = 0;
    while (true) {
      rateAttempts += 1;
      let payload;
      try {
        payload = await this.fetchJson(`${FEISHU_ORIGIN}${path}`, {
          method,
          headers: {
            authorization: `Bearer ${context.token}`,
            "content-type": "application/json; charset=utf-8",
          },
          body,
        });
      } catch (error) {
        this.log(method, path, statusOf(error) ?? "error");
        if (isRateLimited(error) && rateAttempts < MAX_RATE_ATTEMPTS) {
          await this.sleep(retryDelay(error, rateAttempts));
          continue;
        }
        if (isAuthorizationFailure(error) && !context.authRetried) {
          context.authRetried = true;
          this.tokenProvider.invalidate?.(context.token);
          context.token = await this.tokenProvider();
          rateAttempts = 0;
          continue;
        }
        if (error instanceof SyntaxError) throw invalidResponse("Feishu response was not valid JSON", { path });
        if (error instanceof ShortDramaError) throw error;
        throw mappedFailure(error, path);
      }

      if (!payload || typeof payload !== "object" || Array.isArray(payload) ||
          typeof payload.code !== "number" || !Number.isFinite(payload.code)) {
        this.log(method, path, statusOf(payload) ?? "invalid");
        throw invalidResponse("Feishu response must be an object with a numeric code", { path });
      }
      const status = statusOf(payload) ?? (payload.code === 0 ? 200 : payload.code);
      this.log(method, path, status);
      if (payload.code === 0 && (statusOf(payload) === null || statusOf(payload) < 400)) return payload;
      if (isRateLimited(payload) && rateAttempts < MAX_RATE_ATTEMPTS) {
        await this.sleep(retryDelay(payload, rateAttempts));
        continue;
      }
      if (isAuthorizationFailure(payload) && !context.authRetried) {
        context.authRetried = true;
        this.tokenProvider.invalidate?.(context.token);
        context.token = await this.tokenProvider();
        rateAttempts = 0;
        continue;
      }
      throw mappedFailure(payload, path);
    }
  }

  async list(path) {
    return this.operation(async (context) => {
      const items = [];
      const seenPageTokens = new Set();
      let pageToken = "";
      let revision;
      let revisionObserved = false;
      do {
        const query = new URLSearchParams({ page_size: String(MAX_PAGE_SIZE) });
        if (pageToken) query.set("page_token", pageToken);
        const payload = await this.request(`${path}?${query}`, { context });
        if (!payload.data || typeof payload.data !== "object" || !Array.isArray(payload.data.items)) {
          throw invalidResponse("Feishu list response items must be an array", { path });
        }
        if (typeof payload.data.has_more !== "boolean") {
          throw invalidResponse("Feishu list response has_more must be boolean", { path });
        }
        const pageRevision = payload.data.revision ?? payload.data.revision_id ?? null;
        if (revisionObserved && pageRevision !== revision) {
          throw invalidResponse("Feishu list revision changed during pagination", { path });
        }
        revision = pageRevision;
        revisionObserved = true;
        items.push(...payload.data.items);
        if (!payload.data.has_more) {
          pageToken = "";
          continue;
        }
        if (typeof payload.data.page_token !== "string" || payload.data.page_token.length === 0 ||
            seenPageTokens.has(payload.data.page_token)) {
          throw invalidResponse("Feishu list response page_token is missing or repeated", { path });
        }
        pageToken = payload.data.page_token;
        seenPageTokens.add(pageToken);
      } while (pageToken);
      return { items, complete: true, revision: revision ?? null };
    });
  }

  listTables(appToken) {
    return this.list(`/open-apis/bitable/v1/apps/${encoded(appToken)}/tables`);
  }

  listFields(appToken, tableId) {
    return this.list(`/open-apis/bitable/v1/apps/${encoded(appToken)}/tables/${encoded(tableId)}/fields`);
  }

  listRecords(appToken, tableId) {
    return this.list(`/open-apis/bitable/v1/apps/${encoded(appToken)}/tables/${encoded(tableId)}/records`);
  }

  listViews(appToken, tableId) {
    return this.list(`/open-apis/bitable/v1/apps/${encoded(appToken)}/tables/${encoded(tableId)}/views`);
  }

  listDashboards(appToken) {
    return this.list(`/open-apis/bitable/v1/apps/${encoded(appToken)}/dashboards`);
  }

  async getRecord(appToken, tableId, recordId) {
    return this.operation(async (context) => {
      const payload = await this.request(
        `/open-apis/bitable/v1/apps/${encoded(appToken)}/tables/${encoded(tableId)}/records/${encoded(recordId)}`,
        { context },
      );
      if (!payload.data?.record || typeof payload.data.record !== "object" || Array.isArray(payload.data.record)) {
        throw invalidResponse("Feishu record response is malformed");
      }
      return payload.data.record;
    });
  }

  async writeRecords(appToken, tableId, records, action) {
    assertRecords(records);
    if (records.length === 0) return [];
    return this.operation(async (context) => {
      const written = [];
      for (const group of batches(records)) {
        const payload = await this.request(
          `/open-apis/bitable/v1/apps/${encoded(appToken)}/tables/${encoded(tableId)}/records/${action}`,
          { method: "POST", body: { records: group }, context },
        );
        if (!Array.isArray(payload.data?.records)) {
          throw invalidResponse("Feishu batch write response records must be an array", { action });
        }
        written.push(...payload.data.records);
      }
      return written;
    });
  }

  createRecords(appToken, tableId, records) {
    return this.writeRecords(appToken, tableId, records, "batch_create");
  }

  updateRecords(appToken, tableId, records) {
    return this.writeRecords(appToken, tableId, records, "batch_update");
  }

  async createTable(appToken, tableName) {
    if (typeof tableName !== "string" || !TABLE_ORDER.includes(tableName)) {
      fail("base_schema_drift", "Table is not part of the fixed Base schema", { table: tableName ?? null });
    }
    return this.operation(async (context) => {
      const payload = await this.request(`/open-apis/bitable/v1/apps/${encoded(appToken)}/tables`, {
        method: "POST",
        body: { table: { name: tableName } },
        context,
      });
      return payload.data?.table ?? payload.data ?? null;
    });
  }

  async createField(appToken, tableId, tableName, fieldName, bindings = {}) {
    const spec = findFieldSpec(tableName, fieldName);
    const body = fieldBody(spec, bindings);
    return this.operation(async (context) => {
      const payload = await this.request(
        `/open-apis/bitable/v1/apps/${encoded(appToken)}/tables/${encoded(tableId)}/fields`,
        { method: "POST", body, context },
      );
      return payload.data?.field ?? payload.data ?? null;
    });
  }

  async createView(appToken, tableId, tableName, viewName) {
    const body = fixedView(tableName, viewName);
    return this.operation(async (context) => {
      const payload = await this.request(
        `/open-apis/bitable/v1/apps/${encoded(appToken)}/tables/${encoded(tableId)}/views`,
        { method: "POST", body, context },
      );
      return payload.data?.view ?? payload.data ?? null;
    });
  }

  async updateView(appToken, tableId, viewId, tableName, viewName) {
    const body = fixedView(tableName, viewName);
    return this.operation(async (context) => {
      const payload = await this.request(
        `/open-apis/bitable/v1/apps/${encoded(appToken)}/tables/${encoded(tableId)}/views/${encoded(viewId)}`,
        { method: "PATCH", body, context },
      );
      return payload.data?.view ?? payload.data ?? null;
    });
  }

  async createDashboard(appToken, dashboardName) {
    if (typeof dashboardName !== "string" || !DASHBOARD_NAMES.has(dashboardName)) {
      fail("base_schema_drift", "Dashboard is not part of the fixed Base presentation schema");
    }
    return this.operation(async (context) => {
      const payload = await this.request(`/open-apis/bitable/v1/apps/${encoded(appToken)}/dashboards`, {
        method: "POST",
        body: { name: dashboardName },
        context,
      });
      return payload.data?.dashboard ?? payload.data ?? null;
    });
  }

  async createDashboardBlock(appToken, dashboardId, blockName) {
    if (typeof blockName !== "string" || !DASHBOARD_BLOCK_NAMES.has(blockName)) {
      fail("base_schema_drift", "Dashboard block is not part of the fixed Base presentation schema");
    }
    return this.operation(async (context) => {
      const payload = await this.request(
        `/open-apis/bitable/v1/apps/${encoded(appToken)}/dashboards/${encoded(dashboardId)}/blocks`,
        { method: "POST", body: { name: blockName, type: "metric" }, context },
      );
      return payload.data?.block ?? payload.data ?? null;
    });
  }
}
