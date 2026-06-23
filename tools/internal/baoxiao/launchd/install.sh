#!/bin/bash
# 安装 baoxiao launchd plists 到 ~/Library/LaunchAgents/。
# 替换模板里 @BAOXIAO_DIR@ / @PYTHON@ 占位符 → 装载 launchctl。
# 用法:
#   bash launchd/install.sh           # 安装
#   bash launchd/install.sh uninstall # 卸载
#
# 调度:
#   daily   每天 19:00 跑 cli.py fetch-mail --filter-subject
#   monthly 每天 23:30 跑 wrapper.sh;wrapper 只在月最后一天才真调 monthly-close

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BAOXIAO_DIR="$(cd "$SCRIPT_DIR"/.. && pwd)"
LAUNCH_AGENTS="${HOME}/Library/LaunchAgents"
PYTHON="${PYTHON:-/usr/bin/python3}"

# 4 个 plist:
#   daily   每天 19:00 拉新邮件
#   monthly 月底 23:30 carry-forward + summary
#   watch   StartInterval=2 轮询刷 dashboard / settled_date / 总表
#   drop    StartInterval=60 扫 _drop 投递区 cp 到 _inbox
#
# WATCH_ONLY=1:Lynne / 第二台机器场景 —— 只装 watch + drop(本机刷新自己看到的 dashboard),
# 不装 daily / monthly(让 Mac Mini 独占,避免双拉邮件 / 双 carry-forward 冲突)。
if [ "${WATCH_ONLY:-0}" = "1" ]; then
    LABELS=("watch" "drop")
    echo "WATCH_ONLY mode: 只装 watch + drop(本机刷新 dashboard,不拉邮件 / 不做 monthly-close)"
else
    LABELS=("daily" "monthly" "watch" "drop")
fi
ACTION="${1:-install}"

uninstall_one() {
    local label="$1"
    local dst="${LAUNCH_AGENTS}/com.gengrowth.baoxiao-${label}.plist"
    if [ -f "$dst" ]; then
        launchctl unload "$dst" 2>/dev/null || true
        rm -f "$dst"
        echo "removed: $dst"
    fi
}

install_one() {
    local label="$1"
    local src="${SCRIPT_DIR}/com.gengrowth.baoxiao-${label}.plist.tmpl"
    local dst="${LAUNCH_AGENTS}/com.gengrowth.baoxiao-${label}.plist"
    sed -e "s|@BAOXIAO_DIR@|${BAOXIAO_DIR}|g" \
        -e "s|@PYTHON@|${PYTHON}|g" \
        "$src" > "$dst"
    launchctl unload "$dst" 2>/dev/null || true
    launchctl load "$dst"
    echo "loaded:  $dst"
}

mkdir -p "$LAUNCH_AGENTS" "$BAOXIAO_DIR/logs"
chmod +x "$SCRIPT_DIR/run-monthly-close-if-last-day.sh"

if [ "$ACTION" = "uninstall" ]; then
    for label in "${LABELS[@]}"; do uninstall_one "$label"; done
    echo "all unloaded."
    exit 0
fi

for label in "${LABELS[@]}"; do install_one "$label"; done
echo ""
echo "下一次触发(launchctl list | grep baoxiao 查看):"
launchctl list | grep baoxiao || echo "(未列出 — 等下次 calendar interval 触发再检查 logs/launchd-*.log)"
