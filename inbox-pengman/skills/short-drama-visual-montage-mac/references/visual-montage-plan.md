# visual_montage.json

Use frame evidence, not dialogue alone. Every segment should have a visible reason that survives a vertical crop.

```json
{
  "drama_title": "Example Drama",
  "source_audio": "mute",
  "parts": [
    {
      "part_id": 1,
      "draft_name": "ExampleDrama_Visual_1_CharacterGlow",
      "visual_direction": "character glow-up: entrance, close-up, turning point",
      "segments": [
        {
          "video_path": "/absolute/path/episode-01.mp4",
          "source_start_s": 12.4,
          "duration_s": 2.0,
          "visual_reason": "Centered close-up, clean light, confident eye contact"
        }
      ]
    }
  ]
}
```

Default plans contain exactly three different directions. Good default trio:

1. **Character glow** — entrance, wardrobe, close-ups, confidence, transformation.
2. **Relationship chemistry** — eye contact, proximity, touch, shared reactions, separation.
3. **Cinematic mood or trailer** — location, motion, contrast, tension, reveals, exit.

Use 0.7–4.0 second clips. Prefer 15–45 seconds total per part. Do not reuse the same source window in different parts unless the reason is deliberate and disclosed. Keep source start times and durations truthful; never reverse or re-order shots to make a false event sequence.

Before compilation, ensure each part has:

- a recognizable first visual within the first second;
- at least three different shot compositions or actions;
- no black / transition frame;
- no prominent subtitle, dialogue-only mouth shot, or unrelated reaction;
- a final frame that can cleanly hold before the user's BGM beat change.
