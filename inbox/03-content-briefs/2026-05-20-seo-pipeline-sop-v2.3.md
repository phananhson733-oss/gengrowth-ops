---
project: astrologywiki
type: sop
status: review
owner: Ma Boyang
updated: 2026-05-20
version: 2.3
---

# 🚀 SEO 内容生产流水线 (v2.3 · 运营极速落地版)

> **核心哲学**：执行阻力必须低于执行收益。在保护数据闭环的基础上，削减认知摩擦，防止“治理过度”。
> **版本定位**：v2.3 重点重组了生产流水线（分离独立 QA），柔化了过度机械化的 AI 痕迹，并修正了过时的 SEO 排查逻辑，确保 SOP 是一线运营真正“愿意用、能用快”的实操手册。

---

## 📊 第一部分：基础设施 - 选题登记表与数据保护

本环节在 Google Sheets 中完成。采用**三层数据模型**：数据层 (Ahrefs原表) -> 架构层 (主题集群表) -> 表现层 (选题登记表)。

### 1. 《选题登记表 v2.3》标准表头 (Schema)
> ⚠️ **落地风险提示 (供管理层监控)**：当前表头字段较多，初期跑通流程时运营人员需严格按要求填写。待流程稳定后，建议通过“隐藏列”和“保护范围”，将视图分为“生产必填”、“自动锁定”和“策略隐藏”三层，以降低认知过载。

| 列 | 字段名称 (Header) | 填充性质 | 功能说明 |
| :--- | :--- | :--- | :--- |
| **A** | **`page_id`** | 人工/递增 | 唯一 ID（如 `P-001`），全系统追踪主键。 |
| **B** | **`cluster_id`** | 下拉菜单 | 关联“主题集群表”。**建卡前置核查项。** |
| **C** | **`Track`** | 下拉菜单 | 线别：量产线 (Mass) / 精修线 (Refine)。 |
| **D** | **`Target Keyword`** | 人工输入 | A列主排名词。**命中黑名单时该行自动标红。** |
| **E** | **`Associated Keywords`** | AI/人工 | 1+N 折叠词包。**严禁物理删除主表中的对应行。** |
| **F** | **`MSV (US)`** | **公式自动** | VLOOKUP 关键词主表，获取美国月搜索量。 |
| **G** | **`KD`** | **公式自动** | VLOOKUP 关键词主表，获取竞争难度。 |
| **H** | **`Intent`** | **公式自动** | 四层漏斗判定：Utility / Compare / Tutorial / Info。 |
| **I** | **`Tier`** | 下拉菜单 | 产能定级：T1 (重装) / T2 (标准) / T3 (占位)。 |
| **J** | **`page_role`** | 下拉菜单 | Pillar / Spoke / Tool / Wiki / Standalone。 |
| **K** | **`Template`** | 下拉菜单 | 匹配附录 A 的五类页面结构模板。 |
| **L** | **`Content Angle`** | AI/人工 | 精修线必填：一句话差异化创作视角。 |
| **M** | **`Psych Safety`** | **公式自动** | 安全开关：命中敏感词自动亮起 `Y`。 |
| **N** | **`Entity`** | AI 提取 | 5 个核心专业术语，用于建立语义主权。 |
| **O** | **`Friction`** | Reddit 搜证 | 真实用户痛点/抱怨证据。 |
| **P** | **`Logic`** | AI/人工 | 机制拆解与 Trade-off 权衡逻辑。 |
| **Q** | **`Primary CTA`** | **公式映射** | 自动关联 `cta_id`，用于 AI 指令。 |
| **R** | **`Status`** | 下拉菜单 | 待写 / 写作中 / 审核中 / 已发布 / **已合并(Archived)**。 |
| **U** | **`us_share`** | **公式自动** | 从集群表透传美国流量占比（高/中/低）。 |

### 2. 意图拆分与 1+N 语义折叠 (双重判定法则)
1. **意图辅助判定 (H列 - Intent)**：公式自动剥离的意图仅作为 **Auto Suggested (建议)**。运营必须进行 1 秒常识校验，若发现偏差（如 `cancer horoscope` 被误判为 Info），**必须**使用人工覆盖修正，切忌盲从。
2. **1+N 折叠升级（同 Intent + 同 Query Job）**：
   * 仅当多个变体词的 **意图相同 且 用户真实任务相同** 时，才允许折叠。（如：`how to read birth chart` 与 `understand natal chart` 可折叠；但 `free calculator` 与 `best calculator` 任务不同，严禁强行折叠）。
   * **数据保护**：被合并的词在《关键词主表》标记为 `merged_into_page_id`；《选题登记表》内标记 `Archived` 并隐藏，严禁物理删除。

