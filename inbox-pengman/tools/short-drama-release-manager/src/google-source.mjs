import { createSign } from "node:crypto";

import { ShortDramaError } from "./errors.mjs";
import { normalizeAccountId } from "./source-sqlite.mjs";

const GOOGLE_SCOPE = "https://www.googleapis.com/auth/spreadsheets.readonly";
const SHEETS_ORIGIN = "https://sheets.googleapis.com/v4/spreadsheets";
const TOKEN_GRANT = "urn:ietf:params:oauth:grant-type:jwt-bearer";
const EXPECTED_SHEETS = Object.freeze(["账号台账", "发布记录", "选剧池", "采集数据"]);

export const GOOGLE_MIGRATION_RANGES = Object.freeze([
  Object.freeze({ key: "accounts", title: "账号台账", range: "账号台账!A1:H" }),
  Object.freeze({ key: "releases", title: "发布记录", range: "发布记录!A1:P" }),
  Object.freeze({ key: "dramas", title: "选剧池", range: "选剧池!A1:S" }),
  Object.freeze({ key: "captures", title: "采集数据", range: "采集数据!A1:J" }),
]);

const REQUIRED_HEADERS = Object.freeze({
  accounts: Object.freeze(["账号名", "主页链接"]),
  releases: Object.freeze(["日期", "账号名", "剧名"]),
  dramas: Object.freeze(["剧名"]),
  captures: Object.freeze(["Post ID"]),
});
const ROW_ANCHORS = Object.freeze({
  accounts: Object.freeze(["账号名", "主页链接"]),
  releases: Object.freeze(["日期", "账号名", "剧名", "视频链接", "Post ID"]),
  dramas: Object.freeze(["剧名"]),
  captures: Object.freeze(["Post ID"]),
});
const DATE_FIELDS = new Set(["日期", "数据日期", "上线日期", "快照日期"]);
const MULTI_SELECT_FIELDS = new Set(["剧分类", "RS Boost 分类（待确认）", "账号组", "来源", "推荐人", "缺失字段"]);

function fail(message, details = {}) {
  throw new ShortDramaError("google_source_invalid", message, details);
}

function plainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function clone(value) {
  try {
    return structuredClone(value);
  } catch {
    fail("Google source is not cloneable");
  }
}

function b64(value) {
  return Buffer.from(typeof value === "string" ? value : JSON.stringify(value)).toString("base64url");
}

function defaultSignJwt(unsigned, privateKey) {
  try {
    const signer = createSign("RSA-SHA256");
    signer.update(unsigned);
    signer.end();
    return signer.sign(privateKey).toString("base64url");
  } catch {
    fail("Google service-account key could not sign the assertion");
  }
}

async function defaultFetchJson(url, options = {}) {
  let response;
  try {
    response = await fetch(url, options);
  } catch (error) {
    fail("Google request failed", { status: null, cause: error?.code ?? "network_error" });
  }
  let payload;
  try {
    payload = await response.json();
  } catch {
    fail("Google response was not valid JSON", { status: response.status });
  }
  if (!response.ok) fail("Google request was rejected", { status: response.status, code: payload?.error?.status ?? null });
  return payload;
}

function assertNoCursor(payload) {
  if (!plainObject(payload)) fail("Google response is malformed");
  if (payload.nextPageToken !== undefined || payload.next_page_token !== undefined || payload.hasMore === true || payload.has_more === true) {
    fail("Google Values API unexpectedly returned a pagination cursor");
  }
}

function normalizeRange(value) {
  if (typeof value !== "string") fail("Google returned range is missing");
  const cleaned = value.replaceAll("'", "");
  const match = cleaned.match(/^([^!]+)!([A-Z]+)1:([A-Z]+)(?:\d+)?$/);
  if (!match) fail("Google returned range is malformed", { range: value });
  return `${match[1]}!${match[2]}1:${match[3]}`;
}

function validateMetadata(metadata) {
  if (!plainObject(metadata) || typeof metadata.revisionId !== "string" || metadata.revisionId.trim() === "" ||
      typeof metadata.properties?.timeZone !== "string" || metadata.properties.timeZone.trim() === "" ||
      !Array.isArray(metadata.sheets)) {
    fail("Google metadata is incomplete");
  }
  const titles = [];
  const ids = [];
  for (const sheet of metadata.sheets) {
    const title = sheet?.properties?.title;
    const id = sheet?.properties?.sheetId;
    if (typeof title !== "string" || title.trim() !== title || !Number.isSafeInteger(id)) fail("Google sheet metadata is malformed");
    titles.push(title);
    ids.push(id);
  }
  if (titles.length !== EXPECTED_SHEETS.length || new Set(titles).size !== titles.length || new Set(ids).size !== ids.length ||
      EXPECTED_SHEETS.some((title) => !titles.includes(title))) {
    fail("Google spreadsheet must contain the exact four migration sheets once");
  }
  return Object.fromEntries(metadata.sheets.map((sheet) => [sheet.properties.title, sheet.properties.sheetId]));
}

