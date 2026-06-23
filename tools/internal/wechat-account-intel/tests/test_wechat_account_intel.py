import importlib.util
import json
import tempfile
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).resolve().parents[1] / "wechat_account_intel.py"
SPEC = importlib.util.spec_from_file_location("wechat_account_intel", MODULE_PATH)
wechat_account_intel = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(wechat_account_intel)


class UrlExtractionTests(unittest.TestCase):
    def test_extract_article_urls_keeps_wechat_articles_and_dedupes(self):
        text = """
        公众号：子木聊AI出海
        https://mp.weixin.qq.com/s/RUjYpP2PMsNBTXlCcEE8oQ
        再次出现：https://mp.weixin.qq.com/s/RUjYpP2PMsNBTXlCcEE8oQ?scene=1#wechat_redirect
        历史页 https://mp.weixin.qq.com/s?__biz=MzA&mid=1&idx=1&sn=abc&chksm=def&scene=21
        非文章 https://example.com/skip
        """

        urls = wechat_account_intel.extract_article_urls(text)

        self.assertEqual(
            urls,
            [
                "https://mp.weixin.qq.com/s/RUjYpP2PMsNBTXlCcEE8oQ",
                "https://mp.weixin.qq.com/s?__biz=MzA&mid=1&idx=1&sn=abc&chksm=def",
            ],
        )

    def test_build_down_mptext_url_encodes_source_url_and_format(self):
        source_url = "https://mp.weixin.qq.com/s/RUjYpP2PMsNBTXlCcEE8oQ"

        api_url = wechat_account_intel.build_down_mptext_url(source_url, output_format="json")

        self.assertIn("https://down.mptext.top/api/public/v1/download?", api_url)
        self.assertIn("format=json", api_url)
        self.assertIn("RUjYpP2PMsNBTXlCcEE8oQ", api_url)
        self.assertNotIn(" ", api_url)


class PipelineTests(unittest.TestCase):
    def test_run_pipeline_with_seed_urls_writes_markdown_and_log(self):
        calls = []

        def fake_downloader(url):
            calls.append(url)
            return {
                "title": "测试文章标题",
                "account_name": "子木聊AI出海",
                "publish_time": "2026-05-19",
                "content_markdown": "正文第一段\n\n正文第二段",
                "source_url": url,
            }

        with tempfile.TemporaryDirectory() as tmpdir:
            result = wechat_account_intel.run_pipeline(
                account_name="子木聊AI出海",
                limit=2,
                seed_urls=[
                    "https://mp.weixin.qq.com/s/RUjYpP2PMsNBTXlCcEE8oQ",
                    "https://mp.weixin.qq.com/s/RUjYpP2PMsNBTXlCcEE8oQ?scene=1",
                ],
                output_dir=tmpdir,
                downloader=fake_downloader,
            )

            output_path = Path(result["output_path"])
            log_path = Path(result["log_path"])
            self.assertTrue(output_path.exists())
            self.assertTrue(log_path.exists())
            self.assertEqual(calls, ["https://mp.weixin.qq.com/s/RUjYpP2PMsNBTXlCcEE8oQ"])

            markdown = output_path.read_text(encoding="utf-8")
            self.assertIn("title: 2026-05-19-子木聊AI出海-最近2篇文章情报归档", markdown)
            self.assertIn("# 子木聊AI出海 — 最近 2 篇文章情报归档", markdown)
            self.assertIn("## PM 快读结论", markdown)
            self.assertIn("测试文章标题", markdown)
            self.assertIn("正文第一段", markdown)

            log = json.loads(log_path.read_text(encoding="utf-8"))
            self.assertEqual(log["account_name"], "子木聊AI出海")
            self.assertEqual(log["requested_limit"], 2)
            self.assertEqual(log["success_count"], 1)
            self.assertEqual(log["failure_count"], 0)
            self.assertEqual(log["articles"][0]["title"], "测试文章标题")
            self.assertEqual(log["articles"][0]["account_name"], "子木聊AI出海")

    def test_run_pipeline_records_failed_downloads_without_stopping(self):
        def fake_downloader(url):
            if "fail" in url:
                raise RuntimeError("抽取失败")
            return {
                "title": "成功文章",
                "account_name": "测试号",
                "publish_time": "",
                "content_markdown": "成功正文",
                "source_url": url,
            }

        with tempfile.TemporaryDirectory() as tmpdir:
            result = wechat_account_intel.run_pipeline(
                account_name="测试号",
                limit=3,
                seed_urls=[
                    "https://mp.weixin.qq.com/s/success",
                    "https://mp.weixin.qq.com/s/fail",
                ],
                output_dir=tmpdir,
                downloader=fake_downloader,
            )

            log = json.loads(Path(result["log_path"]).read_text(encoding="utf-8"))
            self.assertEqual(log["success_count"], 1)
            self.assertEqual(log["failure_count"], 1)
            self.assertEqual(log["failures"][0]["url"], "https://mp.weixin.qq.com/s/fail")
            self.assertIn("抽取失败", log["failures"][0]["error"])


if __name__ == "__main__":
    unittest.main()
