---
title: dramashortstv.com 网站优化方案
date: 2026-09-01（2026-09-02 全量复查一次，新增一批发现）
输入来源: (1) 2026-09-01-短剧新站-网站架构设计-对标pinedrama.md (2) 对 dramashortstv.com 的实测审计，三轮 curl + 浏览器复爬 (3) GSC 导出：7天窗口 8/26-8/28、24小时窗口 8/29-8/30、24小时窗口 8/31-9/1
---

# 现状判断

新模板（`/[locale]/drama/[slug-哈希]`、`/[locale]/watch/[slug-哈希]/[集数]`）已经上线，Schema、canonical、hreflang、翻译质量都做对了，和对标文档里给 pinedrama 打的分持平或更高。此前发现的三个 500 URL 和两个 sitemap 500 已修复，本轮复查确认。剩下的问题按优先级列出。

---

# P0：播放页完全不在 sitemap 里

**问题**：拉了现在两个 sitemap（`sitemap/0.xml` 24,968 条、`sitemap/1.xml` 10,974 条，共 35,942 条）逐条统计 URL 类型，结果是 30,974 条剧集详情页（`/drama/...`）+ 4,912 条分类页（`/genre/...`）+ 21 条首页语言变体 + 7 条博客文章。**播放页（`/watch/...`）出现次数为 0**。一部剧平均挂 10-70 集，实际播放页数量应该是几十万级别，一条都没进 sitemap。

**怎么改**：
1. 数据源不用另外抓取——详情页渲染集数网格时用的就是"这部剧有哪几集"这个字段，生成 sitemap 时遍历同一份数据，拼成 `https://dramashortstv.com/{locale}/watch/{slug-hash}/{episode}` 就行
2. 文件命名 `watch-0.xml`、`watch-1.xml`……独立于详情页的 sitemap，不要混在一起（和下面 P1 的分片方案统一执行）
3. 播放页大概率不用挂 hreflang——多数集数只有默认语言版本，只有真正做了配音/字幕的语种才需要额外的 `alternate` 标注，不用像详情页那样每条都挂 21 语言块，这样文件能小很多、生成也快
4. 单文件 30,000 条封顶（不含 hreflang 的情况可以按这个上限，参考 pinedrama 的分片经验）
5. 生成一个 `sitemap.xml` 作为总索引（sitemap index），把 `watch-N.xml` 和详情页、分类页、博客的分片全部列进去，`robots.txt` 只声明这一个索引文件的地址
6. 上线后去 Search Console 重新提交这个 `sitemap.xml` 索引

**为什么改**：播放页是用户实际点进去看剧的页面，也是拿到"视频"富媒体搜索结果（过去 7 天占全站 63% 点击）的页面类型。现在这类页面完全靠 Google 从详情页的集数列表里一层层爬过去发现，没有 sitemap 兜底，新剧、新集数的收录速度会明显慢于详情页，而且不利于之前 500 故障后的重新收录——sitemap 修好了，但修好的这两个文件里根本没有播放页，等于故障恢复这件事播放页从一开始就没被覆盖到。

---

# P1：裸数字 ID 的旧 URL 重定向链路太长，2-4 跳才到终点

**问题**：`/detail/38000` 这类无 locale 前缀的旧 URL 现在能正确跳转，但要经过 2-4 跳才到终点，比如：
```
/detail/38000                                  → 3 跳 → 最终页
/bg/video-play/38000?id=38000&episodesNum=1    → 2 跳 → 最终页
/video-play/38000?episodesNum=1（无locale）     → 4 跳 → 最终页
```
GSC 7 天窗口里，这批还在多跳链路上的旧 URL（`/detail/38000`、`/detail/49020`、`/bg/video-play/38000?...`系列）合计约 1,374 次点击，占全站当期总点击的 23%，是仍在承载真实流量的资产，不是可以搁置的历史包袱，风险性质和之前引发 500 故障的那批 URL 一样——都是多跳链路，跳数越多，中间某一跳出错的概率越高。

