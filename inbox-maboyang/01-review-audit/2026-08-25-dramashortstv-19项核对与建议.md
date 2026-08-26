---
title: dramashortstv.com · 19 项修复核对与后续建议
date: 2026-08-25
样本: 约 3,000 次请求 · 400 组详情/播放页 · 1,000 次多语言交叉 · 150 个分集页 · sitemap 全量
结论: 16 项通过 · 2 项部分 · 1 项撤回（由第 3 项覆盖）
---

# 19 项修复核对与后续建议

## 一、核对结果

| 序     | 项目                           | 结论            | 实测                                                                     |
| ----- | ---------------------------- | ------------- | ---------------------------------------------------------------------- |
| 1     | 分集页 canonical 自指             | ✅             | 150/150 含 `?episodesNum=`                                              |
| 2     | 播放页加剧集入口                     | ✅             | 400/400                                                                |
| **3** | **sitemap 英语条目改无前缀**         | ⚠️ **部分**     | `/en/` 3,580 → **0** ✅；**但其余 20 种语言的 23,935 条仍带前缀，指向 Google 不采用的 URL** |
| 4     | 英语 307 → 301                 | ✅             | 30/30 → 301                                                            |
| 5     | 详情页收敛为单 H1                   | ✅             | 400/400 H1=1                                                           |
| 6     | VideoObject + BreadcrumbList | ⚠️ **部分**     | 详情页 400/400 齐全；**播放页 400/400 缺 BreadcrumbList**                        |
| 7     | 语言错配重定向                      | ❌ 未做，**但不必做** | 1,000 次交叉零跳转。**该问题由第 3 项的 canonical 收口覆盖，不需要单独做跳转**                    |
| 8     | keywords 无 `[object Object]` | ✅             | 800 页命中 0                                                              |
| 9     | 播放页 canonical 指向详情页          | ✅             | 400/400                                                                |
| 10    | blog 删除空 `@id`               | ✅             | 21 篇全部 `MISSING`，空字符串 0                                                |
| 11    | for-you canonical 自指         | ✅             | 30/30                                                                  |
| 12    | 404 页只保留 noindex             | ✅ 实质通过        | 矛盾已消除（两条均为 noindex 系）。标签冗余，无影响                                         |
| 13    | 过滤 description 占位符           | ✅ 实质通过        | 英文 `Default` 清零。约 2% 页面仍显示本地化占位（见注）                                    |
| 14    | genre / search 补 H1          | ✅             | 各 5 次均 H1=1                                                            |
| 15    | `Accept: */*` 放行             | ✅             | 100 路径全 200；GPTBot 12/12                                               |
| 16    | www → apex 301               | ✅             | 5/5                                                                    |
| 17    | 静态页补 og:image                | ✅             | 10 页各 2 次全有                                                            |
| 18    | 经营指标裁剪                       | ✅             | 33 页累计 0 处（原首页各 80 处）                                                  |
| 19    | 静态资源不被 404                   | ✅             | 40/40                                                                  |

> **第 12、13 项不必处理。**
> 12：404 页由状态码本身阻止索引，meta robots 是多余的一层；两条都是 noindex 系无冲突。纯代码整洁问题。
> 13：占位符出现在**源库没有简介**的剧上（`/detail/14479` 是土耳其语的 `Varsayılan`），title / H1 / keywords 均正常。meta description 不是排名因素，且 Google 常自行重写。过滤字符串只会变成空描述。**真正值得问的是「有多少部剧源库里没简介」**——数量大的话那批属薄内容，该 noindex 而非修描述。待统计。

> 测量说明：1,000 次并发把站点压出 57 次 504、16 次 502，**是我方施压所致，非站点故障**。后续复核已改串行。复核请勿并发。

---

## 二、两项待处理

### ⚠️ 3 · sitemap 只改了英语，其余 20 种语言是同一个问题

英语部分做对了：`/en/` 3,580 条换成裸 `/detail/{id}`，`/en/detail/*` 做 301。

**但其余 23,935 条（87%）仍是带语言前缀的，而 Google 不采用那些 URL。**

dramafinds.com 用同一套实现、跑了约 7 周，实证：

