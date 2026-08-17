
---
title: 工具页审计 · /tools/low-competition-keywords
date: 2026-08-14
审计对象: https://gengrowth.ai/tools/low-competition-keywords
对照依据:
  - `00-inbox/2026-07-09-工具落地页设计规范-sop-v1.0.md`（结构硬指标）
  - `02-keyword-research/2026-08-11-选词规则-v1.md`（内容素材来源）
  - `docs/03-marketing/2026-05-15-gengrowth-internal-growth-mvp-prd-v0.8.md`（方法论骨架）
读者: 马博洋、彪哥
---

# 工具页审计 · Low Competition Keywords

## 零、一句话结论

> **技术面干净，结构面严重不足：全页 466 词，是 SOP 下限（2000 词）的 23%。**
> **而缺的那 1,500 词，我们手上现成有——选词规则 v1 和 PRD 里的方法论，正好能填满 SOP 要求的「功能解读」和「使用场景」两个区块。**

**关键事实**：**未登录状态下**页面 0 个 `<input>`、0 个 `<form>`——工具需先连接 Search Console 才渲染出来。**搜索进来的未登录用户和 Googlebot，看到的全部内容就是这 466 词。**

> ⚠️ **2026-08-14 实测修正**：登录且已连接 GSC 后，**表单是完整存在的**（Search Console 属性下拉 / 站点 URL / 市场 / 语言 / 种子词 / Read my site 按钮）。
> **上面那句"0 个 input"只对未登录状态成立**——但这恰恰是 SEO 意义上重要的状态，因为 Googlebot 就是未登录的。
> **完整的实测使用反馈见第七节。**

---

## 一、对照 SOP 的逐项审计

| # | 项 | SOP 要求 | 实况 | 判定 |
|---|---|---|---|---|
| 1 | H1 | 1 个，含主词，≤70 字符 | `Find low competition keywords with a weak site already on page one`（66 字符） | ✅ |
| 2 | 面包屑可见 + Schema 一致 | 必须 | `Home / Supporting SEO Tools / [工具名]`，与 BreadcrumbList 一致 | ✅ |
| 3 | meta title | ≤60 字符含主词 | 42 字符 | ✅ |
| 4 | **meta description** | **≤160 字符** | **192 字符** | ❌ 超长 32 字符 |
| 5 | **8 个标准区块** | Hero / 工具 / 使用指南 / 功能解读 / 场景 / FAQ / 相关工具 / 相关文章 | **只有 4 个**（Hero、工具、"How the map decides"、"What you get back"、FAQ） | 🔴 **缺 3 个区块**：使用场景、相关工具、相关文章 |
| 6 | **H2** | **5–8 个** | **4 个** | ❌ |
| 7 | **H3** | **15–25 个** | 12 个，**其中 4 个是 FAQ 问题 → 结构性 H3 只有 8 个** | 🔴 |
| 8 | **全页字数** | **2000–3500 词** | **466 词** | 🔴 **只有下限的 23%** |
| 9 | **FAQ 条数** | **8–10 条** | **4 条** | 🔴 不足一半 |
| 10 | Schema：FAQPage | 必须 | ✅ 存在（4 条 Question/Answer） | ✅ |
| 11 | Schema：BreadcrumbList | 必须 | ✅ | ✅ |
| 12 | Schema：HowTo | 可选 | ✅ 存在（4 个 HowToStep） | ✅ |
| 13 | Schema：**WebApplication** | **必须** | 用的是 **`SoftwareApplication`** | ⚠️ 见下 |
| 14 | **工具页 → Blog 内链** | **3–5 个** | **0 个** | 🔴 |
| 15 | **工具页 → 其他工具** | **3–4 个** | **0 个**（只有 `/agents/seo`、`/agents/tech`） | 🔴 |

**第 13 项说明**：`WebApplication` 是 `SoftwareApplication` 的子类型。**现在这个不算错，但不够具体**——SOP 指定 `WebApplication` 是为了明确告知这是可交互的 Web 工具。建议改，但优先级低。

### 现有结构（供改写参照）

```
H1  Find low competition keywords with a weak site already on page one
H2  Connect Search Console
      H3  Connect Search Console
H2  How the map decides what to show you
      H3  We read your site first
      H3  Candidates are priced, not guessed
      H3  Page one is opened for the survivors
H2  What you get back
      H3  Search terms with measured demand
      H3  Questions your site already answers
      H3  Checks before you act
      H3  Where the rest went
H2  FAQ
      H3  Do I need Search Console?
      H3  Are AI-generated candidates enough?
      H3  Why would a run come back with almost nothing?
      H3  How long does it take?
```

