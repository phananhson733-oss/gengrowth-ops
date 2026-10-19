---
title: ShortsBinge.com 全站SEO审计报告（技术SEO / SEO / 内容 / 网站结构）
date: 2026-09-18
审计范围: https://shortsbinge.com/ 全站（首页/browse枢纽页/drama详情页/episode播放页/best-short-dramas博客/robots+sitemap）
方法: 直接curl抓取HTML/robots.txt/sitemap.xml + 浏览器渲染核对JSON-LD（server-rendered，非JS注入，curl可见，双重验证一致）+ 对照Google官方文档
基线: 本文档验证的是 2026-09-08-短剧新站-网站架构设计-v2定稿.md 里定下的方案是否在生产环境里被正确执行，不重复推导设计决策本身
---

# 执行摘要

**整体健康度：中高，核心架构决策基本落地，但有1个确认的技术缺陷违反了自己定的规则，1个需要验证的基础设施风险，1个站点级的图片可访问性问题。**

## 优先级最高的3件事

1. 🔴 **付费集（noindex）页面仍在输出VideoObject结构化数据**——直接违反v2定稿第三节自己定的规则，抽查3个noindex集数全部命中
2. 🟡 **Vercel机器人防护会对突发抓取量返回429挑战**——本次审计过程中被自己的测试请求触发，需要去Vercel后台确认Googlebot/Bingbot是否在白名单里，这正是dramashortstv上次"补抓高峰→抓取量腰斩"故障的同款风险点
3. 🟡 **全站内容缩略图（剧集封面网格）100%缺失alt文本**——抽查的drama详情页和genre枢纽页均确认，不是个别页面问题

## 做对的地方（同样重要，不能只报问题）

- 免费/付费集数的noindex + canonical自引用 + sitemap排除，三者一致，正确实现了v2定稿的核心红线
- sitemap只收录免费首集（episode/1），付费集不进sitemap——完全对应"1词1篇"的收录纪律
- URL全部path-based（`/drama/{slug}/`、`/drama/{slug}/episode/1/`），没有query-param locale，符合Google国际化官方指南
- VideoObject的`contentUrl`正确留空、`embedUrl`正确指向自身而非上游ReelShort——完全对应v2定稿第三节的方案
- genre枢纽页有真实编辑性文案（不是自动拼接的模板句），不是纯列表页
- robots.txt区分了AI训练爬虫（拦截GPTBot/CCBot等）和AI搜索爬虫（放行OAI-SearchBot/PerplexityBot等），是有意识的策略，不是误配置

---

# 一、技术SEO：抓取与收录

## 1.1 robots.txt — 正常

```
User-Agent: *
Allow: /
Allow: /api/play/
Disallow: /api/

User-Agent: GPTBot / ClaudeBot / CCBot / Bytespider / meta-externalagent / Amazonbot
Disallow: /

User-Agent: OAI-SearchBot / Claude-SearchBot / PerplexityBot / meta-webindexer / Amzn-SearchBot
Allow: /
Disallow: /api/
Crawl-delay: 10

Sitemap: https://shortsbinge.com/sitemap.xml
```

**评估**：拦截AI训练爬虫、放行AI搜索爬虫，这个区分本身是行业里越来越标准的做法，不是问题。`Sitemap:`声明正确。唯一要确认的：`Crawl-delay: 10`只加在AI搜索爬虫分组上，没有限制Googlebot/Bingbot，这是对的——Google本身不遵守crawl-delay指令，加了也没用，放对了地方。

## 1.2 XML Sitemap — 结构正确，但有信号质量问题

**结构**：单文件，非索引文件，147条URL，5.6万条以下（远低于5万硬顶）。分布：

| 前缀 | 数量 | 说明 |
|---|---|---|
| drama | 116 | 58部剧 × 2（详情页+episode/1） |
| browse | 17 | genres/tropes/moods/platforms/collections枢纽页 |
| best-short-dramas | 6 | 博客（含1个列表页+5篇文章） |
| 其余 | 8 | trending/this-week/terms/privacy/copyright/contact/about/首页 |

**✅ 正确**：只有episode/1进sitemap，episode/2起（付费集）不在sitemap里，和v2定稿方案一致，实测抽查episode/5、6、9全部返回`noindex, follow`。

