---
title: AstrologyWiki 网站页面优化需求文档
date: 2026-07-09
status: draft
来源补丁: seo-sop-升级补丁-unifab学习.md (v5)
适用站点: astrologywiki.com
---

# AstrologyWiki 网站页面优化需求

> 每项需求标注来源补丁编号，执行时对照 `inbox/03-content-briefs/2026-07-07-seo-sop-升级补丁-unifab学习.md` 的对应章节查看详细规范。

---

## 一、网站技术端

> 一次性执行，补齐后长期有效。来源：**补丁一**

---

### T-01｜所有页面 H2 首句改为直接答案句
**来源：补丁一 · 动作一**

当前问题：大量 H2 开头使用铺垫式写法（"When it comes to..."、"There are many aspects..."），不符合 GEO 直接引用标准。

需要改动：
- 所有 blog 页面 H2 开头第一句必须直接回答搜索意图
- 示例修改方向：
  - ❌ "When it comes to Scorpio compatibility, there are many factors..."
  - ✅ "Scorpio is most compatible with Cancer, Pisces, and Virgo."

执行范围：全站 blog 页面，新文章写作时同步执行。

---

### T-02｜首页 SSR 添加 Organization schema（含 sameAs 社媒绑定）
**来源：补丁一 · 动作二**

当前状态：Organization schema 基础配置存在，但缺少 `sameAs` 社媒账号绑定。

需要补充的 `sameAs` 字段：
```json
"sameAs": [
  "https://www.youtube.com/@astrologywiki",
  "https://x.com/astrologywiki",
  "https://www.reddit.com/r/AstrologyWiki/"
]
```

要求：在首页 SSR 阶段输出，不能依赖客户端渲染。同时补充 `contactPoint`（support@astrologywiki.com）。

---

### T-03｜修复 `/en/wiki/author/marcus-orion` 作者 Person schema
**来源：补丁一 · 动作三**

当前存在两处问题需同时修复：

**问题一（删除）：**
```json
"disambiguatingDescription": "Editorial persona of AstrologyWiki, not a real individual."
```
此声明主动削弱 EEAT，必须删除。

**问题二（补充四个字段）：**
```json
"knowsAbout": ["Astrology", "Birth Chart Reading", "Zodiac Analysis"],
"alumniOf": [{"@type": "EducationalOrganization", "name": "[学校名]"}],
"sameAs": ["https://x.com/[作者Twitter账号]"],
"worksFor": {"@id": "https://astrologywiki.com/#organization"}
```

**附带需求：** 所有 blog 文章的 `author` 字段当前为 `"AstrologyWiki Editorial Team"`（Organization 类型），需改为指向 Marcus Orion 作者页的 Person 实体 `@id`。

---

### T-04｜为 blog 教程模块添加 HowTo schema
**来源：补丁一 · 动作四**

触发条件：实现补丁五（嵌入产品教程模块）后同步添加。

在 Step 1/2/3 教程模块的 HTML 中嵌入 HowTo schema，示例：

```json
{
  "@type": "HowTo",
  "name": "How to Read Your Birth Chart on AstrologyWiki",
  "step": [
    {"@type": "HowToStep", "position": 1, "name": "打开 Birth Chart Calculator", "text": "前往 AstrologyWiki Birth Chart Calculator 页面"},
    {"@type": "HowToStep", "position": 2, "name": "输入出生信息", "text": "填入出生日期、时间和地点"},
    {"@type": "HowToStep", "position": 3, "name": "查看解读结果", "text": "获取太阳、月亮、上升星座的完整解读"}
  ]
}
```

触发效果：SERP 步骤富文本预览，AI 引用操作类查询时优先选取。

---

### T-05｜入驻 Trustpilot 和 Futurepedia
**来源：补丁一 · 动作五**

AI 系统大量引用第三方评测平台内容。优先执行：

| 平台 | 类型 | 操作 |
|---|---|---|
| Trustpilot | 用户评分平台 | 创建页面，引导用户留评 |
| Futurepedia | AI 工具目录 | 提交 AstrologyWiki 工具收录 |

