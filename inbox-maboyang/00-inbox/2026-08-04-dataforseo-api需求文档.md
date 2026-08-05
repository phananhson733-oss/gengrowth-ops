---
title: DataForSEO API 采购需求文档
date: 2026-08-04
背景: 团队决定不再续费 Ahrefs，转用 DataForSEO
目的: 明确需要采购哪些 API 端点，保证日常 SEO 工作不中断
⚠️ 关键提示: 有一项我们最依赖的指标（Parent Keyword）DataForSEO 没有直接对应，见第四节
---

# DataForSEO API 采购需求文档

## 一、先说结论

**必须采购 6 个端点，才能维持现有工作不中断：**

| #   | API                      | 端点                            | 替代 Ahrefs 的什么           |
| --- | ------------------------ | ----------------------------- | ----------------------- |
| 1   | **SERP API**             | Google Organic（Live Advanced） | 手工搜 Google 看前十          |
| 2   | **Keywords Data API**    | Google Ads Search Volume      | 搜索量                     |
| 3   | **DataForSEO Labs**      | Bulk Keyword Difficulty       | KD                      |
| 4   | **Backlinks API**        | Bulk Ranks                    | **DR**（判断 SERP 前十的站强不强） |
| 5   | **Backlinks API**        | Anchors / Referring Domains   | 外链基线 + **自动外链风险评估**     |
| 6   | **Domain Analytics API** | WHOIS                         | **域名注册时间**（判断新站能不能排上去）  |

**⚠️ 两个不能直接替代的：**

| # | 缺什么 | 影响 | 出路 |
|---|---|---|---|
| 1 | **Parent Keyword** | 筛选顺序第 3 步失效 | ✅ 可用 SERP 重合度自己重建，见第四节 |
| 2 | **对外 dofollow 链出域名数** | ⚠️ **外链 SOP 的核心过滤失效**（算不了均分DR，分不出链接农场） | ❓ **能不能做未知，必须采购前问清楚**，见工作流 C-2 |

> 🔴 **第 2 条是采购决策的前置条件。** 如果 DataForSEO 不支持 outbound linked domains，**要在签约前想好备选**，而不是买完才发现外链筛选做不了。

**⭐ 一个附带收益**：这套 API 同时解决了 P0-5 的工程阻塞项「关键词校验数据源」，见第八节。

---

## 二、从工作流倒推，而不是从功能列表里挑

下面是我们实际在跑的六个工作流。**只买这些用得上的，不买用不上的。**

### 工作流 A · 选词验证 —— 最高频，每周都做

**现行筛选顺序**（三轮实测固化下来的）：

```
0. 意图对不对？
1. 这个功能有多少家在免费提供？
2. 查询形态能不能换？（教学型 / 工具型 / 替代型）
3. Parent ＝ 自身            ← ⚠️ DataForSEO 缺
4. SERP 前十有低权重站        ← 需要 DR
5. KD < 30
6. 量级
```

**每个候选词需要的字段**：

| 字段 | 用来判断 | DataForSEO 端点 |
|---|---|---|
| 搜索量 | 第 6 步 | Keywords Data - Google Ads Search Volume |
| KD | 第 5 步 | Labs - Bulk Keyword Difficulty |
| **Parent Keyword** | **第 3 步** | ❌ **无直接对应** |
| SERP 前 10-15 结果 | 第 4 步 | SERP API - Google Organic |
| 每个结果域名的权重 | 第 4 步 | Backlinks - Bulk Ranks |
| 每个结果域名的注册时间 | 第 4 步 | Domain Analytics - WHOIS |

**规模**：每轮 8–30 词，每周 1–2 轮。

### 工作流 B · SERP 实测 —— 目前纯手工，这次可以顺便自动化

现在的做法是**浏览器逐词手工搜、肉眼看 SERP、靠插件读 DR**。三轮下来累计 28 词，每词约 5 分钟。

**DataForSEO 可以把这一步自动化。这不是替代 Ahrefs，是升级。**

需要的组合调用：

```
SERP API 取前 15 条
    ↓ 提取域名列表
Backlinks Bulk Ranks 批量取域名权重
    ↓
Domain Analytics WHOIS 批量取注册时间
    ↓
输出：这个词的前十里有没有「DR<40」或「注册<2年」的站
```

