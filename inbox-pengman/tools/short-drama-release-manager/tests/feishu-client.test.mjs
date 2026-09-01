import assert from "node:assert/strict";
import test from "node:test";

import { FeishuClient, createTenantTokenProvider } from "../src/feishu-client.mjs";

const okList = (items = [], extra = {}) => ({
  code: 0,
  data: { items, has_more: false, revision: "rev", ...extra },
});

test("Base v3 offset pagination consumes every page with one token snapshot", async () => {
  let tokenCalls = 0;
  const urls = [];
  const responses = [
    { code: 0, data: { items: [{ record_id: "rec1" }], has_more: true, offset: "next-2", revision: 7 } },
    { code: 0, data: { items: [{ record_id: "rec2" }], has_more: false, revision: 7 } },
  ];
  const client = new FeishuClient({
    tokenProvider: async () => { tokenCalls += 1; return "token"; },
    fetchJson: async (url) => { urls.push(url); return responses.shift(); },
  });

  assert.deepEqual(await client.listRecords("base/unsafe", "tbl unsafe"), {
    items: [{ record_id: "rec1" }, { record_id: "rec2" }],
    complete: true,
    revision: 7,
  });
  assert.equal(tokenCalls, 1);
  assert.match(urls[0], /\/open-apis\/base\/v3\/bases\/base%2Funsafe\/tables\/tbl%20unsafe\/records\?limit=200$/);
  assert.match(urls[1], /limit=200&offset=next-2$/);
});

test("dashboard pagination uses page_size/page_token while other lists use limit/offset", async () => {
  const urls = [];
  const responses = [
    okList([{ table_id: "t" }]),
    okList([{ field_id: "f" }]),
    okList([{ view_id: "v" }]),
    { code: 0, data: { items: [{ dashboard_id: "d1" }], has_more: true, page_token: "p2", revision: "r" } },
    { code: 0, data: { items: [{ dashboard_id: "d2" }], has_more: false, revision: "r" } },
  ];
  const client = new FeishuClient({
    tokenProvider: async () => "token",
    fetchJson: async (url) => { urls.push(url); return responses.shift(); },
  });

  await client.listTables("base");
  await client.listFields("base", "tbl");
  await client.listViews("base", "tbl");
  assert.deepEqual((await client.listDashboards("base")).items.map((item) => item.dashboard_id), ["d1", "d2"]);
  assert.deepEqual(urls.slice(0, 3).map((url) => new URL(url).search), ["?limit=100", "?limit=200", "?limit=200"]);
  assert.deepEqual(urls.slice(3).map((url) => new URL(url).search), ["?page_size=100", "?page_size=100&page_token=p2"]);
  assert.ok(urls.filter((url) => /\/tables(?:\?|$)|\/dashboards(?:\?|$)/.test(new URL(url).pathname + new URL(url).search))
    .every((url) => !/[?&](?:limit|page_size)=200(?:&|$)/.test(new URL(url).search)));
});

test("dashboard blocks use fixed Base v3 token pagination", async () => {
  const urls = [];
  const responses = [
    { code: 0, data: { items: [{ block_id: "b1", name: "活跃账号数" }], has_more: true, page_token: "p2", revision: "r" } },
    { code: 0, data: { items: [{ block_id: "b2", name: "待公开数" }], has_more: false, revision: "r" } },
  ];
  const client = new FeishuClient({ tokenProvider: async () => "token", fetchJson: async (url) => { urls.push(url); return responses.shift(); } });
  const result = await client.listDashboardBlocks("base", "dash");
  assert.deepEqual(result.items.map((item) => item.block_id), ["b1", "b2"]);
  assert.deepEqual(urls.map((url) => new URL(url).search), ["?page_size=100", "?page_size=100&page_token=p2"]);
  assert.equal(urls.every((url) => new URL(url).pathname === "/open-apis/base/v3/bases/base/dashboards/dash/blocks"), true);
});

