---
title: GenGrowth SEO 工具用户痛点与需求洞察报告
date: 2026-07-28
updated: 2026-07-28
type: note
version: v1.6
status: draft
owner: Lynne
tags:
  - seo
  - user-research
  - tool-prioritization
  - local-seo
  - geo
aliases:
  - SEO 工具需求洞察
  - SEO 原子工具优先级研究
---

# GenGrowth SEO 工具用户痛点与需求洞察报告

> 研究市场：美国为主的英文市场  
> 决策对象：`参考资料/GenGrowth-全链路原子工具矩阵评估.html` 中的公开原子工具  
> 研究目的：判断哪些用户问题值得优先做成可搜索、可独立使用、可导入 GenGrowth 主产品的工具页

## 一、执行结论

现有 6 个旗舰工具的方向基本成立，但有三处需要调整：

1. **本地 SEO / Google Maps / Google Business Profile 用户需求没有进入 112 个候选工具**——这是覆盖面上的真实遗漏。但补足这个遗漏的方式是**先做最小验证，不是直接给旗舰席位**：本地这一格的供给已经成熟且分工明确，用户群与 GenGrowth 主产品的重合度也需要先验证（见 §7.3）。
2. **Organic Traffic Drop Diagnosis 被排得太靠后**——它是全部候选中损失强度最高、且现有供给最空的一个，同时是把用户导向"连接 GSC"最自然的入口。
3. **SEO + GEO 可见度快照的形态需要改**——通用免费快照这一格已被 Ahrefs、Semrush、Backlinko 的免费免注册工具占满，差异化只能落在"为什么没被引用"。

建议把当前第一阶段旗舰组合调整为：

| 建议级别 | 工具方向 | 决策 | 核心原因 |
|---|---|---|---|
| P0 | Google Search Console Opportunity Finder | 保留并改外部命名 | 外部用户不搜 `GSC Quick Wins`（搜索量 0 且零补全）；应承接高展现低 CTR、排名 8–20、下降页面等具体任务，主产品续接最强 |
| P0 | Internal Link & Orphan Page Map | **上调** | 排序依据是工程杠杆而非需求量级：数据可复用既有内链系统，且有一手内链审计事故作为问题真实性背书 |
| P0 | Organic Traffic Drop Diagnosis | **进入旗舰组合** | 损失强度最高；问题词需求成熟（`why is my website traffic dropping` 补全簇完整）而工具词不成熟，SERP 首屏由教程与官方帮助页占据，几乎无工具承接；连接 GSC 是最自然的注册触发点。匿名版只做证据分流，根因树在登录后给 |
| P0 | Website SEO Audit / 网站健康地图 | 保留 | `website audit tool` 美国月搜索量约 2,400，相关 `seo audit` 约 8,100；但必须以"优先行动"而不是健康分差异化 |
| P0 | Keyword + Prompt Opportunity Map | 保留 | `keyword research tool` 约 12,100/月，需求最大；需要把传统关键词、Prompt、竞争和下一步页面合并，避免成为关键词列表。话题集群作为其结果视图与长尾入口，不占独立席位 |
| P1 | AI Search Visibility & Citation Gap | 保留，改变形态 | 通用快照已被 Ahrefs / Semrush / Backlinko 的免费免注册工具占位；差异化落在"为什么没被引用 + 引用来源缺口" |
| P1 | Content Decay & Cannibalization | 保留 | 用户问题真实，但许多工具误把关键词重叠当成真实冲突；需要 GSC 与时间序列才能可信 |
| P1 | Link Opportunity Library / 外链资源库 | **替换原外链计算器** | 形态为自然引用与编辑型链接的机会线索库；`guest post sites list`、`how to get backlinks for free`、`link building tools` 三族补全均为 10/10。定位红线见 §11.3 |
| P1 | SEO Starter Canvas / 立项画布 | 保留低位 | `seo checklist for new website` 500/月、CPC $1.20，商业意图弱且同质化免费内容充分 |
| P1 | Local Search Visibility Map | **保留验证门槛** | 痛点成立且商业性强，但需求量级低一个数量级、供给已专业化分工、与主产品 ICP 重合度未验证；进入开发排期前需先过 §十 的三项门槛（依据 §7.3） |
| P1 | Robots、Sitemap、Schema 等技术微工具 | 保持长尾 | 搜索意图稳定，但免费供给充分且被 Google 官方工具占位；差异化空间在插件形态与批量检查 |

> **决定：第一阶段 5 个 P0**——GSC 机会发现器、内链关系图与孤岛检查、流量下降诊断、网站健康地图、关键词与 Prompt 机会地图；其余全部进入 P1。完整清单（含中英文名、页面 URL、承接搜索词）见 §十一。\n>\n> 两项约束需要在排期时保留：Organic Traffic Drop Diagnosis 的瓶颈是工程而非市场，必须排在 GSC 连接能力可用之后（见 §九）；Local Search Visibility Map 虽列 P1，但进入开发排期前仍需先过 §十 的三项验证门槛。

## 二、证据边界与研究方法

### 2.1 本报告能支持什么

- `[High]` Google 官方资料可支持本地搜索、Business Profile、Search Console 的功能边界和官方口径。
- `[Medium]` 公开关键词数据库可支持美国市场代表词的需求量级、CPC 和相近搜索表达。
- `[Medium]` 有样本说明的行业调查可支持小企业、SEO 团队和 AI 搜索的共同问题。
- `[Low]` Reddit 讨论可支持用户原话、任务场景和情绪强度，但不能代表总体市场比例。

### 2.2 本报告不能直接支持什么

- 不能仅凭第三方搜索量预测 GenGrowth 可获得的流量、注册或收入。
- 不能把 Reddit 高赞帖当作人群渗透率。
- 不能把 CPC 直接等同于用户愿意为工具付费。
- 不能把 AI 可见度、AI 引流和 AI 转化混为一个指标。
- 不能把两个相近关键词的搜索量直接相加；高度重叠的词可能属于同一批搜索需求。

### 2.3 数据采集

1. **候选工具盘点**：读取现有 112 个候选工具和 6 个 P0 旗舰工具。
2. **关键词量级**：2026-07-28 通过 seodata.dev 公开 API 查询 20 个美国英文代表词，记录月搜索量、CPC、相近词与 SERP 重合度。
3. **SERP 供给**：对审计、关键词、聚类、内链、AI 可见度、本地 SEO、蚕食和流量下降等任务执行 40 余组定向搜索，判断结果页中的免费工具、综合套件、教程和社区内容供给。
4. **社区需求**：抽样 2025–2026 年 Reddit 的 r/SEO、r/bigseo、r/TechSEO、r/localseo、r/smallbusiness 等讨论，提取问题表达、替代工作流与对现有工具的不满。
5. **行业调查与官方资料**：优先采用 Google、美国政府、Gartner、YouGov 及公开披露样本量的行业调查；工具厂商研究只作中等置信度方向信号。
6. **搜索表达实测**：2026-07-28 抓取 44 组种子词的 Google 自动补全（`hl=en / gl=us`），用于校验工具命名是否是用户真实表达、以及用户期望的产品形态（网页工具 / 插件 / 模板）。原始数据与脚本随本报告归档，可重跑复核，见附录 A。

## 三、目标用户细分

### 3.1 核心用户层

| 用户层 | 典型规模 | 主要工作方式 | 最痛的问题 | 价格/产品偏好 | 优先承接工具 |
|---|---:|---|---|---|---|
| 独立站长、创作者、Indie Founder | 1 人 | 自己做内容、技术和分析 | 不知道先修什么；买不起完整套件；缺少可执行下一步 | 免费试用、单次付费、低价轻量 | 网站健康地图、关键词机会、GSC Opportunities |
| 小型内部 SEO / 内容团队 | 2–5 人 | 同时管理内容、技术和汇报 | 数据分散；任务排不出优先级；结果难交给执行者 | 可连接 GSC、协作、导出、历史对比 | GSC Opportunities、内容衰退、内链地图 |
| 精简增长团队 | 5–10 人 | SEO、内容、产品交叉协作 | SEO 与 GEO 分离；洞察无法变成 Owner 和行动 | 项目制、跨工具数据复用、行动追踪 | Keyword + Prompt Map、AI Visibility、Growth Graph |
| SEO Freelancer / 小型 Agency | 1–10 人，管理 5–50 个站点 | 审计、提案、月报、客户沟通 | 多项目成本、白标报告、解释成本、工具席位贵 | 多项目、批量、白标、客户可读报告 | 网站健康地图、Local Visibility、Portfolio Health |
| 中小电商与 DTC | 1–10 人营销团队 | 产品页、类目页、内容并行 | 页面蚕食、孤岛页、内容衰退、商品结构复杂 | Shopify/WooCommerce 适配、URL 级行动 | 内链地图、蚕食诊断、内容衰退 |
| B2B SaaS / 专业服务 | 2–10 人增长团队 | 长内容、落地页、Lead Gen | 核心更新后流量下降；品牌未被 AI 推荐；归因困难 | GSC/GA4/CRM 连接、竞品与 Prompt 对比 | Traffic Drop、AI Visibility、Keyword + Prompt |
| 本地商家 Owner / 店长 | 1–5 人管理 | 主要依赖 Maps、GBP、评论、电话和到店 | 看不到自己不同位置的真实排名；不知道评论、类目、页面先改哪项 | 非技术化、按门店、直接给动作 | Local Search Visibility Map |
| 多门店品牌 / 本地 SEO Agency | 5–20 人营销或代理团队 | 管理多个门店、区域和评论 | 批量监控、区域差异、异常门店和统一汇报 | 按 Location、批量、API、白标 | Multi-location Local Visibility |
| 技术 SEO / 开发者 | 1–5 人专项角色 | Crawl、日志、索引、模板修复 | 数据量大、误报多、修复优先级不足 | 原始数据、API、可复现规则 | 网站健康地图、内链与 Crawl Depth |

