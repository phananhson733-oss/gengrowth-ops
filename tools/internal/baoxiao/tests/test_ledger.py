"""section + Obsidian task 设计的账本读写。"""
import importlib.util
import tempfile
import unittest
from pathlib import Path

MODULE_PATH = Path(__file__).resolve().parents[1] / "ledger.py"
SPEC = importlib.util.spec_from_file_location("ledger", MODULE_PATH)
ledger = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(ledger)


SHA = "a1b2c3d4e5f6" + "0" * 52


def _row(**kw):
    base = dict(
        id8="a1b2c3d4",
        file_rel="发票/202601/王玲/202601-办公费-¥1424.pdf",
        reimburser="王玲",
        category="办公费",
        amount=1424.0,
        currency="CNY",
        invoice_number="INV-123",
        period="202601",
        submit_date="2026-06-01 14:30",
        description="测试发票描述",
        settled=ledger.SETTLED_PENDING,
        note="",
    )
    base.update(kw)
    return ledger.LedgerRow(**base)


class ShortIdTests(unittest.TestCase):
    def test_short_id_returns_first_8_chars_lowercase(self):
        self.assertEqual(ledger.short_id("A1B2C3D4E5F6"), "a1b2c3d4")

    def test_short_id_truncates_full_sha256(self):
        self.assertEqual(ledger.short_id(SHA), "a1b2c3d4")


class LedgerPathTests(unittest.TestCase):
    def test_path_under_month_subdir_named_by_reimburser(self):
        p = ledger.ledger_path_for("2026-06", Path("/x/y"), reimburser="王玲")
        self.assertEqual(p, Path("/x/y/2026-06/王玲.md"))


