"""月度报销汇总 markdown 生成。

每个报销人各自生成 `{root}/{YYYY-MM}/{reimburser}-summary.md`(同目录,覆盖式)。

不改账本,纯报告生成。月底 monthly-close 跑完 carry-forward 之后调一次。
"""

import datetime
from collections import defaultdict
from pathlib import Path
from typing import List, Optional

import ledger
import transfer


def _money(x: float) -> str:
    return f"¥{x:,.2f}"


def write_total(ledger_root) -> bool:
    """v2.5:跨月跨人总表 `{ledger_root}/总表.md`。

    拆「已结清」+「未结清」两表,主键用 invoice_number。
    已结清表多一列「报销打款时间」= settled_date。
    幂等:内容不变不写盘。返回 True 当写入,False 当无变化。
    v2.5.9:任一源账本含 git conflict markers 时 no-op,避免聚合掉行污染总表。
    """
    import naming as _naming
    ledger_root = Path(ledger_root)
    all_rows = []
    for month, reimb, p in ledger.iter_ledger_files(ledger_root):
        if ledger._has_conflict_markers(p.read_text(encoding="utf-8")):
            return False  # 任一源 unmerged → 不刷总表,保留上次状态等 wzb resolve
        for r in ledger.parse_ledger(p):
            all_rows.append((month, r))

    done = [(m, r) for m, r in all_rows if r.settled == ledger.SETTLED_OK]
    pending = [(m, r) for m, r in all_rows if r.settled != ledger.SETTLED_OK]

    lines = [
        "---",
        "title: 报销总表(跨月跨人)",
        "type: expense-total",
        "---",
        "",
        "# 报销总表",
        "",
        f"> 跨月跨人聚合。主键 = 发票编号。watch 自动刷新(StartInterval=2,内容不变不写盘)。",
        f"> 自动生成于 {datetime.datetime.now().strftime('%Y-%m-%d %H:%M')}",
        "",
        f"## ✅ 已结清({len(done)} 笔)",
        "",
        "| 发票编号 | 发票类型 | 发票对象 | 报销打款时间 | 报销人 | 金额 | 提交日期 | 开票日期 | 报销类型 | 备注 |",
        "|---|---|---|---|---|---|---|---|---|---|",
    ]
    for m, r in sorted(done, key=lambda mr: (mr[1].settled_date or "", mr[1].invoice_number)):
        money = f"{_naming.currency_symbol(r.currency)}{r.amount:g}"
        inv_no = (r.invoice_number or "(无)").replace("|", "｜")
        inv_type = (r.invoice_type or "?").replace("|", "｜")
        bto = (r.billed_to or "(无)").replace("|", "｜")
        # v2.5.8:打款时间统一截到日级,不要 HH:MM
        sd = ledger._truncate_settled_date_to_day(r.settled_date) if r.settled_date else "(未填)"
        sub = r.submit_date or ""
        idate = r.invoice_date or ""
        cat = r.category or ""
        note = (r.note or "").replace("|", "｜").replace("\n", " ")
        lines.append(
            f"| `{inv_no}` | {inv_type} | {bto} | {sd} | {r.reimburser} | {money} | "
            f"{sub} | {idate} | {cat} | {note} |"
        )

    lines += [
        "",
        f"## ⬜ 未结清({len(pending)} 笔)",
        "",
        "| 发票编号 | 发票类型 | 发票对象 | 报销人 | 金额 | 提交日期 | 开票日期 | 报销类型 | 备注 |",
        "|---|---|---|---|---|---|---|---|---|",
    ]
    for m, r in sorted(pending, key=lambda mr: (mr[0], mr[1].invoice_number)):
        money = f"{_naming.currency_symbol(r.currency)}{r.amount:g}"
        inv_no = (r.invoice_number or "(无)").replace("|", "｜")
        inv_type = (r.invoice_type or "?").replace("|", "｜")
        bto = (r.billed_to or "(无)").replace("|", "｜")
        sub = r.submit_date or ""
        idate = r.invoice_date or ""
        cat = r.category or ""
        note = (r.note or "").replace("|", "｜").replace("\n", " ")
        lines.append(
            f"| `{inv_no}` | {inv_type} | {bto} | {r.reimburser} | {money} | "
            f"{sub} | {idate} | {cat} | {note} |"
        )

    new_text = "\n".join(lines) + "\n"
    out = ledger_root / "总表.md"
    # 幂等:对比已存在内容(除了「自动生成于 ...」时间戳行,不然每跑必写)
    if out.exists():
        old_text = out.read_text(encoding="utf-8")
        # 去掉时间戳行后对比
        import re as _re
        norm_old = _re.sub(r"自动生成于 .+", "自动生成于 -", old_text)
        norm_new = _re.sub(r"自动生成于 .+", "自动生成于 -", new_text)
        if norm_old == norm_new:
            return False
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(new_text, encoding="utf-8")
    return True


