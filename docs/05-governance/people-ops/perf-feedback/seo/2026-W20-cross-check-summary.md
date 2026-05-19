---
title: SEO 评审 Cross-Validation 摘要 — 2026-W20（claude × codex 交叉审批）
date: 2026-05-12
updated: 2026-05-12
type: cross-check-summary
period: 2026-W20
operator: wzb
shadow_run_batch: true
tags:
  - record
  - seo
  - quality-audit
  - cross-validation
  - shadow-run
aliases:
  - 2026-W20 双 LLM 交叉审批
---

# SEO 评审 Cross-Validation 摘要 — 2026-W20

> **机制**：v0.3 设计的 cross-validation —— 让 claude（主）和 codex（独立第二意见）分别按 rubric v0.1 + anchor v0.2 评同一对象，互不知道对方结论，事后比对一致性 / 分歧。
> **本次状态**：v0.3.3 inline 跑（subagent 未真分派）+ codex MCP 工具并行调用。

## 评审对象（2 份）

| # | 对象 | 类型 | tier |
|---|---|---|---|
| A | `gengrowth-ops/inbox/内容创作/SEO内容生产流水线_v0.18_执行全案.md` | sop | core |
| B | `gengrowth-ops/inbox/内容创作/blog/Astro_Seek_Case_Study_Stellium_Accuracy.md` | content-piece | experimental:astrologywiki.com |

---

## 对象 A（v0.18 SOP）— **claude 与 codex 评级分歧**

### 评级对比

| 评审者 | 默认评级 | 备选评级 | 状态 |
|---|---|---|---|
| **claude v0.3.3 (inline)** | **合格** | 待改进 | `pending-rebuttal-window` 7 天窗口 |
| **codex (high reasoning, MCP)** | **待改进** | 合格 | 双轨方向 **相反** |

**分歧本质**：claude 偏"留余地"（默认乐观，关键判定挂 ❓ 等回答），codex 偏"直判"（不等 ❓ 答复，按现状直接判 P0.2 / P0.1 待改进）。

### 维度对比

| 维度 | claude | codex | 评判 |
|---|---|---|---|
| **P0.1 数据真实性** | 合格（SOP 是流程，无具体数据可"编造"）| **接近 P0.1**：keyword 数据来源 / 抓取日期 / 工具口径 / 样本范围缺 | codex 更严，关注 SOP 字段层 |
| **P0.2 战略匹配度** | 待 ❓ 3 答复（A=合格 / B=待改进） | **直接判 P0.2 待改进**：缺 `product`/`bucket`/`strategic_fit_note` 字段 + 缺美巴 + 缺 Q2 PV 目标 | codex 不等回答，按 anchor § 5.3 字段缺直接判 |
| **P0.3 AI 搬运** | 合格（业务术语一致，无 GPT 句式）| **有风险**：通用 SEO 分类，泛化内容流水线，未结合 GenGrowth 业务 / 美巴 / PV 目标 | codex 把"未结合具体业务"算 AI 搬运信号；claude 把它放 P1.1 |
| **P1.1 框架完整性** | 待改进（战略字段缺 + 发布闭环缺）| **同上 + 缺市场/语言路由 + 缺质量闸门**（事实核查 / 引用核验 / E-E-A-T 证据）| ✅ 方向一致，**codex 更全**（找出 claude 漏的"质量闸门"） |
| **P1.2 逻辑严密性** | 待改进（Tier 定级过粗）| **同上 + Intent-Template 映射缺 + Reddit 占比逻辑不稳定 + friction 机械转 H2** | ✅ 方向一致，**codex 更全** |
| **❓ 项数** | 4 项 | 3 项 | 数量接近 |

### ❓ 项内容差异（互补，建议合并）

**claude 的 4 项 ❓**（关注：流程衔接 + 数据可回溯）：
1. Google Sheets 选题登记表当前可访问性 + 字段对齐
2. Obsidian 内链 `[系统提示词](obsidian://...)` 全员解析
3. **"商业价值高"是否对齐 anchor § 5.1 订阅付费意图**（claude 把它放 ❓）
4. SOP § 一 12 字段表 vs `keyword-research-sop.md` 四桶分级是否同一表

**codex 的 3 项 ❓**（关注：战略证据）：
1. 是否已有独立 Keyword Master Table 承担 anchor § 5.3 字段？
2. `keyword research 输出表` 是否已限定美国/巴西 + Google/Bing？
3. `人工加工到位` 是否另有审核 SOP？

**重叠**：claude ❓4 ≈ codex ❓1（keyword master 表归属）；claude ❓3 ≈ codex ❓2（战略对齐）
**互补**：claude 关注**协作流程**（sheets 可访问 / obsidian 链接），codex 关注**审核流程**（人工加工标准）

### Cross-check 结论 — 对象 A

**评级建议**：取 codex 严格视角 → **待改进**（codex 的"P0.2 直接成立"逻辑站得住——anchor § 5.3 字段确实缺，不需要等 SEO 同事答复才判定）

