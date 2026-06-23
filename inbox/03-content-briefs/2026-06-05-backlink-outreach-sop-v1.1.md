---
title: 外链增长 SOP v1.1
date: 2026-06-08
type: sop
status: final
owner: Ma Boyang
project: astrologywiki
tags:
  - seo
  - backlink
  - outreach
  - sop
---

# 外链增长 SOP v1.1

**适用范围：** DR 0–30 的英文内容站 / 工具站（当前实验站：astrologywiki.com）
**目标：** 以白帽方式获取高质量 dofollow referring domains，驱动 DR 增长

---

## 核心原则

**1 个 DR 70 的链接 > 50 个 DR 10 的链接。**
不追求数量，追求「高 DR 来源 × 垂直相关性 × 自然增长节奏」。DR 是对数刻度——从 0 到 10 比从 50 到 60 容易 10 倍以上，前 12 个月是单位投入回报最高的窗口期。

**绝对禁止：**
积分式外链交换（Link Scheme）、付费链接网络（PBN）、互链（A链B B链A）、大量低质目录提交。这些在 Google 2024 Helpful Content Update 后触发惩罚风险极高。

---

## 战术优先级（按 ROI 排序）

| 优先级 | 战术 | 适用阶段 | 预期产出 |
|---|---|---|---|
| P0 · 立即执行 | **战术 0：枕头链接** | Month 1 | 建立真实品牌实体信号 |
| P0 · 主力 | **战术 1：Guest Post** | Month 1–12 | 每篇 = 1 个高质量 RD |
| P1 | **战术 1.5：Link Insertion** | Month 2+ | ROI 高，站长执行成本低 |
| P1 | **战术 2：Digital PR（HARO）** | Month 3+ | 单条可来自 DR 50–80+ |
| P2 | **战术 3：Broken Link Building** | Month 2–6 | 成功率 5–10% |
| P2 | **战术 4：Resource Page** | Month 1–12 | 成功率 10–20% |
| P3 | **战术 5：Link Bait 内容** | Month 3+ | 被动积累，长期复利 |

---

## STEP 0：枕头链接（第1个月必做）

在正式外展之前，让 Google 识别 AstrologyWiki 是一个真实品牌实体。

**执行清单：**
- [x] Pinterest — 建立品牌账号，主页留官网链接
- [ ] X（Twitter）— 建立品牌账号，简介留官网链接
- [x] Medium — 建立作者账号，留官网链接
- [ ] YouTube — 建立频道（可暂无内容）
- [ ] Instagram — 建立账号
- [ ] LinkedIn — 建立品牌页

> 这些链接大多是 Nofollow，但它们构成自然的外链档案（Link Profile）。一个新站只有高 DR dofollow 链接却没有基础社交信号，容易触发算法警报。

---

## STEP 1：目标站点发现（持续执行）

外展的质量上限取决于目标站点的质量。以下四条路径组合使用，每月稳定产出 50–100 个候选目标。

### 1.1 竞品反向链接挖掘（最高效）

**原理：** 链接过竞品的站点，大概率也愿意链接我们。

**步骤：**
1. Ahrefs → Site Explorer → 输入竞品域名（如 cafeastrology.com / astro-seek.com）
2. 左栏 → Backlinks → Referring Domains
3. 过滤：DR 20+ / Dofollow / 语言 English（DR 上限不设，高 DR 站通过均分DR评分判断，见 1.5）
4. 导出，逐行判断主题相关性

**进阶：Link Intersect（一次找到所有竞品共同外链来源）**
1. Ahrefs → More → Link Intersect
2. 输入 3–5 个竞品域名
3. 底部输入 astrologywiki.com（排除已链接我们的）
4. 结果 = 链接多个竞品但未链接我们的域名 → 最优质目标清单

**建议频率：** 每季度执行一次，产出 50–100 个高质量目标。

### 1.2 Google 搜索指令批量发现（免费）

**寻找 Guest Post 机会：**
```
"write for us" astrology
"guest post" astrology spirituality
"submit a post" + astrology
"contribute" + "astrology" + site:*.com
"accepting guest posts" + spiritual wellness
```

**寻找 Resource Page 机会：**
```
inurl:resources "astrology"
inurl:links "birth chart" astrology
"best astrology websites" + suggest
"astrology resources" inurl:recommended
"spiritual reading list" + astrology
"yoga" + "chakra" + "recommended resources"
```

**寻找 Niche Edit 机会（缝隙插入）：**
```
"aura colors" -site:astrologywiki.com inurl:blog
"12 houses astrology" + "further reading"
"nakshatra meaning" + "learn more"
```

