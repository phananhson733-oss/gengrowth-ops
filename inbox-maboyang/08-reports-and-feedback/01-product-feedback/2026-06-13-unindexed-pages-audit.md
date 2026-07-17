# 未收录页面审计报告

**生成日期：** 2026-06-13  
**数据来源：** 结果复盘表 day14_收录=N，GSC 状态取自申请时间列  
**审计方法：** 实时抓取各 URL + 内容结构分析  
**页面数：** 16篇

---

## 一、问题分类总览

| GSC 状态 | 含义 | 篇数 | 根本原因 |
|---|---|---|---|
| 已抓取 - 尚未编入索引 | Google 爬到了，但主动拒收 | 2 | 内容质量 / 差异化不足 |
| Google 无法识别此网址 | Google 根本没找到这个 URL | 12 | 内链不足 / 站点地图未更新 |
| 无法识别此网址 + 标题中没有关键词 | 同上，额外有 H1 关键词缺失 | 1 | 同上 + H1 问题 |
| 无法识别此网址 + 关键词错误 | 同上，额外有关键词错配 | 1 | 同上 + H1/URL 不匹配 |

### 所有 16 篇共性问题（批量修）

1. **无 H3 标题** — 所有页面只有 H1 + H2，内容层级扁平，不利于精细话题爬取
2. **H2 模板化痕迹明显** — "What is full moon journal prompts?"（小写 + 语法错误）、"full moon spiritually vs Adjacent Concepts" 等，AI 生成感强，Google 可能降权

---

## 二、类型A：已抓取 - 尚未编入索引（内容质量问题）

这两篇 Google 找到了，但判断不值得收录。需要内容升级。

---

### A1 — 6th-house-astrology

**URL：** https://www.astrologywiki.com/en/wiki/6th-house-astrology  
**page_id：** PG-HOUSE-011

**页面现状**

| 项目               | 状态                                                             |
| ---------------- | -------------------------------------------------------------- |
| Title tag        | "What 6th House Astrology Reveals About How You Work and Heal" |
| H1               | 同 Title                                                        |
| 字数               | ~2,100 词                                                       |
| Meta description | **缺失**                                                         |
| H3 标题            | **无**                                                          |
| 内链数（出）           | 4 条（house pillar / 10th / 12th / Mercury）                      |
| FAQ              | 有（4 问）                                                         |

**未收录原因**

- 同站已有大量 house 类页面被收录（8th / 9th / 11th / 12th），6th house 内容若与其差异不足，Google 会判断重复度高
- 2,100 词对 pillar 级页面偏薄，house 类话题竞争激烈（Café Astrology / Astro.com 均在 3,000+ 词）
- H2 结构模板化，缺少 6th house 独有的深度角度（如：工作 vs 服务的区别、健康焦虑的星盘读法）

**优化建议**

1. **扩充至 2,800-3,200 词**，重点增加"6th house 和工作方式/身体健康的具体关联"，与 10th house（事业抱负）形成清晰区分
2. **新增 H3 结构**（首批 H3 试点）：
   - 在 H2 "How to Read The 6th House in Your Chart" 下拆出：
     - `H3: Sun, Moon, and Rising in the 6th House`
     - `H3: Saturn and Mars in the 6th House`
     - `H3: When the 6th House Is Empty`
   - 在 H2 "The 6th House vs Adjacent Concepts" 下拆出：
     - `H3: 6th House vs 10th House — Health Habits vs Career Identity`
     - `H3: 6th House vs 12th House — Service vs Withdrawal`
4. **增加内链入口**：从 astrology-houses pillar 页、10th house 页、Mercury natal chart 页加入指向本页的锚文本链接
5. **修正 H2"What is The 6th House?"** 首字母大写统一，避免 AI 模板感

---

### A2 — world-cup-2026-astrology-prediction

**URL：** https://www.astrologywiki.com/en/wiki/world-cup-2026-astrology-prediction  
**page_id：** PG-WC-001

**页面现状**

| 项目 | 状态 |
|---|---|
| Title tag | "Reading the World Cup 2026 Astrology Prediction Through Jupiter in Cancer" |
| H1 | 同 Title |
| 字数 | ~2,100 词 |
| Meta description | 有 |
| H3 标题 | **无** |
| 内链数（出） | 4 条（birth chart / wiki overview / transits / wiki） |
| FAQ | 有（4 问） |

