import fs from "node:fs/promises";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const DEFAULT_WIKI_NODE_TOKEN = "QCigwFYMCiuQu1k8q94cXy7PnZd";
const DEFAULT_TABLE_ID = "tbl1LkOftGc2aHis";

async function loadEnv(filePath) {
  const values = {};
  const text = await fs.readFile(filePath, "utf8");
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator < 1) continue;
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if ((value.startsWith("\"") && value.endsWith("\"")) ||
        (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    values[key] = value;
  }
  return values;
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.code !== 0) {
    const code = payload.code ?? response.status;
    const message = payload.msg || payload.message || response.statusText;
    throw new Error(`Feishu request failed (${code}): ${message}`);
  }
  return payload;
}

function asText(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number") return String(value).trim();
  return "";
}

function normalizeUsername(value) {
  return asText(value).replace(/^@/, "").toLowerCase();
}

function ensureRunColumns(db) {
  const columns = new Set(db.prepare("PRAGMA table_info(runs)").all().map((column) => column.name));
  if (!columns.has("feishu_status")) db.exec("ALTER TABLE runs ADD COLUMN feishu_status TEXT NOT NULL DEFAULT 'pending'");
  if (!columns.has("feishu_updated_count")) db.exec("ALTER TABLE runs ADD COLUMN feishu_updated_count INTEGER NOT NULL DEFAULT 0");
  if (!columns.has("feishu_error_summary")) db.exec("ALTER TABLE runs ADD COLUMN feishu_error_summary TEXT");
}

function setFeishuRunStatus(db, runId, status, updatedCount, errorSummary = "") {
  if (!runId) return;
  ensureRunColumns(db);
  db.prepare([
    "UPDATE runs SET feishu_status=?, feishu_updated_count=?, feishu_error_summary=?",
    "WHERE run_id=?",
  ].join(" ")).run(status, updatedCount, errorSummary, runId);
}

async function listAllRecords(apiBase, headers) {
  const records = [];
  let pageToken = "";
  do {
    const url = new URL(`${apiBase}/records`);
    url.searchParams.set("page_size", "100");
    if (pageToken) url.searchParams.set("page_token", pageToken);
    const payload = await requestJson(url, { headers });
    records.push(...(payload.data?.items || []));
    pageToken = payload.data?.has_more ? (payload.data?.page_token || "") : "";
  } while (pageToken);
  return records;
}

function loadLatestMetrics(db) {
  return db.prepare([
    "SELECT a.username,a.snapshot_date,a.captured_at,a.followers,a.collection_status",
    "FROM account_snapshots a",
    "JOIN (SELECT username,MAX(snapshot_date) AS snapshot_date FROM account_snapshots GROUP BY username) latest",
    "ON latest.username=a.username AND latest.snapshot_date=a.snapshot_date",
    "WHERE a.collection_status='complete' AND a.followers IS NOT NULL",
    "ORDER BY a.username",
  ].join(" ")).all();
}

