"""RED then GREEN: mailbox.py — Gmail IMAP 拉附件。

不连真 IMAP,用 FakeImapClient 模拟 imaplib 子集。
"""
import email
import email.message
import importlib.util
import tempfile
import unittest
from email.mime.application import MIMEApplication
from email.mime.image import MIMEImage
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path


MODULE_PATH = Path(__file__).resolve().parents[1] / "mailbox.py"
SPEC = importlib.util.spec_from_file_location("mailbox", MODULE_PATH)
mailbox = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(mailbox)


def _build_email(*, subject="发票", sender="alice@x.com",
                 attachments=None, body="see attached"):
    """attachments: list of (filename, bytes, maintype, subtype)"""
    msg = MIMEMultipart()
    msg["Subject"] = subject
    msg["From"] = sender
    msg["To"] = "lynne@gengrowth.ai"
    msg.attach(MIMEText(body, "plain"))
    for fname, content, maintype, subtype in (attachments or []):
        if maintype == "image":
            part = MIMEImage(content, _subtype=subtype)
        else:
            part = MIMEApplication(content, _subtype=subtype)
        part.add_header("Content-Disposition", "attachment", filename=fname)
        msg.attach(part)
    return msg.as_bytes()


class FakeImapClient:
    """imaplib.IMAP4_SSL 的最小子集:login/select/uid(SEARCH/FETCH)/logout。"""

    def __init__(self, mails=None, login_should_fail=False):
        self.mails = mails or {}            # uid:int -> raw bytes
        self.login_should_fail = login_should_fail
        self.logged_in = False
        self.selected = None
        self.logged_out = False

    def login(self, user, password):
        if self.login_should_fail:
            raise RuntimeError("LOGIN FAILED")
        self.logged_in = True
        return "OK", [b""]

    def select(self, mailbox):
        self.selected = mailbox
        return "OK", [str(len(self.mails)).encode()]

    def uid(self, command, *args):
        cmd = command.upper()
        if cmd == "SEARCH":
            crit = args[-1] if args else "ALL"
            uids = sorted(self.mails.keys())
            if isinstance(crit, str) and crit.upper().startswith("UID "):
                lo_hi = crit[4:]
                lo = int(lo_hi.split(":")[0])
                uids = [u for u in uids if u >= lo]
            return "OK", [" ".join(str(u) for u in uids).encode()]
        if cmd == "FETCH":
            uid = int(args[0])
            raw = self.mails.get(uid)
            if raw is None:
                return "NO", [None]
            return "OK", [(f"{uid} (RFC822 {{{len(raw)}}}".encode(), raw), b")"]
        return "BAD", [b""]

    def logout(self):
        self.logged_out = True
        return "BYE", [b""]


def _factory(client):
    return lambda: client


class FetchHappyPathTests(unittest.TestCase):
    def test_single_pdf_lands_in_inbox_subdir(self):
        client = FakeImapClient(mails={
            1001: _build_email(subject="发票一张",
                               attachments=[("invoice.pdf", b"PDFBYTES", "application", "pdf")])
        })
        with tempfile.TemporaryDirectory() as tmp:
            inbox = Path(tmp) / "_inbox"
            state = Path(tmp) / "state.txt"
            results, latest = mailbox.fetch_to_inbox(
                user="u", password="p", inbox_dir=inbox,
                state_file=state, reimburser_subdir="Lynne",
                imap_factory=_factory(client),
            )
            self.assertEqual(len(results), 1)
            r = results[0]
            self.assertTrue(r.saved)
            self.assertEqual(len(r.saved_paths), 1)
            saved = r.saved_paths[0]
            self.assertEqual(saved.parent.name, "Lynne")
            self.assertEqual(saved.name, "invoice.pdf")
            self.assertEqual(saved.read_bytes(), b"PDFBYTES")
            self.assertEqual(latest, 1001)
            self.assertEqual(state.read_text(encoding="utf-8").strip(), "1001")
            self.assertTrue(client.logged_in)
            self.assertTrue(client.logged_out)

    def test_image_attachment_saved(self):
        client = FakeImapClient(mails={
            5: _build_email(subject="receipt",
                            attachments=[("scan.jpg", b"JPGBYTES", "image", "jpeg")])
        })
        with tempfile.TemporaryDirectory() as tmp:
            results, _ = mailbox.fetch_to_inbox(
                user="u", password="p",
                inbox_dir=Path(tmp) / "_inbox",
                state_file=Path(tmp) / "s.txt",
                imap_factory=_factory(client),
            )
            self.assertTrue(results[0].saved)
            self.assertEqual(results[0].saved_paths[0].name, "scan.jpg")

    def test_multiple_attachments_all_saved(self):
        client = FakeImapClient(mails={
            7: _build_email(subject="多发票", attachments=[
                ("a.pdf", b"A", "application", "pdf"),
                ("b.pdf", b"B", "application", "pdf"),
            ])
        })
        with tempfile.TemporaryDirectory() as tmp:
            results, _ = mailbox.fetch_to_inbox(
                user="u", password="p",
                inbox_dir=Path(tmp) / "_inbox",
                state_file=Path(tmp) / "s.txt",
                imap_factory=_factory(client),
            )
            self.assertEqual(len(results[0].saved_paths), 2)
            names = {p.name for p in results[0].saved_paths}
            self.assertEqual(names, {"a.pdf", "b.pdf"})


