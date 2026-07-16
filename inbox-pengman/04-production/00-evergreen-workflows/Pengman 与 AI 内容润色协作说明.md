---
title: Pengman 与 AI 内容选择、润色与学习协作说明
project: astrologywiki
type: human-ai-content-workflow
status: active
owner: Pengman
updated: 2026-07-16
---

# Pengman 与 AI 内容选择、润色与学习协作说明

> 本文是 Pengman 与 AI 进行双模型内容实验、候选选择、反馈、改稿、差异学习和规则升级的唯一详细协作规范。生产记录使用 [[inbox-pengman/04-production/00-evergreen-workflows/内容生产与学习记录模板]]；Brief 字段和 `content_id` 口径见 [[inbox-pengman/04-production/00-evergreen-workflows/统一内容 Brief 模板]]。

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
content_format:
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
| 实验包已冻结 | `Brief` | `ready` |
| 两个模型生成中 | `AI 初稿` | `generating` |
| 等待 Pengman 比较 | `AI 初稿` | `awaiting_comparison` |
| 已选择但组合稿待确认 | `等待人工润色` | `selected_pending_confirmation` |
| Pengman 明确确认最终稿 | `待制作` | `closed` |
| 两个版本均否决 | `Brief` | `rejected_returned_to_brief` |

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

## 默认反馈方式

Pengman 不需要每次提供完整改稿。日常可以直接在聊天或生产记录中提供：

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
- Pengman 明确确认采用 AI 版本后，记录 `script_status: 已确认` 和 `confirmed_script_version`；即使没有完整人工稿，也可进入 `content_stage: 待制作`。
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
9. 没有 Pengman 完整人工稿且 Pengman 尚未确认任何 AI 版本时，保持 `content_stage: 等待人工润色`；若已明确确认采用 AI 版本，则标记 `script_status: 已确认`，记录确认版本并进入 `content_stage: 待制作`。
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

尚未发布而暂时不做的原稿使用 `content_stage: 暂停` 并记录原因，不删除。`decision: 淘汰` 优先用于已经发布并经周报复盘后的结论，不能把“这次不想做”误写成永久偏好。

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
