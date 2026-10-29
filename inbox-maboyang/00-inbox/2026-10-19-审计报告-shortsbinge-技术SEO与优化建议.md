---
title: 审计报告 · shortsbinge.com 技术 SEO 与优化建议
date: 2026-10-19
status: ready-for-review
version: v1.5
scope: 技术抓取、索引、国际化（hreflang）、结构化数据、性能、移动端、内容与内链、响应时间排查与竞品对标（附录B，v1.5并入原独立文档）
method: Chrome 155 无头渲染 + 41 个子 sitemap + robots/响应头/结构化数据检查；GSC 数据使用本机 Crawl Stats 导出（2026-10-08、2026-10-19、2026-10-20 三份），未接入 GSC/GA API；v1.4 另核对了彪哥方`codex-review.md`（基于源码仓库+Vercel原始日志的复核，`.context/seo-audit-review-20261020/`）；v1.5 并入响应时间排查文档
---

# 审计报告 · shortsbinge.com

> ⚠️ **重要更正（10/22，核对彪哥方codex-review.md后）**：本文档P1-4"HTML无CDN缓存"的判断被证实是错误的——我本人实测`x-vercel-cache`头显示HIT/STALE，ISR边缘缓存实际在生效，`max-age=0`只是面向浏览器的缓存指令，不代表后端没有缓存层；P0-2"日语几乎没有排名"的论证存在时间线错误——我本人核对JA剧目sitemap发现84%（3,906/4,660条）的lastmod是10/13，而用来证明"没排名"的GSC数据是10/5-10/11那一周，大部分日语页面在测量那一周根本还没上线，不是hreflang缺失导致的后果。这两条由我本人实测验证，不是单方转述。另有P0-1（403已于10/10归零）、P1-3（分页noindex与已有决定冲突）等多条codex-review提出但本人未独立核实的意见，已分别在对应小节标注，不代表本人已认定其正确。详见文末"v1.4 更新"。

## 0. 一句话结论

**基础技术是扎实的：SSR 内容完整、canonical 干净、404 正确、schema 覆盖到剧集/单集/文章、图片全部有 alt、移动端无横向溢出。**

**真正的短板在国际化：18 个语种的详情页没有有效的 hreflang（只用了 `<a hreflang>`，Google 不认），本地化模板的 title/H1/单集标签仍是英文。抓取量骤降（10-11 起）已核实归因：Googlebot 在抓锁定付费集数的 `/api/play/` 接口被正确拒绝（403），不是 Vercel 拦截；修复方向见 P0-1 补充说明，不是简单删掉 robots.txt 例外。**

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

| #   | 问题                                                                      | severity   | 影响面                       | 修复成本         | 负责人    |
| --- | ----------------------------------------------------------------------- | ---------- | ------------------------- | ------------ | ------ |
| 1   | 抓取量骤降，归因**待重新评估**：原判断是Googlebot请求锁定集数`/api/play/`被403；codex-review称403自10/10起已归零（未独立核实），且提出函数响应长尾（`/sitemap/[shard]` p95=47.5秒等）可能是更直接的原因 | **P0→调查** | 全站抓取预算                   | 先确认403现状+排查慢路由，见v1.4更新 | 后端/SEO |
| 2   | 详情页（剧/单集/文章）缺 `<link hreflang>`                                         | **P0（影响论证已降级，缺hreflang本身仍属实）** | 1 万–3 万本地化 URL（JA/PT 已验证） | 1–3 天        | 前端     |
| 3   | 本地化模板半翻译：title/H1/nav/单集标签仍英文                                           | **P0（定性存疑，见v1.4更新）**     | 18 个语种                    | 1 周（先 4 个语种：ja/zh-TW/es/ar） | 内容/前端  |
| 4   | hreflang 覆盖不一致：静态页 20、文章 0、详情 0                                         | **P1**     | 全站                        | 2–3 天        | 前端     |
| 5   | Sitemap 不含 hreflang alternates                                          | **P1**     | 大规模本地化                    | 2 天          | 后端     |
| 6   | 语言列表分页：99 页/语种，自 canonical 且可索引                                         | **P1（规模数字与noindex建议存疑，见v1.4更新）**     | ~1.9k 页                   | 1 天          | 后端     |
| 7   | ~~HTML 无 CDN 缓存（`max-age=0`）~~ **已证实错误，撤销**                              | ~~P1~~ 已撤销    | —                     | —           | —     |
| 8   | 结构化数据缺字段（Org logo/sameAs、Article image、VideoObject contentUrl/duration） | **P2**     | 富结果/E-E-A-T               | 2–3 天        | 前端     |
| 9   | 大写 URL 返回 200（应 301）                                                    | **P2**     | 重复 URL                    | 0.5 天        | 后端     |
| 10  | robots 把单集 2+ 全禁——**已确认是业务侧刻意策略**（10/16 已和团队对齐，优先扩大剧目覆盖广度，不追求单剧多集独立收录），不是待确认项 | 已解决 | — | — | — |
| 11  | 本地化详情页内链弱：EN 详情只链到 pt 译文，JA 单集的 en 链接指向首页                               | **P1**     | 发现与权重                     | 1 天          | 前端     |
| 12  | 深分页/半翻译页可能稀释站点质量                                                        | **P2**     | 中长期                       | 2 周          | 内容/SEO |
| 13  | **新增（v1.4）**：函数响应长尾，`/sitemap/[shard]`、`/[lang]/best-short-dramas/[slug]`等路由p95响应时间以十秒计 | **P1（待核实，来源是codex-review内部数据，本人未独立复核）** | 响应时间/抓取预算 | 需先查Vercel原始日志确认 | 后端 |

---

## 3. 详细发现

### P0-1（归因已确认）· 抓取健康异常：4XX 高 + 抓取量骤降

> 状态：归因已确认（见下方"补充"小节），不再是"待核实"。下面"现象"到"验收"这几段是最初排查时的记录，保留作过程留痕；**实际结论和行动项以"补充（2026-10-19 GSC 后台核实后）"为准，不要只看这几段就去动 Vercel 配置。**

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

**怎么确认（已完成第 1、2 步，结论见下方"补充"）**

