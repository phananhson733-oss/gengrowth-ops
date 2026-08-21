---
title: dramashortstv.com 选词 · SOP 四桶分级（六源挖掘）
date: 2026-08-20
方法: docs/03-marketing/03-seo/keyword-research-sop.md（六源挖掘→四桶分级）+ 选词规则 v1.1（四问/四类否决）
数据: Semrush 美国库（sem.3ue.com），2026-08-20
关联: 02-keyword-research/2026-08-20-dramashortstv选词-drama-shorts词根.md（词根与初批验证，本文档在此基础上按正式 SOP 补全）
状态: SEO 全权决策，不再单独送审
改版: v2 —— 补上遗漏的头部竞品 reelshort.com 自己的域名数据，并把关键词映射来源从 1 个（reelpulse.net）扩到 6 个，纠正上一版"只用一个来源"的片面问题
---

# dramashortstv.com 选词 · SOP 四桶分级

## 一、零节：竞品选择——查了 8 个域名，2 个真同赛道竞品 + 1 个头部品牌 + 5 个假竞品/风险站

按 SOP 零节"新站（DR<20）"路径：先在弱 SERP 里找同类站，而不是直接选品类大站。逐个查了 Semrush 自然排名全量数据：

| 域名 | 真实身份 | 判断 |
|---|---|---|
| **reelshort.com** | **头部品牌官网**，38,000 个自然排名词，10.7 万 SE 关键词，美国月流量 10.7 万 | ✅ **真竞品，但 DR 差距过大**。按 SOP 只做步骤 A（话题发现），不做步骤 B（关键词直接映射）——见第三节，这是本次最大的话题发现来源 |
| filmustage.com | **电影制作 SaaS 工具站**（剧本分解、故事板软件），"短剧App对比"是它 4,297 个词里的 1 篇 | ❌ 假竞品，高 DR 泛站，只能话题发现 |
| magiclight.ai | **AI 视频生成工具站**，"10 Best Short Drama Apps"是它 10,298 个词里的 1 篇 | ❌ 假竞品，同上 |
| dodofanz.com | **OnlyFans 克隆 App 开发服务商**，"ReelShort vs DramaBox"是它 27 个词里的 1 篇 | ❌ 假竞品 |
| oyelabs.com | **App 开发外包公司**，3,839 个词里没有一个和短剧相关 | ❌ 假竞品 |
| **dramabox.org** | ⚠️ **一个和短剧完全无关的老牌社区剧团/工作坊网站**（域名注册远早于 DramaBox 这个 App 出现，页面是"contact us""workshops""about founder"这类内容），因为域名字面撞上了"dramabox"这个品牌名，意外拿到了品牌词的大量误导流量 | ❌ 假竞品，但**证明了一件事**：`dramabox` 这个裸品牌词的 SERP 弱到连一个毫不相关的老站靠域名撞名都能排第 7，见 3.1 节 |
| ⚠️ shorts-drama.com | **未授权的短剧流媒体聚合站**（`watch.shorts-drama.com` 子域名直接放剧集播放页，还有自己的 `/refund` 退款页），主打"免费看""不用付费看 reelshort" | ❌ **不是内容策略来源，是品牌风险案例**——证实了"for free / without paying"这类修饰词背后确实存在灰色/侵权站点，呼应上一版关于 mod apk 的判断 |
| **reelpulse.net** | **短剧垂类内容站**，2026-03-31 注册（5 个月），66 个自然排名词全部是短剧相关 | ✅ **真竞品** |
| **fanficable.com** | **Wattpad/同人文垂类内容站**，650 个词，同时覆盖同人文写作 + 短剧 App 测评（"我看了 1,200 集 ReelShort，这是我的片单"这类桥接内容）| ✅ **真竞品，且是本次最重要的新发现**，见 2.6 节 |

**这一步的教训（v1 已有，v2 加一条）**：SERP 里出现的"新站/小站"，不代表它是同赛道竞品——可能只是别的行业的高 DR 站顺手写了一篇（filmustage/magiclight/dodofanz/oyelabs），也可能是**域名字面撞名的无关老站**（dramabox.org），还可能是**打着内容站幌子的灰色聚合站**（shorts-drama.com）。**每个候选竞品都要点开看它到底在卖什么，不能只看 Semrush 报出来的关键词重合度。**

---

## 二、来源 1：竞品关键词映射（6 个域名交叉验证）

