---
title: Amy Demure 产品调研报告
date: 2026-07-20
updated: 2026-07-20
type: note
tags:
  - product-research
  - astrology
  - creator-commerce
  - tiktok
aliases:
  - Amy Demure 分析报告
  - Amy Demure Product Research
---

# Amy Demure 产品调研报告

> 调研日期：2026-07-20 | 产品类型：E-commerce / DTC（主）+ Media / 创作者内容（副） | 调研人：AI Product Analyst

---

## 执行摘要

Amy Demure 不是两个平行商城，而是一套由三个层级组成的创作者商业闭环：TikTok `@amydemure` 承担内容触达，`amydemure.store` 是托管在 Beacons 上的 link-in-bio 导航层，`amydemure.com` 是托管在 Wix 上的交易、预约与交付入口。[High] `.store` 的页面配置直接列出 TikTok `amydemure`、Instagram `amydemure_`，并把 Guidebooks、占星解读、出生星盘、爱情解读、塔罗和 Zoom 咨询全部导向 `.com`；另有一个 Everclear 外部导流链接。

商业模式是“低价、可重复销售的星座数字指南 + 高价、受个人工时约束的解读服务 + 团队化低价服务 + 外部合作导流”。公开价格覆盖 $20 月度指南、$65 团队成员解读、$145 个人问答/爱情/塔罗解读、约 $207 出生星盘分析及 $300/小时 Zoom。[High] 该组合具备清晰的价格阶梯，但公开信息不足以确认销量、收入、毛利率、复购率或各业务线占比。

最大的公开资产是社交分发：官网自述全平台约 200 万粉丝；第三方抓取显示 TikTok 约 158 万粉丝、近月单条视频约 14.6 万—217 万播放。[Medium/Low] 最大的可验证短板不是粉丝规模，而是交易信任与数据治理：官网 Terms and Conditions 页面仍保留 Wix 模板占位文本，然而购买解读必须提交出生日期、准确出生时间、出生地点、邮箱，以及部分职业和关系信息。[High] 这会同时影响购买转化、隐私合规和品牌专业度。

### 证据边界

| 公开数据可以支持 | 公开数据不能支持 |
|---|---|
| 两个域名的技术角色、出站链接关系和社交账号映射 [High] | 两个域名是否由同一注册法人持有；公司注册名未披露 |
| 官网在售商品、公开售价、交付形式与承诺周期 [High] | 实际销量、收入、退款率、毛利率、团队分成 |
| 官网自述粉丝规模与第三方可见 TikTok 指标 [Medium/Low] | TikTok 到 `.store`、`.store` 到 `.com` 的真实点击率和购买转化率 |
| 公开页面存在模板化条款及所收集的出生信息 [High] | Wix、Beacons 或支付服务内部保存、共享和删除数据的实际流程 |

---

## 一、产品总览

| 维度 | 详情 |
|---|---|
| **产品名** | Amy Demure / Amy Demure's Astrology |
| **所属公司** | Not disclosed；公开页面呈现为 Amy Demure 个人创作者品牌，注册法人、母公司及总部未披露 [Unverified] |
| **创始人/核心团队** | Amy Demure；官网自述拥有统计学学位，并以直觉与数据分析结合的方式传播占星内容 [High]。另有“my astrologers”团队，但成员、雇佣关系与规模未披露 |
| **产品形态** | TikTok 内容账号 + Beacons 导航站 `.store` + Wix 交易站 `.com` + 数字 PDF/音频解读 + Zoom 服务 |
| **营收规模** | Not disclosed；本报告仅建立可复核的外部情景模型，不把模型值视为真实收入 |
| **用户规模** | 官网自述全平台约 200 万粉丝 [High, company-reported]；TikTok 第三方抓取约 158 万粉丝 [Low] |
| **定位证据** | 官网原文：`"Amy Demure's Astrology"`；`.store` 页面原文：`"@amydemure_: July Guidebooks, Astrology Reading - Ask Up To 8 Questions."` [High] |
| **核心功能** | 月度十二星座 Guidebooks、个性化占星问答、出生星盘分析、爱情占星、塔罗、Zoom 咨询、团队成员解读 |
| **主要市场** | 英语用户；创作者出生地和第三方账号地区指向加拿大，商品以美元标价，内容与竞品结构表明美国也是关键可服务市场 [Medium] |
| **商业模式** | 数字内容一次性购买 + 人工服务一次性购买 + 团队服务 + 外部合作/潜在联盟导流；未发现会员订阅 [High/Medium] |
| **融资历程** | Not disclosed；未发现可信融资或估值记录 |
| **核心优势** | 约 200 万自有社交受众、个人信任关系、从 $20 到 $300 的价格阶梯，以及“短视频内容—导航页—交易页”的短链路 |

### 双站点与 TikTok 的关系

| 层级 | 资产 | 可验证角色 | 关键证据 | 结论置信度 |
|---|---|---|---|---|
| 内容发现 | TikTok `@amydemure` | 发布占星、星座、月相与解读内容；视频文案持续提示 readings / guidebooks 位于 bio | `.store` 配置的 TikTok 字段为 `amydemure`；第三方抓取近期视频文案与账号一致 | [Medium] |
| 导航与归因 | `amydemure.store` | Beacons 自定义域名 link-in-bio；聚合所有商品和外部合作链接 | HTTP `x-middleware-rewrite` 指向 Beacons `amydemure_`；页面 JSON 中 `isPartOf: https://beacons.ai` | [High] |
| 交易与交付 | `amydemure.com` | Wix 商店、预约、付款、表单和数字/人工服务说明 | `.store` 六个自有商品按钮均导向 `.com` 或 Wix 短链 | [High] |
| 外部变现 | Everclear | “favorite tarot readers and psychics”推荐链接 | `.store` 存在带 `affiliate_id=1004` 与 `offer_id=1` 参数的链接 | [High] 链接事实；具体佣金未披露 |

