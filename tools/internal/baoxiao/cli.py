#!/usr/bin/env python3
"""报销自动化 CLI(v2:邮箱拉 → 归档 → wiki 账本)。

子命令:
  list-inbox  --inbox DIR
      列出 _inbox/{报销人}/ 下待处理文件(JSON)。claude-cowork:我据此逐个读发票。
  plan        --inbox DIR (--fields-file F | --provider gpt)
      干跑预览:提取 + 分类 + 算命名,**不归档、不写账本、不删 inbox**。
  ingest      --inbox DIR (--fields-file F | --provider gpt) [--archive-root D] [--ledger-root D]
      真跑:归档(git 发票/)+ 写 wiki 账本;成功才删 inbox。整条受锁保护。
      默认 archive-root = 仓库根 发票/;默认 ledger-root =
      docs/05-governance/finance-payments/报销/。

提取两条路:
  --fields-file F : claude-cowork。我(Claude)读发票 PDF/PNG 出字段 JSON,形如
                    {
                      "<绝对路径>": {
                        "invoice_date":   "20260526",   # 开票日期 YYYYMMDD(若只到月就 YYYYMM01)
                        "amount":         88.00,
                        "currency":       "CNY",
                        "invoice_number": "26442000005841403156",
                        "category_hint":  "餐饮 员工",     # 给 classify 提示词
                        "description":    "仟佳食品 餐饮 员工",  # H3 标题用
                        "confidence":     0.95,
                        # —— v2.5.6 起,以下字段从发票上肉眼可见的文字抓 ——
                        "invoice_type":   "普票",         # 见下表
                        "billed_to":      "广州进格智能科技有限公司",  # 购买方/Bill to
                        "is_receipt":     false           # 「Receipt #」/「Paid」/「付款收据」→ true,不入账
                      }
                    }

                    invoice_type 取值规则(直接抓发票上印的字):
                      - 发票主标题含「电子发票(普通发票)」/「增值税普通发票」 → "普票"
                      - 发票主标题含「电子发票(专用发票)」/「增值税专用发票」 → "专票"
                      - 海外 invoice(英文 Invoice / Bill to 格式,非中国增值税)→ "invoice"
                      - 抓不准 → "" 让 Lynne 在 Obsidian 手动改

                    不需要任何 LLM API key。
  --provider gpt  : 运行时调 OpenAI 视觉(需 .env 里 OPENAI_API_KEY)。可无人值守。
"""

import argparse
import datetime
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import classify  # noqa: E402
import config  # noqa: E402
import extract  # noqa: E402
import identity  # noqa: E402
import ledger  # noqa: E402
import mailbox  # noqa: E402
import naming  # noqa: E402
import payment_extract  # noqa: E402
import summary  # noqa: E402
import sync  # noqa: E402
import transfer  # noqa: E402
from lock import FileLock  # noqa: E402

HERE = Path(__file__).resolve().parent
WIKI_ROOT = HERE.parents[2]
DEFAULT_INBOX = HERE / "_inbox"
# v2.5.9:全局单锁。所有写账本 / 改 inbox 的命令(ingest / fetch-mail / refresh-dashboard)
# 都竞争这把锁,launchd 高频 watch 与人工 ingest 不会同时改同一份 ledger 文件。
# 路径固定 HERE 下,不受 inbox 自定义影响;旧 inbox.parent 推算只在默认场景巧合一致。
BAOXIAO_LOCK_PATH = HERE / "baoxiao.lock"
DEFAULT_ENV = "~/.config/gengrowth-baoxiao/.env"
CATEGORY_MAP = HERE / "config" / "category-map.yaml"
FINANCE_ROOT = WIKI_ROOT / "docs" / "05-governance" / "finance-payments"
DEFAULT_ARCHIVE_ROOT = FINANCE_ROOT / "发票"               # 国内增值税票(普票+专票)
DEFAULT_OVERSEAS_INVOICE_ROOT = FINANCE_ROOT / "invoice"    # v2.5.7:海外 invoice 单独归档
DEFAULT_PETTY_LEDGER_ROOT = FINANCE_ROOT / "备用金"         # v2.5.7:备用金账本(独立账本,记付款证明 + 人民币金额)
DEFAULT_LEDGER_ROOT = FINANCE_ROOT / "报销"
DEFAULT_DROP_ROOT = FINANCE_ROOT / "_drop"
DEFAULT_STATE_FILE = HERE / "logs" / "last_fetch.txt"
DEFAULT_SUBJECT_KEYWORDS = ["发票", "invoice", "receipt", "reimburs", "电子发票"]


def _build_extractor(args):
    if args.fields_file:
        mapping = json.loads(Path(args.fields_file).expanduser().read_text(encoding="utf-8"))
        # v2.5.8:fields-file 没覆盖的文件 → raise 让 sync._process_one 标 error,
        # 留 _inbox 不入账。防止静默用空 fields 入账成「(无描述) ¥0」幽灵 row。
        def _extract(p):
            fields = mapping.get(str(p))
            if fields is None:
                raise RuntimeError(f"fields-file 未覆盖此文件: {p}")
            return extract.parse_extraction(fields)
        return _extract
    if args.provider == "gpt":
        env = config.load_env(args.env)
        return extract.gpt_extractor(config.require(env, "OPENAI_API_KEY"))
    raise SystemExit("需要 --fields-file(cowork)或 --provider gpt")


def cmd_list_inbox(args):
    items = [{"reimburser": r, "path": str(p)}
             for r, p in sync.iter_inbox_files(Path(args.inbox).expanduser())]
    print(json.dumps(items, ensure_ascii=False, indent=2))


def cmd_plan(args):
    rules = classify.load_rules(CATEGORY_MAP)
    plans = sync.plan_inbox(Path(args.inbox).expanduser(),
                            extractor=_build_extractor(args), rules=rules)
    print(json.dumps(plans, ensure_ascii=False, indent=2))


REIMBURSERS_YAML = HERE / "config" / "reimbursers.yaml"


def _collect_gmail_accounts(env):
    """从 .env 收集 Gmail 账户:GMAIL_USER + GMAIL_APP_PASSWORD(主),
    + GMAIL_USER_2 / GMAIL_USER_3 ... 任意编号(扩展)。
    每个账户的 reimburser:.env 里 GMAIL_REIMBURSER[_N] 覆盖;否则从 reimbursers.yaml
    的 email_to_name 查;最后 fallback args.reimburser 或 'Lynne'。"""
    accounts = []
    reimb_map = (config.load_yaml(REIMBURSERS_YAML) or {}).get("email_to_name", {})

    def _resolve_reimburser(user, env_override):
        return env_override or reimb_map.get(user) or "Lynne"

    main_user = env.get("GMAIL_USER")
    main_pw = env.get("GMAIL_APP_PASSWORD")
    if main_user and main_pw:
        accounts.append((main_user, main_pw, _resolve_reimburser(main_user, env.get("GMAIL_REIMBURSER"))))

    # 兼容两种命名:GMAIL_USER_2 / GMAIL_USER2(下划线可选)
    i = 2
    while True:
        u = env.get(f"GMAIL_USER_{i}") or env.get(f"GMAIL_USER{i}")
        p = env.get(f"GMAIL_APP_PASSWORD_{i}") or env.get(f"GMAIL_APP_PASSWORD{i}")
        if not u or not p:
            break
        r = _resolve_reimburser(
            u,
            env.get(f"GMAIL_REIMBURSER_{i}") or env.get(f"GMAIL_REIMBURSER{i}"),
        )
        accounts.append((u, p, r))
        i += 1
    return accounts


