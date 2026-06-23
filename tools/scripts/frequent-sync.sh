#!/usr/bin/env bash
# 高频同步：提交 / pull --rebase / push 本机 GenGrowth Obsidian vaults，
# 再把 sibling repo 的协作目录镜像进 wiki/docs/repo。
#
# 多电脑使用方式：每台机器从 gengrowth-wiki 拉取本脚本后，通过 launchd
# 或本机定时器调用即可。路径默认从脚本位置和 $HOME 自动推断，也可用环境变量覆盖：
#   GENGROWTH_WIKI=/path/to/gengrowth-wiki
#   GENGROWTH_OPS=/path/to/gengrowth-ops
#   GENGROWTH_AGENTS=/path/to/gengrowth-agents

set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/_repo-discovery.sh"

WIKI="${GENGROWTH_WIKI:-$(cd "$SCRIPT_DIR/../.." && pwd)}"
OPS_REPO="${GENGROWTH_OPS:-$(gengrowth_find_repo gengrowth-ops)}"
AGENTS_REPO="${GENGROWTH_AGENTS:-$(gengrowth_find_repo gengrowth-agents)}"
LOG="${GENGROWTH_FREQUENT_SYNC_LOG:-$HOME/Library/Logs/gengrowth-frequent-sync.log}"
PYTHON="${PYTHON:-python3}"
VAULT_SYNC="$SCRIPT_DIR/obsidian-vault-git-sync.py"

mkdir -p "$(dirname "$LOG")"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG"; }

# 日志轮转：超过 2000 行时只保留最后 1000 行
if [ "$(wc -l < "$LOG" 2>/dev/null || echo 0)" -gt 2000 ]; then
  tail -1000 "$LOG" > "${LOG}.tmp" && mv "${LOG}.tmp" "$LOG"
fi

log "--- frequent sync start ---"

# 核心 4 步同步逻辑抽到 _sync-core.sh，与 gengrowth-repos-sync.sh 共用，避免漂移
source "$SCRIPT_DIR/_sync-core.sh"
gengrowth_sync_core || exit 1

log "--- done ---"
