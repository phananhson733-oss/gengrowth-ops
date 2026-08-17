---
title: P0-5 Low Competition Keyword Finder · 实测审计
date: 2026-08-12
工具: https://gengrowth.ai/tools/low-competition-keywords
方法: 授权态下用 gengrowth.ai 自身跑一次完整流程，逐屏记录
对照标准: 2026-07-09-工具落地页设计规范-sop-v1.0.md + 2026-08-11-选词规则-v1.md
---

# P0-5 实测审计

## 零、先纠正我自己两处误判

**① 8/12 早些时候我根据 `curl` 判断"仍是 Waitlist、无输入框、609 词"——这是错的。**
表单是**客户端渲染 + 需授权**，服务端 HTML 里看不到。**工具已完整上线且可用。**

**② 我一度把 `WEAKEST RANK` 读成排名位置，据此判断"171 名不在第一页、结果自相矛盾"——也是错的。**
页面上写得很清楚：*"Weakest rank is the lowest domain authority currently holding a page-one place, on the provider's 0–1000 scale."*
**它是第一页上最弱站点的域名权重（0–1000），数字越低越是好信号。定义就印在表格下方，我没读就下了判断。**

---

## 一、工具形态（与原设计的偏差）

| | 原设计（2026-07-29 文档） | 实际上线 |
|---|---|---|
| 授权 | **不需要 OAuth**，种子词 + 网址即可 | **需要 GSC 授权**（有 Search Console Property 下拉） |
| 输入 | 种子词（选填）+ 网站 URL | GSC 属性 + 站点 URL + 市场 + 语言 + 种子词（选填，≤10 个） |

> ⚠️ **这个偏差影响推广口径**：P0-5 原本被归为"爬取型、低摩擦入口"，实际是**授权型**。招募话术里如果按"贴个网址就能用"写，用户会卡在授权步骤。

---

## 二、✅ 做得好的四处（值得保留并复用到其他工具）

### 2.1 出结果前先确认"我读懂你了没有"

跑完先展示 **"What we read off your site"**：读了 11 页、其中 2 个像产品页，并列出提取到的业务描述句 + 来源 URL。

> 原话：*"The candidate keywords are generated from these statements, so it is worth checking they describe your business before spending the search-data budget."*

**这一步解决了"AI 理解错了但用户不知道"这个根本问题**，而且放在花费搜索数据配额之前。**这是四个工具里唯一有"前置确认"环节的**。

### 2.2 认知诚实做得比我们其他工具都好

页面上的几处措辞：

- *"Neither fact says you will rank; both say the attempt is not obviously blocked."*
- *"A low number means somebody small is already there — **which is evidence, not a promise**."*
- 第二张表标明 *"No search volume is claimed for these."*
- 覆盖度写 *"A page looks related, **unverified**"*

**它明确区分了"证据"和"承诺"**，这正是我们一直强调、但其他工具页没做到的。

### 2.3 漏斗透明

结果上方给出六个数：`Priced at zero 0` · `Has search volume 32` · `Already served 0` · `Page one sampled 20` · `Weak site on page one 8` · `Shown 34`。

**用户能看到"从多少候选筛到多少"**，而不是只给一个结果列表。

### 2.4 两类结果分开，不混淆

- **表一「Search terms with measured demand」**：有 volume / KD / weakest rank
- **表二「Questions your site already answers」**：无搜索量，匹配到已有页面，明确声明不认领量级

**把"有数据支撑的"和"只是语义匹配的"分开，避免用户误以为后者也有需求验证。**

---

## 三、🔴 三个需要改的

### 3.1 `CHECK BEFORE ACTING` 是完全相同的静态文案

**每一行的这一列内容一模一样：**

```
Open page one and read what those results actually answer
Check whether the weak site that ranks is defendable or abandoned
Decide whether this demand is your buyer
```

`on page seo audit`（KD 73）和 `small business seo audit`（KD 29、volume 10）拿到的建议**逐字相同**。

> **这就是"停在观测、没走到判断"的最直接证据。** 工具已经拿到了 volume、KD、weakest rank 三个维度，**完全有条件给出分档建议**（例如 KD 73 + volume 170 应该直接标记为"不建议"，而不是让用户自己去"decide"）。

**建议**：按我们自己的选词规则（`2026-08-11-选词规则-v1.md`）给每行一个明确判定——**能打 / 有缝 / 否决**，并给出该行专属的一句理由。

