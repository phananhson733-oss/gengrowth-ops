---
title: SEO Prompt v0.19 Cluster Edition — 多视角评审
date: 2026-05-22
updated: 2026-05-22
type: perf-feedback
author: wzb
reviewer: wzb
reviewee: Ma Boyang
artifact: inbox/03-content-briefs/2026-05-14-seo-cluster-prompts.md
status: review-complete
tags:
  - seo
  - prompt-engineering
  - perf-feedback
aliases:
  - 2026-W21 v0.19 prompt review
---

# v0.19 Cluster Edition Prompt — 5 视角综合评审

## TL;DR

5 个独立评审视角（4 个 subagent + GPT-5.2 via Codex MCP），对 `inbox/03-content-briefs/2026-05-14-seo-cluster-prompts.md`（v0.19 Cluster Edition，110 行）做了平行盲评。

**总评**：方向对，3 个设计亮点值得保留，但 **5/5 视角一致认为不能 ship as-is**——存在 1 个 P0 幻觉雷 + 1 个 prompt 内部矛盾。最稳的路径是把 3 个亮点 backport 到现有 v8 pipeline，而不是用 v0.19 替换 v8。

**已落地**：本次 review 后，3 个 v0.19 亮点已通过 **P-11 patch** 写入 `gengrowth-flow-mvp/tools/scripts/lib/content-draft-templates/{definition,pillar}.prompt.md`。下批文章自动受益。

---

## 评审视角分配

| # | 视角 | 关注点 |
|---|---|---|
| 1 | Hallucination risk auditor | 是否会引导 LLM 编造作者 / 数字 / 引用 |
| 2 | SEO + EEAT 策略 | 6 维评分 + 头部页基准对比 |
| 3 | Prompt engineering 鲁棒性 | 变量插值边界 / batch 模式适配性 |
| 4 | v0.19 vs v8 diff | 现有 v8 pipeline 的取舍 |
| 5 | Codex（GPT-5.2 via MCP） | 独立 LLM 视角的二次校验 |

---

## 共识矩阵（5 视角对每个发现的一致度）

| 发现 | Halluc | SEO | PromptEng | Diff | Codex | 共识 |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| References 强制 3 个 URL = P0 幻觉雷 | P0 | 3/10 | failure #3 | C1 conflict | P0 | **5/5** |
| Pillar/Spoke fork 值得保留 | — | 8/10 | — | A1 port | port | **3/5** |
| Logic_Mechanism trade-off 句式 | — | — | — | A3 port | port | **2/5** |
| 第一段 bolded direct answer | — | 9/10 | — | — | keep | **2/5** |
| Anti-AI 词表过时 / 漏 delve / crucial | — | — | extend | A partial | — | **2/5** |
| 字数无上限 → 鬼故事风险 | — | — | — | B6 | line 45 | **2/5** |
| 不能通过 v8 Phase 2 validator | — | — | — | B1 | multi-line | **2/5** |

---

## P0 风险（必须解决，5/5 共识）

### P0-1: References & Works Cited 强制条款

**条款**（v0.19 lines 89-94）：

> Create a dedicated `### References & Works Cited` section. List at least 3 **REAL and functional URLs** to authoritative sources. Source Quality: Prioritize official domains (e.g., .gov, .edu, or industry-leading platforms like NASA.gov, Britannica.com, or specialized authority sites).
>
> *MANDATORY: Do not use placeholders. If you cannot find a specific article URL, provide the official homepage of the relevant authoritative organization.*

**为什么 P0**：

1. **幻觉概率几乎是 100%**——LLM 没有联网（即使联网也不知道 URL 是否还存活），但被强制要求"列 3 个真实 URL"。结果：
   - Claude 倾向编一个看起来对的 `.gov` URL（`cdc.gov/wellness/auras`——不存在）
   - GPT 倾向编一个 Britannica article（`britannica.com/topic/aura-energy`——不存在）
   - Hermes-4 倾向直接给主页（`nasa.gov`）规避，但放在 astrology 文章里离题
2. **EEAT 净负**——SEO 视角评分 3/10。在 astrology / spirituality niche，`.gov` 引用其实是 authority mismatch 信号（NASA 不背书 astrology），Google 算法读出来是不匹配。
3. **触发 v8 现有"权威锚点"硬规则**——v8 Definition 模板 line 184-190 明令：「绝不命名具体作者 / 书名 / 论文 / 年份 / 大学 / 实验室」。v0.19 这条直接冲突。

**建议**：删除整个 References 强制条款。如果一定要做权威信号，改成 _paraphrased attribution_：「In subtle-energy traditions...」「Practitioners commonly describe...」——这正是 v8 已经做的。

---

### P0-2: Prompt 内部自相矛盾（Codex 独家发现）

**条款冲突**：

