"""v2 测试:sync 走真 ledger + tmp 目录(不 mock),贴近生产行为。"""
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import ledger  # noqa: E402
import sync  # noqa: E402
from extract import InvoiceFields  # noqa: E402

RULES = [{"category": "差旅费", "keywords": ["机票", "酒店"]}]


def _fields(**kw):
    base = dict(invoice_date="20260105", amount=1000.0, currency="CNY",
                invoice_number="No.123", category_hint="机票", confidence=0.95, needs_review=False)
    base.update(kw)
    return InvoiceFields(**base)


def _fixed_extractor(fields):
    return lambda path: fields


def _drop(inbox, reimburser, name, data):
    d = Path(inbox) / reimburser
    d.mkdir(parents=True, exist_ok=True)
    p = d / name
    p.write_bytes(data)
    return p


def _run(tmp, fields, *, submit_ts_ms=1700000000000):
    wiki_root = Path(tmp)
    inbox = wiki_root / "_inbox"
    archive_root = wiki_root / "发票"
    ledger_root = wiki_root / "ledger"
    outcomes = sync.process_inbox(
        inbox, archive_root=archive_root, ledger_root=ledger_root,
        wiki_root=wiki_root,
        extractor=_fixed_extractor(fields), rules=RULES, submit_ts_ms=submit_ts_ms,
    )
    return outcomes, inbox, archive_root, ledger_root


def _ledger_files(ledger_root):
    return sorted(Path(ledger_root).rglob("*.md"))


class SyncHappyPathTests(unittest.TestCase):
    def test_synced_then_inbox_deleted(self):
        with tempfile.TemporaryDirectory() as tmp:
            src = _drop(Path(tmp) / "_inbox", "王玲", "a.pdf", b"INV-A")
            # v2.5:归集月用提交月,显式传一个固定 ts(2026-06-15)
            ts_ms = int(__import__("datetime").datetime(2026, 6, 15, 12, 0).timestamp() * 1000)
            outcomes, _, archive_root, ledger_root = _run(tmp, _fields(), submit_ts_ms=ts_ms)
            o = outcomes[0]
            self.assertEqual(o.status, "synced")
            self.assertEqual(o.action, "created")
            self.assertEqual(o.reimburser, "王玲")
            self.assertFalse(src.exists())
            self.assertTrue(list(archive_root.rglob("*.pdf")))
            files = _ledger_files(ledger_root)
            self.assertEqual(len(files), 1)
            rows = ledger.parse_ledger(files[0])
            self.assertEqual(len(rows), 1)
            r = rows[0]
            self.assertEqual(r.reimburser, "王玲")
            self.assertEqual(r.category, "差旅费")
            self.assertEqual(r.amount, 1000.0)
            # v2.5:period = submit_month(归集月),不再是开票月
            self.assertEqual(r.period, "202606")
            self.assertTrue(r.file_rel.startswith("发票/202606/王玲/"))
            # 自动化范围 = 拉取+归档+写账本;审批/打款是手动操作(Lynne 在 Obsidian
            # 走完流程后自己 toggle ⬜→✅),所以新 row 默认 ⬜⬜。
            self.assertEqual(r.approval, ledger.APPROVAL_PENDING)
            self.assertEqual(r.payment, ledger.PAYMENT_PENDING)

    def test_reimburser_from_subfolder(self):
        with tempfile.TemporaryDirectory() as tmp:
            _drop(Path(tmp) / "_inbox", "王志彪", "b.pdf", b"INV-B")
            outcomes, _, _, _ = _run(tmp, _fields())
            self.assertEqual(outcomes[0].reimburser, "王志彪")


