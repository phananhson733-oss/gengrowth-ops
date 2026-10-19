---
title: SEO 评审 — astrologywiki 关键词集群文档 & 内容流水线 v2.0
date: 2026-05-18
updated: 2026-05-18
type: record
author: Lynne Wang
agent: claude
status: advisory
period: 2026-W21
doc_type: review
tags:
  - record
  - seo
  - review
  - performance
aliases:
  - astrologywiki 关键词集群与内容流水线v2.0 评审
评审对象:
  - docs/repo/gengrowth-ops/inbox/01-keyword-research/2026-05-14-astrologywiki-keyword-cluster.md
  - docs/repo/gengrowth-ops/inbox/03-content-briefs/2026-05-14-seo-pipeline-sop-v2.md
评审依据:
  - docs/02-product/01-prd/2026-05-15-gengrowth-internal-growth-mvp-prd-v0.7.md
---

# SEO 评审 — astrologywiki 关键词集群文档 & 内容流水线 v2.0

## 说明

**本文不是 `/perf-audit-seo` 正式评审。** 它是 GenGrowth MVP PRD 收敛到 v0.7 过程中，从 SEO 专家视角对两份运营执行文档做的评审与优化建议，应 Lynne 要求单独成文归档。

- 无 HANDSHAKE token、无强模板自检——它是**咨询性评审建议**，不作绩效依据。
- 若需把它转为正式质量评审，走 `/perf-audit-seo` 入口、由 wzb 确认后重跑。

**评审对象：**

| # | 文档 | 类型 | owner |
|---|---|---|---|
| A | `01-keyword-research/2026-05-14-astrologywiki-keyword-cluster.md` | 关键词集群（选题登记表来源）| Ma Boyang |
| B | `03-content-briefs/2026-05-14-seo-pipeline-sop-v2.md`（v2.0 集群全案版）| 内容生产 SOP | Ma Boyang / Gemini CLI |

**评审依据：** `GenGrowth 内部增长系统 MVP PRD v0.7`（当前执行基准）+ 2026 年英文 SEO 实践。

**严重度口径：** P0 = 按现状用会造成真实 SEO 伤害或等于没做聚类；P1 = 结构性问题，规模化前必须修；P2 = 改进项。

---

## 总体结论

| 文档 | 一句话结论 | 建议状态 |
|---|---|---|
| A 关键词集群文档 | 一份**自动聚类初稿**：完成了"把词分组"，没完成"建立可用内容架构"。frontmatter 标 `final` 名不副实 | 降回 `draft`，做一轮人工二次聚类 |
| B v2.0 内容流水线 SOP | 骨架可用、比 v0.18 有进步，但**聚类环节（第一部分）太弱是硬伤**，另有数处 2026 SEO 现实缺口 | 补强后再定 `final` |

**严重度分布：** A 文档 P0×2 / P1×5；B 文档 P0×1 / P1×5 / P2×2。

> 核心因果：**B 文档的"第一部分（聚类）"定义太弱 → A 文档所有结构问题由此而来。** 修 B-1 是修 A 的前提。

---

## 一、评审 A — astrologywiki 关键词集群文档

### A-1 ｜P0｜"Independent Posts" 是个倾倒场

**现象：** 约 250 个词被列在"Independent Posts / 独立文章"区作为独立页面。但其中大量词本应成簇——`9th house astrology`、`8th house meaning`、`11th house`、`chiron in 12th house`、`mars in 12th house`、`pluto in 6th house`、`pluto in 4th house`、`cancer in 12th house` 全是 house/placement 系列；一批 `purple aura` / `yellow aura` / `green aura` 与 Aura 1A/1B 簇**重复**；一批 `magha nakshatra` / `punarvasu nakshatra` / `krittika` 本应进 Nakshatras 簇。

**影响：** 聚类只做了一半。这些 house/placement 词正是 v0.7 精修线 P0 想要的 "Houses as Life Areas" 簇——散着就建不起内链网络、形不成主题权威。

**建议：** 撤销 "Independent Posts" 分区，把词回收进真实集群（Houses/Placements、Aura、Nakshatras、Nodes、Healing）。真正的独立文章只留给无同主题伙伴的高权重孤立词，数量应是个位数，不是 250。

### A-2 ｜P0｜近义词未做 1+N 合并，同类相食风险高

**现象：** `aura colors` / `aura color` / `color aura` / `aura colors and their meaning` / `color aura meanings` / `aura color test` / `aura color quiz` / `aura colors test` / `aura test` / `aura quiz` 是近义词；"紫色光环"有约 9 个变体（`purple aura meaning` / `what does a purple aura mean` / `what does purple aura mean` / `purple aura color meaning` / `purple aura` / `violet aura meaning` / `violet aura` / `light purple aura meaning` / `light purple aura`）。文档把它们各列一行、B 列写"(无)"。

