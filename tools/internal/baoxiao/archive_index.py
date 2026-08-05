"""只读发票归档索引。

飞书保存业务状态；本模块只保存恢复、查重和定位原件所需的不可变字段。
索引格式仍兼容 ``ledger.parse_ledger``，让历史查重无需迁移数据库。
"""
import datetime
from pathlib import Path

import ledger
import naming


INDEX_NAME = "归档索引.md"


def index_path(root):
    return Path(root) / INDEX_NAME


def _amount(value):
    return f"{float(value or 0):.2f}".rstrip("0").rstrip(".")


def _date(value):
    raw = "".join(ch for ch in str(value or "") if ch.isdigit())
    if len(raw) >= 8:
        return f"{raw[:4]}-{raw[4:6]}-{raw[6:8]}"
    if len(raw) >= 6:
        return f"{raw[:4]}-{raw[4:6]}"
    return str(value or "")


def _header(root):
    kind = "备用金" if Path(root).name == "备用金" else "报销"
    today = datetime.date.today().isoformat()
    return (
        "---\n"
        f"title: {kind}发票归档索引\n"
        f"date: {today}\n"
        f"updated: {today}\n"
        "type: note\n"
        "index_kind: invoice-archive\n"
        "status: generated\n"
        "tags:\n"
        "  - finance\n"
        "  - invoice-archive\n"
        "aliases:\n"
        f"  - {kind}归档索引\n"
        "---\n\n"
        f"# {kind}发票归档索引\n\n"
        "> 本文件由报销同步器自动生成，只用于查重、原件定位和灾备恢复。\n"
        "> 费用类型、打款方式、打款状态、打款时间及备注，以飞书发票明细为准。\n\n"
    )


def _section(row):
    invoice_number = row.invoice_number or "(无)"
    id8 = "" if row.invoice_number else f"<!-- id8: {row.id8} -->\n"
    source = (getattr(row, "source_sha256", "") or "").strip().lower()
    text_sha = (getattr(row, "pdf_text_sha256", "") or "").strip().lower()
    hashes = (f"<!-- src_sha: {source} -->\n" if source else "")
    hashes += (f"<!-- txt_sha: {text_sha} -->\n" if text_sha else "")
    file_name = Path(row.file_rel).name if row.file_rel else "(无文件)"
    link = f"[{file_name}](/{row.file_rel})" if row.file_rel else "(无)"
    money = f"{naming.currency_symbol(row.currency)}{_amount(row.amount)}"
    lines = [
        f"### {row.description or '(无描述)'}",
        id8.rstrip("\n"), hashes.rstrip("\n"),
        f"- **发票号码**:`{invoice_number}`",
        f"- **发票抬头**:{row.billed_to or '(无)'}",
        f"- **发票类型**:{row.invoice_type or '(无)'}",
        f"- **费用类型**:{row.category or '(未分类)'}",
        f"- **金额数量**:{money}",
        f"- **开票时间**:{_date(row.invoice_date) or '(无)'}",
        f"- **提交时间**:{row.submit_date or '(无)'}",
        f"- **报销姓名**:{row.reimburser or '(无)'}",
        f"- **文件链接**:{link}",
    ]
    return "\n".join(line for line in lines if line) + "\n"


def append_row(root, row):
    path = index_path(root)
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists():
        existing = ledger.parse_ledger(path)
        key = row.invoice_number or row.id8
        if any((item.invoice_number or item.id8) == key for item in existing):
            return False
        body = path.read_text(encoding="utf-8")
    else:
        body = _header(root)
    separator = "" if body.endswith("\n\n") else "\n"
    path.write_text(body + separator + _section(row) + "\n", encoding="utf-8")
    return True


def rebuild(root, rows):
    """从已解析行重建完整索引；同发票号只保留第一条。"""
    path = index_path(root)
    path.parent.mkdir(parents=True, exist_ok=True)
    seen, sections = set(), []
    for row in rows:
        key = row.invoice_number or row.id8
        if key in seen:
            continue
        seen.add(key)
        sections.append(_section(row))
    body = _header(root)
    if sections:
        body += "\n".join(sections)
    path.write_text(body, encoding="utf-8")
    return path
