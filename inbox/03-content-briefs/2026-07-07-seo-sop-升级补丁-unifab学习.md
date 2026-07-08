---
title: SEO SOP 升级补丁 — unifab.ai 竞品学习
date: 2026-07-07
status: v1
适用文件: seo-pipeline-sop-v2.3.md / blog优化更新规范-v1.0.md
来源: 对 unifab.ai 600+ 页面的结构分析（2026-07-07）
---

# SEO SOP 升级补丁 — unifab.ai 竞品学习

> 本文件不修改原 SOP，作为独立补丁使用。在原 SOP 执行过程中，遇到对应场景时参照本补丁执行。待下次 SOP 大版本更新时合并。

---

## 补丁一：文章结构公式升级

**适用场景：** v2.3 STEP 3（AI 组装）阶段，T1/T2 文章的结构搭建。

unifab.ai 所有高流量文章遵循以下六段结构，字数和 CTA 密度是关键：

```
H1: [核心关键词] — [差异化主张] [年份]

① 教育段（建立可信度，不提产品）
   → 首句必须直接回答搜索意图（Direct Answer Block）
   → 至少一个结构化视觉元素：对比表 / 规格表 / 步骤编号

② 决策框架（帮用户做选择）
   → "Which Should You Choose?" 类场景分流
   → 不同需求给不同答案，禁止"两者都好"的无效结论

③ 产品桥接（自然过渡，不硬广）
   → 用功能描述引出产品，而非直接推销
   → 此处植入第一个 CTA

④ 教程/演示段（用产品解决上文问题）
   → 步骤式操作，可配截图
   → 此处植入第二个 CTA

⑤ FAQ（8–10 个问题，带 FAQPage schema）
   → 覆盖 PAA（People Also Ask）真实问题
   → 每个答案 ≤ 300 字符

⑥ 结论 + 第三个 CTA
   → 明确推荐句式："Use [产品] if you need X"
```

**字数目标：**
- T1 文章：4,000–6,000 字
- T2 文章：2,000–3,000 字

**对现有 SOP 的变化：**
- FAQ 数量从"按需 4–6 个"升级为"T1/T2 文章 8–10 个"
- CTA 从"1 次结尾"升级为"全文 3 次（中部两次 + 结尾一次）"

---

## 补丁二：工具页内链硬性规则

**适用场景：** v2.3 STEP 5（部署与内链连线），所有 blog 类型页面。

在原有 Pillar↔Spoke 内链规则之外，新增：

> **每篇 blog 正文必须包含 ≥2 条指向工具页/产品页的内链。**

| 规则项 | 要求 |
|---|---|
| 数量 | 每篇 ≥2 条工具页内链 |
| 锚文本 | 功能描述词，不用品牌词（"birth chart calculator" 而非 "AstrologyWiki"） |
| 位置 | 分布在正文中部和结尾，不要全堆在末尾 |
| 方向 | blog → 工具页（单向），工具页不需要回链 blog |

**AstrologyWiki 可用内链目标：**
- Birth Chart Calculator
- Rising Sign Calculator
- Moon Sign Calculator
- Chinese Zodiac Calculator
- Saturn Return Calculator

**原因：** 趋势词带来的流量不会自动传递给工具页，内链是唯一路径。unifab.ai 每篇 blog 固定 2 条产品页内链，是其工具页持续获得权重积累的核心机制。

---

## 补丁三：竞品对比文章——新增高优先级内容类型

**适用场景：** v2.3 STEP 1（建卡）阶段，内容选题决策。

### 为什么要做竞品文章

搜索竞品名称的用户已进入购买决策阶段，转化率是普通信息词的 3–5 倍。unifab.ai 42% 的 blog 是竞品评测/对比文章，单篇流量上限高于普通教程文章。

### 适用词类型

| 站点 | 竞品词示例 |
|---|---|
| AstrologyWiki | "Co-Star vs AstrologyWiki"、"Cafe Astrology alternative"、"The Pattern app review" |
| brdeco 类 B2B | "Kingspan vs BRDECO"、"ROCKWOOL sandwich panel alternative"、"EPS vs PIR vs rockwool" |

