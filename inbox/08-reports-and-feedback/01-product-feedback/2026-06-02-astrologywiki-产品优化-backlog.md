<!-- INPUT: Claude 四维产品审计 + Codex gpt-5.5 xhigh 60 次代码核验 + 8-epic workflow（每 epic 实读 oracle 仓代码）+ 一致性 critic。 -->
<!-- OUTPUT: AstrologyWiki(oracle) 可执行产品优化 backlog——24 个 story，含证据 file:line、可测验收、双轨工时、依赖、文档同步、串行化风险。 -->
<!-- POS: gengrowth-ops 规划工作区的产品 backlog，非 oracle 产品代码。落地时按各 story 的 docs_touch 回同步 oracle 的 PRD/FOLDER.md。 -->

# AstrologyWiki(oracle) 产品优化 Backlog

> 生成日期：2026-06-02
> 来源：Claude 四维审计（转化/留存/AI 安全/性能）+ Codex gpt-5.5 xhigh 对抗核验 + 8-epic 并行 spec（实读代码）+ 一致性 critic
> 证据强度：所有 file:line 经 workflow agent 实读复核；标 `UNVERIFIED` 的需落地前再确认
> 共 24 个 story（7×P0 / 14×P1 / 3×P2）

---

## 0. 怎么读这份 backlog

- **优先级 ≠ 执行顺序**。执行顺序见 §1（critic 排的），它把"解阻塞""同文件串行""硬流水线依赖"算进去了。
- 每个 story 是**可独立交付**的最小单元，带：问题 / 证据 / 可测验收 / 步骤 / 双轨工时（human + Claude Code）/ 风险 / 依赖 / 需同步文档。
- **三个串行化雷区**（§3.1）：`backend/src/data/wiki.ts`（3 个 SEO story）、漏斗硬流水线（3 步）、变现共享 i18n/resolver（3 story）。同文件不并发写。
- **§3.3 未覆盖缺口**：critic 发现 6 个 epic 没覆盖但该做的活，已列为 GAP 占位，别让它们静默丢失。

---

## 1. 推荐执行顺序（24 个，分 9 批）

| 批 | 顺序 | Story | 优先 | 为什么这个位置 |
|---|---|---|---|---|
| **A 立即** | 1 | `btr-fix-synthetica-test-runner` | P0 | 解阻塞：backend 测试门常红，先变绿，后续所有 `cd backend && npm run test` 才有信号 |
| | 2 | `trust-redact-email-logs` | P0 | 廉价 P0：明文邮箱进日志，15 分钟修 |
| | 3 | `trust-remove-fake-social-proof` | P0 | 信任 P0：假数据 + 退款承诺矛盾 + Ask 云端告知，FTC/消保面 |
| **B SEO 索引卫生**（wiki.ts 串行） | 4 | `seo-merge-house-double-urls` | P0 | 最大蚕食簇（11 组房间双 URL），SEO-first 入口先收口 |
| | 5 | `seo-merge-aspect-angle-double-urls` | P0 | 5 组相位/角双 URL（含我漏的 trine/ic）|
| **C 免费盘漏斗**（硬流水线） | 6 | `free-chart-funnel-cta-to-inline-tool` | P0 | 先把 wiki 流量从 /auth 导进免费工具 |
| | 7 | `free-chart-funnel-save-capture-and-migrate` | P0 | 高风险：触 2026-05-20 数据归属不变量，guest 命名空间 + 登录后迁移 |
| **D 信任/合规/可观测基线** | 8 | `trust-reenable-csp` | P1 | CSP 关着，但需支付域名 allowlist（见 GAP-4）+ Report-Only 先行 |
| | 9 | `trust-privacy-policy-legal-review` | P1 | 隐私政策自称 template，需法务签字（人工 gate）|
| | 10 | `obs-error-monitoring-and-sanitize-guardrail` | P1 | 落地 sanitizeForLog 护栏 + Sentry；越早落地，#2/#12/#24 越能复用 |
| **E 内容深化 + 漏斗埋点** | 11 | `seo-thin-content-signs-and-zh-aura-chakra-element` | P1 | 12 星座一句话薄内容 + ZH aura/chakra 软 404 风险（保 30% 曝光）|
| | 12 | `free-chart-funnel-attribution-events` | P1 | 需 #7 的迁移事件存在才能发 funnel_chart_migrated |
| **F 变现**（resolver 先行） | 13 | `monetization-multicurrency-eur-gbp` | P1 | 货币 resolver，#14/#15 都软依赖它 |
| | 14 | `monetization-public-pricing-page` | P1 | 公开可索引定价页 |
| | 15 | `monetization-paypal-enable-and-route-cleanup` | P1 | PayPal 可选 + 修 v1/v2 路由 + paywall i18n 收口 |
| **G 构建/性能**（可并行填充） | 16 | `btr-pin-google-genai` | P1 | 锁 latest，20 分钟 |
| | 17 | `btr-coverage-threshold` | P1 | 严格在 #1 之后（红 suite=无意义覆盖率）|
| | 18 | `perf-defer-recharts-from-wiki-chunk` | P1 | Wiki 首屏 TTI（SEO 入口）|
| | 19 | `perf-split-synastrypage-godfile` | P1 | 5244 行拆分，高 diff 量 |
| **H 运维/移动/a11y** | 20 | `obs-mobile-bottom-nav-and-consent-a11y` | P1 | 移动底部导航 + consent toggle 无障碍名 |
| | 21 | `obs-backup-restore-runbook` | P1 | 备份/恢复 runbook（需 dashboard 访问）|
| **I 收尾** | 22 | `perf-img-dimensions-lazy` | P2 | 3 个 img 加尺寸（范围比原判断小）|
| | 23 | `retention-newsletter-confirm-unsubscribe` | P2 | 双 opt-in + 退订（迁移 008）|
| | 24 | `retention-saved-readings-history` | P2 | 最高 PII + 最大工时（~2wk），垫底 |

---

## 2. Story 详情

### 批 A — 立即

