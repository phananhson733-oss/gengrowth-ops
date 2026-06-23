#!/usr/bin/env python3
"""
公司调研报告验收脚本

验证 skill 生成的调研报告是否满足 SKILL.md 和 report-guide.md 的质量要求。
不满足时给出具体改进建议，供 Claude 继续优化。

用法:
  python3 scripts/validate_report.py <report.md>
  python3 scripts/validate_report.py <report.md> --json   # 输出 JSON（供程序消费）

退出码: 0 = 通过（A/B 级），1 = 需改进（C/D/F 级）
"""

import json
import re
import sys
from pathlib import Path
from dataclasses import dataclass, field


# ── 配置 ─────────────────────────────────────────────

# 11 个主章节及其中文编号（兼容 "一" 到 "十一"）
MAIN_SECTIONS = [
    ("一", "执行摘要"),
    ("二", "公司概况"),
    ("三", "业务与产品分析"),
    ("四", "市场与行业分析"),
    ("五", "竞争格局"),
    ("六", "客户分析"),
    ("七", "财务分析"),
    ("八", "战略与增长"),
    ("九", "风险评估"),
    ("十", "SWOT"),
    ("十一", "结论与展望"),
]

# 关键子章节（章节编号前缀 → 关键词列表）
# 对比报告中子章节名可能加"对比"后缀，用模糊匹配
KEY_SUBSECTIONS = {
    "2": ["基本信息", "发展历程", "管理团队"],
    "3": ["产品", "商业模式", "技术"],
    "4": ["市场规模", "行业趋势", "Porter", "监管"],
    "5": ["竞争对手", "竞品对比", "护城河"],
    "6": ["客户细分", "获客", "留存"],
}

# 每个主章节的最低字数要求（纯文本，去除标记）
# 执行摘要较短，其他章节需有实质内容
MIN_WORDS_PER_SECTION = {
    "执行摘要": 150,
    "公司概况": 300,
    "业务与产品分析": 300,
    "市场与行业分析": 200,
    "竞争格局": 200,
    "客户分析": 150,
    "财务分析": 150,
    "战略与增长": 150,
    "风险评估": 150,
    "SWOT": 100,
    "结论与展望": 100,
}

# 风险类型关键词
RISK_TYPES = ["市场风险", "竞争风险", "技术风险", "监管风险", "财务风险", "运营风险", "客户集中"]
RISK_LEVEL_PATTERNS = [r"高风险", r"中风险", r"低风险", r"风险[：:]\s*高", r"风险[：:]\s*中", r"风险[：:]\s*低", r"等级[：:]\s*[高中低]"]

# SWOT 四象限关键词
SWOT_QUADRANTS = ["优势", "劣势", "机会", "威胁"]


# ── 数据结构 ──────────────────────────────────────────

@dataclass
class Check:
    name: str
    passed: bool
    severity: str  # "error" | "warn"
    message: str
    suggestion: str = ""


@dataclass
class SectionInfo:
    title: str
    start: int  # 行号
    end: int  # 行号（下一节开始或文件末尾）
    content: str
    word_count: int


@dataclass
class ReportValidation:
    checks: list = field(default_factory=list)

    def add(self, name: str, passed: bool, message: str,
            severity: str = "error", suggestion: str = ""):
        self.checks.append(Check(name, passed, severity, message, suggestion))

    @property
    def errors(self):
        return [c for c in self.checks if not c.passed and c.severity == "error"]

    @property
    def warnings(self):
        return [c for c in self.checks if not c.passed and c.severity == "warn"]

    @property
    def passed_checks(self):
        return [c for c in self.checks if c.passed]

    @property
    def score(self):
        """百分制评分：error 扣 5 分，warn 扣 2 分"""
        total = 100
        total -= len(self.errors) * 5
        total -= len(self.warnings) * 2
        return max(0, total)

    @property
    def grade(self):
        s = self.score
        if s >= 90:
            return "A"
        if s >= 80:
            return "B"
        if s >= 65:
            return "C"
        if s >= 50:
            return "D"
        return "F"


