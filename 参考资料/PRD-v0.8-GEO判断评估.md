---
title: "PRD v0.8 GEO 判断评估"
created: 2026-06-09
type: review
tags:
  - geo
  - prd-review
  - astrologywiki
related:
  - "GEO技术端优化检查清单"
  - "docs/03-marketing/2026-05-15-gengrowth-internal-growth-mvp-prd-v0.8.md"
---

# PRD v0.8 GEO 判断评估（2026-06-09）

> 评估对象：`2026-05-15-gengrowth-internal-growth-mvp-prd-v0.8.md`（astrologywiki.com 内部增长 MVP PRD）。
> 范围：仅评估 PRD 内部关于 GEO（AI 搜索可见性）的判断；soundness 对照真实 GEO 实践（mid-2026）。
> 结论已落成 5 处 PRD 修订（见末节「已落地」），本文是其评估依据存档。

## 一句话定性

**这份 PRD 是 SEO MVP，GEO 基本被当作"好 SEO 内容的副产品"——有几个零散但正确的 GEO 直觉，但没有把 GEO 当作独立的、可测量的渠道。** 全文：`llms.txt` 0 次、`JSON-LD/结构化数据` 0 次、`GPTBot/AI 爬虫` 0 次、`被引/citation` 0 次；唯一成体系的 AI 意识是 `AIO`（AI Overviews，3 次）。

## 8 条 GEO 判断逐条评

| # | PRD 的判断（出处） | 评定 | 为什么 |
|---|---|---|---|
| J1 | **AIO 是威胁；定义型词必须加工具/表格/对比**（§7.3，L360/413）| ✅ 成立（最成熟的一条）| AI Overviews 确实吃掉定义型查询的点击；用 AI 答不全的交互资产（birth chart calculator / aura test）做差异化反制是对的。astrologywiki 正好有工具页可承接。 |
| J2 | **每篇开头 Direct Answer Block 直答**（§7.5.4，4 次）| ✅ 成立、GEO 友好 | 前置直答=倒金字塔，正是 LLM（token 限制）抽取答案最友好的结构。PRD 框成"搜索意图"（SEO），但实质对 AEO/GEO 同样有效。 |
| J3 | **实体覆盖重要，但禁堆实体/无脑补 FAQ**（Day-30，L472）| ✅ 判断对，但定位偏低 | "实体重要 + 反对堆砌"两头都对。问题是它被放在排名排查链最后一环（排名差才查），当作 SEO 补救，而非 GEO 的主动杠杆——低估了主题实体权威对"被 AI 引用"的作用。 |
| J4 | **GEO ≈ SEO 副产品：精修线"向搜索引擎/AI 说清这站做什么"**（§3.2，L165）| ⚠️ 半成立 / 强假设 | "好内容+语义清晰对 AI 也有利"方向没错，但把 GEO 完全等同于 SEO 副产品、不单列 GEO 杠杆，是个没验证的假设。被 AI 引用 ≠ SERP 排名：前者更吃第三方权威提及、可抽取论断、结构化数据，纯 SEO 排名不必然覆盖。 |
| J5 | **测量只有 GSC（Day14/30/60 收录/Top100/点击）；AI 可见性无任何指标**（§7.9 + §8.3 "DataForSEO/Ahrefs 暂不实现"）| ⚠️ 对 GEO 是盲区 | GSC 只测 Google（含 AIO 曝光），完全测不到 ChatGPT/Perplexity/Gemini 的引用。若 GEO 真重要，PRD 等于飞行无仪表——所有成功标准都是 SEO 排名/PV，没有一条 AI 可见性指标。 |
| J6 | **技术闸跳过 JS parity；无结构化数据/AI 爬虫/llms.txt 要求**（§7.4 "不做大规模 JS parity 检测"；全文 grep 缺席）| ⚠️ 缺口 | 现实中 AI 爬虫对 JS 渲染弱（须 SSR）、JSON-LD 是 AI 提取实体的"通用语"、误封 GPTBot 会直接断 AI 抓取——这些 PRD 的技术闸一项没设防（只查 robots/canonical/可渲染/CWV 这套纯 SEO 闸）。且没要求核查 astrologywiki 是否 SSR、是否有 JSON-LD。 |
| J7 | **分发轻量，Week 1 不要求外链，无第三方权威引用策略**（§7.6）| 🟡 对 MVP 合理，但 GEO 欠配 | AI 引用高度依赖第三方权威/社区提及（别处引到才会被 AI 引）。PRD 的分发是"社媒拆条+社区观察+外链机会记录"，没有"让 astrologywiki 被权威/UGC 引用"的主动动作。第一周不强求可以，但应明确标为 GEO 已知欠配。 |
| J8 | **成功度量 = SEO 排名 + PV（北极星 日 PV 5000 美国为主）**（§3.3、§7.9 验收）| ⚠️ 与 J5 同源 | 北极星与全部验收都是 SEO/PV，没有任何"被 AI 引用/AI 转介流量"的目标。这使 J4 的赌注（SEO 好 GEO 自然好）既无指标也无目标去检验。 |

