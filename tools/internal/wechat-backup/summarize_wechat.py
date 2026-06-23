#!/usr/bin/env python3

import argparse
import json
import re
import shlex
import subprocess
import sys
from collections import Counter
from datetime import date
from pathlib import Path


MESSAGE_LINE_RE = re.compile(r"^\[(?P<timestamp>[^\]]+)\]\s(?:(?P<sender>.*?):\s)?(?P<text>.*)$")
LINK_RE = re.compile(r"https?://[A-Za-z0-9\-._~:/?#\[\]@!$&'()*+,;=%]+")


def parse_message_line(line):
    raw = line.strip()
    first_line, *rest_lines = raw.splitlines()
    match = MESSAGE_LINE_RE.match(first_line)
    if not match:
        return {
            "timestamp": "",
            "sender": "",
            "text": raw,
        }
    sender = (match.group("sender") or "").strip()
    text = (match.group("text") or "").strip()
    if rest_lines:
        remainder = "\n".join(rest_lines).strip()
        if remainder:
            text = f"{text}\n{remainder}" if text else remainder
    if not sender and text.startswith("[系统] "):
        sender = "[系统]"
        text = text[len("[系统] "):].strip()
    return {
        "timestamp": match.group("timestamp") or "",
        "sender": sender,
        "text": text,
    }


def load_group_payloads(day_dir):
    payloads = []
    for json_path in sorted(Path(day_dir).glob("*.json")):
        if json_path.name == "summary.json":
            continue
        payload = json.loads(json_path.read_text(encoding="utf-8"))
        payloads.append((json_path, payload))
    return payloads


def summarize_group_payload(payload, excerpt_limit=8):
    raw_messages = payload.get("messages") or []
    parsed_messages = [parse_message_line(line) for line in raw_messages]

    senders = Counter(
        item["sender"] for item in parsed_messages
        if item["sender"] and item["sender"] != "[系统]"
    )
    links = []
    for item in parsed_messages:
        links.extend(LINK_RE.findall(item["text"]))

    timestamps = [item["timestamp"] for item in parsed_messages if item["timestamp"]]
    return {
        "group_name": payload.get("chat") or payload.get("username") or "未命名群聊",
        "username": payload.get("username") or "",
        "message_count": len(parsed_messages),
        "time_range": {
            "first": timestamps[0] if timestamps else "",
            "last": timestamps[-1] if timestamps else "",
        },
        "top_senders": [
            {"sender": sender, "count": count}
            for sender, count in senders.most_common(5)
        ],
        "links": links[:10],
        "excerpt_messages": parsed_messages[-excerpt_limit:],
    }


def render_daily_summary(date_str, group_summaries):
    total_messages = sum(item["message_count"] for item in group_summaries)
    total_groups = len(group_summaries)
    unique_senders = sorted({
        entry["sender"]
        for group in group_summaries
        for entry in group["top_senders"]
        if entry["sender"]
    })

    lines = [
        "---",
        f"title: 微信日总结 — {date_str}",
        f"date: {date_str}",
        f"updated: {date_str}",
        "type: note",
        "tags:",
        "  - wechat",
        "  - backup",
        "  - summary",
        "aliases:",
        f"  - 微信日总结 {date_str}",
        f"  - wechat daily summary {date_str}",
        "---",
        "",
        f"# 微信日总结 — {date_str}",
        "",
        "## 总览",
        "",
        f"- 群聊数：{total_groups}",
        f"- 总消息数：{total_messages}",
        f"- 活跃发言人：{len(unique_senders)}",
        "",
        "## 各群摘要",
        "",
    ]

    for group in group_summaries:
        lines.extend([
            f"### {group['group_name']}",
            "",
            f"- 消息数：{group['message_count']}",
            f"- 时间范围：{group['time_range']['first'] or '无'} ~ {group['time_range']['last'] or '无'}",
        ])

        if group["top_senders"]:
            sender_text = "，".join(
                f"{item['sender']}({item['count']})"
                for item in group["top_senders"]
            )
            lines.append(f"- 主要发言人：{sender_text}")
        else:
            lines.append("- 主要发言人：无")

        if group["links"]:
            lines.append(f"- 重要链接：{'；'.join(group['links'])}")
        else:
            lines.append("- 重要链接：无")

        lines.append("- 末尾消息摘录：")
        if group["excerpt_messages"]:
            for item in group["excerpt_messages"]:
                sender = f"{item['sender']}: " if item["sender"] else ""
                text = item["text"].replace("\n", " ").strip()
                lines.append(f"  - [{item['timestamp']}] {sender}{text}")
        else:
            lines.append("  - 无")
        lines.append("")

    return "\n".join(lines).rstrip() + "\n"


