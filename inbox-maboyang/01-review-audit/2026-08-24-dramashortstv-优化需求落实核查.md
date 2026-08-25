---
title: dramashortstv.com · 全量 SEO 审计
date: 2026-08-24
版本: v4（全量取样重做，取代此前所有版本）
样本: 约 3,400 次请求 · 391 组页面配对 · 630 次多语言交叉 · 451 条 sitemap URL · 43 篇 blog 全量普查
方法: curl/urllib 带完整浏览器 Accept 头 · 同秒并发配对抓取 · 并发异常均串行复测
---

# dramashortstv.com · 全量 SEO 审计

## 取样说明

此前几版的结论有两次是从**单个样本**推出的全称判断，都出过错。本版所有结论标注样本量，不做外推。

| 阶段 | 样本 |
|---|---|
| A · 内容协商 | 50 个路径 × 3 种请求头 = 150 次 |
| B · detail/video-play 配对 | **391 组成功配对**（400 抽样）= 800 次 |
| C · 多语言交叉 | 30 个剧集 ID × 21 个语言目录 = **630 次** |
| D · sitemap 有效性 | drama-sitemap 抽 400 + sitemap.xml 全量 51 |
| E · 与 dramafinds 相似度 | **40 个页面同秒并发配对** |
| F · blog | **43 篇全量普查** |
| G · 静态页模板 | 10 个页面 |

> ⚠️ **两个测量陷阱**（都踩过）：
> 1. **必须带 `Accept: text/html`**，裸 curl 默认 `*/*` 会把全部路径误判为 404
> 2. **相似度必须同秒并发抓取**，否则测到的是剧集轮播差异（非配对测得 89%，配对测得 99.98%）
> 3. 并发下有约 3% 请求超时返回空。本版全部串行复测过——**sitemap.xml 51 条串行复测 51/51 均为 200**，那些超时不是站点问题

---

## 一、排期表三项「已完成」的核查

| 项                      | 实测                                                  | 样本       |
| ---------------------- | --------------------------------------------------- | -------- |
| **3 · sitemap 英语 url** | ❌ **未完成**。3,580 条 `/en/` 一条没删，抽样中 43 条全部 307        | 400      |
| **6 · 页面级调整**          | ❌ **未完成**。剧集页 H1 **全部是 2 个**；核心模板 JSON-LD **全部为 0** | 391      |
| **7 · 介绍页（面包屑）**       | ⚠️ **一半**。介绍页层级有了，BreadcrumbList **一个都没有**          | 391 + 10 |

> 第 3、6 项改动量极小，**先确认是不是改了没提交**。

---

## 二、问题与改法

### 🔴 1 · 每部剧被复制成 20 个语言 URL，内容完全相同

**问题**（30 部剧 × 21 个语言目录 = 630 次实测）：

| 检查 | 结果 |
|---|---|
| **title 在所有语言下完全相同** | **30/30 部（100%）** |
| 每部剧的 title 唯一值数量 | **全部为 1** |
| 200 页中 canonical **自指** | **594/594** |
| hreflang | **0** |
| 跳转的语言目录 | **只有 `/en/`**（30/30 全部 307） |

语言前缀只本地化 UI 壳，剧集主体内容不变：

```
/th/detail/7982   UI「รายการตอน」    title=การกลับมาของสามีมาเฟียของฉัน
/ja/detail/7982   UI「エピソード」    title=การกลับมาของสามีมาเฟียของฉัน   ← 泰语
/de/detail/7982   UI「Episodenliste」title=การกลับมาของสามีมาเฟียของฉัน   ← 泰语
```

**约 27,515 部剧 × 20 个语言目录，各自 self-canonical、零 hreflang——Google 无从判断它们是同一内容的语言变体。**

**改法**（二选一）：
- 真正本地化剧名与简介，并补齐互相引用的 hreflang + x-default
- 或只保留默认语言可索引，其余语言目录 `noindex`

---

### 🔴 2 · test 子域在为 dramafinds 投规范化票

**问题**：`test.dramashortstv.com` 公开、`index, follow`，跑的是 **dramafinds 的构建**：

```
title      : Watch Free Short Dramas Online | Full Episodes - Dramafinds
canonical  : https://dramafinds.com
GA4        : G-589NVFPMGY              ← 与 dramafinds 相同
AdSense    : ca-pub-4100144534092026   ← 与 dramafinds 相同
与 dramafinds 同秒配对相似度：100.00%
```

**我们的子域在给对方站导统计数据和广告收入，并把 canonical 投给对方。**

**改法**：移除公网解析；必须保留就加 Basic Auth/WAF + `X-Robots-Tag: noindex, nofollow`（不要只靠 robots.txt）。

---

### 🔴 3 · 与 dramafinds 近乎逐页复制

**问题**（40 个页面同秒并发配对）：

| | 结果 |
|---|---|
| **A/B 可见词数完全相同** | **40/40 页** |
| 相似度 | 最低 **96.84%** · 中位 **99.14%** · 最高 **99.98%** |
| ≥95% | **40/40** |
| ≥99% | 23/40 |

