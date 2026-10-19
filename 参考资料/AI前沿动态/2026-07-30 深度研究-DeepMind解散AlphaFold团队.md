---
title: 深度研究 · DeepMind 解散 AlphaFold 团队——"专才模型"时代收摊，通用模型 + agent 编排层接管科学
date: 2026-07-30
type: ai-deepdive
topic: DeepMind 重组 AlphaFold 团队 / grand challenge 范式终结 / Gemini 作为科研编排层 / 科学线人才流向 Anthropic
source: https://www.engadget.com/2225849/google-shuts-down-alphafold/
tags:
  - ai-news
  - research-report
  - google-deepmind
  - alphafold
  - ai-for-science
  - agent-orchestration
push_channel: feishu/research-reports
---

# 🧠 深度研究 ｜ DeepMind 解散 AlphaFold 团队：诺奖级"专才模型"时代收摊，通用模型 + agent 编排层接管科学

> **一句话定性**：这不是一次普通的组织调整——**DeepMind 亲手拆掉了那支为它赢得 2024 年诺贝尔化学奖的团队**：多数 AlphaFold 论文原作者在过去一年被内部改派（Gemini 相关项目、酶设计、核聚变、基因组学、以及 Alphabet 的制药公司 Isomorphic Labs），**近四分之一全职作者直接离职**；更刺眼的是，被调去内部"Code Strike"编码攻坚组的三位核心（含诺奖得主 John Jumper）转头去了 **Anthropic 继续做 AI for science**。它标记的是一次技术组织范式的翻页：**"一个大难题 → 一支专属团队 → 一个专才模型"，让位给"一个通用模型 + 一层多 agent 编排 + 把专才模型降级成被调用的工具"**。对做多 agent 系统的团队，这是"编排层优于专才模型"这条路线迄今最重的一次组织级下注——由世界上最有资格反对它的那家公司做出。

**来源**：**Financial Times 独家首发（2026-07-29）**；the-decoder（7/29）、TheNextWeb（7/29）、XenoSpectrum（7/29）、Engadget（7/30）、Yahoo Finance / Startup Fortune / digitaltoday 跟进；Hacker News 两个讨论帖（49093448 / 49096841）。
🔗 Engadget（可直读，含 Kohli 与发言人原话）：https://www.engadget.com/2225849/google-shuts-down-alphafold/
🔗 the-decoder（最全的人员流向与 25% 数字）：https://the-decoder.com/deepmind-dismantles-its-alphafold-team-as-key-authors-leave-for-anthropic/
🔗 TheNextWeb（内部员工评价）：https://thenextweb.com/news/deepmind-alphafold-team-dismantled-gemini-anthropic
🔗 官方对照文本 · DeepMind《Co-Scientist: A multi-agent AI partner to accelerate research》：https://deepmind.google/blog/co-scientist-a-multi-agent-ai-partner-to-accelerate-research/
🔗 官方对照文本 · DeepMind《AlphaFold: Five Years of Impact》（2025-11-25，存量数据基线）：https://deepmind.google/blog/alphafold-five-years-of-impact/
🔗 HN 讨论：https://news.ycombinator.com/item?id=49093448

> ⚠️ 证据等级说明：本篇核心事实来自 **FT 单一首发 + 多家二手跟进**，DeepMind 未发独立公告，仅以发言人回应形式确认。人员流向、Kohli 原话、25% 数字均可在多家跟进报道中一致复现；**未被多源交叉确认的部分（如具体人数）本篇不写**。

---

## 一、为什么这一篇值得单独深读

过去六周，本监测里 Google 这条线的碎片是这样的：

| 时间 | 事件 | 已推送 |
|---|---|---|
| 6/18–6/24 | 一周内五名资深研究员出走：Shazeer→OpenAI，Jumper / Adler / Pritzel / Conmy→Anthropic | 已作背景 |
| 6/22 | Alphabet 单日大跌（报道口径 5%~7%，两个交易日市值蒸发约 2250 亿~2700 亿美元） | 已作背景 |
| 7/16 | Gemini 3.5 Pro **第三次**跳票；曾把接近完成的版本整个作废、从 Gemini 3 底座重启预训练 | 已作背景 |
| 7/20 | The Information 首爆"Frozen v2"——把 Gemini 架构烧进硅，目标 ~2028 | backlog |
| 7/21 | 一次发三款 Gemini（3.6 Flash / 3.5 Flash-Lite / 3.5 Flash Cyber）**却独缺旗舰**，同时官宣 Gemini 4"史上最雄心预训练已开跑" | 已深推 |
| 7/23 | Pichai 在财报电话会称 Gemini 4 是"significantly larger"的前沿模型 | 已作背景 |

