#!/bin/zsh
set -euo pipefail

fixture_root="${1:-}"
launchctl_bin="${2:-}"
domain="${3:-}"
target_plist="${4:-}"
rendered_plist="${5:-}"
label="com.gengrowth.shortdrama-sync"
backup_plist=""
was_loaded=0
mutation_started=0
old_runner=""
old_config=""
old_cwd=""
old_program=""

fail() { print -u2 -- "$1"; exit 1; }

[[ "$fixture_root" == /* && -d "$fixture_root" && ! -L "$fixture_root" &&
   "$launchctl_bin" == /* && -x "$launchctl_bin" && ! -L "$launchctl_bin" ]] || fail "Offline launchctl fixture is unsafe"
fixture_root="${fixture_root:A}"
launchctl_bin="${launchctl_bin:A}"
target_plist="${target_plist:A}"
rendered_plist="${rendered_plist:A}"
[[ "$fixture_root" == /tmp/* || "$fixture_root" == /private/tmp/* ||
   "$fixture_root" == /var/folders/* || "$fixture_root" == /private/var/folders/* ]] || fail "Offline launchctl fixture is unsafe"
[[ "$launchctl_bin" == "$fixture_root"/* && "$launchctl_bin" != "/bin/launchctl" &&
   "$target_plist" == "$fixture_root"/* && "$rendered_plist" == "$fixture_root"/* &&
   -f "$rendered_plist" && ! -L "$rendered_plist" ]] || fail "Offline launchctl fixture is unsafe"

cleanup() {
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
        [[ "${restored:-}" == *"$label"* && "${restored:-}" == *"$old_program"* &&
           "${restored:-}" == *"$old_runner"* && "${restored:-}" == *"$old_config"* &&
           "${restored:-}" == *"$old_cwd"* ]] || rollback_ok=0
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
  backup_plist="$(/usr/bin/mktemp "$fixture_root/.rollback.backup.XXXXXX")"
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
mutation_started=0
trap - EXIT INT TERM
cleanup
