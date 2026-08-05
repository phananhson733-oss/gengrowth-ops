# gengrowth.ai 全站 SEO 审计报告

**审计日期**：2026-08-05
**范围**：全站技术 SEO + 页面级优化
**数据源**：sitemap 全量抓取（88 URL）、HTTP header 检查、内链图谱构建、Google Search Console（近 90 天）、浏览器渲染 DOM 校验
**GSC 数据截止**：索引报告 2026-07-23，效果报告 4.5 小时前

---

## 执行摘要

站点技术基础是干净的：88 个 sitemap URL 全部返回 200，全部有自引用 canonical，每页恰好一个 H1，183 张图片 100% 有 alt，robots.txt 正确开放 AI 爬虫，HTTPS/HSTS/www 归一化都到位。这些不需要动。

真正的问题只有一个，但它很大：**站点做过一次 URL 结构迁移（`/en/xxx` → `/xxx`），迁移完成了，但 Google 那边没迁移过来。**

近 90 天有展示的 130 个 URL 里，81 个是已经不存在的 `/en/*` 遗留 URL。全站 38 次点击中，20 次来自 `/en/blog/google-july-2026-update`（812 展示，排名 7.2）——这一个已弃用的 URL 贡献了全站过半的点击。而当前正式 URL `gengrowth.ai/blog/google-july-2026-update` 在 GSC 效果报告里根本没有独立数据。

排名权重全部滞留在旧 URL 上，而其中 12 个旧 URL 的 308 跳转终点是 404。

### 优先级前五

| # | 问题 | 影响 | 修复成本 |
|---|---|---|---|
| 1 | 12 个仍在获取展示的 `/en/*` 旧 URL 跳转到 404，累计约 543 展示 | 高 | 低（1-2 小时） |
| 2 | 21 个 `/en/glossary/*` 等旧 URL 全部 308 到 `/blog` 通用列表页，Google 判为软 404，68 个 URL 卡在「已发现-尚未编入索引」 | 高 | 中 |
| 3 | `/blog?page=2..6` 全部 canonical 到 `/blog`，约 50 篇文章失去列表页发现路径 | 高 | 低 |
| 4 | 54 个英文页声明 `hreflang="zh"` 指向 404，hreflang 簇整体失效 | 中高 | 低 |
| 5 | 全站 HTML `no-store` 无边缘缓存，TTFB 0.8–1.1s | 中 | 低 |

### 快速见效项（当天可完成）

- 修 4 个 404 内链（8 处链接）
- 修 2 个坏筛选参数（`category=weekly-review`、`category=methodology`，目前会渲染出 `/blog` 的完全副本）
- 补 `/tools/traffic-drop-diagnosis` 的 4 类 Schema
- 删除 GSC 里重复提交的 www sitemap
- 66 个超长 title 收到 60 字符内

---

## 一、技术 SEO

### 1.1 URL 迁移未收口 —— 排名权重滞留在旧 URL【影响：高｜优先级 1】

**问题**：站点从 `/en/` 前缀结构迁到无前缀结构，308 跳转配置了，但 Google 仍在索引和排名旧 URL。

**证据**（GSC 效果报告，近 90 天，按网页维度）：

| URL | 点击 | 展示 | 平均排名 | 跳转终点 |
|---|---|---|---|---|
| `/en/blog/google-july-2026-update` | 20 | 812 | 7.2 | 200 ✓ |
| `/en/blog/best-cheap-seo-tools` | 1 | 907 | 34.4 | 200 ✓ |
| `/en/blog/best-white-label-seo-tool` | 0 | 723 | 73.7 | 200 ✓ |
| `/en/blog/why-use-a-backlink-monitor-tool` | 0 | 648 | 62.5 | 200 ✓ |
| `/en/blog/free-seo-company` | 0 | 472 | 18.9 | 200 ✓ |
| `/en/blog/all-in-one-seo` | 0 | 366 | 65.2 | 200 ✓ |
| **`/en/blog/9-best-marketing-attribution-tools-for-saas-in-2026`** | 0 | 334 | 41.0 | **404 ✗** |
| `/en/blog/saas-seo-platform` | 0 | 333 | 22.1 | 200 ✓ |
| **`/en/blog/ai-marketing-automation-for-saas`** | 1 | 138 | 51.3 | **404 ✗** |
| **`/en/blog/gengrowth-vs-cometly`** | 1 | 59 | 13.4 | **404 ✗** |
| **`/en/blog/best-ai-marketing-and-cmo-tools-for-saas-in-2026`** | 1 | 12 | 10.0 | **404 ✗** |