**⚠️ 需要关注：`<lastmod>`高度集中**——116条drama家族URL里，**116条全部标注`lastmod: 2026-09-17`**（抽样对比另外4条独立时间戳的页面，确认不是全站统一时间戳的正常现象，是drama家族特有）。这正是v2定稿第三节明确预警过的风险："如果内容是批量导入的...几万条页面会声明同一个日期，这个信号大概率会被Google判定为无效"——**当时是预警，现在是已经发生的事实**，不是理论推演。

**官方依据**：Google的sitemap文档说`lastmod`应反映页面真实的最后修改时间，Google会用它判断是否需要重新抓取；如果`lastmod`不可信（比如全站同一天），Google在实践中会降低对这个字段的信任权重，等同于这个信号失效——不是"有害"，是"没用"，和v2定稿原话判断一致。

**建议**：如果确实是批量导入，`lastmod`应该反映"本站首次收录该剧的真实时间"，而不是部署当天的时间戳；如果后续做分批上线（参见09-16的分批上线文档），这个字段会自然分散开，不用额外处理。

## 1.3 索引状态抽查 — 免费/付费边界正确落地

抽查同一部剧（A Farm Girl's Reckoning）的4集：

| 集数 | robots meta | canonical | 结论 |
|---|---|---|---|
| Episode 1 | `index, follow` | 自引用 | ✅免费集可索引 |
| Episode 5 | `noindex, follow` | 自引用 | ✅付费集正确排除 |
| Episode 6 | `noindex, follow` | 自引用 | ✅ |
| Episode 9 | `noindex, follow` | 自引用 | ✅ |

canonical在noindex页面上依然自引用（没有指向episode/1或指向空），这是对的——canonical和noindex不冲突着用，避免了"noindex页面canonical指向别处"这种会让Google同时收到两个矛盾信号的常见错误。

## 1.4 🔴 确认的缺陷：付费集页面仍在输出VideoObject结构化数据

**问题**：v2定稿第三节明确写了"免费集（noindex之外的正常可索引集数）才输出VideoObject，付费引导页（本身就是noindex）不输出——两段Schema只在真的有内容可看的页面上出现，不为不可索引的页面硬造结构化数据"。

**实测**：抓取episode/5和episode/6（均为`noindex`）的HTML，`VideoObject`字符串在两个页面里都出现（各2次，对应`@type`和`@id`两处），说明这两个noindex页面依然在完整输出TVEpisode+VideoObject的JSON-LD。

**影响**：不算严重技术故障（不会导致页面被误收录，noindex本身仍然生效），但是：
1. 直接违反了团队自己定的架构规则，说明"新增episode路由时该判断的地方没判断"，这类逻辑遗漏容易在后续迭代里累积更多不一致
2. Google对noindex页面上的结构化数据基本不处理（不会展示富结果），等于这部分渲染成本是纯浪费
3. 如果未来有审计工具（比如Google Search Console的"增强"报告）扫到"noindex页面输出VideoObject"，可能被判定为实现不一致，虽然不是排名惩罚项，但是个可以避免的噪音

**修复**：在生成episode页面JSON-LD的逻辑里加一个判断——`robots meta`为noindex时不输出`video`字段（或整个不输出TVEpisode的video子对象），只保留基础的TVEpisode元数据（如果连TVEpisode本身也不需要保留，可以参照v2定稿原意直接跳过整段Schema）。

**优先级**：Medium（不影响当前索引状态，但是明确的规则违反，且修复成本低）

## 1.5 🟡 需要验证：Vercel机器人防护对突发抓取量的反应

**发现过程**：审计过程中对`/browse/genres/romance/`发起连续请求后，第N次请求收到`HTTP 429`，响应头带`x-vercel-mitigated: challenge`和`x-vercel-challenge-token`，页面内容是"Vercel Security Checkpoint"验证页，不是真实内容。用浏览器（不同网络路径）访问同一URL能正常拿到内容，说明这是**基于请求速率的IP级挑战机制**，不是页面本身故障或全站封锁。

