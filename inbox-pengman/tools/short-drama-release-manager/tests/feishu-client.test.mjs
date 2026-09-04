import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
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
  assert.match(urls[0], /\/open-apis\/base\/v3\/bases\/base%2Funsafe\/tables\/tbl%20unsafe\/records\?limit=200&offset=0$/);
  assert.match(urls[1], /limit=200&offset=next-2$/);
});

test("v1.0.91 vendor decoders normalize resource arrays, ids, totals, and record matrices", async () => {
  const calls = [];
  const client = new FeishuClient({
    tokenProvider: async () => "token",
    fetchJson: async (url, options) => {
      const parsed = new URL(url);
      calls.push(parsed.pathname + parsed.search);
      if (parsed.pathname.endsWith("/tables") && options.method === "GET") {
        const offset = Number(parsed.searchParams.get("offset"));
        return { code: 0, data: { tables: [{ id: offset === 0 ? "tbl_a" : "tbl_b", name: offset === 0 ? "A" : "B" }], total: 2 } };
      }
      if (parsed.pathname.endsWith("/fields") && options.method === "GET") {
        return { code: 0, data: { fields: [{ id: "fld_a", name: "Name", type: "text" }], total: 1 } };
      }
      if (parsed.pathname.endsWith("/views")) {
        return { code: 0, data: { views: [{ id: "vew_a", name: "Main", type: "grid" }], total: 1 } };
      }
      if (parsed.pathname.endsWith("/records")) {
        return { code: 0, data: {
          fields: ["Name", "Age"], field_id_list: ["fld_name", "fld_age"],
          record_id_list: ["rec_a"], data: [["Alice", 18]], total: 1,
        } };
      }
      if (parsed.pathname.endsWith("/fields") && options.method === "POST") {
        return { code: 0, data: { id: "fld_new", name: "主页链接", type: "text" } };
      }
      assert.fail(`unexpected ${options.method} ${parsed.pathname}`);
    },
  });
  assert.deepEqual((await client.listTables("base")).items.map((item) => [item.table_id, item.name]), [["tbl_a", "A"], ["tbl_b", "B"]]);
  assert.deepEqual((await client.listFields("base", "tbl_a")).items[0].field_id, "fld_a");
  assert.deepEqual((await client.listViews("base", "tbl_a")).items[0].view_id, "vew_a");
  assert.deepEqual((await client.listRecords("base", "tbl_a")).items, [{ record_id: "rec_a", fields: { Name: "Alice", Age: 18 } }]);
  assert.equal((await client.createField("base", "tbl_a", "账号台账", "主页链接")).field_id, "fld_new");
  assert.ok(calls.some((url) => url.includes("offset=0")));
  assert.ok(calls.some((url) => url.includes("offset=1")));
});

test("table detail exposes the authoritative primary field id", async () => {
  const client = new FeishuClient({
    tokenProvider: async () => "token",
    fetchJson: async () => ({
      code: 0,
      data: { id: "tbl_accounts", name: "账号台账", primary_field: "fld_account_id" },
    }),
  });
  assert.deepEqual(await client.getTable("base", "tbl_accounts"), {
    id: "tbl_accounts",
    name: "账号台账",
    primary_field: "fld_account_id",
    table_id: "tbl_accounts",
  });
});

test("vendor record matrix and total pagination fail closed on partial or mismatched shapes", async () => {
  for (const data of [
    { fields: ["Name"], record_id_list: ["rec"], data: [], total: 1 },
    { fields: ["Name"], field_id_list: ["fld", "extra"], record_id_list: ["rec"], data: [["A"]], total: 1 },
    { fields: ["Name"], record_id_list: ["rec"], data: [["A", "extra"]], total: 1 },
    { fields: ["Name"], record_id_list: ["rec"], data: [["A"]], total: 2, has_more: false },
  ]) {
    const client = new FeishuClient({ tokenProvider: async () => "token", fetchJson: async () => ({ code: 0, data }) });
    await assert.rejects(() => client.listRecords("base", "tbl"), (error) => error.code === "base_response_invalid");
  }
  for (const data of [
    { tables: [{ id: "tbl_a", table_id: "tbl_b", name: "bad" }], total: 1 },
    { tables: [{ id: "tbl_a", name: "bad" }], items: [], total: 1 },
  ]) {
    const client = new FeishuClient({ tokenProvider: async () => "token", fetchJson: async () => ({ code: 0, data }) });
    await assert.rejects(() => client.listTables("base"), (error) => error.code === "base_response_invalid");
  }
  const ignored = {
    fields: ["发布ID"], field_id_list: ["f1"], field_type_list: ["text"],
    record_id_list: ["rec"], data: [["SR-000001"]], total: 1,
    ignored_fields: [{ name: "播放量", reason: "unsupported" }],
    query_context: { record_scope: "all_records", field_scope: "selected_fields" },
    timezone: "Asia/Shanghai", rev: 7,
  };
  const strict = new FeishuClient({ tokenProvider: async () => "token", fetchJson: async () => ({ code: 0, data: ignored }) });
  await assert.rejects(() => strict.listRecords("base", "tbl", { tableName: "发布记录" }), (error) => error.code === "base_response_invalid");
  assert.equal((await strict.listRecords("base", "tbl", { tableName: "发布记录", writableOnly: true })).complete, true);
  const incompleteContext = structuredClone(ignored);
  incompleteContext.ignored_fields = [];
  incompleteContext.query_context = { field_scope: "selected_fields" };
  const incomplete = new FeishuClient({ tokenProvider: async () => "token", fetchJson: async () => ({ code: 0, data: incompleteContext }) });
  await assert.rejects(() => incomplete.listRecords("base", "tbl", { tableName: "发布记录" }), (error) => error.code === "base_response_invalid");
});

