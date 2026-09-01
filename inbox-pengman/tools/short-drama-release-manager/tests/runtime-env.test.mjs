import assert from "node:assert/strict";
import { access, chmod, mkdir, mkdtemp, open, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { buildRuntime, execute } from "../shortdrama_ctl.mjs";
import { loadRuntimeConfig, loadRuntimeEnvironment } from "../src/config.mjs";

function config(envFile = ".env") {
  return {
    schema_version: "shortdrama/v1", timezone: "Asia/Shanghai", source_spreadsheet_id: "sheet",
    paths: {
      env_file: envFile, metrics_sqlite: "metrics.sqlite", collector: "collector.mjs",
      collector_summary_dir: "summaries", ops_sqlite: "ops.sqlite", payload_root: "payloads",
    },
    base: {
      url: "https://base.company.test/base", app_token_env: "BASE_TOKEN",
      table_id_envs: { accounts: "TABLE_ACCOUNTS", dramas: "TABLE_DRAMAS", captures: "TABLE_CAPTURES", releases: "TABLE_RELEASES" },
    },
    auth: {
      feishu_app_id_env: "APP_ID", feishu_app_secret_env: "APP_SECRET", google_service_account_path_env: "GOOGLE_JSON",
      operator_ids_env: "OPERATORS", privileged_ids_env: "PRIVILEGED", notification_chat_ids_env: "CHATS",
    },
    acceptance: { privileged_actor_id: "ou_admin" },
  };
}

function dotenv(extra = "") {
  return [
    "APP_ID=file-app", 'APP_SECRET="secret\\nline"', "BASE_TOKEN=base-token",
    "TABLE_ACCOUNTS=ta", "TABLE_DRAMAS=td", "TABLE_CAPTURES=tc", "TABLE_RELEASES=tr",
    "GOOGLE_JSON=/safe/google.json", "OPERATORS=ou_operator", "PRIVILEGED=ou_admin",
    "CHATS=oc_ops,oc_social", "SHORTDRAMA_OPS_CHAT_ID=oc_ops",
    "NODE_OPTIONS=--require=evil", "HERMES_SESSION_USER_ID=forged", "UNRELATED=$(never_expand)",
    extra,
  ].filter(Boolean).join("\n") + "\n";
}

async function fixture({ envFile = ".env", content = dotenv(), mode = 0o600 } = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), "shortdrama-env-"));
  const configPath = path.join(root, "runtime.json");
  await writeFile(configPath, JSON.stringify(config(envFile)));
  const envPath = path.resolve(root, envFile);
  await mkdir(path.dirname(envPath), { recursive: true });
  await writeFile(envPath, content, { mode });
  await chmod(envPath, mode);
  return { root, configPath, envPath };
}

test("runtime env imports only configured keys and process values override file data", async () => {
  const fx = await fixture();
  const effective = await loadRuntimeEnvironment({
    configPath: fx.configPath,
    env: { APP_ID: "process-app", SHORTDRAMA_CONFIG: fx.configPath },
  });
  assert.equal(effective.APP_ID, "process-app");
  assert.equal(effective.APP_SECRET, "secret\nline");
  assert.equal(effective.BASE_TOKEN, "base-token");
  assert.equal(effective.SHORTDRAMA_OPS_CHAT_ID, "oc_ops");
  for (const key of ["NODE_OPTIONS", "HERMES_SESSION_USER_ID", "UNRELATED"]) assert.equal(effective[key], undefined);
  const runtime = loadRuntimeConfig({ configPath: fx.configPath, env: effective, notificationChatId: "oc_ops" });
  assert.equal(runtime.auth.feishuAppId, "process-app");
  assert.equal(runtime.paths.envFile, fx.envPath);
});

