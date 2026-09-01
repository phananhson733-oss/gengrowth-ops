import assert from "node:assert/strict";
import test from "node:test";

import { BaseRepositories } from "../src/base-repositories.mjs";

const tableIds = Object.freeze({
  accounts: "tbl-accounts",
  dramas: "tbl-dramas",
  captures: "tbl-captures",
  releases: "tbl-releases",
});

function fakeClient(seed = {}) {
  const rows = structuredClone(seed);
  const calls = { list: [], create: [], update: [], get: [] };
  let nextId = 1;
  return {
    rows,
    calls,
    async listRecords(appToken, tableId) {
      calls.list.push({ appToken, tableId });
      return { items: structuredClone(rows[tableId] ?? []), complete: true, revision: "r1" };
    },
    async createRecords(appToken, tableId, records) {
      calls.create.push(structuredClone({ appToken, tableId, records }));
      rows[tableId] ??= [];
      return records.map((record) => {
        const item = { record_id: `rec-new-${nextId++}`, fields: structuredClone(record.fields) };
        rows[tableId].push(item);
        return structuredClone(item);
      });
    },
    async updateRecords(appToken, tableId, records) {
      calls.update.push(structuredClone({ appToken, tableId, records }));
      for (const patch of records) {
        const item = rows[tableId]?.find((row) => row.record_id === patch.record_id);
        if (item) Object.assign(item.fields, structuredClone(patch.fields));
      }
      return structuredClone(records);
    },
    async getRecord(appToken, tableId, recordId) {
      calls.get.push({ appToken, tableId, recordId });
      return structuredClone(rows[tableId]?.find((row) => row.record_id === recordId));
    },
  };
}

function makeRepos(client = fakeClient()) {
  return new BaseRepositories({ client, appToken: "app-token", tableIds });
}

test("constructor requires one non-empty app token, four unique table IDs, and a compatible client", () => {
  const client = fakeClient();
  for (const options of [
    { client, appToken: "", tableIds },
    { client, appToken: "app", tableIds: { ...tableIds, captures: "" } },
    { client, appToken: "app", tableIds: { ...tableIds, captures: tableIds.accounts } },
    { client: { ...client, getRecord: undefined }, appToken: "app", tableIds },
  ]) {
    assert.throws(() => new BaseRepositories(options), (error) => error.code === "base_repository_config_invalid");
  }
});

test("loadIndex fails closed for incomplete, malformed, blank-key, duplicate-key, and duplicate-ID lists", async (t) => {
  const cases = [
    [() => ({ items: [], complete: false }), "base_response_incomplete"],
    [() => ({ items: {}, complete: true }), "base_response_invalid"],
    [() => ({ items: [{ record_id: "rec-1", fields: { 账号ID: " " } }], complete: true }), "duplicate_base_key"],
    [() => ({ items: [
      { record_id: "rec-1", fields: { 账号ID: "same" } },
      { record_id: "rec-2", fields: { 账号ID: " same " } },
    ], complete: true }), "duplicate_base_key"],
    [() => ({ items: [
      { record_id: "rec-1", fields: { 账号ID: "one" } },
      { record_id: "rec-1", fields: { 账号ID: "two" } },
    ], complete: true }), "duplicate_record_id"],
    [() => ({ items: [{ record_id: "", fields: { 账号ID: "one" } }], complete: true }), "base_response_invalid"],
  ];
  for (const [makeResult, code] of cases) {
    await t.test(code, async () => {
      const client = fakeClient();
      client.listRecords = async () => makeResult();
      await assert.rejects(() => makeRepos(client).accounts.loadIndex(), (error) => error.code === code);
    });
  }
});

