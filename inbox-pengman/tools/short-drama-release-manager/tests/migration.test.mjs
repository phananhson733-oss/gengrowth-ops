import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, rename, rm, stat, symlink } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  GOOGLE_MIGRATION_RANGES,
  normalizeGoogleSource,
  readGoogleMigrationSource,
} from "../src/google-source.mjs";
import {
  applyMigration as applyMigrationRaw,
  canaryReceiptDigest,
  createPermissionAttestation,
  manifestDigest,
  migrationSourceRevision,
  permissionAttestationDigest,
  planMigration as planMigrationRaw,
  schemaReceiptDigest,
  verificationDigest,
  verifyMigration as verifyMigrationRaw,
  writeMigrationArtifact,
} from "../src/migration.mjs";
import { fixedFieldDescriptor } from "../src/feishu-client.mjs";
import { BASE_FIELD_SPECS, TABLE_ORDER } from "../src/schema.mjs";

const ACCOUNT_HEADERS = ["账号名", "主页链接", "粉丝数", "所属组", "定位垂类", "表现形式", "状态", "数据日期"];
const DRAMA_HEADERS = ["剧名", "剧ID", "剧分类", "上线日期", "生命周期", "是否已排期", "备注", "推荐理由", "RS Boost 分类（待确认）", "账号组", "账号状态", "平台", "语言", "来源", "推荐人", "归档状态"];
const RELEASE_HEADERS = ["日期", "账号名", "主页链接", "剧名", "剧ID（RS Boost）", "剧分类", "视频链接", "Post ID", "播放量", "点赞", "收藏", "转发", "评论", "RS收益", "备注", "归档状态"];
const CAPTURE_HEADERS = ["快照日期", "账号名", "Post ID", "视频链接", "播放量", "点赞", "评论", "收藏", "转发", "业务"];
const BASE_BINDING_SHA256 = "b".repeat(64);
const EMPTY_KEY_SET_SHA256 = createHash("sha256").update(JSON.stringify([])).digest("hex");

function canaryProof() {
  return Object.fromEntries(TABLE_ORDER.map((tableName) => [tableName, {
    before_key_set_sha256: EMPTY_KEY_SET_SHA256,
    canary_primary_sha256: "a".repeat(64),
    created: true,
    readback_verified: true,
    record_id_sha256: "d".repeat(64),
    deleted: true,
    after_key_set_sha256: EMPTY_KEY_SET_SHA256,
    count_before: 0,
    count_after: 0,
  }]));
}

function emptyPrecreatedSchema(revision = "precreated-r1") {
  return {
    revision,
    tables: TABLE_ORDER.map((name, index) => ({
      name,
      table_id: `tbl-precreated-${index}`,
      record_count: 0,
      primary_key_set_sha256: EMPTY_KEY_SET_SHA256,
      fields: [{ field_id: `fld-primary-${index}`, name: "文本", type: "text", is_primary: true }],
    })),
  };
}

function precreatedWith(tables, revision = "precreated-r1") {
  const byName = new Map(tables.map((table) => [table.name, table]));
  const base = emptyPrecreatedSchema(revision);
  return { revision, tables: base.tables.map((table) => structuredClone({ ...table, ...(byName.get(table.name) ?? {}) })) };
}

function planMigration(context) {
  const suppliedSchema = context.baseSchema;
  const baseSchema = suppliedSchema ? {
    ...suppliedSchema,
    tables: suppliedSchema.tables.map((table) => ({
      record_count: 0,
      primary_key_set_sha256: EMPTY_KEY_SET_SHA256,
      ...table,
    })),
  } : emptyPrecreatedSchema();
  return planMigrationRaw({
    baseBindingSha256: BASE_BINDING_SHA256,
    ...context,
    baseSchema,
  });
}

function applyMigration(context, manifest) {
  const phase = context.phase ?? "data";
  const schemaRevision = context.schemaReceipt?.post_revision ?? "post-r1";
  const canaryReceipt = {
    version: "shortdrama-canary-receipt/v1", status: "verified",
    manifest_sha256: manifest.sha256, base_binding_sha256: BASE_BINDING_SHA256,
    schema_revision: schemaRevision, table_bindings_sha256: "c".repeat(64),
    proof: canaryProof(), generated_at: manifest.generated_at,
  };
  canaryReceipt.sha256 = canaryReceiptDigest(canaryReceipt);
  const permissionAttestation = {
    version: "shortdrama-permission-attestation/v1",
    base_binding_sha256: BASE_BINDING_SHA256,
    schema_revision: schemaRevision,
    advanced_permissions_enabled: true,
    primary_and_machine_fields_protected: true,
    company_user_access_verified: true,
    checked_by: "ou_admin",
    checked_at: manifest.generated_at,
  };
  permissionAttestation.sha256 = permissionAttestationDigest(permissionAttestation);
  return applyMigrationRaw({
    baseBindingSha256: BASE_BINDING_SHA256,
    tableBindingsSha256: "c".repeat(64),
    actorId: "ou_admin",
    now: () => manifest.generated_at,
    readEmptyTableEvidence: async () => structuredClone(manifest.initial_empty_table_evidence),
    ...(phase === "schema" ? {} : {
      canaryReceipt,
      expectedCanaryReceiptSha256: canaryReceipt.sha256,
    }),
    ...(phase === "data" ? {
      permissionAttestation,
      expectedPermissionAttestationSha256: permissionAttestation.sha256,
    } : {}),
    ...context,
  }, manifest);
}

function verifyMigration(context, manifest) {
  return verifyMigrationRaw({ baseBindingSha256: BASE_BINDING_SHA256, ...context }, manifest);
}

function matrices() {
  const unformatted = {
    accounts: [[...ACCOUNT_HEADERS], ["DramaExpedition", "https://www.tiktok.com/@dramaexpedition", 1161, "A纯切片", " 短剧 ", "AI真人剧", "发布中", 46239], [null, null, null]],
    dramas: [[...DRAMA_HEADERS], ["Broken contract and four cubs", "legacy", "狼人，复仇", 46240, "新剧", "是", "", "推荐", "狼人,复仇", "A纯切片", "发布中", "ReelShort", "英语", "Google Trends, 至真选剧台", "彭满", "active"], [null, null, null]],
    releases: [[...RELEASE_HEADERS], [46258, "DramaExpedition", "https://www.tiktok.com/@dramaexpedition", "Broken contract and four cubs", "RS-7", "狼人", "https://www.tiktok.com/@dramaexpedition/video/99", "99", 9, 0, null, 1, 2, 0, "首发", "active"], [null, null, null]],
    captures: [[...CAPTURE_HEADERS], [46258, "dramaexpedition", "99", "https://www.tiktok.com/@dramaexpedition/video/99", 20, 0, null, 1, 2, null]],
  };
  const formatted = structuredClone(unformatted);
  formatted.accounts[1][7] = "8/5/2026";
  formatted.dramas[1][3] = "8/6/2026";
  formatted.releases[1][0] = "8/24/2026";
  formatted.captures[1][0] = "8/24/2026";
  const formulas = structuredClone(unformatted);
  formulas.accounts[2] = [null, null, "=IF(A3=\"\",\"\",1)"];
  formulas.dramas[2] = [null, null, null, "=IF(A3=\"\",\"\",TODAY())"];
  formulas.releases[2] = [null, null, null, null, null, null, null, "=IF(A3=\"\",\"\",1)"];
  formulas.captures[1][0] = "=QUERY(IMPORTRANGE(...))";
  return { unformatted, formatted, formulas };
}

function normalizedSource() {
  return normalizeGoogleSource({
    metadata: {
      spreadsheetId: "sheet-1",
      properties: { title: "Short Drama", locale: "zh_CN", timeZone: "America/Los_Angeles" },
      sheets: [
        { properties: { title: "账号台账", sheetId: 1, index: 0, gridProperties: { rowCount: 100, columnCount: 8 } } },
        { properties: { title: "发布记录", sheetId: 2, index: 1, gridProperties: { rowCount: 100, columnCount: 16 } } },
        { properties: { title: "选剧池", sheetId: 3, index: 2, gridProperties: { rowCount: 100, columnCount: 19 } } },
        { properties: { title: "采集数据", sheetId: 4, index: 3, gridProperties: { rowCount: 100, columnCount: 10 } } },
      ],
    },
    grid: {
      accounts: [{ values: [{ userEnteredValue: { stringValue: "账号名" }, effectiveValue: { stringValue: "账号名" }, formattedValue: "账号名", userEnteredFormat: { textFormat: { bold: true } }, effectiveFormat: { numberFormat: { type: "TEXT", pattern: "@" } }, dataValidation: { condition: { type: "ONE_OF_LIST", values: [{ userEnteredValue: "在用" }] } }, note: "owner" }] }],
      releases: [], dramas: [], captures: [],
    },
    ...matrices(),
  });
}

function latestCapture(overrides = {}) {
  return {
    post_id: "99",
    username: "dramaexpedition",
    post_url: "https://www.tiktok.com/@dramaexpedition/video/99",
    snapshot_date: "2026-08-24",
    captured_at: "2026-08-24T01:02:03Z",
    published_at: null,
    views: 20,
    likes: 0,
    comments: null,
    favorites: 1,
    shares: 2,
    collection_status: "partial",
    missing_fields: ["comments"],
    ...overrides,
  };
}

function latestAccount(overrides = {}) {
  return {
    snapshot_date: "2026-08-24",
    captured_at: "2026-08-24T01:02:03Z",
    username: "dramaexpedition",
    account_url: "https://www.tiktok.com/@dramaexpedition",
    nickname: "Drama Expedition",
    followers: 100,
    following: 0,
    total_likes: 0,
    total_posts: 1,
    bio: "",
    collection_status: "complete",
    ...overrides,
  };
}

function googleCapture(overrides = {}) {
  return {
    ...normalizedSource().captures[0],
    "Post ID": "99",
    账号名: "dramaexpedition",
    视频链接: "https://www.tiktok.com/@dramaexpedition/video/99",
    播放量: 10,
    点赞: 0,
    评论: 7,
    收藏: 1,
    转发: 2,
    ...overrides,
  };
}

function sourceWithTables(overrides = {}) {
  const current = normalizedSource();
  const backup = structuredClone(current.raw_backup);
  const headers = { accounts: ACCOUNT_HEADERS, dramas: DRAMA_HEADERS, releases: RELEASE_HEADERS, captures: CAPTURE_HEADERS };
  const sources = {
    accounts: current.accounts,
    dramas: current.dramas,
    releases: current.releases,
    captures: current.captures,
    ...overrides,
  };
  for (const key of Object.keys(headers)) {
    const values = sources[key].map((row) => headers[key].map((field) => row[field] ?? null));
    for (const render of ["unformatted", "formatted", "formulas"]) {
      backup[render][key] = [[...headers[key]], ...structuredClone(values)];
    }
  }
  return normalizeGoogleSource(backup);
}

const sourceWithCaptures = (rows) => sourceWithTables({ captures: rows });
const sourceWithDramas = (rows) => sourceWithTables({ dramas: rows });

