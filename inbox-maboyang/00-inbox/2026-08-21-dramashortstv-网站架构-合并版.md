---
title: dramashortstv.com 网站架构（合并版）
date: 2026-08-21
更新: 2026-08-23 —— 分类页（/genre/）命名与获客能力结论修正，见二节和四节，详细数据见 02-keyword-research/2026-08-21-dramashortstv-分类页题材词验证.md
说明: 合并自「网站架构方案」+「产品页面架构方案」两份文档，只保留结论，去掉推导过程。要看依据和调研细节，翻旧文档。
参照: reelshort.com（产品页实测）+ reelpulse.net（内容营销层实测，外链方式不学）
---

# dramashortstv.com 网站架构

网站分两层：**产品层**（用户实际看剧的页面）+ **内容层**（博客，负责从 Google 带人进来）。两层功能不同，下面分开说，但是同一个站。

---

## 一、站点地图

```
/                              首页

── 产品层 ──
/genre/[题材]/                  分类页：按题材/套路筛选（Billionaire、Revenge、Werewolf、Mafia、BL...）
/actor/[演员]/                  分类页：这个演员演了哪些剧
/drama/[剧名]/                  剧集详情页
    /drama/[剧名]/episode-1/     播放页（嵌套在剧集详情页下）

── 内容层（博客）──
/blog/short-drama-app-safety-guide/         安全指南（已成稿）
/blog/dramabox/、/blog/reelshort/...        App 档案页（一个 App 一篇）
/blog/dramabox-vs-reelshort/                对比测评
/blog/best-[app]-shows/                     品牌剧单（接裸品牌词流量）
/blog/short-drama-tropes-explained/         题材套路大全（枢纽页）
/blog/best-bl-drama-apps/                   BL 细分推荐
/cast/[演员]/                   演员内容页（人物介绍，区别于 /actor/ 分类页）
```

---

## 二、产品层：四类页面长什么样

**首页**：Hero 轮播（大图+剧名+题材标签+简介+Play）+ 下方横向货架（New Release 等）+ "正在热映"模块（Google Trends 验证的上升剧，每周更新）。

**分类页**：顶部一条可横滑的标签栏（题材/套路标签 + 演员标签混排），下方是剧集网格卡片（图+简介摘要+播放量/收藏量+Play）。URL slug 用产品真实标签体系（如 billionaire、mafia、werewolf）。**分类页基本没有独立获客能力**——测了 10 个题材词（drama/movies 两种容器词都试过），命中率 1/10，只有 billionaire 一个例外能挤进"billionaire movies"搜索结果第一页（reelshort.com 排第 4，靠的是 `<title>` 写"Billionaire Movie List"）；mafia、romance、werewolf、historical、revenge、dragon、prison、steamy、enemies to lovers 全部被 IMDb/Netflix/Reddit 等主流影视站占满。**分类页的定位跟剧集页一样是转化/导航，不投产能做 SEO**，唯一动作是把 billionaire 分类页的 `<title>` 顺手写成"Billionaire Movie List"这类措辞去接那一小部分流量。详见分类页题材词验证文档。

**剧集详情页**：海报 + 标题 + 播放量/收藏量 + 完整标签（题材+套路+角色原型，一部剧挂 10+ 个标签很正常）+ Watch Now/收藏/分享 + 集数缩略图网格 + 完整剧情简介 + "你可能还喜欢"相关剧推荐。

**播放页**：播放器 + 本集简介 + 本集专属标签 + 点赞/收藏/分享 + 集数导航网格（未解锁集数带锁图标）。

**演员相关，两个页面不要混**：`/actor/[人]/` 是"这人演了哪些剧"的列表页；`/cast/[人]/` 是"这人是谁"的介绍页（年龄、出身这类粉丝关心的问题）。两种搜索意图不一样，别塞进同一个页面。

---

## 三、内容层：六类文章

| 类型 | 举例 | 做法 |
|---|---|---|
| 安全指南 | is ReelShort/DramaBox safe | 一篇覆盖所有 App 的"是否安全"变体，不用每个 App 单独写 |
| App 档案页 | DramaBox 是什么、多少钱、怎么退订 | 一个 App 一篇，覆盖价格/评价/订阅信息 |
| 对比测评 | DramaBox vs ReelShort | 两两对比 |
| 品牌剧单 | "在 ReelShort 上必看的 N 部剧" | 用来接 `dramabox`/`reelshort` 这类巨量裸品牌词的流量，不正面硬刚品牌词排名 |
| 题材枢纽页 | 短剧十大套路解释 | 一篇讲完 billionaire/revenge/werewolf/BL 等套路，链到对应 `/genre/` 分类页 |
| 演员内容 | 演员是谁、多大、演过什么 | 图鉴+个人页结构 |

---

## 四、已经拍板的几条规则

1. **受众定位是短剧观众**。不做面向创作者/投资人的内容（行业新闻、如何入行、如何投稿、选角试镜类关键词），这些已经从选题库里拿掉。
2. **dramashortstv.com 和 dramafinds.com 是两个独立站**。不做重定向、不做跨域 canonical——两者都等于告诉 Google"这是同一个东西"，和"独立站"矛盾。各自做好自己的 canonical，剩下靠内容差异化去竞争 Google 判给谁。
3. **产品层（剧集详情页/播放页 27,515 个 + `/genre/` 分类页）负责转化，不负责获客**。剧集页内容和 dramafinds.com 高度重复；分类页题材词经两轮验证（drama/movies 两种容器词，共 10 个词做过 SERP 核查）命中率只有 1/10（例外仅 billionaire），基本没有独立获客能力。真正带新用户进来的是内容层博客，产能应该主要投在这里。
4. **reelpulse.net 的内容打法学，外链方式不学**——它的外链档案有明显买链/PBN痕迹（87% 引荐域名 AS<10，35% 来自摩尔多瓦），架构和内容是它做对的部分，外链是冒险的部分。

---

## 五、Schema 标记

| 页面 | 用什么 |
|---|---|
| 剧集详情页 | TVSeries |
| 播放页 | TVEpisode + VideoObject |
| 分类页 | CollectionPage + ItemList |
| 演员页 | Person |
| 博客文章 | Article / FAQPage |

---

## 六、还没定的事

- 网页端付费墙怎么做：跟 reelshort.com 一样引导下载 App 解锁，还是网页也能直接付费——产品/工程决定
- `/drama/` 详情页的原创简介谁来写、写多少部的量——需要排产能
