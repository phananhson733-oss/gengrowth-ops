---
project: astrologywiki + gengrowth
type: report
status: final
owner: Ma Boyang
updated: 2026-06-12
---

# 📊 GenGrowth 运营周报 | 2026-W24

**项目：** AstrologyWiki 增长实验 + GenGrowth.ai 增长实验启动
**周期：** 2026-06-09 → 2026-06-12
**汇报人：** 马博洋

---

## 一句话摘要

本周双线并行：AstrologyWiki 外链追踪体系升级至 v1.1、完成 103 篇全站 SEO 审计、识别世界杯趋势词窗口并完成 10 词完整预处理；GenGrowth.ai 完成 Day 0 诊断基线建立，1,099 词关键词池全量计算 SERP 弱度与 DR 均值，增长实验正式启动。下周重心是**世界杯系列 P1 立即开写（窗口只剩 37 天）+ GenGrowth Week 1 执行词单落地**。

---

## ✅ 本周进展

### 项目一：AstrologyWiki

#### 外链体系

- **SOP 升级至 v1.1**（`2026-06-05-backlink-outreach-sop-v1.1.md`）：新增均分DR筛选框架（均分DR = DR ÷ Dofollow 链接域名数），4段阈值：DR 0–30 ≥0.06 / DR 30–50 ≥0.05 / DR 50–70 ≥0.03 / DR 70+ ≥0.02；将此指标纳入付费外链准入门槛
- **Guest Post 开发信全量完成**（`2026-06-11-guest-post-pitch-emails.md`）：15 封直发邮件草稿 + 6 封表单提交模板 + 5 个前置动作站点；每封信按 SOP 四作者人设分配，邮件主题行按各站点要求定制
- **外链追踪表更新**（`外链追踪表 - Guest post站点追踪表.csv`）：44 行记录全量维护
  - 已发布外链：peerlist.io (1 nofollow) / saashub.com (1 dofollow) / are.na (2 dofollow) / castle.xyz (1 dofollow) / news.ycombinator.com (1 nofollow) = **本周新增 6 条**，累计 dofollow 3 条
  - 联系中等待回复：13 个站点（含 askastrology / instyle / thewrap / earthsky 等高质量目标）
  - 付费外链决策待处理：commonreplies.com $20（均分DR 0.060，刚过线，需核验流量）/ codesupply.co $100（均分DR 0.086，通过，已回复，待确认）/ technology.org $240（Dofollow linked domains 未知，需补充均分DR核算）
  - 拒稿：contiki.com（旅游类，相关性太低）
  - 已接受等待发布：elephantjournal.com（直接发帖，下周完成）
- **下周已排期：** 6月15日前 — elephantjournal 帖子发布 + codesupply $100 确认回复

#### SEO 技术审计

- **全站 103 篇文章审计完成**（`2026-06-10-astrologywiki-seo-fix-checklist.md`）：
  - FAQ 缺失：4 篇（PG-TRANS-004/005 + chakra-system-overview + four-element-framework）— 缺少 FAQ 结构，影响 Featured Snippet 争夺
  - H1 缺少目标关键词：2 篇（chakra-system-overview / four-element-framework）
  - At-a-glance 速览框：103 篇全部合格，无需处理
  - 作者署名与日期：全部齐全，无需处理
  - **结论：问题集中在 4 篇文章，修复优先级低，本轮不影响外链和趋势词产能**

#### 世界杯趋势词

- **识别 World Cup 2026 × Astrology 趋势词窗口**：今日（6月12日）世界杯开赛，窗口期至 7月19日，共 37 天
- **主题集群表新增 `worldcup2026_astro` 集群**（`gengrowth-flow-mvp — v3.3 迁移副本 - 主题集群表 (1).csv`）：P1 / Week 1 / 10篇
- **选题登记表新增 10 行**（PG-WC-001 至 PG-WC-010）：Pillar + 5 球星星盘 + 1 球队 + 2 娱乐/数据 + 1 日历
- **10 词完整预处理完成**（`2026-06-12-10词世界杯预处理brief.md`）：Entity / Friction / Logic / Content_Angle 四字段全量输出，含 SERP 搜证
  - 关键技术修正：Jupiter 在 2026年6月世界杯期间为 **Cancer（exalted）**，非 Gemini；Saturn 为 Aries；所有文章论点已基于正确行星位置建立
  - 3 个词（zodiac signs as world cup teams / best soccer players zodiac sign / world cup 2026 june astrology）SERP 几乎空白，**确认内容空缺，发布即可排名**

---

### 项目二：GenGrowth.ai（新增）

- **增长实验正式启动**（`gengrowth-growth-experiment-2026-06.md`）：实验周期 2026-06-09 → 2026-08-09（60天），负责人 Lynne，核心目标：非品牌自然搜索流量 + 注册数
- **Day 0 诊断基线完成**：
  - 可对标竞品：rankyfy.com（DR 14）+ ethicalseo.io（DR 30），差距均 ≤ 30
  - 竞品内容空白区确认：Growth experiment / Attribution tracking / Growth automation / Solo founder tools → 三大话题竞品零覆盖，是新站切入口
  - 主要竞品 outrank.so / okara.ai / aeoengine.ai 全量拆解完成

- **关键词池建设完成**：
  - 去重：1,183 词 → **1,099 词**（移除 84 个重复词）
  - CPC 填充：**740/1,099 词（67%）** 有 CPC 数据；359 词来自无 CPC 列的导出文件，需重新导出
  - Top10最低2站DR均值：**1,098/1,099 词**全量填充（1 词 SERP 结果 <2 条，无法计算）
  - SERP 弱度：✅弱 **205 词（19%）**/ ⚠️中 **779 词（71%）**/ ❌强 **115 词（10%）**