function assertMatrixMap(map, label) {
  if (!plainObject(map)) fail(`Google ${label} matrices are missing`);
  for (const { key } of GOOGLE_MIGRATION_RANGES) {
    if (!Array.isArray(map[key])) fail(`Google ${label} matrix is missing`, { sheet: key });
    if (map[key].some((row) => !Array.isArray(row))) fail(`Google ${label} matrix contains a malformed row`, { sheet: key });
  }
}

function blank(value) {
  return value === null || value === undefined || (typeof value === "string" && value.trim() === "");
}

function googleSerialDate(serial, field) {
  if (!Number.isSafeInteger(serial) || serial < 0 || serial > 2_958_465) fail("Google date serial is invalid", { field });
  const millis = Date.UTC(1899, 11, 30) + serial * 86_400_000;
  const date = new Date(millis);
  if (!Number.isFinite(date.getTime())) fail("Google date serial is invalid", { field });
  return date.toISOString().slice(0, 10);
}

function calendarDate(value, formatted, field) {
  if (blank(value)) return null;
  if (typeof value === "number") return googleSerialDate(value, field);
  if (typeof value !== "string") fail("Google date is invalid", { field });
  const text = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    const parsed = new Date(`${text}T00:00:00Z`);
    if (parsed.toISOString().slice(0, 10) === text) return text;
  }
  const match = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match) {
    const normalized = `${match[3]}-${match[1].padStart(2, "0")}-${match[2].padStart(2, "0")}`;
    const parsed = new Date(`${normalized}T00:00:00Z`);
    if (parsed.toISOString().slice(0, 10) === normalized) return normalized;
  }
  if (typeof formatted === "string" && formatted.trim() !== text) return calendarDate(formatted, formatted, field);
  fail("Google date is ambiguous or invalid", { field });
}

function multiSelect(value, field) {
  if (blank(value)) return [];
  if (Array.isArray(value)) {
    if (value.some((item) => typeof item !== "string" || item.trim() === "")) fail("Google multi-select is malformed", { field });
    const normalized = value.map((item) => item.trim());
    if (new Set(normalized).size !== normalized.length) fail("Google multi-select contains duplicates", { field });
    return normalized;
  }
  if (typeof value !== "string") fail("Google multi-select is malformed", { field });
  const pieces = value.split(/[,，、]/);
  if (pieces.some((item) => item.trim() === "")) fail("Google multi-select is malformed", { field });
  const normalized = pieces.map((item) => item.trim());
  if (new Set(normalized).size !== normalized.length) fail("Google multi-select contains duplicates", { field });
  return normalized;
}

function cell(value, formatted, field) {
  if (DATE_FIELDS.has(field)) return calendarDate(value, formatted, field);
  if (MULTI_SELECT_FIELDS.has(field)) return multiSelect(value, field);
  if (value === undefined && formatted !== undefined) value = formatted;
  if (value === undefined || value === null) return null;
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") {
    if (!Number.isFinite(value)) fail("Google numeric value is invalid", { field });
    return value;
  }
  if (typeof value === "boolean") return value;
  fail("Google cell value has an unsupported type", { field });
}

function headersFor(key, unformatted, formatted) {
  const headerRow = unformatted[0] ?? formatted[0];
  if (!Array.isArray(headerRow)) fail("Google sheet header row is missing", { sheet: key });
  const headers = headerRow.map((value) => typeof value === "string" ? value.trim() : value);
  const nonBlank = headers.filter((value) => !blank(value));
  if (nonBlank.some((value) => typeof value !== "string") || new Set(nonBlank).size !== nonBlank.length) {
    fail("Google sheet headers are duplicate or malformed", { sheet: key });
  }
  for (const required of REQUIRED_HEADERS[key]) {
    if (!nonBlank.includes(required)) fail("Google sheet required header is missing", { sheet: key, field: required });
  }
  return headers;
}

function normalizeTable(key, unformatted, formatted) {
  const headers = headersFor(key, unformatted, formatted);
  const result = [];
  const rowCount = Math.max(unformatted.length, formatted.length);
  for (let at = 1; at < rowCount; at += 1) {
    const rawRow = unformatted[at] ?? [];
    const formattedRow = formatted[at] ?? [];
    const index = new Map(headers.map((header, column) => [header, column]));
    if (ROW_ANCHORS[key].every((field) => blank(rawRow[index.get(field)]))) continue;
    const row = { source_row: at + 1 };
    for (let column = 0; column < headers.length; column += 1) {
      const field = headers[column];
      if (blank(field)) continue;
      row[field] = cell(rawRow[column], formattedRow[column], field);
    }
    if (key === "accounts") {
      try {
        row.账号ID = normalizeAccountId(row.账号名);
      } catch {
        fail("Google account name is invalid", { sheet: key, source_row: at + 1 });
      }
    }
    result.push(row);
  }
  return result;
}

