---
title: gengrowth.ai P0六工具 + 主页 —— 404词Ahrefs实测 + 8词SERP实测结论与最终选词
date: 2026-07-30
status: 2026-07-31 已完成SERP实测。六个工具主词中五个定稿、P0-5已换词；两个集群页主词需重选
数据来源（三批合计333词，均为Ahrefs google_us，2026-07-30导出）:
  - 第一批194词: Downloads/google_us_affordable-keyword-researc_overview_2026-07-30_02-00-15.csv
  - 第二批90词（社媒挖掘）: Downloads/google_us_alternatives-to-semrush-av_overview_2026-07-30_02-31-40.csv
  - 第三批39词（发现型语义）: Downloads/google_us_ai-search-keywords-chatgpt_overview_2026-07-30_03-23-06.csv
候选来源:
  - 02-keyword-research/2026-07-30-gengrowth-p0工具-待查证候选词批次.csv
  - 02-keyword-research/2026-07-30-gengrowth-社媒挖掘-第二批候选词.csv
  - 02-keyword-research/2026-07-30-gengrowth-第三批候选词-发现型语义.csv
前提: gengrowth.ai 当前 DR=0
---

# 333词实测结论与最终选词

## 一、先说三个推翻既有判断的结果

### 1.1 我上一批★"DR=0友好"候选，几乎全是零量——推导出来的词不算词

我按"用户心智语言""竞品规避""零门槛差异化"三种逻辑生成了53个标★候选，实测结果：

| 我的假设 | 代表词 | 实测 |
|---|---|---|
| 用户不说黑话，说白话症状 | impressions but no clicks / page 2 keywords / pages with no internal links / traffic dropped but rankings same / clicks dropped impressions same | **全部 0** |
| 躲注册墙的人会搜"免注册" | seo audit no sign up / free seo tools no signup / keyword research tool without login | **全部 0** |
| Reddit原话是真实用户语言 | orphan pages without screaming frog | **0** |
| AIO是新兴热点 | ai overview traffic loss / traffic loss from ai overviews / did ai overviews cause my traffic drop | **全部 0** |
| 从URL出发是我们的差异化 | keyword ideas from website / find keywords from website url / keyword suggestions from url | **全部 0** |

**这是七轮查证第2轮同一个错误的重演**（"GSC quick wins finder — 内部造词，不是真实搜索行为"）。教训需要固化：**Reddit里用户怎么抱怨、产品有什么差异化、逻辑上该怎么搜，都不能替代搜索量实测**。差异化机制可以写进落地页文案打动人，但不能当SEO主词。

**唯一幸存的症状词**：`high impressions low clicks`（70/KD0，且Parent＝自身）——这一个是真的。

### 1.2 11.2表的量级数据有系统性偏差，不能再直接引用

| 词 | 11.2表（2026-07-28人工单点） | Ahrefs实测（2026-07-30） | 差异 |
|---|---|---|---|
| seo audit | 约8,100 | **18,000 / KD85** | 量低估一倍多，且KD85是死路 |
| keyword research tool | 12,100 | **7,000 / KD94** | 量高估，KD94完全打不动 |
| keyword research tool free | 约9,900 | **2,100 / KD93** | 量高估近5倍 |
| website audit tool | 2,400 | 1,800 / KD84 | 接近 |
| topic cluster tool | 50 | **0** | — |
| internal link checker free | 标"补全10/10" | **0** | — |
| traffic drop after google update | 列为同页承接词 | **0** | — |
| orphan pages finder | 列为同页承接词 | **0** | — |
| internal link checker | seodata140 / google_us450 | **450 / KD10** ✅ | 一致 |
| best keyword clustering tool | 170 / CPC$42.70 | 250 / KD16 / CPC$5.00 | CPC差8倍 |

**建议**：11.2表的量级列整体标记为"待复核"，以本次Ahrefs导出为准。注：Ahrefs对月搜<10常显示0，上述"0"更可能是"太小"而非绝对无人搜，但都不足以支撑一个独立页面。

### 1.3 五个工具页的原定主词，四个是KD 80+的死路

| 页面 | 原定主词 | 实测 | 判决 |
|---|---|---|---|
| /tools/seo-audit | seo audit | 18,000 / **KD85** | ❌ DR=0打不动 |
| /tools/keyword-research-tool | keyword research tool | 7,000 / **KD94** | ❌ 全表最难 |
| /tools/topic-cluster-tool | topic cluster tool | **0** | ❌ 词不存在 |
| /tools/traffic-drop-diagnosis | why is my website traffic dropping | 30 / KD4，Parent≠自身 | ⚠️ 量太小且被大主题吸收 |
| /tools/internal-link-checker | internal link checker | 450 / KD10 / **Parent＝自身** | ✅ **唯一原定主词就成立的** |