test("malformed, incomplete, or non-progressing pagination fails closed", async (t) => {
  const cases = [
    [{ code: 0, data: { items: [], has_more: "false" } }, "has_more"],
    [{ code: 0, data: { items: [], has_more: true } }, "missing offset"],
    [{ code: 0, data: { items: {}, has_more: false } }, "items"],
    [{ code: "0", data: { items: [], has_more: false } }, "numeric response code"],
  ];
  for (const [payload, label] of cases) {
    await t.test(label, async () => {
      const client = new FeishuClient({ tokenProvider: async () => "token", fetchJson: async () => payload });
      await assert.rejects(() => client.listRecords("base", "tbl"), (error) => error.code === "base_response_invalid");
    });
  }

  await t.test("repeated offset", async () => {
    const responses = [
      { code: 0, data: { items: [], has_more: true, offset: "same", revision: 1 } },
      { code: 0, data: { items: [], has_more: true, offset: "same", revision: 1 } },
    ];
    const client = new FeishuClient({ tokenProvider: async () => "token", fetchJson: async () => responses.shift() });
    await assert.rejects(() => client.listRecords("base", "tbl"), (error) => error.code === "base_response_invalid");
  });

  await t.test("revision changes", async () => {
    const responses = [
      { code: 0, data: { items: [], has_more: true, offset: "next", revision: 1 } },
      { code: 0, data: { items: [], has_more: false, revision: 2 } },
    ];
    const client = new FeishuClient({ tokenProvider: async () => "token", fetchJson: async () => responses.shift() });
    await assert.rejects(() => client.listRecords("base", "tbl"), (error) => error.code === "base_response_invalid");
  });
});

test("batch create transposes stable first-seen fields to rows and validates returned IDs", async () => {
  const bodies = [];
  const client = new FeishuClient({
    tokenProvider: async () => "token",
    fetchJson: async (_url, options) => {
      bodies.push(options.body);
      return { code: 0, data: { record_id_list: options.body.rows.map((_row, index) => `rec-${bodies.length}-${index}`) } };
    },
  });
  const records = Array.from({ length: 201 }, (_, index) => ({
    fields: index === 0 ? { A: index } : index === 1 ? { B: index, A: index } : index === 200 ? { C: index } : { A: index },
  }));

  const written = await client.createRecords("base", "tbl", records);
  assert.deepEqual(bodies.map((body) => body.rows.length), [200, 1]);
  assert.deepEqual(bodies[0].fields, ["A", "B", "C"]);
  assert.deepEqual(bodies[1].fields, ["A", "B", "C"]);
  assert.deepEqual(bodies[0].rows.slice(0, 3), [[0, null, null], [1, 1, null], [2, null, null]]);
  assert.deepEqual(bodies[1].rows, [[null, null, 200]]);
  assert.equal(written.length, 201);
  assert.equal(written[0].record_id, "rec-1-0");
  assert.deepEqual(written[0].fields, records[0].fields);
});

test("batch update groups only contiguous equal patches and validates exact ID order", async () => {
  const bodies = [];
  const client = new FeishuClient({
    tokenProvider: async () => "token",
    fetchJson: async (_url, options) => {
      bodies.push(options.body);
      return { code: 0, data: { record_id_list: [...options.body.record_id_list] } };
    },
  });
  const records = [
    { record_id: "r1", fields: { 状态: "A" } },
    { record_id: "r2", fields: { 状态: "A" } },
    { record_id: "r3", fields: { 状态: "B" } },
    { record_id: "r4", fields: { 状态: "A" } },
  ];

  assert.deepEqual(await client.updateRecords("base", "tbl", records), records);
  assert.deepEqual(bodies, [
    { record_id_list: ["r1", "r2"], patch: { 状态: "A" } },
    { record_id_list: ["r3"], patch: { 状态: "B" } },
    { record_id_list: ["r4"], patch: { 状态: "A" } },
  ]);
});

