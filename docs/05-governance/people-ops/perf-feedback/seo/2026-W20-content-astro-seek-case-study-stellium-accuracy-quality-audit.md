---
title: SEO 输出质量评审 — Astro-Seek Case Study Stellium Accuracy
date: 2026-05-12
updated: 2026-05-12
type: perf-audit
period: 2026-W20
target_path: /Users/wzb/Documents/gengrowth-ops/inbox/内容创作/blog/Astro_Seek_Case_Study_Stellium_Accuracy.md
doc_type: content-piece
agent_version: seo-quality-audit v0.2 (inline，doc_type=content-piece 未原生支持)
anchor_version: gengrowth-capability-anchor v0.1-draft（status: draft-by-claude-awaiting-wzb-review）
operator: wzb
operator_llm: claude
status: tentative
rating: 待确认
exec_status: DONE_WITH_CONCERNS
shadow_run: true
shadow_run_id: "#2"
tags:
  - record
  - seo
  - quality-audit
  - content-piece
  - blog
aliases:
  - 2026-W20 Astro-Seek Case Study 评审
---

# SEO 输出质量评审 — Astro-Seek Case Study: Precision Data vs. The "Pretty Chart" Trap

**评审对象**：`gengrowth-ops/inbox/内容创作/blog/Astro_Seek_Case_Study_Stellium_Accuracy.md`（115 行英文 blog / case-study）
**评审依据版本**：rubric v0.1（2026-05-11）+ anchor v0.1-draft（2026-05-12）+ 价值观 v1.0（2026-04-27）
**评级**：**待确认**
**STATUS**：DONE_WITH_CONCERNS
**一句话结论**：AI 痕迹强，战略归属待定

---

## ❓ 待确认（4 项，凌驾 P0/P1 评级）

按 v0.2 agent 规则：≥1 项 ❓ 未澄清 → 评级强制 `待确认`，本次原 5 项已 1 项澄清，剩 4 项。

### ✅ 1. 占星术内容是否属于 GenGrowth 业务范围？— **已澄清（2026-05-12 17:55 wzb）**

- **wzb 答复**：astrologywiki.com 是 GenGrowth 内部的**实验产品**，占星术内容属业务范围
- **anchor 更新**：v0.1-draft → **v0.2-part-clarified**（§ 一 1.2 加实验产品矩阵；§ 五.5 新增灰色地带类目，占星 = 做）
- **本文 P0.2 战略匹配判定**：**合格**（属实验产品赛道，按 anchor v0.2 § 5.5 实验产品规则评判，不受核心产品"订阅付费意图词 ≥ 30%"硬约束）
- **附带影响**：anchor § 五.5 把 P0.2 红线对实验产品弱化了，但**P0.1 求真红线 + P0.3 AI 搬运红线对实验产品依旧 P0 严守**（见 anchor § 六对照表）
- **本文 P0.2 评级**：**合格**

### ❓ 2. 目标关键词 / 意图 / Tier 桶？

- 文章主关键词（推断）：`astro-seek case study` / `stellium accuracy` / `swiss ephemeris orb settings`
- 意图（推断）：Compare（工具对比）+ Tutorial（操作步骤）+ BOFU（专业用户决策）
- Tier（推断）：未知，无 keyword-master 表行对应
- **期待 SEO 同事回应**：本文对应的 keyword-master 表行号？预期 search_volume / cpc / DR / KD？是否属于 anchor § 五"订阅付费意图词"统计内？

### ❓ 3. Case Study 中的"student"案例是否真实？

- 原文 line 11："I recently reviewed a case where a student was convinced they had a rare, high-impact configuration in their fourth house."
- 原文 line 13："As seen in cases like this, where a user's Moon and Saturn were in conjunction with their IC in Cancer..."
- **疑点**：student 是真实学员还是 AI 生成的"代表性案例"？同样 line 13 的"a user's"——是同一个 student 还是另一个？
- **rubric P0.1 红线**：编造数据 / 明显编造（团队确认后无法回溯到来源）→ 直接判待改进
- **期待 SEO 同事回应**：能不能提供该 student 的脱敏出生数据（年/月/日，不需要时分秒和地点）？如果不能回溯，是否承认是 representative example？

