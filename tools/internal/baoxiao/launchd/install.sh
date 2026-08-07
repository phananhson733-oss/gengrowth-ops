#!/bin/bash
# 安装 baoxiao launchd plists 到 ~/Library/LaunchAgents/。
# 替换模板里 @BAOXIAO_DIR@ / @PYTHON@ 占位符 → 装载 launchctl。
# 用法:
#   bash launchd/install.sh           # 安装
#   bash launchd/install.sh uninstall # 卸载
#
# 调度:
#   daily       每天 19:00 跑 cli.py fetch-mail --filter-subject
#   month-end   每天 23:30 跑 wrapper;只在本月最后一天跑 cli.py month-end(本月汇总,不结转)
#   month-start 每天 09:00 跑 wrapper;只在每月 1 号跑 cli.py month-start(结转上月未结清+开新月)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BAOXIAO_DIR="$(cd "$SCRIPT_DIR"/.. && pwd)"
LAUNCH_AGENTS="${HOME}/Library/LaunchAgents"
PYTHON="${PYTHON:-/usr/bin/python3}"

# 5 个 plist:
#   daily       每天 19:00 拉新邮件
#   month-end   月末最后一天 23:30 本月汇总(不结转)
#   month-start 每月 1 号 09:00 结转上月未结清 + 开新月
#   watch       StartInterval=2 轮询刷 dashboard / settled_date / 总表
#   drop        StartInterval=60 扫 _drop 投递区 cp 到 _inbox
#
# v3 默认只装邮件拉取 + drop；业务状态和月度汇总已迁至飞书，不再运行 Markdown
# dashboard/watch/month-end/month-start。LEGACY_LEDGER=1 仅供回滚旧账本时使用。
# DROP_ONLY=1:Lynne / 第二台机器只装 drop。
if [ "${DROP_ONLY:-0}" = "1" ]; then
    LABELS=("drop")
    echo "DROP_ONLY mode: 只装 drop(_drop → _inbox)"
elif [ "${LEGACY_LEDGER:-0}" = "1" ]; then
    LABELS=("daily" "month-end" "month-start" "watch" "drop")
    echo "LEGACY_LEDGER mode: 安装旧 Markdown 账本全部任务"
elif [ "${WATCH_ONLY:-0}" = "1" ]; then
    LABELS=("watch" "drop")
    echo "WATCH_ONLY 已废弃，仅用于兼容旧账本；建议改用 DROP_ONLY=1"
else
    LABELS=("daily" "drop")
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
chmod +x "$SCRIPT_DIR/run-month-end-if-last-day.sh" "$SCRIPT_DIR/run-month-start-on-first-day.sh"

# 一次性迁移:旧版 monthly plist(已被 month-end + month-start 取代)若在旧机器上残留,
# 主动 unload + rm —— 否则它每月末仍调 monthly-close 跑全量 carry,瓦解两段式拆分
# (月末偷偷结转,次日 month-start 因幂等 no-op 把回归掩盖掉)。install 和 uninstall 都做。
_OLD_MONTHLY="${LAUNCH_AGENTS}/com.gengrowth.baoxiao-monthly.plist"
if [ -f "$_OLD_MONTHLY" ]; then
    launchctl unload "$_OLD_MONTHLY" 2>/dev/null || true
    rm -f "$_OLD_MONTHLY"
    echo "migrated: 卸载并删除旧 monthly plist(已被 month-end + month-start 取代)"
fi

# v3:飞书接管业务状态后，普通安装主动清理旧 Markdown 账本任务，避免它们继续
# 改写历史只读快照。LEGACY_LEDGER=1 明确回滚时才保留。
if [ "${LEGACY_LEDGER:-0}" != "1" ]; then
    for obsolete in watch month-end month-start; do
        obsolete_dst="${LAUNCH_AGENTS}/com.gengrowth.baoxiao-${obsolete}.plist"
        if [ -f "$obsolete_dst" ]; then
            launchctl unload "$obsolete_dst" 2>/dev/null || true
            rm -f "$obsolete_dst"
            echo "v3 migrated: removed obsolete ${obsolete} task"
        fi
    done
fi

if [ "$ACTION" = "uninstall" ]; then
    for label in "${LABELS[@]}"; do uninstall_one "$label"; done
    echo "all unloaded."
    exit 0
fi

for label in "${LABELS[@]}"; do install_one "$label"; done
echo ""
echo "下一次触发(launchctl list | grep baoxiao 查看):"
launchctl list | grep baoxiao || echo "(未列出 — 等下次 calendar interval 触发再检查 logs/launchd-*.log)"
