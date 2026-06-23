#!/usr/bin/env python3
"""
company-survey skill 验收脚本

验证 skill 结构、内容完整性和规范合规性。
用法: python3 scripts/validate_skill.py [skill_dir]
默认 skill_dir 为脚本所在目录的父目录。
"""

import os
import re
import sys
from pathlib import Path


class ValidationResult:
    def __init__(self):
        self.passed = []
        self.failed = []
        self.warnings = []

    def ok(self, msg: str):
        self.passed.append(msg)

    def fail(self, msg: str):
        self.failed.append(msg)

    def warn(self, msg: str):
        self.warnings.append(msg)

    def summary(self) -> int:
        total = len(self.passed) + len(self.failed)
        print(f"\n{'='*60}")
        print(f"验收结果: {len(self.passed)}/{total} 通过")
        print(f"{'='*60}\n")

        if self.passed:
            print("--- 通过 ---")
            for p in self.passed:
                print(f"  [PASS] {p}")

        if self.warnings:
            print("\n--- 警告 ---")
            for w in self.warnings:
                print(f"  [WARN] {w}")

        if self.failed:
            print("\n--- 失败 ---")
            for f in self.failed:
                print(f"  [FAIL] {f}")
            print(f"\n总计: {len(self.failed)} 项未通过")
            return 1

        print("\n所有检查项均通过!")
        return 0