对比：当前正式 URL `https://gengrowth.ai/` 仅 9 点击 / 134 展示；`https://www.gengrowth.ai/` 另有 5 点击 / 136 展示。

**已验证的 12 个跳转到 404 的旧 URL**：

```
/en/blog/ai-marketing-automation-for-saas
/en/blog/gengrowth-vs-cometly
/en/blog/best-ai-marketing-and-cmo-tools-for-saas-in-2026
/en/blog/9-best-marketing-attribution-tools-for-saas-in-2026
/en/blog/free-seo-consultation
/en/blog/marketing-attribution-for-saas
/en/blog/gengrowth-vs-improvado
/en/blog/serankings
/en/blog/free-white-label-seo
/en/blog/gengrowth-vs-blaze
/en/blog/gengrowth-vs-okara
/en/blog/astrologywiki-zero-to-5000-users
```

这些的 308 跳转规则是机械去掉 `/en` 前缀，但目标文章已被删除或改名，于是跳到一个不存在的路径。

**修复**：

1. **立即**：为这 12 个 URL 配置精确跳转到语义最接近的现存页面，而不是让规则跳到 404。已能确认的映射：
   - `/en/blog/astrologywiki-zero-to-5000-users` → `/blog/astrologywiki-case-study`
   - `/en/blog/marketing-attribution-for-saas` + `/en/blog/9-best-marketing-attribution-tools-for-saas-in-2026` → `/blog/marketing-attribution-models`
   - `/en/blog/serankings` → `/blog/serankings-alternative`
   - `/en/blog/free-white-label-seo` → `/blog/best-white-label-seo-tool`
   - `/en/blog/free-seo-consultation` → `/blog/free-seo-company`
   - `/en/blog/gengrowth-vs-cometly` / `-improvado` / `-blaze` / `-okara`：这 4 篇竞品对比页有真实排名（cometly 排名 13.4），且没有替代页。**建议重建这 4 篇对比内容**，而不是跳走——对比词是高商业意图流量。
   - `/en/blog/ai-marketing-automation-for-saas` → `/blog/agentic-ai-marketing-automation`
   - `/en/blog/best-ai-marketing-and-cmo-tools-for-saas-in-2026` → `/blog/best-ai-seo-tools`
2. 跳转保持 308/301 均可（Google 等价处理），关键是终点必须 200 且主题相关。

---

### 1.2 旧栏目整体跳转到通用列表页 —— 触发软 404【影响：高｜优先级 2】

**问题**：`/glossary`、`/playbooks`、`/use-cases`、`/compare`、`/about`、`/features`、`/templates` 这些整个栏目被下线，所有 URL 一律 308 跳到 `/blog`、`/tools` 或 `/pricing`。

Google 对「大量不同 URL 跳到同一个通用页」的处理是判为软 404，不传递权重，且拒绝索引。

**证据**：GSC「已发现-尚未编入索引」共 68 个 URL，全部是遗留路径，构成如下：

| 路径段 | 数量 |
|---|---|
| `/zh/glossary/*` | 32 |
| `/en/glossary/*` | 17 |
| `/en/blog/*`（含 category） | 3 |
| `/zh/blog/*`（含 category） | 3 |
| `/en/use-cases`、`/zh/use-cases*` | 3 |
| `/en/playbooks`、`/en/tools*`、`/en/copyright`、`/en` | 4 |
| `/zh/about`、`/zh/contact`、`/zh/terms`、`/zh/compare/*` | 4 |
| 其他 | 2 |

抽样验证的跳转行为：

```
/en/glossary/bounce-rate      308 → /blog          （软 404）
/zh/glossary/bounce-rate      308 → /zh/blog       （软 404）
/en/playbooks                 308 → /blog          （软 404）
/en/use-cases/content-site-seo-scale  308 → /blog  （软 404）
/zh/about                     308 → /zh/pricing    （软 404）
/en/features                  308 → /pricing       （软 404）
/zh/compare/manual-growth     308 → /zh/blog#compare-manual-growth
```

