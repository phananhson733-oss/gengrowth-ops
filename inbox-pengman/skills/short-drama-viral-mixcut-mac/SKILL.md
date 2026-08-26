---
name: short-drama-viral-mixcut-mac
description: Create three hook-led original-audio mixcuts from one local short drama on Apple Silicon Macs without requiring a viral reference video. Use when the user wants conflict-first, reveal-first, or consequence-first variants rendered as MP4 and optionally handed off as editable CapCut/Jianying drafts. Do not use for narration/TTS videos or for copying another video's exact structure.
---

# Short-drama hook mixcuts for Mac

Generate three distinct hook structures from the drama's own footage and local transcript. A viral reference video is optional background inspiration only and is never a required input.

## Runtime

Reuse `short-drama-highlight-mac` and its interpreter at `~/.codex/venvs/short-drama-highlight-mac/bin/python`. Local whisper.cpp, FFmpeg, direct MP4 rendering, and the verified CapCut/Jianying draft adapter remain the execution layer.

## Workflow

1. Inspect and locally transcribe the drama with `short-drama-highlight-mac`; reuse its cached `merged_data.json`.
2. Read the full transcript. Choose exactly three different variants by default:
   - conflict-first: an immediately understandable confrontation or stake;
   - reveal-first: a concrete betrayal, identity, money, or motive revelation;
   - consequence-first: show the cost or reversal first, then reconstruct why it happened.
3. Do not require or ask for a viral reference video. Do not invent dialogue, reorder cause and effect into a false story, or make three variants from the same opening sentence.
4. Read [references/viral-variants-schema.md](references/viral-variants-schema.md), write `viral_variants.json`, and compile it with `scripts/compile_viral_variants.py`. Default count is three, never 100.
5. Render Part 1 as a direct MP4 canary through `short-drama-highlight-mac/scripts/render_mp4.py`. Prefer 20–60 seconds for full daily outputs unless context requires more.
6. After the MP4 canary passes, optionally generate 5-second CapCut and Jianying draft canaries. Only then generate the remaining two full MP4s and requested full drafts.

## Commands

```bash
~/.codex/venvs/short-drama-highlight-mac/bin/python scripts/compile_viral_variants.py \
  --variants /absolute/path/to/viral_variants.json \
  --output-dir /absolute/path/to/work
```

Then render from the generated `edit_plan.json` with the installed `short-drama-highlight-mac` scripts. Use `--expected-count` only when the user explicitly requests a different number.

## Boundaries

- No reference-video gate, no viral-video ASR, and no fuzzy matching against another creator's opening.
- Default per-drama total is three outputs.
- Optimize for editorially different stories, not superficial fingerprint manipulation. Never promise platform deduplication or acceptance.
- Preserve original source files and original audio. Do not publish or auto-export from an editor.
