#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUNTIME_DEPS_DIR="$SCRIPT_DIR/.runtime-deps"

mkdir -p "$RUNTIME_DEPS_DIR"

python3 -m pip install \
  --upgrade \
  --target "$RUNTIME_DEPS_DIR" \
  click \
  pycryptodome \
  zstandard

echo "已安装本地运行依赖：$RUNTIME_DEPS_DIR"
