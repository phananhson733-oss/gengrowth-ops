---
title: Pengman 与 AI 内容选择、润色与学习协作说明
project: astrologywiki
type: human-ai-content-workflow
status: active
owner: Pengman
updated: 2026-08-04
---

# Pengman 与 AI 内容选择、润色与学习协作说明

> 本文是 Pengman 与 AI 进行双模型内容实验、候选选择、反馈、改稿、差异学习和规则升级的唯一详细协作规范。生产记录使用 [[inbox-pengman/04-production/00-evergreen-workflows/内容生产与学习记录模板]]；Brief 字段和 `content_id` 口径见 [[inbox-pengman/04-production/00-evergreen-workflows/统一内容 Brief 模板]]。

## 先选择协作路线

| 路线 | 何时使用 | 产出 |
|---|---|---|
| **调研驱动的单稿流程** | 方向需要外部证据、社区语言或竞品机制，但不需要比较两份独立成稿 | 外部调研 → 总控冻结方向 → Claude 单稿 → 总控审稿 → Pengman 确认 |
| **双模型内容实验** | Pengman 明确希望比较两种独立写法，且比较本身有实验价值 | 同一冻结包 → Claude 与 GPT 各写候选 → Pengman 选择 |

两条路线都回到同一单条主生产记录，不建立模型各自的 Brief、状态表或生产队列。

## 调研驱动的单稿流程

这是当前 Scorpio × Virgo 已实际使用、可复用的标准链路：

```text
Perplexity / Gemini 调研
→ 总控军师审证、去重并冻结内容方向
→ Claude 依据同一冻结交接包写稿
→ 总控军师检查事实、Hook、结构、口语自然度和系列重复
→ Pengman 确认
→ 写回同一主生产记录并进入制作
```

当前总控军师由 GPT-5.6 承担；以后模型版本变化时，沿用“总控军师”这个职责，不因版本变化另建流程。

### 各方职责

| 参与方 | 负责 | 不负责 |
|---|---|---|
| Perplexity / Gemini | 公开来源、Reddit/社区语言、关系机制、反例和来源链接；可并行调研，也可按任务只用其中一个 | 不决定最终方向，不直接把推断写成占星事实，不维护生产状态 |
| 总控军师 | 检查链接与证据等级、合并重复模式、指出冲突和样本限制、与历史内容去重、冻结唯一核心机制和 Claude 交接包 | 不把两份调研机械拼接，不代替 Pengman 做最终品牌选择 |
| Claude | 只依据冻结交接包生成 Hook、脚本、结构、Caption 等约定产出 | 不自行新增事实、改变核心机制或读取未冻结的调研全文 |
| Pengman | 判断是否“对味”、确认脚本和制作投入；确认后进入正式制作 | 不需要重新整理来源或维护多套记录 |

### 标准步骤

1. **明确调研问题**：写清目标观众、账号、内容形式、需验证的机制、历史去重范围和禁止事项。
2. **获取外部调研**：要求来源链接、查看日期、重复模式、单帖经历、反例、合理推断和样本限制。Reddit 自述只作社区语言与体验证据，不作因果证明。
3. **总控审证**：把结论分为“多来源支持 / 单一案例 / 运营推断 / 待确认”；删去假链接、伪引用、刻板印象和与历史系列重复的机制。
4. **冻结方向**：只保留一个核心机制、3 个以内生活细节、目标情绪、Hook 要求、历史高表现写法机制、禁止事项和证据缺口。
5. **Claude 写稿**：Claude 只收到冻结包，不需要接收两份冗长调研全文；输出仍是待确认候选。
6. **总控审稿**：检查强钩子、具体场景、美国口语自然度、公平呈现、事实边界、时长和系列差异；必要修改必须注明，不伪装成 Claude 原稿。
7. **Pengman 确认**：只有 Pengman 明确采用后，才写 `script_status: 已确认`、`confirmed_script_version`；此时 `content_stage` 仍为 `selected`，实际开始制作才进入 `producing`。
8. **记录与复盘**：主记录保存调研来源摘要、总控判断、冻结方向、Claude 原稿、总控修改和 Pengman 确认；发布后在周报填写 `decision / next_test`。

