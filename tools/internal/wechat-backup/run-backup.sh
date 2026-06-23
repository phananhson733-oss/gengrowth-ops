#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

GROUPS_FILE="${WECHAT_BACKUP_GROUPS_FILE:-$SCRIPT_DIR/groups.txt}"
OUTPUT_ROOT="${WECHAT_BACKUP_OUTPUT_ROOT:-$REPO_ROOT/参考资料/微信备份}"
CLI_PREFIX="${WECHAT_CLI_PREFIX:-bash $SCRIPT_DIR/run-wechat-cli.sh}"

python3 "$SCRIPT_DIR/backup_wechat.py" \
  --groups-file "$GROUPS_FILE" \
  --output-root "$OUTPUT_ROOT" \
  --cli-prefix "$CLI_PREFIX" \
  "$@"
