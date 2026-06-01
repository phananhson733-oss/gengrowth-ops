---
project: astrologywiki
type: execution-plan
status: draft
version: v3
owner: wzb
based_on: 2026-06-01-astrologywiki-feedback-review-response.md
source_req: 2026-05-31-astrologywiki-product-feedback.md
reviewed_by: Claude (Opus 4.8) + OpenAI Codex（plan 双模型审核）+ /plan-eng-review（对 oracle 代码库工程审计）
target_repo: github.com/xdawayer/oracle（React 19 + Vite SPA，build 时 generate-seo-pages.mjs 生成静态 SEO stub；Vercel 部署）
updated: 2026-06-01
---

# AstrologyWiki SEO 执行 Plan 与优先级（v2）

> 基于 `2026-06-01-astrologywiki-feedback-review-response.md`（需求 review）。
> v2 = v1 经 Claude + Codex 双模型审核后修订，纳入 3 个结构性必改（见下方变更记录）。
> 优先级即 Wave 顺序。原则：**该做完整的事，但不一次煮干整片海**——3 个必改进 Wave，其余缺失折成 backlog 逐步折叠，匹配实际人力。

---

## v1 → v2 变更记录（双模型审核结论）

| # | 必改 | 来源 |
|---|---|---|
| 1 | **外链"规划/资产/名单"提到 Wave 0 并行启动**，只有"规模化正式外展"留 Wave 3。修 v1"把唯一驱动排到最后"的自相矛盾 | 两模型一致 |
| 2 | **披露式 persona 缓解延伸到文章页 byline + Article schema + author archive**，不止作者页披露 | Codex 定位的最弱点 |
| 3 | **Wave 0/1 新增 URL 清单 + 内容质量/可收录性 triage**，否则 sitemap/IndexNow/schema 只是把低价值页包装得更整齐 | 两模型一致 |
| — | OG/封面图从"第一优先"降为 support task（零风险≠高杠杆）；"零风险立即做"改称"低争议基础项" | Codex |

---

## 决策记录

| 编号 | 决策 | 结果 |
|---|---|---|
| **D1** | 作者真实性方向 | **披露式 persona**（缓解见下，v2 已扩展） |
| **D2** | 主 KPI | **DR → 收录的有价值页面数 + 非品牌自然点击**（DR 仅观察） |

### D1 缓解（v2 扩展版 —— 必须覆盖 byline 与 schema，不止作者页）

**1. 作者页披露** —— 每页固定位置标明 editorial persona（不声明真实资质/经历/地理/社交身份；头像用插画或标注 AI，不得真人照片冒充）。

**2. 文章页 byline 不用真人格式** —— 不写 "By Luna Hart"；用 "Luna editorial voice" / "AstrologyWiki Editorial Team"。

**3. Article schema 的 `author` 用 `Organization`/编辑部，不要扩成具备真实身份的 `Person`** —— persona 只作 editorial voice / column label，避免 schema 放大 persona 的"拟真人"感知。

**4. author archive 命名去专家化** —— 用 "Luna Editorial Persona"，不用 "About Luna Hart, Astrology Expert"。

**5. 不建 persona 的真人化资产** —— 无 LinkedIn / X / 采访页 / 媒体包；所有 contributor/outreach 走真实人或品牌邮箱。

**6. 外展身份解耦** —— 站内署名=persona；对外 guest post/PR=品牌或真人，**不以 persona 假装真人**。

**7. 真实 E-E-A-T 责任主体** —— persona 不能承担信任；必须有一个真实可联系的 editorial/公司负责人，负责事实核查、更正流程、占星 claim 与建议边界的审批。

> 注：披露只把"欺骗风险"降到**可辩护**，不等于 E-E-A-T 加分——最多不扣分。这是这条路的天花板，团队需知情。

---

## 优先级总览

