# Special Website Handling Methodology

When a website doesn't extract well with the standard defuddle pipeline, follow this guide to diagnose and build a custom extractor.

## Diagnosis Checklist

Before building custom logic, check these common issues first:

1. **Content not loaded**: Increase `--wait` time, try `--wait 10` or higher
2. **Auth required**: Use `--mode profile` (Chrome closed) or `--mode cookies`
3. **Content behind click/expand**: May need Playwright interaction (click buttons, expand sections)
4. **Infinite scroll**: Need scroll collection logic

## Decision: DOM vs API

Two fundamentally different approaches:

### DOM Extraction (defuddle / virtual scroll)
- **Pros**: Works immediately, no reverse engineering needed
- **Cons**: Limited by what's rendered; virtual scroll only shows partial content
- **Best for**: Standard web pages, blogs, articles, wikis

### API Interception
- **Pros**: Gets 100% complete data, structured format, no rendering artifacts
- **Cons**: Requires reverse engineering the API, may break if API changes
- **Best for**: Platforms with complex editors (Lark, Notion, Google Docs)

**Rule of thumb**: If the page uses a rich text editor with virtual scroll or complex nested structures, API interception is almost always better.

## API Interception Methodology (Proven with Lark)

### Step 1: Sniff Network Requests

Use Playwright response interception to identify content APIs:

```python
def handle_response(response):
    url = response.url
    if any(kw in url for kw in ['block', 'content', 'document', 'page']):
        try:
            if response.status == 200:
                body = response.body()
                print(f"[{response.request.method}] {url[:150]} size={len(body)}")
        except: pass

page.on("response", handle_response)
```

Look for: large JSON responses (>10KB) that appear during page load. The biggest response usually contains the document data.

### Step 2: Analyze the Data Structure

Key things to identify:
- **Block types**: heading, text, bullet, ordered, image, table, etc.
- **Text format**: Plain text? Etherpad changesets? ProseMirror JSON? Delta?
- **Hierarchy**: How parent-child relationships are expressed
- **Image references**: Tokens? URLs? Object keys?
- **Pagination**: Does the API paginate? What triggers next page?

### Step 3: Build the Converter

Pattern from Lark implementation:

```
API response → block_map (all blocks) + block_sequence (order)
                ↓
        Build tree from parent_id relationships
                ↓
        Walk top-level blocks in sequence order
                ↓
        Render each block type → Markdown lines
                ↓
        Handle containers recursively (grid, table, callout)
```

### Step 4: Handle Images

Image download typically requires:
1. Extract image tokens/IDs from block data
2. Construct the download URL (sniff actual image requests to find the pattern)
3. Use authenticated Playwright `page.request.get()` to download

**Lark image URL pattern** (discovered by sniffing):
```
https://internal-api-drive-stream-{region}.larkoffice.com/space/api/box/stream/download/preview/{token}/?preview_type=16
```

### Step 5: Integrate into fetch_with_cookies.py

1. Add URL detection in `_launch()` (like `is_lark`)
2. Register response interception handler
3. Add extraction function (like `extract_lark_api()`)
4. Add image download function (like `download_lark_images()`)
5. Wire into `extract_page()` with fallback

## Lessons Learned from Lark Implementation

### Virtual Scroll Problems
- Only visible content is rendered in DOM
- Must scroll incrementally and collect blocks with dedup
- Table content appears/disappears as user scrolls
- Scroll speed matters: too fast = missed content, too slow = timeout

### API Approach Advantages
- Gets 100% content regardless of viewport
- No scroll timing issues
- Structured data (no HTML parsing ambiguity)
- Proper text formatting info (bold, italic, links)

### Etherpad Changeset Format
Lark uses Etherpad-style attributed text:
- `*N` applies attribute N from the apool (attribute pool)
- `+XX` advances XX characters (base 36 encoded)
- Attributes: `bold`, `italic`, `link` (URL-encoded), `underline`, etc.
- Multiple `*N` can stack before a `+` (e.g., `*0*1+5` = attrs 0 and 1 for 5 chars)
- `author` attribute should be skipped (not relevant to content)