- **增长策略锁定**：
  - 快速胜利（60% 产能）：KD<20 + Vol≥100，主攻 SaaS SEO / Growth Tools 赛道
  - 长尾矩阵（40% 产能）：4 条集群线（SEO for [industry] / [tool] alternatives / growth tactics / tracking）
  - 战略词门面：`best seo management software` + `best seo tracking software`
  - 趋势词：`best seo metric software` / `new website seo strategy` / `saas seo guide`

- **Week 1 执行词单锁定（6 词，全部已验证）**：

  | 关键词 | KD | Vol | SERP弱度 | DR均值 |
  |---|---|---|---|---|
  | agency rank tracking | 3 | 4,200 | ✅弱 | 11.5 |
  | how to do seo yourself | 5 | 1,300 | ✅弱 | 36.0 |
  | technical seo audits | 3 | 1,200 | ✅弱 | 47.5 |
  | enterprise saas seo | 2 | 1,100 | ✅弱 | 32.5 |
  | seo for technology companies | 0 | 1,000 | ✅弱 | 27.5 |
  | seo agency management software | 3 | 1,000 | ✅弱 | 31.5 |

- **Ahrefs 导出准备**：分批文件已生成（batch1.txt 1,000词 / batch2.txt 99词），快速胜利词优先

---

## ⚠️ 待解决问题

| 问题                          | 影响                                                           | 拟解决时间                                                    |
| --------------------------- | ------------------------------------------------------------ | -------------------------------------------------------- |
| 世界杯系列 10 篇文章未写              | 窗口只剩 37 天，Mbappé/Messi/Ronaldo/Yamal 球星词搜索量正处于本轮峰值           | **今明两天 P0**，从 Pillar + 4 球星词开始                           |
| GenGrowth Week 1 词单未执行      | 实验已启动但无内容产出，Day 14 目标依赖本周开始生产                                | 下周开始写作，每天 5–10 篇                                         |
| CPC 缺失 359 词                | 关键词优先级计算缺 ROI 维度                                             | 需重新从 Ahrefs 导出 rankyfy.com + ethicalseo.io 的关键词，勾选 CPC 列 |
| codesupply.co $100 待确认      | 2 条 dofollow，均分DR 0.086，已通过筛选，回复延迟可能导致机会丢失                   | 下周二前回复 outreach@codesupply.co                            |
| elephantjournal.com 帖子未发布   | 已拿到直发权限，dofollow 链接等待发布                                      | 2026-06-15 前完成                                           |
| technology.org $240 均分DR未核算 | Dofollow Linked Domains 数据缺失，无法判断是否通过均分DR门槛，$240 金额较高，不应盲目接受 | 下周查询补填后再决策                                               |
| 4 篇文章缺 FAQ                  | Featured Snippet 竞争弱化                                        | 排在世界杯系列和 GenGrowth 之后，W25 处理                             |

---

## 🎯 下周目标（三条主线）

### 主线一：世界杯趋势词立即执行（P0，窗口倒计时）
- [ ] **今明两天**：PG-WC-001 支柱文章 + PG-WC-002 Mbappé + PG-WC-003 Messi + PG-WC-004 Ronaldo（搜索量最高，竞争最低）
- [ ] **本周内**：PG-WC-005 Yamal + PG-WC-006 Vinicius + PG-WC-007 Argentina + PG-WC-010 June Astrology
- [ ] **本轮最后**：PG-WC-008 zodiac-to-team（娱乐向，需配可视化）+ PG-WC-009 数据分析文章
- [ ] 所有文章正文内部链接回 PG-WC-001 支柱文章

### 主线二：GenGrowth Week 1 执行启动
- [ ] 按 6 词词单开始内容生产，每天 5–10 篇（60天实验要求 500 篇总产出）
- [ ] 建立数据追踪 Sheet（增长实验文件中"待建立"项）
- [ ] Ahrefs 补充导出：rankyfy.com + ethicalseo.io，需包含 CPC 列，填补 359 词空缺

### 主线三：外链清账
- [ ] 回复 codesupply.co 确认 $100 插入（截止下周一）
- [ ] elephantjournal.com 帖子发布（2026-06-15 前）
- [ ] 查 technology.org 的 Dofollow Linked Domains 数据，算均分DR，再决定是否接受 $240
- [ ] 核验 commonreplies.com 月流量（Semrush >5,000 才接受 $20 外链，且确认链接非 Sponsored 标签）

---

## 🧘 个人体会

**双项目并行的节奏感比预期好。** AstrologyWiki 的外链体系已经有了自己的运转节奏，不需要每周从零建立——追踪表在转，邮件在发，这周的主要精力可以分给 GenGrowth 的诊断工作。两个项目的方法论是同一套，复用成本很低。

**世界杯趋势词是这个季度最值得抓的短期机会。** 10 词预处理都已经做好了，Logic 和 Content_Angle 里有足够的差异化角度，现在的阻力只有"写"这个动作本身。球星词（Mbappé/Messi）的 SERP 竞争者全是数据展示页，没有机制叙述——只要写出来就是当前 SERP 的天花板，这种机会不多见。

**GenGrowth 的内容空白区非常清晰。** 三个竞品对 "growth experiment"、"attribution tracking for startups"、"solo founder growth tools" 的覆盖率是零。新站的打法就应该是从竞品忽视的角度切入，而不是正面硬刚 DR 70+ 的头部词。Week 1 词单都是 KD≤5 的快速胜利词，先让 GSC 看到数据，再谈规模扩张。