| Wave | 内容 | 性质 |
|---|---|---|
| 0 本周 | 决策 + 收录诊断 + **URL/内容 triage** + **外链规划** + KPI baseline | 必做，最前 |
| 1 1-2周 | sitemap/canonical 卫生、真实信任页、内链蓝图、**1-2 个 linkable asset brief**；OG=support | 低争议基础项 |
| 2 2-4周 | 披露式作者页(+byline/schema)、内链实施、基础 schema、**小批量 soft outreach 测试** | 依赖 Wave 0 |
| 3 持续 | 工具/数据资产发布、**规模化正式外展 + Digital PR** | 真正驱动 DR |

---

## Wave 0 — 决策 + 诊断 + 外链规划（本周）

- [x] D1 披露式 persona（缓解已扩展）、D2 KPI（已定）
- [ ] **收录根因诊断（发现层）**：GSC 区分 `Discovered - not indexed` vs `Crawled - not indexed`；服务器日志看 Googlebot（无完整日志则用 Cloudflare/Vercel logs + Bing Webmaster + live URL inspection 抽样兜底）；sitemap 返回 200 / canonical / 无 noindex 校验；**canonical 冲突检测放这里**（不留到 Wave 2）
- [ ] **URL 清单 + 可收录性 triage（内容层，新增）**：建 indexation 决策矩阵，每个 URL 标注 → `improve / merge / noindex / 从 sitemap 删除 / keep`。判定维度：内容唯一性、搜索需求、内链深度、impressions/crawl hits、是否重复簇、模板化组合页（星座配对/日期/相位）
- [ ] **author / schema policy**：persona 是否作 `Person`（默认否）、byline 展示规则、disclosure 文案放哪些页
- [ ] **外链规划（新增，并行启动）**：目标页、资产主题、目标站类型、**禁止手法清单**、outreach identity、初版 prospect 分类
- [ ] **KPI baseline**：GSC 非品牌 query regex、indexed canonical 计数口径（只算 canonical indexed，不算 submitted）、page groups、当前 referring domains 质量基线、28d vs 90d 对比窗口

---

## Wave 1 — 低争议基础项（1-2 周）

1. **需求2-A｜sitemap 卫生**（✂️ 砍 Google Indexing API）：发布即更新 + `lastmod` **仅在实质内容变更时更新**（每次 build 全刷会污染 crawl signal）+ robots 声明 + **IndexNow**（仅 Bing/Yandex，**不当作 Google 收录方案**）。验收：sitemap 只含 200/canonical/indexable URL、无重定向、无 noindex、GSC sitemap status clean
2. **真实信任页**：About / Editorial policy / Correction policy / AI disclosure / Contact / Methodology —— **内容必须具体**（AI disclosure 要写明人类编辑责任/事实核查/更新机制；Methodology 绑定真实生产流程，astrology 内容明确为解释框架/娱乐反思用途，非专业咨询）
3. **内链架构蓝图**（不全等 Wave 2）：hub pages、orphan 优先级、breadcrumb 规则先定
4. **linkable asset brief ×1-2**（外链前置）：astrology data study / calculator / compatibility dataset / visual chart 的选题与 brief
5. **需求5｜OG/Twitter Card/WebP** —— **support task**，顺手做，不挤占 canonical/URL triage/内容 triage 的时间；定位=分享/CTR

---

## Wave 2 — 取决于 Wave 0（2-4 周）

1. **需求1｜披露式作者页** —— 按 D1 七条缓解执行（含 byline 格式 + schema author=Organization）
2. **需求6｜内链实施** + breadcrumbs + orphan 修复 + canonical 冲突修复
3. **基础 schema**：Organization / WebSite / Breadcrumb / Article。**FAQ schema 仅在页面真实可见 FAQ 时用**，不全站机械铺（Google 已收紧 FAQ rich results）
4. **小批量 soft outreach 测试**：建 prospect list、找真实联系人、测 2-3 个 pitch angle

---

## Wave 3 — 外链引擎（持续，真正影响 DR）

1. **工具/数据资产发布**：需求4 可嵌入工具合规形态（回链可见 + 品牌化 + 自然锚文本 + **可选** dofollow；不强制 dofollow / 不关键词锚文本 / 不藏 footer）
2. **规模化正式外展 + Digital PR**：guest contribution、resource page outreach、unlinked mention reclamation；外展以品牌或真人名义
3. **监控**：link quality、anchor profile、收录提升、非品牌 query 增长

