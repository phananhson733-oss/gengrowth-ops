---
title: Weekly Rolling Content Production SOP
project: astrologywiki
type: workflow
status: active
owner: Pengman
updated: 2026-08-04
---

# Weekly Rolling Content Production SOP

> 本文件是 AstrologyWiki 当前启用社媒账号的周度产能、内容池、Batch、热点插入和迁移规则唯一来源。当前启用哪些账号、每个账号负责什么，以 [[inbox-pengman/02-生产/01-reference/AstrologyWiki 社媒账号分工与内容发布指南]] 为准；当前只启用 `@astrologywiki` 与 `@miraaastrology`，未来账号未满足启用条件前不进入周计划。

## 1. 滚动周原则

```text
Publishing This Week = 主要发布上周已完成并排期的库存
Producing for Next Week = 本周主要生产下周需要发布的内容
```

- 周一只锁定本周产能、候选、账号、形式、计划发布日期和 `batch_id`，不要求写完所有脚本。
- 每日发布不得依赖当天从零选题、写稿和制作；没有库存时进入“首周启动”，先建立缓冲层。
- 热点是有评分门槛的例外流程，不是默认日更方式。
- 周一选题按账号定位判断；周二至周四按视频形式、制作环节、模板/工具和时效优先级批量生产。
- 一个母题可以共享研究或素材，但每个可独立发布的账号版本必须有独立 `content_id`、Brief、脚本确认和 `content_stage`。
- `content_stage` 是唯一生命周期真相源；仓库 `status` 只服务 dispatch。
- 周计划负责组合、容量、Batch 和排期；单条主生产记录负责最终稿、真实阶段和发布回链。两者冲突时以单条主生产记录为准，并修正周计划。

### 1.1 生成选题前的互联网调研门槛

所有新候选，包括 Evergreen、Predictable、Hot、补库和替换候选，都必须先执行 [[inbox-pengman/skills/astrologywiki-social-workflow/SKILL.md]] 的 `Mandatory Internet Research Gate`。原有周计划、周报、生产队列、账号定位与路由 Playbook、历史样本和 `decision / next_test` 仍须照常读取；以下入口只作为新增参考：

- 固定参考账号 CSV：`https://script.google.com/macros/s/AKfycbyunRIRkIyxEFRUIPstyKFPebAE2rBZB8CBFmoTWzJkhBl-ugAsakxHwZipbT4hTOgANg/exec`
- Apps Script Library：`https://script.google.com/macros/library/d/1XrKVy_7L_IJl_1Zc-9puY03e8RbvwDi7CQMEAL1uzaafW9Cfa32lRshg/3`

固定 CSV 必须成功读取；Library 若需要登录，记录限制即可继续，但不得声称已读取内部内容。每轮还须核验至少 2 个与目标账号/候选直接相关的当前公开来源；Hot 使用更严格的 4 来源/3 直接链接门槛。

## 2. 集中配置：当前两账号基线

> 所有默认配额只在本节维护。周计划模板引用本节，不复制成另一套默认值。真实产能变化时先修改本节，再从下一份周计划生效。

| 配置项 | 当前规则 |
|---|---|
| 当前启用账号 | `@astrologywiki`、`@miraaastrology` |
| 当前增长重点 | `@miraaastrology`；具体配额由当周目标和产能决定 |
| 官号职责 | 保持可信天象、知识和产品承接；不要求每周机械凑数 |
| 每周正式排期合计 | 由当周可用时间和 S/M/L 计算，不再默认 8 条 |
| 发布级机动库存 | 优先保持 1–2 周可执行缓冲；恢复周可明确例外 |
| 暂停/退役账号配额 | 0；未明确启用不得预留 Hot 槽或生产容量 |
| 已剪辑成片库存上限 | 未来 2 周 |
| `producing` 同时在制上限 | 3 条 |
| 内容池比例 | 仅作组合观察，不机械凑 `Hot / Predictable / Evergreen` 比例 |

当周先按账号角色和业务目标选内容，再用产能决定数量。天象密集周可提高 `Predictable`；热点只有能由当前 active 账号合理承接且通过证据门时才进入候选，不为历史热点号保留固定槽。

