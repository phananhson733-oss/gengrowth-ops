---
title: astrologywiki Free Birth Chart Calculator（免登录工具页）
date: 2026-05-18
updated: 2026-05-18
type: note
priority: P0
status: todo
requester: Ma Boyang
reviewer: wzb
owner: wzb
project: astrologywiki
source: inbox/08-reports-and-feedback/01-product-feedback/2026-05-14-astrologywiki-product-feedback.md
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

- [ ] [astrologywiki/oracle] 在 oracle 仓库新增 `/tools/birth-chart` 免登录工具页，并在站内多点埋入入口 #task #astrologywiki #seo #owner/wzb 📅 2026-06-15 ⏫

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

- 产品反馈原文：[[2026-05-14-astrologywiki-product-feedback]]（需求 #2）
- 评审决议：上述反馈文档「💡 评审反馈」段
- oracle 仓库：`/Users/wzb/code/oracle`
- 关联任务：[[2026-05-18-astrologywiki-landpage-task]]（首页 Hero CTA 联动）

## 执行记录

- 2026-05-18：任务文档初始化（评审通过后落地）。
