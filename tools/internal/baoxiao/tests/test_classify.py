import importlib.util
import tempfile
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).resolve().parents[1] / "classify.py"
SPEC = importlib.util.spec_from_file_location("classify", MODULE_PATH)
classify = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(classify)


# 样例规则;真实 category-map.yaml 内容是业务输入,后填。第一条命中即返回(优先级)。
# 这里用真实表项(差旅费 / 营销 / 办公费)保持与生产配置同口径。
RULES = [
    {"category": "差旅费", "keywords": ["机票", "酒店", "高铁", "出租车", "滴滴", "火车"]},
    {"category": "营销", "keywords": ["广告", "推广", "投放", "营销"]},
    {"category": "办公费", "keywords": ["办公", "文具", "打印"]},
]


class ClassifyTests(unittest.TestCase):
    def test_matches_travel(self):
        self.assertEqual(classify.classify("出租车票", RULES), "差旅费")

    def test_matches_marketing(self):
        self.assertEqual(classify.classify("微信广告投放费", RULES), "营销")

    def test_matching_is_case_insensitive(self):
        rules = [{"category": "研发费用", "keywords": ["OpenAI", "MacBook"]}]
        self.assertEqual(classify.classify("openai subscription", rules), "研发费用")
        self.assertEqual(classify.classify("macbookair", rules), "研发费用")

    def test_first_rule_wins_on_multimatch(self):
        # 同时含"机票"(差旅)和"广告"(营销),差旅规则在前
        self.assertEqual(classify.classify("机票广告套餐", RULES), "差旅费")

    def test_unknown_hint_falls_back(self):
        self.assertEqual(classify.classify("莫名其妙的费用", RULES), "其他费用")

    def test_empty_hint_falls_back(self):
        self.assertEqual(classify.classify("", RULES), "其他费用")

    def test_none_hint_falls_back(self):
        self.assertEqual(classify.classify(None, RULES), "其他费用")


class LoadRulesTests(unittest.TestCase):
    def test_production_rules_classify_hardware_and_repairs_as_equipment(self):
        rules_path = Path(__file__).resolve().parents[1] / "config" / "category-map.yaml"
        rules = classify.load_rules(rules_path)
        cases = [
            "MacBook Pro 公司电脑",
            "iPhone 8 工作机",
            "办公-iphone-729",
            "Apple Mac Mini 电脑设备",
            "研发-macbookair-3529",
            "移动硬盘2TB 办公存储",
            "MacBook 主板维修 信息系统服务费",
        ]
        self.assertTrue(all(
            classify.classify(case, rules) == "设备费用" for case in cases))
        self.assertEqual(
            classify.classify("广州俊树科技 信息系统服务费", rules),
            "研发费用")
        self.assertEqual(classify.classify("微信小程序认证服务费", rules), "研发费用")
        self.assertEqual(classify.classify("BOSS 网络招聘费", rules), "办公费")
        self.assertEqual(classify.classify("机票退票费", rules), "差旅费")
        self.assertEqual(classify.classify("客户商务招待", rules), "商务招待")
        self.assertEqual(classify.classify("花篮商务送礼", rules), "商务招待")

    def test_loads_rules_list_from_yaml(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "category-map.yaml"
            p.write_text(
                "rules:\n"
                "  - category: 差旅费\n"
                "    keywords: [机票, 酒店]\n"
                "  - category: 办公费\n"
                "    keywords: [文具]\n",
                encoding="utf-8",
            )
            rules = classify.load_rules(p)
            self.assertEqual(len(rules), 2)
            self.assertEqual(classify.classify("订酒店", rules), "差旅费")

    def test_missing_rules_key_returns_empty(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "empty.yaml"
            p.write_text("other: 1\n", encoding="utf-8")
            self.assertEqual(classify.load_rules(p), [])


if __name__ == "__main__":
    unittest.main()
