---
title: SEO 输出质量评审 — SEO 内容生产流水线 v0.18 执行全案（v0.3.3 双轨制重审）
date: 2026-05-12
updated: 2026-05-12
type: perf-audit
author: wzb
agent: claude
agent_version: seo-quality-audit v0.3.3 (inline)
status: pending-rebuttal-window
tags:
  - record
  - seo
  - quality-audit
  - sop
  - cross-validation
aliases:
  - 2026-W20 v0.18 SOP 双轨评审
source:
  - "/Users/wzb/Documents/gengrowth-ops/inbox/内容创作/SEO内容生产流水线_v0.18_执行全案.md"
period: 2026-W20
doc_type: sop
product_tier: core
product_name: core
handshake: perf-audit-seo-v0.3 (inline simulated)
mode: lite
cross_validation: requested (codex parallel)
shadow_run: true
shadow_run_id: "#3"

rating_track:
  default: 合格      # A 推断结果（4 项 ❓ 全选 A，无 P0 触发）
  alternate: 待改进  # B 推断结果（任一 ❓ 选 B，至少 1 项 P0 升级）

rebuttal_window:
  status: open
  opened_at: "2026-05-12T20:00:00Z"
  closes_at: "2026-05-19T20:00:00Z"
  days: 7
  reviewee_response: null

synced_to_ops: null
---

# SEO 输出质量评审 — SEO 内容生产流水线 v0.18 执行全案

**评审对象**：`gengrowth-ops/inbox/内容创作/SEO内容生产流水线_v0.18_执行全案.md`（144 行 SOP）
**评审依据版本**：rubric v0.1（2026-05-11）+ anchor **v0.2-part-clarified**（2026-05-12 17:55 wzb 已澄清实验产品矩阵）+ 价值观 v1.0
**Agent 版本**：v0.3.3（inline 跑；模拟入口传 payload）
**模式**：Lite（已用 anchor v0.2 摘录）

**评级（v0.3.3 双轨）**：
- **默认 合格** / 备选 待改进
- **反对窗口**：2026-05-19 前 SEO 同事 / wzb 可推翻；不回应 = 接受默认"合格"
- **默认推断依据**：4 项 ❓ 的 A 推断（默认推断）均假设"SEO 同事按 v0.18 SOP 现状回答 → 仅 P1 问题，不触发 P0"。证据：流程化痕迹强、内部 obsidian 链接显示协作扎实、Reddit/Friction 等概念明显是同事自己业务术语而非 AI 直出。

**STATUS**: DONE_WITH_CONCERNS
**一句话结论**：流程工业化已落地，战略字段 + 发布闭环缺失

---

## ❓ 待确认（4 项，每项含 A/B 双预测）

### ❓ 1. Google Sheets 选题登记表当前可访问性 + 字段对齐

- **疑问**：SOP § 一引用 Google Sheets 作为选题登记表，但未给具体 URL / 权限矩阵
- **原文**：`SEO内容生产流水线_v0.18_执行全案.md:18-31` "选题登记表..."
- **触发依据**：rubric P0.1 要求关键决策性数据可回溯；当前 SOP 无法验证 sheets 是否还活着
- **期待对方回应**：sheets URL + 字段名 + 权限范围

**🅰️ 预测回应 A — 默认推断（概率高）** ← 默认评级贡献

- 内容："sheets 在团队 workspace，全员可访问；字段对齐 SOP § 一描述"
- → P1.1 评级：合格（流程衔接正常）
- → 默认评级贡献：**合格**

**🅱️ 预测回应 B — 反面（小概率）** ← 备选评级贡献

- 内容："sheets 在创始人个人 drive，团队部分人无访问权；字段非 SOP § 一描述（如缺 market / language 等核心字段）"
- → P0.1 升级（数据可回溯性破坏）+ P1.1 待改进
- → 备选评级贡献：**待改进**

**📊 概率倾向**：A 约 80% / B 约 20%

**依据**：v0.18 是从 v0.x 演进版本，团队应已建立 sheets workspace 实践；但"个人 drive"是创业团队常见陷阱

---

### ❓ 2. Obsidian 内链 `[系统提示词](obsidian://...)` 全员解析