其中 `/en/glossary/brand-visibility-score` 近 90 天有 330 展示、`/en/glossary/backlink-profile` 也有展示——glossary 栏目本身是有搜索需求的。

**修复**（按投入产出排序）：

1. **重建 glossary 栏目**。49 个词条 URL 已被 Google 发现且部分有展示，说明需求真实存在。术语页是低成本、高内链价值的资产，且直接对应"SEO 从业者缺乏系统知识"这个痛点。重建后 308 跳转自动生效。
2. 若短期不重建：把这些 URL 改为返回 **410 Gone**，明确告诉 Google 内容已永久移除，让它停止重复抓取、释放抓取预算。**不要**继续跳到 `/blog`。
3. `/features`、`/about` → `/pricing` 这类跳转在信息架构上也说不通（功能页和定价页不是同一个意图）。建议要么建独立功能页，要么 410。

---

### 1.3 分页 canonical 错误 —— 约 50 篇文章失去发现路径【影响：高｜优先级 3】

**问题**：`/blog?page=2` 到 `?page=6` 全部 canonical 到 `/blog`。

```
/blog?page=2                 canonical → https://gengrowth.ai/blog
/blog?category=methodology   canonical → https://gengrowth.ai/blog
/blog?pillar=seo_content     canonical → https://gengrowth.ai/blog
```

分页页面 canonical 到第一页违反 Google 明确指引（分页页应自引用 canonical）。实际后果：`/blog` 第一页只链出 13 篇文章，第 2 页有 12 篇完全不同的文章（重叠仅 1 篇），共约 50 篇文章只存在于被 canonical 掉的分页上。Google 把这些分页当重复内容处理后，很可能不会顺着它们爬取。

这些文章目前只剩两条发现路径：sitemap，以及稀疏的正文内链（见 1.4）。

**修复**：

1. 分页页面改为自引用 canonical：`/blog?page=2` → canonical `/blog?page=2`。
2. `?category=` / `?pillar=` 这类筛选参数保持 canonical 到 `/blog` 在去重上是对的，但这些 URL 目前还有元数据完全重复和筛选失效两个独立问题，见 **1.9**。
3. 长期方案：给 `/blog` 加"全部文章"归档页，或把分页改为路径式 `/blog/page/2`。

---

### 1.4 内链结构过度依赖 sitewide 组件【影响：中高】

**证据**（从 88 个页面构建的内链图谱，已剔除图片和参数 URL）：

正文级内链入链分布（63 篇英文博客）：

| 入链数 | 页面数 |
|---|---|
| 1 | 28 |
| 2–3 | 15 |
| 4–9 | 11 |
| 10–19 | 6 |
| 58–59 | 3 |

顶部 3 篇（`bounded-internal-link-crawl` 59、`google-ai-search-agents-2026` 58、`agentic-ai-marketing-automation` 58）的入链量说明存在一个 sitewide 的"最新文章"组件。剔除这个组件后，**28 篇文章（占 44%）只有 1 条正文内链**。

好消息：没有真正的孤岛页，所有 sitemap 内文章至少有 1 条入链。

**修复**：结合 1.3 的分页问题一起处理。优先给这 28 篇只有 1 条入链的文章补正文内链，每篇目标 3–5 条来自主题相关文章的入链。按你现有的内链数量标准（12-15 条含组件级链接）执行。

---

### 1.5 内链 404【影响：中｜快速见效】

4 个不存在的目标，被 8 处正文链接引用：

| 目标（404） | 来源页面 |
|---|---|
| `/blog/free-white-label-seo` | `/blog/integrated-seo`、`/blog/cost-effective-seo-services`、`/blog/best-white-label-seo-tool` |
| `/blog/serankings` | `/blog/affordable-seo-software`、`/blog/best-cheap-seo-tools` |
| `/blog/free-seo-consultation` | `/blog/free-seo-company`、`/blog/affordable-seo-tools` |
| `/blog/marketing-attribution-for-saas` | `/blog/best-tools-for-seo-for-b2b` |

**修复**：改指向现存页面（`serankings` → `serankings-alternative`，`marketing-attribution-for-saas` → `marketing-attribution-models`，`free-white-label-seo` → `best-white-label-seo-tool`，`free-seo-consultation` → `free-seo-company`）。

