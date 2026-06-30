"""wiki 报销账本 sink:每月一份 md,**section + Obsidian task** 设计。

每张发票一段 H3 section,审批 / 打款 用 markdown task `- [ ]`:Lynne 在
Obsidian Live Preview 模式下点击即 toggle ✅(原生 widget,真 click-to-toggle)。

每段格式:

    ### `{id8}` {description}
    {category} · {currency_symbol}{amount} · 📎 [filename](/file_rel) · 发票号 `{invoice_no}` · 报销人 {reimburser} · 提交 {YYYY-MM-DD HH:MM}
    - [ ] 审批通过
    - [ ] 已打款

    > {note}        ← 仅当 note 非空时(⚠️ 待核 / ↗ 延至 X / ← 自 X)

id8 用 inline code 包(`` `5c5f46df` ``),做稳定 anchor 给 parse / find / update。
section 之间隔一行空行,人读 / Obsidian 渲染都顺。

幂等:同 id8 在同一账本只写一次。
"""

import hashlib
import json
import math
import re
from dataclasses import dataclass
from pathlib import Path
from typing import List, Optional

import identity
import naming

# 单一「已结清」状态(审批 + 打款 合并 —— 审批通过即触发对公转账,Lynne 不分两步跟)
SETTLED_PENDING = "⬜"
SETTLED_OK = "✅"

# 旧字段名兼容(transfer / summary 仍用,内部映射到 settled)
APPROVAL_PENDING = SETTLED_PENDING
APPROVAL_OK = SETTLED_OK
PAYMENT_PENDING = SETTLED_PENDING
PAYMENT_OK = SETTLED_OK

DASHBOARD_START = "<!-- DASHBOARD_START -->"
DASHBOARD_END = "<!-- DASHBOARD_END -->"

_ID8_RE = re.compile(r"^[0-9a-f]{8}$")
# v2.5 起 id8 藏在 HTML 注释里(Obsidian Live Preview 不渲染),H3 只显示 description:
#   ### {description}
#   <!-- id8: xxxxxxxx -->
# 兼容 v2.4 老格式(inline id8):
#   ### `xxxxxxxx` {description}
_ID8_COMMENT_RE = re.compile(r"<!--\s*id8:\s*([0-9a-f]{8})\s*-->")
_LEGACY_INLINE_ID8_RE = re.compile(r"^### `([0-9a-f]{8})`\s+(.*?)\s*$", re.M)
# v2.5.9:双 sha256 防线,同 id8 一样藏在 HTML 注释里,Obsidian 不渲染
_SRC_SHA_COMMENT_RE = re.compile(r"<!--\s*src_sha:\s*([0-9a-f]{64})\s*-->")
_TXT_SHA_COMMENT_RE = re.compile(r"<!--\s*txt_sha:\s*([0-9a-f]{64})\s*-->")
# v2.5.8:H3 行匹配 — `_renumber_sections` 写时填序号,`_parse_section` 读时容忍序号
_H3_LINE_RE = re.compile(r"^### (?:\d+\.\s+)?(.+?)\s*$", re.M)
_H3_NUMBER_RE = _H3_LINE_RE
# section 起始:任意 H3 行(parse 时再从 H3 后面 / inline 找 id8)
_SECTION_START_RE = re.compile(r"^### ", re.M)
_DASHBOARD_BLOCK_RE = re.compile(
    re.escape(DASHBOARD_START) + r".*?" + re.escape(DASHBOARD_END),
    re.S,
)
_FILE_LINK_RE = re.compile(r"\[([^\]]+)\]\(/([^)]+)\)")
# v2.5.4:字段加 `N. ` 有序列表编号(Obsidian 渲染自动列表);regex 允许行首数字+点+空格。
# `_LP_` = line-prefix:任意前导空格 + 可选 `\d+\. `;`_KP_` = key padding(加粗 `**`)。
_LP_ = r"^[ \t]*(?:[-*]\s+|\d+\.\s+)?"
_KP_ = r"\**"
_INVOICE_NO_RE = re.compile(_KP_ + r"发票号码?" + _KP_ + r"[::]?\s*`([^`]+)`")
_REIMBURSER_LINE_RE = re.compile(_LP_ + _KP_ + r"报销(?:人|姓名)" + _KP_ + r"[::]\s*(\S+?)\s*$", re.M)
_REIMBURSER_RE = re.compile(r"报销人\s+(\S+)")
_SUBMIT_LINE_RE = re.compile(_LP_ + _KP_ + r"提交(?:时间)?" + _KP_ + r"[::]\s*(\d{4}-\d{2}-\d{2}\s+\d{1,2}:\d{2})\s*$", re.M)
_SUBMIT_RE = re.compile(r"提交\s+(\d{4}-\d{2}-\d{2}\s+\d{1,2}:\d{2})")
_AMOUNT_LINE_RE = re.compile(_LP_ + _KP_ + r"金额(?:数量)?" + _KP_ + r"[::]\s*(.+?)\s*$", re.M)
_PERIOD_FROM_FILEREL_RE = re.compile(r"/(\d{6})/")
_SETTLED_DONE_RE = re.compile(r"^- \[[xX]\]\s+已结清", re.M)
_REVIEW_TASK_RE = re.compile(r"^- \[([ xX])\]\s+分类已确认", re.M)
_CATEGORY_LINE_RE = re.compile(_LP_ + r"(?:\**📂\s*)?\**费?用?类型\**[::]\s*(.+?)\s*\**\s*$", re.M)
_INVOICE_TYPE_LINE_RE = re.compile(
    _LP_ + _KP_ + r"发票类型" + _KP_ + r"[::]\s*(普票|专票|invoice|domestic|overseas)\s*$", re.M)
_BILLED_TO_LINE_RE = re.compile(_LP_ + _KP_ + r"(?:发票)?抬头" + _KP_ + r"[::]\s*(.+?)\s*$", re.M)
# v2.5.7:报销对象 = 公户 时,语义为「公司直接打款,无需再次报销」。
# 默认值(空字符串)= 个人垫付,走正常报销流程。
_PAYER_TYPE_LINE_RE = re.compile(_LP_ + _KP_ + r"报销对象" + _KP_ + r"[::]\s*(公户|个人)\s*$", re.M)
# v2.5.7:公户标记的首选 UX —— Obsidian task box,Live Preview 模式下直接点击 toggle。
# 勾上 = payer_type=公户 + settled 自动 ✅ + settled_date 自动 = invoice_date(打款日期默认发票日期)。
_COMPANY_PAID_TASK_RE = re.compile(r"^- \[([ xX])\]\s+公户已打款", re.M)
# v2.5.7:备用金专用字段。付款证明 = markdown 文件链接 `[name](/path)`,记录从备用金账户实际支付的截图。
# 人民币金额 = 实际付款人民币数(默认按发票日汇率换算,可手改;真实付款 ≠ 汇率值,有手续费/日期偏差)。
_PAYMENT_PROOF_LINE_RE = re.compile(_LP_ + _KP_ + r"付款证明" + _KP_ + r"[::]\s*(.+?)\s*$", re.M)
_AMOUNT_CNY_LINE_RE = re.compile(_LP_ + _KP_ + r"人民币金额" + _KP_ + r"[::]\s*¥?\s*([0-9,]+(?:\.[0-9]+)?)\s*$", re.M)
_INVOICE_DATE_LINE_RE = re.compile(
    _LP_ + _KP_ + r"开票(?:时间)?" + _KP_ + r"[::]\s*(\d{4}-?\d{2}(?:-?\d{2})?|\d{6}(?:\d{2})?)\s*$", re.M)
_SETTLED_DATE_LINE_RE = re.compile(_LP_ + _KP_ + r"(?:✓\s*结清|结清时间)" + _KP_ + r"[::]\s*(.+?)\s*$", re.M)
# 老 v2.5 单行 `🧾 类型:X · 抬头:Y · 开票:Z`(兼容)
_INVOICE_META_LEGACY_LINE_RE = re.compile(r"^🧾\s*(.+?)\s*$", re.M)
_INVOICE_TYPE_INLINE_RE = re.compile(r"类型[::]\s*(普票|专票|invoice|domestic|overseas)")
_BILLED_TO_INLINE_RE = re.compile(r"抬头[::]\s*([^·]+?)(?:\s*·|\s*$)")
_INVOICE_DATE_INLINE_RE = re.compile(r"开票[::]\s*(\d{6})")
# v2.5.9:支持 multiline blockquote。markdown 规范:连续 `>` 开头行 = 一个 blockquote;
# 空行打断块。注意 `(?:^>.*\n?)+` 用 re.M 配合 splitlines 扫,正则只用来识别"块前导"。
# Lynne 在 sync 写的 single-line note 后面手加 `> 我看过了 OK` —— 不能被 watch 重写吞掉。
# `^> ` (>空格 + 任意) 或 `^>$` (单 `>` 空 quote);严格,不吃 `>>>>>>>` conflict marker / 嵌套 quote。
_NOTE_BLOCK_RE = re.compile(r"(?:^>(?:\s.*|$)\n?)+", re.M)