---

## 🧠 第二部分：核心判定标准矩阵

### 1. 地区闸门：`us_share` 优先准则
在建卡前，核查 `U列 (us_share)`：
*   **低美国占比 (`Low`)**：禁止占据 P0 产能。原则上仅限 T3 处理，或存入 Backlog 等待季节性激活。
*   **中/高美国占比**：正常分配 T1/T2 资源。

### 2. 产能定级与排期标准 (Tiering Matrix)
> ⚠️ **执行红线**：由于 T3 已通过机械化压缩至 5 分钟内，节省下的产能**必须**全量反哺给 T1。T1 单篇耗时恢复为 **45-60 分钟**，以确保支柱页的绝对质量，严禁在 T1 上偷工减料。

| 产能定级        | 判定触发条件 (满足任一)                   | 策略目的          | 人工介入深度 (限时要求)                           |
| :---------- | :------------------------------ | :------------ | :-------------------------------------- |
| **T1 (重装)** | 核心商业词 / 高危敏感词 / Pillar          | 建立不可撼动的品牌信任度。 | **深 (45-60 min)**：手动挖痛点；深度审校；配置高阶 EEAT。 |
| **T2 (标准)** | 正常行业词 / 中等竞争的 Spoke             | 稳步收割流量，建立知识树。 | **中等 (10-15 min)**：检查 AIO 饵块、H2 逻辑。     |
| **T3 (占位)** | 月搜索量极低 (<50) / SERP 混乱 / 商业价值极低 | 以最低成本实现广度覆盖。  | **浅 (< 5 min)**：机械组装，不搜证，仅过基础 QA。       |

### 3. 文章角色定义字典 (Page Role Matrix)
*   **Pillar (支柱)**：统领集群，必定 T1。必须包含向下辐射链接。
*   **Spoke (支撑)**：垂直细分话题。必须包含向上回链。
*   **Tool (工具)**：流量黑洞，承接交互，极少向外链。
*   **Standalone (独立卫星)**：无法归簇的高优词 ($\le 10\%$流量盘)。无强制内链负担。

---

## 🛠 第三部分：更顺滑的六步流水线 (Day-to-Day Execution)

废除旧版逻辑跳跃的步骤，改用完全符合一线作业直觉的线性流程。**执行关键：各步骤在 T1/T2/T3 下的介入深度存在严格差异，请依据定级精准投放时间。**

### STEP 1：建卡与闸门 (全局耗时: 2 分钟)
1. **判定准入**：核查 `us_share`。若为 `Low`，直接降级为 T3 极速处理，或存入 Backlog 等待季节性激活。
2. **确认字段**：填入 ID，下拉选择 Cluster，人工校验 `Intent` 与 `Tier`。
   * **[T1 专属红线]**：必须核对本周配额。**每周 T1 配额严格限制在 ≤ 3 篇**。一旦超额，新文章必须降级为 T2 或顺延至下周。
3. **分配资源**：为页面明确指定 `Primary CTA`（如工具页入口或 Newsletter 订阅）。

### STEP 2：人工搜证 (T1: 15-25 分 / T2: 5 分 / T3: 0 分)
*   **[T3 占位页]**：**直接跳过此步**。不进行任何人工搜证，以最低成本推进至下一环节。
*   **[T2 主力页]**：
    1. **实体覆盖**：利用 AI 快速扫描 SERP 前 3 名，提取 3-5 个核心 Entity 填入 N 列。
    提示词：”去google搜索这个关键词，找到排名前五的页面，总结这五个页面的内容，提取5 个核心 Entity 词。不要提取单词，最好是有2-3个词组成的词组“
*   **[T1 重装页]**：
    1. **深度实体**：人工判断并补充差异化的专业词汇。
    2. **真实痛点 (Friction)**：必须去 Reddit 搜索 `site:reddit.com "[Keyword]" (sucks | confused | myth)`，人工提炼 2-3 条真实用户的槽点与误区填入 O 列。
    3. **高阶 EEAT (针对敏感词)**：若触发 `Psych Safety`，必须准备专属的 Editorial Methodology 声明（如：*This content was reviewed for factual consistency and updated based on current astrological terminology.*），严禁使用单薄的“Reviewed by Team”。

### STEP 3：AI 组装与柔化 (T1: 10-20 分 / T2: 5 分 / T3: <2 分)
将参数包发送给 AI：`Target Keyword: {D列} | Associated Keywords: {E列} | Intent: {H列} | Tier: {I列} | CTA_ID: {Q列} | Friction: {O列}`
*   **[全局柔化约束]**：
    1. **Direct Answer Block**：首段必须直接回答意图。**严禁机械套用 `## TL;DR` 标题**，标题和结构必须自然融入当前页面角色（如运势类直接给结论）。
    2. **按需 FAQ**：**废除 T3 强制生成 FAQ 的机械要求**。仅当词包中存在明确的 Follow-up Query（如 "how long", "can you"）时，才转化为 FAQ，避免触发 AI 低质惩罚。
    3. **自然 CTA**：在最相关的语境节点（如 H2 前）自然植入转化。
