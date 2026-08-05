---
project: astrologywiki + gengrowth
type: report
status: draft
owner: Ma Boyang
updated: 2026-07-26
---

# GenGrowth 运营周报 | 2026-W30

**项目：** AstrologyWiki 增长 + 内容精准化实验 + GenGrowth 方法论沉淀
**周期：** 2026-07-20 → 2026-07-26（7/26 为截至当日数据，非完整自然日）
**汇报人：** 马博洋

---

## 一句话摘要

W30 GSC 点击从 W29 的 301 骤降至 **128（-57%）**，GA4 全站 UV 同步从 104 降至 **59（-43%）**，世界杯决赛效应（7/19）退潮是主因；**但 GSC 点击（128）与 GA4 google/organic 会话（38）之间存在约 70% 的差距，转化漏斗下游数据可信度需专项排查**；本周首次发现 **ChatGPT（chatgpt.com/ai-assistant）贡献 17 个会话，是仅次于 Google 的第二大流量来源**，超过所有传统搜索引擎（Bing/Ecosia/Yahoo）总和，但落地页拆解显示 **65%（11/17）落在首页而非具体文章**，性质更接近"域名被泛提及后点击"而非"AI 引用内容"；Bing Webmaster Tools 数据本周首次可读，IndexNow 上线后 Bing 传统搜索 5 天仅 8 clicks/1,208 曝光（体量小符合预期），但 **Bing Copilot AI 引用（Citations）4 天合计 637 次**，`july-2026-planetary-transits` 一篇文章贡献超 100 次引用，与 ChatGPT 渠道共同指向"AI 分发正成为独立于传统 SEO 的第二通道"；同时确认**实验二-B（Messi CTR 优化）未达标且信号异常**——`lionel-messi-zodiac-sign` 907 曝光、**0 次点击**，`lamine-yamal-zodiac-sign` 曝光翻倍至 3,259 但 CTR 仍仅 0.12%，Title/Meta 修改需求已于 7/25 补写但**负责人待分配、尚未上线**；内链 P0 Bug（168 篇错误 CTA）7/23 复审仍为**未完成**；GA4 全渠道**关键事件数全部为 0**，转化埋点验收条件依旧未满足，且新用户数（91）反常高于活跃用户（59），需核实用户识别逻辑；新增流量来源为 Leandro Paredes（28 clicks）/ Paige Bueckers（16 clicks）/ Vozinha（14 clicks）三个名人星盘词，验证选题响应速度是当前最稳定的增长杠杆；实验三/四矩阵（Saturn Return + Planet in Sign）内容本周已索引但点击仍为 0，符合此前预判的 4-6 周观察窗口，非本周异常。

---

## 本周数据

数据口径：GSC 自定义区间 7/20–7/26（数据源：Desktop `7.20-7.26` 文件夹 GSC 导出）；GA4 7/20–7/26（网页路径与屏幕类导出）

### AstrologyWiki.com

**GA4 概览（`报告概况.csv` 全站总计，非页面加总）**

| 指标 | W30 | W29 | 环比 |
|------|-----|-----|------|
| 活跃用户（UV） | **59** | 104 | **↓43.3%** |
| 新用户数 | **91** | — | — |
| 会话数 | **74** | — | — |
| 总浏览次数（PV） | **185**（页面路径表加总核实一致） | 131 | **↑41.2%** |
| 每位活跃用户平均互动时长 | 121.5秒（约2分1秒） | — | — |
| 关键事件数 | **0** | — | 全渠道 0，与页面级数据一致 |

> ✅ **本周补充下载了 GA4「报告概况」导出，可给出真实全站去重 UV，上一版周报因只有页面路径明细表、无总计行而未给 UV 总数，现已补全。** 用两份文件互相校验：页面路径表 43 行「活跃用户」直接相加 = 106，比真实去重 UV（59）**高出 79.7%**，验证了跨页面重复计数的失真幅度；而「浏览次数」（PV）是可加总指标，两表一致（185），不受此问题影响。
>
> **⚠️ 数据质疑点**：新用户数（91）> 活跃用户（59），正常情况下新用户应是活跃用户的子集。可能原因：多设备/浏览器访问被记为多个「新用户」（first_visit 事件按 client ID 计），但登录后按 User-ID 去重合并为更少的「活跃用户」；也可能是低样本量下 GA4 的阈值/近似处理导致。建议下周与开发侧核实用户识别逻辑，不排除埋点配置问题。
>
> **UV 与 PV 反向变化，值得关注**：UV 下降 43.3%（104→59）的同时 PV 上升 41.2%（131→185），意味着人均浏览页数从 W29 的 1.26 跃升到 W30 的 3.14（185/59），会话人均页数 2.5（185/74 会话）。用户变少但单个用户逛得更深，可能与本周内链/相关文章曝光增加有关，也可能只是小样本波动，建议连续 2-3 周观察是否稳定。

