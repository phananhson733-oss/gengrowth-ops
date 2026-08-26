#!/usr/bin/env python3
"""Build editable CapCut and Jianying draft folders from edit_plan.json on macOS.

The current CapCut/Jianying schema changes frequently.  This adapter derives the
structural shape from a readable local CapCut draft, replaces all timeline and
material identifiers, and emits isolated draft folders.  It never edits an
existing draft folder.
"""

from __future__ import annotations

import argparse
import copy
import json
import shutil
import subprocess
import time
import uuid
from pathlib import Path


CAPCUT_ROOT = Path.home() / "Movies/CapCut/User Data/Projects/com.lveditor.draft"
JIANYING_ROOT = Path.home() / "Movies/JianyingPro/User Data/Projects/com.lveditor.draft"


def uid() -> str:
    return str(uuid.uuid4()).upper()


def uid_lower() -> str:
    return str(uuid.uuid4()).lower()


def read_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, value: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(value, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
        newline="\n",
    )


def find_binary(name: str, fallbacks: list[str]) -> str:
    found = shutil.which(name)
    if found:
        return found
    for candidate in fallbacks:
        if Path(candidate).is_file():
            return candidate
    raise RuntimeError(f"{name} not found")


def probe_video(path: Path) -> dict:
    ffprobe = find_binary(
        "ffprobe", ["/opt/homebrew/bin/ffprobe", str(Path.home() / ".local/bin/ffprobe")]
    )
    result = subprocess.run(
        [
            ffprobe,
            "-v", "error",
            "-select_streams", "v:0",
            "-show_entries", "stream=width,height:format=duration",
            "-of", "json",
            str(path),
        ],
        check=True,
        capture_output=True,
        text=True,
    )
    data = json.loads(result.stdout)
    stream = (data.get("streams") or [{}])[0]
    return {
        "duration_us": int(round(float((data.get("format") or {}).get("duration", 0)) * 1_000_000)),
        "width": int(stream.get("width") or 1080),
        "height": int(stream.get("height") or 1920),
    }


def usable_template(doc: dict) -> bool:
    materials = doc.get("materials") or {}
    for track in doc.get("tracks") or []:
        if track.get("type") != "video" or not track.get("segments"):
            continue
        segment = track["segments"][0]
        material_id = segment.get("material_id")
        if any(item.get("id") == material_id for item in materials.get("videos") or []):
            return True
    return False


def find_capcut_template(root: Path) -> tuple[Path, dict, dict]:
    candidates: list[Path] = []
    if root.is_dir():
        candidates = sorted(
            root.glob("*/draft_info.json"),
            key=lambda path: path.stat().st_mtime,
            reverse=True,
        )
    for info_path in candidates:
        if info_path.parent.name.startswith("Codex_"):
            continue
        try:
            doc = read_json(info_path)
            meta = read_json(info_path.with_name("draft_meta_info.json"))
        except Exception:
            continue
        if usable_template(doc):
            return info_path.parent, doc, meta
    raise RuntimeError(f"No readable current-format CapCut draft template found under {root}")


def find_jianying_platform(root: Path) -> dict:
    candidates = sorted(
        root.glob("*/subdraft/draft_content.json") if root.is_dir() else [],
        key=lambda path: path.stat().st_mtime,
        reverse=True,
    )
    for path in candidates:
        try:
            doc = read_json(path)
        except Exception:
            continue
        for key in ("last_modified_platform", "platform"):
            platform = doc.get(key) or {}
            if platform.get("app_source") == "lv":
                return copy.deepcopy(platform)
    return {
        "os": "mac",
        "os_version": "",
        "app_id": 3704,
        "app_version": "",
        "app_source": "lv",
        "device_id": "",
        "hard_disk_id": "",
        "mac_address": "",
    }


def select_template_parts(doc: dict) -> tuple[dict, dict, dict[str, tuple[str, dict]]]:
    materials = doc["materials"]
    ref_lookup: dict[str, tuple[str, dict]] = {}
    for kind, values in materials.items():
        if not isinstance(values, list):
            continue
        for value in values:
            if isinstance(value, dict) and value.get("id"):
                ref_lookup[value["id"]] = (kind, value)

    for track in doc.get("tracks") or []:
        if track.get("type") != "video":
            continue
        for segment in track.get("segments") or []:
            material_id = segment.get("material_id")
            hit = ref_lookup.get(material_id)
            if hit and hit[0] == "videos":
                return track, segment, ref_lookup
    raise RuntimeError("Template has no usable video segment")


