import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(scriptDir, ".env");
const defaultWikiNodeToken = "QCigwFYMCiuQu1k8q94cXy7PnZd";
const defaultTableId = "tbl1LkOftGc2aHis";
const dbPath = path.resolve(scriptDir, "../../output/tiktok_metrics.sqlite");

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

const env = await loadEnv(envPath);
const appId = env.FEISHU_APP_ID || "";
const appSecret = env.FEISHU_APP_SECRET || "";
const wikiNodeToken = env.FEISHU_WIKI_NODE_TOKEN || defaultWikiNodeToken;
const tableId = env.FEISHU_TABLE_ID || defaultTableId;

if (!appId || !appSecret) throw new Error(`Missing FEISHU_APP_ID or FEISHU_APP_SECRET in ${envPath}`);

const tokenPayload = await requestJson("https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal", {
  method: "POST",
  headers: { "content-type": "application/json; charset=utf-8" },
  body: JSON.stringify({ app_id: appId, app_secret: appSecret }),
});
const accessToken = tokenPayload.tenant_access_token;
const authHeaders = { authorization: `Bearer ${accessToken}` };

const nodePayload = await requestJson(
  `https://open.feishu.cn/open-apis/wiki/v2/spaces/get_node?token=${encodeURIComponent(wikiNodeToken)}`,
  { headers: authHeaders },
);
const node = nodePayload.data?.node || {};
if (node.obj_type !== "bitable" || !node.obj_token) {
  throw new Error(`Wiki node is not a readable bitable (obj_type=${node.obj_type || "missing"})`);
}
const appToken = node.obj_token;

const apiBase = `https://open.feishu.cn/open-apis/bitable/v1/apps/${encodeURIComponent(appToken)}/tables/${encodeURIComponent(tableId)}`;
const fieldsPayload = await requestJson(`${apiBase}/fields?page_size=100`, { headers: authHeaders });
const recordsPayload = await requestJson(`${apiBase}/records?page_size=100`, { headers: authHeaders });
const fields = fieldsPayload.data?.items || [];
const records = recordsPayload.data?.items || [];

const fieldNames = new Set(fields.map((field) => field.field_name));
const effectiveIds = [];
const blankRecordIds = [];
for (const record of records) {
  const accountId = asText(record.fields?.["账号ID"]);
  const effectiveId = accountId;
  if (effectiveId) effectiveIds.push(effectiveId);
  else blankRecordIds.push(record.record_id);
}

const normalizedCounts = new Map();
for (const accountId of effectiveIds) {
  const normalized = accountId.replace(/^@/, "").toLowerCase();
  normalizedCounts.set(normalized, (normalizedCounts.get(normalized) || 0) + 1);
}
const duplicates = [...normalizedCounts.entries()].filter(([, count]) => count > 1).map(([accountId]) => accountId);
const metricFields = fields
  .filter((field) => /粉丝|follower/i.test(field.field_name))
  .map((field) => ({ name: field.field_name, type: field.type, ui_type: field.ui_type }));

const db = new DatabaseSync(dbPath, { readOnly: true });
const latestMetrics = db.prepare([
  "SELECT a.username,a.followers",
  "FROM account_snapshots a",
  "JOIN (SELECT username,MAX(snapshot_date) AS snapshot_date FROM account_snapshots GROUP BY username) latest",
  "ON latest.username=a.username AND latest.snapshot_date=a.snapshot_date",
  "WHERE a.collection_status='complete' AND a.followers IS NOT NULL",
].join(" ")).all();
db.close();
const metricMap = new Map(latestMetrics.map((metric) => [metric.username.toLowerCase(), Number(metric.followers)]));
const followerComparisons = records.map((record) => {
  const accountId = asText(record.fields?.["账号ID"]);
  const username = accountId.replace(/^@/, "").toLowerCase();
  const sqliteFollowers = metricMap.get(username);
  const feishuFollowers = Number(record.fields?.["粉丝"]);
  return {
    username,
    sqlite_followers: sqliteFollowers,
    feishu_followers: feishuFollowers,
    matches: sqliteFollowers !== undefined && feishuFollowers === sqliteFollowers,
  };
});

console.log(JSON.stringify({
  status: "success",
  checks: {
    tenant_access_token: "success",
    wiki_node: "success",
    bitable_fields: "success",
    bitable_records: "success",
  },
  wiki_obj_type: node.obj_type,
  table_id: tableId,
  field_count: fields.length,
  record_count: records.length,
  required_fields: {
    original_account_id: fieldNames.has("账号ID"),
    current_account_id: fieldNames.has("账号ID"),
  },
  effective_account_count: effectiveIds.length,
  effective_account_ids: effectiveIds,
  duplicate_effective_account_ids: duplicates,
  blank_account_record_count: blankRecordIds.length,
  existing_metric_fields: metricFields,
  follower_verification: {
    matched_count: followerComparisons.filter((item) => item.matches).length,
    total_count: followerComparisons.length,
    mismatches: followerComparisons.filter((item) => !item.matches),
  },
  write_operations: 0,
}, null, 2));