### 3.2 本地商家必须拆成三类

Google 官方将本地商家区分为以下类型，工具入口也应先让用户选择类型：

| 类型 | 官方定义摘要 | 典型行业 | 首要转化 | 核心 SEO 任务 |
|---|---|---|---|---|
| Storefront 到店型 | 顾客在营业时间到固定地点与商家面对面互动 | 餐厅、咖啡店、牙医、诊所、美容美发、健身房、零售、汽修 | 到店、预约、电话、路线 | Map Pack 排名、类目、评论、营业时间、照片、门店页 |
| Service-area 上门服务型 | 商家前往顾客所在地服务，不在注册地址接待顾客 | 水管工、HVAC、电工、清洁、园艺、移动维修、家政 | 来电、表单、报价 | 服务区域、城市/服务页、GBP 类目、评论、区域排名 |
| Hybrid 混合型 | 既在门店接待，也配送或上门服务 | 堂食+外送餐厅、门店+上门汽修、零售+本地配送 | 到店与上门并存 | 地址与服务区并存、不同转化路径、门店与服务页面 |

Google 明确说明 Business Profile 适用于与顾客面对面互动的实体店和服务区域商家；纯线上业务不属于这一类型。服务区域商家最多可设置 20 个城市、邮编或其他服务区域，不能简单使用半径。

### 3.3 本地行业优先顺序

| 优先级 | 行业 | 为什么更痛 | 推荐首屏结果 |
|---|---|---|---|
| 高 | 牙医、诊所、律师、HVAC、水管、电工、屋顶、家政 | 单条 Lead 价值高，Map Pack 与评论直接影响电话/预约 | 不同区域排名网格、竞品差距、Top 3 动作 |
| 高 | 美容、美发、Spa、健身、汽修 | 高频本地发现，评论新鲜度、图片和预约信息重要 | 评论与资料完整度、附近竞争、预约缺口 |
| 中高 | 餐厅、咖啡、酒吧 | 到店和评论强，但平台、菜单、配送渠道复杂 | Maps 可见度、评论、菜单/预订/营业时间 |
| 中 | 本地零售、宠物服务、教育培训 | 品类差异较大，需结合库存、课程或服务页面 | 类目与服务词覆盖、门店页、评论 |
| 中 | 多门店与 Franchise | 单店问题不一定高痛，但规模放大后监控成本高 | 异常门店、区域差异、批量任务 |

## 四、搜索需求量级

### 4.1 代表词数据

以下为美国月搜索量。`0` 表示该精确短语在数据源中没有可测量量级，不代表需求不存在。

| 需求簇 | 代表搜索词 | 月搜索量 | CPC | 解读 |
|---|---|---:|---:|---|
| 通用网站审计 | `website audit tool` | 2,400 | $22.77 | 强商业需求；相关 `seo audit` 约 8,100、`website audit` 约 6,600，但高度重合，禁止相加 |
| 关键词研究 | `keyword research tool` | 12,100 | $14.84 | 最大的成熟工具需求；`keyword research tool free` 约 9,900，免费预期很强 |
| 关键词聚类 | `keyword clustering tool` | 720 | $12.78 | 中等但明确；`best keyword clustering tool` 约 170，CPC $42.70，显示强比较/购买意图 |
| 话题集群 | `topic cluster tool` | 50 | $0 | 用户更常使用 keyword clustering，而不是 topic cluster tool |
| 关键词机会 | `keyword opportunity` | 390 | $0 | 词义不够工具化，需要用“find low-competition keywords”等任务词承接 |
| 内链检查 | `internal link checker` | 140 | $6.19 | 相关 `internal linking checker` 约 260；明确但较窄 |
| GSC 工具 | `google search console tool` | 390 | $5.04 | 相关 `search console tool` 约 8,100；`Google Search Console` 30.1 万主要是导航需求，不可作为本工具需求 |
| GSC 快速机会 | `gsc quick wins` | 0 | $0 | 内部命名，不是自然搜索表达 |
| 关键词蚕食检查 | `keyword cannibalization checker` | 70 | $0 | 主题词 `keyword cannibalization` 约 1,000；用户会先搜问题，再找工具 |
| 内容衰退 | `content decay` | 90 | $0 | 成熟度低，通常从 GSC/流量下降场景进入 |
| 流量下降 | `seo traffic drop` | 0 | $0 | 用户表达高度分散，如 `why did my organic traffic drop`、`website traffic dropped after Google update` |
| 本地 SEO 审计 | `local seo audit` | 720 | $12.32 | 明确商业需求；`local seo audit tool` 约 170，CPC $19.43 |
| 本地排名追踪 | `local rank tracker` | 1,300 | $13.67 | 本地工具中最强的成熟需求之一 |
| Google Maps 排名 | `google maps rank checker` | 260 | $5.52 | 相近 `google map ranking checker` / `google maps ranking checker` 各约 720，但 SERP 重合不足，不能简单相加 |
| GBP 审计 | `google business profile audit` | 90 | $18.48 | 量不大但竞争度 0.55；`GMB audit` 等旧叫法仍在使用 |
| 本地 Citation | `local citation checker` | 210 | $11.38 | `local citation scanner` 量小但 CPC 高，偏 Agency/服务采购 |
| AI 可见度 | `ai visibility checker` | 0 | $0 | 新兴术语尚未形成稳定量级；SERP 已出现 Semrush、Backlinko 及多个新工具 |
| AI Overview | `ai overview checker` | 0 | $0 | 用户语言仍在变化，需同时覆盖 AI visibility、AI search visibility、ChatGPT visibility |

### 4.2 不能只看搜索量

三类需求会被精确工具词低估：

1. **问题型需求**：用户搜“为什么流量下降”，不会先搜“Traffic Drop Diagnosis Tool”。
2. **第一方数据型需求**：用户进入 GSC 后才发现需要筛选低 CTR、排名临界和下降页面。
3. **新兴术语型需求**：AI visibility、GEO、AEO、AI citations 的叫法仍在分化。

因此优先级应同时使用：

`显性工具词需求 + 问题词/社区强度 + 结果损失程度 + 现有供给缺口 + GenGrowth 承接能力`

## 五、痛点—搜索词—用户—工具页映射

### 5.1 网站有很多问题，但不知道先修什么

| 维度 | 洞察 |
|---|---|
| 用户原话/任务 | “审计报告有上百项错误，但哪些真的影响流量？”“修完技术问题仍然不排名。” |
| 典型搜索 | `seo audit`、`website audit tool`、`free seo audit`、`why is my website not ranking`、`technical seo audit` |
| 有多痛 | **高。** Service Direct 调查中，51% 小企业将站内技术实施视为最大 SEO 挑战；网站审计词量和 CPC 均高。Reddit 讨论反复批评表面化健康分和无关检查项。 |
| 需求满足度 | **表面高、行动层中低。** SERP 有大量免费审计和综合套件，但多数仍按检查项数量、健康分或长列表竞争。 |
| 主要用户 | 独立站长、小型 SEO 团队、Agency 售前、电商、B2B SaaS |
| 承接工具页 | `/tools/seo-audit`；产品名可用 **Website SEO Audit & Priority Map** |
| 必须输出 | Top 3 问题、具体 URL、证据、预计影响、修复动作、验证方式；不要只给总分 |

### 5.2 关键词很多，但不知道“下一篇/下一页做什么”

| 维度 | 洞察 |
|---|---|
| 用户原话/任务 | “我不需要关键词 dump，我需要有信心地选下一篇内容。”“工具数据很多，但本地词不准、意图混合。” |
| 典型搜索 | `keyword research tool`、`free keyword research tool`、`low competition keyword finder`、`keyword opportunity`、`content gap tool` |
| 有多痛 | **高且高频。** `keyword research tool` 约 12,100/月；25% 的小企业将关键词研究/内容规划列为最大挑战。 |
| 需求满足度 | **工具供给很高，决策满足度不足。** Ahrefs、Semrush、Google Keyword Planner 以及大量免费工具已满足“给数据”，但用户仍抱怨价格、数据不一致和缺少下一步。 |
| 主要用户 | Solo、内容团队、2–10 人 SEO/增长团队、B2B SaaS、电商、Agency |
| 承接工具页 | `/tools/keyword-research-tool`、`/tools/keyword-clustering-tool` |
| 必须输出 | 机会分桶、SERP 可进入性、意图、商业价值、应建/更新页面、关键词与 Prompt 重合、证据置信度 |

### 5.3 聚类工具能分组，但不能决定站点架构

| 维度 | 洞察 |
|---|---|
| 用户原话/任务 | “混合意图词每个工具都分不好。”“聚类结果只能作信号，不能直接当信息架构。” |
| 典型搜索 | `keyword clustering tool`、`keyword grouping tool`、`keyword cluster tool free`、`topic cluster generator` |
| 有多痛 | **中。** 明确节省人工整理时间，但结果仍需要专业判断。 |
| 需求满足度 | **高供给。** SERP 已有免费 10,000 词聚类、可视化树和多种 AI 聚类工具。 |
| 主要用户 | 内容团队、Agency、Programmatic SEO、编辑团队 |
| 承接工具页 | `/tools/keyword-clustering-tool`、`/tools/topic-cluster-tool` |
| 产品判断 | 不独占旗舰位；共享 Keyword + Prompt 引擎，独立页用于长尾获客 |

