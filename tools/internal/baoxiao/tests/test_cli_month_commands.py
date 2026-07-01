"""P1#3 护栏:month-end / month-start / uncarry 三个核心不变量的 CLI 层测试。

review 暴露的缺口:transfer 纯函数层有测,但 CLI 的默认选月、开关、不结转编排全部裸奔。
锁定:
- month-end **不 carry、不建下月**(月末只汇总,给员工整月结清窗口)
- month-start 默认 close **上月**(1 号跑不能 close 当月)
- uncarry 默认 **dry-run**,仅 --apply 真跑(危险回滚开关写反 = 一条预览命令销毁线上账本)
"""
import argparse
import datetime
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
ledger = _load("ledger")


def _args(**kw):
    base = dict(month=None, ledger_root=None, archive_root=None,
                petty_ledger_root=None, overseas_archive_root=None,
                to_month=None, apply=False)
    base.update(kw)
    return argparse.Namespace(**base)


def _tmp_roots(tmp):
    """返回 4 个 tmp root 字符串,彻底隔离真实仓库。"""
    return dict(
        ledger_root=str(Path(tmp) / "报销"),
        archive_root=str(Path(tmp) / "发票"),
        petty_ledger_root=str(Path(tmp) / "备用金"),
        overseas_archive_root=str(Path(tmp) / "invoice"),
    )


def _seed_pending(tmp, month, reimburser, id8):
    root = Path(tmp) / "报销"
    p = ledger.ledger_path_for(month, root, reimburser=reimburser)
    ledger.append_row(p, ledger.LedgerRow(
        id8=id8, file_rel=f"发票/{month.replace('-', '')}/{reimburser}/x-{id8}.pdf",
        reimburser=reimburser, category="差旅费", amount=100.0,
        invoice_number=id8, period=month.replace("-", ""),
        submit_date="2026-06-01 14:30", settled=ledger.SETTLED_PENDING, note="",
    ))
    return p


class MonthEndContractTests(unittest.TestCase):
    """month-end 不结转、不建下月(核心设计不变量)。"""

    def test_does_not_carry_or_build_next_month(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp) / "报销"
            _seed_pending(tmp, "2026-06", "Lynne", "aaaaaaaa")
            cli.cmd_month_end(_args(month="2026-06", **_tmp_roots(tmp)))
            self.assertFalse((root / "2026-07").exists(), "month-end 不应创建下月目录")
            src = ledger.find_by_id8(root / "2026-06" / "Lynne.md", "aaaaaaaa")
            self.assertNotIn("↗", src.note or "", "month-end 不应 carry(源 row 不应被标 ↗)")
            self.assertTrue((root / "总表.md").exists(), "month-end 应刷新跨月总表")
            self.assertFalse((root / "2026-06" / "Lynne-summary.md").exists(),
                             "month-end 不再生成独立 -summary.md(v2.5.10 费用类型已并进 dashboard)")


class MonthStartDefaultMonthTests(unittest.TestCase):
    """month-start 默认 close 上月。"""

    def test_defaults_to_previous_month_not_current(self):
        """默认月必须 = prev_month(today),否则 7-1 跑会 close 7 月、carry 不到东西。"""
        captured = {}
        with mock.patch.object(cli, "_run_month_start",
                               side_effect=lambda month, *a: captured.__setitem__("month", month)):
            cli.cmd_month_start(_args(month=None))
        expected = cli.transfer.prev_month(datetime.date.today().strftime("%Y-%m"))
        self.assertEqual(captured.get("month"), expected,
                         "month-start 默认必须是上月(prev_month(today))")

    def test_explicit_month_carries_to_next(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp) / "报销"
            _seed_pending(tmp, "2026-06", "Lynne", "aaaaaaaa")
            cli.cmd_month_start(_args(month="2026-06", **_tmp_roots(tmp)))
            self.assertTrue((root / "2026-07" / "Lynne.md").exists(), "应 carry 6 月未结清到 7 月")
            self.assertFalse((root / "2026-08").exists(), "不应 close 7 月 carry 到 8 月")
            self.assertIn("↗", (ledger.find_by_id8(root / "2026-06" / "Lynne.md", "aaaaaaaa").note or ""))


class UncarryDryRunDefaultTests(unittest.TestCase):
    """uncarry 默认 dry-run,仅 --apply 真跑(危险回滚开关)。"""

    def _setup_carried(self, tmp):
        root = Path(tmp) / "报销"
        _seed_pending(tmp, "2026-06", "Lynne", "aaaaaaaa")
        cli.transfer.carry_forward(ledger_root=root, from_month="2026-06")
        return root

    def test_defaults_to_dry_run(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = self._setup_carried(tmp)
            cli.cmd_uncarry(_args(month="2026-06", apply=False, **_tmp_roots(tmp)))
            self.assertIsNotNone(ledger.find_by_id8(root / "2026-07" / "Lynne.md", "aaaaaaaa"),
                                 "默认 dry-run 不应删 7 月 row")
            self.assertIn("↗", (ledger.find_by_id8(root / "2026-06" / "Lynne.md", "aaaaaaaa").note or ""),
                          "默认 dry-run 不应撤 6 月 ↗")

    def test_apply_actually_reverts(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = self._setup_carried(tmp)
            cli.cmd_uncarry(_args(month="2026-06", apply=True, **_tmp_roots(tmp)))
            self.assertIsNone(ledger.find_by_id8(root / "2026-07" / "Lynne.md", "aaaaaaaa"),
                              "--apply 应删 7 月 row")
            self.assertNotIn("↗", (ledger.find_by_id8(root / "2026-06" / "Lynne.md", "aaaaaaaa").note or ""),
                             "--apply 应撤 6 月 ↗")


if __name__ == "__main__":
    unittest.main()