**判定逻辑我们已经有了**（见 `03-content-briefs/2026-08-04-blog选题库存与排期.md`），只是需要工程封装成脚本。

### 工作流 C · 外链基线与风险评估

**两个用途：**

**① 改版前后基线**（90 天计划 1.1 要求，目前这一项是空的）

需要：引荐域名数（RD）、域名权重、哪些页面被链

**② ⚠️ 自动外链的风险评估**（新增需求，重要）

aistorygenerator 从 7/1、astrologywiki 从 7/20 起做自动外链。虽然流量数据不支持"外链造成下滑"的推断，但**风险要单独评估，不能靠流量曲线推断**。

**必须查的四项**：

| 查什么 | 危险信号 | 端点 |
|---|---|---|
| **锚文本分布** | 精确匹配锚文本占比 >20–30% | **Backlinks - Anchors** |
| 来源站质量 | 大量无关主题站、链接农场 | Backlinks - Referring Domains |
| RD 增长曲线 | 陡峭直线上升（自然增长是阶梯状） | Backlinks - History |
| 人工操作 | 有记录即实锤 | GSC（不需要 API） |

**锚文本那条最关键**，也最容易被自动化工具搞砸。

### 工作流 C-2 · ⚠️ 均分DR 计算 —— 外链 SOP 的核心过滤，**采购前必须验证能不能做**

**这一条单独拎出来，因为它是外链 SOP「第二阶段核心过滤」的唯一依据，做不了整套筛选框架就失效。**

依据：`03-content-briefs/2026-06-05-backlink-outreach-sop-v1.1.md` 第 1.5 节。

#### 公式

```
均分DR = DR ÷ 该站 dofollow 链出的唯一域名数
```

**这不是我们发明的指标，是 Ahrefs 自身 DR 计算逻辑的人工可读化。** Ahrefs 官方文档原话：

> *"The amount of 'DR juice' passed from each linking domain is determined roughly by dividing the DR of the linking domain by the number of unique domains that it links to."*

#### 为什么必须有

**只看 DR 分不出链接农场和权威站：**

| 站点 | DR | Dofollow 链出域名 | 均分DR | 判定 |
|---|---:|---:|---:|---|
| businesstomark.com | 62 | **16,709** | 0.004 | ✗ 链接农场 |
| feast-magazine.co.uk | 72 | 6,749 | 0.011 | ✗ 排除 |
| appkod.com | 71 | 3,067 | 0.023 | ✓ 通过 |
| greatercollinwood.net | 53 | 612 | **0.087** | ✓ 通过 |
| techbles.com | 44 | 470 | **0.094** | ✓ 通过 |

**DR 62 的链接农场和 DR 53 的正常站，只看 DR 会选错。**

阈值表：

| DR 范围 | 最低均分DR |
|---|---|
| DR 0–30 | ≥ 0.05 |
| DR 30–50 | ≥ 0.04 |
| DR 50–70 | ≥ 0.025 |
| DR 70+ | ≥ 0.015 |

#### 我们需要的字段（就一个）

> **对任意给定域名，返回它「链出的唯一域名数」，且能按 dofollow 过滤。**

**注意这是「对外链接」（outbound），不是「反向链接」（inbound）。** Backlinks API 绝大部分端点是 inbound 导向的，这一条方向相反。

在 Ahrefs 里的位置：Site Explorer → Overview → **Linked domains**，筛选 Dofollow。

#### ⚠️ DataForSEO 能不能做，我不确定 —— 这是采购前第一要问的问题

**三条可能的路径，按可行性排：**

| 路径 | 说明 | 可行性 |
|---|---|---|
| **① Backlinks 索引反向查询** | 若 API 支持按 `domain_from` 过滤（而非只按 `domain_to`），统计唯一 `domain_to` 即得。**这是理想解** | ❓ **必须问供应商** |
| **② Backlinks Summary 里是否有 outbound 字段** | 部分供应商的 summary 会带 `external_links_count` 一类字段 | ❓ 需查文档 |
| **③ On-Page API 爬取统计** | 爬目标站，统计外链唯一域名 | ⚠️ **对本场景不可行，见下** |

#### 为什么路径 ③ 不可行（重要）

**链接农场恰恰是链出最多的站**——businesstomark.com 链出 16,709 个域名，要统计准确得爬遍全站数千页。