1. ~~GSC → URL Inspection → 输入首页 → Test live URL~~ **已做，10/19 04:09 实测通过，不是 Vercel 在挡**；
2. ~~GSC → Settings → Crawl stats~~ **已做，4XX 明细 954 条样例全部是 `/api/play/` 锁定集数请求，见补充**；
3. Vercel → Firewall → Logs：过滤 `bot_name = Googlebot`、`mitigated = challenge`——**这步还没做（需要 Vercel 后台权限），但鉴于第 1、2 步已经找到更具体的根因，优先级可以往后放，不是必须先做这步**；
4. ~~若发现 Googlebot 被 challenge，去 Vercel Bot Protection 允许名单~~ **不适用，没有证据显示 Googlebot 被 challenge，不要按这条去改 Vercel 配置。**

**验收**：以下方"补充"小节里的验收条件为准，不是"Crawl stats 无 429"这条（4XX 不会归零，锁定集数的 403 是预期行为，归零的应该是"锁定集数被非授权请求命中 403"的次数，不是全部 4XX）。

#### 补充（2026-10-19 GSC 后台核实后）

上面"怎么确认"的第 1、2 步已经做了，结论如下（完整排查过程和交办事项见 `00-inbox/2026-10-19-交办-彪哥-Googlebot抓取量骤降与robots.txt-api-play例外排查.md`）：

1. **首页 Test live URL 通过**：抓取成功、允许抓取、允许编入索引，没有迹象显示 Vercel 在挡 Googlebot。
2. **4XX 明细的 954 条样例全部是 `/api/play/{剧目ID}/{集数}/`**，集数都是 8、12、17、27 这类锁定的付费集，被正确拒绝（403）。样例时间戳集中在 10/8，也就是 10/9 修复（PR #142）上线之前。
3. **robots.txt 目前在 `Disallow: /api/` 下面单独留了 `Allow: /api/play/`**，等于明确放行 Googlebot 去请求这个接口。~~建议去掉这条例外。~~ **此建议已于10/19当天撤回，不要执行**——这条例外同时是免费第1集视频能被Googlebot渲染出来的必要条件，整条删掉会连第1集也一起挡住，详见`00-inbox/2026-10-19-交办-彪哥-Googlebot抓取量骤降与robots.txt-api-play例外排查.md`的更正说明。
4. 抓取量 10/11 起骤降，可能是 Google 对高错误率站点的主动降速，修复后应逐步回升。这一条是推测，没有 Google 内部数据可以证实。**10/22补充**：彪哥方codex-review.md称非授权403自10/10起已归零（引用仓库内部排查记录，本人未独立核实），与本段第2点"954条样例全部早于10/9修复"这一本人已验证的事实方向一致，不矛盾；若属实，说明403这条线索本身已经解决，抓取量骤降更可能要往响应时间长尾（见P1-4更正）或其他方向查。

**彪哥查服务端日志时请注意两点：**

- **日志里有一批来自我们内部的 `/api/play/` 请求，不是爬虫。** 我们写剧集 blog 时，用浏览器调用这个接口获取免费集的视频，用来核对剧情：
  - 10/16：No More Backing Down（剧目 ID `nh3qscvkdwig`）第 1–7 集
  - 10/19：Taming My Bullies（`djfncnmzxyam`）第 1–18 集、How to Tame Your Bully（`gl7brtsjuo2w`）第 1 集、Where My Love Went Wrong（`chfxhaefilog`）第 1–11 集

  这些都在免费集范围内，应该是 200，不会产生 403。如果在日志里看到同一个 IP 短时间内连续请求，就是这批，统计 10/9 之后的非授权 403 命中率时可以剔除。
- **去掉 `Allow: /api/play/` 之前，请先确认它对视频收录的影响。** 播放页的视频地址是页面加载后再通过 `/api/play/` 获取的。这条规则去掉后，Googlebot 渲染播放页时拿不到视频地址，结合 P2-1 里 `VideoObject` 本来就缺 `contentUrl`，视频大概率无法被识别和索引。
  - 如果现阶段不追求视频收录：直接去掉例外即可，没有其他影响。
  - 如果要争取视频收录：建议改成只对免费集开放（例如免费集的 mp4 地址直接写进页面 HTML 或 `VideoObject.contentUrl`，付费集不输出任何可请求的接口路径），而不是对 `/api/play/` 整体放行或整体禁止。

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

**不是只有理论风险，用 10/5-10/11 真实 GSC 数据核对过，已经能看到具体后果**：

| 语种 | sitemap 规模 | 那一周实际露出的页面数 | 展示次数 | 占全站展示 |
|---|---:|---:|---:|---:|
| EN | 4,715 部 | 292 个 | 8,282 | 89.4% |
| JA | 2,018 部（第二大语种） | **3 个** | **4 次** | **0.03%** |
| AR | — | 9 个 | 191 次 | 2.1%，CTR 19.37%（全站最高） |
| zh-TW | — | 8 个 | 278 次 | 3.0% |

**日语最典型**：sitemap 里有 2,018 部剧、4,036 个 URL，是除英语外第二大的语种目录，但那一周在 Google 搜索里真正拿到过展示的只有 3 个页面、4 次展示——4000 多个 URL 一周几乎等于查无此人，不是"排名不稳定"这种程度，是基本没有进入独立排名的候选池。**阿拉伯语是另一种症状，指向同一个病根**：只有 9 个页面拿到展示，但点击率高达 19.37%（全站最高），排名却压在第 28 位左右——需求真实存在，但页面拿不到应有的排名，和语言切换链接指错地方（JA 单集详情页的"en"链接指向首页而不是对应英文页）这类发现与权重传递问题吻合。

> ⚠️ **更正（10/22，本人实测验证）**：以上"日语最典型"这段论证**存在时间线错误，不能成立**。本人核对`sitemap/dramas-ja-0.xml`的4,660条JA剧目URL的`lastmod`分布：**3,906条（84%）的lastmod是2026-10-13**，只有40条早于10/13。而上表用来证明"没有排名"的GSC展示数据是**2026-10-5~10-11那一周**——也就是说，测量那一周，84%的日语剧目页面根本还没有上线，不是"上线了但因为缺hreflang/半翻译排不上去"，是"大部分页面当时还不存在"。用一周前的展示数据去解释一周后才批量上线的页面"没有排名"，是本人核对审计报告时没有检查时间窗口是否匹配，违反了本人自己惯常使用的"数据分析先核对时间窗口"的检查习惯。阿拉伯语那组数字（9个页面/191次展示/CTR 19.37%）本次没有查到对应的上线时间分布，暂不确认是否有同样问题，**不要在时间线核实之前把这组数字当成独立证据使用**。
>
> 缺`<link hreflang>`、语言切换链接指错地方（JA单集的en链接指向首页）这两条**现象本身仍然属实**，不因上面这条更正而消失；撤销的只是"已经看到具体业务后果"这个因果论证，**P0-2的紧迫性应该下调到"已知技术缺陷，待补充更新后的GSC数据重新评估影响"，不是"已确认造成展示量接近归零"**。

