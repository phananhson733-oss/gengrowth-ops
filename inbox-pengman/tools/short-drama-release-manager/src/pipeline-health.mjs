// Health signals that the daily job state alone cannot show: a queue drain that
// keeps failing, a capture that finished "partial", and Base ledger edits that
// silently break links. Each is alerted once per Beijing day at most.

export const DRAIN_FAILURE_ALERT_THRESHOLD = 6; // ~30 minutes of 300s ticks
export const ALERT_TEXT_LIMIT = 1_900; // the Feishu text sender rejects > 2,000
const MESSAGE_LIMIT = 300;
const BASELINE_KEY = "__baseline__";

export function ensurePipelineHealthTables(db) {
  db.exec(`CREATE TABLE IF NOT EXISTS drain_health (
    key TEXT PRIMARY KEY,
    consecutive_failures INTEGER NOT NULL,
    first_failed_at TEXT,
    last_failed_at TEXT,
    last_error_code TEXT,
    last_error_message TEXT,
    last_success_at TEXT,
    updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS integrity_issues (
    issue_key TEXT PRIMARY KEY,
    kind TEXT NOT NULL,
    detail_json TEXT NOT NULL,
    first_seen_at TEXT NOT NULL,
    last_seen_at TEXT NOT NULL,
    reported_at TEXT
  );`);
}

export const CAPTURE_REPORT_GRACE_HOURS = 12;

// Runs that finished before this instant are history and are never reported.
// The instant is fixed the first time reports are due: the last half day
// before that moment still counts, so the run that was in progress while
// reporting was switched on is reported, and older runs are not replayed.
export function captureReportCutoff(db, { now = new Date() } = {}) {
  // Kept apart from the tables above: those are also read by commands that
  // open the state database read-only, where creating a table would fail.
  db.exec(`CREATE TABLE IF NOT EXISTS capture_report_baseline (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    cutoff TEXT NOT NULL
  );`);
  const proposed = new Date((now instanceof Date ? now : new Date(now)).getTime() - CAPTURE_REPORT_GRACE_HOURS * 3_600_000).toISOString();
  db.prepare("INSERT INTO capture_report_baseline(id, cutoff) VALUES (1, ?) ON CONFLICT(id) DO NOTHING").run(proposed);
  return db.prepare("SELECT cutoff FROM capture_report_baseline WHERE id = 1").get().cutoff;
}

// A message keeps the text of its first attempt. Every attempt carries the
// same request id, which must never stand for two different texts; and what a
// message is built from changes: the capture summary is one file per day, the
// drain history and the ledger issues move on. The payload is what the caller
// needs to know about the text that went out, e.g. the issues it listed.
// Created on demand, like the baseline.
export function alertText(db, alertKey, text, { payload = null, now = new Date() } = {}) {
  db.exec(`CREATE TABLE IF NOT EXISTS alert_texts (
    alert_key TEXT PRIMARY KEY,
    text TEXT NOT NULL,
    payload_json TEXT NOT NULL,
    created_at TEXT NOT NULL
  );`);
  db.prepare("INSERT INTO alert_texts(alert_key, text, payload_json, created_at) VALUES (?, ?, ?, ?) ON CONFLICT(alert_key) DO NOTHING")
    .run(alertKey, text, JSON.stringify(payload), (now instanceof Date ? now : new Date(now)).toISOString());
  const kept = db.prepare("SELECT text, payload_json FROM alert_texts WHERE alert_key = ?").get(alertKey);
  return { text: kept.text, payload: JSON.parse(kept.payload_json) };
}

// An alert that was handed to the ops chat stays there until its delivery is
// known. Going back to the group after a lost reply could post it in both.
// Created on demand, like the baseline above.
function ensureAlertRoutes(db) {
  db.exec(`CREATE TABLE IF NOT EXISTS alert_routes (
    alert_key TEXT PRIMARY KEY,
    route TEXT NOT NULL CHECK (route = 'ops'),
    created_at TEXT NOT NULL
  );`);
}

export function isAlertRerouted(db, alertKey) {
  ensureAlertRoutes(db);
  return db.prepare("SELECT 1 AS found FROM alert_routes WHERE alert_key = ?").get(alertKey)?.found === 1;
}