按外链冲刺的实际规模估算：筛 50–100 个候选站才能拿到 13–16 个链接。**每站爬取成本 $3–10 × 100 站 = $300–1,000，与整个外链预算相当。**

**结论：爬取不是这个场景的可行方案，必须靠索引级数据。**

#### 如果 DataForSEO 做不了，三个备选

| 方案 | 说明 | 代价 |
|---|---|---|
| **保留一个最低档 Ahrefs 席位** | 只用来查 Linked Domains | 与"停用 Ahrefs"的初衷冲突，但可能是最省的 |
| **换 Majestic** | 他们有 outbound 数据体系（Trust Flow / Topical Trust Flow） | 指标口径完全不同，阈值表要重建 |
| **降级筛选框架** | 只用 DR + 人工抽查 | ⚠️ **会漏掉链接农场**——SOP 明确写了 Ahrefs 2025-09 更新正是在打击这类站，我们的框架提前识别了它们。降级等于放弃这个优势 |

> 📌 **建议：把这一条作为采购决策的前置条件。** 如果 DataForSEO 不支持 outbound linked domains，**要在签约前就想好备选**，而不是买完才发现外链筛选做不了。

### 工作流 C-3 · 外链健康分析

**这个需求包含三件事，价值和可行性差别很大，要分开看：**

| # | 子需求 | 我们能控制吗 | 价值 |
|---|---|---|---|
| **a** | **锚文本分布 / dofollow-nofollow 比例** | ✅ **能**——这是我们自己买的链接 | 🔴 **高** |
| **b** | 异常检测（垃圾链接突然涌入、负面 SEO） | ⚠️ 部分 | 🟡 中 |
| **c** | 判断该 disavow 哪些劣质外链 | ❌ 基本不能 | ⚪ **低，见下方提醒** |

#### a · 锚文本与 follow 比例 —— 这一条价值最高

**因为它管的是「我们自己建的链接」，不是「别人指向我们的链接」。前者可控，后者基本不可控。**

我们从 7/1（aistorygenerator）和 7/20（astrologywiki）起在跑自动外链。**自动化工具最容易搞砸的就是锚文本分布**。

**需要的字段**：

| 字段 | 危险信号 | 端点 |
|---|---|---|
| **锚文本分布** | **精确匹配占比 > 20–30%** | `backlinks/anchors` |
| 锚文本分类占比 | 品牌词过少、通用词（click here）过多 | 同上，需自建分类逻辑 |
| **dofollow / nofollow 比例** | **只有高 DR dofollow、没有社交/论坛类 nofollow** | `backlinks/summary` → `referring_links_attributes` |
| 链接在页面中的位置 | 大量页脚 / 侧栏链接 | `backlinks/summary` → `referring_links_semantic_locations` |
| 来源平台类型 | 全是同一类平台 | `referring_links_platform_types` |
| 语言 / 国家分布 | 大量不相关语言 | `referring_links_countries`、`referring_links_tld` |

> 📌 **dofollow/nofollow 比例这条，我们的外链 SOP 已经写过**：
> *"这些链接大多是 Nofollow，但它们构成自然的外链档案。**一个新站只有高 DR dofollow 链接却没有基础社交信号，容易触发算法警报。**"*
>
> 所以这不是新方法论，是把已有的 SOP 要求变成可监控的数字。

#### b · 异常检测

| 需要 | 端点 |
|---|---|
| 逐月 RD 新增 / 流失曲线（陡峭直线 = 人工痕迹） | `backlinks/timeseries_new_lost_summary` |
| 批量垃圾分数 | `backlinks/bulk_spam_score` |
| 逐条外链明细（人工复核用） | `backlinks/backlinks` |

**流失数据有个特殊用途**：**我们买的链接被撤掉了没有。** 付费外链掉链是常见问题，`lost backlinks` 能直接看出来。

#### c · ⚠️ 关于 disavow：数据可以有，但动手的门槛很高

**我们自己 7/28 做过的事实核查结论：**

> Google 的 **John Mueller 在 2026 年 3 月明确表示，大多数网站根本不需要 disavow 工具**，并把"清理有毒外链"这种常规操作称为 **"billable waste of time"**。
>
> Disavow 只应用于两种情况：**已收到明确涉及外链的人工处罚通知**，或有强证据判断即将收到。

