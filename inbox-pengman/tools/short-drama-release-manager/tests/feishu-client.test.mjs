import assert from "node:assert/strict";
import test from "node:test";

import { FeishuClient, createTenantTokenProvider } from "../src/feishu-client.mjs";

test("pagination requires explicit boolean has_more and consumes every page with one token", async () => {
  let tokenCalls = 0;
  const urls = [];
  const responses = [
    { code: 0, data: { items: [{ record_id: "rec1" }], has_more: true, page_token: "p2", revision: 7 } },
    { code: 0, data: { items: [{ record_id: "rec2" }], has_more: false, revision: 7 } },
  ];
  const client = new FeishuClient({
    tokenProvider: async () => { tokenCalls += 1; return "token"; },
    fetchJson: async (url) => { urls.push(url); return responses.shift(); },
  });

  const result = await client.listRecords("app/unsafe", "tbl unsafe");

  assert.deepEqual(result, {
    items: [{ record_id: "rec1" }, { record_id: "rec2" }],
    complete: true,
    revision: 7,
  });
  assert.equal(tokenCalls, 1);
  assert.equal(urls.length, 2);
  assert.match(urls[0], /\/apps\/app%2Funsafe\/tables\/tbl%20unsafe\/records\?page_size=200$/);
  assert.match(urls[1], /page_size=200&page_token=p2$/);
});

test("malformed or inconsistent pagination fails closed", async (t) => {
  const cases = [
    [{ code: 0, data: { items: [], has_more: "false" } }, "has_more"],
    [{ code: 0, data: { items: [], has_more: true } }, "page_token"],
    [{ code: 0, data: { items: {}, has_more: false } }, "items"],
    [{ code: "0", data: { items: [], has_more: false } }, "numeric response code"],
  ];
  for (const [payload, label] of cases) {
    await t.test(label, async () => {
      const client = new FeishuClient({ tokenProvider: async () => "token", fetchJson: async () => payload });
      await assert.rejects(
        () => client.listRecords("app", "tbl"),
        (error) => error.code === "base_response_invalid",
      );
    });
  }

  await t.test("revision changes", async () => {
    const responses = [
      { code: 0, data: { items: [], has_more: true, page_token: "p2", revision: 1 } },
      { code: 0, data: { items: [], has_more: false, revision: 2 } },
    ];
    const client = new FeishuClient({ tokenProvider: async () => "token", fetchJson: async () => responses.shift() });
    await assert.rejects(
      () => client.listRecords("app", "tbl"),
      (error) => error.code === "base_response_invalid",
    );
  });
});

test("all list methods use fixed paths and return complete lists", async () => {
  const urls = [];
  const client = new FeishuClient({
    tokenProvider: async () => "token",
    fetchJson: async (url) => {
      urls.push(url);
      return { code: 0, data: { items: [{ id: urls.length }], has_more: false, revision: "rev" } };
    },
  });

  for (const operation of [
    () => client.listTables("app"),
    () => client.listFields("app", "tbl"),
    () => client.listViews("app", "tbl"),
    () => client.listDashboards("app"),
  ]) {
    assert.deepEqual(await operation(), { items: [{ id: urls.length }], complete: true, revision: "rev" });
  }

  assert.deepEqual(urls.map((url) => new URL(url).pathname), [
    "/open-apis/bitable/v1/apps/app/tables",
    "/open-apis/bitable/v1/apps/app/tables/tbl/fields",
    "/open-apis/bitable/v1/apps/app/tables/tbl/views",
    "/open-apis/bitable/v1/apps/app/dashboards",
  ]);
});

test("writes are split into ordered serial batches of at most 200 with one token", async () => {
  let tokenCalls = 0;
  let active = 0;
  let maxActive = 0;
  const groups = [];
  const client = new FeishuClient({
    tokenProvider: async () => { tokenCalls += 1; return "token"; },
    fetchJson: async (_url, options) => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      groups.push(options.body.records.map((record) => record.fields.Key));
      await Promise.resolve();
      active -= 1;
      return { code: 0, data: { records: options.body.records } };
    },
  });
  const records = Array.from({ length: 401 }, (_, index) => ({ fields: { Key: String(index) } }));

  const written = await client.createRecords("app", "tbl", records);

  assert.deepEqual(groups.map((group) => group.length), [200, 200, 1]);
  assert.deepEqual(groups.flat(), records.map((record) => record.fields.Key));
  assert.deepEqual(written, records);
  assert.equal(maxActive, 1);
  assert.equal(tokenCalls, 1);
});

