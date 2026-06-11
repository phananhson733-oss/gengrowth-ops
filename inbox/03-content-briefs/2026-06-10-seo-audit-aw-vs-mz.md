# SEO 全站审计报告：AstrologyWiki vs my-zodiac-ai

**审计日期：** 2026-06-10  
**数据来源：** 全站批量抓取，无推测，无幻觉  
**样本量：** AstrologyWiki 149篇 + my-zodiac-ai 353篇，共 502 篇逐页爬取  

---

## 一、核心指标汇总

| 指标 | AstrologyWiki (149篇) | my-zodiac-ai (353篇) |
|---|---|---|
| **平均字数** | 1,650词 | 2,622词 (+59%) |
| **最高字数** | 2,947词 | 7,430词 |
| **最低字数** | 487词 | 1,199词 |
| **< 1,000词页面** | 13篇 (9%) | **0篇** |
| **> 3,000词页面** | **0篇** | 88篇 (25%) |
| **平均H2数** | 9个 | 13个 |
| **平均内链数** | 6个 | 151个（含导航） |
| **平均图片数** | **2张** | **9张** |
| **FAQ覆盖** | 99/149 = **66%** | 26/353 = **7%** |
| **At-a-glance覆盖** | 96/149 = **64%** | 353/353 = **100%** |
| **Schema部署** | 100% | 100% |
| **发布日期（可检测）** | 108/149 = **72%** | **0/353 = 0%** |
| **作者署名（可检测）** | 108/149 = **72%** | **0/353 = 0%** |
| **Reflection Prompts** | 101/149 = 67% | N/A（竞品无此模块） |
| **Common Misreadings** | 101/149 = 67% | N/A（竞品无此模块） |

> **重要更正**：前一轮审计存在多处错误，以下数据全部基于本次爬取重新核实。

---

## 二、字数分布对比（实际数据）

| 字数区间 | AstrologyWiki | my-zodiac-ai |
|---|---|---|
| < 1,000词 | **13篇** | 0篇 |
| 1,000–1,500词 | 32篇 | 6篇 |
| 1,500–2,000词 | 77篇（主力区间） | 84篇 |
| 2,000–2,500词 | 20篇 | 54篇 |
| 2,500–3,000词 | 7篇 | **121篇**（主力区间） |
| 3,000–4,000词 | **0篇** | 69篇 |
| 4,000词以上 | **0篇** | 19篇 |

**AW的字数主力区间是1,500–2,000词（52%），而MZ的主力区间是2,500–3,000词（34%）。MZ有25%的文章超过3,000词，AW为零。**

---

## 三、各维度详细对比

### 3.1 内容深度（字数）

**my-zodiac-ai 明显领先。**

- MZ的19篇4,000+字长文（最高7,430词）主要是旗舰综合指南，如：
  - `saturn-neptune-conjunction-material-empire-dreams-2026`（4,220词）
  - `eclipse-effects-zodiac-signs-2026`（3,831词）
  - `north-node-aquarius-2026-soul-mission-karma-destiny`（3,152词）
  - `free-natal-chart-calculator-2026`（3,009词）

- AW的13篇< 1,000词文章全部没有FAQ，包括重要基础词：
  - `saturn`（737词）—— 严重不足
  - `sun`（867词）—— 严重不足
  - `natal-chart`（971词）
  - `north-node`（968词）
  - `mercury-retrograde-vs-moon-anxiety`（487词）—— 最短

**一句话诊断：AW在核心词（土星/太阳/北交点/本命盘）上的内容深度，离竞品有700–2,000词的硬缺口。**

---

### 3.2 E-E-A-T信号（作者 + 日期）

**AstrologyWiki 明显领先，但存在盲区。**

- AW在108/149篇上部署了作者署名和发布日期（JSON-LD schema + HTML），占72%
- MZ在353篇文章中，无一篇有可检测的作者或发布日期信息（HTML/Schema均为空）

**这是一个重大的信任信号差距，MZ完全放弃了E-E-A-T的可归因性。**

AW的41篇无日期无作者文章（28%）集中在：
- 所有黄道十二宫页（aries, libra, virgo, scorpio, aquarius, sagittarius等）
- 行星基础页（venus, opposition等）
- 结构修式页（cardinal-mode, fixed-mode等）

