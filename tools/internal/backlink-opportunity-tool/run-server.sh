#!/usr/bin/env bash

set -euo pipefail

TOOL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${BACKLINK_ENV_FILE:-$TOOL_DIR/.env}"
NODE_BIN="${BACKLINK_NODE_BIN:-/opt/homebrew/bin/node}"

if [ ! -x "$NODE_BIN" ]; then
  NODE_BIN="$(command -v node)"
fi

if [ -f "$ENV_FILE" ]; then
  set -a
  source "$ENV_FILE"
  set +a
fi

exec "$NODE_BIN" "$TOOL_DIR/server.mjs"
