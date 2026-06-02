# AstrologyWiki「SEO 机会诊断（7 天 MVP）」评估

> 评估对象：Google Doc `AstrologyWiki — SEO 机会诊断（7 天 MVP）`（关键词机会矩阵 25 项 + Top-10 MVP + 7 天执行计划，Ahrefs US 2026-06-01 快照）
> 评估方法：读源码 `/Users/wzb/Code/oracle`（sitemap 250 URL + generate-seo-pages.mjs + wiki.ts/articles + components）+ Ahrefs/GSC MCP 核验 + 6-agent 扇出（现状对账/既有结论对照/内容深度/战略/合规/综合）+ Codex(gpt-5.5 xhigh) 独立二审
> 日期：2026-06-02 ｜ 状态：**仅评估，未改代码**
> 与前序文件关系：这是**新文档**（关键词机会主导），不同于 6/2 评估的 `astrologywiki_final_report.md`（数据合并报告）。约 60% 内容是新的，40% 重述已落地决策。

---

## 0. 总判断

**执行前需修正，但保留关键词地图 —— 不要照单跑 7 天 sprint。**

这是目前为止**最强的「该建什么」артефакт**（25 个关键词按 vol/KD/intent 排序、且 Ahrefs 数据多数精确），但**作为执行计划不可直接落地**，四个结构性原因：

1. **核心前提是假的**：文档说"结构已齐，只差 schema/PAA/内链"，但它自己列的 ~30 个目标 URL 里 **~28 个根本不存在**；而真正"齐"的结构是文档从不提及的 **Vedic/脉轮/Aura** 那套（即站点跑偏方向）。
2. **完全无视已落地的 plan-of-record**（6/1 Wave 0-3 + 6/2 评估，均已 ship），重复推导或**直接违背**已定决策（canonical 策略、Organization 作者署名、soft-404 修复、lastmod 内容签名、IndexNow=仅 Bing/Yandex、KPI=有效收录页）。
3. **两个旗舰动态页**（实时 Mercury、Full Moon ISR）会**重新引入团队刚用 5 个 PR 才杀掉的 SPA soft-404**——而架构是纯静态预渲染，**根本没有 ISR 机制**（vercel.json 零 isr/revalidate/cron）。
4. **CBT/焦虑内容走静态 wiki 管线**，而 oracle 的危机检测/免责/反宿命强制控制**只存在于 /cbt 的 LLM 路径**——静态管线零安全控制，直接踩 CLAUDE.md AI 安全红线 1/3/4。

**数据准确度评分：5/10**（vs 仓库现实）。关键词量/KD 多数扎实，合规意图正确；但"结构已齐"是全文最大硬伤，且把产品错描述成了西方/心理学/无神秘主义。

---

## 1. 数据核验（Ahrefs US 2026-06-01，主线亲自拉）

### ✅ 准确（说明分析师用了真实数据）

| 断言 | 文档值 | 实测 | 结论 |
|---|---|---|---|
| astrologywiki.com 自然流量 | ≈0 | org_traffic=0 / kw=0 / top1-3=0 | **精确属实**（Ahrefs 视角；GSC 另见 §3）|
| costarastrology.com | 315,010 / 23,141 / 4,441 | 315,010 / 23,141 / 4,441 | **完全一致** |
| is mercury in retrograde | 60k / KD34 | 60,000 / KD34 | ✅ |
| synastry chart | 15k / KD28 | 15,000 / KD28 | ✅ |
| saturn return calculator | 14k / KD20 | 14,000 / KD20 | ✅ |
| venus in scorpio / aries | KD1-5 | 4,000/KD1 · 3,500/KD2 | ✅ |
| north node in scorpio / leo | KD0-1 | 1,800/KD0 · 1,700/KD1 | ✅ |
| co star | 3.8k / KD47-57 | 3,800 / KD57 | ✅ |

