import { DatabaseSync } from "node:sqlite";

import { ShortDramaError } from "./errors.mjs";

const TERMINAL_STATES = new Set(["success", "partial", "failed"]);
const JOB_STATES = new Set(["queued", "running", ...TERMINAL_STATES]);
const NOTIFICATION_STATES = new Set(["pending", "sent", "failed"]);
const ISO_INSTANT_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/;

function fail(code, message, details = {}) {
  throw new ShortDramaError(code, message, details);
}

function requiredString(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    fail("state_store_input_invalid", "Missing required state-store value", { field });
  }
  return value.trim();
}

function optionalString(value, field) {
  if (value === undefined || value === null) return null;
  return requiredString(value, field);
}

function timestamp(value = new Date()) {
  const match = typeof value === "string" ? ISO_INSTANT_PATTERN.exec(value) : null;
  const date = value instanceof Date || match ? new Date(value) : null;
  const calendarIsValid = !match || (
    Number(match[2]) >= 1 && Number(match[2]) <= 12 &&
    Number(match[3]) >= 1 &&
    Number(match[3]) <= new Date(Date.UTC(Number(match[1]), Number(match[2]), 0)).getUTCDate() &&
    Number(match[4]) <= 23 &&
    Number(match[5]) <= 59 &&
    Number(match[6]) <= 59
  );
  if (!date || Number.isNaN(date.getTime()) || !calendarIsValid) {
    fail("state_store_time_invalid", "State-store timestamp must be valid", { value });
  }
  return date.toISOString();
}

function futureTimestamp(now, seconds) {
  if (!Number.isSafeInteger(seconds) || seconds <= 0) {
    fail("lease_duration_invalid", "Lease duration must be a positive safe integer", { lease_seconds: seconds });
  }
  return new Date(new Date(timestamp(now)).getTime() + seconds * 1000).toISOString();
}

function parseJson(value) {
  return JSON.parse(value);
}

function jobFromRow(row) {
  if (!row) return null;
  const result = { ...row, counters: parseJson(row.counters_json), error: parseJson(row.error_json) };
  delete result.counters_json;
  delete result.error_json;
  return result;
}

function previewFromRow(row) {
  if (!row) return null;
  const result = { ...row, patch: parseJson(row.patch_json) };
  delete result.patch_json;
  return result;
}

function auditFromRow(row) {
  const result = {
    ...row,
    before: parseJson(row.before_json),
    after: parseJson(row.after_json),
    readback: parseJson(row.readback_json),
  };
  delete result.before_json;
  delete result.after_json;
  delete result.readback_json;
  return result;
}

function mutationLeaseFromRow(row) {
  return row ? { ...row } : null;
}

function mutationLeaseString(value, field) {
  if (typeof value !== "string" || value.length === 0 || value.trim() !== value || value.length > 256 || /[\u0000-\u001f\u007f]/.test(value)) {
    fail("mutation_lease_input_invalid", "Mutation lease values must be normalized bounded strings", { field });
  }
  return value;
}

function translateSqliteError(error) {
  if (error instanceof ShortDramaError) return error;
  if (/\b(?:busy|locked)\b/i.test(String(error?.message))) {
    return new ShortDramaError("state_store_busy", "SQLite state store remained busy after 5 seconds");
  }
  return error;
}

function transitionCounters(data) {
  if (data.counters !== undefined) return data.counters;
  const counters = { ...data };
  for (const key of ["step", "now", "error"]) delete counters[key];
  return counters;
}

