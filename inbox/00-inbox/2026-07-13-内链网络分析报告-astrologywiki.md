---
title: AstrologyWiki 内链网络分析报告
date: 2026-07-13
数据来源: 全站 sitemap 爬取 + 逐页内链抓取（311篇英文 Blog）
status: final
---

# AstrologyWiki 内链网络分析报告

> 覆盖范围：311 篇 `/en/wiki/*` 英文 Blog + 27 个工具/功能页
> 爬取时间：2026-07-13
> 方法：抓取每页 HTML，提取所有 `href` 属性中的站内链接

---

## 一句话结论

**内链网络正在帮错误的页面积累权重。** 192 篇文章把权重喂给了 `/en/wiki/how-to-read-birth-chart`（一篇教程博客），而真正需要权重的 `/en/birth-chart-calculator` 工具页只收到 12 条入链。与此同时，62% 的文章（194篇）是零入链孤岛，包括几乎所有 celebrity 趋势内容。

---

## 一、关键数据总览

| 指标 | 数值 | 评级 |
|---|---|---|
| 总爬取页面 | 311 篇 | — |
| 有工具页链接的文章 | **12 篇（3.9%）** | 🔴 极差 |
| 有 birth-chart-calculator 链接 | **12 篇（3.9%）** | 🔴 极差 |
| 完全没有工具链接 | **299 篇（96.1%）** | 🔴 极差 |
| 零入链孤岛文章 | **194 篇（62.4%）** | 🔴 极差 |
| how-to-read-birth-chart 入链数 | **192 条** | 🚨 Bug 信号 |
| birth-chart-calculator 实际入链数 | **12 条** | 🔴 极差 |
| Blog 文章平均 wiki 出链数 | **3.7 条** | 🟡 偏低 |

---

## 二、最大 Bug：192 篇文章的权重流向了错误页面

### 什么情况

全站 311 篇 Blog 中，**192 篇包含指向 `/en/wiki/how-to-read-birth-chart` 的链接**——这个数字是 `birth-chart-calculator` 工具页入链数（12条）的 **16 倍**。

这不是正常的内链分布，这是一个系统性的内链错误 Bug。

### 为什么是 Bug

`/en/wiki/how-to-read-birth-chart` 是一篇普通的教程博客文章。根据 CTA 架构设计，所有"Generate / Calculate / Try"类按钮的链接目标应该是 `/en/birth-chart-calculator`（工具页），而不是这篇教程文章。

**实际发生的情况推断**：文章模板中的 CTA 按钮，或者文章中段某个"learn how to read your birth chart"类的固定锚文本链接，硬编码指向了 `/en/wiki/how-to-read-birth-chart`，而不是工具页。

### 后果

```
正确应该发生的：
311 篇 Blog → 工具页（birth-chart-calculator）
                   ↑ 积累 PageRank → 工具页有排名能力

实际发生的：
192 篇 Blog → /en/wiki/how-to-read-birth-chart（一篇教程博客）
                   ↑ 积累 PageRank → 教程博客有排名能力
12 篇 Blog  → /en/birth-chart-calculator（工具页）
                   ↑ 几乎没有 PageRank
```

`/en/wiki/how-to-read-birth-chart` 目前是全站权重最高的页面，但它是一篇博客，不是工具页。这也解释了为什么占星核心词排名惨淡——工具页没有收到应有的内部权重支持。

### 修复优先级：**P0，本周必须修复**

将所有 192 篇文章中指向 `/en/wiki/how-to-read-birth-chart` 的 CTA 链接目标，改为 `/en/birth-chart-calculator`。

这是一次模板级修改，一次改动覆盖 192 篇文章，修复后工具页的内链数量从 12 条直接跳升到 200+。

---

## 三、工具页内链覆盖现状

### 3.1 各工具页获得的内链数量

| 工具页 | 获得入链数 | 覆盖文章占比 |
|---|---|---|
| `/en/birth-chart-calculator` | 12 篇 | 3.9% |
| `/en/moon-sign-calculator` | 2 篇 | 0.6% |
| `/en/rising-sign-calculator` | 2 篇 | 0.6% |
| `/en/solar-return-calculator` | 1 篇 | 0.3% |
| `/en/big-three-calculator` | 1 篇 | 0.3% |
| `/en/synastry-calculator` | 0 篇 | 0% |
| `/en/composite-calculator` | 0 篇 | 0% |
| `/en/saturn-return-calculator` | 0 篇 | 0% |
| `/en/ephemeris-calculator` | 0 篇 | 0% |

**结论**：绝大多数工具页与 Blog 网络完全断开，没有任何内链权重流入。