def read_file(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def parse_frontmatter(content: str):
    """解析 YAML frontmatter (简易解析，不依赖 pyyaml)"""
    match = re.match(r"^---\s*\n(.*?)\n---", content, re.DOTALL)
    if not match:
        return None
    fm = {}
    current_key = None
    current_val_lines = []
    for line in match.group(1).split("\n"):
        # 多行值 (以 > 开头的折叠块)
        if current_key and (line.startswith("  ") or line.strip() == ""):
            current_val_lines.append(line.strip())
            continue
        if current_key:
            fm[current_key] = " ".join(current_val_lines).strip()
            current_key = None
            current_val_lines = []
        kv = re.match(r"^(\w+):\s*(.*)$", line)
        if kv:
            key, val = kv.group(1), kv.group(2).strip()
            # 去除 YAML 值两端的引号
            if (val.startswith('"') and val.endswith('"')) or (val.startswith("'") and val.endswith("'")):
                val = val[1:-1]
            if val == ">" or val == "|":
                current_key = key
                current_val_lines = []
            else:
                fm[key] = val
    if current_key:
        fm[current_key] = " ".join(current_val_lines).strip()
    return fm


def validate_structure(skill_dir: Path, r: ValidationResult):
    """检查文件结构"""
    skill_md = skill_dir / "SKILL.md"
    if skill_md.exists():
        r.ok("SKILL.md 存在")
    else:
        r.fail("SKILL.md 不存在")
        return  # 后续检查无法继续

    ref_dir = skill_dir / "references"
    if ref_dir.exists() and ref_dir.is_dir():
        r.ok("references/ 目录存在")
    else:
        r.fail("references/ 目录不存在")

    report_guide = skill_dir / "references" / "report-guide.md"
    if report_guide.exists():
        r.ok("references/report-guide.md 存在")
    else:
        r.fail("references/report-guide.md 不存在")

    # 检查无多余文件
    forbidden = {"README.md", "CHANGELOG.md", "INSTALLATION_GUIDE.md", "QUICK_REFERENCE.md"}
    for f in skill_dir.rglob("*"):
        if f.is_file() and f.name in forbidden:
            rel = f.relative_to(skill_dir)
            if rel.parts[0] == "scripts":
                continue
            r.fail(f"存在多余文件: {rel}")

    # SKILL.md 行数 < 500
    lines = skill_md.read_text(encoding="utf-8").splitlines()
    if len(lines) <= 500:
        r.ok(f"SKILL.md 行数 ({len(lines)}) <= 500")
    else:
        r.fail(f"SKILL.md 行数 ({len(lines)}) > 500，超出建议上限")


def validate_frontmatter(content: str, r: ValidationResult):
    """检查 YAML frontmatter"""
    fm = parse_frontmatter(content)
    if fm is None:
        r.fail("SKILL.md 缺少 YAML frontmatter (--- 块)")
        return

    r.ok("SKILL.md 包含 YAML frontmatter")

    if "name" in fm and fm["name"]:
        r.ok(f"frontmatter 包含 name: {fm['name']}")
    else:
        r.fail("frontmatter 缺少 name 字段")

    if "description" in fm and fm["description"]:
        desc = fm["description"]
        r.ok("frontmatter 包含 description 字段")

        # description 质量检查
        if len(desc) >= 50:
            r.ok(f"description 长度充足 ({len(desc)} 字符)")
        else:
            r.fail(f"description 过短 ({len(desc)} 字符)，需 >= 50")

        # 检查触发场景
        trigger_indicators = ["触发", "场景", "使用", "当用户", "如"]
        if any(ind in desc for ind in trigger_indicators):
            r.ok("description 包含触发场景描述")
        else:
            r.warn("description 建议包含明确的触发场景描述")
    else:
        r.fail("frontmatter 缺少 description 字段")

    # 不应有多余字段
    allowed_keys = {"name", "description"}
    extra = set(fm.keys()) - allowed_keys
    if extra:
        r.fail(f"frontmatter 包含多余字段: {extra}")
    else:
        r.ok("frontmatter 无多余字段")


def validate_workflow(content: str, r: ValidationResult):
    """检查工作流程完整性"""
    required_phases = [
        ("Phase 1", "需求确认"),
        ("Phase 2", "信息搜集"),
        ("Phase 3", "报告撰写"),
        ("Phase 4", "报告交付"),
    ]
    for phase_id, phase_name in required_phases:
        if phase_id in content:
            r.ok(f"包含 {phase_id}（{phase_name}）")
        else:
            r.fail(f"缺少 {phase_id}（{phase_name}）")

    # 检查 WebSearch 引用
    if "WebSearch" in content:
        r.ok("Phase 2 引用了 WebSearch 工具")
    else:
        r.fail("Phase 2 未引用 WebSearch 工具")

    # 检查文件输出指令
    if "写入 Markdown 文件" in content or re.search(r"写入.*文件", content):
        r.ok("Phase 3 包含文件输出指令")
    else:
        r.fail("Phase 3 缺少文件输出指令")

    # 检查文件命名规则
    if "文件命名规则" in content:
        r.ok("包含文件命名规则")
    else:
        r.warn("缺少文件命名规则说明")

    # 检查调研目的差异化指导
    purpose_keywords = ["投资评估", "竞品分析", "合作评估", "求职了解", "市场进入", "通用了解"]
    found_purposes = [kw for kw in purpose_keywords if kw in content]
    if len(found_purposes) >= 5:
        r.ok(f"调研目的覆盖 {len(found_purposes)}/6 种场景")
    else:
        r.fail(f"调研目的仅覆盖 {len(found_purposes)}/6 种场景: {found_purposes}")


def validate_report_structure(content: str, r: ValidationResult):
    """检查报告模板结构完整性"""
    required_sections = [
        "执行摘要",
        "公司概况",
        "业务与产品分析",
        "市场与行业分析",
        "竞争格局",
        "客户分析",
        "财务分析",
        "战略与增长",
        "风险评估",
        "SWOT",
        "结论与展望",
    ]
    missing = [s for s in required_sections if s not in content]
    if not missing:
        r.ok(f"报告模板包含全部 {len(required_sections)} 个主章节")
    else:
        r.fail(f"报告模板缺少章节: {missing}")

    # 检查关键子章节
    required_subsections = [
        "基本信息",
        "发展历程",
        "核心管理团队",
        "企业文化与愿景",
        "产品/服务矩阵",
        "商业模式解构",
        "技术能力",
        "供应链与运营模式",
        "市场规模",
        "行业趋势",
        "Porter",
        "主要竞争对手",
        "竞品对比",
        "护城河分析",
        "客户细分",
        "获客与增长",
        "留存与扩展",
    ]
    missing_sub = [s for s in required_subsections if s not in content]
    if not missing_sub:
        r.ok(f"报告模板包含全部 {len(required_subsections)} 个关键子章节")
    else:
        r.fail(f"报告模板缺少子章节: {missing_sub}")


def validate_report_guide(guide_path: Path, skill_content: str, r: ValidationResult):
    """检查 report-guide.md 的完整性和与 SKILL.md 的一致性"""
    if not guide_path.exists():
        return

    guide = read_file(guide_path)

    # 检查目录
    if "## 目录" in guide or "目录" in guide[:200]:
        r.ok("report-guide.md 包含目录")
    else:
        r.warn("report-guide.md 建议包含目录（便于 Claude 导航）")

    # 检查 11 个主章节
    guide_sections = [
        "执行摘要",
        "公司概况",
        "业务与产品分析",
        "市场与行业分析",
        "竞争格局",
        "客户分析",
        "财务分析",
        "战略与增长",
        "风险评估",
        "SWOT 综合分析",
        "结论与展望",
    ]
    missing = [s for s in guide_sections if s not in guide]
    if not missing:
        r.ok(f"report-guide.md 覆盖全部 {len(guide_sections)} 个章节")
    else:
        r.fail(f"report-guide.md 缺少章节编写指南: {missing}")

    # 检查搜索关键词指引
    search_keyword_count = guide.count("搜索关键词")
    if search_keyword_count >= 3:
        r.ok(f"report-guide.md 包含 {search_keyword_count} 处搜索关键词指引")
    else:
        r.warn(f"report-guide.md 仅 {search_keyword_count} 处搜索关键词指引，建议补充")

    # 检查数据质量规范
    quality_keywords = ["标注来源", "交叉验证", "事实与推测", "未公开"]
    found = [kw for kw in quality_keywords if kw in guide]
    if len(found) >= 3:
        r.ok(f"report-guide.md 包含数据质量规范 ({len(found)}/{len(quality_keywords)})")
    else:
        r.fail(f"report-guide.md 数据质量规范不完整 ({len(found)}/{len(quality_keywords)})")

    # 一致性：SKILL.md 与 report-guide.md 子章节双向检查
    skill_subsections = re.findall(r"^\s*###\s+\d+\.\d+\s+(.+)", skill_content, re.MULTILINE)
    guide_subsections = re.findall(r"^###\s+\d+\.\d+\s+(.+)", guide, re.MULTILINE)

    def normalize_sub(s):
        """去掉括号内内容后比对"""
        return re.sub(r"[（(].*?[）)]", "", s).strip()

    skill_set = {normalize_sub(s) for s in skill_subsections}
    guide_set = {normalize_sub(s) for s in guide_subsections}

    # skill → guide
    missing_in_guide = []
    for sub in skill_subsections:
        sub_norm = normalize_sub(sub)
        if sub_norm not in guide and sub.strip() not in guide:
            missing_in_guide.append(sub.strip())

    # guide → skill
    missing_in_skill = []
    for sub in guide_subsections:
        sub_norm = normalize_sub(sub)
        if sub_norm not in skill_set and sub.strip() not in {s.strip() for s in skill_subsections}:
            missing_in_skill.append(sub.strip())

    if not missing_in_guide and not missing_in_skill:
        r.ok("SKILL.md 模板子章节与 report-guide.md 双向一致")
    else:
        if missing_in_guide:
            r.fail(f"SKILL.md 中的以下子章节在 report-guide.md 中无对应指南: {missing_in_guide}")
        if missing_in_skill:
            r.warn(f"report-guide.md 中的以下子章节在 SKILL.md 模板中无对应: {missing_in_skill}")

    # 检查无硬编码年份
    # 匹配 2024-2039 的硬编码年份；若需扩展范围请更新正则
    hardcoded_years = re.findall(r"(?<!\[)20(?:2[4-9]|3[0-9])(?!\])", guide)
    if hardcoded_years:
        r.warn(f"report-guide.md 包含可能过期的硬编码年份: {set(hardcoded_years)}")
    else:
        r.ok("report-guide.md 无硬编码年份")


def validate_quality_standards(content: str, r: ValidationResult):
    """检查报告质量规范"""
    standards = [
        ("数据驱动", "要求数据支撑"),
        ("来源可溯", "要求来源标注"),
        ("事实与推测分离", "区分确定/不确定信息"),
        ("结构化呈现", "要求表格/列表"),
        ("专业客观", "要求分析师口吻"),
    ]
    missing = []
    for keyword, desc in standards:
        if keyword in content:
            pass
        else:
            missing.append(f"{keyword}（{desc}）")

    if not missing:
        r.ok(f"报告质量规范包含全部 {len(standards)} 项标准")
    else:
        r.fail(f"报告质量规范缺少: {missing}")


def validate_no_hardcoded_years_in_skill(content: str, r: ValidationResult):
    """检查 SKILL.md 搜索示例无硬编码年份"""
    # 排除 frontmatter 中的年份，只检查 body
    body = re.sub(r"^---.*?---", "", content, flags=re.DOTALL).strip()
    # 匹配四位数年份，排除 [当前年份] 这种模板占位符
    # 匹配 2024-2039 的硬编码年份；若需扩展范围请更新正则
    matches = re.findall(r"(?<!\[)20(?:2[4-9]|3[0-9])(?!\])", body)
    if matches:
        r.warn(f"SKILL.md body 包含可能过期的硬编码年份: {set(matches)}")
    else:
        r.ok("SKILL.md body 无硬编码年份")


def validate_reference_links(content: str, skill_dir: Path, r: ValidationResult):
    """检查 SKILL.md 中引用的文件是否存在"""
    links = re.findall(r"\[.*?\]\((references/[^)]+)\)", content)
    if not links:
        r.warn("SKILL.md 未引用任何 reference 文件")
        return

    for link in links:
        target = skill_dir / link
        if target.exists():
            r.ok(f"引用文件存在: {link}")
        else:
            r.fail(f"引用文件不存在: {link}")


def main():
    if len(sys.argv) > 1:
        skill_dir = Path(sys.argv[1]).resolve()
    else:
        skill_dir = Path(__file__).resolve().parent.parent

    print(f"验收目标: {skill_dir}\n")

    if not skill_dir.exists():
        print(f"错误: 目录不存在 {skill_dir}")
        sys.exit(1)

    r = ValidationResult()

    # 1. 文件结构
    print("[1/8] 检查文件结构...")
    validate_structure(skill_dir, r)

    skill_md = skill_dir / "SKILL.md"
    if not skill_md.exists():
        sys.exit(r.summary())

    content = read_file(skill_md)

    # 2. Frontmatter
    print("[2/8] 检查 YAML frontmatter...")
    validate_frontmatter(content, r)

    # 3. 工作流程
    print("[3/8] 检查工作流程完整性...")
    validate_workflow(content, r)

    # 4. 报告模板结构
    print("[4/8] 检查报告模板结构...")
    validate_report_structure(content, r)

    # 5. report-guide.md 完整性和一致性
    print("[5/8] 检查 report-guide.md...")
    validate_report_guide(skill_dir / "references" / "report-guide.md", content, r)

    # 6. 质量规范
    print("[6/8] 检查报告质量规范...")
    validate_quality_standards(content, r)

    # 7. 硬编码年份
    print("[7/8] 检查硬编码年份...")
    validate_no_hardcoded_years_in_skill(content, r)

    # 8. 引用链接
    print("[8/8] 检查引用链接...")
    validate_reference_links(content, skill_dir, r)

    sys.exit(r.summary())


if __name__ == "__main__":
    main()
