import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { ShortDramaError, toErrorResult } from "../src/errors.mjs";
import {
  BASE_FIELD_SPECS,
  TABLE_ORDER,
  TABLES,
  assertPatchAllowed,
  fieldOwner,
} from "../src/schema.mjs";
import { fixedFieldDescriptor } from "../src/feishu-client.mjs";

function spec(table, name) {
  return BASE_FIELD_SPECS[table].find((field) => field.name === name);
}
import { loadRuntimeConfig } from "../src/config.mjs";

function runtimeFixture() {
  return {
    config: {
      schema_version: "shortdrama/v1", timezone: "Asia/Shanghai",
      source_spreadsheet_id: "1BbOcWUVrhRsnuSAs9LcyCuYWTrauPxtJWI12Esao7p0",
      paths: { env_file: ".env", metrics_sqlite: "metrics.sqlite", collector: "collector.mjs", collector_summary_dir: "collector-summary", ops_sqlite: "ops.sqlite", payload_root: "payloads" },
      base: {
        url: "https://base.example.com/company-owned-short-drama", app_token_env: "BASE_TOKEN",
        table_id_envs: { accounts: "TBL_ACCOUNTS", dramas: "TBL_DRAMAS", captures: "TBL_CAPTURES", releases: "TBL_RELEASES" },
      },
      auth: {
        feishu_app_id_env: "APP_ID", feishu_app_secret_env: "APP_SECRET", google_service_account_path_env: "GOOGLE_JSON",
        operator_ids_env: "OPERATORS", privileged_ids_env: "PRIVILEGED", notification_chat_ids_env: "CHATS",
      },
      acceptance: { privileged_actor_id: "ou_admin" },
    },
    env: {
      BASE_TOKEN: "app_token", TBL_ACCOUNTS: "tbl_accounts", TBL_DRAMAS: "tbl_dramas", TBL_CAPTURES: "tbl_captures", TBL_RELEASES: "tbl_releases",
      APP_ID: "app_id", APP_SECRET: "secret", GOOGLE_JSON: "/tmp/google.json", OPERATORS: "ou_one", PRIVILEGED: "ou_admin", CHATS: "oc_ops",
    },
  };
}

test('Beidou enrichment stays disabled until a valid activation date and private key are configured', () => {
  const fixture = runtimeFixture();
  const disabled = loadRuntimeConfig({ ...fixture, production: false, nodeVersion: '24.0.0' });
  assert.equal(disabled.beidou.enabled, false);
  fixture.env.BEIDOU_API_KEY = 'test-private-key';
  const readOnlyReady = loadRuntimeConfig({ ...fixture, production: false, nodeVersion: '24.0.0' });
  assert.equal(readOnlyReady.beidou.enabled, false);
  assert.equal(readOnlyReady.getBeidouApiKey(), 'test-private-key');
  delete fixture.env.BEIDOU_API_KEY;
  fixture.config.beidou = { enabled: true, start_at: '2026-09-23T12:00:00.000Z' };
  assert.throws(() => loadRuntimeConfig({ ...fixture, production: false, nodeVersion: '24.0.0' }));
  fixture.env.BEIDOU_API_KEY = 'test-private-key';
  const enabled = loadRuntimeConfig({ ...fixture, production: false, nodeVersion: '24.0.0' });
  assert.equal(enabled.beidou.startAt, '2026-09-23T12:00:00.000Z');
  assert.equal(enabled.getBeidouApiKey(), 'test-private-key');
  assert.ok(!JSON.stringify(enabled).includes('test-private-key'));
});
test('batch review notification hours use a valid Beijing daytime window',()=>{
 const f=runtimeFixture();f.config.batch_review={notify_start_hour:9,notify_end_hour:20};
 const c=loadRuntimeConfig({...f,production:false,nodeVersion:'24.0.0'});
 assert.equal(c.batchReview.notifyStartHour,9);assert.equal(c.batchReview.notifyEndHour,20);
 for(const [start,end] of [[20,9],[-1,20],[9,24],[9,9]]){
  f.config.batch_review={notify_start_hour:start,notify_end_hour:end};
  assert.throws(()=>loadRuntimeConfig({...f,production:false,nodeVersion:'24.0.0'}));
 }
});
test('review group must be a configured allowlisted chat',()=>{
 const f=runtimeFixture();f.env.CHATS='oc_ops,oc_review';f.config.batch_review={review_chat_id:'oc_review',review_group_recipients:['ou_pengman']};
 assert.equal(loadRuntimeConfig({...f,production:false,nodeVersion:'24.0.0'}).batchReview.reviewChatId,'oc_review');
 assert.deepEqual(loadRuntimeConfig({...f,production:false,nodeVersion:'24.0.0'}).batchReview.reviewGroupRecipients,['ou_pengman']);
 f.env.CHATS='oc_ops';
 assert.throws(()=>loadRuntimeConfig({...f,production:false,nodeVersion:'24.0.0'}),error=>error.code==='config_invalid');
 f.config.batch_review.review_chat_id='not_a_chat';
 assert.throws(()=>loadRuntimeConfig({...f,production:false,nodeVersion:'24.0.0'}),error=>error.code==='config_invalid');
 f.config.batch_review.review_chat_id='oc_review';f.env.CHATS='oc_ops,oc_review';f.config.batch_review.review_group_recipients=['bad'];
 assert.throws(()=>loadRuntimeConfig({...f,production:false,nodeVersion:'24.0.0'}),error=>error.code==='config_invalid');
});
test('historical batch notification suppression is bounded and exact',()=>{
 const f=runtimeFixture();f.config.batch_review={silent_batch_ids:['SB-ice-man']};
 assert.deepEqual(loadRuntimeConfig({...f,production:false,nodeVersion:'24.0.0'}).batchReview.silentBatchIds,['SB-ice-man']);
 f.config.batch_review.silent_batch_ids=['SB-ice-man','SB-ice-man'];
 assert.throws(()=>loadRuntimeConfig({...f,production:false,nodeVersion:'24.0.0'}),error=>error.code==='config_invalid');
});

