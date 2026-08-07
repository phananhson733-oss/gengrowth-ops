---
project: gengrowth
type: content-plan
status: in-progress
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
  写的是这个路径，是错的；正确路径是 `/tools/hidden-keywords`。集群表待修。

## 2026-08-07 批次

### 阶段 A：先发集群 Pillar

- [x] `PG-KOD-001` how to find low hanging fruit keywords
- [x] `PG-SPD-001` striking distance keywords

### 阶段 B：Pillar 上线后再发 Series / Support

- [x] `PG-KOD-002` zero search volume keywords
- [x] `PG-ILA-001` pagerank sculpting

## 验收

- phase2 结构门 `overall=pass`（`GG_SITE=gengrowth` 契约）
- codex 事实门 PASS —— W25 追溯扫描曾发现 15/31 篇有事实问题（杜撰来源、误引 Google 文档、
  无支撑统计），gengrowth 线的事实错是历史高发项，必须过门
- 发布后按 Supabase REST 源验证 `status=published`（不能只看渲染页：`blog.ts` 空数据会 fallback 到 MOCK）