### 冻结给 Claude 的交接包

```yaml
content_id:
package_version: v1
account:
platform:
target_audience:
format:
content_goal:
core_mechanism:
evidence_summary: []
source_links: []
historical_high_performance_mechanisms: []
series_dedup_constraints: []
mandatory_scenes: []
target_emotion:
hook_requirements:
confirmed_facts: []
prohibited_claims: []
length:
language:
output_requirements:
evidence_gaps: []
```

调研全文保留为过程证据；主记录只保存实际采用的来源、判断和冻结包，避免把文档变成长篇素材仓库。

## 双模型内容实验

### 适用范围

当 Pengman 希望比较两种独立内容方案时，使用以下流程：

```text
Codex 研究、去重和统一 Brief
→ Pengman 确认选题、账号、平台、形式和核心承诺
→ Codex 冻结一份模型实验包
→ Claude 与 GPT 在互不读取对方答案的独立上下文中生成候选
→ Pengman 选择、组合、修改或否决
→ Codex 写回最终工作稿并进行差异分析
→ Pengman 确认后进入正式制作
```

该实验比较的是同一内容资产的候选方案，不建立 Claude 和 GPT 两套平行事实来源。

### 各方职责

| 参与方 | 负责 | 不负责 |
|---|---|---|
| Codex | 前期选题研究、证据收集、去重、账号和形式路由、统一 Brief、冻结实验包、校验输出、整理比较结果、写回 Obsidian、差异分析 | 不替 Pengman 作最终品牌审美和内容选择 |
| Claude | 只依据冻结实验包独立生成一个候选 | 不读取 GPT 本轮答案，不修改已确认事实，不直接写正式稿 |
| GPT 内容实验模型 | 使用与 Claude 完全相同的冻结实验包独立生成一个候选 | 不读取 Claude 本轮答案，不修改已确认事实，不直接写正式稿 |
| Pengman | 确认 Brief；选择、组合、修改或否决候选；确认最终稿；判断品牌审美和制作投入 | 不需要重复整理证据或维护多套生产记录 |

Codex 是唯一负责把实验结果写回 Obsidian 的模型。单条内容生产记录是内容状态和最终版本的事实来源；发布数据、`decision` 和 `next_test` 仍以对应周报为事实来源。

### 冻结模型实验包

Pengman 确认 Brief 后，Codex 从 Brief 和已验证证据生成一份实验包。Claude 和 GPT 必须收到完全相同的 `package_version` 和正文：

```yaml
content_id:
experiment_id:
package_version: v1
topic:
target_audience:
account:
platform:
format:
content_goal:
user_problem:
evidence: []
competitor_references: []
old_draft_references: []
series_constraints: []
confirmed_facts: []
prohibited_claims: []
cta:
landing_page:
length:
language:
previous_decision:
previous_next_test:
output_requirements:
```

每条证据尽量保留来源 URL 或 wikilink、支持的判断和证据强度。竞品引用只写可借鉴机制和不应照抄的部分，不能把竞品具体表达混入 `confirmed_facts`。

实验包冻结后：

- 不得只给其中一个模型补充额外事实；
- 不得把先返回的候选加入另一个模型的上下文；
- 两个模型都只能把结果标记为 `candidate`；
- 若模型认为 Brief 有问题，可以在独立的“对 Brief 的异议”中说明，但不能暗中更改核心事实；
- 如果当前环境不能直接调用 Claude，Pengman 只需把同一冻结实验包转发到独立 Claude 对话，不需要重新编写长 Prompt。

### 统一输出格式

两个模型都使用以下标识：

```yaml
content_id:
experiment_id:
model: claude / gpt
variant_id: claude-v1 / gpt-v1
candidate_status: candidate
package_version: v1
```

正文顺序固定为：

