今天读什么｜别让 Agent 一拿到工具就像拿到全公司门卡

1. 适合谁读 / 预计阅读时间  
适合正在做 AI Builder、智能体工作流、团队知识助手、内容生产自动化、增长运营自动化的人。尤其适合已经把 Slack、文档、浏览器、代码、CRM 接进 Agent，却开始担心“它到底该看到什么、能做什么、什么时候该停”的团队。预计阅读时间：8—10 分钟。

2. 为什么值得读  
过去大家最关心 Agent 会不会做事；现在更关键的问题变成：它在什么边界内做事。OpenAI 最近把 workspace agents 明确定位成“可重复、共享、带流程约束”的工作代理，不再只是一次性聊天。Anthropic 的公开数据也很有代表性：约 80% 的工具调用带着至少一种护栏，只有约 0.8% 看起来是不可逆动作，但“高自治 + 高风险”的角落已经不再是空白。用户一旦开始信任 Agent，监督方式也会从“每步点批准”转向“让它先跑，但我随时能打断”。一句话：下一阶段的竞争点，不只是让 Agent 接更多工具，而是把权限、审批和监督设计成产品能力。

3. 核心概念  
第一，工具可见，不等于工具可用，更不等于动作可自动通过。OpenAI 在迁移指南里把这三件事拆得很清楚：先决定 Agent 看见哪些工具，再决定哪些动作要审批，最后才决定谁对最终结果负责。

第二，最小权限不是安全口号，而是产品结构。把密钥、审批、业务系统访问放在主应用；把文件编辑、脚本执行、临时产物放进沙箱或项目工作区。这样 Agent 就算出错，爆炸半径也更小。

第三，审批过多会产生“批准疲劳”，但完全跳过又太危险。Anthropic 发现 Claude Code 的权限弹窗有 93% 会被用户点通过，所以他们做了一个折中层：默认放行低风险动作，只把真正危险的命令送去二次判断。

第四，成熟用户的监督方式不是“盯每一步”，而是“让它先跑、我随时打断”。Anthropic 的数据里，新用户大约 20% 会开全自动批准，资深用户会超过 40%；但他们中途打断 Agent 的比例也更高。这说明好的监督，不是把人绑在每个按钮上，而是给人足够好的可见性和刹车能力。

第五，Agent 自己会停下来问问题，也是一种护栏。复杂任务里，Claude Code 主动澄清的频率比人类中断还高。真正稳的系统，不是永远往前冲，而是知道什么时候该问、该停、该升级给人。

4. 可复用方法  
如果你想给现有 Agent 补一层“权限架构”，可以直接用这五步：  
1）先把流程拆成三栏：它需要看什么、它可以做什么、它必须先问什么。  
2）默认把读权限和写权限分开。搜索、读取、摘要可放宽；发送、删除、发布、付费、改生产数据单独设审批。  
3）把高风险执行搬出主上下文。让 Agent 通过沙箱、受限脚本或专门工作流去做，而不是直接拿全局凭证裸奔。  
4）给运行过程加“可打断性”。至少要让人看见它在调用什么工具、准备改什么、下一步要去哪。  
5）把“模糊指令”视为风险信号。像“清一下旧分支”“帮我取消那个任务”这类话，默认要求 Agent 回问对象、范围和影响面。

5. GenGrowth 可以怎么用  
- 在 AI Builder / 研究报告流程里，允许 Agent 自动搜集、整理、起草，但不要直接对外发消息或覆盖正式知识库。  
- 在多 Bot 协作里，把“可见范围、可执行动作、是否需要人工确认”写成交接契约，而不是靠口头默认。  
- 在增长自动化里，让 Agent 先生成外联草稿、CRM 更新建议、渠道发布清单；真正发送、回写、发布前再过审批。

6. 今日行动  
挑一条你们已经半自动化的流程，今天就做一张三列表：可见工具、可执行动作、必须审批动作。只要这张表写出来，你就会立刻看见哪些地方其实是在“默认给全权限”，哪些地方该补刹车。

7. 参考来源  
- OpenAI Academy：Workspace agents  
  https://academy.openai.com/public/clubs/work-users-ynjqu/resources/workspace-agents  
- OpenAI Developers：从 Claude Agent SDK 迁移到 OpenAI Agents SDK  
  https://developers.openai.com/cookbook/examples/agents_sdk/migrate-from-claude-agent-sdk/readme  
- Anthropic：Measuring AI agent autonomy in practice  
  https://www.anthropic.com/research/measuring-agent-autonomy  
- Anthropic：How we built Claude Code auto mode: a safer way to skip permissions  
  https://www.anthropic.com/engineering/claude-code-auto-mode
