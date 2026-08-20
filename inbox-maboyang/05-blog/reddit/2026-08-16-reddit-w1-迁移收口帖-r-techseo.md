---
title: Reddit W1 发帖稿 · 迁移做对了所有事，旧 URL 仍拿走 88% 展示
date: 2026-08-16
版块: r/TechSEO
系列: 12 周发帖计划 · 第一阶段（迁移系列）第 1 篇
状态: 已发布
人设: 一个自己做 SEO、爱钻研的个人从业者。全文第一人称单数，不出现 we
数据: GSC 导出 2026-08-11（窗口 2026-05-10 → 08-09，92 天）+ 08-13（窗口 08-04 → 08-10）
约束: 无链接 · 不提品牌 · 单站数据须声明 · 结尾为真实未解问题
---

# W1 发帖稿 · r/TechSEO

## ⚠️ 先记两处对计划表的更正

写稿前把 A1 的数字回溯到 GSC 原始导出重算，发现两处：

| 项 | 计划表写的 | 实际重算 | 说明 |
|---|---|---|---|
| 旧 URL 数量 | 98 个 | **97 个** | 8/11 导出，过去 3 个月窗口 |
| 88.3% / 64.1% 的出处 | 未标注 | **8/11 导出，窗口 2026-05-10 → 08-09** | 三份 3 个月导出的占比各不相同，必须锁定是哪一份 |

**三份「过去 3 个月」导出的占比完全不同**，不锁定导出日期这个数字就不可复现：

| 导出日 | /en/ URL 数 | /en/ 展示 | 占展示 | 占点击 |
|---|---:|---:|---:|---:|
| 8/03 | 94 | 7,279 | **94.7%** | 66.7% |
| **8/11** | **97** | **8,821** | **88.3%** | **64.1%** |
| 8/12 | 97 | 9,028 | 86.1% | 64.1% |

**而这张表本身就是帖子里最有价值的一段**——见第三节。

**计划表和素材库 A1 已同步改正。**

---

## 一、发帖稿（英文，可直接粘贴）

### 标题（三选一，建议第 1 个）

1. **Did every step of this migration right. Three months later the dead URLs still take 88% of impressions.**
2. Stripping every reference to your old URLs is what stops Google from ever seeing the redirects
3. My redirects are correct and Google has never once seen them. 3 months of GSC data, one site.

> 建议第 1 个：数字在前、反直觉在后。r/TechSEO 的标题习惯是平实陈述，不是设问。

### 正文

```
I moved a site off a /en/* prefix onto root-level URLs. Small site, low
authority, about 150 URLs that get any impressions at all. One site, so n=1.
Case study, not a finding.

The standard reply to a post like this is "you misconfigured the redirects", so
let me clear that first. I checked all of this by hand against the live site:

- old URLs return 308 straight to the destination, no chains
- robots.txt doesn't block the old prefix
- sitemap.xml has zero old URLs in it
- no internal link anywhere still points at the old prefix
- new URLs are self-canonical
- nothing in hreflang points back (there's no hreflang left at all)

All clean. There's no config bug here to find.

GSC, past three months, window 2026-05-10 to 2026-08-09, exported on the 11th:

  97 dead /en/* URLs -> 8,821 impressions, 88.3% of the site total
                        25 clicks, 64.1% of the site total

One retired URL on its own did 908 impressions and 20 clicks. Site total for
that window was 39 clicks. So a URL that hasn't existed for months accounted for
slightly over half the clicks the site got.

Took me way too long to work out why.

I did the cleanup properly. Pulled the old URLs out of the sitemap, stripped
every internal link pointing at them. Which means Googlebot now has no reason to
request those URLs. No sitemap entry, no internal link, nothing. And if it never
requests the old URL, it never gets served the 308.

The redirects are fine. Nothing is looking at them.

On a site with a decent crawl budget this sorts itself out in a few weeks,
because the recrawl queue comes back around on its own. On a low-authority site
it can sit like this for months. Which I knew in the abstract and had completely
failed to connect to my own situation.

Here's the bit I actually wanted to post about.

  export 08-03:  7,279 impressions on dead URLs, 94.7%
  export 08-11:  8,821 impressions on dead URLs, 88.3%
  export 08-12:  9,028 impressions on dead URLs, 86.1%

Share going down. Absolute number going up.

These are all "past 3 months" sliding windows so they're not the same period and
I want to be careful about that. But the dead URLs picked up more impressions in
the days each window added than they lost in the days it dropped. They're not
sitting there decaying. They're still collecting new impressions.

The percentage only improved because I published new content and made the
denominator bigger. I'd already written "redirect consolidation is progressing"
in a report before I bothered checking the absolute number. It wasn't
progressing.

Most recent seven days I have (08-04 to 08-10): 45 dead URLs, 1,326 out of 2,183
impressions. Still 60.7%.

One thing I got wrong, since I claimed a clean sweep further up. 7 of the old
URLs 308 to pages that now 404. Real defect, my fault, about 58 impressions
between them, fixed separately. Doesn't change the pattern on the other 90.

Now the part I can't figure out.

I lined up the 8 highest-impression dead URLs against their new-URL equivalents.
3 of the new URLs have their own rows in the report. 5 don't appear at all. Not
small numbers, just absent. For those 5, going by page-level data, the retired
URL is the only one that exists.

Before someone points it out: page-level rows are subject to reporting
thresholds, so no row doesn't prove no impressions. Fair. But 5 of 8 feels like
a lot for threshold noise, and I can't find anything that separates the 3 from
the 5. Not publish date. Not rank, the ranks are scattered in both groups. Not
whether the slug changed in the move.

So if you've closed out a prefix migration on a site without much crawl budget:
did you see the old and new URL both reporting for a while, or did the new one
just not show up until the old one dropped out? Trying to work out whether those
5 are a normal in-between state or a symptom of something I still haven't found.
```

