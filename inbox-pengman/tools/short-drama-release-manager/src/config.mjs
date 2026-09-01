import { constants as fsConstants, readFileSync } from "node:fs";
import { lstat, open } from "node:fs/promises";
import { dirname, isAbsolute, resolve } from "node:path";

import { ShortDramaError } from "./errors.mjs";

const TABLE_ID_KEYS = ["accounts", "dramas", "captures", "releases"];
const MAX_ENV_BYTES = 64 * 1024;
const ENV_KEY = /^[A-Z][A-Z0-9_]*$/;

function invalid(message, details = {}) {
  throw new ShortDramaError("config_invalid", message, details);
}

function nonEmptyString(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    invalid("Missing required runtime configuration", { field });
  }
  return value.trim();
}

function envValue(env, key) {
  return nonEmptyString(env?.[nonEmptyString(key, "environment key")], `env.${key}`);
}

function parseAllowlist(env, key) {
  const values = envValue(env, key)
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  if (values.length === 0) invalid("Allowlist must not be empty", { field: `env.${key}` });
  return new Set(values);
}

function allowlistMatcher(allowlist) {
  return Object.freeze((value) => typeof value === "string" && allowlist.has(value));
}

function allowlistValues(allowlist) {
  const values = Object.freeze([...allowlist]);
  return Object.freeze(() => values);
}

function loadConfig({ config, configPath }) {
  if (config !== undefined) {
    if (!config || typeof config !== "object" || Array.isArray(config)) {
      invalid("Runtime config must be an object");
    }
    return { config, configDirectory: configPath ? dirname(resolve(configPath)) : process.cwd() };
  }
  if (!configPath) invalid("Runtime config path is required");
  try {
    return {
      config: JSON.parse(readFileSync(configPath, "utf8")),
      configDirectory: dirname(resolve(configPath)),
    };
  } catch (error) {
    invalid("Runtime config could not be read", { path: configPath, cause: error.code ?? "invalid_json" });
  }
}

function validateNode(nodeVersion) {
  const match = String(nodeVersion).match(/^v?(\d+)/);
  if (!match || Number(match[1]) < 24) {
    invalid("Node.js 24 or later is required", { node_version: String(nodeVersion) });
  }
}

function ensureProductionValue(value, field, production) {
  const trimmed = nonEmptyString(value, field);
  if (production && (trimmed.includes("example.invalid") || trimmed.includes("example_not_production"))) {
    invalid("Example configuration cannot be used in production", { field });
  }
  return trimmed;
}

function runtimePath(configDirectory, value, field) {
  return resolve(configDirectory, nonEmptyString(value, field));
}

function configuredEnvironmentKeys(runtime) {
  const base = runtime.base ?? {};
  const auth = runtime.auth ?? {};
  const keys = [
    base.app_token_env,
    ...TABLE_ID_KEYS.map((key) => base.table_id_envs?.[key]),
    auth.feishu_app_id_env,
    auth.feishu_app_secret_env,
    auth.google_service_account_path_env,
    auth.operator_ids_env,
    auth.privileged_ids_env,
    auth.notification_chat_ids_env,
    "SHORTDRAMA_OPS_CHAT_ID",
  ].map((key) => nonEmptyString(key, "environment key"));
  if (keys.some((key) => !ENV_KEY.test(key))) invalid("Configured environment key is unsafe");
  return new Set(keys);
}

function quotedValue(raw, quote) {
  if (raw.length < 2 || !raw.endsWith(quote)) invalid("Dotenv quoted value is malformed");
  const content = raw.slice(1, -1);
  if (quote === "'") {
    if (content.includes("'")) invalid("Dotenv single-quoted value is malformed");
    return content;
  }
  let result = "";
  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];
    if (char === '"') invalid("Dotenv double-quoted value is malformed");
    if (char !== "\\") { result += char; continue; }
    const escaped = content[++index];
    const replacements = { n: "\n", r: "\r", t: "\t", "\\": "\\", '"': '"' };
    if (!Object.hasOwn(replacements, escaped)) invalid("Dotenv escape is unsupported");
    result += replacements[escaped];
  }
  return result;
}

