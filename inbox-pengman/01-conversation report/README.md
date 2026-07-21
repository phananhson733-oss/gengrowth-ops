---
title: Conversation Report 使用说明
date: 2026-06-15
updated: 2026-06-15
owner: Pengman
type: index
status: active
---

# Conversation Report

这个文件夹用于保存 Pengman 与 AI 协作时需要跨对话延续的上下文。

## 使用方式

新对话开始或处理延续性任务时，优先读取：

- [[inbox-pengman/02-conversation report/current-context.md]]

主上下文只记录：

1. 稳定的工作目标和职责边界。
2. 用户已经明确确认的决定。
3. 当前重要文件和任务入口。
4. 尚未确认、会影响执行的问题。
5. 最近少量关键变化。

不记录：

- 聊天逐字稿。
- 已写入正式任务文档的大段重复内容。
- 临时讨论、无后续价值的细节。
- 密码、验证码、银行卡号等敏感信息。

## 更新原则

- 优先更新同一份 `current-context.md`，避免产生大量零散纪要。
- 只有职责、决策、文件位置或待确认事项发生实质变化时才更新。
- 已失效信息直接替换；仅在“最近关键变化”保留简短记录。
- 详细内容放在对应任务笔记，主上下文只保留摘要和 Wiki-link。