> **核心洞察**：`.store` 是社交流量路由器而不是第二套商品数据库；商业效果应按 TikTok 曝光 → bio 点击 → `.store` 链接点击 → `.com` 商品页 → 支付成功分层归因，不能把社交增长直接等同于交易增长。

---

## 二、关键数据趋势

| 时间      | 用户规模                                            | 收入            | 关键事件                                                             |
| ------- | ----------------------------------------------- | ------------- | ---------------------------------------------------------------- |
| 2021    | Not disclosed                                   | Not disclosed | 第三方人物资料称完成 Western University 统计学学位 [Low]                        |
| 2022    | 单条视频曾超过 300 万播放 [Low]                           | Not disclosed | 以星座、月相与灵性内容获得大规模 TikTok 曝光                                       |
| 2025    | 官网自述全平台约 200 万粉丝 [High, company-reported]       | Not disclosed | 官网 About 页面形成“数据分析 + 直觉占星”个人定位                                   |
| 2026-07 | TikTok 第三方抓取约 158 万粉丝、9704 万点赞、约 1810 条视频 [Low] | Not disclosed | `.store` 作为 Beacons 导航页，推广 July Guidebooks、个人解读、Zoom 与 Everclear |

公开数据没有连续的收入或购买用户序列，因此不能计算真实 YoY、复购率或 cohort 留存。报告后续增长与收入数字均为显式假设模型。

---

## 三、竞品对比

### 主要竞品（直接争夺相同需求）

| 维度 | Amy Demure | CHANI | Co–Star | Sanctuary |
|---|---|---|---|---|
| 定位 | 创作者主导的占星指南与人工解读 | 创作者品牌、个性化占星、自我成长内容 | 超个性化、社交化实时星盘与关系解读 | 占星/塔罗/灵媒的实时专家市场 |
| 目标用户 | TikTok 驱动的英语年轻女性与灵性内容受众 [Medium] | 重视包容、自我照护与仪式的用户 | 追求社交分享、关系兼容和日常提醒的年轻用户 | 需要即时、真人答疑的用户 |
| 用户规模 | 官网称全平台约 200 万粉丝 [High, company-reported] | 约 200 万下载 [Medium, Inc.] | 2021 年公司称超 2000 万下载 [Medium, Axios] | 官网称 700 万+用户 [High, company-reported] |
| 营收规模 | Not disclosed | Inc. 估算年收入约 $14M [Medium] | Not disclosed | Not disclosed |
| 公开价格 | $20 指南；$65—$300 服务 | $11.99/月 [High] | $9/单份爱情解读 [High] | $9.99/月或 $69.99/年；人工服务 $4.99—$19.99/分钟 [High] |
| 主要变现 | 数字指南 + 人工服务 + 外链 | 订阅 + 电商 +课程 | 单次解读 + 应用内服务/订阅 | 订阅 + 按分钟专家服务 + 数字商品 |
| 核心差异点 | 大体量个人社交分发和个人声音交付 | 稳定订阅、应用留存和价值观品牌 | 算法个性化、社交关系图谱、规模 | 即时供给、评价体系和专家市场流动性 |
| 主要约束 | 个人产能、无原生应用、条款与隐私页面不完整 | 订阅竞争与内容持续投入 | 个性化内容的信任与数据隐私 | 专家质量控制、抽成与实时供给 |

### 次要竞品（工具与免费内容替代）

| 维度 | Astro.com |
|---|---|
| 定位 | 专业星盘计算、星历、解释内容与占星数据库 |
| 目标用户 | 从初学者到专业占星师 |
| 用户规模 | 官方称每月超过 800 万访问者 [High, company-reported] |
| 营收规模 | Not disclosed |
| 公开价格 | 大量免费工具；付费报告、订阅和广告支持 |
| 核心差异点 | 9000 年星历、超过 8 万条 Astro-Databank 数据及专业工具深度 |
| 对 Amy Demure 的替代性 | 用户可免费生成星盘和获得基础解释，但缺少 Amy 的个人表达、TikTok 关系和人工陪伴 |

> **核心洞察**：Amy Demure 在分发规模上接近成熟创作者品牌，但产品系统仍更像高流量个人工作室。CHANI 和 Co–Star 的优势是软件化留存，Sanctuary 的优势是专家供给规模，Astro.com 的优势是免费工具与专业数据深度。

---

## 四、深度分析

### 4.1 变现与收入模式

> **核心洞察**：价格阶梯已经成立，增长上限主要取决于能否把 $20 数字指南做成高复购入口，并把 $145—$300 的个人产能从“创作者亲自交付”扩展为有质量标准的团队服务。

#### 收入来源与价格架构

| 业务线 | 公开价格 | 交付方式 | 收入性质 | 产能约束 |
|---|---:|---|---|---|
| 月度 Guidebooks | $20/星座 | 数字内容 | 可重复、非订阅 | 低边际成本；需要每月更新 |
| Eclipse Guidebooks | $22/星座 | 数字内容 | 事件驱动 | 低边际成本；季节性 |
| 团队成员解读 | $65 | 邮件/表单 + 人工解读 | 一次性服务 | 团队工时；Amy 审核 |
| Amy 问答/爱情/塔罗 | $145 | 个人语音，约 7 天交付 | 一次性服务 | Amy 工时 |
| 出生星盘分析 | 约 $207 | 个人语音，约 14 天交付 | 一次性服务 | Amy 工时更高 |
| Zoom 咨询 | $300/小时 | 实时视频 | 一次性服务 | 最高工时约束 |
| Everclear 导流 | Not disclosed | 外部平台链接 | 潜在联盟收入 | 取决于点击与成交；佣金未披露 |

#### 独立站收入情景模型

