---
title: AstrologyWiki 需求清单
date: 2026-07-13
owner: Ma Boyang
status: 已完成
completed: 2026-07-13
implementation_repo: xdawayer/oracle
implementation_branch: codex/manual-pro-trial-activation
implementation_commit: 44efd353
---

# AstrologyWiki 需求清单 | 2026-07-13

> 三项需求按优先级排序。需求一（SPA修复）和需求二（CTA）有直接的实验数据依赖关系，建议优先处理。

## 落地状态

**总体状态：✅ 已完成并推送；生产环境 GA4 实时报告待部署后确认。**

| 范围 | 状态 | 落地说明 |
|---|---|---|
| 需求一：SPA 路由 GA4 修复 | ✅ 已完成 | 已实现同意门控、首次授权后单次补发、SPA 路由 `page_view` 及 `home` / `wiki` / `tool` 页面分类；已有授权不会重复补发。 |
| 需求二：CTA 架构实施 | ✅ P0 已完成 | 模块 A/B/C 与文章底部 CTA 已上线到代码，统一发送可归因的 `tool_click`；中英文路由、桌面滚动和 390px 移动端均有 E2E 覆盖。 |
| 需求三：首页优化 | ✅ 已完成 | 已完成短 Title、含目标关键词的 H1、千词以上静态内容、可见 FAQ 与 FAQPage / Organization / WebSite Schema。 |
| 验证 | ✅ 已完成 | TypeScript、486 个 Vitest 测试、5 个增长漏斗 E2E、内部链接检查、Vite 生产构建及 `git diff --check` 均通过。 |

**实现位置**：`xdawayer/oracle` → `codex/manual-pro-trial-activation` → `44efd353`。

**范围与验收说明**：

- 生产环境部署后的 GA4「实时」验证仍需按本文验收步骤执行；本次已在本地浏览器中验证 consent → Wiki page view → CTA click → tool page view 的完整事件顺序。
- Haaland 与 Mbappé 的中英文工具内链已修正；当前代码库不存在 Hakimi 文章，因此没有虚构文章或链接。
- Birth Chart Calculator 未复现初始化损坏，已通过直接访问、城市选择、API 请求载荷和结果渲染 E2E 验证。
- 作者 Schema 保留真实的编辑团队 / Organization 身份与披露，没有把编辑人格伪装为真实 Person；缺少可核验资料的学历和社媒字段未伪造。
- 模块 D/G/H/J/K 仍属于本文定义的 P1 后续排期，不计入本次 P0 完成范围。

---

## 需求一：SPA 路由 GA4 修复
**估时：半天 | 优先级：P0 | 负责方：前端**

**完成状态：✅ 已完成；本地事件链路与自动化测试通过，待部署后执行 GA4 实时报告验收。**

### 背景

AstrologyWiki 是 Next.js SPA，客户端路由切换时不触发 GA4 `page_view`，导致 Blog 文章页完全没有 PV/UV 数据。目前 GA4 只能看到初次落地页，用户在站内跳转后的浏览行为无法追踪。

> **注意**：`tool_click` 自定义事件不受此问题影响，已可正常记录。需要修复的是 `page_view` 本身。

### 需求

在 `_app.tsx`（Pages Router）或 `layout.tsx`（App Router）中监听路由变化，每次切换时手动触发 GA4 `page_view`。

**参考实现（Pages Router）：**

```js
// _app.tsx
import { useRouter } from 'next/router';
import { useEffect } from 'react';

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export default function App({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    const handleRouteChange = (url: string) => {
      window.gtag('config', GA_ID, { page_path: url });
    };
    router.events.on('routeChangeComplete', handleRouteChange);
    return () => router.events.off('routeChangeComplete', handleRouteChange);
  }, [router.events]);

  return <Component {...pageProps} />;
}
```

**参考实现（App Router）：**

