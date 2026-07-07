---
title: Claude《Getting started with loops》：把 loop 从口号压到可执行分层
date: 2026-07-07
updated: 2026-07-07
type: knowledge-note
source: https://claude.com/blog/getting-started-with-loops
source_signal: https://x.com/trq212/status/2074209928961819081?s=20
author: Delba de Oliveira；Michael Segner
publisher: Claude by Anthropic
tags:
  - ai-builder
  - agent-engineering
  - loop-engineering
  - claude-code
  - goal
  - schedule
  - gengrowth
aliases:
  - Getting started with loops
  - Claude Loop 入门
  - Claude Code Loop 分层框架
---

# Claude《Getting started with loops》：把 loop 从口号压到可执行分层

## 来源

- 官方文章：<https://claude.com/blog/getting-started-with-loops>
- X 传播信号：<https://x.com/trq212/status/2074209928961819081?s=20>
- 作者：Delba de Oliveira、Michael Segner
- 归档时间：2026-07-07
- 证据等级：官方文章正文为 direct-content；X 分享贴为 partial-content，仅作为传播层信号。

## 一句话结论

这篇文章最有价值的，不是再次喊“不要只写 prompt，要设计 loop”，而是把 loop 压成四个可执行层级：手动回合、目标驱动、时间驱动、主动式复合循环。这样团队讨论 agent 时，就不再只停留在概念，而能直接落到“把什么交给系统”。

## 我直接拿到的内容

### 1. Claude 对 loop 的定义

官方定义很清楚：**loop 是 agent 重复执行工作循环，直到满足停止条件。**

这个定义有两个重点：
1. loop 不是“永远继续”，而是“重复直到停条件成立”；
2. 真正需要设计的，不只是 prompt，而是触发、验证、停止和回退边界。

### 2. 四类 loop 分层

| 类型 | 你交出去的东西 | 适用场景 | 官方原语 |
| --- | --- | --- | --- |
| Turn-based | 验证步骤 | 还在探索、边做边判断 | 手工回合 + Skill 化验证 |
| Goal-based | 停止条件 | 已知“做成什么样算完成” | `/goal` |
| Time-based | 触发器 | 同一类工作按周期重复发生 | `/loop`、`/schedule` |
| Proactive | 整个提示与工作流 | 工作持续发生、且可稳定自动接力 | 上述原语组合 + workflow |

这个分层的价值是：它把“agent 自主性”拆成四种不同交付边界，而不是混成一个大词。

### 3. 官方强调的三条实操原则

1. **先从最简单的 loop 开始。** 不是所有任务都要上复杂自治系统。
2. **验证要尽量编码。** 如果人工复查步骤能写成 Skill 或检查项，agent 才能更稳定自证。
3. **停止条件越确定，loop 越可靠。** 例如分数阈值、测试通过数、固定预算上限，都比“差不多好了”更适合自动化。

### 4. 文章给出的典型例子

- Turn-based：改一个 like button，然后把人工验收动作写进 SKILL.md。
- Goal-based：`/goal get the homepage Lighthouse score to 90 or above, stop after 5 tries.`
- Time-based：`/loop 5m check my PR, address review comments, and fix failing CI`
- Proactive：按小时巡检反馈频道，发现 bug 后继续 triage、修复、回复，并可组合并行工作流。

## 关键判断

### 1. 这篇文章把 Loop 和 Harness 的关系讲得更实用

如果说 Harness 解决的是“单次任务怎么跑得可验证”，那这篇文章解决的是“这类任务怎么持续发生并自动接力”。它不是替代 Harness，而是在 Harness 之上再加目标、触发和收束层。

### 2. 它把“自主性”翻译成了更适合产品化的配置面

这篇文章真正可迁移的不是 Anthropic 自己的命令，而是三种可配置对象：
- **验证**：怎么判真完成
- **停止条件**：什么时候别再跑
- **触发器**：什么时候自动醒来

对产品和交付来说，这比泛泛谈 Agent Autonomy 更容易落地。

### 3. 对 GenGrowth / Hermes 最有价值的是映射关系

可以直接映射成我们自己的闭环语言：

| Claude 框架 | GenGrowth / Hermes 对应 |
| --- | --- |
| Turn-based | 技能化验收、browser/terminal 自测、maker-checker |
| Goal-based | Kanban `goal_mode`、长任务验收标准、停止预算 |
| Time-based | cronjob、日报/情报巡检、定时工作流 |
| Proactive | cron + Kanban + skills + reviewer 组合闭环 |

也就是说，我们缺的不是“有没有 loop”，而是把这些零件统一讲清楚。

## 对 GenGrowth 的启发

1. 可以补一张《GenGrowth Agent Loop 分层图》：把 cron、Kanban、skills、reviewer、records 放进同一张方法图里。
2. 做自动化时，先问三个问题：谁触发、谁验收、谁决定停。
3. 高价值落地方向不是“让 agent 一直跑”，而是先把低风险、可验证、周期性任务做成 time-based 或 goal-based loop。
4. 对外内容上，这篇文章适合和既有的 Loop Engineering、Harness Engineering 笔记串起来，形成更完整的“Agent 交付系统”主题链路。

## 相关笔记

- [[Loop Engineering详解：把反馈循环放进工程现场]]
- [[Codex /goal 实现拆解：长任务 Agent 不只是多跑几轮]]
- [[X Article：Loops: What Every AI Engineer Needs to Know in 2026]]

## 备注

本次从用户给的 X 链接出发，发现该帖本身只是简短传播层，核心内容实际指向 Claude 官方博客文章。后续若要做更深沉淀，优先沿“Loop × Harness × Goal × Verification”继续并链，不必单独围绕这条转发帖扩写。