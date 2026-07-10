---
title: AstrologyWiki CTA 架构优化需求
date: 2026-07-09
version: v1.0
status: 待开发排期
owner: Ma Boyang
优先级: P0（影响实验二数据有效性）
依据文件: inbox/00-inbox/2026-07-09-工具站内容转化设计洞察.md
---

# AstrologyWiki CTA 架构优化需求 | v1.0

---

## 一、背景与目标

**现状问题：**
- AstrologyWiki 工具页平均互动时长仅 10-16s，Blog 页 55-180s，两者之间没有有效的转化路径
- W28 实验二（趋势 blog → 工具转化漏斗）因 Haaland/Mbappé/Hakimi 内链指向错误页面，实验数据目前无效
- 当前全站没有持续可见的工具入口，用户需要主动导航才能找到 `/en/birth-chart-calculator`

**优化目标：**
- 在用户阅读任意页面时，始终存在至少 1 个指向 birth chart calculator 的可见入口
- Blog 文章页的工具转化点击率从 0 提升到可测量水平（≥1% 作为 W28 实验二基础目标）
- 工具页用户停留时长从 10-16s 提升至 ≥45s

**与 UniFab 架构的核心差异：**
AstrologyWiki 没有付费产品，转化目标不是"购买"而是"使用工具"。因此：
- 不使用促销折扣作为驱动力
- 使用**个性化（Personalization）**和**好奇心（Curiosity）**替代"折扣"的紧迫感
- 核心文案逻辑：从"你正在看别人的星盘" → "看看你自己的"

---

## 二、CTA 模块需求（共 6 个模块）

> 对应头部工具站 7 层架构，根据 AstrologyWiki 实际情况做了合并和适配。

---

### 模块 A：Nav 固定 CTA 按钮

**对应原架构：层② — 顶部 Nav 始终可见按钮**

**需求描述：**
在全站顶部导航栏右侧（Login 按钮左侧）增加一个固定 CTA 按钮，任何页面、任何滚动位置始终可见。

**位置：** 全站所有页面，顶部导航栏右侧

**按钮文案：** `Get Free Birth Chart`

**按钮样式：**
- 背景色：品牌主色（实心填充，与导航背景形成对比）
- 文字：白色
- 边框：无
- 状态：hover 时背景色加深 10%

**链接目标：** `/en/birth-chart-calculator`

**移动端：** 折叠入汉堡菜单内部，作为菜单第一项显示，文案改为 `✦ Free Birth Chart Calculator`

**优先级：** P0

---

### 模块 B：Scroll 触发 Sticky 工具入口

**对应原架构：层③ — 滚动触发的 Sticky Nav**

**需求描述：**
用户在 Blog 文章页向下滚动超过 400px 后，页面顶部出现一条 Sticky 工具引导条，固定在顶部，直到用户返回页面顶部时消失。

**触发条件：**
- 页面类型：仅 Blog 文章页（`/en/wiki/*`）
- 触发时机：向下滚动距离 ≥ 400px
- 消失时机：回滚至页面顶部 ≤ 100px

**Sticky 条内容：**

场景一（有明确 celebrity 名字的页面，如 `/en/wiki/erling-haaland-birth-chart`）：
```
[星盘图标] Curious about YOUR birth chart?  [Get Mine Free →]
```

场景二（其他 Blog 页面）：
```
[星盘图标] Discover your cosmic blueprint — free & instant  [Calculate Now →]
```

**实现方式：**
- 从 URL slug 中提取 celebrity 名（如 `erling-haaland`）→ 判断为 celebrity 页面 → 使用场景一文案
- 非 celebrity 页面（无法匹配人名）→ 使用场景二文案
- 如技术成本高，初版可统一使用场景二文案，后续迭代

**样式：**
- 高度：48px
- 背景色：品牌主色（深色）
- 文字：白色
- CTA 按钮：反白实心按钮
- 动画：从顶部滑入（200ms ease-in），不遮挡已有的固定导航栏（在其下方）

**链接目标：** `/en/birth-chart-calculator`

