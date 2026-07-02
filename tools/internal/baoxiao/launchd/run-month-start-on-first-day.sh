#!/bin/bash
# launchd 每天 09:00 调本脚本;只在「今天是每月 1 号」时跑 month-start。
# month-start = 上月所有结清已结束 → 上月定版 + 把仍未结清的结转到本月 + 开启新月。
# cli.py month-start 默认 close 上月(today 的上个月),无需传 --month。
#
# 放在月初而非月末:给员工完整的「最后一天」窗口结清,结转集合到月初才冻结。

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BAOXIAO_DIR="$(cd "$SCRIPT_DIR"/.. && pwd)"
PYTHON="${PYTHON:-/usr/bin/python3}"

if [ "$(date +%d)" != "01" ]; then
    # 不是 1 号,啥也不做
    exit 0
fi

cd "$BAOXIAO_DIR"
"$PYTHON" cli.py month-start
