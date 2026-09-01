import assert from "node:assert/strict";
import { mkdir, readFile, rename, rm, symlink } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  GOOGLE_MIGRATION_RANGES,
  normalizeGoogleSource,
  readGoogleMigrationSource,
} from "../src/google-source.mjs";
import {
  applyMigration,
  manifestDigest,
  planMigration,
  verificationDigest,
  verifyMigration,
  writeMigrationArtifact,
} from "../src/migration.mjs";

const ACCOUNT_HEADERS = ["账号名", "主页链接", "粉丝数", "所属组", "定位垂类", "表现形式", "状态", "数据日期"];
const DRAMA_HEADERS = ["剧名", "剧ID", "剧分类", "上线日期", "生命周期", "是否已排期", "备注", "推荐理由", "RS Boost 分类（待确认）", "账号组", "账号状态", "平台", "语言", "来源", "推荐人", "归档状态"];
const RELEASE_HEADERS = ["日期", "账号名", "主页链接", "剧名", "剧ID（RS Boost）", "剧分类", "视频链接", "Post ID", "播放量", "点赞", "收藏", "转发", "评论", "RS收益", "备注", "归档状态"];
const CAPTURE_HEADERS = ["快照日期", "账号名", "Post ID", "视频链接", "播放量", "点赞", "评论", "收藏", "转发", "采集状态"];