def _fetch_one_account(*, user, password, reimb, host, port,
                       inbox, state_dir, keywords, mode="window", since_days=30):
    """v2.5.7:单账号 fetch,供并行线程调用。返回 (user, reimb, n_saved, n_total, lines, error)。
    lines = 输出行 list(由调用方汇总后串行 print,避免多线程交错)。
    v2.5.8:默认 mode='window' since_days=30,防漏 fetch(替代增量 UID 单向推进)。
    """
    safe_user = user.replace("@", "_at_").replace(".", "_")
    state_file = state_dir / f"last_fetch-{safe_user}.txt"
    lines = [f"=== {user} → _inbox/{reimb}/ (mode={mode}, since={since_days}d) ==="]
    try:
        results, latest = mailbox.fetch_to_inbox(
            user=user, password=password, host=host, port=port,
            inbox_dir=inbox, state_file=state_file,
            reimburser_subdir=reimb, subject_keywords=keywords,
            mode=mode, since_days=since_days,
        )
    except Exception as e:  # noqa: BLE001
        lines.append(f"  [ERROR] {type(e).__name__}: {e}")
        return (user, reimb, 0, 0, lines, e)
    for r in results:
        if r.saved:
            for p in r.saved_paths:
                lines.append(f"  [saved] {p.name}  ← \"{r.subject}\"")
        else:
            lines.append(f"  [skip ] {r.skipped_reason}  ← \"{r.subject}\"")
    n_saved = sum(1 for r in results if r.saved)
    lines.append(f"  --- {n_saved}/{len(results)} 邮件附件保存,latest UID={latest} ---")
    return (user, reimb, n_saved, len(results), lines, None)


def cmd_fetch_mail(args):
    import concurrent.futures
    env = config.load_env(args.env)
    accounts = _collect_gmail_accounts(env)
    if not accounts:
        raise SystemExit("没找到 GMAIL_USER + GMAIL_APP_PASSWORD")

    host = env.get("GMAIL_HOST", mailbox.GMAIL_HOST)
    port = int(env.get("GMAIL_PORT", mailbox.GMAIL_PORT))
    keywords = None
    if args.filter_subject:
        raw = env.get("GMAIL_SUBJECT_KEYWORDS")
        keywords = [k.strip() for k in raw.split(",")] if raw else DEFAULT_SUBJECT_KEYWORDS

    inbox = Path(args.inbox).expanduser()
    state_dir = (HERE / "logs")
    lock_path = BAOXIAO_LOCK_PATH

    # v2.5.7:并行跑每个账号(IO 密集,thread 就够;每账号独立 IMAP 连接 + 独立 state file)。
    # 锁保护避免与 ingest / monthly-close 撞;并发账号之间无共享写入。
    total_saved = 0
    total_mails = 0
    saved_paths_by_reimb = {}   # reimb → [Path, ...]
    with FileLock(lock_path):
        with concurrent.futures.ThreadPoolExecutor(max_workers=len(accounts)) as ex:
            futures = [
                ex.submit(_fetch_one_account,
                          user=u, password=p, reimb=r,
                          host=host, port=port,
                          inbox=inbox, state_dir=state_dir, keywords=keywords,
                          mode=getattr(args, "mode", "window"),
                          since_days=getattr(args, "since_days", 30))
                for (u, p, r) in accounts
            ]
            for fut in concurrent.futures.as_completed(futures):
                user, reimb, n_saved, n_total, lines, err = fut.result()
                for ln in lines:
                    print(ln)
                total_saved += n_saved
                total_mails += n_total
                # 收集落到 _inbox 的新文件路径
                target_dir = inbox / reimb
                if target_dir.exists():
                    saved_paths_by_reimb.setdefault(reimb, []).extend(
                        sorted(p for p in target_dir.iterdir()
                               if p.is_file() and not p.name.startswith("."))
                    )
    print(f"\n*** 总计:{total_saved}/{total_mails} 跨 {len(accounts)} 个账户 ***")

    # v2.5.7:生成 pending-ingest.json — Claude / cowork 读这个清单逐张读 PDF 出 fields,
    # 然后 cli.py ingest --fields-file 即可入账。无新文件时不写。
    pending = {}
    for reimb, paths in saved_paths_by_reimb.items():
        if paths:
            pending[reimb] = [str(p) for p in paths]
    if pending:
        pending_file = HERE / "logs" / "pending-ingest.json"
        pending_file.write_text(json.dumps(pending, ensure_ascii=False, indent=2),
                                encoding="utf-8")
        n = sum(len(v) for v in pending.values())
        print(f"\n📋 pending-ingest.json 已写:{n} 张待 ingest")
        print(f"   → 路径:{pending_file}")
        print(f"   → 下一步:让 Claude 读这些 PDF 出 fields JSON,然后跑")
        print(f"     `python3 cli.py ingest --fields-file <fields.json>`")
    else:
        print("\n📋 无新文件,跳过 pending-ingest.json")


def cmd_ingest(args):
    rules = classify.load_rules(CATEGORY_MAP)
    extractor = _build_extractor(args)
    submit_ts_ms = int(datetime.datetime.now().timestamp() * 1000)
    inbox = Path(args.inbox).expanduser()
    archive_root = Path(args.archive_root).expanduser() if args.archive_root else DEFAULT_ARCHIVE_ROOT
    overseas_root = (Path(args.overseas_archive_root).expanduser()
                     if getattr(args, "overseas_archive_root", None)
                     else DEFAULT_OVERSEAS_INVOICE_ROOT)
    ledger_root = Path(args.ledger_root).expanduser() if args.ledger_root else DEFAULT_LEDGER_ROOT
    petty_root = (Path(args.petty_ledger_root).expanduser()
                  if getattr(args, "petty_ledger_root", None)
                  else DEFAULT_PETTY_LEDGER_ROOT)
    lock_path = BAOXIAO_LOCK_PATH
    with FileLock(lock_path):
        outcomes = sync.process_inbox(
            inbox, archive_root=archive_root, ledger_root=ledger_root,
            wiki_root=WIKI_ROOT,
            extractor=extractor, rules=rules, submit_ts_ms=submit_ts_ms,
            overseas_archive_root=overseas_root,
            petty_ledger_root=petty_root,
        )
    for o in outcomes:
        print(f"[{o.status}] {o.reimburser or '?'} {Path(o.path).name} {o.action or ''} {o.detail}".rstrip())
    n_ok = sum(1 for o in outcomes if o.status == "synced")
    print(f"--- {n_ok}/{len(outcomes)} synced ---")
    # v2.5.8:invoice 已直接写到备用金账本,无需 view 投影刷新


_KNOWN_CATEGORIES = {
    "差旅费", "交通费", "业务招待费", "商务送礼",
    "福利费", "研发费用", "办公费", "营销", "其他费用",
}
_KNOWN_CURRENCIES = {"CNY", "USD", "HKD", "EUR", "GBP", "JPY"}


