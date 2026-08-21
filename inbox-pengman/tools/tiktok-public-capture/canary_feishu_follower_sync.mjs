import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.resolve(scriptDir, "../../output");
const envPath = path.join(scriptDir, ".env");
const dbPath = path.join(outputDir, "tiktok_metrics.sqlite");
const targetUsername = "astrologywiki";
const defaultWikiNodeToken = "QCigwFYMCiuQu1k8q94cXy7PnZd";
const defaultTableId = "tbl1LkOftGc2aHis";

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

const db = new DatabaseSync(dbPath, { readOnly: true });
const metric = db.prepare([
  "SELECT snapshot_date, captured_at, followers, collection_status",
  "FROM account_snapshots WHERE lower(username)=lower(?)",
  "ORDER BY snapshot_date DESC, captured_at DESC LIMIT 1",
].join(" ")).get(targetUsername);
db.close();
if (!metric || metric.collection_status !== "complete" || metric.followers === null) {
  throw new Error(`No complete follower metric available for ${targetUsername}`);
}

const tokenPayload = await requestJson("https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal", {
  method: "POST",
  headers: { "content-type": "application/json; charset=utf-8" },
  body: JSON.stringify({ app_id: appId, app_secret: appSecret }),
});
const authHeaders = {
  authorization: `Bearer ${tokenPayload.tenant_access_token}`,
  "content-type": "application/json; charset=utf-8",
};
const nodePayload = await requestJson(
  `https://open.feishu.cn/open-apis/wiki/v2/spaces/get_node?token=${encodeURIComponent(wikiNodeToken)}`,
  { headers: authHeaders },
);
const node = nodePayload.data?.node || {};
if (node.obj_type !== "bitable" || !node.obj_token) throw new Error("Wiki node did not resolve to a bitable");

const apiBase = `https://open.feishu.cn/open-apis/bitable/v1/apps/${encodeURIComponent(node.obj_token)}/tables/${encodeURIComponent(tableId)}`;
const recordsPayload = await requestJson(`${apiBase}/records?page_size=100`, { headers: authHeaders });
const matches = (recordsPayload.data?.items || []).filter((record) => {
  const accountId = asText(record.fields?.["账号ID"]);
  return accountId.replace(/^@/, "").toLowerCase() === targetUsername;
});
if (matches.length !== 1) throw new Error(`Expected exactly one Feishu record for ${targetUsername}; found ${matches.length}`);

const beforeRecord = matches[0];
const beforeFollowers = beforeRecord.fields?.["粉丝"] ?? null;
const syncTimeMs = Date.now();
await requestJson(`${apiBase}/records/${encodeURIComponent(beforeRecord.record_id)}`, {
  method: "PUT",
  headers: authHeaders,
  body: JSON.stringify({
    fields: {
      "粉丝": Number(metric.followers),
      "粉丝同步时间": syncTimeMs,
    },
  }),
});

const verifyPayload = await requestJson(
  `${apiBase}/records/${encodeURIComponent(beforeRecord.record_id)}`,
  { headers: authHeaders },
);
const verifiedFields = verifyPayload.data?.record?.fields || {};
const verifiedFollowers = Number(verifiedFields["粉丝"]);
const verifiedSyncTime = Number(verifiedFields["粉丝同步时间"]);
if (verifiedFollowers !== Number(metric.followers) || verifiedSyncTime !== syncTimeMs) {
  throw new Error("Feishu canary verification did not match the requested values");
}

console.log(JSON.stringify({
  status: "success",
  canary: true,
  username: targetUsername,
  source: {
    snapshot_date: metric.snapshot_date,
    captured_at: metric.captured_at,
    followers: Number(metric.followers),
    collection_status: metric.collection_status,
  },
  feishu: {
    followers_before: beforeFollowers,
    followers_after: verifiedFollowers,
    sync_time_after: new Date(verifiedSyncTime).toISOString(),
    updated_fields: ["粉丝", "粉丝同步时间"],
    verified_by_readback: true,
  },
}, null, 2));
