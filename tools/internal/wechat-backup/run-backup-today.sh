#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
OUTPUT_ROOT="${WECHAT_BACKUP_OUTPUT_ROOT:-$REPO_ROOT/参考资料/微信备份}"
LOG_DIR="${WECHAT_BACKUP_LOG_DIR:-$OUTPUT_ROOT/logs}"

mkdir -p "$LOG_DIR"

if [ "$#" -gt 0 ]; then
  exec bash "$SCRIPT_DIR/run-backup.sh" "$@"
fi

TARGET_DATE="${WECHAT_BACKUP_DATE:-$(date '+%F')}"
exec bash "$SCRIPT_DIR/run-backup.sh" --date "$TARGET_DATE"