### 5.4 GSC 有真实数据，但不会自动告诉用户先做什么

| 维度 | 洞察 |
|---|---|
| 用户原话/任务 | “高展现低 CTR、排名 8–15、突然下降的页面怎么批量找？”“GSC 免费，但分析仍靠导出表格。” |
| 典型搜索 | `google search console tool`、`search console insights`、`how to find low ctr pages in gsc`、`gsc content decay`、`pages losing traffic gsc` |
| 有多痛 | **高。** Google 官方将低 CTR、显著变化查询/页面列为 Performance report 的核心任务；社区把 GSC 视为最被低估的免费工具。 |
| 需求满足度 | **中。** 官方提供数据和筛选方法，第三方工具提供报告，但“机会排序—行动—验证”仍分散。 |
| 主要用户 | 已有流量的网站、2–10 人团队、内容站、SaaS、Agency |
| 承接工具页 | `/tools/google-search-console-opportunities` |
| 外部命名 | 不使用 `GSC Quick Wins Finder` 作为唯一 SEO 标题；建议 **Google Search Console Opportunity Finder** |
| 必须输出 | 高展现低 CTR、排名临界、下降页、品牌/非品牌、季节性提示、建议动作和修改后验证 |

### 5.5 网站流量突然下降，不知道是哪一种原因

| 维度 | 洞察 |
|---|---|
| 用户原话/任务 | Reddit 案例出现 20%、50%、70%、80% 甚至 99% 的流量下降；常见疑问包括核心更新、意图变化、AI Overview、索引、黑客攻击、蚕食和季节性。 |
| 典型搜索 | `why did my website traffic drop`、`organic traffic dropped`、`traffic drop after Google update`、`rankings same but traffic down` |
| 有多痛 | **极高但低频。** 直接影响 Lead、销售和业务生存；用户情绪明显高于一般审计问题。其中"排名没动、流量却掉"这一类有独立的一手证据支撑：Pew Research（n=900 美国成年人，2025-03 数据）显示搜索结果出现 AI 摘要时，用户点击结果链接的比例为 8%，无 AI 摘要时为 15%；点击 AI 摘要内引用来源的比例仅 1% `[High]`。这意味着诊断工具必须能把"排名变化"与"点击流失"分开归因，只看排名会得出错误结论。 |
| 需求满足度 | **低。** SERP 以长教程和咨询服务为主，诊断需要 GSC、GA4、更新时间线、SERP 与技术数据，难被单个免费扫描解决。 |
| 主要用户 | 内容站、B2B SaaS、电商、Publisher、内部 SEO、Agency |
| 承接工具页 | `/tools/traffic-drop-diagnosis` |
| 产品判断 | **P0，但分两层交付**：匿名版只做"需要补哪些证据"的诊断分流（并给出时间线上的可疑变更点），不能给伪确定根因；根因树在连接 GSC 后给出。这也是全部候选工具中把"看结果"转成"连数据"最自然的一个入口 |

### 5.6 多个页面互相竞争，工具又容易误报

| 维度 | 洞察 |
|---|---|
| 用户原话/任务 | “两个 URL 排同一个词究竟是真蚕食还是不同意图？”“很多工具看到两个页面共享关键词就报警。” |
| 典型搜索 | `keyword cannibalization`、`keyword cannibalization checker`、`fix keyword cannibalization`、`content decay tool` |
| 有多痛 | **中高。** 对内容规模大的网站影响显著，但不是所有重叠都需要合并。 |
| 需求满足度 | **中低。** 已有大量 Checker，但不少只做标题、词面或 URL 重叠；社区明确要求结合意图、URL 轮换和 GSC 表现判断。 |
| 主要用户 | 内容站、SaaS 博客、电商类目、Agency、大型编辑库 |
| 承接工具页 | `/tools/keyword-cannibalization-checker`、`/tools/content-decay-checker` |
| 必须输出 | 是否为真实冲突、置信度、竞争 URL、时间变化、意图差异、合并/重定向/差异化/不处理建议 |

### 5.7 内链检查能列链接，但很难告诉用户该加哪一条

| 维度 | 洞察 |
|---|---|
| 用户原话/任务 | “旧站页面很多，逐页检查失效链接很痛苦。”“我需要 sitemap 级别检查，而不是只贴一个页面。” |
| 典型搜索 | `internal link checker`、`orphan page checker`、`internal link analyzer`、`check website internal links` |
| 有多痛 | **中高、重复发生。** 内容越多，人工检查成本越高；内部链接优化是持续任务。 |
| 需求满足度 | **单页检查高，站点级行动不足。** 免费工具多列出当前链接、锚文本和 nofollow，真正的孤岛页、重要页深度和推荐链接仍需 Crawl/GSC/语义数据。 |
| 主要用户 | 内容站、电商、Programmatic SEO、技术 SEO、Agency |
| 承接工具页 | `/tools/internal-link-checker`、`/tools/orphan-page-checker`、`/tools/internal-link-map` |
| 必须输出 | 孤岛页、点击深度、流入/流出、正文链接位置、建议来源页与锚文本、修复清单 |

### 5.8 品牌不知道自己是否被 AI 推荐，也不相信一个静态分数

| 维度 | 洞察 |
|---|---|
| 用户原话/任务 | “我每周手动在多个模型重复跑 Prompt。”“现有工具能显示分数，但难连接到收入。”“我想看真实回答、引用来源、竞品和历史变化。” |
| 典型搜索 | `ai visibility checker`、`ai search visibility`、`chatgpt visibility checker`、`ai citation tracker`、`geo tool` |
| 有多痛 | **中高且上升。** Semrush 2026 调查中，45% 的营销人员难以衡量 AI 生成答案中的可见度，49% 难以衡量 AI 对 Pipeline/收入的影响；只有 9% 表示能测量全部关键指标。 |
| 需求满足度 | **工具数量快速增加，但可信度和行动性不足。** 精确工具词搜索量仍未形成，SERP 已有综合套件与大量新工具；Reddit 反复质疑采样稳定性和归因。 |
| 主要用户 | B2B SaaS、电商、品牌团队、PR/内容团队、Agency、本地多门店 |
| 承接工具页 | `/tools/ai-visibility-checker`、`/tools/ai-citation-gap`、`/tools/chatgpt-brand-check` |
| 必须输出 | Prompt 样本、模型、地区、日期、重复次数、提及率区间、引用率、竞品、来源和波动；AI 可见度与 AI Referral 分开展示 |

### 5.9 本地商家不知道自己在“顾客所在位置”到底排第几

| 维度 | 洞察 |
|---|---|
| 用户原话/任务 | “GBP 已完善，为什么 Maps 仍排不上？”“距离不同结果不同，单一排名没有意义。”“不知道评论、NAP、类目还是本地页面先做。” |
| 典型搜索 | `local rank tracker`、`google maps rank checker`、`local seo audit`、`google business profile audit`、`local citation checker` |
| 有多痛 | **高且接近交易。** Google 官方说明本地结果主要取决于相关性、距离和知名度，评论数量与评分会影响本地排名。BrightLocal 研究显示 67% 的消费者在本地搜索后经常或总会查看评论，15% 首先直接使用 Google Maps。 |
| 需求满足度 | **单点工具多，统一行动层不足。** BrightLocal 等成熟产品已经覆盖 Grid、Citation、GBP 和评论，但用户需要在多个模块中拼接结论；免费工具多只扫网页。 |
| 主要用户 | 到店型商户、上门服务商、混合型商家、本地 SEO Freelancer、Agency、多门店 |
| 承接工具页 | `/tools/local-seo-audit`、`/tools/google-maps-rank-checker`、`/tools/google-business-profile-audit`、`/tools/local-citation-checker` |
| 必须输出 | 不同坐标排名网格、GBP 完整度、主要类目、评论量/评分/新鲜度、Citation 一致性、本地页面和 Top 3 动作 |
| 产品判断 | **痛点成立，但不进入第一阶段开发队列。** 供给已由专业玩家分工覆盖，机会属于整合型；GBP 深度数据需商家授权，匿名版能给的有限；用户群与主产品 ICP 的重合度未验证。先按 §十 的最小验证跑，三项门槛同时成立再进队列（详见 §7.3） |

### 5.10 工具太贵、太多，用户只使用其中少量功能

| 维度 | 洞察 |
|---|---|
| 用户原话/任务 | “Ahrefs + Semrush 接近每年 3,000 美元，但我只用少数功能。”“付费工具必须告诉我下一步，否则只是另一个 Dashboard。” |
| 典型搜索 | `affordable seo tools`、`semrush alternative`、`ahrefs alternative`、`best seo tool under $50`、`free seo tools` |
| 有多痛 | **小团队高痛。** 官方价格显示 Ahrefs Lite £99/月、Semrush Pro $139/月；额外席位与 AI 模块进一步增加成本。Reddit 对低价替代、按量付费和免费 GSC 工作流讨论持续。 |
| 需求满足度 | **工具供给高，轻量工作流仍有空间。** 竞争优势不应是“功能更多”，而应是单任务完成、证据清楚、结果可带入下一工具。 |
| 主要用户 | Solo、小团队、小型 Agency、小企业 |
| 承接方式 | 所有原子工具的免费入口；保存、连接数据、历史、批量和持续监控进入主产品 |

## 六、需求满足度与竞争空白

