#!/usr/bin/env python3
"""Read-only environment check for the Mac short-drama highlight skill."""

from __future__ import annotations

import json
import platform
import shutil
import sys
from pathlib import Path


def find_binary(name: str, fallbacks: list[str]) -> str | None:
    found = shutil.which(name)
    if found:
        return found
    for candidate in fallbacks:
        if Path(candidate).is_file():
            return candidate
    return None


def main() -> int:
    ffmpeg = find_binary("ffmpeg", ["/opt/homebrew/bin/ffmpeg", str(Path.home() / ".local/bin/ffmpeg")])
    ffprobe = find_binary("ffprobe", ["/opt/homebrew/bin/ffprobe", str(Path.home() / ".local/bin/ffprobe")])
    whisper_cli = find_binary("whisper-cli", ["/opt/homebrew/bin/whisper-cli"])
    whisper_model = Path.home() / ".codex/models/whisper/ggml-base.en.bin"
    draft_roots = {
        "capcut": Path.home() / "Movies/CapCut/User Data/Projects/com.lveditor.draft",
        "jianying": Path.home() / "Movies/JianyingPro/User Data/Projects/com.lveditor.draft",
    }
    report = {
        "python": platform.python_version(),
        "architecture": platform.machine(),
        "ffmpeg": ffmpeg,
        "ffprobe": ffprobe,
        "whisper_cli": whisper_cli,
        "whisper_model": str(whisper_model) if whisper_model.is_file() else None,
        "draft_roots": {name: str(path) if path.is_dir() else None for name, path in draft_roots.items()},
    }
    print(json.dumps(report, ensure_ascii=False, indent=2))
    ok = (
        sys.version_info >= (3, 10)
        and platform.machine() == "arm64"
        and ffmpeg is not None
        and ffprobe is not None
        and whisper_cli is not None
        and whisper_model.is_file()
    )
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
