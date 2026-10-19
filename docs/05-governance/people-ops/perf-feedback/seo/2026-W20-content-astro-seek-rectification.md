---
title: SEO 整改清单 — Astro-Seek Case Study（合并 claude × codex 交叉审批）
date: 2026-05-12
updated: 2026-05-12
type: rectification
period: 2026-W20
audit_target: "/Users/wzb/Documents/gengrowth-ops/inbox/内容创作/blog/Astro_Seek_Case_Study_Stellium_Accuracy.md"
based_on:
  - "2026-W20-content-astro-seek-case-study-stellium-accuracy-quality-audit-v2.md (claude v0.3.3)"
  - "codex MCP thread 019e1bcd-884a-7e93-bc7a-d5beeac7a7ed"
  - "2026-W20-cross-check-summary.md"
operator: wzb
status: pending-seo-action
tags:
  - record
  - seo
  - rectification
  - content-piece
  - astrologywiki
aliases:
  - Astro-Seek 整改清单
---

# Astro-Seek 文章整改清单（合并 claude × codex 评审）

> **给 SEO 同事**：以下是 claude × codex 两边交叉审批一致同意的整改项。两边评级一致"待改进"，不需要等 ❓ 答复再改。直接干。
>
> **完成标准**：6 项必改 + 4 项 ❓ 一次性答卷后，wzb 复审升 final。

## 评级状态

- **claude v0.3.3 评级**：待改进（P0.3 6/6 类 AI 搬运信号全成立）
- **codex 评级**：待改进（P0.1 + P0.3 双 P0 成立）
- **两边一致** → 高置信度待改进 → 直接走整改流程

## 必改项（6 项，按优先级）

### 1. 删 / 改造词命名（P0.3 AI 搬运）

**问题**：以下造词是 AI 写作招牌，与占星专业写作脱节。

**原文引用**：

- line 27-29:
  > "## The Logic Mechanism: Precision vs. Complexity
  > To understand why Astro-Seek is the preferred engine, you have to understand the **Logic Mechanism** of how it processes data."
- line 31:
  > "Astro-Seek operates on an **Operational-Realism** model."
- line 33:
  > "### Benefit X: High Data Precision"
- line 36:
  > "### Trade-off Y: Technical Friction"
- line 102:
  > "It provides the 'Logic-Based Depth' required to distinguish between a significant life theme and a wide-orb coincidence."
- line 90:
  > "When you see a configuration involving the **Stellium** and these angles, the 'Logic Mechanism' shifts."

**为什么是问题**：占星专业写作不会用"Logic Mechanism" / "Operational-Realism" 这类工程化术语；ALL-CAPS 命名（Benefit X / Trade-off Y）是 GPT-4 写 SaaS 评测文的招牌结构。

**改成**：
- "Logic Mechanism" → "calculation method" 或具体"how Astro-Seek calculates aspects"
- "Operational-Realism" → 删（直接写"prioritizes data accuracy over UI polish"）
- "Benefit X / Trade-off Y" → 改正常 H3 标题（如 "High Data Precision" / "Technical Friction Cost"）
- "Logic-Based Depth" → 删，改"the technical depth required for professional analysis"

### 2. 真实案例（P0.1 + P0.3 加工缺失）

**原文引用**：

- line 11:
  > "I recently reviewed a case where a student was convinced they had a rare, high-impact configuration in their fourth house."
- line 13:
  > "**As seen in cases like this, where a user's Moon and Saturn were in conjunction with their IC in Cancer,** the interpretation hinges entirely on the software's math."
- line 17:
  > "In this specific case, the 'Moon-Saturn-IC' cluster looked like a powerhouse of emotional security and ancestral karma. But there was a technical hitch: the software had the orbs set so wide that it was catching a quincunx to a planet in another house at an 8-degree margin."
- line 21:
  > "In our case study, tightening the orbs on Astro-Seek revealed that the 'configuration' wasn't a cohesive unit at all—it was a series of separate, unrelated influences that the software had forced together for visual effect."

**为什么是问题**：rubric § P0.1 红线"明显编造（团队确认后无法回溯来源）→ 直接判待改进"。原文用"a student" / "a user" / "our case study" 全部匿名抽象，无年份 / 无截图 / 无具体度数 / 无软件版本——疑似 fictional 但写成 "I recently reviewed"。

