---
title: Anthropic 给每个字盖章——Claude 全球默认文本水印，法律豁免的两块它自己加上了
date: 2026-08-12
type: ai-deepdive
topic: AI 内容溯源 / 水印 / 欧盟 AI 法案 Art 50
source: Anthropic Help Center《How Claude marks AI-generated content》
tags: [ai-news, research-report]
---

# Anthropic 给每个字盖章

**一句话定性：** Anthropic 把「不可感知文本水印 + C2PA 签名」设成 Claude 全线默认、全球生效、无 opt-out——而欧盟法律明确豁免的两块（源代码、校对润色）它主动加了上去，AI 输出从此默认自带可验证指纹。

**来源：** Anthropic Claude 帮助中心（一手）
**🔗 原始链接：** https://support.claude.com/en/articles/16266773-how-claude-marks-ai-generated-content
**日期：** 2026-08-11 集中报道（新模型生效日 2026-08-02）

---

## 为什么值得深读 / 背景

过去两年，"AI 水印"一直停在图像与音频：C2PA 元数据、SynthID 频谱嵌入、各家发个声明就算交差。原因很实在——**图像的冗余空间大，文本没有**。文本是离散 token 序列，你没有"看不见的像素"可用，唯一能藏信息的地方就是**模型在多个同样合理的词之间怎么选**。而这恰恰是模型质量本身所在。所以文本水印一直是"技术上能做、商业上没人愿意默认打开"的东西。

OpenAI 是这条路上最著名的犹豫者：它手里有一个自称 99.9% 准确率的文本检测器，但一直压着不发，理由是易被翻译绕过、且对学生群体（尤其非英语母语者）有歧视性影响（the-decoder 8/11 复述）。

8/11 这条把僵局打破了。触发器是欧盟：AI 法案 Art 50(2) 的透明度义务 **2026-08-02 全面适用**（本频道 8/2 已推执法开闸），Anthropic 签署了《Code of Practice on Transparency of AI-generated Content》。但真正值得读的不是"它合规了"，而是**它超出了合规范围有多远**——下面第三节。

对做 agent 系统和 AI 产品的团队，这条的分量在于：**从今天起，"Claude 输出"不再是一串普通字符串，而是一个带出处签名的对象**，并且这个属性会沿着复制粘贴、沿着 agent 之间的消息传递、沿着你的内容管线一路走下去。

---

## 核心事实

**标什么**
- **文本**：嵌入式、不可感知的水印，直接织进生成的文本本身。Anthropic 称其"随文本被复制粘贴到别处而一同迁移"，并"may persist through some editing"（可能扛住部分编辑）。
- **文件**：数字签名的溯源元数据，走 **C2PA**（Coalition for Content Provenance and Authenticity）开放标准，当前支持 `.svg` / `.png` / `.jpg`。

**从什么时候起**
- **2026-08-02 及之后发布的新模型**：出厂即带标记。
- **已有模型**：状态是 "in progress"，官方**未给时间表**。

**覆盖到哪**
官方列举：Claude Platform（API）、Claude、Claude Code、Claude Cowork、Claude Tag，以及 AWS、Google Cloud、Microsoft Foundry 三大云。原文口径是 **"Marking will apply to output from supported models wherever Claude is offered, worldwide."**

**用户能不能关**
帮助中心**没有提供任何 opt-out 机制**。个人版、企业版、API 一视同仁。

**检测工具在哪**
Anthropic 表示 "We're also working to enable users and other third parties to detect Claude's embedded watermarks"，技术文档 **forthcoming**。有 Anthropic 工程师在社媒确认，一个"你自己就能用"的文本检测 API 在路上。**即：水印先上线，检测能力后到。**

**法律背景与罚则**
- Art 50(2) 自 2026-08-02 适用；已上市系统有到 **2026-12-02** 的宽限期；互操作方案要求 **2027-02-02** 到位。
- 违规上限 **€1500 万或全球营收 3%**，取高者，域外适用。

---

## 机制拆解：水印是从模型嘴里省出来的

**文本水印不在模型层，在采样层。** 实现路径与 Google 的 SynthID-Text 同族：不改权重，改的是**从概率分布里挑哪个 token**。

SynthID-Text 的做法叫 **tournament sampling（锦标赛采样）**：从模型原始分布里抽 2^m 个候选 token，用一个由密钥驱动的伪随机分数给它们打分，经过 m 层两两淘汰，最后活下来的那个作为输出。检测端拿同一个密钥重算分数，看整段文本的候选得分是否系统性偏高——偏高就是有水印。

这个机制有三个直接推论，全都是工程后果：

