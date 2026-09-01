import { existsSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";

import { ShortDramaError } from "./errors.mjs";

const ACCOUNT_COLUMNS = Object.freeze([
  "snapshot_date", "captured_at", "username", "account_url", "nickname", "followers",
  "following", "total_likes", "total_posts", "bio", "collection_status",
]);
const POST_COLUMNS = Object.freeze([
  "post_id", "username", "post_url", "content_type", "published_at", "caption",
  "first_seen_at", "last_seen_at",
]);
const SNAPSHOT_COLUMNS = Object.freeze([
  "snapshot_date", "captured_at", "post_id", "username", "views", "likes", "comments",
  "favorites", "shares", "collection_status", "missing_fields",
]);
const METRIC_FIELDS = Object.freeze(["views", "likes", "comments", "favorites", "shares"]);
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const QUALIFIED_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?(?:Z|[+-]\d{2}:\d{2})$/;
const POST_ID = /^\d+$/;
const ACCOUNT_ID = /^[a-z0-9._]+$/;

function fail(code, message, details = {}) {
  throw new ShortDramaError(code, message, details);
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function normalizeAccountId(value) {
  if (typeof value !== "string") fail("source_account_invalid", "Account ID must be a string");
  let accountId = value.trim();
  if (accountId.startsWith("@")) accountId = accountId.slice(1);
  accountId = accountId.toLowerCase();
  if (!accountId || !ACCOUNT_ID.test(accountId)) {
    fail("source_account_invalid", "Account ID is invalid");
  }
  return accountId;
}

function normalizePostId(value, code = "source_post_invalid") {
  if (typeof value !== "string" || !POST_ID.test(value)) fail(code, "Post ID must be a numeric string");
  return value;
}

function normalizedIdentifier(value) {
  if (typeof value !== "string") fail("source_identifier_invalid", "Identifier must be a string");
  const normalized = value.trim();
  if (!normalized || /[\u0000-\u001f\u007f]/.test(normalized)) {
    fail("source_identifier_invalid", "Identifier is invalid");
  }
  return normalized;
}

function validDate(value) {
  if (typeof value !== "string" || !DATE.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function assertDate(value, field) {
  if (!validDate(value)) fail("source_timestamp_invalid", "Source date is invalid", { field });
}

function validTimestamp(value) {
  return typeof value === "string" && QUALIFIED_TIMESTAMP.test(value) && !Number.isNaN(Date.parse(value));
}

function assertTimestamp(value, field, { nullable = false } = {}) {
  if (nullable && value === null) return;
  if (!validTimestamp(value)) fail("source_timestamp_invalid", "Source timestamp is invalid", { field });
}

function assertUrl(value, field, { nullable = false } = {}) {
  if (nullable && value === null) return;
  if (typeof value !== "string" || value.trim() !== value || !value) {
    fail("source_url_invalid", "Source URL is invalid", { field });
  }
  try {
    const url = new URL(value);
    if ((url.protocol !== "https:" && url.protocol !== "http:") || !url.hostname) throw new Error("invalid URL");
    return url;
  } catch {
    fail("source_url_invalid", "Source URL is invalid", { field });
  }
}

function sourceUrlIdentity(value, field, kind) {
  const url = assertUrl(value, field);
  const hostname = url.hostname.toLowerCase();
  if (hostname !== "tiktok.com" && !hostname.endsWith(".tiktok.com")) {
    fail("source_url_invalid", "Source URL host is invalid", { field });
  }
  const pattern = kind === "account"
    ? /^\/@([^/]+)\/?$/
    : /^\/@([^/]+)\/(?:video|photo)\/(\d+)\/?$/;
  const match = url.pathname.match(pattern);
  if (!match) fail("source_url_invalid", "Source URL path is invalid", { field });
  let accountId;
  try {
    accountId = normalizeAccountId(match[1]);
  } catch {
    fail("source_url_invalid", "Source URL account is invalid", { field });
  }
  return { accountId, postId: match[2] ?? null };
}

function normalizeMetric(value, field, { nullable = true } = {}) {
  if (nullable && value === null) return null;
  if (typeof value === "bigint") {
    if (value < 0n || value > BigInt(Number.MAX_SAFE_INTEGER)) {
      fail("source_metric_invalid", "Source metric is invalid", { field });
    }
    return Number(value);
  }
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    fail("source_metric_invalid", "Source metric is invalid", { field });
  }
  return value;
}

function parseMissingFields(post) {
  let parsed;
  try {
    parsed = JSON.parse(post.missing_fields);
  } catch {
    fail("source_missing_fields_invalid", "Missing fields must be a JSON array");
  }
  if (!Array.isArray(parsed) || parsed.some((name) => typeof name !== "string" || !METRIC_FIELDS.includes(name)) ||
      new Set(parsed).size !== parsed.length) {
    fail("source_missing_fields_invalid", "Missing fields are invalid");
  }
  const actual = METRIC_FIELDS.filter((name) => post[name] === null);
  if (parsed.length !== actual.length || actual.some((name) => !parsed.includes(name))) {
    fail("source_missing_fields_invalid", "Missing fields do not match null metrics");
  }
  if (post.collection_status !== "complete" && post.collection_status !== "partial") {
    fail("source_collection_status_invalid", "Collection status is invalid");
  }
  if ((post.collection_status === "complete") !== (actual.length === 0)) {
    fail("source_collection_status_invalid", "Collection status does not match missing metrics");
  }
  return parsed;
}

function assertColumns(db, tableName, required) {
  let rows;
  try {
    rows = db.prepare(`PRAGMA table_info(${tableName})`).all();
  } catch {
    fail("source_schema_invalid", "Source schema cannot be inspected", { table: tableName });
  }
  const columns = new Set(rows.map((row) => row.name));
  if (rows.length === 0 || required.some((column) => !columns.has(column))) {
    fail("source_schema_invalid", "Source schema is missing required columns", { table: tableName });
  }
}

function withSourceDatabase(dbPath, callback) {
  if (typeof dbPath !== "string" || !dbPath || !existsSync(dbPath)) {
    fail("source_open_failed", "Source database does not exist");
  }
  let db;
  try {
    db = new DatabaseSync(dbPath, { readOnly: true });
    db.exec("PRAGMA query_only = ON");
  } catch {
    try { db?.close(); } catch {}
    fail("source_open_failed", "Source database cannot be opened read-only");
  }
  try {
    return callback(db);
  } catch (error) {
    if (error instanceof ShortDramaError) throw error;
    fail("source_query_failed", "Source database query failed");
  } finally {
    db.close();
  }
}

function validateAccountRow(row) {
  if (!isPlainObject(row)) fail("source_account_invalid", "Source account row is invalid");
  const username = normalizeAccountId(row.username);
  assertDate(row.snapshot_date, "snapshot_date");
  assertTimestamp(row.captured_at, "captured_at");
  const urlIdentity = sourceUrlIdentity(row.account_url, "account_url", "account");
  if (urlIdentity.accountId !== username) {
    fail("source_account_mismatch", "Account row and URL handle disagree", { username });
  }
  if (row.collection_status !== "complete") {
    fail("source_account_invalid", "Latest account row is not complete");
  }
  const projected = { ...row, username };
  for (const field of ["followers", "following", "total_likes", "total_posts"]) {
    projected[field] = normalizeMetric(row[field], field, { nullable: field !== "followers" });
  }
  return projected;
}

function validatePostRow(row) {
  if (!isPlainObject(row)) fail("source_post_invalid", "Source post row is invalid");
  const postId = normalizePostId(row.post_id);
  const username = normalizeAccountId(row.username);
  const snapshotUsername = normalizeAccountId(row.snapshot_username);
  if (username !== snapshotUsername) {
    fail("source_account_mismatch", "Post and snapshot accounts disagree", { post_id: postId });
  }
  const urlIdentity = sourceUrlIdentity(row.post_url, "post_url", "post");
  if (urlIdentity.accountId !== username || urlIdentity.postId !== postId) {
    fail("source_account_mismatch", "Post row and URL identity disagree", { post_id: postId });
  }
  assertTimestamp(row.published_at, "published_at", { nullable: true });
  assertTimestamp(row.first_seen_at, "first_seen_at");
  assertTimestamp(row.last_seen_at, "last_seen_at");
  assertDate(row.snapshot_date, "snapshot_date");
  assertTimestamp(row.captured_at, "captured_at");
  const normalizedMetrics = Object.fromEntries(
    METRIC_FIELDS.map((field) => [field, normalizeMetric(row[field], field)]),
  );
  parseMissingFields({ ...row, ...normalizedMetrics });
  const { snapshot_username: _snapshotUsername, ...projected } = row;
  return { ...projected, ...normalizedMetrics, post_id: postId, username };
}

export function readLatestAccounts(dbPath) {
  return withSourceDatabase(dbPath, (db) => {
    assertColumns(db, "account_snapshots", ACCOUNT_COLUMNS);
    const statement = db.prepare(`
      SELECT snapshot_date,captured_at,username,account_url,nickname,followers,following,
             total_likes,total_posts,bio,collection_status
      FROM account_snapshots a
      WHERE snapshot_date=(
        SELECT MAX(snapshot_date) FROM account_snapshots x
        WHERE x.username=a.username AND x.collection_status='complete' AND x.followers IS NOT NULL
      )
    `);
    statement.setReadBigInts(true);
    const rawRows = statement.all();
    const rows = rawRows.map(validateAccountRow);
    const seen = new Set();
    for (const row of rows) {
      if (seen.has(row.username)) {
        fail("source_account_collision", "Canonical account rows collide", { username: row.username });
      }
      seen.add(row.username);
    }
    return rows.sort((left, right) => left.username.localeCompare(right.username));
  });
}

export function readLatestPosts(dbPath) {
  return withSourceDatabase(dbPath, (db) => {
    assertColumns(db, "posts", POST_COLUMNS);
    assertColumns(db, "post_snapshots", SNAPSHOT_COLUMNS);
    const statement = db.prepare(`
      SELECT p.post_id,p.username,p.post_url,p.content_type,p.published_at,p.caption,
             p.first_seen_at,p.last_seen_at,s.snapshot_date,s.captured_at,
             s.views,s.likes,s.comments,s.favorites,s.shares,
             s.collection_status,s.missing_fields,s.username AS snapshot_username
      FROM posts p
      JOIN post_snapshots s ON s.post_id=p.post_id
      WHERE s.snapshot_date=(
        SELECT MAX(x.snapshot_date) FROM post_snapshots x WHERE x.post_id=p.post_id
      )
    `);
    statement.setReadBigInts(true);
    const rawRows = statement.all();
    const rows = rawRows.map(validatePostRow);
    const seen = new Set();
    for (const row of rows) {
      if (seen.has(row.post_id)) {
        fail("source_post_duplicate", "Latest source contains a duplicate Post ID", { post_id: row.post_id });
      }
      seen.add(row.post_id);
    }
    return rows.sort((left, right) =>
      left.username.localeCompare(right.username) ||
      (left.published_at ?? "").localeCompare(right.published_at ?? "") ||
      left.post_id.localeCompare(right.post_id),
    );
  });
}

export function toCaptureFields(post, runId, accountRecordId) {
  if (!isPlainObject(post)) fail("source_post_invalid", "Source post row is invalid");
  const postId = normalizePostId(post.post_id);
  normalizeAccountId(post.username);
  assertDate(post.snapshot_date, "snapshot_date");
  assertTimestamp(post.captured_at, "captured_at");
  const urlIdentity = sourceUrlIdentity(post.post_url, "post_url", "post");
  if (urlIdentity.accountId !== normalizeAccountId(post.username) || urlIdentity.postId !== postId) {
    fail("source_account_mismatch", "Post row and URL identity disagree", { post_id: postId });
  }
  assertTimestamp(post.published_at, "published_at", { nullable: true });
  const normalizedMetrics = Object.fromEntries(
    METRIC_FIELDS.map((field) => [field, normalizeMetric(post[field], field)]),
  );
  const missingFields = parseMissingFields({ ...post, ...normalizedMetrics });
  const normalizedRunId = normalizedIdentifier(runId);
  const normalizedAccountRecordId = normalizedIdentifier(accountRecordId);
  return {
    "Post ID": postId,
    "快照日期": post.snapshot_date,
    "采集时间": post.captured_at,
    "账号": [{ id: normalizedAccountRecordId }],
    "视频链接": post.post_url,
    "发布时间": post.published_at,
    "播放量": normalizedMetrics.views,
    "点赞": normalizedMetrics.likes,
    "评论": normalizedMetrics.comments,
    "收藏": normalizedMetrics.favorites,
    "转发": normalizedMetrics.shares,
    "业务": "short-drama",
    "采集状态": post.collection_status,
    "缺失字段": [...missingFields],
    "来源 run_id": normalizedRunId,
  };
}
