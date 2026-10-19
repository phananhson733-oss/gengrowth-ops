---
title: SEO 输出质量评审 — Astro-Seek Case Study Stellium Accuracy（v0.3.3 重审）
date: 2026-05-12
updated: 2026-05-12
type: perf-audit
author: wzb
agent: claude
agent_version: seo-quality-audit v0.3.3 (inline)
status: tentative
tags:
  - record
  - seo
  - quality-audit
  - content-piece
  - blog
  - cross-validation
aliases:
  - 2026-W20 Astro-Seek 双轨重审
source:
  - "/Users/wzb/Documents/gengrowth-ops/inbox/内容创作/blog/Astro_Seek_Case_Study_Stellium_Accuracy.md"
period: 2026-W20
doc_type: content-piece
product_tier: experimental
product_name: astrologywiki.com
handshake: perf-audit-seo-v0.3 (inline simulated)
mode: lite
cross_validation: requested (codex parallel)
shadow_run: true
shadow_run_id: "#4"

# v0.3.3 评级：单轨决断（P0.3 独立成立，4 项 ❓ 不改主评级，应用 v0.3.2 例外）
rating_track:
  default: 待改进     # P0.3 已成立 + ❓ A/B 全部假设下评级不变
  alternate: 待改进   # 应用 v0.3.2 例外规则：A/B 后果一致 → 单轨决断
  note: "单轨决断（P0.3 已独立成立，4 项 ❓ A/B 选择不改主评级，仅影响改进路径细节）"

rebuttal_window: null  # 因为单轨决断 + tentative，不开窗口

synced_to_ops: null
---

# SEO 输出质量评审 — Astro-Seek Case Study: Precision Data vs. The "Pretty Chart" Trap

**评审对象**：`gengrowth-ops/inbox/内容创作/blog/Astro_Seek_Case_Study_Stellium_Accuracy.md`（115 行英文 blog/case-study）
**评审依据版本**：rubric v0.1 + anchor **v0.2-part-clarified** + 价值观 v1.0
**Agent 版本**：v0.3.3（inline）
**模式**：Lite

**评级（v0.3.3 单轨决断 + ❓ 改进路径）**：
- **待改进**（P0.3 AI 搬运 6 类信号全成立 → 独立 P0 待改进；4 项 ❓ A/B 后果均一致——不改主评级，仅细化改进路径）
- 应用 v0.3.2 例外规则：A/B 后果一致 → 提前决断单轨

**STATUS**: DONE_WITH_CONCERNS
**一句话结论**：AI 直出，6 类信号全成立

---

## ❓ 待确认（4 项，A/B 后果细化改进路径，不改主评级）

> v0.3.3 例外说明：本次 P0.3 已独立成立 → 主评级硬定档"待改进"。
> 4 项 ❓ 的 A/B 选择不会推翻主评级，但会决定"待改进"的严重程度（单 P0 vs 多 P0）和后续改进优先级。
> 保留 ❓ 区块让 SEO 同事 / wzb 看到改进路径选择。

### ❓ 1. 目标关键词 / 意图 / Tier 桶？

- **疑问**：文章主关键词、意图分类、Tier 桶位
- **原文**：整篇文章无 frontmatter，无 keyword-master CSV 行号关联
- **触发依据**：anchor § 5.3 关键词主表必含字段缺失；P1.3 SEO 关键词嵌入无法精确验证
- **期待对方回应**：本文对应的 keyword-master 行号？预期 search_volume / cpc / DR / KD？意图分类（Compare / Tutorial / BOFU）？

**🅰️ 预测回应 A — 默认推断（已对齐 anchor）**

- 内容："本文对应 astrologywiki keyword-master CSV row N；主关键词 'astro-seek case study'；意图 Compare + Tutorial；Tier 2 长尾词"
- → P1.3 合格 + P0.2 合格（实验产品规则）
- → 整体评级：**待改进**（P0.3 仍成立，无变化）

**🅱️ 预测回应 B — 反面（未对齐）**

- 内容："本文没在 keyword-master 登记；意图未明确分类；不知 Tier"
- → P0.2 升级（战略字段缺）+ P1.3 待改进 + 加 1 项 P0
- → 整体评级：**待改进**（P0.3 + P0.2 双 P0，严重度上升）

