#!/usr/bin/env python3
"""Transcribe short-drama episodes locally with whisper.cpp on macOS."""

from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
from pathlib import Path

VIDEO_EXTENSIONS = {".mp4", ".mov", ".mkv", ".m4v", ".avi"}
DEFAULT_MODEL = Path.home() / ".codex/models/whisper/ggml-base.en.bin"


def natural_key(text: str) -> list[object]:
    return [int(part) if part.isdigit() else part.lower() for part in re.split(r"(\d+)", text)]


def find_binary(name: str, fallbacks: list[str]) -> str:
    for candidate in (shutil.which(name), *fallbacks):
        if candidate and Path(candidate).is_file():
            return candidate
    raise RuntimeError(f"{name} not found")


def probe_duration(video: Path) -> float:
    result = subprocess.run(
        [
            find_binary("ffprobe", ["/opt/homebrew/bin/ffprobe", str(Path.home() / ".local/bin/ffprobe")]),
            "-v", "error", "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1", str(video),
        ],
        check=True,
        capture_output=True,
        text=True,
    )
    return float(result.stdout.strip())


def normalize_result(result: dict, duration: float, model: Path) -> dict:
    normalized_segments: list[dict] = []
    for idx, segment in enumerate(result.get("transcription") or []):
        offsets = segment.get("offsets") or {}
        words = []
        for word in segment.get("tokens") or []:
            token = str(word.get("text") or "")
            if not token:
                continue
            word_offsets = word.get("offsets") or {}
            words.append({
                "word": token,
                "start": round(float(word_offsets.get("from", offsets.get("from", 0))) / 1000.0, 3),
                "end": round(float(word_offsets.get("to", offsets.get("to", 0))) / 1000.0, 3),
                "confidence": word.get("p"),
            })
        normalized_segments.append({
            "id": idx,
            "start": round(float(offsets.get("from", 0)) / 1000.0, 3),
            "end": round(float(offsets.get("to", 0)) / 1000.0, 3),
            "text": str(segment.get("text") or "").strip(),
            "words": words,
        })
    language = str((result.get("result") or {}).get("language") or "unknown")
    return {
        "text": " ".join(segment["text"] for segment in normalized_segments if segment["text"]).strip(),
        "segments": normalized_segments,
        "language": language,
        "duration": round(duration, 3),
        "provider": "whisper.cpp-local",
        "model": str(model),
    }


def transcribe_video(video: Path, item_dir: Path, model: Path, language: str, keep_wav: bool) -> dict:
    ffmpeg = find_binary("ffmpeg", ["/opt/homebrew/bin/ffmpeg", str(Path.home() / ".local/bin/ffmpeg")])
    whisper_cli = find_binary("whisper-cli", ["/opt/homebrew/bin/whisper-cli"])
    wav_path = item_dir / "audio_16k_mono.wav"
    raw_prefix = item_dir / "whisper_raw"
    raw_json = raw_prefix.with_suffix(".json")
    subprocess.run(
        [ffmpeg, "-hide_banner", "-loglevel", "error", "-y", "-i", str(video),
         "-vn", "-ac", "1", "-ar", "16000", "-c:a", "pcm_s16le", str(wav_path)],
        check=True,
    )
    command = [
        whisper_cli, "--no-gpu", "-t", "8", "-m", str(model), "-f", str(wav_path),
        "-l", language, "-oj", "-ojf", "-of", str(raw_prefix), "--no-prints",
    ]
    subprocess.run(command, check=True)
    result = json.loads(raw_json.read_text(encoding="utf-8"))
    normalized = normalize_result(result, probe_duration(video), model)
    if not keep_wav:
        wav_path.unlink(missing_ok=True)
    return normalized


def main() -> int:
    parser = argparse.ArgumentParser(description="Transcribe drama episodes locally with whisper.cpp.")
    parser.add_argument("--input-root", required=True, help="Folder containing episode videos.")
    parser.add_argument("--output-root", required=True, help="ASR work directory.")
    parser.add_argument("--model", default=str(DEFAULT_MODEL), help="Path to a whisper.cpp ggml model.")
    parser.add_argument("--language", default="auto", help="Language code such as en/zh, or auto.")
    parser.add_argument("--limit", type=int, default=0, help="Optional episode limit for a canary.")
    parser.add_argument("--keep-wav", action="store_true", help="Keep extracted WAV files for debugging.")
    args = parser.parse_args()

    input_root = Path(args.input_root).expanduser().resolve()
    output_root = Path(args.output_root).expanduser().resolve()
    model = Path(args.model).expanduser().resolve()
    if not model.is_file():
        raise SystemExit(f"Whisper model not found: {model}")
    output_root.mkdir(parents=True, exist_ok=True)
    videos = sorted(
        (path for path in input_root.iterdir() if path.is_file() and path.suffix.lower() in VIDEO_EXTENSIONS),
        key=lambda path: natural_key(path.name),
    )
    if args.limit > 0:
        videos = videos[: args.limit]
    if not videos:
        raise SystemExit(f"No supported video files found in {input_root}")

    summary_path = output_root / "batch_summary.json"
    prior: dict[str, dict] = {}
    if summary_path.exists():
        try:
            prior = {row["video"]: row for row in json.loads(summary_path.read_text(encoding="utf-8"))}
        except Exception:
            prior = {}

    rows: list[dict] = []
    for index, video in enumerate(videos, start=1):
        item_dir = output_root / f"{index:03d}_{video.stem}"
        item_dir.mkdir(parents=True, exist_ok=True)
        timeline_path = item_dir / "timeline_segments.json"
        existing = prior.get(str(video))
        if existing and existing.get("status") == "ok" and timeline_path.exists():
            print(f"[{index}/{len(videos)}] SKIP {video.name}", flush=True)
            rows.append(existing)
            continue

        print(f"[{index}/{len(videos)}] TRANSCRIBE {video.name}", flush=True)
        row = {
            "index": index,
            "video": str(video),
            "item_dir": str(item_dir),
            "status": "failed",
            "message": "",
        }
        try:
            normalized = transcribe_video(video, item_dir, model, args.language, args.keep_wav)
            timeline_path.write_text(
                json.dumps(normalized, ensure_ascii=False, indent=2), encoding="utf-8", newline="\n"
            )
            (item_dir / "transcript.txt").write_text(
                normalized["text"], encoding="utf-8", newline="\n"
            )
            row["status"] = "ok"
            row["language"] = normalized["language"]
        except Exception as exc:
            row["message"] = f"{type(exc).__name__}: {exc}"
        rows.append(row)
        summary_path.write_text(
            json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8", newline="\n"
        )

    summary_path.write_text(
        json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8", newline="\n"
    )
    ok_count = sum(row["status"] == "ok" for row in rows)
    print(f"Done: {ok_count}/{len(rows)} episodes transcribed")
    return 0 if ok_count == len(rows) else 2


if __name__ == "__main__":
    raise SystemExit(main())