export function normalizeGoogleSource(input) {
  if (!plainObject(input)) fail("Google source must be an object");
  const metadata = clone(input.metadata);
  const sheetIds = validateMetadata(metadata);
  assertMatrixMap(input.formulas, "formula");
  assertMatrixMap(input.unformatted, "unformatted");
  assertMatrixMap(input.formatted, "formatted");
  const rawBackup = clone({
    metadata,
    formulas: input.formulas,
    unformatted: input.unformatted,
    formatted: input.formatted,
  });
  const captures = normalizeTable("captures", input.unformatted.captures, input.formatted.captures);
  return {
    revision: metadata.revisionId,
    timezone: metadata.properties.timeZone,
    sheet_ids: sheetIds,
    accounts: normalizeTable("accounts", input.unformatted.accounts, input.formatted.accounts),
    releases: normalizeTable("releases", input.unformatted.releases, input.formatted.releases),
    dramas: normalizeTable("dramas", input.unformatted.dramas, input.formatted.dramas),
    capture_audit_rows: captures.length,
    raw_backup: rawBackup,
  };
}

function validateBatch(payload, spreadsheetId) {
  assertNoCursor(payload);
  if (payload.spreadsheetId !== spreadsheetId || !Array.isArray(payload.valueRanges) ||
      payload.valueRanges.length !== GOOGLE_MIGRATION_RANGES.length) {
    fail("Google batch range response is incomplete");
  }
  const result = {};
  for (let at = 0; at < GOOGLE_MIGRATION_RANGES.length; at += 1) {
    const expected = GOOGLE_MIGRATION_RANGES[at];
    const actual = payload.valueRanges[at];
    if (!plainObject(actual) || normalizeRange(actual.range) !== expected.range ||
        (actual.majorDimension !== undefined && actual.majorDimension !== "ROWS") || !Array.isArray(actual.values)) {
      fail("Google batch range response does not match the request", { range: expected.range });
    }
    result[expected.key] = clone(actual.values);
  }
  return result;
}

export async function readGoogleMigrationSource({
  spreadsheetId,
  serviceAccount,
  fetchJson = defaultFetchJson,
  signJwt = defaultSignJwt,
  now = Date.now,
} = {}) {
  if (typeof spreadsheetId !== "string" || spreadsheetId.trim() === "" || spreadsheetId.trim() !== spreadsheetId ||
      !plainObject(serviceAccount) || typeof serviceAccount.client_email !== "string" || serviceAccount.client_email === "" ||
      typeof serviceAccount.private_key !== "string" || serviceAccount.private_key === "" ||
      typeof serviceAccount.token_uri !== "string" || !serviceAccount.token_uri.startsWith("https://") ||
      typeof fetchJson !== "function" || typeof signJwt !== "function") {
    fail("Google reader configuration is invalid");
  }
  const issuedAt = Math.floor(Number(now()) / 1000);
  if (!Number.isSafeInteger(issuedAt) || issuedAt <= 0) fail("Google reader clock is invalid");
  const unsigned = `${b64({ alg: "RS256", typ: "JWT" })}.${b64({
    iss: serviceAccount.client_email,
    scope: GOOGLE_SCOPE,
    aud: serviceAccount.token_uri,
    iat: issuedAt,
    exp: issuedAt + 3600,
  })}`;
  const signature = await signJwt(unsigned, serviceAccount.private_key);
  if (typeof signature !== "string" || signature === "") fail("Google JWT signature is invalid");
  const tokenPayload = await fetchJson(serviceAccount.token_uri, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: TOKEN_GRANT, assertion: `${unsigned}.${signature}` }).toString(),
  });
  const accessToken = tokenPayload?.access_token;
  if (typeof accessToken !== "string" || accessToken === "") fail("Google authentication response is invalid");

  const base = `${SHEETS_ORIGIN}/${encodeURIComponent(spreadsheetId)}`;
  const requestOptions = { method: "GET", headers: { authorization: `Bearer ${accessToken}` } };
  const metadata = await fetchJson(`${base}?fields=spreadsheetId,revisionId,properties(timeZone),sheets(properties(sheetId,title))`, requestOptions);
  assertNoCursor(metadata);
  if (metadata.spreadsheetId !== undefined && metadata.spreadsheetId !== spreadsheetId) fail("Google metadata spreadsheet ID mismatch");
  validateMetadata(metadata);
  const matrices = {};
  for (const render of ["FORMULA", "UNFORMATTED_VALUE", "FORMATTED_VALUE"]) {
    const url = new URL(`${base}/values:batchGet`);
    for (const { range } of GOOGLE_MIGRATION_RANGES) url.searchParams.append("ranges", range);
    url.searchParams.set("majorDimension", "ROWS");
    url.searchParams.set("valueRenderOption", render);
    url.searchParams.set("dateTimeRenderOption", "SERIAL_NUMBER");
    matrices[render] = validateBatch(await fetchJson(url.toString(), requestOptions), spreadsheetId);
  }
  return normalizeGoogleSource({
    metadata,
    formulas: matrices.FORMULA,
    unformatted: matrices.UNFORMATTED_VALUE,
    formatted: matrices.FORMATTED_VALUE,
  });
}
