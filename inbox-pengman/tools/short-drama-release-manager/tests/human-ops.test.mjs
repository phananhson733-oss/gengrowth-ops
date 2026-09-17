import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { JobStore } from "../src/job-store.mjs";
import { HumanOpsService } from "../src/human-ops.mjs";

const clone = (value) => structuredClone(value);

function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}

const pause = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

class FakeRepository {
  constructor(tableName, primaryField, rows, writes, { appToken, tableId }) {
    this.tableName = tableName;
    this.primaryField = primaryField;
    this.appToken = appToken;
    this.tableId = tableId;
    this.rows = new Map(rows.map((row) => [row.fields[primaryField], clone(row)]));
    this.writes = writes;
    this.loadCount = 0;
  }

  async loadIndex() {
    this.loadCount += 1;
    return new Map([...this.rows].map(([key, row]) => [key, clone(row)]));
  }

  async getByKey(key) {
    const row = this.rows.get(key);
    return row ? clone(row) : null;
  }

  async upsertByKey(key, patch, actorKind) {
    assert.equal(actorKind, "human");
    if (this.beforeWrite) await this.beforeWrite({ key, patch: clone(patch) });
    const existing = this.rows.get(key);
    const record = existing
      ? { ...clone(existing), fields: { ...clone(existing.fields), ...clone(patch) } }
      : { record_id: `rec-${this.tableName}-${key}`, fields: { [this.primaryField]: key, ...clone(patch) } };
    this.rows.set(key, record);
    this.writes.push({ table: this.tableName, key, patch: clone(patch) });
    return { record: clone(record), readback: "verified" };
  }
}

function fixture(options = {}) {
  const writes = [];
  const audits = [];
  let clock = new Date("2026-09-01T00:00:00Z");
  let dramaSequence = 2;
  let releaseSequence = 3;
  let receiptSequence = 0;
  const appToken = options.appToken ?? "app-base-a";
  const tableIds = options.tableIds ?? {
    accounts: "tbl-accounts-a",
    dramas: "tbl-dramas-a",
    captures: "tbl-captures-a",
    releases: "tbl-releases-a",
  };
  const accountRows = options.accountRows ?? [
    { record_id: "rec-account-one", fields: { 账号ID: "dramaexpedition", 账号名: "Drama Expedition", 状态: "active" } },
    { record_id: "rec-account-two", fields: { 账号ID: "dramaextra", 账号名: "Drama Extra", 状态: "active" } },
  ];
  const dramaRows = options.dramaRows ?? [
    { record_id: "rec-drama-one", fields: { 剧ID: "SD-000001", 剧名: "The Phantom Pilot", 推荐理由: "旧理由", 备注: null, 归档状态: "active" } },
    { record_id: "rec-drama-two", fields: { 剧ID: "SD-000002", 剧名: "Second Drama", 推荐理由: "第二条", 归档状态: "active" } },
  ];
  const releaseRows = options.releaseRows ?? [
    {
      record_id: "rec-release-one",
      fields: {
        发布ID: "SR-000001", 账号: [{ id: "rec-account-one" }], 剧: [{ id: "rec-drama-one" }],
        剧ID: "SD-000001", 播放量: 20, 点赞: 2, 收藏: 1, 转发: 0, 评论: 0, RS收益: 3,
        归档状态: "active",
      },
    },
    {
      record_id: "rec-release-two",
      fields: {
        发布ID: "SR-000002", 账号: [{ id: "rec-account-one" }], 剧: [{ id: "rec-drama-one" }],
        剧ID: "SD-000001", 播放量: 30, 点赞: 4, 收藏: 0, 转发: 1, 评论: 1, RS收益: 2,
        归档状态: "active",
      },
    },
  ];
  const capturesRows = options.captureRows ?? [];
  const repos = {
    appToken,
    accounts: new FakeRepository("账号台账", "账号ID", accountRows, writes, { appToken, tableId: tableIds.accounts }),
    dramas: new FakeRepository("选剧池", "剧ID", dramaRows, writes, { appToken, tableId: tableIds.dramas }),
    captures: new FakeRepository("采集数据", "Post ID", capturesRows, writes, { appToken, tableId: tableIds.captures }),
    releases: new FakeRepository("发布记录", "发布ID", releaseRows, writes, { appToken, tableId: tableIds.releases }),
  };
  const jobs = options.jobs ?? new JobStore(":memory:");
  const realAppendAudit = jobs.appendAudit.bind(jobs);
  jobs.appendAudit = (event) => {
    audits.push(clone(event));
    if (options.auditFails) throw new Error("audit unavailable");
    return realAppendAudit(event);
  };
  const makeServiceWithJobs = (jobStore) => new HumanOpsService({
      repos,
      jobs: jobStore,
      operators: new Set(["ou_operator"]),
      privileged: new Set(["ou_admin"]),
      now: () => new Date(clock),
      makeReceiptId: () => `sdp_00000000-0000-4000-8000-${String(++receiptSequence).padStart(12, "0")}`,
      allocateDramaId: () => `SD-${String(++dramaSequence).padStart(6, "0")}`,
      allocateReleaseId: () => `SR-${String(++releaseSequence).padStart(6, "0")}`,
    });
  const makeService = () => makeServiceWithJobs(jobs);
  const service = makeService();
  return {
    service,
    repos,
    jobs,
    writes,
    audits,
    makeService,
    makeServiceWithJobs,
    setNow(value) { clock = new Date(value); },
    close() { if (!options.jobs) jobs.close(); },
  };
}

test("constructor requires exact operational dependencies and normalized allowlists", () => {
  assert.throws(() => new HumanOpsService({}), (error) => error.code === "human_ops_config_invalid");
  const fx = fixture();
  assert.throws(() => new HumanOpsService({
    repos: fx.repos,
    jobs: fx.jobs,
    operators: new Set([" ou_operator"]),
    privileged: new Set(["ou_admin"]),
    now: () => new Date(),
    makeReceiptId: () => "sdp_00000000-0000-4000-8000-000000000001",
    allocateDramaId: () => "SD-000003",
    allocateReleaseId: () => "SR-000003",
  }), (error) => error.code === "human_ops_config_invalid");
  fx.jobs.acquireMutationLease = undefined;
  assert.throws(() => new HumanOpsService({
    repos: fx.repos,
    jobs: fx.jobs,
    operators: new Set(["ou_operator"]),
    privileged: new Set(["ou_admin"]),
    now: () => new Date(),
    makeReceiptId: () => "sdp_00000000-0000-4000-8000-000000000001",
    allocateDramaId: () => "SD-000003",
    allocateReleaseId: () => "SR-000003",
  }), (error) => error.code === "human_ops_config_invalid");
  delete fx.jobs.acquireMutationLease;
  fx.close();
});

test("query is read-only for any normalized gateway actor, complete, deterministic and cloned", async () => {
  const fx = fixture();
  const rows = await fx.service.query({
    actorId: "ou_reader",
    table: "选剧池",
    filter: { 归档状态: "active" },
    sort: { field: "剧名", direction: "desc" },
  });
  assert.deepEqual(rows.map((row) => row.剧ID), ["SD-000001", "SD-000002"]);
  assert.equal(fx.repos.dramas.loadCount, 1);
  rows[0].推荐理由 = "caller mutation";
  assert.equal(fx.repos.dramas.rows.get("SD-000001").fields.推荐理由, "旧理由");
  assert.deepEqual(fx.writes, []);
  await assert.rejects(
    () => fx.service.query({ actorId: "ou_reader", table: "选剧池", filter: () => true }),
    (error) => error.code === "query_shape_invalid",
  );
  await assert.rejects(
    () => fx.service.query({ actorId: "ou_reader", table: "选剧池", filter: { 不存在: 1 } }),
    (error) => error.code === "field_not_allowed",
  );
  await assert.rejects(
    () => fx.service.query({ actorId: "ou_reader", table: "未知表" }),
    (error) => error.code === "table_not_allowed",
  );
  fx.close();
});

test("metrics use active latest lookup values, stable IDs and preserve numeric zero", async () => {
  const fx = fixture();
  assert.deepEqual(await fx.service.queryMetrics({ actorId: "ou_reader", groupBy: "drama" }), [{
    key: "SD-000001", releases: 2, 播放量: 50, 点赞: 6, 收藏: 1, 转发: 1, 评论: 1, RS收益: 5,
  }]);
  assert.deepEqual(await fx.service.queryMetrics({ actorId: "ou_reader", groupBy: "account" }), [{
    key: "dramaexpedition", releases: 2, 播放量: 50, 点赞: 6, 收藏: 1, 转发: 1, 评论: 1, RS收益: 5,
  }]);
  assert.equal(fx.repos.accounts.loadCount, 1);
  fx.close();
});

