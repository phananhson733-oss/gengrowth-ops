"""Gmail IMAP 拉发票附件:增量 UID 扫描 → 过滤(有附件 + 后缀白名单 + 主题
keyword)→ 落到 _inbox/{reimburser_subdir}/。

凭证:**Gmail App Password**(账户 2 步验证开了之后在 Google → 安全 → 应用
专用密码生成 16 位密码)。比 OAuth refresh token 简单,且不会 7 天过期。

依赖:stdlib only (`imaplib` + `email`)。测试时注入 `imap_factory` 用 fake。

状态:`state_file`(单文件存上次拉到的最大 UID,文本)。首次跑 last_uid=0
就 `UID 1:*` 一把全拉 —— 慎用,Lynne 邮箱量大的话建议先手设 baseline。
"""

import email
import email.header
import email.message
import imaplib
import re
import ssl
from dataclasses import dataclass, field
from pathlib import Path
from typing import Callable, List, Optional, Tuple

PDF_OR_IMAGE = (".pdf", ".jpg", ".jpeg", ".png")
GMAIL_HOST = "imap.gmail.com"
GMAIL_PORT = 993

# v2.5.8:链接式电子发票模式(京东等商家把发票藏正文 URL 不带附件)
# 匹配域名/路径里含"invoice/fapiao/digital-invoice/electron"且后缀 .pdf 的链接
_INVOICE_URL_PATTERNS = [
    re.compile(r'https?://[^\s"\'<>]*(?:invoice|fapiao|digital-invoice|electron|发票)[^\s"\'<>]*\.pdf[^\s"\'<>]*',
               re.IGNORECASE),
    # 京东专属:jdcloud-oss.com 上的 digital_*.pdf
    re.compile(r'https?://[^\s"\'<>]*jdcloud-oss\.com[^\s"\'<>]*\.pdf[^\s"\'<>]*', re.IGNORECASE),
]
_DOWNLOAD_TIMEOUT = 30   # 秒
_DOWNLOAD_USER_AGENT = "gengrowth-baoxiao/2.5.8"
# v2.5.9:50MB 上限防 OOM(京东 / 美团 / 携程电子发票 PDF 实际 <100KB,余量充裕)。
_DOWNLOAD_MAX_BYTES = 50 * 1024 * 1024


_NUMERIC_HOST_RE = re.compile(r"^[0-9xXa-fA-F.]+$")


def _addr_is_unsafe(addr) -> bool:
    """ipaddress 对象是否落在私网/loopback/link-local/reserved/multicast/unspecified。"""
    return (addr.is_private or addr.is_loopback or addr.is_link_local
            or addr.is_reserved or addr.is_multicast or addr.is_unspecified)


def _safe_url(url: str) -> bool:
    """v2.5.9 SSRF 防护:URL 在发起请求前必须 scheme=https + 主机非私网。

    禁: file://、http://、loopback、link-local、private CIDR、metadata endpoint。
    覆盖:
    - 标准 IP 字面量(IPv4/IPv6)— ipaddress.ip_address 解析后 check 类型
    - 非标准 IP 字面量(整数 2130706433、0x7f000001、短 IPv4 127.1)— 拒掉 numeric-looking host
    - 域名 — socket.getaddrinfo 解析所有 A/AAAA,任一落入私网就拒
      (实际连接由 urllib 重新解析,理论上有 TOCTOU 窗口,但对邮件链接式发票场景足够)
    """
    from urllib.parse import urlparse
    import ipaddress
    import socket
    try:
        p = urlparse(url)
    except Exception:    # noqa: BLE001
        return False
    if p.scheme != "https":
        return False
    host = (p.hostname or "").strip()
    if not host:
        return False
    # 1. 标准 IP 字面量
    try:
        addr = ipaddress.ip_address(host)
        return not _addr_is_unsafe(addr)
    except ValueError:
        pass
    # 2. numeric-looking host(没字母的"像 IP"字符串)— 拒掉以堵
    #    127.1 / 2130706433 / 0x7f000001 / 0177.0.0.1 / 0127.0.0.1 这类绕过
    if _NUMERIC_HOST_RE.match(host) and not any(c.isalpha() for c in host):
        return False
    # 3. 域名 — 解析全部 A/AAAA,任一私网就拒
    try:
        infos = socket.getaddrinfo(host, p.port or 443, type=socket.SOCK_STREAM)
    except (socket.gaierror, OSError):
        return False
    for info in infos:
        sockaddr = info[4]
        ip_str = sockaddr[0]
        try:
            addr = ipaddress.ip_address(ip_str)
        except ValueError:
            return False
        if _addr_is_unsafe(addr):
            return False
    return True


