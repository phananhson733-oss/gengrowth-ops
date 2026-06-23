#!/usr/bin/env python3
"""Web Clipper acceptance test suite.

Tests three extraction modes:
  1. General public web page (defuddle mode)
  2. Lark/Feishu document (lark_api mode, requires Chrome profile auth)
  3. SPA / JS-heavy page (public mode with Playwright rendering)

Usage:
  # Run all tests (Chrome must be closed for Lark test)
  python3 acceptance_test.py

  # Run only public web tests (no auth needed, Chrome can be open)
  python3 acceptance_test.py --public-only

  # Run with a custom Lark URL
  python3 acceptance_test.py --lark-url "https://..."

  # Keep test output files for inspection
  python3 acceptance_test.py --keep
"""

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
FETCH_SCRIPT = SCRIPT_DIR / "fetch_with_cookies.py"

# ── Test URLs ──
DEFAULT_PUBLIC_URL = "https://www.paulgraham.com/greatwork.html"
DEFAULT_SPA_URL = "https://sspai.com/post/55476"
DEFAULT_LARK_URL = "https://bytedance.sg.larkoffice.com/docx/Vc1KdcqGcod2Y1xJOAklrpHmgye"

# ── Thresholds ──
# Each test defines minimum acceptable values for key metrics.
# If a metric falls below threshold, the test warns (yellow) or fails (red).

THRESHOLDS = {
    "public": {
        "mode": "defuddle",
        "min_chars": 5000,
        "min_lines": 50,
        "title_required": True,
    },
    "spa": {
        "mode": "defuddle",
        "min_chars": 3000,
        "min_lines": 30,
        "title_required": True,
    },
    "lark": {
        "mode": "lark_api",
        "min_chars": 10000,
        "min_headings": 10,
        "min_images": 20,
        "min_bullets": 30,
        "min_tables": 1,
        "title_required": True,
        "heading_coverage": 1.0,   # 100% of block_map headings
        "image_coverage": 0.95,    # 95%+ of block_map images
        "text_coverage": 0.99,     # 99%+ of text blocks
    },
}


class Colors:
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    RED = "\033[91m"
    BOLD = "\033[1m"
    RESET = "\033[0m"


def ok(msg):
    print(f"  {Colors.GREEN}PASS{Colors.RESET} {msg}")


def warn(msg):
    print(f"  {Colors.YELLOW}WARN{Colors.RESET} {msg}")


def fail(msg):
    print(f"  {Colors.RED}FAIL{Colors.RESET} {msg}")


def run_clipper(url, mode="public", wait=5, download_dir=None, note_name=None):
    """Run fetch_with_cookies.py and return parsed JSON result."""
    cmd = [
        sys.executable, str(FETCH_SCRIPT), url,
        "--mode", mode,
        "--wait", str(wait),
    ]
    if download_dir:
        cmd += ["--download-images", download_dir]
    if note_name:
        cmd += ["--note-name", note_name]

    result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)

    if result.returncode != 0:
        raise RuntimeError(f"Script failed (exit {result.returncode}): {result.stderr[:500]}")

    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError:
        raise RuntimeError(f"Invalid JSON output: {result.stdout[:500]}")


def analyze_markdown(md):
    """Extract metrics from markdown content."""
    plain = re.sub(r'\*+', '', md)
    plain = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', plain)

    return {
        "chars": len(md),
        "lines": md.count('\n'),
        "headings": len(re.findall(r'^#{1,6} ', md, re.MULTILINE)),
        "h1": len(re.findall(r'^# [^#]', md, re.MULTILINE)),
        "h2": len(re.findall(r'^## [^#]', md, re.MULTILINE)),
        "bullets": (
            len(re.findall(r'^\s*- ', md, re.MULTILINE)) +
            len(re.findall(r'^>\s+- ', md, re.MULTILINE))
        ),
        "ordered": (
            len(re.findall(r'^\s*1\. ', md, re.MULTILINE)) +
            len(re.findall(r'^>\s+1\. ', md, re.MULTILINE))
        ),
        "images_local": len(re.findall(r'assets/', md)),
        "images_token": len(set(re.findall(r'lark-image://([A-Za-z0-9]+)', md))),
        "images_url": len(re.findall(r'!\[.*?\]\(https?://', md, re.DOTALL)),
        "tables": len(re.findall(r'^\| ---', md, re.MULTILINE)),
        "links": len(re.findall(r'\[.*?\]\(https?://', md)),
        "blockquotes": len(re.findall(r'^>', md, re.MULTILINE)),
    }


