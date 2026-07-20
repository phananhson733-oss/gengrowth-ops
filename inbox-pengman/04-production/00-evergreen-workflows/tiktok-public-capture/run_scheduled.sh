#!/bin/zsh
set -u

base_dir="/Users/pengman/gengrowth-ops/inbox-pengman/04-production/00-evergreen-workflows/tiktok-public-capture"
node_bin="/Users/pengman/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"
collector="$base_dir/collect_tiktok_public_data.mjs"
env_file="$base_dir/.env"
state_file="/Users/pengman/gengrowth-ops/inbox-pengman/output/.last_scheduled_run_bj"

schedule_time="10:00"
if [[ -f "$env_file" ]]; then
  configured_time="$(/usr/bin/awk -F= '$1 == "SCHEDULE_TIME_BJ" {gsub(/^[ \t]+|[ \t]+$/, "", $2); print $2; exit}' "$env_file")"
  if [[ -n "$configured_time" ]]; then
    schedule_time="$configured_time"
  fi
fi

bj_date="$(TZ=Asia/Shanghai /bin/date +%Y-%m-%d)"
bj_time="$(TZ=Asia/Shanghai /bin/date +%H:%M)"
last_date=""
if [[ -f "$state_file" ]]; then
  last_date="$(/bin/cat "$state_file")"
fi

force_run="false"
if [[ "$#" -gt 0 && "$1" = "--force" ]]; then
  force_run="true"
fi

if [[ "$force_run" != "true" ]]; then
  if [[ "$last_date" = "$bj_date" || "$bj_time" < "$schedule_time" ]]; then
    exit 0
  fi
fi

PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"
export PATH
"$node_bin" "$collector"
exit_code=$?

# One automatic attempt per Beijing calendar day, even if collection fails.
# This avoids aggressive 15-minute retries; use --force for a manual retry.
if [[ "$force_run" != "true" ]]; then
  /usr/bin/printf '%s\n' "$bj_date" > "$state_file"
fi

exit "$exit_code"
