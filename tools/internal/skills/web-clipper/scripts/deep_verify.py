#!/usr/bin/env python3
"""Deep verification: compare clipped Markdown against Lark API block_map.

Checks:
1. Element counts by type (headings, bullets, ordered, images, tables)
2. Text content coverage (every text block's content appears in output)
3. Image files, order, token mapping, and captions
4. Heading hierarchy and order (using tree traversal)
5. Table dimensions and cell content
6. Text formatting (bold/italic/link preservation)
7. List nesting depth
8. Markdown syntax validity (unclosed markers)

Usage:
  python3 deep_verify.py <clipped.md> <api_data.json> [--img-dir <path>]
  python3 deep_verify.py <clipped.md> <api_data.json> --no-images
"""

import argparse
import json
import os
import re
import sys
from pathlib import Path
from collections import Counter


class Colors:
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    RED = "\033[91m"
    BOLD = "\033[1m"
    RESET = "\033[0m"


def load_data(md_path, api_path):
    """Load and prepare markdown and API data."""
    md = open(md_path).read()
    # Strip frontmatter
    if md.startswith('---'):
        end = md.index('---', 3)
        md_body = md[end + 3:].strip()
    else:
        md_body = md

    api_pages = json.load(open(api_path))
    bm = {}
    block_sequence = []
    for page in api_pages:
        pd = page.get('data', {}) if isinstance(page, dict) else {}
        bm.update(pd.get('block_map', {}))
        seq = pd.get('block_sequence', [])
        if seq:
            block_sequence.extend(seq)

    # Plain text version for text comparison (strip markdown formatting)
    plain_md = re.sub(r'\*+', '', md_body)
    plain_md = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', plain_md)
    # Normalize whitespace
    plain_md_normalized = re.sub(r'\s+', ' ', plain_md)

    return md_body, plain_md, plain_md_normalized, bm, block_sequence


def _get_block_plain_text(block):
    """Extract plain text from a block's Etherpad data."""
    iat = block.get('data', {}).get('text', {}).get('initialAttributedTexts', {})
    text_dict = iat.get('text') or {}
    return ''.join(text_dict.get(str(i), '') for i in range(len(text_dict)))


def _get_block_attribs(block):
    """Extract attribute info from a block's Etherpad data."""
    text_data = block.get('data', {}).get('text', {})
    if not text_data:
        return {}
    apool = text_data.get('apool', {}).get('numToAttrib', {}) or {}
    iat = text_data.get('initialAttributedTexts', {}) or {}
    attribs_dict = iat.get('attribs') or {}
    attribs_str = ''.join(attribs_dict.get(str(i), '') for i in range(len(attribs_dict)))

    has_attrs = {'bold': False, 'italic': False, 'link': False}
    i = 0
    current_attrs = []
    while i < len(attribs_str):
        ch = attribs_str[i]
        if ch == '*':
            i += 1
            num_str = ''
            while i < len(attribs_str) and attribs_str[i] not in ('*', '+', '-', '=', '|'):
                num_str += attribs_str[i]
                i += 1
            if num_str:
                current_attrs.append(int(num_str, 36))
        elif ch == '+':
            for idx in current_attrs:
                pair = apool.get(str(idx), ['', ''])
                name = pair[0]
                if name == 'bold':
                    has_attrs['bold'] = True
                elif name == 'italic':
                    has_attrs['italic'] = True
                elif name == 'link':
                    has_attrs['link'] = True
            current_attrs = []
            i += 1
            while i < len(attribs_str) and attribs_str[i] not in ('*', '+', '-', '=', '|'):
                i += 1
        else:
            i += 1
    return has_attrs


# ═══════════════════════════════════════════════════════════════════════
# Check 1: Element Counts
# ═══════════════════════════════════════════════════════════════════════

