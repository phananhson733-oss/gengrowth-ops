---
title: 数据分析 · shortsbinge.com GSC 最新导出诊断（2026-10-05 ~ 10-11）
date: 2026-10-19
status: ready-for-review
version: v1.0
data: GSC Performance 导出（网页搜索，7 天）；GA4 着陆页导出（2026-09-14 ~ 10-14，仅作交叉验证）
---

# GSC 最新数据诊断 · shortsbinge.com

## 0. 数据口径与限制

| 项目 | 说明 |
|------|------|
| GSC 日期 | 2026-10-05 ~ 2026-10-11（7 天） |
| 搜索类型 | 网页（基于文本） |
| 页面数据 | 355 个页面，338 clicks / 9,268 impressions / CTR 3.65% / 平均排名 9.53 |
| 查询数据 | 690 个查询，174 clicks / 5,395 impressions（其余被 GSC 匿名化） |
| 国家/设备 | 331 clicks / 8,756 impressions |
| GA4 | 2026-09-14 ~ 10-14，仅取 `google / organic` 着陆页做交叉验证 |

> 查询表只覆盖约 58% 的展示，所以“查询占比”分母用 5,395；“页面占比”分母用 9,268。两者不要混用。
> 7 天样本很小，单日波动会放大；结论看结构，不要抠小数点。

---

## 1. 一句话结论

**流量小、高度集中，而且集中在“我们赢不了”的查询上。**

30% 左右的展示来自 6 个“剧名 + watch”类查询，只贡献 1.5% 的点击；这些查询的 SERP 被 ReelShort 官方页、Videoclip/Bilibili 全集视频和 DramaBox 占据。我们排在 5–10 位，但用户要的是“直接看”，不是“读介绍”。

**真正能赢的是信息型长尾：cast、ending、all episodes、full story、character names。** 目前这些查询有展示，但页面没有用标题/首屏去接。

---

## 2. 核心数字

### 2.1 页面类型：单集页比剧集页更会转化点击

| 类型 | 页面数 | Clicks | Impressions | CTR | 平均排名 |
|------|--------|--------|-------------|-----|----------|
| 剧集详情（drama） | 89 | 152 | 5,610 | 2.7% | 9.2 |
| 单集（episode） | 186 | 114 | 1,868 | **6.1%** | 10.3 |
| 文章（best-short-dramas） | 21 | 16 | 703 | 2.3% | 9.9 |
| 其他 | 49 | 48 | 917 | 5.2% | 10.3 |
| 首页 | 1 | 3 | 108 | 2.8% | 6.2 |
| Browse | 9 | 5 | 62 | 8.1% | 9.6 |

**解读**：用户更愿意点“Episode 1”而不是“剧集介绍页”。单集页应该是主落地页，剧集页应该把“Play episode 1”放到首屏。

### 2.2 查询集中度：6 个查询吃掉三成展示，只给 1.5% 点击

| 查询 | Clicks | Impressions | CTR | 排名 |
|------|--------|-------------|-----|------|
| the alpha princess is gone for good | 1 | 1,779 | 0.1% | 9.5 |
| star prison | 1 | 417 | 0.2% | 5.8 |
| rejecting my five female mates | 17 | 213 | 8.0% | 15.7 |
| the mafia dons downfall | 1 | 144 | 0.7% | 8.3 |
| alpha asher and tiffany | 1 | 108 | 0.9% | 6.6 |
| my dragon husband | 1 | 104 | 1.0% | 5.4 |
| the alpha princess is gone for good all episodes | 0 | 102 | 0.0% | 9.5 |

- 这 6 个查询合计 **2,654 展示（占查询表 49%，占全部页面展示 29%）**，只有 **5 次点击（占查询点击 2.9%，占全部点击 1.5%）**。
- `the alpha princess is gone for good` 一个查询就占查询表 33% 的展示，CTR 0.1%。

### 2.3 页面集中度

