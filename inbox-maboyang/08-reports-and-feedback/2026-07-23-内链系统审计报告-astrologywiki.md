---
title: AstrologyWiki 内链系统审计报告
date: 2026-07-23
author: 马博洋
status: 完稿
scope: 全站内链状态 × Req 1-5 需求文档 × SEO SOP 升级补丁（v6）
数据来源:
  - 需求文档: inbox-maboyang/00-inbox/2026-07-19-内链系统需求文档-astrologywiki.md
  - 复盘表: astrologywiki.com - 结果复盘表 (7).csv（290篇）
  - 实时爬取: 2026-07-23 手动抽样 9 篇关键页面
  - SEO补丁: inbox-maboyang/03-content-briefs/2026-07-07-seo-sop-升级补丁-unifab学习.md v6
---

# AstrologyWiki 内链系统审计报告

**审计日期**：2026-07-23
**审计范围**：全站内链系统（Req 1-5 执行状态 + SEO 升级补丁合规性）
**数据基础**：290 篇复盘表 + 9 篇关键页面实时爬取

---

## 一、结论摘要（先看这里）

| 需求 | 优先级 | 状态 | 风险等级 |
|------|--------|------|----------|
| Req 1：168 篇错误内链批量替换 | P0 | ❌ **未完成** | 🔴 高 |
| Req 2：102 篇无工具链接补全 | P1 | ⚠️ 部分完成 | 🟡 中 |
| Req 3：CTA 模块 C 智能路由 | P1 | ❓ 无法验证（JS 渲染） | — |
| Req 4：相关文章推荐组件 | P1 | ❌ 未完成（基础架构 PR 中，可视卡片未上线） | 🟡 中 |
| Req 5：内链健康度定期扫描 | P2 | ❌ 未完成 | 🟢 低 |
| 补丁三：每篇 ≥3 工具页内链 | P1 | ⚠️ 仅 celebrity 集群达标 | 🟡 中 |
| 补丁三：工具页反向内链（→4 篇 blog） | P1 | ❌ 未执行 | 🟡 中 |
| 补丁九：锚文本三维分布比例 | P1 | ⚠️ 部分违规 | 🟡 中 |
| 集群 ID 异常：venus-in-gemini | — | ❌ 仍归入 worldcup 集群 | 🟡 中 |
| 复盘表缺失：saturn_return / planetary_placements_natal | — | ❌ 0 条记录 | 🟡 中 |

---

## 二、Req 1 审计：批量替换错误内链（P0）

### 2.1 执行状态

**❌ 未完成。** 样本爬取 9 篇页面，7 篇确认含 `/en/wiki/how-to-read-birth-chart` 错误内链。

### 2.2 实时爬取证据

| 页面 URL | 集群 | 错误内链 | 正确工具链接数 |
|----------|------|----------|----------------|
| /en/wiki/saturn-return-guide | transit_events | ✅ 发现 1 处 | 1（saturn-return-calculator） |
| /en/wiki/venus-in-gemini | worldcup2026_astro | ✅ 发现 1 处 | 2（birth-chart-calculator ×2） |
| /en/wiki/natal-chart-transits | transit_events | ✅ 发现 1 处 | 0 |
| /en/wiki/saturn-in-aries-2026 | transit_events | ✅ 发现 1 处 | 0 |
| /en/wiki/vozinha-birth-chart | celebrity_zodiac_trending | ✅ 发现 1 处 | 0 |
| /en/wiki/june-2026-planetary-transits | transit_events | ✅ 发现 1 处 | 0 |
| /en/wiki/harry-kane-birth-chart | celebrity_zodiac_trending | ❌ 未发现 | 3（多个工具） |
| /en/wiki/erling-haaland-birth-chart | celebrity_zodiac_trending | ❌ 未发现 | 3（多个工具） |
| /en/wiki/mbappe-birth-chart | worldcup2026_astro | ❌ 未发现 | 1（birth-chart-calculator） |

**模式分析：**
- celebrity_zodiac_trending 集群：3 篇中 1 篇有错误（vozinha），2 篇已修复（harry-kane, erling-haaland）— 说明该集群**部分修复**
- transit_events 集群：所有样本均有错误内链 — **未修复**
- worldcup2026_astro：mbappe 无错误，venus-in-gemini 有错误 — 不一致

**额外发现：首页问题**

首页 `astrologywiki.com/` 有 **2 处** `/en/wiki/how-to-read-birth-chart` 链接。需求文档 Req 1 仅针对 `/en/wiki/*` blog 正文，首页不在替换范围内，但首页链接到此 wiki 页会持续给该页传递权重，建议一并检查。

### 2.3 风险

工具转化仍有断路：用户在 transit_events 等集群文章阅读途中点击错误内链，进入「如何阅读星盘」教程而非计算器，CTA 不能替代静态内链的 PageRank 传递。**这是唯一 P0 问题，估时 30 分钟，应立即执行。**

---

## 三、Req 2 审计：静态工具链接补全（P1）