---

## 二、DR=0 的筛选标准：Parent Keyword 比 KD 更重要

Ahrefs的 `Parent Keyword` 列含义：这个词的流量实际归属哪个主题。

- **Parent＝关键词自身** → Google认为它是个独立主题，一个专门页面可以拿下
- **Parent≠关键词自身** → 它的流量实际被一个更大的主题页吃掉，你单独做页面很难拿到

对 DR=0 的站，这比 KD 更决定成败。194词里 **Parent＝自身的只有17个**，这17个是全部真实机会。

**全部17个（按KD升序）**：

| 关键词 | Vol | KD | CPC | 归属页面 | AIO |
|---|---|---|---|---|---|
| high impressions low clicks | 70 | 0 | — | P0-1 | 无 |
| keyword cannibalization checker | 300 | 1 | $3.50 | P0-5b（新入口） | 无 |
| sudden drop in organic traffic | 200 | 2 | — | P0-3 | 无 |
| why is my organic traffic down | 20 | 2 | — | P0-3 | 无 |
| semantic keyword clustering | 250 | 3 | — | P0-5b | 无 |
| topical authority map | 250 | 4 | $1.30 | P0-5c | 无 |
| **internal link audit** | **700** | **5** | **$4.00** | **P0-2a** | 无 |
| **topical map seo** | **400** | **5** | **$2.00** | **P0-5c** | 无 |
| seo tools for small business | 350 | 6 | $6.00 | 主页 | 无 |
| find orphan pages | 150 | 6 | — | P0-2b | 无 |
| orphan pages seo | 450 | 10 | $0.50 | P0-2b | 无 |
| **internal link checker** | **450** | **10** | **$2.50** | **P0-2a** | 无 |
| keyword grouping tool | 200 | 12 | $6.00 | P0-5b | 无 |
| **keyword grouper** | **700** | **15** | **$3.50** | **P0-5b** | 无 |
| keyword clustering tool free | 40 | 17 | $4.00 | P0-5b | 无 |
| find low competition keywords | 800 | 26 | $2.00 | P0-5a | 无 |
| keyword clustering tool | 900 | 29 | $3.00 | P0-5b | 无 |

**17个词全部无AI Overview**——这是个好消息，意味着这批词的点击不会被AI摘要截走，AIO风险为零。

---

## 三之前 · 最终选词（2026-07-30 第二批实测后重写，按五个工具归拢）

> 本节为最终结论，取代下方"三"节按8个URL分配的旧版。团队已确认只按P0-1～P0-5五个工具选词，不按2a/2b、5a/5b/5c拆分。
> 数据：两批合并284词实测（Ahrefs google_us，2026-07-30），第二批90词中有量38个、零量52个。

### 五个工具的最终主词（2026-07-30 第三批实测后定稿）

> 累计实测三批共333词（194 + 90 + 39），全部Ahrefs google_us。

| 工具                      | 主词                               | Vol     | KD    | CPC   | 同页承接次要词                                                                                                                                  |
| ----------------------- | -------------------------------- | ------- | ----- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **P0-1** SEO Quick Wins | `high impressions low clicks`    | 70      | 0     | —     | google search console for beginners(60/KD0)、why is my organic traffic down(20/KD2)                                                       |
| **P0-2** 内链关系图+孤岛       | `internal link audit`            | **700** | **5** | $4.00 | internal link checker(450/KD10)、orphan pages seo(450/KD10)、find orphan pages(150/KD6)、how to find internal linking opportunities(30/KD0) |
| **P0-3** 流量下降诊断         | `sudden drop in organic traffic` | 200     | 2     | —     | organic traffic dropped(40/KD0)、why is my organic traffic down(20/KD2)、indexed but not ranking(10/KD0)                                   |
| **P0-4** 免费SEO审计        | **不设SEO主词**                      | —       | —     | —     | 团队已确认：主页转化入口，不承担获客。整个品类KD 76-94，无缝隙                                                                                                      |
| **P0-5** 关键词机会地图        | `find low competition keywords`（2026-07-31换词） | 800 | 26 | $2.00 | 原定 `hidden keywords seo` 经SERP实测为黑帽语义，已废弃。见下方语义簇 |
| **P0-6** GEO可见度快照        | `generative engine optimization tools` | **1,300** | **14** | $0.40 | generative engine optimization tool(900/KD25)、ai search optimization tool(150/KD24)、geo seo tool(250/KD41)、ai seo tools free(150/KD0) |

