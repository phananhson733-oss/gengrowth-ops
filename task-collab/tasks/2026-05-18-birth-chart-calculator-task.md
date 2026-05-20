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

### 功能
- [ ] 路由 `/tools/birth-chart` 可访问，免登录
- [ ] 表单：birth date / birth time / birth location（含地点搜索/经纬度）
- [ ] 提交后渲染基础星盘图（行星 / 宫位 / 相位）
- [ ] 给出基础解读（每颗行星 1-2 句心理含义）— 仅基础版，深度解读引导注册
- [ ] 与 OraclePage 共享图表渲染逻辑（不重复实现），抽免登录精简版组件

### SEO
- [ ] 独立 URL `/tools/birth-chart`，被 sitemap.xml 收录
- [ ] H1：包含 "Free Birth Chart Calculator"
- [ ] Meta title / description 已配置（脚本 `generate-seo-pages.mjs` 覆盖）
- [ ] schema.org/WebApplication 或 SoftwareApplication 结构化数据
- [ ] 移动端 Lighthouse Performance ≥ 85

### 入口埋点（多点）
- [ ] 顶部导航一级菜单：`Free Chart`
- [ ] 首页 `LandingPage.tsx` Hero 主 CTA 改成 "Get Your Free Birth Chart" → `/tools/birth-chart`（与 #3 首页改版同步上线）
- [ ] 现有 6 篇文章里所有 `/dashboard` 引导改成 `/tools/birth-chart`（特别是 `how-to-read-birth-chart.ts`）
- [ ] Wiki 页（`/wiki/sun` 等）底部加 "See where YOUR Sun sits →" CTA
- [ ] 移动端 Blog/Wiki 页面加 sticky CTA

### 转化漏斗
- [ ] 用户得到基础图表后，在解读下方放注册 CTA："想看完整心理解读 / 流年 / 合盘？登录免费查看"
- [ ] 注册时自动填入用户已输入的出生数据（不重新填）

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
