---
title: TencentDB Agent Memory 拆解：把 Agent 记忆做成分层系统，而不是向量垃圾堆
date: 2026-05-15
updated: 2026-05-15
type: knowledge-note
source: https://github.com/Tencent/TencentDB-Agent-Memory
author: TencentDB Agent Memory Team
publisher: GitHub / Tencent
version: 0.3.4
tags:
  - ai-builder
  - agent-engineering
  - memory
  - long-term-memory
  - context-offloading
  - hermes
  - openclaw
  - sqlite
aliases:
  - TencentDB Agent Memory
  - 腾讯 Agent Memory
  - 分层 Agent 记忆方案
---

# TencentDB Agent Memory 拆解：把 Agent 记忆做成分层系统，而不是向量垃圾堆

## 来源

- 原文：<https://github.com/Tencent/TencentDB-Agent-Memory>
- 标题：Tencent/TencentDB-Agent-Memory
- 发布方：GitHub / Tencent
- 版本：v0.3.4
- 保存时间：2026-05-15 16:15

## 一句话结论

这个项目最值得看的不是“又一个 Agent Memory 插件”，而是它明确反对把历史对话粗暴切片后全塞进向量库，而是把记忆拆成“短期符号化压缩 + 长期分层沉淀”两套机制，并且已经给 OpenClaw 与 Hermes 都做了可落地接入。

## 关键观点

1. 他们把记忆问题拆成两类：单次长任务里的上下文爆炸，和跨会话长期经验沉淀；前者靠 context offload + Mermaid 画布，后者靠 L0→L3 分层记忆。
2. 长期记忆不是扁平日志，而是 **L0 Conversation → L1 Atom → L2 Scenario → L3 Persona** 的语义金字塔：越往上越抽象，越往下越保留证据。
3. 短期记忆不是直接摘要，而是把厚重工具日志卸载到 `refs/*.md`，中间保留步骤摘要 `jsonl`，顶层只注入一个 Mermaid canvas；Agent 需要细节时再靠 `node_id` 下钻恢复原文。
4. 他们强调“可追溯、可白盒调试”而不是黑箱记忆：Persona、Scenario、Mermaid canvas 都是人类可读文件，不是只能看相似度分数的黑盒向量命中。
5. 默认本地后端是 `SQLite + sqlite-vec`，主打 fully local、零外部 API 依赖；同时也预留远程 embedding、腾讯云向量库和独立 LLM/offload backend 的扩展位。
6. 这不是纯论文式概念稿，已经有 OpenClaw 插件形态，也提供 Hermes Docker 运行方案，说明它在 Agent 工程产品化上已经往前走了一步。

## 架构拆解

## 一、长期记忆：从聊天记录到 Persona

项目把长期记忆设计成四层：

| 层级 | 含义 | 作用 |
| --- | --- | --- |
| L0 Conversation | 原始对话 | 保留最底层证据，避免摘要丢失上下文 |
| L1 Atom | 原子事实 | 从对话中提炼可检索的结构化事实 |
| L2 Scenario | 场景块 | 把多个原子事实组织成任务/情境级模式 |
| L3 Persona | 用户画像 | 抽象出长期偏好、风格、目标与稳定约束 |

它的核心思想不是“记住更多”，而是“平时靠高层 Persona 指导，细节需要时再往下钻到 Atom 和原始对话”。这比把所有历史切碎扔进向量库更接近人类真正使用记忆的方式。

## 二、短期记忆：把长上下文压成可追溯符号图

针对长任务里的日志膨胀，它采用三层压缩：

| 层级 | 形态 | 作用 |
| --- | --- | --- |
| 底层 | `refs/*.md` 原始日志 | 完整保留工具输出、报错、搜索内容 |
| 中层 | `jsonl` 步骤摘要 | 保存步骤级结构索引 |
| 顶层 | Mermaid canvas | 在上下文里只保留高密度任务状态图 |

这里最重要的不是“压缩”本身，而是 **压缩后仍可恢复**。Agent 在上下文中只看轻量 Mermaid 结构；如果某个节点出错，再沿着 `node_id` 回查到底层原文。这种做法比一次性长摘要更适合复杂多步 Agent 任务。

## 三、它反对的对象：扁平向量记忆

项目的公开立场很明确：

- 反对把所有历史切成碎片后平铺进 vector store
- 反对不可逆的暴力摘要
- 反对只有召回结果、没有形成过程的黑箱记忆系统

它希望保留两件事：

1. **结构**：高层记忆要有语义层次，而不是一堆相似文本片段
2. **证据链**：任何 Persona、Scenario 或任务摘要，都能追溯到原始对话和原始日志

## 方案亮点与工程信号

### 1. 指标不只讲“能记”，也讲“更省 token”

README 给出的核心效果：

