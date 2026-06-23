"""v2.5.7 Req 4:_drop/{人}/payments/ 截图 → 关联 invoice → 归档+回写 端到端测试。"""
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import ledger      # noqa: E402
import sync        # noqa: E402
import payment_extract  # noqa: E402


def _row(**kw):
    base = dict(
        id8="a1b2c3d4",
        file_rel="invoice/202606/Lynne/202606-办公费-HK$7599.pdf",
        reimburser="Lynne",
        category="办公费",
        amount=7599.0,
        currency="HKD",
        invoice_number="MC61637272",
        period="202606",
        submit_date="2026-06-01 15:00",
        description="MacBook 电脑设备",
        invoice_type="invoice",
        billed_to="Wang Ling",
        invoice_date="20260301",
    )
    base.update(kw)
    return ledger.LedgerRow(**base)


def _payment_fields(**kw):
    base = dict(
        payment_date="20260605",
        amount_original=7599.0,
        currency="HKD",
        amount_cny=6692.39,
        payment_method="招行 Visa",
        confidence=0.95,
        is_payment_proof=True,
    )
    base.update(kw)
    return payment_extract.PaymentProofFields(**base, needs_review=False)


def _setup_world(tmp):
    wiki_root = Path(tmp)
    ledger_root = wiki_root / "报销"
    payments_root = wiki_root / "_drop"
    invoice_root = wiki_root / "invoice"
    # 1) 主账本 row
    lp = ledger.ledger_path_for("2026-06", ledger_root, reimburser="Lynne")
    ledger.append_row(lp, _row())
    # 2) invoice 文件(占位)
    invoice_path = wiki_root / "invoice/202606/Lynne/202606-办公费-HK$7599.pdf"
    invoice_path.parent.mkdir(parents=True, exist_ok=True)
    invoice_path.write_bytes(b"PDF stub")
    # 3) 截图放 _drop/Lynne/payments/
    payments_dir = payments_root / "Lynne" / "payments"
    payments_dir.mkdir(parents=True, exist_ok=True)
    screenshot = payments_dir / "wechat-screenshot.png"
    screenshot.write_bytes(b"PNG stub")
    return wiki_root, ledger_root, payments_root, screenshot, invoice_path, lp


class FindInvoiceByPaymentTests(unittest.TestCase):
    def test_finds_unique_match(self):
        with tempfile.TemporaryDirectory() as tmp:
            wiki_root, ledger_root, *_ = _setup_world(tmp)
            status, row, lp = sync.find_invoice_by_payment(
                ledger_root, reimburser="Lynne",
                currency="HKD", amount=7599.0,
            )
            self.assertEqual(status, "ok")
            self.assertEqual(row.invoice_number, "MC61637272")

    def test_not_found_when_amount_differs(self):
        with tempfile.TemporaryDirectory() as tmp:
            wiki_root, ledger_root, *_ = _setup_world(tmp)
            status, _, _ = sync.find_invoice_by_payment(
                ledger_root, reimburser="Lynne",
                currency="HKD", amount=9999.0,
            )
            self.assertEqual(status, "not_found")

    def test_ambiguous_when_multiple_match(self):
        with tempfile.TemporaryDirectory() as tmp:
            wiki_root, ledger_root, *_ = _setup_world(tmp)
            # 加一张同金额同币种 invoice → 多张候选
            lp = ledger.ledger_path_for("2026-06", ledger_root, reimburser="Lynne")
            ledger.append_row(lp, _row(
                id8="deadbeef", invoice_number="DUP-7599",
                file_rel="invoice/202606/Lynne/dup.pdf",
            ))
            status, rows, _ = sync.find_invoice_by_payment(
                ledger_root, reimburser="Lynne",
                currency="HKD", amount=7599.0,
            )
            self.assertEqual(status, "ambiguous")
            self.assertEqual(len(rows), 2)

    def test_currency_filter_works(self):
        with tempfile.TemporaryDirectory() as tmp:
            wiki_root, ledger_root, *_ = _setup_world(tmp)
            status, _, _ = sync.find_invoice_by_payment(
                ledger_root, reimburser="Lynne",
                currency="USD", amount=7599.0,
            )
            self.assertEqual(status, "not_found")

    def test_tolerance_accepts_rounding(self):
        with tempfile.TemporaryDirectory() as tmp:
            wiki_root, ledger_root, *_ = _setup_world(tmp)
            # 7599.04 vs 7599.0 = 0.04 < tolerance 0.05 → 命中
            status, row, _ = sync.find_invoice_by_payment(
                ledger_root, reimburser="Lynne",
                currency="HKD", amount=7599.04,
            )
            self.assertEqual(status, "ok")


class PaymentFilenameTests(unittest.TestCase):
    def test_filename_combines_invoice_and_cny(self):
        name = sync._payment_proof_filename(
            "invoice/202606/Lynne/202606-办公费-HK$7599.pdf", 6692.39, ".png",
        )
        self.assertEqual(name, "202606-办公费-HK$7599-¥6692.39.png")

    def test_integer_cny_no_trailing_zeros(self):
        name = sync._payment_proof_filename(
            "invoice/202606/Lynne/202606-差旅费-$100.pdf", 720.0, ".jpg",
        )
        self.assertEqual(name, "202606-差旅费-$100-¥720.jpg")


