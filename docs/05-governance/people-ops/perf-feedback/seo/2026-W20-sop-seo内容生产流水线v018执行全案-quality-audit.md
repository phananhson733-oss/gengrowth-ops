---
title: SEO 输出质量评审 — SEO 内容生产流水线 v0.18 执行全案
date: 2026-05-12
updated: 2026-05-12
type: record
author: wzb
agent: claude
status: tentative
tags:
  - record
  - seo
  - quality-audit
  - performance
aliases:
  - SEO内容生产流水线v0.18 评审
source:
  - docs/repo/gengrowth-ops/inbox/内容创作/SEO内容生产流水线_v0.18_执行全案.md
period: 2026-W20
doc_type: sop
handshake: perf-audit-seo-v0.2
---

# SEO 输出质量评审 — SEO 内容生产流水线 v0.18 执行全案

**评审对象**：`docs/repo/gengrowth-ops/inbox/内容创作/SEO内容生产流水线_v0.18_执行全案.md`
**文档类型**：sop
**评审周期**：2026-W20
**Shadow run**：是，本报告不作为正式绩效依据（v0.2 阶段首份 shadow，配套 agent 与 anchor 都在 draft）

**依据快照**（`*` 表示来自 mtime 非 frontmatter）：

| 依据文件 | updated |
|---|---|
| `docs/05-governance/people-ops/policies/2026-05-11-seo-output-quality-rubric.md` | 2026-05-11 |
| `docs/05-governance/people-ops/policies/2026-05-10-seo-perf-evaluation-system.md` | 2026-05-11 |
| `docs/01-company/公司价值观.md` | 2026-04-27 |
| `docs/05-governance/strategic-anchors/gengrowth-capability-anchor.md` | 2026-05-12 (v0.1 draft, by Claude, 待 wzb 审) |
| `docs/03-marketing/03-seo/keyword-research-sop.md` | 2026-05-08 |
| `docs/03-marketing/03-seo/day0-diagnosis-sop.md` | 2026-05-08 |
| **评审对象本身** `SEO内容生产流水线_v0.18_执行全案.md` | 2026-05-12 * (mtime) |

**评级**：**待确认**（按 v0.2 优先级规则：存在 ❓ 待确认项 → 凌驾 P0/P1）
**一句话结论**：流程已工业化，战略字段缺失。

---

## ❓ 待确认（4 项）

> 此区块永远存在。当前 4 项 → 评级强制"待确认"，凌驾 P0/P1。

- **疑问 1**：[选题登记表 Google Sheets](docs/repo/gengrowth-ops/inbox/内容创作/SEO内容生产流水线_v0.18_执行全案.md:7) 链接是否仍可访问？该 sheet 字段是否与 SOP § 一 12 字段一致？
  - **原文**：`第一部分：基础设施 - [选题登记表](https://docs.google.com/spreadsheets/d/1JDaPu2llI9SOzISi2YsmkUELI0ArnZewFv_frQ_Wkfs/edit?usp=sharing)`
  - **触发依据**：rubric § P0.1 求真——SOP 引用外部 Sheet 作为基础设施，但 agent 无法访问 Google Sheets；如果 sheet 字段已演进而 SOP 没更新，会导致执行偏差。
  - **期待作者回应**：sheet 当前字段截图或导出 CSV header，确认与 SOP § 一一致。

- **疑问 2**：Step 4 `[系统提示词](obsidian://open?vault=gengrowth-ops&file=...)` 是 obsidian 内部链接 ([原文](docs/repo/gengrowth-ops/inbox/内容创作/SEO内容生产流水线_v0.18_执行全案.md:112))，是否在所有团队成员的 vault 都能解析？提示词文件 `SEO内容生产提示词_v0.18.md` 是否同步到所有人？
  - **触发依据**：rubric § P1.1 框架完整性——若团队成员 vault 配置不一致，Step 4 实际不可执行。
  - **期待作者回应**：确认提示词文件路径在团队 vault 里 100% 解析，或改用 raw markdown 链接 + 提示词正文嵌入。

- **疑问 3**：SOP 定级 Tier 1 的判定依据"商业价值高"（[原文 L45-47](docs/repo/gengrowth-ops/inbox/内容创作/SEO内容生产流水线_v0.18_执行全案.md:45)）——这个"商业价值"是否对齐 anchor § 五"订阅付费意图词 ≥ 30%"？还是另一个内部维度？
  - **触发依据**：rubric § P0.2 战略匹配度 + anchor § 五——"商业价值"未定义会让 Tier 1 投资源跑到与 GenGrowth 订阅付费战略无关的词上。
  - **期待作者回应**：明确"商业价值"判定规则（如：BOFU / Compare 意图 + 订阅产品相关性双过滤）。