**如实说明局限**：这个症状不能 100% 干净地归因到 hreflang 一个问题上——P0-3（本地化模板半翻译）同时存在，日语/阿拉伯语页面本身还带着大量英文模板残留，这本身也会让 Google 觉得内容质量不够、不值得独立收录。P0-2 和 P0-3 大概率是互相叠加、互相强化的关系，**建议合并排期，分开做效果都可能打折扣**。这条关联判断不受上面时间线更正的影响，但紧迫性评估同样要等新数据。

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

> ⚠️ **补充提醒（10/22，转述彪哥方codex-review.md，本人未独立核实）**：codex-review称"19个首页同一title"这个表述不准确——title实际按受众语言生成了不同文案（"for Japanese Viewers" vs "for Portuguese Viewers"这类模板化差异），英文UI本身是此前已有的产品决定（非实现缺陷）。本人核对上面这个例子本身：两条title确实不是逐字相同（locale名称不同），但核心内容（主体句式、H1"Your Next Binge Is Already Here"）确实仍是英文，没有翻译成日语/葡语本身——**这一点codex-review没有否认**，双方对"英文内容还在"这个事实没有分歧，分歧在于这应该算"实现缺陷"还是"已有的产品决定"。这是一个产品定位问题，不是本人能单方裁定对错的技术事实问题，建议在排期本地化工作前先跟团队确认"英文UI"是不是仍然是当前有效的产品决定，如果是，P0-3要降级成"产品方向讨论"而不是"缺陷修复"。

**影响**

- 本地 SERP 里出现英文标题，CTR 和相关性都吃亏；
- 18 个语种共用同一句英文 H1/tagline，弱化"这是本地化页面"的信号；
- 与已翻译的正文不一致，页面语言信号混杂；
- 半翻译页面在质量评估上不如"完整本地化"或"不本地化"。

**修复（内容 + 前端，先做 4 个优先语种）**

1. 业务侧已确定优先语种：**日语（ja）、繁体中文（zh-TW）、西班牙语（es）、阿拉伯语（ar）**——这个选择和本周 GSC 数据也吻合（zh-TW 的 x-guang-toushi-yan 是全站表现最好的单页之一；阿拉伯语 CTR 全站最高但排名最差，供给不足、需求强）；
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

> ⚠️ **补充提醒（10/22，转述彪哥方codex-review.md，本人未独立核实）**：codex-review称按当前采样，语言聚合页总数是797页（非均匀99页/语种，各语种数量不同），"1,881"这个数字可能偏高；同时称"第2页起noindex"这条修复建议与一条已有的10/12内部决定（语言聚合分页应保持可索引、写入sitemap）直接冲突，不是单纯的待实施优化项，实施前需要先跟彪哥确认这条决定是否还成立、要不要正式变更。另外codex-review按路由统计的抓取请求显示，实际抓取量集中在单集模板和`/api/play/`播放接口，语言列表分页请求占比很低，"抓取预算被分页大量占用"这个说法本人在之前回答"语言分页noindex有什么用"时也用过，现在看可能高估了分页本身消耗的抓取量——这条未独立核实，先标注存疑，不直接改原文的结论。

**影响**

- 深分页内容重复度高，抓取预算被大量低价值页占用；
- sitemap 覆盖不完整，Google 发现分页的路径不一致；
- 与 `?page=2` 的行为不一致：genre 的 `?page=2` 返回 200、canonical 到第 1 页、正文相同。

**修复（二选一，推荐 A，但见上方更正提醒，实施前先确认不违反已有决定）**

A. 第 2 页起 `noindex, follow`，并从 sitemap 移除；保留第 1 页索引；
B. 若坚持索引，所有分页自 canonical，sitemap 收录完整（1–99），并确保每页有差异化标题/描述（当前已有 "Page N"）。

另外：统一分页参数，`?page=` 要么 301 到 `/page/N/`，要么 404；不要返回与第 1 页相同的正文。

---

### ~~P1-4 · HTML 没有 CDN 缓存~~ 已证实错误，整条撤销

> ⚠️ **更正（10/22，本人实测验证）**：这条判断**被证实是错误的，撤销**。原判断只看了`cache-control: max-age=0`这一个头，认为"每次都回源、没有缓存"；本人实测同一批页面的`x-vercel-cache`头：

```text
首页：        x-vercel-cache: HIT,   age: 1587秒
trending：    x-vercel-cache: STALE, age: 6027秒
blog文章页：  x-vercel-cache: STALE, age: 10221秒
剧目详情页：  x-vercel-cache: MISS,  age: 0
```

> **`cache-control: max-age=0`只是面向浏览器的指令**（告诉浏览器不要本地缓存，每次都要向服务器确认），**不代表Vercel边缘层没有缓存**——`x-vercel-cache`显示HIT/STALE，说明ISR（增量静态再生）实际在生效，大部分页面是从边缘缓存提供的，不是"每次都从数据库裸查"。这个错误不只是本报告的问题——本人自己在同一周写的响应时间排查文档里也用了同样有问题的`max-age=0`判断方式（10/22已更正，现已并入本文档，见附录B第7节）。
>
> **真正值得排查的方向**（来自彪哥方codex-review.md，本人未独立核实，仅转述）：按路由拆分的Vercel函数响应时间显示`/sitemap/[shard]`等路由p95响应时间高达47.5秒，这是比"要不要加CDN缓存"精确得多、也更值得优先排查的线索，详见附录B第8节。

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

> 和 P0-1 的关联（**10/22更正**：原文"按P0-1的建议去掉Allow: /api/play/"这个前提已撤回，不再适用）：视频地址现在靠 `/api/play/` 在页面加载后获取。
>
> ⚠️ **补充提醒（10/22，转述彪哥方codex-review.md，本人未独立核实）**：codex-review称把mp4直链写进`contentUrl`/HTML与仓库内部工程合同存在冲突（引用`AGENTS.md:862–864`，本人无法访问该路径核实原文）。如果属实，**这条"加contentUrl"的P2建议在未确认合同允许之前不应直接实施**，需要彪哥内部先确认这条约束是否仍然有效、能否有例外空间，不是技术上能加就加。

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

