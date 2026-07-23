---
title: SEO SOP 升级补丁 — unifab.ai 学习
date: 2026-07-07
updated: 2026-07-08
status: v5
适用文件: seo-pipeline-sop-v2.3.md / blog优化更新规范-v1.0.md
来源: unifab.ai 全站多页面爬取分析
参考文档: inbox-maboyang/03-content-briefs/2026-07-08-unifab-seo-分析报告.md
---

# SEO SOP 升级补丁 — unifab.ai 竞品学习

> 本文件不修改原 SOP，作为独立补丁使用。在原 SOP 执行过程中，遇到对应场景时参照本补丁执行。待下次 SOP 大版本更新时合并为 v2.4。
>
> 仅收录 AstrologyWiki **尚未执行**的项目。已执行项（首页 H2 规则、robots.txt、WebApplication schema、工具页无定价）不在此列。

---

## 目录

| 场景分类           | 补丁编号 | 补丁名称               |
| -------------- | ---- | ------------------ |
| **一、网站技术端**    | 补丁一  | GEO 完整配置清单         |
| **二、Blog 页面**  | 补丁二  | Blog 文章结构公式升级      |
|                | 补丁三  | 工具页内链硬性规则          |
|                | 补丁四  | 竞品对比文章——新增高优先级内容类型 |
|                | 补丁五  | 嵌入产品教程模块           |
|                | 补丁六  | Blog 末尾注册弹窗        |
| **三、产品/工具落地页** | 补丁七  | 工具页专项规则            |
|                | 补丁八  | 工具落地页转化架构          |
| **四、内链进阶**     | 补丁九  | 锚文本三维分布比例          |
|                | 补丁十  | nofollow 内链的语义价值   |
|                | 补丁十一 | 单页链出数量上限           |
|                | 补丁十二 | Crawl Budget 进阶管理  |
|                | 补丁十三 | 内链审计新增 noindex 检查 |
|                | 补丁十四 | 跨集群互链克制规则          |
| **五、技术与移动端**   | 补丁十五 | Core Web Vitals 精确指标 |
|                | 补丁十六 | 移动端触点与弹窗规范         |
| **六、内容创作**     | 补丁十七 | 数据化反差标题公式（第5种）    |

---

## 一、网站技术端

> 新站上线前执行一次，现有站点补齐缺项。

### 补丁一：GEO 完整配置清单

**适用场景：** 新站点上线前 / 现有站点 GEO 配置检查。
**数据来源：** unifab.ai curl 实测（2026-07-08 验证）

#### 动作一：H2 开头加直接答案句

```
❌ 弱 GEO 写法：
"When it comes to Scorpio compatibility, there are many aspects
to consider, including..."

✅ 强 GEO 写法：
"Scorpio is most compatible with Cancer, Pisces, and Virgo.
Water signs share Scorpio's emotional depth, while Virgo
provides grounding stability."
```

#### 动作二：Organization schema + sameAs（首页 SSR，全站一次）

