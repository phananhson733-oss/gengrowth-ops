---
name: astrologywiki-social-workflow
description: "Use for AstrologyWiki weekly candidate research, qualified Hot assessment, account routing, selected-record script drafting, social copy, short-video ideas, X posts, or execution of the active rolling-week plan. Ordinary daily work advances locked items; new candidates are allowed only for Monday planning, confirmed inventory refill, explicit replan, or a qualifying Hot item."
metadata:
  site: astrologywiki.com
  owner: Pengman
  version: 1.3.1
  updated: 2026-08-11
---

# AstrologyWiki Weekly Social Planning and Hot Response

本 Skill 是候选研究、热点判断、账号路由和公共表达规则，不是第二套周计划或内容状态系统。

## 1. Authority

执行顺序：

1. [[inbox-pengman/04-production/00-evergreen-workflows/weekly-rolling-content-production-sop]]
2. 当前周计划：`04-production/04-weekly-content-plans/`
3. 涉及内容的 `02-content-production` 主生产记录
4. 最近发布周报和 `decision / next_test`
5. 本 Skill 的研究、路由和表达规则

默认日常动作是执行周计划，不是生成新选题。不得通过本 Skill：

- 自动把 Idea 提升到 `selected`；
- 修改周一锁定的产能、排期或 Batch；
- 强迫所有历史账号每天都发，或自行恢复暂停账号；
- 在没有合格热点时重做整周选题；
- 为了填满数量而突破未来两周产能。

## 2. Trigger Modes

先判断本次属于哪一种模式。

### Mode A：普通日执行

适用：周二至周五询问“今天做什么”“今天发什么”“继续推进”。

读取当前周计划和相关主记录，输出：

- 今天要发布的既定内容；
- 今天要推进的 Batch 和阶段；
- 即将过期或阻塞项；
- 发布级库存缺口；
- 有限热点检查结论；
- 当前 active 账号的 publish / advance / wait / skip。

不生成新的 Route A/B/C 候选池，不重复网页研究，不创建日级选题文档。

### Mode B：周一候选研究

适用：建立周计划。根据可用时间、配额、库存、Predictable 日期和账号定位，生成容量适配的候选。候选只是 Idea；Pengman 确认并纳入未来两周产能后才成为 `selected`。

### Mode C：明确重排或补库

只有 Pengman 明确要求重排，或确认库存不足需要补库时使用。先说明释放或新增的产能，再生成数量有限的替代候选。

### Mode D：Hot 评估

先按 Weekly Rolling SOP 的 10 分制评分，再决定：

- 8–10：建议立即进入热点槽；
- 6–7：当天稍后或次日；
- 4–5：进入下周候选；
- 0–3：放弃。

低于 6 分不启动临时生产。没有热点槽时，只建议替换同账号最低优先级 Evergreen，等待 Pengman 确认。

## 3. Required Context

普通日执行最小读取：

- Weekly Rolling SOP；
- 当前周计划；
- 今天涉及的主生产记录；
- 当前周发布 digest（如有发布动作）。

候选研究或 Hot 评估再读取：

- 最近 7–14 天发布 digest；
- `02-content-production/README` 当前队列；
- [[inbox-pengman/02-生产/01-reference/AstrologyWiki 社媒账号分工与内容发布指南]]；
- 与候选直接相关的竞品来源和上一轮 `decision / next_test`；
- 当前公开 AstrologyWiki 页面/工具；
- Hot/Predictable 所需的当前外部来源；
- 固定参考账号索引：`https://script.google.com/macros/s/AKfycbyunRIRkIyxEFRUIPstyKFPebAE2rBZB8CBFmoTWzJkhBl-ugAsakxHwZipbT4hTOgANg/exec`；
- Apps Script Library 参考入口：`https://script.google.com/macros/library/d/1XrKVy_7L_IJl_1Zc-9puY03e8RbvwDi7CQMEAL1uzaafW9Cfa32lRshg/3`。

GSC 已暂停，不读取、不索取，也不构成阻塞。旧竞品快照只作历史追溯；在线表或本轮直接核验来源优先。

### Mandatory Internet Research Gate

