---
title: dramashortstv.com 选词验证（合并版）
date: 2026-08-26
说明: 合并自四份文档——「选词-drama-shorts词根.md」「选词-入口拓展.md」「选词-SOP四桶分级.md」「分类页题材词验证.md」（原四份 2026-08-20~24 完成，本次合并去重、保留结论和证据链，四份原文已删除）。配套文件：关键词数据表见 02-keyword-research/2026-08-20-dramashortstv-关键词清单-40个.md；演员人选与生产计划见 00-inbox/2026-08-24-dramashortstv-演员图鉴生产清单.md
方法依据: docs/03-marketing/03-seo/keyword-research-sop.md（六源挖掘→四桶分级）+ 02-keyword-research/2026-08-11-选词规则-v1.md（四问硬规则，选词唯一依据）
数据: Semrush 美国库（sem.3ue.com）+ 真实 Google 实测（`hl=en&gl=us&pws=0`），2026-08-20 ~ 2026-08-25 陆续验证
---

# dramashortstv.com 选词验证

> 本文档记录**怎么验证的、为什么这么判断**。要看最终能执行的关键词表，去关键词清单-40个.md；要看演员内容具体写谁，去演员图鉴生产清单.md。

---

## 一、词根：不变

`drama shorts` 仍是词根——域名选型阶段已验证：美国 3,600/月，KD 32，美英澳加占全球量 75%。本次调研没有推翻这个判断，是在这个词根基础上往外找可执行的内容方向。

---

## 二、竞品选择：查了 8 个域名，2 个真同赛道竞品 + 1 个头部品牌 + 5 个假竞品/风险站

按 SOP 零节"新站（DR<20）"路径，先在弱 SERP 里找同类站，不直接选品类大站：

| 域名 | 真实身份 | 判断 |
|---|---|---|
| **reelshort.com** | 头部品牌官网，38,000个自然排名词，美国月流量10.7万 | ✅ 真竞品但DR差距过大，只做话题发现（步骤A），不做关键词直接映射 |
| filmustage.com | 电影制作SaaS工具站，"短剧App对比"只是它4,297个词里的1篇 | ❌ 假竞品，高DR泛站 |
| magiclight.ai | AI视频生成工具站，同上 | ❌ 假竞品 |
| dodofanz.com | OnlyFans克隆App开发服务商 | ❌ 假竞品 |
| oyelabs.com | App开发外包公司 | ❌ 假竞品 |
| **dramabox.org** | ⚠️和短剧完全无关的老牌社区剧团网站，域名字面撞上"dramabox"品牌名 | ❌ 假竞品，但证明了裸品牌词SERP弱到连毫不相关的老站靠撞名都能排第7 |
| ⚠️shorts-drama.com | 未授权短剧流媒体聚合站，主打"不用付费看reelshort" | ❌ 不是内容来源，是品牌风险案例——证实"for free/without paying"修饰词背后确实有灰色/侵权站点 |
| **reelpulse.net** | 短剧垂类内容站，66个自然排名词全部短剧相关 | ✅ 真竞品 |
| **fanficable.com** | Wattpad/同人文垂类站，同时覆盖同人文写作+短剧App测评 | ✅ 真竞品，本次最重要的新发现之一 |

**教训**：SERP里出现的"新站/小站"不代表是同赛道竞品——可能是别行业高DR站顺手写的一篇，也可能是域名撞名的无关老站，还可能是打着内容站幌子的灰色聚合站。**每个候选竞品都要点开看它到底在卖什么**，不能只看关键词重合度。

---

## 三、已验证可执行的内容方向

### 3.1 对比型词（X vs Y）——SERP最开放

`dramabox vs reelshort`（70/月，KD 35-49，两次查询有差异）：AI摘要只给品牌定位概览，未给结论（🟡可做档）。真实SERP前十里大量新站/小站：filmustage.com（2018注册但月访仅6.3万）、dodofanz.com（2026-05注册，月访0）、oyelabs.com（3.3万月访）、lens.streaming-radar.com（2025-05注册，月访0）、reelpulse.net（2026-03注册，5天前刚发一篇同款对比）。四问里第一、二、三问都命中，第四问无AI摘要完整答完。**这是本次调研SERP最开放的一类词。** 已写成稿，见05-blog/dramashortstv/。

对照词 `best short drama apps`（170-210/月，KD45-46）：AI摘要完整答完，不建议正面写，仅作内链目标词。

### 3.2 竞品信任类词（is X legit / X reviews）——SERP开放，但是业务决策不是纯SEO判断

