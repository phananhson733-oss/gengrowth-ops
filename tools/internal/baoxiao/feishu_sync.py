"""将 wiki 报销/备用金账本同步到飞书多维表格。

模块刻意不依赖 CLI 和第三方库；HTTP 与汇率查询均可注入，便于离线测试。
"""
from __future__ import annotations

import hashlib
import json
import mimetypes
import re
import urllib.error
import urllib.parse
import urllib.request
import uuid
from dataclasses import dataclass
from pathlib import Path

import ledger


API_ROOT = "https://open.feishu.cn"
NEVER_WRITE_FIELDS = frozenset({
    "备注",
    "数据待核",
    # 月度汇总表中的派生列由飞书原生公式维护，API 同步不得写入。
    "历史累计",
    "2026合计",
})

# 已有飞书记录中的业务字段由财务人工维护，同步器不得反向覆盖。
# 新建记录仍会写入识别得到的费用类型和默认打款状态。
UPDATE_PROTECTED_FIELDS = frozenset({
    "费用类型", "备注", "打款方式", "打款状态", "打款时间", "发票链接",
})
MANUAL_FIELDS = NEVER_WRITE_FIELDS | UPDATE_PROTECTED_FIELDS


@dataclass(frozen=True)
class TargetRef:
    kind: str
    token: str
    table_id: str

    @property
    def app_token(self):
        return self.token if self.kind == "base" else None

    @property
    def wiki_node_token(self):
        return self.token if self.kind == "wiki" else None


def parse_target_url(url: str) -> TargetRef:
    """解析 ``/base/{token}`` 或 ``/wiki/{node}`` 的飞书 URL。"""
    parsed = urllib.parse.urlparse(url)
    match = re.search(r"/(base|wiki)/([^/?#]+)", parsed.path)
    table_id = urllib.parse.parse_qs(parsed.query).get("table", [""])[0]
    if not match or not table_id:
        raise ValueError("飞书 URL 必须包含 /base|wiki/{token} 和 table 参数")
    return TargetRef(match.group(1), urllib.parse.unquote(match.group(2)), table_id)


parse_bitable_url = parse_target_url


def _urllib_transport(method, url, *, headers=None, json_body=None, data=None):
    headers = dict(headers or {})
    if json_body is not None:
        data = json.dumps(json_body, ensure_ascii=False).encode("utf-8")
        headers.setdefault("Content-Type", "application/json; charset=utf-8")
    request = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            raw = response.read()
    except urllib.error.HTTPError as exc:
        raw = exc.read()
        raise RuntimeError(
            f"飞书 HTTP {exc.code}: {raw.decode('utf-8', 'replace')}") from exc
    return json.loads(raw.decode("utf-8")) if raw else {}


