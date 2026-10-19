---
title: 深度研究 · Anthropic 被逼表态——开放权重之战里最后一个不签字的人
date: 2026-07-28
type: ai-deepdive
topic: 开放权重政策 / Anthropic vs 开源联盟 / 中国模型禁令
source: https://www.anthropic.com/news/position-open-weights-models
tags:
  - ai-news
  - research-report
  - anthropic
  - open-weights
  - ai-policy
  - us-china
push_channel: feishu/research-reports
---

# 🧠 深度研究 ｜ Anthropic 被逼表态：开放权重之战里最后一个不签字的人

> **一句话定性**：这不是一篇安全博客，而是 Dario Amodei 在被整个行业（含白宫 AI 顾问）指名点姓四天后的**被动辩护状**——它表面上放弃了"禁开源"的立场，实际上把战场从"要不要禁开放权重"偷换成"谁有资格发放上市许可"，而这恰恰是社区读出的真正杀招。

**来源**：Anthropic 官方 Newsroom，《Our position on open-weights models》，作者 Dario Amodei，2026-07-27。
🔗 原文：https://www.anthropic.com/news/position-open-weights-models
**热度**：Hacker News 头版第 1，400 分 / 536 评论（HN id 49076057）；CNBC、Axios、Fortune、TNW 当日跟进。

---

## 一、为什么这一篇值得单独深读

因为它是**一周之内三条线撞在一起的交汇点**，而不是又一次立场重申：

1. **政策线**：华盛顿正在重启对中国开放权重模型的封禁；
2. **产业线**：黄仁勋牵头、25→50 家美国公司联署反对"过早限制可下载模型"；
3. **技术线**：Kimi K3 于 7/26 放出 2.8 万亿参数、1.4TB 的全量开放权重，把"可下载的近前沿能力"变成既成事实。

Anthropic 是唯一一家在这三条线全部收紧时**仍不签字**的头部实验室。这篇文章就是它被架在火上后的回应。对我们的价值不在于"Anthropic 怎么想"，而在于：**它泄露了未来 12 个月模型供给侧最可能的监管形态**——不是禁令，是发牌制。

## 二、核心事实（按可信度分层）

### A. 一手可确认（Anthropic 官方原文）

Dario 提出四条主张：

1. **否认禁令主张**（全文的政治目的）：
   > "we have not and are not advocating for a ban on open-weights models as a category"

2. **不可撤回性是核心论据**：
   > "once weights are released they cannot be withdrawn"
   > "safeguards can be removed, and copies can be downloaded, redistributed, and run on private systems beyond monitoring."
   —— 即：权重一旦公开，**撤销访问、推送补丁、监控滥用**这三件事同时失效。

3. **正面否定"开源=更安全"这条公理**：
   > "I don't agree with the letter's assertions that open-weights models necessarily make it easier to develop safeguards or that broad access to capabilities necessarily helps defenders more than attackers."
   他举生物领域为例，认为可能存在**攻防不对称**（attacker–defender asymmetry），主张用实证测量代替默认假设。

4. **提出三条"替代药方"取代封禁**：
   - **芯片管制**："We should not sell powerful chips or chipmaking equipment to China"，并打击"rampant smuggling and workarounds"，称这是"最高效直接"的路径；
   - **打击工业级蒸馏**："Distillation is a much more compute-efficient process than training models from scratch. It allows China to build much better models than its number of chips would ordinarily enable." Anthropic 承诺内部"识别并封禁用于蒸馏的账号"，同时承认执行"challenging"；
   - **强制安全测试**："All sufficiently capable models, open and closed, should go through mandatory safety testing"，覆盖网安、生物、对齐三类风险，**不分开源闭源**。

⚠️ 值得注意的**缺席**：全文没有给出任何能力门槛数值、时间表、执法主体，也**没有提及 Anthropic 自己开放过什么模型权重**。

### B. 交叉核实的时间线（多家独立报道一致）

| 日期 | 事件 |
|---|---|
| 7/20 | Axios 报道：特朗普政府以网安为由**重启封禁中国 AI 模型**的推动 |
| 7/21 | 白宫科技顾问 Michael Kratsios 指控 Moonshot 在开发 K3 时**蒸馏了 Anthropic 的 Fable**；财长 Scott Bessent 在 Fox Business 称不当蒸馏美国模型的中国公司**可能面临制裁** |
| 7/24 | 《Open Weights and American AI Leadership》公开信发布，**25 家**联署：Nvidia、Microsoft、Meta、IBM、Dell、Palantir、a16z、Hugging Face、Y Combinator、Mozilla、Mistral、Replit、Perplexity、Linux Foundation 等；要求华盛顿避免对可下载模型施加 **"premature restrictions"** |
| 7/25 | 黄仁勋用其**首条 X 帖子**转发该信（约 1100 万浏览），签署方**一天内翻倍至 50 家**，AMD、Cisco、Cloudflare、GitHub、Block、Ollama 加入；**OpenAI 与 Google 补签**。仅剩 **Amazon 与 Anthropic** 缺席 |
| 7/26 | Moonshot **Kimi K3 全量开放权重**发布（2.8T 参数 / 1.4TB） |
| 7/27 | Dario 发文表态 |