class SyncIdempotentTests(unittest.TestCase):
    def test_rerun_same_content_with_invoice_number_hits_content_dedup(self):
        """v2.5.9 起:同内容(同 source_sha256)重投 → content 去重层先拦,
        invoice_number 软去重层根本走不到。action='duplicate_by_content'。"""
        with tempfile.TemporaryDirectory() as tmp:
            _drop(Path(tmp) / "_inbox", "王玲", "a.pdf", b"SAME")
            outcomes1, _, _, ledger_root = _run(tmp, _fields())
            self.assertEqual(outcomes1[0].action, "created")
            _drop(Path(tmp) / "_inbox", "王玲", "a2.pdf", b"SAME")
            outcomes2, _, _, _ = _run(tmp, _fields())
            self.assertEqual(outcomes2[0].action, "duplicate_by_content")
            # 账本只一行
            rows = ledger.parse_ledger(_ledger_files(ledger_root)[0])
            self.assertEqual(len(rows), 1)

    def test_rerun_same_content_empty_invoice_number_hits_content_dedup(self):
        """v2.5.9 起:空 invoice_number 也走 content 去重层(source_sha256 命中),
        action='duplicate_by_content'(原 v2.5.8 走 id8 dedup,语义合并到 content 防线)。"""
        with tempfile.TemporaryDirectory() as tmp:
            _drop(Path(tmp) / "_inbox", "王玲", "a.pdf", b"SAME")
            outcomes1, _, _, ledger_root = _run(tmp, _fields(invoice_number=""))
            self.assertEqual(outcomes1[0].action, "created")
            _drop(Path(tmp) / "_inbox", "王玲", "a2.pdf", b"SAME")
            outcomes2, _, archive_root, _ = _run(tmp, _fields(invoice_number=""))
            self.assertEqual(outcomes2[0].action, "duplicate_by_content")
            # 归档仍只 1 份(archive 层早已查重,sha 路径不二次归档)
            self.assertEqual(len(list(archive_root.rglob("*.pdf"))), 1)
            rows = ledger.parse_ledger(_ledger_files(ledger_root)[0])
            self.assertEqual(len(rows), 1)

    def test_invoice_number_soft_dedup_still_triggers_on_byte_drift(self):
        """v2.5.9:source_sha256 / pdf_text_sha256 都不命中(字节流不同 + 非 PDF)
        → invoice_number 软去重照样兜底,行为跟 v2.5.8 一致。"""
        with tempfile.TemporaryDirectory() as tmp:
            _drop(Path(tmp) / "_inbox", "王玲", "a.pdf", b"BYTES-A")
            outcomes1, _, _, ledger_root = _run(tmp, _fields(invoice_number="INV-001"))
            self.assertEqual(outcomes1[0].action, "created")
            # 字节流不同,但 invoice_number 一致
            _drop(Path(tmp) / "_inbox", "王玲", "b.pdf", b"BYTES-B-DIFFERENT")
            outcomes2, _, _, _ = _run(tmp, _fields(invoice_number="INV-001"))
            self.assertEqual(outcomes2[0].action, "duplicate_invoice_number")
            rows = ledger.parse_ledger(_ledger_files(ledger_root)[0])
            self.assertEqual(len(rows), 1)


