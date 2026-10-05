#!/usr/bin/env node
import { execFileSync, spawn } from "node:child_process";
import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import { constants as fsConstants, lstatSync, readFileSync } from "node:fs";
import { lstat, open, readFile, realpath } from "node:fs/promises";
import { homedir, userInfo } from "node:os";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import { isDeepStrictEqual } from "node:util";

import { captureAccountUsernames, captureYieldedNothing, isExpiredPost, registeredCaptureTargets, validateExcludedPostIds, validateMaxPostAgeDays } from "./src/capture-policy.mjs";
import { queryAnalyticsReport } from "./src/analytics-query.mjs";
import { ANALYTICS_TABLES } from "./src/analytics.mjs";
import { projectAnalytics } from "./src/analytics-projection.mjs";
import { alertText, boundedAlert, boundedAlertText, captureIncompleteLines, captureReportCutoff, CAPTURE_REPORT_GRACE_HOURS, describeIntegrityIssue, DRAIN_FAILURE_ALERT_THRESHOLD, isAlertRerouted, markIntegrityReported, pendingIntegrityIssues, readDrainHealth, recordDrainOutcome, setAlertRerouted } from "./src/pipeline-health.mjs";
import { buildCaptureReport } from "./src/capture-report.mjs";
import { captureSlots, nextCaptureAfter, retryDeadlineOfRun, slotAt, slotOfRun } from "./src/schedule-slots.mjs";
import { DAILY_VIEWS_TABLE, projectDailyViews } from "./src/daily-views.mjs";
import { BaseRepositories } from "./src/base-repositories.mjs";
import { planGoogleReconciliation, applyGoogleReconciliation, createGoogleReconciliationWriter, reconciliationDigest, assertNoUnresolvedReconciliation, recoverGoogleReconciliation, prepareSchemaCheckpointContext, reconciliationJournal, reconciliationSourceDigest } from "./src/google-reconciliation.mjs";
import { loadRuntimeConfig, loadRuntimeEnvironment } from "./src/config.mjs";
import { ShortDramaError, toErrorResult } from "./src/errors.mjs";
import { createTenantTokenProvider, FeishuClient, fixedFieldDescriptor, fixedTerminalDashboardBlockDescriptor } from "./src/feishu-client.mjs";
import { readGoogleMigrationSource } from "./src/google-source.mjs";
import { HumanOpsService } from "./src/human-ops.mjs";
import { processScheduleRepairs } from "./src/batch-schedule-repair.mjs";
import { processBatchMetadataRepairs } from "./src/batch-metadata-repair.mjs";
import { processDuplicateRelationRepairs } from "./src/duplicate-relation-repair.mjs";
import { processAutomaticBatchMatches } from "./src/batch-auto-match.mjs";
import { stageCaptionBackfillPlan, applyCaptionBackfill, processContinuousCaptionReleases, processCaptionRepair, captionRepositories } from "./src/caption-backfill.mjs";
import { BatchOpsService } from "./src/release-batches.mjs";
import { processBatchReviews, createBatchReviewSender } from "./src/batch-review-notifier.mjs";
import { processCaptionOwnerNotifications, processCaptionAutomationNotifications } from "./src/caption-owner-notifier.mjs";
import { processBeidouPool } from "./src/beidou-pool.mjs";
import { findBeidouCandidates, chooseBeidouCandidate } from "./src/beidou-catalog.mjs";
import { beidouLanguageName, beidouPlatformName, beidouDatePart } from "./src/beidou-enrichment.mjs";
import { planBeidouFields, applyBeidouFields } from "./src/beidou-schema.mjs";
import { queryReleaseCandidates } from "./src/match-candidates.mjs";
import { matchReleaseDirect } from "./src/direct-match.mjs";
import { allocateBusinessId, makeRunId, seedBusinessIdSequence } from "./src/ids.mjs";
import { JobStore, SCHEDULE_MAX_ATTEMPTS, SCHEDULE_RETRY_DELAY_MINUTES } from "./src/job-store.mjs";
import {
  MIGRATION_ARTIFACT_ROOT,
  MAX_MIGRATION_ARTIFACT_BYTES,
  applyMigration,
  canaryReceiptDigest,
  createPermissionAttestation,
  manifestDigest,
  migrationSourceRevision,
  permissionAttestationDigest,
  planMigration,
  schemaReceiptDigest,
  reserveMigrationArtifact,
  verificationDigest,
  verifyMigration,
} from "./src/migration.mjs";
import { ShortDramaNotifier } from "./src/notifier.mjs";
import { readLatestAccounts, readLatestPosts } from "./src/source-sqlite.mjs";
import { BASE_FIELD_SPECS, TABLE_ORDER, TABLES } from "./src/schema.mjs";
import { getSyncStatus, runSyncWorker, startSyncJob } from "./src/sync-runner.mjs";

const LABEL = "com.gengrowth.shortdrama-sync";
const DEFAULT_CAPABILITY_PATH = resolve(homedir(), "Library/Application Support/GenGrowth/shortdrama-sync/internal.capability");
const MAX_PAYLOAD_BYTES = 1024 * 1024;
const MAX_SOCIAL_HEREDOC_BYTES = 64 * 1024;
const TERMINAL = new Set(["success", "partial", "failed"]);
const UNSAFE_KEYS = new Set(["__proto__", "prototype", "constructor"]);
const SCRIPT_PATH = fileURLToPath(import.meta.url);
export const SOCIAL_RUNTIME_CONFIG_PATH = resolve(dirname(SCRIPT_PATH), "shortdrama.runtime.json");
export const ALLOWED_HERMES_PROFILES = Object.freeze(["default", "social", "pm", "ops"]);
const ALLOWED_HERMES_PROFILE_SET = new Set(ALLOWED_HERMES_PROFILES);

const REGISTRY = Object.freeze({
  doctor: Object.freeze({ null: ["config", "canary", "init-state", "beidou-fields", "confirm", "actor-id", "expected-base-token", "manifest", "expected-sha256", "output"] }),
  migrate: Object.freeze({
    "reconcile-recover": ["config", "baseline", "expected-baseline-sha256", "actor-id", "expected-base-token", "manifest", "expected-sha256", "output"],
    "reconcile-checkpoint-plan": ["config", "baseline", "expected-baseline-sha256", "actor-id", "expected-base-token", "manifest", "expected-sha256", "output"],
    "reconcile-plan": ["config", "baseline", "expected-baseline-sha256", "actor-id", "expected-base-token", "output"],
    "reconcile-apply": ["config", "baseline", "expected-baseline-sha256", "actor-id", "expected-base-token", "manifest", "expected-sha256", "confirm", "output"],
    plan: ["config", "output", "actor-id", "chat-id", "expected-base-token"],
    "attest-permissions": ["config", "manifest", "expected-sha256", "schema-receipt", "expected-schema-receipt-sha256", "observations", "expected-observations-file-sha256", "output", "actor-id", "expected-base-token"],
    apply: ["config", "manifest", "expected-sha256", "schema-receipt", "expected-schema-receipt-sha256", "canary-receipt", "expected-canary-sha256", "permission-attestation", "expected-permission-attestation-sha256", "expected-permission-attestation-file-sha256", "verification", "expected-verification-sha256", "output", "phase", "resume-partial-data", "actor-id", "chat-id", "confirm", "expected-base-token"],
    verify: ["config", "manifest", "output", "actor-id", "chat-id", "expected-base-token"],
  }),
  account: Object.freeze({
    list: ["config", "actor-id", "chat-id"], get: ["config", "key", "actor-id", "chat-id"],
  }),
  capture: Object.freeze({
    list: ["config", "actor-id", "chat-id"], get: ["config", "key", "actor-id", "chat-id"],
  }),
  pool: Object.freeze({
    list: ["config", "payload", "actor-id", "chat-id"], get: ["config", "key", "payload", "actor-id", "chat-id"], create: ["config", "payload", "actor-id", "chat-id"],
    "beidou-search": ["config", "payload"],
    "update-field": ["config", "payload", "actor-id", "chat-id"],
    "preview-update": ["config", "payload", "actor-id", "chat-id"], "preview-batch": ["config", "payload", "actor-id", "chat-id"], "apply-update": ["config", "payload", "actor-id", "chat-id"], "apply-direct": ["config", "payload", "actor-id", "chat-id"],
    "preview-archive": ["config", "key", "payload", "actor-id", "chat-id"], "apply-archive": ["config", "payload", "actor-id", "chat-id"],
  }),
  release: Object.freeze({
    batches: ["config", "key", "actor-id", "chat-id"],
    "batch-schedule": ["config", "payload", "actor-id", "chat-id"],
    "batch-schedule-direct": ["config", "payload", "actor-id", "chat-id"],
    "batch-match-direct": ["config", "payload", "actor-id", "chat-id"],
    "batch-preview": ["config", "payload", "actor-id", "chat-id"],
    "batch-apply": ["config", "payload", "actor-id", "chat-id"],
    candidates: ["config", "key", "date", "actor-id", "chat-id"],
    "preview-match": ["config", "payload", "actor-id", "chat-id"],
    "match-direct": ["config", "payload", "actor-id", "chat-id"],
    list: ["config", "payload", "actor-id", "chat-id"], get: ["config", "key", "payload", "actor-id", "chat-id"], schedule: ["config", "payload", "actor-id", "chat-id"],
    "update-field": ["config", "payload", "actor-id", "chat-id"],
    "preview-update": ["config", "payload", "actor-id", "chat-id"], "preview-batch": ["config", "payload", "actor-id", "chat-id"], "apply-update": ["config", "payload", "actor-id", "chat-id"], "apply-direct": ["config", "payload", "actor-id", "chat-id"],
    "attach-post": ["config", "payload", "actor-id", "chat-id"],
  }),
  metrics: Object.freeze({ "by-drama": ["config", "actor-id", "chat-id", "key"], "by-account": ["config", "actor-id", "chat-id", "key"], daily: ["config", "actor-id", "chat-id", "date"], "daily-by-account": ["config", "actor-id", "chat-id", "date", "key"], "release-trend": ["config", "actor-id", "chat-id", "date"], "first-release-trend": ["config", "actor-id", "chat-id", "date"], quality: ["config", "actor-id", "chat-id"] }),
  sync: Object.freeze({ start: ["config", "actor-id", "chat-id"], status: ["config", "run-id", "actor-id", "chat-id"] }),
  schedule: Object.freeze({ tick: ["config"], health: ["config"] }),
  queue: Object.freeze({ drain: ["config"], project: ["config"] }),
});

const REQUIRED = Object.freeze({
  "migrate:reconcile-recover": ["baseline", "expectedBaselineSha256", "expectedBaseToken", "manifest", "expectedSha256"],
  "migrate:reconcile-checkpoint-plan": ["baseline", "expectedBaselineSha256", "expectedBaseToken", "manifest", "expectedSha256", "output"],
  "migrate:reconcile-plan": ["baseline", "expectedBaselineSha256", "expectedBaseToken", "output"],
  "migrate:reconcile-apply": ["baseline", "expectedBaselineSha256", "expectedBaseToken", "manifest", "expectedSha256"],
  "migrate:plan": ["output"],
  "migrate:apply": ["phase", "manifest", "expectedSha256"],
  "migrate:verify": ["manifest"],
  "migrate:attest-permissions": ["manifest", "expectedSha256", "schemaReceipt", "expectedSchemaReceiptSha256", "observations", "expectedObservationsFileSha256", "output", "expectedBaseToken"],
  "account:get": ["key"], "capture:get": ["key"], "pool:get": ["key"], "release:get": ["key"],
  "sync:status": ["runId"],
});

function fail(code, message, details = {}) {
  throw new ShortDramaError(code, message, details);
}

function camel(name) {
  return name.replace(/-([a-z])/g, (_all, char) => char.toUpperCase());
}

function normalized(value, field = "value") {
  if (typeof value !== "string" || value.length === 0 || value.trim() !== value || value.length > 4_096 || /[\u0000-\u001f\u007f]/.test(value)) {
    fail("input_invalid", "CLI value must be a normalized bounded string", { field });
  }
  return value;
}

export function parseCommand(argv) {
  if (!Array.isArray(argv) || argv.length === 0 || argv.some((item) => typeof item !== "string")) {
    fail("command_not_allowed", "A registered command is required");
  }
  const group = argv[0];
  const groupSpec = REGISTRY[group];
  if (!groupSpec) fail("command_not_allowed", "Command group is not registered", { group });
  const action = group === "doctor" ? null : argv[1];
  const allowed = groupSpec[String(action)];
  if (!allowed) fail("command_not_allowed", "Command action is not registered", { group, action: action ?? null });
  const start = group === "doctor" ? 1 : 2;
  const options = {};
  for (let index = start; index < argv.length; index += 2) {
    const flag = argv[index];
    if (!/^--[a-z][a-z0-9-]*$/.test(flag) || !allowed.includes(flag.slice(2))) {
      fail("input_invalid", "CLI option is not allowed", { option: flag ?? null });
    }
    const key = camel(flag.slice(2));
    if (Object.hasOwn(options, key)) fail("input_invalid", "Duplicate CLI option is not allowed", { option: flag });
    if (["--canary", "--init-state", "--beidou-fields"].includes(flag)) {
      if (argv[index + 1] !== undefined && !argv[index + 1].startsWith("--")) fail("input_invalid", "Boolean CLI flag does not accept a value", { option: flag });
      options[key] = true;
      index -= 1;
      continue;
    }
    const value = argv[index + 1];
    if (value === undefined || value.startsWith("--")) fail("input_invalid", "CLI option requires a value", { option: flag });
    options[key] = normalized(value, key);
  }
  const command = { group, action, options };
  for (const key of REQUIRED[`${group}:${action}`] ?? []) {
    if (!Object.hasOwn(options, key)) fail("input_invalid", "Required CLI option is missing", { option: key });
  }
  if (options.phase && !["schema", "data", "presentation", "sequences"].includes(options.phase)) {
    fail("input_invalid", "Migration phase is invalid", { phase: options.phase });
  }
  if (Object.hasOwn(options, "resumePartialData") &&
      (options.resumePartialData !== "manifest-subset" || options.phase !== "data")) {
    fail("input_invalid", "Partial-data resume is limited to the data-phase manifest subset", { option: "resume-partial-data" });
  }
  if (options.output && (!/^[A-Za-z0-9][A-Za-z0-9._-]*\.json$/.test(options.output) || options.output.includes(".."))) {
    fail("input_invalid", "Migration output must be a safe JSON file name in the fixed evidence directory", { option: "output" });
  }
  if (group === "doctor" && options.canary && options.initState) fail("input_invalid", "doctor --canary and --init-state are mutually exclusive");
  if (group === "doctor" && options.beidouFields) {
    if (options.canary || options.initState || options.manifest || options.output ||
        options.confirm !== undefined && options.confirm !== "apply-now" ||
        options.confirm && !/^[a-f0-9]{64}$/.test(options.expectedSha256 ?? ""))
      fail("input_invalid", "Beidou field maintenance accepts only a plan or digest-bound apply");
  } else if (group === "doctor" && options.confirm !== undefined) {
    fail("input_invalid", "doctor --confirm is reserved for Beidou field maintenance");
  }
  if (group === "doctor" && options.canary &&
      ["manifest", "expectedSha256", "expectedBaseToken", "output"].some((key) => !Object.hasOwn(options, key))) {
    fail("input_invalid", "doctor --canary requires manifest, independent digests/Base target, and fixed-root output", {
      option: "canary_evidence",
    });
  }
  return command;
}

function isInternal(command) {
  return command.group === "schedule" || command.group === "queue";
}

function readInstalledCapability(capabilityPath) {
  const path = resolve(capabilityPath);
  let info;
  let value;
  try {
    info = lstatSync(path);
    if (info.isSymbolicLink() || !info.isFile() || (info.mode & 0o777) !== 0o600 || info.size < 64 || info.size > 128) {
      fail("internal_capability_invalid", "Internal capability file is not a private regular file");
    }
    value = readFileSync(path, { encoding: "utf8", flag: fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW }).trim();
  } catch (error) {
    if (error instanceof ShortDramaError) throw error;
    fail("internal_capability_invalid", "Internal capability file is unavailable");
  }
  if (!/^[a-f0-9]{64}$/.test(value)) fail("internal_capability_invalid", "Internal capability is malformed");
  return value;
}

function localActorRequired(command) {
  return command.group === "migrate" || command.group === "doctor";
}

export function readMacProcessRow(pid, { execFile = execFileSync } = {}) {
  if (!Number.isSafeInteger(pid) || pid <= 1 || typeof execFile !== "function") return null;
  const read = (column) => execFile("/bin/ps", ["-ww", "-p", String(pid), "-o", `${column}=`], {
    encoding: "utf8", timeout: 1_000, maxBuffer: 64 * 1024,
  }).trim();
  const ppid = Number(read("ppid"));
  const command = read("comm");
  const args = read("args");
  if (!Number.isSafeInteger(ppid) || ppid < 0 || command.length === 0) return null;
  return { pid, ppid, command, args };
}

export function inspectTrustedLocalInvoker({
  stdin = process.stdin,
  stdout = process.stdout,
  pid = process.pid,
  readProcess = readMacProcessRow,
  maxDepth = 16,
  username = null,
} = {}) {
  if (stdin?.isTTY !== true || stdout?.isTTY !== true || !Number.isSafeInteger(pid) || pid <= 1 ||
      typeof readProcess !== "function" || !Number.isSafeInteger(maxDepth) || maxDepth < 2 || maxDepth > 32) return false;
  const runnerExecutables = new Set(["node"]);
  const shellExecutables = new Set(["bash", "fish", "sh", "zsh"]);
  const terminalExecutables = new Set(["ghostty", "iterm2", "kitty", "terminal", "wezterm-gui"]);
  const seen = new Set();
  let current = pid;
  let expected = "runner";
  try {
    const currentUsername = username ?? userInfo().username;
    if (typeof currentUsername !== "string" || !/^[A-Za-z0-9._-]+$/.test(currentUsername)) return false;
    const terminalLoginArgs = `/usr/bin/login -flp ${currentUsername} /bin/bash --noprofile --norc -c exec -l /bin/zsh`;
    for (let depth = 0; depth < maxDepth && current > 1; depth += 1) {
      if (seen.has(current)) return false;
      seen.add(current);
      const row = readProcess(current);
      if (!row || row.pid !== current || !Number.isSafeInteger(row.ppid) || row.ppid < 0 ||
          typeof row.command !== "string" || typeof row.args !== "string") return false;
      const executable = row.command.split("/").pop().toLowerCase();
      if (expected === "runner") {
        if (!runnerExecutables.has(executable)) return false;
        expected = "shell_or_terminal";
      } else if (expected === "shell_or_terminal") {
        if (terminalExecutables.has(executable)) return row.ppid === 1;
        if (shellExecutables.has(executable)) {
          // Continue through the user's login shell.
        } else if (row.command === "/usr/bin/login" && row.args === terminalLoginArgs) {
          expected = "terminal";
        } else return false;
      } else if (expected === "terminal") {
        if (terminalExecutables.has(executable)) return row.ppid === 1;
        return false;
      } else return false;
      if (row.ppid <= 1) return false;
      current = row.ppid;
    }
  } catch {
    return false;
  }
  return false;
}

function exactProcessRow(row, pid) {
  // Return a strict boolean: a missing row must read as false, not undefined, so callers
  // can compare against false as well as against true.
  return row !== null && row !== undefined && row.pid === pid && Number.isSafeInteger(row.ppid) && row.ppid >= 0 &&
    typeof row.command === "string" && row.command.startsWith("/") && typeof row.args === "string";
}

