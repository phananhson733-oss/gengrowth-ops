#!/usr/bin/env node

/**
 * brand-wrap: inbox 文件「品牌规范化」后处理脚本
 *
 * Letty 用任何 AI 工具 (Gemini/Claude/ChatGPT) 生成内容粘到 inbox 之后, 跑这个脚本:
 *   1. 补全 frontmatter (project/type/status/owner/updated) — type 从 inbox 子目录推断
 *   2. 文件名规范化为 YYYY-MM-DD-slug.md (slug 来自 H1 标题, 中英文都支持)
 *   3. 扫描 AI 标志词警告 (SEO 降权风险)
 *   4. 末尾追加品牌 CTA (如果文章里还没引用 astrologywiki.com)
 *
 * 默认是预览模式 (不改文件), 加 --apply 才真正写入。
 *
 * 用法:
 *   node scripts/brand-wrap.js <file.md>             预览单个文件
 *   node scripts/brand-wrap.js <file.md> --apply     应用规范化
 *   node scripts/brand-wrap.js --scan inbox/         扫描 inbox 列出待规范化文件
 *   node scripts/brand-wrap.js --scan inbox/ --apply 扫描 + 批量应用
 */

"use strict";

const fs = require("fs");
const path = require("path");

// ---- 配置 ----

// 默认作者 (可被 frontmatter 已有值覆盖)
const DEFAULT_OWNER = "Letty";
const DEFAULT_PROJECT = "astrologywiki";

// 从 inbox 子目录推断 type (顺序敏感, 更具体的在前)
const TYPE_BY_PATH = [
  ["inbox/08-reports-and-feedback/01-product-feedback", "product-feedback"],
  ["inbox/08-reports-and-feedback/02-standard-feedback", "standard-feedback"],
  ["inbox/08-reports-and-feedback/03-weekly-reports", "weekly-report"],
  ["inbox/01-keyword-research", "keyword-research"],
  ["inbox/03-content-briefs", "content-brief"],
  ["inbox/04-production", "blog-draft"],
  ["inbox/06-review-audit", "audit-report"],
  ["inbox/09-archive", "archive"],
];

// AI 高频痕迹词 (命中 >= AI_THRESHOLD 警告)
// 引自 Garry 的 ai-words 黑名单 + 通用 SEO AI 词
const AI_TELL_WORDS = [
  "delve",
  "crucial",
  "robust",
  "comprehensive",
  "nuanced",
  "multifaceted",
  "furthermore",
  "moreover",
  "additionally",
  "pivotal",
  "landscape",
  "tapestry",
  "underscore",
  "foster",
  "showcase",
  "intricate",
  "vibrant",
  "fundamental",
  "significant",
  "navigate",
  "embrace",
  "leverage",
  "utilize",
  "harness",
  "elevate",
  "unlock",
  "unveil",
  "paradigm",
  "ecosystem",
  "synergy",
];
const AI_THRESHOLD = 3;

// 品牌 CTA (固定文本, 文件末尾追加; 已包含品牌内链)
const BRAND_CTA = `> 想深入了解占星知识？查阅完整数据库 → [AstrologyWiki](https://www.astrologywiki.com/zh/wiki)`;

// 忽略不处理的文件
const IGNORE_NAMES = new Set(["README.md", ".gitkeep"]);

// ---- 工具函数 ----

