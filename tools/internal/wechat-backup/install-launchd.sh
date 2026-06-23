#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

LABEL="${WECHAT_BACKUP_LAUNCHD_LABEL:-com.gengrowth.wechat-backup}"
TIME_VALUE="${WECHAT_BACKUP_TIME:-01:30}"
PLIST_DIR="$HOME/Library/LaunchAgents"
PLIST_PATH="$PLIST_DIR/$LABEL.plist"
OUTPUT_ROOT="${WECHAT_BACKUP_OUTPUT_ROOT:-$REPO_ROOT/参考资料/微信备份}"
LOG_DIR="${WECHAT_BACKUP_LOG_DIR:-$OUTPUT_ROOT/logs}"
RUN_SCRIPT="$SCRIPT_DIR/run-backup-today.sh"
PYTHON_SCRIPT="$SCRIPT_DIR/launchd_wechat_backup.py"
STDOUT_LOG="$LOG_DIR/launchd.stdout.log"
STDERR_LOG="$LOG_DIR/launchd.stderr.log"

while [ "$#" -gt 0 ]; do
  case "$1" in
    --time)
      TIME_VALUE="$2"
      shift 2
      ;;
    --label)
      LABEL="$2"
      PLIST_PATH="$PLIST_DIR/$LABEL.plist"
      shift 2
      ;;
    *)
      echo "未知参数: $1" >&2
      echo "用法: bash $0 [--time HH:MM] [--label LABEL]" >&2
      exit 1
      ;;
  esac
done

mkdir -p "$PLIST_DIR" "$LOG_DIR"

python3 "$PYTHON_SCRIPT" \
  --output "$PLIST_PATH" \
  --label "$LABEL" \
  --time "$TIME_VALUE" \
  --working-directory "$REPO_ROOT" \
  --run-script "$RUN_SCRIPT" \
  --stdout-log "$STDOUT_LOG" \
  --stderr-log "$STDERR_LOG" >/dev/null

GUI_DOMAIN="gui/$(id -u)"
launchctl bootout "$GUI_DOMAIN" "$PLIST_PATH" >/dev/null 2>&1 || true
launchctl bootstrap "$GUI_DOMAIN" "$PLIST_PATH"

echo "已安装 launchd 定时任务"
echo "  Label: $LABEL"
echo "  Time: $TIME_VALUE"
echo "  Plist: $PLIST_PATH"
echo "  Stdout: $STDOUT_LOG"
echo "  Stderr: $STDERR_LOG"
echo
echo "手动立即执行一次："
echo "  launchctl kickstart -k $GUI_DOMAIN/$LABEL"
