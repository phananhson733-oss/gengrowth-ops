#!/usr/bin/env python3
"""Safely preflight and generate one raw Mira HeyGen avatar video.

V1 intentionally excludes subtitle generation, editing, publishing, and lifecycle edits.
Uses only the Python standard library plus ffprobe for media QC.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import time
from datetime import datetime, timezone
from typing import Any
import urllib.error
import urllib.request
import uuid

API_BASE = "https://api.heygen.com"
SKILL_DIR = Path(__file__).resolve().parents[1]
DEFAULT_CONFIG = SKILL_DIR / "references" / "miraa-defaults.json"
TERMINAL_STATUSES = {"completed", "failed"}


class WorkflowError(RuntimeError):
    pass


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def load_json(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def write_json(path: Path, value: Any) -> None:
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def append_jsonl(path: Path, value: Any) -> None:
    with path.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(value, ensure_ascii=False) + "\n")


def read_script(path: Path) -> str:
    if not path.is_file():
        raise WorkflowError(f"Script file not found: {path}")
    text = path.read_text(encoding="utf-8").strip()
    if not text:
        raise WorkflowError("Script is empty.")
    if len(text) > 5000:
        raise WorkflowError(f"Script has {len(text)} characters; HeyGen v3 limit is 5000.")
    return text


def count_words(text: str) -> int:
    latin = re.findall(r"[A-Za-z0-9]+(?:['’\-][A-Za-z0-9]+)*", text)
    cjk = re.findall(r"[\u3400-\u9fff]", text)
    return len(latin) + len(cjk)


def sha256_text(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def resolve_key(config: dict[str, Any]) -> tuple[str, str]:
    auth = config["auth"]
    env_name = auth.get("environment_variable", "HEYGEN_API_KEY")
    value = os.getenv(env_name, "").strip()
    if value:
        return value, f"environment:{env_name}"
    if sys.platform == "darwin":
        command = [
            "security", "find-generic-password",
            "-a", auth["macos_keychain_account"],
            "-s", auth["macos_keychain_service"],
            "-w",
        ]
        result = subprocess.run(command, capture_output=True, text=True, check=False)
        value = result.stdout.strip()
        if result.returncode == 0 and value:
            return value, "macOS Keychain"
    raise WorkflowError(
        f"HeyGen API key not found. Set {env_name} or save it in the configured macOS Keychain entry; do not paste it into chat."
    )


def api_request(
    method: str,
    path: str,
    key: str,
    body: dict[str, Any] | None = None,
    extra_headers: dict[str, str] | None = None,
    timeout: int = 30,
    attempts: int = 3,
) -> dict[str, Any]:
    data = None if body is None else json.dumps(body).encode("utf-8")
    headers = {"x-api-key": key, "Accept": "application/json"}
    if body is not None:
        headers["Content-Type"] = "application/json"
    if extra_headers:
        headers.update(extra_headers)
    for attempt in range(1, attempts + 1):
        request = urllib.request.Request(API_BASE + path, data=data, headers=headers, method=method)
        try:
            with urllib.request.urlopen(request, timeout=timeout) as response:
                payload = response.read().decode("utf-8")
                return json.loads(payload)
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")
            if exc.code == 429 and attempt < attempts:
                retry_after = exc.headers.get("Retry-After")
                delay = int(retry_after) if retry_after and retry_after.isdigit() else 2 ** attempt
                time.sleep(min(delay, 30))
                continue
            raise WorkflowError(f"HeyGen API {exc.code} for {method} {path}: {detail[:800]}") from exc
        except (urllib.error.URLError, TimeoutError) as exc:
            if attempt < attempts:
                time.sleep(2 ** attempt)
                continue
            raise WorkflowError(f"Network failure for {method} {path}: {exc}") from exc
    raise WorkflowError(f"No response for {method} {path}")


def find_wallet(payload: dict[str, Any]) -> float | None:
    data = payload.get("data", payload)
    wallet = data.get("wallet") if isinstance(data, dict) else None
    if isinstance(wallet, (int, float)):
        return float(wallet)
    if isinstance(wallet, dict):
        preferred = (
            "balance", "remaining", "amount", "usd", "usd_balance",
            "remaining_balance", "available", "available_balance",
        )
        for key in preferred:
            value = wallet.get(key)
            if isinstance(value, (int, float)):
                return float(value)
        for value in wallet.values():
            if isinstance(value, (int, float)):
                return float(value)
    return None


def list_items(payload: dict[str, Any]) -> list[dict[str, Any]]:
    data = payload.get("data", payload)
    if isinstance(data, list):
        return [item for item in data if isinstance(item, dict)]
    if isinstance(data, dict):
        for key in ("items", "voices", "results", "avatars", "looks"):
            value = data.get(key)
            if isinstance(value, list):
                return [item for item in value if isinstance(item, dict)]
    return []


def validate_voice(key: str, voice_id: str, look: dict[str, Any]) -> dict[str, Any]:
    if look.get("default_voice_id") == voice_id:
        return {
            "id": voice_id,
            "name": "Look default voice",
            "type": "look_default",
            "language": None,
        }
    for ownership in ("private", "public"):
        payload = api_request("GET", f"/v3/voices?type={ownership}&limit=100", key)
        for item in list_items(payload):
            if item.get("id") == voice_id or item.get("voice_id") == voice_id:
                return {
                    "id": voice_id,
                    "name": item.get("name") or item.get("display_name"),
                    "type": ownership,
                    "language": item.get("language") or item.get("locale"),
                }
    raise WorkflowError(
        f"Voice ID is not the Look default and was not found in the first 100 private or public voices: {voice_id}"
    )


def merged_settings(args: argparse.Namespace, config: dict[str, Any]) -> dict[str, Any]:
    voice_defaults = config["voice_settings"]
    pricing = config["pricing"]
    polling = config["polling"]
    return {
        "avatar_id": args.avatar_id or config["avatar_id"],
        "voice_id": args.voice_id or config["voice_id"],
        "engine": args.engine or config["engine"],
        "resolution": args.resolution or config["resolution"],
        "aspect_ratio": args.aspect_ratio or config["aspect_ratio"],
        "fit": args.fit or config["fit"],
        "output_format": config.get("output_format", "mp4"),
        "expressiveness": args.expressiveness or config.get("expressiveness", "low"),
        "speed": args.speed if args.speed is not None else voice_defaults["speed"],
        "pitch": args.pitch if args.pitch is not None else voice_defaults["pitch"],
        "volume": args.volume if args.volume is not None else voice_defaults["volume"],
        "estimated_wpm": args.estimated_wpm or pricing["estimated_wpm"],
        "cost_per_second": args.cost_per_second or pricing["photo_avatar_720p_1080p_usd_per_second"],
        "safety_factor": args.safety_factor or pricing["safety_factor"],
        "max_cost_usd": args.max_cost_usd or pricing["default_max_cost_usd"],
        "poll_interval": args.poll_interval or polling["interval_seconds"],
        "poll_timeout": args.poll_timeout or polling["timeout_seconds"],
    }


def estimate(script: str, settings: dict[str, Any]) -> dict[str, Any]:
    words = count_words(script)
    if words == 0:
        raise WorkflowError("No countable words found in the script.")
    seconds = words / float(settings["estimated_wpm"]) * 60.0
    base = seconds * float(settings["cost_per_second"])
    ceiling = base * float(settings["safety_factor"])
    return {
        "word_count": words,
        "estimated_duration_seconds": round(seconds, 2),
        "base_cost_usd": round(base, 2),
        "conservative_cost_ceiling_usd": round(ceiling, 2),
    }


def preflight(args: argparse.Namespace, config: dict[str, Any], script: str) -> dict[str, Any]:
    settings = merged_settings(args, config)
    estimated = estimate(script, settings)
    if estimated["conservative_cost_ceiling_usd"] > float(settings["max_cost_usd"]):
        raise WorkflowError(
            f"Conservative estimate ${estimated['conservative_cost_ceiling_usd']:.2f} exceeds max ${settings['max_cost_usd']:.2f}."
        )
    key, key_source = resolve_key(config)
    user = api_request("GET", "/v3/users/me", key)
    wallet = find_wallet(user)
    if wallet is None:
        raise WorkflowError("Could not read the API wallet from GET /v3/users/me; refusing paid generation.")
    if wallet + 1e-9 < estimated["conservative_cost_ceiling_usd"]:
        raise WorkflowError(
            f"API wallet ${wallet:.2f} is below conservative estimate ${estimated['conservative_cost_ceiling_usd']:.2f}."
        )
    look_payload = api_request("GET", f"/v3/avatars/looks/{settings['avatar_id']}", key)
    look = look_payload.get("data", look_payload)
    if not isinstance(look, dict) or look.get("id") != settings["avatar_id"]:
        raise WorkflowError("HeyGen returned an unexpected Look record.")
    if look.get("status") not in (None, "completed"):
        raise WorkflowError(f"Look status is not completed: {look.get('status')}")
    supported = look.get("supported_api_engines") or []
    if supported and settings["engine"] not in supported:
        raise WorkflowError(f"Look does not support engine {settings['engine']}; supported: {supported}")
    voice = validate_voice(key, settings["voice_id"], look)
    ffprobe = shutil.which("ffprobe")
    if not ffprobe:
        raise WorkflowError("ffprobe is required for post-generation QC but is not installed or on PATH.")
    report = {
        "checked_at": utc_now(),
        "paid_post_performed": False,
        "content_id": args.content_id,
        "script": {
            "path": str(Path(args.script).resolve()),
            "sha256": sha256_text(script),
            "character_count": len(script),
            **estimated,
        },
        "selection": {
            "avatar_group_id": look.get("group_id"),
            "avatar_id": settings["avatar_id"],
            "look_name": look.get("name"),
            "avatar_type": look.get("avatar_type"),
            "look_status": look.get("status"),
            "supported_api_engines": supported,
            "voice": voice,
            "engine": settings["engine"],
            "resolution": settings["resolution"],
            "aspect_ratio": settings["aspect_ratio"],
            "fit": settings["fit"],
            "expressiveness": settings["expressiveness"],
            "voice_settings": {
                "speed": settings["speed"],
                "pitch": settings["pitch"],
                "volume": settings["volume"],
            },
        },
        "budget": {
            "wallet_usd": round(wallet, 4),
            "cost_per_output_second_usd": settings["cost_per_second"],
            "max_cost_usd": settings["max_cost_usd"],
            "safety_factor": settings["safety_factor"],
        },
        "environment": {"api_key_source": key_source, "ffprobe": ffprobe},
        "status": "preflight_pass",
        "next_action": "Show this card to the user and obtain explicit confirmation before paid generation.",
    }
    return report


def print_card(report: dict[str, Any]) -> None:
    script = report["script"]
    selection = report["selection"]
    budget = report["budget"]
    voice = selection["voice"]
    print("Mira HeyGen preflight: PASS")
    print(f"content_id: {report['content_id']}")
    print(f"script: {script['word_count']} words, sha256 {script['sha256'][:12]}")
    print(f"estimated duration: {script['estimated_duration_seconds']:.2f}s")
    print(f"estimated base cost: ${script['base_cost_usd']:.2f}")
    print(f"conservative ceiling: ${script['conservative_cost_ceiling_usd']:.2f}")
    print(f"wallet: ${budget['wallet_usd']:.2f}; max allowed: ${budget['max_cost_usd']:.2f}")
    print(f"Look: {selection['avatar_id']} ({selection.get('look_name') or 'unnamed'})")
    print(f"Voice: {voice['id']} ({voice.get('name') or 'unnamed'})")
    print(
        f"engine/output: {selection['engine']}, {selection['resolution']} {selection['aspect_ratio']}, "
        f"speed {selection['voice_settings']['speed']}"
    )
    print("No paid generation was submitted.")


def sanitized_result(data: dict[str, Any]) -> dict[str, Any]:
    allowed = (
        "id", "status", "title", "created_at", "completed_at", "duration",
        "failure_code", "failure_message", "video_page_url", "output_language",
    )
    return {key: data.get(key) for key in allowed if data.get(key) is not None}


def download(url: str, path: Path) -> None:
    request = urllib.request.Request(url, headers={"User-Agent": "miraa-heygen-video/1.0"})
    try:
        with urllib.request.urlopen(request, timeout=120) as response, path.open("wb") as handle:
            while True:
                chunk = response.read(1024 * 1024)
                if not chunk:
                    break
                handle.write(chunk)
    except Exception:
        if path.exists():
            path.unlink()
        raise


def ffprobe_qc(path: Path, settings: dict[str, Any]) -> dict[str, Any]:
    command = [
        "ffprobe", "-v", "error", "-show_streams", "-show_format",
        "-of", "json", str(path),
    ]
    result = subprocess.run(command, capture_output=True, text=True, check=False)
    if result.returncode != 0:
        return {"technical_pass": False, "error": result.stderr.strip()[:1000]}
    payload = json.loads(result.stdout)
    streams = payload.get("streams", [])
    video = next((item for item in streams if item.get("codec_type") == "video"), None)
    audio = next((item for item in streams if item.get("codec_type") == "audio"), None)
    duration_value = payload.get("format", {}).get("duration")
    duration = float(duration_value) if duration_value is not None else None
    expected = None
    if settings["resolution"] == "1080p" and settings["aspect_ratio"] == "9:16":
        expected = {"width": 1080, "height": 1920}
    dimension_pass = bool(video)
    if expected and video:
        dimension_pass = video.get("width") == expected["width"] and video.get("height") == expected["height"]
    technical_pass = bool(path.stat().st_size > 0 and video and audio and dimension_pass and duration and duration > 0)
    return {
        "checked_at": utc_now(),
        "technical_pass": technical_pass,
        "file": str(path),
        "bytes": path.stat().st_size,
        "duration_seconds": duration,
        "video": None if not video else {
            "codec": video.get("codec_name"),
            "width": video.get("width"),
            "height": video.get("height"),
            "frame_rate": video.get("avg_frame_rate"),
        },
        "audio": None if not audio else {
            "codec": audio.get("codec_name"),
            "sample_rate": audio.get("sample_rate"),
            "channels": audio.get("channels"),
        },
        "expected_dimensions": expected,
        "dimension_pass": dimension_pass,
        "human_review_required": True,
        "production_state": "production_pending_human_review",
        "subtitles_generated": False,
    }


def run_generate(args: argparse.Namespace, config: dict[str, Any], script: str) -> int:
    if not args.confirmed_script:
        raise WorkflowError("Missing --confirmed-script. Confirm the canonical script first.")
    if not args.confirm_paid_generation:
        raise WorkflowError("Missing --confirm-paid-generation after showing the latest preflight cost card.")
    settings = merged_settings(args, config)
    output_dir = Path(args.output_dir).expanduser().resolve()
    output_dir.mkdir(parents=True, exist_ok=True)
    state_path = output_dir / "run-state.json"
    script_copy = output_dir / "script.txt"
    metadata_path = output_dir / "run-metadata.json"

    current_hash = sha256_text(script)
    if script_copy.exists() and sha256_text(script_copy.read_text(encoding="utf-8").strip()) != current_hash:
        raise WorkflowError("Output directory contains a different script; choose a new output directory.")
    script_copy.write_text(script + "\n", encoding="utf-8")

    report = preflight(args, config, script)
    print_card(report)
    key, _ = resolve_key(config)
    before_wallet = report["budget"]["wallet_usd"]

    state = load_json(state_path) if state_path.exists() else {}
    if state.get("script_sha256") and state["script_sha256"] != current_hash:
        raise WorkflowError("Existing run state belongs to a different script.")

    title = args.title or f"miraa-{args.content_id}-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
    request_body = {
        "type": "avatar",
        "avatar_id": settings["avatar_id"],
        "title": title,
        "resolution": settings["resolution"],
        "aspect_ratio": settings["aspect_ratio"],
        "fit": settings["fit"],
        "output_format": settings["output_format"],
        "script": script,
        "voice_id": settings["voice_id"],
        "voice_settings": {
            "speed": settings["speed"],
            "pitch": settings["pitch"],
            "volume": settings["volume"],
        },
        "expressiveness": settings["expressiveness"],
        "engine": {"type": settings["engine"]},
    }
    sanitized_request = dict(request_body)
    sanitized_request["script"] = {
        "sha256": current_hash,
        "word_count": count_words(script),
        "character_count": len(script),
    }
    write_json(output_dir / "request-sanitized.json", sanitized_request)

    video_id = state.get("video_id")
    started_monotonic = time.monotonic()
    if not video_id:
        idempotency_key = state.get("idempotency_key") or str(uuid.uuid4())
        state = {
            "content_id": args.content_id,
            "script_sha256": current_hash,
            "idempotency_key": idempotency_key,
            "created_at": utc_now(),
            "status": "submitting",
        }
        write_json(state_path, state)
        response = api_request(
            "POST", "/v3/videos", key, body=request_body,
            extra_headers={"Idempotency-Key": idempotency_key}, timeout=60,
        )
        data = response.get("data", response)
        video_id = data.get("video_id") or data.get("id")
        if not video_id:
            raise WorkflowError(f"Create response had no video_id: {response}")
        state.update({"video_id": video_id, "status": data.get("status", "submitted"), "submitted_at": utc_now()})
        write_json(state_path, state)
        write_json(output_dir / "submission.json", {
            "submitted_at": state["submitted_at"],
            "video_id": video_id,
            "status": state["status"],
            "output_format": data.get("output_format"),
        })
        print(f"Submitted HeyGen video: {video_id}")
    else:
        print(f"Resuming existing HeyGen video: {video_id}")

    deadline = time.monotonic() + float(settings["poll_timeout"])
    final_data: dict[str, Any] | None = None
    while time.monotonic() < deadline:
        payload = api_request("GET", f"/v3/videos/{video_id}", key)
        data = payload.get("data", payload)
        if not isinstance(data, dict):
            raise WorkflowError("Unexpected video status response.")
        status = data.get("status", "unknown")
        append_jsonl(output_dir / "status-log.jsonl", {"checked_at": utc_now(), "status": status})
        print(f"status: {status}")
        state["status"] = status
        state["last_checked_at"] = utc_now()
        write_json(state_path, state)
        if status in TERMINAL_STATUSES or (data.get("video_url") and data.get("duration")):
            final_data = data
            break
        time.sleep(float(settings["poll_interval"]))
    if final_data is None:
        raise WorkflowError(f"Polling timed out after {settings['poll_timeout']} seconds. Rerun the same command to resume.")
    if final_data.get("status") == "failed":
        write_json(output_dir / "result-sanitized.json", sanitized_result(final_data))
        raise WorkflowError(
            f"HeyGen generation failed: {final_data.get('failure_code')} {final_data.get('failure_message')}"
        )
    video_url = final_data.get("video_url")
    if not video_url:
        raise WorkflowError("Completed response did not contain video_url.")

    video_path = output_dir / "miraa-heygen-raw.mp4"
    if not video_path.exists() or video_path.stat().st_size == 0:
        download(video_url, video_path)
    write_json(output_dir / "result-sanitized.json", sanitized_result(final_data))
    qc = ffprobe_qc(video_path, settings)
    actual_duration = final_data.get("duration") or qc.get("duration_seconds")
    theoretical_cost = None if actual_duration is None else round(float(actual_duration) * float(settings["cost_per_second"]), 4)

    after_user = api_request("GET", "/v3/users/me", key)
    after_wallet = find_wallet(after_user)
    wallet_cost = None if after_wallet is None else round(float(before_wallet) - float(after_wallet), 4)
    elapsed = round(time.monotonic() - started_monotonic, 2)
    metadata = {
        "schema_version": 1,
        "completed_at": utc_now(),
        "content_id": args.content_id,
        "video_id": video_id,
        "script_sha256": current_hash,
        "script_word_count": count_words(script),
        "selection": report["selection"],
        "estimate": {
            "duration_seconds": report["script"]["estimated_duration_seconds"],
            "base_cost_usd": report["script"]["base_cost_usd"],
            "conservative_cost_ceiling_usd": report["script"]["conservative_cost_ceiling_usd"],
            "max_cost_usd": settings["max_cost_usd"],
        },
        "actual": {
            "duration_seconds": actual_duration,
            "theoretical_cost_usd": theoretical_cost,
            "wallet_before_usd": before_wallet,
            "wallet_after_usd": after_wallet,
            "observed_wallet_cost_usd": wallet_cost,
            "command_elapsed_seconds": elapsed,
        },
        "output_file": str(video_path),
        "technical_pass": qc.get("technical_pass", False),
        "production_state": "production_pending_human_review",
        "human_review_required": True,
        "subtitles_generated": False,
    }
    write_json(metadata_path, metadata)
    write_json(output_dir / "qc-report.json", qc)
    state.update({"status": "downloaded_and_checked", "completed_at": utc_now()})
    write_json(state_path, state)
    print(f"Output: {video_path}")
    print(f"Technical pass: {qc.get('technical_pass', False)}")
    if theoretical_cost is not None:
        print(f"Theoretical duration cost: ${theoretical_cost:.2f}")
    if wallet_cost is not None:
        print(f"Observed wallet change: ${wallet_cost:.2f}")
    print("Production state: production_pending_human_review")
    print("Subtitles: not generated (V1 scope)")
    return 0


def add_common(parser: argparse.ArgumentParser) -> None:
    parser.add_argument("--script", required=True, help="Path to the final confirmed UTF-8 script")
    parser.add_argument("--content-id", required=True, help="Canonical content ID or production identifier")
    parser.add_argument("--config", default=str(DEFAULT_CONFIG), help="Defaults JSON path")
    parser.add_argument("--avatar-id", help="Override Mira Look ID")
    parser.add_argument("--voice-id", help="Override HeyGen voice ID")
    parser.add_argument("--engine", choices=("avatar_iv", "avatar_v"))
    parser.add_argument("--resolution", choices=("720p", "1080p", "4k"))
    parser.add_argument("--aspect-ratio", choices=("9:16", "16:9"))
    parser.add_argument("--fit", choices=("cover", "contain"))
    parser.add_argument("--expressiveness", choices=("low", "medium", "high"))
    parser.add_argument("--speed", type=float)
    parser.add_argument("--pitch", type=float)
    parser.add_argument("--volume", type=float)
    parser.add_argument("--estimated-wpm", type=float)
    parser.add_argument("--cost-per-second", type=float)
    parser.add_argument("--safety-factor", type=float)
    parser.add_argument("--max-cost-usd", type=float)
    parser.add_argument("--poll-interval", type=float)
    parser.add_argument("--poll-timeout", type=float)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    subparsers = parser.add_subparsers(dest="command", required=True)
    preflight_parser = subparsers.add_parser("preflight", help="Read-only validation and cost estimate")
    add_common(preflight_parser)
    generate_parser = subparsers.add_parser("generate", help="Paid generation, polling, download, and QC")
    add_common(generate_parser)
    generate_parser.add_argument("--output-dir", required=True)
    generate_parser.add_argument("--title")
    generate_parser.add_argument("--confirmed-script", action="store_true")
    generate_parser.add_argument("--confirm-paid-generation", action="store_true")
    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    try:
        config = load_json(Path(args.config).expanduser().resolve())
        script = read_script(Path(args.script).expanduser().resolve())
        if args.command == "preflight":
            report = preflight(args, config, script)
            print_card(report)
            print(json.dumps(report, ensure_ascii=False, indent=2))
            return 0
        return run_generate(args, config, script)
    except WorkflowError as exc:
        print(f"BLOCKED: {exc}", file=sys.stderr)
        return 2
    except KeyboardInterrupt:
        print("Interrupted. Rerun the same generate command and output directory to resume.", file=sys.stderr)
        return 130


if __name__ == "__main__":
    raise SystemExit(main())