**为什么这值得写进审计报告，而不是当成我自己测试出的噪音忽略掉**：dramashortstv这边上个月刚发生过一次真实故障——sitemap一次性暴露几十万URL后，Google的补抓高峰把日抓取请求从平时1,500-8,000次冲到44,081次（5-30倍），紧接着触发Google自己的抓取预算收紧，抓取量断崖式跌破故障前水平。**如果shortsbinge这边的Vercel机器人防护在面对类似量级的合法Googlebot补抓时，也把请求当成异常流量挑战/拦截，会产生几乎一样的后果**——新站信任基础比dramashortstv当时更薄弱，一次这样的碰撞可能比上次更难恢复。

**这条目前是未验证的风险，不是已确认的故障**——本次触发是我的测试请求（几十次curl在几分钟内完成）造成的，不代表Googlebot的真实抓取节奏会撞到同一个阈值；Googlebot通常会自适应调节抓取速率，但09-16文档里已经计划了分批放量+按周扩量，扩量阶段的抓取节奏变化正是最可能撞上这类速率防护的时间点。

**建议**：去Vercel项目的Firewall/BotID设置里确认：（1）已验证的Googlebot/Bingbot UA+IP是否在允许列表；（2）速率阈值是否考虑过搜索引擎补抓场景。这条不需要现在就改，但应该在09-16文档里定的"每周扩量后观察抓取统计"这一步里，同时观察GSC里有没有429/5xx异常，作为扩量节奏的一个额外检查项。

**优先级**：Medium-High（未确认发生，但历史同类事故的后果严重，验证成本很低）

---

# 二、技术基础：性能与移动端

## 2.1 TTFB（首字节时间）

3次采样：724ms / 528ms / 528ms。Google官方对服务器响应时间没有给出硬性数字门槛，但作为参考，dramashortstv自己故障排查时用的正常基线是225-404ms——shortsbinge的528-724ms比这个基线高，但采样量太小（3次），不能直接下"变慢了"的结论，只能说**这个区间比同公司另一个站的历史正常水态偏高，值得在有更多真实流量后用PageSpeed Insights或GSC的Core Web Vitals报告复核，不能仅凭这3次curl下结论**。

## 2.2 移动端基础配置 — 正常

`<meta name="viewport" content="width=device-width, initial-scale=1"/>`存在且配置正确，`<html lang="en">`存在。响应式框架（Next.js + Tailwind推断的class命名）通常自带响应式断点，但**本次审计没有做真机/多断点的实际渲染检查**，如实说明这部分未覆盖，不代表没问题。

## 2.3 HTTPS与安全头 — 正常

`strict-transport-security`、`x-content-type-options: nosniff`、`content-security-policy: frame-ancestors 'none'`均存在，HTTPS全站强制，没有发现混合内容问题（抽查页面里的资源引用全部是`https://`绝对路径或协议相对路径）。

---

# 三、On-Page SEO

## 3.1 Title / Meta Description / H1 抽查结果

| 页面 | Title | 长度 | Meta Description | H1数量 |
|---|---|---|---|---|
| 首页 | ShortsBinge — The Short Dramas Worth Your Time | 46字符，符合50-60建议区间偏短但不算问题 | 存在，语气清楚 | 1（正确），但H1文案"Your Next Binge Is Already Here"不含核心关键词，偏品牌化 |
| Drama详情页 | A Farm Girl's Reckoning \| ShortsBinge | 简洁 | 存在，一句话剧情钩子，质量好 | 1，等于剧名，正确 |
| Episode页 | A Farm Girl's Reckoning Episode 1 \| ShortsBinge | 正确带集数 | 沿用剧情简介 | 未单独核实，结构与drama页一致 |
| Genre枢纽页（Romance） | Romance Short Dramas \| ShortsBinge | 正确 | "Relationship-first stories where the emotional choice drives every twist..." 独立编辑文案，不是模板套壳 | 1，就是"Romance" |

**结论**：抽查的4类页面title/meta/H1全部唯一、无重复、无堆砌，canonical全部自引用正确。这是新站在on-page基础规范上做得扎实的地方，没有发现dramashortstv早期出现过的那类问题。

**唯一的小提醒**：首页H1不含"short drama"这类核心词，完全是品牌化文案——这不是错误（首页通常允许更侧重品牌语气），但如果后续首页要承接核心词的搜索意图，可以考虑H1或紧邻H1的副标题里带一次核心词，优先级Low，不是必须改。

