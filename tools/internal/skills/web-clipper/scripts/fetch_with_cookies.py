#!/usr/bin/env python3
"""Fetch web page content using Playwright with browser cookies.

Modes:
  profile  - Reuse Chrome user profile (Chrome must be closed)
  cookies  - Use exported cookies JSON file
  public   - No auth, but renders JS

Features:
  - Virtual-scroll support (Lark/Feishu)
  - Screenshot for non-extractable elements (canvas/whiteboard/mindmap)
  - Authenticated image download
  - Content completeness verification

Outputs JSON: title, content_markdown, images, url, stats, verification
"""

import argparse
import json
import os
import re
import subprocess
import sys
import time
from pathlib import Path


def get_chrome_user_data_dir() -> str:
    home = Path.home()
    for p in [home / "Library/Application Support/Google/Chrome",
              home / "Library/Application Support/Chromium"]:
        if p.exists():
            return str(p)
    return str(home / "Library/Application Support/Google/Chrome")


# ---------------------------------------------------------------------------
# Browser launch
# ---------------------------------------------------------------------------

def _launch(p, url, mode, wait, profile="Default", cookies_file=None):
    is_lark = any(h in url for h in ('larkoffice.com', 'feishu.cn', 'larksuite.com'))
    api_responses = [] if is_lark else None

    if mode == "profile":
        ctx = p.chromium.launch_persistent_context(
            user_data_dir=f"{get_chrome_user_data_dir()}/{profile}",
            headless=True, channel="chrome",
            viewport={"width": 1440, "height": 900},
        )
        page = ctx.new_page()
        browser = None
    elif mode == "cookies":
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(viewport={"width": 1440, "height": 900})
        ctx.add_cookies(json.loads(Path(cookies_file).read_text()))
        page = ctx.new_page()
    else:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(viewport={"width": 1440, "height": 900})
        page = ctx.new_page()

    # Intercept Lark API responses for block data
    if is_lark:
        def _handle_lark_response(response):
            if '/space/api/docx/pages/client_vars' in response.url:
                try:
                    if response.status == 200:
                        body = response.body()
                        api_responses.append(json.loads(body))
                except Exception:
                    pass
        page.on("response", _handle_lark_response)

    page.goto(url, wait_until="domcontentloaded", timeout=60000)
    time.sleep(wait)

    # For Lark pages, wait longer and scroll to trigger all API pages
    if is_lark and api_responses is not None:
        # Scroll slowly to trigger paginated API calls
        for _ in range(20):
            page.evaluate("window.scrollBy(0, 2000)")
            time.sleep(0.5)
        time.sleep(3)  # Wait for final API responses

    return ctx, page, browser, api_responses


# ---------------------------------------------------------------------------
# Special format catalog
# ---------------------------------------------------------------------------
# Every web/doc platform element we might encounter.
# This drives the JS extraction and the Markdown conversion.

BLOCK_TYPE_MAP = {
    # ── Headings ──
    "heading1-block": "h1",
    "heading2-block": "h2",
    "heading3-block": "h3",
    "heading4-block": "h4",
    "heading5-block": "h5",
    "heading6-block": "h6",
    # ── Text ──
    "text-block":     "text",
    "quote-block":    "quote",
    "callout-block":  "callout",
    # ── Lists ──
    "bullet-block":   "bullet",
    "list-block":     "bullet",
    "ordered-block":  "ordered",
    "todo-block":     "todo",
    # ── Code ──
    "code-block":     "code",
    # ── Media ──
    "image-block":    "image",
    "video-block":    "video",
    "file-block":     "file",
    # ── Structure ──
    "table-block":    "table",
    "grid-block":     "grid",
    "grid_column-block": "grid_col",
    "divider-block":  "divider",
    # ── Non-extractable (screenshot) ──
    "board-block":        "screenshot",   # 画板 / whiteboard
    "whiteboard-block":   "screenshot",
    "mindmap-block":      "screenshot",   # 思维导图
    "diagram-block":      "screenshot",   # 流程图
    "chart-block":        "screenshot",   # 图表
    "embed-block":        "embed",        # 嵌入内容
    "iframe-block":       "embed",
    # ── Lark special ──
    "bitable-block":  "bitable",          # 多维表格
    "view-block":     "bitable",
    "poll-block":     "poll",             # 投票
    "jira-block":     "embed",            # Jira 嵌入
    "okr-block":      "embed",            # OKR
    "sheet-block":    "sheet",            # 电子表格
    # ── Collapsible ──
    "toggle-block":   "toggle",           # 折叠块
    "collapse-block": "toggle",
    # ── Math ──
    "equation-block": "equation",         # 公式
    # ── Bookmark ──
    "bookmark-block": "bookmark",         # 链接书签预览
    "link-preview-block": "bookmark",
}