test("Google normalization returns capture values without copying formulas", () => {
  const result = normalizedSource();
  assert.equal(result.accounts.length, 1);
  assert.equal(result.dramas.length, 1);
  assert.equal(result.releases.length, 1);
  assert.equal(result.accounts[0].账号ID, "dramaexpedition");
  assert.equal(result.accounts[0].数据日期, "2026-08-05");
  assert.equal(result.dramas[0].上线日期, "2026-08-06");
  assert.deepEqual(result.dramas[0].剧分类, ["狼人", "复仇"]);
  assert.equal(result.releases[0].点赞, 0);
  assert.equal(result.releases[0].收藏, null);
  assert.equal(result.capture_audit_rows, 1);
  assert.deepEqual(result.captures, [{
    source_row: 2,
    快照日期: "2026-08-24",
    账号名: "dramaexpedition",
    "Post ID": "99",
    视频链接: "https://www.tiktok.com/@dramaexpedition/video/99",
    播放量: 20,
    点赞: 0,
    评论: null,
    收藏: 1,
    转发: 2,
    业务: null,
  }]);
  assert.equal(JSON.stringify(result.captures).includes("QUERY"), false);
  assert.match(result.revision, /^google-evidence-v1:[a-f0-9]{64}$/);
  assert.equal(result.raw_backup.grid.accounts[0].values[0].dataValidation.condition.type, "ONE_OF_LIST");
  assert.equal(result.raw_backup.grid.accounts[0].values[0].effectiveFormat.numberFormat.pattern, "@");
  assert.equal(JSON.stringify(result.raw_backup).includes("Bearer"), false);
});

test("Google normalization rejects duplicate/missing headers, ambiguous dates and malformed multi-selects", () => {
  for (const [mutate, expected] of [
    [(data) => { data.unformatted.accounts[0][1] = "账号名"; }, { sheet: "accounts" }],
    [(data) => { data.unformatted.releases[0][0] = "not-date"; }, { field: "日期" }],
    [(data) => { data.unformatted.dramas[1][3] = "08/09/10"; data.formatted.dramas[1][3] = "08/09/10"; }, { field: "上线日期" }],
    [(data) => { data.unformatted.dramas[1][2] = "狼人,,复仇"; }, { field: "剧分类" }],
  ]) {
    const backup = normalizedSource().raw_backup;
    const data = { metadata: backup.metadata, grid: backup.grid, ...matrices() };
    mutate(data);
    assert.throws(() => normalizeGoogleSource(data), (error) => error.code === "google_source_invalid" && Object.entries(expected).every(([key, value]) => error.details[key] === value));
  }
});

test("Google capture normalization rejects invalid identifiers, dates, and metrics", () => {
  for (const [mutate, field] of [
    [(data) => { data.unformatted.captures[1][2] = "post-99"; }, "Post ID"],
    [(data) => { data.unformatted.captures[1][0] = "2026-02-30"; data.formatted.captures[1][0] = "2026-02-30"; }, "快照日期"],
    [(data) => { data.unformatted.captures[1][4] = -1; }, "播放量"],
    [(data) => { data.unformatted.captures[1][5] = Number.MAX_SAFE_INTEGER + 1; }, "点赞"],
  ]) {
    const backup = normalizedSource().raw_backup;
    const data = { metadata: backup.metadata, grid: backup.grid, ...matrices() };
    mutate(data);
    assert.throws(
      () => normalizeGoogleSource(data),
      (error) => error.code === "google_source_invalid" && error.details.field === field,
    );
  }
});

test("Google capture blank metric cells normalize to null partial evidence", () => {
  const backup = normalizedSource().raw_backup;
  const data = structuredClone(backup);
  data.unformatted.captures[1][6] = "";
  data.formatted.captures[1][6] = "";
  const result = normalizeGoogleSource(data);
  assert.equal(result.captures[0].评论, null);

  const trailing = structuredClone(backup);
  trailing.unformatted.captures[1] = trailing.unformatted.captures[1].slice(0, 7);
  trailing.formatted.captures[1] = trailing.formatted.captures[1].slice(0, 7);
  const trailingResult = normalizeGoogleSource(trailing);
  assert.equal(trailingResult.captures[0].收藏, null);
  assert.equal(trailingResult.captures[0].转发, null);
});

test("readGoogleMigrationSource uses readonly JWT and four bounded GETs with exact complete ranges", async () => {
  const calls = [];
  const data = matrices();
  const metadata = {
    spreadsheetId: "sheet-1",
    properties: { title: "Short Drama", locale: "zh_CN", timeZone: "Asia/Shanghai" },
    sheets: GOOGLE_MIGRATION_RANGES.map((item, index) => ({
      properties: { title: item.title, sheetId: index + 1, index, gridProperties: { rowCount: 100, columnCount: [8, 16, 19, 10][index] } },
      data: [{ startRow: 0, startColumn: 0, rowData: index === 0 ? [{ values: [{ dataValidation: { condition: { type: "ONE_OF_LIST", values: [{ userEnteredValue: "发布中" }] } }, userEnteredFormat: { numberFormat: { type: "DATE", pattern: "yyyy-mm-dd" } }, effectiveFormat: { numberFormat: { type: "DATE", pattern: "yyyy-mm-dd" } }, userEnteredValue: { stringValue: "账号名" }, effectiveValue: { stringValue: "账号名" }, formattedValue: "账号名" }] }] : [] }],
    })),
  };
  const renderMatrices = [data.formulas, data.unformatted, data.formatted];
  const fetchJson = async (url, options) => {
    calls.push({ url, options: structuredClone(options) });
    if (url.includes("oauth2.googleapis.com")) return { access_token: "secret-token", expires_in: 3600 };
    if (url.includes("values:batchGet")) {
      const render = new URL(url).searchParams.get("valueRenderOption");
      const at = ["FORMULA", "UNFORMATTED_VALUE", "FORMATTED_VALUE"].indexOf(render);
      return {
        spreadsheetId: "sheet-1",
        valueRanges: GOOGLE_MIGRATION_RANGES.map((item) => ({
          range: item.range,
          majorDimension: "ROWS",
          values: renderMatrices[at][item.key],
        })),
      };
    }
    return metadata;
  };
  const result = await readGoogleMigrationSource({
    spreadsheetId: "sheet-1",
    serviceAccount: {
      client_email: "reader@example.invalid",
      private_key: "test-private-key",
      token_uri: "https://oauth2.googleapis.com/token",
    },
    signJwt: (unsigned) => `signed:${unsigned.length}`,
    fetchJson,
    now: () => 1_800_000_000_000,
  });
  assert.equal(calls.length, 5);
  const jwt = new URLSearchParams(calls[0].options.body).get("assertion").split(".")[1];
  const claims = JSON.parse(Buffer.from(jwt, "base64url").toString("utf8"));
  assert.equal(claims.scope, "https://www.googleapis.com/auth/spreadsheets.readonly");
  for (const call of calls.slice(1)) assert.equal(call.options.method, "GET");
  assert.equal(calls[1].url.includes("revisionId"), false);
  assert.equal(calls[1].url.includes("includeGridData=true"), true);
  assert.equal(new URL(calls[1].url).searchParams.getAll("ranges").length, 4);
  assert.equal(result.capture_audit_rows, 1);
  assert.equal(result.raw_backup.grid.accounts[0].values[0].dataValidation.condition.type, "ONE_OF_LIST");
  assert.equal(result.raw_backup.grid.accounts[0].values[0].effectiveFormat.numberFormat.pattern, "yyyy-mm-dd");
  assert.equal(JSON.stringify(result).includes("secret-token"), false);
});

test("Google source revision changes for any semantic grid or rendered-value evidence", () => {
  const base = normalizedSource();
  const changedGrid = structuredClone(base.raw_backup);
  changedGrid.grid.accounts[0].values[0].note = "changed";
  const changedValue = structuredClone(base.raw_backup);
  changedValue.formatted.accounts[1][2] = "1,162";
  assert.notEqual(normalizeGoogleSource(changedGrid).revision, base.revision);
  assert.notEqual(normalizeGoogleSource(changedValue).revision, base.revision);
});

test("Google reader rejects incomplete/mismatched ranges and duplicate sheet metadata", async () => {
  const metadata = {
    spreadsheetId: "sheet-1", properties: { title: "Short Drama", locale: "en_US", timeZone: "UTC" },
    sheets: GOOGLE_MIGRATION_RANGES.map((item, index) => ({ properties: { title: item.title, sheetId: index + 1, index, gridProperties: { rowCount: 100, columnCount: [8, 16, 19, 10][index] } }, data: [{ startRow: 0, startColumn: 0, rowData: [] }] })),
  };
  const data = matrices();
  const makeFetch = (mutation) => async (url) => {
    if (url.includes("oauth2")) return { access_token: "token" };
    if (!url.includes("values:batchGet")) return mutation === "duplicate" ? { ...metadata, sheets: [...metadata.sheets, metadata.sheets[0]] } : metadata;
    const valueRanges = GOOGLE_MIGRATION_RANGES.map((item) => ({ range: item.range, values: data.unformatted[item.key] }));
    if (mutation === "missing") valueRanges.pop();
    if (mutation === "range") valueRanges[0].range = "wrong!A1:H";
    return { spreadsheetId: "sheet-1", valueRanges, nextPageToken: mutation === "cursor" ? "unexpected" : undefined };
  };
  for (const mutation of ["duplicate", "missing", "range", "cursor"]) {
    await assert.rejects(() => readGoogleMigrationSource({
      spreadsheetId: "sheet-1",
      serviceAccount: { client_email: "x", private_key: "x", token_uri: "https://oauth2.googleapis.com/token" },
      signJwt: () => "signature", fetchJson: makeFetch(mutation),
    }), (error) => error.code === "google_source_invalid");
  }
});

test("migration unions Google history with SQLite latest and creates evidenced account stubs", async () => {
  const google = normalizedSource();
  google.captures = [
    googleCapture({ "Post ID": "99", 播放量: 10 }),
    googleCapture({
      "Post ID": "88",
      账号名: "historyonly",
      视频链接: "https://www.tiktok.com/@historyonly/video/88",
    }),
  ];
  const manifest = await planMigration({
    google,
    sqliteAccounts: [latestAccount()],
    sqlitePosts: [latestCapture({ post_id: "99", views: 20 })],
  });
  assert.deepEqual(manifest.captures.map((row) => row["Post ID"]), ["88", "99"]);
  assert.equal(manifest.captures.find((row) => row["Post ID"] === "99").播放量, 20);
  assert.equal(manifest.accounts.some((row) => row.账号ID === "historyonly"), true);
  assert.equal(manifest.warnings.some((row) => row.code === "account_stub_created" && row.account_id === "historyonly"), true);
  assert.deepEqual(manifest.source_evidence.counts, {
    google_captures: 2,
    sqlite_accounts: 1,
    sqlite_posts: 1,
    capture_overlap: 1,
    capture_union: 2,
  });
});

test("partial SQLite rows retain old valid metrics but keep current missing evidence", async () => {
  const google = normalizedSource();
  google.captures = [googleCapture({ 评论: 7 })];
  const manifest = await planMigration({
    google,
    sqliteAccounts: [latestAccount()],
    sqlitePosts: [latestCapture({ comments: null, missing_fields: ["comments"], collection_status: "partial" })],
  });
  assert.equal(manifest.captures[0].评论, 7);
  assert.equal(manifest.captures[0].采集状态, "partial");
  assert.deepEqual(manifest.captures[0].缺失字段, ["comments"]);
  assert.deepEqual(manifest.reconciliation.capture_merges, [{
    post_id: "99",
    primary_source: "sqlite",
    fallback_fields: ["评论"],
  }]);
});

