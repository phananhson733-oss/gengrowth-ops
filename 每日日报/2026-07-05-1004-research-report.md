今天读什么｜别把多个 Agent 只串成流水线，先给它一份“交接协议”

1. 适合谁读 / 预计阅读时间  
适合做 AI Builder、研究助手、内容生产、增长自动化、知识库沉淀的人。尤其适合已经开始把多个 Agent 或多个 Bot 接进同一条流程，却发现“能分工，但老掉链子”的团队。预计阅读时间 10 分钟。

2. 为什么值得读  
过去很多人搭多 Agent，思路很简单：再加一个写稿 agent、再加一个审稿 agent、再加一个发文 agent。问题不是不会分工，而是不会交接。上一棒到底该交什么？交全文、交摘要、交结构化字段，还是只交一个任务编号？谁保留与用户对话，谁只做后台子任务？如果中间断线、等审批、跨系统调用，还能不能从原地继续？最近几家公开资料把方向讲得很清楚。OpenAI 官方文档开始明确区分 handoff 和 agents as tools：不是所有子代理都该直接接管对话。Anthropic 在多代理研究系统里强调，子代理最好带着隔离上下文深挖，再只把压缩后的发现交回主代理。Vercel 则把挂起、恢复、外部事件和重试做进 durable execution，说明交接不该只靠聊天历史。Google ADK/A2A 更进一步，把“本地子代理”和“远程代理服务”拆开，要求远程代理先暴露能力说明，再谈互相调用。你会发现，很多多 Agent 流程最后不稳，并不是模型不够强，而是交接时把责任、上下文和验收标准都说糊了。  
一句话：下一阶段更稳的 Agent，不是多找几个角色，而是先把角色之间的交接协议设计清楚。

3. 核心概念  
第一，交接不等于甩锅。交接后必须明确：下一位接什么任务、拿到什么上下文、产出什么结果。  
第二，不是所有分工都该用 handoff。OpenAI 的意思很实用：如果只是让专家帮做一个小子任务，主代理应继续控制对话；只有当“下一阶段本来就该换人负责”时，才适合 handoff。  
第三，细节应留在子代理，结论才交给主代理。Anthropic 的做法是让子代理自己消化大量搜索和工具结果，最后返回压缩摘要，避免所有噪音都堆回主上下文。  
第四，远程协作要先声明能力。Google A2A 里的 agent card，本质上就是“我是谁、我会什么、怎么找我”的说明书。  
第五，交接必须可恢复。Vercel 强调，长流程里的等待、重试、外部事件和中断，不能靠“记得上次聊到哪”来恢复。  
第六，交接最好带验收条件。没有验收条件，下一位只能靠猜，最后容易出现人人都做了、但没人真正做完。

4. 可复用方法  
如果你想给现有流程补一层最小“交接协议”，可以直接用这五步：  
1）先画出流程里的角色边界：谁负责对话、谁负责检索、谁负责生成、谁负责审查、谁负责执行。  
2）每次交接只传最小必要包：任务标题、背景摘要、成功标准、结构化字段、产物链接。不要把整段长历史无脑转发。  
3）给每类交接定义统一输出：例如“结论 / 证据 / 风险 / 下一步”，或者“状态 / 负责人 / 截止时间 / 产物地址”。  
4）区分本地子代理和远程代理。进程内高频小任务走本地；跨团队、跨系统、跨权限能力再做远程调用。  
5）所有关键交接点都留回执：什么时候交的、交给谁、是否成功、失败后回到哪一步。

5. GenGrowth 可以怎么用  
在 GenGrowth，这套思路特别适合三类流程。第一，研究稿生产：选题 agent 做路由，研究 agent 深挖，写作 agent 成稿，review agent 只查风险和依据。第二，增长自动化：线索分诊 agent 先分类，再把需要行业研究、外联草稿、CRM 回写分别交给不同角色。第三，多 Bot 协作：Hermes、PM、Ops、HR 不该互相“代打”，而应通过任务卡和交接包传递最小必要信息。这样既能协作，也不容易把权限、上下文和责任边界搞乱。尤其是 Slack 线程、任务板、知识库、CRM 这种跨系统链路，越早补交接协议，后面越省返工。

6. 今日行动  
今天就挑一条你们最常用的 AI 流程，补一张“交接卡”模板，只写五项：当前任务、输入摘要、输出格式、风险点、下一步负责人。先别急着加更多 Agent。很多时候，流程不稳，不是因为角色太少，而是因为交接太糊。

7. 参考来源  
- OpenAI Agents SDK：Agent orchestration  
  https://openai.github.io/openai-agents-python/multi_agent/  
- OpenAI Agents SDK：Handoffs  
  https://openai.github.io/openai-agents-python/handoffs/  
- Anthropic：How we built our multi-agent research system  
  https://www.anthropic.com/engineering/multi-agent-research-system  
- Vercel：A new programming model for durable execution  
  https://vercel.com/blog/a-new-programming-model-for-durable-execution  
- Google ADK：Introduction to A2A  
  https://google.github.io/adk-docs/a2a/intro/
