---
title: 方案 · shortsbinge.com 首页优化方案
date: 2026-10-27
status: 待彪哥评估排期
scope: Hero区结构与标题层级、TikTok重点剧目数据源、四语种首页Title/H1/Description、顺手发现的四个硬伤
依据: Hero/H1/H2/H3结构及四语种Title/Description现状本人已用curl实测核实；GSC点击对比本人已核实；四语种关键词搜索量数据来自第三方关键词工具（Keyword Planner口径），本人未独立核实，采信处理
---

# 方案 · shortsbinge.com 首页优化方案

## 一句话结论

首页现在同时有两个问题，根子不一样：一是**TikTok导流体验**——账号主页只能挂单个链接（TikTok不支持二次跳转，不能用Linktree分流到具体剧页），用户从TikTok来到`/es/`后，固定Hero只展示一部"trending"剧，大概率不是吸引他们来的那部，容易直接跳出；二是**四语言首页被谷歌判重复**——四个语言首页的`<h1>`逐字完全相同、且全部是英文，连正文全阿拉伯语的`/ar/`页面也是这句英文（已验证）。两个问题都要改，但改的是页面里不同的部分，不会互相冲突：H1走关键词方向，Hero区内部的标题层级单独处理。好消息是这四个首页目前几乎没有搜索流量可伤（英文首页90天仅31点击/421曝光），可以放心改。

---

## 一、Hero区结构：从锁定单剧改为多剧展示

**问题**：现在`/es/`首屏Hero区固定展示一部剧（大图+剧名+简介+Play按钮），下方另有一条横向小图滚动条（约11张海报）。TikTok用户进来后，如果Hero展示的不是吸引他们的那部剧，得靠自己往下滚、往横条里找，增加跳出概率。

**需要做的事**：把Hero区从"单剧大图"改成能同时展示3-5部剧的结构（并排卡片或小型轮播），每张卡片保留剧名、简介、Play入口，让首屏一次性覆盖多部剧。具体展示哪几部剧，由第三节的"TikTok重点剧目"数据源决定。

**达到的效果**：首屏覆盖的剧目选择面变宽，用户更容易在第一屏就认出自己想看的那部，减少"没看到想要的"直接跳出的情况。

---

## 二、Hero区标题层级：只有这一处用错了层级（已验证，范围很窄）

实测首页源码，全站H2共21个：Hero区12张海报剧名是H2；另外6个是真正的栏目标题（"What everyone's watching"、"New releases"、"People are also watching"等）；再加3个页脚栏目（Discover/Company/Latest issue）。H3共65个，是"New releases"等栏目下的剧名——这些栏目本身的层级关系是**对的**（栏目名H2统辖剧名H3）。

**问题只出在Hero区**：Hero那12张海报的剧名用了H2，和其他栏目"剧名用H3"的惯例不一致；而且Hero区的剧名列表前面没有一句说明性的标题，直接从H1跳到12个剧名H2，页面主题和条目之间缺一层过渡。

**需要做的事（只改Hero区，主页其他栏目不用动）**：
1. Hero区12张海报的剧名，从`<h2>`降成`<h3>`，和其他栏目保持一致
2. 在Hero剧名列表前加一句说明性的`<h2>`，起到"这个区块是什么"的过渡作用（比如"Trending on TikTok this week"这类，具体文案结合第一节的多剧展示改动一起定，中西双语版本到时候一并给）

**达到的效果**：Hero区标题层级和主页其他栏目统一；谷歌判断页面主题时，H1、H2、H3各司其职，不再出现"H1空转、H2层全是剧名"的结构问题。

**说明**：谷歌判断页面主题看H1，H2/H3是H1统辖下的条目，两者是父子关系不是并列关系——H1用哪句话，和Hero区展示几部剧、剧名用什么标签层级，是两件不冲突的事，所以第四节的H1方案可以直接按关键词方向执行，不用迁就这里的改动。

---

## 三、TikTok重点剧目数据源：不接官方API，用轻量运营配置

**问题**：首屏要跟着TikTok推的剧联动，需要一个数据源告诉网站"最近TikTok在主推哪些剧"。真正接入TikTok官方Display API需要给账号单独申请开发者授权、维护token，工程成本不小，对一个账号来说未必值得。

