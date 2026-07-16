#!/usr/bin/env python3
"""
产品调研报告验证器
验证报告是否符合 production-survey skill 的结构和深度要求。

用法：
  python3 validate-report.py <report.md>
  python3 validate-report.py ./参考资料/产品分析/brave-分析报告.md
"""

import re
import sys
from pathlib import Path
from dataclasses import dataclass, field
from typing import Optional

# ── 验证规则定义 ──────────────────────────────────────────────

@dataclass
class CheckResult:
    name: str
    passed: bool
    detail: str = ""

@dataclass
class ValidationReport:
    file_path: str
    results: list = field(default_factory=list)

    def add(self, name: str, passed: bool, detail: str = ""):
        self.results.append(CheckResult(name, passed, detail))

    @property
    def passed_count(self):
        return sum(1 for r in self.results if r.passed)

    @property
    def failed_count(self):
        return sum(1 for r in self.results if not r.passed)

    @property
    def total(self):
        return len(self.results)


# ── 必需章节（宽容匹配：编号可变，支持中英文变体）────────────

REQUIRED_SECTIONS = [
    ("产品总览",
     r'##\s*[一二三四五六七八九十\d]+[、.]\s*产品总览'),
    ("关键数据趋势",
     r'##\s*[一二三四五六七八九十\d]+[、.]\s*关键数据趋势'),
    ("竞品对比",
     r'##\s*[一二三四五六七八九十\d]+[、.]\s*(?:竞品对比|市场规模)'),
    ("深度分析",
     r'##\s*[一二三四五六七八九十\d]+[、.]\s*深度分析'),
    ("变现与收入模式",
     r'###\s*\d+\.\d+\s*变现与收入模式'),
    ("用户增长与获客",
     r'###\s*\d+\.\d+\s*用户增长与获客'),
    ("竞争定位",
     r'###\s*\d+\.\d+\s*竞争定位'),
    ("产品类型专项分析",
     r'###\s*\d+\.\d+\s*产品类型专项分析'),
    ("产品架构与技术栈",
     r'###\s*\d+\.\d+\s*产品架构与技术栈'),
    ("UX 与产品设计",
     r'###\s*\d+\.\d+\s*UX\s*与产品设计'),
    ("Go-to-Market 策略",
     r'###\s*\d+\.\d+\s*Go-to-Market\s*策略'),
    ("合规与监管",
     r'###\s*\d+\.\d+\s*合规与监管'),
    ("重点市场专项",
     r'###\s*\d+\.\d+\s*重点市场专项'),
    ("综合评估与建议",
     r'##\s*[一二三四五六七八九十\d]+[、.]\s*综合评估与建议'),
    ("参考来源",
     r'##\s*参考来源'),
]

REQUIRED_SUB_SECTIONS = [
    ("SWOT 分析",
     r'(?:SWOT|优势与劣势|竞争定位)'),
    ("SWOT - 优势",
     r'####?\s*优势'),
    ("SWOT - 劣势",
     r'####?\s*劣势'),
    ("SWOT - 机遇",
     r'####?\s*机遇'),
    ("SWOT - 威胁",
     r'####?\s*威胁'),
    ("功能对比矩阵",
     r'####?\s*功能对比矩阵'),
    ("Porter's Five Forces",
     r'(?:Porter|五力分析|Five\s*Forces)'),
    ("综合评分",
     r'###?\s*综合评分'),
    ("估值参考",
     r'###?\s*估值参考'),
    ("战略建议",
     r'###?\s*战略建议'),
    ("风险矩阵",
     r'###?\s*风险矩阵'),
    ("场景/情景规划",
     r'###?\s*(?:场景规划|情景规划|场景分析|Scenario)'),
]

# ── 必需表格 ──────────────────────────────────────────────────

REQUIRED_TABLES = [
    ("产品总览表", "产品总览",
     ["产品名", "所属公司", "营收", "用户", "商业模式"]),
    ("数据趋势表", "数据趋势",
     ["时间"]),
    ("竞品对比表", "竞品对比",
     ["定位"]),
    ("TAM/SAM/SOM", None,
     ["TAM", "SAM", "SOM"]),
    ("综合评分表", "综合评分",
     ["产品力", "增长", "变现", "竞争壁垒", "市场前景"]),
]

