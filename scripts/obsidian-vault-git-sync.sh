#!/usr/bin/env bash
# Run the shared GenGrowth Obsidian vault git sync from the ops repo.
#
# Works with common layouts on each machine:
#   ~/gengrowth-wiki
#   ~/gengrowth-ops
#   ~/code/gengrowth-wiki
#   ~/code/gengrowth-ops
#
# Override when needed:
#   GENGROWTH_WIKI=/path/to/gengrowth-wiki
#   GENGROWTH_OPS=/path/to/gengrowth-ops
#   GENGROWTH_VAULT_SYNC_SCRIPT=/path/to/obsidian-vault-git-sync.py

set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OPS_REPO="${GENGROWTH_OPS:-$(cd "$SCRIPT_DIR/.." && pwd)}"
PYTHON="${PYTHON:-python3}"

find_sync_script() {
  local candidate

  if [ -n "${GENGROWTH_VAULT_SYNC_SCRIPT:-}" ]; then
    [ -f "$GENGROWTH_VAULT_SYNC_SCRIPT" ] && echo "$GENGROWTH_VAULT_SYNC_SCRIPT"
    return 0
  fi

  for candidate in \
    "${GENGROWTH_WIKI:-}" \
    "$OPS_REPO/../gengrowth-wiki" \
    "$HOME/gengrowth-wiki" \
    "$HOME/code/gengrowth-wiki" \
    "$HOME/Code/gengrowth-wiki" \
    "$HOME/Documents/gengrowth-wiki"; do
    [ -n "$candidate" ] || continue
    if [ -f "$candidate/tools/scripts/obsidian-vault-git-sync.py" ]; then
      echo "$candidate/tools/scripts/obsidian-vault-git-sync.py"
      return 0
    fi
  done
}

SYNC_SCRIPT="$(find_sync_script)"

if [ ! -f "$SYNC_SCRIPT" ]; then
  echo "Obsidian vault git sync 需要关注："
  echo "- 未找到共享同步脚本：$SYNC_SCRIPT"
  echo "- 请先拉取 gengrowth-wiki，或设置 GENGROWTH_WIKI / GENGROWTH_VAULT_SYNC_SCRIPT。"
  exit 0
fi

has_repo_arg=false
for arg in "$@"; do
  if [ "$arg" = "--repo" ] || [[ "$arg" == --repo=* ]]; then
    has_repo_arg=true
    break
  fi
done

if [ "$has_repo_arg" = true ]; then
  "$PYTHON" "$SYNC_SCRIPT" "$@"
  exit $?
fi

ARGS=()
SEEN_REPOS=":"

add_repo() {
  local repo_path="$1"
  local resolved

  [ -n "$repo_path" ] || return 0
  [ -d "$repo_path/.git" ] || return 0
  resolved="$(cd "$repo_path" && pwd -P)" || return 0
  case "$SEEN_REPOS" in
    *":$resolved:"*) return 0 ;;
  esac
  SEEN_REPOS="$SEEN_REPOS$resolved:"
  ARGS+=(--repo "$resolved")
}

add_repo "$OPS_REPO"
for base in "$OPS_REPO/.." "$HOME" "$HOME/code" "$HOME/Code" "$HOME/Documents"; do
  for name in gengrowth-wiki GenGrowth-wiki gengrowth-ops gengrowth-agents; do
    add_repo "$base/$name"
  done
done

"$PYTHON" "$SYNC_SCRIPT" "${ARGS[@]}" "$@"