test("metrics report missing and invalid cells as partial, never as zero or display-name groups", async () => {
  const releaseRows = [
    { record_id: "rec-r1", fields: { 发布ID: "SR-000001", 账号: [{ id: "missing-account" }], 剧ID: "SD-1", 播放量: null, 点赞: "12", 收藏: 0, 转发: 0, 评论: 0, RS收益: 0, 归档状态: "active", 账号名: "Do not group" } },
    { record_id: "rec-r2", fields: { 发布ID: "SR-000002", 账号: [{ id: "rec-account-one" }], 剧ID: "SD-1", 点赞: 1, 收藏: 0, 转发: 0, 评论: 0, RS收益: 0, 归档状态: "archived" } },
  ];
  const fx = fixture({ releaseRows });
  const byDrama = await fx.service.queryMetrics({ actorId: "ou_reader", groupBy: "drama" });
  assert.equal(byDrama.status, "partial");
  assert.deepEqual(byDrama.groups, [{
    key: "SD-1", releases: 1, 播放量: null, 点赞: null, 收藏: 0, 转发: 0, 评论: 0, RS收益: 0,
  }]);
  assert.deepEqual(byDrama.unavailable.map((item) => item.field), ["播放量", "点赞"]);
  const byAccount = await fx.service.queryMetrics({ actorId: "ou_reader", groupBy: "account" });
  assert.equal(byAccount.status, "partial");
  assert.deepEqual(byAccount.groups, []);
  assert.equal(byAccount.unavailable[0].reason, "stable_account_unavailable");
  fx.close();
});

test("metrics return explicit unavailable when a complete source index cannot be read", async () => {
  const fx = fixture();
  fx.repos.releases.loadIndex = async () => {
    const error = new Error("pagination failed");
    error.code = "base_response_incomplete";
    throw error;
  };
  assert.deepEqual(await fx.service.queryMetrics({ actorId: "ou_reader", groupBy: "drama" }), {
    status: "unavailable",
    groups: [],
    unavailable: [{ reason: "release_index_unavailable", error_code: "base_response_incomplete" }],
  });
  fx.close();
});

test("single-field reversible write is gated, verified and audited; no-op is not audited", async () => {
  const fx = fixture();
  await assert.rejects(
    () => fx.service.applySingleField({ actorId: "ou_reader", chatId: "oc_social", table: "选剧池", key: "SD-000001", field: "推荐理由", value: "新" }),
    (error) => error.code === "actor_write_denied",
  );
  await assert.rejects(
    () => fx.service.applySingleField({ actorId: "ou_operator", chatId: "oc_social", table: "选剧池", key: "SD-000001", field: "剧ID", value: "SD-9" }),
    (error) => error.code === "field_owner_violation",
  );
  await assert.rejects(
    () => fx.service.applySingleField({ actorId: "ou_operator", chatId: "oc_social", table: "发布记录", key: "SR-000001", field: "播放量", value: 99 }),
    (error) => error.code === "field_owner_violation",
  );
  await assert.rejects(
    () => fx.service.applySingleField({ actorId: "ou_operator", chatId: "oc_social", table: "选剧池", key: "The Phantom Pilot", field: "推荐理由", value: "不得按名称直写" }),
    (error) => error.code === "business_record_not_found",
  );
  const result = await fx.service.applySingleField({
    actorId: "ou_operator", chatId: "oc_social", table: "选剧池", key: "SD-000001", field: "推荐理由", value: "人工新理由",
  });
  assert.deepEqual(result, {
    status: "success", actor: "ou_operator", record_id: "SD-000001",
    changed_fields: [{
      record_id: "SD-000001",
      fields: {
        推荐理由: {
          before: { present: true, value: "旧理由" },
          after: { present: true, value: "人工新理由" },
          readback: { present: true, value: "人工新理由" },
        },
      },
    }],
    readback: "verified", next_step: "none",
  });
  assert.equal(fx.repos.dramas.rows.get("SD-000001").fields.推荐理由, "人工新理由");
  assert.deepEqual(fx.audits[0].before, { 推荐理由: { present: true, value: "旧理由" } });
  assert.deepEqual(fx.audits[0].after, { 推荐理由: { present: true, value: "人工新理由" } });
  assert.deepEqual(fx.audits[0].readback, { 推荐理由: { present: true, value: "人工新理由" } });
  const noOp = await fx.service.applySingleField({
    actorId: "ou_operator", chatId: "oc_social", table: "选剧池", key: "SD-000001", field: "推荐理由", value: "人工新理由",
  });
  assert.equal(noOp.status, "unchanged");
  assert.deepEqual(noOp.changed_fields, []);
  assert.equal(fx.audits.length, 1);
  assert.equal(fx.writes.length, 1);
  fx.close();
});

test("create reserves drama ID at preview, writes nothing, clones input and applies once", async () => {
  const fx = fixture();
  const patch = { 剧名: "New Drama", 平台: "ReelShort", 推荐人: ["彭满"] };
  const preview = await fx.service.previewMutation({
    actorId: "ou_operator", chatId: "oc_social", action: "create", table: "选剧池", patch,
  });
  assert.equal(preview.status, "preview");
  assert.equal(preview.record_id, "SD-000003");
  assert.equal(preview.expires_at, "2026-09-01T00:15:00.000Z");
  assert.equal(preview.patch.归档状态, "active");
  assert.deepEqual(fx.writes, []);
  patch.剧名 = "caller changed";
  const result = await fx.service.applyPreview({ actorId: "ou_operator", chatId: "oc_social", receiptId: preview.receipt_id });
  assert.equal(result.record_id, "SD-000003");
  assert.equal(fx.repos.dramas.rows.get("SD-000003").fields.剧名, "New Drama");
  assert.deepEqual(result.changed_fields[0].fields.归档状态, {
    before: { present: false },
    after: { present: true, value: "active" },
    readback: { present: true, value: "active" },
  });
  assert.deepEqual(fx.audits[0].before.归档状态, { present: false });
  await assert.rejects(
    () => fx.service.applyPreview({ actorId: "ou_operator", chatId: "oc_social", receiptId: preview.receipt_id }),
    (error) => error.code === "preview_used",
  );
  fx.close();
});

test("preview snapshots caller input before its first asynchronous repository read", async () => {
  const fx = fixture();
  const originalLoad = fx.repos.dramas.loadIndex.bind(fx.repos.dramas);
  let releaseLoad;
  const gate = new Promise((resolve) => { releaseLoad = resolve; });
  fx.repos.dramas.loadIndex = async () => {
    await gate;
    return originalLoad();
  };
  const request = {
    actorId: "ou_operator", chatId: "oc_social", action: "create", table: "选剧池",
    patch: { 剧名: "Boundary Snapshot", 推荐人: ["彭满"] },
  };
  const pending = fx.service.previewMutation(request);
  request.patch.剧名 = "late mutation";
  request.patch.推荐人[0] = "高璇";
  releaseLoad();
  const preview = await pending;
  await fx.service.applyPreview({ actorId: "ou_operator", chatId: "oc_social", receiptId: preview.receipt_id });
  assert.equal(fx.repos.dramas.rows.get(preview.record_id).fields.剧名, "Boundary Snapshot");
  assert.deepEqual(fx.repos.dramas.rows.get(preview.record_id).fields.推荐人, ["彭满"]);
  fx.close();
});

test("abandoned create preview reserves a gap and release create resolves stable relations internally", async () => {
  const fx = fixture();
  const abandoned = await fx.service.previewMutation({
    actorId: "ou_operator", chatId: "oc_social", action: "create", table: "选剧池", patch: { 剧名: "Abandoned" },
  });
  const next = await fx.service.previewMutation({
    actorId: "ou_operator", chatId: "oc_social", action: "create", table: "选剧池", patch: { 剧名: "Next" },
  });
  assert.equal(abandoned.record_id, "SD-000003");
  assert.equal(next.record_id, "SD-000004");
  const release = await fx.service.previewMutation({
    actorId: "ou_operator", chatId: "oc_social", action: "create", table: "发布记录",
    patch: { 日期: "2026-09-02T08:00:00+08:00", 账号: "dramaexpedition", 剧: "The Phantom Pilot", 备注: "scheduled" },
  });
  await fx.service.applyPreview({ actorId: "ou_operator", chatId: "oc_social", receiptId: release.receipt_id });
  const row = fx.repos.releases.rows.get(release.record_id);
  assert.deepEqual(row.fields.账号, [{ id: "rec-account-one" }]);
  assert.deepEqual(row.fields.剧, [{ id: "rec-drama-one" }]);
  await assert.rejects(
    () => fx.service.previewMutation({
      actorId: "ou_operator", chatId: "oc_social", action: "create", table: "发布记录",
      patch: { 日期: "2026-09-02T08:00:00+08:00", 账号: [{ id: "rec-account-one" }], 剧: "SD-000001" },
    }),
    (error) => error.code === "relation_value_invalid",
  );
  fx.close();
});

