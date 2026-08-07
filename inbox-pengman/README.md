# GenGrowth 内容运营工作台（Pengman）

本目录是 Pengman 的个人研究、计划与内容生产工作区。处理内容生产时，不需要从头浏览所有文档；统一从 [[04-production/README#内容生产工作区入口|内容生产区入口]]开始。

## 3 分钟开始

1. **今天或本周做什么**：打开当前周的 `04-production/03-weekly-content-plans/YYYY-Www 周度内容计划.md`。
2. **某条内容实际到哪一步**：打开 `04-production/07-content-production/` 的 `未发布/` 或 `已发布/` 中对应的单条主记录，看 `content_stage`。
3. **不知道该用哪条规则**：打开 [[inbox-pengman/04-production/00-evergreen-workflows/README|可复用流程索引]]，按任务选择一份 SOP。

第一次替 Pengman 接手完整工作时，直接打开 [[inbox-pengman/04-production/00-evergreen-workflows/社媒内容生产接手指南|社媒内容生产接手指南]]。

> 当前周计划负责组合和排期；单条主记录负责真实阶段、最终稿和发布证据。两者冲突时，以单条主记录的 `content_stage` 为准，并修正周计划。

## 当前目录

| 目录 | 当前用途 |
|---|---|
| `00-inbox` | 临时输入和个人操作卡；不维护正式状态 |
| `01-conversation report` | 当前协作上下文和历史交接 |
| `02-调研资料` | 平台、竞品、工具、方法、产品体验与历史调研 |
| `04-production` | 当前周计划、单条生产、发布合集和现行 SOP |
| `05-account-assets` | 账号和品牌资产 |
| `06-requirements` | 工具、流程需求和迁移提案 |
| `07-reports` | 周报、策略分析和专项报告 |
| `skills-staging` | 通用社媒 Skills 维护区 |
| `output` | 抓取输出和数据文件 |

## 状态口径

- 内容生命周期只使用 `content_stage`：
  `selected → producing → ready → published`，补充例外 `hold / cancelled`。候选在被选中前留在候选池，不创建 `idea` 阶段。
- 仓库 `status` 只服务文件或 dispatch，不表示内容进度。
- 没有真实 `published_url`、平台 ID 或实际发布时间时，不把发布表述为完整核验。
- 脚本确认由 `script_status / confirmed_script_version` 表示；定时由 `scheduled_at / publish_date` 表示；复盘由 `decision / next_test` 表示，均不新增生命周期阶段。
- 不创建第二套日历、状态表或生产队列。

## 历史与当前的边界

- `04-production/04-content-production/` 保存迁移前的历史生产记录，不是当前单条生产入口。
- `04-production/02-daily-content-recommendations/` 只保存周一候选研究、Hot 证据或明确重排，不是每日默认入口。
- `02-调研资料/历史流程/` 只作背景证据，不作为当前执行规则。
- 历史任务与职责记录归档于 `02-调研资料/历史调研/历史任务与职责/`；产品体验与反馈记录在 `02-调研资料/产品体验与反馈/`。当前行动任务以周度内容计划承接。
- W32 的同周生产发布是健康请假后的临时例外，不代表长期机制。

*最后更新：2026-08-04*
