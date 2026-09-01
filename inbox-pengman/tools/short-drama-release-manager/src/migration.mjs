import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { isDeepStrictEqual } from "node:util";

import { ShortDramaError } from "./errors.mjs";
import { BASE_FIELD_SPECS, TABLE_ORDER, TABLES, fieldOwner } from "./schema.mjs";
import { normalizeAccountId } from "./source-sqlite.mjs";

const VERSION = "shortdrama-migration/v1";
const TABLE_BINDINGS = Object.freeze({
  "账号台账": "accounts",
  "选剧池": "dramas",
  "采集数据": "captures",
  "发布记录": "releases",
});
const PRESENTATION = Object.freeze([
  ["账号台账", "在用账号", "在用账号"], ["账号台账", "需处理账号", "需处理账号"],
  ["选剧池", "未排期", "未排期"], ["选剧池", "已排期", "已排期"],
  ["选剧池", "按平台", "按平台"], ["选剧池", "按语言", "按语言"],
  ["发布记录", "已排期", "发布-已排期"], ["发布记录", "待公开", "待公开"],
  ["发布记录", "已公开待回填", "已公开待回填"], ["发布记录", "已回填", "已回填"],
  ["发布记录", "按账号表现", "按账号表现"], ["发布记录", "按剧表现", "按剧表现"],
  ["采集数据", "完整", "采集-完整"], ["采集数据", "部分缺失", "部分缺失"],
  ["采集数据", "未关联发布", "未关联发布"],
]);
const ARTIFACT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../output/short-drama-release-manager/migrations");
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
  for (const [field, value] of Object.entries(row)) {
    if (field === "source_row" || ignored.has(field)) continue;
    let owner;
    try { owner = fieldOwner(tableName, field); } catch (error) {
      if (error.code === "field_not_allowed") continue;
      throw error;
    }
    if (owner === "derived") continue;
    result[field] = optionalValue(value);
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
    result.push({
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
    });
  }
  return result;
}

function validateReleases(rows, accountIds, dramasByName, capturesByPost, blocks) {
  if (!Array.isArray(rows)) fail("migration_source_invalid", "Google release rows are missing");
  const result = [];
  const seenPosts = new Map();
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
    let sourcePost = null;
    try { sourcePost = postId(source["Post ID"], { nullable: true }); }
    catch { blocks.push(blocked("invalid_post_id", "发布记录", source.source_row, { release_id: releaseId })); }
    let urlIdentity = null;
    try { urlIdentity = tiktokIdentity(source.视频链接, "post"); }
    catch { blocks.push(blocked("source_url_invalid", "发布记录", source.source_row, { release_id: releaseId })); }
    if (urlIdentity && accountId && urlIdentity.accountId !== accountId) blocks.push(blocked("source_account_mismatch", "发布记录", source.source_row, { release_id: releaseId }));
    if (urlIdentity && sourcePost && urlIdentity.postId !== sourcePost) blocks.push(blocked("source_post_mismatch", "发布记录", source.source_row, { release_id: releaseId }));
    const resolvedPost = sourcePost ?? urlIdentity?.postId ?? null;
    if (resolvedPost) {
      const previous = seenPosts.get(resolvedPost);
      if (previous) blocks.push(blocked("duplicate_release_post_id", "发布记录", source.source_row, { post_id: resolvedPost, release_ids: [previous, releaseId] }));
      else seenPosts.set(resolvedPost, releaseId);
      const capture = capturesByPost.get(resolvedPost);
      if (capture && accountId && capture.账号 !== accountId) blocks.push(blocked("source_account_mismatch", "发布记录", source.source_row, { release_id: releaseId, post_id: resolvedPost }));
    }
    const projected = writableProjection("发布记录", source, { exclude: ["发布ID", "账号", "剧", "采集记录", "账号名", "主页链接", "剧名", "剧分类", "播放量", "点赞", "收藏", "转发", "评论"] });
    if (resolvedPost) projected["Post ID"] = resolvedPost;
    result.push({
      ...projected,
      发布ID: releaseId,
      账号: accountId,
      剧: dramaId,
      采集记录: resolvedPost && capturesByPost.has(resolvedPost) ? resolvedPost : null,
      归档状态: projected.归档状态 ?? "active",
    });
  });
  return result;
}