test('publication calendar config requires a valid timezone and explicit rollout day',()=>{
 const f=runtimeFixture();f.config.batch_review={publication_timezone:'America/Chicago',publication_timezone_since:'2026-09-24'};
 const loaded=loadRuntimeConfig({...f,production:false,nodeVersion:'24.0.0'});
 assert.equal(loaded.batchReview.publicationTimezone,'America/Chicago');
 assert.equal(loaded.batchReview.publicationTimezoneSince,'2026-09-24');
 f.config.batch_review.publication_timezone='Invalid/Zone';
 assert.throws(()=>loadRuntimeConfig({...f,production:false,nodeVersion:'24.0.0'}));
 f.config.batch_review.publication_timezone='America/Chicago';delete f.config.batch_review.publication_timezone_since;
 assert.throws(()=>loadRuntimeConfig({...f,production:false,nodeVersion:'24.0.0'}));
});
test('metadata repair config accepts only a bounded exact three-row request',()=>{
 const f=runtimeFixture();const request={batch_id:'fakedatingpm',release_ids:['SR-000614','SR-000615','SR-000616'],
  record_ids:['rec614','rec615','rec616'],account_record_id:'recaccount',drama_record_id:'recdrama',
  owner_id:'ou_owner',planned_at:'2026-09-25',expected_version:'a'.repeat(64)};
 f.config.batch_review={enabled:true,metadata_repairs:[request]};
 const loaded=loadRuntimeConfig({...f,production:false,nodeVersion:'24.0.0'});
 assert.deepEqual(loaded.batchReview.metadataRepairs,[request]);
 f.config.batch_review.metadata_repairs=[{...request,record_ids:['rec614','rec614','rec616']}];
 assert.throws(()=>loadRuntimeConfig({...f,production:false,nodeVersion:'24.0.0'}));
 f.config.batch_review.metadata_repairs=[{...request,expected_version:'bad'}];
 assert.throws(()=>loadRuntimeConfig({...f,production:false,nodeVersion:'24.0.0'}));
});

test("schema fixes the four Base tables and source ownership", () => {
  assert.deepEqual(TABLE_ORDER, ["账号台账", "选剧池", "采集数据", "发布记录"]);
  assert.equal(TABLES["采集数据"].primaryField, "Post ID");
  assert.equal(fieldOwner("选剧池", "推荐理由"), "human");
  assert.equal(fieldOwner("采集数据", "播放量"), "machine");
  assert.equal(fieldOwner("采集数据", "Caption"), "machine");
  assert.equal(fieldOwner("发布记录", "播放量"), "derived");
  assert.equal(fieldOwner("发布记录", "Post ID"), "shared");
  assert.deepEqual(TABLES["选剧池"].options, {
    账号状态: ["未发", "重养", "发布中"],
    平台: ["ReelShort", "DramaBox", "ShortMax", "TopShort", "其他", "MoboReels"],
    推荐人: ["彭满", "高璇", "马博洋", "张凯风", "李建卓"],
    归档状态: ["active", "archived"],
  });
});

test("schema marks exactly the eight approved Select fields as manifest_append", () => {
  const actual = TABLE_ORDER.flatMap((tableName) =>
    BASE_FIELD_SPECS[tableName]
      .filter((spec) => spec.optionPolicy === "manifest_append")
      .map((spec) => [tableName, spec.name, spec.kind]),
  );
  assert.deepEqual(actual, [
    ["账号台账", "所属组", "single_select"],
    ["账号台账", "表现形式", "single_select"],
    ["选剧池", "剧分类", "multi_select"],
    ["选剧池", "生命周期", "single_select"],
    ["选剧池", "RS Boost 分类（待确认）", "multi_select"],
    ["选剧池", "账号组", "multi_select"],
    ["选剧池", "语言", "single_select"],
    ["选剧池", "来源", "multi_select"],
  ]);

  const manifestAppendSpecs = TABLE_ORDER.flatMap((tableName) =>
    BASE_FIELD_SPECS[tableName].filter((spec) => spec.optionPolicy === "manifest_append"),
  );
  assert.equal(manifestAppendSpecs.length, 8);
  assert.ok(manifestAppendSpecs.every((spec) => spec.options === undefined));
  assert.ok(TABLE_ORDER.flatMap((tableName) => BASE_FIELD_SPECS[tableName])
    .filter((spec) => spec.options !== undefined)
    .every((spec) => spec.optionPolicy === undefined));
  assert.deepEqual(TABLES["选剧池"].options.推荐人, ["彭满", "高璇", "马博洋", "张凯风", "李建卓"]);
  assert.deepEqual(TABLES["选剧池"].options.平台, ["ReelShort", "DramaBox", "ShortMax", "TopShort", "其他", "MoboReels"]);
});

