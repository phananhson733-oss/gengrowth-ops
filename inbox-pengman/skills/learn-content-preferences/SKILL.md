---
name: learn-content-preferences
description: Learn a user's content preferences through repeated best-versus-worst comparisons of four deliberately different topic, Hook, or Script candidates. Use when the user wants AI to understand their taste, run a preference-training round, compare multiple content options, record why they like and dislike alternatives, update a preference profile, or propose evidence-backed changes to a content prompt, Skill, or playbook.
---

# Learn Content Preferences

Run a controlled comparison loop that turns explicit human choices into traceable preference evidence.

## Respect Existing Authority

1. Read the current product workflow, relevant content rules, and target production record before generating candidates.
2. Treat content_stage and existing approval gates as authoritative.
3. Keep this preference system separate from lifecycle status, weekly plans, and production queues.
4. Never publish, schedule, select a production candidate, or change a locked Hook through a training round.
5. Never claim a Skill or prompt was updated unless the file was actually changed and validated.

For AstrologyWiki work, read the current AGENTS.md, the rolling weekly SOP, the relevant product Skill, and the target record when one exists.

## Run One Training Round

1. Choose exactly one object: topic, hook, or script.
2. Define the task, account, format, audience, locked facts, and constraints.
3. Read the active preference profile if one is supplied.
4. Generate exactly four candidates labeled A–D.
5. Make the candidates differ in meaningful mechanisms such as angle, breadth, opening structure, tension, pacing, specificity, or voice. Do not create four minor paraphrases.
6. Present each candidate with:
   - the candidate itself;
   - its core angle;
   - the variable it is testing.
7. Ask the user to choose the best and worst candidates. Reasons are optional; explain that reasons make long-term learning more reliable.
8. Do not ask the user to fill a template when their natural-language explanation is already clear.

## Inherit Preferences Across Composite Objects

- Topic candidates use topic preferences.
- Hook candidates inherit topic preferences for the AI-chosen topic and Hook preferences for the publishable Hook.
- Script candidates inherit topic, Hook, and Script preferences. Treat the first spoken sentence after any speaker label as the Script's embedded publishable Hook; apply Hook preferences to that sentence before applying Script preferences to the complete Script.
- When Script feedback specifically evaluates the opening sentence, record that signal with Hook scope. Do not dilute a strong Hook preference into a generic Script-style rule.

## Default Output Language

Generate every candidate title, topic, angle, tested variable, Hook, and Script in natural American English, even when the training brief is written in Chinese. Keep preference summaries, evidence labels, and interface explanations in concise Chinese. Change the candidate language only when Pengman explicitly requests another language for the current task.

## Interpret Feedback Conservatively

Preserve the user's exact words. Extract only what the explanation supports.

For each signal, record:

- polarity: positive or negative;
- object: topic, hook, or script;
- rule candidate;
- scope: current item, account, format, series, or cross-content personal preference;
- evidence source;
- confidence state.

Distinguish:

- factual corrections;
- current-content requirements;
- product, account, platform, or series rules;
- topic-selection judgments;
- personal expression preferences.

Do not convert the first four categories into personal writing style. When reasons are present, infer only what the user explicitly supports. A reason-free best/worst choice may influence the next round as a low-confidence relative signal, but it cannot by itself promote or rewrite a long-term rule. Treat “I dislike it but cannot explain why” as a weak signal that affects only the current round.

## Accumulate Evidence

Use these states:

- 1 occurrence: candidate — retain as single-round evidence.
- 2 similar occurrences from different content: testing — use as an explicit hypothesis in the next relevant round.
- 3 or more consistent occurrences across different content, including at least 2 reason-backed occurrences: proposed — draft a long-term rule update.
- Human-confirmed proposal: confirmed — eligible to update the relevant preference profile, prompt, Skill, or playbook.

Do not increase evidence count twice from one training round. Record conflicts instead of silently merging opposing signals.

## Update Rules Safely

Automatically update the preference evidence profile after a completed round.

Do not edit a core product Skill or governing workflow before human confirmation. When a signal becomes proposed:

1. Show the evidence sources.
2. Show the current rule, if any.
3. Draft the exact proposed replacement or addition.
4. Explain scope and possible overfitting risk.
5. Ask the user to confirm.
6. After confirmation, update only the single authoritative rule location and validate it.
7. Preserve the source evidence, previous rule, new rule, reason, and date.

## Load the Local Preference Profile

For Pengman workspace tasks, read references/pengman-preference-profile.md before generating candidates. Read references/pengman-preference-profile.json when exact evidence, session provenance, or machine-readable status is needed.

Treat this generated reference as part of this Skill:

- Apply confirmed rules by default.
- Use testing rules only as controlled experiments.
- Show proposed rules for Pengman confirmation.
- Keep candidate signals as evidence only.
- Let the local Preference Studio update these reference files after each completed round. The Studio reads the current AstrologyWiki product Skill, account guide, and rolling SOP for every generation round.

## Preference Packet

Use the schema in references/preference-packet.md when importing from or exporting to the visual Preference Studio.

When generating content from a packet, apply confirmed rules by default, treat testing rules as controlled experimental variables, and use candidate signals only as context. Never let a preference rule override facts, safety constraints, account positioning, a locked Hook, or explicit current-task instructions.

## Visual Tool Handoff

The companion visual tool lives at tools/content-preference-studio/.

The local Node service reads approved workspace context before generating four candidates. After each completed round it updates the evidence profile and immediately generates the next round. When a proposed expression or topic-selection rule is confirmed by Pengman, write only a marked rule block into the mapped section of the canonical `astrologywiki-social-workflow` Skill. Account rules and current-only constraints require manual routing and must not be written automatically.