unifab 实际使用的完整格式（已验证）：

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "AstrologyWiki",
  "legalName": "AstrologyWiki Ltd",
  "url": "https://astrologywiki.com",
  "sameAs": [
    "https://www.youtube.com/@astrologywiki",
    "https://x.com/astrologywiki",
    "https://www.reddit.com/r/AstrologyWiki/"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "email": "support@astrologywiki.com",
    "contactType": "customer support"
  }
}
```

sameAs 的作用：让所有 AI 爬虫把网站和各社媒账号识别为同一个品牌实体，在 AI 知识库里形成清晰的实体节点。

#### 动作三：Person（作者实体）schema — EEAT 信号

当前问题：作者页已存在（`/en/wiki/author/marcus-orion`），但有两处需修复：
1. `"disambiguatingDescription": "Editorial persona of AstrologyWiki, not a real individual."` — 删除这行，主动声明非真实会直接削弱 EEAT
2. 缺少四个关键字段

unifab 完整 Person schema 结构（已验证）：

```json
{
  "@type": "Person",
  "name": "[作者名]",
  "jobTitle": "AstrologyWiki Editor",
  "description": "[作者简介，含专业背景]",
  "worksFor": {"@id": "https://astrologywiki.com/#organization"},
  "sameAs": ["https://x.com/[作者Twitter]"],
  "knowsAbout": ["Astrology", "Birth Chart Reading", "Zodiac Analysis"],
  "alumniOf": [{"@type": "EducationalOrganization", "name": "[学校名]"}]
}
```

**四个字段缺一不可：**
- `knowsAbout`：直接声明专业领域，Google 用于评估 Expertise
- `alumniOf`：学历背书，增强 Trustworthiness
- `sameAs`：跨平台实体验证，证明作者真实存在
- `worksFor`：把作者绑定到 Organization 实体，雇佣关系可核验

同时，博客文章的 `author` 字段当前指向 `"AstrologyWiki Editorial Team"（Organization 类型）`，需改为指向对应作者页的 Person 实体 `@id`。

#### 动作四：HowTo schema（嵌入教程模块时添加）

**unifab 的 Step 1/2/3/4 模块没有加这个标记——这是他们的漏洞，我们可以做到而他们没做。**

在 Step 1/2/3 教程模块的 HTML 里加入 HowTo schema：

```json
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "How to Read Your Birth Chart on AstrologyWiki",
  "step": [
    {
      "@type": "HowToStep",
      "position": 1,
      "name": "打开 Birth Chart Calculator",
      "text": "前往 AstrologyWiki Birth Chart Calculator 页面"
    },
    {
      "@type": "HowToStep",
      "position": 2,
      "name": "输入出生信息",
      "text": "填入出生日期、时间和地点"
    },
    {
      "@type": "HowToStep",
      "position": 3,
      "name": "查看解读结果",
      "text": "获取太阳、月亮、上升星座的完整解读"
    }
  ]
}
```

触发效果：SERP 步骤预览富文本、AI 引用操作类查询时优先选取。

#### 动作五：第三方引用建设（持续执行）

AI 系统的回答不只依赖自有网站内容，也大量引用第三方评测和目录。unifab 已建立的引用矩阵（已验证）：

| 平台类型 | unifab 已入驻 | AstrologyWiki 对应目标 |
|---|---|---|
| 用户评分平台 | Trustpilot | Trustpilot |
| 专业评测站 | FilterGrade、SoftwareTestingHelp | 占星/工具类评测博客 |
| AI 工具目录 | Futurepedia | Futurepedia、There's An AI For That |
| Reddit 版块 | r/UniFabCreators（自建）| r/astrology 话题参与 |
| YouTube | @UniFabofficial | @astrologywiki |

**执行原则：** 优先进入 Trustpilot 和 Futurepedia——这两个是 AI 系统高频引用的平台。

#### 动作六：Ask AI 主动引导模块（首页 + 工具页）

unifab 首页设有"Ask AI about UniFab"按钮，点击后直接跳转至 AI 工具并预填品牌查询。

```
被动 GEO（动作一~五）：优化内容 → 等 AI 爬虫发现 → 期望被引用
主动 GEO（动作六）  ：用户点击 → 跳转 AI → 产生品牌对话 → 强化 AI 关联
```

实现方式：

```
Perplexity：https://www.perplexity.ai/?q=[预填查询，URL编码]
ChatGPT：  https://chatgpt.com/?q=[预填查询，URL编码]
```

AstrologyWiki 示例：
```
按钮文案：Ask AI about AstrologyWiki
跳转链接：https://www.perplexity.ai/?q=What+is+AstrologyWiki+and+how+does+the+birth+chart+calculator+work
```

**执行红线：** 预填查询必须自然，不能堆砌关键词，否则 AI 给出差评式回答反而损害品牌。

---

## 二、Blog 页面

> 每篇 T1/T2 文章创作时参照执行。

### 补丁二：Blog 文章结构公式升级

**适用场景：** v2.3 STEP 3（AI 组装）阶段，T1/T2 文章的结构搭建。

unifab.ai 所有高流量文章遵循以下完整结构：

```
H1: [核心关键词] — [差异化主张] [年份]

① 教育段（建立可信度，此处不提产品）
   → 首句必须直接回答搜索意图（Direct Answer Block）
   → 至少一个结构化视觉元素：对比表 / 规格表 / 步骤编号

② 决策框架（帮用户做选择）
   → "Which Should You Choose?" 类场景分流
   → 不同需求给不同答案，禁止"两者都好"的无效结论

③ 产品桥接（自然过渡，不硬广）
   → H2 命名为"[功能]: The Bridge Between X and Y"或类似中立语气
   → 此处植入第一个 CTA（Free / Try Now）

