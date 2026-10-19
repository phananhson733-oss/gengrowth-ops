---
title: Anthropic 把机房挂进别人的账本：Theseus 与一句没人核算的电价承诺
date: 2026-08-11
type: ai-deepdive
topic: AI 算力资本结构 / 表外数据中心 / 主权基金当房东 / 电价外部性定价
source: businesswire.com（Anthropic-Macquarie-GIC 官方联合稿，2026-08-10）
tags: [ai-news, research-report]
---

# Anthropic 把机房挂进别人的账本

**一句话定性**：8 月 10 日 Anthropic 联手 Macquarie 资产管理与新加坡主权基金 GIC 成立数据中心平台 **Theseus Infrastructure**——由对方出大部分股权并持有资产、Anthropic 只当长期租约的锚定租户——这是前沿实验室第一次把"自建机房"做成一个**完全不上自己资产负债表的房东-租客结构**；而全篇通稿没有一个金额、一个吉瓦、一个站点、一个时间表，只有一句"Anthropic 将承担这些站点可能带给消费者的电价上涨"。

- **来源**：Anthropic / Macquarie Asset Management / GIC 联合新闻稿（Business Wire 发布），Macquarie 官网同步刊载
- 🔗 **原始链接**：https://www.macquarie.com/au/en/about/news/2026/anthropic-mam-gic-data-centre-infrastructure-partnership.html
- **日期**：2026-08-10

---

## 一、为什么值得深读 / 背景

过去四个月，本监测反复推的是"谁给 Anthropic 掏钱买芯片"这条线：

| 日期 | 事件 | 结构 |
|---|---|---|
| 2025-10 | Google Cloud：最高 **100 万颗 TPU**、2026 年上线 **1GW+** 产能 | 云采购 |
| 2026-04 | AWS：十年内投入 **超 $1000 亿**，锁定最高 **5GW** Trainium/Graviton（Project Rainier，2025-10 已全面运行，目前用 **100 万颗以上 Trainium2** 训练与服务 Claude） | 云采购 |
| 2026-06 | Apollo + Blackstone 关闭 **$350 亿** 私募信贷包：SPV 买下 Google 的 TPU 再回租给 Anthropic，**Google 对五个设施的产能提供付款担保** | 表外 SPV + 售后回租 |
| 2026-08-05（本频道已推） | FT 起底 Google 为 Anthropic 组装的 ~$2000 亿华尔街融资机器 | 债务工程 |
| **2026-08-10** | **Theseus：Macquarie + GIC 出股权、持有平台，Anthropic 只签长租** | **表外不动产** |

前四行都还是"买/租芯片"。**Theseus 是第一次把楼、地、电、变电站这一层也一并挪出去**——Anthropic 从"云的客户"变成"自己定制机房的锚定租户"，但一分钱资本开支不进自己的账。

这条之所以比一次模型发布更值得深读：**模型发布决定这个季度谁领先，算力资本结构决定未来三到五年谁还在场上**。而 Anthropic 至今未上市，它选什么结构，会成为它 IPO 招股书上那张负债表的形状。

---

## 二、核心事实

### 交易结构（官方稿口径）

- **平台名**：Theseus Infrastructure，目标是"**开发、运营并以长期协议向 Anthropic 出租**大规模数据中心基础设施"
- **所有权**：Macquarie 资产管理旗下基金 **与 GIC 共同拥有该平台**，并**为每个项目出资大部分股权**
- **Anthropic 的角色**：**锚定租户（anchor tenant）**，与三方共同选址开发，每个设施为其容量需求定制
- **地域**：初期聚焦**美国**
- **两位出资方的体量**：Macquarie 资产管理 AUM **$4976 亿**；GIC 成立于 1981 年，投资遍及 **40 多个国家**，员工 **2500+**

### 通稿里没有的东西（这同样是事实）

- **没有资本承诺金额**
- **没有装机容量（MW/GW）**
- **没有站点**
- **没有时间表**
- **没有任何一句高管引语**——三方联合稿通篇只有对各自公司的介绍性描述

Bloomberg 8 月 10 日的报道明确写：三家公司"未透露计划支出或项目规模的任何细节"。

### 唯一的实质承诺

官方原文：

> "Anthropic will cover electricity price increases that consumers otherwise may face from these sites, in line with commitments it announced earlier this year."
> （Anthropic 将承担这些站点可能带给消费者的电价上涨，与其今年早些时候宣布的承诺一致。）

