import { constants as fsConstants, readFileSync } from "node:fs";
import { lstat, open } from "node:fs/promises";
import { dirname, isAbsolute, resolve } from "node:path";

import { validateExcludedPostIds, validateMaxPostAgeDays } from "./capture-policy.mjs";
import { isValidTimeZone } from "./zoned-day.mjs";

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
    "SHORTDRAMA_REPORT_CHAT_ID",
    "BEIDOU_API_KEY",
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
  const inspectDirectory = async () => {
    let info;
    try { info = await lstat(cursor); }
    catch { invalid("Dotenv parent directory is unavailable"); }
    if (info.isSymbolicLink() || !info.isDirectory()) invalid("Dotenv parent directory is unsafe");
  };
  await inspectDirectory();
  const parts = relativePath.split(/[\\/]+/);
  for (let index = 0; index < parts.length - 1; index += 1) {
    const part = parts[index];
    if (part === "" || part === ".") continue;
    cursor = part === ".." ? dirname(cursor) : resolve(cursor, part);
    await inspectDirectory();
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
  const dailyViewsTableId = base.daily_views_table_id;
  if (dailyViewsTableId !== undefined && (typeof dailyViewsTableId !== "string" || !/^tbl[A-Za-z0-9]+$/.test(dailyViewsTableId) || Object.values(tableIds).includes(dailyViewsTableId))) invalid("Invalid daily views table binding");
  const analyticsTableIds = base.analytics_table_ids;
  if (analyticsTableIds !== undefined) {
    const keys = ["accountDaily", "dramas", "releaseDays", "firstDays"];
    if (!analyticsTableIds || typeof analyticsTableIds !== "object" || Array.isArray(analyticsTableIds) || Object.keys(analyticsTableIds).length !== keys.length ||
        keys.some(key => typeof analyticsTableIds[key] !== "string" || !/^tbl[A-Za-z0-9]+$/.test(analyticsTableIds[key]))) invalid("Invalid analytics table bindings");
    const bound = [...Object.values(tableIds), ...(dailyViewsTableId ? [dailyViewsTableId] : []), ...Object.values(analyticsTableIds)];
    if (new Set(bound).size !== bound.length || !dailyViewsTableId) invalid("Duplicate or incomplete analytics bindings");
  }
  const externalTables = base.external_tables;
  if (externalTables !== undefined) {
    if (!externalTables || typeof externalTables !== "object" || Array.isArray(externalTables)) invalid("Invalid external table metadata");
    const managedIds = new Set([...Object.values(tableIds), ...(dailyViewsTableId ? [dailyViewsTableId] : []), ...Object.values(analyticsTableIds ?? {})]);
    for (const [id, name] of Object.entries(externalTables)) {
      if (!/^tbl[A-Za-z0-9]+$/.test(id) || typeof name !== "string" || !name.trim() || name !== name.trim() || managedIds.has(id)) invalid("Invalid or overlapping external table metadata");
    }
    if (new Set(Object.values(externalTables)).size !== Object.keys(externalTables).length) invalid("Duplicate external table name");
  }
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
  // Capture reports and health alerts go to the report chat; without one they
  // stay in the ops chat.
  const configuredReportChat = env.SHORTDRAMA_REPORT_CHAT_ID;
  if (configuredReportChat !== undefined && configuredReportChat !== "" && !isNotificationChatAllowed(configuredReportChat)) {
    throw new ShortDramaError("notification_target_denied", "Report chat is not allowlisted");
  }
  const reportChatId = configuredReportChat || notificationChatId || null;
  let maxAgeDays, excludedPostIds;
  try { maxAgeDays = validateMaxPostAgeDays(runtime.capture?.max_age_days); }
  catch { invalid("Invalid capture.max_age_days"); }
  try { excludedPostIds = validateExcludedPostIds(runtime.capture?.excluded_post_ids); }
  catch { invalid("Invalid capture.excluded_post_ids"); }
  const reporting = runtime.daily_reporting ?? {};
  const reportingMode = reporting.mode ?? "capture_interval";
  if (!["capture_interval", "calendar_day"].includes(reportingMode)) invalid("Invalid daily_reporting.mode");
  const startDate = reporting.start_date ?? null;
  if (reportingMode === "calendar_day" && (typeof startDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(startDate) ||
      !Number.isFinite(Date.parse(startDate + "T00:00:00Z")) || new Date(startDate + "T00:00:00Z").toISOString().slice(0, 10) !== startDate)) invalid("Invalid daily_reporting.start_date");
  const clock = runtime.schedule ?? {};
  const schedule = {captureHour: clock.capture_hour ?? 8, captureMinute: clock.capture_minute ?? 0, healthHour: clock.health_hour ?? 10, healthMinute: clock.health_minute ?? 0};
  for (const [key, value] of Object.entries(schedule)) if (!Number.isInteger(value) || value < 0 || value > (key.endsWith("Hour") ? 23 : 59)) invalid("Invalid schedule clock", {field: key});
  if (schedule.healthHour * 60 + schedule.healthMinute <= schedule.captureHour * 60 + schedule.captureMinute) invalid("Schedule health check must follow capture");
  // Further captures of the same Beijing day, each checked as long after its
  // start as the first one. All of a slot, its health check included, stays within the day.
  const extraTimes = clock.extra_capture_times ?? [];
  if (!Array.isArray(extraTimes) || extraTimes.length > 4) invalid("Invalid extra capture times");
  const healthDelay = schedule.healthHour * 60 + schedule.healthMinute - (schedule.captureHour * 60 + schedule.captureMinute);
  let previous = schedule.captureHour * 60 + schedule.captureMinute;
  const extraCaptures = extraTimes.map((time) => {
    const match = typeof time === "string" ? /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time) : null;
    const minutes = match ? Number(match[1]) * 60 + Number(match[2]) : NaN;
    if (!match || minutes <= previous || minutes + healthDelay > 1439) invalid("Invalid extra capture times", {time: String(time).slice(0, 16)});
    previous = minutes;
    return Object.freeze({hour: Number(match[1]), minute: Number(match[2])});
  });
  schedule.extraCaptures = Object.freeze(extraCaptures);
  const batchReview = runtime.batch_review ?? {};
  if (batchReview.enabled !== undefined && typeof batchReview.enabled !== "boolean") invalid("Invalid batch review switch");
  const publicationTimezone = batchReview.publication_timezone ?? 'Asia/Shanghai';
  const publicationTimezoneSince = batchReview.publication_timezone_since ?? null;
  const publicationTimezones = batchReview.publication_timezones ?? {};
  if (!isValidTimeZone(publicationTimezone) ||
      (batchReview.publication_timezone !== undefined) !== (batchReview.publication_timezone_since !== undefined) ||
      publicationTimezoneSince !== null && (typeof publicationTimezoneSince !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(publicationTimezoneSince) ||
        !Number.isFinite(Date.parse(publicationTimezoneSince)) || new Date(publicationTimezoneSince).toISOString().slice(0,10)!==publicationTimezoneSince) ||
      !publicationTimezones || typeof publicationTimezones !== 'object' || Array.isArray(publicationTimezones) ||
      Object.entries(publicationTimezones).some(([accountId,zone])=>!publicationTimezoneSince || !/^[A-Za-z0-9._-]{1,100}$/.test(accountId) || ['__proto__','constructor','prototype'].includes(accountId) || !isValidTimeZone(zone)))
    invalid('Invalid publication calendar configuration');
  const autoMatch = batchReview.auto_match ?? false, autoMatchSince = batchReview.auto_match_since ?? null;
  if (typeof autoMatch !== "boolean" || autoMatch && (typeof autoMatchSince !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(autoMatchSince) || !Number.isFinite(Date.parse(autoMatchSince)) || new Date(autoMatchSince).toISOString().slice(0,10) !== autoMatchSince)) invalid("Automatic batch matching requires an explicit valid rollout date");
  const countOnlySince = batchReview.count_only_since ?? null;
  if(countOnlySince!==null&&(!autoMatch||typeof countOnlySince!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(countOnlySince)||!Number.isFinite(Date.parse(countOnlySince))||new Date(countOnlySince).toISOString().slice(0,10)!==countOnlySince||countOnlySince<autoMatchSince)) invalid("Count-only batch matching requires a valid rollout date after automatic matching starts");
  const captionBackfill = runtime.caption_backfill ?? null;
  if(captionBackfill!==null&&(!captionBackfill||typeof captionBackfill!=="object"||Array.isArray(captionBackfill)||
      Object.keys(captionBackfill).some(key=>!["mode","request_id","cutoff","expected_plan_sha256","allow_unknown_drama","lead_review_only","max_actions_per_run"].includes(key))||
      !["plan","apply"].includes(captionBackfill.mode)||!/^caption-[a-z0-9-]{4,50}$/.test(captionBackfill.request_id??"")||
      captionBackfill.allow_unknown_drama!==undefined&&typeof captionBackfill.allow_unknown_drama!=="boolean"||
      captionBackfill.lead_review_only!==undefined&&typeof captionBackfill.lead_review_only!=="boolean"||
      captionBackfill.max_actions_per_run!==undefined&&(!Number.isInteger(captionBackfill.max_actions_per_run)||captionBackfill.max_actions_per_run<1||captionBackfill.max_actions_per_run>50)||
      typeof captionBackfill.cutoff!=="string"||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(captionBackfill.cutoff)||
      !Number.isFinite(Date.parse(captionBackfill.cutoff))||new Date(captionBackfill.cutoff).toISOString()!==captionBackfill.cutoff.replace(/Z$/,".000Z")||
      (captionBackfill.mode==="apply")!==Object.hasOwn(captionBackfill,"expected_plan_sha256")||
      captionBackfill.mode==="apply"&&!/^[a-f0-9]{64}$/.test(captionBackfill.expected_plan_sha256)))invalid("Invalid caption backfill request");
  const captionAuto = runtime.caption_auto ?? {};
  if(!captionAuto||typeof captionAuto!=="object"||Array.isArray(captionAuto)||
      Object.keys(captionAuto).some(key=>!["enabled","start_at","lead_review_only","recognize_dramas","observe_only","verified_codes","max_actions_per_run","partial_link_post_ids","time_order_targets"].includes(key))||
      captionAuto.enabled!==undefined&&typeof captionAuto.enabled!=="boolean"||
      captionAuto.lead_review_only!==undefined&&typeof captionAuto.lead_review_only!=="boolean"||
      captionAuto.recognize_dramas!==undefined&&typeof captionAuto.recognize_dramas!=="boolean"||
      captionAuto.observe_only!==undefined&&typeof captionAuto.observe_only!=="boolean"||
      captionAuto.recognize_dramas===true&&captionAuto.lead_review_only===true||
      captionAuto.verified_codes!==undefined&&(!Array.isArray(captionAuto.verified_codes)||captionAuto.verified_codes.length>200||captionAuto.verified_codes.some(rule=>
        !rule||typeof rule!=="object"||Object.keys(rule).some(k=>!["platform","code","drama_id"].includes(k))||
        !["ReelShort","DramaBox","MoboReels","ShortMax","TopShort"].includes(rule.platform)||typeof rule.code!=="string"||!/^[a-z0-9]{4,16}$/i.test(rule.code)||!/^SD-\d{6}$/.test(rule.drama_id??""))||
        new Set(captionAuto.verified_codes.map(rule=>`${rule.platform}:${rule.code.toLowerCase()}`)).size!==captionAuto.verified_codes.length)||
      captionAuto.partial_link_post_ids!==undefined&&(!Array.isArray(captionAuto.partial_link_post_ids)||captionAuto.partial_link_post_ids.length>20||
        new Set(captionAuto.partial_link_post_ids).size!==captionAuto.partial_link_post_ids.length||
        captionAuto.partial_link_post_ids.some(id=>typeof id!=="string"||!/^\d{10,25}$/.test(id)))||
      captionAuto.time_order_targets!==undefined&&(!Array.isArray(captionAuto.time_order_targets)||captionAuto.time_order_targets.length>20||
        new Set(captionAuto.time_order_targets.map(target=>`${target?.account_id}:${target?.drama_id}`)).size!==captionAuto.time_order_targets.length||
        captionAuto.time_order_targets.some(target=>!target||typeof target!=="object"||Array.isArray(target)||
          Object.keys(target).sort().join('|')!=='account_id|drama_id'||
          typeof target.account_id!=="string"||!/^[A-Za-z0-9._-]{1,100}$/.test(target.account_id)||
          typeof target.drama_id!=="string"||!/^SD-\d{6}$/.test(target.drama_id)))||
      captionAuto.enabled===true&&(typeof captionAuto.start_at!=="string"||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(captionAuto.start_at)||
        !Number.isFinite(Date.parse(captionAuto.start_at))||new Date(captionAuto.start_at).toISOString()!==captionAuto.start_at.replace(/Z$/,".000Z"))||
      captionAuto.max_actions_per_run!==undefined&&(!Number.isInteger(captionAuto.max_actions_per_run)||captionAuto.max_actions_per_run<1||captionAuto.max_actions_per_run>50))invalid("Invalid continuous caption automation configuration");
  const captionRepair = runtime.caption_repair ?? null;
  if(captionRepair!==null&&(!captionRepair||typeof captionRepair!=="object"||Array.isArray(captionRepair)||
      Object.keys(captionRepair).sort().join('|')!==['account_record_id','capture_record_id','post_id','release_id','release_record_id','request_id'].join('|')||
      !/^caption-repair-[a-z0-9-]{4,50}$/.test(captionRepair.request_id??'')||
      !/^SR-\d{6}$/.test(captionRepair.release_id??'')||!/^\d+$/.test(captionRepair.post_id??'')||
      ['release_record_id','capture_record_id','account_record_id'].some(key=>!/^rec[A-Za-z0-9]+$/.test(captionRepair[key]??''))))invalid('Invalid exact caption repair request');
  const scheduleRepairs = batchReview.schedule_repairs ?? [];
  if (!Array.isArray(scheduleRepairs) || scheduleRepairs.length > 10 || new Set(scheduleRepairs.map(r=>r?.batch_id)).size !== scheduleRepairs.length || scheduleRepairs.some(r=>
      !r || typeof r !== "object" || !["batch_id","expected_version","parent_receipt_id"].every(k=>Object.hasOwn(r,k)) || Object.keys(r).some(k=>!["batch_id","expected_version","parent_receipt_id","settled_absence"].includes(k)) ||
      r.settled_absence !== undefined && (!r.settled_absence || Object.keys(r.settled_absence).sort().join("|") !== "receipt_ids|verified_at" || !Array.isArray(r.settled_absence.receipt_ids) || !r.settled_absence.receipt_ids.length || r.settled_absence.receipt_ids.length>30 || r.settled_absence.receipt_ids.some(id=>typeof id!=="string"||!/^sdp_[0-9a-f-]{36}$/.test(id)) || !Number.isFinite(Date.parse(r.settled_absence.verified_at))) ||
      typeof r.batch_id !== "string" || !/^SB-[0-9a-f-]{36}$/.test(r.batch_id) ||
      typeof r.parent_receipt_id !== "string" || !/^sdp_[0-9a-f-]{36}$/.test(r.parent_receipt_id) ||
      typeof r.expected_version !== "string" || !/^[0-9a-f]{64}$/.test(r.expected_version))) invalid("Invalid bounded schedule repair request");
  const metadataRepairs = batchReview.metadata_repairs ?? [];
  const metadataKeys = ["account_record_id","batch_id","drama_record_id","expected_version","owner_id","planned_at","record_ids","release_ids"];
  if (!Array.isArray(metadataRepairs) || metadataRepairs.length > 1 || metadataRepairs.some(r =>
      !r || typeof r !== "object" || Array.isArray(r) || Object.keys(r).sort().join("|") !== metadataKeys.join("|") ||
      r.batch_id !== "fakedatingpm" ||
      !Array.isArray(r.release_ids) || r.release_ids.length !== 3 || new Set(r.release_ids).size !== 3 ||
      r.release_ids.some(id => typeof id !== "string" || !/^SR-\d{6}$/.test(id)) ||
      r.release_ids.join("|") !== "SR-000614|SR-000615|SR-000616" ||
      !Array.isArray(r.record_ids) || r.record_ids.length !== 3 || new Set(r.record_ids).size !== 3 ||
      r.record_ids.some(id => typeof id !== "string" || !/^rec[A-Za-z0-9]+$/.test(id)) ||
      [r.account_record_id,r.drama_record_id].some(id => typeof id !== "string" || !/^rec[A-Za-z0-9]+$/.test(id)) ||
      typeof r.owner_id !== "string" || !/^ou_[A-Za-z0-9]+$/.test(r.owner_id) ||
      typeof r.planned_at !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(r.planned_at) ||
      !Number.isFinite(Date.parse(r.planned_at)) || new Date(r.planned_at).toISOString().slice(0,10) !== r.planned_at ||
      typeof r.expected_version !== "string" || !/^[0-9a-f]{64}$/.test(r.expected_version))) invalid("Invalid bounded metadata repair request");
  const duplicateRelationRepairs = batchReview.duplicate_relation_repairs ?? [];
  const repairFields = ["release_id","owner_release_id","post_id","capture_record_id","release_record_id","owner_record_id","release_date","owner_date"];
  const captionRepairFields = ["mode","published_at","caption_sha256","owner_drama_record_id","target_drama_record_id","owner_title","part"];
  if (!Array.isArray(duplicateRelationRepairs) || duplicateRelationRepairs.length > 1 || duplicateRelationRepairs.some(r =>
      !r || typeof r !== "object" || Array.isArray(r) || repairFields.some(k=>!Object.hasOwn(r,k)) || Object.keys(r).some(k=>![...repairFields,"attempt_id",...captionRepairFields].includes(k)) ||
      (r.attempt_id !== undefined && (typeof r.attempt_id !== "string" || !/^[a-z0-9-]{1,32}$/.test(r.attempt_id))) ||
      ![undefined,"explicit","machine_match","caption_part"].includes(r.mode) ||
      (r.mode === undefined || r.mode === "explicit") && captionRepairFields.some(k=>Object.hasOwn(r,k)) ||
      ["machine_match","caption_part"].includes(r.mode) && (
        ["published_at","caption_sha256","owner_drama_record_id","target_drama_record_id","owner_title"].some(k=>!Object.hasOwn(r,k)) ||
        typeof r.published_at!=="string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(r.published_at) || !Number.isFinite(Date.parse(r.published_at)) ||
        typeof r.caption_sha256!=="string" || !/^[0-9a-f]{64}$/.test(r.caption_sha256) ||
        [r.owner_drama_record_id,r.target_drama_record_id].some(id=>typeof id!=="string"||!/^recv[A-Za-z0-9]+$/.test(id)) ||
        typeof r.owner_title!=="string" || r.owner_title.length<4 || r.owner_title.length>120 || r.owner_title.trim()!==r.owner_title ||
        (r.mode==="caption_part" ? !Number.isInteger(r.part)||r.part<1||r.part>30 : Object.hasOwn(r,"part"))
      ) ||
      !/^SR-\d{6}$/.test(r.release_id) || !/^SR-\d{6}$/.test(r.owner_release_id) || r.release_id === r.owner_release_id ||
      !/^\d{10,25}$/.test(r.post_id) || [r.capture_record_id,r.release_record_id,r.owner_record_id].some(id => typeof id !== "string" || !/^recv[A-Za-z0-9]+$/.test(id)) ||
      [r.release_date,r.owner_date].some(date => typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date+"T00:00:00Z")) || new Date(date+"T00:00:00Z").toISOString().slice(0,10) !== date))) invalid("Invalid bounded duplicate relation repair request");
  const reviewViewId = batchReview.view_id ?? null;
  if (reviewViewId !== null && (typeof reviewViewId !== "string" || !/^vew[A-Za-z0-9]+$/.test(reviewViewId))) invalid("Invalid batch review view ID");
  const ownerAliases = batchReview.owner_aliases ?? {};
  if (!ownerAliases || typeof ownerAliases !== "object" || Array.isArray(ownerAliases) || Object.entries(ownerAliases).some(([alias,canonical]) =>
      !/^(?:ou_[A-Za-z0-9]+|[A-Za-z0-9]{8})$/.test(alias) || typeof canonical !== "string" || !/^ou_[A-Za-z0-9]+$/.test(canonical) || Object.hasOwn(ownerAliases,canonical))) invalid("Invalid same-person owner alias map");
  const batchWaitHours = batchReview.wait_hours ?? 24;
  const batchReminderHours = batchReview.reminder_hours ?? 24;
  if (![batchWaitHours, batchReminderHours].every(v => Number.isSafeInteger(v) && v >= 1 && v <= 168)) invalid("Batch review hours must be 1–168");
  const notifyStartHour = batchReview.notify_start_hour ?? 9;
  const notifyEndHour = batchReview.notify_end_hour ?? 20;
  if (![notifyStartHour, notifyEndHour].every(v => Number.isInteger(v) && v >= 0 && v <= 23) || notifyStartHour >= notifyEndHour) invalid("Batch review notification hours must be a valid daytime interval");
  const reviewChatId = batchReview.review_chat_id ?? null;
  if (reviewChatId !== null && (typeof reviewChatId !== "string" || !/^oc_[A-Za-z0-9]+$/.test(reviewChatId) || !isNotificationChatAllowed(reviewChatId))) invalid("Review group must be an allowlisted chat");
  const reviewGroupRecipients = batchReview.review_group_recipients ?? [];
  if (!Array.isArray(reviewGroupRecipients) || reviewGroupRecipients.length > 20 || new Set(reviewGroupRecipients).size !== reviewGroupRecipients.length ||
      reviewGroupRecipients.some(id => typeof id !== "string" || !/^ou_[A-Za-z0-9]+$/.test(id)) || (reviewChatId === null && reviewGroupRecipients.length)) invalid("Invalid review group recipients");
  const silentBatchIds = batchReview.silent_batch_ids ?? [];
  if (!Array.isArray(silentBatchIds) || silentBatchIds.length > 100 || new Set(silentBatchIds).size !== silentBatchIds.length ||
      silentBatchIds.some(id => typeof id !== "string" || !/^SB-[A-Za-z0-9-]+$/.test(id))) invalid("Invalid silent batch IDs");
  const beidouInput = runtime.beidou ?? {};
  if (!beidouInput || typeof beidouInput !== "object" || Array.isArray(beidouInput) ||
      Object.keys(beidouInput).some(key => !["enabled", "start_at"].includes(key)) ||
      beidouInput.enabled !== undefined && typeof beidouInput.enabled !== "boolean") invalid("Invalid beidou configuration");
  const beidouEnabled = beidouInput.enabled === true;
  const beidouStartAt = beidouInput.start_at ?? null;
  if (beidouEnabled && (typeof beidouStartAt !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(beidouStartAt) ||
      !Number.isFinite(Date.parse(beidouStartAt)) || new Date(beidouStartAt).toISOString().slice(0, 10) !== beidouStartAt.slice(0, 10)))
    invalid("Invalid beidou.start_at");
  const beidouApiKey = env.BEIDOU_API_KEY === undefined ? null : nonEmptyString(env.BEIDOU_API_KEY, "env.BEIDOU_API_KEY");
  if (beidouEnabled && !beidouApiKey) invalid("BEIDOU_API_KEY is required when Beidou enrichment is enabled");
  if (beidouApiKey && (beidouApiKey.length > 256 || /[\r\n]/.test(beidouApiKey))) invalid("Invalid Beidou API key");
  const result = {
    captionBackfill: captionBackfill===null?null:Object.freeze({...captionBackfill,allowUnknownDrama:captionBackfill.allow_unknown_drama===true,leadReviewOnly:captionBackfill.lead_review_only===true,maxActionsPerRun:captionBackfill.max_actions_per_run??20}),
    captionAuto: Object.freeze({enabled:captionAuto.enabled===true,startAt:captionAuto.start_at??null,leadReviewOnly:captionAuto.lead_review_only===true,recognizeDramas:captionAuto.recognize_dramas===true,observeOnly:captionAuto.observe_only===true,verifiedCodes:Object.freeze((captionAuto.verified_codes??[]).map(rule=>Object.freeze({...rule}))),partialLinkPostIds:Object.freeze([...(captionAuto.partial_link_post_ids??[])]),timeOrderTargets:Object.freeze((captionAuto.time_order_targets??[]).map(target=>Object.freeze({accountId:target.account_id,dramaId:target.drama_id}))),maxActionsPerRun:captionAuto.max_actions_per_run??10}),
    captionRepair: captionRepair===null?null:Object.freeze({requestId:captionRepair.request_id,releaseId:captionRepair.release_id,
      releaseRecordId:captionRepair.release_record_id,postId:captionRepair.post_id,captureRecordId:captionRepair.capture_record_id,
      accountRecordId:captionRepair.account_record_id}),
    batchReview: Object.freeze({enabled: batchReview.enabled === true, scheduleRepairs: Object.freeze(scheduleRepairs.map(r=>Object.freeze({...r}))), metadataRepairs: Object.freeze(metadataRepairs.map(r=>Object.freeze({...r,release_ids:Object.freeze([...r.release_ids]),record_ids:Object.freeze([...r.record_ids])}))), duplicateRelationRepairs: Object.freeze(duplicateRelationRepairs.map(r=>Object.freeze({...r}))), autoMatch, autoMatchSince, countOnlySince, viewId: reviewViewId, reviewChatId, reviewGroupRecipients:Object.freeze([...reviewGroupRecipients]),silentBatchIds:Object.freeze([...silentBatchIds]), ownerAliases: Object.freeze({...ownerAliases}), waitHours: batchWaitHours, reminderHours: batchReminderHours, notifyStartHour, notifyEndHour, publicationTimezone, publicationTimezoneSince, publicationTimezones:Object.freeze({...publicationTimezones})}),
    schemaVersion: runtime.schema_version,
    dailyReporting: Object.freeze({mode: reportingMode, startDate}),
    schedule: Object.freeze(schedule),
    beidou: Object.freeze({enabled: beidouEnabled, startAt: beidouStartAt}),
    capture: Object.freeze({ maxAgeDays, excludedPostIds }),
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
      ...(dailyViewsTableId ? { dailyViewsTableId } : {}),
      ...(analyticsTableIds ? { analyticsTableIds: Object.freeze({...analyticsTableIds}) } : {}),
      ...(externalTables ? { externalTables: Object.freeze({...externalTables}) } : {}),
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
    notifications: Object.freeze({ getReportChatId: () => reportChatId }),
  };
  Object.defineProperty(result, "getFeishuAppSecret", {
    enumerable: false,
    value: () => appSecret,
  });
  Object.defineProperty(result, "getBeidouApiKey", {
    enumerable: false,
    value: () => beidouApiKey,
  });
  return Object.freeze(result);
}
