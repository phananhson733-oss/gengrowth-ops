---
title: SEO 评审批次摘要 — 2026-W20
date: 2026-05-12
updated: 2026-05-12
type: index
period: 2026-W20
operator: wzb
shadow_run_batch: true
tags:
  - record
  - seo
  - quality-audit
  - batch-summary
aliases:
  - 2026-W20 SEO 评审批次
---

# SEO 评审批次摘要 — 2026-W20

> **本批所有报告 `status: tentative`**（v0.2 agent + v0.1 anchor draft 阶段，shadow run #1）。
> 转 `final` 流程：wzb 人工审过 → 跑 `/perf-audit-seo --promote {报告路径}` → 命令把 frontmatter `status` 改为 `final`。
> 详见 `.claude/commands/perf-audit-seo.md` v0.2 § promote 模式。

## 本批评审对象（3 份报告）

| # | 对象 | 报告 | 评级 | STATUS | 待跟进 |
|---|---|---|---|---|---|
| 1 | `docs/repo/gengrowth-ops/inbox/内容创作/SEO内容创作SOP.md`（旧版） | [2026-W20-seo-content-sop-quality-audit.md](./2026-W20-seo-content-sop-quality-audit.md) | 合格 | DONE（codex 写于 2026-05-11，v0.2 agent 出之前） | 已记入 rubric 演进 |
| 2 | `docs/repo/gengrowth-ops/inbox/内容创作/SEO内容生产流水线_v0.18_执行全案.md`（新版 v0.18） | [2026-W20-sop-seo内容生产流水线v018执行全案-quality-audit.md](./2026-W20-sop-seo内容生产流水线v018执行全案-quality-audit.md) | **待确认** | DONE_WITH_CONCERNS | 4 项 ❓ 待 SEO 回应 + anchor 待 wzb 审 |
| 3 | `gengrowth-ops/inbox/内容创作/blog/Astro_Seek_Case_Study_Stellium_Accuracy.md`（英文 blog/case-study） | [2026-W20-content-astro-seek-case-study-stellium-accuracy-quality-audit.md](./2026-W20-content-astro-seek-case-study-stellium-accuracy-quality-audit.md) | **待确认** | DONE_WITH_CONCERNS | **5 项 ❓**（含战略归属、占星术是否在业务范围）+ **P0.3 AI 搬运已确立**（首个真 P0） |

## 待 wzb 跟进项（按优先级）

- [ ] **优先级 1（阻断 2 项）**：回答**占星术是否在 GenGrowth 业务范围**（对象 3 的 ❓ 1）。这条直接决定整个 inbox/内容创作/blog/ 目录走向——是 BOFU 转化内容还是错放/跑题
- [ ] **优先级 2**：审核 + 补全 `docs/05-governance/strategic-anchors/gengrowth-capability-anchor.md` v0.1 draft（影响对象 2 + 对象 3 的战略匹配判定，特别是 § 一"订阅产品形态"要写明白以决定占星归属）
- [ ] **优先级 3**：把对象 2 的 4 项 ❓ + 对象 3 的 5 项 ❓ 发给 SEO 同事（合计 9 项）；对象 3 的 P0.3 AI 搬运是无需 ❓ 答复可直接判定的项，需要 SEO 看完整改清单
- [ ] **优先级 4**：SEO 同事回应后分别跑 `/perf-audit-seo --promote` 把对象 2 + 对象 3 的 tentative 转 final
- [ ] **优先级 5**：（待对象 2 转 final 之后）触发 1on1 谈 v0.18 是否补 Step 6 数据复盘
- [ ] **优先级 6**：**v0.3 subagent 优化**——加 content-piece 类型支持（详见本批次摘要末尾"v0.3 优化方向"区）
- [ ] **优先级 7**：通过 `tools/scripts/sync-perf-feedback.sh`（待建）同步报告到 SEO 只读区 `gengrowth-ops/perf-feedback/seo/`

## Shadow run #1 经验记录（待 wzb 审）

本次是 v0.2 agent + v0.1 anchor 的首次实跑，记录以下观察供 wzb 决定 agent 后续迭代方向：

### 跑通了什么 ✅

