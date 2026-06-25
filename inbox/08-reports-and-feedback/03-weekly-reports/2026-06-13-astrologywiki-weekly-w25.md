---
project: astrologywiki + gengrowth
type: report
status: final（补记）
owner: Ma Boyang
updated: 2026-06-24
---

# 📊 GenGrowth 运营周报 | 2026-W25

**项目：** AstrologyWiki 增长实验 + GenGrowth.ai 增长实验
**周期：** 2026-06-13 → 2026-06-19
**汇报人：** 马博洋

> **说明：** 本周报原应于上周期末完成，遗漏后于2026-06-24补记。内容基于vault内该周期实际产出文件回溯整理（git提交记录 + 6份当周文件），非现场记录，如有遗漏以vault原始文件为准。

---

## 一句话摘要

本周AstrologyWiki完成Day 23阶段复盘（127篇/87%收录率，Top50词85个但其中52个是趋势词、真实常青词积累仅33个），并确认**DR=0权威赤字是当前排名/点击的共同天花板**，据此启动外链建设+站点整合两步走方案；同期完成16篇未收录页面审计、5篇GSC点击优化诊断、B2内容裁决分析。GenGrowth.ai Week 1正式开始内容生产，6/16-6/17完成white_label_seo + agency_rank_tracking两个P0集群共7篇全部LIVE。**核心结论：两个项目都到了"内容量已够、权威跟不上"的阶段，下阶段重心从"产量"转向"外链+存量优化"。**

---

## ✅ 本周进展

### 项目一：AstrologyWiki

#### Day 23 阶段复盘（6/14，对照Day 14/30原定目标）
- 内容发布127篇，收录率87%（111/127），Day 30目标（140篇）预计达标
- Top 50关键词85个，远超Day 30原定目标（60个），但拆解后：趋势词（世界杯+行星过境）52个 vs 常青词33个——**真实SEO积累水位是常青词33个**，趋势词将在7月19日世界杯结束后大幅缩减
- 非品牌Impressions 2,457（近28天），落后于原计划（Day 14目标2,000+，实际延迟9天达到）
- 非品牌Clicks仅10次——数学上受限于常青词排名47-87位对应的CTR天花板（0.2-0.5%），非策略失误
- 识别两个集群系统性索引失败：Chakra + 月亮仪式，共11篇0收录，原因为URL/技术配置问题
- 识别4个积极信号：Google Sitelinks出现（多个博客页被识别为站点入口）/ 多语言自然流量自然扩散（丹麦语、西语）/ Wikipedia替代效应（bharani-nakshatra、solar-return）/ HSP集群低投入高回报（3篇贡献10个Top 50词，单页词密度最高）
- 已修正Day 30/60目标，新增"常青词单独追踪"维度（原60个目标拆分为常青45/趋势退潮后≥50）

#### 16篇未收录页面审计（6/13）
- 2篇已被Google抓取但拒收（内容质量/差异化不足）、14篇Google完全未发现（内链不足+sitemap可能未更新）
- 全部16篇共性问题：缺H3标题（仅H1+H2，层级扁平）、H2有AI模板生成痕迹（语法错误、首字母小写等）
- 逐篇输出优化方案并排序优先级（满月相关页面因时效窗口紧迫被列为🔴立即处理）
- 16篇修复已上线（PR #155）

#### SEO权威建设方案评审（6/14）
- 确认核心诊断：**DR=0是收录与排名的天花板，on-page优化已到边际效益拐点**，继续堆内容是净负面（140篇/333 URL，权威撑不住这个量）
- 提出双轨方案：
  - **方案A（外链/权威建设）**：地基层（品牌实体信号、目录收录）→ 可引用资产（2026占星历、时效新闻借势）→ 主动外联（HARO/客座投稿/资源页niche edit），12周目标DR从0拉到5-10+
  - **方案B（站点整合）**：`/wiki`无前缀301修复（实测canonical错误指向首页）、house并行URL去重、对约245个0曝光页面逐一improve/merge/prune裁决
- 待决策前置问题（未拍板）：① 作者真实性（站内虚构persona限制客座投稿等off-page手段，存在E-E-A-T风险）② 站点整合裁撤力度（保守~10-15篇 vs 激进~60-80篇）③ 是否暂停净新增发布2-4周

#### 5篇Blog GSC点击优化诊断（6/16）
基于近28天GSC实测数据，逐篇定位"排名尚可但点击转化不足"型快赢机会：

| 页面 | 当前排名 | 核心问题 | 优化动作 |
|---|---|---|---|
| July 2026 Planetary Transits | 6.1 | CTR仅1.4%（应3-5%），Title过长 | 重写Title/Meta，无需改正文 |
| North Node in Scorpio | soulmate词11.7 | 全文内容立场与搜索意图相反 | 新增"Deep Relationships"章节 |
| Chiron in 12th House | 四词38-48 | 完全缺transit章节 | 新增transit章节+改Title |
| 12th House Astrology | 话题词58-65 | 两个高展示话题词内容缺失 | 新增"12 House Rules"+"空宫"两章节 |
| How to Find North Node | 70.6 | 意图错配：用户想要calculator，页面只是教程 | 新建专属计算器页+301重定向 |

- 补充策略：个人博主YouTube视频嵌入（非商业占星频道），先在Jupiter Enters Leo一篇试点验证停留时长效果