**未收录原因**

- **话题权威性不匹配**：astrologywiki.com 的 topical authority 建立在个人星盘/灵性主题上，world cup 属于体育事件，Google 会质疑站点是否有资格覆盖这类内容
- Google 对"预测类"内容（astrology prediction）本身持保留态度，E-E-A-T 要求高
- H1 关键词顺序弱：目标词 "world cup 2026 astrology prediction" 被拆散，前置动词 "Reading"

**优化建议**

1. **重新定位角度**：从"体育预测"转向"个人星盘与世界杯时段的共鸣"，如"Jupiter in Cancer 期间，你的出生盘如何读懂这段集体能量"——与站点 topical authority 对齐
2. **修改 H1**：`World Cup 2026 Astrology: What Jupiter in Cancer Means for Collective Energy`（关键词前置）
3. **新增 H3 结构**：
   - 在 H2 "How to Read World Cup 2026 Astrology in Your Timing" 下：
     - `H3: Jupiter in Cancer and the Theme of National Belonging`
     - `H3: How to Layer This Transit With Your Natal Chart`
     - `H3: What the Opening Ceremony Chart Shows`
5. **增加内链**：从 Jupiter transits 页、Cancer sign 页指向本页

---

## 三、类型B：Google 无法识别此网址（发现性问题）

这 14 篇 Google 从未爬到，根本原因是**内链不足 + 站点地图可能未更新**。优先修复发现性问题，再做内容优化。

**批量修复项（适用全部 14 篇）：**
- 确认 sitemap.xml 已包含这 14 个 URL
- 从已收录的相关 pillar 页面增加内链指向这些页面
- 在 GSC 重新提交 URL（内链修复后 48 小时内提交）

---

### B1 — vedic-vs-western-astrology

**URL：** https://www.astrologywiki.com/en/wiki/vedic-vs-western-astrology  
**page_id：** PG-VEDIC-001

**页面现状**

| 项目 | 状态 |
|---|---|
| Title tag | "Why Vedic vs Western Astrology Gives You Two Different Signs" |
| H1 | 同 Title |
| 字数 | ~2,100 词 |
| Meta description | 有 |
| H3 标题 | **无** |
| 内链数（出） | ~4 条 |
| FAQ | 有 |

**内容层面问题**

- H2 "Vedic Astrology vs Adjacent Concepts" 这个表述对用户没有意义，应改为具体比较项
- 搜索意图核心是"为什么我的星座在两种系统里不一样"，当前标题抓到了但正文是否充分回答有待核查

**优化建议**

1. **H2 重写**："Vedic Astrology vs Adjacent Concepts" → "Vedic vs Western: Key Differences That Change Your Reading"
2. **新增 H3 结构**：
   - 在 H2 比较区块下：
     - `H3: Sidereal vs Tropical Zodiac — The 23-Degree Gap Explained`
     - `H3: Which Sign Is "Correct"?`
     - `H3: When to Use Vedic and When to Use Western`
   - 在 How to Read 区块下：
     - `H3: Reading Your Sun Sign Across Both Systems`
     - `H3: Reading Your Ascendant Across Both Systems`
4. **内链修复**：从 birth chart pillar 页、zodiac signs pillar 页增加指向本页的链接

---

### B2 — vedic-birth-chart-calculator

**URL：** https://www.astrologywiki.com/en/wiki/vedic-birth-chart-calculator  
**page_id：** PG-VEDIC-004  
**GSC 额外提示：** 标题中没有关键词

**页面现状**

| 项目 | 状态 |
|---|---|
| Title tag | "Reading Your Vedic Birth Chart Calculator Output, Placement by Placement" |
| H1 | 同 Title |
| 字数 | ~2,100 词 |
| Meta description | 有 |
| H3 标题 | **无** |
| 内链数（出） | 4 条 |
| FAQ | 有 |

**内容层面问题（GSC 已直接提示）**

- **H1/Title 不含核心关键词**：目标词 `vedic birth chart calculator`，但 H1 把它藏在 "Reading Your... Output" 里，搜索引擎很难识别页面主题
- 如果用户搜 "vedic birth chart calculator"，他们期望看到一个工具入口或解读工具的文章——页面是解读文章，需要明确这个

