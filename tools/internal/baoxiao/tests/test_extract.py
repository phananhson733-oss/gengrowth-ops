import importlib.util
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).resolve().parents[1] / "extract.py"
SPEC = importlib.util.spec_from_file_location("extract", MODULE_PATH)
extract = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(extract)


VALID = {
    "invoice_date": "20260505",
    "amount": 1000.0,
    "currency": "CNY",
    "invoice_number": "No.12345",
    "vendor": "广州进格智能科技有限公司",
    "category_hint": "出租车 差旅",
    "confidence": 0.95,
}


class ParseExtractionTests(unittest.TestCase):
    def test_valid_full_not_flagged(self):
        f = extract.parse_extraction(VALID)
        self.assertFalse(f.needs_review)
        self.assertEqual(f.amount, 1000.0)
        self.assertEqual(f.currency, "CNY")
        self.assertEqual(f.invoice_number, "No.12345")
        self.assertEqual(f.category_hint, "出租车 差旅")

    def test_low_confidence_flags_review(self):
        f = extract.parse_extraction({**VALID, "confidence": 0.5})
        self.assertTrue(f.needs_review)

    def test_missing_invoice_number_flags_review(self):
        f = extract.parse_extraction({**VALID, "invoice_number": ""})
        self.assertTrue(f.needs_review)

    def test_missing_amount_flags_review(self):
        data = {k: v for k, v in VALID.items() if k != "amount"}
        f = extract.parse_extraction(data)
        self.assertIsNone(f.amount)
        self.assertTrue(f.needs_review)

    def test_missing_currency_defaults_cny(self):
        data = {k: v for k, v in VALID.items() if k != "currency"}
        f = extract.parse_extraction(data)
        self.assertEqual(f.currency, "CNY")

    def test_string_amount_with_symbol_and_commas(self):
        f = extract.parse_extraction({**VALID, "amount": "¥1,000.50"})
        self.assertEqual(f.amount, 1000.5)

    def test_non_dict_input_flags_review(self):
        self.assertTrue(extract.parse_extraction(None).needs_review)
        self.assertTrue(extract.parse_extraction("garbage").needs_review)

    def test_threshold_param_respected(self):
        f = extract.parse_extraction({**VALID, "confidence": 0.7}, confidence_threshold=0.6)
        self.assertFalse(f.needs_review)


class BuildExtractionMessagesTests(unittest.TestCase):
    def test_messages_carry_image_and_ask_json(self):
        msgs = extract.build_extraction_messages("data:image/png;base64,AAAA")
        self.assertEqual(msgs[0]["role"], "system")
        # 系统提示里点名要输出的字段
        for key in ["invoice_date", "amount", "invoice_number", "confidence",
                    "invoice_type", "billed_to"]:
            self.assertIn(key, msgs[0]["content"])
        # 普票/专票 必须基于发票标题里的字面字,而不能因为「电子设备/拼多多」就猜成专票
        self.assertIn("专用", msgs[0]["content"])
        self.assertIn("普通", msgs[0]["content"])
        user = msgs[1]
        self.assertEqual(user["role"], "user")
        img = [p for p in user["content"] if p.get("type") == "image_url"][0]
        self.assertEqual(img["image_url"]["url"], "data:image/png;base64,AAAA")


class ParseGptResponseTests(unittest.TestCase):
    def _resp(self, content):
        return {"choices": [{"message": {"content": content}}]}

    def test_plain_json(self):
        d = extract.parse_gpt_response(self._resp('{"amount": 100, "currency": "CNY"}'))
        self.assertEqual(d["amount"], 100)

    def test_fenced_json(self):
        d = extract.parse_gpt_response(self._resp('```json\n{"invoice_number": "X1"}\n```'))
        self.assertEqual(d["invoice_number"], "X1")

    def test_garbage_returns_empty_dict(self):
        self.assertEqual(extract.parse_gpt_response(self._resp("我看不清这张图")), {})

    def test_malformed_response_returns_empty_dict(self):
        self.assertEqual(extract.parse_gpt_response({}), {})


if __name__ == "__main__":
    unittest.main()
