#!/usr/bin/env python3
"""Add an account-specific ending preset and optional rewind transition to a staged CapCut draft."""

from __future__ import annotations

import argparse
import copy
import json
import re
import shutil
import time
import uuid
from pathlib import Path


CAPCUT_ROOT = Path.home() / "Movies/CapCut/User Data/Projects/com.lveditor.draft"
PRESET_LIBRARY = Path.home() / "Movies/CapCut/User Data/Presets/Combination/Presets"
PRESET_RESOURCE_ROOT = (
    Path.home()
    / "Library/Containers/com.lemon.lvoverseas/Data/Movies/CapCut/User Data/Presets/Combination"
)
DEFAULT_PROFILES = Path(__file__).resolve().parents[1] / "references/capcut-delivery-profiles.json"
UUID_RE = re.compile(r"[0-9A-Fa-f-]{36}")
PLACEHOLDER_RE = re.compile(r"##_presetpath_placeholder_[^#]+_##")


def read_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, value: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(value, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
        newline="\n",
    )


def fresh_ids(value: object) -> object:
    replacements: dict[str, str] = {}

    def collect(item: object) -> None:
        if isinstance(item, dict):
            identifier = item.get("id")
            if isinstance(identifier, str) and UUID_RE.fullmatch(identifier):
                replacements.setdefault(identifier, str(uuid.uuid4()).upper())
            for child in item.values():
                collect(child)
        elif isinstance(item, list):
            for child in item:
                collect(child)

    def replace(item: object) -> object:
        if isinstance(item, dict):
            return {key: replace(child) for key, child in item.items()}
        if isinstance(item, list):
            return [replace(child) for child in item]
        if isinstance(item, str):
            return replacements.get(item, item)
        return copy.deepcopy(item)

    collect(value)
    return replace(value)


def resolve_placeholders(value: object, resource_root: Path) -> object:
    if isinstance(value, dict):
        return {key: resolve_placeholders(child, resource_root) for key, child in value.items()}
    if isinstance(value, list):
        return [resolve_placeholders(child, resource_root) for child in value]
    if isinstance(value, str):
        return PLACEHOLDER_RE.sub(str(resource_root), value)
    return copy.deepcopy(value)


def is_within(path: Path, parent: Path) -> bool:
    try:
        path.relative_to(parent)
        return True
    except ValueError:
        return False


def profile_settings(path: Path, account: str, preset_override: str) -> tuple[str, dict, dict]:
    profiles = read_json(path)
    accounts = profiles.get("accounts") or {}
    account_key = account.strip().lower()
    settings = accounts.get(account_key) if account_key else None
    if account_key and not settings and not preset_override:
        raise RuntimeError(
            f"Account {account!r} is not configured and no --preset-name override was supplied"
        )
    preset_name = preset_override.strip() or str((settings or {}).get("ending_preset") or "")
    if not preset_name:
        raise RuntimeError("Provide --account for a configured profile or supply --preset-name")
    return preset_name, settings or {}, profiles


def main_video_track(document: dict) -> dict:
    for track in document.get("tracks") or []:
        if track.get("type") == "video" and track.get("segments"):
            return track
    raise RuntimeError("Draft has no usable main video track")


def material_lookup(document: dict) -> dict[str, tuple[str, dict]]:
    lookup: dict[str, tuple[str, dict]] = {}
    for kind, values in (document.get("materials") or {}).items():
        if not isinstance(values, list):
            continue
        for value in values:
            if isinstance(value, dict) and value.get("id"):
                lookup[str(value["id"])] = (kind, value)
    return lookup


