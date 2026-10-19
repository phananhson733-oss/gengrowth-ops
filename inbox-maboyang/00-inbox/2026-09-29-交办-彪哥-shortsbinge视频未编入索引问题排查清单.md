---
title: 交办 · 彪哥 · shortsbinge.com 视频未编入索引问题排查清单
date: 2026-09-29
交办对象: 彪哥
依据: GSC视频收录报告实测（queen-never-cry episode/1页面）+ URL检查工具"测试实际网址"渲染截图 + 站内curl实测（截至09-29）+ Google官方视频SEO文档
范围: shortsbinge.com，起点是单个页面，但怀疑是模板级问题，建议按站点规模验证
---

# 交办 · shortsbinge.com 视频未编入索引问题排查清单

## 一分钟摘要

| # | 问题 | 状态 | 优先级 |
|---|---|---|---|
| 0 | Vercel安全检查点可能拦截了Googlebot和自家办公IP | 未确认，需要立刻验证 | 🔴🔴 |
| 1 | 视频被Google判定为"页面补充内容"，不是页面主体 | **已确认**（GSC原文） | 🔴 |
| 2 | 播放器需要用户点击才加载视频 | 我们实测反复出现，未确认是否为本次GSC报告的直接原因 | 🟠 |
| 3 | 视频加载速度不稳定，经常需要20~50秒甚至更久 | 我们实测反复出现，且GSC官方渲染截图也拍到同一失败画面 | 🟡 |

起因：`https://shortsbinge.com/drama/queen-never-cry-4wcdv2ibjuso/episode/1/` 在GSC视频收录报告里显示"未编入索引"，原因文字是"视频不在观看页面上"。往下查的过程中，我们（AI助手，非技术人员）顺带发现了另外两个技术现象，因果关系还没有完全坐实，一起列出来，但**不要把这几条当成同一个根因**，分开验证。

---

## 0 · Vercel安全检查点，可能连Googlebot都拦了（🔴🔴 最优先验证）

我们用curl测试以下几个URL，全部返回HTTP 429，页面标题都是`Vercel Security Checkpoint`：

- `/`（首页）
- `/robots.txt`
- `/sitemap.xml`
- `/drama/queen-never-cry-4wcdv2ibjuso/episode/1/`

带Googlebot UA和普通Chrome UA测试结果一样，说明大概率不是按UA识别的，而是按IP/ASN信誉在拦。

**关键线索**：我们这次访问用的出口IP是`128.121.5.66`，查了一下归属是`AS2914 NTT America, Inc.`。用户确认这条IP其实是**公司自己的办公网络IP**。也就是说，这套拦截规则连自己人的正常办公流量都误伤了，说明规则大概率是按ASN/IP信誉粗筛的，不是精准识别自动化流量。

`robots.txt`本身被拦是个危险信号——按规范这个文件应该对所有爬虫无条件可访问，不该要求过人机验证。

**我们没法证明的部分**：无法证明真实Googlebot的抓取IP段是否也撞上了同一堵墙——需要用GSC或Vercel后台的数据才能确认，这不是我们能测出来的。

**请彪哥确认**：
1. Vercel后台Firewall / Attack Challenge Mode现在是不是开着的
2. 有没有对Googlebot/Bingbot官方IP段做白名单放行
3. `/robots.txt`、`/sitemap.xml`是否已从任何WAF挑战规则里排除

---

## 1 · 视频被判定为"页面补充内容"（🔴 已确认，来自GSC原文）

用户在GSC "URL检查 → 测试实际网址" 对该页面的实测结果：

> Google给出的视频未编入索引的原因：**视频不在观看页面上**
> 是否在观看页面上？**否 - 视频是页面的补充内容**
> 缩略图网址：`https://shortsbinge.com/opengraph-image/`（来源：HTML标记）

同一次"测试实际网址"操作里，用户还额外做了"检测到视频"这一项检测，结果显示**检测到视频**（结构层面识别到了video）。但用户随后查看Google抓取时生成的**页面渲染截图**（已保存在本地"下载"文件夹，文件名"测试页面屏幕截图.png"），发现截图里播放器所在的位置显示的不是正在播放的视频画面，而是网站自己的报错状态：

> "This episode couldn't load / Check your connection and try again." + 一个"Try again"按钮

也就是说，Google的实时渲染测试**独立地**捕捉到了和我们自己用浏览器自动化反复测试时同样的失败画面（详见下方第3条）。这不是我们自己测试工具的问题，是Google官方"测试实际网址"这个功能本身渲染出来的结果，证据效力比我们自己的观察更硬——建议彪哥直接向用户要这张截图核对。

这说明"检测到video标签"和"视频真的能播放"是两件不同的事：Google能在DOM里识别到有一个video容器存在（所以"检测到视频"通过了），但渲染时这个容器里放不出真实画面，播放器展示的是错误兜底态。

同时，用户确认该页面本身**已经被正常收录**（作为普通网页），只是在视频收录报告里单独判定失败。这两件事同时成立，跟Google官方文档描述的收录分层机制一致：