另有 5 处链接指向已下线栏目，虽然 308 能落地但浪费权重：`/features`、`/en/features`、`/en/pricing`、`/glossary`、`/templates`。建议直接改成最终目标 URL。

---

### 1.6 hreflang 指向 404【影响：中高｜优先级 4】

**现状**：hreflang 通过 HTTP `Link` header 下发（不在 HTML 里，这是合规的实现方式），每页三条：`en` / `zh` / `x-default`。canonical 自引用正确，`x-default` 指向英文版正确，双向互指在有中文版的页面上成立。

**问题**：sitemap 里 71 个英文页、17 个中文页。但英文页无差别地对所有页面声明 `hreflang="zh"`，指向机械拼接的 `/zh/` 路径。

已逐一验证：**71 个英文页中，54 个的 zh 目标返回 404**（17 个 200）。

```
/blog/cheap-seo        → hreflang zh → /zh/blog/cheap-seo        → 404
/blog/seo-automation   → hreflang zh → /zh/blog/seo-automation   → 404
```

按 Google 规则，hreflang 目标不可索引会导致整个 hreflang 簇被丢弃——包括那 17 对真实存在的中英对应关系。

**修复**：改为按实际存在的翻译动态生成 hreflang。没有中文版的页面只输出 `en` 和 `x-default` 两条，不要输出 `zh`。

另：sitemap 没有 `xmlns:xhtml` 命名空间，不含 hreflang 备用链接。HTTP header 方式已足够，不必重复实现——但两者若同时存在必须完全一致。

---

### 1.7 无边缘缓存，TTFB 偏高【影响：中｜优先级 5】

全站 HTML 响应头一致：

```
cache-control: private, no-cache, no-store, max-age=0, must-revalidate
x-vercel-cache: MISS
```

重复请求同一 URL 仍是 MISS，即所有 HTML 完全不走 CDN 缓存。实测 TTFB（第二次请求）：

| URL | TTFB |
|---|---|
| `/` | 1.04s |
| `/blog` | 1.09s |
| `/blog/chatgpt-seo` | 0.92s |
| `/tools/seo-audit` | 0.82s |
| `/pricing` | 0.80s |

首页 HTML 78KB，27 个 script 标签，25 个 Next.js chunk。

TTFB 0.8–1.1s 会直接吃掉 LCP 预算的三分之一以上。博客文章和工具页是静态内容，没有理由每次都动态渲染。

**修复**：对 `/blog/*`、`/tools/*`、`/pricing` 启用 ISR 或静态生成（`revalidate` 设为 3600 秒即可），让 Vercel 边缘缓存生效。只有确实需要个性化的页面才保留 `no-store`。

**说明**：PageSpeed Insights API 当日配额已耗尽，未能取得实验室 CWV 数据。GSC 核心网页指标报告移动端和桌面端**均显示"无数据"**——CrUX 真实用户数据量不足，这是流量规模问题，不是配置问题。等流量起来后再复查。

---

### 1.8 其他技术项

**正常，无需处理**：

- robots.txt 配置正确，显式开放 GPTBot / ClaudeBot / PerplexityBot / OAI-SearchBot / Google-Extended / DeepseekBot，仅屏蔽 `/api/` 和 `/app/`
- HTTPS 全站覆盖，HSTS `max-age=31536000; includeSubDomains`
- `www.gengrowth.ai` 301 → apex，归一化正确
- 88 个 sitemap URL 全部 200，无重定向链、无循环
- 404 页面返回真实 404 状态码 + `noindex`，无软 404
- 每页恰好 1 个 H1，63 篇博客无标题层级跳级
- 183 张图片全部有 alt 属性，无空 alt

**需小幅清理**：

| 项 | 说明 | 处理 |
|---|---|---|
| GSC 重复 sitemap | `www.gengrowth.ai/sitemap.xml` 和 `gengrowth.ai/sitemap.xml` 都已提交，内容相同，且 www 会 301 | 删除 www 那条 |
| 首页 canonical 与 sitemap 不一致 | sitemap 写 `https://gengrowth.ai/`，canonical 写 `https://gengrowth.ai`（无尾斜杠） | 统一为带尾斜杠 |
| GSC 未使用的验证令牌 | GSC 建议面板提示存在 1 个 | 移除 |
| `/contact`、`/zh/contact` 为 `noindex, nofollow` | 联系页是 E-E-A-T 信任信号 | 建议改为可索引 |

