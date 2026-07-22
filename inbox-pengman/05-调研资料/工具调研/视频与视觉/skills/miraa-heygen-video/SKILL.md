---
name: miraa-heygen-video
description: Safely preflight and generate Mira vertical AI-host videos from a confirmed script with the HeyGen v3 Avatar API. Use for Mira/AstrologyWiki HeyGen production when a specific avatar Look and voice must be selected, cost must be estimated and approved before generation, the raw MP4 must be downloaded, and technical metadata/QC must be recorded. V1 intentionally excludes subtitle generation, editing, publishing, and automatic content-stage changes.
---

# Mira HeyGen Video

Generate one raw Mira talking-head MP4 through HeyGen Avatar IV while preserving four gates: confirmed script, verified configuration, explicit cost approval, and human review.

## Fixed scope

This V1 performs:

1. preflight authentication, Look, engine, script, estimated duration, estimated cost, wallet, and local QC tooling;
2. paid generation only after explicit user confirmation;
3. job polling and raw MP4 download;
4. sanitized run metadata, timing, actual-duration cost, wallet-difference cost, and basic media QC;
5. handoff at `production_pending_human_review`.

This V1 does **not** create captions, burn subtitles, edit the script, add B-roll, publish, or change a formal content record to `edited` or `published`.

## Required workflow

### 1. Confirm the content input

Require a readable final script file and a `content_id`. Inspect the canonical content record when available and confirm the script is approved. Do not silently rewrite the script. If confirmation evidence is missing, stop and ask for script approval.

Read `references/miraa-defaults.json` for the current Mira production defaults. Read `references/heygen-api.md` before changing API fields or billing assumptions.

### 2. Run free preflight

Run:

```bash
python3 scripts/generate_miraa_video.py preflight \
  --script "/absolute/path/script.txt" \
  --content-id "CONTENT_ID"
```

Preflight must not call `POST /v3/videos`. It may make read-only API calls. Never ask the user to paste the API key into chat, print it, or save it in the project. Resolve `HEYGEN_API_KEY` first; on Pengman's Mac the script may fall back to the Keychain service defined in the defaults.

### 3. Present the production card

Report, in plain language:

- `content_id`, word count, and script SHA-256 prefix;
- selected Look ID, voice ID, engine, speed, resolution, and aspect ratio;
- estimated duration, base cost, conservative cost ceiling, wallet balance, and `--max-cost-usd`;
- any blocking warning.

The estimate is not an invoice. HeyGen bills successful output by actual duration.

### 4. Obtain paid-action confirmation

Immediately before paid generation, ask the user to explicitly confirm the displayed configuration and conservative cost ceiling. A CLI flag is a technical guard, not evidence of user authorization. Do not reuse a confirmation given before the latest estimate or after changing Look, voice, speed, engine, resolution, script, or cost ceiling.

### 5. Generate and resume safely

After confirmation, run:

```bash
python3 scripts/generate_miraa_video.py generate \
  --script "/absolute/path/script.txt" \
  --content-id "CONTENT_ID" \
  --output-dir "/absolute/path/output-run" \
  --confirmed-script \
  --confirm-paid-generation
```

Use one output directory per run. The script stores a `video_id` state and resumes polling instead of submitting a second paid job when rerun in the same directory.

### 6. Review outputs

Expect:

- `miraa-heygen-raw.mp4`
- `script.txt`
- `run-state.json`（用于安全续跑，避免重复提交）
- `run-metadata.json`
- `request-sanitized.json`
- `submission.json`
- `status-log.jsonl`
- `result-sanitized.json`
- `qc-report.json`

Read `references/qc.md`, inspect the QC report, and ask for full human playback. Report the production state as `production_pending_human_review` until a human checks lip sync, pronunciation, facial identity, eyes, teeth, hands/body motion, framing, audio, and the complete script.

## Change Look or voice

Use per-run overrides for tests; change the defaults only after a successful paid canary and human approval.

```bash
# Different existing Look
python3 scripts/generate_miraa_video.py preflight \
  --script "/absolute/path/script.txt" \
  --content-id "CONTENT_ID" \
  --avatar-id "NEW_LOOK_ID"

# Different voice or delivery
python3 scripts/generate_miraa_video.py preflight \
  --script "/absolute/path/script.txt" \
  --content-id "CONTENT_ID" \
  --voice-id "NEW_VOICE_ID" \
  --speed 1.05 \
  --pitch 0 \
  --volume 1
```

A Look ID, not the avatar group ID, is the `avatar_id` sent to video generation. For any new Look, voice, speed, expressiveness, or motion setting, use an 8–12 second canary first and re-run cost approval. Do not assume `speed: 1` reproduces a prior web-editor video.

## Batch boundary

HeyGen supports concurrent jobs, but this V1 script intentionally generates one video per invocation. Batch orchestration can call it repeatedly only when each script is confirmed, each item has a cost ceiling, aggregate wallet exposure is calculated, and the user explicitly approves the batch total. Never auto-publish batch output.

## References

- `references/miraa-defaults.json`: current IDs, output settings, pricing rate, and local key lookup.
- `references/heygen-api.md`: endpoints, identity rules, pricing, and safe-change guidance.
- `references/qc.md`: technical and human review checklist.
