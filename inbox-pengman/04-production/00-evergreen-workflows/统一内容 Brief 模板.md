---
title: 统一内容 Brief 模板
project: astrologywiki
type: content-brief-template
status: active
owner: Pengman
updated: 2026-07-20
---

# 统一内容 Brief 模板

> 写稿前先填。Properties 只保留检索、路由、排期和真实状态需要的字段；长证据、约束和实验说明写正文。未知项写“待确认”，不要自行补齐。`status` 继续服务仓库 dispatch；内容生命周期只写 `content_stage`。周度规则见 [[inbox-pengman/04-production/00-evergreen-workflows/weekly-rolling-content-production-sop]]。

```yaml
---
content_id:
title:
project: astrologywiki
type: content-production
account:
platform:
pool: Evergreen
pillar:
format:
priority: P1
effort: M
content_stage: brief
script_status: 待确认
confirmed_script_version:
publish_date:
deadline:
expiry_date:
hook:
source_evidence: []
cta:
batch_id:
published_url:
decision:
next_test:
status: draft
owner: Pengman
updated:
---
```

按需添加，无值时不要预先占位：

```yaml
series:
inventory_ready:
reschedule_count:
experiment_id:
experiment_status:
selected_variant:
scheduled_publish_at:
published_at:
published_urls: []
weekly_digest:
hold_reason:
review_on:
```

## 统一 Brief 正文

- **目标用户**：
- **内容目标**：
- **用户问题**：
- **内容承诺**：
- **核心洞察**：
- **账号匹配理由**：
- **Hook 说明**：
- **CTA / 落地页**：
- **事实与来源说明**：
- **本次实际使用的竞品及可借鉴机制**：
- **相关旧稿或人工修改记录**：
- **上一轮 `decision / next_test`**：
- **约束和禁止声明**：
- **制作或实验说明**：

## 字段口径

| 字段 | 填写规则 |
|---|---|
| `content_id` | 一个可独立发布的账号版本一个稳定 ID；同一未发布资产改稿沿用，两个可能独立生产/发布的版本使用不同 ID。完整边界见 [[inbox-pengman/04-production/00-evergreen-workflows/Pengman 与 AI 内容润色协作说明]] |
| `title` | 内部工作标题；不等同于最终对外标题 |
| `account` | 依四账号 Playbook 填写 ①／②／③／④ 或稳定账号标识 |
| `pool` | `Evergreen / Predictable / Hot`；进入条件和过期规则以周度 SOP 为准 |
| `pillar` | 人格、关系、Moon、天象、明星等内容支柱；不用于决定生产日 |
| `format` | 实际生产形式，如 `AI Host / Slideshow / Photo / B-roll / Text Video` |
| `priority` | `P0 / P1 / P2`；表示执行顺序，不突破周度产能 |
| `effort` | `S / M / L`；增加 L 时按周度 SOP 释放相应 S 产能 |
| `content_stage` | 唯一生命周期：`idea → selected → brief → scripted → assets_ready → producing → edited → scheduled → published → reviewed`；补充 `hold / cancelled` |
| `script_status` | `待确认 / 已确认`；只有人工明确确认采用版本后才设为“已确认”并进入 `scripted` |
| `confirmed_script_version` | 记录被确认版本名称，不得把 AI 版本写成 Pengman 亲自撰写 |
| `publish_date` | 计划发布日期 `YYYY-MM-DD`；本周发布与下周生产分别放入周计划对应区域 |
| `deadline` | 当前内容或阶段最晚完成日期/时间；时效内容必须填写 |
| `expiry_date` | Predictable/Hot 必填；Evergreen 可留空或填写复查日期 |
| `hook` | 当前确认或待确认的核心 Hook；详细理由写正文 |
| `source_evidence` | 仅列本条实际使用的来源或证据标识，不复制整份竞品表 |
| `cta` | 简短 CTA 与承接方向；完整落地页说明写正文 |
| `batch_id` | 当前生产批次；不替代 `content_id` 或 `content_stage` |
| `published_url` | 至少一个已核实主平台直链；没有真实直链不得进入 `published` |
| `decision` / `next_test` | 两者均已填写后才可进入 `reviewed`；周级事实仍回链 weekly digest |
| `inventory_ready` | `edited` 且未排期但可随时发布时设为 `true`；普通半成品不得使用 |
| `reschedule_count` | 热点替换造成的顺延次数；最多 1，第二次被挤出后退回池重新评估 |
| `scheduled_publish_at` / `published_at` | 只在有确切时间时添加，使用带时区偏移的 ISO 时间 |
| `published_urls` | 多平台额外直链；单一主平台仍以 `published_url` 为主 |
| `weekly_digest` | 发布后链接对应周报；周报是周级数据和结论事实来源 |

## 旧字段兼容

| 旧字段 | 新字段/处理 |
|---|---|
| `content_format` | 下次编辑当前 WIP 时迁移到 `format`；历史记录不批量改 |
| `scheduled_publish_at` | 精确时间继续保留，同时用 `publish_date` 支持周计划 |
| `published_urls` | 可继续用于多平台；同时补一个核实的主 `published_url` |
| 正文 Hook / CTA | 确认后可提升到 `hook` / `cta`；详细说明仍留正文 |

旧中文 `content_stage` 的完整映射见周度 SOP“字段兼容与迁移映射”。不得仅凭旧 `status` 或文件日期推断新阶段。

## Brief 完成检查

- 已说明目标用户、平台、账号和实际形式。
- 已说明为何符合该账号定位。
- 已填写 `pool / priority / effort / deadline / batch_id`；Predictable/Hot 已填写 `expiry_date`。
- 已写清用户问题、内容承诺、Hook、证据、CTA 和约束。
- 已读取同系列最近 `decision / next_test`。
- `selected` 确认没有突破未来两周产能。
- 若启动双模型实验，已冻结唯一实验包，Claude 和 GPT 收到同一版本输入。
- 竞品只借结构、机制或视觉，不复制具体表达、人物、音频和素材。