### 3.1 执行状态

**⚠️ 部分完成。** Celebrity 集群的部分文章已有多条工具链接，但 transit_events 集群多篇仍为 0 条。

### 3.2 实时爬取证据

| 页面 URL | 工具链接数 | 状态 |
|----------|-----------|------|
| harry-kane-birth-chart | 3（birth-chart + moon-sign + rising-sign） | ✅ 达标（补丁三 ≥3） |
| erling-haaland-birth-chart | 3（birth-chart + moon-sign + rising-sign） | ✅ 达标 |
| saturn-return-guide | 1（saturn-return-calculator） | ⚠️ 不足（目标 ≥3）|
| venus-in-gemini | 2（birth-chart-calculator ×2） | ⚠️ 不足，且同一目标重复 |
| mbappe-birth-chart | 1（birth-chart-calculator） | ⚠️ 不足 |
| natal-chart-transits | 0 | ❌ 未补 |
| saturn-in-aries-2026 | 0 | ❌ 未补 |
| vozinha-birth-chart | 0 | ❌ 未补 |
| june-2026-planetary-transits | 0 | ❌ 未补 |

**结论：** 样本中 4/9 页面仍无工具链接，远超 Req 2 验收标准「≤10 篇」。Transit_events 集群（26 篇）和大多数非 celebrity 文章均未处理。

### 3.3 工具路由准确性

对已有工具链接的文章，路由基本正确：
- harry-kane：birth-chart-calculator ✅（默认兜底，符合映射规则）
- saturn-return-guide：saturn-return-calculator ✅（按 URL 关键词匹配）
- erling-haaland：birth-chart-calculator + moon-sign-calculator + rising-sign-calculator ✅

---

## 四、Req 3 审计：CTA 模块 C 智能路由（P1）

### 4.1 执行状态

**❓ 无法通过静态 HTML 验证。** CTA 模块 A/B/C 为 React 客户端渲染，curl 爬取无法看到组件实际输出。

### 4.2 间接推断

需求文档 §一 注明「CTA 模块 A/B/C（2026-07-13 已上线）」，Oracle PR #428 处于 Preview 阶段待合并。

**建议手动验证（5 分钟）：**

在浏览器访问以下 3 个页面，确认 CTA 模块 C 显示的工具名称：

| 测试页面 | 预期工具 |
|----------|---------|
| /en/wiki/saturn-return-guide | Saturn Return Calculator |
| /en/wiki/moon-in-scorpio（若存在） | Moon Sign Calculator |
| /en/wiki/lionel-messi-zodiac-sign | Birth Chart Calculator（默认兜底） |

---

## 五、Req 4 审计：相关文章推荐组件（P1）

### 5.1 执行状态

**❌ 可视卡片组件未上线。** 复盘表和需求文档均提及集群回填基础（PR #428）已交付，但：
- 爬取 9 篇文章，均无「相关文章」区块（底部无 3-4 张文章卡片）
- Req 4 的 GA4 `related_article_click` 事件未见上线

### 5.2 数据基础状态

集群数据基础存在缺口，影响组件效果：

| 集群 | 复盘表文章数 | 状态 |
|------|------------|------|
| celebrity_zodiac_trending | 66 | ✅ 数据充分，可推荐 |
| worldcup2026_astro | 51 | ✅ 数据充分 |
| transit_events | 26 | ✅ 数据充分 |
| nakshatras_27_stars | 21 | ✅ 数据充分 |
| saturn_return | 0 | ❌ **复盘表中无记录** |
| planetary_placements_natal | 0 | ❌ **复盘表中无记录** |

saturn_return（实验三，约 33 篇）和 planetary_placements_natal（实验四，约 10 篇）的集群 ID 在复盘表中完全缺失，说明这两个集群的文章要么：
1. 未录入复盘表；或
2. cluster_id 字段未更新为正确值

这会导致 Req 4 组件上线后，这两个集群的文章无法推荐同集群内容，只能回落到「默认同月 3 篇」兜底逻辑，集群效应大打折扣。

**建议：** Req 4 上线前，先补全 saturn_return 和 planetary_placements_natal 集群的 cluster_id 录入。

---

## 六、Req 5 审计：内链健康度定期扫描（P2）

**❌ 未完成。** 无定时扫描任务，无邮件报告。现状仍依赖手动检查。

---

## 七、SEO 升级补丁合规性审计

### 7.1 补丁三：工具页内链硬性规则

**要求：** 每篇 blog ≥3 条工具页内链（前 20%、中段、结尾各一条）

| 集群 | 样本合规率 | 问题 |
|------|-----------|------|
| celebrity_zodiac_trending | 2/3 ✅ | vozinha 仍无工具链接（还有 Req 1 错误链接） |
| transit_events | 0/4 ❌ | 全部不足 3 条；部分仍为 0 条 |
| worldcup2026_astro | 0/2 ❌ | mbappe 1 条，venus-in-gemini 2 条但同一目标重复 |

