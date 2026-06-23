"""月底 carry-forward(v2.5 A 方案):row + 物理文件都挪到下月。

逻辑:
- 扫源月账本所有 row
- settled=✅ → 已结清,跳过
- 已 carry 过(备注含 `↗ 延至`)→ 跳过(幂等)
- 其他 → row + 文件都迁:
  - 物理 mv `发票/{源月}/{人}/{YYYYMM}-...pdf` → `发票/{目标月}/{人}/{新YYYYMM}-...pdf`
  - 文件名前缀 YYYYMM 也跟着替换成目标月(v2.5.5)
  - 目标月账本 append 同 row(period / file_rel 跟着改,备注前置 `← 自 {源月}`)
  - 源月 row 标 `↗ 延至 {目标月}`

v2.5 起,文件归集月跟着 row 走 —— 当月文件夹 = 当月需处理的所有发票。
v2.5.5 起,文件名前缀也跟着归集月走,方便 Lynne 在 Finder / Obsidian 里识别。
"""

import re
import shutil
from dataclasses import dataclass
from pathlib import Path
from typing import List, Optional

import ledger

_YYYYMM_PREFIX_RE = re.compile(r"^(\d{6})(-.*)$")

CARRY_OUT_MARK = "↗ 延至"
CARRY_IN_MARK = "← 自"


@dataclass
class CarryResult:
    id8: str
    from_month: str
    to_month: str
    status: str            # "carried" | "skipped_done" | "skipped_already"
    reason: str = ""


def next_month(month: str) -> str:
    y, m = month.split("-")
    y, m = int(y), int(m)
    if m == 12:
        return f"{y + 1}-01"
    return f"{y}-{m + 1:02d}"


def _is_done(row) -> bool:
    return row.settled == ledger.SETTLED_OK


def _is_already_carried(row) -> bool:
    return CARRY_OUT_MARK in row.note


def _rewrite_filename_prefix(name: str, target_yyyymm: str) -> str:
    """文件名以 YYYYMM- 开头 → 替换前缀;否则原样返回。
    例:`202605-福利费-¥321.48.pdf` + target `202607` → `202607-福利费-¥321.48.pdf`
    """
    m = _YYYYMM_PREFIX_RE.match(name)
    if not m:
        return name
    return target_yyyymm + m.group(2)


def relocate_file(*, wiki_root, archive_root, file_rel: str, target_month: str,
                  reimburser: str) -> str:
    """物理 mv 文件到 `{archive_root}/{target_yyyymm}/{reimburser}/`,文件名前缀
    YYYYMM 也同步替换成目标月。返回新 file_rel(相对 wiki_root)。
    文件不存在 / 同源同目标 / 报错 → 返回原 file_rel 不动。

    撞名处理:目标已存在同名 → 在 stem 末尾加 `-c{N}` 后缀。
    """
    if not file_rel:
        return file_rel
    wiki_root = Path(wiki_root)
    archive_root = Path(archive_root)
    src = wiki_root / file_rel
    if not src.exists():
        return file_rel
    yyyymm = target_month.replace("-", "")
    dst_dir = archive_root / yyyymm / reimburser
    dst_dir.mkdir(parents=True, exist_ok=True)
    new_name = _rewrite_filename_prefix(src.name, yyyymm)
    dst = dst_dir / new_name
    if dst == src:
        return file_rel
    if dst.exists():
        stem, ext = Path(new_name).stem, Path(new_name).suffix
        i = 1
        while dst.exists():
            dst = dst_dir / f"{stem}-c{i}{ext}"
            i += 1
    try:
        shutil.move(str(src), str(dst))
    except OSError:
        return file_rel
    return str(dst.relative_to(wiki_root))


_SETTLED_MONTH_RE = re.compile(r"^(\d{4})-(\d{2})(?:-(\d{2}))?")


def _extract_settled_month(settled_date: str):
    """从 settled_date 抽 YYYY-MM。支持 'YYYY-MM-DD'、'YYYY-MM-DD HH:MM'、
    'YYYY-MM-DDTHH:MM:SS'、'YYYY-MM'(无 day)。值非法(2026-99-99)/格式不识别 → None。"""
    import datetime as _dt
    if not settled_date:
        return None
    s = settled_date.strip()
    m = _SETTLED_MONTH_RE.match(s)
    if not m:
        return None
    yyyy, mm, dd = m.group(1), m.group(2), m.group(3)
    try:
        if dd:
            _dt.date(int(yyyy), int(mm), int(dd))
        else:
            # 仅 YYYY-MM:校验 mm 合法
            if not (1 <= int(mm) <= 12):
                return None
    except ValueError:
        return None
    return f"{yyyy}-{mm}"


def _row_period_to_month(period: str):
    """period 是 YYYYMM 字符串,转 YYYY-MM。"""
    if not period or len(period) < 6:
        return None
    return f"{period[:4]}-{period[4:6]}"


