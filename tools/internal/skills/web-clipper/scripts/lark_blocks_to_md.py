"""Convert Lark internal API block_map to Markdown.

Parses the block data from /space/api/docx/pages/client_vars responses
and converts to clean Markdown suitable for Obsidian.
"""

import json
import re
from urllib.parse import unquote


def parse_etherpad_text(text_data):
    """Parse Etherpad-style attributed text into a list of (text, attrs) segments.

    text_data = {
        "apool": {"numToAttrib": {"0": ["author","..."], "1": ["bold","true"]}},
        "initialAttributedTexts": {
            "text": {"0": "Hello world"},
            "attribs": {"0": "*0*1+5*0+6"}
        }
    }
    Returns: list of (substring, {attr_name: attr_value, ...})
    """
    if not text_data:
        return []

    apool = text_data.get('apool', {}).get('numToAttrib', {}) or {}
    iat = text_data.get('initialAttributedTexts', {}) or {}
    text_dict = iat.get('text') or {}
    attribs_dict = iat.get('attribs') or {}
    full_text = ''.join(text_dict.get(str(i), '') for i in range(len(text_dict)))
    attribs_str = ''.join(attribs_dict.get(str(i), '') for i in range(len(attribs_dict)))

    if not full_text:
        return []

    # Parse attribs string: *N means apply attr N, +XX means advance XX chars (base 36)
    segments = []
    current_attrs = []
    pos = 0
    i = 0
    while i < len(attribs_str):
        ch = attribs_str[i]
        if ch == '*':
            # Read attribute index (base 36 number)
            i += 1
            num_str = ''
            while i < len(attribs_str) and attribs_str[i] not in ('*', '+', '-', '=', '|'):
                num_str += attribs_str[i]
                i += 1
            if num_str:
                current_attrs.append(int(num_str, 36))
        elif ch == '+':
            # Read length (base 36)
            i += 1
            len_str = ''
            while i < len(attribs_str) and attribs_str[i] not in ('*', '+', '-', '=', '|'):
                len_str += attribs_str[i]
                i += 1
            length = int(len_str, 36) if len_str else 0
            # Build attrs dict
            attrs = {}
            for idx in current_attrs:
                pair = apool.get(str(idx), ['', ''])
                name, value = pair[0], pair[1]
                if name and name != 'author':  # skip author attr
                    attrs[name] = value
            segment_text = full_text[pos:pos + length]
            if segment_text:
                segments.append((segment_text, attrs))
            pos += length
            current_attrs = []
        else:
            i += 1

    # If no attribs parsed, return plain text
    if not segments and full_text:
        segments = [(full_text, {})]

    return segments


def segments_to_markdown(segments):
    """Convert list of (text, attrs) segments to formatted markdown string."""
    parts = []
    for text, attrs in segments:
        md = text
        if attrs.get('bold') == 'true':
            md = f'**{md}**'
        if attrs.get('italic') == 'true':
            md = f'*{md}*'
        if 'link' in attrs:
            url = unquote(attrs['link'])
            md = f'[{md}]({url})'
        if attrs.get('underline') == 'true' and 'link' not in attrs:
            # Markdown doesn't support underline natively, skip
            pass
        # inline-component (mentions, etc.) - keep text as-is
        parts.append(md)

    result = ''.join(parts)
    # Clean up adjacent bold markers: **text1****text2** -> **text1text2**
    result = re.sub(r'\*\*\*\*', '', result)
    return result


def get_block_text(block, bm):
    """Get the markdown-formatted text content of a block."""
    data = block.get('data', {})
    text_data = data.get('text')
    if not text_data:
        return ''
    segments = parse_etherpad_text(text_data)
    return segments_to_markdown(segments)


def get_plain_text(block, bm):
    """Get plain text content of a block (no formatting)."""
    data = block.get('data', {})
    text_data = data.get('text')
    if not text_data:
        return ''
    iat = text_data.get('initialAttributedTexts', {})
    return ''.join(iat.get('text', {}).get(str(i), '') for i in range(len(iat.get('text', {}))))