# ── 辅助函数 ──────────────────────────────────────────────────

def extract_between(content: str, start_kw: str, end_kw: Optional[str] = None) -> str:
    """按关键词提取两个章节标题之间的内容（模糊匹配）。"""
    start = content.find(start_kw)
    if start == -1:
        # 尝试忽略空格
        for m in re.finditer(re.escape(start_kw).replace(r'\ ', r'\s*'), content):
            start = m.start()
            break
    if start == -1:
        return ""

    if end_kw:
        end = content.find(end_kw, start + len(start_kw))
        if end == -1:
            return content[start:]
        return content[start:end]
    return content[start:]


def count_tables(text: str) -> int:
    """统计 markdown 表格数量。"""
    table_pattern = r'\|[^\n]+\|\s*\n\s*\|[\s\-:|]+\|\s*\n\s*\|[^\n]+\|'
    return len(re.findall(table_pattern, text))


def count_confidence_tags(text: str) -> dict:
    return {
        "High": len(re.findall(r'\[High\]', text)),
        "Medium": len(re.findall(r'\[Medium\]', text)),
        "Low": len(re.findall(r'\[Low\]', text)),
    }


def count_data_points(text: str) -> int:
    """粗略统计量化数据点。"""
    patterns = [
        r'\$[\d,.]+\s*[BMKbmk]?\b',
        r'[\d,.]+[BMKbmk]\b',
        r'[\d,.]+%',
        r'[\d,.]+\s*(?:MAU|DAU|用户|users|downloads)',
        r'⭐+',
    ]
    total = 0
    for p in patterns:
        total += len(re.findall(p, text, re.IGNORECASE))
    return total


def count_sources(text: str) -> int:
    section = extract_between(text, '参考来源')
    if not section:
        return 0
    return len(re.findall(r'\[.+?\]\(https?://.+?\)', section))


# ── 验证函数 ──────────────────────────────────────────────────

def validate_filename(filepath: str, report: ValidationReport):
    name = Path(filepath).name
    # 接受标准格式 [产品名字]-分析报告.md 或带后缀 [产品名字]-分析报告-<suffix>.md
    # 用于支持对比、版本管理（如 -skill版、-v2、-draft 等）场景
    if re.match(r'^.+-分析报告(?:-[^.]+)?\.md$', name):
        report.add("文件命名", True, f"`{name}`")
    else:
        report.add("文件命名", False,
                    f"`{name}` 不符合 `[产品名字]-分析报告.md` 或 `[产品名字]-分析报告-<suffix>.md` 格式")


def validate_header(content: str, report: ValidationReport):
    header_match = re.search(r'>\s*调研日期[：:]\s*(.+?)\s*\|', content)
    if header_match:
        report.add("报告头部 - 调研日期", True)
    else:
        report.add("报告头部 - 调研日期", False, "缺少 `> 调研日期：...` 头部")

    type_match = re.search(r'产品类型[：:]\s*(.+?)[\s|]', content)
    if type_match:
        report.add("报告头部 - 产品类型", True, type_match.group(1).strip())
    else:
        report.add("报告头部 - 产品类型", False, "缺少产品类型标注")


def validate_sections(content: str, report: ValidationReport):
    for name, pattern in REQUIRED_SECTIONS:
        found = bool(re.search(pattern, content, re.IGNORECASE))
        if found:
            report.add(f"章节 - {name}", True)
        else:
            report.add(f"章节 - {name}", False, f"缺少章节")


def validate_sub_sections(content: str, report: ValidationReport):
    for name, pattern in REQUIRED_SUB_SECTIONS:
        found = bool(re.search(pattern, content, re.IGNORECASE))
        if found:
            report.add(f"子章节 - {name}", True)
        else:
            report.add(f"子章节 - {name}", False, f"缺少子章节")


def validate_tables(content: str, report: ValidationReport):
    for table_name, section_kw, required_keywords in REQUIRED_TABLES:
        if section_kw:
            section = extract_between(content, section_kw)
            if not section:
                section = content
        else:
            section = content

        has_table = count_tables(section) > 0
        missing_kw = [kw for kw in required_keywords
                      if not re.search(re.escape(kw), section)]

        if has_table and not missing_kw:
            report.add(f"表格 - {table_name}", True)
        elif has_table and missing_kw:
            report.add(f"表格 - {table_name}", False,
                        f"表格存在但缺少字段: {', '.join(missing_kw)}")
        else:
            report.add(f"表格 - {table_name}", False, "未找到表格")


