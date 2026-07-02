#!/usr/bin/env bash
# weekly-notes-digest.sh
# 每周一次，无头跑 claude 消化本地 Obsidian vault 的 Notes/Clippings。
# 由 crontab 调用（见文件底部注释）。结果由 obsidian-git 插件自动备份，本脚本不做 git 操作。
#
# 改频次 -> 改 crontab（crontab -e）
# 改模型 -> 改下方 MODEL 变量
# 看运行日志 -> ~/Library/Logs/wiki-notes-digest/

set -euo pipefail

# --- cron 环境最小化，显式补齐 PATH / HOME ---
if [ -z "${HOME:-}" ]; then
  export HOME="$(cd ~ && pwd)"
else
  export HOME
fi
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$HOME/.npm-global/bin:$HOME/.local/bin:$PATH"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="${GENGROWTH_WIKI:-$(cd "$SCRIPT_DIR/../.." && pwd)}"
MODEL="${GENGROWTH_WEEKLY_NOTES_MODEL:-opus}"   # 质量优先；要省成本改成 sonnet
LOG_DIR="$HOME/Library/Logs/wiki-notes-digest"
mkdir -p "$LOG_DIR"
STAMP="$(date +%Y-%m-%d_%H%M%S)"
LOG="$LOG_DIR/$STAMP.log"

cd "$REPO"

read -r -d '' PROMPT <<'EOF' || true
你是 wzb 个人知识库（Obsidian vault）的每周 Notes 消化助手。这是无人值守的定时任务，不能反问，请直接执行。

先读 wzb-obsidian/LLM-Wiki/CLAUDE.md 和 wzb-obsidian/CLAUDE.md，严格按其中的「整理/消化」工作流和「防重复机制」执行。

本周任务（消化 Notes/Clippings）：
1. 递归扫描 wzb-obsidian/LLM-Wiki/Notes/Clippings/ 及其【所有子目录】——剪藏既在顶层、也大量分布在按来源域名分的子文件夹里（如 x.com/、github.com/、mp.weixin.qq.com/ 等），务必用 `find Notes/Clippings -name '*.md'` 这类递归方式，不要只看顶层。找出 frontmatter 既没有 ingested: 也没有 triaged: 的剪藏（=本周待处理项）。先报一个数：未标记总数（顶层 + 各子目录分别多少）。
2. 不设篇数上限——把本周所有未标记剪藏全部处理完，一篇不留（除非确实拿不准，按第 5 步标 deferred）。
3. 按目标知识页分桶，每篇决定：消化进哪个 Knowledge/Tech/Life/Writing 页，或评估后 skip。
4. 并入知识页前必须完整读该页去重，只并入真正新增的点，绝不整段粘贴原文；遵守 LLM-Wiki/CLAUDE.md 的内容输出风格（说人话、先说结论、Obsidian 排版、相关阅读链接、文件名首字母前缀）。
5. 写完内容立刻给来源剪藏打标记，一篇都不能漏：
   - 消化的 → 加 ingested: <今天日期> 和 ingested_into: 列表
   - 评估不消化的 → 加 triaged: <今天日期> 和 triage_result: 理由
   - 拿不准归类的 → triaged: deferred + triage_result: "deferred — 待人工复核"，绝不乱并入
6. 在 wzb-obsidian/LLM-Wiki/log.md 追加本周批次记录（处理篇数、目标页、关键去重/修正、剩余未标记数）。
7. 不要执行任何 git 命令（git add / commit / push 都不要）——本仓库有 obsidian-git 插件自动备份。你只管写文件。

完成后用 2-3 句话总结本周做了什么。
EOF

echo "=== weekly-notes-digest start $STAMP (model=$MODEL) ===" | tee -a "$LOG"
claude -p "$PROMPT" \
  --model "$MODEL" \
  --dangerously-skip-permissions \
  >> "$LOG" 2>&1

echo "=== done $(date +%Y-%m-%d_%H%M%S) (exit $?) ===" | tee -a "$LOG"

# --- 安装方法（一次性，见 README 路由）---
# crontab 行（每周一 09:07 本地时间）：
#   7 9 * * 1 /path/to/gengrowth-wiki/tools/scripts/weekly-notes-digest.sh
