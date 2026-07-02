#!/usr/bin/env bash
# Daily git pull + doc sync for gengrowth-agents.
#
# 路径默认从当前脚本位置和常见 sibling 目录自动推断，也可用环境变量覆盖：
#   GENGROWTH_WIKI=/path/to/gengrowth-wiki
#   GENGROWTH_AGENTS=/path/to/gengrowth-agents

set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WIKI="${GENGROWTH_WIKI:-$(cd "$SCRIPT_DIR/../.." && pwd)}"
LOG="${GENGROWTH_AGENTS_PULL_LOG:-$HOME/Library/Logs/gengrowth-agents-pull.log}"

detect_repo() {  # $1=env 值（可空），其余=候选路径；返回首个含 .git 的
  local envval="$1"
  shift
  if [ -n "$envval" ] && [ -d "$envval/.git" ]; then
    echo "$envval"
    return 0
  fi
  local c
  for c in "$@"; do
    if [ -d "$c/.git" ]; then
      echo "$c"
      return 0
    fi
  done
  return 1
}

REPO="$(detect_repo "${GENGROWTH_AGENTS:-}" "$HOME/code/gengrowth-agents" "$HOME/Code/gengrowth-agents" "$HOME/gengrowth-agents")" || REPO=""
WIKI_DEST="$WIKI/docs/repo/gengrowth-agents"

mkdir -p "$(dirname "$LOG")"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG"
}

if [ -z "$REPO" ]; then
  log "Skipping pull: 未找到有效的 gengrowth-agents git 仓库（可用 GENGROWTH_AGENTS 覆盖）"
  exit 0
fi

mkdir -p "$WIKI_DEST"

log "Starting pull: $REPO"
git -C "$REPO" pull >> "$LOG" 2>&1
pull_rc=$?
log "Pull done (exit $pull_rc). Syncing docs..."

if [ -d "$REPO/docs" ]; then
  rsync -av --delete "$REPO/docs/" "$WIKI_DEST/docs/" >> "$LOG" 2>&1
fi

if [ -d "$REPO/tasks" ]; then
  rsync -av --delete "$REPO/tasks/" "$WIKI_DEST/tasks/" >> "$LOG" 2>&1
fi

if [ -d "$REPO/.claude" ]; then
  rsync -av --delete "$REPO/.claude/" "$WIKI_DEST/.claude/" >> "$LOG" 2>&1
fi

for f in AGENTS.md CLAUDE.md DESIGN.md TODOS.md; do
  [ -f "$REPO/$f" ] && cp "$REPO/$f" "$WIKI_DEST/$f"
done

log "Sync done."
