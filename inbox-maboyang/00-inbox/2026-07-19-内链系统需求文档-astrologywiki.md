---
title: AstrologyWiki 内链系统需求文档
date: 2026-07-19
version: v1.0
status: 待排期
owner: Ma Boyang
priority: P0（Req 1）/ P1（Req 2-4）/ P2（Req 5）
依据数据: 2026-07-19 实时爬取，276 篇已发布 blog
---

# AstrologyWiki 内链系统需求文档 | v1.0

---

## 一、问题陈述

**2026-07-19 对 276 篇已发布 blog 实时爬取结果：**

| 问题 | 数量 | 占比 |
|------|------|------|
| 含错误内链（指向 `/en/wiki/how-to-read-birth-chart` 而非工具页） | 168 篇 | 60.9% |
| 完全无静态工具链接 | 102 篇 | 37.0% |
| 含正确工具链接（静态 HTML 中） | 40 篇 | 14.5% |
| 同时含错误链接 + 正确工具链接 | 34 篇 | 12.3% |

> **注：** CTA 模块 A/B/C（2026-07-13 已上线）为 React 客户端渲染，爬虫看到的是静态 HTML 状态。Google Crawl 可执行 JS，因此工具卡 CTA 点击已可被用户触发；但静态 HTML 中的内链仍直接影响 PageRank 流向和 Googlebot 首次抓取质量。两条路径均需修复，不可互相替代。

**当前系统缺失：**
- 无「哪类文章应链接哪个工具」的路由规则
- 无「相关文章」组件实现 blog-to-blog 集群交叉链接
- 无内链健康度监控机制，已出现 168 篇错误无人发现

---

## 二、系统架构：三层内链体系

```
层一（转化层）：Blog → 工具页
  ├── 静态正文链接（markdown 内容中的 <a> 标签）← 本文 Req 1/2
  └── CTA 组件（Module A/B/C，已上线）← 本文 Req 3（升级）

层二（集群层）：Blog → Blog
  └── 相关文章推荐组件 ← 本文 Req 4

层三（监控层）：健康度保障
  └── 自动化内链扫描 ← 本文 Req 5
```

---

## 三、需求详情

---

### Req 1：批量修复 168 篇错误内链（P0）

**估时：30 分钟 | 优先级：P0 | 负责方：后端**

#### 问题

168 篇 blog 正文中存在指向 `/en/wiki/how-to-read-birth-chart` 的 `<a>` 链接，该页面是「如何阅读星盘」的教程 wiki，不是工具页。用户点击后不进入 birth-chart-calculator，工具转化断路。

CTA 模块 C（文章顶部推荐卡）已上线并指向正确工具页，但正文内链错误仍损耗 PageRank 且误导用户在正文阅读途中点击。

#### 需求

对数据库中所有 blog 文章的 markdown/HTML 内容执行批量字符串替换：

```
替换目标：href 值包含 /en/wiki/how-to-read-birth-chart
替换为：/en/birth-chart-calculator
```

**注意事项：**
- 副 CTA 文案「How to Read It」可保留但链接目标必须改为 `/en/birth-chart-calculator`
- 若某篇文章同时有「How to Read a Birth Chart」的教程链接（非 CTA），该文字链接的目标改为 `/en/wiki/how-to-read-birth-chart` 仍属合理，不在替换范围内；只替换 CTA 位置的错误链接
- 替换后需输出变更记录（影响文章数量 + 示例 URL × 5）

#### 验收标准

- `https://www.astrologywiki.com/en/wiki/how-to-read-birth-chart` 在 `/en/wiki/*` 正文 CTA 位置不再出现
- 下一轮爬取（本文 Req 5 或手动验证）确认 `has_wrong_link` 计数 = 0

---

### Req 2：静态正文工具链接补全（P1）

**估时：1 天 | 优先级：P1 | 负责方：后端 + 内容**

#### 问题

102 篇 blog 在静态 HTML 中完全无工具链接。CTA 模块 C 已覆盖（客户端渲染），但正文中无任何静态工具链接：

- PageRank 不通过工具页流转
- Googlebot 首次抓取（未执行 JS）见不到工具链接
- 正文阅读时无自然工具入口（仅顶部卡片一处）

