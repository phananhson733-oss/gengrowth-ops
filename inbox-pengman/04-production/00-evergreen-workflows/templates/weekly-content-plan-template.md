---
title: Weekly Content Plan Template
project: astrologywiki
type: weekly-content-plan-template
status: active
owner: Pengman
updated: 2026-08-04
---

# YYYY-Www 周度内容计划

> 从本模板复制到 `04-production/03-weekly-content-plans/`。默认配额、内容池比例、WIP 和热点规则只引用 [[inbox-pengman/04-production/00-evergreen-workflows/weekly-rolling-content-production-sop]]，不要在模板中另建默认配置。

## 0. Week Setup

- Week：
- Planning date：
- 本周可用总时间：
- 本周不可用时段：
- 当前模式：首周启动 / 常规滚动周 / 降低产能周
- S 可执行数量：
- M 可执行数量：
- L 可执行数量：
- L 对 S 的产能替换记录：
- 上周周计划：
- 最近周报：
- 固定参考账号 CSV 状态与 checked_at：
- Apps Script Library 状态（accessible / login_required / blocked）：
- 本轮当前公开来源：
- 候选采用的直接链接：
- 不可用输入或访问限制：
- 本周主要目标：

## 1. Publishing This Week

> 这里仅放本周实际要发布的内容，通常来自上周完成库存。没有真实发布链接前，不得写 `published`。

| publish_date | content_id | title | account | pool | format | priority | content_stage | inventory/source | published_url | risk/next action |
|---|---|---|---|---|---|---|---|---|---|---|
|  |  |  |  | Evergreen/Predictable/Hot |  | P0/P1/P2 | ready | 用 `scheduled_at` / `inventory_ready` 区分 |  |  |

## 2. Producing for Next Week

> 这里仅放本周承诺推进、主要供下周发布的内容。只有进入未来两周产能的项目才能设为 `selected`。

| content_id | title | account | pool | pillar | format | effort | priority | content_stage | publish_date | deadline | expiry_date | batch_id | next action |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
|  |  |  |  |  |  | S/M/L | P0/P1/P2 | selected |  |  |  |  |  |

## 3. Active Account Allocation

| active account | 本周计划发布 | 本周实际发布 | 为下周生产 | 发布级库存 | 分工与原因 |
|---|---:|---:|---:|---:|---|
| `@astrologywiki` |  |  |  |  |  |
| `@miraaastrology` |  |  |  |  |  |
| 合计 |  |  |  |  |  |

> 暂停、退役或未启用账号不列入分配表；若本周提议启用新账号，先链接账号启用门的确认记录。

## 4. Pool Mix

> 比例是参考，不要求凑数；差异必须说明原因。

| pool | Publishing This Week | Producing for Next Week | 过期/退回 | 备注 |
|---|---:|---:|---:|---|
| Evergreen |  |  |  |  |
| Predictable |  |  |  |  |
| Hot |  |  |  |  |

## 5. Hot / Flex Capacity

- 可承接的当前 active 账号：
- 可用机动时间：
- 未出现合格热点时的既定用途：
- 当前热点候选及得分：
- 是否触发插入：否 / 是
- 被替换的 `content_id`：
- `reschedule_count`：
- 插入决定和理由：

## 6. Production Batches

| batch_id | format/stage | 共用模板或工具 | contents | 时效顺序 | owner | planned block | completion definition | status |
|---|---|---|---|---|---|---|---|---|
| YYYY-Www-format-01 |  |  |  |  | Pengman |  |  | planned/in_progress/done |

## 7. Monday–Friday Execution

### Monday — Plan and Lock

- [ ] 复盘上周 `decision / next_test`
- [ ] 核对 Publishing This Week 的成片和排期
- [ ] 确认 S/M/L 产能及 L→S 替换
- [ ] 检查未来 6–8 周 Predictable 日历
- [ ] 生成候选并去重
- [ ] 锁定账号、pool、format、日期和 Batch
- [ ] 确认 `selected` 未超过未来两周产能
- Monday output / blocker：

### Tuesday — Brief and Script

- [ ] 批量完成 Brief
- [ ] 完成必要事实核验
- [ ] 人工确认 Hook、核心承诺、CTA 和脚本
- [ ] 已确认内容写入 `script_status: 已确认`，`content_stage` 保持 `selected`
- Tuesday output / blocker：

### Wednesday — Assets and Light Formats

- [ ] 批量准备素材和授权/来源
- [ ] 轻形式素材准备完成后开始制作并进入 `producing`
- [ ] slideshow、photo、字幕、B-roll 批量制作
- [ ] `producing` 同时不超过 3 条
- Wednesday output / blocker：

### Thursday — Heavy Formats

- [ ] AI 口播集中生成
- [ ] 明星星盘/重调研内容集中制作
- [ ] 账号串号和视觉一致性检查
- [ ] 无法完成内容降级、hold 或退回池
- Thursday output / blocker：

### Friday — QA, Schedule and Review

- [ ] Caption、封面、字幕、事实和品牌安全质检
- [ ] 成片排期或明确设为发布级库存
- [ ] 核对每账号最低库存和两周成片上限
- [ ] 补真实发布链接
- [ ] 填写 `decision / next_test`
- [ ] 清理过期和第二次被挤出的内容
- Friday output / blocker：

## 8. Publish-Ready Inventory

| content_id | title | account | pool | format | content_stage | inventory_ready | expiry/review date | scheduled? | notes |
|---|---|---|---|---|---|---|---|---|---|
|  |  |  | Evergreen |  | ready | true |  | no |  |

- ① 当前发布级库存：
- ② 当前发布级库存：
- `@astrologywiki` 当前发布级库存：
- `@miraaastrology` 当前发布级库存：
- 是否低于 SOP 最低线：
- 是否超过未来两周成片上限：

## 9. Risks and Blockers

| risk/blocker | affected content/batch | impact | owner/action | deadline | status |
|---|---|---|---|---|---|
|  |  |  |  |  | open/closed |

## 10. Friday Review

- 本周计划发布 / 实际发布：
- 本周计划生产 / 实际达到 ready：
- 本周新增发布级库存：
- 最大阻塞：
- 哪个 Batch 最节省时间：
- 哪个 Batch 产生返工：
- 热点槽是否使用及结果：
- 是否需要调整下周产能：

## 11. Decisions for Next Week

| scope/account/series | decision | next_test | evidence/source | carry into next week? |
|---|---|---|---|---|
|  |  |  |  | yes/no |
