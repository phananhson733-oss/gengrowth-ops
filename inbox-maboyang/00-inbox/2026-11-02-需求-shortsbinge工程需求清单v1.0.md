---
title: 需求 · shortsbinge.com 工程需求清单 v1.0（致彪哥）
date: 2026-11-02
status: 待排期
scope: 对应优化总方案v1.0的工程可执行项，完整背景见2026-11-02-方案-shortsbinge网站优化总方案v1.0.md
---

# 需求 · shortsbinge.com 工程需求清单 v1.0

当前站点处于谷歌批量质量复核期（抓取后判定内容质量未达标而拒收，不是删页），以下是分阶段的工程需求。阶段1本周立即做，阶段2本周启动试点，阶段3等试点验证通过后再排期，不是本周任务。

---

## Tier1 / Tier2 剧目名单

sitemap白名单（阶段1第一项）要保留的范围。Tier1是重点剧，Tier2是其余28天内有展示或有点击的剧，二者之外的剧（约4万部，Tier3）从sitemap撤出。

**Tier1（30部，按28天点击量排序）：**

| 剧名 | 语言 | 28天展示 | 28天点击 |
|---|---|---:|---:|
| Rejecting My Five Female Mates | en | 1,601 | 220 |
| The Alpha and His Nanny Luna | en | 1,865 | 71 |
| من الصفر إلى الألفا عودة ملك الذئاب | ar | 219 | 55 |
| The Mafia Don's Downfall | en | 1,617 | 49 |
| 俺のスーパーX線~透視は止められない~ | ja | 685 | 41 |
| The Alpha Princess Is Gone for Good | en | 2,617 | 34 |
| My Rival Captain Made Me His | en | 348 | 28 |
| The Hundredth Oath | en | 187 | 27 |
| One Good Deed, One Great Fortune | en | 436 | 26 |
| زوجي السابق التافه هو جني المصباح | ar | 105 | 26 |
| Claimed by the Prince: The Forbidden Wet Nurse | en | 616 | 21 |
| The CEO Who Felt My Pregnancy | en | 439 | 20 |
| Uncle, Deeper Than That | en | 215 | 17 |
| I Came Second in His Love | en | 259 | 15 |
| I Married a Nobody but He Was the Beast King | en | 183 | 14 |
| หวนคืนจากคุก พบรักแท้และลูกสาว | th | 276 | 13 |
| Runaway Single Mom and Her Billionaire Hubby | en | 202 | 12 |
| The Beheaded Queen's Rebirth to Dethrone the King | en | 121 | 11 |
| 你擋不住我的超級X光透視眼 | zh-TW | 254 | 8 |
| I'll Never See You Again | en | 110 | 8 |
| Spoiled by Four Sea Monster Husbands | en | 38 | 7 |
| The Cartel's Contract Bride | en | 23 | 7 |
| Step Back, That Homeless Man Is Not to Be Messed With | en | 87 | 6 |
| Gizli Ejderhanın Uyanışı | tr | 65 | 6 |
| Loved Me Most, Betrayed Me Worst | en | 27 | 6 |
| Ensinei Uma Mulher Cobra a Flertar... | pt | 26 | 6 |
| ليلة مع شقيق خطيبي | ar | 26 | 6 |
| My Dragon Husband | en | 271 | 5 |
| Out of Your League: The Billionaire Wife's Revenge | en | 78 | 5 |
| Married Behind Masks | en | 71 | 5 |

完整字段（含URL slug）见`2026-11-02-数据-Tier1剧目清单30部.csv`。

**Tier2（630部，28天内有展示或有点击、不在Tier1内，按展示量排序前20预览）：**

