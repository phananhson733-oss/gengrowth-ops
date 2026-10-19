---
title: Karpathy《Software Is Changing (Again)》：Software 3.0 与部分自治产品
date: 2026-07-15
updated: 2026-07-15
type: knowledge-note
source: https://www.youtube.com/watch?v=LCEmiRjPEtQ
source_signal: https://x.com/0xMorlex/status/2077020262931877963/video/1
author: Andrej Karpathy
tags:
  - ai-builder
  - software-3
  - partial-autonomy
  - agent-engineering
  - verification
  - agent-native-infrastructure
  - gengrowth
aliases:
  - Software Is Changing Again
  - Software 3.0
  - 部分自治产品
---

# Karpathy《Software Is Changing (Again)》：Software 3.0 与部分自治产品

## 来源与证据

- 原始视频：<https://www.youtube.com/watch?v=LCEmiRjPEtQ>
- X 传播视频：<https://x.com/0xMorlex/status/2077020262931877963/video/1>
- 演讲者：Andrej Karpathy
- 视频约 96 分 58 秒。
- 证据等级：direct-content。已通过 NotebookLM 成功导入原始视频并完成中文问答；临时 notebook 已删除。

## 一句话结论

真正值得构建的不是“替人做完一切”的 Agent，而是**部分自治产品**：让 AI 负责生成，让人以极低成本验证；再通过自治滑块逐步扩大可信的自动执行范围。

## 四个关键判断

### 1. Software 3.0：自然语言成为新的编程界面

Karpathy 把显式代码称为 Software 1.0，把训练后的神经网络权重称为 Software 2.0；LLM 使自然语言 prompt 成为可编程接口，因此进入 Software 3.0。这里的关键不是“人人可以写一点代码”，而是软件的生产与操作界面都要为这种新计算机重写。

### 2. AI 产品的核心不是聊天框，而是专用界面与自治滑块

Cursor 被用作例子：人可以局部修改、文件级修改或放手让 Agent 在仓库内行动。产品应将这种不同风险层级显式化，并用 diff、预览、图形界面降低审核成本。

### 3. 真正的瓶颈是验证，不是生成

一次生成一万行代码并不代表效率提升，因为审核者仍需确认正确性与安全性。高质量 Agent 产品的目标是加快“生成—验证”闭环，并把结果变成可审计的中间产物。

### 4. Agent-native 基础设施需要被主动建设

面向人类的网页、文档和点击流程，不等于面向 Agent 可用。需要 Markdown / `llms.txt` / API、CLI、MCP 以及可摄取的代码库与知识库视图，让 Agent 不必靠脆弱的 UI 模拟完成工作。

## 对 GenGrowth / Hermes 的映射

| Karpathy 的概念 | GenGrowth / Hermes 当前实现 |
| --- | --- |
| 自治滑块 | cronjob、Kanban、goal_mode、人工确认门 |
| 生成—验证闭环 | maker-checker、preview gate、线上核验、回填对账 |
| Agent-friendly 表达 | Skills、AGENTS.md、结构化记录、GBrain、可读状态文件 |
| 部分自治产品 | 日报/情报/SEO 等低风险且可验证的自动化链路 |

## 风险边界

- LLM 有幻觉、参差不齐的智能、提示词注入与数据泄漏风险。
- 它没有天然的长期组织记忆；必须用文件、知识库、任务状态和显式上下文补足。
- “能跑起来”的 Agent demo 不等于生产可用。应优先小批次、可回滚、可验证、有人类升级出口的流程。
- Karpathy 的表述是“Agent 的十年”，不是短期内的完全自治承诺。

## 相关笔记

- [[Claude《Getting started with loops》：把 loop 从口号压到可执行分层]]
- [[Loop Engineering详解：把反馈循环放进工程现场]]
- [[Agent-native memory system evaluation]]