**移动端：** 同样触发，Sticky 条宽度全屏，CTA 按钮占右侧 1/3

**优先级：** P0

---

### 模块 C：Blog 文章顶部工具推荐卡

**对应原架构：层⑤ — 文章正文前的产品推荐卡**

**需求描述：**
在每篇 Blog 文章的 H1 标题之后、正文第一段之前，插入一张工具推荐卡片。这是用户进入文章后看到的第一个转化入口。

**位置：** Blog 文章页（`/en/wiki/*`），H1 之后，正文之前

**卡片内容（celebrity 星盘文章）：**

```
┌─────────────────────────────────────────────────────┐
│  ✦  You're reading [Name]'s birth chart.            │
│     What does YOUR chart reveal?                    │
│                                                     │
│  [ Get Your Free Birth Chart → ]  [ How to Read It ]│
│  Free · No sign-up · Instant results               │
└─────────────────────────────────────────────────────┘
```

**卡片内容（非 celebrity 文章）：**

```
┌─────────────────────────────────────────────────────┐
│  ✦  Discover your complete natal chart — free       │
│     Planet positions · House placements · Readings  │
│                                                     │
│  [ Calculate My Birth Chart → ]                     │
│  Free · No sign-up · Instant results               │
└─────────────────────────────────────────────────────┘
```

**样式：**
- 背景：浅色（品牌色 10% opacity 或 #F8F4FF 等浅紫色）
- 边框：品牌色 1px
- 圆角：8px
- 内边距：16px 20px
- 主 CTA 按钮：品牌主色实心
- 副 CTA 按钮：透明背景 + 品牌色文字 + 品牌色边框

**主 CTA 链接目标：** `/en/birth-chart-calculator`
**副 CTA 链接目标：** `/en/wiki/how-to-read-birth-chart`（注意：这里副 CTA 指向教程是正确的，主 CTA 才必须指向工具页）

**[Name] 动态插入逻辑：**
- 优先取文章 frontmatter 中的 `celebrity_name` 字段（如有）
- 其次从 slug 解析（`erling-haaland-birth-chart` → `Erling Haaland`）
- 若两者均无法获取，退回通用文案

**移动端：** 副 CTA 按钮在移动端隐藏，只显示主 CTA

**优先级：** P0（直接影响实验二数据）

---

### 模块 D：文章中段内联 CTA 区块

**对应原架构：层⑥ — 文章 40-50% 位置的内联 CTA**

**需求描述：**
在 Blog 文章正文约 40-50% 处自动插入一个独立的 CTA 区块（视觉上与正文区分）。用户读到文章中段、对内容产生兴趣时，是点击转化的最佳时机。

**位置：** Blog 文章页（`/en/wiki/*`），文章正文约 40-50% 处
- 实现方式 A（精确）：计算正文总字数，在 50% 字数处插入
- 实现方式 B（简便）：在文章第 4 个 `<h2>` 或 `<h3>` 标签之后插入

**区块内容：**

```
┌─────────────────────────────────────────────────────┐
│  Want to see how YOUR planets compare?              │
│  Generate your free birth chart — takes 30 seconds  │
│                                                     │
│  [ ✦ Get My Free Birth Chart → ]                    │
│  Free · No sign-up required · Instant results      │
└─────────────────────────────────────────────────────┘
```

**样式：**
- 与正文之间有明显分隔（上下各 24px margin）
- 背景：与模块 C 保持统一的浅品牌色
- CTA 按钮：品牌主色实心，宽度 ≥200px，padding 12px 24px

**链接目标：** `/en/birth-chart-calculator`

**移动端：** 按钮宽度 100%（全宽）

**优先级：** P1（P0 模块上线后排）

---

### 模块 E：工具页结果区追加转化

**对应原架构：层⑦ — 工具页底部的追加转化（适配免费工具场景）**

**需求描述：**
用户在 `/en/birth-chart-calculator` 生成星盘后，在结果区域下方追加 3 个延伸转化入口，把单次工具使用转化为更多行为。

**触发条件：** 用户完成星盘生成，结果已渲染完毕

**3 个延伸入口：**

