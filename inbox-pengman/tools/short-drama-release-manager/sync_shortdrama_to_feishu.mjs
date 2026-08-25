import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createSign } from "node:crypto";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(scriptDir, "../tiktok-public-capture/.env");
const shortdramaSheetId = "1BbOcWUVrhRsnuSAs9LcyCuYWTrauPxtJWI12Esao7p0";
const metricsSheetId = "17NOiX9VGozHEgthpSbBN-2dyf4rJRsTQkmLubBwnICQ";

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

async function saveEnvValue(key, value) {
  const original = await fs.readFile(envPath, "utf8");
  const lines = original.split(/\r?\n/);
  const at = lines.findIndex((line) => line.startsWith(`${key}=`));
  if (at >= 0) lines[at] = `${key}=${value}`;
  else lines.push(`${key}=${value}`);
  await fs.writeFile(envPath, `${lines.filter((line, index) => index < lines.length - 1 || line).join("\n")}\n`, { mode: 0o600 });
}

function expandHome(value) {
  return value?.startsWith("~/") ? path.join(os.homedir(), value.slice(2)) : value;
}

function b64(value) {
  return (Buffer.isBuffer(value) ? value : Buffer.from(value)).toString("base64url");
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};
  if (!response.ok) throw new Error(`${response.status} ${payload.error?.message || payload.msg || response.statusText}`);
  return payload;
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

async function googleRequest(url, token, options = {}) {
  return requestJson(url, {
    ...options,
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json", ...(options.headers || {}) },
  });
}

async function getGoogleContext() {
  const env = await loadEnv(envPath);
  const serviceAccount = JSON.parse(await fs.readFile(expandHome(env.GOOGLE_SERVICE_ACCOUNT_JSON), "utf8"));
  return { env, token: await googleToken(serviceAccount) };
}

async function readGoogleRange(token, range, render = "UNFORMATTED_VALUE") {
  const base = `https://sheets.googleapis.com/v4/spreadsheets/${shortdramaSheetId}`;
  const payload = await googleRequest(`${base}/values/${encodeURIComponent(range)}?valueRenderOption=${render}`, token);
  return payload.values || [];
}

async function googleCanary(token) {
  const base = `https://sheets.googleapis.com/v4/spreadsheets/${shortdramaSheetId}`;
  const range = "'选剧池'!I100";
  const marker = `shortdrama-canary-${new Date().toISOString()}`;
  await googleRequest(`${base}/values/${encodeURIComponent(range)}?valueInputOption=RAW`, token, {
    method: "PUT", body: JSON.stringify({ range, majorDimension: "ROWS", values: [[marker]] }),
  });
  const readback = await readGoogleRange(token, range);
  await googleRequest(`${base}/values/${encodeURIComponent(range)}:clear`, token, { method: "POST", body: "{}" });
  if (readback?.[0]?.[0] !== marker) throw new Error("Google canary readback mismatch");
  return { status: "success", range, restored_blank: true };
}