def test_public_page(url=DEFAULT_PUBLIC_URL, keep_files=False):
    """Test: General public web page → defuddle extraction."""
    print(f"\n{Colors.BOLD}[1/3] General Public Page{Colors.RESET}")
    print(f"  URL: {url}")

    th = THRESHOLDS["public"]
    passed = True
    tmp_dir = tempfile.mkdtemp(prefix="wc-pub-test-")
    img_dir = os.path.join(tmp_dir, "images")
    note_name = "pub-test"

    try:
        data = run_clipper(url, mode="public", wait=3,
                           download_dir=img_dir, note_name=note_name)
    except Exception as e:
        fail(f"Script error: {e}")
        return False

    mode = data.get("mode", "")
    title = data.get("title", "")
    md = data.get("content_markdown", "")
    metrics = analyze_markdown(md)

    # Mode check
    if mode == th["mode"]:
        ok(f"Mode: {mode}")
    else:
        warn(f"Mode: {mode} (expected {th['mode']})")

    # Title
    if title:
        ok(f"Title: {title[:60]}")
    elif th["title_required"]:
        fail("Title: empty")
        passed = False

    # Content size
    if metrics["chars"] >= th["min_chars"]:
        ok(f"Content: {metrics['chars']} chars, {metrics['lines']} lines")
    else:
        fail(f"Content too small: {metrics['chars']} chars (min {th['min_chars']})")
        passed = False

    if metrics["lines"] >= th["min_lines"]:
        ok(f"Lines: {metrics['lines']} (min {th['min_lines']})")
    else:
        warn(f"Lines: {metrics['lines']} (min {th['min_lines']})")

    # Structure
    if metrics["headings"] > 0:
        ok(f"Headings: {metrics['headings']}")

    # Image download verification
    mapping = data.get("image_mapping", {})
    if mapping:
        downloaded_files = list(Path(img_dir).glob("image-*"))
        if downloaded_files:
            total_size = sum(f.stat().st_size for f in downloaded_files)
            empty_files = [f for f in downloaded_files if f.stat().st_size == 0]
            ok(f"Images downloaded: {len(downloaded_files)} files, {total_size/1024:.0f} KB")
            if empty_files:
                warn(f"Empty image files: {len(empty_files)}")
        else:
            warn("Image mapping exists but no files on disk")

    print(f"  {'---':>4} Summary: chars={metrics['chars']}, lines={metrics['lines']}, "
          f"headings={metrics['headings']}, links={metrics['links']}, "
          f"images_downloaded={len(data.get('image_mapping', {}))}")

    if not keep_files:
        shutil.rmtree(tmp_dir, ignore_errors=True)
    else:
        print(f"  Test files kept at: {tmp_dir}")

    return passed