function stripBom(s) {
  return s.charCodeAt(0) === 0xfeff ? s.slice(1) : s;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function inferType(filepath) {
  const norm = filepath.replace(/\\/g, "/");
  for (const [prefix, type] of TYPE_BY_PATH) {
    if (norm.includes(prefix + "/")) return type;
  }
  return "note";
}

/**
 * slugify: 保留中文 + 字母数字, 空格/标点转 -, 最长 60 字符
 */
function slugify(text) {
  if (!text) return "untitled";
  let s = text
    .toLowerCase()
    .replace(
      /[`*_\[\]()#!?,.;:'"!?。，；：、！？「」『』《》〈〉【】（）—…]/g,
      "",
    )
    .replace(/[\s\-_]+/g, "-")
    .replace(/^-+|-+$/g, "");
  // 限制长度 (UTF-8 字符级别)
  if ([...s].length > 60) s = [...s].slice(0, 60).join("");
  return s || "untitled";
}

function parseFrontmatter(content) {
  const text = stripBom(content);
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { fm: {}, body: text.replace(/^\s+/, ""), hasFm: false };

  const fm = {};
  for (const line of m[1].split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf(":");
    if (idx <= 0) continue;
    const k = trimmed.slice(0, idx).trim();
    let v = trimmed.slice(idx + 1).trim();
    v = v.replace(/^["']|["']$/g, "");
    fm[k] = v;
  }
  return { fm, body: text.slice(m[0].length).replace(/^\s+/, ""), hasFm: true };
}

function buildFrontmatter(fm) {
  // 保持字段顺序: project, type, status, owner, updated, 其他
  const order = ["project", "type", "status", "owner", "updated"];
  const seen = new Set();
  const lines = ["---"];
  for (const k of order) {
    if (fm[k] !== undefined && fm[k] !== "") {
      lines.push(`${k}: ${fm[k]}`);
      seen.add(k);
    }
  }
  for (const [k, v] of Object.entries(fm)) {
    if (seen.has(k) || v === undefined || v === "") continue;
    lines.push(`${k}: ${v}`);
  }
  lines.push("---");
  return lines.join("\n");
}

// ---- 核心处理: 单文件 ----

function processFile(filepath) {
  const stat = fs.statSync(filepath);
  if (!stat.isFile() || path.extname(filepath).toLowerCase() !== ".md") {
    return null;
  }
  if (IGNORE_NAMES.has(path.basename(filepath))) return null;

  const content = fs.readFileSync(filepath, "utf8");
  const { fm, body, hasFm } = parseFrontmatter(content);

  const changes = [];
  const newFm = { ...fm };

  // 1. 补 frontmatter
  if (!newFm.project) {
    newFm.project = DEFAULT_PROJECT;
    changes.push(`补 project: ${DEFAULT_PROJECT}`);
  }
  if (!newFm.type) {
    const t = inferType(filepath);
    newFm.type = t;
    changes.push(`补 type: ${t} (从路径推断)`);
  }
  if (!newFm.status) {
    newFm.status = "draft";
    changes.push("补 status: draft");
  }
  if (!newFm.owner) {
    newFm.owner = DEFAULT_OWNER;
    changes.push(`补 owner: ${DEFAULT_OWNER}`);
  }
  if (!newFm.updated) {
    newFm.updated = todayISO();
    changes.push(`补 updated: ${todayISO()}`);
  }

  // 2. 文件名规范化: 只加日期前缀, 保留原 basename (短且自描述)
  const base = path.basename(filepath);
  const dir = path.dirname(filepath);
  let newBase = base;
  if (!/^\d{4}-\d{2}-\d{2}-/.test(base)) {
    const stem = path.basename(base, ".md");
    const slug = slugify(stem) || "untitled";
    newBase = `${todayISO()}-${slug}.md`;
    if (newBase !== base) {
      changes.push(`重命名: ${base} → ${newBase}`);
    }
  }
  const newPath = path.join(dir, newBase);

  // 3. AI 标志词扫描
  // AI 警告是 advisory, 不算实质改动 (不触发 needsWrite)
  const advisories = [];
  const bodyLower = body.toLowerCase();
  const hits = AI_TELL_WORDS.filter((w) => {
    // 用单词边界, 避免 "navigate" 误中 "navigation"
    return new RegExp(`\\b${w}\\b`, "i").test(bodyLower);
  });
  const aiWarning = hits.length >= AI_THRESHOLD;
  if (aiWarning) {
    advisories.push(
      `⚠️  检测到 ${hits.length} 个 AI 标志词: ${hits.slice(0, 6).join(", ")}${hits.length > 6 ? "..." : ""}`,
    );
    advisories.push(`   建议人工改写后再标 ready_for_review (SEO 降权风险)`);
  }

  // 4. 品牌 CTA: 只给 blog-draft 类型追加 (关键词调研/简报/反馈等不需要)
  let newBody = body.replace(/\s+$/, "");
  if (newFm.type === "blog-draft") {
    const hasCta = /astrologywiki\.com|AstrologyWiki/i.test(newBody);
    if (!hasCta) {
      newBody += "\n\n" + BRAND_CTA;
      changes.push("追加品牌 CTA (blog 类型)");
    }
  }

  const newContent = buildFrontmatter(newFm) + "\n\n" + newBody + "\n";

  return {
    filepath,
    newPath,
    hasFm,
    aiWarning,
    changes,
    advisories,
    newContent,
    needsWrite: changes.length > 0,
    newFm,
  };
}

// ---- CLI ----

function printResult(r, verbose = true) {
  console.log(`\n📄 ${r.filepath}`);
  if (r.newPath !== r.filepath) {
    console.log(`   → ${r.newPath}`);
  }
  if (r.changes.length === 0) {
    console.log("   ✅ 已规范, 无需改动");
    return;
  }
  for (const c of r.changes) {
    console.log(`   • ${c}`);
  }
  if (verbose) {
    console.log("\n   新 frontmatter:");
    console.log(
      buildFrontmatter(r.newFm)
        .split("\n")
        .map((l) => "     " + l)
        .join("\n"),
    );
  }
}

function applyResult(r) {
  fs.writeFileSync(r.newPath, r.newContent);
  if (r.newPath !== r.filepath) {
    fs.unlinkSync(r.filepath);
  }
  console.log(`   ✅ 已写入 ${r.newPath}`);
}

function scanDir(dir) {
  const out = [];
  function walk(d) {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "原文件夹暂存" || entry.name === "09-archive")
          continue;
        walk(p);
      } else if (entry.isFile() && p.endsWith(".md")) {
        out.push(p);
      }
    }
  }
  walk(dir);
  return out;
}

function main() {
  const args = process.argv.slice(2);
  const apply = args.includes("--apply");
  const scan = args.includes("--scan");
  const target = args.find((a) => !a.startsWith("--"));

  if (!target) {
    console.error(
      "用法: node scripts/brand-wrap.js <file.md | --scan dir/> [--apply]",
    );
    process.exit(1);
  }

  let files;
  if (scan) {
    if (!fs.existsSync(target) || !fs.statSync(target).isDirectory()) {
      console.error(`扫描目标必须是目录: ${target}`);
      process.exit(1);
    }
    files = scanDir(target);
  } else {
    if (!fs.existsSync(target)) {
      console.error(`文件不存在: ${target}`);
      process.exit(1);
    }
    files = [target];
  }

  const results = [];
  let needsWriteCount = 0;
  let aiWarningCount = 0;

  for (const f of files) {
    const r = processFile(f);
    if (!r) continue;
    results.push(r);
    if (r.needsWrite) needsWriteCount++;
    if (r.aiWarning) aiWarningCount++;
  }

  if (scan) {
    // 扫描模式: 只列出需要改的, 不打详细
    for (const r of results.filter((x) => x.needsWrite)) {
      printResult(r, false);
    }
    console.log(
      `\n=== 扫描结果: ${files.length} 个 .md 文件, ${needsWriteCount} 个需要规范化, ${aiWarningCount} 个 AI 标志词预警 ===`,
    );
  } else {
    for (const r of results) printResult(r, true);
  }

  if (!apply) {
    if (needsWriteCount > 0) {
      console.log(
        `\n👉 加 --apply 真正应用 (${needsWriteCount} 个文件会被改写)`,
      );
    }
    return;
  }

  // 应用
  console.log("\n--- 应用 ---");
  for (const r of results.filter((x) => x.needsWrite)) {
    applyResult(r);
  }
}

try {
  main();
} catch (err) {
  console.error(`❌ ERROR: ${err.message}`);
  process.exit(1);
}