def _safe_subdir(name: str) -> str:
    """v2.5.9:reimburser_subdir 类输入若包含 / .. NUL 等就拒掉,
    避免拼接出 dest_dir/../sensitive 这种 traversal。"""
    if not name:
        return ""
    if "/" in name or "\\" in name or "\x00" in name or name.startswith("."):
        raise ValueError(f"不安全的子目录名: {name!r}")
    return name


def _extract_invoice_urls(msg) -> List[str]:
    """从邮件正文(text/plain + text/html)抽取潜在 PDF 发票链接,去重保序。"""
    urls = []
    seen = set()
    for part in msg.walk():
        if part.get_content_type() not in ("text/plain", "text/html"):
            continue
        try:
            body = part.get_payload(decode=True)
            if not body:
                continue
            text = body.decode("utf-8", errors="replace")
        except Exception:    # noqa: BLE001
            continue
        for pat in _INVOICE_URL_PATTERNS:
            for m in pat.finditer(text):
                u = m.group(0)
                # 去掉 HTML entity
                u = u.replace("&amp;", "&").replace("&#x2F;", "/")
                if u not in seen:
                    seen.add(u)
                    urls.append(u)
    return urls


def _download_url_to(dest_dir: Path, url: str,
                     *, existing_hashes=None,
                     timeout: int = _DOWNLOAD_TIMEOUT) -> Optional[Path]:
    """下载 PDF 链接到 dest_dir。sha256 命中已存在 → skip 返 None。
    成功返回 Path,失败(timeout/403/404/非 PDF/超大/被 SSRF 防护拦截)返 None。

    v2.5.9 安全收紧:
    - 请求前用 _safe_url 校验 scheme/host(防 file://、私网、loopback、metadata endpoint)
    - 自定义 RedirectHandler — 每跳都过 _safe_url,任何重定向到私网/非 https 直接终止
    - resp.read 上限 _DOWNLOAD_MAX_BYTES,超量返 None(防 OOM 与 decompression bomb)
    - 写盘 atomic — 先写 .tmp,sha256 通过后 os.replace,避免部分写污染 dedup
    """
    import hashlib as _hash
    import os as _os
    import tempfile as _tmp
    import urllib.request
    import urllib.error
    if not _safe_url(url):
        return None

    class _SafeRedirectHandler(urllib.request.HTTPRedirectHandler):
        def redirect_request(self, req, fp, code, msg, headers, newurl):
            if not _safe_url(newurl):
                raise urllib.error.URLError(f"unsafe redirect blocked: {newurl}")
            return super().redirect_request(req, fp, code, msg, headers, newurl)

    opener = urllib.request.build_opener(_SafeRedirectHandler())
    req = urllib.request.Request(url, headers={"User-Agent": _DOWNLOAD_USER_AGENT})
    try:
        with opener.open(req, timeout=timeout) as resp:
            # 多读 1 字节用来检测是否超 cap
            content = resp.read(_DOWNLOAD_MAX_BYTES + 1)
            ctype = resp.headers.get("Content-Type", "").lower()
    except (urllib.error.URLError, urllib.error.HTTPError, OSError, ValueError):
        return None
    if len(content) > _DOWNLOAD_MAX_BYTES:
        return None
    # 必须是 PDF magic bytes 或 Content-Type 含 pdf
    if not (content.startswith(b"%PDF") or "pdf" in ctype):
        return None
    digest = _hash.sha256(content).hexdigest()
    if existing_hashes is not None:
        if digest in existing_hashes:
            return None
    # 文件名:从 URL 末尾抠,默认用 digest 前缀
    from urllib.parse import urlparse
    path = urlparse(url).path
    name = Path(path).name or f"invoice-{digest[:8]}.pdf"
    if not name.lower().endswith(".pdf"):
        name = f"{name}.pdf"
    name = _safe_name(name)
    target = _unique_dest(dest_dir / name)
    target.parent.mkdir(parents=True, exist_ok=True)
    # atomic write:tmp 写完 → os.replace。中途被 kill 不会留半截 .pdf 污染 dedup
    fd, tmp_path = _tmp.mkstemp(prefix=".dl-", suffix=".pdf.tmp", dir=str(target.parent))
    replaced = False
    try:
        with _os.fdopen(fd, "wb") as f:
            f.write(content)
        _os.replace(tmp_path, target)
        replaced = True
    except OSError:
        return None
    finally:
        # 任何非 replace 成功路径都要清掉 tmp(包括 OSError / KeyboardInterrupt /
        # SystemExit / 测试 monkeypatch 抛的普通 Exception),避免 .dl-* 文件残留
        if not replaced:
            try:
                _os.unlink(tmp_path)
            except OSError:
                pass
    # write 成功才把 hash 加进 dedup set,避免失败留垃圾 hash
    if existing_hashes is not None:
        existing_hashes.add(digest)
    return target