**骨架是对的，问题是每一根骨头上都没有肉。** 例如 `Page one is opened for the survivors` 和 `Where the rest went` 这两个 H3——**它们描述的正是我们最有价值的判据，但页面上一个判据都没写出来。**

---

## 二、最大的问题：我们把最强的资产藏起来了

**这个工具做的事，本质就是选词规则 v1 的自动化。** 但页面上完全没有讲这套方法论。

> **对用户**：他不知道"survivors"是按什么活下来的，也就无法判断结果值不值得信。
> **对搜索引擎**：466 词、8 个结构性 H3，覆盖不了任何长尾词。
> **对 AI 引用**：没有可抽取的论断，AI 无从引用。

**而 SOP 要求的正是这两个区块，且字数占全页一半以上：**

| SOP 区块 | 字数目标 | 现状 |
|---|---|---|
| 区块 4 **功能解读** | **800–1500 词**，H3 8–12 个 | ⚠️ 有 4 个 H3，几乎无字数 |
| 区块 5 **使用场景** | **200–400 词**，H3 3–5 个 | 🔴 **完全缺失** |

---

## 三、内容来源映射：现成的，不用新写

### 3.1 选词规则 v1 → 区块 4「功能解读」

| 选词规则章节 | 填到哪个 H3 | 具体内容 |
|---|---|---|
| **第一节 SERP 三问** | 新 H3：`The three questions we ask about page one` | ① 前十有没有近两年注册的域名 ② 有没有十万月访以下的站 ③ 有没有 UGC 位（Reddit/Quora/Medium）。**三问全否 → 该词淘汰** |
| **第一节 为什么不先看 KD** | 新 H3：`Why difficulty scores come last, not first` | 实证：`internal link checker` KD10、`internal link audit` KD25，**实际前七全是 DR 73–99** |
| **第二节 四类直接否决** | 扩写现有 H3 `Where the rest went` | ① 品类级标配免费工具词 ② 大厂工具的功能名（教学型形态）③ 意图错配 ④ 语义有负面联想 |
| **第二节 换形态救回** | 新 H3：`When a rejected term is worth a second query shape` | `how to fix keyword cannibalization` ❌ → `keyword cannibalization checker` ✅（一个 2025-06 注册的域名排第 2） |
| **第五节 命中判定 + CTR 基准** | 新 H3：`What position actually earns a click in 2026` | 排名 1–6 基准 CTR ~3.4%；**7–10 且有 AI Overview 时只有 0.65–0.78%**；有 AIO 的查询整体 0.64%（Seer Interactive）。**所以 7–10 名不是"快到了"，是已被占领** |

### 3.2 PRD v0.8 → 区块 4 补充 + FAQ

| PRD 章节 | 用途 | 内容 |
|---|---|---|
| **§7.3.0 四层字段** | H3：`How a term moves from candidate to production` | 竞争建议 → 机会分桶 → 生产准入 → 生产状态。**四层分开，因为"能不能打"和"该不该做"是两个问题** |
| **§7.3.0 DR 差值规则** | 同上 | **DR 差值 > 30 → 暂缓；≤ 30 → 可做**。且这不是过滤关卡——集群必需的词可人工覆盖 |
| **§7.3 四桶分级** | H3：`The four buckets a surviving term lands in` | 趋势词 / 快速胜利 / 战略词 / 长尾词 |
| **§7.3.2 垃圾词根因** | 🔴 **FAQ 金矿，见 3.3** | 多义词假阳性 + 子串匹配 |
| **§3.3 地区闸门 us_share** | H3：`Why volume alone hides where the traffic comes from` | 同一个词在不同国家的量级完全不同；工具按目标国取值，不是全球量 |
| **§7.3 AIO 防御** | 区块 5 使用场景之一 | AIO 高风险的定义型词，必须配工具/表格/对比才有留存价值 |

### 3.3 🔴 最有价值的一条：把我们自己的失败写进 FAQ

**PRD §7.3.2 记录了一个真实案例**：

> 我们自己的关键词工具曾把 **`miami dade transit bus tracker`**（月搜 1100、KD 9）标成"占星话题相关 ✅"、分桶为"快速胜利"。
> **根因**：`transit`（行星过境）是占星的合法话题词，进了话题词库；而匹配用的是**子串匹配**，于是 `miami dade **transit** bus tracker`、`hub city **transit** bus tracker`、`trimet **transit** tracker` 全部命中。

**这条应该原样写进 FAQ**（问题：`Why would a keyword tool return terms that have nothing to do with my business?`）。

