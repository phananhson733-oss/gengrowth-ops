---
name: astrologywiki-social-workflow
description: "Use for AstrologyWiki weekly candidate research, qualified Hot assessment, account routing, selected-record script drafting, social copy, short-video ideas, X posts, or execution of the active rolling-week plan. Ordinary daily work advances locked items; new candidates are allowed only for Monday planning, confirmed inventory refill, explicit replan, or a qualifying Hot item."
---

# AstrologyWiki Weekly Social Planning and Hot Response

本 Skill 是候选研究、热点判断、账号路由和公共表达规则，不是第二套周计划或内容状态系统。

## 1. Authority

执行顺序：

1. [[inbox-pengman/02-生产/00-evergreen-workflows/weekly-rolling-content-production-sop]]
2. 当前周计划：`02-生产/04-weekly-content-plans/`
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

### Miraa Community Topic Research

为 `@miraaastrology` 执行 Mode B 周一候选研究或 Mode C 补库/重排时，在生成候选前必须完成英语社区话题调研。完整执行契约见 [references/community-topic-research.md](references/community-topic-research.md)，必须全文读取后执行。

- 先研究近期英语社区正在反复讨论的目标星座或星座组合的现实问题，再从研究结果生成候选；不得从产品定位直接跳到标题列表。
- 实际打开 Reddit、X、Quora、TikTok/YouTube 公开讨论或其他相关英语社区页面；搜索摘要、标题和平台元数据不能代替正文或评论。
- 优先最近 90 天，其次最近 12 个月；更早内容只用于说明长期重复，不得冒充当前热度。
- 调研阶段至少交付 5 个不同讨论点，目标 8–12 个，并保留直接链接、互动可见性、跨平台重复、反方观点、生活细节和自然英语表达。
- 调研输出只是证据池，不得在此阶段生成最终 Hook、脚本、Caption、Hashtag 或替 Pengman 选定题目。
- 若平台正文或评论不可读，记录具体失败层级和 `互动量不可核验`；不得根据标题猜正文、伪造互动量或用户原话。
- Mode D 单个 Hot 评估继续执行 Hot 专用证据门；除非用户同时要求刷新 Miraa 候选池，否则不强制重做完整社区话题池。

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

- 默认使用自然、简洁、面向美国受众的英语生成所有正式选题、Hook、Script、Caption 和公开文案；研究笔记与内部解释可以使用中文。只有 Pengman 在当前任务中明确要求其他语言时才切换。
- 生成候选时，候选标题、选题、角度、测试变量、Hook 和 Script 正文均使用英语，不因用户用中文描述任务而切换成中文。

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

生成完整 Script 时，第一句口播（如有 speaker label，则指 label 后的第一句）必须先作为独立 Hook 生成并通过上述检查；它继承当前 Hook 偏好，不能只按正文的 Script 风格生成。

### 8.1 Pengman 的 Hook 与白纸重写偏好

以下是 Pengman 已明确确认的生产偏好，适用于 `@miraaastrology` 的 AI Host / 双人口播选题与脚本。单条主生产记录的具体要求优先；双人口播按下方专用规则执行。

**单人 AI Host 的强 Hook 必须：**

- 优先用“目标身份／性格判断 + 广泛可认领的行为、关系张力或后果”直接开场；可以从 `Scorpio...`、`Scorpios...` 或目标配对开始；
- 在前 2–3 秒让用户知道在说谁、核心判断或冲突是什么，以及为什么值得继续听；
- 性格判断必须落到普通观众马上能理解的行为、关系问题或结果，不能只给抽象标签；
- 使用自然、简单的美式英语，能直接被放上首屏大字幕；
- Hook 保持宽、直、容易认领；具体时间、地点、人物和生活细节默认放进正文证明 Hook，不强制塞进首句；
- 先给身份判断或广泛矛盾，再解释心理机制；不把“深刻”误写成含糊。

**单人 AI Host 的完整 Script 必须：**