#### 1. `btr-fix-synthetica-test-runner` · P0
- **问题**：`backend/src/utils/__tests__/syntheticaConfig.test.ts` 用 `node:test` 而非 vitest。backend vitest include 收集它但找不到 vitest 注册的测试，报 suite FAILED，导致 `cd backend && npm run test` 每次非零退出，后端测试门永久红、无真实信号。
- **证据**：`syntheticaConfig.test.ts:1-3` import `node:test`/`node:assert`；`backend/vitest.config.ts:7` include `src/**/*.test.ts` 命中它；**实跑确认** `cd backend && npx vitest run` = `1 failed | 17 passed`，唯一失败是 `No test suite found`。root vitest 不含 backend/src，所以归属明确是 backend suite（"破坏整个 suite"是夸大，实为单 suite 红）。
- **验收**：`cd backend && npx vitest run` = 18 passed / 0 failed；文件改用 `vitest` 的 `describe/it/expect`，零 `node:test`/`node:assert`；6 条原断言 1:1 保留；root `npx vitest run` 仍 12 passed。
- **步骤**：替换 import 为 `import { describe, it, expect } from 'vitest'`；`assert.equal`→`expect().toBe()`；包进 describe/it；跑通单文件再跑全 suite。
- **工时**：human ~30min / CC ~5min　**风险**：极低（纯测试文件）　**依赖**：无　**文档**：无（测试-only，不触判定清单）

#### 2. `trust-redact-email-logs` · P0
- **问题**：邮件发送后明文把收件人邮箱写日志，违反隐私红线 3。
- **证据**：`backend/src/services/emailService.ts:22` `console.log(\`Email sent to ${params.to}...\`)`；`:25-39,80,106` 所有邮件路径都过这条；同文件已对 HTML 字段 escapeHtml，日志路径未脱敏（一致性缺口）。
- **验收**：console 不再输出完整邮箱（域名保留掩码 `a***@domain.com` 或只记 message id + 类型）；grep 无 `${params.to}` 明文进 console；若有 `sanitizeForLog` 工具则复用（见 #10）。
- **步骤**：实现/复用 `maskEmail`；替换 line 22；审视同文件其它 PII 日志。
- **工时**：human ~0.5d / CC ~15min　**风险**：低　**依赖**：无（理想上消费 #10 的 helper，但 P0 先发）　**文档**：`backend/src/services/FOLDER.md`（若加 maskEmail）

#### 3. `trust-remove-fake-social-proof` · P0
- **问题**：paywall 展示编造的 4.9 评分/2,847 评价/50,000+ 用户 + 写死 7 天倒计时 + 与实际退款政策矛盾的"30 天无条件退款"，FTC/消保虚假宣传风险；同时 Ask 把问题+出生数据发往云端 LLM 却无告知（违反 AI 安全边界 5）。
- **证据**：`PaywallConversion.tsx:31-34,42`（假数字）、`:113`（写死 7）、`:139,145`（30 天退款）；`TermsOfService.tsx:215-217` 实际"一般不退款"、`HelpPage.tsx:58` 实际 7 天 case-by-case——直接矛盾；`UpgradeModal.tsx:11,431,456` 确认假数据已上线；`OraclePage.tsx:692,882` Ask 仅渲染 FrameworkDisclaimer，`constants.ts:831-832` 只讲非医学/非宿命，无云端告知。`7-day free trial` 是真实功能（`airwallex.ts:196-200`），**保留**。
- **验收**：UpgradeModal 无任何无数据源数字；倒计时若留必须真实数据驱动否则删；"30 天无条件退款"删或改为与 Terms 一致；Ask 页顶新增可见持久告知"问题与出生数据将发送给第三方云端 AI"（t.* 键 + 英文 fallback）；浏览器实测两处截图；analytics 自检不新增 question/birth 字段。
- **步骤**：删 PaywallConversion 假数据键 + 对应分支；删/改 RiskReversal guarantee；`constants.ts` ask 块加 `cloud_notice`；OraclePage 渲染它。
- **工时**：human ~1.5d / CC ~40min　**风险**：删 props 分支影响弹窗布局，需回归视觉；Ask 页 `robots=noindex` 是既有设定别误删　**依赖**：无　**文档**：`docs/PRD.md` §3（退款措辞若调整）

### 批 B — SEO 索引卫生（⚠ 三个 story 同改 `backend/src/data/wiki.ts`，串行）

#### 4. `seo-merge-house-double-urls` · P0
- **问题**：12 个房间里 11 个双索引（`/wiki/house-N` 薄 DefinedTerm + `/wiki/Nth-house-*` 长 Article），只有 house-5 收口过。最大蚕食簇。
- **证据**：`sitemap.xml:370-410` 列 house-1,2,3,4,6,7,8,9,10,11,12（house-5 已收口故缺席）；`:42-86` 列 12 个 Article winner slug；`wiki.ts:14/19` `'house-5': { canonicalPath:'/wiki/5th-house', sitemap:false }` 是要复制的模板；ZH 只 whitelist house-2/house-10（`generate-seo-pages.mjs:673-674`）。**UNVERIFIED**：每房间 winner slug 后缀不统一（有 -meaning/-astrology/裸 11th-house），必须逐一对照 sitemap:42-86 映射，禁止猜后缀。
- **验收**：WIKI_SEO_OVERRIDES(en) 含 house-1..12（除 5）各带 canonicalPath 到精确 winner + sitemap:false + alternates:false；zh 加 house-2/house-10；built sitemap 零 `/wiki/house-N` 裸 slug；每 loser stub canonical 到 winner 且无自指 hreflang；hub 链接指向 winner。
- **步骤**：从 sitemap:42-86 建 house-N→Article-slug 映射表 → 写 11+2 个 override → `cd backend && npm run build && npm run build` → grep 验。
- **工时**：human ~1d / CC ~30min　**风险**：映射错→canonical 指 404，从 sitemap winner 列表派生不要猜　**依赖**：复用现有 override 机制　**文档**：`sitemap.xml`（重生）、`wiki.ts` 头注释

#### 5. `seo-merge-aspect-angle-double-urls` · P0
- **问题**：每个主相位/角有薄 wiki + 长 Article 双 URL。**比原判断多**：至少 4 组相位 + ic/imum-coeli 共 5 组（不是 3 组）。
- **证据**：`sitemap.xml:610/614` square|square-astrology、`:590/594` sextile|sextile-astrology、`:642/646` trine|**trine-in-astrology**（修正：变体真名是 trine-in-astrology，确在 sitemap，是漏掉的第 4 组）、`:318/322` descendant|descendant-astrology、`:422/426` **ic-astrology|imum-coeli**（第 5 组，方向待定）；`data/articles/*-astrology.ts:11 schema:'Article'` 是 winner。**UNVERIFIED**：ic/imum-coeli 哪个是 winner，先读两边正文定。
- **验收**：每组薄 wiki stub canonical 到 Article winner 且不在 sitemap；built sitemap 裸 slug（square/sextile/trine/descendant）消失、winner 留；loser 无自指 hreflang；ic/imum-coeli 收成单 URL。
- **步骤**：读 ic/imum-coeli 定方向 → 写 override（square/sextile/trine/descendant + ic 组）→ 重新 build → grep 验。
- **工时**：human ~1d / CC ~30min　**风险**：选错 winner 方向 de-index 强页　**依赖**：与 #4 同改 wiki.ts，串行　**文档**：`sitemap.xml`、`wiki.ts` 头注释

