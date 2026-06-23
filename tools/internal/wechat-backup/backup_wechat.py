#!/usr/bin/env python3

import argparse
import json
import re
import shlex
import subprocess
import sys
from datetime import date, datetime
from pathlib import Path


UNSAFE_FILENAME_RE = re.compile(r'[<>:"/\\|?*\x00-\x1f]+')
MULTI_DASH_RE = re.compile(r'-{2,}')
MULTI_SPACE_RE = re.compile(r'\s+')


def load_groups(groups_path):
    content = Path(groups_path).read_text(encoding="utf-8")
    groups = []
    for raw_line in content.splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        groups.append(line)
    return groups


def sanitize_filename(name):
    sanitized = UNSAFE_FILENAME_RE.sub("-", name)
    sanitized = MULTI_SPACE_RE.sub(" ", sanitized)
    sanitized = MULTI_DASH_RE.sub("-", sanitized)
    sanitized = sanitized.strip(" .-")
    return sanitized or "untitled"


def build_day_range(date_str):
    target_day = datetime.strptime(date_str, "%Y-%m-%d").date()
    return (
        f"{target_day.isoformat()} 00:00:00",
        f"{target_day.isoformat()} 23:59:59",
    )


def render_index_markdown(date_str, generated_at, items):
    lines = [
        "---",
        f"title: 微信备份索引 — {date_str}",
        f"date: {date_str}",
        f"updated: {date_str}",
        "type: note",
        "tags:",
        "  - wechat",
        "  - backup",
        "  - index",
        "aliases:",
        f"  - 微信备份索引 {date_str}",
        f"  - wechat backup index {date_str}",
        "---",
        "",
        f"# 微信备份索引 — {date_str}",
        "",
        f"- 生成时间：{generated_at}",
        f"- 备份群数：{len(items)}",
        "",
        "## 备份清单",
        "",
    ]

    if not items:
        lines.append("- 今天没有可备份的群聊数据。")
        return "\n".join(lines) + "\n"

    for item in items:
        lines.append(
            f"- {item['group_name']}：{item['message_count']} 条 "
            f"[Markdown]({item['markdown_file']}) · [JSON]({item['json_file']})"
        )

    return "\n".join(lines) + "\n"


def render_group_frontmatter(title, date_str, source_chat):
    return "\n".join(
        [
            "---",
            f"title: {title}",
            f"date: {date_str}",
            f"updated: {date_str}",
            "type: note",
            "tags:",
            "  - wechat",
            "  - backup",
            "aliases:",
            f"  - {source_chat}",
            f"  - 微信备份 {date_str}",
            "---",
            "",
        ]
    )


def prepend_group_frontmatter(markdown_path, title, date_str, source_chat):
    if not markdown_path.exists():
        markdown_path.write_text("", encoding="utf-8")
    body = markdown_path.read_text(encoding="utf-8")
    if body.startswith("---\n"):
        return
    frontmatter = render_group_frontmatter(title, date_str, source_chat)
    markdown_path.write_text(frontmatter + body, encoding="utf-8")


def parse_history_count(history_stdout):
    try:
        payload = json.loads(history_stdout)
    except json.JSONDecodeError:
        return 0

    if isinstance(payload, dict):
        count = payload.get("count")
        if isinstance(count, int):
            return count
        messages = payload.get("messages")
        if isinstance(messages, list):
            return len(messages)
        return 0

    if isinstance(payload, list):
        return len(payload)

    return 0


def ensure_unique_name(safe_name, used_names):
    if safe_name not in used_names:
        used_names.add(safe_name)
        return safe_name

    index = 2
    while True:
        candidate = f"{safe_name}-{index}"
        if candidate not in used_names:
            used_names.add(candidate)
            return candidate
        index += 1


def run_command(command, capture_output=False):
    try:
        return subprocess.run(
            command,
            check=True,
            text=True,
            capture_output=capture_output,
        )
    except FileNotFoundError as exc:
        raise RuntimeError(
            "未找到 wechat-cli。请先安装，或通过 --cli-prefix 指向可执行命令。"
        ) from exc
    except subprocess.CalledProcessError as exc:
        output = (exc.stderr or exc.stdout or "").strip()
        raise RuntimeError(output or f"命令执行失败: {' '.join(command)}") from exc