④ 嵌入产品教程模块 ← 核心转化机制
   → 见补丁五（详细规范）

⑤ FAQ（8–10 个问题，带 FAQPage schema）
   → 覆盖 PAA（People Also Ask）真实问题
   → 每个答案 ≤ 300 字符

⑥ 结论 + 第三个 CTA
   → 明确推荐句式："Use [产品] if you need X"
   → 相关阅读推荐（4 篇，含工具页和其他 blog）
```

**字数目标：**
- T1 文章：4,000–6,000 字
- T2 文章：2,000–3,000 字

**对现有 SOP 的变化：**
- FAQ 数量从"按需 4–6 个"升级为"T1/T2 文章 8–10 个"
- CTA 从"1 次结尾"升级为"全文 3 次（桥接段 / 教程模块 / 结尾）"
- 新增④嵌入产品教程模块（见补丁五）

---

### 补丁三：工具页内链硬性规则

**适用场景：** v2.3 STEP 5（部署与内链连线），所有 blog 类型页面。

在原有 Pillar↔Spoke 内链规则之外，新增：

> **每篇 blog 正文必须包含 ≥2 条指向工具页/产品页的内链。**

| 规则项 | 要求 |
|---|---|
| 数量 | 每篇 ≥2 条工具页内链 |
| 锚文本 | 功能描述词，不用品牌词（"birth chart calculator" 而非 "AstrologyWiki"）|
| 位置 | 正文中部一条 + 结尾一条，不要全堆在末尾 |
| 链接目标 | 必须指向工具页本身（`/en/birth-chart-calculator`），不能指向"如何使用"类文章 |
| 方向 | blog → 工具页（单向）；工具页也反向推荐相关 blog（底部 4 条）|

**AstrologyWiki 可用内链目标：**
- Birth Chart Calculator
- Rising Sign Calculator
- Moon Sign Calculator
- Chinese Zodiac Calculator
- Saturn Return Calculator

**工具页反向内链（补充）：** 工具落地页底部同样应推荐 4 条相关 blog 文章（操作教程类锚文本），形成双向流量循环。

---

### 补丁四：竞品对比文章——新增高优先级内容类型

**适用场景：** v2.3 STEP 1（建卡）阶段，内容选题决策。

#### 为什么要做竞品文章

搜索竞品名称的用户已进入购买决策阶段，转化率是普通信息词的 3–5 倍。unifab.ai 42% 的 blog 是竞品评测/对比文章，单篇流量上限高于普通教程文章。

#### 适用词类型

| 站点 | 竞品词示例 |
|---|---|
| AstrologyWiki | "Co-Star vs AstrologyWiki"、"Cafe Astrology alternative"、"The Pattern app review" |
| brdeco 类 B2B | "Kingspan vs BRDECO"、"ROCKWOOL sandwich panel alternative"、"EPS vs PIR vs rockwool" |

#### 竞品文章完整结构

```
H1: [竞品名] Review [年份]: Features, Pricing & Best Alternative

① 快速结论（让用户 30 秒内知道答案）
② 竞品介绍（中立语气，不攻击）
③ 真实测试 / 对比数据（具体数值，有截图更好）
④ 定价对比（将竞品定位为"有限制的选项"）
⑤ 优缺点表格（缺点用具体场景描述，不用笼统批评）
⑥ 功能差异矩阵
   - 竞品有但我方没有（诚实列出，建立信任）
   - 双方都有，我方更好
   - 我方独有
⑦ 嵌入产品教程模块 ← 关键，此处转化率最高
   （见补丁五）
⑧ 结论：明确写两个句子
   "Choose [竞品] if you need X"
   "Choose [我方] if you need Y"
⑨ FAQ（8–10 个，带 FAQPage schema）
```

**执行红线：** 竞品缺陷描述必须基于真实测试或公开用户评论，不能捏造。描述时用"部分用户反映 X"或引用 Reddit/App Store 真实评论。

**选题登记表定级：** 竞品对比文章统一定为 **T1**。

---

### 补丁五：嵌入产品教程模块（新增）

**适用场景：** 所有 T1 文章的④段（产品桥接后），以及竞品文章的⑦段。

这是 unifab.ai blog 最核心的转化设计，将信息型流量直接转化为产品体验。

#### 模块结构

```
[H3] How to [解决用户在文章中遇到的问题] With [产品名]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[主 CTA 区]
[免费试用 / 免费开始] 按钮
[说明文案]：30-day Free Trial with full feature access!