`is reelshort legit`（170/月，KD24）：无AI摘要（"是不是骗局"类问题Google目前不太用AI摘要下结论），个人作品集网站（haleighdixon.com，2021注册，月访2,560）能排进第7位。前十主体是Trustpilot、App Store评论区、Reddit、Quora——真实供给方是"用户投诉和评分"，不是"竞品测评文章"。

**决定：纳入内容计划，但定两条框**：
1. 走平衡测评框架，不走攻击框架——参照排第7那篇"Is ReelShort Worth It?"的调子，讲真实体验/价格/优缺点
2. 要留退路——dramashortstv.com 如果也走coin付费解锁模式，"is dramashortstv legit"这个问题迟早出现在自己头上，现在写的测评要经得起对称检验，不能用双重标准

### 3.3 具体剧名——🔴🔴 这个垂类里单一体量最大的关键词类型

查reelshort.com官网自己的排名数据（380页，38,000个词）发现的最大意外：

| 剧名 | 相关搜索月搜（美国，累计） | 代表词 |
|---|---:|---|
| American Sniper: The Last Round | 约20,000+（基础词1.9K+十几个变体各百至千）| `american sniper the last round`站内排第1 |
| How to Tame a Silver Fox | 8,100 | 剧名本身 |
| How to Dump a Hockey Star | 2,400 | 剧名本身 |
| You Fired a Tech Genius | 260 | `you fire a tech genius full movie` |

American Sniper一部剧的搜索量是整个`drama shorts`词根（3,600）的5倍以上。380页数据里绝大多数流量来源是具体剧名+修饰词（full episode/full video/streaming/cast），不是品类词、题材词或App通用词。KD普遍偏低（20-35，因为竞争位大多也是reelshort自己的多语言版本页或fandom页，不是外部强站）。

**这条推翻了"具体剧名内容只是理论存在的补充选题池"这个此前的保守判断**——它可能是这个垂类里单一体量最大的类型，超过其他已验证类别之和。**但不受标准KD/月搜阈值约束，需要建立滚动选题流程**（每周查一次哪些剧名搜索量在涨），不适合放进一次性关键词表格。🔴 **不要先写American Sniper/Silver Fox这两个已经过气的代表词，先用Google Trends筛出当下真正在涨的2-3部剧再写**——这条排期靠后，方法先行。

### 3.4 🔴🔴 必须排除的模式："[剧名] + dailymotion"——盗版意图

```
american sniper the last round dailymotion    170/月
the virgin and the professor dailymotion       110/月
ice cold regret dailymotion                     90/月
santa sent me a billionaire husband dailymotion  70/月
```

"[剧名]+dailymotion"意图是找Dailymotion上的免费未授权版本。和"free coins"/"mod apk"是同一类风险，必须在选题阶段过滤，不能因为"是剧名词"就默认安全。**规则：具体剧名本身安全值得做；但剧名+dailymotion/剧名+free full episode/剧名+without paying这类修饰词组合，无论挂在哪部剧下，一律排除。**

同理，`reelshort free coins` 实测第2位就是一个2026-04才注册的破解版APK下载站（`reelshortmodapks.com`）——这不是理论风险，是真实排在第一页的盗版站。"free coins"、"mod apk"、"unlimited coins"这几个修饰词，只要出现在候选词里直接排除，不用走四问流程，这条判据比SERP检查更前置。

### 3.5 演员/角色档案页——批量生产型，成本低

短剧演员的个人资料/身世类查询是独立存在且有真实量的子类，制作成本低（整理公开资料即可，不需要看完剧）。**具体人选、优先级、生产状态见 `00-inbox/2026-08-24-dramashortstv-演员图鉴生产清单.md`（已合并三个来源：Semrush直查6人、关键词清单F组4人、reelshort.com页面流量21+人），本文档不重复维护人选列表。**

### 3.6 书圈桥接内容——fanficable.com验证了这条路真实可行

上一版曾判断"题材词的量在书圈，短剧内容截不到"，这个判断本身没错，但漏了一种能截到量的打法——fanficable.com已经在做：

| 文章 | 覆盖关键词（部分）| 排名 |
|---|---|---|
| "I Watched Over 1,200 Episodes of ReelShort Dramas — Here's My Picks" | `best reelshorts`(30/月)、`best reel short`(40/月)等十余个 | 两个词均排第1 |
| "DramaBox Reviews: Best and Worst Dramas" | `is dramabox safe to use`(40/月)等 | 多数进前10 |
| "Best Vertical Drama Actors: ReelShort, DramaBox" | `top vertical actors`(40/月) | 前10 |