export function setAlertRerouted(db, alertKey, rerouted, { now = new Date() } = {}) {
  ensureAlertRoutes(db);
  if (!rerouted) { db.prepare("DELETE FROM alert_routes WHERE alert_key = ?").run(alertKey); return; }
  db.prepare("INSERT INTO alert_routes(alert_key, route, created_at) VALUES (?, 'ops', ?) ON CONFLICT(alert_key) DO NOTHING")
    .run(alertKey, (now instanceof Date ? now : new Date(now)).toISOString());
}

const iso = (now) => (now instanceof Date ? now : new Date(now)).toISOString();

export function recordDrainOutcome(db, { ok, error = null, now = new Date() }) {
  ensurePipelineHealthTables(db);
  const at = iso(now);
  if (ok) {
    db.prepare(`INSERT INTO drain_health(key, consecutive_failures, last_success_at, updated_at) VALUES ('drain', 0, ?, ?)
      ON CONFLICT(key) DO UPDATE SET consecutive_failures = 0, first_failed_at = NULL, last_success_at = excluded.last_success_at, updated_at = excluded.updated_at`).run(at, at);
    return;
  }
  const code = typeof error?.code === "string" ? error.code.slice(0, 64) : "drain_failed";
  const message = String(error?.message ?? "").slice(0, MESSAGE_LIMIT);
  db.prepare(`INSERT INTO drain_health(key, consecutive_failures, first_failed_at, last_failed_at, last_error_code, last_error_message, updated_at)
      VALUES ('drain', 1, ?, ?, ?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET consecutive_failures = drain_health.consecutive_failures + 1,
        first_failed_at = COALESCE(drain_health.first_failed_at, excluded.first_failed_at),
        last_failed_at = excluded.last_failed_at, last_error_code = excluded.last_error_code,
        last_error_message = excluded.last_error_message, updated_at = excluded.updated_at`).run(at, at, code, message, at);
}

export function readDrainHealth(db) {
  ensurePipelineHealthTables(db);
  return db.prepare("SELECT * FROM drain_health WHERE key = 'drain'").get() ?? null;
}