- 保持一个主播连续讲述；默认不写创作式人物对话、引号台词、`X says / X asks`、角色轮流回应或伪双人口播。只有 Pengman 对当前单条内容明确要求对话时才可例外；
- 双方关系内容用主播自己的叙述说明各自行为、误解和后果，不通过虚构台词制造具体感；
- 目标成片时长允许在 45–90 秒内按内容需要变化，不再把 60 秒作为硬上限；`word_count` 只作派生检查，不设统一硬字数上限，最终以当前 AI Host 实际音频时长为准；
- 单条主生产记录若冻结了更窄的实验时长，则继续服从该记录，不能借本范围擅自改变实验变量。

**当前已确认的 Hook 方向示例：**

- `Scorpios have very few real friends.`
- `One small lie can make Scorpio question the whole relationship.`
- `Scorpio and Capricorn can both struggle to say what they need.`
- `You can know a Scorpio for years and still not know what they're feeling.`

这些示例用于说明“身份明确、矛盾广泛、简单可认领”的机制，不得机械套句或替换星座名。

**默认避开：**

- `Scorpio is mysterious`、`Scorpio has emotional walls` 等只有抽象性格标签、没有行为、关系张力或后果的首句；
- `mysterious`、`emotional walls`、`access`、`boundaries`、`emotional depth` 等抽象词作为 Hook 主体；
- 只说“Scorpio is/has ……”却没有可认领判断、冲突或后果的空泛身份标签；
- 餐厅、前任、具体时刻、单次约会、搬家、送饭等过窄场景作为默认 Hook；只有该场景本身是选题核心、足够普遍且已获确认时才使用；
- 以诗意、治疗话术、AI 总结句或工整对偶代替真实处境。

**双人口播开场只使用以下两种结构：**

1. **问句开场（默认优先）**
   - 第一人代表观众提出一个短、直接、可独立成立的问题，优先以 `Who`、`Why` 或 `How` 起手；不先讲背景或具体小场景。
   - 可用方向：`Who's Scorpio's soulmate?`、`Why do Scorpios pull away when they care?`、`How does Scorpio know they can trust you?`
   - 第二人直接给出简短答案，再负责主要解释和情绪落点；不要把两人写成来回铺陈的平等聊天。
2. **判词开场 + 第二人附和**
   - 第一人先给一句短、直、有态度的身份或关系判断，例如 `Scorpio husbands are the hardest people to read.` 或 `I've never seen anyone protect a relationship like a Scorpio.`
   - 第二人先用一句自然的短回应附和、确认或轻微修正，例如 `Exactly.`、`That's true — because...`，再展开原因；不要重复第一句或另起无关场景。
   - `the most...`、`I've never seen...` 等强表达只能作为说话人的观察或创作者口吻，不能伪装成有统计证据的事实，也不能违反安全线或变成人身攻击。

**双人口播共同规则：**

- 第一人的开场尽量能在约 2 秒内自然说完，并在第一句点明 Scorpio、目标关系或核心困惑。
- `选题审批.hook` 只保存第一人的第一句，不写 `Partner:`、`Scorpio:` 等说话人标签，也不把第二人的回答或整段对话塞进 Hook 单元格。
- 在 `angle` 或冻结写作包中记录开场类型（`question_first` / `verdict_echo`）和第二人的首个回应方向；不为此新增一套表格字段。
- 生成双人口播候选时，按话题选择上述结构，并改变问题或判断角度；不靠替换人物、场景或堆叠修饰词制造差异。
- 具体行为、生活场景和双方视角放进第二人的解释和后续脚本，除非该场景本身就是已经核验的选题核心。

**双星座配对 Hook 偏好（作参考，非强制）：**

以下结构是 Pengman 偏好的配对题材 Hook 方向；在话题合适时优先采用，不是唯一写法，不机械套句或替换星座名。