@dataclass
class SettledRelocateResult:
    id8: str
    invoice_number: str
    from_month: str
    settled_month: str
    reimburser: str
    status: str       # "relocated" | "dry_run" | "skipped_already_aligned"
                      # | "skipped_invalid_settled_date" | "skipped_not_settled"
                      # | "skipped_dup_at_target"
    file_moved: bool = False
    note: str = ""


def relocate_settled_by_settled_month(
    *, ledger_root, wiki_root=None, archive_root=None, dry_run: bool = True,
) -> List[SettledRelocateResult]:
    """v2.5.9 按结清月归档:扫 ledger_root 下所有 ledger,把 settled==✅ 且
    settled_date 月份 != row.period 的 row 挪到 settled_month/{reimburser}.md,
    物理文件同步迁到 archive_root/{settled_yyyymm}/{reimburser}/。

    设计意图:LedgerRow.period 字段注释里写「settle 后 = 结清月」,这函数把它落实。
    场景:用户手动把 settled_date 改成历史月份(回填实际结清时间)→ 自动归档。

    幂等:relocate 后目标 row.period == settled_month,下次扫不再触发。
    dry_run=True:只收集 candidates,不动文件/账本(默认安全模式)。
    """
    ledger_root = Path(ledger_root)
    if not ledger_root.exists():
        return []
    results: List[SettledRelocateResult] = []

    # 收集所有 ledger 文件(月目录 / *.md,跳过 *-summary.md)
    src_paths = []
    for month_dir in sorted(ledger_root.iterdir()):
        if not month_dir.is_dir():
            continue
        if not re.match(r"^\d{4}-\d{2}$", month_dir.name):
            continue
        for md in sorted(month_dir.glob("*.md")):
            if md.stem.endswith("-summary"):
                continue
            src_paths.append(md)

    # 收集 candidates
    candidates = []   # [(src_path, row)]
    for src_path in src_paths:
        rows = ledger.parse_ledger(src_path)
        for row in rows:
            if row.settled != ledger.SETTLED_OK:
                continue
            settled_month = _extract_settled_month(row.settled_date)
            row_month = _row_period_to_month(row.period)
            if not settled_month:
                results.append(SettledRelocateResult(
                    id8=row.id8, invoice_number=row.invoice_number,
                    from_month=row_month or "?", settled_month="?",
                    reimburser=row.reimburser,
                    status="skipped_invalid_settled_date",
                    note=f"settled_date={row.settled_date!r}",
                ))
                continue
            if row_month == settled_month:
                # 已对齐 — 不上报(噪音),只 dry-run 时上报便于看全貌
                if dry_run:
                    results.append(SettledRelocateResult(
                        id8=row.id8, invoice_number=row.invoice_number,
                        from_month=row_month, settled_month=settled_month,
                        reimburser=row.reimburser,
                        status="skipped_already_aligned",
                    ))
                continue
            candidates.append((src_path, row))

    if dry_run:
        for src_path, row in candidates:
            results.append(SettledRelocateResult(
                id8=row.id8, invoice_number=row.invoice_number,
                from_month=_row_period_to_month(row.period),
                settled_month=_extract_settled_month(row.settled_date),
                reimburser=row.reimburser,
                status="dry_run",
                note=f"src={src_path.relative_to(ledger_root)}",
            ))
        return results

    # 真跑
    for src_path, row in candidates:
        settled_month = _extract_settled_month(row.settled_date)
        row_month = _row_period_to_month(row.period)
        new_period = settled_month.replace("-", "")

        # 1. 物理 mv 文件 + 改前缀(复用 carry_forward 的 relocate_file)
        new_file_rel = row.file_rel
        file_moved = False
        if wiki_root and archive_root and row.file_rel:
            new_file_rel = relocate_file(
                wiki_root=wiki_root, archive_root=archive_root,
                file_rel=row.file_rel, target_month=settled_month,
                reimburser=row.reimburser,
            )
            file_moved = (new_file_rel != row.file_rel)

        # 2. 目标 ledger append(dedup by id8)
        dst_path = ledger.ledger_path_for(settled_month, ledger_root, reimburser=row.reimburser)
        dst_ids = {r.id8 for r in ledger.parse_ledger(dst_path)} if dst_path.exists() else set()
        if row.id8 in dst_ids:
            # 目标已有同 id8 — 只删源不重复 append
            ledger._delete_row_from_ledger(src_path, row.invoice_number, id8_fallback=row.id8)
            ledger.refresh_dashboard(src_path)
            ledger.refresh_dashboard(dst_path)
            results.append(SettledRelocateResult(
                id8=row.id8, invoice_number=row.invoice_number,
                from_month=row_month, settled_month=settled_month,
                reimburser=row.reimburser,
                status="skipped_dup_at_target",
                file_moved=file_moved,
            ))
            continue

        ledger.append_row(dst_path, ledger.LedgerRow(
            id8=row.id8, file_rel=new_file_rel,
            reimburser=row.reimburser, category=row.category,
            amount=row.amount, currency=row.currency,
            invoice_number=row.invoice_number,
            period=new_period, submit_date=row.submit_date,
            description=row.description,
            settled=row.settled,
            needs_review=row.needs_review,
            note=row.note,
            invoice_type=row.invoice_type, billed_to=row.billed_to,
            settled_date=row.settled_date, invoice_date=row.invoice_date,
            payer_type=row.payer_type, payment_proof=row.payment_proof,
            amount_cny=row.amount_cny,
            # v2.5.9:relocate 后保留双 sha — 否则迁移过的 row 丢 dedup 身份
            source_sha256=row.source_sha256,
            pdf_text_sha256=row.pdf_text_sha256,
        ))

        # 3. 源删 row + 双 refresh_dashboard
        ledger._delete_row_from_ledger(src_path, row.invoice_number, id8_fallback=row.id8)
        ledger.refresh_dashboard(src_path)
        ledger.refresh_dashboard(dst_path)

        results.append(SettledRelocateResult(
            id8=row.id8, invoice_number=row.invoice_number,
            from_month=row_month, settled_month=settled_month,
            reimburser=row.reimburser,
            status="relocated",
            file_moved=file_moved,
        ))

    return results