## 总评：一个根假设 + 两个盲区

**对的（保留）**：J1 AIO 防御、J2 Direct Answer、J3 实体不堆砌——说明执行同学有 GEO 直觉，只是没系统化。

**核心问题**：
- **根假设（J4）**："做好 SEO 集群 = GEO 自然好"。这是整份 PRD 对 GEO 的全部信任，但从未被验证，且与"AI 引用机制 ≠ SERP 排名"的现实不完全吻合。
- **盲区 1（测量，J5/J8）**：没有任何 AI 可见性指标——无法证伪 J4。如果"SEO 好 GEO 就好"是错的，PRD 自己也看不见。
- **盲区 2（技术+分发，J6/J7）**：GEO 特异的技术层（SSR/JSON-LD/AI 爬虫/llms.txt）和引用层（第三方权威提及）几乎空白。

> 一句话：**PRD 把 GEO 缩到了"内容语义清晰"这一个维度，丢了 GEO 的另外两条腿——可被 AI 抓取索引的技术层、被第三方引用的曝光层，且没有任何 AI 侧仪表来检验这个赌注。**

## 建议（尊重它是 SEO MVP，不过度工程，按性价比排序）

1. 加 1 条 AI 可见性"探针"指标到周度复盘（零开发）：每周对 5–10 个核心定义词，人工在 ChatGPT/Perplexity 问一次，记 astrologywiki 是否被引/被提。最低成本仪表，补 J5。
2. GEO 技术 3 项塞进发布前技术闸（一次性核查）：① 核心内容 SSR（非 CSR）；② 工具/Pillar 页有 JSON-LD（Article/FAQPage）；③ robots.txt 没误封 GPTBot/ClaudeBot/Google-Extended。补 J6。
3. J3 升级：把"实体覆盖"从 Day-30 排名补救前移到集群级 Brief 的 `entity_map`（已有该字段）作为生产时主动要求。
4. J4 标注为"待验证假设"而非既定事实，用建议 1 的探针检验；脱节再单列 GEO 动作。
5.（可选，低优先）astrologywiki 加 llms.txt，纳入建设任务。

## 已落地（2026-06-09）

以上建议已落成 PRD v0.8 的 5 处增补（标记「GEO 修订 2026-06-09」），并经 `_sync-canon.sh` 同步到 flow-mvp 两副本：

| 编号 | 增补 | 章节 |
|---|---|---|
| G-1 | "SEO 好 → GEO 好"标为待验证假设 | §3.2 |
| G-2 | 技术闸加 AI 抓取/索引层核查（SSR/JSON-LD/AI 爬虫/llms.txt）| §7.4 |
| G-3 | `entity_map` 前移为生产时主动要求 | §7.5.1 |
| G-4 | 零开发 AI 可见性探针 | §7.9 §7.8 |
| G-5 | 周度清单纳入探针信号 | §7.8 |

PRD §0.3 已加同名修订记录块。原文成立的三条 GEO 直觉（J1/J2/J3）保留未动。