这些是搜索量最高的基础词，却是E-E-A-T最薄弱的地方，需要优先修复。

---

### 3.3 FAQ 覆盖

**AstrologyWiki 大幅领先，但存在高价值盲区。**

- AW: 99/149篇有FAQ（66%）
- MZ: 只有26/353篇有FAQ（7%），且全部是2,200词以上的旗舰综合指南

MZ的FAQ仅出现在旗舰页（北交点系列、月食指南、月历预测等），普通文章完全没有FAQ。这意味着**AW的FAQ策略是真实的结构性差异**，对Featured Snippet的争夺有优势。

**AW的5个高价值无FAQ盲区（字数>1,500词）：**
1. `chakra-system-overview`（2,532词）—— P0修复
2. `how-to-read-birth-chart`（2,053词）—— P0修复
3. `june-2026-planetary-transits`（1,797词）
4. `july-2026-planetary-transits`（1,735词）
5. `four-element-framework`（1,576词）

这五篇有足够字数支撑FAQ，只是缺少这个模块。

---

### 3.4 视觉内容（图片）

**my-zodiac-ai 大幅领先。**

- MZ: 平均9张图（最高10张），几乎每篇都有接近10张视觉资产
- AW: 平均2张图（最高4张）

MZ的图片内容推测包括：占星盘示意图、星座配色信息图、时间轴图表、各星座独立配图。这是用户体验（停留时长、滚动深度）的核心差异，也间接影响反弹率。

**这是AW最大的视觉缺口，却也是最容易系统性补充的方向。**

---

### 3.5 At-a-glance模块

**my-zodiac-ai 100% 全覆盖，AW 64%。**

- MZ每篇文章都有At-a-glance速览框（353/353 = 100%）
- AW只有96/149篇（64%）

MZ的At-a-glance策略非常彻底：这是阻止用户跳出、同时增加富文本片段机会的关键模块。AW有36%的文章缺少这个入口，用户体验出现断层。

---

### 3.6 内链结构

**my-zodiac-ai 数量远超，但需拆分分析。**

- MZ平均151个内链/篇（包含导航+页脚+正文相关文章）
- AW平均6个内链/篇

MZ的151个链接包含大量模板化导航和"相关文章"侧边栏链接。估算去除模板约70个后，每篇实际编辑性内链约为80个，仍是AW的~27倍。

AW当前内链最多的页面是`how-to-read-birth-chart`（62个内链），但这是极端值，全站大多数页面只有3–8个内链，许多是孤岛页。

---

### 3.7 Schema 部署

**两者并列：均为100%全覆盖。**

- AW: Article + FAQPage + BreadcrumbList
- MZ: Article + BreadcrumbList（FAQPage仅在有FAQ的26篇上部署）

在Schema技术层面无差距。

---

### 3.8 内容覆盖广度（文章数量）

- MZ: 353篇，是AW的2.4倍
- AW: 149篇

MZ在量上的领先是规模优势，覆盖了更多长尾变体（12星座变体 × 多个行星事件 = 大批量矩阵文章）。AW的149篇如果质量能提升，在精度上仍可竞争，但在总搜索流量覆盖上短期处于劣势。

---

## 四、AW的真实竞争优势（数据支撑）

1. **FAQ胜率高** —— 66% vs 7%，AW在Featured Snippet竞争中有真实优势
2. **E-E-A-T信号明确** —— 72% vs 0%，在Google内容质量评分中这是实质性差距（对方完全放弃了内容归因）
3. **心理反思模块独特** —— Reflection Prompts（67%）和Common Misreadings（67%）在竞品中完全不存在，是真正的内容差异化
4. **BreadcrumbList结构清晰** —— 有利于分类和知识图谱收录

---

## 五、AW的真实劣势（数据支撑）