# ── 工具函数 ──────────────────────────────────────────

def strip_markdown(text: str) -> str:
    """去除 Markdown 标记，保留纯文本（用于字数统计）"""
    t = re.sub(r"^\s*#{1,6}\s+.*$", "", text, flags=re.MULTILINE)  # 标题
    t = re.sub(r"^\s*\|[^\n]*\|", "", t, flags=re.MULTILINE)  # 表格行
    t = re.sub(r"[-|:]+\s*\|", "", t)  # 表格分隔
    t = re.sub(r"[*_`~>]", "", t)  # 内联标记
    t = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", t)  # 链接
    t = re.sub(r"\s+", "", t)  # 所有空白（中文字数统计）
    return t


def count_chinese_words(text: str) -> int:
    """统计中文字数（CJK 字符各算 1 个词，连续英文字母算 1 个词）"""
    clean = strip_markdown(text)
    # CJK 字符数
    cjk = len(re.findall(r'[\u4e00-\u9fff\u3400-\u4dbf]', clean))
    # 连续英文字母序列算 1 个词
    eng = len(re.findall(r'[a-zA-Z]+', clean))
    # 独立数字序列算 1 个词
    nums = len(re.findall(r'\d+', clean))
    return cjk + eng + nums


def count_tables(text: str) -> int:
    """统计表格数量（通过表格分隔行 |---|---| 判断）"""
    return len(re.findall(r"^\s*\|[\s:]*-+[\s:]*\|", text, re.MULTILINE))


def count_links(text: str) -> int:
    """统计链接数量"""
    md_links = len(re.findall(r"\[([^\]]+)\]\(https?://[^)]+\)", text))
    bare_urls = len(re.findall(r"(?<!\()https?://[^\s)\]>，。、；：]+", text))
    return md_links + bare_urls


def count_numbers(text: str) -> int:
    """统计数据点（数字 + 百分比 + 货币金额），去重避免重复计数"""
    # 按优先级排列：高优先级模式先匹配，其覆盖的区间不再被低优先级模式计数
    patterns = [
        r"\d+\.?\d*\s*[%％]",  # 百分比
        r"[\$€¥￥]\s*\d[\d,.]*\s*[A-Za-z亿万千百十]*",  # 货币
        r"\d+\.?\d*\s*[亿万千百十]+",  # 中文数量
        r"\d{2,}",  # 两位以上数字
    ]
    used_spans = set()
    total = 0
    for p in patterns:
        for m in re.finditer(p, text):
            # 检查该匹配是否与已计数的区间重叠
            span = (m.start(), m.end())
            if any(not (span[1] <= s[0] or span[0] >= s[1]) for s in used_spans):
                continue
            used_spans.add(span)
            total += 1
    return total


def count_bold(text: str) -> int:
    """统计加粗文本数量"""
    return len(re.findall(r"\*\*[^*]+\*\*", text))


def count_list_items(text: str) -> int:
    """统计列表项数量"""
    return len(re.findall(r"^\s*[-*+]\s+", text, re.MULTILINE)) + \
           len(re.findall(r"^\s*\d+[.、]\s+", text, re.MULTILINE))


def parse_sections(content: str) -> dict:
    """解析报告为章节字典 {章节关键词: SectionInfo}"""
    lines = content.split("\n")
    sections = {}
    current_key = None
    current_title = ""
    current_start = 0

    for i, line in enumerate(lines):
        # 匹配主章节: ## 一、执行摘要 或 ## 一、执行摘要 (对比报告可能有变体)
        m = re.match(r"^##\s+[一二三四五六七八九十]+、\s*(.+)", line)
        if m:
            # 保存前一章节
            if current_key:
                sec_content = "\n".join(lines[current_start:i])
                sections[current_key] = SectionInfo(
                    title=current_title,
                    start=current_start + 1,
                    end=i,
                    content=sec_content,
                    word_count=count_chinese_words(sec_content),
                )
            current_title = m.group(1).strip()
            # 用 MAIN_SECTIONS 中的标准名做 key
            current_key = current_title
            for _, std_name in MAIN_SECTIONS:
                if std_name in current_title or current_title in std_name:
                    current_key = std_name
                    break
            current_start = i

    # 最后一个章节
    if current_key:
        sec_content = "\n".join(lines[current_start:])
        sections[current_key] = SectionInfo(
            title=current_title,
            start=current_start + 1,
            end=len(lines),
            content=sec_content,
            word_count=count_chinese_words(sec_content),
        )

    return sections