def find_transition(capcut_root: Path, name: str, excluded: Path) -> dict:
    candidates = sorted(
        capcut_root.glob("*/draft_info.json") if capcut_root.is_dir() else [],
        key=lambda path: path.stat().st_mtime,
        reverse=True,
    )
    for path in candidates:
        if path.parent.resolve() == excluded:
            continue
        try:
            document = read_json(path)
        except Exception:
            continue
        for transition in (document.get("materials") or {}).get("transitions") or []:
            if transition.get("name") == name:
                cloned = copy.deepcopy(transition)
                cloned["id"] = str(uuid.uuid4()).upper()
                return cloned
    raise RuntimeError(f"Transition {name!r} was not found in a readable CapCut draft")


def find_subdraft_support(capcut_root: Path) -> tuple[Path, Path]:
    candidates = list(capcut_root.glob("*/subdraft/*/sub_draft_config.json"))
    candidates.sort(key=lambda path: path.stat().st_mtime, reverse=True)
    candidates.sort(key=lambda path: path.parts[-4].startswith("Codex_"))
    for config in candidates:
        cover = config.with_name("draft_cover.jpg")
        if cover.is_file():
            return config, cover
    raise RuntimeError("No readable CapCut subdraft support files were found")


def append_transition(
    document: dict,
    capcut_root: Path,
    draft_dir: Path,
    after_segment: int,
    name: str,
    duration_seconds: float | None,
) -> dict:
    track = main_video_track(document)
    if after_segment < 1 or after_segment >= len(track["segments"]):
        raise RuntimeError(
            "--transition-after-segment must identify the last complete Hook clip and leave "
            "at least one following clip"
        )
    transition = find_transition(capcut_root, name, draft_dir.resolve())
    if duration_seconds is not None:
        transition["duration"] = int(round(duration_seconds * 1_000_000))
    document["materials"].setdefault("transitions", []).append(transition)
    segment = track["segments"][after_segment - 1]
    segment.setdefault("extra_material_refs", []).append(transition["id"])
    return transition


def append_preset(
    document: dict,
    preset_file: Path,
    preset_name: str,
    resource_root: Path,
    install_destination: Path,
) -> tuple[dict, Path]:
    payload = fresh_ids(resolve_placeholders(read_json(preset_file), resource_root))
    preset_track = main_video_track(payload)
    if len(preset_track["segments"]) != 1:
        raise RuntimeError(f"Preset {preset_name!r} must expose exactly one top-level video segment")
    tail = copy.deepcopy(preset_track["segments"][0])
    body_track = main_video_track(document)
    body_duration = int(document.get("duration") or 0)
    tail_duration = int((tail.get("target_timerange") or {}).get("duration") or 0)
    if tail_duration <= 0:
        raise RuntimeError(f"Preset {preset_name!r} has no usable duration")
    tail["target_timerange"]["start"] = body_duration
    tail["volume"] = 1.0

    for kind, values in (payload.get("materials") or {}).items():
        if isinstance(values, list):
            document["materials"].setdefault(kind, []).extend(copy.deepcopy(values))

    lookup = material_lookup(document)
    tail_refs = set(tail.get("extra_material_refs") or [])
    compound = next(
        (
            item
            for identifier in tail_refs
            for kind, item in [lookup.get(identifier, ("", {}))]
            if kind == "drafts"
        ),
        None,
    )
    if not compound:
        drafts = (payload.get("materials") or {}).get("drafts") or []
        if len(drafts) != 1:
            raise RuntimeError(f"Preset {preset_name!r} has no unambiguous compound draft")
        compound = next(item for item in document["materials"]["drafts"] if item["id"] == drafts[0]["id"])

    embedded = compound.get("draft") or {}
    embedded_id = str(embedded.get("id") or "")
    if not UUID_RE.fullmatch(embedded_id):
        raise RuntimeError(f"Preset {preset_name!r} has no usable embedded draft id")
    subdraft_relative = Path("subdraft") / embedded_id
    final_subdraft = install_destination / subdraft_relative
    compound["draft_file_path"] = str(final_subdraft / "draft_content.json")
    compound["draft_config_path"] = str(final_subdraft / "sub_draft_config.json")
    compound["draft_cover_path"] = str(final_subdraft / "draft_cover.jpg")
    embedded["name"] = preset_name

    body_track["segments"].append(tail)
    document["duration"] = body_duration + tail_duration
    return compound, subdraft_relative