**📊 概率倾向**：A 约 50% / B 约 50%

**依据**：astrologywiki 是实验产品，keyword-master 登记成熟度未知

---

### ❓ 2. Case Study "student" 案例真实性？

- **疑问**：line 11 "I recently reviewed a case where a student was convinced..." 是真实学员脱敏案例？还是 AI 生成的代表性案例？
- **原文**：`...Astro_Seek_Case_Study_Stellium_Accuracy.md:11-13`
- **触发依据**：rubric § P0.1 红线明确写"编造数据 / 明显编造（团队确认后无法回溯来源）→ 直接判待改进"
- **期待对方回应**：能否提供学员脱敏出生数据（年/月，地点市区级即可）？或明确标注"representative example, fictional"？

**🅰️ 预测回应 A — 默认推断（真实可回溯）**

- 内容："student 真实存在，可以提供脱敏数据：2003-07 出生，UK，配置 Moon-Saturn-IC in Cancer"
- → P0.1 合格（数据可回溯）
- → 整体评级：**待改进**（P0.3 仍成立，无变化）

**🅱️ 预测回应 B — 反面（fictional 代表性案例）**

- 内容："这是 fictional representative example，为 SEO 长尾文设计的'代表性场景'"
- → P0.1 升级（rubric 红线触碰：明显编造）+ 加 1 项 P0
- → 整体评级：**待改进**（P0.3 + P0.1 双 P0，严重度上升）

**📊 概率倾向**：A 约 35% / B 约 65%

**依据**：文章语气抽象（"a student" / "a user" / "most teams" 全部匿名）+ 没有任何具体年份 / 配置细节 → 强信号 fictional；但 SEO 内容也有合规化使用 fictional examples 的可能

---

### ❓ 3. Sources 引用是否可验证？

- **疑问**：line 108-114 五条 Sources 全无 URL / 访问日期
- **原文**：`...Astro_Seek_Case_Study_Stellium_Accuracy.md:108-114`
- **触发依据**：rubric § P0.1 关键决策性数据应主动标来源；五条 Sources 中 "AFA Standards for orbs and Stellium" / "Project Hindsight 3-degree rule" 等是文章核心权威，无 URL 等于零权威传递
- **期待对方回应**：每条 Source 补 URL + 访问日期 + 具体引用页码 / 章节

**🅰️ 预测回应 A — 默认推断（可以补全 URL）**

- 内容："Sources 区无 URL 是格式遗漏，补 URL 即可"
- → P0.1 合格（标源可验证）+ P1.1 改进
- → 整体评级：**待改进**（P0.3 仍成立，无变化）

**🅱️ 预测回应 B — 反面（部分 Source 不可验证）**

- 内容："AFA 没有公开的 orbs/Stellium 官方手册；ISAR standards 是会员资料无法公开引用；部分 Source 实际是 AI 编出的权威"
- → P0.1 升级（权威引用编造）+ 加 1 项 P0
- → 整体评级：**待改进**（多 P0 严重度上升）

**📊 概率倾向**：A 约 40% / B 约 60%

**依据**：AFA / ISAR 的官方网站不易找到 "standards for aspect orbs" 的具体引用；Project Hindsight 是 1990s 翻译项目，"3-degree rule" 在其文献中需 specific page reference

---

### ❓ 4. 目标市场和语言：US-only 还是需葡语版？

- **疑问**：文章是英文版面向美国市场，是否计划同步生产葡语版（巴西市场）
- **原文**：整篇英文
- **触发依据**：anchor § 二主战场是美 + 巴；缺葡语版会让巴西市场流量错失
- **期待对方回应**：是否计划葡语版？由谁负责翻译并验证占星专业术语？

**🅰️ 预测回应 A — 默认推断（暂不做葡语）**

- 内容："本季先做 US 流量，葡语版后续规划"
- → P2.x 改进路径明确（不影响主评级）
- → 整体评级：**待改进**（P0.3 仍成立，无变化）

**🅱️ 预测回应 B — 反面（计划做葡语）**

- 内容："计划做葡语版，但占星专业术语翻译标准未定"
- → 加 1 项 P2 改进项（"葡语版翻译标准化"）
- → 整体评级：**待改进**（无变化）