| 剧名 | 语言 | 28天展示 | 28天点击 |
|---|---|---:|---:|
| Star Prison | en | 704 | 4 |
| Divorced, a Hockey Star Chose His Biggest Rival | en | 146 | 5 |
| A Birthmark Exposed My Husband's Secret | en | 113 | 0 |
| The Great and Powerful Genie | en | 108 | 2 |
| I Divorced My Husband Over a Birthmark | en | 103 | 1 |
| My Contract Wife Is a Hitman | en | 100 | 4 |
| Nights with My CEO | en | 88 | 3 |
| The Sister They Hated | en | 85 | 4 |
| SSS-Rank: The Slum-Born Thunder God | en | 83 | 3 |
| Five Years of Secret Love, He Married My Best Friend | en | 78 | 3 |
| Kneel Before the Dragon Queen | en | 76 | 3 |
| Taming My Mafia Master | en | 74 | 0 |
| The Triplets' Final Regret | en | 67 | 4 |
| Thrown into Prison, Claimed by Three Alphas | en | 66 | 3 |
| His Decoy Wife | en | 65 | 3 |
| Obsessed by My Stepbrother | en | 62 | 1 |
| Don't Harm the Heiress, Her Mom Is the Sable Queen | en | 61 | 0 |
| The Billionaire Parents' Final Test | en | 58 | 2 |
| Illegal Touching | en | 55 | 1 |
| The Comeback Heiress | en | 55 | 4 |

完整630条（含URL slug、语言、展示/点击全量数据，按展示量降序）见`2026-11-02-数据-Tier2剧目清单.csv`，彪哥核对sitemap白名单时直接导这份文件用。

---

## 阶段1：本周立即执行（低风险，不动页面结构）

| 要做什么                                                                                             | 目的                                          | 验收标准                                                         |
| ------------------------------------------------------------------------------------------------ | ------------------------------------------- | ------------------------------------------------------------ |
| 剧主页"Watch guide →"模块，找不到本剧对应的攻略页时不渲染这个模块                                                         | 修正程序bug——目前会误链到完全不相关的剧的攻略页                  | 抽查多个剧主页，Watch guide模块要么链到本剧自己的攻略页，要么不显示                      |
| "10 episodes free to watch here"文案改为准确描述实际行为                                                     | 当前主按钮直接302跳转DramaBox站外，文案与实际不符              | 文案内容与CTA实际跳转行为一致                                             |
| dramas-*.xml sitemap文件从全量改为白名单：只含Tier1（约30部重点剧）+ Tier2（28天内有展示或有点击的剧页）                           | 降低无效URL占比，把抓取预算留给值得抓的内容                     | sitemap内drama相关URL数量大幅下降；不删除实际页面、不做301，只是不再提交                |
| ~~episode/2~51整层设为noindex~~ **不需要新增改动**——实测已经是`noindex, follow`，robots.txt的`User-Agent: *`组（含Googlebot）本身也已`Disallow: /drama/*/episode/`，只放行episode/1，多个语言抽查结果一致 | — | — |
| browse列表、语言切换、"Other languages"模块的内链，指向的URL改为不带`?mood=`、`?story-beats=`参数的干净分类页                  | 这13,220条参数页已noindex，内链还在导致重复抓取浪费            | 抽查首页/browse页/语言切换模块，内链不含这两个参数                                |
| 攻略页内部链接去掉`?ui=en`参数                                                                              | 该参数会导致`<html lang>`变成en但URL路径仍是对应语言路径，信号不一致 | 抽查攻略页正文/导航内链，不含`?ui=`参数                                      |
| 泰语剧`หวนคืนจากคุก-พบรักแท้และลูกสาว`的"(配音版)"页面（dskvyj24c2mr）加`rel="canonical"`指向正常版（hu377q7ljua2） | 两版简介、封面完全相同，分流了本就稀薄的搜索信号                    | 配音版页面HTML中canonical标签指向正常版URL                                |
| 确认并停止非英语语言（除th）的新剧自动发布                                                                           | 已发现zh-TW语言19小时内新增2部剧，语言冻结尚未真正在工程侧落地         | 连续3天检查非英语sitemap文件，除th外无新增URL                                |

---

## 阶段2：不是"试点"，是"5部发布检查48小时+全量Tier1 30部"