function exactRunnerProcessRow(row, pid) {
  return row !== null && row !== undefined && row.pid === pid &&
    Number.isSafeInteger(row.ppid) && row.ppid >= 0 &&
    typeof row.command === "string" && row.command.length > 0 &&
    typeof row.args === "string";
}

function safeDirectToken(value) {
  return typeof value === "string" && value.length > 0 && !/[\s'"\\;$&|<>`()]/.test(value);
}

function directNodeInvocation(row, { nodePath, runnerPath, argv }) {
  if (!exactRunnerProcessRow(row, row?.pid)) return false;
  const nodeBasename = resolve(nodePath).split("/").pop();
  const nodeCommandMatches = row.command === nodeBasename ||
    row.command.startsWith("/") && resolve(row.command) === resolve(nodePath);
  if (!nodeCommandMatches) return false;
  const tokens = row.args.trim().split(/\s+/);
  if (tokens.length !== argv.length + 2 || !["node", nodePath].includes(tokens[0]) ||
      resolve(tokens[1]) !== resolve(runnerPath)) return false;
  return argv.every((value, index) => tokens[index + 2] === value);
}

function hermesCachePath(value, kind, sessionId = null, profile = "social") {
  if (!isAbsolute(value) || resolve(value) !== value) return null;
  const basenamePattern = kind === "snapshot"
    ? /^hermes-snap-([a-f0-9]{12})\.sh$/
    : /^hermes-cwd-([a-f0-9]{12})\.txt$/;
  const name = value.split("/").pop();
  const match = basenamePattern.exec(name);
  if (!match || sessionId !== null && match[1] !== sessionId) return null;
  const directory = dirname(value);
  const profileSuffix = profile === "default" ? "" : `/profiles/${profile}`;
  const profileDirectory = ALLOWED_HERMES_PROFILE_SET.has(profile) &&
    new RegExp(`^/Users/[^/]+/\\.hermes${profileSuffix}/cache/terminal$`).test(directory);
  const allowedDirectory = profileDirectory ||
    /^\/(?:private\/)?var\/folders\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+\/T$/.test(directory);
  return allowedDirectory ? match[1] : null;
}

function decodeHermesSingleQuotedData(value) {
  let decoded = "";
  for (let index = 0; index < value.length; index += 1) {
    if (value[index] !== "'") {
      decoded += value[index];
      continue;
    }
    if (value.slice(index, index + 4) !== "'\\''") return null;
    decoded += "'";
    index += 3;
  }
  return decoded;
}

function exactHermesEval(lines, at, directCommand, payloadStdin) {
  if (!payloadStdin) return lines[at] === `eval '${directCommand}'` ? at + 1 : null;
  const expectedStart = `eval '${directCommand} <<'\\''SHORTDRAMA_PAYLOAD'\\''`;
  if (lines[at] !== expectedStart) return null;
  const closing = lines.indexOf("SHORTDRAMA_PAYLOAD'", at + 1);
  if (closing < 0) return null;
  const body = decodeHermesSingleQuotedData(lines.slice(at + 1, closing).join("\n"));
  if (body === null) return null;
  const bytes = Buffer.from(body, "utf8");
  if (bytes.length === 0 || bytes.length > MAX_SOCIAL_HEREDOC_BYTES || bytes.toString("utf8") !== body ||
      body.includes("\0") || body.includes("\uFFFD") || body.includes("$()") || /\$\(|`|<<\s*['"]?[A-Za-z_]/.test(body)) return null;
  try {
    const parsed = JSON.parse(body);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    assertSafeJson(parsed);
  } catch {
    return null;
  }
  return closing + 1;
}

function exactHermesShell(row, { directCommand, payloadStdin, profile = "social" }) {
  if (!exactProcessRow(row, row?.pid) || row.command.split("/").pop().toLowerCase() !== "bash") return false;
  let script;
  let login;
  for (const [prefix, candidateLogin] of [[`${row.command} -c `, false], [`${row.command} -l -c `, true]]) {
    if (row.args.startsWith(prefix)) {
      script = row.args.slice(prefix.length);
      if (!script.includes("\n")) script = script.replaceAll("\\012", "\n");
      login = candidateLogin;
      break;
    }
  }
  if (script === undefined) return false;
  const lines = script.split("\n");
  let at = 0;
  let snapshot = null;
  let sessionId = null;
  const source = /^source (\/\S+) >\/dev\/null 2>&1 \|\| true$/.exec(lines[0] ?? "");
  if (source) {
    snapshot = source[1];
    sessionId = hermesCachePath(snapshot, "snapshot", null, profile);
    if (!sessionId || login) return false;
    at += 1;
  } else if (!login) return false;
  if (snapshot !== null && lines[at] === 'export AI_AGENT="${AI_AGENT:-hermes-agent}" HERMES_AGENT="${HERMES_AGENT:-true}"') {
    at += 1;
    const cd = /^builtin cd -- (?:'([^'\r\n]+)'|(\/[^\s'"\\;|&<>`\r\n]*)) \|\| exit 126$/.exec(lines[at++] ?? "");
    const workingDirectory = cd?.[1] ?? cd?.[2];
    if (!workingDirectory || !isAbsolute(workingDirectory) || resolve(workingDirectory) !== workingDirectory) return false;
    const afterEval = exactHermesEval(lines, at, directCommand, payloadStdin);
    if (afterEval === null) return false;
    at = afterEval;
    if (lines[at++] !== "__hermes_ec=$?" || lines[at++] !== "umask 077") return false;
    const snapshotTemp = '"$__hermes_snap_tmp"';
    const atomicSnapshot = `__hermes_snap_tmp=$(mktemp ${snapshot}.tmp.XXXXXXXXXX) && { { ( unset \${!HERMES_SESSION_*} \${!HERMES_CRON_AUTO_DELIVER_*} AI_AGENT HERMES_AGENT HERMES_UI_SESSION_ID 2>/dev/null; export -p; ) || true; } > ${snapshotTemp} && mv -f ${snapshotTemp} ${snapshot}; } 2>/dev/null || rm -f ${snapshotTemp} 2>/dev/null || true`;
    if (lines[at++] !== atomicSnapshot) return false;
    if (lines[at++] !== `printf '\\n__HERMES_CWD_${sessionId}__%s__HERMES_CWD_${sessionId}__\\n' "$(pwd -P)"` ||
        lines[at++] !== "exit $__hermes_ec" || at !== lines.length) return false;
    return true;
  }
  const cd = /^builtin cd -- (?:'([^'\r\n]+)'|(\/[^\s'"\\;|&<>`\r\n]*)) \|\| exit 126$/.exec(lines[at++] ?? "");
  const workingDirectory = cd?.[1] ?? cd?.[2];
  if (!workingDirectory || !isAbsolute(workingDirectory) || resolve(workingDirectory) !== workingDirectory) return false;
  const afterEval = exactHermesEval(lines, at, directCommand, payloadStdin);
  if (afterEval === null) return false;
  at = afterEval;
  if (lines[at++] !== "__hermes_ec=$?" || lines[at++] !== "umask 077") return false;
  if (snapshot !== null) {
    const temp = `${snapshot}.tmp.$BASHPID`;
    if (lines[at++] !== `{ export -p > ${temp} && mv -f ${temp} ${snapshot}; } 2>/dev/null || rm -f ${temp} 2>/dev/null || true`) return false;
  }
  const cwd = /^pwd -P > (\/\S+) 2>\/dev\/null \|\| true$/.exec(lines[at++] ?? "");
  const cwdSession = cwd ? hermesCachePath(cwd[1], "cwd", sessionId, profile) : null;
  if (!cwdSession) return false;
  sessionId ??= cwdSession;
  if (lines[at++] !== `printf '\\n__HERMES_CWD_${sessionId}__%s__HERMES_CWD_${sessionId}__\\n' "$(pwd -P)"` ||
      lines[at++] !== "exit $__hermes_ec" || at !== lines.length) return false;
  return true;
}

function exactGatewayProcess(row, profile = "social") {
  if (!exactProcessRow(row, row?.pid) || !/^python(?:3(?:\.\d+)?)?$/.test(row.command.split("/").pop().toLowerCase())) return null;
  const tokens = row.args.trim().split(/\s+/);
  if (!ALLOWED_HERMES_PROFILE_SET.has(profile)) return null;
  const profileTokens = profile === "default" ? [] : ["--profile", profile];
  const expected = [row.command, "-m", "hermes_cli.main", ...profileTokens, "gateway", "run", "--replace", "--external-supervisor"];
  return tokens.length === expected.length && tokens.every((value, index) => value === expected[index]) ? tokens : null;
}

// launchd starts a stderr_timestamp supervisor, which execs the gateway with
// --external-supervisor. The supervisor is the launchd-rooted anchor, so it is part of
// the proof: verify its exact argv, that it re-states the gateway argv verbatim, and
// that it is the one whose parent is launchd.
function exactGatewayWrapper(row, gatewayTokens, profile = "social") {
  if (!exactProcessRow(row, row?.pid) || row.ppid !== 1 || row.command !== gatewayTokens[0]) return false;
  if (!ALLOWED_HERMES_PROFILE_SET.has(profile)) return false;
  const tokens = row.args.trim().split(/\s+/);
  const separator = tokens.indexOf("--");
  const profileSuffix = profile === "default" ? "" : `/profiles/${profile}`;
  const errorLog = new RegExp(`^/Users/[^/]+/\\.hermes${profileSuffix}/logs/gateway\\.error\\.log$`);
  if (separator !== 5 || tokens[0] !== row.command || tokens[1] !== "-m" || tokens[2] !== "hermes_cli.stderr_timestamp" ||
      tokens[3] !== "--error-log" || !errorLog.test(tokens[4])) return false;
  const child = tokens.slice(separator + 1);
  return child.length === gatewayTokens.length && child.every((value, index) => value === gatewayTokens[index]);
}

// `stages` is an optional out-parameter: on refusal it receives one coarse label naming the
// link of the chain that refused, so the caller can tell "your command is malformed" from
// "the gate no longer matches this host". It carries no argv, path, id or payload — the
// labels are a closed set: argv, payload, runner, shell, gateway.
export function inspectTrustedSocialInvoker({
  argv,
  command,
  configPath,
  profile = "social",
  pid = process.pid,
  readProcess = readMacProcessRow,
  runnerPath = SCRIPT_PATH,
  nodePath = process.execPath,
  stages = null,
} = {}) {
  const refuse = (stage) => {
    if (Array.isArray(stages) && stages.length === 0) stages.push(stage);
    return false;
  };
  if (!Array.isArray(argv) || argv.length < 2 || argv.some((value) => !safeDirectToken(value)) ||
      !ALLOWED_HERMES_PROFILE_SET.has(profile) ||
      !command || typeof configPath !== "string" || resolve(configPath) !== SOCIAL_RUNTIME_CONFIG_PATH && resolve(configPath) !== resolve(dirname(runnerPath), "shortdrama.runtime.json") ||
      !Number.isSafeInteger(pid) || pid <= 1 || typeof readProcess !== "function") return refuse("argv");
  const payloadIndexes = argv.flatMap((value, index) => value === "--payload" ? [index] : []);
  if (payloadIndexes.length > 1 || payloadIndexes.length === 1 && argv[payloadIndexes[0] + 1] !== "-") return refuse("payload");
  const payloadStdin = payloadIndexes.length === 1;
  const directCommand = `/usr/bin/env node ${resolve(runnerPath)} ${argv.join(" ")}`;
  try {
    const runner = readProcess(pid);
    if (!exactRunnerProcessRow(runner, pid) || !directNodeInvocation(runner, { nodePath, runnerPath, argv })) return refuse("runner");
    const shell = readProcess(runner.ppid);
    if (!exactProcessRow(shell, runner.ppid) || !exactHermesShell(shell, { directCommand, payloadStdin, profile })) return refuse("shell");
    const gateway = readProcess(shell.ppid);
    const gatewayTokens = exactProcessRow(gateway, shell.ppid) ? exactGatewayProcess(gateway, profile) : null;
    if (!gatewayTokens) return refuse("gateway");
    const wrapper = readProcess(gateway.ppid);
    if (!exactProcessRow(wrapper, gateway.ppid) || !exactGatewayWrapper(wrapper, gatewayTokens, profile)) return refuse("gateway");
    return true;
  } catch {
    return refuse("runner");
  }
}

export async function assertSocialRuntimeConfig(configPath, { expectedPath = SOCIAL_RUNTIME_CONFIG_PATH } = {}) {
  const expected = resolve(expectedPath);
  if (typeof configPath !== "string" || resolve(configPath) !== expected) {
    fail("social_config_invalid", "Social commands require the fixed production runtime config");
  }
  try {
    const [file, parent, resolvedFile, resolvedParent] = await Promise.all([
      lstat(expected), lstat(dirname(expected)), realpath(expected), realpath(dirname(expected)),
    ]);
    if (file.isSymbolicLink() || !file.isFile() || parent.isSymbolicLink() || !parent.isDirectory() ||
        resolvedFile !== expected || resolvedParent !== dirname(expected)) {
      fail("social_config_invalid", "Social runtime config path is unsafe");
    }
  } catch (error) {
    if (error instanceof ShortDramaError) throw error;
    fail("social_config_invalid", "Social runtime config is unavailable");
  }
}

export function resolveInvocationIdentity(command, env = {}, policy = {}) {
  const sessionKeys = ["HERMES_SESSION_PLATFORM", "HERMES_SESSION_PROFILE", "HERMES_SESSION_USER_ID", "HERMES_SESSION_CHAT_ID"];
  const hasSession = sessionKeys.some((key) => env[key] !== undefined);
  if (isInternal(command)) {
    if (hasSession) fail("social_command_denied", "Feishu Social sessions cannot invoke internal commands");
    if (command.options.actorId || command.options.chatId) fail("internal_context_invalid", "Internal commands reject actor overrides");
    const capabilityPath = policy.capabilityPath ?? DEFAULT_CAPABILITY_PATH;
    if (env.SHORTDRAMA_CAPABILITY_FILE !== capabilityPath || typeof env.SHORTDRAMA_INTERNAL_CAPABILITY !== "string") {
      fail("internal_context_required", "Internal command requires the installed launchd context");
    }
    const expected = Buffer.from(readInstalledCapability(capabilityPath));
    const presented = Buffer.from(env.SHORTDRAMA_INTERNAL_CAPABILITY);
    if (expected.length !== presented.length || !timingSafeEqual(expected, presented)) {
      fail("internal_context_required", "Internal command requires the installed launchd context");
    }
    return { mode: "internal", actorId: null, chatId: null, profile: null };
  }
  if (command.group === "doctor" && command.options.initState &&
      (env.SHORTDRAMA_CAPABILITY_FILE !== undefined || env.SHORTDRAMA_INTERNAL_CAPABILITY !== undefined)) {
    fail("local_only_required", "State initialization cannot run from an internal scheduler context");
  }
  if (hasSession) {
    if (["doctor", "migrate", "schedule", "queue"].includes(command.group)) {
      fail("social_command_denied", "Feishu Social sessions cannot invoke privileged or internal commands");
    }
    if (command.options.actorId || command.options.chatId) fail("session_identity_override", "Social session identity cannot be overridden");
    const profile = env.HERMES_SESSION_PROFILE;
    if (env.HERMES_SESSION_PLATFORM !== "feishu" || !ALLOWED_HERMES_PROFILE_SET.has(profile) ||
        !env.HERMES_SESSION_USER_ID || !env.HERMES_SESSION_CHAT_ID) {
      fail("session_identity_invalid", "A complete authorized Hermes Feishu session is required");
    }
    return {
      mode: "social", actorId: normalized(env.HERMES_SESSION_USER_ID, "actorId"),
      chatId: normalized(env.HERMES_SESSION_CHAT_ID, "chatId"), profile,
    };
  }
  if (["account", "capture", "pool", "release", "metrics"].includes(command.group) || command.group === "sync" && command.action === "start") {
    fail("social_session_required", "Business operations require a Feishu Social session");
  }
  if (command.options.chatId) fail("session_identity_override", "Local invocations cannot choose a notification chat");
  const actorId = command.options.actorId ?? null;
  if (localActorRequired(command)) {
    if (!actorId) fail("actor_required", "Privileged local action requires an explicit actor");
    if (typeof policy.isPrivilegedAllowed !== "function" || !policy.isPrivilegedAllowed(actorId)) {
      fail("privileged_required", "Local action requires a privileged actor", { actor: actorId });
    }
    if (typeof policy.isTrustedLocalInvoker !== "function" || policy.isTrustedLocalInvoker({ command, actorId }) !== true) {
      fail("local_invoker_untrusted", "Local admin actions require a standalone interactive human Terminal ancestry");
    }
  }
  return { mode: "local", actorId, chatId: null, profile: null };
}

function assertSafeJson(value, path = "$", seen = new WeakSet()) {
  if (value === null || typeof value === "string" || typeof value === "boolean") return;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) fail("payload_invalid", "Payload contains a non-finite number", { path });
    return;
  }
  if (typeof value !== "object") fail("payload_invalid", "Payload contains a non-JSON value", { path });
  if (seen.has(value)) fail("payload_invalid", "Payload must be acyclic", { path });
  const prototype = Object.getPrototypeOf(value);
  if (!Array.isArray(value) && prototype !== Object.prototype && prototype !== null) fail("payload_invalid", "Payload object prototype is unsafe", { path });
  seen.add(value);
  for (const key of Object.keys(value)) {
    if (UNSAFE_KEYS.has(key)) fail("payload_invalid", "Payload contains an unsafe property", { path });
    assertSafeJson(value[key], `${path}.${key}`, seen);
  }
  seen.delete(value);
}

function exactSingleFieldPayload(payload) {
  if (payload === null || typeof payload !== "object" || Array.isArray(payload) ||
      ![Object.prototype, null].includes(Object.getPrototypeOf(payload))) {
    fail("payload_invalid", "Single-field payload must be a plain object");
  }
  const descriptors = Object.getOwnPropertyDescriptors(payload);
  const keys = Reflect.ownKeys(payload);
  const expected = ["key", "field", "value"];
  if (keys.some((key) => typeof key !== "string") || keys.length !== expected.length ||
      expected.some((key) => !Object.hasOwn(descriptors, key)) ||
      Object.values(descriptors).some((descriptor) => descriptor.get || descriptor.set || !descriptor.enumerable || !("value" in descriptor))) {
    fail("payload_invalid", "Single-field payload must contain exactly key, field, and value");
  }
  assertSafeJson(payload);
  return {
    key: normalized(descriptors.key.value, "key"),
    field: normalized(descriptors.field.value, "field"),
    value: structuredClone(descriptors.value.value),
  };
}

function exactBatchPayload(payload) {
  if (payload === null || typeof payload !== "object" || Array.isArray(payload) ||
      ![Object.prototype, null].includes(Object.getPrototypeOf(payload)) ||
      Reflect.ownKeys(payload).length !== 1 || !Object.hasOwn(payload, "items") || !Array.isArray(payload.items)) {
    fail("payload_invalid", "Batch payload must contain exactly items");
  }
  assertSafeJson(payload);
  return { items: structuredClone(payload.items) };
}