class FeishuClient:
    def __init__(self, app_id, app_secret, *, transport=None, api_root=API_ROOT):
        self.app_id = app_id
        self.app_secret = app_secret
        self.transport = transport or _urllib_transport
        self.api_root = api_root.rstrip("/")
        self._token = None

    def tenant_access_token(self, *, refresh=False):
        if self._token and not refresh:
            return self._token
        result = self.transport(
            "POST", self.api_root + "/open-apis/auth/v3/tenant_access_token/internal",
            json_body={"app_id": self.app_id, "app_secret": self.app_secret},
            headers={"Content-Type": "application/json; charset=utf-8"})
        self._check(result)
        self._token = result.get("tenant_access_token")
        if not self._token:
            raise RuntimeError("飞书 token 响应缺少 tenant_access_token")
        return self._token

    @staticmethod
    def _check(result):
        if not isinstance(result, dict) or result.get("code", 0) != 0:
            raise RuntimeError(
                f"飞书 API 失败: code={result.get('code')} msg={result.get('msg')}")
        return result

    def request(self, method, path, *, params=None, json_body=None,
                data=None, headers=None):
        url = path if path.startswith("http") else self.api_root + path
        if params:
            url += ("&" if "?" in url else "?") + urllib.parse.urlencode(params)
        auth_headers = {"Authorization": f"Bearer {self.tenant_access_token()}"}
        auth_headers.update(headers or {})
        result = self.transport(method, url, headers=auth_headers,
                                json_body=json_body, data=data)
        return self._check(result)

    def get(self, path, params=None):
        return self.request("GET", path, params=params)

    def post(self, path, body=None):
        return self.request("POST", path, json_body=body or {})

    def put(self, path, body=None):
        return self.request("PUT", path, json_body=body or {})

    def resolve_wiki_node(self, node_token):
        result = self.get(
            f"/open-apis/wiki/v2/spaces/get_node",
            {"token": node_token})
        return result.get("data", {}).get("node", {}).get("obj_token", "")

    def list_records(self, app_token, table_id):
        items, page_token = [], None
        while True:
            params = {"page_size": 500}
            if page_token:
                params["page_token"] = page_token
            result = self.get(
                f"/open-apis/bitable/v1/apps/{app_token}/tables/{table_id}/records",
                params)
            data = result.get("data", {})
            items.extend(data.get("items", []))
            if not data.get("has_more"):
                return items
            page_token = data.get("page_token")

    def list_tables(self, app_token):
        items, page_token = [], None
        while True:
            params = {"page_size": 100}
            if page_token:
                params["page_token"] = page_token
            result = self.get(
                f"/open-apis/bitable/v1/apps/{app_token}/tables", params)
            data = result.get("data", {})
            items.extend(data.get("items", []))
            if not data.get("has_more"):
                return items
            page_token = data.get("page_token")

    def create_record(self, app_token, table_id, fields):
        result = self.post(
            f"/open-apis/bitable/v1/apps/{app_token}/tables/{table_id}/records",
            {"fields": fields})
        return result.get("data", {}).get("record", result.get("data", {}))

    def update_record(self, app_token, table_id, record_id, fields):
        result = self.put(
            f"/open-apis/bitable/v1/apps/{app_token}/tables/{table_id}/records/{record_id}",
            {"fields": fields})
        return result.get("data", {}).get("record", result.get("data", {}))

    def upload(self, path, *, parent_type="bitable_file", parent_node=""):
        """上传附件并返回 file_token。"""
        path = Path(path)
        boundary = "----gengrowth-" + uuid.uuid4().hex
        parts = []
        form = {
            "file_name": path.name, "parent_type": parent_type,
            "parent_node": parent_node, "size": str(path.stat().st_size),
        }
        for key, value in form.items():
            parts.append(
                f"--{boundary}\r\nContent-Disposition: form-data; "
                f'name="{key}"\r\n\r\n{value}\r\n'.encode())
        mime = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
        parts.append(
            f"--{boundary}\r\nContent-Disposition: form-data; name=\"file\"; "
            f"filename=\"{path.name}\"\r\nContent-Type: {mime}\r\n\r\n".encode())
        parts.extend((path.read_bytes(), f"\r\n--{boundary}--\r\n".encode()))
        result = self.request(
            "POST", "/open-apis/drive/v1/medias/upload_all",
            data=b"".join(parts),
            headers={"Content-Type": f"multipart/form-data; boundary={boundary}"})
        return result.get("data", {}).get("file_token", "")


def normalize_invoice_number(value):
    return re.sub(r"[^0-9A-Z]+", "", str(value or "").upper())


def _dedup_key(row):
    number = normalize_invoice_number(row.invoice_number)
    if number:
        return "invoice:" + number
    sha = getattr(row, "source_sha256", "") or ""
    return "sha:" + (sha if sha else row.id8)


def load_invoice_rows(reimbursement_root, petty_cash_root=None):
    """收集两个 ledger root；返回 ``(rows, duplicate_warnings)``。"""
    rows, warnings, seen = [], [], {}
    roots = [reimbursement_root]
    if petty_cash_root:
        roots.append(petty_cash_root)
    for root in roots:
        root = Path(root)
        if not root.exists():
            continue
        for path in sorted(root.rglob("*.md")):
            for row in ledger.parse_ledger(path):
                key = _dedup_key(row)
                if key in seen:
                    old_path, old_index = seen[key]
                    old_row = rows[old_index]
                    if (not Path(old_row.file_rel).exists()
                            and Path(row.file_rel).exists()):
                        rows[old_index] = row
                        seen[key] = (path, old_index)
                    warnings.append(
                        f"重复跳过: {row.invoice_number or row.id8} "
                        f"(已由 {old_path} 收录)")
                    continue
                seen[key] = (path, len(rows))
                rows.append(row)
    return rows, warnings