**11/4更新**：取消"5部试点观察2~4周"这个节奏。11/1-11/3三天GSC数据确认当前流量已经低到约等于零（0点击/11曝光、1点击/10曝光、0点击/2曝光），继续改页面没有"改坏现有排名"的风险。但分批上线本身不能省——防的是工作量和归因风险，不是流量风险：模板一次性套上4.2万页，VideoObject或播放器格式错了要全站返工。

**节奏**：首批5部做48小时发布检查（不是观察期），5项自检全过后48小时内直接扩大到Tier1全部30部，不再分批。Tier3（约4万部无展示剧页）不套模板，继续只做"从sitemap撤出"（阶段1已有），天然成为对照组。

**48小时自检五项，全过才能扩大范围**：

| 自检项 | 标准 |
|---|---|
| ① 起播方式 | 点ep1在同一个URL起播，不跳站、不产生新URL |
| ② 结构化数据 | 用结构化数据测试工具验证VideoObject通过，HTML源码里不出现ep13+的播放地址 |
| ③ TDK基础项 | Title≤60字符、canonical指向自己、robots是`index, follow` |
| ④ 首屏性能 | 播放器改成用户点击后才加载iframe，不在首屏加载时抢带宽 |
| ⑤ 内链 | 剧页不再给ep2~50做全量内链 |

**首批5部确定名单**（按28天点击量从Tier1里选出）：

| 顺序 | 剧名 | 语言 |
|---|---|---|
| 1 | หวนคืนจากคุก พบรักแท้และลูกสาว | th |
| 2 | Rejecting My Five Female Mates | en |
| 3 | The Alpha and His Nanny Luna | en |
| 4 | The Mafia Don's Downfall | en |
| 5 | The Alpha Princess Is Gone for Good | en |

| 要做什么                                                                                                                                              | 目的                                    | 验收标准                                                              |
| ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | ----------------------------------------------------------------- |
| 上述5部剧的剧主页改版为单页结构：首屏播放器（episode1~12同页内切换，不产生新URL）+ H1 + 正文（按Overview/Quick Facts/剧情/角色/看点/适合谁/在哪看/FAQ模块）                                           | 把剧主页和episode/1两个高度重复的薄页合并成一个信息完整的页面   | 5部试点剧的剧主页包含首屏播放器和上述全部正文模块                                         |
| 每部试点剧挂12条VideoObject结构化数据（仅episode1~12），必填name、description、thumbnailUrl、uploadDate、duration、player_loc                                            | 修复视频未结构化导致"视频不在观看页面上"（当前421条）的问题      | 用结构化数据测试工具验证12条VideoObject字段完整；episode13+的播放地址不出现在页面源代码中（避免绕过付费墙） |
| 首页、分类页、剧卡、episode/1页"下一集"入口，针对5部试点剧统一改为指向剧主页（而非episode/1）                                                                                         | 统一入口，避免内链继续分流到即将退场的episode/1          | 抽查首页/分类页/剧卡，5部试点剧的链接目标是剧主页                                        |
| 2篇现有攻略页（dragon-king-only-listens-to-me-guide、fake-dating-my-enemy-at-alpha-academy-guide）补充Quick Facts（表格形式：总集数/免费集数/平台/上线日/评分）、主要角色、适合谁看、在哪看四个模块 | 这两篇正文质量已足够，缺的是结构化事实模块，这部分最容易被搜索引擎直接摘取 | 两篇页面均包含完整的四个模块                                                    |
| 攻略页正文中间的推荐卡移出正文段落；找不到对应剧攻略页时不显示该模块                                                                                                                | 避免语义断裂，避免误链到不相关的剧                     | 抽查攻略页，推荐卡不出现在正文段落中间                                               |
| 攻略页title标签长度控制在60字符左右                                                                                                                             | 当前部分title超120字符，SERP展示会被截断            | 抽查攻略页title标签长度                                                    |
| 排查79篇攻略页中明确写"ShortsBinge does not carry this one"、外链直连dramabox.com的内容，替换为站内推荐或补齐站内可看内容                                                            | 这类内容在为竞品做SEO                          | 排查结果列出清单，逐条替换或补齐                                                  |
| 首批5部48小时自检全过后，48小时内把同一套改版扩大到Tier1全部30部（名单见前面Tier1章节），不再分批 | 把"试点两周"压缩成"两天"，流量风险已确认约等于零，没必要拖 | Tier1全部30部剧主页均完成改版，且逐一通过上述五项自检 |