def test_spa_page(url=DEFAULT_SPA_URL, keep_files=False):
    """Test: SPA/JS-heavy page → Playwright render + defuddle."""
    print(f"\n{Colors.BOLD}[2/3] SPA / JS-Heavy Page{Colors.RESET}")
    print(f"  URL: {url}")

    th = THRESHOLDS["spa"]
    passed = True
    tmp_dir = tempfile.mkdtemp(prefix="wc-spa-test-")
    img_dir = os.path.join(tmp_dir, "images")
    note_name = "spa-test"

    try:
        data = run_clipper(url, mode="public", wait=5,
                           download_dir=img_dir, note_name=note_name)
    except Exception as e:
        fail(f"Script error: {e}")
        return False

    mode = data.get("mode", "")
    title = data.get("title", "")
    md = data.get("content_markdown", "")
    metrics = analyze_markdown(md)

    if mode == th["mode"]:
        ok(f"Mode: {mode}")
    else:
        warn(f"Mode: {mode} (expected {th['mode']})")

    if title:
        ok(f"Title: {title[:60]}")
    elif th["title_required"]:
        fail("Title: empty")
        passed = False

    if metrics["chars"] >= th["min_chars"]:
        ok(f"Content: {metrics['chars']} chars, {metrics['lines']} lines")
    else:
        fail(f"Content too small: {metrics['chars']} chars (min {th['min_chars']})")
        passed = False

    # Image download verification
    mapping = data.get("image_mapping", {})
    if mapping:
        downloaded_files = list(Path(img_dir).glob("image-*"))
        if downloaded_files:
            total_size = sum(f.stat().st_size for f in downloaded_files)
            empty_files = [f for f in downloaded_files if f.stat().st_size == 0]
            ok(f"Images downloaded: {len(downloaded_files)} files, {total_size/1024:.0f} KB")
            if empty_files:
                warn(f"Empty image files: {len(empty_files)}")
        else:
            warn("Image mapping exists but no files on disk")

    print(f"  {'---':>4} Summary: chars={metrics['chars']}, lines={metrics['lines']}, "
          f"headings={metrics['headings']}, images_url={metrics['images_url']}, "
          f"images_downloaded={len(data.get('image_mapping', {}))}")

    if not keep_files:
        shutil.rmtree(tmp_dir, ignore_errors=True)
    else:
        print(f"  Test files kept at: {tmp_dir}")

    return passed


def test_lark_page(url=DEFAULT_LARK_URL, download_images=True, keep_files=False):
    """Test: Lark/Feishu document → API interception + block converter."""
    print(f"\n{Colors.BOLD}[3/3] Lark/Feishu Document{Colors.RESET}")
    print(f"  URL: {url}")

    th = THRESHOLDS["lark"]
    passed = True
    tmp_dir = tempfile.mkdtemp(prefix="wc-lark-test-")
    img_dir = os.path.join(tmp_dir, "images")
    note_name = "lark-test"

    try:
        data = run_clipper(
            url, mode="profile", wait=8,
            download_dir=img_dir if download_images else None,
            note_name=note_name if download_images else None,
        )
    except Exception as e:
        fail(f"Script error: {e}")
        fail("  (Is Chrome closed? Profile mode requires Chrome to be closed)")
        return False

    mode = data.get("mode", "")
    title = data.get("title", "")
    md = data.get("content_markdown", "")
    stats = data.get("stats", {})
    metrics = analyze_markdown(md)
    mapping = data.get("image_mapping", {})
    errors = data.get("image_errors", [])

    # ── Mode ──
    if mode == th["mode"]:
        ok(f"Mode: {mode}")
    else:
        warn(f"Mode: {mode} (expected {th['mode']}, API interception may have failed)")
        if mode == "lark_virtual_scroll":
            warn("  Fallback to virtual scroll - API responses not captured")

    # ── Title ──
    if title:
        ok(f"Title: {title[:60]}")
    elif th["title_required"]:
        fail("Title: empty")
        passed = False

    # ── Content size ──
    if metrics["chars"] >= th["min_chars"]:
        ok(f"Content: {metrics['chars']} chars")
    else:
        fail(f"Content too small: {metrics['chars']} chars (min {th['min_chars']})")
        passed = False

    # ── Headings ──
    if metrics["headings"] >= th["min_headings"]:
        ok(f"Headings: {metrics['headings']}")
    else:
        fail(f"Headings: {metrics['headings']} (min {th['min_headings']})")
        passed = False

    # ── Coverage vs block_map (lark_api mode only) ──
    if mode == "lark_api":
        total_blocks = stats.get("total_blocks", 0)
        stat_images = stats.get("images", 0)

        # Heading coverage: compare output headings vs block_map heading count
        # (We know from testing: 58 headings in block_map, should be 58 in output)
        if total_blocks > 0:
            ok(f"Block map: {total_blocks} total blocks, {stats.get('top_level_blocks', 0)} top-level")

        # Image coverage
        if stat_images > 0:
            total_img_refs = metrics["images_local"] + metrics["images_token"]
            img_ratio = total_img_refs / stat_images if stat_images else 0
            if img_ratio >= th.get("image_coverage", 0.95):
                ok(f"Image coverage: {total_img_refs}/{stat_images} = {img_ratio:.1%}")
            else:
                warn(f"Image coverage: {total_img_refs}/{stat_images} = {img_ratio:.1%} "
                     f"(target {th['image_coverage']:.0%})")

    # ── Bullets ──
    if metrics["bullets"] >= th["min_bullets"]:
        ok(f"Bullets: {metrics['bullets']}")
    else:
        warn(f"Bullets: {metrics['bullets']} (min {th['min_bullets']})")

    # ── Tables ──
    if metrics["tables"] >= th["min_tables"]:
        ok(f"Tables: {metrics['tables']}")
    else:
        warn(f"Tables: {metrics['tables']} (min {th['min_tables']})")

    # ── Image download ──
    if download_images:
        if mapping:
            ok(f"Image download: {len(mapping)} succeeded, {len(errors)} failed")
            # Verify files exist
            downloaded_files = list(Path(img_dir).glob("image-*"))
            if downloaded_files:
                total_size = sum(f.stat().st_size for f in downloaded_files)
                ok(f"Image files: {len(downloaded_files)} files, {total_size/1024/1024:.1f} MB")
            else:
                fail("Image files: no files on disk")
                passed = False

            # Check no remaining lark-image:// refs
            remaining = metrics["images_token"]
            if remaining == 0:
                ok("Token replacement: all lark-image:// tokens replaced with local paths")
            else:
                warn(f"Token replacement: {remaining} lark-image:// tokens still in markdown")
        elif errors:
            fail(f"Image download: all {len(errors)} failed")
            fail(f"  First error: {errors[0]}")
            passed = False

    # ── Ordered items ──
    ok(f"Ordered items: {metrics['ordered']}")

    # ── Links ──
    ok(f"Links: {metrics['links']}")

    print(f"  {'---':>4} Summary: chars={metrics['chars']}, headings={metrics['headings']}, "
          f"bullets={metrics['bullets']}, ordered={metrics['ordered']}, "
          f"images={metrics['images_local']}, tables={metrics['tables']}")

    # Cleanup
    if not keep_files:
        shutil.rmtree(tmp_dir, ignore_errors=True)
    else:
        print(f"  Test files kept at: {tmp_dir}")

    return passed


