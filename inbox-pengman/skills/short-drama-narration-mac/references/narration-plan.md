# narration_plan.json

```json
{
  "drama_name": "Example Drama",
  "language": "en-US",
  "outputs": [
    {
      "id": "narration-1",
      "angle": "betrayal reveal",
      "shots": [
        {
          "text": "On her wedding day, she learns that the person she trusted most has been lying to her.",
          "source_path": "/absolute/path/episode-01.mp4",
          "source_start_s": 12.5,
          "source_duration_s": 4.2
        }
      ]
    }
  ]
}
```

Default production plans contain exactly three outputs with different angles and hooks. Set `language` to `en-US` and write natural American English narration and captions. A shot's `source_duration_s` must be long enough for its locally generated narration sentence at the selected voice rate. Use absolute source paths. Keep shots in narrative order and avoid overlapping the same source window across multiple sentences unless the reuse is intentional and disclosed.
