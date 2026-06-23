"""transfer.carry_forward(B 方案):未报销 row 账本迁移,文件不动。"""
import importlib.util
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import ledger  # noqa: E402

MODULE_PATH = Path(__file__).resolve().parents[1] / "transfer.py"
SPEC = importlib.util.spec_from_file_location("transfer", MODULE_PATH)
transfer = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(transfer)


def _row(id8, **kw):
    # v2.5.1:PK 改用 invoice_number,test factory 直接让 invoice_number = id8 字符串,
    # 这样 test 用的 hardcoded 字符串("aaaaaaaa" 等)对应 parse 出来的 row.id8。
    base = dict(
        id8=id8,
        file_rel=f"发票/202601/王玲/x-{id8}.pdf",
        reimburser="王玲",
        category="差旅费",
        amount=1000.0,
        invoice_number=id8,
        period="202601",
        submit_date="2026-06-01 14:30",
        settled=ledger.SETTLED_PENDING,
        note="",
    )
    base.update(kw)
    return ledger.LedgerRow(**base)


class NextMonthTests(unittest.TestCase):
    def test_normal(self):
        self.assertEqual(transfer.next_month("2026-06"), "2026-07")

    def test_year_boundary(self):
        self.assertEqual(transfer.next_month("2026-12"), "2027-01")

    def test_january(self):
        self.assertEqual(transfer.next_month("2026-01"), "2026-02")