test("schema uses supported system fields, writable sync storage, and Base formulas", () => {
  assert.deepEqual(spec("选剧池", "创建人"), {
    name: "创建人", kind: "system", phase: "system", systemType: "created_by",
  });
  assert.equal(spec("选剧池", "创建时间").systemType, "created_at");
  assert.equal(spec("选剧池", "最后修改时间").systemType, "updated_at");
  assert.deepEqual(spec("采集数据", "Base 同步时间"), {
    name: "Base 同步时间", kind: "datetime", phase: "storage",
  });
  assert.deepEqual(spec("采集数据", "Caption"), {
    name: "Caption", kind: "text", phase: "storage",
  });
  assert.equal(spec("选剧池", "是否已排期").expression, 'IF(ISBLANK([关联发布记录]),"否","是")');
  const releaseFormula = spec("发布记录", "发布状态").expression;
  assert.equal(releaseFormula, 'IF(AND(OR([Post ID]="",ISBLANK([Post ID])),OR([视频链接]="",ISBLANK([视频链接])),ISBLANK([采集记录])),IF([日期]>NOW(),"已排期","待公开"),IF(AND(NOT(ISBLANK([播放量])),NOT(ISBLANK([点赞])),NOT(ISBLANK([收藏])),NOT(ISBLANK([转发])),NOT(ISBLANK([评论]))),"已回填","已公开"))');
  assert.match(releaseFormula, /\[Post ID\]/);
  assert.match(releaseFormula, /\[视频链接\]/);
  assert.match(releaseFormula, /\[采集记录\]/);
  assert.match(releaseFormula, /\[日期\]/);
  assert.match(releaseFormula, /ISBLANK\(\[采集记录\]\)/);
  assert.match(releaseFormula, /"已回填"/);
  assert.match(releaseFormula, /"已公开"/);
  assert.doesNotMatch(releaseFormula, /\{[^}]+\}/);
});

test("fixed select fields expose closed options in schema descriptors", () => {
  const expected = new Map([
    ["账号台账.状态", ["未发", "重养", "发布中", "弃用", "暂停", "买粉中"]],
    ["账号台账.同步状态", ["success", "partial", "failed"]],
    ["选剧池.账号状态", ["未发", "重养", "发布中"]],
    ["选剧池.平台", ["ReelShort", "DramaBox", "ShortMax", "TopShort", "其他", "MoboReels"]],
    ["选剧池.推荐人", ["彭满", "高璇", "马博洋", "张凯风", "李建卓"]],
    ["选剧池.归档状态", ["active", "archived"]],
    ["采集数据.业务", ["short-drama"]],
    ["采集数据.采集状态", ["complete", "partial"]],
    ["采集数据.缺失字段", ["views", "likes", "comments", "favorites", "shares"]],
    ["发布记录.匹配方式", ["exact_post_id", "manual_url", "account_time", "batch_title_sequence"]],
    ["发布记录.归档状态", ["active", "archived"]],
  ]);
  for (const [key, options] of expected) {
    const [table, field] = key.split(".");
    assert.deepEqual(spec(table, field).options, options);
    assert.deepEqual(fixedFieldDescriptor(table, field).options, options.map((name) => ({ name })));
  }
  for (const status of ["暂停", "买粉中"]) {
    assert.doesNotThrow(() => assertPatchAllowed("账号台账", { 状态: status }, "human"));
  }
  assert.throws(
    () => assertPatchAllowed("账号台账", { 状态: "未知状态" }, "human"),
    (error) => error.code === "field_option_violation",
  );
  assert.throws(
    () => assertPatchAllowed("发布记录", { 匹配方式: "existing_relation" }, "machine"),
    (error) => error.code === "field_option_violation",
  );
});

test("schema owns reverse links through fixed bidirectional release fields", () => {
  assert.deepEqual(spec("发布记录", "剧"), {
    name: "剧",
    kind: "link",
    phase: "link",
    targetTable: "选剧池",
    bidirectional: true,
    reverseField: "关联发布记录",
  });
  assert.deepEqual(spec("发布记录", "采集记录"), {
    name: "采集记录",
    kind: "link",
    phase: "link",
    targetTable: "采集数据",
    bidirectional: true,
    reverseField: "关联发布记录",
  });
  assert.deepEqual(spec("选剧池", "关联发布记录").managedReverseOf, {
    table: "发布记录",
    field: "剧",
  });
  assert.deepEqual(spec("采集数据", "关联发布记录").managedReverseOf, {
    table: "发布记录",
    field: "采集记录",
  });
  assert.equal(Object.isFrozen(spec("选剧池", "关联发布记录").managedReverseOf), true);
  assert.equal(Object.isFrozen(spec("采集数据", "关联发布记录").managedReverseOf), true);
  assert.equal(spec("发布记录", "账号").bidirectional, undefined);
});