### 批 C — 免费盘漏斗（⚠ 硬流水线：6→7→12）

#### 6. `free-chart-funnel-cta-to-inline-tool` · P0
- **问题**：wiki/article 底部 CTA 把读者弹到 `/auth` 登录墙，而非已能用的未登录免费盘，浪费 SEO 来的 wiki 流量。
- **证据**：`WikiChartCTA.tsx:50-56` `<Link to={langPath('/auth')}>`；`:15` 组件已对登录/加载用户返回 null（只对要导的匿名受众显示）；`BirthChartSection.tsx:311-323` 匿名免费盘已工作（`fetchNatalChart(...,{skipCache:true})` + `:749` 渲染 AstroChart）；`ToolsGridSection.tsx:24-25` 已有"匿名导进内联 BirthChart 而非登录"的先例。
- **验收**：匿名点 CTA 落到内联免费盘表单（非 /auth），滚动/聚焦输入；trackEvent 仍发且带 `getLandingUtm()` 归因；登录用户仍无 CTA；内部 SPA 导航无整页刷新，en/zh 均工作；SEO stub 不受影响（CTA 是 auth-gated client 组件）。
- **步骤**：改 `to` 目标为 landing 内联表单（hash/scroll 或新 free-tool 路由）；trackEvent 加 `...getLandingUtm()`；用 rAF 滚动确保首帧落点。
- **工时**：human ~0.5d / CC ~20min　**风险**：低（匿名-only 组件纯导航改）　**依赖**：无　**文档**：`docs/PRD.md`（仅当引入新路由）

#### 7. `free-chart-funnel-save-capture-and-migrate` · P0 · ⚠ 高风险
- **问题**：匿名可出免费盘，但点"Save my chart"走 onboarding，`onComplete` 检测未登录→开登录弹窗→return，盘只在 React 瞬态、登录即丢；登录弹窗无 resume/migration 钩子，漏斗最高意图点把人丢了还啥都没存。
- **证据**：`App.tsx:757-766` onComplete 未登录 `openLoginModal('save_chart')` + return（**有意**，防 2026-05-20 guest 继承 bug，见 `:745-752` 注释）；`BirthChartSection.tsx:369-391` prefill 只在内存；`LoginModal.tsx:117-118,217,258` 所有成功路径只 handleClose、无登录后回调；`AuthContext.tsx:199-224` `handleMigrateLocalData` 已存在；`authClient.ts:299-311` `migrateLocalData` POST `/api/auth/migrate`（`PRD:71,762` 已记）。**关键**：不裸拆墙，做 guest 命名空间 + 登录后显式迁移 + 迁移后立即清空。
- **验收**：匿名出盘→Save→盘存进 **guest 命名空间**（区别于 `astro_user`）再开弹窗；登录/注册成功后经 `/api/auth/migrate` 迁移、落 /dashboard 显示该盘、无二次录入；迁移后清空 guest 命名空间（**不得回归 2026-05-20 继承 bug**）；关弹窗未登录则盘只在 guest 命名空间、绝不升进 astro_user；无 birth PII 进 analytics 或明文缓存键；E2E 覆盖：匿名出盘→save→注册→dashboard 见盘 / 关弹窗→dashboard 空 / guest-A 存 + guest-B 登录→B 看不到 A 的盘。
- **步骤**：建 `services/guestChart.ts`（set/get/clear，带头注释）→ Save 前写 guest 命名空间 → AuthContext 登录/注册成功后若 reason='save_chart' 或 guest 盘存在则迁移再清空 → LoginModal 成功路径 await 迁移再关 → 保留 App.tsx 不变量 → 覆盖 OAuth 分支 → 单测 + Playwright E2E（含跨 guest 隔离）。
- **工时**：human ~3-4d / CC ~2-3h　**风险**：**HIGH**——触数据归属不变量，guest 数据必须独立命名空间、仅同一用户成功登录后才升、升后立即清；OAuth 无 verify 步骤易漏；靠跨-guest 隔离 E2E 兜底　**依赖**：软依赖 #6　**文档**：`services/FOLDER.md`（新 guestChart.ts）

### 批 D — 信任/合规/可观测基线

#### 8. `trust-reenable-csp` · P1
- **问题**：helmet 的 CSP 整体关闭，SPA/API 无 XSS 防护。
- **证据**：`backend/src/index.ts:58-64` `contentSecurityPolicy:false`；`vercel.json:3-21` 前端头无 CSP（真正生效点应在 vercel.json headers）；依赖 fonts.googleapis/gstatic（`index.html:35-40`）、unsplash（`:38`）、gtag（`analytics.ts:38-52`）、PayPal/Airwallex/Stripe（`PrivacyPolicy.tsx:213-217`）。**UNVERIFIED**：各支付 SDK 实际加载的 script/frame 域名清单（见 GAP-4）。
- **验收**：生产对 SPA HTML 有有效 CSP；不破坏 GA4/字体/Unsplash/三家支付；**先 Report-Only 上线一个发布周期收 violation 再切 enforce**；浏览器实测无 CSP 阻断。
- **步骤**：枚举所有外部源（核对支付 SDK 域名）→ vercel.json headers 加 Report-Only CSP → index.ts helmet 改为 API 专用严策略 → 收 violation → 切 enforce。
- **工时**：human ~2-3d / CC ~50min（域名核对需人工）　**风险**：**高破坏面**，配错静默挡 GA/字体/支付 iframe；支付域名清单 UNVERIFIED　**依赖**：GAP-4 discovery　**文档**：`docs/PRD.md` 4.7、`index.ts` 头注释

