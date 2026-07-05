---
project: astrologywiki + gengrowth
type: report
status: final
owner: Ma Boyang
updated: 2026-07-03
---

# 📊 GenGrowth 运营周报 | 2026-W27

**项目：** AstrologyWiki 增长 + 路径B新站建设 + GenGrowth 方法论沉淀 + 客户竞调
**周期：** 2026-06-29 → 2026-07-03
**汇报人：** 马博洋

---

## 一句话摘要

本周是执行密度最高的一周：aistorygenerator.work 完成技术SEO全面落地（H结构重构、关键词蚕食修复、11个工具子页内容补充，6/30全部上线验收通过）；GenGrowth 产品立项框架形成并完成7月1日汇报；BRDECO 完成四站竞调，发现B2B内容SOP无法直接套用的根本矛盾；路径B自动化建站系统PRD产出，将"ai story generator漏掉SERP核查"的教训直接转化为系统设计；Reddit增长SOP和三站发帖文案同步完成。

---

## ✅ 本周产出文件总览

| 日期 | 文件 | 类型 | 状态 |
|---|---|---|---|
| 06-29 | `03-content-briefs/2026-06-29-homepage-schema-implementation-brief.md` | 开发简报 | 已实施（含oracle架构修正） |
| 06-29 | `06-tasks/2026-06-29-pathB-launch-action-plan.md` | 执行计划 | 执行中（技术项6/30已核查落地）|
| 06-30 | `06-tasks/2026-06-30-aistorygenerator-heading-plan.md` | SEO优化方案 | ✅ 已全部上线验收通过 |
| 07-01 | `00-inbox/2026-07-01-会议材料-产品立项与SEO增长.md` | 汇报材料 | ✅ 已汇报 |
| 07-02 | `00-inbox/2026-07-02-brdeco竞品调研分析.md` | 竞调报告 | Final v2 |
| 07-02 | `00-inbox/2026-07-02-astrologywiki-reddit内容执行SOP.md` | 运营SOP | Active v1.1 |
| 07-02 | `00-inbox/2026-07-02-reddit-发帖文案.md` | 执行文案 | 备用（待账号预热后使用）|
| 07-02 | `06-tasks/2026-07-02-路径B自动化建站系统-需求文档.md` | PRD | v0.1 待产研评估 |
| 07-03 | `00-inbox/2026-07-03-博客外链资源库自动化系统-需求文档.md` | 需求文档 | v0.3 Final |

---

## ✅ 本周进展

### 本周业绩增长点

**AstrologyWiki GSC 数据（28天，截至7/5）出现明显上涨：**

| 指标 | 数值 |
|---|---|
| 总点击 | 283 |
| 总曝光 | 1.95万 |
| 平均点击率 | 1.5% |
| 平均排名 | 16.9 |

图表显示点击和曝光在近两周均呈明显上翘趋势，排名从此前的30+区间持续收敛至16.9。**流量主要来源是趋势词blog**，而非工具页——趋势内容命中了用户当前的搜索意图，带来了短期集中的点击和曝光增量。工具页的P-1修复、schema、互链等技术优化是长线动作，效果尚在积累中，本阶段数据归因应与blog区分看待。

**aistorygenerator.work**：技术SEO本周全面落地（关键词蚕食修复、H结构重写、11个子页内容补充），博客外链自动化同步启动（50条/天）。GSC点击数据预计M2-M3开始出现，当前处于索引和权重积累阶段。Reddit SOP和发帖文案到位，引荐流量渠道可随时激活。

**GenGrowth业务层面**：BRDECO竞调明确了B2B客户SOP适用边界；产品立项框架汇报完成，路径B方法论趋于成熟。

---

### 模块一：aistorygenerator.work — 技术SEO全面落地（6/30，全部上线）

**这是本周最重量级的执行成果。** 从方案设计到线上验收，全部在6/30单日完成。

**核心改动（已验收）：**

| 优先级 | 任务                                                                            | 状态                  |
| --- | ----------------------------------------------------------------------------- | ------------------- |
| P0  | `/ai-story-generator` 页面301重定向至首页（消除关键词蚕食）                                    | ✅ 线上308验收通过         |
| P0  | 首页内置真正的生成器，默认即AI Story Generator                                              | ✅                   |
| P1  | 首页H1改为 `Free AI Story Generator`，H2结构全面改写（核心词密度提升）                            | ✅                   |
| P1  | 首页H3删除"AI Story Generator"、`AI NPC Generator`→`NPC Generator`                 | ✅                   |
| P2  | 全部11个RPG工具子页：补充What is/examples/Who for + Related tools横向内链                   | ✅ 11/11             |
| P2  | NPC子页H1→`NPC Generator for D&D and Tabletop RPGs`（命中 npc generator 2000量/KD3） | ✅                   |
| P3  | 新建 `/dnd-story-generator/`（250量/KD0，独立意图，已有页面无对应）                             | ✅ 200；接入nav/sitemap |

