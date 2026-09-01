#!/bin/zsh
set -u

export TZ=Asia/Shanghai
export SHORTDRAMA_INTERNAL_MARKER="launchd:com.gengrowth.shortdrama-sync"
export SHORTDRAMA_LAUNCHD_LABEL="com.gengrowth.shortdrama-sync"

script_dir="${0:A:h}"
runner="$script_dir/shortdrama_ctl.mjs"
config_path="${SHORTDRAMA_CONFIG:-${1:-}}"
if [[ -z "$config_path" || ! -f "$config_path" ]]; then
  print -u2 -- '{"status":"failed","error":{"code":"config_invalid"}}'
  exit 1
fi

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
exit "$status"
