---
title: 内容生产工作区入口
project: astrologywiki
type: workspace-index
status: active
owner: Pengman
updated: 2026-08-04
---

# 内容生产工作区入口

这是 AstrologyWiki 社媒内容生产的**唯一人工入口页**。它只回答“从哪里开始、下一步去哪看”，不复制周计划、单条状态或 SOP 细节。

## 先回答三个问题

| 你想知道什么 | 打开哪里 | 以什么为准 |
|---|---|---|
| 本周计划做什么 | [[inbox-pengman/04-production/03-weekly-content-plans/README|周度内容计划入口]] → 当前 `YYYY-Www` 文件 | 当前周的目标、产能、排期和例外 |
| 某条内容实际到哪一步 | [[inbox-pengman/04-production/07-content-production/README|单条主生产记录入口]] → 对应 `content_id` | 该记录的 `content_stage`、最终稿和发布证据 |
| 具体任务怎么做 | [[inbox-pengman/04-production/00-evergreen-workflows/README|可复用流程索引]] | 只读当前任务对应的一份 SOP |

不要先读历史聊天，也不要从文件名、日期或 `status` 推断进度。

> 如果你是第一次接手、临时替班或不知道选题—生产—发布的完整顺序，先读 [[inbox-pengman/04-production/00-evergreen-workflows/社媒内容生产接手指南|社媒内容生产接手指南]]。

## 一条内容的主流程

```text
周一确认产能和候选
→ 进入当前周计划并建立单条主记录（selected）
→ 在 selected 内完成 Brief、证据、脚本确认和素材准备
→ 开始生成、剪辑或组装（producing）
→ 成片与基础质检完成（ready；用 scheduled_at 区分已定时，用 inventory_ready 区分库存）
→ 取得真实链接后确认发布（published）
→ 周报写 decision / next_test（仍保持 published）
```

默认周节奏由 [[04-production/00-evergreen-workflows/weekly-rolling-content-production-sop|Weekly Rolling Content Production SOP]] 维护：本周发布上周库存，本周生产下周内容。恢复周或热点插入等例外只在对应周计划记录，不能自动变成长期规则。

## 人与 AI 的分工

| 角色 | 主要责任 |
|---|---|
| Pengman | 确认方向、品牌判断、脚本、制作投入、付费和发布 |
| 总控军师（当前 GPT-5.6） | 读取权威来源、核验证据、去重、冻结方向、审稿、指出冲突并写回主记录 |
| Perplexity / Gemini | 按任务做外部调研和来源补充；输出是证据输入，不直接决定内容 |
| Claude | 依据冻结后的交接包生成脚本候选；不自行改方向或补事实 |

当前可复用的“Perplexity / Gemini 调研 → 总控军师审证并冻结方向 → Claude 写稿 → 总控军师审稿 → Pengman 确认”流程，见 [[inbox-pengman/04-production/00-evergreen-workflows/Pengman 与 AI 内容润色协作说明#调研驱动的单稿流程]]。

## 按任务下钻

| 场景 | 只需再读 |
|---|---|
| 第一次接手或星期中途替班 | [[inbox-pengman/04-production/00-evergreen-workflows/社媒内容生产接手指南|社媒内容生产接手指南]] |
| 判断账号、账号启停或未来新账号 | [[inbox-pengman/04-production/01-strategy-and-platform-research/AstrologyWiki 社媒账号定位与内容路由 Playbook|账号定位与内容路由 Playbook]]；当前只启用官号与 Miraa |
| 建立周计划、查容量或 Hot 插入 | Weekly Rolling SOP + 当前周计划 + 最近周报 |
| 新候选研究 | [[inbox-pengman/04-production/00-evergreen-workflows/astrologywiki-social-workflow/SKILL|AstrologyWiki Social Workflow]]；仅在权限门允许时执行 |
| AI 调研、写稿与人工确认 | [[inbox-pengman/04-production/00-evergreen-workflows/Pengman 与 AI 内容润色协作说明|Pengman 与 AI 内容协作说明]] |
| AI Host / 短视频制作 | [[inbox-pengman/04-production/00-evergreen-workflows/ai-short-video-production-workflow|AI Short Video Production Workflow]] |
| 图文 / Carousel 制作 | [[inbox-pengman/04-production/00-evergreen-workflows/instagram-image-content-workflow|Instagram Image Content Workflow]] |
| 发布数据和复盘 | [[inbox-pengman/04-production/05-weekly-digests/README|每周已发布内容合集入口]] + `07-reports/` 对应周报 |
| 当前自动化证据 | [[inbox-pengman/04-production/00-evergreen-workflows/tiktok-public-capture/README|TikTok Public Capture]]；其他工具按“文档 / 试验 / 部署 / 运行证据”区分 |

## 文件位置

| 内容 | 当前目录 | 不再使用的旧入口 |
|---|---|---|
| 周计划 | `03-weekly-content-plans/` | `04-weekly-content-plans/` |
| 候选与 Hot 证据 | `02-daily-content-recommendations/` | `06-daily-content-recommendations/` |
| 单条主记录 | `07-content-production/未发布/` 与 `07-content-production/已发布/` | `04-content-production/` 仅保留历史记录 |
| 发布合集 | `05-weekly-digests/` | `05-weekly-published-content-digests/` |

## 不需要做的事

- 不必从头读完所有 SOP 才能开始。
- 不每天从零为所有历史账号生成候选；当前只执行 `@miraaastrology` 与 `@astrologywiki` 的既定计划。
- 不在 README、周计划和主记录中维护三份状态。
- 不把研究工具的输出直接当作最终事实或脚本方向。
- 不把存在 README、脚本或试验记录的工具说成正在稳定运行。
