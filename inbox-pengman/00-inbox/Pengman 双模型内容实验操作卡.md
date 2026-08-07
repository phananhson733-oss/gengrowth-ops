---
title: Pengman 周度选题与双模型内容实验操作卡
project: astrologywiki
type: personal-reference
status: reference
owner: Pengman
updated: 2026-08-04
canonical: false
---

# Pengman 周度选题与双模型内容实验操作卡

> 双模型只服务已进入周度产能的内容，不负责每天重新选题。正式规则见 [[inbox-pengman/04-production/00-evergreen-workflows/Pengman 与 AI 内容润色协作说明]]。

## 两个阶段

```text
阶段一：周一候选研究 → Pengman 选中 → 纳入 Producing for Next Week
阶段二：建立并确认 Brief → Claude / GPT 使用同一冻结包独立写稿
```

候选研究只在周一、明确重排、确认补库或合格 Hot 时发生。候选证据可放在 [[inbox-pengman/04-production/02-daily-content-recommendations/README]]；选中后必须在 [[inbox-pengman/04-production/07-content-production/README]] 建立独立 `content_id` 和主生产记录。

## 1. 从周计划选中内容

```text
把周计划中的【编号】纳入本周产能。
账号：【账号】
形式：【形式】
成本：【S/M/L】
请建立 Brief，先不要启动双模型。
```

AI 必须先检查：未来两周产能、账号匹配、历史去重、上一轮 `decision / next_test`、事实证据和实验变量。

## 2. 确认 Brief

Pengman 只需检查账号、受众、承诺、Hook 方向、事实边界、CTA、形式和不允许改变的变量。

```text
Brief 确认，可以冻结双模型实验包。
```

没有这句确认，不启动 Claude / GPT。

## 3. 独立生成

1. Claude 和 GPT 获得完全相同的 `experiment_id` 与 `package_version`。
2. 两者不得看到对方本轮答案。
3. 两份输出都只是 candidate，不改变 `content_stage`。
4. Codex 保存原稿、异议和差异，不把模型偏好冒充成人工决定。

## 4. 选择或退回

```text
实验【experiment_id】：
以【Claude/GPT】为主；
吸收另一版的：【具体部分/无】；
需要修改：【具体意见】；
生成组合稿后等我确认。
```

组合稿仍是工作稿。只有 Pengman 明确说：

```text
确认采用这个版本，进入制作。
```

才填写 `script_status: 已确认` 和确认版本；`content_stage` 仍保持 `selected`，实际开始制作时进入 `producing`。

## 5. 四条边界

1. 双模型不突破周度产能，不把 Idea 自动升级为 `selected`。
2. 同一实验必须使用同一冻结包，不能互相参考。
3. 候选不是最终稿；确认前不进入制作。
4. 一次选择或修改只记录在本条内容中；达到跨内容验证门槛后，才提议更新长期规则。
