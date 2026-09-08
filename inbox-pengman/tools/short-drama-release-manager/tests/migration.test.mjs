import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, rename, rm, stat, symlink } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { isDeepStrictEqual } from "node:util";

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
  googleSnapshotIsNewer,
  migrationSourceRevision,
  permissionAttestationDigest,
  planMigration as planMigrationRaw,
  schemaReceiptDigest,
  sourceMergeStrategy,
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

test("a newer Google capture snapshot wins over a stale SQLite row and warns", async () => {
  const google = sourceWithCaptures([googleCapture({ 快照日期: "2026-09-07", 播放量: 1000, 评论: 9 })]);
  const manifest = await planMigration({
    google,
    sqliteAccounts: [latestAccount()],
    sqlitePosts: [latestCapture({ snapshot_date: "2026-09-04", views: 20, comments: 3, missing_fields: [], collection_status: "complete" })],
  });
  assert.equal(manifest.captures[0].播放量, 1000);
  assert.equal(manifest.captures[0].评论, 9);
  assert.equal(manifest.captures[0].快照日期, "2026-09-07");
  assert.deepEqual(manifest.reconciliation.capture_merges, [{
    post_id: "99",
    primary_source: "google",
    fallback_fields: [],
  }]);
  assert.equal(manifest.warnings.some((row) =>
    row.code === "stale_sqlite_snapshot" && row.post_id === "99" &&
    row.primary_snapshot_date === "2026-09-07" && row.stale_snapshot_date === "2026-09-04"), true);
});

test("a newer Google capture still falls back to SQLite for metrics it lacks", async () => {
  const google = sourceWithCaptures([googleCapture({ 快照日期: "2026-09-07", 播放量: 1000, 评论: null })]);
  const manifest = await planMigration({
    google,
    sqliteAccounts: [latestAccount()],
    sqlitePosts: [latestCapture({ snapshot_date: "2026-09-04", views: 20, comments: 3, missing_fields: [], collection_status: "complete" })],
  });
  assert.equal(manifest.captures[0].播放量, 1000);
  assert.equal(manifest.captures[0].评论, 3);
  assert.deepEqual(manifest.reconciliation.capture_merges, [{
    post_id: "99",
    primary_source: "google",
    fallback_fields: ["评论"],
  }]);
});

test("a newer Google capture keeps the collection timestamps only SQLite knows", async () => {
  const google = sourceWithCaptures([googleCapture({ 快照日期: "2026-09-07", 播放量: 1000 })]);
  const manifest = await planMigration({
    google,
    sqliteAccounts: [latestAccount()],
    sqlitePosts: [latestCapture({
      snapshot_date: "2026-09-04",
      captured_at: "2026-09-04T01:02:03Z",
      published_at: "2026-08-20T00:00:00Z",
      comments: 3, missing_fields: [], collection_status: "complete",
    })],
  });
  assert.equal(manifest.captures[0].播放量, 1000);
  assert.equal(manifest.captures[0].采集时间, "2026-09-04T01:02:03Z");
  assert.equal(manifest.captures[0].发布时间, "2026-08-20T00:00:00Z");
});

test("source policies map to exactly one reconciliation strategy each", () => {
  assert.equal(sourceMergeStrategy("shortdrama-source-reconciliation/v1"), "sqlite-primary");
  assert.equal(sourceMergeStrategy("shortdrama-source-reconciliation/v2"), "snapshot-date");
  for (const unknown of ["shortdrama-source-reconciliation/v3", "v1", "", null, undefined, 1, {}]) {
    assert.equal(sourceMergeStrategy(unknown), null, `policy ${JSON.stringify(unknown)}`);
  }
});

test("a manifest replays under the source policy it declares, not the current code version", async () => {
  // No date disagreement, so v1 and v2 reconcile identically: only the declared policy differs.
  const manifest = await planMigration({
    google: sourceWithCaptures([googleCapture({ 快照日期: "2026-08-24" })]),
    sqliteAccounts: [latestAccount()],
    sqlitePosts: [latestCapture({ snapshot_date: "2026-08-24" })],
  });
  assert.equal(manifest.source_evidence.policy, "shortdrama-source-reconciliation/v2");
  const legacy = structuredClone(manifest);
  legacy.source_evidence.policy = "shortdrama-source-reconciliation/v1";
  legacy.sha256 = manifestDigest(legacy);
  // assertManifest runs before any Base access, so an empty context proves it passed.
  await assert.rejects(() => verifyMigrationRaw({}, legacy), (error) => { console.log("LEGACY ERR", error.code, error.message, JSON.stringify(error.details)); return error.code === "base_target_mismatch"; });
});

test("a declared policy that contradicts the manifest rows is rejected", async () => {
  const manifest = await planMigration({
    google: sourceWithCaptures([googleCapture({ 快照日期: "2026-09-07", 播放量: 1000 })]),
    sqliteAccounts: [latestAccount()],
    sqlitePosts: [latestCapture({ snapshot_date: "2026-09-04", views: 20, comments: 3, missing_fields: [], collection_status: "complete" })],
  });
  assert.equal(manifest.captures[0].播放量, 1000);
  const forged = structuredClone(manifest);
  forged.source_evidence.policy = "shortdrama-source-reconciliation/v1";
  forged.sha256 = manifestDigest(forged);
  await assert.rejects(() => verifyMigrationRaw({}, forged), (error) => error.code === "migration_manifest_invalid");
});

test("googleSnapshotIsNewer swaps sources only for two well-formed dates", () => {
  assert.equal(googleSnapshotIsNewer("2026-09-07", "2026-09-04"), true);
  assert.equal(googleSnapshotIsNewer("2027-01-01", "2026-12-31"), true);
  assert.equal(googleSnapshotIsNewer("2026-09-04", "2026-09-04"), false);
  assert.equal(googleSnapshotIsNewer("2026-09-01", "2026-09-04"), false);
  // Upstream Google normalization already rejects these shapes; the guard is defence in
  // depth so a future source path cannot open the gate with a lexicographic accident.
  // "2026/09/07" > "2026-09-04" and "2026-9-7" > "2026-12-31" both compare true as strings.
  for (const malformed of ["2026/09/07", "2026-9-7", "20260907", "2026-09-07T00:00:00Z", "", " 2026-09-07", null, undefined, 20260907, ["2026-09-07"]]) {
    assert.equal(googleSnapshotIsNewer(malformed, "2026-09-04"), false, `google ${JSON.stringify(malformed)}`);
    assert.equal(googleSnapshotIsNewer("2026-09-07", malformed), false, `sqlite ${JSON.stringify(malformed)}`);
  }
});

test("a Google capture without a snapshot date cannot unseat SQLite as the primary source", async () => {
  for (const snapshot of [null]) {
    const google = sourceWithCaptures([googleCapture({ 快照日期: snapshot, 播放量: 1000 })]);
    const manifest = await planMigration({
      google,
      sqliteAccounts: [latestAccount()],
      sqlitePosts: [latestCapture({ snapshot_date: "2026-09-04", views: 20, comments: 3, missing_fields: [], collection_status: "complete" })],
    });
    assert.equal(manifest.captures[0].播放量, 20, `snapshot ${JSON.stringify(snapshot)}`);
    assert.equal(manifest.reconciliation.capture_merges[0].primary_source, "sqlite");
    assert.equal(manifest.warnings.some((row) => row.code === "stale_sqlite_snapshot"), false);
  }
});

test("an equal or newer SQLite capture snapshot stays primary and raises no staleness warning", async () => {
  for (const snapshot of ["2026-09-07", "2026-09-09"]) {
    const google = sourceWithCaptures([googleCapture({ 快照日期: "2026-09-07", 播放量: 1000 })]);
    const manifest = await planMigration({
      google,
      sqliteAccounts: [latestAccount()],
      sqlitePosts: [latestCapture({ snapshot_date: snapshot, views: 20, comments: 3, missing_fields: [], collection_status: "complete" })],
    });
    assert.equal(manifest.captures[0].播放量, 20);
    assert.equal(manifest.reconciliation.capture_merges[0].primary_source, "sqlite");
    assert.equal(manifest.warnings.some((row) => row.code === "stale_sqlite_snapshot"), false);
  }
});

test("a newer Google account snapshot is not overwritten by a stale SQLite account", async () => {
  const base = normalizedSource();
  const google = sourceWithTables({
    accounts: [{ ...base.accounts[0], 粉丝数: 999, 数据日期: "2026-09-07" }],
  });
  const manifest = await planMigration({
    google,
    sqliteAccounts: [latestAccount({ snapshot_date: "2026-09-04", followers: 100 })],
    sqlitePosts: [],
  });
  const account = manifest.accounts.find((row) => row.账号ID === "dramaexpedition");
  assert.equal(account.粉丝数, 999);
  assert.equal(account.数据日期, "2026-09-07");
  assert.equal(manifest.warnings.some((row) =>
    row.code === "stale_sqlite_snapshot" && row.account_id === "dramaexpedition" &&
    row.primary_snapshot_date === "2026-09-07" && row.stale_snapshot_date === "2026-09-04"), true);
});

