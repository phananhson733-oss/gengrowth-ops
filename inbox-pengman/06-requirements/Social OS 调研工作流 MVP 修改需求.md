---
title: Social Bot 本地调研知识库与选题复用 SOP MVP 修改需求
project: astrologywiki
type: automation-requirements
status: draft
owner: Pengman
assignee: 彪哥
priority: P0
updated: 2026-08-21
---

# Social Bot 本地调研知识库与选题复用 SOP MVP 修改需求

## 一、需求结论

本轮不是重做 Social OS，也不是给 Google Sheet 再造一个候选池。

本轮要优化 Social Bot 的**选题研究 SOP**：在 `gengrowth-ops` 中建立一个由 Git 管理的 Miraa 本地调研知识库，通过“每周完整刷新 + 每日增量巡逻”持续更新；用户要求生成选题时，Social Bot 先从本地知识库检索资料，不再默认重新抓取整套互联网数据。

核心链路从：

```text
每次生成新选题
→ 从零完成完整互联网调研
→ 保存 Research receipt
→ source-ingest
→ 生成候选
```

改为：

```text
每周完整刷新本地知识库
→ 每日增量巡逻并更新本地知识库
→ 生成选题时先检索本地知识库
→ 只校验并 source-ingest 实际采用的证据
→ 资料不足、过期或遇到 Hot 时才定向联网补查
→ 生成候选并停在 drafted，等待 Pengman 选择
```

首期只覆盖 `@miraaastrology`，但目录和字段按未来可扩展到其他产品、账号的方式设计。

---

## 二、当前问题

现有 `astrologywiki-social-workflow` 将“调研”和“生成选题”绑定在一次请求中。Miraa 每次生成任何 Mode B / Mode C 新候选前，都要重新完成英语社区调研，至少包括话题池、生活场景库、语言库、来源清单和 Research receipt，再经 `source-ingest` 后生成候选。

真实结果是：用户只要求“生成两个 Miraa 单人口播选题”，Bot 仍会重新打开社区页面、竞品入口和公开来源，重复构建一整份调研材料。主要耗时来自重复调研，而不是候选生成。

这会造成：

- 同一账号、同一周、相近主题被反复研究；
- 大量已验证事实和生活场景不能被稳定复用；
- 简单选题请求被放大成长时间非流式任务；
- 页面失败和重试直接影响选题响应时间；
- Research receipts 越积越多，但缺少统一索引、合并和新鲜度管理；
- 用户只能看到“等待 API”，无法判断 Bot 在检索、补查还是生成候选。

---

## 三、目标与成功标准

### 3.1 P0 目标

1. 在 `gengrowth-ops` 建立 Miraa 本地调研知识库；
2. 每周完整刷新一次，每日做一次轻量增量巡逻；
3. Social Bot 选题时默认本地优先，不再默认运行完整互联网调研；
4. 使用本地 gbrain 做知识库的关键词 + 语义混合召回；
5. gbrain 只做可重建检索索引，本地 Markdown 才是权威资料；
6. 仅把当前候选实际采用的证据送入 `source-ingest`；
7. 保留来源追溯、去重、Hot 实时核验和 H0–H5 人工门；
8. 本地资料不足时只补当前缺口，不刷新整个社区调研池。

### 3.2 核心成败标准

在本地知识库存在足够、未过期的 Miraa 研究资料时，用户在飞书 `# social assistant` 请求：

> 生成 Miraa 两个单人口播选题

Social Bot 必须：

1. 先检索本地知识库；
2. 不执行完整社区互联网调研；
3. 只读取命中的 Topic 和 Source 原始文件；
4. 只 `source-ingest` 两个候选实际采用的来源；
5. 生成两个候选并停在 `drafted`；
6. 不写任何人工审批字段；
7. 正常环境下 5 分钟内返回。

验收重点不是“有没有打印 reused”，而是日志和写入证据能够证明：**本轮没有重跑完整调研，只复用了本地知识库。**

---

## 四、权威边界