### 2.1 🔴 裸品牌词：SERP 弱到连无关老站都能排第 7

reelpulse.net、dramabox.org 两个完全不同性质的站，都在裸品牌词上拿到了排名，交叉印证这类词的门槛不高：

| 关键词 | 月搜（美国）| KD | reelpulse 排名 | dramabox.org 排名 |
|---|---:|---:|---:|---:|
| `dramabox` | **40,500** | 70 | 第 7 位 | 第 7 位 |
| `reelshort` | **33,100** | 67 | 第 7 位 | — |
| `drama box` | 18,100 | 73 | 第 9 位 | 第 9 位 |
| `reel short` | 8,100 | 52 | 第 8 位 | — |

对照：`drama shorts`（我们定的词根）美国月搜只有 3,600。**光是 `dramabox` 一个裸品牌词的搜索量，就是整个词根的 11 倍。**

**这不是常规四问能筛出来的词**——KD 67–73 远超战略词桶上限（50），正常流程在第一关就会被 DR 差距过滤掉。但**两个毫无关联的站都用不同方式挤进了第一页**（reelpulse 用"该 App 最佳剧集推荐"页，dramabox.org 纯粹靠域名撞名）——这是 SOP"人工覆盖"机制该用的地方。

**打法不是正面硬刚品牌词本身**，是做"在 X 上必看的 N 部剧"这类衍生页面去接流量。

### 2.2 一页覆盖多个长尾词：安全类内容的正确形态

reelpulse.net 用**一篇** `/articles/short-drama-app-safety-guide`，同时排进了：

| 关键词 | 月搜 | KD |
|---|---:|---:|
| `is reelshort safe` | 50 | 24 |
| `is reelshort app safe` | 140 | 24 |
| `is dramabox safe` | 140 | 33 |
| `is dramabox app safe` | 210 | 31 |
| `is drama box safe` | 110 | 32 |
| `is shortmax safe` | 70 | 28 |
| `is shortmax app safe` | 70 | 29 |
| `is netshort safe` | 50 | 27 |
| `is netshort app safe` | 110 | 23 |
| `is goodshort app safe` | 50 | 32 |
| `is flickreels safe` | 70 | 25 |

**11 个关键词，一篇文章，累计月搜超过 1,100。** 这印证了选词规则"一个意思只写一篇"的反面用法——这些词字面不同（App 名不同），但用户意图完全一致，SERP 允许一页覆盖。

### 2.3 平台档案页型：一页覆盖一个 App 的全部信息词

`/platforms/dramabox` 一页排进了 `dramabox review`（320/月）、`how much is dramabox`（170/月）、`is drama box legit`（210/月）、`what is dramabox`（880/月）、`drama box reviews`（720/月）等。dramabox.org（虽然是假竞品）也独立验证了同一批词的存在：`who owns dramabox`（110/月）、`dramabox subscription`（590/月）、`how to cancel dramabox subscription`（多个变体，各 50–260/月）——**App 的订阅/退订/客服类信息词，是一个独立的、量不小的子簇**，之前完全没纳入候选。

### 2.4 🔴 具体剧集：单部剧的搜索量超过整个词根，是本次最大的发现

直接查了 reelshort.com 自己的排名数据（380 页，38,000 个词），发现**具体剧名的搜索量级远超预期**：

| 剧名                                               |                       相关搜索月搜（美国，累计） | 代表词                                           |
| ------------------------------------------------ | ----------------------------------: | --------------------------------------------- |
| American Sniper: The Last Round                  | **约 20,000+**（基础词 1.9K + 十几个变体各百至千） | `american sniper the last round`（1.9K，站内排第 1） |
| How to Tame a Silver Fox                         |                               8,100 | 剧名本身                                          |
| How to Dump a Hockey Star                        |                               2,400 | 剧名本身                                          |
| Movie Characters Females That Are Short（疑似标签页误标） |                               2,400 | —                                             |
| You Fired a Tech Genius                          |                                 260 | `you fire a tech genius full movie`           |

**American Sniper: The Last Round 一部剧的搜索量，是 `drama shorts` 整个词根（3,600）的 5 倍以上。** 这不是个例——380 页排名数据里，绝大多数流量来源都是具体剧名 + 修饰词（`full episode`、`full video`、`streaming`、`cast`）的组合，不是品类词、不是题材词，也不是 App 通用词。