class FetchFilterTests(unittest.TestCase):
    def test_no_attachment_skipped(self):
        client = FakeImapClient(mails={3: _build_email(subject="just text")})
        with tempfile.TemporaryDirectory() as tmp:
            results, _ = mailbox.fetch_to_inbox(
                user="u", password="p",
                inbox_dir=Path(tmp) / "_inbox",
                state_file=Path(tmp) / "s.txt",
                imap_factory=_factory(client),
            )
            self.assertFalse(results[0].saved)
            self.assertIn("无附件", results[0].skipped_reason)

    def test_non_whitelist_extension_skipped(self):
        client = FakeImapClient(mails={4: _build_email(
            attachments=[("malware.exe", b"x", "application", "octet-stream")])})
        with tempfile.TemporaryDirectory() as tmp:
            results, _ = mailbox.fetch_to_inbox(
                user="u", password="p",
                inbox_dir=Path(tmp) / "_inbox",
                state_file=Path(tmp) / "s.txt",
                imap_factory=_factory(client),
            )
            self.assertFalse(results[0].saved)
            self.assertIn("白名单", results[0].skipped_reason)

    def test_subject_keyword_filter_skips_non_match(self):
        client = FakeImapClient(mails={
            10: _build_email(subject="生日快乐",
                             attachments=[("card.pdf", b"X", "application", "pdf")]),
            11: _build_email(subject="发票来啦",
                             attachments=[("inv.pdf", b"Y", "application", "pdf")]),
        })
        with tempfile.TemporaryDirectory() as tmp:
            results, _ = mailbox.fetch_to_inbox(
                user="u", password="p",
                inbox_dir=Path(tmp) / "_inbox",
                state_file=Path(tmp) / "s.txt",
                subject_keywords=["发票", "invoice"],
                imap_factory=_factory(client),
            )
            saved = [r for r in results if r.saved]
            self.assertEqual(len(saved), 1)
            self.assertEqual(saved[0].saved_paths[0].name, "inv.pdf")


class FetchIncrementalTests(unittest.TestCase):
    """v2.5.7 增量行为(mode='incremental'):state file 阻挡老 UID。"""

    def test_uid_state_persisted_and_respected(self):
        client = FakeImapClient(mails={
            100: _build_email(attachments=[("a.pdf", b"A", "application", "pdf")]),
            101: _build_email(attachments=[("b.pdf", b"B", "application", "pdf")]),
        })
        with tempfile.TemporaryDirectory() as tmp:
            inbox = Path(tmp) / "_inbox"
            state = Path(tmp) / "s.txt"
            results1, latest1 = mailbox.fetch_to_inbox(
                user="u", password="p", inbox_dir=inbox, state_file=state,
                imap_factory=_factory(client), mode="incremental",
            )
            self.assertEqual(latest1, 101)
            self.assertEqual(len(results1), 2)
            # 添加一封新邮件
            client.mails[102] = _build_email(
                attachments=[("c.pdf", b"C", "application", "pdf")])
            results2, latest2 = mailbox.fetch_to_inbox(
                user="u", password="p", inbox_dir=inbox, state_file=state,
                imap_factory=_factory(client), mode="incremental",
            )
            self.assertEqual(latest2, 102)
            self.assertEqual(len(results2), 1)
            self.assertEqual(results2[0].uid, "102")
            self.assertEqual(results2[0].saved_paths[0].name, "c.pdf")

    def test_no_new_mails_returns_empty(self):
        client = FakeImapClient(mails={50: _build_email(
            attachments=[("a.pdf", b"A", "application", "pdf")])})
        with tempfile.TemporaryDirectory() as tmp:
            state = Path(tmp) / "s.txt"
            state.write_text("50", encoding="utf-8")
            results, latest = mailbox.fetch_to_inbox(
                user="u", password="p",
                inbox_dir=Path(tmp) / "_inbox", state_file=state,
                imap_factory=_factory(client), mode="incremental",
            )
            self.assertEqual(results, [])
            self.assertEqual(latest, 50)


