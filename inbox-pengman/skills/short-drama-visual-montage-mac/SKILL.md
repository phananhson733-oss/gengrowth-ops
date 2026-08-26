---
name: short-drama-visual-montage-mac
description: Create three silent, subtitle-free, cinematic visual montages from local short-drama episodes on Apple Silicon Macs. Use for BGM-ready character, couple, mood, or trailer edits with direct MP4 output and optional muted CapCut/Jianying drafts. Do not use when dialogue, narration, or automatic editor export is required.
---

# Short-drama silent visual montage for Mac

Create BGM-ready visual edits from an authorized drama. The default is exactly three different 15–45 second vertical videos: no source dialogue, no narration, no burned captions, and no BGM.

## Runtime

Use FFmpeg and FFprobe locally. This skill reuses the current `short-drama-highlight-mac` draft adapter at:

`~/.codex/skills/short-drama-highlight-mac/scripts/build_editor_drafts.py`

For visual selection, use the installed `video-analysis` workflow to sample frames from the drama. Do not rank scenes only from dialogue transcripts: inspect frames before calling a shot visually strong.

## Workflow

1. Inspect the drama folder and keep all work outside the source folder. Sample frames at 2–4 second intervals with `video-analysis`; sample more densely around promising scenes.
2. Read [references/visual-montage-plan.md](references/visual-montage-plan.md), then create `visual_montage.json` with exactly three editorially distinct cuts by default. Choose visual hooks, not spoken hooks.
3. Select only observable strong shots: clear face or action, readable framing after 9:16 crop, deliberate movement, emotional reaction, wardrobe, lighting, scenery, or relationship chemistry. Reject black frames, text-heavy shots, obvious lip-sync dialogue, duplicate angles, and unmotivated filler.
4. Compile the plan with `scripts/compile_visual_montage.py`. The compiler writes a silent `edit_plan.json`; all segment audio volumes are zero.
5. Render Part 1 only with `scripts/render_silent_montage.py`. It produces an H.264 1080×1920 MP4 with no audio stream.
6. Check the canary visually: no black joins, clean crop, no abrupt partial action, clear first frame, visual variety, and the intended mood without dialogue. Then render Parts 2–3.
7. When requested, stage optional 5-second CapCut and Jianying drafts using the shared draft adapter with `--mute-audio`. Verify the staged JSON records `source_audio_muted: true`; only then copy a unique draft folder into an editor library and check it in the app.

## Commands

```bash
~/.codex/venvs/short-drama-highlight-mac/bin/python scripts/compile_visual_montage.py \
  --plan /absolute/path/to/visual_montage.json \
  --output-dir /absolute/path/to/work

~/.codex/venvs/short-drama-highlight-mac/bin/python scripts/render_silent_montage.py \
  --work-dir /absolute/path/to/work \
  --output-dir /absolute/path/to/mp4 \
  --part-id 1
```

For editable drafts after the MP4 canary passes:

```bash
~/.codex/venvs/short-drama-highlight-mac/bin/python \
  ~/.codex/skills/short-drama-highlight-mac/scripts/build_editor_drafts.py \
  --work-dir /absolute/path/to/work \
  --output-dir /absolute/path/to/editor-canary \
  --part-id 1 --editor both --canary-seconds 5 --mute-audio \
  --draft-name Codex_VisualMontage_Canary
```

## Boundaries

- Default is three outputs per drama, never 100.
- Silent means no audio stream in MP4 and zero source-video volume in editor drafts. Do not add BGM, narration, dialogue, or captions unless the user explicitly changes the mode.
- A visually pleasing montage requires frame inspection and human canary review; do not claim aesthetic judgment from a transcript alone.
- Preserve source files. Do not auto-install drafts, auto-export from an editor, upload, publish, or claim rights/platform acceptance.
- Editor drafts are an optional, human-checkable handoff. Keep the silent MP4 as the stable delivery.
