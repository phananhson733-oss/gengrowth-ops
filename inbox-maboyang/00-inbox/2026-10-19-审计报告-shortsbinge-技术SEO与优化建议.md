---
title: 审计报告 · shortsbinge.com 技术 SEO 与优化建议
date: 2026-10-19
status: ready-for-review
version: v1.2
scope: 技术抓取、索引、国际化（hreflang）、结构化数据、性能、移动端、内容与内链
method: Chrome 155 无头渲染 + 41 个子 sitemap + robots/响应头/结构化数据检查；GSC 数据使用本机 Crawl Stats 导出（2026-10-08、2026-10-19 两份），未接入 GSC/GA API
---

# 审计报告 · shortsbinge.com

## 0. 一句话结论

**基础技术是扎实的：SSR 内容完整、canonical 干净、404 正确、schema 覆盖到剧集/单集/文章、图片全部有 alt、移动端无横向溢出。**

**真正的短板在国际化和抓取健康：18 个语种的详情页没有有效的 hreflang（只用了 `<a hreflang>`，Google 不认），本地化模板的 title/H1/单集标签仍是英文；同时 10-19 的 Crawl Stats 显示 4XX 仍占 16.87%，10-11 起抓取量骤降到日均几十次，需要优先排查。**

---

## 1. 审计范围与方法

| 项目 | 说明 |
|------|------|
| 抓取方式 | Chrome 155 无头渲染（Vercel 安全挑战会拦截 curl，静态 HTML 不可直接取） |
| 样本 | 30+ URL：首页、trending、browse、genre、identity、语言分页、剧集详情、单集 1/2、本地化首页（19 个）、本地化详情、文章页、404、search |
| Sitemap | 索引 41 个子 sitemap；EN 剧集 9,430 条；JA 4,036 条；PT 3,344 条 |
| 检查项 | 状态码、canonical、robots、hreflang、JSON-LD、标题/描述/H1、图片 alt、内链、响应头、lab CWV、移动端 |
| 未覆盖 | GSC/GA API、索引量、GA 行为数据、field CWV、真实 Googlebot 抓取日志、排名/流量 |

> 结论里的"影响"是基于公开抓取和 SEO 机制的判断，不是流量预测。涉及 Googlebot 的部分必须在 GSC/Vercel 日志里最终确认。

> **数据来源与更正（v1.1 → v1.2）**：v1.0 写成时尚未发现本机 GSC 导出，因此范围表写了“未接入 GSC”；后来补 P0-1 时使用了 `~/Downloads/https___shortsbinge.com_-Crawl-stats-2026-10-08/响应表格.csv`（文件时间 2026-10-08 03:27，数据覆盖 2026-09-16~10-05）。这不是 API 拉取，也没有编造；但初版没有同步修改范围说明，造成“未接入 GSC”与“引用 GSC 数字”自相矛盾，属于文档错误。v1.1 已修正，并把 P0-1 降级为“待核实”。v1.2 补入 2026-10-19 导出（覆盖至 10-16）：4XX 占比降到 16.87%，但绝对数没降、抓取量从 10-11 起骤降，因此 P0-1 改为“P0（调查）”，归因仍待 GSC 后台拆分 4XX。

---

## 2. 发现总表