**入口 1：分享**
```
[ ↗ Share My Birth Chart ]
```
- 功能：生成可分享链接（或截图功能）
- 目的：用户分享 = 自然传播 + 回访

**入口 2：横向工具转化**
```
[ ♡ Check Your Compatibility ]
```
- 链接目标：`/en/compatibility-calculator`（若已上线）
- 目的：工具页横向导流

**入口 3：Newsletter / 返访钩**
```
[ ✉ Get Weekly Insights for Your Chart ]
Email: ____________  [ Subscribe Free ]
```
- 功能：邮件订阅，基于用户星盘推送每周内容
- 目的：把一次性用户转化为回访用户
- 注意：此功能需后端支持，如暂不具备，可先用"Save My Chart Results"（本地存储或截图引导）替代

**优先级：** P2（结构性功能，与工具页改版一起做）

---

### 模块 F：全站底部 Sticky 常态入口条

**对应原架构：层① — 全站底部固定横条**

**需求描述：**
在页面底部添加一条始终可见的细长横条，作为全站兜底的工具入口。

**位置：** 全站所有页面，固定在浏览器视口底部（position: fixed, bottom: 0）

**内容：**
```
✦ Free Birth Chart Calculator — Your planets, your story  [ Try Free → ]
```

**样式：**
- 高度：44px
- 背景：深色（与页面形成对比，不与 Footer 混淆）
- 文字：白色，字号 14px
- CTA 按钮：品牌主色 pill 按钮
- 关闭按钮：右侧 × 图标，点击后本次会话内隐藏（localStorage 记录，不每次都弹）

**链接目标：** `/en/birth-chart-calculator`

**移动端：** 仅显示 CTA 按钮和极短文案：`✦ Free Birth Chart [ Try → ]`

**注意：** 底部横条**仅在首页和工具落地页显示，Blog 文章页（`/en/wiki/*`）不显示**。Blog 文章页由模块 B（Scroll Sticky Nav）承担持续引导职责，两者不共存，避免视觉干扰叠加。

**优先级：** P2

---

### 模块 G：右侧悬浮工具入口卡

**对应原架构：层④ — Blog 和工具页固定右侧悬浮促销卡（适配免费工具场景）**

**需求描述：**
在 Blog 文章页桌面端右侧固定一张工具推荐小卡片，随页面滚动保持可见，作为右侧持久性转化入口。

**位置：** Blog 文章页（`/en/wiki/*`），桌面端右侧固定浮层（`position: sticky`）

**卡片内容：**

```
┌─────────────────────┐
│  ✦ Try It Yourself  │
│                     │
│  Birth Chart        │
│  Calculator         │
│                     │
│  ──────────────── │
│                     │
│ [ Get Mine Free → ] │
│  Free · No sign-up  │
└─────────────────────┘
```

**样式：**
- 宽度：200-240px
- 背景：品牌色浅底（与模块 C/D 保持一致）
- 边框：品牌色 1px，圆角 8px
- CTA 按钮：品牌主色实心，全宽
- 位置：文章正文右侧，顶部距离 Nav 底部 24px，`position: sticky; top: 80px`

**链接目标：** `/en/birth-chart-calculator`

**移动端：** 不显示（移动端由模块 B/C/D 覆盖，右侧无空间）

**与其他模块的层叠关系：** 模块 G（工具卡）在上，模块 H（TOC）在下，两者共享右侧栏空间

**优先级：** P1

---

### 模块 H：右侧 Sticky TOC 目录

**对应原架构：SEO 标配 — Sticky 侧边栏可锚点跳转目录**

**需求描述：**
在 Blog 文章页桌面端右侧，模块 G 工具卡下方，提供文章目录（Table of Contents），自动提取文章所有 H2/H3 标题，支持锚点跳转。

**位置：** Blog 文章页（`/en/wiki/*`），桌面端右侧，模块 G 卡片下方

**内容结构：**

```
Table of Contents
──────────────
▸ What Is [Name]'s Birth Chart?
▸ Sun Sign & Core Identity
▸ Moon Sign & Emotions
▸ Rising Sign
▸ Key Planetary Aspects
▸ How to Read Your Own Chart
▸ FAQ
```

