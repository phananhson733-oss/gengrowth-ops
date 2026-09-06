---
title: Bing Webmaster Tools + IndexNow 接入需求（dramashortstv.com）
date: 2026-09-03
author: 马博洋
recipients: 彪哥（开发）
priority: P1
status: 待处理
参照: 2026-07-20-bing-indexnow-接入需求.md（astrologywiki.com 同类需求，已完成，本文结构照抄，内容按 dramashortstv.com 实际情况改写）
---

# Bing Webmaster Tools + IndexNow 接入需求（dramashortstv.com）

## 零、和 astrologywiki 那版的关键差异，先说清楚

这次不是照搬，几处实际情况不一样：

1. **canonical 域名是裸域，不是 www**：实测 `www.dramashortstv.com` 308 跳转到裸域 `dramashortstv.com`（astrologywiki 是反过来，裸域跳 www）。Bing 验证和 sitemap 提交都按裸域来，不要按 www 提交。
2. **裸域首页会再跳一层到 `/en`**：`dramashortstv.com` → 308 → `dramashortstv.com/en`，多语言站的默认语言重定向，验证文件建议放裸域根目录，Bing 能顺着跳转拿到。
3. **没有单一 sitemap.xml 索引文件**：现在 `robots.txt` 里直接列了 19 条 `Sitemap:`（按 index/drama/watch 三个家族分片，这是最近一次架构修复上线的结果），不是一个总索引指向多个子文件的传统结构。Bing Webmaster Tools 里没有"一个入口提交全部"的单一 URL 可用，需要把 19 条分片挨个提交，或者提交 `robots.txt` 让 Bing 自动发现（Bing 支持从 robots.txt 里读 Sitemap 声明，这条路径更省事，推荐用这个）。
4. **内容规模和更新频率完全不是一个量级**：astrologywiki 是 wiki 词条站，内容更新靠人工发布；dramashortstv 现在两个 drama 分片 + 16 个 watch 分片，合计约 30,974 个剧目页 + 302,060 个播放页，横跨 21 个语种，且有持续的新剧/新集数同步流程（后端已有 `detail_synced_at` 这类同步时间戳字段）。IndexNow 的触发方式不能照抄"CMS 发布时手动触发"这一条，需要接到现有的内容同步流程上，见下面需求 2。
5. **这次接入正好能给最近的一次架构修复顺手加分**：前不久刚把旧的 `/detail/`、`/video-play/` URL 迁移到新的 `/drama/`、`/watch/` 结构，且补齐了播放页的 sitemap（之前完全没有）。IndexNow 除了加速新内容收录，也能拿来主动通知 Bing 这批新 URL 的存在，比干等 Bing 自然重新抓取更快追上这次迁移。

---

## 一、背景

dramashortstv.com 当前搜索流量集中在 Google（实测 GSC 7 天窗口约 6,035 次点击、39,594 次展示，注：这个数字目前处于一次故障恢复期，波动较大，不代表稳定基线，见第三节的收益预估口径说明）。Bing 全球搜索份额约 6-8%，DuckDuckGo 使用 Bing 索引，两者共用同一套收录机制，接入一次覆盖两个。

当前问题：

- 站点未确认在 Bing Webmaster Tools 完成验证（实测根目录没有 `BingSiteAuth.xml`），Bing 收录依赖被动抓取
- 没有接入 IndexNow，新剧、新集数发布后 Bing 收录要等被动抓取周期，短剧类内容对时效性敏感（新剧上线、热门剧新集数上线都有窗口期），错过窗口就拿不到早期排名位置
- 最近一次架构迁移（URL 结构从 `/detail/`、`/video-play/` 换成 `/drama/`、`/watch/`）刚上线，Bing 现在索引里大概率还是旧结构，需要主动推一把

---

## 二、需求说明

### 需求 1：Bing Webmaster Tools 站点验证 + Sitemap 提交

**执行方**：彪哥（开发侧）+ 马博洋（账号侧）

**操作步骤：**