| 需求 | 搜索需求 | SERP 供给 | 用户满意缺口 | GenGrowth 机会 |
|---|---|---|---|---|
| 通用 SEO 审计 | 高 | 很高 | 报告过长、误报、没有业务优先级 | 从“检查项”转为“证据—影响—动作—验证” |
| 关键词研究 | 很高 | 很高 | 关键词 dump、价格高、数据口径不一致 | 直接生成机会地图和应建页面 |
| 关键词聚类 | 中 | 很高，免费工具多 | 混合意图处理差，不能直接变信息架构 | 作为机会地图的可编辑子视图 |
| GSC Opportunities | 中高隐性需求 | 中 | 需要导出和手工筛选，结果不进入任务 | 第一方数据、低成本、强行动续接 |
| 流量下降诊断 | 高痛、词分散 | 低，以教程为主 | 无法合并更新、SERP、技术和内容证据 | 连接 GSC/GA4 后做证据树，不给单因果 |
| 蚕食/内容衰退 | 中 | 中高 | 词面误报多、修复建议不区分意图 | 用 GSC 时间序列和 URL 轮换提高可信度 |
| 内链/孤岛页 | 中 | 中高 | 单页链接清单多，站点级推荐不足 | 关系图 + 建议链接 + 修复追踪 |
| AI 可见度 | 新兴 | 快速增加 | 采样不稳、分数不可解释、难归因 | 重复测量、来源地图、改前改后验证 |
| 本地排名/GBP | 中高、商业性强 | **高且已专业化分工**：Local Falcon 专做 geo-grid（$24.99/月起，信用制，1 credit = 1 个网格点）、Whitespark 分项售卖（Rank Tracker $14–200、Citation Finder $33–149）、BrightLocal 一体化（$39/月起） | 地理排名、评论、Citation、网页分散在不同工具 | 机会属于**整合型**而非空白型——要求在每个模块都不输专业工具，成本高于填补空白；先验证再投入 |
| 技术微工具 | 稳定长尾 | 很高 | 多数问题简单，用户用完即走 | 低成本发布，结果写入项目形成续接 |

## 七、量化优先级

### 7.1 评分口径

总分 100，仅用于同一批候选方向的相对排序：

- 痛点与业务后果：25
- 显性搜索需求与潜在问题需求：20
- 现有供给缺口：20
- 与 GenGrowth 主产品及 Growth Graph 的续接：20
- 数据成本和 MVP 可行性：15

分数不是收入预测；证据中含社区抽样或产品推断时，最低置信度随行标注。

两点口径说明，避免误读：

- **"需求"一栏同时计入显性工具词与问题词。** Organic Traffic Drop Diagnosis 的工具词（`seo traffic drop`）月搜索量为 0，但问题词簇成熟且稳定（`why is my website traffic dropping` 系列补全完整，见附录 A），因此其需求分不能按工具词为 0 处理。
- **总分相同不等于同时开工。** Organic Traffic Drop Diagnosis 与 Keyword + Prompt Opportunity Map 同为 83 分，但前者的可行性分是全表最低（7），意味着它是"市场上最该做、工程上最不能先做"的一个——市场优先级与开发顺序在 §九 分开处理。

### 7.2 优先级表

| 排名 | 工具方向 | 痛点 | 需求 | 缺口 | 续接 | 可行性 | 总分 | 证据等级 | 建议 |
|---:|---|---:|---:|---:|---:|---:|---:|---|---|
| 1 | Website SEO Audit & Priority Map | 21 | 19 | 12 | 19 | 14 | **85** | `[Medium]` | P0，最适合首个真实纵向切片 |
| 2 | Keyword + Prompt Opportunity Map | 19 | 20 | 12 | 19 | 13 | **83** | `[Medium]` | P0，避免与通用关键词工具正面同质化 |
| 3 | Organic Traffic Drop Diagnosis | 25 | 14 | 19 | 18 | 7 | **83** | `[Medium]` | P0；市场分最高但可行性分最低，工程上必须排在 GSC 连接之后 |
| 4 | Google Search Console Opportunity Finder | 21 | 15 | 16 | 20 | 10 | **82** | `[Medium]` | P0，外部名称和入口任务需要重写 |
| 5 | AI Search Visibility Baseline | 19 | 13 | 17 | 18 | 12 | **79** | `[Medium]` | P1；先做可信快照，后做持续监控 |
| 6 | Internal Link & Orphan Page Map | 18 | 11 | 17 | 18 | 12 | **76** | `[Medium]` | P1；复用网站 Crawl 与 Page Graph |
| 7 | Content Decay & Cannibalization | 20 | 11 | 16 | 18 | 10 | **75** | `[Medium]` | P1；与 GSC Opportunities 共用数据 |
| 8 | Local Search Visibility Map | 23 | 15 | 13 | 13 | 8 | **72** | `[Low]` | 验证项；痛点分全表第二但其余四项均受限，先跑最小验证再决定是否进开发队列 |
| 9 | Topic Cluster Visualizer（独立） | 14 | 12 | 9 | 17 | 13 | **65** | `[Medium]` | P2；保留页面，不占旗舰位 |
| 10 | Robots/Sitemap/Schema 等微工具 | 10 | 13 | 6 | 8 | 15 | **52** | `[Medium]` | P2；共享内核完成后批量发布 |

### 7.3 Local Search Visibility Map 的分项依据

它的痛点分（23/25）是全表第二高——本地商家单条 Lead 价值高、Map Pack 与评论直接影响电话和到店，这一点没有争议。受限的是另外四项：

| 分项 | 分数 | 依据 |
|---|---:|---|
| 需求 | 15/20 | 本地簇最大词 `local rank tracker` 1,300/月、`local seo audit` 720/月，比 `keyword research tool`（12,100）低一个数量级。CPC 高（$12–19）说明**单次点击的商业价值高**，但 CPC 衡量广告主出价，不衡量搜索规模——两者不可互换（§2.2） |
| 缺口 | 13/20 | 供给成熟且已专业化分工：Local Falcon 专做 geo-grid（$24.99/月起，1 credit = 1 个网格点）、Whitespark 分项售卖（$14–200 / $33–149 / $79 per location）、BrightLocal 一体化（$39/月起）。机会是**把割裂的模块整合**，而整合型机会要求在每个模块都不输专业工具，成本高于填补空白 |
| 续接 | 13/20 | 本地商家（牙医、水管工、餐厅）与 GenGrowth 主产品的用户画像重合度低；Growth Graph 现有对象里没有 Location，需要新增一层数据模型。可能的桥梁是服务本地客户的 Agency（§3.1 中的 SEO Freelancer / 小型 Agency），但这条路径尚未验证 |
| 可行性 | 8/15 | geo-grid 是按"网格点 × 关键词"重复采集 SERP，单次可变成本为全表最高之一；GBP 侧 Google 官方未提供审计工具，第三方需 GBP Organization 账号 + OAuth + 商家授予 manager 权限，**未验证前 Google 将资料按公开处理**，匿名免费版能给出的深度有限 |

> **口径说明**：证据等级为 `[Low]`，因为续接与可行性两项依赖的是产品侧推断和数据可得性判断，而非可直接检索的市场数据。这也是它排在验证队列而非开发队列的原因——不是判定它没有机会，而是判定**现在的证据不足以支撑投产决策**。

## 八、工具页承接设计

### 8.1 建议工具目录

一个产品能力可以有多个搜索入口（例如 `internal link checker` 与 `orphan page checker` 指向同一个能力）。因此下表把"页面标题"与"产品内正式名"分成两列：**前者服从用户搜索表达，后者全站唯一。**

| 用户搜索任务 | 工具页 URL | 页面 H1（用户词） | 产品内正式名（唯一） |
|---|---|---|---|
| `seo audit` / `website audit tool` | `/tools/seo-audit` | Free SEO Audit | Website Health Map |
| `local seo audit` | `/tools/local-seo-audit` | Local SEO Audit | Local Search Visibility Map |
| `google maps rank checker` | `/tools/google-maps-rank-checker` | Google Maps Rank Checker | Local Search Visibility Map · Rank Grid 视图 |
| `google business profile audit` | `/tools/google-business-profile-audit` | Google Business Profile Audit | Local Search Visibility Map · GBP 视图 |
| `local citation checker` | `/tools/local-citation-checker` | Local Citation Checker | Local Search Visibility Map · Citation 视图 |
| `keyword research tool` | `/tools/keyword-research-tool` | Free Keyword Research Tool | Keyword + Prompt Opportunity Map |
| `keyword clustering tool` | `/tools/keyword-clustering-tool` | Keyword Clustering Tool | Keyword + Prompt Opportunity Map · Cluster 视图 |
| `topic cluster tool` | `/tools/topic-cluster-tool` | Topic Cluster Tool | Keyword + Prompt Opportunity Map · Cluster 视图 |
| GSC 低 CTR / 临界排名 / 下降页 | `/tools/striking-distance-keywords` | Striking Distance Keywords Finder | GSC Opportunity Finder |
| `internal link checker` | `/tools/internal-link-checker` | Internal Link Checker | Internal Link Map |
| `orphan page checker` | `/tools/orphan-page-checker` | Orphan Page Checker | Internal Link Map · 孤岛与点击深度视图 |
| `keyword cannibalization checker` | `/tools/keyword-cannibalization-checker` | Keyword Cannibalization Checker | Cannibalization Diagnosis |
| `content decay` / `content decay checker` | `/tools/content-decay-checker` | Content Decay Checker | Content Decay Diagnosis |
| `guest post sites list` | `/tools/guest-post-sites-list` | Guest Post Sites List | Link Opportunity Library |
| `link building tools` / `how to get backlinks for free` | `/tools/link-opportunities` | Link Opportunity Library | Link Opportunity Library |
| 流量下降问题词 | `/tools/traffic-drop-diagnosis` | Why Is My Website Traffic Dropping? | Organic Traffic Drop Diagnosis |
| `ai visibility checker` | `/tools/ai-visibility-checker` | AI Visibility Checker | AI Visibility Baseline |
| `how to get cited by ai` / `ai citation tracker` | `/tools/ai-citation-gap` | AI Citation Gap Finder | AI Citation Gap |

