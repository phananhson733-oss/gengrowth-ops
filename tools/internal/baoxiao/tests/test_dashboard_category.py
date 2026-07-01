"""v2.5.10:费用类型分布并进 dashboard(原 -summary.md 独有内容实时化,砍掉独立 summary)。"""
import importlib.util
import sys
import tempfile
import unittest
from pathlib import Path

BAOXIAO_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BAOXIAO_DIR))


def _load(name):
    spec = importlib.util.spec_from_file_location(name, BAOXIAO_DIR / f"{name}.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


ledger = _load("ledger")


def _row(id8, cat, amt):
    return ledger.LedgerRow(
        id8=id8, file_rel=f"发票/202606/Lynne/x-{id8}.pdf",
        reimburser="Lynne", category=cat, amount=amt, invoice_number=id8,
        period="202606", submit_date="2026-06-01 14:30",
        settled=ledger.SETTLED_PENDING, note="",
        invoice_type="普票", billed_to=ledger.DOMESTIC_TITLE,
    )


class DashboardCategoryBreakdownTests(unittest.TestCase):
    def test_main_dashboard_includes_category_breakdown(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = ledger.ledger_path_for("2026-06", Path(tmp) / "报销", reimburser="Lynne")
            ledger.append_row(p, _row("aaaaaaaa", "差旅费", 1000.0))
            ledger.append_row(p, _row("bbbbbbbb", "差旅费", 500.0))
            ledger.append_row(p, _row("cccccccc", "办公费", 2000.0))
            ledger.refresh_dashboard(p)
            text = p.read_text("utf-8")
            self.assertIn("## 📊 按费用类型", text)
            # 差旅费 2 笔、办公费 1 笔(聚合正确)
            self.assertRegex(text, r"差旅费\s*\|\s*2\s*\|")
            self.assertRegex(text, r"办公费\s*\|\s*1\s*\|")
            # 办公费 ¥2000 金额最大,应排在差旅费(¥1500)之前
            self.assertLess(text.index("办公费 |"), text.index("差旅费 |"))

    def test_breakdown_sits_between_summary_and_full_table(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = ledger.ledger_path_for("2026-06", Path(tmp) / "报销", reimburser="Lynne")
            ledger.append_row(p, _row("aaaaaaaa", "差旅费", 1000.0))
            ledger.refresh_dashboard(p)
            text = p.read_text("utf-8")
            self.assertLess(text.index("## 📊 本月汇总"), text.index("## 📊 按费用类型"))
            self.assertLess(text.index("## 📊 按费用类型"), text.index("## 📒 全部发票"))


if __name__ == "__main__":
    unittest.main()
