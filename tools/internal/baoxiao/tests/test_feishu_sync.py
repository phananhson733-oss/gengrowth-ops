import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import feishu_sync
import ledger


class UrlTests(unittest.TestCase):
    def test_parse_base_and_wiki_urls(self):
        base = feishu_sync.parse_bitable_url(
            "https://x.feishu.cn/base/bascnABC?table=tbl123&view=vew1")
        self.assertEqual((base.kind, base.token, base.table_id),
                         ("base", "bascnABC", "tbl123"))
        wiki = feishu_sync.parse_bitable_url(
            "https://x.feishu.cn/wiki/wikcnABC?table=tbl456")
        self.assertEqual((wiki.kind, wiki.token, wiki.table_id),
                         ("wiki", "wikcnABC", "tbl456"))


class ClientTests(unittest.TestCase):
    def test_token_and_json_requests_use_injected_transport(self):
        calls = []

        def transport(method, url, **kw):
            calls.append((method, url, kw))
            if url.endswith("/tenant_access_token/internal"):
                return {"code": 0, "tenant_access_token": "TOKEN"}
            return {"code": 0, "data": {"ok": True}}

        client = feishu_sync.FeishuClient("app", "secret", transport=transport)
        self.assertEqual(client.get("/open-apis/test")["data"], {"ok": True})
        self.assertEqual(calls[0][0], "POST")
        self.assertEqual(calls[1][2]["headers"]["Authorization"], "Bearer TOKEN")
        client.post("/open-apis/a", {"x": 1})
        client.put("/open-apis/b", {"x": 2})
        self.assertEqual([c[0] for c in calls[-2:]], ["POST", "PUT"])


def _row(id8, invoice_number, *, amount=10, currency="CNY",
         invoice_date="20260102", category="差旅费", reimburser="Lynne"):
    return ledger.LedgerRow(
        id8=id8, file_rel=f"发票/202601/Lynne/{id8}.pdf",
        reimburser=reimburser, category=category, amount=amount,
        currency=currency, invoice_number=invoice_number, period="202601",
        submit_date="2026-01-03 10:00", description="测试",
        invoice_date=invoice_date,
    )


class CollectionTests(unittest.TestCase):
    def test_two_roots_deduplicate_normalized_number_and_empty_uses_id8(self):
        with tempfile.TemporaryDirectory() as tmp:
            a, b = Path(tmp) / "报销", Path(tmp) / "备用金"
            ledger.append_row(a / "2026-01" / "Lynne.md", _row("aaaaaaaa", "No. 12-34"))
            ledger.append_row(b / "2026-01" / "Lynne.md", _row("bbbbbbbb", "NO1234"))
            ledger.append_row(b / "2026-01" / "wzb.md", _row("cccccccc", ""))
            rows, warnings = feishu_sync.collect_ledger_rows(a, b)
            self.assertEqual([r.invoice_number for r in rows], ["No. 12-34", ""])
            self.assertIn("重复", warnings[0])

    def test_duplicate_prefers_row_whose_attachment_still_exists(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp) / "报销"
            old = _row("aaaaaaaa", "INV-1")
            old.file_rel = str(Path(tmp) / "missing.pdf")
            current_file = Path(tmp) / "current.pdf"
            current_file.write_bytes(b"invoice")
            current = _row("bbbbbbbb", "INV-1")
            current.file_rel = str(current_file)
            ledger.append_row(root / "2026-06" / "Lynne.md", old)
            ledger.append_row(root / "2026-07" / "Lynne.md", current)
            rows, warnings = feishu_sync.collect_ledger_rows(root)
            self.assertEqual(rows[0].file_rel, str(current_file))
            self.assertEqual(len(warnings), 1)