test("machine patches cannot touch human fields", () => {
  assert.throws(
    () => assertPatchAllowed("选剧池", { 推荐理由: "自动生成" }, "machine"),
    (error) => error.code === "field_owner_violation"
  );
  assert.doesNotThrow(() =>
    assertPatchAllowed("采集数据", { 播放量: 0, 点赞: null }, "machine")
  );
  assert.doesNotThrow(() =>
    assertPatchAllowed("发布记录", { "Post ID": "99" }, "human")
  );
  assert.throws(
    () => assertPatchAllowed("发布记录", { "Post ID": "99" }, "machine"),
    (error) => error.code === "field_owner_violation"
  );
  assert.doesNotThrow(() =>
    assertPatchAllowed("账号台账", { 所属组: "A纯切片", 粉丝数: 1161 }, "migration")
  );
  assert.throws(
    () => assertPatchAllowed("发布记录", { 播放量: 20 }, "migration"),
    (error) => error.code === "field_owner_violation"
  );
});

test("exported ownership metadata cannot be mutated to bypass patch guards", () => {
  const releaseTable = TABLES["发布记录"];
  assert.throws(() => {
    releaseTable.machine.add("播放量");
  }, TypeError);
  assert.equal(Object.isFrozen(TABLES), true);
  assert.equal(Object.isFrozen(releaseTable), true);
  assert.equal(Object.isFrozen(releaseTable.machine), true);
  assert.throws(
    () => assertPatchAllowed("发布记录", { 播放量: 20 }, "machine"),
    (error) => error.code === "field_owner_violation"
  );
});

test("derived actors are rejected before a patch is inspected", () => {
  assert.throws(
    () => assertPatchAllowed("发布记录", {}, "derived"),
    (error) => error.code === "actor_kind_not_allowed"
  );
  assert.throws(
    () => assertPatchAllowed("发布记录", new Proxy({}, {
      ownKeys() {
        throw new Error("patch must not be inspected for a rejected actor");
      },
    }), "derived"),
    (error) => error.code === "actor_kind_not_allowed"
  );
});

test("unknown actors are rejected before a patch is inspected", () => {
  assert.throws(
    () => assertPatchAllowed("发布记录", {}, "untrusted"),
    (error) => error.code === "actor_kind_not_allowed"
  );
  assert.throws(
    () => assertPatchAllowed("发布记录", new Proxy({}, {
      ownKeys() {
        throw new Error("patch must not be inspected for a rejected actor");
      },
    }), "untrusted"),
    (error) => error.code === "actor_kind_not_allowed"
  );
});

test("runtime config rejects missing secrets and unknown notification chats", () => {
  assert.throws(
    () => loadRuntimeConfig({ env: {}, config: {} }),
    (error) => error.code === "config_invalid"
  );

  const config = {
    schema_version: "shortdrama/v1",
    timezone: "Asia/Shanghai",
    source_spreadsheet_id: "1BbOcWUVrhRsnuSAs9LcyCuYWTrauPxtJWI12Esao7p0",
    paths: {
      env_file: ".env",
      metrics_sqlite: "metrics.sqlite",
      collector: "collector.mjs",
      collector_summary_dir: "collector-summary",
      ops_sqlite: "ops.sqlite",
      payload_root: "payloads",
    },
    base: {
      url: "https://base.example.com/company-owned-short-drama",
      app_token_env: "FEISHU_SHORTDRAMA_APP_TOKEN",
      table_id_envs: {
        accounts: "FEISHU_SHORTDRAMA_ACCOUNTS_TABLE_ID",
        dramas: "FEISHU_SHORTDRAMA_POOL_TABLE_ID",
        captures: "FEISHU_SHORTDRAMA_CAPTURES_TABLE_ID",
        releases: "FEISHU_SHORTDRAMA_RELEASES_TABLE_ID",
      },
    },
    auth: {
      feishu_app_id_env: "FEISHU_APP_ID",
      feishu_app_secret_env: "FEISHU_APP_SECRET",
      google_service_account_path_env: "GOOGLE_SERVICE_ACCOUNT_JSON",
      operator_ids_env: "SHORTDRAMA_OPERATOR_IDS",
      privileged_ids_env: "SHORTDRAMA_PRIVILEGED_IDS",
      notification_chat_ids_env: "SHORTDRAMA_NOTIFICATION_CHAT_IDS",
    },
    acceptance: { privileged_actor_id: "ou_privileged" },
  };
  const env = {
    FEISHU_SHORTDRAMA_APP_TOKEN: "app_token",
    FEISHU_SHORTDRAMA_ACCOUNTS_TABLE_ID: "tbl_accounts",
    FEISHU_SHORTDRAMA_POOL_TABLE_ID: "tbl_dramas",
    FEISHU_SHORTDRAMA_CAPTURES_TABLE_ID: "tbl_captures",
    FEISHU_SHORTDRAMA_RELEASES_TABLE_ID: "tbl_releases",
    FEISHU_APP_ID: "cli_app",
    FEISHU_APP_SECRET: "app-secret-must-not-be-logged",
    GOOGLE_SERVICE_ACCOUNT_JSON: "/tmp/google-service-account.json",
    SHORTDRAMA_OPERATOR_IDS: "ou_operator",
    SHORTDRAMA_PRIVILEGED_IDS: "ou_privileged",
    SHORTDRAMA_NOTIFICATION_CHAT_IDS: "oc_social",
  };
  assert.throws(
    () => loadRuntimeConfig({ env, config, notificationChatId: "oc_unknown" }),
    (error) => error.code === "notification_target_denied"
  );
  const runtime = loadRuntimeConfig({ env, config, notificationChatId: "oc_social" });
  assert.equal(runtime.auth.isOperatorAllowed("ou_operator"), true);
  assert.equal(runtime.auth.isPrivilegedAllowed("ou_privileged"), true);
  assert.equal(runtime.auth.isNotificationChatAllowed("oc_social"), true);
  assert.equal(runtime.auth.isNotificationChatAllowed("oc_unknown"), false);
  assert.equal(runtime.auth.notificationChats, undefined);
  for (const matcher of [
    runtime.auth.isOperatorAllowed,
    runtime.auth.isPrivilegedAllowed,
    runtime.auth.isNotificationChatAllowed,
  ]) {
    assert.equal(matcher.add, undefined);
    assert.equal(matcher.delete, undefined);
  }
  assert.throws(() => {
    runtime.auth.isNotificationChatAllowed = () => true;
  }, TypeError);
  assert.equal(JSON.stringify(runtime).includes("app-secret-must-not-be-logged"), false);
  assert.equal(JSON.stringify(runtime).includes("oc_social"), false);
});