公开数据没有 `.com` 年访问量，因此以下以 TikTok 内容触达反推可归因会话；这不是实际收入估算。公式：`月视频数 × 单条平均播放 × bio 点击率 × `.store→.com` 点击率 × 购买转化率 × 模型 AOV × 12`。

| 场景 | 月视频数 | 单条播放 | Bio CTR | `.store→.com` CTR | CVR | 模型 AOV | 年可归因收入 |
|---|---:|---:|---:|---:|---:|---:|---:|
| 保守 | 10 | 250,000 | 0.15% | 55% | 1.5% | $45 | `10×250k×0.15%×55%×1.5%×$45×12 ≈ $16.7k` [Low] |
| 基准 | 13 | 500,000 | 0.30% | 65% | 2.0% | $60 | `≈ $182.5k` [Low] |
| 乐观 | 16 | 750,000 | 0.50% | 70% | 3.0% | $75 | `≈ $850.5k` [Low] |

模型只覆盖 TikTok 可归因的独立站成交，不含 Instagram、直接流量、回访、邮件、Everclear、线下或未公开渠道。公开售价区间不等于 AOV；表内 AOV 是显式模型假设。

#### TAM / SAM / SOM

| 层级 | 市场规模 | 推导与数据来源 |
|---|---:|---|
| TAM | 美国 psychic services 2024 年约 $2.3B [Medium] | AP 援引 IBISWorld；涵盖占星、塔罗、灵媒与算命服务，口径大于本产品 |
| SAM | 约 $460M—$805M [Low] | `TAM $2.3B × 数字/在线可服务比例 40%—50% × Amy 可覆盖的英语年轻受众及价格带比例 50%—70%`；后两项为假设 |
| SOM（3 年） | 约 $0.3M—$1.5M 年收入 [Low] | 不是当前收入；对应 SAM 的约 0.04%—0.33%，并受个人品牌与团队产能限制 |

另一份行业研究把 2025 年全球 Horoscope & Astrology Apps 市场估为 $1.16B、2032 年 $2.16B、CAGR 9.28% [Medium]。该口径以应用为主，不应与包含人工服务的 $2.3B 美国 psychic services 直接相加。

#### 单位经济与 ARPU 杠杆

| 指标 | 当前公开值 | 外部模型 | 说明 |
|---|---|---|---|
| 付费客单 | Not disclosed | $45—$75 [Low] | 综合 $20 数字内容与 $65—$300 服务的模型假设 |
| 数字内容贡献毛利 | Not disclosed | 70%—90% [Low] | 未获得平台费、支付费、制作工时与退款数据 |
| 人工服务贡献毛利 | Not disclosed | 不建模 | 缺少交付时长、团队分成与返工率 |
| CAC | Not disclosed | 自有社交流量的现金 CAC 可能较低 [Low] | 不代表总 CAC 为零；创作工时、设备、平台与机会成本仍存在 |
| LTV/CAC | Not disclosed | 无法可靠计算 | 必须获得客户级复购和渠道成本 |

ARPU 提升的可量化杠杆：若 Guidebook 买家中 15% 从单星座 $20 升级为“Sun + Rising”双份 $36 捆绑，数字内容买家平均订单可增加约 `$16×15%=$2.40`；若另有 3% 转化为 $65 团队解读，期望收入增加 `$65×3%=$1.95`。在不改变流量的情况下，模型 AOV 可从 $20 提升至约 $24.35，增幅约 21.8% [Low]。

### 4.2 用户增长与获客

> **核心洞察**：增长飞轮强在 TikTok 内容供给和创作者信任，弱在站内激活与复购机制。真实瓶颈应通过跨域归因验证，而不是由粉丝或播放量直接推断。

#### 渠道排序

| 排名 | 渠道 | 公开证据 | 判断 |
|---:|---|---|---|
| 1 | TikTok 自然内容 | `.store` 绑定 `@amydemure`；近期视频反复使用 readings / guidebooks CTA | 核心发现渠道 [Medium] |
| 2 | Instagram | `.store` 绑定 `@amydemure_`；第三方资料称约 75 万粉丝 | 重要辅助渠道 [Low] |
| 3 | Link-in-bio / Direct | `.store` 聚合全部产品链接 | 核心路由，但流量规模未披露 [High/Unverified] |
| 4 | 官网 SEO | 商品页已被搜索引擎抓取，但站点内容深度和关键词覆盖未量化 | 现有承接渠道 [Medium] |
| 5 | 合作与联盟 | `.store` 存在 Everclear 参数化链接 | 已存在外部合作路径 [High] |
| 6 | 付费获客 | Not disclosed | 不能从公开数据确认是否投放 |

#### 增长飞轮

`星象事件/星座短视频 → TikTok 推荐扩散 → 关注与重复触达 → Bio 进入 .store → 选择 $20 低门槛指南或高价解读 → 交付体验与社交反馈 → 下一次月相/逆行/星象事件再次购买`。

飞轮中的可验证强化因素是星象事件天然形成内容日历；薄弱环节是官网未展示可审计的会员体系、客户账户价值、复购提醒或跨产品进度。

#### 漏斗与瓶颈模型

| 阶段 | 基准假设 | 100 万视频播放对应人数 | 最需要的观测事件 |
|---|---:|---:|---|
| 视频观看 | 100% | 1,000,000 | TikTok views / unique viewers |
| Profile/Bio 点击 | 0.30% [Low] | 3,000 | profile_view、bio_click |
| `.store` 到商品页 | 65% [Low] | 1,950 | outbound_click，按 link_id 区分 |
| 商品页有效参与 | 45% [Low] | 878 | product_view、scroll、form_start |
| 购买 | 2.0% 商品页会话 [Low] | 18 | purchase、product、value、currency |
| 60 天复购 | 20% [Low] | 4 | customer_id、repeat_purchase |

