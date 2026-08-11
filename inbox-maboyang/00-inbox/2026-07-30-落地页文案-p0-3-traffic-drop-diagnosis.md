---
title: 落地页完整文案 —— P0-3 Traffic Drop Diagnosis
date: 2026-07-30
status: draft
主词: sudden drop in organic traffic（200/KD2/Parent＝自身）
模板依据: 00-inbox/2026-07-30-落地页文案-p0-2-internal-link-audit-完整版.md
选词依据: 02-keyword-research/2026-07-30-gengrowth-p0工具-关键词实测结论与选词.md
功能依据: 00-inbox/2026-07-29-gengrowth-p0四工具-输入输出与实现流程总结.md 三、P0-3
规格: H3 18个 ｜ FAQ 10条含答案 ｜ Schema 4种 ｜ 正文约1,250英文词（折叠区约560）
---

# 落地页文案：Traffic Drop Diagnosis

## 页面元信息

| 项 | 内容 |
|---|---|
| URL | `/tools/traffic-drop-diagnosis` |
| 主词 | sudden drop in organic traffic（200/KD2/Parent＝自身） |
| 次要词 | sudden drop in website traffic(100/KD2)、organic traffic dropped(40/KD0)、why is my website traffic dropping(30/KD4)、why is my organic traffic down(20/KD2/＝)、ai overviews killing traffic(20/KD0)、indexed but not ranking(10/KD0) |
| 数据机制 | **GSC OAuth 只读**，需**两个时间段**对比数据 |
| SEO投入 | 中——痛点最强但搜索量分散在大量零散问题词上 |

**⚠️ 本页文案按八类根因写，产品当前设计只有四类**
2026-07-30 Reddit补验证（约17帖/540+评论，近一月内7条新帖，是七个工具里痛点最强的）发现真实用户遇到的根因至少有八类。现有设计缺 AI Overviews、去索引、站点可用性、索引正常但曝光崩塌 四类。**文案已按八类写，产品逻辑需同步补上，否则页面承诺大于实际能力。**

**Title**
```
Sudden Drop in Organic Traffic? Find the Actual Cause
```

**Meta Description**
```
Eight different problems look identical in your analytics and need different fixes.
Connect Search Console and get a root cause, not a checklist of twenty maybes.
```

---

## [区块1] Hero

```
[H1] Sudden Drop in Organic Traffic

[副标题]
Eight different problems look identical in your analytics. Rankings, clicks,
AI Overviews, indexing, uptime — each needs a completely different fix, and
guessing wrong costs you weeks.

[主CTA] Connect Search Console
[信任行] Free · Read-only access · Disconnect anytime
```

---

## [区块2] 工具主体

```
[按钮] Connect Search Console
[选择器] Compare: [last 28 days] vs [previous 28 days ▾]
[说明]
We compare two periods of your Search Console data — impressions, clicks, position,
and indexing status — and work through the possible causes in order. Read-only.
```
> 开发注意：**时间段选择器是本工具的必需输入**，不像P0-1只看单一时间段。默认"最近28天 vs 前28天"，需支持自定义，并支持"同比去年同期"（判断季节性必需）。

---

## [区块3] 结果展示（变体A·四段式）

```
[H2] What a diagnosis looks like

Observation
Organic clicks down 34% (last 28 days vs. previous 28)
Average position unchanged: 6.2 → 6.3 · Impressions flat: 41,200 → 40,850
Drop concentrated in /blog/ — category pages unaffected

Diagnosis
Rankings didn't move and neither did impressions. People are seeing you and not
clicking, and only in one section of the site. The two usual causes are a title
and meta that stopped matching intent, or an AI Overview now answering the query
before the click.

Recommendation
Start with the 8 queries carrying most of the loss. For each, check whether an
AI Overview appeared in the last month — if it did, the fix is content that earns
the click anyway, not a rewrite.

Artifact
Root-cause breakdown per query cluster and per site section, with the affected
page list, exportable.
```

---

## [区块4] 使用指南

```
[H2] How to diagnose a traffic drop

[H3] 1. Connect Search Console and pick two periods
Read-only. Year-over-year comparison is available and necessary for seasonality.

[H3] 2. We rule out causes in order
Seasonality first, because it's the most common false alarm. Then rankings, then
clicks, then reachability.

[H3] 3. Read the result by site section
Sitewide totals hide the most useful signal — see below.

[H3] 4. Fix by cause, not by checklist
Each of the eight causes has a different fix. The report tells you which one you're
looking at.
```