def _canonical_filename_for(row, wiki_root: Path):
    """算 row 应该叫什么文件名。**返回 None 表示拒绝 rename**(防御失败)。
    防御原则:任一字段不合规、新名不含完整 category 中文(encoding 失败)、
    新名含路径分隔符 → 拒绝,留旧名(不动)。"""
    # 防御 1:基础字段校验
    if not row.file_rel or not row.period:
        return None
    if row.category not in _KNOWN_CATEGORIES:
        return None
    if row.currency not in _KNOWN_CURRENCIES:
        return None
    if not row.amount or row.amount <= 0:
        return None
    if not re.fullmatch(r"\d{6}", row.period):
        return None

    old_abs = wiki_root / row.file_rel
    ext = old_abs.suffix.lstrip(".") or "bin"
    target_dir = old_abs.parent
    base = naming.build_filename(row.period, row.category, row.currency, row.amount, ext)

    # 防御 2:新名必须含完整 category 字符串(防 launchd LANG 没设把中文丢成 ASCII 碎片)
    if row.category not in base:
        return None
    # 防御 3:新名不能含路径分隔符或控制字符
    if "/" in base or "\\" in base or "\x00" in base or len(base) > 200:
        return None

    target = target_dir / base
    if target.exists() and target != old_abs:
        key = identity.normalize_invoice_key(row.invoice_number)
        suffix = key[-4:] if key else row.id8[:4]
        base = naming.build_filename(row.period, row.category, row.currency, row.amount,
                                      ext, suffix=suffix)
        if row.category not in base:
            return None
    return (target_dir / base).relative_to(wiki_root).as_posix()


def _sync_filenames(ledger_path: Path, wiki_root: Path):
    """扫账本每 row,**通过容错检查的**才 rename + 更新账本里的 file link。
    拒绝条件见 _canonical_filename_for(category 不合法 / 中文丢字符 / 路径非法)。
    v2.5.9:含 git conflict markers 时 no-op,避免把 markers 跟着 file-link 替换吞掉。"""
    text = ledger_path.read_text(encoding="utf-8")
    if ledger._has_conflict_markers(text):
        return 0
    rows = ledger.parse_ledger(ledger_path)
    renames = []
    for r in rows:
        new_rel = _canonical_filename_for(r, wiki_root)
        if new_rel is None or new_rel == r.file_rel:
            continue                                    # 防御失败 / 已一致,跳过
        old_abs = wiki_root / r.file_rel
        new_abs = wiki_root / new_rel
        if not old_abs.exists() or (new_abs.exists() and new_abs != old_abs):
            continue
        try:
            old_abs.rename(new_abs)
        except OSError as e:
            print(f"rename failed {old_abs.name} → {new_abs.name}: {e}", file=sys.stderr)
            continue
        renames.append((r.file_rel, new_rel))
    if not renames:
        return 0
    for old_rel, new_rel in renames:
        old_name = Path(old_rel).name
        new_name = Path(new_rel).name
        text = text.replace(f"[{old_name}](/{old_rel})", f"[{new_name}](/{new_rel})")
    ledger_path.write_text(text, encoding="utf-8")
    return len(renames)


def cmd_refresh_dashboard(args):
    """重生 dashboard + 同步文件名(category 改了 → 自动 rename 文件)。

    watch 触发 → refresh-dashboard → 检查每行的文件名是否和 category 一致,
    不一致就 rename + 更新账本 link。**幂等**:再跑一次内容不变就不写盘,不撞 launchd 死循环。

    v2.5.9 加锁:与 ingest / fetch-mail 共享 BAOXIAO_LOCK_PATH。锁被占用时静默退出,
    launchd 2s 后下个 tick 再来,不堆积、不报错。防 ingest 改 ledger 与 watch
    重写发生 read-modify-write 覆盖。
    """
    lock = FileLock(BAOXIAO_LOCK_PATH)
    if not lock.acquire():
        return  # 锁忙:ingest / fetch 正在跑 → 下个 tick 再刷,launchd 高频自愈
    try:
        return _do_refresh_dashboard(args)
    finally:
        lock.release()


def _do_refresh_dashboard(args):
    ledger_root = Path(args.ledger_root).expanduser() if args.ledger_root else DEFAULT_LEDGER_ROOT
    # v2.4:账本结构 {root}/{YYYY-MM}/{reimburser}.md。`--month` 限定某月,否则刷所有月。
    if args.month:
        month_dirs = [ledger_root / args.month]
    else:
        month_dirs = sorted([p for p in ledger_root.iterdir() if p.is_dir()] if ledger_root.exists() else [])
    targets = []
    for md_dir in month_dirs:
        if not md_dir.exists():
            continue
        for p in sorted(md_dir.glob("*.md")):
            if p.stem.endswith("-summary"):
                continue
            targets.append(p)
    total_ren = 0
    total_filled = 0
    n_changed = 0
    for p in targets:
        # v2.5:先自动填 settled_date(Lynne 刚 toggle [x] 的 row),再 refresh dashboard
        filled = ledger.auto_fill_settled_dates(p)
        ren = _sync_filenames(p, WIKI_ROOT)
        dashboard_changed = ledger.refresh_dashboard(p)
        rel = p.relative_to(ledger_root).as_posix()
        if ren or dashboard_changed or filled:
            n_changed += 1
            tags = []
            if ren:
                tags.append(f"renamed {ren} file{'s' if ren > 1 else ''}")
            if filled:
                tags.append(f"filled settled_date×{len(filled)}")
            tag = f" ({'; '.join(tags)})" if tags else ""
            print(f"refreshed: {rel}{tag}")
        total_ren += ren
        total_filled += len(filled)
    # v2.5:总表也跟着刷(幂等,内容不变不写盘)
    total_changed = summary.write_total(ledger_root)
    # v2.5.8:同时刷备用金账本(now first-class,直接 refresh 而不是 view 投影)
    petty_changed = 0
    petty_root = DEFAULT_PETTY_LEDGER_ROOT
    if petty_root.exists():
        petty_targets = []
        if args.month:
            md_dir = petty_root / args.month
            if md_dir.exists():
                petty_targets = sorted(md_dir.glob("*.md"))
        else:
            for md_dir in sorted([p for p in petty_root.iterdir() if p.is_dir()]):
                petty_targets.extend(sorted(md_dir.glob("*.md")))
        for p in petty_targets:
            if p.stem.endswith("-summary"):
                continue
            ledger.auto_fill_settled_dates(p)
            if ledger.refresh_dashboard(p):
                petty_changed += 1
    if n_changed or total_ren or total_filled or total_changed or petty_changed:
        msg = f"--- {n_changed} 个主账本变更,共 rename {total_ren} 个文件,填 settled_date {total_filled} 行"
        if total_changed:
            msg += ",总表已刷新"
        if petty_changed:
            msg += f",备用金账本刷新 {petty_changed} 份"
        print(msg + " ---")


