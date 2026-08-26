#!/usr/bin/env python3
"""Render a narration-led short-drama MP4 with macOS offline TTS."""

from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import textwrap
from pathlib import Path


def run(command: list[str], label: str) -> subprocess.CompletedProcess[str]:
    result = subprocess.run(command, capture_output=True, text=True)
    if result.returncode:
        raise RuntimeError(f"{label} failed: {(result.stderr or result.stdout)[-1200:]}")
    return result


def probe_duration(path: Path, ffprobe: str) -> float:
    result = run([
        ffprobe, "-v", "error", "-show_entries", "format=duration:stream=duration",
        "-of", "default=nk=1:nw=1", str(path),
    ], f"probe {path.name}")
    values = []
    for line in result.stdout.splitlines():
        try:
            values.append(float(line.strip()))
        except ValueError:
            continue
    if not values:
        raise RuntimeError(f"No readable duration for {path}")
    return max(values)


def choose_encoder(ffmpeg: str) -> str:
    result = run([ffmpeg, "-hide_banner", "-encoders"], "list encoders")
    if "h264_videotoolbox" in result.stdout:
        probe = subprocess.run([
            ffmpeg, "-hide_banner", "-loglevel", "error", "-f", "lavfi",
            "-i", "color=size=64x64:rate=1:duration=1", "-frames:v", "1",
            "-c:v", "h264_videotoolbox", "-f", "null", "-",
        ], capture_output=True, text=True)
        if probe.returncode == 0:
            return "h264_videotoolbox"
    return "libx264"


