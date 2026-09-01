import assert from "node:assert/strict";
import { access, chmod, mkdtemp, mkdir, open, readFile, rm, symlink, writeFile } from "node:fs/promises";
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
  parseCommand,
  main,
  readPayload,
  resolveInvocationIdentity,
  runBaseCanary,
  shouldEnqueueSchedule,
} from "../shortdrama_ctl.mjs";
import { manifestDigest, schemaReceiptDigest, verificationDigest, writeMigrationArtifact } from "../src/migration.mjs";
import { fixedFieldDescriptor } from "../src/feishu-client.mjs";
import { BASE_FIELD_SPECS, TABLE_ORDER, TABLES } from "../src/schema.mjs";

const INTERNAL = {
  SHORTDRAMA_INTERNAL_MARKER: "launchd:com.gengrowth.shortdrama-sync",
  SHORTDRAMA_LAUNCHD_LABEL: "com.gengrowth.shortdrama-sync",
};

function runtimeFixture(root) {
  const config = {
    schema_version: "shortdrama/v1", timezone: "Asia/Shanghai", source_spreadsheet_id: "sheet",
    paths: { metrics_sqlite: "metrics.sqlite", collector: "collector.mjs", collector_summary_dir: "summaries", ops_sqlite: "ops.sqlite", payload_root: "payloads" },
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
    ["exec", "rm", "-rf"], ["pool", "delete"], ["sync"], ["doctor", "extra"],
    ["pool", "list", "--wat", "x"], ["sync", "status", "--run-id", "a", "--run-id", "b"],
  ]) assert.throws(() => parseCommand(argv), (error) => ["command_not_allowed", "input_invalid"].includes(error.code));
});

test("doctor state initialization is explicit privileged local-only", () => {
  const command = parseCommand(["doctor", "--init-state", "--actor-id", "ou_admin"]);
  assert.equal(command.options.initState, true);
  assert.deepEqual(resolveInvocationIdentity(command, {}, { isPrivilegedAllowed: (id) => id === "ou_admin" }), {
    mode: "local", actorId: "ou_admin", chatId: null, profile: null,
  });
  assert.throws(() => resolveInvocationIdentity(command, {
    HERMES_SESSION_PLATFORM: "feishu", HERMES_SESSION_PROFILE: "social",
    HERMES_SESSION_USER_ID: "ou_admin", HERMES_SESSION_CHAT_ID: "oc_social",
  }), (error) => error.code === "local_only_required");
  assert.throws(() => resolveInvocationIdentity(command, {
    SHORTDRAMA_CAPABILITY_FILE: "/tmp/internal.capability", SHORTDRAMA_INTERNAL_CAPABILITY: "aa".repeat(32),
  }, { isPrivilegedAllowed: () => true }), (error) => error.code === "local_only_required");
  assert.throws(() => resolveInvocationIdentity(parseCommand(["doctor", "--init-state"]), {}),
    (error) => error.code === "actor_required");
});

test("internal scheduler context cannot initialize state before runtime construction", async () => {
  let builds = 0;
  const result = await execute(["doctor", "--init-state", "--actor-id", "ou_admin", "--config", "/configured/runtime.json"], {
    env: { SHORTDRAMA_CAPABILITY_FILE: "/tmp/internal.capability", SHORTDRAMA_INTERNAL_CAPABILITY: "aa".repeat(32) },
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
    configPath, env, command: parseCommand(["doctor"]), services: { client, readSchema: async () => ({ complete: true, revision: "empty", tables: [] }) },
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
  assert.equal(initialized.status, "schema_missing");
  const db = new DatabaseSync(dbPath, { readOnly: true });
  assert.equal(db.prepare("SELECT 1 FROM sqlite_master WHERE name='jobs'").get()["1"], 1);
  assert.equal(db.prepare("SELECT 1 FROM sqlite_master WHERE name='id_sequences'").get(), undefined);
  db.close();
  const normal = await buildRuntime({
    configPath, env, command: parseCommand(["doctor"]),
    services: { client, readSchema: async () => ({ complete: true, revision: "empty", tables: [] }) },
  });
  assert.equal((await normal.doctor({ initState: false, canary: false })).status, "schema_missing");
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
    configPath, env, command: parseCommand(["doctor", "--canary", "--actor-id", "ou_admin"]),
    services: { client, readSchema: async () => readySchema(env), makeCanaryId: () => "CANARY-SDRUN-20260901-120000-A1B2" },
  });
  const result = await runtime.doctor({ initState: false, canary: true });
  runtime.close();
  assert.equal(result.status, "canary_verified");
  assert.equal(result.canary.status, "verified");
  assert.equal(result.sequence.seeded, false);
  assert.deepEqual(calls, [
    ...TABLE_ORDER.map((name) => ["create", name]),
    ...TABLE_ORDER.map((name) => ["delete", name]),
  ]);
  assert.equal([...rows.values()].every((items) => items.length === 1 && items[0].record_id.startsWith("existing-")), true);
});

