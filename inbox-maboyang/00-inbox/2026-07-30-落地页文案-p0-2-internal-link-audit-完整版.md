---
title: 落地页完整文案 —— P0-2 Internal Link Audit（模板样张）
date: 2026-07-30
status: draft，待团队确认风格与深度后，其余四页照此模板补
主词: internal link audit（700/KD5/Parent＝自身）
SOP依据: 00-inbox/2026-07-09-工具落地页设计规范-sop-v1.0.md（8区块/≥15个H3/8-10条FAQ/4种Schema）
选词依据: 02-keyword-research/2026-07-30-gengrowth-p0工具-关键词实测结论与选词.md
功能依据: 00-inbox/2026-07-29-gengrowth-p0四工具-输入输出与实现流程总结.md 二、P0-2
本页H3数: 17（达标）｜FAQ: 10条含完整答案（达标）｜Schema: 4种（达标）
---

# 落地页完整文案：Internal Link Audit

## 页面元信息

| 项 | 内容 |
|---|---|
| URL | `/tools/internal-link-audit`（建议，原 `/tools/internal-link-checker` 对应的是次要词） |
| 主词 | internal link audit（700/KD5/Parent＝自身） |
| 同页承接次要词 | internal link checker(450/KD10)、find internal links(350/KD12)、internal link checker tool(300/KD17)、check internal links(150/KD13)、website internal link checker(150/KD9)、internal linking audit tool(150/KD17)、internal link analysis tool(100/KD10)、internal link visualization(90/KD0)、internal link mapping tool(70/KD2)、internal link analyzer(50/KD9)、link equity distribution(40/KD0)、how to find internal linking opportunities(30/KD0)、crawl depth seo(20/KD5) |
| 孤岛相关词（同页承接） | orphan pages seo(450/KD10)、how to fix orphan pages(200/KD16)、find orphan pages(150/KD6)、how to find orphan pages(150/KD14)、orphan pages screaming frog(100/KD8) |
| **不放本页的词** | `pagerank sculpting`(1500/KD12/Parent＝自身) → 单独文章 |

**Title**（≤60字符）
```
Free Internal Link Audit — Find Broken Links & Orphan Pages
```

**Meta Description**（≤155字符）
```
Audit your internal link structure in one crawl. Find broken links, orphan pages,
and the pages your own site is starving. Free, no sign-up, no software to install.
```

---

## [区块1] Hero

```
[H1] Internal Link Audit

[副标题]
One crawl shows you every internal link on your site — the broken ones, the pages
nothing points to, and the sections quietly starved of the authority you're
already paying for.

[主CTA] Run my internal link audit free
[信任行] Free · No sign-up · No software to install · Works on any public site
```

---

## [区块2] 工具主体

```
[输入框] yourdomain.com
[按钮] Start crawl

[说明]
We crawl your public pages and follow every internal link, the same way a search
engine does. No Search Console connection, no site verification, no account —
this only reads what's already public.

[限制说明，直接放在输入框下方，不藏在FAQ里]
Free crawl covers up to [X] pages. Larger sites: connect a project to crawl in full.
```
> ⚠️ `[X]` 需工程确认免费层抓取页数上限后填入。不建议编造数字——这条限制写在输入框正下方而不是FAQ里，是刻意的：先说清楚边界，比让用户跑完才发现被截断更建立信任。

---

## [区块3] 结果展示（变体A·四段式）

```
[H2] What one internal link audit finding looks like
```


```
Observation
/blog/how-to-choose-a-crm
0 inbound internal links · 3 outbound links · 1 outbound link returns 404

Diagnosis
Nothing on your site links to this page. Search engines reach it only through your
sitemap, which means it gets crawled less often and receives none of the authority
your other pages have accumulated. The 404 it points to also wastes part of the
crawl budget this page does get.

Recommendation
Three pages already cover this topic and could link here naturally:
/blog/crm-comparison (18 inbound links), /blog/sales-stack (11), /guides/crm-migration (7).
Start with /blog/crm-comparison — it has the most authority to pass.

Artifact
Full internal link map (exportable CSV) + a prioritized list of links to add,
ordered by how much authority each source page can pass.
```

