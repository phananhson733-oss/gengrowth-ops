#!/usr/bin/env python3

import argparse
import plistlib
import re
from pathlib import Path


TIME_RE = re.compile(r"^(?P<hour>\d{2}):(?P<minute>\d{2})$")


def parse_hhmm(time_str):
    match = TIME_RE.fullmatch(time_str)
    if not match:
        raise ValueError(f"无效时间格式: {time_str}，请使用 HH:MM")

    hour = int(match.group("hour"))
    minute = int(match.group("minute"))
    if not (0 <= hour <= 23 and 0 <= minute <= 59):
        raise ValueError(f"无效时间范围: {time_str}")
    return hour, minute


def render_launchd_plist(label, hour, minute, working_directory, run_script, stdout_log, stderr_log):
    payload = {
        "Label": label,
        "ProgramArguments": ["/bin/bash", run_script],
        "WorkingDirectory": working_directory,
        "RunAtLoad": False,
        "StartCalendarInterval": {
            "Hour": hour,
            "Minute": minute,
        },
        "StandardOutPath": stdout_log,
        "StandardErrorPath": stderr_log,
    }
    return plistlib.dumps(payload, fmt=plistlib.FMT_XML).decode("utf-8")


def write_plist(output_path, label, time_str, working_directory, run_script, stdout_log, stderr_log):
    hour, minute = parse_hhmm(time_str)
    content = render_launchd_plist(
        label=label,
        hour=hour,
        minute=minute,
        working_directory=working_directory,
        run_script=run_script,
        stdout_log=stdout_log,
        stderr_log=stderr_log,
    )
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(content, encoding="utf-8")
    return output_path


def parse_args(argv=None):
    parser = argparse.ArgumentParser(description="生成微信备份 launchd plist")
    parser.add_argument("--output", required=True, help="plist 输出路径")
    parser.add_argument("--label", required=True, help="launchd label")
    parser.add_argument("--time", required=True, help="每天执行时间，格式 HH:MM")
    parser.add_argument("--working-directory", required=True, help="仓库根目录")
    parser.add_argument("--run-script", required=True, help="实际执行的 runner 脚本")
    parser.add_argument("--stdout-log", required=True, help="stdout 日志路径")
    parser.add_argument("--stderr-log", required=True, help="stderr 日志路径")
    return parser.parse_args(argv)


def main(argv=None):
    args = parse_args(argv)
    path = write_plist(
        output_path=args.output,
        label=args.label,
        time_str=args.time,
        working_directory=args.working_directory,
        run_script=args.run_script,
        stdout_log=args.stdout_log,
        stderr_log=args.stderr_log,
    )
    print(path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
