# AstrologyWiki SEO 修复清单

**范围：** 2026-05-21 之后发布的文章（共103篇）  
**数据来源：** 全站批量爬取，逐页核实  
**审计日期：** 2026-06-10  

---

## 问题一：缺少 FAQ 模块（4篇）

以下文章有足够字数但缺少FAQ结构，无法争夺Featured Snippet。

| 发布日期       | 字数     | URL                                                                | page_id      |
| ---------- | ------ | ------------------------------------------------------------------ | ------------ |
| 2026-06-01 | 1,797词 | https://www.astrologywiki.com/en/wiki/june-2026-planetary-transits | PG-TRANS-004 |
| 2026-06-01 | 1,735词 | https://www.astrologywiki.com/en/wiki/july-2026-planetary-transits | PG-TRANS-005 |
| 2026-05-22 | 2,532词 | https://www.astrologywiki.com/en/wiki/chakra-system-overview       |              |
| 2026-05-22 | 1,576词 | https://www.astrologywiki.com/en/wiki/four-element-framework       |              |
https://www.astrologywiki.com/en/wiki/chakra-system-overview 和https://www.astrologywiki.com/en/wiki/four-element-framework 没有关键词在H1标题中
---

## 汇总

| 问题 | 篇数 |
|---|---|
| 缺少 FAQ | 4篇 |
| **需要处理的页面** | **4篇** |

> At-a-glance 速览框经逐页核实，103篇文章均在开头使用 "What is X?" 定义段落作为速览，无需补充。

103篇文章中，作者署名和发布日期均已齐全，无需处理。

---

## 备注：作者名JS渲染问题（无需修复）

爬虫抓取静态HTML时，作者具名无法读取——页面上显示的作者名由JS渲染，不在静态源码中。但这不影响Google的判断：Googlebot会执行JS完成二次抓取，能读到页面显示的作者名；JSON-LD schema中也已包含 `"author": {"name": "AstrologyWiki Editorial Team"}`，这是Google评估E-E-A-T时首要读取的机器可读信号。

**可选优化**：当前103篇的schema作者均为团队署名 `"AstrologyWiki Editorial Team"`，非具名个人。如希望进一步强化E-E-A-T，可将schema中的作者改为真实个人名字。这是优化方向，不是当前问题。