**理由**：
1. **具体、可验证、有自嘲意味**——SERP 上没有任何竞品会写自己的工具出过什么错
2. **它同时解释了工具的一个真实局限**，符合 08-04 文档第四节定的调性：「把自己列进去，如实写局限」
3. **多义词假阳性是所有关键词工具的通病**，读者会认

---

## 四、改写方案

### 4.1 目标 H2/H3 结构（8 区块，H2 7 个，H3 20 个）

```
[区块1 Hero]  H1 Find low competition keywords with a weak site already on page one
              （保留，不动）

[区块2 工具]  Connect Search Console
              （保留。⚠️ 未登录看不到工具本体，见 4.3）

[区块3 使用指南]  H2  How to run the map
      H3  Step 1 — Connect Search Console read-only
      H3  Step 2 — Let it read what your site actually sells
      H3  Step 3 — Review the survivors and the rejects together
      H3  Tips for a cleaner run

[区块4 功能解读]  H2  How the map decides what survives      ← 字数主体，800–1500 词
      H3  We read your site first
      H3  Candidates are priced, not guessed
      H3  The three questions we ask about page one          ← 选词规则 §1
      H3  Why difficulty scores come last, not first         ← 选词规则 §1
      H3  The four rejection rules                           ← 选词规则 §2
      H3  When a rejected term is worth a second query shape ← 选词规则 §2
      H3  What position actually earns a click in 2026       ← 选词规则 §5
      H3  The four buckets a surviving term lands in         ← PRD §7.3
      H3  Candidate → production: four separate decisions    ← PRD §7.3.0
      H3  Why volume alone hides where the traffic comes from ← PRD §3.3

[区块5 使用场景]  H2  Who this map is for                    ← 完全新增
      H3  Sites under DR 40 that cannot win on authority
      H3  Teams deciding what to write next, not what to write about
      H3  Anyone whose difficulty score said easy and the SERP said otherwise
      H3  Not for: established sites competing on head terms

[区块6 FAQ]   H2  FAQ                                        ← 4 条 → 10 条，见 4.2

[区块7 相关工具]  H2  Other tools that use the same data
      → /tools/seo-quick-wins · /tools/traffic-drop-diagnosis · /agents/seo

[区块8 相关文章]  H2  Read the method behind the map
      → 4 篇，见 4.4
```

### 4.2 FAQ 补到 10 条

**保留现有 4 条**，新增 6 条。按 SOP 3.2 的四类分布：

| # | 类型 | 问题 | 答案来源 |
|---|---|---|---|
| 1 | 使用型 | Do I need Search Console?（现有） | — |
| 2 | 使用型 | How long does it take?（现有） | — |
| 3 | 信任型 | Are AI-generated candidates enough?（现有） | — |
| 4 | 结果解读 | Why would a run come back with almost nothing?（现有） | — |
| **5** | **信任型** | **Why would a keyword tool return terms that have nothing to do with my business?** | 🔴 **PRD §7.3.2 的 `miami dade transit` 案例，见 3.3** |
| **6** | 结果解读 | Why does a keyword with difficulty 5 still look impossible on page one? | 选词规则 §1：`internal link checker` KD10 但前七 DR 73–99 |
| **7** | 结果解读 | The tool says position 7–10 is not a win. Why? | 选词规则 §5：AIO 之后 7–10 档 CTR 0.65–0.78%；我们自站 1–6 档 CTR 5.54%，比基准高 63% |
| **8** | 场景延伸 | Can I write more than one page for the same keyword? | 选词规则 §8：一个意图写 7 篇 → 2,318 展示、**2 点击**、无一进前 15 |
| **9** | 场景延伸 | What do I do with the terms it rejected? | 选词规则 §2：换查询形态（加 tool / checker / alternative）常能救回一半 |
| **10** | 信任型 | Does search volume mean the same thing in every country? | PRD §3.3：量级按目标国取，不是全球量 |

⚠️ **每条答案 ≥40 词**（SOP 5.1 要求），且 **FAQPage Schema 的 `name`/`text` 必须与页面显示文字完全一致**。

### 4.3 ⚠️ 一个需要产品决策的问题：未登录用户看不到工具

**现状**：未登录时页面 0 个 `<input>`、0 个 `<form>`，工具需先授权 GSC 才渲染。（登录后表单完整，见第七节实测。）

**后果**：从搜索进来的用户，**在授权之前无法感知这个工具做什么**——他看到的只有文字描述。而 SOP 区块 2 明确要求「工具界面嵌入在 Hero 之后的第一屏，不得埋在内容深处」。

**三个选项，需要你和彪哥定：**

