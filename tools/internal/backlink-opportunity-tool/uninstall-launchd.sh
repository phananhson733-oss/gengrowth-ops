#!/usr/bin/env bash

set -euo pipefail

LABEL="${BACKLINK_LAUNCHD_LABEL:-com.gengrowth.backlink-opportunity-tool}"
DOMAIN="gui/$(id -u)"
PLIST_PATH="$HOME/Library/LaunchAgents/$LABEL.plist"

launchctl bootout "$DOMAIN" "$PLIST_PATH" 2>/dev/null || true
rm -f "$PLIST_PATH"

echo "已卸载 $LABEL（日志保留在 $HOME/Library/Logs/backlink-opportunity-tool/）"