**机制**：不是"写一篇关于werewolf romance的SEO文章去正面抢词根"，是**站在读者（书粉/同人文爱好者）视角写"我作为一个读者追了这些短剧"**——第一人称体验分享型内容，天然同时被"找书"和"找剧"两种意图接住。**这条修正了题材词的判断：不是"打不进去"，是"正面写SEO文章打不进去，但站在读者视角写体验分享能打进去"。** 需要先确定"我们的读者人设是谁"才能执行，这一步还没做。

BL细分（`best bl short drama apps`30/月、`best apps to watch bl drama for free`40/月，reelpulse.net已验证）也归入这条打法。

### 3.7 App档案/客服类词——独立的信息空白

`what is dramabox`(880/月)、`dramabox review`(320/月)、`is drama box legit`(210/月)、`dramabox subscription`(590/月)、`who owns dramabox`(110/月)等，App的订阅/退订/客服信息是独立且有量的子簇，reelshort.com官网自己搜索客服相关词都重定向到通用搜索页——**说明官网自己都没做落地页，是内容空白**。已写成DramaBox档案页草稿，见05-blog/dramashortstv/。

---

## 四、题材/分类词——两轮调研，最终结论

这是本次调研里判断反复最多的一类词，完整过程记录如下（先看结论，过程作为方法论参照）。

### 4.1 最终结论

**题材分类词基本没有独立获客能力，不管用"drama"还是"movies"当容器词都一样——例外只有两个，而且两个例外的成因是同一件事：这个题材本身在短剧之外的媒介（K-drama/泰剧、romance小说）里已经是成熟的搜索习惯，短剧只是"借船出海"。**

- 容器词用"drama"：只有 **BL** 例外（K-drama/泰剧圈自带的搜索习惯）
- 容器词用"movies"：累计核查10个词（billionaire、mafia、enemies to lovers、prison、steamy、romance、werewolf、historical、revenge、dragon），只有 **billionaire** 例外，其余9个全部被IMDb/Netflix/Reddit/Wikipedia/Rotten Tomatoes等主流影视站或对应真实电影类型完全占满

**默认结论：分类页题材词没有独立获客能力，除非这个题材能证明自己也是某个外部媒介的成熟搜索习惯（像BL、billionaire那样），否则不用再逐词查。** 分类页的价值回到"产品导航和内链结构"。

### 4.2 第一轮（8/20，容器词用"drama"）

直接查"[题材] drama"/"[题材] short drama"：billionaire、mafia、historical、reverse harem全部无数据。换词查`mafia boss short drama`发现有量（9,462个词，53.6万总搜索量），但拆开看全部来自具体剧名（`the mafia boss`2,400/月等），不是"黑帮题材"本身有人搜。

**当时的初判是"题材词完全没有搜索量"，这个判断后来被推翻——不是没有需求，是查询方式错了**，见4.3和4.4。

同一批用BL验证过有效的"where to watch [题材] drama"/"best apps to watch [题材] drama for free"句式，在billionaire/mafia/werewolf/revenge上重测过一次，9/10词搜索量仍"不可用"——证明问题不是句式，是"drama"这个容器词。

BL为什么是例外：K-drama/泰剧圈"where to watch BL"这类搜法早于短剧行业存在，短剧只是承接了已存在的搜索行为。

### 4.3 中间发现：题材词的量其实在书圈

用ReelShort真实标签体系（Werewolf/Billionaire/Mafia/Second Chance/Playing Dumb/Royalty/Reborn/Reverse Harem等）去查，而不是自己拼词，发现`werewolf romance books`美国月搜8,100，量很大——**之前是漏查了**。但真实SERP前十（Reddit书籍推荐版/Goodreads/Amazon/Barnes & Noble/Audible/读书博客）没有一个短剧内容，`werewolf short drama`（题材词+短剧包装）依然零搜索量。

**结论：题材词本身量很大，但目前是两个互相不触达的受众——搜书的人和看短剧的人的Google排名结果精确分离。用短剧内容正面抢这个词会撞上意图错配。** 这条走通的路径不是SEO正面文章，是3.6节的"读者视角桥接"。

### 4.4 第二轮（8/23，容器词换成"movies"）——推翻"没有量"，发现真正问题是容器词选错

起因：用户质疑"按理来说会有人搜XX类型的剧集，为什么查不到"，倒查发现方法论问题：查Semrush Organic Research里reelshort.com自己1,009个`/tags/`页面的真实排名词，发现这些页面确实有自然流量，但排的关键词大多是"[题材] movies/movie/film"，不是"drama"——例如`billionaire-movies`页面（31次/月流量）主排词是`billionaire movies`，`werewolf-movies`页面主排词是`werewolf short film`。