1. 对选题的理解；
2. 推荐的内容角度；
3. Hook；
4. 完整内容初稿；
5. 结构与节奏说明；
6. CTA；
7. 使用了哪些证据；
8. 风险和待确认事项；
9. 对原选题的改进建议；
10. 对 Brief 的异议，无则写“无”。

### Pengman 的选择方式

Pengman 可以：

- 完整选择 Claude 或 GPT；
- 以一个版本为主，吸收另一个版本的 Hook、段落或 CTA；
- 要求 Codex 根据明确选择生成组合版；
- 修改组合版或提供完整人工稿；
- 否决两个版本并退回统一 Brief；
- 调整内容角度后启动新的 `experiment_id`；
- 更换为新的独立选题并创建新的 `content_id`。

候选状态使用 `candidate / selected / partially_used / rejected / superseded`。未采用候选保留为实验证据，但不得进入视觉制作、发布或周报。

### ID 与状态

- `content_id` 代表一个可能进入生产和发布的内容资产。
- `experiment_id` 代表同一冻结 Brief 下的一次候选比较，例如 `aw-moon-toxic-traits-05-exp-01`。
- 只调整措辞或输出格式时，可以沿用 `experiment_id`。
- L4 导致内容角度、用户问题、承诺、受众、账号或形式发生实质变化时，退回 Brief，并为新冻结包创建新的 `experiment_id`。
- L5 形成新的独立内容资产时，创建新的 `content_id`。

| 实验阶段 | `content_stage` | `experiment_status` |
|---|---|---|
| 实验包已冻结 | `selected` | `ready` |
| 两个模型生成中 | `selected` | `generating` |
| 等待 Pengman 比较 | `selected` | `awaiting_comparison` |
| 已选择但组合稿待确认 | `selected` | `selected_pending_confirmation` |
| Pengman 明确确认最终稿 | `selected` | `closed` |
| 两个版本均否决 | `selected` | `rejected_returned_to_brief` |

Pengman 完整选择一个候选时，只有在明确说“确认采用”后，才填写 `script_status: 已确认`。若只是要求 Codex 组合或修改，组合稿仍等待 Pengman 确认。

### 文件保存规则

默认将模型实验包、Claude 候选、GPT 候选、Pengman 比较、组合稿和最终确认版本放在同一份内容生产记录中。只有多平台长版本、多轮大篇幅输出、大量视觉附件或多人分别制作候选时才拆子文档。

拆分时，子文档必须使用相同的 `content_id`、`experiment_id`，并增加 `variant_id` 和 `candidate_status`。主生产记录仍是状态、最终选择和发布入口的事实来源；子文档不得维护第二份 Brief、发布数据或最终决策。

### 固定短指令

Pengman 启动：

```text
为【选题】启动双模型内容实验。账号【】平台【】形式【】限制【无/具体限制】。先完成研究、去重和统一 Brief；我确认后再冻结模型实验包。
```

Codex 交给 Claude：

```text
请作为 Claude 独立内容候选生成器。仅依据随附的冻结模型实验包生成，不读取或猜测其他模型的答案，不改变 confirmed facts、series constraints 和 prohibited claims。严格使用统一输出结构，结果只标记为 candidate；对 Brief 的异议必须单独说明。
```

Codex 交给 GPT：

```text
请作为 GPT 独立内容候选生成器。仅依据随附的冻结模型实验包生成，不读取或猜测其他模型的答案，不改变 confirmed facts、series constraints 和 prohibited claims。严格使用统一输出结构，结果只标记为 candidate；对 Brief 的异议必须单独说明。
```

Pengman 选择后：

```text
实验【experiment_id】：以【Claude/GPT】为主；吸收另一版的【无/具体部分】；修改【具体意见】；未采用部分保留为候选记录。请生成或写入最终工作稿并完成差异分类；本次选择不要直接更新长期 Skill。
```

## 持续学习闭环

目标不是让 AI 模仿任意旧稿，而是每轮都携带三类已验证上下文：

