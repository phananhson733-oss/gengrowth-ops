---
title: dramashortstv.com 网站架构 + 内容架构方案
date: 2026-08-21
参照: reelpulse.net 实地架构调研（导航结构 + 7 个一级栏目页面全部实访）
关联: 02-keyword-research/2026-08-20-dramashortstv-关键词清单-40个.md、2026-08-20-dramashortstv选词-入口拓展.md、00-inbox/2026-08-20-dramashortstv-blog-短剧App安全指南.md
说明: 外链策略不参照（reelpulse.net 外链档案有买链痕迹，见配套选词文档验证结论），只学架构和内容打法
---

# dramashortstv.com 网站架构 + 内容架构方案

## 一、reelpulse.net 实地架构（先看它到底长什么样）

导航 7 个一级栏目，比之前光看 Semrush URL 猜测的丰富得多：

| 栏目 | 内容 | 关键设计 |
|---|---|---|
| **HOME** | Hero + 数据条 + "RISING NOW" + 精选行业文章 | 首页不是入口导流页，本身就是内容 |
| **PLATFORMS** | 17 个 App 的档案库 | 每个 App 统一模板：分级徽章(PREMIUM/GROWTH/EMERGING) + 简介 + 自有评分(ReelScore) + 下载量 + 营收估算 + 三个官方链接 |
| **RANKINGS** | 同样 17 个 App，按分数排行榜 | 和 PLATFORMS 是**同一份数据的两种呈现**，一个是目录一个是排行，公开"方法论"（内容质量/体验/性价比/创新四项） |
| **COMPARE** | **交互式硬币计算器**（选两个 App 输入价格算完整看完一部剧多少钱）+ 6 篇两两对比文章 | 这是本次调研里唯一发现的"产品级"内容，不是纯文字 |
| **WATCH** | 具体剧名卡片流（集数/来源App/题材标签/一句钩子/详情页链接）| 具体剧名内容的呈现模板 |
| **INDUSTRY** | 行业新闻（融资/平台动态/AI技术/区域市场），带署名作者、季度预测 | 面向创作者/投资人的受众，不是短剧观众 |
| **GUIDES** | 全站内容的主索引，按标签分类 | 标签体系：SAFETY & TRUST / APP REVIEWS / APP ALTERNATIVES / VALUE ANALYSIS / STORY DISCOVERY / CREATOR ECONOMY / COMPARISON / INTERACTIVE TOOL |

### 关键发现 1：**"RISING NOW"模块解决了我们的滚动流程问题**

首页有个"Updated [日期]"的板块，明说方法论：**"A verified Google Trends riser plus newly listed short dramas. Trend percentages are shown only when the export supports them; new releases are labeled separately."** ——这正是我们之前确认过、但还没建的"具体剧名滚动流程"，reelpulse.net 已经把它做成了一个常驻页面模块，不是内部工作流程。**这是本次最值得直接抄的一个设计。**

### 关键发现 2：APP ALTERNATIVES 这个标签存在，但和我们的验证结果矛盾

/guides 里有一篇"Best ReelShort Alternatives"，属于"APP ALTERNATIVES"标签。**这和我们之前的验证结论冲突**——我们查过 `reelshort alternative` 这类词，Semrush 完全没有搜索量。**两种解释都成立，没法在这里下定论**：① reelpulse 写这篇不是为了搜索流量，是为了内链结构完整（GUIDES 索引页需要覆盖各个标签类目）；② 也可能存在我们没查到的搜索量变体。**这条不建议现在跟进**，除非之后想验证。

### 关键发现 3：STORY DISCOVERY 标签验证了题材桥接的完整形态

"Best Mafia Romance Short Dramas"（"官方观看页、免费额度、内容提示、套路引导"）、"Short Drama Tropes Explained"（billionaire/revenge/hidden identity/werewolf mate/BL 等）——**这和我们之前用 fanficable.com 验证的"读者视角桥接"是同一个内容家族，但 reelpulse 是用编辑视角（不是第一人称"我看了xxx"）在做**，说明这类内容至少有两种可行的语气，不是只有 fanficable 那一种。

---

## 二、dramashortstv.com 架构方案

不建议照搬全部 7 个栏目就开写——reelpulse.net 的 17-App 档案库、行业新闻带署名多作者、交互计算器，都是他们攒了几个月内容和至少一个前端开发资源才做出来的。**按我们现在的关键词库覆盖情况和产能（7–10 篇/周）分阶段建。**

### 2.1 导航结构（先把骨架定下来，内容分批填）