class NearDuplicateInvoiceNumberTests(unittest.TestCase):
    """v2.5.9 Day 4:Hamming ≤ 2 近似号码 ingest 防线。"""

    def _settle_first_row(self, ledger_root):
        """直接改 markdown 把第一行 task box [ ] 变 [x],模拟 Lynne 勾结清。"""
        md = _ledger_files(ledger_root)[0]
        text = md.read_text(encoding="utf-8")
        text = text.replace("- [ ] 已结清", "- [x] 已结清", 1)
        md.write_text(text, encoding="utf-8")

    def test_settled_row_near_dup_writes_with_strong_flag(self):
        """已结清 row 的近似号码 → 写入 + needs_review + 重措辞 ⚠️ note,不硬拦截。
        2026-06-10 review 定:同日同价连号真票会被硬拦截静默吞,故障模式不可感知,
        改为可感知的写入+标记。复现本次事故:已结清 `...22554` + cowork `...22558`。"""
        with tempfile.TemporaryDirectory() as tmp:
            _drop(Path(tmp) / "_inbox", "王玲", "a.pdf", b"BYTES-A")
            outcomes1, _, _, ledger_root = _run(tmp, _fields(
                invoice_number="26317000001991422554"))
            self.assertEqual(outcomes1[0].action, "created")
            self._settle_first_row(ledger_root)
            # cowork 重新拉同笔(字节流不同 + 不是真 PDF → sha 防线绕过),OCR 出近似号
            _drop(Path(tmp) / "_inbox", "王玲", "b.pdf", b"BYTES-B-DIFFERENT")
            outcomes2, inbox, _, _ = _run(tmp, _fields(
                invoice_number="26317000001991422558"))
            self.assertEqual(outcomes2[0].action, "created")
            # 不再进 _conflict
            conflict_dir = inbox / "_conflict" / "near-duplicate-suspect"
            self.assertFalse(conflict_dir.exists())
            # 写入了第二行,带重措辞警示
            rows = ledger.parse_ledger(_ledger_files(ledger_root)[0])
            self.assertEqual(len(rows), 2)
            new_row = next(r for r in rows
                           if r.invoice_number == "26317000001991422558")
            self.assertTrue(new_row.needs_review)
            self.assertIn("已结清", new_row.note)
            self.assertIn("高度疑似", new_row.note)

    def test_pending_row_near_dup_writes_but_flags_review(self):
        """未结清 row 的近似号码 → 仍写新 row,但 needs_review=True + note 警示。
        留给 Lynne 人工裁决是不是同一笔。"""
        with tempfile.TemporaryDirectory() as tmp:
            _drop(Path(tmp) / "_inbox", "王玲", "a.pdf", b"BYTES-A")
            outcomes1, _, _, ledger_root = _run(tmp, _fields(
                invoice_number="26317000001991422554"))
            self.assertEqual(outcomes1[0].action, "created")
            # 不 settle,继续
            _drop(Path(tmp) / "_inbox", "王玲", "b.pdf", b"BYTES-B-DIFFERENT")
            outcomes2, _, _, _ = _run(tmp, _fields(
                invoice_number="26317000001991422558"))
            self.assertEqual(outcomes2[0].action, "created")
            rows = ledger.parse_ledger(_ledger_files(ledger_root)[0])
            self.assertEqual(len(rows), 2)
            # 新 row 应当被打 needs_review + note
            new_row = next(r for r in rows
                           if r.invoice_number == "26317000001991422558")
            self.assertTrue(new_row.needs_review)
            self.assertIn("近似号", new_row.note)
            self.assertIn("Hamming=1", new_row.note)

    def test_hamming_above_threshold_unaffected(self):
        """Hamming > 2 → 不触发近似检测,行为跟 v2.5.8 普通 ingest 一致。"""
        with tempfile.TemporaryDirectory() as tmp:
            _drop(Path(tmp) / "_inbox", "王玲", "a.pdf", b"BYTES-A")
            outcomes1, _, _, ledger_root = _run(tmp, _fields(
                invoice_number="11111111111111111111"))
            self.assertEqual(outcomes1[0].action, "created")
            self._settle_first_row(ledger_root)
            _drop(Path(tmp) / "_inbox", "王玲", "b.pdf", b"BYTES-B")
            outcomes2, _, _, _ = _run(tmp, _fields(
                invoice_number="99999999999999999999"))
            # 完全不同号 → 普通新行,不进 conflict
            self.assertEqual(outcomes2[0].action, "created")
            rows = ledger.parse_ledger(_ledger_files(ledger_root)[0])
            self.assertEqual(len(rows), 2)

    def test_cross_val_note_appended_when_both_triggers_fire(self):
        """near-dup 跟 cross-val 都 trigger 时,note 用 ` · ` 拼接两个警示。
        mock extract_pdf_text_invoice_numbers 让 cross-val 真的触发。"""
        from unittest import mock
        with tempfile.TemporaryDirectory() as tmp:
            _drop(Path(tmp) / "_inbox", "王玲", "a.pdf", b"BYTES-A")
            outcomes1, _, _, ledger_root = _run(tmp, _fields(
                invoice_number="26317000001991422554"))
            self.assertEqual(outcomes1[0].action, "created")
            _drop(Path(tmp) / "_inbox", "王玲", "b.pdf", b"BYTES-B-DIFFERENT")
            # pdftotext 抽出第三个号码(跟 OCR 不同 + 不在账本) → 普通互验警示
            with mock.patch.object(sync.identity, "extract_pdf_text_invoice_numbers",
                                   return_value=["26317000001991422559"]):
                outcomes2, _, _, _ = _run(tmp, _fields(
                    invoice_number="26317000001991422558"))
            self.assertEqual(outcomes2[0].action, "created")
            rows = ledger.parse_ledger(_ledger_files(ledger_root)[0])
            new_row = next(r for r in rows
                           if r.invoice_number == "26317000001991422558")
            self.assertIn("近似号", new_row.note)
            self.assertIn("互验不一致", new_row.note)
            self.assertIn(" · ", new_row.note)
            self.assertTrue(new_row.needs_review)

    def test_cross_val_text_number_hits_existing_row_strong_note(self):
        """pdftotext 号码命中已有 row = 最强重复信号(OCR 同时错读号码+金额时
        Hamming gate 漏,这条兜底)→ flag + 高度疑似重投 note,仍写入不拦。"""
        from unittest import mock
        with tempfile.TemporaryDirectory() as tmp:
            _drop(Path(tmp) / "_inbox", "王玲", "a.pdf", b"BYTES-A")
            outcomes1, _, _, ledger_root = _run(tmp, _fields(
                invoice_number="26317000001991422554", amount=1023.0))
            self.assertEqual(outcomes1[0].action, "created")
            _drop(Path(tmp) / "_inbox", "王玲", "b.pdf", b"BYTES-B-DIFFERENT")
            # OCR 错读出新号 + 错读金额(绕过 Hamming 金额 gate);pdftotext 读出真号
            with mock.patch.object(sync.identity, "extract_pdf_text_invoice_numbers",
                                   return_value=["26317000001991422554"]):
                outcomes2, _, _, _ = _run(tmp, _fields(
                    invoice_number="99999999999999999999", amount=1028.0))
            self.assertEqual(outcomes2[0].action, "created")
            rows = ledger.parse_ledger(_ledger_files(ledger_root)[0])
            new_row = next(r for r in rows
                           if r.invoice_number == "99999999999999999999")
            self.assertTrue(new_row.needs_review)
            self.assertIn("高度疑似", new_row.note)

    def test_cross_val_agree_no_flag(self):
        """pdftotext 跟 OCR 一致 → 不 flag。"""
        from unittest import mock
        with tempfile.TemporaryDirectory() as tmp:
            _drop(Path(tmp) / "_inbox", "王玲", "a.pdf", b"BYTES-A")
            with mock.patch.object(sync.identity, "extract_pdf_text_invoice_numbers",
                                   return_value=["26317000001991422554"]):
                outcomes, _, _, ledger_root = _run(tmp, _fields(
                    invoice_number="26317000001991422554"))
            self.assertEqual(outcomes[0].action, "created")
            row = ledger.parse_ledger(_ledger_files(ledger_root)[0])[0]
            self.assertFalse(row.needs_review)
            self.assertEqual(row.note, "")


    def test_near_dup_with_different_amount_not_blocked(self):
        """Hamming=1 但金额不等 → 携程 batch 连号场景,不拦截,正常入账。
        audit-near-dups 实测发现 `...22553` ¥930 vs `...22558` ¥1023 是真实不同航段。"""
        with tempfile.TemporaryDirectory() as tmp:
            _drop(Path(tmp) / "_inbox", "王玲", "a.pdf", b"BYTES-A")
            outcomes1, _, _, ledger_root = _run(tmp, _fields(
                invoice_number="26317000001991422553", amount=930.0))
            self.assertEqual(outcomes1[0].action, "created")
            self._settle_first_row(ledger_root)
            _drop(Path(tmp) / "_inbox", "王玲", "b.pdf", b"BYTES-B")
            # 同号 batch 连号 + 不同金额 → 真实不同票,不该拦
            outcomes2, _, _, _ = _run(tmp, _fields(
                invoice_number="26317000001991422558", amount=1023.0))
            self.assertEqual(outcomes2[0].action, "created")
            rows = ledger.parse_ledger(_ledger_files(ledger_root)[0])
            self.assertEqual(len(rows), 2)
            # 新 row 不该被 flag needs_review(金额不等 = 业务上 unrelated)
            new_row = next(r for r in rows
                           if r.invoice_number == "26317000001991422558")
            self.assertFalse(new_row.needs_review)
            self.assertEqual(new_row.note, "")

    def test_near_dup_with_same_amount_but_different_date_not_blocked(self):
        """Hamming=1 + 同价 + 不同 invoice_date → Anthropic 月订阅 batch 场景,不拦。
        audit-near-dups 实测 `VFW21SRU-0001` $200 (Jan-Feb) vs `-0008` $200 (Jun-Jul)
        都是同价但不同期账单 — 三层校准里 invoice_date 不一致条件挡住误报。"""
        with tempfile.TemporaryDirectory() as tmp:
            _drop(Path(tmp) / "_inbox", "王玲", "a.pdf", b"BYTES-A")
            outcomes1, _, _, ledger_root = _run(tmp, _fields(
                invoice_number="VFW21SRU-0001", amount=200.0,
                invoice_date="20260128"))
            self.assertEqual(outcomes1[0].action, "created")
            self._settle_first_row(ledger_root)
            _drop(Path(tmp) / "_inbox", "王玲", "b.pdf", b"BYTES-B")
            outcomes2, _, _, _ = _run(tmp, _fields(
                invoice_number="VFW21SRU-0002", amount=200.0,
                invoice_date="20260301"))
            # 同价但 invoice_date 不同 = 真实不同期账单,不该拦
            self.assertEqual(outcomes2[0].action, "created")
            rows = ledger.parse_ledger(_ledger_files(ledger_root)[0])
            self.assertEqual(len(rows), 2)