**发现的关键词蚕食问题（值得记录）：** 原有 `/ai-story-generator` 子页与首页竞争同一个词，导致Google不知道该展示哪个页面。发现即修复，做了301重定向，权重全部归并首页。

---

### 模块二：AstrologyWiki 首页 Schema 实施（6/29）

产出首页 Organization / WebSite schema 实施简报，同步给前端工程团队。

实施过程中，oracle架构核查后发现原brief有两处需修正：(1) 首页schema并非"缺失"而是JS运行时注入，本次是提前到首字节；(2) Organization必须含 `sameAs` 社交账号（原文省略会丢知识面板信号）。已按修正版落地，447单测全绿。

---

### 模块三：GenGrowth 产品立项框架 + 7月1日汇报（07-01）

完成产品立项与SEO增长汇报材料，核心框架沉淀如下：

**流量型产品适配度判断（"用户搜到真正用上需要几步"）：**
- 网页工具站：1步，✅ 完全套用SOP
- Web SaaS：2步，✅ 可套用，加注册转化优化
- 手机App/桌面工具：4步，⚠️ SOP管落地页，管不了安装转化
- B2B服务：5步+，❌ SEO是品牌背书，不是主获客渠道

**沙盒期压缩杠杆：** 买老域名可直接跳过3-4个月沙盒期（$100-500），判断PMF时间从M6压缩到M3-M4——这个认知本周第一次系统化写入方法论文档。

**当前两站阶段定位：**
- astrologywiki.com：规模化期
- aistorygenerator.work：PMF确认期（技术SEO已完成，等外链和GSC反馈）

---

### 模块四：BRDECO 四站竞品调研（07-02）

为 GenGrowth 潜在B2B客户 BRDECO 完成四站竞调（brdecogroup.com / brdecomy.com / brdeco.jp / brdecosa.com），覆盖DR/关键词/流量渠道/社媒/转化漏斗/SOP适用性。

**最关键的业务洞察：B2B内容SOP无法直接套用。**

现有SOP对astrologywiki有效，根本原因是"内容无法被专业人士证伪"（星盘知识是解释型的）。BRDECO的目标读者是采购经理和建筑工程师，会核验λ值、防火等级、承载能力数字——写错一个专业参数，客户立刻失去信任。AI生成内容在这个场景的可行性只有10-40%，不同内容层级差异极大，必须加"技术数据注入层+SME审核"。这意味着如果GenGrowth服务B2B客户，产品形态和定价都需要重新设计。

**数据矛盾发现（方法论价值）：** BRDECO的Ahrefs有机流量上升，但SimilarWeb总访问量腰斩。两个工具数据方向相反不是矛盾——Ahrefs只量有机搜索，SimilarWeb量全渠道。BRDECO跌的是直接流量（老客户流失），不是搜索流量。这个分析框架可以复用到其他客户竞调中。

---

### 模块五：路径B冷启动行动计划（6/29起执行）

产出路径B两站（aistorygenerator.work / googledocsresumetemplate.com）上线后完整8任务执行计划，含Reddit发帖/HN Show HN/Product Hunt/GitHub Awesome List/工具目录/竞品外链抄作业/三层信息架构/GSC监控的逐步操作指引。

其中，aistorygenerator.work 的信息架构规划在6/30 Ahrefs实测后做了**重大修正**：原计划批量建 `/dnd` `/rpg` `/npc` 三级子目录，实测发现多数三级页候选词搜索量为0，且现有11个扁平结构的 `/rpg-tools/` 页已覆盖所有有量词。**推翻原计划，保持扁平结构**，避免无效重构URL。

---

### 模块六：路径B自动化建站系统 PRD（07-02）

将"ai story generator 建站时漏掉手动SERP核查"的执行教训转化为系统设计，产出5模块PRD：

- **Module 1**：每2小时监控 Google Trends Trending Now，量≥5万自动触发
- **Module 1.5**：人工场景分叉（≤5分钟）：占星角度→路径A astrologywiki写blog，工具化空间→路径B新站
- **Module 2**：自动验证（Volume/KD/KGR/SERP构成/意图分类），10分钟内产出验证报告
- **Module 3**：人工Go/No-Go（≤15分钟），只审核"⚠️待确认"词
- **Module 4**：自动建站（域名注册+内容生成+Cloudflare部署），目标≤30分钟上线

**核心设计原则：** 趋势词发现到上线≤48小时，否则竞争者涌入机会消失。

---

### 模块七：Reddit增长SOP + 三站发帖文案（07-02）

**Reddit SOP（v1.1，通用化）：** 覆盖astrologywiki + AI工具站 + 未来所有产品，包括账号预热节奏（前2周只评论/karma<100不发帖）、目标版块矩阵（占星类/AI类分别列出）、3类内容模板（知识科普/热点结合/工具推荐）、执行规范（账号隔离/每天上限1帖/链接后置）。