### C. 未独立核实（标注待核）

聚合源提到的既有限制背景——2026 年某法律限制 DeepSeek 部分用途（有豁免）、6 月五角大楼黑名单扩至阿里与百度（2027-06 起禁直接与第三方采购）、多部委员工使用禁令——**均为二手转述，具体条文未核**，本文不作为论证基础。

## 三、机制拆解：为什么"强制安全测试"是全文的真正筹码

Dario 的四条主张里，前三条都指向**别人**（中国、走私者、蒸馏者），只有第四条指向**所有模型发布者**。而这第四条恰恰是唯一一条会改变美国本土开源生态成本结构的。

机制上，"mandatory safety testing" 引入了三个此前不存在的东西：

1. **发布前置审批点**——开放权重的核心优势是"编译完就能推"，一旦插入强制前置测试，发布节奏就从工程周期变成审批周期；
2. **未定义的门槛**——"sufficiently capable" 没有数值定义，意味着门槛由执法方事后解释；
3. **未定义的失败后果**——文章没说测试不通过会怎样。若答案是"不得发布"，那么"不是禁令"这句话在实践上就只剩字面意义。

HN 上票数最高的批评把这个机制说得最直白：

> "This is exactly how the US has banned goods in the past, by requiring a stamp and then refusing to issue it."

**成本侧的不对称才是要害**：Anthropic、OpenAI 这类公司本来就有内部 RSP/Preparedness 评测流水线，强制测试对它们是**已沉没成本合规化**；对一个放 20B 权重上 Hugging Face 的实验室或初创，则是从零新增的固定成本。同一条规则，对在位者是零边际成本，对挑战者是准入门槛——这是教科书式的**监管护城河**，无论主观动机如何。

## 四、正反观点

### 支持方（Anthropic 及少数中立者）

- **不可撤回性是真实的技术属性**，不是修辞。Fable 5 事件（见下）已经证明：闭源模型可以在 96 小时内被政府全局关停，而开放权重模型**任何人都关不掉**——这对监管者是缺陷，对使用者其实是特性，但对"发现严重缺陷后想召回"的场景确实无解。
- **"开源必然更利于防守方"确实是未经检验的断言**。要求用实证而非公理来支撑政策，方法论上站得住。
- HN 上的中立辩护：
  > "Their position seems fair to me—sure it does help them as well, but I don't necessarily disagree with the risk they are laying out."

### 质疑方（声量压倒性更大）

- **David Sacks**（白宫 AI 顾问）："The entire tech industry (save for Anthropic) has come out in favor of open source AI"，并称应 "watch these guys like a hawk"。
- **Bill Gurley**（Benchmark）：直指商业动机——开放权重"compete with their corporate economic strategy"。
- **李开复**：谁**没**签这封信，比谁签了"far more interesting"。
- **一致性质疑（最锋利的一刀）**：2026-06-12，美国商务部以出口管制为由要求 Anthropic 阻断**所有外国国民**（含公司内部外籍员工）访问 Fable 5 与 Mythos 5；由于无法在共享云基础设施上实时区分国籍，Anthropic **将两个模型全球下线**，直到 6/30 管制解除、7/1 恢复，共约 **19 天**。当时 Anthropic 的反对逻辑是"限制伤害防守方、能力在别处照样可得"——**与它现在拒签的那封公开信的核心论证几乎完全一致**。
- **IP 双标**：HN 高票评论的讽刺——"World's greatest IP thieves propose crackdown on IP theft"：用未授权数据训练的公司，现在要求打击蒸馏。
- **执行不可能性**：多家报道指出，开放权重一旦下载即可离线私有运行，镜像遍布全网，**全面召回近乎不可能**。这意味着针对中国模型的禁令实际惩罚的是**遵纪守法的美国企业**，而不是模型的可获得性。

## 五、深度解读：对行业 + 对「做多 agent 系统的我们」

### 对行业

**开源/闭源之争已经完成了性质转变**：从技术路线之争 → 商业模式之争 → 现在是**立法形态之争**。真正的分野不再是"开不开源"，而是"**谁有权决定一个模型能否上市**"。黄仁勋阵营要的是无许可发布（permissionless release），Anthropic 要的是有条件发布（conditional release）。25→50 家签署方里包含 Nvidia、Microsoft、Meta、a16z、YC、Linux Foundation——这不是开源理想主义联盟，是**"不想被前沿实验室卡脖子的所有人"的联盟**，其中大部分成员的商业利益就是让模型层商品化。Anthropic 与 Amazon 同时缺席尤其微妙：Amazon 是 Anthropic 最大投资方。

同时要看到一个反直觉的事实：**OpenAI 和 Google 在 7/22 前后还在与 Anthropic 一起游说华盛顿限制中国开放权重模型，7/25 却补签了反限制公开信**。这说明前沿实验室的立场是**可交易的**，Anthropic 的孤立不必然源于信念更坚定，也可能只是它的商业结构（企业 API + Claude Code，几乎没有消费级广告或云平台对冲）让它最扛不住模型层商品化。