**Google 现在对低质外链的默认处理是「忽略」，不是「惩罚」。**

这条已经被写进 P0-3 的产品需求，作为一条明确的「**不建议做**」条目——因为"流量掉了 → 一定是外链有毒 → 赶紧 disavow"是这个场景最普遍的错误反应。

**所以：**

| | |
|---|---|
| ✅ **该做** | 建立监控，定期看锚文本比例和 follow 比例（子需求 a） |
| ✅ **该做** | 保留逐条明细的查询能力，**万一收到人工处罚通知时能立刻用** |
| ⚠️ **不该做** | 把"定期清理劣质外链"当成常规运维动作 |

**数据能力要买，但要在文档里写清楚动手门槛，否则容易变成常规性的无效劳动。**

#### 这一条新增的端点

在必须清单基础上，补三个：

```
backlinks/summary                     ← 聚合字段最全（follow比例/位置/平台/国家）
backlinks/bulk_spam_score             ← 垃圾分数
backlinks/timeseries_new_lost_summary ← 新增/流失曲线
```

`backlinks/anchors` 和 `backlinks/backlinks` 已在原清单里。

### 工作流 D · 竞品分析 —— 不定期

做过 astrologywiki 对 Arcaniva / Askaseer 的分析。

| 需要 | 端点 |
|---|---|
| 竞品的排名词 | Labs - **Ranked Keywords** |
| 我们和竞品的关键词交集/差集 | Labs - **Domain Intersection**（对应 Ahrefs 的 Content Gap） |
| 竞品流量估算 | Labs - Domain Rank Overview |

### 工作流 E · 排名监控 —— 每周

**目前主要用 GSC，不需要额外 API。** GSC 的数据是我们自己的真实数据，比第三方估算准。

**唯一可能需要第三方的场景**：想看某个词的实时 SERP 上我们排第几（GSC 有 2–3 天延迟）。用 SERP API 即可，不需要专门的 rank tracking 产品。

### 工作流 F · 周报 —— 每周

**GSC + GA4 + Bing Webmaster，不需要 DataForSEO。**

---

## 三、API 清单：必须 / 应该 / 不需要

### 🔴 必须有（不买就没法工作）

| API | 端点 | 用于工作流 | 说明 |
|---|---|---|---|
| **SERP API** | Google Organic Live Advanced | A、B、E | **最核心的一个**。我们的第 4 步筛选全靠它 |
| **Keywords Data** | Google Ads Search Volume | A | 搜索量。注意这是 Google Ads 的官方数据，跟 Ahrefs 估算值会有出入 |
| **Labs** | Bulk Keyword Difficulty | A | KD。**注意 DataForSEO 的 KD 算法与 Ahrefs 不同，历史数据不可直接对比** |
| **Backlinks** | Bulk Ranks | A、B | 批量取域名权重，判断 SERP 前十强不强 |
| **Backlinks** | Anchors + Referring Domains | C、C-3 | 外链基线 + **锚文本分布监控** |
| **Backlinks** | ⚠️ **对外 linked domains（按 dofollow 过滤）** | **C-2** | **均分DR 计算。能不能做未知，采购前必须确认** |
| **Backlinks** | **Summary** | C-3 | **follow 比例 / 链接位置 / 平台类型 / 国家分布**，聚合字段最全 |
| **Backlinks** | Bulk Spam Score | C-3 | 异常检测 |
| **Backlinks** | Timeseries New/Lost Summary | C-3 | RD 增长曲线 + **买的链接掉没掉** |
| **Backlinks** | Backlinks（逐条明细） | C-3 | 人工复核；**收到人工处罚通知时立刻要用** |
| **Domain Analytics** | WHOIS | A、B | **域名注册时间**。这个在我们的判定里权重很高——"域名 2024-08 注册的站排第 4"是最强的可打信号之一 |

### 🟡 应该有（不买会降低效率，但能绕过）

| API | 端点 | 用于 | 能不能绕过 |
|---|---|---|---|
| Labs | Ranked Keywords | 竞品分析 | 可用 SERP API 逐词查，但很慢 |
| Labs | Domain Intersection | Content Gap | 同上 |
| Labs | Keyword Ideas / Related Keywords | 发散候选词 | 可用 Google 相关搜索 + People also ask 手工挖，但覆盖差 |
| Labs | Search Intent | 筛选顺序第 0 步（意图对不对） | 可以人工判断，但批量时很费时 |

