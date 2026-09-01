import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { DatabaseSync } from "node:sqlite";
import { Worker } from "node:worker_threads";

import {
  allocateBusinessId,
  makeRunId,
  peekNextBusinessId,
  seedBusinessIdSequence,
} from "../src/ids.mjs";
import { JobStore } from "../src/job-store.mjs";

const JOB_STORE_URL = new URL("../src/job-store.mjs", import.meta.url).href;
const IDS_URL = new URL("../src/ids.mjs", import.meta.url).href;

function runConcurrentFileOperations(operation, dbPath) {
  const gate = new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT);
  const workerSource = String.raw`
    const { parentPort, workerData } = require("node:worker_threads");

    (async () => {
      const gate = new Int32Array(workerData.gate);
      let resource;
      try {
        if (workerData.operation === "sequence") {
          const { DatabaseSync } = require("node:sqlite");
          resource = new DatabaseSync(workerData.dbPath);
        } else {
          const { JobStore } = await import(workerData.jobStoreUrl);
          resource = new JobStore(workerData.dbPath);
        }
        parentPort.postMessage({ type: "ready", slot: workerData.slot });
        Atomics.wait(gate, 0, 0);

        let value;
        if (workerData.operation === "claim") {
          value = resource.claimNext({
            workerPid: 101 + workerData.slot,
            now: "2026-09-01T00:00:00Z",
          })?.worker_pid ?? null;
        } else if (workerData.operation === "preview") {
          value = resource.consumePreview("sdp_two_connections", {
            actorId: "ou_operator",
            chatId: "oc_social",
            beforeHash: "before",
            now: "2026-09-01T00:01:00Z",
          }).used_at;
        } else if (workerData.operation === "sequence") {
          const { allocateBusinessId } = await import(workerData.idsUrl);
          value = allocateBusinessId(resource, "drama");
        } else if (workerData.operation === "health") {
          value = resource.claimHealthAlert(
            "missing-terminal:2026-09-01",
            { ownerId: "worker-owner-" + workerData.slot, now: "2026-09-01T02:00:00Z", leaseSeconds: 120 }
          );
        } else if (workerData.operation === "mutationLease") {
          value = resource.acquireMutationLease({
            lockKey: "human-base:worker-test",
            ownerId: "worker-owner-" + workerData.slot,
            now: "2026-09-01T00:00:00Z",
            leaseSeconds: 300,
          })?.owner_id ?? null;
        }
        parentPort.postMessage({ type: "result", slot: workerData.slot, value });
      } catch (error) {
        parentPort.postMessage({
          type: "result",
          slot: workerData.slot,
          error: { code: error.code, message: error.message },
        });
      } finally {
        resource?.close();
      }
    })();
  `;

  return new Promise((resolve, reject) => {
    const results = new Array(2);
    let ready = 0;
    let completed = 0;
    const workers = [0, 1].map((slot) => new Worker(workerSource, {
      eval: true,
      workerData: { operation, dbPath, gate, slot, jobStoreUrl: JOB_STORE_URL, idsUrl: IDS_URL },
    }));
    for (const worker of workers) {
      worker.on("message", (message) => {
        if (message.type === "ready") {
          ready += 1;
          if (ready === workers.length) {
            Atomics.store(new Int32Array(gate), 0, 1);
            Atomics.notify(new Int32Array(gate), 0, workers.length);
          }
          return;
        }
        results[message.slot] = message.error ? { error: message.error } : { value: message.value };
        completed += 1;
        if (completed === workers.length) resolve(results);
      });
      worker.on("error", reject);
      worker.on("exit", (code) => {
        if (code !== 0 && completed < workers.length) reject(new Error(`worker exited with code ${code}`));
      });
    }
  });
}

test("business IDs are monotonic and readable", () => {
  const db = new DatabaseSync(":memory:");
  assert.equal(allocateBusinessId(db, "drama"), "SD-000001");
  assert.equal(allocateBusinessId(db, "drama"), "SD-000002");
  assert.equal(allocateBusinessId(db, "release"), "SR-000001");
  db.close();
});

test("migration seed is monotonic while peek does not consume an ID", () => {
  const db = new DatabaseSync(":memory:");
  seedBusinessIdSequence(db, "drama", 16);
  seedBusinessIdSequence(db, "drama", 12);
  seedBusinessIdSequence(db, "release", 71);
  assert.equal(peekNextBusinessId(db, "drama"), "SD-000017");
  assert.equal(peekNextBusinessId(db, "drama"), "SD-000017");
  assert.equal(peekNextBusinessId(db, "release"), "SR-000072");
  assert.equal(allocateBusinessId(db, "drama"), "SD-000017");
  db.close();
});

