# AstrologyWiki W29 周报
**周期：** 2026年7月13日 - 7月19日
**数据来源：** GSC + GA4（全站 Global）
**撰写日期：** 2026-07-19

---

## 一、核心数据总览

### GSC（搜索曝光）

| 指标 | W29 |
|------|-----|
| 总点击 | **301** |
| 总曝光 | **2.17万** |
| 平均CTR | **1.4%** |
| 平均排名 | **9.4** |

### GA4（站内行为）

| 指标 | W29 | W/W变化 |
|------|-----|---------|
| 活跃用户 | 104 | ↓14.8% |
| 会话数 | 131 | ↓29.2% |
| 平均会话时长 | 3分34秒 | ↓15.9% |
| 新用户 | 156 | ↓23.5% |

> ⚠️ **注意**：GA4会话数偏低，SPA路由未修复前所有客户端跳转不记录 page_view，实际访问量高于此数。

---

## 二、GSC Top 查询词

| 排名 | 关键词 | 点击 | 曝光 | CTR | 均排 |
|------|--------|------|------|-----|------|
| 1 | jude bellingham birth chart | 10 | 420 | 2.5% | 8.0 |
| 2 | france vs spain astrology predictions | 9 | 98 | 9.1% | 12.9 |
| 3 | harry kane birth chart | 6 | 306 | 2.0% | 4.9 |
| 4 | harry kane natal chart | 6 | 159 | 3.7% | — |
| 5 | paige bueckers birth chart | 5 | 16 | 31.2% | — |
| 6 | viciinho natal chart | 5 | 9 | 71.4% | 1.8 |
| 7 | argentina vs england astrology prediction | 4 | 12 | 13.9% | 13.2 |
| 8 | harry kane astrology | 3 | 68 | 4.5% | — |
| 9 | lamine yamal zodiac sign | **2** | **1,547** | **0.1%** | 6.4 |

---

## 三、GA4 Top 页面

| 排名 | 页面 | 浏览次数 | 活跃用户 |
|------|------|----------|----------|
| 1 | /en/wiki/spain-vs-france-world-cup-2026-astrology | 14 | 15 |
| 2 | /en/wiki/england-vs-argentina-world-cup-astrology-prediction | 9 | 13 |
| 3 | /en/wiki/england-vs-argentina-world-cup-2026-astrology | 9 | 9 |
| 4 | /en/wiki/harry-kane-birth-chart | ~7 | ~9 |
| 5 | /en/wiki/birth-chart-calculator | ~9 | ~5 |
| 6 | /en/wiki/erling-haaland-birth-chart | ~5 | ~7 |
| 7 | /en/wiki（Hub页） | 19 | 4 |

---

## 四、本周核心洞察

### ✅ 世界杯内容策略验证成功
Spain vs France、England vs Argentina 两篇赛前占星文章均进入本周流量Top 3。说明**赛事占星预测文**的时效性内容路线可行，且点击质量较高（session duration 2分27秒）。

### ⚠️ Lamine Yamal：曝光巨大，点击近乎为零
`lamine yamal zodiac sign` 本周曝光 **1,547 次，仅获2次点击，CTR 0.1%，均排 6.4**。
这是本周最大的流量漏斗破口：
- 内容已有排名，位置在第7名附近
- 标题/描述吸引力不足，或 SERP 竞品 snippet 更具体
- **行动建议**：优化该页的 Title Tag 和 Meta Description，加入"Cancer Sun + Moon"等具体星盘信息，目标 CTR ≥ 2%（参考：paige bueckers同类页 31.2%）

### ✅ Harry Kane Cluster 正在稳定出量
`harry kane birth chart` + `harry kane natal chart` + `harry kane astrology` 三词合计 **15 次点击**，构成本周最稳定的名人星盘集群。均排 4.9，仍有提升空间。

### ⚡ Jude Bellingham：本周点击第一，均排 8.0 有提升空间
`jude bellingham birth chart` 10次点击，420次曝光，排名8.0——尚未进入 Top 3 结果。页面若已发布，优先做 on-page 优化；若未发布，World Cup 结束后仍有长尾价值（Cancer stellium 角度）。

### 📉 整体流量周环比全面下滑
活跃用户 -14.8%，会话 -29.2%。下滑可能原因：
1. SPA 路由 GA4 数据缺失（P0 未修复）
2. W28 有单篇爆发文章拉高基数
3. 世界杯流量在决赛日（今天）之前存在自然低谷

---

## 五、下周优先行动

| 优先级 | 行动 | 负责方 |
|--------|------|--------|
| P0 | SPA路由GA4修复上线 | 后端 |
| P0 | Lamine Yamal zodiac sign 页：优化Title/Description，目标CTR ≥2% | 内容 |
| P1 | 决赛文章（Messi vs Yamal / Argentina vs Spain）发布，趁今日决赛流量峰值 | 内容 |
| P1 | Jude Bellingham birth chart on-page 优化，排名8.0→目标Top5 | 内容 |
| P2 | Harry Kane cluster：内链串联三篇（birth chart / natal chart / astrology），减少流量分散 | 内容 |