function matrices() {
  const unformatted = {
    accounts: [[...ACCOUNT_HEADERS], ["DramaExpedition", "https://www.tiktok.com/@dramaexpedition", 1161, "A纯切片", " 短剧 ", "AI真人剧", "发布中", 46239], [null, null, null]],
    dramas: [[...DRAMA_HEADERS], ["Broken contract and four cubs", "legacy", "狼人，复仇", 46240, "新剧", "是", "", "推荐", "狼人,复仇", "A纯切片", "发布中", "ReelShort", "英语", "Google Trends, 至真选剧台", "彭满", "active"], [null, null, null]],
    releases: [[...RELEASE_HEADERS], [46258, "DramaExpedition", "https://www.tiktok.com/@dramaexpedition", "Broken contract and four cubs", "RS-7", "狼人", "https://www.tiktok.com/@dramaexpedition/video/99", "99", 9, 0, null, 1, 2, 0, "首发", "active"], [null, null, null]],
    captures: [[...CAPTURE_HEADERS], [46258, "dramaexpedition", "old-99", "https://example.invalid", 20, 0, 0, 0, 0, "complete"]],
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

test("Google normalization ignores formula-only rows, preserves null/zero, and keeps capture audit-only", () => {
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
  assert.equal("captures" in result, false);
  assert.match(result.revision, /^google-evidence-v1:[a-f0-9]{64}$/);
  assert.equal(result.raw_backup.grid.accounts[0].values[0].dataValidation.condition.type, "ONE_OF_LIST");
  assert.equal(result.raw_backup.grid.accounts[0].values[0].effectiveFormat.numberFormat.pattern, "@");
  assert.equal(JSON.stringify(result.raw_backup).includes("Bearer"), false);
});

test("Google normalization rejects duplicate/missing headers, ambiguous dates and malformed multi-selects", () => {
  for (const mutate of [
    (data) => { data.unformatted.accounts[0][1] = "账号名"; },
    (data) => { data.unformatted.releases[0][0] = "not-date"; },
    (data) => { data.unformatted.dramas[1][3] = "08/09/10"; data.formatted.dramas[1][3] = "08/09/10"; },
    (data) => { data.unformatted.dramas[1][2] = "狼人,,复仇"; },
  ]) {
    const data = { metadata: normalizedSource().raw_backup.metadata, ...matrices() };
    mutate(data);
    assert.throws(() => normalizeGoogleSource(data), (error) => error.code === "google_source_invalid");
  }
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

test("plan is pure and deterministic, uses visible/source order, and never imports Google capture data", async () => {
  const google = normalizedSource();
  google.dramas.push({ ...google.dramas[0], source_row: 3, 剧名: "The Phantom Pilot", 剧分类: ["逆袭"] });
  const first = await planMigration({ google, captures: [latestCapture()], now: () => "2026-09-01T10:00:00Z" });
  const second = await planMigration({ google, captures: [latestCapture()], now: () => "2027-01-01T00:00:00Z" });
  assert.deepEqual(first.dramas.map((row) => row.剧ID), ["SD-000001", "SD-000002"]);
  assert.deepEqual(first.releases.map((row) => row.发布ID), ["SR-000001"]);
  assert.deepEqual(first.captures.map((row) => row["Post ID"]), ["99"]);
  assert.equal(first.captures.some((row) => row["Post ID"] === "old-99"), false);
  assert.deepEqual(first.counts, { accounts: 1, dramas: 2, captures: 1, releases: 1, blocked: 0 });
  assert.deepEqual(first.sequence_seeds, { drama: 2, release: 1 });
  assert.equal(first.sha256, second.sha256);
  assert.equal(first.generated_at === second.generated_at, false);
  assert.equal(first.sha256, manifestDigest(first));
  assert.equal(first.source_backup.grid.accounts[0].values[0].dataValidation.condition.type, "ONE_OF_LIST");
  assert.deepEqual(first.schema_actions.filter((action) => action.kind === "create_table").map((action) => action.table), ["账号台账", "选剧池", "采集数据", "发布记录"]);
  assert.deepEqual(first.presentation_actions.map((action) => action.name), [
    "在用账号", "需处理账号", "未排期", "已排期", "按平台", "按语言",
    "已排期", "待公开", "已公开待回填", "已回填", "按账号表现", "按剧表现",
    "完整", "部分缺失", "未关联发布", "短剧发行管理仪表盘",
  ]);
});

test("plan blocks duplicate identities, missing targets, and URL/account disagreement without guessing", async () => {
  const google = normalizedSource();
  google.accounts.push({ ...google.accounts[0], source_row: 4, 账号名: "@DRAMAEXPEDITION" });
  google.dramas.push({ ...google.dramas[0], source_row: 4 });
  google.releases.push({ ...google.releases[0], source_row: 5, 账号名: "missing", 剧名: "missing", 视频链接: null, "Post ID": null });
  const manifest = await planMigration({ google, captures: [latestCapture({ post_url: "https://www.tiktok.com/@other/video/99" })] });
  assert.deepEqual(new Set(manifest.blocked.map((item) => item.code)), new Set([
    "duplicate_account_key", "ambiguous_drama_key", "missing_account_target", "missing_drama_target", "source_account_mismatch", "no_account_time_candidate",
  ]));
  await assert.rejects(
    () => applyMigration({ expectedSha256: manifest.sha256, sourceRevision: manifest.source_revision, schemaRevision: manifest.schema_revision }, manifest),
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
  await assert.rejects(() => applyMigration({ expectedSha256: manifest.sha256, sourceRevision: manifest.source_revision, schemaRevision: manifest.schema_revision }, tampered), (error) => error.code === "migration_digest_mismatch");
  tampered.sha256 = manifestDigest(tampered);
  await assert.rejects(() => applyMigration({ expectedSha256: tampered.sha256, sourceRevision: tampered.source_revision, schemaRevision: tampered.schema_revision }, tampered), (error) => error.code === "migration_manifest_invalid");
  assert.throws(() => manifestDigest({ bad: Number.NaN }), (error) => error.code === "migration_manifest_invalid");
  const cyclic = {}; cyclic.self = cyclic;
  assert.throws(() => manifestDigest(cyclic), (error) => error.code === "migration_manifest_invalid");
});

test("schema plan blocks same-name type/config drift and creates fixed missing fields without reverse-link recreation", async () => {
  const tableIds = Object.fromEntries(["账号台账", "选剧池", "采集数据", "发布记录"].map((name, index) => [name, `tbl-${index}`]));
  const fields = ACCOUNT_HEADERS.map((name) => ({ name, type: name === "粉丝数" ? "text" : undefined }));
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
});

test("fresh Base plan creates every fixed field in phase order and bootstraps only an empty default primary", async () => {
  const fresh = await planMigration({ google: normalizedSource(), captures: [latestCapture()], baseSchema: { revision: "new", tables: [] } });
  assert.equal(fresh.schema_actions.filter((action) => action.kind === "create_table").length, 4);
  assert.equal(fresh.schema_actions.some((action) => action.kind === "create_field" && action.field === "账号名"), true);
  assert.equal(fresh.schema_actions.some((action) => action.kind === "create_field" && action.field === { "账号台账": "账号ID", "选剧池": "剧ID", "采集数据": "Post ID", "发布记录": "发布ID" }[action.table]), false);
  assert.equal(fresh.schema_actions.some((action) => action.field === "关联发布记录"), false);
  const accountFields = fresh.schema_actions.filter((action) => action.table === "账号台账");
  assert.ok(accountFields.length > 2);

  const bootstrap = await planMigration({ google: normalizedSource(), captures: [latestCapture()], baseSchema: {
    revision: "empty-default", tables: [{ name: "账号台账", table_id: "t1", record_count: 0, fields: [{ field_id: "fld-default", name: "文本", type: "text", is_primary: true }] }],
  } });
  assert.deepEqual(bootstrap.schema_actions.find((action) => action.kind === "update_primary_field"), {
    id: "primary:账号台账:账号ID", kind: "update_primary_field", table: "账号台账", field: "账号ID", field_id: "fld-default", phase: "storage",
  });
  const unsafe = await planMigration({ google: normalizedSource(), captures: [latestCapture()], baseSchema: {
    revision: "nonempty-default", tables: [{ name: "账号台账", table_id: "t1", record_count: 1, fields: [{ field_id: "fld-default", name: "文本", type: "text", is_primary: true }] }],
  } });
  assert.equal(unsafe.blocked.some((entry) => entry.code === "base_schema_drift" && entry.field === "账号ID"), true);
});

test("release planning uses the matcher and blocks due/ambiguous/claimed evidence while allowing a truly future unlinked row", async () => {
  const google = normalizedSource();
  google.releases = [
    { ...google.releases[0], source_row: 2, 视频链接: null, "Post ID": null, 日期: "2026-08-24" },
    { ...google.releases[0], source_row: 3, 视频链接: null, "Post ID": null, 日期: "2026-08-24" },
    { ...google.releases[0], source_row: 4, 视频链接: null, "Post ID": null, 日期: "2026-09-10" },
  ];
  const captures = [latestCapture({ published_at: "2026-08-24T01:00:00Z" }), latestCapture({ post_id: "100", post_url: "https://www.tiktok.com/@dramaexpedition/video/100", published_at: "2026-08-24T02:00:00Z" })];
  const manifest = await planMigration({ google, captures, now: () => "2026-09-01T00:00:00Z" });
  assert.equal(manifest.blocked.filter((entry) => entry.code === "ambiguous_post_match").length, 2);
  assert.equal(manifest.releases[2].采集记录, null);
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

test("data apply prevalidates, bulk-syncs once per table in order, and resolves stable relations to Base v3 IDs", async () => {
  const manifest = await planMigration({ google: normalizedSource(), captures: [latestCapture()] });
  const repos = memoryRepos();
  const result = await applyMigration({
    phase: "data", repos, expectedSha256: manifest.sha256,
    sourceRevision: manifest.source_revision, schemaRevision: manifest.schema_revision,
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
    repos, expectedSha256: manifest.sha256,
    sourceRevision: manifest.source_revision, schemaRevision: manifest.schema_revision,
  }, manifest), (error) => error.code === "migration_manifest_invalid");
  assert.equal(repos.calls.length, 0);
});

test("apply rejects missing digest and source/schema drift before any write", async () => {
  const manifest = await planMigration({ google: normalizedSource(), captures: [latestCapture()] });
  for (const context of [
    { sourceRevision: manifest.source_revision, schemaRevision: manifest.schema_revision },
    { expectedSha256: manifest.sha256, sourceRevision: "changed", schemaRevision: manifest.schema_revision },
    { expectedSha256: manifest.sha256, sourceRevision: manifest.source_revision, schemaRevision: "changed" },
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
    createTable: async (table) => calls.push(["createTable", table]),
    createField: async () => { throw new Error("unexpected field action"); },
    verifySchemaAction: async (action) => { calls.push(["verifySchema", action.id]); return true; },
  };
  await assert.rejects(() => applyMigration({ phase: "schema", schemaAdapter, expectedSha256: manifest.sha256, sourceRevision: manifest.source_revision, schemaRevision: manifest.schema_revision }, manifest), (error) => error.code === "migration_context_invalid");
  assert.equal(calls.length, 0);
  const presentationAdapter = {
    createView: async (table, view) => calls.push(["view", table, view]),
    createDashboard: async (name) => calls.push(["dashboard", name]),
    verifyPresentationAction: async (action) => { calls.push(["verify", action.id]); return true; },
  };
  await assert.rejects(() => applyMigration({ phase: "presentation", presentationAdapter, expectedSha256: manifest.sha256, sourceRevision: manifest.source_revision, schemaRevision: manifest.schema_revision }, manifest), (error) => error.code === "migration_context_invalid");
  assert.equal(calls.length, 0);
});

test("schema apply resolves IDs from complete readback, updates default primary, and creates dependent links after storage", async () => {
  const manifest = await planMigration({ google: normalizedSource(), captures: [latestCapture()], baseSchema: { revision: "new", tables: [] } });
  const calls = [];
  const tables = new Map();
  const adapter = {
    createTable: async (name) => { tables.set(name, { table_id: `tbl-${name}`, fields: [{ field_id: `primary-${name}`, name: { "账号台账": "账号ID", "选剧池": "剧ID", "采集数据": "Post ID", "发布记录": "发布ID" }[name], is_primary: true }] }); calls.push(["table", name]); },
    createField: async (tableId, table, field, bindings) => {
      tables.get(table).fields.push({ field_id: `${tableId}-${field}`, name: field });
      if (table === "发布记录" && field === "剧") tables.get("选剧池").fields.push({ field_id: "reverse-drama", name: "关联发布记录" });
      if (table === "发布记录" && field === "采集记录") tables.get("采集数据").fields.push({ field_id: "reverse-capture", name: "关联发布记录" });
      calls.push(["field", table, field, bindings]);
    },
    updateField: async (...args) => calls.push(["update", ...args]),
    readSchema: async () => ({ complete: true, tables: [...tables].map(([name, value]) => ({ name, ...value })) }),
    verifySchemaAction: async () => true,
  };
  await applyMigration({ phase: "schema", schemaAdapter: adapter, expectedSha256: manifest.sha256, sourceRevision: manifest.source_revision, schemaRevision: manifest.schema_revision }, manifest);
  assert.equal(calls.some((call) => call[0] === "field" && call[2] === "账号名"), true);
  const linkCall = calls.find((call) => call[0] === "field" && call[1] === "发布记录" && call[2] === "剧");
  assert.deepEqual(linkCall[3], { targetTableId: "tbl-选剧池" });
});

test("schema apply performs an empty-table primary bootstrap and proves the renamed primary in readback", async () => {
  const baseSchema = { revision: "bootstrap", tables: [{ name: "账号台账", table_id: "tbl-account", record_count: 0, fields: [{ field_id: "fld-default", name: "文本", type: "text", is_primary: true }] }] };
  const manifest = await planMigration({ google: normalizedSource(), captures: [latestCapture()], baseSchema });
  const tables = new Map([["账号台账", structuredClone(baseSchema.tables[0])]]);
  const calls = [];
  const adapter = {
    createTable: async (name) => tables.set(name, { table_id: `tbl-${name}`, fields: [{ field_id: `primary-${name}`, name: { "选剧池": "剧ID", "采集数据": "Post ID", "发布记录": "发布ID" }[name], is_primary: true }] }),
    createField: async (tableId, table, field) => {
      tables.get(table).fields.push({ field_id: `${tableId}-${field}`, name: field });
      if (table === "发布记录" && field === "剧") tables.get("选剧池").fields.push({ field_id: "reverse-drama", name: "关联发布记录" });
      if (table === "发布记录" && field === "采集记录") tables.get("采集数据").fields.push({ field_id: "reverse-capture", name: "关联发布记录" });
    },
    updateField: async (tableId, fieldId, table, field) => { const target = tables.get(table).fields.find((item) => item.field_id === fieldId); target.name = field; calls.push([tableId, fieldId, table, field]); },
    readSchema: async () => ({ complete: true, tables: [...tables].map(([name, value]) => ({ name, ...value })) }),
    verifySchemaAction: async () => true,
  };
  await applyMigration({ phase: "schema", schemaAdapter: adapter, expectedSha256: manifest.sha256, sourceRevision: manifest.source_revision, schemaRevision: manifest.schema_revision }, manifest);
  assert.deepEqual(calls, [["tbl-account", "fld-default", "账号台账", "账号ID"]]);
  assert.equal(tables.get("账号台账").fields.some((field) => field.name === "账号ID" && field.is_primary), true);
});

test("presentation apply resolves views/dashboard, configures every view, and creates all six dashboard blocks", async () => {
  const manifest = await planMigration({ google: normalizedSource(), captures: [latestCapture()] });
  const calls = [];
  const views = new Map();
  const blocks = [];
  const adapter = {
    readSchema: async () => ({ complete: true, tables: ["账号台账", "选剧池", "采集数据", "发布记录"].map((name) => ({ name, table_id: `tbl-${name}` })) }),
    listViews: async (tableId) => ({ complete: true, items: views.get(tableId) ?? [] }),
    createView: async (tableId, _table, view) => { const created = { view_id: `view-${view}`, name: view }; views.set(tableId, [...(views.get(tableId) ?? []), created]); return created; },
    updateView: async (...args) => calls.push(["updateView", ...args]),
    listDashboards: async () => ({ complete: true, items: [] }),
    createDashboard: async () => ({ dashboard_id: "dash-1" }),
    listDashboardBlocks: async () => ({ complete: true, items: blocks }),
    createDashboardBlock: async (_dashboardId, block) => { blocks.push({ block_id: `block-${block}`, name: block }); calls.push(["block", block]); },
    verifyPresentationAction: async () => true,
  };
  await applyMigration({ phase: "presentation", presentationAdapter: adapter, expectedSha256: manifest.sha256, sourceRevision: manifest.source_revision, schemaRevision: manifest.schema_revision }, manifest);
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
    listDashboards: async () => ({ complete: true, items: [] }),
    createDashboard: async () => ({ dashboard_id: "dash" }),
    listDashboardBlocks: async () => ({ complete: true, items: [] }),
    createDashboardBlock: async () => ({ block_id: "block" }),
    verifyPresentationAction: async () => true,
  };
  await assert.rejects(() => applyMigration({ phase: "presentation", presentationAdapter: adapter, expectedSha256: manifest.sha256, sourceRevision: manifest.source_revision, schemaRevision: manifest.schema_revision }, manifest), (error) => error.code === "readback_mismatch");
});

test("verify checks exact sets, every writable value, relation IDs, extras and null versus zero", async () => {
  const manifest = await planMigration({ google: normalizedSource(), captures: [latestCapture()] });
  const repos = memoryRepos();
  await applyMigration({ repos, expectedSha256: manifest.sha256, sourceRevision: manifest.source_revision, schemaRevision: manifest.schema_revision }, manifest);
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
  await applyMigration({ repos, expectedSha256: manifest.sha256, sourceRevision: manifest.source_revision, schemaRevision: manifest.schema_revision }, manifest);
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
    phase: "sequences", expectedSha256: manifest.sha256,
    sourceRevision: manifest.source_revision, schemaRevision: manifest.schema_revision,
    seedSequence: (...args) => seeds.push(args),
  }, manifest), (error) => error.code === "migration_verification_required");
  const repos = memoryRepos();
  await applyMigration({ repos, expectedSha256: manifest.sha256, sourceRevision: manifest.source_revision, schemaRevision: manifest.schema_revision }, manifest);
  const verification = await verifyMigration({ repos, now: () => "2026-09-01T11:00:00Z" }, manifest);
  await applyMigration({
    phase: "sequences", expectedSha256: manifest.sha256,
    sourceRevision: manifest.source_revision, schemaRevision: manifest.schema_revision,
    verification, expectedVerificationSha256: verification.sha256,
    seedSequence: async (...args) => seeds.push(args),
  }, manifest);
  assert.deepEqual(seeds, [["drama", 1], ["release", 1]]);
  const bad = structuredClone(verification); bad.counts.accounts = 9;
  await assert.rejects(() => applyMigration({
    phase: "sequences", expectedSha256: manifest.sha256,
    sourceRevision: manifest.source_revision, schemaRevision: manifest.schema_revision,
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