| 页面 | Clicks | Impressions | CTR | 排名 |
|------|--------|-------------|-----|------|
| /drama/the-alpha-princess-is-gone-for-good-.../ | 17 | 2,241 | 0.8% | 9.3 |
| /drama/rejecting-my-five-female-mates-.../ | 57 | 684 | 8.3% | 15.1 |
| /drama/the-alpha-and-his-nanny-luna-.../ | 13 | 574 | 2.3% | 8.1 |
| /drama/star-prison-.../ | 1 | 550 | 0.2% | 6.2 |
| /drama/the-mafia-don-s-downfall-.../episode/1/ | 12 | 505 | 2.4% | 8.2 |
| /fr/best-short-dramas/le-grand-et-puissant-genie-.../ | 17 | 220 | 7.7% | 7.9 |

Alpha Princess 一个页面吃掉 24% 的展示，只给 5% 的点击。

### 2.4 地域与设备

| 国家 | Clicks | Impressions | CTR | 排名 |
|------|--------|-------------|-----|------|
| 美国 | 53 | 1,152 | 4.6% | 9.95 |
| 印度 | 39 | 1,036 | 3.8% | 9.81 |
| 法国 | 16 | 243 | 6.6% | 8.4 |
| 加拿大 | 13 | 192 | 6.8% | 9.4 |
| 菲律宾 | 8 | 803 | **1.0%** | 8.5 |

- 移动端 297 clicks / 7,717 展示（CTR 3.85%），桌面 30 / 892（3.36%）；**90% 的点击来自移动端**，SERP 位置在手机上更靠下。
- 菲律宾 803 展示只换来 8 点击，值得单独查页面/标题/语言匹配。

### 2.5 语种：阿拉伯语 CTR 最高，但排名最差

| 语种 | 页面数 | Clicks | Impressions | CTR | 平均排名 |
|------|--------|--------|-------------|-----|----------|
| en | 292 | 264 | 8,282 | 3.2% | 9.2 |
| ar | 9 | 37 | 191 | **19.4%** | **28.2** |
| fr | 4 | 17 | 231 | 7.4% | 8.1 |
| zh-TW | 8 | 6 | 278 | 2.2% | 8.1 |
| tr | 2 | 6 | 62 | 9.7% | 7.6 |
| pt | 4 | 2 | 64 | 3.1% | 11.9 |

- 阿拉伯语页面在 28 位还能拿到 19.4% CTR，说明**需求强、供给少**，但排名被压住了；
- 法语 7.4% CTR、8.1 位，健康；
- 繁中 278 展示、2.2% CTR，偏低，需要看标题/描述；
- EN 仍占 89% 展示，其他语种是“小但高意图”的机会。

---

## 3. 六个发现

### 发现 1：我们在“观看意图”的 SERP 里陪跑

用公开搜索抽查 `the alpha princess is gone for good`，排在前面的主要是：

- ReelShort 官方单集页（`reelshort.com/episodes/...`）
- Videoclip.bg 的全集视频
- Bilibili 的搬运/切片
- DramaBox 的 full movie 页

我们排在 9 位左右，标题只是剧名，描述是剧情梗概。用户看到“ShortsBinge”这个陌生品牌 + 没有“立即观看”的信号，就跳过了。

**这不是标题写法能完全解决的**：只要查询是“watch / full episode”意图，官方 App 和视频站天然占优。把 CTR 从 0.1% 拉到 1% 有可能，拉到 5% 不现实。

### 发现 2：单集页是更好的落地页，但剧集页没有把用户送过去

- 单集页 CTR 6.1%，剧集页 2.7%；
- 剧集页平均排名 9.2，单集页 10.3，但单集页点击更多；
- GA4：`the-alpha-princess...` 剧集页 14 sessions / 9.3s / 50% key event；它的 episode 1 是 15 sessions / 30.9s / 60%。

**动作**：剧集页首屏加一个明显的 “▶ Watch free episode 1” 按钮，直接链到 `/episode/1/`；把“剧集介绍”降为第二屏。

### 发现 3：信息型长尾有展示，但页面没接住

| 查询 | Impressions | Clicks | 页面现状 |
|------|-------------|--------|----------|
| the alpha princess is gone for good all episodes | 102 | 0 | 剧集页没有“All episodes”区块 |
| my dragon husband full episode | 36 | 0 | 标题/首屏没有 “Full Episode” |
| alpha asher and tiffany | 108 | 1 | 页面标题是 “The Alpha and His Nanny Luna”，没提角色名 |
| tiffany and alpha asher | 32 | 0 | 同上 |
| the alpha princess is gone for good episode 55 | 43 | 2 | 没有 episode guide，付费集也不该承诺可看 |