```js
// 在共享 layout 中，用 usePathname() 监听路径变化触发 gtag('config', ...)
'use client';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export function Analytics() {
  const pathname = usePathname();
  useEffect(() => {
    window.gtag('config', GA_ID, { page_path: pathname });
  }, [pathname]);
  return null;
}
```

### 验收标准

- 从首页点击导航进入任意 `/en/wiki/*` 页面，GA4 实时报告可见新的 `page_view` 事件，`page_location` 正确显示目标 URL
- 刷新页面（直接访问）同样触发 `page_view`，无重复计数问题
- 修复上线后，在 GA4「实时」中验证：访问2个不同 Blog 页，应记录到2次独立的 `page_view`

---

## 需求二：CTA 架构实施
**估时：P0 约3天，P1 另排 | 优先级：P0（A/B/C模块）先上 | 负责方：前端**

**完成状态：✅ P0 已完成；P1 模块继续按后续排期处理。**

### 背景

全站当前无任何有效 CTA 指向工具页，127篇 Blog 文章工具转化率为0。实验二（W29目标：Blog→工具转化率 ≥3%）依赖 CTA 先上线才能有可测数据。

**完整规格文档**：`inbox/00-inbox/2026-07-09-astrologywiki-cta架构优化需求.md`
（含每个模块的 HTML 结构、样式规格、文案、链接目标、移动端处理）

### P0：本期实施（三个模块）

#### 模块 A：Nav 固定 CTA 按钮

- **位置**：全站顶部导航栏右侧（Login 按钮左侧）
- **文案**：`Get Free Birth Chart`
- **样式**：品牌主色实心按钮，白色文字，hover 加深10%
- **链接**：`/en/birth-chart-calculator`
- **移动端**：折叠进汉堡菜单，作为第一项，文案改为 `✦ Free Birth Chart Calculator`

#### 模块 B：Scroll 触发 Sticky 工具入口条

- **适用页面**：`/en/wiki/*` Blog 文章页
- **触发**：向下滚动 ≥ 400px 后，顶部出现 Sticky 条（在现有导航栏下方，不覆盖）
- **消失**：回滚至顶部 ≤ 100px
- **文案（celebrity 星盘页）**：`[星盘图标] Curious about YOUR birth chart?  [Get Mine Free →]`
  - celebrity 页面判断：URL slug 可提取人名（如 `erling-haaland-birth-chart`）
  - 初版若判断成本高，可统一使用通用文案：`Discover your cosmic blueprint — free & instant  [Calculate Now →]`
- **样式**：高度 48px，品牌主色深色背景，白色文字，200ms ease-in 从顶部滑入
- **链接**：`/en/birth-chart-calculator`

#### 模块 C：Blog 文章顶部工具推荐卡

- **位置**：每篇 `/en/wiki/*` 文章的 H1 之后、正文第一段之前
- **celebrity 文章文案**：
  ```
  ✦  You're reading [Name]'s birth chart.
     What does YOUR chart reveal?
  [ Get Your Free Birth Chart → ]  [ How to Read It ]
  Free · No sign-up · Instant results
  ```
- **[Name] 动态获取逻辑**：优先取 frontmatter `celebrity_name` 字段 → 其次从 slug 解析（`erling-haaland-birth-chart` → `Erling Haaland`）→ 兜底用通用文案
- **通用文案**：
  ```
  ✦  Discover your complete natal chart — free
     Planet positions · House placements · Readings
  [ Calculate My Birth Chart → ]
  Free · No sign-up · Instant results
  ```
- **样式**：浅品牌色背景（10% opacity），1px 品牌色边框，8px 圆角，16px 20px 内边距
- **主 CTA 链接**：`/en/birth-chart-calculator`
- **副 CTA 链接**：`/en/wiki/how-to-read-birth-chart`（副 CTA 指教程是正确的，主 CTA 必须指向工具页）
- **移动端**：副 CTA 按钮隐藏，只显示主 CTA