**这条推翻了之前"具体剧名内容需要持续追新剧，只是理论上存在"的保守判断**——它不是一个补充选题池，它可能是**这个垂类里单一体量最大的关键词类型**，量级超过我们已经验证的所有其他类别之和。

### 2.5 🔴🔴 必须排除的模式："[剧名] dailymotion"——大量剧名搜索本质是盗版意图

reelshort.com 自己的排名数据里，一个模式反复出现且占比很高：

```
american sniper the last round dailymotion    170/月
the virgin and the professor dailymotion       110/月
ice cold regret dailymotion                     90/月
santa sent me a billionaire husband dailymotion  70/月
crossing lines with my brother-in-law dailymotion 50/月
don't fall in love with me husband dailymotion   50/月
```

**"[剧名] + dailymotion"这个组合，意图是"我想在 Dailymotion 上找这部剧的免费未授权版本"**——Dailymotion 是知名的盗版内容容忍度较高的平台。这批词加起来的量不小，但**和上一版文档里排除的"mod apk"、"free coins without paying"是同一类风险**，必须在选题阶段就过滤掉，不能因为"是剧名词"就默认安全。

**修正后的规则**：具体剧名本身是安全的、值得做的选题；但**剧名 + dailymotion / 剧名 + free full episode / 剧名 + without paying 这类修饰词组合，无论挂在哪部剧名下，一律排除**，判断标准和上一版的"free coins/mod apk"完全一致。

### 2.6 🔴 fanficable.com：验证了题材词"书圈桥接"打法真实可行

上一版文档 3.4 节判断"题材词的量在书圈，短剧内容截不到"，**这个判断本身没错，但漏了一种能截到量的打法**——fanficable.com（Wattpad/同人文垂类站）已经在做，而且排名很好：

| 文章 | 覆盖关键词（部分）| 排名 |
|---|---|---|
| "I Watched Over 1,200 Episodes of ReelShort Dramas — Here's My Picks" | `best reelshorts`(30/月)、`best reel short`(40/月)、`drama short reels`(30/月)、`reelshort price`(30/月)、`reelshort company`(50/月)等十余个 | `best reelshorts`、`best reel short` 均**排第 1** |
| "DramaBox Reviews: Best and Worst Dramas" | `drama ox`(30/月)、`best drama box series`(40/月)、`dramabox app review`(40/月)、`is dramabox safe to use`(40/月) | 多数进前 10 |
| "Best Vertical Drama Actors: ReelShort, DramaBox" | `top vertical actors`(40/月)、`dramabox actors names male`(40/月) | 前 10 |
| "Werewolf Book Series Online: Wattpad and Inkitt"（纯书圈内容，同域名）| `werewolf books series`(40/月) | 前 30 |

**机制**：fanficable.com 不是"写一篇关于 werewolf romance 的 SEO 文章去正面抢词根"，是**站在读者（书粉/同人文爱好者）视角写"我作为一个读者/同人文爱好者，追了这些短剧"**——这种第一人称体验分享型内容，天然能同时被"找书"意图和"找剧"意图的搜索接住，因为内容本身就是横跨两个受众写的，不是单一意图的产品页。

**这条修正了上一版的判断**：题材词不是"打不进去"，是"正面写 SEO 文章打不进去，但站在读者视角写体验分享能打进去"——路径存在，只是打法要换。

---

## 三、reelshort.com 话题发现（步骤 A，不做关键词直接映射）

38,000 个词按内容类型大致分四类，按 SOP 只用来"了解品类内容全景"：

| 内容类型 | 典型 URL 结构 | 说明 |
|---|---|---|
| 具体剧集页 | `/full-episodes/[剧名]` `/episodes/episode-N-[剧名]` | 主体流量来源，见 2.4 |
| 演员/角色档案 | `/fandom/[演员名]` `/tags/movie-actors/[演员名]` | 独立验证的内容类型，见下 |
| 客服/订阅 | 搜索结果重定向到 `/search?keywords=...` | 说明这类查询官网自己都没有专门落地页，是个内容空白 |
| 剧集分类标签 | `/movie-genres/[题材]` | 官网自己也在做题材聚合页，但流量占比小于具体剧名 |