> **P0-6 于2026-07-31从二期提前到下周落地**，URL确认为 `/tools/generative-engine-optimization-tools`。选词说明见下方"P0-6选词"。

### SERP实测结果（2026-07-31，Google美国站逐词实查，含DR）

八个候选主词全部实测完毕。**结论：指标排序和SERP可打性排序几乎完全不一致。**

| 主词 | 归属 | Vol/KD | 前十DR实况 | 判决 |
|---|---|---|---|---|
| `high impressions low clicks` | P0-1 | 70/KD0 | **DR 1 排第4**（contentdecoded.com）、DR 21 第7、DR 56/57 各一；高DR位是Reddit(95)、Quora(92)、Google Help(99) | ✅ **全部八个词里最可打** |
| `sudden drop in organic traffic` | P0-3 | 200/KD2 | 第3名 seekmarketingpartners.com **DR 64、域名2024-12注册、月访问7.57K**；余为Reddit(95)、Google文档(99)、Conductor(83)、Seer(79)、Aira(69) | ✅ 可打，新站能进前三 |
| `find low competition keywords` | **P0-5新** | 800/KD26 | 前五中**三个是UGC**（Reddit 95、LinkedIn 99、Quora 92）；第8名 Productive Blogging **DR 63**；其余SpyFu(80)、Semrush(92)、WordStream(90)、Mangools(82) | ⚠️ 中等偏可打 |
| `internal link analysis` | 集群页 | 800/KD28 | 前七全是工具商 DR 75-92（seoClarity 76、SEO Review Tools 75、Semrush 92、SEOptimer 81、Siteimprove 81、DNS Checker 85、Screaming Frog 87）；第8名 webaloha.co **DR 64、域名2024-06注册** | ⚠️ 缝很窄 |
| `generative engine optimization tools` | P0-6 | 1,300/KD14 | **全部是横评listicle**；但域名都很新：Profound(DR79，2024-05注册)、evertune.ai(DR58，2023-11)、GitHub用户repo第7 | ⚠️ 产品页排不进，需写横评 |
| `internal link audit` | P0-2 | 700/KD5 | **前八 DR 76-99 无一例外**：Screaming Frog 87、LinkedIn 99、Reddit 95、Semrush 92、SEOptimer 81、Lucky Orange 78、Siteimprove 81、seoClarity 76 | ❌ KD5是假象 |
| `seo content strategy` | 集群页 | 3,500/KD12 | Google 99、Reddit 95、HubSpot 93、Semrush 92、Siteimprove 81，**最低 DR 59** | ❌ 最大品牌通吃 |
| `hidden keywords seo` | P0-5旧 | 250/KD0 | 全部关于**黑帽隐藏文本/cloaking** | ❌ 语义错配，废弃 |

#### 三条由SERP实测得出、推翻既有判断的结论

**1. P0-5 主词废弃并更换：`hidden keywords seo` → `find low competition keywords`（800/KD26）**

`hidden keywords seo` 在英语SEO语境中指"把关键词藏进HTML"这一黑帽手法（Crazy Egg《Hidden Keywords Are Back (and Still a Terrible Idea)》、Seobility"Hidden Content"词条、Reddit的cloaking讨论），与"发现未被发现的关键词"毫无关系。相关搜索还出现"hidden content on my phone / telegram"等更不相干的含义。

**指标250/KD0/Parent＝自身三项全优，但意图错到根上**——即便排上去，来的是研究黑帽技术的人。这是本项目第三次被指标误导，也是最彻底的一次：前两次（`low hanging fruit seo`、`all in one seo`）至少意图是对的，只是竞争被低估。

替代词 `find low competition keywords` 意图完全正确（搜的人要的就是"能打赢的词"，正是P0-5做的事），Parent＝自身，且SERP前五有三个UGC位——说明Google缺乏足够好的商业内容，留有空间。

**2. P0-1 与 P0-2 的SEO优先级对调**

此前文档多处写"P0-2是全站SEO旗舰页"、"P0-1量太小只能靠内容导流"。**SERP实测显示正好相反**：

- `high impressions low clicks`（P0-1）：一个 **DR 1** 的站排在第4位
- `internal link audit`（P0-2）：前八 **DR 76-99**，没有任何低权重站

量级上P0-2是700 vs P0-1的70，但**DR=0阶段"能不能进前十"比"进去之后有多少量"重要得多**。70的量全拿到，好过700的量一点拿不到。