**建议频率：** 每月执行一次，各跑 5–10 个指令，产出 20–30 个新目标。

### 1.3 Ahrefs Content Explorer（内容反查）

**适用场景：** 找到链接了质量不如我们的同类内容的站点，主动联系请求替换。

**步骤：**
1. Ahrefs → Content Explorer
2. 搜索目标话题（如 `aura colors meaning`）
3. 过滤：Referring domains > 5 / 发布时间 > 1 年前
4. 查看链接了这些内容的站点
5. 对比 AstrologyWiki 同主题文章质量 → 若我们更好，联系请求替换

**建议频率：** 每月执行一次，产出 10–15 个替换机会。

### 1.4 Google Alerts 品牌提及监控（被动发现）

**原理：** 有人提及了 AstrologyWiki 但没有加链接，发邮件礼貌请求补充。

**设置：**
- 关键词：`AstrologyWiki` / `astrologywiki.com`
- 频率：每天推送
- 收到通知后检查是否有 dofollow 链接，如没有则发邮件请求

**建议频率：** 持续监控，随时处理。

### 1.5 目标站点评估标准（两阶段筛选漏斗）

找到候选站点后，执行**两阶段筛选**，全部通过才进入外展名单。

#### 第一阶段：基础资格过滤（快速，<5 分钟/站点）

| 维度 | 合格标准 | 工具 |
|---|---|---|
| DR | ≥ 20 | Ahrefs |
| 自然流量 | Semrush 估算 > 1,000/月 | Semrush 免费版 |
| 主题相关性 | 占星 / 灵性 / 心理成长 / 能量工作 | 人工判断 |
| 链接类型 | 有 dofollow 链接能力 | NoFollow Chrome 扩展 |

**任意一项不达标 → 直接淘汰，不进入第二阶段。**

#### 第二阶段：均分DR 质量评分（核心过滤）

**为什么均分DR 是可靠指标——原理与可行性论证**

Ahrefs 帮助文档对 DR 计算有明确说明：

> *"The amount of 'DR juice' passed from each linking domain is determined roughly by dividing the DR of the linking domain by the number of unique domains that it links to."*

也就是说：**一条外链传递的 DR 权重 ≈ 来源站 DR ÷ 其 dofollow 链出唯一域名数**。

均分DR 正是这个公式的直接量化——不是替代指标，而是 Ahrefs 自身计算逻辑的人工可读化。这意味着：

- **比单看 DR 更准确**：DR 80 的链接农场（链出 50,000 个域名，均分DR 0.0016）和 DR 80 的权威媒体（链出 3,000 个域名，均分DR 0.027）在 DR 上无法区分，用均分DR 一眼识别。
- **被 Ahrefs 2025年9月算法更新印证**：此次更新核心之一是加强对"高 DR 但链出极度分散"站点的质量惩罚，大量伪装成高权威的链接农场 DR 大幅下滑。均分DR 过滤框架提前识别了这类站点。
- **与 Google SpamBrain 趋势一致**：链出域名数过高是 Google 判定 link farm 的重要信号；大量收购外链的站点（高链出数）已被列为 link spam 特征之一。

```
均分DR = DR ÷ Dofollow Linked Domains（该站 dofollow 链出的唯一域名数）
```

在 Ahrefs Site Explorer 中查看：
- DR → Overview 页面顶部
- Linked Domains → Overview → "Linked domains" 筛选 Dofollow

**分层通过标准（2026-06 修订版，基于 Ahrefs 公式原理 + 行业典型链出域名数范围校准）：**

| DR 范围    | 最低均分DR  | 参考最大链出域名数*     | 说明                           |
| -------- | ------- | -------------- | ---------------------------- |
| DR 0–30  | ≥ 0.05  | ≤ 600（@DR30）   | 低 DR 站须高集中度才有传递价值            |
| DR 30–50 | ≥ 0.04  | ≤ 1,250（@DR50） | 性价比最高的目标区间                   |
| DR 50–70 | ≥ 0.025 | ≤ 2,800（@DR70） | 主流质量博客链出 1,000–2,500 域名属正常范围 |
| DR 70+   | ≥ 0.015 | ≤ 6,000（@DR90） | 高权威站必然更分散；0.015 仍可有效排除链接农场   |


> \* 参考值以该区间上限 DR 估算（最大链出域名数 = 区间上限DR ÷ 最低均分DR），仅作快速心算参考，**以均分DR 比值为核心判断标准**，无需单独卡域名数上限。