function expectedFieldConfig(tableName, spec, tableIds) {
  if (spec.kind === "system") return { type: spec.systemType };
  if (spec.kind === "text") return { type: "text" };
  if (spec.kind === "url") return { type: "text", style: { type: "url" } };
  if (spec.kind === "number") return { type: "number" };
  if (spec.kind === "single_select" || spec.kind === "multi_select") return { type: "select", multiple: spec.kind === "multi_select" };
  if (spec.kind === "date" || spec.kind === "datetime") return { type: "datetime", style: { format: spec.kind === "date" ? "yyyy-MM-dd" : "yyyy-MM-dd HH:mm" } };
  if (spec.kind === "link") return {
    type: "link", link_table: tableIds[spec.targetTable] ?? null,
    ...(spec.bidirectional ? { bidirectional: true, bidirectional_link_field_name: spec.reverseField } : {}),
  };
  if (spec.kind === "formula") return { type: "formula", expression: spec.expression };
  if (spec.kind === "lookup") return { type: "lookup", from: BASE_FIELD_SPECS[tableName].find((item) => item.name === spec.linkField)?.targetTable, select: spec.sourceField };
  fail("base_schema_drift", "Fixed schema contains an unsupported field kind", { table: tableName, field: spec.name });
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
  const actions = [];
  for (const tableName of TABLE_ORDER) {
    const table = byName.get(tableName);
    if (!table) {
      actions.push({ id: `table:${tableName}`, kind: "create_table", table: tableName });
      continue;
    }
    const fields = new Map();
    for (const field of table.fields) {
      if (!plainObject(field) || typeof field.name !== "string" || fields.has(field.name)) fail("base_schema_drift", "Base field metadata is malformed or duplicate", { table: tableName });
      fields.set(field.name, field);
    }
    for (const spec of BASE_FIELD_SPECS[tableName]) {
      const existing = fields.get(spec.name);
      if (!existing) {
        if (!spec.managedReverseOf) actions.push({ id: `field:${tableName}:${spec.name}`, kind: "create_field", table: tableName, field: spec.name });
        continue;
      }
      const expected = expectedFieldConfig(tableName, spec, tableIds);
      if (!configMatches(existing, expected)) blocks.push(blocked("base_schema_drift", tableName, null, { field: spec.name }));
    }
  }
  return { revision, actions };
}