test("runtime config exposes immutable allowlist values from renamed env keys", () => {
  const { config, env } = runtimeFixture();
  config.auth.operator_ids_env = "RENAMED_OPERATORS";
  config.auth.privileged_ids_env = "RENAMED_PRIVILEGED";
  config.auth.notification_chat_ids_env = "RENAMED_CHATS";
  env.RENAMED_OPERATORS = "ou_one,ou_two";
  env.RENAMED_PRIVILEGED = "ou_admin";
  env.RENAMED_CHATS = "oc_ops,oc_social";
  const runtime = loadRuntimeConfig({ config, env });
  assert.deepEqual(runtime.auth.getOperatorIds(), ["ou_one", "ou_two"]);
  assert.deepEqual(runtime.auth.getPrivilegedIds(), ["ou_admin"]);
  assert.deepEqual(runtime.auth.getNotificationChatIds(), ["oc_ops", "oc_social"]);
  assert.throws(() => runtime.auth.getOperatorIds().push("forged"), TypeError);
});

test("errors have stable public JSON", () => {
  const result = toErrorResult(new ShortDramaError("base_schema_drift", "字段漂移", {
    table: "采集数据",
  }));
  assert.deepEqual(result, {
    status: "failed",
    error: {
      code: "base_schema_drift",
      message: "字段漂移",
      details: { table: "采集数据" },
    },
  });
});

test("账号台账 owner is a fixed human user field the sync may not touch", () => {
  assert.equal(fieldOwner("账号台账", "负责人"), "human");
  assert.equal(spec("账号台账", "负责人").kind, "user");
  assert.equal(spec("账号台账", "负责人").phase, "storage");
  assert.deepEqual(fixedFieldDescriptor("账号台账", "负责人"), { name: "负责人", type: "user", multiple: false });

  assertPatchAllowed("账号台账", { "负责人": [{ id: "ou_lead" }] }, "human");
  assert.throws(
    () => assertPatchAllowed("账号台账", { "负责人": [{ id: "ou_lead" }] }, "machine"),
    (error) => error.code === "field_owner_violation",
  );
});
test("account first publication time is human owned and daily average is read only", () => {
  assert.equal(spec("账号台账", "始发时间").kind, "datetime");
  assert.equal(fieldOwner("账号台账", "始发时间"), "human");
  assert.equal(fieldOwner("账号台账", "日均播放量"), "derived");
  assertPatchAllowed("账号台账", { 始发时间: "2026-09-20" }, "human");
  assert.throws(() => assertPatchAllowed("账号台账", { 始发时间: "2026-09-20" }, "machine"), e => e.code === "field_owner_violation");
  assert.throws(() => assertPatchAllowed("账号台账", { 日均播放量: 100 }, "human"), e => e.code === "field_owner_violation");
});
test("account notes remain human owned across machine synchronization", () => {
  assert.equal(spec("账号台账", "备注").kind, "text");
  assert.equal(fieldOwner("账号台账", "备注"), "human");
  assertPatchAllowed("账号台账", { 备注: "账号运营记录" }, "human");
  assert.throws(() => assertPatchAllowed("账号台账", { 备注: "机器覆盖" }, "machine"), e => e.code === "field_owner_violation");
});
test('analytics binds exactly four distinct tables and preserves the 30-day capture policy',()=>{
 const {config,env}=runtimeFixture();config.base.daily_views_table_id='tblDaily';config.base.analytics_table_ids={accountDaily:'tblAccountDaily',dramas:'tblDramaTotals',releaseDays:'tblReleaseDays',firstDays:'tblFirstDays'};
 const result=loadRuntimeConfig({config,env});assert.deepEqual(result.base.analyticsTableIds,config.base.analytics_table_ids);assert.equal(result.capture.maxAgeDays,30);
 config.base.analytics_table_ids.firstDays='tblDaily';assert.throws(()=>loadRuntimeConfig({config,env}),/analytics/);
 config.base.analytics_table_ids.firstDays='tblFirstDays';delete config.base.analytics_table_ids.dramas;assert.throws(()=>loadRuntimeConfig({config,env}),/analytics/);
});
test('natural-day reporting and schedule config are explicit and validated',()=>{const {config,env}=runtimeFixture();config.daily_reporting={mode:'calendar_day',start_date:'2026-09-20'};config.schedule={capture_hour:0,capture_minute:10,health_hour:2,health_minute:10};const result=loadRuntimeConfig({config,env});assert.equal(result.dailyReporting.startDate,'2026-09-20');assert.equal(result.schedule.captureHour,0);config.schedule.capture_minute=60;assert.throws(()=>loadRuntimeConfig({config,env}));config.schedule.capture_minute=10;config.daily_reporting.start_date='2026-02-30';assert.throws(()=>loadRuntimeConfig({config,env}));});