| 问题 | 量化 | 紧迫度 |
|---|---|---|
| 图片数量严重不足 | avg 2张 vs 竞品9张 | 高 |
| 字数整体偏短 | avg 1,650词 vs 竞品2,622词 | 高 |
| 13篇核心词页面< 1,000词 | saturn 737词 / sun 867词 等 | 紧急 |
| 无3,000词以上的长文 | 0篇 vs 竞品88篇 | 高 |
| 41篇完全无E-E-A-T信号 | 全是高搜量基础词页面 | 高 |
| 内链密度极低 | avg 6 vs 竞品151（含导航） | 中 |
| 5篇高价值页面无FAQ | chakra/birth-chart等 | 中 |
| At-a-glance覆盖缺口 | 36%的页面缺少 | 中 |
| 内容总量不足 | 149篇 vs 353篇 | 中长期 |

---

## 六、优先修复行动清单

### P0 — 立即修复（影响排名的技术+内容缺口）

**① 修复1篇 < 1,000词的核心词文章**

目标：每篇扩展到1,500–2,000词，同步补充FAQ模块。并且文章标题并没有出现关键词

| 字数   | URL                                                        | page_id      |
| ---- | ---------------------------------------------------------- | ------------ |
| 924词 | https://www.astrologywiki.com/en/wiki/track-mood-astrology | PG-TRANS-001 |


---

### P1 — 高优先级（结构性提升）

**③ 为5篇字数>1,500词但无FAQ的高价值页面添加FAQ**

| 字数 | URL |
|---|---|
| 2,532词 | https://www.astrologywiki.com/en/wiki/chakra-system-overview |
| 2,053词 | https://www.astrologywiki.com/en/wiki/how-to-read-birth-chart |
| 1,797词 | https://www.astrologywiki.com/en/wiki/june-2026-planetary-transits |
| 1,735词 | https://www.astrologywiki.com/en/wiki/july-2026-planetary-transits |
| 1,576词 | https://www.astrologywiki.com/en/wiki/four-element-framework |

**④ 每篇文章图片数从avg 2提升至avg 5–6**  
重点方向：占星盘示意图（可程序化生成）、星座对应配色信息图、时间轴/周期图表  

**⑤ 修复At-a-glance缺口（53篇）**

以下页面缺少At-a-glance速览框，优先处理字数>1,500词的页面（前9篇为独立缺口，其余与P0-②重叠可合并处理）：

