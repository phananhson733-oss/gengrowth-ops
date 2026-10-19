---
title: 深度研究 · Google 为 Anthropic 组装了一台 2000 亿美元的华尔街融资机器
date: 2026-08-05
type: ai-deepdive
topic: AI 基建融资 / Google-Anthropic-Broadcom 三角 / 表外杠杆
source: https://www.ft.com/content/inside-googles-200bn-wall-street-finance-machine-for-anthropic
tags:
  - ai-news
  - research-report
  - google
  - anthropic
  - broadcom
  - ai-infrastructure
  - compute-economics
push_channel: feishu/research-reports
---

# 💰 深度研究 ｜ Google 为 Anthropic 组装了一台 2000 亿美元的华尔街融资机器

> **一句话定性**：这不是又一笔算力大单，而是 FT 第一次把散落 15 个月的合同拼成完整图：**Google 用「自己担保 + 别人出钱 + 第三方兜底残值」的三层结构，把一家还没盈利的模型公司的算力账单，做成了华尔街可以打包卖的债券**——AI 竞争的胜负手，正从模型权重转移到资产负债表的表外部分。

**来源**：Financial Times 独家《Inside Google's $200bn Wall Street finance machine for Anthropic》，2026-08-04 发布。
🔗 原文：https://www.ft.com/content/inside-googles-200bn-wall-street-finance-machine-for-anthropic
🔗 交叉核实：the-decoder（Matthias Bastian，8/4）｜Seoul Economic Daily 英文版（8/4）｜BigGo Finance（8/4）｜TradingKey 债务分层拆解｜TechTimes 引 Jefferies（8/4）

> ⚠️ 取证说明：FT 原文在付费墙后、直接抓取失败。以下事实均以 FT 公开段落（含 FT 官方 X 帖与 Barron's 记者 Tae Kim 的逐句引述）为锚，再用 4 个独立二手源交叉；凡只有单一来源支撑的数字，文中已明确标注。

---

## 一、为什么这一篇值得单独深读

过去一年，AI 算力新闻的默认叙事是「谁买了多少 GW」。这篇的不同在于：**它回答的是「钱从哪来、风险落在谁头上」**。

FT 的原话是这批安排「此前从未被完整报道过」（have not previously been reported in full）。也就是说，Google 与 Anthropic 之间那些分批公布、看起来彼此独立的公告——2025 年 10 月的「至多 100 万颗 TPU」、2026 年 4 月的「多个 GW 下一代产能」、6 月那笔「350 亿美元私募信贷」——**其实是同一台机器的不同零件**。拼起来之后，它的性质变了：不再是采购，而是**一次把单一客户的未来现金流证券化的金融工程**。

这件事同时踩中三条战略主线：①Google 用金融手段而非只用芯片性能，把 TPU 打成了 Nvidia 的对手；②Anthropic 在没有大厂母公司资产负债表的情况下，拿到了本来只有 hyperscaler 才配得上的算力规模；③整个前沿模型行业的算力扩张，正在以**表外**方式转嫁给私募信贷、养老金和保险资金。

## 二、核心事实（按可信度分层）

### A. 总盘子（FT 一手口径）

- 合同网络总额 **约 2000 亿美元**，其中 **超过 1500 亿美元** 是要交付给 Anthropic 的 AI 芯片本身——**约四分之五绑在芯片上**。
- FT 定性：**「史上规模最大的基础设施融资安排之一」**。
- 参与方横跨芯片到工地：**Broadcom、Apollo、Blackstone、Morgan Stanley + 一组加密货币矿工**。
- 分工：**Google 担保数据中心**；**Broadcom 承诺买芯片并帮着融资**；**Apollo 与 Blackstone 出私募信贷的大头，买下硬件后租给 Anthropic**。

### B. 机器的核心零件：Compute SPV（多源交叉）

一个名为 **Compute** 的特殊目的实体（SPV）负责持有硬件——Anthropic **租、不买**。