test("Google-only captures preserve zero and expose exact missing metrics", async () => {
  const google = normalizedSource();
  google.captures = [googleCapture({
    "Post ID": "88",
    视频链接: "https://www.tiktok.com/@dramaexpedition/video/88",
    点赞: 0,
    评论: null,
  })];
  const manifest = await planMigration({ google, sqliteAccounts: [], sqlitePosts: [] });
  assert.equal(manifest.captures[0].点赞, 0);
  assert.equal(manifest.captures[0].评论, null);
  assert.equal(manifest.captures[0].采集状态, "partial");
  assert.deepEqual(manifest.captures[0].缺失字段, ["comments"]);
  assert.match(manifest.captures[0]["来源 run_id"], /^migration:google:[a-f0-9]{64}$/);
});

test("cross-source capture identity conflicts block without selecting a relationship", async () => {
  const google = normalizedSource();
  google.captures = [googleCapture({
    账号名: "other",
    视频链接: "https://www.tiktok.com/@other/video/99",
  })];
  const manifest = await planMigration({
    google,
    sqliteAccounts: [latestAccount()],
    sqlitePosts: [latestCapture()],
  });
  assert.equal(manifest.blocked.some((row) => row.code === "capture_source_conflict" && row.post_id === "99"), true);
});

test("a capture-only account without URL evidence is blocked instead of guessed", async () => {
  const google = normalizedSource();
  google.captures = [googleCapture({ "Post ID": "88", 账号名: "historyonly", 视频链接: null })];
  const manifest = await planMigration({ google, sqliteAccounts: [], sqlitePosts: [] });
  assert.equal(manifest.blocked.some((row) => row.code === "account_stub_evidence_missing" && row.account_id === "historyonly"), true);
  assert.equal(manifest.accounts.some((row) => row.账号ID === "historyonly"), false);
});

test("drama canonical keys merge complementary rows with provenance", async () => {
  const google = normalizedSource();
  const original = google.dramas[0];
  google.dramas = [
    {
      ...original,
      source_row: 27,
      剧名: "The Alpha Princess Is Gone for Good",
      剧分类: ["爱情"],
      来源: ["Reelshort榜单"],
      推荐人: ["高璇"],
      推荐理由: "榜单表现",
    },
    {
      ...original,
      source_row: 38,
      剧名: " the  alpha princess is gone for good ",
      剧分类: ["复仇"],
      来源: ["Google Trends"],
      推荐人: ["马博洋"],
      推荐理由: "搜索趋势",
    },
  ];
  google.releases[0].剧名 = "THE ALPHA PRINCESS IS GONE FOR GOOD";
  const manifest = await planMigration({
    google,
    sqliteAccounts: [latestAccount()],
    sqlitePosts: [latestCapture()],
  });
  assert.equal(manifest.dramas.length, 1);
  assert.equal(manifest.dramas[0].剧ID, "SD-000001");
  assert.equal(manifest.releases[0].剧, "SD-000001");
  assert.deepEqual(manifest.dramas[0].剧分类, ["爱情", "复仇"]);
  assert.deepEqual(manifest.dramas[0].来源, ["Reelshort榜单", "Google Trends"]);
  assert.deepEqual(manifest.dramas[0].推荐人, ["高璇", "马博洋"]);
  assert.match(manifest.dramas[0].推荐理由, /第 27 行[\s\S]*第 38 行/);
  assert.deepEqual(manifest.reconciliation.drama_merges[0].source_rows, [27, 38]);
  assert.equal(manifest.warnings.some((row) => row.code === "drama_rows_merged"), true);
});

test("drama canonical merge blocks conflicting nonblank scalar values", async () => {
  const google = normalizedSource();
  google.dramas.push({
    ...google.dramas[0],
    source_row: 38,
    剧名: ` ${google.dramas[0].剧名.toUpperCase()} `,
    平台: "DramaBox",
  });
  const manifest = await planMigration({ google, sqliteAccounts: [latestAccount()], sqlitePosts: [latestCapture()] });
  assert.equal(manifest.blocked.some((row) =>
    row.code === "drama_merge_conflict" && row.field === "平台" && row.source_rows.includes(38)), true);
});

test("drama merge preserves distinct notes and advances only the fixed lifecycle", async () => {
  const google = normalizedSource();
  google.dramas = [
    { ...google.dramas[0], source_row: 20, 剧名: "A Spicy Text to My Nemesis", 生命周期: "新剧", 备注: "放弃推广" },
    { ...google.dramas[0], source_row: 25, 剧名: "a spicy text to my nemesis", 生命周期: "在推", 备注: "66232" },
  ];
  const manifest = await planMigration({ google, sqliteAccounts: [latestAccount()], sqlitePosts: [latestCapture()] });
  assert.equal(manifest.blocked.some((row) => row.code === "drama_merge_conflict"), false);
  assert.equal(manifest.dramas[0].生命周期, "在推");
  assert.match(manifest.dramas[0].备注, /\[来源：Google 选剧池第 20 行\] 放弃推广[\s\S]*\[来源：Google 选剧池第 25 行\] 66232/);
  assert.equal(manifest.reconciliation.drama_merges[0].field_decisions.生命周期.strategy, "lifecycle_progression");
  assert.equal(manifest.reconciliation.drama_merges[0].field_decisions.备注.strategy, "provenance_join");
});

test("ambiguous and missing safe matches migrate unlinked with review evidence", async () => {
  const google = normalizedSource();
  google.captures = [];
  google.releases = [
    { ...google.releases[0], source_row: 2, 视频链接: null, "Post ID": null, 日期: "2026-08-24" },
    { ...google.releases[0], source_row: 3, 视频链接: null, "Post ID": null, 日期: "2026-08-25" },
  ];
  const sqlitePosts = [
    latestCapture({ post_id: "99", post_url: "https://www.tiktok.com/@dramaexpedition/video/99", published_at: "2026-08-24T01:00:00Z" }),
    latestCapture({ post_id: "100", post_url: "https://www.tiktok.com/@dramaexpedition/video/100", published_at: "2026-08-24T02:00:00Z" }),
  ];
  const manifest = await planMigration({
    google,
    sqliteAccounts: [latestAccount()],
    sqlitePosts,
    now: () => "2026-09-01T00:00:00Z",
  });
  assert.equal(manifest.blocked.length, 0);
  assert.deepEqual(manifest.releases.map((row) => row.采集记录), [null, null]);
  assert.deepEqual(manifest.releases.map((row) => row.同步错误), [
    "待人工关联：ambiguous_post_match",
    "待人工关联：no_account_time_candidate",
  ]);
  assert.deepEqual(manifest.warnings.filter((row) => row.table === "发布记录").map((row) => row.code), [
    "ambiguous_post_match",
    "no_account_time_candidate",
  ]);
});

test("manual Post claims are reserved before earlier automatic time matching", async () => {
  const google = normalizedSource();
  google.captures = [];
  google.releases = [
    { ...google.releases[0], source_row: 2, 视频链接: null, "Post ID": null, 日期: "2026-08-24" },
    { ...google.releases[0], source_row: 3, 日期: "2026-08-30" },
  ];
  const manifest = await planMigration({
    google,
    sqliteAccounts: [latestAccount()],
    sqlitePosts: [latestCapture({ published_at: "2026-08-24T01:00:00Z" })],
    now: () => "2026-09-01T00:00:00Z",
  });
  assert.equal(manifest.blocked.some((row) => row.code === "manual_post_claimed"), false);
  assert.equal(manifest.releases[0].采集记录, null);
  assert.equal(manifest.releases[1].采集记录, "99");
  assert.equal(manifest.releases[1].匹配方式, "manual_url");
});

test("duplicate active and archived manual claims block even when the Post is absent", async () => {
  const base = normalizedSource();
  const google = sourceWithTables({
    captures: [],
    releases: [
    {
      ...base.releases[0],
      source_row: 2,
      视频链接: "https://www.tiktok.com/@dramaexpedition/video/999",
      "Post ID": "999",
      归档状态: "active",
    },
    {
      ...base.releases[0],
      source_row: 3,
      视频链接: "https://www.tiktok.com/@dramaexpedition/video/999",
      "Post ID": "999",
      归档状态: "archived",
    },
  ] });
  const manifest = await planMigration({ google, sqliteAccounts: [latestAccount()], sqlitePosts: [] });
  assert.equal(manifest.blocked.some((row) => row.code === "manual_post_claimed" && row.post_id === "999"), true);
  assert.equal(manifest.warnings.some((row) => row.code === "manual_post_not_found"), false);

  const forged = structuredClone(manifest);
  forged.blocked = [];
  forged.counts.blocked = 0;
  forged.sha256 = manifestDigest(forged);
  await assert.rejects(
    () => applyMigration({ repos: memoryRepos(), expectedSha256: forged.sha256, ...schemaGate(forged) }, forged),
    (error) => error.code === "migration_manifest_invalid",
  );
});

test("plan is pure and deterministic, uses visible/source order, and reconciles Google capture data", async () => {
  const google = normalizedSource();
  google.dramas.push({ ...google.dramas[0], source_row: 3, 剧名: "The Phantom Pilot", 剧分类: ["逆袭"] });
  const first = await planMigration({ google, captures: [latestCapture()], now: () => "2026-09-01T10:00:00Z" });
  const second = await planMigration({ google, captures: [latestCapture()], now: () => "2027-01-01T00:00:00Z" });
  assert.deepEqual(first.dramas.map((row) => row.剧ID), ["SD-000001", "SD-000002"]);
  assert.equal(first.accounts[0].状态, "发布中");
  assert.notEqual(first.accounts[0].状态, "在用");
  assert.deepEqual(first.releases.map((row) => row.发布ID), ["SR-000001"]);
  assert.deepEqual(first.captures.map((row) => row["Post ID"]), ["99"]);
  assert.equal(first.captures.some((row) => row["Post ID"] === "old-99"), false);
  assert.deepEqual(first.counts, { accounts: 1, dramas: 2, captures: 1, releases: 1, blocked: 0, warnings: 0 });
  assert.deepEqual(first.sequence_seeds, { drama: 2, release: 1 });
  assert.equal(first.sha256, second.sha256);
  assert.equal(first.generated_at === second.generated_at, false);
  assert.equal(first.sha256, manifestDigest(first));
  assert.equal(first.source_backup.grid.accounts[0].values[0].dataValidation.condition.type, "ONE_OF_LIST");
  assert.deepEqual(first.schema_actions.filter((action) => action.kind === "create_table"), []);
  assert.equal(first.base_binding_sha256, BASE_BINDING_SHA256);
  assert.deepEqual(first.presentation_actions.map((action) => action.name), [
    "在用账号", "需处理账号", "未排期", "已排期", "按平台", "按语言",
    "已排期", "待公开", "已公开待回填", "已回填", "按账号表现", "按剧表现",
    "完整", "部分缺失", "未关联发布", "短剧发行管理仪表盘",
  ]);
});

test("migration requires four pre-created configured tables and never plans dynamic table creation", async () => {
  const manifest = await planMigrationRaw({
    google: normalizedSource(), captures: [latestCapture()],
    baseBindingSha256: BASE_BINDING_SHA256,
    baseSchema: { revision: "missing-tables", tables: [] },
  });
  assert.equal(manifest.schema_actions.some((action) => action.kind === "create_table"), false);
  assert.deepEqual(
    manifest.blocked.filter((item) => item.code === "base_table_missing").map((item) => item.table),
    [...TABLE_ORDER].sort((left, right) => left.localeCompare(right)),
  );
  assert.ok(manifest.blocked.filter((item) => item.code === "base_table_missing").every(
    (item) => item.next_step === "create_four_empty_tables_and_bind_ids",
  ));
});