def validate_insights(content: str, report: ValidationReport):
    """验证各模块是否有核心洞察 blockquote（宽松匹配：> **核心洞察** 或 > 核心洞察）。"""
    # 匹配 > **核心洞察** 或 > 核心洞察 或 > **Key Insight**
    insight_count = len(re.findall(
        r'>\s*\*{0,2}核心洞察\*{0,2}', content, re.IGNORECASE
    ))

    if insight_count >= 7:
        report.add("核心洞察 blockquote", True,
                    f"{insight_count} 处核心洞察")
    elif insight_count >= 3:
        report.add("核心洞察 blockquote", False,
                    f"仅 {insight_count} 处核心洞察（建议 ≥7，每个分析模块一个）")
    else:
        report.add("核心洞察 blockquote", False,
                    f"仅 {insight_count} 处核心洞察（严重不足，要求 ≥7）")


def validate_confidence_tags(content: str, report: ValidationReport):
    tags = count_confidence_tags(content)
    total_tags = sum(tags.values())

    if total_tags >= 10:
        report.add("置信度标注", True,
                    f"共 {total_tags} 个（High:{tags['High']} Medium:{tags['Medium']} Low:{tags['Low']}）")
    elif total_tags >= 3:
        report.add("置信度标注", False,
                    f"仅 {total_tags} 个，建议 ≥10")
    else:
        report.add("置信度标注", False,
                    f"仅 {total_tags} 个，严重不足（要求 ≥10）")


def validate_depth(content: str, report: ValidationReport):
    """验证分析深度。"""
    # 表格数
    total_tables = count_tables(content)
    if total_tables >= 15:
        report.add("深度 - 表格数量", True, f"{total_tables} 个表格")
    else:
        report.add("深度 - 表格数量", False,
                    f"仅 {total_tables} 个表格（建议 ≥15）")

    # 数据点
    data_points = count_data_points(content)
    if data_points >= 30:
        report.add("深度 - 数据点密度", True, f"约 {data_points} 个量化数据点")
    else:
        report.add("深度 - 数据点密度", False,
                    f"约 {data_points} 个（建议 ≥30）")

    # 篇幅
    plain = re.sub(r'[|#*>`\-=]', '', content)
    char_count = len(plain.strip())
    if char_count >= 5000:
        report.add("深度 - 报告篇幅", True, f"约 {char_count:,} 字符")
    else:
        report.add("深度 - 报告篇幅", False,
                    f"约 {char_count:,} 字符（建议 ≥5,000）")

    # 参考来源
    source_count = count_sources(content)
    if source_count >= 5:
        report.add("深度 - 参考来源", True, f"{source_count} 条来源")
    else:
        report.add("深度 - 参考来源", False,
                    f"仅 {source_count} 条（建议 ≥5）")