| 数据 | 权威位置 | 说明 |
|---|---|---|
| 调研主题、生活场景、自然语言、反方观点 | `gengrowth-ops` 本地知识库 | 选题研究的主要数据源 |
| 原始周更、日更、定向补查记录 | 知识库 `runs/` | 追加式审计记录，不覆盖历史 |
| gbrain 搜索索引 | 本地 gbrain | 派生索引，可以删除并从文件重建 |
| 实际采用的正式证据 | 现有 Social OS Sheet 的证据池 | 只能通过 `social_pipeline.py source-ingest` 写入 |
| 候选及内容生命周期 | 现有 Social OS Sheet | `content_stage` 仍是唯一生命周期 |
| H0–H5 与选择结果 | 现有人工字段 | Bot 不得代填或口头绕过 |

硬边界：

- `social_pipeline.py` 继续作为 Sheet 的唯一写入口；
- 本地知识库不是第二套候选池、排期表或内容状态系统；
- gbrain 返回的摘要和相关度分数不能直接作为证据；
- Bot 必须重新打开命中的本地文件，校验有效期、来源状态和证据强度；
- `next_gate` 只作为 Bot 响应字段，不新增为 Sheet 列；
- 任何自然语言确认都不能代替 H1、H3、H4 或 H5 的人工字段。

---

## 五、本地知识库结构

建议在现有目录下新增：

```text
inbox-pengman/01-调研资料/候选与热点研究/
└── miraa-knowledge-base/
    ├── README.md
    ├── RESOLVER.md
    ├── schema.md
    ├── config.yaml
    ├── index.json
    ├── topics/
    │   └── <topic-id>.md
    ├── sources/
    │   └── <source-id>.md
    └── runs/
        ├── weekly/
        ├── daily/
        ├── targeted/
        └── migration/
```

各目录职责：

- `README.md`：给人看的使用说明、常用入口和排障方法；
- `RESOLVER.md`：规定一条信息应该进入 Topic、Source 还是 Run，避免重复落盘；
- `schema.md`：字段、ID、合并、新鲜度和校验契约；
- `config.yaml`：Miraa 的调度、有效期、证据门、gbrain source ID 和来源范围；
- `index.json`：从 Topic 文件自动生成的轻量降级索引，不允许手工维护；
- `topics/`：一条可复用研究主题一个 Markdown 页面；
- `sources/`：一个规范化直接来源一个 Markdown 页面；
- `runs/`：每次周更、日更、补查和首次迁移的不可变 JSON 记录。

不新建 SQLite、向量数据库或第二个 Sheet。gbrain 自己的数据库不属于知识库真源。

`kb_version` 不依赖“是否已经 Git commit”。每次成功发布时，对 `schema.md`、`config.yaml`、`topics/`、`sources/` 和派生 `index.json` 的规范化内容计算稳定 SHA-256 manifest；该 manifest hash 就是本轮 `kb_version`。定时任务只写知识库文件，不自动 commit、push 或改写其他 `gengrowth-ops` 内容。

---

## 六、知识页数据模型

### 6.1 Topic 页面

Topic 使用 gbrain 的“Compiled Truth + Timeline”结构：上半部分保存当前可用结论，下半部分追加每次观察和变化。

```markdown
---
schema_version: social-research-topic/v1
type: social-research-topic
product: astrologywiki
account: "@miraaastrology"
topic_id: miraa-scorpio-trust-after-conflict
title: Scorpio rebuilds trust after conflict
aliases: []
signs: [scorpio]
themes: [trust, relationship, conflict]
formats: [single-host]
research_scope: evergreen_community
evidence_strength: strong
status: active
first_observed_at: "2026-08-18T13:15:00+08:00"
last_checked_at: "2026-08-21T21:00:00-05:00"
last_verified_at: "2026-08-21T21:00:00-05:00"
valid_until: "2026-08-28T21:00:00-05:00"
source_ids: [src-example-1, src-example-2]
used_content_ids: []
tags: [miraa, scorpio, trust]
---

# Scorpio rebuilds trust after conflict

## Current synthesis
当前可以复用的研究结论。

## Life situations
可视化生活场景，不写最终 Hook。

## Language patterns
自然英语表达，并标记 source quote 或 synthesized pattern。

## Counterviews and limitations
反方观点、样本限制和不能泛化的部分。

## Source map
本 Topic 的来源与各自支持范围。

---

## Timeline

- 2026-08-21：每日巡逻重新核验……
- 2026-08-18：首次从周调研建立……
```

规则：

