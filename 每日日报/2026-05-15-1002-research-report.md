---
title: "Searching for public sources on evals for LLM/agent systems and practical evalua…"
date: 2026-05-15-1002
updated: 2026-05-15
type: daily-digest
source: slack
channel: gengrowth-research-reports
channel_id: C0AKT2PQLMN
slack_ts: "1778810538.119979"
session: learning
status: captured
topics:
  - "ai-learning"
  - "agent-workflow"
  - "workflow-design"
  - "seo"
  - "ai-seo"
entities:
  people: []
  companies:
    - "OpenAI"
    - "Anthropic"
  products: []
tags:
  - "daily-digest"
  - "research-report"
  - "slack-sync"
  - "learning-note"
related:
  - "[[AI 深度学习]]"
  - "[[Agent Workflow]]"
  - "[[Workflow Design]]"
aliases:
  - "2026-05-15 Searching for public sources on evals for LLM/agent systems and practical evalua…"
summary: "同步自 Slack 的Searching for public sources on evals for LLM/agent systems and practical evalua…，用于 GenGrowth 本地知识库检索、主题聚合和后续 gbrain/wiki 关联。"
---

# Searching for public sources on evals for LLM/agent systems and practical evalua…

> 同步来源：Slack `#gengrowth-research-reports`；发送时间：2026-05-15 10:02（UTC+8）。

Searching for public sources on evals for LLM/agent systems and practical evaluation methods.
to=web_search  天天买彩票  大发快三计划":"{\"query\":\"site:[openai.com](http://openai.com) eval-driven development LLM agents OpenAI cookbook evaluation guide\", \"max_results\": 5, \"search_depth\": \"advanced\"}"} code  omitted
to=web_search  天天中彩票怎么买json
{"query":"site:[openai.com](http://openai.com) eval-driven development LLM agents OpenAI cookbook evaluation guide","max_results":5,"search_depth":"advanced"}
今天读什么｜别再凭感觉改 Prompt：给 Agent 建一套“回归样本集”

1. 适合谁读 / 预计阅读时间

适合正在做 AI 内容生产、研究摘要、销售线索整理、SEO 工作流、知识库问答、内部 Bot 自动化的人读。  
预计阅读时间：8–10 分钟。

2. 为什么值得读

很多团队做 AI 自动化时，最常见的工作方式是：改一句提示词，跑两个例子，感觉顺了，就上线。问题是，AI 系统不是普通模板工具，它会同时受模型版本、提示词、工具调用、上下文质量、输出格式影响。你今天改好了一个例子，明天很可能把另外十个例子改坏。

所以，真正决定一个 Agent 能不能进入稳定生产，不是“它偶尔表现多惊艳”，而是“你能不能持续知道它有没有变好”。这也是最近越来越多 AI Builder、Agent 团队强调的一件事：在复杂自动化之前，先建立评估机制。

说白了，传统软件有测试用例，AI 工作流也要有自己的“测试集”。没有它，所有优化都只能靠感觉；有了它，你才知道该换模型、改提示词，还是该补上下文、拆步骤、加人工审核。

3. 核心概念

第一，什么叫“回归样本集”？  
就是你从真实业务里挑出一批代表性任务，作为固定测试题。比如 30 条客户线索、20 篇竞品页面、15 份访谈摘要、10 组 SEO 聚类任务。以后每次改系统，都拿同一批题重新跑一遍，看结果是更好还是更差。

第二，评估不只看“答得像不像”，还要看“能不能用”。  
对增长团队来说，漂亮不重要，可执行才重要。所以评估标准最好分层：  
- 格式对不对  
- 关键信息有没有漏  
- 事实有没有明显错误  
- 输出能不能直接进入下一步动作

第三，要区分“结果指标”和“过程指标”。  
结果指标是最后答案好不好；过程指标是中间有没有跑偏，比如是否漏调工具、是否超出字数、是否没有按 schema 输出、是否反复重试。这些过程问题，往往比答案本身更容易稳定优化。

第四，失败不是坏事，无法分类的失败才是坏事。  
如果你每次都只说“这次不太行”，系统永远学不会。更好的做法是给失败打标签：漏字段、事实错、过度延伸、没抓重点、格式错、行动建议空泛。失败一旦能分类，优化就有方向了。

4. 可复用方法

一个很实用的做法，是用 5 步搭一套轻量评估流程。

第 1 步：先收集真实样本，不要自己编题。  
从最近一周或两周的真实任务里选 20–50 条。样本越贴近真实工作流，评估越有意义。

第 2 步：先定义“好结果”长什么样。  
不一定要有完美标准答案，但至少要写清楚：必须包含什么、不能出现什么、输出给谁用、下一步动作是什么。

第 3 步：给任务分档，不要混着评。  
把任务分成简单、普通、复杂三类。否则一个 prompt 可能对简单任务很好，对复杂任务持续翻车，但平均分看不出来。

第 4 步：每次只改一个变量。  
要么改模型，要么改提示词，要么改工具流程。千万别一次改三样，不然你根本不知道是哪一步起了作用。

第 5 步：把“返工率”当成关键指标。  
对业务团队最重要的，往往不是模型分数，而是人还要不要大改。如果一套输出看起来不错，但每次都要人工重写 40%，它就还不是可规模化的流程。

5. GenGrowth 可以怎么用

这个方法非常适合 GenGrowth 当前几类典型场景。

第一，研究报告生成。  
把过去 20 篇“可发”和“不可发”的日报样本拉出来，检查标题是否清楚、结构是否完整、是否真的给出方法和行动，而不只是信息搬运。

第二，SEO / GEO 内容工作流。  
给关键词聚类、SERP 摘要、文章大纲、FAQ 生成分别做样本集，判断输出是否重复、是否偏题、是否缺少搜索意图。

第三，销售线索和客户研究。  
针对线索分类、ICP 匹配、客户访谈整理，建立固定评估题库，重点看“结论是否可用于下一步触达”，而不是只看文字是否顺。

第四，Bot 自动化与知识库问答。  
不要只测“答不答得出来”，要测“有没有引用到正确上下文”“有没有把旧信息当新信息”“有没有输出错误动作建议”。

6. 今日行动

今天就可以做一个最小版本：

1）从最近 7 天挑 20 条真实 AI 任务；  
2）按“输出格式、关键信息、可执行性、返工量”做一个四列表；  
3）把每条任务分成简单 / 普通 / 复杂；  
4）用当前版本先跑一遍，记录问题标签；  
5）以后每次改 prompt、模型或 workflow，都先过这 20 条再上线。

如果只能做一件事，那就先停止“凭两个成功案例就判断系统变好”的习惯。对 Agent 来说，稳定胜过惊艳；对增长团队来说，可复用胜过偶发高光。

7. 参考来源

- Anthropic｜Building effective agents  
  https://www.anthropic.com/engineering/building-effective-agents

- OpenAI Docs｜Evals 指南  
  https://platform.openai.com/docs/guides/evals

- LangSmith Docs｜Evaluation  
  https://docs.smith.langchain.com/evaluation

- Promptfoo Docs｜Evaluate LLM Apps  
  https://www.promptfoo.dev/docs/guides/evaluate-llm-apps/