若 `.store→.com` 点击率从 65% 提升到 75%，其余参数不变，每 100 万播放的订单模型由约 17.6 单增至 20.3 单，增幅约 15.4%。若商品页 CVR 从 2% 提升到 2.6%，订单增幅为 30%。因此优化优先级应由真实数据判断是“路由点击”还是“商品页信任/结账”损失。

#### 留存推断

没有 DAU/MAU、客户 cohort 或复购数据，不能推断 D1/D7/D30 产品留存。对该业务更合理的指标是：Guidebook 30/60/90 天复购率、首次购买后 90 天跨品类购买率、解读完成后的二次预约率。行业类比只可作为目标：基准方案可先以 Guidebook 60 天复购 20%—30% 为实验目标 [Low]，而非声称当前已达到。

### 4.3 竞争定位（SWOT）

#### 优势

| 优势 | 详情 |
|---|---|
| 自有分发资产 | 官网自述约 200 万全平台粉丝；TikTok 第三方抓取约 158 万粉丝 [Medium/Low] |
| 价格梯度 | 从 $20 数字内容到 $300 实时服务，允许按信任与支付意愿分层 [High] |
| 创作者亲自交付 | 语音解读强化个人感和感知差异化 [High] |
| 内容日历天然持续 | 月相、逆行、星座季与年度周期提供稳定选题和复购触发点 [Medium] |

#### 劣势

| 劣势 | 详情 |
|---|---|
| 个人工时约束 | $145—$300 服务需要 Amy 亲自研究、录音或直播，扩张与一致性受限 [High] |
| 交易信任信息不完整 | Terms 页面仍是 Wix 模板占位文本，无法清晰确认退款、数据保存、争议与服务边界 [High] |
| 跨域归因复杂 | TikTok、Beacons、Wix 和外部平台分属多套系统，若没有统一 UTM/事件，漏斗会被拆散 [High] |
| 软件化留存不足 | 未发现原生应用、账户型长期档案、推送或订阅；与 CHANI/Co–Star 相比重复使用钩子较少 [Medium] |

#### 机遇

| 机遇 | 详情 |
|---|---|
| 订阅化月度指南 | 把单月 $20 购买转化为自动续订，可提高收入可预测性；需先验证复购意愿 |
| 团队服务标准化 | 已出现 $65 团队层，可用审核 rubric、SLA 与匹配机制扩大供给 |
| 免费工具获客 | Rising Sign / Birth Chart 基础计算器可承接搜索和社交流量，再升级至人工解读 |
| 合规与信任升级 | 完整条款、隐私说明、娱乐用途声明和交付/退款规则可直接降低结账顾虑 |

#### 威胁

| 威胁 | 详情 |
|---|---|
| 平台依赖 | TikTok 推荐或账号政策变化会影响主要触达渠道 |
| 低价自动化替代 | Co–Star 的 $9 报告、免费 Astro.com 工具和 AI 占星产品压低基础解读价格 |
| 个人品牌风险 | 产品、交付质量与创作者声誉高度绑定 |
| 隐私与营销监管 | 出生信息、关系/职业问题、推荐链接和效果型措辞提高隐私及误导营销风险 |

#### 功能对比矩阵

| 功能 | Amy Demure | CHANI | Co–Star | Sanctuary |
|---|---|---|---|---|
| 免费持续内容 | ✅ TikTok | ✅ App/内容 | ✅ App | ✅ App |
| 个性化星盘 | ✅ 人工 | ✅ 软件 | ✅ 软件 | ✅ 软件+真人 |
| 真人实时咨询 | ✅ Amy Zoom | ❌ | ❌ | ✅ 多专家即时 |
| 低价数字指南 | ✅ $20 | ⚠️ 订阅内容 | ✅ $9 报告 | ✅ 数字报告 |
| 订阅 | ❌ 未发现 | ✅ | ✅/应用内 | ✅ |
| 社交关系功能 | ❌ | ❌ | ✅ | ⚠️ 兼容内容 |
| 多专家市场 | ⚠️ 小团队 | ❌ | ❌ | ✅ |
| 专业免费工具 | ❌ | ⚠️ | ⚠️ | ⚠️ |

#### 竞品单位经济对比

| 指标 | Amy Demure | CHANI | Co–Star | Sanctuary |
|---|---|---|---|---|
| 公开付费价格 | $20—$300 | $11.99/月 | $9/报告 | $9.99/月；$4.99—$19.99/分钟 |
| ARPU | Not disclosed | Not disclosed | Not disclosed | Not disclosed |
| CAC | Not disclosed | Not disclosed | 历史报道称 2021 年前主要靠口碑 [Medium] | Not disclosed |
| LTV/CAC | Not disclosed | Not disclosed | Not disclosed | Not disclosed |
| 毛利率 | Not disclosed | Not disclosed | Not disclosed | Not disclosed |

#### Porter's Five Forces

| 力量 | 强度 | 理由 |
|---|---|---|
| 供应商议价能力 | 中 | Wix、Beacons、TikTok 与支付平台可替换但迁移有成本；个人服务供给对 Amy 本人依赖高 |
| 买方议价能力 | 高 | 免费星盘、低价 AI 报告、其他创作者和专家市场大量存在 |
| 新进入者威胁 | 高 | 创建内容和销售数字 PDF 的技术门槛低；获得百万级信任受众的门槛高 |
| 替代品威胁 | 高 | 免费工具、心理健康内容、宗教/灵性社群、朋友建议和治疗服务均可满足部分需求 |
| 行业竞争强度 | 高 | 应用、个人创作者、专家平台与传统占星网站同时争夺用户时间与支付 |

> **核心洞察**：防御性主要来自“创作者—受众关系”和内容分发，不来自独占数据或复杂技术。若不能把关系沉淀为客户账户、复购、邮件/短信许可和稳定交付标准，平台流量不等于可持续资产。