**影响：** 若每个变体各成一页，会互相抢同一组排名（cannibalization），分散页面权重、稀释相关性信号，搜索引擎也难判断该给哪页排名。

**建议：** 应用 v2.0 SOP 自己定义的 **1+N 模型**——一个头词一页，其余近义变体进 B 列（Associated Keywords）作 secondary、在正文做 H2 / 语义锚点。9 个紫光环变体 → 1 页。**这是 A 文档当前最大的执行遗漏：1+N 机制定义了，但没用。**

### A-3 ｜P1｜机械 Part 拆分

**现象：** `best vedic birth chart calculator (Part 1/6 … 6/6)`，6 个 Part、每个 7 个关联词、共约 42 个 calculator 变体。

**影响：** 这是按 v2.0 "上限 7 个、溢出拆 Part X/Y" 规则把一段字母序列**机械切成 7 个一组**，不是语义拆分。这 42 个词几乎全是同一个"vedic 星盘计算器"意图，应是**一个工具页**，不是 6 页。6 个 Part 页会严重同类相食。

**建议：** 42 个 calculator 变体 → 一个工具页，变体作 secondary。根因在 v2.0 规则本身，见 B-2。

### A-4 ｜P1｜没有指标，无法排优先级

**现象：** 集群文档只有 Target / Associated Keyword 两列，没有搜索量 / KD / 意图 / SERP弱度 / AIO。对应的选题登记表 CSV 里月搜索量 / KD 显示"未找到"（VLOOKUP #N/A）。

**影响：** 聚类与关键词主表的指标脱节，无法判断哪个簇、哪页先做、值不值得做。

**建议：** 统一关键词字符串（去标签、去多余空格）修好 VLOOKUP，把主表的月搜索量 / KD / 意图 / SERP弱度接回每行。

### A-5 ｜P1｜"100% 覆盖"是错误的优化目标

**现象：** 文档自述"100% 覆盖：全量 283 快速胜利 + 133 长尾词已全部通过 Part 拆分机制妥善安置"。

**影响：** 把"每个关键词都变成一页"当成目标，正是 v0.7 反对的"一词一文"。正确目标是**正确的页面架构**——多词合并成一页是常态，不是失败。

**建议：** 聚类质量的衡量指标改为"关键词数 ÷ 页面数 的合并比"和"零同类相食"，不是"覆盖率 100%"。

### A-6 ｜P1｜混意图集群 + 越界 / 敏感词

**现象：** "Vedic Astrology" 簇把工具页（calculator）和知识解读（`vedic astrology chart interpretation`）混在一起；`highly sensitive person vs autism`（敏感心理话题）、`relationship life coach`、`what is career transition planning`（几乎不沾占星）混入。

**影响：** 工具意图与信息意图的页面结构、CTA 完全不同，混簇会导致内链与模板错配；敏感 / 越界词需 psych_safety 或相关性闸门。

**建议：** Vedic 簇拆成"Vedic 工具"和"Vedic 知识"两簇；HSP 类词若做须标 `psych_safety_flag = Y`（v0.7 附录 B）；`relationship life coach` / `career transition planning` 跑相关性闸门，无占星连接则剔除。

### A-7 ｜P1｜垃圾词与地区错配

**现象：** `miami dade transit bus tracker`、`hub city transit bus tracker`、`trimet transit tracker` 等公交词仍在文档内；Vedic / Nakshatras 簇大概率印度搜索为主。

**影响：** 垃圾词浪费产能；印度向集群冲不出"美国为主"的 PV。

**建议：** 按 v0.7 §7.3 的负向词否决剔垃圾；按 v0.7 §3.3 给每簇打 `us_share` 三档标签（高 / 中 / 低），印度向集群不占 P0 产能。

### A 优化清单

1. 撤 Independent Posts，词回收进真簇（A-1）。
2. 应用 1+N 合并近义词，9 个紫光环变体归 1 页（A-2）。
3. 42 个 calculator 变体归 1 个工具页（A-3）。
4. 修 VLOOKUP，接回主表指标（A-4）。
5. 拆混意图簇、剔越界 / 垃圾词、打 us_share 标签（A-6 / A-7）。
6. 衡量指标从"覆盖率"改为"合并比 + 零同类相食"（A-5）。
7. `status: final` → `draft`，二次聚类完成后再定稿。

---

## 二、评审 B — v2.0 SEO 内容流水线 SOP