---

## 成功指标（替代 DR）

- **收录的有价值页面数** —— "有价值"= canonical indexed **且**有 impressions/clicks，不是 submitted 总数
- **非品牌自然曝光与点击**（GSC，按 baseline 口径）
- 关键词排名分布（进前 30 / 前 10 数量）
- referring domains **质量**（定义：relevance + organic traffic + indexed pages + anchor 分布 + 是否 sponsored；DR/DA 仅参考）
- 新文章平均收录时长

DR 仅作观察指标。

---

## 工程实现审计（/plan-eng-review，对 oracle 代码库）

> v3 新增。读了线上站点代码后的实情：**plan 工程部分大半已建好**，真实工作是"审计现有 + 补窄 gap + 修 2 个线上 P1"，不是从零建 5 个功能。

### 现状审计 — 已存在，勿重复造轮子

| 需求 | 现状 | 代码位置 |
|---|---|---|
| 需求5 OG/Twitter 每页 meta 注入 | ✅ 已建 | `scripts/generate-seo-pages.mjs:199-208` buildHead |
| 需求2 sitemap.xml + robots.txt | ✅ 已建（含作者页+文章 URL，build 时自动生成） | `generate-seo-pages.mjs:723-966` |
| 需求1 作者页 + byline | ✅ 已建 | `components/wiki/AuthorPage.tsx` / `AuthorByline.tsx` / `data/authors/` / 测试 |
| 结构化数据 JSON-LD | ✅ 已建 WebSite/ItemList/DefinedTerm/Book/Person/FAQ/Organization | `generate-seo-pages.mjs` + `data/authors/schema.ts` |

### 🔴 2 个线上 P1（现在代码里就错，优先于一切 gap）

**P1-1 lastmod 污染** — `scripts/generate-seo-pages.mjs:950` 每个 URL 写 `<lastmod>${today}</lastmod>`，`today`（line 13）= 当前 build 日期。每次部署把全站 lastmod 刷成今天，与内容变更无关 → **Google 学会不信任 lastmod 并忽略它**。极可能是原始文档"sitemap 7 周未重读/收录滞后"的元凶之一。
- 修法：lastmod 取该页内容的真实最后修改时间（按 slug 维护 content-hash → 变更时间映射，或取源 md 的 git mtime），只在实质变更时更新。

**P1-2 虚构 persona 输出 schema.org/Person** — `data/authors/schema.ts:25` 4 个虚构 persona 正以 `Person` + `jobTitle` + `knowsAbout`（专长声明）输出，且是"文章详情页/列表页/作者页"的唯一构造点。**与 D1（披露式 persona）直接冲突，且是 codex 警告的 E-E-A-T/spam 风险——现在就是线上状态。**
- 修法：核心 author entity 改 `Organization`（AstrologyWiki Editorial Team）；persona 作 editorial voice，不带 jobTitle/knowsAbout 的真实专家声明；配合 byline 披露文案。

### 真实 gap — 这才是工程活（映射到 Wave）

| 任务 | 优先级 | 性质 | 落点 |
|---|---|---|---|
| 修 P1-1 lastmod | P1（Wave 1） | 改现有 | `generate-seo-pages.mjs` sitemap 段 + 内容时间源 |
| 修 P1-2 Person→Organization schema | P1（Wave 2，但 D1 已定可提前） | 改现有 | `data/authors/schema.ts` + byline 披露 |
| 需求5 每篇独立封面图 | P2（Wave 1） | 新建 | 现所有页共用站级 `og-image.png`（`generate-seo-pages.mjs:12`）；需 per-slug og:image + 文章页 frontmatter 封面字段 |
| 需求5 WebP 自动压缩 | P2（Wave 1） | 新建 | build 管线加图片压缩步骤 |
| 需求2 IndexNow 接入 | P2（Wave 1） | 新建 | build 后 ping IndexNow（仅 Bing/Yandex，非 Google 收录方案） |
| 需求1 披露式 persona 缓解（byline 格式 + 披露文案 + 非真人头像） | P2（Wave 2） | 改现有 | `AuthorByline.tsx`（现为 `{name} · {title}` 真人格式）+ AuthorPage |
| 需求6 内链工具 + orphan 检测 | P2（Wave 2） | 新建 | 编辑器/管线侧 + sitemap 交叉比对 orphan |
| 需求4 可嵌入 widget | P3（Wave 3） | 新建 | 独立 embed 路由 + iframe + 可选 dofollow |