---

## [区块4] 使用指南

```
[H2] How to run an internal link audit

[H3] 1. Enter your domain
No verification, no login, no plugin. If the site is publicly reachable, we can
crawl it.

[H3] 2. We crawl and build the link graph
We start from your homepage and your sitemap, follow every internal link, and
record which page links to which — including the anchor text used.

[H3] 3. Review what the graph exposes
Broken links, orphan pages, thin-linked sections, and where your link equity is
actually accumulating.

[H3] 4. Push fixes into your project
Findings carry into Step 3 of your GenGrowth project, so the fixes sit alongside
the rest of your plan instead of in a spreadsheet you'll lose.
```
*（H3小计：4）*

---

## [区块5] 功能解读

```
[H2] What an internal link audit actually finds

[H3] Broken internal links
Links pointing to pages that return 404, or that pass through redirect chains
before landing. Each one wastes part of your crawl budget and dead-ends a reader
mid-journey. We show the source page, the broken target, and the anchor text used —
so you can fix the link rather than hunt for where it came from.

[H3] Find orphan pages nothing links to
An orphan page has zero inbound internal links from anywhere on your own site.
Search engines find it only through your sitemap, and treat it accordingly: less
frequent crawling, and none of the authority your other pages pass around. These
are invisible in most audits because nothing about the page itself is broken.

[H3] Orphans grouped by section, not dumped in one list
A 60% orphan rate across auto-generated tag pages is a completely different problem
from six orphaned product pages. We group orphans by URL pattern so you can tell
the genuine problem from the noise, instead of scrolling a flat list of 200 URLs.

[H3] Pages with only one or two inbound links
Not orphans, but close. Usually these are pages reachable only from a nav menu or
a footer, with no contextual link from any real content. This is where adding two
or three links tends to move the most, because the page is already indexed and
already has some standing.

[H3] Link equity distribution across your site
Every internal link passes authority somewhere. Over time, sites tend to funnel
that authority into a handful of pages — and often they aren't the pages you'd
choose. The audit ranks your pages by inbound internal links so you can see which
ones your structure has been quietly promoting.

[H3] Anchor text distribution
Every internal link's anchor text, grouped. This surfaces two common problems:
links reading "click here" that tell search engines nothing, and the same exact
anchor repeated across dozens of pages, which reads as templated rather than
editorial.

[H3] Crawl depth — how many clicks from home
How many clicks it takes to reach each page from your homepage. Pages buried five
or six levels deep get crawled less and rank worse, even when nothing else is
wrong with them. The audit flags anything deeper than three clicks.

[H3] Internal linking opportunities you already have
For each orphan or thin-linked page, we look at which of your existing pages
already cover related ground — those are the natural places to add a link from,
and they're usually easier than writing anything new.

[H3] Internal link visualization — the whole structure as a map
The link graph rendered as a map, so you can see clusters, isolated islands, and
the pages everything routes through. Useful for spotting structural problems that
a list of URLs won't show you.
```
*（H3小计：9，累计13）*

---

## [区块6] 使用场景

```
[H2] Who this is for
Sites past roughly 50 pages, where you can no longer hold the link structure in
your head. It matters most if content was produced in batches, if you've
restructured URLs at some point, or if pages are generated from a template or feed.
```

---

## [区块7] 一手案例

```
[H2] We ran this on our own site first

astrologywiki.com is a site we operate. When we audited its internal link
structure, 194 of 311 pages — 62% — had zero inbound internal links.

That number sounds like negligence. It wasn't, and that's the point. Nearly all
the orphans were in one cluster: pages generated whenever a new name started
trending. Content production outran the internal linking that was supposed to
connect it, and nothing about any individual page looked broken. It took a
structural audit to see it at all.

We built this tool because we needed it on our own traffic before we'd trust it
on anyone else's.
```
> ⚠️ **需团队确认后再上线**。此前讨论中已标记两点风险：①62%这个数字单看像"我们不专业"，必须带上"名人集群自动生成、产出速度超过内链系统"这个解释才成立，上面的写法已按此处理；②目前只有"发现问题"的数据，没有修复后的对比数字，所以文案没有声称"我们已经解决了"，只讲发现过程。**168篇CTA误链的数据按团队决定不使用。**