**需要做的事**：用轻量运营配置代替——后台留一个"近期TikTok主推剧目"的可编辑列表（哪怕是个JSON配置或简单后台字段），社媒每次发新视频时同步更新这个列表，Hero区直接读取展示。

**需要先确认的前提**：剪辑/发布TikTok视频的流程里是不是已经有"这周剪了哪些剧"的台账——如果有，直接复用这份台账做数据源最省事，不用新建一套；需要社媒/内容那边确认。

**达到的效果**：Hero展示内容能及时跟上TikTok实际在推的剧目，不需要接入TikTok API这类高成本方案。

---

## 四、四语种首页Title/H1/Description（已验证现状，关键词数据为转述）

### 现状（已验证）

| 语言    | Title                                                                | H1（四行逐字完全相同，含阿语页）                  | Description                                     |
| ----- | -------------------------------------------------------------------- | ---------------------------------------- | ----------------------------------------------- |
| en    | `ShortsBinge — The Short Dramas Worth Your Time`                     | `Your Next Binge Is Already Here`        | `The best short dramas, ranked and reviewed...` |
| es    | `ShortsBinge for Spanish Viewers — The Short Dramas Worth Your Time` | `Your Next Binge Is Already Here`        | 英文，仅把`for Spanish viewers`塞进模板                  |
| ar    | `ShortsBinge for Arabic Viewers — ...`                               | `Your Next Binge Is Already Here`（正文全阿语，H1仍是英文，无`lang`属性） | 英文，同上模板                                         |
| zh-TW | `ShortsBinge for Chinese (Taiwan) Viewers — ...`                     | `Your Next Binge Is Already Here`        | 英文，同上模板                                         |

三个问题叠在一起：H1里没有`short drama`或任何语种关键词，等于放弃了H1的SEO价值；四页H1字面完全相同，是多语言被判重复的直接信号；非英语页的Title/Description是英文模板+`for X Viewers`，这段文字内容是"写给谁看"，不是"给搜索引擎看这页讲什么"，等于浪费了Title/Description的位置。

### 四语种关键词方向与文案（关键词数据未独立核实，仅采信转述）

| 语种  | 词                |   月搜索量 | 走势                                               |
| --- | ---------------- | -----: | ------------------------------------------------ |
| 英文  | `short dramas`   | 74,000 | 上升+40%                                           |
| 西语  | `novelas cortas` | 14,800 | 下降−37%，语义风险高（常指"短篇/中篇小说"，不建议当主词）                 |
| 西语  | `series cortas`  |  2,900 | 平稳                                               |
| 西语  | `dramas cortos`  |    140 | 上升+45%，量小但最贴合本义                                  |
| 阿语  | `مسلسلات قصيرة`  |  8,100 | 上升+50%，SERP竞争松，阿语页CTR实测21.6%-24.3%，是四语种里最值得投入的一个 |
| 阿语  | `دراما قصيرة`    |  1,300 | 上升+45%                                           |
| 繁中  | `短劇線上看`          | 14,800 | 平稳，但站内实际是导去App不是线上看完，放Title前段有预期落空风险             |
| 繁中  | `短劇推薦`           |  6,600 | 平稳−18%，更贴合实际体验，建议放前段                             |
| 繁中  | `免費短劇`           |  1,000 | 上升+76%，放Title尾部                                  |

**英文 `/`**
- Title：`Short Dramas Ranked & Reviewed | ShortsBinge`
- H1：`Short Dramas Worth Your Time — Ranked and Reviewed`
- Description：`Every short drama from ReelShort, DramaBox and NetShort — ranked, reviewed, and with the free episode count up front. Updated weekly.`

**西语 `/es/`**
- Title：`Series Cortas y Dramas Cortos | Ranking y Reseñas`
- H1：`Series cortas y dramas cortos, reseñados y ordenados`
- Description：`Los mejores dramas cortos de ReelShort, DramaBox y NetShort: reseñas, ranking y cuántos episodios son gratis antes de empezar. Cada semana.`
- 说明：`series cortas`和`dramas cortos`两个词一起放，前者有量、后者在涨且更贴合本义，不要只押`novelas cortas`（语义风险高）

