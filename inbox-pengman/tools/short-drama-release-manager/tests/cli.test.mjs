import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { access, chmod, mkdtemp, mkdir, open, readFile, realpath, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { DatabaseSync } from "node:sqlite";

import {
  createCollectorAdapter,
  buildRuntime,
  createDispatcher,
  createFeishuMessageSender,
  execute,
  createWakeWorker,
  evaluateDailyHealth,
  exitCodeFor,
  inspectTrustedSocialInvoker,
  inspectTrustedLocalInvoker,
  readMacProcessRow,
  parseCommand,
  readGoogleServiceAccount,
  assertSocialRuntimeConfig,
  SOCIAL_RUNTIME_CONFIG_PATH,
  main,
  readPayload,
  resolveInvocationIdentity,
  runBaseCanary,
  shouldEnqueueSchedule,
} from "../shortdrama_ctl.mjs";
import { canaryReceiptDigest, manifestDigest, permissionAttestationDigest, schemaReceiptDigest, verificationDigest, writeMigrationArtifact } from "../src/migration.mjs";
import { fixedFieldDescriptor } from "../src/feishu-client.mjs";
import { BASE_FIELD_SPECS, TABLE_ORDER, TABLES } from "../src/schema.mjs";

const INTERNAL = {
  SHORTDRAMA_INTERNAL_MARKER: "launchd:com.gengrowth.shortdrama-sync",
  SHORTDRAMA_LAUNCHD_LABEL: "com.gengrowth.shortdrama-sync",
};
const passthroughEnvironment = async ({ env }) => env;
const trustedLocalInvoker = () => true;

function runtimeFixture(root) {
  const config = {
    schema_version: "shortdrama/v1", timezone: "Asia/Shanghai", source_spreadsheet_id: "sheet",
    paths: { env_file: ".env", metrics_sqlite: "metrics.sqlite", collector: "collector.mjs", collector_summary_dir: "summaries", ops_sqlite: "ops.sqlite", payload_root: "payloads" },
    base: { url: "https://base.company.test/base", app_token_env: "BASE", table_id_envs: { accounts: "TA", dramas: "TD", captures: "TC", releases: "TR" } },
    auth: { feishu_app_id_env: "APP", feishu_app_secret_env: "SECRET", google_service_account_path_env: "GOOGLE", operator_ids_env: "OPS", privileged_ids_env: "ADMINS", notification_chat_ids_env: "CHATS" },
    acceptance: { privileged_actor_id: "ou_admin" },
  };
  const env = {
    BASE: "base", TA: "tbl-accounts", TD: "tbl-dramas", TC: "tbl-captures", TR: "tbl-releases",
    APP: "app", SECRET: "secret", GOOGLE: path.join(root, "google.json"), OPS: "ou_operator", ADMINS: "ou_admin", CHATS: "oc_ops", SHORTDRAMA_OPS_CHAT_ID: "oc_ops",
  };
  return { config, env };
}

function repositoryClient(overrides = {}) {
  return {
    listRecords: async () => ({ complete: true, revision: "r", items: [] }),
    createRecords: async () => [], updateRecords: async () => [], getRecord: async () => null,
    ...overrides,
  };
}

function readySchema(env) {
  const idByTable = { "账号台账": env.TA, "选剧池": env.TD, "采集数据": env.TC, "发布记录": env.TR };
  return {
    complete: true, revision: "base-schema-ready", tables: TABLE_ORDER.map((tableName) => ({
      table_id: idByTable[tableName], name: tableName,
      fields: BASE_FIELD_SPECS[tableName].map((spec) => ({
        field_id: `fld-${tableName}-${spec.name}`,
        ...fixedFieldDescriptor(tableName, spec.name, spec.kind === "link" ? { targetTableId: idByTable[spec.targetTable] } : {}),
        ...(spec.primary ? { is_primary: true } : {}),
      })),
    })),
  };
}

test("CLI exposes only registered command paths and fixed options", () => {
  assert.deepEqual(parseCommand(["sync", "status", "--run-id", "run"]), {
    group: "sync", action: "status", options: { runId: "run" },
  });
  assert.deepEqual(parseCommand(["doctor"]), { group: "doctor", action: null, options: {} });
  for (const argv of [
    ["exec", "rm", "-rf"], ["pool", "delete"], ["pool", "update"], ["release", "update"], ["sync"], ["doctor", "extra"],
    ["pool", "list", "--wat", "x"], ["sync", "status", "--run-id", "a", "--run-id", "b"], ["migrate", "plan"],
  ]) assert.throws(() => parseCommand(argv), (error) => ["command_not_allowed", "input_invalid"].includes(error.code));
});

test("fixed update-field actions parse without exposing generic update", () => {
  assert.deepEqual(parseCommand(["pool", "update-field", "--payload", "-"]), {
    group: "pool", action: "update-field", options: { payload: "-" },
  });
  assert.deepEqual(parseCommand(["release", "update-field", "--payload", "-"]), {
    group: "release", action: "update-field", options: { payload: "-" },
  });
  assert.throws(() => parseCommand(["pool", "update", "--payload", "-"]), (error) => error.code === "command_not_allowed");
});

test("account and capture expose only fixed list/get read commands", () => {
  assert.deepEqual(parseCommand(["account", "list"]), { group: "account", action: "list", options: {} });
  assert.deepEqual(parseCommand(["account", "get", "--key", "acct"]), {
    group: "account", action: "get", options: { key: "acct" },
  });
  assert.deepEqual(parseCommand(["capture", "list"]), { group: "capture", action: "list", options: {} });
  assert.deepEqual(parseCommand(["capture", "get", "--key", "123"]), {
    group: "capture", action: "get", options: { key: "123" },
  });
  for (const argv of [
    ["account", "update-field"], ["account", "delete"], ["account", "query"],
    ["capture", "update-field"], ["capture", "delete"], ["capture", "query"],
  ]) assert.throws(() => parseCommand(argv), (error) => error.code === "command_not_allowed");
  assert.throws(() => parseCommand(["account", "get"]), (error) => error.code === "input_invalid");
});

test("account and capture reads require Social identity but allow readers", () => {
  const command = parseCommand(["account", "list"]);
  assert.throws(() => resolveInvocationIdentity(command, {}), (error) => error.code === "social_session_required");
  assert.deepEqual(resolveInvocationIdentity(command, {
    HERMES_SESSION_PLATFORM: "feishu", HERMES_SESSION_PROFILE: "social",
    HERMES_SESSION_USER_ID: "ou_reader", HERMES_SESSION_CHAT_ID: "oc_social",
  }), { mode: "social", actorId: "ou_reader", chatId: "oc_social", profile: "social" });
});

test("account/capture list/get hard-bind complete Base query results and not_found", async () => {
  const calls = [];
  const sourceRows = {
    账号台账: [{ 账号ID: "acct", 账号名: "Account" }],
    采集数据: [{ "Post ID": "123", 播放量: 0 }],
    选剧池: [{ 剧ID: "SD-000001" }],
    发布记录: [{ 发布ID: "SR-000001" }],
  };
  const humanOps = { query: async (request) => {
    calls.push(structuredClone(request));
    const rows = sourceRows[request.table].filter((row) => !request.filter ||
      Object.entries(request.filter).every(([field, value]) => row[field] === value));
    return structuredClone(rows);
  } };
  const dispatch = createDispatcher({ humanOps, assertRuntimeSchemaReady: async () => {} });
  const identity = { mode: "social", actorId: "ou_reader", chatId: "oc_social", profile: "social" };
  const accountList = await dispatch(parseCommand(["account", "list"]), identity, null);
  const captureGet = await dispatch(parseCommand(["capture", "get", "--key", "123"]), identity, null);
  const missing = await dispatch(parseCommand(["account", "get", "--key", "missing"]), identity, null);
  await dispatch(parseCommand(["pool", "list"]), identity, null);
  await dispatch(parseCommand(["release", "list"]), identity, null);
  assert.deepEqual(accountList, {
    status: "success", table: "账号台账", rows: [{ 账号ID: "acct", 账号名: "Account" }],
    readback: "complete", source: "base_complete_index",
  });
  assert.deepEqual(captureGet, {
    status: "success", table: "采集数据", key: "123", record: { "Post ID": "123", 播放量: 0 },
    readback: "complete", source: "base_complete_index",
  });
  assert.deepEqual(missing, {
    status: "not_found", table: "账号台账", key: "missing", record: null,
    readback: "complete", source: "base_complete_index",
  });
  accountList.rows[0].账号名 = "mutated";
  assert.equal(sourceRows.账号台账[0].账号名, "Account");
  assert.deepEqual(calls.map((call) => call.table), ["账号台账", "采集数据", "账号台账", "选剧池", "发布记录"]);
  assert.deepEqual(calls[1].filter, { "Post ID": "123" });
});

test("update-field hard-binds table and Social identity to an exact one-field payload", async () => {
  const calls = [];
  const verified = {
    status: "updated", table: "选剧池", key: "SD-000001", field: "推荐理由",
    before: { present: true, value: "旧" }, after: { present: true, value: "新" }, readback: "verified",
  };
  const dispatch = createDispatcher({ assertRuntimeSchemaReady: async () => {}, humanOps: {
    applySingleField: async (request) => { calls.push(request); return verified; },
  } });
  const identity = { mode: "social", actorId: "ou_operator", chatId: "oc_social", profile: "social" };
  const result = await dispatch(parseCommand(["pool", "update-field", "--payload", "-"]), identity, {
    key: "SD-000001", field: "推荐理由", value: "新",
  });
  assert.deepEqual(result, verified);
  assert.deepEqual(calls, [{
    actorId: "ou_operator", chatId: "oc_social", table: "选剧池",
    key: "SD-000001", field: "推荐理由", value: "新",
  }]);
});

test("update-field rejects missing, extra, unsafe, reader and protected requests", async () => {
  const dispatch = createDispatcher({ assertRuntimeSchemaReady: async () => {}, humanOps: {
    applySingleField: async (request) => {
      if (request.actorId === "ou_reader") throw Object.assign(new Error("reader"), { code: "actor_write_denied" });
      if (request.field === "Post ID") throw Object.assign(new Error("protected"), { code: "field_owner_violation" });
      return { status: "updated", before: {}, after: {}, readback: "verified" };
    },
  } });
  const command = parseCommand(["release", "update-field", "--payload", "-"]);
  const writer = { mode: "social", actorId: "ou_operator", chatId: "oc_social", profile: "social" };
  for (const payload of [
    { key: "SR-000001", field: "RS收益" },
    { key: "SR-000001", field: "RS收益", value: 1, action: "update" },
    JSON.parse('{"key":"SR-000001","field":"RS收益","value":1,"__proto__":{}}'),
  ]) {
    await assert.rejects(() => dispatch(command, writer, payload), (error) => error.code === "payload_invalid");
  }
  await assert.rejects(() => dispatch(command, { ...writer, actorId: "ou_reader" }, {
    key: "SR-000001", field: "RS收益", value: 1,
  }), (error) => error.code === "actor_write_denied");
  await assert.rejects(() => dispatch(command, writer, {
    key: "SR-000001", field: "Post ID", value: "1",
  }), (error) => error.code === "field_owner_violation");
  assert.throws(() => resolveInvocationIdentity(command, {}), (error) => error.code === "social_session_required");
});

test("doctor state initialization is explicit privileged local-only", () => {
  const command = parseCommand(["doctor", "--init-state", "--actor-id", "ou_admin"]);
  assert.equal(command.options.initState, true);
  assert.deepEqual(resolveInvocationIdentity(command, {}, { isPrivilegedAllowed: (id) => id === "ou_admin", isTrustedLocalInvoker: trustedLocalInvoker }), {
    mode: "local", actorId: "ou_admin", chatId: null, profile: null,
  });
  assert.throws(() => resolveInvocationIdentity(command, {
    HERMES_SESSION_PLATFORM: "feishu", HERMES_SESSION_PROFILE: "social",
    HERMES_SESSION_USER_ID: "ou_admin", HERMES_SESSION_CHAT_ID: "oc_social",
  }), (error) => error.code === "social_command_denied");
  assert.throws(() => resolveInvocationIdentity(command, {
    SHORTDRAMA_CAPABILITY_FILE: "/tmp/internal.capability", SHORTDRAMA_INTERNAL_CAPABILITY: "aa".repeat(32),
  }, { isPrivilegedAllowed: () => true }), (error) => error.code === "local_only_required");
  assert.throws(() => resolveInvocationIdentity(parseCommand(["doctor", "--init-state"]), {}),
    (error) => error.code === "actor_required");
  assert.throws(() => parseCommand(["doctor", "--init-state", "--canary", "--actor-id", "ou_admin"]),
    (error) => error.code === "input_invalid");
  assert.throws(() => parseCommand(["doctor", "--canary", "--actor-id", "ou_admin"]),
    (error) => error.code === "input_invalid");
});

test("internal scheduler context cannot initialize state before runtime construction", async () => {
  let builds = 0;
  const result = await execute(["doctor", "--init-state", "--actor-id", "ou_admin", "--config", "/configured/runtime.json"], {
    env: { SHORTDRAMA_CAPABILITY_FILE: "/tmp/internal.capability", SHORTDRAMA_INTERNAL_CAPABILITY: "aa".repeat(32) },
    loadEnvironment: passthroughEnvironment,
    build: async () => { builds += 1; throw new Error("must not build"); },
  });
  assert.equal(result.result.error.code, "local_only_required");
  assert.equal(builds, 0);
});

test("doctor init-state creates only the JobStore and normal doctor remains read-only", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "shortdrama-init-state-"));
  const { config, env } = runtimeFixture(root);
  const configPath = path.join(root, "runtime.json");
  await writeFile(configPath, JSON.stringify(config));
  const dbPath = path.join(root, "ops.sqlite");
  await assert.rejects(access(dbPath));
  const client = repositoryClient();
  await assert.rejects(() => buildRuntime({
    configPath, env, command: parseCommand(["doctor", "--expected-base-token", "base"]), services: { client, readSchema: async () => ({ complete: true, revision: "empty", tables: [] }) },
  }));
  await assert.rejects(access(dbPath));
  await assert.rejects(() => buildRuntime({
    configPath, env, command: parseCommand(["sync", "status", "--run-id", "missing"]),
    services: { client, readSchema: async () => ({ complete: true, revision: "empty", tables: [] }) },
  }), (error) => error.code === "state_store_schema_missing");
  await assert.rejects(access(dbPath));
  await assert.rejects(() => buildRuntime({
    configPath, env, command: parseCommand(["doctor", "--init-state", "--actor-id", "ou_reader"]),
    services: { client, readSchema: async () => ({ complete: true, revision: "empty", tables: [] }) },
  }), (error) => error.code === "privileged_required");
  await assert.rejects(access(dbPath));
  const init = await buildRuntime({
    configPath, env, command: parseCommand(["doctor", "--init-state", "--actor-id", "ou_admin"]),
    services: { client, readSchema: async () => ({ complete: true, revision: "empty", tables: [] }) },
  });
  const initialized = await init.doctor({ initState: true, canary: false });
  init.close();
  assert.equal(initialized.state_store, "initialized");
  assert.equal(initialized.status, "state_initialized");
  assert.equal(initialized.schema_status, "base_table_missing");
  const db = new DatabaseSync(dbPath, { readOnly: true });
  assert.equal(db.prepare("SELECT 1 FROM sqlite_master WHERE name='jobs'").get()["1"], 1);
  assert.equal(db.prepare("SELECT 1 FROM sqlite_master WHERE name='id_sequences'").get(), undefined);
  db.close();
  const normal = await buildRuntime({
    configPath, env, command: parseCommand(["doctor", "--expected-base-token", "base"]),
    services: { client, readSchema: async () => ({ complete: true, revision: "empty", tables: [] }) },
  });
  assert.equal((await normal.doctor({ initState: false, canary: false })).status, "base_table_missing");
  normal.close();
});

