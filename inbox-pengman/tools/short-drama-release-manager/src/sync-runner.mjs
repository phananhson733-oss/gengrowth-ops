import { basename, isAbsolute } from "node:path";

import { ShortDramaError } from "./errors.mjs";
import { matchReleaseToCapture } from "./matcher.mjs";
import { normalizeAccountId, toCaptureFields } from "./source-sqlite.mjs";

const RUN_ID_PATTERN = /^SDRUN-(\d{4})(\d{2})(\d{2})-(\d{6})$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const CODE_PATTERN = /^[a-z][a-z0-9_]{0,63}$/;
const TERMINAL_STATES = new Set(["success", "partial", "failed"]);
const COUNTER_NAMES = Object.freeze([
  "accounts_updated",
  "capture_rows_upserted",
  "releases_linked",
  "manual_fields_changed_by_sync",
  "errors",
]);

function fail(code, message, details = {}) {
  throw new ShortDramaError(code, message, details);
}

function plainObject(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function clone(value, code = "sync_input_invalid") {
  try {
    return structuredClone(value);
  } catch {
    fail(code, "Sync value is not cloneable");
  }
}

function normalizedString(value) {
  return typeof value === "string" && value.length > 0 && value.trim() === value && value.length <= 256;
}

function validDate(value) {
  if (typeof value !== "string" || !DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function runIdDate(runId) {
  const match = RUN_ID_PATTERN.exec(runId);
  if (!match) return null;
  const date = `${match[1]}-${match[2]}-${match[3]}`;
  return validDate(date) ? date : null;
}

function errorCode(error, fallback = "internal_error") {
  return typeof error?.code === "string" && CODE_PATTERN.test(error.code) ? error.code : fallback;
}

function counters() {
  return {
    accounts_updated: 0,
    capture_rows_upserted: 0,
    releases_linked: 0,
    manual_fields_changed_by_sync: 0,
    errors: 0,
  };
}

function validateBulkResult(result, inputCount, table) {
  if (!plainObject(result) || result.readback !== "verified") {
    fail("readback_mismatch", "Bulk sync did not produce a verified readback", { table });
  }
  const values = [result.created, result.updated, result.unchanged];
  if (values.some((value) => !Number.isSafeInteger(value) || value < 0) ||
      values.reduce((sum, value) => sum + value, 0) !== inputCount) {
    fail("base_response_invalid", "Bulk sync counters do not match the input", { table });
  }
  return result;
}

function mapIndex(value, table) {
  if (!(value instanceof Map)) fail("base_response_invalid", "Repository index is not complete", { table });
  return value;
}

function jobProjection(row) {
  return {
    run_id: row.run_id,
    trigger: row.trigger,
    state: row.state,
    step: row.step,
    started_at: row.started_at,
    finished_at: row.finished_at,
    counters: clone(row.counters ?? {}, "sync_status_invalid"),
    error: clone(row.error ?? {}, "sync_status_invalid"),
    notification_state: row.notification_state,
    attempt_count: row.attempt_count,
  };
}

function requestClone(request) {
  if (!plainObject(request)) fail("sync_request_invalid", "Sync request must be a plain object");
  const copy = clone(request, "sync_request_invalid");
  if (!plainObject(copy)) fail("sync_request_invalid", "Sync request must be a plain object");
  return copy;
}

function validateStartRequest(request) {
  const copy = requestClone(request);
  if (copy.trigger === "manual") {
    if (Object.keys(copy).some((key) => !["trigger", "actorId", "chatId"].includes(key)) ||
        !normalizedString(copy.actorId) || !normalizedString(copy.chatId)) {
      fail("sync_request_invalid", "Manual sync request is invalid");
    }
    return { trigger: "manual", actorId: copy.actorId, chatId: copy.chatId, beijingDate: null };
  }
  if (copy.trigger === "schedule") {
    if (Object.keys(copy).some((key) => !["trigger", "chatId", "beijingDate"].includes(key)) ||
        !normalizedString(copy.chatId) || !validDate(copy.beijingDate)) {
      fail("sync_request_invalid", "Scheduled sync request is invalid");
    }
    return { trigger: "schedule", actorId: null, chatId: copy.chatId, beijingDate: copy.beijingDate };
  }
  fail("sync_request_invalid", "Sync trigger is invalid");
}

export async function startSyncJob(context, request) {
  const input = validateStartRequest(request);
  if (!context || !context.jobs || typeof context.jobs.enqueueIfIdle !== "function" ||
      typeof context.makeRunId !== "function" || typeof context.wakeWorker !== "function") {
    fail("sync_context_invalid", "Sync start context is invalid");
  }
  const now = typeof context.now === "function" ? context.now() : new Date();
  const runId = context.makeRunId(now);
  const date = runIdDate(runId);
  if (!date || input.beijingDate && input.beijingDate !== date) {
    fail("run_id_invalid", "Run ID does not match the fixed Beijing date");
  }
  const enqueued = context.jobs.enqueueIfIdle({
    runId,
    trigger: input.trigger,
    actorId: input.actorId,
    chatId: input.chatId,
    now,
  });
  if (!plainObject(enqueued) || typeof enqueued.created !== "boolean" || !plainObject(enqueued.job)) {
    fail("state_store_response_invalid", "Atomic enqueue response is invalid");
  }
  if (!enqueued.created) {
    return { state: "already_running", run_id: enqueued.job.run_id };
  }
  const result = { state: "queued", run_id: enqueued.job.run_id };
  try {
    await context.wakeWorker();
    return result;
  } catch {
    return { ...result, error: { code: "worker_wakeup_failed" } };
  }
}

export function getSyncStatus(store, runId) {
  if (!store || typeof store.get !== "function" || !normalizedString(runId)) {
    fail("sync_status_invalid", "Sync status request is invalid");
  }
  const row = store.get(runId);
  if (!row) return { run_id: runId, state: "not_found", error: { code: "job_not_found" } };
  return jobProjection(row);
}

function heartbeatController(context, runId, workerPid, now) {
  const interval = context.heartbeatMilliseconds ?? 30_000;
  if (!Number.isSafeInteger(interval) || interval <= 0) fail("sync_context_invalid", "Heartbeat interval is invalid");
  const setTimer = context.setTimer ?? setTimeout;
  const clearTimer = context.clearTimer ?? clearTimeout;
  const abort = new AbortController();
  let timer = null;
  let stopped = false;
  let lost = null;

  const schedule = () => {
    if (stopped || lost) return;
    timer = setTimer(async () => {
      timer = null;
      if (stopped || lost) return;
      try {
        context.jobs.renewLease(runId, { workerPid, now: now(), leaseSeconds: 120 });
      } catch (error) {
        lost = error instanceof Error ? error : new ShortDramaError("worker_claim_mismatch", "Worker lease was lost");
        abort.abort();
        return;
      }
      schedule();
    }, interval);
    timer?.unref?.();
  };
  schedule();
  return {
    signal: abort.signal,
    assertOwned() {
      if (lost) throw lost;
    },
    stop() {
      stopped = true;
      if (timer !== null) clearTimer(timer);
      timer = null;
    },
  };
}

function assertClaim(row, runId, workerPid, now) {
  const leaseTime = new Date(row?.lease_expires_at).getTime();
  const currentTime = new Date(now).getTime();
  if (!plainObject(row) || row.run_id !== runId || row.state !== "running" ||
      row.worker_pid !== workerPid || typeof row.lease_expires_at !== "string" ||
      !Number.isFinite(leaseTime) || !Number.isFinite(currentTime) || leaseTime <= currentTime) {
    fail("worker_claim_mismatch", "Job is not a live claim owned by this worker", {
      run_id: runId,
      worker_pid: workerPid,
    });
  }
}

function validateCollectorSummary(summary, runId, expectedDate, metricsSqlitePath) {
  const validStatus = summary?.status === "success" || summary?.status === "partial";
  const expectedSummaryName = `capture_summary_${expectedDate}.json`;
  if (!plainObject(summary) || !validStatus || summary.run_id !== runId ||
      summary.beijing_date !== expectedDate || !isAbsolute(summary.summary_path ?? "") ||
      basename(summary.summary_path) !== expectedSummaryName || !isAbsolute(summary.sqlite_path ?? "") ||
      (metricsSqlitePath && summary.sqlite_path !== metricsSqlitePath) || !Array.isArray(summary.errors ?? [])) {
    fail("capture_failed", "Collector did not produce trusted same-run evidence");
  }
  return clone(summary, "capture_failed");
}

function collectorErrors(summary) {
  if (summary.status !== "partial") return [];
  const codes = summary.errors
    .map((item) => errorCode(item, null))
    .filter(Boolean);
  return (codes.length > 0 ? codes : ["capture_partial"]).map((code) => ({ step: "collector", code }));
}

function accountEntry(row) {
  const key = normalizeAccountId(row?.username);
  const patch = { 账号ID: key };
  const fields = [
    ["粉丝数", row.followers],
    ["数据日期", row.snapshot_date],
    ["指标同步时间", row.captured_at],
    ["同步状态", row.collection_status],
  ];
  for (const [field, value] of fields) {
    if (value !== undefined) patch[field] = value;
  }
  return { key, patch };
}

function recordIdByKey(index, key, table) {
  const record = index.get(key);
  if (!plainObject(record) || !normalizedString(record.record_id)) {
    fail("relation_target_not_found", "Required relation target is missing", { table, key });
  }
  return record.record_id;
}

function relationId(value) {
  if (!Array.isArray(value) || value.length !== 1 || !plainObject(value[0]) ||
      Object.keys(value[0]).length !== 1 || !normalizedString(value[0].id)) return null;
  return value[0].id;
}

function accountReverseIndex(index) {
  const result = new Map();
  for (const [accountId, record] of index) {
    if (!plainObject(record) || !normalizedString(record.record_id) || result.has(record.record_id)) {
      fail("base_response_invalid", "Account relation index is malformed");
    }
    result.set(record.record_id, normalizeAccountId(accountId));
  }
  return result;
}

function hasExplicitClaim(fields) {
  return [fields?.["Post ID"], fields?.["视频链接"]].some(
    (value) => value !== undefined && value !== null && value !== "",
  );
}

function rawExplicitPostIds(fields) {
  const ids = new Set();
  if (typeof fields?.["Post ID"] === "string" && /^\d+$/.test(fields["Post ID"])) {
    ids.add(fields["Post ID"]);
  }
  if (typeof fields?.["视频链接"] === "string" && fields["视频链接"].trim() === fields["视频链接"]) {
    try {
      const url = new URL(fields["视频链接"]);
      const hostname = url.hostname.toLowerCase();
      const match = url.pathname.match(/^\/@[^/]+\/(?:video|photo)\/(\d+)\/?$/);
      if ((url.protocol === "https:" || url.protocol === "http:") &&
          (hostname === "tiktok.com" || hostname.endsWith(".tiktok.com")) && match) {
        ids.add(match[1]);
      }
    } catch {
      // Invalid URLs carry no claim; the matcher emits the stable validation error.
    }
  }
  return ids;
}

function capturePostReverseIndex(index) {
  const result = new Map();
  for (const [postId, record] of index) {
    if (!plainObject(record) || !normalizedString(record.record_id) || result.has(record.record_id)) {
      fail("base_response_invalid", "Capture relation index is malformed");
    }
    result.set(record.record_id, postId);
  }
  return result;
}

function requestedEvidence(match, startedAt) {
  return {
    匹配方式: match.method,
    匹配置信度: match.confidence ?? 1,
    指标同步时间: startedAt,
    同步错误: null,
  };
}

function releaseError(errors, releaseId, error, fallback = "release_sync_failed") {
  errors.push({ step: "release_links", code: errorCode(error, fallback), target: releaseId });
}

function terminalError(state, errors) {
  if (state === "success") return {};
  return {
    code: state === "partial" ? "sync_partial" : errors[0]?.code ?? "sync_failed",
    errors: errors.map((item) => ({ code: item.code, step: item.step, ...(item.target ? { target: item.target } : {}) })),
  };
}

async function notifyTerminal(context, terminal) {
  if (!context.notifier || typeof context.notifier.sendTerminal !== "function") {
    return { notification_state: terminal.notification_state ?? "pending" };
  }
  try {
    return await context.notifier.sendTerminal(terminal);
  } catch (error) {
    if (errorCode(error) === "notification_state_persist_failed") throw error;
    return { notification_state: "failed" };
  }
}

function resultFromTerminal(terminal, errors, notification) {
  const fixedCounters = Object.fromEntries(COUNTER_NAMES.map((name) => [name, terminal.counters?.[name] ?? 0]));
  return {
    run_id: terminal.run_id,
    state: terminal.state,
    step: terminal.step,
    counters: fixedCounters,
    ...fixedCounters,
    errors: clone(errors, "sync_result_invalid"),
    notification_state: notification?.notification_state ?? terminal.notification_state ?? "pending",
  };
}

function appendSummaryAudit(jobs, terminal) {
  if (typeof jobs.appendAudit !== "function") return;
  jobs.appendAudit({
    runId: terminal.run_id,
    actorId: terminal.actor_id,
    action: "sync_terminal",
    targetTable: null,
    targetKey: terminal.run_id,
    before: {},
    after: { state: terminal.state, step: terminal.step, counters: terminal.counters },
    readback: { state: terminal.state, notification_state: terminal.notification_state },
    now: terminal.finished_at,
  });
}

export async function runSyncWorker(context, runId) {
  if (!context || !context.jobs || typeof context.jobs.get !== "function" ||
      typeof context.jobs.renewLease !== "function" || typeof context.jobs.transition !== "function" ||
      typeof context.jobs.finishClaim !== "function" || !Number.isSafeInteger(context.workerPid) ||
      context.workerPid <= 0 || typeof context.collector !== "function" || !context.source ||
      !context.repos || !context.repos.accounts || !context.repos.captures || !context.repos.releases) {
    fail("sync_context_invalid", "Sync worker context is invalid");
  }
  const expectedDate = runIdDate(runId);
  if (!expectedDate) fail("run_id_invalid", "Worker run ID is invalid");
  const now = typeof context.now === "function" ? context.now : () => new Date();
  const workerPid = context.workerPid;
  const initial = context.jobs.get(runId);
  assertClaim(initial, runId, workerPid, now());
  const beat = heartbeatController(context, runId, workerPid, now);
  const totals = counters();
  const errors = [];
  let currentStep = "collector";
  let finished = false;

  const ownStep = (step) => {
    beat.assertOwned();
    context.jobs.renewLease(runId, { workerPid, now: now(), leaseSeconds: 120 });
    beat.assertOwned();
    currentStep = step;
    context.jobs.transition(runId, "running", { step, counters: totals, now: now() });
  };

  const finish = async (state) => {
    beat.assertOwned();
    const terminal = context.jobs.finishClaim(runId, {
      workerPid,
      state,
      counters: totals,
      error: terminalError(state, errors),
      step: state,
      now: now(),
    });
    finished = true;
    beat.stop();
    const persisted = context.jobs.get(runId);
    if (!persisted || persisted.state !== state || !TERMINAL_STATES.has(persisted.state)) {
      fail("state_store_response_invalid", "Persisted terminal readback is invalid");
    }
    appendSummaryAudit(context.jobs, persisted);
    const notification = await notifyTerminal(context, persisted);
    return resultFromTerminal(persisted, errors, notification);
  };

  try {
    ownStep("collector");
    const rawSummary = await context.collector({ runId, beijingDate: expectedDate, signal: beat.signal });
    beat.assertOwned();
    const summary = validateCollectorSummary(rawSummary, runId, expectedDate, context.metricsSqlitePath);
    errors.push(...collectorErrors(summary));

    currentStep = "source";
    const readAccounts = context.source.readLatestAccounts ?? context.source.readAccounts;
    const readPosts = context.source.readLatestPosts ?? context.source.readCaptures;
    if (typeof readAccounts !== "function" || typeof readPosts !== "function") {
      fail("source_adapter_invalid", "SQLite source adapter is invalid");
    }
    const accountRows = await readAccounts(summary.sqlite_path);
    const postRows = await readPosts(summary.sqlite_path);
    beat.assertOwned();
    if (!Array.isArray(accountRows) || !Array.isArray(postRows)) {
      fail("source_response_invalid", "SQLite source rows are invalid");
    }
    for (const post of postRows) {
      if (post?.collection_status !== "complete") {
        errors.push({ step: "captures", code: "capture_partial", target: post?.post_id });
      }
    }

    ownStep("accounts");
    const accountEntries = accountRows.map(accountEntry);
    let accountWrite = { created: 0, updated: 0, unchanged: 0, readback: "verified" };
    if (accountEntries.length > 0) {
      accountWrite = validateBulkResult(
        await context.repos.accounts.syncManyMachine(accountEntries, { signal: beat.signal }),
        accountEntries.length,
        "账号台账",
      );
      beat.assertOwned();
    }
    totals.accounts_updated = accountWrite.created + accountWrite.updated;
    const accountIndex = mapIndex(await context.repos.accounts.loadIndex({ signal: beat.signal }), "账号台账");
    beat.assertOwned();
    const accountIds = accountReverseIndex(accountIndex);

    ownStep("captures");
    const captureEntries = postRows.map((post) => ({
      key: post.post_id,
      patch: toCaptureFields(post, runId, recordIdByKey(accountIndex, normalizeAccountId(post.username), "账号台账")),
    }));
    let captureWrite = { created: 0, updated: 0, unchanged: 0, readback: "verified" };
    if (captureEntries.length > 0) {
      captureWrite = validateBulkResult(
        await context.repos.captures.syncManyMachine(captureEntries, { signal: beat.signal }),
        captureEntries.length,
        "采集数据",
      );
      beat.assertOwned();
      const timestampEntries = captureEntries.map((entry) => ({
        key: entry.key,
        patch: { "Base 同步时间": initial.started_at },
      }));
      validateBulkResult(
        await context.repos.captures.syncManyMachine(timestampEntries, { signal: beat.signal }),
        timestampEntries.length,
        "采集数据",
      );
      beat.assertOwned();
    }
    totals.capture_rows_upserted = captureWrite.created + captureWrite.updated;
    const captureIndex = mapIndex(await context.repos.captures.loadIndex({ signal: beat.signal }), "采集数据");
    beat.assertOwned();

    ownStep("release_links");
    const releaseIndex = mapIndex(await context.repos.releases.loadIndex({ signal: beat.signal }), "发布记录");
    beat.assertOwned();
    const capturePostByRecordId = capturePostReverseIndex(captureIndex);
    const active = [...releaseIndex]
      .filter(([, record]) => plainObject(record?.fields) && record.fields.归档状态 === "active")
      .sort(([left], [right]) => left.localeCompare(right));
    const candidates = [];
    const reservations = new Map();

    // Pass one only validates and reserves human-explicit and already-linked claims.
    for (const [releaseId, rawRecord] of active) {
      beat.assertOwned();
      const fields = rawRecord?.fields;
      const existingCapture = relationId(fields.采集记录);
      const existingPostId = existingCapture ? capturePostByRecordId.get(existingCapture) : null;
      const rawClaims = rawExplicitPostIds(fields);
      const reserveInvalidClaims = () => {
        for (const claimed of [...rawClaims, ...(existingPostId ? [existingPostId] : [])]) {
          const rows = reservations.get(claimed) ?? [];
          rows.push({ releaseId, invalid: true });
          reservations.set(claimed, rows);
        }
      };
      const accountRecordId = relationId(fields.账号);
      const accountId = accountRecordId ? accountIds.get(accountRecordId) : null;
      if (!accountId) {
        releaseError(errors, releaseId, { code: "release_account_invalid" });
        reserveInvalidClaims();
        continue;
      }
      if (existingCapture && !existingPostId) {
        releaseError(errors, releaseId, { code: "relation_target_not_found" });
        for (const claimed of rawClaims) {
          const rows = reservations.get(claimed) ?? [];
          rows.push({ releaseId, invalid: true });
          reservations.set(claimed, rows);
        }
        continue;
      }
      const explicit = hasExplicitClaim(fields);
      let explicitMatch = null;
      let explicitPostId = null;
      if (explicit) {
        try {
          explicitMatch = matchReleaseToCapture({ ...clone(fields), 账号ID: accountId }, postRows, new Set());
        } catch (error) {
          releaseError(errors, releaseId, error, "matcher_failed");
          continue;
        }
        if (explicitMatch.status === "matched") explicitPostId = explicitMatch.post.post_id;
        else {
          releaseError(errors, releaseId, { code: explicitMatch.reason }, "release_unmatched");
          for (const rawPostId of rawClaims) {
            const rows = reservations.get(rawPostId) ?? [];
            rows.push({ releaseId, invalid: true });
            reservations.set(rawPostId, rows);
          }
          continue;
        }
      }
      if (explicitPostId && existingPostId && explicitPostId !== existingPostId) {
        releaseError(errors, releaseId, { code: "release_claim_conflict" });
        for (const claimed of [explicitPostId, existingPostId]) {
          const rows = reservations.get(claimed) ?? [];
          rows.push({ releaseId, invalid: true });
          reservations.set(claimed, rows);
        }
        continue;
      }
      const reservedPostId = explicitPostId ?? existingPostId ?? null;
      const candidate = { releaseId, fields, accountId, existingCapture, explicitMatch, reservedPostId };
      candidates.push(candidate);
      if (reservedPostId) {
        const rows = reservations.get(reservedPostId) ?? [];
        rows.push(candidate);
        reservations.set(reservedPostId, rows);
      }
    }

    const conflicts = new Set();
    for (const [, rows] of [...reservations].sort(([left], [right]) => left.localeCompare(right))) {
      const uniqueRows = [...new Map(rows.map((row) => [row.releaseId, row])).values()];
      if (uniqueRows.length <= 1) continue;
      for (const row of uniqueRows.sort((left, right) => left.releaseId.localeCompare(right.releaseId))) {
        releaseError(errors, row.releaseId, { code: "manual_post_claimed" });
        conflicts.add(row.releaseId);
      }
    }

    // Pass two matches only unreserved rows after every explicit/existing claim is known.
    const claimedPostIds = new Set(reservations.keys());
    const plan = [];
    for (const candidate of candidates) {
      beat.assertOwned();
      if (conflicts.has(candidate.releaseId)) continue;
      let match = candidate.explicitMatch;
      if (!match && candidate.reservedPostId) {
        const post = postRows.find((row) => row.post_id === candidate.reservedPostId);
        if (!post) {
          releaseError(errors, candidate.releaseId, { code: "manual_post_not_found" });
          continue;
        }
        if (normalizeAccountId(post.username) !== candidate.accountId) {
          releaseError(errors, candidate.releaseId, { code: "manual_post_account_mismatch" });
          continue;
        }
        match = { status: "matched", method: "existing_relation", confidence: 1, post };
      }
      if (!match) {
        try {
          match = matchReleaseToCapture(
            { ...clone(candidate.fields), 账号ID: candidate.accountId },
            postRows,
            claimedPostIds,
          );
        } catch (error) {
          releaseError(errors, candidate.releaseId, error, "matcher_failed");
          continue;
        }
      }
      if (match.status !== "matched") {
        if (match.status === "unmatched" && match.reason === "no_account_time_candidate" &&
            validDate(candidate.fields.日期) && candidate.fields.日期 > expectedDate) continue;
        releaseError(errors, candidate.releaseId, { code: match.reason }, "release_unmatched");
        continue;
      }
      claimedPostIds.add(match.post.post_id);
      plan.push({ ...candidate, match });
    }

    // No relation or evidence mutation occurs until the complete deterministic plan exists.
    for (const item of plan) {
      beat.assertOwned();
      const postId = item.match.post.post_id;
      const captureRecordId = recordIdByKey(captureIndex, postId, "采集数据");
      const expected = Object.fromEntries(
        ["Post ID", "视频链接", "账号", "日期"].map((field) => [field, clone(item.fields[field])]),
      );
      try {
        if (item.existingCapture !== captureRecordId) {
          await context.repos.releases.linkCaptureSafely(item.releaseId, captureRecordId, expected, { signal: beat.signal });
          beat.assertOwned();
          totals.releases_linked += 1;
        }
        if (typeof context.repos.releases.upsertByKey === "function") {
          await context.repos.releases.upsertByKey(
            item.releaseId,
            requestedEvidence(item.match, initial.started_at),
            "machine",
            { signal: beat.signal },
          );
          beat.assertOwned();
        }
      } catch (error) {
        releaseError(errors, item.releaseId, error);
      }
    }

    ownStep("readback");
    await context.repos.accounts.loadIndex({ signal: beat.signal });
    beat.assertOwned();
    await context.repos.captures.loadIndex({ signal: beat.signal });
    beat.assertOwned();
    await context.repos.releases.loadIndex({ signal: beat.signal });
    beat.assertOwned();
    totals.manual_fields_changed_by_sync = 0;
    totals.errors = errors.length;
    return await finish(errors.length > 0 ? "partial" : "success");
  } catch (error) {
    beat.assertOwned();
    const code = errorCode(error);
    if (code === "worker_claim_mismatch" || code === "worker_claim_lost") {
      beat.stop();
      throw error;
    }
    errors.push({ step: currentStep, code: currentStep === "collector" ? "capture_failed" : code });
    totals.manual_fields_changed_by_sync = 0;
    totals.errors = errors.length;
    if (finished) throw error;
    try {
      return await finish("failed");
    } catch (finishError) {
      beat.stop();
      if (errorCode(finishError) === "worker_claim_mismatch") throw finishError;
      throw error;
    }
  } finally {
    beat.stop();
  }
}