### 2.1 工作量换算

| effort | 参考工作量 | 常见内容 |
|---|---|---|
| `S` | 15–30 分钟 | 简单 photo、文字视频、低成本 Hook 测试 |
| `M` | 30–90 分钟 | AI 口播、普通短视频、轻量 slideshow/carousel |
| `L` | 90 分钟以上 | 复杂调研、多版本视觉、双模型实验、重制作 |

- 每增加 1 条 `L`，原则上减少约 2 条 `S`；周计划必须记录替换了什么。
- Idea 可以多，`selected` 不得超过未来两周可执行产能。
- 无法明确本周可用时间时，不自动塞满内容；先按首周或保守产能执行。

### 2.2 Miraa 的发布库存规则

`@miraaastrology` 当前是增长重点，采用“**7 发 / 7 产 / 3 库存**”作为正常周目标；实际发布允许在 **5–7 条**之间浮动，不能为了凑满 7 条牺牲选题、脚本或 QA。

```text
正常周：上周库存 3 + 本周生产 7 = 可用 10
       → 本周发布 5–7（正常目标 7）
       → 保持至少 3 条 ready 库存

库存为 0 的启动/恢复周：本周生产 10
       → 优先发布 5–7
       → 其余达到 ready 的内容留作下周库存
```

- 这里的“库存”只指 `content_stage: ready` 且 `inventory_ready: true` 的单条主记录；计划中的标题、未确认脚本或定时截图都不算库存。
- 第 6、7 条若没有足够制作与 QA 时间，优先转为下周库存，不要求周末临时发布。
- 库存已稳定为 3 条后，本周主要生产 7 条，不持续囤积超过未来两周可执行量的成片。
- 官号和其他账号按其内容窗口、业务任务和剩余产能安排；不能因 Miraa 有 7 条目标而机械同步增加配额。

## 3. 周计划的两个清单

每份周计划必须分开维护：

1. **Publishing This Week**：本周实际要发布的内容，通常来自上周完成的 `ready` 内容；是否已定时看 `scheduled_at / publish_date`。
2. **Producing for Next Week**：本周要推进到 `ready`、供下周使用的内容。

同一 `content_id` 可以因为“本周生产并临时插播”同时出现在两区，但必须写明 `Hot exception`，不能默认混用。

周计划存放在 `04-production/04-weekly-content-plans/`，从 [[inbox-pengman/04-production/00-evergreen-workflows/templates/weekly-content-plan-template]] 复制。命名建议：`YYYY-Www 周度内容计划.md`。

## 4. 周一到周五

### 周一：锁定组合、产能和 Batch

**输入**

- 上周周计划的完成情况、库存和阻塞。
- 最近周报中的 `decision / next_test`。
- 当前单条生产队列及真实 `content_stage`。
- 未来 6–8 周天象/可预测事件日历。
- 账号分工与内容发布指南、当前启用账号、业务优先级和本周可用时间。
- 本轮实时互联网调研结果，包括固定参考账号 CSV 的读取状态、Apps Script Library 的访问状态、相关账号/话题的当前公开内容和直接链接。

**操作**

1. 先确认 `Publishing This Week` 是否全部有可发布资产；缺口优先从发布级库存补，不从零临时生产。
2. 计算本周 S/M/L 可执行产能；`selected` 总量不得超过未来两周产能。
3. 检查未来 6–8 周 Predictable 事件，为临近两周的事件确定 Brief/生产截止时间。
4. 在生成任何新候选前，执行 Social Daily Skill 的 Mandatory Internet Research Gate：成功读取固定参考账号 CSV，尝试访问 Apps Script Library，并核验至少 2 个与目标账号/选题直接相关的当前公开来源；Hot 继续使用更严格的来源门槛。
5. 从 `Evergreen / Predictable / Hot` 生成候选，检查最近 7–14 天去重和上一轮 `decision / next_test`。
6. 维护各当前账号的候选池：Miraa 正常目标为 **15–20 条研究合格候选**；从中提出本周短名单，再按账号定位筛选。
7. 每条进入短名单的候选明确账号、形式、优先级、成本、发布日期、截止日和过期日。
8. 锁定本周要生产的下周组合；仅对正式承诺制作的内容设置 `content_stage: selected`。
9. 按形式、制作环节、模板/工具和时效划分 Batch，填写 `batch_id`。
10. 建立初步排期；只有当前 active 账号存在合格 Hot 且 Pengman 批准时才使用机动容量，不为暂停账号预留固定槽。

