import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { JobStore } from "../src/job-store.mjs";
import { ShortDramaNotifier } from "../src/notifier.mjs";
import { getSyncStatus, runSyncWorker, startSyncJob } from "../src/sync-runner.mjs";

const RUN_ID = "SDRUN-20260901-080001";
const NOW = "2026-09-01T00:00:10Z";

function makeClaimedStore({ runId = RUN_ID, workerPid = 4242, chatId = "oc_social" } = {}) {
  const store = new JobStore(":memory:");
  store.create({
    runId,
    trigger: "manual",
    actorId: "ou_operator",
    chatId,
    now: "2026-09-01T00:00:00Z",
  });
  store.claimNext({ workerPid, now: "2026-09-01T00:00:01Z", leaseSeconds: 120 });
  return store;
}

function terminalStoreRow({ chatId = "oc_social", state = "success", notificationState = "pending" } = {}) {
  return {
    run_id: RUN_ID,
    trigger: "manual",
    actor_id: "ou_operator",
    chat_id: chatId,
    state,
    step: state,
    started_at: "2026-09-01T00:00:00.000Z",
    finished_at: "2026-09-01T00:01:00.000Z",
    counters: {
      accounts_updated: 1,
      capture_rows_upserted: 2,
      releases_linked: 1,
      manual_fields_changed_by_sync: 0,
      errors: state === "success" ? 0 : 1,
    },
    error: state === "success" ? {} : { code: "capture_partial", errors: [{ code: "capture_partial" }] },
    notification_state: notificationState,
    worker_pid: null,
    lease_expires_at: null,
    attempt_count: 1,
  };
}

function collectorSummary(overrides = {}) {
  return {
    status: "success",
    run_id: RUN_ID,
    beijing_date: "2026-09-01",
    summary_path: "/tmp/capture_summary_2026-09-01.json",
    sqlite_path: "/tmp/tiktok_metrics.sqlite",
    errors: [],
    ...overrides,
  };
}

function accountSource(overrides = {}) {
  return {
    username: "dramaexpedition",
    followers: 1161,
    snapshot_date: "2026-09-01",
    captured_at: "2026-09-01T00:00:05Z",
    collection_status: "complete",
    ...overrides,
  };
}

function captureSource(postId = "99", overrides = {}) {
  return {
    post_id: postId,
    username: "dramaexpedition",
    post_url: `https://www.tiktok.com/@dramaexpedition/video/${postId}`,
    content_type: "video",
    published_at: "2026-09-01T00:00:00Z",
    caption: "",
    first_seen_at: "2026-09-01T00:00:01Z",
    last_seen_at: "2026-09-01T00:00:05Z",
    snapshot_date: "2026-09-01",
    captured_at: "2026-09-01T00:00:05Z",
    views: 20,
    likes: 0,
    comments: null,
    favorites: 1,
    shares: 0,
    collection_status: "partial",
    missing_fields: '["comments"]',
    ...overrides,
  };
}

function successfulRepos(calls, { releases = [], captureIds = [["99", "rec-capture-99"]] } = {}) {
  const accountIndex = new Map([
    ["dramaexpedition", { record_id: "rec-account", fields: { 账号ID: "dramaexpedition" } }],
  ]);
  const captureIndex = new Map(captureIds.map(([postId, recordId]) => [
    postId,
    { record_id: recordId, fields: { "Post ID": postId } },
  ]));
  const releaseIndex = new Map(releases.map((row) => [row.fields.发布ID, structuredClone(row)]));
  let captureSyncCalls = 0;
  return {
    accounts: {
      async syncManyMachine(entries) {
        calls.push(["accounts:sync", structuredClone(entries)]);
        return { created: 0, updated: entries.length, unchanged: 0, readback: "verified" };
      },
      async loadIndex() {
        calls.push(["accounts:index"]);
        return structuredClone(accountIndex);
      },
    },
    captures: {
      async syncManyMachine(entries) {
        captureSyncCalls += 1;
        calls.push([captureSyncCalls === 1 ? "captures:source" : "captures:timestamp", structuredClone(entries)]);
        if (captureSyncCalls === 1) {
          assert.equal(Object.hasOwn(entries[0]?.patch ?? {}, "Base 同步时间"), false);
          return { created: entries.length, updated: 0, unchanged: 0, readback: "verified" };
        }
        assert.deepEqual(Object.keys(entries[0]?.patch ?? {}), ["Base 同步时间"]);
        return { created: 0, updated: entries.length, unchanged: 0, readback: "verified" };
      },
      async loadIndex() {
        calls.push(["captures:index"]);
        return structuredClone(captureIndex);
      },
    },
    releases: {
      async loadIndex() {
        calls.push(["releases:index"]);
        return structuredClone(releaseIndex);
      },
      async linkCaptureSafely(releaseId, captureRecordId, expected) {
        calls.push(["releases:link", releaseId, captureRecordId, structuredClone(expected)]);
        return { readback: "verified" };
      },
      async machineUpsertWithInvariant(releaseId, patch) {
        calls.push(["releases:evidence", releaseId, structuredClone(patch)]);
        return { readback: "verified" };
      },
    },
  };
}