test("invalid create requests do not consume a business ID reservation", async () => {
  const fx = fixture();
  await assert.rejects(
    () => fx.service.previewMutation({
      actorId: "ou_operator", chatId: "oc_social", action: "create", table: "选剧池", patch: { 备注: "missing name" },
    }),
    (error) => error.code === "mutation_shape_invalid",
  );
  const preview = await fx.service.previewMutation({
    actorId: "ou_operator", chatId: "oc_social", action: "create", table: "选剧池", patch: { 剧名: "First Valid" },
  });
  assert.equal(preview.record_id, "SD-000003");
  fx.close();
});

test("human date and datetime inputs reject invalid calendars before preview allocation or writes", async () => {
  const fx = fixture();
  for (const value of ["2026-02-30", "2026-2-03", "2026-13-01", "not-a-date"]) {
    await assert.rejects(
      () => fx.service.applySingleField({
        actorId: "ou_operator", chatId: "oc_social", table: "选剧池",
        key: "SD-000001", field: "上线日期", value,
      }),
      (error) => error.code === "mutation_value_invalid",
    );
  }
  for (const value of ["2026-02-30T08:00:00+08:00", "2026-09-02 08:00", "2026-09-02T08:00:00", "tomorrow"] ) {
    await assert.rejects(
      () => fx.service.previewMutation({
        actorId: "ou_operator", chatId: "oc_social", action: "create", table: "发布记录",
        patch: { 日期: value, 账号: "dramaexpedition", 剧: "SD-000001" },
      }),
      (error) => error.code === "mutation_value_invalid",
    );
  }
  await assert.rejects(
    () => fx.service.previewMutation({
      actorId: "ou_operator", chatId: "oc_social", action: "batch_update", table: "选剧池",
      items: [{ key: "SD-000001", patch: { 上线日期: "2026-02-30" } }],
    }),
    (error) => error.code === "mutation_value_invalid",
  );
  assert.deepEqual(fx.writes, []);
  const valid = await fx.service.previewMutation({
    actorId: "ou_operator", chatId: "oc_social", action: "create", table: "发布记录",
    patch: { 日期: "2026-09-02T08:00:00+08:00", 账号: "dramaexpedition", 剧: "SD-000001" },
  });
  assert.equal(valid.record_id, "SR-000004");
  assert.equal(valid.patch.日期, "2026-09-02T00:00:00.000Z");
  fx.close();
});

test("fixed option enums and drama-name invariants apply to direct, create, batch, and stored writes", async () => {
  const fx = fixture();
  await assert.rejects(
    () => fx.service.applySingleField({
      actorId: "ou_operator", chatId: "oc_social", table: "选剧池", key: "SD-000001", field: "平台", value: "InjectedPlatform",
    }),
    (error) => error.code === "mutation_value_invalid",
  );
  for (const patch of [
    { 剧名: " ", 平台: "ReelShort" },
    { 剧名: null, 平台: "ReelShort" },
    { 剧名: "Valid", 平台: "InjectedPlatform" },
    { 剧名: "Valid", 推荐人: ["Unknown"] },
  ]) {
    await assert.rejects(
      () => fx.service.previewMutation({ actorId: "ou_operator", chatId: "oc_social", action: "create", table: "选剧池", patch }),
      (error) => error.code === "mutation_value_invalid",
    );
  }
  await assert.rejects(
    () => fx.service.previewMutation({
      actorId: "ou_operator", chatId: "oc_social", action: "batch_update", table: "选剧池",
      items: [{ key: "SD-000001", patch: { 平台: "InjectedPlatform" } }],
    }),
    (error) => error.code === "mutation_value_invalid",
  );
  fx.repos.dramas.rows.get("SD-000001").fields.剧名 = null;
  await assert.rejects(
    () => fx.service.applySingleField({
      actorId: "ou_operator", chatId: "oc_social", table: "选剧池", key: "SD-000001", field: "备注", value: "blocked",
    }),
    (error) => error.code === "mutation_value_invalid",
  );
  fx.repos.dramas.rows.get("SD-000001").fields.剧名 = "Restored";
  const preview = await fx.service.previewMutation({
    actorId: "ou_operator", chatId: "oc_social", action: "update", table: "选剧池", key: "SD-000001", patch: { 平台: "ReelShort" },
  });
  const receipt = fx.jobs.getPreview(preview.receipt_id);
  receipt.patch.targets[0].patch.平台 = "InjectedPlatform";
  fx.jobs.db.prepare("UPDATE preview_receipts SET patch_json = ? WHERE receipt_id = ?").run(JSON.stringify(receipt.patch), preview.receipt_id);
  await assert.rejects(
    () => fx.service.applyPreview({ actorId: "ou_operator", chatId: "oc_social", receiptId: preview.receipt_id }),
    (error) => error.code === "mutation_value_invalid",
  );
  assert.deepEqual(fx.writes, []);
  fx.close();
});

test("date-only release scheduling stays date-only and qualified instants normalize deterministically", async () => {
  const fx = fixture();
  const dateOnly = await fx.service.previewMutation({
    actorId: "ou_operator", chatId: "oc_social", action: "create", table: "发布记录",
    patch: { 日期: "2026-09-02", 账号: "dramaexpedition", 剧: "SD-000001" },
  });
  assert.equal(dateOnly.patch.日期, "2026-09-02");
  const updated = await fx.service.applySingleField({
    actorId: "ou_operator", chatId: "oc_social", table: "发布记录",
    key: "SR-000001", field: "日期", value: "2026-09-03T08:00:00+08:00",
  });
  assert.equal(fx.repos.releases.rows.get("SR-000001").fields.日期, "2026-09-03T00:00:00.000Z");
  assert.equal(updated.changed_fields[0].fields.日期.after.value, "2026-09-03T00:00:00.000Z");
  fx.close();
});

test("persisted datetime previews must remain in canonical storage form before consume", async () => {
  const fx = fixture();
  const preview = await fx.service.previewMutation({
    actorId: "ou_operator", chatId: "oc_social", action: "update", table: "发布记录",
    key: "SR-000001", patch: { 日期: "2026-09-03T08:00:00+08:00" },
  });
  const receipt = fx.jobs.getPreview(preview.receipt_id);
  receipt.patch.targets[0].patch.日期 = "2026-09-03T08:00:00+08:00";
  fx.jobs.db.prepare("UPDATE preview_receipts SET patch_json = ? WHERE receipt_id = ?")
    .run(JSON.stringify(receipt.patch), preview.receipt_id);
  await assert.rejects(
    () => fx.service.applyPreview({ actorId: "ou_operator", chatId: "oc_social", receiptId: preview.receipt_id }),
    (error) => error.code === "preview_payload_invalid",
  );
  assert.equal(fx.jobs.getPreview(preview.receipt_id).used_at, null);
  assert.deepEqual(fx.writes, []);
  fx.close();
});

test("account create requires explicit canonical ID and all creates detect collision before and after preview", async () => {
  const fx = fixture();
  await assert.rejects(
    () => fx.service.previewMutation({ actorId: "ou_operator", chatId: "oc_social", action: "create", table: "账号台账", patch: { 账号名: "Missing ID" } }),
    (error) => error.code === "account_id_required",
  );
  await assert.rejects(
    () => fx.service.previewMutation({ actorId: "ou_operator", chatId: "oc_social", action: "create", table: "账号台账", key: "dramaexpedition", patch: { 账号名: "Duplicate" } }),
    (error) => error.code === "business_key_conflict",
  );
  const preview = await fx.service.previewMutation({
    actorId: "ou_operator", chatId: "oc_social", action: "create", table: "账号台账", key: "newaccount", patch: { 账号名: "New Account" },
  });
  await fx.repos.accounts.upsertByKey("newaccount", { 账号名: "Concurrent" }, "human");
  const writesBeforeApply = fx.writes.length;
  await assert.rejects(
    () => fx.service.applyPreview({ actorId: "ou_operator", chatId: "oc_social", receiptId: preview.receipt_id }),
    (error) => error.code === "preview_stale",
  );
  assert.equal(fx.writes.length, writesBeforeApply);
  fx.close();
});

