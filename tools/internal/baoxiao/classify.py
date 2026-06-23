"""报销类目分类:类目线索 → 报销类型(只在规则表内选,未命中→其他费用)。

rules 格式(对应 category-map.yaml,内容为业务输入):
    [{"category": "差旅费", "keywords": ["机票", "酒店", ...]}, ...]
按列表顺序匹配,第一条命中即返回(优先级靠前的规则先匹配)。
AI 只产出 hint,真正归类落在这张固定规则表内,不自由发挥。

UNKNOWN = "其他费用" 对应飞书表「其他费用(备注说明)」单选项,
fallback 时需要 Lynne 在账本「备注」列说明具体是啥。
"""

import yaml
from pathlib import Path

UNKNOWN = "其他费用"


def load_rules(path):
    """从 category-map.yaml 读规则列表;无 rules 键返回空表。"""
    data = yaml.safe_load(Path(path).expanduser().read_text(encoding="utf-8")) or {}
    return data.get("rules", [])


def classify(hint, rules):
    if not isinstance(hint, str) or not hint.strip():
        return UNKNOWN
    for rule in rules:
        for kw in rule.get("keywords", []):
            if kw and kw in hint:
                return rule["category"]
    return UNKNOWN