def _parse_note_block(sec: str) -> str:
    """扫 section,提取第一个连续 blockquote 块,join 成 `\\n` 分隔的字符串。

    `> 第一行` + `> 第二行` → `"第一行\\n第二行"`
    `> ` 空 quote 行 → 保留为空字符串行。
    没有 blockquote → 返回 ""。
    """
    lines = sec.splitlines()
    block: list[str] = []
    in_block = False
    for ln in lines:
        # blockquote 严格规则:`> content` 或单独 `>` 空 quote;`>>foo` / `>>>>>>> origin/main`
        # 等(git conflict marker / 嵌套 quote)**不**算 sync 写的 note,跳过。
        # 旧 _NOTE_LINE_RE `^>\s+...` 隐式保证了 `>` 后跟空白,这里显式化。
        is_quote = ln.startswith("> ") or ln.strip() == ">"
        if is_quote:
            content = ln[1:].lstrip(" ")
            block.append(content.rstrip())
            in_block = True
        elif in_block:
            # 第一个块结束,后续 blockquote 视为独立块,忽略
            break
    return "\n".join(block).strip("\n")

_SYMBOL_TO_CODE = [
    ("HK$", "HKD"),
    ("¥", "CNY"),
    ("$", "USD"),
    ("€", "EUR"),
    ("£", "GBP"),
]

# v2.5.7:备用金账本汇率估算 — 三级 fallback:本地缓存 → exchangerate.host API → 硬编码近期均值。
# 实际付款 = 汇率 × 原币 + 手续费/汇率波动,通常差 1-3%;这里只给起点估算,实付以截图为准。
# Req 4 接入截图识别后,自动读截图实付额覆盖估算。
_FX_TO_CNY_FALLBACK = {
    "CNY": 1.0,
    "USD": 7.18,
    "HKD": 0.92,
    "EUR": 7.75,
    "GBP": 8.90,
}
_FX_CACHE_PATH = Path(__file__).resolve().parent / "logs" / "fx-cache.json"
# Frankfurter:欧洲央行历史汇率,完全免费、无需 key。支持 USD/EUR/GBP/JPY 等主流币种。
# HKD 等非欧元报价币不在 Frankfurter 范围,会走硬编码 fallback。
_FX_API_URL = "https://api.frankfurter.app/{date}?from={base}&to=CNY"
_FX_API_TIMEOUT = 5  # 秒,联网慢就 fallback


def _fx_cache_load() -> dict:
    try:
        return json.loads(_FX_CACHE_PATH.read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError, OSError):
        return {}


def _fx_cache_save(cache: dict) -> None:
    # v2.5.8:tmp + os.replace 原子写,防并发 launchd 进程造成 torn file
    import os as _os
    try:
        _FX_CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)
        tmp_path = _FX_CACHE_PATH.with_suffix(_FX_CACHE_PATH.suffix + ".tmp")
        tmp_path.write_text(
            json.dumps(cache, ensure_ascii=False, indent=2, sort_keys=True),
            encoding="utf-8",
        )
        _os.replace(str(tmp_path), str(_FX_CACHE_PATH))
    except OSError:
        pass


def _fetch_fx_rate_online(currency: str, iso_date: str) -> Optional[float]:
    """调 Frankfurter API 取历史汇率(YYYY-MM-DD)。失败返回 None,调用方 fallback。
    需要带 User-Agent 否则部分服务返回 403。Frankfurter 只支持欧元报价基础的主流币种,
    HKD 等非报价币会返回 422 → urllib HTTPError → None。
    """
    import urllib.request
    import urllib.error
    url = _FX_API_URL.format(date=iso_date, base=currency.upper())
    req = urllib.request.Request(
        url, headers={"User-Agent": "gengrowth-baoxiao/2.5.8 (+wzb@gengrowth)"}
    )
    try:
        with urllib.request.urlopen(req, timeout=_FX_API_TIMEOUT) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except (urllib.error.URLError, urllib.error.HTTPError, json.JSONDecodeError,
            OSError, ValueError):
        return None
    rate = data.get("rates", {}).get("CNY")
    if rate is None:
        return None
    try:
        rate_f = float(rate)
    except (TypeError, ValueError):
        return None
    # v2.5.8 bug fix #5:校验 finite + 正数,防 NaN/Inf/0/负数流入账本造成 dashboard 聚合静默坏
    if not math.isfinite(rate_f) or rate_f <= 0:
        return None
    return rate_f


def lookup_fx_rate(currency: str, date_yyyymmdd: Optional[str] = None,
                   *, online_fetcher=None) -> Optional[float]:
    """三级 fallback 取 currency → CNY 汇率。
    online_fetcher 可注入(测试时 mock);默认 None 时运行时查模块级 _fetch_fx_rate_online。
    返回 None 表示不支持的币种。
    """
    # 运行时绑定 — 默认参数会在函数定义时捕获引用,无法配合 monkey patch
    fetcher = online_fetcher if online_fetcher is not None else _fetch_fx_rate_online
    code = (currency or "").upper()
    if code == "CNY":
        return 1.0
    # 1. 缓存命中(按日期)
    if date_yyyymmdd and len(date_yyyymmdd) >= 8:
        iso_date = f"{date_yyyymmdd[:4]}-{date_yyyymmdd[4:6]}-{date_yyyymmdd[6:8]}"
        cache = _fx_cache_load()
        key = f"{code}-CNY:{iso_date}"
        if key in cache:
            return cache[key]
        # 2. 在线 API + 写缓存
        rate = fetcher(code, iso_date) if fetcher else None
        # v2.5.8 bug fix #5:深度防御 — 即使 fetcher 不校验,这里也兜底,防 NaN/Inf/0/负数流入账本
        if rate is not None:
            try:
                rate_f = float(rate)
            except (TypeError, ValueError):
                rate_f = None
            if rate_f is None or not math.isfinite(rate_f) or rate_f <= 0:
                rate_f = None
            if rate_f is not None:
                cache[key] = rate_f
                _fx_cache_save(cache)
                return rate_f
    # 3. 硬编码近期均值 fallback(离线 / API 失败 / 无日期)
    return _FX_TO_CNY_FALLBACK.get(code)


def estimate_cny(amount: float, currency: str,
                 *, invoice_date: Optional[str] = None,
                 online_fetcher=None) -> Optional[float]:
    """估算原币 → CNY。优先查 invoice_date 当日汇率,fallback 到硬编码均值。
    invoice_date 形如 YYYYMMDD;不传则只查 fallback 表。
    """
    if amount is None or amount == 0:
        return None
    rate = lookup_fx_rate(currency, invoice_date, online_fetcher=online_fetcher)
    if rate is None:
        return None
    return round(amount * rate, 2)


@dataclass
class LedgerRow:
    id8: str
    file_rel: str
    reimburser: str
    category: str
    amount: float
    invoice_number: str
    period: str                     # v2.5 起语义 = 当前归集月(初始 = 提交月,settle 后 = 结清月,carry 后 = 下月)
    submit_date: str
    currency: str = "CNY"
    description: str = ""           # 商家 + 商品/服务 + 用途(渲染在 section title)
    settled: str = SETTLED_PENDING  # ⬜ 未结清 / ✅ 已结清(审批 + 打款 合并)
    needs_review: bool = False      # 系统不确定分类,需要 Lynne 在 section 点 `- [x] 分类已确认`
    note: str = ""                  # ↗ 延至 X / ← 自 X 等 marker(渲染为 blockquote)
    invoice_type: str = ""          # "普票"(国内增值税普通)/ "专票"(国内增值税专用,可抵扣)/ "invoice"(海外)/ ""(未知)
    billed_to: str = ""             # 发票对象抬头(国内:公司全称;海外:Bill to 名字 / Org)
    settled_date: str = ""          # 结清时间 ISO 字符串,空表示未结清;v2.5 起,settled=✅ 时 watch 自动填
    invoice_date: str = ""          # 开票日期 YYYYMMDD(凭证元数据,不参与路径计算)
    payer_type: str = ""            # ""(默认,个人垫付走报销流程)/"公户"(公司已直接打款,不再报销)
    payment_proof: str = ""         # 付款证明 markdown 链接(v2.5.7 备用金账本用,普通报销留空)
    amount_cny: Optional[float] = None  # 实际付款人民币(海外 invoice 备用金记账用;非备用金留 None)
    # v2.5.9:双 sha256 ingest 防线
    # source_sha256 = 物理字节哈希(archive 算的 content_hash 直接搬过来)
    # pdf_text_sha256 = pdftotext 抽文本后再哈希,接住"同发票字节漂移"场景
    # 两道都不命中 → invoice_number 软去重 → 写新 row;老 markdown 无注释回读 = ""
    source_sha256: str = ""
    pdf_text_sha256: str = ""

    # 旧字段别名:transfer / summary 仍读 approval/payment,统一映射到 settled
    @property
    def approval(self) -> str:
        return self.settled

    @property
    def payment(self) -> str:
        return self.settled


def short_id(content_sha256: str) -> str:
    return content_sha256[:8].lower()


def ledger_path_for(month: str, root, *, reimburser: str) -> Path:
    """month 形如 '2026-06' + reimburser 'Lynne' → {root}/2026-06/Lynne.md

    v2.4:ledger 按 `{月}/{报销人}.md` 分目录(原来是 `{月}.md` 全月一份)。
    避免 Lynne 跟 wzb 的报销 row 混在同一份月度账本里。
    """
    return Path(root) / month / f"{reimburser}.md"


def iter_ledger_files(root):
    """扫 {root}/{YYYY-MM}/{reimburser}.md(排除 -summary.md)。
    产出 (month, reimburser, path)。"""
    root = Path(root)
    if not root.exists():
        return
    for month_dir in sorted(root.iterdir()):
        if not month_dir.is_dir():
            continue
        for md in sorted(month_dir.glob("*.md")):
            stem = md.stem
            if stem.endswith("-summary"):
                continue
            yield month_dir.name, stem, md