test("business ID helpers reject unknown kinds and invalid seeds", () => {
  const db = new DatabaseSync(":memory:");
  assert.throws(() => allocateBusinessId(db, "account"), (error) => error.code === "business_id_kind_invalid");
  assert.throws(() => seedBusinessIdSequence(db, "drama", -1), (error) => error.code === "business_id_seed_invalid");
  db.close();
});

test("run IDs use Beijing wall time", () => {
  assert.equal(makeRunId(new Date("2026-09-01T00:00:01Z")), "SDRUN-20260901-080001");
  assert.equal(makeRunId(new Date("2026-08-31T16:00:01Z")), "SDRUN-20260901-000001");
});

test("jobs follow the state machine and terminal notification is independent", () => {
  const store = new JobStore(":memory:");
  const job = store.create({
    runId: "SDRUN-20260901-080001",
    trigger: "manual",
    actorId: "ou_test",
    chatId: "oc_test",
    now: "2026-09-01T00:00:00Z",
  });
  assert.deepEqual(store.listActive().map((row) => row.run_id), [job.run_id]);
  store.transition(job.run_id, "running", { step: "collector", now: "2026-09-01T00:00:01Z" });
  const success = store.transition(job.run_id, "success", {
    counters: { accounts_updated: 11 },
    now: "2026-09-01T00:00:02Z",
  });
  assert.equal(success.finished_at, "2026-09-01T00:00:02.000Z");
  assert.deepEqual(success.counters, { accounts_updated: 11 });
  assert.deepEqual(store.listActive(), []);
  assert.throws(() => store.transition(job.run_id, "failed", {}), /terminal/);
  assert.deepEqual(store.listUndeliveredTerminal().map((row) => row.run_id), [job.run_id]);
  store.markNotification(job.run_id, "failed", "network");
  assert.equal(store.get(job.run_id).state, "success");
  assert.equal(store.get(job.run_id).notification_state, "failed");
  store.markNotification(job.run_id, "sent");
  assert.deepEqual(store.listUndeliveredTerminal(), []);
  store.close();
});

test("audit events preserve before, after, and readback JSON", () => {
  const store = new JobStore(":memory:");
  const event = store.appendAudit({
    runId: "run-audit",
    actorId: "ou_operator",
    action: "update",
    targetTable: "选剧池",
    targetKey: "SD-000001",
    before: { 推荐理由: "旧" },
    after: { 推荐理由: "新" },
    readback: { 推荐理由: "新" },
    now: "2026-09-01T00:00:00Z",
  });
  assert.equal(event.event_id, 1);
  assert.deepEqual(event.before, { 推荐理由: "旧" });
  assert.deepEqual(event.after, { 推荐理由: "新" });
  assert.deepEqual(event.readback, { 推荐理由: "新" });
  store.close();
});

test("preview receipt is actor, chat, hash, expiry, and single-use bound", () => {
  const store = new JobStore(":memory:");
  const receipt = store.createPreview({
    receiptId: "sdp_test",
    actorId: "ou_operator",
    chatId: "oc_social",
    action: "update",
    targetTable: "选剧池",
    targetKey: "SD-000001",
    beforeHash: "before",
    patch: { 推荐理由: "人工补充" },
    now: "2026-09-01T00:00:00Z",
  });
  assert.equal(receipt.expires_at, "2026-09-01T00:15:00.000Z");
  assert.deepEqual(store.getPreview(receipt.receipt_id).patch, { 推荐理由: "人工补充" });
  assert.throws(
    () => store.consumePreview(receipt.receipt_id, {
      actorId: "ou_other",
      chatId: "oc_social",
      beforeHash: "before",
      now: "2026-09-01T00:01:00Z",
    }),
    /actor/
  );
  assert.throws(
    () => store.consumePreview(receipt.receipt_id, {
      actorId: "ou_operator",
      chatId: "oc_other",
      beforeHash: "before",
      now: "2026-09-01T00:01:00Z",
    }),
    /chat/
  );
  assert.throws(
    () => store.consumePreview(receipt.receipt_id, {
      actorId: "ou_operator",
      chatId: "oc_social",
      beforeHash: "changed",
      now: "2026-09-01T00:01:00Z",
    }),
    /stale/
  );
  store.consumePreview(receipt.receipt_id, {
    actorId: "ou_operator",
    chatId: "oc_social",
    beforeHash: "before",
    now: "2026-09-01T00:01:00Z",
  });
  assert.throws(
    () => store.consumePreview(receipt.receipt_id, {
      actorId: "ou_operator",
      chatId: "oc_social",
      beforeHash: "before",
      now: "2026-09-01T00:02:00Z",
    }),
    /used/
  );

  store.createPreview({
    receiptId: "sdp_expired",
    actorId: "ou_operator",
    chatId: "oc_social",
    action: "archive",
    targetTable: "选剧池",
    targetKey: "SD-000002",
    beforeHash: "before-2",
    patch: { 归档状态: "已归档" },
    now: "2026-09-01T00:00:00Z",
  });
  assert.throws(
    () => store.consumePreview("sdp_expired", {
      actorId: "ou_operator",
      chatId: "oc_social",
      beforeHash: "before-2",
      now: "2026-09-01T00:15:01Z",
    }),
    /expired/
  );
  store.close();
});

