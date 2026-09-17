# Account-aware CapCut delivery

Use this mode only when the user asks for a CapCut ending preset, identifies a publishing account, or approves a preview → rewind Hook structure. It modifies only a newly staged CapCut draft; never mutate an existing installed project.

## Resolve the account and preset

Read `capcut-delivery-profiles.json` at the start of the delivery step. Account matching is case-insensitive.

- Use the configured `ending_preset` for a listed account.
- An explicitly named preset overrides the account mapping for that task.
- If the account is unlisted and no preset is named, ask once before generating full drafts. Do not reuse the previous task's account or preset.
- Keep the profile file as data. Add or change account mappings there instead of hard-coding them in scripts or general instructions.

## Hook and transition behavior

- Continuous chronological Hook: no transition.
- Approved preview → rewind Hook: the Hook may be one or more adjacent clips. Place the transition after the last Hook clip and before the rewind. Replay the Hook later at its chronological position and preserve the complete dialogue exchange.
- The configured default rewind transition is a preference, not permission. Use it only when the user approved the rewind structure or explicitly requested the transition.
- Hook captions are recommendations by default. Report the exact video, timestamp, and suggested English sentence; do not create a text track unless the user asks.

## Apply the delivery package

First generate a new isolated CapCut draft with `build_editor_drafts.py`. Then run:

```bash
~/.codex/venvs/short-drama-highlight-mac/bin/python scripts/apply_capcut_delivery.py \
  --draft-dir /absolute/path/to/staged/capcut/draft \
  --account jolienqaq
```

For an approved preview → rewind Hook ending after the second timeline clip:

```bash
~/.codex/venvs/short-drama-highlight-mac/bin/python scripts/apply_capcut_delivery.py \
  --draft-dir /absolute/path/to/staged/capcut/draft \
  --account dramaexpedition \
  --transition-after-segment 2
```

The transition index is one-based and counts complete source clips. Use `--preset-name` for a task-specific override. Use `--install-destination` when the final CapCut project folder name differs from the staged folder name.

The script resolves CapCut preset placeholders to the local combination-resource root, assigns fresh identifiers, appends the compound preset as an editable final clip, creates its nested subdraft, updates all active timeline mirrors, and refuses to overwrite an existing installed destination.

## Validation gates

Before installation, confirm that:

1. No unresolved `##_presetpath_placeholder_..._##` strings remain.
2. Every local media, effect, font, and preset resource path exists.
3. The selected preset is the final main-track segment and the total duration includes it exactly once.
4. A requested rewind transition is attached after the intended complete Hook unit and has the expected name and duration.
5. Source clips remain independently editable and retain volume `1.0` unless the user requested silence.
6. The nested preset subdraft files exist and their paths point to the final installation destination.
7. After installation, open the draft in CapCut and visually verify the Hook, transition, ending preset picture/text, total duration, and absence of missing-media warnings.

Do not call the editable draft an exported video. Direct MP4 output remains a separate deliverable and does not automatically contain this CapCut-only transition or ending preset.
