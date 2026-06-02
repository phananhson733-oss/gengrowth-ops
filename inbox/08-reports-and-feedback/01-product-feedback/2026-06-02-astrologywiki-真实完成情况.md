---
project: astrologywiki
type: delivery-review
title: AstrologyWiki SEO 需求真实完成情况
date: 2026-06-02
owner: wzb
source_req: 2026-05-31-astrologywiki-product-feedback.md
execution_plan: 2026-06-01-astrologywiki-seo-execution-plan.md
reviewed_by: Claude (Opus 4.8)
scope: 对照 5/31 原始需求文档，盘点实际交付 + 标出与原方案的偏离
---

# AstrologyWiki SEO 需求真实完成情况

> 对照 [[2026-05-31-astrologywiki-product-feedback]]（原始需求）盘点。
> 原始文档详列 **需求 1/2/4/5/6**；需求 3（速度）/7（结构化数据）/8（技术健康）只在「核心逻辑」提名、无展开。
> 执行过程经 Claude + Codex 双模型审核，**有几处是故意改方向**——这是本文重点。

---

## 一句话结论

原始 6 条需求里：**需求 4/5 按目标达成**（实现方式略不同）；**需求 1/2 被故意改了方向**（持续基于反 spam / E-E-A-T 审核）；**需求 6 大部分没做**（架构不适配）；**真正解决原始核心痛点「收录滞后」的，是一个不在任何需求里的 soft-404 修复**。

---

## 逐条对照表

| 原始需求 | 原始要的 | 实际做成的 | 判定 |
|---|---|---|---|
| **需求1 作者页** (P0) | 4 个虚拟作者页，**完善展示资质/经历/专长**，真人感署名，可加社交链接 | 作者页 + byline + 可点击跳转**都建好了**；但**刻意反转方向**：byline 标 "Editorial persona"、schema 用 `Organization` 不用 `Person`、**不写资质/jobTitle/专长声明、不建社交/真人资产** | ⚠️ **方向被故意改了** |
| **需求2 收录** (P0) | sitemap 自动更新 + 正确 lastmod；**接入 Google Indexing API** 绕开配额推送 | sitemap 自动生成 ✅ + **修了 lastmod 污染**（原来每次 build 全刷 today，污染 crawl 信号）；**Google Indexing API 被砍**，换成 **IndexNow（只推 Bing/Yandex）** | ⚠️ **核心手段被换掉** |
| **需求4 可嵌入工具** (P1) | embed iframe + dofollow 回链 + 独立 URL + 品牌标识 | ✅ Saturn Return widget `/embed/saturn-return`（独立路由 + iframe + 可选 dofollow） | ✅ 达成（仅覆盖 1 个工具，原文还提了气场测试） |
| **需求5 封面图+OG** (P0) | 每篇封面图、OG/Twitter Card、Alt、**编辑上传 UI**、WebP ≤200KB | ✅ **每篇自动生成品牌 OG 图**（satori/sharp）+ WebP，OG/Twitter 标签注入静态页（已生成 220 个 png+webp） | ✅ 达成目标，但**实现方式不同**（自动生成 ≠ 编辑手动上传） |
| **需求6 内链管理** (P1) | **编辑器内**搜索插入内链 + 自定义锚文字 + 相关文章推荐 + 后台内链入站/出站视图 | 只做了**构建期内链/orphan 检查脚本**（`scripts/check-internal-links.mjs`）+ 运行时 RelatedArticles 推荐 | ⚠️ **最大缺口**：编辑器创作工具基本没做 |

> 附带（原始未单列、实际已覆盖）：**需求7 结构化数据** —— 已铺 WebSite / ItemList / DefinedTerm / Book / Organization / Breadcrumb / Article / FAQ(选择性) JSON-LD。**需求8 技术健康** —— soft-404 修复、移除运行时 noindex、修复站内死链、lastmod 修复均有贡献。

---

## 🔴 三个必须知道的「偏离原方案」

### 1. 需求1 整个方向被反转了（最重要的战略取舍）

原始需求想把 4 个虚拟作者**包装成有资质的专家**（资质/经历/专长/头像）。审核判定这是 **Google E-E-A-T 欺骗 / spam 风险**——线上当时正用 `Person` + `jobTitle` + `knowsAbout` 输出虚构专家声明，是 codex 标的最高危项。

执行时**反着做**：改成「披露式 persona」——明说是编辑人设、不假装真人、schema 降级为 Organization（AstrologyWiki Editorial Team）、不建 LinkedIn/X/采访页等真人化资产。