### 竞品文章结构公式

```
H1: [竞品名] Review [年份]: Features, Pricing & Best Alternative

① 快速结论（让用户 30 秒内知道答案）
② 竞品介绍（中立语气，不攻击）
③ 真实测试 / 对比数据（具体数值，有截图更好）
④ 定价对比（竞品定位为"有限制的选项"）
⑤ 优缺点表格（缺点用具体场景描述，不用笼统批评）
⑥ 功能差异矩阵
   - 竞品有但我方没有的（诚实列出）
   - 双方都有，我方更好的
   - 我方独有的
⑦ 结论：明确写两个句子
   "Choose [竞品] if you need X"
   "Choose [我方] if you need Y"
⑧ FAQ（8–10 个，带 FAQPage schema）
```

**执行红线：** 所有竞品缺陷描述必须基于真实测试或公开用户评论，不能捏造。描述时用"部分用户反映 X"或引用 Reddit/App Store 真实评论。

### 在 v2.3 选题登记表中的定级

竞品对比文章统一定为 **T1**，因为：
- 目标用户处于高意图决策阶段，内容质量直接影响转化
- 需要真实测试数据，不能靠 AI 全自动生成
- 一旦排名建立，长期贡献高转化流量

---

## 补丁四：GEO 三动作（新建页面时执行一次）

**适用场景：** 新站点上线前 / 现有站点 GEO 配置检查。

好的 SEO 是 GEO（被 ChatGPT/Gemini/Perplexity 引用）的基础，以下三个动作是额外配置，非独立系统。

### 动作一：robots.txt 开放 AI 爬虫

检查 robots.txt，确认以下爬虫未被 Disallow：

```
GPTBot          → OpenAI / ChatGPT
Anthropic-ai    → Claude
Google-Extended → Gemini / AI Overview
PerplexityBot   → Perplexity
CCBot           → Common Crawl（AI 训练数据主要来源）
```

unifab.ai 配置：`User-agent: * Allow: /`，完全开放。AstrologyWiki 需确认同等配置。

### 动作二：内容写法——每个 H2 开头加直接答案句

```
❌ 弱 GEO 写法：
"When it comes to Scorpio compatibility, there are many aspects 
to consider, including..."

✅ 强 GEO 写法：
"Scorpio is most compatible with Cancer, Pisces, and Virgo. 
Water signs share Scorpio's emotional depth, while Virgo 
provides grounding stability."
```

AI 引用"可以直接粘贴进答案"的句子，不引用铺垫段落。每篇文章的每个 H2 章节开头都应有这样一句话。

### 动作三：Organization Schema（全站做一次）

在网站 `<head>` 加入 Organization schema，帮助 AI 系统建立网站实体认知：

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "AstrologyWiki",
  "url": "https://astrologywiki.com",
  "description": "Free astrology tools and birth chart readings",
  "sameAs": [
    "https://twitter.com/astrologywiki"
  ]
}
```

AstrologyWiki 当前已有 FAQPage schema，Organization schema 是补充项，只需实现一次。

---

## 对现有 SOP 文件的变化对照

| 变化项 | 原规范 | 本补丁 | 适用文件 |
|---|---|---|---|
| FAQ 数量（T1/T2） | 按需 4–6 个 | 8–10 个 | v2.3 + blog优化规范 |
| 工具页内链 | Pillar/Spoke 规则 | 每篇 blog ≥2 条工具页内链 | v2.3 |
| CTA 频次 | 结尾 1 次 | 全文 3 次（中部 ×2 + 结尾 ×1） | v2.3 |
| 竞品文章 | 无 | 新增高优先级内容类型，统一 T1 | v2.3 |
| GEO 配置 | 无 | robots.txt + 直接答案写法 + Organization schema | 新建/现有站 |
| T1 字数目标 | 未明确 | 4,000–6,000 字 | v2.3 |

---

*文件：inbox/03-content-briefs/2026-07-07-seo-sop-升级补丁-unifab学习.md*
*版本：v1 | 2026-07-07*
*来源站点：unifab.ai（2026-07-07 爬取分析）*
*合并目标：下次 SOP 大版本更新时并入 v2.4*