换容器词后批量重测（54个词，两轮各30、24个），26+22个词查到真实量，量比预期大得多（部分节选）：

| 题材词 | 月搜索量 |
|---|---:|
| romance movies | 74,000 |
| lesbian movies | 49,500 |
| erotic movies | 33,100 |
| mafia movies / werewolf movies / fantasy movies | 各14,800 |
| historical movies | 9,900 |
| prison movies | 9,900 |
| enemies to lovers movies | 8,100 |
| revenge movies | 6,600 |
| dragon movies | 5,400 |
| steamy movies | 3,600 |
| billionaire movies | 390 |

### 4.5 真实SERP核查：量大不等于能抢到，10个词命中率1/10

逐词查真实Google结果，只有**billionaire movies**（390/月）第一页第4位是`reelshort.com/movie-identities`（"Billionaire Movie List"），跟IMDb、TMDB混排——IMDb自己"Top Billionaire Romance Movies"榜单里收录了`Billionaire Lost Sweet Pregnant Wife`这种典型短剧剧名，说明这个词的主流搜索意图本身混着romance/短剧内容。

其余9个（mafia、enemies to lovers、prison、steamy、romance、werewolf、historical、revenge、dragon）全部被IMDb/Netflix/Reddit/Wikipedia/Rotten Tomatoes等主流站或对应真实电影类型（战争片、恐怖片、动作复仇片、家庭动画）完全占满，短剧内容一个都挤不进第一页。样本覆盖黑帮/犯罪、经典爱情trope、监狱、情色、通用爱情、恐怖、历史战争、动作复仇、奇幻动画共9种不同类型的主流意图，不是巧合。

**分类页命名怎么定**：URL slug用产品真实标签体系（跟reelshort.com一致），但`<title>`/H1对齐"[标签] Movie List"这类真实排名措辞——两者不冲突，唯一值得这么做的是billionaire。其余标签正常写产品标签体系即可，不用刻意堆"movies"去博一个大概率抢不到的流量。

---

## 五、已排除的内容方向

| 方向 | 排除原因 |
|---|---|
| `reelshort alternative`类替代型词 | Semrush查不到任何搜索量——消费级App用户不用"alternative"搜索，这是SaaS/工具类用户的搜索习惯，不能照搬 |
| `best/free short drama apps`头部词 | AI摘要全部完整答完（含ReelShort/DramaBox/GoodShort/ShortMax对比），`free short drama app`甚至主动建议"去其他平台搜完整上传版"，方向本身也不安全 |
| `reelshort free coins`/mod apk类 | 真实盗版关联，第2位就是破解版APK下载站 |
| `[剧名]+dailymotion`/剧名+免费看不付费 | 同上风险，见3.4 |
| 选角/试镜类关键词（`reelshort auditions`等5词）| 受众定位确认为短剧观众后排除——搜这些词的是想入行的普通人，不是短剧观众 |
| 行业/商业角度（`reelshort revenue`等）| 同上，面向想了解行业的人不是短剧观众。`how much do actors get paid for reelshort`（590/月）不受影响，仍保留——这是观众追星式好奇心，不是行业研究 |
| 纯题材SEO正面文章（werewolf romance books等）| 见第四节，意图错配，改用读者视角桥接写法 |

---

## 六、方法说明与未覆盖项

| 项 | 来源 |
|---|---|
| 竞品自然排名全量数据 | Semrush美国库「自然排名」，逐域名导出，共查8个域名 |
| 竞争对手图谱 | Semrush「竞争对手」标签页，用reelpulse.net做种子域名系统性找同赛道站 |
| SERP结构、AI摘要状态、域名注册时间、月访 | 真实Google实测（`hl=en&gl=us&pws=0`），逐词核对，不用任何搜索工具代替（选词规则v1.2硬规定） |
| 四桶分级规则 | docs/03-marketing/03-seo/keyword-research-sop.md §二 |
| 四问/否决复核 | 02-keyword-research/2026-08-11-选词规则-v1.md |
| 题材标签体系 | reelshort.com官网首页 + Organic Research页面数据实抓 |

**未覆盖**：来源2（内容缺口分析，Keyword Gap只跑了reelpulse.net×fanficable.com一组，dramabox.org因非真竞品未纳入）、来源5（Google Trends，具体剧名类内容尤其需要，见3.3）、来源6（Social Probe，Track B未启动，按SOP跳过）；Semrush关键词库里`Chinese Drama Actresses`、`Gay Porn Short Films`、`Dailymotion`系列等明显偏离垂类或有品牌安全风险的话题簇，未纳入候选。

**执行排期**：见关键词清单-40个.md末尾"排期建议"表，不在本文档重复维护。