class PdfTextShaDedupTests(unittest.TestCase):
    """v2.5.9 旗舰场景:同发票字节漂移但文本层相同 → pdf_text_sha256 防线拦截。"""

    def test_byte_drift_same_text_layer_deduped(self):
        from unittest import mock
        fake_sha = "c" * 64
        with tempfile.TemporaryDirectory() as tmp:
            _drop(Path(tmp) / "_inbox", "王玲", "a.pdf", b"BYTES-A")
            with mock.patch.object(sync.identity, "pdf_text_sha256",
                                   return_value=fake_sha):
                outcomes1, _, _, ledger_root = _run(tmp, _fields(
                    invoice_number="26317000001991422554"))
                self.assertEqual(outcomes1[0].action, "created")
                # 字节不同 + OCR 读出完全不同的号 → 老防线全绕过,文本层 sha 兜底
                _drop(Path(tmp) / "_inbox", "王玲", "b.pdf", b"BYTES-B-DIFFERENT")
                outcomes2, inbox, _, _ = _run(tmp, _fields(
                    invoice_number="99999999999999999999"))
            self.assertEqual(outcomes2[0].action, "duplicate_by_content")
            self.assertIn("pdf_text_sha256", outcomes2[0].detail)
            conflict = inbox / "_conflict" / "duplicate-by-content"
            self.assertEqual(len(list(conflict.iterdir())), 1)
            rows = ledger.parse_ledger(_ledger_files(ledger_root)[0])
            self.assertEqual(len(rows), 1)

    def test_extractor_not_called_on_content_dup(self):
        """sha dedup 已前置到 extractor 之前 — 重复文件不烧 OCR/LLM 提取。"""
        with tempfile.TemporaryDirectory() as tmp:
            _drop(Path(tmp) / "_inbox", "王玲", "a.pdf", b"SAME")
            outcomes1, _, _, _ = _run(tmp, _fields())
            self.assertEqual(outcomes1[0].action, "created")
            _drop(Path(tmp) / "_inbox", "王玲", "a2.pdf", b"SAME")
            calls = []
            def counting_extractor(path):
                calls.append(path)
                return _fields()
            wiki_root = Path(tmp)
            outcomes2 = sync.process_inbox(
                wiki_root / "_inbox", archive_root=wiki_root / "发票",
                ledger_root=wiki_root / "ledger", wiki_root=wiki_root,
                extractor=counting_extractor, rules=RULES,
                submit_ts_ms=1700000000000,
            )
            self.assertEqual(outcomes2[0].action, "duplicate_by_content")
            self.assertEqual(calls, [])   # extractor 一次都没被调


