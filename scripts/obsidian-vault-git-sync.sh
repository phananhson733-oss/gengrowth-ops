#!/usr/bin/env bash
# Run the shared GenGrowth Obsidian vault git sync from the ops repo.
#
# Preferred layout on each machine:
#   ~/gengrowth-wiki
#   ~/gengrowth-ops
#
# Override when needed:
#   GENGROWTH_WIKI=/path/to/gengrowth-wiki
#   GENGROWTH_OPS=/path/to/gengrowth-ops
#   GENGROWTH_VAULT_SYNC_SCRIPT=/path/to/obsidian-vault-git-sync.py

set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OPS_REPO="${GENGROWTH_OPS:-$(cd "$SCRIPT_DIR/.." && pwd)}"
WIKI_REPO="${GENGROWTH_WIKI:-$HOME/gengrowth-wiki}"
PYTHON="${PYTHON:-python3}"
SYNC_SCRIPT="${GENGROWTH_VAULT_SYNC_SCRIPT:-$WIKI_REPO/tools/scripts/obsidian-vault-git-sync.py}"

if [ ! -f "$SYNC_SCRIPT" ]; then
  echo "Obsidian vault git sync 需要关注："
  echo "- 未找到共享同步脚本：$SYNC_SCRIPT"
  echo "- 请先拉取 gengrowth-wiki，或设置 GENGROWTH_VAULT_SYNC_SCRIPT。"
  exit 0
fi

ARGS=(--repo "$OPS_REPO")
[ -d "$WIKI_REPO/.git" ] && ARGS+=(--repo "$WIKI_REPO")

"$PYTHON" "$SYNC_SCRIPT" "${ARGS[@]}" "$@"
