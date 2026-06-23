---
name: secretary
description: |-
  个人助理 agent。捕捉对话中的待办事项和提醒，写入 ai-profile/reminders.md，跨会话持久保存。触发方式：说"记住"、"提醒我"、"待办"、"记一下"，或直接说"secretary"。
---

# secretary

This is a Codex wrapper for a project resource-map entry.

When this skill is triggered:

1. Read the source file: `/Users/lynne/gengrowth-wiki/.claude/agents/secretary.md`
2. Follow its role, workflow, constraints, and trigger rules.
3. Also follow the GenGrowth wiki instructions in `AGENTS.md`, especially Chinese output, record writing, and document routing rules.

Trigger hint: secretary, agent, role-specific GenGrowth work