### 4.4 产品类型专项分析

> **核心洞察**：主类型是数字商品与服务电商，副类型是创作者媒体。核心经营指标应从粉丝数转向 SKU 转化、履约产能、复购和内容到交易的可归因效率。

#### E-commerce / DTC 专项

| 维度 | 公开观察 | 核心指标 |
|---|---|---|
| 销售指标 | 商品价格公开，真实 GMV/AOV/CVR 未披露 | 商品页 CVR、AOV、支付成功率、退款率 |
| 客户经济 | 社交自然流量可能降低现金 CAC，但内容成本未知 | CAC（含内容工时）、90 天 LTV、复购频次 |
| 供应与履约 | 数字指南低边际成本；个人解读 7—14 天；Zoom 1 小时 | 准时交付率、每单工时、积压天数、返工率 |
| 产品策略 | 12 星座形成 12 个 SKU；服务形成 $65/$145/$207/$300 梯度 | 星座 SKU 集中度、捆绑率、跨品类升级率 |
| 品牌与营销 | TikTok 为高可见渠道，个人品牌是购买信任核心 | 每千次播放产生的商品页会话与收入 |
| 跨境 | 美元定价、英语内容；税务、消费者保护和隐私适用范围需按客户所在地确认 | 国家/州/省收入占比、税费、拒付率 |

#### Media / 创作者内容专项

| 维度 | 公开观察 | 与成熟媒体产品差距 |
|---|---|---|
| 内容库 | 约 1810 条 TikTok 视频 [Low]；月度和事件型指南持续更新 | 站内可搜索内容库与主题集群较弱 |
| 参与度 | 第三方显示近期视频播放波动大，约 14.6 万—217 万 [Low] | 缺少自有 DAU/MAU、完读率和邮件参与度 |
| 订阅用户 | Not disclosed；未发现内容订阅产品 | CHANI/Sanctuary 用订阅建立经常性收入 |
| 创作者经济 | Amy 为核心创作者，另有小型 astrologer 团队 | 需要明确质量标准、署名、分工和审核 SLA |
| 分发 | TikTok、Instagram、YouTube、Beacons、Wix | 分发高度依赖第三方平台 |

### 4.5 产品架构与技术栈

> **核心洞察**：当前架构适合快速运营个人创作者业务，复制技术成本低。真正值得建设的技术资产是跨域归因、客户与出生数据治理、内容复用和团队履约系统。

| 层级 | 可验证技术 | 用途 | 置信度 |
|---|---|---|---|
| 内容平台 | TikTok / Instagram / YouTube | 内容发现与社交证明 | [High] 账号链接存在 |
| Link-in-bio | Beacons 自定义域名 + Next.js | `.store` 导航、出站链接、潜在归因 | [High] HTTP 头与页面源码 |
| 交易站 | Wix | 商品、表单、结账、预约和页面托管 | [High] 页面结构/Wix 短链 |
| 实时交付 | Zoom | 1 小时咨询 | [High] 产品页 |
| 支付 | 信用卡、PayPal；底层处理方未完整披露 | 收款 | [High/Unverified] |
| 数据与分析 | Not disclosed | 跨域漏斗、客户数据、留存 | [Unverified] |
| AI/ML | 未发现公开证据 | 无法确认是否用于内容或交付 | [Unverified] |

#### 技术护城河与复制难度

| 能力 | 复制难度 | 复制时间/成本 | 防御性判断 |
|---|---|---|---|
| Beacons + Wix 商业链路 | 低 | 数天；低四位数美元以内 [Low] | 技术不构成壁垒 |
| 12 星座数字指南商店 | 低—中 | 数周；内容质量决定成本 | 内容可复制，表达与受众关系较难复制 |
| 人工语音解读 | 中 | 需要占星能力、流程与品牌信任 | 可扩展性低但感知差异较强 |
| 百万级社交受众 | 高 | 通常需要多年内容积累或大量投放 | 当前最强防御资产 |
| 客户历史与个性化数据层 | 当前未证实 | 若建立需 3—6 个月基础系统 [Low] | 可能形成复购与个性化壁垒 |

安全重点是跨域身份、出生数据最小化、访问权限、保存期限、导出/删除流程和第三方处理方清单。出生日期、时间和地点能共同形成高度具体的个人资料，关系与职业问题还可能包含敏感主观信息。

### 4.6 UX 与产品设计

> **核心洞察**：发现路径短、价格清晰，但“先产生信任再支付”的信息层不完整。模板化条款是当前最直接的 UX 与合规共同缺口。

#### 核心旅程

1. 用户从 TikTok 内容进入个人主页。
2. 点击 Bio 到达 `.store`，看到七个主要链接。
3. 选择 Guidebook 或解读，跨域进入 `.com` 商品页。
4. 提交出生信息、问题和邮箱，完成支付。
5. 等待数字下载、7—14 天语音交付或预约 Zoom。

| 环节 | 优点 | 摩擦点 | 优先改进 |
|---|---|---|---|
| TikTok → `.store` | 与用户消费内容场景连续 | 页面品牌名显示 `@amydemure_`，而 TikTok 是 `@amydemure`，可能造成轻微账号识别摩擦 | 明示“Official links for @amydemure” |
| `.store` → 商品 | 链接数量适中，直接对应高意图商品 | 缺少价格、交付时间与“适合谁”的首屏比较 | 在按钮副标题显示 `$20 / $145 / 7 days` |
| 商品详情 | 价格和交付形式较清楚 | 多个页面价格存在 $207/$210 显示差异；条款模板化 | 统一价格源、补齐政策 |
| 表单 | 收集个性化所需信息 | 未在输入前解释数据用途、保存期和删除方式 | 就地隐私说明 + 必填最小化 |
| 交付后 | 人工语音具有高感知价值 | 未见结构化复购、评价和后续产品路线 | 交付邮件加入下一周期选择和合规评价邀请 |