| 选项 | 做法 | 代价 |
|---|---|---|
| **A（推荐）** | 加一个**只读示例结果**（静态截图或样例数据表），放在 Hero 之后 | 开发成本低，用户立刻知道产出长什么样 |
| B | 加一个不需授权的**演示模式**（输入域名 → 返回有限结果） | 开发成本高 |
| C | 维持现状 | 转化路径依赖用户在零信息下决定授权 |

> **A 同时能解决一个 SEO 问题**：示例结果表是可被抓取的结构化内容，能贡献字数和长尾覆盖。

### 4.4 内链补齐（现在是 0）

| 方向 | 数量 | 目标 |
|---|---|---|
| → Blog | **4** | `/blog/how-to-find-low-hanging-fruit-keywords`（方法论对口）· `/blog/zero-search-volume-keywords`（同集群）· `/blog/striking-distance-keywords`（互补：已有排名 vs 挖新词）· `/blog/agentic-seo`（8/18 上线后补） |
| → 其他工具 | **3** | `/tools/seo-quick-wins` · `/tools/traffic-drop-diagnosis` · `/agents/seo` |

⚠️ **锚文本按 SOP 2.3**：含关键词的自然短语，禁止 "click here" / "learn more"。
⚠️ **禁止链向旧定位内容**（`affordable-seo-*`、`agency-rank-tracking`、`best-ai-seo-tools` 等）。

### 4.5 其他修正

- **meta description 从 192 字符压到 ≤160**
- **`SoftwareApplication` 改为 `WebApplication`**（优先级低，不影响功能）

---

## 五、执行优先级

| 顺序 | 事项 | 成本 | 收益 |
|---|---|---|---|
| **1** | **补区块 4「功能解读」到 800–1500 词**（选词规则 §1/§2/§5 + PRD §7.3） | 中，**但内容现成** | 🔴 字数从 466 → 约 1,600，长尾覆盖从 0 到有 |
| **2** | **FAQ 从 4 条补到 10 条**（含 `miami dade transit` 案例） | 低 | FAQPage Schema 价值提升 + 差异化 |
| **3** | **补内链 7 条**（4 → Blog，3 → 工具） | 极低 | 转化路径打通 |
| **4** | 补区块 5「使用场景」+ 区块 3「使用指南」 | 中 | 补齐 8 区块，场景型长尾 |
| **5** | 补区块 7/8（相关工具 / 相关文章卡片） | 低 | 与第 3 项合并做 |
| **6** | 示例结果（4.3 选项 A） | 需产品决策 | 转化 + 字数 |
| **7** | meta description 压缩、Schema 改 WebApplication | 极低 | 顺手做 |

**做完 1–3 就能从 466 词到约 1,800 词、FAQ 达标、内链打通**，是投入产出比最高的三件。

---

## 六、⚠️ 预期管理

**不要期待这次改版直接带来排名变化。**

- 主词 `find low competition keywords`（720 / KD39，Semrush 08-04）的 SERP 判定是**「⚠️ 有缝」，不是「✅ 可打」**
- 该页近 3 个月 GSC 曝光记录为 **0**
- 站点仍是 DR 低位，**页面级优化解决不了域名级约束**

**这次改版的真实目的有三个，都不是排名：**

1. **给内容矩阵一个够格的落地点** —— 8/14 起 blog 会开始往这里导流，现在这个页面接不住
2. **把方法论变成可被 AI 抽取的论断** —— AI 引用是当前增速最快的渠道（5月 0 → 8月前 12 天 93）
3. **补齐长尾覆盖** —— 466 词覆盖不了任何长尾，1,600 词能

---

---

# 七、实测使用反馈（2026-08-14 完整跑通一次）

**测试条件**：已登录、GSC 已连接、站点 `astrologywiki.com`、市场 United States、语言 English、**不填种子词**（测默认路径）。

## 7.0 🔴 最重要的一条：110 个候选里只有 3 个是基于竞争判断被淘汰的

结果区 `Held back, and why` 的分布：

| 拦下的原因 | 数量 | 占比 |
|---|---:|---:|
| 供应商返回无数据（**不等于零需求**） | **49** | 44% |
| **本次 page-one 预算没跑到它** | **32** | **29%** |
| 没有已抓取页面回答它 | 25 | 23% |
| **强站占据第一页** | **3** | **2.7%** |
| 你的站已经服务这个查询 | 1 | 1% |
| **合计拦下** | **110** | |

> ### 工具的核心卖点是「page one is opened for the survivors」，但 110 个候选里只有 18 个真的被打开过第一页（3 个被拒 + 15 个通过）。
>
> **29% 是因为预算不够根本没查。** 而用户既看不到那 32 个是什么，也没有「继续查完」的入口。**这是本次实测发现的最大价值漏损。**

