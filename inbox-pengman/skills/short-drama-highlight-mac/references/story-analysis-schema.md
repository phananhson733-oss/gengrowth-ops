# Story analysis schema

Read `merged_data.json` before proposing any cut. First present the candidate storylines in the conversation and wait for explicit human approval. Write `story_analysis.json` only for approved candidates. Use 2 or 3 parts by default. Duration follows the approved story unit; 15–40 second Hook cuts, 45–120 second conflict scenes, 2–5 minute compilations, and full-episode sequences are valid. Never shorten a complete dialogue exchange merely to satisfy a duration target.

```json
{
  "drama_title": "Drama title",
  "part_count": 2,
  "parts": [
    {
      "part_id": 1,
      "title": "Short descriptive title",
      "summary": "What conflict this cut follows",
      "hook": {
        "episode": 2,
        "start_s": 10.0,
        "end_s": 16.0,
        "reason": "Cold-open conflict"
      },
      "context_clips": [],
      "keep_ranges_by_episode": {
        "1": [
          {"start_s": 5.0, "end_s": 30.0, "reason": "Setup and first escalation"}
        ],
        "2": [
          {"start_s": 35.0, "end_s": 75.0, "reason": "Core confrontation"}
        ]
      },
      "ending": {
        "episode": 3,
        "start_s": 40.0,
        "end_s": 48.0,
        "reason": "Cut on an unresolved reveal"
      }
    }
  ]
}
```

## Invariants

- Every timestamp must be supported by the ASR segment text for that episode.
- Keep ranges in story order. Do not repeat recaps or the same event from two episodes.
- The Hook, every context clip, every keep range, and the ending should be disjoint by default so scenes are not replayed accidentally. Exception: when the user explicitly approves a preview → rewind → payoff structure, the Hook may be repeated later at its chronological story position. Record that intention in the Hook and range reasons, preserve the complete dialogue in the payoff, and include both occurrences in the duration estimate.
- Each proposed and approved part must be understandable as one conflict arc: enough setup to identify the people and stakes, a linked escalation, then an unresolved consequence. Do not jump into a confrontation or reveal unless the preceding selected beat supplies the missing cause.
- Every dialogue range must begin before the first selected speaker starts and end after the selected sentence and necessary reply finish. If the exchange cannot fit, remove the complete exchange; never keep a sentence fragment.
- Preserve brief reaction beats when removing them would make the exchange feel cut off. Prefer a natural pause, completed action, or scene boundary for each join.
- The Hook normally uses 3–8 seconds of existing conflict, reveal, consequence, intimate action, humiliation, or identity footage. It must be understandable from source picture and source audio alone; do not depend on added text, narration, BGM, or sound effects.
- The ending may stop on unresolved conflict, but only after the active line and immediate reaction are complete. Never cut on a half-spoken word or before a direct reply needed to understand the exchange.
- Add durations before writing the file. Do not pad with filler or trim complete dialogue to meet the estimate.
- The final edit contains source picture and source audio only. Do not plan visible captions, subtitles, title cards, stickers, BGM, sound effects, or narration.
