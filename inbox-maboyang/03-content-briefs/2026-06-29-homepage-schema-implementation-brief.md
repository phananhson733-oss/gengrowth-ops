---
title: 首页结构化数据与 OG 标签修复 — 开发实施文档
date: 2026-06-29
type: dev-brief
status: 已实施（oracle，含落地修正）
priority: P0
owner: 前端工程团队
file: index.html（根目录 <head> 区域）
---

# 首页结构化数据与 OG 标签修复

> **⚠️ 实施修正（2026-06-29 落地时核对 oracle 真实架构后修正，已按修正版实施）**
>
> 本 brief 方向正确——把 brand schema 提前到首字节，恰好兑现 `pages/landing/LandingPage.tsx` 里挂着的 first-byte parity TODO。但落地核对后做了以下必要修正；**直接照搬原文会造成质量倒退或重复 bug**：
>
> 1. **「首页缺 schema」前提不准确**：根 `/` 的静态 HTML 确实无 JSON-LD，但运行时 `App.tsx` 的 `<GlobalSchema />` 已注入**更完整**的 Organization（含 `sameAs` 社交 + `logo`）+ WebSite（含 SearchAction），Google WRS 执行 JS 后能看到。本次是把它**提前到首字节**，不是补缺失。
> 2. **Organization.logo 用 `/logo.png`，不是 `/icon-192.png`**：与 `GlobalSchema` 及 landing-v2 stub 站内统一，避免同一实体声明两个 logo URL 造成消歧噪音（本次一并把 `generate-seo-pages.mjs` 的 landing-v2 logo 也统一到 `/logo.png`）。
> 3. **Organization 必须含 `sameAs`**（twitter / instagram / youtube）：原文省略它是相对现状的退化，会丢掉 Knowledge Panel 实体消歧信号。
> 4. **WebSite 必须是完整形态**：含 `inLanguage:"en"` + `potentialAction`（SearchAction，`EntryPoint` 对象形式），与 `GlobalSchema` 英文输出一致，而非裸的 `{name, url}`。
> 5. **两个块合并为单个 array `<script>`，且必须带 `data-astro-global-schema="true"` 属性**：此属性承重——`GlobalSchema` 据此 dedup 跳过运行时再注入、`SEO.tsx` 据此豁免不剥离。缺它或 JSON 有语法错误，会让两处去重静默失效、在 WRS 渲染后产生重复（触发 GSC「字段重复」）。已加 `tests/unit/homepage-brand-schema.test.ts` 守护此契约。
>
> **Rationale 修正**：原文「改善 Sitelinks」论据有误——常规 Sitelinks 纯算法、无法用结构化数据影响；SearchAction 唯一驱动的 Sitelinks Searchbox 已被 Google 于 2024 末废弃。保留 SearchAction 只为与 `GlobalSchema` 字节一致（dedup 正确性），真正喂 Knowledge Panel 的是 Organization + sameAs。
>
> **验证步骤修正（对应下文第四节）**：Rich Results Test 现在只会显示 Organization enhancement，**不会**显示 WebSite（searchbox 已废弃）——勿把「WebSite 未检测到」当失败；两个块都用 `validator.schema.org` 验合法性。
>
> **落点**：`index.html` `<head>`（brand JSON-LD + og:url 尾斜杠）、`scripts/generate-seo-pages.mjs`（landing-v2 logo）、`tests/unit/homepage-brand-schema.test.ts`、`FOLDER.md` changelog。447 单测 + vite build 全绿。**PRD 不需更新**（SEO 加固，非新功能/路由/API/Schema，§触发清单不命中）。
>
> **遗留 follow-up（非阻塞）**：(a) landing-v2 的 Organization 仍缺 `sameAs`、其 WebSite 仍用裸字符串 SearchAction target（与 `GlobalSchema` 的 EntryPoint 形式有 drift）；(b) 确认 `sameAs` 三个社交账号真实归属、`/en/wiki?q=` 真为搜索端点。

## 一、背景与目的