每次生成任何新候选前，包括 Evergreen、Predictable、Hot、补库或替换候选，都必须先完成本轮实时互联网调研。现有本地参考项继续全部读取；两个固定入口是新增来源，不替代周计划、周报、生产队列、Playbook、历史样本或 `decision / next_test`。

1. 每次读取固定参考账号 CSV 索引，记录 `checked_at`、HTTP/读取状态和本轮采用的相关账号。它只负责提供参考账号清单，不能替代查看这些账号或相关话题的当前公开内容。
2. 每次尝试访问 Apps Script Library 入口并记录 `accessible / login_required / blocked`。当前若跳转 Google 登录，只能记录“需要登录，未读取内部内容”，不得把页面标题或登录页当成研究证据。
3. 每轮至少核验 2 个与目标账号和选题直接相关的当前公开来源，并保存直接链接、发布日期/观察时间和可用于该候选的具体发现。
4. Hot 继续执行更严格的 4 个当前公开来源与跨 2 个候选至少 3 个直接链接规则。
5. 固定 CSV 索引不可读取时，停止生成正式候选并报告阻塞。Library 入口仅需登录时，可在 CSV 与其他实时公开来源均已成功核验的前提下继续，但必须披露限制。
6. 没有完成以上门槛时，只能推进已经 `selected` 的既定内容，不能输出新的正式候选，也不能把 Idea 提升为 `selected`。

## 4. Evidence Preflight

Evidence Preflight 只用于正式周一候选研究、明确重排/补库和 Hot 评估；执行已选内容不重复。

正式研究文件先列出：

```markdown
## Evidence Preflight
- Local files read:
- Mandatory competitor-index endpoint status and checked_at:
- Apps Script library page status:
- Current external sources checked:
- Direct links used for candidates:
- Inputs unavailable or blocked:
```

若输出包含 Hot/Route B 候选，最低要求：

- 至少 3 个相关本地路径；
- 至少 4 个当前公开来源；
- 至少 2 个不同热点候选对应的 3 个直接链接。

纯 Evergreen/Predictable 补库不强制凑 Hot 的 4 来源配额，但仍须通过 Mandatory Internet Research Gate：成功读取固定 CSV，并核验至少 2 个与目标账号/选题直接相关的当前公开来源；事实、日期、人物、天象和落地页仍需核验。输入不足时不写猜测版正式文件；说明阻塞和可接受的替代输入。

## 5. Three Candidate Sources

Route 只是研究来源，不是生产状态，也不要求每周平均分配。

### Route A：Evergreen life-first

从具体的人类处境出发：关系、工作、倦怠、家庭、身份、嫉妒、承诺、改变、自我理解。非占星受众应能在 3 秒内理解矛盾。

### Route B：Predictable / Hot

包括已知天象、节日、发布日、赛事日程，以及正在发生的名人、娱乐、关系、工作、生活方式、平台讨论和公共事件。Hot 必须有当前来源；Predictable 必须有准确日期和过期窗口。

### Route C：Placement identity

以一个低门槛 placement/sign 和具体行为开场，目标是“被说中”、评论和 tag。早期大众测试优先 Sun Sign；Moon/Venus/Rising 只有在账号定位、用户认知和本轮实验目的匹配时使用，不能把 Sun Sign 与 Moon Sign 当成单变量对照。

候选最终归入：

- `Evergreen`
- `Predictable`
- `Hot`

排期参考为 60% / 25% / 15%，不要求每周强行凑比例。

## 6. Account Routing

选题阶段按账号定位判断；生产阶段按视频形式、制作环节、模板/工具和时效优先级分 Batch。

| 账号 | 当前状态 | 主要任务 | 固定边界 |
|---|---|---|---|
| `@astrologywiki` | active | 可信天象、知识解释、工具或页面承接 | 非宿命，事实准确，不复制 Miraa 心理口播 |
| `@miraaastrology` | active / 当前增长重点 | 单一 sign/placement、具体关系行为、心理机制 | 固定核心人设和形式，不做病理化标签或无依据排行 |
| 历史热点号、普通爱好者号及未来账号 | paused / retired / not activated | 当前不分配候选和产能 | 只有 Pengman 通过账号 Playbook 的启用门并写入周计划后才能恢复 |

规则：