- `topic_id` 建立后不得因为标题改写而改变；
- Current synthesis 可以根据新证据重写；
- Timeline 只能追加，不能改写旧记录；
- 每个当前结论都必须能追溯到 Source 或 Timeline；
- Topic 只能保存研究方向，不提前生成最终 Hook、脚本、Caption 或 Hashtag；
- `used_content_ids` 只是从 Sheet 成功结果回写的派生缓存，不成为内容生命周期，也不能代替每次选题前读取 Sheet 做完整去重。

### 6.2 Source 页面

每个可读取的直接页面建立一个稳定 Source。`source_id` 优先由规范化 URL 生成；相同页面的跟踪参数、短链和重复抓取必须归并。

最小字段：

```yaml
schema_version: social-research-source/v1
type: social-research-source
product: astrologywiki
account: "@miraaastrology"
source_id: src-example-1
canonical_url: "https://example.com/post"
platform: reddit
author_or_account: "..."
published_at: "..."
first_observed_at: "..."
last_checked_at: "..."
last_verified_at: "..."
access_status: readable
readable_layers: [body, comments]
supported_topic_ids: [miraa-scorpio-trust-after-conflict]
content_fingerprint: "..."
```

正文保存：

- 该来源实际支持的发现；
- 可见互动或替代讨论信号；
- 简短、带归属的原话；
- 反方观点与样本限制；
- 重新核验时间线。

搜索摘要、登录页、标题或页面元数据只能记录在 Run 中，不得创建为 `access_status: readable` 的正式 Source。

### 6.3 Run 记录

周更、日更、定向补查和迁移都必须生成不可变 Run：

```yaml
run_id: krun_...
mode: weekly | daily | targeted | migration
status: success | no_new_signal | partial | failed
started_at: "..."
finished_at: "..."
account: "@miraaastrology"
watermark_before: "..."
watermark_after: "..."
platforms_attempted: []
platforms_accessed: []
opened_pages: 0
readable_pages: 0
created_topic_ids: []
updated_topic_ids: []
created_source_ids: []
updated_source_ids: []
unavailable_sources: []
failure_reason: ""
kb_version_before: "..."
kb_version_after: "..."
index_rebuilt: true
gbrain_sync_status: success | skipped | failed
```

失败 Run 必须保留真实错误，但不能推进成功水位或伪造新的 `last_verified_at`。

---

## 七、每周完整刷新 SOP

建议时间：

```text
每周日 21:00 America/Chicago
```

每周任务是“刷新已有知识库”，不是清空后重建。

执行顺序：

```text
1. 获取知识库写锁
2. 读取 schema、config、当前 index 和最近成功 Run
3. 读取 Miraa 当前账号定位、库存、近期发布、未发布候选和 decision / next_test
4. 读取现有 Topics / Sources，识别需要复核、补充或归档的内容
5. 执行完整英语社区调研和固定竞品入口核验
6. 对 URL、来源内容和 Topic 身份去重
7. 在临时工作区更新 Topic / Source，并写 weekly Run
8. 校验 schema、引用、时间、新鲜度和重复项
9. 校验通过后原子发布新版本
10. 自动重建 index.json
11. 增量同步 gbrain 的 social-os-miraa source
12. 释放写锁并返回本轮计数
```

调研范围：

- 当前 `@miraaastrology` 定位和允许形式；
- 最近 7–14 天已发布内容和未发布候选去重；
- 固定竞品账号和英语社区当前讨论；
- 未来 7–14 天 Predictable 事件；
- 上一轮 `decision / next_test`；
- 已有 Topic 的过期、冲突、反方观点和来源可读性。

完整刷新继续满足现有 Miraa community research 契约：至少交付 5 个有直接来源支持的讨论点，资料充足时目标 8–12 个，并维护跨 Topic 的生活场景和语言表达；不得为了满足数量填充弱证据。区别仅在于结果被规范化合并进知识库，而不是在每次选题请求中重新生成一份孤立 receipt。

输出边界：

- 更新知识库，不生成候选；
- 不执行 `research`；
- 不批量把整周资料写入 Sheet；
- 不写任何人工审批字段；
- 本周没有再次观察到的 Topic 不自动删除，按 `valid_until` 和状态规则处理；
- 完整调研失败时继续保留上一版成功知识库，不修改其核验时间。

---

## 八、每日增量巡逻 SOP

建议时间：