[设备分支按钮]（如有多端）
[ 网页版 ]  适用所有设备
[ 移动端 ]  iOS / Android

[信任背书文案]（每个按钮旁）
100% Free to Start / No Signup Required

Step 1: [第一步操作，一句话]
Step 2: [第二步操作，一句话]
Step 3: [第三步操作，一句话]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

#### AstrologyWiki 适配示例

文章：「Harry Kane Birth Chart」

```
[H3] How to Read Harry Kane's Full Birth Chart on AstrologyWiki
━━━━━━━━━━━━━━━━━━━
[ 免费生成星盘 ]
No signup required

Step 1: 打开 AstrologyWiki Birth Chart Calculator
Step 2: 输入 Harry Kane 的出生日期（1993年7月28日）
Step 3: 查看太阳星座、月亮星座和上升星座完整解读
━━━━━━━━━━━━━━━━━━━
```

#### 设计逻辑

- 用户因搜索名人星盘词进入（冷流量，不知道 AstrologyWiki）
- 教程模块将"我在看内容"转变为"我在操作工具"
- Step 格式可触发补丁一动作四中的 HowTo schema，在 SERP 显示步骤预览
- H3 文案本身（"How to Read Birth Chart"）覆盖 how-to 类长尾词

**一篇文章同时命中三个搜索意图：**
1. "[名人] birth chart"（星盘查询）
2. "[名人] zodiac sign"（星座查询）
3. "How to read birth chart"（操作教程）

---

### 补丁六：Blog 末尾注册弹窗（新增）

**适用场景：** 所有 blog 页面的转化兜底机制。

#### 触发条件

| 触发方式 | 时机 | 优先级 |
|---|---|---|
| Scroll-depth | 用户滚动至文章 80–90% 位置 | 首选 |
| Exit-intent | 鼠标移出页面顶部边缘 | 备选 |

#### 弹窗内容

收集 email 注册，**不是直接推购买**。原因：

```
Blog 访客 = 冷流量，购买意图低
        ↓
直接推付费：转化率 <1%
先获取 email：转化率 5–15%
        ↓
Email 序列（7–14天）
Day 1: 欢迎 + 功能介绍
Day 3: 使用教程
Day 7: 限时优惠 → 付费转化
```

#### AstrologyWiki 适配

弹窗内容建议：
```
[弹窗标题] Get Your Weekly Cosmic Update
[副标题]   Personalized horoscopes delivered every Monday
[输入框]   Your email address
[CTA]      Send My Horoscope →
[小字]     No spam. Unsubscribe anytime.
```

用每周星盘运势作为 email 钩子，对占星用户吸引力高，后续序列可推付费星盘报告或工具升级。

#### 实现要求

- **不在工具页和首页触发**，仅限 blog 文章页
- 同一用户 30 天内只触发一次（cookie 控制）
- 弹窗不覆盖全屏，使用底部滑入或角落卡片形式（避免 Google 侵入式弹窗惩罚）

---

## 三、产品/工具落地页

> 工具页创建或改版时执行。

### 补丁七：工具页专项规则

**适用场景：** 工具落地页 / 产品页的创建和维护。

#### 7.1 工具页 H2 策略（与首页相反）

| 页面类型 | H2 策略 |
|---|---|
| 首页 | H2 不放产品关键词（防自噬）|
| 工具页 | H2 每个都含核心关键词（强化语义）|

当前问题：Birth Chart Calculator 工具页的 H2 是"Natal chart foundation"、"Planet and angle inventory"等，均不含"birth chart calculator"关键词。

**正确示例：**
```
H1: Birth Chart Calculator — Free Natal Chart in Seconds
H2: Birth Chart Calculator with 3 Interpretation Layers
H2: Generate Your Full Birth Chart Online — No Signup Required
H2: What's New in AstrologyWiki Birth Chart Calculator
H2: What AstrologyWiki Users Say About Birth Chart Reading
```

#### 7.2 工具页"What's New"版本日志板块

工具页末部添加版本更新记录，每次产品更新追加一行，持续发送页面新鲜度信号：

```
## What's New in AstrologyWiki Birth Chart Calculator

July 2026: Added Whole Sign House System option
May 2026:  Improved aspect orb accuracy for minor aspects
```

