---
title: 2026-07-27 v2 内容生产恢复队列
date: 2026-07-27
updated: 2026-07-27
type: plan
version: v1.1
status: completed
owner: wzb
tags:
  - astrologywiki
  - content-production
  - v2
  - recovery
  - kpop
  - fictional-characters
  - pop-music
aliases:
  - 7月27日内容恢复队列
  - v2 content recovery queue
---

# 2026-07-27 v2 内容生产恢复队列

> **目标**：在 2026-07-27 恢复 AstrologyWiki v2 内容产线，严格控制为 10 篇，并先补齐会阻断今日 Spoke 内链的 Pillar 页面。

## 排期修正依据

- 原 v2 执行表的 7/23 以后没有发布记录或 autopilot claim；不能将漏发的前置 Pillar 当作已上线。
- `Scorpio MBTI Type` 已于 2026-07-22 以 `/en/wiki/scorpio-mbti-type` 上线，因此不重复生产。
- 今日计划的 BTS、BLACKPINK 与 Harry Potter Spoke 必须分别在已发布的 `bts-members-zodiac-signs`、`blackpink-zodiac-signs` 与 `harry-potter-characters-zodiac-signs` Pillar 下生成；这三篇 Pillar 取代已发布的重复项及可安全顺延的 MBTI Series。
- 本文件使用日期前缀并位于 `06-tasks/tasks/`，作为自动化 `PLAN_GLOB_DIR` 的最新 AstrologyWiki 计划；旧 `2026-05-27-W22-blog-output-plan.md` 的历史未完成项不会抢占本批次。

## 2026-07-27（恢复批次，10 篇）

**状态**：`已完成并上线`（严格上限：10 篇；生产验收于 2026-07-27 完成）

### 阶段 A：先发布集群 Pillar

- [x] `PG-KB-001` BTS members zodiac signs
- [x] `PG-KB-013` BLACKPINK zodiac signs
- [x] `PG-FH-001` Harry Potter characters zodiac signs

### 阶段 B：今日主页面

- [x] `page_rihanna_birth_chart` Rihanna birth chart（原计划 ID：`PG-POP-001`）
- [x] `page_selena_gomez_birth_chart` Selena Gomez birth chart（原计划 ID：`PG-POP-002`）

### 阶段 C：Pillar 已上线后再发布 Spoke

- [x] `PG-KB-007` Suga BTS birth chart
- [x] `PG-KB-008` RM BTS birth chart
- [x] `PG-KB-020` Jisoo birth chart
- [x] `page_severus_snape_zodiac_sign` Severus Snape zodiac sign（原计划 ID：`PG-FH-002`）
- [x] `page_dumbledore_zodiac_sign` Dumbledore zodiac sign（原计划 ID：`PG-FH-003`）

### Page ID 对齐（2026-07-27）

恢复计划最初沿用了早期 `PG-POP-*` / `PG-FH-*` 编号；生产 Sheet 的权威 `page_id` 已迁移为下列规范值。执行、bridge、claim、发布日志和验收均以当前 Sheet ID 为准，括号内旧 ID 只保留作审计追溯，不能再传给生产脚本。

| 旧计划 ID | 当前 Sheet `page_id` | 关键词 |
| --- | --- | --- |
| `PG-POP-001` | `page_rihanna_birth_chart` | Rihanna birth chart |
| `PG-POP-002` | `page_selena_gomez_birth_chart` | Selena Gomez birth chart |
| `PG-FH-002` | `page_severus_snape_zodiac_sign` | Severus Snape zodiac sign |
| `PG-FH-003` | `page_dumbledore_zodiac_sign` | Dumbledore zodiac sign |

## 强制质量与时序约束

