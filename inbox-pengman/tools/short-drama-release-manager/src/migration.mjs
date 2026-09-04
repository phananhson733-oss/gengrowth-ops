import { createHash } from "node:crypto";
import { constants as fsConstants } from "node:fs";
import { chmod, lstat, mkdir, open, readFile, realpath, unlink } from "node:fs/promises";
import { dirname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { isDeepStrictEqual } from "node:util";

import { ShortDramaError } from "./errors.mjs";
import { fixedDashboardDescriptor, fixedFieldDescriptor, fixedViewDescriptor } from "./feishu-client.mjs";
import { normalizeGoogleSource } from "./google-source.mjs";
import { matchReleaseToCapture } from "./matcher.mjs";
import { parseQualifiedInstantMs } from "./qualified-iso.mjs";
import { BASE_FIELD_SPECS, SCHEMA_APPLY_ORDER, TABLE_ORDER, TABLES, fieldOwner } from "./schema.mjs";
import { normalizeAccountId } from "./source-sqlite.mjs";

const VERSION = "shortdrama-migration/v2";
const TABLE_BINDINGS = Object.freeze({
  "账号台账": "accounts",
  "选剧池": "dramas",
  "采集数据": "captures",
  "发布记录": "releases",
});
const PRESENTATION = Object.freeze([
  ["账号台账", "在用账号"], ["账号台账", "需处理账号"],
  ["选剧池", "未排期"], ["选剧池", "已排期"], ["选剧池", "按平台"], ["选剧池", "按语言"],
  ["发布记录", "已排期"], ["发布记录", "待公开"], ["发布记录", "已公开待回填"], ["发布记录", "已回填"],
  ["发布记录", "按账号表现"], ["发布记录", "按剧表现"],
  ["采集数据", "完整"], ["采集数据", "部分缺失"], ["采集数据", "未关联发布"],
]);
export const MIGRATION_ARTIFACT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../output/short-drama-release-manager/migrations");
const ARTIFACT_ROOT = MIGRATION_ARTIFACT_ROOT;
const ARTIFACT_TRUST_ROOT = resolve(ARTIFACT_ROOT, "../..");
const POST_ID = /^\d+$/;
const DRAMA_ID = /^SD-(\d{6})$/;
const RELEASE_ID = /^SR-(\d{6})$/;
const EMPTY_KEY_SET_SHA256 = createHash("sha256").update(JSON.stringify([])).digest("hex");
const SOURCE_POLICY = "shortdrama-source-reconciliation/v1";
const CAPTURE_METRICS = Object.freeze([
  Object.freeze(["views", "播放量"]),
  Object.freeze(["likes", "点赞"]),
  Object.freeze(["comments", "评论"]),
  Object.freeze(["favorites", "收藏"]),
  Object.freeze(["shares", "转发"]),
]);
const DRAMA_MULTI_FIELDS = Object.freeze(["剧分类", "RS Boost 分类（待确认）", "账号组", "来源", "推荐人"]);
const DRAMA_PROVENANCE_TEXT_FIELDS = Object.freeze(["推荐理由", "备注"]);
const DRAMA_SCALAR_FIELDS = Object.freeze(["上线日期", "账号状态", "平台", "语言", "归档状态"]);
const REVIEWABLE_MATCH_REASONS = new Set(["manual_post_not_found", "ambiguous_post_match", "no_account_time_candidate"]);
const MIGRATION_WARNING_CODES = new Set(["account_stub_created", "drama_rows_merged", ...REVIEWABLE_MATCH_REASONS]);

function fail(code, message, details = {}) {
  throw new ShortDramaError(code, message, details);
}

function plainObject(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function objectLike(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function clone(value, code = "migration_manifest_invalid") {
  try {
    return structuredClone(value);
  } catch {
    fail(code, "Migration value is not cloneable");
  }
}

function omitUndefined(value, seen = new Set()) {
  if (value === null || typeof value !== "object") return value;
  if (seen.has(value)) fail("migration_source_invalid", "Migration evidence is cyclic");
  seen.add(value);
  const result = Array.isArray(value) ? value.map((item) => omitUndefined(item, seen)) :
    Object.fromEntries(Object.entries(value).filter(([, child]) => child !== undefined).map(([key, child]) => [key, omitUndefined(child, seen)]));
  seen.delete(value);
  return result;
}

function canonicalize(value, seen = new Set()) {
  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number") {
    if (!Number.isFinite(value) || (Number.isInteger(value) && !Number.isSafeInteger(value))) {
      fail("migration_manifest_invalid", "Migration numbers must be finite and safe");
    }
    return value;
  }
  if (typeof value !== "object" || Array.isArray(value) && value.some((item) => item === undefined)) {
    fail("migration_manifest_invalid", "Migration value has an unsupported type");
  }
  if (seen.has(value)) fail("migration_manifest_invalid", "Migration value is cyclic");
  seen.add(value);
  let result;
  if (Array.isArray(value)) {
    result = value.map((item) => canonicalize(item, seen));
  } else {
    if (!plainObject(value)) fail("migration_manifest_invalid", "Migration objects must be plain objects");
    result = {};
    for (const key of Object.keys(value).sort()) {
      if (value[key] === undefined) fail("migration_manifest_invalid", "Migration value contains undefined");
      result[key] = canonicalize(value[key], seen);
    }
  }
  seen.delete(value);
  return result;
}

function stableJson(value) {
  return JSON.stringify(canonicalize(value));
}

function sha256(value) {
  return createHash("sha256").update(stableJson(value)).digest("hex");
}

function exactSourceIds(rows, field, normalize) {
  const result = rows.map((row) => {
    if (!plainObject(row)) fail("migration_source_invalid", "Migration source row is malformed", { field });
    try { return normalize(row[field]); }
    catch { fail("migration_source_invalid", "Migration source identifier is invalid", { field }); }
  });
  if (new Set(result).size !== result.length) fail("migration_source_invalid", "Migration source identifiers are duplicate", { field });
  return result.sort();
}

export function migrationSourceRevision({ google, sqliteAccounts, sqlitePosts } = {}) {
  if (!plainObject(google) || typeof google.revision !== "string" || google.revision === "" ||
      !Array.isArray(google.captures) || !Array.isArray(sqliteAccounts) || !Array.isArray(sqlitePosts)) {
    fail("migration_source_invalid", "Complete Google and SQLite migration sources are required");
  }
  let evidence;
  try {
    const capturedAccounts = clone(sqliteAccounts, "migration_source_invalid");
    const capturedPosts = clone(sqlitePosts, "migration_source_invalid");
    evidence = {
      policy: SOURCE_POLICY,
      google_revision: google.revision,
      google_capture_post_ids: exactSourceIds(google.captures, "Post ID", (value) => postId(value)),
      google_captures_sha256: sha256(google.captures),
      sqlite_account_ids: exactSourceIds(capturedAccounts, "username", (value) => normalizeAccountId(value)),
      sqlite_accounts: capturedAccounts,
      sqlite_accounts_sha256: sha256(capturedAccounts),
      sqlite_post_ids: exactSourceIds(capturedPosts, "post_id", (value) => postId(value)),
      sqlite_posts: capturedPosts,
      sqlite_posts_sha256: sha256(capturedPosts),
    };
  } catch {
    fail("migration_source_invalid", "Migration source evidence is invalid");
  }
  return { evidence, revision: `migration-source-v2:${sha256(evidence)}` };
}

function digestWithoutSha(value) {
  if (!plainObject(value)) fail("migration_manifest_invalid", "Evidence envelope must be an object");
  return sha256(Object.fromEntries(Object.entries(value).filter(([key]) => key !== "sha256")));
}

function withoutDigestEnvelope(value) {
  if (!plainObject(value)) fail("migration_manifest_invalid", "Migration envelope must be an object");
  const copy = {};
  for (const [key, child] of Object.entries(value)) {
    if (key !== "sha256" && key !== "generated_at") copy[key] = child;
  }
  return copy;
}

export function manifestDigest(manifest) {
  return sha256(withoutDigestEnvelope(manifest));
}

export function verificationDigest(report) {
  return sha256(withoutDigestEnvelope(report));
}

export function schemaReceiptDigest(receipt) {
  return sha256(withoutDigestEnvelope(receipt));
}

export function presentationReceiptDigest(receipt) {
  return sha256(withoutDigestEnvelope(receipt));
}

export function canaryReceiptDigest(receipt) {
  return digestWithoutSha(receipt);
}

export function permissionAttestationDigest(attestation) {
  return digestWithoutSha(attestation);
}

function text(value, field, { nullable = false } = {}) {
  if (nullable && (value === null || value === undefined || value === "")) return null;
  if (typeof value !== "string" || value.trim() === "") fail("migration_source_invalid", "Migration text value is invalid", { field });
  return value.trim();
}

function optionalValue(value) {
  if (value === undefined || value === "") return null;
  return typeof value === "string" ? value.trim() : clone(value);
}

function postId(value, { nullable = false } = {}) {
  if (nullable && (value === null || value === undefined || value === "")) return null;
  if (typeof value !== "string" || !POST_ID.test(value)) fail("migration_source_invalid", "Post ID is invalid");
  return value;
}

function tiktokIdentity(value, kind) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string" || value.trim() !== value) fail("migration_source_invalid", "TikTok URL is invalid");
  let url;
  try { url = new URL(value); } catch { fail("migration_source_invalid", "TikTok URL is invalid"); }
  if (url.protocol !== "https:" || (url.hostname !== "tiktok.com" && !url.hostname.endsWith(".tiktok.com")) || url.search || url.hash) {
    fail("migration_source_invalid", "TikTok URL is invalid");
  }
  const match = url.pathname.match(kind === "account" ? /^\/@([^/]+)\/?$/ : /^\/@([^/]+)\/(?:video|photo)\/(\d+)\/?$/);
  if (!match) fail("migration_source_invalid", "TikTok URL path is invalid");
  return { accountId: normalizeAccountId(match[1]), postId: match[2] ?? null };
}

function blocked(code, table, sourceRow, details = {}) {
  return { code, table, source_row: sourceRow ?? null, ...details };
}

function orderDiagnostics(rows) {
  return rows.sort((left, right) =>
    left.code.localeCompare(right.code) || left.table.localeCompare(right.table) ||
    (left.source_row ?? 0) - (right.source_row ?? 0) || stableJson(left).localeCompare(stableJson(right)));
}

function writableProjection(tableName, row, { exclude = [] } = {}) {
  const ignored = new Set(exclude);
  const result = {};
  const writable = [...TABLES[tableName].human, ...TABLES[tableName].machine, ...TABLES[tableName].shared];
  for (const field of writable) {
    if (ignored.has(field)) continue;
    const spec = BASE_FIELD_SPECS[tableName].find((item) => item.name === field);
    const fallback = spec?.kind === "multi_select" ? [] : null;
    result[field] = Object.hasOwn(row, field) ? optionalValue(row[field]) : fallback;
  }
  return result;
}

function businessId(prefix, number) {
  if (!Number.isSafeInteger(number) || number < 1 || number > 999_999) fail("migration_source_invalid", "Migration business ID range is exhausted");
  return `${prefix}-${String(number).padStart(6, "0")}`;
}

function validateAccountRows(rows, blocks) {
  if (!Array.isArray(rows)) fail("migration_source_invalid", "Google account rows are missing");
  const manifestRows = [];
  const byId = new Map();
  for (const source of rows) {
    if (!plainObject(source)) fail("migration_source_invalid", "Google account row is malformed");
    let accountId;
    try { accountId = normalizeAccountId(source.账号ID ?? source.账号名); }
    catch { blocks.push(blocked("invalid_account_key", "账号台账", source.source_row)); continue; }
    const projected = writableProjection("账号台账", source, { exclude: ["账号ID"] });
    projected.账号ID = accountId;
    if (!Object.hasOwn(projected, "账号名") || projected.账号名 === null) projected.账号名 = accountId;
    try {
      const identity = tiktokIdentity(projected.主页链接, "account");
      if (!identity) blocks.push(blocked("source_url_invalid", "账号台账", source.source_row, { account_id: accountId }));
      else if (identity.accountId !== accountId) blocks.push(blocked("source_account_mismatch", "账号台账", source.source_row, { account_id: accountId }));
    } catch {
      blocks.push(blocked("source_url_invalid", "账号台账", source.source_row, { account_id: accountId }));
    }
    manifestRows.push(projected);
    const list = byId.get(accountId) ?? [];
    list.push(source.source_row ?? null);
    byId.set(accountId, list);
  }
  for (const [accountId, sourceRows] of byId) {
    if (sourceRows.length > 1) blocks.push(blocked("duplicate_account_key", "账号台账", sourceRows[0], { account_id: accountId, source_rows: sourceRows }));
  }
  return {
    rows: manifestRows,
    all: new Set(byId.keys()),
    unique: new Set([...byId].filter(([, sourceRows]) => sourceRows.length === 1).map(([id]) => id)),
  };
}

function normalizedSqliteAccounts(rows) {
  if (!Array.isArray(rows)) fail("migration_source_invalid", "Latest SQLite accounts are missing");
  const result = new Map();
  for (const row of rows) {
    if (!plainObject(row)) fail("migration_source_invalid", "Latest SQLite account is malformed");
    let accountId;
    try { accountId = normalizeAccountId(row.username); }
    catch { fail("migration_source_invalid", "Latest SQLite account key is invalid"); }
    if (result.has(accountId)) fail("migration_source_invalid", "Latest SQLite accounts contain a duplicate key", { account_id: accountId });
    let identity;
    try { identity = tiktokIdentity(row.account_url, "account"); }
    catch { fail("migration_source_invalid", "Latest SQLite account URL is invalid", { account_id: accountId }); }
    if (!identity || identity.accountId !== accountId || row.collection_status !== "complete" ||
        !Number.isSafeInteger(row.followers) || row.followers < 0) {
      fail("migration_source_invalid", "Latest SQLite account is invalid", { account_id: accountId });
    }
    result.set(accountId, clone(row, "migration_source_invalid"));
  }
  return result;
}

function reconcileAccounts(googleResult, sqliteRows, captureSources, blocks, warnings) {
  const sqlite = normalizedSqliteAccounts(sqliteRows);
  const rows = googleResult.rows.map((row) => {
    const latest = sqlite.get(row.账号ID);
    if (!latest) return row;
    return {
      ...row,
      粉丝数: latest.followers,
      数据日期: latest.snapshot_date,
      指标同步时间: latest.captured_at,
      同步状态: "success",
    };
  });
  const captureEvidence = new Map();
  for (const source of captureSources) {
    const list = captureEvidence.get(source.username) ?? [];
    list.push(source);
    captureEvidence.set(source.username, list);
  }
  const stubs = [];
  for (const accountId of [...captureEvidence.keys()].sort()) {
    if (googleResult.all.has(accountId)) continue;
    const latest = sqlite.get(accountId);
    let homepage = latest?.account_url ?? null;
    if (!homepage) {
      const identities = captureEvidence.get(accountId).map((source) => {
        try { return tiktokIdentity(source.post_url, "post"); }
        catch { return null; }
      });
      if (identities.some((identity) => !identity || identity.accountId !== accountId)) {
        blocks.push(blocked("account_stub_evidence_missing", "账号台账", null, { account_id: accountId }));
        continue;
      }
      homepage = `https://www.tiktok.com/@${accountId}`;
    }
    const row = writableProjection("账号台账", {
      账号ID: accountId,
      账号名: accountId,
      主页链接: homepage,
      粉丝数: latest?.followers ?? null,
      数据日期: latest?.snapshot_date ?? null,
      指标同步时间: latest?.captured_at ?? null,
      同步状态: latest ? "success" : null,
    });
    rows.push(row);
    const evidence = {
      account_id: accountId,
      evidence_url: homepage,
      source: latest ? "sqlite_account" : "google_capture",
      source_post_ids: captureEvidence.get(accountId).map((source) => source.post_id).sort(),
    };
    stubs.push(evidence);
    warnings.push(blocked("account_stub_created", "账号台账", null, evidence));
  }
  return { rows, unique: new Set(rows.map((row) => row.账号ID)), stubs };
}

export function canonicalDramaName(value) {
  return text(value, "剧名").normalize("NFKC").trim().replace(/\s+/gu, " ").toLocaleLowerCase("en-US");
}

function stableUnion(rows, field) {
  const result = [];
  const seen = new Set();
  for (const row of rows) {
    const values = row.projected[field];
    if (!Array.isArray(values)) fail("migration_source_invalid", "Drama multi-select value is invalid", { field });
    for (const value of values) {
      if (typeof value !== "string" || value === "") fail("migration_source_invalid", "Drama multi-select option is invalid", { field });
      if (!seen.has(value)) {
        seen.add(value);
        result.push(value);
      }
    }
  }
  return result;
}

function distinctValues(rows, field) {
  const result = [];
  for (const row of rows) {
    const value = row.projected[field];
    if (value === null || value === undefined || value === "") continue;
    if (!result.some((candidate) => isDeepStrictEqual(candidate.value, value))) result.push({ value, sourceRow: row.sourceRow });
  }
  return result;
}

function validateDramaRows(rows, blocks, warnings) {
  if (!Array.isArray(rows)) fail("migration_source_invalid", "Google drama rows are missing");
  const groups = new Map();
  rows.forEach((source, at) => {
    if (!plainObject(source)) fail("migration_source_invalid", "Google drama row is malformed");
    let name;
    try { name = text(source.剧名, "剧名"); }
    catch { blocks.push(blocked("invalid_drama_key", "选剧池", source.source_row)); return; }
    const key = canonicalDramaName(name);
    const projected = writableProjection("选剧池", source, { exclude: ["剧ID", "是否已排期"] });
    const list = groups.get(key) ?? [];
    list.push({ name, projected, sourceRow: source.source_row ?? null, sourceIndex: at });
    groups.set(key, list);
  });
  const manifestRows = [];
  const unique = new Map();
  const merges = [];
  const orderedGroups = [...groups].sort(([, left], [, right]) => left[0].sourceIndex - right[0].sourceIndex);
  for (const [key, matches] of orderedGroups) {
    const id = businessId("SD", manifestRows.length + 1);
    const merged = { ...matches[0].projected, 剧ID: id, 剧名: matches[0].name };
    const fieldDecisions = {};
    for (const field of DRAMA_MULTI_FIELDS) {
      merged[field] = stableUnion(matches, field);
      fieldDecisions[field] = { strategy: "stable_union", source_rows: matches.map((item) => item.sourceRow) };
    }
    for (const field of DRAMA_PROVENANCE_TEXT_FIELDS) {
      const values = distinctValues(matches, field);
      if (values.length === 1) merged[field] = values[0].value;
      else if (values.length > 1) merged[field] = values.map((item) => `[来源：Google 选剧池第 ${item.sourceRow} 行] ${item.value}`).join("\n\n");
      else merged[field] = null;
      fieldDecisions[field] = { strategy: values.length > 1 ? "provenance_join" : "single_value", source_rows: values.map((item) => item.sourceRow) };
    }
    const lifecycleValues = distinctValues(matches, "生命周期");
    const fixedLifecycleProgression = lifecycleValues.length > 1 && lifecycleValues.every((item) => new Set(["新剧", "在推"]).has(item.value));
    if (lifecycleValues.length > 1 && !fixedLifecycleProgression) {
      blocks.push(blocked("drama_merge_conflict", "选剧池", matches[0].sourceRow, {
        drama_name: matches[0].name,
        field: "生命周期",
        source_rows: lifecycleValues.map((item) => item.sourceRow),
      }));
    }
    merged.生命周期 = fixedLifecycleProgression ? "在推" : lifecycleValues[0]?.value ?? null;
    fieldDecisions.生命周期 = {
      strategy: fixedLifecycleProgression ? "lifecycle_progression" : lifecycleValues.length > 1 ? "blocked_conflict" : "single_value",
      source_rows: lifecycleValues.map((item) => item.sourceRow),
    };
    for (const field of DRAMA_SCALAR_FIELDS) {
      const values = distinctValues(matches, field);
      if (values.length > 1) {
        blocks.push(blocked("drama_merge_conflict", "选剧池", matches[0].sourceRow, {
          drama_name: matches[0].name,
          field,
          source_rows: values.map((item) => item.sourceRow),
        }));
      }
      merged[field] = values[0]?.value ?? (field === "归档状态" ? "active" : null);
      fieldDecisions[field] = { strategy: values.length > 1 ? "blocked_conflict" : "single_value", source_rows: values.map((item) => item.sourceRow) };
    }
    manifestRows.push(merged);
    unique.set(key, id);
    if (matches.length > 1) {
      const evidence = {
        canonical_key: key,
        output_drama_id: id,
        source_rows: matches.map((item) => item.sourceRow),
        field_decisions: fieldDecisions,
      };
      merges.push(evidence);
      warnings.push(blocked("drama_rows_merged", "选剧池", matches[0].sourceRow, {
        drama_id: id,
        source_rows: evidence.source_rows,
      }));
    }
  }
  return { rows: manifestRows, unique, merges };
}

function migrationMetric(value, field, postId) {
  if (value !== null && (!Number.isSafeInteger(value) || value < 0)) {
    fail("migration_source_invalid", "Capture metric is invalid", { field, post_id: postId });
  }
  return value;
}

function normalizedGoogleCapture(source) {
  if (!plainObject(source)) fail("migration_source_invalid", "Google capture is malformed");
  const key = postId(source["Post ID"]);
  let accountId;
  try { accountId = normalizeAccountId(source.账号名); }
  catch { fail("migration_source_invalid", "Google capture account is invalid", { post_id: key }); }
  let identity = null;
  try { identity = tiktokIdentity(source.视频链接, "post"); }
  catch {}
  const metrics = Object.fromEntries(CAPTURE_METRICS.map(([target, field]) => [target, migrationMetric(source[field], field, key)]));
  const missingFields = CAPTURE_METRICS.filter(([target]) => metrics[target] === null).map(([target]) => target);
  return {
    post_id: key,
    username: accountId,
    post_url: source.视频链接,
    snapshot_date: source.快照日期,
    captured_at: null,
    published_at: null,
    ...metrics,
    collection_status: missingFields.length === 0 ? "complete" : "partial",
    missing_fields: missingFields,
    migration_source: "google",
    identity_valid: identity?.accountId === accountId && identity?.postId === key,
    source_row: source.source_row ?? null,
  };
}

function normalizedSqliteCapture(source) {
  if (!plainObject(source)) fail("migration_source_invalid", "Latest SQLite capture is malformed");
  const key = postId(source.post_id);
  let accountId;
  try { accountId = normalizeAccountId(source.username); }
  catch { fail("migration_source_invalid", "Latest SQLite capture account is invalid", { post_id: key }); }
  let identity;
  try { identity = tiktokIdentity(source.post_url, "post"); }
  catch { fail("migration_source_invalid", "Latest SQLite capture URL is invalid", { post_id: key }); }
  const metrics = Object.fromEntries(CAPTURE_METRICS.map(([field]) => [field, migrationMetric(source[field], field, key)]));
  if (!new Set(["complete", "partial"]).has(source.collection_status) || !Array.isArray(source.missing_fields) ||
      source.missing_fields.some((field) => !CAPTURE_METRICS.some(([name]) => name === field))) {
    fail("migration_source_invalid", "Latest SQLite capture completeness is invalid", { post_id: key });
  }
  return {
    ...clone(source, "migration_source_invalid"),
    ...metrics,
    post_id: key,
    username: accountId,
    missing_fields: [...source.missing_fields],
    migration_source: "sqlite",
  };
}

function uniqueCaptureMap(rows, normalize, sourceName) {
  if (!Array.isArray(rows)) fail("migration_source_invalid", `${sourceName} captures are missing`);
  const result = new Map();
  for (const raw of rows) {
    const row = normalize(raw);
    if (result.has(row.post_id)) fail("migration_source_invalid", `${sourceName} captures contain a duplicate Post ID`, { post_id: row.post_id });
    result.set(row.post_id, row);
  }
  return result;
}

function reconcileCaptureSources(googleRows, sqliteRows, blocks) {
  const google = uniqueCaptureMap(googleRows, normalizedGoogleCapture, "Google");
  const sqlite = uniqueCaptureMap(sqliteRows, normalizedSqliteCapture, "SQLite");
  const sources = [];
  const merges = [];
  let overlap = 0;
  for (const key of [...new Set([...google.keys(), ...sqlite.keys()])].sort()) {
    const historical = google.get(key);
    const latest = sqlite.get(key);
    if (!latest) {
      sources.push(historical);
      continue;
    }
    if (!historical) {
      sources.push(latest);
      continue;
    }
    overlap += 1;
    if (historical.identity_valid !== true || historical.username !== latest.username) {
      blocks.push(blocked("capture_source_conflict", "采集数据", historical.source_row, { post_id: key }));
    }
    const merged = { ...historical, ...latest, migration_source: "sqlite" };
    const fallbackFields = [];
    for (const [field, target] of CAPTURE_METRICS) {
      if (latest[field] === null && historical[field] !== null) {
        merged[field] = historical[field];
        fallbackFields.push(target);
      }
    }
    sources.push(merged);
    merges.push({ post_id: key, primary_source: "sqlite", fallback_fields: fallbackFields });
  }
  return {
    sources,
    merges,
    counts: {
      google_captures: google.size,
      sqlite_posts: sqlite.size,
      capture_overlap: overlap,
      capture_union: sources.length,
    },
  };
}

function validateCaptures(rows, accountIds, blocks, sourceRevision) {
  if (!Array.isArray(rows)) fail("migration_source_invalid", "Latest SQLite captures are missing");
  const byPost = new Map();
  for (const source of rows) {
    if (!plainObject(source)) fail("migration_source_invalid", "Latest SQLite capture is malformed");
    let key;
    try { key = postId(source.post_id); }
    catch { blocks.push(blocked("invalid_post_id", "采集数据", null)); continue; }
    const list = byPost.get(key) ?? [];
    list.push(source);
    byPost.set(key, list);
  }
  const result = [];
  for (const [key, matches] of [...byPost].sort(([left], [right]) => left.localeCompare(right))) {
    if (matches.length > 1) {
      blocks.push(blocked("duplicate_post_id", "采集数据", null, { post_id: key }));
      continue;
    }
    const source = matches[0];
    let accountId;
    try { accountId = normalizeAccountId(source.username); }
    catch { blocks.push(blocked("invalid_account_key", "采集数据", null, { post_id: key })); continue; }
    if (!accountIds.has(accountId)) blocks.push(blocked("missing_account_target", "采集数据", null, { account_id: accountId, post_id: key }));
    try {
      const identity = tiktokIdentity(source.post_url, "post");
      if (!identity || identity.accountId !== accountId || identity.postId !== key) {
        blocks.push(blocked("source_account_mismatch", "采集数据", null, { account_id: accountId, post_id: key }));
      }
    } catch {
      blocks.push(blocked("source_url_invalid", "采集数据", null, { post_id: key }));
    }
    const metrics = ["views", "likes", "comments", "favorites", "shares"];
    for (const field of metrics) {
      const value = source[field];
      if (value !== null && (!Number.isSafeInteger(value) || value < 0)) fail("migration_source_invalid", "Capture metric is invalid", { field, post_id: key });
    }
    if (!Array.isArray(source.missing_fields) || source.missing_fields.some((field) => typeof field !== "string")) {
      fail("migration_source_invalid", "Capture missing_fields is invalid", { post_id: key });
    }
    result.push(writableProjection("采集数据", {
      "Post ID": key,
      "快照日期": optionalValue(source.snapshot_date),
      "采集时间": optionalValue(source.captured_at),
      "账号": accountId,
      "视频链接": optionalValue(source.post_url),
      "发布时间": optionalValue(source.published_at),
      "播放量": source.views,
      "点赞": source.likes,
      "评论": source.comments,
      "收藏": source.favorites,
      "转发": source.shares,
      "业务": "short-drama",
      "采集状态": optionalValue(source.collection_status),
      "缺失字段": [...source.missing_fields],
      "来源 run_id": optionalValue(source.run_id) ?? `migration:${source.migration_source ?? "sqlite"}:${sourceRevision.replace(/^migration-source-v2:/, "")}`,
      "Base 同步时间": optionalValue(source.base_sync_time),
    }));
  }
  return result;
}

function beijingDate(iso) {
  return new Date(Date.parse(iso) + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function manualClaimIds(source) {
  const result = new Set();
  if (typeof source?.["Post ID"] === "string" && POST_ID.test(source["Post ID"])) result.add(source["Post ID"]);
  if (typeof source?.视频链接 === "string" && source.视频链接 !== "") {
    try {
      const url = new URL(source.视频链接);
      const hostname = url.hostname.toLowerCase();
      const match = url.pathname.match(/^\/@[^/]+\/(?:video|photo)\/(\d+)\/?$/);
      if ((url.protocol === "https:" || url.protocol === "http:") &&
          (hostname === "tiktok.com" || hostname.endsWith(".tiktok.com")) && match) result.add(match[1]);
    } catch {}
  }
  return result;
}

function validateReleases(rows, accountIds, dramasByName, captureSources, capturesByPost, blocks, warnings, generatedAtValue) {
  if (!Array.isArray(rows)) fail("migration_source_invalid", "Google release rows are missing");
  const result = [];
  const manualClaims = rows.map((source) => manualClaimIds(source));
  const manualClaimCounts = new Map();
  for (const claims of manualClaims) {
    for (const claim of claims) manualClaimCounts.set(claim, (manualClaimCounts.get(claim) ?? 0) + 1);
  }
  const duplicateManualClaims = new Set();
  for (const [claim, count] of manualClaimCounts) {
    if (count < 2) continue;
    duplicateManualClaims.add(claim);
    const sourceRows = rows
      .map((source, at) => manualClaims[at].has(claim) ? source.source_row ?? null : null)
      .filter((sourceRow) => sourceRow !== null);
    blocks.push(blocked("manual_post_claimed", "发布记录", sourceRows[0] ?? null, { post_id: claim, source_rows: sourceRows }));
  }
  const inferredPostIds = new Set();
  rows.forEach((source, at) => {
    if (!plainObject(source)) fail("migration_source_invalid", "Google release row is malformed");
    const releaseId = businessId("SR", at + 1);
    let accountId = null;
    try { accountId = normalizeAccountId(source.账号ID ?? source.账号名); }
    catch { blocks.push(blocked("missing_account_target", "发布记录", source.source_row, { release_id: releaseId })); }
    if (accountId && !accountIds.has(accountId)) blocks.push(blocked("missing_account_target", "发布记录", source.source_row, { release_id: releaseId, account_id: accountId }));
    const dramaName = typeof source.剧名 === "string" ? source.剧名.trim() : "";
    let dramaKey = null;
    try { dramaKey = canonicalDramaName(dramaName); }
    catch {}
    const dramaId = dramaKey ? dramasByName.get(dramaKey) ?? null : null;
    if (!dramaId) blocks.push(blocked("missing_drama_target", "发布记录", source.source_row, { release_id: releaseId, drama_name: dramaName }));
    const claimedPostIds = new Set(inferredPostIds);
    for (const [claim, count] of manualClaimCounts) {
      if (count > 1 || !manualClaims[at].has(claim)) claimedPostIds.add(claim);
    }
    const duplicateClaim = [...manualClaims[at]].find((claim) => duplicateManualClaims.has(claim)) ?? null;
    const match = duplicateClaim ? { status: "unmatched", reason: "manual_post_claimed", candidates: [] } :
      matchReleaseToCapture({ ...source, 账号ID: accountId }, captureSources, claimedPostIds);
    const hasManual = source["Post ID"] !== null && source["Post ID"] !== undefined && source["Post ID"] !== "" ||
      source.视频链接 !== null && source.视频链接 !== undefined && source.视频链接 !== "";
    const futureUnlinked = !hasManual && match.status === "unmatched" && match.reason === "no_account_time_candidate" &&
      typeof source.日期 === "string" && /^\d{4}-\d{2}-\d{2}$/.test(source.日期) && source.日期 > beijingDate(generatedAtValue);
    let resolvedPost = null;
    let pendingReason = null;
    if (match.status === "matched") {
      resolvedPost = match.post.post_id;
      inferredPostIds.add(resolvedPost);
    } else if (duplicateClaim) {
      // The one deterministic duplicate block was emitted before any matching.
    } else if (REVIEWABLE_MATCH_REASONS.has(match.reason) && !futureUnlinked) {
      pendingReason = match.reason;
      warnings.push(blocked(match.reason, "发布记录", source.source_row, {
        release_id: releaseId,
        candidates: match.candidates?.map((item) => item.post_id) ?? [],
      }));
    } else if (!futureUnlinked) {
      blocks.push(blocked(match.reason, "发布记录", source.source_row, { release_id: releaseId, candidates: match.candidates?.map((item) => item.post_id) ?? [] }));
    }
    const projected = writableProjection("发布记录", source, { exclude: ["发布ID", "账号", "剧", "采集记录", "账号名", "主页链接", "剧名", "剧分类", "播放量", "点赞", "收藏", "转发", "评论"] });
    if (resolvedPost) {
      projected["Post ID"] = resolvedPost;
      projected.视频链接 = match.post.post_url ?? projected.视频链接;
      projected.匹配方式 = match.method;
      projected.匹配置信度 = match.confidence ?? 1;
    }
    if (pendingReason) {
      projected.匹配方式 = null;
      projected.匹配置信度 = null;
      projected.同步错误 = `待人工关联：${pendingReason}`;
    }
    result.push(writableProjection("发布记录", {
      ...projected,
      发布ID: releaseId,
      账号: accountId,
      剧: dramaId,
      采集记录: resolvedPost && capturesByPost.has(resolvedPost) ? resolvedPost : null,
      归档状态: projected.归档状态 ?? "active",
    }));
  });
  return result;
}

function expectedFieldConfig(tableName, spec, tableIds) {
  const bindings = spec.kind === "link" ? { targetTableId: tableIds[spec.targetTable] } : {};
  if (spec.kind === "link" && typeof bindings.targetTableId !== "string") fail("base_schema_drift", "Fixed link target table is unresolved", { table: tableName, field: spec.name });
  return fixedFieldDescriptor(tableName, spec.name, bindings);
}

function fixedSchemaDescriptor(tableName, spec) {
  const descriptor = { name: spec.name, kind: spec.kind, phase: spec.phase };
  for (const key of ["primary", "targetTable", "bidirectional", "reverseField", "managedReverseOf", "linkField", "sourceField", "expression", "systemType"]) {
    if (spec[key] !== undefined) descriptor[key] = clone(spec[key]);
  }
  const bindings = spec.kind === "link" ? { targetTableId: `table:${spec.targetTable}` } : {};
  descriptor.canonical = fixedFieldDescriptor(tableName, spec.name, bindings);
  return canonicalize(descriptor);
}

function fixedSchemaContract() {
  return Object.fromEntries(TABLE_ORDER.map((tableName) => [
    tableName,
    BASE_FIELD_SPECS[tableName].map((spec) => fixedSchemaDescriptor(tableName, spec)),
  ]));
}

function configMatches(actual, expected) {
  if (!plainObject(actual)) return false;
  for (const [key, value] of Object.entries(expected)) {
    if (!Object.hasOwn(actual, key) || actual[key] === undefined) return false;
    if (!isDeepStrictEqual(canonicalize(actual[key]), canonicalize(value))) return false;
  }
  return true;
}

function schemaPlan(baseSchema, blocks) {
  const revision = baseSchema?.revision ?? "base:new";
  const tables = baseSchema?.tables ?? [];
  if (typeof revision !== "string" || revision.trim() === "" || !Array.isArray(tables)) fail("base_schema_drift", "Base schema metadata is malformed");
  const byName = new Map();
  const ids = new Set();
  let unexpectedTable = false;
  for (const table of tables) {
    if (!plainObject(table) || typeof table.name !== "string" || typeof table.table_id !== "string" || !Array.isArray(table.fields) || byName.has(table.name) || ids.has(table.table_id)) {
      fail("base_schema_drift", "Base table metadata is malformed or duplicate");
    }
    if (!TABLE_ORDER.includes(table.name)) {
      blocks.push(blocked("base_schema_drift", table.name, null, { reason: "unexpected_table" }));
      unexpectedTable = true;
      continue;
    }
    byName.set(table.name, table);
    ids.add(table.table_id);
  }
  const tableIds = Object.fromEntries([...byName].map(([name, table]) => [name, table.table_id]));
  const fieldActions = [];
  const emptyEvidence = {};
  for (const tableName of TABLE_ORDER) {
    const table = byName.get(tableName);
    if (!table) {
      emptyEvidence[tableName] = { record_count: null, key_set_sha256: null };
      blocks.push(blocked("base_table_missing", tableName, null, {
        next_step: "create_four_empty_tables_and_bind_ids",
      }));
      continue;
    }
    const countValid = Number.isSafeInteger(table.record_count) && table.record_count >= 0;
    const keySetValid = typeof table.primary_key_set_sha256 === "string" && /^[a-f0-9]{64}$/.test(table.primary_key_set_sha256);
    emptyEvidence[tableName] = {
      record_count: countValid ? table.record_count : null,
      key_set_sha256: keySetValid ? table.primary_key_set_sha256 : null,
    };
    if (!countValid || table.record_count !== 0 || !keySetValid ||
        table.primary_key_set_sha256 !== EMPTY_KEY_SET_SHA256) {
      blocks.push(blocked("base_not_empty", tableName, null, {
        reason: "formal_base_must_be_proven_empty",
      }));
      continue;
    }
    emptyEvidence[tableName] = { record_count: 0, key_set_sha256: table.primary_key_set_sha256 };
    const fields = new Map();
    for (const field of table?.fields ?? []) {
      if (!plainObject(field) || typeof field.name !== "string" || fields.has(field.name)) fail("base_schema_drift", "Base field metadata is malformed or duplicate", { table: tableName });
      fields.set(field.name, field);
    }
    const fixedNames = new Set(BASE_FIELD_SPECS[tableName].map((spec) => spec.name));
    const targetPrimary = TABLES[tableName].primaryField;
    const primaryFields = table?.fields?.filter((field) => field.is_primary === true || field.primary === true) ?? [];
    const recoverablePrimaryName = table?.record_count === 0 && !fields.has(targetPrimary) && primaryFields.length === 1 ? primaryFields[0].name : null;
    for (const fieldName of fields.keys()) {
      if (!fixedNames.has(fieldName) && fieldName !== recoverablePrimaryName) blocks.push(blocked("base_schema_drift", tableName, null, { field: fieldName, reason: "unexpected_field" }));
    }
    for (const spec of BASE_FIELD_SPECS[tableName]) {
      const existing = fields.get(spec.name);
      if (!existing) {
        if (spec.primary) {
          if (!table) continue;
          const primaryFields = table.fields.filter((field) => field.is_primary === true || field.primary === true);
          if (table.record_count === 0 && primaryFields.length === 1 && typeof primaryFields[0].field_id === "string" && primaryFields[0].field_id !== "") {
            fieldActions.push({ id: `primary:${tableName}:${spec.name}`, kind: "update_primary_field", table: tableName, field: spec.name, field_id: primaryFields[0].field_id, phase: "storage", spec: fixedSchemaDescriptor(tableName, spec) });
          } else {
            blocks.push(blocked("base_schema_drift", tableName, null, { field: spec.name, reason: "primary_field_unrecoverable" }));
          }
        } else if (spec.managedReverseOf) {
          const ownerTable = byName.get(spec.managedReverseOf.table);
          if (ownerTable?.fields?.some((field) => field.name === spec.managedReverseOf.field)) {
            blocks.push(blocked("base_schema_drift", tableName, null, { field: spec.name, reason: "managed_reverse_missing" }));
          }
        } else {
          fieldActions.push({ id: `field:${tableName}:${spec.name}`, kind: "create_field", table: tableName, field: spec.name, phase: spec.phase, spec: fixedSchemaDescriptor(tableName, spec) });
        }
        continue;
      }
      if (spec.primary && existing.is_primary !== true && existing.primary !== true) {
        blocks.push(blocked("base_schema_drift", tableName, null, { field: spec.name, reason: "target_primary_not_primary" }));
        continue;
      }
      const expected = expectedFieldConfig(tableName, spec, tableIds);
      if (!configMatches(existing, expected)) blocks.push(blocked("base_schema_drift", tableName, null, { field: spec.name }));
    }
  }
  const actions = fieldActions.sort((left, right) =>
    SCHEMA_APPLY_ORDER.indexOf(left.phase) - SCHEMA_APPLY_ORDER.indexOf(right.phase) ||
    TABLE_ORDER.indexOf(left.table) - TABLE_ORDER.indexOf(right.table) ||
    BASE_FIELD_SPECS[left.table].findIndex((spec) => spec.name === left.field) - BASE_FIELD_SPECS[right.table].findIndex((spec) => spec.name === right.field),
  );
  return { revision, actions: unexpectedTable ? [] : actions, emptyEvidence };
}

function presentationActions() {
  const actions = PRESENTATION.map(([table, viewName]) => ({
    id: `view:${table}:${viewName}`, kind: "configure_view", table, name: viewName, configuration: fixedViewDescriptor(table, viewName),
  }));
  const dashboard = fixedDashboardDescriptor();
  actions.push({ id: `dashboard:${dashboard.name}`, kind: "configure_dashboard", name: dashboard.name, blocks: dashboard.blocks });
  return actions;
}

function maxSuffix(rows, field, pattern) {
  let max = 0;
  for (const row of rows) {
    const match = row[field]?.match(pattern);
    if (!match) fail("migration_manifest_invalid", "Business ID is invalid", { field });
    max = Math.max(max, Number(match[1]));
  }
  return max;
}

function generatedAt(now) {
  const value = typeof now === "function" ? now() : new Date().toISOString();
  const parsed = new Date(value);
  if (typeof value !== "string" || !Number.isFinite(parsed.getTime())) fail("migration_source_invalid", "Migration clock returned an invalid timestamp");
  return parsed.toISOString();
}

export async function planMigration(context = {}) {
  if (!plainObject(context) || !plainObject(context.google)) fail("migration_source_invalid", "Normalized Google source is required");
  if (typeof context.baseBindingSha256 !== "string" || !/^[a-f0-9]{64}$/.test(context.baseBindingSha256)) {
    fail("base_target_mismatch", "A confirmed Base binding fingerprint is required");
  }
  const google = clone(context.google, "migration_source_invalid");
  if (!plainObject(google.raw_backup)) fail("migration_source_invalid", "Token-free Google recovery backup is required");
  const generatedAtValue = generatedAt(context.now);
  const blocks = [];
  const warnings = [];
  const googleAccounts = validateAccountRows(google.accounts, blocks);
  const dramaResult = validateDramaRows(google.dramas, blocks, warnings);
  const sqliteAccounts = clone(context.sqliteAccounts ?? [], "migration_source_invalid");
  const sqlitePostsInput = context.sqlitePosts ?? context.captures ?? (typeof context.readLatestPosts === "function" ? await context.readLatestPosts() : null);
  const sqlitePosts = clone(sqlitePostsInput, "migration_source_invalid");
  const source = migrationSourceRevision({ google, sqliteAccounts, sqlitePosts });
  const sourceRevision = source.revision;
  const captureResult = reconcileCaptureSources(google.captures, sqlitePosts, blocks);
  const captureSources = captureResult.sources;
  const accountResult = reconcileAccounts(googleAccounts, sqliteAccounts, captureSources, blocks, warnings);
  const captures = validateCaptures(captureSources, accountResult.unique, blocks, sourceRevision);
  const capturesByPost = new Map(captures.map((row) => [row["Post ID"], row]));
  const releases = validateReleases(google.releases, accountResult.unique, dramaResult.unique, captureSources, capturesByPost, blocks, warnings, generatedAtValue);
  const initialBaseSchema = omitUndefined(clone(context.baseSchema, "migration_source_invalid"));
  const schema = schemaPlan(initialBaseSchema, blocks);
  const orderedBlocks = orderDiagnostics(blocks);
  const orderedWarnings = orderDiagnostics(warnings);
  const manifest = {
    version: VERSION,
    base_binding_sha256: context.baseBindingSha256,
    source_revision: sourceRevision,
    source_evidence: {
      ...source.evidence,
      counts: {
        google_captures: captureResult.counts.google_captures,
        sqlite_accounts: sqliteAccounts.length,
        sqlite_posts: captureResult.counts.sqlite_posts,
        capture_overlap: captureResult.counts.capture_overlap,
        capture_union: captureResult.counts.capture_union,
      },
    },
    source_backup: clone(google.raw_backup, "migration_source_invalid"),
    initial_base_schema: initialBaseSchema,
    initial_schema_revision: schema.revision,
    initial_empty_table_evidence: schema.emptyEvidence,
    generated_at: generatedAtValue,
    schema_actions: schema.actions,
    presentation_actions: presentationActions(),
    sequence_seeds: {
      drama: maxSuffix(dramaResult.rows, "剧ID", DRAMA_ID),
      release: maxSuffix(releases, "发布ID", RELEASE_ID),
    },
    counts: {
      accounts: accountResult.rows.length,
      dramas: dramaResult.rows.length,
      captures: captures.length,
      releases: releases.length,
      blocked: orderedBlocks.length,
      warnings: orderedWarnings.length,
    },
    accounts: accountResult.rows,
    dramas: dramaResult.rows,
    captures,
    releases,
    blocked: orderedBlocks,
    warnings: orderedWarnings,
    reconciliation: {
      account_stubs: accountResult.stubs,
      capture_merges: captureResult.merges,
      drama_merges: dramaResult.merges,
    },
  };
  manifest.schema_spec_sha256 = sha256({ actions: manifest.schema_actions, contract: fixedSchemaContract() });
  manifest.presentation_spec_sha256 = sha256(manifest.presentation_actions);
  manifest.sha256 = manifestDigest(manifest);
  return clone(manifest);
}

function assertManifest(manifest) {
  const expectedKeys = [
    "accounts", "base_binding_sha256", "blocked", "captures", "counts", "dramas", "generated_at", "initial_base_schema", "initial_empty_table_evidence", "initial_schema_revision", "presentation_actions", "presentation_spec_sha256",
    "reconciliation", "releases", "schema_actions", "schema_spec_sha256", "sequence_seeds", "sha256", "source_backup", "source_evidence", "source_revision", "version", "warnings",
  ];
  if (!plainObject(manifest) || manifest.version !== VERSION || typeof manifest.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(manifest.sha256) ||
      !Array.isArray(manifest.blocked) || !plainObject(manifest.counts) || !Array.isArray(manifest.accounts) ||
      !Array.isArray(manifest.dramas) || !Array.isArray(manifest.captures) || !Array.isArray(manifest.releases) ||
      !Array.isArray(manifest.schema_actions) || !Array.isArray(manifest.presentation_actions) || !plainObject(manifest.sequence_seeds) || !plainObject(manifest.source_backup) ||
      !plainObject(manifest.source_evidence) || !plainObject(manifest.reconciliation) || !Array.isArray(manifest.warnings) ||
      !plainObject(manifest.initial_base_schema) || !plainObject(manifest.initial_empty_table_evidence)) {
    fail("migration_manifest_invalid", "Migration manifest shape is invalid");
  }
  if (!isDeepStrictEqual(Object.keys(manifest).sort(), expectedKeys)) fail("migration_manifest_invalid", "Migration manifest contains unsupported fields");
  if (manifestDigest(manifest) !== manifest.sha256) fail("migration_digest_mismatch", "Migration manifest self-digest does not match");
  if (typeof manifest.source_revision !== "string" || manifest.source_revision === "" ||
      typeof manifest.base_binding_sha256 !== "string" || !/^[a-f0-9]{64}$/.test(manifest.base_binding_sha256) ||
      typeof manifest.initial_schema_revision !== "string" || manifest.initial_schema_revision === "" ||
      typeof manifest.generated_at !== "string" || !Number.isFinite(Date.parse(manifest.generated_at))) {
    fail("migration_manifest_invalid", "Migration manifest metadata is invalid");
  }
  const sourceEvidenceKeys = [
    "counts", "google_capture_post_ids", "google_captures_sha256", "google_revision", "policy",
    "sqlite_account_ids", "sqlite_accounts", "sqlite_accounts_sha256",
    "sqlite_post_ids", "sqlite_posts", "sqlite_posts_sha256",
  ];
  const sourceCountKeys = ["capture_overlap", "capture_union", "google_captures", "sqlite_accounts", "sqlite_posts"];
  const sourceCore = plainObject(manifest.source_evidence) ? {
    policy: manifest.source_evidence.policy,
    google_revision: manifest.source_evidence.google_revision,
    google_capture_post_ids: manifest.source_evidence.google_capture_post_ids,
    google_captures_sha256: manifest.source_evidence.google_captures_sha256,
    sqlite_account_ids: manifest.source_evidence.sqlite_account_ids,
    sqlite_accounts: manifest.source_evidence.sqlite_accounts,
    sqlite_accounts_sha256: manifest.source_evidence.sqlite_accounts_sha256,
    sqlite_post_ids: manifest.source_evidence.sqlite_post_ids,
    sqlite_posts: manifest.source_evidence.sqlite_posts,
    sqlite_posts_sha256: manifest.source_evidence.sqlite_posts_sha256,
  } : null;
  if (!sourceCore || !isDeepStrictEqual(Object.keys(manifest.source_evidence).sort(), sourceEvidenceKeys) ||
      sourceCore.policy !== SOURCE_POLICY || typeof sourceCore.google_revision !== "string" || sourceCore.google_revision === "" ||
      ![sourceCore.google_captures_sha256, sourceCore.sqlite_accounts_sha256, sourceCore.sqlite_posts_sha256].every((value) => typeof value === "string" && /^[a-f0-9]{64}$/.test(value)) ||
      !Array.isArray(sourceCore.google_capture_post_ids) || !Array.isArray(sourceCore.sqlite_account_ids) ||
      !Array.isArray(sourceCore.sqlite_accounts) || !Array.isArray(sourceCore.sqlite_post_ids) || !Array.isArray(sourceCore.sqlite_posts) ||
      sourceCore.sqlite_accounts_sha256 !== sha256(sourceCore.sqlite_accounts) || sourceCore.sqlite_posts_sha256 !== sha256(sourceCore.sqlite_posts) ||
      !plainObject(manifest.source_evidence.counts) || !isDeepStrictEqual(Object.keys(manifest.source_evidence.counts).sort(), sourceCountKeys) ||
      Object.values(manifest.source_evidence.counts).some((value) => !Number.isSafeInteger(value) || value < 0) ||
      manifest.source_evidence.counts.capture_union !== manifest.captures.length ||
      manifest.source_revision !== `migration-source-v2:${sha256(sourceCore)}` ||
      !isDeepStrictEqual(Object.keys(manifest.reconciliation).sort(), ["account_stubs", "capture_merges", "drama_merges"]) ||
      !Object.values(manifest.reconciliation).every(Array.isArray)) {
    fail("migration_manifest_invalid", "Migration source reconciliation evidence is invalid");
  }
  const sourceCounts = manifest.source_evidence.counts;
  let backupGoogle;
  try { backupGoogle = normalizeGoogleSource(manifest.source_backup); }
  catch { fail("migration_manifest_invalid", "Migration Google backup cannot be normalized"); }
  const backupGooglePostIds = exactSourceIds(backupGoogle.captures, "Post ID", (value) => postId(value));
  const sqliteAccountIds = exactSourceIds(sourceCore.sqlite_accounts, "username", (value) => normalizeAccountId(value));
  const sqlitePostIds = exactSourceIds(sourceCore.sqlite_posts, "post_id", (value) => postId(value));
  const expectedUnion = [...new Set([...backupGooglePostIds, ...sqlitePostIds])].sort();
  const actualCaptureIds = manifest.captures.map((row) => row["Post ID"]).sort();
  const expectedOverlap = backupGooglePostIds.filter((id) => new Set(sqlitePostIds).has(id)).length;
  if (backupGoogle.revision !== sourceCore.google_revision || sourceCore.google_captures_sha256 !== sha256(backupGoogle.captures) ||
      !isDeepStrictEqual(sourceCore.google_capture_post_ids, backupGooglePostIds) ||
      !isDeepStrictEqual(sourceCore.sqlite_account_ids, sqliteAccountIds) || !isDeepStrictEqual(sourceCore.sqlite_post_ids, sqlitePostIds) ||
      sourceCounts.google_captures !== backupGooglePostIds.length || sourceCounts.sqlite_accounts !== sqliteAccountIds.length ||
      sourceCounts.sqlite_posts !== sqlitePostIds.length || sourceCounts.capture_overlap !== expectedOverlap ||
      sourceCounts.capture_union !== expectedUnion.length || !isDeepStrictEqual(actualCaptureIds, expectedUnion) ||
      sourceCounts.capture_overlap > Math.min(sourceCounts.google_captures, sourceCounts.sqlite_posts) ||
      sourceCounts.capture_union !== sourceCounts.google_captures + sourceCounts.sqlite_posts - sourceCounts.capture_overlap) {
    fail("migration_manifest_invalid", "Migration source reconciliation counts are inconsistent");
  }
  const replayBlocks = [];
  const replayWarnings = [];
  const replayGoogleAccounts = validateAccountRows(backupGoogle.accounts, replayBlocks);
  const replayDramas = validateDramaRows(backupGoogle.dramas, replayBlocks, replayWarnings);
  const replayCaptureResult = reconcileCaptureSources(backupGoogle.captures, sourceCore.sqlite_posts, replayBlocks);
  const replayAccounts = reconcileAccounts(replayGoogleAccounts, sourceCore.sqlite_accounts, replayCaptureResult.sources, replayBlocks, replayWarnings);
  const replayCaptures = validateCaptures(replayCaptureResult.sources, replayAccounts.unique, replayBlocks, manifest.source_revision);
  const replayCapturesByPost = new Map(replayCaptures.map((row) => [row["Post ID"], row]));
  const replayReleases = validateReleases(
    backupGoogle.releases,
    replayAccounts.unique,
    replayDramas.unique,
    replayCaptureResult.sources,
    replayCapturesByPost,
    replayBlocks,
    replayWarnings,
    manifest.generated_at,
  );
  const replaySchema = schemaPlan(manifest.initial_base_schema, replayBlocks);
  const replayReconciliation = {
    account_stubs: replayAccounts.stubs,
    capture_merges: replayCaptureResult.merges,
    drama_merges: replayDramas.merges,
  };
  if (!isDeepStrictEqual(canonicalize(replayAccounts.rows), canonicalize(manifest.accounts)) ||
      !isDeepStrictEqual(canonicalize(replayDramas.rows), canonicalize(manifest.dramas)) ||
      !isDeepStrictEqual(canonicalize(replayCaptures), canonicalize(manifest.captures)) ||
      !isDeepStrictEqual(canonicalize(replayReleases), canonicalize(manifest.releases)) ||
      !isDeepStrictEqual(canonicalize(replayReconciliation), canonicalize(manifest.reconciliation)) ||
      !isDeepStrictEqual(canonicalize(orderDiagnostics(replayBlocks)), canonicalize(manifest.blocked)) ||
      !isDeepStrictEqual(canonicalize(orderDiagnostics(replayWarnings)), canonicalize(manifest.warnings)) ||
      replaySchema.revision !== manifest.initial_schema_revision ||
      !isDeepStrictEqual(canonicalize(replaySchema.emptyEvidence), canonicalize(manifest.initial_empty_table_evidence)) ||
      !isDeepStrictEqual(canonicalize(replaySchema.actions), canonicalize(manifest.schema_actions))) {
    fail("migration_manifest_invalid", "Migration manifest does not match replayed source and schema planning");
  }
  const evidenceShapeValid = isDeepStrictEqual(Object.keys(manifest.initial_empty_table_evidence).sort(), [...TABLE_ORDER].sort()) &&
    TABLE_ORDER.every((tableName) => {
      const evidence = manifest.initial_empty_table_evidence[tableName];
      return plainObject(evidence) && isDeepStrictEqual(Object.keys(evidence).sort(), ["key_set_sha256", "record_count"]) &&
        (evidence.record_count === null && evidence.key_set_sha256 === null ||
          Number.isSafeInteger(evidence.record_count) && evidence.record_count >= 0 &&
          typeof evidence.key_set_sha256 === "string" && /^[a-f0-9]{64}$/.test(evidence.key_set_sha256));
    });
  const allEmpty = TABLE_ORDER.every((tableName) => isDeepStrictEqual(manifest.initial_empty_table_evidence[tableName], {
    record_count: 0, key_set_sha256: EMPTY_KEY_SET_SHA256,
  }));
  if (!evidenceShapeValid || manifest.blocked.length === 0 && !allEmpty) {
    fail("migration_manifest_invalid", "Migration manifest empty Base evidence is invalid");
  }
  const actualCounts = {
    accounts: manifest.accounts.length,
    dramas: manifest.dramas.length,
    captures: manifest.captures.length,
    releases: manifest.releases.length,
    blocked: manifest.blocked.length,
    warnings: manifest.warnings.length,
  };
  if (!isDeepStrictEqual(canonicalize(manifest.counts), canonicalize(actualCounts))) {
    fail("migration_manifest_invalid", "Migration manifest counts are inconsistent");
  }
  const accountKeys = new Set(manifest.accounts.map((row) => row.账号ID));
  const dramaKeys = new Set(manifest.dramas.map((row) => row.剧ID));
  const captureKeys = new Set(manifest.captures.map((row) => row["Post ID"]));
  const releaseKeys = new Set(manifest.releases.map((row) => row.发布ID));
  const releasePostClaims = manifest.releases
    .map((row) => row["Post ID"])
    .filter((value) => value !== null && value !== undefined && value !== "");
  if (releasePostClaims.some((value) => typeof value !== "string" || !POST_ID.test(value)) ||
      new Set(releasePostClaims).size !== releasePostClaims.length) {
    fail("migration_manifest_invalid", "Migration release Post claims are invalid or duplicate");
  }
  const warningKeys = {
    account_stub_created: ["account_id", "code", "evidence_url", "source", "source_post_ids", "source_row", "table"],
    drama_rows_merged: ["code", "drama_id", "source_row", "source_rows", "table"],
    manual_post_not_found: ["candidates", "code", "release_id", "source_row", "table"],
    ambiguous_post_match: ["candidates", "code", "release_id", "source_row", "table"],
    no_account_time_candidate: ["candidates", "code", "release_id", "source_row", "table"],
  };
  for (const warning of manifest.warnings) {
    if (!plainObject(warning) || !MIGRATION_WARNING_CODES.has(warning.code) ||
        !isDeepStrictEqual(Object.keys(warning).sort(), warningKeys[warning.code]) ||
        !TABLE_ORDER.includes(warning.table) || warning.source_row !== null && (!Number.isSafeInteger(warning.source_row) || warning.source_row < 1)) {
      fail("migration_manifest_invalid", "Migration warning is malformed");
    }
    if (warning.code === "account_stub_created" && (warning.table !== "账号台账" || !accountKeys.has(warning.account_id) ||
        !new Set(["sqlite_account", "google_capture"]).has(warning.source) || typeof warning.evidence_url !== "string" ||
        !Array.isArray(warning.source_post_ids) || warning.source_post_ids.length === 0)) {
      fail("migration_manifest_invalid", "Migration account stub warning is invalid");
    }
    if (warning.code === "drama_rows_merged" && (warning.table !== "选剧池" || !dramaKeys.has(warning.drama_id) || !Array.isArray(warning.source_rows) || warning.source_rows.length < 2)) {
      fail("migration_manifest_invalid", "Migration drama merge warning is invalid");
    }
    if (REVIEWABLE_MATCH_REASONS.has(warning.code) && (warning.table !== "发布记录" || !releaseKeys.has(warning.release_id) || !Array.isArray(warning.candidates) || warning.candidates.some((id) => typeof id !== "string" || !POST_ID.test(id)))) {
      fail("migration_manifest_invalid", "Migration release warning is invalid");
    }
  }
  const releaseById = new Map(manifest.releases.map((row) => [row.发布ID, row]));
  const reviewWarnings = manifest.warnings.filter((warning) => REVIEWABLE_MATCH_REASONS.has(warning.code));
  if (new Set(reviewWarnings.map((warning) => warning.release_id)).size !== reviewWarnings.length) {
    fail("migration_manifest_invalid", "Migration release warnings are duplicate");
  }
  const reviewByRelease = new Map(reviewWarnings.map((warning) => [warning.release_id, warning]));
  for (const warning of reviewWarnings) {
    const release = releaseById.get(warning.release_id);
    if (!release || release.采集记录 !== null || release.匹配方式 !== null || release.匹配置信度 !== null ||
        release.同步错误 !== `待人工关联：${warning.code}` || new Set(warning.candidates).size !== warning.candidates.length) {
      fail("migration_manifest_invalid", "Migration release warning does not match its data row");
    }
  }
  for (const release of manifest.releases) {
    const pending = typeof release.同步错误 === "string" && release.同步错误.startsWith("待人工关联：");
    if (pending !== reviewByRelease.has(release.发布ID)) {
      fail("migration_manifest_invalid", "Migration pending release evidence is incomplete");
    }
  }
  const stubs = manifest.reconciliation.account_stubs;
  const stubWarnings = manifest.warnings
    .filter((warning) => warning.code === "account_stub_created")
    .map(({ account_id, evidence_url, source, source_post_ids }) => ({ account_id, evidence_url, source, source_post_ids }));
  const accountById = new Map(manifest.accounts.map((row) => [row.账号ID, row]));
  const sqliteAccountById = new Map(sourceCore.sqlite_accounts.map((row) => [normalizeAccountId(row.username), row]));
  const sourceCaptureIds = new Set([...backupGooglePostIds, ...sqlitePostIds]);
  const stubsMalformed = stubs.some((stub) => !plainObject(stub) ||
    !isDeepStrictEqual(Object.keys(stub).sort(), ["account_id", "evidence_url", "source", "source_post_ids"]) ||
    !accountKeys.has(stub.account_id) || !new Set(["sqlite_account", "google_capture"]).has(stub.source) ||
    typeof stub.evidence_url !== "string" || accountById.get(stub.account_id)?.主页链接 !== stub.evidence_url ||
    !Array.isArray(stub.source_post_ids) || stub.source_post_ids.length === 0 ||
    new Set(stub.source_post_ids).size !== stub.source_post_ids.length ||
    stub.source_post_ids.some((id) => !sourceCaptureIds.has(id) || !manifest.captures.some((row) => row["Post ID"] === id && row.账号 === stub.account_id)) ||
    stub.source === "sqlite_account" && (!sqliteAccountIds.includes(stub.account_id) || sqliteAccountById.get(stub.account_id)?.account_url !== stub.evidence_url) ||
    stub.source === "google_capture" && (!stub.source_post_ids.some((id) => backupGooglePostIds.includes(id)) || stub.evidence_url !== `https://www.tiktok.com/@${stub.account_id}`));
  if (stubsMalformed || new Set(stubs.map((stub) => stub.account_id)).size !== stubs.length ||
      !isDeepStrictEqual(canonicalize(stubs), canonicalize(stubWarnings))) {
    fail("migration_manifest_invalid", "Migration account stub reconciliation is invalid");
  }
  const captureMerges = manifest.reconciliation.capture_merges;
  if (captureMerges.length !== sourceCounts.capture_overlap || captureMerges.some((merge) =>
    !plainObject(merge) || !isDeepStrictEqual(Object.keys(merge).sort(), ["fallback_fields", "post_id", "primary_source"]) ||
    !captureKeys.has(merge.post_id) || merge.primary_source !== "sqlite" || !Array.isArray(merge.fallback_fields) ||
    merge.fallback_fields.some((field) => !CAPTURE_METRICS.some(([, target]) => target === field))) ||
    new Set(captureMerges.map((merge) => merge.post_id)).size !== captureMerges.length) {
    fail("migration_manifest_invalid", "Migration capture reconciliation is invalid");
  }
  const dramaMerges = manifest.reconciliation.drama_merges;
  if (dramaMerges.some((merge) => !plainObject(merge) ||
      !isDeepStrictEqual(Object.keys(merge).sort(), ["canonical_key", "field_decisions", "output_drama_id", "source_rows"]) ||
      typeof merge.canonical_key !== "string" || merge.canonical_key === "" || !dramaKeys.has(merge.output_drama_id) ||
      !Array.isArray(merge.source_rows) || merge.source_rows.length < 2 || merge.source_rows.some((row) => !Number.isSafeInteger(row) || row < 1) ||
      !plainObject(merge.field_decisions)) ||
      !isDeepStrictEqual(dramaMerges.map((merge) => merge.output_drama_id), manifest.warnings.filter((warning) => warning.code === "drama_rows_merged").map((warning) => warning.drama_id))) {
    fail("migration_manifest_invalid", "Migration drama reconciliation is invalid");
  }
  const expectedSeeds = {
    drama: maxSuffix(manifest.dramas, "剧ID", DRAMA_ID),
    release: maxSuffix(manifest.releases, "发布ID", RELEASE_ID),
  };
  if (!isDeepStrictEqual(canonicalize(manifest.sequence_seeds), canonicalize(expectedSeeds))) {
    fail("migration_manifest_invalid", "Migration manifest sequence seeds are inconsistent");
  }
  const fixedPresentation = presentationActions();
  if (!isDeepStrictEqual(canonicalize(manifest.presentation_actions), canonicalize(fixedPresentation))) {
    fail("migration_manifest_invalid", "Migration presentation actions are not fixed");
  }
  if (manifest.schema_spec_sha256 !== sha256({ actions: manifest.schema_actions, contract: fixedSchemaContract() }) || manifest.presentation_spec_sha256 !== sha256(manifest.presentation_actions)) {
    fail("migration_manifest_invalid", "Migration semantic specification digests are inconsistent");
  }
  const actionIds = new Set();
  for (const action of manifest.schema_actions) {
    if (!plainObject(action) || actionIds.has(action.id) || !TABLE_ORDER.includes(action.table)) {
      fail("migration_manifest_invalid", "Migration schema action is malformed or duplicate");
    }
    actionIds.add(action.id);
    if (action.kind === "create_field") {
      const spec = BASE_FIELD_SPECS[action.table]?.find((field) => field.name === action.field);
      if (!spec || spec.primary || spec.managedReverseOf || !isDeepStrictEqual(Object.keys(action).sort(), ["field", "id", "kind", "phase", "spec", "table"]) ||
          action.id !== `field:${action.table}:${action.field}` || action.phase !== spec.phase || !isDeepStrictEqual(action.spec, fixedSchemaDescriptor(action.table, spec))) {
        fail("migration_manifest_invalid", "Migration field action is not fixed");
      }
    } else if (action.kind === "update_primary_field") {
      const spec = BASE_FIELD_SPECS[action.table]?.find((field) => field.name === action.field);
      if (!spec?.primary || typeof action.field_id !== "string" || action.field_id === "" || action.phase !== "storage" ||
          !isDeepStrictEqual(Object.keys(action).sort(), ["field", "field_id", "id", "kind", "phase", "spec", "table"]) || action.id !== `primary:${action.table}:${action.field}` || !isDeepStrictEqual(action.spec, fixedSchemaDescriptor(action.table, spec))) {
        fail("migration_manifest_invalid", "Migration primary-field action is not fixed");
      }
    } else {
      fail("migration_manifest_invalid", "Migration schema action is unsupported");
    }
  }
}

function assertApplyEnvelope(context, manifest) {
  assertManifest(manifest);
  if (typeof context.baseBindingSha256 !== "string" || context.baseBindingSha256 !== manifest.base_binding_sha256) {
    fail("base_target_mismatch", "Runtime Base does not match the confirmed migration target");
  }
  if (typeof context.expectedSha256 !== "string" || context.expectedSha256 === "") fail("migration_digest_required", "Expected migration digest is required");
  if (context.expectedSha256 !== manifest.sha256) fail("migration_digest_mismatch", "Expected migration digest does not match");
  if (context.sourceRevision !== manifest.source_revision) fail("source_revision_drift", "Migration sources changed after planning");
  if (manifest.blocked.length > 0) fail("migration_blocked", "Migration manifest contains blocked entries", { count: manifest.blocked.length });
}

async function currentSchemaRevision(context) {
  const reader = context.getSchemaRevision ?? context.schemaAdapter?.getSchemaRevision;
  if (typeof reader !== "function") fail("migration_context_invalid", "Current Base schema revision reader is required");
  const revision = await reader();
  if (typeof revision !== "string" || revision.trim() === "") fail("schema_revision_drift", "Current Base schema revision is invalid");
  return revision;
}

function assertSchemaReceipt(context, manifest, receipt = context.schemaReceipt) {
  if (!plainObject(receipt) || receipt.version !== "shortdrama-schema-receipt/v1" || receipt.status !== "verified" ||
      receipt.manifest_sha256 !== manifest.sha256 || receipt.pre_revision !== manifest.initial_schema_revision ||
      receipt.base_binding_sha256 !== manifest.base_binding_sha256 ||
      receipt.action_spec_sha256 !== manifest.schema_spec_sha256 || typeof receipt.post_revision !== "string" || receipt.post_revision === "" ||
      typeof receipt.sha256 !== "string" || receipt.sha256 !== context.expectedSchemaReceiptSha256 || schemaReceiptDigest(receipt) !== receipt.sha256 ||
      !isDeepStrictEqual(Object.keys(receipt).sort(), ["action_spec_sha256", "base_binding_sha256", "manifest_sha256", "post_revision", "pre_revision", "sha256", "status", "version"])) {
    fail("migration_schema_receipt_required", "An authentic schema receipt for this manifest is required");
  }
  return receipt;
}

function assertCanaryReceipt(context, manifest, schemaReceipt) {
  const receipt = context.canaryReceipt;
  const proofValid = plainObject(receipt?.proof) && isDeepStrictEqual(Object.keys(receipt.proof).sort(), [...TABLE_ORDER].sort()) &&
    TABLE_ORDER.every((tableName) => {
      const proof = receipt.proof[tableName];
      return plainObject(proof) && isDeepStrictEqual(Object.keys(proof).sort(), [
        "after_key_set_sha256", "before_key_set_sha256", "canary_primary_sha256", "count_after",
        "count_before", "created", "deleted", "readback_verified", "record_id_sha256",
      ]) && proof.created === true && proof.readback_verified === true && proof.deleted === true &&
        Number.isSafeInteger(proof.count_before) && proof.count_before >= 0 && proof.count_after === proof.count_before &&
        proof.after_key_set_sha256 === proof.before_key_set_sha256 &&
        proof.count_before === manifest.initial_empty_table_evidence[tableName]?.record_count &&
        proof.before_key_set_sha256 === manifest.initial_empty_table_evidence[tableName]?.key_set_sha256 &&
        [proof.before_key_set_sha256, proof.canary_primary_sha256, proof.record_id_sha256]
          .every((value) => typeof value === "string" && /^[a-f0-9]{64}$/.test(value));
    });
  if (!plainObject(receipt) || receipt.version !== "shortdrama-canary-receipt/v1" || receipt.status !== "verified" ||
      receipt.manifest_sha256 !== manifest.sha256 || receipt.base_binding_sha256 !== manifest.base_binding_sha256 ||
      receipt.schema_revision !== schemaReceipt.post_revision || typeof receipt.table_bindings_sha256 !== "string" ||
      !/^[a-f0-9]{64}$/.test(receipt.table_bindings_sha256) ||
      receipt.table_bindings_sha256 !== context.tableBindingsSha256 || !proofValid ||
      typeof receipt.generated_at !== "string" || parseQualifiedInstantMs(receipt.generated_at) === null ||
      typeof receipt.sha256 !== "string" || receipt.sha256 !== context.expectedCanaryReceiptSha256 ||
      canaryReceiptDigest(receipt) !== receipt.sha256 ||
      !isDeepStrictEqual(Object.keys(receipt).sort(), [
        "base_binding_sha256", "generated_at", "manifest_sha256", "proof", "schema_revision", "sha256",
        "status", "table_bindings_sha256", "version",
      ])) {
    fail("migration_canary_required", "An authentic same-Base canary receipt is required");
  }
  return receipt;
}

async function assertBaseEmptyBeforeData(context, manifest) {
  if (typeof context.readEmptyTableEvidence !== "function") {
    fail("migration_context_invalid", "Fresh empty Base evidence reader is required");
  }
  const actual = await context.readEmptyTableEvidence();
  if (!plainObject(actual) || !isDeepStrictEqual(canonicalize(actual), canonicalize(manifest.initial_empty_table_evidence))) {
    fail("base_not_empty", "Formal Base is no longer the empty migration target");
  }
}

function assertPermissionAttestation(context, manifest, schemaReceipt) {
  const attestation = context.permissionAttestation;
  const checkedAt = parseQualifiedInstantMs(attestation?.checked_at);
  const nowValue = typeof context.now === "function" ? context.now() : new Date();
  const nowMs = nowValue instanceof Date ? nowValue.getTime() : parseQualifiedInstantMs(nowValue);
  const age = checkedAt === null || !Number.isFinite(nowMs) ? null : nowMs - checkedAt;
  if (!plainObject(attestation) || attestation.version !== "shortdrama-permission-attestation/v1" ||
      attestation.base_binding_sha256 !== manifest.base_binding_sha256 ||
      attestation.schema_revision !== schemaReceipt.post_revision ||
      attestation.advanced_permissions_enabled !== true ||
      attestation.primary_and_machine_fields_protected !== true ||
      attestation.company_user_access_verified !== true ||
      typeof context.actorId !== "string" || attestation.checked_by !== context.actorId ||
      checkedAt === null || age === null || age < -5 * 60_000 || age > 24 * 60 * 60_000 ||
      typeof attestation.sha256 !== "string" || attestation.sha256 !== context.expectedPermissionAttestationSha256 ||
      permissionAttestationDigest(attestation) !== attestation.sha256 ||
      !isDeepStrictEqual(Object.keys(attestation).sort(), [
        "advanced_permissions_enabled", "base_binding_sha256", "checked_at", "checked_by",
        "company_user_access_verified", "primary_and_machine_fields_protected", "schema_revision", "sha256", "version",
      ])) {
    fail("migration_permission_attestation_required", "Recent externally observed Base permission evidence is required");
  }
  return attestation;
}

export function createPermissionAttestation({ manifest, schemaReceipt, observations, actorId, now = () => new Date() } = {}) {
  assertManifest(manifest);
  const receipt = assertSchemaReceipt({ expectedSchemaReceiptSha256: schemaReceipt?.sha256 }, manifest, schemaReceipt);
  const expectedKeys = [
    "advanced_permissions_enabled", "checked_at", "checked_by", "company_user_access_verified",
    "observed_via", "primary_and_machine_fields_protected", "version",
  ];
  const checkedAt = parseQualifiedInstantMs(observations?.checked_at);
  const current = typeof now === "function" ? now() : null;
  const currentMs = current instanceof Date ? current.getTime() : parseQualifiedInstantMs(current);
  const age = checkedAt === null || !Number.isFinite(currentMs) ? null : currentMs - checkedAt;
  if (!plainObject(observations) || !isDeepStrictEqual(Object.keys(observations).sort(), expectedKeys) ||
      observations.version !== "shortdrama-permission-observations/v1" ||
      !["company-user-ui", "lark-cli-user-readback"].includes(observations.observed_via) ||
      observations.advanced_permissions_enabled !== true || observations.primary_and_machine_fields_protected !== true ||
      observations.company_user_access_verified !== true || observations.checked_by !== actorId ||
      checkedAt === null || age === null || age < -5 * 60_000 || age > 24 * 60 * 60_000) {
    fail("migration_permission_attestation_required", "Explicit recent company-user permission observations are required");
  }
  const attestation = {
    version: "shortdrama-permission-attestation/v1",
    base_binding_sha256: manifest.base_binding_sha256,
    schema_revision: receipt.post_revision,
    advanced_permissions_enabled: true,
    primary_and_machine_fields_protected: true,
    company_user_access_verified: true,
    checked_by: actorId,
    checked_at: observations.checked_at,
  };
  attestation.sha256 = permissionAttestationDigest(attestation);
  return clone(attestation);
}

function assertRepoSet(repos, { write = true } = {}) {
  if (!objectLike(repos)) fail("migration_context_invalid", "Migration repositories are required");
  for (const name of Object.values(TABLE_BINDINGS)) {
    if (repos[name] === null || typeof repos[name] !== "object" || typeof repos[name].loadIndex !== "function" ||
        (write && typeof repos[name].syncManyByKey !== "function")) {
      fail("migration_context_invalid", "Migration repository is incompatible", { repository: name });
    }
  }
}

function validateStableRelations(manifest) {
  const accounts = new Set(manifest.accounts.map((row) => row.账号ID));
  const dramas = new Set(manifest.dramas.map((row) => row.剧ID));
  const captures = new Set(manifest.captures.map((row) => row["Post ID"]));
  const sets = [accounts, dramas, captures];
  if (sets.some((set, at) => set.size !== [manifest.accounts, manifest.dramas, manifest.captures][at].length)) fail("migration_manifest_invalid", "Migration manifest contains duplicate keys");
  if (new Set(manifest.releases.map((row) => row.发布ID)).size !== manifest.releases.length) fail("migration_manifest_invalid", "Migration manifest contains duplicate release IDs");
  for (const row of manifest.captures) {
    if (!accounts.has(row.账号)) fail("migration_manifest_invalid", "Capture has an unresolved account relation");
    prevalidateRow("采集数据", row, new Set(["账号"]));
  }
  for (const row of manifest.releases) {
    if (!accounts.has(row.账号) || !dramas.has(row.剧) || row.采集记录 !== null && !captures.has(row.采集记录)) {
      fail("migration_manifest_invalid", "Release has an unresolved stable relation");
    }
    prevalidateRow("发布记录", row, new Set(["账号", "剧", "采集记录"]));
  }
  manifest.accounts.forEach((row) => prevalidateRow("账号台账", row));
  manifest.dramas.forEach((row) => prevalidateRow("选剧池", row));
}

function prevalidateRow(tableName, row, relationFields = new Set()) {
  if (!plainObject(row)) fail("migration_manifest_invalid", "Migration row is malformed", { table: tableName });
  const primary = TABLES[tableName].primaryField;
  if (typeof row[primary] !== "string" || row[primary] === "") fail("migration_manifest_invalid", "Migration row primary key is invalid", { table: tableName });
  for (const field of Object.keys(row)) {
    if (relationFields.has(field)) continue;
    const owner = fieldOwner(tableName, field);
    if (owner === "derived") fail("migration_manifest_invalid", "Migration row contains a derived field", { table: tableName, field });
  }
}

function recordIdMap(index, tableName) {
  if (!(index instanceof Map)) fail("readback_mismatch", "Repository index is not complete", { table: tableName });
  const result = new Map();
  const recordIds = new Set();
  for (const [key, record] of index) {
    if (typeof key !== "string" || !plainObject(record) || typeof record.record_id !== "string" || record.record_id === "" || !plainObject(record.fields)) {
      fail("readback_mismatch", "Repository index contains a malformed record", { table: tableName });
    }
    if (recordIds.has(record.record_id)) fail("readback_mismatch", "Repository index contains duplicate record IDs", { table: tableName });
    recordIds.add(record.record_id);
    result.set(key, record.record_id);
  }
  return result;
}

function entriesFor(rows, tableName, relationIds = {}) {
  const primary = TABLES[tableName].primaryField;
  return rows.map((row) => {
    const patch = clone(row);
    delete patch[primary];
    if (tableName === "采集数据") {
      const accountId = patch.账号;
      patch.账号 = [{ id: relationIds.accounts.get(accountId) }];
    }
    if (tableName === "发布记录") {
      const accountId = patch.账号;
      const dramaId = patch.剧;
      const captureId = patch.采集记录;
      patch.账号 = [{ id: relationIds.accounts.get(accountId) }];
      patch.剧 = [{ id: relationIds.dramas.get(dramaId) }];
      patch.采集记录 = captureId === null ? [] : [{ id: relationIds.captures.get(captureId) }];
    }
    return { key: row[primary], patch };
  });
}

async function applyData(context, manifest) {
  assertRepoSet(context.repos);
  validateStableRelations(manifest);
  const relationIds = {};
  const ordered = [
    ["账号台账", manifest.accounts], ["选剧池", manifest.dramas],
    ["采集数据", manifest.captures], ["发布记录", manifest.releases],
  ];
  const summaries = {};
  for (const [tableName, rows] of ordered) {
    const name = TABLE_BINDINGS[tableName];
    const entries = entriesFor(rows, tableName, relationIds);
    summaries[name] = await context.repos[name].syncManyByKey(entries, "migration");
    if (!plainObject(summaries[name]) || summaries[name].readback !== "verified") {
      fail("readback_mismatch", "Bulk migration sync did not return verified readback", { table: tableName });
    }
    relationIds[name] = recordIdMap(await context.repos[name].loadIndex(), tableName);
  }
  return summaries;
}

async function applySchema(context, manifest) {
  const adapter = context.schemaAdapter;
  if (!objectLike(adapter) || typeof adapter.createField !== "function" ||
      typeof adapter.updateField !== "function" || typeof adapter.readSchema !== "function" || typeof adapter.verifySchemaAction !== "function") {
    fail("migration_context_invalid", "Fixed schema adapter is required");
  }
  const readSchema = async () => {
    const schema = await adapter.readSchema();
    if (!plainObject(schema) || schema.complete !== true || !Array.isArray(schema.tables)) fail("readback_mismatch", "Complete Base schema readback is required");
    const tables = new Map();
    for (const table of schema.tables) {
      if (!plainObject(table) || typeof table.name !== "string" || typeof table.table_id !== "string" || tables.has(table.name) || !Array.isArray(table.fields ?? [])) {
        fail("readback_mismatch", "Base schema readback is malformed");
      }
      tables.set(table.name, table);
    }
    return { schema, tables };
  };
  for (const action of manifest.schema_actions) {
    const before = await readSchema();
    if (action.kind === "create_field") {
      const table = before.tables.get(action.table);
      if (!table) fail("readback_mismatch", "Schema action target table is missing", { action: action.id });
      const spec = BASE_FIELD_SPECS[action.table].find((item) => item.name === action.field && !item.primary && !item.managedReverseOf);
      if (!spec) fail("migration_manifest_invalid", "Schema field action is unsupported");
      if (!(table.fields ?? []).some((field) => field.name === action.field)) {
        const bindings = spec.kind === "link" ? { targetTableId: before.tables.get(spec.targetTable)?.table_id } : {};
        if (spec.kind === "link" && typeof bindings.targetTableId !== "string") fail("readback_mismatch", "Link target table is unresolved", { action: action.id });
        await adapter.createField(table.table_id, action.table, action.field, bindings);
      }
    } else if (action.kind === "update_primary_field") {
      const table = before.tables.get(action.table);
      if (!table || !(table.fields ?? []).some((field) => field.field_id === action.field_id)) fail("readback_mismatch", "Primary bootstrap field is unresolved", { action: action.id });
      if (!(table.fields ?? []).some((field) => field.field_id === action.field_id && field.name === action.field)) {
        await adapter.updateField(table.table_id, action.field_id, action.table, action.field);
      }
    } else fail("migration_manifest_invalid", "Schema action is unsupported");
    const after = await readSchema();
    const tableAfter = after.tables.get(action.table);
    if (!tableAfter || !(tableAfter.fields ?? []).some((field) => field.name === action.field)) {
      fail("readback_mismatch", "Schema action did not appear in complete readback", { action: action.id });
    }
    const verified = await adapter.verifySchemaAction(clone(action), clone(after.schema));
    if (verified !== true) fail("readback_mismatch", "Schema action readback failed", { action: action.id });
  }
  const final = await readSchema();
  const finalTableIds = Object.fromEntries([...final.tables].map(([name, table]) => [name, table.table_id]));
  for (const tableName of TABLE_ORDER) {
    const fields = final.tables.get(tableName)?.fields ?? [];
    const names = fields.map((field) => field.name).sort();
    const expectedNames = BASE_FIELD_SPECS[tableName].map((spec) => spec.name).sort();
    if (!isDeepStrictEqual(names, expectedNames)) fail("readback_mismatch", "Final Base field set does not match the fixed schema", { table: tableName, expected: expectedNames, actual: names });
    const byName = new Map(fields.map((field) => [field.name, field]));
    for (const spec of BASE_FIELD_SPECS[tableName]) {
      const actual = byName.get(spec.name);
      if (!plainObject(actual) || !configMatches(actual, expectedFieldConfig(tableName, spec, finalTableIds)) ||
          spec.primary && actual.is_primary !== true && actual.primary !== true) {
        fail("readback_mismatch", "Final Base field semantics do not match the fixed schema", { table: tableName, field: spec.name });
      }
    }
  }
}

async function applyPresentation(context, manifest) {
  const adapter = context.presentationAdapter;
  if (!objectLike(adapter) || typeof adapter.readSchema !== "function" || typeof adapter.listViews !== "function" ||
      typeof adapter.createView !== "function" || typeof adapter.updateView !== "function" || typeof adapter.readViewConfiguration !== "function" || typeof adapter.listDashboards !== "function" ||
      typeof adapter.createDashboard !== "function" || typeof adapter.listDashboardBlocks !== "function" ||
      typeof adapter.createDashboardBlock !== "function" || typeof adapter.readDashboardBlock !== "function" ||
      typeof adapter.updateDashboardBlock !== "function") {
    fail("migration_context_invalid", "Fixed presentation adapter is required");
  }
  const fixed = new Map(presentationActions().map((action) => [action.id, action]));
  const schema = await adapter.readSchema();
  if (!plainObject(schema) || schema.complete !== true || !Array.isArray(schema.tables)) fail("readback_mismatch", "Complete presentation table readback is required");
  const tables = new Map(schema.tables.map((table) => [table.name, table]));
  const semanticReadbacks = [];
  for (const action of manifest.presentation_actions) {
    if (!isDeepStrictEqual(canonicalize(action), canonicalize(fixed.get(action.id)))) fail("migration_manifest_invalid", "Presentation action is not fixed");
    let readback;
    if (action.kind === "configure_view") {
      const table = tables.get(action.table);
      if (!table || typeof table.table_id !== "string") fail("readback_mismatch", "Presentation table is unresolved", { action: action.id });
      const listed = await adapter.listViews(table.table_id, action.table);
      if (!plainObject(listed) || listed.complete !== true || !Array.isArray(listed.items)) fail("readback_mismatch", "Complete view readback is required", { action: action.id });
      const matches = listed.items.filter((view) => view.name === action.name);
      if (matches.length > 1) fail("base_schema_drift", "Duplicate fixed view name", { action: action.id });
      const existingType = matches[0]?.type ?? matches[0]?.view_type;
      if (matches.length === 1 && (existingType !== action.configuration.type ||
          matches[0].type !== undefined && matches[0].view_type !== undefined && matches[0].type !== matches[0].view_type)) {
        fail("base_schema_drift", "View immutable type does not match the fixed presentation schema", { action: action.id });
      }
      const created = matches[0] ?? await adapter.createView(table.table_id, action.table, action.name);
      const viewId = created?.view_id;
      if (typeof viewId !== "string" || viewId === "") fail("readback_mismatch", "View ID is unresolved", { action: action.id });
      await adapter.updateView(table.table_id, viewId, action.table, action.name);
      readback = await adapter.listViews(table.table_id, action.table);
      if (!plainObject(readback) || readback.complete !== true || !Array.isArray(readback.items) ||
          readback.items.filter((view) => view.name === action.name && view.view_id === viewId).length !== 1) {
        fail("readback_mismatch", "Configured view is missing from complete readback", { action: action.id });
      }
      const finalView = readback.items.find((view) => view.name === action.name && view.view_id === viewId);
      const finalType = finalView.type ?? finalView.view_type;
      if (finalType !== action.configuration.type || finalView.type !== undefined && finalView.view_type !== undefined && finalView.type !== finalView.view_type) {
        fail("base_schema_drift", "Configured view immutable type drifted", { action: action.id });
      }
      const configuration = await adapter.readViewConfiguration(table.table_id, viewId, action.table, action.name, table.fields);
      const expected = {
        filter: action.configuration.filter,
        sort: action.configuration.sort,
        group: action.configuration.group,
        visible_fields: action.configuration.visible_fields,
      };
      if (!isDeepStrictEqual(canonicalize(configuration), canonicalize(expected))) fail("readback_mismatch", "View configuration does not match the fixed semantic contract", { action: action.id });
      semanticReadbacks.push({ id: action.id, sha256: sha256({ type: finalType, ...configuration }) });
    } else if (action.kind === "configure_dashboard") {
      const listed = await adapter.listDashboards();
      if (!plainObject(listed) || listed.complete !== true || !Array.isArray(listed.items)) fail("readback_mismatch", "Complete dashboard readback is required");
      const matches = listed.items.filter((dashboard) => dashboard.name === action.name);
      if (matches.length > 1) fail("base_schema_drift", "Duplicate fixed dashboard name");
      const dashboard = matches[0] ?? await adapter.createDashboard(action.name);
      const dashboardId = dashboard?.dashboard_id;
      if (typeof dashboardId !== "string" || dashboardId === "") fail("readback_mismatch", "Dashboard ID is unresolved");
      const blocks = await adapter.listDashboardBlocks(dashboardId);
      if (!plainObject(blocks) || blocks.complete !== true || !Array.isArray(blocks.items)) fail("readback_mismatch", "Complete dashboard block readback is required");
      const blockReadbacks = [];
      for (const blockSpec of action.blocks) {
        const blockMatches = blocks.items.filter((block) => block.name === blockSpec.name);
        if (blockMatches.length > 1) fail("base_schema_drift", "Duplicate fixed dashboard block", { block: blockSpec.name });
        let block = blockMatches[0] ?? await adapter.createDashboardBlock(dashboardId, blockSpec.name);
        if (typeof block?.block_id !== "string" || block.block_id === "") fail("readback_mismatch", "Dashboard block ID is unresolved", { block: blockSpec.name });
        block = await adapter.readDashboardBlock(dashboardId, block.block_id, blockSpec.name);
        if (block.type !== blockSpec.type) fail("base_schema_drift", "Dashboard block immutable type drift", { block: blockSpec.name });
        if (!isDeepStrictEqual(canonicalize(block.data_config), canonicalize(blockSpec.data_config))) {
          await adapter.updateDashboardBlock(dashboardId, block.block_id, blockSpec.name);
          block = await adapter.readDashboardBlock(dashboardId, block.block_id, blockSpec.name);
        }
        const expectedBlock = { name: blockSpec.name, type: blockSpec.type, data_config: blockSpec.data_config };
        const actualBlock = { name: block.name, type: block.type, data_config: block.data_config };
        if (!isDeepStrictEqual(canonicalize(actualBlock), canonicalize(expectedBlock))) fail("readback_mismatch", "Dashboard block does not match the fixed semantic contract", { block: blockSpec.name });
        blockReadbacks.push({ name: blockSpec.name, block_id: block.block_id, sha256: sha256(actualBlock) });
      }
      readback = await adapter.listDashboardBlocks(dashboardId);
      if (!plainObject(readback) || readback.complete !== true || !Array.isArray(readback.items) ||
          action.blocks.some((blockSpec) => readback.items.filter((block) => block.name === blockSpec.name).length !== 1)) {
        fail("readback_mismatch", "Dashboard blocks are missing from complete readback", { action: action.id });
      }
      semanticReadbacks.push({ id: action.id, sha256: sha256(blockReadbacks) });
    } else fail("migration_manifest_invalid", "Presentation action is unsupported");
  }
  return semanticReadbacks;
}

function assertVerificationProof(context, manifest) {
  const report = context.verification;
  const expectedCounts = {
    accounts: manifest.accounts.length,
    dramas: manifest.dramas.length,
    captures: manifest.captures.length,
    releases: manifest.releases.length,
  };
  if (!plainObject(report) || report.status !== "verified" || report.manifest_sha256 !== manifest.sha256 ||
      report.base_binding_sha256 !== manifest.base_binding_sha256 ||
      typeof report.sha256 !== "string" || report.sha256 !== context.expectedVerificationSha256 ||
      verificationDigest(report) !== report.sha256 ||
      !isDeepStrictEqual(canonicalize(report.counts), canonicalize(expectedCounts)) ||
      report.details?.exact_primary_key_sets !== true || report.details?.exact_writable_fields !== true ||
      report.details?.exact_relation_ids !== true || report.details?.source_union_verified !== true ||
      report.details?.pending_release_warnings_verified !== true ||
      !isDeepStrictEqual(report.details?.latest_capture_post_ids, manifest.captures.map((row) => row["Post ID"]).sort())) {
    fail("migration_verification_required", "A self-consistent verification report for this manifest is required");
  }
}

export async function applyMigration(context = {}, manifest) {
  if (!plainObject(context)) fail("migration_context_invalid", "Migration context is invalid");
  assertApplyEnvelope(context, manifest);
  const phase = context.phase ?? "data";
  if (!new Set(["schema", "data", "presentation", "sequences"]).has(phase)) fail("migration_phase_invalid", "Migration phase is invalid");
  if (phase === "schema") {
    const current = await currentSchemaRevision(context);
    if (context.schemaReceipt !== undefined || context.expectedSchemaReceiptSha256 !== undefined) {
      const receipt = assertSchemaReceipt(context, manifest);
      if (current !== receipt.post_revision) fail("schema_revision_drift", "Base schema revision does not match the completed schema receipt");
      await applySchema(context, manifest);
      return { status: "applied", phase, manifest_sha256: manifest.sha256, schema_receipt: clone(receipt), reused: true };
    }
    if (current !== manifest.initial_schema_revision) fail("schema_revision_drift", "Base schema revision changed after planning");
    await applySchema(context, manifest);
    const postRevision = await currentSchemaRevision(context);
    const receipt = {
      version: "shortdrama-schema-receipt/v1",
      status: "verified",
      manifest_sha256: manifest.sha256,
      base_binding_sha256: manifest.base_binding_sha256,
      pre_revision: manifest.initial_schema_revision,
      post_revision: postRevision,
      action_spec_sha256: manifest.schema_spec_sha256,
    };
    receipt.sha256 = schemaReceiptDigest(receipt);
    return { status: "applied", phase, manifest_sha256: manifest.sha256, schema_receipt: receipt, reused: false };
  }
  const receipt = assertSchemaReceipt(context, manifest);
  if (await currentSchemaRevision(context) !== receipt.post_revision) fail("schema_revision_drift", "Base schema revision changed after schema verification");
  assertCanaryReceipt(context, manifest, receipt);
  if (phase === "data") assertPermissionAttestation(context, manifest, receipt);
  if (phase === "data") {
    await assertBaseEmptyBeforeData(context, manifest);
    await applyData(context, manifest);
  }
  if (phase === "presentation") {
    const readbacks = await applyPresentation(context, manifest);
    const presentationReceipt = {
      version: "shortdrama-presentation-receipt/v1",
      status: "verified",
      manifest_sha256: manifest.sha256,
      base_binding_sha256: manifest.base_binding_sha256,
      schema_receipt_sha256: receipt.sha256,
      presentation_spec_sha256: manifest.presentation_spec_sha256,
      semantic_readbacks: readbacks,
      semantic_sha256: sha256(readbacks),
    };
    presentationReceipt.sha256 = presentationReceiptDigest(presentationReceipt);
    return { status: "applied", phase, manifest_sha256: manifest.sha256, schema_receipt_sha256: receipt.sha256, presentation_receipt: presentationReceipt };
  }
  if (phase === "sequences") {
    assertVerificationProof(context, manifest);
    if (typeof context.seedSequence !== "function") fail("migration_context_invalid", "Sequence seed function is required");
    await context.seedSequence("drama", manifest.sequence_seeds.drama);
    await context.seedSequence("release", manifest.sequence_seeds.release);
  }
  return { status: "applied", phase, manifest_sha256: manifest.sha256, schema_receipt_sha256: receipt.sha256 };
}

function assertExactKeys(index, expectedRows, primary, tableName) {
  if (!(index instanceof Map)) fail("readback_mismatch", "Repository index is incomplete", { table: tableName });
  const expected = expectedRows.map((row) => row[primary]).sort();
  const actual = [...index.keys()].sort();
  if (!isDeepStrictEqual(actual, expected)) fail("readback_mismatch", "Base primary-key set does not match the manifest", { table: tableName, expected, actual });
}

function assertExpectedFields(index, entries, primary, tableName) {
  const writable = new Set([primary, ...TABLES[tableName].human, ...TABLES[tableName].machine, ...TABLES[tableName].shared]);
  for (const entry of entries) {
    const record = index.get(entry.key);
    if (!plainObject(record) || !plainObject(record.fields) || record.fields[primary] !== entry.key) fail("readback_mismatch", "Base record is malformed", { table: tableName, key: entry.key });
    const expectedKeys = [primary, ...Object.keys(entry.patch)].sort();
    const actualKeys = Object.keys(record.fields).filter((field) => writable.has(field)).sort();
    if (!isDeepStrictEqual(actualKeys, expectedKeys)) {
      fail("readback_mismatch", "Base writable field set does not match the migration manifest", { table: tableName, key: entry.key, expected: expectedKeys, actual: actualKeys });
    }
    for (const [field, expected] of Object.entries(entry.patch)) {
      if (!Object.hasOwn(record.fields, field) || !isDeepStrictEqual(canonicalize(record.fields[field]), canonicalize(expected))) {
        fail("readback_mismatch", "Base field does not match the migration manifest", { table: tableName, key: entry.key, field });
      }
    }
  }
}

export async function verifyMigration(context = {}, manifest) {
  assertManifest(manifest);
  if (context.baseBindingSha256 !== manifest.base_binding_sha256) fail("base_target_mismatch", "Runtime Base does not match the verified migration target");
  assertRepoSet(context.repos, { write: false });
  validateStableRelations(manifest);
  const indexes = {};
  for (const tableName of TABLE_ORDER) {
    const name = TABLE_BINDINGS[tableName];
    indexes[name] = await context.repos[name].loadIndex();
    const rows = manifest[name];
    assertExactKeys(indexes[name], rows, TABLES[tableName].primaryField, tableName);
  }
  const relationIds = {
    accounts: recordIdMap(indexes.accounts, "账号台账"),
    dramas: recordIdMap(indexes.dramas, "选剧池"),
    captures: recordIdMap(indexes.captures, "采集数据"),
    releases: recordIdMap(indexes.releases, "发布记录"),
  };
  for (const tableName of TABLE_ORDER) {
    const name = TABLE_BINDINGS[tableName];
    const entries = entriesFor(manifest[name], tableName, relationIds);
    assertExpectedFields(indexes[name], entries, TABLES[tableName].primaryField, tableName);
  }
  const report = {
    status: "verified",
    manifest_sha256: manifest.sha256,
    base_binding_sha256: manifest.base_binding_sha256,
    generated_at: generatedAt(context.now),
    counts: {
      accounts: indexes.accounts.size,
      dramas: indexes.dramas.size,
      captures: indexes.captures.size,
      releases: indexes.releases.size,
    },
    details: {
      exact_primary_key_sets: true,
      exact_writable_fields: true,
      exact_relation_ids: true,
      source_union_verified: true,
      pending_release_warnings_verified: true,
      latest_capture_post_ids: manifest.captures.map((row) => row["Post ID"]).sort(),
    },
  };
  report.sha256 = verificationDigest(report);
  return clone(report);
}

function artifactFileName(fileName) {
  if (typeof fileName !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._-]*\.json$/.test(fileName) || fileName.includes("..")) {
    fail("migration_artifact_invalid", "Migration artifact file name is invalid");
  }
  return fileName;
}

async function inspectArtifactDirectory(path, { create = false, privateDirectory = false } = {}) {
  let info;
  try { info = await lstat(path); }
  catch (error) {
    if (error?.code !== "ENOENT" || !create) fail("migration_artifact_invalid", "Migration artifact directory is unavailable");
    try { await mkdir(path, { mode: 0o700 }); } catch (cause) {
      if (cause?.code !== "EEXIST") fail("migration_artifact_invalid", "Migration artifact directory could not be created");
    }
    info = await lstat(path);
  }
  if (info.isSymbolicLink() || !info.isDirectory()) fail("migration_artifact_invalid", "Migration artifact directory must not be a symlink");
  if (privateDirectory) {
    const uid = process.getuid?.();
    if (Number.isSafeInteger(uid) && info.uid !== uid) fail("migration_artifact_invalid", "Migration artifact directory must be owned by the current user");
    if ((info.mode & 0o777) !== 0o700) {
      try { await chmod(path, 0o700); }
      catch { fail("migration_artifact_invalid", "Migration artifact directory permissions could not be restricted"); }
      info = await lstat(path);
      if ((info.mode & 0o777) !== 0o700 || Number.isSafeInteger(uid) && info.uid !== uid) {
        fail("migration_artifact_invalid", "Migration artifact directory must remain private and owned");
      }
    }
  }
}

async function secureArtifactRoot() {
  await inspectArtifactDirectory(ARTIFACT_TRUST_ROOT);
  let cursor = ARTIFACT_TRUST_ROOT;
  for (const component of ["short-drama-release-manager", "migrations"]) {
    cursor = resolve(cursor, component);
    await inspectArtifactDirectory(cursor, { create: true, privateDirectory: true });
  }
  const trustedReal = await realpath(ARTIFACT_TRUST_ROOT);
  const rootReal = await realpath(ARTIFACT_ROOT);
  const remainder = relative(trustedReal, rootReal);
  if (remainder === "" || remainder === ".." || remainder.startsWith(`..${sep}`) || resolve(rootReal) !== ARTIFACT_ROOT) {
    fail("migration_artifact_invalid", "Migration artifact directory escaped the trusted output root");
  }
  const info = await lstat(rootReal);
  return { path: rootReal, dev: info.dev, ino: info.ino };
}

export async function reserveMigrationArtifact(fileName) {
  const safeName = artifactFileName(fileName);
  const initialRoot = await secureArtifactRoot();
  const path = resolve(initialRoot.path, safeName);
  if (dirname(path) !== initialRoot.path) fail("migration_artifact_invalid", "Migration artifact path escaped the fixed output root");
  try {
    const existing = await lstat(path);
    if (existing.isSymbolicLink()) fail("migration_artifact_invalid", "Migration artifact target must not be a symlink");
    fail("migration_artifact_exists", "Migration artifact already exists", { file_name: safeName });
  } catch (error) {
    if (error instanceof ShortDramaError) throw error;
    if (error?.code !== "ENOENT") fail("migration_artifact_invalid", "Migration artifact target could not be inspected");
  }
  let handle;
  try {
    handle = await open(path, fsConstants.O_WRONLY | fsConstants.O_CREAT | fsConstants.O_EXCL | fsConstants.O_NOFOLLOW, 0o600);
  } catch (error) {
    if (error?.code === "EEXIST") fail("migration_artifact_exists", "Migration artifact already exists", { file_name: safeName });
    if (error?.code === "ELOOP") fail("migration_artifact_invalid", "Migration artifact target must not be a symlink");
    fail("migration_artifact_write_failed", "Migration artifact could not be reserved", { cause: error?.code ?? "unknown" });
  }
  const reserved = await handle.stat();
  let complete = false;
  let closed = false;
  const close = async () => {
    if (!closed) { closed = true; await handle.close(); }
  };
  return Object.freeze({
    path,
    async write(value) {
      if (complete) fail("migration_artifact_invalid", "Migration artifact reservation is already complete");
      try {
        canonicalize(value);
        const bytes = `${JSON.stringify(value, null, 2)}\n`;
        await handle.writeFile(bytes);
        await handle.sync();
        await close();
        const root = await secureArtifactRoot();
        const target = await lstat(path);
        if (root.dev !== initialRoot.dev || root.ino !== initialRoot.ino || target.isSymbolicLink() || !target.isFile() || target.dev !== reserved.dev || target.ino !== reserved.ino) {
          fail("migration_artifact_readback_mismatch", "Migration artifact path changed during write");
        }
        const readback = await readFile(path);
        const expectedHash = createHash("sha256").update(bytes).digest("hex");
        const actualHash = createHash("sha256").update(readback).digest("hex");
        if (actualHash !== expectedHash) fail("migration_artifact_readback_mismatch", "Migration artifact readback hash does not match");
        complete = true;
        return { path, sha256: actualHash, bytes: readback.length };
      } catch (error) {
        await this.abort();
        throw error;
      }
    },
    async abort() {
      if (complete) return;
      await close();
      try {
        const current = await lstat(path);
        if (current.dev === reserved.dev && current.ino === reserved.ino && current.isFile() && !current.isSymbolicLink()) await unlink(path);
      } catch (error) {
        if (error?.code !== "ENOENT") fail("migration_artifact_write_failed", "Migration artifact reservation could not be cleaned up");
      }
    },
  });
}

export async function writeMigrationArtifact(value, { fileName } = {}) {
  const reservation = await reserveMigrationArtifact(fileName);
  return reservation.write(value);
}
