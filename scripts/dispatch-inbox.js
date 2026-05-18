#!/usr/bin/env node

/**
 * inbox 入口校验 + 通知脚本
 *
 * 触发: GitHub Actions (.github/workflows/dispatch.yml) 在 inbox/ 有变化时调用。
 *
 * 设计原则:
 *   1. inbox/ 是个人工作台 (per inbox/README.md), 默认不搬运文件 — 草稿留在 inbox 即可。
 *   2. 只有当作者显式声明 status=ready_for_review / ready_to_move / archived 时, 才走对应流程。
 *   3. 失败时必须开 GitHub Issue, 这样 Letty 在 Obsidian/GitHub Mobile 也能看见, 而不是只有一个红 X。
 *
 * status 语义:
 *   draft (或无 frontmatter)  -> 留在 inbox/, 仅做基础卫生检查 (拒绝 Untitled.md / 空文件)
 *   ready_for_review          -> 必须 5 必填字段 + target, 开 PR
 *   ready_to_move             -> 必须 5 必填字段 + target, 直接搬运
 *   archived                  -> 自动搬到 inbox/09-archive/
 *
 * 环境变量:
 *   CHANGED_FILES      换行分隔的变更文件列表 (由 Action 提供)
 *   GITHUB_TOKEN       GitHub 自动提供的 token
 *   BASE_BRANCH        默认 main
 *   DRY_RUN            "1" = 不写文件/不提交/不开 issue, 仅打印
 *   GITHUB_STEP_SUMMARY  GitHub Actions 写步骤摘要的目标文件 (Actions 自动设置)
 *   GITHUB_REPOSITORY  owner/repo
 *   ISSUE_NOTIFY_USERS 用逗号分隔的 GitHub username, 失败 issue 会 @ 这些人
 */

"use strict";

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

// ---- 配置 ----

