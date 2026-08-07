---
title: 单条主生产记录入口
project: astrologywiki
type: production-index
status: active
owner: Pengman
updated: 2026-08-07
---

# 单条主生产记录入口

这里保存当前制度下每条内容的唯一主生产记录。每个可独立发布的内容使用一个 `content_id` 和一份主记录。

## 怎么使用

1. 先从当前 `04-weekly-content-plans/YYYY-Www 周度内容计划.md` 找到 `content_id`。
2. 在 `未发布/` 或 `已发布/` 中打开同名主记录（根目录不直接放置主记录）。
3. 用 frontmatter 的 `content_stage` 判断实际阶段。
4. 在同一记录继续维护 Brief、确认稿、制作证据、定时、真实发布链接和单条复盘回链。

README 不手工复制“当前队列表”，避免它与主记录再次产生两套状态。需要查看队列时，直接读取 `未发布/` 与 `已发布/` 下各主记录的 `content_stage`。

## 目录结构

主生产记录只有两个物理目录：

- `未发布/`：`content_stage` 为 `selected / producing / ready / hold / cancelled`，或发布证据不完整的记录。
- `已发布/`：同时满足 `content_stage: published` 且存在真实 `published_url`、`platform_post_id`、`published_at` 的完整核验发布。

目录只用于物理归档，不表达阶段；生命周期唯一真相源仍是 `content_stage`。发布证据完整并将 `content_stage` 更新为 `published` 后，将记录从 `未发布/` 移至 `已发布/`（当前由人工移动）。

## 产品、账号和平台属性

主记录按生命周期统一存放，不按账号建立物理目录。当前记录至少维护：

```yaml
project: astrologywiki
product: astrologywiki
account: astrologywiki
account_handle: "@astrologywiki"
platform: tiktok
content_stage: selected
```

- `product`：稳定产品 ID；未来新增产品时新增属性值，不复制整套目录。
- `account`：稳定账号 ID，不添加序号、平台或展示说明。
- `account_handle`：平台可见账号名；账号暂未匹配时留空。
- `platform`：使用小写稳定值，如 `tiktok / instagram / youtube / x`。
- 暂未匹配账号时使用 `account: unassigned`，不得通过文件夹位置猜测账号。

账号和平台是筛选、统计和自动化维度；`未发布/已发布` 是当前唯一物理分类。

## 唯一生命周期

```text
selected → producing → ready → published
```

补充：`hold / cancelled`。完整完成定义见 [[inbox-pengman/02-生产/00-evergreen-workflows/weekly-rolling-content-production-sop#8-生命周期、完成定义和 WIP]]。

## 写入边界

- 最终确认脚本、真实阶段、制作选择和发布回链只在主记录维护。
- Perplexity / Gemini 调研摘要、冻结方向、Claude 稿和总控审稿可以写在同一主记录的相应区块；不为每个模型建立状态表。
- 大量视觉素材或多版本实验确需拆附件时，附件沿用 `content_id`，但不得维护第二份 `content_stage`。
- `hold / cancelled` 只用于例外。脚本确认写 `script_status / confirmed_script_version`，平台定时写 `scheduled_at / publish_date`，复盘写 `decision / next_test`；这些动作不新增生命周期阶段。
- 只有取得真实 `published_url` 后才完整确认 `published`；完成复盘后仍保持 `published`。
- `未发布/` 与 `已发布/` 只是物理归档位置，不改变生命周期判断；目录名不能代替 `content_stage`。

## 模板与相关规则

- [[inbox-pengman/02-生产/00-evergreen-workflows/统一内容 Brief 模板]]
- [[inbox-pengman/02-生产/00-evergreen-workflows/Pengman 与 AI 内容润色协作说明]]
- [[inbox-pengman/02-生产/00-evergreen-workflows/ai-short-video-production-workflow]]

`02-生产/02-content-production/历史记录/迁移前旧格式/` 保存迁移前的历史记录和旧格式，不再作为新主记录入口。

自动化和日常队列扫描必须排除 `历史记录/`。同一 `content_id` 只允许在 `未发布/` 或 `已发布/` 中保留一份当前主记录；被替代版本移入 `_archived/`，不得继续维护第二份状态。