def find_by_invoice_number(ledger_roots, invoice_number: str) -> Optional[tuple]:
    """v2.5.1:跨月跨人按 invoice_number 软去重查询。
    v2.5.8:ledger_roots 接受单值或 list/tuple,扫多个 root(用于双账本 dedup)。
    返回 (path, row) 或 None。空 / '(无)' 一律不视为命中(普票小票常无编号)。

    遍历 {root}/{YYYY-MM}/{人}.md;hit first 短路返回。
    """
    if not invoice_number or invoice_number.strip() in ("", "(无)"):
        return None
    target = invoice_number.strip()
    if isinstance(ledger_roots, (str, Path)):
        roots = [ledger_roots]
    else:
        roots = list(ledger_roots)
    for root in roots:
        for _month, _reimburser, path in iter_ledger_files(root):
            for row in parse_ledger(path):
                if (row.invoice_number or "").strip() == target:
                    return (path, row)
    return None


def _find_by_sha_field(ledger_roots, sha_hex: str, field_name: str) -> Optional[tuple]:
    """v2.5.9 内部 helper:按 LedgerRow 上某个 sha256 字段跨账本查 row。

    空字符串视为不命中(老 row 没回填 sha 字段,不能让"两个老 row 都为空"误成同一)。
    """
    if not sha_hex or len(sha_hex) != 64:
        return None
    target = sha_hex.lower()
    if isinstance(ledger_roots, (str, Path)):
        roots = [ledger_roots]
    else:
        roots = list(ledger_roots)
    for root in roots:
        for _month, _reimburser, path in iter_ledger_files(root):
            for row in parse_ledger(path):
                val = (getattr(row, field_name, "") or "").strip().lower()
                if val and val == target:
                    return (path, row)
    return None


def find_by_source_sha256(ledger_roots, source_sha256: str) -> Optional[tuple]:
    """v2.5.9:按文件字节 sha256 跨账本查 row。
    作 ingest 第一道防线 — 完全相同的物理文件被两次拉取(同一邮件附件被两次下载)。
    archive 层已挡一层,这里挡 archive 层之前的"先写 row 再判断要不要丢"分支。
    """
    return _find_by_sha_field(ledger_roots, source_sha256, "source_sha256")


def find_by_pdf_text_sha256(ledger_roots, pdf_text_sha256: str) -> Optional[tuple]:
    """v2.5.9:按 PDF 文本层 sha256 跨账本查 row。
    作 ingest 第二道防线 — 同一发票被两个 reimburser 各自下载(字节流不同
    但文本相同),content_sha256 / invoice_number OCR 两道都可能失效时的最后兜底。
    """
    return _find_by_sha_field(ledger_roots, pdf_text_sha256, "pdf_text_sha256")


# v2.5.9 Day 4 校准常量 — sync ingest 与 audit-near-dups 共用单一事实源
NEAR_DUP_MAX_HAMMING = 2
NEAR_DUP_AMOUNT_TOLERANCE = 0.01


def _hamming_distance(a: str, b: str) -> int:
    """v2.5.9:等长字符串 Hamming 距离。长度不等 → 视作 +∞ (不参与近似匹配)。

    本意只用于发票号 — 国内增值税电子普通发票号统一 20 位数字,Hamming=1
    能逮住 OCR 单字符错读(`22554` vs `22558`),Hamming=2 能逮住两位 transposition。
    """
    if len(a) != len(b):
        return max(len(a), len(b)) + 1
    return sum(1 for x, y in zip(a, b) if x != y)


hamming_distance = _hamming_distance  # 公开别名(cli / 外部调用用这个名)


def _invoice_month_key(invoice_date) -> str:
    """归一化开票日期到月级 `YYYYMM`,供 near-dup gate 比较。

    必须做归一化的原因(review 实锤):extractor 给的 incoming 可能带连字符
    (`2026-06-05`),而存量 row 的 invoice_date 经 render/parse round-trip 后是
    纯数字(`20260605`)— 直接字符串比较永远不等,date gate 形同虚设。
    比到月级而非日级:render 端 DD=='01' 时只渲染 `YYYY-MM`(日信息有损),
    月级比较是 round-trip 后双方都保真的最大精度。
    不足 6 位数字 → 返回 ""(调用方视为"日期缺失,gate 不绑定")。
    """
    digits = re.sub(r"\D", "", str(invoice_date or ""))
    return digits[:6] if len(digits) >= 6 else ""


def near_dup_gate(row_a, row_b_amount, row_b_currency, row_b_invoice_date,
                  hd: int, *, max_distance: int = NEAR_DUP_MAX_HAMMING) -> tuple:
    """v2.5.9:三层(+币种)校准 — 判断"号码近似的两条记录是否同一笔的两次 OCR"。

    sync._process_one(ingest 拦截)与 cli.cmd_audit_near_dups(审计标注)共用,
    单一事实源,杜绝复制逻辑漂移。

    返回 (matched: bool, reason: str)。matched=True 表示四个条件全过:
      1. 1 ≤ Hamming ≤ max_distance(0 = 完全相等,由 find_by_invoice_number 拦)
      2. 币种相同(防 USD 200 vs CNY 200 跨账本误杀)
      3. 金额相等(±NEAR_DUP_AMOUNT_TOLERANCE)且双方都 > 0
         (双方都缺金额时 0.0==0.0 是假象,不绑定;$0 Gift 票重复无成本,放过)
      4. 开票月相同且双方都有有效日期(空 == 空是假象,不绑定)
    """
    if not (1 <= hd <= max_distance):
        return (False, f"Hamming={hd} 超出阈值 {max_distance}")
    cur_a = (row_a.currency or "CNY").upper()
    cur_b = (row_b_currency or "CNY").upper()
    if cur_a != cur_b:
        return (False, f"币种不同 ({cur_a} vs {cur_b})")
    amt_a = row_a.amount or 0.0
    amt_b = row_b_amount or 0.0
    if amt_a <= 0.005 or amt_b <= 0.005:
        return (False, "任一方金额缺失或为 0,gate 不绑定")
    if abs(amt_a - amt_b) > NEAR_DUP_AMOUNT_TOLERANCE:
        return (False, f"金额不同 ({cur_a}{amt_a} vs {cur_b}{amt_b})")
    month_a = _invoice_month_key(row_a.invoice_date)
    month_b = _invoice_month_key(row_b_invoice_date)
    if not month_a or not month_b:
        return (False, "任一方开票日期缺失,gate 不绑定")
    if month_a != month_b:
        return (False, f"开票月不同 ({month_a} vs {month_b})")
    return (True, f"Hamming={hd} + 币种金额开票月全同 ({cur_a}{amt_a}, {month_a})")


def find_near_duplicate_invoice_numbers(
    ledger_roots, target: str, *, max_distance: int = NEAR_DUP_MAX_HAMMING,
) -> list:
    """v2.5.9:跨账本扫描所有 Hamming 距离 ≤ max_distance 的 row。

    返回 [(path, row, distance), ...],按 distance 升序。空 / "(无)" target 直接 [].
    用于 ingest 阶段对症抓 OCR 单字符错读(本次事故 `...22554` vs `...22558` 是 Hamming=1)。
    Day 4 副产物:audit-near-dups CLI 扫存量,把潜在重复整理出来人工裁决。

    号码两侧先过 identity.normalize_invoice_key(NFKC 全角→半角 + 去空白 + 去前缀
    + 大写)再比 Hamming — OCR 在号码里塞空格/全角数字时不再绕过近似检测。

    注意:`hd == 0` (完全相等)也会被收进结果 — 调用方按需过滤;实际 ingest 路径已经
    在 find_by_invoice_number 那道挡住完全相等的情况,这里关心 1 ≤ hd ≤ max_distance。
    """
    t = identity.normalize_invoice_key(target)
    if not t or t == "(无)":
        return []
    if isinstance(ledger_roots, (str, Path)):
        roots = [ledger_roots]
    else:
        roots = list(ledger_roots)
    hits = []
    for root in roots:
        for _month, _reimburser, path in iter_ledger_files(root):
            for row in parse_ledger(path):
                inv = identity.normalize_invoice_key(row.invoice_number or "")
                if not inv or inv == "(无)":
                    continue
                hd = _hamming_distance(inv, t)
                if hd <= max_distance:
                    hits.append((path, row, hd))
    hits.sort(key=lambda x: x[2])
    return hits


# v2.5.8:账本类型 — 主账本(国内增值税票)vs 备用金账本(海外 invoice + 个人垫付)
LEDGER_TYPE_MAIN = "expense-ledger"
LEDGER_TYPE_PETTY = "petty-cash-ledger"
_LEDGER_TYPE_RE = re.compile(r"^type:\s*([\w-]+)\s*$", re.M)


def _ledger_type_from_path(path) -> str:
    """读 frontmatter `type:` 字段判断账本类型。无 frontmatter / 字段缺失默认主账本。"""
    path = Path(path)
    if not path.exists():
        # 推断:路径含 备用金/ → petty,否则 main(用于 _ensure_file 新建场景)
        parts_str = str(path)
        return LEDGER_TYPE_PETTY if "/备用金/" in parts_str or "\\备用金\\" in parts_str else LEDGER_TYPE_MAIN
    text = path.read_text(encoding="utf-8")
    m = _LEDGER_TYPE_RE.search(text)
    return m.group(1) if m else LEDGER_TYPE_MAIN


