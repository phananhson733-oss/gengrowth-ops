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

趋势 blog 继续驱动 UV 增长（↑49%），Arthur Fery 温网效应单周贡献 71 GSC 点击；两个核心实验均因技术障碍或样本问题受阻，技术修复成为下周首要阻塞项。

---

## 本周数据

数据口径：GSC 自定义区间 7/6–7/12；GA4 7/6–7/12 上午 5:00

### AstrologyWiki.com

**GA4 概览**

| 指标 | W28 | W27 | 环比 |
|------|-----|-----|------|
| UV（活跃用户） | **113** | 76 | ↑49% |
| PV（浏览次数） | 148 | 131 | ↑13% |

> ⚠️ PV 数据因 SPA 路由未修复严重失真，UV 数据相对可信。

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

**Arthur Fery 单周 71 点击、26.2% CTR**：温网男单半决赛（7/10）精准命中搜索意图，是 W27 以来趋势选题时机判断最强的正向验证。高 CTR 说明标题/摘要与用户搜索意图高度匹配，可复用此内容框架。

**Haaland 曝光 2,918 居全站首位，但点击率仅 1.3%**：排名 9.8（第一页底部）是核心瓶颈——曝光量充足，但点击阈值未到。需优化标题 + 摘要，或通过内链/外链推动排名进入前 5。

**lionel-messi-zodiac-sign（983 曝光 / 0.6% CTR）**：曝光量高但点击率极低，排名 6.3 处于第一页中下位置。曝光量说明 Messi 相关搜索需求持续存在，但 CTR 0.6% 意味着标题/摘要吸引力严重不足，是优化优先级较高的页面。

**其他产品：**（数据待补充）
- aistorygenerator.work：外链冷启动观察期，待 W28 结束 GSC 数据更新后补入
- googledocsresumetemplate.com：同上

---

## UV 增长机制与实验验证

W27 已验证趋势 blog 是当前主要 UV 来源。W28 在此基础上运行两个实验，结果如下：

---

### 实验一：生日倒计时内容能否制造双峰流量

**原定对象：Lamine Yamal（生日 7/13）**

**结论：实验本周无法执行，对象已更换，实验暂停至 8 月。**

| 核查项 | 结果 |
|--------|------|
| Yamal 页面 GSC 收录状态 | ✅ 已收录 |
| 7/3 后 GSC 曝光/点击 | ❌ 归零（共 9 天无数据） |
| 根本原因 | 排名过低，竞品 DR 碾压，页面内链权重不足 |
| 双峰实验可行性 | ❌ 基线段缺失，无对比依据 |

**更换对象评估：**

| 候选 | 生日 | 问题 |
|------|------|------|
| Ayo Edebiri | 7/18 | 刚收录，仅 9–10 日两天数据，基线不足 |
| Erling Haaland | 7/21 | 基线有但世界杯赛事变量无法剥离 |
| Harry Kane | 7/28 | 同上 |

**实验一暂停原因：** 现有文章库中，"非世界杯人物 + 近期有生日 + 文章有 ≥2 周 GSC 基线"三条件目前同时满足的对象不存在。

**重启计划：** 世界杯结束（7/19）后，优先考虑 **Karolína Muchová（8/21 生日）**——今日温网决赛后文章若立即发布，至 8/21 可积累约 40 天干净基线，且 8 月无大型网球赛事干扰，变量最少。

---

### 实验二：趋势 blog 能否在会话内转化为工具用户

**结论：数据不可信，实验本周无法评估。**

| 核查项 | 结果 |
|--------|------|
| SPA 路由修复 | ❌ 未完成 |
| 主要 blog 页 page_view 触发 | ❌ England vs Norway / Haaland / Vozinha 均为 0 PV |
| GA4 路径探索可用性 | ❌ 起点事件缺失，路径数据为空 |
| /dashboard 本周 UV | 11（确认有工具使用行为，但无法确认来源于 blog） |

**核心逻辑**：GA4 路径探索依赖起点 `page_view` 事件。SPA 路由未修复导致 blog 页面无 `page_view` 记录，即使用户完成了"blog → 工具"完整路径，GA4 也无法追踪。

**重启条件：** SPA 路由修复上线，blog 页面 `page_view` 正常触发后立即重跑。

---

