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

// Base makes a freshly created record visible asynchronously. This client reproduces
// that: creates succeed and return record IDs, but the next `lag` listings omit them.
function laggingClient(lag) {
  const base = fakeClient();
  const hidden = new Set();
  let remaining = lag;
  return {
    ...base,
    async createRecords(appToken, tableId, records) {
      const created = await base.createRecords(appToken, tableId, records);
      for (const record of created) hidden.add(record.record_id);
      return created;
    },
    async listRecords(appToken, tableId) {
      const result = await base.listRecords(appToken, tableId);
      if (hidden.size > 0 && remaining > 0) {
        remaining -= 1;
        return { ...result, items: result.items.filter((item) => !hidden.has(item.record_id)) };
      }
      return result;
    },
  };
}

function repoWithSleep(client, sleeps) {
  return new BaseRepositories({ client, appToken: "app-token", tableIds, sleep: async (ms) => { sleeps.push(ms); } });
}

test("bulk sync polls for a lagging write instead of calling it a lost record", async () => {
  const sleeps = [];
  const repos = repoWithSleep(laggingClient(1), sleeps);

  const summary = await repos.dramas.syncManyByKey([{ key: "SD-000001", patch: { 剧名: "Drama" } }], "migration");

  assert.equal(summary.readback, "verified");
  assert.equal(summary.created, 1);
  assert.equal(sleeps.length, 1, "should have waited once before the second read");
});

test("bulk sync gives up on a record that never becomes visible, after bounded polling", async () => {
  const sleeps = [];
  const repos = repoWithSleep(laggingClient(99), sleeps);

  await assert.rejects(
    () => repos.dramas.syncManyByKey([{ key: "SD-000001", patch: { 剧名: "Drama" } }], "migration"),
    (error) => error.code === "readback_mismatch" && /missing after bulk sync/.test(error.message),
  );
  assert.equal(sleeps.length, 2, "three reads means two waits, not an unbounded retry");
});

test("bulk sync does not retry a readback whose fields disagree", async () => {
  const sleeps = [];
  const client = fakeClient();
  const original = client.createRecords.bind(client);
  client.createRecords = async (appToken, tableId, records) => {
    // The Base stores something other than what was requested.
    const tampered = records.map((record) => ({ fields: { ...record.fields, 剧名: "Different" } }));
    return original(appToken, tableId, tampered);
  };
  const repos = repoWithSleep(client, sleeps);

  await assert.rejects(
    () => repos.dramas.syncManyByKey([{ key: "SD-000001", patch: { 剧名: "Drama" } }], "migration"),
    (error) => error.code === "readback_mismatch",
  );
  assert.equal(sleeps.length, 0, "a field mismatch is not a visibility lag — no waiting");
});


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