test("one contiguous update patch is split at 200 records", async () => {
  const sizes = [];
  const client = new FeishuClient({
    tokenProvider: async () => "token",
    fetchJson: async (_url, options) => {
      sizes.push(options.body.record_id_list.length);
      return { code: 0, data: { record_id_list: options.body.record_id_list } };
    },
  });
  const records = Array.from({ length: 201 }, (_unused, index) => ({ record_id: `r${index}`, fields: { 状态: "A" } }));
  assert.equal((await client.updateRecords("base", "tbl", records)).length, 201);
  assert.deepEqual(sizes, [200, 1]);
});

test("same-table writes serialize across calls while different tables may overlap", async () => {
  let activeSame = 0;
  let maxSameTable = 0;
  let firstRelease;
  const firstGate = new Promise((resolve) => { firstRelease = resolve; });
  let otherRelease;
  const otherStarted = new Promise((resolve) => { otherRelease = resolve; });
  const events = [];
  const client = new FeishuClient({
    tokenProvider: async () => "token",
    fetchJson: async (url, options) => {
      const table = new URL(url).pathname.split("/").at(-3);
      if (table === "same") {
        activeSame += 1;
        maxSameTable = Math.max(maxSameTable, activeSame);
      } else {
        otherRelease();
      }
      events.push(`start:${table}:${options.body.rows?.[0]?.[0] ?? options.body.record_id_list?.[0]}`);
      if (table === "same" && events.length === 1) await firstGate;
      if (table === "same") activeSame -= 1;
      events.push(`end:${table}`);
      return options.body.rows
        ? { code: 0, data: { record_id_list: options.body.rows.map((_row, index) => `${table}-${index}`) } }
        : { code: 0, data: { record_id_list: options.body.record_id_list } };
    },
  });

  const first = client.createRecords("base", "same", [{ fields: { A: "first" } }]);
  await new Promise((resolve) => setImmediate(resolve));
  const second = client.createRecords("base", "same", [{ fields: { A: "second" } }]);
  const other = client.createRecords("base", "other", [{ fields: { A: "other" } }]);
  await otherStarted;
  assert.ok(events.some((event) => event.startsWith("start:other:")));
  assert.equal(events.filter((event) => event === "start:same:second").length, 0);
  firstRelease();
  await Promise.all([first, second, other]);
  assert.equal(maxSameTable, 1);
  assert.ok(events.indexOf("end:same") < events.indexOf("start:same:second"));
});

test("empty or malformed writes and mismatched responses fail closed", async (t) => {
  const client = new FeishuClient({
    tokenProvider: async () => "token",
    fetchJson: async () => ({ code: 0, data: { record_id_list: [] } }),
  });
  for (const operation of [
    () => client.createRecords("base", "tbl", []),
    () => client.createRecords("base", "tbl", [{ fields: {} }]),
    () => client.updateRecords("base", "tbl", [{ record_id: "r", fields: {} }]),
    () => client.updateRecords("base", "tbl", [{ record_id: "", fields: { A: 1 } }]),
  ]) {
    assert.throws(operation, (error) => error.code === "base_response_invalid");
  }

  await t.test("create count mismatch", async () => {
    await assert.rejects(
      () => client.createRecords("base", "tbl", [{ fields: { A: 1 } }]),
      (error) => error.code === "base_response_invalid",
    );
  });
  await t.test("update order mismatch", async () => {
    const mismatch = new FeishuClient({
      tokenProvider: async () => "token",
      fetchJson: async () => ({ code: 0, data: { record_id_list: ["r2", "r1"] } }),
    });
    await assert.rejects(
      () => mismatch.updateRecords("base", "tbl", [
        { record_id: "r1", fields: { A: 1 } },
        { record_id: "r2", fields: { A: 1 } },
      ]),
      (error) => error.code === "base_response_invalid",
    );
  });
  await t.test("ignored fields", async () => {
    const ignored = new FeishuClient({
      tokenProvider: async () => "token",
      fetchJson: async () => ({ code: 0, data: { record_id_list: ["r1"], ignored_fields: ["Bad"] } }),
    });
    await assert.rejects(
      () => ignored.createRecords("base", "tbl", [{ fields: { A: 1 } }]),
      (error) => error.code === "base_response_invalid",
    );
  });
});