**建议调整**：P0-1改为SEO优先投入对象，P0-2维持完整页面规格但不指望短期排名。P0-2的次要词里 `orphan pages seo`(450/KD10) 等尚未SERP实测，可能仍有机会，建议单独验。

**3. 两个集群页主词都需重选**

`seo content strategy`(3,500/KD12) 被Google/HubSpot/Semrush通吃，`internal link analysis`(800/KD28) 前七全是工具商。两者都不适合DR=0起步。集群页slug暂缓确定，待重选后再定。

### ⚠️ 流程教训：指标筛选之后必须补SERP实测（2026-07-31）

`all in one seo` 指标是 1,500 / **KD9** / Parent＝自身——三项全优，一度列为主页候选。团队实测SERP后否决：**前十全是DR75+大站，第12位才出现新站**。

这与执行计划七轮查证第4轮完全同构（`low hanging fruit seo` KD<4是假象，实为大品牌博客占位、域名权威压过页面本身）。**同一个陷阱在本项目里已出现两次。**

**固化为流程**：Vol / KD / Parent 三项只是**初筛**。任何词定为主词前必须补SERP实测，看两件事——① 前十的DR分布；② 有没有新站/小站挤进去。**六个主词全部需要补这一步**，尤其指标"太好"的两个：`internal link audit`(700/KD5)、`seo content strategy`(3,500/KD12)。

指标好但SERP被大站锁死的词，比指标平庸的词更危险——它让人误以为找到了机会。

### P0-6 选词：为什么用复数形态

| 词 | Vol | KD | Parent |
|---|---|---|---|
| generative engine optimization | 7,900 | 51 | ＝自身 |
| answer engine optimization | 4,900 | 45 | ＝自身 |
| ai search optimization | 3,400 | 52 | ≠ GEO |
| ai seo tool | 1,600 | 47 | ≠ |
| **generative engine optimization tools** | **1,300** | **14** | **＝自身** ← 选它 |
| generative engine optimization tool | 900 | 25 | ≠ 复数形态 |
| geo seo tool | 250 | 41 | ≠ |
| ai search optimization tool | 150 | 24 | ≠ |

**必须用复数**：单数 `...tool`(900/KD25) 的Parent指向复数形态，即Google把复数当独立主题、单数当它的子集。用单数等于把流量让给一个我们不做的页面。

**品类概念词是未来目标不是现在**：`generative engine optimization`(7,900/KD51) 和 `answer engine optimization`(4,900/KD45) 都是自主题词，DR=0现在够不着，但它们是GEO集群页起来之后的目标。

**⚠️ 此词同样需要补SERP实测**：KD14配1,300的量，在GEO这种热门新品类里偏低，需确认前十是否已被大站占满。

**P0-5 主词的三次变更记录**（说明为什么最终选它，避免以后重复讨论）：

| 版本 | 主词 | 否决原因 |
|---|---|---|
| v1 | `keyword research tool` | KD94，全表最难，DR=0死路 |
| v2 | `find low competition keywords` | 800/KD26/Parent＝自身，指标可以，但描述的是**结果**（能打赢的词），团队指出卖点应是**机制**（发现之前没被发现的词） |
| v3 | `keyword grouper` | 700/KD15指标最好，但**用户状态错位**——搜它的人手里已有词表，我们的发现机制对他无用 |
| **v4 定稿** | **`hidden keywords seo`** | **250/KD0/Parent＝自身**。是三批333词里唯一同时满足"直接对应'发现未被发现的词'这个定位"+"Parent＝自身"+"KD0"的词。DR=0阶段KD0比volume更重要——KD0的自主题词数月可拿下，KD26可能需一年以上 |

### P0-5 专属语义簇（这才是这个工具的真实流量盘）

主词只有250量，但围绕它有一个高度内聚、全部可打的簇：

| 词 | Vol | KD | Parent | 语义方向 |
|---|---|---|---|---|
| find low competition keywords | 800 | 26 | ＝ | 结果向 |
| niche keyword research | 350 | 5 | ≠ | 细分向 |
| keyword gap analysis tool | 350 | 5 | ≠ | 缺口向 |
| **hidden keywords seo** | **250** | **0** | **＝** | **主词·发现向** |
| question based keywords | 250 | 6 | ＝ | 问题词向（对应Prompt机制） |
| content gap analysis tool | 200 | 0 | ≠ | 缺口向 |
| low hanging fruit keywords | 150 | 1 | ≠ | 机会向 |
| zero search volume keywords | 150 | 2 | ＝ | 零量词议题 |
| content gap seo | 150 | 0 | ≠ | 缺口向 |
| zero volume keywords | 100 | 3 | ＝ | 零量词议题 |