test("repository abort is threaded to the client and leaves cache fail-closed", async () => {
  const controller = new AbortController();
  const client = fakeClient({
    [tableIds.accounts]: [{ record_id: "rec-a", fields: { 账号ID: "a", 粉丝数: 1 } }],
  });
  const baseUpdate = client.updateRecords.bind(client);
  let remoteMutations = 0;
  client.updateRecords = async (appToken, tableId, records, options) => {
    assert.equal(options.signal, controller.signal);
    controller.abort();
    if (options.signal.aborted) {
      const error = new Error("aborted");
      error.code = "base_operation_aborted";
      throw error;
    }
    remoteMutations += 1;
    return baseUpdate(appToken, tableId, records, options);
  };
  const repos = makeRepos(client);
  await assert.rejects(
    () => repos.accounts.syncManyMachine([{ key: "a", patch: { 粉丝数: 2 } }], { signal: controller.signal }),
    (error) => error.code === "base_operation_aborted",
  );
  assert.equal(remoteMutations, 0);
  assert.equal(repos.accounts.index, null);
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

test("linkCaptureSafely resolves capture IDs and preserves relations on pre-write input drift", async () => {
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
    (error) => error.code === "concurrent_human_change" && error.details?.next_step === "manual_repair",
  );
  assert.equal(client.calls.update.length, 0);
});

test("linkCaptureSafely invalidates its cache and preserves relation on same-ID pre-read drift", async () => {
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
    (error) => error.code === "concurrent_human_change" && error.details?.next_step === "manual_repair",
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

test("release evidence preserves the relation and requires manual repair when inputs drift during write", async () => {
  const client = fakeClient({
    [tableIds.captures]: [{ record_id: "rec-c", fields: { "Post ID": "99" } }],
    [tableIds.releases]: [{ record_id: "rec-r", fields: {
      发布ID: "SR-1", "Post ID": "99", 视频链接: "https://video/99", 账号: [{ id: "rec-a" }], 日期: "2026-09-01",
      采集记录: [{ id: "rec-c" }], 备注: "keep",
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
  const repos = makeRepos(client);
  let caught;
  await assert.rejects(
    () => repos.releases.upsertEvidenceSafely(
      "SR-1", { 匹配方式: "exact_post_id", 匹配置信度: 1 },
      { "Post ID": "99", 视频链接: "https://video/99", 账号: [{ id: "rec-a" }], 日期: "2026-09-01" },
      "rec-c",
    ),
    (error) => {
      caught = error;
      return error.code === "concurrent_human_change" && error.details?.next_step === "manual_repair";
    },
  );
  assert.equal(client.rows[tableIds.releases][0].fields["Post ID"], "100");
  assert.deepEqual(client.rows[tableIds.releases][0].fields.采集记录, [{ id: "rec-c" }]);
  assert.equal(client.rows[tableIds.releases][0].fields.备注, "keep");
  assert.equal(client.calls.update.length, 1);
  assert.equal(caught.details.relation_preserved, true);
});

test("release evidence never clears a concurrently replaced relation", async () => {
  const client = fakeClient({
    [tableIds.captures]: [
      { record_id: "rec-c", fields: { "Post ID": "99" } },
      { record_id: "rec-other", fields: { "Post ID": "100" } },
    ],
    [tableIds.releases]: [{ record_id: "rec-r", fields: {
      发布ID: "SR-1", "Post ID": "99", 视频链接: "https://video/99", 账号: [{ id: "rec-a" }], 日期: "2026-09-01",
      采集记录: [{ id: "rec-c" }],
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
    () => makeRepos(client).releases.upsertEvidenceSafely(
      "SR-1", { 匹配方式: "exact_post_id" },
      { "Post ID": "99", 视频链接: "https://video/99", 账号: [{ id: "rec-a" }], 日期: "2026-09-01" },
      "rec-c",
    ),
    (error) => error.code === "concurrent_human_change",
  );
  assert.deepEqual(client.rows[tableIds.releases][0].fields.采集记录, [{ id: "rec-other" }]);
  assert.equal(client.calls.update.length, 1);
});

test("release evidence ignores unrelated human edits and verifies requested machine fields", async () => {
  const client = fakeClient({
    [tableIds.captures]: [{ record_id: "rec-c", fields: { "Post ID": "99" } }],
    [tableIds.releases]: [{ record_id: "rec-r", fields: {
      发布ID: "SR-1", "Post ID": "99", 视频链接: "https://video/99", 账号: [{ id: "rec-a" }], 日期: "2026-09-01",
      采集记录: [{ id: "rec-c" }], 备注: "before",
    } }],
  });
  const baseUpdate = client.updateRecords.bind(client);
  client.updateRecords = async (...args) => {
    const result = await baseUpdate(...args);
    client.rows[tableIds.releases][0].fields.备注 = "concurrent human edit";
    return result;
  };
  const result = await makeRepos(client).releases.upsertEvidenceSafely(
    "SR-1", { 匹配方式: "exact_post_id", 匹配置信度: 1 },
    { "Post ID": "99", 视频链接: "https://video/99", 账号: [{ id: "rec-a" }], 日期: "2026-09-01" },
    "rec-c",
  );
  assert.equal(result.readback, "verified");
  assert.equal(result.record.fields.备注, "concurrent human edit");
  assert.equal(result.record.fields.匹配方式, "exact_post_id");
});

test("release evidence preserves a stale linked relation found before its write", async () => {
  const client = fakeClient({
    [tableIds.captures]: [{ record_id: "rec-c", fields: { "Post ID": "99" } }],
    [tableIds.releases]: [{ record_id: "rec-r", fields: {
      发布ID: "SR-1", "Post ID": "100", 视频链接: "https://video/99", 账号: [{ id: "rec-a" }], 日期: "2026-09-01",
      采集记录: [{ id: "rec-c" }],
    } }],
  });
  await assert.rejects(
    () => makeRepos(client).releases.upsertEvidenceSafely(
      "SR-1", { 匹配方式: "exact_post_id" },
      { "Post ID": "99", 视频链接: "https://video/99", 账号: [{ id: "rec-a" }], 日期: "2026-09-01" },
      "rec-c",
    ),
    (error) => error.code === "concurrent_human_change" && error.details?.next_step === "manual_repair",
  );
  assert.deepEqual(client.rows[tableIds.releases][0].fields.采集记录, [{ id: "rec-c" }]);
  assert.equal(client.calls.update.length, 0);
});

test("release evidence preserves a replacement made before the would-be cleanup", async () => {
  const client = fakeClient({
    [tableIds.captures]: [
      { record_id: "rec-c", fields: { "Post ID": "99" } },
      { record_id: "rec-other", fields: { "Post ID": "100" } },
    ],
    [tableIds.releases]: [{ record_id: "rec-r", fields: {
      发布ID: "SR-1", "Post ID": "100", 视频链接: "https://video/99", 账号: [{ id: "rec-a" }], 日期: "2026-09-01",
      采集记录: [{ id: "rec-c" }],
    } }],
  });
  const baseGet = client.getRecord.bind(client);
  let reads = 0;
  client.getRecord = async (...args) => {
    reads += 1;
    if (reads === 1) client.rows[tableIds.releases][0].fields.采集记录 = [{ id: "rec-other" }];
    return baseGet(...args);
  };
  await assert.rejects(
    () => makeRepos(client).releases.upsertEvidenceSafely(
      "SR-1", { 匹配方式: "exact_post_id" },
      { "Post ID": "99", 视频链接: "https://video/99", 账号: [{ id: "rec-a" }], 日期: "2026-09-01" },
      "rec-c",
    ),
    (error) => error.code === "concurrent_human_change" && error.details?.next_step === "manual_repair",
  );
  assert.deepEqual(client.rows[tableIds.releases][0].fields.采集记录, [{ id: "rec-other" }]);
  assert.equal(client.calls.update.length, 0);
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

test("link drift preserves this run relation and requires manual repair", async () => {
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
    (error) => error.code === "concurrent_human_change" && error.details?.next_step === "manual_repair",
  );
  assert.equal(client.rows[tableIds.releases][0].fields["Post ID"], "100");
  assert.deepEqual(client.rows[tableIds.releases][0].fields.采集记录, [{ id: "rec-c" }]);
  assert.equal(client.calls.update.length, 1);
});

test("link drift performs no unsafe cleanup readback or second write", async () => {
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
  const repos = makeRepos(client);
  await assert.rejects(
    () => repos.releases.linkCaptureSafely("SR-1", "rec-c", { "Post ID": "99" }),
    (error) => error.code === "concurrent_human_change" && error.details?.next_step === "manual_repair",
  );
  assert.deepEqual(client.rows[tableIds.releases][0].fields.采集记录, [{ id: "rec-c" }]);
  assert.equal(client.calls.update.length, 1);
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


function staleUpdateClient(staleReads, unexpected = null) {
  const before = { record_id: "rec-drama", fields: { 剧ID: "SD-000001", 备注: null } };
  const client = fakeClient({ [tableIds.dramas]: [before] });
  const get = client.getRecord.bind(client);
  client.getRecord = async (...args) => {
    const current = await get(...args);
    if (unexpected !== null) return { ...current, fields: { ...current.fields, 备注: unexpected } };
    if (staleReads-- > 0) return structuredClone(before);
    return current;
  };
  return client;
}

test("single update waits for the acknowledged value when Base still returns the old cell", async () => {
  const client = staleUpdateClient(1);
  const sleeps = [];
  const repos = repoWithSleep(client, sleeps);
  const result = await repos.dramas.upsertByKey("SD-000001", { 备注: "verified nonce" }, "human");
  assert.equal(result.readback, "verified");
  assert.equal(result.record.fields.备注, "verified nonce");
  assert.equal(client.calls.update.length, 1, "poll reads, never replay the mutation");
  assert.equal(sleeps.length, 1);
});

test("single update bounds stale readback and leaves the index invalid on exhaustion", async () => {
  const client = staleUpdateClient(99);
  const sleeps = [];
  const repos = repoWithSleep(client, sleeps);
  await assert.rejects(() => repos.dramas.upsertByKey("SD-000001", { 备注: "nonce" }, "human"),
    error => error.code === "readback_mismatch");
  assert.ok(sleeps.length > 0 && sleeps.length <= 4);
  assert.equal(client.calls.get.length, sleeps.length + 1);
  assert.equal(client.calls.update.length, 1);
  assert.equal(repos.dramas.index, null);
});

test("single update rejects a third-party value immediately rather than hiding a conflict", async () => {
  const client = staleUpdateClient(0, "another person's edit");
  const sleeps = [];
  const repos = repoWithSleep(client, sleeps);
  await assert.rejects(() => repos.dramas.upsertByKey("SD-000001", { 备注: "nonce" }, "human"),
    error => error.code === "readback_mismatch");
  assert.equal(sleeps.length, 0);
  assert.equal(client.calls.update.length, 1);
  assert.equal(repos.dramas.index, null);
});

test("single update cancellation during visibility wait prevents further reads or writes", async () => {
  const client = staleUpdateClient(99);
  const controller = new AbortController();
  const repos = new BaseRepositories({ client, appToken: "app-token", tableIds,
    sleep: async () => controller.abort() });
  await assert.rejects(() => repos.dramas.upsertByKey("SD-000001", { 备注: "nonce" }, "human", { signal: controller.signal }),
    error => error.code === "base_operation_aborted");
  assert.equal(client.calls.get.length, 1);
  assert.equal(client.calls.update.length, 1);
  assert.equal(repos.dramas.index, null);
});


test("machine datetime expectations match second precision storage and remain idempotent",async()=>{
 const client=fakeClient({[tableIds.accounts]:[{record_id:"a",fields:{账号ID:"acct",指标同步时间:"2026-09-08T00:00:00.000Z"}}]});const update=client.updateRecords.bind(client);
 client.updateRecords=async(...args)=>{const result=await update(...args);for(const r of client.rows[tableIds.accounts])r.fields.指标同步时间=new Date(Math.floor(Date.parse(r.fields.指标同步时间)/1000)*1000).toISOString();return result;};
 const repo=makeRepos(client).accounts;const input={key:"acct",patch:{指标同步时间:"2026-09-09T12:42:14.739+08:00"}};
 assert.equal((await repo.syncManyMachine([input])).readback,"verified");assert.equal(client.calls.update.length,1);assert.equal(client.rows[tableIds.accounts][0].fields.指标同步时间,"2026-09-09T04:42:14.000Z");
 assert.equal((await repo.syncManyMachine([input])).unchanged,1);assert.equal(client.calls.update.length,1);assert.equal(input.patch.指标同步时间,"2026-09-09T12:42:14.739+08:00");
 const drama=makeRepos(fakeClient()).dramas;assert.equal(drama.preparePatch("SD-000001",{备注:"2026-09-09T04:42:14.739Z"},"human").patch.备注,"2026-09-09T04:42:14.739Z");
});
test("bulk sync polls known old values without replaying the update",async()=>{
 const client=fakeClient({[tableIds.accounts]:[{record_id:"a",fields:{账号ID:"acct",粉丝数:10}}]});const list=client.listRecords.bind(client);let reads=0;client.listRecords=async(...args)=>{const r=await list(...args);if(++reads===2)r.items[0].fields.粉丝数=10;return r;};const sleeps=[];
 const result=await repoWithSleep(client,sleeps).accounts.syncManyMachine([{key:"acct",patch:{粉丝数:20}}]);assert.equal(result.readback,"verified");assert.equal(client.calls.update.length,1);assert.equal(reads,3);assert.equal(sleeps.length,1);
});
test("bulk write readback restarts pagination only for revision or total visibility changes",async()=>{
 for(const kind of ["rev","total","field_ids"]){const client=fakeClient({[tableIds.accounts]:[{record_id:"a",fields:{账号ID:"acct",粉丝数:10}}]});const list=client.listRecords.bind(client);let reads=0;client.listRecords=async(...args)=>{if(++reads===2){const e=Error("pagination changed");e.code="base_response_invalid";e.details={pagination_metadata_key:kind};throw e;}return list(...args);};const repo=repoWithSleep(client,[]).accounts;
  if(kind==='field_ids')await assert.rejects(repo.syncManyMachine([{key:'acct',patch:{粉丝数:20}}]),e=>e.code==='base_response_invalid');else assert.equal((await repo.syncManyMachine([{key:'acct',patch:{粉丝数:20}}])).readback,'verified');assert.equal(client.calls.update.length,1);
 }
});


test("release evidence waits for known old machine values while keeping human and relation checks",async()=>{
 const fields={发布ID:'SR-1','Post ID':'99',视频链接:'https://video/99',账号:[{id:'rec-a'}],日期:'2026-09-01',采集记录:[{id:'rec-c'}],指标同步时间:'2026-08-31T00:00:00.000Z',同步错误:null};
 const client=fakeClient({[tableIds.captures]:[{record_id:'rec-c',fields:{'Post ID':'99'}}],[tableIds.releases]:[{record_id:'rec-r',fields}]});const get=client.getRecord.bind(client);let reads=0;client.getRecord=async(...args)=>{const r=await get(...args);if(++reads===2)r.fields.指标同步时间=fields.指标同步时间;return r;};const sleeps=[];
 const result=await repoWithSleep(client,sleeps).releases.upsertEvidenceSafely('SR-1',{指标同步时间:'2026-09-01T00:00:00Z'},{'Post ID':'99',视频链接:'https://video/99',账号:[{id:'rec-a'}],日期:'2026-09-01'},'rec-c');assert.equal(result.readback,'verified');assert.equal(client.calls.update.length,1);assert.equal(sleeps.length,1);
});

test('sync repository indexes explicitly omit derived display fields on every reload',async()=>{
 const client=fakeClient({'tbl-releases':[{record_id:'rec-release',fields:{发布ID:'SR-000001',采集记录:[{id:'rec-1'},{id:'rec-2'}]}}]});
 const original=client.listRecords;
 client.listRecords=async(base,table,options)=>{
  assert.equal(options.writableOnly,true);
  return original(base,table,options);
 };
 const repos=new BaseRepositories({client,appToken:'app',tableIds,writableOnly:true});
 for(let n=0;n<2;n++)assert.equal((await repos.releases.loadIndex()).get('SR-000001').fields.采集记录.length,2);
});
test('read and sync indexes ignore wholly empty drafts but reject populated rows without IDs',async()=>{const client=fakeClient({[tableIds.releases]:[{record_id:'r1',fields:{发布ID:'SR-000001',日期:'2026-09-20'}},{record_id:'draft',fields:{发布ID:null,日期:null,账号:[],剧:[],采集记录:[]}}]});const repos=makeRepos(client);assert.equal((await repos.releases.loadIndex()).size,1);client.rows[tableIds.releases][1].fields.日期='2026-09-20';await assert.rejects(repos.releases.loadIndex(),e=>e.code==='duplicate_base_key');});


test("account registration time survives metric sync and rejects machine edits", async () => {
  const field = "接收时间/注册时间";
  const value = "2026-09-18T02:30:00.000Z";
  const client = fakeClient({
    [tableIds.accounts]: [{ record_id: "rec-a", fields: { 账号ID: "a", [field]: value, 粉丝数: 1 } }],
  });
  const repos = makeRepos(client);
  const result = await repos.accounts.syncManyMachine([{ key: "a", patch: { 粉丝数: 20 } }]);
  assert.equal(result.readback, "verified");
  assert.equal((await repos.accounts.getByKey("a")).fields[field], value);
  assert.deepEqual(client.calls.update[0].records, [{ record_id: "rec-a", fields: { 粉丝数: 20 } }]);
  await assert.rejects(
    repos.accounts.syncManyMachine([{ key: "a", patch: { [field]: null } }]),
    (error) => error.code === "field_owner_violation",
  );
  assert.equal(client.calls.update.length, 1);
});

test('candidate confirmation integrates real repositories, persisted receipt, actor gate and independent relation readback',async()=>{
 const {HumanOpsService}=await import('../src/human-ops.mjs');const {JobStore}=await import('../src/job-store.mjs');const {queryReleaseCandidates}=await import('../src/match-candidates.mjs');
 const {mkdtempSync,rmSync}=await import('node:fs');const {tmpdir}=await import('node:os');const {join}=await import('node:path');const {randomUUID}=await import('node:crypto');
 const dir=mkdtempSync(join(tmpdir(),'candidate-confirm-e2e-'));
 const client=fakeClient({
  [tableIds.accounts]:[{record_id:'a',fields:{账号ID:'one',账号名:'One'}}],
  [tableIds.dramas]:[{record_id:'d',fields:{剧ID:'SD-000001',剧名:'Hunter’s Prey'}}],
  [tableIds.captures]:[{record_id:'c',fields:{'Post ID':'111',账号:[{id:'a'}],视频链接:'https://www.tiktok.com/@one/video/111',发布时间:'2026-09-18T20:00:00+08:00',关联发布记录:[]}}],
  [tableIds.releases]:[{record_id:'r',fields:{发布ID:'SR-000001',账号:[{id:'a'}],剧:[{id:'d'}],日期:'2026-09-19',备注:'第1条',归档状态:'active',采集记录:[]}}],
 });
 const repos=makeRepos(client);const dbPath=join(dir,'ops.sqlite');let jobs=new JobStore(dbPath);const make=()=>new HumanOpsService({repos,jobs,operators:new Set(['op']),privileged:new Set(),now:()=>new Date('2026-09-21T00:00:00Z'),makeReceiptId:()=>`sdp_${randomUUID()}`,allocateDramaId:()=>{throw Error('unexpected allocation')},allocateReleaseId:()=>{throw Error('unexpected allocation')}});
 try{
  const q=await queryReleaseCandidates({repos,now:new Date('2026-09-21T00:00:00Z'),readPosts:()=>[{post_id:'111',username:'one',post_url:'https://www.tiktok.com/@one/video/111',published_at:'2026-09-18T12:00:00Z',caption:"Part 1 | Hunter's Prey"}]});
  assert.equal(q.rows[0].candidates[0].post_id,'111');const p=await make().previewCaptureMatch({actorId:'op',chatId:'chat',key:'SR-000001',postId:'111',expectedReleaseVersion:q.rows[0].release_version});assert.equal(client.calls.update.length,0);
  jobs.close();jobs=new JobStore(dbPath,{initialize:false});const service=make();
  await assert.rejects(service.applyPreview({actorId:'op',chatId:'other',receiptId:p.receipt_id}),e=>e.code==='preview_chat_mismatch');
  const r=await service.applyPreview({actorId:'op',chatId:'chat',receiptId:p.receipt_id});assert.equal(r.capture_linked,true);assert.equal(r.record_id,'SR-000001');assert.equal(r.changed_fields.length,1);assert.ok(r.changed_fields[0].fields.采集记录);
  const fresh=await repos.releases.getByKey('SR-000001');assert.deepEqual(fresh.fields.采集记录,[{id:'c'}]);assert.equal(fresh.fields.日期,'2026-09-19');assert.equal(client.calls.update.length,2);assert.ok(client.calls.get.some(c=>c.recordId==='r'));
 }finally{jobs.close();rmSync(dir,{recursive:true,force:true});}
});

import { captureMatchVersion } from '../src/match-candidates.mjs';
function automaticFixture(){
 const release={record_id:'r-auto',fields:{发布ID:'SR-000001',账号:[{id:'a-auto'}],剧:[{id:'d-auto'}],日期:'2026-09-22',计划发布时间:'2026-09-22',批次ID:'SB-test',计划序号:1,批次计划条数:1,处理负责人:[{id:'ou_owner'}],归档状态:'active'}};
 const capture={record_id:'c-auto',fields:{'Post ID':'123',账号:[{id:'a-auto'}],发布时间:'2026-09-22T01:00:00Z',视频链接:'https://www.tiktok.com/@one/video/123'}};
 const c=fakeClient({[tableIds.accounts]:[{record_id:'a-auto',fields:{账号ID:'one'}}],[tableIds.dramas]:[{record_id:'d-auto',fields:{剧ID:'SD-000001',剧名:'The Clear Title'}}],[tableIds.releases]:[release],[tableIds.captures]:[capture]});
 return {client:c,repos:makeRepos(c),release,capture};
}
test('automatic batch writer fills three evidence fields together and preserves all human fields',async()=>{
 const f=automaticFixture();assert.equal(typeof f.repos.releases.registerBatchPostSafely,'function');
 const r=await f.repos.releases.registerBatchPostSafely('SR-000001','123',f.release,captureMatchVersion(f.capture));
 assert.equal(r.readback,'verified');assert.equal(r.record.fields['Post ID'],'123');assert.deepEqual(r.record.fields.采集记录,[{id:'c-auto'}]);assert.equal(r.record.fields.日期,'2026-09-22');assert.equal(f.client.calls.update.length,1);
 assert.equal(r.record.fields.匹配方式,'batch_title_sequence');
});
test('caption backfill writer attaches an unbatched or partially identified release without replacing human fields',async()=>{
 for(const existingPostId of [null,'123']){
  const f=automaticFixture();delete f.release.fields.批次ID;delete f.client.rows[tableIds.releases][0].fields.批次ID;
  if(existingPostId){f.release.fields['Post ID']=existingPostId;f.client.rows[tableIds.releases][0].fields['Post ID']=existingPostId;}
  const result=await f.repos.releases.registerCaptionPostSafely('SR-000001','123',f.release,captureMatchVersion(f.capture),{expectedDramaRecordId:'d-auto'});
  assert.equal(result.readback,'verified');assert.equal(result.record.fields['Post ID'],'123');assert.deepEqual(result.record.fields.采集记录,[{id:'c-auto'}]);
  assert.equal(result.record.fields.日期,'2026-09-22');assert.equal(f.client.calls.update.length,1);
 }
});
test('caption backfill writer rejects a changed drama relation before any update',async()=>{
 const f=automaticFixture();delete f.release.fields.批次ID;delete f.client.rows[tableIds.releases][0].fields.批次ID;
 await assert.rejects(f.repos.releases.registerCaptionPostSafely('SR-000001','123',f.release,captureMatchVersion(f.capture),{expectedDramaRecordId:'other'}));
 assert.equal(f.client.calls.update.length,0);
});
test('bounded caption repair archives and unlinks only the exact mistaken system-created release',async()=>{
 const f=automaticFixture(),fields={...f.release.fields};
 delete fields.剧;delete fields.批次ID;delete fields.计划序号;delete fields.批次计划条数;delete fields.处理负责人;
 Object.assign(fields,{'Post ID':'123',视频链接:f.capture.fields.视频链接,采集记录:[{id:'c-auto'}],匹配方式:'exact_post_id',匹配置信度:null,待处理原因:'剧名待人工匹配'});
 f.release.fields=structuredClone(fields);f.client.rows[tableIds.releases][0].fields=structuredClone(fields);
 f.client.rows[tableIds.captures][0].fields.关联发布记录=[{id:'r-auto'}];
 const original=f.client.updateRecords;
 f.client.updateRecords=async(...args)=>{const result=await original(...args);f.client.rows[tableIds.captures][0].fields.关联发布记录=[];return result;};
 const result=await f.repos.releases.archiveErroneousCaptionReleaseSafely({releaseId:'SR-000001',releaseRecordId:'r-auto',postId:'123',captureRecordId:'c-auto',accountRecordId:'a-auto'});
 assert.equal(result.readback,'verified');assert.equal(result.record.fields.归档状态,'archived');
 assert.equal(result.record.fields['Post ID'],null);assert.deepEqual(result.record.fields.采集记录,[]);
 assert.deepEqual(f.client.rows[tableIds.captures][0].fields.关联发布记录,[]);
});
test('caption backfill generated create writes identity and capture relation in one POST with readback',async()=>{
 const f=automaticFixture();f.client.rows[tableIds.releases]=[];f.repos.releases.serverGeneratedIds=true;
 f.client.listFields=async()=>({complete:true,items:[{name:'发布ID',type:'auto_number',style:{rules:[{text:'SR-',type:'text'},{length:6,type:'incremental_number'}]}}]});
 f.client.createRecords=async(_base,table,records,{beforeWrite}={})=>{
  await beforeWrite?.();const created={record_id:'r-new',fields:{发布ID:'SR-000002',...structuredClone(records[0].fields)}};
  f.client.rows[table].push(created);f.client.rows[tableIds.captures][0].fields.关联发布记录=[{id:'r-new'}];
  f.client.calls.create.push(records);return [{record_id:'r-new'}];
 };
 const patch={日期:'2026-09-22',账号:[{id:'a-auto'}],剧:[{id:'d-auto'}],归档状态:'active','Post ID':'123',
  视频链接:'https://www.tiktok.com/@one/video/123',采集记录:[{id:'c-auto'}],匹配方式:'exact_post_id',匹配置信度:null};
 const result=await f.repos.releases.createWithGeneratedId(patch,'caption_backfill',{beforeWrite:async before=>assert.equal(before.size,0)});
 assert.equal(result.readback,'verified');assert.equal(result.record.fields.发布ID,'SR-000002');
 assert.deepEqual(result.record.fields.采集记录,[{id:'c-auto'}]);assert.equal(f.client.calls.create.length,1);
});
test('generated create waits for acknowledged fields to become visible without replaying the POST',async()=>{
 const f=automaticFixture();f.client.rows[tableIds.releases]=[];f.repos.releases.serverGeneratedIds=true;f.repos.releases.sleep=async()=>{};
 f.client.listFields=async()=>({complete:true,items:[{name:'发布ID',type:'auto_number',style:{rules:[{text:'SR-',type:'text'},{length:6,type:'incremental_number'}]}}]});
 let posts=0,reads=0;
 f.client.createRecords=async(_base,table,records,{beforeWrite}={})=>{
  await beforeWrite?.();posts++;
  f.client.rows[table].push({record_id:'r-new',fields:{发布ID:'SR-000002',...structuredClone(records[0].fields)}});
  return [{record_id:'r-new'}];
 };
 f.client.getRecord=async()=>{
  reads++;
  const full=f.client.rows[tableIds.releases][0];
  return reads===1?{record_id:'r-new',fields:{发布ID:'SR-000002',日期:full.fields.日期}}:structuredClone(full);
 };
 const patch={日期:'2026-09-22',账号:[{id:'a-auto'}],剧:[{id:'d-auto'}],归档状态:'active','Post ID':'123',
  视频链接:'https://www.tiktok.com/@one/video/123',采集记录:[{id:'c-auto'}],匹配方式:'exact_post_id',匹配置信度:null};
 const result=await f.repos.releases.createWithGeneratedId(patch,'caption_backfill',{beforeWrite:async()=>{}});
 assert.equal(result.readback,'verified');assert.equal(reads,2);assert.equal(posts,1);
});
test('generated create rejects a nonblank conflicting readback without hiding it as lag',async()=>{
 const f=automaticFixture();f.client.rows[tableIds.releases]=[];f.repos.releases.serverGeneratedIds=true;let reads=0,posts=0;
 f.client.listFields=async()=>({complete:true,items:[{name:'发布ID',type:'auto_number',style:{rules:[{text:'SR-',type:'text'},{length:6,type:'incremental_number'}]}}]});
 f.client.createRecords=async(_base,table,records,{beforeWrite}={})=>{await beforeWrite?.();posts++;f.client.rows[table].push({record_id:'r-new',fields:{发布ID:'SR-000002',...records[0].fields}});return [{record_id:'r-new'}];};
 f.client.getRecord=async()=>{reads++;return {record_id:'r-new',fields:{发布ID:'SR-000002',日期:'2026-09-22',待处理原因:'someone else changed it'}};};
 await assert.rejects(f.repos.releases.createWithGeneratedId({日期:'2026-09-22',待处理原因:'剧名待人工匹配'},'caption_backfill',{beforeWrite:async()=>{}}),e=>e.code==='readback_mismatch');
 assert.equal(reads,1);assert.equal(posts,1);
});
test('automatic batch writer rejects human edits, existing evidence, wrong account and archived ownership before writes',async()=>{
 for(const mutate of [f=>f.client.rows[tableIds.releases][0].fields.备注='changed',f=>f.client.rows[tableIds.releases][0].fields.视频链接='https://example.com/manual',f=>f.client.rows[tableIds.captures][0].fields.账号=[{id:'wrong'}],f=>f.client.rows[tableIds.releases].push({record_id:'r-old',fields:{发布ID:'SR-000099',归档状态:'archived','Post ID':'123'}})]){
  const f=automaticFixture();assert.equal(typeof f.repos.releases.registerBatchPostSafely,'function');mutate(f);await assert.rejects(f.repos.releases.registerBatchPostSafely('SR-000001','123',f.release,captureMatchVersion(f.capture)));assert.equal(f.client.calls.update.length,0);
 }
});

test('complete-index reads restart from page zero for revision drift without accepting mixed metadata',async()=>{
 const client=fakeClient({[tableIds.releases]:[{record_id:'r',fields:{发布ID:'SR-000001'}}]});const original=client.listRecords;let calls=0;const sleeps=[];
 client.listRecords=async(...args)=>{if(++calls===1){const e=new Error('Feishu record list schema changed during pagination');e.code='base_response_invalid';e.details={pagination_metadata_key:'rev',changed_metadata:['rev']};throw e;}return original(...args);};
 const repos=repoWithSleep(client,sleeps);const index=await repos.releases.loadIndex();assert.equal(index.size,1);assert.equal(calls,2);assert.deepEqual(sleeps,[1000]);assert.equal(client.calls.create.length,0);
});
test('complete-index reads never retry real schema changes and bound persistent revision churn',async()=>{
 for(const key of ['field_id_list','rev']){const client=fakeClient();let calls=0;client.listRecords=async()=>{calls++;const e=new Error('drift');e.code='base_response_invalid';e.details={pagination_metadata_key:key};throw e;};const repos=repoWithSleep(client,[]);await assert.rejects(repos.releases.loadIndex());assert.equal(calls,key==='rev'?3:1);assert.equal(repos.releases.index,null);}
});
test('generated create records whether a write was attempted and never retries the POST',async()=>{
 for(const stage of ['preflight','post']){
  const f=automaticFixture();f.repos.releases.serverGeneratedIds=true;let posts=0;
  f.client.listFields=async()=>{if(stage==='preflight'){const e=new Error('invalid metadata');e.code='base_response_invalid';throw e;}return {complete:true,items:[{name:'发布ID',type:'auto_number',style:{rules:[{text:'SR-',type:'text'},{length:6,type:'incremental_number'}]}}]};};
  f.client.createRecords=async(_b,_t,_r,options)=>{await options.beforeWrite?.();posts++;const e=new Error('response lost');e.code='base_response_invalid';throw e;};
  await assert.rejects(f.repos.releases.createWithGeneratedId({日期:'2026-09-22'},'human'),e=>e.details.write_attempted===(stage==='post')&&e.details.phase===(stage==='post'?'generated_create_write_or_readback':'generated_create_preflight'));
  assert.equal(posts,stage==='post'?1:0);
 }
});

test('recognized caption fills an empty drama and exact capture link while preserving scheduling fields',async()=>{
 const {captureMatchVersion}=await import('../src/match-candidates.mjs');
 const release={record_id:'r1',fields:{发布ID:'SR-1',账号:[{id:'a1'}],日期:'2026-09-29',归档状态:'active',备注:'preserve'}};
 const capture={record_id:'c1',fields:{'Post ID':'123',账号:[{id:'a1'}],视频链接:'https://www.tiktok.com/@one/video/123',发布时间:'2026-09-29T03:00:00Z',关联发布记录:[]}};
 const client=fakeClient({'tbl-accounts':[{record_id:'a1',fields:{账号ID:'one',表现形式:'AI真人剧'}}],'tbl-dramas':[{record_id:'d1',fields:{剧ID:'SD-1',剧名:'The Ice Man'}}],'tbl-releases':[release],'tbl-captures':[capture]});
 const repos=makeRepos(client);
 const written=await repos.releases.registerRecognizedPostSafely('SR-1','123',release,captureMatchVersion(capture),{expectedDramaRecordId:'d1',captureRepository:repos.captures});
 assert.equal(written.readback,'verified');assert.deepEqual(written.record.fields.剧,[{id:'d1'}]);assert.equal(written.record.fields.备注,'preserve');assert.equal(client.calls.update.length,1);
});
test('recognized caption fills only missing evidence on an already matching two-way capture link',async()=>{
 const {captureMatchVersion}=await import('../src/match-candidates.mjs');
 const release={record_id:'r1',fields:{发布ID:'SR-1',账号:[{id:'a1'}],剧:[{id:'d1'}],日期:'2026-09-29',归档状态:'active',采集记录:[{id:'c1'}]}};
 const capture={record_id:'c1',fields:{'Post ID':'123',账号:[{id:'a1'}],视频链接:'https://www.tiktok.com/@one/video/123',发布时间:'2026-09-29T03:00:00Z',关联发布记录:[{id:'r1'}]}};
 const client=fakeClient({'tbl-accounts':[{record_id:'a1',fields:{账号ID:'one',表现形式:'AI真人剧'}}],'tbl-dramas':[{record_id:'d1',fields:{剧ID:'SD-1',剧名:'The Ice Man'}}],'tbl-releases':[release],'tbl-captures':[capture]});
 const repos=makeRepos(client);
 const written=await repos.releases.registerRecognizedPostSafely('SR-1','123',release,captureMatchVersion(capture),{expectedDramaRecordId:'d1',captureRepository:repos.captures});
 assert.equal(written.readback,'verified');assert.equal(written.record.fields['Post ID'],'123');
 assert.equal(written.record.fields.视频链接,'https://www.tiktok.com/@one/video/123');
 assert.deepEqual(written.record.fields.采集记录,[{id:'c1'}]);assert.equal(client.calls.update.length,1);
});
test('recognized caption cannot overwrite a nonempty human drama selection',async()=>{
 const {captureMatchVersion}=await import('../src/match-candidates.mjs');
 const release={record_id:'r1',fields:{发布ID:'SR-1',账号:[{id:'a1'}],剧:[{id:'d-original'}],归档状态:'active'}};
 const capture={record_id:'c1',fields:{'Post ID':'123',账号:[{id:'a1'}],视频链接:'https://www.tiktok.com/@one/video/123',关联发布记录:[]}};
 const client=fakeClient({'tbl-accounts':[{record_id:'a1',fields:{账号ID:'one',表现形式:'AI真人剧'}}],'tbl-releases':[release],'tbl-captures':[capture]});
 const repos=makeRepos(client);
 await assert.rejects(()=>repos.releases.registerRecognizedPostSafely('SR-1','123',release,captureMatchVersion(capture),{expectedDramaRecordId:'different',captureRepository:repos.captures}));assert.equal(client.calls.update.length,0);
});

test('full recognition crosses real repositories and SQLite: new pool, new release, reverse link, idempotent next tick',async()=>{
 const {JobStore}=await import('../src/job-store.mjs');const {processContinuousCaptionReleases}=await import('../src/caption-backfill.mjs');
 const caption="Part 1 | The Ice Man A man's weakness is mocked. Watch on ReelShort. Search code 4933302.";
 const client=fakeClient({'tbl-accounts':[{record_id:'a1',fields:{账号ID:'one',表现形式:'AI真人剧',负责人:[{id:'ou_owner'}]}}],'tbl-captures':[{record_id:'c1',fields:{'Post ID':'123',Caption:caption,账号:[{id:'a1'}],视频链接:'https://www.tiktok.com/@one/video/123',发布时间:'2026-09-29T03:00:00.000Z',业务:'short-drama',关联发布记录:[]}}]});
 client.listFields=async(_base,tableId)=>({complete:true,items:[{name:tableId==='tbl-dramas'?'剧ID':'发布ID',type:'auto_number',style:{rules:[{text:tableId==='tbl-dramas'?'SD-':'SR-',type:'text'},{length:6,type:'incremental_number'}]}}]});
 const originalCreate=client.createRecords;
 client.createRecords=async(base,tableId,records,options)=>{
  await options?.beforeWrite?.();const field=tableId==='tbl-dramas'?'剧ID':'发布ID',prefix=tableId==='tbl-dramas'?'SD-':'SR-';
  const created=await originalCreate(base,tableId,records.map((r,i)=>({fields:{...r.fields,[field]:prefix+String((client.rows[tableId]?.length??0)+i+1).padStart(6,'0')}})));
  if(tableId==='tbl-releases')for(const r of created)for(const link of r.fields.采集记录??[])client.rows['tbl-captures'].find(c=>c.record_id===link.id).fields.关联发布记录=[{id:r.record_id}];
  return created;
 };
 const repos=makeRepos(client);repos.dramas.serverGeneratedIds=true;repos.releases.serverGeneratedIds=true;
 const jobs=new JobStore(':memory:');
 const args={jobs,repos,activationAt:'2026-09-29T00:00:00Z',recognizeDramas:true,now:()=>new Date('2026-09-29T08:00:00Z'),readPosts:async()=>[{post_id:'123',username:'one',post_url:'https://www.tiktok.com/@one/video/123',published_at:'2026-09-29T03:00:00.000Z',first_seen_at:'2026-09-29T06:00:00Z',caption}]};
 const result=await processContinuousCaptionReleases(args);assert.equal(result.status,'complete');assert.equal(client.calls.create.length,2);
 assert.equal(client.rows['tbl-dramas'][0].fields.剧名,'The Ice Man');assert.equal(client.rows['tbl-releases'][0].fields.剧[0].id,client.rows['tbl-dramas'][0].record_id);
 assert.equal(client.rows['tbl-captures'][0].fields.关联发布记录[0].id,client.rows['tbl-releases'][0].record_id);
 await processContinuousCaptionReleases(args);assert.equal(client.calls.create.length,2);jobs.close();
});
