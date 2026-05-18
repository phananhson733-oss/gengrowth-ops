<%*
const title = await tp.system.prompt("文章标题（H1，含 focus keyword）");
const focusKw = await tp.system.prompt("Focus Keyword（主关键词，例如 how to read birth chart）");
const slug = await tp.system.prompt("URL slug（小写连字符，例如 how-to-read-birth-chart）");
const pillar = await tp.system.suggester(
  ["natal-chart", "transits", "synastry", "psychological-archetypes", "tools-and-apps", "（无 pillar）"],
  ["natal-chart", "transits", "synastry", "psychological-archetypes", "tools-and-apps", ""]
);
const lang = await tp.system.suggester(["en", "zh"], ["en", "zh"]);
const author = await tp.system.suggester(
  ["AstroMind Team", "Lynne", "wzb"],
  ["AstroMind Team", "Lynne", "wzb"]
);
%>
---
title: "<% title %>"
slug: "<% slug %>"
focus_keyword: "<% focusKw %>"
pillar_slug: "<% pillar %>"
description: ""  # 50-160 字符；用作 meta description + schema.org/Article description
author: "<% author %>"
date: <% tp.date.now("YYYY-MM-DD") %>
schema: Article
lang: <% lang %>
keywords:
  - <% focusKw %>
  - 
  - 
target: inbox/04-production/
review: pending
tags:
  - draft
  - seo-blog
---

# <% title %>

## TL;DR
<!--
AIO Answer Lock — 必填，发布前不准为空。
- 50-100 词（英文）/ 80-150 字（中文）
- 直接回答标题里的问题，第一句就出现 focus keyword
- 纯信息密度，不写"本文将介绍" / "Let's dive in" 这类废话
- Google AIO / Perplexity / ChatGPT 搜索会优先抓这段做引用
-->



---

## 引言段（50-100 字）
<!-- 引出场景痛点，建立同理心；这一段不抢 TL;DR 的功能 -->



## H2 主体大纲
<!-- 5-7 个 H2，每个 H2 下 200-400 字。建议在前 30% 内插一个指向 pillar 文章的内链 -->

### 1. 
### 2. 
### 3. 

---

## 内链清单（手动填）
<!-- 至少 3 个站内链接：1 个指向 pillar，2 个指向相关 wiki/article -->
- [ ] [显示文案](/wiki/...) — 为什么链：
- [ ] [显示文案](/wiki/...) — 为什么链：
- [ ] [显示文案](/blog/...) — 为什么链：

## 外链清单（可选）
- [ ] [显示文案](https://...) — 高权威站点，DR ≥ 60

---

## 发布前 Checklist
- [ ] TL;DR 段已填，包含 focus keyword 在首句
- [ ] description 字段长度 50-160 字符
- [ ] keywords ≥ 3 个，含 focus keyword
- [ ] 至少 3 个站内内链，其中 1 个指向 pillar
- [ ] H1 唯一，且包含 focus keyword
- [ ] 所有图片有 alt 文本
- [ ] 移动端预览过一次
- [ ] schema 字段已设置（默认 Article，FAQ 类文章改 FAQPage）