- `[Sign A] and [Sign B] can be the [形容词] match in the zodiac.`（最高级/命定匹配判断）
- `Have you ever seen [Sign A] and [Sign B] together?` / `You rarely see [Sign A] and [Sign B] together.`（稀有组合好奇）
- `This is why [Sign A] and [Sign B] are obsessed with each other.`（强吸引/沉迷好奇）
- `You know what's dangerous about a [Sign A] and a [Sign B]?`（危险/没人谈的秘密缺口）
- `If you're a [Sign A] who's locked in with a [Sign B], you might wanna stick around.`（关系定向 + 留看承诺）

竞品同类型参考（学结构与情绪浓度，不复制措辞）：
- `Capricorn and Aries — two powerful energies the universe keeps pulling back together.`
- `The dangerous thing about a Leo and Scorpio connection... nobody talks about this.`
- `Why Cancer and Virgo are Obsessed with Each Other.`（@kinglexagod，75.2K）
- `You know what's dangerous about a Virgo and a Cancer?`（@mazi1k，126.9K）
- `If you're a Cancer who's currently locked in with a Virgo, you might wanna stick around.`（@mads_cancer，21.7K）
- `Scorpio + Pisces = so deep it feels almost psychic.`

不偏好：`When [Sign A] does X, [Sign B] does Y — and both feel ...` 的"行为对照错位"式配对开场（含 `[Sign A] does this, [Sign B] hears something different` 变体），配对题材避免以此作为默认首句。

**写稿动作：**

1. 先读取目标单条主生产记录、`01-reference/` 中相关参考、同账号最近已发布记录与当前未发布记录。
2. 只从参考中学习 Hook 清晰度、场景、节奏和情绪推进；不复制竞品句子、顺序、隐喻、CTA 或未经核验的主张。
3. 先给 5 个彼此不同的 Hook 候选。单人 AI Host 改变身份判断、关系张力或后果角度，不靠替换窄场景制造差异；双人口播按专用规则改变问句或判词角度，并在适合时覆盖两种开场结构。
4. 选择最强 Hook 后再写完整稿。若没有一个 Hook 能通过“谁／行为／为什么有关”的 2–3 秒检查，先重写 Hook，不用抽象句勉强起稿。
5. 当 Pengman 要求“从零重写”时，将现有 Hook、Voiceover、Caption、Overlay 和模型初稿视为已否决过程稿；只继承主生产记录中已确认的选题、核心机制、来源、形式、禁止项与实验变量。不得做同义替换式改稿。
6. 脚本初稿完成后，执行本 Skill 的 Humanization Gate；最终稿仍只是 `candidate`，直到 Pengman 明确确认。


<!-- preference-rule:a023755f-3f23-4f39-83f9-b21a2faa1aef -->
- **偏好训练确认 · 2026-08-17**：优先“抽象概念需要用更简单直白的词表达”。适用范围：适用于后续短 Hook：优先使用简短、直白、容易立即理解的行为表达。。
<!-- /preference-rule:a023755f-3f23-4f39-83f9-b21a2faa1aef -->


<!-- preference-rule:4d648243-9ffa-4dd7-a93e-ea92d2af866d -->
- **偏好训练确认 · 2026-08-18**：优先“偏好更简洁的 Hook”。适用范围：适用于后续关系类短 Hook，在保留关系张力的前提下压缩长度。。
<!-- /preference-rule:4d648243-9ffa-4dd7-a93e-ea92d2af866d -->

## 8.2 刺激度与留存（竞品学习）

当前 `@miraaastrology` 视频缺少刺激、播放量下滑。以下手法提炼自竞品调研（[[inbox-pengman/02-生产/01-reference/竞品高播放学习要点-刺激度与留存]]），用于提升 Hook 刺激度和完播留存。它们与 8.1 的已确认偏好**叠加，不替代**；冲突时单条主生产记录优先，其次本节 canary 验证结论。

### Hook 刺激度

- 允许并优先使用更强的断言、警告或反常识式 Hook：`Never ...`、`Don't ...`、极端判断，以及"不是 X，而是 Y"的意外翻转。给出"具体越界行为 + 立即后果"，不先解释星座背景。
- 禁止升级为博眼球标题党：不用 `most dangerous / dark side / worst ... exposed` 等耸动标签，不用病理化标签，不用脏话。
- 断言必须落到可认领的行为或关系后果，抽象标签仍用简单直白的词。