async function setupGoogle(token) {
  const base = `https://sheets.googleapis.com/v4/spreadsheets/${shortdramaSheetId}`;
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const before = {
    captured_at: new Date().toISOString(),
    account_ledger: await readGoogleRange(token, "'账号台账'!A1:H100", "FORMULA"),
    releases: await readGoogleRange(token, "'发布记录'!A1:U101", "FORMULA"),
    drama_pool: await readGoogleRange(token, "'选剧池'!A1:N101", "FORMULA"),
    capture_data: await readGoogleRange(token, "'采集数据'!A1:I500", "FORMULA"),
  };
  const backupDir = path.resolve(scriptDir, "../../output/short-drama-release-manager/backups");
  await fs.mkdir(backupDir, { recursive: true });
  const backupPath = path.join(backupDir, `google-before-${timestamp}.json`);
  await fs.writeFile(backupPath, JSON.stringify(before, null, 2));

  const metadata = await googleRequest(`${base}?fields=sheets.properties(sheetId,title,gridProperties),sheets.tables(tableId,name,range)`, token);
  const captureSheet = (metadata.sheets || []).find((sheet) => sheet.properties?.title === "采集数据");
  const captureTables = captureSheet?.tables || [];
  if (captureTables.length) {
    await googleRequest(`${base}:batchUpdate`, token, {
      method: "POST",
      body: JSON.stringify({ requests: captureTables.map((table) => ({ deleteTable: { tableId: table.tableId } })) }),
    });
  }

  await googleRequest(`${base}/values:batchClear`, token, {
    method: "POST",
    body: JSON.stringify({ ranges: ["'采集数据'!A:I"] }),
  });
  const captureFormula = `=QUERY(IMPORTRANGE("${metricsSheetId}","posts_latest!A:Q"),"select Col9,Col2,Col1,Col3,Col11,Col12,Col13,Col14,Col15 where Col2 <> 'astrologywiki' and Col2 <> 'miraaastrology' label Col9 '快照日期',Col2 '账号名',Col1 'Post ID',Col3 '视频链接',Col11 '播放量',Col12 '点赞',Col13 '评论',Col14 '收藏',Col15 '转发'",1)`;
  const values = [
    { range: "'采集数据'!A1", values: [[captureFormula]] },
    { range: "'发布记录'!U1", values: [["发布状态"]] },
    {
      range: "'账号台账'!C2:C100",
      values: Array.from({ length: 99 }, (_, index) => [`=IF(A${index + 2}="","",IFERROR(VLOOKUP(A${index + 2},IMPORTRANGE("${metricsSheetId}","accounts_latest!C:F"),4,FALSE),""))`]),
    },
    {
      range: "'账号台账'!H2:H100",
      values: Array.from({ length: 99 }, (_, index) => [`=IF(A${index + 2}="","",IFERROR(INDEX(IMPORTRANGE("${metricsSheetId}","accounts_latest!A:A"),MATCH(A${index + 2},IMPORTRANGE("${metricsSheetId}","accounts_latest!C:C"),0)),""))`]),
    },
  ];
  await googleRequest(`${base}/values:batchUpdate`, token, {
    method: "POST",
    body: JSON.stringify({ valueInputOption: "USER_ENTERED", data: values.map((item) => ({ ...item, majorDimension: "ROWS" })) }),
  });

  const ids = new Map((metadata.sheets || []).map((sheet) => [sheet.properties.title, sheet.properties.sheetId]));
  const releaseSheet = (metadata.sheets || []).find((sheet) => sheet.properties?.title === "发布记录");
  const releaseRowCount = releaseSheet?.properties?.gridProperties?.rowCount || 100;
  const statusFormula = (row) => `=IF(AND(A${row}="",B${row}="",D${row}="",E${row}="",F${row}="",G${row}=""),"",IF(OR(G${row}<>"",H${row}<>""),IF(COUNTIF('采集数据'!$C$2:$C$500,IF(H${row}<>"",H${row},IFERROR(REGEXEXTRACT(G${row},"[0-9]{15,20}"),"")))>0,"已回填","已公开"),IF(AND(A${row}<>"",A${row}<=TODAY()),"待公开","已排期")))`;
  const statusFormulaRows = Array.from({ length: Math.max(0, releaseRowCount - 1) }, (_, index) => ({
    values: [{ userEnteredValue: { formulaValue: statusFormula(index + 2) } }],
  }));
  await googleRequest(`${base}:batchUpdate`, token, {
    method: "POST",
    body: JSON.stringify({ requests: [
      {
        updateCells: {
          start: { sheetId: ids.get("发布记录"), rowIndex: 1, columnIndex: 20 },
          rows: statusFormulaRows,
          fields: "userEnteredValue",
        },
      },
    ] }),
  });

  await new Promise((resolve) => setTimeout(resolve, 1500));
  const captureReadback = await readGoogleRange(token, "'采集数据'!A1:I20");
  const statusReadback = await readGoogleRange(token, "'发布记录'!U1:U3", "FORMULA");
  const accountValues = await readGoogleRange(token, "'账号台账'!A1:H10");
  const accountFormatted = await readGoogleRange(token, "'账号台账'!A1:H10", "FORMATTED_VALUE");
  const accountFormulas = await readGoogleRange(token, "'账号台账'!A1:H3", "FORMULA");
  const invalidFollowers = accountValues.slice(1).filter((row) => row[0] && !Number.isFinite(Number(row[2])));
  const invalidDates = accountFormatted.slice(1).filter((row) => row[0] && !/^\d{4}-\d{2}-\d{2}$/.test(String(row[7] || "")));
  if (invalidFollowers.length || invalidDates.length) {
    throw new Error(`Account ledger verification failed: invalid_followers=${invalidFollowers.length}, invalid_dates=${invalidDates.length}, sample_dates=${JSON.stringify(accountFormatted.slice(1, 4).map((row) => row[7]))}`);
  }
  return {
    status: "success",
    backup_path: backupPath,
    removed_capture_tables: captureTables.map((table) => table.name || table.tableId),
    capture_rows_visible: Math.max(0, captureReadback.length - 1),
    capture_first_rows: captureReadback.slice(0, 4),
    release_status_formulas: statusReadback,
    account_formula_check: accountFormulas.slice(0, 3).map((row) => ({ account: row[0], followers: row[2], snapshot_date: row[7] })),
    account_value_check: accountFormatted.slice(0, 6).map((row) => ({ account: row[0], followers: row[2], snapshot_date: row[7] })),
  };
}