## 7.1 ✅ 做得好的五点

**① 第一阶段「读站」是个好设计。** 输出 8 条从站上提取的陈述，**每条带来源 URL**，并明说「如果这些是错的，关键词也会错」。让用户在花 search-data budget **之前**校验 LLM 的理解，而不是黑盒出结果。**8 条实测全部准确。**

**② `WEAKEST RANK` 是真正的差异化指标。** 定义印在表格下方：*第一页最弱域名当前持有的权重，供应商 0–1000 尺度*。**这正是选词规则第一节三问里第 ①②问的量化版本。**

**③ 确实挖到了真机会：**

| 词                          |          量 |  KD |    最弱站权重 |
| -------------------------- | ---------: | --: | -------: |
| snship astrology chart**   | **22,200** |  16 | **24** ⭐ |
| transit chart calculator   |      3,600 |   1 |    **0** |
| sun sign calculator        |      3,600 |   8 |       97 |
| relocation chart astrology |        590 |   0 |    **0** |
| synastry chart calculator  |      2,900 |  18 |       55 |

> 📌 **一个正面细节**：`transit chart calculator` 正是 PRD §7.3.2 那个多义词教训的**正确形态**——SOP 明确要求「不能用 `transit` 单个多义词做种子，应该用 `transit chart`」，**工具自己生成对了。**

**④ 进度反馈优秀。** 二阶段运行时显示：在做什么（定价候选 / 读 GSC 查询 / 逐个打开第一页）、预期多久（约两分钟）、**为什么慢**（串行采样，不打爆供应商）、以及 elapsed 计时器。**这直接缓解了「验证周期长易焦虑」这个痛点。**

**⑤ 调性诚实。** "Neither fact says you will rank; both say the attempt is not obviously blocked"、"Grouping is lexical, which makes it a suggestion and not a site structure"、FAQ 里直接承认「约四分之一的站跑回来是空的，凑数才是不诚实的答案」。

## 7.2 ❌ 三个削弱结果价值的问题

### 问题 1：`Terms that could share one page` 分组，5 组里 3 组是错的

```
❌ synastry chart calculator + transit chart calculator
     合盘（关系）vs 行星过境（时间），意图完全不同
❌ astrology chart comparison + relocation chart astrology
     比对两张盘 vs 换地点重算
❌ relocation astrology calculator + electional astrology calculator
     换地 vs 择时
✅ can an astrology journal support self reflection + how can astrology help with self reflection
✅ relationship astrology chart + composite relationship chart（勉强成立）
```

**根因**：分组是**词汇层面**的（都含 "chart calculator" / "astrology calculator"）。工具自己写明了：*"proving two terms belong on one page needs **the page-one overlap this run does not fetch**"*。

> **它知道正确做法，但没做。** 而选词规则第八节的判据正是这个：**两个词的 SERP 前十高度重合 → 同一个意图。**
>
> 这与 PRD §7.3.2 记录的 `transit` 子串匹配假阳性，是**同一类错误的两次出现**。

### 问题 2：结果拿不走、不排序、有噪音

| 缺陷 | 实况 |
|---|---|
| **无导出** | 全页找不到任何 CSV / 复制 / 下载按钮。**15 条结果只能手抄** |
| **不排序** | 量级 22,200 的 `relationship astrology chart` 排在第 8 位，用户得自己扫完 15 行 |
| **重复噪音** | `CHECK BEFORE ACTING` 列每行都是同样 3–4 条通用检查，**16 行完全一样，占表格约一半宽度** |

### 问题 3：`Questions your site already answers` 不知道拿来干什么

12 条提问式短语，**全部**指向 `/en/tools` 和 `/en/about` 两个页面，无搜索量，`YOUR COVERAGE` 全是 "Not in your query sample"，`CHECK BEFORE ACTING` 又是同样 4 条。

**它没有回答用户最想知道的**：这些提问是否真有人问？是否已被 AI 引用？该不该为它单独建页面？

## 7.3 使用过程的五个问题

| #     | 问题                 | 实况                                                                                                                                   |
| ----- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| **1** | 🔴 **错误文案与真实原因不符** | API `POST /api/tools/hidden-keywords/context` 返回 **HTTP 429（限流）**，页面显示的是 `Something went wrong on our side.` **用户会以为是产品故障，而不是自己点太快** |
| **2** | 🔴 **看不到额度**       | 错误文案说 "Nothing was charged"，暗示存在计费/额度，但**全页找不到任何剩余次数或用量显示**（已用可访问性树全量检索确认）                                                           |
| **3** | **无冷却提示**          | 连点两次即触发限流。按钮不禁用、无倒计时、无「请等待 X 秒」提示。等约 75 秒后恢复正常                                                                                       |
| **4** | 命名不一致              | 静态说明区叫 `Where the rest went`，实际结果区叫 `Held back, and why`                                                                             |
| **5** | 只读 14 页            | 说明写了 "Up to fourteen pages, product pages first"，是设计不是 bug。**但候选词全部来自这 14 页**，对有几百页的内容站样本偏小                                          |