### ⚪ 不需要买

| API | 为什么不需要 |
|---|---|
| **On-Page API**（站点审计） | **我们自己有 P0-4，功能重叠**。<br>⚠️ **例外**：如果 Backlinks 做不了 C-2 的对外链出统计，曾考虑用它爬取替代——**但已评估为不可行**（链接农场动辄链出上万域名，爬全站成本 $3–10/站 × 100 站，与整个外链预算相当）。所以它仍然不买 |
| Content Generation API | 内容我们自己写 |
| Merchant API / App Data / Business Data | 与我们业务无关 |
| Content Analysis（品牌提及） | 与 P0-6 GEO 快照有部分重叠，但 P0-6 要的是 AI 引擎引用，不是网页提及。**先不买** |

---

## 四、⚠️ 最大的缺口：Parent Keyword

### 4.1 为什么这个指标对我们特别重要

Ahrefs 的 **Parent Keyword** 判断的是：**Google 是否把这个词当成一个独立主题**。

- **Parent ＝ 自身** → 可以为它建一个独立页面
- **Parent ≠ 自身** → 流量会被一个更大的主题吸走，单独建页拿不到排名

**这是我们筛选顺序的第 3 步，也是 DR=0 阶段最重要的判据之一。** 我们的选词文档里到处是"Parent＝自身"的标注。

### 4.2 DataForSEO 没有这个指标

他们的 Labs API 有 related_keywords、keyword_suggestions、search_intent，**但没有 Parent Keyword 这个概念**。

### 4.3 三个替代方案

**方案 1 · 用 SERP 重合度自己算**（推荐）

Parent Keyword 本质上就是 SERP 重合度的产物。

```
对候选词 A：
  1. SERP API 取 A 的前 10 结果 URL
  2. 找出排第 1 的 URL
  3. Labs - Ranked Keywords 查这个 URL 排名的所有词
  4. 取其中搜索量最高的那个词 B
  5. 若 B == A          → Parent ＝ 自身  ✅
     若 B 的量 >> A 的量 → Parent ≠ 自身  ❌
```

**成本**：每个词需要 2 次 API 调用（SERP + Ranked Keywords）。

**方案 2 · 词对之间算 SERP 重合率**（更简单，够用）

```
候选词 A 与它的上位词 B：
  分别取前 10 SERP
  若重合 URL ≥ 5 条 → Google 认为是同一主题，A 的 Parent 不是自身
  若重合 < 3 条      → 独立主题
```

**成本**：每对词 2 次 SERP 调用。**这个方案更省，且不依赖 Ranked Keywords。**

**方案 3 · 放弃这个指标，靠 SERP 直接判断**

反正我们最终都要看 SERP。如果一个词的 SERP 上排在前面的页面**标题都不是针对这个词写的**，那它大概率不是独立主题。

**代价**：主观，不可批量，容易漏判。**不推荐作为主方案，可作为快速预筛。**

### 4.4 建议

**采用方案 2，让工程封装进第七节的批量脚本里。**

⚠️ **过渡期要注意**：新算出来的"Parent"与 Ahrefs 的历史标注**口径不同，不能直接混用**。已有选词文档里的 Parent 标注保持原样，标明来源是 Ahrefs；新查的另标。

---

## 五、⚠️ 三个必须提前知道的口径差异

**换数据源不是无痛的。下面三条会影响历史数据的可比性：**

### 5.1 搜索量口径不同

- **Ahrefs**：点击流数据 + 自有模型估算
- **DataForSEO**：Google Ads Keyword Planner 官方数据

**Google Ads 的量级会做区间归并**（比如 100–1K 归成一档），且**会把近义词合并统计**。同一个词两家给出的数字可能差 2–3 倍。

**影响**：选词文档里所有"XXX 词 700 量"的标注，**换源后数字会变**。不要在同一张表里混用两个来源的量级。

### 5.2 KD 算法不同

Ahrefs KD 基于"排进前十需要多少引荐域名"；DataForSEO 的 KD 是自己的模型。

**我们的经验是 KD 本来就不可靠**——三轮实测里 KD 低但 SERP 被锁死的情况出现了 5 次以上。**所以这个差异影响不大，因为我们本来就把 KD 放在筛选顺序的第 5 位。**