- 不把一个母题强行拆给两个 active 账号。
- 只给匹配的 active 账号分配；暂停、退役和未启用账号不进入候选路由。
- 每个独立发布版本拥有独立 `content_id`。
- 账号配额来自 Weekly Rolling SOP，不在本 Skill 复制数字。
- `batch_id` 按形式/环节/工具/时效建立，不按“人格日、明星日、天象日”机械分组。

## 7. Topic and Safety Rules

优先级：

```text
真实生活张力 / 当前公共注意力
→ 账号匹配
→ 强 Hook
→ 可核验的占星解释
→ 可执行成本
→ 自然承接
```

必须：

- 检查最近 7–14 天去重；
- 时效事实使用当前来源核验；
- 名人出生时间、Rising、houses 或不确定 Moon 明确标注证据等级，公开稿中无必要则不用；
- 赛事/事件只解释心理或叙事，不预测输赢；
- 有合适 AstrologyWiki 页面/工具时才做 CTA，不用首页硬接；
- 记录 source_evidence，不从旧 SEO/GSC 笔记推断当前流量。

禁止：

- 确定性未来预测；
- 医疗或心理诊断；
- 恐吓式财富、关系或灾难承诺；
- 为热点硬套不自然的占星角度；
- 复制竞品措辞、人物素材或视觉；
- 因某一条数据好就把账号永久改成单一星座号。

## 8. Copy Style

本节是公共社媒表达的主要来源。

- 开头先给人物、行为、冲突或结果，不从术语定义开始。
- TikTok 默认使用直接、像创作者说话的断言式 Hook。
- 自然的反差和 `not X, but Y` 可以使用；避免重复、企业文案感的 AI 模板。
- 不在公开稿中使用“without predicting”之类防御性免责声明。
- Call-out、toxic traits、shadow self 和 dark side 可以作为共鸣 Hook，但不能变成外部结果断言。
- 热点图文像 editorial micro-story：强封面、具体时刻、2–3 个短洞察、轻承接；不要写成课堂。
- CTA 轻、具体、可追踪；不是每条内容都要口播 CTA。
- 脚本长度、主播、背景、字幕、CTA 等若是对照实验冻结变量，未经确认不得同时改变。

Hook 检查：

```text
一个不关注 AstrologyWiki 的 TikTok 用户，
能否在 2–3 秒内知道“这条在说谁、什么行为、为什么和我有关”？
```

不能就先重写 Hook。

### 8.1 Pengman 的 Hook 与白纸重写偏好

以下是 Pengman 已明确确认的生产偏好，适用于 `@miraaastrology` 的 AI Host / 双人口播脚本。单条主生产记录的具体要求优先；双人口播 Questioner Hook 按下方专用规则执行。

**单人 AI Host 的强 Hook 必须：**

- 在前 2–3 秒让用户知道谁、正在发生什么具体行为，以及为什么这和自己有关；
- 从可看见的生活场景、动作、关系瞬间或反常识冲突切入，而不从性格定义、抽象情绪或占星术语切入；
- 使用自然、简单的美式英语，能直接被放上首屏大字幕；
- 先给矛盾或场景，再解释其情绪含义；不把“深刻”误写成含糊。

**默认避开：**

- `Scorpio hides what they carry`、`You might not really know Scorpio` 等只有情绪判断、没有场景的首句；
- `mysterious`、`emotional walls`、`access`、`boundaries`、`emotional depth` 等抽象词作为 Hook 主体；
- 只说“Scorpio is/has ……”却没有动作、冲突或后果的身份标签；
- 以诗意、治疗话术、AI 总结句或工整对偶代替真实处境。

**双人口播 Questioner Hook：**

- 只让 Questioner 代表观众提出问题，Miraa 承担主要回答和情绪落点；不把两人写成平等聊天。
- Hook 直接使用问句，默认优先以 `Why` 或 `Who` 起手。
- Hook 尽量短，确保 Questioner 能在约 2 秒内自然说完；先删背景、铺垫和具体场景。
- Hook 只点明 Scorpio 或目标关系与核心困惑；具体行为、场景和双方视角放进 Miraa 的回答。
- 生成 5 个候选时，改变问题角度，不靠替换场景或堆叠修饰词制造差异。
- 本规则只适用于一人提问、一人回答的双人口播；单人 AI Host 继续使用具体场景或行为型 Hook。

