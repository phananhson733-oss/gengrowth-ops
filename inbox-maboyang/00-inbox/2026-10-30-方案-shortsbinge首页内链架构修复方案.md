---
title: 方案 · shortsbinge.com 首页内链架构修复方案
date: 2026-10-30
status: 待彪哥执行
scope: 首页内链全指ep1的修复、robots.txt分组修正、sitemap文件级lastmod与分页污染、首页H1/H2层级与体积
依据: 首页源码（内链去重统计、模块归属、标题层级分布、HTML各构成字节拆分）、robots.txt、sitemap索引lastmod、pages-en.xml分页数量，本人均已直接抓取核实；GSC收录构成数字、历史ep1被拒率、每日抓取页数基线未独立核实，按转述处理
---

# 方案 · shortsbinge.com 首页内链架构修复方案

## 一句话结论

这轮审核的核心发现已经逐项核实，**全部属实，其中两处比原始报告描述的还要严重**：首页`/drama/`内链去重后共66条，**100%**指向`episode/1/`，0条指向剧页本身（原报告说68条/0条，方向一致）；sitemap的分页污染只查了英语一个语言的`pages-en.xml`，867条URL里就有80%是`/page/N`这类列表分页，比报告估的"270+"更多。这不是内容问题也不是抓取被拦的问题，是一个纯架构层面的错误——首页作为全站权重汇聚点、谷歌来得最勤的页面，把它能发出的内链权重**全部**给了站上被拒率最高的页面类型（ep1，此前实测被拒率69.4%，未在本轮重新核实）。改动成本低，优先级最高。

---

## 一、首页内链全指ep1，0条指向剧页（已验证，比原报告更极端；Hero区例外保留ep1）

**核实结果**：抓取首页源码，去重后共66条唯一的`/drama/`链接，**全部66条**都以`episode/1/`结尾，**没有一条**指向`/drama/<slug>/`剧页本身。按模块拆分：Hero区精选卡片12条、"What everyone's watching"26条、"New releases"18条、"People are also watching"12条，全部指向`episode/1/`。

首页是全站权重汇聚点，也是Google抓取最频繁的页面，它发出的内链是Google发现新URL的主路径。现在这条主路径100%导向ep1——而ep1是此前已经确认的、全站被拒率最高的页面类型（历史数据：828条评估中575条被拒，拒绝率69.4%，此数据本轮未重新核实，沿用此前分析）。

**需要做的事（Hero区例外，不是全部模块一刀切）**：

| 模块 | 卡片数 | 链接改动 |
|---|---:|---|
| Hero精选卡片（首屏大图+横向海报条） | 12 | **保留指向`episode/1/`**——这是首页唯一的强转化入口，考虑到点击后直接进入播放体验对转化率的价值，不改 |
| What everyone's watching | 26 | 改为指向`/drama/<slug>/`剧页 |
| New releases | 18 | 改为指向`/drama/<slug>/`剧页 |
| People are also watching | 12 | 改为指向`/drama/<slug>/`剧页 |

改完之后，首页66条`/drama/`链接里，56条（85%）指向剧页，12条（15%）保留指向ep1。虽然没有做到100%导向剧页，但已经把绝大多数内链权重从"全站被拒率最高的页面类型"转移到"唯一带独有内容、被Google正常收录的页面类型"，Hero区这12条例外的量级不足以撑起"首页权重全给ep1"这个问题，不影响修复效果。

**达到的效果**：首页的内链权重从单一指向ep1，变成绝大部分指向剧页，同时保留Hero区的转化路径不受影响。这是模板改一次、全站生效的改动——Hero和其余三个模块分属不同组件，改动时需要分别处理，不能用一次全局替换覆盖所有卡片链接。

---

## 二、robots.txt的5行筛选规则，只在AI爬虫组生效（已三次独立验证，重申执行）

**核实结果**：本轮重新抓取robots.txt现状，确认`Disallow: /*?mood=`、`/*?tab=`、`/*?dimension=`、`/browse/*/*/view/`、`/trending/view/`这5行，以及`Crawl-delay: 10`，全部只写在：

```
User-Agent: OAI-SearchBot
User-Agent: Claude-SearchBot
User-Agent: PerplexityBot
User-Agent: meta-webindexer
User-Agent: Amzn-SearchBot
User-Agent: ShapBot
```

这个AI搜索爬虫专属分组下，**不在`User-agent: *`通配组**。这是本会话第三次独立核实同一个结论，状态没有变化。对Googlebot完全无效（Google不读`Crawl-delay`，也不在这组规则覆盖范围内）。

**需要做的事**：把这5行`Disallow`和`Crawl-delay: 10`从AI爬虫专属分组，复制一份到`User-agent: *`通配组下（或者直接移动过去，取决于是否还想单独限制AI爬虫）。5分钟能完成。

**达到的效果**：Googlebot不再把抓取配额花在`?mood=`/`?tab=`/`?dimension=`筛选页和`/browse/*/*/view/`这类低价值页面上。

