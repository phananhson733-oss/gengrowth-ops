---
title: dramashortstv.com · 上线后技术 SEO 审计
date: 2026-08-27
样本: sitemap 全量 39,562 条 · 详情页 45 · 裸路径 120 · 跳转 60 × 2 形态 · 重复抓取 36 次
结论: 大改动已落地，但引入两个新的阻断级问题
---

# 上线后审计

> 测量须带 `Accept: text/html,...`；裸 curl 的 `*/*` 曾被判 404。全部串行。

## 一、已落地

| 项 | 实测 |
|---|---|
| **剧名写进 URL** | ✅ 39,562/39,562 全部带 slug，如 `/de/detail/7870/zufälliger-ersatz-für-alpha` |
| **分集独立路径** | ✅ `/video-play/{id}/{slug}/episode-{n}`，不再是 `?episodesNum=` 参数 |
| **sitemap ID 范围** | ✅ 7,870–**59,935**（上轮上限 38,105，漏掉全部新剧） |
| **sitemap 拆分** | ✅ `sitemap-index.xml` + `sitemap.xml`(56) + `drama-detail-sitemap.xml`(39,562) |
| **无跨语言重复提交** | ✅ 每个 ID 在 sitemap 中只出现一次，各归其语言 |
| sitemap URL 可达 | ✅ 120/120 → 200 |
| 详情页 schema | ✅ 45/45 BreadcrumbList + VideoObject |
| 详情页 H1 | ✅ 45/45 = 1 |
| 播放页 canonical → 详情页 | ✅ |
| 分集页 canonical 自指 | ✅ |
| `Accept: */*` 放行 | ✅ 20/20 · GPTBot 10/10 |
| for-you | ✅ noindex, nofollow + 自指 |
| 404 | ✅ noindex |
| www → apex | ✅ 301 |

## 二、阻断级问题

### 🔴 1 · 裸 `/detail/{id}` 对非拉丁剧名返回 500

```
非拉丁剧名  n=60   500: 50 (83%)   307: 10
拉丁剧名    n=60   500:  0         307: 38 · 308: 22

/en/detail/{id} 跟随跳转终点  n=40   200: 26 (65%)   500: 14 (35%)
```

非拉丁剧名占全站 **60.6%**（23,983 / 39,562）。合起来约**一半词条的裸路径打不开**。

实例：

```
/ja/detail/47870/雨に濡れた復讐の香り        200 ✅
/detail/47870                              500 ❌

/zh-TW/detail/25809/重生後-我成了反派的白月光長嫂   200 ✅
/detail/25809                                    500 ❌

/ko/detail/7940/걸크러시-사모님              200 ✅
/detail/7940                                500 ❌
```

**根因不是历史包袱，是链接生成器现在还在产出裸路径。**

```
/ja/search      11 条剧集链接  全部 /detail/{id}/日文剧名   → 500
/zh-TW/search   12 条剧集链接  全部 /detail/{id}/中文剧名   → 500
/search         12 条          拉丁剧名                    → 200
/ja  /zh-TW  /genre  /        服务端渲染 0 条 detail 链接（客户端渲染）
```

同一部剧，站内链接与 sitemap 对不上：

```
sitemap 登记   /ja/detail/42741/全市警報-裏社会の女王-吹き替え   → 200
搜索页链接     /detail/42741/全市警報-裏社会の女王-吹き替え      → 500
```

**日语与繁中的站内搜索页，每一条结果链接都是死的**，且每天持续新产生。

**英语片库不受影响。** 实测出链真实状态码：

```
英语页出链      18 条  →  200: 14 · 连接失败: 4 · 5xx: 0
语言前缀页出链  30 条  →  500: 21 (70%) · 307: 6 · 连接失败: 3
```

英语剧集住在裸路径上，不需要跳转，所以带重音的剧名也正常
（`/detail/59165/please-marry-my-fiancé` → 200）。
500 只发生在裸路径**需要跳转到语言前缀**时，Location 里的非 ASCII 未编码。

### 结论：**不阻塞 blog 工作，可延后**

抓取速率是整站的，不分语言目录，所以 33,114 条语言前缀页面产生的 5xx 理论上会拖低英语的抓取配额。但按 Google 自己的门槛，这个站属于擦边而非危险区：

> 适用对象为大型站（100 万+ 页面）内容每周变化，或中型站（1 万+ 页面）内容**每天**快速变化
> "If your site doesn't have a large number of pages that change rapidly, or if your pages seem to be crawled the same day that they are published, you don't need to read this guide."

本站约 3.96 万页面。**英语片库与 `/blog/*` 均为零 5xx**，新文章所在的 URL 空间是干净的；blog 只有几十个 URL，Google 会优先抓新鲜且有更新的小目录。

**处理方式**：先做内容，本项延后。修法二选一：

| 选项 | 代价 |
|---|---|
| A · 修链接生成器（输出带语言前缀，与 sitemap 对齐） | 一处改动 |
| B · 非英语页从 sitemap 移除 | 改 sitemap 生成 |

选 A 还是 B 取决于多语言是否继续做。

**回头处理的触发信号**：新文章发布后一周未收录，或 GSC「已发现-尚未编入索引」开始堆积。

裸路径的 Location 百分号编码修复为可选补网。

### 🔴 2 · 已删除的 blog 返回 500，且仍在 sitemap 中

```
sitemap.xml 共 56 条 · blog 48 · 其他静态页 8
blog 全量 n=48   →  200: 1（/blog 列表页） · 500: 47
其他静态页 n=8   →  200: 8
```

47 篇文章为拉开与 dramafinds 的内容差距已主动删除。**但删除后返回的是 500，不是 404/410，且 URL 仍全部留在 sitemap 里。**

