---
project: astrologywiki
type: feedback
status: reviewed
owner: Ma Boyang
reviewer: wzb
review_date: 2026-05-18
updated: 2026-05-18
---

# 🚀 产品功能需求反馈：SEO 工业化产线支持

**目标**：提升 astrologywiki 的内容发布效率、内链权重传递及核心工具词转化率。

---

## 一、 核心需求追踪与评审大盘

### 1. 独立 Blog 发布与管理后台 (CMS)
*   **提出日期**：2026-05-14
*   **当前状态**：[x] 已驳回（暂缓 — 提前优化）
*   **需求描述**：需要一个可视化的界面进行 Blog 的发布、预览（试看）和二次调整。
*   **核心功能**：
    *   **SEO 元数据设置**：必须支持手动设置每篇文章的 `Title Tag`、`Meta Description` 和 `Focus Keywords`。
    *   **预览模式**：在发布前能看到文章在 PC/Mobile 端的实际呈现效果。
*   **SEO 理由**：目前通过代码或数据库直接发布效率太低，且无法精准控制 TDK（标题、描述、关键词），这是 SEO 优化的基本盘。
*   **💡 评审反馈**：
    > **决议：暂不研发 CMS。**
    >
    > **理由**：oracle 仓库当前文章数 = 6（硬编码在 `data/articles/*.ts`），瓶颈在内容产能而非发布工具。CMS 是为月产 30+ 篇准备的基础设施，当前阶段做属于提前优化。
    >
    > **替代方案（轻量改造，1 天工作量）**：把 `data/articles/*.ts` 改成 Markdown + front-matter，build 时由脚本自动转 article object。运营脱离 TypeScript，TDK 也通过 front-matter 直接配置（已在 Obsidian 模板 `templates/草稿-SEO博客-AIO.md` 中预置）。
    >
    > **重新评估时机**：月产文章 ≥ 20 篇时回头讨论。

### 2. Standalone 工具页：Vedic Birth Chart Calculator
*   **提出日期**：2026-05-14
*   **当前状态**：[x] 已接纳（**范围修正**） — P0 排期
*   **需求描述**：开发一个独立的 `best vedic birth chart calculator` 页面。
*   **细节要求**：虽然部分文章可以引导至 `/dashboard`，但必须有一个**免登录即可使用的独立工具页面**。
*   **SEO 理由**：`calculator` 类关键词的搜索意图是“立即获取结果”。独立工具页比封闭的 Dashboard 更有利于获得 Google 排名，且能作为巨大的流量入口（Lead Magnet）。
*   **💡 评审反馈**：
    > **决议：做。但需求范围必须修正，去掉 "Vedic"。**
    >
    > **范围修正理由（流派错配）**：astrologywiki 是西方现代心理占星（Liz Greene / Stephen Arroyo / Steven Forrest 体系），Vedic 是印度吠陀占星。两者：
    > - 黄道系统不同：Tropical（回归）vs Sidereal（恒星）
    > - 核心结构不同：12 宫 + 心理原型 vs 27 Nakshatras + Dasha 周期
    > - 行星集合不同：现代占星含 Uranus/Neptune/Pluto，Vedic 不用
    > - 目标用户不同：欧美/华语自我探索人群 vs 印度/印度裔命理需求
    >
    > 做 Vedic = 算法重写 + 整套 wiki 内容重写 + 抓非目标用户，与定位严重错配。
    >
    > **最终需求**：**Free Birth Chart Calculator**（无前缀），路由 `/tools/birth-chart`，免登录，心理占星框架（与现有 `/wiki/*` 内容一致）。
    >
    > **关键词增量**："birth chart calculator" 月搜约 165K，远高于 "vedic birth chart calculator" 约 22K，且匹配现有内容定位。
    >
    > **入口规划（多点埋入，不是侧边栏功能）**：
    > 1. 顶部导航一级菜单：`Free Chart`
    > 2. 首页 Hero 主 CTA 改成 "Get Your Free Birth Chart"
    > 3. 现有文章里 `/dashboard` 引导（如 `how-to-read-birth-chart.ts` 里 "Open the AstroMind Dashboard"）**全部改成** `/tools/birth-chart`
    > 4. Wiki 页（如 `/wiki/sun`、`/wiki/moon`）底部加 "See where YOUR Sun sits →"
    > 5. 移动端 Blog/Wiki 页面 sticky CTA
    >
    > **转化漏斗**：免登录用 → 给出基础图表 → "想看完整心理解读 / 流年 / 合盘？登录免费查看" → 注册（出生数据已填，注册阻力为 0）。
    >
    > **排期**：P0。研发可复用 OraclePage 现有图表渲染逻辑，抽免登录精简版。

### 3. astrologywiki.com landpage
*   **提出日期**：2026-05-14
*   **当前状态**：[x] 暂缓（前置条件：内容数 ≥ 15）
*   **需求描述**：在官网首页 (`/`) 增加一个板块，如“Featured Articles”或“Latest Guides”。
*   **展示逻辑**：优先展示我们定义的 **Pillar Blog（主关键词文章）**。
*   **SEO 理由**：首页是全站权重最高的地方。通过首页直接链接到 Pillar 页面，可以实现权重的快速下沉，加速主关键词的排名爬升。
*   **💡 评审反馈**：
    > **决议：暂缓研发，前置内容产能。**
    >
    > **理由**：当前文章数 = 6。"Pillar Hub" 隐含的逻辑是「在一堆文章里挑出最重磅的几篇主推」，6 篇全推 = 退化成"最新文章列表"，没有 SEO 杠杆，也没有权重分配的意义。
    >
    > **真正前置**：内容侧先写到 15-20 篇，能明确分出 3 篇 Pillar + 6 篇 Sub-pillar 后再启动。
    >
    > **位置规划（确认了再做参考）**：
    > - 位置：Hero 之下，第一屏滚下来第一个 section
    > - 展示：3-6 张卡片（封面 + Title + 1 行 description + 阅读时长）
    > - 底部 CTA：「View All Articles →」接 `/wiki` 或 `/blog`
    >
    > **研发成本**：2-3 天（可复用 gengrowth-agents 现有 `pillar_slug` + `RelatedArticles` 组件模式）。
    >
    > **重新评估时机**：文章数 ≥ 15 时启动。