### Nested Structure Handling
- **grid** = multi-column layout → flatten columns sequentially in Markdown
- **table_cell** can contain nested **grid** (grid inside table) → recursive flattening
- **callout** = container with emoji → Obsidian `> [!note]` format
- **quote_container** = blockquote → `> ` prefix
- **bullet/ordered children** = nested lists → indentation via `indent` parameter

### Image Caption Gotchas
- Caption text can be null (empty captions have `null` in text/attribs fields)
- Caption may contain newlines → must strip for alt text in `![alt](url)`
- Image block ID ≠ image token (block ID is the block's ID, token is for download)

### Multiple Root Blocks
- Lark documents can have multiple "root" blocks (parent_id not in block_map)
- The main document root has most children (186+ blocks)
- Additional roots may contain: cover images, supplementary quote_containers, decorative text
- **Must include ALL orphan roots** (blocks whose parent_id is not in block_map) as top-level blocks
- Previous bug: only used URL-extracted root_id → missed 1 image and 1 quote_container from other roots

### Block Type Edge Cases
- Headings can be nested inside `grid_column` blocks (11 of 58 headings in test document)
- `text` blocks can have `children` (e.g., bullet items nested under a text block)
- `grid` inside `table_cell` requires recursive flattening via `render_cell_content()`
- Decorative text blocks (e.g., "♪(*^^)o∀ - 到底了") exist at orphan roots

### Image Collection vs Rendering
- `image_tokens` should be collected from ALL blocks in block_map (for download)
- But markdown rendering only includes images that are reachable via tree traversal
- Mismatch means some image blocks are not rendered (rendering bug)

## Platform-Specific Notes

### Lark/Feishu (Implemented)
- API: `/space/api/docx/pages/client_vars` (paginated, triggered by scroll)
- Block types: text, bullet, ordered, heading1-6, image, table, grid, callout, quote_container, divider
- Text: Etherpad changesets with base-36 lengths
- Images: token-based, download via `internal-api-drive-stream` domain
- Tables: cells in block_sequence order, row-major (row1col1, row1col2, row2col1...)
- Grids: width_ratio on columns, children are content blocks
- Multiple root blocks: must use `parent_id not in bm` detection, not just URL root_id

### Notion (Not Implemented)
- Likely approach: intercept block data API
- Text format: probably rich text array (similar to Notion API v1)
- Would follow same pattern as Lark

### Google Docs (Not Implemented)
- Likely approach: intercept document JSON or use Google Docs API
- May need OAuth2 tokens rather than browser cookies

### WeChat Articles (Not Implemented)
- Usually works with standard defuddle extraction
- Images may need referrer header for download
- Some images are in WeChat CDN with expiring URLs

## Acceptance Testing

### Quick acceptance (acceptance_test.py)

After implementing a new site handler:

1. Add a test case to `acceptance_test.py` with appropriate thresholds
2. Define URL detection pattern
3. Set minimum metrics (chars, headings, images, etc.)
4. Run full test suite to verify no regressions

```bash
python3 scripts/acceptance_test.py --keep  # inspect output files
```

### Deep verification (deep_verify.py, Lark only)

For Lark documents, run element-level comparison against API block_map:

```bash
python3 scripts/deep_verify.py <clipped.md> <api_data.json> [--img-dir <path>]
```

Checks:
1. **Element counts**: heading/bullet/ordered/image/table counts vs block_map
2. **Text coverage**: every text block (>=5 chars) found in output (target: >=99%)
3. **Image files**: download count, file sizes, no empty files, no unreplaced tokens
4. **Heading order**: re-runs converter and compares heading sequence
5. **Table dimensions**: rows x cols vs API `rows_id`/`columns_id`

Pass criteria: all PASS checks green. WARN items are non-blocking.

To save API data for later verification, the `fetch_with_cookies.py` saves intercepted responses when `--save-api-data` is specified (or store them manually from the `api_responses` variable).