| # | 问题 | severity | 影响面 | 修复成本 | 负责人 |
|---|------|----------|--------|----------|--------|
| 1 | 抓取健康异常：4XX 占比 16.87% + 抓取量骤降（归因待核实） | **P0（调查）** | 全站索引 | 1 小时确认 | 运维/SEO |
| 2 | 详情页（剧/单集/文章）缺 `<link hreflang>` | **P0** | 1 万–3 万本地化 URL（JA/PT 已验证） | 1–3 天 | 前端 |
| 3 | 本地化模板半翻译：title/H1/nav/单集标签仍英文 | **P0** | 18 个语种 | 1 周（先 5 个语种） | 内容/前端 |
| 4 | hreflang 覆盖不一致：静态页 20、文章 0、详情 0 | **P1** | 全站 | 2–3 天 | 前端 |
| 5 | Sitemap 不含 hreflang alternates | **P1** | 大规模本地化 | 2 天 | 后端 |
| 6 | 语言列表分页：99 页/语种，自 canonical 且可索引 | **P1** | ~1.9k 页 | 1 天 | 后端 |
| 7 | HTML 无 CDN 缓存（`max-age=0`） | **P1** | 抓取/速度 | 1 天 | 后端 |
| 8 | 结构化数据缺字段（Org logo/sameAs、Article image、VideoObject contentUrl/duration） | **P2** | 富结果/E-E-A-T | 2–3 天 | 前端 |
| 9 | 大写 URL 返回 200（应 301） | **P2** | 重复 URL | 0.5 天 | 后端 |
| 10 | robots 把单集 2+ 全禁；需确认只有 ep1 免费 | **P2** | 免费集曝光 | 0.5 天确认 | 产品/SEO |
| 11 | 本地化详情页内链弱：EN 详情只链到 pt 译文，JA 单集的 en 链接指向首页 | **P1** | 发现与权重 | 1 天 | 前端 |
| 12 | 深分页/半翻译页可能稀释站点质量 | **P2** | 中长期 | 2 周 | 内容/SEO |

---

## 3. 详细发现

### P0-1（待归因）· 抓取健康异常：4XX 高 + 抓取量骤降

> 状态：P0（调查优先级）。4XX 具体归因仍未核实；先查清原因，再决定修复资源。

**现象**

所有非浏览器请求（curl、Googlebot UA、Bingbot UA）都返回：

```text
HTTP/2 429
server: Vercel
x-vercel-mitigated: challenge
```

浏览器（Chrome）能自动完成挑战并拿到 200。

**这意味着什么**

- 这是 Vercel 的 Bot Protection / Security Checkpoint，不是站点故障；
- 对普通用户和真实浏览器无影响；
- **对已验证的 Googlebot，Vercel 通常会放行**，但"通常"不等于"当前配置一定放行"。

**GSC Crawl stats：10-08 与 10-19 两份导出对比**

| 指标 | 10-08 导出（至 10-05） | 10-19 导出（至 10-16） |
|------|------------------------|------------------------|
| 成功 (200) | 79.46% | 82.53% |
| 其他客户端错误 (4XX) | 19.94% | **16.87%** |
| 404 | 0.04% | 0.04% |
| 未知（请求失败，按文件类型） | 19.98% | 16.91% |
| 抓取请求总数 | 61,220 | 74,927 |

**占比降了，绝对数没降**：4XX 从约 12,207 次变成约 12,640 次（+3.5%）；未知失败从约 12,232 次变成约 12,670 次。所谓“改善”主要是总请求量变大的稀释。

**更严重的是抓取量骤降**：

| 日期 | 抓取请求 |
|------|----------|
| 10-09 | 8,365 |
| 10-10 | 1,301 |
| 10-11 | 59 |
| 10-12 | 78 |
| 10-13 | 80 |
| 10-14 | 7 |
| 10-15 | 24 |
| 10-16 | 11 |

10-11 ~ 10-13 合计 217 次，日均约 72 次；10-11 ~ 10-16 合计 259 次，日均约 43 次。对一个有 10 万级 URL 的站，这个量级不正常。

同期平均响应时间：10-12 1,019ms、10-13 1,971ms、10-15 2,374ms（10-16 回落到 439ms）。样本很小，单日数字会被少量慢请求放大，但趋势值得警惕。

**归因仍然不能下结论**：4XX 是聚合值，没拆 403/429/400/410，也没有 Googlebot 维度；10-14 之后可能还受 GSC 数据延迟影响。**但“抓取量 collapse”本身已经足够构成 P0 调查优先级**，不需要先证明是 Vercel。

**怎么确认（今天做，约 1 小时）**