function completeRecordMatrix(overrides = {}) {
  return {
    fields: ["发布ID", "播放量", "归档状态"],
    record_id_list: ["rec_release"],
    data: [["SR-000001", "0", ["active"]]],
    total: 1,
    ...overrides,
  };
}

test("official record lists paginate by has_more when total and response offset are omitted", async () => {
  const calls = [];
  const pages = [
    {
      fields: ["发布ID", "播放量", "归档状态"],
      field_id_list: ["fld_release", "fld_views", "fld_archive"],
      field_type_list: ["text", "lookup", "single_select"],
      record_id_list: ["rec_1"],
      data: [["SR-000001", "10", ["active"]]],
      has_more: true,
      query_context: { record_scope: "all_records", field_scope: "all_fields" },
      timezone: "Asia/Shanghai",
      rev: 7,
    },
    {
      fields: ["发布ID", "播放量", "归档状态"],
      field_id_list: ["fld_release", "fld_views", "fld_archive"],
      field_type_list: ["text", "lookup", "single_select"],
      record_id_list: ["rec_2"],
      data: [["SR-000002", "20", ["active"]]],
      has_more: false,
      query_context: { record_scope: "all_records", field_scope: "all_fields" },
      timezone: "Asia/Shanghai",
      rev: 7,
    },
  ];
  const client = new FeishuClient({
    tokenProvider: async () => "token",
    fetchJson: async (url) => {
      calls.push(new URL(url).searchParams.get("offset"));
      return { code: 0, data: pages.shift() };
    },
  });
  const result = await client.listRecords("base", "tbl", { tableName: "发布记录" });
  assert.equal(result.complete, true);
  assert.deepEqual(calls, ["0", "1"]);
  assert.deepEqual(result.items.map((record) => record.fields.播放量), [10, 20]);
});

test("official fixed-table record lists are complete from the minimal matrix and stable total", async () => {
  const pages = [
    completeRecordMatrix({ record_id_list: ["rec_1"], data: [["SR-000001", "0", ["active"]]], total: 2 }),
    completeRecordMatrix({ record_id_list: ["rec_2"], data: [["SR-000002", null, ["archived"]]], total: 2 }),
  ];
  const client = new FeishuClient({ tokenProvider: async () => "token", fetchJson: async () => ({ code: 0, data: pages.shift() }) });
  assert.deepEqual((await client.listRecords("base", "tbl", { tableName: "发布记录" })).items.map((record) => record.fields.播放量), [0, null]);

  const optional = completeRecordMatrix({
    field_id_list: ["fld_release", "fld_views", "fld_archive"],
    field_type_list: ["text", "lookup", "single_select"], timezone: "Asia/Shanghai", rev: 7,
    query_context: { record_scope: "all_records", field_scope: "all_fields" }, ignored_fields: [],
  });
  const enriched = new FeishuClient({ tokenProvider: async () => "token", fetchJson: async () => ({ code: 0, data: optional }) });
  assert.equal((await enriched.listRecords("base", "tbl", { tableName: "发布记录" })).complete, true);

  for (const mutate of [
    (data) => { data.timezone = "UTC"; },
    (data) => { data.field_type_list = ["number", "lookup", "single_select"]; },
    (data) => { data.rev = ""; },
    (data) => { data.query_context.record_scope = "filtered_records"; },
    (data) => { data.query_context.field_scope = "selected_fields"; },
  ]) {
    const data = structuredClone(optional);
    mutate(data);
    const incomplete = new FeishuClient({ tokenProvider: async () => "token", fetchJson: async () => ({ code: 0, data }) });
    await assert.rejects(incomplete.listRecords("base", "tbl", { tableName: "发布记录" }), (error) => error.code === "base_response_invalid");
  }

  for (const mutate of [
    (data) => { data.fields[0] = "other"; },
    (data) => { data.field_id_list[0] = "fld_other"; },
    (data) => { data.field_type_list[0] = "number"; },
    (data) => { data.timezone = "UTC"; },
    (data) => { data.rev = 8; },
    (data) => { data.query_context.field_scope = "selected_fields"; },
    (data) => { data.total = 3; },
  ]) {
    const second = structuredClone(optional);
    second.record_id_list = ["rec_2"];
    second.data = [["SR-000002", "1", ["active"]]];
    second.total = 2;
    mutate(second);
    const first = structuredClone(optional);
    first.record_id_list = ["rec_1"];
    first.total = 2;
    const driftedPages = [first, second];
    const drifted = new FeishuClient({ tokenProvider: async () => "token", fetchJson: async () => ({ code: 0, data: driftedPages.shift() }) });
    await assert.rejects(drifted.listRecords("base", "tbl", { tableName: "发布记录" }), (error) => error.code === "base_response_invalid");
  }

  const firstEnriched = structuredClone(optional);
  firstEnriched.record_id_list = ["rec_1"];
  firstEnriched.total = 2;
  const secondMinimal = completeRecordMatrix({ record_id_list: ["rec_2"], data: [["SR-000002", "1", ["active"]]], total: 2 });
  const mixedPages = [firstEnriched, secondMinimal];
  const mixed = new FeishuClient({ tokenProvider: async () => "token", fetchJson: async () => ({ code: 0, data: mixedPages.shift() }) });
  assert.equal((await mixed.listRecords("base", "tbl", { tableName: "发布记录" })).complete, true);
});