function parsePayloadBytes(bytes, { maxBytes, tooLargeCode, tooLargeMessage }) {
  if (bytes.length > maxBytes) fail(tooLargeCode, tooLargeMessage);
  let value;
  try { value = JSON.parse(bytes.toString("utf8")); }
  catch { fail("payload_invalid", "Payload must be strict JSON"); }
  assertSafeJson(value);
  if (value === null || typeof value !== "object" || Array.isArray(value)) fail("payload_invalid", "Payload root must be an object");
  return value;
}

async function readBoundedStream(stream, limit) {
  const chunks = [];
  let size = 0;
  for await (const chunk of stream) {
    const bytes = Buffer.from(chunk);
    size += bytes.length;
    if (size > limit.maxBytes) fail(limit.tooLargeCode, limit.tooLargeMessage);
    chunks.push(bytes);
  }
  return Buffer.concat(chunks);
}

async function readPayloadWithLimit(source, {
  payloadRoot, stdin = process.stdin, openFile = open, includeBytes = false, allowStdin = true,
  maxBytes, tooLargeCode, tooLargeMessage,
} = {}) {
  if (source === undefined || source === null) return null;
  if (source === "-") {
    if (!allowStdin) fail("payload_path_invalid", "Migration evidence must be a fixed-root JSON file");
    const bytes = await readBoundedStream(stdin, { maxBytes, tooLargeCode, tooLargeMessage });
    const value = parsePayloadBytes(bytes, { maxBytes, tooLargeCode, tooLargeMessage });
    return includeBytes ? { value, bytes } : value;
  }
  const root = resolve(normalized(payloadRoot, "payloadRoot"));
  const inputPath = normalized(source, "payload");
  const candidate = isAbsolute(inputPath) ? resolve(inputPath) : resolve(root, inputPath);
  const lexical = relative(root, candidate);
  if (lexical === ".." || lexical.startsWith(`..${sep}`) || isAbsolute(lexical)) fail("payload_path_invalid", "Payload path escaped the configured root");
  let rootReal;
  let candidateReal;
  let info;
  try {
    [rootReal, candidateReal, info] = await Promise.all([realpath(root), realpath(candidate), lstat(candidate)]);
  } catch { fail("payload_path_invalid", "Payload path is unavailable"); }
  const contained = relative(rootReal, candidateReal);
  if (contained === ".." || contained.startsWith(`..${sep}`) || isAbsolute(contained) || info.isSymbolicLink() || !info.isFile()) {
    fail("payload_path_invalid", "Payload must be a regular non-symlink file within the configured root");
  }
  const components = relative(root, dirname(candidate)).split(sep).filter(Boolean);
  let cursor = root;
  for (const component of components) {
    cursor = resolve(cursor, component);
    const parent = await lstat(cursor);
    if (parent.isSymbolicLink() || !parent.isDirectory()) fail("payload_path_invalid", "Payload path contains an untrusted parent");
  }
  if (info.size > maxBytes) fail(tooLargeCode, tooLargeMessage);
  let handle;
  try {
    handle = await openFile(candidateReal, fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW);
    const opened = await handle.stat();
    if (!opened.isFile() || opened.dev !== info.dev || opened.ino !== info.ino || opened.size !== info.size || opened.size > maxBytes) {
      fail("payload_path_invalid", "Payload file changed between validation and open");
    }
    const bytes = await handle.readFile();
    const value = parsePayloadBytes(bytes, { maxBytes, tooLargeCode, tooLargeMessage });
    return includeBytes ? { value, bytes } : value;
  } catch (error) {
    if (error instanceof ShortDramaError) throw error;
    if (["ELOOP", "ENOENT"].includes(error?.code)) fail("payload_path_invalid", "Payload file changed before open");
    throw error;
  } finally {
    await handle?.close();
  }
}

export async function readPayload(source, options = {}) {
  return readPayloadWithLimit(source, {
    ...options,
    allowStdin: true,
    maxBytes: MAX_PAYLOAD_BYTES,
    tooLargeCode: "payload_too_large",
    tooLargeMessage: "Payload exceeds the one MiB limit",
  });
}

function evidenceMismatch(message) {
  fail("migration_evidence_mismatch", message);
}

function exactDigest(value, field) {
  if (typeof value !== "string" || !/^[a-f0-9]{64}$/.test(value)) fail("input_invalid", "Expected digest must be lowercase SHA-256", { field });
  return value;
}

async function readMigrationFile(source) {
  if (typeof source !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._-]*\.json$/.test(source) || source.includes("..")) {
    fail("input_invalid", "Migration evidence must be a safe JSON file name in the fixed evidence directory");
  }
  return readPayloadWithLimit(source, {
    payloadRoot: MIGRATION_ARTIFACT_ROOT,
    includeBytes: true,
    allowStdin: false,
    maxBytes: MAX_MIGRATION_ARTIFACT_BYTES,
    tooLargeCode: "migration_artifact_too_large",
    tooLargeMessage: "Migration artifact exceeds the 64 MiB limit",
  });
}

async function loadMigrationEvidence(command) {
  const key = `${command.group}:${command.action}`;
  if (key === "migrate:reconcile-plan" || key === "migrate:reconcile-apply" || key === "migrate:reconcile-recover" || key === "migrate:reconcile-checkpoint-plan") {
    const baseline = (await readMigrationFile(command.options.baseline)).value;
    if (baseline.sha256 !== command.options.expectedBaselineSha256 || manifestDigest(baseline) !== baseline.sha256) evidenceMismatch("Original migration baseline digest mismatch");
    if (key === "migrate:reconcile-plan") return { baseline };
    const plan = (await readMigrationFile(command.options.manifest)).value;
    if (plan.sha256 !== command.options.expectedSha256 || reconciliationDigest(plan) !== plan.sha256) evidenceMismatch("Reconciliation plan digest mismatch");
    return { baseline, plan };
  }
  const doctorCanary = command.group === "doctor" && command.options.canary === true;
  if ((!key.startsWith("migrate:") || key === "migrate:plan") && !doctorCanary) return null;
  if (!command.options.manifest) evidenceMismatch("Migration manifest evidence is required");
  const loadedManifest = await readMigrationFile(command.options.manifest);
  const manifest = loadedManifest.value;
  if (typeof manifest.sha256 !== "string" || manifestDigest(manifest) !== manifest.sha256) evidenceMismatch("Migration manifest self-digest is invalid");
  if (doctorCanary) {
    const expectedManifest = exactDigest(command.options.expectedSha256, "expectedSha256");
    if (manifest.sha256 !== expectedManifest) evidenceMismatch("Migration manifest does not match the independently supplied digest");
    return { manifest };
  }
  if (key === "migrate:verify") return { manifest };
  const expectedManifest = exactDigest(command.options.expectedSha256, "expectedSha256");
  if (manifest.sha256 !== expectedManifest) evidenceMismatch("Migration manifest does not match the independently supplied digest");
  const evidence = { manifest };
  if (command.options.phase !== "schema") {
    if (!command.options.schemaReceipt || !command.options.expectedSchemaReceiptSha256) {
      fail("schema_receipt_lost", "Schema receipt is required", { next_step: "replan_reconfirm" });
    }
    const loadedReceipt = await readMigrationFile(command.options.schemaReceipt);
    const receipt = loadedReceipt.value;
    const expectedReceipt = exactDigest(command.options.expectedSchemaReceiptSha256, "expectedSchemaReceiptSha256");
    if (typeof receipt.sha256 !== "string" || schemaReceiptDigest(receipt) !== receipt.sha256 || receipt.sha256 !== expectedReceipt || receipt.manifest_sha256 !== manifest.sha256) {
      evidenceMismatch("Schema receipt does not match the independently supplied digest and manifest");
    }
    evidence.schemaReceipt = receipt;
    if (key === "migrate:attest-permissions") {
      const loadedObservations = await readMigrationFile(command.options.observations);
      const expectedObservationsFile = exactDigest(command.options.expectedObservationsFileSha256, "expectedObservationsFileSha256");
      const actualObservationsFile = createHash("sha256").update(loadedObservations.bytes).digest("hex");
      if (actualObservationsFile !== expectedObservationsFile) evidenceMismatch("Permission observations file does not match its independent digest");
      evidence.observations = loadedObservations.value;
      return evidence;
    }
    if (!command.options.canaryReceipt || !command.options.expectedCanarySha256) {
      fail("migration_canary_required", "Canary receipt and its independent digest are required");
    }
    const canaryReceipt = (await readMigrationFile(command.options.canaryReceipt)).value;
    const expectedCanary = exactDigest(command.options.expectedCanarySha256, "expectedCanarySha256");
    if (canaryReceipt?.sha256 !== expectedCanary || canaryReceiptDigest(canaryReceipt) !== expectedCanary ||
        canaryReceipt.manifest_sha256 !== manifest.sha256) {
      evidenceMismatch("Canary receipt does not match its independent digest and manifest");
    }
    evidence.canaryReceipt = canaryReceipt;
  }
  if (command.options.phase === "data") {
    if (!command.options.permissionAttestation || !command.options.expectedPermissionAttestationSha256 ||
        !command.options.expectedPermissionAttestationFileSha256) {
      fail("migration_permission_attestation_required", "Permission attestation and independent digests are required");
    }
    const loaded = await readMigrationFile(command.options.permissionAttestation);
    const attestation = loaded.value;
    const expectedSemantic = exactDigest(command.options.expectedPermissionAttestationSha256, "expectedPermissionAttestationSha256");
    const expectedFile = exactDigest(command.options.expectedPermissionAttestationFileSha256, "expectedPermissionAttestationFileSha256");
    const actualFile = createHash("sha256").update(loaded.bytes).digest("hex");
    if (attestation?.sha256 !== expectedSemantic || permissionAttestationDigest(attestation) !== expectedSemantic || actualFile !== expectedFile) {
      evidenceMismatch("Permission attestation does not match its independent semantic and file digests");
    }
    evidence.permissionAttestation = attestation;
  }
  if (command.options.phase === "sequences") {
    if (!command.options.verification || !command.options.expectedVerificationSha256) evidenceMismatch("Sequence migration requires independent verification evidence");
    const loadedVerification = await readMigrationFile(command.options.verification);
    const verification = loadedVerification.value;
    const expectedFileDigest = exactDigest(command.options.expectedVerificationSha256, "expectedVerificationSha256");
    const actualFileDigest = createHash("sha256").update(loadedVerification.bytes).digest("hex");
    if (actualFileDigest !== expectedFileDigest || typeof verification.sha256 !== "string" || verificationDigest(verification) !== verification.sha256 ||
        verification.manifest_sha256 !== manifest.sha256) {
      evidenceMismatch("Verification artifact does not match its independent file digest and manifest");
    }
    evidence.verification = verification;
  }
  return evidence;
}

export function beijingParts(now = new Date()) {
  const instant = now instanceof Date ? now : new Date(now);
  if (!Number.isFinite(instant.getTime())) fail("input_invalid", "Clock returned an invalid instant");
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  }).formatToParts(instant).map(({ type, value }) => [type, value]));
  return { date: `${parts.year}-${parts.month}-${parts.day}`, hour: Number(parts.hour), minute: Number(parts.minute), second: Number(parts.second) };
}

export const SCHEDULE_MAX_ATTEMPTS_PER_DAY = SCHEDULE_MAX_ATTEMPTS;
export { SCHEDULE_RETRY_DELAY_MINUTES };

export function shouldEnqueueSchedule(now, jobs, schedule = {}) {
  const parts = beijingParts(now);
  const slot = slotAt(schedule, parts.hour * 60 + parts.minute);
  if (!slot) return false;
  // Only the runs started in the slot that is open now count.
  const today = jobs.filter((job) => job?.trigger === "schedule" && job?.beijing_date === parts.date && slotOfRun(schedule, job).index === slot.index);
  if (today.length === 0) return true;
  // A slot whose scheduled runs all failed outright (e.g. the collector crashed)
  // is retried a bounded number of times. partial/success/active runs are not.
  if (today.length >= SCHEDULE_MAX_ATTEMPTS_PER_DAY || !today.every((job) => job.state === "failed")) return false;
  const finished = today.map((job) => Date.parse(job.finished_at ?? ""));
  if (finished.some((value) => !Number.isFinite(value))) return false;
  const nowMs = (now instanceof Date ? now : new Date(now)).getTime();
  return nowMs - Math.max(...finished) >= SCHEDULE_RETRY_DELAY_MINUTES * 60_000;
}

// Reports and alerts are meant for the people who work with the data; they go
// to the report chat when one is configured and to the ops chat otherwise.
function alertChatId(runtime) {
  return runtime.reportChatId ?? runtime.opsChatId;
}

// The same alert always carries the same request id, so a send whose reply got
// lost is recognised by Feishu when it is repeated instead of posted twice.
function requestId(alertKey, chatId) {
  return createHash("sha256").update(`${alertKey}|${chatId}`).digest("hex").slice(0, 40);
}

const FALLBACK_NOTE = "（通知群发送失败，改发到本会话）\n";

// The chat will not take the message: Feishu said so, or the sender's own
// allowlist did. Anything else (a timeout, a lost reply, a server error, a
// rate limit) leaves open whether the message arrived.
const DELIVERY_REFUSALS = new Set(["notification_target_refused", "notification_target_denied"]);

// Sends one alert or report. A group that refuses the message (bot removed,
// group dissolved) must not swallow it: the ops chat gets it, marked as
// rerouted, and keeps it until the delivery is known. After an unknown outcome
// the same chat is tried again under the same request id, because it may have
// the message already. The caller holds the claim of the alert. Resolves to
// the payload of the text that went out.
async function deliverAlert(runtime, alertKey, draft, { now = new Date(), payload = null } = {}) {
  const chatId = alertChatId(runtime);
  const ops = runtime.opsChatId;
  const db = runtime.jobs?.db;
  // A text that cannot be kept must not hold the message back.
  let kept = { text: draft, payload };
  if (db) { try { kept = alertText(db, alertKey, draft, { payload, now }); } catch {} }
  const toOps = async () => {
    try { await runtime.sendOpsHealth({ chatId: ops, text: FALLBACK_NOTE + kept.text, idempotencyKey: requestId(alertKey, ops) }); }
    catch (error) {
      // Only the ops chat refusing too proves that nobody has the message,
      // which frees the next attempt to start with the group again.
      if (db && DELIVERY_REFUSALS.has(error?.code)) { try { setAlertRerouted(db, alertKey, false); } catch {} }
      throw error;
    }
    return { fallback: true, payload: kept.payload };
  };
  const canReroute = Boolean(ops) && ops !== chatId;
  // The route is different: while it is unknown or cannot be put on record,
  // trying another chat could leave the message in both.
  if (canReroute && db) {
    let rerouted;
    try { rerouted = isAlertRerouted(db, alertKey); }
    catch { fail("alert_route_unavailable", "The route of the alert cannot be read"); }
    if (rerouted) return toOps();
  }
  try {
    await runtime.sendOpsHealth({ chatId, text: kept.text, idempotencyKey: requestId(alertKey, chatId) });
    return { fallback: false, payload: kept.payload };
  } catch (error) {
    if (!DELIVERY_REFUSALS.has(error?.code) || !canReroute) throw error;
    if (db) { try { setAlertRerouted(db, alertKey, true, { now }); } catch { throw error; } }
    return toOps();
  }
}

// Claims, sends and records one alert. Resolves to the result for the health
// output and to the payload of the text that went out.
async function sendAlert(runtime, { kind, date, now, text, key = null, payload = null }) {
  const alertKey = key ?? `${kind}:${date}`;
  const ownerId = randomUUID();
  if (!runtime.jobs.claimHealthAlert(alertKey, { ownerId, now, leaseSeconds: 120 })) return { result: { kind, status: "already_claimed" }, payload: null };
  let delivered;
  try {
    delivered = await deliverAlert(runtime, alertKey, text, { now, payload });
  } catch (error) {
    // A failed claim is retried on a later tick; one failed alert must not
    // suppress the others.
    const code = typeof error?.code === "string" ? error.code.slice(0, 64) : "notification_delivery_failed";
    try { runtime.jobs.markHealthAlert(alertKey, "failed", { ownerId, now, error: code }); } catch {}
    return { result: { kind, status: "failed", error: { code } }, payload: null };
  }
  // Delivered. Failing to record that must not turn it into a failed alert.
  // The record is retried, because while it is missing the claim expires and
  // the alert goes out a second time.
  const pause = typeof runtime.sleep === "function" ? runtime.sleep : (ms) => new Promise((done) => setTimeout(done, ms));
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try { runtime.jobs.markHealthAlert(alertKey, "sent", { ownerId, now }); break; }
    catch { if (attempt < 3) await pause(500); }
  }
  return { result: { kind, status: "sent", ...(delivered.fallback ? { fallback: true } : {}) }, payload: delivered.payload };
}

async function sendDailyAlert(runtime, alert) {
  return (await sendAlert(runtime, alert)).result;
}

async function readCaptureSummary(runtime, date) {
  const dir = runtime.config?.paths?.collectorSummaryDir;
  if (typeof dir !== "string" || !isAbsolute(dir)) return null;
  try { return JSON.parse(await readFile(resolve(dir, `capture_summary_${date}.json`), "utf8")); } catch { return null; }
}

export const CAPTURE_REPORT_MAX_AGE_HOURS = 72;
// A run is named after the day it started on and may end on the next one, so
// covering three days of finished runs takes one more day of run ids.
export const CAPTURE_REPORT_LOOKBACK_DAYS = 4;
const REPORT_RUN_ID = /^SDRUN-(\d{4})(\d{2})(\d{2})-\d{6}$/;
const runDate = (job) => { const m = REPORT_RUN_ID.exec(job?.run_id ?? ""); return m ? `${m[1]}-${m[2]}-${m[3]}` : null; };
const dayBefore = (date) => new Date(Date.parse(`${date}T00:00:00Z`) - 86_400_000).toISOString().slice(0, 10);
const captureReportKey = (runId) => `capture-report:${runId}`;

// Every scheduled run that finished is reported once, whatever its state. A
// report that could not be delivered is retried by every later check for three
// days. Runs from before reporting was switched on are history and stay silent.
export async function captureReports(runtime, { now, jobs }) {
  const nowMs = (now instanceof Date ? now : new Date(now)).getTime();
  const cutoffMs = runtime.jobs?.db ? Date.parse(captureReportCutoff(runtime.jobs.db, { now })) : nowMs - CAPTURE_REPORT_GRACE_HOURS * 3_600_000;
  const scheduled = jobs.filter((job) => job?.trigger === "schedule" && runDate(job))
    .sort((a, b) => String(a.run_id).localeCompare(String(b.run_id)));
  const results = [];
  for (const job of scheduled) {
    if (!["success", "partial", "failed"].includes(job.state)) continue;
    const finished = Date.parse(job.finished_at ?? "");
    if (!Number.isFinite(finished) || finished > nowMs || nowMs - finished > CAPTURE_REPORT_MAX_AGE_HOURS * 3_600_000) continue;
    const key = captureReportKey(job.run_id);
    const delivery = runtime.jobs.healthAlertState?.(key) ?? (runtime.jobs.isHealthAlertSent?.(key) ? "sent" : null);
    if (delivery === "sent") { results.push({ kind: "capture-report", run_id: job.run_id, status: "already_claimed" }); continue; }
    // A delivery that was started is owed, whenever the run ended.
    if (delivery === null && finished < cutoffMs) continue;
    const date = runDate(job);
    // Attempts are counted within the capture slot of the run. Nothing in the
    // report depends on the time it is written or on later runs.
    const schedule = runtime.config?.schedule;
    const slot = slotOfRun(schedule, job).index;
    const attempt = scheduled.filter((other) => runDate(other) === date && slotOfRun(schedule, other).index === slot).indexOf(job) + 1;
    const retryDeadline = schedule ? retryDeadlineOfRun(schedule, job) : null;
    let drain = null;
    try { drain = runtime.jobs?.db ? readDrainHealth(runtime.jobs.db) : null; } catch {}
    const text = buildCaptureReport({
      job, summary: await readCaptureSummary(runtime, date), previousSummary: await readCaptureSummary(runtime, dayBefore(date)), drain,
      attempt, maxAttempts: SCHEDULE_MAX_ATTEMPTS_PER_DAY, retryDelayMinutes: SCHEDULE_RETRY_DELAY_MINUTES,
      retryDeadline, nextCaptureAt: retryDeadline === null ? null : nextCaptureAfter(schedule, retryDeadline - 1),
      scope: captureSlots(schedule).length > 1 ? "本时段" : "今日",
    });
    results.push({ ...(await sendDailyAlert(runtime, { kind: "capture-report", key, now, text })), run_id: job.run_id });
  }
  return results;
}

