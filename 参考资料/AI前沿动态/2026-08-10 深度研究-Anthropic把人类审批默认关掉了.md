---
title: 深度研究 · Anthropic 把「你确定吗」默认关掉了——Claude Code auto mode 成为默认值
date: 2026-08-10
type: ai-deepdive
topic: Claude Code auto mode 默认化 / agent 权限范式
source: https://claude.com/blog/auto-mode-default-in-claude-code
tags:
  - ai-news
  - research-report
  - anthropic
  - claude-code
  - agent-safety
  - human-in-the-loop
push_channel: feishu/research-reports
---

# 🧠 深度研究 ｜ Anthropic 把「你确定吗」默认关掉了

> **一句话定性**：这不是一次权限设置的产品微调，而是头部实验室**第一次用自家生产数据公开宣判「让人类逐步审批 agent」是安全剧场**——并把结论直接写进了几百万开发者的默认配置里。8 月 14 日生效。人在 agent 回路里的位置，从「审每一步」被推到了「审计划、审边界」。

**来源**：Anthropic 官方博客《Auto mode is now the default in Claude Code for Pro, Max, and Team plans》，2026-08-07 发布，2026-08-14 生效。TechCrunch（8/9）、9to5Mac（8/7）、The New Stack / Frederic Lardinois（8/7）、the-decoder（8/8）、TECHi、Simon Willison（8/8）交叉与批评。
🔗 原文：https://claude.com/blog/auto-mode-default-in-claude-code

---

## 一、为什么这一篇值得单独深读

过去两年，几乎所有 agent 产品的安全故事都建立在同一个假设上：**「有人类在回路里（human-in-the-loop）」＝ 安全**。这个假设从没被认真验证过——它是监管文件里的挡箭牌、企业采购清单里的勾选项、也是我们自己做 agent 系统时最省事的免责设计。

这次不同的地方在于：Anthropic 拿出了**受控实验 + 生产遥测 + 两家第三方红队**三层证据，论证这个假设是错的——不是「不够好」，是**方向性地错了**：人类逐步审批不仅没提升安全，反而**比自动分类器差 6.5 倍**。然后它做了一件更激进的事：不是把这个发现写成论文，而是**改成默认值推给全部 Pro / Max / Team 用户**。

默认值就是事实上的行业标准。这是 agent 工程范式的一次移位，不是 release note。

## 二、核心事实（按证据强度分层）

**A. 变更本身（确定事实）**

- **2026-08-14 起**，Claude Code 在 **Pro / Max / Team** 计划的**新会话**默认进入 auto mode。
- **仍为 opt-in（不默认开）**：Claude Enterprise、Claude API、AWS 上的 Claude Platform、Amazon Bedrock、Google Cloud Agent Platform、Microsoft Foundry。
- 机制：每次 tool call 过一道**分类器**，而不是弹窗问人。仍会请求人工批准的是「**irreversible, destructive, or aimed outside your environment**」（不可逆、破坏性、或指向你环境之外）的动作。
- 被挡住时，Claude 会先尝试更安全的替代路径；**反复被挡则回落到手动审批**。
- **分类器消耗的 token 不计费**。
- 退出方式：CLI 里 `Shift+Tab` 或模式下拉；管理员可用 managed settings 的 `defaultMode` 固定，或 `disableAutoMode` 直接关闭。
- auto mode 首个测试版发布于 **2026 年 3 月**，已跑了约五个月。

**B. 「人类审批失效」的证据（这是全篇的地基）**

- 用户批准了 **97%** 的权限提示——弹窗事实上已退化为肌肉记忆。
- **对比最关键的一组**：用户拒绝 **39%** 的**计划（plan）审批**，但只拒绝 **3%** 的**单步权限请求**。人在「意图层」有判断力，在「动作层」没有。
- **49.5%** 的活跃 CLI 用户已经手动写过 Bash allow-rules（自己给自己拆闸门）。
- **62%** 的用户用过 bypass permissions 或「don't ask again」。
- 换句话说：auto mode 的对照组从来不是「理想的全程人工审查」，而是**一个已经有六成用户实质放弃审查的现状**。