# ---------------------------------------------------------------------------
# Lark virtual-scroll extraction
# ---------------------------------------------------------------------------

def _build_lark_js():
    """Build JS: extract ALL leaf blocks in document order. No ancestor skip."""
    type_checks = []
    for cls_key, block_type in BLOCK_TYPE_MAP.items():
        type_checks.append(
            f"        if (cls.includes('{cls_key}')) return '{block_type}';"
        )
    type_switch = "\n".join(type_checks)

    return """() => {
    function getBlockType(cls) {
""" + type_switch + """
        return 'text';
    }

    const catalogue = document.querySelector('.catalogue__content, .catalogue__list');
    const result = [];
    const imgs = [];
    const screenshots = [];

    // Process ALL blocks with data-block-id in DOM order
    document.querySelectorAll('[data-block-id]').forEach(b => {
        if (catalogue && catalogue.contains(b)) return;
        const blockId = b.getAttribute('data-block-id') || '';
        const cls = b.className || '';
        const type = getBlockType(cls);
        const hasChildren = b.querySelectorAll('[data-block-id]').length > 0;

        // ── Table: extract as whole (special case for non-leaf) ──
        if (type === 'table' && hasChildren) {
            const rows = [];
            b.querySelectorAll('tr').forEach(tr => {
                // Skip rows with complex nested structures (bullet/grid/ordered inside cells)
                let hasComplex = false;
                tr.querySelectorAll('td, th').forEach(cell => {
                    const nested = cell.querySelector('[class*="bullet-block"], [class*="ordered-block"], [class*="grid-block"]');
                    if (nested) hasComplex = true;
                });
                if (hasComplex) return;
                const cells = [];
                tr.querySelectorAll('td, th').forEach(cell => {
                    let ct = cell.innerText.trim().replace(/\\u200b/g, '');
                    ct = ct.replace(/^[•◦▪●○◆►▸‣⁃][ \\t]*/gm, '');
                    ct = ct.replace(/\\n+/g, '<br>');
                    cells.push(ct);
                });
                if (cells.length > 0) rows.push(cells);
            });
            if (rows.length > 0) result.push({type: 'table', blockId, rows});
            return;
        }

        // Skip non-leaf blocks (their children will be processed individually)
        if (hasChildren) return;

        // Check ancestors for callout context
        let inCallout = false;
        let p = b.parentElement;
        while (p) {
            const pc = p.className || '';
            if (pc.includes('callout-block')) inCallout = true;
            p = p.parentElement;
        }

        // ── Text extraction ──
        let text = '';
        const tw = b.querySelector('.text-block-wrapper, .text, .ne-text');
        if (tw) { text = tw.innerText.trim(); }
        else { text = (b.innerText || '').trim(); }
        text = text.replace(/\\u200b/g, '');
        text = text.replace(/^[•◦▪●○◆►▸‣⁃][ \\t]*/gm, '');
        if (type === 'ordered') { text = text.replace(/^\\d+\\.\\s*/, ''); }
        text = text.split('\\n').filter(l => l.trim()).join('\\n').trim();

        // ── Image ──
        if (type === 'image' || cls.includes('image-block')) {
            const img = b.querySelector('img');
            if (img && img.src && !img.src.startsWith('blob:') && !img.src.startsWith('data:')) {
                const w = img.width || img.naturalWidth || 0;
                const h = img.height || img.naturalHeight || 0;
                imgs.push({src: img.src, alt: img.alt || '', blockId, w, h});
                result.push({type: 'image', blockId, text: img.alt || '', src: img.src, indent: 0, w, h, inCallout});
            }
            return;
        }

        // ── Screenshot-needed elements ──
        if (type === 'screenshot') {
            const rect = b.getBoundingClientRect();
            screenshots.push({
                blockId,
                type: cls.includes('board') || cls.includes('whiteboard') ? 'canvas' :
                      cls.includes('mindmap') ? 'mindmap' :
                      cls.includes('diagram') ? 'diagram' :
                      cls.includes('chart') ? 'chart' : 'visual',
                label: text || '',
                rect: {x: rect.x, y: rect.y, w: rect.width, h: rect.height},
                scrollY: window.scrollY || 0,
            });
            return;
        }

        // ── Equation ──
        if (type === 'equation') {
            const mathEl = b.querySelector('.katex-mathml, annotation, math');
            const latex = mathEl ? mathEl.textContent.trim() : text;
            if (latex) result.push({type: 'equation', blockId, text: latex, indent: 0, inCallout});
            return;
        }

        // ── Code ──
        if (type === 'code') {
            const lang = b.querySelector('[class*="language-"]');
            let langName = '';
            if (lang) {
                const m = lang.className.match(/language-(\\S+)/);
                if (m) langName = m[1];
            }
            result.push({type: 'code', blockId, text, indent: 0, lang: langName, inCallout});
            return;
        }

        // ── Embed / bookmark ──
        if (type === 'embed' || type === 'bookmark') {
            const link = b.querySelector('a[href]');
            const href = link ? link.href : '';
            const title = link ? link.textContent.trim() : text;
            result.push({type, blockId, text: title, href: href || '', indent: 0, inCallout});
            return;
        }

        // ── Bitable / sheet / poll ──
        if (['bitable', 'sheet', 'poll'].includes(type)) {
            result.push({type, blockId, text: text || '', indent: 0, inCallout});
            return;
        }

        // ── Toggle ──
        if (type === 'toggle') {
            result.push({type: 'toggle', blockId, text, indent: 0, inCallout});
            return;
        }

        // ── Video ──
        if (type === 'video') {
            const src = b.querySelector('video')?.src || b.querySelector('iframe')?.src || '';
            result.push({type: 'video', blockId, text: text || '', href: src, indent: 0, inCallout});
            return;
        }

        // ── File attachment ──
        if (type === 'file') {
            const link = b.querySelector('a[href]');
            result.push({type: 'file', blockId, text: text || 'attachment', href: link?.href || '', indent: 0, inCallout});
            return;
        }

        // ── Skip grid container types ──
        if (type === 'grid' || type === 'grid_col') return;

        // ── List indent ──
        let indent = 0;
        if (['bullet', 'ordered', 'todo'].includes(type)) {
            const m = cls.match(/indent-level-(\\d+)/);
            if (m) indent = parseInt(m[1]);
        }

        if (text) result.push({type, blockId, text, indent: indent || 0, inCallout});
    });

    return {blocks: result, images: imgs, screenshots};
}"""