**怎么改**：给这几类旧 URL 形态（`/detail/:id`、`/video-play/:id`、`/video-play/:id?episodesNum=:n`，含裸路径和带 locale 前缀两种）各自单独注册一条重定向规则，规则直接做"用 id + episodesNum 查这部剧对应的 locale、slug、hash"这个查库动作——这个查库逻辑现在已经存在，只是被安排在链路最后一跳才执行，改动是把它挪到入口第一步直接执行，跳过中间"补语言前缀""去斜杠""转成 `/video-play/:id/-/episode-N` 中间态"这几个和结果无关的步骤，查完直接吐出终点地址：`/{locale}/drama/{slug-hash}` 或 `/{locale}/watch/{slug-hash}/{集数}`，一次 308 到位。

**为什么改**：多跳链路本身浪费抓取预算；更重要的是，这批 URL 目前能正常工作，但结构上和之前 500 故障的那批 URL 是同一类问题（都是多层重定向），提前压缩到 1 跳能消除下一次类似故障的一个复现路径，不是等它出问题了再修。

---

# P2：Sitemap 单文件过大，且两个文件的 hreflang 处理不一致

**问题**：`sitemap/0.xml` 15.2MB，24,968 条 URL，每条 URL 挂了完整的 21 语言 `hreflang` 块；`sitemap/1.xml` 3.2MB，10,974 条 URL，**完全没有 hreflang 标注**（连 `xmlns:xhtml` 命名空间声明都没有）。同样是剧集详情页，一半有多语言标注一半没有。

**怎么改**：
1. 按内容类型分文件重新组织：`drama-N.xml`（详情页，带完整 hreflang，按下面第 3 条分片）、`watch-N.xml`（播放页，见 P0）、`genre.xml`（分类页 4,912 条，一个文件装得下不用分片）、`blog.xml`（博客 7 条，同样一个文件够）
2. 建一个 `sitemap.xml` 总索引统领所有分片，`robots.txt` 从现在声明两条 sitemap 改成只声明这一条索引
3. 排查 `sitemap/1.xml` 缺 hreflang 的具体方法：从这个文件里随机抽 5-10 条详情页 URL，直接打开页面看源码里有没有 `<link rel="alternate" hreflang>` 标签——如果页面本身有标签但 sitemap 里没体现，是 sitemap 生成器读漏了多语言字段，是代码 bug；如果页面本身也没有这些标签，说明这批剧还没跑完多语言生成流程，是内容生产进度问题，要找内容生成那条 pipeline 对接，不是 sitemap 这边能单独解决的
4. 分片大小：带完整 hreflang 的文件控制在 5,000 条 URL 以内（21 条 hreflang 链接乘以 5,000，单文件大概 21×5000=10.5 万个 `<xhtml:link>` 标签，体积可控；不带 hreflang 的文件按 30,000 条封顶），现在 24,968 条已经到 15.2MB，继续按现在的比例涨下去会顶到 sitemap 50MB 的单文件硬上限

**为什么改**：文件太大会拖慢 Google 抓取和解析速度；两个文件 hreflang 标注不一致，如果是漏掉的那批，这些剧的非英语版本可能在多语言层面上没有被正确关联，等于把 P0/P1 之前讨论过的 hreflang 收益少发挥了一半。

---

# P3：首页模板落后于详情页模板

**问题 1**：首页 H1 是 Hero 轮播剧名（"Pregnant by My Ex's Professor Dad"），随轮播变化，和 `<title>`（"DramaShortsTV - Watch short dramas, free episodes every day"）语义不一致。详情页的 H1 就是剧名本身，和 title 一致，首页没跟上。
**怎么改**：H1 改成承载首页自身主题的文案，直接复用 title 的核心表达。Hero 区剧名换成非 H1 标签。
**为什么改**：H1 是页面主题信号，现在被会变化的轮播内容占用，Google 每次抓取拿到的首页主题信号不一致。

**问题 2**：首页 meta description 嵌了实时计数器："Stream 3686 vertical short dramas..."，数字随库存变化。
**怎么改**：换成静态文案，或把更新频率降到按周/按月。
**为什么改**：Google 每次抓取看到的文案不一样，大概率判定为不稳定内容，放弃这段文案自己截正文当摘要，CTR 文案白写。

**问题 3**：首页 Schema 只有 `Organization` + `WebSite`（无 `SearchAction`），详情页已经有 `BreadcrumbList` + `FAQPage`。
**怎么改**：给 `WebSite` 加 `potentialAction: SearchAction`，加 `FAQPage`，给首页剧集货架加 `CollectionPage`/`ItemList`，直接复用详情页模板已经在跑的实现。
**为什么改**：首页通常是权重最高的页面，Schema 落后于详情页是在浪费这个页面本可以拿到的搜索结果富媒体展示机会。

