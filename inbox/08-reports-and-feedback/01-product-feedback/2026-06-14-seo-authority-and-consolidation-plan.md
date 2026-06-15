---
title: SEO 后续方案 — 外链权威建设 + 站点整合
date: 2026-06-14
type: plan
status: proposal
author: wzb
agent: claude
related: 2026-06-13-unindexed-pages-audit.md
tags:
  - seo
  - plan
  - off-page
  - consolidation
---

# SEO 后续方案：外链权威建设 + 站点整合

> 承接 `2026-06-13-unindexed-pages-audit.md`。该审计的 16 篇 on-page 修复已上线（PR #155）。
> 但收录的**主因是 DR=0 的站点权威赤字**——on-page 改不了天花板。本文是两个真正能移动指针的后续方案：
> **A. 外链/权威建设（off-page，唯一根治杠杆）** 与 **B. 站点整合（codex 建议，止住信任稀释）**。
> 状态：**方案待评审**，尚未执行。

## 现状基线（实测）

| 指标 | 值 | 含义 |
|---|---|---|
| Ahrefs Domain Rating | **0.0**（rank 4.5 亿） | 几乎零外链、零权威 |
| 文章数 / URL 数 | 140 篇 / 333 URL（EN+ZH） | 内容量已远超权威所能承载 |
| ~0 曝光 URL | 约 **245 / 333** | "已发现未收录"的大头 |
| 全站总点击 | ≈ 6 次 | 连已收录页也排 position 80-99 |
| 最强资产 | aura 色彩集群（31-107 曝光）、july-2026-transits（pos 2.6） | 整合时应作为 hub 放大 |

**一句话**：内容不缺，缺的是别人给的信任票（外链）。在这之前，继续堆页面是净负面。

---

# 方案 A：外链 / 权威建设（off-page）

> 目标：12 周内把 DR 从 0 拉到 5-10+，让 Google 有理由收录与排名。白帽、慢而稳。

## A1. 地基层（第 1-2 周，低成本先做）
- **品牌实体信号**：建立/补全带官网链接的资料页——Crunchbase、LinkedIn 公司页、Pinterest/Instagram/X 简介、Product Hunt（若有工具）。多为 nofollow，但建立"品牌实体"，Google 需要先认识这个品牌。
- **基础目录收录**：占星/灵性/工具类目录、AlternativeTo（若有 birth chart 工具）、相关 wiki 的 external links。
- **技术前置**：先完成方案 B 的 `/wiki/*` 301 与 canonical 修复，否则外链权重会被重复 URL 稀释。

## A2. 可被引用的资产（第 2-6 周，中成本，最高 ROI）
新站拿编辑链接最现实的方式是**做别人愿意引用的东西**：
- **2026 占星历 / 行运日历**：把站内已有的 transit / full-moon 时间数据做成一个权威的"2026 重要占星日期"页（可引用的数据表 + 可下载）。这类"数据资产"是天然 link magnet。
- **时效新闻借势**：满月、世界杯占星、水逆等有新闻周期的话题，主动向媒体/博主提供数据与评论（pitch）。我们已有时效内容（full-moon-june/july、world-cup），趁窗口期推。
- **原创小调研**：如"X 名运动员的星座分布""灵性 App 对比"——可被记者引用的原创数据。

## A3. 主动外联（第 3-12 周，持续）
- **HARO / Connectively / Qwoted**：每天回应占星/灵性/wellness 类记者请求 → 赚编辑链接。新站最高 ROI 的白帽手段。
- **客座文章 / 投稿**：向占星、tarot、wellness 中型站投稿，带作者 bio 链接。
  - ⚠️ **前置风险**：站内作者是虚构 persona（见 [[project_oracle_seo_p1s]]，虚构 persona 输出 schema.org/Person 本身是 E-E-A-T 风险）。客座投稿需要**真实可署名身份**，否则不可做。**这条要先解决作者真实性问题。**
- **资源页 / niche edit 外联**：找占星"resource / further reading"页，推荐我们的 pillar 页。
- **互补合作**：与 birth chart 计算器、tarot、冥想类站做内容互链/合作。
- **社区**：Reddit（r/astrology 等）、Quora —— 多为 nofollow，但带来 referral 流量 + 发现性。

## A4. 红线（绝不做）
- ❌ 买链接 / PBN / 链接农场 / 大规模交换 —— Google 惩罚风险，对 DR=0 站是自杀。
- ❌ 自动化垃圾评论外链。

