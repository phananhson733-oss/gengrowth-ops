今天读什么｜别只让 AI Builder 把页面生成出来，还要给它一把“审美尺”

1. 适合谁读 / 预计阅读时间

适合正在用 AI Builder 做落地页、内部工具、客户后台、活动页、产品原型的人读。尤其适合经常遇到“功能都有了，但就是不够像正式产品”的团队。  
预计阅读时间：8—10 分钟。

2. 为什么值得读

现在很多 AI Builder 的难点，已经不是“能不能生成”，而是“生成以后怎么判断它到底好不好”。

功能还比较容易验：能不能打开、按钮能不能点、表单能不能提交。更难的是另一层：为什么同样能用的页面，有的像 demo，有的像真产品？为什么这版虽然改快了，却把层级、信任感和可操作性一起改坏了？

最近几篇公开材料给了一个很重要的方向：**不要只把 AI Builder 当生成器，要把它接进评测层。** OpenAI 强调，先定义成功，再写 skill；评测不是凭感觉，而是把一次运行、留下的轨迹、产物和一小组检查规则绑定起来。Anthropic 进一步指出，**主观质量也可以被部分结构化**。比如“这个页面好不好看”很难稳定判断，但“信息层级是否清楚、重点是否突出、状态是否完整、风格是否一致”这些可以写成评分标准。Vercel 也强调，AI 产品不是改一次 prompt 就完，而要把代码检查、人工反馈和模型评分重新喂回系统，持续防回退。

对 GenGrowth 这种要把 AI 生成结果真正交出去的团队来说，这件事很关键。**生成速度是第一步，稳定验收才是第二步。**

3. 核心概念

第一，**生成不是交付，验收才是第二接口。**  
第二，**功能分和审美分要分开打。** 功能分看可运行和关键状态，审美分看层级、可信感、视觉一致性、操作清晰度。  
第三，**别只看回答，要看结果状态。** 不是只看截图像不像，而是看用户是否真的能完成目标动作。  
第四，**生成者和评审者最好分开。** 同一个 Agent 既生成又自评，通常会偏乐观。  
第五，**评测集要从真实返工里长出来。** 最有价值的标准，往往来自“这次为什么被改”。

4. 可复用方法

如果你想马上给自己的 AI Builder 补一层“审美验收”，可以直接用这套五步法：

1）先只选一个页面、一个目标动作。  
2）先写 5 条硬标准：能打开、主按钮可点、表单校验正常、空状态/报错状态存在、移动端不乱。  
3）再写 4 条软标准：信息层级清楚、关键动作显眼、视觉风格一致、页面看起来值得信任。每条按 1—5 分评分。  
4）把生成和评审拆开：先让 Builder 出 2—3 版，再让另一个 Agent 或人工按表打分。  
5）把低分案例存下来，变成以后每次改 prompt、换组件、换模型都要重跑的小样本集。

一旦有了这张表，团队讨论就会从“我觉得不太对”变成“这一版的层级分和可信感分掉了”。

5. GenGrowth 可以怎么用

第一，把它做成 AI Builder 交付默认件：以后不只交预览链接，还附一张简版验收卡。  
第二，优先用在高影响页面：留资页、咨询页、方案页、CRM 录入页、内容发布后台。  
第三，把历史上“看起来靠谱”和“总被嫌像 demo”的页面各挑几张，做成自己的对照评测集。  
第四，把用户反馈、内部审稿意见、预览评语，逐步沉淀成固定 rubric。久了以后，GenGrowth 就不是“会生成页面”，而是“有自己质量标准的生成系统”。

6. 今日行动

今天就挑一个已经用 AI 生成过的页面：写 5 条硬标准、4 条软标准，让系统重出 2 个版本，再按同一张表打分。  
如果你今天能把第一张验收卡做出来，后面每一次生成就不再只是碰运气，而是在积累自己的质量基线。

7. 参考来源

- OpenAI Developers｜Testing Agent Skills Systematically with Evals  
  https://developers.openai.com/blog/eval-skills
- OpenAI Developers｜Build an Agent Improvement Loop with Traces, Evals, and Codex  
  https://developers.openai.com/cookbook/examples/agents_sdk/agent_improvement_loop
- Anthropic Engineering｜Demystifying evals for AI agents  
  https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents
- Anthropic Engineering｜Harness design for long-running application development  
  https://www.anthropic.com/engineering/harness-design-long-running-apps