**技术要求：**
- 自动从文章 H2/H3 标签生成，不需要手动维护
- 当前阅读位置对应的目录项高亮（active state）
- 点击目录项平滑滚动至对应锚点
- 目录项超过 8 个时，超出部分折叠，显示"Show more"

**样式：**
- 背景：白色或极浅灰，与正文区区分
- 标题"Table of Contents"：14px，半透明灰
- 目录项：13px，normal weight，active 时品牌色加粗
- 最大高度：60vh，超出可内部滚动

**移动端：** 不显示（移动端可考虑在文章顶部折叠式 TOC，作为后续迭代）

**优先级：** P1（与模块 G 同期开发，共享右侧栏布局）

---

### 模块 I：右侧 New Resource 相关内容推荐

**对应原架构：相关文章侧边栏 — 降低跳出率 + 站内导航**

**需求描述：**
在 Blog 文章页桌面端右侧底部，TOC 目录下方，展示 3-4 篇相关文章推荐，引导用户在站内持续阅读。

**位置：** Blog 文章页（`/en/wiki/*`），桌面端右侧，模块 H TOC 下方（非 sticky，随页面流动）

**推荐内容优先级（按顺序）：**

1. **同类明星文章**：正在阅读 Haaland → 推荐 Messi、Ronaldo、Harry Kane
2. **相关工具入口**：正在阅读 birth chart 文章 → 推荐 Rising Sign Calculator、Moon Sign Calculator
3. **相关主题文章**：正在阅读 Cancer Sun 相关 → 推荐 Cancer compatibility、Cancer moon 文章

**卡片内容（每篇）：**

```
┌──────────────────────┐
│ [封面图 60×60]        │
│ Article Title Here   │
│ ── 3 min read ──     │
└──────────────────────┘
```

**技术要求：**
- 初版可硬编码每篇文章的推荐列表（frontmatter 中配置 `related_articles` 字段）
- 后续可基于标签/分类自动匹配

**样式：**
- 板块标题："You Might Also Like" 或 "More Birth Charts"
- 每篇：小封面图 + 标题 + 阅读时长估算
- 显示 **5 篇**，与 UniFab New Resource 侧边栏保持一致

**移动端：** 不显示（移动端相关文章由文章底部卡片区覆盖）

**优先级：** P2

---

### 模块 J：右下角三联浮动按钮组

**对应原架构：UniFab 全站右下角固定三个方块按钮（优惠弹窗 + AI客服 + 返回顶部）**

**需求描述：**
在全站所有页面右下角固定一组竖排三个方块图标按钮，`position: fixed; bottom: 24px; right: 24px`，叠放排列。

**三个按钮（从下到上）：**

---

**按钮 J-1：返回顶部（最下方）**

- 图标：↑ 箭头
- 行为：点击后平滑滚动至页面顶部
- 显示条件：用户向下滚动超过 300px 后出现，回到顶部后隐藏
- 样式：深色背景，白色图标，圆角方块 40×40px

---

**按钮 J-2：AI 占星助手（中间）**

UniFab 放的是 AI 客服，AstrologyWiki 适配为占星问答入口。

- 图标：✦ 星星 或 💬 对话气泡
- 行为：点击后展开一个小悬浮面板，内容：

```
┌────────────────────────────┐
│  ✦ Ask About Astrology     │
│  ─────────────────────     │
│  • What's my rising sign?  │
│  • How to read a chart?    │
│  • What does Venus mean?   │
│                            │
│  [ Ask AI → ]              │
│  Powered by AstrologyWiki  │
└────────────────────────────┘
```

- "Ask AI →" 跳转至站内 FAQ 页或工具页（初版可直接链接 `/en/birth-chart-calculator`）
- 若后续上线 AI 问答功能，此入口直接对接
- 样式：品牌主色背景，白色图标

---

**按钮 J-3：工具快速入口 / 优惠弹窗（最上方）**

UniFab 放的是折扣弹窗，AstrologyWiki 适配为工具快速访问弹窗。