#### 7.3 高价值竞品词建独立 .htm 页，不放 blog

对月搜索量 ≥500 的直接竞品对比词，建立根目录 `.htm` 格式对比页：

```
✅ /co-star-vs-astrologywiki.htm   ← 根目录，权重最高，转化导向
❌ /resource/co-star-vs-astrologywiki  ← 二级路径，权重较低
```

信息型竞品文章（比较多个产品）仍放 `/resource/` blog。

---

### 补丁八：工具落地页转化架构

> 来源：unifab 工具页（/video-upscaler.htm）的实际转化设计，适用于所有有商业目标的工具落地页。

#### 8.1 信任信号三层布局

```
顶部：媒体/平台背书（Guru99 / Trustpilot / WikiHow 等图标横幅）
      → 快速扫视的用户看这里，解决"这个工具靠谱吗"的疑虑

中部：功能演示 + 版本对比表（如 Free vs Pro / 本地版 vs 云版）
      → 理性决策用户看这里，解决"这个工具能不能满足我"的疑虑

底部：真实用户评价（含姓名 / 职业 / 具体使用场景）
      → 临近转化用户看这里，完成最后的情感说服
```

**AstrologyWiki 对应落地：**
- 顶部：产品被媒体提及的截图或权威 blog 引用
- 中部：Free 版 vs 完整版功能对比（如月盘 vs 日盘 vs 全年盘）
- 底部：真实用户的 birth chart 使用体验评语

#### 8.2 主动暴露产品限制（建立信任的反直觉策略）

unifab 在工具页主动列出限制条件，而不是回避。

**设计逻辑：** 主动暴露限制反而建立信任，用户不会被"骗进来"，同时为门槛更低的替代版本创造独立转化路径。

凡是有免费/付费双版本的工具页，必须有版本对比表，不能只放付费版的功能。

#### 8.3 Hero 区信任横幅

工具页 Hero 区（H1 正下方）一行解决三个顾虑：

```
✅ Free to Use  ·  ✅ No Account Required  ·  ✅ Privacy Protected
```

- "Free to Use" → 消除付费恐惧
- "No Account Required" → 消除注册摩擦
- "Privacy Protected" → 消除数据顾虑（星盘类产品涉及用户生日，尤其重要）

#### 8.4 追加销售模块（Upsell）

单工具页底部放置相关工具推荐，引导用户发现工具矩阵：

```
→ 还想深入了解？试试 Transit Calculator / Solar Return Calculator
```

每个工具页底部推荐 2–3 个相关工具，形成工具矩阵的互相导流，同时提升内链密度。

#### 8.5 全页 CTA 布局（≥3 处）

工具落地页用户进来就是要用工具，CTA 密度应高于文章页：

| 位置 | CTA 类型 | 文案方向 |
|---|---|---|
| Hero 区（H1 下方）| 主要行动按钮 | "Generate My Birth Chart Free" |
| 功能展示中部 | 嵌入式 CTA | "Try It Now — No Signup" |
| 页面底部（用户评价后）| 再次触达 | "Ready to Start?" |

---

## 四、内链进阶

> 来源：《独立站谷歌SEO内链的进阶使用技巧》（2026-07-22 学习）
> 适用于所有 blog 和工具页的内链建设与审计。

---

### 补丁九：锚文本三维分布比例

**适用场景：** 所有 blog 和工具页内链建设时，评估锚文本分配是否合理。

原补丁三（工具页内链硬性规则）只规定了「用功能描述词，不用品牌词」。长期使用精确匹配锚文本会触发过度优化信号。

**正确的锚文本分布比例（单目标页面维度）：**

| 类型 | 比例 | AstrologyWiki 示例 |
|---|---|---|
| 精确关键词锚文本 | 20–30% | `birth chart calculator` |
| 部分匹配 / 相关词 | 40–50% | `free natal chart tool`、`generate your birth chart` |
| 自然语言描述 | 20–30% | `try our astrology tool`、`explore your chart here` |
| 无语义锚文本（"点击这里"等）| < 10% | 尽量不用 |

**整站上限规则：** 同一目标页面的精确匹配锚文本，在整站范围内不超过总页面数的 10%。AstrologyWiki 当前 311 篇，则任意一个目标页面的精确锚文本内链上限约 31 条。

---

### 补丁十：nofollow 内链的语义价值

**适用场景：** 设计导航栏、侧边栏、组件级链接时。