test("update name resolution is exact-first and fails closed on ambiguous candidates", async () => {
  const duplicate = [
    { record_id: "rec-d1", fields: { 剧ID: "SD-000001", 剧名: "Same", 备注: "one", 归档状态: "active" } },
    { record_id: "rec-d2", fields: { 剧ID: "SD-000002", 剧名: "Same", 备注: "two", 归档状态: "active" } },
  ];
  const fx = fixture({ dramaRows: duplicate });
  await assert.rejects(
    () => fx.service.previewMutation({ actorId: "ou_operator", chatId: "oc_social", action: "update", table: "选剧池", key: "Same", patch: { 备注: "new" } }),
    (error) => error.code === "ambiguous_business_key" &&
      JSON.stringify(error.details.candidates) === JSON.stringify(["SD-000001", "SD-000002"]),
  );
  await assert.rejects(
    () => fx.service.previewMutation({ actorId: "ou_operator", chatId: "oc_social", action: "update", table: "发布记录", key: "not-a-release-id", patch: { 备注: "new" } }),
    (error) => error.code === "business_record_not_found",
  );
  assert.deepEqual(fx.writes, []);
  fx.close();
});

test("preview is actor/chat/expiry bound and stale target prevents Base writes", async () => {
  const fx = fixture();
  const actorBound = await fx.service.previewMutation({ actorId: "ou_operator", chatId: "oc_social", action: "update", table: "选剧池", key: "SD-000001", patch: { 备注: "new" } });
  await assert.rejects(
    () => fx.service.applyPreview({ actorId: "ou_admin", chatId: "oc_social", receiptId: actorBound.receipt_id }),
    (error) => error.code === "preview_actor_mismatch",
  );
  await assert.rejects(
    () => fx.service.applyPreview({ actorId: "ou_operator", chatId: "oc_other", receiptId: actorBound.receipt_id }),
    (error) => error.code === "preview_chat_mismatch",
  );
  fx.repos.dramas.rows.get("SD-000001").fields.备注 = "concurrent";
  await assert.rejects(
    () => fx.service.applyPreview({ actorId: "ou_operator", chatId: "oc_social", receiptId: actorBound.receipt_id }),
    (error) => error.code === "preview_stale",
  );
  assert.deepEqual(fx.writes, []);

  const expired = await fx.service.previewMutation({ actorId: "ou_operator", chatId: "oc_social", action: "update", table: "选剧池", key: "SD-000002", patch: { 备注: "later" } });
  fx.setNow("2026-09-01T00:15:00Z");
  await assert.rejects(
    () => fx.service.applyPreview({ actorId: "ou_operator", chatId: "oc_social", receiptId: expired.receipt_id }),
    (error) => error.code === "preview_expired",
  );
  assert.deepEqual(fx.writes, []);
  fx.close();
});

test("canonical receipt hash distinguishes null, missing and zero and rejects unsafe values", async () => {
  const fx = fixture();
  const fromNull = await fx.service.previewMutation({ actorId: "ou_operator", chatId: "oc_social", action: "update", table: "选剧池", key: "SD-000001", patch: { 备注: "new" } });
  delete fx.repos.dramas.rows.get("SD-000001").fields.备注;
  await assert.rejects(
    () => fx.service.applyPreview({ actorId: "ou_operator", chatId: "oc_social", receiptId: fromNull.receipt_id }),
    (error) => error.code === "preview_stale",
  );
  fx.repos.dramas.rows.get("SD-000001").fields.备注 = 0;
  const fromZero = await fx.service.previewMutation({ actorId: "ou_operator", chatId: "oc_social", action: "update", table: "选剧池", key: "SD-000001", patch: { 备注: "newer" } });
  delete fx.repos.dramas.rows.get("SD-000001").fields.备注;
  await assert.rejects(
    () => fx.service.applyPreview({ actorId: "ou_operator", chatId: "oc_social", receiptId: fromZero.receipt_id }),
    (error) => error.code === "preview_stale",
  );
  await assert.rejects(
    () => fx.service.previewMutation({ actorId: "ou_operator", chatId: "oc_social", action: "update", table: "选剧池", key: "SD-000002", patch: { 备注: () => "unsafe" } }),
    (error) => error.code === "mutation_value_invalid",
  );
  const cyclic = {};
  cyclic.self = cyclic;
  await assert.rejects(
    () => fx.service.previewMutation({ actorId: "ou_operator", chatId: "oc_social", action: "update", table: "选剧池", key: "SD-000002", patch: { 备注: cyclic } }),
    (error) => error.code === "mutation_value_invalid",
  );
  fx.close();
});

test("apply validates every internally resolved relation before consuming or writing", async () => {
  const fx = fixture();
  const preview = await fx.service.previewMutation({
    actorId: "ou_operator", chatId: "oc_social", action: "create", table: "发布记录",
    patch: { 日期: "2026-09-02T08:00:00+08:00", 账号: "dramaexpedition", 剧: "SD-000001" },
  });
  fx.repos.accounts.rows.delete("dramaexpedition");
  await assert.rejects(
    () => fx.service.applyPreview({ actorId: "ou_operator", chatId: "oc_social", receiptId: preview.receipt_id }),
    (error) => error.code === "relation_target_not_found",
  );
  assert.deepEqual(fx.writes, []);
  assert.equal(fx.jobs.getPreview(preview.receipt_id).used_at, null);
  fx.close();
});

test("attach-post is release-only, validates exact TikTok URL ownership and uniqueness", async () => {
  const fx = fixture();
  const valid = await fx.service.previewMutation({
    actorId: "ou_operator", chatId: "oc_social", action: "attach-post", table: "发布记录", key: "SR-000001",
    patch: { 视频链接: "https://www.tiktok.com/@dramaexpedition/video/777", "Post ID": "777" },
  });
  const applied = await fx.service.applyPreview({ actorId: "ou_operator", chatId: "oc_social", receiptId: valid.receipt_id });
  assert.deepEqual(Object.keys(applied.changed_fields[0].fields), ["Post ID", "视频链接"]);
  await assert.rejects(
    () => fx.service.previewMutation({ actorId: "ou_operator", chatId: "oc_social", action: "attach-post", table: "选剧池", key: "SD-000001", patch: { 视频链接: "https://www.tiktok.com/@dramaexpedition/video/888", "Post ID": "888" } }),
    (error) => error.code === "mutation_action_invalid",
  );
  await assert.rejects(
    () => fx.service.previewMutation({ actorId: "ou_operator", chatId: "oc_social", action: "attach-post", table: "发布记录", key: "SR-000002", patch: { 视频链接: "https://www.tiktok.com/@wrong/video/888", "Post ID": "888" } }),
    (error) => error.code === "post_account_mismatch",
  );
  await assert.rejects(
    () => fx.service.previewMutation({ actorId: "ou_operator", chatId: "oc_social", action: "attach-post", table: "发布记录", key: "SR-000002", patch: { 视频链接: "https://www.tiktok.com/@dramaexpedition/photo/999", "Post ID": "777" } }),
    (error) => error.code === "post_id_mismatch",
  );
  await assert.rejects(
    () => fx.service.previewMutation({ actorId: "ou_operator", chatId: "oc_social", action: "attach-post", table: "发布记录", key: "SR-000002", patch: { 视频链接: "https://www.tiktok.com/@dramaexpedition/video/777", "Post ID": "777" } }),
    (error) => error.code === "post_id_claimed",
  );
  fx.close();
});

test("attach-post enforces Post ID uniqueness across archived releases", async () => {
  const fx = fixture({ releaseRows: [
    { record_id: "rec-active", fields: { 发布ID: "SR-000001", 账号: [{ id: "rec-account-one" }], 归档状态: "active" } },
    { record_id: "rec-archived", fields: { 发布ID: "SR-000002", 账号: [{ id: "rec-account-one" }], "Post ID": "777", 归档状态: "archived" } },
  ] });
  await assert.rejects(
    () => fx.service.previewMutation({
      actorId: "ou_operator", chatId: "oc_social", action: "attach-post", table: "发布记录", key: "SR-000001",
      patch: { 视频链接: "https://www.tiktok.com/@dramaexpedition/video/777", "Post ID": "777" },
    }),
    (error) => error.code === "post_id_claimed" && error.details.release_id === "SR-000002",
  );
  assert.deepEqual(fx.writes, []);
  fx.close();
});

