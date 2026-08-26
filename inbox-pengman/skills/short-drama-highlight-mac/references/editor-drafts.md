# Editable CapCut and Jianying drafts

Use this path only after `edit_plan.json` exists and the direct MP4 canary has passed. The draft generator preserves every planned cut as a separate video segment and uses the source video's embedded original audio.

## Gate 1: stage an isolated 5-second canary

Use a unique name for every attempt:

```bash
~/.codex/venvs/short-drama-highlight-mac/bin/python scripts/build_editor_drafts.py \
  --work-dir /absolute/path/to/asr_work \
  --output-dir /absolute/path/to/editor-canary \
  --part-id 1 \
  --editor both \
  --canary-seconds 5 \
  --draft-name Codex_Canary_Project_YYYYMMDD_HHMMSS
```

The script stages one CapCut folder and one Jianying folder. It refuses to overwrite a destination. Do not copy either folder into an editor library until all of these checks pass:

- `draft_info.json`, `draft_content.json`, `draft_meta_info.json`, and `draft_cover.jpg` exist.
- `Timelines/project.json` points to an existing `Timelines/<timeline-id>/draft_info.json` copy. The editor may list a project without this copy but refuse to open it.
- The timeline duration is exactly 5,000,000 microseconds.
- The sum of segment target durations is exactly 5,000,000 microseconds.
- Every material path is absolute and points to a readable source file.
- The CapCut platform source is `cc`; the Jianying platform source is `lv`.
- The manifest reports the expected number of separate segments.

## Silent visual drafts

For a BGM-ready visual montage, add `--mute-audio`. This sets every source-video segment's volume to zero while keeping every clip independently editable:

```bash
~/.codex/venvs/short-drama-highlight-mac/bin/python scripts/build_editor_drafts.py \
  --work-dir /absolute/path/to/visual-work \
  --output-dir /absolute/path/to/editor-canary \
  --part-id 1 --editor both --canary-seconds 5 --mute-audio \
  --draft-name Codex_SilentVisual_Canary
```

The staged manifest must report `source_audio_muted: true` for each editor. Open the canary in each application and confirm that the timeline remains made of separate clips and playback is silent before generating full silent drafts.

## Gate 2: install without overwriting

Default macOS libraries:

- CapCut: `~/Movies/CapCut/User Data/Projects/com.lveditor.draft`
- JianyingPro: `~/Movies/JianyingPro/User Data/Projects/com.lveditor.draft`

Before copying, resolve the exact destination and confirm that it does not exist. Copy the whole staged folder as a new child of the matching library. Never replace or edit another project folder.

## Gate 3: verify in each application

Open CapCut and Jianying separately. For each canary, verify:

1. The project card is visible with the requested name and a 5-second duration.
2. The project opens without a conversion, corruption, or missing-media warning.
3. The timeline contains separate adjacent clips, not one flattened MP4.
4. Each clip can be selected and trimmed independently.
5. Preview playback has the source's original audio.

Do not export or publish during the canary. If one editor fails, keep the direct MP4 and the other verified draft as fallbacks, report the failed gate, and stop that editor's batch generation.

## Current format caveat

Build from the newest readable local CapCut project so material and segment shapes match the installed application. Replace platform metadata with the newest readable Jianying subdraft metadata for the Jianying variant. Current Jianying releases may encrypt their main `draft_info.json` after opening a project; readable `subdraft/draft_content.json` can still supply platform metadata, but this does not prove a generated project is accepted. Only the application canary is acceptance evidence.

After either application upgrades, repeat both canaries before generating full projects.

Verified on this Mac on 2026-08-24: CapCut 8.9.1 and JianyingPro 11.2.0 both listed and opened a 5-second, two-segment, original-audio canary. Jianying encrypted the root draft files on quit and successfully reopened the encrypted project. Treat this as version-specific evidence, not a guarantee for later releases.

## Full drafts

After the direct MP4 and requested editor canaries pass, omit `--canary-seconds` and generate each planned part with a new unique name. Keep the direct MP4 beside the editable projects as the stable preview and recovery output.