// Stores the current set of integrity issues. The very first call records
// what already exists as a baseline without alerting (those were reviewed
// when this check shipped); afterwards only newly appearing keys are pending.
// Issues that disappear are forgotten, so a recurrence alerts again.
export function recordIntegrityIssues(db, issues, { now = new Date() } = {}) {
  ensurePipelineHealthTables(db);
  const at = iso(now);
  const baseline = !db.prepare("SELECT 1 FROM integrity_issues WHERE issue_key = ?").get(BASELINE_KEY);
  const keys = new Set(issues.map((issue) => issue.key));
  db.exec("BEGIN IMMEDIATE");
  try {
    const upsert = db.prepare(`INSERT INTO integrity_issues(issue_key, kind, detail_json, first_seen_at, last_seen_at, reported_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(issue_key) DO UPDATE SET detail_json = excluded.detail_json, last_seen_at = excluded.last_seen_at`);
    for (const issue of issues) upsert.run(issue.key, issue.kind, JSON.stringify(issue.detail ?? {}), at, at, baseline ? at : null);
    if (baseline) upsert.run(BASELINE_KEY, "meta", JSON.stringify({ baseline_count: issues.length }), at, at, at);
    const stale = db.prepare("SELECT issue_key FROM integrity_issues WHERE issue_key <> ?").all(BASELINE_KEY).map((row) => row.issue_key).filter((key) => !keys.has(key));
    const remove = db.prepare("DELETE FROM integrity_issues WHERE issue_key = ?");
    for (const key of stale) remove.run(key);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
  return { baseline, pending: baseline ? 0 : pendingIntegrityIssues(db).length };
}

export function pendingIntegrityIssues(db) {
  ensurePipelineHealthTables(db);
  return db.prepare("SELECT issue_key, kind, detail_json FROM integrity_issues WHERE reported_at IS NULL AND issue_key <> ? ORDER BY first_seen_at, issue_key")
    .all(BASELINE_KEY).map((row) => ({ key: row.issue_key, kind: row.kind, detail: JSON.parse(row.detail_json) }));
}

export function markIntegrityReported(db, keys, { now = new Date() } = {}) {
  const mark = db.prepare("UPDATE integrity_issues SET reported_at = ? WHERE issue_key = ? AND reported_at IS NULL");
  // All or nothing: a half-marked set would silently drop the unmarked rest
  // from the alert that is resent.
  db.exec("BEGIN IMMEDIATE");
  try {
    for (const key of keys) mark.run(iso(now), key);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

const idOf = (value) => (Array.isArray(value) ? value : []).map((item) => (typeof item === "string" ? item : item?.id)).filter((id) => typeof id === "string");
const urlAccount = (url) => String(url ?? "").match(/tiktok\.com\/@([^/?#\])]+)\//i)?.[1]?.toLowerCase() ?? null;

// Detects ledger edits that break the capture/release model:
//  - an account row that is deleted while captures or releases still link to it;
//  - an account row whose 账号ID was changed, so another TikTok account's posts
//    now hang under it (the linked capture URLs name a different handle).
// Release rows the analytics had to skip are included as well.
export function ledgerIntegrityIssues({ accounts = [], captures = [], releases = [] }, analyticsIssues = []) {
  const ledger = new Map(accounts.map((row) => [row.record_id, row.fields ?? {}]));
  const dangling = new Map();
  const mismatch = new Map();
  const note = (map, key, init, field) => {
    const entry = map.get(key) ?? init();
    entry[field] += 1;
    map.set(key, entry);
  };
  for (const row of captures) {
    const fields = row.fields ?? {};
    for (const id of idOf(fields.账号)) {
      if (!ledger.has(id)) { note(dangling, id, () => ({ account_record_id: id, captures: 0, releases: 0 }), "captures"); continue; }
      const handle = urlAccount(fields.视频链接);
      const accountId = String(ledger.get(id).账号ID ?? "").toLowerCase();
      if (handle && accountId && handle !== accountId) {
        note(mismatch, `${id}:${handle}`, () => ({ account_record_id: id, ledger_account_id: accountId, capture_handle: handle, captures: 0 }), "captures");
      }
    }
  }
  for (const row of releases) {
    for (const id of idOf(row.fields?.账号)) {
      if (!ledger.has(id)) note(dangling, id, () => ({ account_record_id: id, captures: 0, releases: 0 }), "releases");
    }
  }
  const issues = [];
  for (const [id, detail] of dangling) issues.push({ key: `account_deleted:${id}`, kind: "account_deleted", detail });
  for (const [key, detail] of mismatch) issues.push({ key: `account_id_mismatch:${key}`, kind: "account_id_mismatch", detail });
  for (const issue of analyticsIssues) {
    if (!issue || ["missing_drama", "missing_release_date"].includes(issue.reason)) continue;
    if (issue.release_id) issues.push({ key: `release:${issue.reason}:${issue.release_id}`, kind: "release_skipped", detail: issue });
    // Table-level problems (blank or duplicated business key) carry no release_id.
    else if (issue.table) issues.push({ key: `row:${issue.reason}:${issue.table}:${issue.record_id ?? "unknown"}`, kind: "row_skipped", detail: issue });
  }
  return issues;
}

// Builds an alert that always fits the sender's limit: whole lines are kept
// while they fit, and the rest is summarised as a count. `used` is how many
// lines made it into the text.
export function boundedAlertText(header, lines, limit = ALERT_TEXT_LIMIT) {
  return boundedAlert(header, lines, limit).text;
}

export function boundedAlert(header, lines, limit = ALERT_TEXT_LIMIT) {
  let text = header;
  let used = 0;
  for (const line of lines) {
    const remaining = lines.length - used - 1;
    const suffix = remaining > 0 ? `\n…另有 ${remaining} 项` : "";
    if ((text + "\n" + line).length + suffix.length > limit) break;
    text += "\n" + line;
    used += 1;
  }
  if (used < lines.length) text += `\n…另有 ${lines.length - used} 项`;
  return { text: text.length > limit ? text.slice(0, limit) : text, used };
}

export function describeIntegrityIssue(issue) {
  const d = issue.detail ?? {};
  if (issue.kind === "account_deleted") return `账号台账行已删除但仍被引用：${d.account_record_id}（采集 ${d.captures} 条，发布 ${d.releases} 条）`;
  if (issue.kind === "account_id_mismatch") return `账号台账行 ${d.account_record_id} 的账号ID=${d.ledger_account_id}，但挂着 @${d.capture_handle} 的 ${d.captures} 条采集（疑似改过账号ID）`;
  if (issue.kind === "release_skipped" && d.reason === "release_account_missing" && d.account_record_id) {
    return `发布记录 ${d.release_id} 的账号台账行缺失或账号ID重复（${d.account_record_id}）：未计入账号累计，仍计入分剧与按日统计`;
  }
  if (issue.kind === "release_skipped" && ["capture_metrics_invalid", "capture_date_invalid"].includes(d.reason)) {
    return `发布记录 ${d.release_id} 的采集数据有无效值（${d.reason}，帖子 ${d.post_id}）：无效项按缺失处理，对应累计留空`;
  }
  if (issue.kind === "release_skipped") return `发布记录 ${d.release_id} 未进入统计：${d.reason}`;
  if (issue.kind === "row_skipped") return `${d.table} 行 ${d.record_id} 未进入统计：${d.reason}${d.key ? `（${d.key}）` : ""}`;
  return issue.key;
}

// Summarises a finished capture from its collector summary. Returns null when
// the capture had no account-level or post-level problems worth an alert.
// `label` turns an error code into the words shown; by default codes are kept.
export function captureIncompleteLines(summary, { label = null } = {}) {
  const named = typeof label === "function" ? label : (code) => code;
  const [colon, comma] = typeof label === "function" ? ["：", "；"] : [": ", ","];
  const errors = Array.isArray(summary?.errors) ? summary.errors : [];
  // Missing metrics (e.g. an unparseable count) mark posts partial without an error entry.
  const partialPosts = Number(summary?.local_history?.partial_count ?? 0);
  const requested = Array.isArray(summary?.accounts_requested) ? summary.accounts_requested : [];
  const successful = new Set(Array.isArray(summary?.accounts_successful) ? summary.accounts_successful : []);
  // An account can go without a snapshot although the collector logged nothing for it.
  const missingAccounts = Array.isArray(summary?.accounts_successful) ? requested.filter((name) => !successful.has(name)) : [];
  if (!errors.length && !(partialPosts > 0) && !missingAccounts.length) return null;
  const lines = [];
  const accountCodes = new Map();
  for (const error of errors) {
    if (!error?.username || error.post_id) continue;
    const codes = accountCodes.get(error.username) ?? new Set();
    codes.add(error.code ?? error.stage ?? "error");
    accountCodes.set(error.username, codes);
  }
  if (missingAccounts.length) lines.push(`账号入口失败 ${missingAccounts.length}/${requested.length}`);
  for (const [name, codes] of accountCodes) lines.push(`@${name}${colon}${[...codes].map(named).join(comma)}`);
  for (const name of missingAccounts) if (!accountCodes.has(name)) lines.push(`@${name}${colon}未取得账号快照`);
  // One failed post is often reported by several stages; it is one post.
  const postCodes = new Map();
  const failedPosts = new Set();
  for (const error of errors) {
    if (!error?.post_id) continue;
    const post = `${error.username}:${error.post_id}`;
    const code = error.code ?? error.stage ?? "error";
    failedPosts.add(post);
    postCodes.set(code, (postCodes.get(code) ?? new Set()).add(post));
  }
  if (failedPosts.size) {
    const sorted = [...postCodes].sort(([a], [b]) => a.localeCompare(b));
    // Translated causes carry their own brackets, so they are listed after a colon.
    // Counts per cause add up to more than the posts when causes overlap.
    const overlap = sorted.reduce((sum, [, posts]) => sum + posts.size, 0) > failedPosts.size ? "（同一条帖子可能有多个原因）" : "";
    lines.push(typeof label === "function"
      ? `帖子采集失败 ${failedPosts.size} 条：${sorted.map(([code, posts]) => `${named(code)}${named(code).endsWith("）") ? "" : " "}${posts.size} 条`).join("；")}${overlap}`
      : `帖子采集失败 ${failedPosts.size} 条（${sorted.map(([code, posts]) => `${code} ${posts.size}`).join("，")}）`);
  }
  if (partialPosts > 0) lines.push(`指标不完整的帖子: ${partialPosts}`);
  return lines;
}
