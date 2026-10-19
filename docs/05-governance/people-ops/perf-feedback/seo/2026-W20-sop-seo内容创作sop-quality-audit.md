---
title: SEO 输出质量评审 — SEO内容创作SOP
date: 2026-05-14
type: perf-feedback
status: tentative
period: 2026-W20
target_path: docs/repo/gengrowth-ops/inbox/内容创作/SEO内容创作SOP.md
doc_type: sop
product_tier: core
product_name: core
operator_git_name: Lynne Wang
operator_llm: claude
evaluation_method: inline-fallback
rubric_version: 2026-05-11
perf_eval_system_version: 2026-05-10
values_version: 2026-04-27
anchor_version: 2026-05-12
anchor_status: part-clarified-awaiting-full-wzb-review
shadow_run: true
cross_validation: none
overall_rating: 待确认
---

## SEO 输出质量评审 — SEO内容创作SOP

**评审依据版本**：rubric 2026-05-11 / anchor 2026-05-12 / values 2026-04-27 / 目标 SOP 无 updated 字段
**评级**：**待确认**
**一句话结论**：框架五步完整，但战略归属与产品域不清。

---

### P0 致命问题（1 项关键 + 2 项合格）

**P0.2 战略匹配度 — ❓ 待确认**

- 问题：本次派遣入参 `product_tier: core`，但 SOP 全文示例、专属术语、行业摩擦矩阵均落在占星术域（experimental:astrologywiki.com），与 core 订阅付费产品矩阵无任何显式对应。
- 证据：
  - 第 73 行："AI 可能会吐出：Midheaven (中天), 10th House (十宫), Mars (火星), Saturn (土星), Transits (行运)"
  - 第 99 行："如何看职业方向，主权实体选 Midheaven (中天)"
  - 第 170 行"行业通用摩擦矩阵"四类中第四类专为"占星 / 命理 → 时区偏移"
  - 全文未出现任何 core 产品（GenGrowth 工具线）的应用示例
- 必须澄清（二选一）：
  1. SOP 实际服务对象是 astrologywiki.com 实验产品 → `product_tier` 必须改 `experimental`、`product_name` 改 `astrologywiki.com`，本次评审重跑（评级大概率上调至"合格"或以上）
  2. SOP 仍为 core 通用框架 → 必须补 ≥ 2 个 core 产品应用示例 + 替换矩阵中"占星/命理"为 core 主赛道示例，否则视为战略偏离，评级转 P0 待改进

**P0.1 数据真实性 — 合格**

- 全文为流程框架，未涉及真实流量/排名/转化数据，"标源"要求不适用
- 框架内部数值约定（120 字 Answer Lock / 2000 字 Tier 1 / 600 字 Tier 3 / 单文 50 分钟）相互自洽
- 唯一异常：第 29 行 `SERP 定级 (6:3:1 法则)` —— `6:3:1` 这一比例口径全文未定义，与 Tier 1/2/3 的判定阈值（≥3 Reddit / ≥6 教程 / 混乱）无显式映射。已下沉为 P1.2 处理。

**P0.3 AI 搬运检测 — 合格**

- 明确的人工加工痕迹：
  - 两个具名 Google Sheets URL（主表 + 登记表），含 spreadsheet ID
  - 具体可执行的 Reddit dork 模板（`site:reddit.com "关键词" problems / sucks`）
  - 4 行业摩擦矩阵带各自 Mechanism → Consequence 链，非通用排比
  - 风格禁词清单（synergy / leverage / unlock / game-changing）具体、与团队既有用语一致
- 未检出翻译腔密集模式（无"在……的情况下""值得注意的是"）或通用化空泛结论

---

### P1 结构问题（4 项必改）

- **P1.1 框架完整性 — 外部依赖未声明（涉及第 139 / 197 / 308 行）**：SOP 引用三处外部资产但未声明版本、schema 或位置链接：
  - 第 197 行 `《Advanced SEO Content System Prompt》-inbox/提示词.md`：未列入依赖清单，提示词文件迭代后本 SOP 执行链立刻断裂
  - 第 139 行 `《统一素材库》`：未给位置链接和 schema
  - 第 308 行 `Pillar Page`：术语未定义、未链接到 Pillar Page 定义页
  - 必须修正：文首加 `## 依赖清单` 区块，列出所有外部依赖（提示词文件 + 两个 Google Sheets 的 schema 简表 + 统一素材库 + Pillar Page 定义）

