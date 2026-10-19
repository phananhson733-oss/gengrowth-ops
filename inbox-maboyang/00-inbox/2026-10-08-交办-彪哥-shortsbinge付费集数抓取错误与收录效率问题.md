---
title: 交办 · 彪哥 · shortsbinge.com 付费集数抓取错误与收录效率问题
date: 2026-10-08
交办对象: 彪哥
依据: 2026-10-08 GSC抓取统计信息"其他客户端错误(4XX)"明细截图 · 现场实测`/api/play/`接口 · robots meta逐页核查 · PageSpeed Insights真实用户数据 · dramafinds.com/dramashortstv.com对照排查
范围: shortsbinge.com，1条核心问题（优先级最高，建议先做）+1条独立的旁证数据。和已有的两份文档是独立的：`2026-10-07-交办-彪哥-shortsbinge技术问题跟进与新增需求.md`（视频缩略图/加载/演员页）、`2026-10-08-交办-彪哥-shortsbinge抓取量暴跌与响应变慢排查.md`（整体响应时间调查），三份文档各自成立，不要合并
---

# 交办 · shortsbinge.com 付费集数抓取错误与收录效率问题

## 一、核心发现：付费锁定集数的播放接口返回403，Googlebot在反复抓取

### 1.1 证据来源：GSC抓取统计"其他客户端错误(4XX)"明细

GSC后台"设置→抓取统计信息→抓取请求数：其他客户端错误(4XX)"的明细列表（10/6当天），**列出的URL清一色都是`/api/play/{剧ID}/{集数}/`这个接口**，不是别的页面类型。截图样本（本地文件见出处汇总）：

```
2026/10/6 08:38  /api/play/usybwyalpqvk/31/   其他客户端错误(4XX)
2026/10/6 08:34  /api/play/usybwyalpqvk/46/   其他客户端错误(4XX)
2026/10/6 08:21  /api/play/usybwyalpqvk/56/   其他客户端错误(4XX)
2026/10/6 08:19  /api/play/usybwyalpqvk/21/   其他客户端错误(4XX)
2026/10/6 07:55  /api/play/mkadafftnwav/48/   其他客户端错误(4XX)
……（还有更多，均为同一模式）
```

### 1.2 现场复现：403的边界精确落在"免费/付费"分界线上

对`usybwyalpqvk`这部剧的`/api/play/`接口，用真实浏览器同源请求逐集测试：

| 集数 | 1 | 2 | 5 | 8 | 11 | 20 | 21 |
|---|---|---|---|---|---|---|---|
| 状态码 | 200 | 200 | 200 | 200 | 200 | **403** | **403** |

这部剧前11集免费，12集起锁定付费。**403的边界精确落在免费/付费的分界线上**，不是随机故障。这个403本身是对的——不该让任何人（包括Googlebot）不付费就拿到付费集数的播放地址。**问题不是403本身，是Googlebot在反复尝试抓取这些注定失败的付费集数接口**，每一次都被计入站点的抓取错误率。

### 1.3 已排查：这不是Vercel Bot Protection那个问题

用真实浏览器同源请求复现的403，和10/7文档第1条的Vercel Security Checkpoint（429 + "Vercel Security Checkpoint"页面）是两个不同的东西，不要混为一谈。这条是应用层面的正常访问控制在正常工作，不涉及防火墙误拦截。

## 二、已有的noindex机制解决的是另一个问题，不是这个

### 2.1 核实结果：付费集数页面已经和免费非首集一样标了noindex

| | Episode 2（免费非首集） | Episode 15（付费锁定） |
|---|---|---|
| robots meta | `noindex, follow` | `noindex, follow` |
| `/api/play/`接口 | 200，正常 | **403，失败** |

两类页面的`noindex`标记是**一样的**，这个机制本身没问题，不是漏标了。

### 2.2 为什么noindex没能阻止这个问题

`noindex`只告诉Google"看完这页，别收录它"，**不等于"别抓取它"**。页面同时标了`follow`（抓取并追踪页面链接），Googlebot照常会抓取并渲染这个页面，渲染过程中页面逻辑会去调用`/api/play/`拿播放地址，这一步不受`noindex`影响，该调还是会调，然后撞上403。`noindex`从设计上就没打算管这件事。

## 三、为什么优先级要排高：和"发现"预算直接相关

GSC抓取统计里，"发现"（抓取新页面）只占全部抓取请求的18.47%，"刷新"占81.53%。**"发现"预算要覆盖的不只是新发布的blog，还包括新上线剧集的详情页和第一集**——这些和付费锁定集数的403请求，在抢同一个被压得很紧的预算池。每一次Googlebot去抓一个注定403的付费集数，都是从这个池子里扣掉的一次机会成本，而且**403还是实打实的错误，可能影响Google对整站抓取健康度的判断**，比单纯的效率浪费更严重。