1. **GSC → URL Inspection → 输入首页 → Test live URL**：看"网页抓取"是否成功、截图是否正常、HTML 是否包含正文；
2. **GSC → Settings → Crawl stats**：看最近 7 天 Googlebot 的响应码，是否出现 403/429；
3. **Vercel → Firewall → Logs**：过滤 `bot_name = Googlebot`、`mitigated = challenge`，看是否有命中；
4. 若发现 Googlebot 被 challenge：
   - 在 Vercel Bot Protection 中允许已验证 bot（Googlebot/Bingbot）；
   - 或把公开页面（`/`、`/drama/*`、`/browse/*`、`/sitemap/*`、`/robots.txt`）加入 challenge 例外；
   - 确认没有开启 "Attack Challenge Mode" 的全站挑战。

**验收**：GSC live test 通过、Crawl stats 无 429、Vercel 日志中 Googlebot 无 challenge。

---

### P0-2 · 详情页 hreflang 缺失：`<a hreflang>` 不算数

**现象**

| 页面类型 | `<link rel="alternate" hreflang>` | `<a hreflang>` |
|----------|-----------------------------------|----------------|
| 首页 / trending / browse / genre | 20 条（19 语种 + x-default） | — |
| best-short-dramas 列表 | 11 条 | — |
| 剧集详情 | **0 条** | 20 条 |
| 单集详情 | **0 条** | 19 条 |
| 文章页 | **0 条** | 19 条 |
| 语言列表页 | 0 条 | — |

Google 支持的 hreflang 标注只有三种：HTML `<link>`、HTTP `Link` header、XML sitemap。**`<a hreflang>` 不在其中**，它只是语言切换链接，不构成 hreflang 集群。

同时，语言切换链接本身也不完整：

- EN 剧集详情：18 个链接指向各语种首页 + en 自身，只有 1 个（pt）指向真正的 pt 译文；
- JA 单集详情：`en` 链接指向 `https://shortsbinge.com/`（首页），不是对应的英文单集。

**证据**

```text
EN drama:   link hreflang = 0, a hreflang = 20
EN episode: link hreflang = 0, a hreflang = 19
JA episode: link hreflang = 0, a hreflang = 19
Article:    link hreflang = 0, a hreflang = 19
```

本地化规模（sitemap 实测）：

| 语种 | 剧集数 | URL 数（剧 + ep1） |
|------|--------|--------------------|
| EN | 4,715 | 9,430 |
| JA | 2,018 | 4,036 |
| PT | 1,672 | 3,344 |

**影响**

- 已验证 JA 4,036 + PT 3,344 个本地化详情页；按已翻译语种估算，受影响页面在 1 万–3 万量级，全部没有进入 hreflang 集群；
- Google 可能把同一部剧的不同语言版本当作独立/重复页面，选错 canonical 展示语言；
- 本地化页面有权重分散、排名不稳定的风险；
- 语言切换把用户/爬虫带到首页，进一步削弱译文页的发现与权重。

**修复（前端，1–3 天）**

在剧集、单集、文章模板里输出完整的 `<link>` 集群，只包含**真实存在**的译文：

```html
<link rel="alternate" hreflang="en" href="https://shortsbinge.com/drama/xxx/" />
<link rel="alternate" hreflang="ja" href="https://shortsbinge.com/ja/drama/yyy/" />
<link rel="alternate" hreflang="pt" href="https://shortsbinge.com/pt/drama/zzz/" />
<link rel="alternate" hreflang="x-default" href="https://shortsbinge.com/drama/xxx/" />
```

要求：

1. 每个页面**包含自己**（self-referencing）；
2. 所有译文**互相指向**（A→B，B→A），否则整对被忽略；
3. 只列 200、可索引、canonical 自指的译文；
4. `x-default` 指向英文页；
5. 修复语言切换：译文详情 → 对应译文详情，EN 详情 → EN 详情，不要落到首页；
6. 用 Rich Results Test 或 hreflang 检查工具验 3–5 个页面。

**如果维护成本太高**：至少给"已翻译且有点击"的剧集加；其余译文考虑 `noindex` 或 canonical 到英文，不要放任 3 万个无标注的重复页。

---

### P0-3 · 本地化模板半翻译：英文 title/H1 出现在 18 个语种

**现象**