可访问性方面，公开抓取无法完整验证键盘导航、对比度、表单标签和屏幕阅读器体验，应通过 WCAG 2.2 AA 人工测试确认。多语言和本地币种未见明确支持。

### 4.7 Go-to-Market 策略

> **核心洞察**：GTM 已从“短视频创作者变现”进入“产品组合与团队供给”阶段，但尚未显示从一次性购买向自有客户关系与软件化留存的跃迁。

#### GTM 演进

| 阶段 | 时间 | 核心动作 | 可验证结果 |
|---|---|---|---|
| 内容获客 | 早期—2022 | 星座、月相与灵性短视频 | 百万播放案例、粉丝增长 [Low] |
| 个人服务变现 | 2022—2025 | 私人占星/塔罗解读 | 官网形成 $145—$300 服务层 [High] |
| 数字商品扩张 | 2025—2026 | 月度/事件型 12 星座指南 | $20—$22 低价 SKU，降低首次购买门槛 [High] |
| 团队与合作 | 2026 | $65 团队解读、Everclear 外链 | 初步扩充供给和外部变现 [High] |

#### 可执行 GTM 方案

| 动作 | 设计 | 预期影响（模型） | 验证周期 |
|---|---|---|---|
| 星象事件落地页 | 每个高热视频使用独立 UTM 和对应事件页 | 将 `.store→商品` CTR 从 65% 提升至 75%，模型订单 +15% [Low] | 4 周 |
| Sun + Rising 捆绑 | 两份指南 $36，而非 $40 | 若 15% 买家采用，数字内容 AOV +12% [Low] | 2 个月 |
| Guidebook 订阅测试 | $17/月自动续订，保留单买 $20 | 若单买用户 20% 订阅，收入可预测性提高；真实流失需观察 | 3 个月 |
| 团队解读服务等级 | $65 标准版、明确 SLA 和 Amy 审核标准 | 扩大产能并保护 $145 个人版定价 | 6—8 周 |
| 免费 Rising Sign 工具 | 用出生信息生成基础结果，明示隐私选项 | 增加搜索承接和邮件许可；不预设转化 | 8—12 周 |

内容策略应把 TikTok 的高频话题映射到站内可索引页面：`Mercury retrograde + sign`、`new moon + sign`、`love astrology reading`、`birth chart reading`。但 SEO、社交与付费渠道必须分别归因，不能把总流量变化归因于单一动作。

### 4.8 合规与监管

> **核心洞察**：最紧急事项是把真实业务政策替换 Wix 模板文本，并为出生信息、关系/职业问题、外部推荐和结果型措辞建立清楚的数据与营销边界。

| 风险面 | 公开现状 | 适用原则 | 优先级 |
|---|---|---|---|
| 隐私政策 | Terms 页面仍是 Wix 占位文案 [High] | 加拿大 PIPEDA 要求说明目的、同意、最小收集、保存、安全、访问与申诉 | Critical |
| 跨境数据 | Wix/Beacons/支付/Zoom 可能处理跨境数据，实际清单未披露 | PIPEDA 对跨省/跨境商业个人信息适用；美国州法视用户与门槛而定 | High |
| 出生与主观信息 | 收集出生日期、时间、地点、邮箱、职业、关系和问题 [High] | 最小化、用途限制、保存期限、访问/删除、供应商合同 | Critical |
| 娱乐/建议边界 | 页面使用“attract love, money and success”“avoid disaster”等强结果措辞 [High] | 避免保证结果；明确娱乐/自我反思用途，不替代医疗、法律或财务建议 | High |
| 推荐披露 | Everclear 链接含 affiliate 参数 [High] | 加拿大 Competition Bureau 要求显著、清晰披露重大关系；仅链接或标签通常不够 | High |
| 评价与背书 | 未系统核验 | FTC 2024 Consumer Reviews and Testimonials Rule 禁止虚假/误导评价 | Medium |
| 消费者政策 | 退款、取消、迟延、数字商品和预约规则未清楚显示 | 按经营地与消费者所在地适用的电商/消费者保护规则确认 | High |

#### 监管竞争优势矩阵

| 维度 | Amy Demure | CHANI | Co–Star | Sanctuary |
|---|---|---|---|---|
| 隐私透明度 | 待提升：公开条款为模板文本 | 中性：有成熟应用政策 | 中性：有应用条款与隐私体系 | 中性：有隐私与平台 FAQ |
| 专家质量披露 | 待提升：小团队标准未公开 | 不适用 | 不适用 | 较强：官网称专家经审核并有评分 |
| 服务边界 | 待提升 | 中性 | 中性 | 中性 |
| 联盟披露 | 待提升：参数可见但页面披露未见 | 不适用/未核验 | 不适用/未核验 | 不适用/未核验 |

最低合规包应包括：真实 Legal Name/联系主体、Privacy Policy、Terms of Service、Refund/Cancellation、Digital Delivery、Entertainment Disclaimer、Affiliate Disclosure、数据保存与删除流程、未成年人规则、第三方处理方清单。法律适用需由加拿大和目标美国市场律师确认。

### 4.9 重点市场专项：美国与加拿大英语市场

> **核心洞察**：美国需求规模充足且年轻女性/LGBTQ+ 用户倾向更强；加拿大是创作者身份和可能的运营基础。市场机会存在，但只有约 1% 美国成年人表示在重大决策中高度依赖这类实践，产品表达应强调娱乐、自我反思和个人洞察，而非结果保证。

#### 用户与需求

Pew 2024 年调查显示，30% 美国成年人每年至少一次接触占星、塔罗或算命；约 20% 主要出于娱乐，约 10% 认为可提供有用洞察，仅约 1% 在重大决策中“高度依赖”。女性 18—49 岁约 40% 表示相信占星，LGBTQ+ 成年人约一半每年至少接触占星或星座内容 [High/Medium]。