这些查询的共同点：**用户想确认“是不是我要的那部、有多少集、谁演的、结局是什么”**，而我们的标题只给剧名。

### 发现 4：文章页有流量，但没有把人送到“看”的动作

GA4（google / organic）：

| 页面 | Sessions | 平均互动 | 关键事件 | 关键事件率 |
|------|----------|----------|----------|------------|
| /best-short-dramas/alpha-princess-gone-for-good | 12 | 17.7s | 0 | **0%** |
| /zh-TW/best-short-dramas/x-guang-toushi-yan-zh-hant | 35 | 24.1s | 1 | **2.9%** |
| /drama/rejecting-my-five-female-mates.../episode/1 | 57 | 119.2s | 44 | 31.6% |
| /drama/the-alpha-princess.../episode/1 | 15 | 30.9s | 10 | 60% |

文章页能把人拉进来，但**没有把阅读转成“点开第 1 集 / 去解锁”**。Alpha Princess 的文章页 12 个会话、0 个关键事件，是最典型的断点。

### 发现 5：品牌搜索几乎为零

查询表里 **没有任何包含 “shortsbinge” 的品牌查询**。这意味着：

- 现在的流量几乎全部来自“剧名查询”，不是品牌；
- 用户记不住/不认这个站，标题里挂 “ShortsBinge” 对他们没有加分；
- 短期不要指望品牌词，先把“剧名 + 信息型修饰”吃透。

### 发现 6：泛词几乎没份

`short drama / reelshort / watch free / drama app` 这类泛词，查询表里只有 **62 个查询、122 展示、8 点击**。  
站点的自然搜索盘子目前就是“剧名查询”，不是“品类入口”。要增长，要么做信息型长尾，要么做品类内容（成本更高）。

---

## 4. 机会清单（按优先级）

### P0：先改 6 个页面的标题 + 描述（本周，2–3 小时）

目标不是把所有页面拉到 5% CTR，而是：

- 观看意图页：从 0.1–0.8% 拉到 **1.5–2.5%**；
- 信息型页：从 2–3% 拉到 **4–5%**；
- 文章页：把 CTA 点击率从 0% 拉到 **10%+**。

#### 改写样例

**1) The Alpha Princess Is Gone for Good（剧集页）**

```text
Title: The Alpha Princess Is Gone for Good: Cast, Ending & All 55 Episodes
Desc:  Framed by an impostor and sent to a werewolf academy, the real alpha
       princess returns three years later. Full story, cast, episode guide,
       and where to watch free episode 1.
```

页面内加 H2：`All 55 Episodes — Free vs Paid`，列出免费集与官方解锁入口；再加 `Cast & Characters`。

**2) Star Prison**

```text
Title: Star Prison: Cast, Ending & Full Episode Guide
Desc:  A pregnant waitress is framed by her stepsister and gives birth behind
       bars; six years later, a paternity test changes everything. Cast,
       ending explained, and where to watch episode 1.
```

**3) The Mafia Don's Downfall**

当前描述被截断成 “Needing money for her son”，必须重写：

```text
Title: The Mafia Don's Downfall: Cast, Ending & All Episodes
Desc:  A mother needs money for her son and gets pulled into the mafia don's
       world. Full story, cast, ending explained, and the official episode 1 link.
```

**4) The Alpha and His Nanny Luna（接角色名查询）**

```text
Title: The Alpha and His Nanny Luna: Tiffany & Alpha Asher, Cast & Ending
Desc:  Poisoned while pregnant and robbed of her newborn, Tiffany takes a
       nanny job — never knowing the child she cares for is her own. Meet
       Tiffany and Alpha Asher, and follow the full story.
```

**5) My Dragon Husband**

```text
Title: My Dragon Husband: Full Story, Cast, Ending & Episode Guide
Desc:  Madison reunites with Noah years after escaping the Dragon Tower Castle,
       while their twins show signs of dragon heritage. Full story, cast,
       ending, and where to watch episode 1.
```