### 身份认领续看钩子

- 每条正式脚本在 Hook 后 3–10 秒补一句轻量身份认领，明确"这是给你看的"：`If you're a Scorpio, keep listening.` / `If this sounds like you, stay to the end.`
- 续看钩子只点身份，不剧透结论，不写成标题党。

### 正文留存结构

- 结果先行、原因后补：先给关系结局或后果，再倒推观众此前忽略的信号。
- 用"他们 X，但 Y"短对仗替代长因果解释；平均句长缩短，避免复杂从句。
- 星座即主语：正文短句尽量以该星座为主语，新观众 1 秒识别"关于谁"。
- 数字清单仅限 3 点，且 3 点都证明同一个核心机制；把最有情绪、最能引发评论的一点放最后。

### 收尾

- 可用警告后果式强收束，但只用于"明显越界行为"语境，保留"保护自己"的公平落点，不写宿命式 `once you do, you're out`。
- 也可停在隐藏需求或保护目标，不强加 CTA。

### caption 与 hashtags

提炼自 [[inbox-pengman/02-生产/01-reference/竞品-caption-hashtags-对照与模式]]：

- caption 从"一句式收尾"升级为"Hook 句 + 轻量身份认领 CTA"，不做整段脚本复述：`Are you a Scorpio? Drop your birthday below.` / `If this sounds like you, type "YES".`
- 身份认领 CTA 只问身份、不留私人信息，不违反可信定位；是竞品评论量的主要来源。
- hashtags 扩到 5–6 个：星座位 + `Tok` / `Season` 变体 + `#ZodiacSigns` + `#Astrology`，可测试加 `#AstrologyTok` / `#ZodiacTok`。
- 不用流量标签 `#fyp / #uktiktok / #tiktokgrowth`，不用 `#podcast / #podcastclips`（语义不符），不复制标题党 caption。
- caption 用 1–2 个星座符号或互动 emoji（♏️ 💬 👇），保持克制，不堆砌。

### 边界与验证

- 全部手法遵守第 7 节 Topic and Safety Rules 与账号指南红线。
- 只学结构与节奏，不复制竞品句子、顺序、隐喻、CTA 或未经核验的主张。
- 每项新手法先做 1 条 canary，与当前开场结构在 24h/72h 对照；一次只改一个变量，不与换星座、换 Host、换双人口播或 CTA 大改叠加。
- canary 结论经 Pengman 确认后，才把相应手法固化为默认偏好（写回 8.1）。

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

若目标包含 `@miraaastrology` 的 Mode B 或 Mode C 候选池，再按 [references/community-topic-research.md](references/community-topic-research.md) 完成社区话题研究，先保存 Research receipt、话题分层、生活细节库、语言库和完整来源清单。Social OS 执行时先用 `source-ingest` 将可用证据写入证据池，再由 `research` 生成候选；社区研究结果不得直接自动通过 H1 或 H3。

### Step 3：收集候选

只生成填补真实缺口所需的候选。Idea 可以多于 Selected，但默认候选数量不超过剩余可执行名额的 2–3 倍。

每条候选记录：

- title / account / pool / pillar / format；
- Hook；
- 双人口播候选在 `angle` 或制作说明中记录 `question_first` / `verdict_echo` 与第二人回应方向；`Hook` 本身只保留第一人的开场句；
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
- 周一候选研究、社区话题研究、Hot 证据和明确重排：`01-调研资料/候选与热点研究/`
- 已选 Brief、脚本、制作与发布回链：`02-content-production/`
- 发布数据和周级复盘：`05-weekly-digests/` 与 `02-生产/03-data-review/`
- 历史题库和历史流程：`02-调研资料/历史流程/`，只在明确追溯时读取

## Change Log