def trim_plan_segments(part: dict, canary_seconds: float) -> list[dict]:
    remaining_us = int(round(canary_seconds * 1_000_000)) if canary_seconds > 0 else 0
    selected: list[dict] = []
    for source in part.get("segments") or []:
        duration_us = int(source["source_duration_us"])
        if remaining_us:
            duration_us = min(duration_us, remaining_us)
        if duration_us <= 0:
            continue
        row = copy.deepcopy(source)
        row["source_duration_us"] = duration_us
        selected.append(row)
        if remaining_us:
            remaining_us -= duration_us
            if remaining_us <= 0:
                break
    if not selected:
        raise RuntimeError("No segments available for draft")
    return selected


def reset_keyframe_collections(value: object) -> object:
    if isinstance(value, dict):
        return {key: reset_keyframe_collections(item) for key, item in value.items()}
    if isinstance(value, list):
        return []
    return copy.deepcopy(value)


def build_document(template: dict, part: dict, platform: dict, canary_seconds: float,
                   mute_audio: bool = False) -> tuple[dict, list[dict]]:
    track_template, segment_template, ref_lookup = select_template_parts(template)
    source_segments = trim_plan_segments(part, canary_seconds)
    document = copy.deepcopy(template)
    document_id = uid()
    document["id"] = document_id
    document["name"] = part.get("draft_name") or "Codex draft"
    document["fps"] = 24.0
    document["canvas_config"] = {
        "ratio": "9:16",
        "width": 1080,
        "height": 1920,
        "background": None,
    }
    document["platform"] = copy.deepcopy(platform)
    document["last_modified_platform"] = copy.deepcopy(platform)
    if platform.get("app_source") == "lv":
        document["new_version"] = "181.0.0"
    document["relationships"] = []
    document["group_container"] = None
    document["time_marks"] = []
    document["keyframe_graph_list"] = []
    if isinstance(document.get("keyframes"), dict):
        document["keyframes"] = reset_keyframe_collections(document["keyframes"])

    for key, value in list((document.get("materials") or {}).items()):
        if isinstance(value, list):
            document["materials"][key] = []

    track = copy.deepcopy(track_template)
    track["id"] = uid()
    track["name"] = "画面"
    track["segments"] = []
    cursor_us = 0
    media_rows: list[dict] = []
    media_cache: dict[str, tuple[str, str, dict]] = {}

    for source in source_segments:
        media_path = Path(source["video_path"]).expanduser().resolve()
        if not media_path.is_file():
            raise RuntimeError(f"Source video missing: {media_path}")
        media_key = str(media_path)
        if media_key not in media_cache:
            probe = probe_video(media_path)
            material_id = uid()
            local_material_id = uid_lower()
            template_video = ref_lookup[segment_template["material_id"]][1]
            video = copy.deepcopy(template_video)
            video.update({
                "id": material_id,
                "path": media_key,
                "media_path": "",
                "duration": probe["duration_us"],
                "width": probe["width"],
                "height": probe["height"],
                "has_audio": True,
                "material_name": media_path.name,
                "local_material_id": local_material_id,
                "category_name": "local",
            })
            document["materials"]["videos"].append(video)
            media_cache[media_key] = (material_id, local_material_id, probe)
            media_rows.append({
                "path": media_key,
                "name": media_path.name,
                "local_material_id": local_material_id,
                **probe,
            })
        material_id, _, _ = media_cache[media_key]

        segment = copy.deepcopy(segment_template)
        segment["id"] = uid()
        segment["material_id"] = material_id
        segment["source_timerange"] = {
            "start": int(source["source_start_us"]),
            "duration": int(source["source_duration_us"]),
        }
        segment["target_timerange"] = {
            "start": cursor_us,
            "duration": int(source["source_duration_us"]),
        }
        segment["render_timerange"] = {"start": 0, "duration": 0}
        segment["speed"] = 1.0
        segment["volume"] = 0.0 if mute_audio else 1.0
        segment["last_nonzero_volume"] = 1.0
        segment["common_keyframes"] = []
        segment["keyframe_refs"] = []
        segment["extra_material_refs"] = []
        for old_ref in segment_template.get("extra_material_refs") or []:
            hit = ref_lookup.get(old_ref)
            if not hit:
                continue
            kind, ref_template = hit
            if kind == "videos":
                continue
            ref_value = copy.deepcopy(ref_template)
            ref_value["id"] = uid()
            document["materials"][kind].append(ref_value)
            segment["extra_material_refs"].append(ref_value["id"])
        track["segments"].append(segment)
        cursor_us += int(source["source_duration_us"])

    document["tracks"] = [track]
    document["duration"] = cursor_us
    return document, media_rows