---

### 1.9 列表页参数变体：25 个 URL 共用两组完全相同的元数据【影响：中】

**先说清楚正式页面的情况**：88 个 sitemap 页面 + 10 个 sitemap 外页面（`/contact`、`/privacy`、`/terms`、`/copyright`、`/tools/hidden-keywords` 及其中文版），meta description **全部唯一，无重复、无近似重复**；og:description、og:title 同样全部唯一。

**重复出现在参数 URL 上**。`/blog` 和 `/zh/blog` 的全部筛选与分页变体，title 和 description 与基础列表页逐字相同：

英文侧 15 个 URL 共用同一组：

```
title:       Blog — GenGrowth
description: Evidence-led SEO methods, public-tool guides, and practical
             decision frameworks from the GenGrowth team.

/blog
/blog?page=2 ... /blog?page=6                       （5 个）
/blog?category=case_study | methodology
       | weekly-review | weekly_review              （4 个）
/blog?pillar=attribution | customer_stories
       | experiment_driven | growth_automation
       | seo_content                                （5 个）
```

中文侧 10 个 URL 共用同一组：

```
title:       博客 — GenGrowth
description: 来自 GenGrowth 团队的证据优先 SEO 方法、公开工具指南与可执行决策框架。

/zh/blog + 4 个 category 变体 + 5 个 pillar 变体
```

这 23 个参数 URL **全部是站内正文链接指向的**（从内链图谱提取），不是爬虫臆造的组合。第三方爬虫（Screaming Frog / Ahrefs / Semrush）扫到的"description 完全相同"就是这一批。

**这里有三个层次的问题，严重度不同：**

1. **重复本身影响有限**。这些 URL 都 canonical 到 `/blog` / `/zh/blog`，Google 的去重是生效的。但 GSC 显示已索引 168 个网页、sitemap 只有 88 个——索引膨胀是真实存在的，这批参数 URL 是来源之一。

2. **两个筛选参数是坏的，会渲染出 `/blog` 的完全副本**。实测各筛选值返回的文章列表：

   | 参数 | 文章数 | 结果 |
   |---|---|---|
   | `category=case_study` | 3 | ✓ 筛选生效 |
   | `category=weekly_review` | 3 | ✓ 筛选生效 |
   | `pillar=attribution` | 2 | ✓ 筛选生效 |
   | `pillar=customer_stories` | 2 | ✓ 筛选生效 |
   | `pillar=growth_automation` | 3 | ✓ 筛选生效 |
   | `pillar=experiment_driven` | 5 | ✓ 筛选生效 |
   | `pillar=seo_content` | 13 | ✓ 筛选生效 |
   | **`category=methodology`** | 13 | **✗ 与 `/blog` 逐条相同，筛选未生效** |
   | **`category=weekly-review`** | 13 | **✗ 与 `/blog` 逐条相同，筛选未生效** |

   `category=weekly-review`（连字符）和 `category=weekly_review`（下划线）同时存在且都被站内链接引用，但只有下划线那个能匹配到分类，连字符那个静默回落到未筛选的全量列表。`category=methodology` 同理——传入的值匹配不到任何分类，页面不报错，直接渲染 `/blog` 的完整内容。这是两个坏链接，也是两份 `/blog` 的字面副本。

3. **真正的损失是机会成本**。`case_study`、`growth_automation`、`experiment_driven` 这些筛选页本可以承接"SEO 案例研究""增长自动化文章"这类导航型查询，是现成的主题聚合页。现在它们没有独立 title、没有独立 description、canonical 指向别处——等于建好了却完全不用。

**修复**（按顺序）：

1. **修两个坏筛选值**：把站内 `category=weekly-review` 改为 `weekly_review`；查清 `methodology` 对应的实际分类键值并改正。同时给筛选逻辑加兜底——传入未知分类值时返回 404 或空结果，而不是静默渲染全量列表。
2. **给筛选页生成独立元数据**，例如 `SEO 案例研究 — GenGrowth` / `按案例研究筛选的 3 篇实证复盘…`。改完后可以考虑让这几个有真实内容的筛选页自引用 canonical，转为可索引的主题聚合页。
3. **分页页面的 title 加页码**（`Blog — 第 2 页 — GenGrowth`），配合 1.3 的自引用 canonical 一起改。
4. 暂时不打算做 2、3 的话，至少保持现在的 canonical 配置，并在 GSC 里观察索引数是否随 1.2 的清理一起回落。