function parseDotenv(bytes) {
  let text;
  try { text = new TextDecoder("utf-8", { fatal: true }).decode(bytes); }
  catch { invalid("Dotenv file must be valid UTF-8"); }
  if (text.includes("\0")) invalid("Dotenv file contains NUL");
  text = text.replaceAll("\r\n", "\n");
  if (text.includes("\r")) invalid("Dotenv file contains unsupported line endings");
  const values = new Map();
  for (const line of text.split("\n")) {
    if (line === "" || line.startsWith("#")) continue;
    if (line.trim() !== line) invalid("Dotenv lines may not contain outer whitespace");
    const match = /^([A-Z][A-Z0-9_]*)=(.*)$/.exec(line);
    if (!match) invalid("Dotenv assignment is malformed");
    const [, key, raw] = match;
    if (values.has(key)) invalid("Dotenv assignment is duplicated", { key });
    let value;
    if (raw.startsWith("'") || raw.startsWith('"')) value = quotedValue(raw, raw[0]);
    else {
      if (/\s|['"]/.test(raw)) invalid("Dotenv unquoted value is malformed", { key });
      value = raw;
    }
    values.set(key, value);
  }
  return values;
}

async function assertRelativeParents(configDirectory, relativePath, target) {
  if (isAbsolute(relativePath)) invalid("paths.env_file must be relative to runtime config");
  let cursor = configDirectory;
  const parts = relativePath.split(/[\\/]+/);
  for (let index = 0; index < parts.length - 1; index += 1) {
    const part = parts[index];
    if (part === "" || part === ".") continue;
    if (part === "..") { cursor = dirname(cursor); continue; }
    cursor = resolve(cursor, part);
    let info;
    try { info = await lstat(cursor); }
    catch { invalid("Dotenv parent directory is unavailable"); }
    if (info.isSymbolicLink() || !info.isDirectory()) invalid("Dotenv parent directory is unsafe");
  }
  if (resolve(configDirectory, relativePath) !== target) invalid("Dotenv path resolution failed");
}

export async function loadRuntimeEnvironment({ configPath, env = process.env, openFile = open } = {}) {
  const loaded = loadConfig({ configPath });
  const runtime = loaded.config;
  if (runtime.schema_version !== "shortdrama/v1") invalid("Unsupported runtime config schema");
  const relativePath = nonEmptyString(runtime.paths?.env_file, "paths.env_file");
  const envPath = resolve(loaded.configDirectory, relativePath);
  await assertRelativeParents(loaded.configDirectory, relativePath, envPath);
  let before;
  try { before = await lstat(envPath); }
  catch { invalid("Dotenv file is unavailable"); }
  if (before.isSymbolicLink() || !before.isFile() || (before.mode & 0o177) !== 0 || (before.mode & 0o400) === 0 || before.size > MAX_ENV_BYTES) {
    invalid("Dotenv file must be a bounded private regular file");
  }
  let handle;
  let bytes;
  try {
    handle = await openFile(envPath, fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW);
    const opened = await handle.stat();
    if (!opened.isFile() || opened.dev !== before.dev || opened.ino !== before.ino || opened.size !== before.size ||
        opened.size > MAX_ENV_BYTES || (opened.mode & 0o177) !== 0 || (opened.mode & 0o400) === 0) {
      invalid("Dotenv file changed or became unsafe before read");
    }
    bytes = await handle.readFile();
    if (bytes.length !== opened.size || bytes.length > MAX_ENV_BYTES) invalid("Dotenv file changed size during read");
  } catch (error) {
    if (error instanceof ShortDramaError) throw error;
    invalid("Dotenv file could not be read safely");
  } finally {
    await handle?.close();
  }
  const parsed = parseDotenv(bytes);
  const allowed = configuredEnvironmentKeys(runtime);
  const effective = { ...env };
  for (const key of allowed) {
    if (!Object.hasOwn(effective, key) && parsed.has(key)) effective[key] = parsed.get(key);
  }
  return Object.freeze(effective);
}

export function loadRuntimeConfig({
  env = process.env,
  config,
  configPath,
  nodeVersion = process.versions.node,
  production = true,
  notificationChatId,
} = {}) {
  validateNode(nodeVersion);
  const loaded = loadConfig({ config, configPath });
  const runtime = loaded.config;
  if (runtime.schema_version !== "shortdrama/v1") {
    invalid("Unsupported runtime config schema", { schema_version: runtime.schema_version ?? null });
  }

  const timezone = nonEmptyString(runtime.timezone, "timezone");
  if (timezone !== "Asia/Shanghai") invalid("Runtime timezone must be Asia/Shanghai", { timezone });
  const paths = runtime.paths ?? {};
  const base = runtime.base ?? {};
  const auth = runtime.auth ?? {};
  const tableIds = Object.fromEntries(
    TABLE_ID_KEYS.map((key) => [key, envValue(env, base.table_id_envs?.[key])])
  );
  const privilegedActorId = ensureProductionValue(
    runtime.acceptance?.privileged_actor_id,
    "acceptance.privileged_actor_id",
    production
  );
  const appSecret = envValue(env, auth.feishu_app_secret_env);
  const operatorIds = parseAllowlist(env, auth.operator_ids_env);
  const privilegedIds = parseAllowlist(env, auth.privileged_ids_env);
  const notificationChatIds = parseAllowlist(env, auth.notification_chat_ids_env);
  const isNotificationChatAllowed = allowlistMatcher(notificationChatIds);
  if (notificationChatId && !isNotificationChatAllowed(notificationChatId)) {
    throw new ShortDramaError("notification_target_denied", "Notification chat is not allowlisted", {
      chat_id: notificationChatId,
    });
  }
  const result = {
    schemaVersion: runtime.schema_version,
    timezone,
    sourceSpreadsheetId: nonEmptyString(runtime.source_spreadsheet_id, "source_spreadsheet_id"),
    paths: Object.freeze({
      envFile: runtimePath(loaded.configDirectory, paths.env_file, "paths.env_file"),
      metricsSqlite: runtimePath(loaded.configDirectory, paths.metrics_sqlite, "paths.metrics_sqlite"),
      collector: runtimePath(loaded.configDirectory, paths.collector, "paths.collector"),
      collectorSummaryDir: runtimePath(loaded.configDirectory, paths.collector_summary_dir, "paths.collector_summary_dir"),
      opsSqlite: runtimePath(loaded.configDirectory, paths.ops_sqlite, "paths.ops_sqlite"),
      payloadRoot: runtimePath(loaded.configDirectory, paths.payload_root, "paths.payload_root"),
      googleServiceAccountPath: runtimePath(
        loaded.configDirectory,
        envValue(env, auth.google_service_account_path_env),
        `env.${auth.google_service_account_path_env}`
      ),
    }),
    base: Object.freeze({
      url: ensureProductionValue(base.url, "base.url", production),
      appToken: envValue(env, base.app_token_env),
      tableIds: Object.freeze(tableIds),
    }),
    auth: Object.freeze({
      feishuAppId: envValue(env, auth.feishu_app_id_env),
      isOperatorAllowed: allowlistMatcher(operatorIds),
      isPrivilegedAllowed: allowlistMatcher(privilegedIds),
      isNotificationChatAllowed,
      getOperatorIds: allowlistValues(operatorIds),
      getPrivilegedIds: allowlistValues(privilegedIds),
      getNotificationChatIds: allowlistValues(notificationChatIds),
    }),
    acceptance: Object.freeze({ privilegedActorId }),
  };
  Object.defineProperty(result, "getFeishuAppSecret", {
    enumerable: false,
    value: () => appSecret,
  });
  return Object.freeze(result);
}
