---
title: 候选与热点证据入口
type: output-folder
status: active
updated: 2026-07-20
owner: Pengman
---

# 候选与热点证据入口

本目录原为“每日选题与内容包”入口。自 2026-07-20 起，默认日常执行改为读取当前周计划，不再每天从零生成 Route A/B/C 或四账号生产组合。

## 当前用途

只在以下情况新增文件：

- 周一建立周计划所需的候选研究和证据预检。
- 达到处理区间的 Hot 候选、公开来源、10 分制评分和插入建议。
- Pengman 明确要求临时重排、补库或重新生成候选。

历史“每日选题池/内容包”保留为证据，不批量删除，也不作为新建范式。

## 使用边界

- 当前执行优先读 [[inbox-pengman/04-production/03-weekly-content-plans/README]] 和当前周计划。
- 候选出现在本目录不代表 `selected`。
- AI 不得擅自把 Idea 提升到 `selected`，也不得增加超出周度产能的新任务。
- Pengman 确认选中并纳入未来两周产能后，才在 `07-content-production` 建独立 `content_id` 和主生产记录。
- 本目录不维护 `content_stage`、最终稿、成片、发布链接或复盘结论。
- Hot 评分、替换和顺延按 [[inbox-pengman/04-production/00-evergreen-workflows/weekly-rolling-content-production-sop#7-热点评分与插入]]。

## 新文件建议类型

| 场景 | 建议 `type` | 内容 |
|---|---|---|
| 周一候选研究 | `weekly-candidate-research` | 候选、账号匹配、证据、去重、成本和建议 Pool |
| Hot 评估 | `hot-candidate-assessment` | 来源、评分、时效窗口、建议账号和插入影响 |
| 明确临时重排 | `replan-candidate-note` | 取消原因、释放产能、替代候选和 Pengman 确认 |

## AI 最小读取路径

1. 先读当前周计划和 Weekly Rolling SOP。
2. 仅在允许新增候选的场景读取本 README。
3. 去重时读取最近 7–14 天相关文件和周报，不扫描全部单条生产记录。
4. 一旦 Pengman 确认选中，停止在本目录扩写，转到 `07-content-production`。

## 当前历史输出

- [[inbox-pengman/02-调研资料/候选与热点研究/历史日级候选/2026-07-17 每日选题池.md]] — 历史综合候选池；日期需复核。
- [[inbox-pengman/02-调研资料/候选与热点研究/历史日级候选/2026-07-16 世界杯决赛图文选题池.md]] — 历史指定热点候选池。
- 其余日级文件继续保留；早期含脚本的混合格式不再复制。

历史过程稿见 [[inbox-pengman/02-调研资料/候选与热点研究/历史日级候选/已合并旧稿/README]]。GSC 当前暂停，不作为输入。