test("only one worker claims a job and an expired lease is recovered once", () => {
  const store = new JobStore(":memory:");
  store.create({
    runId: "run-1",
    trigger: "manual",
    actorId: "ou_operator",
    chatId: "oc_social",
    now: "2026-09-01T00:00:00Z",
  });
  const first = store.claimNext({ workerPid: 101, now: "2026-09-01T00:00:00Z", leaseSeconds: 120 });
  assert.equal(first.run_id, "run-1");
  assert.equal(first.attempt_count, 1);
  assert.equal(store.claimNext({ workerPid: 202, now: "2026-09-01T00:01:00Z", leaseSeconds: 120 }), null);
  const recovered = store.claimNext({ workerPid: 202, now: "2026-09-01T00:02:01Z", leaseSeconds: 120 });
  assert.equal(recovered.run_id, "run-1");
  assert.equal(recovered.attempt_count, 2);
  assert.equal(recovered.worker_pid, 202);
  assert.equal(store.claimNext({ workerPid: 303, now: "2026-09-01T00:04:02Z", leaseSeconds: 120 }), null);
  const terminal = store.get("run-1");
  assert.equal(terminal.state, "failed");
  assert.equal(terminal.error.code, "worker_crash_retries_exhausted");
  assert.deepEqual(store.listUndeliveredTerminal().map((row) => row.run_id), ["run-1"]);
  store.close();
});

test("lease renewal and finish require the current worker", () => {
  const store = new JobStore(":memory:");
  store.create({ runId: "run-owned", trigger: "manual", now: "2026-09-01T00:00:00Z" });
  store.claimNext({ workerPid: 101, now: "2026-09-01T00:00:00Z" });
  assert.throws(
    () => store.renewLease("run-owned", { workerPid: 202, now: "2026-09-01T00:00:30Z" }),
    /worker/
  );
  const renewed = store.renewLease("run-owned", {
    workerPid: 101,
    now: "2026-09-01T00:00:30Z",
    leaseSeconds: 120,
  });
  assert.equal(renewed.lease_expires_at, "2026-09-01T00:02:30.000Z");
  assert.throws(
    () => store.finishClaim("run-owned", { workerPid: 202, state: "success", now: "2026-09-01T00:01:00Z" }),
    /worker/
  );
  const finished = store.finishClaim("run-owned", {
    workerPid: 101,
    state: "partial",
    counters: { captures_written: 4 },
    error: { code: "one_row_failed" },
    now: "2026-09-01T00:01:00Z",
  });
  assert.equal(finished.state, "partial");
  assert.equal(finished.worker_pid, null);
  assert.equal(finished.lease_expires_at, null);
  assert.deepEqual(finished.counters, { captures_written: 4 });
  assert.deepEqual(finished.error, { code: "one_row_failed" });
  store.close();
});