**C. 实验与生产数据（有力但有保留）**

| 指标 | auto mode | 人工审批 |
|---|---|---|
| 受控实验拦截危险命令（1,053 名付费测试者） | **89%** | **13.6%** |
| 连续 50 个提示之后的检出率 | 基本持平 | 从约 17% 掉到 **约 5%** |
| 生产会话中含「用户未明确要求的危害」（severity 7+） | **2.4%** | **6.3%** |
| PR 产出 | **约多 25%** | 基线 |

- 第三方红队一：**Trajectory Labs** 的 prompt injection 测试，**72 个场景 × 10 次 = 720 次攻击**，对 Claude 现役模型（Fable 5 / Opus 5 / Sonnet 5）在 auto mode 下**成功率 0%**；同一套测试对 **GPT-5.6 Sol 成功率 5.83%**。
- 第三方红队二：**Apollo Research** 的刻意敌对数据集，硬化后分类器**漏检率 7%**。
- 内部战绩：auto mode 阻止过 Claude 把机密数据上传到公开位置；终止过**约 2,000 个**会打断 GPU 训练任务的进程。

**D. 同批上线的安全能力（容易被忽略，但比默认值本身更重要）**

- 针对数据外泄的**硬拒绝规则（hard denies）**，可自定义
- 数据访问与共享规则
- 破坏性操作前**检查 git status**
- **prompt injection 筛查**

## 三、机制拆解：它到底把什么换成了什么

这次变更真正做的是**三次替换**，值得逐条看清：

1. **把「同步中断」换成「异步分类」。** 原本每个 tool call 是一次对人的中断（成本高、注意力衰减快）；现在是一次对分类器的调用（成本低、不衰减、且不向用户计费）。表格里「人的检出率 50 个提示后掉到 5%，分类器持平」这一行，是整套论证的物理基础——**人类注意力会疲劳，分类器不会**。这不是模型比人聪明，是采样率的胜利。

2. **把审批点从「动作层」上移到「意图层」。** 39% vs 3% 那组数字是全篇最可执行的发现：同一批人，看「计划」时否决率是看「单条权限」时的**13 倍**。人的比较优势在于判断「这件事该不该做」，而不是「这条 `rm` 该不该跑」。Anthropic 没有取消人类监督，它**把监督搬到了正确的抽象层级**。

3. **把安全成本内部化。** 分类器 token 不计费，等于 Anthropic 用自己的毛利买下这层防御。这有竞争含义：任何自建 agent harness 的团队，要么自己造这层分类器并自己承担推理成本，要么承认默认更不安全。

**但注意它没有换掉什么：** 分类器仍然是**概率性的**。11%（受控）到 7%（敌对硬化后）的漏检率，意味着它是**纵深防御的一层，不是边界**。真正的边界只能来自能力剥夺——沙箱、凭据最小化、网络出口白名单。Anthropic 自己也这么说。

## 四、关键原话

> **Boris Cherny（Claude Code 负责人）**："The team and I use Auto mode exclusively, and have been for many months. I couldn't imagine going back to permission prompts!"

> **Anthropic 官方的自我限定**："For high-stakes changes to production infrastructure, we still recommend reviewing Claude's actions yourself."（对生产基础设施的高风险变更，我们仍建议你亲自审查 Claude 的动作。）

> **The New Stack 的标题定性**：「Auto Mode will soon be the default in Claude Code — **because humans can't be trusted**」

> **Simon Willison（8/8）**："I absolutely buy that auto mode is a better solution than asking humans to constantly approve actions." 但对 prompt injection 的零成功率结果：「I would _love_ to believe that Anthropic have indeed solved this problem for Claude Code users... But... **I'd like to see more independent confirmation of this**.」

## 五、正反两面

