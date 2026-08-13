---
title: Social OS 分层 Skill 写作与 Hook 锁定修改需求
project: astrologywiki
type: automation-requirements
status: draft
owner: Pengman
assignee: 彪哥
priority: P0
updated: 2026-08-13
---

# Social OS 分层 Skill 写作与 Hook 锁定修改需求

## 本轮目标

不重做 Social OS 的表格、状态机和人工审批流程，只修正内容生成链路中的三个问题：

1. 生成选题和脚本时，必须实际读取对应的分层 Skill 与产品配置，不能只靠通用 Prompt 写作；
2. H3 已确认的 `hook` 必须逐字成为每个 Script 的第一条非空口播句；
3. 不把一个产品的内容能力锁死在单个 Skill 上，允许按任务加载“产品入口 + 通用流程 + 产品内容规则 + 可选审稿 Skill”。

---

## 一、当前问题

### 1. 无法核验 Social OS 本轮实际使用了哪些 Skill

Social OS 设计中会使用：

- `social-pipeline-astrologywiki`：产品入口和模式判断；
- `social-pipeline-core`：通用状态、证据、人工门和写表规则；
- `astrologywiki-social-workflow`：账号路由、Route、安全、Hook 和文案规则；
- `product-config.yaml`：当前产品、市场、语言、账号、产能和工具参数；
- `humanizer`：已选题后的脚本自然度审查；
- `competitor-analysis`：用户明确要求分析竞品链接时按需调用。

但当前产物没有可靠记录本轮实际加载的 Skill、版本、规则文件和历史样本，因此无法区分：

- Skill 已真实加载并执行；
- 只在系统 Prompt 中提到了 Skill；
- Skill 读取失败后静默使用通用模型生成；
- 只做了 checklist，没有实际运行审稿 Skill。

### 2. `title` 与 `hook` 可能漂移

`title` 是内部识别标题，`hook` 是 H3 人工锁定的公开首句，两者不能互相代替。

当前 `status --content-id` 没有稳定返回权威 `hook`，导致 Script 可能把 `title` 当成首句，或在写稿阶段重新生成 Hook。

### 3. 单个 Skill 无法覆盖完整写作链路

产品入口 Skill、通用流程 Skill、产品内容规则和 Humanizer 的职责不同。如果 runner 只允许锁定或保存一个 Skill：

- 只用入口 Skill，会缺少具体文案规则；
- 只用通用 Core，会生成泛化内容；
- 只用产品内容 Skill，会缺少 H0–H5、写表和审批约束；
- 只用 Humanizer，只能润色，不能解决选题和账号路由。

因此需要支持分层 Skill 清单，而不是一个 `skill` 字段覆盖全部能力。

---

## 二、修改需求

## P0-1：增加分层 Skill 加载清单

每次执行 `research / script / package` 前，runner 根据产品和任务模式解析本轮 Skill 清单。

建议结构：

```yaml
skill_manifest:
  entry:
    name: social-pipeline-astrologywiki
    version: "..."
  core:
    name: social-pipeline-core
    version: "..."
  product_rules:
    name: astrologywiki-social-workflow
    version: "..."
  reviewers:
    - name: humanizer
      version: "..."
      required_for: script
  optional:
    - name: competitor-analysis
      version: "..."
      invoked: false
```

### 加载规则

#### `research` 生成候选时必须加载

- 产品入口 Skill；
- 通用 Core Skill；
- `product-config.yaml`；
- 产品内容规则 Skill；
- Social OS 当前产品定位、账号、证据、假设、基线、库存和产能。

`humanizer` 不作为候选研究的必经 Skill。

#### `script` 写口播稿时必须加载

- 产品入口 Skill；
- 通用 Core Skill；
- `product-config.yaml`；
- 产品内容规则 Skill；
- H3 锁定变量；
- 同账号、同形式最相关的 1–3 条历史样本；
- 已确认的人工修改偏好；
- Humanizer 或配置中指定的等价审稿规则。

#### `package` 生成文案包时必须加载

- 当前唯一 Script；
- H3 Hook；
- 产品和账号规则；
- Caption、Hashtag、CTA 和产品承接规则；
- H4 自动检查规则。

### 失败处理

以下任一必需输入读取失败时，停止生成并报告具体缺失项：

- 产品入口 Skill；
- Core Skill；
- 产品内容规则 Skill；
- 产品配置；
- H3 锁定字段。

不得静默退化为泛用写作 Prompt。

---

## P0-2：记录本次实际 Skill 调用证据

每次 `research / script / package` 完成后，写入机器审计信息：

