今天读什么｜别让 Agent 每次都从头学，把 SOP 做成“可加载技能”

1. 适合谁读 / 预计阅读时间
适合正在做 AI Builder、智能体工作流、内容生产、研究整理、增长自动化的人。尤其适合已经发现同一件事总要反复给 AI 讲规则、讲格式、讲口径，但结果还是时好时坏的团队。预计阅读时间：8—10 分钟。

2. 为什么值得读
过去很多人提升 Agent，靠的是“再补一段 prompt”。今天补语气，明天补格式，后天再补审批提醒。短期能用，长期会越来越乱：新同事不知道哪版提示词是准的，跨工具要重写一遍，模型一换又开始漂。

最近一个明显变化是，主流平台都在把“可复用做事方法”产品化。OpenAI 把 Skills 定义成可共享的重复工作流；Anthropic 把 Skills 做成文件夹标准，让 Agent 按需加载说明、脚本和参考资料；Vercel 也在公开维护官方 agent-skills，把工程经验直接打包给 AI 调用。Addy Osmani 说得很直白：Skills 的价值，在于把脆弱的重复提示，变成耐用、可复用的工作方法。

一句话：下一阶段更稳的 Agent，不只是“更会答”，而是“会调用已经被团队验证过的做事手册”。

3. 核心概念
第一，Skill 不是一段更长的提示词，而是一张“可反复调用的作业卡”。里面至少要写清：什么时候该用、需要什么输入、按什么步骤做、最后交付什么。

第二，Skill 的本质是把团队经验外置出来。OpenAI 强调，它特别适合多步骤、强格式、强规范的重复任务；Anthropic 则把它落成 SKILL.md、参考资料和脚本结构，本质上是在把 SOP、模板、最佳实践变成 Agent 能读懂的形式。

第三，好的 Skill 不是把所有内容一次性塞进上下文，而是按需加载。Anthropic 的做法是：先只告诉模型“有这项技能、适用于什么场景”，真正需要时再读取正文和附加资料。这样更省上下文，也更不容易把无关规则一起带进来。

第四，Skill 不只是教模型“怎么说”，还可以教它“怎么做”。如果一个流程里有固定脚本、检查命令、模板文件、评分清单，就不必每次靠模型临场发挥。Vercel 的官方技能库，本质上就是把团队方法论做成可调用模块。

4. 可复用方法
如果你想把现有流程从“反复重讲”升级成“直接调用”，可以直接用这五步：
1）先挑一件高频重复任务，比如“把零散资料整理成研究学习稿”或“把会议纪要转成行动清单”。
2）先写最小作业卡：适用场景、必需输入、步骤、输出格式、完成前检查。
3）把长模板、品牌规范、案例示例拆到 references，把固定动作放到 scripts，主文件只保留核心流程。
4）连续拿 5—10 个真实任务跑，专门记录漏项、误判、格式跑偏，再回写到 Skill，而不是只改当次 prompt。
5）把一个大 Skill 拆成几个小 Skill，比如“搜集来源 / 提炼观点 / 改写成团队格式 / 输出行动建议”。

5. GenGrowth 可以怎么用
- 研究报告：把“选题—找源—提炼—改写成中文学习稿—给出行动建议”做成研究 Skill，减少每天从零解释格式。
- 内容生产：把品牌语气、文章结构、平台改写规则做成内容 Skill，让日报、长文、社媒版本口径更统一。
- 增长自动化：把“线索背景整理—风险判断—下一步建议—草稿生成”做成销售/BD Skill，先稳定辅助，再决定是否放权限。
- Bot 协作：把 Slack 同步、Wiki 命名规范、交付检查项做成内部 Skill，减少跨 Bot 交接时的口头损耗。

6. 今日行动
今天最值得做的，不是再写一版更长的 prompt，而是选 1 个你们本周重复超过 3 次的任务，做出第一版 Skill。

最低可行版本只要包含 4 样东西：触发场景、输入清单、步骤顺序、验收标准。先让它在真实任务里跑 5 次，再决定要不要扩成团队级标准。

7. 参考来源
1. OpenAI Academy｜Using skills  https://openai.com/academy/skills  
2. Anthropic Engineering｜Equipping agents for the real world with Agent Skills  https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills  
3. Anthropic Docs｜Claude Code Overview  https://docs.anthropic.com/en/docs/claude-code/overview  
4. Vercel Labs｜agent-skills  https://github.com/vercel-labs/agent-skills  
5. Addy Osmani｜My LLM coding workflow going into 2026  https://addyosmani.com/blog/ai-coding-workflow