test("four-table doctor canary restores exact keys and runs before sequence seeding", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "shortdrama-canary-"));
  const { config, env } = runtimeFixture(root);
  const configPath = path.join(root, "runtime.json");
  await writeFile(configPath, JSON.stringify(config));
  const tableNameById = new Map([[env.TA, "账号台账"], [env.TD, "选剧池"], [env.TC, "采集数据"], [env.TR, "发布记录"]]);
  const rows = new Map([...tableNameById].map(([id, name], index) => [id, [{
    record_id: `existing-${index}`, fields: { [TABLES[name].primaryField]: `EXISTING-${index}` },
  }]]));
  const calls = [];
  const client = repositoryClient({
    listRecords: async (_base, tableId) => ({ complete: true, revision: "r", items: structuredClone(rows.get(tableId)) }),
    createRecords: async (_base, tableId, records) => {
      const record = { record_id: `canary-${tableId}`, fields: structuredClone(records[0].fields) };
      rows.get(tableId).push(record); calls.push(["create", tableNameById.get(tableId)]); return [structuredClone(record)];
    },
    getRecord: async (_base, tableId, recordId) => structuredClone(rows.get(tableId).find((row) => row.record_id === recordId)),
    deleteCanaryRecords: async (_base, tableId, tableName, recordIds) => {
      calls.push(["delete", tableName]);
      rows.set(tableId, rows.get(tableId).filter((row) => !recordIds.includes(row.record_id)));
      return recordIds;
    },
  });
  const initialized = await buildRuntime({
    configPath, env, command: parseCommand(["doctor", "--init-state", "--actor-id", "ou_admin"]),
    services: { client, readSchema: async () => readySchema(env), makeCanaryId: () => "CANARY-SDRUN-20260901-120000-A1B2" },
  });
  await initialized.doctor({ initState: true, canary: false });
  initialized.close();
  const runtime = await buildRuntime({
    configPath, env, command: parseCommand(["doctor", "--canary", "--actor-id", "ou_admin", "--expected-base-token", "base", "--manifest", "plan.json", "--expected-sha256", "a".repeat(64), "--output", "canary.json"]),
    services: { client, readSchema: async () => readySchema(env), makeCanaryId: () => "CANARY-SDRUN-20260901-120000-A1B2" },
  });
  const baseBinding = createHash("sha256").update(JSON.stringify({
    app_token: env.BASE,
    table_ids: { accounts: env.TA, captures: env.TC, dramas: env.TD, releases: env.TR },
  })).digest("hex");
  const result = await runtime.doctor({
    initState: false, canary: true, identity: { actorId: "ou_admin" },
    payload: { manifest: { sha256: "a".repeat(64), base_binding_sha256: baseBinding } },
  });
  runtime.close();
  assert.equal(result.status, "verified");
  assert.equal(result.version, "shortdrama-canary-receipt/v1");
  assert.equal(result.base_binding_sha256, baseBinding);
  assert.equal(result.sha256, canaryReceiptDigest(result));
  assert.ok(Object.values(result.proof).every((proof) => proof.created && proof.readback_verified && proof.deleted && proof.before_key_set_sha256 === proof.after_key_set_sha256));
  assert.deepEqual(calls, [
    ...TABLE_ORDER.map((name) => ["create", name]),
    ...TABLE_ORDER.map((name) => ["delete", name]),
  ]);
  assert.equal([...rows.values()].every((items) => items.length === 1 && items[0].record_id.startsWith("existing-")), true);
});

test("canary explicitly opts into one client-side visibility budget for fixed-table readback", async () => {
  const tableIds = { accounts: "ta", dramas: "td", captures: "tc", releases: "tr" };
  const tableNameById = new Map([["ta", "账号台账"], ["td", "选剧池"], ["tc", "采集数据"], ["tr", "发布记录"]]);
  const rows = new Map([...tableNameById.keys()].map((id) => [id, []]));
  const getOptions = [];
  const listOptions = [];
  const client = repositoryClient({
    listRecords: async (_base, tableId, options) => {
      listOptions.push([tableNameById.get(tableId), options]);
      return { complete: true, revision: "r", items: structuredClone(rows.get(tableId)) };
    },
    createRecords: async (_base, tableId, records, options) => {
      assert.equal(options?.tableName, tableNameById.get(tableId));
      const record = { record_id: `rec-${tableId}`, fields: structuredClone(records[0].fields) };
      rows.get(tableId).push(record);
      return [structuredClone(record)];
    },
    getRecord: async (_base, tableId, recordId, options) => {
      getOptions.push(options);
      return structuredClone(rows.get(tableId).find((row) => row.record_id === recordId));
    },
    deleteCanaryRecords: async (_base, tableId, _tableName, recordIds, options) => {
      assert.deepEqual(options, { canaryId: "CANARY-SDRUN-20260901-120000-A1B2" });
      rows.set(tableId, rows.get(tableId).filter((row) => !recordIds.includes(row.record_id)));
      return recordIds;
    },
  });

  const result = await runBaseCanary({
    client, appToken: "base", tableIds, canaryId: "CANARY-SDRUN-20260901-120000-A1B2",
  });
  assert.equal(result.status, "verified");
  assert.deepEqual(getOptions, TABLE_ORDER.map((tableName) => ({
    tableName, waitForVisibility: true, selectFields: [TABLES[tableName].primaryField],
  })));
  assert.deepEqual(listOptions, [
    ...TABLE_ORDER.map((tableName) => [tableName, { tableName, selectFields: [TABLES[tableName].primaryField] }]),
    ...TABLE_ORDER.map((tableName) => [tableName, { tableName, selectFields: [TABLES[tableName].primaryField] }]),
  ]);
  assert.equal([...rows.values()].every((items) => items.length === 0), true);
});

test("canary restoration polls a stale list only while it contains the just-deleted canary key", async () => {
  const tableIds = { accounts: "ta", dramas: "td", captures: "tc", releases: "tr" };
  const tableNameById = new Map([["ta", "账号台账"], ["td", "选剧池"], ["tc", "采集数据"], ["tr", "发布记录"]]);
  const rows = new Map([...tableNameById].map(([id, tableName]) => [id, [{
    record_id: `existing-${id}`, fields: { [TABLES[tableName].primaryField]: `EXISTING-${id}` },
  }]]));
  const deletedRows = new Map();
  const staleReturned = new Set();
  const sleeps = [];
  const client = repositoryClient({
    listRecords: async (_base, tableId) => {
      if (deletedRows.has(tableId) && !staleReturned.has(tableId)) {
        staleReturned.add(tableId);
        return {
          complete: true, revision: "stale",
          items: [...structuredClone(rows.get(tableId)), structuredClone(deletedRows.get(tableId))],
        };
      }
      return { complete: true, revision: "fresh", items: structuredClone(rows.get(tableId)) };
    },
    createRecords: async (_base, tableId, records) => {
      const record = { record_id: `rec-${tableId}`, fields: structuredClone(records[0].fields) };
      rows.get(tableId).push(record);
      return [structuredClone(record)];
    },
    getRecord: async (_base, tableId, recordId) => structuredClone(rows.get(tableId).find((row) => row.record_id === recordId)),
    deleteCanaryRecords: async (_base, tableId, _tableName, recordIds) => {
      const record = rows.get(tableId).find((row) => recordIds.includes(row.record_id));
      deletedRows.set(tableId, structuredClone(record));
      rows.set(tableId, rows.get(tableId).filter((row) => !recordIds.includes(row.record_id)));
      return recordIds;
    },
  });

  const result = await runBaseCanary({
    client, appToken: "base", tableIds, canaryId: "CANARY-SDRUN-20260904-222659-60211CE4",
    sleep: async (ms) => sleeps.push(ms),
  });
  assert.equal(result.status, "verified");
  assert.deepEqual(sleeps, [1_000, 1_000, 1_000, 1_000]);
  assert.equal([...rows.values()].every((items) => items.length === 1 && items[0].record_id.startsWith("existing-")), true);
});

test("canary restoration does not poll the same canary key on a different record ID", async () => {
  const tableIds = { accounts: "ta", dramas: "td", captures: "tc", releases: "tr" };
  const tableNameById = new Map([["ta", "账号台账"], ["td", "选剧池"], ["tc", "采集数据"], ["tr", "发布记录"]]);
  const rows = new Map([...tableNameById.keys()].map((id) => [id, []]));
  let deleted = false;
  let sleeps = 0;
  const client = repositoryClient({
    listRecords: async (_base, tableId) => {
      if (deleted && tableId === "ta") return {
        complete: true, revision: "changed", items: [{
          record_id: "replacement", fields: { 账号ID: "CANARY-SDRUN-20260904-222659-60211CE4" },
        }],
      };
      return { complete: true, revision: "r", items: structuredClone(rows.get(tableId)) };
    },
    createRecords: async (_base, tableId, records) => {
      const record = { record_id: `rec-${tableId}`, fields: structuredClone(records[0].fields) };
      rows.get(tableId).push(record);
      return [structuredClone(record)];
    },
    getRecord: async (_base, tableId, recordId) => structuredClone(rows.get(tableId).find((row) => row.record_id === recordId)),
    deleteCanaryRecords: async (_base, tableId, _tableName, recordIds) => {
      rows.set(tableId, rows.get(tableId).filter((row) => !recordIds.includes(row.record_id)));
      deleted = true;
      return recordIds;
    },
  });

  await assert.rejects(() => runBaseCanary({
    client, appToken: "base", tableIds, canaryId: "CANARY-SDRUN-20260904-222659-60211CE4",
    sleep: async () => { sleeps += 1; },
  }), (error) => error.code === "canary_cleanup_failed" && error.details.phase === "restoration" &&
    error.details.table === "账号台账" && error.details.cause_code === "readback_mismatch");
  assert.equal(sleeps, 0);
});

test("canary restoration rejects an unrelated key change without polling", async () => {
  const tableIds = { accounts: "ta", dramas: "td", captures: "tc", releases: "tr" };
  const rows = new Map(Object.values(tableIds).map((id) => [id, []]));
  let deleted = false;
  let sleeps = 0;
  const client = repositoryClient({
    listRecords: async (_base, tableId) => deleted && tableId === "ta"
      ? { complete: true, revision: "changed", items: [{ record_id: "human", fields: { 账号ID: "human-change" } }] }
      : { complete: true, revision: "r", items: structuredClone(rows.get(tableId)) },
    createRecords: async (_base, tableId, records) => {
      const record = { record_id: `rec-${tableId}`, fields: structuredClone(records[0].fields) };
      rows.get(tableId).push(record);
      return [structuredClone(record)];
    },
    getRecord: async (_base, tableId, recordId) => structuredClone(rows.get(tableId).find((row) => row.record_id === recordId)),
    deleteCanaryRecords: async (_base, tableId, _tableName, recordIds) => {
      rows.set(tableId, rows.get(tableId).filter((row) => !recordIds.includes(row.record_id)));
      deleted = true;
      return recordIds;
    },
  });

  await assert.rejects(() => runBaseCanary({
    client, appToken: "base", tableIds, canaryId: "CANARY-SDRUN-20260904-222659-60211CE4",
    sleep: async () => { sleeps += 1; },
  }), (error) => error.code === "canary_cleanup_failed" && error.details.phase === "restoration" &&
    error.details.table === "账号台账" && error.details.cause_code === "readback_mismatch");
  assert.equal(sleeps, 0);
});

test("canary cleanup failure is manual-repair terminal and never verified", async () => {
  const tableIds = { accounts: "ta", dramas: "td", captures: "tc", releases: "tr" };
  const tableNameById = new Map([["ta", "账号台账"], ["td", "选剧池"], ["tc", "采集数据"], ["tr", "发布记录"]]);
  const rows = new Map([...tableNameById.keys()].map((id) => [id, []]));
  let sleeps = 0;
  const client = repositoryClient({
    listRecords: async (_base, tableId) => ({ complete: true, revision: "r", items: structuredClone(rows.get(tableId)) }),
    createRecords: async (_base, tableId, records) => {
      const record = { record_id: `rec-${tableId}`, fields: structuredClone(records[0].fields) };
      rows.get(tableId).push(record);
      return [structuredClone(record)];
    },
    getRecord: async (_base, tableId, recordId) => structuredClone(rows.get(tableId).find((row) => row.record_id === recordId)),
    deleteCanaryRecords: async () => { throw Object.assign(new Error("cleanup"), { code: "base_request_failed" }); },
  });
  await assert.rejects(() => runBaseCanary({
    client, appToken: "base", tableIds, canaryId: "CANARY-SDRUN-20260901-120000-A1B2",
    sleep: async () => { sleeps += 1; },
  }), (error) => error.code === "canary_cleanup_failed" && error.details.next_step === "manual_repair" &&
    error.details.phase === "delete" && error.details.table === "账号台账" && error.details.cause_code === "base_request_failed");
  assert.equal(sleeps, 0);
});