Google 官方口径（Crawl budget 文档）：

> 站点返回 5xx 时，"the limit goes down and Google crawls less"
> 永久删除的页面应 "Return a `404` or `410` status code"，"`404` status code is a strong signal not to crawl that URL again"

**500 等于告诉 Google「服务器故障，稍后再来」**——它会反复重抓这 47 个地址，并把它们继续留在索引里，同时压低整站抓取配额。

**改法**：删稿返回 **410**，并从 sitemap 移除。

### 🔴 3 · canonical 与 robots 间歇性缺失

同一 URL 连抓 6 次：

```
/pt/detail/29342/o-último-deus-do-jogo              6/6 正常
/pt/detail/31335/cortando-lenha-rumo-à-imortalidade  4 正常 · 2 缺失
/it/detail/41879/amore-in-patto-con-il-capitano-…    3 正常 · 3 缺失
/detail/45558/breaking-free-from-their-thirst        6/6 正常
/detail/17411/don-t-mess-with-the-heiress            4 正常 · 2 缺失
/zh-TW/detail/26883/你是我掌心的朱砂痣                5 正常 · 1 缺失
────────────────────────────────────────────
36 次抓取中 8 次（22%）head 里既无 canonical 也无 robots
6 个 URL 中 4 个至少中招一次
```

状态码始终 200，只是 head 少了这两个标签。**Google 通常只抓一次**，撞上坏渲染就等于该页没有 canonical、没有索引指令。

## 三、其他待处理

| 序 | 问题 | 实测 |
|---|---|---|
| 🔴 3 | **题材分类页体系未落地** | `/genre?tag=1`、`/genre?tag=5` 与 `/genre` 同 title、同 H1，canonical 全部指向 `/genre`。全站只有 1 个题材页 |
| 🔴 4 | **test 子域仍在给 dramafinds 投票** | 完全未动：canonical → `dramafinds.com`、GA4 `G-589NVFPMGY`、AdSense `ca-pub-4100144534092026`、robots `index, follow`、title 带 "Dramafinds" |
| 🟠 5 | **跳转用 307 临时跳转** | 拉丁样本 60 个中 307 占 38、308 占 22。上轮第 4 项刚把 307 改成 301 并核实通过，新路由又用了 307，且 307/308 混用 |
| 🟠 6 | **`/en/detail/{id}` 两跳链** | `301 → /detail/{id} → 307/308 → slug`，中间那跳还可能 500 |
| 🟠 7 | **播放页仍缺 BreadcrumbList** | 播放页 schema 只有 VideoObject。上轮第 6 项遗留，未修 |
| 🟠 8 | **首页无 H1** | `/` 的 H1 数 = 0 |
| 🟡 9 | **与 dramafinds 仍 99.97% 重复** | 同秒配对：词数 7,946 : 7,946，全站只有品牌名一个词不同 |
| 🟡 10 | www 跳转落到 http | `www.dramashortstv.com` → 301 → `http://dramashortstv.com/`，多一跳升级 |

## 四、动手顺序

**结论：不阻塞 blog 工作，可以先做内容。** 英语片库与 `/blog/*` 均为零 5xx。

顺手做（在 blog 工作范围内）：

| 序 | 事项 | 成本 |
|---|---|---|
| 1 | 删稿改返 **410** 并从 sitemap 移除 | 小。更新内容时本就要重生成 sitemap；留着 500 会让 GSC 报告长期标红 |
| 2 | 查 canonical/robots 为何间歇性丢失 | 中。新文章通常只被抓一次，撞上坏渲染就没有 canonical |

延后，与 blog 并行或下个迭代：

| 序 | 事项 | 成本 |
|---|---|---|
| 3 | 链接生成器输出带语言前缀 URL（或非英语页移出 sitemap） | 小。触发信号见二·1 |
| 4 | test 子域下线或加认证 + `X-Robots-Tag: noindex` | 一条规则 |
| 5 | 307 统一改 301/308 | 小 |
| 6 | 播放页补 BreadcrumbList | 小 |
| 7 | 首页补 H1 | 小 |
| 8 | www 直接跳 https | 小 |
| 9 | 裸路径 Location 百分号编码 | 小，可选 |
| 10 | 题材分类页体系 | 中，已排期 |
| 11 | **与 dramafinds 文案分叉** | 大，需排期。blog 拉开的是内容差距，**首页与平台文案仍 99.97% 相同**，头部词仍在互打 |

## 附 · 复核命令

```bash
UA="Mozilla/5.0 (Macintosh) Chrome/128.0"
AC="Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"

# 1 · 非拉丁剧名的裸路径（应 301/308，现为 500）
for ID in 47870 25809 7940; do
  curl -s -o /dev/null -A "$UA" -H "$AC" -w "$ID  %{http_code}\n" \
    "https://dramashortstv.com/detail/$ID"; sleep 1
done

# 2 · canonical 间歇性缺失（连抓 6 次，应 6/6 都有）
for i in 1 2 3 4 5 6; do
  curl -s -A "$UA" -H "$AC" "https://dramashortstv.com/detail/17411/don-t-mess-with-the-heiress" \
    | grep -c 'rel="canonical"'; sleep 1
done

# 5 · 播放页 schema（应含 BreadcrumbList）
curl -s -A "$UA" -H "$AC" "https://dramashortstv.com/video-play/43873/his-vengeance-knows-no-blood-ties" \
  | grep -o 'BreadcrumbList\|VideoObject' | sort | uniq -c

# 8 · 首页 H1（应为 1）
curl -s -A "$UA" -H "$AC" https://dramashortstv.com/ | grep -c '<h1'
```