**支持方（Anthropic 及认同者）**
- 数据方向一致：受控实验（89% vs 13.6%）、生产遥测（2.4% vs 6.3%）、两家独立红队，三条独立证据链指向同一结论。
- 确认疲劳（confirmation fatigue）是真实的、可测量的、且随会话长度单调恶化——Willison 也承认这点。
- 效率不是借口而是安全变量：审批弹窗越多，用户越倾向于一次性 bypass，安全姿态反而崩得更彻底。62% 的 bypass 使用率就是证据。
- Enterprise / API / 云平台**不默认开**，说明 Anthropic 对高风险场景保留了保守默认——这是有分寸的分层，不是一刀切。

**质疑方（方法论 + 架构 + 治理三条线）**
- **方法论**：1,053 名测试者在**合成环境**里、每人**一个植入的危险命令**、且**知道自己在参加研究**。TECHi 的批评很准：这回答的是「谁能在提示流里抓住一条明显的坏命令」，**不是「分类器能否理解真实仓库里藏着的每一个破坏性动作」**。生产侧的 2.4% vs 6.3% 是**关联而非因果**——选择 auto mode 的用户本身可能就是任务更规整的那批人。
- **残余风险被轻描淡写**：89% 的另一面是 **116 条危险命令通过了**（1,053 中的 11%）。敌对数据集硬化后仍有 7%。乘以 Claude Code 的日活量级，绝对数字不小。
- **架构路线之争**：Willison 认为方向应该是**让 agent 根本接触不到能造成伤害的数据和工具**（沙箱化），而不是让分类器更聪明。他此前预测 2026 年会出现「a challenger disaster for coding agent security」（coding agent 安全的挑战者号灾难），并把 lethal trifecta 直接挂在这类场景上。720 次攻击 0% 成功是个好数字，但**样本来自单一第三方、场景由厂商侧参与设计**，需要独立复现。
- **能力退化（deskilling）**：默认关掉审批，把开发者从「写代码」进一步推向「review AI 产出」，而介入越少，越难建立对项目的深层理解——而恰恰是这种理解，决定了你在关键时刻能不能看出问题。这是慢性成本，不进任何季度指标。
- **责任转移**：默认值一改，风险归属就从「用户显式选择了自动执行」变成「厂商默认让它自动执行」。Enterprise 仍需 opt-in，恰恰说明 Anthropic 自己清楚这条法律与合规分界线在哪。
- **横向对照**：据 9to5Mac 报道口径，OpenAI 对其最强的 GPT 版本出于审慎**没有**默认启用自动模式。同一道题，两家给了相反的默认答案。

## 六、深度解读：对行业，以及对「做多 agent 系统的我们」

**对行业：**

1. **HITL 作为合规话术的时代结束了。** 这份数据一旦流通开，「我们有人工审核」将不再是可信的安全主张——因为现在有厂商生产数据证明人工审核的检出率是 13.6%、且 50 步后掉到 5%。监管方、审计方、保险方迟早会引用这组数字。反过来说，谁能证明自己的审批点设在**意图层**而不是动作层，谁的合规叙事才站得住。
2. **默认值即标准。** Claude Code 是 coding agent 事实上的参考实现。它把默认打到 auto，Codex、Cursor、Gemini CLI 面临的问题就变成「跟进，还是把『我们更保守』做成卖点」。**这是接下来 4–8 周最值得观察的竞争分叉。**
3. **安全分类器成为一个新的基础设施层**，且被 Anthropic 用免费 token 补贴掉了。这会挤压「agent 安全中间件」这一创业赛道的独立生存空间——能力正在被吸进模型厂商的默认栈。

**对我们（做多 agent 系统的团队）——七条可执行判断：**