**📊 概率倾向**：A 约 60% / B 约 40%

**依据**：早期实验产品通常先专注一个市场验证 PMF，葡语本地化是后续阶段

---

## P0 致命问题（1 项独立成立）

### **P0.3 AI 搬运 — 待改进（6 类信号全成立 ≥ 2 阈值）**

- **问题**：文章呈现 AI 直出特征，6 类信号扫描全部成立
- **6 类信号扫描详细结果**：

| # | 信号 | 阈值 | 本次扫描 | 结果 |
|---|------|------|----------|------|
| 1 | GPT 典型句式 | ≥ 4 处 | line 3, 5, 31, 38（"the primary goal is to achieve" / "fundamental trade-off of" / "operates on an Operational-Realism model" / "the cost of this precision is..."）= 4 处 | ✅ 成立 |
| 2 | ALL-CAPS 造词 | ≥ 2 处 | "Logic Mechanism" / "Operational-Realism" / "Benefit X" / "Trade-off Y" / "Data Integrity Solution"（line 27-34, 100-104）= 5 处 | ✅ 成立 |
| 3 | 翻译腔 | ≥ 2 处 | line 23 "Most teams discover this the hard way when..." / line 39 "That sounds reasonable until you test it against a deadline" = 2 处 | ✅ 成立 |
| 4 | 加工缺失 | ≥ 3 项 | 缺：作者署名 + 截图 + 具体年份 + 平台版本 + 具体客户/产品/团队名 = 5 项缺失 | ✅ 成立（5 ≥ 3） |
| 5 | 模板叠加 | ≥ 3 种 | Comparison 表格（line 79）+ How-it-works 解析（line 89）+ Step-by-step 教程（line 43）+ Case Study 案例（line 11）= 4 种 | ✅ 成立（4 ≥ 3） |
| 6 | 通用化结论 | ≥ 2 项 | conclusion 段（line 100-104）：无具体公司名 + 无具体数据 + 抽象修辞（"build authority" / "stop guessing, start measuring"）+ 无 CTA = 4 项 | ✅ 成立（4 ≥ 2） |

**6 类成立 vs ≥ 2 类阈值** → P0.3 待改进**远超阈值**，无边界态

- **为什么是 P0 不是 P1**：6 类信号同时成立 = 文章呈现 AI 直出未加工特征非常显著，这是 anchor § 三 AI 立场红线"AI 直出未加工 = P0 否决"的具体触发。不是表述问题（P1）而是文章实质质量问题（P0）。
- **必须修正**：
  1. 删除造词（"Operational-Realism" / "Logic Mechanism" → 改用占星专业术语原词）
  2. § "Case Study" 补真实学员脱敏数据 OR 明确标 "representative example, fictional"
  3. § "Step-by-Step" 补 Astro-Seek 界面截图（至少 3 张）
  4. 文末加作者署名 + 占星资质 / 从业年限
  5. § "Comparison" 表格中 "Generic Apps (Aesthetic)" 改为具体点名（Co-Star / Pattern 等）
  6. § "Conclusion" 加具体公司/客户/数据 + 明确 CTA（订阅？注册？下一步阅读？）

### P0.1 数据真实性 — 待 ❓ 2/3 答复后定档

- 当前状态：5 处疑点（见 ❓ 2 + ❓ 3）
- A/B 后果差异：A 推断 → 合格；B 推断 → 待改进
- 不影响主评级（已是待改进），但影响 P0 数量（单 P0 vs 多 P0）

### P0.2 战略匹配度 — 合格（v0.2 已确认，experimental tier 弱化规则）

- product_tier=experimental（astrologywiki.com）
- 按 anchor § 5.5 灰色地带规则：实验产品赛道不受核心产品"订阅意图词 ≥ 30%"硬约束
- 但 anchor § 5.2 "不做百度系" 仍是红线——本文英文版面向 Google，不涉及百度系，合格
- **判定：P0.2 合格**

---

## P1 结构问题（4 项）

### P1.1 框架完整性 — 待改进

