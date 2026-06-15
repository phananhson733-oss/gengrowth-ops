# AstrologyWiki SEO 修复清单

**范围：** 2026-05-21 之后发布的文章（共103篇）  
**数据来源：** 全站批量爬取，逐页核实  
**审计日期：** 2026-06-10  

> ✅ **全部已修复并上线（2026-06-11，Claude）**。详见文末「修复记录」。本清单原始审计内容保留不动，仅追加状态标注。

---

## 问题一：缺少 FAQ 模块（4篇）—— ✅ 已修复

以下文章有足够字数但缺少FAQ结构，无法争夺Featured Snippet。

| 发布日期       | 字数     | URL                                                                | page_id      | 状态 |
| ---------- | ------ | ------------------------------------------------------------------ | ------------ | --- |
| 2026-06-01 | 1,797词 | https://www.astrologywiki.com/en/wiki/june-2026-planetary-transits | PG-TRANS-004 | ✅ 补 FAQ（EN+ZH） |
| 2026-06-01 | 1,735词 | https://www.astrologywiki.com/en/wiki/july-2026-planetary-transits | PG-TRANS-005 | ✅ 补 FAQ（EN+ZH） |
| 2026-05-22 | 2,532词 | https://www.astrologywiki.com/en/wiki/chakra-system-overview       |              | ✅ 补 FAQ（EN） |
| 2026-05-22 | 1,576词 | https://www.astrologywiki.com/en/wiki/four-element-framework       |              | ✅ 补 FAQ（EN） |

> ✅ **FAQ 已补（2026-06-11，PR #131 → prod `57c2e3a`）**：4 篇各加「## Questions People Ask About …」4 条 Q&A（双语 transits 篇 EN+ZH 各一套），内容严格依据原文、日期数字逐字核验。线上已生成 FAQPage JSON-LD（4 EN + 2 ZH 全部验过）。

> ✅ **H1 关键词已修（2026-06-11，PR #130 → prod `9d1c5fe`）**：~~chakra-system-overview 和 four-element-framework 没有关键词在H1标题中~~。four-element 原 target_keyword「four element framework astrology」是生造词（零搜索需求），重锚到「the four elements in astrology」；chakra 修掉病句 H2「What are Chakra System?」并重锚「what are chakras / 7 chakras explained」，H1/title 现均含真实关键词。根因：两篇是 2026-05-22 早期手工种的 hub 页，早于关键词研究纪律。

---

## 汇总

| 问题 | 篇数 | 状态 |
|---|---|---|
| 缺少 FAQ | 4篇 | ✅ 已修复 |
| H1 无关键词（chakra-system-overview / four-element-framework） | 2篇 | ✅ 已修复 |
| **需要处理的页面** | **4篇** | **✅ 全部已修复并上线** |

> At-a-glance 速览框经逐页核实，103篇文章均在开头使用 "What is X?" 定义段落作为速览，无需补充。

103篇文章中，作者署名和发布日期均已齐全，无需处理。

---

## 备注：作者名JS渲染问题（无需修复）

爬虫抓取静态HTML时，作者具名无法读取——页面上显示的作者名由JS渲染，不在静态源码中。但这不影响Google的判断：Googlebot会执行JS完成二次抓取，能读到页面显示的作者名；JSON-LD schema中也已包含 `"author": {"name": "AstrologyWiki Editorial Team"}`，这是Google评估E-E-A-T时首要读取的机器可读信号。

**可选优化**：当前103篇的schema作者均为团队署名 `"AstrologyWiki Editorial Team"`，非具名个人。如希望进一步强化E-E-A-T，可将schema中的作者改为真实个人名字。这是优化方向，不是当前问题。

---

## 修复记录（2026-06-11，Claude / awayer_mini 机器）

| 项目 | 处理 | PR | prod commit | 线上验收 |
|---|---|---|---|---|
| H1 无关键词 ×2（chakra-system-overview、four-element-framework） | 重锚真实关键词 + 修病句 H2 + 修 7 条自指内链（chakra）；不改 slug 免 301 | #130 | `9d1c5fe` | H1/title 含真实关键词、病句/生造词全站清零 ✓ |
| 缺 FAQ ×4（june/july transits、chakra-system-overview、four-element-framework） | 各加 4 条 Q&A FAQ 模块（双语 transits 篇 EN+ZH），严格依据原文、日期逐字核验 | #131 | `57c2e3a` | 4 EN + 2 ZH 全部生成 FAQPage JSON-LD ✓ |

**关于「H1 无关键词」的根因**：这两篇是 2026-05-22 初始 v8 批次手工逐页喂 prompt 写的 hub 页，用的是默认 workbook（选题登记表）的 `page_*` 命名空间，**早于** 05-27 起的关键词研究纪律（挖词→审批→关键词主表→cluster）。所以选题是内部拍脑袋的分类标签而非真实搜索需求——four-element 的关键词是生造的、chakra 的 entity 套模板生出病句。现行 autopilot 前半段纪律已防此类问题，这两篇属遗留。

**作者署名 JS 渲染**：清单已判定无需修复（Googlebot 执行 JS 能读、JSON-LD 已含 author），本次未改；「具名个人作者」作为可选 E-E-A-T 优化方向保留，待决策。

> 详细过程见 flow-mvp `docs/records/xdawayer/2026-06-11-chat-record.md`。