**优化建议**

1. **修改 H1/Title**：`Vedic Birth Chart Calculator: How to Read Every Placement in Your Output`（关键词前置，说明页面性质）
2. **新增 H3 结构**：
   - 在 "How to Read Your Vedic Birth Chart in Practice" 下：
     - `H3: Lagna (Ascendant) — Where to Start`
     - `H3: Moon Sign (Rashi) in Vedic Astrology`
     - `H3: Reading the Navamsa Chart`
     - `H3: Dasha Periods and Timing`
4. **增加互动入口**：若站点有 birth chart 工具，在页面顶部插入 CTA 指向工具页，与页面内容形成配合

---

### B3 — chakra-system-overview

**URL：** https://www.astrologywiki.com/en/wiki/chakra-system-overview  
**page_id：** PG-CHAKRA-001  
**GSC 额外提示：** 关键词错误

**页面现状**

| 项目 | 状态 |
|---|---|
| Title tag | "The 7 Chakras Explained: A Guide to the Chakra System" |
| H1 | 同 Title |
| 字数 | ~2,700 词（最长） |
| Meta description | 有 |
| H3 标题 | **无** |
| 内链数（出） | 19 条（最多） |
| FAQ | 有 |

**内容层面问题（GSC 已直接提示）**

- **URL slug 与 H1/Title 不匹配**：URL 是 `chakra-system-overview`，但 H1 写的是 "The 7 Chakras Explained"——Google 看到 URL 期待"chakra system overview"内容，但 H1 信号是"7 chakras explained"，两个关键词互相竞争，都没打准
- 本地源文件的 target_keyword 是 "chakra system"，但 H1 主打 "7 chakras explained"，应选一个打透

**优化建议**

1. **统一关键词信号**，二选一：
   - 主打 "chakra system overview" → 修改 H1 为 `Chakra System Overview: How the 7 Centers Work Together`
   - 主打 "7 chakras explained" → 修改 URL slug 为 `7-chakras-explained`（需 301 重定向旧 URL）
   - **推荐前者**：URL 已建立，改 H1 成本更低
2. **新增 H3 结构**（这篇内容最长，最适合 H3）：
   - 在 "The 7 Chakra System: Quick Guide" 下，每个 chakra 各一个 H3：
     - `H3: Root Chakra — Safety and Grounding`
     - `H3: Sacral Chakra — Desire and Creativity`
     - `H3: Solar Plexus Chakra — Will and Agency`
     - `H3: Heart Chakra — Love and Connection`
     - `H3: Throat Chakra — Voice and Expression`
     - `H3: Third Eye Chakra — Perception and Pattern`
     - `H3: Crown Chakra — Integration and Meaning`
   - 在 "How Shade and Combination Shift Readings" 下：
     - `H3: Reading Clarity vs Strain in the Same Center`
     - `H3: Common Two-Center Combinations`

---

### B4 — chakra-test

**URL：** https://www.astrologywiki.com/en/wiki/chakra-test  
**page_id：** PG-CHAKRA-003

**页面现状**

| 项目 | 状态 |
|---|---|
| Title tag | "What Your Chakra Test Result Actually Tells You" |
| H1 | 同 Title |
| 字数 | ~2,200 词 |
| Meta description | 有 |
| H3 标题 | **无** |
| 内链数（出） | 4 条 |
| FAQ | 有 |

**内容层面问题**

- **搜索意图错配**：URL 是 `chakra-test`（用户想找测试工具），H1 是"What Your Chakra Test Result Actually Tells You"——页面是解读文章，需要在开头明确提供测试入口或清晰说明页面价值

**优化建议**

1. **页面顶部加测试入口**：在 H1 下方第一段前嵌入 CTA 链接（若站点有 chakra quiz），否则加"take our chakra quiz"的内链
2. **新增 H3 结构**：
   - 在 "The Chakra System at a Glance" 下：
     - `H3: What a High Score Means`
     - `H3: What a Low Score Means`
     - `H3: What "Balanced" Actually Looks Like`
   - 在 "How to Read The Chakra System in Yourself" 下：
     - `H3: Starting With Your Lowest-Scoring Center`
     - `H3: When Multiple Centers Score Low`