1. 访问 [https://www.bing.com/webmasters/](https://www.bing.com/webmasters/)，用 Microsoft 账号登录
2. 添加站点：`dramashortstv.com`（**裸域，不要加 www**）
3. 验证所有权，推荐方式二选一：
   - **XML 文件验证**：下载验证文件，彪哥放置于网站根目录，路径为 `https://dramashortstv.com/BingSiteAuth.xml`
   - **Meta 标签验证**：把 Bing 提供的 `<meta name="msvalidate.01" content="...">` 加到全站页面的 `<head>` 里
4. 完成验证后，**提交 `https://dramashortstv.com/robots.txt`**，让 Bing 从中自动发现全部 19 条 sitemap 分片，不要逐条手动提交（19 条容易漏，robots.txt 里的声明本身就是最新的，以后分片数量变化也不用跟着改 Bing 后台配置）

**预期结果**：Bing 获得完整的 30,974 个剧目页 + 302,060 个播放页 + 分类/首页/博客页面列表，开始系统性收录。

---

### 需求 2：IndexNow 协议接入

**执行方**：彪哥（开发侧）

**接入步骤：**

**Step 1：生成 API Key**

生成一个唯一字符串（UUID 格式），例如 `f47ac10b-58cc-4372-a567-0e02b2c3d479`。

**Step 2：部署 Key 文件**

```
文件路径：https://dramashortstv.com/{key}.txt
文件内容：f47ac10b-58cc-4372-a567-0e02b2c3d479
```

**Step 3：接到现有内容同步流程上，不是接到"人工发布"这个动作上**

astrologywiki 那版用的是"构建期扫 sitemap 里 `lastmod=当天` 的 URL 批量提交"，对静态生成、人工发布节奏的站点合适。dramashortstv 是持续同步剧目/集数数据的站点，建议触发点选在**内容同步任务完成之后**，而不是某个人手动点发布：

```
POST https://api.indexnow.org/indexnow
Content-Type: application/json

{
  "host": "dramashortstv.com",
  "key": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "keyLocation": "https://dramashortstv.com/f47ac10b-58cc-4372-a567-0e02b2c3d479.txt",
  "urlList": [
    "https://dramashortstv.com/en/drama/example-slug-hash",
    "https://dramashortstv.com/en/watch/example-slug-hash/1"
  ]
}
```

**一次提交最多 10,000 条 URL**（IndexNow 协议本身的限制），这次量级下（几十万播放页）批量提交是必须的，不能逐条单发。返回 `200 OK` 表示提交成功，`202 Accepted` 表示已接收待处理。

**触发时机：**

| 场景 | 是否触发 IndexNow |
|-----|----------------|
| 新剧上线（新详情页+对应播放页） | ✅ 必须 |
| 已上线剧目新增集数 | ✅ 必须 |
| 已有剧目详情页内容更新（简介、标签变更） | ✅ 推荐 |
| 分类页/首页等 hub 页面内容变化 | ✅ 推荐 |
| 仅样式/无内容改动的部署 | ❌ 不必要 |

**一次性追加动作（不是长期机制，做一次即可）**：接入后，把这次架构迁移里新产生的核心 URL 集合（至少覆盖 GSC 里目前还有真实点击的那批剧目/播放页）手动跑一次批量提交，加速 Bing 追上这次迁移，不用等它自然重新发现。

**预期结果**：新剧、新集数上线后 Bing 数小时内完成收录（现在依赖被动抓取，周期不确定），同时加速 Bing 重新发现这次 URL 迁移后的新结构。

---

## 三、预期收益

| 指标 | 当前 | 接入后预估 |
|-----|------|---------|
| Bing 存量页面收录率 | 未知（未验证） | 趋近 Google 水平 |
| 新剧/新集数 Bing 收录速度 | 依赖被动抓取，周期不确定 | 数小时 |
| 覆盖平台 | Google only | Google + Bing + DuckDuckGo + Yandex |

**收益预估口径说明（不同于 astrologywiki 那版，这里明确写出局限）**：astrologywiki 那版用当时 Google 稳定峰值（75 clicks/天）乘 5-10% 算出 Bing 侧预估增量。dramashortstv 现在的 Google 数据（约 862 clicks/天，按 7 天窗口 6,035 次点击折算）**处于一次故障恢复期，不是稳定基线**，套用同样的算法得出"Bing+DuckDuckGo 预期 +43-86 clicks/天"这个数字**只能当粗略参考，不能当承诺**。建议等 Google 侧数据确认恢复稳定（本轮修复的观察窗口是 2-4 周，见此前的优化方案文档）之后，再用那时候的稳定基线重新估算一次，数字会更可信。

---

## 四、开发侧工作量评估

| 任务 | 预估工时 |
|-----|---------|
| 部署 Bing 站点验证文件 | 15 分钟 |
| 提交 robots.txt 给 Bing Webmaster Tools | 15 分钟 |
| 部署 IndexNow Key 文件 | 15 分钟 |
| 把 IndexNow 批量提交接入内容同步流程 | 2-4 小时（比 astrologywiki 那版工时高，因为要处理批量分片、10,000 条/次的拆分逻辑，不是单条提交） |
| 一次性追加提交迁移后的核心 URL 集合 | 30 分钟 |
| **合计** | **约 3-5 小时** |

---

## 五、优先级与时间建议

**P1，建议本周内完成。**

理由：接入成本低（几小时量级），且正好能借这次 URL 迁移的时间点，用 IndexNow 主动推送加速 Bing 追上新结构，比单纯"以后新内容自动提交"多一层即时收益。等这次迁移的 Google 侧观察窗口（2-4 周）结束、需要复盘整体效果时，Bing 侧如果还没接入，会缺一块可比数据。

---

*文件：inbox-maboyang/00-inbox/2026-09-03-dramashortstv-bing-indexnow-接入需求.md*
*起草：马博洋 · 2026-09-03*
