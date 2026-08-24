#!/bin/zsh
set -euo pipefail

label="com.gengrowth.shortdrama-feishu-sync"
source_plist="/Users/pengman/gengrowth-ops/inbox-pengman/tools/short-drama-release-manager/launchd/$label.plist"
target_dir="$HOME/Library/LaunchAgents"
target_plist="$target_dir/$label.plist"
domain="gui/$(/usr/bin/id -u)"
mkdir -p "$target_dir" "/Users/pengman/gengrowth-ops/inbox-pengman/tools/short-drama-release-manager/logs"
/usr/bin/plutil -lint "$source_plist"
/bin/launchctl bootout "$domain/$label" 2>/dev/null || true
/bin/cp "$source_plist" "$target_plist"
/bin/launchctl bootstrap "$domain" "$target_plist"
/bin/launchctl enable "$domain/$label"
echo "Installed: $domain/$label"
