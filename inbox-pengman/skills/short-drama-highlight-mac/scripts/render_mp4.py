#!/usr/bin/env python3
"""Render edit-plan parts directly to MP4 with FFmpeg on macOS."""

from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
from pathlib import Path


def find_binary(name: str, fallbacks: list[str]) -> str:
    found = shutil.which(name)
    if found:
        return found
    for candidate in fallbacks:
        if Path(candidate).is_file():
            return candidate
    raise RuntimeError(f"{name} not found")


def safe_name(value: str) -> str:
    cleaned = re.sub(r'[<>:"/\\|?*]', "_", value).strip(" .")
    return cleaned[:120] or "highlight"


def duration_seconds(path: Path, ffprobe: str) -> float:
    result = subprocess.run(
        [ffprobe, "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", str(path)],
        check=True,
        capture_output=True,
        text=True,
    )
    return float(result.stdout.strip())


def has_encoder(ffmpeg: str, name: str) -> bool:
    result = subprocess.run([ffmpeg, "-hide_banner", "-encoders"], capture_output=True, text=True)
    return name in result.stdout


def render_part(part: dict, output_dir: Path, ffmpeg: str, ffprobe: str, encoder: str) -> dict:
    segments = part.get("segments") or []
    if not segments:
        raise ValueError(f"Part {part.get('part_id')} has no segments")
    command = [ffmpeg, "-hide_banner", "-y"]
    for segment in segments:
        start_s = float(segment["source_start_us"]) / 1_000_000.0
        duration_s = float(segment["source_duration_us"]) / 1_000_000.0
        command.extend(["-ss", f"{start_s:.3f}", "-t", f"{duration_s:.3f}", "-i", segment["video_path"]])

    filters = []
    concat_inputs = []
    for index in range(len(segments)):
        filters.append(
            f"[{index}:v]scale=1080:1920:force_original_aspect_ratio=decrease,"
            f"pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black,setsar=1,setpts=PTS-STARTPTS[v{index}]"
        )
        filters.append(f"[{index}:a]aresample=async=1:first_pts=0,asetpts=PTS-STARTPTS[a{index}]")
        concat_inputs.append(f"[v{index}][a{index}]")
    filters.append("".join(concat_inputs) + f"concat=n={len(segments)}:v=1:a=1[outv][outa]")

    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / f"{safe_name(part.get('draft_name', 'highlight'))}.mp4"
    if encoder == "auto":
        encoder = "h264_videotoolbox" if has_encoder(ffmpeg, "h264_videotoolbox") else "libx264"
    command.extend(["-filter_complex", ";".join(filters), "-map", "[outv]", "-map", "[outa]"])
    if encoder == "h264_videotoolbox":
        command.extend(["-c:v", encoder, "-b:v", "6M", "-maxrate", "8M", "-bufsize", "12M"])
    else:
        command.extend(["-c:v", "libx264", "-preset", "veryfast", "-crf", "22"])
    command.extend([
        "-pix_fmt", "yuv420p", "-r", "24", "-c:a", "aac", "-b:a", "192k",
        "-movflags", "+faststart", str(output_path),
    ])
    try:
        subprocess.run(command, check=True)
    except subprocess.CalledProcessError:
        if encoder == "h264_videotoolbox":
            output_path.unlink(missing_ok=True)
            print("VideoToolbox unavailable; retrying with libx264.", flush=True)
            return render_part(part, output_dir, ffmpeg, ffprobe, "libx264")
        raise
    actual = duration_seconds(output_path, ffprobe)
    planned = float(part.get("total_duration_us", 0)) / 1_000_000.0
    if abs(actual - planned) > max(1.5, planned * 0.02):
        raise RuntimeError(f"Duration mismatch for {output_path.name}: planned={planned:.2f}s actual={actual:.2f}s")
    return {
        "part_id": part.get("part_id"),
        "output": str(output_path),
        "planned_duration_s": round(planned, 3),
        "actual_duration_s": round(actual, 3),
        "segments": len(segments),
        "encoder": encoder,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Render an edit plan to MP4 on macOS.")
    parser.add_argument("--work-dir", required=True, help="Directory containing edit_plan.json.")
    parser.add_argument("--output-dir", required=True, help="Destination for rendered MP4 files.")
    parser.add_argument("--part-id", type=int, default=0, help="Render one part; 0 renders all parts.")
    parser.add_argument("--encoder", choices=["auto", "h264_videotoolbox", "libx264"], default="auto")
    args = parser.parse_args()

    work_dir = Path(args.work_dir).expanduser().resolve()
    output_dir = Path(args.output_dir).expanduser().resolve()
    plan = json.loads((work_dir / "edit_plan.json").read_text(encoding="utf-8"))
    parts = plan.get("parts") or []
    if args.part_id:
        parts = [part for part in parts if part.get("part_id") == args.part_id]
    if not parts:
        raise SystemExit("No matching parts found in edit_plan.json")
    ffmpeg = find_binary("ffmpeg", ["/opt/homebrew/bin/ffmpeg", str(Path.home() / ".local/bin/ffmpeg")])
    ffprobe = find_binary("ffprobe", ["/opt/homebrew/bin/ffprobe", str(Path.home() / ".local/bin/ffprobe")])
    results = [render_part(part, output_dir, ffmpeg, ffprobe, args.encoder) for part in parts]
    manifest = output_dir / "render_manifest.json"
    manifest.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8", newline="\n")
    print(json.dumps(results, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