test("one-time plan blocks any nonempty or unproven formal Base before schema actions", async () => {
  for (const recordCount of [1, -1, null, undefined]) {
    const schema = emptyPrecreatedSchema(`count-${String(recordCount)}`);
    schema.tables[0].record_count = recordCount;
    if (recordCount !== 0) schema.tables[0].primary_key_set_sha256 = "f".repeat(64);
    const manifest = await planMigrationRaw({
      google: normalizedSource(), captures: [latestCapture()],
      baseBindingSha256: BASE_BINDING_SHA256, baseSchema: schema,
    });
    assert.ok(manifest.blocked.some((item) => item.code === "base_not_empty" && item.table === "账号台账"));
    assert.equal(manifest.schema_actions.some((item) => item.table === "账号台账"), false);
    if (recordCount === 1) {
      const repos = memoryRepos();
      await assert.rejects(
        () => applyMigrationRaw({
          baseBindingSha256: BASE_BINDING_SHA256,
          expectedSha256: manifest.sha256,
          sourceRevision: manifest.source_revision,
          repos,
        }, manifest),
        (error) => error.code === "migration_blocked",
      );
      assert.equal(repos.calls.length, 0);
    }
  }
  const allNonempty = emptyPrecreatedSchema("all-nonempty");
  for (const table of allNonempty.tables) {
    table.record_count = 1;
    table.primary_key_set_sha256 = "e".repeat(64);
  }
  const allBlocked = await planMigrationRaw({
    google: normalizedSource(), captures: [latestCapture()],
    baseBindingSha256: BASE_BINDING_SHA256, baseSchema: allNonempty,
  });
  assert.equal(allBlocked.blocked.filter((item) => item.code === "base_not_empty").length, 4);
  assert.equal(allBlocked.schema_actions.length, 0);
});

test("data revalidates the manifest-bound empty key sets before the first repository write", async () => {
  const manifest = await planMigration({ google: normalizedSource(), captures: [latestCapture()] });
  assert.deepEqual(Object.keys(manifest.initial_empty_table_evidence).sort(), [...TABLE_ORDER].sort());
  const repos = memoryRepos();
  const drifted = structuredClone(manifest.initial_empty_table_evidence);
  drifted.账号台账 = { record_count: 1, key_set_sha256: "e".repeat(64) };
  await assert.rejects(
    () => applyMigration({
      repos, expectedSha256: manifest.sha256, ...schemaGate(manifest),
      readEmptyTableEvidence: async () => drifted,
    }, manifest),
    (error) => error.code === "base_not_empty",
  );
  assert.equal(repos.calls.length, 0);
});

test("Base binding and canary/permission evidence stop cross-Base or ungated data writes", async () => {
  const manifest = await planMigration({ google: normalizedSource(), captures: [latestCapture()] });
  const repos = memoryRepos();
  const receipt = {
    version: "shortdrama-schema-receipt/v1", status: "verified", manifest_sha256: manifest.sha256,
    base_binding_sha256: BASE_BINDING_SHA256,
    pre_revision: manifest.initial_schema_revision, post_revision: "post-r1", action_spec_sha256: manifest.schema_spec_sha256,
  };
  receipt.sha256 = schemaReceiptDigest(receipt);
  const base = {
    repos, phase: "data", expectedSha256: manifest.sha256, sourceRevision: manifest.source_revision,
    schemaReceipt: receipt, expectedSchemaReceiptSha256: receipt.sha256,
    getSchemaRevision: async () => "post-r1", actorId: "ou_admin", now: () => manifest.generated_at,
  };
  await assert.rejects(
    () => applyMigrationRaw({ ...base, baseBindingSha256: "d".repeat(64) }, manifest),
    (error) => error.code === "base_target_mismatch",
  );
  await assert.rejects(
    () => applyMigrationRaw({ ...base, baseBindingSha256: BASE_BINDING_SHA256 }, manifest),
    (error) => error.code === "migration_canary_required",
  );
  const canaryReceipt = {
    version: "shortdrama-canary-receipt/v1", status: "verified", manifest_sha256: manifest.sha256,
    base_binding_sha256: BASE_BINDING_SHA256, schema_revision: "post-r1",
    table_bindings_sha256: "c".repeat(64), proof: canaryProof(), generated_at: manifest.generated_at,
  };
  canaryReceipt.sha256 = canaryReceiptDigest(canaryReceipt);
  const canaryGate = {
    ...base,
    baseBindingSha256: BASE_BINDING_SHA256,
    tableBindingsSha256: "c".repeat(64),
    canaryReceipt,
    expectedCanaryReceiptSha256: canaryReceipt.sha256,
  };
  const incompleteCanary = structuredClone(canaryReceipt);
  incompleteCanary.proof.账号台账.deleted = false;
  incompleteCanary.sha256 = canaryReceiptDigest(incompleteCanary);
  await assert.rejects(
    () => applyMigrationRaw({
      ...canaryGate,
      canaryReceipt: incompleteCanary,
      expectedCanaryReceiptSha256: incompleteCanary.sha256,
    }, manifest),
    (error) => error.code === "migration_canary_required",
  );
  await assert.rejects(
    () => applyMigrationRaw(canaryGate, manifest),
    (error) => error.code === "migration_permission_attestation_required",
  );
  const permissionAttestation = {
    version: "shortdrama-permission-attestation/v1",
    base_binding_sha256: BASE_BINDING_SHA256,
    schema_revision: "post-r1",
    advanced_permissions_enabled: true,
    primary_and_machine_fields_protected: true,
    company_user_access_verified: true,
    checked_by: "ou_admin",
    checked_at: manifest.generated_at,
  };
  permissionAttestation.sha256 = permissionAttestationDigest(permissionAttestation);
  for (const mutate of [
    (value) => { value.checked_by = "ou_other"; },
    (value) => { value.checked_at = "2026-08-01T00:00:00.000Z"; },
    (value) => { value.primary_and_machine_fields_protected = false; },
    (value) => { value.extra = true; },
  ]) {
    const bad = structuredClone(permissionAttestation);
    mutate(bad);
    await assert.rejects(
      () => applyMigrationRaw({
        ...canaryGate,
        permissionAttestation: bad,
        expectedPermissionAttestationSha256: permissionAttestation.sha256,
      }, manifest),
      (error) => error.code === "migration_permission_attestation_required",
    );
  }
  assert.equal(repos.calls.length, 0);
});

test("offline permission helper creates a strict actor/Base/schema-bound attestation", async () => {
  const manifest = await planMigration({ google: normalizedSource(), captures: [latestCapture()] });
  const gate = schemaGate(manifest, "post-r1");
  const observations = {
    version: "shortdrama-permission-observations/v1",
    observed_via: "lark-cli-user-readback",
    advanced_permissions_enabled: true,
    primary_and_machine_fields_protected: true,
    company_user_access_verified: true,
    checked_by: "ou_admin",
    checked_at: manifest.generated_at,
  };
  const attestation = createPermissionAttestation({
    manifest, schemaReceipt: gate.schemaReceipt, observations,
    actorId: "ou_admin", now: () => manifest.generated_at,
  });
  assert.equal(attestation.base_binding_sha256, manifest.base_binding_sha256);
  assert.equal(attestation.schema_revision, "post-r1");
  assert.equal(attestation.sha256, permissionAttestationDigest(attestation));
  for (const mutate of [
    (value) => { value.checked_by = "ou_other"; },
    (value) => { value.observed_via = "runner-self-asserted"; },
    (value) => { value.extra = true; },
  ]) {
    const invalid = structuredClone(observations);
    mutate(invalid);
    assert.throws(
      () => createPermissionAttestation({ manifest, schemaReceipt: gate.schemaReceipt, observations: invalid, actorId: "ou_admin", now: () => manifest.generated_at }),
      (error) => error.code === "migration_permission_attestation_required",
    );
  }
});

test("plan blocks duplicate identities, missing targets, and URL/account disagreement without guessing", async () => {
  const base = normalizedSource();
  const google = sourceWithTables({
    accounts: [base.accounts[0], { ...base.accounts[0], 账号名: "@DRAMAEXPEDITION" }],
    dramas: [base.dramas[0], { ...base.dramas[0] }],
    releases: [base.releases[0], { ...base.releases[0], 账号名: "missing", 剧名: "missing", 视频链接: null, "Post ID": null }],
  });
  const manifest = await planMigration({ google, captures: [latestCapture({ post_url: "https://www.tiktok.com/@other/video/99" })] });
  assert.deepEqual(new Set(manifest.blocked.map((item) => item.code)), new Set([
    "duplicate_account_key", "missing_account_target", "missing_drama_target", "source_account_mismatch",
  ]));
  assert.deepEqual(new Set(manifest.warnings.map((item) => item.code)), new Set(["drama_rows_merged", "no_account_time_candidate"]));
  await assert.rejects(
    () => applyMigration({ expectedSha256: manifest.sha256, sourceRevision: manifest.source_revision }, manifest),
    (error) => error.code === "migration_blocked",
  );
});

test("manifest canonical digest distinguishes null/missing/zero and rejects tampering/unsafe/cyclic data", async () => {
  const manifest = await planMigration({ google: normalizedSource(), captures: [latestCapture()] });
  const nullDigest = manifestDigest({ ...manifest, captures: [{ ...manifest.captures[0], 点赞: null }] });
  const zeroDigest = manifestDigest({ ...manifest, captures: [{ ...manifest.captures[0], 点赞: 0 }] });
  const missing = structuredClone(manifest);
  delete missing.captures[0].点赞;
  assert.notEqual(nullDigest, zeroDigest);
  assert.notEqual(nullDigest, manifestDigest(missing));
  const tampered = structuredClone(manifest);
  tampered.counts.accounts = 999;
  await assert.rejects(() => applyMigration({ expectedSha256: manifest.sha256, sourceRevision: manifest.source_revision }, tampered), (error) => error.code === "migration_digest_mismatch");
  tampered.sha256 = manifestDigest(tampered);
  await assert.rejects(() => applyMigration({ expectedSha256: tampered.sha256, sourceRevision: tampered.source_revision }, tampered), (error) => error.code === "migration_manifest_invalid");
  assert.throws(() => manifestDigest({ bad: Number.NaN }), (error) => error.code === "migration_manifest_invalid");
  const cyclic = {}; cyclic.self = cyclic;
  assert.throws(() => manifestDigest(cyclic), (error) => error.code === "migration_manifest_invalid");
});

