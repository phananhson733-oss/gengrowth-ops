今天读什么｜别让 Agent 一直在线，学会做“休眠—唤醒式工作流”

1. 适合谁读 / 预计阅读时间  
适合正在做 AI Builder、智能体工作流、内容生产自动化、销售跟进、审批流、知识库同步的人读。预计阅读时间 8—10 分钟。

2. 为什么值得读  
很多人做 Agent 时，默认它要像客服一样一直在线：不停轮询、不停检查、不停等下一步。问题是，真实业务里最耗时间的往往不是“思考”，而是“等待”——等人审批、等客户回复、等文件签署、等系统回调、等某个外部动作完成。

最近几篇公开实践给了一个很清楚的方向：Agent 不该在等待时硬撑着活着，而应该像成熟后台系统一样，先把当前状态存好，进入休眠，等事件来了再被唤醒继续跑。Google 在 ADK 教程里把这种模式讲得很直白：真正的难点不是生成下一句，而是跨几天甚至几周不丢进度。Microsoft 也开始把 durable workflow、人工审批、共享状态、MCP 暴露放在同一个框架里讨论。Restate 则进一步强调：只要流程里有失败、重试、长等待和副作用，执行过程就必须“可恢复”，否则一崩就重来，轻则浪费成本，重则重复发消息、重复写数据。

这对 GenGrowth 很重要。因为我们很多流程都不是连续说话，而是“做一步、等一下、再做下一步”：选题后等人工确认，外联后等对方回复，资料同步后等新内容到来，任务卡创建后等下游完成。真正能上线的 Agent，不是一直忙，而是会在该睡的时候睡，在该醒的时候准时醒。

3. 核心概念  
第一，Agent 的大敌不是算力不够，而是空等。很多自动化流程 80% 的时间都耗在等待外部事件。  
第二，休眠不是暂停聊天，而是把“当前做到哪一步”写成可恢复状态，比如：已发草稿、待审批、已签字、待发布。  
第三，唤醒最好靠事件，不靠轮询。与其每 5 分钟问一次“好了吗”，不如让审批通过、邮件回复、Webhook 回调直接触发下一步。  
第四，长流程必须防重复执行。一次唤醒只能推进一次状态，否则就会出现重复发信、重复建卡、重复发布。  
第五，通知层不能省。早上醒来你需要看到：处理了什么、卡在哪、下一步是谁。

4. 可复用方法  
如果你想把现有 Agent 流程升级成“休眠—唤醒式”，可以直接套这五步：  
1）先找“等待多于推理”的流程，而不是找最聪明的模型场景。  
2）把流程改写成状态机，只保留 5—7 个关键状态。  
3）为每个状态定义唤醒事件，比如“收到回复”“审批通过”“文件上传完成”。  
4）每推进一步就落一次检查点，确保宕机后能从上一步继续，而不是从头来。  
5）给每个事件和输出加幂等键，避免重复触发造成二次执行。

5. GenGrowth 可以怎么用  
第一，用在内容生产：选题 Agent 产出结构后休眠，等人确认再唤醒写初稿；初稿完成后再等审校意见继续修改。  
第二，用在线索跟进：不是让 Agent 每小时扫一次邮箱，而是收到回复、退信、预约确认时再触发后续动作。  
第三，用在多 Bot 协作：Hermes/PM/Ops 不必持续背着整段上下文等结果，而是把任务状态写进外部系统，等卡片状态变化再继续。  
第四，用在知识库沉淀：新日报、新会议纪要、新情报入库后，直接触发摘要、打标签、建关联，而不是靠定时全量扫描。

6. 今日行动  
今天就挑一个你们最熟的流程，最好是“等待很多、返工很多”的那种。只做一件事：把它画成“5 个状态 + 3 个事件 + 1 个完成通知”。如果你能把“什么时候睡、被谁叫醒、醒来后做什么”写清楚，这条流程就已经从聊天式 Agent，升级成可运行的后台系统了。

7. 参考来源  
- Google Developers Blog：Build Long-running AI agents that pause, resume, and never lose context with ADK  
  https://developers.googleblog.com/build-long-running-ai-agents-that-pause-resume-and-never-lose-context-with-adk  
- Microsoft .NET Blog：Durable Workflows in the Microsoft Agent Framework  
  https://devblogs.microsoft.com/dotnet/durable-workflows-in-microsoft-agent-framework  
- Restate：What is Durable Execution? A Definitive Guide  
  https://restate.dev/what-is-durable-execution  
- MindStudio：How to Build an AI Agent That Runs Overnight  
  https://www.mindstudio.ai/blog/build-ai-agent-runs-overnight
