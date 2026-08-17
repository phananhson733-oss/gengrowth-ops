---
title: Miraa 候选 Hook 上下文加载修复提案
project: astrologywiki
type: workflow-change-proposal
status: blocked_pending_pm_or_hermes_apply
owner: Pengman
created: 2026-08-17
scope: social-pipeline Hook context and H3 Hook rewrite only
content_generation_performed: false
---

# Miraa 候选 Hook 上下文加载修复提案

## 1. 当前状态

本提案修复 `prepare-context --for-command research` 的候选 Hook 上下文，并增加一个受控的 H3 Hook 重写入口。它不生成脚本、不改变人工选择或内容生命周期，也不重跑本轮 `research`。

本轮成功生成候选时的运行证据：

- `context_status=attested`
- `context_pack_hash=sha256:1e6ab5af04d9eacfedfd17fc8329af31f4c56e03e57b890e39c3cda054a9ccb4`
- `historical_samples_read=[]`
- `reviewer_mode=not_run`
- Product Rules 的 research 选段只有 §5、§7、§9、§12；没有 §8 Copy Style / §8.1 Pengman Hook 偏好正文。
- `prompt-package-spec` 与 `humanizer` 因 `not_required_for_research` 被过滤。
- `competitor-analysis` 为 `invoked=false / not_loaded`。

结论：研究证据门已加载，但候选 Hook 的风格、人工偏好、近期样本和竞品 Hook 机制没有形成可审计的完整冻结包。

## 2. 权威输入

### 2.1 产品 Copy Style / Hook 正文规则

路径：

`/Users/awayer_mini/gengrowth-ops/inbox-pengman/skills/astrologywiki-social-workflow/SKILL.md`

必须注入的选段：

- `8. Copy Style`
- `8.1 Pengman 的 Hook 与白纸重写偏好`

实际需要执行的规则包括：

- 正式 title / angle / Hook 使用自然美式英语；
- 首句先给身份、行为、冲突或结果；
- 单人口播 Hook 宽、直、容易认领，具体窄场景默认进入正文；
- 双人口播只使用 `question_first` 或 `verdict_echo`；
- 双人口播的 `选题审批.hook` 只保存第一人的第一句；
- 避免抽象标签、治疗话术、AI 总结句、工整对偶和未经确认的过窄场景；
- 通过“谁 / 什么行为或冲突 / 为什么与观众有关”的 2–3 秒检查。

### 2.2 Pengman 偏好与学习边界

路径：

`/Users/awayer_mini/gengrowth-ops/inbox-pengman/02-生产/00-evergreen-workflows/Pengman 与 AI 内容润色协作说明.md`

建议注入选段：

- `持续学习闭环`
- `每次写稿前的学习包`
- `默认反馈方式`
- `修改尺度：L1–L5`
- `候选偏好升级`

同时必须读取 Pengman 的实际偏好档案：

`/Users/awayer_mini/gengrowth-ops/inbox-pengman/skills/learn-content-preferences/references/pengman-preference-profile.md`

使用边界：

- `已确认长期规则` 可以作为本轮 Hook 的硬约束；
- `待验证偏好` 与 `单次证据` 只能作为弱提示，不能被自动升级成长期规则；
- 不存在已确认偏好时，优先遵守产品 Skill 的 §8.1，而不是从播放量或单个最终稿猜测偏好。

必须执行的边界：

- 只从 Pengman 真实保留、删除、改写和确认的证据学习；
- 不从最终稿或播放量反推个人偏好；
- L3 Hook 修改只在有证据时进入候选偏好；
- 单次反馈不升级长期规则；跨不同内容重复 2–3 次且 Pengman 确认后才可升级；
- 每次写稿前记录使用了哪些样本、学了什么、哪些机制不可照抄。

### 2.3 近期已发布与待发布样本

选择规则必须是动态的，不能在 config 中永久写死文件名。

权威目录：

