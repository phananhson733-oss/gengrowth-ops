"""drop-scan 双源:wiki 本地 _drop + ops 跨仓库报销投递区。
mby/pengman 在 ops 工作区放报销图片,baoxiao 跨仓库扫进 _inbox。"""
import argparse
import importlib.util
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

BAOXIAO_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BAOXIAO_DIR))


def _load(name):
    spec = importlib.util.spec_from_file_location(name, BAOXIAO_DIR / f"{name}.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


cli = _load("cli")


class ScanDropDirTests(unittest.TestCase):
    def test_moves_and_processes(self):
        with tempfile.TemporaryDirectory() as tmp:
            src = Path(tmp) / "报销"
            src.mkdir()
            (src / "invoice.png").write_bytes(b"IMG")
            inbox = Path(tmp) / "_inbox"
            n = cli._scan_drop_dir(src, "pengman", inbox)
            self.assertEqual(n, 1)
            self.assertTrue((inbox / "pengman" / "invoice.png").exists())
            self.assertTrue((src / ".processed" / "invoice.png").exists())
            self.assertFalse((src / "invoice.png").exists())  # 原文件已移走

    def test_skips_existing_in_inbox(self):
        with tempfile.TemporaryDirectory() as tmp:
            src = Path(tmp) / "报销"
            src.mkdir()
            (src / "dup.png").write_bytes(b"NEW")
            inbox = Path(tmp) / "_inbox"
            (inbox / "pengman").mkdir(parents=True)
            (inbox / "pengman" / "dup.png").write_bytes(b"OLD")
            n = cli._scan_drop_dir(src, "pengman", inbox)
            self.assertEqual(n, 0)
            self.assertEqual((inbox / "pengman" / "dup.png").read_bytes(), b"OLD")  # 没覆盖

    def test_skips_gitkeep_hidden_readme_and_dirs(self):
        with tempfile.TemporaryDirectory() as tmp:
            src = Path(tmp) / "报销"
            src.mkdir()
            (src / ".gitkeep").write_bytes(b"")
            (src / ".DS_Store").write_bytes(b"x")
            (src / "README.md").write_text("# 报销投递区说明", encoding="utf-8")  # 说明文件不该被搬
            (src / "sub").mkdir()
            inbox = Path(tmp) / "_inbox"
            n = cli._scan_drop_dir(src, "mby", inbox)
            self.assertEqual(n, 0)
            self.assertFalse((inbox / "mby" / "README.md").exists(), "README 说明不应被搬进 _inbox")
            self.assertTrue((src / "README.md").exists(), "README 应留在投递区原位")


class ResolveOpsExpenseDropsTests(unittest.TestCase):
    def test_resolves_from_yaml(self):
        with tempfile.TemporaryDirectory() as tmp:
            ops_root = Path(tmp) / "ops"
            (ops_root / "inbox-pengman" / "报销").mkdir(parents=True)
            yaml_path = Path(tmp) / "reimbursers.yaml"
            yaml_path.write_text(
                "ops_expense_drops:\n  pengman: inbox-pengman/报销\n  mby: inbox-mby/报销\n",
                encoding="utf-8")
            drops = cli._resolve_ops_expense_drops(ops_root=ops_root, yaml_path=yaml_path)
            self.assertEqual(drops["pengman"], ops_root / "inbox-pengman" / "报销")
            self.assertEqual(drops["mby"], ops_root / "inbox-mby" / "报销")

    def test_empty_when_no_config(self):
        with tempfile.TemporaryDirectory() as tmp:
            ops_root = Path(tmp) / "ops"
            ops_root.mkdir()
            yaml_path = Path(tmp) / "reimbursers.yaml"
            yaml_path.write_text("email_to_name:\n  a@b.com: Lynne\n", encoding="utf-8")
            self.assertEqual(cli._resolve_ops_expense_drops(ops_root=ops_root, yaml_path=yaml_path), {})

    def test_empty_when_ops_missing(self):
        with tempfile.TemporaryDirectory() as tmp:
            yaml_path = Path(tmp) / "reimbursers.yaml"
            yaml_path.write_text("ops_expense_drops:\n  mby: inbox-mby/报销\n", encoding="utf-8")
            # ops_root=None 且 _ops_root 探测不到 → {}
            with mock.patch.object(cli, "_ops_root", return_value=None):
                self.assertEqual(cli._resolve_ops_expense_drops(yaml_path=yaml_path), {})


class CmdDropScanDualSourceTests(unittest.TestCase):
    def test_scans_both_wiki_drop_and_ops(self):
        with tempfile.TemporaryDirectory() as tmp:
            # wiki _drop/wzb/ 一张
            wiki_drop = Path(tmp) / "_drop"
            (wiki_drop / "wzb").mkdir(parents=True)
            (wiki_drop / "wzb" / "wiki-invoice.pdf").write_bytes(b"WIKI")
            # ops 报销投递 pengman 一张
            ops_root = Path(tmp) / "ops"
            peng = ops_root / "inbox-pengman" / "报销"
            peng.mkdir(parents=True)
            (peng / "ops-invoice.png").write_bytes(b"OPS")
            yaml_path = Path(tmp) / "reimbursers.yaml"
            yaml_path.write_text("ops_expense_drops:\n  pengman: inbox-pengman/报销\n", encoding="utf-8")
            inbox = Path(tmp) / "_inbox"
            args = argparse.Namespace(drop_root=str(wiki_drop), inbox=str(inbox))
            with mock.patch.object(cli, "_ops_root", return_value=ops_root), \
                 mock.patch.object(cli, "REIMBURSERS_YAML", yaml_path):
                cli.cmd_drop_scan(args)
            # wiki 源 → _inbox/wzb
            self.assertTrue((inbox / "wzb" / "wiki-invoice.pdf").exists())
            # ops 源 → _inbox/pengman
            self.assertTrue((inbox / "pengman" / "ops-invoice.png").exists())
            self.assertTrue((peng / ".processed" / "ops-invoice.png").exists())


if __name__ == "__main__":
    unittest.main()