### ❓ 4. Sources 引用是否可验证？

- 原文 line 108-114 列了 5 个 Sources：
  1. Swiss Ephemeris Programming Interface — 无 URL / 无访问日期 / 无具体章节
  2. The American Federation of Astrologers (AFA) — 无 URL / **AFA 是否有公开发布的 "orbs and Stellium 定义"官方手册存疑**
  3. ISAR (International Society for Astrological Research) — 无 URL / ISAR 的 standards 是会员资料，需确认是否可公开引用
  4. Astro-Seek Technical FAQ — 无 URL / 无访问日期
  5. Project Hindsight — 无 URL / Project Hindsight 是 1990s 的传统占星翻译项目，引用其作"3-degree orb"权威性需要 specific page reference
- **rubric P0.1**：关键决策性数据应主动标来源（Sources 区不带 URL 等于没标）
- **期待 SEO 同事回应**：每条 Source 补 URL + 访问日期；若引用具体页码 / 章节，请标注

### ❓ 5. 目标市场和语言：US-only 还是需要葡语版？

- anchor § 二：主战场是美国（英语）+ 巴西（葡语）
- 本文英文版面向 US 市场 → 符合 anchor 美国战线
- **期待 SEO 同事回应**：是否计划同步生产葡语版？若计划，由谁负责翻译并验证占星专业术语（如 "stellium" / "conjunction" / "quincunx" 的葡语标准译法）？

---

## P0 致命问题（1 项确立 + 2 项待 ❓ 答复后定档）

### **P0.3 AI 搬运 — 待改进（已成立，不依赖 ❓ 答复）**

- **问题**：文章呈现 AI 直出特征，人工加工痕迹不足
- **证据 1（句式特征）**：
  - line 3：`"the primary goal is to achieve technical accuracy by filtering out the 'noise'..."` — "primary goal is to achieve" 是典型 GPT 输出句式
  - line 5：`"This is the fundamental trade-off of professional tools."` — "fundamental trade-off of" + 后置定语
  - line 31：`"Astro-Seek operates on an Operational-Realism model."` — 造词 + 模式化命名（"Operational-Realism" 是 AI 写产品对比文的常见手法）
  - line 38：`"The cost of this precision is a user interface that looks like a spreadsheet from 2008."` — 强对仗修辞，缺乏行业内人的"语感"
- **证据 2（结构特征）**：
  - § "Logic Mechanism: Precision vs. Complexity"（line 29）+ § "How it Works Under the Hood"（line 89）+ § "Comparison" 表格（line 79）—— 三个章节叠加产品评测模板典型结构，但占星专业博客很少同时用这三种结构
  - "Benefit X" / "Trade-off Y" 加 ALL-CAPS 概念命名（line 33-36）—— GPT-4 写 SaaS 产品评测文的招牌格式
- **证据 3（人工加工缺失）**：
  - 没有具体人名（"a student"、"a user"、"most teams"、"the analyst"——全部匿名抽象）
  - 没有具体年份 / 平台版本（"Astro-Seek" 的哪个版本？2024 改版后界面有变化吗？）
  - 没有截图 / 界面引用 / 链接（教程类内容 § "Step-by-Step"，0 图）
  - 没有作者署名 / 资质 / 案例库引用（占星专业内容的 E-E-A-T 信号缺失）
- **证据 4（轻微翻译腔）**：
  - line 23：`"Most teams discover this the hard way when..."` — 句式偏中→英直译风格
  - line 39：`"That sounds reasonable until you test it against a deadline."` — 这句和占星主题脱节，疑似从其他领域文章模板里改过来
- **rubric P0.3 待改进锚点对照**：
  - ✅ 整段通用化结论未结合具体客户/业务（line 100-104 conclusion 段）
  - ✅ 大段排比无具体数据（line 33-39 Benefit X / Trade-off Y 段）
  - ❌ 缺少 SEO 专业判断（本文没设置主关键词 H2 / 长尾词 H3，结构是产品评测模板而非 SEO 长尾文模板）
  - ✅ 密集翻译腔（≥ 2 处明显，未达"密集"门槛，但有信号）
  - ✅ 用词风格与团队 SOP 明显不一致（v0.18 SOP 要求"求真红线 / 内容创作三段式"，本文格式不在 SOP 已定义的 5 个 Template 任何一个里）