1. K-pop 出生数据只使用 `00-inbox/2026-07-21-内容生产执行表-v2.md` 的预置值：Suga（Min Yoongi，1993-03-09，Pisces）、RM（Kim Namjoon，1994-09-12，Virgo）、Jisoo（Kim Jisoo，1995-01-03，Capricorn）。不得自行补全或推断出生时间、月亮或上升。
2. Severus Snape 和 Dumbledore 均按本表的 `fiction_hp` 归属处理；没有官方生日且归属存在争议时，正文须保持“社区常见解读”的边界，不能编造确定生日。
3. 所有 K-pop / fictional Spoke 必须保留到所属 Pillar 的正文内链，并保留 `/en/birth-chart-calculator` CTA；Pillar 发布后由 Smart Backfill 补回已发布 Spoke。
4. Hero 在文本通过 Phase 2 后、进入发布门前生成。使用本机 `~/local-image-gen` 的 FLUX.1-schnell：16:9、4 steps、英文提示词、单一连续场景、无文字/数字/分屏/图表。不得使用未授权的艺人实拍肖像；K-pop 与流行音乐使用风格化编辑肖像，Harry Potter 使用角色化场景。
5. 本地 FLUX 出图或 Hero QA 失败不阻塞文字发布，但必须记录 `needs_hero`，后续按 slug 补图；不得以缺图为由跳过已通过文本和发布门的文章。

## 顺延项目

- `Virgo MBTI`、`Aquarius MBTI`：顺延至下一恢复批次；它们的全局 Pillar `zodiac-signs-as-mbti-types` 已上线，不会形成孤立页。
- `Beyoncé birth chart`、`INTJ zodiac sign`、`Jungkook birth chart`、Hermione/Draco 等 7/22–7/26 漏发项：在本批次完成后按“Pillar → Spoke → 关键词优先级”进入后续日计划，不与今日 10 篇上限混排。

## 验收

- [x] 10 个任务均能在选题登记表精确匹配，且 cluster_id、page_role、slug 与内链需求文档一致。
- [x] 每篇通过 author、Phase 2、预览门与事实审核；无 `needs_human` 未处理 park。
- [x] 10 篇均有生产 URL 与 publish log 记录；Pillar 在 24 小时内获得对应 Spoke 的 Smart Backfill。
- [x] 每篇有通过 Hero QA 的 16:9 本地 FLUX Hero，或有可追溯的 `needs_hero` 记录。

## 发布记录（2026-07-27）

生产域名：`https://www.astrologywiki.com`。最终部署：`dpl_5AQVEVvp79gdRRnD3VGXeTHqMK35`；生产 sitemap 为 461 条 URL。10 个页面均实测为 HTTP 200，具备正确的标题、canonical、`Article` JSON-LD 与 Birth Chart Calculator CTA。五个 Spoke 均已在正文中回链到其对应 Pillar。

| 阶段 | 页面 | 生产 URL |
| --- | --- | --- |
| A | BTS members zodiac signs | https://www.astrologywiki.com/en/wiki/bts-members-zodiac-signs |
| A | BLACKPINK zodiac signs | https://www.astrologywiki.com/en/wiki/blackpink-zodiac-signs |
| A | Harry Potter characters zodiac signs | https://www.astrologywiki.com/en/wiki/harry-potter-characters-zodiac-signs |
| B | Rihanna birth chart | https://www.astrologywiki.com/en/wiki/rihanna-birth-chart |
| B | Selena Gomez birth chart | https://www.astrologywiki.com/en/wiki/selena-gomez-birth-chart |
| C | Suga BTS birth chart | https://www.astrologywiki.com/en/wiki/suga-bts-birth-chart |
| C | RM BTS birth chart | https://www.astrologywiki.com/en/wiki/rm-bts-birth-chart |
| C | Jisoo birth chart | https://www.astrologywiki.com/en/wiki/jisoo-birth-chart |
| C | Severus Snape zodiac sign | https://www.astrologywiki.com/en/wiki/severus-snape-zodiac-sign |
| C | Dumbledore zodiac sign | https://www.astrologywiki.com/en/wiki/dumbledore-zodiac-sign |
