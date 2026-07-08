---
title: SEO SOP 升级补丁 — unifab.ai 竞品学习
date: 2026-07-07
updated: 2026-07-08
status: v2
适用文件: seo-pipeline-sop-v2.3.md / blog优化更新规范-v1.0.md
来源: unifab.ai 全站多页面爬取分析
参考文档: inbox/03-content-briefs/2026-07-08-unifab-seo-分析报告.md
---

# SEO SOP 升级补丁 — unifab.ai 竞品学习

> 本文件不修改原 SOP，作为独立补丁使用。在原 SOP 执行过程中，遇到对应场景时参照本补丁执行。待下次 SOP 大版本更新时合并为 v2.4。

---

## 补丁一：首页 H 标签层级规则（新增）

**适用场景：** 首页改版 / 新站点首页搭建。

**核心原则：首页 H2 不放具体产品/工具关键词。**

原因：首页 H2 如果放具体功能词（如"Birth Chart Calculator"、"Rising Sign Calculator"），会与对应工具落地页产生关键词自噬（Keyword Cannibalization）——首页和工具页互相竞争同一关键词，两者都排不好。

**正确做法：**

| 层级 | 内容类型 | 示例 |
|---|---|---|
| H1 | 品牌词 + 品类词 | "AstrologyWiki — Free Astrology Tools & Birth Chart Readings" |
| H2 | 板块标签（情感语 / 中性描述）| "Explore Your Cosmic Blueprint" / "Trusted by Astrology Lovers" |
| H3 | 具体功能/产品名称 | "Birth Chart Calculator" / "Rising Sign Calculator" |

首页职责 = 排品牌词和品类词。每个工具页负责自己的具体关键词，互不干扰。

---

## 补丁二：Blog 文章结构公式升级

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

④ 嵌入产品教程模块 ← 核心转化机制，v1 未包含
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

## 补丁三：工具页内链硬性规则

**适用场景：** v2.3 STEP 5（部署与内链连线），所有 blog 类型页面。

在原有 Pillar↔Spoke 内链规则之外，新增：

> **每篇 blog 正文必须包含 ≥2 条指向工具页/产品页的内链。**

| 规则项 | 要求 |
|---|---|
| 数量 | 每篇 ≥2 条工具页内链 |
| 锚文本 | 功能描述词，不用品牌词（"birth chart calculator" 而非 "AstrologyWiki"）|
| 位置 | 正文中部一条 + 结尾一条，不要全堆在末尾 |
| 方向 | blog → 工具页（单向）；工具页也反向推荐相关 blog（底部 4 条）|

**AstrologyWiki 可用内链目标：**
- Birth Chart Calculator
- Rising Sign Calculator
- Moon Sign Calculator
- Chinese Zodiac Calculator
- Saturn Return Calculator

**工具页反向内链（补充）：** 工具落地页底部同样应推荐 4 条相关 blog 文章（操作教程类锚文本），形成双向流量循环。

---

## 补丁四：竞品对比文章——新增高优先级内容类型

**适用场景：** v2.3 STEP 1（建卡）阶段，内容选题决策。

### 为什么要做竞品文章

搜索竞品名称的用户已进入购买决策阶段，转化率是普通信息词的 3–5 倍。unifab.ai 42% 的 blog 是竞品评测/对比文章，单篇流量上限高于普通教程文章。

### 适用词类型

| 站点 | 竞品词示例 |
|---|---|
| AstrologyWiki | "Co-Star vs AstrologyWiki"、"Cafe Astrology alternative"、"The Pattern app review" |
| brdeco 类 B2B | "Kingspan vs BRDECO"、"ROCKWOOL sandwich panel alternative"、"EPS vs PIR vs rockwool" |

### 竞品文章完整结构

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

## 补丁五：嵌入产品教程模块（新增）

**适用场景：** 所有 T1 文章的④段（产品桥接后），以及竞品文章的⑦段。

这是 unifab.ai blog 最核心的转化设计，将信息型流量直接转化为产品体验。

### 模块结构

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

### AstrologyWiki 适配示例

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

### 设计逻辑

- 用户因搜索名人星盘词进入（冷流量，不知道 AstrologyWiki）
- 教程模块将"我在看内容"转变为"我在操作工具"
- Step 格式可触发 HowTo schema，在 SERP 显示步骤预览
- H3 文案本身（"How to Read Birth Chart"）覆盖 how-to 类长尾词

