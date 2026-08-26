#!/usr/bin/env python3
"""Discover short-drama folders and create a sequential Mac batch manifest."""

from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
from datetime import datetime, timezone
from pathlib import Path


VIDEO_EXTENSIONS = {".mp4", ".mov", ".m4v", ".mkv"}


def natural_key(value: str) -> list[object]:
    return [int(part) if part.isdigit() else part.lower() for part in re.split(r"(\d+)", value)]


def videos_in(folder: Path) -> list[Path]:
    return sorted(
        [path for path in folder.iterdir() if path.is_file() and path.suffix.lower() in VIDEO_EXTENSIONS],
        key=lambda path: natural_key(path.name),
    )


def duration_seconds(path: Path, ffprobe: str) -> float:
    result = subprocess.run(
        [ffprobe, "-v", "error", "-show_entries", "format=duration", "-of", "default=nk=1:nw=1", str(path)],
        check=True,
        capture_output=True,
        text=True,
    )
    return float(result.stdout.strip())


def main() -> int:
    parser = argparse.ArgumentParser(description="Prepare a sequential short-drama highlight queue on macOS.")
    source = parser.add_mutually_exclusive_group(required=True)
    source.add_argument("--input-root", help="Parent folder whose child folders are dramas.")
    source.add_argument("--drama-dir", help="One drama folder for a canary or single job.")
    parser.add_argument("--output-root", required=True)
    parser.add_argument("--outputs-per-drama", type=int, default=3)
    parser.add_argument("--force", action="store_true", help="Replace only the generated batch_jobs.json manifest.")
    args = parser.parse_args()

    if not 1 <= args.outputs_per_drama <= 10:
        raise SystemExit("--outputs-per-drama must be between 1 and 10")
    ffprobe = shutil.which("ffprobe")
    if not ffprobe:
        raise SystemExit("ffprobe not found; install FFmpeg first")

    output_root = Path(args.output_root).expanduser().resolve()
    if args.drama_dir:
        drama_dirs = [Path(args.drama_dir).expanduser().resolve()]
    else:
        input_root = Path(args.input_root).expanduser().resolve()
        if not input_root.is_dir():
            raise SystemExit(f"Input root is not a directory: {input_root}")
        direct = videos_in(input_root)
        drama_dirs = [input_root] if direct else sorted(
            [path for path in input_root.iterdir() if path.is_dir() and videos_in(path)],
            key=lambda path: natural_key(path.name),
        )
    if not drama_dirs:
        raise SystemExit("No drama folders with video episodes found")

    jobs = []
    for order, drama_dir in enumerate(drama_dirs, start=1):
        if not drama_dir.is_dir():
            raise SystemExit(f"Drama directory does not exist: {drama_dir}")
        episodes = videos_in(drama_dir)
        if not episodes:
            raise SystemExit(f"No video episodes found: {drama_dir}")
        if output_root == drama_dir or output_root.is_relative_to(drama_dir):
            raise SystemExit(f"Output root must stay outside source drama folders: {drama_dir}")
        total = sum(duration_seconds(path, ffprobe) for path in episodes)
        slug = re.sub(r"[^0-9A-Za-z._-]+", "-", drama_dir.name).strip("-") or f"drama-{order:02d}"
        job_root = output_root / f"{order:02d}-{slug}"
        jobs.append({
            "order": order,
            "drama_name": drama_dir.name,
            "source_dir": str(drama_dir),
            "episode_count": len(episodes),
            "total_duration_s": round(total, 3),
            "outputs_per_drama": args.outputs_per_drama,
            "preferred_duration_s": {"min": 45, "max": 90},
            "work_dir": str(job_root / "work"),
            "output_dir": str(job_root / "outputs"),
            "status": "ready",
        })

    output_root.mkdir(parents=True, exist_ok=True)
    manifest = output_root / "batch_jobs.json"
    if manifest.exists() and not args.force:
        raise SystemExit(f"Refusing to overwrite existing manifest: {manifest}; pass --force to replace only it")
    payload = {
        "schema_version": 1,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "processing_mode": "sequential",
        "default_outputs_per_drama": args.outputs_per_drama,
        "jobs": jobs,
    }
    manifest.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"manifest": str(manifest), "dramas": len(jobs), "outputs_planned": len(jobs) * args.outputs_per_drama}, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
