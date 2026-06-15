---
title: Codex /goal 实现拆解：长任务 Agent 不只是多跑几轮
date: 2026-05-14
updated: 2026-05-14
type: knowledge-note
source: https://mp.weixin.qq.com/s/7vqPgUmfrpIHtf__Z4M_KA
author: 若飞
publisher: 架构师
tags:
  - ai-builder
  - agent-engineering
  - codex
  - long-running-agent
  - harness
aliases:
  - Codex goal 长任务 Agent
  - 长任务 Agent 目标状态机
---

# Codex /goal 实现拆解：长任务 Agent 不只是多跑几轮

## 来源

- 原文：<https://mp.weixin.qq.com/s/7vqPgUmfrpIHtf__Z4M_KA>
- 标题：Codex /goal 实现拆解：长任务 Agent 不只是多跑几轮
- 作者：若飞
- 公众号：架构师
- 保存时间：2026-05-14 23:27

## 一句话结论

Codex `/goal` 的核心价值不是让 Agent 多跑几轮，而是把长期目标变成运行时里的状态对象，让继续、暂停、恢复、完成、预算耗尽都有明确边界、状态记录和审计要求。

## 关键观点

1. 普通 loop 解决“别停下来”，`/goal` 解决“跨多轮后目标还认不认得自己”。
2. `/goal` 可以拆成三层：目标持久化、运行时生命周期、完成审计与预算收束。
3. 长任务 Agent 的风险不只是停止，而是把目标缩小、把局部进展包装成完成、把预算耗尽包装成胜利。
4. 完成判断必须基于当前 worktree、测试、日志、PR 状态、命令输出等证据，而不是只靠聊天记忆或模型自述。
5. budget limit 不是失败态，而是收束态：停止新工作，整理进展、剩余事项、阻塞和下一步，确保可接手。
6. 未来 Agentic Engineering 的关键能力，是把“长任务”翻译成“运行时对象”：目标有状态机，完成有审计，停止有模板。

## `/goal` 的三层结构

| 层次 | 作用 | 对长任务的意义 |
| --- | --- | --- |
| 目标持久化 | 目标进入 thread/state-db，具备状态、预算、token 和 wall clock 记账 | 避免目标只活在 prompt 或聊天记忆里 |
| 运行时生命周期 | 通过 TurnStarted、ToolCompleted、TurnFinished、ThreadResumed 等事件同步目标状态 | 让继续、暂停、恢复、中断都有系统边界 |
| 完成审计与预算收束 | continuation prompt 要求逐项验证；budget_limit 模板要求到点收束 | 防止“差不多完成”和“预算耗尽还硬跑” |

## 可迁移到 Hermes / GenGrowth Agent Team 的设计启发

### 1. 目标要成为系统对象

不要只把目标放在 prompt 里。长期任务应有：

- 目标名称
- 状态：active / paused / complete / budget_limited / blocked
- 预算：token、时间、运行次数
- 责任人或 assignee
- 当前证据与产物路径
- 下一步恢复入口

这和 GenGrowth 当前 Kanban 多 Bot 协作是一条线：任务卡不只是待办事项，而应该成为跨 Agent 的运行时目标对象。

### 2. 完成要变成审计，不是开关

Agent 不能只说“已完成”。更可靠的完成回执应包含：

- 原始目标与验收标准
- 每项要求的完成状态
- 证据：文件、命令、测试、截图、链接、日志
- 未验证点
- 风险与下一步

这可用于优化 Kanban worker 的 `kanban_complete(summary, metadata)` 规范。

### 3. 停止也要有模板

预算耗尽、中断、阻塞时，不应让 Agent 静默结束，也不应硬继续。需要固定收束模板：

- 已完成什么
- 已验证什么
- 剩余什么
- 阻塞在哪里
- 下一个 Agent 或人从哪里接手

这适合沉淀为 GenGrowth BotOps / Kanban worker 的通用运行规范。

## 对 AI Builder 日报的可用摘要

Codex `/goal` 的意义不只是内置 Ralph loop，而是把长任务 Agent 的“目标”提升为运行时对象：目标有状态、过程有记账、完成要审计、预算到了要收束。它提醒我们，Agentic Engineering 的重点不是同时开更多 Agent，而是给 Agent 搭一个可验证、可恢复、可交接的工作现场。

## 相关链接

- OpenAI Codex `/goal` 官方用例：<https://developers.openai.com/codex/use-cases/follow-goals>
- OpenAI Codex `goals.rs`：<https://github.com/openai/codex/blob/main/codex-rs/core/src/goals.rs>
- Karpathy Sequoia Ascent 2026 summary：<https://karpathy.bearblog.dev/sequoia-ascent-2026/>
- Martin Fowler Harness engineering：<https://martinfowler.com/articles/exploring-gen-ai/harness-engineering.html>

## 归档判断

- 归档类型：AI Builder / Agent Engineering 知识素材
- 推荐用途：AI Builder 日报、GenGrowth Agent Team 设计、Kanban 长任务规范、BotOps 可接管性设计
- 后续可提炼为：`长任务 Agent 运行时目标对象设计规范`
