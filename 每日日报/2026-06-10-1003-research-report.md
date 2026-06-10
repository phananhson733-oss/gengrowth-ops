今天读什么｜别把 Agent 的工具箱越接越大，要先给它做一层“工具导航”

1. 适合谁读 / 预计阅读时间

适合正在做 AI Builder、智能体工作流、内容生产自动化、知识检索、销售/运营自动化的人读。尤其适合已经给 Agent 接了 Slack、飞书、GitHub、Google Drive、表格、数据库，却开始觉得它“会用工具但总是用不对”的团队。预计阅读时间：8—10 分钟。

2. 为什么值得读

很多团队做 Agent，前一阶段卡在“怎么把工具接进去”；下一阶段真正卡住的，往往是“工具接太多以后，Agent 反而更笨了”。

最近几篇公开实践把这个问题讲得很清楚。Anthropic 在 advanced tool use 里给了一个很直观的数字：只是 5 组常见工具服务器，定义信息就可能先吃掉 5 万多 token；他们还提到，内部见过工具定义在任务开始前就占掉 13 万多 token。问题不只在贵，还在乱：工具名字相近、描述模糊、返回太肥，都会让 Agent 选错工具、传错参数，或者把中间结果塞爆上下文。

一句话：当 Agent 进入生产环境，瓶颈越来越不是“有没有工具”，而是“它能不能又快又准地找到、理解并调用正确的工具”。

3. 核心概念

第一，工具越多，不代表能力越强。对 Agent 来说，几十上百个工具如果没有分层和命名规则，很像把一整个五金仓库倒在桌上。

第二，工具搜索比工具全量加载更重要。Anthropic 的做法是只把少量高频工具常驻，把其余工具延迟加载，需要时再搜、再展开。这样不是砍能力，而是给 Agent 留出真正思考任务的上下文空间。

第三，工具描述本身就是提示词。写给程序员看的 API 说明，不一定写得适合 Agent。名称、边界、输入输出、什么时候该用、什么时候别用，都要更像在教一个新人上手。

第四，返回结果要“高信号、低噪音”。如果一个工具每次都把整页日志、整张通讯录、整批记录原样倒回来，Agent 就会把宝贵上下文浪费在搬运和筛垃圾上。更好的方向是搜索、过滤、聚合后再返给模型。

第五，工具也需要评测。Anthropic 在多智能体研究系统里提到，他们甚至让 Agent 反过来测试和改写工具描述；优化后，后续任务完成时间下降了 40%。这说明工具不是接上就完，而要持续调教。

4. 可复用方法

如果你想给现有 Agent 补一层“工具导航”，可以直接用这套五步法：

1）先列出当前工具，按“常用 / 低频 / 高风险”分层，不要默认全部常驻。  
2）给工具重命名和加命名空间，比如按系统、对象、动作来写，避免一堆含糊的 query、manage、update。  
3）把大而全工具改成更贴任务的高层工具，比如别只给 list_contacts，优先给 search_contacts、message_contact。  
4）控制返回格式：默认 concise，需要时再 detailed，并给错误信息可修复提示。  
5）每周抽 10 个真实任务做小评测，记录：是否选错工具、是否参数出错、是否返回太肥、是否有重复调用。

5. GenGrowth 可以怎么用

这件事对 GenGrowth 很实用。

- 做内容生产时，不要让 Agent 同时看见所有抓取、发布、归档、统计工具；先按“找资料—写草稿—待审批—归档”分层开放。  
- 做增长自动化时，把“搜索线索”“读取 CRM”“生成跟进草稿”“真正发送”拆成边界清楚的工具，而不是一个什么都能改的大接口。  
- 做知识库沉淀时，优先给“按主题找资料”“取最近更新”“输出摘要”这类高信号工具，而不是把整库全文直接灌回上下文。  
- 做多 Bot 协作时，可以把高频 SOP 做成更高层工作流工具，减少每次从底层原子工具重新拼装。

6. 今日行动

今天就挑你手里接了 10 个以上工具的 Agent，做一个 30 分钟小体检：删掉 20% 最少用、最模糊、最重复的工具；再挑 3 个最关键工具，重写名称、描述和返回格式。目标不是“工具更多”，而是让它下次少走弯路、少吃上下文、少犯低级错误。

7. 参考来源

- Anthropic｜Introducing advanced tool use on the Claude Developer Platform  
https://www.anthropic.com/engineering/advanced-tool-use
- Anthropic｜Writing effective tools for AI agents — with agents  
https://www.anthropic.com/engineering/writing-tools-for-agents
- Anthropic｜How we built our multi-agent research system  
https://www.anthropic.com/engineering/multi-agent-research-system
- Vercel｜Ship AI 2025 recap  
https://vercel.com/blog/ship-ai-2025-recap
