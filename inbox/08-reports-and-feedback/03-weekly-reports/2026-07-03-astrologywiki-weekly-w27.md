---
project: astrologywiki + gengrowth
type: report
status: final
owner: Ma Boyang
updated: 2026-07-03
---

# 📊 GenGrowth 运营周报 | 2026-W27

**项目：** AstrologyWiki 增长实验 + 路径B新站启动 + 外链资源库自动化
**周期：** 2026-06-29 → 2026-07-03
**汇报人：** 马博洋

---

## 一句话摘要

本周没有大量新产出，重心在质量审核和方向校正：路径B选词通过 Ahrefs 截图验证发现 omegaverse quiz 流量锁死问题（降级放弃），确认 cursive generator 作为首站；域名注册暴露商标风险（googledocsresumetemplate.com 有 UDRP 隐患）；博客外链需求文档从 v0.1 审核到 v0.3 完成三轮修复，核心重构是删除"测试提交"模块——其逻辑与 autoComment 插件重复。

---

## ✅ 本周产出文件总览

| 日期 | 文件 | 类型 | 状态 |
| --- | --- | --- | --- |
| 06-29 | `03-content-briefs/2026-06-25-astrocartography-map-generator-moon-phase-today-landing-pages.md` 审计 | 落地页审核 | Final |
| 06-29 | `02-keyword-research/2026-06-26-路径B选词汇报.md` SERP 数据修正 | 选词汇报 | Final（v2） |
| 07-03 | `00-inbox/2026-07-03-博客外链资源库自动化系统-需求文档.md` | 需求文档 | v0.3 Final |

---

## ✅ 本周进展

### 模块一：AstrologyWiki 落地页审计（moon-phase-today + astrocartography）

两个页面 P-1 渲染 bug 已修复，内链已落实，结构基本达标。发现一个执行问题：内链集中出现在同一段落（2-3个同时出现），建议改为首次出现时植入、不重复链接。已同步修复方案。

---

### 模块二：路径B选词 SERP 修正 + 关键方向校正

**本周最重要的判断翻转：**

初始 WebSearch 数据存在明显误差（DR 值错误，漏掉关键竞品），用 Ahrefs 截图重新验证后，发现两个关键结论：

**结论1：omegaverse quiz 流量结构锁死，放弃。**
Quotev 单页面独占 65,600/月搜索流量，SERP 第二名（专站）仅 460/月。这不是"竞争激烈"，而是流量结构性锁死——即使排名第 2，实际流量接近零。类似 Reddit/YouTube 独占的词型，不适合单站建设。降级为"不建议立项"。

**结论2：cursive generator 确认首站，技术门槛几乎为零。**
SERP 第7名（fontageneratorpro.com）DR 为 0，建站仅 7 个月（2025年11月），验证了该位置是纯内容+工具质量竞争，无权重壁垒。优先级确认为最高。

**最终路径B建站优先级：**
1. cursive generator（首站，建站素材已备好）
2. hogwarts house quiz（待确认 Warner Bros IP 风险）
3. ai story generator
4. google docs resume template（域名商标风险待解决）

---

### 模块三：域名注册 + 商标风险

注册了 `aistorygenerator.work` 和 `googledocsresumetemplate.com`。

`googledocsresumetemplate.com` 存在 UDRP 风险——"Google Docs"是 Google 注册商标，Google 有向 ICANN 申请争议仲裁的惯例，域名可能被强制转移。已明确不在该域名上建站，需更换为不含商标词的替代方案（gdocsresumetemplate.com / resumetemplategdocs.com 等）。

---

### 模块四：哥飞框架对齐

将路径B选词策略与哥飞实战手册逐项比对，结论：核心框架（单站单词、Volume ≥30K、KD ≤29、KGR<0.25）执行一致；主要偏差是选了平稳词而非上升词。这是有意识的取舍——工具类词 CPC 偏低导致 SEO 主流不覆盖，形成结构性盲区，比哥飞框架偏好的"时间窗口竞争"更确定。

---

### 模块五：博客外链资源库需求文档 v0.1 → v0.3

