今天读什么｜别让 Agent 靠聊天接力，要给每一步写“交接契约”

**1. 适合谁读 / 预计阅读时间**  
适合正在做 AI Builder、智能体工作流、内容生产自动化、研究整理、知识库沉淀、多 Bot 协作的人读。  
预计阅读时间：8–10 分钟。

**2. 为什么值得读**  
很多团队做 Agent，最容易误判的一点是：上一步“看起来完成了”，不等于下一步“真的接得住”。  
Demo 里，一个 Agent 写一段漂亮总结，大家会觉得流程通了；但一旦把它接到下一个 Agent、数据库、任务系统或发布链路，问题就出现了：字段不稳定、状态不明确、上下文过肥、失败不可恢复。最后不是模型不聪明，而是**交接方式太像聊天，太不像系统**。

最近几篇公开内容在这件事上非常一致。AWS 直接把**结构化输出**称为阻止不确定性扩散的边界；MindStudio 把 handoff pattern 讲得很直白：输出不是给人“看懂”就行，而是要给下游“直接消费”；Anthropic 在长任务和多 Agent 实践里也反复强调：上下文要分段重置，靠结构化产物和外部 artifact 接力，而不是把整段历史越背越长。  
这对 GenGrowth 很重要。因为我们很多流程天然是串行的：搜资料、筛来源、提炼框架、写草稿、复核、归档、触发后续动作。**如果交接靠散文，流程就会越来越脆；如果交接靠契约，流程才能越跑越稳。**

**3. 核心概念**  
第一，**结构化输出不是“格式美化”，而是系统边界**。  
上游 Agent 如果输出一大段自由文本，下游必须重新理解一次；每多一次理解，就多一次偏差。更稳的做法是：在交接处强制输出固定字段，让“解释”变少，让“消费”变多。

第二，**交接 payload 要“最小充分”，不是越多越好**。  
太少，下游得重复推理；太多，噪音会淹没有效信息。真正好的交接，不是把所有思考都倒给下游，而是只传下一步必需的结果、证据、状态和待办。

第三，**上下文按步骤加载，产物按引用传递**。  
Anthropic 很强调这一点：长流程不要让所有历史一直堆在同一个上下文里。更好的方式是，每一步只加载当前需要的规则和资料；大报告、表格、代码、长摘要落到文件或外部系统里，交接时只传引用和摘要。

第四，**工具接口本身也是契约的一部分**。  
工具不该只返回“成功/失败”两个字。更实用的设计是：支持简洁/详细两种返回模式，报错时给出可修复提示，而不是一串看不懂的错误码。这样 Agent 才知道下一步该补什么，而不是盲重试。

第五，**高风险动作和连续失败要有人接管**。  
多 Agent 不代表全自动。涉及写入、发送、删除、审批，或同一步连续失败时，应该明确进入人工复核，而不是让系统硬撑到底。

**4. 可复用方法**  
如果你想把现有工作流改成“可交接”的系统，可以直接套这张最小交接单：

1）先定义“下一步真正需要什么”。  
不要问“上一步想说什么”，而要问“下一个节点必须拿到什么字段才能继续”。

2）每次交接固定 6 个字段：  
- `status`：成功 / 失败 / 需人工确认  
- `task`：这一步完成了什么  
- `result`：结构化结果  
- `evidence`：来源或依据  
- `risks`：不确定项 / 缺口  
- `next_action`：下一个节点该做什么

3）大产物外置，不在上下文里搬家。  
长文、表格、截图、草稿、代码都落文件；交接时只传链接、路径或摘要。

4）给工具加“可恢复设计”。  
返回值分简洁版和详细版；报错信息说明该改哪个参数；写入类动作最好带任务 ID 或去重键，避免重试时重复创建。

5）把人工接管条件提前写清楚。  
例如：证据不足、字段缺失、高风险写入、连续两次失败，就停止自动流转。

**5. GenGrowth 可以怎么用**  
第一，用在研究报告流水线。  
“搜集资料 Agent → 提纲 Agent → 成稿 Agent → 归档 Agent”之间，不再传整段聊天，而是传统一交接单。这样换模型、换 Prompt、换执行顺序，都不会把整条链路一起改坏。

第二，用在线索和选题系统。  
把“来源抽取 → 主题归类 → 价值判断 → 内容建议”做成结构化交接，后面无论接 Slack、任务板还是知识库，都会稳定很多。

第三，用在多 Bot 公共协作。  
不同 Bot 不要靠长篇自然语言互相解释，只传任务摘要、目标、状态、公开链接、下一步动作。这样更安全，也更容易审计和复盘。

**6. 今日行动**  
今天就做三件小事：  
1. 选一条你现在正在跑的 AI 流程，只挑 2–3 个步骤。  
2. 给步骤之间补一张固定交接单，至少写清 `status / result / risks / next_action`。  
3. 找一个最常失败的工具，把返回值和报错改成“Agent 能继续处理”的格式。

**7. 参考来源**  
1. AWS｜Multi-agent architectures  
https://aws.amazon.com/marketplace/build-learn/ai-agent-learning-series/multi-agent-architectures

2. MindStudio｜What Is the Agent Handoff Pattern?  
https://www.mindstudio.ai/blog/what-is-agent-handoff-pattern

3. Anthropic｜Harness design for long-running application development  
https://www.anthropic.com/engineering/harness-design-long-running-apps

4. Anthropic｜Writing effective tools for AI agents  
https://www.anthropic.com/engineering/writing-tools-for-agents

5. OpenAI｜A practical guide to building AI agents  
https://openai.com/business/guides-and-resources/a-practical-guide-to-building-ai-agents