def _frontmatter_and_intro(month: str, reimburser: Optional[str] = None,
                           ledger_type: str = LEDGER_TYPE_MAIN) -> str:
    title_suffix = f" — {reimburser}" if reimburser else ""
    reimb_line = f"reimburser: {reimburser}\n" if reimburser else ""
    if ledger_type == LEDGER_TYPE_PETTY:
        # 备用金账本:海外 invoice + 付款证明 + 实付 CNY,等效国内发票的报销凭证
        return (
            "---\n"
            f"title: 备用金账本 — {month}{title_suffix}\n"
            f"month: {month}\n"
            f"{reimb_line}"
            f"type: {LEDGER_TYPE_PETTY}\n"
            "---\n\n"
            f"# 备用金账本 — {month}{title_suffix}\n\n"
            "> 海外 invoice + 付款证明 = 国内发票的等效凭证。每张 invoice 一段,字段格式同主账本。\n"
            "> 关键字段:**人民币金额**(实付 CNY)、**付款证明**(付款截图链接,跟 invoice 同目录归档)。\n"
            "> 截图投递:扔 `_drop/{人}/payments/` 等 OCR 识别 → 自动 mv 到 `invoice/{月}/{人}/`\n"
            "> 命名为 `{invoice 原名}-¥{实付}.png`。**归档位置不是 _drop**,_drop 只是临时投递区。\n"
            "> **本月汇总**:已结清/待结清按**人民币**金额聚合(实际结算口径,非原币)。\n"
            "> **底部 dashboard** 随文件变化自动刷新(launchd watch ~2s)。\n\n"
        )
    return (
        "---\n"
        f"title: 报销账本 — {month}{title_suffix}\n"
        f"month: {month}\n"
        f"{reimb_line}"
        f"type: {LEDGER_TYPE_MAIN}\n"
        "---\n\n"
        f"# 报销账本 — {month}{title_suffix}\n\n"
        "> 每张发票一段;`已结清` 是 Obsidian task,Live Preview 模式下点击即 toggle ✅。\n"
        "> 拿不准的发票会多一条 `分类已确认` task,Lynne 看完点 ✓ → `⚠️` 消失。\n"
        "> 月底 `monthly-close` 把未结清的延续到下月账本。\n"
        "> **底部 dashboard** 表格随文件变化自动刷新(launchd watch + ~2s 同步)。\n\n"
    )


# v2.5:公司国内发票抬头(可报销基准 — 跟 reimbursers.yaml domestic_title 对齐)
DOMESTIC_TITLE = "广州进格智能科技有限公司"


def is_reimbursable(row) -> bool:
    """可报销 = 国内增值税发票 + 抬头 = gengrowth 公司。其他都是备用金(海外/个人垫付)。"""
    # v2.5.6:国内发票拆「普票/专票」,语义上都是 gengrowth 抬头国内增值税发票 → 可报销。
    # 老 "domestic" 值兼容(backfill 期间 + 老 markdown)。
    return row.invoice_type in ("普票", "专票", "domestic") and row.billed_to == DOMESTIC_TITLE


def is_company_paid(row) -> bool:
    """v2.5.7:公户 = 公司直接打款,与个人垫付报销互斥。
    汇总表把这部分票单独成「公户已打款」桶,不混进「可报销 / 备用金」。"""
    return getattr(row, "payer_type", "") == "公户"


def _aggregate_by_billto(rows: List["LedgerRow"], *,
                         settle_in_cny: bool = False) -> str:
    """按「抬头 × 币种」聚合,渲染表格行。

    v2.5.8:settle_in_cny=True 时,已结清/待结清列用人民币金额(用于备用金账本实际结算)。
    人民币金额优先用 row.amount_cny(手填),缺失时用 estimate_cny 估算 fallback。
    主账本(国内 CNY 票)用原币即 CNY,不需要切。
    """
    by_key = {}
    for r in rows:
        key = (r.billed_to or "(无抬头)", r.currency or "CNY")
        s = by_key.setdefault(key, {"total": 0.0, "done_orig": 0.0, "pending_orig": 0.0,
                                    "done_cny": 0.0, "pending_cny": 0.0})
        s["total"] += r.amount or 0
        # 算人民币金额:手填 amount_cny 优先,否则按开票日汇率估
        if settle_in_cny:
            cny = r.amount_cny if r.amount_cny is not None else \
                estimate_cny(r.amount or 0, r.currency, invoice_date=r.invoice_date)
            cny = cny if cny is not None else 0
        else:
            cny = 0
        if r.settled == SETTLED_OK:
            s["done_orig"] += r.amount or 0
            s["done_cny"] += cny
        else:
            s["pending_orig"] += r.amount or 0
            s["pending_cny"] += cny
    if not by_key:
        return ""
    if settle_in_cny:
        lines = [
            "| 抬头 | 币种 | 总额(原币) | ✅ 已结清(¥) | ⬜ 待结清(¥) |",
            "|---|---|---:|---:|---:|",
        ]
    else:
        lines = [
            "| 抬头 | 币种 | 总额 | ✅ 已结清 | ⬜ 待结清 |",
            "|---|---|---:|---:|---:|",
        ]
    for (bto, curr), s in sorted(by_key.items()):
        sym = naming.currency_symbol(curr)
        total_cell = f"{sym}{_format_amount(s['total'])}"
        if settle_in_cny:
            done_cell = f"¥{_format_amount(s['done_cny'])}"
            pending_cell = f"¥{_format_amount(s['pending_cny'])}"
        else:
            done_cell = f"{sym}{_format_amount(s['done_orig'])}"
            pending_cell = f"{sym}{_format_amount(s['pending_orig'])}"
        lines.append(f"| {bto} | {curr} | {total_cell} | {done_cell} | {pending_cell} |")
    return "\n".join(lines)


def _render_summary(rows: List["LedgerRow"],
                    ledger_type: str = LEDGER_TYPE_MAIN) -> str:
    """v2.5.8 月度汇总:按账本类型选择桶配置。

    主账本(expense-ledger):两桶「📒 可报销 / 🏛 公户已打款」(国内增值税票域)
      - 旧版有备用金桶 — v2.5.8 起 invoice 类型 row 物理移到备用金账本,主账本不再有这桶
      - 即使空也渲染,Lynne 知道入桶结构

    备用金账本(petty-cash-ledger):单一表 by 抬头×币种(海外 invoice 域)
      - 备用金账本里所有 row 都是"备用金"性质,不需要再分桶
      - 直接按抬头×币种聚合,显示总额 / 已结清 / 待结清
    """
    def block(title: str, bucket_rows: List["LedgerRow"],
              *, settle_in_cny: bool = False) -> str:
        body = (_aggregate_by_billto(bucket_rows, settle_in_cny=settle_in_cny)
                if bucket_rows else "_(暂无)_")
        return f"{title}\n\n{body}"

    if ledger_type == LEDGER_TYPE_PETTY:
        # 备用金账本:已结清/待结清按人民币结算(做财务对账)
        return block("**💼 备用金支出**(海外 invoice + 个人垫付)", rows,
                     settle_in_cny=True)

    # 主账本:两桶
    company_paid_rows = [r for r in rows if is_company_paid(r)]
    reimb_rows = [r for r in rows if not is_company_paid(r) and is_reimbursable(r)]
    return "\n\n".join([
        block("**📒 可报销**(gengrowth 抬头国内发票)", reimb_rows),
        block("**🏛 公户已打款**(公司直接打款,无需再次报销)", company_paid_rows),
    ])


def _render_dashboard(rows: List["LedgerRow"],
                      ledger_type: str = LEDGER_TYPE_MAIN) -> str:
    """渲染 dashboard 区:顶部 月度汇总(by 抬头×币种)+ 下方 全量发票表格。
    备用金账本(petty)额外显示 人民币 + 付款证明 列。"""
    is_petty = ledger_type == LEDGER_TYPE_PETTY
    if not rows:
        empty_label = "_(暂无 invoice)_" if is_petty else "_(暂无发票)_"
        return f"{DASHBOARD_START}\n\n{empty_label}\n\n{DASHBOARD_END}"
    parts = [DASHBOARD_START, "", "## 📊 本月汇总", "",
             _render_summary(rows, ledger_type), "",
             ("## 📒 全部 invoice" if is_petty else "## 📒 全部发票"), ""]
    if is_petty:
        parts += [
            "| 发票号 | 描述 | 类型 | 原币 | 人民币 | 付款证明 | 状态 |",
            "|---|---|---|---|---|---|---|",
        ]
    else:
        parts += [
            "| 发票号 | 描述 | 类型 | 金额 | 状态 | 备注 |",
            "|---|---|---|---|---|---|",
        ]
    for r in rows:
        money = f"{naming.currency_symbol(r.currency)}{_format_amount(r.amount)}"
        st = SETTLED_OK if r.settled == SETTLED_OK else SETTLED_PENDING
        desc = (r.description or "").replace("|", "｜")
        if r.needs_review:
            desc = f"⚠️ {desc}"
        inv_no = (r.invoice_number or "(无)").replace("|", "｜")
        if is_petty:
            if r.amount_cny is not None:
                cny_cell = f"¥{_format_amount(r.amount_cny)}"
            else:
                est = estimate_cny(r.amount or 0, r.currency, invoice_date=r.invoice_date)
                cny_cell = f"~¥{_format_amount(est)}(估算)" if est is not None else "(待填)"
            proof_cell = "✓" if r.payment_proof else "(待补充)"
            parts.append(
                f"| `{inv_no}` | {desc} | {r.category} | {money} | {cny_cell} | {proof_cell} | {st} |"
            )
        else:
            # v2.5.9:note 可能内嵌 `\n`(multiline blockquote 往返保留)。
            # 表格 cell 不能有真换行,统一 → `<br>`(GFM / Obsidian 都识别)。
            note = (r.note or "").replace("|", "｜").replace("\n", "<br>")
            parts.append(
                f"| `{inv_no}` | {desc} | {r.category} | {money} | {st} | {note} |"
            )
    parts += ["", DASHBOARD_END]
    return "\n".join(parts)