**运行耗时实测**：一阶段读站约 8–20 秒；二阶段完整跑完约 2 分钟（与页面提示一致）。

## 7.4 建议的修复优先级

| 顺序 | 事项 | 成本 | 理由 |
|---|---|---|---|
| **1** | **429 换成真实文案 + 加冷却倒计时** | 极低 | 现在每个手快的用户都会以为产品坏了 |
| **2** | **加导出（CSV / 一键复制）** | 低 | 结果拿不走，这次运行的价值只存在于这一屏 |
| **3** | **结果按机会强度排序**（建议 `量级 ÷ 最弱站权重`） | 低 | 22,200 那条不该排第 8 |
| **4** | **让 `page-one 预算没跑到` 的 32 个可继续** | 中 | **29% 的候选压根没被评估**，最大的价值漏损 |
| **5** | **`CHECK BEFORE ACTING` 去重** | 极低 | 改成表格上方一次性说明，把宽度还给数据 |
| **6** | 分组改用 SERP 前十重合验证 | 高 | 工具自己已指出正确做法；可先降级为「疑似可合并，未验证」 |
| **7** | 显示剩余额度 | 低 | 与第 1 项一起做 |

> **第 1、2、3、5、7 项合计成本很低，但覆盖了实测中最影响体验的全部问题。**

---

---

# 八、结果可信度复核与产品方向（2026-08-14 追加）

## 8.0 全量复核：15 条结果逐条实搜，准确率 53%

**第 7.1 节写的「确实挖到了真机会」说得太满。** 把工具输出的**全部 15 条**拿去 Google 实搜（`num=15&hl=en&gl=us&pws=0`），按选词规则第一节三问逐条判：

| # | 词 | 量 | 工具说<br>最弱权重 | 判定 | 关键证据 |
|---|---|---:|---:|---|---|
| 1 | **relationship astrology chart** | **22,200** | 24 | ❌ **可疑** | Astro-Seek · Cafe Astrology · Astro.com · Prokerala · Astrotheme 锁死；**有 AI Overview**；唯一 UGC 是 10 年前的 Reddit 帖 |
| 2 | **sun sign calculator** | **3,600** | 97 | ❌ **可疑** | **Britannica 排第 4**；Cafe Astrology / AstroSage / Astroyogi / Astrotalk；**无 UGC 位、无新站** |
| 3 | transit chart calculator | 3,600 | 0 | ✅ | AskNova · AppliedJyotish · Upastrology · Astroica **四个小站**；无 AIO |
| 4 | synastry chart calculator | 2,900 | 55 | ✅✅ | **AskNova（2025-08-27）第 3**、**synastrychart.org（2025-10-16）第 7**；Reddit 第 4 |
| 5 | solar return calculator | 590 | 55 | ✅✅ | **Augurine（2026-02-26，域名 6 个月）第 8**；AskNova 第 3 |
| 6 | relocation chart astrology | 590 | 0 | ✅✅ | **三个 UGC**（Reddit/Tumblr/Substack）+ astrocarto.org / astrocarto.net / asknova 子域 |
| 7 | astrology houses explained | 320 | 52 | ✅ | Reddit + YouTube 两个 UGC；belacrowder.com 个人站 |
| 8 | composite relationship chart | 70 | 55 | ✅✅ | **三个 UGC**（Reddit/Medium/Tumblr）+ AskNova + lookupthestars / essentialzodiac |
| 9 | synastry compatibility calculator | 70 | 55 | ✅✅✅ | **三个近两年域名**（AskNova 2025-08、synastrychart.org 2025-10、Augurine 2026-02）+ Reddit |
| 10 | relocation astrology calculator | 70 | 0 | ✅✅ | 四个小站 + Reddit/Substack 两个 UGC |
| 11 | astrology chart comparison | 70 | 105 | ⚠️ 偏弱 | 前排全是占星老站；有 Reddit/Medium 但量级仅 70 |
| 12 | electional astrology calculator | 90 | 62 | ⚠️ | SERP 有缝（Augurine 第 2），**但 AIO 直接列出了三个免费工具** |
| 13 | best places to live astrology | 20 | **197** | ⚠️ | **SERP 本批最宽**（Reddit/YouTube/Substack/Facebook 四个 UGC + 三个个人站）**但量级仅 20** |
| 14 | free big three calculator | 10 | 0 | ⚠️ | SERP 有缝（zodiscope.io / nextastrology），**但量级 10 = 噪音** |
| 15 | swiss ephemeris birth chart | 10 | — | ⚠️ | **有 AIO + 意图混杂**（GitHub 排第 6，含开发者意图）+ 量级 10 |