### 3.2 当前 12 篇有工具链接的文章

这 12 篇是近期新发布的文章，说明在 Bug 被发现后，新文章已经开始修复链接目标：

| 文章 | 工具链接 |
|---|---|
| erling-haaland-birth-chart | birth-chart + moon + rising（3个工具）|
| harry-kane-birth-chart | birth-chart + solar-return + rising（3个工具）|
| lionel-messi-zodiac-sign | birth-chart + moon（2个工具）|
| zodiac-signs-as-world-cup-2026-teams | birth-chart + big-three（2个工具）|
| antoine-griezmann-birth-chart | birth-chart |
| karolina-muchova-birth-chart | birth-chart |
| mikel-merino-birth-chart | birth-chart |
| priyanka-chopra-birth-chart | birth-chart |
| quinta-brunson-birth-chart | birth-chart |
| rodri-birth-chart | birth-chart |
| sinner-vs-zverev-wimbledon-final-astrology | birth-chart |
| spain-vs-france-world-cup-2026-astrology | birth-chart |

---

## 四、孤岛文章分析（194篇，62%）

### 4.1 什么是孤岛

孤岛 = 在站内没有任何其他文章指向它的页面。孤岛文章：
- 搜索引擎爬虫只能通过 sitemap 发现，不会通过内链爬到
- 收不到任何来自其他页面的 PageRank 传递
- 在 Google 眼中是"低价值孤立内容"

### 4.2 孤岛文章分类分析

**Celebrity / 趋势内容（孤岛比例最高）**

几乎所有 celebrity 内容都是孤岛——这是最值得优化的群体，因为这些文章是流量入口，但没有互相连接：

```
arthur-fery-birth-chart            ← 本周 Top 流量，但零入链
achraf-hakimi-birth-chart
alexander-zverev-birth-chart
angela-nikolau-birth-chart
anne-hathaway-birth-chart
ayo-edebiri-birth-chart
bella-hadid-birth-chart
ben-shelton-zodiac-sign
coco-gauff-birth-chart / coco-gauff-zodiac-sign   ← 同一人两篇，互不链接
cristiano-ronaldo-zodiac-sign
darwin-nunez-zodiac-sign
elliot-page-birth-chart
jannik-sinner-zodiac-sign
jaylen-brown-birth-chart
lamine-yamal-birth-chart / lamine-yamal-zodiac-sign  ← 同一人两篇，互不链接
lebron-james-birth-chart
luka-modric-zodiac-sign
mbappe-birth-chart                 ← 注意：mbappe 有两篇文章（重复）
marcus-rashford-zodiac-sign
mo-salah-birth-chart / mo-salah-zodiac-sign
novak-djokovic-zodiac-sign
...（共约 80 篇 celebrity 相关）
```

**占星基础概念页（孤岛）**

这些是核心占星词的潜力页面，却没有入链：

```
aquarius / aries / capricorn / leo / sagittarius / scorpio / taurus / virgo  （星座词）
ascendant / midheaven / north-node / south-node / pluto / neptune / uranus / mars / moon / saturn
natal-chart / composite-chart / synastry-chart
conjunction / opposition / modes / four-elements / earth-element / water-element / air-element / fire-element
```

**这些页面应该是全站的权重 Hub**，但因为没有入链，它们比大多数趋势内容还要弱。

**World Cup 趋势内容（部分孤岛）**

```
egypt-world-cup-2026-astrology
colombia-vs-portugal
jordan-vs-argentina
mexico-vs-england-astrology-prediction
morocco-world-cup-2026-astrology
scotland-brazil-world-cup-astrology
scotland-world-cup-2026-astrology-saturn-return
spain-world-cup-2026-astrology
```

---

## 五、现有内链权重集中点（流量"富人"）

### 5.1 入链最多的 25 个页面

| 排名 | 页面 | 入链数 | 性质 |
|---|---|---|---|
| 1 | `/en/wiki/how-to-read-birth-chart` | **192** | 🚨 Bug 导致 |
| 2 | `/en/wiki/astrology-houses` | 48 | 占星基础概念 |
| 3 | `/en/wiki/ascendant-meaning` | 48 | 占星基础概念 |
| 4 | `/en/wiki/world-cup-2026-astrology-prediction` | 33 | 趋势聚合页 |
| 5 | `/en/wiki/north-node-vs-south-node` | 30 | 占星概念 |
| 6 | `/en/wiki/chakra-system-overview` | 22 | 脉轮体系 |
| 7 | `/en/wiki/transits` | 18 | 占星基础概念 |
| 8 | `/en/wiki/synastry-chart-compatibility` | 16 | 占星工具类 |
| 9 | `/en/wiki/9th-house-astrology` | 14 | 宫位系列 |
| 10 | `/en/wiki/astrology-terms` | 13 | 占星术语 |
| 11 | `/en/wiki/best-soccer-players-zodiac-sign` | 13 | 趋势聚合页 |
| 12 | `/en/wiki/12th-house-astrology` | 13 | 宫位系列 |
| 13 | `/en/wiki/saturn-in-aries-2026` | 10 | 时事占星 |
| 14 | `/en/wiki/aura-colors-guide` | 10 | 灵性内容 |
| 15 | `/en/wiki/8th-house-meaning` | 9 | 宫位系列 |

