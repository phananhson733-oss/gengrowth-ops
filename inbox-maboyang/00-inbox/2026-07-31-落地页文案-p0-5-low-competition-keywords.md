---
title: 落地页完整文案 —— P0-5 Low Competition Keywords（关键词机会地图）
date: 2026-07-31
status: draft（v2，主词已于2026-07-31更换）
主词: find low competition keywords（800/KD26/Parent＝自身）
换词说明: 原主词 `hidden keywords seo` 经2026-07-31 SERP实测为黑帽语义（隐藏文本/cloaking），与产品无关，已废弃
模板依据: 00-inbox/2026-07-30-落地页文案-p0-2-internal-link-audit-完整版.md
选词依据: 02-keyword-research/2026-07-30-gengrowth-p0工具-关键词实测结论与选词.md「SERP实测结果」节
功能依据: 00-inbox/2026-07-29-gengrowth-p0四工具-输入输出与实现流程总结.md 四、P0-5
规格: H3 19个 ｜ FAQ 10条含答案 ｜ Schema 4种 ｜ 正文约1,500英文词（折叠区约640）
---

# 落地页文案：Low Competition Keywords

## 页面元信息

| 项 | 内容 |
|---|---|
| URL | `/tools/low-competition-keywords`（建议，随换词调整） |
| 主词 | `find low competition keywords`（800/KD26/Parent＝自身） |
| 数据机制 | 爬取用户网站 → AI提炼产品卖点 → 发散候选词 → **强制真实搜索量校验** → 聚类 → 映射结构。不接OAuth |
| SEO投入 | 中——SERP前五有三个UGC位，有空间但不轻松 |

### 换词记录与文案影响

| | v1（废弃） | v2（本版） |
|---|---|---|
| 主词 | `hidden keywords seo` 250/KD0 | `find low competition keywords` 800/KD26 |
| 废弃原因 | **语义错配**：该词在英语SEO语境指"把关键词藏进HTML"这一黑帽手法，SERP前十全是cloaking与隐藏文本讨论 | — |
| SERP实况 | — | 前五中三个是UGC（Reddit 95 / LinkedIn 99 / Quora 92），第8名 Productive Blogging DR 63；商业位是SpyFu(80)、Semrush(92)、WordStream(90)、Mangools(82) |

**UGC占前五中的三席是正面信号**：说明Google在这个查询上找不到足够好的商业内容，只能拿论坛讨论填位。一个做得认真的工具页有机会挤进去。

### ⚠️ 主词描述结果，卖点描述机制——两者在页面上分层

团队定位是"**发现之前没被发现的关键词**"（机制），主词是"**找到低竞争关键词**"（结果）。这两者不冲突，是同一件事的两端：**没人覆盖过的角度，天然就是低竞争的**。

文案分层原则：
- **H1/Title 用主词**——用户认得的说法，负责让人推门
- **副标题和正文讲机制**——别人是把现成词表按KD筛一遍，我们是从你卖什么出发反推，所以能挖到从没进过任何词表的角度

这个衔接是顺的，不需要生硬转译。

### 同页承接的次要词

**可放本页**（Parent≠自身，不与本页抢主题）：

| 词 | Vol/KD | 位置 |
|---|---|---|
| low difficulty keywords | 300/KD6 | H3（主词的直接同义表述） |
| niche keyword research | 350/KD5 | H3 |
| keyword gap analysis tool | 350/KD5 | H3 |
| content gap analysis tool | 200/KD0 | FAQ |
| low hanging fruit keywords | 150/KD1 | 正文 |
| content gap seo | 150/KD0 | 正文 |

**不放本页**（Parent＝自身，各自要独立文章）：

| 词 | Vol/KD | 去向 |
|---|---|---|
| how to find low hanging fruit keywords | **700/KD0** | 单独文章（本簇KD最低、量又不小，优先写） |
| content gap analysis | 1,000/KD35 | 单独文章 |
| question based keywords | 250/KD6 | 单独文章 |
| zero search volume keywords | 150/KD2 | 单独文章 |
| zero volume keywords | 100/KD3 | 与上条合并 |

> **`hidden keywords seo` 从所有清单中移除**——不作主词、不作次要词、不写文章。它的语义是黑帽手法，沾上只会让Google对本页主题产生误判。

**Title**（≤60字符）
```
Find Low Competition Keywords Nobody Else Is Targeting
```

**Meta Description**（≤155字符）
```
Most tools filter a keyword list everyone already has. This one reads your site,
works out what you sell, and finds angles that never made it onto anyone's list.
```