test('capture exclusions are exact, unique Post IDs in runtime config',()=>{
 const {config,env}=runtimeFixture();
 config.capture={max_age_days:30,excluded_post_ids:['7674889997429853470']};
 assert.deepEqual(loadRuntimeConfig({config,env}).capture.excludedPostIds,['7674889997429853470']);
 config.capture.excluded_post_ids.push('7674889997429853470');
 assert.throws(()=>loadRuntimeConfig({config,env}),error=>error.code==='config_invalid');
 config.capture.excluded_post_ids=['7674889997429853470*'];
 assert.throws(()=>loadRuntimeConfig({config,env}),error=>error.code==='config_invalid');
});
test('external table metadata never overlaps writable bindings',()=>{const {config,env}=runtimeFixture();config.base.external_tables={tblExternal:'收益汇总表'};assert.deepEqual(loadRuntimeConfig({config,env}).base.externalTables,{tblExternal:'收益汇总表'});config.base.daily_views_table_id='tblExternal';assert.throws(()=>loadRuntimeConfig({config,env}),/external/);});


test("live MoboReels platform supports schema readiness and human writes while unknown options fail closed", async () => {
  const { schemaReadiness } = await import("../shortdrama_ctl.mjs");
  const tableIds = { accounts: "tblA", dramas: "tblD", captures: "tblC", releases: "tblR" };
  const byName = Object.fromEntries(TABLE_ORDER.map((name, i) => [name, Object.values(tableIds)[i]]));
  const tables = TABLE_ORDER.map(name => ({ name, table_id: byName[name], fields: BASE_FIELD_SPECS[name].map(spec => ({
    ...fixedFieldDescriptor(name, spec.name, spec.kind === "link" ? { targetTableId: byName[spec.targetTable] } : {}),
    ...(spec.primary ? { is_primary: true } : {}),
  })) }));
  const platform = tables.find(t => t.name === "选剧池").fields.find(f => f.name === "平台");
  platform.options = ["ReelShort", "DramaBox", "ShortMax", "TopShort", "其他", "MoboReels"].map(name => ({ name }));
  const accountStatus = tables.find(t => t.name === "账号台账").fields.find(f => f.name === "状态");
  accountStatus.options = ["未发", "重养", "发布中", "弃用", "暂停", "买粉中"].map(name => ({ name }));
  const schema = { complete: true, tables };
  assert.equal(schemaReadiness(schema, { base: { tableIds } }).status, "ready");
  accountStatus.options.push({ name: "未知状态" });
  const accountDrift = schemaReadiness(schema, { base: { tableIds } });
  assert.equal(accountDrift.status, "schema_drift");
  assert.equal(accountDrift.field, "状态");
  accountStatus.options.pop();
  assert.doesNotThrow(() => assertPatchAllowed("选剧池", { 平台: "MoboReels" }, "human"));
  assert.throws(() => assertPatchAllowed("选剧池", { 平台: "UnapprovedPlatform" }, "human"), e => e.code === "field_option_violation");
  platform.options.push({ name: "UnapprovedPlatform" });
  const drift = schemaReadiness(schema, { base: { tableIds } });
  assert.equal(drift.status, "schema_drift");
  assert.equal(drift.field, "平台");
  assert.ok(drift.mismatches.includes("options"));
  assert.deepEqual(drift.actual_options, ["ReelShort", "DramaBox", "ShortMax", "TopShort", "其他", "MoboReels", "UnapprovedPlatform"]);
  assert.deepEqual(drift.expected_options, ["ReelShort", "DramaBox", "ShortMax", "TopShort", "其他", "MoboReels"]);
});