> `striking distance keywords` 是行业与工具方共用的成熟表达（SEOTesting、GSC Wizard 均以此作入口），但**未包含在附录 A 的 44 组实测种子中**，上线前应补测其自动补全与搜索量，再确定是否作为主 H1。

**命名规则**（避免"入口叫 A、产品里叫 B"）：

1. 一个能力只有一个产品内正式名，全站与全文档统一；视图用 `正式名 · 视图名` 表达，不另起新名。
2. 页面 H1 用用户搜索词，但首屏必须让产品正式名同框出现一次，例如"Internal Link Checker —— GenGrowth Internal Link Map 的免费版"。
3. 从工具页进入产品后不换词：结果页顶部保留同一句"你正在使用 X"。

### 8.1.1 URL 层级约定

**采用扁平结构 `/tools/<工具名>`，分类通过 hub 页与内链实现，不写进 URL。**

依据与取舍：

- Google 不按 URL 中的斜杠数判断层级，子目录深度不是排名因素；真正影响的是**点击深度**（从首页需要点几次）与**内部链接**。Google 方面给出的建议是：选一个便于维护、能沿用 5–10 年的结构并保持稳定。
- 因此把工具放在根目录（`/gbp-audit`）没有可测量收益，且会与 `/blog`、`/pricing` 争夺根命名空间。
- 把分类写进 URL（`/tools/local-seo/gbp-audit`）人类可读性更好，但会把工具锁定在单一分类；多数工具天然横跨两类（例如 citation checker 同时属于本地与外链），后续调整分类即产生 301 迁移成本。
- 取代方案：建 `/tools/local-seo/`、`/tools/technical/`、`/tools/ai-search/` 等**聚合 hub 页**，它们本身就是可排名的品类落地页（如 `local seo tools`），向下链接扁平的工具页，工具页之间再交叉链接。主题聚合与抓取效率由内链结构提供，不由 URL 层级提供。

> 长尾工具页能否获得排名，主要取决于每页是否具备独立价值（原矩阵列出的第 1 个坑），URL 形态的影响远小于此。

### 8.2 页面不能只复述工具名称

每个工具页首屏必须回答：

1. 用户输入什么。
2. 多久拿到第一份结果。
3. 结果具体包含什么。
4. 哪三类问题能被识别。
5. 是否免费、是否需连接账户。
6. 数据日期、来源、限制和置信度。
7. 下一步可以做什么。

### 8.3 免费、登录与付费边界

| 层级 | 用户获得什么 | 目标 |
|---|---|---|
| 匿名免费 | 单域名/单页/少量词快照、Top 3 问题、证据和基础动作 | 完成真实任务，建立信任 |
| 注册免费 | 保存项目、历史对比、少量 GSC/GBP 连接、继续下一工具 | 验证跨工具续接和留存 |
| 付费 | 大规模 Crawl、持续 GEO 采样、本地 Grid、多门店、多项目、第三方关键词/链接数据、白标/API | 覆盖真实可变成本和团队工作流 |

## 九、建议开发顺序

市场机会优先级不等于工程开发顺序。建议按共享内核复用和数据成本推进：

| 开发顺序 | 工作 | 原因 | 验证指标 |
|---:|---|---|---|
| 0 | 统一 Project、Page、Keyword、Prompt、Location、Observation、Evidence、Action 数据结构 | 防止每个工具形成孤岛 | 第二个工具能复用第一个工具输入 |
| 1 | Website SEO Audit & Priority Map | 单 URL/域名即可启动，成熟需求大，最适合验证“分数 vs 行动” | 完成率、Top 3 展开率、保存率、行动点击率 |
| 2 | Google Search Console Opportunity Finder | 第一方数据、外部成本低、续接主产品最强 | 连接率、机会采纳率、修改后复查率 |
| 3 | Organic Traffic Drop Diagnosis | 与第 2 步共用同一套 GSC 连接、Page 与时间线数据，边际工程成本最低；损失强度最高，最能验证"证据优于分数" | 匿名分流完成率、**分流后 GSC 连接率**、根因展开率、修复后复查率 |
| 4 | Internal Link & Orphan Page Map | 数据可复用既有内链系统与第 1 步的 Crawl / Page Graph，边际工程成本低；问题真实性已有一手内链审计事故背书 | 建议链接采纳率、孤岛页修复率 |
| 5 | Keyword + Prompt Opportunity Map | 需求最大，但第三方数据成本和通用竞品最强 | 机会收藏率、建页/更新页动作率 |
| 6 | AI Search Visibility Baseline | 需要先建立 Prompt、Observation、重复采样与置信度 | 重复运行率、跨模型查看率、改前改后验证率 |

Local Search Visibility Map 列为 P1，但不在上述开发队列内。它进入队列的**前置条件**是 §十 的最小验证通过——在此之前不投入 Location / GBP / Rank Grid 的数据能力建设，因为这三项都不被现有工具复用（第 0 步的数据结构里保留 Location 字段即可，不做实现）。

Content Decay 与 Cannibalization 应建立在 GSC、Page、Observation 和时间线已经可用之后，不应各自建设独立数据层。Traffic Drop 同样依赖这层数据，但它排在第 3 位而不是更靠后，是因为它与第 2 步共用同一套连接和时间线，边际成本低于重新起一个数据层；若第 2 步的 GSC 连接率未达预期，第 3 步应暂停而不是改用匿名重型扫描替代。

## 十、需要验证的关键假设

| 假设 | 当前证据 | 最小验证方式 | 升级条件 |
|---|---|---|---|
| 用户更愿意为“Top 3 行动”而非健康分保存项目 | Reddit 与 SERP 文案支持，尚无自有行为数据 | 同一审计结果做 Score-first vs Action-first A/B | Action-first 保存率或下一工具续接率显著更高 |
| 本地商家值得 GenGrowth 做，而不只是一个存在的市场 | 痛点与商业性有搜索量、CPC 和官方资料支持；但供给已专业化分工、用户与主产品 ICP 重合度未知、GBP 数据可得性受限（§7.3） | 建 3 个静态落地页 + 一个不依赖 GBP 授权的轻量 Local Audit（仅用公开可得信号）；同时统计现有用户中有多少人管理本地客户 | 三项同时成立才进开发队列：工具启动率与报告完成率达到站内前 25%、留资率不低于其他工具页、**且**留资用户中有可识别比例属于既有 ICP 或服务本地客户的 Agency |
| Topic Cluster 不值得独占旗舰位 | 搜索量低且免费供给充分 | 作为 Keyword Map 子视图上线 | 子视图使用率高但独立入口转化低 |
| GSC Opportunities 会产生最强主产品续接 | 第一方数据、低成本、动作明确 | 连接 GSC 后提供 10 个机会 | 连接后 7 日内至少一次保存/标记动作 |
| 流量下降的匿名分流能带来 GSC 授权，而不是让用户流失 | 供给缺口与问题词需求成立，但"用户愿意为了知道原因而授权"尚无自有数据 | 匿名版给出"已排除 / 待确认 / 需连接数据才能判断"三段结论，测量分流完成 → 点击连接 → 授权完成三步漏斗 | 分流完成用户的 GSC 授权率显著高于站内其他工具的注册率 |
| AI Visibility 用户需要区间与证据，不需要另一个静态分数 | 学术研究和社区质疑支持 | 同时展示单次分数与重复采样区间 | 区间/来源展开率、历史复查率高于单分数 |

## 十一、最终优先级建议

本节为最终交付清单，分三张表：**命名与溯源**（与原矩阵对齐）、**搜索承接**（URL 与搜索词对应关系）、**定位红线**。

搜索量取自 §4.1（seodata.dev，google_us，2026-07-28）；标注"补全"的依据为附录 A 的自动补全实测；未标注量级的词表示尚未取到可测量数据。

### 11.1 命名与溯源表

命名规则：**产品内正式名沿用原矩阵**（除非原名被验证不可搜索），**对外页面名服从用户搜索表达**，两者的中英文含义必须一一对应。