**GA4 流量来源（`报告概况.csv`，按会话数排序）**

| 来源/媒介 | 会话数 | 首次互动用户 | 关键事件 |
|-----------|-------|------------|---------|
| google / organic | 38 | 29 | 0 |
| **chatgpt.com / ai-assistant** | **17** | 17 | 0 |
| (direct) / (none) | 4 | 8 | 0 |
| bing / organic | 3 | 2 | 0 |
| cn.bing.com / referral | 2 | 2 | 0 |
| (data not available) | 1 | 1 | 0 |
| ecosia.org / organic | 1 | 1 | 0 |
| natal_tech_card / (not set) | 1 | — | 0 |
| yahoo / organic | 1 | 1 | 0 |

**关键解读（新增，本周首次可见）：**

**ChatGPT 是仅次于 Google 的第二大流量来源，且单渠道超过所有其他搜索引擎总和**：`chatgpt.com / ai-assistant` 贡献 17 个会话、17 个首次互动用户，超过 bing / cn.bing.com / ecosia / yahoo 四者之和（合计 7 会话）。这是一个此前周报从未追踪过的渠道，值得作为独立渠道持续监控。

**落地页拆解（GA4「流量获取情况」报表补充导出，着陆页 + 查询字符串次维度）：**

| 着陆页 | 会话数 | 占比 |
|---|---:|---:|
| `/`（首页） | 11 | 64.7% |
| (not set) | 3 | 17.6% |
| (not set，另一变体/空值) | 2 | 11.8% |
| `/en/wiki?tab=library&section=houses` | 1 | 5.9% |

**关键修正：这批流量主要落在首页，不是具体内容页，说明大概率不是"ChatGPT 引用了某篇文章"，而是"用户在对话里被泛泛提及站点、点击域名进站"。** 17 个会话中 11 个（65%）直接落首页，只有 1 个落在具体页面（且是分类页 `/en/wiki?tab=library&section=houses`，不是某篇星盘文），另外 5 个 landing page 参数缺失（ChatGPT 客户端跳转常见地裁剪了 referrer/着陆页信息）。这和同一周 Bing Copilot 那边"引用具体文章驱动"的模式（`july-2026-planetary-transits` 贡献 100+ 次引用）性质不同，两个 AI 渠道不能按同一逻辑解读或合并评估效果。

**GSC 点击（128）与 GA4 google/organic 会话（38）差距巨大，只有约 30% 的 GSC 点击在 GA4 侧留下会话记录**：两个数据源统计的是同一时间窗口、同一站点的 Google 自然搜索流量，理论上量级应接近，但 GSC 报告的点击数是 GA4 归因会话数的 3.4 倍。可能原因包括：GSC「点击」统计口径本身比「完成页面加载并触发 GA4」更宽松（例如用户点击后立刻返回、预加载但未渲染）；欧美访客量较大（本周美/英/法/德/加占比高）可能因 Cookie 同意横幅拒绝而未触发 GA4；也不排除技术性丢失（如 SPA 路由下 GA4 脚本未及时加载）。这个 70% 的「点击-会话」损耗值得下周专项排查，是比单纯提升 CTR 更基础的问题——**曝光转点击的优化再有效，如果 70% 的点击都没被 GA4 看见，转化漏斗的下游数据就是不可信的**。

**GSC 概览（全站，W30 vs W29）**