def validate_hard_facts_sourcing(content: str, report: ValidationReport):
    """硬事实溯源检查 — 防止编造股票代码、市值、母公司归属等。
    扫描股票代码格式；如出现，必须能在§参考来源里找到对应交易所/财经站链接。"""

    # 提取§参考来源段
    sources = extract_between(content, '参考来源') or ""

    # 股票代码格式：
    #  - 港股: ####.HK / #####.HK
    #  - 深交所/上交所: ######.SZ / ######.SS / 创业板 30####
    #  - 美股: 大写字母 1-5 位 + 上下文（如 NYSE: / NASDAQ: / Ticker:）
    ticker_patterns = [
        (r'(\d{4,5}\.HK)\b', 'HK', ['hkex', 'hkexnews', '02420.HK', '00700', 'futubull', 'futunn', 'eastmoney.com/hk', 'finance.yahoo.com.*\\.HK', 'aastocks', 'tipranks.*\\.hk']),
        (r'(\d{6}\.SZ)\b', 'SZ', ['szse.cn', 'eastmoney.com.*\\.SZ', 'sina.*sz', 'tonghuashun', '10jqka']),
        (r'(\d{6}\.SS|\d{6}\.SH)\b', 'SS', ['sse.com.cn', 'eastmoney.com.*\\.SH']),
        (r'(?:NYSE|NASDAQ|Nasdaq|TSX|EPA|LON|EURONEXT)[:\s]+([A-Z]{1,5})\b', 'US/INTL', ['sec.gov', 'nyse.com', 'nasdaq.com', 'finance.yahoo.com', 'bloomberg.com', 'reuters.com']),
        # 深交所代码 (6 位数字开头 + 创业板 30 / 主板 00) 但无 .SZ 后缀的常见误写
        (r'\b深交所\s*(\d{6})\b', 'SZ-text', ['szse.cn', 'eastmoney.com']),
        (r'\b港交所\s*(\d{4,5})\b', 'HK-text', ['hkex', 'hkexnews', 'futubull']),
    ]

    issues = []
    tickers_found = []

    # 白名单：如果 ticker 附近（前后 40 字符内）出现"误标/错误/错版/wrong/incorrect/fabricated/更正"等词
    # 视为"已知错误叙述"，跳过来源检查（避免对"已修正的错误回顾"二次告警）
    correction_keywords = re.compile(
        r'(?:误标|错误|错版|错写|更正|修正|wrong|incorrect|fabricated|实际属于|完全无关|不存在|从未)',
        re.IGNORECASE
    )

    for pattern, exchange, source_keywords in ticker_patterns:
        for m in re.finditer(pattern, content):
            ticker = m.group(1)
            # 检查 ticker 周围上下文（前后 40 字符）是否为"错误叙述"
            ctx_start = max(0, m.start() - 40)
            ctx_end = min(len(content), m.end() + 40)
            context = content[ctx_start:ctx_end]
            if correction_keywords.search(context):
                continue  # 跳过 — 这是"已知错误的回顾性披露"
            tickers_found.append((ticker, exchange))
            # 检查§参考来源里是否有对应交易所/财经源
            found_source = False
            for kw in source_keywords:
                if re.search(kw, sources, re.IGNORECASE):
                    found_source = True
                    break
            if not found_source:
                issues.append(f"{ticker}({exchange}) 无对应来源")

    if not tickers_found:
        report.add("硬事实溯源（股票代码）", True,
                    "未出现具体股票代码（无需验证）")
    elif not issues:
        ticker_list = ", ".join(t for t, _ in tickers_found[:5])
        report.add("硬事实溯源（股票代码）", True,
                    f"{len(tickers_found)} 个股票代码均有交易所/财经源支持（{ticker_list}）")
    else:
        report.add("硬事实溯源（股票代码）", False,
                    "; ".join(issues) + " — §参考来源需补充对应交易所/Bloomberg/PitchBook 等链接")


def validate_positioning_evidence(content: str, report: ValidationReport):
    """检查§一 产品总览是否包含品牌 tagline 原文引文 — 防止定位漂移。
    启发式：扫描§一 是否存在 "..." 或 「...」 形式的直接引文（≥3 个字）。"""

    overview = extract_between(content, '一、产品总览', '二、关键数据趋势') \
        or extract_between(content, '产品总览', '关键数据趋势')

    if not overview:
        report.add("定位证据引文（tagline 原文）", False,
                    "未找到§一 产品总览章节")
        return

    # 接受多种引文形式：双引号 / 中文引号 / 反引号代码块
    # 排除 [High]/[Medium]/[Low] 等置信度标签
    patterns = [
        r'"[^"\n]{3,}"',           # ASCII 双引号
        r'"[^"\n]{3,}"',           # 中文双引号
        r'「[^」\n]{3,}」',         # 中文方引号
        r'`[^`\n]{5,}`',           # 反引号代码
    ]
    matches = []
    for p in patterns:
        matches.extend(re.findall(p, overview))

    # 过滤掉明显是路径/URL/标签的
    real_quotes = [m for m in matches
                   if not re.match(r'^["`]?(?:https?://|/|\[|MRR|ARR|High|Medium|Low|FY|YoY|Q[1-4])', m.strip('"`「」"'))]

    # 显式声明 "Not disclosed" 也算通过（合规性优于强制造假）
    has_not_disclosed = bool(re.search(
        r'(?:Not\s*disclosed|未披露|未公开).{0,30}(?:tagline|hero|copy|slogan)',
        overview, re.IGNORECASE
    ))

    if real_quotes:
        sample = real_quotes[0][:40] + ("..." if len(real_quotes[0]) > 40 else "")
        report.add("定位证据引文（tagline 原文）", True,
                    f"§一 含 {len(real_quotes)} 处引文，示例：{sample}")
    elif has_not_disclosed:
        report.add("定位证据引文（tagline 原文）", True,
                    "§一 明确标注 tagline 未披露（合规）")
    else:
        report.add("定位证据引文（tagline 原文）", False,
                    "§一 缺少 tagline / hero copy 原文引用（应使用 \"...\" / 「...」 直接引文，或写明 'Not disclosed'）")


