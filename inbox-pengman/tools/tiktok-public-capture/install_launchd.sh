#!/bin/zsh
set -euo pipefail

label="com.gengrowth.tiktok-public-capture"
source_plist="/Users/pengman/gengrowth-ops/inbox-pengman/tools/tiktok-public-capture/launchd/$label.plist"
target_dir="$HOME/Library/LaunchAgents"
target_plist="$target_dir/$label.plist"
logs_dir="/Users/pengman/gengrowth-ops/inbox-pengman/tools/tiktok-public-capture/logs"
domain="gui/$(/usr/bin/id -u)"

mkdir -p "$target_dir" "$logs_dir"
/usr/bin/plutil -lint "$source_plist"
/bin/launchctl bootout "$domain/$label" 2>/dev/null || true
/bin/cp "$source_plist" "$target_plist"
/bin/launchctl bootstrap "$domain" "$target_plist"
/bin/launchctl enable "$domain/$label"

echo "Installed: $domain/$label"
echo "Status: launchctl print $domain/$label"
