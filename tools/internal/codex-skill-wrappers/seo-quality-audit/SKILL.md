---
name: seo-quality-audit
description: |-
  SEO 输出质量评审 worker。依据 `docs/05-governance/people-ops/policies/2026-05-11-seo-output-quality-rubric.md` 给单个评审对象出强模板报告。**禁止直接调用**——必须由入口命令 `/perf-audit-seo` 在拿到 wzb 明确确认后、并传入 HANDSHAKE token 才能触发。主 Claude 不要绕过入口命令直接派遣本 agent。
---

# seo-quality-audit

This is a Codex wrapper for a project resource-map entry.

When this skill is triggered:

1. Read the source file: `/Users/lynne/gengrowth-wiki/.claude/agents/seo-quality-audit.md`
2. Follow its role, workflow, constraints, and trigger rules.
3. Also follow the GenGrowth wiki instructions in `AGENTS.md`, especially Chinese output, record writing, and document routing rules.

Trigger hint: seo-quality-audit, agent, role-specific GenGrowth work
