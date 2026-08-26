---
title: 技术 SEO 审计 · dramafinds.com
date: 2026-08-14
审计对象: https://dramafinds.com/
方法: 实抓 + `curl | grep` 验证 Schema/canonical（WebFetch 读不到 head，不可用）+ Google 实搜核实收录
---

# 技术 SEO 审计 · dramafinds.com

## 零、站点概况

| 项 | 实测 |
|---|---|
| 域名注册 | **2026-07-03**（审计时 **6 周**） |
| 月访问量 | **649** |
| 技术栈 | Next.js（`x-powered-by: Next.js`），服务端渲染 |
| URL 总量 | **27,558**（27,515 个 detail + 34 篇 blog + 9 个静态页） |
| 语言 | **21 种**（en 3,580 / in 2,263 / th 2,172 / zh-TW 2,147 / ja 1,846 / es 1,776 …） |
| 内容类型 | 微短剧（ReelShort / DramaBox 赛道） |

**这是一个 6 周龄、2.7 万页的程序化 SEO 站。** 审计按「程序化站的三大风险」展开：索引路径、内容厚度、重复与规范。

---

## 一、🔴 严重问题

### 1.1 `/en/` 的 canonical 全部指向不在 sitemap 里的 URL

**实测：**

```
sitemap 提交            https://dramafinds.com/en/detail/7875   （共 3,580 条 /en/ URL）
该页 canonical 指向      https://dramafinds.com/detail/7875      （无语言前缀）
/detail/* 在 sitemap 中  0 条（两个 sitemap 都查过）
```

**抽样验证**：`/en/detail/7875`、`/en/detail/8000` 的 canonical **全部**指向 `/detail/{id}`。
**其他 20 种语言是自指 canonical**（`/de/detail/7870` → `/de/detail/7870`），**只有 `/en/` 是这样。**

**内容确实重复**：`/detail/7875` 与 `/en/detail/7875` 正文均 354 词，**文本相似度 100.0%**。

> ### 后果
> **sitemap 提交的 3,580 个 URL（占全站 13%）会被 Google 判为「备用网页（有适当的规范标记）」而不索引**；被索引的是 `/detail/*`，而那批 URL **从未被提交**，只能靠 canonical 被动发现。

**Google 实搜已经证实**：`site:dramafinds.com` 的结果中，detail 页显示为 `dramafinds.com › detail`，**不是 `/en/detail`**。

**修复（二选一）：**

| 方案        | 做法                                                                 |
| --------- | ------------------------------------------------------------------ |
| **A（推荐）** | 把 `/en/detail/*` 的 canonical 改为**自指**，与其他 20 种语言一致                 |
| B         | 把 sitemap 里的 `/en/detail/*` 换成 `/detail/*`，并对 `/en/detail/*` 做 301 |

**不要维持现状**——现在是 sitemap 说 A、canonical 说 B、B 没提交，三方互相矛盾。

### 1.2 27,515 个页面零 Schema

**detail 页 Schema 检测结果：`{}`**（三个样本 `/en/detail/7875`、`/de/detail/7870`、`/es/detail/7876` 全部为空）。

影视内容页本应有的：

```
TVSeries / Movie      —— 告知这是影视作品
VideoObject           —— 视频富媒体结果
BreadcrumbList        —— 导航层级
AggregateRating       —— 若有评分
```

> **反差极大**：34 篇 blog 文章的 Schema 是齐全的（`BlogPosting` + `Organization` + `WebPage`）。
> **说明团队会做 Schema，只是没在占全站 99.8% 的页面上做。**

**这是本次审计投入产出比最高的一项**——模板级改动，一次生效 27,515 个页面。

### 1.3 21 种语言，hreflang 为 0

**三个样本页面的 hreflang 标签数：0 / 0 / 0。**

**而且这不只是「忘了加」，是架构上加不了：**

```
/de/detail/7870  →  "Zufälliger Ersatz für Alpha"
/es/detail/7876  →  "Sustituta Accidental para Alfa"
                    （同一部剧：Accidental Substitute for Alpha）
```

**同一部剧在不同语言下是不同的数字 ID。** 而 hreflang 需要知道「这个页面的西语版是哪个 URL」——**当前的 URL 结构（`/{lang}/detail/{数字ID}`）没有保存这个对应关系。**

**修复需要两步：**

1. **数据层**：为每部剧建立 `master_id`，记录各语言版本的 ID 映射
2. **模板层**：按 master_id 输出完整的 hreflang 组（含 `x-default`）

⚠️ **这是本次审计里唯一需要动数据结构的问题，成本最高，但不做则 21 种语言互相之间是重复内容的风险。**

### 1.4 首页 H1 是一部剧名

```
首页 H1：The Luna's Second Choice
```

**连续两次请求结果一致**，不是轮播随机。

**首页的 H1 应该说明站点是什么**（如 "Watch Free Short Dramas Online"，与 title 一致），**而不是某一部剧的名字**。现在等于告诉 Google：这个首页是关于 `The Luna's Second Choice` 的。

**修复成本极低**，改一个模板变量。

---

## 二、⚠️ 中等问题

### 2.1 detail 页内容过薄

| 页面 | 正文词数 | H1 | H2 | H3 |
|---|---:|---:|---:|---:|
| `/en/detail/7875` | **354** | **2（重复）** | 2 | 0 |
| `/de/detail/7870` | **200** | **2（重复）** | 2 | 0 |
| `/es/detail/7876` | **209** | **2（重复）** | 2 | 0 |