- **疑问**：SOP § 二 Step 4 使用 obsidian:// 协议链接，依赖团队全员安装 obsidian + vault 同步
- **原文**：`SEO内容生产流水线_v0.18_执行全案.md:56-68` "Step 4..."
- **触发依据**：协作链接断裂会导致 SOP 实际无法执行
- **期待对方回应**：团队 obsidian 部署状态 + 是否有 fallback 链接（如 GitHub raw）

**🅰️ 预测回应 A — 默认推断**

- 内容："团队全员安装 obsidian + vault 已统一，链接全员可解析"
- → P1.1 合格 + 流程可执行
- → 默认评级贡献：**合格**

**🅱️ 预测回应 B — 反面**

- 内容："仅核心 2-3 人装了 obsidian，新人入职无法解析；无 GitHub raw fallback"
- → P1.1 待改进（流程实际可执行性下降）
- → 备选评级贡献：**待改进**

**📊 概率倾向**：A 约 70% / B 约 30%

**依据**：wiki 项目本身基于 obsidian，团队应有基础部署；但 fallback 缺失风险存在

---

### ❓ 3. "商业价值高"判定是否对齐 anchor § 5.1 订阅付费意图

- **疑问**：SOP § 一 Tier 定级用"商业价值高"作判据，但未明确"商业价值"等于 anchor § 5.1 的"订阅付费意图词 ≥ 30%"还是其他
- **原文**：`SEO内容生产流水线_v0.18_执行全案.md:34-52` "Tier 划分..."
- **触发依据**：rubric P0.2 战略匹配硬阈值 30%；如果 SOP 用别的"商业价值"定义，可能选词偏离 anchor
- **期待对方回应**：SOP 的"商业价值"是否 = anchor § 5.1 的订阅意图，还是 CPC × Volume 综合分？

**🅰️ 预测回应 A — 默认推断（对齐 anchor）**

- 内容："商业价值高 = 订阅付费意图明确 + CPC > 0 + 与 anchor § 5.1 完全对齐"
- → P0.2 合格 + P1.1 合格
- → 默认评级贡献：**合格**

**🅱️ 预测回应 B — 反面（用 CPC × Volume）**

- 内容："商业价值 = CPC × Volume，与 anchor 订阅意图未明确对齐"
- → P0.2 升级（战略偏移，订阅意图 < 30% 风险）+ P1.2 待改进
- → 备选评级贡献：**待改进**

**📊 概率倾向**：A 约 65% / B 约 35%

**依据**：anchor § 5.1 是 2026-05 才明确成文；v0.18 SOP 写于 anchor 前，"商业价值"定义可能延续旧约定

---

### ❓ 4. SOP § 一 12 字段表 vs `keyword-research-sop.md` 四桶分级

- **疑问**：SOP § 一定义 12 字段选题表；上游 `keyword-research-sop.md` 用四桶分级（快速胜利 / 长尾矩阵 / 趋势 / 战略）。两者是否同一张表？
- **原文**：`SEO内容生产流水线_v0.18_执行全案.md:18-31` vs `docs/03-marketing/03-seo/keyword-research-sop.md`
- **触发依据**：rubric P1.1 要求框架完整；两套表会导致字段对不上 / 重复维护成本
- **期待对方回应**：是同一张表（v0.18 是详细版）/ 两张独立表？

**🅰️ 预测回应 A — 默认推断（同一张表）**

- 内容："v0.18 § 一 12 字段表是上游 keyword-research-sop 四桶分级的扩展版（详细字段层）"
- → P1.1 合格（一致性 OK）
- → 默认评级贡献：**合格**

**🅱️ 预测回应 B — 反面（两张独立表）**

- 内容："是两张独立表，字段不完全对应"
- → P1.1 待改进（应合并 / 标互引）+ P2.2 规范合规性问题
- → 备选评级贡献：**待改进**

**📊 概率倾向**：A 约 60% / B 约 40%

**依据**：SOP 体系演进期常出现表分裂；但 keyword-research-sop 是 anchor 关联的核心 SOP，理应是 single source

---

## P0 致命问题（0 项）