**阿语 `/ar/`**
- Title：`مسلسلات قصيرة ودراما قصيرة — ترتيب ومراجعة | ShortsBinge`
- H1：`مسلسلات قصيرة ودراما قصيرة، مرتّبة ومُراجَعة`
- Description：`أفضل المسلسلات القصيرة من ReelShort وDramaBox وNetShort: مراجعات وترتيب، مع عدد الحلقات المجانية قبل أن تبدأ. تحديث أسبوعي.`
- 注意RTL：逗号用阿拉伯语逗号`،`，不用英文逗号；上线前在真机上过一遍标点方向

**繁中 `/zh-TW/`**
- Title：`短劇推薦與短劇線上看｜免費集數先標好 | ShortsBinge`
- H1：`短劇推薦：先看評價，再看免費集數`
- Description：`ReelShort、DramaBox、NetShort 的熱門短劇，依評價排名，每部標明幾集免費、幾集要進 App。每週更新。`
- 说明：`短劇推薦`放Title前段，`短劇線上看`放后段——站内实际是导去App、不能線上看完整剧，把"線上看"放最前面容易招来预期落空的用户，抬高跳出

---

## 五、顺手发现的四个硬伤（优先级高于H1本身）

1. **CMS占位符泄漏到前端**：西语首页有一张剧卡标题是`La venganza del Dios del Surf-剧目-CMS自动创建`——这是后台自动生成时的占位串，直接显示给了用户和谷歌。这是内容质控事故，不是SEO问题，优先级最高，需要彪哥查一下还有多少条类似数据。
2. **页面只本地化了一半**：四页的模块标题、分类说明仍是英文——`What everyone's watching`、`See what's trending`、`Best Picks`、`Useful guides, not one-line reviews`、`Identity · 1347 titles`，阿语页还挂着`Watch Guide · English`。只改H1、周围全是英文，谷歌仍有理由判定页面重复。
3. **非英语首页约一半剧名还是英文**：ar页有`You Can't Stop My Super X-Ray Vision`、`Is It Just Me?`、`His One and Only Love`、`My Vampire King`、`The Silver Serpent's Bride`；zh-TW页有`I'll Never See You Again`、`Taste of the Wild`、`Gamble of Love`、`Star Prison`。H1一旦写明"阿语短剧"，这些英文条目就和承诺对不上，这条和《剧名之外的关键词覆盖方案》里已经提过的本地化译名缺口是同一个问题。
4. **品牌名不统一**：Title写`ShortsBinge`，页头logo是`Shorts Binge`（带空格），建议统一成一个写法。

---

## 六、配套，不是"只改H1"就够

1. **hreflang**：四个语言首页之间要互指+`x-default`指向英文版。本人未在源码里核对这一项，需要彪哥确认——这和H1本地化是配套的，只本地化不加hreflang，谷歌更容易判成重复。
2. **模块标题本地化**：把第五节②里列的英文模块文案换成对应语种。一次性文案工程量不大，但是让页面"真的是这个语种的页面"的关键，不能只改H1。

---

## 七、需要确认/决定的前提

1. 剪辑/发布台账是否已存在，能否直接作为第三节的数据源
2. Hero剧名列表前新增的说明性H2，中西双语文案怎么定，结合第一节多剧展示改动一起给
3. 这套Hero联动机制先只上`/es/`，还是做成所有语言通用——如果其他语言后续也会接类似的社媒导流，现在把机制做成通用的会比以后重复开发更省事，建议一并考虑

---

## 八、上线顺序与验收标准

| 顺序 | 动作 |
|---|---|
| 1 | 修CMS占位符泄漏（内容事故，最高优先） |
| 2 | Hero区改多剧展示+标题层级修复（第一、二节） |
| 3 | 四页Title/H1/Description按第四节替换 |
| 4 | 模块标题+`Watch Guide · English`本地化 |
| 5 | 确认hreflang互指+x-default |

**验收标准**：
- Hero能展示配置列表里的多部剧，不再锁定固定的单一trending剧；Hero区12个剧名统一为H3，前面有一句说明性H2过渡
- 发布新TikTok视频、运营更新一次剧目列表后，首屏能跟着变化
- `/ar/`首页的曝光：阿语是四语种里唯一有真实机会的（8,100的品类词+竞争松的SERP），如果改完之后阿语首页曝光从个位数开始上升，说明方向对了
- 四个首页是否开始在GSC里被记成不同页面出词：这是"重复判定被解开"的直接证据

时间窗给3-4周，不要指望一周出效果——首页从零开始出词，通常要等谷歌重抓、重评估一轮。