test('automatic batch role cannot write human metadata or metrics and generic sync still cannot fill shared evidence',()=>{
 assert.doesNotThrow(()=>assertPatchAllowed('发布记录',{'Post ID':'123',视频链接:'https://www.tiktok.com/@one/video/123',采集记录:[{id:'c'}],匹配方式:'batch_title_sequence',匹配置信度:null},'batch_match'));
 for(const patch of [{日期:'2026-09-22'},{账号:[{id:'x'}]},{剧:[{id:'x'}]},{备注:'overwritten'},{播放量:99}])assert.throws(()=>assertPatchAllowed('发布记录',patch,'batch_match'));
 assert.throws(()=>assertPatchAllowed('发布记录',{'Post ID':'123'},'machine'));
});
test('automatic matching needs explicit valid rollout date and remains off in old configs',()=>{
 const f=runtimeFixture();let c=loadRuntimeConfig({...f,production:false,nodeVersion:'24.0.0'});assert.equal(c.batchReview.autoMatch,false);
 f.config.batch_review={enabled:true,auto_match:true};assert.throws(()=>loadRuntimeConfig({...f,production:false,nodeVersion:'24.0.0'}));
 f.config.batch_review.auto_match_since='2026-02-30';assert.throws(()=>loadRuntimeConfig({...f,production:false,nodeVersion:'24.0.0'}));
 f.config.batch_review.auto_match_since='2026-09-22';c=loadRuntimeConfig({...f,production:false,nodeVersion:'24.0.0'});assert.equal(c.batchReview.autoMatch,true);
 assert.equal(c.batchReview.countOnlySince,null);
 f.config.batch_review.count_only_since='2026-09-28';c=loadRuntimeConfig({...f,production:false,nodeVersion:'24.0.0'});assert.equal(c.batchReview.countOnlySince,'2026-09-28');
 f.config.batch_review.count_only_since='2026-02-30';assert.throws(()=>loadRuntimeConfig({...f,production:false,nodeVersion:'24.0.0'}));
});

test('caption backfill requires a bounded request and a valid cutoff',()=>{
 const f=runtimeFixture();let config=loadRuntimeConfig({...f,production:false,nodeVersion:'24.0.0'});
 assert.equal(config.captionBackfill,null);
 f.config.caption_backfill={mode:'plan',request_id:'caption-20260928',cutoff:'2026-09-28T06:25:01Z'};
 config=loadRuntimeConfig({...f,production:false,nodeVersion:'24.0.0'});
 assert.equal(config.captionBackfill.mode,'plan');
 f.config.caption_backfill={...f.config.caption_backfill,mode:'apply',expected_plan_sha256:'a'.repeat(64)};
 config=loadRuntimeConfig({...f,production:false,nodeVersion:'24.0.0'});
 assert.equal(config.captionBackfill.mode,'apply');
 assert.equal(config.captionBackfill.maxActionsPerRun,20);
 f.config.caption_backfill.max_actions_per_run=51;
 assert.throws(()=>loadRuntimeConfig({...f,production:false,nodeVersion:'24.0.0'}));
 f.config.caption_backfill.max_actions_per_run=10;
 delete f.config.caption_backfill.expected_plan_sha256;
 assert.throws(()=>loadRuntimeConfig({...f,production:false,nodeVersion:'24.0.0'}));
 f.config.caption_backfill.mode='plan';
 f.config.caption_backfill.cutoff='2026-02-30T00:00:00Z';
 assert.throws(()=>loadRuntimeConfig({...f,production:false,nodeVersion:'24.0.0'}));
});

test('system caption backfill can create release identity, relations, and the evidenced account owner',()=>{
 const patch={日期:'2026-09-28',账号:[{id:'a'}],剧:[{id:'d'}],处理负责人:[{id:'ou_owner'}],归档状态:'active','Post ID':'123',视频链接:'https://www.tiktok.com/@one/video/123',采集记录:[{id:'c'}],匹配方式:'exact_post_id',匹配置信度:null};
 assert.doesNotThrow(()=>assertPatchAllowed('发布记录',patch,'caption_backfill'));
 for(const invalid of [{RS收益:1},{播放量:1},{备注:'invented'}])
  assert.throws(()=>assertPatchAllowed('发布记录',invalid,'caption_backfill'));
 assert.throws(()=>assertPatchAllowed('选剧池',{剧名:'invented'},'caption_backfill'));
});

test('continuous capture-to-release automation requires a real activation instant and bounded work',()=>{
 const f=runtimeFixture();let config=loadRuntimeConfig({...f,production:false,nodeVersion:'24.0.0'});
 assert.equal(config.captionAuto.enabled,false);
 f.config.caption_auto={enabled:true,start_at:'2026-09-28T06:25:01Z',max_actions_per_run:10};
 config=loadRuntimeConfig({...f,production:false,nodeVersion:'24.0.0'});
 assert.equal(config.captionAuto.startAt,'2026-09-28T06:25:01Z');
 f.config.caption_auto.max_actions_per_run=51;assert.throws(()=>loadRuntimeConfig({...f,production:false,nodeVersion:'24.0.0'}));
});
test('caption repair config binds one exact release and post identity',()=>{
 const f=runtimeFixture();f.config.caption_repair={request_id:'caption-repair-20260928',release_id:'SR-000731',release_record_id:'recvwvixKki2dH',
  post_id:'7661912847693188365',capture_record_id:'recvuxAuj3QubP',account_record_id:'recvuwZHjywqNU'};
 const config=loadRuntimeConfig({...f,production:false,nodeVersion:'24.0.0'});
 assert.equal(config.captionRepair.releaseId,'SR-000731');
 f.config.caption_repair.post_id='wrong';assert.throws(()=>loadRuntimeConfig({...f,production:false,nodeVersion:'24.0.0'}));
});