### 3.2 漏斗数字与展示数量对不上，需要解释

`Weak site on page one = 8`，但 `Shown = 34`。

而工具的 H1 承诺是 *"keeps only the ones whose page one a small site has already broken into"*（只保留第一页已有弱站的词）。

**34 里有多少是真正满足这个条件的？** 表格里没有任何标记区分。用户看到 34 条，会默认它们都通过了这个筛选。

> **可能的解释**：`Shown 34` 包含了第二张表（"Questions"，无搜索量那类）。**但界面上没有说明，需要澄清或拆分显示。**

### 3.3 `YOUR COVERAGE` 几乎全是 `Not in your query sample`

绝大多数行显示 "Not in your query sample"，**GSC 授权带来的信息增量在结果里几乎看不见**。

**这是个体验落差**：用户为此走了 OAuth 流程（我们已知这是最大的摩擦点），却看不到授权换来了什么。

**建议**：要么在结果里更明确地体现 GSC 数据的价值（例如"你已有 N 个词在排名，这些是尚未覆盖的"），要么在授权前说清楚 GSC 数据只用于"排除你已经覆盖的词"。

---

## 四、与我们自己选词规则的一致性检查

拿工具返回的词，对照 `选词规则-v1`：

| 关键词 | Volume | KD | Weakest DA | 按我们的规则 |
|---|---:|---:|---:|---|
| `on page seo audit` | 170 | **73** | 171 | ⚠️ KD 73 属高竞争，**规则会要求先看 SERP 三问再定** |
| `seo crawler tool` | 260 | 26 | **71** | ✅ 弱站 DA 71 在第一页，是好信号 |
| `small business seo audit` | 10 | 29 | 0 | ⚠️ 量级 10，**规则里属于"量太小"** |
| `organic search analytics` | 40 | 0 | 180 | ⚠️ 量级 40 |

**结论：工具给的是候选池，不是筛选结果。** 它做了"有没有弱站"这一层验证，但**没有做量级门槛和 KD 门槛的排除**——而这两层我们自己的规则里是有的。

> **这与 3.1 是同一个问题：有数据，没判断。**

---

## 五、落地页结构（对照 SOP）

| 项 | SOP 要求 | 实际 |
|---|---|---|
| 面包屑 | 需有 | ✅ HOME / FREE SEO TOOLS / … |
| H1 含主词 | 必须 | ✅ `Find low competition keywords with a weak site already on page one` |
| 主词覆盖 | — | ✅ `find low competition keywords` 全页 8 次 |
| 使用指南区块 | 需有 | ✅ "How the map decides what to show you" + 编号步骤 |
| 字数 | 2000–3500 | ⚠️ 服务端可见文案约 609 词，**但工具主体是客户端渲染，未计入**；需在授权态下重测 |
| FAQ | 8–10 条 | ❓ 本次未见，需确认 |
| Schema | 4 类 | ❓ 需 curl 复核 |

> **字数与 FAQ 两项本次未能准确测量**（客户端渲染导致 curl 口径失真），标记为待补，不下结论。

---

## 六、优先级建议

| 优先级 | 事项 | 理由 |
|---|---|---|
| **1** | **`CHECK BEFORE ACTING` 改为按行分档判定** | 这是"观测 vs 判断"的核心缺口，也是我们相对 Okara 的差异化所在。**数据已经有了，只差判断逻辑** |
| 2 | 澄清 `Shown 34` 与 `Weak site on page one 8` 的关系 | 现状会让用户误以为 34 条都通过了核心筛选 |
| 3 | 补量级 / KD 门槛的排除层 | 让工具输出"筛选结果"而非"候选池" |
| 4 | 体现 GSC 授权的价值，或在授权前说清楚它的用途 | 授权是最大摩擦点，不能让用户觉得白授权了 |
| 5 | 更新推广口径：**P0-5 是授权型，不是免登录型** | 影响招募话术 |

---

## 七、一句话总结

> **P0-5 的认知诚实和前置确认做得比我们其他三个工具都好，但它止步于"给你一个候选池"——而我们的差异化承诺是"告诉你哪些值得做"。**
>
> **改一列（CHECK BEFORE ACTING），就能把它从观测工具变成判断工具。数据已经齐了。**