```
site:dramafinds.com/ja        → 日语剧确实被收录
   dramafinds.com › detail    私を壊したすべてのXたちへ
   dramafinds.com › detail    権力の花園

site:dramafinds.com inurl:/ja/ 或 /th/ /es/ /de/ /in/   → 零结果
```

**内容被收录了，但收在裸 `/detail/` 上。** 原因是同一部剧在 `/detail/{id}` 与 `/ja/detail/{id}` 上内容完全相同，Google 判定重复后选了更短的裸路径——即使页面 canonical 自指到带前缀那个。

> **先澄清一个容易误判的点**：语言目录是**按语言筛选的片库**，不是同一批剧的翻译版。`/ja` 首页列的全是日语剧（ID 与泰语剧完全不同），`/th` 列泰语剧。**这个设计本身没问题。**

**同时要修的第二件事**：sitemap 的 ID 范围没变。

```
ID 范围     7,870 – 38,105（与修复前一致）
线上新剧 49017   不在其中
≥49,000 的      0 条
```

**最新的剧 Google 一个都发现不了。**

**改法（三条一起做，同时覆盖第 7 项）**：

1. **sitemap 全部改用裸 `/detail/{id}`**，与 Google 实际采用的版本一致
2. **用生产库真实 ID 重新生成**，覆盖新剧
3. 🔴 **所有 `/xx/detail/{id}` 的 canonical 改为指向裸 `/detail/{id}`**

第 3 条是关键，**做了它第 7 项就不用做了**——跨语言重复由 canonical 解决，不需要语言检测跳转。

> **这正是 `/en/` 原来的行为。** 8/14 审计记录：
> ```
> /en/detail/7875   canonical → /detail/7875      ← 跨指
> /de/detail/7870   canonical → /de/detail/7870   ← 自指
> ```
> 当时的矛盾是「sitemap 说 `/en/`、canonical 说裸路径、裸路径没提交」，技术侧用方案 B 把 sitemap 改成裸路径，方向对了但只对 `/en/` 做。
> **正确的收口是把 `/en/` 那套跨指 canonical 推广到全部 20 种语言**，而不是让它们保持自指。

语言目录保留供用户浏览即可，**不需要 noindex，也不需要翻译内容**。

> 另：sitemap 已改名 `drama-sitemap.xml` → `drama-detail-sitemap.xml`，旧地址 404。**GSC 里若提交的是旧地址需重新提交。**

#### 复现：语言切换器做了什么

浏览器实测 `/ja/detail/27984`（一部日语剧），点语言切换器选 English：

```
切换前   /ja/detail/27984   lang=ja   UI「エピソード」      title 消防士の元夫…（日文）
切换后   /detail/27984      lang=en   UI「Episode List」   title 消防士の元夫…（还是日文）
```

**语言切换只换 URL 前缀和界面文案，剧集 ID 不变**，所以剧名简介跟着那部剧走，不翻译。

| 路径 | 表现 | 原因 |
|---|---|---|
| 主页 → 切语言 → 点进去 | 语言正确 | 切换后**片库换了**，点的是该语言自己的剧 |
| 详情页 → 切语言 | 标题不变 | 已锁定某部剧，切语言不会换成另一部 |

产品行为合理。副作用是**同一部剧在两个 URL 下各自 self-canonical**，这正是 Google 收敛到裸路径的直接原因。

#### ⚠️ 我们 8/14 的建议依据是错的

`01-review-audit/2026-08-14-技术审计-dramafinds.md` 第 1.1 节给了两个方案：

| | 内容 | 结果 |
|---|---|---|
| **A（我们推荐）** | 把 `/en/detail/*` canonical 改自指，**与其他 20 种语言一致** | ❌ 未采纳 |
| **B** | sitemap 换成 `/detail/*`，`/en/detail/*` 做 301 | ✅ **技术侧执行的是这个** |

**技术侧选了 B，而且选对了。**

推荐 A 的依据是「与其他 20 种语言一致」——把那 20 种语言的自指 canonical 当成了正确参照。今天的证据推翻了这个前提：**那 20 种语言的自指 canonical 同样没被 Google 采纳**。按 A 执行的话，`/en/` 会变成又一个 Google 不采用的自指 URL，比现状更糟。