def cmd_audit_mail(args):
    """v2.5.8 阶段 C:扫 IMAP 最近 N 天的邮件 vs 主账本 + 备用金账本 invoice_number,
    输出可能漏 fetch / 漏 ingest 的清单(不实际操作 inbox)。

    退出码:0=无漏,1=有疑似漏的(适合 launchd 调度时根据 exit code 报警)。
    """
    import email as _email
    import imaplib as _imap
    import ssl as _ssl
    env = config.load_env(args.env)
    days = args.since_days
    accounts = _collect_gmail_accounts(env)
    if not accounts:
        raise SystemExit("无 GMAIL 账号配置")

    # 收集已 ingest 的 invoice_number
    ingested = set()
    ledger_root = DEFAULT_LEDGER_ROOT
    petty_root = DEFAULT_PETTY_LEDGER_ROOT
    for root in [ledger_root, petty_root]:
        if root.exists():
            for _m, _p, lp in ledger.iter_ledger_files(str(root)):
                for r in ledger.parse_ledger(lp):
                    if r.invoice_number:
                        ingested.add(r.invoice_number.strip())
    print(f"已 ingest invoice_number: {len(ingested)} 张")

    PDF_OR_IMAGE = mailbox.PDF_OR_IMAGE
    since_str = (datetime.date.today() - datetime.timedelta(days=days)).strftime("%d-%b-%Y")
    total_missed = 0

    total_fetch_errors = 0
    for user, password, reimb in accounts:
        print(f"\n=== {user} → {reimb} (近 {days} 天) ===")
        ctx = _ssl.create_default_context()
        M = None
        try:
            M = _imap.IMAP4_SSL("imap.gmail.com", 993, ssl_context=ctx, timeout=30)
            M.login(user, password)
            sel_typ, sel_data = M.select("INBOX", readonly=True)
            if sel_typ != "OK":
                # SELECT 失败时不能继续 — 否则 SEARCH/FETCH 全空,误报「0 漏」
                raise RuntimeError(f"IMAP SELECT 失败: {sel_typ} {sel_data!r}")
            typ, data = M.uid("SEARCH", f"SINCE {since_str}")
            if typ != "OK":
                # SEARCH 失败也不能继续 — 否则 uids=[] 同样误报「0 漏」
                raise RuntimeError(f"IMAP SEARCH 失败: {typ} {data!r}")
            uids = data[0].split() if data and data[0] else []
            print(f"  IMAP 共 {len(uids)} 封邮件")
            missed = []
            fetch_errors = []   # [(uid, reason_str)]
            for uid_b in uids:
                uid = int(uid_b)
                try:
                    typ, data = M.uid("FETCH", str(uid), "(RFC822)")
                    if typ != "OK" or not data or not data[0]:
                        # IMAP NO / BAD / 空 payload 都算 fetch 失败,
                        # 不能 silent continue — 那就是漏报的源头
                        fetch_errors.append((uid, f"FETCH_{typ}_empty"))
                        continue
                    raw = data[0][1] if isinstance(data[0], tuple) else data[0]
                    msg = _email.message_from_bytes(raw)
                    subj = mailbox._decode_header(msg.get("Subject", ""))
                    sender = mailbox._decode_header(msg.get("From", ""))
                    # 列附件名
                    fns = []
                    for part in msg.walk():
                        fn = mailbox._attachment_filename(part)
                        if fn:
                            fns.append(fn)
                    has_wl_attach = any(any(fn.lower().endswith(ext) for ext in PDF_OR_IMAGE) for fn in fns)
                    # 链接式发票
                    urls = mailbox._extract_invoice_urls(msg)
                    # 查 ingest 命中
                    msg_text = subj + " " + " ".join(fns) + " " + " ".join(urls)
                    matched = next((inv for inv in ingested if inv in msg_text), None)
                    if matched:
                        continue
                    if not has_wl_attach and not urls:
                        continue
                    missed.append({"uid": uid, "subj": subj, "from": sender,
                                  "fns": fns, "urls": urls})
                except Exception as fe:    # noqa: BLE001
                    fetch_errors.append((uid, type(fe).__name__))
                    continue
            for m in missed:
                print(f"  🚨 UID {m['uid']} {m['subj'][:50]}")
                print(f"     from: {m['from'][:60]}")
                if m['fns']:
                    print(f"     附件: {m['fns']}")
                if m['urls']:
                    # 截断 query string,避免把 signed token 打到终端/日志
                    safe_urls = [_redact_url_query(u) for u in m['urls'][:2]]
                    print(f"     链接: {safe_urls}")
            print(f"  → 嫌疑漏:{len(missed)} 封")
            if fetch_errors:
                # 单 UID FETCH 失败被吞会让审计变成「全 clear」假象,显式上报
                print(f"  ⚠ UID FETCH 失败 {len(fetch_errors)} 个: {fetch_errors[:5]}{'...' if len(fetch_errors) > 5 else ''}")
                total_fetch_errors += len(fetch_errors)
            total_missed += len(missed)
        except Exception as e:    # noqa: BLE001
            print(f"  [ERROR] {type(e).__name__}: {e}")
            total_fetch_errors += 1
        finally:
            if M is not None:
                try:
                    M.close()
                except Exception:    # noqa: BLE001
                    pass
                try:
                    M.logout()
                except Exception:    # noqa: BLE001
                    pass
    print(f"\n=== 总计嫌疑漏 fetch/ingest:{total_missed} 封 (FETCH 错误 {total_fetch_errors}) ===")
    # FETCH 错误也算审计未 clear — 静默吞错误就是漏报
    sys.exit(0 if total_missed == 0 and total_fetch_errors == 0 else 1)


def cmd_process_payments(args):
    """v2.5.7 Req 4:扫 _drop/{人}/payments/ 截图 → 识别 → 关联 invoice → 归档 + 回写主账本。

    提取两条路:
      --fields-file F : claude-cowork(Claude 读截图出字段 JSON,无需 API key)
      --provider gpt  : 运行时调 OpenAI 视觉(需 OPENAI_API_KEY)
    """
    extractor = _build_payment_extractor(args)
    ledger_root = Path(args.ledger_root).expanduser() if args.ledger_root else DEFAULT_LEDGER_ROOT
    petty_root = (Path(args.petty_ledger_root).expanduser()
                  if getattr(args, "petty_ledger_root", None)
                  else DEFAULT_PETTY_LEDGER_ROOT)
    payments_root = Path(args.payments_root).expanduser() if args.payments_root else DEFAULT_DROP_ROOT
    outcomes = sync.process_payments_drop(
        payments_root, ledger_root=ledger_root, wiki_root=WIKI_ROOT,
        extractor=extractor, petty_ledger_root=petty_root,
    )
    for o in outcomes:
        line = f"[{o.status}] {o.reimburser} {Path(o.src).name}"
        if o.invoice_number:
            line += f" → {o.invoice_number}"
        if o.target_path:
            line += f" → {o.target_path.name}"
        if o.detail:
            line += f" — {o.detail}"
        print(line)
    n_ok = sum(1 for o in outcomes if o.status == "synced")
    # v2.5.8:update_row_payment_info 在备用金账本里改了 row,refresh_dashboard 已在那
    # 函数末尾被调用,无需在此再刷
    print(f"--- {n_ok}/{len(outcomes)} payments synced ---")


def _build_payment_extractor(args):
    if args.fields_file:
        mapping = json.loads(Path(args.fields_file).expanduser().read_text(encoding="utf-8"))
        def _extract(p):
            # v2.5.8:与 _build_extractor 一致 — fields-file 没覆盖此截图就显式失败,
            # 防"空 dict → 空字段 → 静默生成幽灵 row"(同 ghost-row bug)。
            fields = mapping.get(str(p))
            if fields is None:
                raise RuntimeError(f"--fields-file 未覆盖 {p}")
            return payment_extract.parse_payment_extraction(fields)
        return _extract
    if args.provider == "gpt":
        env = config.load_env(args.env)
        return payment_extract.gpt_payment_extractor(config.require(env, "OPENAI_API_KEY"))
    raise SystemExit("需要 --fields-file(cowork)或 --provider gpt")


