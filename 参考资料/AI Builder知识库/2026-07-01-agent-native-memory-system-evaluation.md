---
title: Agent-Native Memory System 评测框架：别再把 Agent Memory 当聊天记录仓库
date: 2026-07-01
updated: 2026-07-01
type: knowledge-note
source: https://x.com/Xudong07452910/status/2072158249911300394
author: Xudong Han
publisher: X / arXiv
tags:
  - ai-builder
  - agent-engineering
  - memory
  - agent-memory
  - evaluation
  - long-term-memory
  - data-systems
aliases:
  - Are We Ready For An Agent-Native Memory System
  - Agent-Native Memory System 论文
  - Agent Memory 评测框架
---

# Agent-Native Memory System 评测框架：别再把 Agent Memory 当聊天记录仓库

## 来源

- X 帖：<https://x.com/Xudong07452910/status/2072158249911300394>
- 论文标题：Are We Ready For An Agent-Native Memory System?
- arXiv：<https://arxiv.org/abs/2606.24775>
- PDF：<https://arxiv.org/pdf/2606.24775>
- 代码：<https://github.com/OpenDataBox/MemoryData>
- 论文列表：<https://github.com/OpenDataBox/awesome-agent-memory>
- 发布时间：2026-06-23（论文）/ 2026-07-01 11:20 CST 左右（X 帖）
- 保存时间：2026-07-01 15:30 CST

## 一句话结论

这条内容最值得保留的，不是“Agent 要有记忆”这个老结论，而是它把 Agent Memory 明确升级成一套 **数据管理系统**：不仅要能存和取，还要回答“怎么表示、怎么抽取、怎么路由、怎么维护”，并且要单独评估这些模块，而不是只看最后任务分数。

## 我直接拿到的内容

1. X 帖完整正文，明确强调：Agent memory 不再只是 RAG 或历史对话检索，而更像完整的数据系统。
2. arXiv 页面可直接核验论文标题、编号 `2606.24775`、学科分类与配套代码/论文列表链接。
3. 论文首页截图可直接看到：
   - 标题 `Are We Ready For An Agent-Native Memory System?`
   - 摘要核心论点
   - Figure 1 的四类典型 Agent Memory 工作流
4. arXiv HTML / PDF 摘要可直接核验：作者把 Agent memory system formalize 成四个模块 `⟨R, S, Q, U⟩`。

## 证据边界

- **高可信直接证据**：X 帖正文、论文标题、摘要、四模块框架、论文截图里的图示分类。
- **未逐页精读部分**：整篇论文的所有实验细节、12 个系统逐项对比表、各 benchmark 的完整数字，这次没有全量逐页摘录。
- **因此本笔记定位**：先保存为高可信的一手框架摘要，不冒充“全文精读版”。

## 关键观点

1. Agent Memory 已经不该被理解成“把聊天记录存下来，下次检索一下”。
2. 更准确的理解是：它是 Agent 在多轮执行中维护长期状态的基础设施，负责存储、抽取、检索、更新、合并和遗忘。
3. 这篇论文最重要的推进，不是再提一个 memory 新花样，而是把 memory system 拆成可单独分析的四个模块：
   - **R：Representation & Storage**（怎么表示和存）
   - **S：Memory Extraction**（怎么从交互/环境里抽取值得记的内容）
   - **Q：Retrieval & Routing**（怎么找到、怎么送到正确上下文里）
   - **U：Maintenance / Update**（怎么更新、合并、清理、遗忘）
4. 论文明确指出：**没有一种 memory 架构在所有任务里都最好。**
5. 真正的系统瓶颈并不统一：有的卡检索精度，有的卡更新正确性，有的卡长期稳定性，有的卡维护成本。
6. 所以未来强 Agent 不是单靠更长 context window，而是要有一套真正面向 Agent 的 memory system。

## 这篇论文比常见“记忆文章”更重要的地方

### 1. 它把 memory 从 feature 拉回 system

很多人讨论 memory，还停留在：

- 要不要存聊天记录
- 要不要上向量库
- 要不要做 RAG

但这篇论文问的是更系统的问题：

> [!tip] 真正的问题不是“记不记”，而是“这套记忆系统作为基础设施，长期运行时到底哪里会贵、会错、会漂、会失控？”

这就把问题从“提示词技巧”升级成“系统设计”。

### 2. 它开始单独评估 memory 本身，而不是只看最终任务分数

摘要里点得很清楚：过去很多评测只看 end-to-end task success，比如 F1、BLEU、任务是否完成。但这样会把 memory system 当黑箱。

问题是：

- 任务做成了，不代表 memory 设计合理
- 任务失败了，也不一定是 memory 本身的问题

所以它开始拆开问：

- 记忆表示是否靠谱？
- 检索是否找对？
- 更新是否把旧事实污染了？
- 长任务里会不会越跑越乱？
- 维护成本是否高得不值得？

这对产品和工程都更有用。

