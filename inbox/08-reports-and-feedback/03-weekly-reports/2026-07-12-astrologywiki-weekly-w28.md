---
project: astrologywiki + gengrowth
type: report
status: draft
owner: Ma Boyang
updated: 2026-07-12
---

# GenGrowth 运营周报 | 2026-W28

**项目：** AstrologyWiki 增长 + 路径B新站建设 + GenGrowth 方法论沉淀
**周期：** 2026-07-06 → 2026-07-12
**汇报人：** 马博洋

---

## 一句话摘要

单周发布 32 篇文章（全站最高产出）+ 完成 CTA 架构全链路设计；Arthur Fery 温网效应带动 GSC 单篇 71 点击、UV 环比 ↑49%；两个核心实验均因技术障碍或样本问题受阻，SPA 路由修复成为下周首要阻塞项。

---

## 本周数据

数据口径：GSC 自定义区间 7/6–7/12；GA4 7/6–7/12 上午 5:00

### AstrologyWiki.com

**GA4 概览**

| 指标 | W28 | W27 | 环比 |
|------|-----|-----|------|
| UV（活跃用户） | **113** | 76 | ↑49% |
| PV（浏览次数） | 148 | 131 | ↑13% |

> ⚠️ PV 数据因 SPA 路由未修复严重失真（多数 blog 页面显示 0 PV），UV 数据相对可信。

**GA4 Top Pages（按 UV 排序）**

| 页面 | PV | UV | 平均参与时长 |
|------|----|----|------------|
| /en/wiki/england-vs-norway-astrology | **0** ⚠️ | 19 | 35s |
| /en/wiki/erling-haaland-birth-chart | **0** ⚠️ | 14 | 48s |
| / | 6 | 13 | 2:12 |
| /en/wiki（列表页） | 44 | 12 | 40s |
| /dashboard（工具主页） | 12 | 11 | 24s |
| /en/wiki/arthur-fery-birth-chart | 6 | 5 | — |
| /en/wiki/vozinha-birth-chart | **0** ⚠️ | 8 | 21s |
| /en/wiki/erling-haaland-girlfriend-birth-chart | **0** ⚠️ | 5 | 26s |
| /en/wiki/bellingham-birth-chart | **0** ⚠️ | 5 | 1:09 |
| /en/wiki/angela-nikolau-birth-chart | 1 | 4 | 50s |
| **合计** | **148** | **113** | **1:37** |

**GSC Top 10（按点击数排序）**

| 页面 | 点击 | 曝光 | CTR | 排名 |
|------|------|------|-----|------|
| arthur-fery-birth-chart | **71** | 271 | **26.2%** | 3.5 |
| erling-haaland-birth-chart | 39 | 2,918 | 1.3% | 9.8 |
| vozinha-birth-chart | 33 | 203 | 16.3% | 4.0 |
| england-vs-norway-astrology | 31 | 319 | 9.7% | 6.5 |
| harry-kane-birth-chart | 18 | 1,377 | 1.7% | 4.7 |
| erling-haaland-girlfriend-birth-chart | 16 | 288 | 5.6% | 6.3 |
| angela-nikolau-birth-chart | 11 | 187 | 5.9% | 6.3 |
| folarin-balogun-birth-chart | 10 | 135 | 9.3% | 6.6 |
| messi-world-cup-record-astrology | 7 | 68 | 10.3% | 8.1 |
| lionel-messi-zodiac-sign | 6 | 983 | 0.6% | 6.3 |

**关键解读：**

**Arthur Fery 单周 71 点击、26.2% CTR**：温网男单半决赛（7/10）精准命中搜索窗口，文章于 7/7 发布，赛事前 3 天入库，实现趋势内容的完整提前布局。高 CTR 说明标题与用户搜索意图高度匹配，可作为趋势文内容框架标杆复用。

**Haaland 曝光 2,918 居全站首位，CTR 仅 1.3%**：排名 9.8 是核心瓶颈——曝光充足但排名在第一页底部，点击阈值未到。需优化标题/摘要，或通过内链推动排名进入前 5。

**Messi（983 曝光 / 0.6% CTR）**：搜索需求持续存在但点击率严重偏低，排名 6.3 本应有 3–5% CTR，实际仅 0.6%，标题/摘要吸引力是主要原因，优化潜在可带来约 30–40 次/周增量点击。

**其他产品：**（数据待补充）
- aistorygenerator.work：外链冷启动观察期，待 W28 GSC 数据更新后补入
- googledocsresumetemplate.com：同上

---

## UV 增长机制与实验验证

