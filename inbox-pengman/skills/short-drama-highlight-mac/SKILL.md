---
name: short-drama-highlight-mac
description: Create 2–3 short, original-audio highlight mixcuts from a folder of short-drama episodes on Apple Silicon Macs, with direct MP4 output and optional editable CapCut plus Jianying drafts. Use for Mac-based short-drama clipping, local transcription, hook/backbone/ending planning, MP4 canaries, and dual-editor draft handoff. Do not use for narration/TTS videos or mass production before a canary passes.
---

# Short-drama highlight mixcuts for Mac

Turn one authorized short-drama folder into 2–3 original-audio highlight videos. Default to 60–150 seconds per output. Work one drama at a time until the canary gates pass.

## Runtime

Use the dedicated interpreter when it exists:

`~/.codex/venvs/short-drama-highlight-mac/bin/python`

Run `scripts/doctor.py` before the first production run. The workflow requires Apple Silicon, Python 3.10+, FFmpeg, FFprobe, `whisper-cli`, and a local whisper.cpp model. Local transcription does not require an ASR API key. The installed default model is `~/.codex/models/whisper/ggml-base.en.bin`.

## Workflow

1. Inspect the source folder. Report episode count, total duration, frame size, frame rate, codecs, and available disk. Do not modify source files.
2. Create a work directory outside the source folder. Run `scripts/transcribe_local.py`; reuse successful episode caches.
3. Run `scripts/merge_transcripts.py` and read `merged_data.json` completely.
4. Read [references/story-analysis-schema.md](references/story-analysis-schema.md), then write `story_analysis.json`. Choose 2–3 genuinely different conflict arcs. Keep each planned output between 60 and 150 seconds unless the user requests another range.
5. Run `scripts/build_edit_plan.py`. Review printed durations and reject empty, out-of-range, overlapping, or contextless plans.
6. Render one part first with `scripts/render_mp4.py --part-id 1`. Use Apple VideoToolbox when available.
7. Verify the actual MP4: readable file, duration within tolerance, vertical 1080×1920, H.264/AAC, audible original sound, no black frames at joins, no cut-off lines, coherent scene order, and no repeated recap.
8. When the user wants an adjustable project, read [references/editor-drafts.md](references/editor-drafts.md). Generate isolated 5-second CapCut and Jianying canary drafts with `scripts/build_editor_drafts.py`; validate their files before installing them into either application's draft library.
9. Open each editor and verify that its canary appears, opens, has separate editable clips, lasts 5 seconds, and retains source audio. Only after the MP4 and requested editor canaries pass may you render or generate the remaining parts.

## Output and safety boundaries

- Keep raw source episodes unchanged.
- Keep ASR and planning data in the chosen work directory so it can be audited and reused.
- Write final MP4s to a user-approved output directory. Do not publish or update release status.
- Treat editable drafts as an optional handoff in addition to the verified MP4, not as an export replacement. Never claim automated export from CapCut or Jianying.
- Never overwrite an existing editor project. Use a unique draft name, stage outside the application library, validate, and install only the new folder.
- Derive draft structure from a readable, current local project. CapCut and Jianying formats can change by application version; re-run a canary after either application updates.
- Do not claim a clip is original, authorized, compliant, or platform-safe based on transforms alone. Confirm source rights and any episode limits separately.
- Stop after a failed canary. Report the exact failed gate instead of generating a batch.
- For narration/TTS work, use a separate narration workflow after this original-audio pipeline is stable.