def absolute_local_paths(value: object) -> list[str]:
    paths: list[str] = []
    if isinstance(value, dict):
        for key, child in value.items():
            if key in {"path", "draft_file_path", "draft_config_path", "draft_cover_path"}:
                if isinstance(child, str) and child.startswith("/"):
                    paths.append(child)
            paths.extend(absolute_local_paths(child))
    elif isinstance(value, list):
        for child in value:
            paths.extend(absolute_local_paths(child))
    return paths


def validate(
    document: dict,
    draft_dir: Path,
    install_destination: Path,
    preset_name: str,
    transition_name: str | None,
    transition_after_segment: int | None,
) -> dict:
    serialized = json.dumps(document, ensure_ascii=False)
    if PLACEHOLDER_RE.search(serialized):
        raise RuntimeError("Unresolved CapCut preset placeholder remains")
    track = main_video_track(document)
    lookup = material_lookup(document)
    cursor = 0
    for segment in track["segments"]:
        timerange = segment.get("target_timerange") or {}
        if int(timerange.get("start") or 0) != cursor:
            raise RuntimeError("Main-track segments are not contiguous")
        cursor += int(timerange.get("duration") or 0)
        if segment.get("material_id") not in lookup:
            raise RuntimeError("Main-track segment refers to a missing material")
        for identifier in segment.get("extra_material_refs") or []:
            if identifier not in lookup:
                raise RuntimeError(f"Segment refers to missing material {identifier}")
    if cursor != int(document.get("duration") or 0):
        raise RuntimeError("Draft duration does not equal the main-track duration")
    last_material = lookup[track["segments"][-1]["material_id"]][1]
    if last_material.get("material_name") != preset_name:
        raise RuntimeError("Selected ending preset is not the final main-track segment")

    missing: list[str] = []
    for raw in absolute_local_paths(document):
        path = Path(raw)
        if is_within(path, install_destination):
            path = draft_dir / path.relative_to(install_destination)
        if not path.exists():
            missing.append(raw)
    if missing:
        raise RuntimeError(f"Draft contains missing local resources: {missing}")

    transition = None
    if transition_after_segment is not None:
        segment = track["segments"][transition_after_segment - 1]
        transitions = [
            lookup[identifier][1]
            for identifier in segment.get("extra_material_refs") or []
            if lookup.get(identifier, (None,))[0] == "transitions"
        ]
        transition = next((item for item in transitions if item.get("name") == transition_name), None)
        if not transition:
            raise RuntimeError("Requested rewind transition is not attached to the Hook boundary")

    return {
        "duration_s": round(cursor / 1_000_000, 3),
        "segments": len(track["segments"]),
        "ending_preset": preset_name,
        "transition": (
            {
                "name": transition.get("name"),
                "duration_s": round(int(transition.get("duration") or 0) / 1_000_000, 3),
                "after_segment": transition_after_segment,
            }
            if transition
            else None
        ),
    }


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Apply an account-specific ending preset to a newly staged CapCut draft."
    )
    parser.add_argument("--draft-dir", required=True)
    parser.add_argument("--account", default="")
    parser.add_argument("--preset-name", default="")
    parser.add_argument("--profiles", default=str(DEFAULT_PROFILES))
    parser.add_argument("--capcut-root", default=str(CAPCUT_ROOT))
    parser.add_argument("--preset-library", default=str(PRESET_LIBRARY))
    parser.add_argument("--preset-resource-root", default=str(PRESET_RESOURCE_ROOT))
    parser.add_argument("--install-destination", default="")
    parser.add_argument("--transition-after-segment", type=int)
    parser.add_argument("--transition-name", default="")
    parser.add_argument("--transition-duration", type=float)
    args = parser.parse_args()

    draft_dir = Path(args.draft_dir).expanduser().resolve()
    capcut_root = Path(args.capcut_root).expanduser().resolve()
    preset_library = Path(args.preset_library).expanduser().resolve()
    resource_root = Path(args.preset_resource_root).expanduser().resolve()
    profiles_path = Path(args.profiles).expanduser().resolve()
    install_destination = (
        Path(args.install_destination).expanduser().resolve()
        if args.install_destination
        else capcut_root / draft_dir.name
    )
    if not draft_dir.is_dir():
        raise SystemExit(f"Staged draft does not exist: {draft_dir}")
    if is_within(draft_dir, capcut_root):
        raise SystemExit("Refusing to modify a draft inside the installed CapCut project library")
    if install_destination.exists():
        raise SystemExit(f"Refusing to overwrite existing installation: {install_destination}")

    preset_name, _, profiles = profile_settings(profiles_path, args.account, args.preset_name)
    preset_file = preset_library / preset_name / "preset_draft/draft_content.json"
    if not preset_file.is_file():
        raise SystemExit(f"CapCut ending preset was not found: {preset_file}")
    if not resource_root.is_dir():
        raise SystemExit(f"CapCut preset resource root was not found: {resource_root}")

    document = read_json(draft_dir / "draft_info.json")
    original_segment_count = len(main_video_track(document)["segments"])
    transition_name = args.transition_name.strip() or str(
        (profiles.get("default_rewind_transition") or {}).get("name") or ""
    )
    transition_duration = args.transition_duration
    if transition_duration is None and args.transition_after_segment is not None:
        configured = (profiles.get("default_rewind_transition") or {}).get("duration_seconds")
        transition_duration = float(configured) if configured is not None else None
    if args.transition_after_segment is not None:
        if not transition_name:
            raise SystemExit("A transition name is required for the approved rewind boundary")
        append_transition(
            document,
            capcut_root,
            draft_dir,
            args.transition_after_segment,
            transition_name,
            transition_duration,
        )

    compound, subdraft_relative = append_preset(
        document, preset_file, preset_name, resource_root, install_destination
    )
    subdraft_dir = draft_dir / subdraft_relative
    if subdraft_dir.exists():
        raise SystemExit(f"Refusing to overwrite staged subdraft: {subdraft_dir}")
    config_source, fallback_cover = find_subdraft_support(capcut_root)
    config = read_json(config_source)
    if "name" in config:
        config["name"] = preset_name
    write_json(subdraft_dir / "draft_content.json", compound["draft"])
    write_json(subdraft_dir / "sub_draft_config.json", config)
    preset_cover = preset_file.parents[1] / f"{preset_name}.jpeg"
    shutil.copy2(preset_cover if preset_cover.is_file() else fallback_cover, subdraft_dir / "draft_cover.jpg")

    result = validate(
        document,
        draft_dir,
        install_destination,
        preset_name,
        transition_name if args.transition_after_segment is not None else None,
        args.transition_after_segment,
    )
    root_names = ["draft_info.json", "draft_info.json.bak", "draft_content.json", "template-2.tmp"]
    for name in root_names:
        write_json(draft_dir / name, document)
    timeline_dir = draft_dir / "Timelines" / str(document["id"])
    for name in ["draft_info.json", "draft_info.json.bak", "template.tmp", "template-2.tmp"]:
        write_json(timeline_dir / name, document)
    meta_path = draft_dir / "draft_meta_info.json"
    meta = read_json(meta_path)
    meta["tm_duration"] = int(document["duration"])
    meta["tm_draft_modified"] = int(time.time() * 1_000_000)
    write_json(meta_path, meta)

    result.update(
        {
            "account": args.account.strip().lower() or None,
            "staged_draft": str(draft_dir),
            "install_destination": str(install_destination),
            "source_segments": original_segment_count,
        }
    )
    write_json(draft_dir / "capcut_delivery_manifest.json", result)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