class ProcessPaymentsDropTests(unittest.TestCase):
    def test_synced_end_to_end(self):
        with tempfile.TemporaryDirectory() as tmp:
            wiki_root, ledger_root, payments_root, screenshot, invoice_path, lp = \
                _setup_world(tmp)
            extractor = lambda p: _payment_fields()
            outcomes = sync.process_payments_drop(
                payments_root, ledger_root=ledger_root, wiki_root=wiki_root,
                extractor=extractor,
            )
            self.assertEqual(len(outcomes), 1)
            o = outcomes[0]
            self.assertEqual(o.status, "synced")
            self.assertEqual(o.invoice_number, "MC61637272")
            # 截图被 mv 到 invoice 同目录,名带 ¥6692.39
            expected_path = invoice_path.parent / "202606-办公费-HK$7599-¥6692.39.png"
            self.assertTrue(expected_path.exists())
            self.assertFalse(screenshot.exists())   # 已 mv
            # 主账本回写
            rows = ledger.parse_ledger(lp)
            row = next(r for r in rows if r.invoice_number == "MC61637272")
            self.assertEqual(row.amount_cny, 6692.39)
            self.assertIn("付款证明", row.payment_proof)
            self.assertIn("-¥6692.39.png", row.payment_proof)

    def test_not_payment_skipped(self):
        with tempfile.TemporaryDirectory() as tmp:
            wiki_root, ledger_root, payments_root, screenshot, *_ = _setup_world(tmp)
            extractor = lambda p: _payment_fields(is_payment_proof=False)
            outcomes = sync.process_payments_drop(
                payments_root, ledger_root=ledger_root, wiki_root=wiki_root,
                extractor=extractor,
            )
            self.assertEqual(outcomes[0].status, "not_payment")
            self.assertTrue(screenshot.exists())   # 不动

    def test_not_found_skipped(self):
        with tempfile.TemporaryDirectory() as tmp:
            wiki_root, ledger_root, payments_root, screenshot, *_ = _setup_world(tmp)
            extractor = lambda p: _payment_fields(amount_original=9999.0)
            outcomes = sync.process_payments_drop(
                payments_root, ledger_root=ledger_root, wiki_root=wiki_root,
                extractor=extractor,
            )
            self.assertEqual(outcomes[0].status, "not_found")
            self.assertTrue(screenshot.exists())   # 留 _drop 等人工

    def test_ambiguous_skipped(self):
        with tempfile.TemporaryDirectory() as tmp:
            wiki_root, ledger_root, payments_root, screenshot, *_ = _setup_world(tmp)
            lp = ledger.ledger_path_for("2026-06", ledger_root, reimburser="Lynne")
            ledger.append_row(lp, _row(
                id8="deadbeef", invoice_number="DUP-7599",
                file_rel="invoice/202606/Lynne/dup.pdf",
            ))
            extractor = lambda p: _payment_fields()
            outcomes = sync.process_payments_drop(
                payments_root, ledger_root=ledger_root, wiki_root=wiki_root,
                extractor=extractor,
            )
            self.assertEqual(outcomes[0].status, "ambiguous")
            self.assertTrue(screenshot.exists())   # 留 _drop 等人工

    def test_empty_payments_dir_returns_empty(self):
        with tempfile.TemporaryDirectory() as tmp:
            wiki_root = Path(tmp)
            payments_root = wiki_root / "_drop"
            (payments_root / "Lynne" / "payments").mkdir(parents=True, exist_ok=True)
            ledger_root = wiki_root / "报销"
            outcomes = sync.process_payments_drop(
                payments_root, ledger_root=ledger_root, wiki_root=wiki_root,
                extractor=lambda p: _payment_fields(),
            )
            self.assertEqual(outcomes, [])


class UpdateRowPaymentInfoTests(unittest.TestCase):
    def test_writes_both_fields(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "2026-06.md"
            ledger.append_row(p, _row())
            ok = ledger.update_row_payment_info(
                p, "MC61637272",
                payment_proof_link="[付款证明](/invoice/202606/Lynne/foo.png)",
                amount_cny=6692.39,
            )
            self.assertTrue(ok)
            row = ledger.parse_ledger(p)[0]
            self.assertEqual(row.amount_cny, 6692.39)
            self.assertIn("付款证明", row.payment_proof)

    def test_id8_fallback_finds_no_number_invoice(self):
        """v2.5.8 codex bug:无 invoice_number 的 invoice row 必须能通过 id8_fallback 找到。"""
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "2026-06.md"
            ledger.append_row(p, _row(
                id8="abcd1234",
                invoice_number="",   # 无号
                invoice_type="invoice",
                billed_to="Wang Ling",
            ))
            # invoice_number="" 但传 id8_fallback → 应该找到
            ok = ledger.update_row_payment_info(
                p, "",   # 没有 invoice_number
                payment_proof_link="[付款](/x.png)",
                amount_cny=100.0,
                id8_fallback="abcd1234",
            )
            self.assertTrue(ok)
            row = ledger.parse_ledger(p)[0]
            self.assertEqual(row.amount_cny, 100.0)

    def test_returns_false_when_invoice_not_found(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "2026-06.md"
            ledger.append_row(p, _row())
            ok = ledger.update_row_payment_info(
                p, "NO-SUCH",
                payment_proof_link="[](/x)", amount_cny=100.0,
            )
            self.assertFalse(ok)

    def test_idempotent_on_same_input(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "2026-06.md"
            ledger.append_row(p, _row())
            link = "[付款证明](/invoice/202606/Lynne/foo.png)"
            ok1 = ledger.update_row_payment_info(p, "MC61637272",
                                                  payment_proof_link=link, amount_cny=6692.39)
            ok2 = ledger.update_row_payment_info(p, "MC61637272",
                                                  payment_proof_link=link, amount_cny=6692.39)
            self.assertTrue(ok1)
            self.assertFalse(ok2)   # 内容已一致,不再改写


if __name__ == "__main__":
    unittest.main()