---

### B5 — root-chakra-meaning

**URL：** https://www.astrologywiki.com/en/wiki/root-chakra-meaning  
**page_id：** PG-CHAKRA-004

**页面现状**

| 项目 | 状态 |
|---|---|
| Title tag | "What Root Chakra Meaning Reveals About Your Sense of Safety" |
| H1 | 同 Title |
| 字数 | ~2,100 词 |
| Meta description | 有 |
| H3 标题 | **无** |
| 内链数（出） | ~4 条 |
| FAQ | 有 |

**内容层面问题**

- H2 "How Common Are Yoga and Meditation in the U.S. Today" 这个 H2 与页面主题无关，像是模板错误或数据塞入，会让 Google 混淆页面主题
- H1 写法"What Root Chakra Meaning Reveals About"——目标词是 "root chakra meaning"，前置较好，但动词结构稍弱

**优化建议**

1. **删除或改写 H2 "How Common Are Yoga and Meditation..."**：这个标题与 root chakra meaning 不相关，应替换为与正文内容匹配的标题，如 "Root Chakra in Modern Wellness Practice"
2. **新增 H3 结构**：
   - 在 "How to Read The Root Chakra in Yourself" 下：
     - `H3: Physical Signs of Root Chakra Tension`
     - `H3: Emotional Patterns That Point to Root Themes`
     - `H3: Practices That Address Root-Level Stability`
   - 在 "The Root Chakra vs Adjacent Concepts" 下：
     - `H3: Root Chakra vs Sacral Chakra — Safety Before Desire`
     - `H3: Root Chakra vs Red Aura — Two Ways to Read the Same Energy`

---

### B6 — sacral-chakra-meaning

**URL：** https://www.astrologywiki.com/en/wiki/sacral-chakra-meaning  
**page_id：** PG-CHAKRA-005

**页面现状**

| 项目 | 状态 |
|---|---|
| Title tag | "Sacral Chakra Meaning Runs Deeper Than Sexuality Alone" |
| H1 | 同 Title |
| 字数 | ~1,900 词（偏薄） |
| Meta description | 有 |
| H3 标题 | **无** |
| 内链数（出） | 6 条 |
| FAQ | 有 |

**内容层面问题**

- **字数偏薄**：1,900 词是这批页面里较少的，竞争关键词 "sacral chakra meaning" 主流内容在 2,500 词以上
- H1 角度"Runs Deeper Than Sexuality Alone"是好角度，但如果正文没有充分支撑这个反转（sexuality 误读 vs 真实含义），内容会虎头蛇尾

**优化建议**

1. **扩充至 2,400+ 词**，重点补充：创造力与情感流动的具体表达、sacral vs root 的区分（欲望 vs 安全）、常见误读的详细拆解
2. **新增 H3 结构**：
   - 在 "How to Read The Sacral Chakra in Yourself" 下：
     - `H3: Sacral Energy in Creative Work`
     - `H3: Sacral Energy in Relationships`
     - `H3: When Sacral Patterns Turn Avoidant`
   - 在比较区块下：
     - `H3: Sacral Chakra vs Root Chakra — Desire After Safety`
     - `H3: Sacral Chakra vs Orange Aura — Shared Language`

---

### B7 — solar-plexus-chakra-affirmations

**URL：** https://www.astrologywiki.com/en/wiki/solar-plexus-chakra-affirmations  
**page_id：** PG-CHAKRA-006

**页面现状**

| 项目 | 状态 |
|---|---|
| Title tag | "Solar Plexus Chakra Affirmations That Finally Feel True" |
| H1 | 同 Title |
| 字数 | ~2,100 词 |
| Meta description | 有 |
| H3 标题 | **无** |
| 内链数（出） | 5 条 |
| FAQ | 有 |

**内容层面问题**

- **URL 与内容不一致**：URL 是 `solar-plexus-chakra-affirmations`（用户想找具体肯定语句），但页面 H1 和内容更像是概念解读文章，不像肯定语列表
- 用户搜 "solar plexus chakra affirmations" 期待看到可以直接使用的肯定句，内容应至少包含一个明确的肯定语列表

**优化建议**