| 指标 | W30 | W29 | 环比 |
|------|-----|-----|------|
| 总点击 | **128** | 301 | **↓57.5%** |
| 总曝光 | **11,601** | ~21,700 | **↓46.5%** |
| 平均 CTR | **1.10%** | 1.4% | ↓0.3pt |
| 平均排名 | **12.1** | 9.4 | ↓2.7（变差） |
| 移动端占比 | 81%（104/128 clicks） | — | — |

**GA4 Top Pages（按浏览次数排序，页面路径明细表）**

| 页面 | 浏览次数 | 活跃用户 | 备注 |
|------|---------|---------|------|
| / （首页） | 30 | 23 | 平均互动 3分3秒，参与度最高 |
| /en/wiki（列表页） | 42 | 10 | — |
| /onboarding | 16 | 7 | 产品激活漏斗 |
| /dashboard | 11 | 7 | 产品激活漏斗 |
| /en/birth-chart-calculator | 11 | 4 | 核心工具页 |
| /en/tools | 8 | 2 | — |
| /en/wiki/jude-bellingham-birth-chart | 7 | 2 | — |
| /en/wiki/vozinha-birth-chart | 4 | 4 | — |
| /en/wiki/paige-bueckers-birth-chart | 3 | 5 | 平均互动 65秒 |
| /en/electional-astrology | 4 | 1 | — |

> 注：本表「活跃用户」为页面级数据，逐页去重后的数字，跨页会重复（同一用户访问多页会在多行各计一次），43 行加总为 106，与全站真实 UV 59 不可比，仅用于页面间热度排序参考。

> 逐日曲线（点击/曝光/排名）7/20→7/25 持续下滑：曝光从 3,012 降至 996，均排从 10.3 降至 13.8，7/26 为不完整自然日（截至采集时点仅 348 曝光）不纳入趋势判断。**下滑与 7/19 世界杯决赛结束高度吻合**，决赛周热搜词（France vs Spain / England vs Argentina 预测文等）曝光池随赛事结束自然回落，属预期内的流量退潮，非技术性异常。

**GSC Top 10（按点击数排序）**

| 查询词 | 点击 | 曝光 | CTR | 排名 |
|--------|------|------|-----|------|
| paige bueckers birth chart | **8** | 28 | 28.57% | 2.68 |
| leandro paredes birth chart | 7 | 72 | 9.72% | 3.22 |
| jude bellingham birth chart | 4 | 86 | 4.65% | 9.52 |
| vozinha natal chart | 4 | 7 | 57.14% | 1.29 |
| rising sign calculator | 3 | 43 | 6.98% | 56.98 |
| leandro paredes natal chart | 3 | 29 | 10.34% | 3.34 |
| leandro paredes astrotheme | 3 | 21 | 14.29% | 5.81 |
| vozinha birth chart | 3 | 13 | 23.08% | 1.54 |
| erling haaland rising sign | 2 | 33 | 6.06% | 7.24 |
| jude bellingham rising sign | 2 | 13 | 15.38% | 9.77 |

**关键解读：**

**新名人星盘词是本周唯一增量来源，验证选题响应速度是当前最稳定杠杆**：Leandro Paredes（阿根廷球员）三词合计 13 clicks（birth/natal chart + astrotheme），Vozinha（巴西网红/球员）三词合计 11 clicks，Paige Bueckers（WNBA）单词 8 clicks 且 CTR 高达 28.57%（排名 2.68）。三者均为本周新进入 Top 10 的选题，说明"事件/热搜触发 → 快速产出星盘文"的策略在无世界杯规模事件的平常周仍然有效，且 Paige Bueckers 28.57% CTR 证明 Title/Meta 抓取用户搜索意图的能力没有问题，问题集中在特定老页面（见下）。

**实验二-B（Messi CTR 优化）验收未达标，且信号异常，需要排查而非仅归因于文案**：`lionel-messi-zodiac-sign` 页面 W30 曝光 907、**点击 0、CTR 0%**，排名 8.65（页面接近首页，理论上应有点击）。查询层面所有 Messi 变体词（`lionel messi zodiac sign` 103 曝光、`messi zodiac sign` 91 曝光等，累计数百曝光）**全部 0 点击**。这不是"文案吸引力不足"的常规 CTR 问题，而是数百次曝光在体面排名下零点击的异常模式，值得核实是否存在 SERP 展示异常（如 rich snippet 渲染错误、标题被截断、页面被打上非预期的搜索结果类型）。`inbox-maboyang/06-tasks/2026-07-25-astrologywiki-title-meta-修改需求.md` 已于 7/25 写好 Messi / Lamine Yamal / Haaland / Bellingham 四页新 Title & Meta，**但负责人栏为"待分配"，W30 期间未上线**，是本次数据仍处于优化前基线的直接原因。

