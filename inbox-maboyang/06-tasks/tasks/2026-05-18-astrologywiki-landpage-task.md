---
title: astrologywiki.com 首页改版（统一内链入口）
date: 2026-05-18
updated: 2026-05-20
done: 2026-05-20
type: note
priority: P1
status: done
requester: Ma Boyang
reviewer: wzb
owner: wzb
project: astrologywiki
source: /Users/wzb/code/gengrowth-ops/inbox/08-reports-and-feedback/01-product-feedback/2026-05-14-astrologywiki-product-feedback.md
source_vault: gengrowth-ops
tags:
  - task
  - astrologywiki
  - landpage
  - seo
  - internal-linking
  - P1
aliases:
  - astrologywiki-landpage-task
---

# astrologywiki.com 首页改版（统一内链入口）

- [x] [astrologywiki/oracle] 改造 `LandingPage.tsx`，让首页承担「Calculator 入口 + Featured Articles + Wiki Topics + Footer Sitemap」四个内链分发职责 #task #astrologywiki #seo #owner/wzb 📅 2026-07-15 🔼 ✅ 2026-05-20

## 背景

来自 Ma Boyang 的产品反馈（2026-05-14）。原需求是「首页内链权重模块 (Home Page Pillar Hub)」，评审后**范围扩大**：不只做一个 Pillar Hub 区块，而是把首页整体改造成**统一内链入口** — 站内所有重要 URL 都从首页 ≤1 跳可达，让 PageRank 顺着分发。

**与其他任务的耦合**：
- 与 #2 Calculator 强耦合：首页 Hero 主 CTA 直达 `/tools/birth-chart`
- 与 #1 CMS 简化版关联：Featured Articles 读取 markdown 转的 article index

## 目标

1. 首页 = 全站内链权重分配总闸
2. 首次访客 3 秒内理解站点定位（心理占星，不是命理预测，不是 Vedic）
3. Hero CTA 直接进 Calculator，转化漏斗第一步
4. SEO 上承接关键词 `psychological astrology`、`birth chart`、`natal chart` 等头部词

## 验收标准

### 整体结构（首屏 + 三个 section + footer）

- [x] **Hero**：H1 = 站点定位一句话，主 CTA "Get Your Free Birth Chart" → `/tools/birth-chart`
  - 实际实现：H1 "Astrology meets modern psychology."（kicker 已带 "Psychological Astrology" 关键词）
  - 主 CTA "Try Free Birth Chart" → **scroll 到 `#birth-chart-tool` 嵌入式工具**（不是路由跳 `/tools/birth-chart`）—— 决策原因：嵌入式工具直接转化，避免路由跳转 + 二次加载摩擦
  - 增量：md+ 7/5 双列网格，右半区嵌入 HeroTodayCard（今日 Sun/Moon/Mercury 编辑卡），并加 5 个 keyword feature pills（Free Birth Chart / Today's Sky / Synastry / Saturn Return / Ask Oracle）作为 SEO 锚点 + 站内寻路
- [x] **Section 1: Featured Articles**：3-6 张卡片
  - 实际实现：`FeaturedArticlesSection.tsx`，初期展示最新文章；卡片元素含 cover + title + description + 阅读时长
  - hashtag 已改为可点击 `<Link>` 跳 `/wiki?tab=articles&tag=...`
- [x] **Section 2: Explore the Wiki**：网格化展示主题入口
  - 实际实现：`WikiHubSection.tsx`，行星 / 宫位 / 相位 + Today's Transit 入口
  - 每个 tile 点击 → `/{lang}/wiki/<topic>` ✓
- [ ] **Section 3: 心理占星介绍**：流派定位 + 与传统占星差异
  - 承接 SEO 关键词 `psychological astrology`
  - 包含 1 段 AIO Answer Lock（参考 `templates/草稿-SEO博客-AIO.md` 规范）
  - **未做**：没有独立的「Section 3 心理占星介绍」visible body 段；当前流派定位散落在 Hero kicker（"Psychological Astrology · Psychology · Self-Knowledge"）+ trust line（"Built on real astronomy, not fortune-telling"）+ SocialProofSection
  - **替代覆盖**：PR #31 加了 `FAQPage` JSON-LD（4 个高意图问题）抓了 SEO/GEO AIO 的核心意图，但不是 visible body AIO Answer Lock 段
  - 留作 follow-up（见底部）
- [x] **Footer Sitemap**：全站 main URL 都有一条路径
  - 实际实现：`FooterSection.tsx`，含 Birth Chart / Transit / Synastry / Ask / Wiki / Saturn Return / Today / About / Privacy / Terms / Cookies + 语言切换

### SEO
- [x] H1 唯一，包含 `psychological astrology` 或同义关键词（"modern psychology" + 关键词富集到 kicker、SEO title、`<meta>` keywords、SoftwareApplication featureList）
- [x] Meta title / description 通过 `generate-seo-pages.mjs` 配置（PR #31 升级为关键词 rich：`Free Birth Chart, Today's Sky & Synastry Calculator | AstrologyWiki`，EN+ZH 双语）
- [x] schema.org/WebSite + SearchAction 结构化数据（PR #31 扩到 4 schemas：WebSite + Organization + SoftwareApplication + FAQPage；PR #32 dedupe，SPA root 单一 owner 无重复）
- [ ] AIO Answer Lock 段（50-100 词）放在 Section 3 顶部 —— **未做**（同上，FAQPage JSON-LD 部分替代但非 visible 段）
- [ ] 移动端 Lighthouse Performance ≥ 85 —— **未实测**