async function feishuRequest(url, token, options = {}) {
  const payload = await requestJson(url, {
    ...options,
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json; charset=utf-8", ...(options.headers || {}) },
  });
  if (payload.code !== 0) throw new Error(`Feishu ${payload.code}: ${payload.msg}`);
  return payload;
}

async function feishuToken(env) {
  const payload = await requestJson("https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal", {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify({ app_id: env.FEISHU_APP_ID, app_secret: env.FEISHU_APP_SECRET }),
  });
  if (payload.code !== 0) throw new Error(`Feishu auth ${payload.code}: ${payload.msg}`);
  return payload.tenant_access_token;
}

const tableDefinitions = {
  "账号台账": [
    ["同步键", 1], ["账号名", 1], ["主页链接", 1], ["粉丝数", 2], ["所属组", 1],
    ["定位垂类", 1], ["表现形式", 1], ["状态", 1], ["数据日期", 1],
  ],
  "发布记录": [
    ["同步键", 1], ["日期", 1], ["账号名", 1], ["主页链接", 1], ["剧名", 1],
    ["剧ID（RS Boost）", 1], ["剧分类", 1], ["视频链接", 1], ["Post ID", 1],
    ["播放量", 2], ["点赞", 2], ["收藏", 2], ["转发", 2], ["评论", 2],
    ["RS收益", 2], ["发布状态", 1], ["备注", 1],
  ],
  "选剧池": [
    ["同步键", 1], ["剧名", 1], ["剧ID", 1], ["剧分类", 1], ["上线日期", 1],
    ["生命周期", 1], ["是否已排期", 1], ["备注", 1],
  ],
};

async function listAll(url, token) {
  const items = [];
  let pageToken = "";
  do {
    const target = new URL(url);
    target.searchParams.set("page_size", "100");
    if (pageToken) target.searchParams.set("page_token", pageToken);
    const payload = await feishuRequest(target.toString(), token);
    items.push(...(payload.data?.items || []));
    pageToken = payload.data?.has_more ? (payload.data?.page_token || "") : "";
  } while (pageToken);
  return items;
}