**教训**：「跟已有做法保持一致」不能作为正确性依据。**先验证已有做法本身有没有效果。**

### 7 · 语言错配重定向 —— 未做，但建议不做

50 部剧 × 20 个语言目录 = 1,000 次请求，**零跳转**。

**但这条我们撤回。** 当初提这个需求时，我是**自己拼 URL** 测出来的（拿泰语剧的 ID 去请求 `/ja/`）。站内正常浏览不会产生这种链接，唯一的例外是**在详情页切语言**：`/th/detail/7982` → 切日语 → `/ja/detail/7982`。

这些 URL 确实存在，但不在 sitemap 里、也没有服务端链接指向。**用 canonical 收口（第 3 项改法第 3 条）比做语言检测跳转更简单，也和 Google 已经在做的事一致。**

技术侧备注写的「（3 个页面）」不必再追问了。

### ⚠️ 6 · 播放页缺 BreadcrumbList

```
详情页   ['BreadcrumbList','VideoObject']   400/400
播放页   ['VideoObject']                    400/400
```

补一个即可。播放页 canonical 已指向详情页，不参与索引，优先级不高。

---

## 三、不在这 19 项里的两件事

### 🔴 test 子域在给 dramafinds 投票

现状未变：

```
https://test.dramashortstv.com/
  title      … - Dramafinds
  canonical  https://dramafinds.com      ← 我们的子域指向对方
  robots     index, follow
  GA4        G-589NVFPMGY                ← 对方的
  AdSense    ca-pub-4100144534092026     ← 对方的
```

**改法**：下线公网解析；必须保留就加 Basic Auth/WAF + 响应头 `X-Robots-Tag: noindex, nofollow`。

### 🔴 与 dramafinds 99.97% 重复

同秒配对实测：词数 **7,528 : 7,528 完全相同**，相似度 **99.97%**。

dramafinds 也是新站（域名 2026-07-03、月访 649）。**两边都还没建立权重优势——现在分叉，代价比晚三个月小得多。**

---

## 四、动手顺序

| 序 | 事项 | 成本 |
|---|---|---|
| 1 | test 子域下线或加认证 | 一条 DNS/WAF 规则 |
| 2 | **sitemap 重建 + canonical 收口**（第 3 项三条，同时覆盖第 7 项） | 小 |
| 3 | 播放页补 BreadcrumbList（第 6 项） | 小 |
| 4 | 首页与平台文案跟 dramafinds 分叉 | 大，需排期 |

前三条都是小改动。第 4 条是唯一需要真投入的。

> **第 7 项（语言错配跳转）已撤回**，不需要排期。理由见二·7。

---

## 附 · 复核命令

```bash
H=(-A "Mozilla/5.0 (Macintosh) Chrome/128.0"
   -H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")

# 3 · sitemap 里带前缀的比例（应降到 0）
curl -s -H "Accept: application/xml" https://dramashortstv.com/drama-detail-sitemap.xml \
  | grep -oE '<loc>https://dramashortstv\.com/[a-zA-Z-]+/detail/' | wc -l

# 3 · sitemap 最大 ID（应覆盖线上新剧）
curl -s -H "Accept: application/xml" https://dramashortstv.com/drama-detail-sitemap.xml \
  | grep -oE '/detail/[0-9]+' | grep -oE '[0-9]+' | sort -n | tail -1

# 3 · 各语言 canonical 是否收口到裸路径（应全部指向 /detail/19995）
for L in ja de es th ko tr; do
  printf "/%-3s " "$L"; sleep 1
  curl -s "${H[@]}" "https://dramashortstv.com/$L/detail/19995" \
    | grep -oE 'rel="canonical" href="[^"]*"'
done

# 6 · 播放页 schema
curl -s "${H[@]}" https://dramashortstv.com/video-play/19995 \
  | grep -o 'BreadcrumbList\|VideoObject' | sort | uniq -c

# test 子域
curl -s "${H[@]}" https://test.dramashortstv.com/ \
  | grep -oE 'rel="canonical" href="[^"]*"|G-[A-Z0-9]{6,}|ca-pub-[0-9]+' | sort -u
```