class InvoiceUrlExtractionTests(unittest.TestCase):
    """v2.5.8 阶段 B:从正文 HTML/text 抽取 PDF 发票链接(京东等)。"""

    def test_jd_oss_pdf_url_matched(self):
        body = ("您的发票:\n"
                "https://eicore-invoice-26.s3.cn-north-1.jdcloud-oss.com/"
                "digital-invoice/digital_26447000001148968620.pdf?AWSAccessKeyId=X&Signature=Y")
        msg = email.message_from_string(
            f"MIME-Version: 1.0\nContent-Type: text/plain; charset=utf-8\n\n{body}"
        )
        urls = mailbox._extract_invoice_urls(msg)
        self.assertEqual(len(urls), 1)
        self.assertIn("digital_26447000001148968620.pdf", urls[0])

    def test_generic_invoice_url_matched(self):
        body = "下载链接:https://example.com/fapiao/abc.pdf?token=xx"
        msg = email.message_from_string(
            f"MIME-Version: 1.0\nContent-Type: text/plain; charset=utf-8\n\n{body}"
        )
        urls = mailbox._extract_invoice_urls(msg)
        self.assertEqual(len(urls), 1)

    def test_non_pdf_url_not_matched(self):
        body = "https://example.com/invoice/abc.html\nhttps://example.com/fapiao.zip"
        msg = email.message_from_string(
            f"MIME-Version: 1.0\nContent-Type: text/plain; charset=utf-8\n\n{body}"
        )
        urls = mailbox._extract_invoice_urls(msg)
        self.assertEqual(urls, [])

    def test_duplicate_urls_dedup(self):
        body = "https://x.jdcloud-oss.com/a.pdf same url again https://x.jdcloud-oss.com/a.pdf"
        msg = email.message_from_string(
            f"MIME-Version: 1.0\nContent-Type: text/plain; charset=utf-8\n\n{body}"
        )
        urls = mailbox._extract_invoice_urls(msg)
        self.assertEqual(len(urls), 1)


class UrlDownloadTests(unittest.TestCase):
    """v2.5.8 阶段 B:URL 下载 → _inbox,sha256 去重。"""

    def test_url_downloader_invoked_for_link_only_email(self):
        # 模拟京东链接式邮件(无附件,正文有 PDF 链接)
        body = ("您的电子发票已开具\n"
                "https://eicore-invoice-26.s3.cn-north-1.jdcloud-oss.com/"
                "digital-invoice/digital_2644700001148968620.pdf?key=x")
        msg = MIMEMultipart()
        msg["Subject"] = "京东电子发票"
        msg["From"] = "jd@jd.com"
        msg.attach(MIMEText(body, "plain"))
        raw_bytes = msg.as_bytes()

        # 模拟 downloader:把链接写成假 PDF
        downloaded = []
        def fake_downloader(dest_dir, url, existing_hashes=None):
            target = dest_dir / Path(url.split("?")[0]).name
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(b"%PDF-1.4 fake")
            downloaded.append(url)
            return target

        with tempfile.TemporaryDirectory() as tmp:
            dest = Path(tmp) / "Lynne"
            result = mailbox._process_message(
                raw_bytes, uid=1, dest_dir=dest, subject_keywords=None,
                extensions=mailbox.PDF_OR_IMAGE,
                url_downloader=fake_downloader,
            )
            self.assertEqual(len(downloaded), 1)
            self.assertEqual(len(result.saved_paths), 1)

    def test_follow_invoice_urls_disabled(self):
        body = "https://x.jdcloud-oss.com/a.pdf"
        msg = MIMEMultipart()
        msg["Subject"] = "test"
        msg["From"] = "x@x.com"
        msg.attach(MIMEText(body, "plain"))
        raw_bytes = msg.as_bytes()
        called = []
        def fake(dest_dir, url, existing_hashes=None):
            called.append(url)
            return None
        with tempfile.TemporaryDirectory() as tmp:
            mailbox._process_message(
                raw_bytes, uid=2, dest_dir=Path(tmp) / "Lynne",
                subject_keywords=None, extensions=mailbox.PDF_OR_IMAGE,
                follow_invoice_urls=False, url_downloader=fake,
            )
        self.assertEqual(called, [])


