"""入档管线编排:inbox 当队列 → 提取 → 分类 → 归档 → 写 wiki 账本 → 成功才删。

v2 改造:sink 从飞书表换成 wiki markdown 账本(ledger.py)。
- 附件不再上传 —— 发票文件本身就在 git 仓库里,账本通过 `/发票/...` 链接引用。
- ConflictError 消失 —— ledger 用 id8 幂等,不会撞行;改为返回 False。
- 「无报销人」(顶层散文件)仍走 _conflict 流程,需要人工裁决放哪个子文件夹。

崩溃 / 失败语义(每步幂等,inbox 当队列):
  - synced   : 全链成功 → 从 _inbox 删除该文件
  - conflict : 无 {报销人}/ 子文件夹 → 移入 _conflict,人工裁决
  - error    : 瞬时失败(磁盘满 / 权限等)→ 留 inbox,下轮重跑

报销人 = 文件所在的 _inbox/{报销人}/ 子文件夹名(v1 半自动约定;v2 邮箱模式
mailbox 默认全部下到 _inbox/Lynne/)。
"""

import datetime
import os
import shutil
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

import archive
import classify
import identity
import ledger
import naming

CONFLICT_DIRNAME = "_conflict"
PAYMENT_AMOUNT_TOLERANCE = 0.05   # USD/HKD 截图可能小数 round,容忍 5 分


@dataclass
class Outcome:
    path: Path
    reimburser: Optional[str]
    status: str                # "synced" | "skipped" | "conflict" | "error"
    action: Optional[str]      # "created" | "skipped"(账本已存在 id8) | "receipt_not_voucher" | None
    detail: str


def iter_inbox_files(inbox_dir):
    """产出 (报销人, 文件路径)。报销人 = 子文件夹名;跳过 _conflict;顶层散文件报销人为 None。"""
    inbox_dir = Path(inbox_dir)
    if not inbox_dir.exists():
        return
    for entry in sorted(inbox_dir.iterdir()):
        if entry.name == CONFLICT_DIRNAME:
            continue
        if entry.is_dir():
            for f in sorted(entry.iterdir()):
                if f.is_file() and not f.name.startswith("."):
                    yield entry.name, f
        elif entry.is_file() and not entry.name.startswith("."):
            yield None, entry


def _quarantine(src, subdir_name: str) -> Path:
    """把 inbox 文件移入 _conflict/{subdir}/,同名碰撞时追号,绝不覆盖。

    review 实锤的证据销毁风险:conflict 目录跨报销人共享,邮件附件常叫
    `发票.pdf` / `invoice.pdf` — shutil.move 同名直接替换,第二张吞掉第一张,
    被(可能误)拦截的发票是报销的唯一凭证。追 `-2` / `-3` 保所有样本。
    """
    src = Path(src)
    inbox_dir = src.parent.parent
    dup_dir = inbox_dir / CONFLICT_DIRNAME / subdir_name
    dup_dir.mkdir(parents=True, exist_ok=True)
    target = dup_dir / src.name
    n = 2
    while target.exists():
        target = dup_dir / f"{src.stem}-{n}{src.suffix}"
        n += 1
    shutil.move(str(src), str(target))
    return target


