import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createSign } from "node:crypto";

const SHORTDRAMA_SHEET_ID = "1BbOcWUVrhRsnuSAs9LcyCuYWTrauPxtJWI12Esao7p0";
const METRICS_SHEET_ID = "17NOiX9VGozHEgthpSbBN-2dyf4rJRsTQkmLubBwnICQ";
const DEFAULT_WIKI_NODE_TOKEN = "QCigwFYMCiuQu1k8q94cXy7PnZd";
const envPath = path.resolve("tools/tiktok-public-capture/.env");

async function loadEnv(filePath) {
  const values = {};
  const text = await fs.readFile(filePath, "utf8");
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const at = line.indexOf("=");
    if (at < 1) continue;
    let value = line.slice(at + 1).trim();
    if ((value.startsWith("\"") && value.endsWith("\"")) ||
        (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    values[line.slice(0, at).trim()] = value;
  }
  return values;
}

function expandHome(value) {
  return value?.startsWith("~/") ? path.join(os.homedir(), value.slice(2)) : value;
}

function b64(value) {
  return (Buffer.isBuffer(value) ? value : Buffer.from(value)).toString("base64url");
}

async function googleToken(serviceAccount) {
  const now = Math.floor(Date.now() / 1000);
  const tokenUri = serviceAccount.token_uri || "https://oauth2.googleapis.com/token";
  const unsigned = `${b64(JSON.stringify({ alg: "RS256", typ: "JWT" }))}.${b64(JSON.stringify({
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: tokenUri,
    iat: now,
    exp: now + 3600,
  }))}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  signer.end();
  const response = await fetch(tokenUri, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${unsigned}.${b64(signer.sign(serviceAccount.private_key))}`,
    }),
  });
  const payload = await response.json();
  if (!response.ok || !payload.access_token) throw new Error(`Google auth failed (${response.status})`);
  return payload.access_token;
}

async function jsonRequest(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};
  if (!response.ok) throw new Error(`${response.status} ${payload.error?.message || payload.msg || response.statusText}`);
  return payload;
}

async function inspectGoogle(spreadsheetId, token, ranges) {
  const base = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`;
  const metadata = await jsonRequest(`${base}?fields=properties.title,sheets.properties(sheetId,title,gridProperties)`, {
    headers: { authorization: `Bearer ${token}` },
  });
  const values = await jsonRequest(`${base}/values:batchGet?${ranges.map((range) => `ranges=${encodeURIComponent(range)}`).join("&")}&valueRenderOption=FORMULA`, {
    headers: { authorization: `Bearer ${token}` },
  });
  return {
    id: spreadsheetId,
    title: metadata.properties?.title,
    sheets: (metadata.sheets || []).map((sheet) => sheet.properties),
    ranges: (values.valueRanges || []).map((item) => ({ range: item.range, values: item.values || [] })),
  };
}

async function feishuRequest(url, accessToken, options = {}) {
  const payload = await jsonRequest(url, {
    ...options,
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json; charset=utf-8",
      ...(options.headers || {}),
    },
  });
  if (payload.code !== 0) throw new Error(`Feishu ${payload.code}: ${payload.msg}`);
  return payload;
}

const env = await loadEnv(envPath);
const serviceAccount = JSON.parse(await fs.readFile(expandHome(env.GOOGLE_SERVICE_ACCOUNT_JSON), "utf8"));
const token = await googleToken(serviceAccount);
const shortdrama = await inspectGoogle(SHORTDRAMA_SHEET_ID, token, [
  "'账号台账'!A1:Z12",
  "'发布记录'!A1:Z12",
  "'选剧池'!A1:Z12",
  "'采集数据'!A1:Q12",
]);
const metrics = await inspectGoogle(METRICS_SHEET_ID, token, [
  "'posts_latest'!A1:Q12",
  "'accounts_latest'!A1:K12",
]);

let feishu = { status: "skipped_missing_credentials" };
if (env.FEISHU_APP_ID && env.FEISHU_APP_SECRET) {
  const auth = await jsonRequest("https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal", {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify({ app_id: env.FEISHU_APP_ID, app_secret: env.FEISHU_APP_SECRET }),
  });
  if (auth.code !== 0) throw new Error(`Feishu auth ${auth.code}: ${auth.msg}`);
  const node = await feishuRequest(
    `https://open.feishu.cn/open-apis/wiki/v2/spaces/get_node?token=${encodeURIComponent(env.FEISHU_WIKI_NODE_TOKEN || DEFAULT_WIKI_NODE_TOKEN)}`,
    auth.tenant_access_token,
  );
  const appToken = node.data?.node?.obj_token;
  const tables = await feishuRequest(
    `https://open.feishu.cn/open-apis/bitable/v1/apps/${encodeURIComponent(appToken)}/tables?page_size=100`,
    auth.tenant_access_token,
  );
  feishu = {
    status: "success",
    existing_app_name: node.data?.node?.title,
    existing_app_token_present: Boolean(appToken),
    tables: (tables.data?.items || []).map((table) => ({ name: table.name, table_id: table.table_id })),
  };
}

console.log(JSON.stringify({ status: "success", write_operations: 0, shortdrama, metrics, feishu }, null, 2));
