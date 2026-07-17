---
title: 当前内容生产入口
type: output-folder
status: active
updated: 2026-07-16
owner: Pengman
---

# 当前内容生产入口

这里是日常内容生产主入口。先看“当前队列”，再打开对应的**主生产记录**；不要按日期遍历整个目录。

`03-topic-ideas` 只保留长期主题种子、SEO 主题参考和历史单条归档，不再接收新的日更选题池或制作方案。GSC 当前暂停，不作为日更输入。

## 当前队列

以下状态依据文件中的 `content_stage` 或明确记录整理；没有 `content_stage` 的旧文件不会自动视为当前任务。

### 待发布

| 内容 | 当前状态 | 下一步 |
|---|---|---|
| [[inbox-pengman/04-production/06-daily-content-recommendations/2026-07-16 Messi × Yamal World Cup Final 内容生产记录.md]] | `content_stage: 待发布`；脚本已确认；计划 2026-07-16 08:00 PDT 发布到 `filestarsx` | 发布后回填 permalink，并写入 W29 周报 |

### 待选择 / 状态待确认

| 内容 | 当前状态 | 说明 |
|---|---|---|
| [[inbox-pengman/04-production/06-daily-content-recommendations/2026-07-16 世界杯决赛图文选题池.md]] | `status: awaiting-selection`，缺 `content_stage` | 仍需 Pengman 选择；不要直接生成正式稿 |
| [[inbox-pengman/04-production/06-daily-content-recommendations/2026-07-14 France vs Spain Astrology Slideshow 制作方案.md]] | `status: ready-to-produce`，缺 `content_stage` | 旧状态口径；先确认是否已制作、发布或暂停 |

### 已发布，等待周报继续闭环

- [[inbox-pengman/04-production/06-daily-content-recommendations/2026-07-16 Moon Sign Toxic Traits 第4集 内容生产记录.md]] — `content_stage: 已发布`；[TikTok](https://www.tiktok.com/@astrologywiki/video/7663039564482710798)；`decision: 待观察`，周报：W29。
- [[inbox-pengman/04-production/06-daily-content-recommendations/2026-07-14 Earth Moon Toxic Traits 视频制作方案.md]] — `decision: 调整后复用`，周报：W29。
- [[inbox-pengman/04-production/06-daily-content-recommendations/2026-07-13 Cancer New Moon 视频制作方案.md]] — `decision: 待观察`，周报：W29。
- [[inbox-pengman/04-production/06-daily-content-recommendations/2026-07-10 Fire Moon Toxic Traits 视频制作方案.md]] — `decision: 待观察`，周报：W29。
- [[inbox-pengman/04-production/06-daily-content-recommendations/2026-07-09 Moon Sign Toxic Traits 视频制作方案.md]] — `decision: 待观察`，周报：W28。

发布事实和周级数据统一以 [[inbox-pengman/04-production/05-weekly-published-content-digests/README.md]] 为准。

## 生产规则入口

- Brief：[[inbox-pengman/04-production/00-evergreen-workflows/统一内容 Brief 模板.md]]
- 路由与规则来源：[[inbox-pengman/04-production/00-evergreen-workflows/内容路由与规则调用说明.md]]
- 双模型实验与人工润色：[[inbox-pengman/04-production/00-evergreen-workflows/Pengman 与 AI 内容润色协作说明.md]]
- 生产记录结构：[[inbox-pengman/04-production/00-evergreen-workflows/内容生产与学习记录模板.md]]

公共表达、品牌安全和 CTA 以 [[inbox-pengman/04-production/00-evergreen-workflows/astrologywiki-social-daily/SKILL.md#Copy Style]] 为唯一来源，本 README 不维护第二套文风规则。

## 主记录与附件

- 一条内容只允许一份主生产记录；当前状态、最终确认稿、制作选择和发布回链写在主记录。
- 共享 Prompt、Claude/GPT 候选、素材清单等是过程附件，不是平行事实来源。
- 默认只读主记录。只有用户要求比较候选、追溯实验或复核素材时，才读附件。
- 当前 Messi × Yamal 实验的主记录是 [[inbox-pengman/04-production/06-daily-content-recommendations/2026-07-16 Messi × Yamal World Cup Final 内容生产记录.md]]；以下附件不进入默认读取：
  - [[inbox-pengman/04-production/06-daily-content-recommendations/2026-07-16 Messi × Yamal World Cup Final 双模型实验 Prompt.md]]
  - [[inbox-pengman/04-production/06-daily-content-recommendations/2026-07-16 Messi × Yamal World Cup Final Claude Candidate.md]]
  - [[inbox-pengman/04-production/06-daily-content-recommendations/2026-07-16 Messi × Yamal World Cup Final GPT Candidate.md]]

## 历史内容

2026-07-14 及以前的每日选题池、早期内容包和未在“当前队列”列出的制作方案，默认按历史生产记录处理。需要复用时，先核对是否已有发布记录、`decision / next_test` 和更近的同系列稿。

### 历史生产记录索引（默认不读）

每日选题池：

- [[inbox-pengman/04-production/06-daily-content-recommendations/2026-07-14 每日选题池.md]]
- [[inbox-pengman/04-production/06-daily-content-recommendations/2026-07-13 每日选题池.md]]
- [[inbox-pengman/04-production/06-daily-content-recommendations/2026-07-10 每日选题池.md]]
- [[inbox-pengman/04-production/06-daily-content-recommendations/2026-07-09 每日选题池.md]]
- [[inbox-pengman/04-production/06-daily-content-recommendations/2026-07-08 每日选题池.md]]

早期内容包：

- [[inbox-pengman/04-production/06-daily-content-recommendations/2026-07-09 Venus enters Virgo 内容包.md]]
- [[inbox-pengman/04-production/06-daily-content-recommendations/2026-07-07 每日内容包.md]]
- [[inbox-pengman/04-production/06-daily-content-recommendations/2026-07-06 每日内容推荐与内容包.md]]
- [[inbox-pengman/04-production/06-daily-content-recommendations/2026-07-03 AI Host 视频内容包.md]]
- [[inbox-pengman/04-production/06-daily-content-recommendations/2026-07-02 每日内容包.md]]
- [[inbox-pengman/04-production/06-daily-content-recommendations/2026-07-01-daily-content-recommendation.md]]

旧制作方案，状态仍需逐条确认：

- [[inbox-pengman/04-production/06-daily-content-recommendations/2026-07-13 Dreaming About Your Ex 视频制作方案.md]]
- [[inbox-pengman/04-production/06-daily-content-recommendations/2026-07-06 House of the Dragon Rhaenyra 视频制作方案.md]]
- [[inbox-pengman/04-production/06-daily-content-recommendations/2026-07-06 Celebrity Rising Sign 视频制作方案.md]]
- [[inbox-pengman/04-production/06-daily-content-recommendations/2026-07-03 AI Host Video 2 制作方案.md]]

已明确合并的过程稿见 [[inbox-pengman/04-production/06-daily-content-recommendations/已合并旧稿/README.md]]；AI 默认不扫描该目录。

## 状态口径

- 仓库 `status` 只服务 dispatch，普通生产文件保持 `draft` 即可。
- 内容阶段统一使用：`Brief` → `AI 初稿` → `等待人工润色` → `待制作` → `待发布` → `已发布` → `复盘中` → `已复盘`，或 `暂停`。
- 只有发布时间排期而没有 permalink，不等于已经发布。
- README 只做队列索引；若 README 与主生产记录冲突，以主生产记录为准，并修正 README。
