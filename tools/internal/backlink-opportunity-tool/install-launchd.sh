#!/usr/bin/env bash

set -euo pipefail

TOOL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LABEL="${BACKLINK_LAUNCHD_LABEL:-com.gengrowth.backlink-opportunity-tool}"
DOMAIN="gui/$(id -u)"
PLIST_DIR="$HOME/Library/LaunchAgents"
PLIST_PATH="$PLIST_DIR/$LABEL.plist"
LOG_DIR="$HOME/Library/Logs/backlink-opportunity-tool"
PORT="${PORT:-4318}"

mkdir -p "$PLIST_DIR" "$LOG_DIR"

cat > "$PLIST_PATH" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>$LABEL</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>$TOOL_DIR/run-server.sh</string>
  </array>
  <key>WorkingDirectory</key>
  <string>$TOOL_DIR</string>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>ThrottleInterval</key>
  <integer>10</integer>
  <key>StandardOutPath</key>
  <string>$LOG_DIR/launchd.out.log</string>
  <key>StandardErrorPath</key>
  <string>$LOG_DIR/launchd.err.log</string>
</dict>
</plist>
PLIST

plutil -lint "$PLIST_PATH"
launchctl bootout "$DOMAIN" "$PLIST_PATH" 2>/dev/null || true
launchctl bootstrap "$DOMAIN" "$PLIST_PATH"
launchctl kickstart -k "$DOMAIN/$LABEL"

for attempt in {1..10}; do
  if curl -fsS http://127.0.0.1:${PORT}/api/health >/dev/null; then
    echo "已安装并启动 $LABEL"
    echo "健康检查: http://127.0.0.1:${PORT}/api/health"
    exit 0
  fi
  sleep 1
done

echo "服务未在 10 秒内通过健康检查，请查看 $LOG_DIR/launchd.err.log" >&2
exit 1