def _process_one(src, reimburser, *, archive_root, ledger_root, wiki_root, extractor, rules,
                 submit_ts_ms, overseas_archive_root=None, petty_ledger_root=None):
    # v2.5.8 软去重根:同时查主账本和备用金账本,防过渡期存量主账本中遗留海外 invoice 被重复写入
    dedup_roots = [ledger_root]
    if petty_ledger_root:
        dedup_roots.append(petty_ledger_root)

    # v2.5.9 双 sha256 防线 — 放在 extractor 之前:纯文件哈希不需要字段,
    # 重复文件在烧 OCR/LLM 提取之前就被拦下(重投/launchd 重试不再放大 API 成本)。
    #   1. pdf_text_sha256 — 同发票被两 reimburser 拉,字节流不同但文本同 → 命中
    #   2. source_sha256   — 完全相同的物理文件(archive 已挡一层,这里兜底跨人/跨次)
    src_sha_input = identity.content_sha256(src)
    txt_sha_input = identity.pdf_text_sha256(src)
    sha_dup = ledger.find_by_pdf_text_sha256(dedup_roots, txt_sha_input)
    sha_reason = "pdf_text_sha256"
    if sha_dup is None:
        sha_dup = ledger.find_by_source_sha256(dedup_roots, src_sha_input)
        sha_reason = "source_sha256"
    if sha_dup is not None:
        dup_path, _dup_row = sha_dup
        _quarantine(src, "duplicate-by-content")
        return Outcome(src, reimburser, "skipped", "duplicate_by_content",
                       f"{sha_reason} 已在 {dup_path.name},content 去重跳过")

    fields = extractor(src)
    # 财务规则:receipt(付款收据)**不能作报销凭证**,只有 invoice/发票才能入账。
    # 同笔交易 receipt + invoice 同时存在 → 留 invoice,扔 receipt。
    # extractor 显式标 is_receipt=true 的 → 移到 _conflict/skipped-receipts/ + 不入账。
    if getattr(fields, "is_receipt", False):
        _quarantine(src, "skipped-receipts")
        return Outcome(src, reimburser, "skipped", "receipt_not_voucher",
                       "receipt 跳过(不能作报销凭证)")
    is_overseas = fields.invoice_type == "invoice"

    dup = ledger.find_by_invoice_number(dedup_roots, fields.invoice_number or "")
    if dup is not None:
        dup_path, _dup_row = dup
        _quarantine(src, "duplicate-by-invoice-number")
        return Outcome(src, reimburser, "skipped", "duplicate_invoice_number",
                       f"发票号 {fields.invoice_number} 已在 {dup_path.name},软去重跳过")

    # v2.5.9 Day 4:Hamming ≤ 2 近似号码检测,对症 OCR 单字符错读
    # (本次事故 `...22554` vs `...22558` = Hamming 1)。
    # 校准逻辑单一事实源:ledger.near_dup_gate(Hamming + 币种 + 金额 + 开票月),
    # sync 与 audit-near-dups 共用,不再复制漂移。
    #
    # 处置策略(2026-06-10 review 后定):命中一律「写入 + needs_review + ⚠️ note」,
    # 不硬拦截。理由:同日同价连号真票(同行程两张同价火车票/两笔相同滴滴)跟
    # OCR 错读重复的特征完全一致 — 硬拦截会把真票静默吞进 _conflict 导致漏报销
    # 且不可感知;写入+标记时重复行有 ⚠️ 可感知,故障模式不对称,选可感知的那边。
    near_dup_matches = []
    if fields.invoice_number and fields.invoice_number.strip() not in ("", "(无)"):
        for np_path, np_row, hd in ledger.find_near_duplicate_invoice_numbers(
            dedup_roots, fields.invoice_number,
        ):
            matched, _reason = ledger.near_dup_gate(
                np_row, fields.amount, fields.currency, fields.invoice_date, hd,
            )
            if matched:
                near_dup_matches.append((np_path, np_row, hd))
    category = classify.classify(fields.category_hint, rules)
    submit_dt = datetime.datetime.fromtimestamp(submit_ts_ms / 1000)
    submit_date = submit_dt.strftime("%Y-%m-%d %H:%M")
    # v2.5:归档目录 + ledger 都按【归集月】组织,初始 = 提交月(未结清)。
    # 结清后 / carry 后 watch 会 relocate 文件到目标月。invoice_date 仅作元数据。
    period = submit_dt.strftime("%Y%m")
    ledger_month = submit_dt.strftime("%Y-%m")
    # v2.5.7 路由:海外 invoice 走 overseas_archive_root(发票/ 兄弟目录 invoice/)。
    # 当未配置 overseas_archive_root 时回落到 archive_root(向后兼容)。
    target_root = (
        Path(overseas_archive_root)
        if overseas_archive_root and is_overseas
        else archive_root
    )
    ar = archive.archive_invoice(
        src, target_root, reimburser=reimburser, period=period, category=category,
        currency=fields.currency, amount=fields.amount or 0, invoice_number=fields.invoice_number,
    )
    file_rel = Path(ar.path).relative_to(wiki_root).as_posix()

    # 拉取 + 归档 + 写账本 = 自动;审批/打款合并为「已结清」task = Lynne 手动;
    # 系统拿不准的分类标 needs_review=True → section 多一条「分类已确认」task + dashboard 描述列前 ⚠️。
    # note 字段只装 carry-forward 标记(↗ / ←),不再混 ⚠️ 待核。
    needs_review = bool(fields.needs_review or category == classify.UNKNOWN)
    # v2.5.9 Day 4:近似号 gate 命中 → 强标 needs_review 并打 note(settled 措辞更重)
    near_dup_note = ""
    if near_dup_matches:
        needs_review = True
        np_path, np_row, hd = near_dup_matches[0]
        if np_row.settled == ledger.SETTLED_OK:
            near_dup_note = (f"⚠️ 与已结清 {np_row.invoice_number}"
                             f"(在 {np_path.name})Hamming={hd} 且币种金额开票月全同 — "
                             f"高度疑似 OCR 错读重复,核对后删本行")
        else:
            near_dup_note = (f"⚠️ 近似号 {np_row.invoice_number} 已在"
                             f" {np_path.name} (Hamming={hd}, 金额日期相同),核对是否为同一笔")

    # v2.5.9 Day 3:pdftotext × OCR 互验。pdftotext 抽 PDF 文本层的 20 位发票号串,
    # 跟 OCR 推出的 invoice_number 对照 — 不一致 = OCR 单字符错读高度可疑。
    # 严格规则:
    #   - pdftotext 抽到正好 1 个 20 位串且跟 OCR 不一致 → flag needs_review + note
    #   - 抽到 0 或 ≥ 2 个 → 跳过 cross-val(扫描件 / 海外 invoice / 票号+校验码混存)
    # 永不自动覆盖 OCR 值 — pdftotext 自己也会错(扫描件文本层是空 / 缺 ToUnicode CMap),
    # 静默切换 source-of-truth 反而引入新事故,只 flag 让 Lynne 看 pdf 决断。
    cross_val_note = ""
    ocr_inv = (fields.invoice_number or "").strip()
    if ocr_inv and ocr_inv not in ("", "(无)"):
        pdf_invs = identity.extract_pdf_text_invoice_numbers(src)
        if len(pdf_invs) == 1 and pdf_invs[0] != ocr_inv:
            needs_review = True
            # 最强重复信号:pdftotext 的号码已存在于账本 — 说明 OCR 把号码错读成
            # 新号、把已入账的票二次写入(本次事故重演:OCR 同时错读号码+金额时
            # Hamming gate 会漏,这条兜底)。仍只 flag 不拦 — pdftotext 单候选也可能
            # 是订单号/流水号(海外 invoice 文本层常见),拦错代价高,留人裁决。
            text_inv_dup = ledger.find_by_invoice_number(dedup_roots, pdf_invs[0])
            if text_inv_dup is not None:
                _tid_path, _tid_row = text_inv_dup
                cross_val_note = (f"⚠️ PDF 文本层号码 `{pdf_invs[0]}` 已在账本"
                                  f" {_tid_path.name}(OCR 读成 `{ocr_inv}`)— 高度疑似"
                                  f"已入账票的 OCR 错读重投,核对后删本行")
            else:
                cross_val_note = (f"⚠️ pdftotext 抽到 `{pdf_invs[0]}` 但 OCR 出 `{ocr_inv}`,"
                                  f"互验不一致 — 请打开 PDF 核对正确发票号")

    row = ledger.LedgerRow(
        id8=ledger.short_id(ar.content_hash),
        file_rel=file_rel,
        reimburser=reimburser,
        category=category,
        amount=fields.amount or 0.0,
        currency=fields.currency or "CNY",
        invoice_number=fields.invoice_number,
        period=period,
        submit_date=submit_date,
        description=fields.description,
        needs_review=needs_review,
        # 多 note 合并:near-dup + cross-val 都会触发,用 ` · ` 分隔保留全部信号
        note=" · ".join(n for n in (near_dup_note, cross_val_note) if n),
        invoice_type=fields.invoice_type,
        billed_to=fields.billed_to,
        invoice_date=fields.invoice_date,
        # v2.5.9:双 sha 落到 row 上,供后续 ingest 跨人 / 跨次 dedup
        source_sha256=ar.content_hash,
        pdf_text_sha256=txt_sha_input,
    )

    # v2.5.8 双账本路由:海外 invoice → 备用金账本,其他 → 主账本
    write_root = petty_ledger_root if (is_overseas and petty_ledger_root) else ledger_root
    ledger_path = ledger.ledger_path_for(ledger_month, write_root, reimburser=reimburser)
    added = ledger.append_row(ledger_path, row)
    action = "created" if added else "skipped"
    detail = ar.reason + (" 账本已有同 id8,跳过 append" if not added else "")
    return Outcome(src, reimburser, "synced", action, detail)