test("optional record metadata keeps a per-key first-seen baseline across missing pages", async () => {
  const page = (recordId, overrides = {}) => completeRecordMatrix({
    record_id_list: [recordId], data: [[`SR-${recordId}`, "1", ["active"]]], total: 3, ...overrides,
  });
  const enriched = {
    field_id_list: ["fld_release", "fld_views", "fld_archive"],
    field_type_list: ["text", "lookup", "single_select"], timezone: "Asia/Shanghai", rev: 7,
    query_context: { record_scope: "all_records", field_scope: "all_fields" },
  };
  const driftPages = [page("1", enriched), page("2"), page("3", {
    ...enriched, field_id_list: ["fld_release_changed", "fld_views", "fld_archive"],
  })];
  const drift = new FeishuClient({ tokenProvider: async () => "token", fetchJson: async () => ({ code: 0, data: driftPages.shift() }) });
  await assert.rejects(drift.listRecords("base", "tbl", { tableName: "发布记录" }), (error) => error.code === "base_response_invalid");

  const safePages = [page("1"), page("2", enriched), page("3")];
  const safe = new FeishuClient({ tokenProvider: async () => "token", fetchJson: async () => ({ code: 0, data: safePages.shift() }) });
  assert.equal((await safe.listRecords("base", "tbl", { tableName: "发布记录" })).complete, true);
});