#### 需求

按下表「内链映射规则」（§四），为每篇 blog 正文在合适位置注入 1 条静态工具链接。

**注入方式（优先级排序）：**

1. **优先**：内容团队在 markdown 正文中选一个自然语境位置手动加链接
2. **备选**：后端对「无工具链接的 102 篇」按 URL 关键词自动匹配工具，在文章末尾结论段插入固定句式 + 链接

**自动插入句式参考：**

```markdown
Ready to calculate your [birth chart / saturn return / rising sign]? Try our free [工具名] →
```

#### 验收标准

- 爬取后 `no_tool_link`（无任何工具静态链接）计数 ≤ 10（允许极少数无法自然植入的文章）
- 插入的工具链接目标 URL 与§四映射规则一致

---

### Req 3：CTA 模块 C 智能工具路由升级（P1）

**估时：半天 | 优先级：P1 | 负责方：前端**

#### 问题

CTA 模块 C（文章顶部推荐卡）当前对所有 `/en/wiki/*` 页面统一链接到 `/en/birth-chart-calculator`。但部分文章的核心主题对应不同工具：

| 文章类型 | 应链接工具 | 当前错误路由 |
|----------|------------|--------------|
| saturn-return-* | saturn-return-calculator | birth-chart-calculator |
| rising-sign-* / ascendant-* | rising-sign-calculator | birth-chart-calculator |
| moon-sign-* / moon-in-* | moon-sign-calculator | birth-chart-calculator |
| compatibility / synastry | synastry-calculator | birth-chart-calculator |
| solar-return-* | solar-return-calculator | birth-chart-calculator |
| composite-chart | composite-calculator | birth-chart-calculator |
| moon-phase-* | moon-phase-calculator | birth-chart-calculator |
| astrocartography | astrocartography-map-generator | birth-chart-calculator |

#### 需求

在模块 C 渲染逻辑中，根据页面 URL slug 匹配工具路由规则（§四），动态选择 `tool_target`：

```typescript
// 工具路由逻辑（伪代码）
function resolveToolTarget(slug: string): ToolConfig {
  if (/saturn.return/i.test(slug)) return TOOLS['saturn-return-calculator'];
  if (/rising.sign|ascendant/i.test(slug)) return TOOLS['rising-sign-calculator'];
  if (/moon.sign|moon.in./i.test(slug)) return TOOLS['moon-sign-calculator'];
  if (/synastry|compatibility/i.test(slug)) return TOOLS['synastry-calculator'];
  if (/solar.return/i.test(slug)) return TOOLS['solar-return-calculator'];
  if (/composite.chart/i.test(slug)) return TOOLS['composite-calculator'];
  if (/moon.phase/i.test(slug)) return TOOLS['moon-phase-calculator'];
  if (/astrocartography/i.test(slug)) return TOOLS['astrocartography-map-generator'];
  return TOOLS['birth-chart-calculator']; // 默认兜底
}
```

每个 `ToolConfig` 包含：`{ path, displayName, ctaText, icon }`，文案随工具动态变化。

**GA4 埋点同步更新：**

```javascript
window.gtag('event', 'tool_click', {
  cta_module: 'module_c',
  page_location: window.location.href,
  tool_target: resolvedToolPath  // 使用实际路由后的工具路径，而非固定值
});
```

#### 验收标准

- 访问 `/en/wiki/saturn-return-guide` → 模块 C 显示 `Saturn Return Calculator` 链接，指向 `/en/saturn-return-calculator`
- 访问 `/en/wiki/lionel-messi-zodiac-sign` → 模块 C 显示 `Birth Chart Calculator`，指向 `/en/birth-chart-calculator`（默认兜底）
- 访问 `/en/wiki/moon-in-scorpio` → 模块 C 显示 `Moon Sign Calculator`，指向 `/en/moon-sign-calculator`
- GA4 `tool_target` 字段值与实际工具 URL 匹配

---

### Req 4：相关文章推荐组件（Blog-to-Blog 集群链接）（P1）

**估时：2-3 天 | 优先级：P1 | 负责方：前端 + 内容**

