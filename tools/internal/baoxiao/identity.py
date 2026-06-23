"""发票身份键。

content_sha256: 文件字节哈希,作技术幂等键(防同一文件被处理两次)。
pdf_text_sha256: PDF 文本层哈希,接住"同发票被重新打包/水印"导致 content_sha256 漂移的场景。
extract_pdf_text_invoice_numbers: 从 PDF 文本层抽 20 位发票号串,供 OCR 互验。
normalize_invoice_key: 规范化发票号,作业务查重提示(接住同票不同文件);不作唯一键。
"""

import hashlib
import re
import subprocess
import sys
import unicodedata
from pathlib import Path

# 国内增值税电子发票号码 = 20 位连续数字;前后不可再接数字,避免 21 位字串误剥前 20 位
_INVOICE_NUMBER_RE = re.compile(r"(?<!\d)\d{20}(?!\d)")

# 只剥这些明确的前缀(带点的 NO. 和井号),不剥裸 "NO" 以免误伤合法编码
_PREFIXES = ("NO.", "#")


def content_sha256(data):
    """接受 bytes 或文件路径,返回 sha256 十六进制串。"""
    if isinstance(data, (bytes, bytearray)):
        return hashlib.sha256(bytes(data)).hexdigest()
    return hashlib.sha256(Path(data).read_bytes()).hexdigest()


_pdftotext_warned = False


def _read_pdf_text(path) -> bytes:
    """v2.5.9 内部 helper:pdftotext -layout 输出原始 bytes,失败一律返回 b''。
    供 pdf_text_sha256 / extract_pdf_text_invoice_numbers 共用 — 一次 subprocess。

    关键防线(review 实锤的 P0):图像扫描件 PDF 无文本层时 pdftotext 成功返回
    rc=0 + stdout = b'\\x0c' × 页数(每页一个 form feed)。这种"全空白"输出对
    所有扫描件都相同 → 若直接哈希,第一张扫描件之后的所有扫描发票互相碰撞,
    被误判 duplicate_by_content 静默吞进 _conflict。空白/form-feed-only 一律
    视为"无文本层",返回 b''(调用方降级到字节哈希 + invoice_number 防线)。
    """
    global _pdftotext_warned
    p = Path(path)
    if not p.is_file() or p.suffix.lower() != ".pdf":
        return b""
    try:
        proc = subprocess.run(
            ["pdftotext", "-layout", str(p), "-"],
            capture_output=True, timeout=10, check=False,
        )
    except FileNotFoundError:
        # pdftotext 不在 PATH → 文本层防线整体降级;只警告一次,避免批量刷屏
        if not _pdftotext_warned:
            _pdftotext_warned = True
            print("⚠️ pdftotext 不可用(brew install poppler),"
                  "pdf_text_sha256 去重与互验防线已降级", file=sys.stderr)
        return b""
    except (OSError, subprocess.TimeoutExpired):
        return b""
    if proc.returncode != 0:
        return b""
    if not proc.stdout.strip(b"\x0c\r\n\t "):
        return b""
    return proc.stdout


def pdf_text_sha256(path) -> str:
    """v2.5.9:抽 PDF 文本层算 sha256,作 ingest 第二道去重防线。

    场景:同发票被两个 reimburser 各自下载/cowork 拉一遍,字节流不同
    (邮件 attachment 重新打包 / MIME 边界变 / iCloud 元数据写入),content_sha256
    不一致 → 旧 dedup 两道都失效 → 重复 row。PDF 文本层对"字节漂移"鲁棒,文本一致。

    返回:64-hex(成功)/ ""(非 PDF / pdftotext 不在 / 加密 / 扫描件无文本)。
    永不抛 —— ingest 关键路径,失败必须降级。
    """
    data = _read_pdf_text(path)
    if not data:
        return ""
    return hashlib.sha256(data).hexdigest()


def extract_pdf_text_invoice_numbers(path) -> list:
    """v2.5.9 Day 3:从 PDF 文本层抽所有 20 位连续数字串 — 候选发票号。

    用途:OCR 互验。OCR 字段是 vision 模型推断,可能错读单字符(本次事故 `...22554`
    实际 `...22558`)。pdftotext 直接读 PDF 文本层,对单字符错读免疫,但有自己的失败
    模式(扫描件 / 加密 / 缺 ToUnicode CMap)。两者一致 = 高置信;不一致 = needs_review。

    返回:出现顺序去重的 list[str](最多几个),空 list = 抽不到 20 位串(可能是海外
    invoice 用 INV0511... 等非纯数字号 / 扫描件 / 非 PDF)。永不抛。

    设计原则:绝不直接用 pdftotext 结果覆盖 OCR 值 — 这只是 cross-check signal,
    不一致时 flag needs_review 让 Lynne 人工裁决,避免互验本身引入新错误。
    """
    data = _read_pdf_text(path)
    if not data:
        return []
    text = data.decode("utf-8", errors="ignore")
    seen, seen_set = [], set()
    for m in _INVOICE_NUMBER_RE.finditer(text):
        v = m.group(0)
        if v not in seen_set:
            seen.append(v)
            seen_set.add(v)
    return seen


def normalize_invoice_key(raw):
    """去全角/空白/前缀并大写;非字符串或空白返回空串。"""
    if not isinstance(raw, str):
        return ""
    s = unicodedata.normalize("NFKC", raw)  # 全角→半角,全角空格→普通空格
    s = "".join(s.split())                   # 去掉所有空白
    s = s.upper()
    for prefix in _PREFIXES:
        if s.startswith(prefix):
            return s[len(prefix):]
    return s
