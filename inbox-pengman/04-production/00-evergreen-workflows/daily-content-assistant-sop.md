---
title: Daily Content Assistant SOP
type: workflow
status: draft
updated: 2026-07-17
owner: Pengman
---

# Daily Content Assistant SOP

## Purpose

Use Codex as a weekday assistant for choosing what AstrologyWiki should post today.

The assistant should recommend a practical daily content slate across the active account matrix that earns qualified reach, drives relevant AstrologyWiki article/tool discovery, and preserves a trackable social→tool use/registration/purchase path. It should not assume that Pengman produces only one topic per day, and it should not act like a generic social media content generator.

Q3 alignment: the team North Star is sustained post-share revenue of $1,000/day. This SOP controls the social leading indicators: reach, conversion-path quality, assisted qualified UV, growth-point discovery, and reusable SOP learning. PV remains a page/product diagnostic, not the traffic-layer KPI.

## Current MVP

This first version is semi-automatic.

Pengman provides or maintains:

- AstrologyWiki live article list; use a local index only when the file actually exists.
- Current site/SEO priorities or approved topic references when available.
- Recent publishing records from the weekly published content digests, including relevant `decision / next_test`.
- Selected competitor rows from the live Google Sheet; do not use stale local CSV snapshots as current facts.
- Optional notes about current priorities, launches, or topics to avoid.

Codex reads those materials and produces one daily recommendation note containing a ranked multi-account production slate.

Storage boundary:

- Daily candidate pools, recommendations and day-level content packages: `06-daily-content-recommendations/`.
- A selected topic's Unified Brief, script, production guide, production record and model attachments: `07-content-production/`.
- The daily note links the selected production record; it does not maintain a second `content_stage` or final draft.

## Recommended Folder Structure

Suggested working files:

- `inbox-pengman/04-production/00-evergreen-workflows/daily-content-assistant-sop.md`
- `https://www.astrologywiki.com/en/wiki?tab=articles`；仅在本地索引实际存在时使用本地文件
- `inbox-pengman/04-production/05-weekly-published-content-digests/`
- `inbox-pengman/04-production/06-daily-content-recommendations/`
- `inbox-pengman/04-production/07-content-production/`；只在候选被选中后建立单条主生产记录
- `inbox-pengman/05-调研资料/竞品研究/README.md`；在线 Google Sheet 是事实源，本地文件只提供已选中的研究背景

GSC input is paused as of 2026-07-16. Do not recreate its folder, read or request exports, or block production because GSC is absent. Historical notes that already cite GSC remain historical evidence only.

## Input 1: AstrologyWiki Article Index

Primary source:

- `https://www.astrologywiki.com/en/wiki?tab=articles`

The daily workflow should use AstrologyWiki articles as the content anchor. 当前仓库没有 `inbox-pengman/astrologywiki-article-index.csv`，因此不得把该路径当作已存在输入；默认读取公开文章列表。以后若建立本地索引，它只能是带刷新日期的缓存，并链接回公开来源。

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

## Input 2: Current Site and SEO Context

Use only inputs that are currently available and approved:

- Public AstrologyWiki article and tool pages.
- Current business priorities or landing pages Pengman provides.
- SEO topic references explicitly provided by Pengman for the current task, if any.
- Recent weekly `decision / next_test` and platform-visible performance.

Do not infer search performance, rankings, impressions, clicks or CTR from these inputs. Mark missing site/SEO direction as `待确认` only when it materially changes the recommendation; it is not a permission blocker.

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

## Input 4: Competitor Research and Prior Decisions

- 竞品事实源：Google Sheet `astrologywiki reference account video`。
- 本地竞品研究入口：[[inbox-pengman/05-调研资料/竞品研究/README.md]]；只在需要解释已采用的账号、视频机制或历史分析时读取。
- `inbox-pengman/05-调研资料/竞品研究/旧快照/2026-07-07/` 是停用历史快照，不参与新 Brief、候选生成或当前数据判断。
- Obsidian 只保存被选中的 URL、借鉴机制、证据强度和风险，不复制整表。
- 下一轮写稿前必须读取同系列最近周报的 `decision / next_test`；不能只读取最终稿。
- 若没有可用的 `decision / next_test`，明确写“待确认”，不要从播放量单独推导长期规则。

## Daily Decision Rules