nofollow 内链对 SEO 有两种效果，必须分开处理：

| 效果 | nofollow 内链 | dofollow 内链 |
|---|---|---|
| 传递 PageRank（权重）| ❌ 不传递 | ✅ 传递 |
| 传递语义关联信号 | ✅ 仍然传递 | ✅ 传递 |

**实际操作含义：**

- 导航栏 / 侧边栏的链接：即使是 nofollow，Google 仍会通过这些链接判断页面间的主题关系，可用于强化主题关联，但不传权重。
- CTA 组件（React 客户端渲染）：JS 渲染链接对 PageRank 传递效率低，但仍传递语义信号。因此静态正文链接（主要传权重）和组件链接（主要传语义）承担不同功能，两者都需要，不可互相替代。

---

### 补丁十一：单页链出数量上限

**适用场景：** 发布新 blog 或改版页面时，评估出链总量。

原补丁三只规定了每篇 blog 正文**最少** 2 条工具链接，缺少**最多**数量的上限。

**上限建议：单页总出链（含正文文字链接 + 组件卡片 + 相关文章推荐）不超过 15 条。**

超出 15 条的影响：PageRank 在所有链出页面间均分，链接越多每条传递的权重越少。

**AstrologyWiki 当前风险预警：** 正文工具链接（2–3）+ CTA 模块（1–2）+ 相关文章组件 Req 4（3–4）+ 正文 wiki 出链（平均 3.7），合计约 10–13 条，目前处于合理边界。但 Req 4 上线后如果没有相应减少正文 wiki 出链，总量将超限。

---

### 补丁十二：Crawl Budget 进阶管理（三项补充）

**适用场景：** 技术 SEO 排期时。Smart Backfill 文档已覆盖「新内容发布后主动加内链加速收录」，以下三项是缺失的。

**策略 A：低价值页面双拳组合**

单靠给低价值页面加 noindex 不够；还必须同步减少站内指向这些页面的内链数量。内链越多 Googlebot 越频繁爬取，noindex 只是告诉 Google「不收录」，但爬取预算依然被消耗。

执行：每次批量发布后检查是否有新内链意外指向 draft/tag/author 等低价值路径。

**策略 C：301 重定向链条检查**

每次 URL 变更 / 页面合并后，必须同步更新站内所有指向旧 URL 的内链，改为直接指向最终目标 URL。

- 重定向跳转消耗额外爬取资源
- 权重在跳转过程中有一定损耗
- 建议每季度用 Screaming Frog 扫描「内链指向 3xx 重定向」的情况，纳入季度内链审计

**策略 D：核心页面点击深度 ≤ 3 层**

从首页出发，点击次数到达核心目标页面不超过 3 次。超过 3 层的页面被爬取和排名的概率大幅下降。

AstrologyWiki 需验证：工具页（如 `/en/birth-chart-calculator`）从首页能否在 2–3 次点击内到达？Pillar 文章（如 `saturn-return-guide`）是否有从首页或分类页的直接入口？

---

### 补丁十三：内链审计新增 noindex 检查项

**适用场景：** Req 5 健康度扫描的补充检查项。

现有 Req 5 扫描三项（错误内链目标 / 无工具链接数量 / 404 链接），遗漏了以下一项：

**新增检查项：内链指向 noindex 页面**

- 内链指向 noindex 页面 = 把 PageRank 导向不参与排名的页面，权重完全浪费
- AstrologyWiki 潜在风险路径：`/en/draft/`、`/en/author/`、`/en/tag/` 等如果有 noindex 标记但有内链指向
- 报警条件：任意 noindex 页面收到 ≥ 5 条内链时触发

---

### 补丁十四：跨集群互链克制规则

**适用场景：** 集群内容设计时，判断是否可以跨集群添加内链。

目前集群地图只定义了集群内部链接规则（Pillar ↔ Spoke 互链），缺少跨集群的约束。

**规则：**

- 跨集群内链需要有强语义关联才允许添加（标准：「用户看完这篇文章，真实会想看那篇吗？」）
- 单篇文章的出链中，跨集群出链比例 ≤ 20%（绝大多数内链留在本集群内）
- 若不确定是否跨集群，选择不加，宁可少

**原因：** 跨主题乱加互链会稀释每个集群的 Topical Authority 信号，让 Google 认为网站主题不够聚焦。