**v0.3.3 双轨设计的实战发现**：
- claude 用双轨（默认 合格 / 备选 待改进）—— 把 ❓ 当评级缓冲区
- codex 也用双轨（默认 待改进 / 备选 合格）—— 但默认是严判
- **设计漏洞**：v0.3.3 双轨制没规定"默认评级该是 A 还是 B"的判定准则——是"概率高的"还是"最可能符合 rubric 字面"？两个 LLM 解读不同 → 评级方向反转
- **建议 v0.3.4 修正**：默认评级 = "按 rubric 字面应判的最严评级"；备选 = "若 ❓ 答 A 推断可降级到的评级"。这样所有 LLM 默认严判，被评审人主动反对才宽松。

---

## 对象 B（Astro_Seek blog）— **claude 与 codex 评级完全一致**

### 评级对比

| 评审者 | 评级 | 状态 |
|---|---|---|
| **claude v0.3.3 (inline)** | **待改进**（单轨决断，P0.3 6/6 类全成立 + v0.3.2 例外）| `tentative` |
| **codex (high)** | **待改进**（直接） | 同上 |

✅ **完全一致**

### P0.3 AI 搬运 6 类信号扫描对比

| 类别 | claude 判 | codex 判 | 一致性 |
|---|---|---|---|
| 1. GPT 典型句式 | ✅ 成立（line 3 / 5 / 31 / 38） | ✅ 成立（L3 / L5 / L29-L31 + 多出 L100 "ever-evolving landscape"） | ✅ 完全一致 + codex 多 1 处 |
| 2. ALL-CAPS 造词 | ✅ 成立（5 处）| ✅ 成立（5 处 + 多出 L102 "Logic-Based Depth"） | ✅ 一致 + codex 多 1 处 |
| 3. 翻译腔 | ✅ 成立（L23 / L39）| ✅ 成立（同两处） | ✅ 完全一致 |
| 4. 加工缺失 | ✅ 成立（5 项缺 ≥ 3）| ✅ 成立（≥3 项缺）| ✅ 完全一致 |
| 5. 模板叠加 | ✅ 成立（4 种 ≥ 3） | ✅ 成立（Case Study + Step-by-Step + Comparison + How-it-Works）| ✅ 完全一致 |
| 6. 通用化结论 | ✅ 成立（4 项成立）| ⚠️ **边界**（"有 Astro-Seek 与 orb 数值，但结论段无具体案例数据"）| ⚠️ codex 略宽，6 vs 5+1 边界 |

**判定**：claude 6/6 全成立，codex 5 成立 + 1 边界 → **两边都远超 ≥ 2 阈值**，触发 P0.3 待改进**一致**。codex 在第 6 类略宽，但不影响主判定。

### 维度对比

| 维度 | claude | codex | 评判 |
|---|---|---|---|
| **P0.1 数据真实性** | 待 ❓ 2/3 答复（A 合格 / B 待改进）| **直接成立**：Sources 无 URL + Astro-Seek "gold standard" 无来源 + AFA/ISAR/Project Hindsight 无可验证 + case 无截图/年份 | codex 更严，直接判 |
| **P0.2 战略匹配度** | 合格（experimental tier 弱化） | N/A（弱化适用） | ✅ 一致 |
| **P1.1 框架完整性** | 待改进（frontmatter / 截图 / 内外链 / CTA 缺）| **同上 + case study 缺案例元数据与复现路径** | ✅ 一致，codex 多 1 项 |
| **P1.2 逻辑严密性** | 合格但有改进项 | **弱**：混合多主题，无具体星盘度数 / orb 截图 / 计算过程 | **❌ codex 更严** |
| **P1.3 SEO 关键词嵌入** | 待改进（H2 不含主词）| 有但粗糙（搜索意图分层缺） | ✅ 方向一致 |
| **P1.4 SOP 模板对齐** | 待改进（混用 4 种）| 不对齐（混用 Case Study + Tutorial + Comparison + How-it-Works）| ✅ 完全一致 |

### ❓ 项对比

**claude 4 项**：
1. 目标关键词 / 意图 / Tier 桶？
2. Case Study student 案例真实性？
3. Sources 引用是否可验证？
4. 葡语版？

**codex 4 项**：
1. Sources 是否允许后补链接？（≈ claude ❓3）
2. 案例是否来自真实用户盘？（≈ claude ❓2）
3. 目标模板到底是 Case Study 还是 Tutorial？
4. "3-degree quincunx"是否为品牌观点还是行业标准？

**重叠**：2 项（Sources URL / case 真实性）；**互补**：codex 加"模板归属"和"3-度规则权威"两个新维度，claude 加"目标关键词"和"葡语版"

### Cross-check 结论 — 对象 B

**评级**：**待改进**（claude × codex 完全一致 → 高置信度）
**v0.3.3 单轨决断（v0.3.2 例外应用）正确**：两边都没用双轨——P0.3 已经独立成立，没必要双轨表达

---

