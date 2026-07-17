---
title: 统一内容 Brief 模板
project: astrologywiki
type: content-brief-template
status: active
owner: Pengman
updated: 2026-07-17
---

# 统一内容 Brief 模板

> 写稿前先填。Properties 只保留需要检索、路由和判断当前状态的字段；长文 Brief、证据、约束和实验说明写在正文。未知项写“待确认”，不要让 AI 自行补齐。`status` 继续服务仓库 dispatch；内容生命周期只写 `content_stage`。

```yaml
---
content_id:
project: astrologywiki
type: content-production
account:
platform:
content_format:
series:
script_status: 待确认
confirmed_script_version:
content_stage: Brief
status: draft
owner: Pengman
updated:
---
```

按需添加，无值时不要预先占位：

```yaml
experiment_id:
experiment_status:
selected_variant:
scheduled_publish_at:
published_at:
published_urls: []
weekly_digest:
```

## 统一 Brief 正文

- **目标用户**：
- **内容目标**：
- **用户问题**：
- **内容承诺**：
- **核心洞察**：
- **Hook 方向**：
- **CTA**：
- **落地页**：
- **本次实际使用的竞品及可借鉴机制**：
- **相关旧稿或人工修改记录**：
- **约束和禁止声明**：
- **制作或实验说明**：

## 字段口径

| 字段 | 填写规则 |
|---|---|
| `content_id` | 一个内容资产一个稳定 ID；同一未发布资产的改稿沿用，两个可能独立生产/发布的版本使用不同 ID。完整边界见 [[inbox-pengman/04-production/00-evergreen-workflows/Pengman 与 AI 内容润色协作说明]] |
| `experiment_id` | 仅在启动 Claude / GPT 双模型实验时填写；同一冻结 Brief 的一次比较使用一个 ID，例如 `aw-moon-toxic-traits-05-exp-01` |
| `experiment_status` | 双模型实验使用 `ready / generating / awaiting_comparison / selected_pending_confirmation / closed / rejected_returned_to_brief`；未启用时留空 |
| `selected_variant` | `claude / gpt / hybrid / rejected`；Pengman 尚未选择时留空。它只记录候选处理，不替代 `confirmed_script_version` |
| `script_status` | `待确认 / 已确认`；Pengman 明确确认采用某个 AI 版本后即可设为“已确认”，不要求必须另写完整人工稿 |
| `confirmed_script_version` | 记录被确认的版本名称，例如“AI 第二版，经 Pengman 确认”；不得写成 Pengman 亲自撰写 |
| `content_stage` | `Brief` → `AI 初稿` → `等待人工润色` → `待制作` → `待发布` → `已发布` → `复盘中` → `已复盘`；也可用 `暂停`。脚本确认并进入视觉调研或制作准备时使用 `待制作` |
| `weekly_digest` | 发布后链接到对应周报；周报是发布数据唯一事实来源 |
| `scheduled_publish_at` / `published_at` | 只在有确切时间时添加，使用带时区偏移的 ISO 时间；不另建 Seattle / Beijing 重复字段 |
| `published_urls` | 发布后添加已核实直链；没有链接时在正文标记“待补”，不留空数组 |

## Brief 完成检查

- 已说明为谁写、在哪个平台、使用什么形式。
- 已在正文写清用户问题和内容承诺；两者变化时退回 Brief。
- 已选账号，并说明为何符合账号定位。
- 已读取同系列最近 `decision / next_test`。
- 若启动双模型实验，已冻结唯一的模型实验包；Claude 和 GPT 收到相同的 `experiment_id`、`package_version` 和输入内容。
- 竞品只借结构、机制或视觉，不复制具体表达、人物、音频和素材。
- 已指定 CTA 与落地页；不能确认时标记“待确认”。
