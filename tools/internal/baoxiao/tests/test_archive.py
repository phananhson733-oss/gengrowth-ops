import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import archive  # noqa: E402
import identity  # noqa: E402


def _mk(tmp, name, data):
    p = Path(tmp) / name
    p.write_bytes(data)
    return p


# task doc 风格:文件名带 category(归档时定型)
COMMON = dict(reimburser="王玲", period="202601", category="差旅费", currency="CNY", amount=1000)


class ArchiveNewTests(unittest.TestCase):
    def test_new_invoice_archived_atomically(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp) / "发票"
            src = _mk(tmp, "drop.pdf", b"INV-A-bytes")
            r = archive.archive_invoice(src, root, invoice_number="No.11113847", **COMMON)
            self.assertTrue(r.is_new)
            self.assertEqual(r.reason, "new")
            self.assertEqual(r.content_hash, identity.content_sha256(b"INV-A-bytes"))
            self.assertEqual(r.path, root / "202601" / "王玲" / "202601-差旅费-¥1000.pdf")
            self.assertEqual(r.path.read_bytes(), b"INV-A-bytes")

    def test_src_not_moved(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp) / "发票"
            src = _mk(tmp, "drop.pdf", b"keep me")
            archive.archive_invoice(src, root, invoice_number="1", **COMMON)
            self.assertTrue(src.exists())


class ArchiveDedupTests(unittest.TestCase):
    def test_duplicate_content_not_rewritten(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp) / "发票"
            r1 = archive.archive_invoice(_mk(tmp, "d1.pdf", b"SAME"), root, invoice_number="1", **COMMON)
            r2 = archive.archive_invoice(_mk(tmp, "d2.pdf", b"SAME"), root, invoice_number="1", **COMMON)
            self.assertFalse(r2.is_new)
            self.assertEqual(r2.reason, "duplicate_content")
            self.assertEqual(r2.path, r1.path)
            self.assertEqual(len(list(root.rglob("*.pdf"))), 1)


class ArchiveCollisionTests(unittest.TestCase):
    def test_name_collision_appends_invoice_suffix(self):
        """同期同类同额 → 用发票号末 4 位做后缀区分(Ahrefs Invoice + Receipt 场景)。"""
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp) / "发票"
            ra = archive.archive_invoice(_mk(tmp, "a.pdf", b"AAA"), root, invoice_number="11113847", **COMMON)
            rb = archive.archive_invoice(_mk(tmp, "b.pdf", b"BBB"), root, invoice_number="22229999", **COMMON)
            self.assertEqual(ra.path.name, "202601-差旅费-¥1000.pdf")
            self.assertEqual(rb.reason, "collision_suffixed")
            self.assertEqual(rb.path.name, "202601-差旅费-¥1000-9999.pdf")
            self.assertTrue(ra.path.exists() and rb.path.exists())


if __name__ == "__main__":
    unittest.main()