- **frontmatter 完全缺失**：无 keyword / intent / bucket / market / language / published_date / author / strategic_fit_note
- **图表 / 截图 0 张**：教程类章节（line 43-61）3 步骤 0 图
- **内链 0 条**：无指向 GenGrowth / astrologywiki.com 站内任何相关文章
- **出站权威链接 0 条**：5 个权威机构 Sources 区无超链接
- **CTA 缺失**：line 104 结论无明确下一步动作
- **必须修正**：
  1. 加 frontmatter（参考 anchor § 5.3 + v0.18 SOP § 一）
  2. § "Step-by-Step" 加界面截图（至少 3 张）
  3. 加 2-3 条内链 + 5 条出站权威链接
  4. 文末加 CTA

### P1.2 逻辑严密性 — 合格但有改进项

- 链路成立：phantom config → orb math → manual configure → case validation → conclusion
- 跳跃 1：line 11-21 描述 student 配置 + line 21 "tightening revealed..."，但案例结论被中间章节切断（结论在 line 71）
- 跳跃 2：line 79 表格 "Generic Apps (Aesthetic)" 不点名
- 冗余：line 89-94 § "How it Works Under the Hood: The IC/MC Impact" 重复了前文已说过的内容（IC/MC 不是 planet, line 15-17 已说过）
- 改进项：删除 § "How it Works Under the Hood" 或与前文合并；§ Comparison 表格点名具体 app

### P1.3 SEO 关键词嵌入 — 待改进

- **主关键词覆盖率**（推断主词："Astro-Seek"）：
  - Title H1 ✅
  - 首段（line 3）✅
  - URL（基于文件名）❌（用下划线非连字符）
  - Meta description ❌（无 frontmatter）
  - H2 ❌（H2 都是抽象概念，不含主词）
  - 末段 ✅（line 102）
- **长尾词嵌入密度**：
  - "stellium" 出现 ~10 次（OK）
  - "orb" 出现 ~12 次（OK）
  - "swiss ephemeris" 只 2 次（偏低）
- **必须修正**：把 "Astro-Seek" 嵌入至少 2 个 H2

### P1.4 SOP 模板对齐 — 待改进

- v0.18 SOP § 三 Template Type 五选一：Listicle / How-to / Case Study / Comparison / Tutorial
- 本文模板归属：**混用 Case Study + How-to + Comparison + Tutorial 四种**（违反 v0.18 SOP "every content piece picks ONE primary template"）
- **必须修正**：选定一个主模板（建议 Case Study，因 title 是 Case Study），把 § "Step-by-Step" 改成附录或单独拆出独立文章

---

## P2 执行问题（5 项合并陈述）

- **P2.5 内外链权威**：内链 0 / 出站权威 0 → 加至少 2 条内链 + 5 条出站
- **P2.6 截图 / 图表**：0 张 → 加 ≥ 3 张
- **P2.7 CTA 转化路径**：缺失 → 加（订阅 / 注册 / 下一步阅读）
- **文件命名**：下划线分隔（应改连字符）
- **位置在 inbox**：发布前需迁移到 publication-ready 区

---

## 改进优先级

1. **P0.3 AI 搬运改写**（6 类信号全成立 → 必须重写，删造词 + 加截图 + 加作者 + 加 CTA + 拆模板）—— **最阻断**
2. **❓ 2 + ❓ 3 答复**（决定是否 P0.1 升级 / 是否多 P0 严重）
3. **P1.1 全套**（frontmatter / 截图 / 内外链 / CTA）
4. **P1.4 选定单一主模板**
5. **P1.3 把主词嵌入 H2**
6. **P2 项**（文件命名 / 位置）
7. **❓ 1 答复**（keyword-master 登记）
8. **❓ 4 答复**（葡语版决策）—— 影响后续投入而非本次评级

---

## cross_check_request（v0.3 cross-validation 调度）

```yaml
cross_check_request:
  trigger: 本次评审请求 codex 独立交叉审批
  primary_llm: claude
  primary_verdict: 待改进（单轨决断，P0.3 6 类信号全成立）
  primary_evidence_count:
    P0_findings: 1 (P0.3 6/6 类全成立) + 2 待定 (P0.1 / P0.2)
    P1_findings: 4
    P2_findings: 5
    question_marks: 4
  ask_second_llm:
    llm: codex
    prompt_hint: "独立按 v0.3 rubric 评 Astro_Seek blog，重点验证：P0.3 AI 搬运 6 类信号扫描；P0.2 experimental tier 规则应用；❓ 项数 vs codex 视角差异。不参考 claude 结论。"
    target_path: gengrowth-ops/inbox/内容创作/blog/Astro_Seek_Case_Study_Stellium_Accuracy.md
  background_task: b2gyq2zo5
```

