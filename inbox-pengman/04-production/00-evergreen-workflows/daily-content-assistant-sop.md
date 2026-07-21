---
title: Daily Content Assistant SOP
project: astrologywiki
type: workflow
status: active
updated: 2026-07-20
owner: Pengman
---

# Daily Content Assistant SOP

> 本 SOP 是 [[inbox-pengman/04-production/00-evergreen-workflows/weekly-rolling-content-production-sop]] 的日常执行层。它不再默认每天从零生成四账号选题，也不能覆盖周一锁定的产能、排期和 Batch。

## 1. Purpose

Daily Content Assistant 每个工作日负责回答：

1. 当前周计划今天要求推进什么。
2. 本周已排期内容今天要发布什么。
3. 哪些单条内容即将过期、阻塞或超过 WIP 限制。
4. 发布级库存是否低于最低线。
5. 有无达到门槛、值得插入的 Hot 内容。
6. 今天结束时哪些真实进度和发布链接需要回写。

默认工作方式：

```text
读取当前周计划
→ 核对单条主记录真实 content_stage
→ 给出今日执行卡
→ 有限热点检查
→ 只推进既定内容或合格 Hot
→ 回写真实进度和发布链接
```

以下旧行为已废弃：

- 每天从零生成 Route A/B/C 全量候选。
- 每天为四个账号创建新的生产组合。
- 没有合格热点时重新推翻周一选题。
- AI 擅自把 Idea 提升到 `selected`，或增加超出本周产能的新任务。

## 2. Authority and Boundaries