def find_scroll_container(page):
    return page.evaluate("""() => {
        for (const sel of ['.bear-web-x-container', '.doc-scroll-container', '.docx-editor-scroll']) {
            const el = document.querySelector(sel);
            if (el && el.scrollHeight > el.clientHeight + 100) return sel;
        }
        let best = null, bestH = 0;
        document.querySelectorAll('div').forEach(el => {
            if (el.scrollHeight > el.clientHeight + 200 && el.scrollHeight > bestH && el.clientHeight > 200) {
                bestH = el.scrollHeight; best = el;
            }
        });
        if (best) { if (best.id) return '#' + best.id; if (best.className) return '.' + best.className.split(' ')[0]; }
        return null;
    }""")


def collect_lark(page, screenshot_dir=None, max_scrolls=400):
    """Scroll through Lark doc, collecting all blocks + screenshotting visual elements."""
    container = find_scroll_container(page)
    if not container:
        return [], [], []

    js = _build_lark_js()
    blocks, images, screenshot_infos = [], [], []
    seen = set()

    for i in range(max_scrolls):
        data = page.evaluate(js)

        for item in data['blocks']:
            bid = item.get('blockId', '')
            key = f"b:{bid}" if bid else hash(frozenset({('t', item.get('text', '')[:80]), ('type', item.get('type', ''))}))
            if key not in seen:
                seen.add(key)
                blocks.append(item)
            elif item.get('type') == 'table' and bid:
                # Update table if more rows appeared (virtual scroll)
                new_rows = item.get('rows', [])
                for j, existing in enumerate(blocks):
                    if existing.get('blockId') == bid and existing.get('type') == 'table':
                        if len(new_rows) > len(existing.get('rows', [])):
                            blocks[j] = item
                        break

        for img in data['images']:
            key = f"i:{img['src']}"
            if key not in seen:
                seen.add(key)
                images.append(img)

        # Safety net: scan ALL visible images on the page (catches images missed by block logic)
        extra_imgs = page.evaluate("""() => {
            const catalogue = document.querySelector('.catalogue__content, .catalogue__list');
            return Array.from(document.querySelectorAll('img[src]'))
                .filter(img => !(catalogue && catalogue.contains(img)))
                .filter(img => img.src && !img.src.startsWith('blob:') && img.offsetWidth > 1)
                .map(img => ({src: img.src, alt: img.alt || '', blockId: '', w: img.width || 0, h: img.height || 0}));
        }""")
        for eimg in extra_imgs:
            key = f"i:{eimg['src']}"
            if key not in seen:
                seen.add(key)
                images.append(eimg)
                # Add as inline block at current scroll position
                blocks.append({
                    'type': 'image', 'blockId': '', 'text': eimg.get('alt', 'image'),
                    'src': eimg['src'], 'indent': 0, 'w': eimg.get('w', 0),
                    'h': eimg.get('h', 0), 'inCallout': False,
                })

        # Collect screenshot-needed elements
        for ss in data.get('screenshots', []):
            bid = ss.get('blockId', '')
            rect = ss.get('rect', {})
            ss_key = bid if bid else 'ss-%s-%s' % (rect.get('x', 0), rect.get('y', 0))
            key = 's:' + ss_key
            if key not in seen:
                seen.add(key)
                if screenshot_dir:
                    # Take screenshot of this element
                    fname = _take_element_screenshot(page, ss, screenshot_dir, len(screenshot_infos) + 1)
                    if fname:
                        ss['local_file'] = fname
                screenshot_infos.append(ss)

        at_bottom = page.evaluate(f"""() => {{
            const c = document.querySelector('{container}');
            if (!c) return true;
            const before = c.scrollTop;
            c.scrollBy(0, 300);
            return c.scrollTop === before;
        }}""")

        if at_bottom:
            break
        time.sleep(0.3)

    return blocks, images, screenshot_infos