**已确认**：只放第 1 集是业务侧 10/16 对齐过的刻意策略（优先扩大剧目覆盖广度，不追求单剧多集独立收录），不是需要再核实的问题。

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

- [ ] P0-1 已核实完成，不用再做 live test/Crawl stats 这两步；改为：查服务端日志，确认 10/9 修复（锁定集数不发起 `/api/play/` 请求）上线后，该接口的非授权 403 命中率是否已降到接近 0（排除团队自己写 blog 时的调用，见 P0-1 补充里列的 IP/剧目/日期）；
- [ ] 记录当前 GSC 索引数、hreflang 错误数、CWV 分组，作为基线。

### 本周（P0，3–5 天）

- [ ] 详情页输出 `<link rel="alternate" hreflang>`（含 self + x-default），修语言切换链接；
- [ ] 先做 ja / zh-TW / es / ar 四个语种的 title、meta、H1、Episode 标签、页脚、面包屑、CTA 按钮、类型标签本地化；
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
| Googlebot 抓取 | 服务端日志中 `/api/play/` 的非授权 403 命中率明显低于 10/8 之前；后续 2–4 周 GSC 抓取请求总量逐步回升（不要求 4XX 归零，锁定集数的 403 是预期行为） |
| hreflang | 详情页 `<link>` 数量 = 实际译文数 + 1（x-default）；无 "缺少返回链接" 错误 |
| 本地化 | ja/zh-TW/es/ar 四个优先语种的 title/H1/meta/页脚/CTA 按钮/类型标签为目标语言；无英文残留（品牌名除外） |
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

## v1.3 更新（同一天，报告发出去之后的更正）

- P0-1 的"归因待核实"状态已经过时：第 0 节、第 2 节发现总表第 1 行、第 5 节"今天（1 小时）"、第 6 节验收标准里"Googlebot 抓取"这几处原本还停留在"需要优先排查/待核实"的措辞，已同步改成反映"补充"小节里已经确认的结论，避免有人只看这几处、没看到补充小节，又跑去按最初的"去 Vercel Bot Protection 加白名单"这条建议操作——**那条建议已经不适用，不要执行**。
- 第 2 节第 10 行（"robots 把单集 2+ 全禁，需确认只有 ep1 免费"）和 P2-3 的"要确认的"这两处，原本和第 4 节"做得好的地方"对同一件事的表述不一致；这件事本周已经和业务侧对齐过是刻意策略，两处都已改成"已确认"，不再是待办项。
- P0-3 的本地化优先语种，从原来的"pt/es/ja/ko/id"改成业务侧确定的 **ja/zh-TW/es/ar** 四个语种，相应同步了第 2 节发现总表、第 5 节行动计划、第 6 节验收标准里的语种列表。
- P0-2 的"影响"小节补了 10/5-10/11 真实 GSC 数据：日语 sitemap 里 4,036 个 URL，那一周只拿到 3 个页面、4 次展示；阿拉伯语 CTR 19.37%（全站最高）但排名在 28 位左右。原文只有"权重分散、排名不稳定的风险"这类定性描述，现在换成具体数字，并补充说明这和 P0-3（半翻译）大概率是互相叠加的关系，建议合并排期。

## v1.4 更新（2026-10-22，核对彪哥方codex-review.md后）

彪哥方交回一份基于源码仓库+Vercel原始日志的复核（`codex-review.md`），质量明显高于本文档此前依赖的黑盒抓取方式。本人对其中两条可独立验证的结论实际动手复核，**均证实codex-review正确、本文档此前的判断有误**；其余结论因涉及本人无法访问的内部代码仓库/日志，仅作转述标注，不代表本人已认定其正确。

**本人已独立验证、确认是本文档错误的两条**：

1. **P1-4"HTML无CDN缓存"整条撤销**：实测`x-vercel-cache`显示HIT/STALE（age最高10,221秒），证明ISR边缘缓存实际在生效；此前的判断只看了面向浏览器的`cache-control: max-age=0`头，没有检查真正反映边缘缓存状态的`x-vercel-cache`头。这个错误同时存在于响应时间排查文档，已同步更正，现并入附录B第7节。
2. **P0-2"日语几乎没有排名"的时间线错误**：本人核对JA剧目sitemap的4,660条URL，发现84%（3,906条）的lastmod是10/13，而用来证明"没有排名"的GSC数据是10/5-10/11那一周——大部分日语页面在测量那一周还没上线。本人在v1.3为这条结论补充"真实GSC数据"时没有核对这个时间窗口是否匹配，属于本人自己的分析错误，不只是转述上游的问题。

**转述codex-review其余结论，本人未独立核实，已在对应小节标注"待核实"或"转述"**：P0-1（403自10/10起已归零，与本文档自己954条样例均早于10/9修复这一事实不矛盾）、P0-3（本地化是否属于产品决定而非缺陷，存在分歧，英文内容未翻译这一事实本身双方无分歧）、P1-3（1,881页规模数字可能偏高，noindex建议与一条10/12内部决定冲突，抓取预算是否真被分页大量占用存疑）、P2-1（`contentUrl`写入mp4直链可能与内部工程合同冲突）。另外codex-review提出一条本文档完全没有覆盖的新线索——按路由拆分的Vercel函数响应时间长尾（`/sitemap/[shard]` p95=47.5秒等），已加入第2节发现总表第13项，详细讨论见附录B。

## v1.5 更新（2026-10-22，合并文档）

应要求把`2026-10-20-排查-shortsbinge响应时间暴涨与NetShort对标诊断.md`并入本文档，作为"附录B"，原文件已删除。合并原因：两份文档这几天高频互相交叉引用、内容高度重叠（P1-4缓存更正、P0-1抓取量骤降归因、codex-review核对结果都在两边各写一遍），分开维护容易不同步，合并后以本文档为唯一入口。附录B保留了原文档的完整内容和两轮更正记录，只做了标题层级调整（原`#`标题降为`###`，`##`降为`####`），正文、数据、表格均未改动。

---

## 9. 附录B：响应时间暴涨与NetShort对标诊断（原独立文档，2026-10-20起，2026-10-22并入）

