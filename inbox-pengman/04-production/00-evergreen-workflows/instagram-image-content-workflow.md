---
title: Instagram Image Content Workflow
project: astrologywiki
type: workflow
status: active
owner: Pengman
updated: 2026-07-03
related:
  - [[inbox-pengman/04-production/00-evergreen-workflows/daily-content-assistant-sop.md]]
  - [[inbox-pengman/04-production/00-evergreen-workflows/ai-short-video-production-workflow.md]]
  - [[inbox-pengman/04-production/2026-06-17-astrologywiki-social-content-workflow.md]]
  - [[inbox-pengman/04-production/03-reference-accounts/2026-06-29-reference-accounts.md]]
  - [[inbox-pengman/04-production/05-weekly-published-content-digests/README.md]]
  - [[inbox-pengman/04-production/06-daily-content-recommendations/README.md]]
  - [[tools/internal/skills/social-daily/SKILL.md]]
---

# Instagram Image Content Workflow

## 0. Purpose

Use this workflow when Pengman wants to create **Instagram image content** for AstrologyWiki, especially when the final design will be made in Canva AI / Canva.

The image count is decided by the content:

| Content type | Recommended format |
|---|---|
| One timely transit / one simple insight | Single image |
| One concept with 3-5 teachable points | 3-5 image carousel |
| A step-by-step explanation | 5-8 image carousel |
| A tool walkthrough or mini guide | 6-10 image carousel |

Pengman may still choose to make only one image for speed, as in the 2026-07-03 transit post. That is a production choice, not a rule of the workflow.

The goal is not to generate generic astrology graphics. The output should support AstrologyWiki's current offsite content system:

- timely astrology / transit awareness
- psychological astrology and self-knowledge
- real astronomy / real dates where relevant
- light CTA to AstrologyWiki pages or tools
- reusable across Instagram, X, and Pinterest when possible

## 1. Where This Fits

This workflow sits between daily topic selection and visual production:

```text
social-daily / daily assistant topic selection
→ image content brief
→ compressed Canva AI prompt
→ Canva design
→ Instagram / X / Pinterest caption
→ weekly digest tracking
```

Use it for:

- one-card transit posts
- one-card Moon / Venus / Rising explainers
- one-card event hooks
- one-card chart literacy posts
- one-card quote / prompt style posts
- short carousels for concept explainers
- longer carousels for mini guides or tool-led posts

Do not use it for:

- AI host video scripts
- long X threads
- formal SEO article briefs

## 2. Required Context For AI Assistant

Before generating the Instagram image content, the AI assistant should reference these sources when available:

1. `tools/internal/skills/social-daily/SKILL.md`
   - Use its rules: timely topics first, no made-up facts, conversion must have a real landing page, content should be practical and non-mystical.

2. `inbox-pengman/04-production/00-evergreen-workflows/daily-content-assistant-sop.md`
   - Use its rules: support SEO/PV and article discovery, check recent published topics, avoid repeated angles, prefer executable outputs.

3. `inbox-pengman/04-production/05-weekly-published-content-digests/`
   - Check what has already been posted recently.
   - Avoid repeating the same person, transit, hook, article, or exact angle within 7-14 days unless it is a clearly different follow-up.

4. `inbox-pengman/04-production/03-reference-accounts/2026-06-29-reference-accounts.md`
   - Use reference accounts for structure and format, not for copying visual style or wording.
   - For X, `satyastrology` is a reference for short transit insight + open chart question.
   - For image posts, reference account screenshots can inspire information density: big title, date, short insight, 3 concise action points.

5. Latest daily recommendation / production process notes in:
   - `inbox-pengman/04-production/06-daily-content-recommendations/`

6. AstrologyWiki brand direction:
   - modern
   - clean
   - psychological astrology
   - grounded in real astronomy
   - not mystical, fatalistic, or fortune-telling

## 3. Content Rules

### 3.1 Decide Image Count First

Before writing copy, decide whether the post should be one image or a carousel.

Use a single image when:

- the topic is one transit, one question, or one reflection prompt
- the goal is quick posting and broad platform reuse
- the source content can be compressed into one insight + 3 actions

Use a carousel when:

- the source has multiple sections that deserve their own slide
- the post teaches a framework, such as Sun / Moon / Rising
- the goal is saves, not only reach
- a tool walkthrough or chart-reading process is involved

### 3.2 What Goes On A Single Image

For a single image, keep text short. A good one-card structure is:

```text
LABEL
DATE

Main title
Subtitle

One short insight

3 short action lines / reflection prompts

@AstrologyWiki
```

Target text length:

- Image text: 40-80 words max.
- Caption can carry the longer explanation.
- If the source content has two long boxes, compress each into one short action line.

For carousel posts, use this structure:

```text
Slide 1: strong title / hook
Slide 2-4: one concept per slide
Slide 5: reflection question or CTA
```

Each slide should still be light. Avoid putting blog paragraphs into carousel slides.

### 3.3 Avoid These On The Image

- long paragraphs
- app screenshot style
- too many section boxes
- `Daily` / `Daily Transit` unless Pengman explicitly wants daily positioning
- fake UI buttons
- generic horoscope promises
- fate / prediction language
- fear-based wording
- claims like "this will happen to you"

### 3.4 Recommended Visual Style

AstrologyWiki image posts should feel:

- clean
- modern
- calm
- airy
- slightly celestial
- readable on mobile

Recommended visual ingredients:

- deep navy
- cream / off-white
- muted gold
- pale blue
- subtle stars
- simple orbital line
- simple planet / glyph accent
- plenty of whitespace

Avoid:

- overly cute clutter
- dense pastel doodle overload
- dark occult style
- excessive gradients
- illegible decorative fonts
- fake constellations if the visual implies actual astronomy

## 4. Output Rules For Canva AI Prompt

Canva prompt must be short enough to paste directly into Canva AI.

Recommended length:

- 80-140 words when possible.
- Include all final image text.
- Do not include long strategy explanations.

Canva prompt should include:

1. canvas size
2. exact image text
3. brand visual style
4. layout constraints
5. explicit exclusions
6. image count, if creating a carousel

Do not ask Canva AI to write long paragraphs or invent facts.

## 5. Reusable AI Assistant Prompt

Use this prompt when asking an AI assistant to generate Instagram image content and a Canva prompt.

```text
你是 AstrologyWiki 的 Instagram 图文内容策划助手。请帮我基于今天的主题，生成适合 Canva 制作的 Instagram 图片内容方案。图片数量由内容决定：如果主题只需要一眼扫完，做 single image；如果需要解释框架或步骤，做 carousel。

必须先参考以下规则和资料：
- tools/internal/skills/social-daily/SKILL.md
- inbox-pengman/04-production/00-evergreen-workflows/daily-content-assistant-sop.md
- inbox-pengman/04-production/05-weekly-published-content-digests/ 最近已发布内容
- inbox-pengman/04-production/03-reference-accounts/2026-06-29-reference-accounts.md
- inbox-pengman/04-production/06-daily-content-recommendations/ 最近的 daily recommendation / production process

目标：
- 支持 AstrologyWiki 的 SEO/PV 和文章发现，不做泛泛星座娱乐号。
- 内容要现代、干净、心理学、自我认知、grounded in real astronomy。
- 可以参考其他账号的信息量和排版结构，但不要照搬视觉风格或文案。
- 单图文字必须少，适合一眼扫完；carousel 也要一页一个重点。长解释放 caption。
- 不要使用 “daily / daily transit”，除非我明确要求。
- 不要使用宿命化、恐吓、预测输赢、预测关系结果的话术。

请输出：

1. Format Decision
- Recommended image count:
- Why:

2. Image Copy
- Label:
- Date:
- Main title:
- Subtitle:
- One-line insight:
- 3 short action lines:
- Handle:
- If carousel: slide-by-slide copy

3. Canva AI Prompt
- 80-140 words
- 包含完整图片文字
- 风格以 AstrologyWiki 为准：clean modern psychological astrology, deep navy, cream, muted gold, pale blue, subtle stars/orbital line/glyph accent, lots of whitespace
- 明确排除：no daily, no app UI, no clutter, no fortune-telling vibe

4. Instagram Caption
- 1 short caption
- 可选 3-5 个 hashtags

5. X / Pinterest Reuse
- X text:
- Pinterest title:
- Pinterest description:
```