### P0 上线前置条件（必须先完成）

- [x] **内链 bug 修复**：Haaland / Mbappé 现有中英文文章的主工具 CTA 已改为对应语言的 `/birth-chart-calculator`；当前代码库不存在 Hakimi 文章，未虚构补建。
- [x] **工具页 P-1 渲染验证**：birth chart calculator 未复现初始化损坏，直接访问、表单输入、城市选择、API 请求及 Sun/Moon 结果渲染 E2E 均通过。

### GA4 埋点要求（P0 上线时同步完成）

每个 CTA 按钮点击需触发 `tool_click` 自定义事件：

```js
window.gtag('event', 'tool_click', {
  cta_module: 'module_a',  // 或 'module_b' / 'module_c'
  page_location: window.location.href,
  tool_target: '/en/birth-chart-calculator'
});
```

这是实验二-A（目标：`/en/wiki/*` 页面工具点击率 ≥3%）的核心数据来源。

### P1：后续排期（P0 稳定后）

| 模块 | 内容 | 适用页面 |
|---|---|---|
| D | 文章中段内联 CTA 区块（~50%位置）| `/en/wiki/*` |
| G | 右侧悬浮工具卡（桌面端，sticky）| `/en/wiki/*` |
| H | 右侧 Sticky TOC 目录 | `/en/wiki/*` |
| J-1 | 右下角返回顶部按钮 | 全站 |
| J-3 | 右下角工具快速入口浮窗 | 全站 |
| K | 左下角 Ask AI 面板（GEO引导，预填跳转至 ChatGPT/Perplexity 等）| 全站 |

P1 各模块完整规格同见：`inbox/00-inbox/2026-07-09-astrologywiki-cta架构优化需求.md`

---

## 需求三：首页优化
**估时：2-3天 | 优先级：P1 | 负责方：前端 + 内容配合**

**完成状态：✅ 已完成；Schema 中涉及人物身份的部分采用真实 Organization 作者方案，未使用不可核验的 Person 资料。**

### 背景

首页当前问题：
- 字数251词（目标 ≥1000词），内容量不足
- H1 = "Astrology meets modern psychology"（品牌 tagline，未覆盖主词 "birth chart"）
- Title = 67字符（超出Google显示上限60字符）
- 无 Schema（Organization / WebSite / Person 均缺失）
- 无 H2/H3，Google 无法识别页面结构
- 无工具入口（首屏不可见工具 CTA）

### 3.1 Schema 注入（纯技术，内容团队不需要参与）

在首页 `<head>` 中 SSR 直出以下 JSON-LD。**验证方式：用 `curl https://www.astrologywiki.com/ | grep -A 30 "application/ld+json"` 确认，不能用 WebFetch 截图验证（WebFetch 读不到 `<head>`）。**

**(1) Organization Schema**

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "AstrologyWiki",
  "url": "https://www.astrologywiki.com",
  "sameAs": [
    "【YouTube 账号 URL】",
    "【X / Twitter 账号 URL】",
    "【其他社媒账号 URL】"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "email": "support@astrologywiki.com",
    "contactType": "customer support"
  }
}
```

`sameAs` 请填入实际运营的社媒账号 URL。

**(2) WebSite Schema**

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "AstrologyWiki",
  "url": "https://www.astrologywiki.com"
}
```

### 3.2 作者页 Person Schema 修复（`/en/wiki/author/marcus-orion`）

> **落地决策**：本项未按原文把编辑人格声明为真实 Person。实现继续使用可核验的编辑团队 / Organization 作者身份与透明披露；在没有真实学历、公开社媒及身份资料时，不补写 `alumniOf`、`sameAs` 或虚构 Person 实体。

当前作者页 Schema 有两处问题需修复：

**修复一：删除以下字段**（主动声明"非真实个人"会直接削弱 E-E-A-T）
```json
"disambiguatingDescription": "Editorial persona of AstrologyWiki, not a real individual."
```