@dataclass
class FetchResult:
    uid: str
    from_addr: str
    subject: str
    saved_paths: List[Path] = field(default_factory=list)
    skipped_reason: str = ""

    @property
    def saved(self) -> bool:
        return bool(self.saved_paths)


def _decode_header(value) -> str:
    if not value:
        return ""
    parts = email.header.decode_header(value)
    out = []
    for text, charset in parts:
        if isinstance(text, bytes):
            try:
                out.append(text.decode(charset or "utf-8", errors="replace"))
            except LookupError:
                out.append(text.decode("utf-8", errors="replace"))
        else:
            out.append(text)
    return "".join(out)


def _attachment_filename(part) -> Optional[str]:
    if part.get_content_disposition() not in ("attachment", "inline"):
        return None
    name = part.get_filename()    # email lib 自动解 RFC 2231 / MIME B/Q 编码
    if not name:
        return None
    # 偶发 server 不规范返回 =?utf-8?B?...?= 还没解,补一刀
    return _decode_header(name) if "=?" in name else name


_BAD_FN_CHARS = re.compile(r'[\\:*?"<>|\x00]')


def _safe_name(name: str) -> str:
    return _BAD_FN_CHARS.sub("_", Path(name).name)


def _unique_dest(target: Path) -> Path:
    if not target.exists():
        return target
    stem, suffix = target.stem, target.suffix
    i = 1
    while True:
        cand = target.with_name(f"{stem} ({i}){suffix}")
        if not cand.exists():
            return cand
        i += 1


def _matches_subject(subject: str, keywords) -> bool:
    if not keywords:
        return True
    s = subject.lower()
    return any(kw.lower() in s for kw in keywords)


def _matches_ext(name: str, extensions) -> bool:
    return Path(name).suffix.lower() in extensions


def _last_uid(state_file: Path) -> int:
    if not state_file.exists():
        return 0
    try:
        return int(state_file.read_text(encoding="utf-8").strip())
    except (ValueError, OSError):
        return 0


def _save_last_uid(state_file: Path, uid: int) -> None:
    state_file.parent.mkdir(parents=True, exist_ok=True)
    state_file.write_text(str(uid), encoding="utf-8")


def _parse_uids(data) -> List[int]:
    if not data or not data[0]:
        return []
    parts = data[0].decode("utf-8").split() if isinstance(data[0], bytes) else str(data[0]).split()
    return sorted(int(p) for p in parts if p.isdigit())


def _process_message(raw_bytes, *, uid, dest_dir, subject_keywords, extensions,
                     existing_hashes=None, follow_invoice_urls=True,
                     url_downloader=None) -> FetchResult:
    """v2.5.8:
    - existing_hashes(set of sha256) 非空时,跳过内容相同的附件(防 window 模式重复保存)。
    - follow_invoice_urls=True:扫正文 PDF 链接,自动下载(覆盖京东链接式电子发票)。
    - url_downloader: callable(dest_dir, url, existing_hashes) -> Optional[Path],测试用。
    """
    import hashlib as _hash
    msg = email.message_from_bytes(raw_bytes)
    subject = _decode_header(msg.get("Subject", ""))
    from_addr = _decode_header(msg.get("From", ""))
    result = FetchResult(uid=str(uid), from_addr=from_addr, subject=subject)

    if not _matches_subject(subject, subject_keywords):
        result.skipped_reason = "主题不匹配 keyword"
        return result

    has_attachment = False
    for part in msg.walk():
        if part.is_multipart():
            continue
        name = _attachment_filename(part)
        if not name:
            continue
        has_attachment = True
        if not _matches_ext(name, extensions):
            continue
        payload = part.get_payload(decode=True)
        if not payload:
            continue
        # v2.5.8 window 模式:内容 sha256 与 dest_dir 已有重复 → skip
        if existing_hashes is not None:
            digest = _hash.sha256(payload).hexdigest()
            if digest in existing_hashes:
                continue
            existing_hashes.add(digest)
        target = _unique_dest(dest_dir / _safe_name(name))
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(payload)
        result.saved_paths.append(target)

    # v2.5.8 链接式电子发票(京东等):正文抽 PDF 链接,自动下载
    url_downloaded = 0
    if follow_invoice_urls:
        urls = _extract_invoice_urls(msg)
        downloader = url_downloader or _download_url_to
        for u in urls:
            p = downloader(dest_dir, u, existing_hashes=existing_hashes)
            if p:
                result.saved_paths.append(p)
                url_downloaded += 1

    if not has_attachment and url_downloaded == 0:
        result.skipped_reason = "邮件无附件且无可下载链接"
    elif not result.saved_paths:
        result.skipped_reason = "附件类型不在白名单或内容已存在"
    return result