test("later canary readback failure still cleans every earlier table", async () => {
  const tableIds = { accounts: "ta", dramas: "td", captures: "tc", releases: "tr" };
  const rows = new Map(Object.values(tableIds).map((id) => [id, []]));
  const client = repositoryClient({
    listRecords: async (_base, tableId) => ({ complete: true, revision: "r", items: structuredClone(rows.get(tableId)) }),
    createRecords: async (_base, tableId, records) => {
      const row = { record_id: `rec-${tableId}`, fields: structuredClone(records[0].fields) };
      rows.get(tableId).push(row); return [structuredClone(row)];
    },
    getRecord: async (_base, tableId, recordId) => {
      if (tableId === "tr") throw Object.assign(new Error("late readback"), { code: "readback_mismatch" });
      return structuredClone(rows.get(tableId).find((row) => row.record_id === recordId));
    },
    deleteCanaryRecords: async (_base, tableId, _tableName, recordIds) => {
      rows.set(tableId, rows.get(tableId).filter((row) => !recordIds.includes(row.record_id))); return recordIds;
    },
  });
  await assert.rejects(() => runBaseCanary({ client, appToken: "base", tableIds, canaryId: "CANARY-SDRUN-20260901-120000-A1B2" }),
    (error) => error.code === "readback_mismatch");
  assert.equal([...rows.values()].every((items) => items.length === 0), true);
});

test("every public and internal registry path parses with only its fixed shape", () => {
  const commands = [
    ["doctor"], ["migrate", "plan", "--output", "plan.json"], ["migrate", "apply", "--phase", "schema", "--manifest", "plan.json", "--expected-sha256", "a".repeat(64)], ["migrate", "verify", "--manifest", "plan.json"],
    ["migrate", "attest-permissions", "--manifest", "plan.json", "--expected-sha256", "a".repeat(64), "--schema-receipt", "schema.json", "--expected-schema-receipt-sha256", "b".repeat(64), "--observations", "observations.json", "--expected-observations-file-sha256", "c".repeat(64), "--output", "permission.json", "--expected-base-token", "base"],
    ["account", "list"], ["account", "get", "--key", "acct"], ["capture", "list"], ["capture", "get", "--key", "123"],
    ["pool", "list"], ["pool", "get", "--key", "SD-000001"], ["pool", "create"], ["pool", "update-field"], ["pool", "preview-update"], ["pool", "preview-batch"],
    ["pool", "apply-update"], ["pool", "preview-archive", "--key", "SD-000001"], ["pool", "apply-archive"],
    ["release", "list"], ["release", "get", "--key", "SR-000001"], ["release", "schedule"], ["release", "update-field"],
    ["release", "preview-update"], ["release", "preview-batch"], ["release", "apply-update"], ["release", "attach-post"],
    ["metrics", "by-drama"], ["metrics", "by-account"], ["sync", "start"], ["sync", "status", "--run-id", "run"],
    ["schedule", "tick"], ["schedule", "health"], ["queue", "drain"],
  ];
  for (const argv of commands) assert.equal(parseCommand(argv).group, argv[0]);
  assert.throws(() => parseCommand(["queue", "drain", "--run-id", "forged"]), (error) => error.code === "input_invalid");
  assert.throws(() => parseCommand(["schedule", "tick", "--actor-id", "forged"]), (error) => error.code === "input_invalid");
});

test("fixed preview-batch routes exact items to the bound table and Social identity", async () => {
  const calls = [];
  const dispatch = createDispatcher({ assertRuntimeSchemaReady: async () => {}, humanOps: {
    previewMutation: async (request) => { calls.push(request); return { status: "preview" }; },
  } });
  const identity = { mode: "social", actorId: "ou_admin", chatId: "oc_social", profile: "social" };
  const items = [{ key: "SD-000001", patch: { 备注: "new" } }];
  await dispatch(parseCommand(["pool", "preview-batch", "--payload", "-"]), identity, { items });
  assert.deepEqual(calls, [{
    actorId: "ou_admin", chatId: "oc_social", table: "选剧池", action: "batch_update", items,
  }]);
  await assert.rejects(
    () => dispatch(parseCommand(["release", "preview-batch", "--payload", "-"]), identity, { items, table: "选剧池" }),
    (error) => error.code === "payload_invalid",
  );
  await assert.rejects(
    () => dispatch(parseCommand(["release", "preview-batch", "--payload", "-"]), identity, { action: "batch_update" }),
    (error) => error.code === "payload_invalid",
  );
});

test("pool and release list/get return the same complete readback envelope", async () => {
  const source = {
    选剧池: [{ 剧ID: "SD-000001", 剧名: "One" }],
    发布记录: [{ 发布ID: "SR-000001", 备注: "One" }],
  };
  const dispatch = createDispatcher({ assertRuntimeSchemaReady: async () => {}, humanOps: {
    query: async ({ table, filter }) => {
      const rows = source[table];
      if (!filter) return structuredClone(rows);
      return structuredClone(rows.filter((row) => Object.entries(filter).every(([field, value]) => row[field] === value)));
    },
  } });
  const identity = { mode: "social", actorId: "ou_reader", chatId: "oc_social", profile: "social" };
  assert.deepEqual(await dispatch(parseCommand(["pool", "list"]), identity, null), {
    status: "success", table: "选剧池", rows: source.选剧池, readback: "complete", source: "base_complete_index",
  });
  assert.deepEqual(await dispatch(parseCommand(["release", "get", "--key", "missing"]), identity, null), {
    status: "not_found", table: "发布记录", key: "missing", record: null,
    readback: "complete", source: "base_complete_index",
  });
});

test("query payload cannot override fixed actor/table/key authority or add unknown keys", async () => {
  const calls = [];
  const dispatch = createDispatcher({
    assertRuntimeSchemaReady: async () => {},
    humanOps: { query: async (request) => { calls.push(request); return []; } },
  });
  const identity = { mode: "social", actorId: "ou_reader", chatId: "oc_social", profile: "social" };
  for (const payload of [
    { actorId: "ou_forged" }, { table: "发布记录" }, { extra: true },
  ]) {
    await assert.rejects(
      () => dispatch(parseCommand(["pool", "list", "--payload", "-"]), identity, payload),
      (error) => error.code === "payload_invalid",
    );
  }
  await dispatch(parseCommand(["release", "get", "--key", "SR-000001", "--payload", "-"]), identity, {
    filter: { 发布ID: "SR-FORGED" }, sort: { field: "发布ID", direction: "desc" },
  });
  assert.deepEqual(calls, [{
    actorId: "ou_reader", table: "发布记录", filter: { 发布ID: "SR-000001" },
    sort: { field: "发布ID", direction: "desc" },
  }]);
});

test("schema drift after doctor blocks every normal Base command before business or enqueue side effects", async () => {
  let drifted = false;
  let sideEffects = 0;
  const runtime = {
    config: { auth: { isOperatorAllowed: () => true, isPrivilegedAllowed: () => false } },
    doctor: async () => ({ status: "ready" }),
    assertRuntimeSchemaReady: async () => {
      if (drifted) throw Object.assign(new Error("drift"), { code: "base_schema_drift" });
    },
    humanOps: new Proxy({}, { get: () => async () => { sideEffects += 1; return []; } }),
    syncContext: { jobs: {}, makeRunId() {}, wakeWorker() {} },
  };
  const dispatch = createDispatcher(runtime);
  const social = { mode: "social", actorId: "ou_operator", chatId: "oc_social", profile: "social" };
  assert.equal((await dispatch(parseCommand(["doctor", "--expected-base-token", "base"]), { mode: "local", actorId: "ou_admin" }, null)).status, "ready");
  drifted = true;
  for (const argv of [
    ["account", "list"], ["capture", "list"], ["pool", "list"], ["release", "list"],
    ["metrics", "by-drama"], ["sync", "start"],
  ]) {
    await assert.rejects(() => dispatch(parseCommand(argv), social, null), (error) => error.code === "base_schema_drift");
  }
  assert.equal(sideEffects, 0);
});

test("real Feishu Social sessions cannot reach doctor, migration, or internal runner commands", async () => {
  const session = {
    HERMES_SESSION_PLATFORM: "feishu", HERMES_SESSION_PROFILE: "social",
    HERMES_SESSION_USER_ID: "ou_admin", HERMES_SESSION_CHAT_ID: "oc_social",
  };
  for (const command of [
    parseCommand(["doctor", "--expected-base-token", "base"]),
    parseCommand(["doctor", "--canary", "--actor-id", "ou_admin", "--expected-base-token", "base", "--manifest", "plan.json", "--expected-sha256", "a".repeat(64), "--output", "canary.json"]),
    parseCommand(["migrate", "plan", "--expected-base-token", "base", "--output", "social-denied.json"]),
    parseCommand(["migrate", "verify", "--manifest", "plan.json", "--expected-base-token", "base"]),
    parseCommand(["schedule", "tick"]),
    parseCommand(["queue", "drain"]),
  ]) {
    assert.throws(() => resolveInvocationIdentity(command, session), (error) => error.code === "social_command_denied");
  }
  let builds = 0;
  const result = await execute(["migrate", "plan", "--expected-base-token", "base", "--output", "social-denied.json", "--config", "/configured/runtime.json"], {
    env: session,
    loadEnvironment: passthroughEnvironment,
    build: async () => { builds += 1; throw new Error("must not build"); },
  });
  assert.equal(result.result.error.code, "social_command_denied");
  assert.equal(builds, 0);
});

test("migration registry accepts the independent evidence flags used by the runbook", () => {
  assert.deepEqual(parseCommand([
    "migrate", "apply", "--phase", "data", "--manifest", "plan.json",
    "--expected-sha256", "a".repeat(64), "--schema-receipt", "schema.json",
    "--expected-schema-receipt-sha256", "b".repeat(64), "--actor-id", "ou_admin",
    "--config", "/configured/runtime.json",
  ]).options.schemaReceipt, "schema.json");
  assert.equal(parseCommand([
    "migrate", "verify", "--manifest", "plan.json", "--output", "verification.json",
    "--actor-id", "ou_admin", "--config", "/configured/runtime.json",
  ]).options.output, "verification.json");
  assert.throws(() => parseCommand(["migrate", "plan", "--output", "../escape.json"]), (error) => error.code === "input_invalid");
  assert.throws(() => parseCommand(["migrate", "plan", "--output", "/tmp/escape.json"]), (error) => error.code === "input_invalid");
});

test("Social identity is session-derived and explicit overrides fail", () => {
  const env = {
    HERMES_SESSION_PLATFORM: "feishu", HERMES_SESSION_PROFILE: "social",
    HERMES_SESSION_USER_ID: "ou_operator", HERMES_SESSION_CHAT_ID: "oc_social",
  };
  assert.deepEqual(resolveInvocationIdentity(parseCommand(["pool", "create", "--payload", "-"]), env), {
    mode: "social", actorId: "ou_operator", chatId: "oc_social", profile: "social",
  });
  assert.throws(() => resolveInvocationIdentity(parseCommand([
    "pool", "create", "--actor-id", "ou_admin", "--payload", "-",
  ]), env), (error) => error.code === "session_identity_override");
  assert.throws(() => resolveInvocationIdentity(parseCommand(["pool", "list"]), {
    ...env, HERMES_SESSION_PLATFORM: "telegram",
  }), (error) => error.code === "session_identity_invalid");
});

test("local privileged and internal identities fail closed", () => {
  assert.throws(() => resolveInvocationIdentity(parseCommand(["migrate", "apply", "--phase", "schema", "--manifest", "plan.json", "--expected-sha256", "a".repeat(64)]), {}),
    (error) => error.code === "actor_required");
  assert.deepEqual(resolveInvocationIdentity(parseCommand([
    "migrate", "apply", "--phase", "schema", "--manifest", "plan.json", "--expected-sha256", "a".repeat(64), "--actor-id", "ou_admin",
  ]), {}, { isPrivilegedAllowed: (id) => id === "ou_admin", isTrustedLocalInvoker: () => true }), {
    mode: "local", actorId: "ou_admin", chatId: null, profile: null,
  });
  assert.throws(() => resolveInvocationIdentity(parseCommand([
    "migrate", "plan", "--expected-base-token", "base", "--output", "local-denied.json", "--actor-id", "ou_admin",
  ]), {}, { isPrivilegedAllowed: () => true, isTrustedLocalInvoker: () => false }),
  (error) => error.code === "local_invoker_untrusted");
  assert.throws(() => resolveInvocationIdentity(parseCommand([
    "doctor", "--expected-base-token", "base",
  ]), {}, { isPrivilegedAllowed: () => true, isTrustedLocalInvoker: () => true }),
  (error) => error.code === "actor_required");
  assert.throws(() => resolveInvocationIdentity(parseCommand(["schedule", "tick"]), {}),
    (error) => error.code === "internal_context_required");
  assert.throws(() => resolveInvocationIdentity(parseCommand(["schedule", "tick"]), INTERNAL),
    (error) => error.code === "internal_context_required");
  assert.throws(() => resolveInvocationIdentity(parseCommand(["pool", "list", "--actor-id", "ou"]), {}),
    (error) => error.code === "social_session_required");
});

test("untrusted local Hermes ancestry is rejected before runtime construction even without session env", async () => {
  let builds = 0;
  const result = await execute([
    "migrate", "plan", "--expected-base-token", "base", "--output", "local-denied.json", "--actor-id", "ou_admin",
    "--config", "/configured/runtime.json",
  ], {
    env: {}, loadEnvironment: passthroughEnvironment,
    isTrustedLocalInvoker: () => false,
    build: async () => { builds += 1; throw new Error("must not build"); },
  });
  assert.equal(result.result.error.code, "local_invoker_untrusted");
  assert.equal(builds, 0);
});

