#!/bin/bash
# launchd 每天 23:30 调本脚本;只在「今天是月最后一天」时真跑 monthly-close。
# 比 plist 直接列 Day=28/29/30/31 更可靠(2 月份 28/29 切换不会撞坏)。
#
# 判定:把日期向前移 1 天,month 变了说明今天就是当月最后一天。
# macOS date -v+1d 语法(BSD),Linux 上要换成 date -d "+1 day"。

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BAOXIAO_DIR="$(cd "$SCRIPT_DIR"/.. && pwd)"
PYTHON="${PYTHON:-/usr/bin/python3}"

TODAY_MONTH=$(date +%m)
TOMORROW_MONTH=$(date -v+1d +%m)

if [ "$TOMORROW_MONTH" = "$TODAY_MONTH" ]; then
    # 不是月底,啥也不做(launchd log 会有空 stdout 表示 healthy 跑过)
    exit 0
fi

cd "$BAOXIAO_DIR"
"$PYTHON" cli.py monthly-close