**推论一：水印强度正比于熵。**
一个位置上如果只有一个 token 合理，锦标赛就没得选，这个位置贡献不了信号。所以**信号密度取决于"有多少同样合理的选择"**。这解释了官方那条限制——"短文本可能材料太少，无法可靠检测"。

**推论二：代码是最坏情况。**
代码里"能编译、能过类型检查、能保持语义"的 token 在很多位置只有一两个。这意味着两件事同时成立：一是**代码位置能藏的信号最少**（检测最不可靠），二是**只要在这些位置为了水印而偏移选择，就是在拿正确性换可检测性**。这不是理论担忧——开发者社区第一反应就是"给代码加签名会不会 degrade the output"。

**推论三：抹除成本极低，且日常操作就会误抹。**
学界共识是水印扛不住**改写**：词法替换 + 句法重写组合起来能把信号打没。d4b.dev 引研究口径称，语义保持的变换（例如**变量重命名**）足以让真阳性率**跌破 50%**。而 format、lint、refactor、compile 这些开发者每天都在做的事，本质上就是语义保持变换。

**结果是一个尴尬的双输区间**：想抹的人一次 paraphrase 就抹掉了；不想抹的人正常干活也把它抹掉了。水印真正能可靠抓住的，是**长篇、原样复制粘贴、且没人认真改过**的文本——也就是最典型的 AI slop。这既是它的价值所在，也是它的天花板。

**文件侧的 C2PA 是另一套逻辑**：不是统计信号，是附在文件上的**加密签名元数据**，能验真也能验篡改。代价是它太容易掉——格式转换、截图，一次就没了。

---

## 关键事实：法律豁免的两块，是 Anthropic 自己加的

这是整条新闻里最少被报道、但分析价值最高的一点。

欧盟委员会 **2026-07-20 发布的 Art 50 最终指南**及官方 FAQ，明确把下列内容**排除在机器可读标记义务之外**：

| 豁免类别 | 官方口径 |
|---|---|
| **源代码** | 明确列为豁免 |
| 极短序列 | "a short sequence of numbers, symbols or letters" |
| 机器对机器输出 | "intended to be exclusively communicated from machine-to-machine and processed automatically without any exposure to humans" |
| 闭环工业/产品开发环境 | 除非是最终产出 |
| **标准编辑的辅助功能** | 语法纠错、拼写检查、轻度文体润色，以及 AI 翻译 |
| B2B/工业场景 | 满足特定条件下的窄豁免 |

对照一下 Anthropic 的实际做法：

- **Claude Code 被明确列入覆盖范围。** 源代码在欧盟是豁免的——**给代码盖章是产品决策，不是法律义务**。
- **校对润色照标不误。** 你把自己一个字一个字写出来的稿子丢给 Claude 改错别字，输出带水印。这正是法律豁免的"assistive function for standard editing"。
- **agent 之间的中间产物照标不误。** M2M 输出在欧盟是豁免的。
- **全球统一、无 opt-out。** 法律只管欧盟；宽限期还能拖到 12/2；Anthropic 8/2 就上，且铺到全世界。

用 d4b.dev 的话说：**"Applying one policy to every product and region is operationally simpler... But extending the watermark to code is an Anthropic product decision, not an unavoidable legal requirement."**

一句话：Anthropic 用"欧盟要求"作为叙事外壳，实际做的是**把内容溯源当成公司立场推到全球下限之上**——这跟它 7/27 那篇开放权重立场文、8/7 把 auto mode 设默认，是同一种"用产品默认值表达价值观"的打法。

---

## 关键原话

> "Marking will apply to output from supported models wherever Claude is offered, worldwide."
> —— Anthropic 帮助中心

> "We're also working to enable users and other third parties to detect Claude's embedded watermarks."
> —— Anthropic 帮助中心（技术文档 forthcoming）

> "I had ditched Grammarly for Claude for proofreading because it does a better job. But now the stuff I've written will be watermarked that Claude did the work. This is ridiculous."
> —— Erick Erickson（电台主持人/博主），转引自 Forbes 8/11

---

## 正反观点

**支持方**

1. **溯源是 agent 时代绕不开的基础设施。** 当 20% 的 HN 头版内容是 AI 生成的（8 月口径）、当 agent 开始自动往互联网上写东西，"这段字从哪来"从哲学问题变成了工程问题。没有可验证的出处，模型训练数据会在几年内被自己的输出污染。
2. **C2PA 是开放标准而非私有格式。** 选 C2PA 意味着可被第三方验证、可与 Adobe/相机厂商/其他实验室的溯源链互通，不是把用户锁进 Anthropic 的检测服务。
3. **全球统一比地域割裂更诚实。** 只在欧盟加水印会立刻催生"用美国 endpoint 绕开"的灰产，那种合规是纸面合规。
4. **Anthropic 主动承认了不确定性。** 帮助中心自己写了"检测到标记并不完全结论性""未检出也可能是 AI 生成"——比那些声称 99% 准确率的第三方 AI 检测器诚实得多。