function workerContext(store, repos, overrides = {}) {
  return {
    jobs: store,
    workerPid: 4242,
    now: () => NOW,
    collector: async () => collectorSummary(),
    source: {
      readLatestAccounts: () => [accountSource()],
      readLatestPosts: () => [captureSource()],
    },
    repos,
    notifier: { sendTerminal: async () => ({ notification_state: "sent" }) },
    ...overrides,
  };
}

test("notifier resolves the persisted terminal destination and ignores caller overrides", async () => {
  const sent = [];
  const marks = [];
  const persisted = terminalStoreRow();
  const notifier = new ShortDramaNotifier({
    allowedChatIds: new Set(["oc_social"]),
    sendMessage: async (payload) => sent.push(payload),
    jobs: {
      get: (runId) => runId === RUN_ID ? structuredClone(persisted) : null,
      markNotification: (runId, state) => marks.push([runId, state]),
    },
  });

  const result = await notifier.sendTerminal({ ...persisted, chat_id: "oc_attacker" });
  assert.equal(result.notification_state, "sent");
  assert.deepEqual(sent.map((row) => row.chatId), ["oc_social"]);
  assert.match(sent[0].text, /^run_id=SDRUN-/);
  assert.doesNotMatch(sent[0].text, /undefined|Bearer|token/i);
  assert.deepEqual(marks, [[RUN_ID, "sent"]]);
});

test("notifier refuses malformed and non-allowlisted persisted destinations without sending", async () => {
  for (const chatId of ["oc_attacker", " oc_social ", "", null]) {
    let sent = 0;
    const persisted = terminalStoreRow({ chatId });
    const notifier = new ShortDramaNotifier({
      allowedChatIds: new Set(["oc_social"]),
      sendMessage: async () => { sent += 1; },
      jobs: { get: () => structuredClone(persisted), markNotification: () => assert.fail("must not mark") },
    });
    await assert.rejects(
      () => notifier.sendTerminal(persisted),
      (error) => error.code === "notification_target_denied",
    );
    assert.equal(sent, 0);
  }
});

test("notification failure preserves the persisted data terminal and is retryable", async () => {
  const persisted = terminalStoreRow({ state: "partial", notificationState: "failed" });
  const marks = [];
  let attempts = 0;
  const notifier = new ShortDramaNotifier({
    allowedChatIds: new Set(["oc_social"]),
    sendMessage: async () => {
      attempts += 1;
      if (attempts === 1) throw new Error("network with secret free text");
    },
    jobs: {
      get: () => structuredClone(persisted),
      markNotification: (_runId, state) => marks.push(state),
    },
  });
  assert.deepEqual(await notifier.sendTerminal(persisted), { run_id: RUN_ID, state: "partial", notification_state: "failed" });
  assert.equal(persisted.state, "partial");
  assert.deepEqual(await notifier.sendTerminal(persisted), { run_id: RUN_ID, state: "partial", notification_state: "sent" });
  assert.deepEqual(marks, ["failed", "sent"]);
});