def _take_element_screenshot(page, ss_info, output_dir, index):
    """Screenshot a visual element (canvas/whiteboard/mindmap) by scrolling to it."""
    try:
        bid = ss_info.get('blockId', '')
        if bid:
            el = page.query_selector(f'[data-block-id="{bid}"]')
            if el and el.is_visible():
                fname = f"visual-{index:03d}-{ss_info['type']}.png"
                fpath = os.path.join(output_dir, fname)
                el.screenshot(path=fpath)
                return fname
    except Exception:
        pass
    return None


# ---------------------------------------------------------------------------
# Markdown conversion
# ---------------------------------------------------------------------------

def blocks_to_markdown(blocks, images, screenshot_infos, img_folder=""):
    """Convert collected blocks to Markdown. Blocks have optional inCallout flag."""
    # Build set of text snippets already in tables (for dedup of leaf blocks inside tables)
    table_texts = set()
    for item in blocks:
        if item.get('type') == 'table':
            for row in item.get('rows', []):
                for cell in row:
                    clean = re.sub(r'\u200b', '', cell).strip()
                    # Add 20-char snippets of each line in the cell
                    for line in clean.replace('<br>', '\n').split('\n'):
                        s = line.strip()
                        if len(s) >= 8:
                            table_texts.add(s[:20])

    parts = []

    for item in blocks:
        t = item['type']
        text = re.sub(r'\u200b', '', item.get('text', '')).strip()
        in_callout = item.get('inCallout', False)
        q = "> " if in_callout else ""  # callout prefix

        # Skip leaf blocks whose text is already captured in a table cell
        # But keep bullet/ordered blocks so they appear as proper list items
        if t not in ('table', 'image', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'bullet', 'ordered', 'todo') and text and len(text) >= 8:
            snippet = text[:20]
            if snippet in table_texts:
                continue

        if t in ('h1', 'h2', 'h3', 'h4', 'h5', 'h6'):
            level = int(t[1])
            text = text.replace('\n', ' ').strip()
            parts.append(f"\n{q}{'#' * level} {text}\n")

        elif t == 'bullet':
            indent = '  ' * item.get('indent', 0)
            parts.append(f"{q}{indent}- {text}")

        elif t == 'ordered':
            indent = '  ' * item.get('indent', 0)
            text = re.sub(r'^\d+[.)]\s*', '', text)
            parts.append(f"{q}{indent}1. {text}")

        elif t == 'todo':
            mark = '[x]' if any(c in text for c in '☑✅✓') else '[ ]'
            clean = re.sub(r'^[\[x\] ☑✅✓☐]+\s*', '', text)
            parts.append(f"{q}- {mark} {clean}")

        elif t == 'code':
            lang = item.get('lang', '')
            if in_callout:
                parts.append(f"> ```{lang}\n> {text}\n> ```")
            else:
                parts.append(f"\n```{lang}\n{text}\n```\n")

        elif t == 'quote':
            lines = text.split('\n')
            parts.append('\n' + '\n'.join(f"> {l}" for l in lines) + '\n')

        elif t == 'callout':
            # Legacy: callout container block (only if extracted as container)
            lines = text.split('\n')
            parts.append('\n' + '\n'.join(f"> {l}" for l in lines) + '\n')

        elif t == 'divider':
            parts.append("\n---\n")

        elif t == 'equation':
            parts.append(f"\n{q}$$\n{q}{text}\n{q}$$\n")

        elif t == 'table':
            rows = item.get('rows', [])
            if rows:
                def esc(c):
                    return re.sub(r'\u200b', '', c).replace('|', '\\|').replace('\n', '<br>')
                ncols = max(len(r) for r in rows)
                parts.append("")
                parts.append("| " + " | ".join(esc(c) for c in rows[0] + [''] * (ncols - len(rows[0]))) + " |")
                parts.append("| " + " | ".join(["---"] * ncols) + " |")
                for row in rows[1:]:
                    if all(not c.strip() for c in row):
                        continue
                    padded = row + [''] * (ncols - len(row))
                    parts.append("| " + " | ".join(esc(c) for c in padded) + " |")
                parts.append("")

        elif t == 'toggle':
            parts.append(f"\n<details>\n<summary>{text}</summary>\n\n</details>\n")

        elif t == 'bookmark' or t == 'embed':
            href = item.get('href', '')
            if href:
                parts.append(f"\n{q}[{text or href}]({href})\n")
            else:
                parts.append(f"\n{q}{text}\n")

        elif t == 'video':
            href = item.get('href', '')
            parts.append(f"\n{q}**[视频]** [{text or '视频链接'}]({href})\n")

        elif t == 'file':
            href = item.get('href', '')
            parts.append(f"\n{q}**[附件]** [{text}]({href})\n")

        elif t == 'bitable':
            parts.append(f"\n{q}**[多维表格]** {text}\n{q}*请在飞书中查看原始多维表格*\n")

        elif t == 'sheet':
            parts.append(f"\n{q}**[电子表格]** {text}\n{q}*请在飞书中查看原始表格*\n")

        elif t == 'poll':
            parts.append(f"\n{q}**[投票]** {text}\n{q}*请在飞书中查看投票*\n")

        elif t == 'image':
            src = item.get('src', '')
            alt = text or 'image'
            w = item.get('w', 0)
            if src and not src.startswith('blob:'):
                if w and w > 0:
                    parts.append(f"\n{q}![{alt}|{w}]({src})\n")
                else:
                    parts.append(f"\n{q}![{alt}]({src})\n")

        else:
            if text:
                parts.append(f"\n{q}{text}\n")

    # Append screenshot references
    for ss in screenshot_infos:
        label = ss.get('type', 'visual')
        type_names = {'canvas': '画板', 'mindmap': '思维导图', 'diagram': '流程图', 'chart': '图表', 'visual': '可视化'}
        display_name = type_names.get(label, label)
        local = ss.get('local_file', '')
        if local and img_folder:
            parts.append(f"\n**[{display_name}]**\n![{display_name}]({img_folder}/{local})\n")
        elif local:
            parts.append(f"\n**[{display_name}]**\n![{display_name}]({local})\n")
        else:
            parts.append(f"\n> **[{display_name}]** {ss.get('label', '')}\n> *请在飞书中查看原始{display_name}*\n")

    result = '\n'.join(parts)
    result = re.sub(r'\n{3,}', '\n\n', result)
    return result.strip()


