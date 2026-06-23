import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import index  # noqa: E402


class IndexTests(unittest.TestCase):
    def test_get_missing_returns_none(self):
        with tempfile.TemporaryDirectory() as tmp:
            idx = index.RecordIndex(Path(tmp) / "idx.json")
            self.assertIsNone(idx.get("deadbeef"))

    def test_set_then_get(self):
        with tempfile.TemporaryDirectory() as tmp:
            idx = index.RecordIndex(Path(tmp) / "idx.json")
            idx.set("hashA", "rec_001")
            self.assertEqual(idx.get("hashA"), "rec_001")

    def test_persists_across_instances(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "idx.json"
            index.RecordIndex(p).set("hashA", "rec_001")
            self.assertEqual(index.RecordIndex(p).get("hashA"), "rec_001")

    def test_save_is_atomic_no_partial_file(self):
        # 保存后目录里不应残留临时文件(原子 replace)
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "idx.json"
            idx = index.RecordIndex(p)
            idx.set("h", "r")
            leftovers = [f for f in Path(tmp).iterdir() if f.name != "idx.json"]
            self.assertEqual(leftovers, [])

    def test_corrupt_file_treated_as_empty(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "idx.json"
            p.write_text("{ not valid json", encoding="utf-8")
            idx = index.RecordIndex(p)
            self.assertIsNone(idx.get("anything"))

    def test_invalidate_removes_entry(self):
        with tempfile.TemporaryDirectory() as tmp:
            idx = index.RecordIndex(Path(tmp) / "idx.json")
            idx.set("h", "r")
            idx.invalidate("h")
            self.assertIsNone(idx.get("h"))


if __name__ == "__main__":
    unittest.main()