```
✅ 判断正确（说有机会，实测确有）      8 / 15  =  53%
❌ 判断错误（说有机会，SERP 实际锁死）  2 / 15  =  13%
⚠️ 技术无错但无价值（量级过低/有AIO/意图混杂）  5 / 15  =  33%
```

> **准确的说法是：量级最大的两条判断错误，中小量级（70–3,600）的八条是真的，另有三分之一是不该出现在表里的噪音。**

## 8.1 🔴 复核暴露的三个盲点

### 盲点 0：「最弱权重」这个单一指标被两个反例直接证伪

| 词 | 工具给的最弱权重 | 实际 SERP |
|---|---:|---|
| `best places to live astrology` | **197（本批最高）** | **本批最宽** —— 四个 UGC 位 + 三个个人站 |
| `relationship astrology chart` | **24（很低）** | **被锁死** —— 全是占星工具老站 + AI Overview |

**指标与现实完全反向。** 这不是噪音，是指标设计本身的问题：

> **它只回答「第一页最弱的那个有多弱」，不回答「第一页整体有多难」。**

**另一条清晰规律**：量级最大的两条（22,200 / 3,600）**全部判断错误**；判断正确的八条量级全部落在 **70–3,600** 之间。**量级越大，这个指标越不可靠。**

### 盲点 1：只看「最弱域名的权重」，不看它排第几，也不看 SERP 整体构成

`relationship astrology chart` 的「最弱权重 24」很可能来自排第 10 的某个站。

> **一个权重 24 的站排第 2，和排第 10，是完全不同的两件事。** 后者可能只是靠某个长尾变体挤进去的。

而这个 SERP 按**选词规则第二节**是典型的**「品类级标配免费工具词」**——合盘计算器几十家在免费提供。规则明写：**这类词换形态也救不回。**

**工具把「第一页存在弱站」当成了充分条件，而选词规则从来是「三问 + 看位置 + 看 SERP 构成」。**

### 盲点 2：完全不检测 AI Overview（15 条里有 3 条命中）

**全量复核发现三条结果的 SERP 上有 AI Overview，工具一条都没标记：**

| 词 | AIO 内容 |
|---|---|
| `relationship astrology chart` | 讲完了 synastry / composite / Davison 三种关系盘的定义与区别 |
| `electional astrology calculator` | **直接列出 Astro-Seek、Astro.com、Augurine 三个可用的免费工具**——搜索者不需要点进任何结果 |
| `swiss ephemeris birth chart` | 讲完了 Swiss Ephemeris 是什么、精度来源、如何获取 |

而**选词规则第五节的整个 CTR 基准体系就建立在 AIO 之上**：排名 7–10 且有 AIO 时 CTR 只剩 **0.65–0.78%**；有 AIO 的查询整体 CTR 约 **0.64%**。

**这意味着工具会把「排得上但拿不到点击」的词当成机会推给用户。**

> 📌 PRD §7.3 早就写了「**AIO 高风险定义词必须加工具/表格/对比**」——方法论里有，产品里没有。

### 盲点 3：结果表没有量级下限

15 条里 **5 条量级 ≤ 90**，其中 **2 条只有 10**（`free big three calculator`、`swiss ephemeris birth chart`）。

**这两条占了 13% 的结果位，但任何用户看到都会直接跳过。** 而它们挤掉的位置本可以给那 32 个「预算没跑到」的候选。

### 修复建议（按成本排）

| # | 动作 | 成本 | 对应盲点 |
|---|---|---|---|
| 1 | **结果表增加「最弱站的排名位置」一列** | 低——数据在采样时已经有了 | 0、1 |
| 2 | **加量级下限过滤**（建议 ≥50，或至少把 <50 折叠） | **极低** | 3 |
| 3 | **增加 AI Overview 存在标记** | 中——page-one 采样时多记一个字段 | 2 |
| 4 | 增加「SERP 构成」摘要（几个大站 / 几个小站 / 有无 UGC 位） | 中——**这就是选词规则三问的自动化** | 0、1 |

> **第 4 项是根本解**。前三项是补丁，第 4 项才是把「最弱权重」这个单点指标换成选词规则的三问模型。