- **疑问 4**：SOP § 一 12 字段表里的 `Keyword` / `Intent` / `Tier` 与上游 `keyword-research-sop.md`（六源挖掘 → 四桶分级）产出的关键词主表是同一张表还是两张？如果是两张，谁负责字段同步？
  - **触发依据**：rubric § P1.1 框架完整性——两张表会带来字段漂移、防撞失效。
  - **期待作者回应**：确认是同一张表（推荐）或定义两张表之间的同步机制。

---

## P0 致命问题（0 项成立 / 0 项 ❓ 待升级）

> 按 v0.2 规则，未澄清前所有 P0 候选都在"❓ 待确认"区块。本评审 P0.2 战略匹配度风险已挪到 ❓ 疑问 3（"商业价值"未对齐 anchor），澄清后由 wzb 触发二轮评审决定是否升级 P0。

### P0.1 数据真实性 — 适用 / 0 项成立

- 评估：SOP 不是文章成品，本身不含数据声明；且求真意识嵌入很到位（Step 3 "严禁在 Friction 栏填形容词"、三大红线含"字段空缺红线"）。
- 备注：SOP 未要求作者标注 Friction 的"原文 URL / 抓取时间 / 可复现性"——这条放 P2 不放 P0，因为 SOP 整体已有较强求真约束。

### P0.2 战略匹配度 — 适用 / 0 项成立（已挪 ❓ 疑问 3）

### P0.3 AI 搬运检测 — 适用 / 0 项成立

- 评估：SOP 的 AI 立场写对——允许且鼓励用 AI（"AI 提取指令" / "AI 组装" / "AI 专家模拟法搜证"），同时强调"信息增益搜证"（Friction Mining）和"禁词红线"，符合 rubric § 三立场。

---

## P1 结构问题（3 项）

### P1.1 框架完整性 — 缺战略字段

- **问题**：SOP § 一 12 字段表缺以下 anchor § 五 / rubric § 十.1 要求的战略字段：
  - `market`（美国 / 巴西）
  - `language`（英语 / 葡萄牙语）
  - `bucket`（快速胜利 / 长尾矩阵 / 趋势 / 战略，对齐 `keyword-research-sop.md` 四桶）
  - `strategic_fit_note`（与 anchor 战略匹配的判断说明）
  - `search_volume` / `cpc` / `DR` / `KD`（SERP 弱度判断需要）
- **原文位置**：`SEO内容生产流水线_v0.18_执行全案.md:11-24` 12 字段表全文
- **必须补充**：12 字段表追加上述 8 个字段；如已在"选题登记表 Google Sheets"里有但 SOP 没列出，必须在 SOP 里显式列出。

### P1.1 框架完整性 — 缺发布后闭环

- **问题**：v0.18 § 五步流程止于"Step 5 发布与语义布线"，**没有 Step 6 数据复盘**。rubric § 三.W20 P1.4 已指出过此问题（在上一份 SOP `SEO内容创作SOP.md` 评审里），v0.18 仍未修。
- **原文位置**：`SEO内容生产流水线_v0.18_执行全案.md:127-136` Step 5 全文
- **必须补充**：新增 Step 6 "发布后 7/14/30 天数据复盘"：
  - 是否已 index
  - GSC impressions / clicks / CTR / average position
  - 是否进入 Top 20 / Top 10
  - 是否需要补内链、改标题、刷新段落
  - CTA 是否有点击或注册贡献

### P1.2 逻辑严密性 — Tier 定级规则过粗

- **问题**：Tier 1/2/3 判定主要看"Reddit 占比 > 30%"和"商业价值高"，不足以支撑"重装 / 标准 / 占位"的资源投入差异。rubric § 三.W20 P1.3 已指出过，v0.18 部分对齐（加了 Reddit 占比）但仍缺：
  - SERP Top 10 页面 DR 分布
  - 是否有弱站排名（DR < 30 站点能进 Top 10）
  - 搜索结果是否稳定（近 3 个月 SERP 大调整 vs 稳定）
  - Featured Snippet / PAA / Reddit 是否可抢
  - 关键词是否符合当前站点权重
- **原文位置**：`SEO内容生产流水线_v0.18_执行全案.md:43-47` Tier 表
- **必须补充**：Tier 判定加入"SERP 弱度判断"五维度，且 Tier 1 必须同时满足"Reddit ≥ 30%"+"商业价值（按 ❓ 疑问 3 定义后）"+"SERP 可抢（含弱站或 Featured Snippet）"。

---

## P2 执行问题（4 项）

