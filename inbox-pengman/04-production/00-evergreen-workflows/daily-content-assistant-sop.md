---
title: Daily Content Assistant SOP
type: workflow
status: draft
updated: 2026-07-01
owner: Pengman
---

# Daily Content Assistant SOP

## Purpose

Use Codex as a weekday assistant for choosing what AstrologyWiki should post today.

The assistant should recommend practical offsite content ideas that support AstrologyWiki traffic, SEO visibility, and article discovery. It should not act like a generic social media content generator.

## Current MVP

This first version is semi-automatic.

Pengman provides or maintains:

- An AstrologyWiki article index.
- A recent Google Search Console CSV export.
- Recent publishing records from the weekly published content digests.
- Optional notes about current priorities, launches, or topics to avoid.

Codex reads those materials and produces one daily recommendation note.

## Recommended Folder Structure

Suggested working files:

- `inbox-pengman/04-production/00-evergreen-workflows/daily-content-assistant-sop.md`
- `inbox-pengman/astrologywiki-article-index.csv`
- `inbox-pengman/04-production/07-gsc-exports/`
- `inbox-pengman/04-production/05-weekly-published-content-digests/`
- `inbox-pengman/04-production/06-daily-content-recommendations/`

If the folders do not exist yet, create them later when the first CSV/export is ready.

## Input 1: AstrologyWiki Article Index

Primary source:

- `https://www.astrologywiki.com/en/wiki?tab=articles`

The daily workflow should use AstrologyWiki articles as the content anchor. For the MVP, do not depend on live website reading every day. Keep a local article index and refresh it when the articles page changes or when the user asks for a refresh.

Preferred columns:

| column | meaning |
| --- | --- |
| title | Article title |
| url | AstrologyWiki article URL |
| primary_topic | Main topic, such as zodiac, planet, birth chart, transit, compatibility |
| related_keywords | Useful search or social keywords |
| content_angle | Basic explanation, SEO support, trend response, evergreen social post, short-video script |
| platform_fit | X, Shorts, TikTok, Pinterest, etc. |
| priority | High, medium, low |
| notes | Anything useful for judgment |

This index does not need to be perfect at first. Even 20-50 important articles are enough for the MVP.

## Input 2: Google Search Console CSV

Manual export is preferred for the first version.

Put exported CSV files under:

- `inbox-pengman/04-production/07-gsc-exports/`

Do not read GSC CSV files from Downloads or other folders during the Ops workflow. If the file is outside `gengrowth-ops`, move or copy it into `inbox-pengman/04-production/07-gsc-exports/` first.

Useful columns:

| column | meaning |
| --- | --- |
| query | Search query |
| page | Landing page |
| clicks | Clicks in selected date range |
| impressions | Impressions in selected date range |
| ctr | Click-through rate |
| position | Average position |
| date_range | Export date range, if not already in the file name |

Recommended export views:

- Queries by page for AstrologyWiki article URLs.
- Queries with high impressions but low CTR.
- Queries ranking around positions 8-30.
- Pages with impressions but not enough clicks.

## Input 3: Published Records

Use the weekly published content digests as the main source for what has already been posted:

- `inbox-pengman/04-production/05-weekly-published-content-digests/2026-W25 已发布内容合集.md`
- `inbox-pengman/04-production/05-weekly-published-content-digests/2026-W27 本周已发布内容合集.md`

Known recent published themes from these files include:

- Lionel Messi / Cancer Sun / World Cup night.
- Taylor Swift + Travis Kelce / July 4 wedding rumor / Cancer season.
- Erling Haaland / birth chart / Cancer-Leo cusp.
- Jupiter in Leo / World Cup spotlight.

If a separate `published-log.md` is later created, use it as a convenience index, but keep the weekly digests as the evidence source.

Optional simple index format:

| date | platform | topic | article_url | format | notes |
| --- | --- | --- | --- | --- | --- |

The assistant should avoid repeating the same topic, hook, named person, or article angle too often, especially within the last 7-14 days.

## Daily Decision Rules

When generating the daily recommendation, Codex should:

1. Prioritize topics that support AstrologyWiki article discovery.
2. Prefer pages or queries with real GSC evidence when CSV data is available.
3. Look for keywords with high impressions, weak CTR, or rankings close to page one.
4. Use AstrologyWiki articles as the content anchor whenever possible.
5. Avoid making the post feel like an ad unless the user explicitly asks for a CTA-heavy post.
6. Prefer reusable formats: X post, short-video script, simple image prompt, or carousel outline.
7. Avoid repeating recently used hooks, examples, or angles.
8. Keep recommendations executable by one person.
9. If evidence is weak or missing, clearly say that the recommendation is based on article fit rather than GSC data.
10. Before recommending a topic, check recent weekly published digests and exclude already-used topics unless the recommendation is a clearly different follow-up.
11. Avoid obvious AI-style contrast patterns in public-facing copy, especially sentence pairs like "X is not..., it is..." or "This is not..., this is..."; write with natural transitions instead.
12. When using sports, event, or launch timing, verify the date and time from current sources and convert it internally to Chicago time (CT/CDT); do not put the exact time into public-facing copy unless it improves the post.

## Daily Output Format

Each daily note should include:

### 1. Today Recommendation

- Primary topic:
- Recommended format:
- Recommended platform:
- Linked AstrologyWiki article:
- Related GSC query/page:
- Why this is the best choice today:

### 2. Ready-To-Post Draft

For X or text/image post:

- Draft post:
- Optional image idea:
- Suggested hashtags:

For short video:

- Hook:
- 20-40 second script:
- Visual structure:
- Caption:

### 3. Backup Ideas

Provide 2-3 backups:

- Topic:
- Article:
- Why it is worth considering:
- Best format:

### 4. Evidence Used

List the specific inputs used:

- Article index rows or article URLs.
- GSC queries/pages, if available.
- Publishing log notes, if relevant.

### 5. Open Questions

Only include questions that materially affect publishing.

## Reusable Prompt

Use this prompt when asking Codex to generate the daily recommendation:

```text
请作为 AstrologyWiki 的每日站外内容选题助手，帮我生成今天适合发布的图文或短视频建议。

目标：
- 支持 AstrologyWiki 的 SEO/PV 和文章发现，而不是泛泛做社媒涨粉。
- 优先参考 AstrologyWiki 文章索引、GSC CSV、最近发布记录。
- 给出今天最值得发的 1 个首推选题，以及 2-3 个备选。
- 输出要可直接执行，适合一个人当天完成。

请读取并参考：
- https://www.astrologywiki.com/en/wiki?tab=articles 作为文章来源；优先使用本地文章索引 inbox-pengman/astrologywiki-article-index.csv
- inbox-pengman/04-production/07-gsc-exports/ 中最新或我指定的 CSV
- inbox-pengman/04-production/05-weekly-published-content-digests/ 中最近的已发布内容合集
- 任何我在本次对话里补充的临时优先级

判断规则：
- 优先选择能支撑 AstrologyWiki 文章访问的主题。
- 如果 GSC 有数据，优先关注高 impressions、低 CTR、排名 8-30、或已有点击但需要加强站外表达的 query/page。
- 避免重复最近 7-14 天已经发过的主题、角度、人物、文章或案例；已做过的选题不再作为今日首推。
- 大多数内容不要像广告，必要时只轻 CTA 到相关文章。
- 如果数据不足，请明确说明依据来自文章主题匹配，而不是 GSC 证据。
- 面向发布的文案要避免明显 AI 味的对照句式，尤其不要写成“不是...而是...” / “这不是...这是...” / “肯定句接否定句再反转”的模板感表达；用自然、直接的过渡。
- 如果使用比赛、发布、直播、节日等时间信息，必须先核对当前来源，并在内部统一换算成芝加哥时区 CT/CDT；除非对发布效果有帮助，不要默认把具体时间写进对外文案。

请按以下格式输出：

## 今日首推
- 主题：
- 形式：
- 平台：
- 关联文章：
- 关联 GSC 数据：
- 为什么今天适合发：

## 可直接发布的草稿
- 文案或脚本：
- 视觉建议：
- 可选标题/开头：
- Hashtags：

## 备选 2-3 个
- 主题：
- 关联文章：
- 推荐形式：
- 选择理由：

## 使用依据
- 文章：
- GSC：
- 最近发布记录：

## 需要我确认的事
- 只列真正影响发布的问题。
```

## First Setup Checklist

- [ ] Create or provide the first article index.
- [ ] Move or copy the first GSC CSV into `inbox-pengman/04-production/07-gsc-exports/`.
- [ ] Use weekly published content digests as the published record.
- [ ] Run the prompt manually once.
- [ ] Adjust the output format after 3-5 real uses.
- [ ] Only then consider making this a formal Codex skill or scheduled automation.

## Later Automation Ideas

After the MVP works, possible upgrades:

- Weekday reminder that asks Codex to generate the note.
- Automatic selection of the newest GSC CSV.
- Weekly summary of which recommendations were used.
- Formal Codex skill for the workflow.
- Optional Google Search Console API connection if manual CSV export becomes annoying.
