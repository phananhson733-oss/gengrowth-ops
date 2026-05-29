今天读什么｜别把 Agent 返工当损耗，要把它做成“纠错飞轮”

1. 适合谁读 / 预计阅读时间

适合正在做 AI Builder、智能体工作流、内容生产、研究整理、知识库同步、多 Bot 协作的人读。  
预计阅读时间：8—10 分钟。

2. 为什么值得读

很多团队已经发现：Agent 第一次产出的东西，往往不是最大问题；**真正拖慢效率的，是同一类错误被人一遍遍手工改，却没有沉淀成系统能力。**

今天值得读的这组公开实践，给了一个很重要的方向：不要把“人工改了一下”当成流程尾声，而要把它变成下一轮更稳的输入。Anthropic 在长任务 harness 和 outcome grader 里强调，Agent 不是写完就算，而是要有独立的检查环节、明确的过线标准和可恢复的进度记录。OpenAI 最近讲自改进税务 Agent，也把重点放在同一件事上：**把人工修正、运行轨迹、字段差异，转成可复跑的评测与下一步工程改动。**

这对 GenGrowth 特别重要。因为我们很多流程都不是“一次回答”，而是“持续交付”：选题、搜集、整理、写稿、复核、归档、再复用。没有纠错飞轮，Agent 每天都像重新上岗；有了飞轮，它才会越做越稳。

3. 核心概念

第一，**返工不该只发生在人脑里，要留下结构化痕迹。**  
不是只说“这里不太对”，而是记录：原输出是什么、人工改成了什么、最终为什么这样改。

第二，**harness 不是提示词，而是整套工作护栏。**  
OpenAI 在改进循环里把 harness 定义得很清楚：它包括指令、工具、路由、输出要求、验证规则。也就是说，稳定性来自整套“工作合同”，不只是多写两句 prompt。

第三，**执行者和检查者最好分开。**  
Anthropic 的做法很有启发：一个 agent 负责写，另一个独立 grader 只负责按 rubric 检查，没过就退回修改。这样比“自己写、自己夸”可靠得多。

第四，**长流程要有可接力的进度文件。**  
Anthropic 在 long-running agent 文章里提到，初始化时先建进度日志、启动脚本、初始提交，让下一轮 agent 能快速接上，而不是每次从零猜状态。

第五，**高频错误要升级成可复跑测试。**  
OpenAI 的思路是：先抓出重复出现的修正，再把它们变成 eval 目标。这样下一次不是“希望别再错”，而是“跑不过就不算完成”。

4. 可复用方法

如果你想给现有 Agent 流程加一个最小纠错飞轮，可以直接套这五步：

1）先写清“什么叫完成”。  
不要只说“写一篇报告”，而是明确：必须有固定小节、来源数、引用方式、禁区、交付格式。

2）让 Agent 每次都留下中间产物。  
比如进度日志、字段表、检查清单、最终草稿，不要只留聊天记录。

3）把人工修改记录成差异。  
至少保留三列：原输出、人工修改、最终采用版本。这样以后才知道哪里最常错。

4）把重复错误转成检查器。  
能脚本检查的就脚本化，不能脚本化的就做 rubric，让 grader 或 reviewer 按固定规则审。

5）把经验写回系统，不只写回 prompt。  
真正该更新的，往往是模板、skill、脚本、校验规则、任务交接格式，而不只是“提示词再优化一下”。

5. GenGrowth 可以怎么用

第一，用在研究报告。  
写稿 Agent 先产出初稿，再让 grader 检查：有没有和最近主题撞车、有没有固定小节、来源是否足够、有没有空泛表述。

第二，用在内容生产。  
SEO 文章、外联草稿、销售资料每次被人工改动后，不要只改正文，要顺手记录“常见三类错误”，慢慢做成模板和评测。

第三，用在多 Bot 协作。  
如果 Hermes、PM、Ops 之间经常出现交接不清，就把这些错误升级成“交接契约”与验收清单，而不是继续靠聊天补。

第四，用在知识库和表格同步。  
字段映射错、标签打错、摘要格式不稳，这些都很适合做成字段级校验，而不是靠人肉二次巡检。

6. 今日行动

今天就做一个最小实验，不求大而全：

- 选 1 个你们最常返工的流程，比如研究日报、SEO 初稿、资料整理。  
- 写 1 份过线标准：必须包含什么、绝不能出现什么。  
- 连续记录 3 次“原输出—人工修改—最终版本”。  
- 从这 3 次里挑出最重复的 1 类错误，把它改成一个固定检查项。  

先别急着追求“自动学习”。**先把纠错留痕、把重复错误固定下来，飞轮才转得起来。**

7. 参考来源

- Anthropic｜Effective harnesses for long-running agents  
  https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents
- Anthropic Claude Cookbook｜Outcomes: agents that verify their own work  
  https://platform.claude.com/cookbook/managed-agents-cma-verify-with-outcome-grader
- OpenAI｜Building self-improving tax agents with Codex  
  https://openai.com/index/building-self-improving-tax-agents-with-codex
- OpenAI Cookbook｜Build an Agent Improvement Loop with Traces, Evals, and Codex  
  https://developers.openai.com/cookbook/examples/agents_sdk/agent_improvement_loop