---

## [区块1] Hero

```
[H1] Find Low Competition Keywords

[副标题]
Everyone filters the same keyword list by difficulty and calls the leftovers
"low competition." This one starts from what you actually sell — which is how
you find terms that never made it onto anyone's list in the first place.

[主CTA] Find my keywords free
[信任行] Free · Every keyword checked against real search data before you see it
```

> 副标题第一句先点破行业通行做法的局限，第二句给出我们的不同——**这是主词（结果）和卖点（机制）的衔接点，是全页最重要的两句**。

---

## [区块2] 工具主体

```
[输入框1] yourdomain.com                    （必填）
[输入框2] a competitor's URL                （选填）
[输入框3] a seed keyword or topic           （选填）
[按钮] Find low competition keywords

[说明]
We read your site to understand your positioning first. A seed keyword is optional —
if we can see what you sell, we can work outward from there.
```
> 开发注意：**网站URL是核心输入、种子词选填**，与传统关键词工具相反。产品叙事依赖这个顺序，输入框排列不要调换。

---

## [区块3] 结果展示（**变体B·自定义**，非四段式）

```
[H2] What each result tells you

Keyword            "orphan pages seo"
Why it surfaced    Derived from your product positioning — you sell a link
                   structure tool, and this framing has demand your current
                   pages don't address
Verified           450/mo · KD 10 · owns its own topic, so one page can rank for it

[说明]
Three fields on every row: the keyword, why we surfaced it, and what the real data
says. No unexplained suggestions.
```
> ⚠️ **本页不使用四段式结果模块**（Observation/Diagnosis/Recommendation/Artifact）。四段式服务诊断类工具——先发现问题、再解释、再建议。P0-5是生成/规划类，没有"问题"可诊断。**这是六个工具页里唯一的例外，前端需知悉。**

---

## [区块4] 使用指南

```
[H2] How to find low competition keywords

[H3] 1. Enter your site
No login, no verification. A seed keyword is optional.

[H3] 2. We read what you actually sell
Not keyword extraction — positioning, differentiators, and who you're selling to.

[H3] 3. We work outward from there
Candidate terms and natural-language phrasings, including the ones people type
into AI assistants.

[H3] 4. Everything gets checked before you see it
Candidates with no real search demand are filtered out, not shown with a warning.
```

---

## [区块5] 功能解读

```
[H2] What makes a keyword actually winnable

[H3] Low difficulty keywords aren't the same as winnable ones
A difficulty score is a model, not a verdict. Plenty of low-scored keywords have
search results owned entirely by established brands — the score says easy, the page
one says otherwise. We weight both.

[H3] Starts from your product, not a seed word
Paste your URL. We read your pages to understand your positioning, then work
outward. A seed keyword is optional, not the starting point.

[H3] Every suggestion is volume-checked before you see it
AI is very good at generating plausible keywords nobody searches. Every candidate
is checked against real search data first. If it has no volume, it never reaches
your list.

[H3] You can see why each keyword surfaced
Every result is tagged with where it came from: standard expansion, derived from
your positioning, or found by comparing against a competitor.

[H3] Niche keyword research, not head-term lists
Head terms are where everyone already is. The useful output is the specific,
lower-competition phrasing that matches something you genuinely do better.

[H3] Works as a keyword gap analysis tool too
Add a competitor URL and we'll compare coverage — as a secondary signal, not the
main mechanism. Copying a competitor's coverage gets you their ceiling.

[H3] Emerging phrasings, flagged separately
Some of the most valuable terms are ones the data hasn't caught up to. We mark
those rather than hide them, so you can decide whether to bet early.

[H3] Grouped into pages, not dumped as a list
Related keywords are clustered so you know which belong on the same page — and
which would compete with each other if you split them.
```
*（H3小计：8，累计12）*

---

## [区块6] 使用场景

```
[H2] Who this is for
Sites without the authority to win the obvious terms. If the head keywords in your
category are locked up by established tools and publishers, your opening isn't a
better page on the same term — it's a term they haven't covered.
```

---

## [区块7] 一手案例（**本版重写**）