- 首笔交易：6 月以 **约 350 亿美元** 购入 **约 1GW / 约 100 万颗 TPU**（the-decoder、Seoul Economic Daily、BigGo 一致）。
- 债务分三档（TradingKey 拆解，交易 6 月 8 日宣布完成）：

| 档位 | 规模 | 定价 | 增信 |
|---|---|---|---|
| Senior A1 | 60 亿美元 | 美债 + 100bps | 银行配售，Broadcom 背书 |
| A2 | 240 亿美元 | 5.75%（平价发行） | Broadcom 信用背书 + 担保 |
| Class B | 45 亿美元 | **8.5%** | **无 Broadcom 背书** |

- 股本层：Apollo 旗下 **Atlas SP Partners 出资 8 亿美元** 作为 SPV 所有者。
- **关键机制——残值担保**：Broadcom 对 A1/A2 提供 **100% 残值担保**（合计约 300 亿美元规模）。若 Anthropic 停付租金、且 SPV 变卖芯片不足以还本，**Broadcom 补差额**。效果是把这两档从「垃圾级」抬到**贴近 Broadcom 自身投资级**的定价，**而且不进 Broadcom 的资产负债表**。

### C. Google 那一侧的担保（BigGo / the-decoder）

- Q2 2026 财报口径：数据中心租约付款担保 **438 亿美元**，另有 **241 亿美元待生效**，表外承诺合计 **852 亿美元**。
- 而资产负债表上就此计提的，只有 **约 8.15 亿美元**——**理论最大敞口约 440 亿美元，账面确认约 0.8 亿量级**，差了近 54 倍。
- 电力与场地由矿工提供：**TeraWulf、Cipher、Hut 8**；其中 TeraWulf 纽约 360MW 设施配了 **32 亿美元建设债**；Google 背书的项目共 **10 个、合计 2.4GW**，并拿到 TeraWulf 的**认股权证**。

### D. 融资成本差 = 竞争壁垒（Jefferies，经 TechTimes 8/4）

- 有 Google 信用背书的数据中心项目，中位借贷利率 **7.1%**；无此背书的 Nvidia 生态同类项目 **9.3%**。
- **2.2 个百分点的利差**，来自 Jefferies 分析师 Jonathan Petersen。在 1500 亿美元级别的资本结构上，这不是财务细节，是**芯片选型的定价权**。

### E. 上下游承诺（Broadcom 财报 + 多源）

- Broadcom 采购承诺 **1280 亿美元至 2028 年**（FY2027 552 亿 + FY2028 729 亿），**几乎全部绑 Google TPU**。
- 4 月协议再覆盖 **3.5GW** TPU 硬件，**2027 年起**交付。
- Anthropic 对 Google Cloud 的五年承诺 **约 2000 亿美元**——the-decoder 口径称相当于 **Google 未来云收入的 40%+**。

### F. Anthropic 的偿付能力底盘（口径需注意）

- Run-rate 营收：**2026 年 4 月初超 300 亿美元**，**5 月底约 470 亿美元**（Anthropic 自述，Simon Willison 5/29 记录）；对照 2024 年 12 月约 10 亿。
- Alphabet 持股路径：2023/4 以 3 亿美元换约 10%；2023/10 再投 20 亿；**2026/4 承诺 400 亿、其中 100 亿立即到位**。Alphabet 私募股权投资账面价值已达 **1243 亿美元**，Bloomberg 分析称多数与 Anthropic 相关。（当前持股比例二手口径约 14%，**未经一手确认，谨慎引用**。）
- Anthropic 算力并非只押 Google：AWS 十年 **1000 亿美元+**（至多 5GW Trainium）、Azure **300 亿美元**、另有至多 **1GW** Nvidia 算力。

## 三、机制拆解：风险是怎么被「搬走」的

把这台机器拆成四次转移，就清楚了：