**整体判断：** 补丁三目前仅 celebrity 集群部分达标，transit_events 和 worldcup 集群均不达标。

**工具页反向内链（补丁三补充要求）：工具页底部应推荐 4 篇相关 blog。**

实测 `/en/birth-chart-calculator`：底部无任何 blog 推荐链接（HTML 仅有 1 处自我引用），**完全未执行**。

### 7.2 补丁九：锚文本三维分布比例

**要求：** 精确锚文本 20-30% / 部分匹配 40-50% / 自然描述 20-30%

**发现问题：**
- venus-in-gemini：`/en/birth-chart-calculator` 出现 2 次，两个链接极可能来自相同文案（模板自动插入），违反「三条锚文本表述不得完全相同」规则（补丁三）
- 无法从静态 HTML 获取完整锚文本，需查看 markdown 源文件

### 7.3 补丁十四：跨集群互链克制规则

**要求：** 跨集群出链比例 ≤ 20%

**发现问题：**
- harry-kane-birth-chart（celebrity 集群）有 `/en/wiki/world-cup-2026-astrology-prediction`（worldcup 集群）链接 — 跨集群，但有语义关联（哈里·凯恩参加世界杯），可接受
- june-2026-planetary-transits（transit_events 集群）有 `/en/wiki/world-cup-2026-astrology-prediction`（worldcup 集群）链接 — 语义关联一般，临界可接受

**整体：** 跨集群链接比例目前不超标，但随着文章数量增加需要关注。

---

## 八、集群管理异常

### 8.1 venus-in-gemini 集群分配错误

- 复盘表 cluster_id = `worldcup2026_astro`（错误）
- 该页面内容是金牛座 / 双子座的金星星座解读，属于 `planetary_placements_natal` 集群
- 内链需求文档已记录此问题，但**尚未修正**
- 影响：Req 4 相关文章推荐组件上线后，venus-in-gemini 会被推荐到世界杯文章旁，语义严重失配

### 8.2 saturn_return / planetary_placements_natal 集群 0 条记录

- 两个集群共约 43 篇文章（实验三约 33 篇，实验四约 10 篇），在复盘表中完全缺失
- **复盘表不完整，影响**：
  1. Req 4 集群推荐逻辑无法生效
  2. 两个集群的流量表现无法追踪，实验效果无法评估

---

## 九、待执行优先级清单

### 立即执行（本周）

| 优先级 | 任务 | 预估工时 | 负责方 |
|--------|------|---------|--------|
| P0 | **Req 1：批量替换 168 篇错误内链**（`/en/wiki/how-to-read-birth-chart` → `/en/birth-chart-calculator`） | 30 分钟 | 后端 |
| P1 | **Req 3 手动验证**：浏览器访问 3 个测试页，确认 CTA 模块 C 路由是否已修复 | 5 分钟 | 任意人 |

### 本周内完成

| 优先级 | 任务 | 预估工时 | 负责方 |
|--------|------|---------|--------|
| P1 | **补全 saturn_return / planetary_placements_natal 集群录入**（复盘表 + frontmatter） | 2-3 小时 | 内容团队 |
| P1 | **修正 venus-in-gemini cluster_id**（worldcup2026_astro → planetary_placements_natal） | 5 分钟 | 内容团队 |
| P1 | **transit_events 集群工具链接补全**（26 篇，优先 4 篇 0 工具链接的文章） | 1 天 | 内容团队 |

### Req 4 上线前必须先做

| 优先级 | 任务 |
|--------|------|
| P1 | 所有集群 cluster_id 录入完整（否则推荐组件效果很差） |
| P1 | venus-in-gemini 集群修正 |
| P1 | Req 1 完成（避免推荐卡把有错误内链的文章推出去） |

### 下周内完成

| 优先级 | 任务 | 预估工时 |
|--------|------|---------|
| P1 | Req 4：相关文章推荐组件上线 | 2-3 天 |
| P1 | 补丁三：工具页反向内链（birth-chart-calculator 底部增加 4 篇 blog 推荐） | 2 小时 |
| P2 | Req 5：内链健康度定期扫描 | 半天 |

---

## 十、审计方法说明

**数据来源：**
- 复盘表分析：通过 Python 脚本解析 CSV，统计 cluster_id / 收录 / 点击分布
- 实时爬取：`curl -sL` 爬取 9 篇关键页面，`grep href` 提取内链，覆盖 3 个主要集群样本
- 无法验证内容：JS 渲染组件（CTA 模块 C、Req 4 推荐卡、补丁五教程模块）均需浏览器手动验证

**抽样局限：** 9 篇/290 篇（3.1% 抽样率），transit_events / celebrity / worldcup 各有覆盖；planetary_placements_natal 和 nakshatras 集群无直接样本，结论基于 CSV 数据推断。

---

*文件：inbox-maboyang/08-reports-and-feedback/2026-07-23-内链系统审计报告-astrologywiki.md*
*版本：v1.0 | 2026-07-23*
*审计人：马博洋*