def render_llm_prompt(date_str, group_summaries):
    lines = [
        f"# 微信群总结 Prompt — {date_str}",
        "",
        "请基于以下微信群备份数据，输出一份中文日总结。",
        "要求：",
        "- 先写总览，再写每个群的重点。",
        "- 尽量提炼主题、重要观点、待跟进事项、出现过的链接。",
        "- 不要编造；如果信息不足就明确写“未见明确信息”。",
        "- 语气简洁，偏工作纪要风格。",
        "",
    ]

    for group in group_summaries:
        lines.extend([
            f"## 群聊：{group['group_name']}",
            f"- 消息数：{group['message_count']}",
            f"- 时间范围：{group['time_range']['first'] or '无'} ~ {group['time_range']['last'] or '无'}",
        ])

        if group["top_senders"]:
            lines.append(
                "- 主要发言人：" +
                "，".join(f"{item['sender']}({item['count']})" for item in group["top_senders"])
            )
        if group["links"]:
            lines.append("- 链接：" + "；".join(group["links"]))

        lines.append("- 消息摘录：")
        for item in group["excerpt_messages"]:
            sender = f"{item['sender']}: " if item["sender"] else ""
            text = item["text"].replace("\n", " ").strip()
            lines.append(f"  - [{item['timestamp']}] {sender}{text}")
        lines.append("")

    return "\n".join(lines).rstrip() + "\n"


def run_llm_command(llm_command, prompt_text):
    return subprocess.run(
        llm_command,
        input=prompt_text,
        text=True,
        shell=True,
        capture_output=True,
        check=True,
    )


def run_summary(output_root, date_str, llm_command=None, excerpt_limit=8):
    day_dir = Path(output_root) / date_str
    if not day_dir.exists():
        raise RuntimeError(f"备份目录不存在: {day_dir}")

    payloads = load_group_payloads(day_dir)
    if not payloads:
        raise RuntimeError(f"未找到可总结的 JSON 备份: {day_dir}")

    group_summaries = [
        summarize_group_payload(payload, excerpt_limit=excerpt_limit)
        for _, payload in payloads
    ]

    summary_text = render_daily_summary(date_str, group_summaries)
    prompt_text = render_llm_prompt(date_str, group_summaries)

    summary_path = day_dir / "daily-summary.md"
    prompt_path = day_dir / "summary-prompt.md"
    summary_path.write_text(summary_text, encoding="utf-8")
    prompt_path.write_text(prompt_text, encoding="utf-8")

    result = {
        "summary_path": str(summary_path),
        "prompt_path": str(prompt_path),
        "group_count": len(group_summaries),
    }

    if llm_command:
        llm_result = run_llm_command(llm_command, prompt_text)
        ai_summary_path = day_dir / "daily-summary-ai.md"
        ai_summary_path.write_text(llm_result.stdout, encoding="utf-8")
        result["ai_summary_path"] = str(ai_summary_path)

    return result


def parse_args(argv=None):
    parser = argparse.ArgumentParser(description="基于微信备份生成日总结和 LLM prompt")
    parser.add_argument("--output-root", required=True, help="微信备份根目录")
    parser.add_argument(
        "--date",
        dest="date_str",
        default=date.today().isoformat(),
        help="总结日期，格式 YYYY-MM-DD，默认今天",
    )
    parser.add_argument(
        "--llm-command",
        default=None,
        help="可选：把 prompt 通过 shell 命令喂给终端 LLM，并写出 AI 总结",
    )
    parser.add_argument(
        "--excerpt-limit",
        type=int,
        default=8,
        help="每个群放入总结和 prompt 的尾部消息数，默认 8",
    )
    return parser.parse_args(argv)


def main(argv=None):
    args = parse_args(argv)
    try:
        result = run_summary(
            output_root=args.output_root,
            date_str=args.date_str,
            llm_command=args.llm_command,
            excerpt_limit=args.excerpt_limit,
        )
    except Exception as exc:
        print(f"生成总结失败: {exc}", file=sys.stderr)
        return 1

    print(f"总结完成: {result['summary_path']}")
    print(f"Prompt 已生成: {result['prompt_path']}")
    if "ai_summary_path" in result:
        print(f"AI 总结已生成: {result['ai_summary_path']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