**输出**

- 完整的 `Publishing This Week`。
- 受产能约束的 `Producing for Next Week`。
- active 账号的本周分工、三个内容池数量、Batch 列表和可用机动容量。

**完成标准**

- 每条已选内容都有独立 `content_id` 或明确的建档动作。
- 账号、形式、`pool`、`effort`、计划日期、截止日、过期日、`batch_id` 已确定。
- 每条新候选都有本轮 Evidence Preflight、可追溯直接链接和调研时间；固定 CSV 不可读时没有生成正式候选，Library 需要登录时已明确披露未读取内部内容。
- 周一没有把所有候选自动提升为 `selected`，也没有要求当天写完全部脚本。
- 候选池维持至少 15 条可选题；若库存为 0 的启动/恢复周，优先补足能支撑“10 产”的候选短名单，再启动批量生产。

### 周二：Brief、脚本、核验和确认

**输入**

- 周一锁定的 `Producing for Next Week`。
- 同系列最近 `decision / next_test`、1–3 条相关历史样本和必要证据。

**操作**

1. 按账号/系列批量完成 Brief，再按相近脚本结构集中写稿。
2. 对天象、明星、体育、影视和公开事件完成事实核验。
3. 人工确认 Hook、核心承诺、账号语气、CTA 和脚本版本。
4. Brief、调研和脚本都在 `selected` 内推进；人工确认后更新 `script_status: 已确认` 和 `confirmed_script_version`，不改变 `content_stage`。
5. 未确认脚本不进入大规模素材准备；实验通道继续遵守双模型隔离和人工确认规则。

**输出**

- 已确认脚本的一批主生产记录。
- 事实待确认、需要退回 Brief 或取消的清单。

**完成标准**

- 临近时效内容的脚本全部人工确认。
- 其余本周承诺内容至少 80% 达到 `script_status: 已确认`；不足时立即缩减本周生产承诺，不把积压隐藏到周三。

### 周三：素材与轻形式 Batch

**输入**

- 已确认脚本的 `selected` 内容、Batch 列表和授权/来源要求。

**操作**

1. 按素材来源、尺寸、模板和工具批量准备图片、星盘图、B-roll、字幕、音乐和封面元素。
2. 素材准备仍记录在 `selected` 的正文或检查项中，不新增阶段。
3. 优先集中制作 slideshow、photo、字幕视频和 B-roll 等轻形式。
4. 开始实际制作时进入 `producing`；同时最多 3 条。
5. 剪辑、字幕和基础质检完成后进入 `ready`。

**输出**

- 轻形式成片和剩余缺口清单。

**完成标准**

- 轻形式承诺内容均达到 `ready`，或已明确返工/取消；不得把模糊半成品继续算作库存。

### 周四：重形式 Batch

**输入**

- AI 口播、明星星盘、复杂天象和其他 M/L 内容。

**操作**

1. 集中生成 AI 主播、配音、口型和字幕。
2. 集中处理明星/情侣/事件事实、星盘截图和较重视觉。
3. 复用同一工具和模板连续生产，但保持各账号语气、视觉和 `content_id` 独立。
4. 统一完成第二轮剪辑和账号串号检查。
5. 无法完成的内容必须降级、替换、设为 `hold` 或退回池，不得占用虚假的 `producing`。

**输出**

- 重形式成片、返工项和被释放的产能。

**完成标准**

- 计划中的可执行内容均达到 `ready`；`producing` 不遗留超过上限的半成品。

### 周五：质检、排期、库存和复盘

**输入**

- 本周所有 `ready` 内容、发布数据、实际链接和库存清单。

**操作**