- HANDSHAKE 校验 + YAML payload 解析（agent 拒绝调用机制有效）
- 依据 allowlist 全部命中（codex review 修正后路径正确）
- 文档类型适用矩阵（sop 类型 6 个维度全应用）
- 三层状态系统映射（frontmatter `status: tentative` / 评级 `待确认` / STATUS `DONE_WITH_CONCERNS`）
- 评级优先级规则（4 项 ❓ → 强制 `待确认`，不下 P0 / P1 评级）
- 11 项自检全部通过
- 报告归档路径符合 slug 算法（`seo内容生产流水线v018执行全案` 18 字符 < 40 上限）
- Token 用量在边界内（~17K / 20K）

### 暴露的问题 ⚠️

1. **Anchor v0.1 draft 由 Claude 代起，wzb 没机会审就先用**——agent 拿这份 draft 作为评审依据，本次评审的 P1.1 / ❓ 疑问 3 等判定如果 anchor 被 wzb 改了内容会需要重审。**建议下次 agent 启动前必须先校验 anchor `status: final`** （而非允许 `draft-by-claude` 通过）。
2. **判断层防御没真正触发**——本次 0 项 P0 成立，所以"为什么是 P0 不是 P1 对比理由"防御没机会验证。等下次有真 P0 时再看是否有效。
3. **Reddit 占比、商业价值这类"模糊定语"**在 SOP 里大量出现，agent 评成 ❓ 待确认而非 P0，但 ❓ 项太多（4 项）会显得 agent 怯于评判——这可能是个边界问题：**LLM 在 ambiguity 面前默认偏保守**。下次评审若仍有 ❓ ≥ 3 项，需要 wzb 决定是否调整"待确认"的触发阈值。
4. **对象 1（旧版报告）是 codex 写于 agent 出之前**，不符合 v0.2 强模板——这是预期的"反面教材"，但放在同周批次里看起来有点别扭。**建议未来批次摘要里把"前 agent 时代"报告分组标注**，或者干脆挪到 `_legacy/` 子目录。

### Token 成本观察

- 本次跑 1 个对象 ~17K token（依据 14K + 对象 3K）
- 若一周 5 个对象 → ~85K token，依据部分 70K 是浪费（5×14K）
- codex 已建议：积累 5+ 份后由入口预处理依据传摘录给 worker，节省 60%+ token

---

## Shadow run #2 经验记录（2026-05-12，对象 3：Astro-Seek blog 评审）

shadow run #2 是 v0.2 agent + v0.1 anchor 应用于 **新文档类型 content-piece** 的首次实跑。

### 跑通了什么 ✅

- 文档类型新维度临时补全：P1.3（SEO 关键词嵌入）+ P1.4（SOP 模板对齐）作为 content-piece 专属维度运行
- **首个真 P0 触发**：P0.3 AI 搬运给出 ≥4 处具体证据（line 3 / line 5 / line 31 / line 38 + 结构 + 翻译腔）—— shadow run #1 是 0 项 P0，本次 1 项，**判断层防御首次验证有效**
- ❓ 项与 P0 项可共存：5 项 ❓ 触发"待确认"评级，同时 P0.3 独立成立（不依赖 ❓ 答复）
- 自检 11/11 ✅
- Token ~18K（接近 20K 上限）

### 暴露的问题 ⚠️

1. **v0.2 agent 没有 content-piece 类型**——本次 inline 临时补维度，未来如果每周有 5+ 篇 blog 评审，必须把 content-piece 加入 agent doc_type 矩阵
2. **5 项 ❓ 又一次超过 3 项阈值**：shadow run #1 是 4 项，shadow run #2 是 5 项。**连续两次 ❓ 偏高**——这是 LLM 在 ambiguity 面前默认偏保守的倾向
3. **占星术是 anchor 没覆盖的灰色地带**：anchor § 五"必须避"列了 YMYL，但占星术属"边缘 YMYL"——anchor 需要单独列"灰色地带类目"清单
4. **AI 搬运的判定是"看得出"还是"算得出"？** 本次 P0.3 用 6 类证据（句式 / 结构 / 翻译腔 / 加工缺失 + 4 个 rubric 锚点）支撑，但本质是 claude 凭"语感"判的——下次换 codex 或 gemini 跑可能给不同的判定。**建议 v0.3 加 AI 检测交叉验证**（同一文章给 2 个 LLM 评，结论不一致才升级 ❓）

### Token 成本观察

- 本次跑 1 个 content-piece ~18K token（依据 13K + 文章 1K + 报告 5K）
- 与 shadow run #1（17K）持平，但**content-piece 评审维度更多（+P1.3 +P1.4）**，未来如果再加 5 维（截图自动 OCR / 内外链自动验证 / 关键词主表行号关联 / E-E-A-T 信号 / CTA 检测），单篇可能上 25K → **必须做 agent 预处理依据**

