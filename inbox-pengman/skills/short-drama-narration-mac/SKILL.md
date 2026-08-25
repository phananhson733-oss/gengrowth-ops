---
name: short-drama-narration-mac
description: Create three English narration-led short-drama mixcuts per drama on Apple Silicon Macs using explicit shot plans, offline native English macOS TTS, optional low-level source dialogue, FFmpeg, and burned English captions. Use for overseas-facing third-person commentary or recap videos. Do not use when original dialogue should remain the main audio or when cloud voice credentials are required without user approval.
---

# Short-drama narration mixcuts for Mac

Create three genuinely different narrated story angles from one authorized drama. The minimum local version renders MP4 directly and needs no ASR or TTS API key after the source transcript is available.

## Runtime

Use `~/.codex/venvs/short-drama-highlight-mac/bin/python`. Required local tools are FFmpeg, FFprobe, and macOS `say`. Default voice is the offline US English voice `Samantha` at rate 190. Keep the drama's English dialogue quietly underneath at volume 0.18 by default; use `--source-audio-volume 0` when the scene audio conflicts with narration. A user-supplied narration audio workflow may replace local TTS later.

When Codex runs inside its filesystem sandbox, macOS Speech may create a header-only AIFF. Ask for approval to run the local render command outside the sandbox at the TTS step; this sends no text to a cloud service.

## Workflow

1. Reuse the local transcript from `short-drama-highlight-mac`, or transcribe once when it does not exist.
2. Read [references/narration-plan.md](references/narration-plan.md), then write one `narration_plan.json` containing exactly three different output angles by default. Narration and captions must be natural American English for overseas viewers, not literal Chinese-to-English phrasing.
3. Each narration sentence must point to a source video, start time, and visual duration. Use observable matching pictures; do not pair a sentence about one character with an unrelated reaction shot.
4. Keep each default output around 45–75 seconds. Write continuous third-person English narration with a strong first sentence, not forced dialogue. Read it aloud at the target voice rate and shorten any line that does not fit its visual window.
5. Render only the first output with `scripts/render_local_narration.py --output-id ... --canary-seconds 5`.
6. Verify the MP4: 1080×1920 H.264/AAC, local narration audible, captions readable, no missing media, no black frame, and visual/narration match. Only then render the full first output and the remaining two.

## Command

```bash
~/.codex/venvs/short-drama-highlight-mac/bin/python scripts/render_local_narration.py \
  --plan /absolute/path/to/narration_plan.json \
  --output-id narration-1 \
  --output-dir /absolute/path/to/output \
  --canary-seconds 5
```

Omit `--canary-seconds` only after the canary passes. Use `--voice Samantha --rate 190` unless the user chooses another installed English macOS voice. Use `--source-audio-volume 0.18` to retain quiet original dialogue or `0` to mute it.

## Boundaries

- Three outputs per drama is the default; do not silently expand to 100.
- This minimum Mac version produces verified MP4, not a fake claim of an editable editor draft. Add CapCut/Jianying narration timelines only after a separate current-version draft canary passes.
- Local macOS TTS is the no-key baseline, not a promise of studio-grade human performance. Ask before sending scripts to a paid cloud voice model.
- Never read credentials from the ZIP's bundled configs or require cloud TTS by default.
- Do not publish, upload, or claim rights/compliance from editing transformations alone.