def render_block(block_id, bm, block_sequence, indent=0):
    """Render a single block and its children to markdown lines.

    Returns list of markdown lines.
    """
    block = bm.get(block_id)
    if not block:
        return []

    data = block.get('data', {})
    btype = data.get('type', '')
    lines = []

    if btype in ('heading1', 'heading2', 'heading3', 'heading4', 'heading5', 'heading6'):
        level = int(btype[-1])
        text = get_block_text(block, bm)
        lines.append(f'{"#" * level} {text}')
        lines.append('')

    elif btype == 'text':
        text = get_block_text(block, bm)
        lines.append(text)
        lines.append('')
        # Render nested children (bullets/ordered under text)
        for child_id in data.get('children', []):
            child = bm.get(child_id, {})
            child_type = child.get('data', {}).get('type', '')
            if child_type in ('bullet', 'ordered', 'text', 'image'):
                lines.extend(render_block(child_id, bm, block_sequence, indent))

    elif btype == 'bullet':
        text = get_block_text(block, bm)
        prefix = '  ' * indent + '- '
        lines.append(f'{prefix}{text}')
        # Render nested children (sub-bullets)
        for child_id in data.get('children', []):
            child = bm.get(child_id, {})
            child_type = child.get('data', {}).get('type', '')
            if child_type in ('bullet', 'ordered', 'text'):
                lines.extend(render_block(child_id, bm, block_sequence, indent + 1))

    elif btype == 'ordered':
        text = get_block_text(block, bm)
        prefix = '  ' * indent + '1. '
        lines.append(f'{prefix}{text}')
        for child_id in data.get('children', []):
            child = bm.get(child_id, {})
            child_type = child.get('data', {}).get('type', '')
            if child_type in ('bullet', 'ordered', 'text'):
                lines.extend(render_block(child_id, bm, block_sequence, indent + 1))

    elif btype == 'image':
        img = data.get('image', {})
        token = img.get('token', '')
        caption_text = ''
        caption = img.get('caption', {})
        if caption and isinstance(caption, dict):
            caption_td = caption.get('text')
            if caption_td and isinstance(caption_td, dict):
                segs = parse_etherpad_text(caption_td)
                caption_text = segments_to_markdown(segs)

        if token:
            # Clean newlines from caption for alt text
            alt = (caption_text or token).replace('\n', ' ').strip()
            lines.append(f'![{alt}](lark-image://{token})')
            if caption_text:
                clean_caption = caption_text.replace('\n', ' ').strip()
                lines.append(f'*{clean_caption}*')
            lines.append('')

    elif btype == 'divider':
        lines.append('---')
        lines.append('')

    elif btype == 'quote_container':
        # Render children as blockquote
        for child_id in data.get('children', []):
            child_lines = render_block(child_id, bm, block_sequence)
            for line in child_lines:
                if line:
                    lines.append(f'> {line}')
                else:
                    lines.append('>')
        lines.append('')

    elif btype == 'callout':
        emoji = data.get('emoji_id', '')
        emoji_map = {
            'bulb': '💡', 'star': '⭐', 'warning': '⚠️', 'info': 'ℹ️',
            'check': '✅', 'fire': '🔥', 'pin': '📌', 'bookmark': '🔖',
        }
        emoji_char = emoji_map.get(emoji, f':{emoji}:' if emoji else '')
        # Render as Obsidian callout
        lines.append(f'> [!note] {emoji_char}')
        for child_id in data.get('children', []):
            child_lines = render_block(child_id, bm, block_sequence)
            for line in child_lines:
                if line:
                    lines.append(f'> {line}')
                else:
                    lines.append('>')
        lines.append('')

    elif btype == 'grid':
        # Grid is a multi-column layout - flatten columns sequentially
        for child_id in data.get('children', []):
            lines.extend(render_grid_column(child_id, bm, block_sequence))

    elif btype == 'grid_column':
        lines.extend(render_grid_column(block_id, bm, block_sequence))

    elif btype == 'table':
        lines.extend(render_table(block_id, bm, block_sequence))
        lines.append('')

    elif btype == 'table_cell':
        # Should not be rendered directly - handled by render_table
        pass

    return lines


def render_cell_content(cell_id, bm, block_sequence):
    """Render table cell content recursively, flattening nested structures."""
    cell = bm.get(cell_id, {})
    result = []
    for child_id in cell.get('data', {}).get('children', []):
        child = bm.get(child_id, {})
        child_type = child.get('data', {}).get('type', '')
        if child_type in ('text', 'heading1', 'heading2', 'heading3', 'heading4',
                          'heading5', 'heading6', 'bullet', 'ordered'):
            text = get_block_text(child, bm)
            if text:
                result.append(text)
        elif child_type == 'image':
            img = child.get('data', {}).get('image', {})
            token = img.get('token', '')
            if token:
                result.append(f'![](lark-image://{token})')
        elif child_type == 'grid':
            # Flatten grid columns inside table cells
            for col_id in child.get('data', {}).get('children', []):
                col = bm.get(col_id, {})
                for gc_child_id in col.get('data', {}).get('children', []):
                    gc_child = bm.get(gc_child_id, {})
                    gc_type = gc_child.get('data', {}).get('type', '')
                    if gc_type == 'image':
                        token = gc_child.get('data', {}).get('image', {}).get('token', '')
                        if token:
                            result.append(f'![](lark-image://{token})')
                    else:
                        text = get_block_text(gc_child, bm)
                        if text:
                            result.append(text)
    return result


def render_grid_column(column_id, bm, block_sequence):
    """Render a grid column's children."""
    col = bm.get(column_id, {})
    lines = []
    for child_id in col.get('data', {}).get('children', []):
        lines.extend(render_block(child_id, bm, block_sequence))
    return lines


