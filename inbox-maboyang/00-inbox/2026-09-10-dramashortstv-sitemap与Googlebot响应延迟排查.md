---
title: dramashortstv.com sitemap 抓取异常排查——问题、排查过程、证伪的猜测
date: 2026-09-10
说明: 起因是 GSC 站点地图报表里 sitemap/0.xml 等多个子 sitemap 显示"无法抓取"。本文档记录完整排查链路，包括中途出现又被推翻的几个猜测——保留证伪过程是为了避免复核时重复排查同样的方向。
数据源: GSC 截图（用户提供，2026-09-10）+ 实时 curl/浏览器实测（2026-09-10）
---

# 一、结论先行

**唯一确认、可复现的问题**：dramashortstv.com 对 Googlebot 这个 User-Agent 的响应时间，比普通浏览器 UA 慢约 10 倍（11-12 秒 vs 1-2 秒），5 个不同页面测试结果一致。这很可能是 GSC 报表里子 sitemap 显示"无法抓取"的真实原因——不是页面不存在，是 Google 抓取时可能触发了自己的超时阈值。

**排查过程中出现但被证伪的猜测**（详见四、五节）：sitemap 里的 URL 大量 404；sitemap 分页超出实际范围导致软 404。这两条都不成立，不用再往这两个方向查。

---

# 二、起因：GSC 站点地图报表截图

用户提供的 GSC 截图（search.google.com/search-console/sitemaps，resource=dramashortstv.com）显示：

| 站点地图 | 类型 | 已提交日期 | 上次读取时间 | 状态 |
|---|---|---|---|---|
| sitemap.xml | 站点地图索引 | 2026年9月7日 | 2026年9月9日 | ✅ 成功 |
| sitemap/1.xml | 未知 | 2026年9月7日 | （空） | 🔴 无法抓取 |
| sitemap/0.xml | 未知 | 2026年9月7日 | （空） | 🔴 无法抓取 |
| sitemap/18.xml | 未知 | 2026年9月7日 | （空） | 🔴 无法抓取 |
| sitemap/17.xml | 未知 | 2026年9月7日 | （空） | 🔴 无法抓取 |
| sitemap/16.xml | 未知 | 2026年9月7日 | （空） | 🔴 无法抓取 |

索引文件本身抓取成功，但它引用的子 sitemap 全部显示"从未成功读取过"。

---

# 三、确认为真的发现：Googlebot UA 响应延迟约 10 倍

用相同 URL、相同网络条件，只切换 User-Agent，实测 5 组：

| URL | Googlebot UA 耗时 | 普通浏览器 UA 耗时 |
|---|---|---|
| /ar | 12.3s | 2.1s |
| /ar/genre | 11.2s | — |
| /en/genre/hospital | 11.8s | 1.2s |
| /tr/genre/tormented-love | 12.0s | 1.7s |
| /ko/genre/hospital | 12.2s | 1.4s |

复现命令：

```bash
curl -s -o /dev/null -w "status:%{http_code} time:%{time_total}s\n" \
  -A "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" \
  "https://dramashortstv.com/en/genre/hospital"

curl -s -o /dev/null -w "status:%{http_code} time:%{time_total}s\n" \
  -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" \
  "https://dramashortstv.com/en/genre/hospital"
```

**两个状态码都是 200，页面本身没有报错，纯粹是响应速度的差异。** 5/5 一致，不是偶发抖动。

**可能的技术原因**（未定位到具体代码层，需要工程侧介入）：
1. CDN/边缘缓存只命中常见浏览器 UA，识别到 Googlebot 就绕过缓存，走未缓存的服务端实时渲染路径
2. 有 Bot 检测/WAF 中间件对疑似爬虫的请求加了额外验证或限速逻辑

**这条和 8 月底那次大规模掉收录事件的根因机制是同一类**（见 `2026-09-08-dramashortstv大规模掉收录教训与新站预防清单.md`）：Google 判断要不要降低抓取频率，参考的就是响应变慢/错误率这类信号。如果这个延迟现在还在持续，很可能是当前正在生效的限流诱因，不是历史遗留问题。

---

# 四、被证伪的猜测一：sitemap 里的 URL 大量 404

**最初怀疑**：手动打开 sitemap 里的网址，多次看到 404。

**证伪过程**：追查发现手动测试用的网址里混进了 sitemap XML 原始内容——从 `<changefreq>weekly</changefreq>` `<priority>0.6</priority>` 这类标签里复制文字时，把标签值也一起带进了地址栏，变成类似：

```
https://dramashortstv.com/ar/genre weekly 0.6
→ 浏览器实际访问的是 /ar/genre%20weekly%200.6，这个路径本来就不存在
```

去掉多余文字，只测干净网址 `https://dramashortstv.com/ar/genre`，页面正常打开，用户自己复测确认。

**结论**：sitemap 里的 URL 本身没有 404 问题，之前看到的 404 全部是复制粘贴带出的假网址导致的。

---

# 五、被证伪的猜测二：分页超出范围导致软 404（此条是我方排查方法的错误，主动说明）

**排查中途的误判**：测试 `/bg/genre/page/23` 时，用 curl 抓取静态 HTML，用 `grep "No dramas found"` 判断页面是否有内容，命中了这个字符串，于是判断"page/23 是空的，sitemap 里塞了超出实际范围的分页"。

**核实后发现判断方法本身有问题**：dramashortstv.com 是前端 JS 渲染内容的站点（React/Next.js），curl 抓到的原始 HTML 里可能本来就包含"No dramas found"这个模板字符串（无论页面最终是否渲染出内容），单纯 grep 静态 HTML 不能反映真实页面状态。用浏览器实际渲染后重新核实：

- `/bg/genre`（第1页）：848 部剧，真实内容，分页显示到第 36 页
- `/bg/genre/page/23`：24 部剧，同样是真实内容，不是空页

**结论**：sitemap 分页范围没有问题，这条判断已撤回，不需要工程侧核查这个方向。

---

# 六、建议下一步

1. **优先级最高**：请工程侧确认站点是否存在针对 Googlebot（或识别为爬虫的 UA）的差异化处理逻辑——缓存策略、WAF/Bot 管理中间件、限速规则，逐项排查是哪一层在拖慢响应
2. 服务端日志里查 Googlebot 真实请求的响应时间分布，确认第三节的延迟不是这次抽样的巧合
3. 修复后用网址检查工具（GSC "网址检查"功能）重新提交几个受影响页面，观察索引状态是否恢复正常，作为验收依据

---

*文件：inbox-maboyang/00-inbox/2026-09-10-dramashortstv-sitemap与Googlebot响应延迟排查.md*
