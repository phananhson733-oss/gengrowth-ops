#!/usr/bin/env bash
# 共享同步核心：被 frequent-sync.sh 与 gengrowth-repos-sync.sh 复用，
# 消除两脚本里复制粘贴的「核心 4 步同步」逻辑，避免单边修改导致漂移。
#
# 调用方在 source 本文件前需已设置：
#   WIKI, OPS_REPO, AGENTS_REPO, PYTHON, VAULT_SYNC, LOG
# 并已定义 log() 函数（写入 $LOG）。
#
# gengrowth_sync_core 成功返回 0；vault-sync 失败返回 1（由调用方决定是否 exit）。

gengrowth_sync_core() {
  # ── 1. 先同步真实 repo，避免 rsync 基于旧数据 ──────────────
  local REPO_ARGS=(--repo "$WIKI")
  [ -d "$OPS_REPO/.git" ] && REPO_ARGS+=(--repo "$OPS_REPO")
  [ -d "$AGENTS_REPO/.git" ] && REPO_ARGS+=(--repo "$AGENTS_REPO")

  "$PYTHON" "$VAULT_SYNC" "${REPO_ARGS[@]}" --verbose >> "$LOG" 2>&1 || {
    log "[vault-sync] failed"
    return 1
  }

  # ── 2. gengrowth-agents -> wiki/docs/repo ──────────────────
  local AGENTS_DEST="$WIKI/docs/repo/gengrowth-agents"
  if [ -d "$AGENTS_REPO" ]; then
    mkdir -p "$AGENTS_DEST"
    rsync -a --delete "$AGENTS_REPO/docs/"    "$AGENTS_DEST/docs/"    >> "$LOG" 2>&1
    rsync -a --delete "$AGENTS_REPO/tasks/"   "$AGENTS_DEST/tasks/"   >> "$LOG" 2>&1
    rsync -a --delete "$AGENTS_REPO/.claude/" "$AGENTS_DEST/.claude/" >> "$LOG" 2>&1
    for f in AGENTS.md CLAUDE.md DESIGN.md TODOS.md; do
      [ -f "$AGENTS_REPO/$f" ] && cp "$AGENTS_REPO/$f" "$AGENTS_DEST/$f"
    done
    log "[agents] done"
  fi

  # ── 3. gengrowth-ops -> wiki/docs/repo ─────────────────────
  local OPS_DEST="$WIKI/docs/repo/gengrowth-ops"
  if [ -d "$OPS_REPO" ]; then
    mkdir -p "$OPS_DEST"
    rsync -a --delete "$OPS_REPO/inbox/"      "$OPS_DEST/inbox/"      >> "$LOG" 2>&1
    rsync -a --delete "$OPS_REPO/onboarding/" "$OPS_DEST/onboarding/" >> "$LOG" 2>&1
    log "[ops] done"
  fi

  # ── 4. wiki/tools -> gengrowth-ops/tools ───────────────────
  if [ -d "$OPS_REPO" ] && [ -d "$WIKI/tools" ]; then
    mkdir -p "$OPS_REPO/tools"
    rsync -a --delete "$WIKI/tools/" "$OPS_REPO/tools/" >> "$LOG" 2>&1
    log "[wiki-tools->ops] done"

    if [ -d "$OPS_REPO/.git" ]; then
      "$PYTHON" "$VAULT_SYNC" --repo "$OPS_REPO" --verbose >> "$LOG" 2>&1 || {
        log "[ops-final-sync] failed"
        return 1
      }
    fi
  fi

  # ── 5. rsync 可能修改 wiki，再同步一次 wiki ─────────────────
  "$PYTHON" "$VAULT_SYNC" --repo "$WIKI" --verbose >> "$LOG" 2>&1 || {
    log "[wiki-final-sync] failed"
    return 1
  }

  return 0
}