1. 审核 Hook、账号语气、字幕、事实、品牌安全、CTA、封面和 Caption。
2. 确认发布时间后保持 `ready`，填写 `publish_date / scheduled_at / scheduled_timezone`。
3. 逐账号检查最低发布级库存和“未来两周成片上限”。
4. 补充本周真实发布链接；没有核实直链不得进入 `published`。
5. 将复盘结论写入对应周报并填写 `decision / next_test`；复盘完成后仍保持 `published`。
6. 清理过期 Hot、过期 Predictable 和超过一次顺延的内容。
7. 把未解决风险带入下周计划，不为追求 8+2 伪造完成状态。

**输出**

- 下周已排期内容、发布级机动库存、库存缺口、周报结论和下周约束。

**完成标准**

- 下周正常发布不依赖当天从零制作。
- `ready` 内容已有排期、明确的备用库存标记或返工决定。
- 需要复盘的内容均有 `decision / next_test`，否则保持 `published`。

## 5. Batch 规则

选题先按账号定位，生产再按以下顺序分批：

1. `format`：AI Host、Slideshow、Photo、B-roll、Text Video 等。
2. 制作环节：Brief/脚本、素材、生成、剪辑、Caption/封面、质检。
3. 共用模板或工具：同一字幕模板、同一 AI 主播、同一导出规格、同一素材来源。
4. 时效优先级：先处理最早 `deadline` 或 `expiry_date` 的内容。

不要简单把“人格类、天象类、明星类”各自指定为一个生产日；主题相同不代表制作动作相同。

`batch_id` 建议格式：

```text
YYYY-Www-{format_or_stage}-{sequence}
示例：2026-W31-aihost-01
示例：2026-W31-slideshow-01
示例：2026-W31-caption-qc-01
```

Batch 是生产组织字段，不替代单条 `content_id` 和 `content_stage`。一条内容可以按实际推进更换 `batch_id`；周计划记录当前执行 Batch，主生产记录保留最终使用的 Batch。

## 6. 三个内容池

### 6.1 Evergreen

**进入条件**

- 未来至少 30 天仍然成立；不依赖具体新闻窗口。
- 符合某个账号固定栏目，Hook、形式和目标受众可说明。
- 可以作为计划缺口或无热点时的替补。

**储备与更新**

- Idea 层可以保留较多候选；每个账号只维持本 SOP 配置的发布级最低库存。
- 周一补充候选，周五根据库存缺口补成片；月度清理重复、长期未选和与新结论冲突的 Idea。
- 候选池不使用 `content_stage`，也不代替周计划或单条主记录；它只回答“下次可以从哪些经过研究的题里挑”。

**过期/退回**

- 事实、账号定位或系列 `decision` 改变时重新核验。
- 两次被排期挤出后退回候选池或设为 `hold`，不得长期停在 `selected`。

**排期优先级**

- 默认承担约 60% 排期和热点空缺替补；低于临近窗口的 Predictable 和合格 Hot。

### 6.2 Predictable

**进入条件**

- 天象、节日、赛程、发布、星座季等日期可提前确认。
- 有明确最佳发布日期、制作截止日和 `expiry_date`。

**储备与更新**

- 维护未来 6–8 周事件日历；两周前确定角度，约一周前完成 Brief/脚本，通常 3–5 天前完成成片。
- 每周一更新日期和窗口；事实变化时立即修正。

**过期/退回**

- 超过有效窗口且没有“事后解释”新角度时设为 `cancelled` 或退回池重新 Brief。
- 即将过期的 Predictable 不因普通热点顺延。

**排期优先级**

- 默认约 25%；按 `expiry_date` 优先于 Evergreen。

### 6.3 Hot

**进入条件**

- 有当前公开热度证据、自然的占星角度和明确账号匹配。
- 按第 7 节评分；只有进入处理区间的热点才能占用执行时间。

**储备与更新**

- 不大量预制完整热点脚本；储备观察名单、可信来源、星盘/图片准备方法和快速模板。
- 每天上午有限检查一次，下午只做短复查；候选事实或热度失效即清理。

**过期/退回**

- `expiry_date` 到达、事实不清、品牌风险升高或分数下降后立即取消。
- Hot 不转成长期 `selected` 积压；失去窗口但仍有长期价值时，重新作为 Evergreen 建 Brief。