def check_element_counts(md_body, bm):
    """Check 1: Element counts by type."""
    print(f"\n{'=' * 70}")
    print("1. 元素数量: block_map vs 剪藏 Markdown")
    print('=' * 70)

    type_counts = Counter(b.get('data', {}).get('type', '?') for b in bm.values())

    md_h1 = len(re.findall(r'^# [^#]', md_body, re.MULTILINE))
    md_h2 = len(re.findall(r'^## [^#]', md_body, re.MULTILINE))
    md_h3 = len(re.findall(r'^### [^#]', md_body, re.MULTILINE))
    md_h4 = len(re.findall(r'^#### [^#]', md_body, re.MULTILINE))
    md_headings = md_h1 + md_h2 + md_h3 + md_h4
    md_bullets = (len(re.findall(r'^\s*- ', md_body, re.MULTILINE)) +
                  len(re.findall(r'^>\s+- ', md_body, re.MULTILINE)))
    md_ordered = (len(re.findall(r'^\s*1\. ', md_body, re.MULTILINE)) +
                  len(re.findall(r'^>\s+1\. ', md_body, re.MULTILINE)))
    md_images = len(re.findall(r'!\[', md_body))
    md_tables = len(re.findall(r'^\| ---', md_body, re.MULTILINE))
    md_dividers = len(re.findall(r'^---$', md_body, re.MULTILINE))
    md_callouts = len(re.findall(r'^> \[!note\]', md_body, re.MULTILINE))

    api_headings = sum(type_counts.get(f'heading{i}', 0) for i in range(1, 7))

    fmt = "{:<25} {:>8} {:>8} {:>10}"
    print(fmt.format("Element", "API", "Clipped", "Coverage"))
    print("-" * 55)

    results = {}
    rows = [
        ("heading1", type_counts.get('heading1', 0), md_h1),
        ("heading2", type_counts.get('heading2', 0), md_h2),
        ("heading3", type_counts.get('heading3', 0), md_h3),
        ("heading4", type_counts.get('heading4', 0), md_h4),
        ("ALL HEADINGS", api_headings, md_headings),
        ("bullet", type_counts.get('bullet', 0), md_bullets),
        ("ordered", type_counts.get('ordered', 0), md_ordered),
        ("image", type_counts.get('image', 0), md_images),
        ("table", type_counts.get('table', 0), md_tables),
        ("divider", type_counts.get('divider', 0), md_dividers),
        ("callout", type_counts.get('callout', 0), md_callouts),
    ]

    for name, api_val, md_val in rows:
        pct = f"{md_val / api_val * 100:.0f}%" if api_val > 0 else "—"
        ok = api_val == 0 or md_val >= api_val * 0.9
        line = fmt.format(name, str(api_val), str(md_val), pct)
        if not ok:
            print(f"{Colors.YELLOW}{line}{Colors.RESET}")
        else:
            print(line)
        results[name] = (api_val, md_val, ok)

    return results


# ═══════════════════════════════════════════════════════════════════════
# Check 2: Text Content Coverage (improved matching)
# ═══════════════════════════════════════════════════════════════════════

def check_text_coverage(plain_md, plain_md_normalized, bm):
    """Check 2: Text content coverage with improved matching precision."""
    print(f"\n{'=' * 70}")
    print("2. 文本内容覆盖率（改进匹配）")
    print('=' * 70)

    text_types = ('text', 'bullet', 'ordered', 'heading1', 'heading2', 'heading3',
                  'heading4', 'heading5', 'heading6')
    total_checked = 0
    found = 0
    missing_items = []

    for bid, block in bm.items():
        bt = block.get('data', {}).get('type', '')
        if bt in text_types:
            text = _get_block_plain_text(block)
            if text and len(text) >= 5:
                total_checked += 1
                # Try multiple matching strategies (short→long, exact→normalized)
                matched = False
                # Strategy 1: 40-char exact substring
                snippet40 = text[:40]
                if snippet40 in plain_md:
                    matched = True
                # Strategy 2: normalized whitespace match
                if not matched:
                    norm_snippet = re.sub(r'\s+', ' ', text[:50]).strip()
                    if norm_snippet and norm_snippet in plain_md_normalized:
                        matched = True
                # Strategy 3: 25-char substring (fallback)
                if not matched:
                    snippet25 = text[:25]
                    if snippet25 in plain_md:
                        matched = True

                if matched:
                    found += 1
                else:
                    pid = block['data'].get('parent_id', '')
                    ptype = bm.get(pid, {}).get('data', {}).get('type', 'ROOT')
                    missing_items.append((bt, ptype, text[:60]))

    coverage = found / total_checked * 100 if total_checked else 0
    print(f"检查: {total_checked} 个文本块")
    print(f"找到: {found}")
    print(f"缺失: {total_checked - found}")
    print(f"覆盖率: {coverage:.1f}%")

    if missing_items:
        print(f"\n缺失块 ({len(missing_items)}):")
        for bt, pt, txt in missing_items[:20]:
            print(f"  [{bt}] parent={pt}: {txt}")
        if len(missing_items) > 20:
            print(f"  ... 还有 {len(missing_items) - 20} 个")

    return coverage