- 行 11-17：「⚠️ MANDATORY PROTOCOL: STOP & REQUEST ⚠️ **DO NOT generate the article yet.** Upon receiving this prompt, your FIRST and ONLY response must be: ... Stop and wait for my input.」
- 行 110：「**Start immediately with the H1.**」

**为什么 P0**：

同一个 prompt 同时要求「不要生成文章，等我输入」和「立即开始 H1」——**任何 LLM 都无法同时遵守**。三家会任意选边：

- 严格 STOP 模式（Claude 常态）→ 永远只回变量列表，第一次永远不生成文章
- 严格 GENERATE 模式（GPT-5.2 / Hermes 常态）→ 跳过 STOP 协议，直接进入文章生成

3 家行为完全无法预测——批量场景下不可用。

**建议**：去掉 STOP & REQUEST，改成由 wrapper script 在 paste 之前先把变量都填进去再 paste。这是 prompt scaling 的常识——「LLM 不该用来做 form input collection」。

---

## P1 风险（应该解决）

| 风险 | 视角 | 建议 |
|---|---|---|
| **Expert Attribution weasel phrases**（"According to industry consensus...", "Leading researchers suggest..."）= 给伪学术权威开绿灯 | Hallucination | 删掉这条，用 v8 的 paraphrased attribution 模式 |
| **强制 Mandatory Table** 在 spirituality niche 是错的 | SEO 策略 | 表格不是不能用，但 Allure / Co-Star / Mindbodygreen 这些头部页是 prose-heavy，表格应该限制在 Quick Reference 这种结构性 section（v8 已经这样做） |
| **`{{Spoke_Topics}}` 为空时的多 LLM 分裂行为**：Claude 静默跳过 / GPT 把 `{{Spoke_Topics}}` 字面打印 / Hermes-4 凭空编 5 个 fake spokes | Prompt 工程 | 渲染器层必须保证：空值 → 跳过整个 H2 / 而不是把字面变量名露给 LLM |
| **字数无上限**——只规定下限（1800/1000/500 words by Tier） | Diff + Codex | 应该有 `word_range = (lower, upper)`，单边硬性约束会让 LLM 失控膨胀，伤害 dwell time |

---

## P2 提示（小颗粒）

- **Anti-AI 词表过时**：现有的 `synergy / leverage / game-changing / revolutionize / robust / seamless / unlock` 覆盖了 2023 GPT-3.5 时代的常见词。**2026 时代漏掉了**：`delve, harness, foster, cultivate, navigate (the landscape), embark, journey through, In conclusion`——这些是 GPT-5 / Claude Opus 4.x 的新「企业培训手册」回退词。Reflection Prompts 段尤其爱跑 `delve into your feelings` / `navigate this energy`。
- **Paragraph Limit "No single paragraph should exceed 4 lines"**——4 lines 在哪个屏幕宽度 / 字号下？建议改为 word-based（如 ≤ 60 words/paragraph）。
- **Heading level 没有字面约束**——v8 显式禁止 `### H3` / `#### H4`，v0.19 没有，会导致结构 drift。

---

## v0.19 值得保留的 3 个亮点（已落地到 v8）

下列亮点 5 视角一致认可，本次 review 后已通过 **P-11 patch** backport 到 v8 pipeline：

### A) Bolded direct answer 在第一段 (lines 73-74)

> The first 120 words must contain the `{{Target_Keyword}}` and a **bolded direct answer**.

**为什么好**：AI Overview / Google featured snippet 抓取的就是这个。一段散文里有 1 个 bolded 12-词短语，直接喂给 SGE。

**v8 落地**：
- Definition Section 1（What is X?）现强制要求 120-160 词内出现**正好 1 个** `**...**` bolded 短语，是 target_keyword 的直接答案 / 核心定义（≤ 12 词）
- Pillar Section 1（What are X?）同理，≤ 14 词（family 级定义稍长）
- 含 ✅ / ❌ 范例（防 GPT bold 装饰词、bold H2 字面重复）

### B) Logic_Mechanism trade-off「To get A, you sacrifice B」(line 75)

> Explain the `{{Logic_Mechanism}}` strictly as an operational trade-off ("To get A, you sacrifice B").

**为什么好**：v8 的 Section 3 已经要求 mechanism + trade-off，但 LLM 容易写成抽象「each has pros and cons」。强制句式让取舍**可读出来**，提升「读起来像专家在写」的信号。

**v8 落地**：
- Definition Section 3（{{entity}} vs Adjacent Concepts: Mechanism + Trade-offs）现强制每段对比至少 1 句用「To get A, you sacrifice B」句式
- Pillar Section 5（How Shade and Combination Shift Readings）同理
- 含 ✅ / ❌ 范例

### C) Anti-AI 词表扩充 (lines 98-100)