19 个 locale 首页全部是同一套英文 title/H1：

```text
/ja/  title: ShortsBinge for Japanese Viewers — The Short Dramas Worth Your Time
      h1:    Your Next Binge Is Already Here
/pt/  title: ShortsBinge for Portuguese Viewers — The Short Dramas Worth Your Time
      h1:    Your Next Binge Is Already Here
```

本地化详情页好一些，但仍有英文残留：

```text
/ja/drama/.../episode/1/
title: 見捨てられた公爵夫人 Episode 1 | ShortsBinge
h1:    Episode 1 - 見捨てられた公爵夫人
breadcrumb: Episode 1
```

另据团队 10/13–10/16 的日语本地化核查，除上述位置外，页脚、剧目详情页的面包屑、“Watch episode 1 free”按钮、类型标签（Romance / Taboo 等）也是硬编码英文。这些应一并纳入本地化清单，不要只改 title/H1。

**影响**

- 本地 SERP 里出现英文标题，CTR 和相关性都吃亏；
- 18 个语种共用同一句英文 H1/tagline，弱化"这是本地化页面"的信号；
- 与已翻译的正文不一致，页面语言信号混杂；
- 半翻译页面在质量评估上不如"完整本地化"或"不本地化"。

**修复（内容 + 前端，先做 Top 5 语种）**

1. 按 GSC 曝光/点击排序，先做 pt、es、ja、ko、id（或实际数据最高的 5 个）；
2. 本地化：`<title>`、meta description、H1、副标题、导航、按钮、`Episode N`、`X episodes`、`free episodes`；
3. 保留品牌名 `ShortsBinge`，只翻译价值主张；
4. 同步 `og:locale`、`html lang`、schema `inLanguage`；
5. 对没有流量、翻译质量差的语种，考虑 `noindex`，不要为了"覆盖 18 语种"而铺薄页。

---

### P1-1 · hreflang 覆盖不一致

同一套站点，hreflang 出现在：

- 首页 / trending / browse / genre / identity：20 条（正确）；
- best-short-dramas 列表：11 条；
- 文章页、剧集、单集、语言列表：0 条。

**修复**：抽一个共享的 `HreflangLinks` 组件，按"页面类型 + 可用译文"统一输出；不要让每个模板各自实现。

---

### P1-2 · Sitemap 不含 hreflang

41 个子 sitemap 中，`xhtml:link` 数量为 0。

对万级本地化 URL，建议用 sitemap 承载 hreflang：

```xml
<url>
  <loc>https://shortsbinge.com/ja/drama/yyy/</loc>
  <xhtml:link rel="alternate" hreflang="en" href="https://shortsbinge.com/drama/xxx/"/>
  <xhtml:link rel="alternate" hreflang="ja" href="https://shortsbinge.com/ja/drama/yyy/"/>
  <xhtml:link rel="alternate" hreflang="x-default" href="https://shortsbinge.com/drama/xxx/"/>
</url>
```

优点：不增加页面 HTML 体积，不和页面内标注打架；缺点：sitemap 体积变大，需按 2k–5k URL 拆分。

---

### P1-3 · 语言列表分页：99 页/语种，全部自 canonical 可索引

**现象**

- `/browse/languages/en/` 描述写 "Page 2 of 99"；
- `/browse/languages/en/page/2/`、`/page/12/` 都是 `canonical` 自指 + `index, follow`；
- sitemap 只收录了约 38 页/语种（741 条语言 URL），与实际 99 页不一致；
- 19 个语种 × ~99 页 ≈ 1,881 个纯列表页。

**影响**

- 深分页内容重复度高，抓取预算被大量低价值页占用；
- sitemap 覆盖不完整，Google 发现分页的路径不一致；
- 与 `?page=2` 的行为不一致：genre 的 `?page=2` 返回 200、canonical 到第 1 页、正文相同。

**修复（二选一，推荐 A）**

A. 第 2 页起 `noindex, follow`，并从 sitemap 移除；保留第 1 页索引；
B. 若坚持索引，所有分页自 canonical，sitemap 收录完整（1–99），并确保每页有差异化标题/描述（当前已有 "Page N"）。