### 5.3 域名权重口径不同

- **Ahrefs DR**：0–100
- **DataForSEO Rank**：**0–1000**

**必须建立一张换算参照表**，否则"DR<40 算低权重站"这个判据没法用。

**建议做法**：拿我们已经实测过的 28 个词的 SERP 结果，用 DataForSEO 重跑一遍，**对照出 Ahrefs DR 40 大致对应 DataForSEO Rank 多少**。这是一次性工作，做完就有换算表了。

---

## 六、成本估算

⚠️ **以下为量级估算，采购前请以 DataForSEO 官网当期价格为准。**

DataForSEO 是**按调用付费**，没有订阅门槛，这正是替换 Ahrefs 的主要理由。

**按我们的实际用量估算（每周一轮选词，30 词）：**

| 调用 | 单价量级 | 每轮次数 | 每轮成本 |
|---|---|---|---|
| SERP API（Live Advanced） | ~$0.002 / 次 | 30 | ~$0.06 |
| Search Volume | ~$0.05 / 1000 词 | 30 | <$0.01 |
| Bulk Keyword Difficulty | 批量 | 30 | <$0.01 |
| Bulk Ranks（每词前 15 个域名） | 批量 | ~450 域名 | ~$0.10 |
| WHOIS（同上） | ~$0.02 / 次 | ~450 | ⚠️ **可能是大头** |
| Parent 重建（方案 2，额外 SERP） | ~$0.002 / 次 | 30 | ~$0.06 |

**估算：每轮选词 30 词，约 $0.5–10（WHOIS 是主要变量）。每月 4 轮，$2–40 量级。**

**对比 Ahrefs 起步价 $129/月，成本下降是数量级的。**

**降低 WHOIS 成本的办法**：只对"SERP 里排名靠前但域名不认识"的站查 WHOIS，不要全量查。大厂域名（Semrush / Moz / Ahrefs / Reddit）不用查。**这个过滤逻辑要写进脚本。**

---

## 七、需要工程封装的两个脚本

买了 API 不等于能用。**需要工程做两个封装，否则每次还是要手工拼调用。**

### 脚本 1 · 批量选词验证（最重要）

```
输入：候选词列表（CSV，一列词）

处理：
  对每个词
    ① Keywords Data      → 搜索量
    ② Bulk KD            → KD
    ③ SERP API           → 前 15 结果
    ④ Bulk Ranks         → 每个结果域名的权重
    ⑤ WHOIS（选择性）    → 不认识的域名查注册时间
    ⑥ SERP 重合度        → 重建 Parent 判定（方案 2）

输出：CSV，每行一个词，含
  词 / 量级 / KD / Parent判定 /
  前十里最低域名权重 / 前十里有几个「弱站」/
  有没有 UGC 位（Reddit、Quora）/
  判定建议（可写 / 存疑 / 否决）
```

**这个脚本把现在每词 5 分钟的手工活变成批量跑。**

### 脚本 2 · 外链健康监控（每月跑）

```
输入：域名

输出：
  ① 锚文本分布      ⚠️ 精确匹配占比 —— 核心指标，>20-30% 报警
     按类型聚合：品牌词 / 精确匹配 / 部分匹配 / 裸URL / 通用词
  ② dofollow : nofollow 比例
     ⚠️ 只有 dofollow 没有 nofollow 是异常（外链 SOP 已写明）
  ③ 链接位置分布    正文 vs 页脚/侧栏
  ④ RD 总数 + 逐月新增/流失
     ⚠️ 流失 = 我们买的链接被撤掉了
  ⑤ 增长曲线形态    陡峭直线 vs 阶梯状
  ⑥ 垃圾分数分布
```

**用途优先级**：① ② 是每月必看（管的是我们自己建的链接，可控）；④ 的流失部分用来核对付费外链是否还在；⑥ 只在异常时看。

⚠️ **不要把这个脚本的输出当成 disavow 清单**——见工作流 C-3 的 c 节。

### 脚本 3 · 外链候选站筛选（外链冲刺时用）

```
输入：候选站域名列表

输出：每站
  DR（域名权重）
  对外 dofollow 链出唯一域名数    ← ⚠️ 依赖 C-2 能否实现
  均分DR = DR ÷ 链出域名数
  按 SOP 1.5 阈值表判定：通过 / 均分不足
```