**Lamine Yamal zodiac sign：曝光翻倍但 CTR 未改善，W29 遗留问题持续放大**：W29 该页 1,547 曝光 / 2 clicks / 0.1% CTR，W30 曝光翻倍至 **3,259**，点击仅回升至 4 次，CTR 仍为 **0.12%**，核心查询词 `lamine yamal zodiac sign` 单独看是 1,115 曝光 / **0 点击**。这是 W29 报告"下周目标"中列为最高优先级但未完成的动作，两周曝光损耗合计约 4,800 次，按 3% CTR 目标估算已损失约 140 次点击。

**Rising Sign Calculator 工具页排名 56.98–64.86，明显偏低**：核心查询 `rising sign calculator` 排名 56.98（3 clicks/43 曝光），工具页自身 GSC 排名 64.86（5 clicks/365 曝光），均在第 5-7 页区间，与其作为核心转化工具的定位不匹配。实验五（Rising Sign 内容矩阵）7/25-7/26 才启动，尚未形成内链支撑，这是排名低的合理解释，但也说明该工具页目前基本不承担自然流量获客功能。

**实验三/四内容矩阵已索引，点击为 0 符合预期观察窗口，非异常**：抽查 Saturn Return 相关页面（`saturn-return-calculator` 105 曝光、`saturn-return-age-30` 11 曝光等）与 Planet-in-Sign 页面（`moon-in-cancer` 25 曝光、`venus-in-gemini` 10 曝光等），点击**全部为 0**，平均排名普遍在 27–64 区间（`mars-in-aries` 60、`moon-in-cancer` 64.2）。这与 W29 报告设定的"实验三 8/25 前后可读信号 / 实验四 9/1 前后"时间表一致，当前阶段內容尚未进入排名爬升区间，属预期状态，不构成本周问题。

---

### Bing / AI 搜索表现（新数据源，W30 首次纳入）

数据口径：`Desktop/7.20-7.26/Bing/` 四份 Bing Webmaster Tools 导出，覆盖 **7/20–7/24**（Bing 数据滞后，7/25–7/26 尚未出）。这是 IndexNow 于 7/21 上线后第一份可读的 Bing 数据。

**Bing 传统搜索 Overview（5天）**

| 日期 | 点击 | 曝光 | CTR |
|------|-----|------|-----|
| 7/20 | 0 | 0 | 0% |
| 7/21 | 4 | 595 | 0.67% |
| 7/22 | 0 | 237 | 0% |
| 7/23 | 2 | 244 | 0.82% |
| 7/24 | 2 | 132 | 1.52% |
| **合计** | **8** | **1,208** | **0.66%** |

体量远小于 Google（GSC 同期日均 ~1,700 曝光 vs Bing 日均 ~240），符合 Bing 6-8% 市场份额的量级预期。8 次点击中「罗睺大运"（`/zh/wiki/rahu-mahadasha`，2 clicks/28.57% CTR/排名5）与 GA4「cn.bing.com/referral 2 会话」相互印证，中文内容在 Bing 生态有小规模稳定转化。关键词报表（79 条）汇总印象数仅 146，远低于 Overview 的 1,208——说明约 88% 的曝光来自 Bing 未单独列出的长尾词（低于报告阈值），与 GSC/Google 的"(other)"长尾现象一致。

**⭐ Bing AI Performance（Copilot 引用数据，此前从未追踪的指标）**

| 日期 | Citations（被引用次数） | Cited Pages（当日被引用的页面数） |
|------|------|------|
| 7/21 | 132 | 14 |
| 7/22 | 150 | 15 |
| 7/23 | 198 | 17 |
| 7/24 | 157 | 13 |
| **合计** | **637** | 13–17（逐日去重，不可加总） |

