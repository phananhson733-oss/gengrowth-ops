#!/usr/bin/env bash

set -euo pipefail

LABEL="${WECHAT_BACKUP_LAUNCHD_LABEL:-com.gengrowth.wechat-backup}"
PLIST_DIR="$HOME/Library/LaunchAgents"
PLIST_PATH="$PLIST_DIR/$LABEL.plist"

while [ "$#" -gt 0 ]; do
  case "$1" in
    --label)
      LABEL="$2"
      PLIST_PATH="$PLIST_DIR/$LABEL.plist"
      shift 2
      ;;
    *)
      echo "未知参数: $1" >&2
      echo "用法: bash $0 [--label LABEL]" >&2
      exit 1
      ;;
  esac
done

GUI_DOMAIN="gui/$(id -u)"
launchctl bootout "$GUI_DOMAIN" "$PLIST_PATH" >/dev/null 2>&1 || true

if [ -f "$PLIST_PATH" ]; then
  rm "$PLIST_PATH"
  echo "已卸载并删除: $PLIST_PATH"
else
  echo "未找到 plist，已跳过删除: $PLIST_PATH"
fi