const BASE_BRANCH = process.env.BASE_BRANCH || "main";
const GH_TOKEN = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
const RUN_ID = process.env.GITHUB_RUN_ID || String(Date.now());
const RUN_ATTEMPT = process.env.GITHUB_RUN_ATTEMPT || "1";
const DRY_RUN = process.env.DRY_RUN === "1";
const STEP_SUMMARY = process.env.GITHUB_STEP_SUMMARY;
const ISSUE_NOTIFY = (process.env.ISSUE_NOTIFY_USERS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// 真实存在的可写目录.
// 所有 wiki-sync 白名单目录 (docs/03-marketing, ✍️ 内容资产, task-collab 等) 都是 rsync --delete 单向覆盖,
// dispatch 绝对不能往里搬运 (修改会被下次 sync 抹掉)。
// 真正可写的只有 onboarding/ 和 templates/ (运营工作区, 非 wiki 同步)。
const ALLOWED_TARGETS = ["onboarding/", "templates/"];

// inbox 自动归档专用 target (status=archived 时强制使用此目录)
const ARCHIVE_TARGET = "inbox/09-archive/";

// status 语义映射: 把现实中 Letty 已经在用的值映射到 4 个标准动作。
// 标准动作: keep (留 inbox)、review (开 PR)、move (直推)、archive (归档)
const STATUS_ACTIONS = {
  // 留在 inbox, 不动
  draft: "keep",
  active: "keep",
  final: "keep", // 已完成但留在工作台自查
  "in-progress": "keep",
  // 开 PR
  ready_for_review: "review",
  review: "review",
  // 直接搬运
  ready_to_move: "move",
  // 归档
  archived: "archive",
  archive: "archive",
};

// 这些 inbox 内文件 / 目录不参与校验
const IGNORE_EXACT = new Set(["inbox/README.md", "inbox/.gitkeep"]);
const IGNORE_PREFIXES = [
  "inbox/09-archive/", // 归档区不再处理
  "inbox/原文件夹暂存/", // 历史归集区
];

// inbox/README.md 强制要求的 5 必填字段
const REQUIRED_FIELDS = ["project", "type", "status", "owner", "updated"];

// 拒绝的占位文件名 (Obsidian/Templater 未填模板)
const PLACEHOLDER_NAMES = [
  /^untitled(\s*\d+)?\.md$/i,
  /^未命名(\s*\d+)?\.md$/,
  /^新建笔记(\s*\d+)?\.md$/,
  /^new\s*note(\s*\d+)?\.md$/i,
];

// 最小正文长度 (去掉 frontmatter 后), 用来识别空模板
const MIN_BODY_CHARS = 20;

// ---- 工具函数 ----

function log(msg) {
  console.log(`[dispatch] ${msg}`);
}

function ghAnnotation(level, file, line, message) {
  // GitHub Actions 在 PR / Action UI 上把这些渲染成内联红色标注
  const loc = line ? `file=${file},line=${line}` : `file=${file}`;
  console.log(`::${level} ${loc}::${message}`);
}

function summaryAppend(text) {
  if (!STEP_SUMMARY) return;
  try {
    fs.appendFileSync(STEP_SUMMARY, text + "\n");
  } catch (e) {
    log(`无法写 step summary: ${e.message}`);
  }
}

function git(...args) {
  return execFileSync("git", args, { stdio: "pipe", encoding: "utf8" }).trim();
}

function gh(...args) {
  return execFileSync("gh", args, { stdio: "pipe", encoding: "utf8" }).trim();
}

function normalizeDir(p) {
  if (!p) return "";
  let v = String(p).trim().replace(/\\/g, "/");
  if (v.startsWith("./")) v = v.slice(2);
  if (!v.endsWith("/")) v += "/";
  return v;
}

function stripBom(s) {
  return s.charCodeAt(0) === 0xfeff ? s.slice(1) : s;
}

/**
 * 解析 frontmatter (line-based YAML, 不支持嵌套/列表)
 * 返回 { frontmatter: {...}, body: "...", hasFrontmatter: bool }
 */
function parseFile(content) {
  const text = stripBom(content);
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) {
    return { frontmatter: {}, body: text.trim(), hasFrontmatter: false };
  }

  const fm = {};
  for (const line of match[1].split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf(":");
    if (idx <= 0) continue;
    const key = trimmed.slice(0, idx).trim();
    let val = trimmed.slice(idx + 1).trim();
    // 去掉 inline 注释 (粗略: 字符串里有 # 的极少, 不处理)
    const commentIdx = val.indexOf(" #");
    if (commentIdx > 0) val = val.slice(0, commentIdx).trim();
    val = val.replace(/^["']|["']$/g, "");
    fm[key] = val;
  }

  const body = text.slice(match[0].length).trim();
  return { frontmatter: fm, body, hasFrontmatter: true };
}

function isPlaceholderName(filename) {
  return PLACEHOLDER_NAMES.some((re) => re.test(filename));
}

function shouldIgnore(file) {
  if (IGNORE_EXACT.has(file)) return true;
  return IGNORE_PREFIXES.some((p) => file.startsWith(p));
}

// ---- 启动时配置校验 (Codex 建议: bad config 不该是 production 行为) ----

function validateConfig() {
  const errors = [];
  for (const t of ALLOWED_TARGETS) {
    if (!fs.existsSync(t)) {
      errors.push(
        `ALLOWED_TARGETS 配置错误: 目录 "${t}" 不存在于 repo, 请修正 scripts/dispatch-inbox.js`,
      );
    }
  }
  if (errors.length > 0) {
    for (const e of errors) log(`❌ ${e}`);
    process.exit(2);
  }
}

// ---- 单文件校验 ----

function validateFile(file) {
  const errors = [];
  const warnings = [];

  // 1. 必须是文件 (避免目录路径进来)
  let stat;
  try {
    stat = fs.statSync(file);
  } catch (e) {
    errors.push(`无法读取: ${e.message}`);
    return { errors, warnings };
  }
  if (!stat.isFile()) {
    return { errors: [], warnings: [`${file} 不是文件, 跳过`] };
  }

  // 2. 文件名占位拒绝 (无论 status 都拦)
  const base = path.basename(file);
  if (isPlaceholderName(base)) {
    errors.push(
      `占位文件名不允许: "${base}". 请按 YYYY-MM-DD-主题.md 命名后再提交。`,
    );
    return { errors, warnings };
  }

  // 3. 扩展名: 只处理 .md, 其他放过 (Obsidian 的 .canvas/.base 等以及附件)
  if (path.extname(file).toLowerCase() !== ".md") {
    return { errors: [], warnings: [`${file}: 非 .md 文件, 跳过校验`] };
  }

  // 4. 读文件
  const content = fs.readFileSync(file, "utf8");
  const { frontmatter, body, hasFrontmatter } = parseFile(content);

  // 5. 空文件 / 模板拒绝
  if (body.length < MIN_BODY_CHARS) {
    errors.push(
      `正文不足 ${MIN_BODY_CHARS} 字符 (当前 ${body.length}), 看起来是空模板。`,
    );
    return { errors, warnings };
  }

  // 6. 无 frontmatter -> 视作 draft, 但提示作者
  if (!hasFrontmatter) {
    warnings.push(
      `${file}: 无 frontmatter, 视作 draft 保留。建议补全 ${REQUIRED_FIELDS.join("/")} 字段。`,
    );
    return { errors, warnings, action: "leave-as-draft" };
  }

  // 7. status 字段校验 (空 status 当 draft)
  const rawStatus = (frontmatter.status || "draft").toLowerCase();
  const action = STATUS_ACTIONS[rawStatus];
  if (!action) {
    errors.push(
      `status "${frontmatter.status}" 无效。允许: ${Object.keys(STATUS_ACTIONS).join(" / ")}`,
    );
    return { errors, warnings };
  }

  // 8. keep -> 不动它, 也不强制 5 字段 (允许渐进采用)
  if (action === "keep") {
    return { errors, warnings, action: "leave-as-draft" };
  }

  // 9. 非 keep: 必须有 5 必填字段
  for (const key of REQUIRED_FIELDS) {
    if (!frontmatter[key])
      errors.push(`缺少必填字段 "${key}" (status=${rawStatus} 要求)`);
  }
  if (errors.length > 0) return { errors, warnings };

  // 10. archive: 如果已经在 ARCHIVE_TARGET 下, idempotent 放过
  if (action === "archive") {
    if (file.startsWith(ARCHIVE_TARGET)) {
      return { errors, warnings, action: "leave-as-draft" };
    }
    const dest = path.join(ARCHIVE_TARGET, base);
    if (fs.existsSync(dest)) {
      errors.push(`归档目标 ${dest} 已存在同名文件, 请改名。`);
      return { errors, warnings };
    }
    return { errors, warnings, action: "move", dest, review: "none" };
  }

  // 11. review / move: 需要 target
  const target = frontmatter.target ? normalizeDir(frontmatter.target) : "";
  if (!target) {
    errors.push(
      `status=${rawStatus} 需要 target 字段。允许: ${ALLOWED_TARGETS.join(", ")}`,
    );
    return { errors, warnings };
  }
  if (!ALLOWED_TARGETS.includes(target)) {
    errors.push(
      `target "${target}" 不在白名单。允许: ${ALLOWED_TARGETS.join(", ")} ` +
        `(注意: docs/ 是 wiki 单向同步只读, 不能直推)`,
    );
    return { errors, warnings };
  }

  // 如果文件已经在 target 目录, idempotent 放过
  if (file.startsWith(target)) {
    return { errors, warnings, action: "leave-as-draft" };
  }

  const dest = path.join(target, base);
  if (fs.existsSync(dest)) {
    errors.push(`目标 ${dest} 已有同名文件, 请改名。`);
    return { errors, warnings };
  }

  const review = action === "review" ? "required" : "none";
  return { errors, warnings, action: "move", dest, review };
}

// ---- 通知 ----

function createIssueOnFailure(report) {
  if (DRY_RUN) {
    log("DRY_RUN: 跳过开 issue");
    return;
  }
  if (!GH_TOKEN) {
    log("无 GH_TOKEN, 跳过开 issue");
    return;
  }
  const repo = process.env.GITHUB_REPOSITORY;
  if (!repo) {
    log("无 GITHUB_REPOSITORY, 跳过开 issue");
    return;
  }

  const mentions = ISSUE_NOTIFY.length
    ? ISSUE_NOTIFY.map((u) => `@${u}`).join(" ")
    : "";
  const title = `[inbox 校验失败] ${new Date().toISOString().slice(0, 10)} (run ${RUN_ID})`;
  const body = [
    mentions,
    "",
    "inbox 自动校验脚本发现以下问题。提交者请在 Obsidian 里修复后重新按 F5 提交。",
    "",
    "## 问题清单",
    "",
    report,
    "",
    "## 怎么修",
    "",
    "- `Untitled.md` 或空模板: 删掉, 或填内容后改名为 `YYYY-MM-DD-主题.md`",
    "- 缺 frontmatter: 用 `templates/` 里的模板新建, 或手动加 `project/type/status/owner/updated`",
    "- status: `draft` (草稿不动), `ready_for_review` (开 PR), `ready_to_move` (直推), `archived` (归档)",
    "- target 必须是: " + ALLOWED_TARGETS.join(", "),
    "",
    `运行链接: https://github.com/${repo}/actions/runs/${RUN_ID}`,
  ].join("\n");

  try {
    gh(
      "issue",
      "create",
      "--repo",
      repo,
      "--title",
      title,
      "--body",
      body,
      "--label",
      "inbox-validation",
    );
    log("📋 已开 issue 通知作者");
  } catch (e) {
    log(`开 issue 失败: ${e.message}`);
  }
}

// ---- 主流程 ----

function main() {
  // CHANGED_FILES 未设置 vs 设置为空, 必须区分
  if (process.env.CHANGED_FILES === undefined) {
    log("❌ CHANGED_FILES 环境变量未设置, dispatch.yml 可能 broken");
    process.exit(2);
  }

  validateConfig();

  const changed = process.env.CHANGED_FILES.split(/\r?\n/)
    .map((s) => s.trim())
    .filter((f) => f && f.startsWith("inbox/") && !shouldIgnore(f));

  if (changed.length === 0) {
    log("inbox/ 没有需要处理的变化, 跳过。");
    summaryAppend("✅ inbox 校验通过 (无需要处理的文件)");
    return;
  }

  const allErrors = [];
  const allWarnings = [];
  const toMove = [];

  for (const file of changed) {
    if (!fs.existsSync(file)) {
      log(`已删除文件: ${file}, 跳过`);
      continue;
    }
    const result = validateFile(file);
    for (const w of result.warnings) {
      allWarnings.push({ file, message: w });
      ghAnnotation("warning", file, null, w);
    }
    for (const e of result.errors) {
      allErrors.push({ file, message: e });
      ghAnnotation("error", file, null, e);
    }
    if (result.action === "move") {
      toMove.push({ from: file, to: result.dest, review: result.review });
    }
  }

  // 失败路径
  if (allErrors.length > 0) {
    const report = allErrors
      .map((e) => `- **${e.file}**: ${e.message}`)
      .join("\n");
    log("❌ 校验失败:");
    log(report);

    summaryAppend("## ❌ inbox 校验失败\n\n" + report);
    summaryAppend(
      "\n> 已自动开 issue 通知, 请在 Obsidian 里修复后重新提交。\n",
    );

    createIssueOnFailure(report);
    process.exit(1);
  }

  if (allWarnings.length > 0) {
    const report = allWarnings
      .map((w) => `- ${w.file}: ${w.message}`)
      .join("\n");
    summaryAppend("## ⚠️ 警告 (不阻塞)\n\n" + report);
  }

  // 没有需要搬运的, 直接结束
  if (toMove.length === 0) {
    log("✅ 校验通过, 无需搬运 (所有文件 status=draft 或留在 inbox)");
    summaryAppend("\n✅ 校验通过");
    return;
  }

  // ---- 搬运 ----

  if (DRY_RUN) {
    log("DRY_RUN: 跳过实际搬运");
    for (const m of toMove)
      log(`  would move: ${m.from} -> ${m.to} (review=${m.review})`);
    return;
  }

  for (const m of toMove) {
    fs.mkdirSync(path.dirname(m.to), { recursive: true });
    fs.renameSync(m.from, m.to);
    log(`✅ ${m.from} -> ${m.to} (review=${m.review})`);
  }

  // git 操作: 用 execFileSync 而不是 shell 字符串拼接
  git("config", "user.name", "github-actions[bot]");
  git("config", "user.email", "github-actions[bot]@users.noreply.github.com");
  // 只 add 涉及的文件, 不 add -A (避免吞掉无关变更)
  const filesToStage = toMove.flatMap((m) => [m.from, m.to]);
  git("add", "--", ...filesToStage);

  const summary = toMove
    .map((m) => `- ${m.from} -> ${m.to} (${m.review})`)
    .join("\n");
  const commitMsg = `chore(dispatch): 自动分拣 inbox 文件\n\n${summary}`;

  const needPR = toMove.some((m) => m.review === "required");

  if (needPR) {
    const branch = `auto/dispatch-${RUN_ID}-${RUN_ATTEMPT}`;
    git("checkout", "-b", branch);
    git("commit", "-m", commitMsg);
    git("push", "origin", branch);

    const title = `[自动分拣] inbox 文件待审批 (${new Date().toISOString().slice(0, 10)})`;
    const body = `自动分拣结果:\n\n${summary}\n\n> 本 PR 由 dispatch-inbox.js 自动创建。`;

    const prUrl = gh(
      "pr",
      "create",
      "--base",
      BASE_BRANCH,
      "--head",
      branch,
      "--title",
      title,
      "--body",
      body,
    );
    log(`📋 已创建 PR: ${prUrl}`);
    summaryAppend(`\n📋 PR: ${prUrl}`);
  } else {
    git("commit", "-m", commitMsg);
    // 直推 main 前先 pull --rebase, 避免 non-fast-forward
    try {
      git("pull", "--rebase", "origin", BASE_BRANCH);
    } catch (e) {
      log(`pull --rebase 失败: ${e.message}, 仍尝试 push`);
    }
    git("push", "origin", BASE_BRANCH);
    log("📦 已直接推送到 " + BASE_BRANCH);
    summaryAppend(`\n📦 已直推 ${BASE_BRANCH}`);
  }
}

try {
  main();
} catch (err) {
  log(`❌ ERROR: ${err.message}`);
  if (err.stack) console.error(err.stack);
  process.exit(1);
}