def validate_table_widths(content: str, report: ValidationReport):
    """检查竞品对比和功能对比矩阵的列宽 — 防止 A4 纵向 PDF 不可读。
    硬规则：横向对比表 ≤5 列；超出必须拆为"主要竞品" + "次要竞品"。"""

    # 提取需要检查的章节（竞品对比 + 4.3 功能对比矩阵）
    sections_to_check = [
        ("三、竞品对比", extract_between(content, '三、竞品对比', '四、深度分析')
                       or extract_between(content, '竞品对比', '深度分析')),
        ("4.3 功能对比矩阵", extract_between(content, '功能对比矩阵', 'Porter')),
    ]

    violations = []
    for section_name, section_text in sections_to_check:
        if not section_text:
            continue
        # 检查段落里是否声明了"主要竞品" / "次要竞品"拆分；若声明则跳过列宽检查
        has_split = bool(re.search(r'####?\s*主要竞品', section_text)) and \
                    bool(re.search(r'####?\s*次要竞品', section_text))
        if has_split:
            continue
        # 否则检查每张表的列数
        for table_match in re.finditer(
            r'\|([^\n]+)\|\s*\n\s*\|[\s\-:|]+\|', section_text
        ):
            header = table_match.group(1)
            # 列数 = pipe 分隔的非空字段数
            col_count = len([c for c in header.split('|') if c.strip()])
            if col_count > 5:
                violations.append((section_name, col_count))

    if not violations:
        report.add("表格宽度（≤5 列规则）", True,
                    "所有横向对比表 ≤5 列，或已拆分主要/次要")
    else:
        detail = "; ".join(f"{s} 有 {n} 列" for s, n in violations)
        report.add("表格宽度（≤5 列规则）", False,
                    f"{detail}（应拆分为主要竞品 + 次要竞品）")


def validate_advanced_frameworks(content: str, report: ValidationReport):
    """验证投资级分析框架。"""
    # TAM/SAM/SOM
    has_tam = bool(re.search(r'TAM', content)) and bool(re.search(r'SAM', content))
    report.add("框架 - TAM/SAM/SOM", has_tam,
               "" if has_tam else "缺少市场规模测算")

    # Porter's Five Forces
    has_porter = bool(re.search(r'(?:Porter|五力|Five\s*Forces)', content, re.IGNORECASE))
    report.add("框架 - Porter 五力", has_porter,
               "" if has_porter else "缺少五力分析")

    # ARPU 分析
    has_arpu = bool(re.search(r'ARPU', content))
    report.add("框架 - ARPU 分析", has_arpu,
               "" if has_arpu else "缺少 ARPU 分析")

    # 留存分析
    has_retention = bool(re.search(r'(?:留存|retention|D[17]|D30|DAU/MAU)', content, re.IGNORECASE))
    report.add("框架 - 留存分析", has_retention,
               "" if has_retention else "缺少留存率推断")

    # 估值参考
    has_valuation = bool(re.search(r'(?:估值|valuation|EV/)', content, re.IGNORECASE))
    report.add("框架 - 估值参考", has_valuation,
               "" if has_valuation else "缺少估值参考")

    # 场景规划
    scenario_section = extract_between(content, '场景规划') or extract_between(content, '情景规划')
    if scenario_section:
        scenarios = ["乐观", "基准", "悲观", "极端"]
        # 也兼容 Bull/Base/Bear 英文表述
        alt_scenarios = ["Bull", "Base", "Bear", "Extreme"]
        found = sum(1 for s in scenarios if s in scenario_section)
        found += sum(1 for s in alt_scenarios if s in scenario_section)
        found = min(found, 4)  # cap at 4

        if found >= 3:
            report.add("框架 - 场景规划", True, f"包含 {found} 个场景")
        else:
            report.add("框架 - 场景规划", False,
                        f"仅 {found} 个场景（至少需要 3 个）")
    else:
        report.add("框架 - 场景规划", False, "未找到场景规划章节")

    # 风险矩阵
    risk_section = extract_between(content, '风险矩阵') or extract_between(content, '风险因素')
    if risk_section:
        has_table = count_tables(risk_section) > 0
        has_likelihood = bool(re.search(r'(?:可能性|概率|Likelihood|发生)', risk_section, re.IGNORECASE))
        has_impact = bool(re.search(r'(?:影响|Impact|严重)', risk_section, re.IGNORECASE))
        if has_table and (has_likelihood or has_impact):
            report.add("框架 - 风险矩阵", True)
        else:
            issues = []
            if not has_table:
                issues.append("无表格")
            if not has_likelihood and not has_impact:
                issues.append("缺少概率/影响评估")
            report.add("框架 - 风险矩阵", False, "、".join(issues))
    else:
        report.add("框架 - 风险矩阵", False, "未找到风险矩阵")


