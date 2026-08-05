import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import archive_index
import ledger


class ArchiveIndexTests(unittest.TestCase):
    def test_append_creates_read_only_index_without_business_state(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp) / "报销"
            row = ledger.LedgerRow(
                id8="abc12345", file_rel="发票/202607/Lynne/a.pdf",
                reimburser="Lynne", category="设备费用", amount=100,
                currency="CNY", invoice_number="INV-1", period="202607",
                submit_date="2026-07-31", description="电脑",
                invoice_type="普票", billed_to=ledger.DOMESTIC_TITLE,
                invoice_date="20260730", source_sha256="a" * 64,
                pdf_text_sha256="b" * 64,
            )

            self.assertTrue(archive_index.append_row(root, row))
            self.assertFalse(archive_index.append_row(root, row))
            path = root / "归档索引.md"
            text = path.read_text(encoding="utf-8")
            self.assertNotIn("已结清", text)
            self.assertNotIn("公户已打款", text)
            self.assertNotIn("DASHBOARD", text)
            self.assertNotIn("结清时间", text)
            parsed = ledger.parse_ledger(path)
            self.assertEqual(len(parsed), 1)
            self.assertEqual(parsed[0].invoice_number, "INV-1")
            self.assertEqual(parsed[0].source_sha256, "a" * 64)


if __name__ == "__main__":
    unittest.main()