| 细分 | 公开信号 | 产品意义 |
|---|---|---|
| 美国 18—49 岁女性 | 相信占星比例约 40% [High, Pew] | 与 TikTok、爱情与自我成长内容高度匹配 |
| LGBTQ+ 成年人 | 约一半每年至少接触相关实践 [High, Pew] | 包容性表达和安全社区标准重要 |
| 娱乐型用户 | 约 20% 美国成年人主要为娱乐使用 [High, Pew] | $20 指南和社交内容比高承诺服务更适合广泛入口 |
| 洞察型用户 | 约 10% 认为可提供有用洞察 [High, Pew] | 人工语音和 Zoom 更适合高意图、小规模变现 |

#### 市场竞争位置

| 产品 | 美国/加拿大市场优势 | Amy Demure 的相对位置 |
|---|---|---|
| Co–Star | 规模、社交关系、低价个性化 | Amy 的真人信任更强，软件留存更弱 |
| CHANI | 创作者品牌、订阅、价值观与应用内容 | 商业路径最接近成熟版本 |
| Sanctuary | 即时真人供给、评分与市场流动性 | Amy 更个人化，但无法提供全天候供给 |
| Astro.com | 免费专业工具、长期数据和 SEO | Amy 更具社交表达，但工具和搜索资产较弱 |

美国市场需关注 FTC 背书/评价规则、州隐私法、数字服务消费者保护和销售税；加拿大需关注 PIPEDA、Competition Act 的误导营销和联盟披露。是否达到某州隐私法收入/用户门槛未披露，不能直接断言 CCPA 等已适用。

---

## 五、综合评估与建议

### 综合评分

评分口径：`公开产品完整度 35% + 竞品相对位置 30% + 可验证近期趋势 20% + 数据/合规准备度 15%`。星级反映公开证据，不代表内部经营质量。

| 维度 | 评分 | 说明 |
|---|---|---|
| 产品力 | ⭐⭐⭐ | 商品与服务梯度清楚，但缺少订阅、账户型体验与专业免费工具 |
| 增长势能 | ⭐⭐⭐⭐ | 百万级社交受众与事件型内容日历强；跨域归因和平台依赖限制可验证性 |
| 变现能力 | ⭐⭐⭐ | 已覆盖 $20—$300，但真实 CVR、复购与产能未披露 |
| 竞争壁垒 | ⭐⭐⭐ | 个人品牌与受众关系较强，技术、数据和转换成本较低 |
| 市场前景 | ⭐⭐⭐⭐ | 美国需求广泛，行业仍增长；免费/AI 替代和监管表达是长期约束 |

### 估值参考

目标业务没有公开收入、利润、订阅数或交易量，不能使用可比公司的融资估值直接推导。Co–Star 的融资体现软件平台资本预期，CHANI 的收入估算包含成熟订阅应用，二者不适合作为 Amy Demure 当前业务的直接倍数。

| 可比参照 | 公开事实 | 可用性 |
|---|---|---|
| CHANI | Inc. 估算年收入约 $14M、约 200 万下载 [Medium] | 可验证创作者品牌向订阅应用扩张的上限，不可直接套倍数 |
| Co–Star | 2021 年 $15M Series A、公司称 2000 万+下载 [Medium] | 属 VC 软件平台，不可与个人服务业务直接比较 |
| Sanctuary | 官网称 700 万+用户，订阅与按分钟市场模式 [High, company-reported] | 可对标供给扩张，不可推导目标估值 |
| 小型创作者电商 | 无可信公开交易样本 | 应按可验证 SDE/EBITDA、收入稳定性与创作者依赖折价 |

条件式估值模型：若未来可验证年收入为 $0.3M—$1.5M，且形成 ≥40% 经常性/复购收入、创作者本人不承担全部交付，可用 `0.8×—2.0× revenue` 作为小型创作者数字业务的内部工作区间，对应约 $0.24M—$3.0M [Low]。这不是当前估值；缺少报表、利润、客户集中度和知识产权确认时不应对外引用。

### 战略建议

1. **两周内修复信任与合规底座**：替换 Wix 模板条款，发布 Privacy、Terms、Refund、Delivery、Entertainment 与 Affiliate Disclosure。目标是把“政策页可读且完整”覆盖率从当前公开可见的不足状态提升至 100%。
2. **建立完整跨域归因**：TikTok 每个 campaign 使用独立 UTM；`.store` 记录 link_id；Wix 记录 product_view、form_start、checkout、purchase；统一匿名 visitor_id。四周内获得每个视频主题的 bio CTR、出站 CTR 和商品 CVR。
3. **优先扩张数字产品而非个人工时**：测试 Sun + Rising $36 捆绑和 $17/月 Guidebook 订阅。以 60 天复购、退款和取消原因决定是否扩大，不以首次销售额单独判断。
4. **把 $65 团队服务产品化**：公开团队成员资料、服务边界、样例、交付 SLA 和 Amy 审核 rubric；先限定每周容量，在准时交付 ≥95%、返工 ≤5% 后再扩大。
5. **建设一个免费工具型入口**：Rising Sign 或基础 Birth Chart 工具，输出后提供 $20 指南和 $145 解读的差异化升级。出生数据默认不保存，只有用户明确同意后才进入账户或营销系统。

### 风险矩阵

| 风险 | 可能性 | 影响 | 风险等级 | 缓解策略 |
|---|---|---|---|---|
| 隐私/条款与真实数据处理不一致 | 高 | 高 | Critical | 完成数据地图、真实政策、供应商清单、访问/删除与保存期限 |
| TikTok 分发下降或账号事件 | 中 | 高 | High | 邮件许可、SEO 工具、Instagram/YouTube 分散、客户账户 |
| Amy 本人产能或声誉单点依赖 | 高 | 高 | Critical | 团队标准化、容量上限、交付 QA、数字产品占比提升 |
| AI/免费产品压低基础解读价格 | 高 | 中 | High | 强化真人声音、信任、审阅与后续互动，不竞争纯计算价格 |
| 强结果措辞引发误导营销风险 | 中 | 高 | High | 娱乐/反思定位、删除保证结果式表述、审阅广告和客户评价 |