test("local provenance accepts only a bounded positive Terminal chain", () => {
  const tty = { isTTY: true };
  const terminalRows = new Map([
    [100, { pid: 100, ppid: 90, command: "/opt/homebrew/Cellar/node/25.9.0/bin/node", args: "node shortdrama_ctl.mjs doctor" }],
    [90, { pid: 90, ppid: 80, command: "/bin/zsh", args: "-zsh" }],
    [80, { pid: 80, ppid: 1, command: "/Applications/Utilities/Terminal.app/Contents/MacOS/Terminal", args: "Terminal" }],
  ]);
  assert.equal(inspectTrustedLocalInvoker({ stdin: tty, stdout: tty, pid: 100, readProcess: (pid) => terminalRows.get(pid) }), true);
  const hermesRows = new Map(terminalRows);
  hermesRows.set(90, { pid: 90, ppid: 80, command: "/usr/bin/python3", args: "python run_agent.py" });
  assert.equal(inspectTrustedLocalInvoker({ stdin: tty, stdout: tty, pid: 100, readProcess: (pid) => hermesRows.get(pid) }), false);
  const unknownWrapperRows = new Map([
    [100, { pid: 100, ppid: 95, command: "/usr/local/bin/node", args: "node shortdrama_ctl.mjs doctor" }],
    [95, { pid: 95, ppid: 90, command: "/usr/bin/python3", args: "python unknown-wrapper.py" }],
    [90, { pid: 90, ppid: 80, command: "/bin/zsh", args: "-zsh" }],
    [80, { pid: 80, ppid: 1, command: "/Applications/Utilities/Terminal.app/Contents/MacOS/Terminal", args: "Terminal" }],
  ]);
  assert.equal(inspectTrustedLocalInvoker({ stdin: tty, stdout: tty, pid: 100, readProcess: (pid) => unknownWrapperRows.get(pid) }), false);
  const missingAnchorRows = new Map(terminalRows);
  missingAnchorRows.set(80, { pid: 80, ppid: 1, command: "/bin/zsh", args: "-zsh" });
  assert.equal(inspectTrustedLocalInvoker({ stdin: tty, stdout: tty, pid: 100, readProcess: (pid) => missingAnchorRows.get(pid) }), false);
  const ghosttyRows = new Map(terminalRows);
  ghosttyRows.set(80, { pid: 80, ppid: 1, command: "/Applications/Ghostty.app/Contents/MacOS/ghostty", args: "ghostty" });
  assert.equal(inspectTrustedLocalInvoker({ stdin: tty, stdout: tty, pid: 100, readProcess: (pid) => ghosttyRows.get(pid) }), true);
  assert.equal(inspectTrustedLocalInvoker({ stdin: { isTTY: false }, stdout: tty, pid: 100, readProcess: (pid) => terminalRows.get(pid) }), false);
});

test("local provenance accepts only the exact macOS login wrapper used by Ghostty", () => {
  const tty = { isTTY: true };
  const rows = new Map([
    [100, { pid: 100, ppid: 90, command: "/opt/homebrew/Cellar/node/25.9.0/bin/node", args: "node shortdrama_ctl.mjs doctor" }],
    [90, { pid: 90, ppid: 85, command: "-/bin/zsh", args: "-/bin/zsh" }],
    [85, {
      pid: 85,
      ppid: 80,
      command: "/usr/bin/login",
      args: "/usr/bin/login -flp awayer_mini /bin/bash --noprofile --norc -c exec -l /bin/zsh",
    }],
    [80, { pid: 80, ppid: 1, command: "/Applications/Ghostty.app/Contents/MacOS/ghostty", args: "/Applications/Ghostty.app/Contents/MacOS/ghostty" }],
  ]);
  assert.equal(inspectTrustedLocalInvoker({
    stdin: tty,
    stdout: tty,
    pid: 100,
    username: "awayer_mini",
    readProcess: (pid) => rows.get(pid),
  }), true);

  const altered = new Map(rows);
  altered.set(85, { ...rows.get(85), args: "/usr/bin/login -flp other_user /bin/bash --noprofile --norc -c exec -l /bin/zsh" });
  assert.equal(inspectTrustedLocalInvoker({
    stdin: tty,
    stdout: tty,
    pid: 100,
    username: "awayer_mini",
    readProcess: (pid) => altered.get(pid),
  }), false);
});

test("macOS process inspection reads full Cellar executables without a combined ps row", () => {
  const calls = [];
  const values = ["90\n", "/opt/homebrew/Cellar/node/25.9.0/bin/node\n", "node shortdrama_ctl.mjs doctor\n"];
  const row = readMacProcessRow(100, { execFile: (file, args) => { calls.push([file, args]); return values.shift(); } });
  assert.deepEqual(row, {
    pid: 100, ppid: 90, command: "/opt/homebrew/Cellar/node/25.9.0/bin/node", args: "node shortdrama_ctl.mjs doctor",
  });
  assert.equal(calls.length, 3);
  assert.ok(calls.every(([file, args]) => file === "/bin/ps" && args.includes("-ww")));
  assert.equal(calls.some(([, args]) => args.some((value) => /ppid=,comm=,args=/.test(value))), false);
});

test("Social provenance accepts only direct Runner shell execution from a Hermes gateway anchor", async () => {
  const argv = ["pool", "list", "--config", SOCIAL_RUNTIME_CONFIG_PATH];
  const command = parseCommand(argv);
  const runner = path.resolve(new URL("../shortdrama_ctl.mjs", import.meta.url).pathname);
  const sessionId = "a1b2c3d4e5f6";
  // Generated from Hermes f6923bae5c LocalEnvironment._wrap_command() with its real macOS TMPDIR.
  const cache = "/var/folders/c8/k7q0dcp13rd8590xbtxs_9n80000gn/T";
  const snapshot = `${cache}/hermes-snap-${sessionId}.sh`;
  const cwdFile = `${cache}/hermes-cwd-${sessionId}.txt`;
  const hermesCwd = "/Users/awayer_mini/.hermes/profiles/social";
  const direct = `/usr/bin/env node ${runner} ${argv.join(" ")}`;
  const wrapped = [
    `source ${snapshot} >/dev/null 2>&1 || true`,
    `builtin cd -- ${hermesCwd} || exit 126`,
    `eval '${direct}'`,
    "__hermes_ec=$?",
    "umask 077",
    `{ export -p > ${snapshot}.tmp.$BASHPID && mv -f ${snapshot}.tmp.$BASHPID ${snapshot}; } 2>/dev/null || rm -f ${snapshot}.tmp.$BASHPID 2>/dev/null || true`,
    `pwd -P > ${cwdFile} 2>/dev/null || true`,
    `printf '\\n__HERMES_CWD_${sessionId}__%s__HERMES_CWD_${sessionId}__\\n' "$(pwd -P)"`,
    "exit $__hermes_ec",
  ].join("\n");
  const python = "/Users/awayer_mini/hermes-agent/.venv/bin/python";
  // Generated from Hermes f6923bae5c launchd ProgramArguments for the Social profile.
  const gatewayArgs = `${python} -m hermes_cli.main --profile social gateway run --replace`;
  const rows = new Map([
    [100, { pid: 100, ppid: 90, command: process.execPath, args: `node ${runner} pool list --config ${SOCIAL_RUNTIME_CONFIG_PATH}` }],
    [90, { pid: 90, ppid: 80, command: "/bin/bash", args: `/bin/bash -c ${wrapped}` }],
    [80, { pid: 80, ppid: 1, command: python, args: gatewayArgs }],
  ]);
  const inspect = (candidate) => inspectTrustedSocialInvoker({
    argv, command, configPath: SOCIAL_RUNTIME_CONFIG_PATH, pid: 100,
    runnerPath: runner, nodePath: process.execPath, readProcess: (pid) => candidate.get(pid),
  });
  assert.equal(inspect(rows), true);

  const extraWrapperLine = new Map(rows);
  extraWrapperLine.set(90, {
    ...rows.get(90),
    args: rows.get(90).args.replace("exit $__hermes_ec", "python3 persistent_process.py\nexit $__hermes_ec"),
  });
  assert.equal(inspect(extraWrapperLine), false);
  const unsafeCwd = new Map(rows);
  unsafeCwd.set(90, {
    ...rows.get(90),
    args: rows.get(90).args.replace(hermesCwd, "/Users/awayer_mini/.hermes/profiles/social/../escape"),
  });
  assert.equal(inspect(unsafeCwd), false);

  const persistentPython = new Map(rows);
  persistentPython.set(80, { pid: 80, ppid: 75, command: "/usr/bin/python3", args: "python3 persistent_process.py" });
  persistentPython.set(75, { ...rows.get(80), pid: 75 });
  assert.equal(inspect(persistentPython), false);
  let loads = 0;
  let builds = 0;
  const blocked = await execute(argv, {
    env: {
      HERMES_SESSION_PLATFORM: "feishu", HERMES_SESSION_PROFILE: "social",
      HERMES_SESSION_USER_ID: "ou_operator", HERMES_SESSION_CHAT_ID: "oc_social",
    },
    isTrustedSocialInvoker: () => inspect(persistentPython),
    validateSocialConfig: async () => assert.fail("config must not be inspected"),
    loadEnvironment: async () => { loads += 1; throw new Error("must not load"); },
    build: async () => { builds += 1; throw new Error("must not build"); },
  });
  assert.equal(blocked.result.error.code, "social_invoker_untrusted");
  assert.deepEqual({ loads, builds }, { loads: 0, builds: 0 });
  for (const [commandPath, args] of [
    ["/usr/bin/python3", "python3 -i"], ["/usr/bin/ruby", "ruby -e loop"], ["/usr/bin/perl", "perl worker.pl"],
    ["/usr/bin/php", "php -a"], ["/usr/bin/lua", "lua"], [process.execPath, "node"],
    ["/usr/local/bin/process-registry", "process-registry submit"], ["/Applications/Codex.app/Contents/MacOS/Codex", "Codex"],
    ["/Applications/Visual Studio Code.app/Contents/MacOS/Electron", "Electron"],
  ]) {
    const invalid = new Map(rows);
    invalid.set(80, { pid: 80, ppid: 1, command: commandPath, args });
    assert.equal(inspect(invalid), false);
  }
  const persistentShell = new Map(rows);
  persistentShell.set(90, { pid: 90, ppid: 80, command: "/bin/bash", args: "/bin/bash -lic set +m; /usr/bin/env node runner" });
  assert.equal(inspect(persistentShell), false);
});

test("Social provenance accepts only the fixed quoted payload heredoc generated by Hermes", () => {
  const runner = path.resolve(new URL("../shortdrama_ctl.mjs", import.meta.url).pathname);
  const sessionId = "a1b2c3d4e5f6";
  const tempRoot = "/var/folders/c8/k7q0dcp13rd8590xbtxs_9n80000gn/T";
  const snapshot = `${tempRoot}/hermes-snap-${sessionId}.sh`;
  const cwdFile = `${tempRoot}/hermes-cwd-${sessionId}.txt`;
  const python = "/Users/awayer_mini/hermes-agent/.venv/bin/python";
  const gateway = `${python} -m hermes_cli.main --profile social gateway run --replace`;
  // Exact algorithm/output shape from Hermes f6923bae5c BaseEnvironment._wrap_command().
  const wrap = (commandText) => [
    `source ${snapshot} >/dev/null 2>&1 || true`,
    "builtin cd -- /Users/awayer_mini/.hermes/profiles/social || exit 126",
    `eval '${commandText.replaceAll("'", "'\\''")}'`,
    "__hermes_ec=$?",
    "umask 077",
    `{ export -p > ${snapshot}.tmp.$BASHPID && mv -f ${snapshot}.tmp.$BASHPID ${snapshot}; } 2>/dev/null || rm -f ${snapshot}.tmp.$BASHPID 2>/dev/null || true`,
    `pwd -P > ${cwdFile} 2>/dev/null || true`,
    `printf '\\n__HERMES_CWD_${sessionId}__%s__HERMES_CWD_${sessionId}__\\n' "$(pwd -P)"`,
    "exit $__hermes_ec",
  ].join("\n");
  const inspectWrapped = (argv, wrappedScript) => {
    const rows = new Map([
      [100, { pid: 100, ppid: 90, command: process.execPath, args: `node ${runner} ${argv.join(" ")}` }],
      [90, { pid: 90, ppid: 80, command: "/bin/bash", args: `/bin/bash -c ${wrappedScript}` }],
      [80, { pid: 80, ppid: 1, command: python, args: gateway }],
    ]);
    return inspectTrustedSocialInvoker({
      argv, command: parseCommand(argv), configPath: SOCIAL_RUNTIME_CONFIG_PATH, pid: 100,
      runnerPath: runner, nodePath: process.execPath, readProcess: (pid) => rows.get(pid),
    });
  };
  const inspect = (argv, commandText) => inspectWrapped(argv, wrap(commandText));
  const cases = [
    [["pool", "update-field", "--config", SOCIAL_RUNTIME_CONFIG_PATH, "--payload", "-"], '{"key":"SD-000001","field":"备注","value":"中文"}'],
    [["pool", "create", "--config", SOCIAL_RUNTIME_CONFIG_PATH, "--payload", "-"], '{"patch":{"剧名":"New Drama","平台":"ReelShort"}}'],
    [["pool", "preview-update", "--config", SOCIAL_RUNTIME_CONFIG_PATH, "--payload", "-"], '{"key":"SD-000001","patch":{"备注":"preview"}}'],
    [["pool", "apply-update", "--config", SOCIAL_RUNTIME_CONFIG_PATH, "--payload", "-"], '{"receiptId":"sdp_123e4567-e89b-42d3-a456-426614174000"}'],
    [["pool", "list", "--config", SOCIAL_RUNTIME_CONFIG_PATH, "--payload", "-"], '{"filter":{"平台":"ReelShort"}}'],
  ];
  for (const [argv, body] of cases) {
    const direct = `/usr/bin/env node ${runner} ${argv.join(" ")}`;
    assert.equal(inspect(argv, `${direct} <<'SHORTDRAMA_PAYLOAD'\n${body}\nSHORTDRAMA_PAYLOAD`), true);
  }

  const apostropheArgv = cases[0][0];
  const apostropheDirect = `/usr/bin/env node ${runner} ${apostropheArgv.join(" ")}`;
  const apostropheCommand = `${apostropheDirect} <<'SHORTDRAMA_PAYLOAD'\n{"key":"SD-000001","field":"备注","value":"Bob's note"}\nSHORTDRAMA_PAYLOAD`;
  const hermesRoot = process.env.HERMES_SOURCE_ROOT ?? "/Users/awayer_mini/hermes-agent";
  const realWrapper = execFileSync(path.join(hermesRoot, ".venv", "bin", "python"), ["-c", `
import sys
sys.path.insert(0, ${JSON.stringify(hermesRoot)})
from tools.environments.local import LocalEnvironment
environment = object.__new__(LocalEnvironment)
environment._snapshot_path = ${JSON.stringify(snapshot)}
environment._cwd_file = ${JSON.stringify(cwdFile)}
environment._cwd_marker = ${JSON.stringify(`__HERMES_CWD_${sessionId}__`)}
environment._snapshot_ready = True
print(environment._wrap_command(sys.argv[1], ${JSON.stringify("/Users/awayer_mini/.hermes/profiles/social")}), end="")
`, apostropheCommand], { encoding: "utf8" });
  assert.equal(inspectWrapped(apostropheArgv, realWrapper), true);
  assert.equal(inspectWrapped(apostropheArgv, realWrapper.replace("Bob'\\''s note", "Bob\\'s note")), false);
  assert.equal(inspectWrapped(apostropheArgv, realWrapper.replace("Bob'\\''s note", "Bob's note")), false);

  const argv = cases[0][0];
  const direct = `/usr/bin/env node ${runner} ${argv.join(" ")}`;
  for (const invalid of [
    `${direct} <<SHORTDRAMA_PAYLOAD\n{}\nSHORTDRAMA_PAYLOAD`,
    `${direct} <<'OTHER'\n{}\nOTHER`,
    `${direct} <<'SHORTDRAMA_PAYLOAD'\n{"value":"$(id)"}\nSHORTDRAMA_PAYLOAD`,
    `${direct} <<'SHORTDRAMA_PAYLOAD'\n{}\nSHORTDRAMA_PAYLOAD\npython3 persistent.py`,
    `${direct} <<'SHORTDRAMA_PAYLOAD'\n{}\nSHORTDRAMA_PAYLOAD\n`,
    `${direct} <<'SHORTDRAMA_PAYLOAD'\n{}\nSHORTDRAMA_PAYLOAD\ncat <<'SHORTDRAMA_PAYLOAD'\n{}\nSHORTDRAMA_PAYLOAD`,
  ]) assert.equal(inspect(argv, invalid), false);

  const noPayloadArgv = ["pool", "list", "--config", SOCIAL_RUNTIME_CONFIG_PATH];
  const noPayloadDirect = `/usr/bin/env node ${runner} ${noPayloadArgv.join(" ")}`;
  assert.equal(inspect(noPayloadArgv, `${noPayloadDirect} <<'SHORTDRAMA_PAYLOAD'\n{}\nSHORTDRAMA_PAYLOAD`), false);
});

