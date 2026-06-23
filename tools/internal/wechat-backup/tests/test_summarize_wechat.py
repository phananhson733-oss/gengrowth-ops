import importlib.util
import json
import tempfile
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).resolve().parents[1] / "summarize_wechat.py"
SPEC = importlib.util.spec_from_file_location("summarize_wechat", MODULE_PATH)
summarize_wechat = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(summarize_wechat)


class ParseMessageLineTests(unittest.TestCase):
    def test_parse_message_line_handles_sender(self):
        parsed = summarize_wechat.parse_message_line(
            "[2026-04-17 00:47] 丹叔: 现已提供 Claude Opus 4.7 https://example.com"
        )

        self.assertEqual(parsed["timestamp"], "2026-04-17 00:47")
        self.assertEqual(parsed["sender"], "丹叔")
        self.assertIn("Claude", parsed["text"])

    def test_parse_message_line_handles_system_message(self):
        parsed = summarize_wechat.parse_message_line(
            '[2026-04-17 00:06] [系统] "A"邀请"B"加入了群聊'
        )

        self.assertEqual(parsed["sender"], "[系统]")
        self.assertIn("加入了群聊", parsed["text"])

    def test_parse_message_line_handles_multiline_message(self):
        parsed = summarize_wechat.parse_message_line(
            "[2026-04-17 00:47] 丹叔: 第一行\n\n第二行\nhttps://example.com/path"
        )

        self.assertEqual(parsed["timestamp"], "2026-04-17 00:47")
        self.assertEqual(parsed["sender"], "丹叔")
        self.assertIn("第二行", parsed["text"])


class SummarizeGroupTests(unittest.TestCase):
    def test_summarize_group_computes_counts_and_links(self):
        payload = {
            "chat": "项目群A",
            "username": "123@chatroom",
            "messages": [
                "[2026-04-17 00:10] Alice: 今天先发版本说明",
                "[2026-04-17 00:20] Bob: 文档地址 https://example.com/doc",
                "[2026-04-17 00:30] Alice: 明天继续跟进",
            ],
        }

        summary = summarize_wechat.summarize_group_payload(payload, excerpt_limit=2)

        self.assertEqual(summary["group_name"], "项目群A")
        self.assertEqual(summary["message_count"], 3)
        self.assertEqual(summary["top_senders"][0]["sender"], "Alice")
        self.assertEqual(summary["top_senders"][0]["count"], 2)
        self.assertEqual(summary["links"], ["https://example.com/doc"])
        self.assertEqual(len(summary["excerpt_messages"]), 2)

    def test_summarize_group_extracts_clean_link(self):
        payload = {
            "chat": "项目群B",
            "username": "456@chatroom",
            "messages": [
                "[2026-04-17 00:42] Alice: 请看 https://example.com/doc 这个说明",
            ],
        }

        summary = summarize_wechat.summarize_group_payload(payload, excerpt_limit=2)

        self.assertEqual(summary["links"], ["https://example.com/doc"])


class RunSummaryTests(unittest.TestCase):
    def test_run_summary_writes_summary_files(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            day_dir = Path(tmpdir) / "2026-04-17"
            day_dir.mkdir(parents=True)
            (day_dir / "项目群A.json").write_text(
                json.dumps(
                    {
                        "chat": "项目群A",
                        "username": "123@chatroom",
                        "messages": [
                            "[2026-04-17 00:10] Alice: 今天先发版本说明",
                            "[2026-04-17 00:20] Bob: 文档地址 https://example.com/doc",
                        ],
                    },
                    ensure_ascii=False,
                ),
                encoding="utf-8",
            )

            result = summarize_wechat.run_summary(
                output_root=tmpdir,
                date_str="2026-04-17",
                llm_command=None,
                excerpt_limit=2,
            )

            summary_path = Path(result["summary_path"])
            prompt_path = Path(result["prompt_path"])
            self.assertTrue(summary_path.exists())
            self.assertTrue(prompt_path.exists())
            self.assertIn("项目群A", summary_path.read_text(encoding="utf-8"))
            self.assertIn("请基于以下微信群备份数据", prompt_path.read_text(encoding="utf-8"))


if __name__ == "__main__":
    unittest.main()