1. **Pengman 偏好证据**：同账号、同形式或同系列稿件中，Pengman 真实保留、删除、改写和确认的部分。
2. **竞品机制证据**：在线竞品事实源中的 Hook 类型、结构、节奏、视觉形式和互动机制；不学具体措辞、人物、素材或无法核验的因果。
3. **发布复盘证据**：同系列最近周报的 `decision / next_test`，以及 reach、留存、互动和转化路径中可得的数据。

### 每次写稿前的学习包

Codex 在生成初稿前，默认选取 1–3 条最相关的历史样本，并在主生产记录中写明：

- 使用了哪些历史稿或生产记录；
- 从 Pengman 的人工反馈中学了什么；
- 从竞品中借鉴了什么机制，哪些不应照抄；
- 上一轮 `next_test` 要求本条验证什么；
- 本次是已确认长期规则、待验证偏好，还是仅适用于当前内容。

如果没有 Pengman 人工修改证据，AI 只能说“暂无已验证的个人偏好”，不得仅凭最终稿或播放量推断喜好。

### 三级沉淀

| 层级 | 存放位置 | 何时进入 | 如何使用 |
|---|---|---|---|
| 当前内容事实 | 单条主生产记录 | 任何一次人工反馈或修改 | 只影响当前稿 |
| 待验证偏好 | 相关单条记录之间互链 | 相似反馈出现 2 次 | 下一条可作为明确实验，不默认当成定律 |
| 长期规则 | Skill / Playbook / evergreen workflow 唯一来源 | 跨不同内容稳定出现 2–3 次，且 Pengman 确认 | 以后生成时默认调用 |

每周复盘时，Codex 应列出“本周新增候选偏好 / 待验证规则 / 建议升级的长期规则”。没有证据时写“无”，不为了填表而创造学习结论。

## 默认反馈方式

Pengman 不需要每次提供完整改稿，也不需要填写固定表单。默认直接用自然语言说明，例如：

```text
开头太绕，直接说 Scorpio。第二段保留，CTA 删掉。
```

AI 必须自动转换成内部结构化记录：

- Pengman 原话；
- 保留、删除、改写和待确认部分；
- L1–L5 分类及理由；
- 当前内容要求、系列/账号规则或候选偏好；
- 是否需要退回 Brief；
- 修改后版本和是否待 Pengman 确认。

AI 不得要求 Pengman 重新按模板填写已经用自然语言表达清楚的反馈。只有当反馈会实质改变主题、受众、账号或核心承诺时，才追问必要的澄清。

如果 Pengman 愿意主动提供更结构化的反馈，可以使用：

```text
保留：
修改：
建议方向或改法：
修改原因：
适用范围：仅本稿 / 可记录为候选偏好
```

支持完整重写、局部改句、行内批注、要点建议和整体方向反馈。无论采用哪种方式：

- 不覆盖 `AI 初稿`。
- Pengman 的原话进入“Pengman 原始反馈”。
- AI 根据建议生成的版本进入“AI 根据人工建议生成的第二版”，不能伪装成“人工润色稿”。
- “人工润色稿”只保存 Pengman 实际写出的完整版本；Pengman 若确认采用 AI 版本，应标记为“AI 第 N 版，经 Pengman 确认”，不得伪装成人工撰写。
- Pengman 明确确认采用 AI 版本后，记录 `script_status: 已确认` 和 `confirmed_script_version`；即使没有完整人工稿，`content_stage` 仍保持 `selected`，实际开始制作时进入 `producing`。
- “不喜欢但暂时说不清”是当前稿弱信号，不自动成为候选偏好。

## 修改尺度：L1–L5

| 层级 | 修改范围 | 示例 | 是否退回 Brief | AI 如何记录 |
|---|---|---|---:|---|
| L1 | 事实、错字、语法、产品信息 | 修正星象、链接、产品能力 | 否 | 事实修正，不进入风格库 |
| L2 | 口吻、措辞、长度、自然度 | 更口语、更短、降低营销感 | 否 | 当前稿修改；明确或重复时才记候选偏好 |
| L3 | Hook、结构、顺序、节奏、CTA | 重写开头、交换段落、缩短 CTA | 通常否 | Hook/结构候选；若改变承诺则升级 L4 |
| L4 | 内容角度、用户问题、内容承诺、受众、账号或形式 | 从 toxic trait 改成自我保护教程 | 是 | 修订 Brief 和路由；不是普通润色 |
| L5 | 更换主题或形成新的独立内容资产 | 不做 Moon Toxic Traits，改做其他题目 | 是，新 Brief | 通常创建新 `content_id` |

