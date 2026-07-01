#!/usr/bin/env bash
# 在本机安装/更新 launchd 定时任务，每 60s 跑加固过的 frequent-sync.sh
# （commit → fetch → rebase → push 重试，绝不 force；wiki→ops 镜像带 mkdir 锁）。
#
# 这是多机自动同步的推荐推送路径：全网机器都用这一个 system-git 引擎，
# 天然遵守 .gitattributes 的 union 合并（对话记录并发追加自动保留双方）。
#
# 用法：  bash tools/scripts/install-sync-launchd.sh          # 安装/更新
#         bash tools/scripts/install-sync-launchd.sh --uninstall
#         bash tools/scripts/install-sync-launchd.sh --status
#
# 幂等：重复运行会先卸载旧任务再装新的。

set -u

LABEL="com.gengrowth.frequent-sync"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SYNC_SH="$SCRIPT_DIR/frequent-sync.sh"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
INTERVAL="${GENGROWTH_SYNC_INTERVAL:-60}"
DOMAIN="gui/$(id -u)"

# 解析要注入 launchd 环境的仓库路径（ops/agents 常在非默认位置，如 ~/code）。
# launchd 任务环境极简，env 必须写进 plist 的 EnvironmentVariables 才生效。
detect_repo() {  # $1=env 值（可空），其余=候选路径；返回首个含 .git 的
  local envval="$1"; shift
  if [ -n "$envval" ] && [ -d "$envval/.git" ]; then echo "$envval"; return; fi
  local c
  for c in "$@"; do [ -d "$c/.git" ] && { echo "$c"; return; }; done
}
WIKI_PATH="${GENGROWTH_WIKI:-$(cd "$SCRIPT_DIR/../.." && pwd)}"
OPS_PATH="$(detect_repo "${GENGROWTH_OPS:-}" "$HOME/code/gengrowth-ops" "$HOME/Code/gengrowth-ops" "$HOME/gengrowth-ops")"
# agents 不自动纳入：~/code/gengrowth-agents 常是 dev 工作区（feature 分支 + 未提交改动），
# py 引擎默认按 main 同步会误提交/推错分支。仅当显式 GENGROWTH_AGENTS 指向有效仓库时才纳入。
AGENTS_PATH=""
if [ -n "${GENGROWTH_AGENTS:-}" ] && [ -d "${GENGROWTH_AGENTS}/.git" ]; then
  AGENTS_PATH="$GENGROWTH_AGENTS"
fi

ENV_ENTRIES=""
append_env() {  # name value（值空则跳过）
  [ -n "$2" ] || return 0
  ENV_ENTRIES="${ENV_ENTRIES}    <key>$1</key><string>$2</string>
"
}
append_env GENGROWTH_WIKI "$WIKI_PATH"
append_env GENGROWTH_OPS "$OPS_PATH"
append_env GENGROWTH_AGENTS "$AGENTS_PATH"
ENV_XML=""
if [ -n "$ENV_ENTRIES" ]; then
  ENV_XML="  <key>EnvironmentVariables</key>
  <dict>
${ENV_ENTRIES}  </dict>"
fi

uninstall() {
  launchctl bootout "$DOMAIN/$LABEL" 2>/dev/null
  launchctl unload "$PLIST" 2>/dev/null
  rm -f "$PLIST"
  echo "已卸载 $LABEL"
}

status() {
  if launchctl list 2>/dev/null | grep -q "$LABEL"; then
    echo "RUNNING: $LABEL"
    launchctl list "$LABEL" 2>/dev/null | grep -iE '"PID"|"LastExitStatus"' || true
  else
    echo "NOT loaded: $LABEL"
  fi
  echo "plist: $([ -f "$PLIST" ] && echo "$PLIST" || echo 未安装)"
  echo "log:   $HOME/Library/Logs/gengrowth-frequent-sync.log"
}

case "${1:-}" in
  --uninstall) uninstall; exit 0 ;;
  --status)    status;    exit 0 ;;
esac

if [ ! -f "$SYNC_SH" ]; then
  echo "找不到 ${SYNC_SH}，请在 gengrowth-wiki 仓库内运行" >&2
  exit 1
fi

mkdir -p "$HOME/Library/LaunchAgents" "$HOME/Library/Logs"

# 先卸载旧任务，保证幂等
launchctl bootout "$DOMAIN/$LABEL" 2>/dev/null || true

cat > "$PLIST" <<PLISTEOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>$LABEL</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>-lc</string>
    <string>$SYNC_SH</string>
  </array>
  <key>StartInterval</key>
  <integer>$INTERVAL</integer>
  <key>RunAtLoad</key>
  <true/>
$ENV_XML
  <key>StandardOutPath</key>
  <string>$HOME/Library/Logs/gengrowth-frequent-sync.out.log</string>
  <key>StandardErrorPath</key>
  <string>$HOME/Library/Logs/gengrowth-frequent-sync.err.log</string>
</dict>
</plist>
PLISTEOF

if launchctl bootstrap "$DOMAIN" "$PLIST" 2>/dev/null || launchctl load "$PLIST" 2>/dev/null; then
  echo "已安装并加载 ${LABEL}（每 ${INTERVAL}s 一次）"
  status
else
  echo "加载失败，请检查：launchctl bootstrap $DOMAIN $PLIST" >&2
  exit 1
fi