```text
周一至周六 21:00 America/Chicago
```

每日巡逻从各来源最近一次成功水位开始，只检查：

- 固定竞品是否出现新内容；
- 已跟踪社区 Topic 是否出现新讨论、反方观点或高互动信号；
- Predictable 事件是否进入 T-72h 或 T-24h；
- 是否出现需要 Hot 实时评估的当前信号。

处理规则：

| 发现 | 处理 |
|---|---|
| 新的可读直接来源 | 创建 Source，并归并到已有 Topic 或创建新 Topic |
| 已有来源内容或互动变化 | 更新 Source 当前状态，并向 Timeline 追加核验记录 |
| 仅重新确认来源仍有效 | 可以更新该 Source 的 `last_verified_at`；Topic 是否续期仍按证据门判断 |
| 只有标题、摘要或登录页 | 只写 Run，不进入正式 Source |
| 与已有来源重复 | 记录去重命中，不重复建 Source |
| 没有新信号 | 写 `no_new_signal` Run，不改 Topic 结论或有效期 |

每日巡逻不得为了“每天有产出”而制造新话题、候选或语言表达。

周日只执行每周完整刷新，不再重复执行同账号的每日巡逻。

---

## 九、gbrain 检索契约

### 9.1 使用方式

本地 Markdown 为权威资料；gbrain 是可重建的检索加速层。

MVP 使用当前本地 gbrain 已具备的能力：

- 将 `miraa-knowledge-base` 注册为独立 source，例如 `social-os-miraa`；
- 周更、日更或补查成功发布后执行该 source 的增量 sync；
- 使用 `gbrain query` 做关键词 + 向量 + RRF 混合召回；
- 已知明确 Topic ID 时直接读取本地文件，不浪费语义检索；
- 不以升级 gbrain 为 MVP 前置条件。

不得将 Social OS 内容混入默认 gbrain source，也不得不加范围地跨全部 gbrain source 检索。查询必须显式限制为 `social-os-miraa`，避免其他仓库、个人知识或 SEO 内容污染选题依据。

### 9.2 两段式检索

```text
第一段：召回
用户请求 → 解析账号、形式、sign、主题和时间要求
→ gbrain scoped hybrid query
→ 返回相关 Topic slugs

第二段：确定性校验
打开 gengrowth-ops 中的原始 Topic / Source 文件
→ account 必须匹配
→ status 必须可用
→ valid_until 必须有效
→ evidence_strength 必须达门
→ Source 必须可读且未失效
→ 与近期已发布、未发布候选去重
→ 得到允许生成候选的资料集合
```

gbrain 的摘要、RRF 分数或向量相似度只用于发现和排序，不能代替直接来源、时间核验或证据门。

### 9.3 降级策略

- gbrain 或 embedding 不可用：使用自动生成的 `index.json` 做关键词和标签检索；
- gbrain sync 失败：保留已校验的知识库版本，并标记 `search_index_stale`；
- gbrain PGLite 锁冲突：本轮不覆盖索引状态，稍后重试或走 `index.json`；
- 检索后必须读取原始文件，不能把 gbrain snippet 直接传给 `research`；
- 检索服务故障本身不能触发完整互联网调研。

---

## 十、选题生成 SOP

用户要求生成 Miraa 候选时：

```text
1. 读取当前周计划、库存、近期发布、未发布候选和账号规则
2. 查询本地知识库
3. 对命中的 Topic / Source 做新鲜度、证据和去重校验
4. 资料足够：选出支持当前候选所需的最小证据集合
5. 生成本轮 kb-selection receipt
6. 只对 receipt 中实际采用的 Source 执行幂等 source-ingest
7. prepare-context 获取与本次命令、账号和范围绑定的一次性 context receipt
8. 执行 research 生成用户指定数量的候选
9. 回读 Sheet 结果
10. Sheet 写入成功后，在知识库写锁内向相关 Topic 追加候选使用记录，并更新派生 used_content_ids
11. 返回 content_id、stage、next_gate 和研究复用证据
```

新增的 `kb-selection receipt` 是机器执行凭证，不是内容状态。最小字段：

```yaml
schema_version: social-kb-selection/v1
selection_receipt_id: ksel_...
account: "@miraaastrology"
request_summary: "two single-host candidates"
kb_version: "..."
search_backend: gbrain | fallback_index
query: "..."
topic_ids: []
source_ids: []
freshness_checked_at: "..."
freshness_result: valid
dedupe_checked_at: "..."
created_at: "..."
```