## 本周工作重点

### CTA 架构升级

参考 UniFab 七层转化设计，完成 AstrologyWiki CTA 架构优化需求文档（v1.3），覆盖 A–K 共 11 个模块：

- **新增模块**：Right Sidebar 工具卡（G）、TOC（H）、相关文章×5（I）、右下角三按钮浮层（J）、左下角 Ask AI 面板（K）
- **关键决策**：底部横条覆盖范围限定为首页 + 工具页，Blog 文章页不显示
- **同步产出**：CTA Map CSV 从 7 行扩展至 46 行，补入完整 URL 注册表（工具页/Nav Tab/Blog 文章/外部 AI 链接）

### 趋势选题与内容策略

- Emmy 提名（第 78 届，7/8 公布）内容集群规划：Zendaya（T1）、Ayo Edebiri（T1，生日 7/18）、Quinta Brunson（T2）、Oscar Isaac（T2）、Mark Ruffalo（T2）
- 趋势词桥接分析：Djokovic vs Sinner → Sinner vs Zverev 温网决赛预测（7/13）；Spain vs Belgium → Spain vs France 世界杯半决赛（7/14）+ Mikel Merino birth chart

### 技术 SEO 诊断

确认 PV<<UV 根本原因为双重问题：① Next.js SPA 路由 client-side navigation 不触发 `page_view`；② 部分页面（Vozinha）GA4 script 未正常执行。两者需独立修复。

---

## 本周产出文件总览

| 日期 | 文件 | 类型 | 状态 |
|------|------|------|------|
| 07-09 | `00-inbox/2026-07-09-astrologywiki-cta架构优化需求.md` | 优化需求 | v1.3 Active |
| 07-09 | `00-inbox/2026-07-09-工具站内容转化设计洞察.md` | 洞察文档 | v1 Active |
| 07-09 | `00-inbox/astrologywiki-cta-map-updated.csv` | CTA 数据表 | 46 行，Active |

---

## 本周暴露的业务问题

**实验设计缺乏前置可测量性核查。**
实验一（Yamal 收录状态未预检）和实验二（SPA 路由修复未确认）均在启动后才发现数据不可采集。浪费了一个完整实验周期。

**建议 W29 起执行"实验前 Checklist"**：
- [ ] 实验对象 GSC 收录状态是否确认？
- [ ] 是否有 ≥2 周基线数据？
- [ ] GA4 相关事件是否正常触发（抽查 DebugView）？
- [ ] 是否存在外部变量（赛事/颁奖/重大新闻）会污染实验数据？

---

## 下周目标（W29）

### ⭐ 最高优先：SPA 路由修复

- [ ] **开发排期确认**：Next.js `router.events` 监听 + 手动触发 `page_view`，修复后实验二立即重启
- [ ] **Vozinha 页面排查**：确认 GA4 script 是否未加载（Console 报错检查）

### 内容

- [ ] Sinner vs Zverev 温网决赛预测文（决赛 7/13，今日内发布）
- [ ] Spain vs France 世界杯半决赛 astrology（7/14，提前 1 天发布）
- [ ] Mikel Merino birth chart（热度窗口 48 小时内）
- [ ] Emmy cluster 启动：Ayo Edebiri（生日 7/18，发布倒计时内容）
- [ ] Karolína Muchová birth chart（为 8/21 生日实验提前布局基线）

### 实验

- [ ] **实验一**：Muchová 文章发布后标注为基线起点，8/21 生日时观测双峰
- [ ] **实验二**：SPA 修复后配置 GA4 路径探索看板，定义标准转化路径 blog → `/en/birth-chart-calculator`
- [ ] **实验前 Checklist** 写入下周报告模板，作为标准化前置流程

### 外链 / 其他
- [ ] Haaland 页面内链补充（从 Kane/Arthur Fery 文章指向 Haaland），提升排名突破 1.3% CTR 瓶颈
- [ ] Yamal 页面内链补充（从 Haaland / Kane 指向 Yamal），推动重新排名
- [ ] aistorygenerator.work 外链冷启动 M1 节点评估（4 周 DR 变化核查）

---

*本报告基于 W28 GA4 + GSC 实测截图数据 | 撰写日期：2026-07-12 | 下次更新：W29（2026-07-19 前后）*