#### 9. `trust-privacy-policy-legal-review` · P1
- **问题**：隐私政策正文自称"compliance template, recommend consulting a legal professional"，生产法律页公开承认未经法务。
- **证据**：`PrivacyPolicy.tsx:58-62` template 自述；`:6` LAST_UPDATED 需审定后递增；`:225-230` "AI 不留存训练"断言 **UNVERIFIED**，需对 LLM 供应商合同核实；`docs/BEIAN_GUIDE.md`（新增未读）一并核对。
- **验收**：template 段落移除；AI 数据处理/保留期/第三方陈述与实际一致（"不用于训练"需有依据否则改措辞）；LAST_UPDATED 递增；**法务 sign-off（人工 gate）**；/privacy 与 /zh/privacy 无 template 字样。
- **步骤**：法务对齐全文 → 核对各披露 vs 实际数据流 → 删 58-62 → 按法务改条款 → 递增日期 + zh 同步。
- **工时**：human ~3-5d（含法务来回）/ CC ~25min　**风险**：中，措辞错扩大责任，核心需法务签字　**依赖**：#3（Ask 告知口径需与隐私政策一致）　**文档**：`docs/PRD.md` §2、`BEIAN_GUIDE.md`

#### 10. `obs-error-monitoring-and-sanitize-guardrail` · P1
- **问题**：无错误聚合/告警，生产 500 不可见；208 处非结构化 console.*；CLAUDE.md 引用的 `sanitizeForLog/SENSITIVE_FIELDS` helper **不存在**，隐私规则无法机械执行。
- **证据**：package.json 无 Sentry/APM；backend 208 console.*（121 error/61 log/26 warn），无 logger 模块；grep `sanitizeForLog|SENSITIVE_FIELDS` 零定义；`cache/strategy.ts:47` hashInput 已是 PII 摘要原语；`analytics.ts:400-402` 注释承认 error.message 可能含 birthCity/question。
- **验收**：新 helper 导出 `SENSITIVE_FIELDS`（question/situation/moods/automaticThoughts/hotThought/balancedEntries/nameA/B/birth.*/lat/lon）+ `sanitizeForLog(payload,fields)` 深克隆替换、**不可变**（原对象不变）；单测覆盖嵌套/数组/缺键/null/非 PII 放行/不可变；错误监控 SDK 在 env flag 后初始化、DSN 未设时 no-op（生产不默认 mock）；beforeSend 跑 sanitizeForLog；高流量 AI/auth endpoint 的 catch console.error 接 sanitizeForLog。
- **步骤**：RED 写 sanitize-log.test.ts → GREEN 建 `backend/src/utils/sanitize-log.ts` → 加 @sentry/node + `observability/monitoring.ts`（DSN 未设 no-op + beforeSend scrub）→ 入口初始化 → 包裹 cbt/ask/synastry/natal catch。
- **工时**：human ~3-4d / CC ~60-90min　**风险**：Sentry 初始化位置错破坏冷启动；过度脱敏剥调试上下文　**依赖**：env 访问设 SENTRY_DSN　**文档**：`backend/src/utils/FOLDER.md`、新 `observability/FOLDER.md`、`.env.example`（仅名）

### 批 E — 内容深化 + 漏斗埋点

#### 11. `seo-thin-content-signs-and-zh-aura-chakra-element` · P1
- **问题**："gemini 旧 schema"实为**薄内容簇**：12 星座都把一句话 description 喂进 meta + DefinedTerm schema，产 pos-90+ 薄页；另有 ZH aura/chakra/element URL 仅 ZH 侧索引但无 ZH 正文，软 404 风险（该 locale 担 30% 曝光）。
- **证据**：`wiki.ts:1870` gemini 'Air in motion.'，但 `:1857/1883/1844` 等 12 星座**同款一句话**（修正：gemini 非独有 schema bug，是全簇薄内容）；`WikiDetailPage.tsx:481-511` DefinedTerm description 用同串（改 item.description 一处修两处）；`wiki.ts:40-45` buildEnPlaceholder 把 '... (full entry in progress)' 铺到 sign 正文（正文也是占位）。**修正**：aura/chakra slug grep `id:'*aura*'` 为空——它们是 Article 页（`data/articles/aura-reading.ts`）**真内容非薄 stub，不可删**。**UNVERIFIED**：每个 ZH aura/chakra Article 是否真有 ZH 正文，需读 stub 定 rewrite vs hreflang-suppress。
- **验收**：12 星座各 ≥120 字唯一 meta description + 非占位正文（sitemap 内 sign 页无 '(full entry in progress)'/'完整内容生成中'）；重生 stub 的 meta + DefinedTerm description 同步增强（查 stub 原文非水合）；每个 ZH aura/chakra/element URL 的 ZH stub 有真内容，空的 rewrite 或 alternates:false（**绝不裸 noindex**）；不删 URL 无 canonical 替代；GSC 曝光页保留。
- **步骤**：枚举 sitemap sign + aura/chakra/element，读 ZH stub 分类 → 12 星座替换 description + 正文（AI 安全合规，无 will/destined 绝对语）→ air/earth/fire-element 薄页 enrich 或 canonical 到 four-element-framework → 占位 ZH 页补正文或 alternates:false → 重 build grep 验。
- **工时**：human ~3d（12 星座写作主导）/ CC ~2-3h　**风险**：裸 noindex aura/chakra 会崩 30% 曝光（显式排除）；sign 文案须遵 AI 安全边界；改 visible 正文 blast radius 大　**依赖**：与 #4/#5 同改 wiki.ts，串行　**文档**：`sitemap.xml`（若 element 收口）、`wiki.ts` 头注释 + data FOLDER.md

#### 12. `free-chart-funnel-attribution-events` · P1
- **问题**：漏斗事件零散（cta_clicked/birth_chart_submit_success/wiki_cta_clicked/signup_completed），无串起 wiki访问→出盘→保存意图→建账号→迁移的归因链。
- **证据**：`BirthChartSection.tsx:303-319` cast 事件已带 getLandingUtm 但 `:369-373` save 步骤**没带**（归因缺口）；`WikiChartCTA.tsx:17-19` wiki_cta_clicked 只带 source 无 UTM；`AuthContext.tsx:166,179` signup_completed 只带 method；`landingUtm.ts:67-92` first-touch 归因已存在；`analytics.ts:231-251,408-449` PII 脱敏层已强制红线 1。
- **验收**：有序事件脊 `funnel_chart_cast→funnel_save_intent→funnel_auth_prompted→funnel_account_created→funnel_chart_migrated` 各带 getLandingUtm；**仅非 PII 类目字段**（source/location/language/has_time/method，无 birthCity/lat/lon/date/name）；save 步骤 + wiki_cta 补 getLandingUtm；signup + migration 事件带 funnel source；仅 consent 后发（现有 gate）。
- **步骤**：定事件名 + payload 契约 → 扩 BirthChartSection/WikiChartCTA/AuthContext trackEvent → 从 #7 迁移钩子发 account_created/chart_migrated → 每个 payload 自检无 PII → 加 PII-key 断言单测。
- **工时**：human ~1d / CC ~30min　**风险**：低-中，唯一真风险是 PII 泄进 analytics（PII-key 断言测试兜底）　**依赖**：#7（迁移事件）+ #6　**文档**：无（analytics 事件不触 PRD 判定清单）