**写稿动作：**

1. 先读取目标单条主生产记录、`01-reference/` 中相关参考、同账号最近已发布记录与当前未发布记录。
2. 只从参考中学习 Hook 清晰度、场景、节奏和情绪推进；不复制竞品句子、顺序、隐喻、CTA 或未经核验的主张。
3. 先给 5 个彼此不同的 Hook 候选。单人 AI Host 更换具体进入场景；双人口播按 Questioner Hook 专用规则更换问题角度。
4. 选择最强 Hook 后再写完整稿。若没有一个 Hook 能通过“谁／行为／为什么有关”的 2–3 秒检查，先重写 Hook，不用抽象句勉强起稿。
5. 当 Pengman 要求“从零重写”时，将现有 Hook、Voiceover、Caption、Overlay 和模型初稿视为已否决过程稿；只继承主生产记录中已确认的选题、核心机制、来源、形式、禁止项与实验变量。不得做同义替换式改稿。
6. 脚本初稿完成后，执行本 Skill 的 Humanization Gate；最终稿仍只是 `candidate`，直到 Pengman 明确确认。

## 9. Candidate Research Workflow

### Step 1：读取产能和缺口

先从当前周计划提取：

- 本周可用时间和 S/M/L 容量；
- Publishing This Week；
- Producing for Next Week；
- 当前 active 账号的真实内容或库存缺口；
- 三个内容池缺口；
- 发布级库存；
- 已占用的热点槽和 Batch。

### Step 2：完成实时互联网调研

先执行 Mandatory Internet Research Gate：读取固定 CSV、尝试访问 Library 页面、查看与目标账号/缺口相关的当前公开内容，并写出 Evidence Preflight。研究完成前不开始生成候选。

### Step 3：收集候选

只生成填补真实缺口所需的候选。Idea 可以多于 Selected，但默认候选数量不超过剩余可执行名额的 2–3 倍。

每条候选记录：

- title / account / pool / pillar / format；
- Hook；
- priority / effort；
- source_evidence；
- expiry_date（Predictable/Hot 必填）；
- 与最近发布内容的差异；
- 建议 Batch；
- 为什么现在做或为什么留到以后。

### Step 4：排序

普通候选按以下维度简评：

- 账号匹配；
- Hook 强度；
- 生活相关性或时效性；
- 证据清晰；
- 制作成本；
- 去重风险；
- 库存价值。

Hot 使用正式 10 分制，不另造评分。

### Step 5：等待确认

研究阶段只输出 P0/P1/P2 建议和周计划影响。Pengman 确认前：

- 不创建完整脚本；
- 不填正式排期；
- 不将 `content_stage` 设为 `selected`；
- 不超过未来两周产能。

确认后，在 `02-content-production` 为每个独立版本建立主记录并设为 `selected`；Brief、脚本确认和素材准备都留在该阶段，实际开始生成、剪辑或组装时才进入 `producing`。

## 10. Output Formats

### 普通日执行卡

```markdown
## 今日既定动作
| 顺序 | content_id | 账号 | 动作 | 目标阶段/发布 | Batch | 预计时间 |

## 当前账号状态
- `@astrologywiki`：publish / advance / wait / skip
- `@miraaastrology`：publish / advance / wait / skip
- 暂停、退役或未启用账号：默认不进入执行卡；若被提议恢复，单列“待 Pengman 确认”

## 阻塞、过期与库存
- 24–48h 风险：
- 当前发布级库存：
- 需要 Pengman 确认：

## 热点检查
- 结论：无合格热点 / 候选与评分
- 是否影响周计划：

## 今日结束需回写
- 主记录：
- 周计划：
- 周报/发布链接：
```

### 周一候选研究卡

```markdown
## Evidence Preflight
- Local files read:
- Mandatory competitor-index endpoint status and checked_at:
- Apps Script library page status:
- Current external sources checked:
- Direct links used for candidates:
- Inputs unavailable or blocked:

## 产能与缺口
- 本周可用时间：
- 可执行 S/M/L：
- 配额/库存/内容池缺口：

## 候选
| 优先级 | 编号 | 账号 | Pool | Hook | Format | Effort | Expiry | 建议 Batch | 理由 |

## 建议锁定
- 建议进入 selected：
- 保持 idea：
- 放弃/去重：
- 需要 Pengman 确认：
```