**演员档案页值得单独指出**：`mark vega ethnicity`(110/月)、`anna stadler movies and tv shows`(260/月)、`mark herrmann actor`(210/月)、`lukas charles stafford`(390/月)——**短剧演员的个人资料/身世类查询，是一个独立存在且有真实量的子类**，之前完全没有考虑过。这类内容制作成本低（不需要看完剧，只需要整理演员公开信息），适合作为长尾内容批量填充。

---

## 四、四桶分级（v2：新增两类）

### 4.1 桶分类结果

| 桶 | 关键词/内容类型 | 月搜 | KD | 判定依据 |
|---|---|---:|---:|---|
| **快速胜利**候选 | 无严格符合 KD<20 的单词，但见 4.3 说明 | — | — | 见下方说明 |
| **长尾词**（月搜 <100） | `is reelshort safe`、`is netshort safe`、`is goodshort app safe`、`best bl short drama apps`、`best apps to watch bl drama for free` | 30–110 | 21–56 | reelpulse 已验证可排 |
| **战略词**（KD 20–50，月搜≥100，仅选 1–2 个门面词） | `dramabox vs reelshort`、`is reelshort legit`、安全指南聚合页整体 | 70–210 | 24–49 | SERP 实测开放 |
| **🔴 策略强制类**（KD 远超阈值，靠真实 SERP 反证覆盖分桶结果） | `dramabox`、`reelshort`、`drama box`、`reel short` 裸品牌词 | 8,100–40,500 | 52–73 | 两个独立竞品都已验证能排进第一页 |
| **🔴🔴 新增：具体剧名类**（不受标准 KD/月搜阈值约束，需按剧单独评估）| American Sniper: The Last Round、How to Tame a Silver Fox 等 | 单剧 260–20,000+ | 各不相同，多数 20–35（比预期低）| reelshort.com 官网 380 页数据验证，且**KD 普遍偏低**（因为大部分竞争位置也是 reelshort 自己的其他语言版本页面或 fandom 页，不是外部强站）|
| **🔴 新增：演员/角色档案类**（长尾词性质，批量生产型）| `mark vega ethnicity`、`lukas charles stafford` 等 | 40–390/个 | 未测 | reelshort.com 官网 fandom 页验证存在真实需求 |
| **排除类** | `[剧名] dailymotion`、`reelshort free coins`、mod apk 类、shorts-drama.com 式"免费看不付费"内容 | — | — | 盗版关联，2.5 节 + 上一版文档已确认 |

### 4.2 为什么"具体剧名"这类不能套标准 KD/月搜阈值

单部剧的搜索量从几十到两万不等，波动极大，且供给端（能写的剧）随时间变化——一部剧火多久、值不值得写，取决于它自己在 ReelShort/DramaBox 上的热度周期，不是一次性能选完的固定词表。**这类内容需要建立一个滚动选题流程**（比如每周查一次 Semrush 或 Google Trends 里哪些剧名搜索量在涨），不适合放进一次性的关键词表格里执行。

### 4.3 关于"快速胜利"桶：结论不变，但补充一个例外

上一版说这个垂类几乎没有 KD<20 的词。这次扩大样本后，**具体剧名类词的 KD 普遍在 20–35 区间，个别低到个位数**（比如 `dramashorts mod apk` KD 7，但这个是要排除的盗版词，不能算胜利）。**真正干净且 KD 低的机会集中在冷门剧/刚上线剧的早期窗口**——这需要滚动监测，不是静态列表能覆盖的，这一点和选词规则"趋势词挑冷门"的逻辑是相通的。

---

## 五、按选词规则 v1.1 复核（四问 + 四类否决）