# ── 主函数 ────────────────────────────────────────────────────

def validate(filepath: str) -> ValidationReport:
    report = ValidationReport(file_path=filepath)
    path = Path(filepath)

    if not path.exists():
        report.add("文件存在", False, f"文件不存在: {filepath}")
        return report
    report.add("文件存在", True)

    content = path.read_text(encoding="utf-8")
    if not content.strip():
        report.add("文件内容", False, "文件为空")
        return report

    validate_filename(filepath, report)
    validate_header(content, report)
    validate_sections(content, report)
    validate_sub_sections(content, report)
    validate_tables(content, report)
    validate_insights(content, report)
    validate_confidence_tags(content, report)
    validate_depth(content, report)
    validate_positioning_evidence(content, report)
    validate_hard_facts_sourcing(content, report)
    validate_table_widths(content, report)
    validate_advanced_frameworks(content, report)

    return report


def print_report(report: ValidationReport):
    print()
    print("=" * 60)
    print("📋 产品调研报告验证结果")
    print(f"   文件: {report.file_path}")
    print("=" * 60)

    # 分组
    categories = {}
    for r in report.results:
        if " - " in r.name:
            cat = r.name.split(" - ")[0]
        else:
            cat = "基础"
        categories.setdefault(cat, []).append(r)

    for cat, checks in categories.items():
        passed = sum(1 for c in checks if c.passed)
        total = len(checks)
        print(f"\n  ── {cat} ({passed}/{total}) ──")
        for c in checks:
            icon = "✅" if c.passed else "❌"
            label = c.name.split(" - ", 1)[-1] if " - " in c.name else c.name
            line = f"  {icon} {label}"
            if c.detail:
                line += f"  ({c.detail})"
            print(line)

    # 总结
    print()
    print("-" * 60)
    score = report.passed_count / report.total * 100 if report.total else 0

    if score >= 90:
        grade = "🟢 优秀"
    elif score >= 75:
        grade = "🟡 良好"
    elif score >= 60:
        grade = "🟠 合格"
    else:
        grade = "🔴 待改进"

    print(f"  总计: {report.passed_count}/{report.total} 通过 ({score:.0f}%)  {grade}")

    if report.failed_count > 0:
        print(f"\n  ❌ 未通过 ({report.failed_count}):")
        for r in report.results:
            if not r.passed:
                detail = f": {r.detail}" if r.detail else ""
                print(f"     • {r.name}{detail}")

    print()


def main():
    if len(sys.argv) < 2:
        print("用法: python3 validate-report.py <report.md>")
        print("示例: python3 validate-report.py ./参考资料/产品分析/brave-分析报告.md")
        sys.exit(1)

    filepath = sys.argv[1]
    report = validate(filepath)
    print_report(report)

    sys.exit(0 if report.failed_count == 0 else 1)


if __name__ == "__main__":
    main()