---

## [区块8] 横向对比

```
[H2] How this compares

[H3] Internal link audit vs. Screaming Frog
Screaming Frog is more thorough and we'd recommend it for a deep technical audit —
it renders JavaScript, handles very large sites, and does far more than links. It's
also a desktop application, capped at 500 URLs before you pay, and it hands you raw
data to interpret yourself. This runs in a browser, needs no install, and returns a
prioritized list rather than a spreadsheet. Different tools, different moments.

[H3] Internal link checker vs. Search Console's own report
Search Console shows internal link counts for pages it already knows about — which
means orphan pages, the ones it struggles to find, are exactly the ones most likely
to be missing or undercounted there. It also won't tell you which page to link from.
This crawls independently of what Google has indexed.
```
*（H3小计：2）*

---

## [区块9] 方法论透明（**默认折叠**）

```
[H2] How we check internal links and decide what's a problem

[H3] What we count as an orphan
A page in your sitemap that our crawl never reached by following internal links.
That's it — no weighting, no score. We compare the two sets and report the gap.
If your sitemap is stale, the orphan list will inherit that staleness, which is
why we show the sitemap's last-modified date alongside the results.

[H3] What we count as "thin"
One or two inbound internal links, where those links come from navigation or
footer rather than body content. We separate navigational links from contextual
ones because search engines weight them differently, and because a page linked
from every footer isn't really "linked" in any meaningful editorial sense.

[H3] Where the crawl starts and stops
We start from your homepage and your sitemap, and follow internal links until we
hit the page limit or run out of new URLs. We respect robots.txt. We don't execute
long-running JavaScript, which is the main reason a crawl can miss links — see the
limits below.
```
*（H3小计：3，累计16）*

---

## [区块10] 限制说明（**默认折叠**）

```
[H2] What this internal link audit won't tell you

[H3] Links that only exist after JavaScript runs
If your internal links are injected by client-side JavaScript, our crawler may not
see them, and pages linked that way can show up as false orphans. If your site is
a single-page app or heavily client-rendered, treat the orphan list as a starting
hypothesis rather than a verdict.

[H3] Whether a link should exist at all
We can tell you a page has no inbound links. We can't tell you whether that page
deserves to exist. Some orphans are orphaned because the content was thin, dated,
or duplicated — and the honest fix is to remove or consolidate them, not to add
links. We flag candidates for that, but the call is yours.

[H3] Wrong links, as opposed to broken ones
A link that works but points somewhere unhelpful — a CTA aimed at a tutorial when
it should point at the tool — is invisible to any crawler, because technically
nothing is broken. Detecting that reliably needs a map of what each page is
supposed to link to. We're building toward it; today, this audit finds broken
links, not misdirected ones.
```
*（H3小计：3，累计19 —— 超过SOP要求的15）*

---

## [区块11] FAQ