1. **从 Anthropic 搬到 SPV**：Anthropic 不买芯片、只签租约。资本开支变成经营性租金，Anthropic 的资产负债表不承压——这是它能在没有 hyperscaler 母体的情况下跑到 GW 级的唯一办法。
2. **从 SPV 搬到 Broadcom**：SPV 的最大风险是「芯片二手残值卖不动」。Broadcom 的残值担保把这块风险接走，代价是它拿到了 1280 亿美元的确定性订单。**订单换风险，是这笔交易的真实对价。**
3. **从 Broadcom 表内搬到表外**：残值担保是**或有负债**，不占资产负债表。所以 Broadcom 既拿了订单、又把 A1/A2 抬成准投资级、评级还没被动。S&P 明确说 Broadcom 的 **A- 评级不受影响**。
4. **从 Google 表内搬到表外**：Google 担保数据中心租约（438 亿），同样是或有负债，只在表上确认 8.15 亿。**Google 用信用而不是现金，买到了 TPU 生态的 2.2 个点利差。**

四次转移之后，钱最终来自谁？**Apollo、Blackstone 背后的私募信贷池——也就是养老金、保险与另类资产 LP。** 而偿付的唯一真实来源，是 **Anthropic 未来收的那笔 API 与订阅费**。中间所有增信，都只是在重排「谁先亏」的顺序，没有一环真正创造出现金流。

## 四、关键原话

> Google 已组装起「史上规模最大的基础设施融资计划之一」，为 Anthropic 供应超过 1500 亿美元的 AI 芯片……这些安排绑定的合同价值约 2000 亿美元，**此前从未被完整报道过**。
> ——Financial Times, 2026-08-04

> 「我们的战略愿景是把 Broadcom 领先的技术与最强投资伙伴的资产负债表结合起来，以最低的成本和功耗，为前沿 AI 实验室提供足够的算力。」
> ——Broadcom CEO Hock Tan（TradingKey 引述）

> 「AI 芯片是人类生产过的最有价值的商品之一。」
> ——一位参与交易的资深银行家（BigGo 引述）

> 「整个结构可能在增长放缓或停滞时解体。」
> ——the-decoder 对该结构的定性；文中指出 Anthropic 与 OpenAI 均预期到 2029 年营收增长 20–30 倍

## 五、正反两面

### 支持方的主张

- **这是对真实短缺的合理定价**。TPU 产能是稀缺物，残值担保之所以能把 A2 压到 5.75%，前提是市场相信 2029 年前这批芯片仍卖得掉。银行家那句「最有价值的商品之一」就是这个判断的浓缩。
- **风险分散而非放大**。Broadcom 担残值、Google 担租约、Apollo 出股本、矿工出电和地——每一方承担自己最有能力定价的那一段风险，这正是结构化金融该干的事。
- **它解决了一个真问题**：Anthropic 没有 Amazon/Microsoft 那样的母体，如果只能靠股权融资买算力，稀释速度会先杀死公司。租赁 + SPV 是它与 hyperscaler 掰手腕的唯一路径。
- **Google 的账算得过来**：用或有担保换来 TPU 阵营 2.2 个点的融资优势，同时锁定 Anthropic 五年 2000 亿云收入、还持有其大额股权——一笔支出打三个目标。

### 质疑方的主张

- **循环融资**。Google 同时是**芯片供应商、租约担保人、Anthropic 股东、云收入受益方**。它给自己的客户增信，让客户来买自己的产品，再把收入记成自己的云收入。需求一旦转弱，四个身份的敞口会同时爆——这是 BigGo 明确点名的「circular financing」风险。
- **评级机构已经开始出手**。S&P 把 Compute SPV 里那 **45 亿美元、无 Broadcom 担保的 B 档** 标为 **"credit negative"**。这是结构里最薄的一层，也是压力最先显形的地方。
- **宏观层面已被列为系统性风险**。BIS 在 **2026 年 3 月季报**中用 **"shadow borrowing"（影子借贷）** 命名了这类结构；Nikkei Asia 统计五家 AI 巨头的**表外债务 1.65 万亿美元，已超过表内的 1.35 万亿**；Moody's 估算六大科技公司 2027 年资本开支将达 1 万亿美元，其中 **8200 亿美元+ 的表外项目尚未破土**，并另估 hyperscaler 手握约 **6620 亿美元** 已签未起租的数据中心租约承诺。IMF 与 BIS 都已公开预警。
- **残值假设可能是整台机器最脆弱的螺丝**。Nvidia H100 的租赁价格自 2023 年以来已跌 **70–90%**。残值担保定价建立在「AI 加速器保值」之上，而上一代加速器的实证恰恰相反。若 TPU 二手价按同样斜率走，Broadcom 那 300 亿担保就不是名义数字。
- **期限错配**。债券长久期、芯片短折旧、租约又短于它所融资的园区寿命——三段期限对不齐，中间任何一段的再融资窗口关闭，SPV 都要重新找钱。
- **类比警告**：多位分析人士指出这些 SPV 在结构上「至少表面上」像 2008 年前为次贷融资的 CDO：损失最终流向持有债券的养老金与保险公司。此为结构类比，非等价判断——**关键差别在于，底层现金流是一家营收 15 个月涨了 47 倍的公司，而不是还不起月供的借款人**。这个差别是这台机器成立与否的全部。