> 原文件`2026-10-20-排查-shortsbinge响应时间暴涨与NetShort对标诊断.md`，范围说明：这部分最初是独立文档，不是对`2026-10-19-交办-彪哥-Googlebot抓取量骤降与robots.txt-api-play例外排查.md`的修改或补充——那份文档讨论的是403/robots.txt问题，这里讨论的是响应时间/后端性能问题，是两条独立的线索，不要合并着看。依据：GSC Crawl Stats 10/20导出 + GSC后台实时图表 + Google官方抓取预算文档 + shortsbinge/ReelShort/NetShort三站的实测页面计时数据。

> ⚠️ **重要更正（10/20当天，经DeepSeek审核+我本人复核后）**：下文最初版本把"响应时间暴涨→Google降速→抓取量骤降"写成了确定的因果结论，这个说法**不成立，已降级为待验证假设**——按下文自己引用的表格，抓取量在10-11已经从1301骤降到59，响应时间要到10-12才真正跳到1019ms，**时间顺序是反的**：降速发生在延迟暴涨之前，不能证明是延迟导致了降速，更可能是两者有共同的上游原因（比如403、后端过载），或者降速在前、慢请求占比变化在后。另外原文拿10-09当天338ms作基准线也错了，10-09本身是8365次请求的异常高峰日；我本人重新用GSC 10/08导出算了09-16~10-05的加权平均，是**171.2ms**（61,220次请求），和DeepSeek算的176.8ms基本吻合，应以这个数字做基准，不是338ms。竞品对比里ReelShort那部分也有事实错误：实测`x-powered-by: Next.js`，它其实是Next.js（Pages Router），不是"非Next.js"；实测`cache-control: public, s-maxage=3600`，它配了CDN缓存，不能当"无缓存对照组"用。这些更正已经改写进下文对应章节，保留原始数据不删，只改结论和措辞。详见本附录末"审核与更正记录"。
>
> ⚠️ **第二次重要更正（10/22，核对彪哥方codex-review.md后）**：本文档沿用了"shortsbinge HTML无边缘缓存"这个前提（和正文P1-4犯的是同一个错误），**这个前提被证实是错的**。本人实测`x-vercel-cache`头：首页HIT（age 1587秒）、trending页STALE（age 6027秒）、blog文章STALE（age 10221秒）——Vercel边缘层的ISR实际在生效，不是"每次都从数据库裸查"。`cache-control: max-age=0`只是面向浏览器的指令，之前只看了这一个头就下"无缓存"的结论，是本人的方法论错误。同时codex-review提供了一份更精确的内部数据——按路由拆分的Vercel函数响应时间长尾，`/sitemap/[shard]`等路由p95响应时间高达47.5秒，比本附录自己用黑盒测试测到的数字更具体、更可能是真实瓶颈所在，但这组数字本人无法访问原始日志独立核实，只能转述标注，不能当确定结论使用。详见本附录末"第二轮更正记录（10/22）"。

### 一句话结论（更正后）

抓取量骤降期间，GSC测到的"平均响应时间"确实同步出现了异常波动（200ms~2374ms来回跳），这是**事实**，但"延迟导致Google降速"目前只是**待验证的假设**，不是已确认的因果——按时间顺序，抓取量的骤降（10-11）早于响应时间的明显跳升（10-12），谁是因谁是果、还是两者共因，需要服务端日志按小时核实才能定。能确认的是：我们的页面路由（HTML）在手工测试中反复出现下载/流式传输阶段异常慢且不稳定（2000~6351ms，静态资源同期稳定在1~3ms），竞品NetShort同架构同页面体积下测得更快更稳；但这轮外部测试的样本量小、单次数字不稳定（见更正记录），"3~18倍"这个具体倍数不应再引用，只能说"方向上更快更稳"。这部分最终需要彪哥从服务端日志/APM角度核实，外部黑盒测试只能提供排查方向，不能当定论。

### 核实过程与结论

#### 1. 抓取量骤降期间，响应时间同步暴涨且极不稳定——这是事实，不是推测

GSC Crawl Stats 10/20导出`抓取统计信息摘要图表.csv`按天的数据（日期,请求数,字节数,平均响应时间ms）：

| 日期 | 请求数 | 平均响应时间(ms) |
|---|---|---|
| 10-09 | 8365 | 338 |
| 10-10 | 1301 | 200 |
| 10-11 | 59 | 371 |
| 10-12 | 78 | 1019 |
| 10-13 | 80 | 1971 |
| 10-14 | 7 | 964 |
| 10-15 | 24 | 2374 |
| 10-16 | 11 | 439 |
| 10-17 | 46 | 922 |

请求量从10-09的8365骤降到10-11之后的个位数到几十，响应时间同期从几百ms窜到1000~2374ms区间，忽高忽低。GSC后台实时图表核实到10/18，这条曲线还没恢复，响应时间仍在900ms左右的高位。

**⚠️ 时间顺序提醒**：请求量在**10-11**已经骤降到59（从10-10的1301），而响应时间要到**10-12**才明显跳到1019ms（10-11是371ms，比10-10的200ms略高，还没到"暴涨"的程度）。也就是说降速发生得比延迟暴涨早一天，这跟"延迟暴涨导致Google降速"的因果方向是矛盾的，这条线索的定位应该是"两者同期、先后关系待查"，不是"已确认延迟是原因"。

**⚠️ 统计口径提醒**：GSC"平均响应时间"是当天所有被抓取文件类型（HTML/JSON/JS/API/图片等）的聚合平均值，10-11之后每天样本只有7~80个请求，个别慢请求就能把均值拉得很高，这条曲线能证明"均值确实涨了"，但不能直接等同于"页面路由本身变慢"——需要按URL/文件类型/状态码拆分才能验证，这是GSC导出本身给不了的，需要服务端日志。

#### 2. 为什么这条线索比"403"更值得重视：Google官方文档点名的是延迟，不是403

查了Google官方抓取预算文档（`https://developers.google.com/search/docs/crawling-indexing/large-site-managing-crawl-budget`），原话：

> "If the site slows down (latency increases or response times become longer), or responds with server errors (5xx HTTP status codes) or rate-limiting signals (such as HTTP 429), the limit goes down and Google crawls less."

官方点名的触发条件是**延迟/响应变慢、5xx、429**，**403不在这个名单里**。需要补充一个准确度上的限定：这段引文说的是"crawl capacity limit"（Google自己给自己设的抓取能力上限），不是"crawl demand"（Google主动想不想多抓）；如果403发生在`/api/play/`这类非HTML接口上，对抓取需求/索引的影响本身就小，跟直接影响能力上限的延迟/5xx/429不是同一个机制在起作用。这不是说403问题不存在或不用管（`/api/play/`锁定集数403的那条线索仍然成立，另见`2026-10-19-交办-彪哥-...`文档），而是说：响应时间暴涨这条，和Google自己写的"能力上限"触发条件匹配得更精确，**值得作为独立方向排查**，但不能说它就是抓取量骤降的"更直接原因"——两者也可能来自同一个后端过载的共同上游，具体先后和因果关系还没有被证实（见上文时间顺序提醒）。两条线索不互斥，都需要处理，但都还是待验证假设，不是确定结论。