function missingRunAlertText(date, state) {
  const reason = state.reason === "still_running" ? `采集任务仍在运行（当前步骤：${state.step ?? "未知"}）`
    : state.reason === "failed_terminal" ? (state.slot ? "这个时段的采集全部失败" : "今日采集全部失败")
      : (state.slot ? "这个时段没有启动采集任务" : "今日没有启动采集任务");
  if (state.slot) return `【短剧采集告警】${date} ${state.slot} 的采集还没有可用结果\n原因：${reason}\n数据表里还是上一次采集的数据，请留意。`;
  return `【短剧采集告警】${date} 今日采集还没有可用结果\n原因：${reason}\n数据表可能还是昨天的数据，请留意。`;
}

export async function pipelineHealthAlerts(runtime, { now, date, jobs }) {
  const db = runtime.jobs?.db;
  const results = [];
  // An alert is kept as it was first written and may go out later.
  const written = beijingParts(now);
  const seen = `发现时间：${written.date} ${String(written.hour).padStart(2, "0")}:${String(written.minute).padStart(2, "0")}（北京时间）`;
  const latest = jobs.filter((job) => ["success", "partial", "failed"].includes(job?.state)).at(-1);
  // The report of a run already lists its problems; the alert is the fallback
  // for a run whose report did not go out.
  const reported = latest && runDate(latest) ? runtime.jobs?.isHealthAlertSent?.(captureReportKey(latest.run_id)) === true : false;
  if (latest?.state === "partial" && !reported) {
    const lines = captureIncompleteLines(await readCaptureSummary(runtime, date));
    if (lines?.length) {
      results.push(await sendDailyAlert(runtime, { kind: "capture-incomplete", date, now,
        text: boundedAlertText(`shortdrama 采集不完整\nbeijing_date=${date}\nrun_id=${latest.run_id}\n${seen}`, lines) }));
    }
  }
  if (!db) return results;
  const drain = readDrainHealth(db);
  if (drain && drain.consecutive_failures >= DRAIN_FAILURE_ALERT_THRESHOLD) {
    results.push(await sendDailyAlert(runtime, { kind: "drain-failing", date, now,
      text: boundedAlertText(`shortdrama queue drain 持续失败\nbeijing_date=${date}\n${seen}`, [
        `连续失败 ${drain.consecutive_failures} 次，自 ${drain.first_failed_at}`,
        `最近错误 ${drain.last_error_code}: ${drain.last_error_message ?? ""}`,
        `最近成功 ${drain.last_success_at ?? "无记录"}`,
        "影响：统计表停更、失败通知不重试。"]) }));
  }
  const pending = pendingIntegrityIssues(db);
  if (pending.length) {
    const alert = boundedAlert(`shortdrama 台账/发布记录新增数据问题 ${pending.length} 项\nbeijing_date=${date}\n${seen}`, pending.map(describeIntegrityIssue));
    const listed = pending.slice(0, alert.used).map((issue) => issue.key);
    const { result, payload } = await sendAlert(runtime, { kind: "ledger-integrity", date, now, text: alert.text, payload: listed });
    // Only what the alert that went out listed counts as reported; the rest
    // stays pending for the next day's alert.
    if (result.status === "sent" && Array.isArray(payload)) markIntegrityReported(db, payload, { now });
    results.push(result);
  }
  return results;
}

// Every slot whose check is due, in the order of the day, each judged by the
// runs started in it. With several captures a day each state names its slot.
export function evaluateDueSlots(now, jobs, schedule = {}) {
  const parts = beijingParts(now);
  const minute = parts.hour * 60 + parts.minute;
  const slots = captureSlots(schedule);
  const usable = (job) => job?.state === "success" || job?.state === "partial";
  return slots.filter((due) => due.healthMinutes <= minute).map((due) => {
    const own = jobs.filter((job) => slotOfRun(schedule, job).index === due.index);
    const slot = slots.length > 1 ? { slot: due.label } : {};
    if (own.some(usable)) return { alert: false, reason: "terminal_present" };
    // A later capture of the day that delivered makes up for this one: the
    // data is fresh and its report went out.
    if (jobs.some((job) => usable(job) && slotOfRun(schedule, job).index > due.index)) return { alert: false, reason: "superseded", ...slot };
    const running = own.find((job) => job?.state === "running");
    if (running) return { alert: true, reason: "still_running", step: running.step, lease_expires_at: running.lease_expires_at, ...slot };
    if (own.some((job) => job?.state === "failed")) return { alert: true, reason: "failed_terminal", ...slot };
    return { alert: true, reason: "missing_terminal", ...slot };
  });
}

// The state of the latest slot whose check is due.
export function evaluateDailyHealth(now, jobs, schedule = {}) {
  return evaluateDueSlots(now, jobs, schedule).at(-1) ?? { alert: false, reason: "before_health_window" };
}

// The first slot keeps the key the day had when it was the only one.
function missingRunAlertKey(date, state, schedule) {
  const later = state.slot && state.slot !== captureSlots(schedule)[0].label;
  return `missing-terminal:${date}${later ? `@${state.slot.replace(":", "")}` : ""}`;
}

const CANARY_ID = /^CANARY-SDRUN-\d{8}-\d{6}(?:-[A-F0-9]+)?$/;
const CANARY_RESTORATION_ATTEMPTS = 3;
const CANARY_TABLES = Object.freeze([
  ["accounts", "账号台账"], ["dramas", "选剧池"], ["captures", "采集数据"], ["releases", "发布记录"],
]);

const defaultCanarySleep = (ms) => new Promise((resolvePromise) => setTimeout(resolvePromise, ms));

function canaryIndex(result, tableName) {
  if (!result || result.complete !== true || !Array.isArray(result.items)) fail("base_response_incomplete", "Complete Base list is required for canary", { table: tableName });
  const primary = TABLES[tableName].primaryField;
  const byKey = new Map();
  for (const record of result.items) {
    const key = record?.fields?.[primary];
    if (typeof record?.record_id !== "string" || record.record_id.length === 0 || typeof key !== "string" || key.length === 0 || byKey.has(key)) {
      fail("base_response_invalid", "Canary Base list contains malformed or duplicate keys", { table: tableName });
    }
    byKey.set(key, record.record_id);
  }
  return byKey;
}

export async function runBaseCanary({ client, appToken, tableIds, canaryId, sleep = defaultCanarySleep } = {}) {
  if (!client || ["listRecords", "createRecords", "getRecord", "deleteCanaryRecords"].some((method) => typeof client[method] !== "function") ||
      typeof appToken !== "string" || appToken.length === 0 || !tableIds || !CANARY_ID.test(canaryId ?? "") || typeof sleep !== "function") {
    fail("canary_context_invalid", "Fixed four-table canary context is invalid");
  }
  const snapshots = new Map();
  const originalKeys = new Map();
  const createdRecordIds = new Map();
  const deletedRecordIds = new Map();
  const proofs = new Map();
  let operationError = null;
  let cleanupFailure = null;
  for (const [binding, tableName] of CANARY_TABLES) {
    const tableId = tableIds[binding];
    if (typeof tableId !== "string" || tableId.length === 0) fail("canary_context_invalid", "Canary table binding is invalid", { table: tableName });
    const primary = TABLES[tableName].primaryField;
    const index = canaryIndex(await client.listRecords(appToken, tableId, { tableName, selectFields: [primary] }), tableName);
    if (index.has(canaryId)) fail("canary_collision", "Generated canary key already exists", { table: tableName });
    snapshots.set(tableName, index);
    originalKeys.set(tableName, [...index.keys()].sort());
  }
  try {
    for (const [binding, tableName] of CANARY_TABLES) {
      const tableId = tableIds[binding];
      const primary = TABLES[tableName].primaryField;
      const created = await client.createRecords(appToken, tableId, [{ fields: { [primary]: canaryId } }], { tableName });
      if (!Array.isArray(created) || created.length !== 1 || typeof created[0]?.record_id !== "string") {
        fail("readback_mismatch", "Canary create did not return exactly one record ID", { table: tableName });
      }
      const recordId = created[0].record_id;
      createdRecordIds.set(tableName, recordId);
      const readback = await client.getRecord(appToken, tableId, recordId, {
        tableName, waitForVisibility: true, selectFields: [primary],
      });
      if (readback?.record_id !== recordId || readback?.fields?.[primary] !== canaryId) {
        fail("readback_mismatch", "Canary readback did not match primary and record ID", { table: tableName });
      }
      proofs.set(tableName, {
        before_key_set_sha256: createHash("sha256").update(JSON.stringify(originalKeys.get(tableName))).digest("hex"),
        canary_primary_sha256: createHash("sha256").update(canaryId).digest("hex"),
        created: true,
        readback_verified: true,
        record_id_sha256: createHash("sha256").update(recordId).digest("hex"),
      });
    }
  } catch (error) {
    operationError = error;
  } finally {
    for (const [binding, tableName] of CANARY_TABLES) {
      const tableId = tableIds[binding];
      try {
        const recordId = createdRecordIds.get(tableName);
        if (recordId) {
          await client.deleteCanaryRecords(appToken, tableId, tableName, [recordId], { canaryId });
          deletedRecordIds.set(tableName, recordId);
        }
      } catch (error) {
        cleanupFailure ??= { error, phase: "delete", table: tableName };
      }
    }
    for (const [binding, tableName] of CANARY_TABLES) {
      try {
        const expectedKeys = originalKeys.get(tableName);
        const primary = TABLES[tableName].primaryField;
        const deletedRecordId = deletedRecordIds.get(tableName) ?? null;
        const pendingKeys = deletedRecordId === null ? null : [...expectedKeys, canaryId].sort();
        let restored = null;
        for (let attempt = 1; attempt <= CANARY_RESTORATION_ATTEMPTS; attempt += 1) {
          restored = canaryIndex(await client.listRecords(appToken, tableIds[binding], {
            tableName, selectFields: [primary],
          }), tableName);
          const actualKeys = [...restored.keys()].sort();
          if (JSON.stringify(actualKeys) === JSON.stringify(expectedKeys)) break;
          const onlyDeletedCanaryRemains = pendingKeys !== null && restored.get(canaryId) === deletedRecordId &&
            JSON.stringify(actualKeys) === JSON.stringify(pendingKeys);
          if (!onlyDeletedCanaryRemains || attempt === CANARY_RESTORATION_ATTEMPTS) {
            fail("readback_mismatch", "Canary cleanup did not restore the exact key set", { table: tableName });
          }
          await sleep(attempt * 1_000);
        }
        const proof = proofs.get(tableName);
        if (proof) {
          proof.deleted = true;
          proof.after_key_set_sha256 = createHash("sha256").update(JSON.stringify([...restored.keys()].sort())).digest("hex");
          proof.count_before = snapshots.get(tableName).size;
          proof.count_after = restored.size;
        }
      } catch (error) {
        cleanupFailure ??= { error, phase: "restoration", table: tableName };
      }
    }
  }
  if (cleanupFailure) fail("canary_cleanup_failed", "Canary cleanup or restoration could not be proven", {
    next_step: "manual_repair",
    phase: cleanupFailure.phase,
    table: cleanupFailure.table,
    cause_code: typeof cleanupFailure.error?.code === "string" ? cleanupFailure.error.code : "internal_error",
  });
  if (operationError) throw operationError;
  return {
    status: "verified", canary_id: canaryId,
    tables: Object.fromEntries(CANARY_TABLES.map(([, name]) => [name, proofs.get(name)])),
  };
}

async function defaultSpawnFile(file, args, options = {}) {
  return new Promise((resolvePromise, reject) => {
    const { signal: abortSignal, input, ...spawnOptions } = options;
    const child = spawn(file, args, { ...spawnOptions, shell: false, detached: false, stdio: input === undefined ? "ignore" : ["pipe", "ignore", "ignore"] });
    if (input !== undefined) { child.stdin.on("error", reject); child.stdin.end(input); }
    const abort = () => child.kill("SIGTERM");
    abortSignal?.addEventListener("abort", abort, { once: true });
    child.once("error", reject);
    child.once("close", (code, signal) => {
      abortSignal?.removeEventListener("abort", abort);
      resolvePromise({ code, signal });
    });
  });
}

function assertNode24(nodePath = process.execPath) {
  if (!isAbsolute(nodePath) || Number(process.versions.node.split(".")[0]) < 24) fail("node_unsupported", "Absolute Node.js 24+ runtime is required");
}

function sqliteCollectorEvidence(sqlitePath, collectorRunId) {
  let db;
  try {
    db = new DatabaseSync(sqlitePath, { readOnly: true });
    const table = db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='runs'").get();
    const row = table ? db.prepare("SELECT run_id FROM runs WHERE run_id = ?").get(collectorRunId) : null;
    return row?.run_id === collectorRunId;
  } catch { return false; }
  finally { db?.close(); }
}

export function createCollectorAdapter({
  nodePath = process.execPath, collectorPath, collectorCwd, summaryDir, metricsSqlitePath,
  spawnFile = defaultSpawnFile, now = () => new Date(), verifySqliteEvidence = sqliteCollectorEvidence, maxPostAgeDays = 30, excludedPostIds = [], readRegisteredPosts = null,
} = {}) {
  assertNode24(nodePath);
  validateMaxPostAgeDays(maxPostAgeDays);
  const excluded = validateExcludedPostIds(excludedPostIds);
  if (excluded.length && !readRegisteredPosts) fail("collector_config_invalid", "Post exclusions require the registered Runner collector input");
  for (const [value, field] of [[collectorPath, "collectorPath"], [collectorCwd, "collectorCwd"], [summaryDir, "summaryDir"], [metricsSqlitePath, "metricsSqlitePath"]]) {
    if (!isAbsolute(value ?? "")) fail("collector_config_invalid", "Collector paths must be absolute", { field });
  }
  return async ({ runId, beijingDate, signal } = {}) => {
    const summaryPath = resolve(summaryDir, `capture_summary_${beijingDate}.json`);
    const startedAt = now();
    const startedMs = new Date(startedAt).getTime();
    let before = null;
    try { const stat = await lstat(summaryPath); before = { dev: stat.dev, ino: stat.ino, mtimeMs: stat.mtimeMs, size: stat.size }; } catch {}
    let collectorInfo;
    let cwdInfo;
    let collectorReal;
    let cwdReal;
    try { [collectorInfo, cwdInfo, collectorReal, cwdReal] = await Promise.all([lstat(collectorPath), lstat(collectorCwd), realpath(collectorPath), realpath(collectorCwd)]); } catch { fail("collector_config_invalid", "Collector path is unavailable"); }
    if (!collectorInfo.isFile() || collectorInfo.isSymbolicLink() || !cwdInfo.isDirectory() || cwdInfo.isSymbolicLink() ||
        dirname(collectorReal) !== cwdReal) fail("collector_config_invalid", "Collector path is not trusted");
    const loaded = readRegisteredPosts ? await readRegisteredPosts({ signal }) : null;
    // Every active release is registered, so the list only grows. Posts outside
    // the capture window are skipped by the collector anyway; dropping them here
    // keeps stdin far below its 1 MiB cap. Unknown dates stay eligible.
    const registered = loaded === null ? null : {
      ...loaded,
      posts: Array.isArray(loaded.posts) ? loaded.posts.filter((post) => !isExpiredPost(post?.published_at ?? null, startedAt, maxPostAgeDays)) : loaded.posts,
    };
    const requestedAccounts = readRegisteredPosts ? captureAccountUsernames(registered?.accounts) : null;
    const input = registered === null ? undefined : JSON.stringify({ ...registered, excluded_post_ids: excluded });
    if (input !== undefined && Buffer.byteLength(input) > MAX_PAYLOAD_BYTES) fail("collector_config_invalid", "Registered capture targets exceed the input limit");
    const args = [collectorPath, "--max-post-age-days", String(maxPostAgeDays), ...(registered === null ? [] : ["--registered-posts-stdin"])];
    let outcome;
    try { outcome = await spawnFile(nodePath, args, { cwd: collectorCwd, shell: false, detached: false, signal, ...(input === undefined ? {} : { input }) }); }
    catch { fail("capture_failed", "Collector process could not be started"); }
    if (signal?.aborted) fail("worker_claim_mismatch", "Collector was aborted after lease loss");
    if (outcome?.code !== 0) fail("capture_failed", "Collector process did not exit successfully", { exit_code: outcome?.code ?? null });
    let after;
    let summary;
    try {
      after = await lstat(summaryPath);
      summary = JSON.parse(await readFile(summaryPath, "utf8"));
    } catch { fail("capture_failed", "Collector summary is missing or invalid"); }
    const changed = !before || before.dev !== after.dev || before.ino !== after.ino || before.mtimeMs !== after.mtimeMs || before.size !== after.size;
    const capturedMs = Date.parse(summary?.captured_at);
    const collectorRunId = summary?.run_id;
    if (!changed || !after.isFile() || after.isSymbolicLink() || after.mtimeMs < startedMs || !Number.isFinite(capturedMs) || capturedMs < startedMs ||
        summary?.capture_date !== beijingDate || typeof collectorRunId !== "string" || collectorRunId.length === 0 ||
        resolve(summary?.files?.sqlite ?? "") !== metricsSqlitePath || !Array.isArray(summary?.errors) ||
        !verifySqliteEvidence(metricsSqlitePath, collectorRunId)) {
      fail("capture_failed", "Collector did not produce fresh same-run SQLite evidence");
    }
    if (requestedAccounts !== null && !isDeepStrictEqual(summary.accounts_requested, requestedAccounts)) {
      fail("capture_membership_mismatch", "Collector did not acknowledge the complete Base account list");
    }
    if (excluded.length && !isDeepStrictEqual(summary.capture_policy?.excluded_post_ids, excluded)) {
      fail("capture_policy_mismatch", "Collector did not acknowledge the exact Post ID exclusions");
    }
    if (captureYieldedNothing(summary)) fail("capture_failed", "Collector reached no account and no post");
    const status = summary.errors.length > 0 ? "partial" : "success";
    return {
      status, captured_at: summary.captured_at, capture_policy: summary.capture_policy ?? null, run_id: runId, collector_run_id: collectorRunId, beijing_date: beijingDate,
      summary_path: summaryPath, sqlite_path: metricsSqlitePath,
      errors: summary.errors.map((error) => ({ code: typeof error?.code === "string" ? error.code : "capture_partial" })),
    };
  };
}