**这个脚本能不能做，取决于第九节问题 0 的答案。**

---

## 八、⭐ 附带收益：同时解决 P0-5 的工程阻塞项

`00-inbox/2026-07-31-前后端交接索引.md` 4.1 节列了三个阻塞项，其中第 3 条是：

> **P0-5 关键词校验数据源**。AI 发散的候选词必须过真实搜索量校验，用哪家 API、免费层每次校验多少个。

**DataForSEO 的 Keywords Data API 正好就是这个答案。**

而且交接文档 4.3 还写过：

> **P0-5 应加入 SERP 层面的信号，不能只做搜索量校验**。我们自己选词被指标误导四次，全靠 SERP 实查纠正。**工具若只校验搜索量，会原样复制这些错误**。

**SERP API 正好补上这一层。** 也就是说：

| 采购项 | 内部工作流 | P0-5 产品 |
|---|---|---|
| Keywords Data | 选词量级 | **解决阻塞项 #3** |
| SERP API | 选词第 4 步 | **补上 4.3 说的 SERP 信号层** |

**一次采购解决两件事。这一点应该写进采购申请里。**

⚠️ **但要注意成本模型的差异**：内部用是每周几十次调用；**产品用是每个用户每次使用都要调用**。如果 P0-5 上线后有量，成本会是另一个数量级，**免费层额度必须设上限**（这也是阻塞项 #1 要定的数字）。

---

## 九、采购前需要确认的问题

| # | 问题 | 为什么要问 |
|---|---|---|
| **0** | 🔴 **Backlinks API 能不能查「某个域名对外链出了多少个唯一域名」，并按 dofollow 过滤？**<br>（即支持按 `domain_from` 反查，而非只按 `domain_to`） | **最重要的一条**。做不了则外链 SOP 的核心过滤失效，均分DR 算不出来，分不出 DR62 的链接农场和 DR53 的正常站。**这一条是采购决策的前置条件，见工作流 C-2** |
| 1 | **SERP API 支持指定 `location` 和 `language` 吗？** | 我们所有实测都是 `hl=en&gl=us`，必须能锁定美国区 |
| 2 | **SERP API 返回的结果里包含 AI Overview 吗？** | 08-04 发现 **AI Overview 的准入门槛低于自然排名**（自然结果全 DR73+，AI Overview 里有小站）。这是我们要跟踪的信号 |
| 3 | **SERP 返回是否包含 Discussions / Videos / People also ask 区块？** | 这些区块会挤压自然结果，是判定"这个词好不好打"的重要输入 |
| 4 | **Backlinks Bulk Ranks 一次能批量查多少域名？** | 影响脚本 1 的调用效率 |
| 5 | **有没有免费额度或试用？** | 建议先用试用额度跑一遍第五节 5.3 的 DR 换算表 |
| 6 | **计费是预充值还是后付费？超额怎么处理？** | 避免 P0-5 上线后被刷爆 |

---

## 十、执行建议

| 序 | 动作 | 谁 |
|---|---|---|
| **0** | 🔴 **先问第九节问题 0**（对外 dofollow 链出域名数能不能查）。**这一条决定要不要留 Ahrefs 席位，必须在签约前问** | 采购 / SEO |
| 1 | 按第三节的🔴清单采购必须端点 | 采购 |
| 2 | 用试用/小额度跑第五节 5.3 的 **DR 换算表**（28 个已实测词重跑一遍） | SEO |
| 3 | 工程封装**脚本 1**（批量选词验证） | 工程 |
| 4 | 用脚本 1 补查缺的数据：`striking distance keywords` 等 4 个词（见选题库存文档第六节） | SEO |
| 5 | 工程封装**脚本 2**（外链风险监控），补上改版前基线缺的外链项 | 工程 |
| 6 | 评估 P0-5 接入方案与免费层额度上限 | 工程 + 产品 |

**第 2 步不能跳过**——没有 DR 换算表，我们所有历史判据（"DR<40 算弱站"）都用不了。

---

*本需求基于 2026-07-31 至 08-04 三轮 SERP 实测（累计 28 词）总结出的实际工作流。价格为量级估算，以官网当期为准。*