test("rate limit and auth refresh share one maximum three-attempt request budget", async (t) => {
  await t.test("429 then 401 then success", async () => {
    const tokens = ["stale", "fresh"];
    const tokenProvider = async () => tokens.shift();
    tokenProvider.invalidate = () => {};
    const waits = [];
    const responses = [
      { status: 429, code: 1254291, headers: { "retry-after": "0" } },
      { status: 401, code: 99991672 },
      okList(),
    ];
    const client = new FeishuClient({
      tokenProvider,
      sleep: async (ms) => waits.push(ms),
      fetchJson: async () => responses.shift(),
    });
    assert.equal((await client.listRecords("base", "tbl")).complete, true);
    assert.deepEqual(waits, [0]);
  });

  await t.test("fourth attempt is never made", async () => {
    const tokens = ["stale", "fresh"];
    const tokenProvider = async () => tokens.shift();
    tokenProvider.invalidate = () => {};
    let attempts = 0;
    const responses = [
      { status: 429, code: 1254291, retry_after_ms: 0 },
      { status: 401, code: 99991672 },
      { status: 429, code: 1254291, retry_after_ms: 0 },
      okList(),
    ];
    const client = new FeishuClient({ tokenProvider, sleep: async () => {}, fetchJson: async () => {
      attempts += 1;
      return responses.shift();
    } });
    await assert.rejects(() => client.listRecords("base", "tbl"), (error) => error.code === "base_request_failed");
    assert.equal(attempts, 3);
  });

  await t.test("invalid refreshed token fails before another request", async () => {
    const tokens = ["stale", ""];
    const tokenProvider = async () => tokens.shift();
    tokenProvider.invalidate = () => {};
    let attempts = 0;
    const client = new FeishuClient({
      tokenProvider,
      fetchJson: async () => { attempts += 1; return { status: 401, code: 99991672 }; },
    });
    await assert.rejects(() => client.getRecord("base", "tbl", "rec"), (error) => error.code === "base_response_invalid");
    assert.equal(attempts, 1);
  });
});

test("authorization, schema drift, invalid JSON, and malformed payloads have stable codes", async () => {
  for (const [fetchJson, code] of [
    [async () => ({ code: 99991672, msg: "Access denied" }), "base_auth_failed"],
    [async () => ({ code: 1254045, msg: "field not found" }), "base_schema_drift"],
    [async () => { throw new SyntaxError("bad json"); }, "base_response_invalid"],
    [async () => ({ code: "0", data: {} }), "base_response_invalid"],
  ]) {
    const client = new FeishuClient({ tokenProvider: async () => "token", fetchJson });
    await assert.rejects(() => client.listRecords("base", "tbl"), (error) => error.code === code);
  }
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
  now += 300_000;
  assert.equal(await provider(), "tenant-2");
});

test("tenant authentication fails closed on malformed responses", async () => {
  for (const [payload, code] of [
    [{ code: 99991663 }, "base_auth_failed"],
    [{ code: 0, tenant_access_token: "", expire: 600 }, "base_response_invalid"],
    [{ code: 0, tenant_access_token: "token", expire: "600" }, "base_response_invalid"],
  ]) {
    const provider = createTenantTokenProvider({ appId: "id", appSecret: "secret", fetchJson: async () => payload });
    await assert.rejects(() => provider(), (error) => error.code === code);
  }
});