test("Social provenance and fixed config reject before environment, payload, runtime, or network", async () => {
  const session = {
    HERMES_SESSION_PLATFORM: "feishu", HERMES_SESSION_PROFILE: "social",
    HERMES_SESSION_USER_ID: "ou_operator", HERMES_SESSION_CHAT_ID: "oc_social",
  };
  let loads = 0;
  let builds = 0;
  let configChecks = 0;
  const rejected = await execute(["pool", "list", "--config", SOCIAL_RUNTIME_CONFIG_PATH], {
    env: session,
    isTrustedSocialInvoker: () => false,
    validateSocialConfig: async () => { configChecks += 1; },
    loadEnvironment: async () => { loads += 1; return session; },
    build: async () => { builds += 1; throw new Error("must not build"); },
  });
  assert.equal(rejected.result.error.code, "social_invoker_untrusted");
  assert.deepEqual({ loads, builds, configChecks }, { loads: 0, builds: 0, configChecks: 0 });

  const alternate = await execute(["pool", "list", "--config", "/tmp/alternate-shortdrama.json"], {
    env: session,
    isTrustedSocialInvoker: () => true,
    socialConfigPath: SOCIAL_RUNTIME_CONFIG_PATH,
    loadEnvironment: async () => { loads += 1; return session; },
    build: async () => { builds += 1; throw new Error("must not build"); },
  });
  assert.equal(alternate.result.error.code, "social_config_invalid");
  assert.deepEqual({ loads, builds }, { loads: 0, builds: 0 });
});

test("Social runtime config is exact, regular, resolved, and non-symlinked", async () => {
  const root = await realpath(await mkdtemp(path.join(os.tmpdir(), "shortdrama-social-config-")));
  const expected = path.join(root, "shortdrama.runtime.json");
  await writeFile(expected, "{}\n");
  await assert.doesNotReject(assertSocialRuntimeConfig(expected, { expectedPath: expected }));
  await assert.rejects(assertSocialRuntimeConfig(path.join(root, "alternate.json"), { expectedPath: expected }),
    (error) => error.code === "social_config_invalid");
  const target = path.join(root, "target.json");
  await writeFile(target, "{}\n");
  await rm(expected);
  await symlink(target, expected);
  await assert.rejects(assertSocialRuntimeConfig(expected, { expectedPath: expected }),
    (error) => error.code === "social_config_invalid");
});

test("internal identity requires a private installation capability and old markers cannot spoof it", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "shortdrama-capability-"));
  const capabilityPath = path.join(root, "internal.capability");
  const capability = "8f".repeat(32);
  await writeFile(capabilityPath, `${capability}\n`, { mode: 0o600 });
  const command = parseCommand(["schedule", "tick"]);
  const env = { SHORTDRAMA_CAPABILITY_FILE: capabilityPath, SHORTDRAMA_INTERNAL_CAPABILITY: capability };
  assert.equal(resolveInvocationIdentity(command, env, { capabilityPath }).mode, "internal");
  assert.throws(() => resolveInvocationIdentity(command, INTERNAL, { capabilityPath }), (error) => error.code === "internal_context_required");
  assert.throws(() => resolveInvocationIdentity(command, { ...env, SHORTDRAMA_INTERNAL_CAPABILITY: "7e".repeat(32) }, { capabilityPath }),
    (error) => error.code === "internal_context_required");
  await chmod(capabilityPath, 0o644);
  assert.throws(() => resolveInvocationIdentity(command, env, { capabilityPath }), (error) => error.code === "internal_capability_invalid");
  await rm(capabilityPath);
  await writeFile(capabilityPath, `${"aa".repeat(80)}\n`, { mode: 0o600 });
  assert.throws(() => resolveInvocationIdentity(command, { ...env, SHORTDRAMA_INTERNAL_CAPABILITY: "aa".repeat(80) }, { capabilityPath }),
    (error) => error.code === "internal_capability_invalid");
  await rm(capabilityPath);
  const target = path.join(root, "target.capability");
  await writeFile(target, `${capability}\n`, { mode: 0o600 });
  await symlink(target, capabilityPath);
  assert.throws(() => resolveInvocationIdentity(command, env, { capabilityPath }), (error) => error.code === "internal_capability_invalid");
});

test("payload reader enforces root, no symlinks, size, and safe JSON", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "shortdrama-payload-"));
  await mkdir(path.join(root, "nested"));
  await writeFile(path.join(root, "nested", "ok.json"), JSON.stringify({ patch: { title: "ok" } }));
  assert.deepEqual(await readPayload(path.join(root, "nested", "ok.json"), { payloadRoot: root }), { patch: { title: "ok" } });
  await writeFile(path.join(root, "unsafe.json"), '{"__proto__":{"polluted":true}}');
  await symlink(path.join(root, "nested", "ok.json"), path.join(root, "link.json"));
  await symlink(path.join(root, "nested"), path.join(root, "linked-parent"));
  await assert.rejects(readPayload(path.join(root, "link.json"), { payloadRoot: root }), (error) => error.code === "payload_path_invalid");
  await assert.rejects(readPayload(path.join(root, "unsafe.json"), { payloadRoot: root }), (error) => error.code === "payload_invalid");
  await assert.rejects(readPayload(path.join(root, "linked-parent", "ok.json"), { payloadRoot: root }), (error) => error.code === "payload_path_invalid");
  await assert.rejects(readPayload("/etc/passwd", { payloadRoot: root }), (error) => error.code === "payload_path_invalid");
  assert.deepEqual(await readPayload("nested/ok.json", { payloadRoot: root }), { patch: { title: "ok" } });
});

test("payload reader binds validation and read to one nofollow descriptor", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "shortdrama-payload-race-"));
  const payload = path.join(root, "payload.json");
  const replacement = path.join(root, "replacement.json");
  await writeFile(payload, '{"safe":true}');
  await writeFile(replacement, '{"forged":true}');
  await assert.rejects(readPayload(payload, {
    payloadRoot: root,
    openFile: async (target, flags) => {
      await rm(target);
      await symlink(replacement, target);
      return open(target, flags);
    },
  }), (error) => error.code === "payload_path_invalid");
  await rm(payload);
  await writeFile(payload, '{"safe":true}');
  await assert.rejects(readPayload(payload, {
    payloadRoot: root,
    openFile: async (target, flags) => {
      await rm(target);
      await writeFile(target, '{"different":true}');
      return open(target, flags);
    },
  }), (error) => error.code === "payload_path_invalid");
});

test("migration evidence remains bound to independent expected digests", async () => {
  const suffix = `${process.pid}-${Date.now()}`;
  const manifest = { version: "fixture", rows: [{ value: 1 }] };
  manifest.sha256 = manifestDigest(manifest);
  const tampered = structuredClone(manifest);
  tampered.rows[0].value = 2;
  tampered.sha256 = manifestDigest(tampered);
  const name = `tampered-${suffix}.json`;
  const written = await writeMigrationArtifact(tampered, { fileName: name });
  try {
    let builds = 0;
    const result = await execute([
      "migrate", "apply", "--phase", "schema", "--manifest", name,
      "--expected-sha256", manifest.sha256, "--actor-id", "admin", "--confirm", "apply-now",
      "--config", "/configured/runtime.json",
    ], {
      env: {},
      loadEnvironment: passthroughEnvironment, isTrustedLocalInvoker: trustedLocalInvoker,
      build: async () => { builds += 1; throw new Error("must not build"); },
    });
    assert.equal(result.result.error.code, "migration_evidence_mismatch");
    assert.equal(builds, 0);
  } finally {
    await rm(written.path, { force: true });
  }
});

test("migration evidence has a bounded large-artifact limit independent from Social payloads", async () => {
  const suffix = `${process.pid}-${Date.now()}`;
  const name = `large-manifest-${suffix}.json`;
  const manifest = { version: "fixture", rows: [{ value: "x".repeat(2 * 1024 * 1024) }] };
  manifest.sha256 = manifestDigest(manifest);
  const written = await writeMigrationArtifact(manifest, { fileName: name });
  try {
    let builds = 0;
    const result = await execute([
      "migrate", "apply", "--phase", "schema", "--manifest", name,
      "--expected-sha256", "f".repeat(64), "--actor-id", "admin", "--confirm", "apply-now",
      "--config", "/configured/runtime.json",
    ], {
      env: {},
      loadEnvironment: passthroughEnvironment,
      isTrustedLocalInvoker: trustedLocalInvoker,
      build: async () => { builds += 1; throw new Error("must not build"); },
    });
    assert.equal(result.result.error.code, "migration_evidence_mismatch");
    assert.equal(builds, 0);
  } finally {
    await rm(written.path, { force: true });
  }
});

test("migration output is reserved before runtime side effects and stores the exact top-level value", async () => {
  const suffix = `${process.pid}-${Date.now()}`;
  const manifest = { version: "fixture", rows: [] };
  manifest.sha256 = manifestDigest(manifest);
  const manifestFile = await writeMigrationArtifact(manifest, { fileName: `plan-output-${suffix}.json` });
  const occupied = await writeMigrationArtifact({ occupied: true }, { fileName: `occupied-${suffix}.json` });
  const outputName = `verification-output-${suffix}.json`;
  let builds = 0;
  try {
    const blocked = await execute([
      "migrate", "verify", "--manifest", `plan-output-${suffix}.json`, "--output", `occupied-${suffix}.json`,
      "--actor-id", "admin", "--config", "/configured/runtime.json",
    ], { env: {}, loadEnvironment: passthroughEnvironment, isTrustedLocalInvoker: trustedLocalInvoker, build: async () => { builds += 1; throw new Error("must not build"); } });
    assert.equal(blocked.result.error.code, "migration_artifact_exists");
    assert.equal(builds, 0);
    const exact = { status: "verified", sha256: "c".repeat(64) };
    const completed = await execute([
      "migrate", "verify", "--manifest", `plan-output-${suffix}.json`, "--output", outputName,
      "--actor-id", "admin", "--config", "/configured/runtime.json",
    ], { env: {}, loadEnvironment: passthroughEnvironment, isTrustedLocalInvoker: trustedLocalInvoker, build: async () => ({
      config: { paths: { payloadRoot: "/tmp" }, auth: { isPrivilegedAllowed: () => true } },
      migrateVerify: async () => exact,
      close() {},
    }) });
    assert.equal(completed.result.sha256, exact.sha256);
    const outputPath = path.join(path.dirname(manifestFile.path), outputName);
    assert.deepEqual(JSON.parse(await readFile(outputPath, "utf8")), exact);
    await rm(outputPath, { force: true });
  } finally {
    await rm(manifestFile.path, { force: true });
    await rm(occupied.path, { force: true });
  }
});

test("migration plan stores the full manifest but returns only a bounded summary", async () => {
  const suffix = `${process.pid}-${Date.now()}`;
  const outputName = `plan-summary-${suffix}.json`;
  const manifest = {
    version: "shortdrama-migration/v2",
    accounts: [{ 账号ID: "account" }],
    dramas: [{ 剧ID: "SD-000001" }],
    captures: [{ "Post ID": "123" }],
    releases: [{ 发布ID: "SR-000001" }],
    schema_actions: [{ id: "field:账号台账:账号名" }],
    presentation_actions: [{ id: "view:账号台账:在用账号" }],
    counts: { accounts: 1, dramas: 1, captures: 1, releases: 1, blocked: 2, warnings: 2 },
    blocked: [{ code: "manual_post_not_found" }, { code: "manual_post_not_found" }],
    warnings: [{ code: "ambiguous_post_match" }, { code: "no_account_time_candidate" }],
  };
  manifest.sha256 = manifestDigest(manifest);
  const outputPath = path.join(path.dirname((await writeMigrationArtifact({ probe: true }, { fileName: `plan-summary-probe-${suffix}.json` })).path), outputName);
  const probePath = path.join(path.dirname(outputPath), `plan-summary-probe-${suffix}.json`);
  try {
    const completed = await execute([
      "migrate", "plan", "--expected-base-token", "base", "--output", outputName,
      "--actor-id", "admin", "--config", "/configured/runtime.json",
    ], {
      env: {},
      loadEnvironment: passthroughEnvironment,
      isTrustedLocalInvoker: trustedLocalInvoker,
      build: async () => ({
        config: { paths: { payloadRoot: "/tmp" }, auth: { isPrivilegedAllowed: () => true } },
        migratePlan: async () => manifest,
        close() {},
      }),
    });
    assert.deepEqual(completed.result, {
      status: "blocked",
      artifact_file: outputName,
      sha256: manifest.sha256,
      counts: manifest.counts,
      schema_actions: 1,
      presentation_actions: 1,
      blocked_by_code: { manual_post_not_found: 2 },
      warnings_by_code: { ambiguous_post_match: 1, no_account_time_candidate: 1 },
    });
    assert.deepEqual(JSON.parse(await readFile(outputPath, "utf8")), manifest);
  } finally {
    await rm(outputPath, { force: true });
    await rm(probePath, { force: true });
  }
});

test("migration plan without an output artifact fails before runtime and cannot leak a manifest", async () => {
  let builds = 0;
  const completed = await execute([
    "migrate", "plan", "--expected-base-token", "base",
    "--actor-id", "admin", "--config", "/configured/runtime.json",
  ], {
    env: {},
    loadEnvironment: passthroughEnvironment,
    isTrustedLocalInvoker: trustedLocalInvoker,
    build: async () => { builds += 1; throw new Error("must not build"); },
  });
  assert.equal(completed.result.error.code, "input_invalid");
  assert.equal(builds, 0);
});