test("an expired worker cannot renew or finish at the lease boundary", () => {
  const store = new JobStore(":memory:");
  store.create({ runId: "run-expired-owner", trigger: "manual", now: "2026-09-01T00:00:00Z" });
  store.claimNext({ workerPid: 101, now: "2026-09-01T00:00:00Z", leaseSeconds: 120 });

  assert.throws(() => store.renewLease("run-expired-owner", {
    workerPid: 101,
    now: "2026-09-01T08:02:00+08:00",
    leaseSeconds: 120,
  }));

  const recovered = store.claimNext({
    workerPid: 202,
    now: "2026-09-01T08:02:00+08:00",
    leaseSeconds: 120,
  });
  assert.equal(recovered.attempt_count, 2);
  assert.throws(() => store.finishClaim("run-expired-owner", {
    workerPid: 202,
    state: "success",
    now: "2026-09-01T08:04:00+08:00",
  }));

  assert.equal(store.claimNext({ workerPid: 303, now: "2026-09-01T08:04:00+08:00" }), null);
  const terminal = store.get("run-expired-owner");
  assert.equal(terminal.state, "failed");
  assert.equal(terminal.error.code, "worker_crash_retries_exhausted");
  store.close();
});

test("accepted timestamps are stored as UTC ISO and queue order is chronological", () => {
  const store = new JobStore(":memory:");
  const earlier = store.create({
    runId: "run-earlier",
    trigger: "manual",
    now: "2026-09-01T09:00:00+08:00",
  });
  const later = store.create({
    runId: "run-later",
    trigger: "manual",
    now: "2026-09-01T02:00:00Z",
  });
  assert.equal(earlier.started_at, "2026-09-01T01:00:00.000Z");
  assert.equal(later.started_at, "2026-09-01T02:00:00.000Z");
  const claimed = store.claimNext({ workerPid: 101, now: "2026-09-01T10:00:00+08:00" });
  assert.equal(claimed.run_id, "run-earlier");
  assert.equal(claimed.lease_expires_at, "2026-09-01T02:02:00.000Z");

  const audit = store.appendAudit({
    action: "update",
    now: "2026-09-01T10:01:00+08:00",
  });
  assert.equal(audit.created_at, "2026-09-01T02:01:00.000Z");

  const preview = store.createPreview({
    receiptId: "sdp_canonical",
    actorId: "ou_operator",
    chatId: "oc_social",
    action: "update",
    targetTable: "选剧池",
    beforeHash: "before",
    patch: {},
    now: "2026-09-01T10:02:00+08:00",
  });
  assert.equal(preview.created_at, "2026-09-01T02:02:00.000Z");
  assert.equal(preview.expires_at, "2026-09-01T02:17:00.000Z");
  assert.equal(store.consumePreview("sdp_canonical", {
    actorId: "ou_operator",
    chatId: "oc_social",
    beforeHash: "before",
    now: "2026-09-01T10:03:00+08:00",
  }).used_at, "2026-09-01T02:03:00.000Z");

  assert.equal(store.claimHealthAlert(
    "missing-terminal:2026-09-01",
    { ownerId: "owner-canonical", now: "2026-09-01T10:04:00+08:00", leaseSeconds: 120 }
  ), true);
  assert.equal(
    store.db.prepare("SELECT created_at FROM health_alerts WHERE alert_key = ?")
      .get("missing-terminal:2026-09-01").created_at,
    "2026-09-01T02:04:00.000Z"
  );

  assert.throws(
    () => store.create({ runId: "run-ambiguous-date", trigger: "manual", now: "09/01/2026" }),
    (error) => error.code === "state_store_time_invalid"
  );
  for (const invalid of [
    "2026-13-01T00:00:00Z",
    "2026-02-30T00:00:00Z",
    "2026-09-01T24:00:00Z",
    "2026-09-01T00:00:00+24:00",
    new Date("invalid"),
  ]) {
    assert.throws(
      () => store.appendAudit({ action: "invalid-time", now: invalid }),
      (error) => error.code === "state_store_time_invalid"
    );
  }
  store.close();
});

test("daily missing-terminal alert is deduplicated", () => {
  const store = new JobStore(":memory:");
  assert.equal(store.claimHealthAlert("missing-terminal:2026-09-01", { ownerId: "owner-a", now: "2026-09-01T02:00:00Z", leaseSeconds: 120 }), true);
  assert.equal(store.claimHealthAlert("missing-terminal:2026-09-01", { ownerId: "owner-b", now: "2026-09-01T02:01:00Z", leaseSeconds: 120 }), false);
  store.close();
});

