今天读什么｜别把 MCP 当“工具插排”，要把它当 Agent 的能力总线

1. 适合谁读 / 预计阅读时间

适合正在做 AI Builder、内容生产自动化、知识库接入、多系统协作的人读。尤其适合已经开始给 Agent 接 Slack、飞书、Google Drive、GitHub、数据库，但很快遇到“工具一多就慢、就乱、就难管”的团队。  
预计阅读时间：8—10 分钟。

2. 为什么值得读

过去很多人理解 MCP，只停留在一句话：给 AI 接工具。这个理解不算错，但已经不够用了。

Anthropic 提醒：当 Agent 连上大量工具时，最大问题不是“能不能调”，而是**上下文会被工具定义和中间结果塞爆**。Cloudflare 则把远程 MCP、OAuth 授权、权限控制、状态休眠、长工作流一起推进。OpenAI 也已经把 MCP 和 Connectors 并进接口体系，并提供 `require_approval` 这类审批开关。

这说明 MCP 正在从“开发者玩具”变成“Agent 的外部能力层”。真正值得学的，不是又多了一个协议名词，而是：**怎么把资料、动作、权限、审批和多系统连接，组织成一套可控的能力总线。**

3. 核心概念

第一，**MCP 不只是工具目录。**  
它至少有三类东西：Tools 负责执行动作，Resources 提供上下文资料，Prompts 复用工作模板。很多团队把所有东西都做成工具，结果模型既要找资料、又要理解参数、还要决定动作，负担很重。

第二，**本地 MCP 和远程 MCP 是两种阶段。**  
本地更像个人工作台；远程 MCP 更像团队基础设施，能让网页、移动端、后台任务、定时工作流接入同一套能力。

第三，**“直接调工具”未必是终局。**  
当工具很多、链路很长时，让模型直接一轮轮调用工具，会反复把中间结果塞回上下文。更好的做法往往是：让模型写一小段代码或调用一个更高层工作流，由执行环境串起步骤，最后只把结果返回给模型。

第四，**认证不等于授权。**  
用户登录了，不代表 Agent 就该拥有全部能力。谁能读、谁能写、哪些动作必须人工批准，必须单独设计。

4. 可复用方法

如果你想把现有 Agent 接入方式升级一层，可以直接用这套五步法：

1）先按“用户目标”拆能力，不要按“系统全量 API”拆。  
不是把 Notion、飞书、HubSpot 整包暴露给模型，而是只给“搜资料、建卡、发草稿、回写状态”这些最小动作。

2）把只读资料和可执行动作分开。  
文档、知识库、字段说明、品牌规范，更适合做 Resources；真正会产生副作用的才做 Tools。

3）把高频 SOP 做成 Prompts。  
比如“生成周报”“整理会议结论”“给销售准备客户简报”，不要每次都靠人重新描述一遍。

4）当工具超过 20 个、或一件事需要串 3 步以上时，优先考虑工作流封装或代码执行层，而不是继续裸露更多工具。

5）给高风险工具补三件套：权限范围、审批开关、执行日志。

5. GenGrowth 可以怎么用

第一，用在内容生产。把竞品资料、过往选题、客户画像做成 Resources；把“日报整理、文章提纲、渠道改写”做成 Prompts；把发布、建任务、回写表格留给 Tools。

第二，用在 AI Builder 交付。把设计规范、组件说明、现有页面、数据结构作为 Resources，把“生成落地页”“补状态页”“做评审清单”作为 Prompts，把真正改代码、提 PR、发预览作为 Tools，并加审批。

第三，用在增长自动化。把 CRM、邮件、表单、日历拆成不同权限边界的远程 MCP 能力，而不是塞给一个“大而全增长机器人”。

6. 今日行动

今天就做三件小事：  
1）把你现有 Agent 接入项分成三类：资料、模板、动作。  
2）挑一个最常重复的流程，重写成“Resource + Prompt + Tool”的结构。  
3）找出一个高风险动作，补上显式审批和执行日志。

7. 参考来源

- Anthropic｜Code execution with MCP: Building more efficient agents  
https://www.anthropic.com/engineering/code-execution-with-mcp
- Model Context Protocol｜Architecture overview  
https://modelcontextprotocol.io/docs/learn/architecture
- Cloudflare｜Piecing together the Agent puzzle  
https://blog.cloudflare.com/building-ai-agents-with-mcp-authn-authz-and-durable-objects
- OpenAI API｜MCP and Connectors  
https://developers.openai.com/api/docs/guides/tools-connectors-mcp