| 栏目 | 对应我们已验证的内容桶 | 第一阶段是否上线 |
|---|---|---|
| **HOME** | 首页 + "正在热映"模块（对标 RISING NOW）| ✅ 第一阶段，模块先空着占位，等剧名滚动流程建起来再填 |
| **PLATFORMS**（App 档案库）| B 组 App 档案页 | ✅ 第一阶段，先做 DramaBox + ReelShort 两个，逐步扩到 6 个已验证 App，远期扩到 reelpulse 那 17 个规模 |
| **COMPARE**（对比）| C 组对比测评 | ✅ 第一阶段做静态对比文章，**交互计算器列为二期，需要产品/工程资源，不是内容团队能独立完成的** |
| **WATCH**（具体剧名）| E 组，需先建滚动流程 | ⚠️ 结构先上线，内容按 Trends 筛选滚动填充，不是一次性列表 |
| **CAST / 演员**（对应他们没有的独立栏目，我们可以做成 PLATFORMS 下的子分类）| F 组演员档案 + reelshort actors 簇 | ✅ 第一阶段，成本低，适合填产能 |
| **GUIDES**（安全指南 + 题材推荐的总索引）| A 组安全指南 + G 组题材/BL 桥接 | ✅ 第一阶段先做安全指南这一篇旗舰内容，其余陆续挂进这个索引下 |
| **INDUSTRY**（行业新闻）| 目前完全没有对应的关键词验证 | ❌ 二期以后再评估，这个栏目需要持续追踪行业新闻的能力，且面向的是创作者/投资人受众，和我们当前"短剧观众"定位不完全重合，需要先确认要不要做这个受众 |

### 2.2 内容标签体系（对齐 GUIDES 的分类逻辑，用我们自己的数据填）

| 标签 | 我们的内容 | 状态 |
|---|---|---|
| SAFETY & TRUST | 短剧 App 安全指南 | ✅ 已成稿 |
| APP REVIEWS / PLATFORM PROFILES | DramaBox / ReelShort 档案页 | 待写 |
| COMPARISON | DramaBox vs ReelShort | 待写 |
| STORY DISCOVERY | BL 推荐、"我看了N集"桥接文 | 待写 |
| CREATOR / 演员 | 演员图鉴 + 辐条页 | 待写 |
| VALUE ANALYSIS（reelpulse 有，我们还没有）| 各 App 价格/coin 换算说明 | ❌ 缺口，见三节 |
| INTERACTIVE TOOL | coin 计算器 | ❌ 二期，需要工程资源 |

---

## 三、这次架构调研暴露的三个内容缺口（之前的关键词库没覆盖到）

### 3.1 VALUE ANALYSIS（价格/性价比类）——之前完全没做

reelpulse 专门有一类"Cheapest Short Drama Apps"、"Short Drama Pricing Guide"内容，直接对比不同 App 的 coin 价格和值不值。**我们之前 B 组档案页里零散有"how much is dramabox"这类词，但没有当成一个独立内容类型看待。** 建议单独立一类，内容形态是"价格快照 + 换算逻辑"，不需要真的做交互计算器也能写（reelpulse 自己也是先写静态对比文章，计算器是后加的）。

### 3.2 题材 Trope 大全——比我们的 BL 单点更系统

"Short Drama Tropes Explained"一篇文章覆盖 billionaire/revenge/hidden identity/werewolf mate/BL 等十个高热度套路，是个**枢纽页**。我们目前的 BL 推荐是孤立的一篇，没有这个"全套路解释"的枢纽页去承接和分发流量。建议补一篇。

### 3.3 App 档案库的广度差距巨大

reelpulse 覆盖 17 个 App（含我们完全没听过的 KalosTV、DreameShort、SnackShort、StarShort、HoneyReels、TopShort、Footage、Veloria、StardustTV、Playlet、MoboReels、FlexTV），我们目前验证过的只有 6 个（ReelShort/DramaBox/GoodShort/ShortMax/NetShort/FlickReels）。**这 11 个新 App 名字本身就是一批还没跑过 Semrush 的种子词**，是下一轮关键词挖掘该做的事，不在这次架构方案范围内，先记录在这里。

---

## 四、明确不学的部分

**reelpulse.net 的外链获取方式不能参照。** 上一轮验证过它的外链档案：87% 引荐域名 AS 0–10、35% 来自摩尔多瓦、32% 是 .top/.site 廉价后缀，Semrush 直接标注链接网络"危险"。**架构和内容打法是它做对的部分，外链是它冒险的部分，两者要分开看，不能因为架构学得像就连带默认外链方式也可以抄。**

---

## 五、建议的执行顺序

1. **先定 6 个一级栏目**（不含 INDUSTRY，受众定位需要先确认）：HOME / PLATFORMS / COMPARE / WATCH / CAST / GUIDES
2. **首页"正在热映"模块先占位**，等具体剧名滚动流程建起来（用 Google Trends 每周筛 2–3 部）再接数据
3. **补 3.1、3.2 两个内容缺口**的选题到关键词库里
4. **INDUSTRY 栏目要不要做，需要 Lynne/团队先确认受众定位**——这个栏目服务的是创作者/投资人，不是短剧观众，做不做取决于 dramashortstv.com 要不要同时经营这两类受众
5. **交互式 coin 计算器列为二期**，需要产品讨论是否值得投入工程资源