**改法（择一）**：
- **A. 用真实案例**：补脱敏出生数据（年/月，城市级即可）+ 当时 Astro-Seek 截图（orb 调整前 / 调整后两张）+ 实际度数（如 "Moon 14°22' / Saturn 14°48' / IC 14°10'"）+ 软件版本（如 "Astro-Seek 2024 版"）
- **B. 标 representative example**：line 11 改为 "Consider a representative pattern (based on common cases): a student convinced they had a rare, high-impact configuration in their fourth house..." —— 明确告诉读者这不是单个真实案例

### 3. 五选一主模板 + 删泛化段（P1.4 SOP 模板对齐）

**问题**：本文混用 4 种模板（Case Study + How-to + Comparison + How-it-works），违反 v0.18 SOP "every content piece picks ONE primary template"

**改法**：
- **选定主模板：Case Study**（title 已是 Case Study）
- **删 / 缩减**：
  - § "Logic Mechanism: Precision vs. Complexity"（line 27-39）→ 缩为 1 段对比说明，删 Benefit X / Trade-off Y 结构
  - § "How it Works Under the Hood: The IC/MC Impact"（line 88-94）→ 删（与 line 15-17 重复）
  - § "Comparison: Astro-Seek vs. Generic 'Cute' Apps"（line 75-84）→ 改为案例内嵌"In our case, Astro-Seek's manual orb control let us..." 单行说明
- **保留**：Case Study 主线（line 9-23 + line 65-71）+ § "Step-by-Step"（line 43-61，作为 case 解决方案的附录）

### 4. 补可点击 Sources（P0.1 数据真实性）

**原文引用**（line 108-114）：

> ```
> # Sources
>
> 1.  **Swiss Ephemeris Programming Interface** - Documentation on the astronomical accuracy of planetary positions used by Astro-Seek.
> 2.  **The American Federation of Astrologers (AFA)** - Standards for aspect orbs and the definition of a planetary Stellium.
> 3.  **ISAR (International Society for Astrological Research)** - Guidelines on the use of mathematical points (ASC/MC/IC) in chart pattern identification.
> 4.  **Astro-Seek Technical FAQ** - Professional guidance on configuring "Extended Settings" for natal analysis.
> 5.  **Project Hindsight** - Historical context on the importance of the 3-degree orb in traditional and Hellenistic astrology.
> ```

**为什么是问题**：rubric § P0.1 要求关键决策性数据应主动标来源。5 条 Sources 全无 URL / 无访问日期 / 无页码——读者无法验证。AFA / ISAR 实际是否有该领域官方公开文档存疑——若 AI 编造权威，触碰 P0.1 红线。

**改法**：
- **Source 1 Swiss Ephemeris**：补 https://www.astro.com/swisseph/ + 访问日期 + 具体引用章节（如"Programming Interface Documentation, § 1 Introduction"）
- **Source 2 AFA**：核实 AFA 是否有公开 "standards for aspect orbs and Stellium" 文档——
  - 如有：补 URL + 页码
  - 如无：**删除此 Source 或改为非权威表述**（如"common practice in modern astrology" 而非 "AFA standards"）
- **Source 3 ISAR**：同上，ISAR standards 多为会员资料——
  - 如可公开引用：补 URL
  - 如不可：删 Source 或改非权威表述
- **Source 4 Astro-Seek FAQ**：补具体 URL（如 https://astro-seek.com/help-faq）+ 访问日期
- **Source 5 Project Hindsight**：补 URL + 具体翻译卷 / 章节（"Hellenistic Astrology, Vol. X, § Y"）

### 5. "3-degree quincunx" 权威性修正（codex 新 ❓）

**原文引用**：

- line 21:
  > "Here's the issue: if your software shows you a quincunx (150°) that is more than a 3-degree orb, then the orbs are set too large."
- line 59:
  > "*   **Quincunxes:** Strictly 3 degrees or less."
- line 69-71（结论性使用）:
  > "By tightening the orb to the 3-degree professional standard on Astro-Seek, that line vanished."

**为什么是问题**：文章把"3-degree rule"呈现为"the professional standard"（line 71）——这是行业共识？作者方法论？rubric § P0.1 要求关键决策性数据有可验证来源。本文 Source 5 引 Project Hindsight 但未给具体卷 / 章节。

**改法（择一）**：
- **A. 行业标准**：必须给具体权威来源（如"per traditional Hellenistic methodology, see Project Hindsight Vol. X"）
- **B. 作者方法论**：改为 "preferred working rule for quincunxes" 或 "my recommended threshold based on practitioner experience"——不冒充行业标准