| 关键词/内容类型 | 词型否决 | AI 摘要 | 意图匹配 | 结论 |
|---|---|---|---|---|
| 安全指南聚合页（is X safe 簇）| 无 | `is reelshort legit` 已验证无摘要，其余未逐词复测 | 匹配 | ✅ 推进 |
| App 档案页（订阅/退订/价格）| 无 | 未测，发布前补查 | 匹配 | ✅ 推进 |
| `dramabox vs reelshort` | 无 | 有，只罗列概览未给结论（🟡档）| 匹配 | ✅ 推进 |
| 品牌衍生页（best dramabox shows 类）| 无 | 需发布前查 | 匹配，reelpulse 已验证 | ✅ 推进 |
| **具体剧集内容**（不含 dailymotion 修饰）| 无 | 未测，量大的剧发布前应查 | 匹配 | ✅ 推进，需建立滚动选题流程 |
| **演员档案内容** | 无 | 未测 | 匹配 | ✅ 推进，批量生产型 |
| **书圈桥接内容**（fanficable 模式）| 无 | 未测 | 匹配（第一人称体验分享，非正面题材词优化）| ✅ 推进，需要"读者视角"写法，不是常规 SEO 文章 |
| `best short drama apps` / `free short drama app` | 无 | ✅ 完整答完 | 匹配但摘要吃掉点击 | 🔴 不做 |
| `reelshort free coins` / mod apk 类 | 语义负面联想 | — | — | 🔴 排除，已验证盗版关联 |
| **🔴🔴 `[剧名] dailymotion` / 剧名+免费看不付费** | **语义负面联想（新增判据）** | — | — | 🔴 排除，无论挂在哪部剧下都一律排除 |
| `werewolf romance books` 等纯题材 SEO 文章 | 无 | 未测 | 意图错配（正面写打不进去）| 🔴 不做常规写法，✅ 改用 2.6 节"读者视角桥接"写法 |

---

## 六、最终执行清单（供 blog 排期用）

| 优先级 | 内容 | 覆盖关键词数 | 累计月搜 | 状态 |
|---|---|---:|---:|---|
| 🔴 P0 | 短剧 App 安全指南（is ReelShort/DramaBox/GoodShort/ShortMax/NetShort/FlickReels safe）| 11+ | 1,100+ | ✅ **已成稿** `00-inbox/2026-08-20-dramashortstv-blog-短剧App安全指南.md` |
| 🔴 P0-新增 | 建立"具体剧名"滚动选题流程（不是单篇内容，是个流程）| 滚动 | 单剧最高 20,000+ | 待建立，见 4.2 |
| P1 | DramaBox vs ReelShort 对比测评 | 3–4 | 400+ | 待写 |
| P1 | ReelShort 必看剧单（接裸品牌词）| 2 | 41,000+（长期）| 待写 |
| P1 | DramaBox 必看剧单（接裸品牌词）| 2 | 58,000+（长期）| 待写 |
| P1-新增 | "我看了 N 集短剧"读者视角桥接内容（fanficable 模式，接书圈流量）| 视选题而定 | 单篇可覆盖十余词 | 待写，需要先确定"我们的读者人设"是谁 |
| P2 | DramaBox App 档案页（review/price/legit/what is/订阅退订）| 8+ | 2,000+ | 待写 |
| P2 | BL 短剧 App 推荐 | 2 | 70 | 待写 |
| P2-新增 | 短剧演员档案页（批量型）| 滚动，单个 40–390 | 滚动 | 待建立选题流程 |
| P3 | 具体热门剧集测评（并入 P0-新增的滚动流程）| 滚动 | 滚动 | 待建立 |

---

## 七、方法说明

| 项 | 来源 |
|---|---|
| 竞品自然排名全量数据 | Semrush 美国库「自然排名」，2026-08-20，逐域名导出，共查 8 个域名（含 reelshort.com 官网）|
| 竞争对手图谱 | Semrush「竞争对手」标签页，用 reelpulse.net 做种子域名系统性找同赛道站，而非依赖手动 SERP 偶遇 |
| 四桶分级规则 | `docs/03-marketing/03-seo/keyword-research-sop.md` §二 |
| 四问/否决复核 | `02-keyword-research/2026-08-11-选词规则-v1.md` |

**v2 相比 v1 的核心改进**：v1 只用了 reelpulse.net 一个来源做关键词映射，且完全遗漏了 reelshort.com 自己的域名数据——这是用户指出的问题，也是本次修订的直接起因。v2 用 Semrush 竞争对手图谱系统性扩展到 8 个域名，新增了裸品牌词交叉验证、具体剧名（本次最大发现）、剧名+dailymotion 盗版模式、演员档案、书圈桥接四类此前完全没有的内容，同时纠正了两个假竞品判断（dramabox.org 域名撞名、shorts-drama.com 疑似侵权聚合站）。

**未覆盖**：来源 2（内容缺口分析，可以用 reelpulse.net + fanficable.com 两个真竞品做 Keyword Gap 交叉比对，下一轮可做）、来源 5（Google Trends，具体剧名类内容尤其需要，见 4.2）、来源 6（Social Probe，Track B 未启动，按 SOP 跳过）。