test("a failed explicit index refresh discards the previous cache and every later path retries", async () => {
  const client = fakeClient({
    [tableIds.accounts]: [{ record_id: "rec-account", fields: { 账号ID: "account-1" } }],
    [tableIds.captures]: [],
  });
  const repos = makeRepos(client);
  await repos.accounts.loadIndex();

  let failedRefreshes = 0;
  client.listRecords = async (_appToken, targetTableId) => {
    if (targetTableId === tableIds.accounts) {
      failedRefreshes += 1;
      return { items: [], complete: false };
    }
    return { items: structuredClone(client.rows[targetTableId] ?? []), complete: true, revision: "r2" };
  };

  await assert.rejects(
    () => repos.accounts.loadIndex(),
    (error) => error.code === "base_response_incomplete",
  );
  assert.equal(repos.accounts.index, null);
  await assert.rejects(
    () => repos.accounts.getByKey("account-1"),
    (error) => error.code === "base_response_incomplete",
  );
  await assert.rejects(
    () => repos.captures.upsertByKey("99", { 账号: [{ id: "rec-account" }] }, "machine"),
    (error) => error.code === "base_response_incomplete",
  );
  assert.equal(failedRefreshes, 3);
  assert.equal(client.calls.create.length + client.calls.update.length, 0);
});

test("keys are normalized, conflicting primary keys and duplicate batch keys are rejected before writes", async () => {
  const client = fakeClient({ [tableIds.accounts]: [] });
  const repos = makeRepos(client);
  const patch = { 账号ID: " actor ", 粉丝数: 1 };
  await repos.accounts.upsertByKey(" actor ", patch, "machine");
  assert.deepEqual(patch, { 账号ID: " actor ", 粉丝数: 1 });
  assert.equal(client.rows[tableIds.accounts][0].fields.账号ID, "actor");

  await assert.rejects(
    () => repos.accounts.upsertByKey("actor", { 账号ID: "other", 粉丝数: 2 }, "machine"),
    (error) => error.code === "primary_key_conflict",
  );
  await assert.rejects(
    () => repos.accounts.syncManyMachine([
      { key: "dup", patch: { 粉丝数: 1 } },
      { key: " dup ", patch: { 粉丝数: 2 } },
    ]),
    (error) => error.code === "duplicate_input_key",
  );
  assert.equal(client.calls.create.length, 1);
  assert.equal(client.calls.update.length, 0);

  await assert.rejects(
    () => makeRepos(fakeClient()).dramas.upsertByKey("SD-1", { 剧ID: "SD-2" }, "human"),
    (error) => error.code === "primary_key_conflict",
  );
});

test("every patch respects field ownership and late invalid bulk patches cause zero writes", async () => {
  const client = fakeClient({ [tableIds.dramas]: [] });
  const repos = makeRepos(client);
  await assert.rejects(
    () => repos.dramas.upsertByKey("SD-000001", { 推荐理由: "machine" }, "machine"),
    (error) => error.code === "field_owner_violation",
  );
  await assert.rejects(
    () => repos.dramas.syncManyMachine([
      { key: "SD-000001", patch: {} },
      { key: "SD-000002", patch: { 推荐理由: "late invalid" } },
    ]),
    (error) => error.code === "field_owner_violation",
  );
  assert.equal(client.calls.create.length + client.calls.update.length, 0);
});

test("relation values must use Base v3 {id} cells resolved from a complete target index", async () => {
  const client = fakeClient({
    [tableIds.accounts]: [{ record_id: "rec-account", fields: { 账号ID: "account-1" } }],
    [tableIds.captures]: [],
  });
  const repos = makeRepos(client);
  await assert.rejects(
    () => repos.captures.upsertByKey("99", { 账号: ["rec-account"] }, "machine"),
    (error) => error.code === "relation_value_invalid",
  );
  await assert.rejects(
    () => repos.captures.upsertByKey("99", { 账号: [{ id: "rec-missing" }] }, "machine"),
    (error) => error.code === "relation_target_not_found",
  );
  await repos.captures.upsertByKey("99", { 账号: [{ id: "rec-account" }], 播放量: 1 }, "machine");
  assert.deepEqual(client.rows[tableIds.captures][0].fields.账号, [{ id: "rec-account" }]);
});