test("v2 manifest binds reconciliation and permits warnings but not blockers", async () => {
  const base = normalizedSource();
  const google = sourceWithTables({
    captures: [],
    releases: [{ ...base.releases[0], 视频链接: null, "Post ID": null, 日期: "2026-08-25" }],
  });
  const manifest = await planMigration({
    google,
    sqliteAccounts: [latestAccount()],
    sqlitePosts: [latestCapture()],
    now: () => "2026-09-01T00:00:00Z",
  });
  assert.equal(manifest.version, "shortdrama-migration/v2");
  assert.equal(manifest.blocked.length, 0);
  assert.equal(manifest.counts.warnings, manifest.warnings.length);

  const tampered = structuredClone(manifest);
  tampered.warnings[0].code = "forged";
  await assert.rejects(
    () => applyMigration({ repos: memoryRepos(), expectedSha256: manifest.sha256, ...schemaGate(manifest) }, tampered),
    (error) => error.code === "migration_digest_mismatch",
  );

  const old = structuredClone(manifest);
  old.version = "shortdrama-migration/v1";
  old.sha256 = manifestDigest(old);
  await assert.rejects(
    () => applyMigration({ repos: memoryRepos(), expectedSha256: old.sha256, ...schemaGate(old) }, old),
    (error) => error.code === "migration_manifest_invalid",
  );

  const result = await applyMigration({ repos: memoryRepos(), expectedSha256: manifest.sha256, ...schemaGate(manifest) }, manifest);
  assert.equal(result.status, "applied");
});

test("re-digested v2 warning and reconciliation forgeries fail closed", async () => {
  const google = normalizedSource();
  google.captures.push(googleCapture({
    "Post ID": "88",
    账号名: "historyonly",
    视频链接: "https://www.tiktok.com/@historyonly/video/88",
  }));
  const manifest = await planMigration({ google, sqliteAccounts: [latestAccount()], sqlitePosts: [latestCapture()] });
  for (const mutate of [
    (value) => { value.warnings[0].code = "forged_warning"; },
    (value) => { value.reconciliation.account_stubs.push({ account_id: "forged", source: "google_capture" }); },
    (value) => { value.source_evidence.counts.capture_overlap = 2; },
    (value) => {
      const stub = value.reconciliation.account_stubs[0];
      const warning = value.warnings.find((row) => row.code === "account_stub_created");
      const account = value.accounts.find((row) => row.账号ID === stub.account_id);
      stub.evidence_url = "https://www.tiktok.com/@forged";
      warning.evidence_url = stub.evidence_url;
      account.主页链接 = stub.evidence_url;
    },
  ]) {
    const forged = structuredClone(manifest);
    mutate(forged);
    forged.sha256 = manifestDigest(forged);
    await assert.rejects(
      () => applyMigration({ repos: memoryRepos(), expectedSha256: forged.sha256, ...schemaGate(forged) }, forged),
      (error) => error.code === "migration_manifest_invalid",
    );
  }
});

test("re-digested review warnings must match their release evidence", async () => {
  const base = normalizedSource();
  const google = sourceWithTables({
    captures: [],
    releases: [{ ...base.releases[0], 视频链接: null, "Post ID": null, 日期: "2026-08-25" }],
  });
  const manifest = await planMigration({
    google,
    sqliteAccounts: [latestAccount()],
    sqlitePosts: [latestCapture()],
    now: () => "2026-09-01T00:00:00Z",
  });
  const forged = structuredClone(manifest);
  forged.warnings.find((row) => row.table === "发布记录").code = "manual_post_not_found";
  forged.sha256 = manifestDigest(forged);
  await assert.rejects(
    () => applyMigration({ repos: memoryRepos(), expectedSha256: forged.sha256, ...schemaGate(forged) }, forged),
    (error) => error.code === "migration_manifest_invalid",
  );
});

test("re-digested manifests cannot remove a Google backup Post from the union", async () => {
  const google = sourceWithCaptures([
    googleCapture(),
    googleCapture({ "Post ID": "88", 视频链接: "https://www.tiktok.com/@dramaexpedition/video/88" }),
  ]);
  const sqliteAccounts = [latestAccount()];
  const sqlitePosts = [latestCapture()];
  const manifest = await planMigration({ google, sqliteAccounts, sqlitePosts });
  const forgedGoogle = { ...google, captures: google.captures.filter((row) => row["Post ID"] !== "88") };
  const forgedSource = migrationSourceRevision({ google: forgedGoogle, sqliteAccounts, sqlitePosts });
  const forged = structuredClone(manifest);
  forged.captures = forged.captures.filter((row) => row["Post ID"] !== "88");
  forged.counts.captures = 1;
  forged.source_evidence = {
    ...forgedSource.evidence,
    counts: { ...forged.source_evidence.counts, google_captures: 1, capture_union: 1 },
  };
  forged.source_revision = forgedSource.revision;
  forged.sha256 = manifestDigest(forged);
  await assert.rejects(
    () => applyMigration({ repos: memoryRepos(), expectedSha256: forged.sha256, ...schemaGate(forged) }, forged),
    (error) => error.code === "migration_manifest_invalid",
  );

  const substituted = structuredClone(manifest);
  substituted.captures.find((row) => row["Post ID"] === "88").播放量 = 999;
  substituted.sha256 = manifestDigest(substituted);
  await assert.rejects(
    () => applyMigration({ repos: memoryRepos(), expectedSha256: substituted.sha256, ...schemaGate(substituted) }, substituted),
    (error) => error.code === "migration_manifest_invalid",
  );
});

test("re-digested manifests cannot remove replayed source or drama blockers", async () => {
  const captureConflictGoogle = sourceWithCaptures([googleCapture({
    账号名: "other",
    视频链接: "https://www.tiktok.com/@other/video/99",
  })]);
  const captureConflict = await planMigration({
    google: captureConflictGoogle,
    sqliteAccounts: [latestAccount()],
    sqlitePosts: [latestCapture()],
  });
  assert.equal(captureConflict.blocked.some((row) => row.code === "capture_source_conflict"), true);

  const originalDrama = normalizedSource().dramas[0];
  const dramaConflictGoogle = sourceWithDramas([
    { ...originalDrama, source_row: 2, 剧名: "Conflict Drama", 平台: "ReelShort" },
    { ...originalDrama, source_row: 3, 剧名: " conflict drama ", 平台: "DramaBox" },
  ]);
  const dramaConflict = await planMigration({
    google: dramaConflictGoogle,
    sqliteAccounts: [latestAccount()],
    sqlitePosts: [latestCapture()],
  });
  assert.equal(dramaConflict.blocked.some((row) => row.code === "drama_merge_conflict"), true);

  for (const manifest of [captureConflict, dramaConflict]) {
    const forged = structuredClone(manifest);
    forged.blocked = [];
    forged.counts.blocked = 0;
    forged.sha256 = manifestDigest(forged);
    await assert.rejects(
      () => applyMigration({ repos: memoryRepos(), expectedSha256: forged.sha256, ...schemaGate(forged) }, forged),
      (error) => error.code === "migration_manifest_invalid",
    );
  }
});

test("verify proves the reconciled capture union and pending relations", async () => {
  const base = normalizedSource();
  const google = sourceWithTables({
    captures: [
    googleCapture(),
    googleCapture({
      "Post ID": "88",
      视频链接: "https://www.tiktok.com/@dramaexpedition/video/88",
    }),
  ],
    releases: [{ ...base.releases[0], 视频链接: null, "Post ID": null, 日期: "2026-08-25" }],
  });
  const manifest = await planMigration({
    google,
    sqliteAccounts: [latestAccount()],
    sqlitePosts: [latestCapture()],
    now: () => "2026-09-01T00:00:00Z",
  });
  const repos = memoryRepos();
  await applyMigration({ repos, expectedSha256: manifest.sha256, ...schemaGate(manifest) }, manifest);
  const report = await verifyMigration({ repos }, manifest);
  assert.deepEqual(report.details.latest_capture_post_ids, ["88", "99"]);
  assert.equal(report.details.source_union_verified, true);
  assert.equal(report.details.pending_release_warnings_verified, true);
});

test("schema plan blocks same-name type/config drift and creates fixed missing fields without reverse-link recreation", async () => {
  const tableIds = Object.fromEntries(["账号台账", "选剧池", "采集数据", "发布记录"].map((name, index) => [name, `tbl-${index}`]));
  const fields = ACCOUNT_HEADERS.map((name) => ({ name, ...(name === "粉丝数" ? { type: "text" } : {}) }));
  const manifest = await planMigration({
    google: normalizedSource(), captures: [latestCapture()],
    baseSchema: { revision: "base-r1", tables: [
      { name: "账号台账", table_id: tableIds.账号台账, fields },
      { name: "选剧池", table_id: tableIds.选剧池, fields: [] },
      { name: "采集数据", table_id: tableIds.采集数据, fields: [] },
      { name: "发布记录", table_id: tableIds.发布记录, fields: [] },
    ] },
  });
  assert.equal(manifest.blocked.some((item) => item.code === "base_schema_drift" && item.field === "粉丝数"), true);
  assert.equal(manifest.schema_actions.some((action) => action.field === "关联发布记录" && action.table !== "发布记录"), false);

  const inconsistentReverse = await planMigration({ google: normalizedSource(), captures: [latestCapture()], baseSchema: { revision: "reverse", tables: [
    { name: "账号台账", table_id: "ta", fields: [] },
    { name: "选剧池", table_id: "td", fields: [] },
    { name: "采集数据", table_id: "tc", fields: [] },
    { name: "发布记录", table_id: "tr", fields: [{ field_id: "link-drama", name: "剧", type: "link", link_table: "td", bidirectional: true, bidirectional_link_field_name: "关联发布记录" }] },
  ] } });
  assert.equal(inconsistentReverse.blocked.some((item) => item.code === "base_schema_drift" && item.table === "选剧池" && item.field === "关联发布记录"), true);

  const falsePrimary = await planMigration({ google: normalizedSource(), captures: [latestCapture()], baseSchema: { revision: "primary", tables: [
    { name: "账号台账", table_id: "ta", record_count: 0, fields: [{ field_id: "not-primary", name: "账号ID", type: "text", is_primary: false }, { field_id: "primary", name: "文本", type: "text", is_primary: true }] },
  ] } });
  assert.equal(falsePrimary.blocked.some((item) => item.code === "base_schema_drift" && item.table === "账号台账" && item.field === "账号ID"), true);

  for (const mutate of [
    (field) => { field.where = { logic: "or", conditions: [] }; },
    (field) => { field.aggregate = "count"; },
  ]) {
    const lookup = fixedFieldDescriptor("发布记录", "账号名");
    mutate(lookup);
    const wrongLookup = await planMigration({ google: normalizedSource(), captures: [latestCapture()], baseSchema: { revision: "lookup", tables: [
      { name: "发布记录", table_id: "tr", fields: [{ field_id: "lookup-account", ...lookup }] },
    ] } });
    assert.equal(wrongLookup.blocked.some((item) => item.code === "base_schema_drift" && item.table === "发布记录" && item.field === "账号名"), true);
  }
});

function completeFixedSchema(revision = "complete-r1") {
  const tableIds = Object.fromEntries(TABLE_ORDER.map((table, index) => [table, `tbl-${index}`]));
  return {
    revision,
    tables: TABLE_ORDER.map((table) => ({
      name: table,
      table_id: tableIds[table],
      record_count: 0,
      fields: BASE_FIELD_SPECS[table].map((spec, index) => ({
        field_id: `${tableIds[table]}-f${index}`,
        ...fixedFieldDescriptor(table, spec.name, spec.kind === "link" ? { targetTableId: tableIds[spec.targetTable] } : {}),
        ...(spec.primary ? { is_primary: true } : {}),
      })),
    })),
  };
}