**一篇文章同时命中三个搜索意图：**
1. "[名人] birth chart"（星盘查询）
2. "[名人] zodiac sign"（星座查询）
3. "How to read birth chart"（操作教程）

---

## 补丁六：Blog 末尾注册弹窗（新增）

**适用场景：** 所有 blog 页面的转化兜底机制。

### 触发条件

| 触发方式 | 时机 | 优先级 |
|---|---|---|
| Scroll-depth | 用户滚动至文章 80–90% 位置 | 首选 |
| Exit-intent | 鼠标移出页面顶部边缘 | 备选 |

### 弹窗内容

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

### AstrologyWiki 适配

弹窗内容建议：
```
[弹窗标题] Get Your Weekly Cosmic Update
[副标题]   Personalized horoscopes delivered every Monday
[输入框]   Your email address
[CTA]      Send My Horoscope →
[小字]     No spam. Unsubscribe anytime.
```

用每周星盘运势作为 email 钩子，对占星用户吸引力高，后续序列可推付费星盘报告或工具升级。

### 实现要求

- **不在工具页和首页触发**，仅限 blog 文章页
- 同一用户 30 天内只触发一次（cookie 控制）
- 弹窗不覆盖全屏，使用底部滑入或角落卡片形式（避免 Google 侵入式弹窗惩罚）

---

## 补丁七：GEO 完整配置清单（新站点上线前执行一次）

**适用场景：** 新站点上线前 / 现有站点 GEO 配置检查。
**数据来源：** unifab.ai curl 实测（2026-07-08 验证）

---

### 动作一：robots.txt 开放 AI 爬虫

```
GPTBot          → OpenAI / ChatGPT
Anthropic-ai    → Claude
Google-Extended → Gemini / AI Overview
PerplexityBot   → Perplexity
CCBot           → Common Crawl（AI 训练数据主要来源）
```

最简配置：`User-agent: * Allow: /`（unifab.ai 做法，完全开放）

---

### 动作二：H2 开头加直接答案句

```
❌ 弱 GEO 写法：
"When it comes to Scorpio compatibility, there are many aspects
to consider, including..."

✅ 强 GEO 写法：
"Scorpio is most compatible with Cancer, Pisces, and Virgo.
Water signs share Scorpio's emotional depth, while Virgo
provides grounding stability."
```

---

### 动作三：Organization schema + sameAs（全站一次，写入 SSR HTML）

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

---

### 动作四：Person（作者实体）schema — EEAT 信号

unifab 完整 Person schema 结构（已验证，需完整复制四个关键字段）：

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

每个作者必须有独立页面 `/author/[name].htm`，ProfilePage schema 包裹 Person schema。

---

### 动作五：HowTo schema（嵌入教程模块时添加）

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

---

### 动作六：第三方引用建设（持续执行）

AI 系统的回答不只依赖自有网站内容，也大量引用第三方评测和目录。unifab 已建立的引用矩阵（已验证）：

| 平台类型 | unifab 已入驻 | AstrologyWiki 对应目标 |
|---|---|---|
| 用户评分平台 | Trustpilot | Trustpilot |
| 专业评测站 | FilterGrade、SoftwareTestingHelp | 占星/工具类评测博客 |
| AI 工具目录 | Futurepedia | Futurepedia、There's An AI For That |
| Reddit 版块 | r/UniFabCreators（自建）| r/astrology 话题参与 |
| YouTube | @UniFabofficial | @astrologywiki |

**执行原则：** 不需要全部覆盖，优先进入 AI 系统高频引用的平台。Trustpilot 和 Futurepedia 是最高优先级。

---

### 动作七：Ask AI 主动引导模块（首页 + 工具页）

unifab 首页设有"Ask AI about UniFab"按钮，点击后直接跳转至 AI 工具并预填品牌查询。

```
被动 GEO（动作一~六）：优化内容 → 等 AI 爬虫发现 → 期望被引用
主动 GEO（动作七）  ：用户点击 → 跳转 AI → 产生品牌对话 → 强化 AI 关联
```

**实现方式：**

```
Perplexity：https://www.perplexity.ai/?q=[预填查询，URL编码]
ChatGPT：  https://chatgpt.com/?q=[预填查询，URL编码]
```

**AstrologyWiki 示例：**
```
按钮文案：Ask AI about AstrologyWiki
跳转链接：https://www.perplexity.ai/?q=What+is+AstrologyWiki+and+how+does+the+birth+chart+calculator+work
```

**执行红线：** 预填查询必须自然，不能堆砌关键词，否则 AI 给出差评式回答反而损害品牌。