### 4. 模块化落地页组装工具 (Modular LP Builder)
*   **提出日期**：2026-05-14
*   **当前状态**：[x] 已驳回（过度工程）
*   **需求描述**：一套可以自由组合的“模块化组件库”（如：对比表模块、QA模块、工具演示模块）。
*   **核心功能**：允许运营人员通过组装模块，快速设计针对特定关键词的 Landing Page。
*   **SEO 理由**：针对 High-Intent（高意图）词，标准的 Blog 格式转化率不足。模块化设计可以让我们针对不同词组快速产出高转化、高体验的落地页。
*   **💡 评审反馈**：
    > **决议：不做。**
    >
    > **理由**：当前 LP 总数 = 0。Builder 类工具是为「LP 组装频率 > 1 次/周」的规模设计的，当前需求超出实际产能两个数量级。先做出一个能跑通转化的 LP，再谈复用。
    >
    > **替代路径（按需触发）**：等真有需求时（3-5 个 LP），先用 Tailwind + shadcn 手写 6-8 个 block 组件（HeroCompare / QABlock / ToolDemo / TrustRow / CTAStrip / FAQAccordion 等），通过组件复用而非 builder UI 实现快速搭建。**只有当组件复用频率 > 1 次/周时，再投入 builder UI**。

---

## 二、 AI建议：技术优化点（评审结论）

1.  **自动内链建议插件**：在 Blog 发布界面，系统能根据 `Parent Pillar` 字段，自动提醒我在正文前 30% 插入指向主页面的链接。
    > **决议：不做。**
    > **理由**：oracle 现有 6 篇文章的手工内链质量已经足够（例：`how-to-read-birth-chart.ts` 含 7 处 `/wiki/*` 内链）。在没有 CMS 编辑器的前提下，插件没有承载界面；写作时遵循 Obsidian 模板里的「内链清单」即可解决。属于 over-tooling。

2.  **AIO (AI Overview) 质检框**：在 CMS 编辑器中增加一个"Answer Lock"检查框，强迫运营人员填入那段"加粗的直接答案"，以提高被 Google AI 引用的概率。
    > **决议：接纳，落地形式调整为 Obsidian 写作模板（已交付）。**
    >
    > **概念澄清**：AIO = Google AI Overviews（搜索结果顶部的 AI 摘要框）。Answer Lock 不是 AI 检查、也不是 AI 生成内容，而是**在文章顶部强制放一段直接回答 query 的纯文本**（50-100 词 / 80-150 字），让 Google AIO / Perplexity / ChatGPT 搜索抓取作为引用源。
    >
    > **落地方式调整**：astrologywiki 工作流是 Obsidian 而非 CMS，因此不做"编辑器质检框"，改用 **Obsidian 写作模板 + 必填 `## TL;DR` 段位** 实现。
    >
    > **已交付物**：`templates/草稿-SEO博客-AIO.md`（初版，Templater 兼容）
    > - Templater prompt：title / focus keyword / slug / pillar / lang / author
    > - front-matter：title / slug / focus_keyword / pillar_slug / description / keywords / schema / lang 等 SEO 字段
    > - 强制 `## TL;DR` 段（带写作规则注释，发布前不准为空）
    > - 内链清单（至少 3 个，1 个指向 pillar）
    > - 发布前 Checklist（TDK / 内链 / alt / 移动端预览等）
    >
    > **使用方式**：Obsidian 里 Cmd+P → Templater: Create new note from template → 选择「草稿-SEO博客-AIO」。

3.  **CTA 转化追踪集成**：在模块化落地页中，所有按钮应支持简易的 UTM 参数配置，以便在 GA4 中追踪不同文章带来的注册转化率。
    > **决议：不进研发排期。**
    > **理由**：GA4 UTM 是配置不是研发功能。写文章时手动在 CTA 链接加 `?utm_source=blog-post-X&utm_medium=organic&utm_campaign=...` 即可，Obsidian 模板「内链清单」段可以一并约定写法。

---

## 三、 执行清单汇总

| # | 需求 | 决议 | 排期 |
|---|------|------|------|
| 1 | Blog CMS（TDK + 预览） | 暂缓（提前优化） | 月产文章 ≥ 20 时复评 |
| **2** | **Free Birth Chart Calculator**（原 Vedic 范围修正） | **接纳** | **P0** |
| 3 | 首页 Pillar Hub | 暂缓（前置内容产能） | 文章数 ≥ 15 时启动 |
| 4 | Modular LP Builder | 驳回（过度工程） | 不排期 |
| AI-1 | 自动内链建议插件 | 驳回 | 不排期 |
| AI-2 | AIO Answer Lock | 接纳（Obsidian 模板） | **已交付** |
| AI-3 | CTA UTM 追踪 | 不进研发排期 | 文档约定 |

**结论**：本次评审唯一进入研发的需求是 **#2 Free Birth Chart Calculator**，AI-2 通过 Obsidian 模板已同步落地。其余项暂缓或驳回，等内容产能/LP 数量到达阈值后重新评估。

---
**附件/参考**：
*   执行大盘：`《选题登记表》`
*   方法论：`SEO内容生产流水线_v2.0`
*   AIO 写作模板：`templates/草稿-SEO博客-AIO.md`