这是 Bing Copilot 在回答用户提问时引用 astrologywiki.com 页面作为信息源的次数，4 天合计 **637 次引用**——量级远超同期 Bing 传统搜索点击（8 次）和曝光（1,208 次），说明"被 AI 引用"和"被传统搜索点击"是两套独立且量级不对等的分发渠道。

**AI Grounding Query Top 6（驱动引用的具体提问）**

| Grounding Query                                | 主题                                  | Citations | Citation Share |
| ---------------------------------------------- | ----------------------------------- | --------: | -------------: |
| july planets astrology 2026                    | Astrological Transits & Predictions |        55 |         36.67% |
| astrological transits July 2026                | Astrological Transits & Predictions |        27 |         22.13% |
| haaland birth chart                            | Zodiac Signs & Birth Charts         |        15 |         18.52% |
| astrology transits July 2026                   | Astrological Transits & Predictions |        11 |         28.21% |
| current planetary transits July 2026 astrology | Astrological Transits & Predictions |         8 |         16.67% |
| erling haaland birth chart                     | Zodiac Signs & Birth Charts         |         5 |         18.52% |

**关键解读：`july-2026-planetary-transits` 一篇文章是本周 AI 引用的最大单一来源**，前 5 个 Grounding Query 中 4 个都是"July 2026 行星过境"主题的变体，合计贡献超过 100 次引用；对照 GSC 页面数据，该页本周仅 2 clicks / 276 曝光——传统搜索表现平平，但在 AI 问答场景里是引用率最高的内容。这与本周 GA4 发现的「chatgpt.com/ai-assistant 17 会话」共同指向同一个结论：**AI 搜索/问答正在成为独立于传统 SEO 的第二增长通道，而且当前表现最好的内容类型（时效性强的行星过境解读）与传统 SEO 表现最好的内容类型（名人星盘）并不完全重合**，需要单独评估是否值得针对"AI 引用友好"（结构化、时效性强、可直接摘录）优化一批内容。

> 注：Bing「AI Performance」与 GA4「chatgpt.com/ai-assistant」是两套不同的 AI 系统（Bing Copilot vs OpenAI ChatGPT），citations 不代表点击/会话，两者不可直接相加或对比，这里仅作为"AI 分发渠道正在起量"的两个独立佐证。

---

## 本周工作重点（依据 inbox-maboyang 文件记录，非本次数据源直接产出）

### 内容生产

`06-tasks/seo-autopilot-publish-log.md` 记录 W30（7/20–7/24）发布 **15 篇**，含 Leandro Paredes / Ferran Torres / Jang Wonyoung / Jennifer Lopez 等名人星盘文、Argentina vs Spain 决赛复盘文，以及实验三/四矩阵收尾内容（surviving-saturn-return、saturn-return-career-change、mars-in-aries、venus-in-taurus 等）。日志 7/25–7/26 暂无新增记录，可能为日志更新滞后，建议下周核实。

### 内链系统审计（7/23，`08-reports-and-feedback/2026-07-23-内链系统审计报告-astrologywiki.md`）

对 W29 报告标记的 P0 Bug 做了复审，抽样 9 篇实测：

| 需求 | 状态 |
|------|------|
| Req 1：168 篇错误内链批量替换（P0） | ❌ **仍未完成**，9 篇样本中 7 篇仍含错误链接；另发现首页本身也有 2 处指向该错误链接 |
| Req 2：102 篇无工具链接补全（P1） | ⚠️ 部分完成，样本 4/9 仍无工具链接，超出"≤10 篇"验收标准 |
| Req 4：相关文章推荐组件（P1） | ❌ 未完成，基础架构 PR 中，可视卡片未上线 |

celebrity_zodiac_trending 集群（Harry Kane、Haaland）已确认修复，vozinha 等新页面仍带错误链接，说明修复未覆盖新发布内容，是持续性流程问题而非一次性遗留。

### 基础设施

Bing Webmaster Tools + IndexNow 已于 7/21 完成接入（彪哥），新内容发布后 Bing/Yandex/DuckDuckGo 收录延迟问题已解决；Bing 首页提示部分近期页面未进入 sitemap，需另行跟进。

---

## 本周暴露的业务问题