test("two file-backed starts atomically create one job and wake exactly once", async (t) => {
  const directory = mkdtempSync(join(tmpdir(), "shortdrama-start-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const path = join(directory, "jobs.sqlite");
  const stores = [new JobStore(path), new JobStore(path)];
  t.after(() => stores.forEach((store) => store.close()));
  let wakes = 0;
  const contexts = stores.map((jobs, index) => ({
    jobs,
    makeRunId: () => `SDRUN-20260901-08000${index + 1}`,
    now: () => `2026-09-01T00:00:0${index}Z`,
    wakeWorker: async () => { wakes += 1; },
  }));

  const results = await Promise.all(contexts.map((context) => startSyncJob(context, {
    trigger: "manual",
    actorId: "ou_operator",
    chatId: "oc_social",
  })));
  assert.equal(results.filter((row) => row.state === "queued").length, 1);
  assert.equal(results.filter((row) => row.state === "already_running").length, 1);
  assert.equal(new Set(results.map((row) => row.run_id)).size, 1);
  assert.equal(wakes, 1);
  assert.equal(stores[0].listActive().length, 1);
});

test("wake failure leaves the durable job queued for the ticker", async () => {
  const store = new JobStore(":memory:");
  const result = await startSyncJob({
    jobs: store,
    makeRunId: () => RUN_ID,
    now: () => "2026-09-01T00:00:00Z",
    wakeWorker: async () => { throw new Error("launchctl unavailable"); },
  }, { trigger: "manual", actorId: "ou_operator", chatId: "oc_social" });
  assert.equal(result.state, "queued");
  assert.deepEqual(result.error, { code: "worker_wakeup_failed" });
  assert.equal(store.get(RUN_ID).state, "queued");
  store.close();
});

test("start validates fixed manual/schedule shapes and fails closed on run ID collision", async () => {
  const store = new JobStore(":memory:");
  store.create({ runId: RUN_ID, trigger: "manual", now: "2026-09-01T00:00:00Z" });
  store.claimNext({ workerPid: 1, now: "2026-09-01T00:00:01Z" });
  store.finishClaim(RUN_ID, { workerPid: 1, state: "success", now: "2026-09-01T00:00:02Z" });
  const context = { jobs: store, makeRunId: () => RUN_ID, wakeWorker: async () => {} };
  await assert.rejects(
    () => startSyncJob(context, { trigger: "manual", actorId: "ou_operator", chatId: "oc_social" }),
    (error) => error.code === "run_id_collision",
  );
  for (const request of [
    { trigger: "manual", actorId: "", chatId: "oc_social" },
    { trigger: "manual", actorId: "ou_operator", chatId: "oc_social", beijingDate: "2026-09-01" },
    { trigger: "schedule", chatId: "oc_ops", beijingDate: "2026-9-1" },
    { trigger: "other", actorId: "ou_operator", chatId: "oc_social" },
  ]) {
    await assert.rejects(() => startSyncJob(context, request), (error) => error.code === "sync_request_invalid");
  }
  store.close();
});

test("status is a fixed read-only projection and missing jobs are explicit", () => {
  const row = terminalStoreRow();
  const store = { get: (runId) => runId === RUN_ID ? structuredClone(row) : null };
  const result = getSyncStatus(store, RUN_ID);
  assert.deepEqual(Object.keys(result), [
    "run_id", "trigger", "state", "step", "started_at", "finished_at",
    "counters", "error", "notification_state", "attempt_count",
  ]);
  assert.deepEqual(getSyncStatus(store, "SDRUN-20260901-080002"), {
    run_id: "SDRUN-20260901-080002",
    state: "not_found",
    error: { code: "job_not_found" },
  });
});

test("worker writes accounts then source captures then timestamp then links, with exact counters", async () => {
  const calls = [];
  const release = {
    record_id: "rec-release",
    fields: {
      发布ID: "SR-000001",
      账号: [{ id: "rec-account" }],
      "Post ID": "99",
      视频链接: null,
      日期: "2026-09-01",
      采集记录: [],
      归档状态: "active",
    },
  };
  const store = makeClaimedStore();
  const result = await runSyncWorker(workerContext(store, successfulRepos(calls, { releases: [release] })), RUN_ID);

  const first = (name) => calls.findIndex(([call]) => call === name);
  assert.ok(first("accounts:sync") < first("captures:source"));
  assert.ok(first("captures:source") < first("captures:timestamp"));
  assert.ok(first("captures:timestamp") < first("releases:link"));
  const link = calls.find(([name]) => name === "releases:link");
  assert.deepEqual(link.slice(1, 3), ["SR-000001", "rec-capture-99"]);
  assert.deepEqual(Object.keys(link[3]).sort(), ["Post ID", "账号", "日期", "视频链接"].sort());
  assert.equal(result.state, "partial");
  assert.deepEqual(result.counters, {
    accounts_updated: 1,
    capture_rows_upserted: 1,
    releases_linked: 1,
    manual_fields_changed_by_sync: 0,
    errors: 1,
  });
  assert.equal(store.get(RUN_ID).state, "partial");
  assert.equal(store.get(RUN_ID).worker_pid, null);
  assert.equal(store.get(RUN_ID).notification_state, "pending");
  assert.equal(store.db.prepare("SELECT COUNT(*) AS count FROM audit_events WHERE run_id = ? AND action = ?")
    .get(RUN_ID, "sync_terminal").count, 1);
  store.close();
});

test("worker preserves null versus zero and an unchanged retry is not counted as updated", async () => {
  const calls = [];
  const store = makeClaimedStore();
  const repos = successfulRepos(calls);
  repos.accounts.syncManyMachine = async (entries) => {
    assert.equal(entries[0].patch.粉丝数, 0);
    return { created: 0, updated: 0, unchanged: 1, readback: "verified" };
  };
  let captureCall = 0;
  repos.captures.syncManyMachine = async (entries) => {
    captureCall += 1;
    if (captureCall === 1) {
      assert.equal(entries[0].patch.点赞, 0);
      assert.equal(entries[0].patch.评论, null);
      return { created: 0, updated: 0, unchanged: 1, readback: "verified" };
    }
    return { created: 0, updated: 0, unchanged: 1, readback: "verified" };
  };
  const result = await runSyncWorker(workerContext(store, repos, {
    collector: async () => collectorSummary({ status: "partial", errors: [{ code: "account_partial" }] }),
    source: {
      readLatestAccounts: () => [accountSource({ followers: 0 })],
      readLatestPosts: () => [captureSource()],
    },
  }), RUN_ID);
  assert.equal(result.state, "partial");
  assert.equal(result.counters.accounts_updated, 0);
  assert.equal(result.counters.capture_rows_upserted, 0);
  assert.ok(result.errors.some((row) => row.code === "account_partial"));
  store.close();
});

test("one release failure and a duplicate claimed match are partial while safe rows continue", async () => {
  const calls = [];
  const releases = ["001", "002", "003"].map((suffix) => ({
    record_id: `rec-r-${suffix}`,
    fields: {
      发布ID: `SR-000${suffix}`,
      账号: [{ id: "rec-account" }],
      "Post ID": suffix === "003" ? "100" : "99",
      视频链接: null,
      日期: "2026-09-01",
      采集记录: [],
      归档状态: "active",
    },
  }));
  const repos = successfulRepos(calls, {
    releases,
    captureIds: [["99", "rec-capture-99"], ["100", "rec-capture-100"]],
  });
  repos.releases.linkCaptureSafely = async (releaseId, captureRecordId) => {
    calls.push(["releases:link", releaseId, captureRecordId]);
    if (releaseId === "SR-000003") {
      const error = new Error("changed concurrently");
      error.code = "concurrent_human_change";
      throw error;
    }
  };
  const store = makeClaimedStore();
  const result = await runSyncWorker(workerContext(store, repos, {
    source: {
      readLatestAccounts: () => [accountSource()],
      readLatestPosts: () => [captureSource("99"), captureSource("100")],
    },
  }), RUN_ID);
  assert.equal(result.state, "partial");
  assert.equal(result.counters.releases_linked, 1);
  assert.ok(result.errors.some((row) => row.code === "manual_post_claimed"));
  assert.ok(result.errors.some((row) => row.code === "concurrent_human_change"));
  assert.equal(result.counters.manual_fields_changed_by_sync, 0);
  assert.deepEqual(calls.filter(([name]) => name === "releases:link").map((row) => row[1]), ["SR-000001", "SR-000003"]);
  store.close();
});

test("wrong owner and reclaimed lease are rejected before collector side effects", async () => {
  for (const workerPid of [9999, 4242]) {
    const store = makeClaimedStore();
    if (workerPid === 4242) {
      store.claimNext({ workerPid: 9999, now: "2026-09-01T00:02:02Z", leaseSeconds: 120 });
    }
    let collectors = 0;
    const context = workerContext(store, successfulRepos([]), {
      workerPid,
      now: () => workerPid === 4242 ? "2026-09-01T00:02:03Z" : NOW,
      collector: async () => { collectors += 1; return collectorSummary(); },
    });
    await assert.rejects(() => runSyncWorker(context, RUN_ID), (error) => error.code === "worker_claim_mismatch");
    assert.equal(collectors, 0);
    store.close();
  }
});

test("heartbeat loss aborts the awaited collector and prevents all later side effects and false finish", async () => {
  const store = makeClaimedStore();
  let timerCallback;
  let renewals = 0;
  let baseWrites = 0;
  let notified = 0;
  const jobs = new Proxy(store, {
    get(target, property) {
      if (property === "renewLease") {
        return (...args) => {
          renewals += 1;
          if (renewals >= 2) {
            const error = new Error("reclaimed");
            error.code = "worker_claim_mismatch";
            throw error;
          }
          return target.renewLease(...args);
        };
      }
      const value = target[property];
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
  const repos = successfulRepos([]);
  repos.accounts.syncManyMachine = async () => { baseWrites += 1; };
  await assert.rejects(() => runSyncWorker(workerContext(jobs, repos, {
    heartbeatMilliseconds: 30_000,
    setTimer: (callback) => {
      timerCallback = callback;
      return { unref() {} };
    },
    clearTimer: () => {},
    collector: async ({ signal }) => {
      timerCallback();
      await new Promise((resolve) => setImmediate(resolve));
      assert.equal(signal.aborted, true);
      return collectorSummary();
    },
    notifier: { sendTerminal: async () => { notified += 1; } },
  }), RUN_ID), (error) => error.code === "worker_claim_mismatch");
  assert.equal(baseWrites, 0);
  assert.equal(notified, 0);
  assert.equal(store.get(RUN_ID).state, "running");
  store.close();
});

test("collector evidence mismatch fails before Base, while notification failure preserves failed terminal", async () => {
  const store = makeClaimedStore();
  let writes = 0;
  const repos = successfulRepos([]);
  repos.accounts.syncManyMachine = async () => { writes += 1; };
  const result = await runSyncWorker(workerContext(store, repos, {
    collector: async () => collectorSummary({ run_id: "SDRUN-20260901-080009" }),
    notifier: { sendTerminal: async (job) => ({ run_id: job.run_id, state: job.state, notification_state: "failed" }) },
  }), RUN_ID);
  assert.equal(result.state, "failed");
  assert.equal(result.errors[0].code, "capture_failed");
  assert.equal(result.notification_state, "failed");
  assert.equal(writes, 0);
  assert.equal(store.get(RUN_ID).state, "failed");
  store.close();
});

test("source/schema failures keep their named code and never become a valid zero", async () => {
  const store = makeClaimedStore();
  let writes = 0;
  const repos = successfulRepos([]);
  repos.accounts.syncManyMachine = async () => { writes += 1; };
  const sourceError = new Error("schema missing");
  sourceError.code = "source_schema_invalid";
  const result = await runSyncWorker(workerContext(store, repos, {
    source: {
      readLatestAccounts: () => { throw sourceError; },
      readLatestPosts: () => assert.fail("must stop at first source failure"),
    },
  }), RUN_ID);
  assert.equal(result.state, "failed");
  assert.deepEqual(result.errors, [{ step: "source", code: "source_schema_invalid" }]);
  assert.equal(writes, 0);
  store.close();
});

test("an exact existing relation is idempotent and archived rows are ignored", async () => {
  const calls = [];
  const releases = [
    {
      record_id: "rec-active",
      fields: {
        发布ID: "SR-000001",
        账号: [{ id: "rec-account" }],
        "Post ID": "99",
        视频链接: null,
        日期: "2026-09-01",
        采集记录: [{ id: "rec-capture-99" }],
        归档状态: "active",
      },
    },
    {
      record_id: "rec-archived",
      fields: {
        发布ID: "SR-000002",
        账号: [{ id: "rec-account" }],
        "Post ID": "99",
        视频链接: null,
        日期: "2026-09-01",
        采集记录: [],
        归档状态: "archived",
      },
    },
  ];
  const store = makeClaimedStore();
  const result = await runSyncWorker(workerContext(store, successfulRepos(calls, { releases }), {
    source: {
      readLatestAccounts: () => [accountSource()],
      readLatestPosts: () => [captureSource("99", {
        comments: 0,
        collection_status: "complete",
        missing_fields: "[]",
      })],
    },
  }), RUN_ID);
  assert.equal(result.state, "success");
  assert.equal(result.counters.releases_linked, 0);
  assert.equal(calls.filter(([name]) => name === "releases:link").length, 0);
  assert.deepEqual(calls.filter(([name]) => name === "releases:evidence").map((row) => row[1]), ["SR-000001"]);
  store.close();
});

test("a future active schedule without a capture is a safe no-op, not a partial error", async () => {
  const calls = [];
  const release = {
    record_id: "rec-future",
    fields: {
      发布ID: "SR-000010",
      账号: [{ id: "rec-account" }],
      "Post ID": null,
      视频链接: null,
      日期: "2026-09-02",
      采集记录: [],
      归档状态: "active",
    },
  };
  const store = makeClaimedStore();
  const result = await runSyncWorker(workerContext(store, successfulRepos(calls, { releases: [release] }), {
    source: {
      readLatestAccounts: () => [accountSource()],
      readLatestPosts: () => [captureSource("99", {
        comments: 0,
        collection_status: "complete",
        missing_fields: "[]",
      })],
    },
  }), RUN_ID);
  assert.equal(result.state, "success");
  assert.equal(result.counters.releases_linked, 0);
  assert.equal(result.counters.errors, 0);
  assert.equal(calls.filter(([name]) => name === "releases:link").length, 0);
  store.close();
});