_CONFLICT_MARKER_RE = re.compile(
    r"^(?:<{7} |={7}$|>{7} )",
    re.M,
)


def _has_conflict_markers(text: str) -> bool:
    """v2.5.9:obsidian-git 自动 merge 失败会在文件里留 `<<<<<<< ` / `=======` / `>>>>>>> `
    标记。在 unmerged 文件上跑 parse + 重写会破坏 conflict 结构,让 wzb 难 resolve。
    """
    return bool(_CONFLICT_MARKER_RE.search(text))


def _refresh_dashboard(path: Path) -> bool:
    """重生 dashboard:**始终放文件末尾**(section 在前,dashboard 在后)。
    idempotent:内容不变不写入,防 launchd WatchPaths 死循环。
    v2.5.7:刷 dashboard 前先 propagate_company_paid,确保公户勾选立即联动 settled。
    v2.5.8:按 frontmatter type 选两种 dashboard 配置(主账本 / 备用金账本)。
    v2.5.9:遇到 git conflict markers 直接 no-op,避免污染未解决的 merge。
    返回 True 当实际写入磁盘,False 当内容没变化(用于上层 quiet 模式)。"""
    if not path.exists():
        return False
    # v2.5.9 防御:文件有 conflict markers → wzb 在 resolve merge,跳过。
    # auto_fill_settled_dates 也走这条;统一在底层 short-circuit。
    if _has_conflict_markers(path.read_text(encoding="utf-8")):
        return False
    # v2.5.8 性能:parse 一次,把 rows 复用给 propagate 和 dashboard 渲染
    rows = parse_ledger(path)
    # 先 propagate 公户联动 — 这一步可能改写 section,但不影响 dashboard 块的 idempotent 检查
    propagate_company_paid(path, rows=rows)
    text = path.read_text(encoding="utf-8")
    # propagate 若改写了 section,需要重新 parse;否则复用上面的 rows
    if rows and any(r.payer_type == "公户" and r.settled != SETTLED_OK for r in rows):
        rows = parse_ledger(path)
    ledger_type = _ledger_type_from_path(path)
    new_block = _render_dashboard(rows, ledger_type)
    cleaned = _DASHBOARD_BLOCK_RE.sub("", text)
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned).rstrip() + "\n\n"
    new_text = cleaned + new_block + "\n"
    if new_text != text:
        path.write_text(new_text, encoding="utf-8")
        return True
    return False


def _format_amount(amount: float) -> str:
    if amount == int(amount):
        return str(int(amount))
    return f"{amount:.2f}".rstrip("0").rstrip(".")


_DATE_DAY_RE = re.compile(r"^(\d{4}-\d{2}-\d{2})(?:$|[ T])")


def _truncate_settled_date_to_day(s: str) -> str:
    """v2.5.8:settled_date 统一截到 YYYY-MM-DD,不要 HH:MM 时间部分。
    支持 "2026-06-02"、"2026-06-02 17:08"、"2026-06-02T17:08:00" 等格式。
    YYYY-MM(无 day)原样保留。

    v2.5.9 收紧:
    - 边界正则要求 YYYY-MM-DD 后面是结束 / 空格 / T,
      防 "2026-06-02garbage" 这种被悄悄截成 "2026-06-02"。
    - datetime.date.fromisoformat 校验真实日期,
      拒 "2026-99-99"、"2026-13-40" 这类语法合法但值非法的脏值。
    """
    import datetime as _dt
    s = (s or "").strip()
    if not s:
        return s
    m = _DATE_DAY_RE.match(s)
    if not m:
        return s
    day_str = m.group(1)
    try:
        _dt.date.fromisoformat(day_str)
    except ValueError:
        return s
    return day_str


def _format_invoice_date(invoice_date: str) -> str:
    """渲染开票日期:
    - YYYYMMDD 且 DD != '01'(真实开票日)→ `YYYY-MM-DD`
    - YYYYMMDD 且 DD == '01'(默认占位月份)或仅 YYYYMM → `YYYY-MM`
    """
    s = (invoice_date or "").strip()
    if not s or len(s) < 6:
        return s
    yyyy, mm = s[:4], s[4:6]
    if len(s) >= 8 and s[6:8] not in ("", "00", "01"):
        return f"{yyyy}-{mm}-{s[6:8]}"
    return f"{yyyy}-{mm}"


def _format_section(r: LedgerRow) -> str:
    """v2.5.2:字段加粗 key + 信息密度排序(发票核心 → 业务标签 → 时间 → 人 → 文件),
    操作类 task(已结清 / 分类已确认)放底部。无 emoji,无 id8 注释(空发票号兜底除外)。
    """
    money = f"{naming.currency_symbol(r.currency)}{_format_amount(r.amount)}"
    file_name = Path(r.file_rel).name if r.file_rel else "(无文件)"
    link = f"[{file_name}](/{r.file_rel})" if r.file_rel else "(无)"
    settled_box = "[x]" if r.settled == SETTLED_OK else "[ ]"

    # 空 invoice_number 时(无编号小票):兜底 `<!-- id8 -->` 注释作 PK(防重投)
    id8_fallback = ""
    if not r.invoice_number or r.invoice_number == "(无)":
        id8_fallback = f"<!-- id8: {r.id8} -->\n"

    # v2.5.9:双 sha256 防线 — 字节 hash + PDF 文本 hash,藏 HTML 注释里;
    # Obsidian Live Preview 不渲染。空字符串不渲染(老 row 回写时不强插)。
    sha_block = ""
    src_sha = (getattr(r, "source_sha256", "") or "").strip().lower()
    if src_sha:
        sha_block += f"<!-- src_sha: {src_sha} -->\n"
    txt_sha = (getattr(r, "pdf_text_sha256", "") or "").strip().lower()
    if txt_sha:
        sha_block += f"<!-- txt_sha: {txt_sha} -->\n"

    # 收集字段(只在有值时加入),然后统一编号 1-N。Markdown 有序 list 渲染时
    # 数字会被 Obsidian 自动重排,所以全部用 `1.` 也 OK,但为了纯文本可读保留递增。
    fields = []
    fields.append(("发票号码", f"`{r.invoice_number or '(无)'}`"))
    if r.billed_to:
        fields.append(("发票抬头", r.billed_to))
    if r.invoice_type:
        fields.append(("发票类型", r.invoice_type))
    fields.append(("费用类型", r.category or "(未分类)"))
    fields.append(("金额数量", money))
    # 备用金专用:人民币实付额(原币 ≠ CNY 时才有意义,但允许显式覆盖)
    amount_cny = getattr(r, "amount_cny", None)
    if amount_cny is not None:
        fields.append(("人民币金额", f"¥{_format_amount(amount_cny)}"))
    if r.invoice_date:
        fields.append(("开票时间", _format_invoice_date(r.invoice_date)))
    fields.append(("提交时间", r.submit_date or "(无)"))
    fields.append(("报销姓名", r.reimburser or "(无)"))
    fields.append(("文件链接", link))
    # v2.5.8:备用金账本 row 始终显示「付款证明」字段(空时占位"(待补充)"),让 Lynne 看到每张都要补
    # 主账本(国内增值税票)不需要付款证明,只在 payment_proof 实际有值时才显示(向后兼容)
    payment_proof = getattr(r, "payment_proof", "")
    is_petty_row = (r.invoice_type == "invoice")
    if payment_proof:
        fields.append(("付款证明", payment_proof))
    elif is_petty_row:
        fields.append(("付款证明", "(待补充)"))

    # H3 描述不加序号(序号由 _renumber_sections 统一填,append 后重排);
    # 字段用 bullet `- ` 而非有序列表
    body = f"### {r.description or '(无描述)'}\n{id8_fallback}{sha_block}"
    for key, val in fields:
        body += f"- **{key}**:{val}\n"

    # 底部:操作区(Lynne 在 Obsidian 点击的 task widget)
    # v2.5.7:公户已打款 task 放在已结清之前 —— 先决策"是否公户",勾上后自动 settled。
    company_paid_box = "[x]" if getattr(r, "payer_type", "") == "公户" else "[ ]"
    body += f"- {company_paid_box} 公户已打款(不走个人报销)\n"
    body += f"- {settled_box} 已结清\n"
    if r.needs_review:
        body += "- [ ] 分类已确认\n"

    # settled_date:settled=OK 且有时间戳才渲染(底部,跟 task 同区)
    # v2.5.8:统一截到日级 YYYY-MM-DD,不显示具体时间(老数据若带 HH:MM 自动清掉)
    if r.settled == SETTLED_OK and r.settled_date:
        body += f"**结清时间**:{_truncate_settled_date_to_day(r.settled_date)}\n"

    if r.note:
        # v2.5.9:note 可能内嵌 `\n`(Lynne 手加多行 / sync 长 note)。每行 `> ` 前缀,
        # 空行用单独 `>` 而非 `> `(避免尾部空格)。前导 `\n` 保 blockquote 与上一段隔开。
        quoted = "\n".join(f"> {ln}" if ln else ">" for ln in r.note.split("\n"))
        body += f"\n{quoted}\n"
    return body