### 批 F — 变现（⚠ resolver 先行；#14/#15 共享 constants.ts subscription i18n）

#### 13. `monetization-multicurrency-eur-gbp` · P1
- **问题**：只 USD/CNY 定价，EU/UK 用户看美元无本地币，伤信任与转化。
- **证据**：`airwallex.ts:120` `SupportedCurrency = 'USD'|'CNY'` 写死两币；`:122-124` resolveCurrency 仅 zh→CNY；`:62-117` pricing/credits 只 usd/cny；`airwallexService.ts:80,191,262,443` **4 处**二元 `=== 'CNY' ? 'cny':'usd'`（比原判断多）；`paymentClient.ts:558-566` formatPrice 已收任意 currency（显示层就绪）；`geo.ts` 仅城市地理编码、无国家/币种检测。
- **验收**：SupportedCurrency 加 EUR/GBP 且 tsc 过；`/api/airwallex/pricing?currency=EUR|GBP` 返回对应币种金额；resolver 从真实信号（Accept-Language/IP 国家 `x-vercel-ip-country`）派生而非 lang；**EUR/GBP price ID env 未设则 fallback USD 并 log，不编造金额**（生产无 mock）；UpgradeModal 显示 €/£；backend 单测覆盖 4 币种。
- **步骤**：扩 SupportedCurrency → 加 eur/gbp 价格块 + env ID → 4 处二元改 `currency.toLowerCase()` 查表 + USD fallback → 新 `backend/src/utils/currency.ts` resolveCurrencyFromRequest → vitest（RED 先）→ 同步 PRD §6.2 + 递增版本。
- **工时**：human ~3-4d / CC ~60-90min　**风险**：错 price ID/FX-stale 会错误扣费，须从财务取真实 ID 非猜；x-vercel-ip-country 缺失靠 default-USD 兜底　**依赖**：Airwallex dashboard 建 EUR/GBP price ID（财务前置）　**文档**：`docs/PRD.md` §6.2、`.env.example`、currency.ts FOLDER

#### 14. `monetization-public-pricing-page` · P1
- **问题**：定价只在登录后 UpgradeModal，无公开 /pricing 路由，访客与搜索引擎看不到。
- **证据**：`App.tsx:726-1000` Routes 无 /pricing|/plans；`UpgradeModal.tsx:15-460` 定价仅它渲染；`paymentClient.ts:230-256` getAirwallexPricing 是未鉴权 GET（公开页可 fetch）；`airwallex.ts:36-41` pricing endpoint 无 auth 中间件。
- **验收**：`/:lang/pricing` 无需登录渲染套餐对比；**在 isPublicRoute allowlist 内**（`App.tsx:414` shouldNoIndex 为 false，红线不 noindex 有效页）；价格来自 GET pricing；匿名 CTA 开登录弹窗不 500；sitemap 含 en/zh pricing 且**静态 stub 含可见价格文案**（查 dist stub 非水合）；build 过。
- **步骤**：加 `/:lang/pricing` 路由 + isPublicRoute → 建 PricingPage（复用 plan 数据 + formatPrice）→ 匿名 CTA 走 openLoginModal → 加 SEO head（en/zh）→ 重生 sitemap → PRD 路由表 + §4.2 + 版本。
- **工时**：human ~2-3d / CC ~45-60min　**风险**：价格仅水合后出现会 SEO 回归（须确认 prerender stub 含文案，见 memory SEO stub vs SPA）；API 慢时渲染静态兜底价不要空壳 noindex　**依赖**：软依赖 #13　**文档**：`docs/PRD.md` §2+路由表、`sitemap.xml`、`components/pricing/FOLDER.md`

#### 15. `monetization-paypal-enable-and-route-cleanup` · P1
- **问题**：PayPal 实际死的（后端默认 airwallex-only + 前端硬编码 airwallex）；默认 provider 下 v1 `/api/payment/*` 不挂（404 风险）；paywall 仍对英文用户渲染中文 reason。
- **证据**：`index.ts:49` PAYMENT_PROVIDER 默认 airwallex；`:283-285` paypalRouter 仅 paypal/all 才挂、`:280-282` v1 paymentRouter 仅 stripe 才挂；`paymentClient.ts:81,313...396` 仍调 v1 root 路径（airwallex 下 404）；`UpgradeModal.tsx:161-165` 硬传 provider:'airwallex'；`paypal.ts:43-91` PayPal 路由就绪但 USD-only；`EntitlementContext.tsx:385,418,497` + `CBTMainPage.tsx:226` + `WikiSyntheticaPage.tsx:138,159`（**漏掉的两文件**）传中文 `openUpgradeModal('解锁…')`；`UpgradeModal.tsx:481-599` 取消流用 `language==='zh'?` 内联三元。
- **验收**：PAYMENT_PROVIDER='all'/'paypal' 时 paywall 出 PayPal 选项达 `/api/paypal/subscribe`；UpgradeModal 不再硬编码 provider（按 config helper 选，默认 airwallex 向后兼容）；前端不依赖未挂的 v1 root（repoint 或独立挂载，无 404）；6 处中文 reason call site 改 t 键（英文 fallback）；取消流 copy 走 t.subscription.*，无 `language==='zh'?` 内联；无生产 mock。
- **步骤**：UpgradeModal 用 getPaymentConfig 选 provider → 审计 v1 caller repoint/挂载 + 回归测试无 404 → 6 处中文 reason 改 t 键 → 取消流三元改 t 键 → build。
- **工时**：human ~2-3d / CC ~45-75min　**风险**：动计费路由须端到端验证 subscribe/renewal/credits/portal/cancel 无 404/双扣；上 PayPal 需 creds+webhook；别擅自翻默认 provider（需 ops 签字）　**依赖**：ops 决定默认 provider；与 #13/#14 共享 constants.ts i18n　**文档**：`docs/PRD.md` §3.5+§4.3（PayPal endpoint 翻"已启用"）

