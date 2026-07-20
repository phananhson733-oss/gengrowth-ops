---
title: 单条内容生产入口
project: astrologywiki
type: production-index
status: active
owner: Pengman
updated: 2026-07-18
---

# 单条内容生产入口

这里承接“已经选中、准备真正制作的一条内容”。单条 Unified Brief、最终脚本、视觉方案、制作状态、实验附件和发布回链都放在这里；每日候选仍留在 [[inbox-pengman/04-production/06-daily-content-recommendations/README.md]]。

## 当前队列

### 制作中／待制作

| 主生产记录 | 当前状态 | 下一步 |
|---|---|---|
| [[inbox-pengman/04-production/07-content-production/2026-07-17 Grand Alignment 视频制作方案.md]] | `content_stage: 已发布`；周报 W29 | 继续刷新 24/48 小时公开数据，判断天象断言式 hook 的早期互动与站内承接 |

### 状态待确认

- [[inbox-pengman/04-production/07-content-production/2026-07-14 France vs Spain Astrology Slideshow 制作方案.md]] — `status: ready-to-produce`，缺 `content_stage`；先确认实际状态。
- [[inbox-pengman/04-production/07-content-production/2026-07-09 Venus enters Virgo 内容包.md]] — 早期单条完整内容包，包含脚本、视觉和发布设置；历史 `type` 保留，实际按生产资产管理。
- [[inbox-pengman/04-production/07-content-production/2026-07-03 AI Host 视频内容包.md]] — 早期单条完整内容包，包含最终脚本、素材和发布步骤；历史 `type` 保留，实际按生产资产管理。
- 其余未在当前队列或已发布列表中的早期制作方案，默认按历史／状态待确认处理，不自动推进。

### 已发布，等待周报闭环

- [[inbox-pengman/04-production/07-content-production/2026-07-17 Scorpio Psychology AI口播 内容生产记录.md]] — `content_stage: 已发布`，周报 W29；发布链接和表现数据待补。
- [[inbox-pengman/04-production/07-content-production/2026-07-17 Scorpio Psychology AI口播 第二条 内容生产记录.md]] — `content_stage: 已发布`，周报 W29；精确发布时间、链接和表现数据待补。
- [[inbox-pengman/04-production/07-content-production/2026-07-17 Grand Alignment 视频制作方案.md]] — `content_stage: 已发布`，周报 W29；公开链接已补，继续观察 24/48 小时数据。
- [[inbox-pengman/04-production/07-content-production/2026-07-16 Messi × Yamal World Cup Final 内容生产记录.md]] — `content_stage: 已发布`，周报 W29。
- [[inbox-pengman/04-production/07-content-production/2026-07-16 Moon Sign Toxic Traits 第4集 内容生产记录.md]] — `content_stage: 已发布`，周报 W29。
- [[inbox-pengman/04-production/07-content-production/2026-07-14 Earth Moon Toxic Traits 视频制作方案.md]] — 已发布，周报 W29。
- [[inbox-pengman/04-production/07-content-production/2026-07-13 Cancer New Moon 视频制作方案.md]] — 已发布，周报 W29。
- [[inbox-pengman/04-production/07-content-production/2026-07-10 Fire Moon Toxic Traits 视频制作方案.md]] — 已发布，周归属待确认。
- [[inbox-pengman/04-production/07-content-production/2026-07-09 Moon Sign Toxic Traits 视频制作方案.md]] — 已发布，周报 W28。

发布链接、周级数据和 `decision / next_test` 仍以 [[inbox-pengman/04-production/05-weekly-published-content-digests/README.md]] 为事实来源。

## 主记录与附件规则

- 一条内容只允许一份主生产记录；`content_stage`、最终确认稿、制作选择和发布回链只写在主记录。
- 共享 Prompt、Claude/GPT 候选和素材清单是附件，不维护第二套总体状态。
- 默认只读主生产记录；只有比较候选或复核实验时才读附件。
- 一条内容出现 3 个以上附件时才建立主题子目录，避免为每条内容机械建文件夹。

当前 Messi × Yamal 主记录：[[inbox-pengman/04-production/07-content-production/2026-07-16 Messi × Yamal World Cup Final 内容生产记录.md]]。

默认不读的实验附件：

- [[inbox-pengman/04-production/07-content-production/2026-07-16 Messi × Yamal World Cup Final 双模型实验 Prompt.md]]
- [[inbox-pengman/04-production/07-content-production/2026-07-16 Messi × Yamal World Cup Final Claude Candidate.md]]
- [[inbox-pengman/04-production/07-content-production/2026-07-16 Messi × Yamal World Cup Final GPT Candidate.md]]

## 状态口径

- 仓库 `status` 服务 dispatch；内容真实进度统一写 `content_stage`。
- 内容阶段：`Brief` → `AI 初稿` → `等待人工润色` → `待制作` → `待发布` → `已发布` → `复盘中` → `已复盘`，也可用 `暂停`。
- 缺少 `content_stage` 的旧制作方案一律视为“状态待确认”，不得按文件日期自动判断。
- README 只做索引；与主生产记录冲突时，以主记录为准并修正 README。

已合并的生产过程稿见 [[inbox-pengman/04-production/07-content-production/已合并旧稿/README.md]]，AI 默认不扫描。