| 优先级 | 矩阵编号 · 原名 | 产品内正式名（中） | 产品内正式名（英） | 对外页面名（中） | 对外页面名（英） |
|---|---|---|---|---|---|
| **P0-1** | #71 GSC Quick Wins Finder | 临界排名机会发现器 | Striking Distance Opportunity Finder | 临界排名关键词发现器 | Striking Distance Keywords Finder |
| **P0-2** | #50 内链关系图 · #51 孤岛页面发现器 | 内链关系图 | Internal Link Map | 内链检查器 / 孤岛页面检查器 | Internal Link Checker / Orphan Page Checker |
| **P0-3** | #76 流量下降根因树 | 流量下降根因树 | Traffic Drop Root Cause Tree | 自然流量下降诊断 | Organic Traffic Drop Diagnosis |
| **P0-4** | #37 单页 SEO 审计 · #38 全站技术审计 | 网站健康地图 | Website Health Map | 免费 SEO 审计 | Free SEO Audit |
| **P0-5** | 旗舰原名：关键词 + Prompt 机会地图 | 关键词 + Prompt 机会地图 | Keyword + Prompt Opportunity Map | 免费关键词研究工具 | Free Keyword Research Tool |
| P1-6 | #83 AI Visibility Snapshot · #88 Citation Gap Finder | AI 可见度快照 · 引用缺口发现器 | AI Visibility Snapshot · Citation Gap Finder | AI 可见度检查器 / AI 引用缺口发现器 | AI Visibility Checker / AI Citation Gap Finder |
| P1-7 | #73 内容衰退检测器 · #74 关键词蚕食诊断器 | 内容衰退检测器 · 关键词蚕食诊断器 | Content Decay Detector · Keyword Cannibalization Diagnosis | 内容衰退检查器 / 关键词蚕食检查器 | Content Decay Checker / Keyword Cannibalization Checker |
| P1-8 | 新增（聚合 #63 未链接品牌提及发现器 · #64 Earned Link 机会雷达 · #65 Link Prospect 质量散点图 · #67 Linkable Asset 机会分析器） | 外链机会资源库 | Link Opportunity Library | 外链机会资源库 | Link Opportunity Library |
| P1-9 | #7 SEO 立项画布 | SEO 立项画布 | SEO Project Canvas | 新站 SEO 清单 | SEO Checklist for New Website |
| P1-10 | 新增（矩阵未覆盖） | 本地搜索可见度地图 | Local Search Visibility Map | 本地 SEO 审计 等 4 个入口 | Local SEO Audit 等 |
| P1-11 | #40–#47 技术检查器组 | Robots.txt 检查器 / Sitemap 检查器 / Canonical 冲突检查器 / Redirect Chain 可视化器 / Schema 校验器 / Hreflang 审计 | Robots.txt Checker / Sitemap Checker / Canonical Conflict Checker / Redirect Chain Visualizer / Schema Validator / Hreflang Checker | 同左（对外去掉"冲突""可视化"等内部限定） | Robots.txt Checker / Sitemap Checker / Canonical Checker / Redirect Chain Checker / Schema Markup Validator / Hreflang Checker |

**三处偏离原矩阵命名，均有验证依据：**

1. **#71 GSC Quick Wins Finder → Striking Distance**：`gsc quick wins` 搜索量 0 且零自动补全，两条独立证据一致（§4.1 与附录 A.1），原名不可作为对外入口。
2. **#19 话题集群可视化器 → Topic Cluster Tool（对外）**：`topical map generator` 补全被地形图占据、`topic cluster tool` 仅 50/月，该能力不占独立席位，作为 P0-5 的结果视图与长尾入口保留。
3. **外链方向由"投资计算器"改为"资源库"**：原矩阵 F 组已明确不以购买链接为中心，本工具聚合 #63/#64/#65/#67 四项能力，定位红线见 §11.3。

### 11.2 搜索承接表

"主词一一对应"指 URL slug 与该页主要目标搜索词是否逐词对应。**不对应不等于错**——问题词型需求（如"为什么流量下降"）不适合做成永久 slug，此时由 H1 与 title 承接原始问句，URL 保持简短稳定（依据见 §8.1.1）。

| 优先级 | 页面 URL | 主要目标搜索词 | 主词一一对应 | 同页承接的其他词 |
|---|---|---|---|---|
| **P0-1** | `/tools/striking-distance-keywords` | `striking distance keywords`（量级待补测） | ✅ | `google search console tool`（390）、`search console tool`（约 8,100）<br>❌ 不用 `gsc quick wins`（量 0 / 零补全） |
| **P0-2a** | `/tools/internal-link-checker` | `internal link checker`（seodata 140 / google_us 450） | ✅ | `internal link checker free / tool / extension`、`broken internal link checker`（补全 10/10） |
| **P0-2b** | `/tools/orphan-page-checker` | `orphan pages checker` | ⚠ 单复数差异（Google 可归一，不改） | `orphan pages finder`、`orphan pages screaming frog` |
| **P0-3** | `/tools/traffic-drop-diagnosis` | `why is my website traffic dropping` | ❌ 问题词不做 slug，由 H1 承接 | `why is my organic traffic down`、`why is my website getting no traffic`、`traffic drop after google update`<br>❌ 不用 `seo traffic drop`（量 0）、`my rankings dropped`（零补全） |
| **P0-4** | `/tools/seo-audit` | `seo audit`（约 8,100） | ✅ | `website audit tool`（2,400）、`website audit`（约 6,600，重合不可相加）、`free seo audit tool`、`free seo audit report generator` |
| **P0-5a** | `/tools/keyword-research-tool` | `keyword research tool`（12,100） | ✅ | `keyword research tool free`（约 9,900） |
| **P0-5b** | `/tools/keyword-clustering-tool` | `keyword clustering tool`（720） | ✅ | `best keyword clustering tool`（170，CPC $42.70）、`keyword clustering tool free` |
| **P0-5c** | `/tools/topic-cluster-tool` | `topic cluster tool`（50） | ✅ | `free topic cluster tool`、`ai topic cluster tool generator` |
| P1-6a | `/tools/ai-visibility-checker` | `ai visibility checker`（精确词量 0，补全 10/10） | ✅ | `ai search visibility`（1,600，CPC $12.00，KD55）、`chatgpt visibility tracker`（250） |
| P1-6b | `/tools/ai-citation-gap` | `how to get cited by ai`（补全 10/10） | ❌ 问题词不做 slug | `how to get cited in ai overviews`、`how to rank in chatgpt`、`ai citation tracker`<br>❌ 不用 `share of voice ai search`、`brand prompt tracking`（均零补全） |
| P1-7a | `/tools/content-decay-checker` | `content decay checker` | ✅ | `content decay`（90）、`content decay tool`、`content decay analysis` |
| P1-7b | `/tools/keyword-cannibalization-checker` | `keyword cannibalization checker`（70） | ✅ | `keyword cannibalization`（约 1,000）、`keyword cannibalization tool` |
| P1-8a | `/tools/guest-post-sites-list` | `guest post sites list`（补全 10/10） | ✅ | `guest post sites free`、`guest post sites list 2026` |
| P1-8b | `/tools/link-opportunities` | `link building tools`（补全 10/10） | ⚠ slug 为聚合页命名，非逐词对应 | `how to get backlinks for free`、`where to get quality backlinks`、`unlinked brand mentions`<br>❌ 不用 `link building opportunities`（被求职意图占据）、`digital pr opportunities`、`free backlink sites`（零补全） |
| P1-9 | `/tools/seo-checklist-new-website` | `seo checklist for new website`（500，CPC $1.20） | ✅ | `how to start seo for new website`（70） |
| P1-10 | `/tools/local-seo-audit`<br>`/tools/local-rank-tracker`<br>`/tools/google-maps-rank-checker`<br>`/tools/google-business-profile-audit`<br>`/tools/local-citation-checker` | 各自对应同名词 | ✅ | `local rank tracker`（1,300）、`local seo audit`（720，CPC $12.32）、`google maps rank checker`（260）、`local citation checker`（210）、`google business profile audit`（90，CPC $18.48） |
| P1-11 | `/tools/robots-txt-checker`<br>`/tools/sitemap-checker`<br>`/tools/canonical-checker`<br>`/tools/redirect-chain-checker`<br>`/tools/schema-markup-validator`<br>`/tools/hreflang-checker` | 各自对应同名词 | ✅ | 高频后缀为 `chrome extension` 与 `bulk`，说明期望形态是插件与批量（附录 A.5） |

> **数据口径备注**：`internal link checker` 在两个数据源上为 140（seodata.dev）与 450（google_us），差约 3 倍但**处于同一数量级**，接受该分歧，仅按"中等量级"参与排序，不取平均、不作精确引用。

### 11.3 外链资源库的定位红线

原候选"外链投资计算器"替换为**外链机会资源库**。它的形态是**自然引用与编辑型链接的机会线索库**（资源页、行业正规目录、媒体与记者线索、未链接品牌提及、可被引用的数据选题），不是可购买链接的名录。

界线必须写进产品定义：Google 将**为排名而买卖链接**列为链接垃圾，付费或赞助性质的链接应标记 `nofollow` 或 `sponsored`。因此本工具：

- **做**：机会发现、来源质量评估、外联项目管理、未链接提及监测
- **不做**：价格撮合、付费位售卖、把"买多少条链接"作为输出结论

搜索词侧有一个直接可用的产品信号：`guest post sites list site docs.google.com` 出现在补全前十——**用户当前是在共享表格里找这类清单**，说明"结构化、可筛选、有质量分的资源库"本身就是对现状的改进。同时 `guest post sites` 这一族的意图中混有付费投稿，落地页需明确区分编辑型机会与付费位，避免承接错误意图。

### 11.4 优先级与打分表的关系

P1-8 外链机会资源库由决策直接进入清单，**尚未经过 §7.1 的五维打分**，下一版需补分；其余 10 项的排序依据见 §7.2 与 §7.3。

### 对原 6 个旗舰的具体调整