def _redact_url_query(url: str) -> str:
    """终端/日志打 URL 时截断 query — 商家发票直链常用 signed query token,
    打到 shared terminal/log 会泄漏短期 access credential。"""
    q = url.find("?")
    if q < 0:
        return url
    return url[:q] + "?…"


def cmd_migrate_invoices_to_petty(args):
    """v2.5.8 一次性 migration:把主账本里 invoice 类型 row 物理迁移到备用金账本。

    - 主账本 row 写到备用金账本(append_row,自动 dedup by invoice_number)
    - 从主账本里删除该 row
    - 配套刷新两边 dashboard
    """
    ledger_root = Path(args.ledger_root).expanduser() if args.ledger_root else DEFAULT_LEDGER_ROOT
    petty_root = Path(args.petty_root).expanduser() if args.petty_root else DEFAULT_PETTY_LEDGER_ROOT
    moved = ledger.migrate_invoices_to_petty(ledger_root, petty_root)
    if not moved:
        print("--- 无 invoice row 需要迁移 ---")
        return
    print(f"--- 迁移 {len(moved)} 张 invoice row 到备用金账本 ---")
    for inv_no, src, dst in moved:
        print(f"   {inv_no}:{src} → {dst}")


def cmd_drop_scan(args):
    """v2.5 F:扫 wiki 投递区 `docs/.../finance-payments/_drop/{reimburser}/*`,
    搬到本机 `_inbox/{reimburser}/` 等 cowork ingest。

    - 投递区 git 同步(Lynne 在 Pro 投递 → push → Mac Mini pull → 这里检测 → 搬到 _inbox)
    - 搬完不删 _drop 原文件,而是 mv 到 _drop/.processed/(用户后续手动清)
    - 不自动 ingest;cowork 模式下等人/Claude 读 PDF 出 fields JSON 再跑 ingest
    """
    drop_root = Path(args.drop_root).expanduser() if args.drop_root else DEFAULT_DROP_ROOT
    inbox = Path(args.inbox).expanduser()
    if not drop_root.exists():
        print(f"投递区不存在:{drop_root}")
        return
    n_moved = 0
    for reimb_dir in sorted(drop_root.iterdir()):
        if not reimb_dir.is_dir() or reimb_dir.name.startswith("."):
            continue
        reimb = reimb_dir.name
        target_inbox = inbox / reimb
        target_inbox.mkdir(parents=True, exist_ok=True)
        processed = reimb_dir / ".processed"
        processed.mkdir(exist_ok=True)
        for src in sorted(reimb_dir.iterdir()):
            if src.is_dir() or src.name.startswith(".") or src.name.endswith(".gitkeep"):
                continue
            dst = target_inbox / src.name
            if dst.exists():
                print(f"  ⚠️ {dst} 已存在,skip")
                continue
            import shutil as _sh
            _sh.copy2(str(src), str(dst))
            _sh.move(str(src), str(processed / src.name))
            print(f"  📥 {reimb}/{src.name} → _inbox/{reimb}/")
            n_moved += 1
    print(f"--- {n_moved} 个文件从 _drop 搬到 _inbox(等 cowork ingest)---")


def cmd_audit_near_dups(args):
    """v2.5.9 Day 4:扫主+备用金账本,列出 Hamming 距离 ≤ N 的发票号对(疑似 OCR 错读双胞胎)。

    输出 markdown 报告(stdout),供 Lynne 人工裁决。不修改任何账本 — pure audit。
    本次事故 `...22554` vs `...22558` 是 Hamming=1,扫一遍能把存量里类似情况都钓上来。
    """
    ledger_root = Path(args.ledger_root).expanduser() if args.ledger_root else DEFAULT_LEDGER_ROOT
    petty_root = (Path(args.petty_ledger_root).expanduser()
                  if args.petty_ledger_root else DEFAULT_PETTY_LEDGER_ROOT)
    max_distance = args.max_distance
    roots = [ledger_root]
    if petty_root.exists():
        roots.append(petty_root)
    # 收所有 (path, row) — 每张账本只 parse 一次,O(n²) 比较
    all_rows = []
    for root in roots:
        for _m, _r, lp in ledger.iter_ledger_files(root):
            for r in ledger.parse_ledger(lp):
                inv = (r.invoice_number or "").strip()
                if inv and inv not in ("(无)",):
                    all_rows.append((lp, r))
    pairs = []
    seen = set()
    for i, (p1, r1) in enumerate(all_rows):
        for p2, r2 in all_rows[i+1:]:
            hd = ledger.hamming_distance(r1.invoice_number.strip(),
                                         r2.invoice_number.strip())
            if 1 <= hd <= max_distance:
                # seen key 带 path,同号码对出现在多个账本/月份时每处都报告
                key = (tuple(sorted([r1.invoice_number.strip(),
                                     r2.invoice_number.strip()])),
                       tuple(sorted([str(p1), str(p2)])))
                if key in seen:
                    continue
                seen.add(key)
                pairs.append((hd, p1, r1, p2, r2))
    pairs.sort(key=lambda x: x[0])
    if not pairs:
        print(f"✅ 扫 {len(all_rows)} row,无 Hamming ≤ {max_distance} 近似号码对")
        return
    print(f"# 发票号近似审计 (Hamming ≤ {max_distance})\n")
    print(f"共 **{len(pairs)}** 对疑似重复,扫了 {len(all_rows)} row。\n")
    print(f"> 🛡 列标注 sync ingest 防线对每对的处置:"
          f"`flag` 写入但 needs_review + ⚠️ note / `pass` 不触发(批次连号 false-positive)。\n")
    n_flag, n_pass = 0, 0
    for hd, p1, r1, p2, r2 in pairs:
        decision, reason = _sync_decision_for_pair(r1, r2, hd)
        if decision == "flag":
            n_flag += 1
        else:
            n_pass += 1
        badge = {"flag": "⚠️ sync: **flag review**",
                 "pass": "✅ sync: pass"}[decision]
        settled_a = "✅" if r1.settled == ledger.SETTLED_OK else "⬜"
        settled_b = "✅" if r2.settled == ledger.SETTLED_OK else "⬜"
        print(f"## Hamming={hd} · {r1.invoice_number} ↔ {r2.invoice_number}\n")
        print(f"{badge} — {reason}\n")
        print(f"- {settled_a} `{r1.invoice_number}` {r1.currency}{r1.amount} "
              f"`{r1.description}` — {p1.relative_to(p1.parents[2]) if len(p1.parents) >= 3 else p1.name}")
        print(f"- {settled_b} `{r2.invoice_number}` {r2.currency}{r2.amount} "
              f"`{r2.description}` — {p2.relative_to(p2.parents[2]) if len(p2.parents) >= 3 else p2.name}")
        print()
    print(f"---\n**汇总**:⚠️ flag {n_flag} · ✅ pass {n_pass}")


