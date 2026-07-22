# GenGrowth 内容运营工作台（Pengman）

本目录是 Pengman 的个人研究、计划与内容生产工作区。当前内容生产采用滚动周机制；正式执行入口是 [[inbox-pengman/04-production/README]]。

> 当前唯一默认节奏：本周发布上周库存，本周生产下周内容；周一锁定产能、选题、账号、形式、排期与 Batch；周二至周四批量生产；周五排期、库存检查和复盘；每天只执行既定计划并有限检查热点。

## 目录索引

| 目录 | 当前用途 |
|---|---|
| `00-inbox` | 临时输入与个人操作卡，不维护正式状态 |
| `01-conversation report` | 当前协作上下文与历史交接 |
| `02-topic-ideas` | 已退役的长期主题与旧脚本，只作历史参考 |
| `04-production` | 周计划、单条生产、发布复盘和现行 SOP |
| `05-调研资料` | 竞品、平台、工具和历史方法资料；按需读取 |
| `06-tasks` | 任务与职责记录，不代替内容周计划 |
| `07-account-assets` | 账号与品牌资产 |
| `08-requirements` | 需求文档和迁移提案 |
| `09-reports` | 策略分析与运营周报 |
| `output` | 抓取输出和数据文件 |

## 内容生产入口

| 要做的事 | 入口 |
|---|---|
| 建立或执行本周计划 | [[inbox-pengman/04-production/04-weekly-content-plans/README]] |
| 查看周度规则、配额、内容池、Batch 与 WIP | [[inbox-pengman/04-production/00-evergreen-workflows/weekly-rolling-content-production-sop]] |
| 获取今天的既定执行卡 | [[inbox-pengman/04-production/00-evergreen-workflows/daily-content-assistant-sop]] |
| 周一候选研究、Hot 评估或明确重排 | [[inbox-pengman/04-production/06-daily-content-recommendations/README]] |
| 推进已选中的单条内容 | [[inbox-pengman/04-production/07-content-production/README]] |
| 发布数据与复盘 | [[inbox-pengman/04-production/05-weekly-published-content-digests/README]] |

`06-daily-content-recommendations` 的目录名保留以兼容旧链接，但它不再是每日默认入口。Idea 只有经 Pengman 确认并进入未来两周产能后，才能成为 `selected`。

## 状态口径

- 仓库 `status` 只服务 dispatch 和文件管理。
- 内容生命周期只使用 `content_stage`：
  `idea → selected → brief → scripted → assets_ready → producing → edited → scheduled → published → reviewed`，补充 `hold / cancelled`。
- 没有真实 `published_url` 不得标记 `published`；没有 `decision` 和 `next_test` 不得标记 `reviewed`。
- 周计划显示组合与排期；单条主生产记录保存真实阶段；周报保存发布数据和复盘结论。

## 文件管理边界

1. 日期型周计划、周报、发布记录和单次研究保留日期；长期 SOP 使用稳定名称。
2. 当前规则只在 `04-production/00-evergreen-workflows` 的现行文件维护，不在历史稿中复制。
3. 历史日级候选、旧流程和已发布记录保留原始证据，不因流程升级追溯性改写。
4. GSC 自 2026-07-16 起暂停，不读取、不索取，也不因缺少 GSC 阻塞内容生产。
5. `status: ready_for_review / ready_to_move` 仍仅用于仓库 dispatch；不得代替 `content_stage`。

*最后更新：2026-07-21*