完成文档审核并修复6处问题（dofollow 漏判 rel=ugc、DR 配置矛盾、disappeared 无触发机制、AI 评论内容来源未说明等），同时根据 cloudhu2000 插件真实数据（blog_run_stats CSV）补充了外部链接数过滤（>2000 丢弃）和页面 AS 字段。

**最大的结构性修改：删除 Module 4（测试提交）。**
原设计是本系统提交测试评论验证站点是否通过审核，但这与 autoComment 插件的功能完全重叠——同一个站点会被提交两次评论，一次用测试账号、一次用正式账号，逻辑冲突。修正后：本系统（Module 1-4）仅负责建库产出 CSV，autoComment 插件负责投放，投放结果回写数据库。

---

## ⚠️ 本周暴露的业务问题

**1. SERP 数据不能用 WebSearch 验证，必须截图或 API。**
本周 omegaverse quiz 的流量锁死结论，靠的是 Ahrefs 截图而非 WebSearch——后者给出的 DR 值系统性偏高（LingoJam 写 DR 72，实际 38；gdoc.io 写 DR 76，实际 47），会导致选词判断失真。选词汇报今后必须以 Ahrefs 截图或 DataForSEO 数据为准，不依赖搜索结果摘要。

**2. 路径B已有两个注册域名，但首站建设还未启动。**
cursive generator 资料收集已在上周完成，域名 `aistorygenerator.work` 已注册，但 cursive generator 对应域名（cursivegenerator.co 或类似）还未注册，页面代码也未生成。域名注册和建站之间出现了断层——本质是"选词/研究"和"执行/上线"两个阶段之间缺乏推进机制，容易停在准备阶段。

**3. astrologywiki 常青词排名仍在 65-78 位，0 点击，外链效果未释放。**
这个问题上周已记录，本周无新进展。当前唯一行动是等待7-9月权重释放窗口，但没有中间验证节点——如果8月底仍无改善，是追加外链还是转向其他词型，目前没有决策框架。

---

## 🎯 下周目标（W28）

### 本周计划中，能带来业绩的主要增长点是什么？

**cursive generator 首站上线**是唯一有直接业绩价值的动作。其余事项（面包屑排期、外链系统开发启动）属于基础建设，不直接产生流量。

目标：W28 内完成 cursive generator 页面（HTML/CSS/JS），绑定域名，提交 GSC，完成首次站内测试。

### 有哪些新的想法待研究或待验证？

1. **hogwarts house quiz 的 IP 风险边界是否可量化？** Warner Bros 的 UDRP/DMCA 执法历史是否涉及到工具/测试类页面，还是主要针对内容盗版？如果仅是名字使用而非版权内容，风险是否可控？需要查一个先例。

2. **评论外链系统中 autoComment 插件的导入格式是否已知？** 如果格式已定义，本系统的数据库字段应现在就对齐，而不是开发完了再改。需要读插件源码或测试一次导入。

---

### 具体行动项

**AstrologyWiki**
- [ ] P2 面包屑：给开发排期，模板级一次全站生效
- [ ] 跟进 elephantjournal.com 审核状态
- [ ] Chakra/月亮仪式集群：GSC URL 逐一核实，未收录则重提交

**路径B首站**
- [ ] 注册 cursive generator 域名
- [ ] 用 `2026-06-26-cursive-generator-资料收集.md` 生成 H1-H6 结构确认稿
- [ ] 生成完整 HTML/CSS/JS 页面代码
- [ ] 部署 Vercel，绑域名，提交 GSC

**外链资源库**
- [ ] 读 autoComment 源码，确认导入 CSV 字段格式，对齐数据库 schema
- [ ] 确认是否启动开发，排期给同事

**遗留问题**
- [ ] googledocsresumetemplate.com 商标风险：确定替代域名
- [ ] hogwarts house quiz IP 风险调研

---

*本报告基于本周对话记录回溯整理（落地页审计 / 路径B SERP修正 / 域名策略讨论 / 哥飞框架对齐 / 外链需求文档 v0.1→v0.3）*
*撰写日期：2026-07-03*
*下次更新：W28（2026-07-10 前后）*