class QuarantineCollisionTests(unittest.TestCase):
    """v2.5.9:conflict 目录同名碰撞追号,绝不覆盖证据文件。"""

    def test_same_name_second_file_gets_suffix(self):
        with tempfile.TemporaryDirectory() as tmp:
            _drop(Path(tmp) / "_inbox", "王玲", "发票.pdf", b"SAME")
            outcomes1, _, _, _ = _run(tmp, _fields())
            self.assertEqual(outcomes1[0].action, "created")
            # 同字节再投两次,文件名相同 → conflict 目录里要有 发票.pdf + 发票-2.pdf
            _drop(Path(tmp) / "_inbox", "王玲", "发票.pdf", b"SAME")
            _run(tmp, _fields())
            _drop(Path(tmp) / "_inbox", "王玲", "发票.pdf", b"SAME")
            _run(tmp, _fields())
            conflict = Path(tmp) / "_inbox" / "_conflict" / "duplicate-by-content"
            names = sorted(p.name for p in conflict.iterdir())
            self.assertEqual(names, ["发票-2.pdf", "发票.pdf"])


class SyncUnknownCategoryTests(unittest.TestCase):
    def test_fallback_to_other_marks_needs_review(self):
        """分类 fallback「其他费用」→ needs_review=True → section 多「分类已确认」task,
        dashboard 描述列前缀 ⚠️。审批/打款的「已结清」task 不受影响。"""
        with tempfile.TemporaryDirectory() as tmp:
            _drop(Path(tmp) / "_inbox", "王玲", "x.pdf", b"X")
            outcomes, _, _, ledger_root = _run(tmp, _fields(category_hint="无法识别的奇怪东西"))
            self.assertEqual(outcomes[0].action, "created")
            ledger_file = _ledger_files(ledger_root)[0]
            row = ledger.parse_ledger(ledger_file)[0]
            self.assertEqual(row.category, "其他费用")
            self.assertTrue(row.needs_review)
            # section 渲染多一条 task
            txt = ledger_file.read_text(encoding="utf-8")
            self.assertIn("- [ ] 分类已确认", txt)
            # dashboard 描述列含 ⚠️ 前缀
            dash = txt.split(ledger.DASHBOARD_START)[1].split(ledger.DASHBOARD_END)[0]
            self.assertIn("⚠️", dash)

    def test_needs_review_flag_marks_row_even_if_classified(self):
        with tempfile.TemporaryDirectory() as tmp:
            _drop(Path(tmp) / "_inbox", "王玲", "y.pdf", b"Y")
            outcomes, _, _, ledger_root = _run(tmp, _fields(needs_review=True))
            self.assertEqual(outcomes[0].action, "created")
            row = ledger.parse_ledger(_ledger_files(ledger_root)[0])[0]
            self.assertEqual(row.category, "差旅费")        # 分类正常
            self.assertTrue(row.needs_review)              # 但标了待确认


class SyncConflictTests(unittest.TestCase):
    def test_no_subfolder_goes_to_conflict_not_processed(self):
        with tempfile.TemporaryDirectory() as tmp:
            inbox = Path(tmp) / "_inbox"
            inbox.mkdir(parents=True, exist_ok=True)
            stray = inbox / "stray.pdf"
            stray.write_bytes(b"X")
            outcomes, _, _, ledger_root = _run(tmp, _fields())
            self.assertEqual(outcomes[0].status, "conflict")
            self.assertIsNone(outcomes[0].reimburser)
            self.assertTrue(list((inbox / "_conflict").rglob("*.pdf")))
            self.assertFalse(_ledger_files(ledger_root))    # 账本没被建