test("schema creation uses canonical Base v3 fields and establishes primary fields", async () => {
  const calls = [];
  const client = new FeishuClient({
    tokenProvider: async () => "token",
    fetchJson: async (url, options) => {
      calls.push([new URL(url).pathname, options]);
      if (options.method === "GET") return { code: 0, data: { record: { record_id: "rec" } } };
      if (url.endsWith("/tables")) return { code: 0, data: { table: { table_id: "tbl-new" } } };
      return { code: 0, data: { field: { field_id: `fld-${calls.length}` } } };
    },
  });

  assert.deepEqual(await client.getRecord("base", "tbl", "rec"), { record_id: "rec" });
  await client.createTable("base", "账号台账");
  await client.createField("base", "tbl", "账号台账", "主页链接");
  await client.createField("base", "tbl", "发布记录", "账号", { targetTableId: "tbl-account" });
  await client.createField("base", "tbl", "发布记录", "剧", { targetTableId: "tbl-drama" });
  await client.createField("base", "tbl", "发布记录", "账号名");
  await client.updateField("base", "tbl", "fld-default", "账号台账", "账号ID");

  assert.deepEqual(calls.map(([path]) => path), [
    "/open-apis/base/v3/bases/base/tables/tbl/records/rec",
    "/open-apis/base/v3/bases/base/tables",
    "/open-apis/base/v3/bases/base/tables/tbl/fields",
    "/open-apis/base/v3/bases/base/tables/tbl/fields",
    "/open-apis/base/v3/bases/base/tables/tbl/fields",
    "/open-apis/base/v3/bases/base/tables/tbl/fields",
    "/open-apis/base/v3/bases/base/tables/tbl/fields/fld-default",
  ]);
  assert.deepEqual(calls[1][1].body, { name: "账号台账", fields: [{ name: "账号ID", type: "text" }] });
  assert.deepEqual(calls[2][1].body, { name: "主页链接", type: "text", style: { type: "url" } });
  assert.deepEqual(calls[3][1].body, { name: "账号", type: "link", link_table: "tbl-account" });
  assert.deepEqual(calls[4][1].body, {
    name: "剧",
    type: "link",
    link_table: "tbl-drama",
    bidirectional: true,
    bidirectional_link_field_name: "关联发布记录",
  });
  assert.deepEqual(calls[5][1].body, {
    type: "lookup",
    name: "账号名",
    from: "账号台账",
    select: "账号名",
    where: { logic: "and", conditions: [["账号ID", "intersects", { type: "field_ref", field: "账号" }]] },
    aggregate: "raw_value",
  });
  assert.deepEqual(calls[6][1].body, { name: "账号ID", type: "text" });
  await assert.rejects(
    () => client.createField("base", "tbl", "选剧池", "关联发布记录", { targetTableId: "tbl-release" }),
    (error) => error.code === "base_schema_drift",
  );
});

test("canonical field payloads cover select, datetime, formula, and system fields", async () => {
  const bodies = [];
  const client = new FeishuClient({
    tokenProvider: async () => "token",
    fetchJson: async (_url, options) => {
      bodies.push(options.body);
      return { code: 0, data: { field: { field_id: `f${bodies.length}` } } };
    },
  });
  await client.createField("base", "tbl", "选剧池", "剧分类");
  await client.createField("base", "tbl", "选剧池", "上线日期");
  await client.createField("base", "tbl", "选剧池", "是否已排期");
  await client.createField("base", "tbl", "选剧池", "创建时间");
  assert.deepEqual(bodies, [
    { name: "剧分类", type: "select", multiple: true },
    { name: "上线日期", type: "datetime", style: { format: "yyyy-MM-dd" } },
    { name: "是否已排期", type: "formula", expression: 'IF(ISBLANK([关联发布记录]), "否", "是")' },
    { name: "创建时间", type: "created_at" },
  ]);
});

test("schema and presentation creates require IDs and reject arbitrary input", async () => {
  const client = new FeishuClient({ tokenProvider: async () => "token", fetchJson: async () => ({ code: 0, data: {} }) });
  for (const operation of [
    () => client.createTable("base", "账号台账"),
    () => client.createField("base", "tbl", "账号台账", "账号ID"),
    () => client.createView("base", "tbl", "账号台账", "在用账号"),
    () => client.createDashboard("base", "短剧发行管理仪表盘"),
    () => client.createDashboardBlock("base", "dash", "活跃账号数"),
    () => client.createField("base", "tbl", "账号台账", { name: "Injected" }),
    () => client.createField("base", "tbl", "账号台账", "账号ID", { arbitrary: true }),
    () => client.createView("base", "tbl", "账号台账", { name: "Injected" }),
    () => client.createDashboard("base", { name: "Injected" }),
    () => client.createDashboardBlock("base", "dash", { name: "Injected" }),
  ]) {
    await assert.rejects(operation, (error) => ["base_response_invalid", "base_schema_drift"].includes(error.code));
  }
});