**这一条是上面所有碎片的收敛点，也是唯一一条把"资源到底挪去哪了"讲清楚的。** 前面每一条都在说 Google 在旗舰上吃力、在效率层抢戏、在硅上下长注、在流失人；这一条回答了代价由谁承担：**由那支拿了诺奖的科学团队承担。**

对我们的直接相关性在于第二层——**它不只是"砍科研保主业"，而是一次明确的架构选择**：DeepMind 不是不做科学了，而是判定做科学的正确形态从"训一个专才模型"变成"让 Gemini 当指挥中枢、多 agent 迭代、把 AlphaFold 这类专才模型当工具调用"。这正是我们每天在做的那件事的架构假设。当世界上最成功的专才模型团队被它自己的母公司按这个假设拆解时，这个假设值得认真拆一遍——包括它成立的条件，和昨天刚被我们记下的反例。

## 二、核心事实

### A. 重组本身

- **AlphaFold 专属团队实质解散**：多数 AlphaFold 论文原作者在**过去一年内**被陆续内部改派，不再有一支围绕 AlphaFold 的专属团队。
- **近 25% 的全职论文作者已彻底离开 DeepMind**（the-decoder / TheNextWeb / HN 一致口径）。
- **留下的人去了四个方向**：Gemini 相关项目、酶设计（enzyme design）、核聚变、基因组学；另有一部分转入 **Isomorphic Labs**（Alphabet 2021 分拆的制药公司）。
- **AlphaFold 项目起于 2018 年**；2024 年 Hassabis 与 Jumper 因它共获诺贝尔化学奖。

### B. 人的流向——以及那个刺眼的中间站

这是本篇最值得单独拎出来的一段事实链，**三步，每一步都有独立来源**：

1. **第一步（今年早些时候）**：John Jumper 与 AlphaFold 研究员 Jonas Adler 被调入 Google 内部 **"Code Strike"** 团队——一个为追赶 Anthropic 与 OpenAI 的编码能力而临时组建的攻坚组。
2. **第二步（6 月）**：Jumper 于 **2026-06-19** 在 X 宣布离开 DeepMind（在职近九年）加入 **Anthropic**；Adler 与另一位 AlphaFold 同事 **Alexander Pritzel** 随后跟进。
3. **第三步**：Jumper 到 Anthropic 之后做的是——**AI for science**。

也就是说：**把诺贝尔奖得主从蛋白质结构调去做编码 agent，人走了，然后去竞争对手那里继续做科学。** 一位 DeepMind 员工对 FT 称三人是"**instrumental, important, core members**"，其离职在内部"**sparked surprise**"（引发意外）。

同期 Anthropic 的科学线拼图（作为对照，非本条新闻）：2026 年内开设湿实验室、发表面向生物工作流的 agent 研究、与研究机构结伙；7/28 刚发布经原作者与独立密码学家核验的密码分析新结果（本监测 7/29 晚报已深推）。

### C. 存量资产没关——但这恰恰是最需要盯的地方

必须说清楚，**AlphaFold 的技术与服务没有被终止**：
- AlphaFold 蛋白结构数据库仍在线，**超过 2 亿条结构预测**；
- AlphaFold Server 仍可用（DeepMind 口径累计"helped make more than 8 million folds"）；
- AlphaFold 3 仍向学术界开放。

存量影响基线（DeepMind 官方 2025-11-25《Five Years of Impact》）：**300 万+ 研究者、190+ 国家/地区**（其中中低收入国家超 100 万用户）；被引 **35,000+ 篇论文**，**20 万+ 篇论文**在方法学上用到 AlphaFold 2 的组件；AlphaFold 相关研究中 **30%+ 聚焦疾病理解**；独立分析显示使用 AlphaFold 2 的研究者提交**新实验结构的数量增加 40%+**，相关研究被临床文献引用的概率是结构生物学同行的两倍。

**"服务没关"和"还会继续演进"是两件事。** 一个没有专属 owner 的公共科学基础设施，最可能的失效模式不是下线，是静默停滞。这是本篇给出的第一个可执行动作项（见第六节）。

### D. Isomorphic Labs 的承接位