**合计约2,750月搜，KD全部在0-26区间**，全部指向"找到别人没在做的词"，与团队定位完全一致。

**P0-5实际有两个可打的簇**，对应工具的两段能力，可分别用内容承接、最终都导向同一工具：
- **发现型簇**（上表，约2,750）→ 对应工具第2-3步（AI提炼卖点 + 发散候选）
- **聚类型簇**（keyword clustering tool 900/KD29、keyword grouper 700/KD15、semantic keyword clustering 250/KD3、keyword grouping tool 200/KD12、topical map seo 400/KD5、topical authority map 250/KD4）→ 对应工具第6-7步（聚类 + 映射结构）

### ⚠️ 修正：此前"Content Gap是红海、建议降级"的判断是错的

`2026-07-29-gengrowth-p0四工具-输入输出与实现流程总结.md` 四、节曾建议把"对比竞品内容缺口"降级，理由是"Ahrefs/Semrush已把Content Gap做成独立命名功能在卖多年，这个品类的搜索词大概率也是红海"。第三批实测不支持这个判断：

| 词 | Vol | KD |
|---|---|---|
| content gap analysis tool | 200 | **0** |
| content gap seo | 150 | **0** |
| keyword gap analysis tool | 350 | **5** |
| content gap analysis | 1000 | 35（Parent＝自身） |
| keyword gap | 1300 | 39 |
| keyword gap analysis | 800 | 40 |

**大厂占据的是品类概念词（keyword gap 1300/KD39），工具化变体这一层是空的（KD 0-5）。** 当时的错误是用SERP观察替代了量级实测——与本项目反复出现的同一类错误同源，只是方向相反（★候选那次是高估机会，这次是低估）。

**教训固化**：SERP观察能判断"谁在占位、什么内容类型"，但**不能替代量级实测做机会判断**。两者必须都做。

### 第三批实测中确认死掉的方向

- **`untapped` 全家零量**：untapped keywords / untapped keyword opportunities / untapped niche keywords / find untapped keywords —— 全部0
- **第一人称表述全零**：keywords im not ranking for / keywords i should be ranking for / what keywords am i missing / missing keywords seo —— 全部0，再次验证前两批"白话/第一人称不产生搜索"的规律
- **Prompt / GEO在关键词工具这条线上没有需求**：ai search keywords 0、llm keyword research 30/KD0、chatgpt keyword research 50/KD2、prompt research tool 50/KD5、people also ask keywords 0。**工具原名"关键词+Prompt机会地图"里的Prompt角度，目前无搜索需求**——GEO的流量价值在别处（generative engine optimization tool 900/KD25），不在这条线上
- **发现型高量词全被keyword research吸收**：keyword discovery tool 800/KD94、find new keywords 450/KD96、discover new keywords 150/KD95、keyword opportunities tool 80/KD94 —— Parent全部≠自身，指向keyword research

### 意外发现：「零搜索量关键词」是一个正在成形且未被占据的议题