test('duplicate relation repair accepts only a bounded exact record request',()=>{
 const f=runtimeFixture();
 const request={release_id:'SR-000022',owner_release_id:'SR-000017',post_id:'7678271597450497294',capture_record_id:'recvuxAuj3nuVh',release_record_id:'recvuxAxDELevP',owner_record_id:'recvuxAxDE7ooq',release_date:'2026-08-27',owner_date:'2026-08-26'};
 f.config.batch_review={enabled:true,duplicate_relation_repairs:[request]};
 const loaded=loadRuntimeConfig({...f,production:false,nodeVersion:'24.0.0'});
 assert.deepEqual(loaded.batchReview.duplicateRelationRepairs,[request]);
 f.config.batch_review.duplicate_relation_repairs=[{...request,post_id:'bad'}];
 assert.throws(()=>loadRuntimeConfig({...f,production:false,nodeVersion:'24.0.0'}));
});

test('caption-backed duplicate repair requires a named mode and immutable publication evidence',()=>{
 const f=runtimeFixture();
 const request={release_id:'SR-000167',owner_release_id:'SR-000166',post_id:'7682734319277755662',capture_record_id:'recvuGX7hV3mup',release_record_id:'recvuxAxDFChta',owner_record_id:'recvuxAxDFb73u',release_date:'2026-09-07',owner_date:'2026-09-07',mode:'machine_match',published_at:'2026-09-07T10:20:13.000Z',caption_sha256:'43968d6b6f8109b463b9e63bb58240a9e102f87081084c488d6c5a5c21cd1b96',owner_drama_record_id:'recvuxwd57DTFX',target_drama_record_id:'recvuxwd57DTFX',owner_title:'My Alien Life'};
 f.config.batch_review={enabled:true,duplicate_relation_repairs:[request]};
 assert.deepEqual(loadRuntimeConfig({...f,production:false,nodeVersion:'24.0.0'}).batchReview.duplicateRelationRepairs,[request]);
 f.config.batch_review.duplicate_relation_repairs=[{...request,caption_sha256:'bad'}];
 assert.throws(()=>loadRuntimeConfig({...f,production:false,nodeVersion:'24.0.0'}));
});

test('verified Feishu user_id can map to an authorized owner open_id without admin escalation',()=>{
 const f=runtimeFixture();f.env.OPERATORS+=',74378dd3,ou_ef5bf436e9a3d1d5057d43b277044310';
 f.config.batch_review={owner_aliases:{'74378dd3':'ou_ef5bf436e9a3d1d5057d43b277044310'}};
 const c=loadRuntimeConfig({...f,nodeVersion:'24.0.0',production:false});
 assert.equal(c.auth.isOperatorAllowed('74378dd3'),true);assert.equal(c.auth.isPrivilegedAllowed('74378dd3'),false);
 assert.equal(c.batchReview.ownerAliases['74378dd3'],'ou_ef5bf436e9a3d1d5057d43b277044310');
 for(const bad of ['bad id','__proto__','constructor']){f.config.batch_review.owner_aliases=Object.fromEntries([[bad,'ou_person']]);assert.throws(()=>loadRuntimeConfig({...f,nodeVersion:'24.0.0',production:false}));}
});

test('full caption automation has explicit recognition, observation and platform-scoped code rules',()=>{
 const f=runtimeFixture();f.config.caption_auto={enabled:true,start_at:'2026-09-29T00:00:00Z',recognize_dramas:true,observe_only:true,verified_codes:[{platform:'ReelShort',code:'4933302',drama_id:'SD-000310'}]};
 const c=loadRuntimeConfig({...f,production:false,nodeVersion:'24.0.0'});
 assert.equal(c.captionAuto.recognizeDramas,true);assert.equal(c.captionAuto.observeOnly,true);assert.equal(c.captionAuto.verifiedCodes.length,1);
 f.config.caption_auto.lead_review_only=true;assert.throws(()=>loadRuntimeConfig({...f,production:false,nodeVersion:'24.0.0'}));
 f.config.caption_auto.lead_review_only=false;f.config.caption_auto.verified_codes[0].platform='unknown';assert.throws(()=>loadRuntimeConfig({...f,production:false,nodeVersion:'24.0.0'}));
});
test('partial linked capture repair requires a bounded exact Post ID allowlist',()=>{
 const f=runtimeFixture();f.config.caption_auto={partial_link_post_ids:['7690536741803019533']};
 assert.deepEqual(loadRuntimeConfig({...f,production:false,nodeVersion:'24.0.0'}).captionAuto.partialLinkPostIds,['7690536741803019533']);
 f.config.caption_auto.partial_link_post_ids=['7690536741803019533','7690536741803019533'];
 assert.throws(()=>loadRuntimeConfig({...f,production:false,nodeVersion:'24.0.0'}),error=>error.code==='config_invalid');
});
test('time-order matching is scoped to an explicit account and drama',()=>{
 const f=runtimeFixture();f.config.caption_auto={time_order_targets:[{account_id:'dramaexpedition',drama_id:'SD-000310'}]};
 assert.deepEqual(loadRuntimeConfig({...f,production:false,nodeVersion:'24.0.0'}).captionAuto.timeOrderTargets,[{accountId:'dramaexpedition',dramaId:'SD-000310'}]);
 f.config.caption_auto.time_order_targets=[{account_id:'dramaexpedition',drama_id:'SD-000310'},{account_id:'dramaexpedition',drama_id:'SD-000310'}];
 assert.throws(()=>loadRuntimeConfig({...f,production:false,nodeVersion:'24.0.0'}),error=>error.code==='config_invalid');
});
