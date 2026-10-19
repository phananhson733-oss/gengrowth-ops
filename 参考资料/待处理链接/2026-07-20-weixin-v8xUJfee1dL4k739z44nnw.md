---
title: 夯爆了，一整套神级营销 Skills，让你的 AI 秒变营销团队
date: 2026-07-20
updated: 2026-07-20
type: source-capture
status: fetched-awaiting-action
source: https://mp.weixin.qq.com/s/v8xUJfee1dL4k739z44nnw
author: 丛林
publisher: 极客之家
tags:
  - wechat
  - source-capture
  - marketing
  - agent-skills
  - seo
  - growth
aliases:
  - marketingskills 微信文章
  - AI 营销技能包
---

# 夯爆了，一整套神级营销 Skills，让你的 AI 秒变营销团队

## 来源

- 原文：<https://mp.weixin.qq.com/s/v8xUJfee1dL4k739z44nnw>
- 公众号：极客之家
- 作者：丛林
- 关联项目：<https://github.com/coreyhaines31/marketingskills>
- 当前状态：正文已抓取，待决定是否接入 Hermes / GenGrowth
- 处理方式：CEO Assistant 直接归档，不分派 Ops

## 内容摘要

文章介绍开源项目 `coreyhaines31/marketingskills`。项目把营销方法论封装为 Agent Skills，覆盖产品营销上下文、SEO、AI SEO、程序化 SEO、CRO、文案、邮件、广告、A/B 测试、数据分析、定价、发布、推荐增长、流失挽回和销售运营等场景。

其关键设计是：所有营销 Skill 先读取同一份产品营销档案，再针对具体任务调用专项流程，避免生成脱离产品、受众和定位的通用建议。

## 与 GenGrowth 现有资源的关系

这篇文章对应的正是现有资源索引和参考库中的 `marketingskills` 上游项目，并非一个全新的来源。

当前差异：

1. GenGrowth 参考库只保存了部分旧版 Skill 摘要，尚未完整接入 Hermes。
2. 本地参考文件仍使用 `page-cro`、`form-cro`、`schema-markup`、`product-marketing-context` 等旧名称。
3. 官方 v2 已将 `page-cro` 与 `form-cro` 合并为 `cro`，并把产品营销档案迁移为 `.agents/product-marketing.md`。
4. 官方当前还包含 `marketing-council`、`marketing-loops`、`competitor-profiling`、`analytics`、`ab-testing` 等本地参考子集未完整覆盖的能力。

## 关键判断

- 该项目适合作为 GenGrowth SEO / 营销诊断能力的通用底座，不需要从零重写全部方法论。
- 它本质上是“顾问与流程层”，能规范诊断、策略和文案输出，但不能单独完成 GSC、GA4、爬虫、广告后台等数据采集与平台执行。
- 要找真正关键的增长点，需要在这些 Skill 之上接入公开网站检测、GSC / GA4、转化事件、竞品数据和实验追踪。
- 最合理的做法是先安装小规模核心子集并用 AstrologyWiki 实测，再决定是否扩展成完整 Growth Diagnosis Agent。

## 建议接入的第一批 Skill

1. `product-marketing`
2. `seo-audit`
3. `ai-seo`
4. `site-architecture`
5. `cro`
6. `analytics`
7. `ab-testing`
8. `competitor-profiling`
9. `content-strategy`
10. `marketing-loops`

## 待确认

- 是否把上述核心子集安装到 CEO / Hermes 的 GenGrowth 工作流。
- 是否以 `astrologywiki.com` 作为首个诊断验证对象。
- 实测通过后，是否封装为统一的 `growth-diagnosis` Skill / Agent。