#### B2内容裁决分析（6/18）
- 基于190篇EN文章/364 URL实测（DR=0）：约120篇0曝光，但反直觉发现一批"低曝光"页实际排名第1-2页（leo/scorpio/libra rising houses、black-moon-lilith、messi系列等）——**这些应improve而非prune**
- 识别北交点簇为最明显的内容蚕食区：hub `how-to-find-north-node`（61曝光，pos 77）+ 一批薄spoke全部隐形（pos 67-83）
- 列出非破坏性可立即执行项（improve赢家页、蚕食簇内链hub化），破坏性操作（301/noindex）等待用户拍板裁撤尺度

#### 外链与世界杯趋势词
- 外链冲刺计划于6/15启动，6.5周窗口对齐排名压制释放期（约7-9月）
- 截至6/14，已发布外链5条（3条Dofollow：SaaSHub DR79、Are.na DR85×2；2条Nofollow：Peerlist DR76、HackerNews DR91），8+高质量站点（askastrology/instyle/thewrap/earthsky）持续跟进中
- uneed.best（DR74）于6/16发布，付费外链首单落地
- 世界杯趋势词选题登记表同步维护，配合7/19前的窗口期持续产出

---

### 项目二：GenGrowth.ai

- Week 1执行正式启动，按主题集群每周推进1-2个
- **6/16 white_label_seo（P0）**：4篇全部LIVE（white label keyword research / best white label seo tool / whitelabel seo tool / free white label seo）
- **6/17 agency_rank_tracking（P0）**：3篇全部LIVE（agency rank tracking / seo reporting tool for seo companies / local seo audit）
- 本周期内（至6/19）累计**7篇LIVE**，覆盖2个P0主题集群
- 后续ethical_organic_seo（6/19起）及更多集群陆续推进至6/26，已超出本周期范围，留待下期周报覆盖

---

## ⚠️ 待解决问题

| 问题 | 影响 | 拟解决方向 |
|---|---|---|
| Chakra + 月亮仪式集群11篇索引失败 | 持续0贡献，是最直接的执行损失 | 排查URL/sitemap问题，重新提交GSC |
| DR=0权威赤字 | 收录、排名、点击的共同天花板，on-page优化边际效益已到顶 | 启动外链建设方案A，12周目标拉至5-10+ |
| 站点整合裁撤尺度未拍板 | B2/B3的301/noindex等破坏性操作无法执行 | 需决策保守（~10-15篇）vs激进（~60-80篇） |
| 作者真实性问题 | 限制客座投稿等off-page外链手段，存在E-E-A-T风险 | 需决策是否启用真实可署名作者 |
| 北交点簇内容蚕食 | hub+spoke集体隐形（pos 67-83） | 内链hub化可立即做，深度合并待裁撤尺度拍板 |
| GA4内部流量未过滤 | 用户行为数据失真（人均浏览64页异常值） | 配置IP过滤，重新评估真实外部用户数据 |

---

## 🎯 下周目标（延续本周期已确认方向）

### 主线一：AstrologyWiki 外链 + 整合双轨启动
- [ ] 推进方案A地基层：品牌实体信号补全、基础目录收录
- [ ] B1技术去重：`/wiki`无前缀301修复、house并行URL去重
- [ ] 5篇GSC优化诊断逐项上线，4-8周后回看CTR/排名变化
- [ ] 用户对作者真实性、整合裁撤尺度、是否暂停发布三项前置问题拍板

### 主线二：GenGrowth.ai 持续产出
- [ ] 按计划继续推进ethical_organic_seo / ai_seo_automation等后续集群
- [ ] 建立数据追踪节奏，验证Week 1产出的GSC收录情况

### 主线三：世界杯趋势词窗口期收尾准备
- [ ] 持续监测趋势词曝光是否独立于排名压制释放窗口维持
- [ ] 为7/19世界杯结束后的常青词独立验证窗口做好数据对比基线

---

## 🧘 个人体会

**这周是从"能不能发出去"转向"发出去之后能不能被信任"的转折点。** Day 23复盘把Top 50词数从粗略估计的"约12个"修正为精确的85个，但拆开趋势词和常青词之后才看清真实底盘——33个常青词才是这60天真正在积累的东西，剩下52个会在7月19日后退潮。这个区分让后续的资源分配判断清楚了很多。

**DR=0这件事，到这周才真正成为共识。** 之前几周的工作重心一直是内容产出，这周三份文件（Day23复盘、SEO权威方案、B2裁决）从不同角度共同指向同一个结论：内容量已经够了，继续堆页面边际效益接近于零，外链才是唯一能移动指针的杠杆。这个认知转变比任何单篇优化都重要。

**GenGrowth.ai复用同一套方法论，启动得比预期顺利。** 7篇文章、2个P0集群一周内全部LIVE，证明这套"集群覆盖+低竞争切入"的打法是可复制的，不是Astrologywiki的偶然结果。

---

*本报告基于以下当周文件回溯整理：2026-06-13-unindexed-pages-audit.md / 2026-06-14-astrologywiki-growth-report-day23.md / 2026-06-14-seo-authority-and-consolidation-plan.md / 2026-06-15-astrologywiki-backlink-sprint-plan.md / 2026-06-16-astrologywiki-seo-optimization-report.md / 2026-06-18-b2-content-triage.md / 2026-06-16-W25-gengrowth-blog-output-plan.md*
*补记日期：2026-06-24*
*下次更新：W26（2026-06-26前后）*
