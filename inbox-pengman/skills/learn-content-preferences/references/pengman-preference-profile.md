# Pengman 内容偏好档案

> 由本地 Preference Studio 自动维护。原始反馈保存在 JSON；只有 Pengman 在页面确认后，规则才进入“已确认长期规则”。

更新时间：2026-08-14T10:38:49.205Z

## 已确认长期规则

- 无

## 等待 Pengman 确认

- 无

## 待验证偏好

- 无

## 单次证据

- **避免 · Hook**：避免刻意具体、容易显得 AI 生成的场景
  - 证据：1 个不同训练轮次，其中 1 轮有明确原因
  - 适用范围：本轮 Scorpio 信任主题的 Hook
  - 分类：expression
  - 目标：skills/astrologywiki-social-workflow/SKILL.md · ### 8.1 Pengman 的 Hook 与白纸重写偏好
  - 最近原话：“change one detail over dinner看着就像是ai生成的”

- **偏好 · Hook**：抽象概念需要用更简单直白的词表达
  - 证据：1 个不同训练轮次，其中 1 轮有明确原因
  - 适用范围：本轮 Scorpio 信任主题的 Hook
  - 分类：expression
  - 目标：skills/astrologywiki-social-workflow/SKILL.md · ### 8.1 Pengman 的 Hook 与白纸重写偏好
  - 最近原话：“感觉吸引人一点，但是这个boundaries有点不够“简单””

## 使用边界

- confirmed 规则默认用于后续生成。
- testing 规则只作为下一轮实验变量。
- proposed 规则等待 Pengman 确认，确认后只写入单一权威位置。
- 未填写原因的选择可以影响下一轮，但不能单独升级为长期规则。
- candidate 只作为证据，不默认约束生成。
- 偏好不能覆盖事实、安全、账号定位、已锁定 Hook 或当前任务的明确要求。
