#!/bin/zsh
set -euo pipefail

base_dir="/Users/pengman/gengrowth-ops/inbox-pengman/tools/short-drama-release-manager"
node_bin="/Users/pengman/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"
mkdir -p "$base_dir/logs"
"$node_bin" "$base_dir/sync_shortdrama_to_feishu.mjs" --sync