1. **增加肯定语列表**（对齐搜索意图）：在文章中段加入一个 H2 或 H3 "20 Solar Plexus Chakra Affirmations"，列出可直接使用的句子，这是此关键词的核心搜索意图
2. **新增 H3 结构**：
   - 新增一个 H2 "Solar Plexus Chakra Affirmations" 并在下面用 H3 分组：
     - `H3: Affirmations for Decision-Making`
     - `H3: Affirmations for Self-Trust`
     - `H3: Affirmations for Setting Limits`
   - 在 "How to Read" 区块下：
     - `H3: Signs of Underactive Solar Plexus Energy`
     - `H3: Signs of Overactive Solar Plexus Energy`

---

### B8 — persephone-goddess

**URL：** https://www.astrologywiki.com/en/wiki/persephone-goddess  
**page_id：** PG-MYTH-001

**页面现状**

| 项目 | 状态 |
|---|---|
| Title tag | "Why the Persephone Goddess Still Names a Pattern You Live Through" |
| H1 | 同 Title |
| 字数 | ~2,100 词 |
| Meta description | 有 |
| H3 标题 | **无** |
| 内链数（出） | 4 条（8th / 12th house / lunar nodes / birth chart） |
| FAQ | 有 |

**内容层面问题**

- 搜索意图双重性：搜 "persephone goddess" 的用户一部分想了解神话本身，一部分想了解星盘中的 Persephone 小行星（Asteroid 399）
- H1 偏向占星解读方向，但没有提到"asteroid" 或 "mythology"，两边都没完全抓住
- 站内链接指向 8th/12th house 和 lunar nodes——关联性合理，但可以更强

**优化建议**

1. **明确双重角色**：在页面开头明确"本文覆盖：① Persephone 神话故事 ② 星盘中 Persephone 小行星的解读方式"
2. **修改 H1**：`Persephone Goddess: The Myth, the Archetype, and What She Names in Your Chart`
3. **新增 H3 结构**：
   - 在 "What is Persephone?" 下：
     - `H3: The Myth in Brief`
     - `H3: Persephone as a Psychological Archetype`
   - 在 "How to Read Persephone in Yourself" 下：
     - `H3: Persephone Asteroid in the Houses`
     - `H3: Persephone Conjunct Personal Planets`
     - `H3: The Persephone-Pluto Pattern`

---

### B9 — what-is-a-full-moon-ritual

**URL：** https://www.astrologywiki.com/en/wiki/what-is-a-full-moon-ritual  
**page_id：** PG-MOON-001

**页面现状**

| 项目 | 状态 |
|---|---|
| Title tag | "What a Full Moon Ritual Really Does in the 48 Hours After" |
| H1 | 同 Title |
| 字数 | ~2,200 词 |
| Meta description | 有 |
| H3 标题 | **无** |
| 内链数（出） | 5 条 |
| FAQ | 有 |

**内容层面问题**

- **H2 含语法错误**："What is full moon ritual?" → 应为 "What Is a Full Moon Ritual?"（缺冠词，小写）
- H1 角度聚焦在"48 小时后"，这是差异化角度，但用户搜 "what is a full moon ritual" 首先想知道的是"这是什么"，不是"之后怎样"——意图前段未覆盖

**优化建议**

1. **H2 修正**："What is full moon ritual?" → "What Is a Full Moon Ritual?"
2. **新增 H3 结构**：
   - 在 H2 "How to Recognize a Full Moon Ritual That Actually Lands" 下：
     - `H3: Setting Intention Before the Peak`
     - `H3: The Release Practice During the Full Moon`
     - `H3: Integration in the 48 Hours After`
   - 在 FAQ 前加：
     - `H3: Simple Full Moon Ritual for Beginners`
     - `H3: Full Moon Ritual With Your Birth Chart`

---

### B10 — full-moon-energy

**URL：** https://www.astrologywiki.com/en/wiki/full-moon-energy  
**page_id：** PG-MOON-002

**页面现状**

| 项目 | 状态 |
|---|---|
| Title tag | "Why Full Moon Energy Feels Amplified and How to Read It" |
| H1 | 同 Title |
| 字数 | ~1,850 词（最薄） |
| Meta description | 有 |
| H3 标题 | **无** |
| 内链数（出） | 6 条 |
| FAQ | 有 |