## 图里能直接读出来的核心框架

Figure 1 展示了 4 类典型 Agent Memory 工作流：

| 类型 | 大意 | 适合解决什么 |
| --- | --- | --- |
| Streaming Logs | 把交互、观察、轨迹按流式日志保存 | 先完整保留过程，便于回放与后续抽取 |
| Hierarchical Tiers | 分层记忆：核心/短期/长期/归档 | 管不同时效和容量的记忆 |
| Knowledge Graph | 用图结构保存实体、关系、时间演化 | 适合复杂关系、多实体长期状态 |
| Hybrid Memory System | 把抽取、路由、检索、维护拆开，接多种存储引擎 | 更像生产级系统拼装方案 |

这张图本身就说明一个方向：

> [!info] Agent Memory 不再只是“一个向量库 + 一个检索器”，而是越来越像多层存储 + 多模块编排的数据系统。

## 对 GenGrowth / Hermes / AI Builder 的启发

### 1. 记忆系统要单独设计“写入”和“维护”

现在很多 Agent 系统最容易忽略的是后半段：

- 什么时候该写入？
- 什么值得升格成长期记忆？
- 旧记忆什么时候该合并？
- 什么时候该忘掉？

真正难的不是“记住”，而是：

- 记什么
- 不记什么
- 何时更新
- 如何避免把过时记忆继续当事实用

这和 X 帖的总结完全一致。

### 2. 未来比较有价值的不是“更大上下文”，而是“更可治理的记忆”

对生产环境来说，单纯拉长上下文窗口有 3 个问题：

1. 成本高
2. 污染一起带进来
3. 旧信息会假装自己仍然有效

所以真正能落地的 Agent Memory，应该更强调：

- 生命周期
- 权限边界
- 更新机制
- 证据追溯
- 成本/收益权衡

### 3. Hermes / 多 Bot 系统可以借这篇论文补齐评测视角

这篇论文最值得借鉴给 Hermes 的，不一定是某个具体 memory backend，而是它的评测思路：

- 不只问“任务成功没”
- 还要问“memory 是否写对、找对、改对、忘对、花得值不值”

如果以后要系统比较 Hermes 里的 memory / skill / session / gbrain / archive 这些层，完全可以借这套角度做成内部 checklist。

## 和现有沉淀怎么连

### 1. 和 TencentDB Agent Memory 那篇是上下游关系

[[2026-05-15-tencentdb-agent-memory]] 更像“一个具体工程方案怎么做分层 memory”。

这篇论文则更像“你应该用什么维度来评估 memory system 到底设计得好不好”。

两篇配合起来看会更完整：

- Tencent 那篇回答：**可以怎么设计**
- 这篇论文回答：**应该怎么评估**

### 2. 和长期 Agent 工作流问题天然相连

它讨论的不是一次回答，而是长任务、多轮状态、动态更新、成本与稳定性。这和长期 coding agent、BotOps、研究 Agent、持续内容流水线都高度相关。

## PM 快读

一句话：这篇论文把 Agent Memory 从“外挂功能”重新定义成“数据系统”。它的最大价值不是再发明一个新 memory 名词，而是开始认真拆 memory 的四个环节，并指出没有万能架构，memory 的好坏取决于任务瓶颈、更新正确性、长期稳定性和维护成本。对做 AI Builder、长期 Agent、团队协作 Agent 的人，这个视角比单纯聊向量检索更重要。

## 对 AI Builder 日报的可用摘要

Xudong Han 分享了一篇很值得看的 Agent Memory 论文《Are We Ready For An Agent-Native Memory System?》。作者把 Agent Memory 从“聊天记录检索”升级成一套完整的数据管理系统，拆成四个模块：表示与存储、记忆抽取、检索与路由、维护与更新。论文最重要的结论不是某种架构赢了，而是没有万能 memory：不同任务会卡在不同瓶颈，有的卡检索，有的卡更新，有的卡长期稳定性，有的卡维护成本。对做长期 Agent、BotOps、AI Builder 工作流的人，这篇很值得留。

## 相关链接

- X 帖：<https://x.com/Xudong07452910/status/2072158249911300394>
- arXiv 摘要：<https://arxiv.org/abs/2606.24775>
- arXiv HTML：<https://arxiv.org/html/2606.24775v1>
- arXiv PDF：<https://arxiv.org/pdf/2606.24775>
- 代码：<https://github.com/OpenDataBox/MemoryData>
- 论文列表：<https://github.com/OpenDataBox/awesome-agent-memory>
- 相关已有沉淀：[[2026-05-15-tencentdb-agent-memory]]

## 归档判断

- 归档类型：AI Builder / Agent Memory / 评测框架 / 长期状态管理
- 推荐用途：AI Builder 日报、Hermes memory 设计讨论、长期 Agent 系统评估、memory 架构选型 checklist
- 后续可提炼为：`Agent Memory 评测维度清单`、`长期 Agent 状态系统设计原则`