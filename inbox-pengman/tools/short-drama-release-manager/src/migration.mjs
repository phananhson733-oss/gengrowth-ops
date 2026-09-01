import { createHash } from "node:crypto";
import { constants as fsConstants } from "node:fs";
import { lstat, mkdir, open, readFile, realpath, unlink } from "node:fs/promises";
import { dirname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { isDeepStrictEqual } from "node:util";

import { ShortDramaError } from "./errors.mjs";
import { fixedDashboardDescriptor, fixedFieldDescriptor, fixedViewDescriptor } from "./feishu-client.mjs";
import { matchReleaseToCapture } from "./matcher.mjs";
import { BASE_FIELD_SPECS, SCHEMA_APPLY_ORDER, TABLE_ORDER, TABLES, fieldOwner } from "./schema.mjs";
import { normalizeAccountId } from "./source-sqlite.mjs";

const VERSION = "shortdrama-migration/v1";
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
  return { rows: manifestRows, unique: new Set([...byId].filter(([, sourceRows]) => sourceRows.length === 1).map(([id]) => id)) };
}

function validateDramaRows(rows, blocks) {
  if (!Array.isArray(rows)) fail("migration_source_invalid", "Google drama rows are missing");
  const manifestRows = [];
  const byName = new Map();
  rows.forEach((source, at) => {
    if (!plainObject(source)) fail("migration_source_invalid", "Google drama row is malformed");
    let name;
    try { name = text(source.剧名, "剧名"); }
    catch { blocks.push(blocked("invalid_drama_key", "选剧池", source.source_row)); return; }
    const id = businessId("SD", at + 1);
    const projected = writableProjection("选剧池", source, { exclude: ["剧ID", "是否已排期"] });
    manifestRows.push({ ...projected, 剧ID: id, 剧名: name, 归档状态: projected.归档状态 ?? "active" });
    const list = byName.get(name) ?? [];
    list.push({ id, sourceRow: source.source_row ?? null });
    byName.set(name, list);
  });
  for (const [name, matches] of byName) {
    if (matches.length > 1) blocks.push(blocked("ambiguous_drama_key", "选剧池", matches[0].sourceRow, { drama_name: name, source_rows: matches.map((item) => item.sourceRow) }));
  }
  return {
    rows: manifestRows,
    unique: new Map([...byName].filter(([, matches]) => matches.length === 1).map(([name, matches]) => [name, matches[0].id])),
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
      "来源 run_id": optionalValue(source.run_id) ?? `migration:${sourceRevision}`,
      "Base 同步时间": optionalValue(source.base_sync_time),
    }));
  }
  return result;
}