**质疑方**

1. **"处理过"不等于"AI 写的"，但没人会这么读。** 这是最致命的一条。水印证明的是 Claude 碰过这段文本，不是 Claude 写了这段文本。而一旦学校、期刊、招聘方、平台开始把检测结果当证据，语义会瞬间坍缩成"这是 AI 写的"。**用 Claude 校对自己论文的学生，和用 Claude 代写的学生，拿到同一个红色标记。**
2. **假阴性同样有害，且方向不对称。** 短文本、老模型、改写过的文本都检不出。于是"未检出"会被反向当成"人写的"证据——一个不可靠的负面信号被当成正面凭证使用。
3. **代码这块两头不讨好。** 法律没要求，Anthropic 做了；但代码低熵导致检测最不可靠，日常 refactor 又会抹掉信号。付出的是潜在的质量代价，换来的是最弱的可检测性。开发者的直觉抱怨（"会 degrade the output"）在机制上是站得住的，只是幅度未知——而 **Anthropic 没有公布任何加水印前后的 benchmark 对比**。
4. **检测能力的时间差是权力差。** 水印已上线，检测 API "forthcoming"。在这个窗口期内，**只有 Anthropic 知道哪段文本是 Claude 写的**。对一家同时在做内容产品的公司，这个不对称需要被明说。
5. **无 opt-out，连企业版都没有。** 欧盟法条里 B2B/闭环环境是有豁免的，Anthropic 没给。对做白标写作、代客撰稿、法律文书起草的商业客户，这是硬伤而非小事。
6. **OpenAI 那套顾虑没有被回答。** 非母语写作者的文本熵结构本就不同，检测器在这类人群上的误判率历史上一直更高。Anthropic 目前**未公布任何按语言/人群分层的误报率数据**。

---

## 深度解读：对行业、对做多 agent 系统的我们

### 对行业

**第一，AI 内容进入"默认可追溯"时代，压力立刻传导到同行。** Anthropic 是第一家把文本水印做成全线默认的前沿实验室。Google 有 SynthID-Text（且早已开源），技术上随时能全开；OpenAI 有检测器但压着不发。现在有人先跳了，另外两家的"不做"从技术保守变成了**需要解释的立场选择**。盯 8 月下旬到 12/2 宽限期之间他们的动作。

**第二，"AI 检测"这个灰色产业要被重构。** 过去的 AI 检测器全是猜的（看困惑度、看句法特征），误判率高到不该用于任何有后果的决策。现在出现了一个**由生成方提供、密钥可验证**的信号。短期内这会让检测服务商日子难过，长期看会把"检测"从玄学变成基础设施——但也把判定权收到了模型厂商手里。

**第三，训练数据的清洗维度多了一条。** 水印可以用来识别"这段语料是 Claude 生成的"。这对模型蒸馏是双向的：想蒸馏 Claude 的人多了一道证据风险（学界已有"水印能否防未授权蒸馏"的专门研究），想避开合成数据污染的人多了一个过滤器。

### 对做多 agent 系统 / AI 内容产品的我们

**1. 内容管线：把"带标"当默认前提重新审一遍。**
任何**经 Claude 生成、或只是过了 Claude 一手**的文本，默认带标。对内容型产品（SEO 站、文档、营销素材、客服话术库），正确的应对**不是想办法抹掉**，而是：
- 把"AI 参与"写进流程与披露，别让它变成一个可以被别人"揭发"的事；
- 把人类实质编辑做成真编辑（不是过一遍就发），这同时降低标记密度和内容风险；
- **不要把"改写以规避检测"做进产品**——这是主动规避溯源，法律与商业风险自负，而且技术上一次 paraphrase 就能做到，意味着任何人都能指控你做了。

**2. 代码：现在就 pin 模型版本，并准备一次 A/B。**
最实际的风险不是"新模型带水印"，而是**"已有模型 in progress"**——你现在 pin 的那个模型，某天会被补上水印支持，而这可能不会体现在一条显眼的 release note 里。行动项：
- 把生产用模型版本写死，别用 `-latest` 别名；
- 订阅 release notes，在切到"支持标记"的版本前后，跑同一套 eval（编译通过率 / 测试通过率 / diff 大小 / token 消耗），**用数据判断有没有退化，别信任何一方的口头保证**；
- 如果你的 agent 有自动 format / lint 步骤，注意它顺手就把水印抹了——这既意味着你不用担心水印污染仓库，也意味着别指望用水印来审计"这段代码谁写的"。

