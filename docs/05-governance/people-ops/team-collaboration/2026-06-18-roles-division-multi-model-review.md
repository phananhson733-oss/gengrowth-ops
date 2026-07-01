---
title: 增长团队分工 SSOT — 多模型评审意见（给 v0.3 修订）
date: 2026-06-18
updated: 2026-06-18
type: review
status: resolved  # 已收敛入 SSOT v0.3（2026-06-29）：点1/2/3/5 + 补1-4 采纳，点4 设触发条件暂缓
author: wzb
reviewers:
  - codex (gpt-5.5)
  - claude 组织设计视角
  - claude 增长运营视角
  - claude 绩效激励视角
  - claude 落地缺口视角
target: 2026-06-16-growth-team-roles-and-division.md
tags:
  - review
  - org
  - growth
aliases:
  - 分工文档评审意见
  - roles-division-review-2026-06-18
---

# 增长团队分工 SSOT — 多模型评审意见

> 评审对象：`2026-06-16-growth-team-roles-and-division.md`（v0.2）
> 评审方式：codex（gpt-5.5）+ 4 个 Claude 子视角，**独立评审**后交叉收敛。
> 已确认前提（不在这些点扣分）：SEO 文章产出已基本全自动化、KOL 马上到岗、UTM 命名约定是待落地待办、内部黑话来自其他 SEO 自动化文档。

## 一句话结论

文档的归因工程（cluster_id + UTM、防撞车、绩效隔离）是**优等生水平**，五方都认。问题集中在一点：

> **现在解决了「名义 ownership」，还没解决「机会怎么分流、贡献怎么归因、接口谁仲裁、谁为响应延迟负责」。这四个不补，三人越努力，扯皮越精确。**

---

## 五条共识必改（按严重度，对应章节）

### 1. §三 S6「归属清楚」是假清楚 —— 缺机会分流机制

**现状**：把自有社媒/外链/KOL 分给三个人，但真实机会不按这三类天然出现——一个 Reddit 高赞帖 / niche blogger / TikTok creator，同时可能是社媒扩散、外链 lead、KOL lead。文档只写「彭满转交外链 lead」，没写**谁判定机会归哪条线、响应 SLA、被拒怎么处理**。

**改**：加一张 **S6 Opportunity Triage 表**：`opportunity_id / discovered_by / candidate_type / primary_owner / decision_owner / accepted? / reject_reason / SLA`。每周例会只看这张表，不靠口头「转交」。

### 2. §六 UTM 不是绩效归因钥匙，只是观测字段 —— 当归因会误伤人

**现状**：文档说 cluster_id+UTM「两把钥匙」后「互不串」。但外链/KOL 对排名的提升**滞后 2-8 周，且最终表现为 Organic Search 或 Direct，不再带原 UTM**；KOL 曝光引发品牌搜索，GA4 归不到 KOL。把 UTM 当绩效拆分钥匙，会**系统性低估外链/KOL/社媒的 assisted 贡献**，尤其彭满的社媒影响在 last-click 下被结构性少算。

**改**：绩效拆**两层**——
- **direct attributable**：UTM 能直接归的，照算。
- **assisted contribution**：外链/KOL 对排名、品牌搜索、自然流量的影响，用事件账本记 `action_id + cluster_id + publish_date + attribution_window + expected_effect`，不硬塞给 GA4 UTM。

### 3. §四+§六 彭满激励不相容 —— 核心 KPI 由马博洋单边裁决

**现状**：彭满的「Social Probe 信号回流命中」，分子（采纳数）100% 在马博洋手里；关键词主表只归 SEO 写，彭满不能动。马博洋无 SLA、无义务高质量处理，且采纳=给自己加活（负激励）。这是「考核我的指标由同级单边裁量」。

**改**：拆三段——
- `valid_signal_count` 归彭满（按证据质量评分，他可控）；
- `采纳/拒绝须带理由 + review SLA` 归马博洋；
- `accepted_signal_performance` 作共享学习指标，不直接惩罚任何一方。
- 回流行从「主观计数」**硬化为共享 Sheet 的查表状态**（候选/已纳入/驳回），消除双源记忆冲突。

