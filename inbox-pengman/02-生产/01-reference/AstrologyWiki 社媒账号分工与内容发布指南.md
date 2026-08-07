---
title: AstrologyWiki 社媒账号分工与内容发布指南
project: astrologywiki
product: astrologywiki
type: content-strategy-playbook
account: multiple
platform: multiple
status: active
owner: Pengman
updated: 2026-08-07
active_accounts:
  - "@astrologywiki"
  - "@miraaastrology"
---

# AstrologyWiki 社媒账号分工与内容发布指南

> 本文档回答两个直接问题：“每个账号分别负责什么？”以及“这条内容应该发到哪个账号？”当前只启用 `@astrologywiki` 与 `@miraaastrology`；它不要求两个账号每天都发。未来增加、恢复或停用账号时，先检查本文的“新账号启用条件”，再由本周内容安排决定是否投入产能。

本文只说明账号分工、内容边界、适合的制作形式，以及不同内容应该发到哪里。每周能做多少、具体排期和每条内容的实际进度，仍以 [[inbox-pengman/02-生产/00-evergreen-workflows/weekly-rolling-content-production-sop|每周内容生产流程]]、本周内容安排和每条内容详情页为准。

## 1. 当前账号状态

| 账号 | 当前状态 | 核心任务 | 当前不承担 |
|---|---|---|---|
| `@astrologywiki` | **active** | 官方可信内容、天象时效、工具/页面承接、可搜索的解释型内容 | 泛星座标签、低可信预测、纯粹为了互动的震惊榜单 |
| `@miraaastrology` | **active / 当前增长重点** | AI 占星师人设、具体星座或 placement、关系行为、心理机制、系列化短视频 | 泛品牌公告、复杂产品教程、把心理推断写成诊断或占星定律 |
| `@filestarsx` / 历史热点测试方向 | **paused** | 当前不分配日常产能 | 不因出现普通热点而自动恢复，不保留默认 Hot 配额 |
| 历史普通占星爱好者测试号 | **retired** | 仅保留历史数据和学习证据 | 不再作为低成本测试号，不承担选题探测或批量铺量 |
| 未来可能新增的账号 | **not activated** | 尚无当前职责 | 不进入本周安排、候选内容分配、生产配额或自动化发布范围 |

`active / paused / retired / not activated` 是账号层状态，不是内容生命周期，不能写入单条内容的 `content_stage`。

## 2. 不同内容应该发到哪个账号

先判断内容要完成的用户任务，再判断账号，不从旧编号或“矩阵补齐”反推账号。

```text
天象发生了什么／为什么现在重要／如何查看自己的星盘
→ @astrologywiki

某个星座或 placement 为什么会出现一种具体关系行为／心理反应
→ @miraaastrology

主要价值只是某个明星、比赛、恋情或事件的即时流量
→ 当前默认不生产；留在候选池，除非 Pengman 明确启用新的承接账号或批准官号例外

低成本梗、趋势音频、素人口吻测试
→ 当前默认不生产；不得为了复活历史测试号而制造任务
```

同一母题只有在两个账号各自有独立用户价值时才可以拆成两个版本。两个版本必须有独立 `content_id`、Brief、脚本、账号语气和发布证据；不得把同一稿件机械改账号名后重复发布。

## 3. `@astrologywiki`｜官方可信与工具承接

### 定位

`天象事实 + 可理解的心理/关系落点 + AstrologyWiki 工具或知识承接`

官方账号的核心价值不是“更像占星博主”，而是让用户快速理解一个真实天象、概念或星盘问题，并知道下一步在哪里查看自己的情况。

### 优先内容支柱

1. **Current Sky / Predictable Transit**：未来几天或本周的重要天象、日期窗口和实际含义。
2. **Check Your Chart**：录屏、页面展示、宫位/度数/placement 查询，引导用户完成具体动作。
3. **Evergreen Explainer**：Moon、Rising、Venus、houses、aspects 等可搜索知识。
4. **Product-led Answer**：从真实用户问题出发，用工具或页面完成回答；不是产品功能清单。

### 推荐形式

- Photo / Carousel / Slideshow
- Short Text Video
- 页面或工具录屏
- 有足够证据和产能时的 45–90 秒解释视频

### Hook 方向

- `[Date]: [planet/event] enters [sign]. Here's what to check in your chart.`
- `This eclipse lands at [degree]. Find where that degree falls in your chart.`
- `Your Sun sign cannot answer this. Check your [Moon/Venus/Rising/house].`
- `If this transit feels personal, the house it activates may explain why.`

### CTA

- `Generate your chart`
- `Check where this lands in your chart`
- `Read the full guide`
- 与视频问题直接对应的具体工具或页面

### 红线

- 不把 personalized insight 写成绝对预言。
- 不为赶热点牺牲日期、度数、人物和来源核验。
- 不用 `destiny / fated / astrology predicted this` 代替证据。
- 不把官号做成 Miraa 的泛星座心理口播复制品。

## 4. `@miraaastrology`｜AI 占星师心理与关系系列

### 定位

`AI 占星师 × 单一 Sun Sign 或 placement × 具体关系行为 × 深层心理解释`

当前 Scorpio 是正在验证的系列，不等于永久 Scorpio-only。是否扩展其他星座、关系组合或 AI Host 形象，必须看已发布数据、系列去重和周计划，不因题库可扩展就自动批量生产。

### 优先内容支柱