> "Just because the watch page is indexed doesn't mean that the video will also be indexed."
> —— [developers.google.com/search/docs/appearance/video](https://developers.google.com/search/docs/appearance/video)

Google对"有效watch page"的定义要求视频是页面的**主要内容**，而不是辅助材料：

> "A watch page is defined as a page where watching an individual video is the main reason the user is visiting the page."
> —— [同上，watch-page章节](https://developers.google.com/search/docs/appearance/video#watch-page)

**推测（基于用户提供的渲染截图，未实地核对DOM权重，建议技术自行确认）**：截图显示episode/1/这个播放页上，播放器下方同时展示了剧情简介（Plot）、标签、"Episode 2"按钮，以及完整全集列表（1~54集，含大量未解锁集数的锁形图标）。全集列表这块内容量不小，可能是Google判定"视频不是页面主体"的原因之一。缩略图来源是全站通用的`/opengraph-image/`，不是这一集专属缩略图，也可能削弱"这是独立视频页"的信号。

**建议排查方向**：
- 每一集生成专属缩略图/描述，不再共用同一个opengraph-image
- 评估是否可以在播放页降低全集列表/推荐位的视觉权重，让播放器在首屏更明显地占主导

---

## 2 · 播放器需要点击才加载视频（🟠 观测到，但不是这次GSC报告的原因，需另外验证）

我们这几天实测这个站的所有剧集播放页（包括这次查的queen-never-cry），发现一个统一的交互设计：打开页面先看到一张静态封面图，必须手动点击一次，`<video>`元素才真正开始加载。

这个交互模式，Google官方视频SEO文档里点名描述过一个失败原因，叫"Cannot determine video position and size"：

> "...typically happens when pages display a static image (like a player screenshot) requiring user clicks to start playback."
> —— [Search Console帮助中心，视频收录报告](https://support.google.com/webmasters/answer/9495631?hl=en)

同一份技术要求文档也写了：

> "Don't rely on user actions like clicking or swiping to load video content."
> —— [developers.google.com/search/docs/appearance/video#watch-page](https://developers.google.com/search/docs/appearance/video#watch-page)

**需要说明的是**：这次queen-never-cry这个页面GSC给出的实际原因是"补充内容"，不是"无法确定视频位置和大小"——这是两条不同的失败原因。我们不能确定这个"需要点击"的交互问题，是不是在**其他**剧集页面上触发了"Cannot determine video position and size"这条不同的失败原因。建议技术抽查GSC视频收录报告里，"未编入索引"的具体原因分布，看这两条原因各占多少，分别处理。

**建议修法**：播放器加载时就以实际尺寸把`<video>`元素注入DOM并指向真实播放地址，不需要等用户点击才开始加载（哪怕是静音自动加载、用户点击只是取消静音，也符合这条要求）。

---

## 3 · 视频加载速度不稳定（🟡 观测到，未量化，建议技术自行用真实监控数据核实）

这一条现在有两个独立来源的证据，不只是我们自己的观察：

- **Google官方"测试实际网址"的渲染截图**（见第1条，用户已保存本地）：播放器位置显示"This episode couldn't load"报错态
- **我们自己的浏览器自动化实测**：这几天用浏览器自动化反复测试同一批剧集页面，观察到`/api/play/{dramaId}/{episode}/`这个接口本身返回很快（200），但实际视频开始播放经常需要等20～50秒，个别情况等了1分钟以上仍未加载成功，前端会展示"This episode couldn't load / Try again"这个报错状态。同一批页面在不同天测试，结果不完全一致（有时候正常、有时候卡住），像是间歇性问题，不是每次必现。

这不是我们能精确定位根因的问题（可能是CDN冷启动、后端取流地址延迟、或别的原因），只是如实报告现象，建议技术用自己的监控/日志数据核实，不要直接套用我们这个不严谨的手动观察结果。

---

## 影响评估（附来源）

**不会受影响的部分**（有官方原文支撑）：

> "The watch page may still be shown as a text result, without a video thumbnail."
> —— [developers.google.com/search/docs/appearance/video](https://developers.google.com/search/docs/appearance/video)

页面本身在普通文字搜索结果里的排名，不会因为视频未编入索引直接被拖累。

**会实际损失的部分**：视频一旦正常编入索引，有资格获得搜索结果视频缩略图、Google Video模式、Google图片、Discover信息流、key moments等额外展示位，这些目前都进不去。对短剧这种"标题党钩子+可直接点开看"的内容形态，视频缩略图通常比纯文字结果更能拉点击率。

**规模判断**：第1、2条问题的根源都在模板/交互设计层面，不是`queen-never-cry`这一个页面独有的。建议先看GSC视频收录报告里"未编入索引"视频的总量级，判断这是几个页面的事还是全站量级的事，再决定投入多少资源。

---

## 我们这边能做的，不用等技术

- 别急着对这批页面反复点"请求编入索引"，第0、1条根因不解决，重复提交没有用
- 后续写blog时如果再遇到播放器长时间加载不出来，我们会记下具体URL和时间，方便和技术这边的监控数据对照

---

## 出处汇总

1. Google官方视频SEO文档（Watch page要求、技术检测要求）：https://developers.google.com/search/docs/appearance/video#watch-page
2. Google官方视频收录文档（收录分层机制、text-only fallback说明）：https://developers.google.com/search/docs/appearance/video
3. Search Console帮助中心，视频收录报告失败原因列表：https://support.google.com/webmasters/answer/9495631?hl=en
4. GSC "URL检查 → 测试实际网址" 对 queen-never-cry episode/1 的实测截图（用户提供，2026-09-29）
5. 站内curl实测（本次会话，2026-09-29）
6. ARIN IP归属查询（128.121.5.66 → AS2914 NTT America）：https://rdap.arin.net/registry/ip/128.121.5.66