## 6. Canva AI Prompt Templates

Use this template after the single-image copy is finalized.

```text
Clean modern astrology post, 1080x1350. Deep navy, cream, muted gold, pale blue.

Text:
[LABEL]
[DATE]
[MAIN TITLE]
[SUBTITLE]
[ONE-LINE INSIGHT]
[ACTION 1]
[ACTION 2]
[ACTION 3]
@AstrologyWiki

Style: AstrologyWiki-inspired, modern psychological astrology, grounded not mystical, subtle stars, simple orbital line, small [PLANET/GLYPH] accent, elegant title, readable body, lots of whitespace. No “daily”, no app UI, no clutter, no fortune-telling vibe.
```

For carousel:

```text
Create a clean modern AstrologyWiki carousel, 1080x1350 each slide, [NUMBER] slides. Deep navy, cream, muted gold, pale blue.

Slide copy:
[SLIDE 1]
[SLIDE 2]
[SLIDE 3]
[SLIDE 4]
[CTA SLIDE]

Style: modern psychological astrology, grounded not mystical, subtle stars, simple orbital lines, small glyph accents, elegant titles, readable body, lots of whitespace. One idea per slide. No “daily”, no app UI, no clutter, no fortune-telling vibe.
```

## 7. Example: July 3 Transit Post

Source content:

- Venus trine Neptune
- Dreamy Connections
- Venus in Taurus harmonizes with Neptune in Pisces
- creativity, compassion, heartfelt connection
- nurture creative side
- deepen emotional bonds

Compressed image copy:

```text
ASTROLOGY TRANSIT
July 3, 2026

Venus trine Neptune
Dreamy Connections

A soft transit for creativity, compassion, and heartfelt connection.

Create something beautiful.
Reach out with warmth.
Let intuition guide you.

@AstrologyWiki
```

Canva AI prompt:

```text
Clean modern astrology post, 1080x1350. Deep navy, cream, muted gold, pale blue.

Text:
ASTROLOGY TRANSIT
July 3, 2026
Venus trine Neptune
Dreamy Connections
A soft transit for creativity, compassion, and heartfelt connection.
Create something beautiful.
Reach out with warmth.
Let intuition guide you.
@AstrologyWiki

Style: AstrologyWiki-inspired, modern psychological astrology, grounded not mystical, subtle stars, Venus symbol, Neptune waves, simple orbital line, elegant title, readable body, lots of whitespace. No “daily”, no app UI, no clutter, no fortune-telling vibe.
```

Instagram caption:

```text
Venus trine Neptune brings a softer tone to creativity, compassion, and connection.

Create something beautiful. Reach out gently. Let beauty feel simple.

#astrology #astrologytransit #venus #neptune #astrologycommunity
```

X reuse:

```text
Today’s transit: Venus trine Neptune.

A softer tone for creativity, compassion, and heartfelt connection.

Create something beautiful.
Reach out with warmth.
Let intuition guide you.
```

Pinterest title:

```text
Venus Trine Neptune: Dreamy Connections
```

Pinterest description:

```text
Venus trine Neptune on July 3, 2026: a soft astrology transit for creativity, compassion, and heartfelt connection.
```

## 8. Publishing Checklist

Before publishing:

- [ ] Image text is short enough to read on mobile.
- [ ] No `daily` wording unless intentionally positioned as daily content.
- [ ] Transit/date facts came from a trusted source or AstrologyWiki context.
- [ ] Caption carries the longer explanation.
- [ ] CTA is light and does not feel like an ad.
- [ ] Post is recorded in the weekly published content digest after publishing.
