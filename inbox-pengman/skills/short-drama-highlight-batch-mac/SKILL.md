---
name: short-drama-highlight-batch-mac
description: Prepare and run multiple short-drama folders as sequential Mac highlight jobs, producing three distinct original-audio videos per drama by default with MP4 plus optional editable CapCut and Jianying drafts. Use for daily multi-drama batch intake on Apple Silicon. Do not use for narration-led videos or unattended mass export before each drama's canary passes.
---

# Short-drama highlight batch for Mac

Turn a parent folder of drama subfolders into an auditable queue. Default to exactly three different highlight videos per drama. Process dramas sequentially so one failed project cannot contaminate the rest.

## Runtime

This skill intentionally reuses the installed `short-drama-highlight-mac` workflow and its dedicated interpreter:

`~/.codex/venvs/short-drama-highlight-mac/bin/python`

Run that skill's `scripts/doctor.py` before the first job. Local whisper.cpp transcription is the default; do not require Doubao credentials. FFmpeg uses VideoToolbox when available. CapCut and Jianying drafts are optional handoffs after an MP4 canary passes.

## Workflow

1. Stage the queue with `scripts/prepare_batch.py`. A drama is one folder containing episode videos. Do not modify source folders.
2. Read `batch_jobs.json` completely. Confirm the discovered drama names, episode counts, and the default `outputs_per_drama: 3` before transcription.
3. Process only the first `ready` drama with `short-drama-highlight-mac`: inspect, transcribe locally, merge transcripts, choose three genuinely different conflict arcs, and build `edit_plan.json`.
4. Prefer 45–90 seconds per output for daily throughput unless the story needs more context. Do not create three near-duplicate hooks from one scene.
5. Render Part 1 as an MP4 canary. Verify duration, 1080×1920 H.264/AAC, original audio, joins, and narrative continuity.
6. If editable projects were requested, generate and open 5-second CapCut and Jianying canary drafts. Only after the requested canaries pass may you render Parts 2–3 and make full editable drafts.
7. Mark the job complete in the working manifest and continue to the next drama. Stop the queue at the first failed gate and report the exact drama and gate.

## Command

```bash
~/.codex/venvs/short-drama-highlight-mac/bin/python scripts/prepare_batch.py \
  --input-root "/absolute/path/to/dramas" \
  --output-root "/absolute/path/to/batch-work"
```

For a one-folder test, pass `--drama-dir` instead of `--input-root`. Use `--outputs-per-drama` only when the user explicitly requests a different count.

## Boundaries

- Default output count is three per drama, never 100.
- Keep source videos unchanged and keep all generated data outside source folders.
- A queue manifest is preparation evidence, not proof that videos were rendered.
- Do not publish, upload, auto-export from an editor, or claim platform acceptance.
- Keep direct MP4 output as the stable fallback even when both editor drafts pass.