## 四、建议的修复方向——不建议简单照抄竞品，说清楚权衡

### 4.1 排查过dramafinds.com的做法，但有个重要风险要先说明

dramafinds.com的robots.txt里直接把整个`/api/`路径都Disallow了：

```
Disallow: /api/
Disallow: /profile/
Disallow: /search
```

**但不建议直接照抄这个方案**，原因：

Googlebot渲染页面（生成用于判断"视频是否在观看页面上"的渲染结果）时，需要实际执行页面JS、完整加载视频，这一步**对免费集数同样会调用`/api/play/`**。如果在robots.txt里把`/api/play/`整体Disallow掉，Googlebot的渲染器拿不到播放地址，**免费集数的视频渲染结果可能会变成空播放器**——这会让我们正在排查的"视频未编入索引"问题更严重，不是更好。dramafinds能这么做，大概率是因为他们的架构和我们不一样（他们的剧集详情页像是单页+集数切换器，不一定对每一集生成独立URL，video数据的获取方式可能也不依赖这个被disallow的API路径），不能直接套用到我们的架构上。

### 4.2 建议的方案：前端逻辑层面不要对锁定集数发起播放请求

更干净的修法是在页面渲染逻辑里加一个判断：**集数状态已经锁定时，根本不要发起`/api/play/`请求**，直接展示解锁/付费提示。好处：

- 免费集数完全不受影响，Googlebot该拿到的视频数据照常拿到
- 付费集数不再产生403，错误率直接归零，不需要动robots.txt，不引入新风险
- 对真实用户也是更合理的交互——没必要先请求一次注定被拒绝的接口再展示付费提示

这个需要彪哥评估具体实现成本，是本文档优先级最高、建议第一个做的改动。

### 4.3 次要、更长远的考虑（优先级低于4.2，不紧急）

免费非首集（如Episode 2）虽然不报错，但毕竟也是在消耗"发现"预算抓一个`noindex`页面。4.2做完、错误率问题解决之后，如果还想进一步把"发现"预算让给新剧新集，可以再评估要不要在robots.txt里收紧非首集的抓取（不是现在就做，是观察4.2的效果之后再看）。

## 五、附带的独立发现：Core Web Vitals真实用户数据未通过

用Google PageSpeed Insights查了真实用户数据（Chrome UX Report，28天汇总，不是我们自己的实验室测试）：

| 指标 | 数值 | 评级 |
|---|---|---|
| Core Web Vitals总评 | — | **未通过** |
| LCP | 2.8秒 | 需要改进 |
| TTFB | 0.6秒 | 合格但偏高 |
| FCP | 2.1秒 | 需要改进 |

**这条不是一个新的独立问题，是`2026-10-08-交办-彪哥-shortsbinge抓取量暴跌与响应变慢排查.md`里响应时间退化的另一个佐证**——TTFB是LCP的前置环节，TTFB慢，LCP必然跟着慢，根因大概率是同一个。放在这里一并记录，不需要单独开排查线，等那份文档里的响应时间问题解决，这条应该会同步改善。

## 六、竞品/姊妹站对照结果

| 站点 | 情况 |
|---|---|
| dramafinds.com | 架构不同（Cloudflare而非Vercel，剧集页面结构也不同），没有缩略图共用问题，robots.txt已Disallow整个`/api/`——但如4.1所说，这个做法不建议直接照抄 |
| dramashortstv.com | **查不了，不是bug**——访问直接返回Vercel的"This Deployment is paused by the owner"（`DEPLOYMENT_PAUSED`），9/28已主动暂停，不在本次排查范围内 |

## 出处汇总

1. GSC抓取统计"其他客户端错误(4XX)"明细截图：`~/Desktop/截屏2026-10-08 上午5.43.18.png`
2. 现场实测：`/api/play/usybwyalpqvk/{1,2,5,8,11,20,21}/`状态码、`nights-with-my-ceo`剧episode/2和episode/15的robots meta对比
3. dramafinds.com robots.txt：https://dramafinds.com/robots.txt
4. dramashortstv.com现状：https://dramashortstv.com/ （DEPLOYMENT_PAUSED）
5. PageSpeed Insights真实用户数据：https://pagespeed.web.dev/analysis?url=https%3A%2F%2Fshortsbinge.com%2F
6. 相关但独立的文档：`inbox-maboyang/00-inbox/2026-10-07-交办-彪哥-shortsbinge技术问题跟进与新增需求.md`、`inbox-maboyang/00-inbox/2026-10-08-交办-彪哥-shortsbinge抓取量暴跌与响应变慢排查.md`