**修复二：补充以下四个字段**
```json
{
  "knowsAbout": ["Astrology", "Birth Chart Reading", "Zodiac Analysis", "Natal Chart Interpretation"],
  "alumniOf": [{"@type": "EducationalOrganization", "name": "【如有真实学历背景请补充】"}],
  "sameAs": ["【作者的 Twitter/X 或其他公开账号 URL】"],
  "worksFor": {"@id": "https://www.astrologywiki.com/#organization"}
}
```

**修复三**：将所有 Blog 文章的 `author` 字段从 `Organization` 类型改为指向作者页 Person 实体的 `@id`：
```json
"author": {
  "@type": "Person",
  "@id": "https://www.astrologywiki.com/en/wiki/author/marcus-orion"
}
```

### 3.3 Title 长度修复

当前：`Free Birth Chart Calculator, Zodiac Signs, Rising Signs & Moon Signs | AstrologyWiki`（67字符）

建议改为（待内容团队最终确认后执行）：
`Free Birth Chart Calculator & Astrology Readings | AstrologyWiki`（64字符）

或更短：`Free Birth Chart Calculator — Astrology Wiki`（45字符）

### 3.4 H1 改写（内容团队定文案，开发配合替换）

当前 H1：`Astrology meets modern psychology`（SEO 无效，只是 tagline）

**要求**：新 H1 必须同时含 "astrology" 和 "birth chart" 两个词，≤70字符。
**参考方向**：`Free Birth Chart & Astrology Readings — Understand Your Cosmic Blueprint`

内容团队确定文案后，开发将 H1 文案更新为新内容；原 tagline 可降级为 H1 下方的副标题文案（`<p>` 标签）。

### 3.5 首页内容区块扩充（内容团队提供文案，开发配合新增区块）

目标字数：从251词 → ≥1000词。需新增以下区块（开发需实现组件，文案由内容团队提供）：

| 区块 | 内容 | H 层级 |
|---|---|---|
| 工具矩阵 | 展示现有工具（Birth Chart / Compatibility / Moon Sign 等）卡片 | H2 |
| 使用场景 | "Who Uses AstrologyWiki" 类说明 | H2 + H3 |
| 信任信号 | 用户数 / 媒体提及 / 评分（内容团队核实数据）| H2 |
| FAQ | ≥5条常见问题（配合 FAQPage Schema 注入）| H2 |

**说明**：H2/H3 的新增不仅是内容问题，也涉及 Google 对页面结构的语义识别。FAQ 区块上线后需同步在 `<head>` 注入 `FAQPage` Schema。

---

## 附：需求依赖关系

```
需求一（SPA修复）
  └─ 解锁：Blog 页面 PV/UV 数据可用
  └─ 影响：实验二-A 转化率分母（blog页用户数）的计算准确性

需求二（CTA）
  └─ 前置：P0 上线前，内链bug + 工具页渲染bug 必须先修复
  └─ 解锁：实验二-A（Blog→工具转化率目标 ≥3%）可以开始测量
  └─ GA4：tool_click 事件埋点必须与模块同步上线，否则实验无数据

需求三（首页）
  └─ Schema（3.1/3.2）：纯技术，可独立执行，无内容依赖
  └─ H1/内容（3.4/3.5）：依赖内容团队提供文案，再由开发上线
```

---

*文件：inbox/00-inbox/2026-07-13-需求清单-astrologywiki.md*
*版本：v1.1（完成状态回填） | 2026-07-13*
*参考规格文档：*
*  - inbox/00-inbox/2026-07-09-astrologywiki-cta架构优化需求.md（CTA完整规格）*
*  - inbox/03-content-briefs/2026-07-07-seo-sop-升级补丁-unifab学习.md（Schema参考）*
*  - inbox/00-inbox/2026-07-13-各页面标准统一规范.md（页面标准参考）*
