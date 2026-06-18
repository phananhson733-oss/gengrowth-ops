今天读什么｜别一上来就堆多 Agent，先分清“专家工具”和“真正交接”

1. 适合谁读 / 预计阅读时间
适合正在做 AI Builder、研究助手、内容生产自动化、多 Bot 协作、增长工作流的人读。尤其适合已经开始把一个大 Agent 拆成多个小 Agent，却发现流程变长、结果没更稳的团队。预计阅读时间：8—10 分钟。

2. 为什么值得读
很多团队做 Agent，走到第二阶段都会有同一个冲动：既然一个 Agent 容易乱，那我就多拆几个。问题是，Agent 不是人头越多越高级。拆错了，系统只会多出“传话”、重复上下文和责任不清。

OpenAI 在 Agents SDK 里把多 Agent 先归结为一个问题：到底谁拥有这次回复和后续动作。主 Agent 可以把专家 Agent 当工具来用，也可以真的把任务交出去；这两种不是实现细节，而是产品边界。LangChain 的多 Agent 基准则发现，监督者 Agent 最容易犯的错，恰恰出在“传话层”——子 Agent 本来答对了，主管再转述一次，反而转坏了。Anthropic 做研究系统时也没有把所有环节都多人协作到底，而是让多 Agent 主要负责并行找资料，最后的综合写作仍由一个主 Agent 收口。

一句话：多 Agent 真正难的，不是“能不能分工”，而是“什么时候该分、谁来拍板、信息怎么交接”。

3. 核心概念
第一，多 Agent 首先是“所有权设计”，不是“数量设计”。你要先回答：谁对用户负责，谁只提供中间结果，谁有权触发下一步动作。

第二，有两种常见模式。模式 A 是“专家当工具”：主 Agent 继续面对用户，专家只返回结构化结果；模式 B 是“真正交接”：某个专家接手后续回复或任务，成为新的负责人。前者更稳，后者更灵活，但也更容易丢上下文。

第三，读任务比写任务更适合并行。找资料、查来源、做比对、跑检索，可以多线程展开；真正要形成统一口径、统一语气、统一结论时，最好单点收口。

第四，传话会制造误差。监督者如果把子 Agent 的结论重新“翻译”一遍，很容易丢细节、改语气，甚至改错结论。能转发原结果，就少做二次改写。

第五，权限和审批要分开。能看见某个工具，不等于能直接执行高风险动作；写入、发送、删除、发布，最好仍由主流程单独设批准点。

4. 可复用方法
如果你想判断一个流程该不该上多 Agent，可以直接用这五步：
1）先给任务分层：检索、分析、综合、执行，别一上来就按岗位名拆 Agent。  
2）凡是“只需要产出局部结果”的角色，优先做成专家工具，不急着做成交接代理。  
3）只有当角色需要独立上下文、独立权限、独立对话责任时，才做真正交接。  
4）每次交接只传五样东西：目标、输出格式、可用工具、边界、停止条件。不要把整段路由历史全塞过去。  
5）最后保留一个统一出口：由主 Agent 汇总、定稿、审批、触发副作用。

5. GenGrowth 可以怎么用
- 研究报告流：搜资料、抓案例、核来源可以并行给子 Agent；最后成文保持一个主写手，避免语气和判断打架。  
- 增长自动化：线索补全、竞品扫描、渠道改写可以当专家工具；真正“发给谁、写回哪条记录、是否推进下一步”仍由主 Agent 决策。  
- 多 Bot 协作：Hermes、PM、Ops 不要互相代答。谁负责最终决策，谁就保留出口；其他 Bot 回结构化结果，不抢最终话语权。  
- 知识库沉淀：采集 Agent 负责找材料，整理 Agent 负责提炼卡片，但入库格式和标签最好由单一收口流程控制。

6. 今日行动
拿你们现在一条正在跑的流程，画一张最小“所有权图”：谁直接面对用户，谁只是专家工具，哪一步是真正交接，哪一步需要人工批准。如果一条链路里出现了两个以上“只是转述别人结果”的 Agent，今天就可以先砍掉一个。

7. 参考来源
- OpenAI Agents SDK 指南：https://developers.openai.com/api/docs/guides/agents
- OpenAI Cookbook（Claude Agent SDK 迁移到 OpenAI Agents SDK）：https://developers.openai.com/cookbook/examples/agents_sdk/migrate-from-claude-agent-sdk/readme
- LangChain《Benchmarking Multi-Agent Architectures》：https://blog.langchain.dev/benchmarking-multi-agent-architectures
- Anthropic《How we built our multi-agent research system》：https://www.anthropic.com/engineering/built-multi-agent-research-system