另外：统一分页参数，`?page=` 要么 301 到 `/page/N/`，要么 404；不要返回与第 1 页相同的正文。

---

### P1-4 · HTML 没有 CDN 缓存

响应头：

```text
cache-control: public, max-age=0, must-revalidate
server: Vercel
content-encoding: br
```

首页/栏目 HTML 每次都回源；TTFB 实测 170–700ms，trending 首访 2.2s。对 SEO 抓取和移动端体验都不理想。

**建议**：公开页面用 ISR 或 `s-maxage=3600, stale-while-revalidate=86400`（按更新频率调），登录/搜索/个人页保持 no-store。上线前用 `curl -I` 和 GSC 抓取统计验证。

> 注意：这里说的是 Vercel 的 HTML 文档缓存，不是视频文件 CDN；两者独立，排查时不要混在一起。

---

### P1-5 · 本地化详情页内链弱

- EN 剧集详情：语言切换里只有 pt 指向译文详情，其余 18 个指向语种首页；
- JA 单集：`en` 指向首页；
- 译文详情页没有"Available in: EN / PT / …"的可爬链接组。

**影响**：译文页主要靠 sitemap 发现，内部链接权重传递弱。

**修复**：在详情页底部加 "Also available in" 链接组（只列真实译文），与 hreflang 使用同一份映射。

---

### P2-1 · 结构化数据：已覆盖，但缺关键字段

已有：

- `TVSeries`：name、description、url、genre、numberOfEpisodes、datePublished、inLanguage、image（960×1440）✅
- `TVEpisode`：episodeNumber、partOfSeries ✅
- `VideoObject`：name、description、thumbnailUrl、uploadDate、embedUrl ✅
- `BreadcrumbList` ✅
- `Article`：headline、description、datePublished、dateModified、author、publisher、mainEntityOfPage、video ✅
- `Organization` + `WebSite` + `SearchAction` ✅

缺口：

| 类型 | 缺什么 | 建议 |
|------|--------|------|
| Organization | `logo`、`sameAs` | 加 Logo 和社会主页（TikTok/YouTube/Instagram） |
| Article | `image` | 加 1200×630 封面图 |
| VideoObject | `contentUrl`、`duration` | 加 mp4 地址和 ISO 8601 时长；`embedUrl` 现在指向页面本身，不是播放器 |
| TVSeries | `actor`、`trailer`（可选） | 有数据就加，没有不勉强 |

> 注意：`VideoObject` 的 `embedUrl` 必须指向可播放的嵌入页，否则可能不满足视频富结果要求。

---

### P2-2 · URL 规范化的小问题

| 测试 | 结果 | 评价 |
|------|------|------|
| `http://shortsbinge.com/` | → `https://shortsbinge.com/` 200 | ✅ |
| `https://www.shortsbinge.com/` | → `https://shortsbinge.com/` 200 | ✅ |
| `/trending`（无斜杠） | → `/trending/` 200 | ✅ |
| `/TRENDING/`（大写） | 200，canonical 指向小写 | ⚠️ 建议 301 到小写 |
| 404 | 404 + noindex | ✅ |

---

### P2-3 · robots 与 AI 抓取策略

当前 robots.txt：

- 允许 Google/Bing；
- `Disallow` 所有 `/drama/*/episode/`，只 `Allow .../episode/1/`；
- 封禁 GPTBot / ClaudeBot / CCBot / Bytespider / meta-externalagent / Amazonbot；
- 允许 OAI-SearchBot / Claude-SearchBot / PerplexityBot（AI 搜索）；
- `Crawl-delay: 10`（Google/Bing 忽略）；
- Sitemap 已声明。

**要确认的**：站内是否只有第 1 集免费？如果某些剧有 2–3 集免费，robots 会把它们全部挡在搜索外。

**策略判断**：封训练 bot、放搜索 bot 是合理的；`Crawl-delay` 可以删掉，减少噪音。

---

### P2-4 · 抓取预算：非 HTML 请求占比偏高

