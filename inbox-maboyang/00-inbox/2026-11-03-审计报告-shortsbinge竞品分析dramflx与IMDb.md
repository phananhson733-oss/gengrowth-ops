---
title: 审计报告 · shortsbinge.com 竞品分析（dramflx.com / imdb.com）
date: 2026-11-03
status: 结论已验证，建议并入阶段2试点
scope: 判断dramflx.com、imdb.com是否为竞品，从关键词/网站结构/网站设计/页面结构四个角度拆解可借鉴之处
---

# 审计报告 · shortsbinge.com 竞品分析（dramflx.com / imdb.com）

## 一句话结论

imdb.com不是竞品，是另一个物种（DR 94、月访问6.02亿、30年历史的影视数据库），只在"剧名+cast"这类词上形成障碍，不是主战场。dramflx.com是真实的直接竞品——同一批剧名、同一批词族、同一种"一剧一页"的页面形态，但流量规模很小（月访问约2.8万，99部剧），且高度依赖单个关键词。真正占住我们目标词位置的不是这两家，是Dailymotion、YouTube、Facebook这类UGC视频平台。dramflx唯一值得照抄的是页面结构（Title/H1分工、Quick Facts结构化表格、Article schema），其商业模式（无播放器、纯导购外链）不该学——我们有播放器，这是唯一的结构性优势。

---

## 一、竞品判断

| 维度              |              dramflx.com |       imdb.com |              shortsbinge.com |
| --------------- | -----------------------: | -------------: | ---------------------------: |
| DR（域名权重）        |                      0.9 |             94 |                            6 |
| 月访问（SimilarWeb） |                   28,015 |          6.02亿 |                            — |
| 注册时间            |         2026-07-27（0.3年） | 1996-01（30.8年） |                            — |
| URL总数/剧数        |                114 / 99部 |              — |             87,001 / 42,341部 |
| 页面形态            | `/drama/<slug>/` 一剧一页厚文章 |  `/title/tt…/` | `/drama/<slug>/` + episode/1 |

**imdb.com不是竞品**：不播剧、不做短剧聚合，只在"剧名+cast"这类词上截胡——实测两个cast词（`fated to my forbidden alpha cast`、`american sniper the last round cast`），IMDb都占据第1位，第一页还被ReelShort官方fandom、Fandom wiki、ScreenRant、crazymaplestudios.com（我们视频内容的上游供应商自己在做演员页）三层占满，这类词不是能打的空间，建议直接放弃，cast信息只做剧页内的一个模块，不单独做页。

**dramflx.com是直接竞品**：42个排名词全部落在`/drama/<slug>/`，词串是"剧名+all episodes/where to watch/part 2/cast/full episodes"——和我们的目标词完全重合，已确认同剧对撞（《My Sister Is the Warlord Queen》双方都有）。但它是弱对手：42词里0个进前3、仅2个进4~10位，流量全靠一个头部词（"the betrayed wolfless is the lycan king"，估月搜18,600，占其月访问32.2%）撑起来，一个月前该词流量还只有280——这种单词集中度和shortsbinge 10/28断崖是同一类风险的不同规模版本，提醒我们结构调整做对之后不要重蹈覆辙。

**真正占位的是UGC视频平台**：实测"my sister is the warlord queen where to watch"这个词，前9名全部是Dailymotion/YouTube/Facebook，IMDb和dramflx都不在内（dramflx实际排44位）。这是好消息：主战场对手是盗版上传视频，这类页面只有播放器没有文字信息，正是我们能赢的地方。

---

## 二、关键词角度

dramflx 42个排名词可归纳成7个词族，每个词族对应剧页上的一个具体模块：

| 词族 | 词数 | 对应剧页模块 |
|---|---:|---|
| full episodes / movie / video | 12 | 集数与免费集数信息 |
| cast（演员表） | 8 | Quick Facts里的演员行 |
| 平台名（dailymotion/netflix/reelshort/youtube） | 7 | 播放平台字段 |
| where to watch | 4 | 在哪看模块 |
| 纯剧名/系列 | 5 | H1与正文 |
| 续集序号（part 2/#2） | 3 | 续作与分季提示 |
| 疑问句（what is…on/free） | 2 | FAQ |

