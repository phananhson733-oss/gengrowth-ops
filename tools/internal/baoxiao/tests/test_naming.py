import datetime
import importlib.util
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).resolve().parents[1] / "naming.py"
SPEC = importlib.util.spec_from_file_location("naming", MODULE_PATH)
naming = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(naming)


class InvoicePeriodTests(unittest.TestCase):
    def test_yyyymmdd_string(self):
        self.assertEqual(naming.invoice_period("20260505"), "202605")

    def test_iso_dashed_string(self):
        self.assertEqual(naming.invoice_period("2026-01-31"), "202601")

    def test_date_object(self):
        self.assertEqual(naming.invoice_period(datetime.date(2026, 5, 5)), "202605")


class CurrencySymbolTests(unittest.TestCase):
    def test_cny(self):
        self.assertEqual(naming.currency_symbol("CNY"), "¥")

    def test_usd(self):
        self.assertEqual(naming.currency_symbol("USD"), "$")

    def test_case_insensitive(self):
        self.assertEqual(naming.currency_symbol("cny"), "¥")

    def test_unknown_falls_back_to_code(self):
        self.assertEqual(naming.currency_symbol("XYZ"), "XYZ")


class FormatAmountTests(unittest.TestCase):
    def test_integer_value_no_decimals(self):
        self.assertEqual(naming.format_amount(1000), "1000")
        self.assertEqual(naming.format_amount(1000.0), "1000")

    def test_strips_trailing_zero(self):
        self.assertEqual(naming.format_amount(64.80), "64.8")

    def test_keeps_two_decimals(self):
        self.assertEqual(naming.format_amount(586.81), "586.81")


class BuildFilenameTests(unittest.TestCase):
    """task doc 命名规则:{period}-{category}-{币种金额}[-{suffix}].{ext}"""

    def test_domestic_cny(self):
        self.assertEqual(
            naming.build_filename("202601", "差旅费", "CNY", 1000, "pdf"),
            "202601-差旅费-¥1000.pdf",
        )

    def test_overseas_usd(self):
        self.assertEqual(
            naming.build_filename("202601", "差旅费", "USD", 64.8, "pdf"),
            "202601-差旅费-$64.8.pdf",
        )

    def test_collision_suffix(self):
        self.assertEqual(
            naming.build_filename("202605", "研发费用", "USD", 129, "pdf", suffix="1096"),
            "202605-研发费用-$129-1096.pdf",
        )


if __name__ == "__main__":
    unittest.main()