export class JobStore {
  constructor(path) {
    this.path = requiredString(path, "path");
    try {
      this.db = new DatabaseSync(this.path);
      this.db.exec("PRAGMA busy_timeout=5000; PRAGMA foreign_keys=ON; PRAGMA synchronous=FULL");
      if (this.path !== ":memory:") this.db.exec("PRAGMA journal_mode=WAL");
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS jobs (
          run_id TEXT PRIMARY KEY,
          trigger TEXT NOT NULL,
          actor_id TEXT,
          chat_id TEXT,
          state TEXT NOT NULL,
          step TEXT NOT NULL,
          started_at TEXT NOT NULL,
          finished_at TEXT,
          counters_json TEXT NOT NULL,
          error_json TEXT NOT NULL,
          notification_state TEXT NOT NULL,
          worker_pid INTEGER,
          lease_expires_at TEXT,
          attempt_count INTEGER NOT NULL DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS audit_events (
          event_id INTEGER PRIMARY KEY AUTOINCREMENT,
          run_id TEXT,
          actor_id TEXT,
          action TEXT NOT NULL,
          target_table TEXT,
          target_key TEXT,
          before_json TEXT NOT NULL,
          after_json TEXT NOT NULL,
          readback_json TEXT NOT NULL,
          created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS preview_receipts (
          receipt_id TEXT PRIMARY KEY,
          actor_id TEXT NOT NULL,
          chat_id TEXT NOT NULL,
          action TEXT NOT NULL,
          target_table TEXT NOT NULL,
          target_key TEXT,
          before_hash TEXT NOT NULL,
          patch_json TEXT NOT NULL,
          created_at TEXT NOT NULL,
          expires_at TEXT NOT NULL,
          used_at TEXT
        );
        CREATE TABLE IF NOT EXISTS health_alerts (
          alert_key TEXT PRIMARY KEY,
          state TEXT NOT NULL,
          created_at TEXT NOT NULL,
          sent_at TEXT,
          error TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS mutation_leases (
          lock_key TEXT PRIMARY KEY,
          owner_id TEXT NOT NULL,
          acquired_at TEXT NOT NULL,
          lease_expires_at TEXT NOT NULL
        );
      `);
    } catch (error) {
      try {
        this.db?.close();
      } catch {
        // Preserve the initialization failure.
      }
      throw translateSqliteError(error);
    }
  }

  immediate(operation) {
    let active = false;
    try {
      this.db.exec("BEGIN IMMEDIATE");
      active = true;
      const result = operation();
      this.db.exec("COMMIT");
      active = false;
      return result;
    } catch (error) {
      if (active) {
        try {
          this.db.exec("ROLLBACK");
        } catch {
          // Preserve the original failure.
        }
      }
      throw translateSqliteError(error);
    }
  }

  pragmas() {
    return {
      journal_mode: this.db.prepare("PRAGMA journal_mode").get().journal_mode,
      busy_timeout: this.db.prepare("PRAGMA busy_timeout").get().timeout,
      foreign_keys: this.db.prepare("PRAGMA foreign_keys").get().foreign_keys,
      synchronous: this.db.prepare("PRAGMA synchronous").get().synchronous,
    };
  }

  create({ runId, trigger, actorId, chatId, now = new Date() }) {
    const createdAt = timestamp(now);
    return this.immediate(() => {
      this.db.prepare(`
        INSERT INTO jobs(
          run_id, trigger, actor_id, chat_id, state, step, started_at, finished_at,
          counters_json, error_json, notification_state, worker_pid, lease_expires_at, attempt_count
        ) VALUES (?, ?, ?, ?, 'queued', 'queued', ?, NULL, ?, ?, 'pending', NULL, NULL, 0)
      `).run(
        requiredString(runId, "runId"),
        requiredString(trigger, "trigger"),
        optionalString(actorId, "actorId"),
        optionalString(chatId, "chatId"),
        createdAt,
        JSON.stringify({}),
        JSON.stringify({})
      );
      return this.get(runId);
    });
  }

  get(runId) {
    return jobFromRow(this.db.prepare("SELECT * FROM jobs WHERE run_id = ?").get(requiredString(runId, "runId")));
  }

  listActive() {
    return this.db.prepare(`
      SELECT * FROM jobs
      WHERE state IN ('queued', 'running')
      ORDER BY started_at, run_id
    `).all().map(jobFromRow);
  }

  transition(runId, state, data = {}) {
    const targetState = requiredString(state, "state");
    if (!JOB_STATES.has(targetState)) fail("job_state_invalid", "Unknown job state", { state: targetState });
    const changedAt = timestamp(data.now ?? new Date());
    return this.immediate(() => {
      const current = this.get(runId);
      if (!current) fail("job_not_found", "Job was not found", { run_id: runId });
      if (TERMINAL_STATES.has(current.state)) {
        fail("job_terminal_immutable", "Job terminal state is immutable", { run_id: runId, state: current.state });
      }
      const allowed =
        (current.state === "queued" && targetState === "running") ||
        (current.state === "running" && (targetState === "running" || TERMINAL_STATES.has(targetState)));
      if (!allowed) {
        fail("job_transition_invalid", "Job state transition is not allowed", {
          run_id: runId,
          from: current.state,
          to: targetState,
        });
      }
      const terminal = TERMINAL_STATES.has(targetState);
      const counters = targetState === "running" && data.counters === undefined
        ? current.counters
        : transitionCounters(data);
      const error = data.error ?? (targetState === "running" ? current.error : {});
      const step = data.step ?? (terminal ? targetState : current.step);
      this.db.prepare(`
        UPDATE jobs
        SET state = ?, step = ?, finished_at = ?, counters_json = ?, error_json = ?,
            worker_pid = CASE WHEN ? THEN NULL ELSE worker_pid END,
            lease_expires_at = CASE WHEN ? THEN NULL ELSE lease_expires_at END
        WHERE run_id = ?
      `).run(
        targetState,
        step,
        terminal ? changedAt : null,
        JSON.stringify(counters),
        JSON.stringify(error),
        terminal ? 1 : 0,
        terminal ? 1 : 0,
        runId
      );
      return this.get(runId);
    });
  }

  appendAudit({
    runId,
    actorId,
    action,
    targetTable,
    targetKey,
    before = {},
    after = {},
    readback = {},
    now = new Date(),
  }) {
    return this.immediate(() => {
      const result = this.db.prepare(`
        INSERT INTO audit_events(
          run_id, actor_id, action, target_table, target_key,
          before_json, after_json, readback_json, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        optionalString(runId, "runId"),
        optionalString(actorId, "actorId"),
        requiredString(action, "action"),
        optionalString(targetTable, "targetTable"),
        optionalString(targetKey, "targetKey"),
        JSON.stringify(before),
        JSON.stringify(after),
        JSON.stringify(readback),
        timestamp(now)
      );
      return auditFromRow(this.db.prepare("SELECT * FROM audit_events WHERE event_id = ?").get(result.lastInsertRowid));
    });
  }

  createPreview({
    receiptId,
    actorId,
    chatId,
    action,
    targetTable,
    targetKey,
    beforeHash,
    patch,
    now = new Date(),
  }) {
    const createdAt = timestamp(now);
    const expiresAt = futureTimestamp(createdAt, 15 * 60);
    return this.immediate(() => {
      this.db.prepare(`
        INSERT INTO preview_receipts(
          receipt_id, actor_id, chat_id, action, target_table, target_key,
          before_hash, patch_json, created_at, expires_at, used_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)
      `).run(
        requiredString(receiptId, "receiptId"),
        requiredString(actorId, "actorId"),
        requiredString(chatId, "chatId"),
        requiredString(action, "action"),
        requiredString(targetTable, "targetTable"),
        optionalString(targetKey, "targetKey"),
        requiredString(beforeHash, "beforeHash"),
        JSON.stringify(patch),
        createdAt,
        expiresAt
      );
      return this.getPreview(receiptId);
    });
  }

  getPreview(receiptId) {
    return previewFromRow(
      this.db.prepare("SELECT * FROM preview_receipts WHERE receipt_id = ?").get(requiredString(receiptId, "receiptId"))
    );
  }

  consumePreview(receiptId, { actorId, chatId, beforeHash, now = new Date() }) {
    const usedAt = timestamp(now);
    return this.immediate(() => {
      const receipt = this.getPreview(receiptId);
      if (!receipt) fail("preview_not_found", "Preview receipt was not found", { receipt_id: receiptId });
      if (receipt.actor_id !== actorId) fail("preview_actor_mismatch", "Preview actor does not match");
      if (receipt.chat_id !== chatId) fail("preview_chat_mismatch", "Preview chat does not match");
      if (receipt.used_at) fail("preview_used", "Preview receipt was already used");
      if (new Date(usedAt).getTime() >= new Date(receipt.expires_at).getTime()) {
        fail("preview_expired", "Preview receipt has expired");
      }
      if (receipt.before_hash !== beforeHash) fail("preview_stale", "Preview target is stale");
      this.db.prepare("UPDATE preview_receipts SET used_at = ? WHERE receipt_id = ? AND used_at IS NULL")
        .run(usedAt, receiptId);
      return this.getPreview(receiptId);
    });
  }

  acquireMutationLease({ lockKey, ownerId, now = new Date(), leaseSeconds = 300 } = {}) {
    const key = mutationLeaseString(lockKey, "lockKey");
    const owner = mutationLeaseString(ownerId, "ownerId");
    const acquiredAt = timestamp(now);
    const expiresAt = futureTimestamp(acquiredAt, leaseSeconds);
    return this.immediate(() => {
      const existing = mutationLeaseFromRow(
        this.db.prepare("SELECT * FROM mutation_leases WHERE lock_key = ?").get(key)
      );
      if (existing && new Date(existing.lease_expires_at).getTime() > new Date(acquiredAt).getTime()) return null;
      this.db.prepare(`
        INSERT INTO mutation_leases(lock_key, owner_id, acquired_at, lease_expires_at)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(lock_key) DO UPDATE SET
          owner_id = excluded.owner_id,
          acquired_at = excluded.acquired_at,
          lease_expires_at = excluded.lease_expires_at
      `).run(key, owner, acquiredAt, expiresAt);
      return mutationLeaseFromRow(
        this.db.prepare("SELECT * FROM mutation_leases WHERE lock_key = ?").get(key)
      );
    });
  }

  renewMutationLease({ lockKey, ownerId, now = new Date(), leaseSeconds = 300 } = {}) {
    const key = mutationLeaseString(lockKey, "lockKey");
    const owner = mutationLeaseString(ownerId, "ownerId");
    const renewedAt = timestamp(now);
    const expiresAt = futureTimestamp(renewedAt, leaseSeconds);
    return this.immediate(() => {
      const result = this.db.prepare(`
        UPDATE mutation_leases
        SET lease_expires_at = ?
        WHERE lock_key = ? AND owner_id = ?
          AND julianday(lease_expires_at) > julianday(?)
      `).run(expiresAt, key, owner, renewedAt);
      if (result.changes !== 1) {
        fail("mutation_lease_mismatch", "Mutation lease is expired or owned by another worker", { lock_key: key });
      }
      return mutationLeaseFromRow(
        this.db.prepare("SELECT * FROM mutation_leases WHERE lock_key = ?").get(key)
      );
    });
  }

  releaseMutationLease({ lockKey, ownerId } = {}) {
    const key = mutationLeaseString(lockKey, "lockKey");
    const owner = mutationLeaseString(ownerId, "ownerId");
    return this.immediate(() => this.db.prepare(
      "DELETE FROM mutation_leases WHERE lock_key = ? AND owner_id = ?"
    ).run(key, owner).changes === 1);
  }

  claimNext({ workerPid, now = new Date(), leaseSeconds = 120 }) {
    if (!Number.isSafeInteger(workerPid) || workerPid <= 0) {
      fail("worker_pid_invalid", "Worker PID must be a positive safe integer", { worker_pid: workerPid });
    }
    const claimedAt = timestamp(now);
    const leaseExpiresAt = futureTimestamp(claimedAt, leaseSeconds);
    return this.immediate(() => {
      this.db.prepare(`
        UPDATE jobs
        SET state = 'failed', step = 'failed', finished_at = ?,
            error_json = ?, notification_state = 'pending', worker_pid = NULL, lease_expires_at = NULL
        WHERE state = 'running'
          AND lease_expires_at IS NOT NULL
          AND julianday(lease_expires_at) <= julianday(?)
          AND attempt_count >= 2
      `).run(
        claimedAt,
        JSON.stringify({ code: "worker_crash_retries_exhausted" }),
        claimedAt
      );
      const candidate = this.db.prepare(`
        SELECT run_id
        FROM jobs
        WHERE state = 'queued'
           OR (
             state = 'running'
             AND lease_expires_at IS NOT NULL
             AND julianday(lease_expires_at) <= julianday(?)
             AND attempt_count < 2
           )
        ORDER BY started_at, run_id
        LIMIT 1
      `).get(claimedAt);
      if (!candidate) return null;
      this.db.prepare(`
        UPDATE jobs
        SET state = 'running', step = 'collector', worker_pid = ?, lease_expires_at = ?,
            attempt_count = attempt_count + 1
        WHERE run_id = ?
      `).run(workerPid, leaseExpiresAt, candidate.run_id);
      return this.get(candidate.run_id);
    });
  }

  renewLease(runId, { workerPid, now = new Date(), leaseSeconds = 120 }) {
    const renewedAt = timestamp(now);
    const leaseExpiresAt = futureTimestamp(renewedAt, leaseSeconds);
    return this.immediate(() => {
      const result = this.db.prepare(`
        UPDATE jobs
        SET lease_expires_at = ?
        WHERE run_id = ? AND state = 'running' AND worker_pid = ?
          AND lease_expires_at IS NOT NULL
          AND julianday(lease_expires_at) > julianday(?)
      `).run(leaseExpiresAt, requiredString(runId, "runId"), workerPid, renewedAt);
      if (result.changes !== 1) {
        fail("worker_claim_mismatch", "Job is not owned by this worker", { run_id: runId, worker_pid: workerPid });
      }
      return this.get(runId);
    });
  }

  finishClaim(runId, {
    workerPid,
    state,
    counters = {},
    error = {},
    step,
    now = new Date(),
  }) {
    const targetState = requiredString(state, "state");
    if (!TERMINAL_STATES.has(targetState)) {
      fail("job_terminal_state_invalid", "Claim must finish in a terminal state", { state: targetState });
    }
    const finishedAt = timestamp(now);
    return this.immediate(() => {
      const result = this.db.prepare(`
        UPDATE jobs
        SET state = ?, step = ?, finished_at = ?, counters_json = ?, error_json = ?,
            worker_pid = NULL, lease_expires_at = NULL
        WHERE run_id = ? AND state = 'running' AND worker_pid = ?
          AND lease_expires_at IS NOT NULL
          AND julianday(lease_expires_at) > julianday(?)
      `).run(
        targetState,
        step ?? targetState,
        finishedAt,
        JSON.stringify(counters),
        JSON.stringify(error),
        requiredString(runId, "runId"),
        workerPid,
        finishedAt
      );
      if (result.changes !== 1) {
        fail("worker_claim_mismatch", "Job is not owned by this worker", { run_id: runId, worker_pid: workerPid });
      }
      return this.get(runId);
    });
  }

  listUndeliveredTerminal() {
    return this.db.prepare(`
      SELECT * FROM jobs
      WHERE state IN ('success', 'partial', 'failed') AND notification_state != 'sent'
      ORDER BY finished_at, run_id
    `).all().map(jobFromRow);
  }

  markNotification(runId, state) {
    const notificationState = requiredString(state, "state");
    if (!NOTIFICATION_STATES.has(notificationState)) {
      fail("notification_state_invalid", "Unknown notification state", { state: notificationState });
    }
    return this.immediate(() => {
      const result = this.db.prepare(`
        UPDATE jobs
        SET notification_state = ?
        WHERE run_id = ? AND state IN ('success', 'partial', 'failed')
      `).run(notificationState, requiredString(runId, "runId"));
      if (result.changes !== 1) fail("job_not_terminal", "Only terminal jobs can update notification state", { run_id: runId });
      return this.get(runId);
    });
  }

  claimHealthAlert(alertKey, now = new Date()) {
    const key = requiredString(alertKey, "alertKey");
    if (!/^missing-terminal:\d{4}-\d{2}-\d{2}$/.test(key)) {
      fail("health_alert_key_invalid", "Health alert key must use the missing-terminal Beijing-date format", {
        alert_key: key,
      });
    }
    return this.immediate(() => {
      const result = this.db.prepare(`
        INSERT INTO health_alerts(alert_key, state, created_at, sent_at, error)
        VALUES (?, 'claimed', ?, NULL, '')
        ON CONFLICT(alert_key) DO NOTHING
      `).run(key, timestamp(now));
      return result.changes === 1;
    });
  }

  close() {
    this.db.close();
  }
}