**要点**：42个长尾词搜索量都很小（20~110，最大1,000），真正带来流量的是1个没进这份快照表的头部剧名词。这验证了一个判断：堆长尾词模块不如先保证剧名本身能排进前几名——这和泰语试点剧（排名证据3个词变体4.6~8.4名）的逻辑一致。

**可抄的是模块-词族对应关系**：Title打"Full Episodes"族词，H1打"Cast, story & where to watch"族词，各自承接不同意图，不要两个位置都重复堆剧名（这正是当前剧页的问题）。

---

## 三、网站结构角度

| 项 | dramflx | shortsbinge |
|---|---|---|
| URL总数/剧数 | 114 / 99部 | 87,001 / 42,341部 |
| 每部剧URL数 | 1 | 2（剧主页+episode/1） |
| URL slug | 干净可读：`my-sister-is-the-warlord-queen-short-drama` | 带12位随机哈希：`-5bh6n65wqzuh` |
| AI爬虫策略 | `Content-Signal: search=yes,ai-train=no,use=reference`，屏蔽约30个训练爬虫 | 屏蔽GPTBot/ClaudeBot/CCBot/Bytespider/meta-externalagent，额外放行OAI-SearchBot/PerplexityBot/Claude-SearchBot/Amzn-SearchBot |

**AI爬虫策略我们已经做对，不用改**：比dramflx更宽松（额外放行AI搜索引荐类爬虫），这是短剧站该有的取舍——拒训练、接引荐，和11/2-11/3验证过的"品牌导航型问法在Perplexity/ChatGPT上都有效"这条线互相印证。

**URL slug不建议现在改**：改URL结构是纯风险动作，但5部试点剧如果要重建页面，可以考虑用干净slug（不丢弃现有带哈希的URL，只是新建时优先选可读形式）。

**顺手可清理项**：robots.txt的`Crawl-delay: 10`谷歌不读，但Bing/Yandex会照做，等于主动放慢非谷歌渠道的抓取速度，这条和断崖无关，是独立的清理项，优先级低。

---

## 四、网站设计角度

dramflx的设计取向：深色主视觉+大海报+玻璃卡片+评分星标+"加入片单"按钮，卡片正文只放完整标题和**时长**（不是集数）——因为要承接"full movie"类词，搜索者脑子里的单位是"一部片子多久"，不是"多少集"。性能上刻意优化首屏：hero图preload+fetchpriority=high，懒加载+noscript兜底。

**对我们的直接启示**：试点计划把播放器放首屏，会拖慢首屏最大内容绘制（LCP）。建议执行时：首屏只preload海报图，播放器脚本等用户点击后再加载，不要让iframe一开始就抢带宽。

**本质区别**：dramflx的播放按钮、评分组件都是"伪流媒体外观"，点击实际跳转到reelshort.com（外链还带`utm_source=chatgpt.com`，说明他们在追踪AI引荐流量，这个做法值得借鉴一半——给`/api/go/<id>/`的跳转也加来源标记，才能看清搜索/TikTok/AI引荐各占多少，但**播放器本身绝不能学他们往外送**，这是我们相对UGC平台和dramflx唯一的结构优势。

---

## 五、页面结构角度（最值得照抄的部分）

逐屏实测dramflx剧页（`/drama/my-sister-is-the-warlord-queen-short-drama/`），对照结果：

| 屏位 | dramflx有什么 | shortsbinge现状 |
|---|---|---|
| Title | "剧名 – Short Drama Full Episodes"（已验证，精确匹配） | 打集数词族，和H1重复 |
| H1 | "剧名 – Cast, story &where to watch."（已验证存在拼写bug："&where"缺空格） | 只有剧名 |
| 首屏 | 海报+一行元信息（国家/时长/类型/平台chip）+评分+摘要+主按钮 | 文字简介+50集链接 |
| 正文 | Overview→剧名重复H2→**Quick Facts 9行表格**（已验证存在） | 3,251字符，独有约40词，简介重复3次 |
| 结构化数据 | Article（headline/keywords/dates/author/publisher，已验证存在） | 无Article，VideoObject待上 |
| 信任信号 | 作者署名+发布日+更新日（已验证：datePublished 2026-08-28，dateModified 2026-10-16） | 无 |
| 播放器 | **无**（已验证：curl检测不到video/iframe标签） | 有——这是我们唯一的结构优势 |

