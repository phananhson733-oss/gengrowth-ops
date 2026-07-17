---
title: 内容生产工作区入口
project: astrologywiki
type: workspace-index
status: active
owner: Pengman
updated: 2026-07-17
---

# 内容生产工作区入口

`04-production` 的职责是承载 AstrologyWiki 站外内容的生产闭环：当前制作、待发布、发布与复盘、生产模板和已验证生产 SOP。

A、B 批次已将平台策略、工具研究、竞品研究、历史调研和旧流程迁到 [[inbox-pengman/05-调研资料/README.md]]；C1 又把每日候选与单条生产拆开。`04-production` 当前只保留生产 SOP、四账号路由、每日候选、单条生产和发布复盘。

## 四个主入口

| 要做的事 | 先读 | 说明 |
|---|---|---|
| 每日选题 / 内容包 | [[inbox-pengman/04-production/06-daily-content-recommendations/README.md]] | 只保存每日候选、推荐和日级内容包 |
| 单条内容生产 | [[inbox-pengman/04-production/07-content-production/README.md]] | Brief、脚本、制作方案、主生产记录和实验附件 |
| 发布与复盘 | [[inbox-pengman/04-production/05-weekly-published-content-digests/README.md]] | 发布链接、公开数据、`decision / next_test` 的事实来源 |
| 生产 SOP / 模板 | [[inbox-pengman/04-production/00-evergreen-workflows/README.md]] | Brief、路由、人工润色、模型实验和制作流程 |

## Pengman 日常最简操作

Pengman 不需要记住后台全部 SOP，日常只需三步：

1. `给我今天的多账号生产卡，我今天有 2 小时。`
2. `做 A1 和 C2，先做 C2。`
3. `A1 开头太慢，第二段保留，不要 CTA。`

AI 负责在后台完成证据检查、去重、账号路由、S/M/L 成本估算、快速/实验通道选择、历史稿学习、反馈结构化和状态回写。聊天中默认先展示一屏“今日生产卡”，完整证据留在对应日级文档中。

> GSC 输入自 2026-07-16 起暂停。AI 不读取或索取 GSC 文件，也不因缺少 GSC 阻塞候选、Brief 或制作；历史生产记录中的既有 GSC 证据不回写。

工作区级当前背景先看 [[inbox-pengman/02-conversation report/current-context.md]]。`03-topic-ideas` 已退役待清理，不再作为人工或 AI 的读取入口。

## AI 最小读取路径

先读本 README，再按任务只打开对应集合；不要遍历整个 `04-production`。

| 任务 | 最小文件集合 | 只有何时才扩读 |
|---|---|---|
| 查看今天正在做什么 | 本 README + [[inbox-pengman/04-production/07-content-production/README.md]] + 被 README 标为当前的主生产记录 | 用户要求追溯候选、素材或旧版本时 |
| 生成每日候选 | [[inbox-pengman/04-production/00-evergreen-workflows/astrologywiki-social-daily/SKILL.md]] + [[inbox-pengman/04-production/00-evergreen-workflows/daily-content-assistant-sop.md]] + [[inbox-pengman/04-production/06-daily-content-recommendations/README.md]] + 最近周报 | 需要站内承接时查公开文章/工具页；需要竞品机制时读取在线竞品表中被选中的行；不默认读本地旧快照 |
| 将已选题建立为 Brief | 被选中的日级文件 + [[inbox-pengman/04-production/07-content-production/README.md]] + 统一 Brief 模板 | 建立一份主生产记录后，后续状态只在该记录维护 |
| 路由账号与形式 | [[inbox-pengman/04-production/00-evergreen-workflows/内容路由与规则调用说明.md]] + [[inbox-pengman/04-production/01-strategy-and-platform-research/four-account-tiktok-content-playbook.md]] | 只有要追溯策略依据时读平台调研 |
| 启动双模型实验 / 人工润色 | 主生产记录 + [[inbox-pengman/04-production/00-evergreen-workflows/统一内容 Brief 模板.md]] + [[inbox-pengman/04-production/00-evergreen-workflows/Pengman 与 AI 内容润色协作说明.md]] + [[inbox-pengman/04-production/00-evergreen-workflows/内容生产与学习记录模板.md]] | 用户要求比较原始候选时才读候选附件 |
| 制作短视频 / 图文 | 已确认主生产记录 + 对应的 [[inbox-pengman/04-production/00-evergreen-workflows/ai-short-video-production-workflow.md]] 或 [[inbox-pengman/04-production/00-evergreen-workflows/instagram-image-content-workflow.md]] | 需要验证工具选择时才读工具调研 |
| 发布和复盘 | 主生产记录 + 当前周报 + [[inbox-pengman/04-production/05-weekly-published-content-digests/README.md]] | 需要阶段趋势时读历史周报或数据分析 |

## 唯一事实来源

| 信息 | 唯一或主要来源 | 其他文件的边界 |
|---|---|---|
| 每日候选方向 | 对应日期的每日选题池／内容包 | 不维护单条内容的制作阶段和发布状态 |
| 当前内容状态、最终确认稿、制作记录 | `07-content-production` 中的单条主生产记录 | 候选和 Prompt 只作过程证据 |
| 发布链接、周级数据、`decision / next_test` | 对应 weekly digest | 主生产记录只回链，不维护第二套周级数据 |
| 公共表达、品牌安全、CTA | Social Daily Skill | README、制作稿只链接或记录本条例外 |
| 账号定位与形式路由 | 四账号 TikTok Playbook | 单条 Brief 只记录本次选择 |
| 双模型实验、人工反馈、L1–L5 | Pengman 与 AI 内容润色协作说明 | Skill 只保留强制边界，模板只定义记录字段 |
| 竞品账号与视频数据 | 在线 Google Sheet | [[inbox-pengman/05-调研资料/竞品研究/README.md]] 只保存研究背景；`旧快照/2026-07-07/` 不参与生成 |

`status` 只服务仓库 dispatch；内容真实进度统一使用 `content_stage`。旧稿中只有 `status: ready-to-produce / awaiting-selection / consolidated` 而没有 `content_stage` 时，一律视为“状态待确认”，不得自动判断为当前任务。

## 默认不扫描

除非任务明确要求追溯、调研或迁移，AI 默认不读取：

- `05-调研资料/` 全部目录；
- `06-daily-content-recommendations/已合并旧稿/`；
- `07-content-production/已合并旧稿/`；
- 已关闭周报、早期数据分析和单次历史复盘；
- 双模型候选、共享 Prompt 等附件，除非主生产记录明确要求比较。

## 当前物理目录与口径

| 当前目录 | 当前口径 | 默认读取 |
|---|---|---:|
| [[inbox-pengman/04-production/00-evergreen-workflows/README.md]] | 当前生产 SOP 和模板 | 是，按任务读取 |
| [[inbox-pengman/04-production/01-strategy-and-platform-research/README.md]] | 四账号内容路由 Playbook | 路由任务时 |
| [[inbox-pengman/04-production/05-weekly-published-content-digests/README.md]] | 发布与复盘 | 是，读取当前周或指定周 |
| [[inbox-pengman/04-production/06-daily-content-recommendations/README.md]] | 每日选题池与内容包 | 生成候选或查当日来源时 |
| [[inbox-pengman/04-production/07-content-production/README.md]] | 单条内容生产与当前队列 | 是 |

迁出的 [[inbox-pengman/05-调研资料/历史流程/astrologywiki-social-content-workflow.md]] 是早期工作流和决策背景，不是当前执行规则；当前口径以本 README、`00-evergreen-workflows` 的唯一来源文件、单条主生产记录和对应周报为准。
