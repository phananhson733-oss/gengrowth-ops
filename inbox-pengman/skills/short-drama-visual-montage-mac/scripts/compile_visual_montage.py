#!/usr/bin/env python3
"""Compile a visually selected silent-montage plan into edit_plan.json."""

from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
from pathlib import Path


def probe_duration(path: Path, ffprobe: str) -> float:
    result = subprocess.run([
        ffprobe, "-v", "error", "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1", str(path),
    ], check=True, capture_output=True, text=True)
    return float(result.stdout.strip())


def safe_name(value: str) -> str:
    return re.sub(r'[<>:"/\\|?*]', "_", value).strip(" .")[:120] or "VisualMontage"


def main() -> int:
    parser = argparse.ArgumentParser(description="Compile a silent visual montage plan.")
    parser.add_argument("--plan", required=True, help="Path to visual_montage.json")
    parser.add_argument("--output-dir", required=True, help="Work directory for edit_plan.json")
    parser.add_argument("--expected-count", type=int, default=3)
    parser.add_argument("--min-duration", type=float, default=15.0)
    parser.add_argument("--max-duration", type=float, default=45.0)
    args = parser.parse_args()
    if args.expected_count < 1 or args.min_duration <= 0 or args.max_duration < args.min_duration:
        raise SystemExit("Invalid expected count or duration range")

    ffprobe = shutil.which("ffprobe") or "/opt/homebrew/bin/ffprobe"
    if not Path(ffprobe).is_file():
        raise SystemExit("ffprobe is required")
    plan_path = Path(args.plan).expanduser().resolve()
    raw = json.loads(plan_path.read_text(encoding="utf-8"))
    raw_parts = list(raw.get("parts") or [])
    if len(raw_parts) != args.expected_count:
        raise SystemExit(f"Expected exactly {args.expected_count} parts, got {len(raw_parts)}")

    compiled_parts: list[dict] = []
    seen_ids: set[int] = set()
    for part in raw_parts:
        part_id = int(part.get("part_id") or 0)
        if part_id < 1 or part_id in seen_ids:
            raise SystemExit("Each part_id must be a unique positive integer")
        seen_ids.add(part_id)
        direction = str(part.get("visual_direction") or "").strip()
        draft_name = safe_name(str(part.get("draft_name") or f"VisualMontage_{part_id}"))
        raw_segments = list(part.get("segments") or [])
        if not direction or not raw_segments:
            raise SystemExit(f"Part {part_id} needs visual_direction and segments")

        cursor_us = 0
        compiled_segments: list[dict] = []
        used_windows: set[tuple[str, int, int]] = set()
        for index, segment in enumerate(raw_segments):
            source = Path(str(segment.get("video_path") or "")).expanduser().resolve()
            start_s = float(segment.get("source_start_s") or 0.0)
            duration_s = float(segment.get("duration_s") or 0.0)
            reason = str(segment.get("visual_reason") or "").strip()
            if not source.is_file() or start_s < 0 or not 0.7 <= duration_s <= 4.0 or not reason:
                raise SystemExit(f"Invalid visual segment in part {part_id}, index {index + 1}")
            if start_s + duration_s > probe_duration(source, ffprobe) + 0.15:
                raise SystemExit(f"Visual segment exceeds source duration: {source}")
            start_us = int(round(start_s * 1_000_000))
            duration_us = int(round(duration_s * 1_000_000))
            key = (str(source), start_us, duration_us)
            if key in used_windows:
                raise SystemExit(f"Duplicate source window in part {part_id}")
            used_windows.add(key)
            compiled_segments.append({
                "timeline_order": index,
                "role": "visual",
                "video_path": str(source),
                "source_start_us": start_us,
                "source_duration_us": duration_us,
                "timeline_start_us": cursor_us,
                "timeline_duration_us": duration_us,
                "audio_volume": 0.0,
                "label": reason,
            })
            cursor_us += duration_us
        total_s = cursor_us / 1_000_000.0
        if not args.min_duration <= total_s <= args.max_duration:
            raise SystemExit(
                f"Part {part_id} duration {total_s:.2f}s is outside {args.min_duration:.2f}-{args.max_duration:.2f}s"
            )
        compiled_parts.append({
            "part_id": part_id,
            "draft_name": draft_name,
            "visual_direction": direction,
            "canvas": {"width": 1080, "height": 1920, "ratio": "9:16", "fps": 30},
            "total_duration_us": cursor_us,
            "segments": compiled_segments,
            "subtitles": [],
        })

    output_dir = Path(args.output_dir).expanduser().resolve()
    output_dir.mkdir(parents=True, exist_ok=True)
    output = {
        "schema_version": 1,
        "drama_title": str(raw.get("drama_title") or "Visual Montage"),
        "source_audio": "mute",
        "part_count": len(compiled_parts),
        "parts": sorted(compiled_parts, key=lambda item: item["part_id"]),
    }
    output_path = output_dir / "edit_plan.json"
    output_path.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    report = {
        "source_audio": "mute",
        "part_count": len(compiled_parts),
        "parts": [
            {"part_id": part["part_id"], "direction": part["visual_direction"],
             "duration_s": round(part["total_duration_us"] / 1_000_000.0, 3),
             "segments": len(part["segments"])}
            for part in output["parts"]
        ],
        "edit_plan_path": str(output_path),
    }
    (output_dir / "visual_montage_report.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