- 图标：⊕ 或星盘图标
- 行为：点击后展开小弹窗，内容：

```
┌────────────────────────────┐
│  Free Astrology Tools      │
│  ─────────────────────     │
│  ☆ Birth Chart Calculator  │
│  ☽ Moon Sign Calculator    │
│  ↑ Rising Sign Calculator  │
│  ♄ Saturn Return Calculator│
└────────────────────────────┘
```

- 每项点击直接跳转对应工具页
- 样式：浅品牌色背景，白色图标

---

**整体样式规范：**
- 三个按钮统一尺寸：40×40px，圆角 8px
- 间距：按钮之间 8px 间隔
- 弹出面板：在按钮左侧展开，宽度约 220px，不超出视口
- 移动端：仅保留 J-1（返回顶部），J-2 和 J-3 在移动端隐藏（避免遮挡内容）

**优先级：** J-1 P1，J-2 P2，J-3 P1

---

### 模块 K：左下角"Ask AI about AstrologyWiki"快捷面板

**对应原架构：UniFab 全站左下角固定 Ask AI 入口（GEO 主动引导）**

**需求描述：**
在全站所有页面左下角固定一个"Ask AI"图标按钮，点击后展开面板，提供预填查询链接，引导用户向主流 AI 工具询问关于 AstrologyWiki 的问题。核心目标是主动占领 AI 引用位（GEO），让 ChatGPT / Perplexity 等 AI 在被用户问到占星工具时优先提及 AstrologyWiki。

**位置：** 全站所有页面，`position: fixed; bottom: 24px; left: 24px`

**按钮样式：**
- 图标：✦ 星星 + "Ask AI" 文字标签（可折叠为仅图标）
- 尺寸：40×40px 圆角方块，品牌主色背景，白色图标
- 默认状态：显示图标 + "Ask AI" 文字
- 点击后：向右展开面板

**展开面板内容：**

```
┌──────────────────────────────────────┐
│  Ask AI about AstrologyWiki          │
│  ────────────────────────────────    │
│  [ChatGPT]   [Perplexity]            │
│  [Claude]    [Gemini]    [Grok]      │
│                                      │
│  "What is AstrologyWiki and how      │
│   does the birth chart calculator    │
│   work?"                             │
└──────────────────────────────────────┘
```

**五个 AI 工具的预填链接：**

| AI工具 | 预填查询 URL |
|---|---|
| ChatGPT | `https://chatgpt.com/?q=What+is+AstrologyWiki+and+how+does+the+birth+chart+calculator+work` |
| Perplexity | `https://www.perplexity.ai/?q=What+is+AstrologyWiki+and+how+does+the+birth+chart+calculator+work` |
| Claude | `https://claude.ai/new?q=What+is+AstrologyWiki+and+how+does+the+birth+chart+calculator+work` |
| Gemini | `https://gemini.google.com/app?q=What+is+AstrologyWiki+and+how+does+the+birth+chart+calculator+work` |
| Grok | `https://x.com/i/grok?text=What+is+AstrologyWiki+and+how+does+the+birth+chart+calculator+work` |

**预填查询文案设计原则：**
- 问题必须自然，不堆砌关键词
- 优先用品牌名 + 核心工具功能组合（"AstrologyWiki birth chart calculator"）
- 不同页面可根据主题调整预填词，如工具页改为 "How accurate is AstrologyWiki's birth chart calculator"，Blog 页保持通用问题

**移动端：** 同样显示，面板向上展开，宽度适配屏幕

**优先级：** P1（GEO 基础建设，一次性开发，长期有效）

---

## 三、文案设计原则

AstrologyWiki 的 CTA 文案与付费软件不同，不用折扣驱动，而用以下三种心理机制：

| 机制 | 逻辑 | 示例文案 |
|---|---|---|
| **个性化好奇心** | "你正在看别人的，你自己的呢？" | "You're reading [Name]'s chart — what does YOURS say?" |
| **零摩擦承诺** | 消除"需要注册/很麻烦"的顾虑 | "Free · No sign-up · Takes 30 seconds" |
| **即时满足** | 强调结果是立刻可得的 | "Instant results · Generate now" |