**最该搬的是Quick Facts表**：把"集数/上线日/状态/类型/国家/语言/平台"压成结构化表格，正好承接上面7个词族里的5个，比写成散文占用字符更少、信息密度更高。

**Article schema是我们真缺的一块**，和计划中的VideoObject不冲突，同一页可以两者都有。

**三处明显粗糙，不要学**：
1. 作者schema直接填`dramflx@gmail.com`当作者名（已验证存在）
2. H1里"&where"缺空格（已验证存在）
3. 首页H1用某一部具体剧的标题（已验证：实测首页H1是"He Chose His Mistress, I Chose Revenge: Story, Review, and Where to Watch"，首页在和剧页抢同一个剧名词）——我们如果给首页加H1，必须用站级描述，不能用某部剧的标题。

---

## 六、建议（按优先级，并入已有的5部试点计划，不是另开新任务）

1. **5部试点剧的正文骨架加一项**：在已定的Overview/Quick Facts/剧情/角色/看点/适合谁/在哪看/FAQ基础上，Quick Facts做成结构化表格（集数/12集免费/平台/上线日/状态/类型/语言/主演），不是散文。
2. **Title与H1重新分工**：Title ≤60字符，打"剧名 – Full Episodes & Where to Watch"；H1只写剧名加一句概括，两处不堆同一串词。顺手把攻略页里超120字符的Title也改短（这条和之前的攻略页修复任务是同一件事，合并处理）。
3. **补Article结构化数据**：含dateModified、author（真实姓名/团队名，不要犯dramflx的邮箱当作者名这个错）、headline，和VideoObject一起在5部试点剧上线。
4. **cast词不做独立页**：已验证前5位被IMDb+平台官方+内容工厂锁死，只在Quick Facts里放演员表模块即可，不单独开页。
5. **主攻词串明确为"剧名+where to watch/all episodes/full episodes"**：这是SERP实测里对手最弱的位置（UGC视频平台只有播放器没有文字答案），也是唯一只有我们能给出"可以直接看12集"这个答案的意图。
6. **首屏性能**：播放器放首屏前，先给海报图加preload+fetchpriority=high，播放器脚本改成用户点击后再加载，避免拖慢LCP。
7. **转化链接加来源标记**：`/api/go/<id>/`跳转加utm参数，用来拆分搜索/TikTok/AI引荐各自贡献多少，这个和已经修复的GA4 UTM归因问题是同一条线。
8. **建立低成本竞品监控**：固定盯4个站——dramflx（sitemap公开，99部剧，监控成本低）、verticaldramaofficial、screenrant、Plex+TMDB，每周抓一次dramflx sitemap看新增剧目和排名变化。

---

## 七、不要做的

- 不对标IMDb，不做条目库思路的页面
- 不改现有URL结构（新建试点页可以用干净slug，老页不动）
- 不新增分类维度、不新增语言
- 不用"时长"替代"集数"——12集免费是我们的卖点，两个信息都保留，不是二选一
- 不把SERP精确位次表当成固定基线（见下节说明）

---

## 附：关于SERP位次数据的使用说明

11/3对"my sister is the warlord queen where to watch"这一词做过两次独立实测：第一次（哥飞）与第二次（本人直接脚本抓取Google结果页）相隔约几小时，前5位结果完全一致（Dailymotion/YouTube/Facebook/YouTube/Dailymotion），但第6-10位两次结果的具体平台不同（哥飞记录为TikTok/YouTube/Plex/Dailymotion/Instagram，本人实测为YouTube/Dailymotion/YouTube/Facebook，且第二次搜索只返回9条结果）。

这类低竞争词的SERP在短时间内确实会波动（搜索时间、地域、个性化都有影响），**前5位这种相对稳定的头部位置可以参考，但第6名之后的精确排名不建议当作固定竞品监控基线**。真正该固化、持续追踪的是方向性结论——"UGC视频平台占据这类词的主要位置，IMDb/dramflx/shortsbinge都不在内"——而不是某个具体位次。