test("batch update validates every item and permits exact archive patches only for privileged actors", async () => {
  const fx = fixture();
  await assert.rejects(
    () => fx.service.previewMutation({
      actorId: "ou_operator", chatId: "oc_social", action: "batch_update", table: "选剧池",
      items: [
        { key: "SD-000001", patch: { 备注: "valid" } },
        { key: "missing", patch: { 备注: "invalid" } },
      ],
    }),
    (error) => error.code === "business_record_not_found",
  );
  assert.deepEqual(fx.writes, []);
  await assert.rejects(
    () => fx.service.previewMutation({
      actorId: "ou_operator", chatId: "oc_social", action: "batch_update", table: "选剧池",
      items: [{ key: "SD-000001", patch: { 归档状态: "archived" } }, { key: "SD-000002", patch: { 归档状态: "archived" } }],
    }),
    (error) => error.code === "privileged_required",
  );
  const preview = await fx.service.previewMutation({
    actorId: "ou_admin", chatId: "oc_social", action: "batch_update", table: "选剧池",
    items: [{ key: "SD-000002", patch: { 备注: "two" } }, { key: "SD-000001", patch: { 归档状态: "archived" } }],
  });
  const result = await fx.service.applyPreview({ actorId: "ou_admin", chatId: "oc_social", receiptId: preview.receipt_id });
  assert.equal(result.status, "success");
  assert.equal(result.receipt_id, preview.receipt_id);
  assert.deepEqual(result.record_id, ["SD-000001", "SD-000002"]);
  assert.deepEqual(result.changed_fields.map((item) => item.record_id), ["SD-000001", "SD-000002"]);
  assert.deepEqual(result.changed_fields.map((item) => Object.keys(item.fields)), [["归档状态"], ["备注"]]);
  assert.equal(fx.repos.dramas.rows.get("SD-000001").fields.归档状态, "archived");
  assert.equal(fx.audits.length, 2);
  fx.close();
});

test("persisted batch archive envelopes recheck privilege and exact patch shape before consume", async () => {
  const operator = fixture();
  const operatorPreview = await operator.service.previewMutation({
    actorId: "ou_operator", chatId: "oc_social", action: "batch_update", table: "选剧池",
    items: [{ key: "SD-000001", patch: { 备注: "safe" } }],
  });
  const operatorReceipt = operator.jobs.getPreview(operatorPreview.receipt_id);
  operatorReceipt.patch.targets[0].patch = { 归档状态: "archived" };
  operator.jobs.db.prepare("UPDATE preview_receipts SET patch_json = ? WHERE receipt_id = ?")
    .run(JSON.stringify(operatorReceipt.patch), operatorPreview.receipt_id);
  await assert.rejects(
    () => operator.service.applyPreview({ actorId: "ou_operator", chatId: "oc_social", receiptId: operatorPreview.receipt_id }),
    (error) => error.code === "privileged_required",
  );
  assert.equal(operator.jobs.getPreview(operatorPreview.receipt_id).used_at, null);
  assert.deepEqual(operator.writes, []);
  operator.close();

  const admin = fixture();
  const adminPreview = await admin.service.previewMutation({
    actorId: "ou_admin", chatId: "oc_social", action: "batch_update", table: "选剧池",
    items: [{ key: "SD-000001", patch: { 归档状态: "archived" } }],
  });
  const adminReceipt = admin.jobs.getPreview(adminPreview.receipt_id);
  adminReceipt.patch.targets[0].patch = { 归档状态: "archived", 备注: "smuggled" };
  admin.jobs.db.prepare("UPDATE preview_receipts SET patch_json = ? WHERE receipt_id = ?")
    .run(JSON.stringify(adminReceipt.patch), adminPreview.receipt_id);
  await assert.rejects(
    () => admin.service.applyPreview({ actorId: "ou_admin", chatId: "oc_social", receiptId: adminPreview.receipt_id }),
    (error) => error.code === "preview_payload_invalid",
  );
  assert.equal(admin.jobs.getPreview(adminPreview.receipt_id).used_at, null);
  assert.deepEqual(admin.writes, []);
  admin.close();
});

test("archive is previewed, writes only archived state, and service exposes no delete executor", async () => {
  const fx = fixture();
  assert.equal("delete" in fx.service, false);
  assert.equal("execute" in fx.service, false);
  const preview = await fx.service.previewArchive({ actorId: "ou_operator", chatId: "oc_social", table: "选剧池", key: "The Phantom Pilot" });
  const result = await fx.service.applyArchive({ actorId: "ou_operator", chatId: "oc_social", receiptId: preview.receipt_id });
  assert.equal(result.receipt_id, preview.receipt_id);
  assert.deepEqual(Object.keys(result.changed_fields[0].fields), ["归档状态"]);
  assert.equal(fx.repos.dramas.rows.get("SD-000001").fields.归档状态, "archived");
  assert.deepEqual(fx.writes[0].patch, { 归档状态: "archived" });
  await assert.rejects(
    () => fx.service.previewArchive({ actorId: "ou_operator", chatId: "oc_social", table: "账号台账", key: "dramaexpedition" }),
    (error) => error.code === "mutation_action_invalid",
  );
  fx.close();
});

test("unknown request and envelope keys fail closed and audit failure cannot report success", async () => {
  const fx = fixture({ auditFails: true });
  await assert.rejects(
    () => fx.service.previewMutation({ actorId: "ou_operator", chatId: "oc_social", action: "update", table: "选剧池", key: "SD-000001", patch: { 备注: "new" }, command: "arbitrary" }),
    (error) => error.code === "mutation_shape_invalid",
  );
  const preview = await fx.service.previewMutation({ actorId: "ou_operator", chatId: "oc_social", action: "update", table: "选剧池", key: "SD-000001", patch: { 备注: "new" } });
  await assert.rejects(
    () => fx.service.applyPreview({ actorId: "ou_operator", chatId: "oc_social", receiptId: preview.receipt_id }),
    /audit unavailable/,
  );
  assert.equal(fx.repos.dramas.rows.get("SD-000001").fields.备注, "new");
  fx.close();
});

test("query sorts finite numbers numerically with a deterministic tie break", async () => {
  const releaseRows = [
    { record_id: "rec-r100", fields: { 发布ID: "SR-000100", 播放量: 100, 归档状态: "active" } },
    { record_id: "rec-r20", fields: { 发布ID: "SR-000020", 播放量: 20, 归档状态: "active" } },
  ];
  const fx = fixture({ releaseRows });
  const rows = await fx.service.query({
    actorId: "ou_reader", table: "发布记录", sort: { field: "播放量", direction: "asc" },
  });
  assert.deepEqual(rows.map((row) => row.播放量), [20, 100]);
  fx.close();
});

test("metrics skip only archived rows and expose missing or invalid archive state", async () => {
  const metricFields = { 剧ID: "SD-1", 播放量: 1, 点赞: 2, 收藏: 3, 转发: 4, 评论: 5, RS收益: 6 };
  const releaseRows = [
    { record_id: "rec-active", fields: { 发布ID: "SR-000001", ...metricFields, 归档状态: "active" } },
    { record_id: "rec-archived", fields: { 发布ID: "SR-000002", ...metricFields, 归档状态: "archived" } },
    { record_id: "rec-missing", fields: { 发布ID: "SR-000003", ...metricFields } },
    { record_id: "rec-unknown", fields: { 发布ID: "SR-000004", ...metricFields, 归档状态: "paused" } },
    { record_id: "rec-null", fields: { 发布ID: "SR-000005", ...metricFields, 归档状态: null } },
  ];
  const fx = fixture({ releaseRows });
  const result = await fx.service.queryMetrics({ actorId: "ou_reader", groupBy: "drama" });
  assert.equal(result.status, "partial");
  assert.deepEqual(result.groups, [{
    key: "SD-1", releases: 1, 播放量: 1, 点赞: 2, 收藏: 3, 转发: 4, 评论: 5, RS收益: 6,
  }]);
  assert.deepEqual(result.unavailable, [
    { record_id: "SR-000003", field: "归档状态", reason: "archive_state_missing" },
    { record_id: "SR-000004", field: "归档状态", reason: "archive_state_invalid" },
    { record_id: "SR-000005", field: "归档状态", reason: "archive_state_invalid" },
  ]);
  fx.close();
});