def _sync_decision_for_pair(r1, r2, hd: int):
    """调用 sync 同款 ledger.near_dup_gate(单一事实源)静态推演 sync 会怎么处理。

    返回 ("flag" | "pass", reason)。2026-06-10 review 后 sync 不再硬拦截近似重复
    (同日同价连号真票会被静默吞,故障模式不可感知)— gate 命中一律写入 +
    needs_review + ⚠️ note。注意 gate 内含 Hamming ≤ NEAR_DUP_MAX_HAMMING 检查 —
    `--max-distance 3` 审计时,Hamming=3 的对正确标 pass,badge 不撒谎。
    """
    matched, reason = ledger.near_dup_gate(
        r1, r2.amount, r2.currency, r2.invoice_date, hd,
    )
    if not matched:
        return ("pass", reason)
    any_settled = (r1.settled == ledger.SETTLED_OK
                   or r2.settled == ledger.SETTLED_OK)
    suffix = "(对方已结清,note 用重措辞)" if any_settled else ""
    return ("flag", f"{reason} → 写入但 needs_review + ⚠️ note{suffix}")


def cmd_settle(args):
    """批量勾选 已结清。`--ids x,y` 指定 id8 或 invoice_number;`--all` 全勾。

    用途:Lynne 一次性结清当月多笔(替代在 Obsidian 里一张张点 ✓)。
    会同步触发:settled_date 自动写当前时间 + 文件 relocate(后续 task)。
    """
    month = args.month
    reimburser = args.reimburser
    ledger_root = Path(args.ledger_root).expanduser() if args.ledger_root else DEFAULT_LEDGER_ROOT
    if not month or not reimburser:
        raise SystemExit("settle 需要 --month YYYY-MM 和 --reimburser 名字")

    ledger_path = ledger.ledger_path_for(month, ledger_root, reimburser=reimburser)
    if not ledger_path.exists():
        raise SystemExit(f"账本不存在:{ledger_path}")

    rows = ledger.parse_ledger(ledger_path)
    if not rows:
        print(f"{ledger_path.name} 没有 row")
        return

    if args.all:
        target_ids = {r.id8 for r in rows if r.settled != ledger.SETTLED_OK}
    else:
        if not args.ids:
            raise SystemExit("需要 --ids x,y(id8 或 invoice_number)或 --all")
        wants = {s.strip() for s in args.ids.split(",") if s.strip()}
        target_ids = set()
        for r in rows:
            if r.id8 in wants or r.invoice_number in wants:
                target_ids.add(r.id8)
        missing = wants - target_ids - {r.invoice_number for r in rows if r.id8 in target_ids}
        if missing:
            print(f"⚠️ 找不到:{missing}", file=sys.stderr)

    n_settled = 0
    for r in rows:
        if r.id8 in target_ids:
            r.settled = ledger.SETTLED_OK
            n_settled += 1

    if not n_settled:
        print(f"无需结清(0 row 待勾)")
        return

    # rebuild ledger from rows(简单可靠);auto_fill_settled_date 后续填时间戳
    text = ledger_path.read_text(encoding="utf-8")
    sec_start_match = re.search(r"^### ", text, re.M)
    prefix = text[:sec_start_match.start()] if sec_start_match else text
    body = prefix.rstrip() + "\n\n"
    for r in rows:
        body += ledger._format_section(r) + "\n"
    ledger_path.write_text(body, encoding="utf-8")
    ledger.auto_fill_settled_dates(ledger_path)
    ledger.refresh_dashboard(ledger_path)
    print(f"settled: {ledger_path.relative_to(ledger_root)} ({n_settled} rows)")


def _resolve_roots(args):
    """从 args 解析 4 个 root,缺省用 DEFAULT。month-end/start/monthly-close/uncarry 共用。"""
    ledger_root = Path(args.ledger_root).expanduser() if getattr(args, "ledger_root", None) else DEFAULT_LEDGER_ROOT
    archive_root = Path(args.archive_root).expanduser() if getattr(args, "archive_root", None) else DEFAULT_ARCHIVE_ROOT
    petty_root = (Path(args.petty_ledger_root).expanduser()
                  if getattr(args, "petty_ledger_root", None) else DEFAULT_PETTY_LEDGER_ROOT)
    overseas_root = (Path(args.overseas_archive_root).expanduser()
                     if getattr(args, "overseas_archive_root", None) else DEFAULT_OVERSEAS_INVOICE_ROOT)
    return ledger_root, archive_root, petty_root, overseas_root


def _relocate_settled_both(ledger_root, archive_root, petty_root, overseas_root):
    """两套账本各跑一次 relocate-settled(已结清按 settled_date 月份归位)。"""
    _print_relocate_summary("主账本", transfer.relocate_settled_by_settled_month(
        ledger_root=ledger_root, wiki_root=WIKI_ROOT, archive_root=archive_root, dry_run=False))
    _print_relocate_summary("备用金账本", transfer.relocate_settled_by_settled_month(
        ledger_root=petty_root, wiki_root=WIKI_ROOT, archive_root=overseas_root, dry_run=False))


def _write_summaries_both(ledger_root, petty_root, month):
    """两套账本各人 summary + 总表刷新。"""
    for o in summary.write_summary(ledger_root, month):
        print(f"主账本 summary: {o}")
    for o in summary.write_summary(petty_root, month):
        print(f"备用金 summary: {o}")
    summary.write_total(ledger_root)
    summary.write_total(petty_root)


def _run_month_start(month, ledger_root, archive_root, petty_root, overseas_root):
    """月初结转(= 原 monthly-close 逻辑体):relocate-settled → carry-forward → summary。
    两套账本(主/备用金)一致处理。幂等:源月 row 标 ↗ 后重跑 skipped_already。"""
    to_month = transfer.next_month(month)
    _relocate_settled_both(ledger_root, archive_root, petty_root, overseas_root)
    _print_carry_summary("主账本", month, to_month, transfer.carry_forward(
        ledger_root=ledger_root, from_month=month, wiki_root=WIKI_ROOT, archive_root=archive_root))
    _print_carry_summary("备用金账本", month, to_month, transfer.carry_forward(
        ledger_root=petty_root, from_month=month, wiki_root=WIKI_ROOT, archive_root=overseas_root))
    _write_summaries_both(ledger_root, petty_root, month)


def cmd_monthly_close(args):
    """[已拆分:推荐 month-end(月末汇总)+ month-start(月初结转)] 旧的月底一次性,保留向后兼容。"""
    month = args.month or datetime.date.today().strftime("%Y-%m")
    _run_month_start(month, *_resolve_roots(args))


def cmd_month_start(args):
    """下月第一天:上月所有结清已结束 → 上月定版 + 把仍未结清的结转到本月 + 开启新月。
    --month 默认 = 上月(today 的上个月)。"""
    month = args.month or transfer.prev_month(datetime.date.today().strftime("%Y-%m"))
    _run_month_start(month, *_resolve_roots(args))
    print(f"--- month-start:已 close {month} 并结转到 {transfer.next_month(month)} ---")


def cmd_month_end(args):
    """每月最后一天:本月结账 + 汇总呈现给员工查验/结清。**不结转、不建下月**。
    ① relocate-settled(已结清归位)② 本月各人 summary ③ 总表刷新。"""
    month = args.month or datetime.date.today().strftime("%Y-%m")
    ledger_root, archive_root, petty_root, overseas_root = _resolve_roots(args)
    _relocate_settled_both(ledger_root, archive_root, petty_root, overseas_root)
    _write_summaries_both(ledger_root, petty_root, month)
    print(f"--- month-end {month}:已结账 + 汇总,未结转。下月第一天跑 month-start 才结转开新月 ---")