---

## 社媒剧页技术规范（新机制，长期生效）

| 要做什么 | 目的 | 验收标准 |
|---|---|---|
| 非英语新剧配合社媒发布时，按此规范新建页面：仅该剧视频对应的那一个语言版本、`<meta name="robots" content="noindex, follow">`、不写入任何sitemap文件、页面仅含播放器（ep1~12）+ Quick Facts（8~10行）+ 3条内链（同题材/同平台/回列表） | 社媒流量不经过谷歌搜索，不需要被索引；同时避免产生新一批薄页 | 新建的社媒剧页符合上述全部规格 |
| 社媒剧页的内链来源仅限：短链`/q<code>`跳转目标 + 一个同样noindex的"社媒上新"列表页。不出现在首页trending、browse分页、语言切换模块、站内搜索默认结果中 | 避免被高权重入口反复抓取，浪费抓取预算 | 全站搜索该剧页URL，只有上述两个来源能链到它 |
| 一部剧被放上对应语言首页Hero时，**同一次发布动作里**把该剧页从noindex切换为可索引、并写入sitemap | Hero是全站抓取频率最高的入口，不允许它链接指向noindex页面（会导致反复抓取一个主动拒绝收录的页面，浪费抓取预算），且Hero放置本身就是"值得推"的验证信号 | 首页Hero展示的剧，对应页面均为可索引状态且已在sitemap中 |
| TikTok短链`/q<code>`的跳转目标，从统一跳首页改为按视频对应的剧直接跳转`/drama/<slug>/`（非英语账号跳转对应语言版） | 减少用户从首页自己找剧这一步，缩短转化路径 | 抽查短链跳转目标，指向视频对应的具体剧页而非首页 |

---

## P0：GA4归因修复——**已验证修复（#459）**

11/3实测确认：`dl`字段现在完整包含`utm_*`参数（测试链接`?utm_source=tiktok&utm_medium=social&utm_campaign=test_verify&utm_content=test123`，抓包`google-analytics.com/g/collect`，`dl`字段完整带出全部4个UTM参数）。采用的是UTM白名单方案，不是完整query string透传——另测了一次带`q=`和非UTM参数的链接，这两个参数被过滤掉，只保留UTM字段。这是出于隐私考虑（避免把站内搜索词发给谷歌），比原需求"完整query string"更保守，可以接受，不需要改成完整透传。

此项已完成，不需要再排期。

（完整问题复现与验证方法见`2026-11-02-方案-shortsbinge-GA4-UTM归因修复方案.md`）

---

## 已确认无需处理

- **`Crawl-delay: 10`对Googlebot不生效**：Google官方明确Googlebot不读取`Crawl-delay`指令，这条只对Bing等少数爬虫有效，不是抓取量偏低的原因，不需要为Googlebot单独放开，robots.txt不用改。
- **`Disallow: /*?mood=`在`User-Agent: *`组里**：确认属实，这是预期行为，不是配置错误，不用动。

---

## 阶段3：待阶段2试点验证通过后再排期（预告，非本周任务）

| 要做什么 | 目的 | 验收标准 |
|---|---|---|
| episode/1设为noindex、从sitemap移除、301到对应剧主页 | 完成剧主页+episode/1的合并，episode/1退场 | episode/1访问后301到剧主页，且该剧主页保留原有展示/点击数据 |
| 上线video sitemap，只提交`player_loc`字段，不输出`contentUrl` | 加快视频内容被发现和索引的速度 | GSC站点地图报告显示video sitemap读取成功 |