async function ensureFeishu(env, token) {
  let appToken = env.FEISHU_SHORTDRAMA_APP_TOKEN || "";
  let defaultTableId = "";
  if (!appToken) {
    const created = await feishuRequest("https://open.feishu.cn/open-apis/bitable/v1/apps", token, {
      method: "POST", body: JSON.stringify({ name: "短剧发行管理" }),
    });
    appToken = created.data?.app?.app_token || created.data?.app_token;
    defaultTableId = created.data?.app?.default_table_id || created.data?.default_table_id || "";
    if (!appToken) throw new Error("Feishu app creation returned no app_token");
    await saveEnvValue("FEISHU_SHORTDRAMA_APP_TOKEN", appToken);
  }
  const base = `https://open.feishu.cn/open-apis/bitable/v1/apps/${encodeURIComponent(appToken)}`;
  let tables = await listAll(`${base}/tables`, token);
  const tableMap = new Map(tables.map((table) => [table.name, table.table_id]));
  if (!tableMap.has("账号台账") && (defaultTableId || tables.length === 1)) {
    const tableId = defaultTableId || tables[0].table_id;
    await feishuRequest(`${base}/tables/${encodeURIComponent(tableId)}`, token, {
      method: "PATCH", body: JSON.stringify({ name: "账号台账" }),
    });
  }
  tables = await listAll(`${base}/tables`, token);
  for (const name of Object.keys(tableDefinitions)) {
    if (tables.some((table) => table.name === name)) continue;
    await feishuRequest(`${base}/tables`, token, {
      method: "POST", body: JSON.stringify({ table: { name } }),
    });
  }
  tables = await listAll(`${base}/tables`, token);
  for (const name of Object.keys(tableDefinitions)) {
    const table = tables.find((item) => item.name === name);
    if (!table) throw new Error(`Feishu table missing after setup: ${name}`);
    await saveEnvValue(`FEISHU_SHORTDRAMA_${name === "账号台账" ? "ACCOUNTS" : name === "发布记录" ? "RELEASES" : "POOL"}_TABLE_ID`, table.table_id);
    const fieldsBase = `${base}/tables/${encodeURIComponent(table.table_id)}/fields`;
    const fields = await listAll(fieldsBase, token);
    const existing = new Set(fields.map((field) => field.field_name));
    for (const [fieldName, type] of tableDefinitions[name]) {
      if (existing.has(fieldName)) continue;
      await feishuRequest(fieldsBase, token, {
        method: "POST", body: JSON.stringify({ field_name: fieldName, type }),
      });
    }
  }
  return {
    status: "success",
    app_token_configured: true,
    tables: tables.filter((table) => tableDefinitions[table.name]).map((table) => ({ name: table.name, table_id: table.table_id })),
  };
}

function tableRows(values, wantedHeaders, keyBuilder) {
  const headers = values[0] || [];
  const index = new Map(headers.map((header, at) => [String(header), at]));
  return values.slice(1).map((row, at) => {
    const fields = {};
    for (const header of wantedHeaders) {
      const value = row[index.get(header)];
      if (value !== "" && value !== undefined && value !== null) fields[header] = value;
    }
    fields["同步键"] = keyBuilder(row, index, at);
    return fields;
  }).filter((fields) => Object.keys(fields).some((key) => key !== "同步键"));
}

async function readSourceTables(token) {
  const [accounts, releases, pool] = await Promise.all([
    readGoogleRange(token, "'账号台账'!A1:H100"),
    readGoogleRange(token, "'发布记录'!A1:U101"),
    readGoogleRange(token, "'选剧池'!A1:G101"),
  ]);
  const accountRows = tableRows(accounts, tableDefinitions["账号台账"].slice(1).map(([name]) => name), (row, index) => String(row[index.get("账号名")] || ""))
    .filter((fields) => fields["账号名"]);
  const releaseRows = tableRows(releases, tableDefinitions["发布记录"].slice(1).map(([name]) => name), (row, index, at) => String(row[index.get("Post ID")] || `${row[index.get("日期")] || "未定"}-${row[index.get("账号名")] || "未定"}-${at + 2}`))
    .filter((fields) => fields["日期"] || fields["账号名"] || fields["剧名"] || fields["视频链接"] || fields["Post ID"]);
  const poolRows = tableRows(pool, tableDefinitions["选剧池"].slice(1).map(([name]) => name), (row, index, at) => String(row[index.get("剧ID")] || `${row[index.get("剧名")] || "未命名"}-${at + 2}`))
    .filter((fields) => fields["剧名"] || fields["剧ID"]);
  return { "账号台账": accountRows, "发布记录": releaseRows, "选剧池": poolRows };
}