receipt 必须与本次账号、请求范围和知识库版本绑定；不能换请求复用。`source-ingest` 必须继续保持幂等，已在证据池中的来源只建立本次追溯关系，不重复写行。

候选去重的权威输入始终是 Sheet 中的已发布和未发布内容；`used_content_ids` 只用于加速和审计。若候选已经成功写入 Sheet，但知识库使用记录回写失败，不回滚 Sheet 候选；记录 `kb_usage_writeback_failed` 并在下次维护任务补齐。

执行记录与 Bot 响应至少包含：

```yaml
research_mode: reused | targeted | hot
search_backend: gbrain | fallback_index
kb_version: "..."
selection_receipt_id: "..."
topic_ids: []
source_ids: []
freshness_result: valid | partial | expired
targeted_gap: ""
content_ids: []
stage: drafted
next_gate: "Pengman 在选题审批填写 selection_status"
```

---

## 十一、资料不足时的定向补查

本地检索不足时，先输出明确缺口：

```yaml
gap:
  signs: [virgo]
  themes: [relationship]
  format: single-host
  missing:
    direct_sources: 1
  reason: no_valid_direct_source
```

然后按缺口执行：

```text
只搜索 gap 指定范围
→ 保存 targeted Run
→ 将合格 Topic / Source 写回本地知识库
→ 校验并发布新版本
→ 同步索引
→ 再执行一次本地检索
→ 资料充足才继续 source-ingest 和 research
```

停止条件：

- 同一选题请求最多执行一轮定向补查；
- 补查后仍无合格直接来源：返回资料不足，不生成正式候选；
- 页面只能读取摘要、标题或元数据：返回不可用；
- 发现与近期内容重复：返回重复，不为凑数量换成弱证据；
- 缺一个来源不得扩展成完整 5–12 Topic 社区调研；
- 定向补查必须回写知识库，不能只在当前对话中临时使用。

---

## 十二、有效期与 Hot 规则

有效期全部放在知识库 `config.yaml` 或产品配置中，不写死在 Hermes core，也不新增面向用户的 `HERMES_*` 环境变量。

默认建议：

| 类型 | 默认有效期 | 使用要求 |
|---|---:|---|
| Evergreen / 社区关系话题 | 7 天 | 有效期内、来源仍可读且证据达门时可复用 |
| 竞品新内容与社区新增信号 | 3–7 天 | 按最近成功核验时间判断 |
| Predictable 天象 / 节日 / 已知事件 | 以事件时间为准 | T-72h 和 T-24h 重新核对时间、时区和账号匹配 |
| Hot / 突发新闻 | 12–24 小时 | 必须执行当前实时核验，不能只使用本地旧资料 |

Topic 有效必须同时满足：

- `status: active`；
- 账号、形式和主题匹配；
- 当前有效直接来源数量达门；
- 证据强度达门；
- 没有未解决的关键事实冲突；
- 没有与近期已发布或未发布候选重复。

时间规则：

- 文件修改时间和 gbrain sync 时间不能充当 `last_verified_at`；
- 访问失败只能更新 `last_checked_at`，不能延长 `valid_until`；
- 只有成功读取并确认仍支持该 Topic 的直接来源，才允许更新 `last_verified_at`；
- `no_new_signal` 不能自动延长所有 Topic 的有效期。

Hot 可以先检索本地知识库了解背景，但正式候选必须通过现有 Hot 当前证据门。实时核验成功后也要写回知识库并设置短有效期；失败则安全写零。

---

## 十三、调度、并发和失败保护

调度优先复用 Hermes 现有 cron / scheduler 和 Social profile，不新增常驻守护进程、新 core model tool 或第二套调度器。

配置必须显式包含：

```yaml
account: "@miraaastrology"
knowledge_base_path: "/Users/awayer_mini/gengrowth-ops/inbox-pengman/01-调研资料/候选与热点研究/miraa-knowledge-base"
timezone: America/Chicago
weekly_refresh: "Sunday 21:00"
daily_patrol: "Monday-Saturday 21:00"
gbrain_source_id: social-os-miraa
```

并发规则：

