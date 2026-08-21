#!/bin/zsh
set -u

base_dir="/Users/pengman/gengrowth-ops/inbox-pengman/tools/tiktok-public-capture"
node_bin="/Users/pengman/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"
collector="$base_dir/collect_tiktok_public_data.mjs"
env_file="$base_dir/.env"
state_file="/Users/pengman/gengrowth-ops/inbox-pengman/output/.last_scheduled_run_bj"

# Beijing-time run points, every 4 hours. The script already converts to
# Beijing time internally (TZ=Asia/Shanghai), so the local Mac timezone (e.g. PDT)
# is handled automatically — no manual -15h offset needed.
run_points_bj=("00:00" "04:00" "08:00" "12:00" "16:00" "20:00")

# Optional override: allow SCHEDULE_POINTS_BJ in .env like "00:00,06:00,12:00,18:00"
if [[ -f "$env_file" ]]; then
  configured_points="$(/usr/bin/awk -F= '$1 == "SCHEDULE_POINTS_BJ" {gsub(/^[ \t]+|[ \t]+$/, "", $2); print $2; exit}' "$env_file")"
  if [[ -n "$configured_points" ]]; then
    run_points_bj=("${(@s:,:)configured_points}")
  fi
fi

bj_date="$(TZ=Asia/Shanghai /bin/date +%Y-%m-%d)"
bj_hour="$(( 10#$(TZ=Asia/Shanghai /bin/date +%H) ))"
bj_min_raw="$(( 10#$(TZ=Asia/Shanghai /bin/date +%M) ))"
bj_minute="$(( bj_hour * 60 + bj_min_raw ))"

# Determine the most recent run point (as minutes since midnight) that is <= now.
current_point_min=-1
current_point_label=""
for p in "${run_points_bj[@]}"; do
  h="${p%%:*}"
  m="${p##*:}"
  # zsh arithmetic handles leading zeros via $((10#...))
  hh="$(( 10#${h} ))"
  mm="$(( 10#${m} ))"
  pm="$(( hh * 60 + mm ))"
  if [[ "$pm" -le "$bj_minute" ]]; then
    current_point_min="$pm"
    current_point_label="${bj_date}T${p}"
  fi
done

last_point=""
if [[ -f "$state_file" ]]; then
  last_point="$(/bin/cat "$state_file")"
fi

force_run="false"
if [[ "$#" -gt 0 && "$1" = "--force" ]]; then
  force_run="true"
fi

# Only run when we have passed a new run point since the last scheduled run.
if [[ "$force_run" != "true" ]]; then
  if [[ "$current_point_label" = "" || "$current_point_label" = "$last_point" ]]; then
    exit 0
  fi
fi

PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"
export PATH
"$node_bin" "$collector"
exit_code=$?

# Record the run point. Even if collection fails, we only retry on the next
# run point; use --force for an immediate manual retry.
if [[ "$force_run" != "true" && "$current_point_label" != "" ]]; then
  /usr/bin/printf '%s\n' "$current_point_label" > "$state_file"
fi

exit "$exit_code"