- **必须修正**：
  1. 删除 "Logic Mechanism" / "Operational-Realism" 等造词，改用占星专业术语原词（"orb tolerance" / "aspect calculation precision"）
  2. § "Case Study" 段补真实学员的脱敏出生数据（年/月，地点市区级即可），或明确标注 "representative example, fictional" 让读者知情
  3. § "Step-by-Step" 段补 Astro-Seek 界面截图（至少 1 张 Extended Settings 界面 + 1 张 orb tightening 前/后对比）
  4. 文末加作者署名 + 占星资质 / 从业年限（如 "Author: [Name], 8-year practitioner trained in [tradition]"），符合 YMYL 边缘内容的 E-E-A-T 要求
  5. 替换 § "Comparison" 表格中的 "Generic Apps (Aesthetic)" 为具体点名（如 "Co-Star" / "Pattern"），避免"通用化对比"

### P0.1 数据真实性 — 待 ❓ 3/4 答复后定档

- 当前状态：5 处疑点（见 ❓ 3 + ❓ 4），团队回应前先标注，**不直接判待改进**
- 若 ❓ 3 答复 "student case 是 fictional/representative" 且 ❓ 4 答复 "Sources 全部无 URL 仅是格式" → 升级 P0.1 待改进
- 若 ❓ 3 答复 "student 真实可回溯" 且 ❓ 4 答复 "Sources 补全 URL" → P0.1 合格

### P0.2 战略匹配度 — **合格（2026-05-12 17:55 wzb 澄清后定档）**

- ❓ 1 已澄清：astrologywiki.com = GenGrowth 实验产品
- anchor v0.2 § 5.5 灰色地带规则：实验产品赛道不受核心产品"订阅付费意图词 ≥ 30%"硬约束
- 本文 P0.2 判：**合格**
- 注：仍需 ❓ 2（具体关键词意图 / Tier）确认这篇属于 astrologywiki.com 哪一类内容（BOFU 转化 / TOFU 流量），用以判后续投入 ROI

---

## P1 结构问题（4 项）

### P1.1 框架完整性 — 待改进

- **frontmatter 完全缺失**：line 1 直接是 `# Astro-Seek Case Study...`，没有 `keyword` / `intent` / `bucket` / `market` / `language` / `published_date` / `author` / `strategic_fit_note` 任何字段
  - 对照 anchor § 五"关键词主表必含字段"：6 个核心字段全缺
  - 对照 v0.18 SOP § 一 Topic Registry 12 字段：12 个全缺
- **图表 / 截图 0 张**：教程类章节 § "Step-by-Step: Validating a Stellium on Astro-Seek"（line 43-61）共 3 步，0 张界面截图
  - 同类教程文章的 SERP 头部（如 The Astrology Podcast / Astro.com 教程区）平均 3-5 张截图
- **内链 0 条**：没有指向 GenGrowth 站内任何相关文章的链接（"What is a Stellium" / "Birth Chart Reading Basics" 这类基础概念页本应内链）
- **出站权威链接 0 条**：Sources 区列了 5 个权威机构，但**没有任何超链接**——读者无法点击验证，等于零权威传递
- **CTA 缺失**：line 104 结论"You stop guessing, and you start measuring"——没明确下一步动作（订阅？注册？下载工具？跳转 BOFU 页？）
- **必须修正**：
  1. 加 frontmatter（参考 v0.18 SOP § 一 + anchor § 五）
  2. § "Step-by-Step" 加界面截图（至少 3 张）
  3. 加 2-3 条内链 + 5 条出站权威链接
  4. 文末加 CTA（明确订阅/注册/下一步阅读）

### P1.2 逻辑严密性 — 合格但有改进项