When generating the daily recommendation, Codex should:

1. Prioritize topics that can earn qualified reach and support relevant AstrologyWiki article/tool discovery.
2. Use current public AstrologyWiki pages, approved SEO topic references and Pengman's priorities to choose landing pages and phrase user intent.
3. Use AstrologyWiki articles as the content anchor whenever possible.
4. Avoid making the post feel like an ad unless the user explicitly asks for a CTA-heavy post.
5. Prefer reusable formats: X post, short-video script, simple image prompt, or carousel outline.
6. Avoid repeating recently used hooks, examples, or angles.
7. Keep recommendations executable by one person.
8. If evidence is weak or missing, distinguish article fit, current public evidence and assumptions; do not invent search-performance claims.
9. Before recommending a topic, check recent weekly published digests and exclude already-used topics unless the recommendation is a clearly different follow-up.
10. Public copy style follows the `Copy Style` section of [[inbox-pengman/04-production/00-evergreen-workflows/astrologywiki-social-daily/SKILL]] as the single source of truth. Natural creator-style contrast is allowed; avoid repetitive, corporate or obviously templated AI reversals.
11. When using sports, event, or launch timing, verify the date and time from current sources and convert it internally to Chicago time (CT/CDT); do not put the exact time into public-facing copy unless it improves the post.
12. For hotspot, celebrity, sports, and entertainment content, avoid question-heavy titles and classroom-style explainers by default. Lead with the public moment, emotional tension, or visual story people already care about, then add the AstrologyWiki lens or tool CTA lightly.
13. For TikTok/Instagram image posts, do not turn every carousel into a lesson. Prefer fewer slides and a short editorial/story rhythm, especially when the matching video angle already works better than a pure explainer.
14. Always produce a four-account distribution plan. For each daily recommendation, map today's topics onto the 4 accounts and state, for every account, what to post or that it skips today. Never silently drop an account. Account definitions and formats: `inbox-pengman/04-production/01-strategy-and-platform-research/four-account-tiktok-content-playbook.md`.
    - ① AstrologyWiki 官方：The Pattern 模式，天象 + 心理/关系落点 + 非真人 + 工具承接，栏目化。
    - ② AI 占星师人设：占星 × 心理机制解读，固定 AI 主播，收敛绝对化。
    - ③ 热点占星测试：明星/情侣/事件蹭热点，用星盘解释而非预测。
    - ④ 普通占星爱好者：低成本测试号，星座梗/评论互动/trend 音频/图文测标题，快速测 hook/星座/关系话题/评论问题，素人口吻不品牌化。
15. Treat the result as a daily account portfolio, not one universal winning topic. Pengman may select 1–4 independent topics in one day, often one for each suitable account. Rank them by `P0 / P1 / P2`, estimate production effort, and identify which items share research or assets.
16. A topic assigned to more than one account may share a mother-topic source, but each independently publishable account version must receive its own `content_id`, Brief, script confirmation and production state. Do not merge multiple account versions into one status record.
17. Before writing each selected item, read 1–3 relevant historical samples with Pengman edits when available, the latest same-series `decision / next_test`, and only the selected competitor mechanisms. Record what was learned and what must not be copied in that item's main production record.

## Capacity and Effort Gate

Before ranking the daily slate, use Pengman's available production time when they provide it. If no capacity is provided, do not stop to ask; label capacity as `待确认` and use a conservative default slate of at most `1 条 M + 1 条 S`.

| 成本 | 参考工作量 | 常见内容 |
|---|---|---|
| `S` | 15–30 分钟 | 文字视频、简单 photo post、低成本 Hook 测试 |
| `M` | 30–90 分钟 | AI 口播、普通短视频、轻量 Carousel |
| `L` | 90 分钟以上 | 复杂调研、多版本视觉、双模型实验、重制作内容 |

P0 表示“今天优先做”，不代表“必须把四个账号做满”。时效窗口、上轮 `next_test`、账号缺口和制作成本共同决定顺序。

## Daily Output Format

The formal daily note keeps the full evidence and candidate details, but Pengman's default reading surface is the one-screen production card below. Put detailed Route A/B/C evidence after the card.

### 0. One-Screen Production Card