**6) zh-TW 文章页**

标题已经不错，别改；改 CTA：

- 首屏加 “▶ 免費看第 1 集” 按钮，链到对应 `/zh-TW/drama/.../episode/1/`；
- 文末加 “接下來發生什麼” → episode guide。

### P0：给所有剧集页加“首屏三件套”

在每个 drama 页首屏固定：

1. `▶ Watch free episode 1`（链到 episode 1）
2. `55 episodes · 10 free · ReelShort`
3. `Cast · Ending · All episodes` 锚点

这三件套直接对着上面那些查询，也把用户送到转化更好的单集页。

### P1：给 top 20 剧集页加“信息型区块”

不是新建 20 个页面，而是在现有页加：

- `Cast & Characters`（角色名、演员名）
- `All Episodes`（免费/付费状态 + 官方入口）
- `Ending Explained`（不剧透付费集，讲已公开信息）
- `Where to Watch`（免费集站内 / 付费集官方合作方）

优先做有展示但 CTR 低的页面（Alpha Princess、Star Prison、Mafia Don、Nanny Luna、My Dragon Husband）。

### P1：本地化优先级

1. **阿拉伯语**：19.4% CTR / 28 位，需求强、排名弱。先修 hreflang + 内链，再看标题是否阿拉伯语；这是投入产出最高的语种。
2. **法语**：7.4% CTR / 8.1 位，健康；加文章和剧集覆盖。
3. **繁中**：2.2% CTR / 8.1 位；查标题/描述与简体站的差异，补 CTA。

### P2：品类内容（谨慎）

泛词只有 122 展示，说明现在做“short drama 品类页”很难马上见效。若要做，优先：

- `best short drama apps`（已有文章，112 展示 / 0 点击 / 6.5 位，先改标题+对比表）
- `shows like [热门剧]`
- `where to watch [剧]`

不要为了铺量生成几百个“剧名 + cast”薄页。

---

## 5. 两周验证计划

| 时间 | 动作 | 看什么 |
|------|------|--------|
| D0 | 改 6 个页面的 title/desc；加首屏三件套 | 收录是否正常 |
| D+3 | 检查 GSC 是否重新抓取（URL Inspection） | 标题是否更新 |
| D+7 | 看 GSC 这 6 页的 CTR / 排名 | 是否从 <1% 到 1.5%+ |
| D+14 | 看 GA4 的 episode 1 sessions / key events | 文章→单集 CTA 是否起量 |
| D+14 | 看 AR / FR 的排名与 CTR | hreflang 修复后是否改善 |

**判定线**：

- 观看意图页 CTR 仍 <1% → 说明 SERP 被视频/官方站锁死，别再堆标题，转去做信息型长尾；
- 信息型页 CTR 没到 3% → 标题/描述还没对上下一步搜索词；
- 文章页 key event 仍为 0 → CTA 位置/文案有问题，不是流量问题。

---

## 6. 附录：Top 20 页面 / 查询

### 6.1 Top 20 页面（按展示）

