#!/usr/bin/env python3
"""通用文档完整性验证：检查任意剪藏 Markdown 文件的基本质量。

无需 API 数据，适用于所有抽取模式（defuddle/lark_api/lark_virtual_scroll）。

检查项：
1. 基本指标（字符数、行数、标题数）
2. Frontmatter 格式
3. 图片引用完整性（本地文件存在、非空、无损坏引用）
4. 链接有效性（无空链接）
5. Markdown 语法（未闭合标记）
6. 内容结构（有标题层次、有正文内容）

Usage:
  python3 verify_doc.py <clipped.md>
  python3 verify_doc.py <clipped.md> --min-chars 5000
  python3 verify_doc.py <clipped.md> --strict  # 更严格的阈值
"""

import argparse
import os
import re
import sys
from pathlib import Path


class Colors:
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    RED = "\033[91m"
    BOLD = "\033[1m"
    RESET = "\033[0m"


def load_markdown(md_path):
    """加载 markdown 文件，分离 frontmatter 和正文。"""
    md = open(md_path).read()
    frontmatter = {}
    md_body = md

    if md.startswith('---'):
        try:
            end = md.index('---', 3)
            fm_text = md[3:end].strip()
            md_body = md[end + 3:].strip()
            # 简单解析 YAML frontmatter
            for line in fm_text.split('\n'):
                if ':' in line and not line.startswith(' ') and not line.startswith('-'):
                    key, _, val = line.partition(':')
                    frontmatter[key.strip()] = val.strip().strip('"').strip("'")
        except ValueError:
            pass

    return md, md_body, frontmatter


def check_basics(md_body, min_chars, min_lines):
    """检查 1: 基本指标。"""
    print(f"\n{'=' * 60}")
    print("1. 基本指标")
    print('=' * 60)

    chars = len(md_body)
    lines = md_body.count('\n') + 1
    headings = len(re.findall(r'^#{1,6} ', md_body, re.MULTILINE))
    images = len(re.findall(r'!\[', md_body))
    tables = len(re.findall(r'^\| ---', md_body, re.MULTILINE))
    links = len(re.findall(r'\[[^\]]+\]\(https?://', md_body))
    bullets = len(re.findall(r'^\s*- ', md_body, re.MULTILINE))

    metrics = {
        'chars': chars, 'lines': lines, 'headings': headings,
        'images': images, 'tables': tables, 'links': links, 'bullets': bullets,
    }

    passed = True

    if chars >= min_chars:
        print(f"  {Colors.GREEN}PASS{Colors.RESET} 字符数: {chars:,} (最低 {min_chars:,})")
    else:
        print(f"  {Colors.RED}FAIL{Colors.RESET} 字符数: {chars:,} (最低 {min_chars:,})")
        passed = False

    if lines >= min_lines:
        print(f"  {Colors.GREEN}PASS{Colors.RESET} 行数: {lines} (最低 {min_lines})")
    else:
        print(f"  {Colors.RED}FAIL{Colors.RESET} 行数: {lines} (最低 {min_lines})")
        passed = False

    if headings > 0:
        print(f"  {Colors.GREEN}PASS{Colors.RESET} 标题: {headings} 个")
    else:
        print(f"  {Colors.YELLOW}WARN{Colors.RESET} 标题: 无标题")

    print(f"  ---  图片: {images}, 表格: {tables}, 链接: {links}, 列表项: {bullets}")

    return passed, metrics


def check_frontmatter(frontmatter):
    """检查 2: Frontmatter 格式。"""
    print(f"\n{'=' * 60}")
    print("2. Frontmatter")
    print('=' * 60)

    passed = True
    required = ['title', 'source', 'clipped']

    if not frontmatter:
        print(f"  {Colors.RED}FAIL{Colors.RESET} 无 frontmatter")
        return False

    for field in required:
        if field in frontmatter and frontmatter[field]:
            print(f"  {Colors.GREEN}PASS{Colors.RESET} {field}: {frontmatter[field][:60]}")
        else:
            print(f"  {Colors.RED}FAIL{Colors.RESET} {field}: 缺失")
            passed = False

    # 检查 clipped 日期格式
    clipped = frontmatter.get('clipped', '')
    if clipped and not re.match(r'\d{4}-\d{2}-\d{2}', clipped):
        print(f"  {Colors.YELLOW}WARN{Colors.RESET} clipped 日期格式不规范: {clipped}")

    return passed