**1. Messi/Lamine Yamal 系列页面 0-0.12% CTR，Title/Meta 修复方案已写好但未上线，卡在"负责人待分配"。**
两周内曝光合计超 5,000 次，实际点击不足 10 次。`06-tasks/2026-07-25-astrologywiki-title-meta-修改需求.md` 已给出 4 个页面的新 Title/Description，是本周成本最低、回报最高的单点动作，唯一阻塞是执行分配，不是内容或技术难度。

**2. 内链 P0 Bug 连续两周复审仍未修复，且已扩散到新发布内容。**
7/23 审计确认 168 篇错误内链问题原状未变，新发布的 vozinha-birth-chart 等页面同样带错误链接——说明问题根源可能在内容生产模板/流程，而非仅是历史存量清理，批量替换无法根治，需要从生产端修正。

**3. GA4 关键事件埋点连续两周为 0，实验三/四验收条件仍未满足。**
W29 报告将"GA4 tool_cta_click + oracle_cta_click 埋点上线"标记为已完成，但 W30 实测导出中全部 43 个页面路径关键事件数为 0。需要明确核实：是埋点确实未生效，还是本周真实转化事件为 0（后者在 185 次 PV 规模下也并非不可能，但需要与开发侧对一次口径）。

---

## 下周目标（W31）

- [ ] **Messi / Lamine Yamal / Haaland / Bellingham 四页 Title & Meta 上线**：`06-tasks/2026-07-25-astrologywiki-title-meta-修改需求.md` 已就绪，分配负责人并上线，作为本周最高优先级
- [ ] **排查 Messi 系列 0% CTR 是否为 SERP 展示异常**：而非默认归因于文案吸引力，人工搜索截图核对实际展示样式
- [ ] **内链 P0 Bug 根源排查**：确认新发布内容仍带错误链接的原因是模板问题还是历史组件复用，避免批量替换后再次复发
- [ ] **GA4 关键事件埋点核实**：与开发侧确认 tool_cta_click / oracle_cta_click 是否真实触发，明确 W30 转化为 0 的原因
- [ ] **Rising Sign Calculator 排名提升**：结合实验五矩阵内链支撑，观察排名能否从 56-64 区间回升
- [ ] **实验二-B 二次验收节点顺延**：因优化未上线，验收数据窗口顺延至 Title/Meta 实际上线后 14 天
- [ ] **核实 7/25-7/26 发布日志缺口**：确认是否为记录滞后
- [ ] **排查 GSC 点击（128）与 GA4 google/organic 会话（38）70% 差距**：核实是否为 Cookie 同意横幅拦截、SPA 路由脚本加载时机，还是 GSC/GA4 统计口径固有差异；这决定了后续所有转化类分析的可信基线
- [x] **ChatGPT（chatgpt.com/ai-assistant）落地页已核实**：65%（11/17）落首页、仅 1 个落具体内容页（分类页非文章），判断为"域名泛提及后点击"而非"内容被引用"，暂不值得针对性内容优化，下周继续观察量级是否稳定即可
- [ ] **核实新用户数（91）> 活跃用户（59）的异常**：与开发侧确认 User-ID 识别/登录态是否导致跨设备计数不一致
- [ ] **建立 Bing AI Performance（Copilot Citations）+ GA4 chatgpt.com/ai-assistant 的持续追踪**：本周是首次拿到数据，样本仅 4-5 天，需要连续 3-4 周观察 637 次引用/17 会话是否稳定，避免单周数据被过度解读
- [ ] **评估"AI 引用友好"内容优化的投入优先级**：`july-2026-planetary-transits` 传统 SEO 平平但 AI 引用最高，与实验三/四/五当前"传统 SEO 优先"的选题逻辑不完全一致，需要产品/内容侧讨论是否值得单独立项

---

*本报告基于 Desktop `7.20-7.26` 文件夹 GSC 导出、GA4「报告概况」总计数据、GA4「网页路径和屏幕类」明细数据、GA4 界面「流量获取情况」标准报表补充导出（着陆页 × 来源/媒介交叉，用于核实 ChatGPT 渠道落地页）、Bing Webmaster Tools 四份导出、inbox-maboyang W29 报告及 7/20-7/26 期间新增文件（内链审计、Title/Meta 修改需求、发布日志）交叉核对 | 撰写日期：2026-07-26 | 下次更新：W31*