其他可选：There's An AI For That、Product Hunt。

---

### T-06｜首页 + 工具页添加"Ask AI"主动引导按钮
**来源：补丁一 · 动作六**

在首页和工具落地页添加跳转按钮，引导用户向 AI 工具询问品牌问题：

```
按钮文案：Ask AI about AstrologyWiki
跳转链接（Perplexity）：https://www.perplexity.ai/?q=What+is+AstrologyWiki+and+how+does+the+birth+chart+calculator+work
跳转链接（ChatGPT）：https://chatgpt.com/?q=What+is+AstrologyWiki+and+how+does+the+birth+chart+calculator+work
```

**执行红线：** 预填查询必须自然，不能堆砌关键词。

---

## 二、Blog 页面

> 新文章按规范创作，存量文章分批改造（T1 优先）。

---

### B-01｜所有 T1/T2 文章采用六段式结构
**来源：补丁二**

当前问题：文章结构无标准公式，各篇差异大。

新结构要求（按顺序）：

```
① 教育段 — 直接回答搜索意图，含结构化视觉元素（对比表/步骤编号）
② 决策框架 — "Which Should You Choose?" 场景分流，必须给出明确答案
③ 产品桥接 — H2 用中立语气，植入第一个 CTA（Free / Try Now）
④ 嵌入产品教程模块 — 见 B-04（补丁五）
⑤ FAQ — 8–10 个问题，带 FAQPage schema，每答案 ≤300 字符
⑥ 结论 + 第三个 CTA — 含明确推荐句 + 4 篇相关阅读推荐
```

**字数要求：**
- T1 文章：4,000–6,000 字
- T2 文章：2,000–3,000 字

---

### B-02｜FAQ 数量升级为 8–10 个，并添加 FAQPage schema
**来源：补丁二**

当前状态：FAQ 数量不固定，多数文章 4–6 个，未统一添加 FAQPage schema。

执行要求：
- T1/T2 文章 FAQ 数量：8–10 个
- 覆盖 Google PAA（People Also Ask）真实问题
- 每个答案 ≤300 字符
- 添加 FAQPage schema 标记

---

### B-03｜CTA 从"结尾 1 次"升级为"全文 3 次"
**来源：补丁二**

三个 CTA 位置：

| 位置 | CTA 类型 | 文案方向 |
|---|---|---|
| ③ 产品桥接段（正文中部）| 第一次 | "Try Free" / "Generate Free" |
| ④ 产品教程模块内 | 第二次 | "Start Now — No Signup Required" |
| ⑥ 结论段末尾 | 第三次 | "Ready to Read Your Chart?" |

---

### B-04｜每篇 T1 文章嵌入产品教程模块
**来源：补丁五**

在每篇 T1 文章的产品桥接段之后（④段位置）嵌入教程模块，固定结构：

```
[H3] How to [解决文章核心问题] With AstrologyWiki

[ 免费生成星盘 ]   No Signup Required

Step 1: 打开 AstrologyWiki Birth Chart Calculator
Step 2: 输入 [文章人物] 的出生日期（[具体日期]）
Step 3: 查看太阳、月亮和上升星座完整解读
```

**适用示例：**
- Harry Kane 文章 → Step 2 填"1993年7月28日"
- Messi 文章 → Step 2 填"1987年6月24日"
- Djokovic 文章 → Step 2 填"1987年5月22日"

一篇文章同时命中三个搜索意图："[名人] birth chart"、"[名人] zodiac sign"、"how to read birth chart"。

此模块添加 HowTo schema（见 T-04）。

---

### B-05｜每篇 blog 正文包含 ≥2 条工具页内链
**来源：补丁三**

当前问题：内链以 Pillar↔Spoke 文章互链为主，工具页内链不足。

规则：

