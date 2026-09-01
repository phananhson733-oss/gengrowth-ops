import assert from "node:assert/strict";
import test from "node:test";

import { JobStore } from "../src/job-store.mjs";
import { HumanOpsService } from "../src/human-ops.mjs";

const clone = (value) => structuredClone(value);

class FakeRepository {
  constructor(tableName, primaryField, rows, writes) {
    this.tableName = tableName;
    this.primaryField = primaryField;
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
    accounts: new FakeRepository("账号台账", "账号ID", accountRows, writes),
    dramas: new FakeRepository("选剧池", "剧ID", dramaRows, writes),
    captures: new FakeRepository("采集数据", "Post ID", capturesRows, writes),
    releases: new FakeRepository("发布记录", "发布ID", releaseRows, writes),
  };
  const jobs = new JobStore(":memory:");
  const realAppendAudit = jobs.appendAudit.bind(jobs);
  jobs.appendAudit = (event) => {
    audits.push(clone(event));
    if (options.auditFails) throw new Error("audit unavailable");
    return realAppendAudit(event);
  };
  const service = new HumanOpsService({
    repos,
    jobs,
    operators: new Set(["ou_operator"]),
    privileged: new Set(["ou_admin"]),
    now: () => new Date(clock),
    makeReceiptId: () => `sdp_${++receiptSequence}`,
    allocateDramaId: () => `SD-${String(++dramaSequence).padStart(6, "0")}`,
    allocateReleaseId: () => `SR-${String(++releaseSequence).padStart(6, "0")}`,
  });
  return {
    service,
    repos,
    jobs,
    writes,
    audits,
    setNow(value) { clock = new Date(value); },
    close() { jobs.close(); },
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
    makeReceiptId: () => "sdp_x",
    allocateDramaId: () => "SD-000003",
    allocateReleaseId: () => "SR-000003",
  }), (error) => error.code === "human_ops_config_invalid");
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
    status: "success", actor: "ou_operator", record_id: "SD-000001", changed_fields: ["推荐理由"], readback: "verified", next_step: "none",
  });
  assert.equal(fx.repos.dramas.rows.get("SD-000001").fields.推荐理由, "人工新理由");
  assert.deepEqual(fx.audits[0].before, { 推荐理由: "旧理由" });
  assert.deepEqual(fx.audits[0].after, { 推荐理由: "人工新理由" });
  assert.deepEqual(fx.audits[0].readback, { 推荐理由: "人工新理由" });
  const noOp = await fx.service.applySingleField({
    actorId: "ou_operator", chatId: "oc_social", table: "选剧池", key: "SD-000001", field: "推荐理由", value: "人工新理由",
  });
  assert.equal(noOp.status, "unchanged");
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
  assert.deepEqual(fx.writes, []);
  patch.剧名 = "caller changed";
  const result = await fx.service.applyPreview({ actorId: "ou_operator", chatId: "oc_social", receiptId: preview.receipt_id });
  assert.equal(result.record_id, "SD-000003");
  assert.equal(fx.repos.dramas.rows.get("SD-000003").fields.剧名, "New Drama");
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
  assert.deepEqual(applied.changed_fields, ["Post ID", "视频链接"]);
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

test("batch update validates every item before the first Base write and is privileged for batch archive", async () => {
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
    items: [{ key: "SD-000002", patch: { 备注: "two" } }, { key: "SD-000001", patch: { 备注: "one" } }],
  });
  const result = await fx.service.applyPreview({ actorId: "ou_admin", chatId: "oc_social", receiptId: preview.receipt_id });
  assert.equal(result.status, "success");
  assert.deepEqual(result.record_id, ["SD-000001", "SD-000002"]);
  assert.equal(fx.audits.length, 2);
  fx.close();
});

test("archive is previewed, writes only archived state, and service exposes no delete executor", async () => {
  const fx = fixture();
  assert.equal("delete" in fx.service, false);
  assert.equal("execute" in fx.service, false);
  const preview = await fx.service.previewArchive({ actorId: "ou_operator", chatId: "oc_social", table: "选剧池", key: "The Phantom Pilot" });
  const result = await fx.service.applyArchive({ actorId: "ou_operator", chatId: "oc_social", receiptId: preview.receipt_id });
  assert.deepEqual(result.changed_fields, ["归档状态"]);
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