```
[H2] We ran this on ourselves, and it corrected us four times

Planning this site, we tested 404 keywords. Four results changed what we built.

We generated 53 keywords we were confident about — phrasings taken from how people
describe these problems in their own words. Almost every one had zero search volume.
Being right about the problem doesn't mean you're right about the query.

One keyword looked perfect on every metric: 250 searches a month, difficulty score
of zero, and it owned its own topic. We checked the actual search results before
committing. Every result on page one was about a black-hat technique with a similar
name. The metrics were flawless and the meaning was wrong.

Another looked too small to bother with — 70 searches a month. Its search results
had a site with almost no authority sitting in fourth place. It turned out to be
the most winnable term we found.

That's why this tool checks real data before showing you anything, and why it tells
you where each keyword came from. We needed both on ourselves first.
```
> ⚠️ **v1的案例引用了 `internal link audit`(700/KD5) 作为成功发现，本版已删除**——SERP实测显示该词前八全是DR 76-99，并不可打。拿一个后来被证伪的例子做背书，是我们自己最该避免的错误。
> 本版案例改用四次真实纠错，且**包含失败**：53个词全灭、指标完美但语义错、看不上的小词最可打。诚实包含失败比只讲成功更可信，也正好解释了工具为什么要做强制校验。

---

## [区块8] 横向对比

```
[H2] How this compares

[H3] Versus filtering a keyword list by difficulty
Every major tool can sort by difficulty. That finds low-scored keywords inside a
list you already have. It can't find the ones that were never on the list — which
is where the genuinely uncontested angles live.

[H3] Versus a content gap analysis tool
Gap analysis compares you against competitors, so your ceiling is whatever they've
already done. This starts from your own positioning, which can surface angles no
competitor has covered. You can add a competitor URL, but it's a secondary signal
here rather than the mechanism.

[H3] Versus Semrush or Ahrefs keyword research
Theirs are far larger databases and much better at breadth. This is narrower and
starts somewhere else: your product rather than a seed term. For head-term research
and competitive analysis at scale, use theirs.
```
*（H3小计：3，累计15）*

---

## [区块9] 方法论透明（**默认折叠**）

```
[H2] How we decide a keyword is worth showing    [折叠 · the filter]

[H3] The volume check is not optional
Every AI-generated candidate is looked up against real search data before it
reaches your list. Terms with no measurable demand are dropped, not flagged. This
is the single most important step and the main cost of running the tool.

[H3] Why we check whether a keyword owns its own topic
Some keywords can carry a page of their own; others are absorbed by a larger topic
and won't rank separately no matter what you write. We show this per keyword,
because it decides whether you write one page or three.

[H3] Why a difficulty score isn't the last word
Difficulty models estimate how hard a keyword looks. They don't tell you who
actually holds page one. A keyword can score easy while every result belongs to a
site with decades of authority. Read the score, then look at the results.

[H3] Where the natural-language phrasings come from
People phrase things differently asking an assistant than typing into a search box.
We generate both, then apply the same volume check to each — AI-style phrasings are
held to the same standard, not given a pass.
```
*（H3小计：4，累计19）*

---

## [区块10] 限制说明（**默认折叠**）

```
[H2] What this won't do                        [折叠 · 3 known limits]

[H3] It can't read a site that says nothing about itself
The whole mechanism depends on your pages describing what you do. Thin sites, sites
behind a login, or single-page brochures give us very little to work from — in that
case, use a seed keyword.

[H3] It can't confirm what the search results actually look like
We report volume, difficulty, and whether a keyword owns its own topic. We don't
currently fetch page one for you. For anything you're about to build a page around,
look at the results yourself first — a keyword can pass every metric and still be
locked up by sites you can't displace.

[H3] It can't tell you a keyword will convert
Search volume measures interest, not intent to buy. A term can have real demand and
still bring the wrong audience. We show demand; the commercial judgment is yours.
```
> ⚠️ 第二条对应一个**真实的产品缺口**，见文末待办——我们自己做选词时正是靠SERP实查纠正了四次错误，工具目前不做这一步。文案如实写出，不要粉饰。

---

## [区块11] FAQ（10条）

