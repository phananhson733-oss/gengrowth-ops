import importlib.util
import tempfile
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).resolve().parents[1] / "config.py"
SPEC = importlib.util.spec_from_file_location("config", MODULE_PATH)
config = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(config)


class LoadEnvTests(unittest.TestCase):
    def test_parses_key_value(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / ".env"
            p.write_text("APP_ID=cli_abc\nAPP_SECRET=sek_123\n", encoding="utf-8")
            env = config.load_env(p)
            self.assertEqual(env["APP_ID"], "cli_abc")
            self.assertEqual(env["APP_SECRET"], "sek_123")

    def test_ignores_comments_and_blanks(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / ".env"
            p.write_text("# 飞书凭证\n\nAPP_ID=x\n  # 注释\nTABLE_ID=tbl1\n", encoding="utf-8")
            env = config.load_env(p)
            self.assertEqual(env, {"APP_ID": "x", "TABLE_ID": "tbl1"})

    def test_value_with_equals_sign(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / ".env"
            p.write_text("TOKEN=a=b=c\n", encoding="utf-8")
            self.assertEqual(config.load_env(p)["TOKEN"], "a=b=c")

    def test_strips_surrounding_whitespace_and_quotes(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / ".env"
            p.write_text('APP_ID = "cli_abc" \n', encoding="utf-8")
            self.assertEqual(config.load_env(p)["APP_ID"], "cli_abc")

    def test_missing_file_raises_with_helpful_message(self):
        with self.assertRaises(FileNotFoundError) as ctx:
            config.load_env("/no/such/baoxiao/.env")
        self.assertIn("/no/such/baoxiao/.env", str(ctx.exception))


class RequireTests(unittest.TestCase):
    def test_returns_value(self):
        self.assertEqual(config.require({"APP_ID": "x"}, "APP_ID"), "x")

    def test_missing_key_raises_keyerror_named(self):
        with self.assertRaises(KeyError) as ctx:
            config.require({}, "APP_SECRET")
        self.assertIn("APP_SECRET", str(ctx.exception))

    def test_empty_value_treated_as_missing(self):
        with self.assertRaises(KeyError):
            config.require({"APP_SECRET": "  "}, "APP_SECRET")


class LoadYamlTests(unittest.TestCase):
    def test_loads_mapping(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "m.yaml"
            p.write_text("rules:\n  - category: 差旅费用\n    keywords: [机票, 酒店]\n", encoding="utf-8")
            data = config.load_yaml(p)
            self.assertEqual(data["rules"][0]["category"], "差旅费用")


if __name__ == "__main__":
    unittest.main()