---

## 三、sitemap文件级lastmod每天滚动刷新，且分页污染比预估更严重（已验证，程度超出原报告）

**lastmod滚动**：25个`dramas-*`sitemap文件里，19个的文件级`lastmod`是今天（2026-10-30），只有少数几个（如`dramas-zh-TW-0.xml`停在10-13、`dramas-th-0.xml`停在10-20）没有被刷新。文件级lastmod是生成时统一刷新的，不代表文件内容真的整体更新了。

**需要做的事**：文件级`lastmod`改成取该文件内所有URL级`lastmod`的最大值，而不是每次生成就统一刷成当天。

**达到的效果**：Google不会因为看到文件级lastmod天天变化，就反复整体重下这44个子文件（单文件最大约735KB）。

**分页污染，比原报告估的更严重（新发现）**：本轮只核实了`pages-en.xml`一个文件，结果是1,087条URL里**867条（80%）**是`/page/N`这类列表分页链接，最大页码到119。原报告估计"270+"条分页，但这只是英语一个语言的数字就已经超过这个估计，19个语言加总的分页污染规模可能远大于原报告的估算，具体总量需要彪哥对pages-*全部19个文件跑一遍统计。

**需要做的事**：从`pages-*`sitemap里移除分页URL（`/page/2`及以后，第1页可以保留），或者给这些分页URL统一加`noindex`。

**达到的效果**：减少sitemap提交给Google的低价值重复列表页数量，让抓取配额有更大比例落在剧页和攻略页上。

---

## 四、首页H1/H2标题层级问题，叠加HTML体积偏大（已验证，问题范围比原报告更精确，体积根因不同于原报告）

### 4.1 标题层级：问题精确限定在Hero区12张卡，不是全站

**核实结果**：重新统计首页全部标题标签，H2共21个、H3共65个。21个H2里：12个是Hero区（首屏大图下方横向海报条）的剧名、6个是真正的区块标题（"What everyone's watching"、"New releases"、"People are also watching"、"Useful guides, not one-line reviews"、"Start with the kind of story you already like"、"This Week in Short Dramas"）、3个是页脚（Discover/Company/Latest issue）。65个H3**已经全部正确**——"What everyone's watching"等区块下面的剧名卡片本来就在用H3，这部分结构是对的，不用动。

真正有问题的只有Hero区那12个剧名，它们和6个区块标题一样用了H2，导致页面主题（H1）之下的子条目层级混乱：谷歌读到H2层既有"区块标题"也有"剧名"两种性质不同的内容，分不清Hero区这12个剧名到底是独立主题还是某个区块下的条目。

**需要做的事**：
1. Hero区12个剧名，从`<h2>`降为`<h3>`，和其余65个剧名保持一致
2. 在Hero剧名列表前面，补一个说明性的`<h2>`，起到"这个区块是什么"的过渡作用，建议文案："Trending Short Dramas"或"Today's Picks"（具体文案可以和运营/产品再定，不是必须按这两个词）
3. `<h1>`从"Your Next Binge Is Already Here"改成含主题词的版本，四个语言首页（en/es/ar/zh-TW）同步改，具体文案和依据见下表

**四语言Title/H1/Description具体文案**（关键词数据来自第三方工具Keyword Planner口径，本人未独立核实，按转述处理；H1/Title现状本人已用curl核实，详见`2026-10-27-方案-shortsbinge首页优化方案.md`第一节）：

| 语种 | 关键词 | 月搜索量 | 走势 |
|---|---|---:|---|
| 英文 | `short dramas` | 74,000 | 上升+40% |
| 西语 | `novelas cortas` | 14,800 | 下降−37%，语义风险高（常指"短篇/中篇小说"，不建议当主词） |
| 西语 | `series cortas` | 2,900 | 平稳 |
| 西语 | `dramas cortos` | 140 | 上升+45%，量小但最贴合本义 |
| 阿语 | `مسلسلات قصيرة` | 8,100 | 上升+50%，SERP竞争松，阿语页CTR实测21.6%-24.3%，四语种里最值得投入 |
| 阿语 | `دراما قصيرة` | 1,300 | 上升+45% |
| 繁中 | `短劇線上看` | 14,800 | 平稳，但站内实际是导去App不是线上看完，放Title前段有预期落空风险 |
| 繁中 | `短劇推薦` | 6,600 | 平稳−18%，更贴合实际体验，建议放前段 |
| 繁中 | `免費短劇` | 1,000 | 上升+76%，放Title尾部 |

**英文 `/`**
- Title：`Short Dramas Ranked & Reviewed | ShortsBinge`
- H1：`Short Dramas Worth Your Time — Ranked and Reviewed`
- Description：`Every short drama from ReelShort, DramaBox and NetShort — ranked, reviewed, and with the free episode count up front. Updated weekly.`