---

## 补丁八：工具页专项规则（新增）

**适用场景：** 工具落地页 / 产品页的创建和维护。

### 8.1 工具页 H2 策略（与首页相反）

| 页面类型 | H2 策略 |
|---|---|
| 首页 | H2 不放产品关键词（防自噬）|
| 工具页 | H2 每个都含核心关键词（强化语义）|

**AstrologyWiki 示例（Birth Chart Calculator 工具页）：**
```
H1: Birth Chart Calculator — Free Natal Chart in Seconds
H2: Birth Chart Calculator with 3 Interpretation Layers
H2: Generate Your Full Birth Chart Online — No Signup Required
H2: What's New in AstrologyWiki Birth Chart Calculator
H2: What AstrologyWiki Users Say About Birth Chart Reading
```

### 8.2 SoftwareApplication Schema（工具页必加）

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "AstrologyWiki Birth Chart Calculator",
  "applicationCategory": "LifestyleApplication",
  "operatingSystem": "Web",
  "url": "https://astrologywiki.com/birth-chart-calculator",
  "publisher": {"@id": "https://astrologywiki.com/#organization"}
}
```

AI 被问"最好的星盘计算器是什么"时，有 SoftwareApplication schema 的工具才会被识别为产品实体候选。

### 8.3 工具页"What's New"版本日志板块

工具页末部添加版本更新记录，每次产品更新追加一行，持续发送页面新鲜度信号：

```
## What's New in AstrologyWiki Birth Chart Calculator

July 2026: Added Whole Sign House System option
May 2026:  Improved aspect orb accuracy for minor aspects
```

### 8.4 高价值竞品词建独立 .htm 页，不放 blog

对月搜索量 ≥500 的直接竞品对比词，建立根目录 `.htm` 格式对比页：

```
✅ /co-star-vs-astrologywiki.htm   ← 根目录，权重最高，转化导向
❌ /resource/co-star-vs-astrologywiki  ← 二级路径，权重较低
```

信息型竞品文章（比较多个产品）仍放 `/resource/` blog。

---

## 变化对照总表

| 补丁 | 变化项 | 原规范 | 本补丁 | 适用场景 |
|---|---|---|---|---|
| 一 | 首页 H2 规则 | 无明确规定 | H2 不放具体产品关键词 | 首页改版 |
| 二 | 文章结构 | 无标准公式 | 六段式结构 | T1/T2 创作 |
| 二 | FAQ 数量 | 按需 4–6 个 | 8–10 个 | T1/T2 创作 |
| 二 | CTA 频次 | 结尾 1 次 | 全文 3 次 | T1/T2 创作 |
| 二 | T1 字数 | 未明确 | 4,000–6,000 字 | T1 创作 |
| 三 | 工具页内链 | Pillar/Spoke 规则 | 每篇 blog ≥2 条工具页内链 | 所有 blog |
| 三 | 工具页反向内链 | 无 | 工具页底部推荐 4 篇相关 blog | 工具落地页 |
| 四 | 竞品文章 | 无此类型 | 新增高优先级内容类型，统一 T1 | 选题决策 |
| 五 | 产品教程模块 | 无 | 每篇 T1 文章必须嵌入 | T1 创作 |
| 六 | 注册弹窗 | 无 | Blog 末尾 scroll-depth 触发 | Blog 页面 |
| 七 | GEO 被动配置 | robots.txt + Organization schema | 新增 Person schema + HowTo schema + 第三方引用矩阵 | 站点配置 |
| 七 | GEO 主动引导 | 无 | 首页"Ask AI"按钮 → 预填品牌查询跳转 AI 工具 | 首页 / 工具页 |
| 八 | 工具页 H2 | 无规定 | 工具页 H2 必须含核心关键词（与首页相反）| 工具落地页 |
| 八 | 工具页 schema | 无 | SoftwareApplication schema 必加 | 工具落地页 |
| 八 | 工具页更新 | 无 | "What's New"版本日志持续追加 | 工具落地页 |
| 八 | 竞品对比页 | 全放 blog | 高价值竞品词建独立 .htm 根目录页 | 竞品选题 |

---

*文件：inbox/03-content-briefs/2026-07-07-seo-sop-升级补丁-unifab学习.md*
*版本：v2 | 更新于 2026-07-08*
*参考：inbox/03-content-briefs/2026-07-08-unifab-seo-分析报告.md*
*合并目标：下次 SOP 大版本更新时并入 v2.4*