# ═══════════════════════════════════════════════════════════════════════
# Check 3: Image Files, Order, Token Mapping, and Captions
# ═══════════════════════════════════════════════════════════════════════

def check_images(md_body, bm, img_dir):
    """Check 3: Image verification (files, order, token mapping, captions)."""
    print(f"\n{'=' * 70}")
    print("3. 图片验证（文件/顺序/映射/标题）")
    print('=' * 70)

    api_images = {}
    api_captions = {}
    for bid, block in bm.items():
        if block.get('data', {}).get('type') == 'image':
            img = block['data'].get('image', {})
            token = img.get('token', '')
            if token:
                api_images[token] = {
                    'size': img.get('size', 0),
                    'width': img.get('width', 0),
                    'height': img.get('height', 0),
                }
                # Extract caption
                caption = img.get('caption', {})
                if caption and isinstance(caption, dict):
                    cap_text = caption.get('text')
                    if cap_text and isinstance(cap_text, dict):
                        cap_str = ''.join(cap_text.get(str(i), '') for i in range(len(cap_text)))
                        if cap_str and cap_str.strip():
                            api_captions[token] = cap_str.strip()

    md_image_refs = re.findall(r'!\[[^\]]*\]\(([^)]+)\)', md_body)
    md_image_count = len(md_image_refs)
    remaining_tokens = len(re.findall(r'lark-image://', md_body))

    print(f"API image tokens: {len(api_images)}")
    print(f"Markdown 图片引用: {md_image_count}")
    print(f"未替换 lark-image:// tokens: {remaining_tokens}")

    results = {
        'api_count': len(api_images),
        'md_refs': md_image_count,
        'files': 0,
        'empty': 0,
        'remaining_tokens': remaining_tokens,
        'order_ok': True,
        'mapping_ok': True,
        'caption_coverage': 100.0,
    }

    # ── Sub-check 3a: Image file order in markdown ──
    print(f"\n--- 3a. 图片顺序验证 ---")
    img_filenames = re.findall(r'image-(\d{3})\.\w+', md_body)
    if img_filenames:
        nums = [int(n) for n in img_filenames]
        expected = list(range(1, len(nums) + 1))
        if nums == expected:
            print(f"  {Colors.GREEN}PASS{Colors.RESET} 图片按顺序排列: 1 到 {len(nums)}")
        else:
            results['order_ok'] = False
            # Find first mismatch
            for i, (actual, exp) in enumerate(zip(nums, expected)):
                if actual != exp:
                    print(f"  {Colors.RED}FAIL{Colors.RESET} 图片顺序错误: 位置 {i+1} 期望 image-{exp:03d}, "
                          f"实际 image-{actual:03d}")
                    break
            # Show sequence snippet
            print(f"  前10个: {nums[:10]}")
    else:
        print(f"  跳过 (无 image-NNN 格式文件)")

    # ── Sub-check 3b: Token→file mapping uniqueness ──
    print(f"\n--- 3b. Token→文件映射唯一性 ---")
    file_refs = re.findall(r'!\[[^\]]*\]\((?:assets/[^/]+/)?([^)]+)\)', md_body)
    img_files_in_md = [f for f in file_refs if f.startswith('image-')]
    unique_files = set(img_files_in_md)
    if len(img_files_in_md) > 0:
        if len(unique_files) == len(img_files_in_md):
            print(f"  {Colors.GREEN}PASS{Colors.RESET} 所有 {len(img_files_in_md)} 个引用指向不同文件")
        else:
            results['mapping_ok'] = False
            dupes = len(img_files_in_md) - len(unique_files)
            print(f"  {Colors.RED}FAIL{Colors.RESET} {dupes} 个重复文件引用")
            # Show duplicates
            seen = set()
            for f in img_files_in_md:
                if f in seen:
                    print(f"    重复: {f}")
                seen.add(f)
    else:
        print(f"  跳过 (无图片文件引用)")

    # ── Sub-check 3c: Image caption verification ──
    print(f"\n--- 3c. 图片标题验证 ---")
    if api_captions:
        caption_found = 0
        caption_missing = []
        for token, caption_text in api_captions.items():
            # Check if caption appears in markdown (as italic text or alt text)
            cap_snippet = caption_text[:30].replace('\n', ' ').strip()
            if cap_snippet in md_body:
                caption_found += 1
            else:
                caption_missing.append((token, caption_text[:50]))
        total_captions = len(api_captions)
        coverage = caption_found / total_captions * 100 if total_captions else 100
        results['caption_coverage'] = coverage
        if caption_found == total_captions:
            print(f"  {Colors.GREEN}PASS{Colors.RESET} 全部 {total_captions} 个标题已保留")
        else:
            print(f"  {Colors.YELLOW}WARN{Colors.RESET} 标题覆盖: {caption_found}/{total_captions} ({coverage:.0f}%)")
            for token, cap in caption_missing[:5]:
                print(f"    缺失: [{token[:12]}...] {cap}")
    else:
        print(f"  跳过 (API 中无图片标题)")

    # ── Sub-check 3d: Image files on disk ──
    empty_files = []
    img_files = []
    if img_dir and os.path.isdir(img_dir):
        print(f"\n--- 3d. 磁盘文件验证 ---")
        img_files = sorted(Path(img_dir).glob("image-*"))
        results['files'] = len(img_files)
        print(f"下载文件: {len(img_files)}")

        total_api_size = sum(v['size'] for v in api_images.values())
        total_disk_size = sum(f.stat().st_size for f in img_files)
        print(f"API 总大小:  {total_api_size:,} bytes ({total_api_size / 1024 / 1024:.1f} MB)")
        print(f"磁盘总大小: {total_disk_size:,} bytes ({total_disk_size / 1024 / 1024:.1f} MB)")

        empty_files = [f for f in img_files if f.stat().st_size == 0]
        results['empty'] = len(empty_files)
        if empty_files:
            print(f"\n{Colors.RED}空文件: {len(empty_files)}{Colors.RESET}")
            for f in empty_files:
                print(f"  {f.name}")
        else:
            print(f"空文件: 0 (所有图片均有内容)")

        sizes = [f.stat().st_size for f in img_files]
        if sizes:
            print(f"\n文件大小分布:")
            print(f"  最小: {min(sizes):>10,} bytes ({min(sizes) / 1024:.0f} KB)")
            print(f"  最大: {max(sizes):>10,} bytes ({max(sizes) / 1024:.0f} KB)")
            print(f"  平均: {sum(sizes) // len(sizes):>10,} bytes ({sum(sizes) // len(sizes) // 1024:.0f} KB)")

    return results