**三站发帖文案：** 覆盖 astrologywiki / aistorygenerator.work / googledocsresumetemplate.com 的 r/InternetIsBeautiful / r/DMAcademy / r/resumes 等核心版块，已写成非广告口吻的第一人称帖子，可直接交给素人账号发布。

---

### 模块八：博客外链资源库需求文档 v0.1→v0.3（07-03）

审核并修复6处逻辑问题（dofollow检测漏判rel=ugc/sponsored、DR配置矛盾、disappeared状态无触发机制、AI评论来源未说明等），同时根据cloudhu2000插件真实运行数据补充外链数过滤和页面AS字段。

**最重要的重构：删除 Module 4（测试提交）。** 原设计本系统提交测试评论后autoComment再次提交，同一站点被投放两次。修正后：本系统（Module 1-4）仅建库产出CSV，autoComment插件执行投放，投放结果回写数据库。

---

## ⚠️ 本周暴露的业务问题

**1. BRDECO调研暴露了GenGrowth SOP的适用边界：B2B不是当前SOP能覆盖的形态。**
如果GenGrowth下一阶段要扩展B2B客户，需要先把B2B版SOP设计清楚（技术数据注入+SME审核），而不是把现有工具搬过去。这是一个还没有答案的产品问题。

**2. aistorygenerator.work 博客外链自动化系统已启动，观察期开始。**
目前通过博客外链自动化系统以每天50条的节奏执行，计划观察3-4周后评估DR和链接数量变化。这也是该系统的首次实战验证——执行数据将直接反馈给需求文档的阈值校准（AS分布、外链数过滤等参数是否合理）。Reddit冷启动、HN、工具目录等渠道作为补充，在本轮观察期内同步铺开。

---

## 🎯 下周目标（W28）

### 本周计划中，能带来业绩的主要增长点是什么？

**aistorygenerator.work 外链冷启动** 是唯一能推动后续排名的杠杆。技术SEO已经做完，等的就是DR积累和GSC数据。

目标：W28完成 HN Show HN 发布（第一站）+ 工具目录提交前3个 + GitHub Awesome List 提PR（至少2个）。Reddit账号预热开始（前2周只评论不发帖，不急于这周带链接）。

### 有哪些新的想法待研究或待验证？

1. **博客外链自动化实验：50条/天的节奏，DR变化是否符合预期？** 这是aistorygenerator.work外链策略的核心验证——3-4周后需要有明确的判断标准：DR变化多少算有效？链接存活率多少算正常？现在应该先定好观察指标，而不是等数据出来再临时解读。

2. **hogwarts house quiz 的IP风险边界在哪里？** 这个词是路径B第二梯队，建站前需要确认：Warner Bros的DMCA/UDRP执法是否涉及测验类工具，还是只针对内容盗版。结论直接决定该词是否可以立项。

---

### 具体行动项

**AstrologyWiki**
- [ ] P2 面包屑：给开发排期，模板级一次全站生效
- [ ] 跟进 elephantjournal.com 审核状态
- [ ] Chakra/月亮仪式集群：GSC URL 逐一核实，未收录则重提交
- [ ] 产出工具落地页模板化设计规范 + SOP（覆盖结构、内链、FAQ、schema的标准化要求，供后续所有新落地页复用）
- [ ] 基于设计规范对现有落地页进行审改（moon-phase-today、astrocartography 等已上线页面对齐标准）
- [ ] 网站设计优化方向研究：通过页面结构/内容深度/交互设计提升用户停留时间（输出改进方案，交开发排期）

**aistorygenerator.work 外链冷启动**
- [ ] HN Show HN 发布（第一站）
- [ ] 工具目录提交：There's An AI For That / Toolify.ai / Futurepedia（前3个）
- [ ] GitHub Awesome List 提 PR（awesome-dnd / awesome-rpg，各1个）
- [ ] Reddit 账号注册，开始评论预热（不带链接）

**路径B首站（cursive generator）**
- [ ] 注册域名
- [ ] 查Expired Domain市场，评估老域名可行性
- [ ] 用 `2026-06-26-cursive-generator-资料收集.md` 生成H1-H6结构确认稿
- [ ] 生成完整 HTML/CSS/JS 页面，部署Vercel，提交GSC

**路径B自动化系统**
- [ ] 产研完成开发后，审核各模块验证逻辑是否合理：自动否决条件（超级平台/平均DR>70）是否会漏掉好词或放进坏词，误报/漏报标准是否与选词SOP一致

**遗留问题**
- [ ] googledocsresumetemplate.com 商标风险：确认替代域名
- [ ] hogwarts house quiz Warner Bros IP风险：查先例，判断边界

---

*本报告基于本周inbox文件回溯整理（pathB-launch-action-plan / homepage-schema-brief / aistorygenerator-heading-plan / 会议材料-产品立项 / brdeco竞品调研 / reddit-SOP / reddit发帖文案 / 路径B自动化PRD / 博客外链需求文档v0.3）*
*撰写日期：2026-07-03*
*下次更新：W28（2026-07-10 前后）*
