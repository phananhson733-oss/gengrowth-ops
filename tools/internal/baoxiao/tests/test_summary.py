"""月度汇总 markdown 生成:从账本读 → 写 `{月}/{报销人}-summary.md`(per-reimburser)。"""
import importlib.util
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import ledger  # noqa: E402

MODULE_PATH = Path(__file__).resolve().parents[1] / "summary.py"
SPEC = importlib.util.spec_from_file_location("summary", MODULE_PATH)
summary = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(summary)


def _row(id8, **kw):
    # v2.5.1:invoice_number = id8 字符串(对齐 markdown 实际 PK)
    base = dict(
        id8=id8, file_rel=f"发票/202601/王玲/{id8}.pdf",
        reimburser="王玲", category="差旅费",
        amount=1000.0, invoice_number=id8,
        period="202601", submit_date="2026-06-01 14:30",
        settled=ledger.SETTLED_PENDING, note="",
    )
    base.update(kw)
    return ledger.LedgerRow(**base)


class SummaryHappyTests(unittest.TestCase):
    def test_generates_summary_with_totals_and_categories(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            src = ledger.ledger_path_for("2026-06", root, reimburser="王玲")
            ledger.append_row(src, _row("aaaaaaaa", category="差旅费", amount=1000,
                                         settled=ledger.SETTLED_OK))
            ledger.append_row(src, _row("bbbbbbbb", category="差旅费", amount=500))
            ledger.append_row(src, _row("cccccccc", category="办公费", amount=2000))
            outs = summary.write_summary(root, "2026-06")
            self.assertEqual(len(outs), 1)
            out = outs[0]
            self.assertTrue(out.exists())
            self.assertEqual(out.name, "王玲-summary.md")
            self.assertEqual(out.parent.name, "2026-06")
            txt = out.read_text(encoding="utf-8")
            self.assertIn("title: 报销汇总 — 2026-06 — 王玲", txt)
            self.assertIn("type: expense-summary", txt)
            self.assertIn("**3** 笔", txt)
            self.assertIn("**1** 笔", txt)
            self.assertIn("**2** 笔", txt)
            self.assertIn("差旅费", txt)
            self.assertIn("办公费", txt)
            self.assertIn("| bbbbbbbb |", txt)
            self.assertIn("| cccccccc |", txt)
            self.assertNotIn("| aaaaaaaa |", txt.split("未结清明细")[1] if "未结清明细" in txt else "")


class SummaryCarryInTests(unittest.TestCase):
    def test_carry_in_rows_counted_separately(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            src = ledger.ledger_path_for("2026-07", root, reimburser="王玲")
            ledger.append_row(src, _row("aaaaaaaa", category="差旅费", amount=1000))
            ledger.append_row(src, _row("bbbbbbbb", category="办公费", amount=2000,
                                         note="← 自 2026-06"))
            outs = summary.write_summary(root, "2026-07")
            txt = outs[0].read_text(encoding="utf-8")
            self.assertIn("本月新发生", txt)
            self.assertIn("上月延续过来", txt)


class SummaryEmptyTests(unittest.TestCase):
    def test_empty_ledger_generates_no_summary(self):
        """新结构下没账本目录 → 无报销人 → 不生成任何 summary。"""
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            outs = summary.write_summary(root, "2026-06")
            self.assertEqual(outs, [])


class SummaryMultiReimburserTests(unittest.TestCase):
    def test_each_reimburser_gets_own_summary(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            lynne = ledger.ledger_path_for("2026-06", root, reimburser="Lynne")
            wzb = ledger.ledger_path_for("2026-06", root, reimburser="wzb")
            ledger.append_row(lynne, _row("aaaaaaaa", reimburser="Lynne", amount=100))
            ledger.append_row(wzb, _row("bbbbbbbb", reimburser="wzb", amount=200))
            outs = summary.write_summary(root, "2026-06")
            self.assertEqual(len(outs), 2)
            names = {p.name for p in outs}
            self.assertIn("Lynne-summary.md", names)
            self.assertIn("wzb-summary.md", names)


class WriteTotalTests(unittest.TestCase):
    """v2.5 K:跨月跨人总表 `{ledger_root}/总表.md`,主键 = invoice_number。"""

    def test_total_aggregates_across_months_and_reimbursers(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            # 3 月 Lynne 已结清(国内,gengrowth)
            ledger.append_row(
                ledger.ledger_path_for("2026-03", root, reimburser="Lynne"),
                _row("aaaaaaaa",
                     invoice_number="100012", invoice_type="domestic",
                     billed_to=ledger.DOMESTIC_TITLE,
                     settled=ledger.SETTLED_OK, settled_date="2026-03-15"),
            )
            # 4 月 wzb 未结清(海外 invoice)
            ledger.append_row(
                ledger.ledger_path_for("2026-04", root, reimburser="wzb"),
                _row("bbbbbbbb",
                     invoice_number="ABCD-0001", invoice_type="overseas",
                     billed_to="kellyzjiang@gmail.com"),
            )
            self.assertTrue(summary.write_total(root))
            out = root / "总表.md"
            self.assertTrue(out.exists())
            txt = out.read_text(encoding="utf-8")
            # 已结清表里看到 Lynne 那张
            self.assertIn("`100012`", txt)
            # v2.5.8:总表里渲染 settled_date 截到日级
            self.assertIn("2026-03-15", txt)
            self.assertNotIn("10:00", txt)
            # 未结清表里看到 wzb 那张
            self.assertIn("`ABCD-0001`", txt)
            self.assertIn("kellyzjiang@gmail.com", txt)
            # 拆两节
            self.assertIn("✅ 已结清", txt)
            self.assertIn("⬜ 未结清", txt)

    def test_total_idempotent_no_write_when_unchanged(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            ledger.append_row(
                ledger.ledger_path_for("2026-03", root, reimburser="Lynne"),
                _row("aaaaaaaa", invoice_number="X1"),
            )
            first = summary.write_total(root)
            self.assertTrue(first)
            # 第二次跑,内容不变 → 不写盘
            second = summary.write_total(root)
            self.assertFalse(second)


class SummaryOverwriteTests(unittest.TestCase):
    def test_overwrites_existing_summary(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            src = ledger.ledger_path_for("2026-06", root, reimburser="王玲")
            ledger.append_row(src, _row("aaaaaaaa", amount=100))
            summary.write_summary(root, "2026-06")
            ledger.append_row(src, _row("bbbbbbbb", amount=200))
            outs = summary.write_summary(root, "2026-06")
            txt = outs[0].read_text(encoding="utf-8")
            self.assertIn("**2** 笔", txt)
            self.assertNotIn("**1** 笔,**¥100", txt)


if __name__ == "__main__":
    unittest.main()
