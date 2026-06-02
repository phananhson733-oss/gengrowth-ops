# AstrologyWiki SEO 报告评估 + 执行计划

> 评估对象：`astrologywiki_final_report.md`（6 轮数据分析合并报告）+ Google Sheet `astrologywiki_156_duplicate_urls_to_fix`
> 评估方法：Googlebot UA 实测生产站 92 个 URL + 读源码 `/Users/wzb/Code/oracle` + Ahrefs MCP 核验关键词 + Codex(gpt-5.5 xhigh) 独立二审
> 日期：2026-06-02 ｜ 状态：**仅执行计划，未改代码**
> 决策记录：chakra/aura 31 页 **保持现状不动**（保留 index,follow）

---

## 0. 总判断

报告**数据扎实、态度诚实**：Ahrefs 核验 15 个关键词 **KD 15/15 零偏差**，Volume 多数精确命中。但**头号结论「全站裸 SPA、Google 看不到内容」已过时**——它基于 2026-06-01~02 那批预渲染部署**之前**的 Ahrefs 爬取快照。所以分三类处理：已修复的 pass、误报的不动、真问题的优化。

---

## 1. 已修复 → 验证通过，PASS

| 报告/Sheet 主张 | 实测当前状态（Googlebot UA） | 结论 |
|---|---|---|
| ⚠️「裸 SPA，内容重写无意义」 | 92 个待修 URL 中 **86 个 wiki 页已预渲染**，可见 3k–17k 字正文 + `index,follow` | 前提不成立，**PASS** |
| Sheet 71 行「SSG + canonical」 | wiki 页 SSG 全自动（`generate-seo-pages.mjs` 读 `wiki.ts` 循环生成） | 已做，**PASS** |
| wiki soft-404 | `#__WIKI_INITIAL__` bootstrap 注入治本 | 已做，**PASS** |
| sitemap lastmod 抖动 | 改内容签名 manifest 驱动 | 已做，**PASS** |
| robots 误封 JS/CSS | robots.txt 干净，显式 `Allow: /wiki` | 本就没问题，**PASS** |

**验证命令（可复跑）**：
```bash
curl -sL -A "Mozilla/5.0 (compatible; Googlebot/2.1)" https://www.astrologywiki.com/en/wiki/gemini \
| python3 -c "import re,sys;h=re.sub(r'<(script|style)[^>]*>.*?</\1>','',sys.stdin.read(),flags=re.S);print(len(re.sub(r'\s+',' ',re.sub(r'<[^>]+>',' ',h)).strip()))"
# 期望 ≥ 7000（实测 7779）；若回到 ~92 则预渲染回归
```

---

## 2. 报告/Sheet 误报 → 不用动

- **相位四页** `conjunction/opposition/square/trine`：是 4 个不同相位，**本就该独立**，canonical 自指正确。Sheet 列为「重复」是误判。
- **chakra/aura 31 页**：当前全部 `index,follow` 且完整渲染。**决策：保持现状不动**。理由：(1) 报告自承 aura 占 GSC 曝光 30%，是唯一在产生曝光的页；(2) 项目记忆显示 green-aura 等是有意上线的引流页；(3) noindex 不传递整合信号。**后续若要处理，用 GSC 分组数据判断，优先 canonical 合并而非 noindex**，不在本轮范围。

---

## 3. 真问题 → 执行计划（按 ROI 排序，源码级改动点）

### P0-1 ｜首页 `/` 是空壳却 priority 1.0（报告完全没抓到，最高 ROI）

- **现状**：实测 `/` 仅 92 字符可见文本；`public/sitemap.xml:4-8` 把 `/` 以 `priority 1.0` 提交。`pages/landing/LandingPage.tsx:70` 自带 TODO：root 仍依赖 hydrated meta，需 prerender。
- **改动**：给构建产物 `index.html` 的 `#root` 注入 landing v2 静态首屏 + 正文 fallback（hero 标题/副本/核心区块），React 挂载后替换。可复用 `scripts/inject-spa-into-stubs.mjs` 模式。
- **风险**：首页是 SPA 入口，静态首屏须与 React 水合一致，避免 CLS / 闪烁；验收需 `serve dist` 无后端复刻 WRS。
- **验证**：curl Googlebot 首页可见文本 ≥ 1500 字符。