class FieldTests(unittest.TestCase):
    def test_payment_fields_map_domestic_invoice_and_settlement_month(self):
        domestic = _row("a", "1")
        domestic.invoice_type = "普票"
        domestic.payer_type = "公户"
        domestic.settled = ledger.SETTLED_OK
        domestic.settled_date = "2026-06-18"
        self.assertEqual(feishu_sync.build_payment_fields(domestic), {
            "打款方式": "公户打款",
            "打款状态": "已打款",
            "打款时间": "2026-06",
        })

        employee = _row("b", "2")
        employee.invoice_type = "专票"
        self.assertEqual(feishu_sync.build_payment_fields(employee), {
            "打款方式": "员工报销",
            "打款状态": "待打款",
            "打款时间": "",
        })

        overseas = _row("c", "3")
        overseas.invoice_type = "invoice"
        overseas.payer_type = "公户"
        self.assertEqual(
            feishu_sync.build_payment_fields(overseas)["打款方式"], "备用金")

        personal = _row("d", "4")
        personal.invoice_type = "普票"
        personal.billed_to = "王某某"
        self.assertEqual(
            feishu_sync.build_payment_fields(personal)["打款方式"], "备用金")

    def test_detail_fields_add_historical_fx_and_do_not_include_manual_fields(self):
        fields = feishu_sync.build_detail_fields(
            _row("aaaaaaaa", "INV-1", amount=10, currency="USD"),
            fx=lambda currency, date: {
                "rate": 7.2, "rate_date": "2026-01-02", "source": "test"})
        self.assertEqual(fields["人民币金额"], 72.0)
        self.assertEqual(fields["发票号码"], "INV-1")
        self.assertEqual(fields["开票月份"], "2026-01")
        self.assertEqual(fields["报销姓名"], "Lynne")
        self.assertEqual(fields["提交时间"], "2026-01-03")
        self.assertNotIn("自动化ID", fields)
        self.assertNotIn("规范化发票号", fields)
        self.assertNotIn("汇率日期", fields)
        self.assertNotIn("汇率来源", fields)
        self.assertEqual(fields["打款方式"], "员工报销")
        self.assertEqual(fields["打款状态"], "待打款")
        self.assertEqual(fields["打款时间"], "")
        self.assertNotIn("备注", fields)

    def test_actual_cny_payment_overrides_reference_fx(self):
        row = _row("aaaaaaaa", "INV-1", amount=100, currency="USD")
        row.amount_cny = 695.5
        fields = feishu_sync.build_detail_fields(
            row,
            fx=lambda *_: {
                "rate": 6.8, "rate_date": "2026-01-02", "source": "SAFE"})
        self.assertEqual(fields["人民币金额"], 695.5)
        self.assertEqual(fields["汇率"], 6.955)
        self.assertNotIn("汇率来源", fields)

    def test_fx_failure_marks_review(self):
        fields = feishu_sync.build_detail_fields(
            _row("aaaaaaaa", "INV-1", currency="USD"),
            fx=lambda *_: (_ for _ in ()).throw(RuntimeError("down")))
        self.assertEqual(fields["数据待核"], "是")
        self.assertNotIn("人民币金额", fields)

    def test_summary_is_wide_by_category_and_invoice_month(self):
        rows = [
            feishu_sync.build_detail_fields(_row("a", "1", amount=10)),
            feishu_sync.build_detail_fields(
                _row("b", "2", amount=20, invoice_date="20260201")),
        ]
        summary = feishu_sync.build_2026_summary(rows)
        self.assertEqual(summary, [{
            "费用类型": "差旅费", "2026-01": 10.0, "2026-02": 20.0,
            "2026-03": 0.0, "2026-04": 0.0, "2026-05": 0.0,
            "2026-06": 0.0, "2026-07": 0.0, "2026-08": 0.0,
            "2026-09": 0.0, "2026-10": 0.0, "2026-11": 0.0,
            "2026-12": 0.0, "2026合计": 30.0,
        }])