---

## v0.3 优化方向（2026-05-12 18:30 wzb 决定全做，已落地，待 codex review）

### ✅ wzb 已澄清（2026-05-12 晚 17:55）

1. **占星术战略归属**：astrologywiki.com 是 GenGrowth **实验产品** → 占星术内容属业务范围
2. **anchor 落地 v0.2**：业务矩阵分核心产品 / 实验产品；§ 五.5 灰色地带类目（占星 = 做）
3. **本批次对象 3 P0.2 升级**：原"待 ❓ 1 答复"→ **合格**（按实验产品规则）

### ✅ v0.3 → v0.3.5 已完成落地（2026-05-12 18:30 - 20:45）

- [x] anchor v0.1-draft → **v0.2-part-clarified**（`docs/05-governance/strategic-anchors/gengrowth-capability-anchor.md`）
- [x] subagent v0.2 → **v0.3 → v0.3.1 → v0.3.2 → v0.3.3 → v0.3.4 → v0.3.5**（`.claude/agents/seo-quality-audit.md`）
- [x] entry command v0.2 → **v0.3**（`.claude/commands/perf-audit-seo.md`）
- [x] 本批次对象 3 报告：❓ 1 标已澄清，P0.2 改判合格
- [x] **v0.3.3 双轨制 cross-validation 实战**（2026-05-12 20:00）：claude × codex 并行评对象 A + 对象 B
- [x] **对象 A claude v0.3.3 报告**（v2）+ **对象 B claude v0.3.3 报告**（v2）已写
- [x] **2026-W20-cross-check-summary.md** 已写（暴露 v0.3.3 双轨默认严宽漏洞）
- [x] **v0.3.4 严宽映射修正**：默认评级 = 严判，备选 = 宽（被评审人主动反证才降级）
- [x] **v0.3.5 原文引用强制**：P0/P1 必引原文摘录（不只 line ref）
- [x] **对象 B 整改清单**（2026-W20-content-astro-seek-rectification.md）已写 + 关键 5 处原文回填

### Cross-check 评级结论

| 对象 | claude v0.3.3 | codex (high) | 一致性 | 最终建议 |
|---|---|---|---|---|
| A: v0.18 SOP | 默认 合格 / 备选 待改进 | 默认 待改进 / 备选 合格 | ❌ 方向反转 | **按 v0.3.4 严判** → 待改进（与 codex 同向）|
| B: Astro_Seek blog | 待改进（单轨）| 待改进（单轨） | ✅ 完全一致 | 待改进，直接走整改流程 |

### 对象 A 仲裁建议（v0.3.4 严判后）

按 v0.3.4 严宽映射规则：默认评级 = 按 rubric 字面 + 现有证据应判的最严评级。
- anchor § 5.3 关键词主表必含 7 字段（含 `product` v0.2 新增），v0.18 SOP § 一 12 字段表缺这 7 个 → P0.2 / P1.1 直接成立
- 不等 SEO 同事答 ❓ 1-4，先按"待改进"走整改流程
- **建议 wzb 直接通知 SEO 同事走对象 A 整改**（参考 cross-check 摘要的对象 A 整改清单）

### 关联文件总览

- subagent v0.3.5: `.claude/agents/seo-quality-audit.md`
- anchor v0.2: `docs/05-governance/strategic-anchors/gengrowth-capability-anchor.md`
- 对象 A 主审（v0.3.3）: `docs/05-governance/people-ops/perf-feedback/seo/2026-W20-sop-seo内容生产流水线v018执行全案-quality-audit-v2.md`
- 对象 B 主审（v0.3.3）: `docs/05-governance/people-ops/perf-feedback/seo/2026-W20-content-astro-seek-case-study-stellium-accuracy-quality-audit-v2.md`
- Cross-check 摘要: `docs/05-governance/people-ops/perf-feedback/seo/2026-W20-cross-check-summary.md`
- 对象 B 整改清单（合并 claude × codex + 原文回填）: `docs/05-governance/people-ops/perf-feedback/seo/2026-W20-content-astro-seek-rectification.md`

### v0.3 设计要点（已落代码）