- `/Users/awayer_mini/gengrowth-ops/inbox-pengman/02-生产/02-content-production/已发布/`
- `/Users/awayer_mini/gengrowth-ops/inbox-pengman/02-生产/02-content-production/未发布/`

重要：目录名不能代替状态。必须读取 frontmatter 的 `content_stage`；例如 `aw-scorpio-space-or-done-dualhost-02.md` 虽位于 `未发布/`，其 frontmatter 已是 `published`。

Miraa research 每次冻结：

- 最近 2 条已发布、同账号且存在明确 Hook / Pengman 确认或人工修改证据的样本；
- 最近 2 条未发布、同账号且 `content_stage in [selected, producing, ready]`、Hook 非空的样本；
- 同时覆盖与本轮候选相关的 `AI Host` / `Dual AI Host` 形式；若某形式不存在，明确记录缺失，不从其他账号凑数。

首轮可用于验收的真实文件：

1. `/Users/awayer_mini/gengrowth-ops/inbox-pengman/02-生产/02-content-production/已发布/aw-scorpio-private-access-aihost-12.md`
   - 已确认最终 Hook；包含 Pengman 确认、初始 Hook 与最终 Hook 差异。
2. `/Users/awayer_mini/gengrowth-ops/inbox-pengman/02-生产/02-content-production/已发布/aw-scorpio-virgo-pair-01.md`
   - 已确认压缩 Hook；包含 Claude 初稿、GPT 压缩建议和 Pengman 最终确认。
3. `/Users/awayer_mini/gengrowth-ops/inbox-pengman/02-生产/02-content-production/未发布/aw-scorpio-wife-clear-answer-dualhost-03.md`
   - `selected`；确认 `question_first` 与第二人回应方向。
4. `/Users/awayer_mini/gengrowth-ops/inbox-pengman/02-生产/02-content-production/未发布/aw-scorpio-space-or-done-dualhost-02.md`
   - frontmatter 为 `published`；确认双人口播短问句 Hook。选择器必须按 frontmatter 归类，不能按目录归类。

每个样本只注入候选生成所需字段：

- path / content_id / account_handle / format / content_stage / updated / published_at；
- initial_hook（若有）、final_hook、Pengman 原始反馈或明确确认；
- Hook 差异结论、`decision / next_test`（存在时）；
- 不注入整份长脚本，避免上下文膨胀。

### 2.4 竞品 Hook 参考

至少注入 1–2 条与本轮账号 / 形式相关、已完成公开取证的竞品机制参考；只能学习结构，不复制措辞。

首轮固定验收文件：

1. `/Users/awayer_mini/gengrowth-ops/inbox-pengman/02-生产/01-reference/Scorpio-has-zero-friends-脚本调研.md`
   - 注入 `Hook`、`留存机制分析`、`可复用脚本公式`、`使用建议`；
   - 可学：短身份判断、认知反差、单一矛盾、行为验证；
   - 不可学：绝对化事实、原句、人物、素材、无法核验的因果。
2. `/Users/awayer_mini/gengrowth-ops/inbox-pengman/02-生产/01-reference/Who’s Aquarius’ soulmate脚本调研.md`
   - 注入 `开场原文短摘录`、`Hook 分析`、`Script 结构`、`可以改进的地方`；
   - 可学：短问句、身份筛选、信息缺口、排除常见答案；
   - 不可学：确定性 soulmate 承诺、过晚揭晓、原始措辞。

竞品 reference 必须在 trace 中记录源文件路径、源 Hash、注入选段 Hash、允许借鉴机制和禁止照抄项。

## 3. product-config.yaml 变更要求

目标文件：

`/Users/awayer_mini/.hermes/profiles/social/skills/social-media/social-pipeline-astrologywiki/product-config.yaml`

### 3.1 扩展 Product Rules research 选段

将 research 的 `product_rules.include_sections` 从：

```yaml
research:
  - "5. Three Candidate Sources"
  - "7. Topic and Safety Rules"
  - "9. Candidate Research Workflow"
  - "12. Production and Learning Boundary"
```

改为：