### ❌ 被夸大的"易赢"断言（决策要害）

| 关键词 | 文档值 | 实测 | 问题 |
|---|---|---|---|
| **rising sign** | KD ≤35（凭"Co-Star 排第一"猜）| **24,000 / KD 65** | D2 四大立柱之一，难度被**严重低估**；新站不可赢 |
| **big three astrology** | 估 1.5-6k / KD15-30 | **1,300 / KD 41** | 量更小、KD 更高（文档自标"待验证"）|
| **full moon meaning** | 混入 73k-101k | **4,500 / KD 23**（"meaning"常青词）| 73k-101k 是 "full moon [月] 2026" 季节性时效词，常青机会被夸大；head term 实际 KD≈80 |

**结论**：文档拿"待验证"当事实、且把全站最难的 head term 当易赢程序化页。决策必须基于核验后的数。

---

## 2. 现状对账：「结构已齐」是假的 + 战略分叉

### 文档 10 个 P0 的真实状态（逐一查盘）

| P0 页面 | 文档定性 | 真实状态 | 证据 |
|---|---|---|---|
| /saturn-return-calculator | 优化 | **存在** ✅ | 唯一定性正确的"已有资产" |
| /synastry-chart | 深化 | **仅 wiki 解释页** | 无独立可索引 TOOL 落地页（≠ "deepen"，是新建）|
| /is-mercury-retrograde-right-now | 新建动态 | **0** | 架构纯静态，无 ISR 机制 |
| /wiki/north-node-in-{sign}×12 | 程序化 | **2/12**（scorpio, taurus）| 无程序化生成器，每页手写 .ts |
| /wiki/venus-in-{sign} Top5 | 程序化 | **0/12** | 仅 venus、venus-mahadasha |
| /wiki/rising-sign | 新建+mini calc | **仅同义页 ascendant** | 新建会变成 ascendant/house-1 的第 4 个竞争页 |
| /alternatives-to-co-star | 对比页 | **0** | best-astrology-mental-health-apps 可作种子 |
| /full-moon hub+月页 | 时效 ISR | **0** | 无 ISR；robots Disallow /forecast、/cycles |
| /wiki/big-three + 分享卡 | 新建 | **0** | 无交互卡生成器（OG 是静态光栅）|
| synastry-aspect-matrix×7 | 程序化 | **0** | 全新内容类型，无模板 |

→ **~28/30 目标 URL 不存在；唯一对的"已有"动词是 saturn-return-calculator。**

### 战略分叉（三信源一致结论：选 Western-core，但别 noindex 跑偏簇）

文档定位 = "Western / 心理学 / 无神秘主义"；**站点真实在投的是反方向**：

- **Vedic/Mahadasha 全簇**（mahadasha + rahu/ketu/saturn/venus-mahadasha + vedic 计算器 + vedic-vs-western）——本周 git log（09e1be9 等）就是 **EMPATH+MAHADASHA 批次**
- **完整脉轮系统**（7 脉轮 + chakra-test + crystals，~15 页）+ **完整 Aura 支柱**（aura-reading + 8 色页，~9 页）——**直接撞 "no mysticism"**
- **HSP 簇**（4 页）+ 全 12 宫 + transits 簇 + ~30 页 Classics 书库

**关键反差**：Aura 簇是目前**唯一在产生 GSC impression 的页**（~30% 曝光，position 90+，0 点击），且 6/2 已**明确决定保留 index,follow**。文档却当它不存在。
→ **裁决**：内容生产转向 Western-psych（north-node/venus/synastry，KD0-2 可赢）；但**不要 noindex** 神秘簇（它是唯一爬取信号），按 30 天 GSC 数据再决定 lean-in 或 canonical 合并。

---

## 3. 与已落地 plan-of-record 的冲突（文档完全没引用，最隐蔽也最关键）

官方 plan-of-record = 6/1 Wave 0-3 执行计划 + 6/2 评估（T1-T7 已 ship 到 main）。文档与之的冲突：