test("file-backed JobStore enables durable multi-process pragmas", () => {
  const directory = mkdtempSync(join(tmpdir(), "shortdrama-jobs-"));
  const dbPath = join(directory, "ops.sqlite");
  const store = new JobStore(dbPath);
  assert.deepEqual(store.pragmas(), {
    journal_mode: "wal",
    busy_timeout: 5000,
    foreign_keys: 1,
    synchronous: 2,
  });
  store.close();
  rmSync(directory, { recursive: true });
});

test("file-backed writes fail closed after the SQLite busy timeout", () => {
  const directory = mkdtempSync(join(tmpdir(), "shortdrama-busy-"));
  const dbPath = join(directory, "ops.sqlite");
  const store = new JobStore(dbPath);
  const locker = new DatabaseSync(dbPath);
  locker.exec("PRAGMA busy_timeout=5000; BEGIN IMMEDIATE");
  const started = Date.now();
  assert.throws(
    () => store.create({ runId: "run-busy", trigger: "manual" }),
    (error) => error.code === "state_store_busy"
  );
  assert.ok(Date.now() - started >= 4_500);
  locker.exec("ROLLBACK");
  locker.close();
  store.close();
  rmSync(directory, { recursive: true });
});

test("ID helpers configure a real five-second busy timeout on passed connections", () => {
  const directory = mkdtempSync(join(tmpdir(), "shortdrama-id-busy-"));
  const dbPath = join(directory, "ops.sqlite");
  const setup = new DatabaseSync(dbPath);
  const worker = new DatabaseSync(dbPath);
  try {
    assert.equal(allocateBusinessId(setup, "drama"), "SD-000001");
    assert.equal(worker.prepare("PRAGMA busy_timeout").get().timeout, 0);
    setup.exec("BEGIN IMMEDIATE");
    const started = Date.now();
    assert.throws(
      () => allocateBusinessId(worker, "drama"),
      (error) => error.code === "state_store_busy"
    );
    assert.ok(Date.now() - started >= 4_500);
    assert.equal(worker.prepare("PRAGMA busy_timeout").get().timeout, 5000);
  } finally {
    if (setup.isTransaction) setup.exec("ROLLBACK");
    worker.close();
    setup.close();
    rmSync(directory, { recursive: true });
  }
});

test("two concurrent file-backed connections serialize job claims", async () => {
  const directory = mkdtempSync(join(tmpdir(), "shortdrama-claim-two-"));
  const dbPath = join(directory, "ops.sqlite");
  const setup = new JobStore(dbPath);
  try {
    setup.create({ runId: "run-two-claim", trigger: "manual", now: "2026-09-01T00:00:00Z" });
    setup.close();
    const results = await runConcurrentFileOperations("claim", dbPath);
    assert.equal(results.filter(({ value }) => value === null).length, 1);
    assert.equal(results.filter(({ value }) => value === 101 || value === 102).length, 1);
  } finally {
    if (setup.db.isOpen) setup.close();
    rmSync(directory, { recursive: true });
  }
});

test("two concurrent file-backed connections cannot consume one preview twice", async () => {
  const directory = mkdtempSync(join(tmpdir(), "shortdrama-preview-two-"));
  const dbPath = join(directory, "ops.sqlite");
  const setup = new JobStore(dbPath);
  try {
    setup.createPreview({
      receiptId: "sdp_two_connections",
      actorId: "ou_operator",
      chatId: "oc_social",
      action: "update",
      targetTable: "选剧池",
      beforeHash: "before",
      patch: {},
      now: "2026-09-01T00:00:00Z",
    });
    setup.close();
    const results = await runConcurrentFileOperations("preview", dbPath);
    assert.equal(results.filter(({ value }) => value === "2026-09-01T00:01:00.000Z").length, 1);
    assert.equal(results.filter(({ error }) => error?.code === "preview_used").length, 1);
  } finally {
    if (setup.db.isOpen) setup.close();
    rmSync(directory, { recursive: true });
  }
});

test("two concurrent file-backed connections allocate one monotonic ID sequence", async () => {
  const directory = mkdtempSync(join(tmpdir(), "shortdrama-sequence-two-"));
  const dbPath = join(directory, "ops.sqlite");
  try {
    const results = await runConcurrentFileOperations("sequence", dbPath);
    assert.deepEqual(results.map(({ value }) => value).sort(), ["SD-000001", "SD-000002"]);
  } finally {
    rmSync(directory, { recursive: true });
  }
});