**发现**：
- 排名 1 完全是 Bug 导致的异常
- 排名 2-3（占星宫位 / 上升星座）是正常的占星基础权重聚合
- 排名 4、11 是 World Cup 聚合页，说明趋势内容之间有一定的内链汇聚
- 整个 TOP 25 中，**没有一个工具页**——工具页完全被排除在权重网络之外

### 5.2 当前内链网络结构图（文字版）

```
当前网络（有问题的结构）：

Blog 趋势内容（孤岛）
  haaland / messi / kane / arthur-fery / ...（~80篇）
  ↕ 互不链接
  
Blog 基础概念（孤岛）
  aquarius / natal-chart / ascendant / ...（~50篇）
  ↕ 互不链接

Blog 内链网络（192篇 → 错误目标）
  majority of articles → /en/wiki/how-to-read-birth-chart [WRONG!]

工具页（基本断开）
  /en/birth-chart-calculator ← 只有 12 条入链
  /en/moon-sign-calculator   ← 只有 2 条入链
  /en/rising-sign-calculator ← 只有 2 条入链


目标网络（应该的结构）：

                    ┌──────────────────────────┐
                    │  /en/birth-chart-calculator│  ← 权重 Hub
                    │  /en/rising-sign-calculator│
                    │  /en/moon-sign-calculator  │
                    └──────────┬───────────────┘
                               ↑ 内链传导
              ┌────────────────┴─────────────────┐
              │                                   │
     占星基础 Sub-Hub                    趋势内容（Spoke）
     astrology-houses (48 links)         celebrity birth charts
     ascendant-meaning (48 links)        world cup predictions
     natal-chart                         trending events
     transits                            ↓ 每篇都链接到工具页
     north-node-vs-south-node            ↓ 顺便链接到基础概念
              ↑ 内链传导
     
     所有其他 Blog 文章
```

---

## 六、现有 Hub 页面分析（出链最多）

当前出链最多的页面（有组织内链潜力的 Hub 候选）：

| 页面 | wiki 出链 | 工具出链 | 问题 |
|---|---|---|---|
| chakra-system-overview | 18 | 0 | 脉轮内容，不在占星主线上 |
| transits | 12 | 0 | 占星基础，但没有工具链接 |
| aura-colors-guide | 11 | 0 | 灵性内容，不在占星主线 |
| 2026-astrology-calendar | 10 | 0 | 有潜力，应加工具链接 |
| full-moon-energy | 10 | 0 | 满月内容，应链接 moon-phase-calculator |
| astrology-terms | 8 | 0 | 重要基础页，应加工具链接 |

**结论**：当前出链最多的 Hub 页面没有一个链接到工具页，Hub 的价值被浪费在内部 Blog 循环中。

---

## 七、行动计划（按优先级排序）

### P0：修复 192 篇文章的错误链接（本周，模板级）

**操作**：将所有文章中 `/en/wiki/how-to-read-birth-chart` 作为 CTA 链接目标的地方，改为 `/en/birth-chart-calculator`。

注意：`/en/wiki/how-to-read-birth-chart` 作为自然的文字内链（"learn how to read your birth chart"）可以保留，需要修改的是作为工具 CTA 目标的情况。

**预期效果**：birth-chart-calculator 的内链数从 12 → 200+，是当前的 16 倍。

---

### P1-A：为占星基础概念孤岛页面补内链（2周内）

以下页面是核心占星词的潜力页，却是零入链孤岛，需要优先从相关文章补入链：

| 目标页面 | 优先级 | 谁来链接它 |
|---|---|---|
| `/en/wiki/natal-chart` | 🔴 高 | 所有 celebrity birth chart 文章 |
| `/en/wiki/ascendant` | 🔴 高 | birth chart 相关文章（注意：ascendant-meaning 已有48入链，但 ascendant 这个页面是孤岛）|
| `/en/wiki/aquarius` / `aries` / `capricorn` 等 12星座 | 🔴 高 | 对应星座的 celebrity 文章（Haaland=摩羯 → capricorn 页）|
| `/en/wiki/north-node` | 🟡 中 | north-node 相关文章已链向 north-node-vs-south-node，可增加指向 north-node 本身 |
| `/en/wiki/composite-chart` | 🟡 中 | 兼容性相关文章 |
| `/en/wiki/synastry-chart` | 🟡 中 | 兼容性相关文章（注意 synastry-chart-compatibility 有16入链，但 synastry-chart 是孤岛）|