## 3.2 🟡 图片Alt文本：站点级问题，不是个别页面

**Drama详情页抽查**：11张图里，1张主封面图有正确的描述性alt（`alt="A Farm Girl's Reckoning"`），logo类图标alt=""合理（装饰性），但**相关剧集网格里的6张封面缩略图全部`alt=""`**，且没有`aria-hidden`标记——这些是真实内容图（其他剧的封面），不是装饰图，缺失alt不合理。

**Genre枢纽页抽查（Romance，29部剧）**：`document.querySelectorAll('img')`统计，**34张图，34张alt为空，缺失率100%**。这确认了不是drama详情页的个例，是整个"剧集封面网格"这个UI组件的通病——大概率是同一个前端组件（封面卡片Card组件）复用在drama详情页的"相关推荐"和genre/browse枢纽页的列表网格里，这个组件本身没有传入alt prop。

**官方依据**：Google图片SEO指南明确把alt文本列为图片可被图片搜索收录、以及页面主题理解的信号之一；同时这也是WCAG可访问性的基本要求，不只是SEO问题。

**修复建议**：定位到封面卡片组件（很可能是一个类似`<DramaCard>`的复用组件），改成用剧名生成alt（比如`alt={drama.title}`），这是一次性组件级修复，改一处，全站所有引用这个组件的页面（genre/trope/mood/platform/collection枢纽页+drama详情页的推荐区）会同时修好，不需要逐页改。

**优先级**：Medium-High（影响面是站点级的，但修复成本是一次性的组件级改动，性价比高）

## 3.3 内部链接结构 — 基本健康

Drama详情页抽查到的站内链接：指向browse/trending导航（合理，站点级导航）、指向同一部剧的其他集数（episode/6、7、8、9等，合理的剧集内导航）、指向6部"相关剧集"（合理的推荐位）。没有发现明显的孤儿页面迹象（每个抽查到的drama页面都能从genre枢纽页正常链接到）。

**未覆盖**：没有做全站爬取式的内链图谱分析（工作量超出本次审计范围），如果需要精确的孤儿页统计或内链权重分布，需要用Screaming Frog一类的全站爬虫工具，本次curl抽样审计不能替代。

---

# 四、结构化数据（Schema）

**方法说明**：本次JSON-LD审计通过curl直接抓到（Next.js做的是服务端渲染，不是客户端JS注入），并用浏览器二次核对一致，两种方法结果相同——不属于"web_fetch读不到JS注入schema"那类限制场景，本次结果可信。

## 4.1 已确认存在且实现正确的部分

| Schema类型 | 出现位置 | 评估 |
|---|---|---|
| `TVSeries` | drama详情页 | 字段完整（name/description/genre/numberOfEpisodes/datePublished/image），正确 |
| `TVEpisode` + `VideoObject` | episode页（免费集） | `contentUrl`正确留空，`embedUrl`正确自引用而非指向ReelShort上游，符合v2定稿方案 |
| `BreadcrumbList` | 全站页面 | 层级正确，从Home一路到当前页面 |
| `Organization` + `WebSite`（含`SearchAction`） | 全站 | 结构正确，`SearchAction`的`urlTemplate`指向站内`/search/` |

## 4.2 🟡 发现的问题

1. **noindex页面仍输出VideoObject**（见1.4，已详述）
2. **`contactPoint.email`使用`contact@dramashortstv.com`，不是shortsbinge.com自己的域名**——如果是有意为之（同公司统一收件箱），不算错误，但从品牌一致性和E-E-A-T的"transparent about business"角度，值得和产品侧确认是否是有意决定；如果不是有意的，应该换成本站域名邮箱
3. **枢纽页（genre/trope/mood等列表页）没有`ItemList`或`CollectionPage`结构化数据**——Romance页面29部剧的列表，目前只有BreadcrumbList和站点级Organization/WebSite，没有对列表本身做结构化标记。这不是错误（Google不强制要求），但属于可以补充的加分项，有机会在SERP里获得列表类富结果展示。优先级Low，锦上添花不是必须。

---

# 五、内容与网站结构

## 5.1 站点信息架构

