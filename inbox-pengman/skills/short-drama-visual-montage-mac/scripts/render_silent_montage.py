#!/usr/bin/env python3
"""Render silent vertical MP4s from a visual-montage edit plan."""

from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
from pathlib import Path


def find_binary(name: str, fallbacks: list[str]) -> str:
    return shutil.which(name) or next((value for value in fallbacks if Path(value).is_file()), "")


def safe_name(value: str) -> str:
    return re.sub(r'[<>:"/\\|?*]', "_", value).strip(" .")[:120] or "visual_montage"


def duration(path: Path, ffprobe: str) -> float:
    result = subprocess.run([
        ffprobe, "-v", "error", "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1", str(path),
    ], check=True, capture_output=True, text=True)
    return float(result.stdout.strip())


def supports_videotoolbox(ffmpeg: str) -> bool:
    listed = subprocess.run([ffmpeg, "-hide_banner", "-encoders"], capture_output=True, text=True)
    if "h264_videotoolbox" not in listed.stdout:
        return False
    probe = subprocess.run([
        ffmpeg, "-hide_banner", "-loglevel", "error", "-f", "lavfi",
        "-i", "color=size=64x64:rate=1:duration=1", "-frames:v", "1",
        "-c:v", "h264_videotoolbox", "-f", "null", "-",
    ], capture_output=True, text=True)
    return probe.returncode == 0


def render(part: dict, output_dir: Path, ffmpeg: str, ffprobe: str, encoder: str) -> dict:
    segments = list(part.get("segments") or [])
    if not segments:
        raise RuntimeError(f"Part {part.get('part_id')} has no segments")
    command = [ffmpeg, "-y", "-hide_banner", "-loglevel", "error"]
    for segment in segments:
        command.extend([
            "-ss", f"{int(segment['source_start_us']) / 1_000_000.0:.3f}",
            "-t", f"{int(segment['source_duration_us']) / 1_000_000.0:.3f}",
            "-i", str(segment["video_path"]),
        ])
    filters = []
    inputs = []
    for index in range(len(segments)):
        filters.append(
            f"[{index}:v]scale=1080:1920:force_original_aspect_ratio=increase,"
            f"crop=1080:1920,fps=30,setsar=1,setpts=PTS-STARTPTS[v{index}]"
        )
        inputs.append(f"[v{index}]")
    filters.append("".join(inputs) + f"concat=n={len(segments)}:v=1:a=0[outv]")
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / f"{safe_name(str(part.get('draft_name') or 'visual_montage'))}.mp4"
    command.extend(["-filter_complex", ";".join(filters), "-map", "[outv]", "-an"])
    if encoder == "h264_videotoolbox":
        command.extend(["-c:v", encoder, "-b:v", "8M", "-allow_sw", "1"])
    else:
        command.extend(["-c:v", "libx264", "-preset", "veryfast", "-crf", "22"])
    command.extend(["-pix_fmt", "yuv420p", "-movflags", "+faststart", str(output_path)])
    result = subprocess.run(command, capture_output=True, text=True)
    if result.returncode and encoder == "h264_videotoolbox":
        return render(part, output_dir, ffmpeg, ffprobe, "libx264")
    if result.returncode:
        raise RuntimeError(f"Render failed: {(result.stderr or result.stdout)[-1200:]}")
    planned = int(part["total_duration_us"]) / 1_000_000.0
    actual = duration(output_path, ffprobe)
    if abs(planned - actual) > max(1.5, planned * 0.02):
        raise RuntimeError(f"Duration mismatch: planned={planned:.2f}s actual={actual:.2f}s")
    audio_check = subprocess.run([
        ffprobe, "-v", "error", "-select_streams", "a:0", "-show_entries", "stream=index",
        "-of", "csv=p=0", str(output_path),
    ], capture_output=True, text=True)
    if audio_check.stdout.strip():
        raise RuntimeError(f"Silent render unexpectedly has audio: {output_path}")
    return {"part_id": part["part_id"], "output": str(output_path),
            "duration_s": round(actual, 3), "segments": len(segments), "encoder": encoder,
            "audio_stream": False}


def main() -> int:
    parser = argparse.ArgumentParser(description="Render silent visual montages to MP4.")
    parser.add_argument("--work-dir", required=True)
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--part-id", type=int, default=0)
    parser.add_argument("--encoder", choices=["auto", "h264_videotoolbox", "libx264"], default="auto")
    args = parser.parse_args()
    work_dir = Path(args.work_dir).expanduser().resolve()
    plan = json.loads((work_dir / "edit_plan.json").read_text(encoding="utf-8"))
    if plan.get("source_audio") != "mute":
        raise SystemExit("This renderer only accepts a source_audio=\"mute\" visual montage plan")
    parts = [part for part in plan.get("parts") or [] if not args.part_id or part.get("part_id") == args.part_id]
    if not parts:
        raise SystemExit("No matching parts in edit_plan.json")
    ffmpeg = find_binary("ffmpeg", ["/opt/homebrew/bin/ffmpeg", str(Path.home() / ".local/bin/ffmpeg")])
    ffprobe = find_binary("ffprobe", ["/opt/homebrew/bin/ffprobe", str(Path.home() / ".local/bin/ffprobe")])
    if not ffmpeg or not ffprobe:
        raise SystemExit("ffmpeg and ffprobe are required")
    encoder = args.encoder
    if encoder == "auto":
        encoder = "h264_videotoolbox" if supports_videotoolbox(ffmpeg) else "libx264"
    output_dir = Path(args.output_dir).expanduser().resolve()
    results = [render(part, output_dir, ffmpeg, ffprobe, encoder) for part in parts]
    output = output_dir / "render_manifest.json"
    output.write_text(json.dumps(results, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(results, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