test("canary cleanup failure is manual-repair terminal and never verified", async () => {
  const tableIds = { accounts: "ta", dramas: "td", captures: "tc", releases: "tr" };
  const tableNameById = new Map([["ta", "账号台账"], ["td", "选剧池"], ["tc", "采集数据"], ["tr", "发布记录"]]);
  const rows = new Map([...tableNameById.keys()].map((id) => [id, []]));
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
  }), (error) => error.code === "canary_cleanup_failed" && error.details.next_step === "manual_repair");
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
    ["doctor"], ["migrate", "plan"], ["migrate", "apply", "--phase", "schema", "--manifest", "plan.json", "--expected-sha256", "a".repeat(64)], ["migrate", "verify", "--manifest", "plan.json"],
    ["pool", "list"], ["pool", "get", "--key", "SD-000001"], ["pool", "create"], ["pool", "preview-update"],
    ["pool", "apply-update"], ["pool", "preview-archive", "--key", "SD-000001"], ["pool", "apply-archive"],
    ["release", "list"], ["release", "get", "--key", "SR-000001"], ["release", "schedule"],
    ["release", "preview-update"], ["release", "apply-update"], ["release", "attach-post"],
    ["metrics", "by-drama"], ["metrics", "by-account"], ["sync", "start"], ["sync", "status", "--run-id", "run"],
    ["schedule", "tick"], ["schedule", "health"], ["queue", "drain"],
  ];
  for (const argv of commands) assert.equal(parseCommand(argv).group, argv[0]);
  assert.throws(() => parseCommand(["queue", "drain", "--run-id", "forged"]), (error) => error.code === "input_invalid");
  assert.throws(() => parseCommand(["schedule", "tick", "--actor-id", "forged"]), (error) => error.code === "input_invalid");
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
  ]), {}, { isPrivilegedAllowed: (id) => id === "ou_admin" }), {
    mode: "local", actorId: "ou_admin", chatId: null, profile: null,
  });
  assert.throws(() => resolveInvocationIdentity(parseCommand(["schedule", "tick"]), {}),
    (error) => error.code === "internal_context_required");
  assert.throws(() => resolveInvocationIdentity(parseCommand(["schedule", "tick"]), INTERNAL),
    (error) => error.code === "internal_context_required");
  assert.throws(() => resolveInvocationIdentity(parseCommand(["pool", "list", "--actor-id", "ou"]), {}),
    (error) => error.code === "social_session_required");
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
    ], { env: {}, build: async () => { builds += 1; throw new Error("must not build"); } });
    assert.equal(blocked.result.error.code, "migration_artifact_exists");
    assert.equal(builds, 0);
    const exact = { status: "verified", sha256: "c".repeat(64) };
    const completed = await execute([
      "migrate", "verify", "--manifest", `plan-output-${suffix}.json`, "--output", outputName,
      "--actor-id", "admin", "--config", "/configured/runtime.json",
    ], { env: {}, build: async () => ({
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

test("buildRuntime wires renamed config allowlists into HumanOps and notifier", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "shortdrama-runtime-allowlists-"));
  const configPath = path.join(root, "runtime.json");
  const config = {
    schema_version: "shortdrama/v1", timezone: "Asia/Shanghai", source_spreadsheet_id: "sheet",
    paths: { metrics_sqlite: "metrics.sqlite", collector: "collector.mjs", collector_summary_dir: "summaries", ops_sqlite: "ops.sqlite", payload_root: "payloads" },
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

test("schema and verification artifacts dispatch as separate independently checked files", async () => {
  const suffix = `${process.pid}-${Date.now()}`;
  const manifest = { version: "fixture", rows: [] };
  manifest.sha256 = manifestDigest(manifest);
  const receipt = { version: "fixture-receipt", manifest_sha256: manifest.sha256 };
  receipt.sha256 = schemaReceiptDigest(receipt);
  const verification = { status: "verified", manifest_sha256: manifest.sha256 };
  verification.sha256 = verificationDigest(verification);
  const files = [];
  for (const [name, value] of [[`plan-${suffix}.json`, manifest], [`schema-${suffix}.json`, receipt], [`verification-${suffix}.json`, verification]]) {
    files.push(await writeMigrationArtifact(value, { fileName: name }));
  }
  try {
    let observed;
    const byteHash = (await import("node:crypto")).createHash("sha256").update(await readFile(files[2].path)).digest("hex");
    const result = await execute([
      "migrate", "apply", "--phase", "sequences", "--manifest", `plan-${suffix}.json`,
      "--expected-sha256", manifest.sha256, "--schema-receipt", `schema-${suffix}.json`,
      "--expected-schema-receipt-sha256", receipt.sha256, "--verification", `verification-${suffix}.json`,
      "--expected-verification-sha256", byteHash, "--actor-id", "admin", "--confirm", "apply-now",
      "--config", "/configured/runtime.json",
    ], {
      env: {},
      build: async () => ({
        config: { paths: { payloadRoot: "/tmp" }, auth: { isPrivilegedAllowed: () => true } },
        migrateApply: async (evidence) => { observed = evidence; return { status: "applied" }; },
        close() {},
      }),
    });
    assert.equal(result.exitCode, 0);
    assert.deepEqual(observed, { manifest, schemaReceipt: receipt, verification });
  } finally {
    await Promise.all(files.map((file) => rm(file.path, { force: true })));
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
    ], { env: {}, build: async () => { builds += 1; throw new Error("must not build"); } });
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
    env: {}, stdout: { write: (value) => { output += value; } },
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
  const failed = await execute(["doctor", "--config", "/configured/runtime.json"], {
    env: {}, build: async () => { throw new (await import("../src/errors.mjs")).ShortDramaError("config_invalid", "bad", { path: "/secret/local.json" }); },
  });
  assert.equal(failed.result.error.details.path, "[redacted]");
});

test("internal identity rejection happens before runtime construction", async () => {
  let builds = 0;
  const result = await execute(["queue", "drain", "--config", "/configured/runtime.json"], {
    env: {}, build: async () => { builds += 1; throw new Error("must not build"); },
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
  const humanOps = new Proxy({}, { get: (_target, method) => async (request) => { calls.push([method, request]); return { status: "ok" }; } });
  const jobs = {
    claimNext: ({ workerPid }) => ({ run_id: "SDRUN-20260901-000001", worker_pid: workerPid }),
    listUndeliveredTerminal: () => [],
  };
  const dispatch = createDispatcher({ humanOps, jobs, workerPid: 4321, runWorker: async (_ctx, runId) => ({ state: "success", run_id: runId }) });
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
  await assert.rejects(dispatch(parseCommand(["doctor", "--canary"]), { actorId: "operator" }, null),
    (error) => error.code === "privileged_required");
  await assert.rejects(dispatch(parseCommand(["migrate", "verify", "--manifest", "plan.json"]), { actorId: "operator" }, {}),
    (error) => error.code === "privileged_required");
});

test("manual synchronization is write-allowlisted while status remains readable", async () => {
  const runtime = {
    config: { auth: { isOperatorAllowed: () => false, isPrivilegedAllowed: () => false } },
    syncContext: {},
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
