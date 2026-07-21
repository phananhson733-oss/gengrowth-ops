---
title: Bing Webmaster Tools + IndexNow 接入需求
date: 2026-07-20
author: 马博洋
recipients: 彪哥（开发）
priority: P1
status: 已完成
completed_date: 2026-07-21
completed_by: 彪哥（开发）
---

# Bing Webmaster Tools + IndexNow 接入需求

> **✅ 已完成 — 2026-07-21（彪哥 / 开发侧）**
>
> - **需求 1（Bing 站点验证 + Sitemap 提交）**：站点已通过 Google Search Console 一键导入 Bing Webmaster Tools，所有权自动验证；Sitemap `https://www.astrologywiki.com/sitemap.xml` 已手动提交。
>   - 注：生产实际域名为 **www 子域**（裸域 `astrologywiki.com` 307 跳转至 `www.`），验证与 sitemap 均以 www 为准。
> - **需求 2（IndexNow 协议接入）**：**在本需求文档发出前即已在生产运行**，本次净新增开发工作量为 0。
>   - `scripts/ping-indexnow.mjs` 已接入 build 链，`INDEXNOW_KEY` 已配 Vercel Production；每次部署自动向 `https://api.indexnow.org/indexnow` 提交当天变更 URL，一次覆盖 Bing / Yandex / DuckDuckGo。
>   - 触发机制为「构建期扫 sitemap 中 `lastmod=当天` 的 URL 批量提交」，而非「CMS 发布时逐条触发」——对静态生成站更稳健，效果等价。
> - **后续跟进项（不阻塞本需求）**：Bing 首页提示「部分近期发布页未经 IndexNow 提交」，初步定位为近期新增内容尚未进入 `sitemap.xml`（故 IndexNow 未提交），属**内容发布流程**范畴，另行跟进。

## 一、背景

astrologywiki.com 目前全部搜索流量来自 Google。Bing 占全球搜索份额约 6–8%（美区），DuckDuckGo 使用 Bing 索引，两者共用同一套收录机制。

当前问题：

- 站点未在 Bing Webmaster Tools 完成验证，Bing 无法获取 sitemap，收录依赖被动抓取
- 没有接入 IndexNow，新内容发布后 Bing 收录需要数天，错过趋势内容的排名窗口期

我们发布趋势内容的有效窗口期为 **48–72 小时**，错过这个窗口即使内容质量再高也无法获得流量。IndexNow 可以将 Bing 的收录时间从数天缩短至数小时，直接影响趋势内容的收益。

---

## 二、需求说明

### ✅ 需求 1：Bing Webmaster Tools 站点验证 + Sitemap 提交（已完成 2026-07-21）

**执行方**：彪哥（开发侧）+ 马博洋（账号侧）

**操作步骤：**

1. 访问 [https://www.bing.com/webmasters/](https://www.bing.com/webmasters/)，使用 Microsoft 账号登录
2. 添加站点：`astrologywiki.com`
3. 验证所有权，推荐方式二选一：
   - **XML 文件验证**：下载验证文件，彪哥将其放置于网站根目录，路径为 `https://astrologywiki.com/BingSiteAuth.xml`
   - **Meta 标签验证**：将 Bing 提供的 `<meta name="msvalidate.01" content="...">` 添加到网站所有页面的 `<head>` 中
4. 完成验证后，在 Webmaster Tools 中提交 Sitemap 地址：`https://astrologywiki.com/sitemap.xml`（确认当前 sitemap 路径是否正确）

**预期结果**：Bing 获得完整页面列表，开始系统性收录，存量内容逐步进入 Bing 索引。

---

### ✅ 需求 2：IndexNow 协议接入（本需求文档发出前即已在生产运行）

**执行方**：彪哥（开发侧）

IndexNow 是 Bing、Yandex、Seznam 共同支持的即时收录协议。提交一次，三个搜索引擎同步收到通知。DuckDuckGo 结果来自 Bing，因此接入 IndexNow = 同时覆盖 Bing + DuckDuckGo。

**接入步骤：**

**Step 1：生成 API Key**

生成一个唯一字符串作为 Key（推荐使用 UUID，例如 `a1b2c3d4-e5f6-7890-abcd-ef1234567890`）。

**Step 2：部署 Key 文件**

在网站根目录创建以 Key 命名的 `.txt` 文件，文件内容为 Key 本身：

```
文件路径：https://astrologywiki.com/{key}.txt
文件内容：a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

**Step 3：内容发布时自动触发 IndexNow 请求**

在 CMS 或内容发布流程中，每次新文章发布或重要内容更新时，向 IndexNow API 发送 POST 请求：

```
POST https://api.indexnow.org/indexnow
Content-Type: application/json

{
  "host": "astrologywiki.com",
  "key": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "keyLocation": "https://astrologywiki.com/a1b2c3d4-e5f6-7890-abcd-ef1234567890.txt",
  "urlList": [
    "https://astrologywiki.com/en/wiki/new-article-slug"
  ]
}
```

返回 `200 OK` 表示提交成功，`202 Accepted` 表示已接收待处理。

**触发时机：**

| 场景 | 是否触发 IndexNow |
|-----|----------------|
| 新文章首次发布 | ✅ 必须 |
| 已有文章内容大幅更新 | ✅ 推荐 |
| 仅修改 meta/标签等小改动 | ❌ 不必要 |
| 工具页重大内容升级 | ✅ 推荐 |

**预期结果**：新内容发布后 Bing 在数小时内完成收录（当前需数天）。趋势内容在 48–72 小时窗口期内获得 Bing + DuckDuckGo 排名机会。

---

## 三、预期收益

| 指标 | 当前 | 接入后预估 |
|-----|------|---------|
| Bing 存量页面收录率 | 未知（未验证） | 趋近 Google 水平 |
| 趋势内容 Bing 收录速度 | 数天 | 数小时 |
| 额外日均 UV（稳定后） | 0 | +5–15 UV/天 |
| 覆盖平台 | Google only | Google + Bing + DuckDuckGo + Yandex |

> 注：Bing + DuckDuckGo 合计流量约为 Google 的 5–10%。以当前 Google 峰值 75 clicks/天计，Bing 侧预期带来 +4–8 clicks/天。这是免费增量，无需额外内容投入。

---

## 四、开发侧工作量评估

| 任务 | 预估工时 |
|-----|---------|
| 部署 Bing 站点验证文件（XML 方式）| 15 分钟 |
| 部署 IndexNow Key 文件 | 15 分钟 |
| 在发布流程中接入 IndexNow API 调用 | 1–2 小时 |
| **合计** | **约 2–3 小时** |

---

## 五、优先级与时间建议

**P1，建议本周内完成。**

理由：下一个趋势内容窗口（决赛后球员相关热搜、其他赛事）随时可能出现。IndexNow 接入成本极低，收益直接。

---

*文件：inbox-maboyang/00-inbox/2026-07-20-bing-indexnow-接入需求.md*
*起草：马博洋 · 2026-07-20*
