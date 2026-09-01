import assert from "node:assert/strict";
import { readFile, rm } from "node:fs/promises";
import test from "node:test";

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
      revisionId: "google-r1",
      properties: { timeZone: "America/Los_Angeles" },
      sheets: [
        { properties: { title: "账号台账", sheetId: 1 } },
        { properties: { title: "发布记录", sheetId: 2 } },
        { properties: { title: "选剧池", sheetId: 3 } },
        { properties: { title: "采集数据", sheetId: 4 } },
      ],
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
  assert.equal(result.raw_backup.metadata.revisionId, "google-r1");
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
    revisionId: "google-r1",
    properties: { timeZone: "Asia/Shanghai" },
    sheets: ["账号台账", "发布记录", "选剧池", "采集数据"].map((title, index) => ({ properties: { title, sheetId: index + 1 } })),
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
  assert.equal(result.capture_audit_rows, 1);
  assert.equal(JSON.stringify(result).includes("secret-token"), false);
});

test("Google reader rejects incomplete/mismatched ranges and duplicate sheet metadata", async () => {
  const metadata = {
    revisionId: "r1", properties: { timeZone: "UTC" },
    sheets: ["账号台账", "发布记录", "选剧池", "采集数据"].map((title, index) => ({ properties: { title, sheetId: index + 1 } })),
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
  assert.deepEqual(first.schema_actions.map((action) => action.table), ["账号台账", "选剧池", "采集数据", "发布记录"]);
  assert.deepEqual(first.presentation_actions.map((action) => action.name), [
    "在用账号", "需处理账号", "未排期", "已排期", "按平台", "按语言",
    "发布-已排期", "待公开", "已公开待回填", "已回填", "按账号表现", "按剧表现",
    "采集-完整", "部分缺失", "未关联发布", "短剧发行管理仪表盘",
  ]);
});

test("plan blocks duplicate identities, missing targets, and URL/account disagreement without guessing", async () => {
  const google = normalizedSource();
  google.accounts.push({ ...google.accounts[0], source_row: 4, 账号名: "@DRAMAEXPEDITION" });
  google.dramas.push({ ...google.dramas[0], source_row: 4 });
  google.releases.push({ ...google.releases[0], source_row: 5, 账号名: "missing", 剧名: "missing", 视频链接: null, "Post ID": null });
  const manifest = await planMigration({ google, captures: [latestCapture({ post_url: "https://www.tiktok.com/@other/video/99" })] });
  assert.deepEqual(new Set(manifest.blocked.map((item) => item.code)), new Set([
    "duplicate_account_key", "ambiguous_drama_key", "missing_account_target", "missing_drama_target", "source_account_mismatch",
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

test("schema and presentation phases execute only fixed typed adapters one action at a time with verification", async () => {
  const manifest = await planMigration({ google: normalizedSource(), captures: [latestCapture()] });
  const calls = [];
  const schemaAdapter = {
    createTable: async (table) => calls.push(["createTable", table]),
    createField: async () => { throw new Error("unexpected field action"); },
    verifySchemaAction: async (action) => { calls.push(["verifySchema", action.id]); return true; },
  };
  await applyMigration({ phase: "schema", schemaAdapter, expectedSha256: manifest.sha256, sourceRevision: manifest.source_revision, schemaRevision: manifest.schema_revision }, manifest);
  assert.equal(calls.length, 8);
  assert.deepEqual(calls.slice(0, 2), [["createTable", "账号台账"], ["verifySchema", "table:账号台账"]]);
  calls.length = 0;
  const presentationAdapter = {
    createView: async (table, view) => calls.push(["view", table, view]),
    createDashboard: async (name) => calls.push(["dashboard", name]),
    verifyPresentationAction: async (action) => { calls.push(["verify", action.id]); return true; },
  };
  await applyMigration({ phase: "presentation", presentationAdapter, expectedSha256: manifest.sha256, sourceRevision: manifest.source_revision, schemaRevision: manifest.schema_revision }, manifest);
  assert.equal(calls.length, 32);
  assert.deepEqual(calls.at(-2), ["dashboard", "短剧发行管理仪表盘"]);
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
  await assert.rejects(() => writeMigrationArtifact(manifest, { fileName: name }), (error) => error.code === "migration_artifact_exists");
  await assert.rejects(() => writeMigrationArtifact(manifest, { fileName: "../escape.json" }), (error) => error.code === "migration_artifact_invalid");
  await rm(written.path);
});