test("update batches preserve order and use the fixed batch_update path", async () => {
  const calls = [];
  const client = new FeishuClient({
    tokenProvider: async () => "token",
    fetchJson: async (url, options) => {
      calls.push([url, options.body.records]);
      return { code: 0, data: { records: options.body.records } };
    },
  });
  const records = Array.from({ length: 201 }, (_, index) => ({ record_id: `rec${index}`, fields: {} }));
  assert.deepEqual(await client.updateRecords("app", "tbl", records), records);
  assert.deepEqual(calls.map(([, group]) => group.length), [200, 1]);
  assert.ok(calls.every(([url]) => url.endsWith("/records/batch_update")));
});

test("rate limit retries are bounded and honor retry timing", async (t) => {
  await t.test("payload retry_after_ms", async () => {
    let attempts = 0;
    const waits = [];
    const client = new FeishuClient({
      tokenProvider: async () => "token",
      sleep: async (ms) => waits.push(ms),
      fetchJson: async () => {
        attempts += 1;
        return attempts < 3
          ? { code: 1254291, msg: "rate limited", retry_after_ms: 10 }
          : { code: 0, data: { records: [] } };
      },
    });
    await client.createRecords("app", "tbl", [{ fields: { Key: "1" } }]);
    assert.equal(attempts, 3);
    assert.deepEqual(waits, [10, 10]);
  });

  await t.test("Retry-After and terminal third attempt", async () => {
    let attempts = 0;
    const waits = [];
    const client = new FeishuClient({
      tokenProvider: async () => "token",
      sleep: async (ms) => waits.push(ms),
      fetchJson: async () => {
        attempts += 1;
        return { status: 429, headers: { "retry-after": "2" }, code: 1254291 };
      },
    });
    await assert.rejects(
      () => client.createRecords("app", "tbl", [{ fields: {} }]),
      (error) => error.code === "base_request_failed",
    );
    assert.equal(attempts, 3);
    assert.deepEqual(waits, [2000, 2000]);
  });
});

test("authorization, schema, and invalid JSON errors have distinct stable codes", async () => {
  for (const [fetchJson, code] of [
    [async () => ({ code: 99991672, msg: "Access denied" }), "base_auth_failed"],
    [async () => ({ code: 1254045, msg: "field not found" }), "base_schema_drift"],
    [async () => { throw new SyntaxError("bad json"); }, "base_response_invalid"],
  ]) {
    const client = new FeishuClient({ tokenProvider: async () => "token", fetchJson });
    await assert.rejects(() => client.listRecords("app", "tbl"), (error) => error.code === code);
  }
});

test("an explicit 401 invalidates and refreshes the operation token once", async () => {
  const tokens = ["stale", "fresh"];
  const invalidated = [];
  const tokenProvider = async () => tokens.shift();
  tokenProvider.invalidate = (token) => invalidated.push(token);
  const authorizations = [];
  const client = new FeishuClient({
    tokenProvider,
    fetchJson: async (_url, options) => {
      authorizations.push(options.headers.authorization);
      return authorizations.length === 1
        ? { status: 401, code: 99991672 }
        : { code: 0, data: { items: [], has_more: false } };
    },
  });

  assert.equal((await client.listRecords("app", "tbl")).complete, true);
  assert.deepEqual(invalidated, ["stale"]);
  assert.deepEqual(authorizations, ["Bearer stale", "Bearer fresh"]);
});

test("a repeated 401 retries authentication only once", async () => {
  let tokenCalls = 0;
  let requests = 0;
  const tokenProvider = async () => { tokenCalls += 1; return `token-${tokenCalls}`; };
  tokenProvider.invalidate = () => {};
  const client = new FeishuClient({
    tokenProvider,
    fetchJson: async () => { requests += 1; return { status: 401, code: 99991672 }; },
  });

  await assert.rejects(() => client.getRecord("app", "tbl", "rec"), (error) => error.code === "base_auth_failed");
  assert.equal(tokenCalls, 2);
  assert.equal(requests, 2);
});

test("tenant tokens cache to expire minus 300 seconds and share in-flight authentication", async () => {
  let now = 1_000;
  let authCalls = 0;
  const provider = createTenantTokenProvider({
    appId: "app-id",
    appSecret: "app-secret",
    now: () => now,
    fetchJson: async (url, options) => {
      authCalls += 1;
      assert.equal(new URL(url).pathname, "/open-apis/auth/v3/tenant_access_token/internal");
      assert.deepEqual(options.body, { app_id: "app-id", app_secret: "app-secret" });
      await Promise.resolve();
      return { code: 0, tenant_access_token: `tenant-${authCalls}`, expire: 600 };
    },
  });

  assert.deepEqual(await Promise.all([provider(), provider(), provider()]), ["tenant-1", "tenant-1", "tenant-1"]);
  assert.equal(authCalls, 1);
  now += 299_999;
  assert.equal(await provider(), "tenant-1");
  now += 1;
  assert.equal(await provider(), "tenant-2");
  provider.invalidate("tenant-2");
  assert.equal(await provider(), "tenant-3");
});