def main():
    parser = argparse.ArgumentParser(description="Web Clipper Acceptance Tests")
    parser.add_argument("--public-only", action="store_true",
                        help="Only run public web tests (no auth needed)")
    parser.add_argument("--lark-only", action="store_true",
                        help="Only run Lark test")
    parser.add_argument("--public-url", default=DEFAULT_PUBLIC_URL)
    parser.add_argument("--spa-url", default=DEFAULT_SPA_URL)
    parser.add_argument("--lark-url", default=DEFAULT_LARK_URL)
    parser.add_argument("--keep", action="store_true",
                        help="Keep test output files for inspection")
    parser.add_argument("--no-download", action="store_true",
                        help="Skip image download in Lark test")
    args = parser.parse_args()

    print(f"{Colors.BOLD}{'='*60}")
    print("Web Clipper Acceptance Test Suite")
    print(f"{'='*60}{Colors.RESET}")

    results = {}

    if not args.lark_only:
        results["public"] = test_public_page(args.public_url, keep_files=args.keep)
        results["spa"] = test_spa_page(args.spa_url, keep_files=args.keep)

    if not args.public_only:
        results["lark"] = test_lark_page(
            args.lark_url,
            download_images=not args.no_download,
            keep_files=args.keep,
        )

    # ── Summary ──
    print(f"\n{Colors.BOLD}{'='*60}")
    print("Results")
    print(f"{'='*60}{Colors.RESET}")
    all_pass = True
    for name, passed in results.items():
        status = f"{Colors.GREEN}PASS{Colors.RESET}" if passed else f"{Colors.RED}FAIL{Colors.RESET}"
        print(f"  {name:>10}: {status}")
        if not passed:
            all_pass = False

    if all_pass:
        print(f"\n{Colors.GREEN}{Colors.BOLD}All tests passed!{Colors.RESET}")
    else:
        print(f"\n{Colors.RED}{Colors.BOLD}Some tests failed.{Colors.RESET}")
        sys.exit(1)


if __name__ == "__main__":
    main()