class AppendRowTests(unittest.TestCase):
    def test_creates_file_with_frontmatter_and_first_section(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "2026-06.md"
            added = ledger.append_row(p, _row())
            self.assertTrue(added)
            self.assertTrue(p.exists())
            txt = p.read_text(encoding="utf-8")
            self.assertIn("---\ntitle:", txt)
            self.assertIn("month: 2026-06", txt)
            self.assertIn("### 1. 测试发票描述", txt)
            # v2.5.1:无 id8 注释,改用发票号作 PK
            self.assertNotIn("<!-- id8:", txt)
            self.assertIn("**发票号码**:`INV-123`", txt)
            self.assertIn("- [ ] 已结清", txt)
            self.assertIn("¥1424", txt)

    def test_appends_second_section(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "2026-06.md"
            ledger.append_row(p, _row())
            ledger.append_row(p, _row(id8="deadbeef", description="第二张", category="差旅费",
                                      amount=920, currency="USD", invoice_number="INV-456"))
            txt = p.read_text(encoding="utf-8")
            self.assertIn("**发票号码**:`INV-123`", txt)
            self.assertIn("### 第二张", txt)
            self.assertIn("**发票号码**:`INV-456`", txt)
            self.assertEqual(txt.count("**发票号码**:`INV-123`"), 1)
            self.assertEqual(txt.count("**发票号码**:`INV-456`"), 1)
            self.assertEqual(txt.count("---\ntitle:"), 1)

    def test_idempotent_on_same_invoice_number_returns_false(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "2026-06.md"
            added1 = ledger.append_row(p, _row())
            added2 = ledger.append_row(p, _row(amount=9999, description="覆盖尝试"))
            self.assertTrue(added1)
            self.assertFalse(added2)
            txt = p.read_text(encoding="utf-8")
            self.assertEqual(txt.count("**发票号码**:`INV-123`"), 1)
            self.assertNotIn("9999", txt)
            self.assertNotIn("覆盖尝试", txt)


class ParseLedgerTests(unittest.TestCase):
    def test_round_trips_single_row(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "2026-06.md"
            ledger.append_row(p, _row())
            rows = ledger.parse_ledger(p)
            self.assertEqual(len(rows), 1)
            r = rows[0]
            # v2.5.1:markdown 不再渲染 id8,parse 后 id8 = invoice_number
            self.assertEqual(r.id8, "INV-123")
            self.assertEqual(r.invoice_number, "INV-123")
            self.assertEqual(r.reimburser, "王玲")
            self.assertEqual(r.category, "办公费")
            self.assertEqual(r.amount, 1424.0)
            self.assertEqual(r.currency, "CNY")
            self.assertEqual(r.period, "202601")
            self.assertEqual(r.description, "测试发票描述")
            self.assertEqual(r.settled, ledger.SETTLED_PENDING)

    def test_picks_up_human_task_toggle(self):
        """Lynne 在 Obsidian 点 `- [ ]` → `- [x]`,parse 必须读出已结清。"""
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "2026-06.md"
            ledger.append_row(p, _row())
            txt = p.read_text(encoding="utf-8")
            toggled = txt.replace("- [ ] 已结清", "- [x] 已结清")
            p.write_text(toggled, encoding="utf-8")
            rows = ledger.parse_ledger(p)
            self.assertEqual(rows[0].settled, ledger.SETTLED_OK)

    def test_empty_file_returns_empty_list(self):
        self.assertEqual(ledger.parse_ledger(Path("/nonexistent")), [])

    def test_frontmatter_only_returns_empty(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "2026-06.md"
            p.write_text("---\ntitle: x\n---\n\n# 报销账本 — 2026-06\n", encoding="utf-8")
            self.assertEqual(ledger.parse_ledger(p), [])


class V25NewFieldsRoundTripTests(unittest.TestCase):
    """v2.5 加 invoice_type / billed_to / settled_date / invoice_date 字段,
    format → parse round-trip 不丢字段。"""

    def test_domestic_invoice_with_billed_to(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "2026-06.md"
            ledger.append_row(p, _row(
                invoice_type="domestic",
                billed_to="广州进格智能科技有限公司",
                invoice_date="20260315",
            ))
            r = ledger.parse_ledger(p)[0]
            self.assertEqual(r.invoice_type, "domestic")
            self.assertEqual(r.billed_to, "广州进格智能科技有限公司")
            self.assertEqual(r.invoice_date[:6], "202603")

    def test_overseas_invoice_with_individual_billing(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "2026-06.md"
            ledger.append_row(p, _row(
                invoice_type="overseas",
                billed_to="kellyzjiang@gmail.com",
                invoice_date="20260128",
            ))
            r = ledger.parse_ledger(p)[0]
            self.assertEqual(r.invoice_type, "overseas")
            self.assertEqual(r.billed_to, "kellyzjiang@gmail.com")
            self.assertEqual(r.invoice_date[:6], "202601")

    def test_settled_date_renders_only_when_settled(self):
        """settled=OK 且有 settled_date → 渲染 `结清时间:...` 行(v2.5.1 无 emoji);否则不渲染。
        v2.5.8:即使输入带 HH:MM 也只渲染日期部分。"""
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "2026-06.md"
            ledger.append_row(p, _row(
                settled=ledger.SETTLED_OK,
                settled_date="2026-06-02 15:30",   # 老数据带时间
            ))
            txt = p.read_text(encoding="utf-8")
            # 渲染端自动截到日级
            self.assertIn("**结清时间**:2026-06-02", txt)
            self.assertNotIn("15:30", txt)
            # round-trip:输入带时间但 markdown 只写日期,parse 回来就是日级
            r = ledger.parse_ledger(p)[0]
            self.assertEqual(r.settled_date, "2026-06-02")

    def test_settled_date_not_rendered_when_pending(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "2026-06.md"
            ledger.append_row(p, _row(
                settled=ledger.SETTLED_PENDING,
                settled_date="",
            ))
            txt = p.read_text(encoding="utf-8")
            self.assertNotIn("结清时间", txt)
            r = ledger.parse_ledger(p)[0]
            self.assertEqual(r.settled_date, "")

    def test_no_metadata_lines_when_all_empty(self):
        """invoice_type/billed_to/invoice_date 全为空 → 不渲染对应行(v2.5.1 多行格式,无 🧾)。"""
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "2026-06.md"
            ledger.append_row(p, _row())   # 默认空
            txt = p.read_text(encoding="utf-8")
            self.assertNotIn("发票类型:", txt)
            self.assertNotIn("\n抬头:", txt)   # 加 \n 避免 frontmatter title 误匹配
            self.assertNotIn("开票:", txt)


class V259ShaFieldsRoundTripTests(unittest.TestCase):
    """v2.5.9:source_sha256 / pdf_text_sha256 字段藏在 HTML 注释,Obsidian 不渲染。"""

    SRC_SHA = "a" * 64
    TXT_SHA = "b" * 64

    def test_renders_as_html_comments(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "2026-06.md"
            ledger.append_row(p, _row(
                source_sha256=self.SRC_SHA,
                pdf_text_sha256=self.TXT_SHA,
            ))
            txt = p.read_text(encoding="utf-8")
            self.assertIn(f"<!-- src_sha: {self.SRC_SHA} -->", txt)
            self.assertIn(f"<!-- txt_sha: {self.TXT_SHA} -->", txt)

    def test_round_trip_recovers_both_sha(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "2026-06.md"
            ledger.append_row(p, _row(
                source_sha256=self.SRC_SHA,
                pdf_text_sha256=self.TXT_SHA,
            ))
            r = ledger.parse_ledger(p)[0]
            self.assertEqual(r.source_sha256, self.SRC_SHA)
            self.assertEqual(r.pdf_text_sha256, self.TXT_SHA)

    def test_legacy_row_without_sha_parses_to_empty(self):
        """老 markdown 无 sha 注释 → 字段 = "",不抛。"""
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "2026-06.md"
            ledger.append_row(p, _row())   # 不带 sha
            r = ledger.parse_ledger(p)[0]
            self.assertEqual(r.source_sha256, "")
            self.assertEqual(r.pdf_text_sha256, "")

    def test_only_source_sha_renders_one_comment(self):
        """只有 source_sha256 时只渲一行注释,txt_sha 不强插空注释。"""
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "2026-06.md"
            ledger.append_row(p, _row(source_sha256=self.SRC_SHA))   # pdf_text_sha256 = ""
            txt = p.read_text(encoding="utf-8")
            self.assertIn("src_sha:", txt)
            self.assertNotIn("txt_sha:", txt)


class HammingDistanceTests(unittest.TestCase):
    """v2.5.9 Day 4:Hamming 距离辅助函数。"""

    def test_equal_strings_zero(self):
        self.assertEqual(ledger._hamming_distance("abc123", "abc123"), 0)

    def test_one_char_diff_one(self):
        self.assertEqual(
            ledger._hamming_distance("26317000001991422554", "26317000001991422558"), 1)

    def test_two_char_diff_two(self):
        self.assertEqual(ledger._hamming_distance("12345", "12399"), 2)

    def test_unequal_length_treated_far(self):
        """长度不等 → 视作 +∞ (max(len)+1),不参与近似匹配。"""
        d = ledger._hamming_distance("123", "1234")
        self.assertGreater(d, 2)


class FindNearDuplicateInvoiceNumbersTests(unittest.TestCase):
    """v2.5.9 Day 4:Hamming ≤ N 跨账本扫近似号码 row。"""

    def _seed(self, root: Path, invoice_number: str, *, settled=False):
        ledger.append_row(
            root / "2026-06" / "王玲.md",
            _row(
                invoice_number=invoice_number,
                settled=ledger.SETTLED_OK if settled else ledger.SETTLED_PENDING,
            ),
        )

    def test_hamming_one_hit(self):
        """`...22554` vs `...22558` Hamming=1 → 命中(本次事故复现)。"""
        with tempfile.TemporaryDirectory() as tmpdir:
            tmp = Path(tmpdir)
            root = tmp / "ledger"
            self._seed(root, "26317000001991422554", settled=True)
            hits = ledger.find_near_duplicate_invoice_numbers(
                root, "26317000001991422558", max_distance=2,
            )
            self.assertEqual(len(hits), 1)
            _, _, hd = hits[0]
            self.assertEqual(hd, 1)

    def test_exact_match_also_returned(self):
        """完全相等(Hamming=0)也在结果里,由调用方决定是否过滤。"""
        with tempfile.TemporaryDirectory() as tmpdir:
            tmp = Path(tmpdir)
            root = tmp / "ledger"
            self._seed(root, "INV-EXACT")
            hits = ledger.find_near_duplicate_invoice_numbers(root, "INV-EXACT")
            self.assertEqual(len(hits), 1)
            self.assertEqual(hits[0][2], 0)

    def test_above_threshold_not_returned(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            tmp = Path(tmpdir)
            root = tmp / "ledger"
            self._seed(root, "111111")
            hits = ledger.find_near_duplicate_invoice_numbers(
                root, "999999", max_distance=2,
            )
            self.assertEqual(hits, [])

    def test_empty_target_returns_empty(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            tmp = Path(tmpdir)
            self.assertEqual(
                ledger.find_near_duplicate_invoice_numbers(tmp, ""), [])
            self.assertEqual(
                ledger.find_near_duplicate_invoice_numbers(tmp, "(无)"), [])

    def test_sorted_by_distance(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            tmp = Path(tmpdir)
            root = tmp / "ledger"
            self._seed(root, "12345")  # hd vs 12349 = 1 (位 5)
            ledger.append_row(
                root / "2026-06" / "wzb.md",
                _row(reimburser="wzb", invoice_number="13399"),  # hd vs 12349 = 2 (位 2 + 位 4)
            )
            hits = ledger.find_near_duplicate_invoice_numbers(root, "12349")
            self.assertEqual([hd for _, _, hd in hits], [1, 2])


class NearDupGateTests(unittest.TestCase):
    """v2.5.9:共享三层(+币种)校准 gate — sync 与 audit 的单一事实源。"""

    def _row(self, **kw):
        base = dict(invoice_number="26317000001991422554", amount=1023.0,
                    currency="CNY", invoice_date="20260424")
        base.update(kw)
        return _row(**base)

    def test_full_match_binds(self):
        matched, reason = ledger.near_dup_gate(
            self._row(), 1023.0, "CNY", "20260424", 1)
        self.assertTrue(matched)
        self.assertIn("Hamming=1", reason)

    def test_hamming_above_threshold_passes(self):
        matched, reason = ledger.near_dup_gate(
            self._row(), 1023.0, "CNY", "20260424", 3)
        self.assertFalse(matched)
        self.assertIn("Hamming=3", reason)

    def test_currency_mismatch_passes(self):
        """USD 200 vs CNY 200 跨账本不能误杀。"""
        matched, reason = ledger.near_dup_gate(
            self._row(currency="USD", amount=200.0), 200.0, "CNY", "20260424", 1)
        self.assertFalse(matched)
        self.assertIn("币种不同", reason)

    def test_amount_mismatch_passes(self):
        matched, _ = ledger.near_dup_gate(self._row(), 930.0, "CNY", "20260424", 1)
        self.assertFalse(matched)

    def test_month_mismatch_passes(self):
        matched, _ = ledger.near_dup_gate(self._row(), 1023.0, "CNY", "20260301", 1)
        self.assertFalse(matched)

    def test_dashed_date_format_normalized(self):
        """incoming 带连字符(`2026-04-05`)vs 存量纯数字 → 归一化后同月仍绑定。
        review 实锤:不归一化的话 date gate 永远不等,形同虚设。"""
        matched, _ = ledger.near_dup_gate(
            self._row(invoice_date="20260424"), 1023.0, "CNY", "2026-04-05", 1)
        self.assertTrue(matched)   # 月级比较:202604 == 202604

    def test_both_dates_empty_does_not_bind(self):
        """空 == 空是假象 — 双方都缺日期时 gate 不绑定(防 OCR 双失败误拦)。"""
        matched, reason = ledger.near_dup_gate(
            self._row(invoice_date=""), 1023.0, "CNY", "", 1)
        self.assertFalse(matched)
        self.assertIn("日期缺失", reason)

    def test_both_amounts_zero_does_not_bind(self):
        """0.0 == 0.0 是假象 — $0 Gift 票或 OCR 双漏金额时不绑定。"""
        matched, reason = ledger.near_dup_gate(
            self._row(amount=0.0), 0.0, "CNY", "20260424", 1)
        self.assertFalse(matched)
        self.assertIn("金额缺失或为 0", reason)


class NormalizedHammingScanTests(unittest.TestCase):
    """v2.5.9:find_near_duplicate_invoice_numbers 两侧先 normalize_invoice_key。"""

    def test_fullwidth_and_spaces_no_longer_bypass(self):
        """OCR 给号码塞空格 → 归一化后照样命中 Hamming=1。"""
        with tempfile.TemporaryDirectory() as tmpdir:
            root = Path(tmpdir) / "ledger"
            ledger.append_row(root / "2026-06" / "王玲.md", _row(
                invoice_number="26317000001991422554"))
            hits = ledger.find_near_duplicate_invoice_numbers(
                root, "2631 7000 0019 9142 2558")
            self.assertEqual(len(hits), 1)
            self.assertEqual(hits[0][2], 1)


class FindByShaCrossLedgerTests(unittest.TestCase):
    """v2.5.9:find_by_source_sha256 / find_by_pdf_text_sha256 跨账本查 row。"""

    SHA_A = "a" * 64
    SHA_B = "b" * 64

    def _build_root(self, tmp: Path, *, src_sha=SHA_A, txt_sha=""):
        root = tmp / "ledger"
        path = root / "2026-06" / "王玲.md"
        ledger.append_row(path, _row(
            invoice_number="INV-A",
            source_sha256=src_sha,
            pdf_text_sha256=txt_sha,
        ))
        return root, path

    def test_finds_by_source_sha256(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            tmp = Path(tmpdir)
            root, path = self._build_root(tmp, src_sha=self.SHA_A)
            hit = ledger.find_by_source_sha256(root, self.SHA_A)
            self.assertIsNotNone(hit)
            self.assertEqual(hit[0], path)
            self.assertEqual(hit[1].source_sha256, self.SHA_A)

    def test_finds_by_pdf_text_sha256(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            tmp = Path(tmpdir)
            root, path = self._build_root(tmp, src_sha=self.SHA_A, txt_sha=self.SHA_B)
            hit = ledger.find_by_pdf_text_sha256(root, self.SHA_B)
            self.assertIsNotNone(hit)
            self.assertEqual(hit[0], path)

    def test_empty_sha_input_never_hits(self):
        """两个老 row(都空 sha)不应被误匹配成同一笔。"""
        with tempfile.TemporaryDirectory() as tmpdir:
            tmp = Path(tmpdir)
            root, _ = self._build_root(tmp, src_sha="", txt_sha="")
            self.assertIsNone(ledger.find_by_source_sha256(root, ""))
            self.assertIsNone(ledger.find_by_pdf_text_sha256(root, ""))

    def test_cross_ledger_root_lookup(self):
        """ledger_roots 接 list/tuple — 模拟主账本 + 备用金账本双 root 查 dedup。"""
        with tempfile.TemporaryDirectory() as tmpdir:
            tmp = Path(tmpdir)
            main_root = tmp / "main"
            petty_root = tmp / "petty"
            ledger.append_row(petty_root / "2026-06" / "wzb.md", _row(
                reimburser="wzb",
                invoice_number="OS-1",
                source_sha256=self.SHA_A,
            ))
            hit = ledger.find_by_source_sha256([main_root, petty_root], self.SHA_A)
            self.assertIsNotNone(hit)
            self.assertEqual(hit[1].reimburser, "wzb")


class AutoFillSettledDateTests(unittest.TestCase):
    """v2.5:watch 检测到 Lynne 刚 toggle `- [x] 已结清` → 自动填当前 timestamp。"""

    def test_fills_when_settled_but_no_date(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "2026-06.md"
            ledger.append_row(p, _row(settled=ledger.SETTLED_OK, settled_date=""))
            # v2.5.8:settled_date 截到日级,即使 now_str 带 HH:MM 也只渲染日期
            filled = ledger.auto_fill_settled_dates(p, now_str="2026-06-02")
            self.assertEqual(filled, ["INV-123"])
            r = ledger.parse_ledger(p)[0]
            self.assertEqual(r.settled_date, "2026-06-02")
            txt = p.read_text(encoding="utf-8")
            self.assertIn("**结清时间**:2026-06-02", txt)
            self.assertNotIn("**结清时间**:2026-06-02 ", txt)   # 不带 HH:MM

    def test_skips_when_already_has_date(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "2026-06.md"
            ledger.append_row(p, _row(
                settled=ledger.SETTLED_OK,
                settled_date="2026-05-15",
            ))
            filled = ledger.auto_fill_settled_dates(p, now_str="2026-06-02")
            self.assertEqual(filled, [])
            r = ledger.parse_ledger(p)[0]
            self.assertEqual(r.settled_date, "2026-05-15")   # 不覆盖

    def test_skips_pending_rows(self):
        """未 settle 的 row 不填 settled_date(即便它有空 settled_date)。"""
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "2026-06.md"
            ledger.append_row(p, _row(settled=ledger.SETTLED_PENDING, settled_date=""))
            filled = ledger.auto_fill_settled_dates(p, now_str="2026-06-02 15:30")
            self.assertEqual(filled, [])

    def test_simulates_lynne_toggle_then_watch(self):
        """端到端:Lynne 在 Obsidian 把 `- [ ]` 改成 `- [x]` → watch fire → 自动填日期。"""
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "2026-06.md"
            ledger.append_row(p, _row())  # 默认 pending
            # Lynne 手动 toggle 成 [x]
            txt = p.read_text(encoding="utf-8").replace("- [ ] 已结清", "- [x] 已结清")
            p.write_text(txt, encoding="utf-8")
            # watch 来了
            filled = ledger.auto_fill_settled_dates(p, now_str="2026-06-02")
            self.assertEqual(filled, ["INV-123"])
            self.assertIn("**结清时间**:2026-06-02", p.read_text(encoding="utf-8"))


class FindByIdTests(unittest.TestCase):
    """v2.5.1:find_by_id8 接受 id8(老 markdown)或 invoice_number(新 PK)或子串。"""

    def test_returns_row_when_present_by_invoice_number(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "2026-06.md"
            ledger.append_row(p, _row())
            r = ledger.find_by_id8(p, "INV-123")
            self.assertIsNotNone(r)
            self.assertEqual(r.amount, 1424.0)
            self.assertEqual(r.description, "测试发票描述")

    def test_returns_row_by_substring(self):
        """cli `--ids` 习惯传短码:子串能命中 invoice_number。"""
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "2026-06.md"
            ledger.append_row(p, _row())
            r = ledger.find_by_id8(p, "123")  # 子串
            self.assertIsNotNone(r)

    def test_returns_none_when_absent(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "2026-06.md"
            ledger.append_row(p, _row())
            self.assertIsNone(ledger.find_by_id8(p, "ZZZZZ-not-exist"))

    def test_returns_none_when_file_missing(self):
        self.assertIsNone(ledger.find_by_id8(Path("/nope/x.md"), "INV-123"))


class UpdateRowNoteTests(unittest.TestCase):
    def test_adds_blockquote_note_when_none(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "2026-06.md"
            ledger.append_row(p, _row())
            ok = ledger.update_row_note(p, "INV-123", note="↗ 延至 2026-07")
            self.assertTrue(ok)
            r = ledger.find_by_id8(p, "INV-123")
            self.assertEqual(r.note, "↗ 延至 2026-07")
            self.assertEqual(r.amount, 1424.0)
            self.assertEqual(r.category, "办公费")

    def test_replaces_existing_note(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "2026-06.md"
            ledger.append_row(p, _row(note="原 note"))
            ledger.update_row_note(p, "INV-123", note="新 note ↗ 延至 2026-07")
            r = ledger.find_by_id8(p, "INV-123")
            self.assertEqual(r.note, "新 note ↗ 延至 2026-07")
            txt = p.read_text(encoding="utf-8")
            self.assertNotIn("原 note", txt)

    def test_returns_false_when_key_not_found(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "2026-06.md"
            ledger.append_row(p, _row())
            self.assertFalse(ledger.update_row_note(p, "NOPE-XX-XX", note="x"))

    def test_returns_false_when_file_missing(self):
        self.assertFalse(ledger.update_row_note(Path("/nope/x.md"), "INV-123", note="x"))


class FileLinkRenderTests(unittest.TestCase):
    def test_file_link_in_section_metadata(self):
        """v2.5.1:无 emoji 锚点,链接独占一行 `文件:[name](/path)`。"""
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "2026-06.md"
            ledger.append_row(p, _row())
            txt = p.read_text(encoding="utf-8")
            self.assertIn(
                "**文件链接**:[202601-办公费-¥1424.pdf](/发票/202601/王玲/202601-办公费-¥1424.pdf)",
                txt,
            )


class DashboardTests(unittest.TestCase):
    def test_dashboard_rendered_with_first_append(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "2026-06.md"
            # 给 row 加 invoice_type+billed_to 让它落「可报销」桶有数据(v2.5.8 主账本不再有备用金桶)
            ledger.append_row(p, _row(
                invoice_type="普票", billed_to=ledger.DOMESTIC_TITLE,
            ))
            txt = p.read_text(encoding="utf-8")
            self.assertIn(ledger.DASHBOARD_START, txt)
            self.assertIn(ledger.DASHBOARD_END, txt)
            self.assertIn("| 发票号 | 描述 | 类型 | 金额 | 状态 | 备注 |", txt)
            self.assertIn("| `INV-123` |", txt)
            # dashboard 在 section **之后**(底部布局)
            dash_pos = txt.index(ledger.DASHBOARD_START)
            sec_pos = txt.index("### 1. 测试发票描述")
            self.assertGreater(dash_pos, sec_pos)
            # 月度汇总块出现
            self.assertIn("📊 本月汇总", txt)
            self.assertIn("| 币种 | 总额 | ✅ 已结清 | ⬜ 待结清 |", txt)
            # 单一状态列
            dash_block = txt.split(ledger.DASHBOARD_START)[1].split(ledger.DASHBOARD_END)[0]
            self.assertIn(f"| {ledger.SETTLED_PENDING} |", dash_block)

    def test_main_dashboard_aggregates_reimbursable_and_company_paid(self):
        """v2.5.8 主账本:dashboard 按「抬头 × 币种」聚合,两桶「可报销 / 公户已打款」。
        invoice 类型 row 物理在备用金账本,不出现在主账本。"""
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "2026-06.md"
            # 1 个 gengrowth 国内可报销(普票)
            ledger.append_row(p, _row(
                id8="aaaaaaaa", invoice_number="INV-AA",
                currency="CNY", amount=100,
                invoice_type="普票", billed_to=ledger.DOMESTIC_TITLE,
            ))
            # 1 个公户已打款(普票 + 公户标记)
            ledger.append_row(p, _row(
                id8="bbbbbbbb", invoice_number="INV-BB",
                currency="CNY", amount=200, settled=ledger.SETTLED_OK,
                invoice_type="普票", billed_to=ledger.DOMESTIC_TITLE,
                payer_type="公户",
            ))
            txt = p.read_text(encoding="utf-8")
            dash = txt.split(ledger.DASHBOARD_START)[1].split(ledger.DASHBOARD_END)[0]
            # 两桶
            self.assertIn("可报销", dash)
            self.assertIn("公户已打款", dash)
            # 主账本不渲染备用金桶
            self.assertNotIn("💼 备用金", dash)
            self.assertIn(ledger.DOMESTIC_TITLE, dash)
            self.assertIn("¥100", dash)
            self.assertIn("¥200", dash)

    def test_petty_dashboard_renders_single_table(self):
        """v2.5.8 备用金账本:dashboard 单一聚合表 + 含人民币/付款证明列。
        汇总表已结清/待结清用人民币金额(实际结算口径)。"""
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "备用金" / "2026-06" / "Lynne.md"
            ledger.append_row(p, _row(
                id8="bbbbbbbb", invoice_number="INV-BB",
                currency="USD", amount=50,
                invoice_type="invoice", billed_to="kellyzjiang@gmail.com",
            ))
            ledger.append_row(p, _row(
                id8="cccccccc", invoice_number="INV-CC",
                currency="HKD", amount=7599,
                invoice_type="invoice", billed_to="Wang Ling",
                amount_cny=6692.39, settled=ledger.SETTLED_OK,
                settled_date="2026-06-02",
            ))
            txt = p.read_text(encoding="utf-8")
            dash = txt.split(ledger.DASHBOARD_START)[1].split(ledger.DASHBOARD_END)[0]
            self.assertIn("petty-cash-ledger", txt)
            self.assertIn("备用金支出", dash)
            self.assertNotIn("可报销", dash)
            # v2.5.8:汇总表已结清/待结清用人民币(¥ 后缀)
            self.assertIn("✅ 已结清(¥)", dash)
            self.assertIn("⬜ 待结清(¥)", dash)
            # Wang Ling HK$7599 已结清 → 用手填 amount_cny 6692.39
            wl_line = next(ln for ln in dash.split("\n") if ln.startswith("| Wang Ling"))
            self.assertIn("¥6692.39", wl_line)
            # 全部 invoice 表头(不变)
            self.assertIn("| 人民币 | 付款证明 |", dash)

    def test_dashboard_grows_on_subsequent_append(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "2026-06.md"
            ledger.append_row(p, _row())
            ledger.append_row(p, _row(id8="deadbeef", description="第二张",
                                      invoice_number="INV-456"))
            txt = p.read_text(encoding="utf-8")
            self.assertEqual(txt.count(ledger.DASHBOARD_START), 1)
            self.assertEqual(txt.count(ledger.DASHBOARD_END), 1)
            dash_block = txt.split(ledger.DASHBOARD_START)[1].split(ledger.DASHBOARD_END)[0]
            self.assertIn("| `INV-123` |", dash_block)
            self.assertIn("| `INV-456` |", dash_block)

    def test_dashboard_reflects_task_toggle_after_refresh(self):
        """Lynne 点了 task → dashboard 应该在调用 refresh_dashboard 后同步状态。"""
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "2026-06.md"
            ledger.append_row(p, _row())
            txt = p.read_text(encoding="utf-8")
            txt = txt.replace("- [ ] 已结清", "- [x] 已结清", 1)
            p.write_text(txt, encoding="utf-8")
            ledger.refresh_dashboard(p)
            txt = p.read_text(encoding="utf-8")
            dash_block = txt.split(ledger.DASHBOARD_START)[1].split(ledger.DASHBOARD_END)[0]
            self.assertIn(f"| {ledger.SETTLED_OK} |", dash_block)

    def test_dashboard_refresh_is_idempotent(self):
        """连续两次 refresh 应该不改变文件 mtime(避免 launchd WatchPaths 死循环)。"""
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "2026-06.md"
            ledger.append_row(p, _row())
            ledger.refresh_dashboard(p)
            mtime1 = p.stat().st_mtime_ns
            # 等一小段时间让 mtime 有变化的可能
            import time as _t
            _t.sleep(0.01)
            ledger.refresh_dashboard(p)
            mtime2 = p.stat().st_mtime_ns
            self.assertEqual(mtime1, mtime2)   # 内容没变,不写入

    def test_dashboard_refreshed_on_update_row_note(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "2026-06.md"
            ledger.append_row(p, _row())
            ledger.update_row_note(p, "INV-123", note="↗ 延至 2026-07")
            txt = p.read_text(encoding="utf-8")
            dash_block = txt.split(ledger.DASHBOARD_START)[1].split(ledger.DASHBOARD_END)[0]
            self.assertIn("↗ 延至 2026-07", dash_block)


class PayerTypeCompanyPaidTests(unittest.TestCase):
    """v2.5.7:公户已打款 = Obsidian task box,勾上后自动联动 settled + settled_date=invoice_date。"""

    def test_default_renders_unticked_company_paid_task(self):
        """默认每张发票底部都有 `- [ ] 公户已打款` task,Lynne 可点击勾选。"""
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "2026-06.md"
            ledger.append_row(p, _row())
            txt = p.read_text(encoding="utf-8")
            self.assertIn("- [ ] 公户已打款", txt)
            self.assertNotIn("**报销对象**", txt)   # 老字段不再渲染

    def test_company_paid_row_renders_ticked_task(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "2026-06.md"
            ledger.append_row(p, _row(
                id8="aaaaaaaa", invoice_number="INV-CP",
                payer_type="公户",
                invoice_type="普票", billed_to=ledger.DOMESTIC_TITLE,
            ))
            txt = p.read_text(encoding="utf-8")
            self.assertIn("- [x] 公户已打款", txt)

    def test_task_box_state_roundtrips_to_payer_type(self):
        """Lynne 手动 toggle task box → parse 出 payer_type=公户。"""
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "2026-06.md"
            ledger.append_row(p, _row(id8="bbbbbbbb", invoice_number="INV-RT"))
            text = p.read_text(encoding="utf-8")
            text = text.replace("- [ ] 公户已打款", "- [x] 公户已打款", 1)
            p.write_text(text, encoding="utf-8")
            rows = ledger.parse_ledger(p)
            self.assertEqual(rows[0].payer_type, "公户")

    def test_legacy_field_format_still_parses(self):
        """老 markdown 用 `**报销对象**:公户` 字段记的,parse 仍能识别。"""
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "2026-06.md"
            p.write_text(
                "---\ntitle: x\n---\n\n### 1. test\n"
                "- **发票号码**:`L-1`\n"
                "- **报销对象**:公户\n"
                "- **金额数量**:¥100\n",
                encoding="utf-8",
            )
            rows = ledger.parse_ledger(p)
            self.assertEqual(rows[0].payer_type, "公户")

    def test_company_paid_auto_settled_with_invoice_date(self):
        """Req 1b:勾公户 → refresh 时自动 settled=✅ + settled_date=invoice_date 渲染日期。"""
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "2026-06.md"
            ledger.append_row(p, _row(
                id8="cccccccc", invoice_number="INV-AUTO",
                invoice_type="普票", billed_to=ledger.DOMESTIC_TITLE,
                invoice_date="20260430",
            ))
            # 用户在 Obsidian 手动勾上「公户已打款」
            text = p.read_text(encoding="utf-8").replace(
                "- [ ] 公户已打款", "- [x] 公户已打款", 1)
            p.write_text(text, encoding="utf-8")
            # watch 触发 refresh_dashboard → 联动
            ledger.refresh_dashboard(p)
            rows = ledger.parse_ledger(p)
            self.assertEqual(rows[0].payer_type, "公户")
            self.assertEqual(rows[0].settled, ledger.SETTLED_OK)
            self.assertEqual(rows[0].settled_date, "2026-04-30")
            # markdown 里两个 task 都应该是 [x]
            text2 = p.read_text(encoding="utf-8")
            self.assertIn("- [x] 公户已打款", text2)
            self.assertIn("- [x] 已结清", text2)

    def test_company_paid_with_yyyymm_invoice_date(self):
        """invoice_date 只到月份 → settled_date 也只到月份。"""
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "2026-06.md"
            ledger.append_row(p, _row(
                id8="dddddddd", invoice_number="INV-MM",
                invoice_type="invoice", billed_to="AIGenesis Limited",
                invoice_date="20260501",   # day=01 视为月级占位
                payer_type="公户",
            ))
            ledger.refresh_dashboard(p)
            rows = ledger.parse_ledger(p)
            self.assertEqual(rows[0].settled_date, "2026-05")

    def test_main_summary_splits_company_paid_into_separate_bucket(self):
        """v2.5.8 主账本:公户票出现在「公户已打款」桶,不混进「可报销」。
        invoice 类型 row 物理在备用金账本(不出现在主账本)。"""
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "2026-06.md"
            ledger.append_row(p, _row(
                id8="aaaaaaaa", invoice_number="INV-AA",
                amount=100, currency="CNY",
                invoice_type="普票", billed_to=ledger.DOMESTIC_TITLE,
            ))
            ledger.append_row(p, _row(
                id8="bbbbbbbb", invoice_number="INV-BB",
                amount=200, currency="CNY",
                invoice_type="普票", billed_to=ledger.DOMESTIC_TITLE,
                payer_type="公户",
            ))
            txt = p.read_text(encoding="utf-8")
            dash = txt.split(ledger.DASHBOARD_START)[1].split(ledger.DASHBOARD_END)[0]
            self.assertIn("可报销", dash)
            self.assertIn("公户已打款", dash)
            self.assertNotIn("💼 备用金", dash)   # 主账本不显示备用金桶
            reimb_block, _, rest = dash.partition("公户已打款")
            self.assertIn("¥100", reimb_block)
            self.assertNotIn("¥200", reimb_block)
            self.assertIn("¥200", rest)

    def test_main_summary_renders_two_buckets_even_when_empty(self):
        """v2.5.8 主账本:两桶表头都要出现,空桶显示「(暂无)」占位。"""
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "2026-06.md"
            ledger.append_row(p, _row(
                id8="aaaaaaaa", invoice_number="INV-ONLY",
                amount=100, currency="CNY",
                invoice_type="普票", billed_to=ledger.DOMESTIC_TITLE,
            ))
            txt = p.read_text(encoding="utf-8")
            dash = txt.split(ledger.DASHBOARD_START)[1].split(ledger.DASHBOARD_END)[0]
            self.assertIn("可报销", dash)
            self.assertIn("公户已打款", dash)
            self.assertNotIn("💼 备用金", dash)
            # 公户桶空 → 占位"暂无"
            self.assertEqual(dash.count("_(暂无)_"), 1)


class PettyCashFieldsTests(unittest.TestCase):
    """v2.5.7 备用金账本专用字段:付款证明(markdown 链接)、人民币金额。
    普通报销不渲染;海外 invoice 备用金记账显式带值时渲染。"""

    def test_default_petty_fields_not_rendered(self):
        """非 invoice 类型(国内普票)默认不渲染付款证明字段(主账本兼容)。"""
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "2026-06.md"
            ledger.append_row(p, _row())   # 默认 invoice_type="",不是 invoice
            txt = p.read_text(encoding="utf-8")
            self.assertNotIn("付款证明", txt)
            self.assertNotIn("人民币金额", txt)

    def test_invoice_type_row_always_shows_payment_proof(self):
        """v2.5.8:invoice 类型 row 始终显示「付款证明」字段(空时占位"(待补充)")。"""
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "2026-06.md"
            ledger.append_row(p, _row(
                id8="abcd1234",
                invoice_type="invoice",
                billed_to="Wang Ling",
                amount=100,
                currency="USD",
            ))
            txt = p.read_text(encoding="utf-8")
            self.assertIn("**付款证明**:(待补充)", txt)

    def test_payment_proof_link_renders_and_roundtrips(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "2026-06.md"
            ledger.append_row(p, _row(
                id8="aaaaaaaa", invoice_number="INV-PP",
                payment_proof="[微信支付截图](/备用金/2026-06/Lynne/wechatpay-202606-办公费.png)",
            ))
            txt = p.read_text(encoding="utf-8")
            self.assertIn("**付款证明**:[微信支付截图]", txt)
            rows = ledger.parse_ledger(p)
            self.assertIn("微信支付截图", rows[0].payment_proof)

    def test_amount_cny_renders_and_roundtrips(self):
        """HKD 7599 + 实际付款 ¥6692.39 → 渲染 + 解析回 6692.39。"""
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "2026-06.md"
            ledger.append_row(p, _row(
                id8="bbbbbbbb", invoice_number="INV-CNY",
                currency="HKD", amount=7599,
                amount_cny=6692.39,
            ))
            txt = p.read_text(encoding="utf-8")
            self.assertIn("**人民币金额**:¥6692.39", txt)
            rows = ledger.parse_ledger(p)
            self.assertAlmostEqual(rows[0].amount_cny, 6692.39, places=2)

    def test_zero_amount_cny_renders(self):
        """0 也是有效值(免费 invoice / 试用),不被 None 吞掉。"""
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "2026-06.md"
            ledger.append_row(p, _row(
                id8="cccccccc", invoice_number="INV-ZERO",
                currency="USD", amount=0,
                amount_cny=0.0,
            ))
            txt = p.read_text(encoding="utf-8")
            self.assertIn("**人民币金额**:¥0", txt)


class EstimateCnyTests(unittest.TestCase):
    """v2.5.7:三级 fallback — 本地缓存 → 在线 API → 硬编码近期均值。"""

    def setUp(self):
        # 默认 mock 在线 fetcher 返回 None,强制 fallback 路径(避免测试触网)
        self._orig_fetcher = ledger._fetch_fx_rate_online
        ledger._fetch_fx_rate_online = lambda code, iso_date: None
        # 隔离 cache:测试 cache 路径放 tmpdir,不污染真实 logs/fx-cache.json
        self._tmpcache = tempfile.TemporaryDirectory()
        self._orig_cache_path = ledger._FX_CACHE_PATH
        ledger._FX_CACHE_PATH = Path(self._tmpcache.name) / "fx-cache.json"

    def tearDown(self):
        ledger._fetch_fx_rate_online = self._orig_fetcher
        ledger._FX_CACHE_PATH = self._orig_cache_path
        self._tmpcache.cleanup()

    def test_cny_passthrough(self):
        self.assertEqual(ledger.estimate_cny(100, "CNY"), 100.0)

    def test_usd_fallback_when_no_date_and_no_online(self):
        v = ledger.estimate_cny(100, "USD")
        self.assertIsNotNone(v)
        self.assertGreater(v, 600)   # ~7.18 fallback → ~718

    def test_hkd_fallback(self):
        v = ledger.estimate_cny(100, "HKD")
        self.assertIsNotNone(v)
        self.assertLess(v, 100)      # ~0.92 fallback → ~92

    def test_unknown_currency_returns_none(self):
        self.assertIsNone(ledger.estimate_cny(100, "BTC"))

    def test_zero_amount_returns_none(self):
        self.assertIsNone(ledger.estimate_cny(0, "USD"))

    def test_invoice_date_uses_online_fetcher(self):
        """invoice_date 传了 + 在线 fetcher 有返回 → 用 API 汇率(不走 fallback 表)。"""
        ledger._fetch_fx_rate_online = lambda code, iso: 7.30 if code == "USD" else None
        v = ledger.estimate_cny(100, "USD", invoice_date="20260605")
        self.assertEqual(v, 730.0)

    def test_online_failure_falls_back_to_hardcoded(self):
        """API 失败(返回 None)→ fallback 到硬编码均值。"""
        ledger._fetch_fx_rate_online = lambda c, d: None
        v = ledger.estimate_cny(100, "USD", invoice_date="20260605")
        self.assertIsNotNone(v)
        self.assertGreater(v, 600)   # fallback 7.18 → 718

    def test_cache_persists_and_takes_precedence(self):
        """缓存命中 → 不调 API。"""
        import tempfile
        with tempfile.TemporaryDirectory() as tmp:
            orig_cache = ledger._FX_CACHE_PATH
            ledger._FX_CACHE_PATH = Path(tmp) / "fx-cache.json"
            try:
                # 第一次调用 mock 返回 7.30,会写缓存
                ledger._fetch_fx_rate_online = lambda c, d: 7.30
                v1 = ledger.estimate_cny(100, "USD", invoice_date="20260605")
                self.assertEqual(v1, 730.0)
                # 第二次:fetcher 改成返回完全不同的值,但 cache 命中应忽略
                ledger._fetch_fx_rate_online = lambda c, d: 99.99
                v2 = ledger.estimate_cny(100, "USD", invoice_date="20260605")
                self.assertEqual(v2, 730.0)   # 还是缓存里的 7.30
            finally:
                ledger._FX_CACHE_PATH = orig_cache


class MigrateInvoicesToPettyTests(unittest.TestCase):
    """v2.5.8:一次性迁移 — 主账本 invoice row 物理迁到备用金账本(append+delete)。"""

    def setUp(self):
        # mock 网络 + 隔离缓存
        self._orig_fetcher = ledger._fetch_fx_rate_online
        ledger._fetch_fx_rate_online = lambda code, iso: None
        self._tmpcache = tempfile.TemporaryDirectory()
        self._orig_cache_path = ledger._FX_CACHE_PATH
        ledger._FX_CACHE_PATH = Path(self._tmpcache.name) / "fx-cache.json"

    def tearDown(self):
        ledger._fetch_fx_rate_online = self._orig_fetcher
        ledger._FX_CACHE_PATH = self._orig_cache_path
        self._tmpcache.cleanup()

    def _setup(self, tmp):
        wiki_root = Path(tmp)
        ledger_root = wiki_root / "报销"
        petty_root = wiki_root / "备用金"
        lp = ledger.ledger_path_for("2026-06", ledger_root, reimburser="Lynne")
        ledger.append_row(lp, _row(
            id8="aaaaaaaa", invoice_number="INV-DOM",
            amount=100, currency="CNY",
            invoice_type="普票", billed_to=ledger.DOMESTIC_TITLE,
        ))
        ledger.append_row(lp, _row(
            id8="bbbbbbbb", invoice_number="INV-OS",
            amount=129, currency="USD",
            invoice_type="invoice", billed_to="AIGenesis Limited",
            description="Ahrefs 月订阅",
            invoice_date="20260601",
        ))
        ledger.append_row(lp, _row(
            id8="cccccccc", invoice_number="INV-CP",
            amount=200, currency="CNY",
            invoice_type="普票", billed_to=ledger.DOMESTIC_TITLE,
            payer_type="公户",
        ))
        return wiki_root, ledger_root, petty_root

    def test_migrates_only_invoice_type_rows(self):
        with tempfile.TemporaryDirectory() as tmp:
            wiki_root, ledger_root, petty_root = self._setup(tmp)
            moved = ledger.migrate_invoices_to_petty(ledger_root, petty_root)
            self.assertEqual(len(moved), 1)
            self.assertEqual(moved[0][0], "INV-OS")

    def test_invoice_row_appears_in_petty_ledger(self):
        with tempfile.TemporaryDirectory() as tmp:
            wiki_root, ledger_root, petty_root = self._setup(tmp)
            ledger.migrate_invoices_to_petty(ledger_root, petty_root)
            petty_path = petty_root / "2026-06" / "Lynne.md"
            self.assertTrue(petty_path.exists())
            txt = petty_path.read_text(encoding="utf-8")
            self.assertIn("INV-OS", txt)
            self.assertIn("petty-cash-ledger", txt)   # frontmatter 标 petty

    def test_invoice_row_removed_from_main_ledger(self):
        with tempfile.TemporaryDirectory() as tmp:
            wiki_root, ledger_root, petty_root = self._setup(tmp)
            ledger.migrate_invoices_to_petty(ledger_root, petty_root)
            main_path = ledger.ledger_path_for("2026-06", ledger_root, reimburser="Lynne")
            txt = main_path.read_text(encoding="utf-8")
            self.assertNotIn("INV-OS", txt)
            self.assertIn("INV-DOM", txt)   # 普票仍在
            self.assertIn("INV-CP", txt)    # 公户仍在

    def test_idempotent_no_duplicate_on_rerun(self):
        with tempfile.TemporaryDirectory() as tmp:
            wiki_root, ledger_root, petty_root = self._setup(tmp)
            moved1 = ledger.migrate_invoices_to_petty(ledger_root, petty_root)
            moved2 = ledger.migrate_invoices_to_petty(ledger_root, petty_root)
            self.assertEqual(len(moved1), 1)
            self.assertEqual(len(moved2), 0)   # 已迁过,主账本无 invoice row

    def test_no_invoice_rows_returns_empty(self):
        with tempfile.TemporaryDirectory() as tmp:
            wiki_root = Path(tmp)
            ledger_root = wiki_root / "报销"
            petty_root = wiki_root / "备用金"
            lp = ledger.ledger_path_for("2026-06", ledger_root, reimburser="Lynne")
            ledger.append_row(lp, _row(
                invoice_type="普票", billed_to=ledger.DOMESTIC_TITLE,
            ))
            moved = ledger.migrate_invoices_to_petty(ledger_root, petty_root)
            self.assertEqual(moved, [])

    def test_invoice_without_number_uses_id8_fallback_for_delete(self):
        """v2.5.8 bug fix #1:无 invoice_number 的 invoice row 不应半迁移。
        旧版本 _delete_row_from_ledger("") 永远不匹配,导致主账本残留 + 备用金账本已写。"""
        with tempfile.TemporaryDirectory() as tmp:
            wiki_root = Path(tmp)
            ledger_root = wiki_root / "报销"
            petty_root = wiki_root / "备用金"
            lp = ledger.ledger_path_for("2026-06", ledger_root, reimburser="Lynne")
            # 无 invoice_number(海外 invoice 偶尔出现)
            ledger.append_row(lp, _row(
                id8="ffffeeee", invoice_number="",
                invoice_type="invoice", billed_to="Wang Ling",
                amount=100, currency="USD",
                description="No number invoice",
            ))
            moved = ledger.migrate_invoices_to_petty(ledger_root, petty_root)
            self.assertEqual(len(moved), 1)
            # 主账本应删除
            main_txt = lp.read_text(encoding="utf-8")
            self.assertNotIn("No number invoice", main_txt)
            # 备用金账本应有
            petty_txt = (petty_root / "2026-06" / "Lynne.md").read_text(encoding="utf-8")
            self.assertIn("No number invoice", petty_txt)


class FindByInvoiceNumberDualRootTests(unittest.TestCase):
    """v2.5.8 bug fix #3:find_by_invoice_number 同时扫主账本和备用金账本。"""

    def test_finds_in_main_ledger_root(self):
        with tempfile.TemporaryDirectory() as tmp:
            main = Path(tmp) / "报销"
            petty = Path(tmp) / "备用金"
            lp_main = ledger.ledger_path_for("2026-06", main, reimburser="Lynne")
            ledger.append_row(lp_main, _row(invoice_number="MAIN-1"))
            res = ledger.find_by_invoice_number([main, petty], "MAIN-1")
            self.assertIsNotNone(res)
            self.assertEqual(res[1].invoice_number, "MAIN-1")

    def test_finds_in_petty_ledger_root(self):
        with tempfile.TemporaryDirectory() as tmp:
            main = Path(tmp) / "报销"
            petty = Path(tmp) / "备用金"
            lp_petty = ledger.ledger_path_for("2026-06", petty, reimburser="Lynne")
            ledger.append_row(lp_petty, _row(
                invoice_number="PETTY-1", invoice_type="invoice",
                billed_to="Wang Ling",
            ))
            res = ledger.find_by_invoice_number([main, petty], "PETTY-1")
            self.assertIsNotNone(res)
            self.assertEqual(res[1].invoice_number, "PETTY-1")

    def test_returns_none_when_in_neither(self):
        with tempfile.TemporaryDirectory() as tmp:
            main = Path(tmp) / "报销"
            petty = Path(tmp) / "备用金"
            self.assertIsNone(ledger.find_by_invoice_number([main, petty], "NOWHERE"))

    def test_backward_compat_single_root(self):
        """老 API 单 root 调用仍 work(v2.5.7 兼容)。"""
        with tempfile.TemporaryDirectory() as tmp:
            main = Path(tmp) / "报销"
            lp = ledger.ledger_path_for("2026-06", main, reimburser="Lynne")
            ledger.append_row(lp, _row(invoice_number="SINGLE-1"))
            res = ledger.find_by_invoice_number(main, "SINGLE-1")
            self.assertIsNotNone(res)


class FxFiniteValidationTests(unittest.TestCase):
    """v2.5.8 bug fix #5:FX API 返回 NaN/Inf/0/负数时 fallback 到硬编码均值。"""

    def setUp(self):
        self._orig_fetcher = ledger._fetch_fx_rate_online
        self._tmpcache = tempfile.TemporaryDirectory()
        self._orig_cache_path = ledger._FX_CACHE_PATH
        ledger._FX_CACHE_PATH = Path(self._tmpcache.name) / "fx-cache.json"

    def tearDown(self):
        ledger._fetch_fx_rate_online = self._orig_fetcher
        ledger._FX_CACHE_PATH = self._orig_cache_path
        self._tmpcache.cleanup()

    def test_nan_falls_back(self):
        ledger._fetch_fx_rate_online = lambda c, d: float("nan")
        v = ledger.estimate_cny(100, "USD", invoice_date="20260605")
        # 应该 fallback 到 _FX_TO_CNY_FALLBACK["USD"] = 7.18 → 718
        self.assertEqual(v, 718.0)

    def test_inf_falls_back(self):
        ledger._fetch_fx_rate_online = lambda c, d: float("inf")
        v = ledger.estimate_cny(100, "USD", invoice_date="20260605")
        self.assertEqual(v, 718.0)

    def test_zero_rate_falls_back(self):
        ledger._fetch_fx_rate_online = lambda c, d: 0.0
        v = ledger.estimate_cny(100, "USD", invoice_date="20260605")
        self.assertEqual(v, 718.0)

    def test_negative_rate_falls_back(self):
        ledger._fetch_fx_rate_online = lambda c, d: -7.5
        v = ledger.estimate_cny(100, "USD", invoice_date="20260605")
        self.assertEqual(v, 718.0)


class CurrencyRenderTests(unittest.TestCase):
    def test_hkd_renders_with_hk_dollar_prefix(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "2026-06.md"
            ledger.append_row(p, _row(currency="HKD", amount=7599))
            txt = p.read_text(encoding="utf-8")
            self.assertIn("HK$7599", txt)
            self.assertEqual(ledger.parse_ledger(p)[0].currency, "HKD")

    def test_usd_renders_with_dollar_prefix(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "2026-06.md"
            ledger.append_row(p, _row(currency="USD", amount=129))
            r = ledger.parse_ledger(p)[0]
            self.assertEqual(r.currency, "USD")
            self.assertEqual(r.amount, 129.0)


class TruncateSettledDateTests(unittest.TestCase):
    """v2.5.9:codex 评审发现的 truncate 边界 + 真实日期校验"""

    def test_pure_date_passes(self):
        self.assertEqual(ledger._truncate_settled_date_to_day("2026-06-02"), "2026-06-02")

    def test_date_with_hh_mm_truncates(self):
        self.assertEqual(ledger._truncate_settled_date_to_day("2026-06-02 17:08"), "2026-06-02")

    def test_iso_t_separator_truncates(self):
        self.assertEqual(ledger._truncate_settled_date_to_day("2026-06-02T17:08:00"), "2026-06-02")

    def test_yyyy_mm_only_preserved(self):
        self.assertEqual(ledger._truncate_settled_date_to_day("2026-06"), "2026-06")

    def test_empty_preserved(self):
        self.assertEqual(ledger._truncate_settled_date_to_day(""), "")
        self.assertEqual(ledger._truncate_settled_date_to_day(None), "")

    def test_garbage_after_date_rejected(self):
        # "2026-06-02garbage" 不应被悄悄截成 "2026-06-02"(无边界 → 原样返回)
        self.assertEqual(
            ledger._truncate_settled_date_to_day("2026-06-02garbage"),
            "2026-06-02garbage",
        )

    def test_invalid_real_date_rejected(self):
        # 语法合法但值非法 — fromisoformat 抛 ValueError → 原样返回
        self.assertEqual(
            ledger._truncate_settled_date_to_day("2026-99-99 12:00"),
            "2026-99-99 12:00",
        )
        self.assertEqual(
            ledger._truncate_settled_date_to_day("2026-13-40"),
            "2026-13-40",
        )

    def test_corrupt_alpha_rejected(self):
        # "abcd-ef-ghijkl" — 老 s[4]=='-' guard 会截成 "abcd-ef-gh",新 regex 拒掉
        self.assertEqual(
            ledger._truncate_settled_date_to_day("abcd-ef-ghijkl"),
            "abcd-ef-ghijkl",
        )


class ConflictMarkerGuardTests(unittest.TestCase):
    """v2.5.9:watch 在 obsidian-git 未 resolve 的 unmerged 文件上跑,不应该污染。"""

    def test_has_conflict_markers_positive(self):
        for sample in (
            "abc\n<<<<<<< HEAD\nfoo\n",
            "abc\n=======\nfoo\n",
            "abc\n>>>>>>> origin/main\nfoo\n",
            "abc\n<<<<<<< ours\n=======\n>>>>>>> theirs\n",
        ):
            self.assertTrue(ledger._has_conflict_markers(sample), repr(sample))

    def test_has_conflict_markers_negative(self):
        for sample in (
            "abc\n> quote\nfoo\n",            # 单 `> ` 是 note,不是 marker
            "abc\n>> nested\nfoo\n",          # 嵌套 quote 不是 marker
            "= heading =\n",                  # 普通等号
            "<<< 不到 7 个的箭头\n",           # 必须严格 7 个
            ">>>>>>>原币\n",                  # 7 个 `>` 但后面没空格(不像 marker;markdown 也不识)
        ):
            self.assertFalse(ledger._has_conflict_markers(sample), repr(sample))

    def test_refresh_dashboard_noop_on_unmerged(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "Lynne.md"
            r = _row(invoice_number="INV-A")
            ledger.append_row(p, r)
            # 注入 conflict markers,模拟 obsidian-git 中途断裂
            text = p.read_text(encoding="utf-8")
            tainted = text + "\n<<<<<<< HEAD\nfoo\n=======\nbar\n>>>>>>> origin/main\n"
            p.write_text(tainted, encoding="utf-8")
            before = p.read_text(encoding="utf-8")
            self.assertFalse(ledger.refresh_dashboard(p))
            self.assertEqual(p.read_text(encoding="utf-8"), before)

    def test_auto_fill_settled_dates_noop_on_unmerged(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "Lynne.md"
            r = _row(
                invoice_number="INV-B",
                settled=ledger.SETTLED_OK,
                settled_date="",
            )
            ledger.append_row(p, r)
            text = p.read_text(encoding="utf-8")
            tainted = text + "\n<<<<<<< HEAD\nx\n>>>>>>> origin/main\n"
            p.write_text(tainted, encoding="utf-8")
            before = p.read_text(encoding="utf-8")
            self.assertEqual(ledger.auto_fill_settled_dates(p), [])
            self.assertEqual(p.read_text(encoding="utf-8"), before)

    def test_summary_write_total_skips_when_any_source_unmerged(self):
        # 任一源 ledger 含 conflict markers → summary.write_total 整体 no-op,
        # 防止聚合时 unmerged 文件 parse 出错 row 把数据写丢。
        import importlib.util
        summary_path = Path(__file__).resolve().parents[1] / "summary.py"
        spec = importlib.util.spec_from_file_location("summary", summary_path)
        summary = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(summary)
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            month_dir = root / "2026-06"
            month_dir.mkdir(parents=True)
            clean = month_dir / "Lynne.md"
            ledger.append_row(clean, _row(invoice_number="INV-CLEAN"))
            tainted = month_dir / "wzb.md"
            ledger.append_row(tainted, _row(invoice_number="INV-TAINT", reimburser="wzb"))
            tainted.write_text(
                tainted.read_text(encoding="utf-8")
                + "\n<<<<<<< HEAD\nbad\n>>>>>>> origin/main\n",
                encoding="utf-8",
            )
            # 第一次跑出基线总表(此时 tainted 还没写脏)→ 先抹掉 marker 写,再重置 marker
            # 简化:总表不存在时 write_total 第一次会跑;我们让它先无 unmerged 跑一次
            tainted.write_text(
                tainted.read_text(encoding="utf-8").replace(
                    "<<<<<<< HEAD\nbad\n>>>>>>> origin/main\n", ""
                ),
                encoding="utf-8",
            )
            self.assertTrue(summary.write_total(root))
            total_path = root / "总表.md"
            baseline = total_path.read_text(encoding="utf-8")
            # 现在再注入 marker,write_total 应 return False 不重写
            tainted.write_text(
                tainted.read_text(encoding="utf-8")
                + "\n<<<<<<< HEAD\nbad\n>>>>>>> origin/main\n",
                encoding="utf-8",
            )
            self.assertFalse(summary.write_total(root))
            self.assertEqual(total_path.read_text(encoding="utf-8"), baseline)


class MultilineNoteRoundTripTests(unittest.TestCase):
    """v2.5.9:Lynne 手动在 sync 写的 note 下面再加一行 `> ...`,
    watch 触发的 refresh_dashboard / auto_fill_settled_dates 走 parse→format
    round-trip,必须保留她加的行,不能吞掉。"""

    def _section_with_note(self, note_str: str) -> str:
        r = _row(note=note_str)
        return ledger._format_section(r)

    def test_single_line_note_round_trips(self):
        # 回归:单行 note(sync 默认产物)仍正确往返
        r = _row(note="⚠️ 与已结清 INV-XYZ Hamming=1 高度疑似重复")
        sec = ledger._format_section(r)
        self.assertIn("\n> ⚠️ 与已结清", sec)
        self.assertEqual(ledger._parse_note_block(sec), r.note)

    def test_two_line_note_round_trips(self):
        # 关键 case:Lynne 手加第二行
        sec = self._section_with_note("⚠️ 待核\n核对完毕 OK")
        self.assertIn("\n> ⚠️ 待核\n> 核对完毕 OK\n", sec)
        self.assertEqual(ledger._parse_note_block(sec), "⚠️ 待核\n核对完毕 OK")

    def test_empty_line_inside_block_preserved(self):
        # 块内空 `>` 行(markdown 段落分隔)— 保留
        note = "第一段\n\n第二段"  # 内嵌空行
        sec = self._section_with_note(note)
        self.assertIn("\n> 第一段\n>\n> 第二段\n", sec)
        self.assertEqual(ledger._parse_note_block(sec), "第一段\n\n第二段")

    def test_parse_only_first_blockquote_block(self):
        # 多块分散:第二块隔了空行 + 别的内容 — 只取第一块
        sec = (
            "### test\n"
            "- desc\n"
            "\n"
            "> 第一块\n"
            "> 第一块第二行\n"
            "\n"
            "**结清时间**:2026-06-10\n"
            "\n"
            "> 第二块(应被忽略)\n"
        )
        self.assertEqual(
            ledger._parse_note_block(sec),
            "第一块\n第一块第二行",
        )

    def test_lynne_appends_second_line_survives_full_ledger_rewrite(self):
        # 端到端:写文件 → Lynne 手加 `> 第二行` → auto_fill_settled_dates 重写 → 第二行仍在
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "Lynne.md"
            r = _row(
                invoice_number="INV-MULTI",
                note="⚠️ sync 写的原始 note",
                settled=ledger.SETTLED_OK,
                settled_date="",  # 空 — auto_fill_settled_dates 会补
            )
            ledger.append_row(p, r)
            # Lynne 在 Obsidian 手加第二行 blockquote
            text = p.read_text(encoding="utf-8")
            text = text.replace(
                "> ⚠️ sync 写的原始 note\n",
                "> ⚠️ sync 写的原始 note\n> 我核对了,确认重复,准备删\n",
            )
            p.write_text(text, encoding="utf-8")
            # watch 触发 auto_fill_settled_dates —— 会重写整文件
            ledger.auto_fill_settled_dates(p, now_str="2026-06-10")
            final = p.read_text(encoding="utf-8")
            self.assertIn("> ⚠️ sync 写的原始 note", final)
            self.assertIn("> 我核对了,确认重复,准备删", final)
            # parse 回来也是双行 note
            rows = ledger.parse_ledger(p)
            self.assertEqual(len(rows), 1)
            self.assertEqual(
                rows[0].note,
                "⚠️ sync 写的原始 note\n我核对了,确认重复,准备删",
            )

    def test_empty_note_no_blockquote_rendered(self):
        sec = self._section_with_note("")
        self.assertNotIn("\n> ", sec)
        self.assertEqual(ledger._parse_note_block(sec), "")

    def test_dashboard_renders_multiline_note_as_br(self):
        # multiline note 不能破坏 dashboard 表格 — `\n` → `<br>`
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "Lynne.md"
            r = _row(invoice_number="INV-BR", note="第一行\n第二行")
            ledger.append_row(p, r)
            ledger.refresh_dashboard(p)
            text = p.read_text(encoding="utf-8")
            self.assertIn("第一行<br>第二行", text)
            # 表格行不能含真换行(否则会断表格)
            for line in text.splitlines():
                if line.startswith("| ") and "INV-BR" in line:
                    self.assertNotIn("\n", line)

    def test_git_conflict_marker_not_parsed_as_note(self):
        # 关键回归:obsidian-git 自动 merge 失败时 markdown 里会落 `>>>>>>> origin/main`,
        # 这种 7 个 `>` 的 conflict marker 不能被当 blockquote 吃进 note。
        # 否则 refresh-dashboard 会把 marker 渲染进表格 note 列。
        sec = (
            "### test\n"
            "- desc\n"
            "<<<<<<< HEAD\n"
            "- **发票号码**:`A1`\n"
            "=======\n"
            "- **发票号码**:`A2`\n"
            ">>>>>>> origin/main\n"
            "- [ ] 公户已打款(不走个人报销)\n"
        )
        self.assertEqual(ledger._parse_note_block(sec), "")

    def test_nested_quote_not_parsed_as_note(self):
        # `>> foo` 是嵌套 quote,不是我们 sync 写的 note,跳过
        sec = ">> nested\n"
        self.assertEqual(ledger._parse_note_block(sec), "")

    def test_update_row_note_replaces_full_multiline_block(self):
        # update_row_note 把已有 multiline block 整体抹掉,再写新 note
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "Lynne.md"
            r = _row(invoice_number="INV-UPD", note="旧第一行\n旧第二行")
            ledger.append_row(p, r)
            ok = ledger.update_row_note(p, "INV-UPD", note="新 note 单行")
            self.assertTrue(ok)
            rows = ledger.parse_ledger(p)
            self.assertEqual(rows[0].note, "新 note 单行")
            # 旧第二行不能残留
            text = p.read_text(encoding="utf-8")
            self.assertNotIn("旧第二行", text)


if __name__ == "__main__":
    unittest.main()