def _default_factory(host, port):
    # v2.5.7:加 30s socket timeout 防 IMAP hang 5h(没 timeout 时 connect/read 会 block forever)
    return lambda: imaplib.IMAP4_SSL(host, port, ssl_context=ssl.create_default_context(), timeout=30)


def fetch_to_inbox(
    *,
    user: str,
    password: str,
    inbox_dir,
    state_file,
    reimburser_subdir: str = "Lynne",
    host: str = GMAIL_HOST,
    port: int = GMAIL_PORT,
    mailbox: str = "INBOX",
    subject_keywords=None,
    extensions=PDF_OR_IMAGE,
    imap_factory: Optional[Callable] = None,
    since_days: Optional[int] = 365,
    has_attachment: bool = False,    # v2.5.8:默认 OFF — Gmail 服务端误判把携程/拼多多/美团 PDF 邮件认为无附件,客户端附件后缀过滤兜底足够
    mode: str = "window",            # v2.5.8 "incremental"(老,UID>last) / "window"(新,SINCE N 天,文件级 sha256 去重)
) -> Tuple[List[FetchResult], int]:
    """从 IMAP 拉新邮件附件到 inbox_dir/{reimburser_subdir}/。

    v2.5.8 mode 参数:
    - "incremental"(老):IMAP search 加 `UID {last+1}:*`,客户端再 skip uid <= last_uid。
      问题:服务端 has:attachment 或附件后缀过滤误判会让该批 UID 永久漏(latest_uid 已推进)。
    - "window"(新,默认):IMAP search 只用 `SINCE`,每次扫窗口内所有邮件。
      内部用文件级 sha256 去重防 _inbox 重复保存,ledger.find_by_invoice_number 软去重防重复入账。
      state file 仍写 latest_uid 作为 watch 进度提示,但不再作 search criteria → 不会漏。

    返回 (results, latest_uid)。
    """
    import datetime as _dt
    inbox_dir = Path(inbox_dir)
    state_file = Path(state_file)
    # v2.5.9:reimburser_subdir 来自 .env / cli config,显式校验防 traversal
    dest_dir = inbox_dir / _safe_subdir(reimburser_subdir)
    dest_dir.mkdir(parents=True, exist_ok=True)
    last_uid = _last_uid(state_file)

    # v2.5.8 window 模式:预扫 dest_dir 已有文件 sha256,避免重复保存同内容附件
    existing_hashes = set()
    if mode == "window" and dest_dir.exists():
        import hashlib as _hash
        for f in dest_dir.iterdir():
            if f.is_file() and not f.name.startswith("."):
                try:
                    existing_hashes.add(_hash.sha256(f.read_bytes()).hexdigest())
                except OSError:
                    continue

    factory = imap_factory or _default_factory(host, port)
    client = factory()
    try:
        client.login(user, password)
        client.select(mailbox)
        # 构造 IMAP search 标准:
        #   incremental(老): UID {last+1}:* + SINCE + has:attachment(可选)
        #   window(新):       SINCE 只 + has:attachment(可选);不带 UID 范围,每次扫全窗
        criteria_parts = []
        if mode == "incremental" and last_uid:
            criteria_parts.append(f"UID {last_uid + 1}:*")
        if since_days:
            since_str = (_dt.date.today() - _dt.timedelta(days=since_days)).strftime("%d-%b-%Y")
            criteria_parts.append(f"SINCE {since_str}")
        if has_attachment:
            criteria_parts.append('X-GM-RAW "has:attachment"')
        search_arg = " ".join(criteria_parts) if criteria_parts else "ALL"
        typ, data = client.uid("SEARCH", search_arg)
        if typ != "OK":
            raise RuntimeError(f"IMAP search 失败:{data}")
        uids = _parse_uids(data)
        results = []
        latest = last_uid
        for uid in uids:
            # incremental:严格 skip 已处理过的;window:全扫,内部 sha256 去重
            if mode == "incremental" and uid <= last_uid:
                continue
            typ, data = client.uid("FETCH", str(uid), "(RFC822)")
            if typ != "OK" or not data or not data[0]:
                continue
            first = data[0]
            raw = first[1] if isinstance(first, tuple) else first
            if isinstance(raw, str):
                raw = raw.encode("utf-8")
            r = _process_message(raw, uid=uid, dest_dir=dest_dir,
                                 subject_keywords=subject_keywords, extensions=extensions,
                                 existing_hashes=existing_hashes if mode == "window" else None)
            results.append(r)
            latest = max(latest, uid)

        if latest > last_uid:
            _save_last_uid(state_file, latest)
        return results, latest
    finally:
        try:
            client.logout()
        except Exception:  # noqa: BLE001
            pass