**真实案例验证（按修订标准）：**

排除——
- businesstomark.com：DR 62，链出 16,709 域名，均分DR 0.004 → ✗ 排除（链接农场特征）
- feast-magazine.co.uk：DR 72，链出 6,749 域名，均分DR 0.011 → ✗ 排除（低于 0.015）

通过——
- appkod.com：DR 71，链出 3,067 域名，均分DR 0.023 → ✓ 通过（DR 70+，> 0.015）
- greatercollinwood.net：DR 53，链出 612 域名，均分DR 0.087 → ✓ 通过
- techbles.com：DR 44，链出 470 域名，均分DR 0.094 → ✓ 通过

边缘通过（低优先级）——
- englishlush.com：DR 70，链出 4,507 域名，均分DR 0.0155 → ✓ 勉强通过（DR 70+，> 0.015），链接稀释度较高，在同等价格下优先选均分DR ≥ 0.02 的站点

**快速判断公式（录入 Google Sheets / Excel，B=DR，D=均分DR）：**

```excel
=IF(B2>=70, IF(D2>=0.015,"通过","均分不足"),
  IF(B2>=50, IF(D2>=0.025,"通过","均分不足"),
  IF(B2>=30, IF(D2>=0.04, "通过","均分不足"),
                          IF(D2>=0.05, "通过","均分不足"))))
```

> **核心原则：** 均分DR 低于门槛的站点，无论 DR 多高，单条链接对我们 DR 提升的贡献可忽略不计。宁可放弃 DR 80 均分 0.005 的链接，也不要浪费外展资源。

---

## STEP 2：Guest Post（主力战术，持续执行）

### 2.1 已验证目标站点

| 站点                  | 主题方向         | 联系方式                        | 优先级  |
| ------------------- | ------------ | --------------------------- | ---- |
| theglobalhues.com   | 占星/灵性/生活方式   | info@theglobalhues.com      | 🔴 高 |
| innermasteryhub.com | 灵性/情绪健康/个人成长 | 网站表单                        | 🔴 高 |
| astronidan.com      | 占星技术/AI占星    | 网站表单                        | 🔴 高 |
| astrosconnect.com   | 占星/塔罗/灵性     | marketing@astrosconnect.com | 🟡 中 |
| globgyan.com        | 占星/生活方式      | 网站表单                        | 🟡 中 |
| astrologify.com     | 占星评测/工具      | 联系页面                        | 🟡 中 |

### 2.2 外展邮件模板

```
Subject: Guest Post Pitch — [文章标题] for [站点名]

Hi [编辑名],

I'm [作者名], [一句话资质介绍].
I've been following [站点名] and think your audience would find
value in a piece I'd like to contribute.

Proposed title: [具体文章标题]
Angle: [1-2句说明差异化视角]
Word count: ~1,200 words

I've attached a brief outline. Happy to send the full draft
if the topic works for you.

Best,
[作者名] | AstrologyWiki.com
```

**注意：**
- 每封邮件必须个性化，提及对方站点的一篇具体文章
- 文章质量必须与 AstrologyWiki 现有文章水准相当
- 发布前用 NoFollow 扩展确认链接为 dofollow

### 2.3 工作量现实数据

冷邮件平均转化率 **2%–5%**：

```
目标：每月 5–8 个链接
需要发送：150–250 封定制化邮件/月
推荐工具：Lemlist / Instantly（批量外展 + 自动跟进）
```

月发邮件超过 50 封后必须使用外展工具，不要纯手工单发。

### 2.4 编辑费处理规则

| 条件 | 处理方式 |
|---|---|
| Semrush 流量 > 5,000/月 且 DR > 40 | 可接受 $50–100 |
| 必须确认 | 非 Sponsored 标签 + 自然 dofollow |
| 红线 | 对方是专做链接买卖的 Link Farm → 拒绝 |

---

## STEP 3：Link Insertion（缝隙插入，补充战术）

找到已排名 Google 第 2–5 页、讨论占星/灵性话题的**现有文章**，联系站长请求在旧文特定段落插入链接。

**优势：** 站长只需加一个链接，无需审阅新稿；老页面已积累 UR，传递 Link Juice 更快。

**步骤：**
1. Ahrefs → Keywords Explorer 搜索目标词，过滤排名 P11–P50
2. 找到相关页面，查看其 UR 和 DR
3. 确认 AstrologyWiki 有可自然插入的对应内容
4. 发送邮件：指出具体段落 + 说明插入价值，不直接索要链接