test("protected fields are reachable only through fixed archive and attach-post actions", async () => {
  const fx = fixture();
  const singleRequests = [
    { table: "选剧池", key: "SD-000001", field: "归档状态", value: "archived" },
    { table: "发布记录", key: "SR-000001", field: "Post ID", value: "777" },
    { table: "发布记录", key: "SR-000001", field: "视频链接", value: "https://www.tiktok.com/@dramaexpedition/video/777" },
  ];
  for (const request of singleRequests) {
    await assert.rejects(
      () => fx.service.applySingleField({ actorId: "ou_operator", chatId: "oc_social", ...request }),
      (error) => error.code === "field_action_violation",
    );
  }
  const previewRequests = [
    { expected: "field_action_violation", action: "update", table: "选剧池", key: "SD-000001", patch: { 归档状态: "archived" } },
    { expected: "field_action_violation", action: "update", table: "发布记录", key: "SR-000001", patch: { "Post ID": "777", 视频链接: "https://www.tiktok.com/@dramaexpedition/video/777" } },
    { expected: "privileged_required", action: "batch_update", table: "选剧池", items: [{ key: "SD-000001", patch: { 归档状态: "archived" } }] },
    { expected: "field_action_violation", action: "create", table: "选剧池", patch: { 剧名: "Manual state", 归档状态: "active" } },
    { expected: "field_action_violation", action: "create", table: "发布记录", patch: { 日期: "2026-09-02T08:00:00+08:00", 账号: "dramaexpedition", 剧: "SD-000001", "Post ID": "777", 视频链接: "https://www.tiktok.com/@dramaexpedition/video/777" } },
  ];
  for (const request of previewRequests) {
    const { expected, ...input } = request;
    await assert.rejects(
      () => fx.service.previewMutation({ actorId: "ou_operator", chatId: "oc_social", ...input }),
      (error) => error.code === expected,
    );
  }
  assert.deepEqual(fx.writes, []);
  fx.close();
});

test("stored envelopes cannot bypass protected action fields and remain unconsumed", async () => {
  const fx = fixture();
  const cases = [
    { table: "选剧池", key: "SD-000001", patch: { 归档状态: "archived" } },
    { table: "发布记录", key: "SR-000001", patch: { "Post ID": "777", 视频链接: "https://www.tiktok.com/@dramaexpedition/video/777" } },
  ];
  for (const item of cases) {
    const preview = await fx.service.previewMutation({
      actorId: "ou_operator", chatId: "oc_social", action: "update", table: item.table, key: item.key, patch: { 备注: "safe" },
    });
    const receipt = fx.jobs.getPreview(preview.receipt_id);
    receipt.patch.targets[0].patch = item.patch;
    fx.jobs.db.prepare("UPDATE preview_receipts SET patch_json = ? WHERE receipt_id = ?")
      .run(JSON.stringify(receipt.patch), preview.receipt_id);
    await assert.rejects(
      () => fx.service.applyPreview({ actorId: "ou_operator", chatId: "oc_social", receiptId: preview.receipt_id }),
      (error) => error.code === "preview_payload_invalid",
    );
    assert.equal(fx.jobs.getPreview(preview.receipt_id).used_at, null);
  }
  assert.deepEqual(fx.writes, []);
  fx.close();
});

test("release create injects active state and reports every changed cell deterministically", async () => {
  const fx = fixture();
  const preview = await fx.service.previewMutation({
    actorId: "ou_operator", chatId: "oc_social", action: "create", table: "发布记录",
    patch: { 日期: "2026-09-02T08:00:00+08:00", 账号: "dramaexpedition", 剧: "SD-000001", 备注: "new" },
  });
  assert.equal(preview.patch.归档状态, "active");
  const result = await fx.service.applyPreview({ actorId: "ou_operator", chatId: "oc_social", receiptId: preview.receipt_id });
  assert.deepEqual(Object.keys(result.changed_fields[0].fields), ["剧", "备注", "归档状态", "日期", "账号"]);
  for (const detail of Object.values(result.changed_fields[0].fields)) {
    assert.deepEqual(detail.before, { present: false });
    assert.equal(detail.after.present, true);
    assert.deepEqual(detail.readback, detail.after);
  }
  assert.equal(fx.repos.releases.rows.get(preview.record_id).fields.归档状态, "active");
  fx.close();
});

test("single-field audit and result distinguish a missing cell from explicit null", async () => {
  const fx = fixture();
  const missing = await fx.service.applySingleField({
    actorId: "ou_operator", chatId: "oc_social", table: "选剧池", key: "SD-000002", field: "备注", value: "now present",
  });
  assert.deepEqual(missing.changed_fields[0].fields.备注.before, { present: false });
  assert.deepEqual(fx.audits[0].before.备注, { present: false });
  const explicitNull = await fx.service.applySingleField({
    actorId: "ou_operator", chatId: "oc_social", table: "选剧池", key: "SD-000001", field: "备注", value: "from null",
  });
  assert.deepEqual(explicitNull.changed_fields[0].fields.备注.before, { present: true, value: null });
  assert.deepEqual(fx.audits[1].before.备注, { present: true, value: null });
  fx.close();
});

test("changed cell state preserves numeric zero exactly", async () => {
  const fx = fixture();
  fx.repos.releases.rows.get("SR-000001").fields.RS收益 = 0;
  const result = await fx.service.applySingleField({
    actorId: "ou_operator", chatId: "oc_social", table: "发布记录", key: "SR-000001", field: "RS收益", value: 5,
  });
  assert.deepEqual(result.changed_fields[0].fields.RS收益, {
    before: { present: true, value: 0 },
    after: { present: true, value: 5 },
    readback: { present: true, value: 5 },
  });
  assert.deepEqual(fx.audits[0].before.RS收益, { present: true, value: 0 });
  fx.close();
});