- 同一知识库同一时间只能有一个写任务；
- 周更、日更、定向补查和首次迁移共用同一写锁；
- 候选生成读取最近成功版本，不读取未发布的临时文件；
- 周日周更优先，当天不再运行日更；
- 锁已被有效任务持有时，本轮安全跳过并报告，不强行抢锁。

发布规则：

```text
临时工作区生成
→ schema / 引用 / 去重 / 时间校验
→ 对本轮变更文件逐一执行同目录原子替换
→ 重建 index
→ 计算并回读 kb_version manifest
→ gbrain sync
```

不允许通过交换或删除整个知识库目录来“原子发布”，避免覆盖用户文件或未关联变更。如果 schema 校验失败、引用断裂或写入中断，继续使用上一版成功知识库。gbrain sync 失败不回滚已发布文件，但必须暴露降级状态。

---

## 十四、Bot 可见进度与回复

Bot 不应只显示 `waiting for non-streaming API response`。最小进度：

```text
正在检索 Miraa 本地知识库
→ gbrain 命中 4 个相关 Topic / 7 个有效 Source
→ 正在检查新鲜度和近期内容去重
→ 采用 3 个来源生成 2 个候选
→ 候选已写入，等待 Pengman 选择
```

触发补查时：

```text
本地知识库缺少 Virgo relationship 的有效直接来源
→ 正在做一次定向补查
→ 不刷新完整社区调研池
```

失败时必须区分：

- `no_valid_local_evidence`：本地无有效资料；
- `targeted_research_insufficient`：补查后仍不足；
- `gbrain_unavailable_fallback_used`：gbrain 不可用，已用本地索引；
- `knowledge_base_update_failed`：知识库更新失败，仍保留上一版；
- `duplicate_candidate_risk`：命中近期重复；
- `hot_realtime_verification_failed`：Hot 实时核验失败。

---

## 十五、首次迁移

MVP 不从空库开始。首次上线先迁移现有：

```text
01-调研资料/候选与热点研究/research-receipts/
```

迁移规则：

1. 只迁移 `@miraaastrology` 的可解析 Research receipts；
2. 原文件保持不变，作为历史输入；
3. 对规范化 URL、来源内容和 Topic 语义做去重；
4. 为同一研究方向生成稳定 `topic_id`；
5. 将当前结论写入 Topic 上半部分，将原 receipt 记录写入 Timeline；
6. 只有仍可核验的直接来源才能进入 active Topic；
7. 过期、弱证据或不可读来源可以迁移为历史记录，但不能标记为当前有效；
8. 生成 migration Run、重建 `index.json` 并同步独立 gbrain source；
9. 迁移过程不生成候选、不写 Sheet、不改变任何审批状态。

迁移完成后先做只读检索验收，再启用周更、日更和选题复用。

---

## 十六、本轮不修改

- 不重做 Google Sheet；
- 不新建第二个候选池、内容日历或状态系统；
- 不修改 `content_stage` 生命周期；
- 不改变 H0–H5 人工审批；
- 不允许 AI 自动填写 `selection_status`；
- 不自动生成完整 Script、Package、HeyGen 视频或发布内容；
- 不修改现有 Hook 锁定、Humanizer 和 Package 规则；
- 不要求每天产生固定数量的新研究；
- 不把 gbrain 数据库变成权威来源；
- 不允许跨全部 gbrain source 检索；
- 不为该功能新增 Hermes core model tool；
- 不要求 MVP 支持 `@astrologywiki` 或其他账号；
- 不以升级 gbrain、引入新向量数据库或购买新服务为前置条件。
- 不由 Social Bot 自动 commit、push、reset 或清理 `gengrowth-ops`；现有 Git 备份/同步流程继续独立负责版本保存。

---

## 十七、最小验收测试

### A. 核心本地复用路径

前置：知识库存在足够、有效且未重复的 Miraa Topic / Source。

请求：

> 生成 Miraa 两个单人口播选题

必须证明：

- 查询显式限制在 `social-os-miraa`；
- 未运行完整周调研、每日巡逻或无关网页抓取；
- gbrain 只返回 slug，正式判断重新读取本地文件；
- 仅采用当前候选所需的最小 Source 集合；
- `source-ingest → prepare-context → research` 顺序完整；
- context receipt 与命令、账号和范围绑定且一次性使用；
- 只生成两个候选；
- `content_stage=drafted`，人工审批字段为空；
- 响应包含 `content_id`、`stage`、`next_gate`、`kb_version` 和来源 ID；
- Sheet 成功结果被追加到对应 Topic 使用记录；该回写失败时有明确错误且不重复创建候选；
- 正常环境 5 分钟内完成。