test("tenant authentication fails closed on malformed responses", async () => {
  for (const [payload, code] of [
    [{ code: 99991663 }, "base_auth_failed"],
    [{ code: 0, tenant_access_token: "", expire: 600 }, "base_response_invalid"],
    [{ code: 0, tenant_access_token: "token", expire: "600" }, "base_response_invalid"],
  ]) {
    const provider = createTenantTokenProvider({
      appId: "id",
      appSecret: "secret",
      fetchJson: async () => payload,
    });
    await assert.rejects(() => provider(), (error) => error.code === code);
  }
});

test("record read and schema creation use fixed API payloads", async () => {
  const calls = [];
  const client = new FeishuClient({
    tokenProvider: async () => "token",
    fetchJson: async (url, options) => {
      calls.push([new URL(url).pathname, options]);
      if (options.method === "GET") return { code: 0, data: { record: { record_id: "rec" } } };
      return { code: 0, data: { table: {}, field: {} } };
    },
  });

  assert.deepEqual(await client.getRecord("app", "tbl", "rec"), { record_id: "rec" });
  await client.createTable("app", "账号台账");
  await client.createField("app", "tbl", "账号台账", "账号ID");
  assert.deepEqual(calls.map(([path]) => path), [
    "/open-apis/bitable/v1/apps/app/tables/tbl/records/rec",
    "/open-apis/bitable/v1/apps/app/tables",
    "/open-apis/bitable/v1/apps/app/tables/tbl/fields",
  ]);
  assert.deepEqual(calls[1][1].body, { table: { name: "账号台账" } });
  assert.deepEqual(calls[2][1].body, { field_name: "账号ID", type: 1 });
  await assert.rejects(
    () => client.createField("app", "tbl", "账号台账", { field_name: "Injected", type: 1 }),
    (error) => error.code === "base_schema_drift",
  );
  await assert.rejects(
    () => client.createField("app", "tbl", "账号台账", "账号ID", { free_text: "Injected" }),
    (error) => error.code === "base_schema_drift",
  );
});

test("view and dashboard writes only accept fixed section 6.5 definitions", async () => {
  const calls = [];
  const client = new FeishuClient({
    tokenProvider: async () => "token",
    fetchJson: async (url, options) => {
      calls.push([new URL(url).pathname, options.body]);
      return { code: 0, data: {} };
    },
  });

  await client.createView("app", "tbl", "账号台账", "在用账号");
  await client.updateView("app", "tbl", "view", "账号台账", "需处理账号");
  await client.createDashboard("app", "短剧发行总览");
  await client.createDashboardBlock("app", "dash", "活跃账号数");
  assert.deepEqual(calls.map(([path]) => path), [
    "/open-apis/bitable/v1/apps/app/tables/tbl/views",
    "/open-apis/bitable/v1/apps/app/tables/tbl/views/view",
    "/open-apis/bitable/v1/apps/app/dashboards",
    "/open-apis/bitable/v1/apps/app/dashboards/dash/blocks",
  ]);
  assert.deepEqual(calls.map(([, body]) => body.view_name ?? body.name), [
    "在用账号",
    "需处理账号",
    "短剧发行总览",
    "活跃账号数",
  ]);

  for (const operation of [
    () => client.createView("app", "tbl", "账号台账", { name: "Injected" }),
    () => client.updateView("app", "tbl", "view", "账号台账", "任意视图"),
    () => client.createDashboard("app", { name: "Injected" }),
    () => client.createDashboardBlock("app", "dash", { name: "Injected" }),
  ]) {
    await assert.rejects(operation, (error) => error.code === "base_schema_drift");
  }
});

test("request logging exposes only method path status and run_id", async () => {
  const logs = [];
  const client = new FeishuClient({
    tokenProvider: async () => "super-secret-token",
    runId: "run-1",
    logger: (entry) => logs.push(entry),
    fetchJson: async () => ({ code: 0, data: { records: [] } }),
  });

  await client.createRecords("app", "tbl", [{ fields: { Notes: "private free text" } }]);

  assert.deepEqual(logs, [{
    method: "POST",
    path: "/open-apis/bitable/v1/apps/app/tables/tbl/records/batch_create",
    status: 200,
    run_id: "run-1",
  }]);
  assert.doesNotMatch(JSON.stringify(logs), /super-secret-token|private free text|authorization/i);
});