# ── 检查函数 ──────────────────────────────────────────

def check_metadata(content: str, r: ReportValidation):
    """[1/10] 元数据：标题行 + 日期 + 调研目的"""
    lines = content.strip().split("\n")

    # 标题行
    if lines and re.match(r"^#\s+.+调研报告", lines[0]):
        r.add("元数据:标题", True, "包含调研报告标题")
    else:
        r.add("元数据:标题", False, "缺少标题行（应为 `# [公司名] 调研报告`）",
              suggestion="在文件首行添加 `# [公司名] 调研报告`")

    # 日期
    date_match = re.search(r"报告日期[：:]\s*(\d{4}-\d{2}-\d{2})", content[:500])
    if date_match:
        r.add("元数据:日期", True, f"报告日期: {date_match.group(1)}")
    else:
        r.add("元数据:日期", False, "缺少报告日期",
              suggestion="在标题下方添加 `> 报告日期：YYYY-MM-DD | 调研目的：...`")

    # 调研目的
    if re.search(r"调研目的[：:]", content[:500]):
        r.add("元数据:目的", True, "包含调研目的")
    else:
        r.add("元数据:目的", False, "缺少调研目的",
              severity="warn",
              suggestion="在元数据行中补充调研目的")


def check_structure(sections: dict, r: ReportValidation):
    """[2/10] 结构完整性：11 个主章节是否齐全"""
    found = []
    missing = []
    for _, std_name in MAIN_SECTIONS:
        if std_name in sections:
            found.append(std_name)
        else:
            missing.append(std_name)

    if not missing:
        r.add("结构:主章节", True, f"全部 {len(MAIN_SECTIONS)} 个主章节齐全")
    else:
        r.add("结构:主章节", False,
              f"缺少 {len(missing)} 个主章节: {', '.join(missing)}",
              suggestion=f"补充以下章节: {', '.join(missing)}")


def check_subsections(sections: dict, content: str, r: ReportValidation):
    """[3/10] 子章节覆盖"""
    total_expected = 0
    total_found = 0
    missing_details = []

    # 构建章节编号到标准名的映射
    num_to_section = dict(MAIN_SECTIONS)

    for prefix, keywords in KEY_SUBSECTIONS.items():
        # 获取对应章节的内容（限定搜索范围）
        sec_idx = int(prefix)
        sec_name_lookup = dict(enumerate(
            [name for _, name in MAIN_SECTIONS], 1))
        sec_name = sec_name_lookup.get(sec_idx, "")
        sec_content = sections[sec_name].content if sec_name in sections else ""

        for kw in keywords:
            total_expected += 1
            # 在对应章节中搜索子章节标题
            pattern = rf"###\s+{prefix}\.\d+\s+.*{re.escape(kw)}"
            if re.search(pattern, sec_content):
                total_found += 1
            elif kw in sec_content:
                # 关键词存在于对应章节中
                total_found += 1
            else:
                missing_details.append(f"{prefix}.x {kw}")

    if not missing_details:
        r.add("结构:子章节", True,
              f"全部 {total_expected} 个关键子章节覆盖")
    elif len(missing_details) <= 3:
        r.add("结构:子章节", False,
              f"缺少子章节: {', '.join(missing_details)}",
              severity="warn",
              suggestion=f"建议补充: {', '.join(missing_details)}")
    else:
        r.add("结构:子章节", False,
              f"缺少 {len(missing_details)} 个子章节: {', '.join(missing_details)}",
              suggestion=f"补充以下子章节: {', '.join(missing_details)}")


