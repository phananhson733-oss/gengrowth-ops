---
title: 内容生产工作区入口
project: astrologywiki
type: workspace-index
status: active
owner: Pengman
updated: 2026-07-16
---

# 内容生产工作区入口

`04-production` 的职责是承载 AstrologyWiki 站外内容的生产闭环：当前制作、待发布、发布与复盘、生产模板、已验证生产 SOP，以及当前生产直接使用的数据入口。

平台策略、工具调研、竞品研究和历史资料目前仍暂存在本目录，等待 [[inbox-pengman/08-requirements/04-production 瘦身迁移提案]] 确认后批量迁出。迁移前它们是按需查证资料，**不是 AI 默认读取入口**。

## 四个主入口

| 要做的事 | 先读 | 说明 |
|---|---|---|
| 当前制作 / 待发布 | [[inbox-pengman/04-production/06-daily-content-recommendations/README.md]] | 当前队列、主生产记录和状态入口 |
| 发布与复盘 | [[inbox-pengman/04-production/05-weekly-published-content-digests/README.md]] | 发布链接、公开数据、`decision / next_test` 的事实来源 |
| 生产 SOP / 模板 | [[inbox-pengman/04-production/00-evergreen-workflows/README.md]] | Brief、路由、人工润色、模型实验和制作流程 |
| 当前数据输入 | [[inbox-pengman/04-production/07-gsc-exports/README.md]] | GSC 原始导出入口；空目录不等于数据为 0 |

工作区级当前背景先看 [[inbox-pengman/02-conversation report/current-context.md]]；长期主题种子和历史单条选题看 [[inbox-pengman/03-topic-ideas/README.md]]。

## AI 最小读取路径

先读本 README，再按任务只打开对应集合；不要遍历整个 `04-production`。

| 任务 | 最小文件集合 | 只有何时才扩读 |
|---|---|---|
| 查看今天正在做什么 | 本 README + [[inbox-pengman/04-production/06-daily-content-recommendations/README.md]] + 被 README 标为当前的主生产记录 | 用户要求追溯候选、素材或旧版本时 |
| 生成每日候选 / Brief | [[inbox-pengman/04-production/00-evergreen-workflows/astrologywiki-social-daily/SKILL.md]] + [[inbox-pengman/04-production/00-evergreen-workflows/daily-content-assistant-sop.md]] + 最近周报 + 当前可用 GSC README/CSV | 需要竞品机制时读取在线竞品表中被选中的行；不默认读本地旧快照 |
| 路由账号与形式 | [[inbox-pengman/04-production/00-evergreen-workflows/内容路由与规则调用说明.md]] + [[inbox-pengman/04-production/01-strategy-and-platform-research/four-account-tiktok-content-playbook.md]] | 只有要追溯策略依据时读平台调研 |
| 启动双模型实验 / 人工润色 | 主生产记录 + [[inbox-pengman/04-production/00-evergreen-workflows/统一内容 Brief 模板.md]] + [[inbox-pengman/04-production/00-evergreen-workflows/Pengman 与 AI 内容润色协作说明.md]] + [[inbox-pengman/04-production/00-evergreen-workflows/内容生产与学习记录模板.md]] | 用户要求比较原始候选时才读候选附件 |
| 制作短视频 / 图文 | 已确认主生产记录 + 对应的 [[inbox-pengman/04-production/00-evergreen-workflows/ai-short-video-production-workflow.md]] 或 [[inbox-pengman/04-production/00-evergreen-workflows/instagram-image-content-workflow.md]] | 需要验证工具选择时才读工具调研 |
| 发布和复盘 | 主生产记录 + 当前周报 + [[inbox-pengman/04-production/05-weekly-published-content-digests/README.md]] | 需要阶段趋势时读历史周报或数据分析 |

## 唯一事实来源

| 信息 | 唯一或主要来源 | 其他文件的边界 |
|---|---|---|
| 当前内容状态、最终确认稿、制作记录 | 单条主生产记录 | 候选和 Prompt 只作过程证据 |
| 发布链接、周级数据、`decision / next_test` | 对应 weekly digest | 主生产记录只回链，不维护第二套周级数据 |
| 公共表达、品牌安全、CTA | Social Daily Skill | README、制作稿只链接或记录本条例外 |
| 账号定位与形式路由 | 四账号 TikTok Playbook | 单条 Brief 只记录本次选择 |
| 双模型实验、人工反馈、L1–L5 | Pengman 与 AI 内容润色协作说明 | Skill 只保留强制边界，模板只定义记录字段 |
| 竞品账号与视频数据 | 在线 Google Sheet | `03-reference-accounts/sheets-export/` 是停用旧快照，不参与生成 |
| GSC 指标 | 当前明确提供的原始导出 | Brief 只摘录实际使用行和日期范围 |

`status` 只服务仓库 dispatch；内容真实进度统一使用 `content_stage`。旧稿中只有 `status: ready-to-produce / awaiting-selection / consolidated` 而没有 `content_stage` 时，一律视为“状态待确认”，不得自动判断为当前任务。

## 默认不扫描

除非任务明确要求追溯、调研或迁移，AI 默认不读取：

- `01-strategy-and-platform-research/历史调研资料/`；
- `02-video-and-visual-tool-research/`；
- `03-reference-accounts/sheets-export/`；
- `04-text-and-social-tool-research/`；
- `06-daily-content-recommendations/已合并旧稿/`；
- 已关闭周报、早期数据分析和单次历史复盘；
- 双模型候选、共享 Prompt 等附件，除非主生产记录明确要求比较。

## 当前物理目录与迁移前口径

| 当前目录 | 当前口径 | 默认读取 |
|---|---|---:|
| [[inbox-pengman/04-production/00-evergreen-workflows/README.md]] | 当前生产 SOP 和模板 | 是，按任务读取 |
| [[inbox-pengman/04-production/01-strategy-and-platform-research/README.md]] | 策略调研；仅四账号 Playbook 直接参与生产 | 否 |
| [[inbox-pengman/04-production/02-video-and-visual-tool-research/README.md]] | 视频和视觉工具研究 | 否 |
| [[inbox-pengman/04-production/03-reference-accounts/README.md]] | 竞品研究索引；在线表为事实源 | 否 |
| [[inbox-pengman/04-production/04-text-and-social-tool-research/README.md]] | 文本与社媒工具研究 | 否 |
| [[inbox-pengman/04-production/05-weekly-published-content-digests/README.md]] | 发布与复盘 | 是，读取当前周或指定周 |
| [[inbox-pengman/04-production/06-daily-content-recommendations/README.md]] | 当前生产队列 | 是 |
| [[inbox-pengman/04-production/07-gsc-exports/README.md]] | 当前生产数据输入 | 有数据或任务需要时 |

根目录的 [[inbox-pengman/04-production/astrologywiki-social-content-workflow.md]] 是早期工作流和决策背景，不是当前执行规则；当前口径以本 README、`00-evergreen-workflows` 的唯一来源文件、单条主生产记录和对应周报为准。