class SyncTransientTests(unittest.TestCase):
    def test_extractor_failure_keeps_inbox_no_conflict(self):
        def bad(p):
            raise RuntimeError("提取炸了")
        with tempfile.TemporaryDirectory() as tmp:
            src = _drop(Path(tmp) / "_inbox", "王玲", "a.pdf", b"INV-A")
            wiki_root = Path(tmp)
            inbox = wiki_root / "_inbox"
            archive_root = wiki_root / "发票"
            ledger_root = wiki_root / "ledger"
            outcomes = sync.process_inbox(
                inbox, archive_root=archive_root, ledger_root=ledger_root,
                wiki_root=wiki_root,
                extractor=bad, rules=RULES, submit_ts_ms=1700000000000,
            )
            self.assertEqual(outcomes[0].status, "error")
            self.assertTrue(src.exists())                            # 留 inbox 重试
            self.assertFalse(list((inbox / "_conflict").rglob("*.pdf")))


class PlanInboxTests(unittest.TestCase):
    def test_plan_previews_without_side_effects(self):
        with tempfile.TemporaryDirectory() as tmp:
            inbox = Path(tmp) / "_inbox"
            src = _drop(inbox, "王玲", "a.pdf", b"INV-A")
            plans = sync.plan_inbox(inbox, extractor=_fixed_extractor(_fields()), rules=RULES)
            self.assertEqual(len(plans), 1)
            p = plans[0]
            self.assertEqual(p["reimburser"], "王玲")
            self.assertEqual(p["category"], "差旅费")
            self.assertEqual(p["period"], "202601")
            self.assertEqual(p["planned_name"], "202601-差旅费-¥1000.pdf")
            self.assertFalse(p["needs_review"])
            self.assertTrue(src.exists())
            self.assertFalse((Path(tmp) / "发票").exists())


class SyncLedgerMonthTests(unittest.TestCase):
    def test_ledger_filename_uses_submit_month_not_invoice_month(self):
        """v2.5:账本 + 归档目录按【归集月】(初始 = 提交月),不再按开票月。
        invoice_date 在 1 月、提交时间在 6 月 → 归集月 = 提交月 = 2026-06。
        invoice_date 仅作元数据写到 row,不参与路径计算。"""
        with tempfile.TemporaryDirectory() as tmp:
            _drop(Path(tmp) / "_inbox", "王玲", "a.pdf", b"INV-A")
            ts_ms = int(__import__("datetime").datetime(2026, 6, 15, 12, 0).timestamp() * 1000)
            outcomes, _, archive_root, ledger_root = _run(tmp, _fields(), submit_ts_ms=ts_ms)
            self.assertEqual(outcomes[0].status, "synced")
            files = _ledger_files(ledger_root)
            self.assertEqual(len(files), 1)
            self.assertEqual(files[0].name, "王玲.md")
            self.assertEqual(files[0].parent.name, "2026-06")    # 提交月,不是 2026-01 开票月
            self.assertTrue(list((archive_root / "202606" / "王玲").glob("*.pdf")))