### 实验一：生日倒计时内容能否制造双峰流量

**原定对象：Lamine Yamal（生日 7/13）**

**结论：实验本周无法执行，对象已更换，实验暂停至 8 月。**

| 核查项 | 结果 |
|--------|------|
| Yamal 页面 GSC 收录状态 | ✅ 已收录 |
| 7/3 后 GSC 曝光/点击 | ❌ 归零（共 9 天无数据） |
| 根本原因 | 排名过低，竞品 DR 碾压，页面内链权重不足 |
| 双峰实验可行性 | ❌ 基线段缺失，双峰对比无法成立 |

**更换对象评估：**

| 候选 | 生日 | 问题 |
|------|------|------|
| Ayo Edebiri | 7/18 | 刚收录，仅 9–10 日两天数据，基线不足 |
| Erling Haaland | 7/21 | 有基线，但世界杯赛事变量无法剥离 |
| Harry Kane | 7/28 | 同上 |

**实验一暂停原因**：现有文章库中，"非世界杯人物 + 近期有生日 + 有 ≥2 周 GSC 基线"三条件目前同时满足的对象不存在。

**重启计划**：等世界杯结束（7/19）后，优先考虑 **Karolína Muchová（8/21 生日）**——文章已于 7/11 发布，至 8/21 可积累约 40 天干净基线，且 8 月无大型网球赛事干扰，变量最少。

---

### 实验二：趋势 blog 能否在会话内转化为工具用户

**结论：数据不可信，实验本周无法评估。**

| 核查项 | 结果 |
|--------|------|
| SPA 路由修复 | ❌ 未完成 |
| 主要 blog 页 page_view 触发 | ❌ england-vs-norway / haaland / vozinha 均为 0 PV |
| GA4 路径探索可用性 | ❌ 起点事件缺失，路径数据为空 |
| /dashboard 本周 UV | 11（有工具使用行为，但无法确认来源于 blog） |

**核心逻辑**：GA4 路径探索依赖起点 `page_view` 事件。SPA 路由未修复导致 blog 页面无 `page_view` 记录，即使用户完成"blog → 工具"完整路径，GA4 也无法追踪。

**重启条件**：SPA 路由修复上线，blog 页面 `page_view` 正常触发后立即重跑。

---

## 本周工作重点

### 模块一：内容生产（SEO Autopilot）✅

W28 共发布 32 篇文章，覆盖温网、世界杯、Emmy 三条内容线。Arthur Fery（7/7 发布）在温网半决赛（7/10）当周贡献 71 GSC 点击、26.2% CTR，是本周 UV 增长的主要贡献文章，验证了"赛事前 3 天提前发布"的选题节奏。

> ⚠️ **Mbappé 疑似重复发布**：`kylian-mbapp-birth-chart`（7/7）与 `kylian-mbappe-birth-chart`（7/8）两篇 slug 仅差一个字母，若内容重叠将导致关键词内部竞争。需排查后决定是否 301 合并。

---

### 模块二：CTA 架构升级 ✅

参考 UniFab 七层转化设计，完成 AstrologyWiki CTA 全链路架构：

- **优化需求文档** v1.3：11 个模块（A–K），覆盖首页 / 工具页 / Blog 页所有转化触点
  - 新增模块：Right Sidebar 工具卡（G）、TOC（H）、相关文章×5（I）、右下角三按钮浮层（J）、左下角 Ask AI 面板（K）
  - 关键决策：底部横条仅覆盖首页 + 工具页，Blog 文章页不显示
- **CTA Map CSV**：从 7 行扩展至 46 行，补入完整 URL 注册表（6 工具页 / 8 Nav Tab / 13 Blog 文章 / 5 外部 AI 链接）
- **工具站转化设计洞察**：对标 UniFab 七层逻辑完成 AstrologyWiki 现状 gap 分析

---

### 模块三：GenGrowth 产品与 SOP ✅

| 文件 | 内容 |
|------|------|
| 增长诊断功能评审报告 | gengrowth.ai/app/analysis 功能评审，判断当前形态是否达可推广标准 |
| BRDECO 胜任评估报告 | 基于 W27 竞调结论，输出 B2B 适配框架正式评估报告 |
| 数据工具分层使用规范 | GSC / GA4 / Ahrefs / SimilarWeb 使用场景与数据口径说明 |
| 工具落地页设计规范 SOP v1.0 | 工具页结构 / 内链 / FAQ / Schema 标准化模板 |
| 公司调研 Skill 更新提案 | company-survey skill 更新需求 |

---

### 模块四：社媒竞品自动化 ✅