### Implementation Tasks（build 可执行）

- [ ] **T1 (P1, human ~3h / CC ~30min)** — sitemap — 修 lastmod 污染：按 slug 取真实内容变更时间，停止全站刷 today
  - Surfaced by: eng-review — `generate-seo-pages.mjs:950` + `:13`
  - Verify: 改一篇文章后 build，仅该 URL 的 lastmod 变；其余不变
- [ ] **T2 (P1, human ~2h / CC ~20min)** — author schema — `Person` → `Organization`（编辑部），移除虚构 persona 的 jobTitle/knowsAbout
  - Surfaced by: eng-review — `data/authors/schema.ts:25-31`
  - Verify: 富结果测试工具看 author 为 Organization；persona 页含披露文案
- [ ] **T3 (P2, human ~1d / CC ~2h)** — OG — 每篇独立封面图 + WebP 压缩
  - Surfaced by: eng-review — `generate-seo-pages.mjs:12,202`
  - Verify: 分享某文章卡片显示该文专属图；图 ≤200KB WebP
- [ ] **T4 (P2, human ~2h / CC ~30min)** — IndexNow — build 后 ping（Bing/Yandex）
  - Verify: IndexNow key 部署、ping 返回 200
- [ ] **T5 (P2, human ~3h / CC ~40min)** — author — byline 去真人格式 + 披露文案 + 非真人头像（已是 monogram，确认无真人照片）
  - Surfaced by: eng-review — `AuthorByline.tsx:97-102`
- [ ] **T6 (P2, human ~3d / CC ~半天)** — 内链 — 内链工具 + orphan 检测（sitemap × 内链图交叉）
- [ ] **T7 (P3, human ~1w / CC ~1d)** — widget — 可嵌入 embed（独立路由 + 可选 dofollow，合规形态）

> 注：T1/T2 是线上 P1，建议先单独修掉并验证（对应 scope 选项"先修 2 个 P1"也已覆盖），再推 T3-T7。

---

## Backlog（双模型审计列出的缺失项，逐步折叠，勿一次上全）

> 这些是 plan 之外该补但不必一次做完的，按需在各 Wave 折叠。

1. **内容 pruning / noindex 策略** —— 哪些组合页/日期页**不该**追求收录
2. **anti-spam link policy（写死禁止项）** —— paid links 无披露 / 规模化换链 / PBN / guest post farms / 精确匹配锚文本campaign / 隐藏 embed / 假 HARO 身份 / parasite SEO
3. **crawl budget 行动项** —— 哪些目录抓多不收、哪些重要页没被抓、faceted/tag/archive 是否浪费抓取、hub 是否把权重导向高价值页
4. **SERP/keyword 分层策略** —— high-intent evergreen / glossary / tool / compatibility / timely(transit) / linkable research，每类定 index 规则 + 质量门槛 + 内链 + schema
5. **technical SEO acceptance criteria（逐任务验收标准）** —— sitemap / hreflang / image sitemap / 大小限制等
6. **schema 风险控制** —— FAQ 选择性、Article author entity 合规
7. **真实人外展资产** —— 真人是谁 / 邮箱域名 / 署名页 / press page / 数据来源 / quote policy（Wave 3 前备好，否则卡住）
8. **non-brand clicks 测量细则** —— brand query 排除 regex / country/device 分段 / page groups / 基线日期
9. **GSC 数据不足兜底** —— 新站/低流量站不能只靠 GSC，需 crawl + logs + live inspection 抽样
10. **内容质量收录失败分类法** —— thin / duplicate intent / doorway / template sameness / title cannibalization

---

_审核：Claude Opus 4.8 + OpenAI Codex 对 v1 plan 独立审核，3 个结构性必改两模型一致并已纳入。状态：draft，待团队确认排期与 owner。_
