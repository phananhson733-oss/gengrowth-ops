"""发票文件命名:所属期 / 报销类目 / 币种符号 / 金额格式 / 文件名拼接。

文件名规则(对齐 task doc):{所属期}-{报销类目}-{币种符号}{金额}[-{发票号末4位}].{ext}
- 所属期 = 开票日期的 YYYYMM(开票时间是客观事实,不会变)
- 报销类目 = 归档时的分类快照(9 项之一);后续 Lynne 改账本 category 字段不会回写文件名
- collision suffix:同期同类同额时用发票号末 4 位区分(Invoice + Receipt 双凭证场景)
"""

import datetime

_CURRENCY = {
    "CNY": "¥",
    "USD": "$",
    "EUR": "€",
    "HKD": "HK$",
    "GBP": "£",
    "JPY": "¥",
}


def invoice_period(invoice_date):
    """开票日期 → YYYYMM。接受 date/datetime、'YYYYMMDD'、'YYYY-MM-DD'。"""
    if isinstance(invoice_date, (datetime.date, datetime.datetime)):
        return invoice_date.strftime("%Y%m")
    digits = "".join(ch for ch in str(invoice_date) if ch.isdigit())
    return digits[:6]


def currency_symbol(code):
    """币种代码 → 符号;未知则回退为代码本身。"""
    return _CURRENCY.get(str(code).upper(), str(code).upper())


def format_amount(amount):
    """金额格式:整数不带小数,否则去尾零(1000→'1000', 64.80→'64.8')。"""
    return f"{float(amount):.2f}".rstrip("0").rstrip(".")


def build_filename(period, category, currency_code, amount, ext, suffix=None):
    """{period}-{category}-{currency_symbol}{amount}[-{suffix}].{ext}

    suffix 用于同名碰撞时追加发票号末 4 位(如 Ahrefs Invoice + Receipt 同 $129)。
    """
    stem = f"{period}-{category}-{currency_symbol(currency_code)}{format_amount(amount)}"
    if suffix:
        stem = f"{stem}-{suffix}"
    return f"{stem}.{ext}"