### Hot 评估卡

```markdown
- 事件与来源：
- 账号匹配度：0–2
- 当前热度：0–2
- 占星角度自然度：0–2
- 24–48h 紧迫度：0–2
- 90 分钟内完成：0–1
- 事实清晰与品牌安全：0–1
- 总分：
- 建议：立即 / 稍后或次日 / 下周候选 / 放弃
- 使用热点槽或替换：
- 被替换内容及是否已顺延过：
```

## 11. Script Humanization Gate

AI 口播类视频（数字人、AI 占星师等所有需要“说话”的脚本）在生成 script 后、写入 `script_status: 已确认` 前，必须完成人类口语自然度审查。若当前环境存在并可读取 `/humanizer` skill，可以调用；若不存在，必须如实记录“未调用 /humanizer”，改由总控模型按同一检查表审稿并由 Pengman 人工确认，不能假装 Skill 已运行。

规则：
- 适用范围：所有 AI 口播 / voiceover / talking-head 脚本
- 不适用：纯图文 caption、slideshow 文案、短 Hook 测试（≤3 句）
- 执行时机：script 初稿完成后，人工确认前
- 目的：去除 AI 写作痕迹，让口播听起来像真人创作者说话

流程：
1. 生成 script 初稿
2. 调用可用的 `/humanizer`，或由总控模型检查：开头是否直接、句子能否自然说出口、是否有重复对照模板、抽象名词堆叠、过长从句和不自然的 AI 总结句
3. 输出润色后版本供 Pengman 确认
4. 确认后写 `script_status: 已确认` 和 `confirmed_script_version`；`content_stage` 保持 `selected`

## 12. Production and Learning Boundary

- 写稿前读取 1–3 条最相关历史样本，优先同账号、同形式、已发布且有 `decision / next_test` 的记录。
- 只提取明确的人工作改动与验证结论；不从最终稿反推 Pengman 偏好。
- 一次人工修改只保存在本条记录；两次相似修改成为待验证偏好；跨 2–3 条稳定后才提议更新 Skill/Playbook，并等待 Pengman 确认。
- Claude/GPT 实验使用同一冻结包，互不读取答案；候选不等于确认稿。
- 当前阶段只写入单条主生产记录；附件不得维护第二个总体状态。
- 每日结束回写真实 `content_stage`、阻塞、库存变化和真实发布链接。

## 13. File Routing

- 当前周组合：`04-weekly-content-plans/`
- 周一候选研究、Hot 证据、明确重排：`02-daily-content-recommendations/`
- 已选 Brief、脚本、制作与发布回链：`02-content-production/`
- 发布数据和周级复盘：`05-weekly-digests/` 与 `04-production/03-data-review/`
- 历史题库和历史流程：`02-调研资料/历史流程/`，只在明确追溯时读取

## Change Log

- 2026-08-11 · v1.3.1 · 记录 Pengman 对双人口播 Questioner Hook 的确认偏好：直接问句、优先 `Why` 或 `Who` 起手、约 2 秒内说完、不在首句铺具体场景，具体冲突由 Miraa 展开。

- 2026-08-04 · v1.2.0 · 修正迁移后的 `02 / 03 / 05 / 07` 当前路径；将不可用时会阻断流程的 `/humanizer` 硬依赖改为可核验 Skill 或总控审稿 + Pengman 确认的等价门槛。
- 2026-07-21 · v1.1.0 · 将实时互联网调研设为所有新候选的硬性前置条件；新增固定参考账号 CSV 与 Apps Script Library 访问检查，保留原有本地参考项，并区分公开读取成功、登录限制和阻塞。
- 2026-07-21 · v1.0.0 · 删除“每日强制生成 Route A/B/C、四账号分发和今日多账号生产卡”的旧默认；把日常职责改为执行周计划，把候选研究限定在周一/重排/补库/合格 Hot，并统一内容池、产能、账号路由、对照实验和写回边界。