class FetchWindowModeTests(unittest.TestCase):
    """v2.5.8:window 模式 = 每次扫 SINCE 窗口全量,sha256 防重复保存,防漏 fetch。"""

    def test_window_mode_rescans_old_uids(self):
        """state file 有 last_uid=101,window 模式仍扫到 uid<=101(防漏)。"""
        client = FakeImapClient(mails={
            100: _build_email(attachments=[("a.pdf", b"A", "application", "pdf")]),
            101: _build_email(attachments=[("b.pdf", b"B", "application", "pdf")]),
        })
        with tempfile.TemporaryDirectory() as tmp:
            inbox = Path(tmp) / "_inbox"
            state = Path(tmp) / "s.txt"
            state.write_text("101", encoding="utf-8")
            r_inc, _ = mailbox.fetch_to_inbox(
                user="u", password="p", inbox_dir=inbox, state_file=state,
                imap_factory=_factory(client), mode="incremental",
            )
            self.assertEqual(len(r_inc), 0)
            # window 重扫 → 2 结果(防漏)
            inbox2 = Path(tmp) / "_inbox2"
            state2 = Path(tmp) / "s2.txt"
            state2.write_text("101", encoding="utf-8")
            r_win, _ = mailbox.fetch_to_inbox(
                user="u", password="p", inbox_dir=inbox2, state_file=state2,
                imap_factory=_factory(client), mode="window",
            )
            self.assertEqual(len(r_win), 2)

    def test_window_mode_sha256_dedup_prevents_duplicate_save(self):
        """同内容附件再扫一遍,不重复保存到 _inbox。"""
        client = FakeImapClient(mails={
            10: _build_email(attachments=[("inv.pdf", b"PDF-CONTENT", "application", "pdf")]),
        })
        with tempfile.TemporaryDirectory() as tmp:
            inbox = Path(tmp) / "_inbox"
            state = Path(tmp) / "s.txt"
            r1, _ = mailbox.fetch_to_inbox(
                user="u", password="p", inbox_dir=inbox, state_file=state,
                imap_factory=_factory(client), mode="window",
            )
            self.assertEqual(len(r1[0].saved_paths), 1)
            files_before = sorted(p.name for p in (inbox / "Lynne").iterdir())
            # 第 2 次跑同邮件
            r2, _ = mailbox.fetch_to_inbox(
                user="u", password="p", inbox_dir=inbox, state_file=state,
                imap_factory=_factory(client), mode="window",
            )
            # 第 2 次 saved_paths 为空(sha256 命中)
            self.assertEqual(r2[0].saved_paths, [])
            files_after = sorted(p.name for p in (inbox / "Lynne").iterdir())
            self.assertEqual(files_before, files_after)   # 文件数不变


class FetchCollisionTests(unittest.TestCase):
    def test_duplicate_filename_gets_suffix(self):
        client = FakeImapClient(mails={
            1: _build_email(attachments=[("dup.pdf", b"v1", "application", "pdf")]),
            2: _build_email(attachments=[("dup.pdf", b"v2", "application", "pdf")]),
        })
        with tempfile.TemporaryDirectory() as tmp:
            results, _ = mailbox.fetch_to_inbox(
                user="u", password="p",
                inbox_dir=Path(tmp) / "_inbox", state_file=Path(tmp) / "s.txt",
                imap_factory=_factory(client),
            )
            saved_names = [r.saved_paths[0].name for r in results if r.saved]
            self.assertEqual(saved_names, ["dup.pdf", "dup (1).pdf"])