## 六、深度解读：这对行业、以及对「做多 agent 系统的我们」意味着什么

### 对行业格局

1. **Nvidia 的护城河第一次在「融资成本」这条战线上被撬动**。2.2 个百分点的利差，等价于同等算力下数据中心项目 IRR 的显著差异。Google 没能靠单卡性能赢，但可能靠 Alphabet 的信用评级赢——这是 Nvidia 靠 CUDA 生态防不住的攻击面。FT 报道当天芯片股全线上扬，市场读懂了这一点。
2. **前沿实验室的竞争条件被重写**。从今往后，「你能拿到多便宜的资本」和「你的模型有多聪明」是同等重要的变量。没有 hyperscaler 背书、也没有 Broadcom 级别担保人的第二梯队实验室，扩产成本会系统性地更高。**开源权重阵营的融资难题（WSJ 8/2 已报道 VC 开始质疑其收入前景）与这条是同一枚硬币的两面。**
3. **加密矿工完成了身份转换**。TeraWulf、Cipher、Hut 8 从「挖币的」变成 AI 电力与场地的承包商，且拿的是 Google 担保的建设债。这条产业迁移路径基本走完了。
4. **Anthropic IPO 的意义变了**。它不再只是一次融资，而是**这台机器第一次接受审计与强制披露**。招股书里的租约表，会是市场第一次看到全貌的官方版本。

### 对我们（做多 agent 系统的团队）——落到可执行的判断

1. **把「推理单价持续下行」写进未来 4–6 个季度的预算假设，但要知道它是被债务推着走的**。这批算力的还款计划要求产能被填满，因此 Anthropic/Google 有**结构性动机**持续降价换用量（对照 7/24 Opus 5 以约一半价格逼近前沿、7/30 OpenAI 把 Luna 输入价砍 80% 到 $0.20/Mtok）。**行动**：此前因单价太贵而砍掉的深度推理路径（多轮自检、更大 candidate 数、更长上下文回放）应重新做一次 ROI 评估——很可能现在已经算得过来了。
2. **供应商信用风险，从今天起属于技术选型的一部分**。以前选模型看能力/延迟/价格；现在还要看**它背后的资本结构还能撑几年**。这不是危言耸听：S&P 已经对这个结构里的一层出具了 credit negative。**行动**：在技术选型文档里加一栏「供应商算力承诺与融资结构」，至少记录：主力算力来源、是否表外、有无第三方担保、最近一次评级动作。
3. **多模型抽象层的价值，从「工程整洁」升级为「对冲金融结构风险」**。Anthropic 的算力同时押在 Google TPU、AWS Trainium、Azure、Nvidia 四条线上——**连它自己都在对冲**。我们没有理由把整条产品线焊死在单一 provider 上。**行动**：确保 prompt/tool schema/评测集是 provider 无关的，且随时可跑一次跨模型回归；把「切换成本」量化成人天，定期复核。
4. **TPU 绑定会改变推理侧的性能画像，不要照搬 Nvidia 生态的经验值**。当 Anthropic 的主力推理栈越来越围绕 TPU 优化，batch 行为、长上下文的边际成本曲线、并发下的尾延迟，都可能与 GPU 生态不同。**行动**：性能假设（尤其是"长上下文便宜/贵"这类）必须在目标 provider 上实测，不能从社区的 GPU 基准外推。
5. **今天 Claude 的全球性宕机，正好是这条线的另一面**：算力越集中、结构越紧耦合，单点故障的影响半径越大。**行动**：生产链路必须有降级路径（切备用模型 / 排队重试 / 明确的功能降级 UX），并把这条写进对客户的 SLA 措辞里，而不是默认「上游总是在」。
6. **如果我们自己租 GPU 跑 agent 推理：租，不要买**。H100 租金 70–90% 的跌幅就是残值风险的实证。让残值风险留在专业机构那里，我们只买使用权。
7. **采购合同要加服务连续性条款**。既然上游是靠长期 take-or-pay 租约支撑的，短期涨价风险低；但**如果需求不及预期，最先被牺牲的是长尾低毛利客群**——免费额度、低价 tier、宽松的 rate limit。**行动**：不要把产品的核心经济模型建立在某个 provider 当前的免费/低价档位上。