**西语 `/es/`**
- Title：`Series Cortas y Dramas Cortos | Ranking y Reseñas`
- H1：`Series cortas y dramas cortos, reseñados y ordenados`
- Description：`Los mejores dramas cortos de ReelShort, DramaBox y NetShort: reseñas, ranking y cuántos episodios son gratis antes de empezar. Cada semana.`
- 说明：`series cortas`和`dramas cortos`两个词一起放，前者有量、后者在涨且更贴合本义，不要只押`novelas cortas`（语义风险高，容易被理解成"短篇小说"）

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

### 4.2 HTML体积823,565字节的构成（已用实测字节拆分，比原报告的"CSS 71KB"更完整）

实测首页HTML各部分占比：

| 构成 | 字节数 | 占比 |
|---|---:|---:|
| `<script>`标签（含Next.js水合数据/JSON-LD） | 434,197 | **52.7%** |
| `<style>`标签（内联CSS） | 72,554 | 8.8% |
| `srcSet`图片响应式属性 | 49,720 | 6.0% |
| 其余HTML结构 | 267,094 | 32.5% |

**原报告只提到CSS这一项（71,098字节，和本轮实测72,554字节基本一致），但真正占比最大的是`<script>`标签，占了总体积一半以上**，原报告没有提到这部分。这部分字节大概率是Next.js把页面所有数据（68张卡片的标题、简介、图片地址、集数信息等）序列化后内嵌在HTML里，供前端水合（hydration）时直接使用，不用二次请求接口。

**需要做的事**：
1. `<script>`水合数据这部分，需要彪哥判断具体是什么内容（Next.js的`__NEXT_DATA__`或RSC流式payload），评估是否所有68张卡片的完整数据都需要首屏就内嵌——如果"What everyone's watching"（26张）、"New releases"（18张）这类位于首屏以下的模块，可以做成客户端滚动到可见区域时再请求数据，而不是随首屏HTML一起下发，能直接砍掉这部分字节的大头。这是本轮审核里字节占比最大、但原报告没有覆盖到的一个点，需要彪哥从代码侧确认可行性，本人没有工程侧访问权限，无法进一步判断实现细节
2. CSS外链化（内联CSS 72,554字节改成外部样式表，可以被浏览器缓存，不用每次请求HTML都重新下载）
3. `srcSet`响应式图片属性目前占6%，如果68张卡片的图片都配置了多档尺寸的srcSet，可以评估是否所有卡片都需要这么多档位，或者只有首屏可见的卡片保留完整srcSet，列表靠后的卡片用单一尺寸

**达到的效果**：标题层级修复让Google能正确区分"页面主题"和"区块标题"和"具体条目"三个层级；HTML体积优化（尤其是水合数据部分）预期能把总体积从823KB降到显著更低的量级，但具体能降多少，取决于彪哥评估后"首屏以下模块数据改为客户端按需加载"这个方向的可行性，本人无法给出精确预期数字。

---

## 五、明确不处理的（符合预期，不用再查）

- noindex 13,220个页面：是主动设置的结果，正常
- robots屏蔽66个、重定向36个：自己设置的规则，正常
- 已抓取-尚未编入索引24条：远低于已编入索引数（1,200），不是警报级别，保持观察即可
- 重复网页0条：canonical设置干净，健康状态

这几项不需要点"验证修复"，也不需要再花时间排查。

---

## 六、执行顺序

| 顺序 | 动作 | 耗时 |
|---|---|---|
| 1 | "What everyone's watching"/"New releases"/"People are also watching"三个模块（共56张卡）主链接改向剧页；Hero区12张卡保留指向`episode/1/` | 改模板一次 |
| 2 | robots.txt的5行规则+`Crawl-delay`复制/移动到`User-agent: *`组 | 5分钟 |
| 3 | sitemap文件级lastmod改用内部URL最大值 | 改一行逻辑 |
| 4 | pages-*的分页URL从sitemap移除或加noindex（需先对19个语言文件跑统计，确认总量） | 待评估规模后排期 |
| 5 | Hero区12张卡标题降为H3+补说明性H2、H1改含主题词版本（具体文案见第四节4.1） | 和第1项可以合并一次模板改动 |
| 6 | 首页HTML体积优化：优先评估`<script>`水合数据能否延后加载（见第四节4.2，这是本轮新发现的最大杠杆），其次CSS外链化、srcSet精简 | 需彪哥评估工程可行性后排期 |

---

## 验收标准

- 第1、2项完成后7-10天，跟踪GSC"已发现-尚未编入索引"（当前约80,882-94,200区间，不同报告口径略有差异）是否开始下降——这是内链架构改动最直接的反应信号
- 同期跟踪Googlebot每日抓取页数是否回升（此前基线约305页/天，此数未独立核实）
- 两项都没有变化，参照此前已定的11/9判据（Googlebot抓取回到500+/天、重点剧页收录数、全站曝光回到300+/日）综合判断，不要只看这一项改动的效果