```
[H2] Low competition keywords FAQ

[H3] What are low competition keywords?
Terms where the current search results are weak enough that a new page has a
realistic chance — either because few sites target them, or because the ones
that do aren't covering them well.

[H3] How do you find keywords other tools miss?
By starting somewhere else. Most tools expand a keyword you supply, then let you
filter by difficulty. This one reads your site first, works out your positioning,
and generates candidates from that — so the output reflects what you actually sell
rather than what's already popular.

[H3] Is a low difficulty score enough to pick a keyword?
No, and this is the most common mistake. Difficulty is a model. It can score a
keyword as easy while every result on page one belongs to a site with far more
authority than yours. Treat a low score as a reason to look, not a reason to commit.

[H3] Do I need to enter a seed keyword?
No. If your site describes what you do, that's enough. A seed keyword helps if your
site is thin or you want to explore a direction you haven't built yet.

[H3] Do you check whether AI-generated keywords are real?
Yes, and it's the step that matters most. Every candidate is verified against real
search data before it reaches your list. We built this rule after generating 53
keywords we were confident about and finding almost all had zero searches.

[H3] Where does your search volume data come from?
A third-party keyword data provider. [具体来源待工程确认后填入]

[H3] How is this different from a content gap analysis tool?
Gap analysis compares you to competitors, so the ceiling is what they've already
done. This starts from your own positioning, which can surface angles no competitor
has covered. Competitor comparison is available here as a secondary signal.

[H3] What about keywords with zero search volume — are they worth anything?
Sometimes. A term can have no recorded volume because demand is genuinely forming,
or because it doesn't exist. We label these as emerging rather than filtering them
out silently, so you can make that call.

[H3] Can I analyze a competitor's site instead of my own?
Yes. Enter their URL as the main input and you'll get the angles their positioning
suggests — useful for understanding what they could target, not just what they have.

[H3] How many keywords do I get for free?
[X] verified keywords per run. The limit exists because every candidate costs a real
data lookup to verify. [具体数字待工程确认]
```

---

## [区块12-14] 相关工具 / 相关文章 / 底部CTA

```
[H2] Related tools
· Internal Link Audit — once you know which pages to build, connect them properly
· SEO Quick Wins — for pages that already rank but don't get clicked
· Free SEO Audit — no login, works on any URL

[H2] Related reading
· How to Find Low Hanging Fruit Keywords（700/KD0，本簇优先写的一篇）
· Content Gap Analysis: What It Finds and What It Misses（1,000/KD35）
· Are Zero Search Volume Keywords Worth Targeting?（150/KD2）

[H2] Continue to the next step
A keyword list is Step 2 of four. Push it into your project and turn it into a
site structure.
[按钮] Continue to GenGrowth →
```

---

## Schema（4种）

| Schema | 关键字段 |
|---|---|
| SoftwareApplication | name: Low Competition Keywords / applicationCategory: SEO Tool / offers price 0 |
| FAQPage | 10条 Question + acceptedAnswer |
| HowTo | name: How to find low competition keywords / step ×4 |
| BreadcrumbList | Home → Tools → Low Competition Keywords |

---

## 标题层关键词分布核对

| 位置 | 标题 | 承接词 |
|---|---|---|
| H1 | **Find Low Competition Keywords** | 主词 800/KD26 |
| 区块4 H2 | How to **find low competition keywords** | 主词 + how-to意图 |
| 区块5 H2 | What makes a keyword actually winnable | — |
| 区块5 H3 | **Low difficulty keywords** aren't the same as winnable ones | 300/KD6 |
| 区块5 H3 | **Niche keyword research**, not head-term lists | 350/KD5 |
| 区块5 H3 | Works as a **keyword gap analysis tool** too | 350/KD5 |
| 区块11 H2 | **Low competition keywords** FAQ | 主词 |
| FAQ H3 | What are **low competition keywords**? | 主词 |
| FAQ H3 | How is this different from a **content gap analysis tool**? | 200/KD0 |

主词在标题层出现5次，3个次要词各占一个标题。**Parent＝自身的5个词（合计2,200量）全部留给单独文章**，本页只在相关文章区块链过去。

---

## 待办

- [ ] **URL/slug确认**：`/tools/low-competition-keywords` 为建议值
- [ ] **产品缺口：工具应加入SERP层面的信号，不只是Vol/KD/Parent。** 我们自己选词时被指标误导四次（53词全灭、`hidden keywords seo` 语义错配、`all in one seo` KD9实为DR75+霸屏、`internal link audit` KD5实为DR76-99），全靠SERP实查纠正。**工具若只做搜索量校验，会原样复制我们刚犯的错误**。区块10限制说明已如实写出此缺口，但这是产品该补的，不是文案能绕过的
- [ ] 关键词数据源提供商、免费层每次可校验候选词数量（FAQ第6、10条）待工程确认
- [ ] 本页不使用四段式结果模块，前端需知悉这是六页里唯一例外
- [ ] 区块7一手案例含失败数据（53词全灭、指标完美但语义错），需团队确认是否愿意公开——判断是它比只讲成功更可信，但属对外文案，需拍板
