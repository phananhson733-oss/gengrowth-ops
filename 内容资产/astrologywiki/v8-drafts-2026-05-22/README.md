---
title: v8 batch — 2026-05-22 第 1 篇 Pillar + 5 篇 Definition
date: 2026-05-22
updated: 2026-05-22
type: content-batch
author: wzb
agent: claude
status: ready-to-review
batch_id: v8-drafts-2026-05-22
tags:
  - astrologywiki
  - seo
  - content-batch
  - v8
---

# v8 Batch — 2026-05-22

第 1 个完整 v8 batch。Pipeline 跨 3 类 entity + 2 种 template 全部 6/6 PASS。

## 内容清单

| 文件 | Entity 类 | Template | 词数 | KW | Phase 2 |
|---|---|---|---|---|---|
| `2026-05-21-blue-aura-meaning.md` | aura color | Definition | 1514 | 8 | 6/6 PASS |
| `2026-05-21-purple-aura-meaning.md` | aura color | Definition | 1521 | 8 | 6/6 PASS |
| `2026-05-21-yellow-aura-meaning.md` | aura color | Definition | 1507 | 8 | 6/6 PASS |
| `2026-05-21-saturn-return.md` | transit/cycle | Definition | — | — | 6/6 PASS |
| `2026-05-22-leo-personality.md` | sign/planet | Definition | 1500 | 8 | 6/6 PASS |
| `2026-05-22-aura-colors-pillar.md` | aura color 集合 | **Pillar** | 2503 | 12 | 6/6 PASS |

总计 6 文章。1 篇为 hub 类 Pillar，5 篇为 leaf 类 Definition。

## 这批的看点

1. **第一次跨 3 类 entity scale 验证**——之前只在 aura 同类型内做过。这批
   覆盖 aura color / transit / sign 三个 family，证明 v8 prompt batch-ready。
2. **第一篇 Pillar 文章**——之前模板只有 Definition。Pillar 是 hub 页（covers
   多个 child entities），词数 2500-3500，9 H2。aura-colors-pillar 是 7 色总览。
3. **v8 patches 已落地**：
   - P-9：QRT + Reflection Prompts 第一段必须是 table/numbered list（禁 prose intro）
   - P-10：H1 之后必须直接 H2 #1（禁任何 SEO preamble paragraph）
4. **3 个 scaling failure mode 被发现 + 修复**（详细见 `prompt-scaling-failure-modes`
   memory）——title generator hardcoded "Meaning" / Claude kw 易超上限 / GPT preamble。

## 怎么 review

每篇文章 frontmatter 有 `status: ready-to-review`，可以从以下角度看：

- **整体框架**：文章定位 / 角度是否对 wiki 用户有价值
- **mechanism + trade-off**：第 3 节是否真说清了 mechanism 和 trade-off，
  没只列表面属性
- **Quick Reference Table**：4 列 Property / Mechanism / Energy Center / Common
  Misread —— Energy Center 这一列对 sign/transit 类不要塞 chakra（v8 P-7 patch
  防的就是这个）
- **Reflection Prompts**：3 条具体情境回忆（"Think of a recent moment when..."）
  不是泛问（"How do you feel about..."）
- **wikilinks**：所有内链都用 `[[<TBD-internal-link: ...>]]` placeholder 格式，
  等真路由确定后再 swap

## 不要做的

1. **不要改 `.md` 原文**——LLM 生成 + binary check 通过的。手改可能破坏 word
   count / kw count / 结构。
2. **不要删本目录的文件**——rsync 同步会传播到 ops。如果某篇要 retire，
   挪到 `archived/` 子目录而不是删除。

## 反馈

如果某段 / 某文章想改，**写 review 笔记**到：
`docs/05-governance/people-ops/perf-feedback/seo/2026-W21-content-<entity>-feedback.md`

写清楚 (a) 哪个文件哪一段、(b) 现在哪里不对、(c) 应该往哪个方向改。wzb 看到
后改 prompt 重新生成，下批再同步过来。

## 同源副本

这 6 篇也在 `gengrowth-ops/inbox/05-blog/2026-05-2{1,2}-*-v8-claude.md`
（手动 cp 过去的初稿副本，保留不删）。本目录是 **wiki 单一权威源**——以本
目录为准，inbox 副本仅作历史归档。