| 规则项 | 要求 |
|---|---|
| 数量 | 每篇 blog ≥2 条工具页内链 |
| 锚文本 | 功能描述词（"birth chart calculator"）而非品牌词（"AstrologyWiki"）|
| 位置 | 正文中部一条 + 结尾一条，不能全堆在末尾 |
| 链接目标 | 工具页本身（`/en/birth-chart-calculator`），不能指向"如何使用"类文章 |

**可用工具页链接目标：**
- `/en/birth-chart-calculator` — Birth Chart Calculator
- `/en/rising-sign-calculator` — Rising Sign Calculator
- `/en/moon-sign-calculator` — Moon Sign Calculator
- `/en/chinese-zodiac-calculator` — Chinese Zodiac Calculator
- `/en/saturn-return-calculator` — Saturn Return Calculator

---

### B-06｜新增竞品对比文章（高优先级内容类型）
**来源：补丁四**

竞品文章统一定为 T1，适用词：

| 竞品对比词 | 月搜索量参考 | 优先级 |
|---|---|---|
| Co-Star vs AstrologyWiki | 待查 | 高 |
| Cafe Astrology alternative | 待查 | 高 |
| The Pattern app review | 待查 | 中 |
| Astro.com vs AstrologyWiki | 待查 | 中 |

文章结构须遵循补丁四的九段式结构（快速结论 → 竞品介绍 → 测试数据 → 定价对比 → 优缺点表 → 功能矩阵 → 教程模块 → 明确结论 → FAQ）。

**执行红线：** 竞品缺陷描述必须基于真实测试或公开用户评论，不能捏造。

---

### B-07｜Blog 末尾添加 scroll-depth 触发注册弹窗
**来源：补丁六**

触发条件：用户滚动至文章 80–90% 位置时触发。

弹窗内容：
```
标题：Get Your Weekly Cosmic Update
副标题：Personalized horoscopes delivered every Monday
输入框：Your email address
CTA：Send My Horoscope →
小字：No spam. Unsubscribe anytime.
```

**技术要求：**
- 仅限 blog 文章页，不在工具页和首页触发
- 同一用户 30 天内只触发一次（cookie 控制）
- 弹窗形式：底部滑入或角落卡片（不覆盖全屏）

---

## 三、工具落地页

> 工具页创建或改版时执行。

---

### W-01｜工具页所有 H2 必须含核心关键词
**来源：补丁七 · 7.1**

当前问题：Birth Chart Calculator 页面的 H2 为"Natal chart foundation"、"Planet and angle inventory"等，均不含目标关键词。

需修改为含关键词的 H2，示例：

```
H1: Birth Chart Calculator — Free Natal Chart in Seconds
H2: Birth Chart Calculator with 3 Interpretation Layers
H2: Generate Your Full Birth Chart Online — No Signup Required
H2: What's New in AstrologyWiki Birth Chart Calculator
H2: What AstrologyWiki Users Say About Birth Chart Reading
```

注意：此规则与首页相反（首页 H2 不放产品关键词），工具页需强化语义。

执行范围：Birth Chart Calculator、Rising Sign Calculator、Moon Sign Calculator 等所有工具落地页。

---

### W-02｜工具页底部添加"What's New"版本日志
**来源：补丁七 · 7.2**

在所有工具落地页末部添加版本更新记录板块，格式：

```
## What's New in AstrologyWiki Birth Chart Calculator

July 2026: Added Whole Sign House System option
May 2026:  Improved aspect orb accuracy for minor aspects
```

每次产品更新时在此追加一行，持续发送页面新鲜度信号给 Google。

---

### W-03｜高价值竞品词建独立根目录 .htm 页
**来源：补丁七 · 7.3**

对月搜索量 ≥500 的直接竞品对比词，建立根目录独立页：

```
✅ /co-star-vs-astrologywiki.htm       ← 根目录，权重最高
✅ /cafe-astrology-alternative.htm
❌ /resource/co-star-vs-astrologywiki  ← 二级路径，权重较低
```

信息型多产品对比文章仍放 `/resource/` blog 路径，转化导向的直接竞品页放根目录。

---

### W-04｜工具页信任信号三层布局
**来源：补丁八 · 8.1**

