#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
OUTPUT_ROOT="${WECHAT_BACKUP_OUTPUT_ROOT:-$REPO_ROOT/参考资料/微信备份}"

python3 "$SCRIPT_DIR/summarize_wechat.py" \
  --output-root "$OUTPUT_ROOT" \
  "$@"