- 2021 年从 DeepMind 分拆；
- **2026-05-12 宣布 21 亿美元 B 轮**，Thrive Capital 领投，Alphabet / GV 跟投，新投资方含 MGX、Temasek、CapitalG、UK Sovereign AI Fund；累计融资约 26 亿美元（估值未正式披露，市场传闻区间不引用）；
- 与 **Novartis、Eli Lilly、Johnson & Johnson** 有联合药物设计项目；
- 其药物设计引擎据称把 AlphaFold 3 在蛋白-配体预测上的精度**翻了一倍**。

**读法**：AlphaFold 的产业化价值被搬进了一个拿外部资本、有商业 KPI、能自己招人的实体；留在 DeepMind 母体里的，只剩"作为 Gemini 工具箱里一件工具"的角色。**这是一次把纯研究资产做资本化与工具化的双向剥离。**

## 三、机制拆解：DeepMind 到底换掉了哪一条架构假设

这一节是本篇的核心，也是"为什么这对做 agent 的我们重要"的答案所在。

### 旧范式：grand challenge → 专属团队 → 专才模型

Pushmeet Kohli（DeepMind 研究 VP）的原话把它讲得再清楚不过：

> "The strategy over the last nine years has been to focus on **grand challenges**... **a concrete goal every project is focused on**. The strategy **has evolved**."

九年间这条流水线的产物是一整个 Alpha 家族：AlphaGo、AlphaFold、AlphaMissense、AlphaGenome、AlphaProteo、GNoME。共同结构是：**选定一个可清晰定义、可客观评分的硬问题 → 组建专属团队 → 为它设计专用架构与训练目标 → 打穿它。** AlphaFold 是这条流水线最辉煌的一次输出，也是它的最后一次。

### 新范式：Gemini 当指挥中枢，专才模型降级为工具

DeepMind 已经把新范式写进公开文本了，本条新闻只是它的组织落地：

- **2026-03 DeepMind 博客原话**：*"We think the combination of Gemini's world models, AlphaGo's search and planning techniques, and **specialized AI tool use** will prove to be critical for AGI."* —— 注意 "tool use" 这个降格用词。
- **2026-05-19 两篇 Nature 论文**（Co-Scientist 与 ERA / Empirical Research Assistance），配合 Google I/O 2026 的 **Gemini for Science** 发布。
- **Co-Scientist 的机制**：基于 Gemini 的**多 agent 循环**——generate hypotheses → critique → rank → refine；除文献检索外直连 **ChEMBL / UniProt** 等数据库；**在部分研究合作中把 AlphaFold 这类专才模型当作工具调用**。
- **ERA 的硬指标**：在 COVID-19 住院预测上**跑赢美国 CDC 自己的集合预测模型**（经 Nature 同行评审）。

**范式差异的本质，是"智能放在哪一层"**：

| | 旧范式（AlphaFold） | 新范式（Co-Scientist） |
|---|---|---|
| 智能所在层 | **模型架构**（为问题量身设计） | **编排层**（通用模型 + 循环 + 工具） |
| 扩展方式 | 每个新问题重开一支团队 | 复用同一底座，换工具与提示 |
| 成本结构 | 一次性重投入，边际复用低 | 底座成本摊销，边际接近调用费 |
| 组织形态 | 专才小队 | 平台团队 + 领域接口 |
| 成功前提 | 问题可被单一目标函数刻画 | **假设可被便宜地排序与证伪** |

最后一行是全篇最关键的一句话，我把它单独放大：

> **编排层范式成立的真正前提，不是"通用模型足够强"，而是"这个领域存在一个便宜的裁决函数"。**

科学假设恰好满足这个条件——可以被 rank，可以被实验证伪。这是 Co-Scientist 的 generate→critique→rank→refine 循环能收敛的机制性原因，也是 Anthropic 7/28 那篇密码分析能拿出可信结果的同一个原因（密码分析结论可被程序化验证）。

### 两家的赌注已经收敛到同一层

把本条和昨天那条放一起看，图案就出来了：

- **Anthropic（7/28）**：用通用模型 Claude Mythos Preview + Claude Code 式**多 worker agent harness** + 沙箱 + Python/Sage，人类只做项目管理，做出了经原作者验证的 HAWK 格基签名结构性削弱（HAWK-256 攻击代价 2^64→2^38）。两个项目合计约 10 万美元 API 费用。
- **DeepMind（7/29）**：直接把组织按同一个假设重排——**不再养专才团队，改养编排层。**