def build_meta(template_meta: dict, draft_name: str, draft_dir: Path, draft_root: Path,
               duration_us: int, media_rows: list[dict]) -> dict:
    now_us = int(time.time() * 1_000_000)
    meta = copy.deepcopy(template_meta)
    meta.update({
        "draft_id": uid(),
        "draft_name": draft_name,
        "draft_fold_path": str(draft_dir),
        "draft_root_path": str(draft_root),
        "draft_cover": "draft_cover.jpg",
        "draft_is_invisible": False,
        "draft_need_rename_folder": False,
        "tm_draft_create": now_us,
        "tm_draft_modified": now_us,
        "tm_duration": duration_us,
        "draft_json_file": str(draft_dir / "draft_content.json"),
    })
    values = []
    for row in media_rows:
        values.append({
            "ai_group_type": "",
            "create_time": int(Path(row["path"]).stat().st_mtime),
            "duration": row["duration_us"],
            "enter_from": 0,
            "extra_info": row["name"],
            "file_Path": row["path"],
            "height": row["height"],
            "id": row["local_material_id"],
            "import_time": int(time.time()),
            "import_time_ms": now_us,
            "item_source": 1,
            "md5": "",
            "metetype": "video",
            "roughcut_time_range": {"duration": row["duration_us"], "start": 0},
            "sub_time_range": {"duration": -1, "start": -1},
            "type": 0,
            "width": row["width"],
        })
    meta["draft_materials"] = [
        {"type": 0, "value": values},
        {"type": 1, "value": []},
        {"type": 2, "value": []},
        {"type": 3, "value": []},
        {"type": 6, "value": []},
        {"type": 7, "value": []},
        {"type": 8, "value": []},
    ]
    meta["draft_materials_copied_info"] = []
    return meta


def generate_cover(document: dict, output_path: Path) -> None:
    segment = document["tracks"][0]["segments"][0]
    material_id = segment["material_id"]
    material = next(item for item in document["materials"]["videos"] if item["id"] == material_id)
    start_s = segment["source_timerange"]["start"] / 1_000_000.0
    ffmpeg = find_binary(
        "ffmpeg", ["/opt/homebrew/bin/ffmpeg", str(Path.home() / ".local/bin/ffmpeg")]
    )
    subprocess.run(
        [
            ffmpeg, "-hide_banner", "-loglevel", "error", "-y",
            "-ss", f"{start_s:.3f}", "-i", material["path"],
            "-frames:v", "1", "-vf", "scale=180:320:force_original_aspect_ratio=increase,crop=180:320",
            str(output_path),
        ],
        check=True,
    )