按页型中位数：

```
/                99.98%      /cookie-policy   99.22%
/terms           99.56%      /blog            99.13%
/privacy         99.49%      video-play       98.64%  (n=10)
detail           99.30% (n=23)  /genre        97.40%
                             /about           96.84%
```

**词数逐页完全相同**意味着两站渲染的是同一批剧、同一顺序——不只共用 API，是同一套部署配置。

**注意 `/privacy` 99.49%、`/terms` 99.56%、`/cookie-policy` 99.22%**——法律页也是直接复制的。

**blog 层**（43 篇全量）：

| 检查 | 结果 |
|---|---|
| **正文含 `Dramafinds`** | **43/43 篇** |
| 可见文本出现次数 | 最少 7 · 中位 **11** · 最多 17 |
| 全文 HTML 出现次数 | 最少 58 · 中位 74 · 最多 92 |
| 标题为罗马尼亚语 | 2 篇（`thirsty-for-the-wet-nurse-online`、`perechea-gresita-a-alfei`），但 `html lang` 全部是 `en` |

**改法**（按改动量排序）：
1. **43 篇 blog 批量替换 `Dramafinds` → `DramaShortsTV`**（最优先，一次替换）
2. 2 篇罗马尼亚语重写或下架
3. 重写 `/about`、`/faq`、`/privacy`、`/terms`、`/cookie-policy`
4. **首页模块结构分叉**——精选模块化排布代替全量剧卡倾倒

> 剧名与简介来自同一套 API，27,515 条逐条改写不现实。要动的是**平台文案与页面结构**。

---

### 🔴 4 · `/detail` 与 `/video-play` 抢同一个词

**问题**（391 组配对）：

| 检查 | 结果 |
|---|---|
| **title 完全相同** | **391/391（100%）** |
| description 完全相同 | 168/391（43%） |
| description 前缀一致 | 223/391（57%） |
| **description 完全无关** | **0** |
| 两边 robots | **全部 `index, follow`** |
| 两边 canonical | **全部自指** |

detail 页把简介截断在约 323 字符（长度中位数 323，范围 44–358），所以简介短的两边字节相同，长的是前缀关系。

**无论哪一档，都是两个可索引页面共用同一个标题。**

**改法**：介绍页保留可索引，**播放页改 `noindex`，或 canonical 指向介绍页**。

---

### 🔴 5 · sitemap 里全是跳转和旧 ID，规范 URL 一条没有

**问题**（400 抽样 + 51 全量）：

| 检查 | 结果 |
|---|---|
| `/en/` 条目 | **3,580 条**；抽样 43 条 **全部 307** |
| 非 `/en/` 条目 | 抽样 347 条全部 200 |
| **裸 `/detail/{id}`（规范主体）** | **0 条** |
| **`/video-play`** | **0 条** |
| ID 范围 | **7,870 – 38,105** |
| 含线上新剧 ID（如 49017） | **否**，≥49000 的 **0 条** |

**改法**：
1. 删掉全部 `/en/` 条目
2. **307 改 301**——默认语言合并是永久的
3. 用生产库真实 ID 重新生成，收录裸 `/detail/{id}`
4. 给 `/video-play` 定索引策略（见问题 4）

---

### 🔴 6 · 全站没有一条结构化数据（blog 除外，且 blog 的也是坏的）

**问题**：

| 范围 | ld+json 块数 |
|---|---|
| 391 个 detail 页 | **全部 0** |
| 391 个 video-play 页 | **全部 0** |
| 10 个静态页（含首页、genre、about、faq、法律页） | **全部 0** |
| 43 篇 blog | 各 1 块 `BlogPosting`，但 **`mainEntityOfPage.@id` 全部是空字符串 `""`** |

**改法**：剧集页加 **VideoObject**，各层加 **BreadcrumbList**，修好 blog 的 `@id`。

---

### 🔴 7 · RSC 数据流向所有访客泄露经营指标

**问题**：首页 HTML 里 `recentRevenue`、`promotersCnt` **各出现 80 处**，查看源码即可读。

**改法**：这些字段不应进入客户端 payload，服务端裁剪。

---

### 🟠 8 · H1 全线失序

| 页面 | H1 数 | 样本 |
|---|---|---|
| `/detail/{id}` | **2**（文本完全相同） | 391/391 |
| `/video-play/{id}` | 1 | 391/391 |
| `/genre`、`/search` | **0** | — |
| `/about`、`/faq`、`/privacy`、`/terms`、`/cookie-policy` | **各 3** | — |
| `/` | 1，但内容是轮播剧名，随运营轮换 | — |
| blog 文章 | 1 ✅ | 43/43 |

**改法**：剧集页删重复 H1；genre / search 补 H1；五个静态页收敛到 1 个；首页 H1 改为表达站点定位的固定文案。

---

### 🟠 9 · `Accept: */*` 的请求全部返回 404