**两家从不同方向走到同一个结论：竞争的战场已经从"专才模型的精度"上移到"整条研究流水线的编排"。** 而 harness 恰恰是我们自己能建、也必须自己建的那一层。

⚠️ 但同一周还有两个反向证据，必须一起记账：
1. **验证瓶颈（7/28 Anthropic 自述）**：*"The vast majority of our time over the past few months has been in verifying the correctness of Claude's results."* 模型一周做出 AES 结果，两名研究员花了近一个月才敢确认它对。**编排层提升的是生成吞吐，不是交付吞吐。**
2. **长时程退化（7/27 HumanLayer / SlopCodeBench，本监测 7/28 晚报已深推）**：Opus 5 在同一代码库上连续演进时，最佳 checkpoint 严格通过率仅 24%，77% 轨迹结构侵蚀上升。作者原话：*"today's models can't be relied on to run lights-off without steering."*

**所以 DeepMind 这次下注赌的是方向，不是当下的可用性。** 我们跟着这个方向走可以，但不能跳过"裁决函数"和"人类检查点"这两道现实门槛。

## 四、关键原话

**Pushmeet Kohli（DeepMind 研究 VP）——范式转换的官方措辞**：
> "The strategy over the last nine years has been to focus on grand challenges... a concrete goal every project is focused on. The strategy has evolved."

**DeepMind 发言人——存量叙事的标准防线**：
> "Many of the researchers behind AlphaFold continue today to drive scientific and technological advances across Google, Google DeepMind, and Isomorphic Labs."

**一位 DeepMind 员工对 FT 谈三人离职**：
> 三人是"instrumental, important, core members"，其离职在公司内部"sparked surprise"。

**Hacker News（49096841，49 分 / 18 评论；另一帖 49093448）——外部最尖锐的两条**：
> "There was something magical about the old days of Bell labs where there was just a naturally occurring and self-organizing list of all-star scientists."

> "Painful to see teams doing great work getting pulled away on the premise that there is 'even greater work' to be done."

> 另有评论把官方措辞直接翻译成：管理层其实在说"we don't know what to do and want ROI _now_"。

（HN 讨论体量偏小、批评集中在组织与情绪面，**不构成对新范式技术有效性的反驳**——这一点在下一节说清。）

## 五、正反观点

### 支持方：这是正确的抽象层上移，不是撤退

1. **任务完成论**：蛋白质折叠这个问题本身已经被打穿——2 亿条结构、300 万研究者、被引 3.5 万篇。一支专属团队的边际产出确实在下降。
2. **专才模型没有被丢弃，是被复用**：Co-Scientist 明确把 AlphaFold 当工具调用。从"孤岛模型"变成"共享底座上的可调用组件"，在工程上是升级不是降级。
3. **有同行评审的成绩单**：Co-Scientist 与 ERA 是 Nature 论文，ERA 跑赢 CDC 自家集合预测。**新范式不是 PPT，它已经拿出过经评审的胜利。**
4. **产业化路径更健康**：真正需要长期重资本投入的部分（药物设计）交给拿了 21 亿美元、有 Novartis / Lilly / J&J 合作的 Isomorphic，比留在母体里跟 Gemini 抢算力预算更可能出结果。
5. **公共基础设施保留**：数据库、Server、学术版 AlphaFold 3 都在。

### 质疑方：代价被系统性低估了

1. **25% 的作者流失是能力损耗，不是"strategy evolved"。** 组织可以重排 headcount，重排不出 tacit knowledge。
2. **"Code Strike"这一步几乎无法辩护。** 把诺奖级结构生物学家调去做编码 agent 攻坚，是把长期科研资产当可挪用的短期资源；结果人走了，还是去做科学——**这不是战略演化，这是配置错误被市场纠正。**
3. **时点太难看。** 旗舰 Gemini 3.5 Pro 三次跳票、一次发三款却独缺旗舰、六月一周内五人出走、Alphabet 单日大跌——在这个序列里"解散诺奖团队"读起来更像压力下的资源抽调，而不是从容的架构升级。
4. **新范式的证据还很薄。** Co-Scientist / ERA 之外缺少大规模第三方复现；而同一周的两份证据（验证瓶颈、长时程退化）都指向"编排层今天还跑不了无人值守"。**用一个尚未被充分验证的范式，去置换一个已经拿了诺奖的范式，是有风险的换手。**
5. **对开放科学的外部性没人计价。** 190 多个国家、100 万+ 中低收入国家用户依赖的公共设施，现在没有专属维护团队了。**没人宣布关停，也没人承诺继续演进。**
6. **反方的反方（要公平）**：HN 的 Bell Labs 怀旧属于情绪与组织社会学层面的批评，**它没有反驳"编排层是更好抽象"这个技术命题**。上面第 4 条才是真正有杀伤力的质疑。

