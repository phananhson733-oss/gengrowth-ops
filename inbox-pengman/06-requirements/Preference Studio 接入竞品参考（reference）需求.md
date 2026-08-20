---
title: Preference Studio 接入竞品参考（reference）需求
project: astrologywiki
type: automation-requirements
status: draft
owner: Pengman
assignee: 待定
priority: P1
updated: 2026-08-19
---

# Preference Studio 接入竞品参考（reference）需求

## 本轮目标

让 Preference Studio 在生成偏好训练候选时，能自动参照 `02-生产/01-reference/`（以及候选与热点研究目录）中的竞品研究内容，把竞品机制作为候选里的一个待测变量。**不改 Social OS**；只改 Preference Studio 与 reference 的关联。

核心意图（Pengman 原话）：让 Preference Studio 和 reference 关联起来，但目前两条链在 Studio 处是断开的；且 Pengman 记不住具体哪个竞品是哪个，因此**不做手动勾选/开关**，改为自动关联 + 靠沉淀的人工确认把关。

## 一、当前问题

### 1. Studio 看不到 reference 中的竞品研究

`tools/content-preference-studio/server/local-api.mjs` 中，`WORKSPACE_CONTEXT_FILES` 写死了 3 个文件：

- `skills/astrologywiki-social-workflow/SKILL.md`
- `02-生产/01-reference/AstrologyWiki 社媒账号分工与内容发布指南.md`
- `02-生产/00-evergreen-workflows/weekly-rolling-content-production-sop.md`

这 3 个文件之外的内容（尤其是新增的竞品研究，如 `02-生产/01-reference/竞品账号研究-zodiasign-Zodiac-Vibes.md`）不会被读取。因此 Studio 生成候选时完全不参考竞品。

### 2. 手动勾选/开关不现实

Pengman 记不住每个竞品文件具体是哪个，因此**不做"勾选竞品清单"或"每轮开关"这类需要用户主动识别竞品的交互**。需要自动把 reference 里的竞品研究喂进候选，用户无需记住来源。

### 3. 目前已有安全阀，风险可控

Preference Studio 已有沉淀确认机制：竞品机制只是候选里的一个变量，用户选不选才决定是否累积证据；证据需 3 次一致且至少 2 次说明理由，再由用户确认后才写入正式 Skill。因此**自动接入竞品不会失控**，不需要额外加"沉淀开关"。

## 二、修改需求

## P1-1：Studio 自动读取 reference 中的竞品研究文件

### 读取来源

在现有 `WORKSPACE_CONTEXT_FILES` 基础上，**增加对竞品研究文件的自动读取**。来源包括（按优先级）：

1. `02-生产/01-reference/` 下的竞品研究类文件（文件名含"竞品""脚本调研""研究"等，或新约定的前缀，如 `竞品账号研究-`）；
2. `01-调研资料/候选与热点研究/` 下的竞品/Hot 研究文件（如需要）。

### 读取规则

- 不把整个 reference 文件夹全量灌入（会太杂）；只读取**竞品研究类**文件，且按"最近更新/最近新增"优先，最多取 N 个（建议 N=2~3，实现时给常量）。
- 对每个竞品文件，只提取对生成候选有用的部分（脚本结构、Hook 模式、可借鉴机制），不做全文搬运。
- 读取失败的竞品文件要记录 `readable: false`，不静默跳过也不报错中断（与现有 3 个文件的容错一致）。

### 上下文呈现

- 在返回给前端的 `sources` 中追加竞品来源，标 `readable` / `updatedAt`。
- 前端 `workspace-context-banner` 的"已读取 X/Y 份权威资料"计数会随之增加，用户能看到"本轮参考了竞品研究"。

## P1-2：生成候选时把竞品机制作为一个待测变量

### 生成提示词要求

在生成 4 个候选的 prompt 中，增加一条规则：

> 4 个候选中，**至少 1 个**可借鉴当前竞品研究里出现过的机制/结构（例如 zodiasign 的"身份认领续看钩子""他们 X 但 Y"对立句、警告式收尾等）。只借鉴结构机制，**不得复制竞品的句子、措辞、人物素材或视觉**。

约束：

- 竞品机制作为**一个可测变量**，与"我们原有写法"成对出现，保证对照可解释（不要 4 个全抄竞品）。
- 竞品机制只影响候选的 `angle` / `testedVariable`，不直接覆盖 Hook 偏好、安全线、账号定位或当前任务约束。
- 不复制竞品原文；若候选角度来自竞品，在 `angle` 中标注"参考了竞品机制"（后台记录即可，不要求用户记忆）。

### 候选呈现（前端）

- 沿用现有 4 卡片（A/B/C/D）交互，用户操作不变：看卡片 → 选最好/最坏 → 提交。
- 在借鉴了竞品机制的候选卡片 `angle` 字段自动标注来源（如 `角度：zodiasign 的"身份认领续看钩子"结构`），用户无需主动识别，但后台留痕。

## P1-3：沉淀逻辑保持不变（不加"沉淀开关"）

- 竞品机制经用户选择累积证据，沿用现有证据状态：`candidate → testing → proposed → confirmed`。
- 达到 `proposed` 后仍由 Pengman 在页面确认，确认后才写入正式 Skill。
- **不加**"是否沉淀"的开关；沉淀把关继续由用户确认环节承担。

## 三、本轮不修改

- **不改 Social OS**：Social OS 已能自行读 reference，本次完全不碰它的 runner / Skill / 配置。
- 不加"每轮开关竞品上下文"的 UI 控件。
- 不加"勾选竞品清单"的 UI。
- 不把竞品内容直接写进偏好档案或偏好规则（竞品机制属 `selection` 类信号，不混入 `expression` 个人表达偏好）。
- 不改沉淀证据阈值（仍为 3 次一致 + 2 次理由 + 用户确认）。
- 不要求用户记住或识别任何竞品来源。

## 四、验收方式

用 Preference Studio 手动测试一轮：

### 测试 A：竞品上下文被读取

1. 打开面板，`workspace-context-banner` 显示竞品来源已读取（计数增加，且能看到竞品标签）。
2. 竞品文件存在时，返回的 `contextReceipt.sources` 包含竞品条目且 `readable: true`。

### 测试 B：候选包含竞品机制

1. 生成一轮 4 个候选，至少 1 个候选的 `angle` / `testedVariable` 体现竞品机制，并标注来源。
2. 该候选**不含**竞品原文句子（人工抽查）。
3. 其余候选仍为"我们原有写法"，存在可对照的对照组。

### 测试 C：沉淀不受影响

1. 提交一轮选择后，证据状态仍按 `candidate` 累积，没有自动写进 Skill。
2. 面板"偏好档案"中的信号类型仍正确归类（竞品相关为 `selection`，不混入 `expression`）。

### 测试 D：容错

1. 临时让竞品文件路径不可读，Studio 不崩溃，`sources` 中该条标 `readable: false`，其余功能正常。

以上测试通过，即可认为本轮需求完成。

## 五、给实现者的优先级

1. **先做 P1-1**：在 `WORKSPACE_CONTEXT_FILES` / `readWorkspaceContext` 中加入竞品研究文件读取（含容错与计数）。
2. **再做 P1-2**：在生成 prompt 中加入"至少 1 个候选借鉴竞品机制、只借鉴结构不复制句子、标注来源"。
3. **验证 P1-3**：确认沉淀逻辑未受影响（不改代码，仅验证）。

本轮完成标准不是"模型声称参考了竞品"，而是**代码实际读取了竞品文件、候选实际包含竞品机制且可对照、沉淀仍由用户确认把关**。