- **P1.2 逻辑严密性 — Tier 3 路径逻辑断裂（第 117–129 行）**：Step 2.1 第二条明令"Tier 3 严禁打开 Reddit，直接进入 Step 3"——但 Step 2.2 起手即"把痛点发给 AI"。Tier 3 的"痛点"来源链条断裂（Step 2.1 已 skip Reddit、Step 2.2 又要求有痛点）。必须修正：明确"Tier 3 是否完整跳过整个 Step 2（含 2.2/2.3）"——若是，Step 2 顶部直说"Tier 3 全跳"并跳到 Step 3；若否，补 Tier 3 的痛点来源备份路径。

- **P1.2 逻辑严密性 — `6:3:1 法则` 未定义（第 29 行）**：节标题挂着 "(6:3:1 法则)"，正文是 Tier 1/2/3 的三套阈值，二者无显式映射。必须删除该标签或补 6:3:1 的具体定义；若为历史口径残留请清理。

- **P1.1 框架完整性 — 闭环反馈缺失**：5 个 Step 走完即完结（Step 5 录入 Published 状态即止），没有"发布后表现 → 复盘 → 反哺 SOP"的回路。Tier 1 重装文章一旦发布后表现不及预期，无机制驱动迭代。必须修正：补 Step 6（或独立的"复盘机制"段落），明确何种指标触发哪种动作（如 30 天 0 流量触发改稿 / 重选词）。

---

### P2 执行问题（2 项需改）

- **P2.1 可行性 — Answer Lock 与 Tier 3 字数比例冲突（第 249 / 267 行）**：Step 4.1 要求所有文章"开头前 120 字加粗回答"，但 Step 3.2 给 Tier 3 总字数 ~600 字。120/600 ≈ 20% 全部用于 Answer Lock 过挤，导致 Tier 3 "开头即结尾"。必须评估：是否对 Tier 3 单独给更短上限（如 60 字）。

- **P2.2 规范合规性（doc-audit 兜底，仅简评）**：文档无 frontmatter（缺 `title / date / updated / version / type / status`）；文件名缺 `YYYY-MM-DD-` 日期前缀；一级标题用 `**` 加粗而非 `#`。详细处置由 doc-audit 接管。

---

### ❓ 待确认条目（2 项，由 SEO 同事回应）

1. **product_tier 真实归属**：core 还是 experimental:astrologywiki.com？（见 P0.2，决定本次评级是否升级）
2. **`6:3:1 法则` 来源**：历史口径残留还是有未写完的比例定义？（见 P1.2）

---

### 改进优先级（按必须性排序）

1. **澄清 product_tier 归属并补一个对应域应用示例**（P0.2）
2. **修复 Tier 3 路径的 Step 2.1 → 2.2 逻辑断裂**（P1.2，否则 Tier 3 文章跑不通）
3. **补依赖清单 + 术语表**（P1.1，否则新人 / AI 接管时无法独立执行）
4. **补闭环反馈机制 / Step 6**（P1.1，否则 SOP 不可自迭代）
5. **删除或定义 `6:3:1 法则`**（P1.2）
6. **评估 Tier 3 的 Answer Lock 字数上限**（P2.1）
7. **补 frontmatter 与文件名规范化**（P2.2，doc-audit）

---

### 评审备注（透明披露）

**本次评审为 inline fallback，不是 worker 真实运行的结果。**

原设计是由 `/perf-audit-seo` Step 5 派遣 `.claude/agents/seo-quality-audit.md` worker 执行；但该 subagent **未注册**到当前 Claude Code session 的 available agents（列表仅含 doc-audit / secretary / general-purpose / Plan / Explore / claude-code-guide / statusline-setup）。

可能成因：session 启动时 agent loader 尚未读取到该 agent 文件（推断为 session 启动早于该 agent 创建/落档时间）。

后续工程动作建议：
- 在重启 Claude Code session 后再派遣同一对象重审，对比报告差异（评级、待确认数量、问题命中精度）
- 若两次评级不一致，复盘是 rubric 解读问题还是 worker 实现问题
- 在此之前，cross_validation 字段记为 `none`，不参与"任一 P0 → 待改进"的强映射判定

本报告为 `status: tentative`。`/perf-audit-seo --promote` 时需先确认上述 ❓ 待确认条目已澄清。
