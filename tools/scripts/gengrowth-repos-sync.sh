#!/usr/bin/env bash
# Daily pull + doc sync for all gengrowth repos.
#
# 路径默认从脚本位置和 $HOME 自动推断，也可用环境变量覆盖：
#   GENGROWTH_WIKI=/path/to/gengrowth-wiki
#   GENGROWTH_OPS=/path/to/gengrowth-ops
#   GENGROWTH_AGENTS=/path/to/gengrowth-agents

set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/_repo-discovery.sh"

WIKI="${GENGROWTH_WIKI:-$(cd "$SCRIPT_DIR/../.." && pwd)}"
OPS_REPO="${GENGROWTH_OPS:-$(gengrowth_find_repo gengrowth-ops)}"
AGENTS_REPO="${GENGROWTH_AGENTS:-$(gengrowth_find_repo gengrowth-agents)}"
LOG="${GENGROWTH_REPOS_SYNC_LOG:-$HOME/Library/Logs/gengrowth-repos-sync.log}"
DOC_LOG="${GENGROWTH_DOC_HEALTH_LOG:-$HOME/Library/Logs/gengrowth-doc-health.log}"
PYTHON="${PYTHON:-python3}"
VAULT_SYNC="$SCRIPT_DIR/obsidian-vault-git-sync.py"

mkdir -p "$(dirname "$LOG")" "$(dirname "$DOC_LOG")"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG"; }

echo "" >> "$LOG"
echo "========================================" >> "$LOG"
log "Sync started"

# 核心 4 步同步逻辑抽到 _sync-core.sh，与 frequent-sync.sh 共用，避免漂移
source "$SCRIPT_DIR/_sync-core.sh"
gengrowth_sync_core || exit 1

log "All syncs complete."

# ── 文档健康检查（轻量 shell 扫描）────────────────────────
echo "" >> "$DOC_LOG"
echo "========================================" >> "$DOC_LOG"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Doc health check" >> "$DOC_LOG"

# 1. 根目录临时文件（Untitled / test / 未命名）
find "$WIKI" -maxdepth 2 -name "*.md" \
  \( -iname "untitled*" -o -iname "test*" -o -name "未命名*" \) \
  ! -path "*/node_modules/*" >> "$DOC_LOG" 2>&1

# 2. docs/ 下缺少日期前缀的非 README 文件
find "$WIKI/docs" -name "*.md" \
  ! -name "README.md" ! -name "_DIR.md" \
  ! -path "*/records/*" ! -path "*/node_modules/*" \
  | grep -v '/[0-9]\{4\}-[0-9]\{2\}-[0-9]\{2\}-' >> "$DOC_LOG" 2>&1

# 3. 工作台中存在超过 7 天的文件（可能已成型，该迁移）
find "$WIKI/工作台" -name "*.md" -mtime +7 2>/dev/null >> "$DOC_LOG"

log "Doc check done. Review: $DOC_LOG"

# ── 每周一：文档审计提醒 ───────────────────────────────────
DOW=$(date +%u)  # 1=周一 … 7=周日
if [ "$DOW" = "1" ]; then
  log "[audit-reminder] 周一检查..."
  "$PYTHON" "$WIKI/tools/scripts/audit-reminder.py" >> "$LOG" 2>&1
fi