| # | 文档主张 | 已落地的现实 | 严重度 |
|---|---|---|---|
| 1 | 实时 Mercury / Full Moon "ISR hourly + Web Worker" | 团队刚用 PR #40/#43/#44/#45/#47 杀掉的 SPA soft-404 就是这个模式；架构纯静态无 ISR | **CRITICAL** |
| 2 | 作者 schema = Person + sameAs + 心理学资质 | 已 ship 的反垃圾决策：作者 = Organization(编辑团队)、披露 persona、**无** jobTitle/sameAs（"非真实个人"）；给疗愈内容挂假资质 = 暗示临床权威 | HIGH |
| 3 | transit-chart 作为独立 P1 关键词目标 | 已 ship 为 **canonical 输家** → /wiki/transits（wiki.ts 映射 sitemap:false）| HIGH |
| 4 | rank/流量预测主导（25-URL Rank Tracker）| KPI 已降级 rank/DR 为观测项，主 KPI = **有效收录页 + 非品牌点击** | MEDIUM |
| 5 | IndexNow on publish（暗示助 Google）| 已知：IndexNow **仅 Bing/Yandex**，对 Google 无效；Google Indexing API 已被否决为无效 | LOW |

**另：双管线蚕食（文档完全没提）**——backend/wiki.ts 与 data/articles/*.ts 两套管线发出**重叠的 self-canonical 可索引 slug**：house-1..12 与 1st-house-meaning..12th-house-astrology **同时存在**、3 对相位页、2 对角点页、孤立 house-5 目录。任何新程序化批次（north-node/venus/aspects）不走 `WIKI_SEO_OVERRIDES` canonical map 就会**继续分裂信号**。

---

## 4. 合规红线（CLAUDE.md 强制，文档踩 5 类）

| 风险 | 严重度 | 红线 |
|---|---|---|
| **CBT/焦虑/抑郁内容走静态 wiki 管线**：危机检测/免责/反宿命**只在 /cbt LLM 路径**，静态管线（data/articles→mdToHtml→WikiArticleDetailPage）零控制 | **CRITICAL** | AI 安全 #1/#3/#4 |
| 新增**自由文本录入面**（mood/journal/CBT widget）到达 LLM 但不过 `detectCrisis()`（/ask 现也无危机门）| **CRITICAL** | AI 安全 #3（须 fail-CLOSED）|
| synastry 相位矩阵×7 / 兼容性 144 **绕过反宿命**（will/must/destined 无静态检查）| HIGH | AI 安全 #2 |
| 名人盘（即便 Rodden AA/B）：真人占星人格判断 = 隐私/名誉/与"不下判断"冲突 | HIGH | 隐私红线 + 定位 |
| Big Three 卡 / mini-calc / synastry 处理 DOB：现有 SaturnReturnCalculator 用 **GET ?date= 传 DOB 到后端**（非本地计算），"无存储"是空话；卡/事件可能泄 PII | HIGH | 隐私红线 #1/#2/#3 |
| **EN-only ~30 页** vs 站点 EN+ZH 双语 hreflang → 单腿 hreflang 簇 | MEDIUM | i18n 规范 |

→ **疗愈类内容必须先建"生成器强制的免责+危机热线 footer"（复用 helplines.ts + CBT 文案）+ 构建期反宿命 linter，才能开工。**

---

## 5. KEEP / CUT / REPRIORITIZE

**KEEP（保留）**：saturn-return-calculator 优化（14k/KD20，唯一真已有资产）· north-node-in-{sign} 补 10/12（KD0 可赢）· venus-in-{sign} Top5（KD1-5）· /llms.txt（确认缺失，30 分钟 on-positioning AI 引用赢点）· §8 合规意图 · GEO/AEO 直觉（事实段+References+TL;DR）· co-star-alternatives（复用既有 vs 模板）

**CUT（删/改框架）**："结构已齐"框架（改为"西方结构需新建"）· transit-chart 独立目标（已是 canonical 输家）· Person+资质作者 schema（违反已 ship 姿态）· 实时 Mercury / Full Moon ISR 进 week 1（soft-404 回归风险）· Big Three 卡生成器进 week 1 · rank 作为主 KPI · 名人盘（待法务）· rising-sign 新建页

**REPRIORITIZE（改优先级）**：
- rising-sign → 改为**优化既有 /wiki/ascendant** 抢该词（canonical 防蚕食），不新建
- synastry → 从"深化 P0"改为"**新建可索引 TOOL 页**（Tier 2）"，因为今天只有 wiki 解释页
- full-moon → 改为**静态月度文章页**（非 live/ISR），接受 head term 仅是 aspirational
- HSP + transits 簇 → 文档**低估**了（已存在），改为"仅 schema/EEAT 优化"
- **把 FAQPage JSON-LD 注入静态文章 stub**（现仅 runtime React 生成，爬虫/AI Overview 看不到）→ 升 Tier 1，一次修复**所有**现存文章的 GEO 缺口

---

## 6. 修正后的 7 天计划（替代文档原计划）

- **D1 对账+纠偏**：读 6/1+6/2 plan-of-record；KPI 改回"有效收录页+非品牌点击"；删 transit-chart；去掉 Person+资质 schema；IndexNow 标注仅 Bing/Yandex；Ahrefs 复核 rising-sign/full-moon 的 KD，删或注明 "costar 95% 来自 13 页" 无源断言
- **D1-2 两个零成本赢点**：(a) 建 /llms.txt；(b) 把 runtime 的 FAQ 解析逻辑镜像进**静态文章 stub** 的 FAQPage JSON-LD（升级全站 GEO）
- **D2-3 优化唯一真 P0 资产**：深化 /saturn-return-calculator（schema 已有 WebApplication+FAQPage+Offer，补 ≥5 静态内链 + 首屏直答 + embed 外链路径 PRD 2.12）
- **D3-5 建 KD0-2 可赢程序化页**（走 WIKI_SEO_OVERRIDES + check-internal-links.mjs）：north-node 补 10/12、venus Top5；每批做 ZH 双发或显式抑制悬空 hreflang
- **D5-6 合规门**：建生成器强制的免责+危机热线 footer（注入 React 与静态 stub 的 mental-health 标签文章）+ 构建期反宿命 linter；通过后才放行"astrology for anxiety"簇
- **D6 co-star-alternatives**：复用既有 vs 模板 + best-astrology-mental-health-apps 种子
- **D7 快照+提交+复盘**：GSC/Bing inspection + IndexNow ping；定**30 天 GSC 数据驱动**的 Vedic/Chakra/Aura 处置计划（保留 index,follow，lean-in 或 canonical 合并，**绝不 noindex**）。**延后到后续 wave**：实时 Mercury、Full Moon live、Big Three 卡、名人盘、synastry tool 页、synastry 相位矩阵（各需新基建 / 静态优先 bootstrap / 法务）

---

## 7. 放哪（归档建议）

- **本评估文件**：就放在这里 —— `gengrowth-ops/inbox/08-reports-and-feedback/01-product-feedback/2026-06-02-astrologywiki-seo-mvp-doc-evaluation.md`（与 5 份同类前序文件同目录同命名）。它是**外部文档评估**，不是产品代码，**不进 oracle 仓库**。
- **原 Google Doc**：定位为"关键词机会素材库"，**不要**当执行计划归档；它的价值是 §1 的关键词地图，已被本评估吸收 + 纠偏。
- **唯一应进 oracle 仓库的**：是批准后的实际修复（§6），且须遵守 PRD 同步规则（新路由/schema/页面/sitemap 变更触 docs/PRD.md 判定清单）。