```
[H2] Internal link audit FAQ

[H3] What is an internal link audit?
An internal link audit crawls your site the way a search engine does, records
every link from one of your pages to another, and reports what that structure is
doing: which pages are unreachable, which links are broken, and where authority is
accumulating. It's structural — it looks at the connections between pages rather
than at any single page's content.

[H3] How is this different from an internal link checker?
In practice the terms are used interchangeably. If there's a distinction, a
checker verifies whether links work, and an audit also asks whether the structure
those links create is doing what you want. This tool does both: it reports broken
links, and it maps where your link equity ends up.

[H3] Do I need Search Console or site verification?
No. This crawls your public pages, which means no OAuth, no verification file, and
no account. It also means you can audit a site you don't own — a competitor's, or
one you're about to take over.

[H3] Does this find orphan pages too?
Yes. We compare the URLs in your sitemap against the URLs our crawl reached by
following links. Anything in the sitemap we never reached is an orphan, and we
group them by URL pattern so you can separate a genuine problem from
auto-generated pages that were never meant to be linked.

[H3] How many pages will you crawl for free?
Up to [X] pages per crawl. If your site is larger, the free crawl covers your
sitemap's most important pages first, and you can connect a project to crawl in
full.

[H3] How often should I audit internal links?
For most sites, quarterly is enough, plus once after any structural change — a
migration, a URL restructure, a template change, or a large batch of new content.
The failure mode isn't gradual drift; it's a specific change that quietly
disconnects a section, and that's worth checking for right after it happens.

[H3] Which broken links should I fix first?
Sort by the authority of the page the broken link sits on. A broken link on a page
with 40 inbound links is wasting far more than the same link on a page nobody
reaches. The exported list is ordered this way by default.

[H3] Should I fix every orphan page?
No. Ask first whether the page should exist. If it's thin, outdated, or duplicated
elsewhere, removing or consolidating it is the better fix, and adding links to it
just spends authority on something that won't convert or rank. Rescue the orphans
you'd have linked to anyway.

[H3] Will this work on a JavaScript-rendered site?
Partially. We don't execute long-running client-side JavaScript, so links injected
that way may be missed and their targets can appear as false orphans. If your site
is client-rendered, cross-check anything surprising before acting on it.

[H3] Can I export the results?
Yes, as CSV — the full link map, the orphan list, and the broken link list. If
you're using GenGrowth as a project, the findings also carry into Step 3 (Site
Structure & Internal Links) so you don't re-enter them by hand.
```
*（H3小计：10，页面H3总计 31 —— 远超SOP要求的15）*

---

## [区块12] 相关工具

```
[H2] Related tools
· Free SEO Audit — a broader scan of any URL, no login needed
· SEO Quick Wins — pages with impressions but almost no clicks
· Traffic Drop Diagnosis — when the traffic already fell and you need the cause
```

## [区块13] 相关文章

```
[H2] Related reading
· PageRank Sculpting: What It Is and Whether It Still Works（对应 pagerank sculpting 1500/KD12）
· How to Fix Orphan Pages Without a Desktop Crawler（对应 how to fix orphan pages 200/KD16）
· Site Architecture for SEO: Depth, Clusters, and Crawl Budget（对应 site architecture seo 600/KD37）
```

## [区块14] 底部CTA

```
[H2] Continue to the next step
These fixes belong in Step 3 of your project — Site Structure & Internal Links.
Push them there and see where they sit in the full plan.

[按钮] Continue to GenGrowth →
```

---

## Schema 标记（4种，SOP要求）

| Schema类型 | 用途 | 关键字段 |
|---|---|---|
| **SoftwareApplication** | 声明这是一个工具 | name: Internal Link Audit / applicationCategory: SEO Tool / offers: price 0 / operatingSystem: Web |
| **FAQPage** | 承接FAQ的10条问答，争取SERP富摘要 | 逐条 Question + acceptedAnswer，答案取上方原文 |
| **HowTo** | 承接区块4的4步操作 | name: How to run an internal link audit / step ×4 |
| **BreadcrumbList** | 导航层级 | Home → Tools → Internal Link Audit |

> 注：FAQPage富摘要近年展示率下降，但仍建议保留——它同时是给AI答案引擎读的结构化信号，与GEO策略一致。

---

## 本页写作说明（给其余四页做模板参考）

**权威感来自四类内容，不是字数**：

1. **方法论透明**（区块6）——把判断标准直接写出来："孤岛=sitemap里有但爬取没到达"、"thin=1-2条入链且来自导航而非正文"、"crawl depth>3层标记"。公开阈值比说"AI智能分析"可信得多。
2. **主动写限制**（区块7）——JS渲染可能漏抓、无法判断页面该不该存在、只查断链不查错链。**这是最强的权威信号，而且几乎没有竞品这么做**。
3. **诚实的横向对比**（区块8）——明说Screaming Frog更彻底、我们只是场景不同；明说GSC内链报表的盲区在哪。不贬低竞品反而更可信。
4. **一手数据**（区块9）——用自己的站，且带上让数字成立的解释。