test("single-record upsert succeeds only after exact readback and keeps latest Post ID row", async () => {
  const client = fakeClient({
    [tableIds.captures]: [{ record_id: "rec-capture", fields: { "Post ID": "99", 播放量: 10 } }],
  });
  const repos = makeRepos(client);
  const result = await repos.captures.upsertByKey("99", { 播放量: 20, 点赞: 0 }, "machine");
  assert.equal(result.readback, "verified");
  assert.equal(client.rows[tableIds.captures].length, 1);
  assert.deepEqual(client.rows[tableIds.captures][0].fields, { "Post ID": "99", 播放量: 20, 点赞: 0 });
  assert.equal(client.calls.get.length, 1);

  await repos.captures.upsertByKey(" 99 ", { 播放量: 21 }, "machine");
  assert.equal(client.rows[tableIds.captures].length, 1);
  assert.equal(client.calls.create.length, 0);
  assert.equal(client.calls.update.length, 2);
});

test("single-record upsert rejects missing write IDs and mismatched readback without poisoning the index", async () => {
  const client = fakeClient({ [tableIds.accounts]: [] });
  client.createRecords = async () => [{}];
  const repos = makeRepos(client);
  await assert.rejects(
    () => repos.accounts.upsertByKey("one", { 粉丝数: 1 }, "machine"),
    (error) => error.code === "base_response_invalid",
  );
  assert.equal((await repos.accounts.loadIndex()).size, 0);

  const mismatch = fakeClient({ [tableIds.accounts]: [] });
  const baseGet = mismatch.getRecord.bind(mismatch);
  mismatch.getRecord = async (...args) => {
    const record = await baseGet(...args);
    record.fields.粉丝数 = 999;
    return record;
  };
  const mismatchRepos = makeRepos(mismatch);
  await assert.rejects(
    () => mismatchRepos.accounts.upsertByKey("two", { 粉丝数: 2 }, "machine"),
    (error) => error.code === "readback_mismatch",
  );
  assert.equal(mismatchRepos.accounts.index, null);
  mismatch.getRecord = baseGet;
  await mismatchRepos.accounts.upsertByKey("two", { 粉丝数: 3 }, "machine");
  assert.equal(mismatch.rows[tableIds.accounts].length, 1);
  assert.equal(mismatch.calls.create.length, 1);
  assert.equal(mismatch.calls.update.length, 1);
});

test("ordinary upsert binds empty and mutating readbacks to the requested record ID", async () => {
  const emptyPatchClient = fakeClient({
    [tableIds.accounts]: [{ record_id: "rec-a", fields: { 账号ID: "a", 粉丝数: 1 } }],
  });
  emptyPatchClient.getRecord = async () => ({ record_id: "rec-other", fields: { 账号ID: "a", 粉丝数: 1 } });
  const emptyPatchRepos = makeRepos(emptyPatchClient);
  await assert.rejects(
    () => emptyPatchRepos.accounts.upsertByKey("a", {}, "machine"),
    (error) => error.code === "readback_mismatch",
  );
  assert.equal(emptyPatchRepos.accounts.index, null);
  assert.equal(emptyPatchClient.calls.create.length + emptyPatchClient.calls.update.length, 0);

  const mutationClient = fakeClient({
    [tableIds.accounts]: [{ record_id: "rec-a", fields: { 账号ID: "a", 粉丝数: 1 } }],
  });
  mutationClient.getRecord = async () => ({ record_id: "rec-other", fields: { 账号ID: "a", 粉丝数: 2 } });
  const mutationRepos = makeRepos(mutationClient);
  await assert.rejects(
    () => mutationRepos.accounts.upsertByKey("a", { 粉丝数: 2 }, "machine"),
    (error) => error.code === "readback_mismatch",
  );
  assert.equal(mutationRepos.accounts.index, null);
  assert.equal(mutationClient.calls.update.length, 1);
});

test("empty-patch upsert rejects same-ID primary-key drift and discards the cached old key", async () => {
  const client = fakeClient({
    [tableIds.accounts]: [{ record_id: "rec-a", fields: { 账号ID: "a", 粉丝数: 1 } }],
  });
  const baseGet = client.getRecord.bind(client);
  client.getRecord = async (...args) => {
    const record = await baseGet(...args);
    record.fields.账号ID = "b";
    return record;
  };
  const repos = makeRepos(client);
  await assert.rejects(
    () => repos.accounts.upsertByKey("a", {}, "machine"),
    (error) => error.code === "readback_mismatch",
  );
  assert.equal(repos.accounts.index, null);
  assert.equal(client.calls.create.length + client.calls.update.length, 0);
});