1. **Sign Psychology**：一个具体行为背后的保护、信任、连接或表达机制。
2. **Relationship Projection**：两个星座在一个具体关系场景中的双视角误读。
3. **Placement Depth**：Moon、Venus、Rising 等确有用户理解价值时再使用；开头要让普通观众听懂。
4. **Comment-led Follow-up**：重复出现且有内容价值的评论问题，可进入周一候选研究；单条评论不自动触发制作。

### 推荐形式

- 固定 AI Host、声音、字幕和视觉规格的 35–60 秒短视频
- 有明确测试目的时的短版变体
- 关系场景和心理机制优先于抽象性格标签

### Hook 方向

- `Scorpio [does a specific observable behavior]. Here's what they're protecting.`
- `[Sign A] does this. [Sign B] hears something completely different.`
- `People think [sign] is [surface trait]. The real conflict starts when [specific scene].`
- 从一句可见行为或冲突开始，不先解释星座背景

### 质量标准

- 一条视频只讲一个核心机制。
- 前 1–3 秒必须出现具体行为、冲突或反差。
- 双方关系内容公平呈现，不设单一反派。
- 美国 18–35 岁观众能自然听懂；避免生硬翻译腔和 AI 总结句。
- 继续读取同系列最近 `decision / next_test`，避免重复 truth test、沉默、控制等旧机制。

### 红线

- 不使用 `toxic / narcissist / psycho / gaslighting` 等病理化标签吸引流量。
- 不把 Reddit 自述或单一案例写成占星事实。
- 不默认性别，不给宿命式兼容分数。
- 不为了“换星座”而只替换星座名、复用同一脚本。
- 不未经测试同时更换题材、Host、声音、时长和视觉，导致结果不可解释。

## 5. 当前两账号如何协同

协同不是每个母题都双发，而是让两个账号承担不同层级：

| 母题 | 官号可承接 | Miraa 可承接 | 是否必须双发 |
|---|---|---|---|
| 日食、逆行、行星换座 | 日期、度数、影响窗口、查宫位/星盘 | 若有明确关系行为机制，可做某星座/placement 的具体反应 | 否 |
| Moon / Venus / Rising | 概念解释和查询方法 | 具体 placement 的心理或关系行为 | 否 |
| 星座关系组合 | 通常不做泛兼容 | 双视角具体生活场景 | 否 |
| 用户留言出生信息 | 提供安全、简短的评论回复或引导工具 | 可汇总成重复问题候选，不公开做个人诊断 | 否 |
| 产品功能 | 真实问题 → 工具演示 | 只有与既有人设和用户问题自然相关时才轻度承接 | 否 |

默认原则：一个母题优先选择最合适的一个账号。只有两个版本的用户问题、内容承诺和形式都明显不同，才拆成两个生产任务。

## 6. 新账号启用条件

未来可以新增账号，但必须先完成以下最小信息并由 Pengman 明确确认：

```yaml
account_handle:
account_status: proposed
business_goal:
target_audience:
unique_job:
why_existing_accounts_cannot_carry_it:
content_pillars:
default_formats:
minimum_test_batch:
time_and_tool_budget:
success_signal:
stop_condition:
decision_owner: Pengman
```

启用规则：

1. 必须说明它解决什么独立问题，不能只写“多一个号增加流量”。
2. 必须说明为何官号或 Miraa 无法承接。
3. 先批准一个有限测试 Batch，不直接进入长期周配额。
4. 账号只有在本周内容安排中明确列为 active 后，才可以分配候选内容和生产任务。
5. 测试后依据真实发布数据填写继续、调整、暂停或停止；不得因已经开通账号而永久占用产能。
6. 启用新账号时更新本文“当前账号状态”，不要另建第二份账号真相表。

## 7. 制定本周内容安排时怎么使用本指南

周一规划或明确重排时：

1. 先读取本文确认当前 active 账号。
2. 按账号角色选内容，不先分配固定数量再填主题。
3. 再根据可用时间、S/M/L、库存和本周目标决定每个账号是否发布、生产或跳过。
4. 当前两个账号都可以在某周为 0；没有合适内容时不强行补齐。
5. 周二至周五执行已选内容，不因某个暂停账号“很久没发”而临时恢复。

## 8. 历史策略兼容说明

- 旧“四账号 Playbook”中的热点号、普通爱好者测试号、多语言矩阵和“一题四发”只作为历史探索，不是当前执行规则。
- 历史周报、候选池、需求文档和抓取记录中的“四账号”描述保留原始证据，不追溯改写。
- 现行流程、AI Skill、模板和接手入口应统一引用本文的新文件名和当前启用账号口径。
- 公共采集器仍可能读取历史账号用于保留指标连续性；“仍在采集”不等于“当前仍在生产”。

## 9. 当前判断依据与待验证项

### 已核验事实

- 当前明确聚焦 `@miraaastrology` 与 `@astrologywiki`。
- 历史普通占星爱好者账号已停止生产。
- 账号启停和当周产能应由当前周计划确认，而非由旧矩阵编号推断。

### 运营推断

- 两账号聚焦有助于减少账号切换、集中样本和建立清楚的账号标签。
- Miraa 适合继续验证心理/关系系列；官号适合承接可信天象、知识与产品路径。

### 待确认

- `@filestarsx` 是长期暂停、仅保留账号，还是未来仍可能以限定 Batch 重启。
- 新账号若重启，优先验证的独立用户任务和停止条件是什么。
- 两个 active 账号的长期发布频率仍需根据后续真实产能与数据决定，本文不预设固定配额。