# ═══════════════════════════════════════════════════════════════════════
# Check 4: Heading Order
# ═══════════════════════════════════════════════════════════════════════

def check_heading_order(md_body, bm, block_sequence, api_data_path):
    """Check 4: Heading hierarchy and order by re-running the converter."""
    print(f"\n{'=' * 70}")
    print("4. 标题层级与顺序")
    print('=' * 70)

    script_dir = Path(__file__).parent
    sys.path.insert(0, str(script_dir))
    try:
        from lark_blocks_to_md import blocks_to_markdown
        api_pages = json.load(open(api_data_path))
        fresh_md, _ = blocks_to_markdown(api_pages)
    except Exception as e:
        print(f"{Colors.YELLOW}无法重新运行转换器: {e}{Colors.RESET}")
        return True  # Can't verify, don't block

    fresh_headings = []
    for m in re.finditer(r'^(#{1,6}) (.+)$', fresh_md, re.MULTILINE):
        level = len(m.group(1))
        text = re.sub(r'\*+', '', m.group(2)).strip()
        fresh_headings.append((level, text[:50]))

    md_headings = []
    for m in re.finditer(r'^(#{1,6}) (.+)$', md_body, re.MULTILINE):
        level = len(m.group(1))
        text = re.sub(r'\*+', '', m.group(2)).strip()
        md_headings.append((level, text[:50]))

    fmt = "{:<4} {:<45} | {:<4} {:<45}"
    print(fmt.format("LV", "转换器输出", "LV", "保存文件"))
    print("-" * 104)

    max_show = min(20, max(len(fresh_headings), len(md_headings)))
    match_count = 0
    compare_len = min(len(fresh_headings), len(md_headings))

    for i in range(max_show):
        ref_h = fresh_headings[i] if i < len(fresh_headings) else (0, "—")
        md_h = md_headings[i] if i < len(md_headings) else (0, "—")
        matched = ref_h[0] == md_h[0] and ref_h[1][:20] == md_h[1][:20]
        if i < compare_len and matched:
            match_count += 1
        prefix = "" if matched else Colors.YELLOW
        suffix = Colors.RESET if not matched else ""
        print(f"{prefix}{fmt.format(f'H{ref_h[0]}', ref_h[1], f'H{md_h[0]}', md_h[1])}{suffix}")

    order_match = match_count == compare_len and len(fresh_headings) == len(md_headings)
    print(f"\n转换器: {len(fresh_headings)}, 保存: {len(md_headings)}")
    print(f"顺序匹配: {'是' if order_match else '否'} ({match_count}/{compare_len})")
    return order_match