## 六、深度解读：对行业 + 对"做多 agent 系统的我们"

### 对行业

1. **AI-for-science 的竞争单位变了**：从"谁的专才模型精度高"变成"谁的研究流水线编排得好"。**这抬高了通用底座持有者的相对优势，压低了单点专才模型团队的战略地位。**
2. **科学 AI 出现路线分叉**：Google 把它**并回主线**（Gemini 的一个应用面 + Isomorphic 的商业化），Anthropic 把它**立成独立战线**（诺奖得主 + 湿实验室 + 可验证的密码学结果）。两条路都通向 agent harness，但组织形态相反。**未来 6–12 个月是这两种形态的实证对比窗口。**
3. **顶级人才的定价锚从"钱"变成"能不能做我想做的事"**：Jumper 从 Google（诺奖、九年、VP + engineering fellow）走到 Anthropic，中间那一步是被调去做编码 agent。**在这一层，研究自由度本身就是薪酬。** 任何想留住顶尖研究者的组织都得算这笔账。
4. **"我们不做那个方向了"越来越少以公告形式出现**，而是以"团队被并入主线"的形式出现。**观察一家实验室的真实优先级，看组织图变动比看博客更准。**

### 对我们（这一节是重点，全部落到可执行）

**① 我们的架构假设刚被最强的反方背书了——但要拿对它的边界。**
"通用模型 + 编排层 + 把专才能力做成工具"这条路，现在有 DeepMind 的组织下注和 Anthropic 的可验证结果双重背书。但它背书的是 **"通用模型 + 结构化编排 + 工具"**，不是 **"prompt 得好就行"**。Co-Scientist 有明确的 generate→critique→rank→refine 循环和外部数据库接口；Anthropic 那次有多 worker、沙箱、Sage、和人类项目管理。**照抄的是结构，不是"交给模型"。**

**② 新增一条选型判据，放在"模型够不够强"之前：这个流程有没有便宜的裁决函数？**
这是本篇最该被记住的落地判断。以后评估"要不要把某个流程交给 multi-agent 编排"，第一问改成：
- 产出能不能被程序化判对错？（能 → 编排层 ROI 高）
- 判一次的成本是不是远低于生成一次？（是 → 可以放大并行）
- 都不行 → **别上多 agent 编排，人会变成瓶颈，agent 只是把瓶颈前移。**
（这条与 7/29 晚报"优先投向生成难、验证便宜的问题"是同一条原则的选型版本，现在有了第二个独立实证。）

**③ 在 agent 设计里显式分层"什么该是模型、什么该是工具"。**
DeepMind 的动作等于宣布：**能被清晰定义、可客观评分的窄任务，正确形态是工具/专才组件，不是塞进 LLM 的一段 prompt。** 具体到我们的 harness：
- 结构化抽取、校验、计算、检索排序 → 做成确定性工具或小专才模型，进工具注册表；
- LLM 只做规划、裁决、和跨工具的语义粘合；
- 每个工具都要有独立可测的正确性，不依赖模型自评。

**④ 不要把"专才小队"当长期资产——把承重能力落到 harness、评测集和工具接口上。**
AlphaFold 团队的教训对我们这个规模同样成立：**人和注意力一定会被主线吸走。** 所以任何"某个人的专属项目"形态的能力都是脆的。承重的东西必须是：可复用的 harness、有版本的评测集、有契约的工具接口、写下来的裁决标准。**这些活得比小队长。**

**⑤ 立刻加一条依赖清单字段：上游是否还有专属 owner。**
这是本篇最直接、最低成本的动作项。任何依赖第三方专才 API / 模型的链路（AlphaFold Server 只是最新的例子），在依赖清单里补两列：
- `last_substantive_update`（最近一次实质更新，不算 uptime 公告）
- `has_dedicated_owner`（上游还有专属团队吗？未知也要标未知）

**"服务在线"不等于"服务在演进"。** 静默停滞的上游是比宕机更难发现的技术债——宕机会报警，停滞不会。