def write_placeholder_markdown(markdown_path, group_name, date_str):
    markdown_path.write_text(
        f"# 聊天记录: {group_name}\n\n"
        f"**时间范围:** {date_str} 00:00:00 ~ {date_str} 23:59:59\n\n"
        f"该日期没有导出到消息记录。\n",
        encoding="utf-8",
    )


def backup_group(group_name, safe_name, output_dir, date_str, cli_prefix, limit):
    start_time, end_time = build_day_range(date_str)
    base_command = shlex.split(cli_prefix)
    json_path = output_dir / f"{safe_name}.json"
    markdown_path = output_dir / f"{safe_name}.md"

    history_command = base_command + [
        "history",
        group_name,
        "--start-time",
        start_time,
        "--end-time",
        end_time,
        "--format",
        "json",
        "--limit",
        str(limit),
    ]
    history_result = run_command(history_command, capture_output=True)
    json_path.write_text(history_result.stdout, encoding="utf-8")
    message_count = parse_history_count(history_result.stdout)

    export_command = base_command + [
        "export",
        group_name,
        "--format",
        "markdown",
        "--start-time",
        start_time,
        "--end-time",
        end_time,
        "--limit",
        str(limit),
        "--output",
        str(markdown_path),
    ]
    run_command(export_command, capture_output=True)

    if not markdown_path.exists():
        write_placeholder_markdown(markdown_path, group_name, date_str)

    prepend_group_frontmatter(markdown_path, f"{group_name} — {date_str}", date_str, group_name)

    return {
        "group_name": group_name,
        "safe_name": safe_name,
        "message_count": message_count,
        "markdown_file": markdown_path.name,
        "json_file": json_path.name,
    }


def run_backup(groups_path, output_root, date_str, cli_prefix, limit):
    groups = load_groups(groups_path)
    output_dir = Path(output_root) / date_str
    output_dir.mkdir(parents=True, exist_ok=True)

    used_names = set()
    items = []
    for group_name in groups:
        safe_name = ensure_unique_name(sanitize_filename(group_name), used_names)
        items.append(
            backup_group(
                group_name=group_name,
                safe_name=safe_name,
                output_dir=output_dir,
                date_str=date_str,
                cli_prefix=cli_prefix,
                limit=limit,
            )
        )

    generated_at = datetime.now().strftime("%Y-%m-%d %H:%M")
    index_content = render_index_markdown(date_str, generated_at, items)
    (output_dir / "index.md").write_text(index_content, encoding="utf-8")
    return output_dir, items


def parse_args(argv=None):
    parser = argparse.ArgumentParser(description="备份指定微信群聊到本地 Obsidian 目录")
    parser.add_argument("--groups-file", required=True, help="群聊白名单文件")
    parser.add_argument("--output-root", required=True, help="备份输出根目录")
    parser.add_argument(
        "--date",
        dest="date_str",
        default=date.today().isoformat(),
        help="备份日期，格式 YYYY-MM-DD，默认今天",
    )
    parser.add_argument(
        "--cli-prefix",
        default="wechat-cli",
        help="wechat-cli 执行前缀，例如 'wechat-cli' 或 'python3 /abs/path/entry.py'",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=5000,
        help="每个群当天最多导出多少条消息，默认 5000",
    )
    return parser.parse_args(argv)


def main(argv=None):
    args = parse_args(argv)
    try:
        output_dir, items = run_backup(
            groups_path=args.groups_file,
            output_root=args.output_root,
            date_str=args.date_str,
            cli_prefix=args.cli_prefix,
            limit=args.limit,
        )
    except Exception as exc:
        print(f"备份失败: {exc}", file=sys.stderr)
        return 1

    print(f"备份完成: {output_dir}")
    print(f"已生成 {len(items)} 个群聊备份")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
