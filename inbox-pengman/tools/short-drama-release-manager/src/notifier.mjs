import { ShortDramaError } from "./errors.mjs";

const TERMINAL_STATES = new Set(["success", "partial", "failed"]);
const COUNTER_NAMES = Object.freeze([
  "accounts_updated",
  "capture_rows_upserted",
  "releases_linked",
  "manual_fields_changed_by_sync",
  "errors",
]);
const CODE_PATTERN = /^[a-z][a-z0-9_]{0,63}$/;

function fail(code, message, details = {}) {
  throw new ShortDramaError(code, message, details);
}

function normalizedString(value) {
  return typeof value === "string" && value.length > 0 && value.trim() === value && value.length <= 256;
}

function normalizedAllowlist(value) {
  if (!(value instanceof Set) || value.size === 0) return null;
  const result = new Set();
  for (const item of value) {
    if (!normalizedString(item)) return null;
    result.add(item);
  }
  return result;
}

function counter(value) {
  return Number.isSafeInteger(value) && value >= 0 ? value : 0;
}

function errorCodes(job) {
  const candidates = [
    job?.error?.code,
    ...(Array.isArray(job?.error?.errors) ? job.error.errors.map((item) => item?.code) : []),
  ];
  return [...new Set(candidates.filter((code) => typeof code === "string" && CODE_PATTERN.test(code)))].slice(0, 10);
}

function nextStep(state) {
  if (state === "success") return "none";
  if (state === "partial") return "review_errors_and_retry";
  return "fix_error_and_retry";
}

function terminalMessage(job) {
  const counters = job.counters ?? {};
  const errors = errorCodes(job);
  const lines = [
    `run_id=${job.run_id}`,
    `state=${job.state}`,
    ...COUNTER_NAMES.map((name) => `${name}=${counter(counters[name])}`),
    `error_codes=${errors.length > 0 ? errors.join(",") : "none"}`,
    `next_step=${nextStep(job.state)}`,
  ];
  return lines.join("\n").slice(0, 2_000);
}

export class ShortDramaNotifier {
  #allowedChatIds;
  #sendMessage;
  #jobs;

  constructor({ allowedChatIds, sendMessage, jobs } = {}) {
    const allowlist = normalizedAllowlist(allowedChatIds);
    if (!allowlist || typeof sendMessage !== "function" || !jobs ||
        typeof jobs.get !== "function" || typeof jobs.markNotification !== "function") {
      fail("notifier_config_invalid", "Short-drama notifier configuration is invalid");
    }
    this.#allowedChatIds = allowlist;
    this.#sendMessage = sendMessage;
    this.#jobs = jobs;
  }

  async sendTerminal(job) {
    const runId = normalizedString(job?.run_id) ? job.run_id : null;
    const persisted = runId ? this.#jobs.get(runId) : null;
    if (!persisted || persisted.run_id !== runId || !TERMINAL_STATES.has(persisted.state)) {
      fail("notification_job_invalid", "Notification requires a persisted terminal job");
    }
    const failed = (code) => {
      try {
        this.#jobs.markNotification(runId, "failed");
      } catch {
        fail("notification_state_persist_failed", "Notification failure state could not be persisted", { run_id: runId });
      }
      return { run_id: runId, state: persisted.state, notification_state: "failed", error: { code } };
    };
    if (!normalizedString(persisted.chat_id) || !this.#allowedChatIds.has(persisted.chat_id)) {
      return failed("notification_target_denied");
    }
    try {
      await this.#sendMessage({ chatId: persisted.chat_id, text: terminalMessage(persisted) });
      this.#jobs.markNotification(runId, "sent");
      return { run_id: runId, state: persisted.state, notification_state: "sent" };
    } catch {
      return failed("notification_delivery_failed");
    }
  }
}