export function createWakeWorker({ uid = process.getuid?.(), spawnFile = defaultSpawnFile } = {}) {
  if (!Number.isSafeInteger(uid) || uid < 0) fail("launchd_context_invalid", "A valid uid is required");
  return async () => {
    const outcome = await spawnFile("/bin/launchctl", ["kickstart", `gui/${uid}/${LABEL}`], { shell: false, detached: false });
    if (outcome?.code !== 0) fail("worker_wakeup_failed", "launchd worker wake failed", { exit_code: outcome?.code ?? null });
  };
}

function requireSequenceSeed(jobs) {
  const state = jobs.peekSequenceState();
  if (!state.seeded) fail("sequence_unseeded", "Business ID sequences require verified migration seeds");
  return state;
}

function humanRequest(identity, table, payload = {}) {
  return { ...payload, actorId: identity.actorId, ...(identity.chatId ? { chatId: identity.chatId } : {}), table };
}

function queryRequest(identity, table, extra = {}, fixedFilter = null) {
  if (extra === null || typeof extra !== "object" || Array.isArray(extra) ||
      ![Object.prototype, null].includes(Object.getPrototypeOf(extra)) ||
      Object.keys(extra).some((key) => !["filter", "sort"].includes(key))) {
    fail("payload_invalid", "Query payload accepts only filter and sort");
  }
  assertSafeJson(extra);
  const request = {};
  if (extra.sort !== undefined) request.sort = structuredClone(extra.sort);
  const filter = fixedFilter ?? extra.filter;
  if (filter !== undefined) request.filter = structuredClone(filter);
  return { actorId: identity.actorId, table, ...request };
}

function completeReadResult(table, rows, key = null) {
  if (!Array.isArray(rows)) fail("base_response_invalid", "HumanOps query did not return a complete row array", { table });
  const copy = structuredClone(rows);
  const evidence = { readback: "complete", source: "base_complete_index" };
  if (key === null) return { status: "success", table, rows: copy, ...evidence };
  if (copy.length === 0) return { status: "not_found", table, key, record: null, ...evidence };
  if (copy.length !== 1) fail("base_response_invalid", "Exact primary-key query returned multiple rows", { table, key });
  return { status: "success", table, key, record: copy[0], ...evidence };
}

async function retryNotifications(runtime) {
  const results = [];
  for (const job of runtime.jobs.listUndeliveredTerminal()) results.push(await runtime.notifier.sendTerminal(job));
  return results;
}

export function createDispatcher(runtime) {
  if (!runtime || typeof runtime !== "object") fail("runtime_invalid", "Dispatcher runtime is invalid");
  return async (command, identity, payload) => {
    const key = `${command.group}:${command.action}`;
    const schemaGuarded = (["account", "capture", "pool", "release", "metrics"].includes(command.group) && key !== "pool:beidou-search") ||
      key === "sync:start" || key === "schedule:tick" || key === "queue:project";
    if (schemaGuarded) {
      if (typeof runtime.assertRuntimeSchemaReady !== "function") fail("runtime_invalid", "Runtime schema guard is required");
      await runtime.assertRuntimeSchemaReady();
    }
    if (command.group === "doctor") {
      if ((command.options.canary || command.options.initState || command.options.beidouFields) && !runtime.config?.auth?.isPrivilegedAllowed?.(identity.actorId)) fail("privileged_required", "Doctor mutation checks require a privileged actor");
      return runtime.doctor ? runtime.doctor({ canary: command.options.canary === true, initState: command.options.initState === true,
        beidouFields: command.options.beidouFields === true, confirm: command.options.confirm,
        expectedSha256: command.options.expectedSha256, identity, payload }) : { status: "ready" };
    }
    if (key === "pool:beidou-search") {
      if (!payload || typeof payload !== "object" || Array.isArray(payload) || Object.keys(payload).join("|") !== "title" ||
          typeof payload.title !== "string" || !payload.title.trim() || payload.title !== payload.title.trim() || payload.title.length > 300) {
        fail("input_invalid", "Beidou search requires exactly one bounded title");
      }
      if (typeof runtime.queryBeidouCandidates !== "function") fail("runtime_invalid", "Beidou read-only query is unavailable");
      return runtime.queryBeidouCandidates({ title: payload.title });
    }
    if (key === "release:batches") return runtime.batchOps.query({ key: command.options.key });
    if (["release:batch-schedule", "release:batch-schedule-direct", "release:batch-match-direct", "release:batch-preview", "release:batch-apply"].includes(key)) {
      if (!payload || typeof payload !== "object" || Array.isArray(payload)) fail("mutation_shape_invalid", "Batch payload required");
      const request = { ...payload, actorId: identity.actorId, chatId: identity.chatId };
      const result = await runtime.batchOps[key === "release:batch-schedule" ? "previewSchedule" : key === "release:batch-schedule-direct" ? "scheduleDirect" : key === "release:batch-match-direct" ? "matchDirect" : key === "release:batch-preview" ? "previewMatch" : "apply"](request);
      return result;
    }
    if (key === "release:match-direct") {
      if (!payload || Object.keys(payload).sort().join("|") !== "key|postId" ||
          typeof payload.key !== "string" || typeof payload.postId !== "string") {
        fail("mutation_shape_invalid", "Direct match requires exactly key and postId");
      }
      return matchReleaseDirect({ ...payload, actorId: identity.actorId, chatId: identity.chatId,
        queryReleaseCandidates: runtime.queryReleaseCandidates, humanOps: runtime.humanOps });
    }
    if (key === "release:candidates") return runtime.queryReleaseCandidates({ key: command.options.key, date: command.options.date });
    if (key === "release:preview-match") {
      if (!payload || Object.keys(payload).sort().join("|") !== "key|postId" ||
          typeof payload.key !== "string" || typeof payload.postId !== "string") {
        fail("mutation_shape_invalid", "Candidate preview requires exactly key and postId");
      }
      const report = await runtime.queryReleaseCandidates({ key: payload.key });
      const release = report.rows.find(row => row.release_id === payload.key);
      const candidate = release?.candidates.find(row => row.post_id === payload.postId);
      if (!candidate) fail("candidate_not_available", "Candidate changed, is occupied, or is outside the review window; refresh candidates");
      const preview = await runtime.humanOps.previewCaptureMatch({ ...payload, actorId: identity.actorId, chatId: identity.chatId,
        expectedReleaseVersion: release.release_version, expectedCaptureVersion: candidate.capture_version });
      return { ...preview, candidate };
    }
    if (key === "account:list" || key === "capture:list") {
      const table = command.group === "account" ? "账号台账" : "采集数据";
      return completeReadResult(table, await runtime.humanOps.query(queryRequest(identity, table)));
    }
    if (key === "account:get" || key === "capture:get") {
      const table = command.group === "account" ? "账号台账" : "采集数据";
      const primary = table === "账号台账" ? "账号ID" : "Post ID";
      return completeReadResult(table, await runtime.humanOps.query(queryRequest(identity, table, {
        filter: { [primary]: command.options.key },
      })), command.options.key);
    }
    if (key === "pool:list" || key === "release:list") {
      const table = command.group === "pool" ? "选剧池" : "发布记录";
      return completeReadResult(table, await runtime.humanOps.query(queryRequest(identity, table, payload ?? {})));
    }
    if (key === "pool:get" || key === "release:get") {
      const table = command.group === "pool" ? "选剧池" : "发布记录";
      const primary = table === "选剧池" ? "剧ID" : "发布ID";
      return completeReadResult(table, await runtime.humanOps.query(queryRequest(
        identity, table, payload ?? {}, { [primary]: command.options.key },
      )), command.options.key);
    }
    if (command.group === "metrics" && runtime.queryAnalyticsReport) return runtime.queryAnalyticsReport({action: command.action, key: command.options.key, date: command.options.date});
    if (key === "metrics:by-drama" || key === "metrics:by-account") return runtime.humanOps.queryMetrics({ actorId: identity.actorId, groupBy: command.action === "by-drama" ? "drama" : "account" });
    if (key === "pool:create" || key === "release:schedule") {
      requireSequenceSeed(runtime.jobs);
      return runtime.humanOps.previewMutation(humanRequest(identity, command.group === "pool" ? "选剧池" : "发布记录", { ...(payload ?? {}), action: "create" }));
    }
    if (key === "pool:update-field" || key === "release:update-field") {
      const single = exactSingleFieldPayload(payload);
      return runtime.humanOps.applySingleField({
        actorId: identity.actorId,
        chatId: identity.chatId,
        table: command.group === "pool" ? "选剧池" : "发布记录",
        ...single,
      });
    }
    if (key === "pool:preview-update" || key === "release:preview-update") return runtime.humanOps.previewMutation(humanRequest(identity, command.group === "pool" ? "选剧池" : "发布记录", { ...(payload ?? {}), action: "update" }));
    if (key === "pool:preview-batch" || key === "release:preview-batch") {
      const batch = exactBatchPayload(payload);
      return runtime.humanOps.previewMutation(humanRequest(
        identity,
        command.group === "pool" ? "选剧池" : "发布记录",
        { ...batch, action: "batch_update" },
      ));
    }
    if (key === "pool:apply-update" || key === "release:apply-update") return runtime.humanOps.applyPreview({ ...(payload ?? {}), actorId: identity.actorId, chatId: identity.chatId });
    if (key === "pool:apply-direct" || key === "release:apply-direct") return runtime.humanOps.applyDirect(humanRequest(identity, command.group === "pool" ? "选剧池" : "发布记录", payload ?? {}));
    if (key === "pool:preview-archive") return runtime.humanOps.previewArchive(humanRequest(identity, "选剧池", { ...(payload ?? {}), key: command.options.key }));
    if (key === "pool:apply-archive") return runtime.humanOps.applyArchive({ ...(payload ?? {}), actorId: identity.actorId, chatId: identity.chatId });
    if (key === "release:attach-post") return runtime.humanOps.previewMutation(humanRequest(identity, "发布记录", { ...(payload ?? {}), action: "attach-post" }));
    if (key === "sync:start") {
      const auth = runtime.config?.auth;
      if (!auth?.isOperatorAllowed?.(identity.actorId) && !auth?.isPrivilegedAllowed?.(identity.actorId)) {
        fail("actor_write_denied", "Actor is not allowed to start synchronization", { actor: identity.actorId });
      }
      return startSyncJob(runtime.syncContext, { trigger: "manual", actorId: identity.actorId, chatId: identity.chatId });
    }
    if (key === "sync:status") return getSyncStatus(runtime.jobs, command.options.runId);
    if (key === "schedule:tick") {
      const now = runtime.now();
      const parts = beijingParts(now);
      const rows = runtime.jobs.listByBeijingDate(parts.date).map((job) => ({ ...job, beijing_date: parts.date }));
      if (!shouldEnqueueSchedule(now, rows, runtime.config?.schedule)) return { status: "no_op", reason: "outside_window_or_already_scheduled", beijing_date: parts.date };
      requireSequenceSeed(runtime.jobs);
      // With one capture a day the whole day is the slot, as it always was.
      const slots = captureSlots(runtime.config?.schedule);
      const slot = slots.length > 1 ? slotAt(runtime.config?.schedule, parts.hour * 60 + parts.minute) : null;
      return startSyncJob(runtime.syncContext, { trigger: "schedule", chatId: runtime.opsChatId, beijingDate: parts.date,
        ...(slot ? { slotStart: slot.index === 0 ? "000000" : slot.start } : {}) });
    }
    if (key === "queue:project") {
      const dailyViews = await runtime.projectDailyViews();
      const analytics = await runtime.projectAnalytics();
      const states = [dailyViews.status, analytics.status];
      return {status: states.includes("deferred") ? "deferred" : states.includes("partial") ? "partial" : "success", daily_views: dailyViews, analytics};
    }
    if (key === "queue:drain") {
      const drainClock = typeof runtime.now === "function" ? runtime.now : () => new Date();
      // Every drain outcome is persisted so schedule:health can alert on a drain
      // that keeps failing even while the day's sync job reads "partial".
      const drain = (async () => {
      const clock = drainClock;
      const claim = runtime.jobs.claimNext({ workerPid: runtime.workerPid, now: clock(), leaseSeconds: 120 });
      let result = { status: "no_op", reason: "queue_empty" };
      let workerError = null;
      try {
        if (claim) result = await runtime.runWorker(runtime.workerContext, claim.run_id);
      } catch (error) {
        workerError = error;
      }
      let batchReview = null;
      if (!workerError && runtime.processBatchReviews) {
        try { batchReview = await runtime.processBatchReviews(); }
        catch (error) { batchReview = {status: "partial", errors: [{code: error.code ?? "batch_review_failed"}],
          ...(error.details?.metadata_repair ? {metadata_repair: error.details.metadata_repair} : {})}; }
      }
      let captionRepair = null;
      if (!workerError && runtime.processCaptionRepair) {
        try { captionRepair = await runtime.processCaptionRepair(); }
        catch (error) { captionRepair = {status: "partial", error: {code: error.code ?? "caption_repair_failed"}}; }
      }
      let captionBackfill = null;
      if (!workerError && runtime.processCaptionBackfill) {
        try { captionBackfill = await runtime.processCaptionBackfill(); }
        catch (error) { captionBackfill = {status: "partial", error: {code: error.code ?? "caption_backfill_failed",
          message: String(error.message ?? "").slice(0, 400), details: error.details ?? {}}}; }
      }
      let captionAuto = null;
      if (!workerError && runtime.processCaptionAuto) {
        try { captionAuto = await runtime.processCaptionAuto(); }
        catch (error) { captionAuto = {status: "partial", error: {code: error.code ?? "caption_auto_failed"}}; }
      }
      let beidouPool = null;
      if (!workerError && runtime.processBeidouPool) {
        try { beidouPool = await runtime.processBeidouPool(); }
        catch (error) { beidouPool = {status: "partial", errors: [{code: error.code ?? "beidou_pool_failed"}]}; }
      }
      let dailyViews = null, analytics = null;
      try {
        dailyViews = runtime.projectDailyViews ? await runtime.projectDailyViews() : null;
        analytics = runtime.projectAnalytics ? await runtime.projectAnalytics() : null;
      } catch (error) {
        if (batchReview) error.details = {...(error.details ?? {}), batch_review: batchReview};
        if (captionRepair && captionRepair.status !== "disabled") error.details = {...(error.details ?? {}), caption_repair: captionRepair};
        if (captionBackfill && captionBackfill.status !== "disabled") error.details = {...(error.details ?? {}), caption_backfill: captionBackfill};
        if (captionAuto && captionAuto.status !== "disabled") error.details = {...(error.details ?? {}), caption_auto: captionAuto};
        if (beidouPool && beidouPool.status !== "disabled") error.details = {...(error.details ?? {}), beidou_pool: beidouPool};
        throw error;
      }
      const notifications = await retryNotifications(runtime);
      if (workerError) throw workerError;
      return { ...result,
        ...(beidouPool?.status === "partial" ? {status: "partial"} : beidouPool?.status === "schema_missing" ? {status: "schema_missing"} : {}),
        ...(batchReview && batchReview.status !== "disabled" ? {batch_review: batchReview} : {}),
        ...(captionRepair && captionRepair.status !== "disabled" ? {caption_repair: captionRepair} : {}),
        ...(captionBackfill && captionBackfill.status !== "disabled" ? {caption_backfill: captionBackfill} : {}),
        ...(captionAuto && captionAuto.status !== "disabled" ? {caption_auto: captionAuto} : {}),
        ...(beidouPool && beidouPool.status !== "disabled" ? {beidou_pool: beidouPool} : {}),
        ...(analytics && analytics.status !== "disabled" ? {analytics} : {}), notification_retries: notifications.length,
        ...(dailyViews && dailyViews.status !== "disabled" ? { daily_views: dailyViews } : {}) };
      })();
      // Bookkeeping must never change the drain's own result.
      const record = (outcome) => { if (runtime.jobs?.db) { try { recordDrainOutcome(runtime.jobs.db, { ...outcome, now: drainClock() }); } catch {} } };
      try {
        const drained = await drain;
        record({ ok: true });
        return drained;
      } catch (error) {
        record({ ok: false, error });
        throw error;
      }
    }
    if (key === "schedule:health") {
      const now = runtime.now();
      const parts = beijingParts(now);
      const jobs = runtime.jobs.listByBeijingDate(parts.date).filter((job) => job.trigger === "schedule");
      const due = evaluateDueSlots(now, jobs, runtime.config?.schedule);
      const state = due.at(-1) ?? { alert: false, reason: "before_health_window" };
      // The job state is not proof of healthy data: capture detail, the drain
      // history and ledger integrity are checked whatever the job state is,
      // each alerted at most once per day.
      // A failure in these extra checks must not suppress the missing-run alert below.
      // Finished runs are reported at any hour, not only inside the health
      // window, and before the alerts: a delivered report replaces the capture alert.
      let reports = [];
      let reportError = {};
      try {
        const dates = [parts.date];
        for (let back = 0; back < CAPTURE_REPORT_LOOKBACK_DAYS; back += 1) dates.unshift(dayBefore(dates[0]));
        reports = await captureReports(runtime, { now, jobs: dates.flatMap((date) => runtime.jobs.listByBeijingDate(date)) });
      } catch (error) {
        reportError = { reports_error: { code: typeof error?.code === "string" ? error.code.slice(0, 64) : "capture_report_failed" } };
      }
      let extra = [];
      let extraError = {};
      if (state.reason !== "before_health_window") {
        try { extra = await pipelineHealthAlerts(runtime, { now, date: parts.date, jobs }); }
        catch (error) { extraError = { alerts_error: { code: typeof error?.code === "string" ? error.code.slice(0, 64) : "health_check_failed" } }; }
      }
      // An alert of an earlier slot that did not go out is still owed once a
      // later slot is the one being judged.
      let owed = false;
      for (const earlier of due.slice(0, -1)) {
        if (!earlier.alert) continue;
        const sent = await sendDailyAlert(runtime, { kind: "missing-terminal", key: missingRunAlertKey(parts.date, earlier, runtime.config?.schedule), now, text: missingRunAlertText(parts.date, earlier) });
        if (sent.status === "already_claimed") continue;
        extra.push(sent);
        if (sent.status === "failed") owed = true;
      }
      const alerts = { ...(extra.length ? { alerts: extra } : {}), ...extraError, ...(reports.length ? { reports } : {}), ...reportError };
      // A report that reached nobody, a report or alert that only reached the
      // ops chat, and reports that could not be produced are trouble of this
      // run, whatever else went out.
      const trouble = owed || Boolean(reportError.reports_error) || reports.some((report) => report.status === "failed" || report.fallback === true) ||
        extra.some((alert) => alert.fallback === true);
      const extraStatus = trouble ? "partial"
        : extra.some((alert) => alert.status === "sent") ? "alerted"
          : reports.some((report) => report.status === "sent") ? "reported" : "no_op";
      if (!state.alert) return { status: extraStatus, beijing_date: parts.date, ...state, ...alerts };
      const alertKey = missingRunAlertKey(parts.date, state, runtime.config?.schedule);
      const ownerId = randomUUID();
      if (!runtime.jobs.claimHealthAlert(alertKey, { ownerId, now, leaseSeconds: 120 })) return { status: extraStatus, reason: "alert_already_claimed", beijing_date: parts.date, ...alerts };
      let rerouted = false;
      try {
        rerouted = (await deliverAlert(runtime, alertKey, missingRunAlertText(parts.date, state), { now })).fallback;
        runtime.jobs.markHealthAlert(alertKey, "sent", { ownerId, now });
      } catch (error) {
        runtime.jobs.markHealthAlert(alertKey, "failed", { ownerId, now, error: typeof error?.code === "string" ? error.code : "notification_delivery_failed" });
        throw error;
      }
      return { status: trouble || rerouted ? "partial" : "alerted", beijing_date: parts.date, ...state, ...alerts, ...(rerouted ? { fallback: true } : {}) };
    }
    if (key === "migrate:reconcile-plan" || key === "migrate:reconcile-apply" || key === "migrate:reconcile-recover" || key === "migrate:reconcile-checkpoint-plan") {
      if (identity.mode !== "local" || !runtime.config?.auth?.isPrivilegedAllowed?.(identity.actorId)) fail("privileged_required", "Google reconciliation is a local administrator operation");
      if (key === "migrate:reconcile-apply" && command.options.confirm !== "apply-now") fail("action_confirmation_required", "Reconciliation requires --confirm apply-now");
      if (key === "migrate:reconcile-checkpoint-plan") return runtime.reconcileCheckpointPlan(payload);
      if (key === "migrate:reconcile-recover") return runtime.recoverGoogle(payload, command.options, identity);
      return runtime.reconcileGoogle(payload, command.options, identity, key === "migrate:reconcile-apply");
    }
    if (key === "migrate:plan") return runtime.migratePlan(payload, command.options);
    if (key === "migrate:attest-permissions") {
      if (!runtime.config?.auth?.isPrivilegedAllowed?.(identity.actorId)) fail("privileged_required", "Permission attestation requires a privileged actor");
      return runtime.attestPermissions(payload, command.options, identity);
    }
    if (key === "migrate:apply") {
      if (!runtime.config?.auth?.isPrivilegedAllowed?.(identity.actorId)) fail("privileged_required", "Migration apply requires a privileged actor");
      if (command.options.confirm !== "apply-now") fail("action_confirmation_required", "Migration apply requires --confirm apply-now");
      return runtime.migrateApply(payload, command.options);
    }
    if (key === "migrate:verify") {
      if (!runtime.config?.auth?.isPrivilegedAllowed?.(identity.actorId)) fail("privileged_required", "Migration verify requires a privileged actor");
      return runtime.migrateVerify(payload, command.options);
    }
    fail("command_not_allowed", "Command dispatch is not registered", { command: key });
  };
}