def plan_inbox(inbox_dir, *, extractor, rules):
    """干跑预览:提取+分类+算命名,不归档、不写账本、不删 inbox。"""
    plans = []
    for reimburser, src in iter_inbox_files(inbox_dir):
        if reimburser is None:
            plans.append({"src": str(src), "reimburser": None, "error": "无 {报销人}/ 子文件夹"})
            continue
        f = extractor(src)
        category = classify.classify(f.category_hint, rules)
        period = naming.invoice_period(f.invoice_date) if f.invoice_date else "未知"
        ext = Path(src).suffix.lstrip(".") or "bin"
        plans.append({
            "src": str(src),
            "reimburser": reimburser,
            "period": period,
            "category": category,
            "amount": f.amount,
            "invoice_number": f.invoice_number,
            "planned_name": naming.build_filename(period, category, f.currency, f.amount or 0, ext),
            "needs_review": f.needs_review or category == classify.UNKNOWN,
        })
    return plans


def _move_to_conflict(src, inbox_dir, reimburser):
    dest_dir = Path(inbox_dir) / CONFLICT_DIRNAME / (reimburser or "_unknown")
    dest_dir.mkdir(parents=True, exist_ok=True)
    shutil.move(str(src), str(dest_dir / src.name))


# ============================================================
# Req 4:付款证明截图 pipeline
# ============================================================