# ---------------------------------------------------------------------------
# Standard page extraction
# ---------------------------------------------------------------------------

def extract_standard(page):
    """Extract standard web page content. Try defuddle first, fall back to markdownify."""
    html = page.content()
    page_url = page.url

    # Try defuddle (high-quality markdown conversion)
    bridge = os.path.join(os.path.dirname(__file__), 'defuddle_bridge.mjs')
    if os.path.exists(bridge):
        try:
            proc = subprocess.run(
                ['node', bridge, '--url', page_url],
                input=html, capture_output=True, text=True, timeout=30,
            )
            if proc.returncode == 0:
                data = json.loads(proc.stdout)
                content = data.get('content', '')
                if content and len(content) > 100:
                    return content, data
        except Exception:
            pass

    # Fallback: markdownify / regex
    try:
        from markdownify import markdownify as md
        from bs4 import BeautifulSoup
    except ImportError:
        md = None

    raw_html = page.evaluate("""() => {
        const sels = ['article','main','[role="main"]','.article-content','.post-content','.entry-content','.content'];
        for (const s of sels) { const e = document.querySelector(s); if (e && e.innerHTML.trim().length > 200) return e.innerHTML; }
        const b = document.body.cloneNode(true);
        b.querySelectorAll('script,style,svg,nav,footer,header,[role="navigation"]').forEach(e => e.remove());
        return b.innerHTML;
    }""")

    if md:
        soup = BeautifulSoup(raw_html, 'html.parser')
        for t in soup.find_all(['script', 'style', 'svg']): t.decompose()
        content = md(str(soup), heading_style='ATX', bullets='-')
    else:
        content = re.sub(r'<[^>]+>', '', raw_html)

    content = re.sub(r'\u200b', '', content)
    content = re.sub(r'\n{3,}', '\n\n', content)
    return content.strip(), None


