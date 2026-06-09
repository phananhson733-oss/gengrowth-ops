---
title: GenGrowth 增长实验记录（2026-06）
date: 2026-06-09
type: experiment
author: Lynne
tags:
  - gengrowth
  - seo
  - growth-experiment
---

# GenGrowth 增长实验记录

> 文件命名：`gengrowth-growth-experiment-2026-06.md`
> 方法论文档：`keyword-research-sop.md` · `day0-diagnosis-sop.md`
> 📊 数据追踪 Sheet：[待建立]

---

## 基本信息

| 字段 | 内容 |
|------|------|
| 产品名称 | GenGrowth |
| 产品 URL | https://www.gengrowth.ai |
| 产品类型 | 早期 SaaS — 增长自动化平台 |
| 目标国家/地区 | US（所有工具地区设置、SERP检查、关键词搜索量均以此为准） |
| 合作形式 | 自研 |
| 数据授权 | GSC ✓ / GA4 ✓ |
| 实验周期 | 2026-06-09 → 2026-08-09（60天） |
| 负责人 | Lynne |
| 核心目标 | 非品牌自然搜索流量 + 注册数 |
| 📊 数据追踪 Sheet | [待建立] |

---

## 一、Day 0 诊断基线

> Day 0 执行日期：2026-06-09

### 产品档案

- **目标用户**：希望用最少人力跑增长实验的产品团队、solo founder、indie developer
- **核心价值主张**："Automated Growth, Starting from User #1" — 自动跑/量化/优化增长实验；Minimal Input. Auto Decisions. Explainable. Self-Optimizing.
- **主要功能**：
  - Auto Discovery（SEO审计、关键词研究、竞品分析）
  - Strategy Engine（生成3+个策略候选，带ROI评分）
  - Attribution Loop（UTM指纹、渠道隔离、数据验证）
- **商业模式**：Free Trial + 付费（/en/pricing，定价待确认）
- **主要竞品（SEO层对标）**：
  - outrank.so（SEO内容自动化，每日生成文章+外链交换，内容工厂型）
  - okara.ai（"AI CMO"，多渠道营销：Reddit/SEO/Twitter/LinkedIn/HN等9个agent，$99/月）

### 行业与竞品概览

> ⚠️ 品类 DR 情况（已确认）：找不到 DR 差距 ≤ 30 的同体量竞品，触发关键词 SOP 零节**备用路径**。
> 关键词挖掘主要依靠 Keywords Explorer 直查（KD ≤ 15 + SERP弱度），而非竞品 Content Gap。

- **品类 DR 竞争水位**：待 Ahrefs 确认 outrank.so 和 okara.ai 的实际 DR
- **可对标竞品 DR 区间**：暂无（DR 差距 > 30，仅作话题发现用）
- **新站切入薄弱点**：AI 增长工具品类新兴，大量长尾需求尚未被大站覆盖；
  重点切入方向：个人开发者增长 / SaaS增长无团队 / 增长实验方法论 / AI SEO工具对比

### 流量现状

> GenGrowth 为完全新站，所有数据为零基线。

| 指标 | 数值 | 备注 |
|------|------|------|
| 月均访问量 | ~0 | 新站 |
| 自然搜索占比 | — | 无数据 |
| 社媒流量占比 | — | 无数据 |
| Organic clicks（GSC近28天） | 0 | 新站 |
| Impressions（GSC近28天） | 0 | 新站 |
| 品牌词 vs 非品牌词流量比 | — | 非品牌 = 0 |
| P11–P30 排名词数 | 0 | 无内链机会可刷新 |
| 核心关键词排名（前3） | 无 | |

### 技术健康

> 待执行 Step 1（GenGrowth 技术审计 + PageSpeed Insights）

- Core Web Vitals：LCP ____ms / INP ____ms / CLS ____
- 主要问题（待填）：

### 竞品基线快照

> 待执行 Step 2.3（Ahrefs Domain Overview）

| 指标       | GenGrowth（自有站） | outrank.so      | okara.ai        |
| -------- | -------------- | --------------- | --------------- |
| DR       | ~0（新站）         | 72              | 63              |
| 引用域名数    | ~0             | 3400            | 585             |
| 估算月均自然流量 | ~0             | 48200           | 5600            |
| 排名关键词数   | ~0             | 313             | 16              |
| 对标用途     | —              | 话题发现（DR差距预估>30） | 话题发现（DR差距预估>30） |

### 核心目标设定

| 指标 | Day 0 基线 | Day 14（领先） | Day 30（中期） | Day 60（目标） |
|------|-----------|--------------|--------------|--------------|
| 发布内容数 | 0 | 5–8篇 | 15–20篇 | 35–45篇 |
| 非品牌 impressions（US） | 0 | > 0（任意） | 待定 | 待定 |
| 目标词进 Top 30 数 | 0 | — | ≥ 3个 | ≥ 10个 |
| 非品牌 organic clicks（US） | 0 | — | — | 待定 |
| 核心 key event（注册/试用） | 0 | — | — | 待定 |

> 注：具体数字待关键词库建立后（Step 5完成后）根据快速胜利词数量回填。

### 实验核心假设