#### 3. 实测验证：慢的是页面路由的"响应流式传输"阶段，不是本地网速的锅

用Resource Timing API（`performance.getEntriesByType('resource')`）把每次请求拆成两段看：TTFB（`responseStart - requestStart`，首字节前的等待）和下载/流式传输阶段（`responseEnd - responseStart`）。

同一时间窗口交替测试shortsbinge的静态资源和页面路由作对照：
- 静态资源：下载阶段稳定在1~3ms
- 页面路由（如trending页）：下载/流式传输阶段测到2000~6351ms，同一个页面反复测还忽高忽低

静态资源全程稳定、页面路由全程不稳定，这个对比本身就排除了"是我们这台电脑网速不稳定"这个解释——网速问题会同时拖慢所有请求，不会只挑页面路由下手。

**⚠️ 方法论限制**：这里用的`performance.getEntriesByType('resource')`测的是脚本发起的`fetch()`请求的计时，不是浏览器真实"导航"（打开一个新页面）的计时——两者用的底层连接状态不完全一样（`fetch()`可能复用已有连接，真实导航是冷启动），严格测页面导航应该用`performance.getEntriesByType('navigation')`。另外静态资源"1~3ms"没有确认是否命中了浏览器本地缓存（没加cache-buster），如果是缓存命中，这个数字本身就不能当"网络正常"的参照。这两点都不改变"页面路由明显比静态资源慢"这个方向性结论，但精确数值需要用cache-buster+`navigation`计时类型重新测一轮才可靠，这里先如实标注限制。

#### 4. 页面体积核实："几十KB"说的是压缩后传输体积，解压后内容是300~800KB，其中一半是RSC流式数据

查到trending页解压后约395KB，其中Next.js RSC流式传输载荷（`<script>self.__next_f...</script>`块）占了208KB，约52%。这部分数据是页面渲染需要等后端陆续"流"过来的内容，不是一次性吐出去的静态HTML，这也是为什么前面测到的慢集中体现在"下载/流式传输阶段"而不是单纯的TTFB。

#### 5. 对标竞品：ReelShort vs NetShort（更正后）

**⚠️ 这张表的ReelShort那一列，原始版本有两处事实错误，已更正**：原文说ReelShort"非Next.js架构"，依据是`server: istio-envoy`——这个头只能说明前面架了一层Istio代理，**不能说明应用框架**；本人重测实际响应头是`x-powered-by: Next.js`，加上`__NEXT_DATA__`标签存在、无`self.__next_f`（RSC标记），说明**ReelShort是Next.js，用的是Pages Router，不带App Router/RSC**，不是"非Next.js"。另外原文把ReelShort当"无缓存对照组"，但实测`cache-control: public, s-maxage=3600, stale-while-revalidate=7200`，说明它配了CDN共享缓存——这意味着ReelShort这组数字没有控制住"缓存状态"这个变量，不能干净地当"后端裸速度"的参照。

同时，NetShort的数字本身**单次测试不可复现**：最初测到247~254ms，本人用cache-buster重测5次（避免浏览器缓存干扰）得到315~771ms，DeepSeek在他们那边测到的是1.08~1.14秒TTFB、1.56~1.94秒总耗时——三轮测试互相对不上，说明是单次/小样本手工测试的正常波动（跟测试时间、网络路径、CDN节点都有关），不是NetShort真实性能的精确值。

| | ReelShort | NetShort | shortsbinge |
|---|---|---|---|
| 页面体积 | 598KB（本人重测约598~612KB） | 395KB | 395KB |
| 架构 | **Next.js（Pages Router，无RSC）**，`server: istio-envoy`代理 | Next.js App Router + RSC，63%是RSC载荷 | Next.js App Router + RSC，52%是RSC载荷 |
| 缓存策略 | **CDN共享缓存 `s-maxage=3600`**（未控制变量） | 边缘`no-store`+`cf-cache-status: DYNAMIC`（无边缘缓存，但不代表无origin数据缓存） | `cache-control: max-age=0`（面向浏览器），但**10/22实测`x-vercel-cache`显示HIT/STALE，ISR边缘缓存实际在生效**，不是无边缘缓存，见下方第7节 |
| 总耗时（单次/小样本，不代表稳定值） | 多次约900ms~1060ms | 本人测315~771ms，DeepSeek测1.56~1.94s | 普遍更慢且波动更大 |

**降级后的结论**：这张对比表的问题在于变量没控制住（ReelShort缓存状态不明、样本量太小、测试环境未固定），**"NetShort快3~18倍"这个具体倍数不能再引用**。方向性的观察还站得住——NetShort同架构（Next.js RSC）同页面体积下，手工测试里反复观察到比shortsbinge更快更稳定，但这只能作为"值得深挖"的信号，不能当作已证实的性能差距。要拿到可靠倍数，需要固定测试机/时段/页面类型，每个站点连续采样至少20次，报p50/p75而不是单次或3~5次的数字。

#### 6. 排除"NetShort是靠缓存取巧"这个可能性

查了NetShort首页的响应头：

```
cache-control: private, no-cache, no-store, max-age=0, must-revalidate
cf-cache-status: DYNAMIC
vary: rsc, next-router-state-tree, next-router-prefetch, next-router-segment-prefetch, Accept-Encoding
```

`cache-control`明确禁止缓存，`cf-cache-status: DYNAMIC`说明Cloudflare边缘也没有缓存命中。**⚠️ 更正**：这只能证明"Cloudflare边缘没有缓存这个HTML响应"，不能证明"origin后端没有数据层缓存"——origin内部完全可能用Redis、Next.js Data Cache、内存缓存等方式缓存数据库查询结果，只是最终HTML响应不走边缘缓存这一层。准确说法应该是：**没有边缘HTML缓存，不代表"每次都是从数据库裸查"**。这个更正反而让"检查是否有数据层缓存/建议加一层"这条排查方向更合理，不是自相矛盾。`vary`头里的`rsc`/`next-router-state-tree`等字段确认了他们和我们一样是Next.js App Router + RSC，架构确认对得上，这条不受上面更正的影响。