# ---------------------------------------------------------------------------
# Image download
# ---------------------------------------------------------------------------

def download_lark_images(page, tokens, output_dir, timeout=15000):
    """Download Lark document images by token using authenticated page context."""
    os.makedirs(output_dir, exist_ok=True)
    mapping, errors = {}, []

    # Determine internal API domain from page URL
    from urllib.parse import urlparse
    parsed = urlparse(page.url)
    # Map page domain to internal API domain
    # bytedance.sg.larkoffice.com -> internal-api-drive-stream-sg.larkoffice.com
    # feishu.cn -> internal-api-drive-stream.feishu.cn
    host = parsed.netloc
    if 'larkoffice.com' in host:
        region = host.split('.')[1] if host.count('.') >= 3 else ''
        api_domain = f"internal-api-drive-stream-{region}.larkoffice.com" if region else "internal-api-drive-stream.larkoffice.com"
    elif 'feishu.cn' in host:
        api_domain = "internal-api-drive-stream.feishu.cn"
    else:
        api_domain = f"internal-api-drive-stream.{'.'.join(host.split('.')[-2:])}"

    for i, token in enumerate(tokens, 1):
        try:
            url = f"https://{api_domain}/space/api/box/stream/download/preview/{token}/?preview_type=16"
            resp = page.request.get(url, timeout=timeout)
            if resp.ok:
                ct = resp.headers.get('content-type', '')
                ext = '.png'
                if 'jpeg' in ct or 'jpg' in ct: ext = '.jpg'
                elif 'gif' in ct: ext = '.gif'
                elif 'webp' in ct: ext = '.webp'
                elif 'svg' in ct: ext = '.svg'
                fname = f"image-{i:03d}{ext}"
                with open(os.path.join(output_dir, fname), 'wb') as f:
                    f.write(resp.body())
                mapping[token] = fname
                if i % 20 == 0:
                    print(f"  Downloaded {i}/{len(tokens)}...", file=sys.stderr)
            else:
                errors.append({"token": token, "status": resp.status})
        except Exception as e:
            errors.append({"token": token, "error": str(e)})

    return mapping, errors


def download_images(page, urls, output_dir, timeout=15000):
    os.makedirs(output_dir, exist_ok=True)
    mapping, errors = {}, []

    for i, url in enumerate(urls, 1):
        if url.startswith('blob:'):
            continue
        try:
            resp = page.request.get(url, timeout=timeout)
            if resp.ok:
                ct = resp.headers.get('content-type', '')
                ext = '.png'
                if 'jpeg' in ct or 'jpg' in ct: ext = '.jpg'
                elif 'gif' in ct: ext = '.gif'
                elif 'webp' in ct: ext = '.webp'
                elif 'svg' in ct: ext = '.svg'
                fname = f"image-{i:03d}{ext}"
                with open(os.path.join(output_dir, fname), 'wb') as f:
                    f.write(resp.body())
                mapping[url] = fname
                if i % 20 == 0:
                    print(f"  Downloaded {i}/{len(urls)}...", file=sys.stderr)
            else:
                errors.append({"url": url, "status": resp.status})
        except Exception as e:
            errors.append({"url": url, "error": str(e)})

    return mapping, errors