*   **[T3 专属]**：使用全自动 Prompt 一键成文，生成后不进行任何人工润色。
*   **[T1 专属]**：重点人工审查 AI 生成的结构。打磨 H2/H3 逻辑深度，确保 Friction 被深刻解答，消除 AI 特有的套话与废话。

### STEP 4：独立 QA 质检 (全局耗时: 5-10 秒/篇)
文章生成后，禁止连贯盲发，必须执行独立的“5秒 Pass/Fail”测试。
*   **[T2/T3]**：扫视第四部分规定的 5 项基础红线。
*   **[T1 专属]**：额外校验“医疗诊断违禁词 (cure, treat, diagnose)”是否出现，及 `Editorial Methodology` 是否正确挂载。

### STEP 5：部署与内链连线
1. **站内首发**：将排版后的 Markdown 部署至 CMS。
2. **结构化内链**：
   * **[Pillar 页面]**：必须插入一个导航网格或列表，向下辐射到已知的 Spoke。
   * **[Spoke 页面]**：正文前 30% 必须包含一条自然语境的文本链接，指回对应的 Pillar。
   * **[所有 Blog 页面通用规则]**：每篇 blog 正文必须包含 **≥2 条指向工具页/产品页的内链**，锚文本使用功能描述而非品牌词（如"birth chart calculator"而非"AstrologyWiki"）。这是 blog 流量转化为工具页权重的唯一路径——趋势词带来的流量不会自动传递给工具页，必须靠内链主动导流。
3. **CTA 核验**：最后确认一次转化按钮逻辑畅通无阻。

### STEP 6：生命周期复盘与调优 (Day 14/30/60)
*   **Day 14 (收录检)**：未收录则检查页面基础质量或提交 Search Console。
*   **Day 30 (排名检 - 科学排查)**：若未进 Top 100，**严禁无脑堆砌 Entity**。按此路线排查：
    `Intent mismatch (意图错位) -> Title mismatch (标题不符) -> Internal links (内链支撑不足) -> Content gap (内容缺口) -> Entity coverage (实体覆盖)`。
*   **Day 60 (处置检)**：
    *   **[T1/T2]**：流量达标升入 Refine 线常态维护；未达标则需调整 Content Angle 或合并重写。
    *   **[T3]**：长期无点击的长尾低质内容，直接评估进入“资产合并/301”通道。

---

## 📉 第四部分：红线机械质检 (5秒 Pass/Fail)
所有文章发布前，QA / 运营人员必须扫视以下 5 个特征。1 项不符即打回：

1. ▢ **首段直接回答？** (是否废话太多？是否具备 Direct Answer Block？)
2. ▢ **CTA 是否存在？** (是否有明确的转化引导并与角色匹配？)
3. ▢ **是否有真实 Friction？** (内容是否触及了真实痛点，还是泛泛而谈？)
4. ▢ **有无决策支持结构？** (至少存在一个打破纯文本的结构：对比表 / 步骤编号 / 引用块)
5. ▢ **视觉可扫描？** (没有大段拥挤的文字块，排版清爽)

---

---

## 📐 第五部分：文章结构公式（unifab.ai 实证）

> 来源：对 unifab.ai 600+ 页面的结构分析，该站在竞争激烈的 AI 工具赛道月有机流量持续增长，内容结构高度可复用。

### 标准 Blog 文章公式

```
H1: [核心关键词] — [差异化主张] [年份]

① 教育段（建立可信度，不提产品）
   → 直接回答搜索意图（首段必须有 Direct Answer Block）
   → 对比表 / 规格表 / 步骤编号（至少一个结构化视觉元素）

② 决策框架（帮用户做选择）
   → "Which Should You Choose?" 类型的场景分流
   → 不同需求 → 不同答案，避免"两者都好"的无效结论

③ 产品桥接（自然过渡，不硬广）
   → "AI upscaling bridges the gap" 类型的功能引入
   → 此处植入第一个 CTA（Free Download / Try Now）

④ 教程/演示段（用产品解决上文提到的问题）
   → 带截图的步骤式操作
   → 此处植入第二个 CTA

⑤ FAQ（8–10 个问题，带 FAQPage schema）
   → 覆盖 PAA（People Also Ask）问题
   → 每个答案 ≤ 300 字符

⑥ 结论 + 第三个 CTA
   → 明确的推荐语句："Choose [产品] if you need X"
```