async function baseSchemaMetadata(client, config, { includeRecordEvidence = false } = {}) {
  const tables = await client.listTables(config.base.appToken);
  if (!tables || tables.complete !== true || !Array.isArray(tables.items)) fail("base_response_incomplete", "Complete configured Base table metadata is required");
  const expectedBindings = new Map(CANARY_TABLES.map(([binding, tableName]) => [config.base.tableIds[binding], tableName]));
  if (config.base.dailyViewsTableId) expectedBindings.set(config.base.dailyViewsTableId, DAILY_VIEWS_TABLE);
  for (const [key, tableId] of Object.entries(config.base.analyticsTableIds ?? {})) expectedBindings.set(tableId, ANALYTICS_TABLES[key].name);
  const analyticsIds = new Set(Object.values(config.base.analyticsTableIds ?? {}));
  const externalIds = new Set(Object.keys(config.base.externalTables ?? {}));
  for (const [tableId, name] of Object.entries(config.base.externalTables ?? {})) expectedBindings.set(tableId, name);
  const expectedCount = TABLE_ORDER.length + (config.base.dailyViewsTableId ? 1 : 0) + analyticsIds.size + externalIds.size;
  if (tables.items.length !== expectedCount || expectedBindings.size !== expectedCount ||
      new Set(tables.items.map((table) => table?.table_id)).size !== expectedCount ||
      new Set(tables.items.map((table) => table?.name)).size !== expectedCount ||
      tables.items.some((table) => typeof table?.table_id !== "string" ||
        expectedBindings.get(table.table_id) !== table.name)) {
    fail("base_schema_drift", "Base table inventory differs from configured business, analytics, and external bindings");
  }
  const selected = [];
  for (const table of tables.items) {
    if (table.table_id === config.base.dailyViewsTableId || analyticsIds.has(table.table_id) || externalIds.has(table.table_id)) continue;
    if (typeof client.getTable !== "function") fail("base_response_incomplete", "Complete Base table detail is required");
    const detail = await client.getTable(config.base.appToken, table.table_id);
    if (!detail || detail.table_id !== table.table_id || detail.name !== table.name ||
        typeof detail.primary_field !== "string" || detail.primary_field.length === 0) {
      fail("base_response_incomplete", "Base table detail does not match the configured table");
    }
    const fields = await client.listFields(config.base.appToken, table.table_id);
    if (!fields || fields.complete !== true || !Array.isArray(fields.items)) {
      fail("base_response_incomplete", "Complete Base field metadata is required");
    }
    if (!fields.items.some((field) => field?.field_id === detail.primary_field)) {
      fail("base_response_incomplete", "Base primary field is missing from field metadata");
    }
    const selectedTable = {
      ...table,
      primary_field: detail.primary_field,
      fields: fields.items.map((field) => {
        const normalizedField = { ...field, ...(field.field_id === detail.primary_field ? { is_primary: true } : {}) };
        if (field.options === undefined) return normalizedField;
        if (!Array.isArray(field.options) || field.options.some((option) => !option || typeof option !== "object" ||
            Array.isArray(option) || typeof option.name !== "string" || option.name === "" || option.name.trim() !== option.name) ||
            new Set(field.options.map((option) => option.name)).size !== field.options.length) {
          fail("base_response_invalid", "Base field options are malformed or duplicate");
        }
        normalizedField.options = field.options.map((option) => ({ name: option.name }));
        return normalizedField;
      }),
      revision: fields.revision,
    };
    if (includeRecordEvidence) {
      const records = await client.listRecords(config.base.appToken, table.table_id, { tableName: table.name });
      if (!records || records.complete !== true || !Array.isArray(records.items) ||
          records.items.some((record) => typeof record?.record_id !== "string" || record.record_id.length === 0)) {
        fail("base_response_incomplete", "Complete Base record metadata is required");
      }
      const recordKeys = records.items.map((record) => record.record_id).sort();
      selectedTable.record_count = recordKeys.length;
      selectedTable.primary_key_set_sha256 = createHash("sha256").update(JSON.stringify(recordKeys)).digest("hex");
    }
    selected.push(selectedTable);
  }
  const fieldsById = new Map();
  for (const table of selected) {
    for (const field of table.fields) {
      if (typeof field.field_id !== "string" || field.field_id === "" || fieldsById.has(field.field_id)) {
        fail("base_response_invalid", "Base field identifiers are missing or duplicate");
      }
      fieldsById.set(field.field_id, { table, field });
    }
  }
  for (const table of selected) {
    table.fields = table.fields.map((field) => {
      if (field.bidirectional_link_field_id === undefined) return field;
      const reverse = fieldsById.get(field.bidirectional_link_field_id);
      if (field.bidirectional !== true || !reverse || reverse.field.bidirectional !== true ||
          reverse.field.bidirectional_link_field_id !== field.field_id || field.link_table !== reverse.table.table_id ||
          reverse.field.link_table !== table.table_id ||
          field.bidirectional_link_field_name !== undefined && field.bidirectional_link_field_name !== reverse.field.name) {
        fail("base_response_invalid", "Base bidirectional link metadata is inconsistent");
      }
      return { ...field, bidirectional_link_field_name: reverse.field.name };
    });
  }
  const canonical = JSON.stringify(selected.map((table) => ({
    table_id: table.table_id, name: table.name, revision: table.revision ?? null,
    fields: table.fields.map((field) => field).sort((left, right) => String(left.name).localeCompare(String(right.name))),
  })).sort((left, right) => String(left.name).localeCompare(String(right.name))));
  return { complete: true, revision: `base-schema-v1:${createHash("sha256").update(canonical).digest("hex")}`, tables: selected };
}

const MAX_GOOGLE_CREDENTIAL_BYTES = 64 * 1024;
const GOOGLE_TOKEN_URIS = new Set([
  "https://oauth2.googleapis.com/token",
  "https://www.googleapis.com/oauth2/v4/token",
]);
const GOOGLE_CREDENTIAL_KEYS = new Set([
  "type", "project_id", "private_key_id", "private_key", "client_email", "client_id", "auth_uri", "token_uri",
  "auth_provider_x509_cert_url", "client_x509_cert_url", "universe_domain",
]);

export async function readGoogleServiceAccount(path, { openFile = open } = {}) {
  const candidate = resolve(typeof path === "string" ? path : "");
  let cursor = dirname(candidate);
  let before;
  let handle;
  try {
    while (true) {
      const parent = await lstat(cursor);
      if (parent.isSymbolicLink() || !parent.isDirectory()) fail("google_source_invalid", "Google service account parent is unsafe");
      const next = dirname(cursor);
      if (next === cursor) break;
      cursor = next;
    }
    before = await lstat(candidate);
    const uid = typeof process.getuid === "function" ? process.getuid() : null;
    if (before.isSymbolicLink() || !before.isFile() || uid === null || before.uid !== uid ||
        (before.mode & 0o777) !== 0o600 || before.size === 0 || before.size > MAX_GOOGLE_CREDENTIAL_BYTES) {
      fail("google_source_invalid", "Google service account file is unsafe");
    }
    handle = await openFile(candidate, fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW);
    const opened = await handle.stat();
    if (!opened.isFile() || opened.dev !== before.dev || opened.ino !== before.ino || opened.size !== before.size ||
        opened.uid !== uid || (opened.mode & 0o777) !== 0o600 || opened.size > MAX_GOOGLE_CREDENTIAL_BYTES) {
      fail("google_source_invalid", "Google service account file changed during validation");
    }
    const bytes = await handle.readFile();
    let parsed;
    try { parsed = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)); }
    catch { fail("google_source_invalid", "Google service account JSON is invalid"); }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed) || Object.getPrototypeOf(parsed) !== Object.prototype ||
        Object.keys(parsed).some((key) => !GOOGLE_CREDENTIAL_KEYS.has(key)) || parsed.type !== "service_account" ||
        typeof parsed.client_email !== "string" || parsed.client_email.trim() !== parsed.client_email ||
        !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.iam\.gserviceaccount\.com$/.test(parsed.client_email) ||
        typeof parsed.private_key !== "string" || !/^-----BEGIN PRIVATE KEY-----\n[A-Za-z0-9+/=\n]+\n-----END PRIVATE KEY-----\n?$/.test(parsed.private_key) ||
        !GOOGLE_TOKEN_URIS.has(parsed.token_uri) ||
        Object.entries(parsed).some(([key, value]) => !["private_key"].includes(key) && typeof value !== "string")) {
      fail("google_source_invalid", "Google service account fields are invalid");
    }
    return structuredClone(parsed);
  } catch (error) {
    if (error instanceof ShortDramaError) throw error;
    fail("google_source_invalid", "Google service account could not be read");
  } finally {
    await handle?.close();
  }
}

export function terminalDashboardState(block) {
  let text = block?.data_config?.text;
  // Base PATCH can return a JSON-encoded string while GET/create use plain text.
  // Decode one string layer only; arbitrary JSON and nested encodings still fail.
  if (typeof text === "string" && text.startsWith('"')) {
    try { text = JSON.parse(text); } catch { fail("base_response_invalid", "Terminal dashboard state is malformed"); }
  }
  if (text === "尚无成功同步记录") return null;
  const legacy = typeof text === "string" ? /^\*\*最近一次同步终态\*\*\n状态：(success|partial|failed)\nrun_id：([^\r\n]+)\n完成时间：([^\r\n]+)$/.exec(text) : null;
  const compact = typeof text === "string" ? /^最近一次同步终态 · 状态：(success|partial|failed) · run_id：([^\r\n]+) · 完成时间：([^\r\n ]+)$/.exec(text) : null;
  const match = legacy ?? compact;
  const parsed = match ? Date.parse(match[3]) : Number.NaN;
  if (!match || !Number.isFinite(parsed) || !/T.*(?:Z|[+-]\d{2}:\d{2})$/.test(match[3])) {
    fail("base_response_invalid", "Terminal dashboard state is malformed");
  }
  return { state: match[1], runId: match[2], finishedAtMs: parsed };
}

function terminalDashboardFinishedAt(block) {
  return terminalDashboardState(block)?.finishedAtMs ?? null;
}

const NOTIFICATION_TIMEOUT_MS = 30_000;

async function defaultFeishuFetch(url, options) {
  // The deadline covers the response body as well: a stalled notification must
  // fail and be retried on a later tick, not hang the scheduler run.
  const response = await fetch(url, { ...options, signal: options?.signal ?? AbortSignal.timeout(NOTIFICATION_TIMEOUT_MS) });
  const payload = await response.json();
  if (!response.ok || payload?.code !== 0) {
    fail("notification_delivery_failed", "Feishu notification request failed",
      { status: response.status, ...(Number.isInteger(payload?.code) ? { feishu_code: payload.code } : {}) });
  }
  return payload;
}

// Feishu answers that prove the chat did not get the message and will not take
// it on a retry either: the bot is not in the chat (230002), may not speak
// there (230035), or the chat was dissolved (232009).
const FEISHU_CHAT_REFUSALS = new Set([230002, 230035, 232009]);
const isChatRefusal = (status, code) => FEISHU_CHAT_REFUSALS.has(code) &&
  (status === undefined || (Number.isInteger(status) && status >= 400 && status < 500 && status !== 429));

export function createFeishuMessageSender({ tokenProvider, isChatAllowed, fetchJson = defaultFeishuFetch } = {}) {
  if (typeof tokenProvider !== "function" || typeof isChatAllowed !== "function" || typeof fetchJson !== "function") {
    fail("notifier_config_invalid", "Feishu message adapter configuration is invalid");
  }
  return async ({ chatId, text, idempotencyKey }) => {
    if (!isChatAllowed(chatId) || typeof text !== "string" || text.length === 0 || text.length > 2_000 ||
        (idempotencyKey !== undefined && (typeof idempotencyKey !== "string" || !/^[A-Za-z0-9_-]{1,50}$/.test(idempotencyKey)))) {
      fail("notification_target_denied", "Notification destination or body is invalid");
    }
    const token = await tokenProvider();
    if (typeof token !== "string" || token.length === 0) fail("base_auth_failed", "Feishu tenant token is invalid");
    const refused = () => fail("notification_target_refused", "Feishu chat refused the notification");
    let result;
    try {
      result = await fetchJson("https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=chat_id", {
        method: "POST",
        headers: { authorization: `Bearer ${token}`, "content-type": "application/json; charset=utf-8" },
        // Feishu sends at most one message per uuid within an hour.
        body: JSON.stringify({ receive_id: chatId, msg_type: "text", content: JSON.stringify({ text }), ...(idempotencyKey ? { uuid: idempotencyKey } : {}) }),
      });
    } catch (error) {
      if (error?.code === "notification_delivery_failed" && isChatRefusal(error.details?.status, error.details?.feishu_code)) refused();
      throw error;
    }
    if (isChatRefusal(undefined, result?.code)) refused();
    if (!result || result.code !== 0) fail("notification_delivery_failed", "Feishu notification response is invalid");
    return result;
  };
}

function schemaActionOptionNames(action) {
  const raw = action?.spec?.canonical?.options;
  if (!Array.isArray(raw) || raw.some((option) => !option || typeof option !== "object" ||
      Array.isArray(option) || typeof option.name !== "string")) return null;
  return raw.map((option) => option.name);
}

function schemaActionFieldMatches(actual, expected) {
  return Object.entries(expected).every(([key, value]) => {
    if (key !== "options") return isDeepStrictEqual(actual?.[key], value);
    return Array.isArray(actual?.options) && isDeepStrictEqual(
      actual.options.map((option) => option?.name),
      value.map((option) => option.name),
    );
  });
}

function verifySchemaActionReadback(action, schema) {
  try {
    const spec = BASE_FIELD_SPECS[action?.table]?.find((candidate) => candidate.name === action?.field);
    const table = schema?.tables?.find((candidate) => candidate.name === action?.table);
    if (!spec || !table || !Array.isArray(table.fields)) return false;
    const byName = table.fields.filter((field) => field?.name === action.field);
    const byId = action.field_id === undefined
      ? byName
      : table.fields.filter((field) => field?.field_id === action.field_id);
    if (byName.length !== 1 || byId.length !== 1 || byName[0] !== byId[0] ||
        typeof byName[0].field_id !== "string" || byName[0].field_id === "") return false;
    const bindings = spec.kind === "link"
      ? { targetTableId: schema.tables.find((candidate) => candidate.name === spec.targetTable)?.table_id }
      : {};
    if (spec.kind === "link" && typeof bindings.targetTableId !== "string") return false;
    const initialOptions = action.kind === "create_field" && spec.optionPolicy === "manifest_append"
      ? schemaActionOptionNames(action)
      : undefined;
    if (action.kind === "create_field" && spec.optionPolicy === "manifest_append" && initialOptions === null) return false;
    const expected = fixedFieldDescriptor(
      action.table,
      action.field,
      bindings,
      initialOptions === undefined ? {} : { initialOptions },
    );
    if (!schemaActionFieldMatches(byName[0], expected)) return false;
    if (spec.primary && byName[0].is_primary !== true && byName[0].primary !== true) return false;
    if (action.kind === "update_select_options") {
      return Array.isArray(byName[0].options) && isDeepStrictEqual(
        byName[0].options.map((option) => option?.name),
        action.after_options,
      );
    }
    return true;
  } catch {
    return false;
  }
}

export function createSchemaAdapters(client, config) {
  const readSchema = () => baseSchemaMetadata(client, config);
  const schemaAdapter = {
    readSchema,
    createField: (tableId, tableName, fieldName, bindings, initialOptions) => client.createField(
      config.base.appToken,
      tableId,
      tableName,
      fieldName,
      bindings,
      { initialOptions },
    ),
    updateField: (tableId, fieldId, tableName, fieldName) => client.updateField(config.base.appToken, tableId, fieldId, tableName, fieldName),
    updateSelectFieldOptions: (tableId, fieldId, tableName, fieldName, optionNames) => client.updateSelectFieldOptions(
      config.base.appToken,
      tableId,
      fieldId,
      tableName,
      fieldName,
      optionNames,
    ),
    verifySchemaAction: (action, schema) => verifySchemaActionReadback(action, schema),
  };
  const presentationAdapter = {
    readSchema,
    listViews: (tableId) => client.listViews(config.base.appToken, tableId),
    createView: (tableId, tableName, viewName) => client.createView(config.base.appToken, tableId, tableName, viewName),
    updateView: (tableId, viewId, tableName, viewName) => client.updateView(config.base.appToken, tableId, viewId, tableName, viewName),
    readViewConfiguration: (tableId, viewId, tableName, viewName, fields) => client.readViewConfiguration(config.base.appToken, tableId, viewId, tableName, viewName, { fields }),
    listDashboards: () => client.listDashboards(config.base.appToken),
    createDashboard: (name) => client.createDashboard(config.base.appToken, name),
    listDashboardBlocks: (dashboardId) => client.listDashboardBlocks(config.base.appToken, dashboardId),
    createDashboardBlock: (dashboardId, name) => client.createDashboardBlock(config.base.appToken, dashboardId, name),
    readDashboardBlock: (dashboardId, blockId, name) => client.readDashboardBlock(config.base.appToken, dashboardId, blockId, name),
    updateDashboardBlock: (dashboardId, blockId, name) => client.updateDashboardBlock(config.base.appToken, dashboardId, blockId, name),
  };
  return { schemaAdapter, presentationAdapter };
}

