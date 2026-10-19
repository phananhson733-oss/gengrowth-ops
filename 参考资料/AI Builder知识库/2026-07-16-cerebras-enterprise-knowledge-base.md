---
title: Cerebras 企业知识库：多源检索、证据融合与 Agent 编排
date: 2026-07-16
updated: 2026-07-16
type: knowledge-note
source: https://www.cerebras.ai/blog/how-we-built-our-knowledge-base
source_signal: https://x.com/cerebras/status/2077822555159945507
author: Isaac Tai、Daniel Kim、Mike Gao
publisher: Cerebras
tags:
  - ai-builder
  - enterprise-knowledge-base
  - rag
  - retrieval
  - slack
  - agent
  - mcp
  - rerank
  - cocoindex
---

# Cerebras 企业知识库：多源检索、证据融合与 Agent 编排

## 一句话结论

Cerebras 的关键选择不是把企业信息迁到“唯一真相库”，而是在数据原处采集、用统一 schema 入库，并通过全文、向量、IDF、时效与 RRF 融合给 Agent 提供可追溯检索原语。

## 来源与证据边界

- 第一方全文：<https://www.cerebras.ai/blog/how-we-built-our-knowledge-base>
- X 传播入口：<https://x.com/cerebras/status/2077822555159945507>
- X Article：<https://x.com/i/article/2077808214062825472>
- 证据等级：直接内容；本文依据 Cerebras 官方技术文章，X 帖只作传播信号。
- 该案例是单家公司内部实践；没有公开端到端准确率、延迟、成本及完整权限实现，不能当作通用性能结论。

## 可复用架构

### 1. 数据不搬家，检索层统一

信息仍留在 Slack、GitHub、Jira、文档与自定义数据库。每个数据源只需声明数据内容、连接方式与抓取频率，产物统一写为 embedding、原始摘要与 metadata 的标准行，进入同一 Postgres 查询面。

知识库的三个职责：

1. 采集与存储内部数据。
2. 提供查询能力。
3. 执行认证、授权、审计与分析。

### 2. Slack 的四路检索

Slack 线程不是简单嵌入原文：

- **全文检索**：错误码、参数名、主机名等需要精确匹配的词。
- **Embedding**：不同说法之间的语义关联。
- **IDF**：让稀有 token 压过礼貌性噪声。
- **Age decay**：相近答案中优先最近的基础设施事实。

更新事件经 Socket Mode 实时进入；系统按稳定事件 ID 去重，再重新拉取整条线程及所有回复，确保上下文、参与者与最后活跃时间完整。

### 3. 线程蒸馏与 burst

LLM 把线程标准化为 question、summary、resolution、systems、code_refs。连续同作者消息还可作为 burst 独立检索，但必须通过信号门槛：稀有 token、至少 200 字符、且带有反应信号。

这是“保留全线程”与“让关键局部可检索”并存的折中，而非简单把每条消息拆成孤立 chunk。

### 4. 代码与自定义数据源

代码使用 CocoIndex，根据语言结构由 class 到 method 再到更小 block 递归切分；每次提交只增量更新改动块。自定义来源以插件脚本接入，只要输出同一 schema，就能被统一查询，无需为每种数据源重建检索层。

### 5. Query planner + 工具 fan-out + 证据融合

查询先做轻量规划，根据问题与项目范围选择 `search`、`search_slack`、`search_code`、`recent_prs`、`who_knows` 等工具。多个候选列表以 RRF 融合（文中 K=60），再去重、限制单文件占比、以 LLM reranker 选 Top 10，并补回邻近段落。

MCP 只暴露稳定的检索原语；Agent 负责工具选择和答案编排。这样检索层可低成本、可审计，也不会被某个“万能问答接口”锁死。

## 对 GenGrowth 的执行启发

- 为公开情报、日报、文档、项目代码和协作信息建立统一证据 schema，再补连接器。
- 对协作消息保留完整 thread，并产出可检索的 question/summary/resolution；不要只存片段 embedding。
- 将 lexical、semantic、freshness、rerank 拆开观测；用坏例回归，而不是只调单一向量参数。
- 以业务项目/权限范围限制默认检索空间，避免把所有公司知识混搜。
- 把“最近变更、专家定位、代码搜索、知识检索”作为组合工具提供给 Agent。

## 参考

- Cerebras 原文：<https://www.cerebras.ai/blog/how-we-built-our-knowledge-base>
- CocoIndex：<https://cocoindex.io/>
- RRF：Cormack、Clarke、Büttcher，SIGIR 2009。
- Anthropic Contextual Retrieval：<https://www.anthropic.com/news/contextual-retrieval>