test("migration schema rejects an unexpected fifth Base table", async () => {
  const baseSchema = completeFixedSchema("extra-table");
  baseSchema.tables.push({ name: "默认数据表", table_id: "tbl-default", record_count: 0, fields: [] });
  const manifest = await planMigration({ google: normalizedSource(), captures: [latestCapture()], baseSchema });
  assert.equal(manifest.blocked.some((entry) =>
    entry.code === "base_schema_drift" && entry.table === "默认数据表" && entry.reason === "unexpected_table"), true);
  assert.equal(manifest.schema_actions.length, 0);
});

function fixedFieldForTables(tables, table, field, fieldId, { primary = false } = {}) {
  const spec = BASE_FIELD_SPECS[table].find((item) => item.name === field);
  const bindings = spec.kind === "link" ? { targetTableId: tables.get(spec.targetTable).table_id } : {};
  return { field_id: fieldId, ...fixedFieldDescriptor(table, field, bindings), ...(primary ? { is_primary: true } : {}) };
}

test("fresh Base plan creates every fixed field in phase order and bootstraps only an empty default primary", async () => {
  const fresh = await planMigration({ google: normalizedSource(), captures: [latestCapture()], baseSchema: { revision: "new", tables: [] } });
  assert.equal(fresh.schema_actions.length, 0);
  assert.equal(fresh.blocked.filter((entry) => entry.code === "base_table_missing").length, 4);

  const bootstrap = await planMigration({ google: normalizedSource(), captures: [latestCapture()], baseSchema: precreatedWith([
    { name: "账号台账", table_id: "t1", record_count: 0, fields: [{ field_id: "fld-default", name: "文本", type: "text", is_primary: true }] },
  ], "empty-default") });
  const primaryAction = bootstrap.schema_actions.find((action) => action.kind === "update_primary_field");
  assert.deepEqual({ ...primaryAction, spec: undefined }, {
    id: "primary:账号台账:账号ID", kind: "update_primary_field", table: "账号台账", field: "账号ID", field_id: "fld-default", phase: "storage", spec: undefined,
  });
  assert.deepEqual(primaryAction.spec.canonical, { name: "账号ID", type: "text" });
  const unsafe = await planMigration({ google: normalizedSource(), captures: [latestCapture()], baseSchema: precreatedWith([
    { name: "账号台账", table_id: "t1", record_count: 1, fields: [{ field_id: "fld-default", name: "文本", type: "text", is_primary: true }] },
  ], "nonempty-default") });
  assert.equal(unsafe.blocked.some((entry) => entry.code === "base_not_empty" && entry.table === "账号台账"), true);
});

test("release planning warns on ambiguous evidence while allowing a truly future unlinked row", async () => {
  const google = normalizedSource();
  google.releases = [
    { ...google.releases[0], source_row: 2, 视频链接: null, "Post ID": null, 日期: "2026-08-24" },
    { ...google.releases[0], source_row: 3, 视频链接: null, "Post ID": null, 日期: "2026-08-24" },
    { ...google.releases[0], source_row: 4, 视频链接: null, "Post ID": null, 日期: "2026-09-10" },
  ];
  const captures = [latestCapture({ published_at: "2026-08-24T01:00:00Z" }), latestCapture({ post_id: "100", post_url: "https://www.tiktok.com/@dramaexpedition/video/100", published_at: "2026-08-24T02:00:00Z" })];
  const manifest = await planMigration({ google, captures, now: () => "2026-09-01T00:00:00Z" });
  assert.equal(manifest.warnings.filter((entry) => entry.code === "ambiguous_post_match").length, 2);
  assert.equal(manifest.releases[2].采集记录, null);
});

test("archived releases still claim Post IDs and future dates never swallow non-empty matcher failures", async () => {
  const google = normalizedSource();
  google.releases = [
    { ...google.releases[0], source_row: 2, 归档状态: "archived" },
    { ...google.releases[0], source_row: 3, 归档状态: "archived" },
    { ...google.releases[0], source_row: 4, 日期: "2026-09-10", 视频链接: null, "Post ID": null },
  ];
  const duplicate = await planMigration({ google, captures: [latestCapture()], now: () => "2026-09-01T00:00:00Z" });
  assert.equal(duplicate.blocked.some((entry) => entry.code === "manual_post_claimed"), true);

  const ambiguousGoogle = normalizedSource();
  ambiguousGoogle.releases[0] = { ...ambiguousGoogle.releases[0], 日期: "2026-09-10", 视频链接: null, "Post ID": null };
  const ambiguous = await planMigration({ google: ambiguousGoogle, captures: [
    latestCapture({ published_at: "2026-09-10T01:00:00Z" }),
    latestCapture({ post_id: "100", post_url: "https://www.tiktok.com/@dramaexpedition/video/100", published_at: "2026-09-10T02:00:00Z" }),
  ], now: () => "2026-09-01T00:00:00Z" });
  assert.equal(ambiguous.warnings.some((entry) => entry.code === "ambiguous_post_match"), true);
});

test("manifest binds full schema and presentation semantics, not only action names", async () => {
  const manifest = await planMigration({ google: normalizedSource(), captures: [latestCapture()] });
  assert.equal(manifest.schema_actions.every((action) => action.spec && action.spec.name), true);
  const lookup = manifest.schema_actions.find((action) => action.table === "发布记录" && action.field === "账号名");
  assert.deepEqual(lookup.spec.canonical.where, { logic: "and", conditions: [["账号ID", "intersects", { type: "field_ref", field: "账号" }]] });
  assert.equal(lookup.spec.canonical.aggregate, "raw_value");
  const bidirectional = manifest.schema_actions.find((action) => action.table === "发布记录" && action.field === "剧");
  assert.equal(bidirectional.spec.canonical.bidirectional, true);
  assert.equal(bidirectional.spec.canonical.bidirectional_link_field_name, "关联发布记录");
  const view = manifest.presentation_actions.find((action) => action.id === "view:账号台账:在用账号");
  assert.deepEqual(view.configuration.filter, { logic: "and", conditions: [["状态", "intersects", ["发布中"]]] });
  assert.ok(view.configuration.visible_fields.visible_fields.includes("同步状态"));
  const dashboard = manifest.presentation_actions.find((action) => action.id.startsWith("dashboard:"));
  assert.equal(dashboard.blocks.length, 6);
  assert.deepEqual(dashboard.blocks.map((block) => [block.name, block.type]), [["活跃账号数", "statistics"], ["待公开数", "statistics"], ["待回填数", "statistics"], ["按账号最新累计表现", "column"], ["按剧最新累计表现", "column"], ["最近一次同步终态", "text"]]);

  const drifted = structuredClone(manifest);
  drifted.schema_actions.find((action) => action.kind === "create_field").spec.canonical.type = "number";
  drifted.sha256 = manifestDigest(drifted);
  const repos = memoryRepos();
  await assert.rejects(() => applyMigration({ repos, expectedSha256: drifted.sha256, ...schemaGate(drifted) }, drifted), (error) => error.code === "migration_manifest_invalid");
  assert.equal(repos.calls.length, 0);
});

class MemoryRepo {
  constructor(primary, recordPrefix, calls) {
    this.primary = primary;
    this.recordPrefix = recordPrefix;
    this.calls = calls;
    this.rows = new Map();
  }
  async syncManyByKey(entries, actorKind) {
    this.calls.push([this.recordPrefix, actorKind, structuredClone(entries)]);
    for (const entry of entries) {
      const current = this.rows.get(entry.key);
      this.rows.set(entry.key, {
        record_id: current?.record_id ?? `rec-${this.recordPrefix}-${entry.key}`,
        fields: { ...(current?.fields ?? {}), [this.primary]: entry.key, ...structuredClone(entry.patch) },
      });
    }
    return { readback: "verified" };
  }
  async loadIndex() { return new Map([...this.rows].map(([key, value]) => [key, structuredClone(value)])); }
}

function memoryRepos() {
  const calls = [];
  return {
    calls,
    accounts: new MemoryRepo("账号ID", "accounts", calls),
    dramas: new MemoryRepo("剧ID", "dramas", calls),
    captures: new MemoryRepo("Post ID", "captures", calls),
    releases: new MemoryRepo("发布ID", "releases", calls),
  };
}

function schemaGate(manifest, postRevision = "post-schema-r1") {
  const schemaReceipt = {
    version: "shortdrama-schema-receipt/v1",
    status: "verified",
    manifest_sha256: manifest.sha256,
    base_binding_sha256: manifest.base_binding_sha256,
    pre_revision: manifest.initial_schema_revision,
    post_revision: postRevision,
    action_spec_sha256: manifest.schema_spec_sha256,
  };
  schemaReceipt.sha256 = schemaReceiptDigest(schemaReceipt);
  return {
    sourceRevision: manifest.source_revision,
    schemaReceipt,
    expectedSchemaReceiptSha256: schemaReceipt.sha256,
    getSchemaRevision: async () => postRevision,
  };
}

test("data apply prevalidates, bulk-syncs once per table in order, and resolves stable relations to Base v3 IDs", async () => {
  const manifest = await planMigration({ google: normalizedSource(), captures: [latestCapture()] });
  const repos = memoryRepos();
  const result = await applyMigration({
    phase: "data", repos, expectedSha256: manifest.sha256, ...schemaGate(manifest),
  }, manifest);
  assert.equal(result.status, "applied");
  assert.deepEqual(repos.calls.map(([name]) => name), ["accounts", "dramas", "captures", "releases"]);
  assert.equal(repos.calls.every(([, actor]) => actor === "migration"), true);
  const capturePatch = repos.calls[2][2][0].patch;
  assert.deepEqual(capturePatch.账号, [{ id: "rec-accounts-dramaexpedition" }]);
  assert.equal(capturePatch.点赞, 0);
  assert.equal(capturePatch.评论, null);
  const releasePatch = repos.calls[3][2][0].patch;
  assert.deepEqual(releasePatch.账号, [{ id: "rec-accounts-dramaexpedition" }]);
  assert.deepEqual(releasePatch.剧, [{ id: "rec-dramas-SD-000001" }]);
  assert.deepEqual(releasePatch.采集记录, [{ id: "rec-captures-99" }]);
});

test("data apply rejects a re-digested late derived field before the first bulk write", async () => {
  const manifest = await planMigration({ google: normalizedSource(), captures: [latestCapture()] });
  manifest.releases[0].播放量 = 999;
  manifest.sha256 = manifestDigest(manifest);
  const repos = memoryRepos();
  await assert.rejects(() => applyMigration({
    repos, expectedSha256: manifest.sha256, ...schemaGate(manifest),
  }, manifest), (error) => error.code === "migration_manifest_invalid");
  assert.equal(repos.calls.length, 0);
});

test("apply rejects missing digest and source/schema drift before any write", async () => {
  const manifest = await planMigration({ google: normalizedSource(), captures: [latestCapture()] });
  for (const context of [
    { ...schemaGate(manifest) },
    { expectedSha256: manifest.sha256, ...schemaGate(manifest), sourceRevision: "changed" },
    { expectedSha256: manifest.sha256, ...schemaGate(manifest), getSchemaRevision: async () => "changed" },
  ]) {
    const repos = memoryRepos();
    await assert.rejects(() => applyMigration({ ...context, repos }, manifest), (error) => ["migration_digest_required", "source_revision_drift", "schema_revision_drift"].includes(error.code));
    assert.equal(repos.calls.length, 0);
  }
});