collect_ledger_rows = load_invoice_rows


def _date_iso(value):
    digits = re.sub(r"\D", "", str(value or ""))
    if len(digits) >= 8:
        return f"{digits[:4]}-{digits[4:6]}-{digits[6:8]}"
    if len(digits) == 6:
        return f"{digits[:4]}-{digits[4:6]}-01"
    return ""


def _fx_result(fx, currency, invoice_date):
    if currency.upper() == "CNY":
        return 1.0, _date_iso(invoice_date), "CNY"
    if fx is None:
        raise RuntimeError("未配置汇率查询")
    result = fx(currency, _date_iso(invoice_date) or invoice_date)
    if isinstance(result, dict):
        return (float(result["rate"]), result.get("rate_date") or _date_iso(invoice_date),
                result.get("source", ""))
    if isinstance(result, (tuple, list)):
        return float(result[0]), result[1], result[2] if len(result) > 2 else ""
    return float(result), _date_iso(invoice_date), getattr(fx, "__name__", "fx")


def build_detail_fields(row, *, fx=None):
    """构建只含自动字段的飞书记录。"""
    fields = {
        "发票号码": row.invoice_number or "",
        "发票抬头": getattr(row, "billed_to", "") or "",
        "发票类型": getattr(row, "invoice_type", "") or "",
        "费用类型": row.category,
        "发票描述": row.description or "",
        "金额": round(float(row.amount or 0), 2),
        "币种": (row.currency or "CNY").upper(),
        "开票日期": _date_iso(row.invoice_date),
        "开票月份": _date_iso(row.invoice_date)[:7],
        "提交时间": _date_iso(row.submit_date),
        "报销姓名": row.reimburser,
        "发票链接": row.file_rel or "",
        "数据待核": "是" if getattr(row, "needs_review", False) else "否",
    }
    try:
        actual_cny = getattr(row, "amount_cny", None)
        if actual_cny is not None:
            amount = fields["金额"]
            fields.update({
                "汇率": round(float(actual_cny) / amount, 6) if amount else 0,
                "人民币金额": round(float(actual_cny), 2),
            })
        else:
            rate, _rate_date, _source = _fx_result(
                fx, fields["币种"], getattr(row, "invoice_date", ""))
            fields.update({
                "汇率": rate,
                "人民币金额": round(fields["金额"] * rate, 2),
            })
    except Exception:
        fields["数据待核"] = "是"
    fields.update(build_payment_fields(row))
    return fields


def build_detail_plan(rows, *, fx=None):
    return [build_detail_fields(row, fx=fx) for row in rows]


def build_payment_fields(row):
    """从 Wiki 账本状态构建飞书打款字段。"""
    invoice_type = (getattr(row, "invoice_type", "") or "").lower()
    billed_to = (getattr(row, "billed_to", "") or "").strip()
    is_personal_domestic = (
        invoice_type in {"普票", "专票", "domestic"}
        and bool(billed_to)
        and billed_to != ledger.DOMESTIC_TITLE
    )
    if invoice_type == "invoice" or is_personal_domestic:
        payment_method = "备用金"
    elif getattr(row, "payer_type", "") == "公户":
        payment_method = "公户打款"
    else:
        payment_method = "员工报销"
    settled = getattr(row, "settled", "") == ledger.SETTLED_OK
    settled_date = _date_iso(getattr(row, "settled_date", ""))
    return {
        "打款方式": payment_method,
        "打款状态": "已打款" if settled else "待打款",
        "打款时间": settled_date[:7] if settled else "",
    }


