#!/usr/bin/env python3
"""Validate local hook variants and compile the shared edit_plan.json format."""

from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
from pathlib import Path


ALLOWED_ROLES = {"hook", "backbone", "ending"}


def safe_name(value: str) -> str:
    cleaned = re.sub(r'[\\/:*?"<>|]+', "_", value).strip()
    return cleaned or "viral-mixcut"


def episode_number(path: Path) -> int:
    matches = re.findall(r"(\d+)", path.stem)
    return int(matches[-1]) if matches else 0


def duration_seconds(path: Path, ffprobe: str, cache: dict[Path, float]) -> float:
    if path not in cache:
        result = subprocess.run([
            ffprobe, "-v", "error", "-show_entries", "format=duration",
            "-of", "default=nk=1:nw=1", str(path),
        ], check=True, capture_output=True, text=True)
        cache[path] = float(result.stdout.strip())
    return cache[path]


def main() -> int:
    parser = argparse.ArgumentParser(description="Compile three local short-drama hook variants.")
    parser.add_argument("--variants", required=True)
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--expected-count", type=int, default=3)
    parser.add_argument("--canary", action="store_true")
    parser.add_argument("--force", action="store_true")
    args = parser.parse_args()

    if not 1 <= args.expected_count <= 10:
        raise SystemExit("--expected-count must be between 1 and 10")
    ffprobe = shutil.which("ffprobe")
    if not ffprobe:
        raise SystemExit("ffprobe not found; install FFmpeg first")
    variants_path = Path(args.variants).expanduser().resolve()
    document = json.loads(variants_path.read_text(encoding="utf-8"))
    variants = list(document.get("variants") or [])
    if len(variants) != args.expected_count:
        raise SystemExit(f"Expected {args.expected_count} variants, found {len(variants)}")
    output_dir = Path(args.output_dir).expanduser().resolve()
    output_dir.mkdir(parents=True, exist_ok=True)
    edit_plan_path = output_dir / "edit_plan.json"
    if edit_plan_path.exists() and not args.force:
        raise SystemExit(f"Refusing to overwrite existing plan: {edit_plan_path}; pass --force to replace it")

    duration_cache: dict[Path, float] = {}
    parts = []
    report = []
    seen_ids = set()
    for part_id, variant in enumerate(variants, start=1):
        variant_id = str(variant.get("id") or f"viral-{part_id}").strip()
        if variant_id in seen_ids:
            raise SystemExit(f"Duplicate variant id: {variant_id}")
        seen_ids.add(variant_id)
        hook_type = str(variant.get("hook_type") or "").strip()
        segments_in = list(variant.get("segments") or [])
        if not segments_in or str(segments_in[0].get("role")) != "hook":
            raise SystemExit(f"{variant_id}: first segment must have role=hook")
        timeline_us = 0
        segments_out = []
        for order, segment in enumerate(segments_in):
            role = str(segment.get("role") or "backbone")
            if role not in ALLOWED_ROLES:
                raise SystemExit(f"{variant_id}: invalid role {role}")
            source = Path(str(segment.get("source_path") or "")).expanduser().resolve()
            start_s = float(segment.get("source_start_s") or 0.0)
            source_duration_s = float(segment.get("source_duration_s") or 0.0)
            if not source.is_file() or start_s < 0 or source_duration_s <= 0:
                raise SystemExit(f"{variant_id}: segment {order + 1} needs readable source and valid timing")
            if start_s + source_duration_s > duration_seconds(source, ffprobe, duration_cache) + 0.15:
                raise SystemExit(f"{variant_id}: segment {order + 1} exceeds source duration")
            duration_us = round(source_duration_s * 1_000_000)
            segments_out.append({
                "timeline_order": order,
                "episode": episode_number(source),
                "role": role,
                "video_path": str(source),
                "source_start_us": round(start_s * 1_000_000),
                "source_duration_us": duration_us,
                "timeline_start_us": timeline_us,
                "timeline_duration_us": duration_us,
                "audio_volume": 1.0,
                "label": str(segment.get("label") or f"{role} segment {order + 1}"),
            })
            timeline_us += duration_us
        total_s = timeline_us / 1_000_000.0
        if args.canary:
            if not 1.0 <= total_s <= 10.0:
                raise SystemExit(f"{variant_id}: canary duration must be 1–10 seconds, got {total_s:.2f}")
        elif not 15.0 <= total_s <= 90.0:
            raise SystemExit(f"{variant_id}: production duration must be 15–90 seconds, got {total_s:.2f}")
        parts.append({
            "part_id": part_id,
            "draft_name": safe_name(f"{document.get('drama_name', 'drama')}_{variant_id}_{hook_type}"),
            "canvas": {"width": 1080, "height": 1920, "ratio": "9:16", "fps": 30},
            "total_duration_us": timeline_us,
            "segments": segments_out,
            "subtitles": [],
        })
        report.append({
            "part_id": part_id, "id": variant_id, "hook_type": hook_type,
            "duration_s": round(total_s, 3), "segments": len(segments_out),
            "reason": str(variant.get("reason") or ""),
        })

    edit_plan_path.write_text(json.dumps({"parts": parts}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    report_path = output_dir / "viral_variants_report.json"
    report_path.write_text(json.dumps({
        "reference_video_required": False,
        "default_per_drama_total": args.expected_count,
        "variants": report,
        "edit_plan_path": str(edit_plan_path),
    }, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(report_path.read_text(encoding="utf-8"))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
