---
title: astrologywiki 内容资产
date: 2026-05-22
type: index
author: wzb
tags:
  - content-asset
  - astrologywiki
  - seo
---

# astrologywiki 内容资产

astrologywiki.com 的 SEO 内容草稿存放区。由 `gengrowth-flow-mvp` 半自动 pipeline 产出（Phase 0 RAG → Phase 1 prompt → LLM → Phase 2 binary checks），通过 wiki→ops sync 自动同步给 ops 协作。

## 目录结构

```
内容资产/astrologywiki/
├── README.md                          # 你正在看的这份
└── v8-drafts-YYYY-MM-DD/              # 按批次归档（带日期，永不覆盖前一批）
    ├── YYYY-MM-DD-<slug>.md           # 单篇 Definition 文章
    └── YYYY-MM-DD-<slug>-pillar.md    # Pillar 集合页
```

## 同步机制（给 ops 同事）

本目录在 wiki repo 的同步白名单内，wiki `main` 分支 push 后会通过 GitHub Actions
自动 rsync 到 ops repo 同名路径 `gengrowth-ops/内容资产/astrologywiki/`。

**注意**：sync 使用 `rsync --delete`，意味着 wiki 端删除/改名 ≠ ops 端保留旧版。
所以本目录按"批次归档"策略，每批新文章放进 `v{N}-drafts-{date}/` 子目录，
不覆盖前一批，方便对比 prompt 迭代效果。

## 当前批次：v8-drafts-2026-05-22

第 1 个完整批次。Pipeline 状态：v8 prompt + P-9 (QRT/RP no-prose-intro) +
P-10 (H1 anti-preamble) patches。3 类 entity (aura color / transit / sign) +
1 类 template (Pillar) 全部通过 Phase 2 6/6 binary check。

详细 review notes 见该子目录的 README。

## 给 ops 同事的协作约定

1. **不要直接改 `.md` 原文**。这些是 LLM 生成的，结构 + 关键词分布 + 词数全部
   经过 Phase 2 binary check（structure + RL1-RL6）—— 任何手改都可能破坏 binary
   check 标记的 invariant。
2. **改动走 prompt 反馈**：在你想反馈的文章末尾或单独的 review 文档里写
   「这一段不行 / 这里该补什么 / 应该换什么角度」，wzb 接到后改 prompt
   重新生成，再同步过来。
3. **review 跟踪**：建议在 `docs/05-governance/people-ops/perf-feedback/seo/`
   下按 `2026-WXX-content-<entity>-feedback.md` 命名写反馈，那个目录也在
   白名单内。

## Pipeline 参考

- prompt 模板：`gengrowth-flow-mvp/tools/scripts/lib/content-draft-templates/`
- Phase 2 validator：`gengrowth-flow-mvp/tools/scripts/_phase2-validate.mjs`
- 上游 README：`gengrowth-flow-mvp/README.md`