test("a newer SQLite account snapshot still overwrites the Google ledger row", async () => {
  const base = normalizedSource();
  const google = sourceWithTables({
    accounts: [{ ...base.accounts[0], 粉丝数: 999, 数据日期: "2026-09-01" }],
  });
  const manifest = await planMigration({
    google,
    sqliteAccounts: [latestAccount({ snapshot_date: "2026-09-04", followers: 100 })],
    sqlitePosts: [],
  });
  const account = manifest.accounts.find((row) => row.账号ID === "dramaexpedition");
  assert.equal(account.粉丝数, 100);
  assert.equal(account.数据日期, "2026-09-04");
  assert.equal(account.同步状态, "success");
  assert.equal(manifest.warnings.some((row) => row.code === "stale_sqlite_snapshot"), false);
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

test("MoboReels maps to 其他 per source row and preserves signed source evidence", async () => {
  const original = normalizedSource().dramas[0];
  const google = sourceWithDramas([
    { ...original, source_row: 2, 剧名: "Legacy Platform Drama", 平台: "MoboReels" },
    { ...original, source_row: 3, 剧名: " legacy platform drama ", 平台: "MoboReels" },
    { ...original, source_row: 4, 剧名: "LEGACY PLATFORM DRAMA", 平台: "其他" },
  ]);
  const manifest = await planMigration({
    google,
    sqliteAccounts: [latestAccount()],
    sqlitePosts: [latestCapture()],
  });

  assert.equal(manifest.blocked.some((row) => row.code === "drama_merge_conflict" && row.field === "平台"), false);
  assert.deepEqual(manifest.dramas.map((row) => row.平台), ["其他"]);
  assert.deepEqual(manifest.warnings.filter((row) => row.code === "platform_mapped_to_other").map((row) => ({
    drama_id: row.drama_id,
    source_row: row.source_row,
    source_value: row.source_value,
    target_value: row.target_value,
    table: row.table,
  })), [
    { drama_id: "SD-000001", source_row: 2, source_value: "MoboReels", target_value: "其他", table: "选剧池" },
    { drama_id: "SD-000001", source_row: 3, source_value: "MoboReels", target_value: "其他", table: "选剧池" },
  ]);
  assert.equal(JSON.stringify(manifest.source_backup).includes("MoboReels"), true);
});

test("an unknown nonblank drama platform blocks instead of widening the fixed enum", async () => {
  const google = sourceWithDramas([
    { ...normalizedSource().dramas[0], 平台: "UnknownPlatform" },
  ]);
  const manifest = await planMigration({
    google,
    sqliteAccounts: [latestAccount()],
    sqlitePosts: [latestCapture()],
  });

  assert.equal(manifest.blocked.some((row) =>
    row.code === "platform_not_allowed" && row.table === "选剧池" && row.source_value === "UnknownPlatform"), true);
  assert.deepEqual(BASE_FIELD_SPECS["选剧池"].find((field) => field.name === "平台").options,
    ["ReelShort", "DramaBox", "ShortMax", "TopShort", "其他"]);
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

test("plan canonicalizes Base table and field transport order without reordering Select options", async () => {
  const baseSchema = completeFixedSchema("transport-order-r1");
  const reordered = structuredClone(baseSchema);
  reordered.tables.reverse();
  for (const table of reordered.tables) table.fields.reverse();
  const context = {
    google: normalizedSource(),
    captures: [latestCapture()],
    now: () => "2026-09-01T10:00:00Z",
  };

  const first = await planMigration({ ...context, baseSchema });
  const second = await planMigration({ ...context, baseSchema: reordered });

  assert.equal(second.sha256, first.sha256);
  assert.deepEqual(second.initial_base_schema, first.initial_base_schema);
  assert.deepEqual(second.schema_actions, first.schema_actions);

  const optionReordered = structuredClone(reordered);
  optionReordered.tables.find((table) => table.name === "选剧池").fields
    .find((field) => field.name === "平台").options.reverse();
  const optionChanged = await planMigration({ ...context, baseSchema: optionReordered });

  assert.notDeepEqual(optionChanged.initial_base_schema, first.initial_base_schema);
  assert.notEqual(optionChanged.sha256, first.sha256);
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

test("replay rejects re-digested legacy platform business, warning, and source-backup tampering", async () => {
  const original = normalizedSource().dramas[0];
  const manifest = await planMigration({
    google: sourceWithDramas([
      { ...original, 剧名: "Legacy Replay Drama", 平台: "MoboReels" },
      { ...original, 剧名: "legacy replay drama", 平台: "其他" },
    ]),
    sqliteAccounts: [latestAccount()],
    sqlitePosts: [latestCapture()],
  });
  const warning = manifest.warnings.find((row) => row.code === "platform_mapped_to_other");
  assert.ok(warning);

  for (const mutate of [
    (value) => { value.dramas.find((row) => row.剧ID === warning.drama_id).平台 = "ReelShort"; },
    (value) => { value.warnings.find((row) => row.code === "platform_mapped_to_other").target_value = "ReelShort"; },
    (value) => { value.source_backup.unformatted.dramas[1][11] = "其他"; },
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

test("re-digested manifests cannot remove replayed source, drama, release, or schema blockers", async () => {
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

  const releaseBase = normalizedSource();
  const releaseConflictGoogle = sourceWithTables({
    releases: [{
      ...releaseBase.releases[0],
      视频链接: "https://www.tiktok.com/@dramaexpedition/video/99",
      "Post ID": "100",
    }],
  });
  const releaseConflict = await planMigration({
    google: releaseConflictGoogle,
    sqliteAccounts: [latestAccount()],
    sqlitePosts: [latestCapture()],
  });
  assert.equal(releaseConflict.blocked.some((row) => row.code === "manual_identifier_conflict"), true);

  const driftSchema = emptyPrecreatedSchema("drifted-schema");
  driftSchema.tables[0].fields = [{ field_id: "wrong-primary", name: "账号ID", type: "number", is_primary: true }];
  const schemaConflict = await planMigration({
    google: normalizedSource(),
    sqliteAccounts: [latestAccount()],
    sqlitePosts: [latestCapture()],
    baseSchema: driftSchema,
  });
  assert.equal(schemaConflict.blocked.some((row) => row.code === "base_schema_drift"), true);

  for (const manifest of [captureConflict, dramaConflict, releaseConflict, schemaConflict]) {
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

function completeFixedSchema(revision = "complete-r1", optionNamesByField = {}) {
  const tableIds = Object.fromEntries(TABLE_ORDER.map((table, index) => [table, `tbl-${index}`]));
  return {
    revision,
    tables: TABLE_ORDER.map((table) => ({
      name: table,
      table_id: tableIds[table],
      record_count: 0,
      fields: BASE_FIELD_SPECS[table].map((spec, index) => ({
        field_id: `${tableIds[table]}-f${index}`,
        ...fixedFieldDescriptor(
          table,
          spec.name,
          spec.kind === "link" ? { targetTableId: tableIds[spec.targetTable] } : {},
          spec.optionPolicy === "manifest_append" ? { initialOptions: optionNamesByField[`${table}:${spec.name}`] ?? [] } : {},
        ),
        ...(spec.primary ? { is_primary: true } : {}),
      })),
    })),
  };
}

function canonicalDigestValue(value) {
  if (Array.isArray(value)) return value.map(canonicalDigestValue);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalDigestValue(value[key])]));
  }
  return value;
}

function fixedSchemaDescriptorForDigest(table, spec, { initialOptions } = {}) {
  const descriptor = { name: spec.name, kind: spec.kind, phase: spec.phase };
  for (const key of ["primary", "targetTable", "bidirectional", "reverseField", "managedReverseOf", "linkField", "sourceField", "expression", "systemType", "optionPolicy"]) {
    if (spec[key] !== undefined) descriptor[key] = structuredClone(spec[key]);
  }
  const bindings = spec.kind === "link" ? { targetTableId: `table:${spec.targetTable}` } : {};
  descriptor.canonical = fixedFieldDescriptor(table, spec.name, bindings,
    initialOptions === undefined ? {} : { initialOptions });
  return canonicalDigestValue(descriptor);
}

function schemaSpecDigest(actions) {
  const contract = Object.fromEntries(TABLE_ORDER.map((table) => [
    table,
    BASE_FIELD_SPECS[table].map((spec) => fixedSchemaDescriptorForDigest(table, spec)),
  ]));
  return createHash("sha256")
    .update(JSON.stringify(canonicalDigestValue({ actions, contract })))
    .digest("hex");
}

function redigestSchemaManifest(manifest) {
  manifest.schema_spec_sha256 = schemaSpecDigest(manifest.schema_actions);
  manifest.sha256 = manifestDigest(manifest);
  return manifest;
}

function sourceOptionNames(rows, spec) {
  const names = [];
  for (const row of rows) {
    const raw = row[spec.name];
    const values = spec.kind === "multi_select" ? raw ?? [] : raw === null || raw === undefined ? [] : [raw];
    for (const name of values) if (typeof name === "string" && name !== "" && !names.includes(name)) names.push(name);
  }
  return names;
}

function completeSchemaWithSourceOptions(google) {
  const optionNames = {};
  for (const table of TABLE_ORDER) {
    const rows = table === "账号台账" ? google.accounts : table === "选剧池" ? google.dramas : [];
    for (const spec of BASE_FIELD_SPECS[table]) {
      if (spec.optionPolicy === "manifest_append") optionNames[`${table}:${spec.name}`] = sourceOptionNames(rows, spec);
    }
  }
  return completeFixedSchema("complete-source-options", optionNames);
}

function completeDataSchema(manifest, revision = "post-schema-r1") {
  const rowsByTable = {
    "账号台账": manifest.accounts,
    "选剧池": manifest.dramas,
    "采集数据": manifest.captures,
    "发布记录": manifest.releases,
  };
  const optionNames = {};
  for (const table of TABLE_ORDER) {
    for (const spec of BASE_FIELD_SPECS[table]) {
      if (spec.optionPolicy === "manifest_append") {
        optionNames[`${table}:${spec.name}`] = sourceOptionNames(rowsByTable[table], spec);
      }
    }
  }
  return { complete: true, ...completeFixedSchema(revision, optionNames) };
}

function optionApplyScenario({ actionCount = 1 } = {}) {
  const current = normalizedSource();
  const google = sourceWithTables({
    dramas: [{
      ...current.dramas[0],
      剧分类: ["Romance", "Revenge"],
      语言: "English",
    }],
  });
  const baseSchema = completeSchemaWithSourceOptions(google);
  const drama = baseSchema.tables.find((table) => table.name === "选剧池");
  drama.fields.find((field) => field.name === "剧分类").options = [
    { id: "opt-legacy", name: "Legacy", color: 1 },
    { id: "opt-romance", name: "Romance", color: 2 },
  ];
  if (actionCount > 1) drama.fields.find((field) => field.name === "语言").options = [];
  const liveSchema = structuredClone(baseSchema);
  return { google, baseSchema, liveSchema };
}

function optionField(schema, action) {
  return schema.tables.find((table) => table.name === action.table)?.fields
    .find((field) => field.field_id === action.field_id && field.name === action.field);
}

function optionActionAdapter(liveSchema, { update, verify } = {}) {
  const calls = { reads: 0, updates: [], verifies: 0 };
  const adapter = {
    createField: async () => { throw new Error("unexpected create"); },
    updateField: async () => { throw new Error("unexpected primary update"); },
    readSchema: async () => {
      calls.reads += 1;
      return { complete: true, revision: liveSchema.revision, tables: structuredClone(liveSchema.tables) };
    },
    updateSelectFieldOptions: async (tableId, fieldId, tableName, fieldName, optionNames) => {
      calls.updates.push([tableId, fieldId, tableName, fieldName, structuredClone(optionNames)]);
      const action = { table: tableName, field: fieldName, field_id: fieldId };
      const field = optionField(liveSchema, action);
      if (typeof update === "function") return update({ action, field, optionNames: [...optionNames], liveSchema, calls });
      field.options = optionNames.map((name, index) => ({ id: `new-${index}`, name, color: index }));
      liveSchema.revision = `live-options-r${calls.updates.length}`;
    },
    verifySchemaAction: async (action, schema) => {
      calls.verifies += 1;
      if (typeof verify === "function") return verify(action, schema);
      const field = optionField(schema, action);
      const spec = BASE_FIELD_SPECS[action.table].find((candidate) => candidate.name === action.field);
      return field?.type === "select" && field.multiple === (spec.kind === "multi_select") &&
        isDeepStrictEqual(field.options?.map((option) => option.name), action.after_options);
    },
  };
  return { adapter, calls };
}

test("manifest-append planning emits exactly six current nonempty option actions in first-seen order", async () => {
  const google = sourceWithTables({
    accounts: [{ ...normalizedSource().accounts[0], 所属组: "North", 表现形式: "Narrated" }],
    dramas: [{
      ...normalizedSource().dramas[0],
      剧分类: ["Romance", "Revenge"],
      生命周期: "Fresh",
      "RS Boost 分类（待确认）": [],
      账号组: [],
      语言: "English",
      来源: ["Editorial", "Trend"],
    }],
  });
  const manifest = await planMigration({ google, captures: [latestCapture()], baseSchema: completeFixedSchema() });
  const actions = manifest.schema_actions.filter((action) => action.kind === "update_select_options");
  assert.deepEqual(actions.map((action) => action.id), [
    "options:账号台账:所属组",
    "options:账号台账:表现形式",
    "options:选剧池:剧分类",
    "options:选剧池:生命周期",
    "options:选剧池:语言",
    "options:选剧池:来源",
  ]);
  assert.deepEqual(actions.map((action) => action.after_options), [
    ["North"], ["Narrated"], ["Romance", "Revenge"], ["Fresh"], ["English"], ["Editorial", "Trend"],
  ]);
});

test("manifest-append planning preserves live options and replans only remaining gaps", async () => {
  const google = sourceWithTables({
    accounts: [{ ...normalizedSource().accounts[0], 所属组: "North", 表现形式: "Narrated" }],
    dramas: [{
      ...normalizedSource().dramas[0],
      剧分类: ["Romance", "Revenge"],
      生命周期: "Fresh",
      "RS Boost 分类（待确认）": [],
      账号组: [],
      语言: "English",
      来源: ["Editorial", "Trend"],
    }],
  });
  const baseSchema = completeFixedSchema("complete-r2", {
    "账号台账:所属组": ["Existing", "North"],
    "选剧池:剧分类": ["Legacy", "Romance"],
    "选剧池:来源": ["Editorial"],
  });
  const manifest = await planMigration({ google, captures: [latestCapture()], baseSchema });
  const actions = manifest.schema_actions.filter((action) => action.kind === "update_select_options");
  assert.deepEqual(actions.map((action) => [action.id, action.before_options, action.after_options]), [
    ["options:账号台账:表现形式", [], ["Narrated"]],
    ["options:选剧池:剧分类", ["Legacy", "Romance"], ["Legacy", "Romance", "Revenge"]],
    ["options:选剧池:生命周期", [], ["Fresh"]],
    ["options:选剧池:语言", [], ["English"]],
    ["options:选剧池:来源", ["Editorial"], ["Editorial", "Trend"]],
  ]);
  for (const action of actions) {
    const table = baseSchema.tables.find((item) => item.name === action.table);
    const field = table.fields.find((item) => item.field_id === action.field_id);
    field.options = action.after_options.map((name) => ({ name }));
  }
  const replanned = await planMigration({ google, captures: [latestCapture()], baseSchema });
  assert.equal(replanned.schema_actions.filter((action) => action.kind === "update_select_options").length, 0);
});

test("missing manifest-append fields carry source-derived options in create_field actions", async () => {
  const google = sourceWithTables({
    dramas: [{
      ...normalizedSource().dramas[0],
      剧分类: ["Romance", "Revenge"],
      "RS Boost 分类（待确认）": [],
      账号组: [],
    }],
  });
  const baseSchema = completeFixedSchema();
  const dramaTable = baseSchema.tables.find((table) => table.name === "选剧池");
  dramaTable.fields = dramaTable.fields.filter((field) => !["剧分类", "RS Boost 分类（待确认）", "账号组"].includes(field.name));
  const manifest = await planMigration({ google, captures: [latestCapture()], baseSchema });
  const created = new Map(manifest.schema_actions
    .filter((action) => action.kind === "create_field")
    .map((action) => [action.field, action]));
  assert.deepEqual(created.get("剧分类").spec.canonical.options, [{ name: "Romance" }, { name: "Revenge" }]);
  assert.deepEqual(created.get("RS Boost 分类（待确认）").spec.canonical.options, []);
  assert.deepEqual(created.get("账号组").spec.canonical.options, []);
});

test("re-digested manifests cannot forge option transitions or platform mapping evidence", async () => {
  const originalDrama = normalizedSource().dramas[0];
  const google = sourceWithDramas([{
    ...originalDrama,
    平台: "MoboReels",
    剧分类: ["Romance", "Revenge"],
    生命周期: "Fresh",
    语言: "English",
    来源: ["Editorial", "Trend"],
  }]);
  const manifest = await planMigration({ google, captures: [latestCapture()], baseSchema: completeFixedSchema() });
  const optionAction = manifest.schema_actions.find((action) => action.kind === "update_select_options");
  assert.ok(optionAction);
  await assert.doesNotReject(() => applyMigration({
    repos: memoryRepos(), expectedSha256: manifest.sha256, ...schemaGate(manifest),
  }, manifest));

  const mutations = [
    (value) => { value.schema_actions.find((action) => action.kind === "update_select_options").field_id = "forged-field"; },
    (value) => { value.schema_actions.find((action) => action.kind === "update_select_options").before_options = ["Forged"]; },
    (value) => { value.schema_actions.find((action) => action.kind === "update_select_options").after_options.push("Forged"); },
    (value) => { value.schema_actions.reverse(); },
    (value) => { value.schema_actions.find((action) => action.kind === "update_select_options").id = "options:forged"; },
    (value) => { value.schema_actions.find((action) => action.kind === "update_select_options").kind = "create_field"; },
    (value) => { value.schema_actions.find((action) => action.kind === "update_select_options").phase = "link"; },
    (value) => { value.schema_actions.find((action) => action.kind === "update_select_options").spec.canonical.type = "number"; },
    (value) => { value.warnings.find((warning) => warning.code === "platform_mapped_to_other").target_value = "ReelShort"; },
  ];
  for (const mutate of mutations) {
    const forged = structuredClone(manifest);
    mutate(forged);
    redigestSchemaManifest(forged);
    await assert.rejects(
      () => applyMigration({ repos: memoryRepos(), expectedSha256: forged.sha256, ...schemaGate(forged) }, forged),
      (error) => error.code === "migration_manifest_invalid",
    );
  }
});

test("re-digested manifests cannot forge manifest-append create options", async () => {
  const originalDrama = normalizedSource().dramas[0];
  const google = sourceWithDramas([{
    ...originalDrama,
    剧分类: ["Romance", "Revenge"],
    "RS Boost 分类（待确认）": [],
    账号组: [],
  }]);
  const baseSchema = completeSchemaWithSourceOptions(google);
  const dramaTable = baseSchema.tables.find((table) => table.name === "选剧池");
  dramaTable.fields = dramaTable.fields.filter((field) => field.name !== "剧分类");
  const manifest = await planMigration({ google, captures: [latestCapture()], baseSchema });
  const createAction = manifest.schema_actions.find((action) => action.id === "field:选剧池:剧分类");
  assert.ok(createAction);
  assert.equal(manifest.schema_actions.some((action) => action.kind === "update_select_options"), false);
  await assert.doesNotReject(() => applyMigration({
    repos: memoryRepos(), expectedSha256: manifest.sha256, ...schemaGate(manifest),
  }, manifest));

  const mutations = [
    (value) => { value.schema_actions.find((action) => action.id === "field:选剧池:剧分类").spec.canonical.options.push({ name: "Forged" }); },
    (value) => { value.schema_actions.find((action) => action.id === "field:选剧池:剧分类").spec.canonical.options.pop(); },
    (value) => { value.schema_actions.find((action) => action.id === "field:选剧池:剧分类").spec.canonical.options[0] = { name: "Forged" }; },
    (value) => { value.schema_actions.find((action) => action.id === "field:选剧池:剧分类").spec.canonical.options.reverse(); },
    (value) => {
      const create = value.schema_actions.find((action) => action.id === "field:选剧池:剧分类");
      value.schema_actions.push({
        id: "options:选剧池:剧分类",
        kind: "update_select_options",
        table: create.table,
        field: create.field,
        field_id: "forged-field",
        phase: "storage",
        before_options: [],
        after_options: create.spec.canonical.options.map((option) => option.name),
        spec: fixedSchemaDescriptorForDigest(create.table, BASE_FIELD_SPECS[create.table].find((spec) => spec.name === create.field)),
      });
    },
  ];
  for (const mutate of mutations) {
    const forged = structuredClone(manifest);
    mutate(forged);
    redigestSchemaManifest(forged);
    await assert.rejects(
      () => applyMigration({ repos: memoryRepos(), expectedSha256: forged.sha256, ...schemaGate(forged) }, forged),
      (error) => error.code === "migration_manifest_invalid",
    );
  }
});

test("migration schema rejects an unexpected fifth Base table", async () => {
  const baseSchema = completeFixedSchema("extra-table");
  baseSchema.tables.push({ name: "默认数据表", table_id: "tbl-default", record_count: 0, fields: [] });
  const manifest = await planMigration({ google: normalizedSource(), captures: [latestCapture()], baseSchema });
  assert.equal(manifest.blocked.some((entry) =>
    entry.code === "base_schema_drift" && entry.table === "默认数据表" && entry.reason === "unexpected_table"), true);
  assert.equal(manifest.schema_actions.length, 0);
});

function fixedFieldForTables(tables, table, field, fieldId, { primary = false, initialOptions } = {}) {
  const spec = BASE_FIELD_SPECS[table].find((item) => item.name === field);
  const bindings = spec.kind === "link" ? { targetTableId: tables.get(spec.targetTable).table_id } : {};
  return {
    field_id: fieldId,
    ...fixedFieldDescriptor(table, field, bindings, initialOptions === undefined ? {} : { initialOptions }),
    ...(primary ? { is_primary: true } : {}),
  };
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

function schemaGate(manifest, postRevision = "post-schema-r1", liveSchema = completeDataSchema(manifest, postRevision)) {
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
    schemaAdapter: {
      readSchema: async () => structuredClone(liveSchema),
    },
  };
}

test("data Select coverage rejects every one of the 19 managed Select fields before repository writes", async (t) => {
  const manifest = await planMigration({
    google: normalizedSource(),
    sqliteAccounts: [latestAccount()],
    sqlitePosts: [latestCapture()],
  });
  const rowsByTable = {
    "账号台账": manifest.accounts,
    "选剧池": manifest.dramas,
    "采集数据": manifest.captures,
    "发布记录": manifest.releases,
  };
  const cases = [];
  for (const table of TABLE_ORDER) {
    for (const spec of BASE_FIELD_SPECS[table]) {
      if (!["single_select", "multi_select"].includes(spec.kind)) continue;
      const values = rowsByTable[table].flatMap((row) => {
        const raw = row[spec.name];
        return spec.kind === "multi_select" ? raw ?? [] : raw === null || raw === undefined ? [] : [raw];
      });
      assert.ok(values.length > 0, `${table}:${spec.name} must have a nonempty fixture value`);
      cases.push({
        table,
        field: spec.name,
        option: values[0],
        kind: spec.kind,
        policy: spec.optionPolicy === "manifest_append" ? "dynamic" : "fixed",
      });
    }
  }
  assert.deepEqual({
    total: cases.length,
    dynamic: cases.filter((item) => item.policy === "dynamic").length,
    fixed: cases.filter((item) => item.policy === "fixed").length,
    tables: [...new Set(cases.map((item) => item.table))],
    dynamicKinds: [...new Set(cases.filter((item) => item.policy === "dynamic").map((item) => item.kind))].sort(),
    fixedKinds: [...new Set(cases.filter((item) => item.policy === "fixed").map((item) => item.kind))].sort(),
  }, {
    total: 19,
    dynamic: 8,
    fixed: 11,
    tables: [...TABLE_ORDER],
    dynamicKinds: ["multi_select", "single_select"],
    fixedKinds: ["multi_select", "single_select"],
  });

  for (const [index, current] of cases.entries()) {
    await t.test(`${current.table}:${current.field}`, async () => {
      const revision = `data-coverage-${index}`;
      const liveSchema = completeDataSchema(manifest, revision);
      const field = liveSchema.tables.find((table) => table.name === current.table).fields
        .find((candidate) => candidate.name === current.field);
      field.options = field.options.filter((option) => option.name !== current.option);
      const repos = memoryRepos();
      await assert.rejects(
        () => applyMigration({
          phase: "data",
          repos,
          expectedSha256: manifest.sha256,
          ...schemaGate(manifest, revision, liveSchema),
        }, manifest),
        (error) => {
          assert.equal(error.code, "base_schema_drift");
          assert.deepEqual(error.details, {
            table: current.table,
            field: current.field,
            option: current.option,
          });
          return true;
        },
      );
      assert.equal(repos.calls.length, 0);
    });
  }

  await t.test("deterministic first missing value", async () => {
    const revision = "data-coverage-deterministic";
    const liveSchema = completeDataSchema(manifest, revision);
    for (const current of cases) {
      const field = liveSchema.tables.find((table) => table.name === current.table).fields
        .find((candidate) => candidate.name === current.field);
      field.options = field.options.filter((option) => option.name !== current.option);
    }
    const repos = memoryRepos();
    await assert.rejects(
      () => applyMigration({ repos, expectedSha256: manifest.sha256, ...schemaGate(manifest, revision, liveSchema) }, manifest),
      (error) => {
        assert.deepEqual(error.details, {
          table: cases[0].table,
          field: cases[0].field,
          option: cases[0].option,
        });
        return error.code === "base_schema_drift";
      },
    );
    assert.equal(repos.calls.length, 0);
  });

  await t.test("null single-select and empty multi-select values are skipped", async () => {
    const current = normalizedSource();
    const sparseGoogle = sourceWithTables({
      accounts: [{ ...current.accounts[0], 所属组: null, 表现形式: null }],
      dramas: [{
        ...current.dramas[0],
        剧分类: [],
        生命周期: null,
        "RS Boost 分类（待确认）": [],
        账号组: [],
        语言: null,
        来源: [],
      }],
    });
    const sparseManifest = await planMigration({
      google: sparseGoogle,
      sqliteAccounts: [latestAccount()],
      sqlitePosts: [latestCapture()],
    });
    assert.equal(sparseManifest.accounts[0].所属组, null);
    assert.deepEqual(sparseManifest.dramas[0].剧分类, []);
    const repos = memoryRepos();
    await applyMigration({ repos, expectedSha256: sparseManifest.sha256, ...schemaGate(sparseManifest) }, sparseManifest);
    assert.deepEqual(repos.calls.map(([name]) => name), ["accounts", "dramas", "captures", "releases"]);
  });

  await t.test("complete schema preserves the four-table repository order", async () => {
    const repos = memoryRepos();
    await applyMigration({ repos, expectedSha256: manifest.sha256, ...schemaGate(manifest) }, manifest);
    assert.deepEqual(repos.calls.map(([name]) => name), ["accounts", "dramas", "captures", "releases"]);
  });
});

test("data Select coverage rejects live catalog structural drift before repository writes", async (t) => {
  const manifest = await planMigration({
    google: normalizedSource(),
    sqliteAccounts: [latestAccount()],
    sqlitePosts: [latestCapture()],
  });
  const cases = [
    ["unexpected table", (schema) => { schema.tables.push({ name: "默认数据表", table_id: "tbl-extra", fields: [] }); }],
    ["missing field", (schema) => {
      const table = schema.tables.find((candidate) => candidate.name === "账号台账");
      table.fields = table.fields.filter((field) => field.name !== "所属组");
    }],
    ["duplicate field", (schema) => {
      const table = schema.tables.find((candidate) => candidate.name === "账号台账");
      table.fields.push({ ...structuredClone(table.fields.find((field) => field.name === "所属组")), field_id: "fld-duplicate" });
    }],
    ["wrong Select type", (schema) => {
      schema.tables.find((table) => table.name === "账号台账").fields
        .find((field) => field.name === "所属组").type = "text";
    }],
    ["wrong Select multiplicity", (schema) => {
      schema.tables.find((table) => table.name === "选剧池").fields
        .find((field) => field.name === "剧分类").multiple = false;
    }],
    ["missing Select options", (schema) => {
      delete schema.tables.find((table) => table.name === "账号台账").fields
        .find((field) => field.name === "所属组").options;
    }],
    ["duplicate Select option", (schema) => {
      const field = schema.tables.find((table) => table.name === "账号台账").fields
        .find((candidate) => candidate.name === "所属组");
      field.options.push(structuredClone(field.options[0]));
    }],
    ["expanded fixed catalog", (schema) => {
      schema.tables.find((table) => table.name === "账号台账").fields
        .find((field) => field.name === "状态").options.push({ name: "外部状态" });
    }],
  ];
  for (const [label, mutate] of cases) {
    await t.test(label, async () => {
      const revision = `data-structure-${label}`;
      const liveSchema = completeDataSchema(manifest, revision);
      mutate(liveSchema);
      const repos = memoryRepos();
      await assert.rejects(
        () => applyMigration({ repos, expectedSha256: manifest.sha256, ...schemaGate(manifest, revision, liveSchema) }, manifest),
        (error) => error.code === "base_schema_drift",
      );
      assert.equal(repos.calls.length, 0);
    });
  }
});

test("data Select coverage rejects a fresh schema revision that differs from the schema receipt", async () => {
  const manifest = await planMigration({
    google: normalizedSource(),
    sqliteAccounts: [latestAccount()],
    sqlitePosts: [latestCapture()],
  });
  const receiptRevision = "data-receipt-r1";
  const freshSchema = completeDataSchema(manifest, "data-fresh-r2");
  const repos = memoryRepos();
  await assert.rejects(
    () => applyMigration({
      repos,
      expectedSha256: manifest.sha256,
      ...schemaGate(manifest, receiptRevision, freshSchema),
    }, manifest),
    (error) => error.code === "schema_revision_drift",
  );
  assert.equal(repos.calls.length, 0);
});

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

const TABLE_KEYS = { "账号台账": ["accounts", "账号ID"], "选剧池": ["dramas", "剧ID"], "采集数据": ["captures", "Post ID"], "发布记录": ["发布记录"] };
const BINDING = { "账号台账": "accounts", "选剧池": "dramas", "采集数据": "captures", "发布记录": "releases" };
const PRIMARY = { "账号台账": "账号ID", "选剧池": "剧ID", "采集数据": "Post ID", "发布记录": "发布ID" };

// Reproduce what a real Base holds after a partial run: rows written by the same
// encoder, keyed by their Base record IDs, with relation cells already resolved.
function seedWritten(repos, manifest, plan, { mutate = null } = {}) {
  const recordId = (table, key) => `rec-existing-${BINDING[table]}-${key}`;
  for (const [table, count] of Object.entries(plan)) {
    const rows = manifest[BINDING[table]].slice(0, count);
    for (const row of rows) {
      const fields = structuredClone(row);
      for (const spec of BASE_FIELD_SPECS[table]) {
        const value = fields[spec.name];
        if (spec.kind === "datetime" && typeof value === "string" && value.includes("T")) {
          fields[spec.name] = new Date(Math.floor(Date.parse(value) / 1000) * 1000).toISOString();
        }
      }
      if (table === "采集数据") fields.账号 = [{ id: recordId("账号台账", row.账号) }];
      if (table === "发布记录") {
        fields.账号 = [{ id: recordId("账号台账", row.账号) }];
        fields.剧 = [{ id: recordId("选剧池", row.剧) }];
        fields.采集记录 = row.采集记录 === null ? [] : [{ id: recordId("采集数据", row.采集记录) }];
      }
      if (mutate) mutate(fields, table);
      repos[BINDING[table]].rows.set(row[PRIMARY[table]], { record_id: recordId(table, row[PRIMARY[table]]), fields });
    }
  }
}

function subsetEvidence(manifest, plan = {}) {
  return Object.fromEntries(TABLE_ORDER.map((table) => {
    const count = plan[table] ?? 0;
    return [table, {
      record_count: count,
      key_set_sha256: count === 0 ? EMPTY_KEY_SET_SHA256 : "e".repeat(64),
    }];
  }));
}

function resumeContext(manifest, repos, overrides = {}, plan = {}) {
  return {
    phase: "data", repos, expectedSha256: manifest.sha256, resumePartialData: "manifest-subset",
    readEmptyTableEvidence: async () => subsetEvidence(manifest, plan),
    ...schemaGate(manifest), ...overrides,
  };
}

test("manifest-subset resume continues from a mid-table interruption without rewriting what landed", async () => {
  const manifest = await planMigration({ google: normalizedSource(), captures: [latestCapture()] });
  const repos = memoryRepos();
  // accounts fully written, dramas fully written, captures/releases still empty —
  // i.e. the run died right after 选剧池.
  const plan = { "账号台账": manifest.accounts.length, "选剧池": manifest.dramas.length };
  seedWritten(repos, manifest, plan);

  const result = await applyMigration(resumeContext(manifest, repos, {}, plan), manifest);

  assert.equal(result.status, "applied");
  // Tables already complete are excluded from the upsert path entirely.
  assert.deepEqual(repos.calls.map(([name]) => name), ["captures", "releases"]);
  assert.deepEqual(
    [...repos.accounts.rows].map(([key, record]) => [key, record.record_id]),
    manifest.accounts.map((row) => [row.账号ID, `rec-existing-accounts-${row.账号ID}`]),
  );
  // Downstream relations resolve to the record IDs that already exist in the Base.
  assert.deepEqual(repos.calls[0][2][0].patch.账号, [{ id: "rec-existing-accounts-dramaexpedition" }]);
  assert.deepEqual(repos.calls[1][2][0].patch.剧, [{ id: "rec-existing-dramas-SD-000001" }]);
});

test("manifest-subset resume accepts a partially written table and only creates the gap", async () => {
  const manifest = await planMigration({
    google: normalizedSource(),
    sqlitePosts: [latestCapture(), latestCapture({ post_id: "100", post_url: "https://www.tiktok.com/@dramaexpedition/video/100" })],
  });
  assert.equal(manifest.captures.length, 2);
  const repos = memoryRepos();
  // The run died mid-way through 采集数据: one of its two rows landed.
  const plan = { "账号台账": manifest.accounts.length, "选剧池": manifest.dramas.length, "采集数据": 1 };
  seedWritten(repos, manifest, plan);
  const survivor = manifest.captures[0]["Post ID"];

  const result = await applyMigration(resumeContext(manifest, repos, {}, plan), manifest);

  assert.equal(result.status, "applied");
  // Complete tables are skipped; the partially written one goes through the upsert.
  assert.deepEqual(repos.calls.map(([name]) => name), ["captures", "releases"]);
  // The row that already landed keeps its Base record ID — it is never recreated.
  assert.equal(repos.captures.rows.get(survivor).record_id, `rec-existing-captures-${survivor}`);
  assert.equal(repos.captures.rows.size, manifest.captures.length);
});

test("manifest-subset resume refuses every state that is not an exact manifest subset", async () => {
  const manifest = await planMigration({ google: normalizedSource(), captures: [latestCapture()] });
  const full = { "账号台账": manifest.accounts.length };
  const cases = [
    ["field drift", (repos) => seedWritten(repos, manifest, full, { mutate: (f, t) => { if (t === "账号台账") f.粉丝数 += 1; } })],
    ["extra writable field", (repos) => seedWritten(repos, manifest, full, { mutate: (f, t) => { if (t === "账号台账") f.定位垂类 = "手工新增"; } })],
    ["row outside the manifest", (repos) => {
      seedWritten(repos, manifest, full);
      repos.accounts.rows.set("intruder", { record_id: "rec-x", fields: { 账号ID: "intruder" } });
    }],
    ["downstream row outside the manifest", (repos) => {
      seedWritten(repos, manifest, full);
      repos.dramas.rows.set("SD-999999", { record_id: "rec-y", fields: { 剧ID: "SD-999999" } });
    }],
    ["evidence count exceeds the manifest", (repos) => {
      seedWritten(repos, manifest, full);
      repos.evidenceOverride = { "账号台账": { record_count: manifest.accounts.length + 1, key_set_sha256: "e".repeat(64) } };
    }],
    ["empty table claims a non-empty key set", (repos) => {
      seedWritten(repos, manifest, full);
      repos.evidenceOverride = { "选剧池": { record_count: 0, key_set_sha256: "f".repeat(64) } };
    }],
  ];

  for (const [label, prepare] of cases) {
    const repos = memoryRepos();
    prepare(repos);
    await assert.rejects(
      () => applyMigration(resumeContext(manifest, repos, {
        readEmptyTableEvidence: async () => ({ ...subsetEvidence(manifest, full), ...(repos.evidenceOverride ?? {}) }),
      }, full), manifest),
      (error) => error.code === "resume_prefix_mismatch",
      label,
    );
    assert.equal(repos.calls.length, 0, label);
  }
});

test("manifest-subset resume keeps every envelope gate and rejects unknown or misphased resume modes", async () => {
  const manifest = await planMigration({ google: normalizedSource(), captures: [latestCapture()] });
  const full = { "账号台账": manifest.accounts.length };
  const cases = [
    [{ sourceRevision: "changed" }, "source_revision_drift"],
    [{ getSchemaRevision: async () => "changed" }, "schema_revision_drift"],
    [{ expectedSha256: "0".repeat(64) }, "migration_digest_mismatch"],
    [{ permissionAttestation: undefined, expectedPermissionAttestationSha256: undefined }, "migration_permission_attestation_required"],
    [{ canaryReceipt: undefined, expectedCanaryReceiptSha256: undefined }, "migration_canary_required"],
    [{ resumePartialData: "accounts-prefix" }, "migration_resume_invalid"],
    [{ resumePartialData: "everything" }, "migration_resume_invalid"],
    [{ resumePartialData: true }, "migration_resume_invalid"],
    [{ phase: "presentation" }, "migration_resume_invalid"],
  ];

  for (const [overrides, code] of cases) {
    const repos = memoryRepos();
    seedWritten(repos, manifest, full);
    await assert.rejects(
      () => applyMigration(resumeContext(manifest, repos, overrides, full), manifest),
      (error) => error.code === code,
      code,
    );
    assert.equal(repos.calls.length, 0, code);
  }
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
  let liveRevision = manifest.initial_schema_revision;
  const adapter = {
    createField: async (tableId, table, field, bindings, initialOptions) => {
      tables.get(table).fields.push(fixedFieldForTables(tables, table, field, `${tableId}-${field}`, { initialOptions }));
      if (table === "发布记录" && field === "剧") tables.get("选剧池").fields.push(fixedFieldForTables(tables, "选剧池", "关联发布记录", "reverse-drama"));
      if (table === "发布记录" && field === "采集记录") tables.get("采集数据").fields.push(fixedFieldForTables(tables, "采集数据", "关联发布记录", "reverse-capture"));
      liveRevision = "post-schema-r1";
      calls.push(["field", table, field, bindings, initialOptions]);
    },
    updateField: async (tableId, fieldId, table, field) => {
      const at = tables.get(table).fields.findIndex((item) => item.field_id === fieldId);
      tables.get(table).fields[at] = fixedFieldForTables(tables, table, field, fieldId, { primary: true });
      liveRevision = "post-schema-r1";
      calls.push(["update", tableId, fieldId, table, field]);
    },
    updateSelectFieldOptions: async () => { throw new Error("unexpected option update"); },
    readSchema: async () => ({ complete: true, revision: liveRevision, tables: [...tables].map(([name, value]) => ({ name, ...value })) }),
    verifySchemaAction: async () => true,
  };
  const applied = await applyMigration({ phase: "schema", schemaAdapter: adapter, expectedSha256: manifest.sha256, sourceRevision: manifest.source_revision }, manifest);
  assert.equal(applied.schema_receipt.status, "verified");
  assert.equal(applied.schema_receipt.manifest_sha256, manifest.sha256);
  assert.equal(applied.schema_receipt.pre_revision, manifest.initial_schema_revision);
  assert.equal(applied.schema_receipt.post_revision, "post-schema-r1");
  assert.match(applied.schema_receipt.sha256, /^[a-f0-9]{64}$/);
  assert.equal(calls.some((call) => call[0] === "field" && call[2] === "账号名"), true);
  const linkCall = calls.find((call) => call[0] === "field" && call[1] === "发布记录" && call[2] === "剧");
  assert.deepEqual(linkCall[3], { targetTableId: "tbl-precreated-1" });
  assert.equal(linkCall[4], undefined);
  const dynamicSelectCall = calls.find((call) => call[0] === "field" && call[1] === "账号台账" && call[2] === "所属组");
  const dynamicSelectAction = manifest.schema_actions.find((action) => action.id === "field:账号台账:所属组");
  assert.deepEqual(dynamicSelectCall[4], dynamicSelectAction.spec.canonical.options.map((option) => option.name));
  const fixedSelectCall = calls.find((call) => call[0] === "field" && call[1] === "账号台账" && call[2] === "状态");
  assert.equal(fixedSelectCall[4], undefined);

  const repos = memoryRepos();
  await applyMigration({ repos, expectedSha256: manifest.sha256, sourceRevision: manifest.source_revision,
    schemaReceipt: applied.schema_receipt, expectedSchemaReceiptSha256: applied.schema_receipt.sha256,
    getSchemaRevision: async () => "post-schema-r1", schemaAdapter: adapter }, manifest);
  assert.deepEqual(repos.calls.map(([name]) => name), ["accounts", "dramas", "captures", "releases"]);
  const beforeReuseWrites = calls.length;
  const reused = await applyMigration({ phase: "schema", schemaAdapter: adapter, expectedSha256: manifest.sha256, sourceRevision: manifest.source_revision,
    schemaReceipt: applied.schema_receipt, expectedSchemaReceiptSha256: applied.schema_receipt.sha256,
    getSchemaRevision: async () => "post-schema-r1" }, manifest);
  assert.equal(reused.reused, true);
  assert.equal(calls.length, beforeReuseWrites);
});

test("schema apply appends options with exact before and after readback", async () => {
  const { google, baseSchema, liveSchema } = optionApplyScenario();
  const manifest = await planMigration({ google, captures: [latestCapture()], baseSchema });
  const [action] = manifest.schema_actions.filter((candidate) => candidate.kind === "update_select_options");
  assert.ok(action);
  assert.deepEqual(action.before_options, ["Legacy", "Romance"]);
  assert.deepEqual(action.after_options, ["Legacy", "Romance", "Revenge"]);
  const { adapter, calls } = optionActionAdapter(liveSchema);
  let separateRevisionReads = 0;
  let emptyReads = 0;
  const applied = await applyMigration({
    phase: "schema",
    schemaAdapter: adapter,
    expectedSha256: manifest.sha256,
    sourceRevision: manifest.source_revision,
    getSchemaRevision: async () => {
      separateRevisionReads += 1;
      throw new Error("schema receipt must not use a separate revision read");
    },
    readEmptyTableEvidence: async () => {
      emptyReads += 1;
      return structuredClone(manifest.initial_empty_table_evidence);
    },
  }, manifest);
  assert.equal(applied.schema_receipt.post_revision, liveSchema.revision);
  assert.equal(separateRevisionReads, 0);
  assert.deepEqual(calls.updates, [[
    liveSchema.tables.find((table) => table.name === action.table).table_id,
    action.field_id,
    action.table,
    action.field,
    action.after_options,
  ]]);
  assert.deepEqual(optionField(liveSchema, action).options.map((option) => option.name), action.after_options);
  assert.deepEqual({ schemaReads: calls.reads, verifies: calls.verifies, emptyReads }, {
    schemaReads: 4,
    verifies: 2,
    emptyReads: 2,
  });

  for (const wrongOptions of [
    action.after_options.slice(0, -1),
    [...action.after_options, "Extra"],
    [...action.after_options].reverse(),
  ]) {
    const next = optionApplyScenario();
    const nextManifest = await planMigration({ google: next.google, captures: [latestCapture()], baseSchema: next.baseSchema });
    const { adapter: wrongAdapter } = optionActionAdapter(next.liveSchema, {
      update: ({ field }) => { field.options = wrongOptions.map((name) => ({ name })); },
    });
    await assert.rejects(() => applyMigration({
      phase: "schema",
      schemaAdapter: wrongAdapter,
      expectedSha256: nextManifest.sha256,
      sourceRevision: nextManifest.source_revision,
      getSchemaRevision: async () => nextManifest.initial_schema_revision,
    }, nextManifest), (error) => error.code === "readback_mismatch");
  }
});

test("schema receipt binds the final empty gate to one exact final schema snapshot", async () => {
  const state = optionApplyScenario({ actionCount: 2 });
  const manifest = await planMigration({ google: state.google, captures: [latestCapture()], baseSchema: state.baseSchema });
  const actions = manifest.schema_actions.filter((action) => action.kind === "update_select_options");
  const { adapter, calls } = optionActionAdapter(state.liveSchema);
  let emptyReads = 0;
  let separateRevisionReads = 0;
  await assert.rejects(() => applyMigration({
    phase: "schema",
    schemaAdapter: adapter,
    expectedSha256: manifest.sha256,
    sourceRevision: manifest.source_revision,
    getSchemaRevision: async () => {
      separateRevisionReads += 1;
      return separateRevisionReads === 1 ? manifest.initial_schema_revision : "separate-post-revision";
    },
    readEmptyTableEvidence: async () => {
      emptyReads += 1;
      if (emptyReads === 3) {
        optionField(state.liveSchema, actions[0]).options = [{ name: "Drifted after immediate readback" }];
        state.liveSchema.revision = "drifted-before-final-snapshot";
      }
      return structuredClone(manifest.initial_empty_table_evidence);
    },
  }, manifest), (error) => error.code === "readback_mismatch");
  assert.equal(calls.updates.length, 2);
  assert.equal(emptyReads, 3);
  assert.equal(separateRevisionReads, 0);
});

test("schema apply skips exact-after option actions and rejects third-state drift", async () => {
  const exact = optionApplyScenario();
  const manifest = await planMigration({ google: exact.google, captures: [latestCapture()], baseSchema: exact.baseSchema });
  const [action] = manifest.schema_actions.filter((candidate) => candidate.kind === "update_select_options");
  optionField(exact.liveSchema, action).options = action.after_options.map((name, index) => ({
    id: `existing-${index}`, name, color: index,
  }));
  const { adapter, calls } = optionActionAdapter(exact.liveSchema);
  let separateRevisionReads = 0;
  let emptyReads = 0;
  const applied = await applyMigration({
    phase: "schema",
    schemaAdapter: adapter,
    expectedSha256: manifest.sha256,
    sourceRevision: manifest.source_revision,
    getSchemaRevision: async () => {
      separateRevisionReads += 1;
      throw new Error("schema receipt must not use a separate revision read");
    },
    readEmptyTableEvidence: async () => {
      emptyReads += 1;
      return structuredClone(manifest.initial_empty_table_evidence);
    },
  }, manifest);
  assert.equal(applied.schema_receipt.post_revision, exact.liveSchema.revision);
  assert.equal(separateRevisionReads, 0);
  assert.equal(calls.updates.length, 0);
  assert.deepEqual({ schemaReads: calls.reads, verifies: calls.verifies, emptyReads }, {
    schemaReads: 4,
    verifies: 2,
    emptyReads: 1,
  });

  const third = optionApplyScenario();
  const thirdManifest = await planMigration({ google: third.google, captures: [latestCapture()], baseSchema: third.baseSchema });
  const [thirdAction] = thirdManifest.schema_actions.filter((candidate) => candidate.kind === "update_select_options");
  optionField(third.liveSchema, thirdAction).options = [{ name: "Legacy" }, { name: "Outside" }];
  const thirdAdapter = optionActionAdapter(third.liveSchema);
  let thirdEmptyReads = 0;
  await assert.rejects(() => applyMigration({
    phase: "schema",
    schemaAdapter: thirdAdapter.adapter,
    expectedSha256: thirdManifest.sha256,
    sourceRevision: thirdManifest.source_revision,
    getSchemaRevision: async () => thirdManifest.initial_schema_revision,
    readEmptyTableEvidence: async () => {
      thirdEmptyReads += 1;
      return structuredClone(thirdManifest.initial_empty_table_evidence);
    },
  }, thirdManifest), (error) => error.code === "schema_revision_drift" &&
    error.details.action === thirdAction.id && error.details.reason === "select_options_third_state");
  assert.equal(thirdAdapter.calls.updates.length, 0);
  assert.equal(thirdAdapter.calls.verifies, 0);
  assert.equal(thirdEmptyReads, 0);
});

test("schema option mutation requires fresh empty evidence and no reusable schema receipt", async () => {
  const blocked = optionApplyScenario();
  const manifest = await planMigration({ google: blocked.google, captures: [latestCapture()], baseSchema: blocked.baseSchema });
  const blockedAdapter = optionActionAdapter(blocked.liveSchema);
  const nonempty = structuredClone(manifest.initial_empty_table_evidence);
  nonempty.账号台账 = { record_count: 1, key_set_sha256: "f".repeat(64) };
  await assert.rejects(() => applyMigration({
    phase: "schema",
    schemaAdapter: blockedAdapter.adapter,
    expectedSha256: manifest.sha256,
    sourceRevision: manifest.source_revision,
    getSchemaRevision: async () => manifest.initial_schema_revision,
    readEmptyTableEvidence: async () => nonempty,
  }, manifest), (error) => error.code === "base_not_empty");
  assert.equal(blockedAdapter.calls.updates.length, 0);

  const finalGate = optionApplyScenario();
  const finalManifest = await planMigration({ google: finalGate.google, captures: [latestCapture()], baseSchema: finalGate.baseSchema });
  const finalAdapter = optionActionAdapter(finalGate.liveSchema);
  let emptyReads = 0;
  await assert.rejects(() => applyMigration({
    phase: "schema",
    schemaAdapter: finalAdapter.adapter,
    expectedSha256: finalManifest.sha256,
    sourceRevision: finalManifest.source_revision,
    getSchemaRevision: async () => finalManifest.initial_schema_revision,
    readEmptyTableEvidence: async () => ++emptyReads === 1
      ? structuredClone(finalManifest.initial_empty_table_evidence)
      : nonempty,
  }, finalManifest), (error) => error.code === "base_not_empty");
  assert.equal(finalAdapter.calls.updates.length, 1);
  assert.equal(emptyReads, 2);

  const reusedState = optionApplyScenario();
  const reusedManifest = await planMigration({ google: reusedState.google, captures: [latestCapture()], baseSchema: reusedState.baseSchema });
  const [reusedAction] = reusedManifest.schema_actions.filter((candidate) => candidate.kind === "update_select_options");
  optionField(reusedState.liveSchema, reusedAction).options = reusedAction.after_options.map((name) => ({ name }));
  const reusedAdapter = optionActionAdapter(reusedState.liveSchema, {
    update: () => { throw new Error("receipt reuse must not mutate schema"); },
  });
  const gate = schemaGate(reusedManifest, "post-reused");
  reusedState.liveSchema.revision = gate.schemaReceipt.post_revision;
  let separateRevisionReads = 0;
  const reused = await applyMigration({
    phase: "schema",
    expectedSha256: reusedManifest.sha256,
    ...gate,
    schemaAdapter: reusedAdapter.adapter,
    getSchemaRevision: async () => {
      separateRevisionReads += 1;
      throw new Error("receipt reuse must not use a separate revision read");
    },
    readEmptyTableEvidence: async () => { throw new Error("receipt reuse must not inspect mutation emptiness"); },
  }, reusedManifest);
  assert.equal(reused.reused, true);
  assert.equal(reusedAdapter.calls.updates.length, 0);
  assert.equal(reusedAdapter.calls.reads, 1);
  assert.equal(reusedAdapter.calls.verifies, 1);
  assert.equal(separateRevisionReads, 0);
});

test("partial multi-action schema failure produces no receipt and replans only remaining gaps", async () => {
  for (const [secondMutation, expectedRemaining] of [[false, 1], [true, 0]]) {
    const interrupted = optionApplyScenario({ actionCount: 2 });
    const manifest = await planMigration({ google: interrupted.google, captures: [latestCapture()], baseSchema: interrupted.baseSchema });
    const actions = manifest.schema_actions.filter((candidate) => candidate.kind === "update_select_options");
    assert.deepEqual(actions.map((action) => action.field), ["剧分类", "语言"]);
    let rollbackCalls = 0;
    const interruptedAdapter = optionActionAdapter(interrupted.liveSchema, {
      update: ({ field, optionNames, liveSchema, calls }) => {
        if (calls.updates.length === 1 || secondMutation) {
          field.options = optionNames.map((name) => ({ name }));
          liveSchema.revision = `interrupted-options-r${calls.updates.length}`;
        }
        if (calls.updates.length === 2) {
          throw Object.assign(new Error(secondMutation
            ? "response lost after second server mutation"
            : "second mutation failed before reaching the server"), { code: "base_request_failed" });
        }
      },
    });
    interruptedAdapter.adapter.deleteField = async () => { rollbackCalls += 1; };
    await assert.rejects(() => applyMigration({
      phase: "schema",
      schemaAdapter: interruptedAdapter.adapter,
      expectedSha256: manifest.sha256,
      sourceRevision: manifest.source_revision,
      getSchemaRevision: async () => manifest.initial_schema_revision,
    }, manifest), (error) => error.code === "base_request_failed");
    assert.equal(interruptedAdapter.calls.updates.length, 2);
    assert.equal(rollbackCalls, 0);
    assert.deepEqual(optionField(interrupted.liveSchema, actions[0]).options.map((option) => option.name), actions[0].after_options);
    assert.deepEqual(optionField(interrupted.liveSchema, actions[1]).options.map((option) => option.name),
      secondMutation ? actions[1].after_options : actions[1].before_options);
    const replanned = await planMigration({
      google: interrupted.google,
      captures: [latestCapture()],
      baseSchema: interrupted.liveSchema,
    });
    const remaining = replanned.schema_actions.filter((action) => action.kind === "update_select_options");
    assert.equal(remaining.length, expectedRemaining);
    if (expectedRemaining === 1) assert.equal(remaining[0].id, actions[1].id);
    const repos = memoryRepos();
    await assert.rejects(() => applyMigration({
      phase: "data",
      repos,
      expectedSha256: manifest.sha256,
      sourceRevision: manifest.source_revision,
      getSchemaRevision: async () => "post-unreceipted",
    }, manifest), (error) => error.code === "migration_schema_receipt_required");
    assert.equal(repos.calls.length, 0);
  }

  const raced = optionApplyScenario({ actionCount: 2 });
  const racedManifest = await planMigration({ google: raced.google, captures: [latestCapture()], baseSchema: raced.baseSchema });
  const racedAdapter = optionActionAdapter(raced.liveSchema);
  const racedNonempty = structuredClone(racedManifest.initial_empty_table_evidence);
  racedNonempty.发布记录 = { record_count: 1, key_set_sha256: "e".repeat(64) };
  let emptyReads = 0;
  await assert.rejects(() => applyMigration({
    phase: "schema",
    schemaAdapter: racedAdapter.adapter,
    expectedSha256: racedManifest.sha256,
    sourceRevision: racedManifest.source_revision,
    getSchemaRevision: async () => racedManifest.initial_schema_revision,
    readEmptyTableEvidence: async () => ++emptyReads === 1
      ? structuredClone(racedManifest.initial_empty_table_evidence)
      : racedNonempty,
  }, racedManifest), (error) => error.code === "base_not_empty");
  assert.equal(racedAdapter.calls.updates.length, 1);
  assert.equal(emptyReads, 2);
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
  let liveRevision = manifest.initial_schema_revision;
  const adapter = {
    createField: async (tableId, table, field) => {
      tables.get(table).fields.push(fixedFieldForTables(tables, table, field, `${tableId}-${field}`));
      if (table === "发布记录" && field === "剧") tables.get("选剧池").fields.push(fixedFieldForTables(tables, "选剧池", "关联发布记录", "reverse-drama"));
      if (table === "发布记录" && field === "采集记录") tables.get("采集数据").fields.push(fixedFieldForTables(tables, "采集数据", "关联发布记录", "reverse-capture"));
      liveRevision = "post-bootstrap";
    },
    updateField: async (tableId, fieldId, table, field) => { const at = tables.get(table).fields.findIndex((item) => item.field_id === fieldId); tables.get(table).fields[at] = fixedFieldForTables(tables, table, field, fieldId, { primary: true }); liveRevision = "post-bootstrap"; calls.push([tableId, fieldId, table, field]); },
    updateSelectFieldOptions: async () => { throw new Error("unexpected option update"); },
    readSchema: async () => ({ complete: true, revision: liveRevision, tables: [...tables].map(([name, value]) => ({ name, ...value })) }),
    verifySchemaAction: async () => true,
  };
  await applyMigration({ phase: "schema", schemaAdapter: adapter, expectedSha256: manifest.sha256, sourceRevision: manifest.source_revision }, manifest);
  assert.deepEqual(calls, [
    ["tbl-account", "fld-default", "账号台账", "账号ID"],
    ["tbl-precreated-1", "fld-primary-1", "选剧池", "剧ID"],
    ["tbl-precreated-2", "fld-primary-2", "采集数据", "Post ID"],
    ["tbl-precreated-3", "fld-primary-3", "发布记录", "发布ID"],
  ]);
  assert.equal(tables.get("账号台账").fields.some((field) => field.name === "账号ID" && field.is_primary), true);
});

test("schema receipt is refused when an unchanged preexisting field drifts in final semantic readback", async () => {
  const google = normalizedSource();
  const baseSchema = completeFixedSchema("complete-r1", {
    "账号台账:所属组": [google.accounts[0].所属组],
    "账号台账:表现形式": [google.accounts[0].表现形式],
    "选剧池:剧分类": google.dramas[0].剧分类,
    "选剧池:生命周期": [google.dramas[0].生命周期],
    "选剧池:RS Boost 分类（待确认）": google.dramas[0]["RS Boost 分类（待确认）"],
    "选剧池:账号组": google.dramas[0].账号组,
    "选剧池:语言": [google.dramas[0].语言],
    "选剧池:来源": google.dramas[0].来源,
  });
  const manifest = await planMigration({ google, captures: [latestCapture()], baseSchema });
  assert.equal(manifest.schema_actions.length, 0);
  assert.equal(manifest.blocked.length, 0);
  const drifted = structuredClone(baseSchema);
  const accountName = drifted.tables.find((table) => table.name === "账号台账").fields.find((field) => field.name === "账号名");
  accountName.type = "number";
  const adapter = {
    createField: async () => { throw new Error("unexpected"); },
    updateField: async () => { throw new Error("unexpected"); },
    updateSelectFieldOptions: async () => { throw new Error("unexpected"); },
    verifySchemaAction: async () => true,
    readSchema: async () => ({ complete: true, revision: manifest.initial_schema_revision, tables: structuredClone(drifted.tables) }),
  };
  await assert.rejects(() => applyMigration({ phase: "schema", schemaAdapter: adapter, expectedSha256: manifest.sha256,
    sourceRevision: manifest.source_revision }, manifest),
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

test("phases that never touch the source are not locked out by a normal source edit", async () => {
  const manifest = await planMigration({ google: normalizedSource(), captures: [latestCapture()] });
  const repos = memoryRepos();
  await applyMigration({ repos, expectedSha256: manifest.sha256, ...schemaGate(manifest) }, manifest);
  const verification = await verifyMigration({ repos, now: () => "2026-09-01T11:00:00Z" }, manifest);

  // Someone edits the Google sheet after planning. That is normal: the team keeps
  // working in it. It must not permanently wedge the two phases that only replay
  // the manifest's own fixed specs.
  const drifted = { sourceRevision: "migration-source-v2:someone-edited-the-sheet" };

  const seeds = [];
  const sequences = await applyMigration({
    phase: "sequences", expectedSha256: manifest.sha256, ...schemaGate(manifest), ...drifted,
    verification, expectedVerificationSha256: verification.sha256,
    seedSequence: async (...args) => seeds.push(args),
  }, manifest);
  assert.equal(sequences.status, "applied");
  assert.deepEqual(seeds, [["drama", 1], ["release", 1]]);

  const presentationAdapter = {
    listViews: async () => [], createView: async () => ({ view_id: "v" }),
    updateView: async () => {}, readViewConfiguration: async () => ({}),
    listDashboards: async () => [], createDashboard: async () => ({ dashboard_id: "d" }),
    listDashboardBlocks: async () => [], updateDashboardBlock: async () => {},
    readDashboardBlock: async () => ({}),
  };
  await assert.rejects(
    () => applyMigration({ phase: "presentation", expectedSha256: manifest.sha256, ...schemaGate(manifest), ...drifted, presentationAdapter }, manifest),
    (error) => error.code !== "source_revision_drift",
    "presentation may fail for its own reasons but never on source drift",
  );

  // The phases that DO consume source data must still refuse.
  for (const phase of ["schema", "data"]) {
    await assert.rejects(
      () => applyMigration({ phase, repos: memoryRepos(), expectedSha256: manifest.sha256, ...schemaGate(manifest), ...drifted }, manifest),
      (error) => error.code === "source_revision_drift",
      phase,
    );
  }
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