function beijingDate(iso) {
  return new Date(Date.parse(iso) + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function validateReleases(rows, accountIds, dramasByName, captureSources, capturesByPost, blocks, generatedAtValue) {
  if (!Array.isArray(rows)) fail("migration_source_invalid", "Google release rows are missing");
  const result = [];
  const claimedPostIds = new Set();
  rows.forEach((source, at) => {
    if (!plainObject(source)) fail("migration_source_invalid", "Google release row is malformed");
    const releaseId = businessId("SR", at + 1);
    let accountId = null;
    try { accountId = normalizeAccountId(source.账号ID ?? source.账号名); }
    catch { blocks.push(blocked("missing_account_target", "发布记录", source.source_row, { release_id: releaseId })); }
    if (accountId && !accountIds.has(accountId)) blocks.push(blocked("missing_account_target", "发布记录", source.source_row, { release_id: releaseId, account_id: accountId }));
    const dramaName = typeof source.剧名 === "string" ? source.剧名.trim() : "";
    const dramaId = dramasByName.get(dramaName) ?? null;
    if (!dramaId) blocks.push(blocked("missing_drama_target", "发布记录", source.source_row, { release_id: releaseId, drama_name: dramaName }));
    const match = matchReleaseToCapture({ ...source, 账号ID: accountId }, captureSources, claimedPostIds);
    const hasManual = source["Post ID"] !== null && source["Post ID"] !== undefined && source["Post ID"] !== "" ||
      source.视频链接 !== null && source.视频链接 !== undefined && source.视频链接 !== "";
    const futureUnlinked = !hasManual && match.status === "unmatched" && match.reason === "no_account_time_candidate" &&
      typeof source.日期 === "string" && /^\d{4}-\d{2}-\d{2}$/.test(source.日期) && source.日期 > beijingDate(generatedAtValue);
    let resolvedPost = null;
    if (match.status === "matched") {
      resolvedPost = match.post.post_id;
      claimedPostIds.add(resolvedPost);
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
  for (const table of tables) {
    if (!plainObject(table) || typeof table.name !== "string" || typeof table.table_id !== "string" || !Array.isArray(table.fields) || byName.has(table.name) || ids.has(table.table_id)) {
      fail("base_schema_drift", "Base table metadata is malformed or duplicate");
    }
    byName.set(table.name, table);
    ids.add(table.table_id);
  }
  const tableIds = Object.fromEntries([...byName].map(([name, table]) => [name, table.table_id]));
  const tableActions = [];
  const fieldActions = [];
  for (const tableName of TABLE_ORDER) {
    const table = byName.get(tableName);
    if (!table) {
      tableActions.push({ id: `table:${tableName}`, kind: "create_table", table: tableName, phase: "storage", spec: fixedSchemaDescriptor(tableName, BASE_FIELD_SPECS[tableName][0]) });
    }
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
  const actions = [...tableActions, ...fieldActions.sort((left, right) =>
    SCHEMA_APPLY_ORDER.indexOf(left.phase) - SCHEMA_APPLY_ORDER.indexOf(right.phase) ||
    TABLE_ORDER.indexOf(left.table) - TABLE_ORDER.indexOf(right.table) ||
    BASE_FIELD_SPECS[left.table].findIndex((spec) => spec.name === left.field) - BASE_FIELD_SPECS[right.table].findIndex((spec) => spec.name === right.field),
  )];
  return { revision, actions };
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
  const google = clone(context.google, "migration_source_invalid");
  const sourceRevision = text(google.revision, "source_revision");
  if (!plainObject(google.raw_backup)) fail("migration_source_invalid", "Token-free Google recovery backup is required");
  const generatedAtValue = generatedAt(context.now);
  const blocks = [];
  const accountResult = validateAccountRows(google.accounts, blocks);
  const dramaResult = validateDramaRows(google.dramas, blocks);
  const capturesInput = context.captures ?? (typeof context.readLatestPosts === "function" ? await context.readLatestPosts() : null);
  const captureSources = clone(capturesInput, "migration_source_invalid");
  const captures = validateCaptures(captureSources, accountResult.unique, blocks, sourceRevision);
  const capturesByPost = new Map(captures.map((row) => [row["Post ID"], row]));
  const releases = validateReleases(google.releases, accountResult.unique, dramaResult.unique, captureSources, capturesByPost, blocks, generatedAtValue);
  const schema = schemaPlan(context.baseSchema, blocks);
  const orderedBlocks = blocks.sort((left, right) =>
    left.code.localeCompare(right.code) || left.table.localeCompare(right.table) || (left.source_row ?? 0) - (right.source_row ?? 0) || stableJson(left).localeCompare(stableJson(right)),
  );
  const manifest = {
    version: VERSION,
    source_revision: sourceRevision,
    source_backup: clone(google.raw_backup, "migration_source_invalid"),
    initial_schema_revision: schema.revision,
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
    },
    accounts: accountResult.rows,
    dramas: dramaResult.rows,
    captures,
    releases,
    blocked: orderedBlocks,
  };
  manifest.schema_spec_sha256 = sha256({ actions: manifest.schema_actions, contract: fixedSchemaContract() });
  manifest.presentation_spec_sha256 = sha256(manifest.presentation_actions);
  manifest.sha256 = manifestDigest(manifest);
  return clone(manifest);
}

function assertManifest(manifest) {
  const expectedKeys = [
    "accounts", "blocked", "captures", "counts", "dramas", "generated_at", "initial_schema_revision", "presentation_actions", "presentation_spec_sha256",
    "releases", "schema_actions", "schema_spec_sha256", "sequence_seeds", "sha256", "source_backup", "source_revision", "version",
  ];
  if (!plainObject(manifest) || manifest.version !== VERSION || typeof manifest.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(manifest.sha256) ||
      !Array.isArray(manifest.blocked) || !plainObject(manifest.counts) || !Array.isArray(manifest.accounts) ||
      !Array.isArray(manifest.dramas) || !Array.isArray(manifest.captures) || !Array.isArray(manifest.releases) ||
      !Array.isArray(manifest.schema_actions) || !Array.isArray(manifest.presentation_actions) || !plainObject(manifest.sequence_seeds) || !plainObject(manifest.source_backup)) {
    fail("migration_manifest_invalid", "Migration manifest shape is invalid");
  }
  if (!isDeepStrictEqual(Object.keys(manifest).sort(), expectedKeys)) fail("migration_manifest_invalid", "Migration manifest contains unsupported fields");
  if (manifestDigest(manifest) !== manifest.sha256) fail("migration_digest_mismatch", "Migration manifest self-digest does not match");
  if (typeof manifest.source_revision !== "string" || manifest.source_revision === "" ||
      typeof manifest.initial_schema_revision !== "string" || manifest.initial_schema_revision === "" ||
      typeof manifest.generated_at !== "string" || !Number.isFinite(Date.parse(manifest.generated_at))) {
    fail("migration_manifest_invalid", "Migration manifest metadata is invalid");
  }
  const actualCounts = {
    accounts: manifest.accounts.length,
    dramas: manifest.dramas.length,
    captures: manifest.captures.length,
    releases: manifest.releases.length,
    blocked: manifest.blocked.length,
  };
  if (!isDeepStrictEqual(canonicalize(manifest.counts), canonicalize(actualCounts))) {
    fail("migration_manifest_invalid", "Migration manifest counts are inconsistent");
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
    if (action.kind === "create_table") {
      const runtime = fixedSchemaDescriptor(action.table, BASE_FIELD_SPECS[action.table][0]);
      if (!isDeepStrictEqual(Object.keys(action).sort(), ["id", "kind", "phase", "spec", "table"]) || action.id !== `table:${action.table}` || action.phase !== "storage" || !isDeepStrictEqual(action.spec, runtime)) {
        fail("migration_manifest_invalid", "Migration table action is not fixed");
      }
    } else if (action.kind === "create_field") {
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
  if (typeof context.expectedSha256 !== "string" || context.expectedSha256 === "") fail("migration_digest_required", "Expected migration digest is required");
  if (context.expectedSha256 !== manifest.sha256) fail("migration_digest_mismatch", "Expected migration digest does not match");
  if (context.sourceRevision !== manifest.source_revision) fail("source_revision_drift", "Google source revision changed after planning");
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
      receipt.action_spec_sha256 !== manifest.schema_spec_sha256 || typeof receipt.post_revision !== "string" || receipt.post_revision === "" ||
      typeof receipt.sha256 !== "string" || receipt.sha256 !== context.expectedSchemaReceiptSha256 || schemaReceiptDigest(receipt) !== receipt.sha256 ||
      !isDeepStrictEqual(Object.keys(receipt).sort(), ["action_spec_sha256", "manifest_sha256", "post_revision", "pre_revision", "sha256", "status", "version"])) {
    fail("migration_schema_receipt_required", "An authentic schema receipt for this manifest is required");
  }
  return receipt;
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
  if (!objectLike(adapter) || typeof adapter.createTable !== "function" || typeof adapter.createField !== "function" ||
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
    if (action.kind === "create_table") {
      if (!before.tables.has(action.table)) await adapter.createTable(action.table);
    } else if (action.kind === "create_field") {
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
    if (!tableAfter || action.kind !== "create_table" && !(tableAfter.fields ?? []).some((field) => field.name === action.field)) {
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
      const configuration = await adapter.readViewConfiguration(table.table_id, viewId, action.table, action.name);
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
      typeof report.sha256 !== "string" || report.sha256 !== context.expectedVerificationSha256 ||
      verificationDigest(report) !== report.sha256 ||
      !isDeepStrictEqual(canonicalize(report.counts), canonicalize(expectedCounts)) ||
      report.details?.exact_primary_key_sets !== true || report.details?.exact_writable_fields !== true ||
      report.details?.exact_relation_ids !== true ||
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
      pre_revision: manifest.initial_schema_revision,
      post_revision: postRevision,
      action_spec_sha256: manifest.schema_spec_sha256,
    };
    receipt.sha256 = schemaReceiptDigest(receipt);
    return { status: "applied", phase, manifest_sha256: manifest.sha256, schema_receipt: receipt, reused: false };
  }
  const receipt = assertSchemaReceipt(context, manifest);
  if (await currentSchemaRevision(context) !== receipt.post_revision) fail("schema_revision_drift", "Base schema revision changed after schema verification");
  if (phase === "data") await applyData(context, manifest);
  if (phase === "presentation") {
    const readbacks = await applyPresentation(context, manifest);
    const presentationReceipt = {
      version: "shortdrama-presentation-receipt/v1",
      status: "verified",
      manifest_sha256: manifest.sha256,
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

async function inspectArtifactDirectory(path, { create = false } = {}) {
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
}

async function secureArtifactRoot() {
  await inspectArtifactDirectory(ARTIFACT_TRUST_ROOT);
  let cursor = ARTIFACT_TRUST_ROOT;
  for (const component of ["short-drama-release-manager", "migrations"]) {
    cursor = resolve(cursor, component);
    await inspectArtifactDirectory(cursor, { create: true });
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
      canonicalize(value);
      const bytes = `${JSON.stringify(value, null, 2)}\n`;
      try {
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
  if (typeof fileName !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._-]*\.json$/.test(fileName) || fileName.includes("..")) {
    fail("migration_artifact_invalid", "Migration artifact file name is invalid");
  }
  canonicalize(value);
  const inspectDirectory = async (path, { create = false } = {}) => {
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
  };
  const secureRoot = async () => {
    await inspectDirectory(ARTIFACT_TRUST_ROOT);
    let cursor = ARTIFACT_TRUST_ROOT;
    for (const component of ["short-drama-release-manager", "migrations"]) {
      cursor = resolve(cursor, component);
      await inspectDirectory(cursor, { create: true });
    }
    const trustedReal = await realpath(ARTIFACT_TRUST_ROOT);
    const rootReal = await realpath(ARTIFACT_ROOT);
    const remainder = relative(trustedReal, rootReal);
    if (remainder === "" || remainder === ".." || remainder.startsWith(`..${sep}`) || resolve(rootReal) !== ARTIFACT_ROOT) {
      fail("migration_artifact_invalid", "Migration artifact directory escaped the trusted output root");
    }
    const info = await lstat(rootReal);
    return { path: rootReal, dev: info.dev, ino: info.ino };
  };
  const initialRoot = await secureRoot();
  const root = initialRoot.path;
  const path = resolve(root, fileName);
  if (dirname(path) !== root) fail("migration_artifact_invalid", "Migration artifact path escaped the fixed output root");
  const bytes = `${JSON.stringify(value, null, 2)}\n`;
  try {
    const info = await lstat(path);
    if (info.isSymbolicLink()) fail("migration_artifact_invalid", "Migration artifact target must not be a symlink");
    fail("migration_artifact_exists", "Migration artifact already exists", { file_name: fileName });
  } catch (error) {
    if (error instanceof ShortDramaError) throw error;
    if (error?.code !== "ENOENT") fail("migration_artifact_invalid", "Migration artifact target could not be inspected");
  }
  const beforeOpen = await secureRoot();
  if (beforeOpen.path !== root || beforeOpen.dev !== initialRoot.dev || beforeOpen.ino !== initialRoot.ino) {
    fail("migration_artifact_invalid", "Migration artifact parent changed before write");
  }
  let handle;
  try {
    const flags = fsConstants.O_WRONLY | fsConstants.O_CREAT | fsConstants.O_EXCL | fsConstants.O_NOFOLLOW;
    handle = await open(path, flags, 0o600);
    await handle.writeFile(bytes);
    await handle.sync();
  } catch (error) {
    if (error?.code === "EEXIST") fail("migration_artifact_exists", "Migration artifact already exists", { file_name: fileName });
    if (error?.code === "ELOOP") fail("migration_artifact_invalid", "Migration artifact target must not be a symlink");
    fail("migration_artifact_write_failed", "Migration artifact could not be written", { cause: error?.code ?? "unknown" });
  } finally {
    await handle?.close();
  }
  const afterWrite = await secureRoot();
  if (afterWrite.path !== root || afterWrite.dev !== initialRoot.dev || afterWrite.ino !== initialRoot.ino) {
    fail("migration_artifact_readback_mismatch", "Migration artifact parent changed during write");
  }
  const targetInfo = await lstat(path);
  if (targetInfo.isSymbolicLink() || !targetInfo.isFile()) fail("migration_artifact_readback_mismatch", "Migration artifact target changed during write");
  const readback = await readFile(path);
  const expectedHash = createHash("sha256").update(bytes).digest("hex");
  const actualHash = createHash("sha256").update(readback).digest("hex");
  if (actualHash !== expectedHash) fail("migration_artifact_readback_mismatch", "Migration artifact readback hash does not match");
  return { path, sha256: actualHash, bytes: readback.length };
}