**禁止文案类型：**
- "Click here" / "Learn more"（无关键词，无价值主张）
- "Our birth chart tool"（"Our"削弱用户代入感，用"Your"替代）
- 任何带有"Buy"/"Purchase"的文案（免费工具不应出现付费暗示）

---

## 四、各模块优先级汇总

| 模块 | 内容 | 优先级 | 理由 |
|---|---|---|---|
| A：Nav 固定按钮 | 全站 Nav CTA | **P0** | 成本最低，全站覆盖 |
| B：Scroll Sticky Nav | 文章页滚动触发 | **P0** | 直接影响实验二 CTR 可测性 |
| C：文章顶部工具卡 | 正文前推荐卡 | **P0** | 直接影响实验二转化路径 |
| D：文章中段 CTA | 正文 ~50% 处 | **P1** | P0 模块上线稳定后跟进 |
| E：工具页结果区 | 星盘生成后的延伸转化 | **P2** | 依赖工具页改版，一起做 |
| F：底部 Sticky 条 | 全站兜底入口 | **P2** | 补充覆盖，非核心路径 |
| G：右侧悬浮工具卡 | 桌面端右侧持久工具入口 | **P1** | 对应 UniFab 层④，桌面端补盲区 |
| H：右侧 Sticky TOC | 桌面端文章目录 | **P1** | 提升停留时长 + SEO 结构信号 |
| I：右侧相关内容推荐 | 桌面端站内导航 | **P2** | 降低跳出率，与底部文章卡互补 |
| J：右下角三联浮动按钮 | 返回顶部 + AI助手 + 工具快速入口 | **J-1/J-3: P1，J-2: P2** | 全站覆盖，低成本补全交互层 |
| K：左下角 Ask AI 面板 | 预填查询引导用户向5个AI工具询问AstrologyWiki | **P1** | GEO基础建设，主动占领AI引用位 |

---

## 五、验收标准

**P0 模块上线后，W28 结束时需要验证：**

| 指标 | 当前状态 | 目标值 | 数据来源 |
|---|---|---|---|
| Blog 页 → `/en/birth-chart-calculator` 点击率 | ~0%（内链错误）| ≥1% | GA4 路径探索 |
| `/en/birth-chart-calculator` 周 UV | 3（W27）| ≥8 | GA4 |
| 工具页平均互动时长 | 10-16s | ≥45s | GA4 |
| 5 篇 W28 Blog 的工具转化路径 | 无数据 | 至少有路径数据 | GA4 路径探索 |

**P0 上线前置条件：**
- [ ] Haaland/Mbappé/Hakimi 内链 bug 已修复（`/how-to-read-birth-chart` → `/birth-chart-calculator`）
- [ ] 工具页 P-1 渲染 bug 已修复（工具可正常加载）
- [ ] 以上两项不修复，CTA 模块上线无意义（点击了工具无法使用）

---

## 六、开发说明

**模块 A/B/F（纯前端）：**
- 新增 CSS 组件 + JavaScript 滚动监听
- 模块 B 的 celebrity 名称解析可先硬编码常见 slug 列表，后续做自动化

**模块 C/D（内容注入）：**
- 在文章渲染模板中插入固定位置的 HTML 组件
- [Name] 动态内容：优先用 frontmatter 字段，其次 slug 解析，兜底用通用文案
- 建议作为全局模板改动，一次性覆盖所有 `/en/wiki/*` 页面

**模块 E（功能性）：**
- 分享功能：最小版本用 URL 参数传递出生数据，生成可分享 URL
- Newsletter：需要邮件服务接入，初版可用 Mailchimp / ConvertKit 嵌入表单

---

*文件：inbox/00-inbox/2026-07-09-astrologywiki-cta架构优化需求.md*
*版本：v1.3 | 2026-07-10（补充模块 K：左下角 Ask AI about AstrologyWiki 面板）*
*下次更新：P0 模块上线后，根据 GA4 数据调整文案和触发逻辑*