def srt_time(seconds: float) -> str:
    millis = max(0, round(seconds * 1000))
    hours, millis = divmod(millis, 3_600_000)
    minutes, millis = divmod(millis, 60_000)
    secs, millis = divmod(millis, 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"


def has_audio_stream(path: Path, ffprobe: str) -> bool:
    result = subprocess.run([
        ffprobe, "-v", "error", "-select_streams", "a:0",
        "-show_entries", "stream=index", "-of", "csv=p=0", str(path),
    ], capture_output=True, text=True)
    return result.returncode == 0 and bool(result.stdout.strip())


def wrap_caption(text: str, english_width: int = 42, cjk_width: int = 10) -> str:
    cleaned = re.sub(r"\s+", " ", text).strip()
    if re.search(r"[A-Za-z]", cleaned):
        return "\n".join(textwrap.wrap(
            cleaned,
            width=english_width,
            break_long_words=False,
            break_on_hyphens=False,
        ))
    compact = cleaned.replace(" ", "")
    return "\n".join(compact[i:i + cjk_width] for i in range(0, len(compact), cjk_width))


def filter_path(path: Path) -> str:
    return str(path).replace("\\", "\\\\").replace(":", "\\:").replace("'", "\\'")


def main() -> int:
    parser = argparse.ArgumentParser(description="Render local-TTS short-drama narration on macOS.")
    parser.add_argument("--plan", required=True)
    parser.add_argument("--output-id", required=True)
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--voice", default="Samantha")
    parser.add_argument("--rate", type=int, default=190)
    parser.add_argument(
        "--source-audio-volume", type=float, default=0.18,
        help="Keep the source English dialogue under narration; use 0 to mute it.",
    )
    parser.add_argument("--voice-volume", type=float, default=1.15)
    parser.add_argument("--canary-seconds", type=float, default=0.0)
    args = parser.parse_args()
    if not 0.0 <= args.source_audio_volume <= 1.0:
        raise SystemExit("--source-audio-volume must be between 0 and 1")
    if not 0.1 <= args.voice_volume <= 2.0:
        raise SystemExit("--voice-volume must be between 0.1 and 2")

    ffmpeg = shutil.which("ffmpeg")
    ffprobe = shutil.which("ffprobe")
    say = shutil.which("say")
    if not ffmpeg or not ffprobe or not say:
        raise SystemExit("Required local tools missing: ffmpeg, ffprobe, and macOS say")
    plan_path = Path(args.plan).expanduser().resolve()
    plan = json.loads(plan_path.read_text(encoding="utf-8"))
    outputs = list(plan.get("outputs") or [])
    selected = next((item for item in outputs if item.get("id") == args.output_id), None)
    if not selected:
        raise SystemExit(f"Output id not found: {args.output_id}")
    shots = list(selected.get("shots") or [])
    if not shots:
        raise SystemExit("Selected output has no shots")

    output_dir = Path(args.output_dir).expanduser().resolve()
    work_dir = output_dir / "work" / args.output_id
    shot_dir = work_dir / "shots"
    # Never write generated work into a source-media folder by accident.
    source_parents = {Path(str(shot.get("source_path", ""))).expanduser().resolve().parent for shot in shots}
    if any(output_dir == parent or output_dir.is_relative_to(parent) for parent in source_parents):
        raise SystemExit("Output directory must stay outside all source-media folders")
    shot_dir.mkdir(parents=True, exist_ok=True)
    encoder = choose_encoder(ffmpeg)
    rendered: list[dict[str, object]] = []
    cursor = 0.0

    for index, shot in enumerate(shots, start=1):
        text = str(shot.get("text") or "").strip()
        source = Path(str(shot.get("source_path") or "")).expanduser().resolve()
        start_s = float(shot.get("source_start_s") or 0.0)
        duration_s = float(shot.get("source_duration_s") or 0.0)
        if not text or not source.is_file() or start_s < 0 or duration_s <= 0:
            raise SystemExit(f"Invalid shot {index}: text, readable source, start, and duration are required")
        if start_s + duration_s > probe_duration(source, ffprobe) + 0.15:
            raise SystemExit(f"Shot {index} exceeds source duration: {source}")

        voice_path = shot_dir / f"{index:03d}.aiff"
        run([say, "-v", args.voice, "-r", str(args.rate), "-o", str(voice_path), text], f"TTS shot {index}")
        voice_duration = probe_duration(voice_path, ffprobe)
        if voice_duration <= 0.10:
            raise SystemExit(
                "macOS Speech returned an empty audio file. When running from Codex, approve this local render "
                "command outside the sandbox; no cloud service or credential is used."
            )
        if voice_duration + 0.10 > duration_s:
            raise SystemExit(
                f"Shot {index} visual duration {duration_s:.2f}s is shorter than narration {voice_duration:.2f}s; "
                "choose a longer source window or shorten the sentence"
            )

        shot_path = shot_dir / f"{index:03d}.mp4"
        video_filter = (
            "[0:v]scale=1080:1920:force_original_aspect_ratio=increase,"
            "crop=1080:1920,fps=30,setsar=1,format=yuv420p[v]"
        )
        if args.source_audio_volume > 0 and has_audio_stream(source, ffprobe):
            audio_filter = (
                f"[0:a]aresample=48000,atrim=duration={duration_s:.3f},"
                f"volume={args.source_audio_volume:.3f}[source_audio];"
                f"[1:a]aresample=48000,apad,atrim=duration={duration_s:.3f},"
                f"volume={args.voice_volume:.3f}[voice_audio];"
                "[source_audio][voice_audio]amix=inputs=2:duration=longest:normalize=0,"
                "alimiter=limit=0.95[a]"
            )
        else:
            audio_filter = (
                f"[1:a]aresample=48000,apad,atrim=duration={duration_s:.3f},"
                f"volume={args.voice_volume:.3f}[a]"
            )
        filters = f"{video_filter};{audio_filter}"
        command = [
            ffmpeg, "-y", "-hide_banner", "-loglevel", "error",
            "-ss", f"{start_s:.3f}", "-t", f"{duration_s:.3f}", "-i", str(source),
            "-i", str(voice_path), "-filter_complex", filters,
            "-map", "[v]", "-map", "[a]", "-t", f"{duration_s:.3f}",
            "-c:v", encoder,
        ]
        command += ["-b:v", "8M", "-allow_sw", "1"] if encoder == "h264_videotoolbox" else ["-preset", "veryfast", "-crf", "22"]
        command += ["-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", str(shot_path)]
        run(command, f"render shot {index}")
        rendered.append({
            "index": index, "text": text, "source_path": str(source),
            "source_start_s": start_s, "duration_s": duration_s,
            "timeline_start_s": cursor, "voice_duration_s": round(voice_duration, 3),
            "shot_path": str(shot_path),
        })
        cursor += duration_s

    concat_path = work_dir / "concat.txt"
    concat_path.write_text("".join(f"file '{str(Path(item['shot_path'])).replace(chr(39), chr(39) + chr(92) + chr(39) + chr(39))}'\n" for item in rendered), encoding="utf-8")
    joined = work_dir / "joined.mp4"
    run([ffmpeg, "-y", "-hide_banner", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", str(concat_path), "-c", "copy", str(joined)], "concat shots")

    subtitles = work_dir / "captions.srt"
    blocks = []
    for item in rendered:
        start = float(item["timeline_start_s"])
        end = start + float(item["duration_s"])
        blocks.append(f"{item['index']}\n{srt_time(start)} --> {srt_time(end)}\n{wrap_caption(str(item['text']))}\n")
    subtitles.write_text("\n".join(blocks), encoding="utf-8")

    final_path = output_dir / f"{args.output_id}.mp4"
    font_dir = Path(__file__).resolve().parent.parent / "assets" / "fonts"
    subtitle_filter = (
        f"subtitles=filename='{filter_path(subtitles)}':fontsdir='{filter_path(font_dir)}':"
        "force_style='FontName=Smiley Sans,FontSize=9,PrimaryColour=&H00FFFFFF,"
        "OutlineColour=&H00000000,BorderStyle=1,Outline=2,Shadow=0,Alignment=8,MarginV=50'"
    )
    command = [ffmpeg, "-y", "-hide_banner", "-loglevel", "error", "-i", str(joined), "-vf", subtitle_filter]
    if args.canary_seconds > 0:
        command += ["-t", f"{args.canary_seconds:.3f}"]
    command += ["-c:v", encoder]
    command += ["-b:v", "8M", "-allow_sw", "1"] if encoder == "h264_videotoolbox" else ["-preset", "veryfast", "-crf", "22"]
    command += ["-c:a", "copy", "-movflags", "+faststart", str(final_path)]
    run(command, "burn captions")

    actual_duration = probe_duration(final_path, ffprobe)
    manifest = {
        "output_id": args.output_id,
        "angle": selected.get("angle", ""),
        "voice": args.voice,
        "rate": args.rate,
        "language": "en-US",
        "source_audio_volume": args.source_audio_volume,
        "voice_volume": args.voice_volume,
        "encoder": encoder,
        "duration_s": round(actual_duration, 3),
        "output_path": str(final_path),
        "shots": rendered,
    }
    manifest_path = output_dir / f"{args.output_id}.manifest.json"
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(manifest, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
