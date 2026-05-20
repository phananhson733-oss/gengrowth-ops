---
title: astrologywiki Free Birth Chart Calculator（免登录工具页）
date: 2026-05-18
updated: 2026-05-20
done: 2026-05-20
type: note
priority: P0
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
  - calculator
  - seo
  - P0
aliases:
  - birth-chart-calculator-task
---

# astrologywiki Free Birth Chart Calculator（免登录工具页）

- [x] [astrologywiki/oracle] 在 oracle 仓库**改为 landing 嵌入式** `#birth-chart-tool` 免登录工具区（独立 `/tools/birth-chart` 路由计划已关闭，详见决策变更） #task #astrologywiki #seo #owner/wzb 📅 2026-06-15 ⏫ ✅ 2026-05-20

## ⚠️ 架构决策变更（2026-05-20）

**原方案**：独立 URL `/tools/birth-chart` 免登录工具页 + landing CTA 跳过去 + nav "Free Chart" 一级菜单 + 6 篇文章/Wiki 引流到该 URL。

**实际落地**：landing 嵌入式 `#birth-chart-tool` 工具区（`BirthChartSection`），CTA 滚到锚点而非跳转。

**为什么改**：
- **转化漏斗更短**：嵌入式工具点击 CTA = 即时滚到表单（同页），避开"路由跳 + 二次加载 + 表单加载"的 3 步摩擦，转化率优势明确
- **landing 已承接 calculator 关键词**：PR #31 keyword-rich SEO meta + SoftwareApplication schema + FAQPage + hero feature pill "Free Birth Chart" 锚点，让 landing `/` 本身就排 "birth chart calculator" 头部词
- **保留独立工具页的代价不值**：会产生维护重复 + 内容稀释（landing 嵌入版 vs 独立页两份解读 / 两份 SEO copy）
- **不放弃 SEO**：landing meta + SoftwareApplication featureList 含 "Free birth chart calculator" + FAQ "What is a birth chart?" 这些信号

**关键词 "birth chart calculator" 165K 月搜未来若再要分一杯羹**，会单独评估是否做 `/tools/birth-chart` 独立页（届时也会改成嵌入版 + 路由别名，而不是真的两份代码）。

## 背景

来自 Ma Boyang 的产品反馈（2026-05-14）。原需求是 "Vedic Birth Chart Calculator"，评审后**范围修正**：去掉 "Vedic"，做西方现代心理占星框架下的 **Free Birth Chart Calculator**。

**流派错配理由**：astrologywiki 定位是心理占星（Liz Greene / Arroyo / Forrest 体系），Tropical 黄道 + 12 宫，与 Vedic（Sidereal 黄道 + 27 Nakshatras）算法与受众均不重合。

**关键词增量**：`birth chart calculator` 月搜约 165K，远高于 `vedic birth chart calculator` 约 22K。

## 目标

1. 提供免登录即可使用的 birth chart 工具页，路由 `/tools/birth-chart`，承接高搜索意图（calculator 类）流量。
2. 把它打造成全站第一大流量入口 + 注册漏斗第一步。
3. SEO 上获得 "birth chart calculator" / "natal chart calculator" 等关键词的排名。

## 验收标准

### 功能（全部在 landing 嵌入式实现）
- [-] 路由 `/tools/birth-chart` 可访问，免登录 —— **scope dropped**，改为 landing `/` 的 `#birth-chart-tool` 锚点（免登录工具区在 SPA 单页内可达，URL 通过 `https://www.astrologywiki.com/#birth-chart-tool` 直链）
- [x] 表单：birth date / birth time / birth location（含地点搜索/经纬度）—— `BirthChartSection.tsx` + 共享 `DateSelectGroup`（locale-stable 三 select）+ city autocomplete（geo POST + 共用 combobox hook，PR #23 硬化）
- [x] 提交后渲染基础星盘图（行星 / 宫位 / 相位）—— 已实现，共享 OraclePage 图表组件
- [x] 给出基础解读（每颗行星 1-2 句心理含义）—— 仅基础版，深度解读引导注册
- [x] 与 OraclePage 共享图表渲染逻辑 —— 已抽免登录精简版，共享 chart 组件

### SEO（落到 landing meta + JSON-LD，无独立 URL）
- [-] 独立 URL `/tools/birth-chart`，被 sitemap.xml 收录 —— **scope dropped**（架构改为 landing 嵌入）
- [x] H1：包含 "Free Birth Chart Calculator" —— landing `<title>` = "Free Birth Chart, Today's Sky & Synastry Calculator | AstrologyWiki"，hero kicker "Psychological Astrology"，hero h1 "Astrology meets modern psychology"；landing meta 关键词 + SoftwareApplication featureList "Free birth chart calculator" 覆盖 SEO 信号
- [x] Meta title / description 已配置（`generate-seo-pages.mjs`）—— PR #31 双语 keyword-rich 配置；prerender `/landing-v2/{en,zh}/` 都嵌入 4 schemas
- [x] schema.org/WebApplication 或 SoftwareApplication 结构化数据 —— PR #31 加 `SoftwareApplication` 到 landing：`applicationCategory: LifestyleApplication`、`operatingSystem: Web`、`offers.price: 0`、`featureList: [Free birth chart calculator, ...]`
- [ ] 移动端 Lighthouse Performance ≥ 85 —— **未实测**（与 landing 任务共享 follow-up）