以及一句社区话术：这些开发将"在站点所在社区创造**数千个建设岗位与永久运营岗位**"。

### 这句承诺的背景数据

- 白宫 **Ratepayer Protection Pledge**（2026-03-04）由 **7 家**签署：AWS、Google、Meta、Microsoft、OpenAI、Oracle、xAI——**Anthropic 不在其中**。白宫称该承诺覆盖美国 **80%** 的送电量、保护 **2.63 亿** 美国人
- Bloomberg 去年秋的分析：数据中心密集地区，五年内电价涨幅最高达 **267%**；同期全美平均涨幅约 **38%**
- 该白宫承诺被批评为不可执行：无监督机制，且真正决定基础设施成本如何摊进电费的**关税（tariff）规则由各州公用事业委员会与 FERC 制定**，不由企业或行政部门决定

---

## 三、机制拆解：这个结构到底把风险搬去了哪

把 Theseus 拆成三个动作看，就清楚了：

**① 资产不进表，成本变成租金。**
传统自建机房是资本开支（capex）——巨额现金出去，资产进表，折旧摊销。Theseus 的做法是：**Macquarie 和 GIC 出钱、持有资产、承担建设与融资风险，Anthropic 每月付租金**。对一家 IPO 前的公司，这直接改变了两件事：账面上没有一笔百亿级的资本开支，以及**建设期超支、延期、并网失败的风险不由它承担**。

代价是：租金是**固定的、长期的、不可停的**。资本开支可以中途叫停一个项目，长期租约不行。这也是 TheNextWeb 点破的行业模式——**Meta 已把 $2790 亿 的数据中心租约移出资产负债表，Google 为自己永远不会拥有的建筑担保了 $440 亿 租金**。Anthropic 只是最后一个学会这套的。

**② 主权资本从买股票变成当房东。**
GIC 此前投 AI，是买 OpenAI、Anthropic 这类公司的股权——赌哪个模型赢。Theseus 里它变成了**持有实体资产、收长期租金的一方**：不赌谁的模型更好，只赌"这栋楼里未来一定有人训模型"。这是把 AI 敞口从**权益风险**改造成**基础设施收益**。对主权基金来说这是降级风险；对行业来说这意味着**新增了一类不在乎哪家赢的长钱**，机房的资本供给会比模型公司的股权供给更充沛、更便宜。

**③ 把电价外部性写进合同。**
这是全篇最值得注意的一句。数据中心引发的地方电价上涨，过去一直是**外部性**——由居民账单承担，由州 PUC 事后处理。Anthropic 现在主动说"我来兜"。

问题在于**兜多少、谁来算**。TheNextWeb 提出的三点质疑很硬：

- **没有第三方核算这笔账，没有监管机构签字**；
- 涉及**租用已有产能**（而非新建）时，Anthropic 的措辞明显更弱——只是"正在探索进一步的方式来处理我们自身负载对电价的影响"；
- Anthropic **没有签**白宫那份 7 家企业的自愿承诺，却在自家 JV 里单独给了一个更具体的表述。这可以读作"比签个空头承诺更真诚"，也可以读作"绕开有名单、有对照的场合，选一个自己能定义口径的场合"。

---

## 四、正反观点

**支持方的主张：**

- 产能是当下唯一的硬约束。AWS 的 5GW、Google 的 1GW+ 都是既定合同产能，而 Anthropic 已经在合同外继续找楼——这本身说明**现有协议已经不够用了**，从"租算力"进化到"参与建设"是必然。
- 让专业的人做专业的事。Macquarie 是全球数一数二的数字基础设施开发与融资方，GIC 有 40+ 国家的基建投资经验。让 AI 实验室自己去搞征地、并网、变电站，是把稀缺的组织带宽浪费在它最不擅长的事上。
- 主动为电价外部性定价，是**审批加速器**。数据中心的地方性反弹已经是两党共识级议题，谁先拿出可谈的补偿方案，谁的站点先获批。这是竞争优势，不是慈善。

**质疑方与风险：**

