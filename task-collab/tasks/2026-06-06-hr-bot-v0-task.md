---
title: hr-lead Feishu HR BOT v0 dry-run
date: 2026-06-06
updated: 2026-06-06
type: note
tags:
  - task
  - hr
  - onboarding
  - feishu
  - hermes
aliases:
  - hr-bot-v0-dry-run
  - 彭满入职 dry-run
---

# hr-lead Feishu HR BOT v0 dry-run

- [x] [people-ops/hr-bot] 基于 wiki-local `.claude/agents/hr-lead.md` 产出独立 `hr-lead` profile + Feishu gateway dry-run 方案，并为彭满 2026-06-11 入职生成一套不外发的演练产物 #task #hr #feishu #owner/wzb 📅 2026-06-06 ✅ 2026-06-06

## 目标

- 保留 `hr-lead` 原有 HR 主脑定位，不另起炉灶。
- 采用“独立 `hr-lead` profile + 接入现有 Feishu gateway”的长期形态。
- 在 dry-run 下只演练 4 类允许直发事项：信息采集、材料清单、报到提醒、员工手册提醒。
- 不外发、不改标准区，只在当前任务目录生成运行草案、消息预览、实例草稿和验证报告。

## 验收标准

- `sandbox-home/` 下有可读的 `hr-lead` runtime 草案（含 profile config、SOUL、局部 skill）。
- `output/pengman-2026-06-11/` 下有彭满入职 dry-run 产物。
- 有脚本可一键重建以上产物，并输出验证报告。
- 明确写清楚敏感事项必须回 Lynne，不允许 HR BOT 直发。

## 来源链接

- `/Users/awayer_mini/gengrowth-wiki/.claude/agents/hr-lead.md`
- `/Users/awayer_mini/gengrowth-wiki/docs/05-governance/people-ops/onboarding/新员工入职SOP.md`
- `/Users/awayer_mini/gengrowth-wiki/docs/records/lynne-wang/2026-06-05-chat-record.md`
- `/Users/awayer_mini/gengrowth-wiki/实例库/people-ops/offers/彭满/offer邮件-彭满.md`
- `/Users/awayer_mini/gengrowth-wiki/实例库/people-ops/offers/彭满/实习生录用通知-彭满.md`

## 执行记录

- 2026-06-06：完成资料盘点，确认 `hr-lead` 是 wiki-local agent，不是现成 Hermes runtime profile。
- 2026-06-06：确认采用“独立 profile + Feishu gateway”长期形态；彭满报到口径以 2026-06-05 聊天记录中的 `2026-06-11 10:00` 为准，旧 offer 中 `2026-06-02` 视为过期信息。
- 2026-06-06：用脚本生成 dry-run 方案、sandbox profile 草案、彭满 onboarding 预览和验证报告。