---

## 二、页面级 SEO

### 2.1 Title 普遍超长【影响：中｜快速见效】

**88 个页面中 66 个 title 超过 60 字符**，最长 103 字符：

| 长度 | URL | Title |
|---|---|---|
| 103 | `/blog/affordable-seo-tools` | Why Affordable SEO Tools Are the Ones That Automate the Most Jobs, Not the Cheapest Sticker — GenGrowth |
| 102 | `/blog/taylor-swift-wedding-brand-economics-2026` | How Taylor Swift Wedding Brand Economics 2026 Reads as a Brand Signal — and Where It Stops — GenGrowth |
| 100 | `/blog/organic-seo-services` | How Organic SEO Services Earn the Share of Your Pipeline That Doesn't Pay Per Click — GenGrowth |
| 99 | `/blog/serankings-alternative` | SE Ranking Is a Strong Rank Tracker — The Honest Question Is Which Job You Need Covered — GenGrowth |
| 97 | `/blog/manual-seo-service` | What a Manual SEO Service Actually Covers — A Scope-Bounded Definition for B2B Buyers — GenGrowth |

超出部分在 SERP 被截断，`— GenGrowth` 品牌后缀几乎全部看不到，等于白占字符。

无重复 title，这点是好的。

**修复**：

1. 博客文章 title 压到 55 字符内（含品牌后缀），关键词前置。
2. 考虑去掉长文章的 ` — GenGrowth` 后缀，让正文标题占满可见区域。
3. 中文页 title 偏短（14–29 字符）属正常——中文信息密度高，Google 按像素宽度截断，不必按英文标准补长。

### 2.2 Meta description 长度失控

英文页普遍超长（最长 280 字符，`/tools/seo-quick-wins`），26 个页面超过 165 字符，会被截断。

```
280  /tools/seo-quick-wins
275  /blog/serankings-alternative
271  /blog/seo-outreach-agency
261  /blog/what-is-growth-automation
259  /blog/seo-automation
252  /blog/best-ai-seo-tools
252  /blog/world-cup-2026-content-marketing-ai
250  /blog/affordable-seo-tools
```

同样地，中文页的 40–70 字符是合理长度，无需调整。

**重复情况**：88 个 sitemap 页面 + 10 个 sitemap 外页面，meta description 与 og:description 全部唯一，无完全重复、无前缀近似重复。**重复只出现在 `/blog` 的筛选与分页参数变体上（25 个 URL 两组），详见 1.9。**

**修复**：英文 description 统一压到 150–160 字符，把最有说服力的一句放前面。正式页面无缺失、无重复，只是长度问题。

### 2.3 关键词自相残杀（cannibalization）

以下几组页面主题高度重叠，会互相稀释排名信号：

**低价 / 免费 SEO 工具组（6 篇）**
`/blog/cheap-seo`、`/blog/best-cheap-seo-tools`、`/blog/affordable-seo-tools`、`/blog/affordable-seo-software`、`/blog/cost-effective-seo-services`、`/blog/free-seo-company`

**SaaS SEO 组（6 篇）**
`/blog/seo-for-saas`、`/blog/seo-for-saas-startups`、`/blog/saas-seo-platform`、`/blog/saas-seo-consultant`、`/blog/saas-seo-expert`、`/blog/b2b-saas-seo`

**白标 SEO 组（3 篇）**
`/blog/whitelabel-seo-tool`、`/blog/best-white-label-seo-tool`、`/blog/white-label-keyword-research`

**几乎同名（最严重）**
`/blog/organic-seo-service` 与 `/blog/organic-seo-services` —— 单复数之差
`/blog/ethical-seo` 与 `/blog/ethical-seo-services`

**修复**：

1. 先合并 `organic-seo-service` / `organic-seo-services` 这一对，保留数据更好的一个，另一个 301 过去。
2. 其余各组指定一个 pillar 页，其余作为子主题，正文内链统一指向 pillar，并明确各自的差异化意图（工具 vs 服务 vs 人）。
3. 合并前先在 GSC 按查询维度确认哪个页面实际在拿展示，避免砍掉正在起量的页面。

### 2.4 工具页 Schema 与结构不达标

