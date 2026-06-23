"""v2.5.7 Req 4:付款证明截图字段提取解析契约。"""
import importlib.util
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).resolve().parents[1] / "payment_extract.py"
SPEC = importlib.util.spec_from_file_location("payment_extract", MODULE_PATH)
pe = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(pe)


VALID = {
    "payment_date": "20260605",
    "amount_original": 7599.00,
    "currency": "HKD",
    "amount_cny": 6692.39,
    "payment_method": "招行 Visa 信用卡",
    "confidence": 0.95,
    "is_payment_proof": True,
}


class ParsePaymentExtractionTests(unittest.TestCase):
    def test_valid_full(self):
        f = pe.parse_payment_extraction(VALID)
        self.assertFalse(f.needs_review)
        self.assertEqual(f.amount_original, 7599.00)
        self.assertEqual(f.amount_cny, 6692.39)
        self.assertEqual(f.currency, "HKD")
        self.assertTrue(f.is_payment_proof)

    def test_low_confidence_flags_review(self):
        f = pe.parse_payment_extraction({**VALID, "confidence": 0.5})
        self.assertTrue(f.needs_review)

    def test_not_payment_proof_flags_review(self):
        f = pe.parse_payment_extraction({**VALID, "is_payment_proof": False})
        self.assertTrue(f.needs_review)

    def test_missing_amount_flags_review(self):
        d = {k: v for k, v in VALID.items() if k != "amount_original"}
        f = pe.parse_payment_extraction(d)
        self.assertIsNone(f.amount_original)
        self.assertTrue(f.needs_review)

    def test_string_amount_with_symbol_parsed(self):
        f = pe.parse_payment_extraction({**VALID, "amount_cny": "¥6,692.39"})
        self.assertEqual(f.amount_cny, 6692.39)

    def test_garbage_input_returns_review(self):
        self.assertTrue(pe.parse_payment_extraction(None).needs_review)
        self.assertTrue(pe.parse_payment_extraction("garbage").needs_review)

    def test_default_currency_cny(self):
        d = {k: v for k, v in VALID.items() if k != "currency"}
        f = pe.parse_payment_extraction(d)
        self.assertEqual(f.currency, "CNY")


class BuildPaymentMessagesTests(unittest.TestCase):
    def test_messages_carry_image_and_keys(self):
        msgs = pe.build_payment_messages("data:image/png;base64,AAAA")
        self.assertEqual(msgs[0]["role"], "system")
        for key in ["payment_date", "amount_original", "amount_cny",
                    "currency", "is_payment_proof"]:
            self.assertIn(key, msgs[0]["content"])


class ParseGptPaymentResponseTests(unittest.TestCase):
    def _resp(self, content):
        return {"choices": [{"message": {"content": content}}]}

    def test_plain_json(self):
        d = pe.parse_gpt_payment_response(self._resp(
            '{"amount_original": 100, "currency": "USD", "is_payment_proof": true}'
        ))
        self.assertEqual(d["amount_original"], 100)

    def test_fenced_json(self):
        d = pe.parse_gpt_payment_response(self._resp(
            '```json\n{"payment_date": "20260605"}\n```'
        ))
        self.assertEqual(d["payment_date"], "20260605")

    def test_garbage_returns_empty(self):
        self.assertEqual(pe.parse_gpt_payment_response(self._resp("看不清")), {})

    def test_malformed_returns_empty(self):
        self.assertEqual(pe.parse_gpt_payment_response({}), {})


if __name__ == "__main__":
    unittest.main()
