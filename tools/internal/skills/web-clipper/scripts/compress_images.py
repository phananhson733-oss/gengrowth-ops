#!/usr/bin/env python3
"""压缩剪藏图片：PNG→WebP（如有 cwebp）或 sips 缩小尺寸。

策略：
1. 有 cwebp → PNG/JPG 转 WebP（质量 85，通常缩小 60-80%）
2. 无 cwebp → sips 限制最大宽度 + JPG 重压缩（macOS 自带）
3. 自动更新 markdown 中的图片引用

Usage:
  python3 compress_images.py <img-dir> <markdown-file>
  python3 compress_images.py <img-dir> <markdown-file> --max-width 1600
  python3 compress_images.py <img-dir> <markdown-file> --quality 80
  python3 compress_images.py <img-dir> <markdown-file> --dry-run
"""

import argparse
import os
import shutil
import subprocess
import sys
from pathlib import Path


def has_tool(name):
    return shutil.which(name) is not None


def get_image_size(path):
    """Get image dimensions using sips (macOS)."""
    try:
        out = subprocess.check_output(
            ['sips', '-g', 'pixelWidth', '-g', 'pixelHeight', str(path)],
            stderr=subprocess.DEVNULL, text=True
        )
        w = h = 0
        for line in out.split('\n'):
            if 'pixelWidth' in line:
                w = int(line.split(':')[-1].strip())
            elif 'pixelHeight' in line:
                h = int(line.split(':')[-1].strip())
        return w, h
    except Exception:
        return 0, 0


def compress_with_cwebp(img_path, quality=85):
    """Convert to WebP using cwebp. Returns new path or None."""
    webp_path = img_path.with_suffix('.webp')
    try:
        subprocess.run(
            ['cwebp', '-q', str(quality), str(img_path), '-o', str(webp_path)],
            capture_output=True, timeout=30
        )
        if webp_path.exists() and webp_path.stat().st_size > 0:
            return webp_path
    except Exception:
        pass
    return None


def compress_with_sips(img_path, max_width=1600):
    """Compress using sips: resize if wider than max_width, re-encode JPG."""
    original_size = img_path.stat().st_size
    suffix = img_path.suffix.lower()

    w, h = get_image_size(img_path)

    # Resize if too wide
    if w > max_width:
        subprocess.run(
            ['sips', '--resampleWidth', str(max_width), str(img_path)],
            capture_output=True, timeout=30
        )

    # For PNG > 500KB, convert to JPG (lossy but much smaller)
    if suffix == '.png' and original_size > 500 * 1024:
        jpg_path = img_path.with_suffix('.jpg')
        try:
            subprocess.run(
                ['sips', '-s', 'format', 'jpeg', '-s', 'formatOptions', '85',
                 str(img_path), '--out', str(jpg_path)],
                capture_output=True, timeout=30
            )
            if jpg_path.exists() and jpg_path.stat().st_size > 0:
                new_size = jpg_path.stat().st_size
                # Only keep JPG if it's actually smaller
                if new_size < original_size * 0.8:
                    img_path.unlink()
                    return jpg_path
                else:
                    jpg_path.unlink()
        except Exception:
            pass

    return img_path


def main():
    parser = argparse.ArgumentParser(description="压缩剪藏图片")
    parser.add_argument("img_dir", help="图片目录")
    parser.add_argument("markdown", help="Markdown 文件路径")
    parser.add_argument("--max-width", type=int, default=1600, help="最大宽度（默认 1600px）")
    parser.add_argument("--quality", type=int, default=85, help="压缩质量（默认 85）")
    parser.add_argument("--dry-run", action="store_true", help="仅预览，不实际压缩")
    args = parser.parse_args()

    img_dir = Path(args.img_dir)
    md_path = Path(args.markdown)

    if not img_dir.is_dir():
        print(f"错误：目录不存在 {img_dir}", file=sys.stderr)
        sys.exit(1)

    use_cwebp = has_tool('cwebp')
    print(f"压缩工具: {'cwebp (→WebP)' if use_cwebp else 'sips (macOS 内置)'}")
    print(f"最大宽度: {args.max_width}px")
    print(f"图片目录: {img_dir}")
    print(f"Markdown: {md_path}")

    images = sorted(img_dir.glob("image-*"))
    if not images:
        print("无图片文件")
        return

    total_before = sum(f.stat().st_size for f in images)
    print(f"\n压缩前: {len(images)} 张, {total_before / 1024 / 1024:.1f} MB")

    if args.dry_run:
        # Preview mode
        for img in images:
            sz = img.stat().st_size
            w, h = get_image_size(img)
            flag = "⚡" if sz > 500 * 1024 or w > args.max_width else "  "
            print(f"  {flag} {img.name:25s} {sz/1024:>8.0f} KB  {w}x{h}")
        print(f"\n⚡ = 将被压缩 (>500KB 或 >{args.max_width}px)")
        return

    # Compress
    renames = {}  # old_name -> new_name
    compressed = 0
    saved = 0

    for img in images:
        old_size = img.stat().st_size
        old_name = img.name

        if use_cwebp:
            new_path = compress_with_cwebp(img, args.quality)
            if new_path and new_path != img:
                img.unlink()  # Remove original
                renames[old_name] = new_path.name
                new_size = new_path.stat().st_size
                compressed += 1
                saved += old_size - new_size
            else:
                # cwebp failed, try sips
                new_path = compress_with_sips(img, args.max_width)
                if new_path.name != old_name:
                    renames[old_name] = new_path.name
                new_size = new_path.stat().st_size
                if new_size < old_size:
                    compressed += 1
                    saved += old_size - new_size
        else:
            new_path = compress_with_sips(img, args.max_width)
            new_size = new_path.stat().st_size
            if new_path.name != old_name:
                renames[old_name] = new_path.name
            if new_size < old_size:
                compressed += 1
                saved += old_size - new_size

    # Update markdown references
    if renames and md_path.exists():
        md_content = md_path.read_text()
        for old_name, new_name in renames.items():
            md_content = md_content.replace(old_name, new_name)
        md_path.write_text(md_content)
        print(f"\nMarkdown 已更新: {len(renames)} 个引用")

    # Summary
    total_after = sum(f.stat().st_size for f in img_dir.glob("image-*"))
    print(f"\n压缩完成:")
    print(f"  压缩前: {total_before / 1024 / 1024:.1f} MB")
    print(f"  压缩后: {total_after / 1024 / 1024:.1f} MB")
    print(f"  节省:   {saved / 1024 / 1024:.1f} MB ({saved / total_before * 100:.0f}%)")
    print(f"  压缩:   {compressed}/{len(images)} 张")


if __name__ == '__main__':
    main()