对照你的《工具落地页设计规范 SOP v1.0》（8 区块 / ≥15 个 H3 / 8-10 条 FAQ / 4 种 Schema）：

| 工具页 | H2 | H3 | 正文词数 | Schema | 达标 |
|---|---|---|---|---|---|
| `/tools/seo-quick-wins` | 13 | 37 | 10247 | SoftwareApplication + HowTo + FAQPage + BreadcrumbList | ✓ |
| `/tools/internal-link-audit` | 9 | 31 | 4779 | BreadcrumbList + HowTo + FAQPage + SoftwareApplication | ✓ |
| `/tools/seo-audit` | 9 | 27 | 5162 | BreadcrumbList + HowTo + FAQPage | 缺 SoftwareApplication |
| **`/tools/traffic-drop-diagnosis`** | **4** | **10** | 5219 | **无** | **✗** |
| `/tools`（列表页） | 3 | 5 | 827 | BreadcrumbList | — |

`/tools/traffic-drop-diagnosis` 已用浏览器渲染 DOM 二次确认：`document.querySelectorAll('script[type="application/ld+json"]')` 返回 0 个。内容量够（5219 词）但没有 Schema，且 H3 只有 10 个——内容没有按 SOP 的结构切分，headings 标记不足。

**修复**：

1. `/tools/traffic-drop-diagnosis` 补齐 4 类 Schema，并把现有内容重新按 SOP 的 8 区块 / ≥15 个 H3 组织。
2. `/tools/seo-audit` 补 `SoftwareApplication`。

**说明**：本站 JSON-LD 是服务端渲染的，curl 能读到，与浏览器渲染 DOM 结果一致，两种方法交叉验证无差异。GSC「增强功能 → 路径」显示 30 个有效 BreadcrumbList，无错误。

### 2.5 薄内容页面

63 篇英文博客，正文词数中位数 1935，最短 173。9 篇低于 900 词：

| URL | 词数 |
|---|---|
| `/blog/organic-traffic-growth-case-study` | 173 |
| `/blog/social-first-probe-week-1` | 208 |
| `/blog/astrologywiki-case-study` | 434 |
| `/blog/social-first-week-1` | 429 |
| `/blog/programmatic-seo-at-scale` | 509 |
| `/blog/marketing-attribution-models` | 579 |
| `/blog/evidence-first-growth-experiments` | 623 |
| `/blog/growth-experiment-playbook` | 801 |
| `/blog/public-seo-audit-boundaries` | 887 |

`/blog/organic-traffic-growth-case-study`（173 词，仅 2 个 H2）基本是空壳。案例研究页本该是 E-E-A-T 最强的资产类型，现在反而最薄。

**修复**：优先补 `organic-traffic-growth-case-study` 和 `astrologywiki-case-study`——这两篇是转化路径上的信任支点，且你手上有真实数据可写。周报类（`social-first-*`）薄一点可接受，但建议合并成季度复盘。

---

## 三、多语言 SEO

**结论：中文版翻译是真实的，不是"只翻模板"的低质本地化。**

抽样验证中英对应页的内容构成：

| 页面对 | 英文 H2 | 中文 H2 | 中文 CJK 占比 |
|---|---|---|---|
| `what-is-growth-automation` | 11 | 11 | 0.88 |
| `programmatic-seo-at-scale` | 8 | 8 | 0.79 |
| `tools/seo-audit` | 9 | 9 | 0.73 |
| `tools/seo-quick-wins` | 13 | 13 | 1.00 |

H2 结构完全对齐、正文以中文为主，说明是完整翻译。Google 的规模化内容滥用政策不适用于这种情况。

**唯一的问题就是 1.6 的 hreflang 指向 404**。中文覆盖 17 页 vs 英文 71 页，覆盖率不到 25%，但"不给没翻译的页面输出 hreflang"是正确做法——不需要为了对齐而机器翻译剩下的 54 篇（那才会踩规模化内容滥用）。

URL 结构用子目录 `/zh/`，符合推荐做法。中文页 canonical 全部自引用，无跨语言 canonical。

---

## 四、内容质量与 E-E-A-T

**正面信号**：