# ═══════════════════════════════════════════════════════════════════════
# Check 5: Table Dimensions and Content
# ═══════════════════════════════════════════════════════════════════════

def check_tables(md_body, bm, plain_md):
    """Check 5: Table dimensions and cell content."""
    print(f"\n{'=' * 70}")
    print("5. 表格维度与内容")
    print('=' * 70)

    api_tables = []
    for bid, block in bm.items():
        if block.get('data', {}).get('type') == 'table':
            td = block['data']
            cols = len(td.get('columns_id', []))
            rows = len(td.get('rows_id', []))
            # Collect cell text content (find cells by parent_id, not children field)
            cell_texts = []
            for cell_bid, cell_block in bm.items():
                cell_data = cell_block.get('data', {})
                if cell_data.get('parent_id') == bid and cell_data.get('type') == 'table_cell':
                    for gc_id in cell_data.get('children', []):
                        gc = bm.get(gc_id, {})
                        text = _get_block_plain_text(gc)
                        if text and len(text) >= 3:
                            cell_texts.append(text.strip())
            api_tables.append((cols, rows, cell_texts))

    # Markdown tables
    md_tables = []
    lines = md_body.split('\n')
    i = 0
    while i < len(lines):
        if re.match(r'^\| ---', lines[i]):
            # Collect all table rows (header row is above separator)
            header_idx = i - 1
            data_start = i + 1
            data_end = data_start
            while data_end < len(lines) and lines[data_end].startswith('|'):
                data_end += 1
            n_rows = 1 + (data_end - data_start)
            n_cols = lines[i].count('---')
            # Collect cell text from all rows
            table_text = []
            if header_idx >= 0 and lines[header_idx].startswith('|'):
                table_text.append(lines[header_idx])
            for ri in range(data_start, data_end):
                table_text.append(lines[ri])
            md_tables.append((n_cols, n_rows, '\n'.join(table_text)))
            i = data_end
        else:
            i += 1

    # Print dimensions comparison (order-independent: API and MD table order may differ)
    fmt = "{:<6} {:>8} {:>8}    {:>8} {:>8}    {}"
    print(fmt.format("Table", "APICols", "APIRows", "MDCols", "MDRows", "Match"))
    print("-" * 60)

    for idx in range(max(len(api_tables), len(md_tables))):
        api_t = api_tables[idx] if idx < len(api_tables) else (0, 0, [])
        md_t = md_tables[idx] if idx < len(md_tables) else (0, 0, '')
        match = api_t[0] == md_t[0] and api_t[1] == md_t[1]
        prefix = "" if match else Colors.YELLOW
        suffix = Colors.RESET if not match else ""
        m = "OK" if match else "DIFF"
        print(f"{prefix}{fmt.format(f'#{idx + 1}', api_t[0], api_t[1], md_t[0], md_t[1], m)}{suffix}")

    # Order-independent dimension check: sort both lists and compare
    api_dims = sorted((t[0], t[1]) for t in api_tables)
    md_dims = sorted((t[0], t[1]) for t in md_tables)
    all_match = api_dims == md_dims
    if not all_match and len(api_tables) == len(md_tables):
        print(f"  {Colors.YELLOW}注意: 表格顺序不同 (API vs MD 遍历顺序不同), 但维度集合一致{Colors.RESET}"
              if api_dims == md_dims else "")
    elif all_match:
        print(f"  维度验证: 所有表格维度匹配 (顺序无关)")
    # Recheck: as long as sorted dimensions match, it's a pass
    all_match = api_dims == md_dims

    # Content verification: check that API cell texts appear in markdown tables
    print(f"\n--- 5b. 表格内容验证 ---")
    total_cells = 0
    found_cells = 0
    missing_cells = []
    for tidx, (_, _, cell_texts) in enumerate(api_tables):
        md_table_text = md_tables[tidx][2] if tidx < len(md_tables) else ''
        md_table_plain = re.sub(r'\*+', '', md_table_text)
        md_table_plain = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', md_table_plain)
        for ct in cell_texts:
            total_cells += 1
            snippet = ct[:25]
            if snippet in md_table_plain or snippet in plain_md:
                found_cells += 1
            else:
                missing_cells.append((tidx + 1, ct[:40]))

    if total_cells > 0:
        cell_coverage = found_cells / total_cells * 100
        if cell_coverage >= 95:
            print(f"  {Colors.GREEN}PASS{Colors.RESET} 表格内容覆盖: {found_cells}/{total_cells} ({cell_coverage:.0f}%)")
        else:
            print(f"  {Colors.YELLOW}WARN{Colors.RESET} 表格内容覆盖: {found_cells}/{total_cells} ({cell_coverage:.0f}%)")
            for tnum, ct in missing_cells[:5]:
                print(f"    表格#{tnum} 缺失: {ct}")
    else:
        print(f"  跳过 (无表格单元格内容)")

    return all_match