10-19 导出的文件类型分布：

| 文件类型 | 占比 |
|----------|------|
| HTML | 39.51% |
| 其他文件类型 | 30.14% |
| JSON | 9.55% |
| JavaScript | 3.41% |
| CSS | 0.39% |
| 图片 | 0.10% |
| 未知（请求失败） | 16.91% |

HTML 只占四成，JSON + “其他文件类型”接近四成。需要确认这些请求是 Next.js RSC（`?_rsc=`）、API，还是静态资源；如果 Googlebot 在抓大量 RSC/API，属于抓取预算浪费。robots 目前只挡了 `/api/`，没有挡 `?_rsc=`。建议先在 Vercel 日志里看这些请求的 URL 模式，再决定是否加 `Disallow: /*?_rsc=`（注意不要误挡 HTML）。

---

## 4. 做得好的地方（不要动）

1. **SSR 内容完整**：不依赖 JS 也能拿到标题、正文、链接；
2. **canonical 干净**：抽样的所有页面都自指，尾部斜杠统一；
3. **404 正确**：真 404 + noindex，不是 soft 404；
4. **付费集不进入索引**：robots 对 episode 2+ 做了禁抓；页面上的 `noindex` 在 robots 生效时 Google 看不到，属于冗余实现，不影响效果，但也不必当成“额外优点”。
5. **schema 覆盖广**：TVSeries / TVEpisode / VideoObject / Breadcrumb / Article / Organization / WebSite，已经超过大多数同行；
6. **图片**：全部有 alt，83/85 懒加载；
7. **移动端**：390px 无横向溢出，viewport 正确；
8. **lab CWV**：首页 LCP ≈2.0s、CLS 0.03、长任务 1 个；栏目页 LCP <1.2s；
9. **压缩与安全**：Brotli、HSTS、CSP `frame-ancestors 'none'`；
10. **sitemap 索引规范**：41 个子 sitemap、lastmod、剧集与单集分开。

---

## 5. 优先级行动计划

### 今天（1 小时）

- [ ] 先核实 P0-1：GSC live test + 点开 Crawl stats 的 4XX 明细 + Vercel Firewall 日志；核实前不按 P0 推资源；
- [ ] 记录当前 GSC 索引数、hreflang 错误数、CWV 分组，作为基线。

### 本周（P0，3–5 天）

- [ ] 详情页输出 `<link rel="alternate" hreflang>`（含 self + x-default），修语言切换链接；
- [ ] 先做 pt / es / ja 三个语种的 title、meta、H1、Episode 标签本地化；
- [ ] 用 Rich Results Test 验 5 个详情页。

### 两周内（P1）

- [ ] hreflang 组件统一到所有模板（静态页 20、文章、详情、语言列表）；
- [ ] sitemap 加 `<xhtml:link>` alternates（或确认 HTML 方案已覆盖全部详情页）；
- [ ] 语言分页第 2 页起 `noindex, follow`，从 sitemap 移除；统一 `?page=` 行为；
- [ ] 公开页面加 CDN 缓存（ISR / s-maxage），复测 TTFB；
- [ ] 详情页加 "Also available in" 内链组。

### 一个月内（P2）

- [ ] Organization 加 logo/sameAs；Article 加 image；VideoObject 加 contentUrl/duration；
- [ ] 大写 URL 301；
- [ ] 确认免费集范围与 robots 一致；
- [ ] 按 GSC 数据决定：哪些语种继续投入、哪些 `noindex`；
- [ ] 作者/编辑政策/关于页，补 E-E-A-T。

---

## 6. 验收标准

| 项目 | 通过标准 |
|------|----------|
| Googlebot 抓取 | GSC live test 成功；Crawl stats 无 429/403 |
| hreflang | 详情页 `<link>` 数量 = 实际译文数 + 1（x-default）；无 "缺少返回链接" 错误 |
| 本地化 | Top 5 语种的 title/H1/meta 为目标语言；无英文残留（品牌名除外） |
| 分页 | 第 2 页起 noindex；sitemap 与可索引页一致 |
| 性能 | 首页/详情 TTFB < 500ms（缓存命中）；LCP < 2.5s；CLS < 0.1 |
| 结构化数据 | Rich Results Test 无错误；VideoObject 可被识别 |
| 索引 | GSC 中本地化详情页被收录，且展示语言正确 |