test("official record rev is optional or a nonnegative safe integer only", async () => {
  for (const rev of [undefined, null, 0, 7]) {
    const data = completeRecordMatrix();
    if (rev !== undefined) data.rev = rev;
    const client = new FeishuClient({ tokenProvider: async () => "token", fetchJson: async () => ({ code: 0, data }) });
    assert.equal((await client.listRecords("base", "tbl", { tableName: "发布记录" })).complete, true);
  }
  for (const rev of ["7", -1, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
    const client = new FeishuClient({ tokenProvider: async () => "token", fetchJson: async () => ({ code: 0, data: completeRecordMatrix({ rev }) }) });
    await assert.rejects(client.listRecords("base", "tbl", { tableName: "发布记录" }), (error) => error.code === "base_response_invalid");
  }
});

test("writable-only record projection is explicit and permits only derived ignored fields", async () => {
  let requested;
  const client = new FeishuClient({
    tokenProvider: async () => "token",
    fetchJson: async (url) => {
      requested = new URL(url);
      return { code: 0, data: completeRecordMatrix({
        fields: ["发布ID", "匹配方式"], field_id_list: ["fld_release", "fld_method"], field_type_list: ["text", "single_select"],
        data: [["SR-000001", ["exact_post_id"]]],
        query_context: { record_scope: "all_records", field_scope: "selected_fields" },
        ignored_fields: [{ id: "fld_views", name: "播放量", reason: "derived" }],
      }) };
    },
  });
  assert.equal((await client.listRecords("base", "tbl", { tableName: "发布记录", writableOnly: true })).complete, true);
  assert.ok(requested.searchParams.getAll("field_id").includes("发布ID"));
  assert.ok(requested.searchParams.getAll("field_id").includes("匹配方式"));
  assert.equal(requested.searchParams.getAll("field_id").includes("播放量"), false);
});

test("numeric lookup strings decode safely while nonnumeric or unsafe values fail", async () => {
  for (const value of ["NaN", "1e3", "-1", "9007199254740992", " 1", 1]) {
    const client = new FeishuClient({ tokenProvider: async () => "token", fetchJson: async () => ({ code: 0, data: completeRecordMatrix({
      fields: ["播放量"], field_id_list: ["fld_views"], field_type_list: ["lookup"], data: [[value]],
    }) }) });
    await assert.rejects(client.listRecords("base", "tbl", { tableName: "发布记录" }), (error) => error.code === "base_response_invalid");
  }
});

test("official cell codec preserves select, Shanghai datetime, links, null, and numeric zero", async () => {
  const bodies = [];
  const client = new FeishuClient({
    tokenProvider: async () => "token",
    fetchJson: async (url, options) => {
      bodies.push(options.body);
      if (new URL(url).pathname.endsWith("/records") && options.method === "GET") return { code: 0, data: {
        fields: ["日期", "归档状态", "账号", "RS收益", "备注"],
        field_id_list: ["f1", "f2", "f3", "f4", "f5"],
        field_type_list: ["datetime", "single_select", "link", "number", "text"],
        record_id_list: ["rec_release"],
        data: [["2026-09-01 08:00:00", ["active"], [{ id: "rec_account" }], 0, null]], total: 1,
      } };
      if (new URL(url).pathname.endsWith("/batch_update")) return { code: 0, data: {} };
      assert.fail("unexpected request");
    },
  });
  assert.deepEqual((await client.listRecords("base", "tbl", { tableName: "发布记录" })).items[0].fields, {
    日期: "2026-09-01T00:00:00.000Z", 归档状态: "active", 账号: [{ id: "rec_account" }], RS收益: 0, 备注: null,
  });
  await client.updateRecords("base", "tbl", [{ record_id: "rec_release", fields: {
    日期: "2026-09-02T00:00:00.000Z", 归档状态: "archived", 账号: [{ id: "rec_account" }], RS收益: 0,
  } }], { tableName: "发布记录" });
  assert.deepEqual(bodies[1], { update_records: { rec_release: {
    日期: "2026-09-02 08:00:00", 归档状态: ["archived"], 账号: [{ id: "rec_account" }], RS收益: 0,
  } } });

  for (const fields of [
    { 日期: "2026-02-30" },
    { 账号: [{ id: "rec_account", name: "smuggled" }] },
    { 归档状态: "paused" },
  ]) {
    await assert.rejects(
      client.updateRecords("base", "tbl", [{ record_id: "rec_release", fields }], { tableName: "发布记录" }),
      (error) => error.code === "base_response_invalid",
    );
  }

  const dateOnly = new FeishuClient({ tokenProvider: async () => "token", fetchJson: async () => ({ code: 0, data: {
    fields: ["日期"], field_id_list: ["f1"], field_type_list: ["datetime"],
    record_id_list: ["rec"], data: [["2026-09-03 00:00:00"]], total: 1,
  } }) });
  assert.equal((await dateOnly.listRecords("base", "tbl", { tableName: "发布记录" })).items[0].fields.日期, "2026-09-03");

  const wrongType = new FeishuClient({ tokenProvider: async () => "token", fetchJson: async () => ({ code: 0, data: {
    fields: ["日期"], field_id_list: ["f1"], field_type_list: ["text"],
    record_id_list: ["rec"], data: [["2026-09-03 00:00:00"]], total: 1,
  } }) });
  await assert.rejects(wrongType.listRecords("base", "tbl", { tableName: "发布记录" }), (error) => error.code === "base_response_invalid");
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
  assert.deepEqual(urls.slice(0, 3).map((url) => new URL(url).search), ["?limit=100&offset=0", "?limit=200&offset=0", "?limit=200&offset=0"]);
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

test("batch create uses official create_records rows and validates optional returned IDs", async () => {
  const bodies = [];
  const client = new FeishuClient({
    tokenProvider: async () => "token",
    fetchJson: async (_url, options) => {
      bodies.push(options.body);
      return { code: 0, data: { record_id_list: options.body.create_records.map((_row, index) => `rec-${bodies.length}-${index}`) } };
    },
  });
  const records = Array.from({ length: 201 }, (_, index) => ({
    fields: index === 0 ? { A: index } : index === 1 ? { B: index, A: index } : index === 200 ? { C: index } : { A: index },
  }));

  const written = await client.createRecords("base", "tbl", records);
  assert.deepEqual(bodies.map((body) => body.create_records.length), [200, 1]);
  assert.deepEqual(bodies[0].create_records.slice(0, 3), [{ A: 0 }, { B: 1, A: 1 }, { A: 2 }]);
  assert.deepEqual(bodies[1].create_records, [{ C: 200 }]);
  assert.equal(written.length, 201);
  assert.equal(written[0].record_id, "rec-1-0");
  assert.deepEqual(written[0].fields, records[0].fields);
});

test("batch update uses the official record map and validates optional returned IDs", async () => {
  const bodies = [];
  const client = new FeishuClient({
    tokenProvider: async () => "token",
    fetchJson: async (_url, options) => {
      bodies.push(options.body);
      return { code: 0, data: { record_id_list: Object.keys(options.body.update_records) } };
    },
  });
  const records = [
    { record_id: "r1", fields: { 状态: "A" } },
    { record_id: "r2", fields: { 状态: "A" } },
    { record_id: "r3", fields: { 状态: "B" } },
    { record_id: "r4", fields: { 状态: "A" } },
  ];

  assert.deepEqual(await client.updateRecords("base", "tbl", records), records);
  assert.deepEqual(bodies, [{ update_records: {
    r1: { 状态: "A" }, r2: { 状态: "A" }, r3: { 状态: "B" }, r4: { 状态: "A" },
  } }]);
});

test("one official update_records map is split at 200 records", async () => {
  const sizes = [];
  const client = new FeishuClient({
    tokenProvider: async () => "token",
    fetchJson: async (_url, options) => {
      sizes.push(Object.keys(options.body.update_records).length);
      return { code: 0, data: {} };
    },
  });
  const records = Array.from({ length: 201 }, (_unused, index) => ({ record_id: `r${index}`, fields: { 状态: "A" } }));
  assert.equal((await client.updateRecords("base", "tbl", records)).length, 201);
  assert.deepEqual(sizes, [200, 1]);
});

test("an aborted batch stops before the next remote mutation", async () => {
  const controller = new AbortController();
  let remoteMutations = 0;
  const client = new FeishuClient({
    tokenProvider: async () => "token",
    fetchJson: async (_url, options) => {
      assert.equal(options.signal, controller.signal);
      remoteMutations += 1;
      controller.abort();
      return { code: 0, data: { record_id_list: options.body.create_records.map((_row, index) => `r${index}`) } };
    },
  });
  const records = Array.from({ length: 201 }, (_unused, index) => ({ fields: { A: index } }));
  await assert.rejects(
    () => client.createRecords("base", "tbl", records, { signal: controller.signal }),
    (error) => error.code === "base_operation_aborted",
  );
  assert.equal(remoteMutations, 1);
});

test("abort interrupts rate-limit wait and prevents auth retry", async () => {
  const controller = new AbortController();
  let requests = 0;
  let sleeps = 0;
  const client = new FeishuClient({
    tokenProvider: async () => "token",
    fetchJson: async (_url, options) => {
      assert.equal(options.signal, controller.signal);
      requests += 1;
      controller.abort();
      return { code: 1254291, status: 429, data: {} };
    },
    sleep: async () => { sleeps += 1; },
  });
  await assert.rejects(
    () => client.listRecords("base", "tbl", { signal: controller.signal }),
    (error) => error.code === "base_operation_aborted",
  );
  assert.equal(requests, 1);
  assert.equal(sleeps, 0);
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
      events.push(`start:${table}:${options.body.create_records?.[0]?.A ?? Object.keys(options.body.update_records ?? {})[0]}`);
      if (table === "same" && events.length === 1) await firstGate;
      if (table === "same") activeSame -= 1;
      events.push(`end:${table}`);
      return options.body.create_records
        ? { code: 0, data: { record_id_list: options.body.create_records.map((_row, index) => `${table}-${index}`) } }
        : { code: 0, data: { record_id_list: Object.keys(options.body.update_records) } };
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

test("an aborted queued write cannot unlink the same-table serialization tail", async () => {
  let active = 0;
  let maxActive = 0;
  let requests = 0;
  let releaseFirst;
  const firstGate = new Promise((resolve) => { releaseFirst = resolve; });
  let firstStarted;
  const started = new Promise((resolve) => { firstStarted = resolve; });
  const client = new FeishuClient({
    tokenProvider: async () => "token",
    fetchJson: async (_url, options) => {
      requests += 1;
      active += 1;
      maxActive = Math.max(maxActive, active);
      if (requests === 1) {
        firstStarted();
        await firstGate;
      }
      await new Promise((resolve) => setImmediate(resolve));
      active -= 1;
      return { code: 0, data: { record_id_list: Object.keys(options.body.update_records) } };
    },
  });
  const write = (id, options) => client.updateRecords("base", "same", [{ record_id: id, fields: { A: id } }], options);
  const first = write("r1");
  await started;
  const controller = new AbortController();
  const second = write("r2", { signal: controller.signal });
  controller.abort();
  await assert.rejects(() => second, (error) => error.code === "base_operation_aborted");
  const third = write("r3");
  await new Promise((resolve) => setImmediate(resolve));
  releaseFirst();
  await Promise.all([first, third]);
  assert.equal(maxActive, 1);
  assert.equal(requests, 2);
  assert.equal(client.writeQueues.size, 0);
});

test("native Retry-After delay aborts promptly and clears its timer", async () => {
  const timeoutCount = () => process.getActiveResourcesInfo().filter((name) => name === "Timeout").length;
  const before = timeoutCount();
  const controller = new AbortController();
  const client = new FeishuClient({
    tokenProvider: async () => "token",
    fetchJson: async () => {
      setImmediate(() => controller.abort());
      return { code: 1254291, status: 429, headers: { "retry-after": "1" }, data: {} };
    },
  });
  const startedAt = Date.now();
  await assert.rejects(
    () => client.listRecords("base", "tbl", { signal: controller.signal }),
    (error) => error.code === "base_operation_aborted",
  );
  await new Promise((resolve) => setImmediate(resolve));
  assert.ok(Date.now() - startedAt < 250);
  assert.ok(timeoutCount() <= before);
});

test("native retry timer keeps a top-level worker alive, while abort leaves no lingering timer", () => {
  const moduleUrl = new URL("../src/feishu-client.mjs", import.meta.url).href;
  const retryScript = `
    import { FeishuClient } from ${JSON.stringify(moduleUrl)};
    let calls = 0;
    const client = new FeishuClient({
      tokenProvider: async () => "token",
      fetchJson: async () => ++calls === 1
        ? { code: 1254291, status: 429, retry_after_ms: 30, data: {} }
        : { code: 0, data: { items: [], has_more: false, revision: "r" } },
    });
    await client.listRecords("base", "tbl");
    if (calls !== 2) process.exit(2);
  `;
  const retried = spawnSync(process.execPath, ["--input-type=module", "--eval", retryScript], {
    encoding: "utf8",
    timeout: 2_000,
  });
  assert.equal(retried.status, 0, retried.stderr);

  const abortScript = `
    import { FeishuClient } from ${JSON.stringify(moduleUrl)};
    const controller = new AbortController();
    const started = Date.now();
    const client = new FeishuClient({
      tokenProvider: async () => "token",
      fetchJson: async () => {
        setTimeout(() => controller.abort(), 20);
        return { code: 1254291, status: 429, retry_after_ms: 5_000, data: {} };
      },
    });
    try { await client.listRecords("base", "tbl", { signal: controller.signal }); }
    catch (error) {
      if (error.code !== "base_operation_aborted" || Date.now() - started > 500) process.exit(3);
    }
  `;
  const abortStarted = Date.now();
  const aborted = spawnSync(process.execPath, ["--input-type=module", "--eval", abortScript], {
    encoding: "utf8",
    timeout: 1_000,
  });
  assert.equal(aborted.status, 0, aborted.stderr);
  assert.ok(Date.now() - abortStarted < 750);
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
    await assert.rejects(() => client.listRecords("base", "tbl"), (error) => error.code === "base_rate_limited");
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

test("exhausted HTTP and Base-code rate limits return base_rate_limited with bounded attempts", async () => {
  for (const response of [
    { status: 429, code: 1254291, data: {} },
    Object.assign(new Error("rate"), { status: 429 }),
  ]) {
    let attempts = 0;
    const client = new FeishuClient({
      tokenProvider: async () => "token", sleep: async () => {},
      fetchJson: async () => { attempts += 1; if (response instanceof Error) throw response; return response; },
    });
    await assert.rejects(
      () => client.listTables("base"),
      (error) => error.code === "base_rate_limited" && error.details.attempts === 3,
    );
    assert.equal(attempts, 3);
  }
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
      if (new URL(url).pathname.endsWith("/records/batch_get")) return { code: 0, data: {
        fields: [], record_id_list: ["rec"], data: [[]],
      } };
      return { code: 0, data: { field: { field_id: `fld-${calls.length}` } } };
    },
  });

  assert.deepEqual(await client.getRecord("base", "tbl", "rec"), { record_id: "rec", fields: {} });
  await client.createField("base", "tbl", "账号台账", "主页链接");
  await client.createField("base", "tbl", "发布记录", "账号", { targetTableId: "tbl-account" });
  await client.createField("base", "tbl", "发布记录", "剧", { targetTableId: "tbl-drama" });
  await client.createField("base", "tbl", "发布记录", "账号名");
  await client.updateField("base", "tbl", "fld-default", "账号台账", "账号ID");

  assert.deepEqual(calls.map(([path]) => path), [
    "/open-apis/base/v3/bases/base/tables/tbl/records/batch_get",
    "/open-apis/base/v3/bases/base/tables/tbl/fields",
    "/open-apis/base/v3/bases/base/tables/tbl/fields",
    "/open-apis/base/v3/bases/base/tables/tbl/fields",
    "/open-apis/base/v3/bases/base/tables/tbl/fields",
    "/open-apis/base/v3/bases/base/tables/tbl/fields/fld-default",
  ]);
  assert.deepEqual(calls[1][1].body, { name: "主页链接", type: "text", style: { type: "url" } });
  assert.deepEqual(calls[2][1].body, { name: "账号", type: "link", link_table: "tbl-account" });
  assert.deepEqual(calls[3][1].body, {
    name: "剧",
    type: "link",
    link_table: "tbl-drama",
    bidirectional: true,
    bidirectional_link_field_name: "关联发布记录",
  });
  assert.deepEqual(calls[4][1].body, {
    type: "lookup",
    name: "账号名",
    from: "账号台账",
    select: "账号名",
    where: { logic: "and", conditions: [["账号ID", "intersects", { type: "field_ref", field: "账号" }]] },
    aggregate: "raw_value",
  });
  assert.deepEqual(calls[5][1].body, { name: "账号ID", type: "text" });
  await assert.rejects(
    () => client.createField("base", "tbl", "选剧池", "关联发布记录", { targetTableId: "tbl-release" }),
    (error) => error.code === "base_schema_drift",
  );
});

test("client exposes no dynamic Base table creation path", () => {
  const client = new FeishuClient({ tokenProvider: async () => "token", fetchJson: async () => assert.fail("no network") });
  assert.equal(typeof client.createTable, "undefined");
});

test("canary deletion pre-reads a fixed table record and uses exact Base v3 batch_delete", async () => {
  const calls = [];
  const client = new FeishuClient({
    tokenProvider: async () => "token",
    fetchJson: async (url, options) => {
      calls.push([new URL(url).pathname, options]);
      if (new URL(url).pathname.endsWith("/batch_get")) return { code: 0, data: {
        fields: ["剧ID"], record_id_list: ["rec-canary"], data: [["CANARY-SDRUN-20260901-120000-A1B2"]],
      } };
      return { code: 0, data: { record_id_list: ["rec-canary"] } };
    },
  });
  assert.deepEqual(await client.deleteCanaryRecords("base", "tbl-drama", "选剧池", ["rec-canary"]), ["rec-canary"]);
  assert.deepEqual(calls.map(([url]) => url), [
    "/open-apis/base/v3/bases/base/tables/tbl-drama/records/batch_get",
    "/open-apis/base/v3/bases/base/tables/tbl-drama/records/batch_delete",
  ]);
  assert.deepEqual(calls[1][1].body, { record_id_list: ["rec-canary"] });
});

test("canary deletion rejects non-canary and arbitrary table targets before delete", async () => {
  let deletes = 0;
  const client = new FeishuClient({
    tokenProvider: async () => "token",
    fetchJson: async (_url, options) => {
      if (new URL(_url).pathname.endsWith("/batch_get")) return { code: 0, data: {
        fields: ["剧ID"], field_id_list: ["fld"], field_type_list: ["text"], record_id_list: ["rec"], data: [["SD-000001"]],
      } };
      deletes += 1;
      return { code: 0, data: { record_id_list: ["rec"] } };
    },
  });
  await assert.rejects(() => client.deleteCanaryRecords("base", "tbl", "选剧池", ["rec"]),
    (error) => error.code === "canary_target_invalid");
  assert.throws(() => client.deleteCanaryRecords("base", "tbl", "任意表", ["rec"]),
    (error) => error.code === "canary_target_invalid");
  assert.throws(() => client.deleteCanaryRecords("base", "tbl", "选剧池", ["rec", "another"]),
    (error) => error.code === "canary_target_invalid");
  assert.equal(deletes, 0);
});

test("canary deletion requires the exact deleted record ID response", async () => {
  const client = new FeishuClient({
    tokenProvider: async () => "token",
    fetchJson: async (url) => new URL(url).pathname.endsWith("/batch_get")
      ? { code: 0, data: { fields: ["剧ID"], field_id_list: ["fld"], field_type_list: ["text"], record_id_list: ["rec"], data: [["CANARY-SDRUN-20260901-120000"]] } }
      : { code: 0, data: { record_id_list: ["different"] } },
  });
  await assert.rejects(() => client.deleteCanaryRecords("base", "tbl", "选剧池", ["rec"]),
    (error) => error.code === "base_response_invalid");
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
    { name: "是否已排期", type: "formula", expression: 'IF(ISBLANK([关联发布记录]),"否","是")' },
    { name: "创建时间", type: "created_at" },
  ]);
});

test("schema and presentation creates require IDs and reject arbitrary input", async () => {
  const client = new FeishuClient({ tokenProvider: async () => "token", fetchJson: async () => ({ code: 0, data: {} }) });
  for (const operation of [
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

test("fixed presentation read/update methods use exact Base v3 paths and bodies", async () => {
  const calls = [];
  const viewParts = {
    filter: { logic: "and", conditions: [["状态", "intersects", ["发布中"]]] },
    sort: { sort_config: [{ field: "指标同步时间", desc: true }] },
    group: { group_config: [{ field: "所属组", desc: false }] },
    visible_fields: { visible_fields: ["账号ID", "账号名"] },
  };
  const client = new FeishuClient({
    tokenProvider: async () => "token",
    fetchJson: async (url, options) => {
      const path = new URL(url).pathname;
      calls.push([path, options.method ?? "GET", options.body]);
      const part = path.split("/").at(-1);
      if (Object.hasOwn(viewParts, part)) return { code: 0, data: { [part]: viewParts[part] } };
      if (options.method === "PATCH") return { code: 0, data: { block: { block_id: "block", name: "待公开数", type: "statistics", data_config: options.body.data_config } } };
      return { code: 0, data: { block: { block_id: "block", name: "待公开数", type: "statistics", data_config: { stale: true } } } };
    },
  });
  const fields = ["状态", "指标同步时间", "所属组", "账号ID", "账号名"].map((name, index) => ({ field_id: `f${index}`, name }));
  assert.deepEqual(await client.readViewConfiguration("base", "tbl", "view", "账号台账", "在用账号", { fields }), viewParts);
  assert.equal((await client.readDashboardBlock("base", "dash", "block", "待公开数")).data_config.stale, true);
  const updated = await client.updateDashboardBlock("base", "dash", "block", "待公开数");
  assert.equal(updated.block_id, "block");
  assert.deepEqual(calls.slice(0, 4).map(([path]) => path), ["filter", "sort", "group", "visible_fields"].map((part) => `/open-apis/base/v3/bases/base/tables/tbl/views/view/${part}`));
  assert.deepEqual(calls.at(-1), ["/open-apis/base/v3/bases/base/dashboards/dash/blocks/block", "PATCH", {
    name: "待公开数",
    data_config: {
      table_name: "发布记录", count_all: true,
      filter: { conjunction: "and", conditions: [{ field_name: "发布状态", operator: "is", value: "待公开" }] },
    },
  }]);
});

test("view configuration GET normalizes official direct object and array data", async () => {
  const client = new FeishuClient({
    tokenProvider: async () => "token",
    fetchJson: async (url) => {
      const part = new URL(url).pathname.split("/").at(-1);
      if (part === "filter") return { code: 0, data: { logic: "and", conditions: [] } };
      if (part === "sort") return { code: 0, data: [{ field: "指标同步时间", desc: true }] };
      if (part === "group") return { code: 0, data: [{ field: "所属组", desc: false }] };
      if (part === "visible_fields") return { code: 0, data: ["账号ID", "账号名"] };
      assert.fail("unexpected part");
    },
  });
  const fields = ["指标同步时间", "所属组", "账号ID", "账号名"].map((name, index) => ({ field_id: `f${index}`, name }));
  assert.deepEqual(await client.readViewConfiguration("base", "tbl", "view", "账号台账", "在用账号", { fields }), {
    filter: { logic: "and", conditions: [] },
    sort: { sort_config: [{ field: "指标同步时间", desc: true }] },
    group: { group_config: [{ field: "所属组", desc: false }] },
    visible_fields: { visible_fields: ["账号ID", "账号名"] },
  });
});

test("view configuration normalizes server field IDs through one complete field index", async () => {
  const fields = [
    { field_id: "fld_status", name: "状态" }, { field_id: "fld_sync", name: "指标同步时间" },
    { field_id: "fld_group", name: "所属组" }, { field_id: "fld_id", name: "账号ID" },
  ];
  const client = new FeishuClient({ tokenProvider: async () => "token", fetchJson: async (url) => {
    const part = new URL(url).pathname.split("/").at(-1);
    if (part === "filter") return { code: 0, data: { logic: "and", conditions: [{ field_name: "fld_status", operator: "intersects", value: ["发布中"] }] } };
    if (part === "sort") return { code: 0, data: [{ field: "fld_sync", desc: true }] };
    if (part === "group") return { code: 0, data: [{ field: "fld_group", desc: false }] };
    if (part === "visible_fields") return { code: 0, data: ["fld_id", "fld_status"] };
    assert.fail("unexpected part");
  } });
  assert.deepEqual(await client.readViewConfiguration("base", "tbl", "view", "账号台账", "在用账号", { fields }), {
    filter: { logic: "and", conditions: [["状态", "intersects", ["发布中"]]] },
    sort: { sort_config: [{ field: "指标同步时间", desc: true }] },
    group: { group_config: [{ field: "所属组", desc: false }] },
    visible_fields: { visible_fields: ["账号ID", "状态"] },
  });
  for (const invalidFields of [
    [...fields, { field_id: "fld_status", name: "other" }],
    [...fields, { field_id: "fld_other", name: "状态" }],
  ]) {
    await assert.rejects(
      client.readViewConfiguration("base", "tbl", "view", "账号台账", "在用账号", { fields: invalidFields }),
      (error) => error.code === "base_response_invalid",
    );
  }
});

test("view filter object conditions reject ambiguous or malformed official shapes", async () => {
  const fields = [{ field_id: "fld_status", name: "状态" }];
  for (const condition of [
    { field_name: "fld_status", field: "fld_status", operator: "intersects", value: ["发布中"] },
    { field_name: "fld_status", operator: "intersects" },
    { field_name: "fld_status", operator: "unknown", value: "发布中" },
    { field_name: "fld_status", operator: "intersects", value: { injected: true } },
  ]) {
    const client = new FeishuClient({ tokenProvider: async () => "token", fetchJson: async (url) => {
      const part = new URL(url).pathname.split("/").at(-1);
      if (part === "filter") return { code: 0, data: { logic: "and", conditions: [condition] } };
      return { code: 0, data: [] };
    } });
    await assert.rejects(
      client.readViewConfiguration("base", "tbl", "view", "账号台账", "在用账号", { fields }),
      (error) => error.code === "base_response_invalid",
    );
  }
});

test("field option readback accepts official idless options and rejects mixed or duplicate identity", async () => {
  const response = (options) => ({ code: 0, data: { fields: [{ id: "fld_status", name: "状态", type: "select", multiple: false, options }], total: 1 } });
  const client = new FeishuClient({ tokenProvider: async () => "token", fetchJson: async () => response([
    { id: "opt_unpublished", name: "未发", color: "grey" }, { id: "opt_live", name: "发布中", color: "green" },
  ]) });
  assert.deepEqual((await client.listFields("base", "tbl")).items[0].options, [{ name: "未发" }, { name: "发布中" }]);
  const officialIdless = new FeishuClient({ tokenProvider: async () => "token", fetchJson: async () => response([
    { name: "未发", hue: "Carmine", lightness: "Lighter" },
    { name: "发布中", hue: "Orange", lightness: "Lighter" },
  ]) });
  assert.deepEqual((await officialIdless.listFields("base", "tbl")).items[0].options, [{ name: "未发" }, { name: "发布中" }]);
  for (const options of [
    [{ id: "one", name: "未发" }, { name: "发布中" }],
    [{ id: " ", name: "未发" }],
    [{ id: " padded ", name: "未发" }],
    [{ id: "one", name: "未发" }, { id: " one ", name: "发布中" }],
    [{ id: "same", name: "未发" }, { id: "same", name: "发布中" }],
    [{ id: "one", name: "未发" }, { id: "two", name: "未发" }],
    [{ name: "未发" }, { name: "未发" }],
  ]) {
    const invalid = new FeishuClient({ tokenProvider: async () => "token", fetchJson: async () => response(options) });
    await assert.rejects(invalid.listFields("base", "tbl"), (error) => error.code === "base_response_invalid");
  }
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
    { logic: "and", conditions: [["状态", "intersects", ["发布中"]]] },
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
        conditions: [{ field_name: "状态", operator: "is", value: "发布中" }],
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
    fetchJson: async (_url, options) => ({ code: 0, data: { record_id_list: options.body.create_records.map(() => "rec") } }),
  });
  await client.createRecords("base_private", "tbl_private", [{ fields: { Notes: "private free text" } }]);
  assert.deepEqual(logs, [{
    method: "POST",
    path: "/open-apis/base/v3/bases/[redacted]/tables/[redacted]/records/batch_create",
    status: 200,
    run_id: "run-1",
  }]);
  assert.doesNotMatch(JSON.stringify(logs), /super-secret-token|private free text|authorization|base_private|tbl_private/i);
});