## v0.3 设计验证 — 关键 takeaways

### 1. cross-validation 机制有效

- **P0.3 6 类信号判定**：两个 LLM 独立扫描，结果接近完全一致（差异仅在"通用化结论"是边界 vs 成立）→ **判断层防御扎实**
- **复杂边界**（如对象 A 的"商业价值定义"）：两个 LLM 解读不同 → 真分歧 → 这是 cross-validation 应捕捉的信号

### 2. 双轨制的设计漏洞（v0.3.4 待修正）

**漏洞**：v0.3.3 没规定"默认评级该是严还是宽"——两个 LLM 解读不同 → **claude 偏宽 vs codex 偏严**

**修正建议（v0.3.4）**：
- 默认评级 = 按 rubric 字面 + 现有证据应判的**最严评级**（不假设被评审人将给"乐观回答"）
- 备选评级 = 若 ❓ 答 A 推断（被评审人证明问题不成立）可降级到的评级
- 即：**默认 = 严**，被评审人主动反证才宽松 → 与"求真"价值观对齐 + 防止 LLM 偷工偏宽

**修正后对象 A 评级会变**：
- claude 应该改为"默认 待改进 / 备选 合格"（与 codex 同方向）
- 主评级 baseline 严守

### 3. ❓ 项互补价值

claude ❓ + codex ❓ 合并后覆盖更全 → **建议 v0.3.5 加"主报告归档时附 codex ❓ 列表"**机制，避免单 LLM 视角盲区。

### 4. content-piece P0.3 6 类信号阈值校验

- 阈值 ≥ 2 类成立 → 待改进，对象 B 实际是 6 类全成立 → 阈值合理（不会假阳性）
- codex 的"边界态"判定（第 6 类）→ 三态判定（成立/不成立/边界）设计正确

---

## 接下来的动作

### 阻断项

1. **对象 A 评级争议**：claude vs codex 评级方向相反 → **wzb 仲裁**：是按 codex 严判（待改进）还是按 claude 留余地（合格）？
   - 建议：按 codex 严判 + 同步给 SEO 同事整改清单（不等 ❓ 答复就开始整改）
2. **对象 B 评级**：claude × codex 一致"待改进" → 直接走整改流程，不需要 wzb 仲裁

### 工程项

3. **v0.3.4 subagent 修正**：默认评级 = 严，备选 = 宽（详见 § "双轨制设计漏洞"）
4. **v0.3.5 加 cross-❓ 合并机制**：claude ❓ + codex ❓ 互补后归档
5. **本次 cross-validation 报告归档为 demo**：未来 SEO 周评审都跟 cross-check 摘要

### 整改清单（合并 claude × codex 的 P 项）

**对象 A**：
- 加 keyword master 表（含 anchor § 5.3 7 字段）+ 让 Topic Registry 继承
- 明确战略约束：美国 + 巴西 / Google + Bing / 订阅意图词 ≥ 30%
- 加发布前质量闸门 + 发布后 7/14/30 天数据复盘
- Tier 规则扩展：volume + CPC + intent + difficulty + strategic_fit + SERP gap + product fit
- Intent-Template 映射明确（Compare→Comparison / Tutorial→截图绑定 / BOFU→转化组件）

**对象 B**：
- 删 / 改造词命名（Operational-Realism / Logic Mechanism / Benefit X / Trade-off Y / Logic-Based Depth）
- 把 "recently reviewed a case" 改为可复现真实案例 + 截图 + 度数 + orb 设置 + 版本
- 五选一选 Case Study 单一主模板，删 Comparison / How-it-works 泛化段
- 补可点击 Sources（或删不可验证权威声称）
- 加内链 / 外链 / 截图 / CTA
- "3-degree quincunx" 改为 "working rule / preferred threshold"（非冒充行业标准）

---

## 关联文件

- claude 视角对象 A：`docs/05-governance/people-ops/perf-feedback/seo/2026-W20-sop-seo内容生产流水线v018执行全案-quality-audit-v2.md`
- claude 视角对象 B：`docs/05-governance/people-ops/perf-feedback/seo/2026-W20-content-astro-seek-case-study-stellium-accuracy-quality-audit-v2.md`
- codex MCP 输出（保存在内存 thread）：
  - 对象 A: `019e1bcb-b06e-7131-8851-d39341a10ce0`
  - 对象 B: `019e1bcd-884a-7e93-bc7a-d5beeac7a7ed`
- 评审标尺：`docs/05-governance/people-ops/policies/2026-05-11-seo-output-quality-rubric.md` v0.1
- 战略锚点：`docs/05-governance/strategic-anchors/gengrowth-capability-anchor.md` v0.2-part-clarified
- subagent: `.claude/agents/seo-quality-audit.md` v0.3.3（待升 v0.3.4 修正双轨默认严判）
- 入口命令: `.claude/commands/perf-audit-seo.md` v0.3
- 批次摘要: `docs/05-governance/people-ops/perf-feedback/seo/2026-W20-audit-batch-summary.md`
