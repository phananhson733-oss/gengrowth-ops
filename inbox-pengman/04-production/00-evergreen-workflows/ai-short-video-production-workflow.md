---
title: AI Short Video Production Workflow
project: astrologywiki
type: workflow
status: active
owner: Pengman
updated: 2026-07-01
---

# AI Short Video Production Workflow

This is the stable working pipeline for turning AstrologyWiki topic signals into publishable short videos.

It should stay separate from dated daily recommendation notes, weekly digests, and one-off tool research files.

## Workflow Summary

```text
AI topic selection
→ AI script generation
→ Higgsfield voice generation
→ material sourcing / Higgsfield dynamic material / GPT2 image generation
→ CapCut editing
→ Codex SRT generation
→ export
→ Buffer distribution
```

## 1. AI Topic Selection

Use the daily content assistant workflow to choose the topic.

Inputs:

- AstrologyWiki article reference: `https://www.astrologywiki.com/en/wiki?tab=articles`
- Google Search Console CSV, if available.
- Recent published content digests, to avoid repeating topics.
- External platform and internet signals, including YouTube, X, TikTok, news, and trend pages when useful.
- Current priorities from Pengman.

Output:

- One primary topic.
- 2-3 backup ideas.
- Linked AstrologyWiki article or topic page.
- Evidence: GSC query/page, article source, trend/source links, and recently excluded topics.

Current related files:

- [[inbox-pengman/04-production/00-evergreen-workflows/daily-content-assistant-sop.md]]
- [[inbox-pengman/04-production/06-daily-content-recommendations/README.md]]
- [[inbox-pengman/04-production/07-gsc-exports/README.md]]

Rules:

- Support AstrologyWiki SEO/PV and article discovery.
- Avoid recently published topics unless the angle is clearly different.
- Verify dates and event timing internally, using Chicago time as the operational reference when timing matters.
- Do not default to writing exact event times into public copy unless it helps the post.

## 2. AI Script Generation

Turn the selected topic into a short-video script.

Output should include:

- Hook.
- Voiceover script.
- Visual beat outline.
- Caption.
- Hashtags.
- Optional X version.

Writing rules:

- Keep the script short enough for the target format.
- Avoid obvious AI-style contrast patterns, such as "not X, but Y" or "this is not..., this is...".
- Do not over-explain brand values inside the script.
- Do not turn astrology into match prediction, medical/psychological diagnosis, or deterministic claims.
- Keep CTA light and natural.

## 3. Higgsfield Voice Generation

Use Higgsfield to generate the voiceover from the final script.

Input:

- Final voiceover script.
- Target length.
- Preferred tone: clear, calm, lightweight, not overdramatic.

Output:

- Voice audio file.

Checks:

- Pronunciation of names.
- Natural pacing.
- No awkward pause around astrology terms.
- Audio length matches the intended video duration.

## 4. Material Sourcing / Dynamic Material / Image Generation

Prepare visual assets after the voiceover and script are stable.

Possible paths:

- Find suitable public/reference materials when allowed.
- Use Higgsfield to generate dynamic visual material.
- Use Higgsfield to generate motion-friendly visual assets.
- Use GPT2 to generate images when static images are enough.
- Use AstrologyWiki screenshots or article visuals when useful and appropriate.

Asset rules:

- Avoid fake readable text inside AI-generated visuals.
- Avoid fake constellation or zodiac visuals that look inaccurate.
- Prefer simple, inspectable visuals over busy atmospheric backgrounds.
- Keep visuals usable in 9:16 vertical format.
- Track source/permission concerns for real-world footage or celebrity images.

Output:

- Visual asset list.
- Source links or generation prompts.
- Local asset filenames.
- Notes for CapCut placement.

## 5. CapCut Editing

Assemble the video in CapCut.

Inputs:

- Voice audio.
- Visual assets.
- Beat outline.
- Caption or on-screen text.
- Brand assets, if needed.

Editing rules:

- Keep timing aligned to the voiceover.
- Use simple text overlays.
- Prioritize readability on mobile.
- Do not rely on AI-generated images to contain text.
- Keep the ending CTA light.

Output:

- Edited CapCut project.
- Draft MP4 for review.

## 6. Codex SRT Generation

Use Codex to generate or clean the `.srt` file after the voiceover timing is known.

Inputs:

- Final voiceover text.
- Audio or rough timing notes.
- Exported draft video, if needed for timing checks.

Output:

- `.srt` subtitle file.

Checks:

- Subtitle timing matches the audio.
- Line breaks are readable on mobile.
- No spelling errors in names, astrology terms, or article titles.
- No long subtitle blocks.

## 7. Export

Export the final video from CapCut.

Checks before export:

- 9:16 format.
- Captions readable.
- Audio level acceptable.
- No visual/text overlap.
- CTA and article reference correct.
- No wrong event time or outdated claim.

Output:

- Final MP4.
- Final SRT, if used separately.
- Thumbnail or cover frame, if needed.

## 8. Buffer Distribution

Use Buffer to distribute or schedule the finished content.

Recommended use:

- YouTube Shorts.
- TikTok.
- X, if the idea also works as a short post.
- Other platforms only when the format fits.

Before publishing:

- Confirm platform caption.
- Confirm link/CTA.
- Confirm hashtags.
- Confirm no repeated recent topic.

After publishing:

- Add the published link to the relevant weekly published content digest.
- Record early visible metrics when available.
- Note whether the topic supported an AstrologyWiki page or article.

## Minimum Viable Production Package

For one short video, prepare:

- One selected topic.
- One final script.
- One voice audio file.
- 5-8 visual beats.
- 1 edited CapCut project.
- 1 final MP4.
- 1 SRT file if subtitles are not burned in.
- 1 Buffer-ready caption.

## Current Open Questions

- Which Higgsfield voice should become the default?
- When should GPT2 images be preferred over Higgsfield visuals?
- Which asset sources are acceptable for sports and celebrity content?
- Should each finished video get its own production folder, or only a weekly folder?
