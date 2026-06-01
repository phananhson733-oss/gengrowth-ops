---
project: astrologywiki
type: execution-plan
status: draft
owner: wzb
based_on: 2026-06-01-astrologywiki-feedback-review-response.md
source_req: 2026-05-31-astrologywiki-product-feedback.md
updated: 2026-06-01
---

# AstrologyWiki SEO 执行 Plan 与优先级

> 基于 `2026-06-01-astrologywiki-feedback-review-response.md`（Claude + Codex 双模型 review）定稿。
> 优先级即 Wave 顺序：**先解决"治不治得了病根"，再排"做什么"。**

---

## 决策记录

| 编号 | 决策 | 结果 | 影响 |
|---|---|---|---|
| **D1** | 作者真实性方向 | **披露式 persona** | 需求1 作者页可做，但须加披露 + bio 红线 + 外展解耦 |
| **D2** | 主 KPI | **DR → 收录数 + 非品牌自然点击** | DR 降为观察指标，不作核心目标 |

### D1 残留风险与强制缓解（披露式 persona 的前提条件）

披露式 persona 用于**站内署名**可接受，但**用作 guest post / Digital PR 的真人身份会构成身份误导**，披露解决不了这部分。因此：

**1. 作者页必须披露（每页固定位置）**
- 示例：「Elena Vane is an editorial persona representing AstrologyWiki's [focus] voice; articles under this byline are produced by our editorial team.」

**2. Bio 红线——可写 / 不可写**
- ✅ 可写：擅长领域、写作视角、栏目定位、内容理念（角色"人设"）
- ❌ 不可写：真实学历、认证资质、从业年限、客户/咨询经验、真实媒体供稿经历、真实地理位置、可被核验的社交身份
- 头像：用插画 / 明显非真人，或标注 illustration / AI，**不得用真人照片冒充**

**3. 外展身份解耦（关键）**
- 站内署名 = persona（披露式）
- 对外 guest post / PR pitch = **品牌 / 编辑部名义**，或**真人**——**不以 persona 假装真人**去外展

---

## 优先级总览

| Wave | 内容 | 裁决 | 依赖 |
|---|---|---|---|
| 0 | 决策 + 零成本收录诊断 | 必做，最前 | 无 |
| 1 | OG/封面图、sitemap 自动化、真实信任页 | 零风险立即做 | 无 |
| 2 | 作者页(披露式)、内链架构、结构化数据 | 取决于 Wave 0 | D1 已定 |
| 3 | 外链引擎、合规嵌入工具、Digital PR | 持续，真正驱动 DR | Wave 1-2 就位 |

---

## Wave 0 — 决策 + 零成本诊断（本周）

- [x] **D1** 作者方向 = 披露式 persona（已定）
- [x] **D2** KPI = 收录数 + 非品牌自然点击（已定）
- [ ] **收录根因诊断**（零成本，阻塞 Wave 2 内容判断）：
  - GSC Page indexing：区分 `Discovered - currently not indexed` vs `Crawled - currently not indexed`（病因完全不同）
  - 服务器日志：Googlebot 是否抓 sitemap 和新 URL
  - sitemap 校验：返回 200、XML 合法、canonical 一致、URL 绝对路径、无 noindex/robots 阻挡

---

## Wave 1 — 零风险立即做（1-2 周）

> 不依赖任何决策，纯收益，先落地。

1. **需求5｜封面图 + OG/Twitter Card + WebP 压缩**
   - 定位：**分享展示 / CTR / Pinterest**，**不是** DR 杠杆
   - 验收：OG 标签齐全、主流平台分享卡片正确、图 ≤200KB、含 Alt
2. **需求2-A｜sitemap 自动化**（✂️ 砍掉 Google Indexing API）
   - sitemap 发布即更新 + 正确 `lastmod` + robots.txt 声明 sitemap
   - 接 **IndexNow**（Bing/Yandex）替代不合规的 Indexing API
   - 验收：新文章 24h 内进 sitemap、GSC 重新提交、日志见 Googlebot 抓取
3. **真实信任页**（E-E-A-T 真实地基）
   - About / Editorial policy / Correction policy / AI disclosure / Contact / Methodology

---

## Wave 2 — 取决于 Wave 0 决策（2-4 周）

1. **需求1｜作者页（披露式 persona）**——严格按上方 D1 缓解三条执行
   - 每位作者独立 URL + 披露文案 + 合规 bio + 非真人头像
   - 文章页头署名可点击跳转
2. **需求6｜内链管理 + 架构**
   - 编辑器搜索插入站内链接 + 自定义锚文字
   - 补架构：topic clusters / hub-spoke / breadcrumbs / orphan 检测 / canonical 冲突检测
3. **结构化数据**（原需求7，文档未展开，但比作者页更直接影响收录）
   - Article / FAQ schema

---

## Wave 3 — 外链引擎（持续，真正影响 DR）

> 文档最大缺口：写满"为外链做准备"，却没有"怎么拿外链"。

1. **外链获取动作计划**——DR 的唯一驱动；需独立排期（来源清单、动作、节奏、合规边界）
2. **需求4｜可嵌入工具（合规形态）**
   - 回链**可见 + 品牌化 + 自然锚文本**（Powered by AstrologyWiki）+ **可选** dofollow
   - **不**强制 dofollow、**不**用关键词锚文本、**不**藏 footer
   - 工具先得真有用，再谈链接
3. **Digital PR 资产策略**——让别人**主动引用**（原创数据 / 计算器结果 / 图表 / 研究），而非发邮件求链接
   - 外展以**品牌/编辑部**或**真人**名义（见 D1 解耦）

---

## 成功指标（替代 DR）

- 收录的**有价值**页面数（不是总页数）
- **非品牌**自然曝光与点击（GSC）
- 关键词排名分布（进前 30 / 前 10 的数量）
- referring domains 的**质量**（不是数量）
- 新文章平均收录时长

DR 仅作**观察指标**，不作核心目标。

---

_依据：Claude Opus 4.8 + OpenAI Codex 双模型 review（见 based_on）。D1=披露式 persona、D2=KPI 转向，已记录。状态：draft，待团队确认排期与 owner。_
