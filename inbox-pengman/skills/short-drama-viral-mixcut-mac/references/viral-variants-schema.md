# viral_variants.json

```json
{
  "drama_name": "Example Drama",
  "variants": [
    {
      "id": "viral-1",
      "hook_type": "conflict-first",
      "reason": "A cold viewer immediately understands the accusation and stake.",
      "segments": [
        {
          "role": "hook",
          "source_path": "/absolute/path/episode-02.mp4",
          "source_start_s": 49.4,
          "source_duration_s": 3.5,
          "label": "He dismisses her after giving away the ticket."
        }
      ]
    }
  ]
}
```

Production input contains three variants by default. Allowed roles are `hook`, `backbone`, and `ending`; the first segment must be `hook`. Use absolute source paths, real source timing, sorted narrative order, and 20–60 seconds total per variant. A 1–10 second plan is allowed only with the compiler's `--canary` flag.