**优点先说：** v2.0 比 v0.18 有明显进步——集群感知（Pillar/Spoke/Standalone）、保留 v0.18 零件（Intent/Tier/Template/Entity/Friction/Logic）、QA 红线具体（Answer Lock、视觉破碎化、EEAT 引用、数字密度、禁词、1+N 完备性）。以下是需补强处。

### B-1 ｜P0｜聚类环节（第一部分）定义太弱 —— A 文档所有问题的根因

**现象：** v2.0 "第一部分 §1 建模与集群预加工流程" 只用三步、一句"交给 AI 判定主 / 次"带过。没有合并规则、没有相关性 / 负向词闸门、没有指标接入、没有地区维度。

**影响：** A 文档的倾倒场、不合并、机械 Part 拆分、混意图，根子全在这里——SOP 没给聚类足够约束，AI 自动聚类就只能产出半成品。

**建议：** 第一部分补五条硬规则——① 1+N 必须合并近义词，禁止近义变体各成一页；② 相关性 + 负向词闸门（对齐 v0.7 §7.3）；③ 指标 VLOOKUP 接回关键词主表；④ 集群按**子意图**拆，禁止按数量机械拆 Part；⑤ 每簇打 `us_share` 三档标签。

### B-2 ｜P1｜"上限 7 个、溢出拆 Part X/Y" 规则本身有缺陷

**现象：** v2.0 标准表头 Associated Keywords 注明"上限 7 个，溢出需拆分为 Part X/Y"。

**影响：** 这条规则直接造成 A-3 的 42 词 → 6 页。它把"单页关联词的展示上限"误用成了"页数拆分依据"。同意图的词不管多少都该一页。

**建议：** 明确——7 只是"单页 secondary 关键词的展示上限"；词超了说明头词太宽，应按真实子意图细分，不是按字母序切 Part。

### B-3 ｜P1｜T3"不搜证、直接 AI 组装、查开头即发"对 DR-0 新站有 Google 风险

**现象：** v2.0 Tier 3 "极速覆盖：不搜证，直接让 AI 组装，检查开头即可发布，工时 10min 内"。

**影响：** Google 2024–25 的 helpful-content / scaled content abuse 更新专门打击量产、薄、低信息增益的 AI 内容。DR-0 新站若大比例发 T3 纯 AI 页，有整体降权风险。

**建议：** ① T3 仍需一个"信息增益 / 唯一性"快检（不只看开头），哪怕 30 秒；② 对 T3 占全站比例设上限（建议 ≤ 60%），不让站点变成纯 AI 农场；③ 与 v0.7 §7.5 审核产能模型对齐。

### B-4 ｜P1｜缺 E-E-A-T / 作者信号

**现象：** QA 红线有"文末 References"，但没有作者署名、作者简介、专业背书的要求。

**影响：** 占星 + healing / HSP / anxiety 内容属 YMYL 邻接，2026 年 Google 对这类内容看重 E-E-A-T。无作者信号会压低这类页面的信任与排名。

**建议：** QA 红线加一条——疗愈 / 心理类页面（精修线）必须有作者署名 + 一句作者相关背景；站点需有 About / 作者页。

### B-5 ｜P1｜缺 GEO/AEO（AI 搜索引用优化）

**现象：** `keyword-research-sop.md` 有完整第八章 GEO/AEO，v2.0 内容 SOP 完全没提。

**影响：** aura / 定义类词是高 AIO 风险，内容结构需为 AI 引用优化（结构化答案、表格、实体清晰）。v2.0 的 Definition 模板有 Answer Lock（对 AEO 友好）是好的，但没有显式 GEO 清单。

**建议：** 补一条 GEO 检查项——定义 / 对比类页面顶部结构化答案、关键数据用表格、命名实体清晰、作者署名，引用 keyword-research-sop 第八章。

### B-6 ｜P1｜缺发布后闭环 —— W20 评审已提，v2.0 未修

**现象：** v2.0 五步止于"Step 5 双向语义布线"，没有 Step 6 数据复盘。v2.0 有 GSC Keywords / Last Audit 列，但没有用它们的工作流。

**影响：** **这一条在 W20 对 v0.18 的评审（P1.1 第二条）里已经明确指出过，v2.0 作为后继版本仍未修。** 内容发出去后没有"7/14/30 天复盘 → 刷新"的闭环。

**建议：** 补 Step 6 发布后复盘，或在 SOP 里显式引用 v0.7 §7.9 的 Day 14/30/60 刷新规则。

### B-7 ｜P2｜内链规范只到 Pillar↔Spoke

**现象：** Step 5 只规定 Spoke→Pillar、Pillar→Spoke。