def _ensure_file(path: Path, *, ledger_type: Optional[str] = None) -> None:
    if path.exists():
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    # 新结构 `{root}/{YYYY-MM}/{reimburser}.md`:月份从 parent dir 拿,报销人从 stem 拿。
    # 旧结构 `{root}/{YYYY-MM}.md` fallback:parent.name 不是 YYYY-MM 时退回 stem。
    parent_name = path.parent.name
    if re.fullmatch(r"\d{4}-\d{2}", parent_name):
        month = parent_name
        reimburser = path.stem
    else:
        month = path.stem
        reimburser = None
    # v2.5.8:优先用调用方显式传的 ledger_type;否则按路径推断(/备用金/ → petty)
    if ledger_type is None:
        ledger_type = _ledger_type_from_path(path)
    path.write_text(
        _frontmatter_and_intro(month, reimburser, ledger_type=ledger_type),
        encoding="utf-8",
    )


def _renumber_sections(text: str) -> str:
    """给所有 H3 标题统一加 `N. ` 序号(从 1 开始按 section 出现顺序)。
    已存在的序号会被剥掉重排,保证幂等。dashboard / frontmatter 区不动。
    """
    # 只处理 dashboard 之前的 body 区(避免把 dashboard 表格 H3 误编号)
    if DASHBOARD_START in text:
        body, dash = text.split(DASHBOARD_START, 1)
        dash = DASHBOARD_START + dash
    else:
        body, dash = text, ""
    counter = [0]

    def _sub(m):
        counter[0] += 1
        desc = m.group(1).strip()
        return f"### {counter[0]}. {desc}"

    new_body = _H3_NUMBER_RE.sub(_sub, body)
    return new_body + dash


def _existing_ids(path: Path) -> set:
    """v2.5.1:PK 改用 invoice_number。兼容老格式(id8 注释 / inline id8)。
    返回 set 含已存在的所有 id8(老格式)+ invoice_number(新格式 + 老格式),
    任一命中即视为重复,append_row 跳过。
    """
    if not path.exists():
        return set()
    text = path.read_text(encoding="utf-8")
    ids = set(_ID8_COMMENT_RE.findall(text))                    # 老:HTML 注释 id8
    ids |= {x[0] if isinstance(x, tuple) else x
            for x in _LEGACY_INLINE_ID8_RE.findall(text)}       # 老:inline id8
    # 新格式:扫所有 `发票号:` / `发票号 ` 行的内容
    for m in _INVOICE_NO_RE.finditer(text):
        v = m.group(1).strip()
        if v and v != "(无)":
            ids.add(v)
    return ids


def append_row(path, row: LedgerRow) -> bool:
    """v2.5.1:dedup key 优先 invoice_number(主 PK),fallback id8(老 markdown 兼容 / 无号小票)。
    v2.5.4:写入后 _renumber_sections 给 H3 加 `N. ` 序号。
    """
    path = Path(path)
    _ensure_file(path)
    existing = _existing_ids(path)
    dedup_key = row.invoice_number.strip() if row.invoice_number and row.invoice_number != "(无)" else row.id8
    if dedup_key and dedup_key in existing:
        return False
    body = path.read_text(encoding="utf-8")
    sep = "" if body.endswith("\n\n") else ("\n" if body.endswith("\n") else "\n\n")
    body += sep + _format_section(row) + "\n"
    body = _renumber_sections(body)
    path.write_text(body, encoding="utf-8")
    _refresh_dashboard(path)
    return True


def refresh_dashboard(path) -> bool:
    """供外部调用(cli refresh-dashboard / Lynne toggle 后同步表格)。
    返回 True 当实际写入磁盘,False 当内容没变化。"""
    return _refresh_dashboard(Path(path))


def _parse_money(cell: str):
    cell = cell.strip()
    if not cell:
        return "CNY", 0.0
    for sym, code in _SYMBOL_TO_CODE:
        if cell.startswith(sym):
            num = re.sub(r"[^\d.\-]", "", cell[len(sym):])
            try:
                return code, float(num)
            except ValueError:
                return code, 0.0
    num = re.sub(r"[^\d.\-]", "", cell)
    try:
        return "CNY", float(num)
    except ValueError:
        return "CNY", 0.0


def _iter_sections(text: str):
    """切分文本 → list of section text (each starts with `### \`id8\``)。"""
    indices = [m.start() for m in _SECTION_START_RE.finditer(text)]
    if not indices:
        return []
    indices.append(len(text))
    return [text[indices[i]:indices[i + 1]] for i in range(len(indices) - 1)]


def _parse_section(sec: str) -> Optional[LedgerRow]:
    """Parse 一个 section 文本 → LedgerRow。
    v2.5.1 起 markdown 不再写 id8,PK = invoice_number。三种格式兼容:
      - v2.4 老格式:`### \`id8\` description` + 单行 meta(· 分隔)
      - v2.5 中间格式:`### description` + `<!-- id8 -->` 注释 + 单行 meta + `🧾 ... · ...` metadata
      - v2.5.1 新格式:`### description` + 多行无 emoji `key:value`
    """
    # 兼容 v2.4 老格式(inline id8 `` ### `id8` description ``)
    legacy_m = _LEGACY_INLINE_ID8_RE.match(sec)
    if legacy_m:
        id8_from_md = legacy_m.group(1)
        description = legacy_m.group(2).strip()
    else:
        h3_m = _H3_LINE_RE.match(sec)
        if not h3_m:
            return None
        description = h3_m.group(1).strip()
        id8_m = _ID8_COMMENT_RE.search(sec)
        id8_from_md = id8_m.group(1) if id8_m else ""  # v2.5.1 新格式没注释
    if description == "(无描述)":
        description = ""

    # ---- meta 抽取 ----
    # 多行格式优先:逐字段单独 regex;失败 fallback 到老单行 `· 分隔` 启发式
    amount_m = _AMOUNT_LINE_RE.search(sec)
    inv_no_m = _INVOICE_NO_RE.search(sec)            # 兼容多行 (`发票号:\`X\``) + 老单行 (`发票号 \`X\``)
    reimb_line_m = _REIMBURSER_LINE_RE.search(sec)
    submit_line_m = _SUBMIT_LINE_RE.search(sec)

    if amount_m:
        money_s = amount_m.group(1).strip()
        currency, amount = _parse_money(money_s)
    else:
        # 老单行 fallback:meta 那行用 · 分隔
        lines = sec.split("\n")
        meta = ""
        for line in lines[1:]:
            if "📎" in line or "发票号" in line:
                meta = line
                break
        parts = [p.strip() for p in meta.split("·")]
        money_s = ""
        for p in parts:
            if any(p.startswith(sym) for sym, _ in _SYMBOL_TO_CODE):
                money_s = p
                break
        currency, amount = _parse_money(money_s)

    file_match = _FILE_LINK_RE.search(sec)
    file_rel = file_match.group(2) if file_match else ""

    invoice_no = inv_no_m.group(1) if inv_no_m else ""
    if invoice_no == "(无)":
        invoice_no = ""

    if reimb_line_m:
        reimburser = reimb_line_m.group(1).strip()
    else:
        # 老单行 fallback
        r_m = _REIMBURSER_RE.search(sec)
        reimburser = r_m.group(1).strip() if r_m else ""
    if reimburser == "(无)":
        reimburser = ""

    if submit_line_m:
        submit_date = submit_line_m.group(1).strip()
    else:
        s_m = _SUBMIT_RE.search(sec)
        submit_date = s_m.group(1) if s_m else ""

    # 费用类型(9 项)
    cat_m = _CATEGORY_LINE_RE.search(sec)
    category = cat_m.group(1).strip() if cat_m else ""
    if category in ("(未分类)", ""):
        category = ""

    period_match = _PERIOD_FROM_FILEREL_RE.search(file_rel)
    period = period_match.group(1) if period_match else ""

    settled = SETTLED_OK if _SETTLED_DONE_RE.search(sec) else SETTLED_PENDING
    review_match = _REVIEW_TASK_RE.search(sec)
    needs_review = bool(review_match) and review_match.group(1).lower() != "x"
    # v2.5.9:multiline 安全往返。Lynne 手加第二行 `> ...` 不能被吞。
    note = _parse_note_block(sec)

    # v2.5.1 多行 metadata 优先;fallback 到 v2.5 单行 🧾 格式
    invoice_type = ""
    billed_to = ""
    invoice_date = ""
    it_line_m = _INVOICE_TYPE_LINE_RE.search(sec)
    if it_line_m:
        invoice_type = it_line_m.group(1).strip()
    bt_line_m = _BILLED_TO_LINE_RE.search(sec)
    if bt_line_m:
        billed_to = bt_line_m.group(1).strip()
    id_line_m = _INVOICE_DATE_LINE_RE.search(sec)
    if id_line_m:
        # 接受 YYYY-MM / YYYY-MM-DD / YYYYMM / YYYYMMDD 统一规整成 YYYYMMDD
        raw = id_line_m.group(1).strip().replace("-", "")
        if len(raw) == 6:
            invoice_date = raw + "01"      # YYYYMM → YYYYMM01
        elif len(raw) == 8:
            invoice_date = raw             # YYYYMMDD
        else:
            invoice_date = raw[:8].ljust(8, "0")
    if not (invoice_type or billed_to or invoice_date):
        # fallback 老单行 `🧾 类型:X · 抬头:Y · 开票:Z`
        legacy_inv = _INVOICE_META_LEGACY_LINE_RE.search(sec)
        if legacy_inv:
            inv_line = legacy_inv.group(1)
            t_m = _INVOICE_TYPE_INLINE_RE.search(inv_line)
            if t_m:
                invoice_type = t_m.group(1).strip()
            b_m = _BILLED_TO_INLINE_RE.search(inv_line)
            if b_m:
                billed_to = b_m.group(1).strip()
            d_m = _INVOICE_DATE_INLINE_RE.search(inv_line)
            if d_m:
                invoice_date = d_m.group(1).strip() + "01"

    sd_match = _SETTLED_DATE_LINE_RE.search(sec)
    settled_date = sd_match.group(1).strip() if sd_match else ""
    # v2.5.7:老数据兼容 — 有结清时间但 task box 未勾(老 watch 脏数据残留)→ 视为已结清。
    # rerender 时 task box 会自动 toggle 回 [x],dashboard 也会显示一致的 ✅。
    if settled == SETTLED_PENDING and settled_date:
        settled = SETTLED_OK

    # v2.5.7:优先识别 task box 状态(新格式),fallback 到 `**报销对象**:公户` 字段(老格式兼容)。
    payer_type = ""
    cp_match = _COMPANY_PAID_TASK_RE.search(sec)
    if cp_match and cp_match.group(1).lower() == "x":
        payer_type = "公户"
    else:
        pt_match = _PAYER_TYPE_LINE_RE.search(sec)
        if pt_match and pt_match.group(1).strip() == "公户":
            payer_type = "公户"

    pp_match = _PAYMENT_PROOF_LINE_RE.search(sec)
    payment_proof = pp_match.group(1).strip() if pp_match else ""
    ac_match = _AMOUNT_CNY_LINE_RE.search(sec)
    if ac_match:
        try:
            amount_cny = float(ac_match.group(1).replace(",", ""))
        except ValueError:
            amount_cny = None
    else:
        amount_cny = None

    # v2.5.1:PK 改用 invoice_number;若无(老格式不写 invoice 或新小票无编号),
    # 用 id8_from_md(老 markdown 有 id8 注释)或 file_rel hash 作内存 ID 兜底。
    id8 = id8_from_md or (invoice_no.strip() if invoice_no else "")
    if not id8 and file_rel:
        id8 = hashlib.sha256(file_rel.encode("utf-8")).hexdigest()[:8]

    # v2.5.9:双 sha256 防线 — 从 HTML 注释回读,缺失视作老 row 兼容
    src_sha_m = _SRC_SHA_COMMENT_RE.search(sec)
    source_sha256 = src_sha_m.group(1).lower() if src_sha_m else ""
    txt_sha_m = _TXT_SHA_COMMENT_RE.search(sec)
    pdf_text_sha256 = txt_sha_m.group(1).lower() if txt_sha_m else ""

    return LedgerRow(
        id8=id8, file_rel=file_rel, reimburser=reimburser,
        category=category, amount=amount, currency=currency,
        invoice_number=invoice_no, period=period, submit_date=submit_date,
        description=description, settled=settled, needs_review=needs_review, note=note,
        invoice_type=invoice_type, billed_to=billed_to,
        settled_date=settled_date, invoice_date=invoice_date,
        payer_type=payer_type, payment_proof=payment_proof, amount_cny=amount_cny,
        source_sha256=source_sha256, pdf_text_sha256=pdf_text_sha256,
    )