#### 问题

当前 blog-to-blog 内链完全依赖人工在正文中插入，无系统化集群交叉链接。用户阅读完一篇文章后无推荐导向，导致：

- 单次访问页面深度低（W29 GA4 Top Pages 二次深访页几乎不存在）
- 集群内 PageRank 不循环流转，支柱文章权重无法通过卫星文章集聚
- 实验三（Saturn Return 33 篇）、实验四（Planet in Sign 10 篇）、实验五（Rising Sign 10 篇）均是主题集群，集群内部缺乏交叉链接会大幅削减实验效果

#### 需求

在每篇 `/en/wiki/*` 文章底部（正文结束后、footer 前）新增「相关文章推荐」区块：

**展示规格：**
- 显示 3-4 篇相关文章卡片
- 每张卡片包含：文章标题 + 简短描述（≤80字）+ 链接
- 桌面端：3列横排；移动端：纵向列表

**文章推荐逻辑（优先级排序）：**

1. **同集群文章**（`cluster_id` 相同）：优先推荐同一主题集群内的文章
2. **同 URL 词根文章**：`/en/wiki/saturn-return-*` 互推；`/en/wiki/*-birth-chart` 互推
3. **内容团队手动标注**：支柱文章（如 `saturn-return-guide`）可在 frontmatter 中指定推荐列表

```yaml
# blog frontmatter
related_articles:
  - /en/wiki/saturn-return-in-scorpio
  - /en/wiki/second-saturn-return
  - /en/wiki/saturn-return-guide
```

4. **默认兜底**：无集群信息时，推荐同月发布的最新 3 篇文章

**集群数据来源：**
- 近期数据：`astrologywiki.com - 结果复盘表 (5).csv` 的 `cluster_id` 字段
- 后续：frontmatter 新增 `cluster_id` 字段，编辑发布时填写

#### GA4 埋点

```javascript
window.gtag('event', 'related_article_click', {
  source_page: window.location.pathname,
  target_article: clickedArticlePath,
  position: cardIndex  // 1-4
});
```

#### 验收标准

- 任意访问 3 篇 `/en/wiki/*` 文章，底部均出现「相关文章」区块，卡片数量 3-4 篇
- 推荐文章 URL 均有效（无 404）
- GA4 `related_article_click` 事件可正常采集

---

### Req 5：内链健康度定期扫描（P2）

**估时：半天 | 优先级：P2 | 负责方：后端**

#### 问题

168 篇错误内链存在时间不明，无人发现。说明当前无任何机制保障内链质量，下一次批量发布同样可能引入系统性错误。

#### 需求

建立一个轻量定期扫描任务，每 2 周自动检查全站 `/en/wiki/*` blog 页面的内链状态：

**检查项：**

| 检查项 | 报警条件 |
|--------|----------|
| 含 `/en/wiki/how-to-read-birth-chart` 的 CTA 链接 | 任意 1 篇触发 |
| 静态 HTML 中无任何工具链接的 blog 数量 | 超过 20 篇触发 |
| 工具页链接指向 404 页面 | 任意 1 个触发 |

**实现方式：**
- Vercel Cron Job 或 GitHub Actions 定时触发
- 扫描范围：从 sitemap.xml 提取所有 `/en/wiki/` URL
- 结果存入 Notion 数据库或通过邮件发送给 `hokagoteatiem@gmail.com`

**报警格式（邮件/Notion）：**

```
AstrologyWiki 内链健康度扫描 - [日期]
总扫描：XXX 篇
⚠️ 错误内链：X 篇
⚠️ 无工具链接：X 篇
详情：[列表或文件链接]
```

#### 验收标准

- 手动触发扫描任务，5 分钟内完成 276 篇扫描并输出报告
- 定时任务设置为每 2 周一次，日志可查

---

## 四、内链映射规则表（工具路由 config）

> 本表同时用于 Req 2（静态链接补全）和 Req 3（CTA 模块路由）