- WideSearch：成功率 33% → 50%，Token 下降 61.38%
- SWE-bench：成功率 58.4% → 64.2%，Token 下降 33.09%
- AA-LCR：成功率 44.0% → 47.5%，Token 下降 30.98%
- PersonaMem：准确率 48% → 76%

虽然这些数字仍需要独立复现，但至少说明他们不是只把 memory 当“体验 feature”，而是在把它作为长程 Agent 成本与成功率的共同优化器。

### 2. 本地优先，默认依赖很克制

从 `package.json` 和 README 看，默认路线是：

- Node `>=22.16.0`
- 本地存储：`SQLite + sqlite-vec`
- 中文检索：`@node-rs/jieba`
- 插件形态：OpenClaw plugin
- 兼容：Hermes Docker 方案

这意味着它不是先依赖云向量库和一堆 SaaS，再来谈 memory，而是先把本地最小闭环跑通。

### 3. 接入形态清晰

**OpenClaw：**

- `openclaw plugins install @tencentdb-agent-memory/memory-tencentdb`
- 配置 `enabled: true` 即可启用
- 若要启用短期压缩，需要打开 `offload.enabled`，并注册 `contextEngine` slot
- 额外 patch 一次 `after-tool-call` 消息钩子，保证工具输出可被卸载/恢复

**Hermes：**

- 提供 `Dockerfile.hermes` 路线
- 通过 `docker build` + `docker run` 可直接拉起 memory-enabled Hermes
- 默认示例模型是腾讯云 LKE 接口上的 `deepseek-v3.2`
- Gateway 健康检查走 `http://localhost:8420/health`

## 对 GenGrowth / Hermes / AI Builder 的启发

### 1. 记忆系统不该只有“召回”，还要有“形成过程”

大多数 Agent Memory 现在都只在意 recall：把旧内容塞进去，再在下一轮搜回来。但这个项目提醒了一点更关键的事：**记忆形成本身也要分层设计**。如果我们未来做 GenGrowth 的多 Bot 长程协作，应该区分：

- 哪些是原始记录
- 哪些是结构化事实
- 哪些是可复用场景
- 哪些才是稳定 Persona / SOP / Skill

### 2. 短期上下文压缩是 Agent 产品化刚需

对实际工作的 Agent 来说，最先爆掉的往往不是“长期记忆”，而是单次任务里的工具输出、网页抓取、报错日志、代码 diff。这套 Mermaid canvas + node_id 回溯思路，很适合 Hermes / BotOps / coding agent 长任务压缩。

### 3. 可白盒检查，比“记住了”更重要

如果一个 memory 系统不能让人类快速检查：它为什么记错、漏掉了什么、这条 Persona 从哪来，那它很难在团队环境里真正上线。这个项目把 Persona、Scenario、Canvas 都做成人类可读文件，这一点非常工程化。

### 4. 未来可以把 Skill 生成接到记忆分层之上

项目里已经明确提到下一步会把“技能生成”也做成分层：从执行轨迹和报错中抽共性模式，再提炼成可挂载 Skill。这个方向和 Hermes 当前的 skill/memory 双系统天然契合，值得继续跟。

## PM 快读

如果只看一句：TencentDB Agent Memory 的价值，不是“给 Agent 加个记忆库”，而是把 Agent 的记忆重新定义成一套可分层、可压缩、可追溯、可白盒调试的工作系统。对做 AI Builder、BotOps、长任务 Agent、团队协作 Agent 的人来说，这比单纯的 RAG 或向量召回更有产品启发。

## 对 AI Builder 日报的可用摘要

腾讯开源了 TencentDB Agent Memory，一个偏工程派的 Agent Memory 方案。它不走“历史切片 + 向量库”老路，而是把记忆拆成两层：短期任务用 Mermaid 画布压缩工具日志，长期经验用 L0 到 L3 的分层结构沉淀成事实、场景和 Persona；默认本地 `SQLite + sqlite-vec`，已支持 OpenClaw 插件和 Hermes Docker 接入。对做长程 Agent 和多 Bot 协作的人，这个方向比传统记忆库更值得看。

## 相关链接

- GitHub Repo：<https://github.com/Tencent/TencentDB-Agent-Memory>
- 中文 README：<https://raw.githubusercontent.com/Tencent/TencentDB-Agent-Memory/main/README_CN.md>
- OpenClaw：<https://github.com/openclaw/openclaw>
- Hermes：<https://github.com/NousResearch/hermes-agent>

## 归档判断

- 归档类型：AI Builder / Agent Memory / 长程上下文管理
- 推荐用途：AI Builder 日报、Hermes 记忆系统设计参考、多 Bot 长任务架构研究、Agent Persona / Skill 分层设计讨论
- 后续可提炼为：`Agent Memory 分层架构设计要点`