```yaml
execution_trace:
  command: script
  content_id: "..."
  skills_loaded:
    - name: social-pipeline-astrologywiki
      version: "..."
      status: loaded
    - name: social-pipeline-core
      version: "..."
      status: loaded
    - name: astrologywiki-social-workflow
      version: "..."
      status: loaded
  product_config_version: "..."
  rules_loaded: []
  historical_samples_read: []
  reviewer_mode: skill | checklist | not_run
  reviewer_name: humanizer
  reviewer_version: "..."
```

要求：

- 记录真实加载结果，不记录计划调用或模型自述；
- `humanizer` 没有真实运行时，不得写 `skill`；
- 如果只按规则人工检查，写 `reviewer_mode: checklist`；
- 审计信息由机器写，用户不需要手工填写；
- 在 `status --content-id` 中可以查看精简版调用记录。

---

## P0-3：H3 Hook 必须成为 Script 首句

### 权威关系

```text
选题审批.hook
= H3 锁定 Hook
= 口播稿第一条非空句
```

`title` 仅用于内部识别，绝不能作为缺失 Hook 时的替代值。

### runner 修改

1. `status --content-id` 必须返回：
   - `title`
   - `hook`
   - `angle`
   - `why_now`
   - `selection_status`
   - `content_format`
   - `production_tool`
2. `script` 执行前重新从 Sheet 回读 H3 的 `hook`；
3. H3 没有 Hook 时拒绝写稿；
4. Script 第一条非空句逐字使用该 Hook；
5. 写入前和写入后各校验一次；
6. `package` 再校验一次；
7. 自动检查中增加 `hook_match=ok/failed`；
8. `hook_match!=ok` 时不得进入 `ready_to_paste=true`。

### 文本比对

允许在比对前统一处理：

- 首尾空格；
- 多余空行；
- 直引号和弯引号；
- 经确认不影响口播的末尾句号。

不允许：

- 同义改写；
- 缩短或扩写；
- 把 `title` 当 Hook；
- 在 Hook 前增加铺垫；
- 写稿时重新生成并自动替换 H3 Hook。

### Hook 修改后的失效规则

H3 Hook 被人工修改后：

- 旧 Script 标记为 stale；
- 旧 Package 标记为 stale；
- 旧 H4 审批和 `approved_script_hash` 失效；
- 必须重新运行 `script`、`package` 和 H4 审批。

---

## P0-4：解决“锁定单个 Skill”问题

Social OS 不使用单一 `skill_name` 作为本轮全部内容能力来源，改为可配置的 `skill_manifest`。

### 分层职责

| 层级 | 职责 | 是否可被下层覆盖 |
|---|---|---|
| Entry Skill | 产品识别、Sheet、模式和产品路由 | 不复制 Core 流程 |
| Core Skill | 状态机、H0–H5、证据、Schema、runner 权限 | 产品 Skill 不得绕过 |
| Product Rules Skill | 账号、Route、安全、Hook、Copy Style | 可按产品替换 |
| Reviewer Skill | Humanizer、平台审稿等专项检查 | 按任务追加 |
| Optional Skill | 竞品分析等按需能力 | 没触发时不加载 |

### 配置要求

- 新产品可以替换 Entry Skill、Product Rules Skill 和产品配置；
- Core Skill 与 runner 不复制；
- 一个任务可以加载多个 Reviewer；
- Skill 名称、路径和版本不要写死在业务代码中；
- 人工在配置中更换 Skill 后，不需要修改 Sheet Schema 或重做 runner；
- 产品 Skill 不得覆盖人工审批列、H0–H5 或 runner 安全规则。

---

## P0-5：Miraa 候选生成前增加英语社区话题调研

为 `@miraaastrology` 执行 Mode B 周一候选研究或 Mode C 补库/重排时，不能从产品定位直接生成标题和 Hook。必须先读取 `astrologywiki-social-workflow/references/community-topic-research.md`，完成英语社区话题研究，再进入候选生成。

### 执行顺序

```text
读取产品、账号、库存、产能和历史结论
→ 完成固定竞品索引与实时来源门
→ 实际打开英语社区帖子、讨论页和评论
→ 形成 Research receipt、话题分层、生活细节库、语言库和来源清单
→ source-ingest 写入可用证据
→ social_pipeline.py research 生成候选
→ 停在 H3 等待人工选择
```

### 最低要求

