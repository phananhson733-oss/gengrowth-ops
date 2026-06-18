---
title: B2 内容裁决分析 — ~0 曝光页 improve/merge/prune
date: 2026-06-18
type: plan
status: analysis-needs-decision
author: wzb
agent: claude
related: 2026-06-14-seo-authority-and-consolidation-plan.md
tags:
  - seo
  - consolidation
  - b2
---

# B2 内容裁决分析

承接整合方案 B2。基于 2026-06-18 GSC 实测(190 EN 文章 / 364 URL,DR=0)。

> **结论先行**:B2 ≠ 单纯裁页。GSC 显示**一部分低曝光页其实排第 1-2 页**(站点最强资产),该 improve 不该 prune。真正该处理的是**蚕食簇**与**纯 0 曝光薄页**。破坏性操作(merge/301/prune)需要你先拍一个**保守 / 激进**的尺度(见文末),我没有自主删页。

## 一、反直觉发现:别砍的"低曝光"页(它们是赢家)

这些页曝光不高但**排名很好(pos 9-15,第 1-2 页)**,是全站表现最好的页 —— 应**优先 improve 推上第 1 页**,绝不 prune:

| 页面 | 排名 | 动作 |
|---|---|---|
| leo-rising-houses | pos 9.9 | improve（扩内容/内链）|
| scorpio-rising-houses | pos 11 | improve |
| libra-rising-houses | pos 13 | improve |
| black-moon-lilith | pos 9 | improve |
| lionel-messi-zodiac-sign / vinicius-jr / messi 系 | pos 10 | improve（球员系列在涨）|
| june/july-2026-planetary-transits | pos 15 | improve（已有 A2 日历回链加持）|

## 二、蚕食簇(B2 主战场)

### 北交点簇（最明显的蚕食）
hub `how-to-find-north-node`(61 曝光, pos 77)+ 一堆薄 spoke:`north-node-in-{scorpio,taurus,gemini}`、`cancer-north-node`、`north-node-vs-south-node`、`south-node`。全排 pos 67-83(隐形)。
- **保守**:保留所有 spoke,但每个 spoke 正文回链 hub + 差异化(各星座独有解读);hub 升级为权威导航页。
- **激进**:把最薄、与 hub/彼此近重复的 spoke(如 north-node-vs-south-node、cancer-north-node)301 合并进 hub 或对应星座长文。

### 宫位簇
富文章(1st/2nd/3rd/4th/7th/9th/10th/12th-house)+ loser stub(house-5/6/8、5th-house、11th-house)。
- loser stub **B1 已 noindex 收口**(等 Google 重爬),B2 不重复处理。
- 富文章多排 pos 75-93(隐形)→ improve + 内链(houses pillar→spoke 结构)。

### Mahadasha 簇
`mahadasha` hub + `venus/ketu/saturn-mahadasha` spoke(均 ~1-5 曝光)→ 保守:hub 化 + 回链;激进:合并最薄的。

### Rising houses / Nakshatra 簇
rising-houses 是赢家(见上,improve)。nakshatra 系(bharani/rohini/anuradha/pushya...)多 0-4 曝光薄页 → 多数 improve 或合并进 `nakshatra` pillar。

## 三、纯 0 曝光页(约 120 篇 EN)

190 EN 文章里约 70 有曝光,**约 120 篇 0 曝光**。这是"已发现未收录"的大头(根因仍是 DR=0 权威,见主诊断)。逐页裁决原则:
- **Keep+Improve**:有唯一搜索意图 + 主题在站点核心(占星/灵性)→ 留,按 on-page 标准升级。
- **Merge(301)**:与某 winner 近重复/意图重叠 → 合并,旧 URL 301。
- **Prune/noindex**:无独特价值、无内链、非核心主题 → noindex 或删 + 301。

## 四、需要你拍的决策(破坏性操作的前置)

1. **裁撤尺度**:保守(只合并明显重复的蚕食 spoke,~10-15 篇)还是激进(0 曝光薄页大幅 noindex/合并,~60-80 篇)?
2. **北交点簇**:spoke 全留+差异化(保守),还是合并最薄的几篇(激进)?
3. 这些都涉及 301/noindex/删页(较难逆),**我等你定尺度再执行**;在此之前我只做**非破坏性**的 improve + 内链。

## 五、我现在就能安全做的(非破坏性,不等决策)
- improve 第一节的"赢家"页(rising-houses 等)推上第 1 页。
- 蚕食簇的**内链 hub 化**(spoke 回链 hub,不删页)。
- 给 winner 富文章补内链。

相关:[[project_unindexed_audit_jun13]] · 主方案 2026-06-14-seo-authority-and-consolidation-plan.md