def check_images(md_body, md_path):
    """检查 3: 图片引用完整性。"""
    print(f"\n{'=' * 60}")
    print("3. 图片引用完整性")
    print('=' * 60)

    md_dir = Path(md_path).parent
    img_refs = re.findall(r'!\[([^\]]*)\]\(([^)]+)\)', md_body)

    if not img_refs:
        print(f"  跳过 (无图片引用)")
        return True, {}

    local_refs = []
    remote_refs = []
    broken_refs = []
    empty_files = []

    for alt, src in img_refs:
        if src.startswith('http://') or src.startswith('https://'):
            remote_refs.append(src)
        elif src.startswith('lark-image://'):
            broken_refs.append(('未替换 token', src))
        elif src.strip() == '':
            broken_refs.append(('空路径', alt or '(无alt)'))
        else:
            local_refs.append((alt, src))
            # 检查本地文件是否存在
            full_path = md_dir / src
            if not full_path.exists():
                broken_refs.append(('文件不存在', src))
            elif full_path.stat().st_size == 0:
                empty_files.append(src)

    passed = True

    print(f"  本地图片: {len(local_refs)}, 远程图片: {len(remote_refs)}")

    if broken_refs:
        passed = False
        print(f"  {Colors.RED}FAIL{Colors.RESET} 损坏引用: {len(broken_refs)}")
        for reason, ref in broken_refs[:5]:
            print(f"    {reason}: {ref[:80]}")
        if len(broken_refs) > 5:
            print(f"    ... 还有 {len(broken_refs) - 5} 个")
    else:
        print(f"  {Colors.GREEN}PASS{Colors.RESET} 无损坏引用")

    if empty_files:
        passed = False
        print(f"  {Colors.RED}FAIL{Colors.RESET} 空文件: {len(empty_files)}")
        for f in empty_files[:5]:
            print(f"    {f}")
    elif local_refs:
        print(f"  {Colors.GREEN}PASS{Colors.RESET} 所有本地文件非空")

    # 检查图片顺序（如果是 image-NNN 格式）
    img_nums = re.findall(r'image-(\d{3})\.\w+', md_body)
    if img_nums:
        nums = [int(n) for n in img_nums]
        expected = list(range(1, len(nums) + 1))
        if nums == expected:
            print(f"  {Colors.GREEN}PASS{Colors.RESET} 图片编号连续: 1 到 {len(nums)}")
        else:
            print(f"  {Colors.YELLOW}WARN{Colors.RESET} 图片编号不连续")

    # 统计磁盘信息
    disk_info = {}
    if local_refs:
        existing = [md_dir / src for _, src in local_refs if (md_dir / src).exists()]
        if existing:
            sizes = [f.stat().st_size for f in existing]
            disk_info = {
                'count': len(existing),
                'total_kb': sum(sizes) // 1024,
                'min_kb': min(sizes) // 1024,
                'max_kb': max(sizes) // 1024,
            }
            print(f"  ---  文件: {len(existing)} 个, "
                  f"总计 {sum(sizes)/1024/1024:.1f} MB, "
                  f"最小 {min(sizes)//1024} KB, 最大 {max(sizes)//1024} KB")

    return passed, disk_info


def check_links(md_body):
    """检查 4: 链接有效性。"""
    print(f"\n{'=' * 60}")
    print("4. 链接有效性")
    print('=' * 60)

    # 空链接
    empty_links = re.findall(r'\[([^\]]+)\]\(\s*\)', md_body)
    # 格式错误的链接
    malformed = re.findall(r'\[([^\]]*)\]\([^)]*\s[^)]*\)', md_body)

    passed = True

    if empty_links:
        passed = False
        print(f"  {Colors.RED}FAIL{Colors.RESET} 空链接: {len(empty_links)}")
        for link in empty_links[:3]:
            print(f"    [{link[:40]}]()")
    else:
        print(f"  {Colors.GREEN}PASS{Colors.RESET} 无空链接")

    total_links = len(re.findall(r'\[[^\]]+\]\([^)]+\)', md_body))
    print(f"  ---  总链接数: {total_links}")

    return passed


def check_syntax(md_body):
    """检查 5: Markdown 语法。"""
    print(f"\n{'=' * 60}")
    print("5. Markdown 语法")
    print('=' * 60)

    issues = []

    for i, line in enumerate(md_body.split('\n'), 1):
        if line.strip().startswith('```'):
            continue
        if re.match(r'^\s*!\[', line) or re.match(r'^\s*\[', line):
            continue

        bold_count = len(re.findall(r'\*\*', line))
        if bold_count % 2 != 0:
            issues.append(f"行 {i}: 未闭合粗体 (**)")

        no_bold = re.sub(r'\*\*[^*]+\*\*', '', line)
        italic_count = no_bold.count('*')
        if italic_count % 2 != 0:
            issues.append(f"行 {i}: 未闭合斜体 (*)")

    # 空图片
    empty_imgs = len(re.findall(r'!\[[^\]]*\]\(\s*\)', md_body))
    if empty_imgs:
        issues.append(f"空图片路径: {empty_imgs} 处")

    if not issues:
        print(f"  {Colors.GREEN}PASS{Colors.RESET} 无语法问题")
    else:
        for issue in issues[:8]:
            print(f"  {Colors.YELLOW}WARN{Colors.RESET} {issue}")
        if len(issues) > 8:
            print(f"  ... 还有 {len(issues) - 8} 个")

    return len(issues) == 0


