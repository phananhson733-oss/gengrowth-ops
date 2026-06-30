#!/bin/bash
# launchd 每天 23:30 调本脚本;只在「今天是本月最后一天」时跑 month-end。
# month-end = 本月结账 + 汇总呈现给员工查验/结清,**不结转、不建下月**。
# 结转改由月初第一天的 run-month-start-on-first-day.sh 做(两段式)。
#
# 判定:把日期向前移 1 天,month 变了说明今天就是当月最后一天。
# macOS date -v+1d 语法(BSD);Linux 上要换成 date -d "+1 day"。

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BAOXIAO_DIR="$(cd "$SCRIPT_DIR"/.. && pwd)"
PYTHON="${PYTHON:-/usr/bin/python3}"

TODAY_MONTH=$(date +%m)
TOMORROW_MONTH=$(date -v+1d +%m)

if [ "$TOMORROW_MONTH" = "$TODAY_MONTH" ]; then
    # 不是月末,啥也不做(launchd log 空 stdout = healthy 跑过)
    exit 0
fi

cd "$BAOXIAO_DIR"
"$PYTHON" cli.py month-end
