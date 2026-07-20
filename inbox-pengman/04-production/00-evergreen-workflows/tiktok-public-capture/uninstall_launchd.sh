#!/bin/zsh
set -euo pipefail

label="com.gengrowth.tiktok-public-capture"
domain="gui/$(/usr/bin/id -u)"
target_plist="$HOME/Library/LaunchAgents/$label.plist"

/bin/launchctl bootout "$domain/$label" 2>/dev/null || true
if [[ -f "$target_plist" ]]; then
  /bin/rm "$target_plist"
fi

echo "Uninstalled: $domain/$label"
