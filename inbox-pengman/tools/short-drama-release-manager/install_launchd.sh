#!/bin/zsh
set -euo pipefail

label="com.gengrowth.shortdrama-sync"
script_dir="${0:A:h}"
source_plist="$script_dir/launchd/$label.plist"
config_path="${1:-${SHORTDRAMA_CONFIG:-}}"
target_dir="$HOME/Library/LaunchAgents"
target_plist="$target_dir/$label.plist"
domain="gui/$(/usr/bin/id -u)"
backup_plist=""
rendered_plist=""
installed=0

fail() { print -u2 -- "$1"; exit 1; }
[[ -n "$config_path" && -f "$config_path" ]] || fail "A readable runtime config path is required"
config_path="${config_path:A}"
[[ -f "$source_plist" && -f "$script_dir/shortdrama_ctl.mjs" && -f "$script_dir/run_scheduled.sh" ]] || fail "Installer assets are missing"

node_bin="$(/usr/bin/env node -p 'process.execPath')"
node_major="$($node_bin -p 'Number(process.versions.node.split(".")[0])')"
[[ "$node_major" =~ '^[0-9]+$' && "$node_major" -ge 24 ]] || fail "Node.js 24 or later is required"

doctor="$($node_bin "$script_dir/shortdrama_ctl.mjs" doctor --config "$config_path")" || fail "shortdrama_ctl doctor failed"
[[ "$doctor" == *'"status":"ready"'* ]] || fail "shortdrama_ctl doctor is not ready"

/bin/mkdir -p "$target_dir" "$script_dir/logs"
[[ ! -L "$target_dir" && "${target_plist:h}" == "$target_dir" && "$target_plist" == "$HOME/Library/LaunchAgents/$label.plist" ]] || fail "Unsafe LaunchAgents target"
rendered_plist="$(/usr/bin/mktemp "$target_dir/.$label.rendered.XXXXXX")"
/bin/cp "$source_plist" "$rendered_plist"
/usr/bin/plutil -replace ProgramArguments.1 -string "$script_dir/run_scheduled.sh" "$rendered_plist"
/usr/bin/plutil -replace ProgramArguments.2 -string "$config_path" "$rendered_plist"
/usr/bin/plutil -replace EnvironmentVariables.SHORTDRAMA_NODE_BIN -string "$node_bin" "$rendered_plist"
/usr/bin/plutil -replace WorkingDirectory -string "$script_dir" "$rendered_plist"
/usr/bin/plutil -replace StandardOutPath -string "$script_dir/logs/launchd.stdout.log" "$rendered_plist"
/usr/bin/plutil -replace StandardErrorPath -string "$script_dir/logs/launchd.stderr.log" "$rendered_plist"
/usr/bin/plutil -lint "$rendered_plist"

restore() {
  code="${1:-$?}"
  trap - EXIT INT TERM
  if (( code != 0 )); then
    /bin/launchctl bootout "$domain" "$target_plist" >/dev/null 2>&1 || true
    if [[ -n "$backup_plist" && -f "$backup_plist" ]]; then
      /bin/cp "$backup_plist" "$target_plist"
      /bin/launchctl bootstrap "$domain" "$target_plist" >/dev/null 2>&1 || true
      /bin/launchctl enable "$domain/$label" >/dev/null 2>&1 || true
    elif (( installed )); then
      /bin/rm -f "$target_plist"
    fi
  fi
  [[ -n "$rendered_plist" ]] && /bin/rm -f "$rendered_plist"
  [[ -n "$backup_plist" ]] && /bin/rm -f "$backup_plist"
  exit "$code"
}
trap 'restore $?' EXIT
trap 'restore 130' INT
trap 'restore 143' TERM

if [[ -f "$target_plist" ]]; then
  backup_plist="$(/usr/bin/mktemp "$target_dir/.$label.backup.XXXXXX")"
  /bin/cp "$target_plist" "$backup_plist"
fi
/bin/launchctl bootout "$domain" "$target_plist" >/dev/null 2>&1 || true
/bin/cp "$rendered_plist" "$target_plist"
installed=1
/bin/launchctl bootstrap "$domain" "$target_plist"
/bin/launchctl enable "$domain/$label"
readback="$(/bin/launchctl print "$domain/$label")"
[[ "$readback" == *"$label"* && "$readback" == *"$script_dir/run_scheduled.sh"* && "$readback" == *"$config_path"* && "$readback" == *"$node_bin"* && "$readback" == *"$script_dir"* ]] || fail "launchd readback mismatch"
print -- "Installed and verified: $domain/$label"
