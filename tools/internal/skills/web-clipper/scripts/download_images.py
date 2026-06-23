#!/usr/bin/env python3
"""Download images from URLs to a local directory."""

import argparse
import json
import os
import sys
import urllib.request
import urllib.error
from pathlib import Path
from urllib.parse import urlparse


def get_extension(url: str, content_type: str = "") -> str:
    """Determine file extension from URL or content-type header."""
    # Try URL path first
    parsed = urlparse(url)
    path_ext = Path(parsed.path).suffix.lower()
    if path_ext in (".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".ico", ".bmp", ".avif"):
        return path_ext

    # Fall back to content-type
    ct_map = {
        "image/png": ".png",
        "image/jpeg": ".jpg",
        "image/gif": ".gif",
        "image/webp": ".webp",
        "image/svg+xml": ".svg",
        "image/avif": ".avif",
        "image/bmp": ".bmp",
    }
    for ct, ext in ct_map.items():
        if ct in content_type:
            return ext

    return path_ext if path_ext else ".png"


def download_images(urls: list[str], output_dir: str, timeout: int = 30) -> dict:
    """Download images and return mapping of original URL to local path."""
    os.makedirs(output_dir, exist_ok=True)
    mapping = {}
    errors = []

    for i, url in enumerate(urls, 1):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                content_type = resp.headers.get("Content-Type", "")
                ext = get_extension(url, content_type)
                filename = f"image-{i:02d}{ext}"
                filepath = os.path.join(output_dir, filename)

                with open(filepath, "wb") as f:
                    f.write(resp.read())

                mapping[url] = filepath
                print(f"  ✓ {filename} <- {url[:80]}", file=sys.stderr)
        except (urllib.error.URLError, OSError, TimeoutError) as e:
            errors.append({"url": url, "error": str(e)})
            print(f"  ✗ Failed: {url[:80]} ({e})", file=sys.stderr)

    result = {"mapping": mapping, "errors": errors, "total": len(urls), "downloaded": len(mapping)}
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return result


def main():
    parser = argparse.ArgumentParser(description="Download images from URLs")
    parser.add_argument("--urls", nargs="+", required=True, help="Image URLs to download")
    parser.add_argument("--output-dir", required=True, help="Directory to save images")
    parser.add_argument("--timeout", type=int, default=30, help="Download timeout in seconds")
    args = parser.parse_args()

    download_images(args.urls, args.output_dir, args.timeout)


if __name__ == "__main__":
    main()