test("bulk sync performs one create call and one update call, reloads twice, skips unchanged, and verifies changed keys", async () => {
  const client = fakeClient({
    [tableIds.accounts]: [
      { record_id: "rec-a", fields: { 账号ID: "a", 粉丝数: 1 } },
      { record_id: "rec-b", fields: { 账号ID: "b", 粉丝数: 2 } },
    ],
  });
  const repos = makeRepos(client);
  const result = await repos.accounts.syncManyMachine([
    { key: "a", patch: { 粉丝数: 1 } },
    { key: "b", patch: { 粉丝数: 20 } },
    { key: "c", patch: { 粉丝数: 30 } },
  ]);
  assert.deepEqual(result, { created: 1, updated: 1, unchanged: 1, readback: "verified" });
  assert.equal(client.calls.list.filter((call) => call.tableId === tableIds.accounts).length, 2);
  assert.equal(client.calls.create.length, 1);
  assert.equal(client.calls.update.length, 1);
  assert.equal(client.calls.get.length, 0);
  assert.deepEqual(client.calls.update[0].records, [{ record_id: "rec-b", fields: { 粉丝数: 20 } }]);
});

test("bulk sync delegates all rows in one client call and preserves latest-only capture semantics", async () => {
  const existing = Array.from({ length: 201 }, (_unused, index) => ({
    record_id: `rec-${index + 1}`,
    fields: { "Post ID": String(index + 1), 播放量: index },
  }));
  const client = fakeClient({ [tableIds.captures]: existing });
  const repos = makeRepos(client);
  const result = await repos.captures.syncManyMachine(
    Array.from({ length: 401 }, (_unused, index) => ({ key: String(index + 1), patch: { 播放量: index + 1000 } })),
  );
  assert.deepEqual(result, { created: 200, updated: 201, unchanged: 0, readback: "verified" });
  assert.equal(client.calls.create.length, 1);
  assert.equal(client.calls.create[0].records.length, 200);
  assert.equal(client.calls.update.length, 1);
  assert.equal(client.calls.update[0].records.length, 201);
  assert.equal(client.rows[tableIds.captures].length, 401);
  assert.equal(new Set(client.rows[tableIds.captures].map((row) => row.fields["Post ID"])).size, 401);
});

test("bulk failed readback does not report verified", async () => {
  const client = fakeClient({ [tableIds.accounts]: [] });
  const baseList = client.listRecords.bind(client);
  let calls = 0;
  client.listRecords = async (...args) => {
    calls += 1;
    const result = await baseList(...args);
    if (calls === 2) result.items[0].fields.粉丝数 = 999;
    return result;
  };
  await assert.rejects(
    () => makeRepos(client).accounts.syncManyMachine([{ key: "a", patch: { 粉丝数: 1 } }]),
    (error) => error.code === "readback_mismatch",
  );
});

test("machine invariant protects human/shared and all non-request writable fields on only the target record", async () => {
  const client = fakeClient({
    [tableIds.accounts]: [
      { record_id: "rec-a", fields: { 账号ID: "a", 账号名: "A", 主页链接: "https://a", 粉丝数: 1, 同步状态: "ok" } },
      { record_id: "rec-b", fields: { 账号ID: "b", 账号名: "B", 粉丝数: 2 } },
    ],
  });
  const originalUpdate = client.updateRecords.bind(client);
  client.updateRecords = async (...args) => {
    const result = await originalUpdate(...args);
    client.rows[tableIds.accounts][1].fields.账号名 = "B concurrently edited";
    return result;
  };
  const result = await makeRepos(client).accounts.machineUpsertWithInvariant("a", { 粉丝数: 10 });
  assert.equal(result.readback, "verified");

  const corrupt = fakeClient({
    [tableIds.accounts]: [{ record_id: "rec-a", fields: { 账号ID: "a", 账号名: "A", 粉丝数: 1, 同步状态: "ok" } }],
  });
  const corruptUpdate = corrupt.updateRecords.bind(corrupt);
  corrupt.updateRecords = async (...args) => {
    const result2 = await corruptUpdate(...args);
    corrupt.rows[tableIds.accounts][0].fields.账号名 = "server changed human";
    corrupt.rows[tableIds.accounts][0].fields.同步状态 = "server changed machine";
    return result2;
  };
  await assert.rejects(
    () => makeRepos(corrupt).accounts.machineUpsertWithInvariant("a", { 粉丝数: 10 }),
    (error) => error.code === "machine_invariant_violation",
  );
});