当前 `astrologywiki.com` 首页的 `<head>` 中缺少两类结构化数据（JSON-LD），同时存在一处 OG 标签小问题。这三处修复成本极低（纯静态标签，无需改动业务逻辑），但对品牌词搜索体验和 Google 品牌识别有直接收益。

---

## 二、需要添加的内容

### 2.1 WebSite Schema

**添加位置：** `index.html` 的 `<head>` 内，建议紧跟现有 `<link rel="canonical">` 之后。

**添加内容：**

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "AstrologyWiki",
  "url": "https://www.astrologywiki.com/"
}
</script>
```

**目的：**
向 Google 明确声明这是一个独立网站实体，名称为 AstrologyWiki，根 URL 为首页。这是 Google 建立品牌词 Knowledge Panel（知识面板）和 Sitelinks 的基础信号之一。没有这个声明，Google 只能通过页面内容和外链猜测网站身份，而不是从结构化数据直接读取。

---

### 2.2 Organization Schema

**添加位置：** 同上，紧跟 WebSite schema 之后。

**添加内容：**

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "AstrologyWiki",
  "url": "https://www.astrologywiki.com/",
  "logo": "https://www.astrologywiki.com/icon-192.png"
}
</script>
```

**目的：**
向 Google 声明 AstrologyWiki 是一个组织实体，并指定官方 logo。这直接影响两件事：
1. Google 搜索「AstrologyWiki」时，右侧品牌知识面板展示 logo 的依据来源
2. Google 图片搜索识别 logo 的归属

`logo` 字段指向现有的 `/icon-192.png`，该文件已存在，无需新增资源。

---

### 2.3 og:url 尾部斜杠修复

**当前状态：**
```html
<meta property="og:url" content="https://www.astrologywiki.com" />
```

**修改为：**
```html
<meta property="og:url" content="https://www.astrologywiki.com/" />
```

**目的：**
当前 `og:url`（无尾部斜杠）与 `canonical`（有尾部斜杠）不一致。当用户在 Facebook、Twitter/X、LinkedIn 等平台分享首页链接时，平台读取 og:url 作为规范地址。不一致可能导致分享链接统计分散、平台端展示异常。保持与 canonical 一致是标准做法。

---

## 三、完整 head 改动预览

在现有的：
```html
<link rel="canonical" href="https://www.astrologywiki.com/" />
<meta name="robots" content="index,follow" />
```

之后插入：

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "AstrologyWiki",
  "url": "https://www.astrologywiki.com/"
}
</script>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "AstrologyWiki",
  "url": "https://www.astrologywiki.com/",
  "logo": "https://www.astrologywiki.com/icon-192.png"
}
</script>
```

同时将：
```html
<meta property="og:url" content="https://www.astrologywiki.com" />
```
改为：
```html
<meta property="og:url" content="https://www.astrologywiki.com/" />
```

---

## 四、验证方法

上线后用以下工具确认：

1. **Google Rich Results Test**
   地址：`https://search.google.com/test/rich-results`
   输入 `https://www.astrologywiki.com/`，确认检测到 WebSite 和 Organization 两个 schema

2. **Schema Markup Validator**
   地址：`https://validator.schema.org/`
   同样输入首页 URL，确认无报错

3. **og:url 确认**
   右键查看页面源代码，搜索 `og:url`，确认值为 `https://www.astrologywiki.com/`（有尾部斜杠）

---

## 五、预期效果与时间线

| 效果 | 预期时间 |
|---|---|
| Google Rich Results Test 可检测到 schema | 上线后立即 |
| GSC 结构化数据报告收录 | 1-2 周内 |
| 品牌词搜索 Sitelinks 质量改善 | 数周到数月（受 DR 和品牌词搜索量影响，schema 是必要条件之一，非充分条件）|
| og:url 一致性生效 | 立即（新分享链接） |

---

*起草：Claude Ops / 2026-06-29*
*适用文件：`index.html` `<head>` 区域，纯静态标签，无需改动 React 组件或业务逻辑*