def write_draft_folder(draft_dir: Path, draft_root: Path, draft_name: str, document: dict,
                       template_meta: dict, media_rows: list[dict]) -> None:
    if draft_dir.exists():
        raise RuntimeError(f"Refusing to overwrite existing draft folder: {draft_dir}")
    draft_dir.mkdir(parents=True)
    duration_us = int(document["duration"])
    meta = build_meta(template_meta, draft_name, draft_dir, draft_root, duration_us, media_rows)
    write_json(draft_dir / "draft_info.json", document)
    write_json(draft_dir / "draft_info.json.bak", document)
    write_json(draft_dir / "draft_content.json", document)
    write_json(draft_dir / "template-2.tmp", document)
    write_json(draft_dir / "draft_meta_info.json", meta)
    write_json(draft_dir / "performance_opt_info.json", {
        "manual_cancle_precombine_segs": None,
        "need_auto_precombine_segs": None,
    })
    write_json(draft_dir / "draft_virtual_store.json", {
        "draft_materials": [],
        "draft_virtual_store": [
            {"type": 0, "value": [{
                "creation_time": 0, "display_name": "", "filter_type": 0, "id": "",
                "import_time": 0, "import_time_us": 0, "sort_sub_type": 0,
                "sort_type": 0, "subdraft_filter_type": 0,
            }]},
            {"type": 1, "value": [
                {"child_id": row["local_material_id"], "parent_id": ""} for row in media_rows
            ]},
            {"type": 2, "value": []},
        ],
    })
    attachment_common = {
        "commercial_music_category_ids": [], "pc_feature_flag": 0,
        "recognize_tasks": [], "safe_area_type": 0, "template_item_infos": [],
        "unlock_template_ids": [],
    }
    timeline_attachment = {
        "reference_lines_config": {
            "horizontal_lines": [], "is_lock": False, "is_visible": False, "vertical_lines": []
        },
        "safe_area_type": 0,
    }
    write_json(draft_dir / "attachment_pc_common.json", attachment_common)
    write_json(draft_dir / "common_attachment/attachment_pc_timeline.json", timeline_attachment)
    now_us = int(time.time() * 1_000_000)
    project_id = uid()
    timeline_id = document["id"]
    project = {
        "config": {"color_space": -1, "render_index_track_mode_on": False, "use_float_render": False},
        "create_time": now_us,
        "id": project_id,
        "main_timeline_id": timeline_id,
        "timelines": [{
            "create_time": now_us, "id": timeline_id, "is_marked_delete": False,
            "name": "时间线01", "update_time": now_us,
        }],
        "update_time": now_us,
        "version": 0,
    }
    write_json(draft_dir / "Timelines/project.json", project)
    write_json(draft_dir / "Timelines/project.json.bak", project)
    write_json(draft_dir / "timeline_layout.json", {
        "dockItems": [{
            "dockIndex": 0, "ratio": 1, "timelineIds": [timeline_id], "timelineNames": ["时间线01"]
        }],
        "layoutOrientation": 1,
    })
    write_json(draft_dir / "draft_agency_config.json", {
        "is_auto_agency_enabled": False, "is_auto_agency_popup": False,
        "is_single_agency_mode": False, "marterials": None,
        "use_converter": False, "video_resolution": 720,
    })
    write_json(draft_dir / "key_value.json", {})
    (draft_dir / "draft_biz_config.json").write_text("", encoding="utf-8")
    now_s = int(time.time())
    (draft_dir / "draft_settings").write_text(
        "[General]\n"
        f"draft_create_time={now_s}\n"
        f"draft_last_edit_time={now_s}\n"
        "real_edit_keys=0\nreal_edit_seconds=0\ntimeline_use_split_scene=true\n",
        encoding="utf-8",
        newline="\n",
    )
    cover_path = draft_dir / "draft_cover.jpg"
    generate_cover(document, cover_path)

    # Current CapCut/Jianying projects keep a second, identical copy of the
    # active timeline under Timelines/<timeline-id>. The home screen can read
    # only the root files, but the editor requires this directory to open it.
    timeline_dir = draft_dir / "Timelines" / timeline_id
    write_json(timeline_dir / "draft_info.json", document)
    write_json(timeline_dir / "draft_info.json.bak", document)
    write_json(timeline_dir / "template.tmp", document)
    write_json(timeline_dir / "template-2.tmp", document)
    write_json(timeline_dir / "attachment_pc_common.json", attachment_common)
    write_json(timeline_dir / "common_attachment/attachment_pc_timeline.json", timeline_attachment)
    shutil.copy2(cover_path, timeline_dir / "draft_cover.jpg")


