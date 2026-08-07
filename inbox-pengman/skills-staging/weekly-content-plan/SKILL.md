---
name: weekly-content-plan
description: Generate the weekly content plan for AstrologyWiki social accounts. Reads SOP, last week's plan/report, account playbook, competitor data, and produces a new week plan file. Use when the user says "建本周计划", "build weekly plan", or similar.
argument-hint: "[hours] [must-publish] [direction] [manager-notes]"
disable-model-invocation: true
user-invocable: true
---

# Weekly Content Plan Generator

## When to use

Use this when:
1. The user wants to create this week's content plan (周度内容计划).
2. The user says "建本周计划", "本周选题", "build weekly plan", or similar.
3. It is Monday (or the user is catching up from a missed Monday).

Do not use this when:
1. The user wants to execute/produce content from an existing plan — use daily execution flow instead.
2. The user wants a weekly report/retrospective — that is a different workflow.
3. The user only wants to evaluate a single hot topic.

## Inputs from user

Collect these before proceeding (ask if not provided):

| Parameter | Required | Example |
|-----------|----------|---------|
| hours | Yes | "22 小时" |
| must_publish | No | "miraaastrology 系列化视频" |
| direction | No | "Scorpio 心理系列" |
| manager_notes | No | Lynne's weekly priorities (paste) |

## Procedure

### Step 0: Determine week number

Calculate the current ISO week (YYYY-Www) based on today's date.

### Step 1: Evidence Preflight — Read all required files

You MUST read ALL of the following before generating any content. Do not skip or summarize from memory.

1. `inbox-pengman/04-production/00-evergreen-workflows/weekly-rolling-content-production-sop.md`
2. Previous week plan: `inbox-pengman/04-production/03-weekly-content-plans/` (latest file)
3. `inbox-pengman/04-production/01-strategy-and-platform-research/AstrologyWiki 社媒账号定位与内容路由 Playbook.md`
4. `inbox-pengman/05-account-assets/astrologywiki-account-assets.md`
5. Latest weekly report: `inbox-pengman/07-reports/` (latest `*weekly-report.md`)
6. Current production queue: scan `inbox-pengman/04-production/07-content-production/` for files with `content_stage` not yet `published`
7. Weekly published digest: `inbox-pengman/04-production/05-weekly-digests/` (latest)

From the account routing Playbook, extract the current `active_accounts` before allocating any content. Do not create quotas, Hot slots, candidates, or inventory tasks for paused, retired, or not-yet-activated accounts.

### Step 2: Internet Research Gate

Execute mandatory internet research:

1. Read competitor reference CSV:
   ```
   curl -sL "https://script.google.com/macros/s/AKfycbyunRIRkIyxEFRUIPstyKFPebAE2rBZB8CBFmoTWzJkhBl-ugAsakxHwZipbT4hTOgANg/exec"
   ```
   Record `checked_at` timestamp. If this fails, STOP and report — do not generate candidates.

2. Attempt Apps Script Library:
   ```
   https://script.google.com/macros/library/d/1XrKVy_7L_IJl_1Zc-9puY03e8RbvwDi7CQMEAL1uzaafW9Cfa32lRshg/3
   ```
   If login required, record `login_required` and continue.

3. Check at least 2 current public sources related to target accounts/topics (TikTok trending, competitor recent posts, etc.)

4. Read TikTok crawl data for context:
   ```
   curl -sL "https://script.google.com/macros/s/AKfycbyKsZCN5G8Ik-9bbh26GHPxfPflusxUy-13hNy9h-sb3qVdqf7KUoJZYvPTApapbKFS/exec?action=getData&sheet=post_history"
   ```

### Step 3: Generate week plan

Following the SOP Section 4 "周一：锁定组合、产能和 Batch", produce:

1. **Publishing This Week**: content from last week's inventory ready to publish
2. **Producing for Next Week**: new content to produce this week, constrained by stated hours
3. Active-account allocation, content pool mix (Evergreen/Predictable/Hot), Batch assignments
4. Unassigned flex capacity; only reserve a Hot slot when a current active account can legitimately carry it
5. Daily schedule (adjusted if starting late, e.g., Tuesday start)

Incorporate:
- `decision / next_test` from latest weekly report
- Manager notes (if provided) as priority constraints
- User's `must_publish` and `direction` as hard requirements

### Step 4: Write output file

Write the complete plan to:
```
inbox-pengman/04-production/03-weekly-content-plans/YYYY-Www 周度内容计划.md
```

Use the format from the previous week's plan file. Do NOT output the plan in conversation — write it to file only.

After writing, provide a brief summary (5 lines max) of:
- Total items planned
- Account distribution
- Key difference from last week
- Any blockers or missing inputs

## Output rules

- Every `selected` item must have: content_id, account, format, pool, effort (S/M/L), planned publish date, deadline, batch_id.
- Do not auto-promote Ideas to `selected` beyond 2-week capacity.
- Do not generate candidates if competitor CSV read failed.
- Distinguish verified facts from operational inference.
- If hours < normal capacity, reduce volume explicitly and note what was cut.