---

## STEP 4：Digital PR（HARO 平台，第3个月起）

### 4.1 推荐平台

| 平台 | 特点 | 费用 |
|---|---|---|
| Featured.com（原 HARO）| Fortune/Fast Company 等媒体 | 免费基础版 |
| Qwoted | 记者可主动搜索专家 | 免费 |
| #journorequest（X）| 免费，实时性强 | 免费 |
| JournoFinder Alerts | 聚合多平台，统一仪表板 | $49/月 |

### 4.2 四位作者与适合话题

| 作者 | 背景 | 适合话题 |
|---|---|---|
| Julian Thorne | 心理咨询 5 年 + 进化占星 12 年 | 占星与心理健康、自我认知 |
| Elena Vane | 广告转行 + 8 年能量工作 | 能量工作与职业倦怠、正念实践 |
| Aditi Sharma | 比较文学 + 吠陀研究 10 年 | 吠陀传统智慧、跨文化灵性 |
| Marcus Orion | 7 年数据分析 + 占星基础研究 | 星盘数据分析、占星系统化学习 |

### 4.3 回复规范

- 长度：150–250 词
- 结构：直接给观点 → 具体数据或案例 → 作者资质一句话 + AstrologyWiki 相关页面 URL
- **响应速度：请求发出后 2 小时内回复，胜率最高**

---

## STEP 5：Broken Link Building（第2–6个月）

**步骤：**
1. Ahrefs → Site Explorer → 竞品域名 → Outgoing Broken Links
2. 筛选来源 DR 30+ 的断链
3. 确认 AstrologyWiki 有可替代该失效内容的页面
4. 如没有：快速创作一篇对应主题文章
5. 发送邮件

**邮件模板：**
```
Subject: Broken link on [页面标题] — replacement resource

Hi [站长名],

I was reading your article on [文章标题] and noticed one
of the links appears to be broken:
[失效链接 URL]

We recently published a comprehensive guide on the same topic
that might be a good replacement:
[AstrologyWiki.com 替代页面 URL]

Happy to help if you decide to update the link.

Best,
[名字] | AstrologyWiki.com
```

---

## STEP 6：Resource Page Link Building（持续执行）

**已发现机会：**

| 页面类型 | 提交切入点 | 预期难度 |
|---|---|---|
| 占星工具推荐页 | 提交星盘计算器工具页 | 低 |
| 心理成长资源列表 | 提交 Julian 系列文章 | 低 |
| 占星学习路径页 | 提交 Houses Pillar 文章 | 中 |
| 瑜伽/正念站点参考资源 | 提交 Elena 系列 | 中 |

---

## STEP 7：Link Bait 内容（第3个月+）

| 内容类型 | 具体选题 | 预期 RD |
|---|---|---|
| 权威词汇表 | 心理占星学完整术语表（A-Z）| 中高 |
| 对比指南 | 西方占星 vs 吠陀占星：完整系统对比 | 中高 |
| 数据研究 | 2026年占星内容最常见的10个误解（基于Reddit数据）| 高 |

**推广方式：** 发布后主动发给 15–20 个可能引用的博主 + Reddit 社区分享 + Digital PR 推送给相关媒体记者。

---

## 锚文字分布规范

| 类型 | 示例 | 建议比例 |
|---|---|---|
| 品牌词 | AstrologyWiki / AstrologyWiki.com | 30–40% |
| 裸 URL | https://www.astrologywiki.com/... | 15–20% |
| 通用词 | click here / this guide / read more | 10–15% |
| 部分匹配关键词 | astrology house guide / aura reading | 20–25% |
| 精确匹配关键词 | astrology houses meaning | 5–10% |

> 精确匹配超过 10% 会触发算法警觉。

---

## 月度执行节奏

| 发现方法 | 频率 | 预计产出目标数 |
|---|---|---|
| Link Intersect（竞品反查）| 每季度一次 | 50–100 个高质量目标 |
| Google 搜索指令 | 每月一次，各跑 5–10 个指令 | 20–30 个新目标 |
| Content Explorer（内容反查）| 每月一次 | 10–15 个替换机会 |
| Google Alerts（品牌提及）| 持续监控 | 随时处理 |

