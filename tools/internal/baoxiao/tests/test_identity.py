import hashlib
import importlib.util
import shutil
import tempfile
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).resolve().parents[1] / "identity.py"
SPEC = importlib.util.spec_from_file_location("identity", MODULE_PATH)
identity = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(identity)


class ContentSha256Tests(unittest.TestCase):
    def test_known_empty_vector(self):
        # sha256 of empty bytes is a well-known constant
        self.assertEqual(
            identity.content_sha256(b""),
            "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        )

    def test_same_bytes_same_hash(self):
        data = b"\x25PDF-1.4 fake invoice bytes"
        self.assertEqual(identity.content_sha256(data), identity.content_sha256(data))

    def test_different_bytes_differ(self):
        self.assertNotEqual(
            identity.content_sha256(b"invoice A"),
            identity.content_sha256(b"invoice B"),
        )

    def test_accepts_file_path(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "inv.pdf"
            payload = b"some invoice content"
            p.write_bytes(payload)
            self.assertEqual(
                identity.content_sha256(p),
                hashlib.sha256(payload).hexdigest(),
            )


# 最小合法单页 PDF,无文本对象(模拟扫描件) — pdftotext 输出 b'\x0c'
_TEXTLESS_PDF = b"""%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]>>endobj
xref
0 4
0000000000 65535 f
trailer<</Size 4/Root 1 0 R>>
startxref
0
%%EOF"""

_HAS_PDFTOTEXT = shutil.which("pdftotext") is not None


class PdfTextSha256Tests(unittest.TestCase):
    """v2.5.9:pdftotext 抽文本 → sha256。失败必须降级返回空串,不抛。"""

    def test_non_pdf_returns_empty(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "not-a-pdf.txt"
            p.write_text("hello", encoding="utf-8")
            self.assertEqual(identity.pdf_text_sha256(p), "")

    def test_nonexistent_returns_empty(self):
        self.assertEqual(identity.pdf_text_sha256("/nope/does-not-exist.pdf"), "")

    @unittest.skipUnless(_HAS_PDFTOTEXT, "pdftotext not installed")
    def test_invalid_pdf_returns_empty(self):
        """非真 PDF 但扩展名 .pdf → pdftotext 失败 → 空串(不抛)。"""
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "fake.pdf"
            p.write_bytes(b"not a real pdf at all")
            self.assertEqual(identity.pdf_text_sha256(p), "")

    @unittest.skipUnless(_HAS_PDFTOTEXT, "pdftotext not installed")
    def test_textless_scanned_pdf_returns_empty_not_formfeed_hash(self):
        """P0 回归测试:图像扫描件 pdftotext 成功返回 b'\\x0c'(form feed × 页数)。
        必须视为"无文本层"返回 "" — 否则所有扫描件互相碰撞,第二张起全部被
        误判 duplicate_by_content 静默吞进 _conflict。"""
        with tempfile.TemporaryDirectory() as tmp:
            p1 = Path(tmp) / "scan1.pdf"
            p2 = Path(tmp) / "scan2.pdf"
            p1.write_bytes(_TEXTLESS_PDF)
            p2.write_bytes(_TEXTLESS_PDF + b"   ")   # 字节不同的另一张扫描件
            self.assertEqual(identity.pdf_text_sha256(p1), "")
            self.assertEqual(identity.pdf_text_sha256(p2), "")

    def test_pdftotext_missing_returns_empty(self):
        """pdftotext 不在 PATH → FileNotFoundError → 降级 ""(打一次警告,不抛)。"""
        from unittest import mock
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "x.pdf"
            p.write_bytes(b"%PDF-fake")
            with mock.patch.object(identity.subprocess, "run",
                                   side_effect=FileNotFoundError):
                self.assertEqual(identity.pdf_text_sha256(p), "")

    def test_pdftotext_timeout_returns_empty(self):
        from unittest import mock
        import subprocess as sp
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "x.pdf"
            p.write_bytes(b"%PDF-fake")
            with mock.patch.object(
                identity.subprocess, "run",
                side_effect=sp.TimeoutExpired(cmd="pdftotext", timeout=10),
            ):
                self.assertEqual(identity.pdf_text_sha256(p), "")
                self.assertEqual(identity.extract_pdf_text_invoice_numbers(p), [])

    @unittest.skipUnless(_HAS_PDFTOTEXT, "pdftotext not installed")
    def test_real_invoice_produces_64_hex(self):
        """跑真实归档发票 — 验 64-hex 长度且可重复。"""
        real = Path("/Users/wzb/gengrowth-wiki/docs/05-governance/finance-payments/"
                    "发票/202606/Lynne/202606-差旅费-¥333.pdf")
        if not real.exists():
            self.skipTest("real invoice fixture not present")
        h1 = identity.pdf_text_sha256(real)
        self.assertEqual(len(h1), 64)
        self.assertTrue(all(c in "0123456789abcdef" for c in h1))
        # 同文件再算一次 → 一致(稳定可重现)
        self.assertEqual(identity.pdf_text_sha256(real), h1)


class ExtractNumbersRegexTests(unittest.TestCase):
    """v2.5.9:20 位号码 regex 的确定性单元测试(mock 文本层,不依赖 pdftotext)。"""

    def _extract_from_text(self, text: str):
        from unittest import mock
        with mock.patch.object(identity, "_read_pdf_text",
                               return_value=text.encode("utf-8")):
            return identity.extract_pdf_text_invoice_numbers("/fake/x.pdf")

    def test_plain_20_digit_extracted(self):
        self.assertEqual(self._extract_from_text("票号:12345678901234567890 完"),
                         ["12345678901234567890"])

    def test_21_digit_rejected(self):
        """21 位数字串不能误剥前 20 位。"""
        self.assertEqual(self._extract_from_text("流水 123456789012345678901 完"), [])

    def test_dedup_preserves_first_seen_order(self):
        text = ("a 11111111111111111111 b 22222222222222222222"
                " c 11111111111111111111")
        self.assertEqual(self._extract_from_text(text),
                         ["11111111111111111111", "22222222222222222222"])


class ExtractPdfTextInvoiceNumbersTests(unittest.TestCase):
    """v2.5.9 Day 3:抽 PDF 文本层 20 位发票号串。"""

    def test_non_pdf_returns_empty_list(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "not-a-pdf.txt"
            p.write_text("invoice number 12345678901234567890", encoding="utf-8")
            self.assertEqual(identity.extract_pdf_text_invoice_numbers(p), [])

    def test_nonexistent_returns_empty_list(self):
        self.assertEqual(
            identity.extract_pdf_text_invoice_numbers("/nope/missing.pdf"), [])

    def test_invalid_pdf_returns_empty_list(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "fake.pdf"
            p.write_bytes(b"not a real pdf")
            self.assertEqual(identity.extract_pdf_text_invoice_numbers(p), [])

    def test_real_invoice_extracts_20_digit_number(self):
        real = Path("/Users/wzb/gengrowth-wiki/docs/05-governance/finance-payments/"
                    "发票/202606/Lynne/202606-差旅费-¥333.pdf")
        if not real.exists():
            self.skipTest("real invoice fixture not present")
        nums = identity.extract_pdf_text_invoice_numbers(real)
        # 携程电子普通发票号 = 20 位,至少抽到 1 个
        self.assertGreaterEqual(len(nums), 1)
        for n in nums:
            self.assertEqual(len(n), 20)
            self.assertTrue(n.isdigit())


class NormalizeInvoiceKeyTests(unittest.TestCase):
    def test_strips_all_whitespace(self):
        self.assertEqual(identity.normalize_invoice_key("  123 456 "), "123456")

    def test_fullwidth_digits_to_halfwidth(self):
        self.assertEqual(identity.normalize_invoice_key("１２３４"), "1234")

    def test_strips_no_dot_prefix(self):
        self.assertEqual(identity.normalize_invoice_key("No.12345"), "12345")
        self.assertEqual(identity.normalize_invoice_key("NO. 12345"), "12345")

    def test_strips_hash_prefix(self):
        self.assertEqual(identity.normalize_invoice_key("#12345"), "12345")

    def test_uppercases_letters(self):
        self.assertEqual(identity.normalize_invoice_key("abc123"), "ABC123")

    def test_empty_and_whitespace_yield_empty(self):
        self.assertEqual(identity.normalize_invoice_key(""), "")
        self.assertEqual(identity.normalize_invoice_key("   "), "")

    def test_none_yields_empty(self):
        self.assertEqual(identity.normalize_invoice_key(None), "")


if __name__ == "__main__":
    unittest.main()