class CarryForwardHappyTests(unittest.TestCase):
    def test_pending_row_carried_to_next_month(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            src = ledger.ledger_path_for("2026-06", root, reimburser="王玲")
            ledger.append_row(src, _row("aaaaaaaa"))   # 默认 pending
            results = transfer.carry_forward(ledger_root=root, from_month="2026-06")
            self.assertEqual(len(results), 1)
            self.assertEqual(results[0].status, "carried")
            self.assertEqual(results[0].to_month, "2026-07")

            # 源月 row 标 ↗
            src_row = ledger.find_by_id8(src, "aaaaaaaa")
            self.assertIn(transfer.CARRY_OUT_MARK, src_row.note)
            self.assertIn("2026-07", src_row.note)

            # 目标月 row 标 ←
            dst = ledger.ledger_path_for("2026-07", root, reimburser="王玲")
            self.assertTrue(dst.exists())
            dst_row = ledger.find_by_id8(dst, "aaaaaaaa")
            self.assertIsNotNone(dst_row)
            self.assertIn(transfer.CARRY_IN_MARK, dst_row.note)
            self.assertIn("2026-06", dst_row.note)
            # 状态保留(approval / payment 不重置)
            self.assertEqual(dst_row.approval, ledger.APPROVAL_PENDING)
            self.assertEqual(dst_row.amount, 1000.0)
            self.assertEqual(dst_row.category, "差旅费")

    def test_pending_settled_carried(self):
        """settled=⬜ → carry。审批+打款合并语义后,只有一个状态字段。"""
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            src = ledger.ledger_path_for("2026-06", root, reimburser="王玲")
            ledger.append_row(src, _row("bbbbbbbb", settled=ledger.SETTLED_PENDING))
            results = transfer.carry_forward(ledger_root=root, from_month="2026-06")
            self.assertEqual(results[0].status, "carried")


class CarryForwardSkipTests(unittest.TestCase):
    def test_fully_done_skipped(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            src = ledger.ledger_path_for("2026-06", root, reimburser="王玲")
            ledger.append_row(src, _row("cccccccc", settled=ledger.SETTLED_OK))
            results = transfer.carry_forward(ledger_root=root, from_month="2026-06")
            self.assertEqual(results[0].status, "skipped_done")
            # 目标月不存在(没建)
            self.assertFalse(ledger.ledger_path_for("2026-07", root, reimburser="王玲").exists())
            # 源月 row 没标 ↗
            src_row = ledger.find_by_id8(src, "cccccccc")
            self.assertNotIn(transfer.CARRY_OUT_MARK, src_row.note)

    def test_already_carried_skipped(self):
        """重跑 monthly-close 不应该重复 carry。"""
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            src = ledger.ledger_path_for("2026-06", root, reimburser="王玲")
            ledger.append_row(src, _row("dddddddd"))
            transfer.carry_forward(ledger_root=root, from_month="2026-06")   # 第 1 次
            results = transfer.carry_forward(ledger_root=root, from_month="2026-06")  # 第 2 次
            self.assertEqual(results[0].status, "skipped_already")
            # 目标月只一行
            dst = ledger.ledger_path_for("2026-07", root, reimburser="王玲")
            self.assertEqual(len(ledger.parse_ledger(dst)), 1)


class CarryForwardCrossMonthTests(unittest.TestCase):
    def test_carry_to_existing_target_month_does_not_duplicate(self):
        """目标月账本已有同 id8(比如手动加过)→ 不重复 append,但源月仍标 ↗。"""
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            src = ledger.ledger_path_for("2026-06", root, reimburser="王玲")
            dst = ledger.ledger_path_for("2026-07", root, reimburser="王玲")
            ledger.append_row(src, _row("eeeeeeee"))
            ledger.append_row(dst, _row("eeeeeeee", note="已经在目标月"))   # 先就在
            transfer.carry_forward(ledger_root=root, from_month="2026-06")
            self.assertEqual(len(ledger.parse_ledger(dst)), 1)
            # 源月仍标了 ↗
            src_row = ledger.find_by_id8(src, "eeeeeeee")
            self.assertIn(transfer.CARRY_OUT_MARK, src_row.note)


class CarryForwardMixedTests(unittest.TestCase):
    def test_mixed_rows_only_pending_carried(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            src = ledger.ledger_path_for("2026-06", root, reimburser="王玲")
            ledger.append_row(src, _row("11111111"))                                  # pending
            ledger.append_row(src, _row("22222222", settled=ledger.SETTLED_OK))       # done
            results = transfer.carry_forward(ledger_root=root, from_month="2026-06")
            by_id = {r.id8: r for r in results}
            self.assertEqual(by_id["11111111"].status, "carried")
            self.assertEqual(by_id["22222222"].status, "skipped_done")
            dst_rows = ledger.parse_ledger(ledger.ledger_path_for("2026-07", root, reimburser="王玲"))
            dst_ids = {r.id8 for r in dst_rows}
            self.assertEqual(dst_ids, {"11111111"})


class CarryForwardDualLedgerTests(unittest.TestCase):
    """v2.5.8 codex bug:cmd_monthly_close 必须同时跑主+备用金账本。
    备用金账本未结清 invoice 也要顺延,否则下月看不到。"""

    def test_petty_ledger_carries_independently(self):
        with tempfile.TemporaryDirectory() as tmp:
            main = Path(tmp) / "报销"
            petty = Path(tmp) / "备用金"
            # 主账本:1 张普票
            main_path = ledger.ledger_path_for("2026-06", main, reimburser="Lynne")
            ledger.append_row(main_path, _row("aaaaaaaa", invoice_type="普票",
                                              billed_to=ledger.DOMESTIC_TITLE))
            # 备用金账本:1 张 invoice
            petty_path = ledger.ledger_path_for("2026-06", petty, reimburser="Lynne")
            ledger.append_row(petty_path, _row("bbbbbbbb", invoice_type="invoice",
                                               billed_to="Wang Ling", currency="USD"))
            main_res = transfer.carry_forward(ledger_root=main, from_month="2026-06")
            petty_res = transfer.carry_forward(ledger_root=petty, from_month="2026-06")
            self.assertEqual(len([r for r in main_res if r.status == "carried"]), 1)
            self.assertEqual(len([r for r in petty_res if r.status == "carried"]), 1)
            # 各自下月账本都有
            self.assertTrue((main / "2026-07" / "Lynne.md").exists())
            self.assertTrue((petty / "2026-07" / "Lynne.md").exists())
            # 主账本下月不含 invoice row(在备用金账本里),反之
            self.assertNotIn("bbbbbbbb", (main / "2026-07" / "Lynne.md").read_text("utf-8"))
            self.assertNotIn("aaaaaaaa", (petty / "2026-07" / "Lynne.md").read_text("utf-8"))


class CarryForwardEmptyTests(unittest.TestCase):
    def test_no_source_ledger_returns_empty(self):
        with tempfile.TemporaryDirectory() as tmp:
            results = transfer.carry_forward(ledger_root=Path(tmp), from_month="2026-06")
            self.assertEqual(results, [])


class CarryForwardAPlanFileMoveTests(unittest.TestCase):
    """v2.5 A 方案:row + 物理文件一起挪到下月归档目录。"""

    def test_pending_row_file_moved_to_next_month_dir(self):
        with tempfile.TemporaryDirectory() as tmp:
            wiki_root = Path(tmp)
            archive_root = wiki_root / "发票"
            ledger_root = wiki_root / "报销"
            # 源月 6 月物理发票 + ledger row
            src_pdf_dir = archive_root / "202606" / "王玲"
            src_pdf_dir.mkdir(parents=True)
            src_pdf = src_pdf_dir / "202606-办公费-¥1000.pdf"
            src_pdf.write_bytes(b"FAKE-INVOICE-BYTES")

            src_ledger = ledger.ledger_path_for("2026-06", ledger_root, reimburser="王玲")
            ledger.append_row(src_ledger, _row(
                "aaaaaaaa",
                file_rel="发票/202606/王玲/202606-办公费-¥1000.pdf",
                period="202606",
            ))

            results = transfer.carry_forward(
                ledger_root=ledger_root, from_month="2026-06",
                wiki_root=wiki_root, archive_root=archive_root,
            )
            self.assertEqual(results[0].status, "carried")

            # v2.5.5:物理文件挪到 7 月 + 文件名前缀也跟着改月份(202606 → 202607)
            new_pdf = archive_root / "202607" / "王玲" / "202607-办公费-¥1000.pdf"
            self.assertTrue(new_pdf.exists(), "文件应该 mv 到 7 月目录,且文件名前缀改成 202607")
            self.assertFalse(src_pdf.exists(), "源月物理文件不应该还在")

            # 7 月 ledger row 的 file_rel 已经更新
            dst_ledger = ledger.ledger_path_for("2026-07", ledger_root, reimburser="王玲")
            dst_row = ledger.find_by_id8(dst_ledger, "aaaaaaaa")
            self.assertEqual(dst_row.file_rel, "发票/202607/王玲/202607-办公费-¥1000.pdf")
            self.assertEqual(dst_row.period, "202607")

    def test_b_plan_compat_when_wiki_root_not_passed(self):
        """老调用方未传 wiki_root → 仍是 B 方案(file_rel/period 跟着源 row 不动),给单测兼容。"""
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            src = ledger.ledger_path_for("2026-06", root, reimburser="王玲")
            src_row = _row("bbbbbbbb",
                            file_rel="发票/202606/王玲/x-bbbbbbbb.pdf",
                            period="202606")
            ledger.append_row(src, src_row)
            results = transfer.carry_forward(ledger_root=root, from_month="2026-06")
            self.assertEqual(results[0].status, "carried")
            dst = ledger.ledger_path_for("2026-07", root, reimburser="王玲")
            dst_row = ledger.find_by_id8(dst, "bbbbbbbb")
            # B 方案兼容:file_rel + period 都保持源 row 值(没 relocate 文件)
            self.assertEqual(dst_row.file_rel, "发票/202606/王玲/x-bbbbbbbb.pdf")
            self.assertEqual(dst_row.period, "202606")


class CarryForwardContinuousTests(unittest.TestCase):
    """v2.5.5:未结清 row 应该每月持续顺移,直到 Lynne 勾结清为止。
    monthly-close 每月最后一天跑;源月 row 已含 ↗ → 不会重复 carry。
    目标月 row 含 ← carry-in 标记,但不阻塞下一轮 carry。
    """

    def test_unsettled_row_carries_across_multiple_months(self):
        with tempfile.TemporaryDirectory() as tmp:
            wiki_root = Path(tmp)
            archive_root = wiki_root / "发票"
            ledger_root = wiki_root / "报销"
            # 5 月一张未结清发票
            src_pdf_dir = archive_root / "202605" / "Lynne"
            src_pdf_dir.mkdir(parents=True)
            (src_pdf_dir / "202605-研发费用-¥500.pdf").write_bytes(b"FAKE")
            ledger.append_row(
                ledger.ledger_path_for("2026-05", ledger_root, reimburser="Lynne"),
                _row("inv-May-001",
                     reimburser="Lynne",
                     file_rel="发票/202605/Lynne/202605-研发费用-¥500.pdf",
                     period="202605"),
            )

            # 5 月底 monthly-close → carry 到 6 月
            r1 = transfer.carry_forward(ledger_root=ledger_root, from_month="2026-05",
                                        wiki_root=wiki_root, archive_root=archive_root)
            self.assertEqual(r1[0].status, "carried")

            # 6 月文件应该在 202606/ 且文件名前缀 202606
            self.assertTrue((archive_root / "202606" / "Lynne" / "202606-研发费用-¥500.pdf").exists())

            # 6 月底 monthly-close → 应该再 carry 到 7 月(Lynne 仍未勾结清)
            r2 = transfer.carry_forward(ledger_root=ledger_root, from_month="2026-06",
                                        wiki_root=wiki_root, archive_root=archive_root)
            self.assertEqual(r2[0].status, "carried", "carry-in row 应该能被再 carry,不被 ← 标记阻塞")

            # 7 月也有这张 row,文件名 202607
            jul_ledger = ledger.ledger_path_for("2026-07", ledger_root, reimburser="Lynne")
            jul_row = ledger.find_by_id8(jul_ledger, "inv-May-001")
            self.assertIsNotNone(jul_row)
            self.assertEqual(jul_row.period, "202607")
            self.assertTrue((archive_root / "202607" / "Lynne" / "202607-研发费用-¥500.pdf").exists())

            # 5 月 + 6 月源 row 都标了 ↗ 延至,再跑 monthly-close 不会重复 carry
            r1_again = transfer.carry_forward(ledger_root=ledger_root, from_month="2026-05",
                                              wiki_root=wiki_root, archive_root=archive_root)
            self.assertEqual(r1_again[0].status, "skipped_already")
            r2_again = transfer.carry_forward(ledger_root=ledger_root, from_month="2026-06",
                                              wiki_root=wiki_root, archive_root=archive_root)
            self.assertEqual(r2_again[0].status, "skipped_already")


class RelocateFileFilenamePrefixTests(unittest.TestCase):
    """v2.5.5:relocate_file 把文件名前缀 YYYYMM 也替换成目标月。"""

    def test_filename_prefix_rewritten_to_target_month(self):
        with tempfile.TemporaryDirectory() as tmp:
            wiki = Path(tmp)
            archive = wiki / "发票"
            src_dir = archive / "202605" / "Lynne"
            src_dir.mkdir(parents=True)
            (src_dir / "202605-福利费-¥321.48.pdf").write_bytes(b"X")
            new_rel = transfer.relocate_file(
                wiki_root=wiki, archive_root=archive,
                file_rel="发票/202605/Lynne/202605-福利费-¥321.48.pdf",
                target_month="2026-07", reimburser="Lynne",
            )
            self.assertEqual(new_rel, "发票/202607/Lynne/202607-福利费-¥321.48.pdf")
            self.assertTrue((archive / "202607" / "Lynne" / "202607-福利费-¥321.48.pdf").exists())

    def test_non_yyyymm_filename_unchanged(self):
        """文件名不以 YYYYMM 开头的(老格式 / 手动加的)→ 只 mv 不改名。"""
        with tempfile.TemporaryDirectory() as tmp:
            wiki = Path(tmp)
            archive = wiki / "发票"
            src_dir = archive / "202605" / "Lynne"
            src_dir.mkdir(parents=True)
            (src_dir / "weird-invoice.pdf").write_bytes(b"X")
            new_rel = transfer.relocate_file(
                wiki_root=wiki, archive_root=archive,
                file_rel="发票/202605/Lynne/weird-invoice.pdf",
                target_month="2026-07", reimburser="Lynne",
            )
            self.assertEqual(new_rel, "发票/202607/Lynne/weird-invoice.pdf")


class ExtractSettledMonthTests(unittest.TestCase):
    def test_iso_date(self):
        self.assertEqual(transfer._extract_settled_month("2026-04-15"), "2026-04")

    def test_with_time(self):
        self.assertEqual(transfer._extract_settled_month("2026-04-15 17:08"), "2026-04")
        self.assertEqual(transfer._extract_settled_month("2026-04-15T17:08:00"), "2026-04")

    def test_yyyy_mm_only(self):
        self.assertEqual(transfer._extract_settled_month("2026-04"), "2026-04")

    def test_invalid_real_date_rejected(self):
        self.assertIsNone(transfer._extract_settled_month("2026-99-99"))
        self.assertIsNone(transfer._extract_settled_month("2026-13-01"))

    def test_empty_rejected(self):
        self.assertIsNone(transfer._extract_settled_month(""))
        self.assertIsNone(transfer._extract_settled_month(None))

    def test_garbage_rejected(self):
        self.assertIsNone(transfer._extract_settled_month("garbage"))


class RelocateSettledTests(unittest.TestCase):
    """v2.5.9:按结清月归档。row + 物理文件都按 settled_date 月份对齐。"""

    def _setup_settled_row(self, tmp, *, settled_date, period="202606"):
        """造一个 settled=✅ 的 row 落在 period 月账本。"""
        wiki = Path(tmp)
        ledger_root = wiki / "报销"
        archive_root = wiki / "发票"
        # 物理 PDF
        src_dir = archive_root / period / "Lynne"
        src_dir.mkdir(parents=True)
        src_file = src_dir / f"{period}-差旅费-¥100.pdf"
        src_file.write_bytes(b"%PDF-fake")
        file_rel = str(src_file.relative_to(wiki))
        # ledger
        src_md = ledger_root / f"{period[:4]}-{period[4:]}" / "Lynne.md"
        # test factory 让 id8 = invoice_number(简化),所以传 "aaaaaaaa"
        # 就同时是 id8 和 invoice_number
        ledger.append_row(src_md, _row(
            "aaaaaaaa",
            file_rel=file_rel, reimburser="Lynne", category="差旅费",
            amount=100.0,
            period=period, settled=ledger.SETTLED_OK,
            settled_date=settled_date,
        ))
        return wiki, ledger_root, archive_root, src_md, src_file

    def test_dry_run_does_not_move_file(self):
        with tempfile.TemporaryDirectory() as tmp:
            wiki, lroot, aroot, src_md, src_file = self._setup_settled_row(
                tmp, settled_date="2026-04-15")
            results = transfer.relocate_settled_by_settled_month(
                ledger_root=lroot, wiki_root=wiki, archive_root=aroot, dry_run=True,
            )
            actionable = [r for r in results if r.status == "dry_run"]
            self.assertEqual(len(actionable), 1)
            self.assertEqual(actionable[0].from_month, "2026-06")
            self.assertEqual(actionable[0].settled_month, "2026-04")
            # 物理文件没动
            self.assertTrue(src_file.exists())

    def test_apply_relocates_row_and_file(self):
        with tempfile.TemporaryDirectory() as tmp:
            wiki, lroot, aroot, src_md, src_file = self._setup_settled_row(
                tmp, settled_date="2026-04-15")
            results = transfer.relocate_settled_by_settled_month(
                ledger_root=lroot, wiki_root=wiki, archive_root=aroot, dry_run=False,
            )
            self.assertEqual(sum(1 for r in results if r.status == "relocated"), 1)
            # 源 ledger 已删
            src_rows = ledger.parse_ledger(src_md)
            self.assertEqual(len(src_rows), 0)
            # 目标 ledger 出现
            dst_md = lroot / "2026-04" / "Lynne.md"
            self.assertTrue(dst_md.exists())
            dst_rows = ledger.parse_ledger(dst_md)
            self.assertEqual(len(dst_rows), 1)
            self.assertEqual(dst_rows[0].id8, "aaaaaaaa")
            self.assertEqual(dst_rows[0].period, "202604")
            # 物理文件已迁 + 前缀改
            self.assertFalse(src_file.exists())
            new_file = aroot / "202604" / "Lynne" / "202604-差旅费-¥100.pdf"
            self.assertTrue(new_file.exists())

    def test_skip_when_already_aligned(self):
        # settled_date 在 6 月 + row.period 也是 06 → no-op
        with tempfile.TemporaryDirectory() as tmp:
            wiki, lroot, aroot, src_md, src_file = self._setup_settled_row(
                tmp, settled_date="2026-06-15")
            results = transfer.relocate_settled_by_settled_month(
                ledger_root=lroot, wiki_root=wiki, archive_root=aroot, dry_run=False,
            )
            self.assertEqual(sum(1 for r in results if r.status == "relocated"), 0)
            # 源 row 没动
            self.assertEqual(len(ledger.parse_ledger(src_md)), 1)
            self.assertTrue(src_file.exists())

    def test_skip_when_not_settled(self):
        # 未结清 row(无 settled_date)→ 不触发归档
        with tempfile.TemporaryDirectory() as tmp:
            wiki = Path(tmp)
            lroot = wiki / "报销"
            aroot = wiki / "发票"
            src_md = lroot / "2026-06" / "Lynne.md"
            ledger.append_row(src_md, _row("bbbbbbbb", period="202606",
                                          settled=ledger.SETTLED_PENDING, settled_date=""))
            results = transfer.relocate_settled_by_settled_month(
                ledger_root=lroot, wiki_root=wiki, archive_root=aroot, dry_run=False,
            )
            self.assertEqual(sum(1 for r in results if r.status == "relocated"), 0)

    def test_skip_invalid_settled_date(self):
        with tempfile.TemporaryDirectory() as tmp:
            wiki, lroot, aroot, src_md, _ = self._setup_settled_row(
                tmp, settled_date="2026-99-99")
            results = transfer.relocate_settled_by_settled_month(
                ledger_root=lroot, wiki_root=wiki, archive_root=aroot, dry_run=False,
            )
            self.assertEqual(sum(1 for r in results
                                if r.status == "skipped_invalid_settled_date"), 1)
            # row 没动
            self.assertEqual(len(ledger.parse_ledger(src_md)), 1)

    def test_dup_at_target_keeps_target_skips_dup_source(self):
        # 目标月已有同 id8 → 不重复 append,但源仍删掉
        with tempfile.TemporaryDirectory() as tmp:
            wiki, lroot, aroot, src_md, _ = self._setup_settled_row(
                tmp, settled_date="2026-04-15")
            # 提前在目标月放同 invoice_number(= "aaaaaaaa")的 row
            dst_md = lroot / "2026-04" / "Lynne.md"
            ledger.append_row(dst_md, _row("aaaaaaaa", period="202604",
                                          file_rel="发票/202604/王玲/dup.pdf",
                                          settled=ledger.SETTLED_OK, settled_date="2026-04-15"))
            results = transfer.relocate_settled_by_settled_month(
                ledger_root=lroot, wiki_root=wiki, archive_root=aroot, dry_run=False,
            )
            self.assertEqual(sum(1 for r in results
                                if r.status == "skipped_dup_at_target"), 1)
            # 源 row 已删
            self.assertEqual(len(ledger.parse_ledger(src_md)), 0)
            # 目标只有 1 row(没重复)
            self.assertEqual(len(ledger.parse_ledger(dst_md)), 1)


if __name__ == "__main__":
    unittest.main()