export function schemaReadiness(schema, config) {
  if (!schema || schema.complete !== true || !Array.isArray(schema.tables)) {
    return { status: "schema_drift", reason: "unexpected_table_set" };
  }
  const expectedNamesById = new Map(CANARY_TABLES.map(([binding, tableName]) => [config.base.tableIds[binding], tableName]));
  if (schema.tables.some((table) => expectedNamesById.get(table?.table_id) !== table?.name)) {
    return { status: "schema_drift", reason: "unexpected_table_set" };
  }
  const byId = new Map(schema.tables.map((table) => [table.table_id, table]));
  const tableIdsByName = {};
  for (const tableName of TABLE_ORDER) {
    const binding = { "账号台账": "accounts", "选剧池": "dramas", "采集数据": "captures", "发布记录": "releases" }[tableName];
    const table = byId.get(config.base.tableIds[binding]);
    if (!table || table.name !== tableName) return {
      status: "base_table_missing",
      table: tableName,
      next_step: "create_four_empty_tables_and_bind_ids",
    };
    tableIdsByName[tableName] = table.table_id;
  }
  for (const tableName of TABLE_ORDER) {
    const table = schema.tables.find((candidate) => candidate.name === tableName);
    const actualNames = table.fields.map((field) => field.name).sort();
    const expectedNames = BASE_FIELD_SPECS[tableName].map((field) => field.name).sort();
    // User-added fields are outside Runner ownership. Required fields still have
    // exact descriptors below; duplicate names must never shadow a managed field.
    const duplicateNames = [...new Set(actualNames.filter((name, index) => index > 0 && name === actualNames[index - 1]))];
    if (duplicateNames.length) return { status: "schema_drift", table: tableName, reason: "duplicate_field_names", fields: duplicateNames };
    const missingFields = expectedNames.filter((name) => !actualNames.includes(name));
    if (missingFields.length) return {
      status: "schema_missing", table: tableName, missing_fields: missingFields,
      extra_fields: actualNames.filter((name) => !expectedNames.includes(name)),
    };
    for (const spec of BASE_FIELD_SPECS[tableName]) {
      const field = table.fields.find((candidate) => candidate.name === spec.name);
      const expected = fixedFieldDescriptor(tableName, spec.name, spec.kind === "link" ? { targetTableId: tableIdsByName[spec.targetTable] } : {});
      // Base owns numbering on the current live tables; legacy text IDs remain readable.
      if (spec.autoNumberPrefix && field?.type === "auto_number") {
        expected.type = "auto_number";
        expected.style = { rules: [{ text: spec.autoNumberPrefix, type: "text" }, { length: 6, type: "incremental_number" }] };
      }
      const mismatches = Object.entries(expected).filter(([key, value]) => !isDeepStrictEqual(field?.[key], value)).map(([key]) => key);
      if (spec.primary && field?.is_primary !== true && field?.primary !== true) mismatches.push("is_primary");
      if (mismatches.length) {
        const optionDetails = mismatches.includes("options") ? {
          expected_options: expected.options?.map((option) => option.name) ?? null,
          actual_options: field?.options?.map((option) => option.name) ?? null,
        } : {};
        return { status: "schema_drift", table: tableName, field: spec.name, mismatches, expected_type: expected.type, actual_type: field?.type, ...optionDetails };
      }
    }
  }
  return { status: "ready" };
}

export function jobStoreReadOnly(command) {
  return command?.group === "doctor" && command.options?.initState !== true &&
    !(command.options?.beidouFields === true && command.options?.confirm === "apply-now");
}

export async function buildRuntime({ configPath, env = process.env, now = () => new Date(), spawnFile = defaultSpawnFile, command = null, services = {} } = {}) {
  const config = loadRuntimeConfig({ env, configPath, notificationChatId: env.SHORTDRAMA_OPS_CHAT_ID });
  const initState = command?.group === "doctor" && command.options?.initState === true;
  const baseConfirmationRequired = command && (command.group === "migrate" || command.group === "doctor" && !initState);
  if (baseConfirmationRequired) {
    const expected = command.options?.expectedBaseToken;
    const configured = config.base.appToken;
    if (typeof expected !== "string") fail("base_target_mismatch", "An independent expected Base token is required");
    const left = Buffer.from(expected);
    const right = Buffer.from(configured);
    if (left.length !== right.length || !timingSafeEqual(left, right)) fail("base_target_mismatch", "Configured Base does not match the independently confirmed target");
  }
  if (initState && !config.auth.isPrivilegedAllowed(command.options.actorId)) {
    fail("privileged_required", "State initialization requires a privileged actor");
  }
  const jobs = new JobStore(config.paths.opsSqlite, {
    readOnly: jobStoreReadOnly(command),
    initialize: initState,
  });
  try {
    const tokenProvider = createTenantTokenProvider({ appId: config.auth.feishuAppId, appSecret: config.getFeishuAppSecret() });
    const client = services.client ?? new FeishuClient({ tokenProvider });
    const repos = new BaseRepositories({ client, appToken: config.base.appToken, tableIds: config.base.tableIds });
    const workerRepos = new BaseRepositories({ client, appToken: config.base.appToken, tableIds: config.base.tableIds, writableOnly: true });
    const captionRepos = captionRepositories({full:repos,worker:workerRepos});
    const operatorIds = new Set(config.auth.getOperatorIds());
    const privilegedIds = new Set(config.auth.getPrivilegedIds());
    const notificationChatIds = new Set(config.auth.getNotificationChatIds());
    const HumanOpsConstructor = services.HumanOpsService ?? HumanOpsService;
    const NotifierConstructor = services.ShortDramaNotifier ?? ShortDramaNotifier;
    const humanOps = new HumanOpsConstructor({
      repos, jobs, operators: operatorIds, privileged: privilegedIds, now,
      makeReceiptId: () => `sdp_${randomUUID()}`,
      allocateDramaId: (liveMax) => allocateBusinessId(jobs.db, "drama", liveMax),
      allocateReleaseId: (liveMax) => allocateBusinessId(jobs.db, "release", liveMax),
    });
    const sendMessage = createFeishuMessageSender({ tokenProvider, isChatAllowed: config.auth.isNotificationChatAllowed });
    const updateTerminalDashboard = async (job) => {
      const dashboards = await client.listDashboards(config.base.appToken);
      if (dashboards?.complete !== true || !Array.isArray(dashboards.items)) fail("base_response_incomplete", "Complete dashboard list is required");
      const matches = dashboards.items.filter((item) => item.name === "短剧发行管理仪表盘");
      if (matches.length !== 1 || typeof matches[0].dashboard_id !== "string") fail("base_schema_drift", "Fixed terminal dashboard is missing or duplicate");
      const dashboardId = matches[0].dashboard_id;
      const blocks = await client.listDashboardBlocks(config.base.appToken, dashboardId);
      if (blocks?.complete !== true || !Array.isArray(blocks.items)) fail("base_response_incomplete", "Complete dashboard block list is required");
      const blockMatches = blocks.items.filter((item) => item.name === "最近一次同步终态");
      if (blockMatches.length !== 1 || typeof blockMatches[0].block_id !== "string") fail("base_schema_drift", "Fixed terminal dashboard block is missing or duplicate");
      const blockId = blockMatches[0].block_id;
      const terminal = { state: job.state, runId: job.run_id, finishedAt: job.finished_at };
      const expected = fixedTerminalDashboardBlockDescriptor(terminal);
      const current = await client.readDashboardBlock(config.base.appToken, dashboardId, blockId, expected.name);
      const currentFinishedAt = terminalDashboardFinishedAt(current);
      const candidateFinishedAt = Date.parse(job.finished_at);
      if (currentFinishedAt !== null && candidateFinishedAt < currentFinishedAt) return;
      await client.updateDashboardTerminalBlock(config.base.appToken, dashboardId, blockId, terminal);
      const readback = await client.readDashboardBlock(config.base.appToken, dashboardId, blockId, expected.name);
      if (!isDeepStrictEqual(terminalDashboardState(readback), terminalDashboardState(expected))) fail("readback_mismatch", "Terminal dashboard readback did not match persisted job");
    };
    const notifier = new NotifierConstructor({ allowedChatIds: notificationChatIds, sendMessage, updateTerminalDashboard, jobs });
    const opsChatId = normalized(env.SHORTDRAMA_OPS_CHAT_ID, "opsChatId");
    if (!config.auth.isNotificationChatAllowed(opsChatId)) fail("notification_target_denied", "Ops chat is not allowlisted");
    const reportChatId = config.notifications?.getReportChatId?.() ?? opsChatId;
    const wakeWorker = createWakeWorker({ spawnFile });
    const collector = createCollectorAdapter({
      nodePath: process.execPath, collectorPath: config.paths.collector, collectorCwd: dirname(config.paths.collector),
      summaryDir: config.paths.collectorSummaryDir, maxPostAgeDays: config.capture.maxAgeDays, excludedPostIds: config.capture.excludedPostIds, metricsSqlitePath: config.paths.metricsSqlite, spawnFile, now,
      readRegisteredPosts: async ({ signal }) => registeredCaptureTargets({
        accounts: await workerRepos.accounts.loadIndex({ signal }),
        captures: await workerRepos.captures.loadIndex({ signal }),
        releases: await workerRepos.releases.loadIndex({ signal }),
      }),
    });
    const syncContext = { jobs, makeRunId, wakeWorker, now };
    const workerPid = process.pid;
    const runtimeSchema = services.readSchema ?? (async () => baseSchemaMetadata(client, config));
    const migrationBase = services.readMigrationSchema ?? services.readSchema ??
      (async () => baseSchemaMetadata(client, config, { includeRecordEvidence: true }));
    const assertRuntimeSchemaReady = async () => {
      const schema = await runtimeSchema();
      const readiness = schemaReadiness(schema, config);
      if (readiness.status === "ready") {
        for (const table of schema.tables) {
          const generated = table.fields.find((field) => field.name === TABLES[table.name].primaryField)?.type === "auto_number";
          repos.repositoryForTable(table.name).serverGeneratedIds = generated;
          workerRepos.repositoryForTable(table.name).serverGeneratedIds = generated;
        }
        return schema.revision;
      }
      if (["base_table_missing", "schema_missing"].includes(readiness.status)) {
        fail("schema_missing", "Runtime Base schema is incomplete", readiness);
      }
      fail("base_schema_drift", "Runtime Base schema does not match the fixed contract", readiness);
    };
    const sourceReaders = services.source ?? { readLatestAccounts, readLatestPosts };
    // Sync only needs stored fields; ambiguous display lookups must not abort unrelated rows.
    const aliases = config.batchReview.ownerAliases;
    for (const alias of Object.keys(aliases)) if (!operatorIds.has(alias) && !privilegedIds.has(alias)) fail("batch_alias_denied", "Owner alias must refer to an already authorized actor");
    const batchOperators = new Set([...operatorIds, ...[...operatorIds].map(id => aliases[id]).filter(Boolean)]);
    const batchPrivileged = new Set([...privilegedIds, ...[...privilegedIds].map(id => aliases[id]).filter(Boolean)]);
    const isBatchWriter = id => batchOperators.has(id) || batchPrivileged.has(id);
    const isBatchNotificationRecipient = id => /^ou_[A-Za-z0-9]+$/.test(id);
    const batchHumanOps = new HumanOpsConstructor({repos: workerRepos, jobs, operators: batchOperators, privileged: batchPrivileged, now,
      makeReceiptId: () => `sdp_${randomUUID()}`, allocateDramaId: liveMax => allocateBusinessId(jobs.db,"drama",liveMax), allocateReleaseId: liveMax => allocateBusinessId(jobs.db,"release",liveMax)});
    const batchOps = new BatchOpsService({ repos: workerRepos, jobs, humanOps: batchHumanOps, now,
      readPosts: () => sourceReaders.readLatestPosts(config.paths.metricsSqlite),
      readAccounts: () => sourceReaders.readLatestAccounts(config.paths.metricsSqlite),
      isWriter: isBatchWriter, isPrivileged: id => batchPrivileged.has(id), canonicalOwner: id => aliases[id] ?? id,
      waitHours: config.batchReview.waitHours,
      publicationTimezone: config.batchReview.publicationTimezone,
      publicationTimezoneSince: config.batchReview.publicationTimezoneSince,
      publicationTimezones: config.batchReview.publicationTimezones,
      excludedPostIds: config.capture.excludedPostIds,
    });
    const reviewSenderOptions = {reviewChatId:config.batchReview.reviewChatId,reviewGroupRecipients:config.batchReview.reviewGroupRecipients,isChatAllowed:config.auth.isNotificationChatAllowed};
    const batchSend = createBatchReviewSender({tokenProvider, isRecipientAllowed: isBatchNotificationRecipient, fetchJson: defaultFeishuFetch,...reviewSenderOptions});
    const processReviews = async () => {
      if (!config.batchReview.enabled) return {status: "disabled"};
      await assertRuntimeSchemaReady();
      const metadataRepair = await processBatchMetadataRepairs({jobs, repos: workerRepos, requests: config.batchReview.metadataRepairs, now});
      if (["partial", "deferred"].includes(metadataRepair.status)) return {status: "partial", metadata_repair: metadataRepair, errors: metadataRepair.errors ?? []};
      try {
      const duplicateRelationRepair = await processDuplicateRelationRepairs({jobs, repos: workerRepos, requests: config.batchReview.duplicateRelationRepairs,
        readPostEvidence: async id => (await sourceReaders.readLatestPosts(config.paths.metricsSqlite)).find(post => post.post_id === id), now});
      const scheduleRepair = await processScheduleRepairs({jobs, repos: workerRepos, requests: config.batchReview.scheduleRepairs, now});
      const automatic = await processAutomaticBatchMatches({jobs, repos: workerRepos, query: request => batchOps.query(request), now,
        enabled: config.batchReview.autoMatch, since: config.batchReview.autoMatchSince, countOnlySince: config.batchReview.countOnlySince, isOwnerAllowed: isBatchWriter});
      const held = new Set(automatic.held.map(x => x.batch_id));
      const reviewQuery = async () => {
        const report = await batchOps.query();
        for (const batch of report.rows) if (held.has(batch.batch_id) && !["complete","inactive"].includes(batch.state)) {
          batch.state = "conflict"; batch.notify = true;
          batch.reasons = [...new Set([...batch.reasons,"automatic_attempt_requires_review"])];
        }
        return report;
      };
      const reviewed = await batchHumanOps.withMutationLock((renew, signal) => processBatchReviews({db: jobs.db, query: reviewQuery, now,
        baseUrl: config.base.url, tableId: config.base.tableIds.releases, viewId: config.batchReview.viewId, reminderHours: config.batchReview.reminderHours,
        notifyStartHour: config.batchReview.notifyStartHour, notifyEndHour: config.batchReview.notifyEndHour,
        silentBatchIds: config.batchReview.silentBatchIds,
        isRecipientAllowed: isBatchNotificationRecipient, send: async message => { await renew(); signal.throwIfAborted(); return batchSend(message); },
        project: async (batch, patch) => {
          for (const id of batch.release_ids) {
            await renew();
            const record = await workerRepos.releases.getByKey(id, {signal});
            if (!record || record.fields.批次ID !== batch.batch_id) fail("batch_review_stale", "Batch changed before status projection");
            const changed = Object.fromEntries(Object.entries(patch).filter(([k,v]) => !isDeepStrictEqual(record.fields[k],v)));
            if (Object.keys(changed).length) {
              const result = await workerRepos.releases.machineUpsertWithInvariant(id,changed,{signal});
              if (result.readback !== "verified") fail("readback_mismatch", "Batch status projection failed");
            }
          }
        },
      }));
      return {...reviewed, automatic, metadata_repair: metadataRepair, duplicate_relation_repair: duplicateRelationRepair, schedule_repair: scheduleRepair, status: [reviewed.status, automatic.status, scheduleRepair.status, duplicateRelationRepair.status].includes("partial") ? "partial" : reviewed.status};
      } catch (error) {
        error.details = {...(error.details ?? {}), metadata_repair: metadataRepair};
        throw error;
      }
    };
    const workerContext = {
      jobs, repos: workerRepos, maxPostAgeDays: config.capture.maxAgeDays, excludedPostIds: config.capture.excludedPostIds, notifier, collector, source: sourceReaders,
      workerPid, now, metricsSqlitePath: config.paths.metricsSqlite,
      assertSchemaReady: assertRuntimeSchemaReady,
      withBaseMutationLock: operation => batchHumanOps.withMutationLock((_renew, signal) => operation(signal)),
    };
    const processCaptionBackfill = async () => {
      if (!config.captionBackfill) return {status: "disabled"};
      await assertRuntimeSchemaReady();
      const request={jobs,repos:captionRepos,readPosts:()=>sourceReaders.readLatestPosts(config.paths.metricsSqlite),
        requestId:config.captionBackfill.request_id,mode:config.captionBackfill.mode,cutoff:config.captionBackfill.cutoff,
        publicationTimezone:config.batchReview.publicationTimezone,publicationTimezoneSince:config.batchReview.publicationTimezoneSince,
        publicationTimezones:config.batchReview.publicationTimezones,allowUnknownDrama:config.captionBackfill.allowUnknownDrama,
        leadReviewOnly:config.captionBackfill.leadReviewOnly};
      if(config.captionBackfill.mode==="plan")return stageCaptionBackfillPlan(request);
      const applied=await applyCaptionBackfill({...request,expectedDigest:config.captionBackfill.expected_plan_sha256,
        maxActions:config.captionBackfill.maxActionsPerRun,now});
      if(!config.captionBackfill.leadReviewOnly)return applied;
      const captionSend=createBatchReviewSender({tokenProvider,
        isRecipientAllowed:id=>/^ou_[A-Za-z0-9]+$/.test(id),fetchJson:defaultFeishuFetch,...reviewSenderOptions});
      const notification=await processCaptionOwnerNotifications({jobs,repos:captionRepos,requestId:request.requestId,
        baseUrl:config.base.url,tableId:config.base.tableIds.releases,send:captionSend,now});
      return {...applied,owner_notification:notification};
    };
    const processCaptionRepairRequest = async () => {
      if(!config.captionRepair)return {status:"disabled"};
      await assertRuntimeSchemaReady();
      return processCaptionRepair({jobs,repos,request:config.captionRepair,now});
    };
    const processCaptionAuto = async () => {
      if(!config.captionAuto.enabled)return {status:"disabled"};
      if(config.captionBackfill){
        const row=jobs.db.prepare('SELECT state FROM caption_backfill_runs WHERE request_id=?').get(config.captionBackfill.request_id);
        if(row?.state!=="complete")return {status:"deferred",reason:"historical_backfill_not_complete"};
      }
      await assertRuntimeSchemaReady();
      const result=await processContinuousCaptionReleases({jobs,repos:captionRepos,readPosts:()=>sourceReaders.readLatestPosts(config.paths.metricsSqlite),
        activationAt:config.captionAuto.startAt,maxActions:config.captionAuto.maxActionsPerRun,now,
        publicationTimezone:config.batchReview.publicationTimezone,publicationTimezoneSince:config.batchReview.publicationTimezoneSince,
        publicationTimezones:config.batchReview.publicationTimezones,leadReviewOnly:config.captionAuto.leadReviewOnly,
        recognizeDramas:config.captionAuto.recognizeDramas,verifiedCodes:config.captionAuto.verifiedCodes,partialLinkPostIds:config.captionAuto.partialLinkPostIds,timeOrderTargets:config.captionAuto.timeOrderTargets,observeOnly:config.captionAuto.observeOnly,
        excludedPostIds:config.capture.excludedPostIds});
      if(config.captionAuto.observeOnly||!config.captionAuto.leadReviewOnly&&!config.captionAuto.recognizeDramas)return result;
      const captionSend=createBatchReviewSender({tokenProvider,
        isRecipientAllowed:id=>/^ou_[A-Za-z0-9]+$/.test(id),fetchJson:defaultFeishuFetch,...reviewSenderOptions});
      const notification=await processCaptionAutomationNotifications({jobs,repos:captionRepos,
        baseUrl:config.base.url,tableId:config.base.tableIds.releases,captureTableId:config.base.tableIds.captures,send:captionSend,now,
        notifyStartHour:config.batchReview.notifyStartHour,notifyEndHour:config.batchReview.notifyEndHour,
        excludedPostIds:config.capture.excludedPostIds});
      return {...result,owner_notification:notification};
    };
    const baseBindingSha256 = createHash("sha256").update(JSON.stringify({
      app_token: config.base.appToken,
      table_ids: Object.fromEntries(Object.entries(config.base.tableIds).sort(([left], [right]) => left.localeCompare(right))),
    })).digest("hex");
    const tableBindingsSha256 = createHash("sha256").update(JSON.stringify(
      Object.fromEntries(Object.entries(config.base.tableIds).sort(([left], [right]) => left.localeCompare(right))),
    )).digest("hex");
    const adapters = createSchemaAdapters(client, config);
    const readGoogle = services.readGoogleMigrationSource ?? (async () => readGoogleMigrationSource({
      spreadsheetId: config.sourceSpreadsheetId,
      serviceAccount: await readGoogleServiceAccount(config.paths.googleServiceAccountPath),
    }));
    const runtime = {
      config, jobs, client, repos, humanOps, notifier, opsChatId, reportChatId, now, workerPid, syncContext, workerContext, batchOps,
      processBatchReviews: processReviews, processCaptionRepair:processCaptionRepairRequest, processCaptionBackfill, processCaptionAuto,
      processBeidouPool: async () => {
        if (!config.beidou.enabled) return {status: "disabled"};
        await assertRuntimeSchemaReady();
        return processBeidouPool({ client, jobs, baseToken: config.base.appToken, tableId: config.base.tableIds.dramas,
          apiKey: config.getBeidouApiKey(), startAt: config.beidou.startAt, now,
          withMutationLock: operation => batchHumanOps.withMutationLock(operation) });
      },
      queryBeidouCandidates: async ({ title }) => {
        const rows = await findBeidouCandidates(title, {apiKey: config.getBeidouApiKey()});
        const choice = chooseBeidouCandidate(title, rows);
        const ordered = choice.status === "selected" ? [choice.candidate, ...rows.filter(row => row !== choice.candidate)] : rows;
        return {status: "success", source: "beidou", query: title, match_status: choice.status,
          total: rows.length, complete: true, display_truncated: rows.length > 20,
          candidates: ordered.slice(0, 20).map(row => ({...row,
            platformName: beidouPlatformName(row.platform), languageName: beidouLanguageName(row.languageId),
            launchDate: beidouDatePart(row.publishAt), description: row.description.slice(0, 800)}))};
      },
      assertRuntimeSchemaReady,
      projectDailyViews: () => projectDailyViews({ client, config, jobs, now }),
      projectAnalytics: () => projectAnalytics({ client, config, jobs, now }),
      queryAnalyticsReport: (request) => queryAnalyticsReport({client, config, now: now(), ...request}),
      queryReleaseCandidates: (request) => queryReleaseCandidates({ repos,
        readPosts: () => sourceReaders.readLatestPosts(config.paths.metricsSqlite), now: now(), ...request }),
      runWorker: runSyncWorker,
      sendOpsHealth: sendMessage,
      async doctor({ canary, initState: requestedInitState, beidouFields, confirm, expectedSha256, payload, identity }) {
        if (requestedInitState === true && !initState) fail("state_init_context_invalid", "State initialization requires its explicit CLI command");
        const sequence = jobs.peekSequenceState();
        const schema = await runtimeSchema();
        const readiness = schemaReadiness(schema, config);
        if (requestedInitState) {
          const { status: schemaStatus, ...schemaDetails } = readiness;
          return {
            status: "state_initialized", state_store: "initialized", schema_status: schemaStatus,
            ...schemaDetails, tables: schema.tables.length, sequence,
          };
        }
        if (readiness.status !== "ready") return { ...readiness, tables: schema.tables.length, sequence };
        if (beidouFields) {
          const target = { client, baseToken: config.base.appToken, tableId: config.base.tableIds.dramas };
          if (confirm === "apply-now") return applyBeidouFields({ ...target, jobs, actorId: identity.actorId, expectedSha256, now });
          return planBeidouFields(target);
        }
        if (canary) {
          if (!payload?.manifest || payload.manifest.base_binding_sha256 !== baseBindingSha256) fail("base_target_mismatch", "Canary manifest belongs to a different Base");
          const parts = beijingParts(now());
          const fallbackId = `CANARY-SDRUN-${parts.date.replaceAll("-", "")}-${String(parts.hour).padStart(2, "0")}${String(parts.minute).padStart(2, "0")}${String(parts.second).padStart(2, "0")}-${randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase()}`;
          const canaryResult = await runBaseCanary({
            client, appToken: config.base.appToken, tableIds: config.base.tableIds,
            canaryId: services.makeCanaryId?.() ?? fallbackId,
          });
          const receipt = {
            version: "shortdrama-canary-receipt/v1", status: "verified",
            manifest_sha256: payload.manifest.sha256,
            base_binding_sha256: baseBindingSha256,
            schema_revision: schema.revision,
            table_bindings_sha256: tableBindingsSha256,
            proof: canaryResult.tables,
            generated_at: now().toISOString(),
          };
          receipt.sha256 = canaryReceiptDigest(receipt);
          return receipt;
        }
        if (!sequence.seeded) return { status: "sequence_unseeded", schema_revision: schema.revision, sequence };
        return { status: "ready", node: process.versions.node, schema_revision: schema.revision, sequence };
      },
      async recoverGoogle(payload, options, identity) {
        return recoverGoogleReconciliation({plan: payload.plan, expectedSha256: options.expectedSha256, baseBindingSha256, config, jobs, repos, client, actorId: identity.actorId, now});
      },
      async readReconciliationContext(payload) {
        if (payload.baseline.base_binding_sha256 !== baseBindingSha256) fail("base_target_mismatch", "Original migration belongs to a different Base");
        await assertRuntimeSchemaReady();
        const google = await readGoogle();
        const snapshot = {};
        for (const key of ["accounts", "dramas", "captures", "releases"]) snapshot[key] = [...(await repos[key].loadIndex()).values()];
        const sequence = jobs.peekSequenceState();
        if (!sequence.seeded) fail("sequence_unseeded", "Reconciliation requires seeded IDs");
        return {google, snapshot, schema: await runtimeSchema(), baseline: payload.baseline, baseBindingSha256, now: now().toISOString(), sequences: {
          drama: Number(sequence.drama_next.slice(3)) - 1, release: Number(sequence.release_next.slice(3)) - 1,
        }};
      },
      async reconcileCheckpointPlan(payload) {
        const current = await runtime.readReconciliationContext(payload);
        return planGoogleReconciliation(prepareSchemaCheckpointContext({originalPlan: payload.plan, current,
          journal: reconciliationJournal(jobs, payload.plan.sha256), expectedSourceSha256: reconciliationSourceDigest(current.google)}));
      },
      async reconcileGoogle(payload, options, identity, apply) {
        const checkpoint = payload.plan?.schema_checkpoint;
        if (!checkpoint) assertNoUnresolvedReconciliation(jobs);
        let current = await runtime.readReconciliationContext(payload);
        if (checkpoint) {
          current = prepareSchemaCheckpointContext({originalPlan: checkpoint, current,
            journal: reconciliationJournal(jobs, checkpoint.sha256), expectedSourceSha256: payload.plan.source_sha256});
          if (apply) await recoverGoogleReconciliation({plan: checkpoint, expectedSha256: checkpoint.sha256,
            baseBindingSha256, config, jobs, repos, client, actorId: identity.actorId, now});
        }
        assertNoUnresolvedReconciliation(jobs);
        if (!apply) return planGoogleReconciliation(current);
        return applyGoogleReconciliation({plan: payload.plan, expectedSha256: options.expectedSha256, current,
          writer: createGoogleReconciliationWriter({client, repos, config, jobs, actorId: identity.actorId, now})});
      },
      async migratePlan(_payload, options) {
        const google = await readGoogle();
        const sqliteAccounts = await sourceReaders.readLatestAccounts(config.paths.metricsSqlite);
        const sqlitePosts = await sourceReaders.readLatestPosts(config.paths.metricsSqlite);
        const manifest = await planMigration({ google, sqliteAccounts, sqlitePosts, baseSchema: await migrationBase(), baseBindingSha256, now: () => now().toISOString() });
        return manifest;
      },
      async attestPermissions(payload, _options, identity) {
        return createPermissionAttestation({
          manifest: payload.manifest,
          schemaReceipt: payload.schemaReceipt,
          observations: payload.observations,
          actorId: identity.actorId,
          now,
        });
      },
      async migrateApply(payload, options) {
        const manifest = payload.manifest;
        const google = await readGoogle();
        const sourceRevision = migrationSourceRevision({
          google,
          sqliteAccounts: await sourceReaders.readLatestAccounts(config.paths.metricsSqlite),
          sqlitePosts: await sourceReaders.readLatestPosts(config.paths.metricsSqlite),
        }).revision;
        let schemaSnapshotPromise;
        const schemaSnapshot = () => {
          if (options.phase === "schema") return migrationBase();
          schemaSnapshotPromise ??= migrationBase();
          return schemaSnapshotPromise;
        };
        const context = { repos, phase: options.phase, resumePartialData: options.resumePartialData ?? null,
          baseBindingSha256, tableBindingsSha256, actorId: options.actorId ?? payload.actorId,
          expectedSha256: manifest.sha256, sourceRevision, schemaReceipt: payload.schemaReceipt,
          expectedSchemaReceiptSha256: payload.schemaReceipt?.sha256,
          canaryReceipt: payload.canaryReceipt, expectedCanaryReceiptSha256: payload.canaryReceipt?.sha256,
          permissionAttestation: payload.permissionAttestation,
          expectedPermissionAttestationSha256: payload.permissionAttestation?.sha256,
          verification: payload.verification, expectedVerificationSha256: payload.verification?.sha256,
          getSchemaRevision: async () => (await schemaSnapshot()).revision,
          readEmptyTableEvidence: async () => {
            const snapshot = await migrationBase();
            return Object.fromEntries(TABLE_ORDER.map((tableName) => {
              const table = snapshot.tables.find((candidate) => candidate.name === tableName);
              return [tableName, {
                record_count: table?.record_count,
                key_set_sha256: table?.primary_key_set_sha256,
              }];
            }));
          },
          schemaAdapter: adapters.schemaAdapter, presentationAdapter: adapters.presentationAdapter,
          seedSequence: (kind, value) => seedBusinessIdSequence(jobs.db, kind, value), now,
        };
        try {
          const result = await applyMigration(context, manifest);
          if (options.phase === "schema") return result.schema_receipt;
          return result;
        }
        catch (error) {
          if (options.phase === "schema" && error?.code === "schema_revision_drift" && !payload?.schemaReceipt &&
              error.details?.reason !== "select_options_third_state") {
            fail("schema_receipt_lost", "Schema receipt is unavailable after Base schema changed", { next_step: "replan_reconfirm" });
          }
          throw error;
        }
      },
      async migrateVerify(payload) { return verifyMigration({ repos, baseBindingSha256, now: () => now().toISOString() }, payload.manifest); },
      close() { jobs.close(); },
    };
    return runtime;
  } catch (error) {
    jobs.close();
    throw error;
  }
}