- 周度产能、两个周次清单、内容池、Batch、热点评分和插入规则：[[inbox-pengman/04-production/00-evergreen-workflows/weekly-rolling-content-production-sop]]。
- 当前周计划：`inbox-pengman/04-production/04-weekly-content-plans/` 中当前周文件。
- 账号定位与形式：[[inbox-pengman/04-production/01-strategy-and-platform-research/four-account-tiktok-content-playbook]]。
- 单条生命周期、最终稿、制作记录和发布回链：[[inbox-pengman/04-production/07-content-production/README]] 中对应主生产记录。
- 发布链接、周级数据和 `decision / next_test`：对应 weekly digest。
- 公共表达、品牌安全和 CTA：[[inbox-pengman/04-production/00-evergreen-workflows/astrologywiki-social-daily/SKILL#Copy Style]]。

`content_stage` 只在单条主生产记录维护。周计划和日级执行卡可以显示阶段，但不得形成第二套状态事实。

## 3. Required Inputs

每天按顺序读取：

1. 当前周计划；没有当前周计划时，先报告“周计划缺失”，按首周启动规则建立/补齐，不生成常规日级选题池。
2. 今天涉及的单条主生产记录。
3. 当前 `07-content-production/README` 队列和 WIP。
4. 最近周报中与今天内容相关的 `decision / next_test`。
5. 仅在评估 Hot、核验当天时效事实或用户明确要求重新规划时读取当前公开来源。

GSC 自 2026-07-16 起暂停，不读取、不索取，也不因缺少 GSC 阻塞执行。

## 4. Daily Execution Rules

### 4.1 先执行周计划

- 优先推进 `Publishing This Week` 的当天发布动作和 `Producing for Next Week` 的当天 Batch。
- 对四个账号分别报告：今天发布、今天推进、等待或跳过。跳过是正常状态，不生成新内容填满账号。
- 不擅自改变账号、Pool、形式、发布日期和 Batch；如需改变，标记为“建议变更”，等待 Pengman 确认。
- 不擅自把周计划之外的 Idea 变为 `selected`。
- 不擅自增加超过本周 S/M/L 产能的新任务。

### 4.2 检查即将过期或阻塞

每天检查：

- `deadline` 在 48 小时内但阶段仍低于 `scripted` 的内容。
- Predictable/Hot 的 `expiry_date` 在 48 小时内的内容。
- `producing` 是否超过 3 条。
- `edited` 是否已超过 48 小时但没有进入 `scheduled`、返工或发布级库存。
- `hold` 是否到达复查日期。
- 本周待发布内容是否缺 Caption、封面、时间或最终质检。

发生风险时，先建议释放产能、降级、返工、替换或取消，不默认增加新任务。

### 4.3 检查发布级库存

按周度 SOP 集中配置检查：

- ①／②／③ 是否各至少有 2 条非时效发布级库存。
- ④ 是否至少有 3 条。
- 已剪辑成片是否超过未来两周上限。

库存不足时，只把“补库存”加入下一次周一计划或使用本周明确剩余产能；不得当天擅自新增 Selected。库存过多时停止继续剪 Evergreen 成片，优先消化或只保留 Idea/脚本。

### 4.4 有限热点检查

- 上午一次 15 分钟，下午一次不超过 10 分钟的复查。
- 只收集能说明当前热度、事实来源、账号匹配和时效窗口的候选。
- 使用周度 SOP 的 10 分制评分。
- `8–10` 分：建议立即进入热点槽。
- `6–7` 分：建议当天稍后或次日处理。
- `4–5` 分：保持 `idea`，放入下周候选。
- `0–3` 分：放弃。
- 没有合格 Hot 时，明确写“保持周一计划”，不生成替代候选池。

只有在评估 Hot、用户明确要求周一选题/重新规划，或需要核验时效事实时，才执行相应公开来源检查。普通日常推进不要求重新完成旧版 Route A/B/C Evidence Preflight。

### 4.5 Hot 插入

Hot 达到门槛后，严格按周度 SOP：

1. 使用预留热点槽。
2. 必要时只替换同账号最低优先级 Evergreen。
3. 被替换内容只顺延一次。
4. 第二次被挤出后退回池重新评估。
5. 不顺延即将过期的 Predictable。
6. 不连锁改动其他账号。

Daily Assistant 只给出评分、推荐动作和受影响 `content_id`；把 Idea 提升到 `selected` 或改变排期前必须获得 Pengman 确认。

## 5. When New Topic Research Is Allowed

只有以下情况允许生成新候选：

- 周一执行周度计划。
- Pengman 明确要求重新规划本周/下周。
- 发布级库存出现已确认缺口，且 Pengman确认使用剩余产能补库。
- 有评分达到处理门槛的 Hot。
- 某条内容取消后，Pengman确认需要在同一产能内替换。

生成新候选时仍需：

- 检查最近 7–14 天发布去重。
- 读取相关 `decision / next_test`。
- 对时效、明星、体育、影视和天象事实进行当前核验。
- 使用公开 AstrologyWiki 页面/工具和已批准优先级；不推断未提供的搜索表现。
- 保留四账号 Playbook 与 Social Daily Skill 的表达/品牌边界。

热点或正式周一候选研究的证据记录应包含：本地文件、当前公开来源、关键链接、不可用输入和待确认事实。普通日常执行卡不需要为既定内容重复制作证据报告。

## 6. Daily Output

### 今日执行卡

| 时间/顺序 | content_id | 账号 | Publishing / Producing | 今日动作 | batch_id | 当前阶段 | 今日目标阶段 | deadline/expiry | 风险 |
|---|---|---|---|---|---|---|---|---|---|
|  |  |  | Publishing This Week / Producing for Next Week |  |  |  |  |  |  |

- 今日可用时间：
- 今日总工作量：
- `producing` 当前数量：
- 今日明确不做：

### 四账号状态

- ① AstrologyWiki 官方：发布 / 推进 / 等待 / 跳过
- ② AI 占星师：发布 / 推进 / 等待 / 跳过
- ③ 热点占星测试：发布 / 推进 / 热点槽空置 / 跳过
- ④ 普通占星爱好者：发布 / 推进 / 等待 / 跳过

### 阻塞与库存

- 48 小时内 deadline/expiry：
- `edited` 超时项：
- 库存低于最低线：
- 成片超过两周上限：
- 需要 Pengman 确认的变更：

### 热点检查

- 检查时段：
- 候选与来源：
- 评分：
- 结论：插入 / 稍后处理 / 下周候选 / 放弃 / 无合格热点
- 若插入，影响的 `content_id`：

### End-of-Day Update

- 实际完成：
- 主记录 `content_stage` 更新：
- 周计划进度更新：
- 实际发布链接：
- 未完成及原因：
- 明日第一个动作：

## 7. End-of-Day Writeback

每天结束时：

1. 在单条主生产记录更新真实 `content_stage`、脚本/素材/制作信息和核实的 `published_url`。
2. 在当前周计划更新任务完成情况、Batch、库存和阻塞；不复制最终稿。
3. 发布后把直链补到对应周报；周级数据仍以周报为事实来源。
4. 未完成内容保留真实阶段，写明原因；不得为了“完成日报”提前升级状态。
5. `reviewed` 只在 `decision` 和 `next_test` 均完成后使用。

## 8. Legacy Daily Folder

`06-daily-content-recommendations/` 中已有 Route A/B/C 每日选题池保留为历史证据，不批量删除。新文件只用于：

- 周一候选研究的证据附件；
- 合格 Hot 的候选、来源和评分；
- 用户明确要求的临时重新规划。

它不再是每日默认起点，也不维护 `content_stage`、最终稿或发布状态。