#### 7.（10/22新增）shortsbinge自己的边缘缓存其实在生效，此前"无CDN缓存"的前提是错的

本附录第5节表格此前把shortsbinge标成"`max-age=0`，无边缘缓存"，跟正文P1-4犯了同一个错误——都只看了`cache-control`这一个面向浏览器的头。10/22实测`x-vercel-cache`（真正反映Vercel边缘缓存状态的头）：

```
首页：        x-vercel-cache: HIT,   age: 1587秒
trending页：  x-vercel-cache: STALE, age: 6027秒
blog文章页：  x-vercel-cache: STALE, age: 10221秒
剧目详情页：  x-vercel-cache: MISS,  age: 0
```

HIT/STALE说明ISR（增量静态再生）实际在生效，大部分页面类型是从边缘缓存提供的，不是"每次请求都从数据库裸查"。这个更正**不代表响应时间慢的问题不存在**（GSC测到的延迟暴涨、本人实测的下载/流式传输阶段不稳定都还是事实），但说明"因为没有CDN缓存所以慢"这个此前隐含的解释方向是错的——慢的原因不在"要不要加缓存"，这条排查方向（下方"检查数据查询是否有数据层缓存"）本身仍然成立，但不是"从0开始加缓存"，而是要搞清楚**为什么已经存在的ISR缓存还是不够快、或者为什么大量命中MISS/STALE而不是HIT**（比如剧目详情页这次实测就是MISS）。

#### 8.（10/22新增，转述彪哥方codex-review.md，本人未独立核实）一份更精确的内部数据：按路由拆分的函数响应时间长尾

彪哥方交回一份基于源码仓库和Vercel原始函数日志的复核文档（`codex-review.md`），里面有一组本人完全没有渠道获取、但如果属实会比本附录黑盒测试精确得多的数据——10/13~10/20窗口内，按UA过滤`Googlebot/2.1`后的函数响应时间分位数，按路由拆分：

| 路由 | 函数调用数 | TTFB p50 | TTFB p95 |
|---|---:|---:|---:|
| `/sitemap/[shard]` | 136 | 3.3秒 | **47.5秒** |
| `/[lang]/best-short-dramas/[slug]`（blog文章页） | 7 | 23.8秒 | 28.9秒 |
| `/[lang]/drama/[slug]/episode/[episode]`（单集页） | 54 | 0.8秒 | 18.9秒 |
| `/[lang]/drama/[slug]`（剧目详情页） | 14 | 1.0秒 | 1.7秒 |
| `/api/play/[dramaId]/[episode]` | 64 | **0.05秒** | **0.35秒** |

如果这组数字准确，**`/sitemap/[shard]`（sitemap分片生成）和blog文章页才是真正的慢路由**，`/api/play/`这个本附录此前重点怀疑的接口反而是最快、最稳定的一个——这跟本附录此前"慢的是RSC流式传输阶段，可能是后端数据拉取效率"的方向性判断不矛盾，但精确到了具体路由，比本附录自己测到的"trending页下载阶段2000~6351ms"更具体。文档还给了一条代码级排查入口：`sitemapShardResponse`调用`sitemapShards`构造全站分片集合——如果属实，sitemap生成逻辑本身可能是需要优先排查的地方。

**这组数字本人完全没法独立核实**——引用的是对方代码仓库里的原始JSON文件和特定commit（`3b23c96329c3f25932e5fdd45552001ee83ea2e8`），本人既没有仓库访问权限，也没有这份原始日志，只能转述、不能背书。但它给出的具体数字、具体路由、具体代码入口，比本附录这周全部的黑盒测试加起来都更接近"能直接动手修"的程度，建议彪哥团队优先验证这组数字是否准确，如果准确，应该取代下方"检查方向"列表，直接去查`/sitemap/[shard]`和blog文章页这两个具体路由。

### 外部测试能定位到什么程度，定不到什么程度

这轮测试全部是黑盒测试（只能发请求看响应，看不到NetShort的源代码、数据库、服务器配置），**能确认的方向性观察**（不是精确倍数，见上文更正）：
1. 架构选型不是决定性因素（同样用RSC，NetShort手工测试里反复更快）
2. 页面体积/RSC占比本身不是决定性因素（同体量，NetShort占比还更高）
3. "边缘要不要缓存"这个策略选择不是决定性因素（双方HTML都不走边缘缓存）
4. 瓶颈更可能在**后端给RSC组件提供数据这一步的速度和稳定性**，但这是推断方向，不是已证实结论——也没有排除"问题出在Googlebot抓取环境本身，不在后端"这个可能性（需要对比真实用户RUM数据才能排除）

常见能让这一步做到又快又稳的工程手段，列出来供彪哥对照排查，这是**待验证的方向，不是确定结论**：
- 数据拉取是否并行（`Promise.all`一次性发出多个查询）而不是串行等待
- 是否有一层数据缓存（例如Redis）顶在主数据库前面，和"页面本身不缓存"不矛盾
- 数据库查询本身的索引/效率，以及是否拿了超出页面实际需要的冗余字段

### 需要彪哥做的事（响应时间部分）

**10/22新增、优先级最高的一步**：核实上方第8节转述的codex-review函数响应时间数据是否准确——如果`/sitemap/[shard]` p95=47.5秒这组数字是真的，这是目前为止最具体、最可能直接定位到根因的线索，建议先确认这组数字、再决定后续方向，比下面几步更优先。

**其次，优先级最高、能一次性回答"是不是真因果"的两步**（这两步外部测试做不到，必须从内部看）：

1. 查服务端日志，按**小时**粒度核实10-10~10-13这段时间：响应时间真正变慢是从哪个时间点开始的，跟抓取量下降（10-11）的先后顺序到底是什么——这是判断"延迟是降速的因"还是"降速的果/另有共因"的关键证据，外部黑盒测试给不了
2. 按**URL/路由类型**（trending页/剧集页/`/api/play/`/静态资源）和**状态码**分别拉响应时间分布，而不是只看全站聚合均值——确认是不是某一类请求（比如HTML页面路由）特别慢，还是全站普遍慢

**其次，缩小后端性能差距范围的几个方向**（供参考排查，不是确定诊断）：

