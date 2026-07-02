---
name: doc-audit
description: |-
  文档治理审计。扫描 wiki 中的文档错放、内容重叠、命名不规范、README 覆盖盲区等问题，输出清单和处理建议。触发方式：在对话中说"审计文档"或"doc audit"。
---

# doc-audit

This is a Codex wrapper for a project resource-map entry.

When this skill is triggered:

1. Read the source file at this logical project path: `gengrowth-wiki/.claude/agents/doc-audit.md`（在当前机器上解析，不要依赖固定的 /Users 绝对路径）
2. Follow its role, workflow, constraints, and trigger rules.
3. Also follow the GenGrowth wiki instructions in `AGENTS.md`, especially Chinese output, record writing, and document routing rules.

Trigger hint: doc-audit, agent, role-specific GenGrowth work