test("fixed views apply filter, sort, group, and visible-field semantics", async () => {
  const calls = [];
  const client = new FeishuClient({
    tokenProvider: async () => "token",
    fetchJson: async (url, options) => {
      calls.push([new URL(url).pathname, options.body]);
      return { code: 0, data: {} };
    },
  });

  await client.updateView("base", "tbl", "view", "账号台账", "需处理账号");
  assert.deepEqual(calls.map(([path]) => path), ["filter", "sort", "group", "visible_fields"].map(
    (part) => `/open-apis/base/v3/bases/base/tables/tbl/views/view/${part}`,
  ));
  assert.deepEqual(calls[0][1], {
    logic: "and",
    conditions: [["同步状态", "intersects", ["partial", "failed"]]],
  });
  assert.deepEqual(calls[1][1], { sort_config: [{ field: "指标同步时间", desc: true }] });
  assert.deepEqual(calls[2][1], { group_config: [{ field: "所属组", desc: false }] });
  assert.ok(calls[3][1].visible_fields.includes("账号ID"));
  assert.ok(calls[3][1].visible_fields.includes("同步状态"));
});

test("single-select view filters use intersects with array values", async () => {
  const filters = [];
  const client = new FeishuClient({
    tokenProvider: async () => "token",
    fetchJson: async (url, options) => {
      if (new URL(url).pathname.endsWith("/filter")) filters.push(options.body);
      return { code: 0, data: {} };
    },
  });
  await client.updateView("base", "accounts", "active", "账号台账", "在用账号");
  await client.updateView("base", "captures", "complete", "采集数据", "完整");
  await client.updateView("base", "captures", "partial", "采集数据", "部分缺失");
  assert.deepEqual(filters, [
    { logic: "and", conditions: [["状态", "intersects", ["在用"]]] },
    { logic: "and", conditions: [["采集状态", "intersects", ["complete"]]] },
    { logic: "and", conditions: [["采集状态", "intersects", ["partial"]]] },
  ]);
});

test("fixed dashboard blocks use legal types/config and block writes serialize", async () => {
  const calls = [];
  let active = 0;
  let maxActive = 0;
  const client = new FeishuClient({
    tokenProvider: async () => "token",
    fetchJson: async (url, options) => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      calls.push([new URL(url).pathname, options.body]);
      await Promise.resolve();
      active -= 1;
      if (url.endsWith("/dashboards")) return { code: 0, data: { dashboard: { dashboard_id: "dash" } } };
      return { code: 0, data: { block: { block_id: `block-${calls.length}` } } };
    },
  });
  await client.createDashboard("base", "短剧发行管理仪表盘");
  await Promise.all([
    client.createDashboardBlock("base", "dash", "活跃账号数"),
    client.createDashboardBlock("base", "dash", "待公开数"),
  ]);
  assert.equal(maxActive, 1);
  assert.deepEqual(calls[0][1], { name: "短剧发行管理仪表盘" });
  assert.deepEqual(calls[1][1], {
    name: "活跃账号数",
    type: "statistics",
    data_config: {
      table_name: "账号台账",
      count_all: true,
      filter: {
        conjunction: "and",
        conditions: [{ field_name: "状态", operator: "is", value: "在用" }],
      },
    },
  });
  assert.equal(calls[2][1].type, "statistics");
  assert.equal(calls[2][1].data_config.count_all, true);
  assert.equal("series" in calls[2][1].data_config, false);
  assert.deepEqual(calls[2][1].data_config.filter.conditions, [
    { field_name: "发布状态", operator: "is", value: "待公开" },
  ]);
});