async function syncTable(appToken, tableId, token, rows, canary) {
  const base = `https://open.feishu.cn/open-apis/bitable/v1/apps/${encodeURIComponent(appToken)}/tables/${encodeURIComponent(tableId)}`;
  if (canary) {
    if (!rows.length) return { status: "skipped_no_rows", source_rows: 0 };
    const payload = await feishuRequest(`${base}/records`, token, {
      method: "POST", body: JSON.stringify({ fields: rows[0] }),
    });
    const recordId = payload.data?.record?.record_id;
    const readback = await feishuRequest(`${base}/records/${encodeURIComponent(recordId)}`, token);
    const matched = readback.data?.record?.fields?.["同步键"] === rows[0]["同步键"];
    await feishuRequest(`${base}/records/${encodeURIComponent(recordId)}`, token, { method: "DELETE" });
    if (!matched) throw new Error("Feishu canary readback mismatch");
    return { status: "success", canary_record_deleted: true, source_rows: rows.length };
  }
  const existing = await listAll(`${base}/records`, token);
  for (let at = 0; at < existing.length; at += 500) {
    const ids = existing.slice(at, at + 500).map((record) => record.record_id);
    if (ids.length) await feishuRequest(`${base}/records/batch_delete`, token, { method: "POST", body: JSON.stringify({ records: ids }) });
  }
  for (let at = 0; at < rows.length; at += 500) {
    await feishuRequest(`${base}/records/batch_create`, token, {
      method: "POST", body: JSON.stringify({ records: rows.slice(at, at + 500).map((fields) => ({ fields })) }),
    });
  }
  const readback = await listAll(`${base}/records`, token);
  return { status: "success", deleted: existing.length, created: rows.length, readback_count: readback.length };
}

async function syncFeishu(env, googleAccessToken, feishuAccessToken, canary = false) {
  if (!env.FEISHU_SHORTDRAMA_APP_TOKEN) throw new Error("Run --setup-feishu first");
  const rows = await readSourceTables(googleAccessToken);
  const result = {};
  const tableIds = {
    "账号台账": env.FEISHU_SHORTDRAMA_ACCOUNTS_TABLE_ID,
    "发布记录": env.FEISHU_SHORTDRAMA_RELEASES_TABLE_ID,
    "选剧池": env.FEISHU_SHORTDRAMA_POOL_TABLE_ID,
  };
  for (const name of Object.keys(tableDefinitions)) {
    result[name] = await syncTable(env.FEISHU_SHORTDRAMA_APP_TOKEN, tableIds[name], feishuAccessToken, rows[name], canary);
  }
  return { status: "success", mode: canary ? "canary" : "full_replace", tables: result };
}

const mode = process.argv[2] || "--sync";
const { env, token: googleAccessToken } = await getGoogleContext();
let result;
if (mode === "--google-canary") result = await googleCanary(googleAccessToken);
else if (mode === "--setup-google") result = await setupGoogle(googleAccessToken);
else {
  const feishuAccessToken = await feishuToken(env);
  if (mode === "--setup-feishu") result = await ensureFeishu(env, feishuAccessToken);
  else if (mode === "--canary") result = await syncFeishu(env, googleAccessToken, feishuAccessToken, true);
  else if (mode === "--sync") result = await syncFeishu(env, googleAccessToken, feishuAccessToken, false);
  else throw new Error(`Unknown mode: ${mode}`);
}
console.log(JSON.stringify({ ...result, completed_at: new Date().toISOString() }, null, 2));