---

## 8.2 方向一：把 GSC 从「排除器」改成「发现器」🔴 优先做

**现状**：工具已连 GSC，但只用它判断「这个词你的站是不是已经在服务」（`YOUR COVERAGE` 列）。**这是当排除器用。**

**建议改成发现器：**

```
拉 GSC 全部查询（近 3–12 个月）
  → 聚类成主题
  → 对照第一阶段「读站」得到的产品陈述
  → 找出：产品能服务的主题 ∩ GSC 里零查询的  =  内容缺口
```

**三个优势：**

1. **GSC 查询是真实需求**，不是 LLM 从 14 页里猜出来的
2. **自带曝光与排名**，能区分「已覆盖但排名差」和「完全没覆盖」——这是两种完全不同的动作
3. **不受抓取页数限制**——直接解决 7.3 节「只读 14 页」那条

⚠️ **必须写进产品文案的限制**：**GSC 查询表只覆盖约 75% 的展示**（隐私阈值过滤长尾），所以「零查询」不等于「零需求」。

### 顺带修一个现有区块

现在的 `Questions your site already answers`（你的站已经回答的问题）实测下来不知道拿来干什么——12 条全部指向 `/en/tools` 和 `/en/about`，无搜索量，无可行动信息。

> **反过来那个才有价值：你的站还没回答的问题。** 而那正好就是本节说的内容缺口。

---

## 8.3 方向二：竞品关键词对比 —— 可做，但别只做成 content gap

**两个现实约束：**

| 约束 | 说明 |
|---|---|
| **数据成本** | 现在用的 provider 是查**搜索量**的。查「某域名排名的全部关键词」是另一类数据，**贵一个量级** |
| **竞争** | Content Gap 是 Semrush 的招牌功能之一，成熟度很高 |

**所以差异化不能是「也有缺口表」，而应该是：**

> **别人给你缺口词，我们给「这个缺口你能不能打」。**

把竞品缺口词直接接进现有的 `WEAKEST RANK` + SERP 三问管道：**竞品有而你没有的词，先过一遍"第一页有没有弱站"，过不了的直接标掉**——不要让用户对着两千行的缺口表发呆。

**这同时补上了 8.1 的盲点：缺口 + 可打性，两个信号一起给。**

⚠️ 注意：选词规则第七节把 `content gap analysis`（教学型）列入黑名单，那说的是**这个词打不动**，**不是这个功能不该做**。两回事。

---

## 8.4 方向三：AI 联想 —— 已经在做，问题是输入太窄

**第一阶段的「读站」就是这件事**：读 14 页 → 提取产品陈述 → LLM 生成候选词。FAQ 里 `Are AI-generated candidates enough?` 就是在回答它。

**但实测显示联想半径太小。** 本次生成的候选全部贴着「占星计算器」这一个品类：

```
synastry chart calculator · transit chart calculator · solar return calculator
relocation astrology calculator · electional astrology calculator
composite relationship chart · astrology chart comparison
```

**而 astrologywiki 的产品陈述里明明有 "CBT journal"、"self-knowledge and reflection"、"modern psychology"——这些方向一个词都没生成出来。**

> **问题不是「能不能用 AI 联想」，是「联想的输入太窄」。**

| 现在的输入 | 建议增加 |
|---|---|
| 14 页产品陈述 | + **GSC 查询主题**（8.2） |
| | + **竞品关键词**（8.3） |
| | + **「你还没回答的问题」**（8.2 末） |

---

## 8.5 排期建议

| 顺序 | 方向 | 理由 |
|---|---|---|
| **1** | **8.2 GSC 改发现器** | **唯一不增加数据成本的改进**——数据已授权、已在用。且同时解决「只读 14 页」和「AI 联想半径小」两个问题 |
| **2** | **8.1 修复 1、2 项**（最弱站排名位置 + AIO 标记） | 直接影响结果可信度。第 1 项数据现成 |
| **3** | 8.4 扩大联想输入 | 依赖 8.2 完成 |
| **4** | 8.1 第 3 项（SERP 构成摘要） | 选词规则三问的完整自动化 |
| **5** | 8.3 竞品对比 | **唯一需要新采购数据的**，放最后 |

---

*静态结构审计执行 2026-08-14，页面实抓 + `curl | grep` 验证 Schema（WebFetch 读不到 head，不可用）。*
*实测使用反馈同日完成，含网络层验证（读取 API 响应码定位 429）。*
*结果可信度复核同日完成，方法为 Google 实搜 `num=15&hl=en&gl=us&pws=0` + 选词规则第一节三问，抽样 3 个词。*