class FetchCjkFilenameTests(unittest.TestCase):
    def test_cjk_attachment_name_decoded(self):
        # MIMEApplication add_header 会自动 RFC 2231 编码 CJK 文件名
        client = FakeImapClient(mails={
            1: _build_email(attachments=[("发票-王玲.pdf", b"X", "application", "pdf")])
        })
        with tempfile.TemporaryDirectory() as tmp:
            results, _ = mailbox.fetch_to_inbox(
                user="u", password="p",
                inbox_dir=Path(tmp) / "_inbox", state_file=Path(tmp) / "s.txt",
                imap_factory=_factory(client),
            )
            self.assertTrue(results[0].saved)
            self.assertEqual(results[0].saved_paths[0].name, "发票-王玲.pdf")


class LoginFailureTests(unittest.TestCase):
    def test_login_failure_raises(self):
        client = FakeImapClient(login_should_fail=True)
        with tempfile.TemporaryDirectory() as tmp:
            with self.assertRaises(RuntimeError):
                mailbox.fetch_to_inbox(
                    user="u", password="p",
                    inbox_dir=Path(tmp) / "_inbox",
                    state_file=Path(tmp) / "s.txt",
                    imap_factory=_factory(client),
                )


class SafeUrlSsrfTests(unittest.TestCase):
    """v2.5.9:codex 评审发现的 SSRF 绕过(数字 IP / 解析私网域名)"""

    def test_https_public_ip_allowed(self):
        # 公网 IP 字面量(Cloudflare 1.1.1.1)— 应放行
        self.assertTrue(mailbox._safe_url("https://1.1.1.1/invoice.pdf"))

    def test_http_scheme_blocked(self):
        self.assertFalse(mailbox._safe_url("http://example.com/invoice.pdf"))

    def test_file_scheme_blocked(self):
        self.assertFalse(mailbox._safe_url("file:///etc/passwd"))

    def test_loopback_literal_blocked(self):
        self.assertFalse(mailbox._safe_url("https://127.0.0.1/a.pdf"))

    def test_private_cidr_blocked(self):
        self.assertFalse(mailbox._safe_url("https://10.0.0.1/a.pdf"))
        self.assertFalse(mailbox._safe_url("https://192.168.1.1/a.pdf"))

    def test_link_local_metadata_blocked(self):
        # AWS/GCP metadata endpoint
        self.assertFalse(mailbox._safe_url("https://169.254.169.254/latest/meta-data/"))

    def test_decimal_integer_ip_bypass_blocked(self):
        # 2130706433 == 127.0.0.1 — codex 发现的绕过
        self.assertFalse(mailbox._safe_url("https://2130706433/a.pdf"))

    def test_hex_ip_bypass_blocked(self):
        # 0x7f000001 == 127.0.0.1
        self.assertFalse(mailbox._safe_url("https://0x7f000001/a.pdf"))

    def test_short_ipv4_bypass_blocked(self):
        # 127.1 → 127.0.0.1
        self.assertFalse(mailbox._safe_url("https://127.1/a.pdf"))

    def test_ipv6_loopback_blocked(self):
        self.assertFalse(mailbox._safe_url("https://[::1]/a.pdf"))


class SafeSubdirTraversalTests(unittest.TestCase):
    """v2.5.9:reimburser_subdir traversal 防护"""

    def test_normal_names_pass(self):
        self.assertEqual(mailbox._safe_subdir("wzb"), "wzb")
        self.assertEqual(mailbox._safe_subdir("Lynne"), "Lynne")

    def test_slash_rejected(self):
        with self.assertRaises(ValueError):
            mailbox._safe_subdir("../sensitive")

    def test_backslash_rejected(self):
        with self.assertRaises(ValueError):
            mailbox._safe_subdir("foo\\bar")

    def test_null_byte_rejected(self):
        with self.assertRaises(ValueError):
            mailbox._safe_subdir("foo\x00bar")

    def test_leading_dot_rejected(self):
        with self.assertRaises(ValueError):
            mailbox._safe_subdir(".hidden")


if __name__ == "__main__":
    unittest.main()