改造所有工具落地页的信任信号布局：

| 层级 | 位置 | 内容 |
|---|---|---|
| 顶部 | Hero 区下方 | 媒体/平台引用背书（被提及的博客/媒体 Logo 横幅）|
| 中部 | 功能展示区 | 免费版 vs 完整版功能对比表 |
| 底部 | 用户评价区 | 真实用户评语（含姓名、具体使用场景）|

---

### W-05｜工具页 Hero 区添加三要素信任横幅
**来源：补丁八 · 8.3**

在每个工具页 H1 正下方添加一行信任横幅：

```
✅ Free to Use  ·  ✅ No Account Required  ·  ✅ Privacy Protected
```

星盘类产品涉及用户生日，"Privacy Protected"尤其重要。

---

### W-06｜工具页主动列出版本限制 + 双版本对比表
**来源：补丁八 · 8.2**

凡是有免费/付费双版本的工具页，必须有版本对比表，不能只展示付费版功能。主动暴露限制反而建立信任，同时为门槛更低的入口创造独立转化路径。

---

### W-07｜工具页底部添加 Upsell 相关工具推荐
**来源：补丁八 · 8.4**

每个工具落地页底部推荐 2–3 个相关工具，引导用户发现工具矩阵：

示例（Birth Chart Calculator 底部）：
```
还想深入了解？
→ 试试 Transit Calculator — 查看当前行星对你星盘的影响
→ 试试 Saturn Return Calculator — 了解你的土星回归时间
```

---

### W-08｜工具落地页 CTA 不少于 3 处
**来源：补丁八 · 8.5**

| 位置 | CTA 类型 | 文案方向 |
|---|---|---|
| Hero 区（H1 下方）| 主要行动按钮 | "Generate My Birth Chart Free" |
| 功能展示中部 | 嵌入式 CTA | "Try It Now — No Signup" |
| 页面底部（用户评价后）| 再次触达 | "Ready to Start?" |

---

## 优先级汇总

| 优先级 | 编号 | 描述 | 原因 |
|---|---|---|---|
| 🔴 立即 | T-03 | 修复作者 Person schema | 主动声明"not a real individual"正在主动损害 EEAT |
| 🔴 立即 | T-02 | Organization schema 补 sameAs | GEO 基础信号，一次性修复 |
| 🔴 立即 | W-01 | 工具页 H2 含关键词 | 当前 H2 完全不含目标词，语义强化缺失 |
| 🟠 本周 | B-05 | 每篇 blog ≥2 条工具页内链 | 存量文章较多，批量修改需要排期 |
| 🟠 本周 | B-04 | T1 文章嵌入教程模块 | 转化核心机制，新文章立即执行 |
| 🟠 本周 | W-05 | Hero 信任横幅 | 实现成本低，影响所有工具页转化 |
| 🟡 本月 | T-05 | 入驻 Trustpilot + Futurepedia | 需要积累用户评价，越早开始越好 |
| 🟡 本月 | B-01 | 六段式结构（存量改造）| 优先改造 T1 文章 |
| 🟡 本月 | B-07 | blog 末尾注册弹窗 | 需要 email 系统配合 |
| 🟡 本月 | W-02 | What's New 版本日志 | 低成本，高持续收益 |
| 🟢 排期 | T-06 | Ask AI 主动引导按钮 | 主动 GEO，配合动作一~五完成后效果更好 |
| 🟢 排期 | B-06 | 竞品对比文章 | 需要真实测试数据，不能快速生成 |
| 🟢 排期 | W-03 | 竞品词独立 .htm 页 | 先确认竞品词搜索量后建页 |
| 🟢 排期 | W-04 | 信任信号三层布局 | 需要收集真实用户评价内容 |

---

*文件：inbox/00-inbox/2026-07-09-astrologywiki-优化需求文档.md*
*来源补丁：inbox/03-content-briefs/2026-07-07-seo-sop-升级补丁-unifab学习.md (v5)*
*生成日期：2026-07-09*
