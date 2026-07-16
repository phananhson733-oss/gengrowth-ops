---
title: 04-production 瘦身迁移提案
project: astrologywiki
type: workspace-reorganization-proposal
status: draft
owner: Pengman
updated: 2026-07-16
---

# 04-production 瘦身迁移提案

> 本轮只形成清单，未执行批量移动、合并或删除。确认后应使用 Git 移动，并同步修复 README、wikilink 和硬编码路径。

## 判断

`04-production` 臃肿的主要原因不是文件总量本身，而是“生产执行、发布复盘、长期 SOP、平台策略、工具研究、竞品研究、历史资料”共用一个入口。建议让 `04-production` 只保留直接进入生产闭环的内容，其余原文件整体迁入一个人类可读的 `05-调研资料`，不复制。

## 逐目录与文件类型建议

| 当前目录/文件类型 | 当前作用 | 留在 04-production | 建议去向 | 理由 | 移动风险 | 需要修复的链接 |
|---|---|---:|---|---|---|---|
| `00-evergreen-workflows/` | 长期生产 SOP、Skill | 是 | `04-production/生产SOP/` | 直接控制生产 | 高 | 根 README、AGENTS、日更文档及大量 wikilink |
| `01.../content-direction-and-tools-research.md` | 平台/工具综合调研 | 否 | `05-调研资料/平台与策略/` | 是决策证据，不是当前执行记录 | 中 | 04 README、鱼骨图、任务文档 |
| `01.../four-account-tiktok-content-playbook.md` | 账号路由 Playbook | 是 | `04-production/生产SOP/` | 直接决定账号和形式 | 高 | Skill、日更 SOP、制作记录 |
| `01.../social-seo-content-operations-framework.md` | 运营框架 | 是，先收敛 | `04-production/生产SOP/` | 属于长期执行规则 | 高 | 多个入口和旧方案 |
| `01.../social-seo-fishbone-map.md` | 总索引/流程图 | 是 | `04-production/README.md` 或 `生产SOP/` | 是入口，不是调研事实 | 中 | 04 README 与子目录 README |
| `01.../历史调研资料/` | 已完成早期研究 | 否 | `05-调研资料/历史资料/` | 仅供追溯 | 中 | current-context、旧 workflow |
| `02-video-and-visual-tool-research/` | 视频/视觉工具研究 | 否 | `05-调研资料/工具调研/视频与视觉/` | 工具证据不应挤占生产入口 | 中 | 04 README、evergreen README、制作稿 |
| `03-reference-accounts/` | 竞品账号、视频研究、旧表快照 | 否 | `05-调研资料/竞品账号与视频/` | 调研与生产通过 Brief 关联即可 | 高 | AGENTS、Skill、Playbook、制作稿 |
| `03.../sheets-export/` | Google Sheet 旧快照 | 否 | `05-调研资料/竞品账号与视频/旧快照/` | 在线表是唯一事实来源；只留历史追溯 | 低 | 当前无直接引用，迁移后 README 标明停用 |
| `04-text-and-social-tool-research/` | 文本/X/搜索工具研究 | 否 | `05-调研资料/工具调研/文本与社媒/` | 与视频工具研究应同类归档 | 低 | 04 README |
| `05-weekly-published-content-digests/` | 发布事实、公开数据、复盘 | 是 | `04-production/发布与复盘/` | 闭环唯一指标事实来源 | 高 | Skill、SOP、README、生产记录 |
| `06-daily-content-recommendations/` | 选题池、制作中、已发布生产记录 | 是 | `04-production/内容生产/` | 当前执行主入口 | 高 | 全库最多路径引用 |
| `06.../已合并旧稿/` | 被合并的过程稿 | 是但降权 | `04-production/内容生产/历史旧稿/` | 与最终生产记录保持近邻但不出现在主入口 | 中 | README 和少量旧链接 |
| `07-gsc-exports/` | 直接数据输入 | 是 | `04-production/数据输入/GSC/` | 是生成 Brief 前的直接输入 | 中 | SOP、README |
| 根 `astrologywiki-social-content-workflow.md` | 旧总流程 | 暂留，后续合并 | 先与 `social-seo-content-operations-framework.md` 比较后只保留一个主入口 | 避免两套总流程 | 高 | 04 README、历史任务文档 |
| 单条已发布制作方案 | 完整生产记录 | 是 | `内容生产/已发布/`（可选，二期） | 仍需追溯人工稿、发布和复盘 | 高 | 周报、系列互链 |
| `03-topic-ideas/` 长期主题 | 长期种子、SEO/GSC 选题 | 不进入 04 | 保持原位 | 是主题池，不是生产队列 | 低 | 只需由 Brief 链接 |
| `07-account-assets/` | 账号和品牌资产 | 不进入 04 | 保持原位 | 资产边界清晰 | 低 | 无需改动 |

## 建议改造后目录树

```text
inbox-pengman/
├── 03-topic-ideas/
├── 04-production/
│   ├── README.md
│   ├── 生产SOP/
│   ├── 内容生产/
│   │   ├── 当前制作/
│   │   ├── 待发布/
│   │   ├── 已发布/
│   │   └── 历史旧稿/
│   ├── 发布与复盘/
│   └── 数据输入/
│       └── GSC/
├── 05-调研资料/
│   ├── README.md
│   ├── 平台与策略/
│   ├── 工具调研/
│   │   ├── 视频与视觉/
│   │   └── 文本与社媒/
│   ├── 竞品账号与视频/
│   │   └── 旧快照/
│   └── 历史资料/
├── 06-tasks/
└── 07-account-assets/
```

## 执行顺序（待确认）

1. 先建立新目录 README 和路径映射表。
2. 先移低风险工具调研，再移历史资料，再移竞品研究。
3. 最后才改动高引用的 `00/05/06` 三个生产核心目录。
4. 每批移动后运行 wikilink 与硬编码路径检查，再提交一笔独立 Git 变更。
5. `astrologywiki-social-content-workflow.md` 与运营框架先人工对比，不直接合并。