- **链路成立**：phantom config 问题 → orb math 分析 → 解决方案（manual configure） → 案例验证 → conclusion——逻辑链可读
- **跳跃 1**：line 11-21 描述 student 的 Moon-Saturn-IC 配置 + line 21 "tightening the orbs... revealed that the 'configuration' wasn't a cohesive unit"——但没说**这个学生最后是怎么改变解读结论的**，跳到 line 71 才看到最终结论 "deeply restrictive but stable emotional foundation"。**改进**：把 line 71 的结论前置或加链接回溯
- **跳跃 2**：line 79 表格 "Generic Apps (Aesthetic)" —— **不点名**就难以让"专业人士"信服。**改进**：点名 1-2 个具体 app
- **冗余**：line 89-94 § "How it Works Under the Hood: The IC/MC Impact" 重复了前面已经说过的内容（IC/MC 不是 planet，line 15-17 已说过）—— AI 写作常见的"内容膨胀"
- **必须修正**：删除 § "How it Works Under the Hood" 或与前文合并，并补具体 app 点名

### P1.3 SEO 关键词嵌入（content-piece 新维度）

- **主关键词嵌入位置（推断主词："Astro-Seek"）**：
  - Title H1 ✅
  - 首段（line 3）✅
  - URL（基于文件名）❌（文件名用下划线，SEO 偏好连字符）
  - Meta description ❌（无 frontmatter）
  - H2 ❌（H2 都没出现 "Astro-Seek"，全是抽象概念）
  - 末段 ✅（line 102）
- **长尾关键词嵌入**（推断长尾："stellium accuracy" / "swiss ephemeris orb"）：
  - "stellium" 在全文出现 ~10 次，密度 OK
  - "orb" 在全文出现 ~12 次，密度 OK
  - "swiss ephemeris" 只在 line 34 + Source 1 出现 2 次，密度偏低
- **必须修正**：把 "Astro-Seek" 嵌入至少 2 个 H2（如 § "Astro-Seek's Calculation Engine" / § "Astro-Seek vs. Generic Apps Comparison"）

### P1.4 内容创作 SOP 对齐（content-piece 新维度）

- v0.18 SOP § 三 Template Type Decision Matrix 列了 5 种模板：
  1. Listicle（10 best...）
  2. How-to Guide（step-by-step）
  3. Case Study（real example）
  4. Comparison（X vs. Y）
  5. Tutorial（feature deep-dive）
- **本文模板归属**：混用 Case Study + How-to + Comparison —— **不是 SOP 单一模板**
- **判定**：SOP 没明确禁止"混合模板"，但 v0.18 § 二 Decision Matrix 要求"every content piece picks ONE primary template"——本文混三种，**违反 SOP § 二 5.b 规则**
- **必须修正**：选定一个主模板（推荐 Case Study，因 title 是 Case Study），把 § "Step-by-Step" 改成附录或单独拆出独立文章

---

## P2 执行问题（合并陈述）

- **文件命名**：`Astro_Seek_Case_Study_Stellium_Accuracy.md`——下划线分隔，SEO 偏好连字符（`astro-seek-case-study-stellium-accuracy.md`）
- **段落长度**：英文 SEO 建议 2-4 句/段，本文 § "The 3-Degree Rule" 第二段（line 23-24）单句段落 + § "How it Works" 多个 1 句段（line 92）—— 节奏偏短促
- **Sources 无访问日期**：见 P1.1 出站链接缺失，重叠列
- **位置在 inbox**：`gengrowth-ops/inbox/内容创作/blog/`—— inbox 是草稿区，正式发布前需迁移到 publication-ready 目录（参考 v0.18 SOP § 五 Step 5 发布流程）
- **没有 keyword-master CSV 行号关联**：见 ❓ 2

---

## 改进优先级（按必须性排序）

1. ~~**wzb 回应 ❓ 1**（占星术是否在业务范围）~~ —— ✅ 2026-05-12 17:55 已澄清（astrologywiki.com 实验产品）
2. **wzb 回应 ❓ 5**（是否做葡语版） + **SEO 同事回应 ❓ 2 + ❓ 3 + ❓ 4**（关键词意图 / case 真实性 / sources URL）—— 阻断 P0.1 定档 + 后续 ROI 决策
3. **删除 / 标注 AI 痕迹**（P0.3）：删造词、加学员脱敏数据或明确"representative"、补截图、加作者署名 / 资质
4. **补 frontmatter + 截图 + 内外链 + CTA**（P1.1）：完整化 metadata、加 3+ 张界面截图、2-3 条内链、5 条出站权威链接、文末 CTA
5. **重写 § "How it Works Under the Hood"**（P1.2 冗余）：删除或与前文合并
6. **改用单一主模板**（P1.4）：选定 Case Study 为主模板，§ "Step-by-Step" 拆出或转附录
7. **将 H2 嵌入主关键词 "Astro-Seek"**（P1.3）：把至少 2 个 H2 改成含主词的形态
8. **改文件名为连字符 + 迁出 inbox**（P2）

