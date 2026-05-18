---
title: astrologywiki.com 首页改版（统一内链入口）
date: 2026-05-18
updated: 2026-05-18
type: note
priority: P1
status: todo
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

- [ ] [astrologywiki/oracle] 改造 `LandingPage.tsx`，让首页承担「Calculator 入口 + Featured Articles + Wiki Topics + Footer Sitemap」四个内链分发职责 #task #astrologywiki #seo #owner/wzb 📅 2026-07-15 🔼

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

- [ ] **Hero**：H1 = 站点定位一句话，主 CTA "Get Your Free Birth Chart" → `/tools/birth-chart`
- [ ] **Section 1: Featured Articles**：3-6 张卡片
  - 初期（文章数 < 15）：展示最新 6 篇文章
  - 文章数 ≥ 15 后：切换为 "1 篇 Pillar 主推 + 5 篇 Sub-pillar" 排序逻辑
  - 卡片元素：封面（可无）+ Title + 1 行 description + 阅读时长
  - 底部 CTA："View All Articles →" → `/wiki` 或 `/blog`
- [ ] **Section 2: Explore the Wiki**：网格化展示主题入口
  - 12 颗行星（Sun / Moon / Mercury / ...）
  - 12 宫位（1st House / 2nd House / ...）
  - 主要相位（Conjunction / Square / Trine / ...）
  - 每个 tile 点击 → `/wiki/<topic>`
- [ ] **Section 3: 心理占星介绍**：流派定位 + 与传统占星差异
  - 承接 SEO 关键词 `psychological astrology`
  - 包含 1 段 AIO Answer Lock（参考 `templates/草稿-SEO博客-AIO.md` 规范）
- [ ] **Footer Sitemap**：全站 main URL 都有一条路径
  - Tools（Birth Chart）
  - Wiki（行星 / 宫位 / 相位）
  - Articles（最新 / Pillar）
  - About / Privacy / Terms
  - 语言切换（en / zh）

### SEO
- [ ] H1 唯一，包含 `psychological astrology` 或同义关键词
- [ ] Meta title / description 通过 `generate-seo-pages.mjs` 配置
- [ ] schema.org/WebSite + SearchAction 结构化数据
- [ ] AIO Answer Lock 段（50-100 词）放在 Section 3 顶部
- [ ] 移动端 Lighthouse Performance ≥ 85

### 双语
- [ ] 英文版 `/en` + 中文版 `/zh`（参考 `generate-seo-pages.mjs` 现有 LANG_CONFIG）
- [ ] 所有文案不硬编码，走 i18n

### 设计
- [ ] 对照 `COLOR_SYSTEM_GUIDE.md`（oracle 项目唯一 UI 规范）
- [ ] 响应式（mobile-first，断点 sm/md/lg）

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

- 产品反馈原文：[[2026-05-14-astrologywiki-product-feedback]]（需求 #3）
- 评审决议：上述反馈文档「💡 评审反馈」段
- 关联任务：[[2026-05-18-birth-chart-calculator-task]]（Hero CTA 目标）、[[2026-05-18-cms-simple-version-task]]（Featured Articles 数据源）
- UI 规范：oracle `COLOR_SYSTEM_GUIDE.md`
- oracle 仓库：`/Users/wzb/code/oracle`

## 执行记录

- 2026-05-18：任务文档初始化（评审通过后落地）。