- `zero search volume keywords` 150/KD2/**Parent＝自身**
- `zero volume keywords` 100/KD3/**Parent＝自身**

两个词都是自己的Parent，说明Google已认定它们是独立主题，但KD只有2-3，说明还没有权威站占位。SEO圈近年在讨论"AI搜索时代零搜索量的词反而有价值"，这与P0-5的机制在逻辑上同源——**发散出数据还没记录的角度**。建议作为P0-5的内容切入点之一。

### 关键结构性发现：SEO机会在五个工具间极度不均

### 痛点证据 × 可打搜索量 对照（2026-07-30）

| 工具 | 痛点证据 | Parent＝自身可打量 | 关系 |
|---|---|---|---|
| **P0-1** Quick Wins | **强**：约19帖/约400评论/跨7年 + 团队一手事故（Yamal页面） | **70** | 严重倒挂 |
| **P0-2** 内链/孤岛 | 中：10-15帖跨多子版，单帖最高20+评论 | **3,250** | 唯一三者皆成立 |
| **P0-3** 流量下降 | **最强（本轮新验证，见下）**：约17帖/540+评论/持续每周新增 | 220 | 倒挂，但痛点最硬 |
| **P0-4** SEO审计 | 未评估 | 0（品类18,000但KD 76-94） | 红海饱和 |
| **P0-5** 关键词地图 | **高**：7帖/496评论/集中近1年 | 4,740 + 替代词簇8,580 | 痛点分裂两个词簇 |

**结构性规律（这次实测得出，可复用于后续工具选型）**：痛点讨论热度与可打搜索量之间**没有正相关，部分呈负相关**。决定一个痛点会不会产生搜索的，是**痛点被发现的场景**：

| 痛点类型 | 用户行为 | 搜索表现 | 本项目例子 |
|---|---|---|---|
| 在别的工具内部被发现的症状 | 发帖问社区"这正常吗" | 几乎无搜索量 | P0-1（GSC里翻到曝光高点击低） |
| 已成行业公认作业项的任务 | 主动搜怎么做/用什么工具 | 有量且可打 | P0-2（内链审计是标准动作） |
| 已被大厂做成标准品类 | 搜品类名 | 量巨大但KD 76-94 | P0-4、P0-5品类词半边 |
| 表达为"现有方案太贵" | 搜品牌替代词 | 有量且可打 | P0-5（semrush alternative簇） |
| 突发危机型 | 发帖求助 + 搜零散问题词 | 讨论量极高但搜索分散 | P0-3 |

**直接推论**：开发排期（按痛点+就绪度）和SEO投入排期（按可打量）本就不该同序。需求洞察报告3.1/3.2当初分成两套排序、写明"这个错位不是需要消除的矛盾"，被本次284词实测坐实。

### P0-3 痛点补验证（2026-07-30，reddit站内搜索）

P0-3（流量下降根因树）和P0-4从未进入需求洞察报告的六工具验证流程——它们是后来在11.1命名表里直接进P0的，跳过了六源+三关+Reddit实证。本轮补做P0-3：

**r/SEO（近一年高票）**
- My traffic dropped 70% after the GSC July Update — 122票/69评论
- I 10x'd the quality of my site. Google's response: rank it lower — 84票/123评论
- I lost all traffic on Google — 56票/145评论
- Scaling AI Content Backfire (Lily Ray研究) — 57票/49评论
- Website has been experiencing a decline for a long time. What should I do? — 43票/91评论（11天前）

**r/SEO（近一个月，证明是持续流而非历史存量）**
- Website was offline for a month, will this hurt my SEO long-term?（4天前，30评论）
- Help! My Website Is in an SEO Depression – Traffic Crashed, Briefly Recovered, Then Crashed Again（3天前）
- Google Web impressions suddenly dropped by 90% sitewide, but pages remain indexed（10天前，14评论）
- Very Specific DeIndexing Issue（12天前）
- Homepage traffic down 80% since Sept 2024, but category pages are fine（19天前，18评论）

**r/bigseo**
- Sudden drop to zero clicks/impressions in Search Console after months of steady traffic（26天前，16评论）
- Site traffic dropped and im super worried（28天前，11评论）
- Figuring out why traffic dropped（3个月前，18评论）
- Unexplained Order Drop/Fluctuations—GSC Traffic & Server Look Perfectly Normal（24天前，9评论）

**结论：约17帖/540+评论，是七个工具里痛点讨论量最高的**，超过关键词地图的496。且**近一个月内就有7条以上新帖**——时间分布不是跨年存量，是每周都在新增的持续流。P0-3虽然跳过了验证流程进P0，但事后补验证的结果支持它留在P0。

**同时暴露产品逻辑缺口——现有根因分类不够用。** 当前设计四类（季节性/排名下降/CTR意图/抓取问题）+ 建议新增的AIO，但上述真实帖子里至少还有三类没覆盖：

| 缺失根因 | 对应真实帖 |
|---|---|
| **去索引 / 索引异常** | Very Specific DeIndexing Issue；Sudden drop to zero clicks/impressions |
| **站点可用性**（宕机/服务器） | Website was offline for a month |
| **索引正常但曝光崩塌** | Google Web impressions dropped 90% sitewide, but pages remain indexed |

另外 "Homepage traffic down 80% but category pages are fine" 说明**诊断必须能定位到页面段落级**（首页 vs 分类页表现不同），不能只给全站结论——这是当前设计没有明确的要求。

### 关键结构性发现：SEO机会在五个工具间极度不均

| 工具 | Parent＝自身的可打词数量 | 该工具可打簇合计量 | 最高单词量级 |
|---|---|---|---|
| P0-5 关键词地图 | **12个**（三批合计） | 发现型簇2,750 + 聚类型簇2,450 | keyword gap 1300（KD39）/ keyword clustering tool 900 |
| P0-2 内链/孤岛 | **5个** | 约3,250 | pagerank sculpting 1500 |
| P0-3 流量下降 | 2个 | 约220 | sudden drop in organic traffic 200 |
| P0-1 Quick Wins | 1个（且仅70量） | 约130 | high impressions low clicks 70 |
| P0-4 SEO审计 | **0个** | 0 | 品类18,000但KD 76-94 |

**这个分布跟开发优先级正好倒置**：需求洞察报告3.1把P0-1排第1（靠痛点证据+开发就绪度），但它是五个工具里SEO机会最差的。**这不是矛盾**——报告3.2节自己就写明"SEO Quick Wins按纯SEO经济学此项垫底，优先级完全来自痛点证据而非关键词本身"。本次实测把这个结论量化坐实了：P0-1能拿的最好的词只有70月搜。

**直接推论**：P0-1和P0-4两个工具都不靠自身页面获客，**内容矩阵导流对它们是唯一通路**，而不是可选项。执行计划第五章标记的"谁负责内容矩阵导流"这个前提条件，现在有数据支撑了——两个工具的获客完全押在这上面。

### 两个额外发现

**1. `pagerank sculpting` 1500/KD12/Parent＝自身 —— 三批333词里量级最高的可打词**
这是控制内链权重流向的老派SEO术语，语义上属于P0-2的范畴，但意图是Informational（学概念），不是找工具。**建议作为Pillar文章选题而不是工具页主词**——写这篇文章，CTA导向内链工具，正好符合"入口型工具靠内容矩阵导流"的既定策略。

**2. `keyword cannibalization checker` 300/KD1 是全表KD最低的商业意图词 —— 已挂起，五工具上线后再议**

完整语义簇（三批实测）：

| 词 | Vol | KD | Parent |
|---|---|---|---|
| how to fix keyword cannibalization | 600 | 11 | ≠ seo cannibalization |
| content cannibalization | 500 | 44 | ＝ |
| keyword cannibalization checker | 300 | **1** | ＝ |
| keyword cannibalization tool | 300 | 3 | ≠ keyword cannibalization checker |
| keyword cannibalization audit | 100 | 14 | ≠ |

合计约1,800月搜，其中 `keyword cannibalization checker` KD1 是三批333词里**KD最低的商业意图词**。技术上和P0-5共用聚类后端数据（聚类完成后天然就知道哪些页面在互相竞争），边际开发成本低。

**团队决定（2026-07-30）：暂不启动，挂起。** 理由：当前五个P0工具尚未上线，不新增第六个入口分散资源。**待五个工具落地上线后重新评估**——届时需要决定的是：作为P0-5页面内的一个功能点，还是单独开 `/tools/keyword-cannibalization-checker` 页面。

> 挂起不等于放弃。这个词簇的指标是本次实测中最好的之一（KD1 + Parent＝自身 + 商业意图 + 后端能力已具备），重新评估时不需要重跑关键词验证，直接用本表数据即可。

### 第二批实测中确认无效的方向

- **平台修饰词不成立**：`wordpress internal linking plugin` 50/KD34、`orphan pages wordpress` 0——WordPress前缀没有降低难度，反而因为插件生态竞争更激烈
- **白话变体仍然零量**：`pages not linked internally`、`easy keywords to rank for`(300但KD76)、`zero google clicks`、`indexed but no clicks` 均无效，再次验证第一批的教训
- **`internal linking best practices` 800/KD78、`internal linking strategy` 700/KD68**：量大但KD极高，且Parent都≠自身，是被大主题吸收的教育型内容，DR=0打不动

---

## 三、（旧版）按8个URL的选词建议 —— 已被上方五工具版取代，保留备查

| 页面URL | 建议主词 | Vol | KD | 变更说明 |
|---|---|---|---|---|
| `/tools/internal-link-checker` | **internal link audit** | 700 | 5 | ⬆️ 从 internal link checker(450/KD10) 改为此词，量更高难度更低，且Parent＝自身。原词作次要词同页承接 |
| `/tools/orphan-page-checker` | **orphan pages seo** | 450 | 10 | ⬆️ 从 orphan pages checker(40/KD0) 改为此词。原词量太小 |
| `/tools/keyword-clustering-tool` | **keyword grouper** | 700 | 15 | ⬆️ 从 keyword clustering tool(900/KD29) 改为此词。KD29对DR=0偏高，keyword grouper量接近但难度砍半 |
| `/tools/topic-cluster-tool` | **topical map seo** | 400 | 5 | ⬆️ 原词 topic cluster tool 实测0量。topical map是SEO圈正在起来的新术语，量400/KD5，比原方案好得多 |
| `/tools/traffic-drop-diagnosis` | **sudden drop in organic traffic** | 200 | 2 | ⬆️ 从 why is my website traffic dropping(30/KD4/Parent≠) 改为此词，Parent＝自身，量大7倍 |
| `/tools/seo-quick-wins` | **high impressions low clicks** | 70 | 0 | ⬆️ 原方案的 search console tool 未在本批次，需补测。此词量小但Parent＝自身、KD0、意图精准，是目前唯一可用的 |
| `/tools/keyword-research-tool` | **find low competition keywords** | 800 | 26 | ⬆️ 原词 keyword research tool KD94 是死路。此词Parent＝自身、量800，且"低竞争"这个诉求和DR=0新站用户高度契合 |
| `/tools/seo-audit` | ⚠️ **本批次无可用词** | — | — | seo audit系列全在KD 76-94区间。见下方4.1 |
| `/`（主页） | **seo tools for small business** | 350 | 6 | 主页原本不承担SEO获客，但此词Parent＝自身、KD6、CPC$6.00，是主页唯一能打的词，可作为主页H2或副标题承接 |

**新增建议入口**：`keyword cannibalization checker`（300/KD1/CPC$3.50/Parent＝自身）——这是本次实测中**性价比最高的单个词**。它不在原P0清单里，但和聚类工具共用同一套后端数据（聚类完自然知道哪些页面在互相竞争）。建议评估单独开一个 `/tools/keyword-cannibalization-checker`。

---

## 四、两个需要团队决策的问题

### 4.1 P0-4（免费SEO审计）在DR=0下没有可打的词，但它被放在主页首屏

seo audit 相关词的实测全景：

| 词 | Vol | KD |
|---|---|---|
| seo audit | 18,000 | 85 |
| free seo audit | 4,800 | 85 |
| seo audit tool | 3,600 | 82 |
| free seo audit tool | 2,000 | 85 |
| website audit | 8,500 | 88 |
| website audit tool | 1,800 | 84 |
| seo score checker | 1,900 | 88 |
| free website seo checker | 1,000 | 87 |
| check seo of a website | 700 | 91 |
| **free seo audit report generator** | **400** | **0** ← 唯一低KD |
| **instant seo audit** | **80** | **0** |
| **quick seo check** | **20** | **0** |

整个品类被大厂锁死在KD 82-91，唯一的缝隙是 `free seo audit report generator`（400/KD0/CPC$4.00）和 `instant seo audit`（80/KD0），但两者Parent都≠自身。

**三个选项**：
1. 用 `free seo audit report generator` 作主词，把页面重心从"审计工具"偏向"生成一份可下载/可分享的报告"——这跟工具当前设计（就地展示评分）不完全一致，需要产品配合
2. 承认这个页面拿不到自然流量，纯做转化落地页，靠主页入口和内容矩阵导流（跟SEO Quick Wins同样处境）
3. 暂缓这个页面的SEO投入，先把资源放在internal link audit / keyword grouper这些能打的词上

**我的建议是2**：它本来就是主页首屏的低摩擦入口，转化职责大于获客职责，不必强求SEO。

### 4.2 P0-5a（关键词研究工具）的定位需要重新想

原主词 `keyword research tool` KD94、`free keyword research tool` KD93——这是全表最硬的品类，Ahrefs/Semrush的核心阵地。

建议改用 `find low competition keywords`（800/KD26/Parent＝自身）。这个改动不只是换词，**它其实和产品新机制天然契合**：P0-5改成"爬网站提炼卖点→AI发散→真实搜索量校验"之后，产出的本来就是"低竞争但相关"的词，而不是"大词全集"。用这个主词，页面叙事从"又一个关键词工具"变成"帮你找到你能打赢的词"——对DR=0的用户来说，这个诉求比"关键词研究"精准得多，而且我们自己就是DR=0，这是可以直说的一手立场。

---

## 五、待办

- [ ] `search console tool` / `google search console tool` 不在本批194词内（11.2表称约8,100/390），需补测——这是P0-1唯一可能的高量词
- [ ] 确认P0-4的三个选项走哪个
- [ ] 评估 `keyword cannibalization checker` 是否单独开页
- [ ] 11.2表量级列整体标记"待复核"，避免后续文档继续引用错误数字
- [ ] 落地页文案（2026-07-30-gengrowth-ai-落地页关键词与文案-v1.md）的Title/Meta/H1需按本文的最终选词全部重写——现有文案是按旧主词写的

---

*本文档基于194词Ahrefs实测（google_us，2026-07-30），选词建议以 Parent Keyword＝自身 + KD<30 + DR=0可打 为筛选标准。*