class SyncTests(unittest.TestCase):
    def test_plan_does_not_write_and_apply_creates_then_updates_auto_fields_only(self):
        class FakeClient:
            def __init__(self):
                self.records = []
                self.writes = []

            def list_records(self, app_token, table_id):
                return self.records

            def create_record(self, app_token, table_id, fields):
                self.writes.append(("create", fields))
                return {"record_id": "rec1"}

            def update_record(self, app_token, table_id, record_id, fields):
                self.writes.append(("update", fields))

        client = FakeClient()
        fields = feishu_sync.build_detail_fields(_row("aaaaaaaa", "INV-1"))
        plan = feishu_sync.sync_detail_records(
            client, "base", "detail", [fields], apply=False)
        self.assertEqual(plan[0]["action"], "create")
        self.assertEqual(client.writes, [])
        feishu_sync.sync_detail_records(client, "base", "detail", [fields], apply=True)
        self.assertEqual(client.writes[0][0], "create")

        client.records = [{"record_id": "rec1", "fields": {
            "发票号码": "INV-1", "审批状态": "已通过", "备注": "人工"}}]
        feishu_sync.sync_detail_records(client, "base", "detail", [fields], apply=True)
        update = client.writes[-1][1]
        self.assertNotIn("审批状态", update)
        self.assertNotIn("备注", update)

    def test_update_preserves_feishu_manual_business_fields_and_attachment(self):
        class FakeClient:
            def __init__(self):
                self.records = [{"record_id": "rec1", "fields": {
                    "发票号码": "INV-1", "费用类型": "设备费用",
                    "打款方式": "公户打款", "打款状态": "已打款",
                    "打款时间": "2026-07", "备注": "人工说明",
                    "发票链接": [{"file_token": "old-token"}],
                }}]
                self.writes = []

            def list_records(self, app_token, table_id):
                return self.records

            def update_record(self, app_token, table_id, record_id, fields):
                self.writes.append(fields)

        client = FakeClient()
        fields = feishu_sync.build_detail_fields(_row("aaaaaaaa", "INV-1"))
        feishu_sync.sync_detail_records(
            client, "base", "detail", [fields], apply=True)
        update = client.writes[0]
        for name in ("费用类型", "打款方式", "打款状态", "打款时间",
                     "备注", "发票链接"):
            self.assertNotIn(name, update)

    def test_create_uploads_attachment_and_sets_default_business_fields(self):
        class FakeClient:
            def __init__(self):
                self.writes = []
                self.uploads = []

            def list_records(self, app_token, table_id):
                return []

            def upload(self, path, parent_node=""):
                self.uploads.append((Path(path), parent_node))
                return "new-token"

            def create_record(self, app_token, table_id, fields):
                self.writes.append(fields)

        with tempfile.TemporaryDirectory() as tmp:
            invoice = Path(tmp) / "invoice.pdf"
            invoice.write_bytes(b"PDF")
            fields = feishu_sync.build_detail_fields(_row("a", "INV-1"))
            fields["发票链接"] = str(invoice)
            client = FakeClient()
            feishu_sync.sync_detail_records(
                client, "base", "detail", [fields], apply=True)
            self.assertEqual(client.uploads, [(invoice, "base")])
            self.assertEqual(client.writes[0]["发票链接"],
                             [{"file_token": "new-token"}])
            self.assertEqual(client.writes[0]["打款状态"], "待打款")
            self.assertEqual(client.writes[0]["费用类型"], "差旅费")

    def test_summary_sync_does_not_write_formula_columns(self):
        class FakeClient:
            def __init__(self):
                self.records = [{
                    "record_id": "rec1",
                    "fields": {"费用类型": "研发费用"},
                }]
                self.writes = []

            def list_records(self, app_token, table_id):
                return self.records

            def update_record(self, app_token, table_id, record_id, fields):
                self.writes.append(fields)

        client = FakeClient()
        feishu_sync.sync_summary_records(client, "base", "summary", [{
            "费用类型": "研发费用",
            "2026-01": 100,
            "历史累计": 200,
            "2026合计": 100,
        }], apply=True)
        self.assertEqual(client.writes, [{
            "费用类型": "研发费用",
            "2026-01": 100,
        }])


if __name__ == "__main__":
    unittest.main()
