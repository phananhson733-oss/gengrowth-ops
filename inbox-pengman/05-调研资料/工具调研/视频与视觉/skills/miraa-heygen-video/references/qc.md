# Mira raw-video QC

## Automated checks

The script records:

- file exists and is non-empty;
- width, height, duration, frame rate, and stream types from `ffprobe`;
- expected portrait dimensions for `1080p` + `9:16` (`1080 × 1920`);
- presence of at least one video and one audio stream;
- actual-duration theoretical cost;
- API wallet before/after difference when both balances are available.

An automated technical pass does not approve content or visual quality.

## Mandatory human playback

Watch the full raw MP4 once with sound and check:

1. the complete confirmed script is spoken in order;
2. astrology terms, names, contractions, and punctuation pauses sound natural;
3. lip sync remains stable at the beginning, middle, and end;
4. Mira's identity, face shape, hair, clothing, eyes, teeth, and skin do not drift;
5. hand/body motion does not clip, warp, freeze, or distract;
6. the vertical crop and background are consistent;
7. audio has no clicks, dropouts, sudden volume changes, or truncated ending;
8. no unintended captions or text are burned into the raw file.

Keep the state at `production_pending_human_review` until this review is complete. This V1 does not publish or update lifecycle fields.