**两个问题：**
- **200–354 词**，HTML 却有 190–197KB——**正文占比极低，绝大部分是 JS bundle**
- **H1 出现两次且文字相同**——模板缺陷，一个页面应只有一个 H1

**建议补充的结构化内容**（都是数据库里已有的，不需要写作）：演员表 / 集数 / 时长 / 类型标签 / 上线日期 / 相似剧推荐。这同时能喂给 1.2 的 Schema。

### 2.2 图片未优化（媒体站的核心成本）

**首页实测**：

```
117 张 .jpg  +  52 张 .png  =  169 张
webp / avif：0 张
走 next/image 优化的：仅 14 张
```

**一个影视站首页放 169 张未优化的位图，其中 92% 绕过了 Next.js 的图片优化管道。**

**修复**：全部改走 `next/image`，输出 webp/avif。这是 Next.js 项目的标准配置项。

### 2.3 加载性能

| 页面 | HTML 体积 | TTFB | 总耗时 |
|---|---:|---:|---:|
| 首页 | **464 KB** | 1.39s | **2.09s** |
| detail 页 | 197 KB | 0.81s | 1.26s |
| blog 页 | 172 KB | 1.04s | 1.46s |

**首页 464KB 的 HTML 偏重**，配合 2.2 的 169 张未优化图片，移动端 LCP 大概率不达标。

⚠️ **本次未做 Core Web Vitals 实测**（需要 PageSpeed Insights 或字段数据），上述仅为服务端信号，不能直接当 CWV 结论。

### 2.4 test 子域曾被索引（已部分处理）

**Google `site:` 查询结果中出现 `https://test.dramafinds.com`。**

**当前状态实测**：

```
HTTP 404  +  <meta name="robots" content="noindex">   ✅ 已处理
但 robots.txt 仍是：User-agent: *  Allow: /
且声明：Sitemap: https://dramafinds.com/sitemap-index.xml   ← 生产站的 sitemap
```

**判定**：不是活的严重问题，索引里的是历史残留，会自然掉出。

**但 test 子域的 robots.txt 应改为 `Disallow: /`**——现在的配置是从生产站复制的，等于邀请抓取。

### 2.5 canonical 尾斜杠不一致

```
首页 canonical：  https://dramafinds.com     （无尾斜杠）
sitemap 里：      https://dramafinds.com/    （有尾斜杠）
```

**影响很小**（Google 会自行处理），但属于应该统一的低成本项。

---

## 三、✅ 做得好的部分

| 项 | 实况 |
|---|---|
| **blog 内容质量** | 1,313–1,614 词，**10 个 H2**，Schema 齐全（BlogPosting + Organization + WebPage），canonical 自指 |
| **robots.txt** | 干净，`Allow: /` + 正确声明 sitemap |
| **sitemap 结构** | 正确的 index → 子 sitemap 两层结构 |
| **服务端渲染** | curl 能直接拿到正文，AI 爬虫和 Googlebot 都能读到 |
| **lastmod 真实** | 8/11–8/14 分布，不是构建时间戳一刀切 |
| **多语言覆盖** | 21 种语言，且 blog 有本地化（罗马尼亚语等） |

---

## 四、修复优先级

| 顺序 | 问题 | 成本 | 影响面 |
|---|---|---|---|
| **1** | **1.2 加 Schema**（TVSeries/VideoObject/BreadcrumbList） | 中（模板级） | **27,515 页，一次生效** |
| **2** | **1.1 修 `/en/` canonical**（改自指） | **极低** | **3,580 页的索引路径** |
| **3** | **1.4 首页 H1 改成站点主题** | **极低** | 首页 |
| **4** | **2.1 detail 页去掉重复 H1 + 补结构化内容** | 中 | 27,515 页 |
| **5** | **2.2 图片改走 next/image + webp** | 低 | 全站性能 |
| **6** | 2.4 test 子域 robots 改 `Disallow: /` | 极低 | 防复发 |
| **7** | **1.3 hreflang**（需先建 master_id 映射） | **高，动数据结构** | 21 语言的重复内容风险 |
| **8** | 2.5 canonical 尾斜杠统一 | 极低 | 低 |

> **第 2、3、6、8 项加起来不到半天**，但覆盖了三个实质缺陷。
> **第 1 项是投入产出比最高的**——一次模板改动影响 2.7 万页。
> **第 7 项最贵，建议等前六项做完、看到索引和流量变化后再决定。**

---

## 五、一个需要说清楚的判断

**这个站 6 周龄、月访 649、2.7 万页。**

**页数与站龄的比例意味着它是纯程序化路线。** 这条路的成败不取决于本文列的任何一项技术修复，而取决于：

> **Google 愿不愿意收录并信任 2.7 万个平均 200–350 词的模板页。**

本次审计发现的技术问题（尤其 1.1 的 canonical 矛盾、1.2 的零 Schema）**会显著拖慢这个判断过程**，但修好它们也不保证收录。

**建议同时监测**：GSC 里「已抓取 - 尚未编入索引」和「已发现 - 尚未编入索引」两个桶的绝对数量。**如果修完技术项后这两个桶仍持续增长，那是内容层面的信号，加页不解决。**

---

*审计执行 2026-08-14。所有数字为实抓，Schema/canonical 用 `curl | grep` 验证，收录状态用 Google `site:` 实搜核实。*
*未做：Core Web Vitals 字段数据、外链档案、竞品对比、关键词覆盖分析。*