### B. 周更

- 更新或新增 Topic / Source，并写成功 weekly Run；
- 不生成候选、不运行 `research`、不写 Sheet；
- 不清空知识库或改变稳定 ID；
- 失败时旧版本和核验时间保持不变；
- 成功后重建 index 并记录 gbrain sync 状态。

### C. 日更无新信号

- 返回 `no_new_signal`；
- 不重复创建 Source；
- 不改 Topic 结论和有效期；
- 不生成候选、不写内容状态。

### D. 日更新增信号

- 新 Source 使用稳定 ID；
- 已有 Topic 被正确归并并追加 Timeline；
- 相同规范化 URL 不产生重复文件；
- 只有可读直接来源能提升当前证据。

### E. 定向补查

- 先返回结构化 gap；
- 只补指定 sign / theme / format 缺口；
- 最多执行一轮；
- 补查结果先写回知识库，再进入候选生成；
- 仍不足时安全返回零，不扩大成完整调研。

### F. gbrain 降级与隔离

- gbrain 不可用时从 `index.json` 找到有效 Topic；
- 不因 gbrain 故障执行完整互联网调研；
- 查询不能命中默认 gbrain source 中的无关知识；
- gbrain sync 失败时本地知识库仍可用，并明确显示索引过期。

### G. Hot 与过期资料

- 过期 Topic 不得静默用于正式候选；
- Hot 必须实时核验；
- 实时核验失败安全写零；
- 核验成功的新增证据写回知识库并设置短有效期。

### H. 原子性和人工边界

- 临时写入失败不会暴露半成品知识库；
- 同时触发周更和日更时只有一个写任务执行；
- Bot 不写 H1、H3、H4、H5；
- Hook、Script、Package 和发布流程行为不变。

### I. 真实入口验收

除单元和集成测试外，必须在真实飞书 `# social assistant` 完成一次只生成候选的端到端验收，并同时核对：

- Bot 对话进度与最终回复；
- 本地知识库读取和 Run 记录；
- gbrain scoped query / fallback 证据；
- Sheet 实际新增候选和人工字段；
- Social profile 部署副本与源文件一致。

---

## 十八、建议实现顺序

1. 定义 `schema.md`、`config.yaml`、Topic / Source / Run 校验器和行为测试；
2. 建立 `miraa-knowledge-base` 目录并迁移现有 Miraa receipts；
3. 生成派生 `index.json`，完成不依赖 gbrain 的确定性检索；
4. 注册独立 gbrain source，增加 scoped sync / query 包装和降级路径；
5. 实现每周刷新和每日巡逻，共用写锁、临时目录和原子发布；
6. 实现 `kb-selection receipt`，让 runner 只 ingest 实际采用的证据；
7. 将现有 `research` 默认入口改为本地知识库优先；
8. 实现一次性定向补查和 Hot 实时核验例外；
9. 使用 Hermes 现有 cron 配置周更、日更，不新建调度器；
10. 更新 AstrologyWiki workflow Skill、Social pipeline runbook 和 field notes；
11. 跑行为契约、临时 `HERMES_HOME` 集成测试和真实飞书验收；
12. 同步并校验源码与 Social profile 部署副本后，再重启 Social gateway。

---

## 十九、Definition of Done

以下全部满足才算完成：

- Miraa 本地知识库已建立并完成首次迁移；
- 周更和日更能独立运行并留下真实 Run；
- gbrain 使用独立 source，查询不会跨库污染；
- gbrain 不可用时存在确定性本地降级；
- 普通选题请求默认只读本地知识库；
- 只 ingest 候选实际采用的证据；
- 资料不足只做一次定向补查；
- Hot、过期、弱证据和不可读来源继续 fail closed；
- H0–H5、`content_stage`、Hook 锁定和人工权限未被改变；
- 真实 `# social assistant` 验收证明“没有重新跑完整调研”；
- 源码、运行时 Skill、runbook 和 field notes 副本一致且可回滚。