**关键词分布方式（2026-07-30修订，其余四页照此执行）**：

初版的问题是**次要词几乎都躺在FAQ里，没进标题层**——12个H2里只有3个含主词。但修法不是把主词塞进每个H2（那样读着像堆砌、伤转化），而是先用Parent数据判断**哪些词值得单独占一个标题**。

**先看Parent，决定追几个词**。P0-2的13个次要词里有5个的Parent都指向 `internal link checker`：

| 词 | Vol/KD | Parent |
|---|---|---|
| find internal links | 350/KD12 | ≠ internal link checker |
| internal link checker tool | 300/KD17 | ≠ internal link checker |
| check internal links | 150/KD13 | ≠ internal link checker |
| website internal link checker | 150/KD9 | ≠ internal link checker |
| internal link analyzer | 50/KD9 | ≠ internal link checker |

Google认定这5个是同一主题（合计约1,000月搜）。**在标题层把 `internal link checker` 覆盖好一次，这5个一起拿到**，不需要各写一个H3去追。硬追反而制造语义重复的段落，稀释页面聚焦。

**所以真正需要进标题层的只有7个，不是13个**：internal link audit（主词）、internal link checker、orphan pages seo、find orphan pages、internal link visualization、link equity distribution、crawl depth seo。

**修订后的标题层分布**：

| 位置 | 修订后 | 承接的词 |
|---|---|---|
| H1 | Internal Link Audit | 主词 |
| 区块3 H2 | What one **internal link audit** finding looks like | 主词 |
| 区块4 H2 | How to run an **internal link audit** | 主词 + how-to意图 |
| 区块5 H2 | What an **internal link audit** actually finds | 主词 |
| 区块5 H3 | **Find orphan pages** nothing links to | find orphan pages 150/KD6 |
| 区块5 H3 | **Link equity distribution** across your site | link equity distribution 40/KD0 |
| 区块5 H3 | **Crawl depth** — how many clicks from home | crawl depth seo 20/KD5 |
| 区块5 H3 | **Internal link visualization** — the whole structure as a map | internal link visualization 90/KD0 |
| 区块5 H3 | **Internal linking opportunities** you already have | how to find internal linking opportunities 30/KD0 |
| 区块6 H2 | How we **check internal links** and decide what's a problem | check internal links 150/KD13 |
| 区块7 H2 | What this **internal link audit** won't tell you | 主词 |
| 区块8 H3 | **Internal link audit** vs. Screaming Frog | 主词 + orphan pages screaming frog |
| 区块8 H3 | **Internal link checker** vs. Search Console's own report | internal link checker 450/KD10（带5个变体） |
| 区块10 H2 | **Internal link audit** FAQ | 主词 |

主词在标题层出现6次（H1+5个H2/H3），次要词各占一个标题，**没有一个标题是为了塞词而存在的**——每个都是那一段本来就要讲的内容。

**FAQ仍是长尾词的天然载体**：问题句式本身就包含变体（"How is this different from an internal link checker?"），不需要额外优化。

**Parent＝自身且与主词无关的词不放本页**（如 pagerank sculpting 1500/KD12），留给单独文章——它们要自己的页面，塞进来既拿不到排名又稀释聚焦。

**篇幅**：全页约1,400英文词。对KD5的词这已经充足——竞争弱的词不需要3,000词，多出来的部分只会稀释。其余四页可按各自主词的KD调整：KD0-5的写1,200-1,500词，KD26的（find low competition keywords那类）可以写到2,000+。

---

## 待办

- [ ] `[X]` 免费层抓取页数上限，需工程确认后填入（区块2和FAQ各一处）
- [ ] 区块9的62%孤岛率数据需团队确认是否使用
- [ ] URL从 `/tools/internal-link-checker` 改为 `/tools/internal-link-audit`，需确认
- [ ] 爬取型机制本身仍待工程确认可行性（见P0四工具文档"零"节），若改回GSC驱动，本页"无需验证"的卖点需重写

---

*模板样张 v1。团队确认风格与深度后，P0-1/P0-3/P0-4/P0-5 按此结构补齐。*