```yaml
research:
  - "5. Three Candidate Sources"
  - "7. Topic and Safety Rules"
  - "8. Copy Style"
  - "8.1 Pengman 的 Hook 与白纸重写偏好"
  - "9. Candidate Research Workflow"
  - "12. Production and Learning Boundary"
```

### 3.2 增加必需规则文件

建议在 `skill_manifest.rules` 增加：

```yaml
- name: pengman-hook-preferences
  path: /Users/awayer_mini/gengrowth-ops/inbox-pengman/02-生产/00-evergreen-workflows/Pengman 与 AI 内容润色协作说明.md
  required_for: [research]
  include_sections:
    research:
      - "持续学习闭环"
      - "每次写稿前的学习包"
      - "默认反馈方式"
      - "修改尺度：L1–L5"
      - "候选偏好升级"

- name: pengman-content-preference-profile
  path: /Users/awayer_mini/gengrowth-ops/inbox-pengman/skills/learn-content-preferences/references/pengman-preference-profile.md
  required_for: [research]
  include_sections:
    research:
      - "已确认长期规则"
      - "待验证偏好"
      - "单次证据"
      - "使用边界"

- name: competitor-hook-scorpio-zero-friends
  path: /Users/awayer_mini/gengrowth-ops/inbox-pengman/02-生产/01-reference/Scorpio-has-zero-friends-脚本调研.md
  required_for: [research]
  include_sections:
    research:
      - "5. 口播内容拆解"
      - "6. 留存机制分析"
      - "8. 可复用脚本公式"
      - "10. 使用建议"

- name: competitor-hook-question-first
  path: /Users/awayer_mini/gengrowth-ops/inbox-pengman/02-生产/01-reference/Who’s Aquarius’ soulmate脚本调研.md
  required_for: [research]
  include_sections:
    research:
      - "开场原文短摘录"
      - "Hook 分析"
      - "Script 结构"
      - "可以改进的地方"
```

若 heading 解析器要求精确层级名称，实施方必须先用只读解析验证；不得把“章节找不到”静默降级成加载全文或跳过。

### 3.3 增加动态样本配置

当前 manifest 只能列静态文档；近期样本必须由 runner 动态选择。建议新增受 schema 约束的配置：

```yaml
hook_context:
  required_for: [research]
  accounts: ["@miraaastrology"]
  published_sample_count: 2
  pending_sample_count: 2
  sample_roots:
    - /Users/awayer_mini/gengrowth-ops/inbox-pengman/02-生产/02-content-production/已发布
    - /Users/awayer_mini/gengrowth-ops/inbox-pengman/02-生产/02-content-production/未发布
  competitor_reference_names:
    - competitor-hook-scorpio-zero-friends
    - competitor-hook-question-first
  max_sample_chars_each: 4096
  max_total_chars: 16384
```

不得依赖任意 glob 顺序；排序键建议为：

1. `account_handle=@miraaastrology`；
2. 与候选 format / topic 的相关度；
3. frontmatter `content_stage`；
4. `published_at` 或 `updated` 倒序；
5. `content_id` 作为稳定 tie-breaker。

### 3.4 Skill 更新自动生效

Pengman 更新工作区中的 Skill、偏好档案或被配置的参考文件后，下一次 Social OS 候选 Hook 生成必须使用新版本，不能继续复用旧上下文包。

要求：

1. 每次 `prepare-context` 都重新读取已配置文件并计算当前 `source_sha256`；
2. 若当前 Hash 与任何可复用的旧 context receipt 不同，旧 receipt 自动失效，必须重新 prepare 并 attested；
3. trace 同时记录文件路径、当前 source Hash、注入 Hash 与 context 准备时间；
4. §8 / §8.1 的 heading 改名、移动或无法解析时必须明确报错，不能静默跳过、加载旧缓存或退化为全文；
5. 不要求 Pengman 每次改 Skill 后手动同步配置或重复长 Prompt。只要路径和 heading 未变，下一次生成自动采用新内容。

## 4. runner 变更要求

