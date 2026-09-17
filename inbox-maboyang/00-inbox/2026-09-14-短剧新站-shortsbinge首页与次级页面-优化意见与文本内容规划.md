---
title: ShortsBinge 网站结构与页面功能规划（整合版）
date: 2026-09-14
依据: 首页、Trending、Best Picks、Browse四页均已通过实测截图确认真实结构。本文档是多轮讨论后的最终整合结果，取代此前同名文档的历史版本
承接: 00-inbox/2026-09-08-短剧新站-网站架构设计-v2定稿.md、2026-09-14-短剧新站-域名候选清单-补充.md（域名shortsbinge.com已在demo footer里确认）
文案基调: 全站走营销化路线，不做"方法论透明"——用户要的是"哪部剧最精彩"，不是"我们怎么判断的"
站点定位: 短剧播放聚合 + 权威短剧评审双重定位。Best Picks不是短评卡片集合，是全站的blog内容展示位，承载剧集导读、对比测评这两类文章，直接复用dramashortstv.com已验证的blog SOP（05-blog/dramashortstv/2026-08-26-dramashortstv-blog写作SOP-v1.0.md），不用重新摸索内容类型
---

# ShortsBinge 网站结构与页面功能规划

## 一、整站结构

```
首页 /
├─ Trending（顶导航）/trending/
├─ Browse（顶导航）/browse/
│   └─ 具体分类落地页 /browse/[dimension]/[category]/
├─ Best Picks 精选列表（有URL，暂不上顶导航）/best-short-dramas/
│   └─ 单条精选详情页 /best-short-dramas/[slug]/

不做：Find a Drama、How We Choose
```

顶导航只保留两项：`Trending / Browse`。Best Picks和周报现阶段作为首页板块+可达链接存在，不占导航位置，等内容量够了再升级成导航项（见五、六节）。

---

## 二、首页 `/`

### 2.1 Title / Meta / H1

- Title：`ShortsBinge — The Short Dramas Worth Your Time`
- Meta description：`The best short dramas, ranked and reviewed. Binge-worthy picks updated weekly — skip the duds, watch the hits.`
- H1（常驻不变，不随每周换片变化）：`Your Next Binge Is Already Here`
- 副标题：`Fan favorites, fresh picks and the dramas everyone's talking about — all in one place.`

Featured卡片自己的剧名标题是页面里的H2，不占用H1。

### 2.2 板块，按页面顺序

1. **Featured卡片**：每周人工换片。类目标签+状态标签（完结/集数/免费集数）+热度标签（`🔥 Trending`/`Editor's pick`）+剧名（H2）+两三句钩子简介+一句话推荐语（突出亮点，不需要带缺点）。选片标准：复用"爆款早期识别机制"（GSC查询词增长+竞品榜单+Trends）
2. **搜索框**：按标题/演员搜索，跳转结果页（复用Browse列表组件），不做高级搜索
3. **Trending预览**：当前榜单前4条，"See what's trending"链接到`/trending/`
4. **Best Picks预览**（blog内容展示位）：2-4篇文章的卡片，"See all picks"链接到`/best-short-dramas/`。卡片结构：文章类型标签（`Watch Guide`/`Comparison`）+剧名（单剧导读）或对比对象（比如"X vs Y"）+一句话钩子+推荐强度badge。点进去是完整文章，不是短评弹窗
5. **New releases**：最近上线新剧，`NEW`徽章+剧名+上线日期+集数+免费集数，纯事实陈述，第一天就能满血上线
6. **Browse快捷入口**：几个精选trope/mood分类卡片，链接到`/browse/`对应分类
7. **This Week入口**：链接到当期`/this-week/[date]/`，标题走轻松口吻，比如`This Week in Short Dramas`
8. **Footer**：`Discover`（Trending/Browse/Best Picks）+ `Company`（About/Contact/Privacy/Copyright）。不再设`Trust`栏——Methodology/Editorial policy/Corrections这几条都是方法论内容，已经拿掉

---

## 三、Trending `/trending/`

- 标题：`What Everyone's Watching This Week`，副标题：`The dramas everyone's talking about right now.`
- tab：`All / Search`（Search对应真实的GSC+竞品+Trends数据源，不做Social/Platform/On-site interest）
- 榜单按状态分档展示（Breakout/Rising/Stable这类词本身够营销化，可以保留），每条：状态徽章+剧名+类目标签+一句抓人简介+CTA跳转剧集详情页。**不显示`Observed: [日期区间]`这类日期字段**，也不解释"为什么算热"

数据来源：优先接真实数据管道（GSC查询词增长+竞品榜单+Trends交叉验证），首页预览从这一页的真实结果取值。

空状态：真实信号不够时，用编辑精选补位填满榜单，不显示"暂无数据"这类扫兴文案。

---

## 四、Browse `/browse/`