3. 检查trending页等高流量页面渲染时，给各组件取数据的调用是并行发出还是串行等待，串行改并行是成本最低、见效可能最明显的一步
4. 检查数据查询是否有数据层缓存（Redis或类似方案，和"HTML不走边缘缓存"是两件不矛盾的事），没有的话评估加一层
5. 检查相关数据库查询的执行计划/索引，确认没有全表扫描或冗余字段拉取
6. 看Vercel Serverless函数区域和数据库区域是否一致，跨区访问是常见的1~3秒延迟来源
7. 如果有Vercel Speed Insights/GA4等真实用户监控数据，对比一下真实用户的TTFB是否也慢——如果真实用户正常、只有Googlebot慢，问题可能在爬虫侧而不是后端，这个判断很关键，外部测试做不到
8. 这几项排查和`2026-10-19-交办-彪哥-...`文档里"确认403是否归零"的事项并行推进，互不冲突，但第1步的日志核实建议优先做，它决定了后面该往哪个方向投入精力

### 验收标准（响应时间部分）

- GSC Crawl Stats的"平均响应时间"回落到事发前的基准附近——**事发前（09-16~10-05）加权平均约171ms**（61,220次请求，本人用GSC 10/08导出重新核算；此前版本误用10-09单日的338ms做基准，10-09是异常高峰日，已更正），目标是p75回到200~250ms区间或至少回到171ms±20%，并标注样本量
- 对同一高流量页面做固定方法的重复采样（同一测试机/时段/至少20次，用`navigation`计时类型，报p50/p75），下载/流式传输阶段的中位数明显收窄，不再频繁出现2000ms以上的异常值
- 抓取请求总数回升——这是**滞后观察指标**，不是硬性验收项，回升本身不能反向证明响应时间就是降速的原因（见上文时间顺序提醒）

### 原始数据与出处（响应时间部分）

- `~/Downloads/https___shortsbinge.com_-Crawl-stats-2026-10-20/抓取统计信息摘要图表.csv`（日请求量/响应时间趋势）
- `~/Downloads/https___shortsbinge.com_-Crawl-stats-2026-10-20/响应表格.csv`、`文件类型表格.csv`、`目的表格.csv`、`Googlebot 类型表格.csv`
- GSC后台Crawl Stats实时图表（核实到10/18，趋势未恢复）
- Google官方文档：`https://developers.google.com/search/docs/crawling-indexing/large-site-managing-crawl-budget`
- 本次对shortsbinge.com、netshort.com、reelshort.com三站的实测页面计时数据（Resource Timing API + fetch响应头），测试时间2026-10-20，为一次性手工测试，非自动化监控
- `~/Downloads/https___shortsbinge.com_-Crawl-stats-2026-10-08/抓取统计信息摘要图表.csv`（事发前09-16~10-05基准数据，本人重新加权核算得171.2ms/61,220次请求）
- `2026-10-20-审核-响应时间排查与NetShort对标文档.md`——DeepSeek对本附录初版的审核意见，指出的ReelShort事实错误、NetShort数字不可复现、因果时间顺序问题、基准线选错，均已本人独立复核确认属实，已采纳并改写进上文对应章节

### 审核与更正记录（10/20当天）

本附录初版发出后，DeepSeek做了一轮审核（见`2026-10-20-审核-响应时间排查与NetShort对标文档.md`），指出若干事实错误和方法论问题。本人逐条用可获取的数据/实测独立复核，结果：

| DeepSeek指出的问题 | 本人复核结果 | 处理 |
|---|---|---|
| ReelShort不是"非Next.js" | **确认属实**，重测`x-powered-by: Next.js` | 已更正第5节 |
| ReelShort不是"无缓存基线" | **确认属实**，重测`cache-control: public, s-maxage=3600` | 已更正第5节 |
| NetShort 247~254ms不可复现 | **确认属实**，本人重测（cache-buster，5次）得315~771ms，三轮测试互不一致 | 已更正第5节，"3~18倍"不再引用 |
| "每次重新生成"证据不足 | **确认属实**，no-store+DYNAMIC只能证明无边缘缓存 | 已更正第6节 |
| 10/11起暴涨，实际是10/12 | **确认属实**，按自己表格核对 | 已更正第1节 |
| 因果顺序：先collapse后latency | **确认属实**，10-11抓取量已降，10-12响应时间才跳升 | 已更正一句话结论+第1节，降级为待验证假设 |
| 基准线338ms偏高 | **确认属实**，本人重新加权核算09-16~10-05得171.2ms，与DeepSeek算的176.8ms基本一致 | 已更正验收标准 |
| GSC均值是聚合值，样本量小 | 结构性成立，无法用现有GSC导出反驳 | 已加统计口径提醒 |
| Resource Timing测的是resource非navigation | 技术上成立 | 已加方法论限制说明 |
| 竞品对比变量未控制 | 成立，直接导致NetShort数字不可复现 | 已更正第5节表格+说明 |
| 没有对比真实用户(RUM)和Googlebot | 成立，是判断"后端问题"还是"爬虫侧问题"的关键缺口 | 已加入"需要彪哥做的事"第7条 |

DeepSeek这轮审核质量高，不是走流程，建议以后类似排查文档发出前先过一轮这种审核。

### 第二轮更正记录（10/22，核对彪哥方codex-review.md后）

彪哥方交回一份基于源码仓库+Vercel原始函数日志的复核（`codex-review.md`），同时核对了本文档正文和本附录。本人对可独立验证的部分实际动手复核：

| 问题 | 本人复核结果 | 处理 |
|---|---|---|
| "shortsbinge HTML无边缘缓存"的前提 | **确认是错的**，实测`x-vercel-cache`显示HIT/STALE（age最高10,221秒），ISR实际在生效；此前只看了`cache-control: max-age=0`这一个面向浏览器的头 | 已更正第5节表格+新增第7节 |
| 按路由拆分的函数响应时间长尾（`/sitemap/[shard]` p95=47.5秒等） | **本人无法独立核实**，引用的是对方仓库内部原始数据，本人没有访问权限 | 已作为新线索加入第8节，明确标注"转述，未核实"，已调整"需要彪哥做的事"优先级 |

这次更正和上一轮（DeepSeek那次）性质不一样：上一轮是本人自己的测试方法论有问题（样本小、变量没控制住、时间顺序算错），这一轮的核心错误（`max-age=0`≠无缓存）本人用`x-vercel-cache`头实测verified了，属于确认的事实错误，不是方法论局限；而函数响应时间那组数字本人完全没有验证手段，只能如实标注为转述，不能像对待自己的实测数据一样背书。