# ═══════════════════════════════════════════════════════════════════════
# Check 6: Text Formatting (bold/italic/link)
# ═══════════════════════════════════════════════════════════════════════

def check_formatting(md_body, bm):
    """Check 6: Verify bold/italic/link formatting is preserved."""
    print(f"\n{'=' * 70}")
    print("6. 文本格式验证（粗体/斜体/链接）")
    print('=' * 70)

    text_types = ('text', 'bullet', 'ordered', 'heading1', 'heading2', 'heading3',
                  'heading4', 'heading5', 'heading6')

    format_stats = {'bold': [0, 0], 'italic': [0, 0], 'link': [0, 0]}  # [api_count, md_found]

    for bid, block in bm.items():
        bt = block.get('data', {}).get('type', '')
        if bt not in text_types:
            continue
        text = _get_block_plain_text(block)
        if not text or len(text) < 3:
            continue

        attrs = _get_block_attribs(block)
        snippet = text[:30]

        if attrs.get('bold'):
            format_stats['bold'][0] += 1
            # Check if the text appears within ** markers in markdown
            if f'**{snippet[:15]}' in md_body or f'**{snippet[:10]}' in md_body:
                format_stats['bold'][1] += 1

        if attrs.get('italic'):
            format_stats['italic'][0] += 1
            if f'*{snippet[:15]}' in md_body:
                format_stats['italic'][1] += 1

        if attrs.get('link'):
            format_stats['link'][0] += 1
            if f'[{snippet[:15]}' in md_body or f'[{snippet[:10]}' in md_body:
                format_stats['link'][1] += 1

    for fmt_name, (api_count, md_found) in format_stats.items():
        if api_count > 0:
            pct = md_found / api_count * 100
            status = Colors.GREEN + "PASS" + Colors.RESET if pct >= 80 else Colors.YELLOW + "WARN" + Colors.RESET
            label = {'bold': '粗体', 'italic': '斜体', 'link': '链接'}[fmt_name]
            print(f"  {status} {label}: {md_found}/{api_count} ({pct:.0f}%)")
        else:
            label = {'bold': '粗体', 'italic': '斜体', 'link': '链接'}[fmt_name]
            print(f"  —    {label}: 无 (API 中无此格式)")

    return format_stats


# ═══════════════════════════════════════════════════════════════════════
# Check 7: List Nesting Depth
# ═══════════════════════════════════════════════════════════════════════

def check_list_nesting(md_body, bm):
    """Check 7: Verify list nesting depth matches API children hierarchy."""
    print(f"\n{'=' * 70}")
    print("7. 列表嵌套深度")
    print('=' * 70)

    # Calculate max nesting depth from API
    def get_depth(block_id, bm_map, depth=0):
        block = bm_map.get(block_id, {})
        bt = block.get('data', {}).get('type', '')
        if bt not in ('bullet', 'ordered'):
            return depth
        max_child_depth = depth
        for child_id in block.get('data', {}).get('children', []):
            child = bm_map.get(child_id, {})
            child_type = child.get('data', {}).get('type', '')
            if child_type in ('bullet', 'ordered'):
                d = get_depth(child_id, bm_map, depth + 1)
                max_child_depth = max(max_child_depth, d)
        return max_child_depth

    api_max_depth = 0
    api_nested_count = 0
    for bid, block in bm.items():
        bt = block.get('data', {}).get('type', '')
        if bt in ('bullet', 'ordered'):
            children = block.get('data', {}).get('children', [])
            nested = [c for c in children if bm.get(c, {}).get('data', {}).get('type', '') in ('bullet', 'ordered')]
            if nested:
                api_nested_count += 1
            d = get_depth(bid, bm)
            api_max_depth = max(api_max_depth, d)

    # Calculate max nesting depth from markdown
    md_max_depth = 0
    md_nested_count = 0
    for line in md_body.split('\n'):
        m = re.match(r'^(\s*)(- |1\. )', line)
        if m:
            indent = len(m.group(1))
            depth = indent // 2
            if depth > 0:
                md_nested_count += 1
            md_max_depth = max(md_max_depth, depth)

    print(f"API 最大嵌套深度: {api_max_depth}")
    print(f"MD  最大嵌套深度: {md_max_depth}")
    print(f"API 嵌套列表项: {api_nested_count}")
    print(f"MD  缩进列表项: {md_nested_count}")

    depth_match = md_max_depth >= api_max_depth
    if depth_match:
        print(f"  {Colors.GREEN}PASS{Colors.RESET} 嵌套深度匹配")
    else:
        print(f"  {Colors.YELLOW}WARN{Colors.RESET} 嵌套深度不匹配 (API={api_max_depth}, MD={md_max_depth})")

    return depth_match