| URL 关键词（slug 包含） | 目标工具路径 | 显示名称 | 适用文章类型 |
|------------------------|-------------|----------|-------------|
| `saturn-return` | `/en/saturn-return-calculator` | Saturn Return Calculator | Saturn Return 系列 |
| `rising-sign` / `ascendant` / `-rising` | `/en/rising-sign-calculator` | Rising Sign Calculator | Rising Sign 系列 |
| `moon-sign` / `moon-in-` / `-moon-sign` | `/en/moon-sign-calculator` | Moon Sign Calculator | Moon Sign 系列 |
| `synastry` / `compatibility` | `/en/synastry-calculator` | Synastry Calculator | 关系/合盘系列 |
| `solar-return` | `/en/solar-return-calculator` | Solar Return Calculator | Solar Return 系列 |
| `composite-chart` | `/en/composite-calculator` | Composite Chart Calculator | 合盘系列 |
| `moon-phase` | `/en/moon-phase-calculator` | Moon Phase Calculator | 月相系列 |
| `astrocartography` | `/en/astrocartography-map-generator` | Astrocartography Map | 星图地图系列 |
| *(其他，含 birth-chart / celebrity / zodiac / house / planet-in-sign 等)* | `/en/birth-chart-calculator` | Birth Chart Calculator | 默认兜底 |

**优先级说明：** URL 关键词按表格从上到下匹配，命中第一个即停止。

---

## 五、依赖关系

```
Req 1（P0）：批量修复 168 篇错误内链
  └─ 独立执行，无前置依赖
  └─ 完成后：内链 P0 错误清零，工具转化断路修复

Req 2（P1）：静态工具链接补全 102 篇
  └─ 依赖：§四 内链映射规则表（内容团队确认后开始）
  └─ 完成后：静态内链覆盖率从 14.5% → ≥ 95%

Req 3（P1）：CTA 模块 C 智能工具路由
  └─ 依赖：§四 内链映射规则表，Req 1（避免工具路由修复与批量替换冲突）
  └─ 完成后：用户在 Saturn Return / Rising Sign 等专题文章中看到正确工具 CTA

Req 4（P1）：相关文章推荐组件
  └─ 依赖：需内容团队提供 cluster_id 数据或 frontmatter 标注规则
  └─ 完成后：blog-to-blog 集群链接系统化，实验三/四/五集群效应激活

Req 5（P2）：健康度扫描
  └─ 依赖：Req 1 完成后部署，验证修复有效性并防止回归
  └─ 完成后：内链质量长期有保障，无需手动检查
```

---

## 六、验收标准汇总

| 需求 | 关键指标 | 目标值 |
|------|----------|--------|
| Req 1 | 爬取后 `has_wrong_link` 计数 | = 0 |
| Req 2 | 爬取后 `no_tool_link` 计数 | ≤ 10 |
| Req 3 | CTA 模块 C 工具路由正确率（抽查 20 页） | 100% |
| Req 4 | 相关文章组件覆盖率（所有 wiki 页） | 100% |
| Req 5 | 定时扫描运行正常、报告可达 | 每 2 周自动执行 |

---

## 七、排期建议

| 周次 | 需求 | 估时 |
|------|------|------|
| W30（本周） | **Req 1 批量修复**（P0，30 分钟内完成，立即执行） | 0.5h |
| W30 | Req 3 CTA 智能路由 | 0.5 天 |
| W30-W31 | Req 2 静态工具链接补全 | 1 天 |
| W31 | Req 4 相关文章推荐组件 | 2-3 天 |
| W31 | Req 5 健康度扫描 | 0.5 天 |

---

*文件：inbox-maboyang/00-inbox/2026-07-19-内链系统需求文档-astrologywiki.md*
*版本：v1.0 | 2026-07-19*
*数据来源：2026-07-19 爬取 276 篇已发布 blog（`astrologywiki.com - 结果复盘表 (5).csv`）*
*参考文件：*
*  - inbox-maboyang/00-inbox/2026-07-09-astrologywiki-cta架构优化需求.md（CTA 完整规格）*
*  - inbox-maboyang/00-inbox/2026-07-13-需求清单-astrologywiki.md（上期需求状态）*
*  - inbox-maboyang/08-reports-and-feedback/03-weekly-reports/2026-07-19-astrologywiki-weekly-w29.md（W29 周报）*
