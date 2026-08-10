---
project: gengrowth
type: content-plan
status: done
owner: wzb
date: 2026-08-07
updated: 2026-08-07
tags:
  - gengrowth
  - content-production
  - seo
aliases:
  - 8月7日 gengrowth 内容队列
  - 2026-08-07 gengrowth blog output plan
---

# 2026-08-07 gengrowth.ai 博客内容输出计划（4 篇）

> **来源**：gengrowth.ai workbook 选题登记表 第 70/71/73/74 行（用户 2026-08-07 圈定）。
> **目标**：把 3 个 Week-1/Week-2 集群的首批页面落地 —— keyword_opportunity（Pillar+Series）、
> search_performance_diagnosis（Pillar）、internal_link_architecture（单篇）。
>
> **本文件名含 `gengrowth`**，因此 `gg-seo-autopilot.mjs` 的 `latestPlan()` 会自动排除它
> （astrologywiki/oracle autopilot 永远不会认领这里的任务）；gengrowth 作者线通过
> `GG_AUTOPILOT_PLAN` 显式 pin 本文件。

## 集群与内链拓扑

| page_id | 关键词 | cluster | page_role | Tier | volume/KD |
|---|---|---|---|---|---|
| `PG-KOD-001` | how to find low hanging fruit keywords | keyword_opportunity | Pillar | T1 | 1300 / KD4 |
| `PG-KOD-002` | zero search volume keywords | keyword_opportunity | Series | T2 | 110 / KD14 |
| `PG-SPD-001` | striking distance keywords | search_performance_diagnosis | Pillar | T1 | 1300 / KD12 |
| `PG-ILA-001` | pagerank sculpting | internal_link_architecture | Support | T2 | 720 / KD14 |

**发布顺序**：先 Pillar 后 Series —— `PG-KOD-001` → `PG-SPD-001` → `PG-KOD-002` → `PG-ILA-001`。
Series（PG-KOD-002）正文前 30% 必须回链已上线的 Pillar，所以 Pillar 不先上线会造成死链。

**工具页内链（已线上核验，2026-08-07）**：

- `/tools/hidden-keywords`（Keyword Opportunity Map）— 200 ✅ — keyword_opportunity 两篇用
- `/tools/seo-quick-wins` — 200 ✅ — PG-SPD-001 用
- `/tools/traffic-drop-diagnosis` — 200 ✅ — 核心更新 Series 用
- `/tools/internal-link-audit` — 200 ✅ — PG-ILA-001 用
- ⚠️ `/tools/low-competition-keywords` — **404** — 主题集群表 `keyword_opportunity.internal_link_rule`
  写的是这个路径，是错的；正确路径是 `/tools/hidden-keywords`。**已于本批修正（集群表 N21）**。
- ⚠️ 但 `/tools/hidden-keywords` 虽返回 200，页面正文写着 "This tool is not available yet"，只有 waitlist
  邮箱框。**HTTP 200 ≠ 工具可用**。keyword_opportunity 两篇的 CTA 因此改指 `/tools/seo-audit`
  （免登录、免 GSC、真能跑），CTA Map 也补了 `cta_tool_seo_audit` 一行。

## 2026-08-07 批次

### 阶段 A：先发集群 Pillar

- [x] `PG-KOD-001` how to find low hanging fruit keywords  -> LIVE https://gengrowth.ai/blog/how-to-find-low-hanging-fruit-keywords
- [x] `PG-SPD-001` striking distance keywords  -> LIVE https://gengrowth.ai/blog/striking-distance-keywords

### 阶段 B：Pillar 上线后再发 Series / Support

- [x] `PG-KOD-002` zero search volume keywords  -> LIVE https://gengrowth.ai/blog/zero-search-volume-keywords
- [x] `PG-ILA-001` pagerank sculpting  -> LIVE https://gengrowth.ai/blog/pagerank-sculpting

## 验收

- phase2 结构门 `overall=pass`（`GG_SITE=gengrowth` 契约）
- 事实门 PASS —— codex 当日无额度，改用并行 Claude subagent 做对抗性事实审。**四篇初审全部 FAIL**，
  抓到的 CRITICAL：CTA 承诺未上线的工具、三处编造工具能力、一处算术错误（`50×3+950×22` 写成平均 15，
  实际 21.05）、GSC 匿名化盲区让文章的头号验证方法结构性失效、nofollow 变更被当成 2009-06
  （那是**披露**日期，Cutts 原文说变更"更早一年多"）、以及把他的个人博客错标成 Google Webmaster Central Blog。全部已修并复验。
- 发布路径**不是** Supabase：站点 canonical 是仓库里的 Markdown（`blog.ts`: "local content is canonical;
  Supabase is a removable migration bridge"），`--emit rest` 写进 blog_posts 不会让文章上线。
  实际落地 = md + hero 提交进 nevermore `main` → 自动部署。

## 上线结果（2026-08-07 21:09 验证）

- 4 篇 `https://gengrowth.ai/blog/<slug>` 全部 **HTTP 200**
- sitemap 87 → **91** 条，4 个 slug 全部收录
- 4 张 hero `\/images/blog/<slug>.jpg` 全部 200 image/jpeg
- 选题登记表 Status/URL 已回填（`_gengrowth-0807-backfill-ledger.mjs`，先验 200 再写，幂等）
- commit `377a4b9` on nevermore `main`