---

# P4：播放页缺 VideoObject

**问题**：播放页（`/bg/watch/.../1`）Schema 是 `TVEpisode` + `BreadcrumbList` + `Organization` + `WebSite`，没有 `VideoObject`。

**怎么改**：补齐 `VideoObject`，至少含 `name`、`description`、`thumbnailUrl`、`uploadDate`、`duration`、`contentUrl`/`embedUrl`。

**为什么改**：过去 7 天全站 63%（3,803/6,035）的点击来自 Google 标记为"视频"类型的搜索结果，这类富媒体结果的资格依赖 `VideoObject`。现在的播放页模板缺这个字段，等于给已经证明有效的流量入口留了技术缺口。

---

# P5：分类标签滥出，120+ 个标签里大部分是零搜索量的剧情元素词，且缺 Schema

**问题**：`/en/genre` 列出 124 个标签，相当一部分是从剧情里提取的场景/桥段词，不是观众会搜的分类词：`banquet`（宴会）、`villa`（别墅）、`mansion`（豪宅）、`apartment`（公寓）、`street`（街道）、`too-late`（为时已晚）、`regrettable`（令人遗憾）、`playing-the-fool`（装傻）。这些标签乘以 18 个语种，等于 2000+ 个页面。dramashortstv 自己此前已经验证过：10 个题材词里只有 billionaire 一个能进 Google 搜索结果第一页，命中率 1/10。抽查了 `/en/genre/billionaire` 这个已验证有效的分类页，Schema 只有 `Organization` + `WebSite`，没有 `BreadcrumbList`，也没有 `CollectionPage`/`ItemList`。