class SyncOverseasRoutingTests(unittest.TestCase):
    """v2.5.7:海外 invoice 路由到 overseas_archive_root(发票/ 兄弟目录 invoice/)。"""

    def _run_with_overseas(self, tmp, fields, *, submit_ts_ms=1700000000000):
        wiki_root = Path(tmp)
        inbox = wiki_root / "_inbox"
        archive_root = wiki_root / "发票"
        overseas_root = wiki_root / "invoice"
        ledger_root = wiki_root / "ledger"
        outcomes = sync.process_inbox(
            inbox, archive_root=archive_root, ledger_root=ledger_root,
            wiki_root=wiki_root,
            extractor=_fixed_extractor(fields), rules=RULES, submit_ts_ms=submit_ts_ms,
            overseas_archive_root=overseas_root,
        )
        return outcomes, archive_root, overseas_root, ledger_root

    def test_overseas_invoice_routes_to_invoice_root(self):
        with tempfile.TemporaryDirectory() as tmp:
            _drop(Path(tmp) / "_inbox", "Lynne", "a.pdf", b"OVERSEAS-1")
            ts_ms = int(__import__("datetime").datetime(2026, 6, 15, 12, 0).timestamp() * 1000)
            f = _fields(invoice_type="invoice", currency="USD", amount=129,
                       invoice_number="INV-EW-0003", category_hint="服务器")
            _, archive_root, overseas_root, _ = self._run_with_overseas(tmp, f, submit_ts_ms=ts_ms)
            self.assertFalse(list(archive_root.rglob("*.pdf")))   # 不进国内 发票/
            files = list(overseas_root.rglob("*.pdf"))
            self.assertEqual(len(files), 1)
            # 路径形如 invoice/202606/Lynne/202606-...-$129.pdf
            self.assertIn("202606", files[0].parts)
            self.assertIn("Lynne", files[0].parts)

    def test_domestic_invoice_stays_in_fapiao_root(self):
        with tempfile.TemporaryDirectory() as tmp:
            _drop(Path(tmp) / "_inbox", "Lynne", "a.pdf", b"DOM-1")
            ts_ms = int(__import__("datetime").datetime(2026, 6, 15, 12, 0).timestamp() * 1000)
            f = _fields(invoice_type="普票")
            _, archive_root, overseas_root, _ = self._run_with_overseas(tmp, f, submit_ts_ms=ts_ms)
            self.assertTrue(list(archive_root.rglob("*.pdf")))
            self.assertFalse(list(overseas_root.rglob("*.pdf")))

    def test_overseas_invoice_writes_to_petty_ledger(self):
        """v2.5.8:海外 invoice 路由到备用金账本,不写主账本。"""
        with tempfile.TemporaryDirectory() as tmp:
            _drop(Path(tmp) / "_inbox", "Lynne", "a.pdf", b"OVERSEAS-P")
            ts_ms = int(__import__("datetime").datetime(2026, 6, 15, 12, 0).timestamp() * 1000)
            f = _fields(invoice_type="invoice", currency="USD", amount=129,
                       invoice_number="INV-EWP-0099", category_hint="服务器")
            wiki_root = Path(tmp)
            archive_root = wiki_root / "发票"
            overseas_root = wiki_root / "invoice"
            main_ledger = wiki_root / "报销"
            petty_ledger = wiki_root / "备用金"
            outcomes = sync.process_inbox(
                wiki_root / "_inbox", archive_root=archive_root, ledger_root=main_ledger,
                wiki_root=wiki_root,
                extractor=_fixed_extractor(f), rules=RULES, submit_ts_ms=ts_ms,
                overseas_archive_root=overseas_root, petty_ledger_root=petty_ledger,
            )
            self.assertEqual(outcomes[0].status, "synced")
            # 主账本里不应有该 row
            main_files = list(main_ledger.rglob("*.md"))
            self.assertEqual(main_files, [])
            # 备用金账本里有
            petty_files = list(petty_ledger.rglob("*.md"))
            self.assertEqual(len(petty_files), 1)
            self.assertIn("INV-EWP-0099", petty_files[0].read_text(encoding="utf-8"))
            # frontmatter 标 petty-cash-ledger
            self.assertIn("petty-cash-ledger", petty_files[0].read_text(encoding="utf-8"))

    def test_domestic_invoice_writes_to_main_ledger(self):
        """国内增值税票仍走主账本。"""
        with tempfile.TemporaryDirectory() as tmp:
            _drop(Path(tmp) / "_inbox", "Lynne", "a.pdf", b"DOM-P")
            ts_ms = int(__import__("datetime").datetime(2026, 6, 15, 12, 0).timestamp() * 1000)
            f = _fields(invoice_type="普票")
            wiki_root = Path(tmp)
            main_ledger = wiki_root / "报销"
            petty_ledger = wiki_root / "备用金"
            sync.process_inbox(
                wiki_root / "_inbox",
                archive_root=wiki_root / "发票", ledger_root=main_ledger,
                wiki_root=wiki_root,
                extractor=_fixed_extractor(f), rules=RULES, submit_ts_ms=ts_ms,
                overseas_archive_root=wiki_root / "invoice",
                petty_ledger_root=petty_ledger,
            )
            self.assertEqual(len(list(main_ledger.rglob("*.md"))), 1)
            self.assertEqual(list(petty_ledger.rglob("*.md")), [])

    def test_overseas_root_unset_falls_back_to_archive_root(self):
        """向后兼容:不传 overseas_archive_root → 所有票都进 archive_root。"""
        with tempfile.TemporaryDirectory() as tmp:
            _drop(Path(tmp) / "_inbox", "Lynne", "a.pdf", b"FALLBACK")
            ts_ms = int(__import__("datetime").datetime(2026, 6, 15, 12, 0).timestamp() * 1000)
            f = _fields(invoice_type="invoice", currency="USD", amount=50,
                        invoice_number="INV-FB")
            # 不传 overseas → 走老路径
            _, _, archive_root, _ = _run(tmp, f, submit_ts_ms=ts_ms)
            self.assertTrue(list(archive_root.rglob("*.pdf")))