def check_content_depth(sections: dict, r: ReportValidation):
    """[4/10] 内容深度：每个章节的最低字数"""
    thin_sections = []

    for std_name, min_words in MIN_WORDS_PER_SECTION.items():
        if std_name not in sections:
            continue
        sec = sections[std_name]
        if sec.word_count >= min_words:
            r.add(f"深度:{std_name}", True,
                  f"{std_name}: {sec.word_count} 字 (>= {min_words})")
        else:
            thin_sections.append((std_name, sec.word_count, min_words))
            r.add(f"深度:{std_name}", False,
                  f"{std_name}: {sec.word_count} 字 (< {min_words})",
                  severity="warn" if sec.word_count >= min_words * 0.5 else "error",
                  suggestion=f"「{std_name}」内容过薄 ({sec.word_count}/{min_words} 字)，"
                             f"参考 report-guide.md 对应章节补充分析")


def check_data_driven(sections: dict, r: ReportValidation):
    """[5/10] 数据驱动：关键章节是否有数据点"""
    data_heavy_sections = [
        "执行摘要", "公司概况", "业务与产品分析", "市场与行业分析",
        "竞争格局", "财务分析",
    ]
    weak_sections = []

    for name in data_heavy_sections:
        if name not in sections:
            continue
        sec = sections[name]
        num_count = count_numbers(sec.content)
        # 根据章节内容量动态计算期望数据点数
        min_data = max(3, sec.word_count // 200)
        if num_count >= min_data:
            r.add(f"数据:{name}", True,
                  f"{name}: {num_count} 个数据点 (>= {min_data})")
        else:
            weak_sections.append(name)
            r.add(f"数据:{name}", False,
                  f"{name}: 仅 {num_count} 个数据点 (期望 >= {min_data})",
                  severity="warn",
                  suggestion=f"「{name}」缺少量化数据支撑，补充具体数字/百分比/金额")

    # 汇总
    if not weak_sections:
        r.add("数据:整体", True, "所有关键章节数据充分")


def check_formatting(sections: dict, content: str, r: ReportValidation):
    """[6/10] 结构化呈现：表格、列表、加粗"""
    tables = count_tables(content)
    lists = count_list_items(content)
    bolds = count_bold(content)

    # 表格: 至少 3 个（基本信息表、竞品对比表、风险评估表/SWOT 等）
    if tables >= 3:
        r.add("格式:表格", True, f"包含 {tables} 个表格")
    elif tables >= 1:
        r.add("格式:表格", False, f"仅 {tables} 个表格，建议至少 3 个",
              severity="warn",
              suggestion="补充表格：基本信息表(2.1)、竞品对比表(5.2)、风险评估表(九)、SWOT矩阵(十)")
    else:
        r.add("格式:表格", False, "无表格，报告结构化严重不足",
              suggestion="必须添加表格，至少包含基本信息表和竞品对比表")

    # 列表项: 至少 15 个
    if lists >= 15:
        r.add("格式:列表", True, f"包含 {lists} 个列表项")
    elif lists >= 5:
        r.add("格式:列表", False, f"仅 {lists} 个列表项，建议更多使用",
              severity="warn",
              suggestion="增加列表使用，避免大段纯文字")
    else:
        r.add("格式:列表", False, f"仅 {lists} 个列表项，结构化不足",
              suggestion="各章节分析要点应使用列表组织")

    # 加粗: 至少 10 处
    if bolds >= 10:
        r.add("格式:加粗", True, f"包含 {bolds} 处加粗")
    else:
        r.add("格式:加粗", False, f"仅 {bolds} 处加粗，关键信息不够突出",
              severity="warn",
              suggestion="对关键数据、核心结论使用 **加粗** 突出")


def check_sources(content: str, sections: dict, r: ReportValidation):
    """[7/10] 来源可溯：链接/引用"""
    total_links = count_links(content)

    if total_links >= 5:
        r.add("来源:链接数", True, f"包含 {total_links} 个来源链接")
    elif total_links >= 1:
        r.add("来源:链接数", False,
              f"仅 {total_links} 个来源链接，可溯性不足",
              severity="warn",
              suggestion="关键数据附来源链接，财务数据标注年份/季度")
    else:
        r.add("来源:链接数", False, "无来源链接，违反「来源可溯」规范",
              suggestion="每个关键数据点后应标注来源（公司官网/财报/第三方报告）")

    # 参考来源章节
    if re.search(r"(?:参考来源|参考资料|References)", content):
        r.add("来源:参考列表", True, "包含参考来源章节")
    else:
        r.add("来源:参考列表", False, "缺少「参考来源」汇总列表",
              severity="warn",
              suggestion="在报告末尾添加「参考来源」章节，汇总所有引用链接")


def check_fact_speculation(content: str, r: ReportValidation):
    """[8/10] 事实与推测分离"""
    markers = ["据估计", "据推算", "据行业推算", "未公开", "据报道",
               "不确定", "信息缺口", "数据不可得", "公开信息有限"]
    found = [m for m in markers if m in content]

    if found:
        r.add("质量:事实推测分离", True,
              f"包含 {len(found)} 处不确定性标注: {', '.join(found[:5])}")
    else:
        r.add("质量:事实推测分离", False,
              "未发现不确定性标注，可能未区分事实与推测",
              severity="warn",
              suggestion="对无法获取的数据标注「据估计」「未公开」等前缀")


def check_risk_assessment(sections: dict, r: ReportValidation):
    """[9/10] 风险评估：覆盖风险类型 + 标注等级"""
    if "风险评估" not in sections:
        r.add("风险:覆盖", False, "缺少风险评估章节",
              suggestion="添加「九、风险评估」章节")
        return

    sec = sections["风险评估"]
    content = sec.content

    # 风险类型覆盖
    found_types = [rt for rt in RISK_TYPES if rt in content]
    if len(found_types) >= 5:
        r.add("风险:类型覆盖", True,
              f"覆盖 {len(found_types)}/{len(RISK_TYPES)} 种风险类型")
    elif len(found_types) >= 3:
        r.add("风险:类型覆盖", False,
              f"仅覆盖 {len(found_types)}/{len(RISK_TYPES)} 种风险类型",
              severity="warn",
              suggestion=f"补充风险类型: {', '.join(set(RISK_TYPES) - set(found_types))}")
    else:
        r.add("风险:类型覆盖", False,
              f"仅覆盖 {len(found_types)}/{len(RISK_TYPES)} 种风险",
              suggestion="按 report-guide.md 逐一评估 7 种风险类型")

    # 风险等级标注（使用复合模式避免单字误匹配）
    found_levels = [p for p in RISK_LEVEL_PATTERNS if re.search(p, content)]
    if len(found_levels) >= 2:
        r.add("风险:等级标注", True,
              f"包含 {len(found_levels)} 处风险等级标注")
    else:
        r.add("风险:等级标注", False,
              "风险评估未标注等级（高/中/低）",
              severity="warn",
              suggestion="每项风险标注等级（高/中/低），参考 report-guide.md")


def check_swot(sections: dict, r: ReportValidation):
    """[10/10] SWOT 分析：四象限完整性"""
    if "SWOT" not in sections:
        r.add("SWOT:存在", False, "缺少 SWOT 分析章节",
              suggestion="添加「十、SWOT 综合分析」章节")
        return

    sec = sections["SWOT"]
    content = sec.content

    found_q = [q for q in SWOT_QUADRANTS if q in content]
    if len(found_q) == 4:
        r.add("SWOT:四象限", True, "SWOT 四象限完整")
    else:
        missing = set(SWOT_QUADRANTS) - set(found_q)
        r.add("SWOT:四象限", False,
              f"SWOT 缺少象限: {', '.join(missing)}",
              suggestion=f"补充 SWOT 象限: {', '.join(missing)}")

    # SWOT 中应有表格或分点
    if count_tables(content) >= 1 or count_list_items(content) >= 4:
        r.add("SWOT:结构化", True, "SWOT 以结构化形式呈现")
    else:
        r.add("SWOT:结构化", False,
              "SWOT 应以表格或列表形式呈现",
              severity="warn",
              suggestion="使用 2x2 矩阵表格或分象限列表呈现 SWOT")


# ── 主流程 ────────────────────────────────────────────

def validate_report(filepath: str) -> ReportValidation:
    content = Path(filepath).read_text(encoding="utf-8")
    r = ReportValidation()

    # 解析章节
    sections = parse_sections(content)

    # 执行 10 类检查
    check_metadata(content, r)
    check_structure(sections, r)
    check_subsections(sections, content, r)
    check_content_depth(sections, r)
    check_data_driven(sections, r)
    check_formatting(sections, content, r)
    check_sources(content, sections, r)
    check_fact_speculation(content, r)
    check_risk_assessment(sections, r)
    check_swot(sections, r)

    return r


def print_report(r: ReportValidation, filepath: str):
    total = len(r.checks)
    passed = len(r.passed_checks)

    print(f"\n{'='*60}")
    print(f"调研报告验收: {Path(filepath).name}")
    print(f"{'='*60}")
    print(f"评分: {r.score}/100 ({r.grade} 级)")
    print(f"检查项: {passed}/{total} 通过, "
          f"{len(r.errors)} 错误, {len(r.warnings)} 警告\n")

    # 通过项（折叠显示）
    print("--- 通过 ---")
    for c in r.passed_checks:
        print(f"  [PASS] {c.name}: {c.message}")

    # 警告
    if r.warnings:
        print("\n--- 警告 ---")
        for c in r.warnings:
            print(f"  [WARN] {c.name}: {c.message}")
            if c.suggestion:
                print(f"         -> {c.suggestion}")

    # 错误
    if r.errors:
        print("\n--- 错误 ---")
        for c in r.errors:
            print(f"  [FAIL] {c.name}: {c.message}")
            if c.suggestion:
                print(f"         -> {c.suggestion}")

    # 总结
    print(f"\n{'='*60}")
    if r.grade in ("A", "B"):
        print(f"报告质量: {r.grade} 级 — 满足要求")
    elif r.grade == "C":
        print(f"报告质量: C 级 — 基本合格，建议优化上述警告项")
    else:
        print(f"报告质量: {r.grade} 级 — 不满足要求，需修复上述错误项")

    # 改进建议汇总
    if r.errors or r.warnings:
        print("\n改进优先级:")
        for i, c in enumerate(r.errors + r.warnings, 1):
            tag = "必修" if c.severity == "error" else "建议"
            print(f"  {i}. [{tag}] {c.name}: {c.suggestion or c.message}")

    print(f"{'='*60}\n")


def output_json(r: ReportValidation, filepath: str):
    result = {
        "file": str(filepath),
        "score": r.score,
        "grade": r.grade,
        "passed": len(r.passed_checks),
        "errors": len(r.errors),
        "warnings": len(r.warnings),
        "total": len(r.checks),
        "needs_improvement": r.grade not in ("A", "B"),
        "checks": [
            {
                "name": c.name,
                "passed": c.passed,
                "severity": c.severity,
                "message": c.message,
                "suggestion": c.suggestion,
            }
            for c in r.checks
        ],
        "improvement_actions": [
            {"priority": "must_fix" if c.severity == "error" else "suggested",
             "name": c.name,
             "action": c.suggestion or c.message}
            for c in r.errors + r.warnings
        ],
    }
    print(json.dumps(result, ensure_ascii=False, indent=2))


def main():
    if len(sys.argv) < 2:
        print("用法: python3 validate_report.py <report.md> [--json]")
        print("验证调研报告是否满足 skill 质量要求")
        sys.exit(2)

    filepath = sys.argv[1]
    use_json = "--json" in sys.argv

    if not Path(filepath).exists():
        print(f"错误: 文件不存在 {filepath}")
        sys.exit(2)

    r = validate_report(filepath)

    if use_json:
        output_json(r, filepath)
    else:
        print_report(r, filepath)

    # A/B 级且无 error 才通过，否则需改进
    sys.exit(0 if r.grade in ("A", "B") and not r.errors else 1)


if __name__ == "__main__":
    main()
