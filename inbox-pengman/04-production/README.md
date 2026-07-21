---
title: 内容生产工作区入口
project: astrologywiki
type: workspace-index
status: active
owner: Pengman
updated: 2026-07-20
---

# 内容生产工作区入口

`04-production` 承载 AstrologyWiki 站外内容的滚动周计划、单条生产、发布复盘、生产模板和已验证 SOP。

当前默认机制：

```text
本周发布上周库存
→ 本周生产下周内容
→ 周一锁定产能/选题/排期/Batch
→ 周二至周四批量生产
→ 周五排期/库存/复盘
→ 每日只执行计划并有限检查热点
```

## 五个主入口

| 要做的事 | 先读 | 说明 |
|---|---|---|
| 建立/执行周度计划 | [[inbox-pengman/04-production/04-weekly-content-plans/README]] | 区分 `Publishing This Week` 与 `Producing for Next Week`，维护产能、Batch、内容池和热点槽 |
| 临时候选 / Hot 证据 | [[inbox-pengman/04-production/06-daily-content-recommendations/README]] | 仅保存周一候选研究、合格 Hot 或明确临时重排；不再是每日默认起点 |
| 单条内容生产 | [[inbox-pengman/04-production/07-content-production/README]] | 独立 `content_id`、Brief、脚本、素材、真实 `content_stage` 和发布回链 |
| 发布与复盘 | [[inbox-pengman/04-production/05-weekly-published-content-digests/README]] | 发布链接、公开数据和最终 `decision / next_test` 的周级事实来源 |
| 生产 SOP / 模板 | [[inbox-pengman/04-production/00-evergreen-workflows/README]] | 滚动周、日执行、Brief、路由、人工润色和制作流程 |

## Pengman 日常最简操作

周一：

1. `按滚动周 SOP 建立本周计划，我这周有 X 小时。`
2. `确认 Publishing This Week；为 Producing for Next Week 锁定选题和 Batch。`

周二至周五：

1. `读取本周计划，给我今天的执行卡。`
2. `按执行卡推进；只在热点达到门槛时建议插入。`
3. `结束后回写实际阶段、库存、阻塞和发布链接。`

AI 不每天重新生成四账号选题，不擅自把 Idea 提升到 `selected`，也不增加超出周度产能的新任务。四个账号当天可以发布、推进、等待或跳过。

> GSC 自 2026-07-16 起暂停。AI 不读取或索取 GSC，也不因缺少 GSC 阻塞计划、Brief 或制作。

工作区级背景先看 [[inbox-pengman/02-conversation report/current-context]]。`03-topic-ideas` 已退役，不再作为人工或 AI 的读取入口。

## AI 最小读取路径

| 任务 | 最小文件集合 | 只有何时才扩读 |
|---|---|---|
| 周一建立周计划 | 本 README + [[inbox-pengman/04-production/00-evergreen-workflows/weekly-rolling-content-production-sop]] + 周计划模板 + 最近周报 + `07` 当前队列 + 四账号 Playbook | 需要候选证据时读 `06`、公开文章/工具、在线竞品表被选中的行和当前热点来源 |
| 查看今天做什么 | 当前周计划 + [[inbox-pengman/04-production/00-evergreen-workflows/daily-content-assistant-sop]] + 今天涉及的主生产记录 | 只有 Hot 评估或时效核验才查公开来源 |
| 生成新候选 | 仅限周一、明确重排、确认补库或合格 Hot；读取 Social Daily Skill + Daily SOP + 最近周报/候选去重 | Route B/Hot 才做当前公开研究；不默认读本地旧快照 |
| 建立单条 Brief | 当前周计划已选行 + [[inbox-pengman/04-production/07-content-production/README]] + [[inbox-pengman/04-production/00-evergreen-workflows/统一内容 Brief 模板]] | 建立主记录后，后续状态只在该记录维护 |
| 路由账号与形式 | [[inbox-pengman/04-production/00-evergreen-workflows/内容路由与规则调用说明]] + 四账号 Playbook | 只有追溯策略依据时读平台调研 |
| 双模型/人工润色 | 主生产记录 + Brief 模板 + [[inbox-pengman/04-production/00-evergreen-workflows/Pengman 与 AI 内容润色协作说明]] + [[inbox-pengman/04-production/00-evergreen-workflows/内容生产与学习记录模板]] | 用户要求比较候选时才读实验附件 |
| 制作短视频/图文 | 已确认主生产记录 + 对应制作 SOP + 当前 `batch_id` | 需要验证工具选择时才读工具调研 |
| 发布和复盘 | 主生产记录 + 当前周计划 + 当前周报 | 需要阶段趋势时读历史周报或数据分析 |

## 唯一事实来源

| 信息 | 唯一或主要来源 | 其他文件边界 |
|---|---|---|
| 周度产能、两个周次清单、内容池、Batch、热点槽 | 当前周计划；默认规则来自 Weekly Rolling SOP | 日执行卡只显示和回写进度，不另建计划 |
| 当前内容阶段、最终确认稿、制作记录 | `07-content-production` 单条主生产记录 | 周计划显示阶段但不是第二状态源 |
| 发布链接、周级数据、最终 `decision / next_test` | 对应 weekly digest | 主生产记录保存本条直链并回链周报 |
| 账号定位与形式路由 | 四账号 TikTok Playbook | 周计划和 Brief 只记录本次选择 |
| 公共表达、品牌安全、CTA | Social Daily Skill | 其他 SOP 只链接或记录例外 |
| 双模型实验、人工反馈、L1–L5 | Pengman 与 AI 内容润色协作说明 | 模板只定义记录结构 |
| 竞品账号与视频数据 | 在线 Google Sheet | 本地研究文件只保存已选背景；旧快照不参与新判断 |

`status` 只服务仓库 dispatch；内容真实进度只使用 `content_stage`。新生命周期与旧阶段映射见 Weekly Rolling SOP。缺少 `content_stage` 的旧稿一律状态待确认，不从 `status` 或日期推断。

## 默认不扫描

除非任务明确要求追溯或迁移，AI 默认不读取：

- `05-调研资料/` 全目录；
- `06-daily-content-recommendations/已合并旧稿/`；
- `07-content-production/已合并旧稿/`；
- 已关闭周报和早期数据分析；
- 双模型候选、共享 Prompt 等附件。

迁出的 [[inbox-pengman/05-调研资料/历史流程/astrologywiki-social-content-workflow]] 是历史背景，不是当前执行规则。当前口径以本 README、Weekly Rolling SOP、当前周计划、单条主记录和对应周报为准。