- 全部 63 篇博客有 `Article` + `Person` + `Organization` Schema，作者信息结构化
- 首页有 `Organization` + `WebSite` + `ContactPoint` + `SoftwareApplication`
- 有真实案例研究（astrologywiki）和实验周报，属于第一手经验（Experience）
- 有 `/privacy`、`/terms`、`/copyright` 合规页面
- 标题写法克制、避免夸张承诺，内容立场明确（多篇在讲"边界在哪"而非"包治百病"）

**待改进**：

- 联系页被 `noindex, nofollow`，削弱 Trustworthiness 信号
- 案例研究页过薄（见 2.5），无法支撑 Experience 主张
- title 里 em dash（—）使用密度很高，66 个超长标题中绝大多数含 em dash。这是 AI 写作的典型特征之一，对人类读者也偏冗长。建议改用更短的结构

---

## 五、行动计划

### 第一阶段：止血（本周，约 1 天工作量）

1. 修 12 个跳到 404 的 `/en/*` 旧 URL 跳转规则（映射见 1.1）
2. 修 8 处 404 内链 + 5 处指向已下线栏目的链接（见 1.5）；修 `category=weekly-review` / `category=methodology` 两个坏筛选值，并给筛选逻辑加未知值兜底（见 1.9）
3. hreflang 改为按实际翻译动态输出，消除 54 个指向 404 的 zh 声明（见 1.6）
4. 删除 GSC 里 www 的重复 sitemap；移除未使用的验证令牌
5. 首页 canonical 尾斜杠与 sitemap 对齐

### 第二阶段：恢复索引（2 周内）

6. 分页 canonical 改为自引用，恢复约 50 篇文章的发现路径（见 1.3）
7. 决定 glossary 栏目去留：重建（推荐）或改 410（见 1.2）
8. `/blog/*`、`/tools/*` 启用 ISR，让边缘缓存生效（见 1.7）
9. `/tools/traffic-drop-diagnosis` 补 4 类 Schema + 按 SOP 重构结构；`/tools/seo-audit` 补 SoftwareApplication

### 第三阶段：优化（1 个月内）

10. 66 个超长 title 压到 55 字符内；26 个超长 description 压到 160 字符内；给 `/blog` 筛选页和分页生成独立 title / description（见 1.9）
11. 给 28 篇只有 1 条内链的文章补正文内链，每篇 3–5 条
12. 处理 `organic-seo-service` / `organic-seo-services` 等 cannibalization 组
13. 重建 4 篇竞品对比页（cometly / improvado / blaze / okara）——高商业意图，且已有排名基础
14. 补充 `organic-traffic-growth-case-study` 和 `astrologywiki-case-study` 内容

### 长期观察

- 流量起来后复查 GSC 核心网页指标（目前 CrUX 数据不足，移动端桌面端均"无数据"）
- 第一、二阶段完成 4–6 周后，复查 GSC 效果报告：正式 URL 的展示份额是否从 `/en/*` 迁移过来

---

## 附：本次审计的数据边界

- **sitemap 全量抓取**：88 个 URL，逐一取 status / title / description / canonical / H1 / hreflang / JSON-LD / 图片 alt
- **内链图谱**：从 88 个页面提取 1900 条链接关系，剔除图片和参数 URL 后分析；另单独核查了 23 个被站内链接引用的参数 URL
- **元数据重复核查**：88 个 sitemap 页面 + 10 个 sitemap 外页面 + 23 个参数 URL 的 meta description / og:description / og:title 逐一比对（完全重复与前 60 字符近似重复两种口径）
- **hreflang 验证**：71 个英文页的 zh 目标逐一请求验证
- **遗留 URL 验证**：GSC 效果报告中 81 个 `/en/*` URL 逐一跟踪跳转终点
- **Schema**：curl 静态 HTML 与浏览器渲染 DOM 双向交叉验证，结果一致（本站 JSON-LD 为 SSR）
- **GSC**：索引报告（数据截止 2026-07-23）、效果报告近 90 天、站点地图报告、核心网页指标报告

**未覆盖**：
- PageSpeed Insights 实验室数据（当日 API 配额耗尽）
- CrUX 真实用户 CWV（流量不足，GSC 与 PSI 均无数据）
- 外链 / 域名权重（本次范围外）
- GSC 其余 4 类未索引原因的 URL 明细（网页会自动重定向 14、备用网页 6、404 2、robots.txt 屏蔽 1；GSC 界面加载超时，但量小且原因已从其他证据推断清楚）