class SyncReceiptSkipTests(unittest.TestCase):
    """财务规则:receipt(付款收据)不能作报销凭证,ingest 时直接 skip 不入账。"""

    def test_receipt_is_skipped_not_archived(self):
        with tempfile.TemporaryDirectory() as tmp:
            src = _drop(Path(tmp) / "_inbox", "王玲", "Receipt-2774-5711.pdf", b"RECEIPT")
            outcomes, inbox, archive_root, ledger_root = _run(tmp, _fields(is_receipt=True))
            self.assertEqual(outcomes[0].status, "skipped")
            self.assertEqual(outcomes[0].action, "receipt_not_voucher")
            self.assertFalse(src.exists())  # 已移走
            # 移到 _conflict/skipped-receipts/
            skipped_dir = inbox / "_conflict" / "skipped-receipts"
            self.assertTrue((skipped_dir / "Receipt-2774-5711.pdf").exists())
            # 没归档
            self.assertFalse(any(Path(archive_root).rglob("*.pdf")))
            # 没写账本
            self.assertFalse(_ledger_files(ledger_root))

    def test_invoice_normally_synced_when_is_receipt_false(self):
        """is_receipt=False(默认)→ 正常 ingest,不被 skip。"""
        with tempfile.TemporaryDirectory() as tmp:
            _drop(Path(tmp) / "_inbox", "王玲", "Invoice-5PJ0DA3F.pdf", b"INVOICE")
            outcomes, inbox, archive_root, ledger_root = _run(tmp, _fields(is_receipt=False))
            self.assertEqual(outcomes[0].status, "synced")
            self.assertTrue(any(Path(archive_root).rglob("*.pdf")))


class SyncInvoiceNumberSoftDedupTests(unittest.TestCase):
    """v2.5.1:同一张发票收到「扫描件」+「原件」两个不同 PDF(id8 不同,invoice_number 同),
    第二次入账时按 invoice_number 软去重 → 移到 _inbox/_conflict/duplicate-by-invoice-number/。
    invoice_number 为空或 '(无)' 不触发(普票小票常无编号,不能强制去重)。"""

    def test_same_invoice_number_different_content_is_skipped(self):
        with tempfile.TemporaryDirectory() as tmp:
            inbox = Path(tmp) / "_inbox"
            # 第 1 次:扫描件 PDF
            _drop(inbox, "王玲", "scan.pdf", b"SCAN-VERSION")
            outcomes1, _, _, ledger_root = _run(tmp, _fields(invoice_number="INV-001"))
            self.assertEqual(outcomes1[0].action, "created")
            # 第 2 次:原件 PDF(内容字节不一样,id8 不同,但 invoice_number 同)
            src2 = _drop(inbox, "王玲", "original.pdf", b"ORIGINAL-VERSION")
            outcomes2, _, _, _ = _run(tmp, _fields(invoice_number="INV-001"))
            self.assertEqual(outcomes2[0].status, "skipped")
            self.assertEqual(outcomes2[0].action, "duplicate_invoice_number")
            # 移到 _conflict/duplicate-by-invoice-number/
            dup_dir = inbox / "_conflict" / "duplicate-by-invoice-number"
            self.assertTrue((dup_dir / "original.pdf").exists())
            self.assertFalse(src2.exists())
            # 账本仍只有 1 行
            rows = ledger.parse_ledger(_ledger_files(ledger_root)[0])
            self.assertEqual(len(rows), 1)

    def test_empty_invoice_number_does_not_trigger_dedup(self):
        """invoice_number='' 或 '(无)':小票常无编号,允许多张入账,只靠 id8 dedup。"""
        with tempfile.TemporaryDirectory() as tmp:
            inbox = Path(tmp) / "_inbox"
            _drop(inbox, "王玲", "a.pdf", b"A")
            _run(tmp, _fields(invoice_number=""))
            _drop(inbox, "王玲", "b.pdf", b"B")  # 不同内容,id8 不同
            outcomes2, _, _, ledger_root = _run(tmp, _fields(invoice_number=""))
            # 第二张应正常入账,不触发软去重
            self.assertEqual(outcomes2[0].action, "created")
            rows = ledger.parse_ledger(_ledger_files(ledger_root)[0])
            self.assertEqual(len(rows), 2)

    def test_dedup_works_across_reimbursers(self):
        """跨人也按 invoice_number 去重:Lynne 已入过 INV-X,wzb 再投同号 → 跳过。"""
        with tempfile.TemporaryDirectory() as tmp:
            inbox = Path(tmp) / "_inbox"
            _drop(inbox, "Lynne", "a.pdf", b"A")
            _run(tmp, _fields(invoice_number="INV-X"))
            _drop(inbox, "wzb", "b.pdf", b"B")  # 不同人,不同内容
            outcomes2, _, _, _ = _run(tmp, _fields(invoice_number="INV-X"))
            self.assertEqual(outcomes2[0].status, "skipped")
            self.assertEqual(outcomes2[0].action, "duplicate_invoice_number")


if __name__ == "__main__":
    unittest.main()