---

## [区块5] 功能解读 — 八类根因

```
[H2] The eight causes of a sudden drop in organic traffic

[H3] Seasonal — not a real drop
Year-over-year for the same weeks, not last month vs. the month before. Plenty of
"drops" are demand doing what it does every year.

[H3] Rankings actually fell
Same queries, worse positions. The case most people assume they have, and one of
the least common of the eight.

[H3] Rankings held, clicks fell
Still ranking, people stopped clicking. Usually a title and meta that no longer
match what searchers expect.

[H3] AI Overviews killing traffic
Position unchanged, impressions unchanged, clicks gone. An AI summary now answers
the query above you and the click never has to happen.

[H3] Indexed but not ranking
Still in the index, no longer surfacing. Usually a quality or relevance signal
rather than a technical fault.

[H3] Pages fell out of the index
Not a ranking problem — the pages aren't eligible to rank at all. We check
indexation status across both periods.

[H3] Impressions collapsed while pages stayed indexed
Technically indexed, but Google stopped showing you. Different from deindexing and
needs a different response.

[H3] The site was unreachable
Downtime, server errors, or a robots change during the drop window. Easy to miss
weeks later, and it explains drops nothing else can.
```
*（H3小计：8，累计12）*

---

## [专属] 段落级定位（不进编号体系，见架构文档3.1a）

```
[H2] When one section drops and the rest is fine

The most confusing drops aren't sitewide. A homepage down 80% while category pages
hold steady is a completely different diagnosis than a uniform decline — and a
sitewide average will hide it entirely.

[H3] Broken out by site section, not just totals
Results are grouped by URL pattern, so a blog-only drop reads as a blog-only drop.

[H3] Broken out by query cluster
The same page can gain on one set of queries and lose on another. Netting them
together produces a number that means nothing.
```
*（H3小计：2，累计14）*

> 开发注意：**段落级定位是产品要求，不只是文案**。当前设计只输出全站结论，需要补上按URL模式和按查询集群的拆分。真实用户案例："Homepage traffic down 80% since Sept 2024, but category pages are fine."

---

---

## [区块6] 使用场景

```
[H2] Who this is for
Anyone watching a graph go down and not knowing which of eight things caused it.
It's most useful in the first week — before you've spent time fixing the wrong
thing.
```

---

## [区块8] 横向对比

```
[H2] How this compares

[H3] How this differs from SEO Quick Wins
Same detection engine, opposite starting point. This one is for when something
already fell. SEO Quick Wins is for when nothing is broken and you want more.

[H3] What Search Console alone won't do
Search Console shows you the drop. It won't rule out seasonality, separate a
ranking loss from a click loss, or tell you which of eight causes you're looking
at — that comparison is the whole job here.
```
*（H3小计：2）*

---

## [区块9] 方法论透明（**默认折叠**）

```
[H2] How we rule causes in and out          [折叠 · the order we check]

[H3] Why order matters
Seasonality is checked first because it's the most common false alarm — diagnosing
a technical cause for a seasonal dip wastes weeks. Reachability is checked last
because it's the rarest.

[H3] What we compare
Impressions, clicks, average position, and indexation status, for the same query
set across both periods. Same queries, not top queries — otherwise you're comparing
two different sets and the numbers don't mean anything.

[H3] How we detect AI Overview impact
Position flat, impressions flat, clicks down is the signature. We flag it as a
likely cause rather than a confirmed one, because Search Console doesn't report
AI Overview presence directly.
```
*（H3小计：3，累计17）*

---

## [区块10] 限制说明（**默认折叠**）

```
[H2] What this diagnosis can't do          [折叠 · 3 known limits]

[H3] It can't confirm an AI Overview took your click
Search Console doesn't report whether an AI Overview appeared. We infer it from the
pattern — flat impressions, flat position, lost clicks — which is strong evidence
but not proof. Check the SERP manually for your top affected queries.

[H3] It can't see anything outside Search Console
Referral traffic, paid, social, and direct are invisible here. If your drop is
sitewide across all channels, the cause is probably not search, and this is the
wrong tool.

[H3] It can't tell you a manual action happened
Manual penalties appear in Search Console's own Security & Manual Actions report,
not in performance data. Check there first if the drop was sudden and total.
```
*（H3小计：3，累计20）*

---

## [区块11] FAQ