def check_structure(md_body):
    """检查 6: 内容结构。"""
    print(f"\n{'=' * 60}")
    print("6. 内容结构")
    print('=' * 60)

    # 检查标题层级
    heading_levels = [len(m.group(1)) for m in re.finditer(r'^(#{1,6}) ', md_body, re.MULTILINE)]

    if not heading_levels:
        print(f"  {Colors.YELLOW}WARN{Colors.RESET} 无标题结构")
        return True

    has_h1 = 1 in heading_levels
    has_hierarchy = len(set(heading_levels)) > 1

    if has_h1:
        print(f"  {Colors.GREEN}PASS{Colors.RESET} 有顶级标题 (H1)")
    else:
        print(f"  {Colors.YELLOW}WARN{Colors.RESET} 无 H1 标题")

    if has_hierarchy:
        levels_used = sorted(set(heading_levels))
        print(f"  {Colors.GREEN}PASS{Colors.RESET} 有层级结构: {', '.join(f'H{l}' for l in levels_used)}")
    else:
        print(f"  {Colors.YELLOW}WARN{Colors.RESET} 标题只有一个层级: H{heading_levels[0]}")

    # 检查正文非空段落数
    paragraphs = [p for p in md_body.split('\n\n') if p.strip() and not p.strip().startswith('#')]
    print(f"  ---  正文段落: {len(paragraphs)}, 标题层级: {sorted(set(heading_levels))}")

    return True


def main():
    parser = argparse.ArgumentParser(description="通用文档完整性验证")
    parser.add_argument("markdown", help="剪藏 Markdown 文件路径")
    parser.add_argument("--min-chars", type=int, default=1000, help="最低字符数 (默认 1000)")
    parser.add_argument("--min-lines", type=int, default=20, help="最低行数 (默认 20)")
    parser.add_argument("--strict", action="store_true", help="严格模式 (min-chars=5000, min-lines=50)")
    args = parser.parse_args()

    if args.strict:
        args.min_chars = max(args.min_chars, 5000)
        args.min_lines = max(args.min_lines, 50)

    md, md_body, frontmatter = load_markdown(args.markdown)

    print(f"{Colors.BOLD}文档完整性验证{Colors.RESET}")
    print(f"  文件: {args.markdown}")
    print(f"  大小: {len(md):,} 字符, {md.count(chr(10)) + 1} 行")

    basics_ok, metrics = check_basics(md_body, args.min_chars, args.min_lines)
    fm_ok = check_frontmatter(frontmatter)
    img_ok, img_info = check_images(md_body, args.markdown)
    link_ok = check_links(md_body)
    syntax_ok = check_syntax(md_body)
    struct_ok = check_structure(md_body)

    # 总结
    print(f"\n{'=' * 60}")
    print("总结")
    print('=' * 60)

    checks = [
        ("基本指标", basics_ok),
        ("Frontmatter", fm_ok),
        ("图片引用", img_ok),
        ("链接有效性", link_ok),
    ]
    warnings = [
        ("Markdown 语法", syntax_ok),
        ("内容结构", struct_ok),
    ]

    all_pass = True
    for name, passed in checks:
        status = f"{Colors.GREEN}PASS{Colors.RESET}" if passed else f"{Colors.RED}FAIL{Colors.RESET}"
        print(f"  {status}  {name}")
        if not passed:
            all_pass = False

    for name, passed in warnings:
        status = f"{Colors.GREEN}PASS{Colors.RESET}" if passed else f"{Colors.YELLOW}WARN{Colors.RESET}"
        print(f"  {status}  {name}")

    print()
    if all_pass:
        print(f"{Colors.GREEN}{Colors.BOLD}=== 验证通过 ==={Colors.RESET}")
    else:
        print(f"{Colors.RED}{Colors.BOLD}=== 验证未通过 ==={Colors.RESET}")

    sys.exit(0 if all_pass else 1)


if __name__ == '__main__':
    main()
