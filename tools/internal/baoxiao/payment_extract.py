"""付款证明截图字段提取(Req 4)。

设计:跟 extract.py 同模式 — 解析契约 + GPT vision/cowork 两条路。

付款截图通常是微信/支付宝/银行转账截图,关键字段:
  - 交易时间(YYYYMMDD HHMM)
  - 原币金额(应该跟 invoice.amount 匹配,用于关联)
  - 原币 currency
  - 实际付款人民币金额(amount_cny,可能 ≠ 汇率换算值,有手续费)
  - 付款方式(可选,展示用)
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


_PAYMENT_SYSTEM_PROMPT = (
    "你是付款证明截图字段提取器(微信/支付宝/银行/信用卡 海外消费等)。看图后只输出一个 JSON 对象,键:"
    "payment_date(交易时间,格式 YYYYMMDD,带时间用 YYYYMMDDHHMM)、"
    "amount_original(交易原币金额数字,纯数字不带符号)、"
    "currency(原币种 USD/HKD/EUR/CNY 等;无原币标识默认 CNY)、"
    "amount_cny(实际扣款人民币数字,信用卡/支付宝跨境消费会显示「实付 ¥XXX」/「人民币 XXX」)、"
    "payment_method(付款方式,如「微信支付」「支付宝」「招行 Visa 信用卡」「支付宝跨境消费」)、"
    "confidence(0-1 整体识别置信度)、"
    "is_payment_proof(布尔,该图确实是付款证明 / 银行流水 / 信用卡账单截图时 true;若是 invoice / 收据 / 其他图 → false)。"
    "重要:仅原币 = CNY 时 amount_original 和 amount_cny 可能相等;"
    "其他币种 amount_cny 必须从「实付」「人民币」等中文关键词附近的数字读,不要自己换算汇率。"
    "读不出的字段给空字符串或 null。除 JSON 外不要输出任何文字。"
)


@dataclass
class PaymentProofFields:
    payment_date: str = ""
    amount_original: Optional[float] = None
    currency: str = "CNY"
    amount_cny: Optional[float] = None
    payment_method: str = ""
    confidence: float = 0.0
    is_payment_proof: bool = False
    needs_review: bool = True


def _coerce_amount(value):
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    cleaned = re.sub(r"[^0-9.\-]", "", str(value))
    try:
        return float(cleaned)
    except ValueError:
        return None


def parse_payment_extraction(raw, confidence_threshold=DEFAULT_CONFIDENCE_THRESHOLD):
    if not isinstance(raw, dict):
        return PaymentProofFields(needs_review=True)
    amount_orig = _coerce_amount(raw.get("amount_original"))
    amount_cny = _coerce_amount(raw.get("amount_cny"))
    f = PaymentProofFields(
        payment_date=str(raw.get("payment_date") or "").strip(),
        amount_original=amount_orig,
        currency=(str(raw.get("currency") or "").strip() or "CNY"),
        amount_cny=amount_cny,
        payment_method=str(raw.get("payment_method") or "").strip(),
        confidence=float(raw.get("confidence") or 0.0),
        is_payment_proof=bool(raw.get("is_payment_proof")),
    )
    f.needs_review = (
        f.confidence < confidence_threshold
        or f.amount_original is None
        or not f.payment_date
        or not f.is_payment_proof    # 截图不是付款证明 → 不归档
    )
    return f


def build_payment_messages(data_url):
    return [
        {"role": "system", "content": _PAYMENT_SYSTEM_PROMPT},
        {"role": "user", "content": [
            {"type": "text", "text": "提取这张付款截图的字段,严格输出 JSON。"},
            {"type": "image_url", "image_url": {"url": data_url}},
        ]},
    ]


def parse_gpt_payment_response(resp):
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
        import fitz
    except ImportError as e:
        raise RuntimeError("PDF 付款证明需 PyMuPDF: pip install pymupdf") from e
    doc = fitz.open(str(path))
    return doc[0].get_pixmap(dpi=200).tobytes("png")


def image_to_data_url(path):
    path = Path(path)
    if path.suffix.lower() == ".pdf":
        b64 = base64.b64encode(_pdf_first_page_png(path)).decode()
        return f"data:image/png;base64,{b64}"
    mime = mimetypes.guess_type(str(path))[0] or "image/png"
    b64 = base64.b64encode(path.read_bytes()).decode()
    return f"data:{mime};base64,{b64}"


def gpt_payment_extractor(api_key, model="gpt-4o-mini"):
    """返回 callable(path)->PaymentProofFields,供 process_payments_drop 注入。"""
    import requests

    def _extract(path):
        messages = build_payment_messages(image_to_data_url(path))
        r = requests.post(
            OPENAI_URL,
            headers={"Authorization": f"Bearer {api_key}"},
            json={"model": model, "messages": messages, "temperature": 0,
                  "response_format": {"type": "json_object"}},
            timeout=60,
        )
        return parse_payment_extraction(parse_gpt_payment_response(r.json()))

    return _extract