function presentationActions() {
  const actions = PRESENTATION.map(([table, viewName, displayName]) => ({
    id: `view:${table}:${viewName}`, kind: "create_view", table, name: displayName, view_name: viewName,
  }));
  actions.push({ id: "dashboard:短剧发行管理仪表盘", kind: "create_dashboard", name: "短剧发行管理仪表盘" });
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
  const blocks = [];
  const accountResult = validateAccountRows(google.accounts, blocks);
  const dramaResult = validateDramaRows(google.dramas, blocks);
  const capturesInput = context.captures ?? (typeof context.readLatestPosts === "function" ? await context.readLatestPosts() : null);
  const captures = validateCaptures(clone(capturesInput, "migration_source_invalid"), accountResult.unique, blocks, sourceRevision);
  const capturesByPost = new Map(captures.map((row) => [row["Post ID"], row]));
  const releases = validateReleases(google.releases, accountResult.unique, dramaResult.unique, capturesByPost, blocks);
  const schema = schemaPlan(context.baseSchema, blocks);
  const orderedBlocks = blocks.sort((left, right) =>
    left.code.localeCompare(right.code) || left.table.localeCompare(right.table) || (left.source_row ?? 0) - (right.source_row ?? 0) || stableJson(left).localeCompare(stableJson(right)),
  );
  const manifest = {
    version: VERSION,
    source_revision: sourceRevision,
    schema_revision: schema.revision,
    generated_at: generatedAt(context.now),
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
  manifest.sha256 = manifestDigest(manifest);
  return clone(manifest);
}

function assertManifest(manifest) {
  const expectedKeys = [
    "accounts", "blocked", "captures", "counts", "dramas", "generated_at", "presentation_actions",
    "releases", "schema_actions", "schema_revision", "sequence_seeds", "sha256", "source_revision", "version",
  ];
  if (!plainObject(manifest) || manifest.version !== VERSION || typeof manifest.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(manifest.sha256) ||
      !Array.isArray(manifest.blocked) || !plainObject(manifest.counts) || !Array.isArray(manifest.accounts) ||
      !Array.isArray(manifest.dramas) || !Array.isArray(manifest.captures) || !Array.isArray(manifest.releases) ||
      !Array.isArray(manifest.schema_actions) || !Array.isArray(manifest.presentation_actions) || !plainObject(manifest.sequence_seeds)) {
    fail("migration_manifest_invalid", "Migration manifest shape is invalid");
  }
  if (!isDeepStrictEqual(Object.keys(manifest).sort(), expectedKeys)) fail("migration_manifest_invalid", "Migration manifest contains unsupported fields");
  if (manifestDigest(manifest) !== manifest.sha256) fail("migration_digest_mismatch", "Migration manifest self-digest does not match");
  if (typeof manifest.source_revision !== "string" || manifest.source_revision === "" ||
      typeof manifest.schema_revision !== "string" || manifest.schema_revision === "" ||
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
  const actionIds = new Set();
  for (const action of manifest.schema_actions) {
    if (!plainObject(action) || actionIds.has(action.id) || !TABLE_ORDER.includes(action.table)) {
      fail("migration_manifest_invalid", "Migration schema action is malformed or duplicate");
    }
    actionIds.add(action.id);
    if (action.kind === "create_table") {
      if (!isDeepStrictEqual(Object.keys(action).sort(), ["id", "kind", "table"]) || action.id !== `table:${action.table}`) {
        fail("migration_manifest_invalid", "Migration table action is not fixed");
      }
    } else if (action.kind === "create_field") {
      const spec = BASE_FIELD_SPECS[action.table]?.find((field) => field.name === action.field);
      if (!spec || spec.managedReverseOf || !isDeepStrictEqual(Object.keys(action).sort(), ["field", "id", "kind", "table"]) ||
          action.id !== `field:${action.table}:${action.field}`) {
        fail("migration_manifest_invalid", "Migration field action is not fixed");
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
  if (context.schemaRevision !== manifest.schema_revision) fail("schema_revision_drift", "Base schema revision changed after planning");
  if (manifest.blocked.length > 0) fail("migration_blocked", "Migration manifest contains blocked entries", { count: manifest.blocked.length });
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
  if (!objectLike(adapter) || typeof adapter.createTable !== "function" || typeof adapter.createField !== "function" || typeof adapter.verifySchemaAction !== "function") {
    fail("migration_context_invalid", "Fixed schema adapter is required");
  }
  for (const action of manifest.schema_actions) {
    if (!plainObject(action) || action.id !== `${action.kind === "create_table" ? "table" : "field"}:${action.table}${action.kind === "create_field" ? `:${action.field}` : ""}` || !TABLE_ORDER.includes(action.table)) {
      fail("migration_manifest_invalid", "Schema action is not fixed");
    }
    if (action.kind === "create_table") await adapter.createTable(action.table);
    else if (action.kind === "create_field" && BASE_FIELD_SPECS[action.table].some((spec) => spec.name === action.field && !spec.managedReverseOf)) await adapter.createField(action.table, action.field);
    else fail("migration_manifest_invalid", "Schema action is unsupported");
    const verified = await adapter.verifySchemaAction(clone(action));
    if (verified !== true) fail("readback_mismatch", "Schema action readback failed", { action: action.id });
  }
}

async function applyPresentation(context, manifest) {
  const adapter = context.presentationAdapter;
  if (!objectLike(adapter) || typeof adapter.createView !== "function" || typeof adapter.createDashboard !== "function" || typeof adapter.verifyPresentationAction !== "function") {
    fail("migration_context_invalid", "Fixed presentation adapter is required");
  }
  const fixed = new Map(presentationActions().map((action) => [action.id, action]));
  for (const action of manifest.presentation_actions) {
    if (!isDeepStrictEqual(canonicalize(action), canonicalize(fixed.get(action.id)))) fail("migration_manifest_invalid", "Presentation action is not fixed");
    if (action.kind === "create_view") await adapter.createView(action.table, action.view_name);
    else if (action.kind === "create_dashboard") await adapter.createDashboard(action.name);
    else fail("migration_manifest_invalid", "Presentation action is unsupported");
    const verified = await adapter.verifyPresentationAction(clone(action));
    if (verified !== true) fail("readback_mismatch", "Presentation action readback failed", { action: action.id });
  }
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
  if (phase === "schema") await applySchema(context, manifest);
  if (phase === "data") await applyData(context, manifest);
  if (phase === "presentation") await applyPresentation(context, manifest);
  if (phase === "sequences") {
    assertVerificationProof(context, manifest);
    if (typeof context.seedSequence !== "function") fail("migration_context_invalid", "Sequence seed function is required");
    await context.seedSequence("drama", manifest.sequence_seeds.drama);
    await context.seedSequence("release", manifest.sequence_seeds.release);
  }
  return { status: "applied", phase, manifest_sha256: manifest.sha256 };
}

function assertExactKeys(index, expectedRows, primary, tableName) {
  if (!(index instanceof Map)) fail("readback_mismatch", "Repository index is incomplete", { table: tableName });
  const expected = expectedRows.map((row) => row[primary]).sort();
  const actual = [...index.keys()].sort();
  if (!isDeepStrictEqual(actual, expected)) fail("readback_mismatch", "Base primary-key set does not match the manifest", { table: tableName, expected, actual });
}

function assertExpectedFields(index, entries, primary, tableName) {
  for (const entry of entries) {
    const record = index.get(entry.key);
    if (!plainObject(record) || !plainObject(record.fields) || record.fields[primary] !== entry.key) fail("readback_mismatch", "Base record is malformed", { table: tableName, key: entry.key });
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

export async function writeMigrationArtifact(value, { fileName } = {}) {
  if (typeof fileName !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._-]*\.json$/.test(fileName) || fileName.includes("..")) {
    fail("migration_artifact_invalid", "Migration artifact file name is invalid");
  }
  canonicalize(value);
  const path = resolve(ARTIFACT_ROOT, fileName);
  if (dirname(path) !== ARTIFACT_ROOT) fail("migration_artifact_invalid", "Migration artifact path escaped the fixed output root");
  const bytes = `${JSON.stringify(value, null, 2)}\n`;
  await mkdir(ARTIFACT_ROOT, { recursive: true });
  try {
    await writeFile(path, bytes, { flag: "wx", mode: 0o600 });
  } catch (error) {
    if (error?.code === "EEXIST") fail("migration_artifact_exists", "Migration artifact already exists", { file_name: fileName });
    fail("migration_artifact_write_failed", "Migration artifact could not be written", { cause: error?.code ?? "unknown" });
  }
  const readback = await readFile(path);
  const expectedHash = createHash("sha256").update(bytes).digest("hex");
  const actualHash = createHash("sha256").update(readback).digest("hex");
  if (actualHash !== expectedHash) fail("migration_artifact_readback_mismatch", "Migration artifact readback hash does not match");
  return { path, sha256: actualHash, bytes: readback.length };
}