test("machine invariant readback is bound to the record written", async () => {
  const client = fakeClient({
    [tableIds.accounts]: [{ record_id: "rec-a", fields: { 账号ID: "a", 账号名: "A", 粉丝数: 1 } }],
  });
  const baseGet = client.getRecord.bind(client);
  let reads = 0;
  client.getRecord = async (...args) => {
    reads += 1;
    const record = await baseGet(...args);
    if (reads === 2) record.record_id = "rec-other";
    return record;
  };
  const repos = makeRepos(client);
  await assert.rejects(
    () => repos.accounts.machineUpsertWithInvariant("a", { 粉丝数: 2 }),
    (error) => error.code === "readback_mismatch",
  );
  assert.equal(client.calls.update.length, 1);
  assert.equal(repos.accounts.index, null);
});

test("machine invariant primary-key drift during pre-read invalidates its cache", async () => {
  const client = fakeClient({
    [tableIds.accounts]: [{ record_id: "rec-a", fields: { 账号ID: "a", 粉丝数: 1 } }],
  });
  const baseGet = client.getRecord.bind(client);
  client.getRecord = async (...args) => {
    const record = await baseGet(...args);
    record.fields.账号ID = "b";
    return record;
  };
  const repos = makeRepos(client);
  await assert.rejects(
    () => repos.accounts.machineUpsertWithInvariant("a", { 粉丝数: 2 }),
    (error) => error.code === "readback_mismatch",
  );
  assert.equal(repos.accounts.index, null);
  assert.equal(client.calls.create.length + client.calls.update.length, 0);
});

test("machine invariant forbids shared input before any write", async () => {
  const client = fakeClient({
    [tableIds.releases]: [{ record_id: "rec-r", fields: { 发布ID: "SR-1", "Post ID": "99" } }],
  });
  await assert.rejects(
    () => makeRepos(client).releases.machineUpsertWithInvariant("SR-1", { "Post ID": "100" }),
    (error) => error.code === "field_owner_violation",
  );
  assert.equal(client.calls.create.length + client.calls.update.length, 0);
});

test("verify uses exact canonical deep comparison for only requested fields", async () => {
  const client = fakeClient({
    [tableIds.captures]: [{ record_id: "rec-c", fields: { "Post ID": "99", 账号: [{ id: "rec-a" }], 播放量: 1, 评论: null } }],
  });
  const repos = makeRepos(client);
  assert.equal((await repos.captures.verify("rec-c", { 账号: [{ id: "rec-a" }], 播放量: 1 })).readback, "verified");
  await assert.rejects(
    () => repos.captures.verify("rec-c", { 账号: [{ id: "other" }] }),
    (error) => error.code === "readback_mismatch",
  );
  await assert.rejects(
    () => repos.captures.verify("rec-c", { 评论: Number.NaN }),
    (error) => error.code === "readback_mismatch",
  );
  await assert.rejects(
    () => repos.captures.verify("rec-missing", { 播放量: 1 }),
    (error) => error.code === "readback_mismatch",
  );
});

