---
title: Miraa Hook 规则加载与重写最小修复
project: astrologywiki
type: workflow-change-proposal
status: blocked_pending_pm_or_hermes_apply
owner: Pengman
created: 2026-08-17
scope: Miraa candidate Hook only
content_generation_performed: false
---

# Miraa Hook 规则加载与重写最小修复

## 问题

Social OS 现在能生成 Miraa 候选，但候选 Hook 生成时没有实际加载总 Skill 的 **§8.1「Pengman 的 Hook 与白纸重写偏好」**。

因此它会把候选标题或调研场景直接改写成英文句子，而不是按 Pengman 已确认的 Hook 写法生成。

## 本次只做两件事

### 1. 写 Miraa 候选 Hook 时，读取最新 §8.1

目标文件：

`/Users/awayer_mini/gengrowth-ops/inbox-pengman/skills/astrologywiki-social-workflow/SKILL.md`

对 `@miraaastrology` 的候选 Hook 生成，在现有 `research` 上下文中增加：

```yaml
- "8.1 Pengman 的 Hook 与白纸重写偏好"
```

每次生成时都直接读取该章节的当前内容。Pengman 后续修改 §8.1 后，下一次生成自动使用新版，不需要手动同步配置、重启工具或重复发送长 Prompt。

若该章节不存在或无法读取，直接提示“无法加载 Miraa Hook 规则”，本次不生成 Hook；不要静默使用旧缓存或自行猜测。

不需要加载：

- 全部历史生产记录；
- 偏好档案；
- 竞品全文；
- Humanizer；
- 额外 Hash、长 trace 或加载证明。

这些内容可以等基础生成跑稳后再按需增加。

### 2. 支持安全地重写现有 H3 候选 Hook

增加两个简单动作：

1. `preview-hook-rewrite`：根据最新 §8.1，为 Pengman 指定的候选显示新 Hook 预览；不写表。
2. `apply-hook-rewrite`：只在 Pengman 确认后，把预览中的新 Hook 写入表格。

限制：

- 只处理 Pengman 明确指定的 `content_id`；
- 只处理 `@miraaastrology` 且尚未人工选择的 H3 候选；
- 已 `dropped`、已选择或已进入生产的内容不修改；
- 只改 `hook` 字段；不改 title、angle、证据、`selection_status`、`content_stage`、脚本、排期或生产记录；
- 不自动把候选标记为通过、删除或选中，最终决定仍由 Pengman 做。

## 验收

彪哥修改后，只需确认两件事：

1. 修改 §8.1 后，下一次 Miraa Hook 生成会采用新规则；
2. 预览和确认写回均只改指定候选的 `hook` 字段。

本提案不修改 Google Sheet、现有候选、Skill 或生产记录；需要 PM / Hermes 维护角色实施。