## A5. 衡量
每周记录：Ahrefs DR、referring domains 数、GSC 外链报告。目标曲线：第 4 周 DR≥2，第 8 周 DR≥5，第 12 周 DR≥8-10。

---

# 方案 B：站点整合（consolidation，止住信任稀释）

> codex 判断：DR≈0 站堆 333 URL 是**净负面**（索引选择 / 信任稀释，非 crawl budget）。
> 先整合 2-4 周，再恢复发布。

## B1. 技术去重（第 1 周，HIGH，见效快）
1. **`/wiki/*`（无语言前缀）→ `/en/wiki/*` 做 301**。实测 `/wiki/saturn` 返回 200 但 **canonical 错误指向首页**，与 `/en/wiki/saturn` 自竞争且信号混乱。这是当前最明确的技术 bug，优先修。
2. **并行 house URL 方案去重**：`house-N` 与 `Nth-house-X` 都被收录且互相蚕食（house-8 与 8th-house-meaning 各 ~48 曝光）。二选一为主，另一个 301 过去。
3. 复查 canonical / hreflang 一致性（EN/ZH 各自自指，互为 alternate）。

## B2. 内容裁决（第 1-3 周，整合主体工作）
对约 245 个 ~0 曝光页面逐一裁决（improve / merge / prune）：
- **Improve**：有独特搜索意图 + 值得留 → 按已验证的 on-page 标准升级（首屏直答、H3、内链）。
- **Merge（301）**：近重复 / 单薄 / 意图重叠 → 合并进更强的同主题页，旧 URL 301。
  - 重点蚕食集群：`north-node-in-{taurus,gemini,leo,scorpio,sagittarius}` + `how-to-find-north-node` + `north-node-vs-south-node` + `cancer-north-node` → 一个清晰 hub + 差异化 spoke，单薄的合并。
- **Prune / noindex**：无独特价值、无流量、无内链 → noindex 或删除 + 301。
- 原则：**宁可 80 个强页面，不要 333 个弱页面**。

## B3. 核心 hub 升级（第 2-4 周）
把 Google 已给信任的少数页做成权威 hub，集中内部权重：
- aura 色彩集群（已收录、有曝光）→ 强化 `aura-colors-guide` pillar 作为枢纽。
- transits 月度页（july-2026 排 pos 2.6）→ 做成"行运中枢"，串联各月 + full-moon 页。
- houses / chakra / vedic 各做一个清晰 pillar→spoke 结构。

## B4. 暂停净新增发布
- **暂停产生新 URL 的发布**（草稿可继续写），直到 DR>5-10 且收录率回升。
- **恢复发布的门槛**（codex checklist，逐条满足才上线）：① 唯一搜索意图 ② 不与现有 URL 重叠 ③ 上线前已规划 3-5 条 inbound 内链 ④ 有 hub/category 入口 ⑤ 有独特价值（非改写 SERP）⑥ 有外部分发/拿链接计划。

## B5. 衡量
每周 GSC：已收录页数、impressions 趋势、coverage 状态变化。1-2 周后重拉这 16 篇 + house/north-node 集群，看是否从"未发现"推进到"已抓取/已收录"。

---

# 执行优先级（建议顺序）

| 阶段 | 动作 | 杠杆 |
|---|---|---|
| 🔴 第 1 周 | B1 技术去重（/wiki 301 + house 去重）+ A1 地基 | 止血 + 认识品牌 |
| 🟠 第 2-4 周 | B2 内容裁决 + B3 hub 升级 + A2 可引用资产 | 提质 + 造 link magnet |
| 🟡 第 3-12 周 | A3 主动外联（HARO/客座/资源页）持续 | **拉 DR（真正解锁）** |
| ⚪ 全程 | B4 暂停发布 + B5/A5 每周衡量 | 不再稀释 + 可观测 |

# 待你决策的前置问题
1. **作者真实性**：客座投稿/数字 PR 需要真实可署名身份。是否启用真实作者，还是继续虚构 persona（后者限制 off-page 手段且有 E-E-A-T 风险）？
2. **整合力度**：B2 的 prune/merge 会删/重定向一批页面——可接受的裁撤幅度？（保守：只合并明显重复；激进：砍到 ~80 强页）
3. **发布暂停**：是否接受暂停净新增 2-4 周？

相关记忆：[[project_unindexed_audit_jun13]] [[project_oracle_seo_p1s]] [[reference_oracle_deploy_branch_topology]]