**字数**：约 590 词。

---

## 二、这一版为了去掉 AI 痕迹改了什么

**原稿有六处典型的机器写法，都改了：**

| # | 原稿 | 问题 | 改成 |
|---|---|---|---|
| 1 | `Migration "done" is a server-side state. Migration "recognised" is an index-side state.` | **对偶格律**。两句同构、只换一个词，是最明显的 LLM 句式 | **整段删掉**。这个意思前面已经讲完了，留着就是为了漂亮 |
| 2 | `They are not decaying residue. They are actively accruing new impressions.` | 否定 + 肯定的成对结构，同样是格律 | `They're not sitting there decaying. They're still collecting new impressions.`（加缩写、去掉 actively） |
| 3 | `Not low numbers — absent.` | 破折号纠正式，AI 高频 | `Not small numbers, just absent.` |
| 4 | `Not publish date, not rank, not whether the target changed slug.` | 三重否定排比，太齐 | 中间插一句打断：`Not rank, the ranks are scattered in both groups.` |
| 5 | `Six for six.` | 短促总结句，收得太利落 | `All clean.` 后面直接接下一句，不留金句位 |
| 6 | 破折号 5 处 | 密度过高 | 减到 1 处 |

**另外做的：**
- **全文改第一人称单数**，`we / our` 一处不留。人设是自己盯这个站的个人从业者
- 补了两处只有真做过的人才会写的东西：`Which I knew in the abstract and had completely failed to connect to my own situation`、`before I bothered checking the absolute number`
- 加缩写（`doesn't` / `they're` / `I'd`），句长刻意打散，混进 `Fair.` 这种一词句
- 拼写统一美式（原稿 `recognised` 混了英式）

---

## 三、为什么这一版和素材库 A1 的写法不同

素材库把 A1 概括为「迁移做全了，旧 URL 仍占 88.3% 展示」。**只写这一句，帖子的价值就只是一个数字。**

重算数据后加进去的三样，才是这篇能立住的原因：

| 加的内容 | 为什么关键 |
|---|---|
| **占比在降、绝对值在涨** | 全文唯一真正反直觉的一段，而且是我自己差点报错的结论。**它把帖子从"案例分享"变成"方法论警告"** |
| **单个死 URL 占全站 51% 点击** | 88.3% 是比例，读者会想"分母多小"。20/39 次点击落在一个不存在的 URL 上，具体到不可辩驳 |
| **5/8 新 URL 无数据行 + 阈值反驳** | 结尾的真问题要具体到能被回答。"你怎么看迁移"没人接，"5 个里 3 个有数据 2 个没有，你见过吗"有人接 |

---

## 四、发布前自查

**对照计划 §1.4 三条：**