L3 与 L4 的判断标准：用户问题、内容承诺或账号/形式路由只要发生实质变化，就退回 Brief。

## AI 收到反馈后的处理顺序

1. 完整保留原 `AI 初稿`。
2. 原样记录 Pengman 反馈，不替用户扩写成偏好。
3. 判断属于 L1–L5 哪一级，并说明理由。
4. 判断是否退回统一 Brief 和账号路由。
5. 判断继续使用原 `content_id` 还是创建新 ID。
6. 修订受影响的 Brief 字段。
7. 生成独立的“AI 根据人工建议生成的第二版”。
8. 区分当前内容要求、系列规则、账号/平台规则和个人表达偏好。
9. 没有 Pengman 完整人工稿且 Pengman 尚未确认任何 AI 版本时，保持 `content_stage: selected` 且 `script_status: 待确认`；若已明确确认采用 AI 版本，则标记 `script_status: 已确认` 并记录确认版本，`content_stage` 仍保持 `selected`。
10. 单次反馈不直接修改长期 Skill。

## content_id 边界

继续沿用原 `content_id`：

- 仍是同一待发布内容资产；
- 主题、系列集数和核心用户问题没有变；
- 新版本直接替换尚未生产发布的错误版本；
- 两个版本不会分别生产、发布或测试；
- 只是改 Hook、措辞、结构、CTA 或同一母稿的平台适配。

创建新 `content_id`：

- 主题、核心问题、受众或商业目标发生实质变化；
- 原方案与新方案都可能独立生产或发布；
- 需要作为 A/B 两个资产分别跟踪；
- 已从 L4 升级为新的独立选题，或属于 L5。

尚未发布而暂时不做的原稿使用 `content_stage: hold` 并记录原因和复查日期，不删除。`decision: 淘汰` 优先用于已经发布并经周报复盘后的结论，不能把“这次不想做”误写成永久偏好。

## 反馈类型与沉淀位置

| 反馈类型 | 主要影响 | 是否进入个人风格库 |
|---|---|---:|
| 事实错误 | 当前稿和事实源 | 否 |
| 单条特殊要求 | 当前生产记录 | 否 |
| 平台适配 | 当前版本或平台 SOP | 否 |
| 账号定位 | Brief、路由、Playbook | 否 |
| 系列定位和内容承诺 | 当前系列约束 | 否 |
| Pengman 个人表达偏好 | 当前稿候选偏好 | 达到门槛后才可能 |
| 选题判断 | Brief 和选题流程 | 否 |
| 商业目标变化 | Brief、CTA、策略 | 否 |

事实、产品信息、平台硬限制、合规、版权、单次活动、账号定位、系列承诺、选题取舍和业务目标，无论出现多少次都不进入个人写作风格库。它们应写入对应事实源、系列记录、SOP 或 Playbook。

## 候选偏好升级

- 出现 1 次：只记录候选偏好及来源。
- 出现 2 次：标记“待验证规则”，链接两条不同内容。
- 跨不同内容稳定出现 2–3 次：可以建议更新长期表达规则。
- 必须由 Pengman 确认后才修改长期 Skill。
- 每次长期更新保留来源、旧规则、新规则、修改理由和日期。

## 单条生产记录应保留的证据

1. AI 初稿；
2. Pengman 原始反馈；
3. L1–L5 分类；
4. 是否退回 Brief；
5. `content_id` 处理理由；
6. AI 根据建议生成的第二版；
7. Pengman 人工润色稿或明确确认；
8. 修改差异和分类；
9. 候选偏好、系列约束及是否建议长期更新。