def verify_draft(path: Path, expected_duration_us: int, expected_segments: int,
                 expected_muted: bool = False) -> dict:
    info = read_json(path / "draft_info.json")
    meta = read_json(path / "draft_meta_info.json")
    video_tracks = [track for track in info.get("tracks") or [] if track.get("type") == "video"]
    count = sum(len(track.get("segments") or []) for track in video_tracks)
    missing_sources = [
        item.get("path") for item in (info.get("materials") or {}).get("videos") or []
        if not Path(item.get("path") or "").is_file()
    ]
    if int(info.get("duration") or 0) != expected_duration_us:
        raise RuntimeError(f"Draft duration mismatch: {path}")
    if count != expected_segments:
        raise RuntimeError(f"Draft segment mismatch: {path}")
    if missing_sources:
        raise RuntimeError(f"Draft has missing source files: {missing_sources}")
    if meta.get("draft_name") != path.name:
        raise RuntimeError(f"Draft name mismatch: {path}")
    timeline_id = info.get("id")
    timeline_info = path / "Timelines" / str(timeline_id) / "draft_info.json"
    if not timeline_info.is_file() or read_json(timeline_info).get("id") != timeline_id:
        raise RuntimeError(f"Draft active timeline copy is missing: {path}")
    volumes = [
        float(segment.get("volume", 1.0))
        for track in video_tracks
        for segment in track.get("segments") or []
    ]
    if expected_muted and any(volume != 0.0 for volume in volumes):
        raise RuntimeError(f"Draft source audio was not muted: {path}")
    return {
        "path": str(path),
        "duration_s": round(expected_duration_us / 1_000_000.0, 3),
        "segments": count,
        "source_files": len((info.get("materials") or {}).get("videos") or []),
        "schema_version": info.get("version"),
        "new_version": info.get("new_version"),
        "platform": (info.get("platform") or {}).get("app_source"),
        "source_audio_muted": bool(volumes) and all(volume == 0.0 for volume in volumes),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Build editable CapCut/Jianying drafts from edit_plan.json.")
    parser.add_argument("--work-dir", required=True, help="Directory containing edit_plan.json.")
    parser.add_argument("--output-dir", required=True, help="Staging directory for generated drafts.")
    parser.add_argument("--part-id", type=int, default=1)
    parser.add_argument("--editor", choices=["both", "capcut", "jianying"], default="both")
    parser.add_argument("--draft-name", default="", help="Base draft name; editor suffix is added.")
    parser.add_argument("--canary-seconds", type=float, default=0.0)
    parser.add_argument("--mute-audio", action="store_true", help="Set every source-video segment volume to zero.")
    parser.add_argument("--capcut-root", default=str(CAPCUT_ROOT))
    parser.add_argument("--jianying-root", default=str(JIANYING_ROOT))
    args = parser.parse_args()

    work_dir = Path(args.work_dir).expanduser().resolve()
    output_dir = Path(args.output_dir).expanduser().resolve()
    capcut_root = Path(args.capcut_root).expanduser().resolve()
    jianying_root = Path(args.jianying_root).expanduser().resolve()
    plan = read_json(work_dir / "edit_plan.json")
    part = next((row for row in plan.get("parts") or [] if row.get("part_id") == args.part_id), None)
    if not part:
        raise SystemExit(f"Part {args.part_id} not found")

    template_dir, template, template_meta = find_capcut_template(capcut_root)
    base_name = args.draft_name.strip() or f"Codex_{part.get('draft_name', 'Highlight')}_Part{args.part_id}"
    editors = ["capcut", "jianying"] if args.editor == "both" else [args.editor]
    results = []
    for editor in editors:
        if editor == "capcut":
            platform = copy.deepcopy(template.get("platform") or {})
            draft_root = capcut_root
            suffix = "CapCut"
        else:
            platform = find_jianying_platform(jianying_root)
            draft_root = jianying_root
            suffix = "Jianying"
        document, media_rows = build_document(
            template, part, platform, args.canary_seconds, args.mute_audio
        )
        draft_name = f"{base_name}_{suffix}"
        draft_dir = output_dir / editor / draft_name
        write_draft_folder(draft_dir, draft_root, draft_name, document, template_meta, media_rows)
        segment_count = len(document["tracks"][0]["segments"])
        result = verify_draft(
            draft_dir, int(document["duration"]), segment_count, args.mute_audio
        )
        result["editor"] = editor
        result["template"] = str(template_dir)
        result["install_destination"] = str(draft_root / draft_name)
        results.append(result)

    manifest = output_dir / "editor_drafts_manifest.json"
    write_json(manifest, results)
    print(json.dumps(results, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
