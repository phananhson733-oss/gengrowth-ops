#!/usr/bin/env bash
# 共享同步核心：被 frequent-sync.sh 与 gengrowth-repos-sync.sh 复用，
# 消除两脚本里复制粘贴的「核心 4 步同步」逻辑，避免单边修改导致漂移。
#
# 调用方在 source 本文件前需已设置：
#   WIKI, OPS_REPO, AGENTS_REPO, PYTHON, VAULT_SYNC, LOG
# 并已定义 log() 函数（写入 $LOG）。
#
# gengrowth_sync_core 成功返回 0；vault-sync 失败返回 1（由调用方决定是否 exit）。

# 可移植文件锁（macOS 无 flock 二进制，用 mkdir 原子锁）：串行化
# frequent-sync 与 repos-sync，避免 wiki→ops 镜像的 rsync --delete 阶段交错。
# py 引擎的 fcntl 锁只覆盖单次 python 进程，覆盖不到 shell 层的 rsync。
# 锁被占用时优雅跳过本轮（return 0）；陈旧锁（>10min）自动接管，防止崩溃后死锁。
gengrowth_sync_core() {
  local lock_dir="${GENGROWTH_SYNC_SHELL_LOCK:-$HOME/.cache/gengrowth-sync-shell.lock.d}"
  mkdir -p "$(dirname "$lock_dir")"
  if ! mkdir "$lock_dir" 2>/dev/null; then
    if find "$lock_dir" -maxdepth 0 -mmin +10 2>/dev/null | grep -q .; then
      # 陈旧锁：用唯一名 mv 原子接管——只有 mv 成功者删旧锁，消除 TOCTOU 双持。
      local stale="${lock_dir}.stale.$$"
      if mv "$lock_dir" "$stale" 2>/dev/null; then
        rmdir "$stale" 2>/dev/null
        log "[lock] 接管陈旧同步锁（>10min）"
        mkdir "$lock_dir" 2>/dev/null || { log "[lock] 抢锁失败，跳过本轮"; return 0; }
      else
        log "[lock] 另一进程已接管陈旧锁，跳过本轮"
        return 0
      fi
    else
      log "[lock] 另一个同步正在运行，跳过本轮"
      return 0
    fi
  fi
  _gengrowth_sync_core_body
  local rc=$?
  rmdir "$lock_dir" 2>/dev/null
  return $rc
}

_gengrowth_sync_core_body() {
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
  if [ -d "$AGENTS_REPO/.git" ]; then
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