**内容层面问题**

- **字数最薄**：1,850 词，这批中最少，"full moon energy" 是搜索量较高的话题，竞争内容普遍 2,500 词以上
- H2 "How to Read full moon energy in Yourself" 中 "full moon energy" 首字母小写，模板感明显

**优化建议**

1. **优先扩充内容至 2,500+ 词**，可增加：满月星座轮换对情绪的影响（按 12 星座）、满月期间的睡眠/梦境现象、与出生盘的关联读法
2. **H2 修正**："How to Read full moon energy in Yourself" → "How to Read Full Moon Energy in Your Own Chart"
3. **新增 H3 结构**：
   - 在 H2 "How to Read Full Moon Energy..." 下：
     - `H3: Finding Which House the Full Moon Activates`
     - `H3: When the Full Moon Aspects Your Natal Planets`
     - `H3: Full Moon by Zodiac Sign — What Each Axis Amplifies`
   - 在 H2 比较区块下：
     - `H3: Full Moon vs New Moon Energy`
     - `H3: Full Moon vs Eclipse Energy`

---

### B11 — what-to-do-on-a-full-moon-spiritually

**URL：** https://www.astrologywiki.com/en/wiki/what-to-do-on-a-full-moon-spiritually  
**page_id：** PG-MOON-003

**页面现状**

| 项目 | 状态 |
|---|---|
| Title tag | "What to Do on a Full Moon Spiritually to Close What the New Moon Began" |
| H1 | 同 Title |
| 字数 | ~2,100 词 |
| Meta description | 有 |
| H3 标题 | **无** |
| 内链数（出） | ~6 条 |
| FAQ | 有 |

**内容层面问题**

- H2 "What is full moon spiritually?" 语法错误（应为 "What Does Full Moon Spiritually Mean?" 或 "What Is the Spiritual Meaning of a Full Moon?"）
- H2 "full moon spiritually vs Adjacent Concepts" 完全是模板，用户不会这样思考
- 标题长达 75 字符，Title tag 可能被截断

**优化建议**

1. **缩短 Title tag**：`What to Do on a Full Moon Spiritually — 8 Practices That Work`（添加数字，增加点击率）
2. **修正语法错误的 H2**："What is full moon spiritually?" → "What Does It Mean to Observe a Full Moon Spiritually?"
3. **替换模板 H2**："full moon spiritually vs Adjacent Concepts" → "Full Moon Spiritual Practice vs General Self-Care — What's the Difference?"
4. **新增 H3 结构**：
   - 在 "How to Read full moon spiritually in Yourself" 下：
     - `H3: Practices for Release and Letting Go`
     - `H3: Practices for Gratitude and Recognition`
     - `H3: Practices for Connecting With Your Birth Chart`

---

### B12 — full-moon-june-2026

**URL：** https://www.astrologywiki.com/en/wiki/full-moon-june-2026  
**page_id：** PG-MOON-004

**页面现状**

| 项目 | 状态 |
|---|---|
| Title tag | "The Full Moon June 2026 Is a Double Completion Signal, Not a Launch Window" |
| H1 | 同 Title |
| 字数 | ~2,100 词 |
| Meta description | 有 |
| H3 标题 | **无** |
| 内链数（出） | 5 条 |
| FAQ | 有 |

**内容层面问题**

- **时效性话题**：满月日期是 June 29, 2026（未来 16 天），时效性内容 Google 会在日期前后快速判断，错过窗口期会很快失去搜索价值
- 内链少（5 条出），发现性问题如不立即修复，收录窗口可能错过

**优化建议**

1. **立即修复内链**（时间紧迫）：在 full moon energy / lunar rituals pillar 页、june 2026 transits 页加入本页链接
2. **新增 H3 结构**：
   - 在 "How to Read full moon June 2026 in Your Timing" 下：
     - `H3: The Cancer-Capricorn Axis on June 29`
     - `H3: Which House This Full Moon Activates for You`
     - `H3: Key Aspects and Planets in Contact`
   - 在 FAQ 前：
     - `H3: June 2026 Full Moon Ritual Suggestions`

---

### B13 — full-moon-july-2026