test("schema and presentation phases reject incomplete adapters before writes", async () => {
  const manifest = await planMigration({ google: normalizedSource(), captures: [latestCapture()] });
  const calls = [];
  const schemaAdapter = {
    createField: async () => { throw new Error("unexpected field action"); },
    verifySchemaAction: async (action) => { calls.push(["verifySchema", action.id]); return true; },
  };
  await assert.rejects(() => applyMigration({ phase: "schema", schemaAdapter, expectedSha256: manifest.sha256, sourceRevision: manifest.source_revision, getSchemaRevision: async () => manifest.initial_schema_revision }, manifest), (error) => error.code === "migration_context_invalid");
  assert.equal(calls.length, 0);
  const presentationAdapter = {
    createView: async (table, view) => calls.push(["view", table, view]),
    createDashboard: async (name) => calls.push(["dashboard", name]),
  };
  await assert.rejects(() => applyMigration({ phase: "presentation", presentationAdapter, expectedSha256: manifest.sha256, ...schemaGate(manifest) }, manifest), (error) => error.code === "migration_context_invalid");
  assert.equal(calls.length, 0);
});

test("schema apply resolves IDs from complete readback, updates default primary, and creates dependent links after storage", async () => {
  const baseSchema = emptyPrecreatedSchema("new");
  const manifest = await planMigration({ google: normalizedSource(), captures: [latestCapture()], baseSchema });
  const calls = [];
  const tables = new Map(baseSchema.tables.map((table) => [table.name, structuredClone(table)]));
  const adapter = {
    createField: async (tableId, table, field, bindings) => {
      tables.get(table).fields.push(fixedFieldForTables(tables, table, field, `${tableId}-${field}`));
      if (table === "发布记录" && field === "剧") tables.get("选剧池").fields.push(fixedFieldForTables(tables, "选剧池", "关联发布记录", "reverse-drama"));
      if (table === "发布记录" && field === "采集记录") tables.get("采集数据").fields.push(fixedFieldForTables(tables, "采集数据", "关联发布记录", "reverse-capture"));
      calls.push(["field", table, field, bindings]);
    },
    updateField: async (tableId, fieldId, table, field) => {
      const at = tables.get(table).fields.findIndex((item) => item.field_id === fieldId);
      tables.get(table).fields[at] = fixedFieldForTables(tables, table, field, fieldId, { primary: true });
      calls.push(["update", tableId, fieldId, table, field]);
    },
    readSchema: async () => ({ complete: true, tables: [...tables].map(([name, value]) => ({ name, ...value })) }),
    verifySchemaAction: async () => true,
  };
  let revisionReads = 0;
  const applied = await applyMigration({ phase: "schema", schemaAdapter: adapter, expectedSha256: manifest.sha256, sourceRevision: manifest.source_revision, getSchemaRevision: async () => revisionReads++ === 0 ? manifest.initial_schema_revision : "post-schema-r1" }, manifest);
  assert.equal(applied.schema_receipt.status, "verified");
  assert.equal(applied.schema_receipt.manifest_sha256, manifest.sha256);
  assert.equal(applied.schema_receipt.pre_revision, manifest.initial_schema_revision);
  assert.equal(applied.schema_receipt.post_revision, "post-schema-r1");
  assert.match(applied.schema_receipt.sha256, /^[a-f0-9]{64}$/);
  assert.equal(calls.some((call) => call[0] === "field" && call[2] === "账号名"), true);
  const linkCall = calls.find((call) => call[0] === "field" && call[1] === "发布记录" && call[2] === "剧");
  assert.deepEqual(linkCall[3], { targetTableId: "tbl-precreated-1" });

  const repos = memoryRepos();
  await applyMigration({ repos, expectedSha256: manifest.sha256, sourceRevision: manifest.source_revision,
    schemaReceipt: applied.schema_receipt, expectedSchemaReceiptSha256: applied.schema_receipt.sha256,
    getSchemaRevision: async () => "post-schema-r1" }, manifest);
  assert.deepEqual(repos.calls.map(([name]) => name), ["accounts", "dramas", "captures", "releases"]);
  const beforeReuseWrites = calls.length;
  const reused = await applyMigration({ phase: "schema", schemaAdapter: adapter, expectedSha256: manifest.sha256, sourceRevision: manifest.source_revision,
    schemaReceipt: applied.schema_receipt, expectedSchemaReceiptSha256: applied.schema_receipt.sha256,
    getSchemaRevision: async () => "post-schema-r1" }, manifest);
  assert.equal(reused.reused, true);
  assert.equal(calls.length, beforeReuseWrites);
});

test("data phase requires an untampered same-manifest schema receipt at its post revision before writes", async () => {
  const manifest = await planMigration({ google: normalizedSource(), captures: [latestCapture()] });
  const repos = memoryRepos();
  const receipt = {
    version: "shortdrama-schema-receipt/v1", status: "verified", manifest_sha256: manifest.sha256,
    base_binding_sha256: manifest.base_binding_sha256,
    pre_revision: manifest.initial_schema_revision, post_revision: "post-r1", action_spec_sha256: manifest.schema_spec_sha256,
  };
  receipt.sha256 = schemaReceiptDigest(receipt);
  await assert.rejects(() => applyMigration({ repos, expectedSha256: manifest.sha256, sourceRevision: manifest.source_revision, getSchemaRevision: async () => "post-r1" }, manifest), (error) => error.code === "migration_schema_receipt_required");
  const tampered = { ...receipt, post_revision: "evil" };
  await assert.rejects(() => applyMigration({ repos, expectedSha256: manifest.sha256, sourceRevision: manifest.source_revision, schemaReceipt: tampered, expectedSchemaReceiptSha256: receipt.sha256, getSchemaRevision: async () => "post-r1" }, manifest), (error) => error.code === "migration_schema_receipt_required");
  assert.equal(repos.calls.length, 0);
});

test("schema apply performs an empty-table primary bootstrap and proves the renamed primary in readback", async () => {
  const baseSchema = precreatedWith([
    { name: "账号台账", table_id: "tbl-account", record_count: 0, fields: [{ field_id: "fld-default", name: "文本", type: "text", is_primary: true }] },
  ], "bootstrap");
  const manifest = await planMigration({ google: normalizedSource(), captures: [latestCapture()], baseSchema });
  const tables = new Map(baseSchema.tables.map((table) => [table.name, structuredClone(table)]));
  const calls = [];
  const adapter = {
    createField: async (tableId, table, field) => {
      tables.get(table).fields.push(fixedFieldForTables(tables, table, field, `${tableId}-${field}`));
      if (table === "发布记录" && field === "剧") tables.get("选剧池").fields.push(fixedFieldForTables(tables, "选剧池", "关联发布记录", "reverse-drama"));
      if (table === "发布记录" && field === "采集记录") tables.get("采集数据").fields.push(fixedFieldForTables(tables, "采集数据", "关联发布记录", "reverse-capture"));
    },
    updateField: async (tableId, fieldId, table, field) => { const at = tables.get(table).fields.findIndex((item) => item.field_id === fieldId); tables.get(table).fields[at] = fixedFieldForTables(tables, table, field, fieldId, { primary: true }); calls.push([tableId, fieldId, table, field]); },
    readSchema: async () => ({ complete: true, tables: [...tables].map(([name, value]) => ({ name, ...value })) }),
    verifySchemaAction: async () => true,
  };
  let bootstrapRevisionReads = 0;
  await applyMigration({ phase: "schema", schemaAdapter: adapter, expectedSha256: manifest.sha256, sourceRevision: manifest.source_revision, getSchemaRevision: async () => bootstrapRevisionReads++ === 0 ? manifest.initial_schema_revision : "post-bootstrap" }, manifest);
  assert.deepEqual(calls, [
    ["tbl-account", "fld-default", "账号台账", "账号ID"],
    ["tbl-precreated-1", "fld-primary-1", "选剧池", "剧ID"],
    ["tbl-precreated-2", "fld-primary-2", "采集数据", "Post ID"],
    ["tbl-precreated-3", "fld-primary-3", "发布记录", "发布ID"],
  ]);
  assert.equal(tables.get("账号台账").fields.some((field) => field.name === "账号ID" && field.is_primary), true);
});

test("schema receipt is refused when an unchanged preexisting field drifts in final semantic readback", async () => {
  const baseSchema = completeFixedSchema();
  const manifest = await planMigration({ google: normalizedSource(), captures: [latestCapture()], baseSchema });
  assert.equal(manifest.schema_actions.length, 0);
  assert.equal(manifest.blocked.length, 0);
  const drifted = structuredClone(baseSchema);
  const accountName = drifted.tables.find((table) => table.name === "账号台账").fields.find((field) => field.name === "账号名");
  accountName.type = "number";
  const adapter = {
    createField: async () => { throw new Error("unexpected"); },
    updateField: async () => { throw new Error("unexpected"); }, verifySchemaAction: async () => true,
    readSchema: async () => ({ complete: true, tables: structuredClone(drifted.tables) }),
  };
  let revisionReads = 0;
  await assert.rejects(() => applyMigration({ phase: "schema", schemaAdapter: adapter, expectedSha256: manifest.sha256,
    sourceRevision: manifest.source_revision, getSchemaRevision: async () => revisionReads++ === 0 ? manifest.initial_schema_revision : "post-r1" }, manifest),
  (error) => error.code === "readback_mismatch");
});

test("presentation apply resolves views/dashboard, configures every view, and creates all six dashboard blocks", async () => {
  const manifest = await planMigration({ google: normalizedSource(), captures: [latestCapture()] });
  const calls = [];
  const views = new Map();
  const blocks = [];
  const viewAction = (table, name) => manifest.presentation_actions.find((action) => action.table === table && action.name === name);
  const blockSpec = (name) => manifest.presentation_actions.find((action) => action.kind === "configure_dashboard").blocks.find((block) => block.name === name);
  const adapter = {
    readSchema: async () => ({ complete: true, tables: ["账号台账", "选剧池", "采集数据", "发布记录"].map((name) => ({ name, table_id: `tbl-${name}` })) }),
    listViews: async (tableId) => ({ complete: true, items: views.get(tableId) ?? [] }),
    createView: async (tableId, _table, view) => { const created = { view_id: `view-${view}`, name: view, type: "grid" }; views.set(tableId, [...(views.get(tableId) ?? []), created]); return created; },
    updateView: async (...args) => calls.push(["updateView", ...args]),
    readViewConfiguration: async (_tableId, _viewId, table, name) => { const config = viewAction(table, name).configuration; return { filter: config.filter, sort: config.sort, group: config.group, visible_fields: config.visible_fields }; },
    listDashboards: async () => ({ complete: true, items: [] }),
    createDashboard: async () => ({ dashboard_id: "dash-1" }),
    listDashboardBlocks: async () => ({ complete: true, items: blocks }),
    createDashboardBlock: async (_dashboardId, block) => { const spec = blockSpec(block); const created = { block_id: `block-${block}`, ...structuredClone(spec) }; blocks.push(created); calls.push(["block", block]); return created; },
    readDashboardBlock: async (_dashboardId, blockId) => structuredClone(blocks.find((block) => block.block_id === blockId)),
    updateDashboardBlock: async () => { throw new Error("unexpected dashboard update"); },
  };
  const result = await applyMigration({ phase: "presentation", presentationAdapter: adapter, expectedSha256: manifest.sha256, ...schemaGate(manifest) }, manifest);
  assert.equal(result.presentation_receipt.status, "verified");
  assert.match(result.presentation_receipt.semantic_sha256, /^[a-f0-9]{64}$/);
  assert.equal(calls.filter((call) => call[0] === "updateView").length, 15);
  assert.deepEqual(calls.filter((call) => call[0] === "block").map((call) => call[1]), ["活跃账号数", "待公开数", "待回填数", "按账号最新累计表现", "按剧最新累计表现", "最近一次同步终态"]);
});