def build_summary_rows(detail_rows, *, year=2026):
    months = [f"{year}-{month:02d}" for month in range(1, 13)]
    grouped = {}
    for fields in detail_rows:
        month = str(fields.get("开票月份", ""))[:7]
        if month not in months:
            continue
        category = fields.get("费用类型") or "未分类"
        target = grouped.setdefault(
            category, {"费用类型": category, **{key: 0.0 for key in months}})
        amount = fields.get("人民币金额", fields.get("金额", 0)) or 0
        target[month] = round(target[month] + float(amount), 2)
    result = []
    for category in sorted(grouped):
        row = grouped[category]
        row[f"{year}合计"] = round(sum(row[m] for m in months), 2)
        result.append(row)
    return result


build_2026_summary = build_summary_rows


def _existing_by_key(client, app_token, table_id, key_field):
    records = client.list_records(app_token, table_id)
    return {
        str(item.get("fields", {}).get(key_field, "")): item
        for item in records if item.get("fields", {}).get(key_field) not in (None, "")
    }


def _sync_records(client, app_token, table_id, fields_list, *,
                  key_field, apply=False, upload_attachments=False,
                  protected_fields=frozenset()):
    existing = _existing_by_key(client, app_token, table_id, key_field)
    plan = []
    for fields in fields_list:
        automatic = {k: v for k, v in fields.items() if k not in NEVER_WRITE_FIELDS}
        key = str(automatic[key_field])
        found = existing.get(key)
        action = "update" if found else "create"
        if found:
            automatic = {
                k: v for k, v in automatic.items()
                if k not in protected_fields
            }
        elif apply and upload_attachments and "发票链接" in automatic:
            source = automatic.get("发票链接")
            if isinstance(source, str) and Path(source).is_file():
                token = client.upload(source, parent_node=app_token)
                automatic["发票链接"] = ([{"file_token": token}] if token else [])
            elif not isinstance(source, list):
                automatic.pop("发票链接", None)
        item = {"action": action, "key": key, "fields": automatic}
        if found:
            item["record_id"] = found["record_id"]
        plan.append(item)
        if apply:
            if found:
                client.update_record(
                    app_token, table_id, found["record_id"], automatic)
            else:
                client.create_record(app_token, table_id, automatic)
    return plan


def sync_detail_records(client, app_token, table_id, fields_list, *, apply=False):
    return _sync_records(
        client, app_token, table_id, fields_list,
        key_field="发票号码", apply=apply, upload_attachments=True,
        protected_fields=UPDATE_PROTECTED_FIELDS)


def sync_summary_records(client, app_token, table_id, rows, *, apply=False):
    return _sync_records(
        client, app_token, table_id, rows,
        key_field="费用类型", apply=apply)


class FeishuSyncer:
    def __init__(self, client, *, app_token, detail_table_id,
                 summary_table_id=None, fx=None):
        self.client = client
        self.app_token = app_token
        self.detail_table_id = detail_table_id
        self.summary_table_id = summary_table_id
        self.fx = fx

    def plan(self, reimbursement_root, petty_cash_root=None):
        rows, warnings = load_invoice_rows(reimbursement_root, petty_cash_root)
        details = build_detail_plan(rows, fx=self.fx)
        result = {
            "warnings": warnings,
            "details": sync_detail_records(
                self.client, self.app_token, self.detail_table_id,
                details, apply=False),
        }
        if self.summary_table_id:
            result["summary"] = sync_summary_records(
                self.client, self.app_token, self.summary_table_id,
                build_summary_rows(details), apply=False)
        return result

    def apply(self, reimbursement_root, petty_cash_root=None):
        rows, warnings = load_invoice_rows(reimbursement_root, petty_cash_root)
        details = build_detail_plan(rows, fx=self.fx)
        result = {
            "warnings": warnings,
            "details": sync_detail_records(
                self.client, self.app_token, self.detail_table_id,
                details, apply=True),
        }
        if self.summary_table_id:
            result["summary"] = sync_summary_records(
                self.client, self.app_token, self.summary_table_id,
                build_summary_rows(details), apply=True)
        return result