| # | 假设 | 验证时点 | 红灯条件（触发重新评估） |
|---|------|---------|----------------------|
| H1 | 品类内存在 ≥ 10 个 KD < 15 + SERP弱的商业/问题意图词 | Day 0 Step 5 完成时 | < 5 个 → 竞争密度过高或品类过窄，重新评估 |
| H2 | 内容发布 14 天内被 Google 收录 | Day 14 | 收录率 < 50% → 先排查技术/内链问题 |
| H3 | Week 2 末 GSC 出现任意 impressions | Day 14 | 0 impressions → 内容质量或格式不匹配 |

### 产品初步判断

- 可增长性评估：⚠️ 带条件启动（新站 DR ≈ 0，快速胜利词库待确认）
- 判断依据：品类新兴，大站尚未深度覆盖长尾；但 DR 为零意味着初期 DR 过滤会拦截大量词，需依赖 SERP弱度信号执行
- 前置条件：H1 假设验证通过（快速胜利词 ≥ 10 个）后方可全速启动内容生产

---

## 二、关键词策略

> 完整词库 → 📊 [Google Sheets 待建立]

### ⚠️ 新站 + 高DR品类的特殊执行规则

根据 keyword-research-sop.md 零节备用路径 + 新站注意事项：

1. **放弃 Content Gap 分析**（竞品 DR 差距 > 30，导出的词几乎全被第一关过滤）
2. **主要方法改为 Keywords Explorer 直查**：KD ≤ 15，月搜索量 ≥ 50，优先 Questions + Related terms
3. **竞品只做 Step A（Top Pages 话题扫描）**，不做 Step B（关键词直接导出）
4. **第一关改为看 SERP弱度**：KD < 15 + H列 = ✅弱 → P列手动强制进快速胜利桶，不等 DR 过滤通过
5. **快速胜利门槛降低**：KD 阈值从 < 20 降至 < 15（更保守，新站胜率更高）

### 种子词设计（Keywords Explorer 输入用）

> 10–15 个种子词，覆盖多个维度，互相不存在包含关系

| 维度 | 种子词 |
|------|--------|
| 用户角色 | indie developer, solo founder, indie hacker, bootstrapped startup |
| 问题类型 | grow saas, increase organic traffic, saas growth without team |
| 工具类型 | ai growth tool, seo automation tool, growth platform |
| 方法论 | growth experiment, seo strategy automation, attribution tracking |
| 竞品替代 | okara alternative, outrank alternative, ai marketing tool |

> 注意：不用 "growth"、"marketing" 等过大的多义词单独做种子；使用"grow saas"、"saas growth"等已消歧的词组

### 词池摘要（Step 5 完成后填入）

| 桶 | 词数 | 备注 |
|----|------|------|
| 趋势词 | — | 发现即插队执行 |
| 快速胜利（KD < 15 + SERP弱） | — | 主战场，约 60% 产能 |
| 长尾词 | — | 主战场，约 40% 产能，矩阵执行 |
| 战略词 | — | 最低优先，全周期 ≤ 5 篇 |
| **合计** | — | |

### 本轮策略决策（Step 5 完成后填入）

- **快速胜利方向**：待填（预判：indie developer SEO系列 / SaaS增长工具对比系列）
- **长尾矩阵系列**：待填
- **战略词门面选择**：待填（预判候选：「ai growth tool」「growth automation」）
- **趋势词关注话题**：AI SEO工具品类兴起（2026年Q2趋势）

### Week 1 执行词单（Step 5 完成后填入）

| 关键词 | KD | 月搜索量 | SERP弱度 | AIO风险 | 内容格式建议 |
|--------|-----|---------|---------|---------|-----------|
| | | | | | |

---

## 三、双轨执行记录

### Track A — SEO 执行

#### 内容日历（滚动更新）

| 发布日期 | 目标关键词 | KD | URL | 内容状态 | 桶 |
|---------|----------|----|-----|---------|-----|
| | | | | 待写 | |

#### 外链建设

| 类型 | 60天目标 | 状态 |
|------|---------|------|
| 高相关引用（主题相关 + DR ≥ 20 + 真实流量） | 3–5 个 | |
| 真实社区讨论（Indie Hackers / Reddit，非 self-promo） | 3–5 个 | |
| 数字 PR pitch（Featured.com / Qwoted） | 10–20 个 | |
| 品牌提及转链（Ahrefs Alerts 监控） | 发现即处理 | |
| 工具目录分发（Product Hunt 等） | ≤ 5 个 | |

---

### Track B — Social Probe

> 初期 Track B 未正式启动，来源 6 记录为 N/A。

**Week 3 决策门（必须输出三选一）**
- [ ] 双轨继续
- [ ] 仅 Track A 继续
- [ ] 双轨暂停

已注入 Track A 的关键词信号：（暂无）

---

## 四、阶段检查点

### Week 2
- 发布内容数 / 已收录数：
- 关键观察：
- 需调整：

### Week 4
- 发布内容数 / 进 Top 50 词数：
- 关键观察：
- 策略调整：

### Week 6
- 非品牌 impressions / clicks（US）：
- 关键观察：
- 策略调整：

### Week 8
- 目标词进 Top 30 数 / 非品牌 clicks：
- 关键观察：
- Day 60 报告准备：

---

## 五、Day 60 结果报告

（待填）

---

## 附录

- [ ] GSC 数据截图（Day 0 vs Day 60）
- [ ] GA4 核心数据截图
- [ ] 最高互动内容链接
- [ ] Social 信号 → SEO 转化的具体案例