### 场景规划（2027—2029）

所有预测从外部情景模型出发，不代表当前经营基线。

| 场景 | 概率 | 关键假设 | 可识别客户规模 | 年收入 | 条件式估值 |
|---|---:|---|---:|---:|---:|
| 乐观 | 20% | 订阅成立、团队服务标准化、跨域 CVR 提升、平台流量稳定 | 15k—30k 付费客户/年 [Low] | $1.5M—$3.0M [Low] | $2.4M—$6.0M [Low] |
| 基准 | 50% | 维持社交分发，Guidebook 有一定复购，个人服务受容量限制 | 5k—12k 付费客户/年 [Low] | $0.4M—$1.2M [Low] | $0.3M—$2.0M [Low] |
| 悲观 | 25% | 社交流量下降、复购弱、团队扩张不稳定 | 1k—4k 付费客户/年 [Low] | $0.08M—$0.35M [Low] | $0.05M—$0.4M [Low] |
| 极端 | 5% | 平台/声誉/合规事件使核心漏斗中断 | <1k 付费客户/年 [Low] | <$0.08M [Low] | 资产出售价值有限 [Low] |

---

## 六、结论

Amy Demure 已拥有大多数早期创作者商业项目最难获得的资产：大规模、持续活跃且与明确主题绑定的自有受众。两个网站并不冲突，`.store` 是 TikTok/Instagram 流量的 Beacons 路由层，`.com` 是 Wix 交易与交付层。当前战略重点不是再建一个网站，而是把两层之间的归因、信任、隐私和复购补齐。

短期优先级应是政策与数据治理、跨域漏斗埋点和价格/交付一致性；中期才是 Guidebook 订阅、免费工具和团队服务扩张。若这些基础未建立，百万级粉丝只能证明触达能力，不能证明收入质量或企业价值。

---

## 参考来源

### Amy Demure 官方与直接技术证据

- [Amy Demure 官方首页](https://www.amydemure.com/)
- [Amy Demure About Me](https://www.amydemure.com/about-me)
- [Amy Demure `.store` Beacons 导航页](https://amydemure.store/)
- [July Guidebooks](https://www.amydemure.com/shop-2)
- [Readings 商品列表](https://www.amydemure.com/shop-1)
- [Astrology Reading — Ask Up to 8 Questions](https://www.amydemure.com/product-page/mini-astrology-reading)
- [Birth Chart Reading](https://www.amydemure.com/product-page/birth-chart-reading)
- [Zoom Call With Amy Demure](https://www.amydemure.com/service-page/zoom-call-with-amy-demure)
- [Book with one of Amy Demure's astrologers](https://www.amydemure.com/book-an-astrologer)
- [Amy Demure Terms and Conditions](https://www.amydemure.com/terms-and-conditions)
- [Amy Demure Linktree](https://linktr.ee/amydemure)
- [TikTok `@amydemure` 搜索页](https://www.tiktok.com/search?q=amydemure)

### 社交与第三方资料

- [Urlebird — `@amydemure` 可见账号指标](https://urlebird.com/user/amydemure/)
- [Famous Birthdays — Amy Demure](https://www.famousbirthdays.com/people/amy-demure.html)

### 竞品

- [CHANI 官方 About](https://www.chani.com/about/about-chani)
- [CHANI App](https://www.chani.com/app)
- [Inc. — CHANI downloads and estimated revenue](https://www.inc.com/gabrielle-bienasz/how-this-company-uses-astrology-to-make-business-decisions/91254002)
- [Co–Star Advanced Readings](https://www.costarastrology.com/advanced-readings)
- [Axios — Co–Star $15M Series A and 20M downloads](https://www.axios.com/2021/04/14/astrology-app-co-star-raises-15-million-funding)
- [Sanctuary FAQ](https://www.sanctuaryworld.co/faq/)
- [Sanctuary Subscription](https://www.sanctuaryworld.co/buy-subscription/)
- [Astrodienst About](https://www.astro.com/contact/contact_about_j.htm)
- [Astro.com free charts and data](https://www.astro.com/free/free_chart_e.htm)

### 市场与监管

- [Pew Research Center — Astrology, tarot or fortune tellers used by 30% of Americans](https://www.pewresearch.org/religion/2025/05/21/3-in-10-americans-consult-astrology-tarot-cards-or-fortune-tellers/)
- [AP — U.S. psychic services revenue and Pew survey summary](https://apnews.com/article/41a815371e107ddef503910eaa9d8378)
- [Horoscope & Astrology Apps market forecast](https://www.marketresearch.com/360iResearch-v4164/Horoscope-Astrology-Apps-Service-Type-43519388/)
- [Office of the Privacy Commissioner of Canada — PIPEDA requirements](https://www.priv.gc.ca/en/privacy-topics/privacy-laws-in-canada/the-personal-information-protection-and-electronic-documents-act-pipeda/pipeda_brief)
- [Competition Bureau Canada — Influencer marketing and the Competition Act](https://competition-bureau.canada.ca/en/deceptive-marketing-practices/types-deceptive-marketing-practices/influencer-marketing-and-competition-act)
- [FTC — Consumer Reviews and Testimonials Rule Q&A](https://www.ftc.gov/business-guidance/resources/consumer-reviews-testimonials-rule-questions-answers)
- [FTC — Endorsements, Influencers, and Reviews](https://www.ftc.gov/business-guidance/advertising-marketing/endorsements-influencers-reviews)
