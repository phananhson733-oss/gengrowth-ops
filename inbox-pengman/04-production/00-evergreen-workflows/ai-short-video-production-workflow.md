---
title: AI Short Video Production Workflow
project: astrologywiki
type: workflow
status: active
owner: Pengman
updated: 2026-07-16
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

- Completed [[inbox-pengman/04-production/00-evergreen-workflows/统一内容 Brief 模板.md]].
- Relevant prior weekly `decision / next_test`.
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
- Follow the canonical `Copy Style` in [[inbox-pengman/04-production/00-evergreen-workflows/astrologywiki-social-daily/SKILL]]: natural creator-style contrast is allowed; repetitive or corporate-sounding AI contrast templates are not.
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

### 视觉信息存放规则

默认采用“一条内容一个状态与最终决策事实来源”：

- 单条短视频只有一个拟生产版本时，最终视觉选择、实验假设、逐秒画面、素材链接、生成 Prompt、字幕与动效要求、授权状态都直接写入该内容生产记录。
- 通用视觉调研，例如竞品常见形式、AI 图片与图库素材的比较、跨视频剪辑规律和阶段性实验结论，写入对应的竞品研究、平台研究或长期方法记录；单条生产记录只链接来源并摘录本次实际采用的结论。
- 飞书 Social 负责提供或整理可观看的竞品账号、视频链接和结构化画面观察，补足 Google Sheet 与 TikTok 证据；它是研究输入方，不负责最终方案建议。Codex 负责核验原视频、证据强度、重复来源和适配风险。
- 只有出现大量素材、多个仍需比较的视觉版本、复杂 Prompt 组、长逐镜脚本或多人协作交付时，才在主生产记录旁拆出独立视觉制作方案。
- 拆分后，主生产记录仍唯一拥有 `content_stage`、脚本确认状态、最终视觉选择、发布链接和复盘入口；视觉子文档使用同一 `content_id`，并增加 `parent_content` wikilink 和独立的 `visual_status`。子文档不得维护第二份总体状态或发布数据。
- 主生产记录链接视觉子文档；视觉子文档反向链接主生产记录。周报和发布记录始终链接主生产记录，不直接把视觉子文档当作内容事实来源。

#### 视觉决策分工

- 飞书 Social 负责补充可观看的竞品账号、视频链接和结构化画面证据，是研究输入方，不直接决定方案。
- Codex 负责核验原始证据、识别重复来源和推断，结合仓库历史表现、品牌一致性、版权、成本与实验价值，给出一个有置信度的默认建议，并在确认后转化为执行方案。
- Pengman 只确认品牌审美、实际制作投入和是否愿意让当前内容承担实验；低成本可逆 canary 不要求 Pengman 重新完成研究。
- 默认不使用第三个 AI 投票。事实冲突优先回看原视频或后台数据；审美分歧由 Pengman 确认。只有关键事实无法核验、遗漏重大风险、需要专门样稿比较，或两个方案都高成本且难回退时，才考虑第三方专项分析。
- 每条内容的主生产记录是综合建议、最终选择、执行和发布状态的事实来源；原始研究报告保留原位并链接，不复制全文。

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

## AI Host Canary Package

Use this package when testing a new AI host format before committing to a heavier avatar workflow.

Recommended structure:

1. Choose one topic and one backup topic.
2. Write a 35-45 second English voiceover.
3. Use one fixed host reference image.
4. Generate only 3-5 supporting visuals.
5. Build the final video in CapCut with subtitles, concept cards, CTA, and light music.
6. Publish one canary version before scaling the host format.

Host rules:

- Keep the host stable across face, outfit, background, and tone.
- Prefer calm educator movement over dramatic gestures.
- If full talking-head generation looks unnatural, reduce host screen time and cover transitions with concept cards.
- Put all readable text in CapCut, not inside AI-generated images.

Quality bar:

- 9:16 vertical video.
- Clear voiceover and readable subtitles.
- No deterministic predictions about relationships, health, or match results.
- One simple comment prompt or CTA.
- Published link and early metrics added to the weekly digest.

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
