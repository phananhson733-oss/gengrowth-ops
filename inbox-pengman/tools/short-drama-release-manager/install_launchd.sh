#!/bin/zsh
set -euo pipefail

label="com.gengrowth.shortdrama-sync"
script_dir="${0:A:h}"
source_plist="$script_dir/launchd/$label.plist"
config_path="${1:-${SHORTDRAMA_CONFIG:-}}"
expected_base_token="${2:-${SHORTDRAMA_EXPECTED_BASE_TOKEN:-}}"
privileged_actor_id="${3:-${SHORTDRAMA_PRIVILEGED_ACTOR_ID:-}}"
target_dir="$HOME/Library/LaunchAgents"
target_plist="$target_dir/$label.plist"
capability_dir="$HOME/Library/Application Support/GenGrowth/shortdrama-sync"
capability_file="$capability_dir/internal.capability"
domain="gui/$(/usr/bin/id -u)"
launchctl_bin="/bin/launchctl"
backup_plist=""
rendered_plist=""
was_loaded=0
mutation_started=0
old_runner=""
old_config=""
old_cwd=""
old_program=""

fail() { print -u2 -- "$1"; exit 1; }

if [[ "${SHORTDRAMA_INSTALL_TEST_MODE:-}" == "1" ]]; then
  launchctl_bin="${SHORTDRAMA_TEST_LAUNCHCTL_BIN:-}"
  [[ "$launchctl_bin" == /* && -x "$launchctl_bin" && ! -L "$launchctl_bin" ]] || fail "Test launchctl fixture is unsafe"
fi
[[ -n "$config_path" && -f "$config_path" ]] || fail "A readable runtime config path is required"
if [[ "${SHORTDRAMA_INSTALL_TEST_MODE:-}" != "1" ]]; then
  [[ -n "$expected_base_token" ]] || fail "An independently confirmed Base token is required"
  [[ -n "$privileged_actor_id" ]] || fail "A privileged human actor ID is required"
fi
config_path="${config_path:A}"
[[ -f "$source_plist" && -f "$script_dir/shortdrama_ctl.mjs" && -f "$script_dir/run_scheduled.sh" ]] || fail "Installer assets are missing"

node_bin="$(/usr/bin/env node -p 'process.execPath')"
node_major="$($node_bin -p 'Number(process.versions.node.split(".")[0])')"
[[ "$node_major" =~ '^[0-9]+$' && "$node_major" -ge 24 ]] || fail "Node.js 24 or later is required"

if [[ "${SHORTDRAMA_INSTALL_TEST_MODE:-}" == "1" ]]; then
  doctor="${SHORTDRAMA_INSTALL_TEST_DOCTOR_JSON:-}"
else
  "$node_bin" "$script_dir/shortdrama_ctl.mjs" doctor --config "$config_path" \
    --expected-base-token "$expected_base_token" --actor-id "$privileged_actor_id" || fail "shortdrama_ctl doctor failed"
  doctor='{"status":"ready"}'
fi
[[ "$doctor" == *'"status":"ready"'* ]] || fail "shortdrama_ctl doctor is not ready"

/bin/mkdir -p -m 700 "$target_dir" "$capability_dir" "$script_dir/logs"
[[ ! -L "$target_dir" && ! -L "$capability_dir" && "${target_plist:h}" == "$target_dir" && "$target_plist" == "$HOME/Library/LaunchAgents/$label.plist" ]] || fail "Unsafe installation target"
if [[ -e "$capability_file" ]]; then
  [[ -f "$capability_file" && ! -L "$capability_file" && "$(/usr/bin/stat -f '%Lp' "$capability_file")" == "600" ]] || fail "Existing internal capability is unsafe"
  capability="$(<"$capability_file")"
  [[ "$capability" =~ '^[a-f0-9]{64}$' ]] || fail "Existing internal capability is malformed"
else
  capability_tmp="$(/usr/bin/mktemp "$capability_dir/.internal.capability.XXXXXX")"
  /bin/chmod 600 "$capability_tmp"
  "$node_bin" -e 'process.stdout.write(require("node:crypto").randomBytes(32).toString("hex"))' > "$capability_tmp"
  /bin/mv "$capability_tmp" "$capability_file"
  /bin/chmod 600 "$capability_file"
fi
unset capability capability_tmp

rendered_plist="$(/usr/bin/mktemp "$target_dir/.$label.rendered.XXXXXX")"
/bin/cp "$source_plist" "$rendered_plist"
/usr/bin/plutil -replace ProgramArguments.1 -string "$script_dir/run_scheduled.sh" "$rendered_plist"
/usr/bin/plutil -replace ProgramArguments.2 -string "$config_path" "$rendered_plist"
/usr/bin/plutil -replace EnvironmentVariables.SHORTDRAMA_NODE_BIN -string "$node_bin" "$rendered_plist"
/usr/bin/plutil -replace EnvironmentVariables.SHORTDRAMA_CAPABILITY_FILE -string "$capability_file" "$rendered_plist"
/usr/bin/plutil -replace WorkingDirectory -string "$script_dir" "$rendered_plist"
/usr/bin/plutil -replace StandardOutPath -string "$script_dir/logs/launchd.stdout.log" "$rendered_plist"
/usr/bin/plutil -replace StandardErrorPath -string "$script_dir/logs/launchd.stderr.log" "$rendered_plist"
/usr/bin/plutil -lint "$rendered_plist"

cleanup() {
  [[ -n "$rendered_plist" ]] && /bin/rm -f "$rendered_plist"
  [[ -n "$backup_plist" ]] && /bin/rm -f "$backup_plist"
}

rollback() {
  original_code="$1"
  trap - EXIT INT TERM
  rollback_ok=1
  if (( mutation_started )); then
    if "$launchctl_bin" print "$domain/$label" >/dev/null 2>&1; then
      "$launchctl_bin" bootout "$domain" "$target_plist" || rollback_ok=0
    fi
    if [[ -n "$backup_plist" && -f "$backup_plist" ]]; then
      /bin/cp "$backup_plist" "$target_plist" || rollback_ok=0
      /usr/bin/cmp -s "$backup_plist" "$target_plist" || rollback_ok=0
      if (( was_loaded )); then
        "$launchctl_bin" bootstrap "$domain" "$target_plist" || rollback_ok=0
        "$launchctl_bin" enable "$domain/$label" || rollback_ok=0
        restored="$($launchctl_bin print "$domain/$label")" || rollback_ok=0
        [[ "${restored:-}" == *"$label"* && "${restored:-}" == *"$old_program"* && "${restored:-}" == *"$old_runner"* && "${restored:-}" == *"$old_config"* && "${restored:-}" == *"$old_cwd"* ]] || rollback_ok=0
      elif "$launchctl_bin" print "$domain/$label" >/dev/null 2>&1; then
        rollback_ok=0
      fi
    else
      /bin/rm -f "$target_plist" || rollback_ok=0
      if "$launchctl_bin" print "$domain/$label" >/dev/null 2>&1; then rollback_ok=0; fi
    fi
  fi
  cleanup
  if (( ! rollback_ok )); then
    print -u2 -- "rollback_verification_failed: manual recovery required for $target_plist"
    exit 70
  fi
  exit "$original_code"
}
trap 'rollback $?' EXIT
trap 'rollback 130' INT
trap 'rollback 143' TERM

if [[ -f "$target_plist" ]]; then
  backup_plist="$(/usr/bin/mktemp "$target_dir/.$label.backup.XXXXXX")"
  /bin/cp "$target_plist" "$backup_plist"
  old_program="$(/usr/bin/plutil -extract ProgramArguments.0 raw -o - "$backup_plist")"
  old_runner="$(/usr/bin/plutil -extract ProgramArguments.1 raw -o - "$backup_plist")"
  old_config="$(/usr/bin/plutil -extract ProgramArguments.2 raw -o - "$backup_plist")"
  old_cwd="$(/usr/bin/plutil -extract WorkingDirectory raw -o - "$backup_plist")"
fi
if "$launchctl_bin" print "$domain/$label" >/dev/null 2>&1; then was_loaded=1; fi
mutation_started=1
if (( was_loaded )); then "$launchctl_bin" bootout "$domain" "$target_plist"; fi
/bin/cp "$rendered_plist" "$target_plist"
"$launchctl_bin" bootstrap "$domain" "$target_plist"
"$launchctl_bin" enable "$domain/$label"
readback="$($launchctl_bin print "$domain/$label")"
[[ "$readback" == *"$label"* && "$readback" == *"$script_dir/run_scheduled.sh"* && "$readback" == *"$config_path"* && "$readback" == *"$node_bin"* && "$readback" == *"$script_dir"* ]] || fail "launchd readback mismatch"
mutation_started=0
trap - EXIT INT TERM
cleanup
print -- "Installed and verified: $domain/$label"