### 批 G — 构建/性能（无跨依赖，可并行填充）

#### 16. `btr-pin-google-genai` · P1
- **问题**：`package.json:25` `"@google/genai": "latest"`，浮动版本破坏可复现构建，可静默 ship 未测 SDK 主版本。
- **证据**：唯一用 latest 的依赖（其余 ^/~）；当前解析 `1.34.0`；`vite.config.ts:27,35` genai 进 manualChunks/optimizeDeps，未锁主版本会变 chunk 行为；backend **不依赖** genai（单 manifest 修复）。
- **验收**：package.json 无 `latest`，用 `^1.34.0`（推荐）或精确 `1.34.0`；`npm install` 确定性更新 lock；`npm run build` 过；root vitest 仍 12/12；不新增 mock。
- **步骤**：`npm ls @google/genai` 确认 → 改 package.json:25 → npm install → npm run build。
- **工时**：human ~20min / CC ~5min　**风险**：低（^1.34.0 保持现版本则行为不变）　**依赖**：无　**文档**：PRD 4.1 可选（小版本/lockfile 例外）

#### 17. `btr-coverage-threshold` · P1
- **问题**：前后端均无 coverage provider/阈值，CLAUDE.md 要求核心 100%/普通 80% 却无法测量。
- **证据**：grep `coverage` 三个 config 零命中；grep `c8|@vitest/coverage` 两个 package.json 零命中；CLAUDE.md §3 明确这是 follow-up。**UNVERIFIED**：核心路径当前覆盖数未知，须先 baseline 再设阈值（避免立即红）。
- **验收**：root+backend 加 `@vitest/coverage-v8`；`--coverage` 出报告（text+lcov）；两 config 有 coverage 块（provider/reporter/thresholds）；阈值从实测 baseline 设（global ≥ min(measured,80) 起）；核心算法/计费/鉴权文件仅在已达 100% 时设 100% gate，否则记 ratchet TODO；加 `test:coverage` 脚本；两 suite 仍过。
- **步骤**：先落 #1 → 装 provider → baseline → 加 coverage 块 → 核心路径 per-glob 阈值/ratchet → 加脚本 → coverage/ 进 .gitignore。
- **工时**：human ~1d（baseline+调阈值）/ CC ~30min　**风险**：阈值高于实测会立即红挡 PR，baseline-first 缓解　**依赖**：**#1**　**文档**：`docs/PRD.md` 4.1 一行、CLAUDE.md §3 覆盖率行更新

#### 18. `perf-defer-recharts-from-wiki-chunk` · P1
- **问题**：访问 /wiki 总下载 recharts（charts bundle）只为渲染 hero 一个小雷达，拖 SEO 入口 TTI。
- **证据**：`WikiHomePage.tsx:25-30` 静态 import recharts、`:379-393` 无条件渲染在初始路径；`WikiHubPage.tsx:9` 静态 import WikiHomePage；`App.tsx:154` WikiHubPage 是 lazy（故污染 /wiki chunk 非全站 landing）；`vite.config.ts:26` charts manualChunk 已隔离 recharts（**修正**：非内联进 /wiki，是静态 import 边让 /wiki lazy chunk 急加载 charts chunk）。
- **验收**：build 后 /wiki 首帧 JS 不含 charts chunk（Network 验 charts-*.js 懒加载）；雷达明暗主题仍正确无视觉回归；WikiHomePage 顶层无 recharts 静态 import；charts-*.js chunk 仍存在；雷达块有占位防 CLS。
- **步骤**：抽 RadarChart 子树到 `components/wiki/WikiEnergyRadar.tsx`（拥有 recharts import + 收 props）→ WikiHomePage 改 `lazy(() => import())` + Suspense 占位 → 颜色/数据留父级传 props → 更新 FOLDER.md → serve dist 验 Network。
- **工时**：human ~0.5d / CC ~25min　**风险**：低（client-only，限 /wiki）　**依赖**：无　**文档**：`components/wiki/FOLDER.md`

#### 19. `perf-split-synastrypage-godfile` · P1
- **问题**：`SynastryPage.tsx` 5244 行（~6.5× 800 上限），多内联子组件 + helper 一文件。
- **证据**：`wc -l` = 5244；`:89-109` 已 lazy 5 个表组件（模式已立）；`:117-205,663-678,1364+` 多个大内联 React.FC（EntityPlanetCard/NatalScriptCard/PerspectiveCard/UsPage）+ formatHelper colocate；无 pages/FOLDER.md，新 `pages/synastry/` 需建 FOLDER.md。
- **验收**：SynastryPage 降到 <800 行薄编排；抽出的子组件/纯 helper 各 <800 行；**无行为变化**（浏览器验同渲染）；无跨边界 mutate；build 无新类型错；5 个 lazy 表仍分 chunk；每新文件有头注释 + 新目录有 FOLDER.md。
- **步骤**：分内聚簇（纯 helper / 卡片 / UsPage 子视图 / 已 lazy 表）→ 建 pages/synastry/ + FOLDER.md → helper 进 format.ts（纯函数 + 单测 RED/GREEN）→ 各大 FC 抽文件传 props → 小 commit 逐簇验。
- **工时**：human ~2-3d / CC ~90-120min　**风险**：中，大机械抽取易 prop 接线/主题类回归，小 commit + 逐簇浏览器验　**依赖**：无　**文档**：`pages/synastry/FOLDER.md`

#### 22. `perf-img-dimensions-lazy` · P2
- **问题**：少数裸 `<img>` 缺 width/height/loading，轻微 CLS/急加载。
- **证据**：**修正**（原判断 ~7 img/5 远程被夸大）：真实仅 3 个裸 img——`App.tsx:634`(/logo.png 已有尺寸，eager header，OK)、`FooterSection.tsx:98`(logo 无尺寸)、`SettingsPage.tsx:201`(avatar 无尺寸)；`CBTMainPage.tsx:31-41` MOOD_IMAGES 5 个 Unsplash 已 URL 带尺寸，渲染点 **UNVERIFIED**；`components/LazyImage.tsx` 完整实现但**零引用（死代码）**。
- **验收**：FooterSection logo(28px)/SettingsPage avatar(56px) 加 width/height（CLS=0）；非 LCP 图加 loading=lazy，header logo 保持 eager；LazyImage 二选一（接入 or 删死代码）；build 过无视觉回归；MOOD_IMAGES 渲染点定位后处理。
- **步骤**：定位 MOOD_IMAGES 渲染点 → 给 footer/avatar 加尺寸+lazy → 决定 LazyImage 接入/删除 → 验。
- **工时**：human ~0.5d / CC ~20min　**风险**：低（别把 LCP 图标 lazy）　**依赖**：无　**文档**：`components/FOLDER.md`（若动 LazyImage）