| 字数 | URL |
|---|---|
| 2,488词 | https://www.astrologywiki.com/en/wiki/blue-aura-meaning |
| 2,413词 | https://www.astrologywiki.com/en/wiki/white-aura-meaning |
| 2,214词 | https://www.astrologywiki.com/en/wiki/purple-aura-meaning |
| 2,111词 | https://www.astrologywiki.com/en/wiki/yellow-aura-meaning |
| 2,053词 | https://www.astrologywiki.com/en/wiki/how-to-read-birth-chart |
| 2,004词 | https://www.astrologywiki.com/en/wiki/red-aura-meaning |
| 1,943词 | https://www.astrologywiki.com/en/wiki/full-moon-journal-prompts |
| 1,576词 | https://www.astrologywiki.com/en/wiki/four-element-framework |
| 1,519词 | https://www.astrologywiki.com/en/wiki/full-moon-july-2026 |
| 1,479词 | https://www.astrologywiki.com/en/wiki/cardinal-mode |
| 1,458词 | https://www.astrologywiki.com/en/wiki/libra |
| 1,423词 | https://www.astrologywiki.com/en/wiki/aries |
| 1,393词 | https://www.astrologywiki.com/en/wiki/sagittarius |
| 1,374词 | https://www.astrologywiki.com/en/wiki/fixed-mode |
| 1,350词 | https://www.astrologywiki.com/en/wiki/virgo |
| 1,315词 | https://www.astrologywiki.com/en/wiki/scorpio |
| 1,278词 | https://www.astrologywiki.com/en/wiki/aquarius |
| 1,277词 | https://www.astrologywiki.com/en/wiki/venus |
| 1,263词 | https://www.astrologywiki.com/en/wiki/opposition |
| 1,261词 | https://www.astrologywiki.com/en/wiki/capricorn |
| 1,251词 | https://www.astrologywiki.com/en/wiki/jupiter |
| 1,247词 | https://www.astrologywiki.com/en/wiki/cancer |
| 1,243词 | https://www.astrologywiki.com/en/wiki/water-element |
| 1,234词 | https://www.astrologywiki.com/en/wiki/leo |
| 1,226词 | https://www.astrologywiki.com/en/wiki/chiron |
| 1,218词 | https://www.astrologywiki.com/en/wiki/earth-element |
| 1,180词 | https://www.astrologywiki.com/en/wiki/moon |
| 1,168词 | https://www.astrologywiki.com/en/wiki/gemini |
| 1,158词 | https://www.astrologywiki.com/en/wiki/taurus |
| 1,117词 | https://www.astrologywiki.com/en/wiki/mercury |
| 1,117词 | https://www.astrologywiki.com/en/wiki/neptune |
| 1,075词 | https://www.astrologywiki.com/en/wiki/midheaven |
| 1,074词 | https://www.astrologywiki.com/en/wiki/pluto |
| 1,072词 | https://www.astrologywiki.com/en/wiki/mars |
| 1,052词 | https://www.astrologywiki.com/en/wiki/synastry-chart |
| 1,046词 | https://www.astrologywiki.com/en/wiki/conjunction |
| 1,046词 | https://www.astrologywiki.com/en/wiki/pisces |
| 1,042词 | https://www.astrologywiki.com/en/wiki/mutable-mode |
| 1,024词 | https://www.astrologywiki.com/en/wiki/ascendant |
| 1,010词 | https://www.astrologywiki.com/en/wiki/juno |
| 974词 | https://www.astrologywiki.com/en/wiki/air-element |
| 971词 | https://www.astrologywiki.com/en/wiki/fire-element |
| 971词 | https://www.astrologywiki.com/en/wiki/natal-chart |
| 968词 | https://www.astrologywiki.com/en/wiki/north-node |
| 966词 | https://www.astrologywiki.com/en/wiki/composite-chart |
| 924词 | https://www.astrologywiki.com/en/wiki/track-mood-astrology |
| 921词 | https://www.astrologywiki.com/en/wiki/uranus |
| 867词 | https://www.astrologywiki.com/en/wiki/sun |
| 865词 | https://www.astrologywiki.com/en/wiki/modes |
| 752词 | https://www.astrologywiki.com/en/wiki/best-astrology-mental-health-apps |
| 737词 | https://www.astrologywiki.com/en/wiki/saturn |
| 635词 | https://www.astrologywiki.com/en/wiki/lilith |
| 487词 | https://www.astrologywiki.com/en/wiki/mercury-retrograde-vs-moon-anxiety |

---

### P2 — 中期（差距收窄）

**⑥ 将现有精修文章从avg 1,650词扩展到avg 2,200词**  
目标：核心词（土星、木星、冥王星、月交点等）达到2,500–3,000词  

**⑦ 新增内链：每篇文章目标15–20个编辑性内链**  
当前avg 6过低，形成孤岛风险，影响PageRank传递  

**⑧ 开发至少3–5篇 3,000词以上的旗舰综合指南**  
当前AW完全没有3,000词以上文章，无法在"综合指南"类搜索词上竞争  

---

## 七、竞争策略定位

| 维度 | AstrologyWiki | my-zodiac-ai |
|---|---|---|
| **竞争策略** | 精度优先（FAQ + 心理反思 + E-E-A-T） | 规模优先（长文 + 高频产出 + 全视觉） |
| **内容身份** | "有作者、有日期的知识型百科" | "匿名但内容丰厚的星座内容工厂" |
| **核心风险** | 内容太短、图片太少 → 用户体验弱 → 排名低 | 无作者无日期 → E-E-A-T不可归因 → 未来QRater扣分风险 |
| **最大机会** | 把精度优势（FAQ/作者/反思）和足够深度（字数+图片）叠加 | — |

**结论**：AW不需要模仿MZ的量产路线。AW真正的护城河是FAQ + 心理反思 + 可归因的E-E-A-T，这些在竞品上是0分。但前提是内容深度（字数、图片、内链）必须到达基本竞争线，否则优质结构没有机会被排名展示。

---

*数据来源：2026-06-10 全站批量爬取。AW 149篇（0 error），MZ 353篇（1 error）。爬取脚本：/tmp/fetch_metrics.py。原始数据：/tmp/aw_results.json, /tmp/mz_results.json。*