def find_invoice_by_payment(ledger_roots, *, reimburser: str,
                            currency: str, amount: float):
    """v2.5.8 Req 4:按 (reimburser, currency, amount) 在多个 ledger root 里找匹配 row。

    用截图里识别出的原币金额定位关联 invoice。
    - 兼容 v2.5.7 单 root 调用:ledger_roots 接受 Path / str / list / tuple
    - 实际海外 invoice 在备用金账本,国内增值税票在主账本;process-payments 传 [主, 备用金]
    - 同一报销人 + 同一币种 + 金额近似(差 ≤ PAYMENT_AMOUNT_TOLERANCE)→ 命中
    - 0 命中 → ("not_found", None, None) → 截图留 _drop/payments/ 等人工
    - 1 命中 → ("ok", row, ledger_path) → 进入归档
    - 多张 → ("ambiguous", [rows], None) → 截图留 _drop/payments/ 标错
    """
    if amount is None:
        return ("not_found", None, None)
    # 接受单值或可迭代
    if isinstance(ledger_roots, (str, Path)):
        roots = [Path(ledger_roots)]
    else:
        roots = [Path(r) for r in ledger_roots]
    hits = []
    for root in roots:
        for month, person, lp in ledger.iter_ledger_files(str(root)):
            if person != reimburser:
                continue
            for r in ledger.parse_ledger(lp):
                if (r.currency or "").upper() != (currency or "").upper():
                    continue
                if r.amount is None:
                    continue
                if abs(r.amount - amount) <= PAYMENT_AMOUNT_TOLERANCE:
                    hits.append((r, lp))
    if not hits:
        return ("not_found", None, None)
    if len(hits) > 1:
        return ("ambiguous", [r for r, _ in hits], None)
    row, lp = hits[0]
    return ("ok", row, lp)


