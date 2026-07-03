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

### 模块一：aistorygenerator.work — 技术SEO全面落地（6/30，全部上线）

**这是本周最重量级的执行成果。** 从方案设计到线上验收，全部在6/30单日完成。

**核心改动（已验收）：**

| 优先级 | 任务 | 状态 |
|---|---|---|
| P0 | `/ai-story-generator` 页面301重定向至首页（消除关键词蚕食） | ✅ 线上308验收通过 |
| P0 | 首页内置真正的生成器，默认即AI Story Generator | ✅ |
| P1 | 首页H1改为 `Free AI Story Generator`，H2结构全面改写（核心词密度提升） | ✅ |
| P1 | 首页H3删除"AI Story Generator"、`AI NPC Generator`→`NPC Generator` | ✅ |
| P2 | 全部11个RPG工具子页：补充What is/examples/Who for + Related tools横向内链 | ✅ 11/11 |
| P2 | NPC子页H1→`NPC Generator for D&D and Tabletop RPGs`（命中 npc generator 2000量/KD3） | ✅ |
| P3 | 新建 `/dnd-story-generator/`（250量/KD0，独立意图，已有页面无对应） | ✅ 200；接入nav/sitemap |

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

**1. 路径B的执行节奏有断层：选词决策快，建站启动慢。**
cursive generator 资料收集上周就完成了，但本周没有推进到建站。aistorygenerator.work在工程同事手里推进很快（6/30单日完成大规模SEO落地），说明问题不在技术侧，而在我这边——选词之后没有及时输出结构方案交接给工程侧。路径B每多等一天，沙盒期就晚开始一天。

**2. BRDECO调研暴露了GenGrowth SOP的适用边界：B2B不是当前SOP能覆盖的形态。**
如果GenGrowth下一阶段要扩展B2B客户，需要先把B2B版SOP设计清楚（技术数据注入+SME审核），而不是把现有工具搬过去。这是一个还没有答案的产品问题。

**3. aistorygenerator.work 外链建设还没有启动。**
技术SEO本周全部落地，下一个杠杆是DR——GSC点击数据要到M2-M3才有信号，但外链应该从D1就开始建，而不是等数据出来。Reddit冷启动、工具目录提交、HN Show HN这些动作还停留在计划阶段。

---

## 🎯 下周目标（W28）

### 本周计划中，能带来业绩的主要增长点是什么？

**aistorygenerator.work 外链冷启动** 是唯一能推动后续排名的杠杆。技术SEO已经做完，等的就是DR积累和GSC数据。

目标：W28完成 HN Show HN 发布（第一站）+ 工具目录提交前3个 + GitHub Awesome List 提PR（至少2个）。Reddit账号预热开始（前2周只评论不发帖，不急于这周带链接）。

### 有哪些新的想法待研究或待验证？

1. **买老域名是否值得用在cursive generator上？** 老域名可直接绕过3-4个月沙盒期（$100-500），而cursive generator竞争对手有新站7个月就排到第7（DR 0）——说明这个词不需要DR积累，但沙盒期仍然是时间成本。需要查一下Expired Domain市场上有没有cursive/font相关的老域名，以及费用是否合理。

2. **路径B PRD中，Module 1的Trending Now监控用PyTrends还是SerpAPI？** 官方API对自动化有限制，需要评估第三方方案的稳定性和成本，这是整个自动化系统的前置依赖，应该在产研评估前先有一个技术可行性结论。

---

### 具体行动项

**AstrologyWiki**
- [ ] P2 面包屑：给开发排期，模板级一次全站生效
- [ ] 跟进 elephantjournal.com 审核状态
- [ ] Chakra/月亮仪式集群：GSC URL 逐一核实，未收录则重提交

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
- [ ] PyTrends / SerpAPI 技术可行性确认（交产研）
- [ ] 准备可复用的建站模板仓库（Nuxt.js或已有框架）

**遗留问题**
- [ ] googledocsresumetemplate.com 商标风险：确认替代域名
- [ ] hogwarts house quiz Warner Bros IP风险：查先例，判断边界

---

*本报告基于本周inbox文件回溯整理（pathB-launch-action-plan / homepage-schema-brief / aistorygenerator-heading-plan / 会议材料-产品立项 / brdeco竞品调研 / reddit-SOP / reddit发帖文案 / 路径B自动化PRD / 博客外链需求文档v0.3）*
*撰写日期：2026-07-03*
*下次更新：W28（2026-07-10 前后）*