## 七、接下来盯什么（信号清单）

- **Anthropic 的 S-1/招股书**：租约承诺表、或有负债、与 Google/Amazon 的合同条款——这是把 FT 的拼图变成审计过数字的唯一场合，**优先级最高**。
- **Alphabet 下一份 10-Q**：「数据中心租约担保」从 438 亿往哪走，241 亿待生效的部分是否落地，表内计提的 8.15 亿是否被迫上调。**计提口径一变，就是会计师不认这个"或有"了。**
- **Broadcom 下季财报**：1280 亿采购承诺是否上修，残值担保的披露口径是否变化，A- 评级是否被展望调整。
- **S&P / Moody's 对 Compute SPV 的后续动作**：尤其那 45 亿 B 档。它是这台机器的煤矿金丝雀。
- **第一笔真实的二手 TPU/加速器成交价**：残值担保的全部定价假设都押在这个数上，目前市场还没有公开可观察的基准。
- **是否出现「第二台机器」**：这个结构若被复制到 OpenAI 或 Meta 身上，说明它已成为行业标准做法，系统性风险的量级要重新估。
- **监管是否从警告升级为规则**：BIS/IMF 的措辞是否变成具体披露要求；FASB/SEC 是否对表外算力租约出手。
- **矿工侧的施工进度与融资成本**：TeraWulf 360MW 是否按期、2.4GW 那 10 个项目有无延期——这是整条链最先能看到裂缝的地方。

## 📚 延伸阅读

- FT 原文（付费墙）：https://www.ft.com/content/inside-googles-200bn-wall-street-finance-machine-for-anthropic
- the-decoder《Google moves billions in Anthropic chip risk off its balance sheet》：https://the-decoder.com/google-moves-billions-in-anthropic-chip-risk-off-its-balance-sheet/
- Seoul Economic Daily（英）：https://en.sedaily.com/international/2026/08/04/google-builds-200-billion-ai-chip-financing-network
- BigGo Finance 结构与各方反应：https://finance.biggo.com/news/cc3ceaa8-e838-4501-b4c0-13b9fcba9232
- TradingKey 债务分层拆解：https://www.tradingkey.com/analysis/stocks/us-stocks/261954424-apo-bx-avgo-tpu-anthropic-tradingkey
- TechTimes 引 Jefferies 利差数据：https://www.techtimes.com/articles/322900/20260804/google-built-credit-guarantee-infrastructure-giving-its-tpu-chips-2-point-rate-edge-over-nvidia.htm
- 批评视角《The Great AI Cycle Of Crap》（8/4）：https://exploringchatgpt.substack.com/p/the-great-ai-cycle-of-crap
- 表外债务与系统性风险综述：https://www.explainx.ai/blog/ai-companies-off-balance-sheet-debt-enron-comparison-july-2026