def _payment_proof_filename(invoice_file_rel: str, amount_cny: float,
                            src_ext: str) -> str:
    """从 invoice 文件名衍生付款证明名,在金额后面拼 `-¥{amount_cny}`。
    例:`202606-办公费-HK$7599.pdf` + ¥6692.39 + .png → `202606-办公费-HK$7599-¥6692.39.png`
    保留 src 扩展名(截图通常 .png/.jpg)。
    """
    base = Path(invoice_file_rel).stem   # 去掉 .pdf
    cny = naming.format_amount(amount_cny)
    ext = src_ext.lstrip(".") or "png"
    return f"{base}-¥{cny}.{ext}"


@dataclass
class PaymentOutcome:
    src: Path
    reimburser: str
    status: str    # "synced" | "ambiguous" | "not_found" | "not_payment" | "error"
    invoice_number: Optional[str] = None
    target_path: Optional[Path] = None
    detail: str = ""


def process_payments_drop(payments_root, *,
                          ledger_root, wiki_root, extractor,
                          archive_root=None, overseas_archive_root=None,
                          petty_ledger_root=None):
    """v2.5.8 Req 4:扫 _drop/{人}/payments/ 截图,识别 → 关联 invoice → 归档 + 回写账本。

    参数:
      payments_root:  _drop 根(下面 {人}/payments/ 子目录扫)
      ledger_root:    主账本根(国内增值税票)
      petty_ledger_root: 备用金账本根(海外 invoice);v2.5.8 起 invoice row 都在这里
      wiki_root:      wiki 仓库根(用于算 file_rel)
      extractor:      callable(image_path)->PaymentProofFields

    归档目录:截图跟关联 invoice **同目录**(invoice/ 或 发票/),命名带原币+CNY 双标。
    回写账本:row.payment_proof = 链接,row.amount_cny = 截图里的实付。
    """
    payments_root = Path(payments_root)
    ledger_root = Path(ledger_root)
    wiki_root = Path(wiki_root)
    roots = [ledger_root]
    if petty_ledger_root:
        roots.append(Path(petty_ledger_root))
    outcomes = []
    if not payments_root.exists():
        return outcomes
    for person_dir in sorted(payments_root.iterdir()):
        if not person_dir.is_dir():
            continue
        payments_dir = person_dir / "payments"
        if not payments_dir.exists():
            continue
        for src in sorted(payments_dir.iterdir()):
            if not src.is_file() or src.name.startswith("."):
                continue
            outcomes.append(_process_one_payment(
                src, reimburser=person_dir.name,
                ledger_roots=roots, wiki_root=wiki_root,
                extractor=extractor,
            ))
    return outcomes