test("verify field drift invalidates a cached row and a valid retry preserves the refreshed cache", async () => {
  const client = fakeClient({
    [tableIds.accounts]: [{ record_id: "rec-a", fields: { 账号ID: "a", 粉丝数: 1 } }],
  });
  const repos = makeRepos(client);
  await repos.accounts.loadIndex();
  client.rows[tableIds.accounts][0].fields.粉丝数 = 2;

  await assert.rejects(
    () => repos.accounts.verify("rec-a", { 粉丝数: 1 }),
    (error) => error.code === "readback_mismatch",
  );
  assert.equal(repos.accounts.index, null);

  const refreshed = await repos.accounts.getByKey("a");
  assert.equal(refreshed.fields.粉丝数, 2);
  assert.equal(client.calls.list.filter((call) => call.tableId === tableIds.accounts).length, 2);
  await repos.accounts.verify("rec-a", { 粉丝数: 2 });
  assert.notEqual(repos.accounts.index, null);
});

test("linkCaptureSafely resolves capture IDs and rejects pre-write match-input drift", async () => {
  const client = fakeClient({
    [tableIds.captures]: [{ record_id: "rec-c", fields: { "Post ID": "99" } }],
    [tableIds.releases]: [{ record_id: "rec-r", fields: {
      发布ID: "SR-1", "Post ID": "99", 视频链接: "https://video/99", 账号: [{ id: "rec-a" }], 日期: "2026-09-01",
      采集记录: [],
    } }],
  });
  const repos = makeRepos(client);
  await assert.rejects(
    () => repos.releases.linkCaptureSafely("SR-1", "rec-missing", { "Post ID": "99" }),
    (error) => error.code === "relation_target_not_found",
  );
  await assert.rejects(
    () => repos.releases.linkCaptureSafely("SR-1", "rec-c", { "Post ID": "100" }),
    (error) => error.code === "match_inputs_changed",
  );
  assert.equal(client.calls.update.length, 0);
});

test("linkCaptureSafely invalidates its release cache on same-ID pre-read match-input drift", async () => {
  const client = fakeClient({
    [tableIds.captures]: [{ record_id: "rec-c", fields: { "Post ID": "99" } }],
    [tableIds.releases]: [{ record_id: "rec-r", fields: {
      发布ID: "SR-1", "Post ID": "99", 视频链接: "https://video/99", 采集记录: [],
    } }],
  });
  const baseGet = client.getRecord.bind(client);
  client.getRecord = async (...args) => {
    const record = await baseGet(...args);
    record.fields["Post ID"] = "100";
    return record;
  };
  const repos = makeRepos(client);
  await assert.rejects(
    () => repos.releases.linkCaptureSafely("SR-1", "rec-c", { "Post ID": "99" }),
    (error) => error.code === "match_inputs_changed",
  );
  assert.equal(repos.releases.index, null);
  assert.equal(client.calls.update.length, 0);
});

test("linkCaptureSafely writes Base v3 relation and verifies stable match inputs", async () => {
  const client = fakeClient({
    [tableIds.captures]: [{ record_id: "rec-c", fields: { "Post ID": "99" } }],
    [tableIds.releases]: [{ record_id: "rec-r", fields: {
      发布ID: "SR-1", "Post ID": "99", 视频链接: "https://video/99", 账号: [{ id: "rec-a" }], 日期: "2026-09-01",
      采集记录: [],
    } }],
  });
  const result = await makeRepos(client).releases.linkCaptureSafely("SR-1", "rec-c", {
    "Post ID": "99", 视频链接: "https://video/99", 账号: [{ id: "rec-a" }], 日期: "2026-09-01",
  });
  assert.equal(result.readback, "verified");
  assert.deepEqual(client.calls.update[0].records[0].fields, { 采集记录: [{ id: "rec-c" }] });
  assert.deepEqual(client.rows[tableIds.releases][0].fields.采集记录, [{ id: "rec-c" }]);
});

test("linkCaptureSafely binds its post-write readback to the release record", async () => {
  const client = fakeClient({
    [tableIds.captures]: [{ record_id: "rec-c", fields: { "Post ID": "99" } }],
    [tableIds.releases]: [{ record_id: "rec-r", fields: {
      发布ID: "SR-1", "Post ID": "99", 视频链接: "https://video/99", 采集记录: [],
    } }],
  });
  const baseGet = client.getRecord.bind(client);
  let reads = 0;
  client.getRecord = async (...args) => {
    reads += 1;
    const record = await baseGet(...args);
    if (reads === 2) record.record_id = "rec-other";
    return record;
  };
  const repos = makeRepos(client);
  await assert.rejects(
    () => repos.releases.linkCaptureSafely("SR-1", "rec-c", { "Post ID": "99" }),
    (error) => error.code === "readback_mismatch",
  );
  assert.equal(client.calls.update.length, 1);
  assert.equal(repos.releases.index, null);
});