**问题**（50 个路径 × 3 种头，**零例外**）：

```
浏览器头      200 × 50   (100%)
Accept: */*   404 × 50   (100%)   ← 且带 noindex
Googlebot     200 × 50   (100%)
```

Googlebot 不受影响，但部分 AI 爬虫、拨测、链接检查器默认发 `*/*`。

**改法**：排查 Next.js 那层为什么按 Accept 头分流到 404。

---

### 🟠 10 · www 提供完整重复站

**问题**：`www.dramashortstv.com` 返回 **200 且不跳转**，与 apex 同秒配对相似度 **100.00%**。

canonical 已正确指向 apex，风险减半。

**改法**：CDN/DNS 层做 www → apex 的 **301**，保留 query string。

---

### 🟠 11 · 全部静态页缺 og:image

**问题**（10 个静态页 + 391 个剧集页）：

| 范围 | og:image |
|---|---|
| **10 个静态页全部**（含首页、genre、blog列表、about、faq、法律页） | **全无** |
| 391 个 detail 页 | **全部有**，host 为 `crazymaplestudios.com`，**0 个带签名** |
| 43 篇 blog 文章 | 全部有（`cdn.claw-media.net`） |

> 此前发现 `/detail/49017` 的 og:image 带约 2 小时过期签名（`static.flareflow.tv`）。**391 个 sitemap 内 ID 中带签名的是 0 个**——签名图只出现在 sitemap 外的新剧上（49017 不在 sitemap）。范围有限但仍需修。

**改法**：补上静态页 og:image；新剧详情页改用不过期的图片地址。

---

### 🟠 12 · 404 页输出互相矛盾的 robots 指令

**问题**：404 页同时含 `content="noindex"` 与 `content="index, follow"` 两条。

**改法**：只保留 `noindex`。

---

### 🟡 13 · `/for-you` 的 canonical 指向首页

**问题**：已正确设 `noindex, nofollow`，但 canonical 指向首页——两个信号打架。另外它的 title 只有 23 字符。

**改法**：canonical 改自指或去掉。

---

### 🟡 14 · `/video-play` 的 meta keywords 有 `[object Object]`

```
My Professor Is My Alpha, [object Object], [object Object], [object Object], ...
```

JS 序列化 bug 漏进 meta 标签。

**改法**：修掉序列化；顺带考虑整站删除 meta keywords——这是与 dramafinds 共享的模板指纹，且早已无 SEO 价值。

---

### 🟡 15 · 个别剧集 description 是占位符 `Default`

`/detail/37600` 的 meta description 是字符串 `Default`。

**范围有限**：391 个随机 ID 中命中 **0 个**。属个例，但建议查一下取值逻辑。

---

### 🟡 16 · 首页 canonical 少一个尾斜杠

页面在 `https://dramashortstv.com/`，canonical 写 `https://dramashortstv.com`。属等价写法，不致命。

---

## 三、待跑

**Lighthouse 移动端未跑。** 同事审计报告称首页 55 分 / FCP 15.3s / LCP 17.7s / 4,524 KiB，我无法复现，需自行补跑。

桌面端未限速实测：HTML 解压 843 KiB、全部资源解压 2,162 KiB、`load` 5.27s、`__next_f.push` 70 段。

---

## 附 · 复核命令

```bash
H=(-A "Mozilla/5.0 (Macintosh) Chrome/128.0"
   -H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")

# 内容协商（必须对比两种头）
for p in / /genre /detail/49017; do
  printf "%-20s 浏览器:%s  */*:%s\n" "$p" \
    "$(curl -s "${H[@]}" -o /dev/null -w '%{http_code}' "https://dramashortstv.com$p")" \
    "$(curl -s -A 'Mozilla/5.0' -o /dev/null -w '%{http_code}' "https://dramashortstv.com$p")"
done

# 多语言重复：同一 ID 跨前缀的 title 应当不同，实际相同
for L in th ja de es ko; do
  printf "/%-6s " "$L"
  curl -s "${H[@]}" "https://dramashortstv.com/$L/detail/7982" | grep -oE '<title>[^<]*' | head -1
done

# 相似度（必须同秒并发，否则测到的是轮播差异）
curl -s "${H[@]}" https://dramashortstv.com/ -o /tmp/a.html &
curl -s "${H[@]}" https://dramafinds.com/    -o /tmp/b.html &
wait

# sitemap 待删条数
curl -s "${H[@]}" -H "Accept: application/xml" https://dramashortstv.com/drama-sitemap.xml \
  | grep -c '<loc>https://dramashortstv.com/en/'

# test 子域
curl -s "${H[@]}" https://test.dramashortstv.com/ \
  | grep -oE 'rel="canonical" href="[^"]*"|G-[A-Z0-9]{6,}|ca-pub-[0-9]+' | sort -u
```

*审计时间 2026-08-24 04:46–05:09 UTC。完整原始输出见 scratchpad 的 `audit_full_result.txt` 与 `audit_sim_result.txt`。*