**⑥ harness 正在成为竞争资产，而它恰好是我们能自建的那一层。**
两家前沿实验室的赌注都收敛到 harness，而 harness 不需要前沿算力。**这意味着我们和大厂在这一层的差距，小于我们和它们在模型层的差距。** 值得把 harness（编排结构、裁决层、工具注册、检查点策略）当作正式的产品资产来投，而不是当胶水代码。

**⑦ 但别跳过人类检查点。**
把本条的方向乐观和上周的两个反例并列执行：任何让 agent 连续演进同一份产物超过 4–5 个 checkpoint 的流程，**仍然必须设人类检查点**（7/28 SlopCodeBench 行动项，本条不修改它，只是给它加了一个"方向是对的"的注脚）。

## 七、接下来盯什么（信号）

1. **AlphaFold 的下一次实质更新**——数据库/Server/AlphaFold 3 学术版有没有新版本。若 6 个月内无实质更新，"存量服务保留"就该被重新读成"静默冻结"，我们第 ⑤ 条的字段直接翻红。
2. **Co-Scientist / ERA 的第三方复现**——Nature 论文之外，有没有独立团队复现"编排层跑赢专才/人类基线"。这是新范式从"官方成绩单"变成"可押注基建"的唯一路径。
3. **Anthropic 是否为 Jumper 成立正式的 science 组织，并在 8 月内拿出第二个经原作者/同行确认的结果**（对照 7/28 密码学）。一个结果是运气，两个是能力。
4. **其他 Alpha 系列的命运**——AlphaGenome / AlphaProteo / GNoME 是否也被并入 Gemini 线。若是，"专才模型时代收摊"就从一个团队的故事升级为整条产品线的定论。
5. **Gemini 3.5 Pro / Gemini 4 是否兑现**——这次重组抽调的资源最终能不能变成产出。若旗舰继续跳票，"解散诺奖团队"的定性会从"架构升级"滑向"压力下的资源拆借"。
6. **DeepMind 科学线是否继续失血**——再有资深科学研究员流向 Anthropic / OpenAI，就不再是个别选择，而是一家实验室在科学线上的系统性失守。
7. **Isomorphic Labs 的首个临床里程碑**——它现在是 AlphaFold 血脉唯一有商业 KPI 的承接方，成败直接决定"剥离式产业化"这条路的评价。

---

## 📚 延伸阅读

- Engadget《Google DeepMind disbands its Nobel-prize winning AlphaFold team》(7/30)：https://www.engadget.com/2225849/google-shuts-down-alphafold/
- the-decoder《Deepmind dismantles its AlphaFold team as key authors leave for Anthropic》(7/29)：https://the-decoder.com/deepmind-dismantles-its-alphafold-team-as-key-authors-leave-for-anthropic/
- TheNextWeb《DeepMind dismantles its Nobel-winning AlphaFold team》(7/29)：https://thenextweb.com/news/deepmind-alphafold-team-dismantled-gemini-anthropic
- XenoSpectrum 分析《AlphaFold's Dedicated Team Reportedly "Dissolved"》(7/29)：https://xenospectrum.com/en/deepmind-alphafold-team-shift/
- DeepMind 官方《Co-Scientist: A multi-agent AI partner to accelerate research》：https://deepmind.google/blog/co-scientist-a-multi-agent-ai-partner-to-accelerate-research/
- DeepMind 官方《AlphaFold: Five Years of Impact》(2025-11-25)：https://deepmind.google/blog/alphafold-five-years-of-impact/
- Google 官方《Gemini for Science》(I/O 2026)：https://blog.google/innovation-and-ai/technology/research/gemini-for-science-io-2026/
- Isomorphic Labs B 轮公告（2026-05-12，21 亿美元）：https://www.isomorphiclabs.com/articles/isomorphic-labs-announces-series-b-investment-round
- Fortune《As top talent leaves Google DeepMind, some question if the lab can remain at the forefront》(6/23)：https://fortune.com/2026/06/23/google-deepmind-ai-researcher-departures-raise-doubts-about-ability-to-win-the-ai-race-shazeer-jumper-eye-on-ai/
- Axios《Google takes the hit in AI's talent war》(6/23)：https://www.axios.com/2026/06/23/ai-lab-agi-google-deepmind-departures
- HN 讨论：https://news.ycombinator.com/item?id=49093448 ／ https://news.ycombinator.com/item?id=49096841

**本监测相关前作**：7/22 早报《一次发三款 Gemini 却独缺旗舰》｜7/29 晚报《Claude 做出真密码学新结果——验证成为新瓶颈》｜7/28 晚报《编码 agent 长时程退化（SlopCodeBench）》