- **一份没有数字的通稿。** 没有金额、没有吉瓦、没有站点、没有时间表、连一句高管引语都没有——这在三方级别的联合发布里非常反常。可以合理推断：**具体项目尚未落定，此刻发稿是为了先立牌子**（占位、给后续选址谈判和融资背书）。那么它现在的信息价值主要是"意图"，不是"事实"。
- **电价承诺不可核验。** 没有第三方审计、没有监管背书、口径由承诺方自定，租用既有产能时措辞还更软。这类承诺的历史成绩不好：白宫那份 7 家签的版本已被指出"没有任何验证合规的机制"。
- **Macquarie 的动机值得看清。** 它在 **7 月 20 日以约 $400 亿 卖掉 Aligned Data Centers**，三周后就推出 Theseus。这是老练的资产周期操作——**高位卖掉成熟资产，转身用别人的锚定租约再建一批新的**。这不代表交易不好，但它提醒你：这个结构的设计者是卖方，不是买方。
- **固定租金是双刃剑。** 表外的代价是刚性。一旦推理需求增速低于预期，或下一代芯片让今天的机房设计过时，Anthropic 要付的租金一分不少。它把建设风险转出去了，把**需求风险留给了自己**。
- **循环融资的成色。** 把 Theseus 和 6 月那笔 $350 亿 SPV（Google 担保）、8 月 5 日 FT 起底的 ~$2000 亿 融资机器叠起来看，Anthropic 的算力扩张越来越依赖**由供应商或金融方担保、结构化的表外债务**。单笔都合理，叠在一起就是一个对需求增长高度敏感的资本堆栈。

---

## 五、深度解读：对行业与对"做多 agent 系统的我们"

### 对行业

**1. AI 基础设施的资本供给方，正在从"科技资产负债表"换成"基建资本"。**
Meta 的 $2790 亿、Google 的 $440 亿、Anthropic 的 Theseus——三条独立证据指向同一件事：**机房正在被重新分类为收租型基础设施资产**，由基建基金和主权基金持有。这意味着算力的资本约束会比"哪家科技公司现金流够"松得多。**不要再用"某实验室烧钱速度"来推断它的产能上限**——上限现在由愿意当房东的长钱决定，而那类钱很多。

**2. 前沿实验室之间的差异，正在从模型转到资本结构。**
OpenAI 走的是"自建 + 合资 + 供应商股权互换"，Anthropic 走的是"云采购 + SPV 回租 + 表外不动产"。两条路径对需求波动的耐受度完全不同。**下次评估"这家实验室三年后还在不在"，看的应该是租约久期和担保方，而不是基准分数。**

**3. 电价条款正在变成 AI 供应链的新合同项。**
Anthropic 这句承诺无论多软，都是一个先例：**社区电价第一次出现在一份 AI 基础设施交易的正式文本里**。接下来它会往两个方向走——要么被州 PUC 接过去做成真实的关税条款（有牙），要么停留在通稿里（没牙）。这是判断"AI 数据中心政治反弹会不会实质抬高算力成本"的关键分叉。

### 对做多 agent 系统的我们

**1. 长租约 = 供给可预期，可以放心把长期赌注押在 Claude 栈上。**
锚定租户签的是长期协议，意味着未来数年 Claude 的推理产能是**已被锁定的、有实物支撑的**，不是季度采购决定的。对我们这种要押三年技术栈的团队，这条降低了"某天突然限流/涨价/退出"的尾部风险。这也解释了为什么 8 月 7 日 Claude Code 敢把 auto mode 设成默认、8 月 10 日敢让一次数学研究烧掉 3100 万输出 token——**产能是先谈好的，产品才敢这么设计**。

**2. 但请把这件事读成"厂商有强动机让你多烧 token"。**
表外结构的代价是刚性租金。**固定成本一旦锁死，卖不掉的产能就是净亏损**，厂商必然更激进地推长时程、高自主度、高 token 消耗的 agent 形态。落到我们身上的具体含义：单位 token 价格的下行**不等于**单位任务成本的下行，因为默认配置会同时把每个任务的 token 消耗推高。**在成本口径上，从今天起只认"每完成一个任务的端到端成本"，不要再看 per-token 报价做预算。**（这与 8/1 那篇"降价 80%"、8/10 auto mode 默认化是同一条轴。）

**3. 容量有地理形状，这会变成真实的工程约束。**
Theseus "初期聚焦美国"、定制机房、锚定租户——这套结构天然是**区域绑定**的。对有数据驻留要求的客户（尤其欧盟），意味着未来一段时间最好的产能不在你能用的区域里。**如果我们的 agent 系统要接受合规敏感客户，现在就该把"模型区域可用性"列成架构约束，而不是等签合同时才发现。**