**为什么好**：v0.19 的词表方向对（synergy/leverage/game-changing/revolutionize/robust/seamless/unlock），但漏 2025-2026 时代的新词。

**v8 落地**：在 6 红线之前新增 `## Anti-AI 词汇 blocklist` 段，包括：
- **陈词滥调动词**：delve, leverage, navigate (the landscape), unlock, harness, foster, cultivate, embark on, journey through
- **空洞形容词**：seamless, robust, holistic, comprehensive, multifaceted, transformative, profound, revolutionary, game-changing
- **填充短语**：In conclusion, In summary, It's important to note, At the end of the day, In today's fast-paced world, In the realm of, A myriad of, Plays a (crucial / pivotal / vital) role
- **伪学术 hedging**（与 v8 权威锚点规则一致）：According to industry consensus, Leading researchers suggest, Studies have shown that (without naming)
- 正确替代映射表 + self-check 指引

---

## 不建议保留的 v0.19 设计

| 设计 | 为什么不保留 |
|---|---|
| **STOP & REQUEST 协议** | 内部自相矛盾（P0-2）；batch 场景不可用；wrapper script 填变量更可靠 |
| **References & Works Cited 3 个真实 URL** | 100% 幻觉概率（P0-1）；EEAT 净负；冲突 v8 权威锚点规则 |
| **Expert Attribution weasel phrases** | 给伪学术权威开绿灯（P1） |
| **Pillar/Spoke fork 变量（`{{Parent_Pillar}}`）** | 思路对，但 v8 现有 `internal_link_rule` + `cluster_jtbd` + Section 6 wikilinks 已经覆盖；引入新变量需要改 renderer，ROI 低。如果未来需要 spoke 页显式 link 到 pillar，可作 P-12 patch |
| **Mandatory Table for all Tier 1/2** | v8 已有 Section 4 Quick Reference Table 硬约束。再加全文级 mandatory table 会逼 LLM 在不该用表的 section 塞表 |
| **Paragraph Limit "4 lines"** | 度量模糊（哪个屏宽？）；v8 用 word-based 更稳 |

---

## v8 现状对比（截至 2026-05-22）

| 维度 | v8 + P-11 | v0.19 |
|---|---|---|
| 模板数 | 2 (Definition / Pillar) | 1 (统一 + fork) |
| Phase 2 validator | 6 binary check 全自动 | 无 |
| Cluster 意识 | `cluster_jtbd` + `internal_link_rule` | `{{Parent_Pillar}}` 变量 |
| Anti-hallucination 引用规则 | 禁止具名引用 | 强制 3 个真实 URL（冲突） |
| Anti-AI 词表 | 32 词 / 4 类 + 替代映射 | 8 词 + transitions |
| Bolded direct answer | ✅（P-11） | ✅ |
| Trade-off 句式 | ✅（P-11） | ✅ |
| 实测验证 | 5 entity / 2 template / 6 articles 全 6/6 PASS | 未验证 |

---

## 建议 next step

1. **Ma Boyang** — 下次 prompt 迭代时可以参考 v8 的两个模板：`gengrowth-flow-mvp/tools/scripts/lib/content-draft-templates/{definition,pillar}.prompt.md`。重点看 P-11 落地的 3 段（Section 1 bolded answer / Section 3 or 5 trade-off / 全局 Anti-AI blocklist）的写法 + 范例对照风格。
2. **如果想保留 v0.19 的 Pillar/Spoke fork 变量结构**，可以提一个具体 use case（哪个 cluster / 哪些 spokes），评估 P-12 patch 落地成本。
3. **如果想加 References 段提升 EEAT**，方向应该是 paraphrased attribution（traditional teachings describe... / practitioners commonly relate...），而不是强制真实 URL——后者在 LLM 生成场景必然幻觉。
4. **Anti-AI 词表如果还有待加的词**，欢迎补充。当前 32 词覆盖 2026 主流模型的回退词，但 GPT-5.2 / Hermes-4 / Claude Opus 4.7 各家的「招牌词」未来还会迭代。

---

## 引用

- v0.19 prompt: `inbox/03-content-briefs/2026-05-14-seo-cluster-prompts.md`
- v8 Definition template: `gengrowth-flow-mvp/tools/scripts/lib/content-draft-templates/definition.prompt.md`
- v8 Pillar template: `gengrowth-flow-mvp/tools/scripts/lib/content-draft-templates/pillar.prompt.md`
- v8 Phase 2 validator: `gengrowth-flow-mvp/tools/scripts/_phase2-validate.mjs`
- v8 实测 6 篇 sample articles: `内容资产/astrologywiki/v8-drafts-2026-05-22/`
- 关联 memory: `prompt-scaling-failure-modes.md`, `v8-structural-section-no-prose-intro.md`