**字数目标：T1 文章 4,000–6,000 字，T2 文章 2,000–3,000 字**

---

### 竞品对比文章生产指南（高优先级内容类型）

**为什么要做：** 搜索竞品名称的用户处于购买决策阶段，转化率是普通信息词的 3–5 倍。unifab.ai 42% 的 blog 是竞品评测/对比文章，这是他们最重要的流量来源之一。

**适用于 AstrologyWiki 的竞品词示例：**
- "Co-Star vs AstrologyWiki"
- "Cafe Astrology vs AstrologyWiki"
- "Pattern app alternative"
- "The Pattern astrology app review"

**适用于 brdeco 类 B2B 客户的竞品词示例：**
- "Kingspan vs BRDECO rockwool panel"
- "ROCKWOOL vs brdeco sandwich panel"
- "EPS vs PU vs PIR vs rockwool insulation comparison"

**竞品文章结构公式：**

```
H1: [竞品名] Review [年份]: Features, Pricing & Best Alternative

① 快速结论（30秒让用户知道答案）
② 竞品介绍（中立，不攻击）
③ 真实测试 / 对比数据（具体数值，可截图）
④ 定价对比（将竞品定位为"有限制的选项"）
⑤ 优缺点表格（缺点用具体场景描述，不用笼统批评）
⑥ 功能差异矩阵：竞品有的 / 双方都有（我方更好）/ 我方独有
⑦ 结论：明确写 "Choose [我方产品] if..." 和 "Choose [竞品] if..."
⑧ FAQ（8–10 个，带 schema）
```

**注意：** 竞品文章需要基于真实测试或公开数据，不能捏造竞品缺陷。描述痛点时使用"部分用户反映"或引用真实评论。

---

## 🌐 第六部分：GEO 配置三动作

> GEO（Generative Engine Optimization）= 优化内容被 ChatGPT/Gemini/Perplexity 引用的概率。好的 SEO 是 GEO 的基础，以下三个动作是额外补充，非独立系统。

### 动作一：robots.txt 开放 AI 爬虫

检查网站 robots.txt，确认以下 AI 爬虫未被 Disallow：

```
# 必须允许的 AI 爬虫
GPTBot（OpenAI）
Anthropic-ai（Claude）
Google-Extended（Gemini/AI Overview）
PerplexityBot
CCBot（Common Crawl，AI训练数据来源）
```

如果有 `Disallow: /` 规则，AI 系统无法爬取任何页面，GEO 效果归零。unifab.ai 的配置是 `User-agent: * Allow: /`，完全开放。

### 动作二：内容写法加"直接答案段落"

每篇文章每个 H2 章节的开头，用一到两句话直接给出结论，不铺垫。

```
❌ SEO写法（合格但GEO弱）：
"When it comes to comparing 4K and 8K resolution, there are many 
factors to consider, including..."

✅ GEO写法（AI可直接引用）：
"4K (3840×2160) is sufficient for screens under 85 inches viewed 
at normal distance. 8K adds visible benefit only on 100+ inch 
screens or in professional production workflows."
```

AI 引用的是"可以直接粘贴进答案"的句子，不引用铺垫段落。

### 动作三：Organization Schema（只需做一次）

在网站根层级 `<head>` 中加入 Organization schema，告诉 AI 系统这个网站是谁：

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "AstrologyWiki",
  "url": "https://astrologywiki.com",
  "description": "Free astrology tools and birth chart analysis",
  "sameAs": [
    "https://twitter.com/astrologywiki",
    "https://instagram.com/astrologywiki"
  ]
}
```

这个 schema 帮助 AI 建立"网站身份"的实体认知，是 AI 引用时出现品牌名的基础。

---

## 🔄 第七部分：Changelog
*   **v2.3 (2026-05-20)**: 
    *   **流程重构**：重组为极速落地的“建卡->搜证->组装->QA->部署->复盘”六步线性流程。
    *   **QA 独立**：重写了更具实操性的“5秒 QA”标准（首段直答/CTA/Friction/决策结构/视觉）。
    *   **折叠升级**：1+N 折叠增加“同 Query Job (用户任务)”强制约束，防止乱合。
    *   **产能校准**：T1 耗时预期从 45min 降至 20-35min，T3 判定标准去除了宏观 KPI 描述，改为直接判断月搜与 SERP。
    *   **AI 降噪**：废除僵化的 `## TL;DR` 标题与 T3 强制 FAQ，改为更自然的 Direct Answer Block 与按需追问。
    *   **科学排查**：升级 Day 30 复盘排查逻辑，避免“跌出 Top100 就加密度”的过度优化。
