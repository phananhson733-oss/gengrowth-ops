#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
WECHAT_CLI_DIR="$REPO_ROOT/tools/external/wechat-cli"
RUNTIME_DEPS_DIR="$SCRIPT_DIR/.runtime-deps"

if [ ! -f "$WECHAT_CLI_DIR/entry.py" ]; then
  echo "未找到 wechat-cli 源码入口：$WECHAT_CLI_DIR/entry.py" >&2
  exit 1
fi

if [ ! -d "$RUNTIME_DEPS_DIR" ]; then
  echo "缺少本地运行依赖，请先执行：" >&2
  echo "  bash $SCRIPT_DIR/setup-wechat-cli.sh" >&2
  exit 1
fi

export PYTHONPATH="$RUNTIME_DEPS_DIR${PYTHONPATH:+:$PYTHONPATH}"
exec python3 "$WECHAT_CLI_DIR/entry.py" "$@"