test("two concurrent file-backed connections deduplicate one health alert", async () => {
  const directory = mkdtempSync(join(tmpdir(), "shortdrama-health-two-"));
  const dbPath = join(directory, "ops.sqlite");
  const setup = new JobStore(dbPath);
  try {
    setup.close();
    const results = await runConcurrentFileOperations("health", dbPath);
    assert.deepEqual(results.map(({ value }) => value).sort(), [false, true]);
  } finally {
    if (setup.db.isOpen) setup.close();
    rmSync(directory, { recursive: true });
  }
});

test("mutation lease enforces live ownership, renewal, release, expiry, and stale-owner safety", () => {
  const store = new JobStore(":memory:");
  const first = store.acquireMutationLease({
    lockKey: "human-base:binding-a",
    ownerId: "owner-a",
    now: "2026-09-01T00:00:00Z",
    leaseSeconds: 300,
  });
  assert.deepEqual(first, {
    lock_key: "human-base:binding-a",
    owner_id: "owner-a",
    acquired_at: "2026-09-01T00:00:00.000Z",
    lease_expires_at: "2026-09-01T00:05:00.000Z",
  });
  assert.equal(store.acquireMutationLease({
    lockKey: "human-base:binding-a", ownerId: "owner-b", now: "2026-09-01T00:01:00Z", leaseSeconds: 300,
  }), null);
  assert.throws(
    () => store.renewMutationLease({
      lockKey: "human-base:binding-a", ownerId: "owner-b", now: "2026-09-01T00:01:00Z", leaseSeconds: 300,
    }),
    (error) => error.code === "mutation_lease_mismatch",
  );
  assert.equal(store.renewMutationLease({
    lockKey: "human-base:binding-a", ownerId: "owner-a", now: "2026-09-01T00:04:00Z", leaseSeconds: 300,
  }).lease_expires_at, "2026-09-01T00:09:00.000Z");
  assert.equal(store.releaseMutationLease({ lockKey: "human-base:binding-a", ownerId: "owner-b" }), false);
  assert.equal(store.releaseMutationLease({ lockKey: "human-base:binding-a", ownerId: "owner-a" }), true);

  store.acquireMutationLease({
    lockKey: "human-base:binding-a", ownerId: "owner-a", now: "2026-09-01T01:00:00Z", leaseSeconds: 60,
  });
  const reclaimed = store.acquireMutationLease({
    lockKey: "human-base:binding-a", ownerId: "owner-b", now: "2026-09-01T01:01:00Z", leaseSeconds: 60,
  });
  assert.equal(reclaimed.owner_id, "owner-b");
  assert.equal(store.releaseMutationLease({ lockKey: "human-base:binding-a", ownerId: "owner-a" }), false);
  assert.throws(
    () => store.renewMutationLease({
      lockKey: "human-base:binding-a", ownerId: "owner-a", now: "2026-09-01T01:01:01Z", leaseSeconds: 60,
    }),
    (error) => error.code === "mutation_lease_mismatch",
  );
  assert.equal(store.releaseMutationLease({ lockKey: "human-base:binding-a", ownerId: "owner-b" }), true);

  for (const input of [
    { lockKey: " human-base:a", ownerId: "owner" },
    { lockKey: "human-base:a", ownerId: "owner\n" },
    { lockKey: "", ownerId: "owner" },
  ]) {
    assert.throws(
      () => store.acquireMutationLease({ ...input, now: "2026-09-01T00:00:00Z", leaseSeconds: 60 }),
      (error) => error.code === "mutation_lease_input_invalid",
    );
  }
  assert.throws(
    () => store.acquireMutationLease({
      lockKey: "human-base:a", ownerId: "owner", now: "2026-09-01T00:00:00Z", leaseSeconds: 1.5,
    }),
    (error) => error.code === "lease_duration_invalid",
  );
  store.close();
});

test("two worker connections allow exactly one live mutation lease owner", async () => {
  const directory = mkdtempSync(join(tmpdir(), "shortdrama-mutation-lease-two-"));
  const dbPath = join(directory, "ops.sqlite");
  const setup = new JobStore(dbPath);
  try {
    setup.close();
    const results = await runConcurrentFileOperations("mutationLease", dbPath);
    assert.equal(results.filter(({ value }) => value === null).length, 1);
    assert.equal(results.filter(({ value }) => /^worker-owner-[01]$/.test(value)).length, 1);
  } finally {
    if (setup.db.isOpen) setup.close();
    rmSync(directory, { recursive: true });
  }
});