# ---------------------------------------------------------------------------
# Content verification
# ---------------------------------------------------------------------------

def verify_content(page, blocks, images, screenshot_infos):
    """Compare extracted content against original page structure for completeness.

    Reports word count (characters) and image count for easy comparison.
    """
    original = page.evaluate("""() => {
        const container = document.querySelector('.bear-web-x-container, article, main, body');
        if (!container) return null;
        const headings = container.querySelectorAll('[class*="heading"], h1, h2, h3, h4, h5, h6').length;
        const paras = container.querySelectorAll('[class*="text-block"], p').length;
        // Count unique image URLs currently visible
        const imgEls = container.querySelectorAll('img[src]');
        const uniqueSrcs = new Set();
        imgEls.forEach(img => { if (img.src && !img.src.startsWith('blob:')) uniqueSrcs.add(img.src); });
        const tables = container.querySelectorAll('table, [class*="table-block"]').length;
        const codeBlocks = container.querySelectorAll('[class*="code-block"], pre').length;
        const lists = container.querySelectorAll('[class*="bullet-block"], [class*="ordered-block"], li').length;
        // Character count from all leaf blocks
        let totalChars = 0;
        container.querySelectorAll('[data-block-id]').forEach(b => {
            if (b.querySelectorAll('[data-block-id]').length === 0) {
                totalChars += (b.innerText || '').replace(/\\u200b/g, '').trim().length;
            }
        });
        return {headings, paragraphs: paras, images: uniqueSrcs.size, tables, codeBlocks, lists, totalChars};
    }""")

    if not original:
        return {"status": "skipped", "reason": "could not find content container"}

    # Count extracted characters from all block text
    ext_chars = 0
    for b in blocks:
        ext_chars += len(b.get('text', ''))

    extracted = {
        "headings": sum(1 for b in blocks if b['type'].startswith('h')),
        "paragraphs": sum(1 for b in blocks if b['type'] in ('text', 'bullet', 'ordered', 'callout', 'quote')),
        "images": len(images),
        "tables": sum(1 for b in blocks if b['type'] == 'table'),
        "codeBlocks": sum(1 for b in blocks if b['type'] == 'code'),
        "lists": sum(1 for b in blocks if b['type'] in ('bullet', 'ordered', 'todo')),
        "screenshots": len(screenshot_infos),
        "totalChars": ext_chars,
    }

    issues = []
    # Image count check
    orig_imgs = original.get('images', 0)
    ext_imgs = extracted['images']
    if orig_imgs > 0 and ext_imgs < orig_imgs * 0.8:
        issues.append(f"images: extracted {ext_imgs} vs page visible ~{orig_imgs}")
    # Character count check
    orig_chars = original.get('totalChars', 0)
    if orig_chars > 0 and ext_chars < orig_chars * 0.7:
        issues.append(f"chars: extracted {ext_chars} vs page visible ~{orig_chars}")
    # Heading count check
    for key in ['headings', 'tables']:
        orig = original.get(key, 0)
        ext = extracted.get(key, 0)
        if orig > 0 and ext < orig * 0.5:
            issues.append(f"{key}: extracted {ext} vs page visible ~{orig}")

    return {
        "status": "pass" if not issues else "warning",
        "original_counts": original,
        "extracted_counts": extracted,
        "issues": issues,
        "summary": f"Images: {ext_imgs} extracted (page visible: ~{orig_imgs}) | Chars: {ext_chars} extracted (page visible: ~{original.get('totalChars', '?')})",
    }


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def extract_lark_api(page, api_responses, screenshot_dir=None):
    """Extract Lark document using intercepted API data (high accuracy)."""
    from lark_blocks_to_md import blocks_to_markdown as lark_api_to_md

    md, meta = lark_api_to_md(api_responses, page.url)
    title = meta.get('title', page.title().replace(' - 飞书云文档', '').strip())
    image_tokens = meta.get('image_tokens', [])

    return {
        "title": title,
        "content_markdown": md,
        "images": [],  # image download handled separately via tokens
        "image_tokens": image_tokens,
        "url": page.url,
        "mode": "lark_api",
        "stats": {
            "total_blocks": meta.get('total_blocks', 0),
            "top_level_blocks": meta.get('top_level_blocks', 0),
            "images": len(image_tokens),
        },
    }