### P0-2 ｜`saturn-return-calculator` 空壳（V=14k KD=20 高价值工具词）

- **现状**：实测 92 字符。`generate-seo-pages.mjs:1069-1073` 只 `addUrl` 进 sitemap、故意不写静态 HTML（旧注释：静态会被 Vercel 高优先 serve 盖住交互式 calculator）。
- **关键修正**：**不要从 sitemap 移除**。旧顾虑已被 `scripts/inject-spa-into-stubs.mjs` 解决（静态正文给爬虫 + SPA 水合接管交互）。
- **改动**：用 `writeHtmlPage` 为工具页生成带 SEO 正文 stub（什么是土星回归 / 27-30 岁 / 计算说明 / FAQ），注入 SPA 水合；验证 hydration 在静态 shell 上能接管 calculator 交互。
- **关联**：`components/SaturnReturnCalculator.tsx:327` 声明了 zh hreflang，但脚本只把 EN saturn 进 sitemap → 要么补 `/zh/saturn-return-calculator` 同样 bootstrap+sitemap，要么去掉 zh alternate。bootstrap 后补站内内链（当前仅 hero pill + footer 指向，`ToolsGridSection.tsx:114` 已把卡片换成 Synthetica）。
- **成本**：中。**风险**：项目记忆「禁止 SPA 运行时 noindex / static-first」，验收 serve dist 复刻 WRS。

### P0-3 ｜法务页静态化（低成本顺手做）

- **现状**：`generate-seo-pages.mjs:842-848` 把 `privacy/terms/cookies/about/help` 用 `addUrl` 进 sitemap 但不写 HTML → 提交空壳。
- **改动（二选一）**：要索引就 `writeHtmlPage` 写静态正文 stub（这些页无交互，无「静态盖 SPA」问题，成本低）；不要索引就 sitemap 排除 + 输出 `noindex,follow`。**单纯排 sitemap 是弱信号**，不够。

### P1-1 ｜canonical cannibalization 收口（真重复）

- **现状（核实）**：canonical **静态 + 运行时都强制自指**——`generate-seo-pages.mjs:205` 硬写 `href=当前url`；`components/SEO.tsx:201` `upsertLink('canonical', currentUrl)` 无条件自指。**只改静态脚本无效**，Google WRS 执行 React 后又看到自指。
- **改动（Codex 建议，优于原 canonicalId 方案）**：在数据层加一组索引策略字段，`WikiItem`（`backend/src/types/api.ts:768` 当前无 SEO 字段）和 `WikiArticle`（`types.ts:1079` 当前无 SEO 字段）两套类型都加：
  ```ts
  seo?: {
    canonicalPath?: string;
    robots?: "index,follow" | "noindex,follow";
    sitemap?: "include" | "exclude";
  }
  ```
  然后**四处都读它**：静态 `buildHead`/`writeHtmlPage`、`components/SEO.tsx`、`WikiDetailPage`、`WikiArticleDetailPage`、Saturn。`addUrl`（`:1000`/`:1096`）按 `seo.sitemap` 与 canonical 自身决定是否提交。
- **第一批收口对象（按搜索意图定 canonical 目标，非简单删页）**：
  - `transit-chart`（短百科）→ canonical 到 `/en/wiki/transits`（长文）
  - `four-element-framework` ↔ `elements`：定一个为 canonical，另一个指过去
  - `house-5` ↔ `5th-house`（WikiItem vs WikiArticle）：按 SERP 意图，长文承接 query、定义页指过去或改写成短定义
  - **`natal-chart-transits` 不合并**——它是 transits pillar 的操作型 spoke（父子页，非重复）；改为强化 pillar→spoke→dated 内链