**排期优先级**

- 默认约 15%，优先使用预留热点槽；是否打断原计划由第 7 节决定。

## 7. 热点评分与插入

### 7.1 10 分制

| 维度 | 分值 |
|---|---:|
| 账号匹配度 | 0–2 |
| 当前热度 | 0–2 |
| 占星角度自然度 | 0–2 |
| 24–48 小时时效紧迫度 | 0–2 |
| 能否在 90 分钟内完成 | 0–1 |
| 事实清晰和品牌安全 | 0–1 |

处理：

- `8–10`：立即进入热点槽；允许调整当日 Batch。
- `6–7`：当天稍后或次日处理，不立刻打断当前动作。
- `4–5`：放入下周候选池，不写生命周期阶段，不得自动变为 `selected`。
- `0–3`：放弃。

事实未经核实、依赖猜测出生时间、需要绝对预测或有明显品牌风险时，即使总分高也不得插入。

### 7.2 插入顺序

1. 优先使用预留热点槽。
2. 热点槽已占用时，只替换同账号最低优先级的 Evergreen。
3. 被替换内容只允许顺延一次，并记录 `reschedule_count: 1`。
4. 第二次被挤出后退回候选池重新评估，不继续留在 `selected`。
5. 不顺延即将过期的 Predictable；应在热点与 Predictable 中明确二选一。
6. 不让一个热点连锁影响多个账号；其他账号继续原排期。
7. 没有达到门槛的 Hot 时，不推翻周一选题；热点槽由发布级 Evergreen 库存补位。

## 8. 生命周期、完成定义和 WIP

唯一生命周期：

```text
selected → producing → ready → published
```

补充状态：`hold`、`cancelled`。

| content_stage | 完成定义 |
|---|---|
| `selected` | 已由人类确认进入未来两周产能；包含 Brief、调研、脚本确认和素材准备。细分进度看 `script_status`、确认稿和下一动作 |
| `producing` | 正在生成、剪辑或组装；同时最多 3 条 |
| `ready` | 成片、字幕和基础质检已完成，可直接发布；是否已定时看 `scheduled_at / publish_date`，是否为库存看 `inventory_ready` |
| `published` | 已实际发布且主记录有至少一个核实直链 |
| `hold` | 暂缓；必须写原因和下次复查日期，不占本周执行产能 |
| `cancelled` | 已取消；保留原因，不再进入当前队列 |

限制：

- `producing` 同时最多 3 条。
- `selected` 不得超过未来两周可执行产能。
- `ready` 后 48 小时内必须完成排期、发布、返工决定或明确转为发布级备用库存；备用库存必须有 `inventory_ready: true`，不能长期停留为无归属成片。
- 没有真实发布链接不得标记 `published`。
- `decision / next_test` 是否完整只表示复盘是否完成，不改变 `published` 阶段。
- 候选池不受数量硬限制，但正式 `selected` 必须受产能限制。

## 9. 字段兼容与迁移映射

不批量重写历史文件；旧内容在重新进入当前队列时按下表迁移。未知事实写“待确认”，不得从文件日期推断。

### 9.1 字段映射

| 旧字段/写法 | 新字段 | 迁移规则 |
|---|---|---|
| `content_format` | `format` | 新记录使用 `format`；旧记录在下次编辑时复制真实值后移除旧键 |
| `scheduled_publish_at` | `publish_date` + 可选 `scheduled_publish_at` | `publish_date` 记录计划日期；有精确带时区时间时保留 `scheduled_publish_at` |
| `published_urls` | `published_url` + 可选 `published_urls` | 单一主平台直链写 `published_url`；多平台额外直链可保留数组 |
| `Hook 方向` 正文 | `hook` | 已确认 Hook 可提升到字段；尚未确认继续写“待确认” |
| `CTA` 正文 | `cta` | 简短承接写字段，详细解释保留正文 |
| 发布与复盘正文 | `decision` / `next_test` | 周报仍是周级事实来源，主记录可写本条结论或回链 |
| 无 `pool` | `pool` | 人工判断为 `Evergreen / Predictable / Hot`；不确定写“待确认” |
| 无 `batch_id` | `batch_id` | 只给当前仍会推进的内容分配；历史已发布内容不补 Batch |
| 无 `expiry_date` | `expiry_date` | Predictable/Hot 必填；Evergreen 可写复查日期或留空 |