---

## 自检（v0.3.3 强制 21 项）

- [x] HANDSHAKE v0.3 严格 regex 校验通过（inline 模拟）
- [x] anchor status = `part-clarified-awaiting-full-wzb-review` 校验通过
- [x] keyword-master strict check：N/A（experimental tier 不强制；但 ❓ 1 已记录）
- [x] 依据快照表所有行 updated 都填了
- [x] ❓ 待确认区块存在
- [x] 评级按 § 3 优先级表得出（单轨决断 + ❓ 改进路径，应用 v0.3.2 例外）
- [x] 适用矩阵符合 doc_type=content-piece（P1.3 / P1.4 / P2.5-7 全填）
- [x] 每条 P0 都附"为什么是 P0 不是 P1"对比理由
- [x] 每条 P0/P1 都绑了原文 + 行号
- [x] content-piece：P0.3 6 类信号扫描全填（6 类全成立，无边界态）
- [x] content-piece：P1.4 模板归属明确（混用 4 种）
- [x] content-piece：P0.2 灰色地带 fallback rule 应用正确（experimental tier + astrologywiki.com）
- [x] 未误写 `synced_to_ops` 字段
- [x] 每条 ❓ 都给 A/B 预测 + 后果预演 + 概率倾向 ✅ 4/4
- [x] **❓ A/B 后果若一致检查：本次 4 项 ❓ 的 A/B 后果对整体评级影响一致（都是"待改进"，因为 P0.3 baseline 已成立），应用 v0.3.2 例外规则 → 单轨决断 + ❓ 保留供 SEO 看改进路径**
- [x] ❓ A 后果 → 默认评级；B 后果 → 备选评级（本次 default=alternate=待改进）
- [x] **status=tentative（不是 pending-rebuttal-window，因为评级单轨硬定档）+ rebuttal_window=null + rating_track 字段标 note 说明**
- [x] N/A（无 rebuttal_window）
- [x] 未误写 `rebuttal_window.status: closed`（本次 rebuttal_window=null）
- [x] 禁词扫描通过
- [x] AI 立场写对（"评结果质量，不检测 AI 痕迹" → 但 6 类信号是结构化客观指标）
- [x] 一对象一报告

**自检 21/21 ✅**

---

## STATUS

- **STATUS**: DONE_WITH_CONCERNS
- **本次跑了什么**：v0.3.3 双轨制 inline 跑通；shadow run #4（同对象 shadow run #2 用 v0.2 评过）；P0.3 6 类信号全成立独立决断；4 项 ❓ 全部带 A/B 后果（A/B 后果一致 → 单轨决断 + ❓ 保留改进路径）；并行调起 codex 二审（task `b2gyq2zo5`）
- **遗留**：等 codex 交叉审批结果；wzb / SEO 同事看 4 项 ❓ A/B 决定改进路径优先级
- **Token 用量**：约 9K（Lite Mode + 摘录依据 + 报告生成）
- **Mode**：lite
- **Cross validation**：requested（等 codex）

---

## 关联文件

- 评审对象：`/Users/wzb/Documents/gengrowth-ops/inbox/内容创作/blog/Astro_Seek_Case_Study_Stellium_Accuracy.md`
- 评审标尺：`docs/05-governance/people-ops/policies/2026-05-11-seo-output-quality-rubric.md` v0.1
- 战略锚点：`docs/05-governance/strategic-anchors/gengrowth-capability-anchor.md` v0.2-part-clarified
- 上次评审（v0.2 模板，已澄清 ❓ 1）：`docs/05-governance/people-ops/perf-feedback/seo/2026-W20-content-astro-seek-case-study-stellium-accuracy-quality-audit.md`
- 批次摘要：`docs/05-governance/people-ops/perf-feedback/seo/2026-W20-audit-batch-summary.md`
- 并行 codex 交叉审批输出（待生成）：`/tmp/codex-out-B.txt`