- **TDD**：canonical/robots/sitemap 输出属 SEO 正确性，建议先写 `generate-seo-pages` 单测（给定带 `seo.canonicalPath` 的 fixture，断言输出 HTML 的 canonical 与 sitemap 收录）。

### P1-2 ｜sitemap / hreflang 一致性

- sitemap（236 URL）含 5 空壳页 + 31 待决策 chakra/aura → 发混合信号。chakra/aura 本轮保持 index 不动，但 5 空壳页随 P0-3 一起处理。
- hreflang 不一致：`/en/wiki` 静态页输出 `/zh/wiki` alternate（`:907`）、`WikiHubPage.tsx:57` 声明 zh/en/x-default，但脚本只把 EN wiki hub 进 sitemap（`:879`）。**要么生成并提交 zh wiki hub，要么从 hreflang cluster 移除 zh hub**。

### P2-1 ｜schema 时间信号污染

- `components/wiki/WikiDetailPage.tsx:378-379` 用 `new Date().toISOString()` 填 `datePublished/dateModified` → **每天变**，与「内容变才变」的 lastmod 策略冲突，Google 会判定日期不可信。
- **改动**：移除 wiki 条目 Article schema 的动态日期，或在 `wiki.ts` 引入真实 `publishedAt/updatedAt` 字段后读取。

### P2-2 ｜其它技术债（登记，暂不阻塞）

- 6/1 新建 `june/july-2026-planetary-transits` 是带日期页 → 需归档/refresh 策略，否则 2026-08 后变 stale debt。
- `scripts/check-internal-links.mjs:186` 未覆盖 wiki `related_ids`/classics/footer/nav/Saturn → 现报 126 orphan **不可信**，需扩展 checker 后再判断真 orphan，再补内链。
- `WikiArticlesPage.tsx:28` canonical 到 `/wiki?tab=articles`（query URL）但 sitemap 不提交 query → 给 articles 独立静态路由或 noindex 该 tab。

---

## 4. 数据层修正（Ahrefs 核验结论）

| 关键词 | 报告称 | 核验真实 | 修正 |
|---|---|---|---|
| astrocartography | V97k KD8 | **V88k KD8** | 数字基本成立，但 **SERP 前二是 astro.com/astro-seek 交互式地图工具**，纯文章拿不到主体流量 → **是产品功能机会（需 relocation 地图工具）不是内容机会**。报告「写篇 wiki 就能赢」是陷阱 |
| astrocartography chart | V45k KD42 | **V25k KD42** | 预期流量**砍半**，重排资源时下调 |
| annual profections | V6.1k KD13 | **V7.7k KD13** | 报告**自己低估**，便宜好词，**上调权重** |
| 其余 12 词 | — | KD 全准、V 多数精确 | 优先级排序成立，可放心执行 |

---

## 5. 建议执行顺序（ROI × 安全）

1. **P0-3 法务页 + sitemap 清空壳**（低成本止血，5–30 min）
2. **P0-1 首页 prerender**（最高 ROI，priority 1.0 页面）
3. **P0-2 saturn-calculator bootstrap**（高价值工具词，复用 injector）
4. **P2-1 schema 日期**（顺手，移除 new Date()）
5. **P1-1 canonical seo 策略字段 + 第一批收口**（需类型层改造 + TDD，触 PRD 4.4/4.2 + FOLDER + 文件头）
6. **P1-2 hreflang 一致性**（跟随 P1-1）
7. P2-2 技术债登记，单独排期

> 触 PRD 提示：P1-1 加数据字段 + P0 新增预渲染路由 → 需同步 `docs/PRD.md`（4.2/4.4）+ 相关 `FOLDER.md` + 文件头注释。
> chakra/aura：**本轮不动**，保留 index,follow。