完成**竞品账号近 24h 爆款内容自动抓取与分析**自动化需求草稿：
- 目标：每日从竞品分析 Sheet 读取 TikTok / YouTube 账号，识别近 24h 爆款，自动完成内容拆解写入 `video_analysis`
- 爆款判定：绝对门槛（播放量 ≥ 10,000）+ 相对门槛（≥ 同账号近 30 条中位数 3 倍）双轨命中
- 状态：Draft，待 PM 确认爆款阈值、运行时间与飞书通知方式

---

## 本周产出文件总览

| 日期 | 文件 | 类型 | 状态 |
|------|------|------|------|
| 07-06 | `00-inbox/2026-07-06-company-survey-skill-update-proposal.md` | 需求提案 | 待评估 |
| 07-07 | `00-inbox/2026-07-07-brdeco-胜任评估报告.md` | 评估报告 | Final |
| 07-07 | `00-inbox/2026-07-07-增长诊断功能评审报告.md` | 产品评审 | Final |
| 07-08 | `00-inbox/2026-07-08-数据工具分层使用规范.md` | SOP | Active |
| 07-09 | `00-inbox/2026-07-09-astrologywiki-cta架构优化需求.md` | 优化需求 | v1.3 Active |
| 07-09 | `00-inbox/2026-07-09-工具站内容转化设计洞察.md` | 洞察文档 | v1 Active |
| 07-09 | `00-inbox/2026-07-09-工具落地页设计规范-sop-v1.0.md` | SOP | v1.0 Active |
| 07-09 | `00-inbox/astrologywiki-cta-map-updated.csv` | CTA 数据表 | 46 行 Active |
| 07-11 | `social-media/2026-07-11-竞品账号近24h爆款自动分析-自动化需求草稿.md` | 自动化需求 | Draft 待确认 |
| 07-06~11 | SEO Autopilot 发布日志 | Blog 文章 | **32 篇已上线** |

---

## 本周暴露的业务问题

**1. 实验设计缺乏前置可测量性核查。**
实验一（Yamal 收录/排名未预检）和实验二（SPA 路由修复未确认）均在启动后才发现数据不可采集，浪费一个完整实验周期。建议 W29 起每个实验启动前执行"数据可测量性 Checklist"。

**2. Mbappé 文章重复发布，存在关键词内部竞争风险。**
`kylian-mbapp-birth-chart`（7/7）与 `kylian-mbappe-birth-chart`（7/8）两篇文章 slug 高度相似，若内容重叠将导致同一关键词两篇页面互相压制。需排查内容差异并决定是否合并。

---

## 下周目标（W29）

### ⭐ 最高优先：SPA 路由修复

- [ ] 开发排期确认：Next.js `router.events` 监听 + 手动触发 `page_view`，修复后实验二立即重启
- [ ] Vozinha 页面排查：确认 GA4 script 是否未加载（Console 报错检查）

### 内容

- [ ] Emmy cluster 启动：Ayo Edebiri（生日 7/18 + Emmy 提名）——生日前发布倒计时内容
- [ ] 世界杯 SF 跟进：Norway/England vs Argentina/Switzerland 半决赛（7/15）相关球员/赛事内容
- [ ] Messi zodiac sign 标题优化：983 曝光 / 0.6% CTR，改标题/摘要可释放约 30–40 次/周点击增量

### 实验

- [ ] **实验一**：Muchová 文章（7/11 已发布）作为基线起点，监控收录与排名情况，8/21 生日时观测双峰
- [ ] **实验二**：SPA 修复后配置 GA4 路径探索，定义标准转化路径 blog → `/en/birth-chart-calculator`
- [ ] 实验前 Checklist 纳入标准流程（收录状态 / 基线天数 / GA4 事件触发 / 外部变量排查）

### 内链与排名提升

- [ ] Haaland 文章补充内链，推动排名从 9.8 进入前 5，突破 1.3% CTR 瓶颈（2,918 曝光待释放）
- [ ] Yamal 页面：从 Haaland / Kane 文章加内链，推动重新进入有效排名
- [ ] Mbappé 重复文章：确认是否合并，保留权重较高的 slug，另一篇 301 重定向

### 其他

- [ ] 竞品社媒自动化需求草稿待 PM 确认爆款阈值与通知方式
- [ ] aistorygenerator.work 外链冷启动 M1 节点评估（4 周 DR 变化核查）

---

*本报告基于 W28 GA4 + GSC 实测截图数据、SEO Autopilot 发布日志、inbox 文件清单 | 撰写日期：2026-07-12 | 下次更新：W29（2026-07-19 前后）*