function payloadRequired(command) {
  return new Set([
    "release:batch-schedule", "release:batch-schedule-direct", "release:batch-match-direct", "release:batch-preview", "release:batch-apply",
    "pool:beidou-search",
    "pool:create", "pool:preview-update", "pool:apply-update", "pool:apply-direct", "pool:apply-archive",
    "pool:preview-batch", "pool:update-field", "release:schedule", "release:update-field", "release:preview-update", "release:preview-batch", "release:apply-update", "release:apply-direct", "release:attach-post", "release:preview-match", "release:match-direct",
  ]).has(`${command.group}:${command.action}`);
}

export function exitCodeFor(result) {
  const state = result?.state ?? result?.status;
  if (result?.error) return 1;
  if (result?.beidou_pool?.status === "schema_missing") return 1;
  if (result?.beidou_pool?.status === "partial") return 2;
  if (state === "partial") return 2;
  if (["failed", "error", "base_table_missing", "schema_missing", "schema_drift", "sequence_unseeded", "unavailable", "not_found"].includes(state)) return 1;
  return 0;
}

export function sanitizeErrorResult(result) {
  const copy = structuredClone(result);
  const identifierKey = /^(?:actor|actor_id|user|user_id|chat|chat_id|base|base_id|base_token|app|app_id|app_token|table_id|record_id)$/i;
  const identifierValue = /^(?:ou|oc|tbl|rec)_[A-Za-z0-9._-]+$/;
  const walk = (value) => {
    if (!value || typeof value !== "object") return;
    for (const key of Object.keys(value)) {
      const child = value[key];
      if (/secret|token|authorization|credential/i.test(key) || identifierKey.test(key) ||
          typeof child === "string" && (isAbsolute(child) || identifierValue.test(child))) {
        value[key] = "[redacted]";
      } else walk(child);
    }
  };
  walk(copy);
  return copy;
}

export async function execute(argv, {
  env = process.env,
  stdin = process.stdin,
  build = buildRuntime,
  loadEnvironment = loadRuntimeEnvironment,
  isTrustedLocalInvoker = inspectTrustedLocalInvoker,
  isTrustedSocialInvoker = inspectTrustedSocialInvoker,
  validateSocialConfig = assertSocialRuntimeConfig,
  socialConfigPath = SOCIAL_RUNTIME_CONFIG_PATH,
} = {}) {
  let runtime;
  let outputReservation;
  try {
    const command = parseCommand(argv);
    const configPath = command.options.config ?? env.SHORTDRAMA_CONFIG;
    if (!configPath) fail("config_invalid", "--config or SHORTDRAMA_CONFIG is required");
    const rawHasSession = ["HERMES_SESSION_PLATFORM", "HERMES_SESSION_PROFILE", "HERMES_SESSION_USER_ID", "HERMES_SESSION_CHAT_ID"].some((key) => env[key] !== undefined);
    let preliminaryIdentity = null;
    if (rawHasSession) {
      preliminaryIdentity = resolveInvocationIdentity(command, env);
      const stages = [];
      if (isTrustedSocialInvoker({ argv, command, configPath, profile: preliminaryIdentity.profile, stages }) !== true) {
        // stage tells the operator which link refused: argv/payload mean the command itself is
        // wrong, runner/shell/gateway mean the process chain did not match what this host runs.
        fail("social_invoker_untrusted", "Bot commands require direct authorized Hermes gateway execution",
          stages.length === 1 ? { stage: stages[0] } : {});
      }
      await validateSocialConfig(configPath, { expectedPath: socialConfigPath });
    }
    const effectiveEnv = await loadEnvironment({ configPath, env });
    const hasSession = ["HERMES_SESSION_PLATFORM", "HERMES_SESSION_PROFILE", "HERMES_SESSION_USER_ID", "HERMES_SESSION_CHAT_ID"].some((key) => effectiveEnv[key] !== undefined);
    if (command.group === "doctor" && command.options.initState &&
        (effectiveEnv.SHORTDRAMA_CAPABILITY_FILE !== undefined || effectiveEnv.SHORTDRAMA_INTERNAL_CAPABILITY !== undefined)) {
      fail("local_only_required", "State initialization cannot run from an internal scheduler context");
    }
    const canResolveBeforeRuntime = isInternal(command) || hasSession || ["account", "capture", "pool", "release", "metrics"].includes(command.group) || command.group === "sync" && command.action === "start";
    if (!canResolveBeforeRuntime && localActorRequired(command) && isTrustedLocalInvoker({ command, actorId: command.options.actorId ?? null }) !== true) {
      fail("local_invoker_untrusted", "Local admin actions require a standalone interactive human Terminal ancestry");
    }
    if (preliminaryIdentity === null && canResolveBeforeRuntime) preliminaryIdentity = resolveInvocationIdentity(command, effectiveEnv);
    const migrationEvidence = await loadMigrationEvidence(command);
    if (command.options.output) outputReservation = await reserveMigrationArtifact(command.options.output);
    runtime = await build({ configPath, env: effectiveEnv, command });
    const identity = preliminaryIdentity ?? resolveInvocationIdentity(command, effectiveEnv, {
      ...(runtime.config?.auth ?? {}),
      isTrustedLocalInvoker: () => true,
    });
    const payload = migrationEvidence ?? await readPayload(command.options.payload, { payloadRoot: runtime.config.paths.payloadRoot, stdin });
    if (payloadRequired(command) && !payload) fail("payload_required", "Command requires an explicit payload");
    let result = await createDispatcher(runtime)(command, identity, payload);
    if (outputReservation) {
      const written = await outputReservation.write(result);
      outputReservation = null;
      if (command.group === "migrate" && ["reconcile-plan", "reconcile-checkpoint-plan"].includes(command.action)) {
        result = {status: "planned", artifact_file: command.options.output, sha256: result.sha256,
          counts: Object.fromEntries(Object.entries(result.operations).map(([key, ops]) => [key, {create: ops.creates.length, update: ops.updates.length}])),
          schema_fields_extended: result.schema_changes.length};
      } else if (command.group === "migrate" && command.action === "plan") {
        const blockedByCode = {};
        for (const item of result.blocked) blockedByCode[item.code] = (blockedByCode[item.code] ?? 0) + 1;
        const warningsByCode = {};
        for (const item of result.warnings ?? []) warningsByCode[item.code] = (warningsByCode[item.code] ?? 0) + 1;
        result = {
          status: result.blocked.length === 0 ? "planned" : "blocked",
          artifact_file: command.options.output,
          sha256: result.sha256,
          counts: structuredClone(result.counts),
          schema_actions: result.schema_actions.length,
          presentation_actions: result.presentation_actions.length,
          blocked_by_code: blockedByCode,
          warnings_by_code: warningsByCode,
        };
      } else if (command.group === "migrate" && command.action === "attest-permissions") {
        result = {
          status: "created",
          artifact_file: command.options.output,
          semantic_sha256: result.sha256,
          file_sha256: written.sha256,
        };
      }
    }
    return { result, exitCode: exitCodeFor(result) };
  } catch (error) {
    if (outputReservation) {
      try { await outputReservation.abort(); }
      catch (cleanupError) { error = cleanupError; }
    }
    return { result: sanitizeErrorResult(toErrorResult(error)), exitCode: 1 };
  } finally {
    runtime?.close?.();
  }
}

export async function main(argv = process.argv.slice(2), io = {}) {
  const { result, exitCode } = await execute(argv, io);
  (io.stdout ?? process.stdout).write(`${JSON.stringify(result)}\n`);
  return exitCode;
}

if (resolve(process.argv[1] ?? "") === resolve(SCRIPT_PATH)) {
  process.exitCode = await main();
}