- 保留：网站健康地图。
- 保留：关键词 + Prompt 机会地图。
- 保留：GSC Quick Wins，但改外部命名。
- 保留：SEO + GEO 可见度快照，优先级调整为 P1。
- 保留：内链关系图 + 孤岛检查，优先级调整为 P1。
- 调整：话题集群可视化器不再独占旗舰位。
- 上调：原矩阵第二阶段的 #76 流量下降根因树进入旗舰组合，对外承接名为 Organic Traffic Drop Diagnosis；开发顺序排在 GSC 连接能力之后。
- 补缺口：本地 SEO 是 112 项候选清单中的真实覆盖遗漏，进入 P1，且保留 §十 的三项验证门槛作为进入开发排期的前置条件（理由见 §7.3）。
- 替换：外链方向由"投资计算器"改为**外链资源库**，定位红线见 §11.3。

第一阶段因此定为 **5 个 P0**：GSC 机会发现器、内链关系图与孤岛检查、流量下降诊断、网站健康地图、关键词与 Prompt 机会地图。其中内链一项的排序依据不是市场需求（量级中等），而是**工程杠杆**——数据可复用既有内链系统，且有一手事故作为问题真实性的背书。

## 附录 A · Google 自动补全实测（2026-07-28）

44 组种子词，`suggestqueries.google.com`，`hl=en / gl=us`，无登录态。原始返回见 `2026-07-28-seo-autocomplete-raw.json`，采集脚本见 `2026-07-28-seo-autocomplete-fetch.py`，可重跑复核。

**口径**：自动补全反映真实查询的存在与相对常见程度，**不是搜索量**，不能与 §四 的月搜索量相加或互相换算。它的判别力主要在负向——**零补全基本可判定该措辞不是用户的自然表达**。

### A.1 零补全的措辞（命名红线）

| 种子词 | 结论 | 与 §四 的交叉印证 |
|---|---|---|
| `google search console quick wins` | 零补全 | 与 `gsc quick wins` 月搜索量 0 一致，两条独立证据同向 |
| `my rankings dropped` | 零补全 | 用户描述问题用"流量"不用"排名"；`why is my website traffic dropping` 补全完整 |
| `brand prompt tracking` | 零补全 | 属内部术语，不能作为工具页命名或落地页标题 |
| `share of voice ai search` | 零补全 | 同上；该概念只适合出现在结果页内，不适合做入口 |
| `is my website cited by chatgpt` | 零补全 | 用户实际问法是 `how to get cited by ai` / `how to rank in chatgpt`（均 10 条补全全满） |

> 结论与 §十一 "GSC Quick Wins 改外部命名"一致，并把命名红线扩大到 Prompt 追踪与 Share of Voice 两个方向。

### A.2 补全饱满的表达（可直接用作页面标题）

| 需求 | 补全丰度 | 可用表达 |
|---|---|---|
| AI 可见度 | 10/10 | `ai visibility checker / score / tracker / audit / report / tools / platform` |
| AI 引用做法 | 10/10 | `how to get cited by ai`、`how to get cited in ai overviews`、`how to rank in chatgpt` |
| 内链 | 10/10 | `internal link checker`（+ `free / tool / extension / broken`） |
| 通用审计 | 10/10 | `free seo audit tool`、`free seo audit report generator`、`site audit tool` |
| 关键词聚类 | 10/10 | `keyword clustering tool`（+ `free`）；另有 `keyword clustering python / github` |
| 流量下降 | 完整簇 | `why is my website traffic dropping`、`why is my organic traffic down`、`why is my website getting no traffic` |
| 收录问题 | 完整簇 | `why is my page crawled but not indexed`、`how to check if google indexed my site` |
| 蚕食 | 命中 | `keyword cannibalization checker / tool` |
| 内容衰退 | 命中 | `content decay tool / checker / analysis` |
| AI 爬虫 | 命中 | `should i block ai bots`、`llms.txt generator / checker / validator` |

### A.3 两个被污染或错位的词

- `topical map generator` 的补全**几乎全部被"topographic map（地形图）"占据**，只有第一条属于 SEO 语义。该词不具备入口价值，与 §一 把 Topic Cluster Visualizer 降为子视图的判断一致。
- `keyword clustering python / github` 出现在补全前十，说明有一部分用户在自己写脚本解决聚类——现有工具在"价格或可控性"上没有满足他们，属于 §5.10 的价格痛点在聚类场景的具体表现。

### A.4 外链方向补测（2026-07-29，12 组种子）

用于确定外链资源库的入口词，原始返回见 `2026-07-29-seo-autocomplete-linkbuilding-raw.json`。

| 种子词 | 补全丰度 | 判断 |
|---|---|---|
| `guest post sites` | 10/10（`list` / `free` / `list 2026` / `list site docs.google.com`） | 可用作主入口；`docs.google.com` 后缀说明用户当前在共享表格里找这类清单 |
| `how to get backlinks for free` | 10/10 | 问题词族最强，适合承接内容与工具混合页 |
| `link building tools` | 10/10（`free` / `best` / `ai link building tools`） | 工具词可用 |
| `where to get backlinks` | 4（含 `free` / `quality`） | 次级入口 |
| `unlinked mentions` | 10/10 但**被 Obsidian 笔记软件占据**；SEO 语义需用 `unlinked brand mentions` | 命名需限定 |
| `link building opportunities` | 10/10 但**被 `link building jobs` 占据**（求职意图） | 不可用作入口 |
| `digital pr opportunities` | 10/10 但被 `digital marketing opportunities` 占据 | 不可用作入口 |
| `resource page link building` | 4，半污染 | 弱 |
| `backlink opportunities` | 2 | 弱 |
| `directory submission sites` | 3，全部为地区限定词（uae / australia / instant approval） | 不建议承接，意图偏低质外链 |
| `free backlink sites` | **0** | 零补全 |

### A.5 用户期望的产品形态（新增信号）

补全里反复出现的后缀说明了交付形态偏好，直接影响 §8.1 工具目录的实现方式：

| 后缀信号 | 出现位置 | 对产品的含义 |
|---|---|---|
| `chrome extension` / `extension` | `hreflang checker`、`canonical tag checker`、`sitemap checker`、`core web vitals test`、`internal link checker` | 技术单点检查类，用户想要的是**浏览器插件**，网页版是次选。若只做网页版，即使排上去也接不住这批需求 |
| `template` + `excel / ppt / pdf / free download` | `seo audit report template`、`seo report template for client` | 报告类需求要的是**可编辑交付物**，不是在线看板。对应 §八 的客户报告能力应支持导出为可编辑格式 |
| `free` / `no signup` | 审计、内链、聚类、蚕食、AI 可见度各簇均出现 | 印证 §8.3 的免费层设计：注册墙不能放在首次体验之前 |
| `bulk`（`bulk canonical tag checker`） | 技术检查类 | 单 URL 检查已被免费工具做满，**批量**是这批长尾工具唯一的差异化空间 |

## 附录 B · 与《GenGrowth SEO工具矩阵——用户痛点/需求洞察报告 v1》的对比

对比对象为同期另一份内部简报（以下称"简报 v1"，依据文件见其文首）。两份报告回答的问题不同：简报 v1 是"已收敛出的 7 个候选里哪个先做"，本报告是"112 个候选里哪些值得成为独立入口"。以下记录可信度评估、四处实质分歧与合并结论。

### B.1 简报 v1 强于本报告的三处

| 项 | 说明 |
|---|---|
| **一手证据** | astrologywiki.com 的 3,259 曝光 / 0.12% CTR 单页案例；7/23 内链系统审计发现 168 篇文章 CTA 误链、62% 文章孤岛率。这是自有生产数据，**证据等级高于本报告使用的任何第三方调研** |
| **Reddit 一手取证成功** | 取得真实帖子的标题、票数、评论数、原文引用与链接。其记录的失败路径与本报告完全一致——通用搜索引擎（含 `site:reddit.com`）返回的是 SaaS 博客与比价站，非社区原文；改用 Reddit 站内搜索 + 人工浏览后取得一手帖子 |
| **证据完整性声明** | 文首明确区分"哪一项过了完整六源＋三关 SOP、哪四项仅单点数据"，披露纪律高于多数内部文档 |

其 §05 提出的观察——"最该先做来验证痛点的工具"与"最有独立付费搜索流量的工具不是同一批"——与本报告 §7.2 的"市场优先级 ≠ 开发顺序"是同一类判断，两份报告独立得出。

### B.2 四处需要修正或补强

**1. AI 可见度"轻量免费入口是空的"这一判断，与 2026-07-28 的 SERP 实测不符。**

简报 v1 据此将 GEO 快照排至第 3 位。本报告同日实测该查询首屏：Ahrefs、Semrush、Backlinko 均已提供**免费且免注册**的 AI 可见度检查器，另有 Leapd、SearchIntel、Omnia、rank.ai、GetMentioned 等一批初创免费工具。该格已被占据。

根因是证据时效：其引用的 Reddit 帖为**一年前且已归档**。该品类在此期间变化幅度大（Profound 于 2026-02 完成 9,600 万美元 C 轮、估值 10 亿美元）。**在变化最快的品类中，一年前的社区讨论不足以支撑现在时的供给判断。**

**2. 一手事故证明问题真实，不证明市场需求规模。**

内链排第 2 主要依据 62% 孤岛率这一自有数据。它有力证明了问题真实且难以自查，但不能推出搜索该解决方案的人数——自有站点是被选中的样本，不是随机样本。该证据应计入**工程杠杆**（数据可复用、开发成本低），而非需求量级。本报告最终采纳其排序结论，但更换了理由（见 §11.1 P0-2）。

**3. `semrush alternative` 是有效补充，但意图与原子工具错配。**