test("performance and terminal dashboard blocks use fixed aggregate and placeholder configs", async () => {
  const bodies = [];
  const client = new FeishuClient({
    tokenProvider: async () => "token",
    fetchJson: async (_url, options) => {
      bodies.push(options.body);
      return { code: 0, data: { block: { block_id: `b${bodies.length}` } } };
    },
  });
  await client.createDashboardBlock("base", "dash", "按账号最新累计表现");
  await client.createDashboardBlock("base", "dash", "按剧最新累计表现");
  await client.createDashboardBlock("base", "dash", "最近一次同步终态");
  const expectedSeries = ["播放量", "点赞", "收藏", "转发", "评论", "RS收益"].map(
    (field_name) => ({ field_name, rollup: "SUM" }),
  );
  assert.deepEqual(bodies[0].data_config.series, expectedSeries);
  assert.deepEqual(bodies[1].data_config.series, expectedSeries);
  assert.deepEqual(bodies[0].data_config.group_by, [{ field_name: "账号名", mode: "integrated" }]);
  assert.deepEqual(bodies[1].data_config.group_by, [{ field_name: "剧名", mode: "integrated" }]);
  assert.equal(bodies[0].data_config.table_name, "发布记录");
  assert.equal("count_all" in bodies[0].data_config, false);
  assert.deepEqual(bodies[2], {
    name: "最近一次同步终态",
    type: "text",
    data_config: { text: "尚无成功同步记录" },
  });
});

test("terminal dashboard block update is fixed, validated, and response-bound", async () => {
  const calls = [];
  const client = new FeishuClient({
    tokenProvider: async () => "token",
    fetchJson: async (url, options) => {
      calls.push([new URL(url).pathname, options]);
      return { code: 0, data: { block: { block_id: "block-terminal" } } };
    },
  });
  await client.updateDashboardTerminalBlock("base", "dash", "block-terminal", {
    state: "partial",
    runId: "shortdrama-20260901T080000+0800",
    finishedAt: "2026-09-01T08:04:03+08:00",
  });
  assert.equal(calls[0][0], "/open-apis/base/v3/bases/base/dashboards/dash/blocks/block-terminal");
  assert.equal(calls[0][1].method, "PATCH");
  assert.deepEqual(calls[0][1].body, {
    name: "最近一次同步终态",
    data_config: {
      text: "**最近一次同步终态**\n状态：partial\nrun_id：shortdrama-20260901T080000+0800\n完成时间：2026-09-01T08:04:03+08:00",
    },
  });

  for (const value of [
    { state: "running", runId: "run", finishedAt: "2026-09-01T08:04:03+08:00" },
    { state: "success", runId: "", finishedAt: "2026-09-01T08:04:03+08:00" },
    { state: "success", runId: "run", finishedAt: "2026-09-01T08:04:03" },
  ]) {
    assert.throws(
      () => client.updateDashboardTerminalBlock("base", "dash", "block-terminal", value),
      (error) => error.code === "base_response_invalid",
    );
  }

  const mismatch = new FeishuClient({
    tokenProvider: async () => "token",
    fetchJson: async () => ({ code: 0, data: { block: { block_id: "another" } } }),
  });
  await assert.rejects(
    () => mismatch.updateDashboardTerminalBlock("base", "dash", "block-terminal", {
      state: "failed", runId: "run", finishedAt: "2026-09-01T08:04:03Z",
    }),
    (error) => error.code === "base_response_invalid",
  );
});

test("request logging exposes only method path status and run_id", async () => {
  const logs = [];
  const client = new FeishuClient({
    tokenProvider: async () => "super-secret-token",
    runId: "run-1",
    logger: (entry) => logs.push(entry),
    fetchJson: async (_url, options) => ({ code: 0, data: { record_id_list: options.body.rows.map(() => "rec") } }),
  });
  await client.createRecords("base", "tbl", [{ fields: { Notes: "private free text" } }]);
  assert.deepEqual(logs, [{
    method: "POST",
    path: "/open-apis/base/v3/bases/base/tables/tbl/records/batch_create",
    status: 200,
    run_id: "run-1",
  }]);
  assert.doesNotMatch(JSON.stringify(logs), /super-secret-token|private free text|authorization/i);
});