### 批 H — 运维/移动/a11y

#### 20. `obs-mobile-bottom-nav-and-consent-a11y` · P1
- **问题**：移动主导航是横滚小号大写文字链，主题/语言 toggle 移动端整个隐藏；cookie consent 的 analytics/marketing toggle 是 sr-only checkbox、可见文字是未关联的 sibling span（无可访问名，WCAG name/role/value 失败）。
- **证据**：`App.tsx:646` nav `overflow-x-auto` 横滚 6 文字链、`~675-680` toggle `hidden md:flex`；无 BottomNav 组件；`ConsentBanner.tsx:210-231` analytics toggle label 只包 sr-only checkbox + 样式 div，name 是分离 span 未 htmlFor/aria-label 关联；`:233+` marketing 同款；`:133` banner `fixed bottom-0 z-[200]`（新 tab bar 需协调 z-index）。
- **验收**：<md 渲染固定底部 tab bar（icon+label+active 态），≥md 隐藏、顶部导航不变；与 consent banner z-index 不冲突；触控目标 ≥44×44 + 键盘可聚焦；每个 consent toggle 有可访问名（label htmlFor 或 aria-label，en+zh）；axe/SR 验 switch 暴露 role+name+state、点可见文字可切；无 SEO 回归（SPA-only 无 noindex）；375px 出/1280px 隐。
- **步骤**：建 `MobileBottomNav.tsx`（复用 6 nav + t.nav.* + isActive）→ App.tsx md:hidden + fixed bottom + content padding → 协调 z-index → ConsentBanner toggle 加 id+htmlFor 或 aria-label → en/zh 验 → axe → 375/1280 验。
- **工时**：human ~2-3d / CC ~45-60min　**风险**：底部导航撞 iOS safe-area + consent banner z-index；改 span→label 别动 consent 持久化逻辑；前端路由改需浏览器 QA　**依赖**：无　**文档**：`components/FOLDER.md`、PR UI 规范说明

#### 21. `obs-backup-restore-runbook` · P1
- **问题**：无备份/PITR/恢复文档与 RPO/RTO，库损坏/误删无演练恢复路径。
- **证据**：docs/ 无 backup/restore/RPO/RTO 文档；repo grep runbook|RPO|pg_dump 零实质命中；Supabase 平台备份配置 repo 内**不可验**（UNVERIFIED 当前是否有备份）；`docs/FOLDER.md` 须更新。
- **验收**：新 `docs/BACKUP_RUNBOOK.md` 含 RPO/RTO + 实际备份机制（对 live dashboard 核验非假设）+ 保留窗口 + 可复制恢复步骤；至少一次恢复演练结果或带 owner+deadline 的 TODO（无静默缺口）；UNVERIFIED 平台事实显式标注；FOLDER.md 索引；带 INPUT/OUTPUT/POS 头。
- **步骤**：确认数据存储/provider → dashboard 核验 PITR/保留 → 定 RPO/RTO（人工签字）→ 写 runbook → 若 PITR 未启用列首要 TODO（见 GAP-6）→ 更新 FOLDER.md。
- **工时**：human ~1-2d（含一次演练）/ CC ~20-30min（平台核验/演练需人工）　**风险**：记录假想备份制造虚假信心，每条平台声明须核验或标 UNVERIFIED；演练用 staging 不碰 live　**依赖**：Supabase/Vercel dashboard 访问（人工）　**文档**：新 `docs/BACKUP_RUNBOOK.md`、`docs/FOLDER.md`

### 批 I — 留存（⚠ 新迁移 008/009，最高 PII，垫底）

#### 23. `retention-newsletter-confirm-unsubscribe` · P2
- **问题**：landing newsletter 裸采集邮箱无确认无退订，列表未验证（投递/spam-trap 风险）+ 法律暴露（CAN-SPAM/GDPR 要求可用退订），永远无法安全群发，阻塞所有下游生命周期。
- **证据**：`migrations/007_newsletter_subscribers.sql:13-18` 仅 id/email/source/created_at，无 status/token；`:2-3` 注释"v1 仅 honeypot+DB 无确认邮件"；`newsletter.ts:185-220` 单纯 insert 无 token/确认；`emailService.ts:25-127` 仅 4 个事务模板无 newsletter；`auth.ts:680` `verify-email/:token` 是可复制的 token 确认先例。
- **验收**：POST 新邮箱插 status='pending'+随机 token（≥128bit）并发 1 封确认邮件、API 仍 200（不变枚举信号）；点确认链接翻 confirmed + redirect 本地化成功页、无效 token 友好非 200 页；每封 newsletter 含可用退订链接、GET unsubscribe 幂等翻 unsubscribed 无需 auth 无邮箱进日志；设 List-Unsubscribe 头；重订重发确认；无原文/token 进日志。
- **步骤**：迁移 008 加 status/token/confirmed_at/unsubscribed_at + 索引 → emailService 加 sendNewsletterConfirmation（escapeHtml）→ newsletter.ts 生成 token+发确认+按 status 分支重订 → 加 /confirm /unsubscribe 路由 + List-Unsubscribe 头 → App.tsx 加 confirmed/unsubscribed SPA 页 → i18n 键 → 单测。
- **工时**：human ~3-4d / CC ~60-90min　**风险**：Resend 域名须 SPF/DKIM 否则进 spam（基建前置）；token 须不可猜单用途；别群发 pending 行　**依赖**：Resend FROM 域 DKIM/SPF 验证（基建）　**文档**：`docs/PRD.md` §4.3+路由+§4.4、`migrations/FOLDER.md`