def _process_one_payment(src: Path, *, reimburser: str,
                         ledger_roots, wiki_root: Path, extractor):
    try:
        fields = extractor(src)
    except Exception as e:    # noqa: BLE001
        return PaymentOutcome(src, reimburser, "error", detail=f"extract failed: {e}")
    if not fields.is_payment_proof:
        return PaymentOutcome(src, reimburser, "not_payment",
                              detail="截图不是付款证明(可能是 invoice / 收据)")
    if fields.amount_original is None or not fields.currency:
        return PaymentOutcome(src, reimburser, "error",
                              detail="识别字段缺失(金额或币种)")

    status, row_or_rows, lp = find_invoice_by_payment(
        ledger_roots, reimburser=reimburser,
        currency=fields.currency, amount=fields.amount_original,
    )
    if status == "not_found":
        return PaymentOutcome(src, reimburser, "not_found",
                              detail=f"主账本无 {reimburser} 的 {fields.currency} {fields.amount_original} invoice")
    if status == "ambiguous":
        invs = ", ".join((r.invoice_number or r.id8) for r in row_or_rows)
        return PaymentOutcome(src, reimburser, "ambiguous",
                              detail=f"多张候选:{invs}")
    row = row_or_rows

    # v2.5.8 bug fix #4:resolve + containment 校验,防 row.file_rel 越狱(eg "../../etc")
    wiki_resolved = wiki_root.resolve()
    invoice_abs = (wiki_root / row.file_rel).resolve()
    if not str(invoice_abs).startswith(str(wiki_resolved) + os.sep) and invoice_abs != wiki_resolved:
        return PaymentOutcome(src, reimburser, "error",
                              invoice_number=row.invoice_number,
                              detail=f"invoice file_rel 越狱 wiki_root: {row.file_rel}")
    if not invoice_abs.exists():
        return PaymentOutcome(src, reimburser, "error",
                              invoice_number=row.invoice_number,
                              detail=f"invoice 文件不存在: {row.file_rel}")
    amount_cny = fields.amount_cny if fields.amount_cny is not None else \
        ledger.estimate_cny(fields.amount_original, fields.currency,
                            invoice_date=row.invoice_date)
    if amount_cny is None:
        return PaymentOutcome(src, reimburser, "error",
                              invoice_number=row.invoice_number,
                              detail="无法确定人民币金额(截图缺失 + 汇率不可用)")
    target_name = _payment_proof_filename(row.file_rel, amount_cny, src.suffix)
    target_abs = invoice_abs.parent / target_name
    # v2.5.8 bug fix #4:target 也校验 containment(防 target_name 含 .. 越狱)
    target_resolved = target_abs.resolve()
    if not str(target_resolved).startswith(str(wiki_resolved) + os.sep):
        return PaymentOutcome(src, reimburser, "error",
                              invoice_number=row.invoice_number,
                              detail=f"target 越狱 wiki_root: {target_name}")
    # 用 resolve 后的路径算相对(避免 macOS /private/var ↔ /var symlink 错位)
    target_rel = target_resolved.relative_to(wiki_resolved).as_posix()

    # v2.5.8 bug fix #2:先回写账本,成功后才 move 截图。
    # 若先 move 再回写,账本写失败 → 截图已离开 _drop 无法重试,关联永久丢失。
    proof_link = f"[付款证明]({'/' + target_rel})"
    try:
        ledger.update_row_payment_info(
            lp, row.invoice_number,
            payment_proof_link=proof_link,
            amount_cny=amount_cny,
            id8_fallback=row.id8,
        )
    except Exception as e:    # noqa: BLE001
        return PaymentOutcome(src, reimburser, "error",
                              invoice_number=row.invoice_number,
                              detail=f"账本回写失败,截图保留 _drop: {e}")
    try:
        shutil.move(str(src), str(target_abs))
    except OSError as e:
        # 账本已写但截图 mv 失败:留 detail 让用户人工 mv;账本字段已正确(已写入路径)
        return PaymentOutcome(src, reimburser, "error",
                              invoice_number=row.invoice_number,
                              detail=f"账本已回写,但 mv 失败需人工 mv: {e}")

    return PaymentOutcome(
        src, reimburser, "synced",
        invoice_number=row.invoice_number,
        target_path=target_abs,
        detail=f"关联 {row.invoice_number} → {target_name}",
    )


def process_inbox(inbox_dir, *, archive_root, ledger_root, wiki_root, extractor, rules,
                  submit_ts_ms, overseas_archive_root=None, petty_ledger_root=None):
    inbox_dir = Path(inbox_dir)
    archive_root = Path(archive_root)
    ledger_root = Path(ledger_root)
    wiki_root = Path(wiki_root)
    outcomes = []
    for reimburser, src in iter_inbox_files(inbox_dir):
        if reimburser is None:
            _move_to_conflict(src, inbox_dir, None)
            outcomes.append(Outcome(src, None, "conflict", None, "无 {报销人}/ 子文件夹,无法识别报销人"))
            continue
        try:
            o = _process_one(src, reimburser, archive_root=archive_root, ledger_root=ledger_root,
                             wiki_root=wiki_root,
                             extractor=extractor, rules=rules, submit_ts_ms=submit_ts_ms,
                             overseas_archive_root=overseas_archive_root,
                             petty_ledger_root=petty_ledger_root)
        except Exception as e:  # noqa: BLE001 — 瞬时失败留 inbox 重试
            o = Outcome(src, reimburser, "error", None, str(e))
            outcomes.append(o)
            continue
        if o.status == "synced":
            src.unlink()
        outcomes.append(o)
    return outcomes
