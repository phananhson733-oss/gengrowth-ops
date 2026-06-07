# hr-lead Feishu HR BOT v0 — dry-run 方案

## 1. 目标

本目录是 `hr-lead` 的本地 dry-run 沙箱，不直接改 `docs/05-governance/people-ops/` 标准区，也不直接写 `实例库/people-ops/` 正式实例。

这次只做两件事：
1. 为长期 HR BOT 先搭一个独立 `hr-lead` runtime 草案；
2. 围绕彭满 2026-06-11 10:00 入职，生成一套“如果今天要拉起流程，BOT 会怎么做”的预演产物。

## 2. 长期形态

推荐长期形态：`独立 hr-lead profile + 挂在现有 Feishu gateway 下接消息`。

这样拆分的原因：
- profile 负责 HR 主脑：沿用 `.claude/agents/hr-lead.md` 的能力、边界、记忆和 SOP。
- gateway 负责入口：接 Feishu 消息、群路由、pairing、通知。
- 未来 HR 工作不只 onboarding；招聘、offer、绩效、政策、员工沟通都能逐步挂到同一个 `hr-lead` profile 上。

## 3. v0 允许 BOT 直发的范围

当前只允许直发：信息采集、材料清单、报到提醒、员工手册提醒。

以下事项一律不自动发给员工，必须先回 Lynne：offer、薪酬、合同新增条款、保密/IP 条款变更、录用/不录用、转正、调薪、绩效结论、法律/财务/HR 承诺。

## 4. 数据与写入边界

- 标准区：继续以 `docs/05-governance/people-ops/` 为模板和 SOP 来源，不在本次 dry-run 中改动。
- 实例区：live 时应写入 `实例库/people-ops/onboarding/彭满/`；本次为了不污染正式区，先把“将来要写进去的内容”放在 `output/pengman-2026-06-11/`。
- runtime 草案：放在 `sandbox-home/`，并强制 `platforms.feishu.enabled: false`，避免误发。

## 5. 彭满口径

- 权威报到口径：2026-06-11 10:00
- 权威来源：docs/records/lynne-wang/2026-06-05-chat-record.md Q6
- 旧版冲突口径：offer 文档中的 2026-06-02，本次 dry-run 不采用
- 直属负责人：王玲
- 特殊签署规则：入职当天打印新版整份《实习生录用通知》，由彭满签字、公司盖章，作为当前阶段实习签署文件；拿到毕业证后再签正式劳动合同。

## 6. 目录说明

- `sandbox-home/`：Hermes sandbox home，包含 `hr-lead` profile 草案
- `output/pengman-2026-06-11/`：彭满 onboarding dry-run 产物
- `scripts/build_hr_bot_dry_run.py`：一键重建脚本

## 7. 启用 live 前还要做什么

1. 把 `sandbox-home/profiles/hr-lead/` 收敛到正式 `~/.hermes/profiles/hr-lead/` 前，先确认实际可用 toolset 名称。
2. 把 `platforms.feishu.enabled` 从 `false` 改为 `true` 前，先完成 Feishu app 凭证注入与 home channel 绑定。
3. 把 `output/pengman-2026-06-11/` 中的实例草稿迁入 `实例库/people-ops/onboarding/彭满/` 前，先由 Lynne 确认要正式拉起。
4. live 前先跑一轮“仅 DM 自己”的灰度，不直接进员工群。