### 4. §二 马博洋是决策队列瓶颈（注意：不是文章产能）

**现状**：SEO 文章已自动化没错，但**外链不是自动化产线**——它是高摩擦的人肉 outreach（联系、PR、跟进、质控）。外链全权归马博洋，叠加 S7 主 + S8 审核 + S9 主，所有协作接口最后排队等他判断，锁死彭满/KOL 产能。

**改**：拆「SEO 决策权」与「外链执行劳动」。马博洋只保留 `target_url / anchor_policy / quality_threshold / approve-reject`；outreach 跟进逐步 SOP 化给助理/外包。
> 注：此条请 wzb 再判断——外链可能也已部分自动化，若是则降级。

### 5. §三 KOL 带链：SEO 定锚文本与创作真实性冲突，且 KOL 无 veto

**现状**：文档写「带链时标的/锚文本由 SEO 定」。但真实 KOL 不接受 exact-match anchor 硬指令（伤创作自然度 + 过度优化的 footprint 惩罚风险），且没给 KOL 运营对创意真实性/平台风控的否决权。

**改**：KOL brief 加优先级规则——`创作者真实性 > 平台合规 > 转化 > SEO 锚文本精确`。SEO 提供**可选 anchor/target 池**而非单一硬指令；KOL 运营可因创作者适配拒绝某个 anchor，争议由创始人裁决。

---

## 四条建议补充（agent 独有，可选）

- **元层↔对象层缺交接接口**：创始人 build-in-public 要靠三人喂素材，但没定义谁/多久/交什么。→ 周报固定一栏「本周可对外讲的实验点」。
- **SOP 沉淀无质量门 → 会沦为凑数文档**（古德哈特定律）。→ 考核口径从「沉淀了几篇 SOP」改成「**被复用过的 SOP**」。
- **数据脊柱无完整性 owner**：手动台账全靠自报+抽查，没人对共享 Sheet 完整性负 R。→ 所有「台账」做成共享 Sheet 的 tab（不是独立文件，否则又是双源漂移）；周报脚本对缺 cluster_id/UTM 的行自动标红。
- **UTM 文档内部冲突（落地前必裁决）**：§6.1 写 KOL 的 `utm_campaign=kol-{红人}-{cluster_id}`，§6.2 写 `utm_campaign=纯 cluster_id`。两处矛盾。→ 建议统一用 §6.2（campaign 恒为纯 cluster_id，红人放 utm_source），否则 KOL 流量无法按 cluster_id 聚合。

---

## 落地优先级（§6.3 四个待建项的依赖排序）

1. **UTM 命名约定文档** = P0，唯一「真前置 + 时间敏感」（UTM 发出即不可改，错一周=永久脏数据）。落地时把「生成防呆（Sheet UTM Builder 下拉枚举）+ 看板未知值告警」作为核心，并顺手裁决上面第 4 条补充的 §6.1/§6.2 冲突。
2. **周报「分人看板」脚本** = P1，分两期：一期纯 GA4 按 medium 分人（不依赖台账），二期接 Ahrefs + 手动台账。注意 GitHub Actions 被账单禁用，别默认用 Actions 定时跑，改本地 cron / 周一手动。
3. **外链台账** = P2，马博洋单人可建，低风险可缓。
4. **KOL 合作台账** = P3，等人到岗第一周再建（现在建是空转）。

---

## 给 Lynne 的话

这份文档底子很好，上面 5 条共识不是推翻设计，是**把「名义分工」补成「可执行+激励相容」**。建议据此出 v0.3，重点先落第 1（机会分流表）+ 第 3（彭满激励解耦）+ P0 的 UTM 约定文档——这三件直接决定三人协作起来是顺还是天天扯皮。第 4 条（马博洋外链负载）请先和 wzb 确认外链自动化程度再定要不要改。