test("buildRuntime wires renamed config allowlists into HumanOps and notifier", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "shortdrama-runtime-allowlists-"));
  const configPath = path.join(root, "runtime.json");
  const config = {
    schema_version: "shortdrama/v1", timezone: "Asia/Shanghai", source_spreadsheet_id: "sheet",
    paths: { env_file: ".env", metrics_sqlite: "metrics.sqlite", collector: "collector.mjs", collector_summary_dir: "summaries", ops_sqlite: "ops.sqlite", payload_root: "payloads" },
    base: { url: "https://base.example.com/base", app_token_env: "BASE", table_id_envs: { accounts: "TA", dramas: "TD", captures: "TC", releases: "TR" } },
    auth: { feishu_app_id_env: "APP", feishu_app_secret_env: "SECRET", google_service_account_path_env: "GOOGLE", operator_ids_env: "RENAMED_OPS", privileged_ids_env: "RENAMED_ADMINS", notification_chat_ids_env: "RENAMED_CHATS" },
    acceptance: { privileged_actor_id: "ou_admin" },
  };
  await writeFile(configPath, JSON.stringify(config));
  const observed = {};
  class HumanOpsFixture { constructor(args) { observed.operators = [...args.operators]; observed.privileged = [...args.privileged]; } }
  class NotifierFixture { constructor(args) { observed.chats = [...args.allowedChatIds]; } }
  const runtime = await buildRuntime({ configPath, command: parseCommand(["doctor", "--init-state", "--actor-id", "ou_admin"]), env: {
    BASE: "base", TA: "ta", TD: "td", TC: "tc", TR: "tr", APP: "app", SECRET: "secret", GOOGLE: path.join(root, "google.json"),
    RENAMED_OPS: "ou_a,ou_b", RENAMED_ADMINS: "ou_admin", RENAMED_CHATS: "oc_ops,oc_social", SHORTDRAMA_OPS_CHAT_ID: "oc_ops",
  }, services: { HumanOpsService: HumanOpsFixture, ShortDramaNotifier: NotifierFixture } });
  runtime.close();
  assert.deepEqual(observed, { operators: ["ou_a", "ou_b"], privileged: ["ou_admin"], chats: ["oc_ops", "oc_social"] });
});

test("runtime migration planning reads both SQLite accounts and posts", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "shortdrama-migration-sources-"));
  const { config, env } = runtimeFixture(root);
  const configPath = path.join(root, "runtime.json");
  await writeFile(configPath, JSON.stringify(config));
  const calls = [];
  const google = {
    revision: "google-evidence-v1:" + "a".repeat(64),
    raw_backup: {},
    accounts: [{ source_row: 2, 账号ID: "dramaexpedition", 账号名: "dramaexpedition", 主页链接: "https://www.tiktok.com/@dramaexpedition" }],
    dramas: [{ source_row: 2, 剧名: "Drama" }],
    releases: [],
    captures: [],
  };
  const sqliteAccount = {
    snapshot_date: "2026-09-01", captured_at: "2026-09-01T00:00:00Z",
    username: "dramaexpedition", account_url: "https://www.tiktok.com/@dramaexpedition",
    nickname: "Drama", followers: 1, following: 0, total_likes: 0, total_posts: 1,
    bio: "", collection_status: "complete",
  };
  const sqlitePost = {
    post_id: "99", username: "dramaexpedition",
    post_url: "https://www.tiktok.com/@dramaexpedition/video/99",
    snapshot_date: "2026-09-01", captured_at: "2026-09-01T00:00:00Z", published_at: null,
    views: 1, likes: 0, comments: 0, favorites: 0, shares: 0,
    collection_status: "complete", missing_fields: [],
  };
  class HumanOpsFixture {}
  class NotifierFixture {}
  const runtime = await buildRuntime({
    configPath,
    env,
    command: parseCommand(["doctor", "--init-state", "--actor-id", "ou_admin"]),
    services: {
      client: repositoryClient(),
      HumanOpsService: HumanOpsFixture,
      ShortDramaNotifier: NotifierFixture,
      readGoogleMigrationSource: async () => { calls.push("google"); return google; },
      source: {
        readLatestAccounts: () => { calls.push("accounts"); return [sqliteAccount]; },
        readLatestPosts: () => { calls.push("posts"); return [sqlitePost]; },
      },
      readMigrationSchema: async () => ({ revision: "empty", tables: [] }),
    },
  });
  try {
    const manifest = await runtime.migratePlan({}, {});
    assert.deepEqual(calls, ["google", "accounts", "posts"]);
    assert.equal(manifest.source_evidence.counts.sqlite_accounts, 1);
    assert.equal(manifest.source_evidence.counts.sqlite_posts, 1);
  } finally {
    runtime.close();
  }
});

test("Google service-account loader requires a private owned no-symlink strict credential", async () => {
  const root = await realpath(await mkdtemp(path.join(os.tmpdir(), "shortdrama-google-credential-")));
  const secure = path.join(root, "secure");
  await mkdir(secure);
  const file = path.join(secure, "service-account.json");
  const valid = {
    type: "service_account",
    client_email: "shortdrama@test-project.iam.gserviceaccount.com",
    private_key: "-----BEGIN PRIVATE KEY-----\nYWJj\n-----END PRIVATE KEY-----\n",
    token_uri: "https://oauth2.googleapis.com/token",
  };
  await writeFile(file, JSON.stringify(valid), { mode: 0o600 });
  assert.deepEqual(await readGoogleServiceAccount(file), valid);

  await chmod(file, 0o644);
  await assert.rejects(readGoogleServiceAccount(file), (error) => error.code === "google_source_invalid" && !JSON.stringify(error).includes(root));
  await chmod(file, 0o600);

  const link = path.join(root, "credential-link.json");
  await symlink(file, link);
  await assert.rejects(readGoogleServiceAccount(link), (error) => error.code === "google_source_invalid");
  const linkedParent = path.join(root, "linked-parent");
  await symlink(secure, linkedParent);
  await assert.rejects(readGoogleServiceAccount(path.join(linkedParent, "service-account.json")), (error) => error.code === "google_source_invalid");

  await writeFile(file, JSON.stringify({ ...valid, token_uri: "https://evil.example/token" }), { mode: 0o600 });
  await assert.rejects(readGoogleServiceAccount(file), (error) => error.code === "google_source_invalid");
  await writeFile(file, JSON.stringify({ ...valid, unexpected: "value" }), { mode: 0o600 });
  await assert.rejects(readGoogleServiceAccount(file), (error) => error.code === "google_source_invalid");
});

test("runtime terminal dashboard resolver verifies readback and never overwrites a newer terminal", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "shortdrama-dashboard-runtime-"));
  const { config, env } = runtimeFixture(root);
  const configPath = path.join(root, "runtime.json");
  await writeFile(configPath, JSON.stringify(config));
  const calls = [];
  const expectedText = "**最近一次同步终态**\n状态：partial\nrun_id：SDRUN-20260901-080001\n完成时间：2026-09-01T00:01:00.000Z";
  const client = repositoryClient({
    listDashboards: async () => ({ complete: true, items: [{ dashboard_id: "dash", name: "短剧发行管理仪表盘" }] }),
    listDashboardBlocks: async () => ({ complete: true, items: [{ block_id: "block", name: "最近一次同步终态" }] }),
    updateDashboardTerminalBlock: async (...args) => { calls.push(["update", ...args]); },
    readDashboardBlock: async () => ({ block_id: "block", name: "最近一次同步终态", type: "text", data_config: { text: expectedText } }),
  });
  let updateTerminalDashboard;
  class NotifierFixture { constructor(args) { updateTerminalDashboard = args.updateTerminalDashboard; } }
  class HumanOpsFixture {}
  const runtime = await buildRuntime({
    configPath, env, command: parseCommand(["doctor", "--init-state", "--actor-id", "ou_admin"]),
    services: { client, readSchema: async () => readySchema(env), NotifierFixture, ShortDramaNotifier: NotifierFixture, HumanOpsService: HumanOpsFixture },
  });
  try {
    await updateTerminalDashboard({
      state: "partial", run_id: "SDRUN-20260901-080001", finished_at: "2026-09-01T00:01:00.000Z",
    });
    assert.equal(calls.length, 1);
    assert.deepEqual(calls[0].slice(1, 4), ["base", "dash", "block"]);
    await updateTerminalDashboard({
      state: "failed", run_id: "SDRUN-20260901-075959", finished_at: "2026-08-31T23:59:59.000Z",
    });
    assert.equal(calls.length, 1);
  } finally { runtime.close(); }
});

test("runtime schema metadata rejects an unexpected unbound fifth Base table before field reads", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "shortdrama-extra-table-"));
  const { config, env } = runtimeFixture(root);
  const configPath = path.join(root, "runtime.json");
  await writeFile(configPath, JSON.stringify(config));
  let fieldReads = 0;
  const names = [
    [env.TA, "账号台账"], [env.TD, "选剧池"], [env.TC, "采集数据"], [env.TR, "发布记录"],
    ["tbl-default", "默认数据表"],
  ];
  const client = repositoryClient({
    listTables: async () => ({ complete: true, items: names.map(([table_id, name]) => ({ table_id, name })) }),
    listFields: async () => { fieldReads += 1; return { complete: true, revision: "r", items: [] }; },
  });
  class HumanOpsFixture {}
  class NotifierFixture {}
  const runtime = await buildRuntime({
    configPath, env, command: parseCommand(["doctor", "--init-state", "--actor-id", "ou_admin"]),
    services: { client, HumanOpsService: HumanOpsFixture, ShortDramaNotifier: NotifierFixture },
  });
  try {
    await assert.rejects(runtime.doctor({ initState: true, canary: false }), (error) => error.code === "base_schema_drift");
    assert.equal(fieldReads, 0);
  } finally { runtime.close(); }
});

test("runtime schema metadata marks the primary field from table detail", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "shortdrama-primary-detail-"));
  const { config, env } = runtimeFixture(root);
  const configPath = path.join(root, "runtime.json");
  await writeFile(configPath, JSON.stringify(config));
  const bindings = [
    [env.TA, "账号台账", "账号ID"],
    [env.TD, "选剧池", "剧ID"],
    [env.TC, "采集数据", "Post ID"],
    [env.TR, "发布记录", "发布ID"],
  ];
  const byId = new Map(bindings.map(([tableId, name, primary]) => [tableId, { name, primary }]));
  let detailReads = 0;
  const client = repositoryClient({
    listTables: async () => ({ complete: true, items: bindings.map(([table_id, name]) => ({ table_id, name })) }),
    getTable: async (_base, tableId) => {
      detailReads += 1;
      return {
        table_id: tableId,
        name: byId.get(tableId).name,
        primary_field: `fld-${tableId}-primary`,
      };
    },
    listFields: async (_base, tableId) => ({
      complete: true,
      revision: "r",
      items: [{ field_id: `fld-${tableId}-primary`, name: byId.get(tableId).primary, type: "text", style: { type: "plain" } }],
    }),
  });
  class HumanOpsFixture {}
  class NotifierFixture {}
  const runtime = await buildRuntime({
    configPath,
    env,
    command: parseCommand(["doctor", "--init-state", "--actor-id", "ou_admin"]),
    services: { client, HumanOpsService: HumanOpsFixture, ShortDramaNotifier: NotifierFixture },
  });
  try {
    const result = await runtime.doctor({ initState: true, canary: false });
    assert.equal(result.schema_status, "schema_missing");
    assert.equal(detailReads, 4);
  } finally { runtime.close(); }
});

test("runtime schema resolves live reverse-link IDs and ignores JSON object key order", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "shortdrama-live-schema-shape-"));
  const { config, env } = runtimeFixture(root);
  const configPath = path.join(root, "runtime.json");
  await writeFile(configPath, JSON.stringify(config));
  const schema = readySchema(env);
  const tableByName = new Map(schema.tables.map((table) => [table.name, table]));
  const field = (table, name) => tableByName.get(table).fields.find((item) => item.name === name);
  for (const [ownerTable, ownerField, reverseTable, reverseField] of [
    ["发布记录", "剧", "选剧池", "关联发布记录"],
    ["发布记录", "采集记录", "采集数据", "关联发布记录"],
  ]) {
    const owner = field(ownerTable, ownerField);
    const reverse = field(reverseTable, reverseField);
    delete owner.bidirectional_link_field_name;
    owner.bidirectional_link_field_id = reverse.field_id;
    reverse.bidirectional = true;
    reverse.bidirectional_link_field_id = owner.field_id;
  }
  const lookup = field("采集数据", "账号名");
  lookup.where = { conditions: lookup.where.conditions, logic: lookup.where.logic };
  const byId = new Map(schema.tables.map((table) => [table.table_id, table]));
  const client = repositoryClient({
    listTables: async () => ({ complete: true, items: schema.tables.map(({ table_id, name }) => ({ table_id, name })) }),
    getTable: async (_base, tableId) => {
      const table = byId.get(tableId);
      return { table_id: tableId, name: table.name, primary_field: table.fields.find((item) => item.is_primary).field_id };
    },
    listFields: async (_base, tableId) => ({ complete: true, revision: `r-${tableId}`, items: structuredClone(byId.get(tableId).fields) }),
  });
  class HumanOpsFixture {}
  class NotifierFixture {}
  const runtime = await buildRuntime({
    configPath,
    env,
    command: parseCommand(["doctor", "--init-state", "--actor-id", "ou_admin"]),
    services: { client, HumanOpsService: HumanOpsFixture, ShortDramaNotifier: NotifierFixture },
  });
  try {
    const result = await runtime.doctor({ initState: true, canary: false });
    assert.equal(result.schema_status, "ready");
  } finally {
    runtime.close();
  }
});

test("independent Base token mismatch fails before JobStore or Base network activity", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "shortdrama-base-target-"));
  const { config, env } = runtimeFixture(root);
  const configPath = path.join(root, "runtime.json");
  await writeFile(configPath, JSON.stringify(config));
  let network = 0;
  const client = repositoryClient({ listTables: async () => { network += 1; throw new Error("must not reach Base"); } });
  for (const argv of [
    ["doctor"],
    ["doctor", "--expected-base-token", "base-other"],
    ["migrate", "plan", "--expected-base-token", "base-other", "--output", "base-mismatch.json"],
  ]) {
    await assert.rejects(
      () => buildRuntime({ configPath, env, command: parseCommand(argv), services: { client } }),
      (error) => error.code === "base_target_mismatch",
    );
  }
  assert.equal(network, 0);
  await assert.rejects(access(path.join(root, "ops.sqlite")));
});

