# Story analysis schema

Read `merged_data.json` before writing `story_analysis.json`. Use 2 or 3 parts. Each part should normally render to 60–150 seconds for the Mac short-form workflow.

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
- Do not cut in the middle of a sentence when a nearby ASR boundary is available.
- The hook is a 3–8 second preview; the backbone still needs to make sense without prior knowledge.
- The ending should stop on unresolved conflict rather than a completed resolution.
- Add durations before writing the file. Target 60–150 seconds per part; do not pad with filler.
- Process only source episodes the user is authorized to use.