**4. 对自建/自托管的判断可以更明确了。**
连 Anthropic 都选择不把机房放进自己的账本——这是一条很强的信号：**在这个阶段自持算力资产的性价比是负的**。我们这种规模的团队更不必纠结自托管开源模型省不省钱，把工程投入放在编排、评测、成本可观测性上，收益率高得多。（Meta 8/10 开源的 Muse Glimmer 那类 30B 本地模型，价值在隐私与延迟，不在省钱。）

**5. 供应商风险清单加两行。**
既然模型厂商的资本结构已经变成表外债务堆栈，我们的供应商评估表里应该加：**`lease_duration`（关键供应商的产能租约久期）** 与 **`guarantor`（谁在为它的算力担保）**。这两项比"最新基准分"更能预测三年后的可用性与价格。

---

## 六、接下来盯什么（信号）

1. **第一个 Theseus 站点、装机容量与资本承诺何时披露**。若三个月内仍无数字，说明 8/10 这份稿子的性质就是"先立牌子"，含金量要下调。
2. **Anthropic 是否补签白宫 Ratepayer Protection Pledge**。签，说明它想进有对照的名单；不签，说明它要保留自定口径的空间。
3. **"承担消费者电价上涨"如何落成实际关税条款**——盯首个站点所在州的 PUC 备案。只要有一份带核算方法与第三方审计的备案出现，这句承诺就从公关变成了成本；否则它就是零成本承诺。
4. **Anthropic IPO 材料里的租赁负债规模**。这是唯一能把 Theseus + $350 亿 SPV + ~$2000 亿 融资机器合并看清的地方。
5. **OpenAI / Google / Meta 是否跟进同构 JV**（基建基金 + 主权基金 + 锚定租约）。若跟进，"表外机房"就正式成为行业标准结构，算力资本约束整体解除。
6. **Macquarie 是否在两年内把 Theseus 的资产打包卖出**。它 7 月刚以 $400 亿 卖掉 Aligned——若历史重演，Anthropic 的房东会在租约期内换人，而换人时的再融资条件才是真实风险所在。

---

## 📚 延伸阅读

- Macquarie 官网（一手联合稿，8/10）：https://www.macquarie.com/au/en/about/news/2026/anthropic-mam-gic-data-centre-infrastructure-partnership.html
- Business Wire / Yahoo Finance 转载（一手稿全文，8/10）：https://finance.yahoo.com/technology/ai/articles/anthropic-macquarie-asset-management-gic-120400841.html
- Bloomberg（8/10，"未透露支出与规模"）：https://www.bloomberg.com/news/articles/2026-08-10/anthropic-macquarie-and-gic-form-venture-for-ai-data-centers
- TheNextWeb（8/10，最有力的批评视角：表外化、电价不可核验、Macquarie 动机）：https://thenextweb.com/news/anthropic-macquarie-gic-theseus-infrastructure-data-centre-partnership
- Data Center Richness（8/10，把 Theseus 放回 Anthropic 全部算力承诺里）：https://datacenterrichness.substack.com/p/anthropic-taps-macquarie-gic-to-build
- HPCwire（8/10，行业口径转载）：https://www.hpcwire.com/off-the-wire/anthropic-macquarie-and-gic-launch-theseus-infrastructure-for-ai-data-centers/
- Anthropic 官方（2026-04，AWS $1000 亿 / 5GW）：https://www.anthropic.com/news/anthropic-amazon-compute
- DCD（Google Cloud 100 万 TPU / 1GW+）：https://www.datacenterdynamics.com/en/news/google-and-anthropic-confirm-massive-1gw-cloud-deal-with-up-to-one-million-google-tpus/
- Crypto Briefing（$350 亿 SPV 回租、Google 担保五个设施）：https://cryptobriefing.com/google-anthropic-35b-chip-deal/
- 白宫 Ratepayer Protection Pledge（2026-03-04 原文）：https://www.whitehouse.gov/releases/2026/03/ratepayer-protection-pledge/
- The Hill（数据中心反弹与 Ratepayer Protection Act 在众院推进）：https://thehill.com/policy/technology/5983931-house-advances-ratepayer-protection-act/