1. **本周就要做的事：8/14 是硬 deadline。** 任何跑在 Pro/Max/Team 账号下的 Claude Code（尤其是 CI、定时任务、无人值守流水线）会在**新会话**里静默切换行为。**今天就去 managed settings 里把 `defaultMode` 显式固定下来**——不管你最终选哪个模式，都不要让默认值替你做决定。默认值漂移是无人值守 agent 最典型的事故来源。
2. **把审批点整体上移。** 39% vs 3% 是可以直接抄进架构的：**删掉大部分单步 tool-call 确认，代之以一次高质量的计划审批**。我们自己的 agent 流水线里凡是「每步都问人」的设计，现在有数据证明它既慢又不安全，应当重构为「计划门 + 自动执行 + 事后 diff 审计」。
3. **分类器是过滤器，沙箱才是边界。** 7%–11% 的漏检率意味着不能把分类器写进威胁模型的「防护」一栏，只能写进「降噪」一栏。真正要投入的是：容器化执行环境、**出口网络白名单**、凭据最小权限与短时效、以及生产库的物理隔离。Willison 的路线在这一点上比 Anthropic 的路线更接近根因。
4. **prompt injection 的账不能只看 720 次测试。** 0% 成功率是单一第三方、单一场景集的结果。我们的实际暴露面（抓取的网页、第三方 npm 包的 postinstall、issue 正文、MCP server 返回值）远比测试集脏。**在独立复现出现之前，继续按「注入会成功」来设计**——即假设 agent 读到的一切外部内容都是敌对的。
5. **把「不可逆动作清单」写成我们自己的配置，别用默认的。** Anthropic 的 hard denies 和 git status 检查是好东西，但它不知道我们的 `_staging` 目录、claim ledger、发布闸门意味着什么。**我们的领域里什么算 irreversible，只有我们能定义**——这份清单要显式写出来并进版本控制。
6. **25% 更多 PR 是诱惑也是陷阱。** 这是关联数据，且 PR 数不是价值。真正该盯的对应指标是**回滚率、事后修复 PR 占比、和 review 深度**。若采用 auto 之后 PR 涨 25% 而回滚率同步上升，那是把成本从执行端搬到了运维端，不是提效。
7. **能力退化要用流程对冲。** 如果团队要走 auto 路线，就必须人为保留「读懂系统」的仪式——定期的架构走查、关键模块的人工重写、以及不允许 agent 独自触碰的核心路径。否则两个季度后，没人能在事故现场读懂自己的系统。

## 七、接下来盯什么（信号）

- **8/14 之后 1–2 周**：是否出现第一批公开的 auto mode 事故报告或紧急回滚；Anthropic 是否发补充说明。这是对整套论证最直接的现实检验。
- **独立复现**：Trajectory Labs 的 720 次攻击测试、Apollo Research 的敌对数据集，是否公开完整方法论与数据，是否有无关第三方复现出非零成功率。
- **竞争对手的默认值**：OpenAI Codex、Cursor、Gemini CLI 是否跟进默认自动；若有人明确把「保守默认」做成差异化卖点，说明行业未形成共识。
- **Enterprise 何时也默认开** —— 这是 Anthropic 自身信心的真实读数，比任何博客措辞都可靠。
- **Willison 的「挑战者号时刻」是否兑现**：即第一起由 coding agent 自动执行 + prompt injection 导致的重大公开事故。
- **合规侧**：是否有监管机构、审计标准或网络保险条款开始引用「人工审批检出率 13.6%」这组数字，反过来要求「必须有自动分类器」。
- **HN / 开发者社区的实测反馈**（讨论帖 id 49214994、49239021），尤其是与 Cursor 等更细粒度权限方案的对比结论。

## 📚 延伸阅读

- 一手公告：https://claude.com/blog/auto-mode-default-in-claude-code
- TechCrunch（8/9）：https://techcrunch.com/2026/08/09/anthropic-is-turning-claude-codes-auto-mode-on-by-default/
- The New Stack / Frederic Lardinois（8/7）：https://thenewstack.io/claude-code-auto-mode/
- Simon Willison 评论（8/8）：https://simonwillison.net/2026/Aug/8/auto-mode/
- the-decoder（8/8）：https://the-decoder.com/anthropic-sets-claude-code-to-auto-mode-by-default-to-protect-developers-from-bad-approvals/
- 9to5Mac（8/7）：https://9to5mac.com/2026/08/07/psa-claude-code-enabling-auto-mode-as-default-next-week-anthropic-says/
- 漏检率批评（TECHi）：https://www.techi.com/claude-code-auto-mode-default-11-percent-miss-rate/
- Hacker News 讨论：https://news.ycombinator.com/item?id=49214994