### 6. 加 frontmatter + 截图 + 内外链 + CTA（P1.1 + P2.5-7）

**frontmatter（line 1 之前加）**：
```yaml
---
title: Astro-Seek Case Study: Precision Data vs. The "Pretty Chart" Trap
keyword: astro-seek case study stellium
keyword_secondary: swiss ephemeris orb settings
intent: Compare + Tutorial + BOFU
bucket: 长尾矩阵
tier: T2
market: US
language: en
product: astrologywiki.com
strategic_fit_note: BOFU 转化文，astrologywiki.com 实验产品赛道
author: {署名 + 占星资质 / 从业年限}
published_date: {YYYY-MM-DD}
keyword_master_row: {keyword-master/2026-W20.csv 行号}
---
```

**截图（教程 § Step-by-Step 内）**：
- Astro-Seek "Extended Settings" 入口截图（第 1 张）
- Orb 设置调整前界面截图（第 2 张）
- Orb 设置调整后界面截图（第 3 张）

**内链 ≥ 2 条**：
- 内链到 astrologywiki.com 的"What is a Stellium" 基础概念页
- 内链到 astrologywiki.com 的"Birth Chart Basics" 教程页

**外链 ≥ 3 条**：
- Sources 区每条 Source 都改为可点击超链接
- 外链 Astro-Seek 官方主页（line 3 第一次提到 Astro-Seek 时加）

**CTA（line 104 conclusion 后加）**：
- "Try Astro-Seek's advanced dashboard with our [free birth chart calculator](URL)"
- 或 "Subscribe to astrologywiki.com for advanced stellium analysis tutorials"
- 或具体下一步链接

## 4 项 ❓ 待 SEO 同事一次性答卷（v0.3.4 严宽映射）

> **v0.3.4 行动规则**：不答 = 接受严判（默认评级"待改进"维持），主动反证可降级到"合格"
> 但本对象 P0.3 已 6 类信号成立独立判 P0，**❓ 答案不影响主评级**（仍待改进），只影响：
> - P0.1 是否升级（多 P0 严重度）
> - 整改细节优先级

### ❓ 1. 目标关键词 / 意图 / Tier 桶？

- 本文对应 astrologywiki keyword-master CSV 哪一行？
- 主关键词 + 次关键词 + 意图分类 + Tier 桶位是什么？
- **回答方式**：填入 § 整改 6 frontmatter

### ❓ 2. Case Study "student" 案例真实性？

- 是真实学员脱敏案例 / 还是 representative example？
- **回答方式**：选 A（真实，提供脱敏数据）/ B（representative，明确标注）

### ❓ 3. Sources 引用是否可全部补 URL？

- 5 条 Sources 哪些可补 URL？哪些需要删除或改非权威表述？
- **回答方式**：按 § 整改 4 逐条回答

### ❓ 4. "3-degree quincunx" 是行业标准还是作者方法论？

- 选 A（行业标准，补权威来源）/ B（作者方法论，改非权威表述）

## P2 次要改进项（合并 claude × codex）

- 文件命名：`Astro_Seek_Case_Study_Stellium_Accuracy.md` → `astro-seek-case-study-stellium-accuracy.md`（下划线改连字符）
- 位置迁移：完成 6 项必改 + 4 项 ❓ 后，从 `inbox/内容创作/blog/` 迁到正式发布区
- 删除偏主观措辞："spreadsheet from 2008"（line 37）→ 客观化描述
- "Generic Apps (Aesthetic)" 表格（line 79-84）→ 点名具体 app（Co-Star / Pattern / Costar 等）或删

## 完成标准

- [ ] 6 项必改全部完成 → wzb 复审
- [ ] 4 项 ❓ 一次性答卷
- [ ] codex 二次复审（可选，看是否所有 P0 都消除）
- [ ] wzb 跑 `/perf-audit-seo --promote {本对象的 audit 报告}` 升 final

## 关联文件

- 本对象主审报告（claude v0.3.3）：`docs/05-governance/people-ops/perf-feedback/seo/2026-W20-content-astro-seek-case-study-stellium-accuracy-quality-audit-v2.md`
- Cross-check 摘要：`docs/05-governance/people-ops/perf-feedback/seo/2026-W20-cross-check-summary.md`
- 评审标尺：`docs/05-governance/people-ops/policies/2026-05-11-seo-output-quality-rubric.md` v0.1
- 战略锚点：`docs/05-governance/strategic-anchors/gengrowth-capability-anchor.md` v0.2-part-clarified