**URL：** https://www.astrologywiki.com/en/wiki/full-moon-july-2026  
**page_id：** PG-MOON-005

**页面现状**

| 项目 | 状态 |
|---|---|
| Title tag | "Full Moon July 2026 Peaks After Mercury Retrograde — Use It to Integrate What Changed" |
| H1 | 同 Title |
| 字数 | ~2,100 词 |
| Meta description | 有 |
| H3 标题 | **无** |
| 内链数（出） | 3 条（最少） |
| FAQ | 有 |

**内容层面问题**

- **内链最少（3条）**：这是所有页面中内链出口最少的，也可能是入口最少的，发现性最差
- Title 标榜"Mercury Retrograde 之后"这个时机角度有差异化，但关键词前置 "Full Moon July 2026" 处理还可以

**优化建议**

1. **立即增加内链入口**：从 Mercury retrograde 页、july 2026 transits 页、lunar calendar 类页面加入本页链接
2. **新增 H3 结构**：
   - 在 "How to Read full moon July 2026 in Your Timing" 下：
     - `H3: What Changes After Mercury Retrograde Ends`
     - `H3: The Aquarius Full Moon Theme`
     - `H3: Integrating Retrograde Insights at the Full Moon`

---

### B14 — full-moon-journal-prompts

**URL：** https://www.astrologywiki.com/en/wiki/full-moon-journal-prompts  
**page_id：** PG-MOON-007

**页面现状**

| 项目 | 状态 |
|---|---|
| Title tag | "Full Moon Journal Prompts That Actually Match Lunar Energy" |
| H1 | 同 Title |
| 字数 | ~2,400 词 |
| Meta description | 有 |
| H3 标题 | **无** |
| 内链数（出） | 5 条 |
| FAQ | 有 |

**内容层面问题**

- H2 "What is full moon journal prompts?" 语法错误，意图也不对——用户搜这个词期待看到具体 prompts 列表，但 H2 在解释"是什么"
- 搜索意图：用户要的是可以直接用的问题列表，确认文章里有没有足够多的具体问题（prompt 条数是否足够）

**优化建议**

1. **H2 修正**："What is full moon journal prompts?" → "What Are Full Moon Journal Prompts?" 或直接改为 "How to Use These Prompts"
2. **检查并增加 prompt 数量**：搜 "full moon journal prompts" 的用户期待 10-30 条具体问题，确认文章是否给够
3. **新增 H3 结构**（这篇最适合按主题拆 H3）：
   - 在 prompt 列表区块加 H3 分组：
     - `H3: Prompts for Release and Letting Go`
     - `H3: Prompts for Recognizing What Grew`
     - `H3: Prompts for Relationships and Connection`
     - `H3: Prompts for Your Birth Chart and This Moon`
   - 在 FAQ 区块用 H3：
     - `H3: When Should I Write? Before or After the Full Moon?`
     - `H3: How Many Prompts Should I Use?`

---

## 四、优先级排序

| 优先级 | 页面 | 原因 |
|---|---|---|
| 🔴 立即处理 | full-moon-june-2026 | 满月 6/29，窗口剩 16 天 |
| 🔴 立即处理 | full-moon-july-2026 | 内链最少，必须先修复发现性 |
| 🔴 立即处理 | chakra-system-overview | 关键词错配，是 chakra 集群入口页 |
| 🟡 本周处理 | vedic-birth-chart-calculator | GSC 直接指出 H1 无关键词 |
| 🟡 本周处理 | chakra-test | 搜索意图错配，需加测试入口 |
| 🟡 本周处理 | 6th-house-astrology | 已被爬取，内容质量提升见效快 |
| 🟡 本周处理 | what-is-a-full-moon-ritual | 语法错误多，H1 意图覆盖不完整 |
| 🟢 下周处理 | 其余 9 篇 | 批量修复 H3 + 内链入口 |

---

## 五、批量修复 Checklist（全 16 篇）

- [ ] 在 sitemap.xml 中确认这 16 个 URL 均已列入
- [ ] 每篇新增 H3 标题（按本文各页建议执行）
- [ ] 从已收录 pillar 页增加内链指向这 14 篇"无法识别"的页面
- [ ] 修正所有 H2 中小写和语法错误
- [ ] GSC 修复后重新提交 URL 请求索引