---

## 7. 附录：证据与样本

### 7.1 关键 URL

```text
https://shortsbinge.com/
https://shortsbinge.com/trending/
https://shortsbinge.com/browse/genres/romance/
https://shortsbinge.com/drama/vindication-blood-of-the-archmage-2np6xxeziuok/
https://shortsbinge.com/drama/vindication-blood-of-the-archmage-2np6xxeziuok/episode/1/
https://shortsbinge.com/drama/vindication-blood-of-the-archmage-2np6xxeziuok/episode/2/
https://shortsbinge.com/ja/
https://shortsbinge.com/ja/drama/見捨てられた公爵夫人-drlq3sttj6t4/
https://shortsbinge.com/browse/languages/en/page/2/
https://shortsbinge.com/best-short-dramas/the-great-and-powerful-genie-the-full-story-ruby-hiller-and-how-it-ends/
https://shortsbinge.com/this-page-does-not-exist-xyz-123/
```

### 7.2 关键响应头

```text
server: Vercel
cache-control: public, max-age=0, must-revalidate
content-encoding: br
strict-transport-security: max-age=63072000
content-security-policy: frame-ancestors 'none'
```

### 7.3 规模数据

| 项目 | 数量 |
|------|------|
| sitemap 索引子文件 | 41 |
| EN 静态页 | 909（其中 741 为语言列表/分页） |
| EN 剧集 URL | 9,430（4,715 部 × 2） |
| JA 剧集 URL | 4,036（2,018 部 × 2） |
| PT 剧集 URL | 3,344（1,672 部 × 2） |
| locale 首页 hreflang | 20（19 语种 + x-default） |
| 详情页 `<link>` hreflang | 0 |
| 详情页 `<a hreflang>` | 19–20 |

### 7.4 说明

- 本文所有判断基于 2026-10-18/19 的实际抓取；站点若在此期间改动，以最新为准。
- Vercel challenge 会阻挡非浏览器抓取，因此本文使用 Chrome 渲染后的 DOM；这不影响对 canonical/hreflang/schema 的判断，但**不能替代 Googlebot 的真实抓取日志**。
- 未接入 GSC/GA API；仅使用了 2026-10-08 的 Crawl Stats 导出，没有索引量、流量、排名数据。这些需要补，才能把"技术问题"换算成"业务影响"。

---

## 8. 外部复核回应（v1.2）

- **P0-1 数据来源**：数字来自本机 `~/Downloads/https___shortsbinge.com_-Crawl-stats-2026-10-08/响应表格.csv`（文件时间 2026-10-08 03:27，数据覆盖 09-16~10-05），不是 API，也不是编造；初版范围表未同步更新，属于文档错误。v1.1 已把 P0-1 降级为“待核实”，核实前不按 P0 推资源。
- **4XX 不能直接归因**：导出只给聚合的“其他客户端错误 (4XX)”，没有 403/429/400 拆分，也没有 Googlebot 维度；20% 是信号，不是结论。
- **robots + noindex**：robots 生效时 Google 看不到 noindex，后者是冗余实现；已从“做得好的地方”移除，改为中性描述。
- **本地化补充**：采纳团队 10/13–10/16 的核查，补入页脚、面包屑、“Watch episode 1 free”按钮、类型标签英文。
- **保留**：hreflang `<a>` 无效、HTML 无 CDN 缓存（与视频 CDN 分开）。
- **10-19 最新导出**：4XX 16.87%（绝对数约 12,640，未降），抓取量 10-11 起骤降到日均约 43 次；因此 P0-1 从 P1 升为 P0（调查），但仍不把 4XX 直接归因为 Vercel challenge。
- **待确认**：robots 的“只放第 1 集”规则对 Google/Bing 生效的部署时间，需要在 Vercel Deployments / git 记录里确认。