**影响：** 缺 Spoke↔Spoke 兄弟链、跨簇链、锚文本指引——建主题权威需要兄弟链与合理锚文本。

**建议：** 内链规范补兄弟链（同簇 Spoke 互链 1–2 条）、锚文本用目标词的自然变体。

### B-8 ｜P2｜其他

- 角色靠"行位置"判断（主行 / 留空 / 次行），一排序 / 筛选即失效。v0.7 选题登记表 v2.1 已用显式 `page_role` 列修复，v2.0 应同步。
- SOP 标 v2.0 却引用"提示词 v0.19"，版本号不一致，应对齐。

### 与 W20 评审的连续性

W20 评审过 v0.18，v2.0 是其后继。对照修复情况：

| W20 对 v0.18 的发现 | v2.0 是否修复 |
|---|---|
| 缺 SOP frontmatter | ✅ 已修（v2.0 有 frontmatter）|
| 缺发布后闭环（Step 6 数据复盘）| ❌ 未修（见 B-6）|
| Tier 定级过粗 | ⚠️ 部分修（加了 6:3:1 SERP 快败规则，仍缺 DR 分布 / Featured Snippet 维度）|
| 缺战略字段（market / language / bucket / strategic_fit）| ⚠️ 部分修（有月搜索量 / KD，仍缺 market / language / bucket）|
| 提示词文件用 obsidian 内部链接 | ⚠️ 仍引用内部链接 `提示词 v0.19` |

### B 优化清单

1. 第一部分补五条聚类硬规则（B-1）——这条修了，A 文档二次聚类才有依据。
2. 改"上限 7 拆 Part"规则为"按子意图拆"（B-2）。
3. T3 加唯一性快检 + 全站占比上限（B-3）。
4. QA 红线补 E-E-A-T 与 GEO 检查项（B-4 / B-5）。
5. 补 Step 6 发布后复盘（B-6，W20 已提）。
6. 内链补兄弟链；角色改显式列；版本号对齐（B-7 / B-8）。

---

## 三、合并行动清单（按优先级）

| 优先级 | 行动 | 对应 | 建议 owner |
|---|---|---|---|
| P0 | v2.0 第一部分补五条聚类硬规则 | B-1 | SEO 运营（Ma Boyang）|
| P0 | 集群文档撤 Independent Posts，词回收进真簇 | A-1 | SEO 运营 |
| P0 | 集群文档应用 1+N 合并近义词，消除同类相食 | A-2 | SEO 运营 |
| P1 | 42 个 calculator 词归一页；改 v2.0 Part 拆分规则 | A-3 / B-2 | SEO 运营 |
| P1 | 集群文档接回主表指标（修 VLOOKUP）| A-4 | SEO 运营 |
| P1 | 拆混意图簇、剔越界 / 垃圾词、打 us_share 标签 | A-6 / A-7 | SEO 运营 |
| P1 | v2.0 补 Step 6 发布后复盘（W20 已提）| B-6 | SEO 运营 |
| P1 | v2.0 T3 加唯一性快检 + 占比上限 | B-3 | SEO 运营 |
| P1 | v2.0 补 E-E-A-T 与 GEO 检查项 | B-4 / B-5 | SEO 运营 |
| P2 | v2.0 内链补兄弟链；角色改显式列；版本号对齐 | B-7 / B-8 | SEO 运营 |
| P2 | 集群文档 `status: final` → `draft` | A 总评 | SEO 运营 |

> 执行顺序：先修 B-1（给聚类立规则），再据此重做 A 文档（A-1/A-2/A-3/A-4/A-6/A-7），最后补 B 的 SOP 其余条目。

---

## 附：与 v0.7 PRD 的对应

A / B 的多数问题，v0.7 PRD 已有处理路径，本评审是把这些 PRD 决策对照两份运营文档落到具体待办：

| 评审发现 | v0.7 对应 |
|---|---|
| 垃圾词 / 相关性（A-7 / B-1）| §7.3 负向词否决 + 相关性闸门 |
| 地区错配（A-7）| §3.3 us_share 三档标签 |
| 角色靠行位置（B-8）| 附录 C 选题登记表 v2.1 显式 page_role |
| 缺发布后闭环（B-6）| §7.9 Day 14/30/60 刷新规则 |
| v2.0 作为现行内容 SOP | §4.3 已采纳 v2.0、v0.18/v0.19 superseded |
| 集群级 Brief（A 文档应升级为）| §7.5.1 集群级 Brief 字段 |

---

*评审人：Lynne Wang（经 Claude 协助）｜2026-05-18 / 2026-W21｜咨询性评审，非 /perf-audit-seo 正式评审*