### 对我们（做多 agent 系统的团队）— 五条可执行判断

1. **把"模型血统"升级为一等公民字段，而不是备注。**
   我们在 7/26 晚报里把 Kimi K3 定位为"跨供应商热切换保险"。这个结论现在需要加一道闸：模型路由表必须显式带 `origin`（权重血统国别）与 `hosting_jurisdiction`（托管方司法辖区）两个字段。若联邦采购/使用禁令落地，中国血统权重出现在**交付路径**上就是合规负债，而不只是技术选择。执行动作：中国血统模型仅允许出现在内部实验与离线评测路径，且每一档都必须有已跑通的美系等价降级档位。

2. **"供应商 96 小时内被政府关停"不是假设，是 6 月已经发生过的事故。**
   Fable 5 / Mythos 5 的 19 天全球停服是当前唯一有实证的**主权风险 SLA 数据点**。任何把单一闭源模型写死进关键路径的 agent 系统，容量规划都必须按这个数字做。执行动作：多供应商抽象层 + 每个关键 agent 至少两档可用模型 + 一套能在切换后立即跑的输出质量回归基线（没有回归基线的热切换等于盲切）。

3. **现在就开始攒"可提交的模型卡"，成本几乎为零，事后补不上。**
   如果"强制安全测试"进入立法，门槛未定义意味着**解释权在执法方**。我们若对外提供微调端点或分发权重，可能被卷入义务范围。执行动作：从本周起，对所有自训/微调产物记录训练数据来源、基座模型与许可、评测结果与日期，形成可审计轨迹。这在无监管情况下也是正资产（客户尽调直接复用）。

4. **立刻审计合成数据流水线——蒸馏条款直接命中 agent 工程的日常动作。**
   "用前沿模型批量生成数据训小模型"是多数团队的标准操作，而 Dario 明说 Anthropic 会"识别并封禁用于蒸馏的账号"。执行动作：把"用 A 家模型输出训练/微调 B 家模型"从默认操作降级为**需审批操作**；核对各家 ToS 的蒸馏条款；对确需的场景，改用明确允许再分发输出的供应商或开放权重基座。这条的风险不是罚款，是**生产账号被封**——那等于服务中断。

5. **监管风险的评审频率要从季度提到周。**
   黄仁勋一条帖子 → 24 小时内签署方翻倍 → 72 小时内竞争对手 CEO 被迫公开表态。政策形成的时间尺度已经压缩到**小时级**。执行动作：把"模型供给侧政策"纳入周会固定议题，而不是年度合规审查。

## 六、接下来盯什么（信号）

- **Amazon 是否补签**——若 Amazon 单独签字，Anthropic 将成为唯一的孤立方，其谈判筹码显著削弱。
- **行政令或联邦采购禁令的实际文本**是否出现"开放权重"的法律定义与能力门槛数值。门槛一旦落数，整个开源生态的成本结构当天重写。
- **"mandatory safety testing" 是否被写进立法草案，以及由谁发证**（NIST / CAISI / 第三方？）。发证方身份 = 真实权力归属。
- **Anthropic 是否会用行动回应"你自己开放过什么"的质问**——除 MCP 这类协议层开源外，是否出现模型级开放。若继续零动作，"安全说辞掩护商业模式"的指控会持续复利。
- **Kimi K3 / DeepSeek 的美国托管方（Fireworks / Together / Baseten 等）是否被波及**——这直接决定我们第 1 条里"跨供应商热切换保险"还成不成立。

---

## 📚 延伸阅读

- Anthropic 官方原文：https://www.anthropic.com/news/position-open-weights-models
- Anthropic 6 月停服声明（Fable 5 / Mythos 5）：https://www.anthropic.com/news/fable-mythos-access
- CNBC：Dario 否认主张封禁开放权重（7/27）：https://www.cnbc.com/2026/07/27/anthropic-ceo-dario-amodei-isnt-advocating-open-weight-model-ban.html
- Axios：Nvidia 把 OpenAI 与 Anthropic 拖进开放模型之争（7/27）：https://www.axios.com/2026/07/27/nvidia-anthropic-openai-open-weight-debate
- CNBC：Nvidia / Microsoft / Meta 警告"过早限制"（7/24）：https://www.cnbc.com/2026/07/24/nvidia-microsoft-meta-open-weight-ai-models.html
- Forbes：签署方一天翻倍至 50，Amazon 与 Anthropic 缺席（7/25）：https://www.forbes.com/sites/sandycarter/2026/07/25/huangs-open-weights-letter-doubled-to-50-without-amazon-and-anthropic/
- TNW：Anthropic 的沉默与它自己的 Fable 5 停服：https://thenextweb.com/news/anthropic-open-weights-letter-holdout-fable-5-shutdown
- Tom's Hardware：25 家联署 + 华盛顿权衡中国模型禁令：https://www.tomshardware.com/tech-industry/artificial-intelligence/nvidia-and-24-other-companies-sign-open-weights-letter-as-washington-weighs-chinese-ai-model-ban
- Hacker News 讨论（400 分 / 536 评论）：https://news.ycombinator.com/item?id=49076057