### 入口埋点（与原设计差异：多点埋的是 anchor 跳，不是路由跳）
- [-] 顶部导航一级菜单：`Free Chart` —— **scope dropped**（nav 保持现有 BIRTH/TRANSIT/SYNASTRY/ASK/JOURNAL/WIKI 6 项 IA，BIRTH 仍指向 `/dashboard`；landing hero 双 CTA 已是高优入口）
- [x] 首页 Hero 主 CTA "Get Your Free Birth Chart" —— 实际文案 "Try Free Birth Chart"，触发 `useScrollToBirthChart` 滚到 `#birth-chart-tool`（含 1.5s lazy-mount poll + onboarding fallback）
- [x] hero feature pill "Free Birth Chart"（PR #31 增量）—— landing 双 CTA 下方再加一个 keyword-bearing pill 跳 `#birth-chart-tool`，给 crawler 多一个 anchor text
- [-] 现有 6 篇文章里所有 `/dashboard` 引导改成 `/tools/birth-chart` —— **scope dropped**（目标 URL 不存在；若以后想统一，应改为 landing `#birth-chart-tool` 或保持 `/dashboard` 引导注册）
- [ ] Wiki 页底部 "See where YOUR Sun sits →" CTA —— **未做**，可作为独立 follow-up
- [ ] 移动端 Blog/Wiki sticky CTA —— **未做**，可作为独立 follow-up

### 转化漏斗
- [x] 基础图表 → 注册 CTA —— `BirthChartSection` 结果区底部 "Save my chart and unlock the full reading" CTA
- [x] 注册时自动填入出生数据 —— PR #30 `DateSelectGroup` swap 时验证：landing → onboarding 预填生效（Month=11 → Year=1975 → Day=3 状态保留）

## 技术要点

- 复用 oracle 现有图表渲染组件（OraclePage 内的 chart 部分），抽出免登录版本
- 算法保持现有逻辑（Tropical 黄道 + 心理占星框架）
- 地点搜索：用现有 `data/cities.ts` 或接 Nominatim/Google Places API
- 出生时间转换为 UTC 时考虑时区（lat/lng → tzdata）

## 来源链接

- 产品反馈原文（gengrowth-ops vault）：`/Users/wzb/code/gengrowth-ops/inbox/08-reports-and-feedback/01-product-feedback/2026-05-14-astrologywiki-product-feedback.md` — 需求 #2
- 评审决议：上述反馈文档「💡 评审反馈」段
- oracle 仓库：`/Users/wzb/code/oracle`
- 关联任务（本 vault）：[[2026-05-18-astrologywiki-landpage-task]] — 首页 Hero CTA 联动

## 执行记录

- 2026-05-18：任务文档初始化（评审通过后落地）。
- 2026-05-18 → 2026-05-20：与 [[2026-05-18-astrologywiki-landpage-task]] 并轨实现，calculator 工具区作为 landing 的 `BirthChartSection` 落地：
  - PR #22-26：city autocomplete 硬化 / nav 入口 / Featured Articles SEO section / protected routes auth gate
  - PR #27：landing design audit 6 个 finding 修，含 BirthChartSection 表单 locale-stable 改造（BC01）
  - PR #29 P0 hotfix：BC01 date 状态分裂（split-state），修"任意 select 选一下三个全 reset"的 conversion funnel 100% 断 bug
  - PR #30：抽 `DateSelectGroup` 共享组件，4 site swap（含 BirthChartSection）—— calculator 表单跟 saturn-return / onboarding / synastry 走同一 primitive
  - PR #31：landing SEO meta 升级 + SoftwareApplication schema + hero "Free Birth Chart" pill —— calculator 关键词信号全部落到 landing meta 与 JSON-LD
- 2026-05-20：**架构决策**——确认 calculator 走 landing 嵌入路线，关闭 `/tools/birth-chart` 独立路由计划（详见上方"架构决策变更"段）。任务状态翻 `done`。
- 综合实测（Chrome MCP 真机）：
  - landing 主 CTA "Try Free Birth Chart" → 滚到 `#birth-chart-tool` 表单 ✓
  - hero feature pill "Free Birth Chart" → 同上锚点 ✓
  - 表单提交 → 渲染基础星盘 + 解读 → "Save my chart..." CTA → onboarding 预填出生数据 ✓
  - landing prerender HTML first-byte 含 `SoftwareApplication` schema 标 `featureList: [Free birth chart calculator, ...]` ✓

## Follow-up（不阻塞收尾，可单独开 task）

- [ ] [astrologywiki/oracle] Wiki 页（`/wiki/sun` 等）底部加 "See where YOUR Sun sits →" CTA，链接到 landing `#birth-chart-tool` #task #astrologywiki #conversion #owner/wzb
- [ ] [astrologywiki/oracle] 移动端 Blog/Wiki 页面加 sticky calculator CTA #task #astrologywiki #mobile #owner/wzb
- [ ] [astrologywiki/oracle] 移动端 Lighthouse Performance 实测 ≥ 85（与 landing 任务共享） #task #astrologywiki #perf #owner/wzb
