import importlib.util
import tempfile
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).resolve().parents[1] / "backup_wechat.py"
SPEC = importlib.util.spec_from_file_location("backup_wechat", MODULE_PATH)
backup_wechat = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(backup_wechat)


class LoadGroupsTests(unittest.TestCase):
    def test_load_groups_ignores_comments_and_blank_lines(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            groups_path = Path(tmpdir) / "groups.txt"
            groups_path.write_text(
                "# 备份群聊\n\n项目群A\n  \n# 注释\n项目群B\n",
                encoding="utf-8",
            )

            groups = backup_wechat.load_groups(groups_path)

        self.assertEqual(groups, ["项目群A", "项目群B"])


class FilenameTests(unittest.TestCase):
    def test_sanitize_filename_replaces_unsafe_characters(self):
        result = backup_wechat.sanitize_filename('增长/周会:群*?')
        self.assertEqual(result, "增长-周会-群")


class DateRangeTests(unittest.TestCase):
    def test_build_day_range_returns_full_day_window(self):
        start_time, end_time = backup_wechat.build_day_range("2026-04-16")
        self.assertEqual(start_time, "2026-04-16 00:00:00")
        self.assertEqual(end_time, "2026-04-16 23:59:59")


class IndexMarkdownTests(unittest.TestCase):
    def test_render_index_markdown_contains_backup_summary(self):
        content = backup_wechat.render_index_markdown(
            date_str="2026-04-16",
            generated_at="2026-04-16 18:30",
            items=[
                {
                    "group_name": "项目群A",
                    "safe_name": "项目群A",
                    "message_count": 12,
                    "markdown_file": "项目群A.md",
                    "json_file": "项目群A.json",
                }
            ],
        )

        self.assertIn("# 微信备份索引 — 2026-04-16", content)
        self.assertIn("项目群A", content)
        self.assertIn("12", content)
        self.assertIn("[Markdown](项目群A.md)", content)
        self.assertIn("[JSON](项目群A.json)", content)


if __name__ == "__main__":
    unittest.main()