test("receipt IDs are exact randomUUID-v4 values and receipts bind to hashed Base coordinates", async () => {
  const fx = fixture();
  const preview = await fx.service.previewMutation({
    actorId: "ou_operator", chatId: "oc_social", action: "update", table: "选剧池", key: "SD-000001", patch: { 备注: "bound" },
  });
  const receipt = fx.jobs.getPreview(preview.receipt_id);
  assert.match(preview.receipt_id, /^sdp_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  assert.match(receipt.patch.base_binding, /^[0-9a-f]{64}$/);
  assert.equal(JSON.stringify(receipt.patch).includes("app-base-a"), false);
  const previousTableId = fx.repos.captures.tableId;
  fx.repos.captures.tableId = undefined;
  assert.throws(() => new HumanOpsService({
    repos: fx.repos,
    jobs: fx.jobs, operators: new Set(), privileged: new Set(), now: () => new Date(),
    makeReceiptId: () => "sdp_loose", allocateDramaId: () => "SD-000003", allocateReleaseId: () => "SR-000003",
  }), (error) => error.code === "human_ops_config_invalid");
  fx.repos.captures.tableId = previousTableId;
  const previousAppToken = fx.repos.captures.appToken;
  fx.repos.captures.appToken = "app-inconsistent";
  assert.throws(() => new HumanOpsService({
    repos: fx.repos,
    jobs: fx.jobs, operators: new Set(), privileged: new Set(), now: () => new Date(),
    makeReceiptId: () => "sdp_loose", allocateDramaId: () => "SD-000003", allocateReleaseId: () => "SR-000003",
  }), (error) => error.code === "human_ops_config_invalid");
  fx.repos.captures.appToken = previousAppToken;
  const loose = fixture();
  const looseService = new HumanOpsService({
    repos: loose.repos, jobs: loose.jobs, operators: new Set(["ou_operator"]), privileged: new Set(), now: () => new Date(),
    makeReceiptId: () => "sdp_loose", allocateDramaId: () => "SD-000003", allocateReleaseId: () => "SR-000003",
  });
  await assert.rejects(
    () => looseService.previewMutation({
      actorId: "ou_operator", chatId: "oc_social", action: "update", table: "选剧池", key: "SD-000001", patch: { 备注: "loose" },
    }),
    (error) => error.code === "receipt_id_invalid",
  );
  loose.close();
  fx.close();
});

test("receipt from another Base binding fails before consume or write", async () => {
  const jobs = new JobStore(":memory:");
  const first = fixture({ jobs, appToken: "app-base-a" });
  const second = fixture({
    jobs,
    appToken: "app-base-b",
    tableIds: { accounts: "tbl-accounts-b", dramas: "tbl-dramas-b", captures: "tbl-captures-b", releases: "tbl-releases-b" },
  });
  const preview = await first.service.previewMutation({
    actorId: "ou_operator", chatId: "oc_social", action: "update", table: "选剧池", key: "SD-000001", patch: { 备注: "other base" },
  });
  await assert.rejects(
    () => second.service.applyPreview({ actorId: "ou_operator", chatId: "oc_social", receiptId: preview.receipt_id }),
    (error) => error.code === "preview_base_mismatch",
  );
  assert.equal(jobs.getPreview(preview.receipt_id).used_at, null);
  assert.deepEqual(second.writes, []);
  jobs.close();
});

test("concurrent applies across service instances serialize and stale loser does not write", async () => {
  const fx = fixture();
  const second = fx.makeService();
  const one = await fx.service.previewMutation({
    actorId: "ou_operator", chatId: "oc_social", action: "update", table: "选剧池", key: "SD-000001", patch: { 备注: "one" },
  });
  const two = await second.previewMutation({
    actorId: "ou_operator", chatId: "oc_social", action: "update", table: "选剧池", key: "SD-000001", patch: { 备注: "two" },
  });
  const settled = await Promise.allSettled([
    fx.service.applyPreview({ actorId: "ou_operator", chatId: "oc_social", receiptId: one.receipt_id }),
    second.applyPreview({ actorId: "ou_operator", chatId: "oc_social", receiptId: two.receipt_id }),
  ]);
  assert.equal(settled.filter((item) => item.status === "fulfilled").length, 1);
  assert.equal(settled.filter((item) => item.status === "rejected" && item.reason.code === "preview_stale").length, 1);
  assert.equal(fx.writes.length, 1);

  const afterRejection = await second.previewMutation({
    actorId: "ou_operator", chatId: "oc_social", action: "update", table: "选剧池", key: "SD-000001", patch: { 备注: "after" },
  });
  await second.applyPreview({ actorId: "ou_operator", chatId: "oc_social", receiptId: afterRejection.receipt_id });
  assert.equal(fx.repos.dramas.rows.get("SD-000001").fields.备注, "after");
  fx.close();
});

test("concurrent attach-post claims across service instances allow exactly one active claimant", async () => {
  const fx = fixture();
  const second = fx.makeService();
  const one = await fx.service.previewMutation({
    actorId: "ou_operator", chatId: "oc_social", action: "attach-post", table: "发布记录", key: "SR-000001",
    patch: { 视频链接: "https://www.tiktok.com/@dramaexpedition/video/777", "Post ID": "777" },
  });
  const two = await second.previewMutation({
    actorId: "ou_operator", chatId: "oc_social", action: "attach-post", table: "发布记录", key: "SR-000002",
    patch: { 视频链接: "https://www.tiktok.com/@dramaexpedition/video/777", "Post ID": "777" },
  });
  const settled = await Promise.allSettled([
    fx.service.applyPreview({ actorId: "ou_operator", chatId: "oc_social", receiptId: one.receipt_id }),
    second.applyPreview({ actorId: "ou_operator", chatId: "oc_social", receiptId: two.receipt_id }),
  ]);
  assert.equal(settled.filter((item) => item.status === "fulfilled").length, 1);
  assert.equal(settled.filter((item) => item.status === "rejected" && ["post_id_claimed", "preview_stale"].includes(item.reason.code)).length, 1);
  const claimants = [...fx.repos.releases.rows.values()].filter((row) => row.fields.归档状态 === "active" && row.fields["Post ID"] === "777");
  assert.equal(claimants.length, 1);
  fx.close();
});

test("queued apply methods use immutable request snapshots", async () => {
  const fx = fixture();
  const firstEntered = deferred();
  const releaseFirst = deferred();
  let writesEntered = 0;
  fx.repos.dramas.beforeWrite = async () => {
    writesEntered += 1;
    if (writesEntered === 1) {
      firstEntered.resolve();
      await releaseFirst.promise;
    }
  };
  const blockerPreview = await fx.service.previewMutation({
    actorId: "ou_operator", chatId: "oc_social", action: "update", table: "选剧池", key: "SD-000001", patch: { 备注: "blocker" },
  });
  const queuedPreview = await fx.service.previewMutation({
    actorId: "ou_operator", chatId: "oc_social", action: "update", table: "选剧池", key: "SD-000002", patch: { 备注: "queued" },
  });
  const blocker = fx.service.applyPreview({ actorId: "ou_operator", chatId: "oc_social", receiptId: blockerPreview.receipt_id });
  await firstEntered.promise;
  const mutableApply = { actorId: "ou_operator", chatId: "oc_social", receiptId: queuedPreview.receipt_id };
  const queued = fx.service.applyPreview(mutableApply);
  mutableApply.receiptId = "sdp_ffffffff-ffff-4fff-8fff-ffffffffffff";
  releaseFirst.resolve();
  await blocker;
  assert.equal((await queued).record_id, "SD-000002");

  const archiveBlockEntered = deferred();
  const releaseArchiveBlock = deferred();
  writesEntered = 0;
  fx.repos.dramas.beforeWrite = async () => {
    writesEntered += 1;
    if (writesEntered === 1) {
      archiveBlockEntered.resolve();
      await releaseArchiveBlock.promise;
    }
  };
  const secondBlockerPreview = await fx.service.previewMutation({
    actorId: "ou_operator", chatId: "oc_social", action: "update", table: "选剧池", key: "SD-000001", patch: { 备注: "blocker-two" },
  });
  const archivePreview = await fx.service.previewArchive({
    actorId: "ou_operator", chatId: "oc_social", table: "选剧池", key: "SD-000002",
  });
  const secondBlocker = fx.service.applyPreview({ actorId: "ou_operator", chatId: "oc_social", receiptId: secondBlockerPreview.receipt_id });
  await archiveBlockEntered.promise;
  const mutableArchive = { actorId: "ou_operator", chatId: "oc_social", receiptId: archivePreview.receipt_id };
  const queuedArchive = fx.service.applyArchive(mutableArchive);
  mutableArchive.receiptId = "sdp_eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
  releaseArchiveBlock.resolve();
  await secondBlocker;
  assert.equal((await queuedArchive).record_id, "SD-000002");
  assert.equal(fx.repos.dramas.rows.get("SD-000002").fields.归档状态, "archived");
  fx.close();
});

test("applySingleField shares the mutation queue and snapshots before waiting", async () => {
  const fx = fixture();
  const firstEntered = deferred();
  const releaseFirst = deferred();
  let writesEntered = 0;
  fx.repos.dramas.beforeWrite = async () => {
    writesEntered += 1;
    if (writesEntered === 1) {
      firstEntered.resolve();
      await releaseFirst.promise;
    }
  };
  const preview = await fx.service.previewMutation({
    actorId: "ou_operator", chatId: "oc_social", action: "update", table: "选剧池", key: "SD-000001", patch: { 备注: "preview first" },
  });
  const first = fx.service.applyPreview({ actorId: "ou_operator", chatId: "oc_social", receiptId: preview.receipt_id });
  await firstEntered.promise;
  const mutableSingle = {
    actorId: "ou_operator", chatId: "oc_social", table: "选剧池", key: "SD-000002", field: "备注", value: "original single",
  };
  const second = fx.service.applySingleField(mutableSingle);
  mutableSingle.key = "SD-000001";
  mutableSingle.value = "caller mutated";
  await new Promise((resolve) => setImmediate(resolve));
  const enteredBeforeRelease = writesEntered;
  releaseFirst.resolve();
  await Promise.all([first, second]);
  assert.equal(enteredBeforeRelease, 1);
  assert.equal(fx.repos.dramas.rows.get("SD-000002").fields.备注, "original single");
  fx.close();
});

test("file-backed human mutation lease keeps busy receipts reusable then stale or claimed", async () => {
  const directory = mkdtempSync(join(tmpdir(), "shortdrama-human-lease-"));
  const dbPath = join(directory, "ops.sqlite");
  const firstStore = new JobStore(dbPath);
  const secondStore = new JobStore(dbPath);
  const fx = fixture({ jobs: firstStore });
  const second = fx.makeServiceWithJobs(secondStore);
  try {
    const firstPreview = await fx.service.previewMutation({
      actorId: "ou_operator", chatId: "oc_social", action: "update", table: "选剧池", key: "SD-000001", patch: { 备注: "winner" },
    });
    const secondPreview = await fx.service.previewMutation({
      actorId: "ou_operator", chatId: "oc_social", action: "update", table: "选剧池", key: "SD-000001", patch: { 备注: "loser" },
    });
    const binding = firstStore.getPreview(firstPreview.receipt_id).patch.base_binding;
    const lockKey = `human-base:${binding}`;
    firstStore.acquireMutationLease({ lockKey, ownerId: "external-owner", now: "2026-09-01T00:00:00Z", leaseSeconds: 300 });
    await assert.rejects(
      () => second.applyPreview({ actorId: "ou_operator", chatId: "oc_social", receiptId: secondPreview.receipt_id }),
      (error) => error.code === "mutation_busy",
    );
    assert.equal(secondStore.getPreview(secondPreview.receipt_id).used_at, null);
    assert.deepEqual(fx.writes, []);
    assert.equal(firstStore.releaseMutationLease({ lockKey, ownerId: "external-owner" }), true);
    await fx.service.applyPreview({ actorId: "ou_operator", chatId: "oc_social", receiptId: firstPreview.receipt_id });
    await assert.rejects(
      () => second.applyPreview({ actorId: "ou_operator", chatId: "oc_social", receiptId: secondPreview.receipt_id }),
      (error) => error.code === "preview_stale",
    );
    assert.equal(secondStore.getPreview(secondPreview.receipt_id).used_at, null);

    const firstAttach = await fx.service.previewMutation({
      actorId: "ou_operator", chatId: "oc_social", action: "attach-post", table: "发布记录", key: "SR-000001",
      patch: { 视频链接: "https://www.tiktok.com/@dramaexpedition/video/777", "Post ID": "777" },
    });
    const secondAttach = await fx.service.previewMutation({
      actorId: "ou_operator", chatId: "oc_social", action: "attach-post", table: "发布记录", key: "SR-000002",
      patch: { 视频链接: "https://www.tiktok.com/@dramaexpedition/video/777", "Post ID": "777" },
    });
    firstStore.acquireMutationLease({ lockKey, ownerId: "external-owner-two", now: "2026-09-01T00:00:00Z", leaseSeconds: 300 });
    await assert.rejects(
      () => second.applyPreview({ actorId: "ou_operator", chatId: "oc_social", receiptId: secondAttach.receipt_id }),
      (error) => error.code === "mutation_busy",
    );
    assert.equal(firstStore.releaseMutationLease({ lockKey, ownerId: "external-owner-two" }), true);
    await fx.service.applyPreview({ actorId: "ou_operator", chatId: "oc_social", receiptId: firstAttach.receipt_id });
    await assert.rejects(
      () => second.applyPreview({ actorId: "ou_operator", chatId: "oc_social", receiptId: secondAttach.receipt_id }),
      (error) => error.code === "post_id_claimed",
    );
    assert.equal(secondStore.getPreview(secondAttach.receipt_id).used_at, null);
    const claimants = [...fx.repos.releases.rows.values()].filter((row) => row.fields.归档状态 === "active" && row.fields["Post ID"] === "777");
    assert.equal(claimants.length, 1);
  } finally {
    firstStore.close();
    secondStore.close();
    rmSync(directory, { recursive: true });
  }
});

test("long pending Base read keeps heartbeating, excludes another owner, and stops after success", async () => {
  const fx = fixture();
  const entered = deferred();
  const releaseRead = deferred();
  const originalLoad = fx.repos.dramas.loadIndex.bind(fx.repos.dramas);
  let readPending = false;
  fx.repos.dramas.loadIndex = async () => {
    readPending = true;
    entered.resolve();
    await releaseRead.promise;
    readPending = false;
    return originalLoad();
  };
  const originalRenew = fx.jobs.renewMutationLease.bind(fx.jobs);
  let renewCount = 0;
  let activeRenewals = 0;
  let maximumActiveRenewals = 0;
  fx.jobs.renewMutationLease = async (input) => {
    renewCount += 1;
    if (!readPending) return originalRenew(input);
    activeRenewals += 1;
    maximumActiveRenewals = Math.max(maximumActiveRenewals, activeRenewals);
    try {
      await pause(1_200);
      return originalRenew(input);
    } finally {
      activeRenewals -= 1;
    }
  };
  const pending = fx.service.applySingleField({
    actorId: "ou_operator", chatId: "oc_social", table: "选剧池", key: "SD-000001", field: "备注", value: "after long read",
  });
  await entered.promise;
  const renewsAtReadStart = renewCount;
  await pause(2_150);
  const heartbeatObserved = renewCount > renewsAtReadStart;
  const lockKey = fx.jobs.db.prepare("SELECT lock_key FROM mutation_leases").get().lock_key;
  assert.equal(fx.jobs.acquireMutationLease({
    lockKey,
    ownerId: "competing-owner",
    now: "2026-09-01T00:00:01Z",
    leaseSeconds: 300,
  }), null);
  releaseRead.resolve();
  await pending;
  assert.equal(heartbeatObserved, true, "a heartbeat must renew while a list/retry wait is pending");
  assert.equal(maximumActiveRenewals, 1, "slow heartbeat renewals must never overlap");
  const renewsAfterSuccess = renewCount;
  await pause(1_150);
  assert.equal(renewCount, renewsAfterSuccess, "success must clear and stop the heartbeat timer");
  assert.equal(fx.repos.dramas.rows.get("SD-000001").fields.备注, "after long read");
  fx.close();
});

test("heartbeat ownership loss during pending pre-read stops consume, write, audit, and timer", async () => {
  const fx = fixture();
  const preview = await fx.service.previewMutation({
    actorId: "ou_operator", chatId: "oc_social", action: "update", table: "选剧池", key: "SD-000001", patch: { 备注: "must not write" },
  });
  const entered = deferred();
  const releaseRead = deferred();
  const originalLoad = fx.repos.dramas.loadIndex.bind(fx.repos.dramas);
  let heartbeatMustFail = false;
  fx.repos.dramas.loadIndex = async () => {
    heartbeatMustFail = true;
    entered.resolve();
    await releaseRead.promise;
    return originalLoad();
  };
  const originalRenew = fx.jobs.renewMutationLease.bind(fx.jobs);
  let renewCount = 0;
  fx.jobs.renewMutationLease = (input) => {
    renewCount += 1;
    if (heartbeatMustFail) {
      const error = new Error("simulated lease ownership loss");
      error.code = "mutation_lease_mismatch";
      throw error;
    }
    return originalRenew(input);
  };
  const pending = fx.service.applyPreview({
    actorId: "ou_operator", chatId: "oc_social", receiptId: preview.receipt_id,
  });
  await entered.promise;
  await pause(1_150);
  releaseRead.resolve();
  await assert.rejects(pending, (error) => error.code === "mutation_lease_mismatch");
  assert.equal(fx.jobs.getPreview(preview.receipt_id).used_at, null);
  assert.deepEqual(fx.writes, []);
  assert.deepEqual(fx.audits, []);
  const renewsAfterFailure = renewCount;
  await pause(1_150);
  assert.equal(renewCount, renewsAfterFailure, "failure must clear and stop the heartbeat timer");
  fx.close();
});

test("heartbeat loss during an in-flight write surfaces failure and stops later audit or success", async () => {
  const fx = fixture();
  const preview = await fx.service.previewMutation({
    actorId: "ou_operator", chatId: "oc_social", action: "update", table: "选剧池", key: "SD-000001", patch: { 备注: "remote write completed" },
  });
  const enteredWrite = deferred();
  const releaseWrite = deferred();
  let writePending = false;
  fx.repos.dramas.beforeWrite = async () => {
    writePending = true;
    enteredWrite.resolve();
    await releaseWrite.promise;
    writePending = false;
  };
  const originalRenew = fx.jobs.renewMutationLease.bind(fx.jobs);
  let renewCount = 0;
  fx.jobs.renewMutationLease = (input) => {
    renewCount += 1;
    if (writePending) {
      const error = new Error("simulated loss during remote write");
      error.code = "mutation_lease_mismatch";
      throw error;
    }
    return originalRenew(input);
  };
  const pending = fx.service.applyPreview({
    actorId: "ou_operator", chatId: "oc_social", receiptId: preview.receipt_id,
  });
  await enteredWrite.promise;
  await pause(1_150);
  releaseWrite.resolve();
  await assert.rejects(pending, (error) => error.code === "mutation_lease_mismatch");
  assert.equal(fx.repos.dramas.rows.get("SD-000001").fields.备注, "remote write completed");
  assert.notEqual(fx.jobs.getPreview(preview.receipt_id).used_at, null);
  assert.deepEqual(fx.audits, []);
  const renewsAfterFailure = renewCount;
  await pause(1_150);
  assert.equal(renewCount, renewsAfterFailure);
  fx.close();
});