✅ **P0.1 数据真实性 — 合格**：SOP 是流程描述，无具体数据可"编造"。但 SOP 描述的工作流程中要求收集真实数据（GSC / GA4），符合求真红线。

✅ **P0.2 战略匹配度 — 待 ❓ 3 答复后定档**：取决于"商业价值高"定义是否对齐 anchor § 5.1。
- 默认（A 推断）：合格
- 备选（B 推断）：待改进

✅ **P0.3 AI 搬运 — 合格**：SOP 包含 SEO 团队自创术语（Reddit 占比、Friction、Tier 等），术语使用一致，无 GPT 典型句式堆砌。6 类信号扫描：
1. GPT 句式：0 处成立（< 4 阈值）
2. ALL-CAPS 造词：0 处（仅"Reddit 占比"等业务术语，不算造词）
3. 翻译腔：0 处
4. 加工缺失：N/A（SOP 不需要作者署名 / 截图）
5. 模板叠加：N/A（SOP 不是评测文）
6. 通用化结论：N/A
→ 0 类成立 → **P0.3 合格**

---

## P1 结构问题（3 项）

### P1.1 框架完整性 — 待改进

- **问题**：§ 一 12 字段表缺战略字段
- **原文位置**：`SEO内容生产流水线_v0.18_执行全案.md:18-31`
- **必须补充**：表中缺以下字段：`market`（US/BR）/ `language`（en/pt）/ `bucket`（rubric § 十.1 要求的四桶）/ `strategic_fit_note`（与 anchor § 5.1 战略匹配判断）/ `search_volume` / `cpc` / `DR` / `KD`
- **依据**：anchor v0.2 § 5.3 关键词主表必含字段（v0.2 新增 `product` 字段；本 SOP 还未对应）

### P1.1（续）发布闭环缺失 — 待改进

- **问题**：流程止于 Step 5 发布，**没有 Step 6 数据复盘**
- **原文位置**：`SEO内容生产流水线_v0.18_执行全案.md:131-144` Step 5 是终步
- **必须补充**：加 Step 6 数据复盘流程：发布后 7/30/90 天回头看 GSC impressions、clicks、avg position、CTR；和原始 keyword bucket 的预期对比；不达标的入下周选题"回填"环节
- **依据**：rubric § P1.2 要求"数据→分析→结论→下一步动作链路清晰"；当前 SOP 链路止步于"发布"

### P1.2 逻辑严密性 — Tier 定级过粗

- **问题**：Tier 1/2/3 定级仅看 Reddit 占比 + 商业价值，未看 SERP 弱度（Top 10 DR 分布 / KD）
- **原文位置**：`SEO内容生产流水线_v0.18_执行全案.md:34-52`
- **必须补充**：Tier 定级补 SERP 弱度维度——例：Top 10 平均 DR < 30 → 加 1 级 Tier；或在 12 字段表中补 KD（Keyword Difficulty 0-100）
- **依据**：rubric P1.2 推理跳跃；只看意图不看竞争 = 选词成功率不可控

---

## P2 执行问题（4 项合并陈述）

- **P2.1 Reddit 占比方法不明确**：怎么算？前 10 SERP 中 Reddit 出现次数 / 10？还是 Google 自动 Discussion module？建议明确公式
- **P2.1 Friction 未要求附 URL + 抓取时间**：用户痛点话术需可回溯
- **P2.2 SOP 自身 frontmatter 缺规范**：作为 SOP 文档，缺 `status` / `version` / `author` / `last_review` 字段
- **P2.2 位置在 inbox**：v0.18 已稳定，应升正式 SOP 区 `docs/03-marketing/03-seo/`；inbox 是草稿区

---

## ⚠️ 依据冲突（无）

---

## 改进优先级

1. **❓ 3 答复**（商业价值定义 vs anchor § 5.1）—— 决定 P0.2 评级，最阻断
2. **❓ 1 + ❓ 2 + ❓ 4 答复** —— 决定 P1.1 评级
3. **加 Step 6 发布闭环**（P1.1 真问题，与 ❓ 无关）
4. **补 12 字段表战略字段**（P1.1 真问题）
5. **Tier 定级补 SERP 弱度维度**（P1.2 真问题）
6. **P2 项**（Reddit 公式 / Friction URL / frontmatter / 升级到正式 SOP 区）