```
[H2] Traffic drop FAQ

[H3] Why did my organic traffic drop suddenly?
Most sudden drops come down to one of eight causes: seasonality, a ranking drop, a
click-through drop with rankings intact, AI Overviews, loss of indexing, ranking
without surfacing, an impressions collapse, or site downtime during the window.
They look identical in a traffic graph and need different fixes.

[H3] My rankings are the same but traffic dropped — why?
You're still appearing, people stopped clicking. Either your title and meta no
longer match what searchers expect, or something above you in the results — an AI
Overview, a featured snippet, a new ad block — is absorbing the click.

[H3] Are AI Overviews killing my traffic?
If your position and impressions are unchanged while clicks fell, that's the
signature. Search Console doesn't report AI Overview presence, so we flag it as
likely and recommend checking the live SERP for your top affected queries.

[H3] How do I know if a Google update caused it?
Line the drop's start date against known update rollout dates. If it starts sharply
within a rollout window and hits a whole content type at once, an update is likely.
Gradual declines usually aren't updates.

[H3] How much of a drop is normal fluctuation?
Day-to-day swings of 10–20% are normal on most sites. What matters is a sustained
change across a week or more, and whether it's concentrated in one section.

[H3] What if only part of my site dropped?
That's the more useful case, because it narrows the cause considerably. Results are
broken out by site section for exactly this reason — a blog-only drop and a
sitewide drop have almost nothing in common.

[H3] How far back can you compare?
Search Console retains 16 months of data, so year-over-year comparison is available
for most sites. That matters for seasonality, which you can't rule out with a
month-over-month view.

[H3] Do you need Google Analytics too?
No, Search Console alone. That also means we only see organic search — if your drop
spans paid, referral, and direct as well, the cause is upstream of search.

[H3] Indexed but not ranking — is that the same as deindexed?
No, and the fix is different. Deindexed means the page is gone from the index and
can't rank at all. Indexed but not ranking means it's eligible and Google is
choosing not to surface it, which is usually a quality or relevance signal.

[H3] How do I know when it's recovering?
Re-run the comparison with the drop period as your baseline. Recovery usually shows
in impressions before clicks, so an impressions rise is the earlier signal.
```

---

## [区块12-14] 相关工具 / 相关文章 / 底部CTA

```
[H2] Related tools
· SEO Quick Wins — for when nothing broke and you want more
· Internal Link Audit — if the cause turns out to be reachability
· Free SEO Audit — no login, works on any URL

[H2] Related reading
· Why Is My Website Traffic Dropping? A Diagnostic Walkthrough
· AI Overviews and the Clicks They Take
· Indexed but Not Ranking: What It Means and What to Do

[H2] Continue to the next step
Once you know the cause, the fix belongs in your GenGrowth project.
[按钮] Continue to GenGrowth →
```

---

## Schema（4种）

| Schema | 关键字段 |
|---|---|
| SoftwareApplication | name: Traffic Drop Diagnosis / applicationCategory: SEO Tool / offers price 0 |
| FAQPage | 10条 Question + acceptedAnswer |
| HowTo | name: How to diagnose a traffic drop / step ×4 |
| BreadcrumbList | Home → Tools → Traffic Drop Diagnosis |

---

## 标题层关键词分布核对

| 位置 | 标题 | 承接词 |
|---|---|---|
| H1 | **Sudden Drop in Organic Traffic** | 主词 200/KD2 |
| 区块4 H2 | How to **diagnose a traffic drop** | how-to意图 |
| 区块5 H2 | The eight causes of a **sudden drop in organic traffic** | 主词 |
| 区块5 H3 | **AI Overviews killing traffic** | 20/KD0 |
| 区块5 H3 | **Indexed but not ranking** | 10/KD0 |
| 区块10 H2 | **Traffic drop** FAQ | 主词变体 |
| FAQ H3 | Why did **my organic traffic drop** suddenly? | why is my organic traffic down 20/KD2/＝ |
| FAQ H3 | **Are AI Overviews killing my traffic?** | 20/KD0 |

主词在标题层出现3次，5个次要词分布在H3与FAQ问题里。FAQ问题句式本身承接了 `why is my website traffic dropping`(30/KD4) 等问题词。

---

## 待办
- [ ] **产品需从四类根因扩到八类**（缺AIO、去索引、站点可用性、索引正常但曝光崩塌），否则本页文案承诺大于能力
- [ ] **产品需支持按URL模式和查询集群的段落级拆分**，当前只输出全站结论
- [ ] 时间段选择器需支持同比去年同期，判断季节性必需
- [ ] AIO检测目前是"按模式推断"而非确证，页面已如实写明，产品端不要做成确定性结论