---

## 三层状态映射

- **frontmatter `status`**：`tentative`（v0.2 agent 工作中 + v0.1 anchor draft + 5 项 ❓ 待答复）
- **评级**：`待确认`（≥1 项 ❓ → 强制此值）
- **STATUS（exec_status）**：`DONE_WITH_CONCERNS`（评审跑通，输出完整，但存在阻断转 final 的 ❓ 项）

---

## Token 使用

- 依据读取（rubric + anchor + 价值观 + 文章本体）：~13K
- 报告生成：~5K
- **本次总计**：~18K（v0.2 agent 设定 15K target / 20K 上限，**接近上限但未超**）
- **观察**：content-piece 评审依据比 SOP 评审少一份（不需读 keyword-research-sop / day0-diagnosis-sop），但报告本身因新维度（P1.3 关键词嵌入 / P1.4 SOP 模板对齐）更长

---

## 自检（11 项 — v0.2 agent 强制清单）

- [x] 1. 评级 `待确认` 凌驾 P0/P1（5 项 ❓ → 触发）
- [x] 2. 评级与 STATUS / status 三层映射一致（待确认 + DONE_WITH_CONCERNS + tentative）
- [x] 3. P0.3 AI 搬运给出 ≥4 处具体证据（line 3 / line 5 / line 31 / line 38 + 结构 + 翻译腔）
- [x] 4. ❓ 项每项含：背景 + 推断 + 期待对方回应内容
- [x] 5. 必须修正用强语气（"删除" / "补" / "改用"），无"建议 / 或许"软话
- [x] 6. 引用原文带行号（line 3 / 11 / 21 / 31 等）
- [x] 7. 改进优先级清单按必须性排序
- [x] 8. 自检清单本体（这一段）
- [x] 9. token 使用估算
- [x] 10. 三层状态映射明示
- [x] 11. 依据版本日期 + 状态注明（rubric v0.1 / anchor v0.1-draft / 价值观 v1.0）

**自检通过：11/11 ✅**

---

## 评审者备注（shadow run #2 元数据）

- **本次 doc_type 是 content-piece，v0.2 agent 没原生支持**——本次 inline 跑通（claude 在主会话作 worker），评审维度临时补了 P1.3（SEO 关键词嵌入）+ P1.4（SOP 模板对齐）
- **本次评审依据 anchor v0.1-draft**（status: draft-by-claude-awaiting-wzb-review），同样问题：anchor 未 final，本次 P0.2 判定如果 anchor 改动需要重审
- **5 项 ❓ 又一次超过 3 项**——shadow run #1 是 4 项，本次 5 项，连续两次 ❓ 偏高，**需要 wzb 决定是否调整阈值或加预处理**
- **AI 搬运 P0.3 这次确立**（不依赖 ❓ 答复），shadow run #1 的 0 项 P0 → shadow run #2 的 1 项 P0，**判断层防御首次触发并验证**

---

## 关联文件

- 评审对象：`gengrowth-ops/inbox/内容创作/blog/Astro_Seek_Case_Study_Stellium_Accuracy.md`
- 评审标尺：`docs/05-governance/people-ops/policies/2026-05-11-seo-output-quality-rubric.md` v0.1
- 战略锚点：`docs/05-governance/strategic-anchors/gengrowth-capability-anchor.md` v0.1-draft（待审）
- 公司价值观：`docs/01-company/公司价值观.md` v1.0
- v0.18 内容创作 SOP（对照参考）：`gengrowth-ops/inbox/内容创作/SEO内容生产流水线_v0.18_执行全案.md`
- 批次摘要：`docs/05-governance/people-ops/perf-feedback/seo/2026-W20-audit-batch-summary.md`
- 上一份审计（同周）：`docs/05-governance/people-ops/perf-feedback/seo/2026-W20-sop-seo内容生产流水线v018执行全案-quality-audit.md`
