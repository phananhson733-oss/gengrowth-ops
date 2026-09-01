import assert from "node:assert/strict";
import { access, mkdtemp, mkdir, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { DatabaseSync } from "node:sqlite";

import {
  createCollectorAdapter,
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
  shouldEnqueueSchedule,
} from "../shortdrama_ctl.mjs";

const INTERNAL = {
  SHORTDRAMA_INTERNAL_MARKER: "launchd:com.gengrowth.shortdrama-sync",
  SHORTDRAMA_LAUNCHD_LABEL: "com.gengrowth.shortdrama-sync",
};

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

test("every public and internal registry path parses with only its fixed shape", () => {
  const commands = [
    ["doctor"], ["migrate", "plan"], ["migrate", "apply", "--phase", "schema"], ["migrate", "verify", "--payload", "-"],
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
  assert.throws(() => resolveInvocationIdentity(parseCommand(["migrate", "apply", "--phase", "schema"]), {}),
    (error) => error.code === "actor_required");
  assert.deepEqual(resolveInvocationIdentity(parseCommand([
    "migrate", "apply", "--phase", "schema", "--actor-id", "ou_admin",
  ]), {}, { isPrivilegedAllowed: (id) => id === "ou_admin" }), {
    mode: "local", actorId: "ou_admin", chatId: null, profile: null,
  });
  assert.throws(() => resolveInvocationIdentity(parseCommand(["schedule", "tick"]), {}),
    (error) => error.code === "internal_context_required");
  assert.equal(resolveInvocationIdentity(parseCommand(["schedule", "tick"]), INTERNAL).mode, "internal");
  assert.throws(() => resolveInvocationIdentity(parseCommand(["pool", "list", "--actor-id", "ou"]), {}),
    (error) => error.code === "social_session_required");
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
  await assert.rejects(dispatch(parseCommand(["migrate", "verify", "--payload", "-"]), { actorId: "operator" }, {}),
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
  assert.equal(store.claimHealthAlert(key, "2026-09-01T02:00:00Z"), true);
  store.markHealthAlert(key, "failed", { now: "2026-09-01T02:00:01Z", error: "notification_delivery_failed" });
  assert.equal(store.claimHealthAlert(key, "2026-09-01T02:05:00Z"), true);
  store.markHealthAlert(key, "sent", { now: "2026-09-01T02:05:01Z" });
  assert.equal(store.claimHealthAlert(key, "2026-09-01T02:10:00Z"), false);
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