→ **结果**：作者页系统建好了，但「外展以作者名义建立可信度」这个**原始商业目的没达成**。披露后 persona 不能承担信任，**最多不扣分，不加分**。这是有意识的取舍，**团队需知情**：想靠虚构专家做外展可信度这条路，被主动否决了。

### 2. 需求2 的 Google Indexing API 被砍了

原始最痛的点是「sitemap 7 周没被 Google 读、收录滞后」，方案是接 Google Indexing API 推送、绕开 GSC 每日 ~10 个配额。

但 **Google Indexing API 官方只支持 JobPosting / BroadcastEvent 两类**，拿来推普通文章违反条款且无效。所以换成 **IndexNow**——**但 IndexNow 只通知 Bing / Yandex，对 Google 收录无用**。

→ **原始痛点（Google 收录滞后）没被需求2 的新方案解决。** sitemap 卫生（含 lastmod 污染修复）做了，是真实改善；但「主动给 Google 推送」这件事，技术上做不到（也不该做）。

### 3. 真正解决「Google 收录滞后」的，是不在任何需求里的 soft-404 修复

今天（6/2）查 GSC 发现：那 ~23 个收录、sitemap 滞后的真正元凶，是**页面返回 200、有正文、有 schema，却被 Google WRS 判成软 404**——SPA 用 `createRoot` 挂载后清空静态正文、改用慢 API 重拉，冷启动超渲染预算 → 爬虫抓到空壳。

已查清三层根因并全部修复上线（详见执行 plan 的「追加修复」小节）：
- 静态 stub 注入完整正文（5/31）
- 移除运行时 noindex（PR #40）
- **`#__WIKI_INITIAL__` bootstrap，首屏零 API 依赖**（详情页 PR #43→#44、classics hub PR #45→#47）

GSC「测试实际版本」已判定 four-elements **可编入索引**。

→ **需求2 的真实目标（让 Google 收录）是从这个需求外的修复达成的，不是从原方案。** 这条最该让 SEO 团队知道：收录上不去不是「没推送给 Google」，是「页面被判成空壳」。

---

## 没做 / 缺口

- **需求3 页面速度** —— 原文只提名未展开，未做。
- **需求6 编辑器内链工具** —— oracle 是代码/markdown 内容、无 CMS 编辑器，原始「编辑器插入 UI + 后台内链视图」不适配当前架构，只落地了构建期链接校验 + 运行时相关文章推荐。若未来上 CMS 再补。
- **需求1 真人化外展资产** —— 被主动否决（见偏离 #1），非遗漏。
- **需求4 第二个工具（气场测试 embed）** —— 只做了 Saturn Return，气场测试 widget 未做。

---

## 工程任务执行台账（T1–T7，全部上线 main）

| 任务 | 对应需求 | 状态 |
|---|---|---|
| T1 lastmod 污染修复 | 需求2 | ✅ commit 3bcaf67 |
| T2 author schema Person→Organization | 需求1（偏离方向） | ✅ commit d4c047b |
| T3 每篇 OG 图 + WebP | 需求5 | ✅ generate-og-images.mjs |
| T4 IndexNow（替代 Google Indexing API） | 需求2（手段替换） | ✅ PR #42 |
| T5 byline 披露 + 非真人头像 | 需求1（偏离方向） | ✅ commit a5f5ccc |
| T6 内链/orphan 检查脚本 | 需求6（仅校验，非编辑器） | ✅ check-internal-links.mjs |
| T7 可嵌入 Saturn Return widget | 需求4 | ✅ commit f5ed2e4 |
| 追加：soft-404 bootstrap（详情+hub） | **需求2 真实目标** | ✅ PR #43/#44/#45/#47 |

---

## 给团队的三条提醒

1. **作者可信度路线被改**：不能再以「虚构专家」做外展，站内已是披露式 persona。外展要可信度，得用真实人或品牌（见 plan 的 D1 第 6 条）。
2. **Google 收录不靠"推送"**：核心障碍是 soft-404，已修；后续看 GSC「软 404 / 已抓取未编入」报告是否回落，而不是指望 IndexNow 推 Google。
3. **遗留待查**：en 页 hreflang 声明了一批无静态 stub 的 zh URL（zh 经典书 + 非白名单 zh 条目），有同类 soft-404 风险；先查 GSC 是否出现 zh 路径再决定是否处理。

---

_盘点：Claude Opus 4.8，对照 5/31 原始需求与 oracle 线上代码实情。_