### 双语
- [x] 英文版 `/en` + 中文版 `/zh`（`generate-seo-pages.mjs` LANG_CONFIG 已 keyword-rich 双语；landing 走 i18n 上下文 `useLanguage`）
- [x] 所有文案不硬编码，走 i18n（`constants.ts` 的 `TRANSLATIONS` 字典，新增的 hero pills / SEO meta 也都双语）

### 设计
- [x] 对照 `COLOR_SYSTEM_GUIDE.md`（Editorial Serif Poster 风格，gold accent，paper/space 双主题）
- [x] 响应式（mobile-first，sm/md/lg 断点，Hero 双列 → 单列，pills `flex-wrap`，HeroTodayCard `hidden md:block`）

## 不做的事（明确范围）

- ❌ 不依赖 #1 CMS 简化版完工（Featured Articles 可以先用现有 .ts article index，迁移完再切）
- ❌ 不做首页编辑器 / 后台管理（Featured Articles 由代码逻辑自动选）
- ❌ Hero 视频背景 / 复杂动效（追求 Lighthouse 分数）

## 技术要点

- 复用 oracle 现有组件库（按 `COLOR_SYSTEM_GUIDE.md`）
- Featured Articles 数据源：先读 `data/articles/index.ts`，#1 完工后切 markdown index
- Wiki Topics 数据源：`data/wiki-associations.ts` 已存在的列表
- 文章数判断：`getArticles(lang).length >= 15` 切换排序逻辑

## 来源链接

- 产品反馈原文（gengrowth-ops vault）：`/Users/wzb/code/gengrowth-ops/inbox/08-reports-and-feedback/01-product-feedback/2026-05-14-astrologywiki-product-feedback.md` — 需求 #3
- 评审决议：上述反馈文档「💡 评审反馈」段
- 关联任务（本 vault）：[[2026-05-18-birth-chart-calculator-task]]（Hero CTA 目标）、[[2026-05-18-cms-simple-version-task]]（Featured Articles 数据源）
- UI 规范：oracle `COLOR_SYSTEM_GUIDE.md`
- oracle 仓库：`/Users/wzb/code/oracle`

## 执行记录

- 2026-05-18：任务文档初始化（评审通过后落地）。
- 2026-05-18 → 2026-05-19：**Landing v1 → v2 重构**
  - PR #21 L2 cutover：`/` 切到 `LandingPageV2`
  - PR #22 用户反馈批次：nav 入口 + section zebra + city autocomplete + Claude-mono 字体
  - PR #23 city autocomplete 硬化：geo POST + 共用 combobox hook + 5 处键盘 a11y
  - PR #24 Today's Sky 503 修复：完整性门 false positive
  - PR #25 验收反馈批次：hero italic + nav 统一 + onboarding skip + Synthetica + saturn polish + dark zebra
  - PR #26 二轮验收：protected routes auth gate + dark zebra v2 + Synthetica scroll-to-top + Featured Articles SEO section
- 2026-05-20：**Landing 三轮 → 七轮 + nav 修复**
  - PR #27 design-audit 6 个 finding 并行修（date input locale-stable / nav 44px touch / Hero 7-5 双列 + HeroTodayCard / FeaturedArticles hashtag 可点击 / Newsletter arrow / S01-S03）
  - PR #28 scrollbar color-scheme 在 light mode 走 `:has()` 提升到 `:root`
  - PR #29 BC01 P0 hotfix：date 状态分裂 split-state + useTodaySky UTC TTL（Codex review 抓到 conversion funnel 100% 断）
  - PR #30 抽 `DateSelectGroup` 共享组件 + 4 site swap（landing / saturn / onboarding / synastry 统一）
  - PR #31 keyword-rich SEO meta + 4 JSON-LD schemas + Hero feature pills（5 个 keyword 锚点）+ 删 `YOUR_GSC_VERIFICATION_CODE` 占位符
  - PR #32 JSON-LD dedupe：SPA root 3 → 2 scripts，零 `@type` 重复
  - PR #33 logo 点击改跳 `/`（不是 `/dashboard`）+ 键盘激活 + a11y 属性
  - PR #34 navigate 进 landing 路由时关掉残留 login modal（修 wiki → logo 后 modal 残留导致"landing 居然要登录"的 UX 回归）
- 2026-05-20：任务状态翻 `done`。**两项未做 follow-up 单独 track**：
  - Section 3 心理占星介绍 visible body + AIO Answer Lock 段（FAQPage schema 抓了 SEO/GEO 意图，但 visible body 段仍缺）
  - 移动端 Lighthouse Performance ≥ 85 实测
- 综合实测（Chrome MCP 真机 + curl 双面）：
  - SPA root `/`：keyword-rich title + 4 schemas 唯一 + hero pills 5 个全部 anchor/route 正确
  - 静态 prerender `/landing-v2/{en,zh}/`：first-byte HTML 含全 4 schemas + 4 Q/A，crawler 直接拿
  - Logo `/en/wiki` → `/` ✓；wiki 触发 modal 后 logo → modal 关 + 路由 `/` ✓

## Follow-up（不阻塞收尾）

- [ ] [astrologywiki/oracle] Landing 加 "Section 3 心理占星介绍" visible body 段，含 50-100 词 AIO Answer Lock（承接 `psychological astrology` SEO/GEO 主战场） #task #astrologywiki #seo #owner/wzb 🔼
- [ ] [astrologywiki/oracle] 移动端 Lighthouse Performance 实测，跑 4G 模拟 ≥ 85 #task #astrologywiki #perf #owner/wzb