---

### P1-B：Celebrity 内容互链网络（2周内）

194 个孤岛中约 80 篇是 celebrity 内容，这些文章之间完全没有连接。建议建立"同类明星互推"规则：

**规则**：每篇 celebrity 文章在文末相关文章区块，至少链接 2-3 篇同类型的其他 celebrity 文章。

**分组示例**：

```
足球明星组（World Cup 相关）：
haaland ↔ messi ↔ kane ↔ ronaldo ↔ mbappe ↔ hakimi ↔ bellingham...

网球明星组（Wimbledon 相关）：
sinner ↔ zverev ↔ djokovic ↔ gauff ↔ muchova ↔ alcaraz...

娱乐明星组：
zendaya ↔ bella-hadid ↔ anne-hathaway ↔ ayo-edebiri...
```

同时，每篇 celebrity 文章应链接到对应星座页面：
- Haaland（摩羯座）→ `/en/wiki/capricorn`（目前 capricorn 是孤岛）

---

### P1-C：Hub 页面补工具链接（1周内）

以下高权重 Hub 页面目前没有工具链接，修复成本极低：

| Hub 页面（当前入链数）| 应添加的工具链接 |
|---|---|
| astrology-houses（48入链）| birth-chart-calculator（星盘包含宫位）|
| ascendant-meaning（48入链）| birth-chart-calculator + rising-sign-calculator |
| transits（18入链）| birth-chart-calculator（transits 基于星盘）|
| synastry-chart-compatibility（16入链）| synastry-calculator |
| north-node-vs-south-node（30入链）| birth-chart-calculator |
| astrology-terms（13入链）| birth-chart-calculator |

这 6 个页面修复完成后，birth-chart-calculator 额外获得来自 6 个高权重页面的入链。

---

### P2：建立完整的内链架构体系（1个月）

**目标结构**：

```
三层内链体系：

层一（工具页，权重终点）：
birth-chart-calculator / rising-sign-calculator / moon-sign-calculator / synastry-calculator

层二（占星基础 Sub-Hub，权重中转站）：
natal-chart / astrology-houses / ascendant-meaning / transits / north-node / 
12 个星座页面 / synastry-chart / composite-chart

层三（所有 Blog，权重来源）：
Celebrity 趋势内容 → 链到层二（对应星座页）+ 层一（工具页）
占星知识内容 → 链到层二（相关概念）+ 层一（对应工具）
时事占星内容 → 链到层二 + 层一
```

**内链密度目标**（参照 unifab 竞品标准）：
- 每篇 Blog 指向工具页：≥3 条（前20% + 中段 + 结尾）
- 每篇 Celebrity 文章指向星座页：1 条
- 每篇 Celebrity 文章相关文章推荐：3-5 篇同类 celebrity

---

## 八、修复后预期效果

| 指标 | 当前 | P0 修复后 | P1 完成后 |
|---|---|---|---|
| birth-chart-calculator 入链数 | 12 | 200+ | 250+ |
| 孤岛文章数 | 194 (62%) | 194 | <50 (<16%) |
| celebrity 文章平均入链 | ~0 | ~0 | 2-3 条 |
| 工具页在内链网络中的权重地位 | 边缘（第12位）| 第2位 | 第1位（应有位置）|

---

## 九、同名 / 重复文章问题

爬取过程中发现以下可能的重复内容问题：

| 问题 | 页面 |
|---|---|
| 同一人有两篇文章（birth-chart + zodiac-sign）且互不链接 | coco-gauff-birth-chart + coco-gauff-zodiac-sign |
| 同一人有两篇文章 | lamine-yamal-birth-chart + lamine-yamal-zodiac-sign |
| 同一人有两篇文章 | mo-salah-birth-chart + mo-salah-zodiac-sign |
| 同一人有两篇文章 | vinicius-jr-birth-chart-astrology + vinicius-jr-zodiac-sign |
| Mbappé 重复（slug 拼写不同）| mbappe-birth-chart（已知）|

建议：同一人的两篇文章之间必须互相链接，否则权重分散。长期可考虑合并为一篇更深度的文章。

---

*数据爬取：2026-07-13，共311页，全部成功爬取*
*下次更新：P0 修复完成后重新爬取验证*