def cmd_uncarry(args):
    """撤销 from_month → to_month 的结转(carry_forward 逆操作)。回滚误 carry 用。
    默认 dry-run 预览,真跑加 --apply。主账本 + 备用金两套。"""
    from_month = args.month
    to_month = args.to_month or transfer.next_month(from_month)
    dry_run = not args.apply
    ledger_root, archive_root, petty_root, overseas_root = _resolve_roots(args)
    main_res = transfer.uncarry_forward(
        ledger_root=ledger_root, from_month=from_month, to_month=to_month,
        wiki_root=WIKI_ROOT, archive_root=archive_root, dry_run=dry_run)
    petty_res = transfer.uncarry_forward(
        ledger_root=petty_root, from_month=from_month, to_month=to_month,
        wiki_root=WIKI_ROOT, archive_root=overseas_root, dry_run=dry_run)
    tag = "[DRY-RUN]" if dry_run else "[已撤销]"
    for label, res in [("主账本", main_res), ("备用金", petty_res)]:
        print(f"--- {label} uncarry {from_month}→{to_month}: {len(res)} 张"
              f"{'(加 --apply 真跑)' if dry_run and res else ''} ---")
        for r in res:
            print(f"  {tag} {r.invoice_number or r.id8}")


def cmd_relocate_settled(args):
    """v2.5.9 按结清月归档:已结清 row 的物理位置跟 settled_date 月份对齐。

    场景:用户手动把 settled_date 改成历史月份(回填实际结清时间)→
    系统把 row + 物理文件挪到那个月的 ledger / 归档目录。

    主账本(报销/)和备用金账本(备用金/)两套独立扫,各自归档到 发票/ 与 invoice/。

    默认 --dry-run,真跑要加 --apply。
    """
    ledger_root = Path(args.ledger_root).expanduser() if args.ledger_root else DEFAULT_LEDGER_ROOT
    archive_root = Path(args.archive_root).expanduser() if args.archive_root else DEFAULT_ARCHIVE_ROOT
    petty_root = Path(args.petty_ledger_root).expanduser() if args.petty_ledger_root else DEFAULT_PETTY_LEDGER_ROOT
    overseas_root = Path(args.overseas_archive_root).expanduser() if args.overseas_archive_root else DEFAULT_OVERSEAS_INVOICE_ROOT
    dry_run = not args.apply

    print(f"=== 主账本({ledger_root.name})— dry_run={dry_run} ===")
    main_results = transfer.relocate_settled_by_settled_month(
        ledger_root=ledger_root, wiki_root=WIKI_ROOT,
        archive_root=archive_root, dry_run=dry_run,
    )
    _print_relocate_detail("主账本", main_results, dry_run)

    print(f"\n=== 备用金账本({petty_root.name})— dry_run={dry_run} ===")
    petty_results = transfer.relocate_settled_by_settled_month(
        ledger_root=petty_root, wiki_root=WIKI_ROOT,
        archive_root=overseas_root, dry_run=dry_run,
    )
    _print_relocate_detail("备用金账本", petty_results, dry_run)


def _print_relocate_summary(label, results):
    n_relocated = sum(1 for r in results if r.status == "relocated")
    n_invalid = sum(1 for r in results if r.status == "skipped_invalid_settled_date")
    n_dup = sum(1 for r in results if r.status == "skipped_dup_at_target")
    if n_relocated or n_invalid or n_dup:
        print(f"--- {label} relocate-settled:{n_relocated} 归档,{n_dup} 目标已有,{n_invalid} settled_date 无效 ---")


def _print_relocate_detail(label, results, dry_run):
    actionable = [r for r in results if r.status in ("dry_run", "relocated")]
    other = [r for r in results if r.status not in ("dry_run", "relocated", "skipped_already_aligned")]
    if not actionable and not other:
        print(f"  {label}:无要归档的已结清 row")
        return
    for r in actionable:
        verb = "[DRY-RUN]" if r.status == "dry_run" else "[移]"
        file_tag = " +file" if r.file_moved else ""
        inv = r.invoice_number or f"id8={r.id8}"
        print(f"  {verb} {r.reimburser} {inv} : {r.from_month} → {r.settled_month}{file_tag}")
    for r in other:
        inv = r.invoice_number or f"id8={r.id8}"
        extra = f" ({r.note})" if r.note else ""
        print(f"  [跳过 {r.status}] {r.reimburser} {inv}{extra}")
    if dry_run and actionable:
        print(f"  → {len(actionable)} 张可归档(加 --apply 真跑)")


def _print_carry_summary(label, month, to_month, results):
    n_carry = sum(1 for r in results if r.status == "carried")
    n_done = sum(1 for r in results if r.status == "skipped_done")
    n_already = sum(1 for r in results if r.status == "skipped_already")
    print(f"--- {label} {month} carry-forward → {to_month}:{n_carry} 延续,{n_done} 已结清,{n_already} 已延 ---")