test("presentation apply rejects name-only creates missing from complete post-write readback", async () => {
  const manifest = await planMigration({ google: normalizedSource(), captures: [latestCapture()] });
  const adapter = {
    readSchema: async () => ({ complete: true, tables: ["账号台账", "选剧池", "采集数据", "发布记录"].map((name) => ({ name, table_id: `tbl-${name}` })) }),
    listViews: async () => ({ complete: true, items: [] }),
    createView: async () => ({ view_id: "created-but-not-visible" }),
    updateView: async () => {},
    readViewConfiguration: async () => ({}),
    listDashboards: async () => ({ complete: true, items: [] }),
    createDashboard: async () => ({ dashboard_id: "dash" }),
    listDashboardBlocks: async () => ({ complete: true, items: [] }),
    createDashboardBlock: async () => ({ block_id: "block" }),
    readDashboardBlock: async () => ({}),
    updateDashboardBlock: async () => {},
  };
  await assert.rejects(() => applyMigration({ phase: "presentation", presentationAdapter: adapter, expectedSha256: manifest.sha256, ...schemaGate(manifest) }, manifest), (error) => error.code === "readback_mismatch");
});

test("presentation converges stale same-type dashboard config and blocks immutable type drift", async () => {
  const manifest = await planMigration({ google: normalizedSource(), captures: [latestCapture()] });
  const viewActions = manifest.presentation_actions.filter((action) => action.kind === "configure_view");
  const dashboardAction = manifest.presentation_actions.find((action) => action.kind === "configure_dashboard");
  const makeAdapter = (wrongType = false) => {
    const blocks = dashboardAction.blocks.map((spec, index) => ({ block_id: `b${index}`, ...structuredClone(spec) }));
    blocks[0].data_config = { stale: true };
    if (wrongType) blocks[0].type = "column";
    let updates = 0;
    return {
      get updates() { return updates; },
      readSchema: async () => ({ complete: true, tables: ["账号台账", "选剧池", "采集数据", "发布记录"].map((name) => ({ name, table_id: `tbl-${name}` })) }),
      listViews: async (_tableId, table) => ({ complete: true, items: viewActions.filter((action) => action.table === table).map((action) => ({ view_id: action.id, name: action.name, type: "grid" })) }),
      createView: async () => { throw new Error("unexpected"); }, updateView: async () => {},
      readViewConfiguration: async (_tableId, _viewId, table, name) => { const config = viewActions.find((action) => action.table === table && action.name === name).configuration; return { filter: config.filter, sort: config.sort, group: config.group, visible_fields: config.visible_fields }; },
      listDashboards: async () => ({ complete: true, items: [{ dashboard_id: "dash", name: dashboardAction.name }] }),
      createDashboard: async () => { throw new Error("unexpected"); },
      listDashboardBlocks: async () => ({ complete: true, items: blocks }),
      createDashboardBlock: async () => { throw new Error("unexpected"); },
      readDashboardBlock: async (_dashboardId, blockId) => structuredClone(blocks.find((block) => block.block_id === blockId)),
      updateDashboardBlock: async (_dashboardId, blockId, name) => { const at = blocks.findIndex((block) => block.block_id === blockId); blocks[at] = { block_id: blockId, ...structuredClone(dashboardAction.blocks.find((block) => block.name === name)) }; updates += 1; },
    };
  };
  const converging = makeAdapter();
  await applyMigration({ phase: "presentation", presentationAdapter: converging, expectedSha256: manifest.sha256, ...schemaGate(manifest) }, manifest);
  assert.equal(converging.updates, 1);
  const wrongType = makeAdapter(true);
  await assert.rejects(() => applyMigration({ phase: "presentation", presentationAdapter: wrongType, expectedSha256: manifest.sha256, ...schemaGate(manifest) }, manifest), (error) => error.code === "base_schema_drift");
  assert.equal(wrongType.updates, 0);

  const wrongViewType = makeAdapter();
  const originalListViews = wrongViewType.listViews;
  wrongViewType.listViews = async (tableId, table) => {
    const listed = await originalListViews(tableId, table);
    if (table === "账号台账") listed.items[0].type = "calendar";
    return listed;
  };
  await assert.rejects(() => applyMigration({ phase: "presentation", presentationAdapter: wrongViewType, expectedSha256: manifest.sha256, ...schemaGate(manifest) }, manifest), (error) => error.code === "base_schema_drift");
});

test("verify checks exact sets, every writable value, relation IDs, extras and null versus zero", async () => {
  const manifest = await planMigration({ google: normalizedSource(), captures: [latestCapture()] });
  const repos = memoryRepos();
  await applyMigration({ repos, expectedSha256: manifest.sha256, ...schemaGate(manifest) }, manifest);
  const report = await verifyMigration({ repos }, manifest);
  assert.equal(report.status, "verified");
  assert.equal(report.manifest_sha256, manifest.sha256);
  assert.equal(report.sha256, verificationDigest(report));

  repos.captures.rows.get("99").fields.评论 = 0;
  await assert.rejects(() => verifyMigration({ repos }, manifest), (error) => error.code === "readback_mismatch");
  repos.captures.rows.get("99").fields.评论 = null;
  repos.releases.rows.get("SR-000001").fields.账号 = [{ id: "wrong" }];
  await assert.rejects(() => verifyMigration({ repos }, manifest), (error) => error.code === "readback_mismatch");
  repos.releases.rows.get("SR-000001").fields.账号 = [{ id: "rec-accounts-dramaexpedition" }];
  repos.accounts.rows.set("extra", { record_id: "rec-extra", fields: { 账号ID: "extra" } });
  await assert.rejects(() => verifyMigration({ repos }, manifest), (error) => error.code === "readback_mismatch");
});

test("data apply materializes every writable field and verification rejects stale values omitted by the Google row", async () => {
  const manifest = await planMigration({ google: normalizedSource(), captures: [latestCapture()] });
  const repos = memoryRepos();
  repos.accounts.rows.set("dramaexpedition", { record_id: "rec-accounts-dramaexpedition", fields: { 账号ID: "dramaexpedition", 指标同步时间: "stale", 同步状态: "failed" } });
  await applyMigration({ repos, expectedSha256: manifest.sha256, ...schemaGate(manifest) }, manifest);
  const patch = repos.calls[0][2][0].patch;
  assert.deepEqual(Object.keys(patch).sort(), ["主页链接", "账号名", "所属组", "定位垂类", "表现形式", "状态", "数据日期", "指标同步时间", "粉丝数", "同步状态"].sort());
  assert.equal(patch.指标同步时间, null);
  assert.equal(repos.accounts.rows.get("dramaexpedition").fields.指标同步时间, null);
  delete repos.accounts.rows.get("dramaexpedition").fields.同步状态;
  await assert.rejects(() => verifyMigration({ repos }, manifest), (error) => error.code === "readback_mismatch");
});

test("sequence phase requires a self-consistent same-manifest verification and seeds monotonically in order", async () => {
  const manifest = await planMigration({ google: normalizedSource(), captures: [latestCapture()] });
  const seeds = [];
  await assert.rejects(() => applyMigration({
    phase: "sequences", expectedSha256: manifest.sha256, ...schemaGate(manifest),
    seedSequence: (...args) => seeds.push(args),
  }, manifest), (error) => error.code === "migration_verification_required");
  const repos = memoryRepos();
  await applyMigration({ repos, expectedSha256: manifest.sha256, ...schemaGate(manifest) }, manifest);
  const verification = await verifyMigration({ repos, now: () => "2026-09-01T11:00:00Z" }, manifest);
  await applyMigration({
    phase: "sequences", expectedSha256: manifest.sha256, ...schemaGate(manifest),
    verification, expectedVerificationSha256: verification.sha256,
    seedSequence: async (...args) => seeds.push(args),
  }, manifest);
  assert.deepEqual(seeds, [["drama", 1], ["release", 1]]);
  const bad = structuredClone(verification); bad.counts.accounts = 9;
  await assert.rejects(() => applyMigration({
    phase: "sequences", expectedSha256: manifest.sha256, ...schemaGate(manifest),
    verification: bad, expectedVerificationSha256: verification.sha256,
    seedSequence: async () => {},
  }, manifest), (error) => error.code === "migration_verification_required");
});

test("artifact writer is exclusive, fixed-root and verifies readback without accepting paths", async () => {
  const manifest = await planMigration({ google: normalizedSource(), captures: [latestCapture()] });
  const name = `test-${process.pid}-${Date.now()}.json`;
  const written = await writeMigrationArtifact(manifest, { fileName: name });
  assert.equal(written.path.endsWith(`/output/short-drama-release-manager/migrations/${name}`), true);
  assert.equal(JSON.parse(await readFile(written.path, "utf8")).sha256, manifest.sha256);
  assert.equal(JSON.parse(await readFile(written.path, "utf8")).source_backup.grid.accounts[0].values[0].effectiveFormat.numberFormat.pattern, "@");
  assert.equal((await stat(dirname(written.path))).mode & 0o777, 0o700);
  await assert.rejects(() => writeMigrationArtifact(manifest, { fileName: name }), (error) => error.code === "migration_artifact_exists");
  await assert.rejects(() => writeMigrationArtifact(manifest, { fileName: "../escape.json" }), (error) => error.code === "migration_artifact_invalid");
  await rm(written.path);

  const migrations = resolve(dirname(fileURLToPath(import.meta.url)), "../../../output/short-drama-release-manager/migrations");
  await mkdir(migrations, { recursive: true });
  const targetName = `symlink-target-${process.pid}.json`;
  const outside = resolve(dirname(migrations), `outside-${process.pid}.json`);
  await symlink(outside, resolve(migrations, targetName));
  await assert.rejects(() => writeMigrationArtifact(manifest, { fileName: targetName }), (error) => error.code === "migration_artifact_invalid");
  await rm(resolve(migrations, targetName));

  const saved = `${migrations}.saved-${process.pid}`;
  const escape = resolve(dirname(migrations), `escape-${process.pid}`);
  await mkdir(escape, { recursive: true });
  await rename(migrations, saved);
  await symlink(escape, migrations, "dir");
  try {
    await assert.rejects(() => writeMigrationArtifact(manifest, { fileName: `parent-${process.pid}.json` }), (error) => error.code === "migration_artifact_invalid");
  } finally {
    await rm(migrations);
    await rename(saved, migrations);
    await rm(escape, { recursive: true });
    await rm(outside, { force: true });
  }
});

test("invalid artifact content releases its exclusive reservation", async () => {
  const name = `invalid-content-${process.pid}-${Date.now()}.json`;
  const cyclic = {};
  cyclic.self = cyclic;
  await assert.rejects(
    () => writeMigrationArtifact(cyclic, { fileName: name }),
    (error) => error.code === "migration_manifest_invalid",
  );
  const written = await writeMigrationArtifact({ status: "safe" }, { fileName: name });
  assert.deepEqual(JSON.parse(await readFile(written.path, "utf8")), { status: "safe" });
  await rm(written.path, { force: true });
});
