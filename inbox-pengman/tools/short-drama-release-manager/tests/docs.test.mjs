import assert from "node:assert/strict";
import { execFile as execFileCallback } from "node:child_process";
import { chmod, mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { promisify } from "node:util";
import os from "node:os";
import path from "node:path";
import test from "node:test";

const root = new URL("../", import.meta.url);
const readmeUrl = new URL("README.md", root);
const envUrl = new URL("../tiktok-public-capture/.env.example", root);
const configUrl = new URL("shortdrama.config.example.json", root);
const requirementsUrl = new URL("../../06-requirements/2026-08-30-短剧数据采集迁移与发行管理平台需求文档.md", root);
const planUrl = new URL("../../06-requirements/2026-09-01-短剧发行管理-v5-实施计划.md", root);
const execFile = promisify(execFileCallback);
const obsolete20260907Artifacts = Object.freeze([
  "migration-plan-20260907-110158.json",
  "schema-receipt-20260907-110617.json",
  "canary-receipt-20260907-111102.json",
  "permission-observations-20260907-112253.json",
  "permission-attestation-20260907-112253.json",
]);

async function docs() {
  return {
    readme: await readFile(readmeUrl, "utf8"),
    env: await readFile(envUrl, "utf8"),
    config: await readFile(configUrl, "utf8"),
    requirements: await readFile(requirementsUrl, "utf8"),
    plan: await readFile(planUrl, "utf8"),
  };
}

test("requirements and Task 12 bind the reconciled v2 migration contract", async () => {
  const { requirements, plan } = await docs();
  const combined = `${requirements}\n${plan}`;
  for (const term of [
    "Google 历史 ∪ SQLite latest",
    "shortdrama-migration/v2",
    "warnings_by_code",
    "Google-only 历史 Post",
    "blocked=0",
  ]) assert.match(combined, new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.doesNotMatch(requirements, /Post ID 集合与 SQLite 最新帖子集合一致/);
  assert.doesNotMatch(plan, /16 个现有剧/);
});

test("three authoritative docs state the shipped Select-option migration contract", async () => {
  const { readme, requirements, plan } = await docs();
  const clauses = [
    "`manifest_append` allowlist 仅限：账号台账.所属组、账号台账.表现形式、选剧池.剧分类、选剧池.生命周期、选剧池.RS Boost 分类（待确认）、选剧池.账号组、选剧池.语言、选剧池.来源",
    "选剧池.平台和选剧池.推荐人是固定闭集",
    "MoboReels → 其他仅用于迁移；其他未知平台必须 blocked",
    "record write 不隐式创建 options",
    "普通用户当前对四张表只读；人工业务写只经 Social Bot",
    "每次 data apply 必须验证新鲜且绑定相同 manifest/Base/schema 的 schema receipt，并完成 data preflight",
    "schema partial failure 必须 replan_reconfirm，不回滚",
  ];

  for (const [name, text] of Object.entries({ readme, requirements, plan })) {
    for (const clause of clauses) {
      assert.ok(text.includes(clause), `${name} must state: ${clause}`);
    }
    for (const artifact of obsolete20260907Artifacts) {
      assert.ok(text.includes(artifact), `${name} must name obsolete ${artifact}`);
    }
    assert.doesNotMatch(text, /20260907\*\.json/);
  }
});

test("requirements makes Base the read-only system-of-record display and routes business writes through Social Bot Runner", async () => {
  const { requirements } = await docs();
  assert.match(requirements, /Base 是系统记录和展示界面/);
  assert.match(requirements, /普通用户（四表 Base UI）\s*\| 只读查询 \| 任何业务写入/);
  assert.match(requirements, /授权 Ops 经 Social Bot → Runner/);
  assert.match(requirements, /privileged Base UI 仅用于明确的 schema\/recovery 管理/);
  assert.doesNotMatch(requirements, /唯一人工录入口|选剧池只能由人直接|Base UI 中的业务人员/);
});

test("plan treats unaudited Base UI changes as drift, not a normal write route", async () => {
  const { plan } = await docs();
  const taskEight = plan.slice(plan.indexOf("### Task 8:"), plan.indexOf("### Task 9:"));
  assert.match(taskEight, /未经 Social Bot→Runner 审计的 Base UI 变更.*未预期 drift/);
  assert.match(taskEight, /受影响行.*privileged recovery/);
  assert.doesNotMatch(taskEight, /Base UI 编辑不影响本轮/);
});

test("README names every obsolete 20260907 artifact and never calls receipt validation an execution step", async () => {
  const { readme } = await docs();
  for (const artifact of obsolete20260907Artifacts) {
    assert.ok(readme.includes(artifact), `README must name obsolete ${artifact}`);
  }
  assert.match(readme, /必须验证新鲜且绑定相同 manifest\/Base\/schema 的 schema receipt/);
  assert.doesNotMatch(readme, /执行 fresh schema receipt|20260907 旧证据链|20260907\*\.json/);
});

test("README makes shortdrama_ctl the sole v5 production entry and retires historical execution guidance", async () => {
  const { readme } = await docs();
  const firstLine = readme.split("\n", 1)[0];
  assert.match(firstLine, /shortdrama_ctl/);
  assert.match(firstLine, /唯一.*生产入口/);
  assert.match(readme, /sync_shortdrama_to_feishu\.mjs.*historical\/disabled/);
  assert.match(readme, /com\.gengrowth\.shortdrama-feishu-sync.*historical\/disabled/);
  assert.doesNotMatch(readme, /sync_shortdrama_to_feishu\.mjs --(?:google-canary|setup-google|setup-feishu|canary|sync)/);
  assert.doesNotMatch(readme, /10:30|每 15 分钟|每隔 15 分钟/);
});

test("Task 12 pins lark-cli and provides a syntax-valid exact-four empty Base bootstrap", async () => {
  const { plan } = await docs();
  const match = /# BEGIN TASK12 EXACT FOUR BOOTSTRAP\n([\s\S]*?)# END TASK12 EXACT FOUR BOOTSTRAP/.exec(plan);
  assert.ok(match, "Task 12 bootstrap block is missing");
  await execFile("/bin/zsh", ["-n", "-c", match[1]]);
  for (const term of [
    "lark-cli version 1.0.91", "+table-list", "+table-update", "+table-create", "+record-list",
    ".data.base_token // empty", ".data.tables[0].id // empty", ".data.table.id // empty", ".data.total == 0",
    "FEISHU_SHORTDRAMA_ACCOUNTS_TABLE_ID", "FEISHU_SHORTDRAMA_POOL_TABLE_ID",
    "FEISHU_SHORTDRAMA_CAPTURES_TABLE_ID", "FEISHU_SHORTDRAMA_RELEASES_TABLE_ID",
    "账号台账", "选剧池", "采集数据", "发布记录",
  ]) assert.match(match[1], new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  for (const [name, primary] of [["选剧池", "剧ID"], ["采集数据", "Post ID"], ["发布记录", "发布ID"]]) {
    assert.match(match[1], new RegExp(`\\+table-create[^\\n]+--name "${name}"[^\\n]+--fields '\\[\\{"name":"${primary}","type":"text"\\}\\]'`));
  }
});

test("Task 12 exact-four bootstrap executes only through a fake lark-cli and binds returned table IDs", async () => {
  const { plan } = await docs();
  const block = /# BEGIN TASK12 EXACT FOUR BOOTSTRAP\n([\s\S]*?)# END TASK12 EXACT FOUR BOOTSTRAP/.exec(plan)?.[1];
  assert.ok(block);
  const root = await mkdtemp(path.join(os.tmpdir(), "shortdrama-task12-bootstrap-"));
  const bin = path.join(root, "bin");
  const evidence = path.join(root, "evidence");
  await mkdir(bin);
  await mkdir(evidence);
  const envFile = path.join(root, "runtime.env");
  await writeFile(envFile, [
    "FEISHU_SHORTDRAMA_APP_TOKEN=", "FEISHU_SHORTDRAMA_ACCOUNTS_TABLE_ID=", "FEISHU_SHORTDRAMA_POOL_TABLE_ID=",
    "FEISHU_SHORTDRAMA_CAPTURES_TABLE_ID=", "FEISHU_SHORTDRAMA_RELEASES_TABLE_ID=",
  ].join("\n") + "\n", { mode: 0o600 });
  const config = path.join(root, "runtime.json");
  await writeFile(config, JSON.stringify({ paths: { env_file: "runtime.env" } }));
  const log = path.join(root, "lark.log");
  const created = path.join(root, "created");
  const fake = path.join(bin, "lark-cli");
  await writeFile(fake, `#!/bin/zsh
print -- "$*" >> "$FAKE_LARK_LOG"
if [[ "$1" == "--version" ]]; then print -- "lark-cli version 1.0.91"; exit 0; fi
case "$*" in
  *"+url-resolve"*) print -- '{"data":{"base_token":"bas_fake"}}';;
  *"+base-get"*) print -- '{"data":{"base_token":"bas_fake","name":"Formal"}}';;
  *"+table-list"*)
    if [[ -f "$FAKE_LARK_CREATED" ]]; then
      print -- '{"data":{"tables":[{"id":"tbl_accounts","name":"账号台账"},{"id":"tbl_pool","name":"选剧池"},{"id":"tbl_captures","name":"采集数据"},{"id":"tbl_releases","name":"发布记录"}]}}'
    else print -- '{"data":{"tables":[{"id":"tbl_accounts","name":"默认数据表"}]}}'; fi;;
  *"+record-list"*) print -- '{"data":{"total":0}}';;
  *"+table-update"*) print -- '{"data":{"table":{"id":"tbl_accounts","name":"账号台账"}}}';;
  *"+table-create"*"选剧池"*) print -- '{"data":{"table":{"id":"tbl_pool","name":"选剧池"}}}';;
  *"+table-create"*"采集数据"*) print -- '{"data":{"table":{"id":"tbl_captures","name":"采集数据"}}}';;
  *"+table-create"*"发布记录"*) print created > "$FAKE_LARK_CREATED"; print -- '{"data":{"table":{"id":"tbl_releases","name":"发布记录"}}}';;
  *) print -u2 -- "unexpected fake lark command: $*"; exit 91;;
esac
`, { mode: 0o700 });
  await chmod(fake, 0o700);
  const script = path.join(root, "bootstrap.zsh");
  await writeFile(script, block);
  await execFile("/bin/zsh", ["-c", 'print -- "create-four-empty-tables" | /bin/zsh "$1"', "task12", script], { env: {
    ...process.env, PATH: `${bin}:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin`,
    RUNTIME_CONFIG: config, EVIDENCE_DIR: evidence, SHORTDRAMA_NEW_BASE_URL: "https://example.feishu.cn/base/fake",
    PRIVILEGED_ACTOR_ID: "ou_fixture", FAKE_LARK_LOG: log, FAKE_LARK_CREATED: created,
  } });
  const values = Object.fromEntries((await readFile(envFile, "utf8")).trim().split("\n").map((line) => line.split("=")));
  assert.deepEqual(values, {
    FEISHU_SHORTDRAMA_APP_TOKEN: "bas_fake", FEISHU_SHORTDRAMA_ACCOUNTS_TABLE_ID: "tbl_accounts",
    FEISHU_SHORTDRAMA_POOL_TABLE_ID: "tbl_pool", FEISHU_SHORTDRAMA_CAPTURES_TABLE_ID: "tbl_captures",
    FEISHU_SHORTDRAMA_RELEASES_TABLE_ID: "tbl_releases",
  });
  const calls = await readFile(log, "utf8");
  assert.equal((calls.match(/\+table-create/g) ?? []).length, 3);
  assert.match(calls, /\+table-create.*--name 选剧池.*--fields \[\{"name":"剧ID","type":"text"\}\]/);
  assert.match(calls, /\+table-create.*--name 采集数据.*--fields \[\{"name":"Post ID","type":"text"\}\]/);
  assert.match(calls, /\+table-create.*--name 发布记录.*--fields \[\{"name":"发布ID","type":"text"\}\]/);
});

test("README records the four-table source of truth and immutable runtime paths", async () => {
  const { readme } = await docs();
  for (const term of [
    "账号台账", "发布记录", "选剧池", "采集数据", "SQLite", "latest", "历史", "read-only",
    "Runner only writes", "no Google writeback", "shortdrama.runtime.json", "Node 24+",
    "shortdrama_ops.sqlite", "internal.capability", "com.gengrowth.shortdrama-sync",
    "inbox-pengman/output/short-drama-release-manager/migrations/",
  ]) assert.match(readme, new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.doesNotMatch(readme, /Google Sheets 是唯一录入源/);
});

test("README lists the exact public and internal Runner command surface", async () => {
  const { readme } = await docs();
  for (const command of [
    "doctor --config", "doctor --init-state", "doctor --canary",
    "migrate plan", "migrate apply", "migrate verify", "migrate attest-permissions",
    "account list", "account get", "capture list", "capture get",
    "pool list", "pool get", "pool create", "pool update-field", "pool preview-update", "pool apply-update", "pool preview-archive", "pool apply-archive",
    "pool preview-batch",
    "release list", "release get", "release schedule", "release update-field", "release preview-update", "release preview-batch", "release apply-update", "release attach-post",
    "metrics by-drama", "metrics by-account", "sync start", "sync status",
    "schedule tick", "queue drain", "schedule health",
  ]) assert.match(readme, new RegExp(command.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(readme, /public commands/i);
  assert.match(readme, /internal commands/i);
  assert.match(readme, /payload.*heredoc.*Hermes Skill/i);
});

test("README documents migration gates, async truth, natural schedule acceptance, and recovery", async () => {
  const { readme } = await docs();
  for (const term of [
    "migrate plan", "只读", "digest", "schema receipt", "replan_reconfirm", "privileged", "动作时确认",
    "queued", "already_running", "worker_wakeup_failed", "started", "manual_repair", "原始请求会话",
    "08:00", "10:00", "自然调度", "连续七天", "不能", "单写者", "回滚",
    "expected-base-token", "canary receipt", "permission attestation", "四张空表", "create_four_empty_tables_and_bind_ids",
    "base_not_empty", "独立 macOS Terminal", "schema drift", "observations", "semantic_sha256", "file_sha256",
    "direct Hermes gateway", "fixed production runtime config", "SHORTDRAMA_PAYLOAD",
  ]) assert.match(readme, new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
  assert.match(readme, /不做物理删除/);
  assert.match(readme, /canary-only/);
});

test("README documents the accounts-prefix data resume as an exact fail-closed prefix proof", async () => {
  const { readme } = await docs();
  for (const term of [
    "--resume-partial-data accounts-prefix", "resume_prefix_mismatch", "零写入",
    "不删除", "选剧池 / 采集数据 / 发布记录", "migrate verify", "结构性零写入",
  ]) assert.match(readme, new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.doesNotMatch(readme, /--resume-partial-data\s+(?!accounts-prefix)/);
});

test("README states that Base datetime cells only store Shanghai second precision", async () => {
  const { readme } = await docs();
  for (const term of ["秒级", "亚秒", "指标同步时间", "采集时间"]) {
    assert.match(readme, new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("env example exposes blank v5 keys and keeps legacy follower sync explicitly historical", async () => {
  const { env } = await docs();
  const keys = [
    "FEISHU_APP_ID", "FEISHU_APP_SECRET", "FEISHU_SHORTDRAMA_APP_TOKEN",
    "FEISHU_SHORTDRAMA_ACCOUNTS_TABLE_ID", "FEISHU_SHORTDRAMA_POOL_TABLE_ID",
    "FEISHU_SHORTDRAMA_CAPTURES_TABLE_ID", "FEISHU_SHORTDRAMA_RELEASES_TABLE_ID",
    "GOOGLE_SERVICE_ACCOUNT_JSON", "SHORTDRAMA_OPERATOR_IDS", "SHORTDRAMA_PRIVILEGED_IDS",
    "SHORTDRAMA_NOTIFICATION_CHAT_IDS", "SHORTDRAMA_OPS_CHAT_ID",
  ];
  for (const key of keys) assert.match(env, new RegExp(`^${key}=$`, "m"));
  assert.match(env, /v5 Runner/);
  assert.match(env, /historical.*follower sync/i);
  assert.match(env, /Non-sensitive legacy flags may retain documented defaults/);
  assert.doesNotMatch(env, /^FEISHU_(?:WIKI_NODE_TOKEN|TABLE_ID)=.+$/m);
  assert.doesNotMatch(env, /^GOOGLE_SERVICE_ACCOUNT_JSON=.+$/m);
  assert.doesNotMatch(env, /\/Users\/|~\/\.config/);
});

test("runtime example points to the ignored local env file without embedding secrets", async () => {
  const { config: raw, readme } = await docs();
  const config = JSON.parse(raw);
  assert.equal(config.paths.env_file, "../tiktok-public-capture/.env");
  assert.match(readme, /paths\.env_file/);
  assert.match(readme, /O_NOFOLLOW/);
  assert.match(readme, /不.*source\/eval\/expand/);
  assert.doesNotMatch(raw, /tenant_access_token|app-secret-must-not-be-logged/);
});
