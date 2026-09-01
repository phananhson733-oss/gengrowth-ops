import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { ShortDramaError } from "./errors.mjs";

const TABLE_ID_KEYS = ["accounts", "dramas", "captures", "releases"];

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
    }),
    acceptance: Object.freeze({ privilegedActorId }),
  };
  Object.defineProperty(result, "getFeishuAppSecret", {
    enumerable: false,
    value: () => appSecret,
  });
  return Object.freeze(result);
}
