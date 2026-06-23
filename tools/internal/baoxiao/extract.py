"""发票字段提取。

parse_extraction: 把模型返回的结构化字典解析为 InvoiceFields,
并按"低置信 / 缺号 / 缺额 / 缺日期"判定 needs_review(对应飞书「数据待核」)。
OCR 失败常是"读错且自信",所以靠 needs_review 人工兜底,不靠失败回退信号。

真正的 Claude 多模态调用 + prompt 阻塞于 ANTHROPIC_API_KEY 与真实发票样本(评测用);
本模块只锁定解析契约,API 层后续接上即可(模型须产出本契约的字段)。
"""

import base64
import json
import mimetypes
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

DEFAULT_CONFIDENCE_THRESHOLD = 0.8
OPENAI_URL = "https://api.openai.com/v1/chat/completions"

_SYSTEM_PROMPT = (
    "你是发票字段提取器。看图后只输出一个 JSON 对象,键:"
    "invoice_date(开票日期 YYYYMMDD)、amount(金额数字,价税合计 / Total 含税额)、"
    "currency(币种 CNY/USD/HKD 等)、invoice_number(发票号码)、vendor(销售方/抬头)、"
    "billed_to(购买方/Bill to 抬头,如「广州进格智能科技有限公司」或个人姓名)、"
    "invoice_type(发票类型,严格按发票标题判断:"
    "标题含「专用」二字(如「电子发票（专用发票）」「增值税专用发票」)→ \"专票\";"
    "标题含「普通」二字(如「电子发票（普通发票）」「增值税普通发票」)→ \"普票\";"
    "海外英文 Invoice(无中文「专用」/「普通」字样) → \"invoice\";"
    "其他/看不清 → 留空。重要:无论金额多大、是否电脑/电子设备,都必须以发票标题文字为唯一依据,"
    "不要因为是「电子产品/MacBook/拼多多」等就猜成专票)、"
    "category_hint(费用类别线索,如 机票/打车/服务器/办公)、confidence(0-1 整体识别置信度)、"
    "description(一句话写清楚:商家+商品或服务+用途,如「Apple Mac Mini 10C/24GB 电脑设备」)、"
    "is_receipt(布尔,该图是付款收据/支付截图而非正式发票时为 true)。"
    "读不出的字段给空字符串或 null。除 JSON 外不要输出任何文字。"
)


@dataclass
class InvoiceFields:
    invoice_date: str = ""
    amount: Optional[float] = None
    currency: str = "CNY"
    invoice_number: str = ""
    vendor: str = ""
    category_hint: str = ""
    confidence: float = 0.0
    needs_review: bool = True
    description: str = ""    # 人类可读说明:商家 + 商品/服务 + 用途(写进账本「备注」列)
    is_receipt: bool = False  # 付款收据(receipt 不能作报销凭证),ingest 时 skip 不入账
    invoice_type: str = ""    # "普票"(国内增值税普通)/ "专票"(国内增值税专用,可抵扣)/ "invoice"(海外)/ ""
    billed_to: str = ""       # 发票对象抬头(Bill to / 购买方)


def _coerce_amount(value):
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    cleaned = re.sub(r"[^0-9.\-]", "", str(value))  # 去掉 ¥ $ 千分位逗号等
    try:
        return float(cleaned)
    except ValueError:
        return None


def parse_extraction(raw, confidence_threshold=DEFAULT_CONFIDENCE_THRESHOLD):
    if not isinstance(raw, dict):
        return InvoiceFields(needs_review=True)

    amount = _coerce_amount(raw.get("amount"))
    f = InvoiceFields(
        invoice_date=str(raw.get("invoice_date") or "").strip(),
        amount=amount,
        currency=(str(raw.get("currency") or "").strip() or "CNY"),
        invoice_number=str(raw.get("invoice_number") or "").strip(),
        vendor=str(raw.get("vendor") or "").strip(),
        category_hint=str(raw.get("category_hint") or "").strip(),
        confidence=float(raw.get("confidence") or 0.0),
        description=str(raw.get("description") or "").strip(),
        is_receipt=bool(raw.get("is_receipt")),
        invoice_type=str(raw.get("invoice_type") or "").strip(),
        billed_to=str(raw.get("billed_to") or "").strip(),
    )
    f.needs_review = (
        f.confidence < confidence_threshold
        or f.amount is None
        or not f.invoice_number
        or not f.invoice_date
    )
    return f


# --- GPT-4o-mini 视觉提取(纯逻辑可测;真实调用 + PDF转图 + 评测待 key/样本)---

def build_extraction_messages(data_url):
    """组装 OpenAI 视觉 messages(系统提示点名字段 + 用户带图)。"""
    return [
        {"role": "system", "content": _SYSTEM_PROMPT},
        {"role": "user", "content": [
            {"type": "text", "text": "提取这张发票/invoice 的字段,严格输出 JSON。"},
            {"type": "image_url", "image_url": {"url": data_url}},
        ]},
    ]


def parse_gpt_response(resp):
    """从 OpenAI 响应里抠出 JSON 对象;抠不出/解析失败返回 {}(交给 parse_extraction 标待核)。"""
    try:
        content = resp["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError):
        return {}
    text = content.strip()
    m = re.search(r"```(?:json)?\s*(\{.*\})\s*```", text, re.DOTALL) or re.search(r"\{.*\}", text, re.DOTALL)
    if m:
        text = m.group(1) if m.lastindex else m.group(0)
    try:
        d = json.loads(text)
        return d if isinstance(d, dict) else {}
    except (json.JSONDecodeError, ValueError):
        return {}


def _pdf_first_page_png(path):
    try:
        import fitz  # PyMuPDF,惰性导入
    except ImportError as e:
        raise RuntimeError("处理 PDF 发票需要 PyMuPDF:pip install pymupdf") from e
    doc = fitz.open(str(path))
    return doc[0].get_pixmap(dpi=200).tobytes("png")


def image_to_data_url(path):
    """发票文件 → data URL。图片直接编码;PDF 取首页渲染成 PNG(惰性依赖 pymupdf)。"""
    path = Path(path)
    if path.suffix.lower() == ".pdf":
        b64 = base64.b64encode(_pdf_first_page_png(path)).decode()
        return f"data:image/png;base64,{b64}"
    mime = mimetypes.guess_type(str(path))[0] or "image/png"
    b64 = base64.b64encode(path.read_bytes()).decode()
    return f"data:{mime};base64,{b64}"


def gpt_extractor(api_key, model="gpt-4o-mini"):
    """返回 callable(path)->InvoiceFields,供 sync 注入。真实调用 OpenAI 视觉。"""
    import requests

    def _extract(path):
        messages = build_extraction_messages(image_to_data_url(path))
        r = requests.post(
            OPENAI_URL,
            headers={"Authorization": f"Bearer {api_key}"},
            json={"model": model, "messages": messages, "temperature": 0,
                  "response_format": {"type": "json_object"}},
            timeout=60,
        )
        return parse_extraction(parse_gpt_response(r.json()))

    return _extract