def parse_ledger(path) -> List[LedgerRow]:
    path = Path(path)
    if not path.exists():
        return []
    text = path.read_text(encoding="utf-8")
    rows = []
    for sec in _iter_sections(text):
        r = _parse_section(sec)
        if r is not None:
            rows.append(r)
    return rows


def find_by_id8(path, key) -> Optional[LedgerRow]:
    """v2.5.1:`key` 接受 id8 / invoice_number / 子串(老 markdown 有 id8 注释时仍能找)。
    匹配优先级:row.id8 完全相等 → invoice_number 完全相等 → invoice_number 子串包含 key。
    """
    rows = parse_ledger(path)
    for r in rows:
        if r.id8 == key:
            return r
    for r in rows:
        if r.invoice_number == key:
            return r
    # 子串匹配:test 习惯传 "aaaaaaaa" 找 invoice_number=`INV-aaaaaaaa`
    for r in rows:
        if key and key in (r.invoice_number or ""):
            return r
    return None


def _settled_task_drift_rows(path: Path, rows: list) -> bool:
    """v2.5.8 检测 markdown 漂移:row.settled==OK(_parse_section 已经推断)但 markdown 里
    `- [ ] 已结清` task box 仍未勾。这种状态来自老 watch 写过 settled_date 后被反勾、
    或 Obsidian Git merge 残留、或 v2.5.7 前的脏数据。返回 True 表示需要 rerender 同步。
    幂等:rerender 后 markdown 变成 `- [x] 已结清` + 结清时间,再扫不再触发。
    """
    if not path.exists() or not rows:
        return False
    try:
        text = path.read_text(encoding="utf-8")
    except OSError:
        return False
    # 任一已结清的 row 在 markdown 里 task box 仍是 [ ] → 漂移
    settled_done_count = len(_SETTLED_DONE_RE.findall(text))
    settled_rows = sum(1 for r in rows if r.settled == SETTLED_OK)
    return settled_rows > settled_done_count


def propagate_company_paid(path, *, rows: Optional[list] = None) -> List[str]:
    """v2.5.7:公户票自动联动 settled + settled_date。

    触发条件:row.payer_type == "公户" 且 settled != ✅ → 改写为 ✅ + settled_date=invoice_date 渲染日期。
    取消公户勾选 → 不反向 unsettle(避免误覆盖人工已结清状态)。
    幂等:无 changed 则不写盘(防 launchd WatchPaths 死循环)。
    返回被联动 settled 的 id8 列表(用于 cli 日志)。

    v2.5.8 性能:rows 参数允许调用方注入已 parse 好的 row 列表(避免 _refresh_dashboard 重复 parse)。

    注:老 markdown 缺 `- [ ] 公户已打款` task box 的,用一次性 migrate_sections_to_v257 升级,
    不在 propagate 里持续重写(避免每次 refresh 都触发写盘)。
    """
    path = Path(path)
    if not path.exists():
        return []
    if rows is None:
        rows = parse_ledger(path)
    # changed 与 rows 指向同一批 LedgerRow 对象(故意共享引用 — 改 changed[i] 即同步写回 rows 中的元素)
    changed = [r for r in rows if r.payer_type == "公户" and r.settled != SETTLED_OK]
    # v2.5.8:扫 markdown 检测「row.settled==OK 但 markdown 里 task box 仍是 [ ]」的漂移
    # (老 watch 写过 settled_date 后用户反勾 / Obsidian Git merge 残留 / v2.5.7 前的脏数据)
    # _parse_section 推断 settled=OK,但 markdown 里 task box 状态错位 → 重写让 task box 同步
    needs_rerender_for_settled_sync = _settled_task_drift_rows(path, rows)
    if not changed and not needs_rerender_for_settled_sync:
        return []
    # 公户联动 + settled 漂移修复 共用同一次重写
    for r in changed:
        r.settled = SETTLED_OK
        if not r.settled_date and r.invoice_date:
            r.settled_date = _format_invoice_date(r.invoice_date)
    # 整段 ledger 重写(同 auto_fill_settled_dates 思路;dashboard 留给后调用的 _refresh_dashboard 重生)
    text = path.read_text(encoding="utf-8")
    section_start = _SECTION_START_RE.search(text)
    prefix = text[:section_start.start()] if section_start else text
    body_parts = [prefix.rstrip() + "\n\n"]
    for r in rows:
        body_parts.append(_format_section(r))
        body_parts.append("\n")
    path.write_text(_renumber_sections("".join(body_parts)), encoding="utf-8")
    return [r.id8 for r in changed]


def _delete_row_from_ledger(path: Path, invoice_number: str,
                            *, id8_fallback: str = "") -> bool:
    """从 ledger 里删除 row。优先按 invoice_number 匹配,无号时按 id8_fallback 匹配。
    两个都空则拒绝(防止误删)。返回 True 当真的删了。"""
    if not path.exists():
        return False
    target_inv = (invoice_number or "").strip()
    target_id8 = (id8_fallback or "").strip()
    if not target_inv and not target_id8:
        return False
    rows = parse_ledger(path)
    def _is_target(r):
        if target_inv and (r.invoice_number or "").strip() == target_inv:
            return True
        if target_id8 and r.id8 == target_id8:
            return True
        return False
    remaining = [r for r in rows if not _is_target(r)]
    if len(remaining) == len(rows):
        return False
    text = path.read_text(encoding="utf-8")
    section_start = _SECTION_START_RE.search(text)
    prefix = text[:section_start.start()] if section_start else text
    body_parts = [prefix.rstrip() + "\n\n"]
    for r in remaining:
        body_parts.append(_format_section(r))
        body_parts.append("\n")
    path.write_text(_renumber_sections("".join(body_parts)), encoding="utf-8")
    _refresh_dashboard(path)
    return True


def update_row_file_rel(path, id8: str, *, new_file_rel: str) -> bool:
    """更新指定 row 的文件链接(file_rel)。uncarry 撞名后把源 row 指到实际落地路径
    (relocate_file 撞名加 -c{N} 后缀时),避免链接悬空指向别人的文件。
    按 id8 或 invoice_number 定位;无匹配 / 已一致 → False。"""
    path = Path(path)
    if not path.exists():
        return False
    rows = parse_ledger(path)
    target = next((r for r in rows if r.id8 == id8 or r.invoice_number == id8), None)
    if target is None or target.file_rel == new_file_rel:
        return False
    target.file_rel = new_file_rel
    text = path.read_text(encoding="utf-8")
    m = _SECTION_START_RE.search(text)
    prefix = text[:m.start()] if m else text
    body = prefix.rstrip() + "\n\n"
    for r in rows:
        body += _format_section(r) + "\n"
    path.write_text(_renumber_sections(body), encoding="utf-8")
    _refresh_dashboard(path)
    return True