- 尝试 Reddit、X、Quora、TikTok/YouTube 公开讨论和其他相关英语社区；
- 搜索摘要、标题和页面元数据只能用于发现来源，不能作为帖子正文证据；
- 优先最近 90 天，其次最近 12 个月；更早内容只能说明长期重复；
- 至少形成 5 个有直接来源支持的不同讨论点，证据足够时目标 8–12 个；
- 每个讨论点记录具体生活场景、讨论度证据、跨平台情况、反方观点、证据强度和自然英语表达；
- 无准确互动量时写 `互动量不可核验` 并记录替代判断信号；
- 无法访问的平台记录失败层级，不根据标题猜正文；
- 调研阶段不生成最终 Hook、脚本、Caption、Hashtag 或最终选题决定；
- 社区调研结果进入证据池后仍不能自动通过 H1 或 H3。

Mode D 单个 Hot 评估继续使用 Hot 专用证据门；用户未要求刷新候选池时，不强制重新完成整份 8–12 话题研究。

---

## P1：写稿前生成冻结写作包

为减少“规则都读了，但写出来仍然很泛”的问题，`script` 调用写作模型前先生成一份短的冻结写作包：

```yaml
content_id:
account:
platform:
format:
target_audience:
locked_hook:
angle:
core_mechanism:
content_promise:
account_fit_reason:
confirmed_facts: []
historical_samples: []
human_feedback_learned: []
series_dedup_constraints: []
prohibited_claims: []
length:
language:
```

要求：

- 写作模型优先读取这份冻结包，不把整套 Social OS 长上下文直接当写作 Prompt；
- 只保留与当前内容直接相关的规则和样本；
- Hook 在此时已经由 H3 锁定，写作模型无权更换；
- 冻结包保留 Hash 或版本，便于审计本次 Script 使用了哪一版输入。

---

## 三、本轮不修改

- 不重做 Google Sheet；
- 不改变 H0–H5 的人工审批权；
- 不允许 AI 自动将候选设为 `selected`；
- 不自动调用 HeyGen 或其他付费工具；
- 不自动发布；
- 不修改数据回收窗口；
- 不自动修改正式 Skill；
- 不要求 `humanizer` 参与候选研究；
- 不要求本轮重新设计候选评分算法。

---

## 四、最小验收

使用一个 AstrologyWiki 真实 `content_id` 完成测试。

### 测试 A：分层 Skill 加载

1. 运行 `research`，能看到 Entry、Core、Product Rules 和配置均加载成功；
2. 运行 `script`，能看到实际读取的历史样本和 Reviewer 模式；
3. 临时让 Product Rules Skill 路径不可读，runner 应停止并报告，不能继续生成泛用稿；
4. `competitor-analysis` 未触发时，审计记录显示 `invoked: false`，而不是伪称使用。

### 测试 B：Hook 锁定

1. 在 H3 填写一个与 `title` 不同的 Hook；
2. `status --content-id` 同时返回 title 和 hook；
3. 运行 `script` 后，第一条非空句与 H3 Hook 一致；
4. 人工修改 H3 Hook 后，旧 Script、Package 和 H4 审批自动失效；
5. 使用旧稿运行 `package` 时，返回 `hook_match=failed` 并停止；
6. 重新生成后，H4 checks 显示 `hook_match=ok`。

### 测试 C：多 Skill 配置

1. 同一次 `script` 能同时加载 Entry、Core、Product Rules 和 Humanizer；
2. 审计信息分别记录各 Skill 的职责、版本和状态；
3. 更换 Reviewer 不需要修改 runner 或 Sheet Schema；
4. 任意 Skill 均不能写人工审批列。

### 测试 D：社区话题调研前置门

1. 对 `@miraaastrology` 运行 Mode B，候选生成前先产生完整 Research receipt；
2. 至少 5 个讨论点具有可读取的直接帖子或讨论链接；
3. 每条来源记录日期、查看时间、互动可见性和支持的话题；
4. 研究产物中没有最终 Hook、脚本、Caption、Hashtag 或自动选题结论；
5. `source-ingest` 完成后才允许运行 `research`；
6. 只有搜索摘要、没有可读正文时，相关话题不得进入正式研究池；
7. 单独运行 Mode D Hot 评估时，不会错误触发完整社区候选池刷新。

以上四组测试通过，即可认为本轮需求完成。

---

## 五、给彪哥的实现优先级

1. **先修 `status / script / package` 的 Hook 回读与一致性校验；**
2. **再增加 `skill_manifest` 和必需 Skill 读取失败即停止；**
3. **接入 Miraa 社区话题调研前置门与 `source-ingest → research` 顺序；**
4. **再补 `execution_trace`，证明本次真实调用了什么；**
5. **最后增加冻结写作包，提升内容质量并减少长上下文干扰。**

本轮完成标准不是“模型声称参考了 Skill”，而是 runner 能证明实际加载、实际使用，并在 Hook 或必需规则不一致时安全停止。