| 时间 | 核心任务 | 目标链接数 | 预期 DR |
|---|---|---|---|
| Month 1 | 枕头链接 + 向8个站发 Guest Post 邮件 + 整理50个资源页目标 | 5–8个 | 1–3 |
| Month 2 | 跟进未回复 + 发表3–4篇 Guest Post + 断链修复20个 + 资源页提交10个 | 8–12个 | 3–6 |
| Month 3 | 累计10篇 Guest Post + 启动 Digital PR + 发布第一篇 Link Bait | 10–15个 | 5–8 |
| Month 4–6 | Guest Post 提升至6–8篇/月 + Digital PR 攻坚 DR 40–60 媒体 | 10–15个/月 | DR 10–18 |

---

## 月度质量核查清单

- [ ] Ahrefs Site Explorer 检查新增 referring domains，过滤 DR 0–5 垃圾链接
- [ ] 检查新增链接锚文字，确认精确匹配关键词比例不超过 10%
- [ ] Google Search Console 监控「手动操作」通知
- [ ] 对可疑链接（DR < 5 / 主题无关 / 非英文垃圾站）提交 Disavow 文件
- [ ] 每季度用 Ahrefs 检查竞品新获得的链接，发现新机会

---

## 工具栈

| 工具 | 用途 | 费用 | 优先级 |
|---|---|---|---|
| Ahrefs Lite | 竞品外链分析 / 自身监控 / 断链查找 / Content Explorer | $129/月 | 必须 |
| Google Search Console | 收录状态 / 手动惩罚通知 / 链接报告 | 免费 | 必须 |
| NoFollow Chrome 扩展 | 确认链接是否 dofollow | 免费 | 必须 |
| Google Alerts | 品牌提及监控 | 免费 | 必须 |
| Featured.com（HARO）| Digital PR 记者请求响应 | 免费基础版 | 推荐 |
| Hunter.io | 寻找站长/编辑联系邮箱 | 免费50次/月 | 推荐 |
| Semrush 免费版 | 目标站点流量核查 | 免费 | 推荐 |
| Lemlist / Instantly | 批量外展 + 自动跟进（月发150+封时必须）| 付费 | 推荐 |
| Airtable / 飞书 | 外展管理 / 链接追踪 | 免费基础版 | 推荐 |

---

## 里程碑

| 节点 | 目标 DR | Referring Domains | 调整触发条件 |
|---|---|---|---|
| Month 3 | 5–8 | 15–25 | 未达10个 RD → 加大 Guest Post 频率 |
| Month 6 | 12–18 | 50–70 | DR < 10 → 检查是否有毒链 |
| Month 9 | 20–26 | 90–110 | DR 停滞 → 转向 Digital PR 攻坚高 DR |
| Month 12 | 28–32 | 120–150 | 超额完成 → 制定 DR 30→50 升级计划 |

---

**从 DR 0 到 DR 30 的 12 个月，是整个网站生命周期中单位投入回报最高的阶段。**

---

*SOP 依据：2026-05-26-astrologywiki-backlink-strategy-dr0-20 + Outrank 竞品分析 · 维护人：Ma Boyang*

---

## 版本变更记录

### v1.1（2026-06-08）

**升级内容：STEP 1.5 目标站点评估标准 — 引入均分DR两阶段筛选框架**

**v1.0 问题：**
原评估标准仅凭 DR 范围（20–60）和流量做一刀切判断，无法识别"DR 高但链出过度分散"的低质站点（如 DR 62 却链出 16,709 个域名），也无法识别 DR 70+ 的高权威站机会。

**v1.1 变更：**

1. **1.5 升级为两阶段漏斗**
   - 第一阶段：基础资格过滤（DR/流量/相关性/链接类型），与 v1.0 逻辑一致
   - 第二阶段（新增）：均分DR 质量评分，核心指标 = DR ÷ Dofollow Linked Domains

2. **引入4层均分DR门槛**（基于22条真实成交外链推导）

   | DR 范围 | 最低均分DR | 最大链出域名数 |
   |--------|----------|------------|
   | DR 0–30 | ≥ 0.06 | ≤ 300 |
   | DR 30–50 | ≥ 0.05 | ≤ 600 |
   | DR 50–70 | ≥ 0.03 | ≤ 1,500 |
   | DR 70+ | ≥ 0.02 | ≤ 4,000 |

3. **1.1 DR 过滤上限放开**：从 "DR 20–60" 改为 "DR 20+"，高 DR 站由均分DR评分决定，不再一刀切排除

4. **新增 Excel/Airtable 自动判断公式**，可直接录入外展追踪表使用

**数据来源：** 2026-06 基于 `外部合作记录-2025.xlsx`（22条成交外链）推导，Ahrefs 官方公式验证

### v1.0（2026-06-05）

初始版本。战术框架、邮件模板、月度节奏、工具栈完整建立。