| 优先级 | 编号 | 账号 | 今天做什么 | 形式 | 为什么现在做 | 成本 | 通道 |
|---|---|---|---|---|---|---|---|
| P0 |  |  |  |  |  | S/M/L | 快速/实验 |

- 今日建议总工作量：
- 建议制作顺序：
- 可共用的调研/素材：
- 今日明确不做：

Pengman 只需回复“做 A1 和 C2，先做 C2”。AI 再展开被选内容，不要在首屏展开所有证据和候选解释。

Each daily note should then include:

### 1. Today Production Slate

- Recommended number of items today:
- P0 items:
- P1 items if capacity remains:
- Shared research/assets:
- Suggested production order:
- Capacity or timing risk:

For every recommended item:

- Topic:
- Target account:
- Recommended format:
- Recommended platform:
- Linked AstrologyWiki article:
- Related site/SEO topic or landing page:
- Target audience / reach mechanism:
- Primary conversion event:
- Assisted qualified UV attribution path:
- Growth point to test:
- Why this is the best choice today:

### 1b. Four-Account Distribution

For each account, give today's post or mark it as skipped:

- ① AstrologyWiki 官方：
- ② AI 占星师人设：
- ③ 热点占星测试：
- ④ 普通占星爱好者：

### 2. Stage 1 Candidate Directions

默认只给可供 Pengman 选择的候选方向，不在这一阶段生成 Ready-To-Post Draft。每个候选至少包含：

- Route A / B / C：
- 选题角度：
- 目标账号：
- 平台和形式：
- Hook 方向：
- 证据和去重结论：
- Landing page / CTA 方向：
- 目标用户 / reach 机制：
- 预期转化事件：
- assisted qualified UV 归因路径：
- 本条要验证的增长点：
- 风险或待确认：

Pengman 可以一次选择 1–4 个候选。选择后才进入 Stage 2：每个可独立生产/发布的内容分别建立统一 Brief 和主生产记录，并按需要生成单模型初稿或启动 Claude / GPT 双模型内容实验。若 Pengman 明确要求“直接展开内容包”“直接生成脚本”“不用等我选”或“hook 优先”，才可跳过等待。

### 2b. Two Execution Lanes

#### 快速通道

适用于事实可核验、品牌风险低、方向已成熟、不需要双模型比较的 `S/M` 内容。

```text
Pengman 选中
→ AI 一次性建立简版 Brief + 脚本 + 制作卡
→ Pengman 一次确认或修改
→ 待制作
```

快速通道仍要保留 `content_id`、核心事实、脚本版本、人工反馈和发布回链，但不要为了填满模板而增加确认轮次。

#### 实验通道

用于双模型比较、新账号/新形式、重要品牌内容、`L` 级制作、关键事实或角度仍有争议，以及 L4/L5 变更。

```text
研究与完整 Brief
→ Pengman 确认核心承诺
→ 单/双模型候选
→ Pengman 选择
→ 正式制作
```

AI 在生产卡中先建议通道，Pengman 可以随时要求升级或降级。

### 3. Backup Ideas

Provide 2-3 backups:

- Topic:
- Article:
- Why it is worth considering:
- Best format:

### 4. Evidence Used

List the specific inputs used:

- Article index rows or article URLs.
- Approved SEO topic references or current priorities, if used.
- Publishing log notes, if relevant.

### 5. Open Questions

Only include questions that materially affect publishing.

## Reusable Prompt

Use this prompt when asking Codex to generate the daily recommendation:

```text
请作为 AstrologyWiki 的每日站外内容选题助手，帮我生成今天适合发布的图文或短视频建议。

目标：
- 获取目标用户 reach，并通过相关 AstrologyWiki 文章/工具承接，保障可追踪的 social→工具使用/注册/购买路径；记录 assisted qualified UV。PV 只作页面承接诊断，不是主 KPI。
- 优先参考 AstrologyWiki 公开文章/工具页、SEO 主题参考、最近发布记录。
- 根据四账号定位和 Pengman 的产能，给出今天建议生产的 1–4 条内容组合，标记 P0/P1/P2、制作顺序和 2–3 个备选。
- 输出要可直接执行，适合一个人当天完成。
- 如果 Pengman 没有说今天可用时间，不要因追问而阻塞；默认最多安排 `1 条 M + 1 条 S`，并标记产能待确认。

请读取并参考：
- https://www.astrologywiki.com/en/wiki?tab=articles 作为文章来源；仅在 `inbox-pengman/astrologywiki-article-index.csv` 实际存在且日期可用时优先使用
- Pengman 在本次任务明确提供的 SEO 主题或站内优先级（如无则不补读历史选题目录）
- inbox-pengman/04-production/05-weekly-published-content-digests/ 中最近的已发布内容合集
- 任何我在本次对话里补充的临时优先级

判断规则：
- 优先选择能支撑 AstrologyWiki 文章访问的主题。
- 结合公开文章/工具页、当前业务重点和 SEO 主题参考选择站内承接；不要推断未提供的搜索表现。
- 避免重复最近 7-14 天已经发过的主题、角度、人物、文章或案例；已做过的选题不再作为今日 P0，除非是明确不同的后续测试。
- 大多数内容不要像广告，必要时只轻 CTA 到相关文章。
- 如果证据不足，请明确区分文章主题匹配、当前公开证据和待确认假设。
- 公共表达规则以 [[inbox-pengman/04-production/00-evergreen-workflows/astrologywiki-social-daily/SKILL]] 的 `Copy Style` 为唯一来源：自然、像创作者说话的反差可以使用；连续套用或明显 AI 模板感的反转不用。
- 热点、名人、体育、影视娱乐类内容不要默认写成提问式标题或强科普口吻。先抓住正在发生的故事、画面、人物关系或情绪张力，再轻轻带入 AstrologyWiki 的占星视角或工具 CTA。
- TikTok 图文和 Instagram carousel 不要每次都做成课堂式解释。优先少页数、短句、故事感/娱乐感强的图文节奏；如果视频角度更吸引人，就把视频的叙事节奏改成图文，而不是改成重科普。
- 如果使用比赛、发布、直播、节日等时间信息，必须先核对当前来源，并在内部统一换算成芝加哥时区 CT/CDT；除非对发布效果有帮助，不要默认把具体时间写进对外文案。
- 必须给出四账号分发建议：把今天的选题分配到 ① 官方（The Pattern 模式天象+心理+工具）② AI 占星师（占星×心理机制）③ 热点占星测试（明星/情侣/事件）④ 普通占星爱好者（slideshow/榜单/冷知识/日常）。每个账号都要说明今天发什么或今天不发，不要漏掉任何一个账号。账号定位与形式见 inbox-pengman/04-production/01-strategy-and-platform-research/four-account-tiktok-content-playbook.md。

请按以下格式输出：

## 今日生产卡
| 优先级 | 编号 | 账号 | 今天做什么 | 形式 | 为什么现在做 | 成本 | 通道 |
|---|---|---|---|---|---|---|---|
| P0 |  |  |  |  |  | S/M/L | 快速/实验 |

- 建议总工作量：
- 建议制作顺序：
- 可共用的调研/素材：
- 今日不做：

## 四账号分发
- ① AstrologyWiki 官方：
- ② AI 占星师人设：
- ③ 热点占星测试：
- ④ 普通占星爱好者：

## 候选方向
- Route A / B / C：
- 选题角度：
- 目标账号：
- 平台和形式：
- Hook 方向：
- 证据和去重结论：
- Landing page / CTA 方向：
- 目标用户 / reach 机制：
- 预期转化事件：
- assisted qualified UV 归因路径：
- 本条要验证的增长点：
- 风险或待确认：

## 备选 2-3 个
- 主题：
- 关联文章：
- 推荐形式：
- 选择理由：

## 使用依据
- 文章：
- SEO 主题参考 / 当前优先级：
- 最近发布记录：

## 需要我确认的事
- 请 Pengman 一次选择 1–4 个候选，或明确要求按 P0 组合直接展开；只列真正影响选择的问题。
```

## First Setup Checklist

- [ ] Create or provide the first article index.
- [x] Record that GSC is paused and must not be requested or treated as a blocker.
- [ ] Use weekly published content digests as the published record.
- [ ] Run the prompt manually once.
- [ ] Adjust the output format after 3-5 real uses.
- [ ] Only then consider making this a formal Codex skill or scheduled automation.

## Later Automation Ideas

After the MVP works, possible upgrades:

- Weekday reminder that asks Codex to generate the note.
- Weekly summary of which recommendations were used.
- Formal Codex skill for the workflow.