test("schema and verification artifacts dispatch as separate independently checked files", async () => {
  const suffix = `${process.pid}-${Date.now()}`;
  const manifest = { version: "fixture", rows: [] };
  manifest.sha256 = manifestDigest(manifest);
  const receipt = { version: "fixture-receipt", manifest_sha256: manifest.sha256 };
  receipt.sha256 = schemaReceiptDigest(receipt);
  const verification = { status: "verified", manifest_sha256: manifest.sha256 };
  verification.sha256 = verificationDigest(verification);
  const canary = {
    version: "shortdrama-canary-receipt/v1", status: "verified", manifest_sha256: manifest.sha256,
    base_binding_sha256: "b".repeat(64), schema_revision: "post", table_bindings_sha256: "c".repeat(64),
    proof: {}, generated_at: "2026-09-01T00:00:00.000Z",
  };
  canary.sha256 = canaryReceiptDigest(canary);
  const files = [];
  for (const [name, value] of [[`plan-${suffix}.json`, manifest], [`schema-${suffix}.json`, receipt], [`verification-${suffix}.json`, verification], [`canary-${suffix}.json`, canary]]) {
    files.push(await writeMigrationArtifact(value, { fileName: name }));
  }
  try {
    let observed;
    const byteHash = (await import("node:crypto")).createHash("sha256").update(await readFile(files[2].path)).digest("hex");
    const result = await execute([
      "migrate", "apply", "--phase", "sequences", "--manifest", `plan-${suffix}.json`,
      "--expected-sha256", manifest.sha256, "--schema-receipt", `schema-${suffix}.json`,
      "--expected-schema-receipt-sha256", receipt.sha256, "--canary-receipt", `canary-${suffix}.json`,
      "--expected-canary-sha256", canary.sha256, "--verification", `verification-${suffix}.json`,
      "--expected-verification-sha256", byteHash, "--actor-id", "admin", "--confirm", "apply-now",
      "--expected-base-token", "base", "--config", "/configured/runtime.json",
    ], {
      env: {},
      loadEnvironment: passthroughEnvironment,
      isTrustedLocalInvoker: trustedLocalInvoker,
      build: async () => ({
        config: { paths: { payloadRoot: "/tmp" }, auth: { isPrivilegedAllowed: () => true } },
        migrateApply: async (evidence) => { observed = evidence; return { status: "applied" }; },
        close() {},
      }),
    });
    assert.equal(result.exitCode, 0);
    assert.deepEqual(observed, { manifest, schemaReceipt: receipt, canaryReceipt: canary, verification });
  } finally {
    await Promise.all(files.map((file) => rm(file.path, { force: true })));
  }
});

test("data evidence requires independent canary and permission semantic/file digests before runtime", async () => {
  const suffix = `${process.pid}-${Date.now()}`;
  const manifest = { version: "fixture", rows: [] };
  manifest.sha256 = manifestDigest(manifest);
  const schema = { version: "fixture-schema", manifest_sha256: manifest.sha256 };
  schema.sha256 = schemaReceiptDigest(schema);
  const canary = {
    version: "shortdrama-canary-receipt/v1", status: "verified", manifest_sha256: manifest.sha256,
    base_binding_sha256: "b".repeat(64), schema_revision: "post", table_bindings_sha256: "c".repeat(64),
    proof: {}, generated_at: "2026-09-01T00:00:00.000Z",
  };
  canary.sha256 = canaryReceiptDigest(canary);
  const permission = {
    version: "shortdrama-permission-attestation/v1", base_binding_sha256: "b".repeat(64),
    schema_revision: "post", advanced_permissions_enabled: true,
    primary_and_machine_fields_protected: true, company_user_access_verified: true,
    checked_by: "ou_admin", checked_at: "2026-09-01T00:00:00.000Z",
  };
  permission.sha256 = permissionAttestationDigest(permission);
  const specs = [
    [`data-plan-${suffix}.json`, manifest], [`data-schema-${suffix}.json`, schema],
    [`data-canary-${suffix}.json`, canary], [`data-permission-${suffix}.json`, permission],
  ];
  const files = [];
  for (const [name, value] of specs) files.push(await writeMigrationArtifact(value, { fileName: name }));
  const permissionFileSha = createHash("sha256").update(await readFile(files[3].path)).digest("hex");
  const argv = [
    "migrate", "apply", "--phase", "data", "--manifest", specs[0][0], "--expected-sha256", manifest.sha256,
    "--schema-receipt", specs[1][0], "--expected-schema-receipt-sha256", schema.sha256,
    "--canary-receipt", specs[2][0], "--expected-canary-sha256", canary.sha256,
    "--permission-attestation", specs[3][0], "--expected-permission-attestation-sha256", permission.sha256,
    "--expected-permission-attestation-file-sha256", permissionFileSha,
    "--expected-base-token", "base", "--actor-id", "ou_admin", "--confirm", "apply-now",
    "--config", "/configured/runtime.json",
  ];
  try {
    let builds = 0;
    const wrong = [...argv];
    wrong[wrong.indexOf(permissionFileSha)] = "d".repeat(64);
    const rejected = await execute(wrong, {
      env: {}, loadEnvironment: passthroughEnvironment, isTrustedLocalInvoker: trustedLocalInvoker,
      build: async () => { builds += 1; throw new Error("must not build"); },
    });
    assert.equal(rejected.result.error.code, "migration_evidence_mismatch");
    assert.equal(builds, 0);
    let observed;
    const accepted = await execute(argv, {
      env: {}, loadEnvironment: passthroughEnvironment, isTrustedLocalInvoker: trustedLocalInvoker,
      build: async () => ({
        config: { paths: { payloadRoot: "/tmp" }, auth: { isPrivilegedAllowed: () => true } },
        migrateApply: async (evidence) => { observed = evidence; return { status: "applied" }; },
        close() {},
      }),
    });
    assert.equal(accepted.exitCode, 0);
    assert.deepEqual(observed, { manifest, schemaReceipt: schema, canaryReceipt: canary, permissionAttestation: permission });
  } finally {
    await Promise.all(files.map((file) => rm(file.path, { force: true })));
  }
});

test("offline permission helper writes an immutable artifact and prints independent semantic/file digests", async () => {
  const suffix = `${process.pid}-${Date.now()}`;
  const manifest = { version: "fixture", rows: [] };
  manifest.sha256 = manifestDigest(manifest);
  const schema = { version: "fixture-schema", manifest_sha256: manifest.sha256 };
  schema.sha256 = schemaReceiptDigest(schema);
  const observations = {
    version: "shortdrama-permission-observations/v1", observed_via: "lark-cli-user-readback",
    advanced_permissions_enabled: true, primary_and_machine_fields_protected: true,
    company_user_access_verified: true, checked_by: "ou_admin", checked_at: "2026-09-01T00:00:00.000Z",
  };
  const files = [
    await writeMigrationArtifact(manifest, { fileName: `attest-plan-${suffix}.json` }),
    await writeMigrationArtifact(schema, { fileName: `attest-schema-${suffix}.json` }),
    await writeMigrationArtifact(observations, { fileName: `attest-observations-${suffix}.json` }),
  ];
  const output = `attestation-${suffix}.json`;
  const observationsFileSha = createHash("sha256").update(await readFile(files[2].path)).digest("hex");
  const attestation = {
    version: "shortdrama-permission-attestation/v1", base_binding_sha256: "b".repeat(64), schema_revision: "post",
    advanced_permissions_enabled: true, primary_and_machine_fields_protected: true,
    company_user_access_verified: true, checked_by: "ou_admin", checked_at: observations.checked_at,
  };
  attestation.sha256 = permissionAttestationDigest(attestation);
  try {
    let observed;
    const result = await execute([
      "migrate", "attest-permissions", "--manifest", path.basename(files[0].path), "--expected-sha256", manifest.sha256,
      "--schema-receipt", path.basename(files[1].path), "--expected-schema-receipt-sha256", schema.sha256,
      "--observations", path.basename(files[2].path), "--expected-observations-file-sha256", observationsFileSha,
      "--output", output, "--expected-base-token", "base", "--actor-id", "ou_admin", "--config", "/configured/runtime.json",
    ], {
      env: {}, loadEnvironment: passthroughEnvironment, isTrustedLocalInvoker: trustedLocalInvoker,
      build: async () => ({
        config: { paths: { payloadRoot: "/tmp" }, auth: { isPrivilegedAllowed: () => true } },
        attestPermissions: async (payload, _options, identity) => { observed = { payload, identity }; return attestation; },
        close() {},
      }),
    });
    assert.equal(result.exitCode, 0);
    assert.equal(result.result.status, "created");
    assert.equal(result.result.artifact_file, output);
    assert.equal(result.result.semantic_sha256, attestation.sha256);
    assert.match(result.result.file_sha256, /^[a-f0-9]{64}$/);
    assert.deepEqual(observed.payload, { manifest, schemaReceipt: schema, observations });
    assert.equal(observed.identity.actorId, "ou_admin");
    assert.deepEqual(JSON.parse(await readFile(path.join(path.dirname(files[0].path), output), "utf8")), attestation);
  } finally {
    await Promise.all([...files.map((file) => file.path), path.join(path.dirname(files[0].path), output)].map((file) => rm(file, { force: true })));
  }
});

test("re-digested schema receipt tampering still fails against the external receipt digest", async () => {
  const suffix = `${process.pid}-${Date.now()}`;
  const manifest = { version: "fixture", rows: [] };
  manifest.sha256 = manifestDigest(manifest);
  const original = { version: "fixture-receipt", manifest_sha256: manifest.sha256, post_revision: "one" };
  original.sha256 = schemaReceiptDigest(original);
  const tampered = { ...original, post_revision: "two" };
  tampered.sha256 = schemaReceiptDigest(tampered);
  const files = [
    await writeMigrationArtifact(manifest, { fileName: `plan-${suffix}.json` }),
    await writeMigrationArtifact(tampered, { fileName: `schema-tampered-${suffix}.json` }),
  ];
  try {
    let builds = 0;
    const result = await execute([
      "migrate", "apply", "--phase", "data", "--manifest", `plan-${suffix}.json`, "--expected-sha256", manifest.sha256,
      "--schema-receipt", `schema-tampered-${suffix}.json`, "--expected-schema-receipt-sha256", original.sha256,
      "--actor-id", "admin", "--confirm", "apply-now", "--config", "/configured/runtime.json",
    ], { env: {}, loadEnvironment: passthroughEnvironment, isTrustedLocalInvoker: trustedLocalInvoker, build: async () => { builds += 1; throw new Error("must not build"); } });
    assert.equal(result.result.error.code, "migration_evidence_mismatch");
    assert.equal(builds, 0);
  } finally {
    await Promise.all(files.map((file) => rm(file.path, { force: true })));
  }
});

test("main emits exactly one JSON object and sanitizes absolute error paths", async () => {
  let output = "";
  let closed = 0;
  const code = await main(["sync", "status", "--run-id", "missing", "--config", "/configured/runtime.json"], {
    env: {}, loadEnvironment: passthroughEnvironment, stdout: { write: (value) => { output += value; } },
    build: async () => ({
      config: { paths: { payloadRoot: "/tmp" }, auth: {} },
      jobs: { get: () => null },
      close: () => { closed += 1; },
    }),
  });
  assert.equal(code, 1);
  assert.equal(output.trim().split("\n").length, 1);
  assert.equal(JSON.parse(output).state, "not_found");
  assert.equal(closed, 1);
  const failed = await execute(["doctor", "--actor-id", "ou_admin", "--config", "/configured/runtime.json"], {
    env: {}, loadEnvironment: passthroughEnvironment, isTrustedLocalInvoker: trustedLocalInvoker, build: async () => { throw new (await import("../src/errors.mjs")).ShortDramaError("config_invalid", "bad", { path: "/secret/local.json" }); },
  });
  assert.equal(failed.result.error.details.path, "[redacted]");
});

test("public error JSON redacts actor, chat, Base, table, record, path, and secret identifiers", async () => {
  const failed = await execute(["doctor", "--actor-id", "ou_admin", "--expected-base-token", "base_confirmed", "--config", "/configured/runtime.json"], {
    env: {},
    loadEnvironment: passthroughEnvironment,
    isTrustedLocalInvoker: trustedLocalInvoker,
    build: async () => { throw new (await import("../src/errors.mjs")).ShortDramaError("base_request_failed", "fixed", {
      actor: "ou_privateactor",
      user_id: "ou_privateuser",
      chat_id: "oc_privatechat",
      base_token: "base_private",
      app_token: "app_private",
      table: "tbl_private",
      table_id: "tbl_private2",
      record_id: "rec_private",
      path: "/Users/private/secret.json",
      field: "备注",
      nested: [{ target: "rec_nested" }, { table: "选剧池" }],
    }); },
  });
  const serialized = JSON.stringify(failed.result);
  for (const secret of ["ou_private", "oc_private", "base_private", "app_private", "tbl_private", "rec_private", "/Users/private"]) {
    assert.equal(serialized.includes(secret), false);
  }
  assert.equal(failed.result.error.details.field, "备注");
  assert.equal(failed.result.error.details.nested[1].table, "选剧池");
});

test("internal identity rejection happens before runtime construction", async () => {
  let builds = 0;
  const result = await execute(["queue", "drain", "--config", "/configured/runtime.json"], {
    env: {}, loadEnvironment: passthroughEnvironment, build: async () => { builds += 1; throw new Error("must not build"); },
  });
  assert.equal(result.result.error.code, "internal_context_required");
  assert.equal(builds, 0);
});

test("Beijing schedule and daily health are host timezone independent", () => {
  assert.equal(shouldEnqueueSchedule(new Date("2026-09-01T00:00:00Z"), []), true);
  assert.equal(shouldEnqueueSchedule(new Date("2026-09-01T00:09:59Z"), []), true);
  assert.equal(shouldEnqueueSchedule(new Date("2026-09-01T00:10:00Z"), []), false);
  assert.equal(shouldEnqueueSchedule(new Date("2026-09-01T00:00:00Z"), [{ trigger: "schedule", beijing_date: "2026-09-01" }]), false);
  assert.deepEqual(evaluateDailyHealth(new Date("2026-09-01T01:59:59Z"), []), { alert: false, reason: "before_health_window" });
  assert.deepEqual(evaluateDailyHealth(new Date("2026-09-01T02:00:00Z"), []), { alert: true, reason: "missing_terminal" });
  assert.deepEqual(evaluateDailyHealth(new Date("2026-09-01T02:00:00Z"), [{ state: "running", step: "collector", lease_expires_at: "x" }]), {
    alert: true, reason: "still_running", step: "collector", lease_expires_at: "x",
  });
  assert.deepEqual(evaluateDailyHealth(new Date("2026-09-01T02:00:00Z"), [{ state: "partial" }]), { alert: false, reason: "terminal_present" });
  assert.deepEqual(evaluateDailyHealth(new Date("2026-09-01T02:00:00Z"), [{ state: "failed" }]), { alert: true, reason: "failed_terminal" });
});