| # | 页面 | Clicks | Imp | CTR | 排名 |
|---|------|--------|-----|-----|------|
| 1 | /drama/the-alpha-princess-is-gone-for-good-.../ | 17 | 2,241 | 0.8% | 9.3 |
| 2 | /drama/rejecting-my-five-female-mates-.../ | 57 | 684 | 8.3% | 15.1 |
| 3 | /drama/the-alpha-and-his-nanny-luna-.../ | 13 | 574 | 2.3% | 8.1 |
| 4 | /drama/star-prison-.../ | 1 | 550 | 0.2% | 6.2 |
| 5 | /drama/the-mafia-don-s-downfall-.../episode/1/ | 12 | 505 | 2.4% | 8.2 |
| 6 | /drama/the-mafia-don-s-downfall-.../ | 7 | 306 | 2.3% | 6.9 |
| 7 | /fr/best-short-dramas/le-grand-et-puissant-genie-.../ | 17 | 220 | 7.7% | 7.9 |
| 8 | /drama/my-dragon-husband-.../ | 4 | 220 | 1.8% | 7.0 |
| 9 | /drama/the-ceo-who-felt-my-pregnancy-.../episode/1/ | 7 | 194 | 3.6% | 6.1 |
| 10 | /drama/claimed-by-the-prince-.../ | 8 | 184 | 4.3% | 9.1 |
| 11 | /zh-TW/best-short-dramas/x-guang-toushi-yan-zh-hant/ | 2 | 157 | 1.3% | 8.1 |
| 12 | /best-short-dramas/step-back-that-homeless-man-.../ | 9 | 151 | 6.0% | 9.0 |
| 13 | /best-short-dramas/five-years-of-secret-love-.../ | 2 | 144 | 1.4% | 9.0 |
| 14 | /drama/uncle-deeper-than-that-.../ | 10 | 124 | 8.1% | 7.7 |
| 15 | /best-short-dramas/best-short-drama-apps-in-2026-.../ | 0 | 112 | 0.0% | 6.5 |
| 16 | / | 3 | 108 | 2.8% | 6.2 |
| 17 | /drama/my-rival-captain-made-me-his-.../episode/1/ | 10 | 105 | 9.5% | 5.2 |
| 18 | /ar/drama/زوجي-السابق-.../episode/1/ | 18 | 72 | 25.0% | 20.4 |
| 19 | /ar/drama/من-الصفر-إلى-الألفا-.../ | 12 | 77 | 15.6% | 38.6 |
| 20 | /drama/the-alpha-princess-.../episode/1/ | 10 | 76 | 13.2% | 22.8 |

### 6.2 Top 20 查询（按展示）

| # | 查询 | Clicks | Imp | CTR | 排名 |
|---|------|--------|-----|-----|------|
| 1 | the alpha princess is gone for good | 1 | 1,779 | 0.1% | 9.5 |
| 2 | star prison | 1 | 417 | 0.2% | 5.8 |
| 3 | rejecting my five female mates | 17 | 213 | 8.0% | 15.7 |
| 4 | the mafia dons downfall | 1 | 144 | 0.7% | 8.3 |
| 5 | the mafia don's downfall | 6 | 131 | 4.6% | 7.0 |
| 6 | alpha asher and tiffany | 1 | 108 | 0.9% | 6.6 |
| 7 | my dragon husband | 1 | 104 | 1.0% | 5.4 |
| 8 | the alpha princess is gone for good all episodes | 0 | 102 | 0.0% | 9.5 |
| 9 | the mafia don downfall | 3 | 83 | 3.6% | 8.3 |
| 10 | my rival captain made me his | 7 | 70 | 10.0% | 5.0 |
| 11 | 你擋不住我的超級x光透視眼 | 2 | 57 | 3.5% | 7.6 |
| 12 | the alpha and his nanny luna | 4 | 50 | 8.0% | 20.7 |
| 13 | زوجي السابق التافه هو جني المصباح | 11 | 43 | 25.6% | 20.9 |
| 14 | the alpha princess is gone for good episode 55 | 2 | 43 | 4.7% | 6.6 |
| 15 | one good deed one great fortune | 2 | 41 | 4.9% | 4.7 |
| 16 | uncle deeper than that | 3 | 39 | 7.7% | 8.2 |
| 17 | five years of secret love he married my best friend | 0 | 39 | 0.0% | 9.3 |
| 18 | my dragon husband full episode | 0 | 36 | 0.0% | 8.9 |
| 19 | tiffany and alpha asher | 0 | 32 | 0.0% | 7.1 |
| 20 | uncle, deeper than that | 3 | 31 | 9.7% | 8.4 |

---

## 7. 与上一份技术审计的关系

- 技术问题（hreflang、本地化标题、分页、Vercel）见 `2026-10-19-审计报告-shortsbinge-技术SEO与优化建议.md`；
- 本文只回答“最新 GSC 数据告诉我们先改什么”；
- 两份文档的交集：**hreflang 缺失** 与 **本地化标题英文** 同时影响 AR/FR 的排名与 CTR，应合并成一个修复项排期。

> 7 天数据、查询匿名化、单条 query 波动大；本报告的用途是排优先级，不是预测流量。
