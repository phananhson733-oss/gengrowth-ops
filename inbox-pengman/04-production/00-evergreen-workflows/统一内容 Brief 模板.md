---
title: 统一内容 Brief 模板
project: astrologywiki
type: content-brief-template
status: active
owner: Pengman
updated: 2026-07-16
---

# 统一内容 Brief 模板

> 写稿前先填。未知项写“待确认”，不要让 AI 自行补齐。`status` 继续服务仓库 dispatch；内容生命周期只写 `content_stage`。

```yaml
---
content_id:
experiment_id:
experiment_status:
selected_variant:
project: astrologywiki
account:
platform:
content_format:
series:
target_audience:
content_goal:
user_problem:
content_promise:
source_competitors: []
source_old_drafts: []
core_insight:
hook_direction:
cta:
landing_page:
constraints: []
script_status: 待确认
confirmed_script_version:
content_stage: Brief
weekly_digest:
decision:
next_test:
status: draft
owner: Pengman
updated:
---
```

## 字段口径

| 字段 | 填写规则 |
|---|---|
| `content_id` | 一个内容资产一个稳定 ID；同一未发布资产的改稿沿用，两个可能独立生产/发布的版本使用不同 ID。完整边界见 [[inbox-pengman/04-production/00-evergreen-workflows/Pengman 与 AI 内容润色协作说明]] |
| `experiment_id` | 仅在启动 Claude / GPT 双模型实验时填写；同一冻结 Brief 的一次比较使用一个 ID，例如 `aw-moon-toxic-traits-05-exp-01` |
| `experiment_status` | 双模型实验使用 `ready / generating / awaiting_comparison / selected_pending_confirmation / closed / rejected_returned_to_brief`；未启用时留空 |
| `selected_variant` | `claude / gpt / hybrid / rejected`；Pengman 尚未选择时留空。它只记录候选处理，不替代 `confirmed_script_version` |
| `content_promise` | 用户看完这条内容将得到什么；L4 反馈必须重新检查 |
| `source_competitors` | 只放本次实际使用的账号/视频链接；同时在正文记录借鉴机制和证据强度 |
| `source_old_drafts` | 放最相关的旧稿或人工修改记录 wikilink，不放整个目录 |
| `script_status` | `待确认 / 已确认`；Pengman 明确确认采用某个 AI 版本后即可设为“已确认”，不要求必须另写完整人工稿 |
| `confirmed_script_version` | 记录被确认的版本名称，例如“AI 第二版，经 Pengman 确认”；不得写成 Pengman 亲自撰写 |
| `content_stage` | `Brief` → `AI 初稿` → `等待人工润色` → `待制作` → `待发布` → `已发布` → `复盘中` → `已复盘`；也可用 `暂停`。脚本确认并进入视觉调研或制作准备时使用 `待制作` |
| `weekly_digest` | 发布后链接到对应周报；周报是发布数据唯一事实来源 |
| `decision` | 仅允许 `复用 / 调整后复用 / 待观察 / 暂停 / 淘汰`；未发布时留空 |
| `next_test` | 必须来自上一轮周报或明确的新假设，不能只写“继续优化” |

## Brief 完成检查

- 已说明为谁写、在哪个平台、使用什么形式。
- 已写清用户问题和 `content_promise`；两者变化时退回 Brief。
- 已选账号，并说明为何符合账号定位。
- 已读取同系列最近 `decision / next_test`。
- 若启动双模型实验，已冻结唯一的模型实验包；Claude 和 GPT 收到相同的 `experiment_id`、`package_version` 和输入内容。
- 竞品只借结构、机制或视觉，不复制具体表达、人物、音频和素材。
- 已指定 CTA 与落地页；不能确认时标记“待确认”。