这是全站唯一的分类目录页，承接trope/genre/mood类长尾搜索词，**不做成blog**——目录"建一次、持续加新剧"的维护模式和blog"持续产出新文章"是两种不同性质的内容资产，两者以后可以并存，不互相替代。

- 标题：`Browse by story, mood or platform`，副标题：`Genre explains what the story is; trope explains the narrative setup; mood explains the experience a viewer wants.`
- 五个维度tab：Genres / Tropes / Watch moods / Platforms / Collections
- 每个维度下的分类卡片：`reviewed titles`数量+分类名+一句话说明这个分类好看在哪，写出跟相邻分类的差异点

**具体分类落地页**（比如"Secret billionaire"）：
- 分类名 + 2-3句介绍文字（这个trope通常怎么展开、最抓人的情节钩子）
- 该分类下的剧目列表（editorial reviewed，不是全量目录）
- 支持跨维度组合筛选（比如"Fantasy genre" + "One-night binge mood"同时选），派生更多长尾组合页面

---

## 五、Best Picks `/best-short-dramas/`（全站blog内容展示位）

这不是短评卡片集合，是全站的**编辑内容/blog中心**，对应"权威短剧评审"这半定位。内容类型直接复用dramashortstv.com已验证的blog SOP，不用重新设计：

- **剧集导读**（对应dramashortstv SOP里"单剧观看指南"这类已验证格式）：单部剧的完整介绍——免费集数在哪结束、人物关系、剧情走向、值不值得看完，参考已发布的Reborn to Rule the Sky系列写法
- **对比测评**（对应SOP里"对比测评"锁定模板）：两部同类型剧的对比，或者"XX类型最好看的N部"这种榜单型文章

**现阶段不上顶导航**，只作为首页板块+一个可达的简化列表页存在：

- 简化列表页：不带筛选tab，纯列表，每条：文章类型标签+剧名/对比对象+一句话钩子+`Best for`
- **每篇文章有自己的独立URL**（这条不受"要不要做导航页"影响，任何阶段都要做）：完整文章（剧集导读或对比测评），能被索引和分享，这才是这个板块真正的SEO价值所在——独立文章能承接"XX剧值不值得看"、"XX vs YY哪个好看"这类具体查询词，比短评卡片能承接的搜索意图深得多
- badge三档：`Strong pick / Worth trying / For trope fans`（去掉`Mixed`），作为文章列表页的快速标签，不影响文章本身内容
- **不做**`Main limitation`字段、**不做**`Reviewed: [日期]`字段——这两个是方法论产物，营销方向不需要

筛选逻辑：如果/当升级成带筛选的完整页面时，筛选tab可以跟Browse共用词汇（Romance/One-night binge这类），**但筛选结果不生成独立可索引URL**，纯前端状态切换即可，避免跟Browse的同名分类页竞争同一个搜索词。

产能：每篇文章真人观剧后手写，先定每周产出几篇，不承诺覆盖全站。这条产能跟dramashortstv那边的blog产能是两条独立的线，需要单独规划人力，不能共用同一批产出。

**升级为顶导航项的时机**：文章攒到20篇以上、能撑起分类浏览时，再把简化列表页升级成带筛选tab的完整页面，并加入顶导航。

---

## 六、This Week 周报 `/this-week/[date]/`

每周发布一次，汇总当周新剧上线+热度变化+编辑精选，天然适合外链——复用astrologywiki外链SOP已验证的"可引用周期性内容"打法。现阶段作为首页入口存在，不上顶导航，理由同Best Picks：内容积累到一定期数（比如8-10期）、形成稳定的可信度后再考虑升级。

---

## 七、不做的两个页面

- **Find a Drama**：截图搜索/视频链接搜索/剧情描述搜索这类高级功能暂不实现，首页搜索框保持普通标题/演员搜索即可
- **How We Choose**：方法论说明页整体拿掉，footer的Methodology链接也一并删除，跟"营销化文案、不讲方法论"的方向保持一致

---

## 八、需要请彪哥配合的产品层改动

这几条不是文案能解决的，是当前demo已经做出来的字段/结构，需要产品/开发层面配合：

1. Trending页信号tab从四个砍到两个：`Social`/`Platform`/`On-site interest`连同展示逻辑一起拿掉，只留`All`和`Search`
2. Trending页去掉`Observed: [日期区间]`结构化字段
3. Best Picks去掉`Main limitation`结构化字段
4. Best Picks去掉`Reviewed: [日期]`结构化字段
5. Best Picks的badge从四档砍到三档，去掉`Mixed`
6. Best Picks和周报**暂不接入顶导航**，先以首页板块+独立URL的形式存在
7. Footer的`Trust`栏（Methodology/Editorial policy/Corrections）整体移除

---

## 九、其他下一步

1. Trending页真实数据管道是当前最优先要跟彪哥/产品对齐的技术依赖，建议单独列一份交办文档，可以和第八节一起提
2. Best Picks每条精选需要独立URL，需要确认前端路由设计支不支持
3. 封面图素材来源仍未确认
