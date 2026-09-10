---
name: short-drama-highlight-mac
description: Create 2–3 original-audio short-drama edits on Apple Silicon Macs, from short Hook cuts to longer conflict compilations or full-episode sequences, with direct MP4 output and optional editable CapCut plus Jianying drafts. Use for local transcription, story-unit selection, dialogue-safe cutting, account-aware CapCut endings, MP4 canaries, and dual-editor handoff. Do not use for narration/TTS videos or mass production before a canary passes.
---

# Short-drama highlight mixcuts for Mac

Turn one short-drama folder into 2–3 original-audio highlight videos. Work one drama at a time until the canary gates pass. Choose duration from the story unit instead of trimming dialogue to fit a fixed runtime: short Hook cuts, longer conflict scenes, 2–5 minute compilations, and full-episode sequences are all valid when requested.

## House editing contract

- Edit source picture and source audio only by default. Do not add BGM, sound effects, narration, title cards, captions, subtitles, stickers, or any other text/graphic overlay unless the user explicitly requests an editor preset or overlay. A named account ending preset is a scoped exception for the editable CapCut delivery only; it does not authorize other embellishments.
- Keep dialogue exchanges complete. Never start after a speaker has begun, cut before a sentence or reply finishes, or join two clips so a question loses its answer. Extend the range or remove the whole exchange instead.
- Place cuts at verified utterance, reaction, action, or scene boundaries. Do not cut merely to hit a target duration.
- A Hook should come from an existing conflict, reveal, consequence, intimate action, humiliation, or identity beat in the footage. When the material supports it, establish that conflict within the first 0–6 seconds without inventing context or using added text.
- Preserve truthful cause and effect. A cold-open preview may rewind only when the user approves it and the later payoff retains the complete dialogue.
- For a continuous opening taken from its chronological source position, do not add a transition. For an approved preview → rewind opening, place the requested transition after the complete Hook unit, then replay that Hook naturally at its chronological position with its full exchange.
- If the picture alone needs context, propose one short English Hook caption and identify the exact part and time where it belongs. Treat it as a sidecar recommendation; do not insert it unless the user explicitly asks.

## Runtime

Use the dedicated interpreter when it exists:

`~/.codex/venvs/short-drama-highlight-mac/bin/python`

Run `scripts/doctor.py` before the first production run. The workflow requires Apple Silicon, Python 3.10+, FFmpeg, FFprobe, `whisper-cli`, and a local whisper.cpp model. Local transcription does not require an ASR API key. The installed default model is `~/.codex/models/whisper/ggml-base.en.bin`.

## Workflow

1. Inspect the source folder. Report episode count, total duration, frame size, frame rate, codecs, and available disk. Do not modify source files.
2. Create a work directory outside the source folder. Run `scripts/transcribe_local.py`; reuse successful episode caches.
3. Run `scripts/merge_transcripts.py` and read `merged_data.json` completely.
4. Read [references/story-analysis-schema.md](references/story-analysis-schema.md), then propose 2–3 genuinely different storylines in the conversation. For each proposal, state the conflict, footage-based cold-open Hook, chronological beginning → escalation → ending beats, source episodes/timestamp ranges, estimated duration class, and why a new viewer can follow it without added explanatory text. Flag any deliberate time jump and the context in the source footage that makes it understandable.
5. Stop for explicit human confirmation. Do not write `story_analysis.json`, build an edit plan, render MP4s, or generate editor drafts until the user selects or approves the proposed storylines. If the user gives feedback, revise the text-only proposals and return to this gate; never infer approval from silence.
6. After approval, write `story_analysis.json` for only the approved storylines, then run `scripts/build_edit_plan.py`. Set `--min-duration` and `--max-duration` to the approved duration class instead of forcing every output into the default range. Review printed durations and reject empty, accidentally repetitive, contextless, or dialogue-breaking plans. By default, the Hook, context, backbone, and ending use disjoint source ranges. If the user explicitly approves a preview → rewind → payoff structure, the same Hook may appear again later at its chronological story position; treat that as deliberate narrative repetition, preserve the full dialogue at the payoff, and count both occurrences in the final duration.
7. Render one part first with `scripts/render_mp4.py --part-id 1`. Use Apple VideoToolbox when available.
8. Verify the actual MP4: readable file, duration within tolerance, vertical 1080×1920, H.264/AAC, audible original sound, no added audio or visible text/graphics, no black frames at joins, no cut-off lines or replies, coherent scene order, and no accidental repeated recap. Listen across every join; visual inspection alone cannot prove dialogue continuity. An explicitly approved cold-open Hook replayed later as the chronological payoff is allowed.
9. When the user wants an adjustable project, read [references/editor-drafts.md](references/editor-drafts.md). If an account-specific CapCut ending or rewind transition is requested, also read [references/capcut-delivery.md](references/capcut-delivery.md) and resolve the account through `references/capcut-delivery-profiles.json`. Generate isolated 5-second CapCut and Jianying canary drafts with `scripts/build_editor_drafts.py`; validate their files before installing them into either application's draft library.
10. Open each editor and verify that its canary appears, opens, has separate editable clips, lasts 5 seconds, and retains source audio. Only after the MP4 and requested editor canaries pass may you render or generate the remaining parts.

## Output and safety boundaries

- Keep raw source episodes unchanged.
- Keep ASR and planning data in the chosen work directory so it can be audited and reused.
- ASR text remains planning evidence in the work directory only. Production `edit_plan.json` must keep `subtitles: []`, and neither MP4 rendering nor editor-draft handoff may create a visible text track.
- Do not silently reuse the previous task's account or ending preset. Use the account named for the current delivery; if it is not listed in the profile configuration and the user has not named a preset, ask once before generating full CapCut drafts.
- Write final MP4s to a user-approved output directory. Do not publish or update release status.
- Treat editable drafts as an optional handoff in addition to the verified MP4, not as an export replacement. Never claim automated export from CapCut or Jianying.
- Never overwrite an existing editor project. Use a unique draft name, stage outside the application library, validate, and install only the new folder.
- Derive draft structure from a readable, current local project. CapCut and Jianying formats can change by application version; re-run a canary after either application updates.
- Stop after a failed canary. Report the exact failed gate instead of generating a batch.
- For narration/TTS work, use a separate narration workflow after this original-audio pipeline is stable.
