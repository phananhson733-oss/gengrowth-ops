#!/bin/zsh
set -u

export TZ=Asia/Shanghai

script_dir="${0:A:h}"
runner="$script_dir/shortdrama_ctl.mjs"
config_path="${SHORTDRAMA_CONFIG:-${1:-}}"
expected_capability_file="$HOME/Library/Application Support/GenGrowth/shortdrama-sync/internal.capability"
capability_file="${SHORTDRAMA_CAPABILITY_FILE:-}"
if [[ -z "$config_path" || ! -f "$config_path" ]]; then
  print -u2 -- '{"status":"failed","error":{"code":"config_invalid"}}'
  exit 1
fi
if [[ "$capability_file" != "$expected_capability_file" || ! -f "$capability_file" || -L "$capability_file" ]]; then
  print -u2 -- '{"status":"failed","error":{"code":"internal_capability_invalid"}}'
  exit 1
fi
capability_mode="$(/usr/bin/stat -f '%Lp' "$capability_file" 2>/dev/null)" || exit 1
capability_size="$(/usr/bin/stat -f '%z' "$capability_file" 2>/dev/null)" || exit 1
if [[ "$capability_mode" != "600" || "$capability_size" -lt 64 || "$capability_size" -gt 128 ]]; then
  print -u2 -- '{"status":"failed","error":{"code":"internal_capability_invalid"}}'
  exit 1
fi
capability="$(<"$capability_file")"
if [[ ! "$capability" =~ '^[a-f0-9]{64}$' ]]; then
  print -u2 -- '{"status":"failed","error":{"code":"internal_capability_invalid"}}'
  exit 1
fi
export SHORTDRAMA_INTERNAL_CAPABILITY="$capability"

if [[ -n "${SHORTDRAMA_NODE_BIN:-}" ]]; then
  node_bin="$SHORTDRAMA_NODE_BIN"
  [[ "$node_bin" == /* && -x "$node_bin" ]] || exit 1
else
  node_bin="$(/usr/bin/env node -p 'process.execPath' 2>/dev/null)" || exit 1
fi
node_major="$($node_bin -p 'Number(process.versions.node.split(".")[0])' 2>/dev/null)" || exit 1
if [[ ! "$node_major" =~ '^[0-9]+$' || "$node_major" -lt 24 ]]; then
  print -u2 -- '{"status":"failed","error":{"code":"node_unsupported"}}'
  exit 1
fi

status=0
for command in "schedule tick" "queue drain" "schedule health"; do
  parts=( ${(z)command} )
  "$node_bin" "$runner" $parts --config "$config_path"
  code=$?
  if (( code > status )); then status=$code; fi
done
unset SHORTDRAMA_INTERNAL_CAPABILITY capability
exit "$status"