def migrate_invoices_to_petty(main_ledger_root, petty_ledger_root) -> List[tuple]:
    """v2.5.8 一次性 migration:主账本里 invoice_type='invoice' row 物理迁移到备用金账本。

    - append_row 到 备用金/{月}/{人}.md(append_row 自身按 invoice_number 或 id8 dedup)
    - 从主账本里删除该 row(优先 invoice_number,fallback id8 — 防无号 row 半迁移)
    - 两边 dashboard 都刷新

    返回 (label, src_path, dst_path) 列表;label 优先用 invoice_number,空时用 id8。
    """
    main_ledger_root = Path(main_ledger_root)
    petty_ledger_root = Path(petty_ledger_root)
    moved = []
    if not main_ledger_root.exists():
        return moved
    # 先扫一遍 collect 所有要迁的(避免在迭代时改文件)
    to_migrate = []
    for month, person, lp in iter_ledger_files(str(main_ledger_root)):
        for r in parse_ledger(lp):
            if r.invoice_type == "invoice":
                to_migrate.append((month, person, lp, r))
    for month, person, lp, r in to_migrate:
        dst = ledger_path_for(month, petty_ledger_root, reimburser=person)
        added = append_row(dst, r)
        if added:
            # v2.5.8 bug fix:无 invoice_number 的 row 用 id8 兜底删除,
            # 避免 _delete_row_from_ledger("") 永远不匹配导致半迁移
            _delete_row_from_ledger(lp, r.invoice_number or "", id8_fallback=r.id8)
            moved.append((r.invoice_number or r.id8, str(lp), str(dst)))
    return moved


def migrate_sections_to_v257(path) -> bool:
    """一次性 migration:把老 markdown section 升级到 v2.5.7 格式(补 `- [ ] 公户已打款` task box)。

    parse + rerender,所有 section 走 _format_section,新格式自动出现。Dashboard 区不动(后 refresh)。
    幂等:内容没变化不写盘,可重跑。返回 True 当实际写入。
    """
    path = Path(path)
    if not path.exists():
        return False
    rows = parse_ledger(path)
    if not rows:
        return False
    text = path.read_text(encoding="utf-8")
    section_start = _SECTION_START_RE.search(text)
    if not section_start:
        return False
    prefix = text[:section_start.start()]
    # 保留 dashboard 区(放回末尾,如果存在)
    dash_match = _DASHBOARD_BLOCK_RE.search(text)
    dash_suffix = ("\n\n" + dash_match.group(0) + "\n") if dash_match else ""
    body_parts = [prefix.rstrip() + "\n\n"]
    for r in rows:
        body_parts.append(_format_section(r))
        body_parts.append("\n")
    new_text = _renumber_sections("".join(body_parts).rstrip()) + dash_suffix
    if new_text == text:
        return False
    path.write_text(new_text, encoding="utf-8")
    return True


def auto_fill_settled_dates(path, *, now_str: Optional[str] = None) -> List[str]:
    """v2.5:扫账本,找 settled=✅ 但 settled_date='' 的 row → 自动填当前时间。

    用途:watch 每 2s 跑 refresh-dashboard 时,检测到 Lynne 刚 toggle 的 task,
    自动给该 row 写入「✓ 结清:YYYY-MM-DD HH:MM」一行(精度到分钟)。

    幂等:已经有 settled_date 的不动。返回新填的 id8 列表。
    v2.5.9:文件含 git conflict markers 时直接返回 [],不在 unmerged 上重写。
    """
    import datetime as _dt
    path = Path(path)
    if not path.exists():
        return []
    if _has_conflict_markers(path.read_text(encoding="utf-8")):
        return []
    rows = parse_ledger(path)
    changed = [r for r in rows if r.settled == SETTLED_OK and not r.settled_date]
    if not changed:
        return []
    # v2.5.8:settled_date 只到日级,不带 HH:MM(用户反馈具体时间无意义)
    stamp = now_str or _dt.datetime.now().strftime("%Y-%m-%d")
    for r in changed:
        r.settled_date = stamp
    # 整段 ledger 重写(rebuild from rows)。frontmatter + intro 通过 _ensure_file 保持。
    # 先存 frontmatter / intro 区(第一个 section 之前的内容)
    text = path.read_text(encoding="utf-8")
    section_start = _SECTION_START_RE.search(text)
    prefix = text[:section_start.start()] if section_start else text
    body_parts = [prefix.rstrip() + "\n\n"]
    for r in rows:
        body_parts.append(_format_section(r))
        body_parts.append("\n")
    path.write_text(_renumber_sections("".join(body_parts)), encoding="utf-8")
    _refresh_dashboard(path)
    return [r.id8 for r in changed]


def update_row_payment_info(path, invoice_number: str, *,
                            payment_proof_link: str,
                            amount_cny: Optional[float],
                            id8_fallback: str = "") -> bool:
    """v2.5.7 Req 4:回写指定 row 的 payment_proof + amount_cny 字段。

    优先用 invoice_number 定位;v2.5.8 起接受可选 id8_fallback 兜底(防无号 invoice 找不到 row)。
    两字段任一非空就写入(允许部分更新)。
    payment_proof_link 是 markdown 链接 `[名称](/路径)`,直接拼到字段值。
    幂等:同样的输入再跑一次,内容不变不写盘。
    返回 True 当成功定位 + 实际改写,False 当 row 未找到或内容已一致。
    """
    path = Path(path)
    if not path.exists():
        return False
    rows = parse_ledger(path)
    target = None
    target_inv = (invoice_number or "").strip()
    target_id8 = (id8_fallback or "").strip()
    for r in rows:
        if target_inv and (r.invoice_number or "").strip() == target_inv:
            target = r
            break
        if (not target_inv) and target_id8 and r.id8 == target_id8:
            target = r
            break
    if target is None:
        return False
    changed = False
    if payment_proof_link and target.payment_proof != payment_proof_link:
        target.payment_proof = payment_proof_link
        changed = True
    if amount_cny is not None and target.amount_cny != amount_cny:
        target.amount_cny = amount_cny
        changed = True
    if not changed:
        return False
    # 整段 ledger 重写
    text = path.read_text(encoding="utf-8")
    section_start = _SECTION_START_RE.search(text)
    prefix = text[:section_start.start()] if section_start else text
    body_parts = [prefix.rstrip() + "\n\n"]
    for r in rows:
        body_parts.append(_format_section(r))
        body_parts.append("\n")
    path.write_text(_renumber_sections("".join(body_parts)), encoding="utf-8")
    _refresh_dashboard(path)
    return True


def update_row_note(path, id8: str, *, note: str) -> bool:
    """重写指定 row 的 note(blockquote 行)。
    v2.5.1:`id8` 参数语义扩展 — 接受 id8(老 markdown)或 invoice_number(新格式)。
    没有 blockquote 时新增一行;有时替换;note 为空时移除。
    返回 True if updated,False if section not found。
    """
    path = Path(path)
    if not path.exists():
        return False
    text = path.read_text(encoding="utf-8")
    sections = _iter_sections(text)
    if not sections:
        return False
    first_idx = _SECTION_START_RE.search(text).start()
    prefix = text[:first_idx]

    updated_sections = []
    found = False
    for sec in sections:
        # 兼容 3 套 PK:
        # 1) 老 v2.4 inline id8 `` ### `xxx` description ``
        # 2) v2.5 HTML 注释 `<!-- id8: xxx -->`
        # 3) v2.5.1 新格式无 id8 注释,扫发票号 `发票号:\`X\``
        sec_keys = set()
        legacy_m = _LEGACY_INLINE_ID8_RE.match(sec)
        if legacy_m:
            sec_keys.add(legacy_m.group(1))
        id8_m = _ID8_COMMENT_RE.search(sec)
        if id8_m:
            sec_keys.add(id8_m.group(1))
        inv_m = _INVOICE_NO_RE.search(sec)
        if inv_m:
            inv = inv_m.group(1).strip()
            if inv and inv != "(无)":
                sec_keys.add(inv)
        # 完全匹配 / 子串匹配(老测试 / cli 短码场景):任一 sec_key 含 id8 视为命中
        if id8 not in sec_keys and not any(id8 and id8 in k for k in sec_keys):
            updated_sections.append(sec)
            continue
        found = True
        # v2.5.9:删整块 multiline blockquote(而非单行)。Lynne 之前可能加过 `> 第二行`,
        # 此次重写视作一次完整替换:把已有 blockquote 块整体抹掉,再追加新 note 块。
        new_sec = _NOTE_BLOCK_RE.sub("", sec)
        # 清理因移除 note 留下的多余空行
        new_sec = re.sub(r"\n{3,}", "\n\n", new_sec)
        if note:
            quoted = "\n".join(f"> {ln}" if ln else ">" for ln in note.split("\n"))
            new_sec = new_sec.rstrip() + f"\n\n{quoted}\n\n"
        else:
            new_sec = new_sec.rstrip() + "\n\n"
        updated_sections.append(new_sec)

    if not found:
        return False
    path.write_text(_renumber_sections(prefix + "".join(updated_sections)), encoding="utf-8")
    _refresh_dashboard(path)
    return True