test("runtime env rejects missing, permissive, symlinked, duplicate, and malformed files", async (t) => {
  const missingRoot = await mkdtemp(path.join(os.tmpdir(), "shortdrama-env-missing-"));
  const missingConfig = path.join(missingRoot, "runtime.json");
  await writeFile(missingConfig, JSON.stringify(config("missing.env")));
  await t.test("missing", async () => {
    await assert.rejects(() => loadRuntimeEnvironment({ configPath: missingConfig, env: {} }), (error) => error.code === "config_invalid");
  });
  const permissive = await fixture({ mode: 0o644 });
  await t.test("permissions", async () => {
    await assert.rejects(() => loadRuntimeEnvironment({ configPath: permissive.configPath, env: {} }), (error) => error.code === "config_invalid");
  });
  const linked = await fixture();
  const linkPath = path.join(linked.root, "linked.env");
  await symlink(linked.envPath, linkPath);
  await writeFile(linked.configPath, JSON.stringify(config("linked.env")));
  await t.test("file symlink", async () => {
    await assert.rejects(() => loadRuntimeEnvironment({ configPath: linked.configPath, env: {} }), (error) => error.code === "config_invalid");
  });
  const parentRoot = await mkdtemp(path.join(os.tmpdir(), "shortdrama-env-parent-"));
  await mkdir(path.join(parentRoot, "actual"));
  await writeFile(path.join(parentRoot, "actual", ".env"), dotenv(), { mode: 0o600 });
  await symlink(path.join(parentRoot, "actual"), path.join(parentRoot, "linked"));
  const parentConfig = path.join(parentRoot, "runtime.json");
  await writeFile(parentConfig, JSON.stringify(config("linked/.env")));
  await t.test("parent symlink", async () => {
    await assert.rejects(() => loadRuntimeEnvironment({ configPath: parentConfig, env: {} }), (error) => error.code === "config_invalid");
  });
  for (const [label, extra] of [
    ["duplicate", "APP_ID=again"], ["unsafe key", "BAD-KEY=value"],
    ["export syntax", "export APP_ID=value"], ["bad quote", 'BROKEN="unterminated'], ["bad escape", 'BROKEN="bad\\q"'],
  ]) {
    await t.test(label, async () => {
      const malformed = await fixture({ content: dotenv(extra) });
      await assert.rejects(() => loadRuntimeEnvironment({ configPath: malformed.configPath, env: {} }), (error) => error.code === "config_invalid");
    });
  }
});

test("runtime env binds validation and read to one nofollow descriptor", async () => {
  const fx = await fixture();
  await assert.rejects(() => loadRuntimeEnvironment({
    configPath: fx.configPath,
    env: {},
    openFile: async (target, flags) => {
      await rm(target);
      await writeFile(target, dotenv().replace("APP_ID=file-app", "APP_ID=replaced"), { mode: 0o600 });
      return open(target, flags);
    },
  }), (error) => error.code === "config_invalid");
});

test("launchd-like minimal env reaches privileged init without network and init exits success", async () => {
  const fx = await fixture();
  let remoteCalls = 0;
  const client = {
    listRecords: async () => { remoteCalls += 1; return { complete: true, items: [] }; },
    createRecords: async () => { remoteCalls += 1; return []; },
    updateRecords: async () => { remoteCalls += 1; return []; },
    getRecord: async () => { remoteCalls += 1; return null; },
  };
  const result = await execute([
    "doctor", "--init-state", "--actor-id", "ou_admin", "--config", fx.configPath,
  ], {
    env: { SHORTDRAMA_CONFIG: fx.configPath },
    build: (options) => buildRuntime({
      ...options,
      services: { client, readSchema: async () => ({ complete: true, revision: "empty", tables: [] }) },
    }),
  });
  assert.equal(result.exitCode, 0);
  assert.equal(result.result.status, "state_initialized");
  assert.equal(result.result.state_store, "initialized");
  assert.equal(result.result.schema_status, "schema_missing");
  assert.equal(remoteCalls, 0);
  await access(path.join(fx.root, "ops.sqlite"));
});

test("unsafe env file fails before runtime build or network", async () => {
  const fx = await fixture({ mode: 0o644 });
  let builds = 0;
  const result = await execute(["doctor", "--config", fx.configPath], {
    env: {}, build: async () => { builds += 1; throw new Error("must not build"); },
  });
  assert.equal(result.result.error.code, "config_invalid");
  assert.equal(builds, 0);
});