### 9.2 旧阶段映射

| 旧 `content_stage` | 新阶段 |
|---|---|
| `idea` / `候选` | 回到候选池，不写 `content_stage`；只有重新获选才进入 `selected` |
| `selected` / `brief` / `scripted` / `assets_ready` / `Brief` / `AI 初稿` / `等待人工润色` / `待制作` | `selected`；用 `script_status`、确认稿、素材清单和下一动作区分细节 |
| `producing` / `制作中` | `producing` |
| `edited` / `scheduled` / `待发布` / `已排期` | `ready`；排期信息保留在 `publish_date / scheduled_at` |
| `已发布` | 有真实直链为 `published`；无直链则状态待确认，不自动迁移 |
| `published` / `reviewed` / `复盘中` / `已复盘` | 有真实直链为 `published`；复盘信息保留在 `decision / next_test` |
| `暂停` | `hold` |
| 缺少 `content_stage` | 状态待确认，不从 `status` 或日期推断 |

## 10. 旧内容迁移与首周启动

### 10.1 识别正在制作的内容

主生产记录统一存放在 `02-content-production/` 的两个物理目录：`未发布/`（`selected / producing / ready / hold / cancelled` 或发布证据不完整）与 `已发布/`（`published` 且发布证据完整）。目录只做物理归档，不表达阶段；生命周期唯一真相源仍是 `content_stage`。

1. 从 [[inbox-pengman/04-production/02-content-production/README]] 当前队列开始，不扫描所有历史 Idea。
2. 打开候选主记录，核对真实脚本、素材、成片、排期和发布链接。
3. 只有能明确落到 `selected / producing / ready` 的内容才算当前 WIP；只有旧 `status` 或文件名日期的内容放入“状态待确认”。
4. 已写好脚本但本周/下周不会制作：设为 `hold` 或退回候选池，记录脚本已存在，不占 `selected` 产能。

### 10.2 区分两个周次

- 本周已经有成片/排期并计划发布：放入 `Publishing This Week`。
- 本周要继续推进、目标供下周发布：放入 `Producing for Next Week`。
- 既没有本周发布日期，也没有进入未来两周产能的内容：留在候选池或 `hold`，不放入两个执行清单。

### 10.3 补旧字段

- 只给当前 WIP 补 `pool`、`batch_id`、必要的 `expiry_date` 和新阶段。
- 已发布历史内容不为迁移完整性机械补 `batch_id`。
- Hot/Predictable 不知道有效期时先标“待确认”，确认前不得抢占排期。
- 不把 `02-daily-content-recommendations` 的所有历史 Idea 转入 `selected`。

### 10.4 第一批发布库存

首周降低目标：

- 生产 6 条 S/M 内容。
- 至少完成 4 条低成本备用内容。
- 再完成 2 条中等成本内容。
- 周五排好下一周内容。
- 至少保留 2 条未排期但可随时发布的 `ready + inventory_ready: true` 库存。

首周优先选择已有脚本、事实稳定、模板成熟的 Evergreen；不以所有历史账号发满为目标。第二周起根据两个 active 账号的实际产能、数据和库存决定排期，不恢复旧 `8+2` 基线。

## 11. 被替代的旧规则

以下规则自 2026-07-20 起废弃：

- 每天从零生成 Route A/B/C 全量候选，并把日级候选作为默认生产起点。
- 每天默认为所有历史账号生成新组合；现在只需说明当前 active 账号当天的既定发布、推进或跳过状态。
- 用“今天选什么”替代周一产能与排期决策。
- 用旧中文 `content_stage` 集合作为新记录阶段。
- 把 `待发布` 同时当作“成片完成”和“已经排期”。

仍然有效：账号角色边界、品牌安全/文风、证据核验、最近 7–14 天去重、单条独立 `content_id`、双模型隔离、周报 `decision / next_test` 和真实发布链接规则。