def extract_page(page, screenshot_dir=None, api_responses=None):
    title = page.title()

    is_lark = page.evaluate("""() => !!(
        document.querySelector('[class*="block docx-"]') ||
        document.querySelector('.bear-web-x-container')
    )""")

    if is_lark:
        # Prefer API-based extraction if we have intercepted responses
        if api_responses:
            return extract_lark_api(page, api_responses, screenshot_dir)

        # Fallback to virtual scroll extraction
        blocks, images, screenshots = collect_lark(page, screenshot_dir)
        img_folder = ""  # will be set by caller
        content_md = blocks_to_markdown(blocks, images, screenshots, img_folder)
        image_urls = [img['src'] for img in images if not img['src'].startswith('blob:')]

        # Verify completeness
        verification = verify_content(page, blocks, images, screenshots)

        return {
            "title": title.replace(' - 飞书云文档', '').strip(),
            "content_markdown": content_md,
            "images": image_urls,
            "url": page.url,
            "mode": "lark_virtual_scroll",
            "stats": {"blocks": len(blocks), "images": len(images), "screenshots": len(screenshots)},
            "verification": verification,
        }
    else:
        content_md, defuddle_meta = extract_standard(page)
        images = page.evaluate("""() =>
            Array.from(document.querySelectorAll('img'))
                .map(img => img.src).filter(s => s && s.startsWith('http'))
        """)
        result_title = title
        if defuddle_meta:
            result_title = defuddle_meta.get('title', title) or title
        return {
            "title": result_title,
            "content_markdown": content_md,
            "images": list(set(images)),
            "url": page.url,
            "mode": "defuddle" if defuddle_meta else "standard",
        }


def main():
    parser = argparse.ArgumentParser(description="Fetch web page with Playwright")
    parser.add_argument("url")
    parser.add_argument("--mode", choices=["profile", "cookies", "public"], default="public")
    parser.add_argument("--cookies-file")
    parser.add_argument("--profile", default="Default")
    parser.add_argument("--wait", type=int, default=5)
    parser.add_argument("--download-images", help="Directory to download images to")
    parser.add_argument("--note-name", help="Note filename (without .md) for Obsidian attachment convention")
    parser.add_argument("--save-api-data", help="Save intercepted Lark API data to this JSON path (for post-hoc verification)")
    args = parser.parse_args()

    from playwright.sync_api import sync_playwright

    try:
        with sync_playwright() as p:
            ctx, page, browser, api_responses = _launch(p, args.url, args.mode, args.wait,
                                                       args.profile, args.cookies_file)

            # Screenshot dir = image download dir (for canvas/whiteboard captures)
            screenshot_dir = args.download_images
            result = extract_page(page, screenshot_dir, api_responses)

            # Save API data for post-hoc verification
            if args.save_api_data and api_responses:
                with open(args.save_api_data, 'w') as f:
                    json.dump(api_responses, f, ensure_ascii=False)
                print(f"API data saved to {args.save_api_data} ({len(api_responses)} pages)", file=sys.stderr)

            # Download images
            if args.download_images:
                img_prefix = f"assets/{args.note_name}" if args.note_name else ""
                md = result['content_markdown']

                # Lark API mode: download by token
                if result.get('image_tokens'):
                    mapping, errors = download_lark_images(page, result['image_tokens'], args.download_images)
                    result['image_mapping'] = mapping
                    result['image_errors'] = errors
                    for token, local_fname in mapping.items():
                        local_path = f"{img_prefix}/{local_fname}" if img_prefix else local_fname
                        md = md.replace(f'lark-image://{token}', local_path)

                # Standard mode: download by URL
                elif result['images']:
                    mapping, errors = download_images(page, result['images'], args.download_images)
                    result['image_mapping'] = mapping
                    result['image_errors'] = errors
                    for remote_url, local_fname in mapping.items():
                        local_path = f"{img_prefix}/{local_fname}" if img_prefix else local_fname
                        md = md.replace(remote_url, local_path)
                    md = re.sub(r'!\[.*?\]\(blob:.*?\)\n?', '', md)

                # Fix screenshot image paths to use Obsidian convention
                if img_prefix:
                    md = re.sub(r'!\[([^\]]*)\]\((visual-[^)]+)\)',
                                lambda m: f'![{m.group(1)}]({img_prefix}/{m.group(2)})', md)

                result['content_markdown'] = md

            print(json.dumps(result, ensure_ascii=False, indent=2))

            if browser:
                browser.close()
            else:
                ctx.close()

    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