#### 24. `retention-saved-readings-history` · P2 · ⚠ 最高 PII + 最大工时
- **问题**：生成的解读是瞬态——无 natal/reading 保存历史，仅 Synastry/CBT 的 per-device localStorage（清缓存/换设备即失）。付费用户无法回看，杀回访留存，也无理由保持登录。
- **证据**：grep `saved.?reading|reading.?history|saved.?chart` 零命中；`SynastryPage.tsx:1483-1501` 仅 localStorage（含 PII 客户端）；`CBTMainPage.tsx:43` CBT localStorage；`cbt.ts:81,541-563` 服务端 CBT 是 cache-backed TTL90d 非耐久用户存储；`auth.ts:436...703` 完整账号系统 + DELETE 账号路由（数据删除模式）；`cache/strategy.ts:47` hashInput 是 PII 键摘要法。
- **验收**：登录用户可存 natal/cycle/synastry 解读、'Saved' 列表显示标题/类型/日期、重开不再扣 credits；解读按 user_id server-side 隔离、未授权 401、绝不返他人数据（authz 测试）；server-side birth 输入按用户行 RLS service-role-only、任何缓存键过 hashInput 非明文（红线 2）；删解读幂等 + 账号删除级联清解读；无 birth 字段进 analytics（红线 1）；匿名 localStorage 流不回归。
- **步骤**：迁移 009 saved_readings(user_id/tool_type/title/input_json/output/created_at + 索引 + RLS)→ `savedReadings.ts` 路由（authMiddleware：POST/GET 列表/GET:id own/DELETE:id own）→ 账号删除级联 → 前端 result 视图加 Save + Saved 列表页（登录 gate）→ i18n → TDD authz 隔离 + E2E。
- **工时**：human ~1.5-2 周 / CC ~3-4h　**风险**：最高 PII——server-side birth + 解读文本必须 RLS 锁 + 日志脱敏 + 账号删除覆盖，否则破红线；存全 LLM 输出膨胀存储；范围易膨胀，v1 限 save/list/open/delete　**依赖**：现有账号系统（无新依赖）　**文档**：`docs/PRD.md` §4.3+路由+§4.4+§2、`migrations/FOLDER.md`、`api/FOLDER.md`

---

## 3. 跨切面（落地前必读）

### 3.1 三个串行化雷区（同文件不并发写）
1. **`backend/src/data/wiki.ts`**：#4 → #5 → #11 严格串行（WIKI_SEO_OVERRIDES + sign 正文同文件）。房间簇 #4 领头（最大蚕食赢面）。
2. **免费盘漏斗硬流水线**：#6（导流量）→ #7（高风险 guest 迁移，触 2026-05-20 不变量）→ #12（需迁移事件存在才能发 funnel_chart_migrated）。
3. **变现共享层**：#13（货币 resolver）先行 → #14/#15 继承 EUR/GBP；#14/#15 都改 `constants.ts` subscription i18n，协调键增避免 merge churn。

### 3.2 去重（别造两套）
- **PII 脱敏**：#2（手搓 maskEmail）vs #10（落地 CLAUDE.md 要求的 canonical `sanitizeForLog`）。#2 是 P0 先发，但 #10 落地后须把 emailService 重构到共享 helper，**不要留两套脱敏实现**。
- **PII-key 断言测试**：#10/#12/#24 各自加近重复的"无 PII 进 analytics"断言，合并成**一个共享 PII-key 测试 util**。
- **Ask 云端数据告知措辞**：#3（定义文案）、#9（隐私政策 AI 披露需一致）、#7（同一 birth-data-to-LLM 流）——**单一文案来源**贯穿三者。

### 3.3 ⚠ 未覆盖缺口（critic 发现，不在 24 story 内，列为占位别丢）
- **GAP-1**：208 处裸 `console.*` → 结构化 logger **全量迁移**。#10 显式 out-of-scope，~200 个非结构化（潜在 PII）日志点 epic 后仍在。→ 建议独立 story。
- **GAP-2**：CBT 危机门 + cbt/ask 安全 disclaimer。**注：AI 安全审计已确认这两项落地**（`cbt.ts:49-78` 危机短路、FrameworkDisclaimer 已扩展 cbt/ask、`safety.test.ts` 守护）——critic 因"无 story"误报为 gap，**实际已做**。唯一真残留是 `cbt.ts` 仍用内联 lang 三元未迁 `resolveLang`（CLAUDE.md 已知债）→ 顺手清理。
- **GAP-3**：GDPR 数据主体 erasure/export。#24 给新 saved_readings 加了账号删除级联，但**现有** Synastry/CBT 客户端 localStorage PII 无删除/导出闭环。→ 建议 DSAR story。
- **GAP-4**：#8 CSP 依赖的支付 SDK（PayPal/Airwallex/Stripe）域名 allowlist 无 discovery story 产出——epic 内最高风险的未规约工作。→ 应做 discovery 子任务前置 #8。
- **GAP-5**：webhook/billing 测试覆盖。#17 把 auth/billing/webhook 列为 100% 目标，但若实测低只留 ratchet TODO，计费正确性仍未测。
- **GAP-6**：#21 只产出 runbook + TODO，**不实际启用** PITR/定时备份。若发现平台未启用，可靠性缺口仍是 doc-only。→ runbook 首要 TODO 须带 owner/deadline。

### 3.4 弱验收 / 人工·基建闸（非"code-complete"，是"人/基建就绪才算完"）
- **#9 隐私法务**：法务 sign-off 是人工 gate；"AI 不留存训练"断言需对供应商合同核实，仓内无法验。
- **#21 备份 runbook**：所有验收是 doc-存在 + dashboard 核验 + 恢复演练，CI 不可跑。
- **#8 CSP**：「不破坏支付」只能靠 Report-Only 模式下真实生产流量 + 人工 console 观察，支付域名 allowlist UNVERIFIED。
- **#15 PayPal**：v1/v2 路由映射决策留开放（"repoint OR 独立挂载，逐 endpoint 定"），且需真实 PayPal creds+webhook 才能真测。
- **#11 ZH aura/chakra**：「ZH stub 有真内容」靠人工逐 URL 主观判断 rewrite vs suppress。

### 3.5 外部前置（代码就绪也可能 stall）
- #13：Airwallex dashboard 建 EUR/GBP price ID（财务）
- #15：ops 决定默认 PAYMENT_PROVIDER + PayPal creds/webhook
- #23：Resend FROM 域 DKIM/SPF 验证
- #10/#21：Supabase/Vercel env + dashboard 访问

---

## 4. 一句话收口

地基扎实（核心工具、AI 安全危机门/免责/姓名别名化、SEO 预渲染都已落地且有测试）。这份 backlog 的重心是**增长侧的下一段**：先把 SEO 入口收口（蚕食/薄内容）+ 信任合规堵住（假数据/邮箱日志/Ask 告知/CSP），再修免费盘→注册漏斗（不是裸拆登录墙），变现补 EUR/GBP+公开定价，最后才是留存。**前 7 个 P0 是"入口、漏斗、信任"，不是游戏化 streak。**