目标：`prepare-context --for-command research` 在签发 context receipt 前构建并校验 `hook_context`。

必须实现：

1. 读取并注入 Copy Style / Hook 选段；
2. 读取 Pengman 偏好文件的指定选段；
3. 动态选择并压缩近期 published / pending 样本；
4. 读取竞品 Hook reference 指定选段；
5. 所有输入写入冻结 context pack，并由完整 pack Hash 绑定 context receipt；
6. `research` 必须验证同一 pack Hash 已 `attested`；
7. 任一必需类别缺失时 fail closed，错误码建议：`HookContextIncomplete`；
8. 不允许调用方在 payload 中自报 trace 或伪造“已读样本”。

## 5. execution_trace 验收契约

成功的 `prepare-context` / `research` trace 必须分别证明四类输入：

```json
{
  "hook_context": {
    "status": "resolved",
    "copy_style": {
      "path": ".../astrologywiki-social-workflow/SKILL.md",
      "sections": ["8. Copy Style", "8.1 Pengman 的 Hook 与白纸重写偏好"],
      "source_sha256": "...",
      "injected_sha256": "..."
    },
    "pengman_preferences": {
      "path": ".../Pengman 与 AI 内容润色协作说明.md",
      "sections": ["持续学习闭环", "每次写稿前的学习包", "默认反馈方式", "修改尺度：L1–L5", "候选偏好升级"],
      "source_sha256": "...",
      "injected_sha256": "..."
    },
    "pengman_preference_profile": {
      "path": ".../pengman-preference-profile.md",
      "source_sha256": "...",
      "injected_sha256": "...",
      "confirmed_rules_count": 0,
      "testing_signals_count": 0
    },
    "recent_samples": [
      {
        "path": "...",
        "content_id": "...",
        "account": "@miraaastrology",
        "format": "...",
        "content_stage": "published|selected|producing|ready",
        "selection_reason": "recent_published|recent_pending|format_match|topic_match",
        "source_sha256": "...",
        "injected_sha256": "..."
      }
    ],
    "competitor_hook_references": [
      {
        "path": "...",
        "sections": ["..."],
        "source_sha256": "...",
        "injected_sha256": "...",
        "reuse_boundary": "mechanism_only_no_wording_copy"
      }
    ]
  }
}
```

同时保留并填充现有字段：

- `skills_loaded`
- `rules_loaded`
- `historical_samples_read`：不得再为空；每条必须有 path / content_id / source Hash / injected Hash / selection reason。
- `optional_decisions`
- `context_status=prepared|attested`
- `context_pack_hash`

只记录文件名但没有 Hash，不算加载证明；只有 `prepared` 没有后续 `attested`，不算进入成功的候选生成调用。

## 6. fail-closed 门

对 `@miraaastrology + Mode B/C + research`：

- Copy Style / Hook 正文缺失 → 不签发 receipt；
- Pengman 偏好文件缺失或章节不可读 → 不签发 receipt；
- `pengman-preference-profile.md` 缺失或章节不可读 → 不签发 receipt；
- 没有至少 1 条已发布和 1 条待发布、同账号样本 → 不签发 receipt，并列出具体缺口；
- 竞品 Hook 参考为空或只拿到 metadata → 不签发 receipt；
- context pack 超限 → 不截断关键类别，返回各类别字节数与压缩建议；
- 样本只有最终稿、没有明确人工反馈时，允许作为账号/系列样本，但必须标 `preference_evidence=false`，不得称为 Pengman 偏好证据。

上述四类输入之外，Pengman 偏好档案也必须有精确路径与 source/injected Hash；否则 `hook_context.status` 不得为 `resolved`。

## 7. 只读验收步骤

实施后只运行以下只读动作，不运行 `research`：

