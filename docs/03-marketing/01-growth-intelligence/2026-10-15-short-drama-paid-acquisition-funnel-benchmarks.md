---
title: 海外短剧 App 买量漏斗基准：点击、安装与首购
date: 2026-10-15
updated: 2026-10-15
type: framework
version: v1.0
status: final
tags:
  - short-drama
  - paid-acquisition
  - conversion-funnel
  - benchmark
aliases:
  - 短剧买量漏斗基准
  - ReelShort 点击安装付费转化率
  - Short Drama Acquisition Funnel
---

# 海外短剧 App 买量漏斗基准：点击、安装与首购

> 调研日期：2026-10-15。本文用于投放测算，不代表 ReelShort 官方披露数据。ReelShort、DramaBox 等头部产品没有公开完整的“广告点击—安装—首购”同口径漏斗，因此以下结果由短剧公开锚点与移动娱乐/订阅 App 基准交叉估算。

## 可直接用于预算模型的区间

以下“点击”指用户点击广告或落地页按钮后进入 App Store / Google Play；“付费”指安装后 D7—D35 内至少一次 IAP 或订阅首购。

| 漏斗环节 | 全球常态 | 北美常态 | 优秀 | 说明 |
|---|---:|---:|---:|---|
| 广告/落地链接点击 → 安装并首开 | 8%—15% | 15%—25% | 25%—35% | Adjust 娱乐类 CTR 与 IPM 交叉推算：全球约 9.5%、北美约 24%；不是其直接发布的 CTI |
| 安装 → 首购（D30/D35） | 4%—7% | 6%—10% | 10%—12% | RevenueCat 短剧 App 中位数为 5.5%；北美区间是结合地区与 iOS 收入倾向的规划假设 |
| 广告/落地链接点击 → 首购 | 0.3%—1.1% | 0.9%—2.5% | 2.5%—4.2% | 为前两项相乘，不是独立观测值 |

建议首版财务模型分地区：**全球 1000 次点击 → 约 100 次安装并首开 → 5—6 个 D35 首购用户；北美 1000 次点击 → 约 240 次安装并首开 → 约 13 个 D35 首购用户**。因此最稳妥的点击到首购中心值是全球约 0.5%、北美约 1.3%。

如果广告点击后先进入 Web 落地页，再点按钮去应用商店，应额外乘以 Web 页到商店的点击率。不要把“广告点击”“落地页按钮点击”“商店页浏览”“下载”“安装并首开”混成同一个分母。AppsFlyer 对安装的常用归因定义是首次打开，商店显示的下载数通常会略高于 MMP 安装数。

## 公开证据与口径

1. [RevenueCat 的短剧 App 专项分析](https://www.revenuecat.com/blog/growth/short-drama-mobile-acquisition-monetization)显示，短剧 App 的 D35 安装到付费中位数为 5.5%，其他娱乐 App 仅 1.6%；短剧 D14 每安装收入中位数为 $0.83，首月每付费用户收入为 $23.85。该样本是目前最接近问题本身的公开锚点。
2. [Adjust 的娱乐类广告数据](https://www.adjust.com/blog/ecpc-ctr-benchmarks/)显示，2024 H1 娱乐 App CTR 全球 7.3%、北美 7.9%；其[转化率基准](https://www.adjust.com/blog/what-is-a-good-conversion-rate/)给出娱乐 App IPM 全球 6.94、北美 18.99。按 `CTI = IPM ÷ (1000 × CTR)` 交叉计算，点击到安装约为全球 9.5%、北美 24.0%。这是基于同机构两组聚合数据的推算，不是 Adjust 直接发布的 CTI。
3. [Branch 对 1000 万以上安装的直接 CTI 研究](https://www.branch.io/resources/blog/the-click-to-install-benchmark-study-of-over-10-million-app-installs/)给出的娱乐类约为 8.66%，Facebook 约 13.08%、Instagram 约 15.11%。样本较旧，但与 Adjust 推算的全球量级相符，可作方向性交叉校验。
4. [RevenueCat 2026 Subscription Apps 报告](https://www.revenuecat.com/state-of-subscription-apps)显示，通用订阅 App 的 D35 下载到付费中位数为 iOS 2.6%、Android 0.9%；短剧专项样本同时显示 Android 占短剧下载的 76%，iOS 却占商店收入的 58%。因此应按 OS 分开建模，不能把 Android 的量和 iOS 的付费能力混成一个均值。
5. [FlexTV 的 SEC 文件](https://www.sec.gov/Archives/edgar/data/1953021/000121390024070273/ea0211522-424b3_megamatrix.htm)披露 2024 Q1 美国付费用户/活跃用户约 21.2%，其他国家约 8.5%，全球约 12.3%。这里的活跃用户是期间内下载并至少打开一次的用户，付费用户也是期间口径，不是同一批新安装用户的 D30 cohort；只能作为成熟产品变现上限，不能直接拿去做新项目预算。
6. [Liftoff 的 ReelShort 案例](https://liftoff.ai/resources/case-study/reelshort/)确认 ReelShort 会用早期 App 内行为预测付费用户，并按地区扩展买量，但未披露完整点击、安装和首购率。这也是为什么本文给行业区间而不是伪造“ReelShort 官方值”。
7. [Apple App Store Connect](https://developer.apple.com/help/app-store-connect-analytics/benchmarks/peer-group-benchmarks)把 D35 Download to Paid 定义为下载后 35 天内发生 IAP 的比例。实际复盘应固定窗口，否则 D0、D7、D30 与期间活跃付费率无法横向比较。

## 实操判断线

| 指标 | 偏弱 | 可跑 | 较强 |
|---|---:|---:|---:|
| 全球点击 → 安装并首开 | <8% | 8%—15% | >15% |
| 北美点击 → 安装并首开 | <15% | 15%—25% | >25% |
| 安装 → 首购 D30/D35 | <4% | 4%—7% | >7% |
| 全球点击 → 首购 D30/D35 | <0.3% | 0.3%—1.1% | >1.1% |
| 北美点击 → 首购 D30/D35 | <0.9% | 0.9%—2.5% | >2.5% |

短剧投放不能只看首购率。RevenueCat 的短剧样本中，93% 的产品有 IAP、86% 有订阅、67% 有广告，超过一半三者并用；未付费用户仍可能产生广告收入。投放决策至少同时看 D7/D30 IAP ROAS、广告 ROAS、合并 ROAS、付费用户 CAC、D1/D7 留存和单剧追看深度。短剧首购强但续费弱：中位首次续费率只有 31.1%，六个月订阅留存约 1.8%。