```
/                         首页
/trending/                趋势页
/browse/                  浏览枢纽
  /browse/genres/{X}/     题材（romance/fantasy/drama/comedy...）
  /browse/tropes/{X}/     梗/套路（hidden-identity/rebirth-revenge/secret-child...）
  /browse/moods/{X}/      情绪标签（high-drama/easy-watch/cathartic/twist-heavy）
  /browse/platforms/{X}/  平台聚合（reelshort/dramabox）
  /browse/collections/{X}/ 精选合集（strong-female-leads/completed-binges...）
/best-short-dramas/       博客/观看指南
/this-week/{date}/        周报型内容
/drama/{slug}-{id}/       剧集详情页
/drama/{slug}-{id}/episode/{n}/  播放页
```

**评估**：层级清晰，题材/梗/情绪/平台/合集这套多维度分类，和v2定稿第四节"区分题材词与剧情元素词"的治理规则方向一致——从目前sitemap里的枢纽页数量（17个）看，还没有出现dramashortstv那种"一个标签下468部剧、多数是自动打标签打出来的剧情元素词"的失控迹象，规模还小，是治理规则生效的窗口期，值得持续盯着别让它在后续扩量时失控。

## 5.2 博客内容：进度滞后，不是缺陷

sitemap里`best-short-dramas`目前只有5篇文章（Alpha Princess、His One and Only Love、Is It Just Me、Reborn to Rule the Sky with My Dragon、Romance Lessons with My Quarterback）。而本地`inbox-maboyang/05-blog/dramashortstv/`目录下"可直接发布版"的稿件明显更多（含SSS-Rank、Secret Dragon、En La Mira Es等9月更新的稿子）。

**这不是审计意义上的"缺陷"，是内容同步进度的客观情况**——稿子已经写完，还没上线到shortsbinge.com。列在这里是为了让这份审计报告和实际内容产能对得上，不是说"内容不够"这个判断本身错了，只是要标注清楚"差多少是待发布，不是待创作"。

## 5.3 国际化/多语言 — 暂不适用，不代表已经验证过关

当前全站没有发现任何locale前缀（`/en/`、`/ru/`等），`<html lang="en">`固定为英文，sitemap里所有URL都不带语言路径。**这是符合当前阶段的正常状态（单语言上线），不是错误**——但v2定稿第一节的"URL构造统一函数+强制encodeURIComponent"红线是为多语言上线准备的，**这条红线本身没法从外部审计verify到（属于代码实现细节，不是能curl出来的东西）**，只能说：现在还没到测试这条红线的阶段，等多语言真正上线时，需要专门针对非拉丁字母slug（西里尔文/阿拉伯文/泰文）做一次真实请求测试，不能假设"当时设计对了，实现也一定对"。

---

# 六、优先级行动清单

## 立即修（本周内，成本低影响明确）

1. **修复noindex集数仍输出VideoObject的问题**——定位JSON-LD生成逻辑，加robots状态判断（对应1.4）
2. **修复封面卡片组件的alt文本缺失**——一次组件级修改，全站生效（对应3.2）
3. **确认Vercel Firewall/BotID是否已允许Googlebot/Bingbot白名单**，如果没有，现在流量小、风险可控的阶段是低成本修复窗口（对应1.5）

## 近期跟进（不紧急，但要纳入下一步计划）

4. **`lastmod`统一时间戳问题**——结合09-16已经写好的分批上线文档一起解决，不需要单独返工
5. **`contactPoint.email`域名确认**——一句话就能问清楚是不是有意为之
6. **枢纽页补充`ItemList`结构化数据**——加分项，不紧急

## 需要更多工具/数据才能覆盖的部分（本次审计的已知盲区）

- 全站内链图谱、孤儿页精确统计——需要Screaming Frog一类全站爬虫
- 真实Core Web Vitals（LCP/INP/CLS）——需要PageSpeed Insights或有真实流量后的GSC报告，curl测不出这些
- 移动端真机渲染检查——本次只验证了viewport meta是否存在，没有做多断点实际渲染
- 多语言/hreflang实现——站点目前单语言，等多语言上线后需要单独测试

---

*文件：inbox-maboyang/01-review-audit/2026-09-18-shortsbinge-com-全站seo审计报告.md*
*基线文档：2026-09-08-短剧新站-网站架构设计-v2定稿.md、2026-09-16-短剧新站-内容分批上线与AI润色优先级方案.md*