export async function syncFeishuFollowerMetrics({ dbPath, runId, scriptDir }) {
  const db = new DatabaseSync(dbPath);
  ensureRunColumns(db);
  let updatedCount = 0;
  try {
    const env = await loadEnv(path.join(scriptDir, ".env"));
    const enabled = String(env.FEISHU_SYNC_ENABLED || "false").toLowerCase() === "true";
    if (!enabled) {
      setFeishuRunStatus(db, runId, "disabled", 0);
      db.close();
      return { status: "disabled", updated_count: 0 };
    }

    const appId = env.FEISHU_APP_ID || "";
    const appSecret = env.FEISHU_APP_SECRET || "";
    if (!appId || !appSecret) {
      setFeishuRunStatus(db, runId, "missing_credentials", 0, "Missing FEISHU_APP_ID or FEISHU_APP_SECRET");
      db.close();
      return { status: "missing_credentials", updated_count: 0 };
    }

    const tokenPayload = await requestJson("https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal", {
      method: "POST",
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify({ app_id: appId, app_secret: appSecret }),
    });
    const headers = {
      authorization: `Bearer ${tokenPayload.tenant_access_token}`,
      "content-type": "application/json; charset=utf-8",
    };
    const wikiNodeToken = env.FEISHU_WIKI_NODE_TOKEN || DEFAULT_WIKI_NODE_TOKEN;
    const tableId = env.FEISHU_TABLE_ID || DEFAULT_TABLE_ID;
    const nodePayload = await requestJson(
      `https://open.feishu.cn/open-apis/wiki/v2/spaces/get_node?token=${encodeURIComponent(wikiNodeToken)}`,
      { headers },
    );
    const node = nodePayload.data?.node || {};
    if (node.obj_type !== "bitable" || !node.obj_token) throw new Error("Wiki node did not resolve to a bitable");

    const apiBase = `https://open.feishu.cn/open-apis/bitable/v1/apps/${encodeURIComponent(node.obj_token)}/tables/${encodeURIComponent(tableId)}`;
    const [fieldPayload, records] = await Promise.all([
      requestJson(`${apiBase}/fields?page_size=100`, { headers }),
      listAllRecords(apiBase, headers),
    ]);
    const fields = new Map((fieldPayload.data?.items || []).map((field) => [field.field_name, field]));
    for (const required of ["账号ID", "粉丝", "粉丝同步时间"]) {
      if (!fields.has(required)) throw new Error(`Missing required Feishu field: ${required}`);
    }
    if (fields.get("粉丝")?.ui_type !== "Number") throw new Error("Feishu field 粉丝 must be a Number field");
    if (fields.get("粉丝同步时间")?.ui_type !== "DateTime") throw new Error("Feishu field 粉丝同步时间 must be a DateTime field");

    const recordMap = new Map();
    const duplicateIds = new Set();
    for (const record of records) {
      const accountId = normalizeUsername(record.fields?.["账号ID"]);
      const effectiveId = accountId;
      if (!effectiveId) continue;
      if (recordMap.has(effectiveId)) duplicateIds.add(effectiveId);
      else recordMap.set(effectiveId, record);
    }
    for (const duplicateId of duplicateIds) recordMap.delete(duplicateId);

    const metrics = loadLatestMetrics(db);
    const metricMap = new Map(metrics.map((metric) => [normalizeUsername(metric.username), metric]));
    const rowErrors = [];
    const updated = [];
    const syncTimeMs = Date.now();
    for (const [username, record] of recordMap) {
      const metric = metricMap.get(username);
      if (!metric) continue;
      try {
        await requestJson(`${apiBase}/records/${encodeURIComponent(record.record_id)}`, {
          method: "PUT",
          headers,
          body: JSON.stringify({
            fields: {
              "粉丝": Number(metric.followers),
              "粉丝同步时间": syncTimeMs,
            },
          }),
        });
        updatedCount += 1;
        updated.push({
          username,
          followers: Number(metric.followers),
          snapshot_date: metric.snapshot_date,
          captured_at: metric.captured_at,
        });
      } catch (error) {
        rowErrors.push({ username, error: error instanceof Error ? error.message : String(error) });
      }
    }

    const unmatchedMetrics = [...metricMap.keys()].filter((username) => !recordMap.has(username));
    const unmatchedRecords = [...recordMap.keys()].filter((username) => !metricMap.has(username));
    const status = rowErrors.length ? "partial" : "success";
    setFeishuRunStatus(db, runId, status, updatedCount, rowErrors.length ? JSON.stringify(rowErrors) : "");
    db.close();
    return {
      status,
      updated_count: updatedCount,
      record_count: records.length,
      updated,
      unmatched_metrics: unmatchedMetrics,
      unmatched_records: unmatchedRecords,
      duplicate_effective_account_ids: [...duplicateIds],
      errors: rowErrors,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    setFeishuRunStatus(db, runId, "failed", updatedCount, message);
    db.close();
    return { status: "failed", updated_count: updatedCount, error: message };
  }
}