def render_table(table_id, bm, block_sequence):
    """Render a table block as markdown table."""
    table = bm.get(table_id, {})
    data = table.get('data', {})
    cols_ids = data.get('columns_id', [])
    rows_ids = data.get('rows_id', [])
    n_cols = len(cols_ids)
    n_rows = len(rows_ids)

    if not n_cols or not n_rows:
        return []

    # Find cells in block_sequence order
    cells_in_order = [bid for bid in block_sequence
                      if bm.get(bid, {}).get('data', {}).get('parent_id') == table_id
                      and bm.get(bid, {}).get('data', {}).get('type') == 'table_cell']

    # Build 2D grid
    grid = []
    for r in range(n_rows):
        row = []
        for c in range(n_cols):
            idx = r * n_cols + c
            if idx < len(cells_in_order):
                cell_id = cells_in_order[idx]
                cell = bm.get(cell_id, {})
                # Render cell content
                cell_lines = render_cell_content(cell_id, bm, block_sequence)
                row.append(' '.join(line for line in cell_lines if line.strip()))
            else:
                row.append('')
        grid.append(row)

    if not grid:
        return []

    # Build markdown table
    lines = []
    # Header row
    lines.append('| ' + ' | '.join(grid[0]) + ' |')
    lines.append('| ' + ' | '.join(['---'] * n_cols) + ' |')
    # Data rows
    for row in grid[1:]:
        # Escape pipe characters in cell content
        escaped = [cell.replace('|', '\\|') for cell in row]
        lines.append('| ' + ' | '.join(escaped) + ' |')

    return lines


def blocks_to_markdown(api_data, doc_url=''):
    """Convert Lark API response data to markdown.

    Args:
        api_data: list of API response dicts (from client_vars endpoint)
        doc_url: original document URL

    Returns:
        (markdown_str, metadata_dict)
    """
    # Merge all pages
    bm = {}
    block_sequence = []
    for page in api_data:
        page_data = page.get('data', {}) if isinstance(page, dict) else {}
        bm.update(page_data.get('block_map', {}))
        seq = page_data.get('block_sequence', [])
        if seq:
            block_sequence.extend(seq)

    if not bm:
        return '', {}

    # Determine root document ID
    # Try from URL first, then find blocks whose parent_id is not in block_map
    root_id = ''
    if doc_url:
        # Extract doc ID from URL like .../docx/XXXXX
        m = re.search(r'/docx/([A-Za-z0-9]+)', doc_url)
        if m:
            root_id = m.group(1)

    if not root_id:
        # Find root by looking at parent_ids
        parent_counts = {}
        for bid, block in bm.items():
            pid = block.get('data', {}).get('parent_id', '')
            if pid and pid not in bm:
                parent_counts[pid] = parent_counts.get(pid, 0) + 1
        if parent_counts:
            root_id = max(parent_counts, key=parent_counts.get)

    # Find top-level block IDs (blocks whose parent is not in block_map)
    top_level_set = set()
    for bid, block in bm.items():
        pid = block.get('data', {}).get('parent_id', '')
        if pid and pid not in bm:
            top_level_set.add(bid)

    # Render top-level blocks in sequence order
    md_lines = []
    rendered = set()

    for bid in block_sequence:
        if bid in top_level_set and bid not in rendered:
            rendered.add(bid)
            lines = render_block(bid, bm, block_sequence)
            md_lines.extend(lines)

    # Also render any top-level blocks not in sequence (shouldn't happen, but safe)
    for bid in top_level_set - rendered:
        lines = render_block(bid, bm, block_sequence)
        md_lines.extend(lines)

    markdown = '\n'.join(md_lines)

    # Clean up excessive blank lines
    markdown = re.sub(r'\n{3,}', '\n\n', markdown)

    # Extract title (first heading1)
    title = ''
    for bid in block_sequence:
        block = bm.get(bid, {})
        if block.get('data', {}).get('type') == 'heading1':
            title = get_plain_text(block, bm)
            break

    # Collect image tokens in document render order (from markdown output)
    image_tokens = re.findall(r'lark-image://([A-Za-z0-9]+)', markdown)
    seen_tokens = set()
    unique_tokens = []
    for t in image_tokens:
        if t not in seen_tokens:
            seen_tokens.add(t)
            unique_tokens.append(t)
    image_tokens = unique_tokens

    metadata = {
        'title': title,
        'total_blocks': len(bm),
        'top_level_blocks': len(top_level_set),
        'image_tokens': image_tokens,
        'root_id': root_id,
    }

    return markdown.strip(), metadata


def convert_file(json_path, doc_url=''):
    """Convert a saved API data JSON file to markdown."""
    with open(json_path) as f:
        api_data = json.load(f)
    return blocks_to_markdown(api_data, doc_url)


if __name__ == '__main__':
    import sys
    if len(sys.argv) < 2:
        print('Usage: python lark_blocks_to_md.py <api_data.json> [--url <doc_url>]')
        sys.exit(1)

    json_path = sys.argv[1]
    doc_url = ''
    for i, arg in enumerate(sys.argv):
        if arg == '--url' and i + 1 < len(sys.argv):
            doc_url = sys.argv[i + 1]

    md, meta = convert_file(json_path, doc_url)
    print(md)
    print('\n\n---\nMetadata:', json.dumps(meta, ensure_ascii=False, indent=2), file=sys.stderr)