**举例（AstrologyWiki）：** Saturn Return 集群文章不应随意链接到 MBTI×星座集群文章，除非内容有直接语义交叉（如「Saturn Return 对 INFJ 的影响」这种强关联场景）。

---

## 五、技术与移动端

> 来源：《零基础写出谷歌高排名文章：SEO内容创作10大黄金法则》（2026-07-22 学习）

---

### 补丁十五：Core Web Vitals 精确指标

**适用场景：** 替换工具落地页 SOP 技术层 checklist 中「页面加载时间 ≤3s（移动端）」的通用标准。

Google 核心网页指标（Core Web Vitals）是当前实际使用的排名因素，≤3s 是过时的通用标准：

| 指标 | 全称 | 目标值 | 含义 |
|---|---|---|---|
| FCP | First Contentful Paint 首次内容渲染 | < 1.8s | 用户看到第一个内容元素的速度 |
| LCP | Largest Contentful Paint 最大内容渲染 | < 2.5s | 页面主体内容加载完成速度（核心指标）|
| CLS | Cumulative Layout Shift 累积布局偏移 | < 0.1 | 页面加载过程中元素位移程度 |
| INP | Interaction to Next Paint 交互响应 | < 200ms | 用户点击 / 输入后的响应速度 |

**验证工具：** PageSpeed Insights（https://pagespeed.web.dev），优先看移动端分数。

**上线门槛：** LCP 和 CLS 不达标（红色）不得上线；FCP 和 INP 作为观察项，达到绿色为优。

---

### 补丁十六：移动端触点与弹窗规范（补充补丁六）

**适用场景：** 所有页面移动端验证 + 补丁六（注册弹窗）触发时机规范。

**移动端基础规范：**

| 检查项 | 标准 |
|---|---|
| 可点击元素（按钮 / 链接）尺寸 | ≥ 48px × 48px |
| 正文字体大小 | ≥ 16px |
| 行高 | ≥ 1.5 倍 |
| 弹窗关闭按钮尺寸 | ≥ 48px（移动端可点击）|

**验证方法：** Chrome DevTools → 切换手机设备模拟器，逐一检查 CTA 按钮、弹窗关闭按钮是否达标。

**弹窗触发时机补充（对补丁六的精确化）：**

- 触发时机：用户滚动至文章 80–90% 位置（scroll-depth）
- 禁止在用户进入页面 **5 秒内** 触发弹窗——Google 明确惩罚「进入即弹」行为
- 同一用户 30 天内只触发一次（补丁六已有，此处确认）
- 弹窗形式：底部滑入或角落卡片，不遮挡全屏（补丁六已有，此处确认）

---

## 六、内容创作

> 来源：《零基础写出谷歌高排名文章：SEO内容创作10大黄金法则》（2026-07-22 学习）

---

### 补丁十七：数据化反差标题公式（第5种）

**适用场景：** 补充现有 Blog 更新规范中的 4 种标题公式，作为第 5 种。

现有 4 种公式覆盖了「具体承诺 / 年份 / 情绪钩子 / 数字」，补充以下「数据化反差」公式：

| 公式 | 模板 | 适用场景 |
|---|---|---|
| `数字 + 反差 + 正向暗示` | `90% of Astrology Fans Get Their Birth Chart Wrong — Here's Why` | 知识型内容，尤其是有常见误区的占星基础词 |

**写法要点：**

- 百分比用具体数字（90% / 80%），不用「大多数 / 很多人」
- 反差部分描述错误 / 误区，不用笼统批评
- 结尾给出正向暗示（Here's Why / What You're Missing / The Fix）
- 适合的选题类型：「birth chart reading mistakes」「zodiac compatibility misconceptions」「rising sign calculator wrong」等包含常见误区的词

---

## 变化对照总表