def write_summary(ledger_root, month: str, *, reimburser: Optional[str] = None) -> List[Path]:
    """[DEPRECATED v2.5.10] per-人 summary 已废弃 —— 费用类型分布并进账本底部 dashboard
    (实时刷新),独立 summary 是会过时的快照 + 文件噪音。函数 + 测试保留作契约;
    月度流程(month-end/start/monthly-close)不再调用,不再生成 -summary.md 文件。

    生成 `{month}/{reimburser}-summary.md`。

    - reimburser=None:扫该月所有报销人,各自生成一份
    - reimburser='Lynne':只生成 Lynne 的
    返回:生成的所有 summary 路径列表。
    """
    ledger_root = Path(ledger_root)
    month_dir = ledger_root / month
    if reimburser is not None:
        reimbursers = [reimburser]
    else:
        reimbursers = []
        if month_dir.exists():
            for md in sorted(month_dir.glob("*.md")):
                if md.stem.endswith("-summary"):
                    continue
                reimbursers.append(md.stem)

    outputs: List[Path] = []
    for reimb in reimbursers:
        outputs.append(_write_one_summary(ledger_root, month, reimb))
    return outputs


def _write_one_summary(ledger_root: Path, month: str, reimburser: str) -> Path:
    src_path = ledger.ledger_path_for(month, ledger_root, reimburser=reimburser)
    rows = ledger.parse_ledger(src_path)

    new_rows = [r for r in rows if transfer.CARRY_IN_MARK not in r.note]
    carried_in = [r for r in rows if transfer.CARRY_IN_MARK in r.note]
    done = [r for r in rows if r.settled == ledger.SETTLED_OK]
    pending = [r for r in rows if r.settled != ledger.SETTLED_OK]

    by_category = defaultdict(lambda: {"count": 0, "amount": 0.0})
    for r in rows:
        by_category[r.category]["count"] += 1
        by_category[r.category]["amount"] += r.amount

    lines = [
        "---",
        f"title: 报销汇总 — {month} — {reimburser}",
        f"month: {month}",
        f"reimburser: {reimburser}",
        "type: expense-summary",
        "---",
        "",
        f"# 报销汇总 — {month} — {reimburser}",
        "",
        f"> 自动生成于 {datetime.datetime.now().strftime('%Y-%m-%d %H:%M')}",
        f"> 数据源:[{reimburser}.md](./{reimburser}.md)",
        "",
        "## 总览",
        "",
        f"- 本月新发生:**{len(new_rows)}** 笔,{_money(sum(r.amount for r in new_rows))}",
    ]
    if carried_in:
        lines.append(
            f"- 上月延续过来:**{len(carried_in)}** 笔,{_money(sum(r.amount for r in carried_in))}"
        )
    lines.append(f"- ✅ 已结清:**{len(done)}** 笔,{_money(sum(r.amount for r in done))}")
    lines.append(f"- ⬜ 未结清:**{len(pending)}** 笔,{_money(sum(r.amount for r in pending))}")
    lines.append("")

    if by_category:
        lines.append("## 按费用类型分布")
        lines.append("")
        lines.append("| 类型 | 笔数 | 总额 |")
        lines.append("|---|---:|---:|")
        for cat, stats in sorted(by_category.items(), key=lambda kv: -kv[1]["amount"]):
            lines.append(f"| {cat} | {stats['count']} | {_money(stats['amount'])} |")
        lines.append("")

    if pending:
        lines.append("## ⬜ 未结清明细")
        lines.append("")
        lines.append("| ID | 文件 | 类型 | 金额 | 状态 |")
        lines.append("|---|---|---|---:|:-:|")
        for r in pending:
            link = f"[{Path(r.file_rel).name}](/{r.file_rel})"
            lines.append(
                f"| {r.id8} | {link} | {r.category} | {_money(r.amount)} | {r.settled} |"
            )
        lines.append("")

    output_path = ledger_root / month / f"{reimburser}-summary.md"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text("\n".join(lines), encoding="utf-8")
    return output_path