def main(argv=None):
    p = argparse.ArgumentParser(prog="baoxiao",
                                description="报销自动化(v2:邮箱拉 → 归档 → wiki 账本)")
    sub = p.add_subparsers(dest="cmd", required=True)

    def add_common(sp, need_extractor):
        sp.add_argument("--inbox", default=str(DEFAULT_INBOX))
        if need_extractor:
            sp.add_argument("--fields-file", default=None, help="cowork:Claude 读出的字段 JSON")
            sp.add_argument("--provider", choices=["gpt"], default=None, help="运行时 LLM 提取")
            sp.add_argument("--env", default=DEFAULT_ENV, help="gpt 路用,读 OPENAI_API_KEY")

    sp = sub.add_parser("list-inbox"); add_common(sp, False); sp.set_defaults(func=cmd_list_inbox)
    sp = sub.add_parser("plan"); add_common(sp, True); sp.set_defaults(func=cmd_plan)
    sp = sub.add_parser("ingest"); add_common(sp, True)
    sp.add_argument("--archive-root", default=None, help="国内增值税票归档根(默认 发票/)")
    sp.add_argument("--overseas-archive-root", default=None,
                    help="海外 invoice 归档根(默认 invoice/);invoice_type=invoice 时路由到这里")
    sp.add_argument("--ledger-root", default=None,
                    help="主账本(国内增值税票)目录(默认 docs/.../报销/)")
    sp.add_argument("--petty-ledger-root", default=None,
                    help="备用金账本(海外 invoice)目录(默认 docs/.../备用金/)")
    sp.set_defaults(func=cmd_ingest)

    sp = sub.add_parser("audit-mail",
                        help="v2.5.8 阶段 C:扫 IMAP 近 N 天 vs ledger,输出疑似漏 fetch/ingest 清单")
    sp.add_argument("--env", default=DEFAULT_ENV)
    sp.add_argument("--since-days", type=int, default=14,
                    help="审计窗口天数(默认 14 = 双周)")
    sp.set_defaults(func=cmd_audit_mail)

    sp = sub.add_parser("fetch-mail", help="Gmail IMAP 拉新邮件附件 → _inbox/{报销人}/")
    sp.add_argument("--inbox", default=str(DEFAULT_INBOX))
    sp.add_argument("--env", default=DEFAULT_ENV, help="读 GMAIL_USER/GMAIL_APP_PASSWORD")
    sp.add_argument("--reimburser", default="Lynne", help="附件落到 _inbox/{这个}/ 子文件夹")
    sp.add_argument("--state-file", default=None,
                    help="增量 UID 状态文件(默认 logs/last_fetch.txt)")
    sp.add_argument("--filter-subject", action="store_true",
                    help="只拉主题含发票/invoice/receipt 关键词的(默认不过滤主题)")
    sp.add_argument("--mode", choices=["window", "incremental"], default="window",
                    help="v2.5.8:window(默认,扫近 N 天 + sha256 去重防漏)/incremental(老,UID>last 增量)")
    sp.add_argument("--since-days", type=int, default=30,
                    help="window 模式扫描窗口(默认 30 天)")
    sp.set_defaults(func=cmd_fetch_mail)

    sp = sub.add_parser("monthly-close",
                        help="[已拆分→month-end/month-start] 旧:月底一次性 carry+summary(向后兼容)")
    sp.add_argument("--month", default=None,
                    help="YYYY-MM 指定要 close 的月份(默认本月)")
    sp.add_argument("--ledger-root", default=None, help="主账本目录(默认 报销/)")
    sp.add_argument("--archive-root", default=None, help="国内归档根(默认 发票/)")
    sp.add_argument("--petty-ledger-root", default=None, help="备用金账本目录(默认 备用金/)")
    sp.add_argument("--overseas-archive-root", default=None, help="海外归档根(默认 invoice/)")
    sp.set_defaults(func=cmd_monthly_close)

    def _add_close_roots(sp_):
        sp_.add_argument("--ledger-root", default=None, help="主账本目录(默认 报销/)")
        sp_.add_argument("--archive-root", default=None, help="国内归档根(默认 发票/)")
        sp_.add_argument("--petty-ledger-root", default=None, help="备用金账本目录(默认 备用金/)")
        sp_.add_argument("--overseas-archive-root", default=None, help="海外归档根(默认 invoice/)")

    sp = sub.add_parser("month-end",
                        help="每月最后一天:本月结账+汇总呈现给员工查验/结清(不结转、不建下月)")
    sp.add_argument("--month", default=None, help="YYYY-MM(默认本月)")
    _add_close_roots(sp)
    sp.set_defaults(func=cmd_month_end)

    sp = sub.add_parser("month-start",
                        help="下月第一天:上月定版+把未结清结转到本月+开新月(--month 默认上月)")
    sp.add_argument("--month", default=None, help="YYYY-MM 要 close 的月(默认上月)")
    _add_close_roots(sp)
    sp.set_defaults(func=cmd_month_start)

    sp = sub.add_parser("uncarry",
                        help="撤销某月→下月结转(carry 逆操作,回滚误 carry);默认 dry-run,真跑加 --apply")
    sp.add_argument("--month", required=True, help="from_month:被结转出去的源月 YYYY-MM")
    sp.add_argument("--to-month", default=None, help="目标月(默认 from_month 的下月)")
    sp.add_argument("--apply", action="store_true", help="真跑(默认 dry-run 只预览)")
    _add_close_roots(sp)
    sp.set_defaults(func=cmd_uncarry)

    sp = sub.add_parser("drop-scan",
                        help="扫 wiki 投递区 _drop/{人}/ 搬到 _inbox(非邮件渠道发票)")
    sp.add_argument("--drop-root", default=None,
                    help="投递区根目录(默认 finance-payments/_drop)")
    sp.add_argument("--inbox", default=str(DEFAULT_INBOX))
    sp.set_defaults(func=cmd_drop_scan)

    sp = sub.add_parser("settle", help="批量勾选 已结清(替代 Obsidian 一张张点)")
    sp.add_argument("--month", required=True, help="YYYY-MM")
    sp.add_argument("--reimburser", required=True, help="报销人名字")
    sp.add_argument("--ids", default=None, help="逗号分隔 id8 或 invoice_number")
    sp.add_argument("--all", action="store_true", help="勾选该账本所有未结清 row")
    sp.add_argument("--ledger-root", default=None)
    sp.set_defaults(func=cmd_settle)

    sp = sub.add_parser("refresh-dashboard",
                        help="Lynne toggle task 后重生账本顶部 dashboard 表格(同步状态显示)")
    sp.add_argument("--month", default=None, help="YYYY-MM(默认刷所有账本)")
    sp.add_argument("--ledger-root", default=None)
    sp.set_defaults(func=cmd_refresh_dashboard)

    sp = sub.add_parser("audit-near-dups",
                        help="v2.5.9 Day 4:扫账本列出 Hamming ≤ N 近似发票号对(疑似 OCR 错读双胞胎)")
    sp.add_argument("--ledger-root", default=None, help="主账本目录(默认 报销/)")
    sp.add_argument("--petty-ledger-root", default=None, help="备用金账本目录(默认 备用金/)")
    sp.add_argument("--max-distance", type=int, default=2,
                    help="最大 Hamming 距离(默认 2;1 = OCR 单字符错读,2 = transposition)")
    sp.set_defaults(func=cmd_audit_near_dups)

    sp = sub.add_parser("relocate-settled",
                        help="v2.5.9 按结清月归档:已结清 row + 物理文件 → settled_date 月份目录(双账本)")
    sp.add_argument("--ledger-root", default=None, help="主账本目录(默认 报销/)")
    sp.add_argument("--archive-root", default=None, help="国内归档根(默认 发票/)")
    sp.add_argument("--petty-ledger-root", default=None, help="备用金账本目录(默认 备用金/)")
    sp.add_argument("--overseas-archive-root", default=None, help="海外归档根(默认 invoice/)")
    sp.add_argument("--apply", action="store_true",
                    help="真跑(默认 dry-run,只打印不动文件)")
    sp.set_defaults(func=cmd_relocate_settled)

    sp = sub.add_parser("migrate-invoices-to-petty",
                        help="v2.5.8 一次性 migration:把主账本里 invoice row 物理迁移到备用金账本")
    sp.add_argument("--ledger-root", default=None)
    sp.add_argument("--petty-root", default=None,
                    help="备用金账本根目录(默认 备用金/)")
    sp.set_defaults(func=cmd_migrate_invoices_to_petty)

    sp = sub.add_parser("process-payments",
                        help="v2.5.7 Req 4:扫 _drop/{人}/payments/ 截图 → 关联 invoice → 归档+回写")
    sp.add_argument("--fields-file", default=None,
                    help="cowork:Claude 读截图出的字段 JSON {path: PaymentProofFields}")
    sp.add_argument("--provider", choices=["gpt"], default=None, help="运行时 LLM 提取")
    sp.add_argument("--env", default=DEFAULT_ENV)
    sp.add_argument("--payments-root", default=None,
                    help="_drop 根目录(默认 docs/.../finance-payments/_drop/)")
    sp.add_argument("--ledger-root", default=None, help="主账本根目录(默认 报销/)")
    sp.add_argument("--petty-ledger-root", default=None,
                    help="备用金账本根目录(默认 备用金/);v2.5.8 起 invoice row 在这里")
    sp.set_defaults(func=cmd_process_payments)

    args = p.parse_args(argv)
    return args.func(args) or 0


if __name__ == "__main__":
    sys.exit(main())