- **Reddit 占比 > 30% 判定方法不明确**：是看前 10 个结果还是前 100 个？是否包括 Quora / 论坛？无量化口径会导致 Tier 定级主观化（`L45`）。
- **Friction 来源未要求 URL + 抓取时间**：Step 3 强调严禁填形容词，但没要求附"`https://reddit.com/r/.../comments/...`" + 抓取时间，6 个月后无法回溯（`L97-105`）。
- **SOP 自身 frontmatter 缺规范**：文件没有 obsidian YAML frontmatter（`title:` / `date:` / `updated:` / `type: sop` / `version: v0.18` / `status:`）。compared to `keyword-research-sop.md` / `day0-diagnosis-sop.md` 都有完整 frontmatter，v0.18 缺。
- **P2.2 规范合规性**（简评，doc-audit 兜底）：文件名含 `_v0.18_` 体现版本管理 ✅；但文件位于 `docs/repo/gengrowth-ops/inbox/内容创作/`，是"inbox"非正式区，未来若升为正式 SOP 需迁到 `docs/03-marketing/03-seo/` 与同级 SOP 并列。

---

## ⚠️ 依据冲突（0 项 / 无）

- 本次评审未发现依据文件之间互相矛盾。
- 但需注意：**anchor v0.1 是 Claude 代起骨架**（`status: draft-by-claude-awaiting-wzb-review`），wzb 审过后若 anchor 内容有变，本评审的 P1.1 / ❓ 疑问 3 可能需要重新校准。

---

## 改进优先级（按必须性排序）

1. **wzb 先审 + 补全战略锚点 anchor v0.1**（影响本评审 ❓ 疑问 3 + P1.1）
2. **澄清 ❓ 4 项**（特别是疑问 3 "商业价值" 定义；澄清后若不对齐战略 → 升 P0.2）
3. **补战略字段到 § 一 12 字段表**（P1.1 第一条）
4. **新增 Step 6 数据复盘**（P1.1 第二条）
5. **Tier 定级加 SERP 弱度判断**（P1.2）
6. P2 四项可与 P1 一并修复

---

## 自检（agent 自填，缺一项必须重写）

- [x] HANDSHAKE 校验通过（HANDSHAKE: perf-audit-seo-v0.2|2026-W20|shadow-001）
- [x] 战略锚点已读且 updated 有记录（anchor v0.1 draft, 2026-05-12, by Claude）
- [x] 依据快照表所有行的 updated 都填了（含来源标注，1 项 `*` mtime 标注）
- [x] ❓ 待确认区块存在（4 项）
- [x] 评级按 § 3 优先级表得出（❓ 存在 → 评级 = 待确认，已应用）
- [x] 适用矩阵符合 doc_type（sop 类型，P0.1/P0.3/P1.1/P1.2/P2.1/P2.2 均适用 + P0.2 适用）
- [x] 每条 P0 都附"为什么是 P0 不是 P1"对比理由（本次 0 项 P0 成立，0 项需附）
- [x] 每条 P0/P1 都绑了原文 + 行号
- [x] 禁词扫描通过（"建议考虑"等 0 次）
- [x] AI 立场写对（无"检测 AI 痕迹"类表述，明确说 v0.18 AI 立场是合规的）
- [x] 一对象一报告（无汇总）

**填项数：11 / 11** ✅

---

## STATUS

- **STATUS**: DONE_WITH_CONCERNS
- **本次跑了什么**：
  - 读了 7 份依据：rubric / perf eval system / 公司价值观 / 战略锚点 (新建) / keyword-research-sop / day0-diagnosis-sop / 评审对象 SEO 内容生产流水线 v0.18 (144 行全文)
  - 评审对象类型：sop
  - 评级流程：识别 4 个 ❓ → 按 v0.2 优先级规则评级 = 待确认（凌驾 P0/P1）
  - 输出强模板 v0.2 全字段填齐 + 自检 11/11
  - 归档到 `docs/05-governance/people-ops/perf-feedback/seo/2026-W20-sop-seo内容生产流水线v018执行全案-quality-audit.md`
- **遗留**：
  - 待 wzb 审战略锚点 anchor v0.1 draft（影响本评审 ❓ 疑问 3）
  - 待 SEO 同事回应 ❓ 4 项（澄清后跑 `/perf-audit-seo --promote` 把 status 由 tentative 转 final）
  - W20 已有一份 `2026-W20-seo-content-sop-quality-audit.md`（旧 SOP 的报告），本评审是同周不同对象，路径不冲突
- **Token 用量**：依据 ~14K / 对象 ~3K（合计 ~17K / 20K 上限）✅