**3. 多 agent 编排：中间产物也带标，想清楚这是资产还是负债。**
Claude 输出喂给别的模型、写进向量库、存进日志——这些都带标。
- **负债侧**：如果你在用 Claude 输出做训练数据或蒸馏，这是一条可被追溯的证据链，先看清各家 ToS；
- **资产侧**：C2PA 签名在需要审计留痕的 B2B 场景（法务、医疗、金融、合规文档）**是卖点不是麻烦**。"我们的每一份 AI 产出都带可验证的生成溯源"——这句话在企业采购里值钱。别只把它当成本。

**4. 合规责任不止在模型厂商。** Art 50 对 **deployer（部署方，也就是你）** 另有一份义务，特别是面向公众的、涉及公共利益议题的 AI 生成文本需要披露。厂商加了水印**不代表你的披露义务被履行了**。如果有欧盟用户，把这条单独过一遍。

**5. 选型判断：这不构成换模型的理由，但构成一次盘点的理由。**
除非你的产品核心就是"AI 参与不可被证明"（白标写作、代写、某些内容农场），否则水印对绝大多数 agent 系统的实际影响是**近似于零的运行时影响 + 一次性的合规与披露梳理**。真正需要重估的是前者那类业务——而如果你的商业模式建立在"没人能证明这是 AI 写的"之上，这条新闻告诉你的是：**这个假设的保质期已经开始倒计时了**。

---

## 接下来盯什么

1. **检测 API 与技术文档发布时间**，以及是否公布**误报率、按语言/人群分层的表现**。没有这组数字，任何基于检测结果的处罚决定都不该被接受。
2. **已有模型（含 Opus 5 系列）补上水印的时点与告知方式**——有没有明确 release note，还是静默生效。
3. **第三方独立复现的鲁棒性评测**：paraphrase 后 / refactor 后 / 翻译后的真阳性率各是多少。这是判断水印到底有没有实际约束力的唯一硬指标。
4. **OpenAI 和 Google 是否跟进文本全面加水印**，尤其在 12/2 宽限期到期前。Google 手里已有现成的 SynthID-Text。
5. **加水印前后的模型质量对比数据**——Anthropic 会不会自己发，或者社区会不会跑出来。代码任务上的差异最值得看。
6. **第一起把水印当证据的真实纠纷**（学术处分、稿件撤回、劳动争议、诉讼），以及法院/机构如何对待"证明处理过 ≠ 证明 AI 作者"这个区分。
7. **是否出现 opt-out 或企业豁免**。欧盟法条里的 B2B 豁免给了 Anthropic 一个可以退让的空间，商业客户压力够大的话它会用。
8. **抹水印工具的出现速度与舆论定性**——是被当成正常的隐私工具，还是被当成规避合规的灰产。这决定了这套机制的社会寿命。

---

## 📚 延伸阅读

- Anthropic 帮助中心（一手）：https://support.claude.com/en/articles/16266773-how-claude-marks-ai-generated-content
- The Register / Thomas Claburn（经 Techmeme 8/11 头条）：https://www.techmeme.com/260811/p2
- the-decoder《Anthropic watermarks all Claude outputs globally...》：https://the-decoder.com/anthropic-watermarks-all-claude-outputs-globally-with-marks-that-may-persist-through-some-editing/
- Forbes / Mary Roeloffs（用户反弹）：https://www.forbes.com/sites/maryroeloffs/2026/08/11/claude-will-put-invisible-watermarks-on-ai-text-and-images-and-the-internet-isnt-happy/
- TechCrunch：https://techcrunch.com/2026/08/11/anthropic-says-it-will-watermark-text-generated-by-its-ai-models/
- d4b.dev《Claude's Watermarking Policy Extends to Code》（代码视角）：https://www.d4b.dev/blog/2026-08-11-claude-watermarking-code
- 欧盟委员会 Art 50 透明度义务 FAQ（豁免清单一手）：https://digital-strategy.ec.europa.eu/en/faqs/transparency-obligations-under-article-50-ai-act
- 欧盟《Code of Practice on Transparency of AI-generated Content》：https://digital-strategy.ec.europa.eu/en/policies/code-practice-ai-generated-content
- arXiv《On Google's SynthID-Text LLM Watermarking System: Theoretical Analysis and Empirical Validation》（机制与鲁棒性）：https://arxiv.org/html/2603.03410v2
- arXiv《Revealing Weaknesses in Text Watermarking Through Self-Information Rewrite Attacks》：https://arxiv.org/pdf/2505.05190