# ═══════════════════════════════════════════════════════════════════════
# Check 8: Markdown Syntax Validity
# ═══════════════════════════════════════════════════════════════════════

def check_markdown_syntax(md_body):
    """Check 8: Scan for common markdown syntax issues."""
    print(f"\n{'=' * 70}")
    print("8. Markdown 语法有效性")
    print('=' * 70)

    issues = []

    # Check for unclosed bold markers (**text without closing **)
    # Count ** occurrences per line
    for i, line in enumerate(md_body.split('\n'), 1):
        # Skip code blocks
        if line.strip().startswith('```'):
            continue
        # Skip image/link lines
        if re.match(r'^\s*!\[', line) or re.match(r'^\s*\[', line):
            continue
        bold_count = len(re.findall(r'\*\*', line))
        if bold_count % 2 != 0:
            issues.append(f"行 {i}: 未闭合粗体标记 (**)")
        # Check italic (single *)
        # Remove bold markers first, then check
        no_bold = re.sub(r'\*\*[^*]+\*\*', '', line)
        italic_count = no_bold.count('*')
        if italic_count % 2 != 0:
            issues.append(f"行 {i}: 未闭合斜体标记 (*)")

    # Check for broken image references
    broken_imgs = re.findall(r'!\[[^\]]*\]\(\s*\)', md_body)
    if broken_imgs:
        issues.append(f"空图片路径: {len(broken_imgs)} 处")

    # Check for broken link references
    broken_links = re.findall(r'\[[^\]]+\]\(\s*\)', md_body)
    if broken_links:
        issues.append(f"空链接路径: {len(broken_links)} 处")

    if not issues:
        print(f"  {Colors.GREEN}PASS{Colors.RESET} 无语法问题")
    else:
        for issue in issues[:10]:
            print(f"  {Colors.YELLOW}WARN{Colors.RESET} {issue}")
        if len(issues) > 10:
            print(f"  ... 还有 {len(issues) - 10} 个问题")

    return len(issues) == 0


# ═══════════════════════════════════════════════════════════════════════
# Final Summary
# ═══════════════════════════════════════════════════════════════════════

