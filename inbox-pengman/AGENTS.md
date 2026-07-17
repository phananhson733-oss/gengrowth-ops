---
title: Pengman Inbox Agent Rules
type: agent-ops
agent: ops
updated: 2026-07-16
---

# AGENTS.md - Pengman Inbox

This directory is Pengman's personal research and working-draft area inside the GenGrowth Ops workspace.

## Local Permissions

- Agents may read and write files under `~/gengrowth-ops/inbox-pengman/**`.
- For AstrologyWiki social-daily and daily-topic work, agents may read the related repo-local context needed for topic selection:
  - `~/gengrowth-ops/inbox-pengman/04-production/00-evergreen-workflows/astrologywiki-social-daily/SKILL.md`
  - `~/gengrowth-ops/inbox-pengman/04-production/00-evergreen-workflows/daily-content-assistant-sop.md`
  - `~/gengrowth-ops/inbox-pengman/05-调研资料/竞品研究/**`
  - `~/gengrowth-ops/inbox-pengman/04-production/05-weekly-published-content-digests/**`
  - `~/gengrowth-ops/inbox-pengman/04-production/06-daily-content-recommendations/**`
  - `~/gengrowth-ops/inbox-pengman/04-production/07-content-production/**`
  - `~/gengrowth-ops/tools/internal/skills/social-daily/SKILL.md`
- As of 2026-07-16, GSC input is paused. Do not read or request GSC exports from Downloads or repo-local folders unless Pengman explicitly re-enables this input in a later instruction.
- Agents may directly update research drafts, conversation handoffs, personal notes, and working plans in this directory when the user asks.
- Do not treat files here as final synced docs unless the user explicitly says so.

## Web Access

- Agents may use web/browser tools for any research task Pengman explicitly requests, including but not limited to: tool/platform comparisons, product research, competitor analysis, market research, workflow/SaaS evaluation, and general information lookup.
- For AstrologyWiki content-ops specifically: agents may use web/browser for daily topics, social-daily planning, trend-driven topics, X/TikTok/YouTube/Reddit research, news hooks, sports hooks, celebrity/public-figure hooks, or public AstrologyWiki article/page verification.
- Allowed public research includes current news, sports schedules and match context, celebrity/public-figure news, public social platform signals, Google Trends/Google News-style signals, public reference-account content, public AstrologyWiki pages, and public SaaS/tool documentation and pricing pages.
- Do not access private accounts, credentials, paid dashboards, unpublished internal data, unrelated workspaces, or private social-media sessions unless Pengman explicitly asks and grants access.
- For Route B timely hotspot topics, include the source links used for the trend/news/hotspot evidence.
- For Route A life-first topics, live web research is optional unless needed to verify an AstrologyWiki article/page link.

## Permission Gate for Daily Topic Documents

- Before creating or updating a daily-topic recommendation document, agents must first confirm they can access the required local inputs and, for Route B, public web/trend sources.
- For formal daily-topic recommendations, agents must include an `Evidence Preflight` section before recommendations, listing local files read, external sources checked, Route B source links, and unavailable/blocked inputs.
- The `Evidence Preflight` must include at least 3 relevant local paths, at least 4 current public external sources checked for Route B, and at least 3 Route B source links across at least 2 distinct hotspot candidates. If this minimum is not met, stop and report the blocker in chat.
- If any required input is blocked by permissions, missing, or unreadable, do not create a placeholder, conservative, or guessed daily-topic document.
- In that case, reply in the conversation only with:
  - which file/source/tool is blocked or missing
  - why it matters
  - what permission, file move, link, screenshot, or export Pengman can provide
  - whether a chat-only provisional answer is possible
- Only create the document after the required permissions or substitute inputs are available.

## Write Rules

- Keep formal company docs, synced directories, templates, content assets, onboarding, and task-collab changes out of this directory unless they are clearly proposals or drafts.
- If a change should become an official document outside `inbox-pengman/`, write it here as a proposal or handoff first.
- Preserve existing user notes and avoid unrelated cleanup while editing.

## Operating Style

- Continue from existing handoff notes when present; do not restart research from scratch.
- For research work, record current state, risk, recommendation, and next-step options.
- Keep platform and content research tied to the stated business goal, not vanity metrics.