**怎么改**：
1. 已验证有搜索量的词（billionaire 这类）保留，补上两段 Schema，可以直接照抄这个结构，字段从页面已有数据填：
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://dramashortstv.com/en"},
    {"@type": "ListItem", "position": 2, "name": "Billionaire", "item": "https://dramashortstv.com/en/genre/billionaire"}
  ]
}
```
```json
{
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": "Billionaire short dramas",
  "url": "https://dramashortstv.com/en/genre/billionaire",
  "mainEntity": {
    "@type": "ItemList",
    "itemListElement": [
      {"@type": "ListItem", "position": 1, "url": "https://dramashortstv.com/en/drama/..."},
      {"@type": "ListItem", "position": 2, "url": "https://dramashortstv.com/en/drama/..."}
    ]
  }
}
```
`ItemList` 里的 `itemListElement` 用页面当前网格已经在渲染的那批剧列表就行，不用另外取数据。
2. 其余 100+ 个标签不用逐个查关键词工具，按两条现成依据分桶处理：
   - **按词的性质判断**：题材词（billionaire、ceo、mafia、revenge、romance、fantasy、werewolf 这类真实存在的短剧套路分类）留下；剧情元素词（banquet、villa、mansion、apartment、street、too-late、regrettable、playing-the-fool 这类从剧情里拆出来的场景/桥段描述）默认处理掉，不用逐个证明"确实没人搜"
   - **拿不准的边界词用 GSC 现成数据判断**：把 GSC 效果报表里 `/genre/` 路径的展示数据拉出来看，有展示记录的留下，没有的处理掉——不用新开关键词调研，现成数据就能看。已经拉过两份导出（7天窗口 + 最新24小时窗口）验证，`/genre/` 路径一条展示都没有出现在页面列表里
3. 处理掉的标签页：要么加 `<meta name="robots" content="noindex, follow">`（页面留给用户筛选用，不让 Google 收录，但页面之间的链接权重还能传递），要么从可索引导航里去掉，改成纯前端筛选参数（比如 `?tag=banquet`，不单独生成 `/genre/banquet` 这个路径），两种方案二选一，不用都做

**为什么改**：大量薄内容页会拖累全站的质量信号，不只是这些页面自己不排名，可能连表现好的页面也被拖累。已验证有效的分类页反而 Schema 不完整，是明摆着的浪费。

---

# P6：推荐模块的缩略图缺 alt 文本

**问题**：详情页抽查了 68 个 `<img>` 标签，55 个 `alt=""`。其中一部分是装饰性图标（logo、模糊背景图），配 `aria-hidden="true"` 和空 alt 是正确做法，不用改。但"你可能还喜欢"推荐模块里的剧集缩略图也是空 alt——这些图片代表的是具体某部剧，属于实质内容，不是装饰。

**怎么改**：推荐模块是从"剧集列表"数据渲染出来的组件，每张卡片本来就带着对应剧的 `name` 字段（卡片上显示的标题文字就是从这个字段来的）。改动在渲染这批卡片的组件里，把 `<img>` 的 `alt` 属性绑定到同一个 `name` 字段，例如 `alt={drama.name}`，不用另外查数据、不用人工逐条填，一次组件改动全站生效。

**为什么改**：图片 alt 是图片搜索和无障碍访问的基础信号，推荐模块出现在几万个详情页上，是个规模不小的、目前完全没利用的信号来源。

---

# P7：URL 里的哈希后缀可以缩短，但不能去掉

**问题**：播放页/详情页 URL 里带一串 24 位哈希，例如 `doctor-boss-is-my-baby-daddy-6825b1afb6c3cf13af0e26a6`。查证：这串哈希不是没意义的——分类页链接列表里能找到两部不同的剧，标题翻译成保加利亚语后生成同样的 slug（`джин-по-договор`），只有哈希后缀不同，靠这个区分。去掉哈希会导致这两个 URL 互相覆盖。

**怎么改**：不去掉，缩短。截取哈希后 6-8 位拼进 slug，不用完整 24 位。当前库存规模下，8 位十六进制的碰撞概率可以忽略（16^8 ≈ 43 亿种组合）。

**为什么改**：Google 官方说明 URL 长度不是排名因子，这条不影响收录和排名，只影响 URL 在 SERP 展示、被分享时的可读性。优先级最低。

---

# P8：小说层暂不启动

对标文档里提出的"要不要做小说层"这个决策，在 P0-P5 落地之前不启动。现在最大的单一资产（剧集 38000 系列）还在从迁移故障里恢复，这时候开一条新内容产线，资源和优先级判断都不对。等 P0-P5 上线、GSC 数据确认恢复，再评估。

---

# 待确认（不算 bug，但要有人拍板）

`https://dramashortstv.com/detail/49020` 跳转落在一篇博客文章（`/en/blog/id-rather-marry-the-beast-than-you`），不是这部剧对应的详情/播放页。如果这部剧在新架构里还存在，映射表指错了目标；如果已经下架并入博客，跳转不用改，但要记录下来避免以后重复排查。

---

# GSC 数据：故障期和修复后的对比，现在还看不出结论

| 窗口 | 总点击 | 总展示 | 数据源 |
|---|---|---|---|
| 8/29 – 8/30（500 故障期间） | 1,861 | 14,241 | GSC 导出 2026-08-30，"过去24小时"筛选 |
| 8/31 – 9/1（P0 核心项已修复） | 855 | 7,461 | GSC 导出 2026-09-01，"过去24小时"筛选 |

修复后这个窗口点击和展示反而低了一半左右。这不代表修复没用：GSC 数据有 2-3 天延迟，且 URL 能打开不等于 Google 立刻恢复排名信任，重新建立信任通常需要几天到两周。现在两个窗口的时间跨度不够下结论，需要再等 3-5 天、拉新的 24 小时窗口才能判断修复有没有起效。

---

# 执行顺序

| 优先级 | 内容 | 前置条件 |
|---|---|---|
| P0 | 播放页补 sitemap | 无，立即做 |
| P1 | 裸 ID 旧 URL 重定向压缩到 1 跳 | 无，立即做 |
| P2 | Sitemap 按内容类型分片、修 hreflang 缺失、控制单文件体积 | 可与 P0 合并执行 |
| P3 | 首页 H1/meta description/Schema 三项补课 | 可独立排期 |
| P4 | 播放页补 VideoObject | 可独立排期 |
| P5 | 分类标签分层处理 + 补 Schema | 可独立排期 |
| P6 | 推荐模块图片补 alt 文本 | 可独立排期，优先级低 |
| P7 | URL 哈希后缀缩短 | 可独立排期，优先级最低 |
| P8 | 评估是否启动小说层 | 等 GSC 数据确认恢复后再定 |