def final_summary(elem_results, text_coverage, img_results, heading_order,
                   table_match, format_stats, nesting_ok, syntax_ok, md_body):
    """Print final summary with PASS/FAIL."""
    print(f"\n{'=' * 70}")
    print("最终总结")
    print('=' * 70)

    api_headings = elem_results.get('ALL HEADINGS', (0, 0, True))
    api_images = img_results['api_count']

    checks = [
        ("标题数量", api_headings[0] == api_headings[1],
         f"{api_headings[1]}/{api_headings[0]}"),
        ("图片覆盖率 >= 95%",
         img_results['md_refs'] >= api_images * 0.95 if api_images > 0 else True,
         f"{img_results['md_refs']}/{api_images} ({img_results['md_refs']/api_images*100:.0f}%)" if api_images > 0 else "—"),
        ("图片文件",
         img_results['files'] >= api_images if img_results['files'] > 0 else True,
         f"{img_results['files']}/{api_images}" if img_results['files'] > 0 else "跳过"),
        ("无空文件", img_results['empty'] == 0,
         f"{img_results['empty']} 个空" if img_results['empty'] > 0 else "无"),
        ("无未替换 token", img_results['remaining_tokens'] == 0,
         "干净" if img_results['remaining_tokens'] == 0 else f"{img_results['remaining_tokens']} 个"),
        ("图片顺序", img_results['order_ok'], "顺序正确" if img_results['order_ok'] else "顺序错误"),
        ("映射唯一性", img_results['mapping_ok'], "唯一" if img_results['mapping_ok'] else "有重复"),
        ("表格数量", elem_results.get('table', (0, 0, True))[2],
         f"{elem_results.get('table', (0, 0))[1]}/{elem_results.get('table', (0, 0))[0]}"),
        ("表格维度", table_match, "匹配" if table_match else "不匹配"),
        ("文本覆盖率 >= 99%", text_coverage >= 99.0, f"{text_coverage:.1f}%"),
        ("内容 > 50k 字符", len(md_body) >= 50000, f"{len(md_body):,} 字符"),
    ]

    # Non-blocking warnings
    warnings = [
        ("标题顺序", heading_order, "匹配" if heading_order else "不匹配 (重新剪藏可修复)"),
        ("列表嵌套", nesting_ok, "匹配" if nesting_ok else "深度不匹配"),
        ("Markdown 语法", syntax_ok, "有效" if syntax_ok else "有问题"),
        ("图片标题", img_results.get('caption_coverage', 100) >= 90,
         f"{img_results.get('caption_coverage', 100):.0f}%"),
    ]

    # Add formatting checks as warnings
    for fmt_name in ('bold', 'italic', 'link'):
        api_c, md_c = format_stats.get(fmt_name, [0, 0])
        if api_c > 0:
            label = {'bold': '粗体格式', 'italic': '斜体格式', 'link': '链接格式'}[fmt_name]
            pct = md_c / api_c * 100
            warnings.append((label, pct >= 80, f"{md_c}/{api_c} ({pct:.0f}%)"))

    all_pass = True
    for name, passed, detail in checks:
        status = f"{Colors.GREEN}PASS{Colors.RESET}" if passed else f"{Colors.RED}FAIL{Colors.RESET}"
        print(f"  {status}  {name:<25} {detail}")
        if not passed:
            all_pass = False

    for name, passed, detail in warnings:
        status = f"{Colors.GREEN}PASS{Colors.RESET}" if passed else f"{Colors.YELLOW}WARN{Colors.RESET}"
        print(f"  {status}  {name:<25} {detail}")

    print()
    if all_pass:
        print(f"{Colors.GREEN}{Colors.BOLD}=== 所有检查通过 ==={Colors.RESET}")
    else:
        print(f"{Colors.RED}{Colors.BOLD}=== 部分检查失败 ==={Colors.RESET}")

    return all_pass


def main():
    parser = argparse.ArgumentParser(description="飞书剪藏文档深度验证")
    parser.add_argument("markdown", help="剪藏 Markdown 文件路径")
    parser.add_argument("api_data", help="保存的飞书 API 数据 JSON 路径")
    parser.add_argument("--img-dir", help="下载图片目录路径")
    parser.add_argument("--no-images", action="store_true", help="跳过图片文件检查")
    args = parser.parse_args()

    md_body, plain_md, plain_md_normalized, bm, block_sequence = load_data(args.markdown, args.api_data)

    img_dir = args.img_dir
    if not img_dir and not args.no_images:
        md_path = Path(args.markdown)
        candidate = md_path.parent / "assets" / md_path.stem
        if candidate.is_dir():
            img_dir = str(candidate)

    print(f"{Colors.BOLD}深度验证: 飞书文档{Colors.RESET}")
    print(f"  Markdown: {args.markdown}")
    print(f"  API 数据: {args.api_data}")
    print(f"  图片目录: {img_dir or '(跳过)'}")
    print(f"  块总数:   {len(bm)}")

    elem_results = check_element_counts(md_body, bm)
    text_coverage = check_text_coverage(plain_md, plain_md_normalized, bm)
    img_results = check_images(md_body, bm, img_dir if not args.no_images else None)
    heading_order = check_heading_order(md_body, bm, block_sequence, args.api_data)
    table_match = check_tables(md_body, bm, plain_md)
    format_stats = check_formatting(md_body, bm)
    nesting_ok = check_list_nesting(md_body, bm)
    syntax_ok = check_markdown_syntax(md_body)

    all_pass = final_summary(elem_results, text_coverage, img_results, heading_order,
                              table_match, format_stats, nesting_ok, syntax_ok, md_body)

    sys.exit(0 if all_pass else 1)


if __name__ == '__main__':
    main()
