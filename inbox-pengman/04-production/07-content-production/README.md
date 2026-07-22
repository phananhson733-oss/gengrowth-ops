---
title: 单条内容生产入口
project: astrologywiki
type: production-index
status: active
owner: Pengman
updated: 2026-07-21
---

# 单条内容生产入口

这里承接“已经进入周度产能、准备真正制作的一条内容”。单条 Brief、最终脚本、视觉方案、真实状态、实验附件和发布回链都放在这里。周度组合与 Batch 先看 [[inbox-pengman/04-production/04-weekly-content-plans/README]]；日级候选/热点证据仍留在 [[inbox-pengman/04-production/06-daily-content-recommendations/README]]。

## 当前队列

> 本索引现有条目是迁移前快照。下一个周一按 [[inbox-pengman/04-production/00-evergreen-workflows/weekly-rolling-content-production-sop#10-旧内容迁移与首周启动]] 核对主记录后，才把真实 WIP 纳入 `Publishing This Week` 或 `Producing for Next Week`。不要根据文件名日期或 `status` 自动推进。

### 当前行动项

| 主生产记录 | 当前记录状态 | 下一步 |
|---|---|---|
| [[inbox-pengman/04-production/07-content-production/2026-07-21 Scorpio Questions AI口播 内容生产记录.md]] | `content_stage: brief`；W30 AI Host Script Batch | Hook方向已确认；下一步写完整脚本，确认后进入 `scripted` |
| [[inbox-pengman/04-production/07-content-production/2026-07-21 Cancer Sun Forgiveness AI口播 内容生产记录.md]] | `content_stage: brief`；W30 Cancer Sun 对照 | 方向已确认；Scorpio 完整脚本后再展开本条脚本 |
| [[inbox-pengman/04-production/07-content-production/2026-07-17 Grand Alignment 视频制作方案.md]] | `content_stage: published`；周报 W29 | 真实直链已核对；补 `decision / next_test` 后才能进入 `reviewed` |

### 状态待确认

- [[inbox-pengman/04-production/07-content-production/2026-07-14 France vs Spain Astrology Slideshow 制作方案.md]] — `content_stage: hold`；旧记录称已发布但无真实直链，补链后才可改为 `published`。
- [[inbox-pengman/04-production/07-content-production/2026-07-17 Scorpio Psychology AI口播 内容生产记录.md]] — `content_stage: hold`；有旧发布声明但直链待补，暂不视为已验证 `published`。
- [[inbox-pengman/04-production/07-content-production/2026-07-17 Scorpio Psychology AI口播 第二条 内容生产记录.md]] — `content_stage: hold`；有旧发布声明但直链和精确时间待补，暂不视为已验证 `published`。
- [[inbox-pengman/04-production/07-content-production/2026-07-09 Venus enters Virgo 内容包.md]] — 早期单条完整内容包；核对是否仍会在未来两周推进，再决定 `selected / hold / idea`。
- [[inbox-pengman/04-production/07-content-production/2026-07-03 AI Host 视频内容包.md]] — 早期单条完整内容包；核对是否仍会在未来两周推进，再决定 `selected / hold / idea`。
- 其余未在当前行动项或已发布列表中的早期制作方案，默认按历史／状态待确认处理，不自动推进。

### 已发布，等待周报闭环

- [[inbox-pengman/04-production/07-content-production/2026-07-20 Scorpio Psychology AI口播 第三条 内容生产记录.md]] — `content_stage: published`，周报 W30；公开直链和后台指标已补。
- [[inbox-pengman/04-production/07-content-production/2026-07-20 Spain 世界杯夺冠庆祝帖 内容生产记录.md]] — `content_stage: published`，周报 W30；真实直链已补，发布形式待后台确认。
- [[inbox-pengman/04-production/07-content-production/2026-07-17 Grand Alignment 视频制作方案.md]] — `content_stage: published`，周报 W29；真实直链已补。
- [[inbox-pengman/04-production/07-content-production/2026-07-16 Messi × Yamal World Cup Final 内容生产记录.md]] — `content_stage: published`，周报 W29；真实直链已补。
- [[inbox-pengman/04-production/07-content-production/2026-07-16 Moon Sign Toxic Traits 第4集 内容生产记录.md]] — `content_stage: published`，周报 W29；真实直链已补。
- [[inbox-pengman/04-production/07-content-production/2026-07-14 Earth Moon Toxic Traits 视频制作方案.md]] — `content_stage: published`，周报 W29。
- [[inbox-pengman/04-production/07-content-production/2026-07-13 Cancer New Moon 视频制作方案.md]] — `content_stage: published`，周报 W29。
- [[inbox-pengman/04-production/07-content-production/2026-07-10 Fire Moon Toxic Traits 视频制作方案.md]] — `content_stage: published`，周归属待确认。
- [[inbox-pengman/04-production/07-content-production/2026-07-09 Moon Sign Toxic Traits 视频制作方案.md]] — `content_stage: published`，周报 W28。

发布链接、周级数据和最终 `decision / next_test` 仍以 [[inbox-pengman/04-production/05-weekly-published-content-digests/README]] 为事实来源。

## 两个周次的队列边界

- `Publishing This Week`：本周要发布的 `scheduled` 内容，或本周明确启用的 `edited + inventory_ready: true` 库存。
- `Producing for Next Week`：本周进入产能、主要为下周生产的 `selected` 至 `edited` 内容。
- 两个清单在当前周计划维护；主记录只维护本条真实字段。
- 没有本周发布日期、也未进入未来两周产能的脚本放 `idea` 或 `hold`，不占当前队列。

## WIP 与完成定义

唯一生命周期：

```text
idea → selected → brief → scripted → assets_ready → producing → edited → scheduled → published → reviewed
```

补充：`hold / cancelled`。每一阶段的完整定义以 [[inbox-pengman/04-production/00-evergreen-workflows/weekly-rolling-content-production-sop#8-生命周期完成定义和-wip]] 为唯一来源。

强制限制：

- `producing` 同时最多 3 条。
- `selected` 不得超过未来两周可执行产能。
- `edited` 后 48 小时内必须进入 `scheduled`、返工或标记 `inventory_ready: true` 转为发布级库存。
- 没有核实的 `published_url` 不得标记 `published`。
- 没有填写 `decision` 和 `next_test` 不得标记 `reviewed`。
- 每增加 1 条 L，原则上从同周计划减少约 2 条 S，并记录被释放内容。
- Idea 可以较多，但不能因出现在候选池或日报中自动升级为 `selected`。

## 主记录与附件规则

- 一条独立发布内容只允许一份主生产记录；`content_id`、最终确认稿、真实 `content_stage`、制作选择和发布回链只写在主记录。
- 同一母题用于多个账号时，每个可独立发布的账号版本分别建 `content_id` 和主记录。
- 共享 Prompt、Claude/GPT 候选和素材清单是附件，不维护第二套总体状态。
- 默认只读主生产记录；只有比较候选或复核实验时才读附件。
- 一条内容出现 3 个以上附件时才建立主题子目录，避免机械建文件夹。

当前 Messi × Yamal 主记录：[[inbox-pengman/04-production/07-content-production/2026-07-16 Messi × Yamal World Cup Final 内容生产记录]]。

默认不读的实验附件：

- [[inbox-pengman/04-production/07-content-production/2026-07-16 Messi × Yamal World Cup Final 双模型实验 Prompt.md]]
- [[inbox-pengman/04-production/07-content-production/2026-07-16 Messi × Yamal World Cup Final Claude Candidate.md]]
- [[inbox-pengman/04-production/07-content-production/2026-07-16 Messi × Yamal World Cup Final GPT Candidate.md]]

## 旧内容迁移

- 不批量改写所有历史文件；只迁移当前 WIP 和重新进入未来两周产能的内容。
- 旧中文阶段、`content_format`、`published_urls` 等字段按周度 SOP 的映射处理。
- 缺 `pool`：人工判断 `Evergreen / Predictable / Hot`；不确定写“待确认”。
- 缺 `batch_id`：只给仍会推进的当前内容分配；已发布历史不补。
- 缺 `expiry_date`：Predictable/Hot 在重新排期前必须补；Evergreen 可留空或填复查日。
- 已写好脚本但暂时不制作：`hold` 或 `idea`，保留脚本，不占 `selected` 产能。
- README 只做索引；与主生产记录冲突时，以主记录为准并修正 README。

已合并的生产过程稿见 [[inbox-pengman/04-production/07-content-production/已合并旧稿/README]]，AI 默认不扫描。
