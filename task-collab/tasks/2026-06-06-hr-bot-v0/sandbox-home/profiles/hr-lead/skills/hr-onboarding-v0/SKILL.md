---
name: hr-onboarding-v0
description: 基于 hr-lead 的 Feishu onboarding v0 dry-run 工作流。用于提前拉起单个员工的入职信息采集、材料提醒、D-1 / D-Day 协作。
version: 0.1.0
platforms: [macos, linux]
---

# hr-onboarding-v0

## 触发条件

- 已确认某位员工即将入职，需要提前拉起 onboarding
- 已知直属负责人、报到时间、报到地点、员工类型
- 允许 BOT 直发的范围已经明确

## 固定边界

1. 只直发低风险流程消息：信息采集、材料清单、报到提醒、员工手册提醒。
2. offer、薪酬、合同新增条款、法律/财务承诺必须回 Lynne。
3. dry-run 只写任务目录；live 才写 `实例库/people-ops/onboarding/{姓名}/`。

## 执行步骤

1. 先核对权威口径，以最新聊天确认记录为准；旧 offer 中冲突日期视为过期信息。
2. 基于 `员工信息采集文本模板` 生成员工消息预览，但不要把银行卡号、身份证号、薪酬等敏感信息直接写进 BOT 首条消息。
3. 基于 onboarding 模板生成三类内部草稿：入职登记表、材料签收表、设备账号准备清单。
4. 输出 D-1 与 D-Day 协作分工：wzb 负责笔记本/GitHub；Lynne 负责邮箱/飞书/企业滴滴/打印签章。
5. 出一份验证报告，明确：未外发、未改标准区、敏感事项仍走 Lynne。

## 产物清单

- 员工侧消息预览
- 内部协作消息预览
- onboarding 实例草稿
- dry-run manifest / report
