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

function spec(table, name) {
  return BASE_FIELD_SPECS[table].find((field) => field.name === name);
}
import { loadRuntimeConfig } from "../src/config.mjs";

test("schema fixes the four Base tables and source ownership", () => {
  assert.deepEqual(TABLE_ORDER, ["账号台账", "选剧池", "采集数据", "发布记录"]);
  assert.equal(TABLES["采集数据"].primaryField, "Post ID");
  assert.equal(fieldOwner("选剧池", "推荐理由"), "human");
  assert.equal(fieldOwner("采集数据", "播放量"), "machine");
  assert.equal(fieldOwner("发布记录", "播放量"), "derived");
  assert.equal(fieldOwner("发布记录", "Post ID"), "shared");
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
  assert.equal(spec("选剧池", "是否已排期").expression, 'IF(ISBLANK([关联发布记录]), "否", "是")');
  const releaseFormula = spec("发布记录", "发布状态").expression;
  assert.match(releaseFormula, /\[Post ID\]/);
  assert.match(releaseFormula, /\[视频链接\]/);
  assert.match(releaseFormula, /\[日期\]/);
  assert.doesNotMatch(releaseFormula, /\{[^}]+\}/);
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
