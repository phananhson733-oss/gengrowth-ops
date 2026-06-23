import importlib.util
import tempfile
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).resolve().parents[1] / "launchd_wechat_backup.py"
SPEC = importlib.util.spec_from_file_location("launchd_wechat_backup", MODULE_PATH)
launchd_wechat_backup = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(launchd_wechat_backup)


class ParseTimeTests(unittest.TestCase):
    def test_parse_hhmm_returns_hour_and_minute(self):
        self.assertEqual(launchd_wechat_backup.parse_hhmm("01:30"), (1, 30))

    def test_parse_hhmm_rejects_invalid_time(self):
        with self.assertRaises(ValueError):
            launchd_wechat_backup.parse_hhmm("25:99")


class RenderPlistTests(unittest.TestCase):
    def test_render_launchd_plist_contains_schedule_and_paths(self):
        content = launchd_wechat_backup.render_launchd_plist(
            label="com.gengrowth.wechat-backup",
            hour=1,
            minute=30,
            working_directory="/Users/lynne/gengrowth-wiki",
            run_script="/Users/lynne/gengrowth-wiki/tools/internal/wechat-backup/run-backup-today.sh",
            stdout_log="/Users/lynne/gengrowth-wiki/参考资料/微信备份/logs/launchd.stdout.log",
            stderr_log="/Users/lynne/gengrowth-wiki/参考资料/微信备份/logs/launchd.stderr.log",
        )

        self.assertIn("com.gengrowth.wechat-backup", content)
        self.assertIn("<integer>1</integer>", content)
        self.assertIn("<integer>30</integer>", content)
        self.assertIn("run-backup-today.sh", content)
        self.assertIn("launchd.stdout.log", content)
        self.assertIn("launchd.stderr.log", content)
        self.assertIn("/Users/lynne/gengrowth-wiki", content)


class WritePlistTests(unittest.TestCase):
    def test_write_plist_creates_file(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            output_path = Path(tmpdir) / "com.gengrowth.wechat-backup.plist"
            launchd_wechat_backup.write_plist(
                output_path=output_path,
                label="com.gengrowth.wechat-backup",
                time_str="01:30",
                working_directory="/Users/lynne/gengrowth-wiki",
                run_script="/Users/lynne/gengrowth-wiki/tools/internal/wechat-backup/run-backup-today.sh",
                stdout_log="/Users/lynne/gengrowth-wiki/参考资料/微信备份/logs/launchd.stdout.log",
                stderr_log="/Users/lynne/gengrowth-wiki/参考资料/微信备份/logs/launchd.stderr.log",
            )

            self.assertTrue(output_path.exists())
            content = output_path.read_text(encoding="utf-8")
            self.assertIn("com.gengrowth.wechat-backup", content)


if __name__ == "__main__":
    unittest.main()
