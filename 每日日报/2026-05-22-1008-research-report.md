今天读什么｜别把所有活都塞给一个 Agent，要学会做“分工 + 并行 + 复核”

**1. 适合谁读 / 预计阅读时间**  
适合正在做 AI Builder、Agent 工作流、内容生产自动化、代码/页面生成、研究整理、知识库沉淀的人读。  
预计阅读时间：8–10 分钟。

**2. 为什么值得读**  
最近一个很明显的变化是：公开产品和文档不再只强调“模型更强了”，而是在强调**怎么组织多个 Agent 一起干活**。  
OpenAI 在 Codex-Spark 里直接提到，未来会把长任务交给后台 sub-agents，并把任务并行分发给多个模型；Anthropic 也把 subagents、agent teams、worktrees、background tasks 单独做成了 Claude Code 的工作方式；一些一线开发者总结也开始反复提同一件事：**真正提升效率的，不是让一个万能 Agent 背更多上下文，而是让不同 Agent 各做各的，再把结果统一审查。**

这对 GenGrowth 很重要。因为我们做的很多事，本来就天然适合拆开：  
选题、找资料、提炼结构、写初稿、做审校、补来源、生成发布版本。  
如果全部塞给一个 Agent，它会越来越像“忙到失焦的全能实习生”；如果拆成几个角色，它反而更稳、更快、更容易接力。

**3. 核心概念**  
第一，**子代理不是多开几个聊天框，而是明确分工**。  
Anthropic 文档里讲得很清楚：subagent 可以做成固定角色，比如研究员、代码审查员、测试员、文档员。关键不是数量，而是每个子代理只负责一种判断。

第二，**并行的价值不只是更快，更是更少上下文污染**。  
一个 Agent 顺着长对话一路跑，前面所有历史都会反复进入后续推理，越到后面越重、越乱、越贵。把任务拆给独立上下文的子代理，能减少“前文包袱”。

第三，**隔离是多 Agent 成功的前提**。  
Anthropic 在工作流文档里强调 worktree 和隔离会话，本质上是在解决“多个 Agent 同时工作时不要互相撞车”。  
不是所有任务都能并行，但能并行的部分最好先隔离，再汇总。

第四，**计划模式比直接开工更重要**。  
如果一上来就写文件、改页面、生成终稿，返工成本会很高。先让主 Agent 产出分工计划，再批准执行，能明显降低跑偏概率。

第五，**最终质量来自复核，不来自第一次生成**。  
OpenAI 在 Codex 页面里强调 PR review、后台自动化和高信号代码审查；不少实践也说明，一个 Agent 写、另一个 Agent 挑错，往往比“同一个 Agent 自己写自己夸”更靠谱。  
所以多 Agent 的核心不是更多产出，而是**更强复核链路**。

**4. 可复用方法**  
如果你想把现有 AI 流程升级成更稳的多 Agent 工作流，可以直接套这个四步法：

**第 1 步：先按角色拆，不要按工具拆。**  
不要先想“给它接 Slack、Notion、浏览器、表格”。  
先想角色：谁负责搜集，谁负责判断，谁负责写，谁负责检查。

**第 2 步：只把能独立完成的部分并行化。**  
资料搜集、页面草稿、竞品摘要、测试检查，这些适合并行。  
最终定稿、统一口径、对外发布，通常更适合单点收口。

**第 3 步：给每个子代理最小必要上下文。**  
研究代理只给研究目标和来源要求；审稿代理只给草稿和检查标准。  
不要把整条长历史都发给每个人。

**第 4 步：最后一定加一个 review 节点。**  
可以是“写作 Agent → 审校 Agent”，也可以是“执行 Agent → 批评 Agent → 汇总 Agent”。  
没有复核，多 Agent 只是更快地产生更多错误。

**5. GenGrowth 可以怎么用**  
第一，用在**研究报告生产线**。  
一个 Agent 找资料，一个 Agent 提炼核心概念，一个 Agent 改写成适合 Slack 的中文学习文，一个 Agent 专门检查重复主题、口径和来源。

第二，用在**AI Builder / SEO 内容流水线**。  
把“关键词研究、SERP 观察、结构草稿、正文扩写、事实校对、发布格式化”拆成多个角色，比单 Agent 从头写到尾更稳。

第三，用在**产品/站点改版**。  
页面文案、信息结构、组件实现、测试检查，本来就是不同类型工作，适合并行做，再统一 review。

第四，用在**内部 Bot 协作**。  
Hermes 不必变成什么都做的总机器人，而更适合做路由、汇总、检查和系统协作层，把具体动作交给对应角色代理。

**6. 今日行动**  
今天就能做的，不用等：

1）找一个你们现在由单 Agent 完成的流程。  
2）把它改写成 4 个角色：搜集、整理、生成、复核。  
3）明确哪些步骤可以并行，哪些必须最后统一收口。  
4）先跑一轮最小实验，不求全自动，只看两件事：**是否更快，是否更稳。**

一句话总结：  
**下一阶段真正有用的 Agent，不是“一个更聪明的 Agent”，而是“一组分工清楚、能并行、会互相检查的 Agent”。**

**7. 参考来源**  
- Anthropic Claude Code Docs（Create custom subagents）  
  https://docs.anthropic.com/en/docs/claude-code/subagents  
- Anthropic Claude Code Docs（Common workflows）  
  https://docs.anthropic.com/en/docs/claude-code/tutorials  
- OpenAI｜Introducing GPT-5.3-Codex-Spark  
  https://openai.com/index/introducing-gpt-5-3-codex-spark  
- OpenAI｜Codex  
  https://openai.com/codex  
- Uno Platform｜Developer AI Tooling in 2026: Trends Shaping How We Build  
  https://platform.uno/blog/ai-tooling-trends-shaping-how-we-build/