1. `social_pipeline.py validate --config <AstrologyWiki config>`；
2. 对已有 Miraa receipt 运行 `prepare-context --for-command research --mode B --account @miraaastrology --week 2026-W34 ...`；
3. 检查 `context_envelope.execution_trace.hook_context.status=resolved`；
4. 检查 Copy Style、协作说明、`pengman-preference-profile.md`、近期 published/pending 样本、竞品 Hook reference 均有精确路径与 source/injected Hash；
5. 检查 `historical_samples_read` 非空；
6. 不消费 context receipt，不调用 `research`，不写 Sheet。

## 8. 回归测试

至少增加以下测试：

1. research manifest 未含 §8 / §8.1 时，Miraa Mode B/C fail closed；
2. 偏好文件不存在或 heading 漂移时 fail closed；
3. 动态样本按 frontmatter 状态，而不是目录名分类；
4. 已发布和待发布样本任一为空时 fail closed；
5. 非 Miraa 账号样本不能混入；
6. 只有最终稿、无人工确认的样本不得标记为偏好证据；
7. 竞品参考只注入结构机制与风险边界；
8. trace 分别列出四类输入的 path、source Hash、injected Hash；
9. pack 超限不截断关键类别；
10. 只运行 `prepare-context` 不写 Google Sheet；
11. `research` 只有在新 hook context 的 context receipt 被 attested 后才允许写候选。
12. 修改 §8.1、偏好档案或任一已配置参考文件后，下一次 `prepare-context` 产生新的 source Hash 与 context pack Hash；旧 attestation 不能被复用。
13. §8.1 heading 无法解析时返回明确错误，不能静默退化成旧缓存、全文或无 Hook 规则生成。

## 9. H3 Hook 受控重写入口（P0）

本次还需要一个最小的受控入口，供 Pengman 在上下文修复并验收后，重写已存在但尚未人工选择的候选 Hook。

范围：

- 输入必须是 Pengman 显式指定的 `content_id` 列表；
- 只处理 `@miraaastrology` 且 `selection_status` 为空的 H3 未选候选；
- 已标记 `dropped`、已人工选择或已进入生产记录的内容一律拒绝修改；
- 只允许写入候选行的 `hook` 字段；不得改 `title`、`angle`、证据字段、`selection_status`、`content_stage`、脚本、排期或生产记录；
- 生成前必须使用本提案定义的、已 attested 的最新 `hook_context`；
- 返回每条的旧 Hook、新 Hook、2–3 秒自检结果和未通过原因；不自动把候选标为 passed / dropped，最终取舍仍由 Pengman 决定。

建议分为两个明确动作：

1. `preview-hook-rewrite`：只读生成预览，不写 Sheet；
2. `apply-hook-rewrite`：只对 Pengman 在预览后显式确认的 `content_id` 写入 Hook。

这不是新的生命周期或状态系统，只是受限编辑现有 H3 `hook` 单元格的能力。

## 10. 实施优先级、权限与交接

### P0：本次必须完成

1. 注入 `8. Copy Style` 和 `8.1 Pengman 的 Hook 与白纸重写偏好`；
2. 注入 Pengman 协作说明中的学习边界与 `pengman-preference-profile.md`；
3. 每次生成重新读取 Skill / 偏好 / 参考文件，Skill 更新自动产生新的 context pack；
4. 在 trace 中证明所有关键输入实际被注入；
5. 实现本节定义的 H3 Hook 预览与受控写回入口；
6. 先完成只读验收，再允许候选 Hook 生成或重写。

### P1：可在 P0 跑通后补充

- 更精细的动态样本相关度排序；
- 扩展更多竞品参考；
- 本提案第 8 节中的完整回归测试覆盖。

Social Bot 当前预授权只允许经 runner 执行业务命令，明确禁止修改 Skill、product config、runner 或正式知识库。因此本轮只形成修复提案，没有修改：

- `social-pipeline-astrologywiki/product-config.yaml`
- `social-pipeline-core/scripts/*`
- 任一 `SKILL.md`
- Google Sheet
- 已生成候选

需要 PM / Hermes 维护角色应用变更并执行 §7 的只读验收。修复验证前，建议暂停新的 Miraa Mode B/C 候选生成。