Vol 3,600 / CPC $8.00，**该词为本报告 §4.1 未覆盖的有效补充**。但其搜索意图是"寻找更便宜的全能套件"，而非某个单点工具；CPC 反映竞品争夺 Semrush 存量用户的付费战场。结论：由对比型内容页承接，不作为工具页主词（已写入 §11.2 P0-5 备注）。

**4. 关键词数据源分歧。**

`internal link checker` 在简报 v1（google_us）为 Vol 450 / CPC $2.50，在本报告（seodata.dev）为 Vol 140 / CPC $6.19。两者均为单一数据源单点查询，差约 3 倍但同处一个数量级。**处理方式：保留分歧、不取平均、仅按"中等量级"参与排序**（§11.2 备注）。

另需补充一条影响外链方向决策的事实：Google 将为排名买卖链接列为链接垃圾，付费或赞助链接应标记 `nofollow` 或 `sponsored`。简报 v1 将外链计算器挂起的理由是内部定位冲突，该政策约束亦应并列写入——本报告已在 §11.3 处理。

### B.3 两份报告的覆盖差异

| 只在简报 v1 中 | 只在本报告中 |
|---|---|
| 一手事故数据（CTR 案例、内链审计） | 流量下降诊断（本报告 P0-3，简报 v1 未覆盖） |
| 真实 Reddit 原帖与票数 | AI 可见度的供给饱和实测 |
| `semrush alternative` 搜索词 | 自动补全命名验证（附录 A） |
| 定价分层框架（入口型 / 钩子型） | 本地 SEO 覆盖缺口与其验证门槛 |

### B.4 合并后的净变化

两套方法、两位撰写者，独立得出的排序在多数项上吻合；实质净变化只有两处：

1. **AI 可见度从简报 v1 的第 3 位降至 P1**——依据是同日 SERP 供给实测。
2. **流量下降诊断插入 P0**——依据是它与 GSC 机会发现器共用同一套连接与时间线，边际工程成本最低，且问题词需求成熟而供给近乎为零。

内链的排序采纳简报 v1 的结论（进入 P0），但理由由"需求"改为"工程杠杆"。

### B.5 建议合并的证据方法

四种方法互不重叠，建议固化为同一套 SOP：简报 v1 的**一手事故数据**与**Reddit 人工站内取证**，本报告的**自动补全命名验证**与**SERP 供给实测**。此外建议定稿前用同一数据源重跑两份报告重叠的约 6 个关键词，统一口径。

## 十二、参考来源

### 官方与高置信度来源

1. [Google：改善本地排名](https://support.google.com/business/answer/7091?hl=en-en)
2. [Google：管理服务区域](https://support.google.com/business/answer/9157481?hl=en)
3. [Google：Business Profile 与品牌资料](https://support.google.com/business/answer/16394780?hl=en)
4. [Google：本地商家展示规范](https://support.google.com/business/answer/3038177?hl=en)
5. [Google：管理商家类目](https://support.google.com/business/answer/7249669?hl=en)
6. [Google Search Console：Performance report 常见任务](https://support.google.com/webmasters/answer/17010961?hl=en)
7. [Google Search Console：查询与页面维度](https://support.google.com/webmasters/answer/17011259?hl=en)
8. [Gartner：消费者同时使用传统搜索与生成式 AI](https://www.gartner.com/en/newsroom/press-releases/gartner-survey-finds-only-one-third-of-consumers-say-genai-rivals-search-engines-marketers-must-optimize-for-both-ai-driven-and-traditional-search)
9. [YouGov：美国 Web Search 与 AI 报告 2026](https://yougov.com/en-us/reports/55071-us-websearch-ai-report-2026)
10. [Pew Research Center：AI 摘要出现时用户更少点击链接（n=900，2025-03 数据）](https://www.pewresearch.org/short-reads/2025/07/22/google-users-are-less-likely-to-click-on-links-when-an-ai-summary-appears-in-the-results/)

### 搜索量、调查与市场资料

10. [seodata.dev：关键词 API 说明](https://www.seodata.dev/llms.txt)
11. [seodata.dev：website audit tool 数据](https://www.seodata.dev/keyword/website-audit-tool)
12. [seodata.dev：keyword research tool 数据](https://www.seodata.dev/keyword/keyword-research-tool)
13. [BrightLocal：SMB Marketing Report 2025](https://www.brightlocal.com/research/smb-marketing-2025/)
14. [BrightLocal：Local Consumer Review Survey 2025](https://www.brightlocal.com/research/local-consumer-review-survey-2025/)
15. [BrightLocal：Consumer Search Behavior](https://www.brightlocal.com/research/consumer-search-behavior/)
16. [BrightLocal：2026 Local Consumer Review Survey](https://www.brightlocal.com/research/local-consumer-review-survey/)
17. [Service Direct：Small Business Search Marketing Survey](https://servicedirect.com/resources/small-business-search-marketing-survey/)
18. [Semrush：AI Search 与 SEO Operational Gap 研究](https://www.semrush.com/blog/the-operational-gap-ai-seo-study/)
19. [Corporate Ink：GEO and AI Visibility 2026 Report](https://corporateink.com/wp-content/uploads/2026/05/Corporate-Ink-GEO-and-AI-Visibility-2026-Report.pdf)
20. [Yext：Consumer Search Behaviors Report 2026](https://www.yext.com/resources/consumer-search-behaviors-full-report)
21. [Ahrefs 官方价格](https://ahrefs.com/pricing/)
22. [Semrush SEO Toolkit 官方价格](https://www.semrush.com/pricing/#seo)
23. [BrightLocal 官方价格](https://www.brightlocal.com/pricing/)
24. [Screaming Frog 官方价格与功能](https://www.screamingfrog.co.uk/seo-spider/pricing/)

### SERP 供给与社区证据

25. [Semrush：免费 AI Search Visibility Checker](https://www.semrush.com/free-tools/ai-search-visibility-checker/)
26. [Search Engine Land：Local SEO Audit Guide](https://searchengineland.com/guide/local-seo-audit)
27. [Reddit：小团队对 Ahrefs/Semrush 价格与行动性的讨论](https://www.reddit.com/r/SEO_tools_reviews/comments/1ux6di7/semrush_pro_ahrefs_lite_is_almost_3kyear_which/)
28. [Reddit：Affordable SEO tools](https://www.reddit.com/r/bigseo/comments/1ivlae4)
29. [Reddit：关键词聚类中的混合意图问题](https://www.reddit.com/r/SEO_Digital_Marketing/comments/1pjd6kc/how_do_you_cluster_keywords_these_days_curious/)
30. [Reddit：站点级内链检查需求](https://www.reddit.com/r/TechSEO/comments/1s1cy2z/tool_to_check_internal_links/)
31. [Reddit：核心更新后 50% 流量下降诊断案例](https://www.reddit.com/r/SEO/comments/1qtm52u/big_traffic_drop_after_dec_11_2025_google_core/)
32. [Reddit：70% 流量下降案例](https://www.reddit.com/r/SEO/comments/1mto66w/my_traffic_dropped_70_after_the_gsc_july_update/)
33. [Reddit：蚕食是否真实影响排名](https://www.reddit.com/r/WebsiteSEO/comments/1u37d7y/keyword_cannibalization_how_serious_is_it_really/)
34. [Reddit：AI Citation Tracking 的测量与归因限制](https://www.reddit.com/r/SEO/comments/1tkcg7o/what_tools_do_you_guys_use_to_track_ai_citations/)
35. [Reddit：AI Visibility 工具仍缺少行动建议](https://www.reddit.com/r/GEO_optimization/comments/1ullj7a/are_current_ai_visibility_tools_enough_for_ur/)
36. [Reddit：GBP 排名改进讨论](https://www.reddit.com/r/localseo/comments/1s8erss/any_tips_to_improve_my_google_business_profile/)
37. [Reddit：本地服务商面临 Map Pack 与 AI 搜索挤压](https://www.reddit.com/r/smallbusiness/comments/1uc2ydk/is_googles_new_layout_starting_to_hurt_traffic/)
38. [学术研究：Don’t Measure Once — AI Search Visibility](https://arxiv.org/abs/2604.07585)

### URL 结构与本地数据可得性（§8.1.1、§一 相关）

39. [Google Business Profile APIs：政策与第三方管理要求](https://developers.google.com/my-business/content/policies)
40. [Google：验证商家（未验证前资料按公开处理）](https://support.google.com/business/answer/7107242?hl=en)
41. [Search Engine Roundtable：Google 称 URL 中的深层子目录对 SEO 无影响](https://www.seroundtable.com/google-deep-subfolders-urls-seo-32818.html)
42. [Search Engine Journal：Google 称点击深度比 URL 结构更重要](https://www.searchenginejournal.com/google-click-depth-matters-seo-url-structure/256779/)
43. [Whitespark 官方价格（本地工具分项售卖口径）](https://whitespark.ca/pricing/)
44. [Local Falcon 官方价格（geo-grid 按点数计费口径）](https://www.localfalcon.com/pricing)

### 自采数据（随本报告归档）

45. Google 自动补全实测原始返回（44 组种子词，`hl=en / gl=us`，2026-07-28）：`2026-07-28-seo-autocomplete-raw.json`
46. 上述数据的采集脚本（可重跑复核）：`2026-07-28-seo-autocomplete-fetch.py`
47. 外链方向自动补全实测原始返回（12 组种子词，`hl=en / gl=us`，2026-07-29）：`2026-07-29-seo-autocomplete-linkbuilding-raw.json`

关键词表的其余词可按 API 文档复核，统一请求格式为：

`https://app.seodata.dev/v1/keyword?q=<URL 编码后的关键词>&country=us`