| # | 检查 | 结果 |
|---|---|---|
| 1 | 数字有没有标明窗口和样本量？ | ✅ 每组都带窗口和导出日；开头声明 `One site, so n=1` |
| 2 | 有没有出现品牌名、工具名、链接？ | ✅ 零链接零品牌。站点特征只到"小站、低权重、约 150 个 URL" |
| 3 | 结尾那个问题，我是不是真的还没有答案？ | ✅ **真的不知道**——5/8 的新 URL 无独立数据行，找不出区分依据 |

**这篇特有的：**

| 项 | 处理 |
|---|---|
| 人设是否统一 | ✅ 全文第一人称单数，无 `we`。不提团队、不提同事、不提开发 |
| 会不会读起来像 AI | ✅ 见第二节六处修改 |
| 会不会被当成炫耀"我做对了" | ✅ 反向处理：主动交代 7 个 308→404 是自己的缺陷，并交代"我在报告里先写错了结论" |
| 会不会被一句话反驳 | ✅ 预埋两处：① 滑动窗口不是同一期间 ② GSC 页面级有报告阈值，"无数据行 ≠ 无展示" |
| 308 而非 301 会不会被质疑 | 保留 308。这是框架默认行为，是真实细节；改写成 301 反而是编的 |
| 有没有暗示"我有工具能解决" | ✅ 全文无方案推销。legacy sitemap **故意没写**——8/13 才提交、没有结果，写了就是空口 |

---

## 五、数据出处（可复现）

**全部来自 GSC 效果报告导出的 `网页.csv` / `过滤器.csv` / `图表.csv`。**

```
主数据  ~/Downloads/gengrowth.ai-Performance-on-Search-2026-08-11/
        窗口 过去 3 个月 = 2026-05-10 → 2026-08-09（图表.csv 92 行确认）
        全站 150 个 URL / 9,986 展示 / 39 点击
        /en/  97 个 URL / 8,821 展示（88.3%）/ 25 点击（64.1%）

近期    ~/Downloads/gengrowth.ai-Performance-on-Search-2026-08-13/
        窗口 2026-08-04 → 08-10
        /en/  45 个 URL / 1,326 of 2,183 展示 = 60.7%

对照    2026-08-03 导出（3 个月）94 个 / 7,279 / 94.7%
        2026-08-12 导出（3 个月）97 个 / 9,028 / 86.1%
```

**展示最高的旧 URL（8/11 导出）：**

| 旧 URL | 展示 | 点击 | 排名 | 对应新 URL 有数据行？ |
|---|---:|---:|---:|---|
| `/en/blog/best-cheap-seo-tools` | 1,202 | 2 | 30.28 | **无** |
| `/en/blog/google-july-2026-update` | 908 | **20** | 7.29 | **无** |
| `/en/blog/why-use-a-backlink-monitor-tool` | 832 | 0 | 65.91 | 有 |
| `/en/blog/best-white-label-seo-tool` | 736 | 0 | 73.70 | 有 |
| `/en/blog/free-seo-company` | 568 | 0 | 19.76 | **无** |
| `/en/blog/all-in-one-seo` | 422 | 0 | 63.35 | 有 |
| `/en/blog/free-seo-consultation` | 401 | 0 | 24.31 | **无** |
| `/en/glossary/brand-visibility-score` | 378 | 0 | 58.44 | **无** |

**六项配置核查**：`09-archive/2026-08-交办v1/2026-08-10-url迁移收口-诊断与方案.md` 第一节，2026-08-10 逐项 curl 实测。
**7 个 308→404**：同文档 3.2 节，曝光合计 58。

---

## 六、发布后

| 时间 | 动作 |
|---|---|
| 当天 | 只回技术追问，不引导方向。回复也用第一人称单数 |
| 有人问"那你怎么解决的" | **如实说 legacy sitemap 8/13 才提交、还没有结果**，不要讲成已验证的方案 |
| 有人给出 5/8 的解释 | 记进素材库。这是这篇帖子真正想换的东西 |
| 一周后 | 复盘有没有真讨论。第 2 篇（效果报告 ≠ 抓取统计）按计划下周发 |

**⚠️ 不要做**：不要在评论里补"我有个工具能查这个"。这一系列前数月唯一目标是技术可信度，一次推销就归零。