test("exit map makes partial and failed wake/status nonzero", () => {
  assert.equal(exitCodeFor({ status: "no_op" }), 0);
  assert.equal(exitCodeFor({ state: "partial" }), 2);
  assert.equal(exitCodeFor({ state: "not_found" }), 1);
  assert.equal(exitCodeFor({ state: "queued", error: { code: "worker_wakeup_failed" } }), 1);
});

test("dispatcher maps HumanOps methods and queue claims current PID only", async () => {
  const calls = [];
  const humanOps = new Proxy({}, { get: (_target, method) => async (request) => { calls.push([method, request]); return method === "query" ? [] : { status: "ok" }; } });
  const jobs = {
    claimNext: ({ workerPid }) => ({ run_id: "SDRUN-20260901-000001", worker_pid: workerPid }),
    listUndeliveredTerminal: () => [],
  };
  const dispatch = createDispatcher({ humanOps, jobs, workerPid: 4321, assertRuntimeSchemaReady: async () => {}, runWorker: async (_ctx, runId) => ({ state: "success", run_id: runId }) });
  const identity = { mode: "social", actorId: "ou", chatId: "oc", profile: "social" };
  await dispatch(parseCommand(["pool", "list"]), identity, null);
  assert.equal(calls[0][0], "query");
  const drained = await dispatch(parseCommand(["queue", "drain"]), { mode: "internal" }, null);
  assert.equal(drained.run_id, "SDRUN-20260901-000001");
});

test("dispatcher makes registry action and session identity authoritative over payload", async () => {
  let received;
  const humanOps = {
    previewMutation: async (request) => { received = request; return { status: "ok" }; },
    applyPreview: async () => ({ status: "ok" }),
  };
  const dispatch = createDispatcher({
    humanOps,
    assertRuntimeSchemaReady: async () => {},
    jobs: { peekSequenceState: () => ({ seeded: true }) },
  });
  await dispatch(parseCommand(["release", "attach-post", "--payload", "-"]), {
    mode: "social", actorId: "trusted", chatId: "persisted", profile: "social",
  }, { actorId: "forged", chatId: "forged", action: "create", key: "SR-000001", patch: {} });
  assert.equal(received.actorId, "trusted");
  assert.equal(received.chatId, "persisted");
  assert.equal(received.action, "attach-post");
});

test("queue drain retries every persisted terminal notification even when worker throws", async () => {
  let retries = 0;
  const dispatch = createDispatcher({
    jobs: {
      claimNext: () => ({ run_id: "SDRUN-20260901-000001" }),
      listUndeliveredTerminal: () => [{ run_id: "old", state: "failed" }],
    },
    workerPid: 9,
    now: () => new Date("2026-09-01T00:00:00Z"),
    runWorker: async () => { throw Object.assign(new Error("lost"), { code: "worker_claim_mismatch" }); },
    notifier: { sendTerminal: async () => { retries += 1; } },
  });
  await assert.rejects(dispatch(parseCommand(["queue", "drain"]), { mode: "internal" }, null),
    (error) => error.code === "worker_claim_mismatch");
  assert.equal(retries, 1);
});

test("daily health considers only the persisted scheduled job", async () => {
  let sent = 0;
  const dispatch = createDispatcher({
    now: () => new Date("2026-09-01T02:00:00Z"),
    opsChatId: "oc_ops",
    jobs: {
      listByBeijingDate: () => [{ trigger: "manual", state: "success" }],
      claimHealthAlert: () => true,
      markHealthAlert: () => {},
    },
    sendOpsHealth: async () => { sent += 1; },
  });
  const result = await dispatch(parseCommand(["schedule", "health"]), { mode: "internal" }, null);
  assert.equal(result.reason, "missing_terminal");
  assert.equal(sent, 1);
});

test("privileged migration and doctor canary are checked for Social actors", async () => {
  const runtime = {
    config: { auth: { isPrivilegedAllowed: (actor) => actor === "admin" } },
    doctor: async () => ({ status: "ready" }),
    migrateVerify: async () => ({ status: "verified" }),
  };
  const dispatch = createDispatcher(runtime);
  await assert.rejects(dispatch(parseCommand(["doctor", "--canary", "--expected-base-token", "base", "--manifest", "plan.json", "--expected-sha256", "a".repeat(64), "--output", "canary.json"]), { actorId: "operator" }, null),
    (error) => error.code === "privileged_required");
  await assert.rejects(dispatch(parseCommand(["migrate", "verify", "--manifest", "plan.json"]), { actorId: "operator" }, {}),
    (error) => error.code === "privileged_required");
});

test("manual synchronization is write-allowlisted while status remains readable", async () => {
  const runtime = {
    config: { auth: { isOperatorAllowed: () => false, isPrivilegedAllowed: () => false } },
    syncContext: {},
    assertRuntimeSchemaReady: async () => {},
  };
  const dispatch = createDispatcher(runtime);
  await assert.rejects(dispatch(parseCommand(["sync", "start"]), { actorId: "reader", chatId: "oc" }, null),
    (error) => error.code === "actor_write_denied");
});

test("wake adapter uses fixed non-k launchctl argv", async () => {
  const calls = [];
  await createWakeWorker({ uid: 501, spawnFile: async (...args) => { calls.push(args); return { code: 0 }; } })();
  assert.deepEqual(calls[0].slice(0, 2), ["/bin/launchctl", ["kickstart", "gui/501/com.gengrowth.shortdrama-sync"]]);
});

test("Feishu message adapter uses the fixed IM endpoint and allowlisted destination", async () => {
  let observed;
  const send = createFeishuMessageSender({
    tokenProvider: async () => "tenant-token",
    isChatAllowed: (chat) => chat === "oc_ops",
    fetchJson: async (url, options) => { observed = { url, options }; return { code: 0 }; },
  });
  await send({ chatId: "oc_ops", text: "terminal" });
  assert.equal(observed.url, "https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=chat_id");
  assert.deepEqual(JSON.parse(observed.options.body), {
    receive_id: "oc_ops", msg_type: "text", content: JSON.stringify({ text: "terminal" }),
  });
  await assert.rejects(send({ chatId: "oc_user", text: "x" }), (error) => error.code === "notification_target_denied");
});

test("same Beijing schedule date is durable even after the first job is terminal", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "shortdrama-schedule-"));
  const { JobStore } = await import("../src/job-store.mjs");
  const store = new JobStore(path.join(root, "ops.sqlite"));
  store.create({ runId: "SDRUN-20260901-080000", trigger: "schedule", chatId: "oc", now: "2026-09-01T00:00:00Z" });
  store.transition("SDRUN-20260901-080000", "running", { now: "2026-09-01T00:00:01Z" });
  store.transition("SDRUN-20260901-080000", "success", { now: "2026-09-01T00:00:02Z" });
  const second = store.enqueueIfIdle({ runId: "SDRUN-20260901-080500", trigger: "schedule", chatId: "oc", now: "2026-09-01T00:05:00Z" });
  assert.equal(second.created, false);
  assert.equal(second.job.run_id, "SDRUN-20260901-080000");
  store.close();
});

test("failed health delivery is persisted and becomes retryable, sent remains deduplicated", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "shortdrama-health-"));
  const { JobStore } = await import("../src/job-store.mjs");
  const store = new JobStore(path.join(root, "ops.sqlite"));
  const key = "missing-terminal:2026-09-01";
  assert.equal(store.claimHealthAlert(key, { ownerId: "owner-a", now: "2026-09-01T02:00:00Z", leaseSeconds: 60 }), true);
  store.markHealthAlert(key, "failed", { ownerId: "owner-a", now: "2026-09-01T02:00:01Z", error: "notification_delivery_failed" });
  assert.equal(store.claimHealthAlert(key, { ownerId: "owner-b", now: "2026-09-01T02:05:00Z", leaseSeconds: 60 }), true);
  store.markHealthAlert(key, "sent", { ownerId: "owner-b", now: "2026-09-01T02:05:01Z" });
  assert.equal(store.claimHealthAlert(key, { ownerId: "owner-c", now: "2026-09-01T02:10:00Z", leaseSeconds: 60 }), false);
  store.close();
});

test("health alert claims use expiring owner leases across connections", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "shortdrama-health-lease-"));
  const { JobStore } = await import("../src/job-store.mjs");
  const dbPath = path.join(root, "ops.sqlite");
  const first = new JobStore(dbPath);
  const second = new JobStore(dbPath);
  const key = "missing-terminal:2026-09-02";
  assert.equal(first.claimHealthAlert(key, { ownerId: "owner-a", now: "2026-09-02T02:00:00Z", leaseSeconds: 60 }), true);
  assert.equal(second.claimHealthAlert(key, { ownerId: "owner-b", now: "2026-09-02T02:00:30Z", leaseSeconds: 60 }), false);
  assert.equal(second.claimHealthAlert(key, { ownerId: "owner-b", now: "2026-09-02T02:01:01Z", leaseSeconds: 60 }), true);
  assert.throws(() => first.markHealthAlert(key, "sent", { ownerId: "owner-a", now: "2026-09-02T02:01:02Z" }),
    (error) => error.code === "health_alert_claim_mismatch");
  second.markHealthAlert(key, "sent", { ownerId: "owner-b", now: "2026-09-02T02:01:02Z" });
  assert.equal(first.claimHealthAlert(key, { ownerId: "owner-c", now: "2026-09-02T02:02:30Z", leaseSeconds: 60 }), false);
  first.close();
  second.close();
});

test("legacy claimed health rows migrate into a reclaimable failed state", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "shortdrama-health-migration-"));
  const dbPath = path.join(root, "ops.sqlite");
  const bootstrap = new DatabaseSync(dbPath);
  bootstrap.exec("CREATE TABLE health_alerts(alert_key TEXT PRIMARY KEY, state TEXT NOT NULL, created_at TEXT NOT NULL, sent_at TEXT, error TEXT NOT NULL)");
  bootstrap.prepare("INSERT INTO health_alerts VALUES (?, 'claimed', ?, NULL, '')").run("missing-terminal:2026-09-03", "2026-09-03T02:00:00.000Z");
  bootstrap.close();
  const { JobStore } = await import("../src/job-store.mjs");
  const store = new JobStore(dbPath);
  assert.equal(store.claimHealthAlert("missing-terminal:2026-09-03", { ownerId: "new-owner", now: "2026-09-03T03:00:00Z", leaseSeconds: 60 }), true);
  store.close();
});

test("doctor JobStore mode is read-only and peek never creates the sequence table", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "shortdrama-doctor-"));
  const { JobStore } = await import("../src/job-store.mjs");
  const dbPath = path.join(root, "ops.sqlite");
  new JobStore(dbPath).close();
  const doctorStore = new JobStore(dbPath, { readOnly: true });
  assert.deepEqual(doctorStore.peekSequenceState(), { seeded: false, drama_next: null, release_next: null });
  assert.equal(doctorStore.db.prepare("SELECT 1 FROM sqlite_master WHERE name='id_sequences'").get(), undefined);
  doctorStore.close();
  const missing = path.join(root, "missing.sqlite");
  assert.throws(() => new JobStore(missing, { readOnly: true }));
  await assert.rejects(access(missing));
});

test("collector adapter trusts only fresh same-run summary evidence", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "shortdrama-collector-"));
  const collector = path.join(root, "collector.mjs");
  const sqlite = path.join(root, "metrics.sqlite");
  await writeFile(collector, "// fixture\n");
  const db = new DatabaseSync(sqlite);
  db.exec("CREATE TABLE runs(run_id TEXT PRIMARY KEY); INSERT INTO runs VALUES ('collector-uuid')");
  db.close();
  let spawnCall;
  const adapter = createCollectorAdapter({
    nodePath: process.execPath, collectorPath: collector, collectorCwd: root,
    summaryDir: root, metricsSqlitePath: sqlite,
    now: () => new Date("2026-09-01T00:00:00Z"),
    spawnFile: async (...args) => {
      spawnCall = args;
      await writeFile(path.join(root, "capture_summary_2026-09-01.json"), JSON.stringify({
        capture_date: "2026-09-01", captured_at: "2026-09-01T00:00:01Z", run_id: "collector-uuid",
        files: { sqlite }, status: "success", errors: [],
      }));
      return { code: 0 };
    },
  });
  const result = await adapter({ runId: "SDRUN-20260901-000001", beijingDate: "2026-09-01", signal: new AbortController().signal });
  assert.equal(result.run_id, "SDRUN-20260901-000001");
  assert.equal(result.collector_run_id, "collector-uuid");
  assert.equal(result.sqlite_path, sqlite);
  assert.deepEqual(spawnCall.slice(0, 2), [process.execPath, [collector]]);
  assert.equal(spawnCall[2].cwd, root);
  assert.equal(spawnCall[2].shell, false);
  assert.equal(spawnCall[2].detached, false);
  assert.ok(spawnCall[2].signal instanceof AbortSignal);
});

test("collector adapter rejects an unchanged stale summary before SQLite projection", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "shortdrama-stale-"));
  const collector = path.join(root, "collector.mjs");
  const sqlite = path.join(root, "metrics.sqlite");
  const summary = path.join(root, "capture_summary_2026-09-01.json");
  await writeFile(collector, "// fixture\n");
  const db = new DatabaseSync(sqlite);
  db.exec("CREATE TABLE runs(run_id TEXT PRIMARY KEY); INSERT INTO runs VALUES ('old-run')");
  db.close();
  await writeFile(summary, JSON.stringify({ capture_date: "2026-09-01", captured_at: "2026-09-01T01:00:00Z", run_id: "old-run", files: { sqlite }, errors: [] }));
  const adapter = createCollectorAdapter({
    nodePath: process.execPath, collectorPath: collector, collectorCwd: root, summaryDir: root,
    metricsSqlitePath: sqlite, now: () => new Date("2026-09-01T00:00:00Z"), spawnFile: async () => ({ code: 0 }),
  });
  await assert.rejects(adapter({ runId: "SDRUN-20260901-000001", beijingDate: "2026-09-01" }),
    (error) => error.code === "capture_failed");
});