test("concurrent match-input change clears only this run's relation and preserves human input", async () => {
  const client = fakeClient({
    [tableIds.captures]: [{ record_id: "rec-c", fields: { "Post ID": "99" } }],
    [tableIds.releases]: [{ record_id: "rec-r", fields: {
      发布ID: "SR-1", "Post ID": "99", 视频链接: "https://video/99", 账号: [{ id: "rec-a" }], 日期: "2026-09-01",
      采集记录: [],
    } }],
  });
  const baseUpdate = client.updateRecords.bind(client);
  let first = true;
  client.updateRecords = async (...args) => {
    const result = await baseUpdate(...args);
    if (first) {
      first = false;
      client.rows[tableIds.releases][0].fields["Post ID"] = "100";
    }
    return result;
  };
  await assert.rejects(
    () => makeRepos(client).releases.linkCaptureSafely("SR-1", "rec-c", { "Post ID": "99" }),
    (error) => error.code === "concurrent_human_change",
  );
  assert.equal(client.rows[tableIds.releases][0].fields["Post ID"], "100");
  assert.deepEqual(client.rows[tableIds.releases][0].fields.采集记录, []);
  assert.equal(client.calls.update.length, 2);
});

test("relation cleanup readback is bound to the release record", async () => {
  const client = fakeClient({
    [tableIds.captures]: [{ record_id: "rec-c", fields: { "Post ID": "99" } }],
    [tableIds.releases]: [{ record_id: "rec-r", fields: {
      发布ID: "SR-1", "Post ID": "99", 视频链接: "https://video/99", 采集记录: [],
    } }],
  });
  const baseUpdate = client.updateRecords.bind(client);
  let writes = 0;
  client.updateRecords = async (...args) => {
    writes += 1;
    const result = await baseUpdate(...args);
    if (writes === 1) client.rows[tableIds.releases][0].fields["Post ID"] = "100";
    return result;
  };
  const baseGet = client.getRecord.bind(client);
  let reads = 0;
  client.getRecord = async (...args) => {
    reads += 1;
    const record = await baseGet(...args);
    if (reads === 3) record.record_id = "rec-other";
    return record;
  };
  const repos = makeRepos(client);
  await assert.rejects(
    () => repos.releases.linkCaptureSafely("SR-1", "rec-c", { "Post ID": "99" }),
    (error) => error.code === "readback_mismatch",
  );
  assert.equal(client.calls.update.length, 2);
  assert.equal(repos.releases.index, null);
});

test("concurrent relation replacement is never cleared by rollback", async () => {
  const client = fakeClient({
    [tableIds.captures]: [
      { record_id: "rec-c", fields: { "Post ID": "99" } },
      { record_id: "rec-other", fields: { "Post ID": "100" } },
    ],
    [tableIds.releases]: [{ record_id: "rec-r", fields: {
      发布ID: "SR-1", "Post ID": "99", 视频链接: "https://video/99", 采集记录: [],
    } }],
  });
  const baseUpdate = client.updateRecords.bind(client);
  client.updateRecords = async (...args) => {
    const result = await baseUpdate(...args);
    client.rows[tableIds.releases][0].fields["Post ID"] = "100";
    client.rows[tableIds.releases][0].fields.采集记录 = [{ id: "rec-other" }];
    return result;
  };
  await assert.rejects(
    () => makeRepos(client).releases.linkCaptureSafely("SR-1", "rec-c", { "Post ID": "99" }),
    (error) => error.code === "concurrent_human_change",
  );
  assert.deepEqual(client.rows[tableIds.releases][0].fields.采集记录, [{ id: "rec-other" }]);
  assert.equal(client.calls.update.length, 1);
});