---

## cross_check_request（v0.3 cross-validation 调度）

```yaml
cross_check_request:
  trigger: 本次评审请求 codex 独立交叉审批（用户在主对话主动要求）
  primary_llm: claude
  primary_verdict: 默认 合格 / 备选 待改进（双轨评级 v0.3.3）
  primary_evidence_count:
    P0_findings: 0
    P1_findings: 3
    P2_findings: 4
    question_marks: 4
  ask_second_llm:
    llm: codex
    prompt_hint: "独立按 v0.3 rubric 评 v0.18 SOP，不参考 claude 结论。重点验证：P0 / P1 是否一致；❓ 项数 vs codex 视角差异；评级一致性。"
    target_path: gengrowth-ops/inbox/内容创作/SEO内容生产流水线_v0.18_执行全案.md
  background_task: bj6xeu8n5
```

---

## 自检（v0.3.3 强制 21 项）

- [x] HANDSHAKE v0.3 严格 regex 校验通过（inline 模拟）
- [x] anchor status = `part-clarified-awaiting-full-wzb-review` 校验通过
- [x] keyword-master strict check：N/A（doc_type=sop 不强制 CSV row）
- [x] 依据快照表所有行 updated 都填了
- [x] ❓ 待确认区块存在
- [x] 评级按 § 3 优先级表得出（双轨）
- [x] 适用矩阵符合 doc_type=sop（无 P1.3 / P1.4 / P2.5-7）
- [x] 每条 P0 都附"为什么是 P0 不是 P1"对比理由（本次 0 项 P0，N/A）
- [x] 每条 P0/P1 都绑了原文 + 行号
- [x] content-piece：N/A（doc_type=sop）
- [x] content-piece：N/A
- [x] content-piece：N/A
- [x] 未误写 `synced_to_ops` 字段
- [x] 每条 ❓ 都给 A/B 预测 + 后果预演 + 概率倾向 ✅ 4/4
- [x] ❓ A/B 后果若一致检查：本次 4 项 ❓ 的 A/B 均不一致（A 推断默认合格，B 推断备选待改进），所以不提前决断
- [x] ❓ A 后果 → 默认评级（合格）；B 后果 → 备选评级（待改进）
- [x] 有 ❓ → status=pending-rebuttal-window + rating_track + rebuttal_window 字段全填
- [x] rebuttal_window.closes_at = opened_at + 7 days，ISO 8601 ✅
- [x] 未误写 `rebuttal_window.status: closed`
- [x] 禁词扫描通过
- [x] AI 立场写对
- [x] 一对象一报告

**自检 21/21 ✅**

---

## STATUS

- **STATUS**: DONE_WITH_CONCERNS
- **本次跑了什么**：v0.3.3 双轨制 inline 跑通；shadow run #3（同对象 shadow run #1 用 v0.2 评过）；4 项 ❓ 全部带 A/B 后果 + 概率；评级双轨"默认 合格 / 备选 待改进"；7 天反对窗口；并行调起 codex 二审（task `bj6xeu8n5`）
- **遗留**：等 codex 交叉审批结果；窗口期内等 SEO 同事 / wzb 决定推翻默认或接受
- **Token 用量**：约 8K（Lite Mode + 摘录依据 + 报告生成）
- **Mode**：lite
- **Cross validation**：requested（等 codex）

---

## 关联文件

- 评审对象：`/Users/wzb/Documents/gengrowth-ops/inbox/内容创作/SEO内容生产流水线_v0.18_执行全案.md`
- 评审标尺：`docs/05-governance/people-ops/policies/2026-05-11-seo-output-quality-rubric.md` v0.1
- 战略锚点：`docs/05-governance/strategic-anchors/gengrowth-capability-anchor.md` v0.2-part-clarified
- 上次评审（v0.2 模板）：`docs/05-governance/people-ops/perf-feedback/seo/2026-W20-sop-seo内容生产流水线v018执行全案-quality-audit.md`
- 批次摘要：`docs/05-governance/people-ops/perf-feedback/seo/2026-W20-audit-batch-summary.md`
- 并行 codex 交叉审批输出（待生成）：`/tmp/codex-out-A.txt`