| 场景 | 补丁 | 变化项 | 原规范 | 本补丁 |
|---|---|---|---|---|
| **网站技术端** | 一 | H2 直接答案句 | 无规定 | H2 首句必须直接回答搜索意图 |
| | 一 | Organization schema | 基础配置 | 首页 SSR 输出，新增 sameAs 社媒绑定 |
| | 一 | Person schema | 无 | 四字段（knowsAbout / alumniOf / sameAs / worksFor），删除"not a real individual"声明 |
| | 一 | HowTo schema | 无 | Step 模块同步加入 HowTo 标记 |
| | 一 | 第三方引用 | 无 | Trustpilot + Futurepedia 优先入驻 |
| | 一 | 主动 GEO | 无 | 首页"Ask AI"按钮 → 预填品牌查询跳转 AI 工具 |
| **Blog 页面** | 二 | 文章结构 | 无标准公式 | 六段式结构 |
| | 二 | FAQ 数量 | 按需 4–6 个 | 8–10 个 |
| | 二 | CTA 频次 | 结尾 1 次 | 全文 3 次（桥接段 / 教程模块 / 结尾）|
| | 二 | T1 字数 | 未明确 | 4,000–6,000 字 |
| | 三 | 工具页内链 | Pillar/Spoke 规则 | 每篇 blog ≥2 条，必须指向工具页本身 |
| | 三 | 工具页反向内链 | 无 | 工具页底部推荐 4 篇相关 blog |
| | 四 | 竞品文章 | 无此类型 | 新增高优先级内容类型，统一 T1 |
| | 五 | 产品教程模块 | 无 | 每篇 T1 文章必须嵌入，含 Step 1/2/3 |
| | 六 | 注册弹窗 | 无 | Blog 末尾 scroll-depth 触发，收 email |
| **产品/工具落地页** | 七 | 工具页 H2 | 无规定 | 每个 H2 必须含核心关键词（与首页相反）|
| | 七 | 版本日志 | 无 | "What's New"板块持续追加 |
| | 七 | 竞品对比页 | 全放 blog | 高价值竞品词（≥500搜索量）建独立 .htm 根目录页 |
| | 八 | 信任信号 | 无规定 | 三层布局：顶部媒体背书 / 中部对比表 / 底部用户评价 |
| | 八 | 版本限制 | 回避限制 | 主动列出限制 + 双版本对比表 |
| | 八 | Hero 信任横幅 | 无 | 三要素：免费 / 无需注册 / 隐私保护 |
| | 八 | Upsell 模块 | 无 | 底部推荐 2–3 个相关工具 |
| | 八 | 落地页 CTA | 结尾 1 次 | ≥3 处：Hero / 中部 / 底部 |
| **内链进阶** | 九 | 锚文本分布比例 | 「用功能描述词」无比例约束 | 精确 20–30% / 部分匹配 40–50% / 自然描述 20–30%；整站精确锚文本 ≤ 总页面数 10% |
| | 十 | nofollow 内链语义价值 | 无区分 | nofollow 不传 PageRank 但仍传语义信号，导航/侧边栏与正文静态链接承担不同功能 |
| | 十一 | 单页链出数量上限 | 只有最少 2 条工具链接 | 总出链 ≤ 15 条（含组件 + 正文 + 相关文章） |
| | 十二 | Crawl Budget 进阶 | 只有 Smart Backfill（策略 B）| 新增策略 A（低价值页面双拳）/ 策略 C（301 重定向链检查）/ 策略 D（点击深度 ≤ 3 层）|
| | 十三 | 内链审计 noindex 检查 | Req 5 无此项 | 新增：任意 noindex 页面收到 ≥5 条内链时报警 |
| | 十四 | 跨集群互链约束 | 无规定 | 跨集群出链比例 ≤ 20%，须强语义关联才允许 |
| **技术与移动端** | 十五 | 页面速度指标 | ≤3s 通用标准 | LCP < 2.5s / CLS < 0.1 / FCP < 1.8s / INP < 200ms；LCP + CLS 不达标不得上线 |
| | 十六 | 移动端触点与弹窗 | 无触点规范；弹窗时机不明确 | 触点 ≥ 48px；弹窗禁止进入 5 秒内触发；需滚动至 80–90% 位置后触发 |
| **内容创作** | 十七 | 标题公式第 5 种 | 4 种公式 | 新增「数据化反差」：`90% of X Get Y Wrong — Here's Why` |

---

*文件：inbox-maboyang/03-content-briefs/2026-07-07-seo-sop-升级补丁-unifab学习.md*
*版本：v6 | 更新于 2026-07-22*
*参考（v5）：inbox-maboyang/03-content-briefs/2026-07-08-unifab-seo-分析报告.md*
*参考（v6）：《独立站谷歌SEO内链的进阶使用技巧》/ 《零基础写出谷歌高排名文章：SEO内容创作10大黄金法则》*
*合并目标：下次 SOP 大版本更新时并入 v2.4*
