#!/usr/bin/env node
import { execFileSync, spawn } from "node:child_process";
import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import { constants as fsConstants, lstatSync, readFileSync } from "node:fs";
import { lstat, open, readFile, realpath } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";

import { BaseRepositories } from "./src/base-repositories.mjs";
import { loadRuntimeConfig, loadRuntimeEnvironment } from "./src/config.mjs";
import { ShortDramaError, toErrorResult } from "./src/errors.mjs";
import { createTenantTokenProvider, FeishuClient, fixedFieldDescriptor, fixedTerminalDashboardBlockDescriptor } from "./src/feishu-client.mjs";
import { readGoogleMigrationSource } from "./src/google-source.mjs";
import { HumanOpsService } from "./src/human-ops.mjs";
import { allocateBusinessId, makeRunId, seedBusinessIdSequence } from "./src/ids.mjs";
import { JobStore } from "./src/job-store.mjs";
import {
  MIGRATION_ARTIFACT_ROOT,
  applyMigration,
  canaryReceiptDigest,
  createPermissionAttestation,
  manifestDigest,
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
const TERMINAL = new Set(["success", "partial", "failed"]);
const UNSAFE_KEYS = new Set(["__proto__", "prototype", "constructor"]);
const SCRIPT_PATH = fileURLToPath(import.meta.url);

const REGISTRY = Object.freeze({
  doctor: Object.freeze({ null: ["config", "canary", "init-state", "actor-id", "expected-base-token", "manifest", "expected-sha256", "output"] }),
  migrate: Object.freeze({
    plan: ["config", "output", "actor-id", "chat-id", "expected-base-token"],
    "attest-permissions": ["config", "manifest", "expected-sha256", "schema-receipt", "expected-schema-receipt-sha256", "observations", "expected-observations-file-sha256", "output", "actor-id", "expected-base-token"],
    apply: ["config", "manifest", "expected-sha256", "schema-receipt", "expected-schema-receipt-sha256", "canary-receipt", "expected-canary-sha256", "permission-attestation", "expected-permission-attestation-sha256", "expected-permission-attestation-file-sha256", "verification", "expected-verification-sha256", "output", "phase", "actor-id", "chat-id", "confirm", "expected-base-token"],
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
    "update-field": ["config", "payload", "actor-id", "chat-id"],
    "preview-update": ["config", "payload", "actor-id", "chat-id"], "preview-batch": ["config", "payload", "actor-id", "chat-id"], "apply-update": ["config", "payload", "actor-id", "chat-id"],
    "preview-archive": ["config", "key", "payload", "actor-id", "chat-id"], "apply-archive": ["config", "payload", "actor-id", "chat-id"],
  }),
  release: Object.freeze({
    list: ["config", "payload", "actor-id", "chat-id"], get: ["config", "key", "payload", "actor-id", "chat-id"], schedule: ["config", "payload", "actor-id", "chat-id"],
    "update-field": ["config", "payload", "actor-id", "chat-id"],
    "preview-update": ["config", "payload", "actor-id", "chat-id"], "preview-batch": ["config", "payload", "actor-id", "chat-id"], "apply-update": ["config", "payload", "actor-id", "chat-id"],
    "attach-post": ["config", "payload", "actor-id", "chat-id"],
  }),
  metrics: Object.freeze({ "by-drama": ["config", "actor-id", "chat-id"], "by-account": ["config", "actor-id", "chat-id"] }),
  sync: Object.freeze({ start: ["config", "actor-id", "chat-id"], status: ["config", "run-id", "actor-id", "chat-id"] }),
  schedule: Object.freeze({ tick: ["config"], health: ["config"] }),
  queue: Object.freeze({ drain: ["config"] }),
});

const REQUIRED = Object.freeze({
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
    if (["--canary", "--init-state"].includes(flag)) {
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
  if (options.output && (!/^[A-Za-z0-9][A-Za-z0-9._-]*\.json$/.test(options.output) || options.output.includes(".."))) {
    fail("input_invalid", "Migration output must be a safe JSON file name in the fixed evidence directory", { option: "output" });
  }
  if (group === "doctor" && options.canary && options.initState) fail("input_invalid", "doctor --canary and --init-state are mutually exclusive");
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

function processRow(pid) {
  const output = execFileSync("/bin/ps", ["-p", String(pid), "-o", "ppid=,comm=,args="], {
    encoding: "utf8", timeout: 1_000, maxBuffer: 64 * 1024,
  }).trim();
  const match = /^(\d+)\s+(\S+)\s*(.*)$/.exec(output);
  if (!match) return null;
  return { pid, ppid: Number(match[1]), command: match[2], args: match[3] };
}

export function inspectTrustedLocalInvoker({
  stdin = process.stdin,
  stdout = process.stdout,
  pid = process.pid,
  readProcess = processRow,
  maxDepth = 16,
} = {}) {
  if (stdin?.isTTY !== true || stdout?.isTTY !== true || !Number.isSafeInteger(pid) || pid <= 1 ||
      typeof readProcess !== "function" || !Number.isSafeInteger(maxDepth) || maxDepth < 2 || maxDepth > 32) return false;
  const blockedExecutable = /^(?:hermes|codex|electron|run_agent\.py|tui_gateway|process-registry|backend-command)(?:$|[._-])/i;
  const terminalExecutable = /^(?:terminal|iterm2?|wezterm-gui|alacritty|kitty)$/i;
  const seen = new Set();
  let current = pid;
  let sawTerminal = false;
  try {
    for (let depth = 0; depth < maxDepth && current > 1; depth += 1) {
      if (seen.has(current)) return false;
      seen.add(current);
      const row = readProcess(current);
      if (!row || row.pid !== current || !Number.isSafeInteger(row.ppid) || row.ppid < 0 ||
          typeof row.command !== "string" || typeof row.args !== "string") return false;
      const executable = row.command.split("/").pop();
      const argumentExecutables = row.args.split(/\s+/).filter(Boolean).map((value) => value.replace(/^['"]|['"]$/g, "").split("/").pop());
      if (blockedExecutable.test(executable) || argumentExecutables.some((value) => blockedExecutable.test(value))) return false;
      if (terminalExecutable.test(executable)) sawTerminal = true;
      if (row.ppid <= 1) return sawTerminal;
      current = row.ppid;
    }
  } catch {
    return false;
  }
  return false;
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
    if (env.HERMES_SESSION_PLATFORM !== "feishu" || env.HERMES_SESSION_PROFILE !== "social" ||
        !env.HERMES_SESSION_USER_ID || !env.HERMES_SESSION_CHAT_ID) {
      fail("session_identity_invalid", "A complete Feishu Social session is required");
    }
    return {
      mode: "social", actorId: normalized(env.HERMES_SESSION_USER_ID, "actorId"),
      chatId: normalized(env.HERMES_SESSION_CHAT_ID, "chatId"), profile: "social",
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

function parsePayloadBytes(bytes) {
  if (bytes.length > MAX_PAYLOAD_BYTES) fail("payload_too_large", "Payload exceeds the one MiB limit");
  let value;
  try { value = JSON.parse(bytes.toString("utf8")); }
  catch { fail("payload_invalid", "Payload must be strict JSON"); }
  assertSafeJson(value);
  if (value === null || typeof value !== "object" || Array.isArray(value)) fail("payload_invalid", "Payload root must be an object");
  return value;
}

async function readBoundedStream(stream) {
  const chunks = [];
  let size = 0;
  for await (const chunk of stream) {
    const bytes = Buffer.from(chunk);
    size += bytes.length;
    if (size > MAX_PAYLOAD_BYTES) fail("payload_too_large", "Payload exceeds the one MiB limit");
    chunks.push(bytes);
  }
  return Buffer.concat(chunks);
}

export async function readPayload(source, { payloadRoot, stdin = process.stdin, openFile = open, includeBytes = false } = {}) {
  if (source === undefined || source === null) return null;
  if (source === "-") {
    const bytes = await readBoundedStream(stdin);
    const value = parsePayloadBytes(bytes);
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
  if (info.size > MAX_PAYLOAD_BYTES) fail("payload_too_large", "Payload exceeds the one MiB limit");
  let handle;
  try {
    handle = await openFile(candidateReal, fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW);
    const opened = await handle.stat();
    if (!opened.isFile() || opened.dev !== info.dev || opened.ino !== info.ino || opened.size !== info.size || opened.size > MAX_PAYLOAD_BYTES) {
      fail("payload_path_invalid", "Payload file changed between validation and open");
    }
    const bytes = await handle.readFile();
    const value = parsePayloadBytes(bytes);
    return includeBytes ? { value, bytes } : value;
  } catch (error) {
    if (error instanceof ShortDramaError) throw error;
    if (["ELOOP", "ENOENT"].includes(error?.code)) fail("payload_path_invalid", "Payload file changed before open");
    throw error;
  } finally {
    await handle?.close();
  }
}

function evidenceMismatch(message) {
  fail("migration_evidence_mismatch", message);
}

function exactDigest(value, field) {
  if (typeof value !== "string" || !/^[a-f0-9]{64}$/.test(value)) fail("input_invalid", "Expected digest must be lowercase SHA-256", { field });
  return value;
}

async function readMigrationFile(source) {
  return readPayload(source, { payloadRoot: MIGRATION_ARTIFACT_ROOT, includeBytes: true });
}

async function loadMigrationEvidence(command) {
  const key = `${command.group}:${command.action}`;
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

export function shouldEnqueueSchedule(now, jobs) {
  const parts = beijingParts(now);
  return parts.hour === 8 && parts.minute <= 9 && !jobs.some((job) => job?.trigger === "schedule" && job?.beijing_date === parts.date);
}

export function evaluateDailyHealth(now, jobs) {
  const parts = beijingParts(now);
  if (parts.hour < 10) return { alert: false, reason: "before_health_window" };
  if (jobs.some((job) => job?.state === "success" || job?.state === "partial")) return { alert: false, reason: "terminal_present" };
  const running = jobs.find((job) => job?.state === "running");
  if (running) return { alert: true, reason: "still_running", step: running.step, lease_expires_at: running.lease_expires_at };
  if (jobs.some((job) => job?.state === "failed")) return { alert: true, reason: "failed_terminal" };
  return { alert: true, reason: "missing_terminal" };
}

const CANARY_ID = /^CANARY-SDRUN-\d{8}-\d{6}(?:-[A-F0-9]+)?$/;
const CANARY_TABLES = Object.freeze([
  ["accounts", "账号台账"], ["dramas", "选剧池"], ["captures", "采集数据"], ["releases", "发布记录"],
]);

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

export async function runBaseCanary({ client, appToken, tableIds, canaryId } = {}) {
  if (!client || ["listRecords", "createRecords", "getRecord", "deleteCanaryRecords"].some((method) => typeof client[method] !== "function") ||
      typeof appToken !== "string" || appToken.length === 0 || !tableIds || !CANARY_ID.test(canaryId ?? "")) {
    fail("canary_context_invalid", "Fixed four-table canary context is invalid");
  }
  const snapshots = new Map();
  const originalKeys = new Map();
  const createdRecordIds = new Map();
  const proofs = new Map();
  let operationError = null;
  let cleanupError = null;
  for (const [binding, tableName] of CANARY_TABLES) {
    const tableId = tableIds[binding];
    if (typeof tableId !== "string" || tableId.length === 0) fail("canary_context_invalid", "Canary table binding is invalid", { table: tableName });
    const index = canaryIndex(await client.listRecords(appToken, tableId), tableName);
    if (index.has(canaryId)) fail("canary_collision", "Generated canary key already exists", { table: tableName });
    snapshots.set(tableName, index);
    originalKeys.set(tableName, [...index.keys()].sort());
  }
  try {
    for (const [binding, tableName] of CANARY_TABLES) {
      const tableId = tableIds[binding];
      const primary = TABLES[tableName].primaryField;
      const created = await client.createRecords(appToken, tableId, [{ fields: { [primary]: canaryId } }]);
      if (!Array.isArray(created) || created.length !== 1 || typeof created[0]?.record_id !== "string") {
        fail("readback_mismatch", "Canary create did not return exactly one record ID", { table: tableName });
      }
      const recordId = created[0].record_id;
      createdRecordIds.set(tableName, recordId);
      const readback = await client.getRecord(appToken, tableId, recordId);
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
        if (recordId) await client.deleteCanaryRecords(appToken, tableId, tableName, [recordId]);
      } catch (error) {
        cleanupError ??= error;
      }
    }
    for (const [binding, tableName] of CANARY_TABLES) {
      try {
        const restored = canaryIndex(await client.listRecords(appToken, tableIds[binding]), tableName);
        if (JSON.stringify([...restored.keys()].sort()) !== JSON.stringify(originalKeys.get(tableName))) {
          fail("readback_mismatch", "Canary cleanup did not restore the exact key set", { table: tableName });
        }
        const proof = proofs.get(tableName);
        if (proof) {
          proof.deleted = true;
          proof.after_key_set_sha256 = createHash("sha256").update(JSON.stringify([...restored.keys()].sort())).digest("hex");
          proof.count_before = snapshots.get(tableName).size;
          proof.count_after = restored.size;
        }
      } catch (error) {
        cleanupError ??= error;
      }
    }
  }
  if (cleanupError) fail("canary_cleanup_failed", "Canary cleanup or restoration could not be proven", { next_step: "manual_repair" });
  if (operationError) throw operationError;
  return {
    status: "verified", canary_id: canaryId,
    tables: Object.fromEntries(CANARY_TABLES.map(([, name]) => [name, proofs.get(name)])),
  };
}

async function defaultSpawnFile(file, args, options = {}) {
  return new Promise((resolvePromise, reject) => {
    const { signal: abortSignal, ...spawnOptions } = options;
    const child = spawn(file, args, { ...spawnOptions, shell: false, detached: false, stdio: "ignore" });
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
  spawnFile = defaultSpawnFile, now = () => new Date(), verifySqliteEvidence = sqliteCollectorEvidence,
} = {}) {
  assertNode24(nodePath);
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
    let outcome;
    try { outcome = await spawnFile(nodePath, [collectorPath], { cwd: collectorCwd, shell: false, detached: false, signal }); }
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
    const status = summary.errors.length > 0 ? "partial" : "success";
    return {
      status, run_id: runId, collector_run_id: collectorRunId, beijing_date: beijingDate,
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
    const schemaGuarded = ["account", "capture", "pool", "release", "metrics"].includes(command.group) ||
      key === "sync:start" || key === "schedule:tick";
    if (schemaGuarded) {
      if (typeof runtime.assertRuntimeSchemaReady !== "function") fail("runtime_invalid", "Runtime schema guard is required");
      await runtime.assertRuntimeSchemaReady();
    }
    if (command.group === "doctor") {
      if ((command.options.canary || command.options.initState) && !runtime.config?.auth?.isPrivilegedAllowed?.(identity.actorId)) fail("privileged_required", "Doctor mutation checks require a privileged actor");
      return runtime.doctor ? runtime.doctor({ canary: command.options.canary === true, initState: command.options.initState === true, identity, payload }) : { status: "ready" };
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
      if (!shouldEnqueueSchedule(now, rows)) return { status: "no_op", reason: "outside_window_or_already_scheduled", beijing_date: parts.date };
      requireSequenceSeed(runtime.jobs);
      return startSyncJob(runtime.syncContext, { trigger: "schedule", chatId: runtime.opsChatId, beijingDate: parts.date });
    }
    if (key === "queue:drain") {
      const clock = typeof runtime.now === "function" ? runtime.now : () => new Date();
      const claim = runtime.jobs.claimNext({ workerPid: runtime.workerPid, now: clock(), leaseSeconds: 120 });
      let result = { status: "no_op", reason: "queue_empty" };
      let workerError = null;
      try {
        if (claim) result = await runtime.runWorker(runtime.workerContext, claim.run_id);
      } catch (error) {
        workerError = error;
      }
      const notifications = await retryNotifications(runtime);
      if (workerError) throw workerError;
      return { ...result, notification_retries: notifications.length };
    }
    if (key === "schedule:health") {
      const now = runtime.now();
      const parts = beijingParts(now);
      const jobs = runtime.jobs.listByBeijingDate(parts.date).filter((job) => job.trigger === "schedule");
      const state = evaluateDailyHealth(now, jobs);
      if (!state.alert) return { status: "no_op", beijing_date: parts.date, ...state };
      const alertKey = `missing-terminal:${parts.date}`;
      const ownerId = randomUUID();
      if (!runtime.jobs.claimHealthAlert(alertKey, { ownerId, now, leaseSeconds: 120 })) return { status: "no_op", reason: "alert_already_claimed", beijing_date: parts.date };
      try {
        await runtime.sendOpsHealth({ chatId: runtime.opsChatId, text: `shortdrama health\nbeijing_date=${parts.date}\nreason=${state.reason}\nstep=${state.step ?? "none"}\nlease=${state.lease_expires_at ?? "none"}` });
        runtime.jobs.markHealthAlert(alertKey, "sent", { ownerId, now });
      } catch (error) {
        runtime.jobs.markHealthAlert(alertKey, "failed", { ownerId, now, error: typeof error?.code === "string" ? error.code : "notification_delivery_failed" });
        throw error;
      }
      return { status: "alerted", beijing_date: parts.date, ...state };
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
  const selected = [];
  for (const table of tables.items) {
    if (!Object.values(config.base.tableIds).includes(table.table_id)) continue;
    const fields = await client.listFields(config.base.appToken, table.table_id);
    if (!fields || fields.complete !== true || !Array.isArray(fields.items)) {
      fail("base_response_incomplete", "Complete Base field metadata is required");
    }
    const selectedTable = { ...table, fields: fields.items, revision: fields.revision };
    if (includeRecordEvidence) {
      const records = await client.listRecords(config.base.appToken, table.table_id);
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
  const canonical = JSON.stringify(selected.map((table) => ({
    table_id: table.table_id, name: table.name, revision: table.revision ?? null,
    fields: table.fields.map((field) => field).sort((left, right) => String(left.name).localeCompare(String(right.name))),
  })).sort((left, right) => String(left.name).localeCompare(String(right.name))));
  return { complete: true, revision: `base-schema-v1:${createHash("sha256").update(canonical).digest("hex")}`, tables: selected };
}

function safeServiceAccount(path) {
  try { return JSON.parse(readFileSync(path, "utf8")); }
  catch { fail("google_source_invalid", "Google service account could not be read"); }
}

async function defaultFeishuFetch(url, options) {
  const response = await fetch(url, options);
  const payload = await response.json();
  if (!response.ok || payload?.code !== 0) fail("notification_delivery_failed", "Feishu notification request failed", { status: response.status });
  return payload;
}

export function createFeishuMessageSender({ tokenProvider, isChatAllowed, fetchJson = defaultFeishuFetch } = {}) {
  if (typeof tokenProvider !== "function" || typeof isChatAllowed !== "function" || typeof fetchJson !== "function") {
    fail("notifier_config_invalid", "Feishu message adapter configuration is invalid");
  }
  return async ({ chatId, text }) => {
    if (!isChatAllowed(chatId) || typeof text !== "string" || text.length === 0 || text.length > 2_000) {
      fail("notification_target_denied", "Notification destination or body is invalid");
    }
    const token = await tokenProvider();
    if (typeof token !== "string" || token.length === 0) fail("base_auth_failed", "Feishu tenant token is invalid");
    const result = await fetchJson("https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=chat_id", {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify({ receive_id: chatId, msg_type: "text", content: JSON.stringify({ text }) }),
    });
    if (!result || result.code !== 0) fail("notification_delivery_failed", "Feishu notification response is invalid");
    return result;
  };
}

function schemaAdapters(client, config) {
  const readSchema = () => baseSchemaMetadata(client, config);
  const schemaAdapter = {
    readSchema,
    createField: (tableId, tableName, fieldName, bindings) => client.createField(config.base.appToken, tableId, tableName, fieldName, bindings),
    updateField: (tableId, fieldId, tableName, fieldName) => client.updateField(config.base.appToken, tableId, fieldId, tableName, fieldName),
    async verifySchemaAction(action, schema) {
      const table = schema?.tables?.find((candidate) => candidate.name === action.table);
      if (!table) return false;
      return table.fields.some((field) => field.name === action.field);
    },
  };
  const presentationAdapter = {
    readSchema,
    listViews: (tableId) => client.listViews(config.base.appToken, tableId),
    createView: (tableId, tableName, viewName) => client.createView(config.base.appToken, tableId, tableName, viewName),
    updateView: (tableId, viewId, tableName, viewName) => client.updateView(config.base.appToken, tableId, viewId, tableName, viewName),
    readViewConfiguration: (tableId, viewId, tableName, viewName) => client.readViewConfiguration(config.base.appToken, tableId, viewId, tableName, viewName),
    listDashboards: () => client.listDashboards(config.base.appToken),
    createDashboard: (name) => client.createDashboard(config.base.appToken, name),
    listDashboardBlocks: (dashboardId) => client.listDashboardBlocks(config.base.appToken, dashboardId),
    createDashboardBlock: (dashboardId, name) => client.createDashboardBlock(config.base.appToken, dashboardId, name),
    readDashboardBlock: (dashboardId, blockId, name) => client.readDashboardBlock(config.base.appToken, dashboardId, blockId, name),
    updateDashboardBlock: (dashboardId, blockId, name) => client.updateDashboardBlock(config.base.appToken, dashboardId, blockId, name),
  };
  return { schemaAdapter, presentationAdapter };
}

function schemaReadiness(schema, config) {
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
    if (JSON.stringify(actualNames) !== JSON.stringify(expectedNames)) return { status: "schema_missing", table: tableName };
    for (const spec of BASE_FIELD_SPECS[tableName]) {
      const field = table.fields.find((candidate) => candidate.name === spec.name);
      const expected = fixedFieldDescriptor(tableName, spec.name, spec.kind === "link" ? { targetTableId: tableIdsByName[spec.targetTable] } : {});
      if (spec.primary && field?.is_primary !== true && field?.primary !== true ||
          !Object.entries(expected).every(([key, value]) => JSON.stringify(field?.[key]) === JSON.stringify(value))) {
        return { status: "schema_drift", table: tableName, field: spec.name };
      }
    }
  }
  return { status: "ready" };
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
    readOnly: command?.group === "doctor" && !initState,
    initialize: initState,
  });
  try {
    const tokenProvider = createTenantTokenProvider({ appId: config.auth.feishuAppId, appSecret: config.getFeishuAppSecret() });
    const client = services.client ?? new FeishuClient({ tokenProvider });
    const repos = new BaseRepositories({ client, appToken: config.base.appToken, tableIds: config.base.tableIds });
    const operatorIds = new Set(config.auth.getOperatorIds());
    const privilegedIds = new Set(config.auth.getPrivilegedIds());
    const notificationChatIds = new Set(config.auth.getNotificationChatIds());
    const HumanOpsConstructor = services.HumanOpsService ?? HumanOpsService;
    const NotifierConstructor = services.ShortDramaNotifier ?? ShortDramaNotifier;
    const humanOps = new HumanOpsConstructor({
      repos, jobs, operators: operatorIds, privileged: privilegedIds, now,
      makeReceiptId: () => `sdp_${randomUUID()}`,
      allocateDramaId: () => allocateBusinessId(jobs.db, "drama"),
      allocateReleaseId: () => allocateBusinessId(jobs.db, "release"),
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
      await client.updateDashboardTerminalBlock(config.base.appToken, dashboardId, blockId, terminal);
      const readback = await client.readDashboardBlock(config.base.appToken, dashboardId, blockId, expected.name);
      if (JSON.stringify(readback.data_config) !== JSON.stringify(expected.data_config)) fail("readback_mismatch", "Terminal dashboard readback did not match persisted job");
    };
    const notifier = new NotifierConstructor({ allowedChatIds: notificationChatIds, sendMessage, updateTerminalDashboard, jobs });
    const opsChatId = normalized(env.SHORTDRAMA_OPS_CHAT_ID, "opsChatId");
    if (!config.auth.isNotificationChatAllowed(opsChatId)) fail("notification_target_denied", "Ops chat is not allowlisted");
    const wakeWorker = createWakeWorker({ spawnFile });
    const collector = createCollectorAdapter({
      nodePath: process.execPath, collectorPath: config.paths.collector, collectorCwd: dirname(config.paths.collector),
      summaryDir: config.paths.collectorSummaryDir, metricsSqlitePath: config.paths.metricsSqlite, spawnFile, now,
    });
    const syncContext = { jobs, makeRunId, wakeWorker, now };
    const workerPid = process.pid;
    const runtimeSchema = services.readSchema ?? (async () => baseSchemaMetadata(client, config));
    const migrationBase = services.readMigrationSchema ?? services.readSchema ??
      (async () => baseSchemaMetadata(client, config, { includeRecordEvidence: true }));
    const assertRuntimeSchemaReady = async () => {
      const schema = await runtimeSchema();
      const readiness = schemaReadiness(schema, config);
      if (readiness.status === "ready") return schema.revision;
      if (["base_table_missing", "schema_missing"].includes(readiness.status)) {
        fail("schema_missing", "Runtime Base schema is incomplete", readiness);
      }
      fail("base_schema_drift", "Runtime Base schema does not match the fixed contract", readiness);
    };
    const workerContext = {
      jobs, repos, notifier, collector, source: { readLatestAccounts, readLatestPosts },
      workerPid, now, metricsSqlitePath: config.paths.metricsSqlite,
      assertSchemaReady: assertRuntimeSchemaReady,
    };
    const baseBindingSha256 = createHash("sha256").update(JSON.stringify({
      app_token: config.base.appToken,
      table_ids: Object.fromEntries(Object.entries(config.base.tableIds).sort(([left], [right]) => left.localeCompare(right))),
    })).digest("hex");
    const tableBindingsSha256 = createHash("sha256").update(JSON.stringify(
      Object.fromEntries(Object.entries(config.base.tableIds).sort(([left], [right]) => left.localeCompare(right))),
    )).digest("hex");
    const adapters = schemaAdapters(client, config);
    const readGoogle = () => readGoogleMigrationSource({
      spreadsheetId: config.sourceSpreadsheetId,
      serviceAccount: safeServiceAccount(config.paths.googleServiceAccountPath),
    });
    const runtime = {
      config, jobs, client, repos, humanOps, notifier, opsChatId, now, workerPid, syncContext, workerContext,
      assertRuntimeSchemaReady,
      runWorker: runSyncWorker,
      sendOpsHealth: sendMessage,
      async doctor({ canary, initState: requestedInitState, payload, identity }) {
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
      async migratePlan(_payload, options) {
        const google = await readGoogle();
        const manifest = await planMigration({ google, captures: readLatestPosts(config.paths.metricsSqlite), baseSchema: await migrationBase(), baseBindingSha256, now: () => now().toISOString() });
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
        let schemaSnapshotPromise;
        const schemaSnapshot = () => {
          if (options.phase === "schema") return migrationBase();
          schemaSnapshotPromise ??= migrationBase();
          return schemaSnapshotPromise;
        };
        const context = { repos, phase: options.phase, baseBindingSha256, tableBindingsSha256, actorId: options.actorId ?? payload.actorId,
          expectedSha256: manifest.sha256, sourceRevision: google.revision, schemaReceipt: payload.schemaReceipt,
          expectedSchemaReceiptSha256: payload.schemaReceipt?.sha256,
          canaryReceipt: payload.canaryReceipt, expectedCanaryReceiptSha256: payload.canaryReceipt?.sha256,
          permissionAttestation: payload.permissionAttestation,
          expectedPermissionAttestationSha256: payload.permissionAttestation?.sha256,
          verification: payload.verification, expectedVerificationSha256: payload.verification?.sha256,
          getSchemaRevision: async () => (await schemaSnapshot()).revision,
          readEmptyTableEvidence: async () => {
            const snapshot = await schemaSnapshot();
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
          if (options.phase === "schema" && error?.code === "schema_revision_drift" && !payload?.schemaReceipt) {
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
    "pool:create", "pool:preview-update", "pool:apply-update", "pool:apply-archive",
    "pool:preview-batch", "pool:update-field", "release:schedule", "release:update-field", "release:preview-update", "release:preview-batch", "release:apply-update", "release:attach-post",
  ]).has(`${command.group}:${command.action}`);
}

export function exitCodeFor(result) {
  const state = result?.state ?? result?.status;
  if (result?.error) return 1;
  if (state === "partial") return 2;
  if (["failed", "error", "base_table_missing", "schema_missing", "schema_drift", "sequence_unseeded", "unavailable", "not_found"].includes(state)) return 1;
  return 0;
}

function sanitizeErrorResult(result) {
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
} = {}) {
  let runtime;
  let outputReservation;
  try {
    const command = parseCommand(argv);
    const configPath = command.options.config ?? env.SHORTDRAMA_CONFIG;
    if (!configPath) fail("config_invalid", "--config or SHORTDRAMA_CONFIG is required");
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
    const preliminaryIdentity = canResolveBeforeRuntime ? resolveInvocationIdentity(command, effectiveEnv) : null;
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
      if (command.group === "migrate" && command.action === "attest-permissions") {
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