def carry_forward(*, ledger_root, from_month: str,
                  to_month: Optional[str] = None,
                  reimburser: Optional[str] = None,
                  wiki_root=None, archive_root=None) -> List[CarryResult]:
    """月底 carry-forward。v2.5:row + 文件都挪(A 方案);老调用方未传
    wiki_root/archive_root 时 fallback 仅迁 row(B 方案兼容,用于单测)。
    """
    ledger_root = Path(ledger_root)
    to_month = to_month or next_month(from_month)
    src_month_dir = ledger_root / from_month
    if reimburser is not None:
        targets = [(reimburser, src_month_dir / f"{reimburser}.md")]
    else:
        targets = []
        if src_month_dir.exists():
            for md in sorted(src_month_dir.glob("*.md")):
                if md.stem.endswith("-summary"):
                    continue
                targets.append((md.stem, md))

    results: List[CarryResult] = []
    for reimb, src_path in targets:
        dst_path = ledger.ledger_path_for(to_month, ledger_root, reimburser=reimb)
        src_rows = ledger.parse_ledger(src_path)
        dst_ids = {r.id8 for r in ledger.parse_ledger(dst_path)}
        for row in src_rows:
            if _is_done(row):
                results.append(CarryResult(row.id8, from_month, to_month, "skipped_done"))
                continue
            if _is_already_carried(row):
                results.append(CarryResult(row.id8, from_month, to_month, "skipped_already"))
                continue
            if row.id8 not in dst_ids:
                # A 方案:物理 mv 文件到下月归档目录
                new_file_rel = row.file_rel
                new_period = row.period
                if wiki_root is not None and archive_root is not None and row.file_rel:
                    new_file_rel = relocate_file(
                        wiki_root=wiki_root, archive_root=archive_root,
                        file_rel=row.file_rel, target_month=to_month,
                        reimburser=row.reimburser,
                    )
                    new_period = to_month.replace("-", "")
                carry_in_note = f"{CARRY_IN_MARK} {from_month}"
                if row.note:
                    carry_in_note = f"{carry_in_note} | {row.note}"
                ledger.append_row(dst_path, ledger.LedgerRow(
                    id8=row.id8, file_rel=new_file_rel,
                    reimburser=row.reimburser, category=row.category,
                    amount=row.amount, currency=row.currency,
                    invoice_number=row.invoice_number,
                    period=new_period, submit_date=row.submit_date,
                    description=row.description,
                    settled=row.settled,
                    needs_review=row.needs_review,
                    note=carry_in_note,
                    invoice_type=row.invoice_type, billed_to=row.billed_to,
                    settled_date=row.settled_date, invoice_date=row.invoice_date,
                    payer_type=row.payer_type, payment_proof=row.payment_proof,
                    amount_cny=row.amount_cny,
                    # v2.5.9:carry 后保留双 sha — 否则下月 row 丢 dedup 身份
                    source_sha256=row.source_sha256,
                    pdf_text_sha256=row.pdf_text_sha256,
                ))
            new_note = f"{row.note} {CARRY_OUT_MARK} {to_month}".strip() if row.note else f"{CARRY_OUT_MARK} {to_month}"
            ledger.update_row_note(src_path, row.id8, note=new_note)
            results.append(CarryResult(row.id8, from_month, to_month, "carried"))

    return results