- **HANDSHAKE 升 v0.3**：旧 v0.2 token 不接受，避免入口/worker 不同步
- **content-piece 新维度**：P1.3 关键词嵌入 / P1.4 SOP 模板对齐 / P2.5 内外链 / P2.6 截图 / P2.7 CTA
- **product_tier**：core / experimental 字段 + 实验产品规则（按 anchor § 5.5 弱化 P0.2 红线，但 P0.1 + P0.3 全场景适用）
- **anchor strict check**：status 必须 ∈ {final, part-clarified}，否则 BLOCKED
- **keyword-master strict check**：content-piece + keyword-batch 必须有 CSV 行；experimental 可填 N/A
- **Lite Mode 依据预处理**：入口压依据到 3K 摘录传 worker（节省 60% token，~17K → ~7K）
- **Cross-validation**：worker 输出 cross_check_request → 入口调度 codex/gemini 二次复审 P0.3
- **自检升 14 项**（原 11 项 + content-piece P0.3 6 类信号 / P1.4 模板归属 / anchor status 校验）

---

## v0.3 优化 5 条对应落地状态

### 1. doc_type 矩阵增加 content-piece（强烈建议）

当前矩阵：`sop | keyword-batch | growth-experiment`
v0.3 应为：`sop | keyword-batch | growth-experiment | content-piece`

content-piece 的专属评审维度（在通用 P0/P1/P2 基础上补）：

- **P1.3 SEO 关键词嵌入**：主关键词在 Title / H1 / Meta / URL / 首段 / H2 / 末段的覆盖率
- **P1.4 SOP 模板对齐**：v0.18 Template Type 五选一（Listicle / How-to / Case Study / Comparison / Tutorial），是否混用
- **P2.5 内外链权威**：内链数量 + 出站权威链接数量
- **P2.6 截图 / 图表**：教程 / case 类必含截图
- **P2.7 CTA 转化路径**：文末是否有明确下一步

### 2. anchor 必须扩"灰色地带类目"清单

当前 anchor § 五"必须避"只列了百度系 / YMYL / 本地服务 / CPC=0。
**新增 § 五.5**：灰色地带类目（按 wzb 决定逐项标"做"或"不做"）：
- 占星术 / 塔罗 / 命理 / 风水 — ?
- 自助理财 / 投资入门 — ?（YMYL 边缘）
- 减肥 / 健康习惯 — ?（YMYL 边缘）
- 灵性 / 冥想 / 内在成长 — ?
- 其他

### 3. ❓ 项预处理（解决连续 ❓ 偏高）

当前问题：每次评审 ❓ ≥ 3 项 → 评级强制"待确认" → 转 final 流程被阻断
v0.3 引入两类预处理：

**A. anchor 强制 final 才能评审**：anchor v0.1-draft → v0.2 final 后才允许跑 audit，避免"anchor 不全 → 一堆 ❓ → 评审无效"的恶性循环

**B. keyword-master 必须先建**：content-piece 评审前要求作者先在 `keyword-master/{YYYY-WW}.csv` 登记本文对应的关键词主表行 → 解决 ❓ 2（关键词意图）

### 4. AI 搬运判定的交叉验证（中期）

当前问题：P0.3 由单个 LLM 凭"语感"判，可能存在 LLM-specific bias
v0.3 引入交叉验证：

- 同一文章先给 claude 跑 1 次 → 再给 codex / gemini 跑 1 次
- 两者 P0.3 评级一致 → 直接采纳
- 不一致 → 升级 ❓ 待人工裁决

### 5. 依据预处理（解决 token 浪费）

当前问题：每个评审对象都重新读 rubric（4K）+ anchor（2K）+ 价值观（3K）+ keyword SOP（2K）+ ... = 11-14K token 反复浪费
v0.3 引入：

- 入口命令预读所有依据 + 抽摘录（关键红线 / 关键阈值 / 关键定义）压到 3K
- 摘录传 worker，worker 不再读全文
- 节省 60%+ token

---

## 下一步

- **wzb 阻断项**（按上方优先级 1-2）：
  1. 占星术是否在业务范围？（直接决定本批次对象 3 + inbox/blog/ 目录命运）
  2. 审 + 补 anchor v0.1-draft
- **SEO 同事**：等 wzb 决定 1 + 2 之后，统一一次性回 9 项 ❓
- **agent 工具下一步**：
  - 跑通 promote 流程
  - 等 wzb 拍板 v0.3 优化方向
  - shadow run #3 等 v0.3 上后再来