- 2026-08-24 · v1.7.2 · 在 8.1 记录 Pengman 的双星座配对 Hook 偏好：`A and B can be the [形容词] match`、`Have you ever seen A and B together`、`This is why A and B are obsessed with each other`、`dangerous... nobody talks about`、`locked in with... stick around` 作参考非强制；明确不偏好 `When A does X, B does Y` 行为对照式配对开场。同步更新账号指南 Hook 方向，并补竞品配对 Hook 样例（来自参考账号 Google Sheet 与 Cancer×Virgo 三份调研）。
- 2026-08-24 · v1.7.1 · 在 8.2 补 caption/hashtags 规则：caption 升级为"Hook 句 + 身份认领 CTA"、hashtags 扩到 5–6 个含星座 Tok/Season 变体、禁用流量标签和标题党 caption。配套新增 `01-reference/竞品-caption-hashtags-对照与模式.md` 与原始抓取 receipt。
- 2026-08-24 · v1.7.0 · 新增 8.2「刺激度与留存（竞品学习）」：允许更强断言/警告/反常识 Hook、身份认领续看钩子、"X 但 Y"短对仗、结果先行、警告后果式收尾、三点清单；明确禁止标题党/病理化/脏话，并要求每项手法先 canary 对照验证后再固化为偏好。配套新增参考文件 `01-reference/竞品高播放学习要点-刺激度与留存.md`。
- 2026-08-20 · v1.6.3 · 明确 Miraa 单人 AI Host 默认使用连续叙述、避免创作式对话，并将通用目标时长扩展为 45–90 秒；word count 改为派生检查，实际音频时长优先。单条已冻结实验仍优先。
- 2026-08-14 · v1.6.2 · 将选题、Hook、Script 与候选说明的默认输出语言统一为自然美式英语；中文仅用于内部研究与偏好解释，除非 Pengman 当次明确要求其他语言。
- 2026-08-14 · v1.6.1 · 修正现行生产入口为 `02-生产/`，供 Preference Studio 和其他调用方稳定读取当前权威文件。

- 2026-08-13 · v1.6.0 · 扩展 Miraa 双人口播偏好：允许 `Who / Why / How` 短问句，或“第一人直接下判词、第二人简短附和后解释”；同时规定选题审批的 Hook 只保存第一人的第一句，不再写入两人的整段场景对话。
- 2026-08-13 · v1.5.0 · 为 Miraa 正式候选池更新增加英语互联网社区话题调研前置步骤：实际打开帖子和评论、优先近期来源、跨平台判断讨论度，先形成研究证据池再生成候选，研究阶段不写 Hook 或脚本。
- 2026-08-13 · v1.4.0 · 以 Pengman 当前确认偏好修正单人 AI Host Hook：允许并优先使用直接身份／性格判断开场，但必须带广泛可认领的行为、关系张力或后果；具体小场景默认移入正文，不再强制作为 Hook。
- 2026-08-11 · v1.3.1 · 记录 Pengman 对双人口播 Questioner Hook 的确认偏好：直接问句、优先 `Why` 或 `Who` 起手、约 2 秒内说完、不在首句铺具体场景，具体冲突由 Miraa 展开。

- 2026-08-04 · v1.2.0 · 修正迁移后的 `02 / 03 / 05 / 07` 当前路径；将不可用时会阻断流程的 `/humanizer` 硬依赖改为可核验 Skill 或总控审稿 + Pengman 确认的等价门槛。
- 2026-07-21 · v1.1.0 · 将实时互联网调研设为所有新候选的硬性前置条件；新增固定参考账号 CSV 与 Apps Script Library 访问检查，保留原有本地参考项，并区分公开读取成功、登录限制和阻塞。
- 2026-07-21 · v1.0.0 · 删除“每日强制生成 Route A/B/C、四账号分发和今日多账号生产卡”的旧默认；把日常职责改为执行周计划，把候选研究限定在周一/重排/补库/合格 Hot，并统一内容池、产能、账号路由、对照实验和写回边界。
