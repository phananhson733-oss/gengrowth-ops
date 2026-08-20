---
title: Reddit 回答稿 · r/Agentic_SEO「188 cited pages but only 24 mentioned」
date: 2026-08-18
类型: 回答（非发帖）
目标帖: r/Agentic_SEO · `188 cited pages but only 24 mentioned, How do I increase brand mentions in Ai overview` · 9 条评论
用材: A 组 + 周报 2.2 —— 186 次 AI 引用中 51 次（27%）落在死链，最高的一条 43 次也是死链
状态: 待发
---

# Reddit 回答稿 · AI 引用数 vs 品牌提及数

## 一、对方问的是什么

他的工具截图显示：

| | 提及 | 被引用页面 |
|---|---:|---:|
| ChatGPT | 1 | 77 |
| AI Overview | 3 | 47 |
| AI Mode | 9 | 118 |
| Gemini | 11 | 35 |
| **合计** | **24** | **188** |

**问题**：页面被引用 188 次，品牌只被提及 24 次，**怎么提高 AI 摘要里的品牌提及**。

## 二、我们能诚实提供什么

**⚠️ 先说清楚：「怎么提高提及数」我不知道，不能装知道。**

**但我们有一条他大概率没查过的东西——那 188 个引用指向哪里。**

我们自己的实测：

```
过去 3 个月  AI 功能引用       186 次
其中          指向已废弃的死链   51 次 = 27%
              被引用最多的第 1 名（单独 43 次）也是死链
```

**这构成一个可检验的假设**：指向死链的引用，模型读不到落地内容，**大概率也产生不了品牌提及**。

**这个假设我证不了，但排除它只要五分钟**——把被引用的 URL 导出来跑一遍状态码。

---

## 三、回答稿（英文，可直接粘贴）

```
I don't have an answer on the mentions side. But before optimizing that ratio
I'd check where the 188 citations actually land.

On a site I look after, GSC reported 186 citations from AI features over three
months. When I pulled the URL list, 51 of them, 27%, pointed at pages that had
been retired and now redirect. The single most cited URL in the whole set, 43
citations on its own, was one of those.

I can't prove a citation to a dead URL is worth less than one to a live page.
But it would explain part of a gap like yours, and it's cheap to rule out.
Export your cited URLs and run them for status codes. If a chunk of yours are
redirecting or 404ing, your real footprint is smaller than 188 and some of those
citations have nothing readable at the other end.

The other thing worth knowing is that you can't close the loop on any of this
right now. GSC gives impressions for AI features but no clicks, so there's no
way to tell whether more mentions produces more visits. I've been treating the
citation count as directional only.

One site, three months, so take the 27% as an example rather than a benchmark.
```

**约 200 词。**

---

## 四、为什么这么写

### 4.1 开头就说「我不知道」

> **I don't have an answer on the mentions side.**

**他问的是提及数，我答不了。** 装作能答、绕个圈子给一堆通用建议（加 schema、做实体优化、建品牌词），**在这个版块会被一眼看穿**——那些话满网都是。

**先承认答不了，再给一条别人没给的，可信度反而更高。**

### 4.2 给的是可执行的排除法，不是理论

「导出被引用的 URL，跑一遍状态码」——**五分钟能做完，而且结果是二元的**：要么有一批死链，要么没有。

**他做完会回来说结果。这是这条回答最可能引出真讨论的地方。**

### 4.3 假设标成假设

> **I can't prove a citation to a dead URL is worth less than one to a live page.**

**我确实证不了。** 这条如果写成断言，被人一问"你怎么证明的"就塌了。

标成假设反而更强——**因为它给出了一个可证伪的检验方法**，而不是一个说法。

### 4.4 补了一条他没问但更要紧的

> **GSC gives impressions for AI features but no clicks.**

**他在优化一个自己无法验证结果的指标。** 提及数从 24 涨到 48，他也不知道有没有带来一个访问。

这一条我们自己踩过——周报里写过「这个收益量化不了」。**说出来对他有实际价值，而且不需要任何证明。**

---

## 五、发布前自查

| # | 检查 | 结果 |
|---|---|---|
| 1 | 数字标明窗口和样本量？ | ✅ `over three months` · `186 citations` · `one site` |
| 2 | 品牌名 / 工具名 / 链接？ | ✅ 零 |
| 3 | 人设：第一人称单数，无 `we` | ✅ 全文 `I`，用 `a site I look after` |
| 4 | 本周该版块发过帖吗？ | ✅ **回答不占发帖配额** |
| 5 | 材料在别处用过吗？ | ✅ 首次 |
| 6 | ⚠️ **r/Agentic_SEO 版规「No Blogs」** | ✅ 无任何链接，纯文本 |

### AI 痕迹六项

| 手法 | 本稿 |
|---|---|
| 对偶格律 | ✅ 无 |
| 否定+肯定成对 | ✅ 无 |
| 破折号纠正式 | ✅ 无 |
| 三重排比 | ✅ 无 |
| 段末金句 | ✅ 结尾是样本量声明，不是金句 |
| 破折号密度 | ✅ **0 处** |

---

## 六、发出之后

| 情况 | 怎么办 |
|---|---|
| **他跑完状态码回来报结果** | 🔴 **这是最有价值的分支。** 不管有没有死链都追问一句他的数字，**这是我们目前拿不到的外部样本** |
| 有人问"死链为什么会被引用" | 如实说：模型的训练/检索快照落后于站点变更。**我们那 7 个死链是迁移时跳转配错留下的**，不是故意的 |
| 有人问 GSC 到底给不给 AI 点击 | 确认：只给曝光。**这一条可以展开，是 A2 素材（效果报告 ≠ 抓取统计）的近亲** |
| 有人推销 AI 可见度工具 | 不参与 |

**⚠️ 任何后续都不提工具或产品，也不提任何域名。** 我们上 Reddit 是来分享实测发现的，不做引流。
