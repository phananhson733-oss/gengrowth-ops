---
title: 公开账号抓取记录
type: crawl-log
project: AstrologyWiki
owner: pengman
updated: 2026-07-10
---

# 公开账号抓取记录

## 2026-07-10 TikTok 修复重抓

- 检查范围：TikTok 公开 profile、`https://www.tiktok.com/embed/@astrologywiki`、以及单条公开页；并回看现有 W27/W28 周报中的已记录链接。
- 新确认内容：
  - TikTok：`https://www.tiktok.com/@astrologywiki/video/7659399399533055246`
  - TikTok：`https://www.tiktok.com/@astrologywiki/video/7660401338701974798`
  - TikTok：`https://www.tiktok.com/@astrologywiki/video/7660473423038041358`
  - TikTok：`https://www.tiktok.com/@astrologywiki/video/7657544067898772749`
  - TikTok：`https://www.tiktok.com/@astrologywiki/video/7657873666830503182`
  - TikTok：`https://www.tiktok.com/@astrologywiki/video/7658301493862272270`
  - TikTok：`https://www.tiktok.com/@astrologywiki/video/7658533089202670862`
- 内容级公开刷新：
  - TikTok `embed` 页本次稳定暴露最近 `10` 条内容 ID：`7657187949590727950`、`7657544067898772749`、`7657873666830503182`、`7658301493862272270`、`7658533089202670862`、`7659399399533055246`、`7659748708950609165`、`7659773834345647374`、`7660401338701974798`、`7660473423038041358`
  - TikTok：`7659399399533055246` 现可见 `110 plays / 1 like / 0 comments / 0 shares`
  - TikTok：`7659773834345647374` 现可见 `302 plays / 4 likes / 0 comments / 0 shares`
  - TikTok：`7659748708950609165` 现可见 `311 plays / 2 likes / 0 comments / 1 share`
  - TikTok：`7660401338701974798` 现可见 `301 plays / 13 likes / 0 comments / 0 shares / 3 collects`
  - TikTok：`7660473423038041358` 现可见 `280 plays / 3 likes / 1 comment / 0 shares`
  - TikTok：`7657544067898772749` 现可见 `169 plays / 0 likes`
  - TikTok：`7657873666830503182` 现可见 `112 plays / 2 likes / 1 collect`
  - TikTok：`7658301493862272270` 现可见 `107 plays / 0 likes`
  - TikTok：`7658533089202670862` 现可见 `111 plays / 0 likes`
- 账号级公开变化：
  - TikTok：公开 profile 仍可见 `2 followers / 0 following / 46 likes / 12 videos`
- 限制说明：
  - TikTok 公开 profile `itemList` 仍为空，不能再只靠 profile 页归档内容。
  - 本次改用公开 `creator embed` 页补出最近 `10` 条内容，再结合本地旧直链，当前总共已确认 `14` 条历史可达帖文；这些帖文点赞数相加正好等于账号级公开 `46 likes`。
  - 但 TikTok profile 仍只显示 `12 videos`，与当前可直达历史帖文数存在口径冲突；暂不推断删帖或隐藏，统一记 `待确认`，需要 Pengman 提供后台发布列表或截图核对。

## 2026-07-09 本次补抓

- 检查范围：X、TikTok、Instagram、YouTube 公开账号页/公开视频页。
- 新确认内容：
  - YouTube Shorts：`https://www.youtube.com/shorts/ntnz_7FVvck`
- 内容级公开刷新：
  - YouTube Shorts：`https://www.youtube.com/shorts/ntnz_7FVvck` 当前在公开 `shorts` 列表页显示 `Haaland and Isabel's synastry💗 / 18 views`
  - YouTube Shorts：`https://www.youtube.com/shorts/93ONQqwnsn8` 当前在公开 `shorts` 列表页显示 `Rhaenyra’s Fight for Power, Explained by Astrology / 2 views`
  - YouTube Shorts：`https://www.youtube.com/shorts/EFK0KPtyS4M` 当前在公开 `shorts` 列表页显示 `Why Celebrity Birth Charts Get This Wrong So Often / 1 view`
  - TikTok：`https://www.tiktok.com/@astrologywiki/video/7659773834345647374` 现可见 `302 plays / 4 likes / 0 comments / 0 shares`
  - TikTok：`https://www.tiktok.com/@astrologywiki/video/7659748708950609165` 现可见 `311 plays / 2 likes / 0 comments / 1 share`
- 账号级公开变化：
  - TikTok：公开 profile 已可见 `2 followers / 0 following / 46 likes / 12 videos`，较上一轮多 `16 likes + 1 video`；但 `itemList` 仍为空。
  - Instagram：公开 `og:description` 仍可见 `0 Followers, 0 Following, 5 Posts`。
  - YouTube：公开 `@AstrologyWiki/shorts` 列表页本轮可稳定确认当前可见 `9` 条 Shorts：`zOXKoYuHJnE`、`CHSfnHbuYtE`、`piNhQ8q2V4w`、`M_qy0N-agFA`、`NtnkAVHBrwc`、`uHVola7E3-A`、`EFK0KPtyS4M`、`93ONQqwnsn8`、`ntnz_7FVvck`；`/videos` 列表页仍只看到 `2` 条长视频 ID：`NQvlUn_XpHI`、`NxecDPhWeyA`。
  - X：公开 profile 今天仍可访问 title / about，但未再稳定吐出账号级 count；当前沿用最近一次已确认的 `25 posts / 3 followers / 9 following`，记 `待确认`。
- 限制说明：
  - TikTok profile `itemList` 继续为空，因此虽然账号级能确认新增第 `12` 条内容，但自动化仍无法直接补出新增链接。
  - X 公开页今天连账号级 count 都未稳定暴露，更无法可靠补内容级 `status` 链接。
  - Instagram 今天仍只稳定给账号级 meta，不稳定给第 5 帖 shortcode。
  - YouTube Shorts 当前最稳的是 `列表页补链 + views`；likes、comments、retention 仍需 Studio。
  - 这轮重抓已按“最新发布 + 之前仍公开可见的历史内容”重新过一遍 YouTube 当前全量可见列表，因此旧内容的播放数也同步刷新了一次。

## 2026-07-08 本次补抓

- 检查范围：X、TikTok、Instagram、YouTube 公开账号页/公开视频页。
- 新确认内容：
  - 本次未新增可稳定归档的 W28 链接；继续沿用既有 `2 条 YouTube Shorts + 2 条 TikTok 视频`。
- 内容级公开刷新：
  - TikTok：`https://www.tiktok.com/@astrologywiki/video/7659773834345647374` 现可见 `294 plays / 4 likes / 0 comments / 0 shares`
  - TikTok：`https://www.tiktok.com/@astrologywiki/video/7659748708950609165` 现可见 `233 plays / 2 likes / 0 comments / 1 share`
- 账号级公开变化：
  - X：公开 profile 仍可确认 `25 posts / 3 followers / 9 following`；未登录时间线继续显示 `@AstrologyWiki hasn’t posted`。
  - TikTok：公开 profile 已可见 `2 followers / 0 following / 30 likes / 11 videos`，较上一轮再多 `1 like`。
  - Instagram：公开 profile meta 仍可见 `0 followers / 0 following / 5 posts`。
  - YouTube：公开 `@AstrologyWiki/shorts` / `videos` 列表页未补到新的稳定 W28 链接；单条页仍可访问，但当前自动化未能稳定抽出准确内容级公开计数。
- 限制说明：
  - TikTok profile `itemList` 仍为空，仍需依赖单条直链刷新内容数据。
  - X 公开 profile 可给账号级数字，但 timeline 仍空。
  - Instagram 仍只稳定给账号级 meta，不稳定给第 5 帖 shortcode。
  - YouTube Shorts 单条页当前更适合做链接确认，不适合在自动化里稳定抓公开播放/点赞。

## 2026-07-07 本次补抓

- 检查范围：X、TikTok、Instagram、YouTube 公开账号页/公开视频页。
- 本次确认：
  - W28 仍只有 2 条可稳定归档的 YouTube Shorts：`EFK0KPtyS4M`、`93ONQqwnsn8`
  - X 公开 profile meta 已升到 `25 posts / 3 followers / 9 following`
  - TikTok 公开 profile 已升到 `2 followers / 0 following / 29 likes / 11 videos`
  - Instagram 公开 profile meta 仍为 `0 followers / 0 following / 5 posts`
- 用户补充直链后新增：
  - TikTok：`https://www.tiktok.com/@astrologywiki/video/7659773834345647374`
  - TikTok：`https://www.tiktok.com/@astrologywiki/video/7659748708950609165`
- 仍未补到的内容级链接：
  - Instagram 第 5 帖 permalink
  - X 第 25 帖 status 链接
  - TikTok 其余尚未显式补发的 W28 内容链接
- 限制说明：
  - X 未登录 timeline 仍返回 `@AstrologyWiki hasn’t posted`
  - TikTok `itemList` 仍为空
  - Instagram 页面仍只稳定给账号级 meta，不稳定给 post shortcode

## 2026-07-08 本次检查

- 检查范围：X、TikTok、Instagram、YouTube 公开账号页/公开视频页。
- 新确认内容：
  - YouTube Shorts：`https://www.youtube.com/shorts/93ONQqwnsn8`
- 新浮出但暂不按今日新增计入：
  - YouTube Shorts：`https://www.youtube.com/shorts/CHSfnHbuYtE`
  - 说明：单条公开页显示约 `7 days ago`，更像此前未归档的历史内容，而不是 2026-07-08 新增。
- 账号级公开变化：
  - X：本次能访问公开 profile 页面，但未稳定抽出结构化账号数字或新的 `status` 链接；当时沿用最近一次可确认值 `24 posts / 3 followers / 9 following`，并记 `待确认`。
  - TikTok：公开 profile 已可见 `2 followers / 0 following / 28 likes / 11 videos`，但内容级列表仍未稳定暴露。
  - Instagram：公开 profile meta 已可见 `0 followers / 0 following / 5 posts`，较 2026-07-07 多 `1 post`，但新增帖文 shortcode 本次仍未稳定提取。
  - YouTube：公开 `@AstrologyWiki/shorts` 列表页本次已看到至少 `9` 个 Shorts ID；`/videos` 列表页仍只看到已归档的 `2` 条长视频 ID。
- 处理原则：本地记录优先；公开来源只用于补链、补公开计数和发现缺口，无法确认的内容继续标为 `待补数据/待确认`。

## 2026-07-07 本次检查

- 检查范围：X、TikTok、Instagram、YouTube 公开账号页/公开视频页。
- 新确认内容：
  - 本次未发现新的可稳定归档链接；W28 仍只有既有 YouTube Shorts：`https://www.youtube.com/shorts/EFK0KPtyS4M`
- 账号级公开变化：
  - X：公开 profile 仍可见 `24 posts / 3 followers / 9 following`；未登录时间线仍显示 `@AstrologyWiki hasn’t posted`。
  - TikTok：公开 profile JSON 仍可见 `2 followers / 0 following / 20 likes / 10 videos`，但 `itemList` 继续为空。
  - Instagram：公开 profile meta 仍可见 `0 followers / 0 following / 4 posts`。
  - YouTube：公开 `@AstrologyWiki/shorts` 列表当前仍只看到已归档的 7 个 Shorts ID；`/videos` 列表仍只看到已归档的 2 个长视频 ID；feed URL 当前返回 404。
- 处理原则：本地记录优先；公开来源只用于补链、补公开计数和发现缺口，无法确认的内容继续标为 `待补数据/待确认`。

## 2026-07-06 本次检查

- 检查范围：X、TikTok、Instagram、YouTube 公开账号页/公开视频页。
- 新确认内容：
  - YouTube Shorts：`https://www.youtube.com/shorts/EFK0KPtyS4M`
  - YouTube Shorts：`https://www.youtube.com/shorts/uHVola7E3-A`
  - YouTube Shorts：`https://www.youtube.com/shorts/M_qy0N-agFA`
  - YouTube Video：`https://www.youtube.com/watch?v=NQvlUn_XpHI`
  - Instagram：`https://www.instagram.com/p/DaU8gleFI-2/`
  - Instagram：`https://www.instagram.com/p/DacR6dKPD2Z/`
- 账号级公开变化：
  - X：公开 profile 可见 `24 posts / 3 followers / 9 following`；未登录时间线仍显示 `@AstrologyWiki hasn’t posted`。
  - TikTok：公开 profile meta 可见 `2 followers / 0 following / 20 likes / 10 videos`。
  - Instagram：公开 web profile 可见 `0 followers / 0 following / 4 posts`，并能稳定列出 4 条内容 shortcodes。
  - YouTube：公开 RSS 可稳定列出 9 条最近上传（含 7 Shorts + 2 长视频），其中 1 条属于 W28、1 条属于 W25、其余可落到 W27。
- 处理原则：本地记录优先；公开来源只用于补链、补公开计数和发现缺口，无法确认的内容继续标为 `待补数据/待确认`。

## 2026-07-05 本次检查

- 检查范围：X、TikTok、Instagram、YouTube 公开账号页/公开视频页。
- 新确认内容：
  - YouTube Shorts：`https://www.youtube.com/shorts/NtnkAVHBrwc`
- 账号级公开变化：
  - X：公开 profile meta 显示 `20 posts / 3 followers / 9 following`；未登录公开时间线仍显示 `@AstrologyWiki hasn’t posted`。
  - TikTok：公开 profile meta 显示 `1 follower / 0 following / 19 likes / 9 videos`，但 `itemList` 为空。
  - Instagram：公开 profile header 显示 `0 followers / 0 following / 3 posts`，较 2026-07-03 多 1 帖。
  - YouTube：`/shorts` 公开页可见 6 个 Shorts ID，`/videos` 公开页可见 2 个长视频链接；当前工作区只归档了一部分。
- 处理原则：本地记录优先；公开来源只用于补链、补公开计数和发现缺口，无法确认的内容继续标为 `待补数据/待确认`。

## 抓取账号

- X: https://x.com/AstrologyWiki
- YouTube: https://www.youtube.com/@AstrologyWiki
- TikTok: https://www.tiktok.com/@astrologywiki
- Instagram: https://www.instagram.com/astrologywiki_/

## 已补录内容

| 周次 | 平台 | 链接 | 动作 |
|---|---|---|---|
| 2026-W28 | YouTube Shorts | https://www.youtube.com/shorts/ntnz_7FVvck | 2026-07-09 公开列表页新增 |
| 2026-W28 | YouTube Shorts | https://www.youtube.com/shorts/EFK0KPtyS4M | 2026-07-06 RSS 新增 |
| 2026-W28 | YouTube Shorts | https://www.youtube.com/shorts/93ONQqwnsn8 | 2026-07-08 公开列表页 + 单条页新增 |
| 2026-W28 | TikTok | https://www.tiktok.com/@astrologywiki/video/7659399399533055246 | 2026-07-10 embed + 单条页补录新增 |
| 2026-W28 | TikTok | https://www.tiktok.com/@astrologywiki/video/7659773834345647374 | 用户补充链接后新增 |
| 2026-W28 | TikTok | https://www.tiktok.com/@astrologywiki/video/7659748708950609165 | 用户补充链接后新增 |
| 2026-W28 | TikTok | https://www.tiktok.com/@astrologywiki/video/7660401338701974798 | 2026-07-10 embed + 单条页补录新增 |
| 2026-W28 | TikTok | https://www.tiktok.com/@astrologywiki/video/7660473423038041358 | 2026-07-10 embed + 单条页补录新增 |
| 2026-W27 | Instagram | https://www.instagram.com/p/DacR6dKPD2Z/ | 2026-07-06 API 补录新增 |
| 2026-W27 | Instagram | https://www.instagram.com/p/DaU8gleFI-2/ | 2026-07-06 API 补录新增 |
| 2026-W27 | YouTube Shorts | https://www.youtube.com/shorts/uHVola7E3-A | 2026-07-06 RSS 补录新增 |
| 2026-W27 | YouTube Shorts | https://www.youtube.com/shorts/M_qy0N-agFA | 2026-07-06 RSS 补录新增 |
| 2026-W27 | YouTube Video | https://www.youtube.com/watch?v=NQvlUn_XpHI | 2026-07-06 RSS 补录新增 |
| 2026-W27 | TikTok | https://www.tiktok.com/@astrologywiki/photo/7657187949590727950 | 新增 |
| 2026-W27 | TikTok | https://www.tiktok.com/@astrologywiki/video/7657544067898772749 | 2026-07-10 embed + 单条页补录新增 |
| 2026-W27 | TikTok | https://www.tiktok.com/@astrologywiki/video/7657873666830503182 | 2026-07-10 embed + 单条页补录新增 |
| 2026-W27 | TikTok | https://www.tiktok.com/@astrologywiki/video/7658301493862272270 | 2026-07-10 embed + 单条页补录新增 |
| 2026-W27 | TikTok | https://www.tiktok.com/@astrologywiki/video/7658533089202670862 | 2026-07-10 embed + 单条页补录新增 |
| 2026-W27 | X | https://x.com/AstrologyWiki/status/2071956969045279011 | 用户补充链接后新增 |
| 2026-W27 | X | https://x.com/AstrologyWiki/status/2071846176899379587 | 用户补充链接后刷新数据 |
| 2026-W27 | X | https://x.com/AstrologyWiki/status/2072628748848083433 | 登录后新增 |
| 2026-W27 | X | https://x.com/AstrologyWiki/status/2072304463671386523 | 登录后新增 |
| 2026-W27 | X | https://x.com/AstrologyWiki/status/2071846177830555763 | 登录后新增 |
| 2026-W27 | X | https://x.com/AstrologyWiki/status/2071802354911908252 | 登录后新增 |
| 2026-W27 | X | https://x.com/AstrologyWiki/status/2071802356740632704 | 登录后新增 |
| 2026-W27 | X | https://x.com/AstrologyWiki/status/2071536056323731464 | 登录后新增 |
| 2026-W27 | YouTube Shorts | https://www.youtube.com/shorts/piNhQ8q2V4w | 新增 |
| 2026-W27 | YouTube Video | https://www.youtube.com/watch?v=NxecDPhWeyA | 新增 |
| 2026-W27 | YouTube Shorts | https://www.youtube.com/shorts/NtnkAVHBrwc | 2026-07-05 公开页补录新增 |
| 2026-W27 | Instagram | https://www.instagram.com/p/DaSXupwhi57/ | 新增 |
| 2026-W27 | Instagram | https://www.instagram.com/p/DaUwtKjPvB5/ | 新增 |
| 2026-W25 | X | https://x.com/AstrologyWiki/status/2067167154529800294 | 登录后新增 |
| 2026-W25 | X | https://x.com/AstrologyWiki/status/2067183937655554078 | 登录后新增 |
| 2026-W25 | TikTok | https://www.tiktok.com/@astrologywiki/video/7652268013520948493 | 新增 |
| 2026-W25 | YouTube Shorts | https://www.youtube.com/shorts/zOXKoYuHJnE | 2026-07-06 RSS 归位到 W25 |
| 2026-W27 / W25 | TikTok / YouTube | 已记录链接 | 刷新公开 views / likes / plays |

## 平台覆盖情况

| 平台 | 抓取结果 | 限制 |
|---|---|---|
| TikTok | 2026-07-10 已用公开 `embed + 单条页` 修复重抓，当前可确认最近 `10` 条 embed 帖文和总计 `14` 条历史可达帖文；W28 现能补到 `5` 条、W27 现能补到 `8` 条 | profile `itemList` 仍为空；profile `12 videos` 与当前可直达帖文数存在口径冲突；后台完播率、主页访问、链接点击不可公开读取 |
| YouTube | 2026-07-09/10 公开 `shorts` 列表页已重抓当前全部可见历史 Shorts，共确认 `9 Shorts + 2 长视频`；其中最新可见 W28 Shorts 为 `ntnz_7FVvck` | likes、comments、留存、shown in feed / viewed vs swiped away 仍需 YouTube Studio |
| X | 2026-07-09 公开 profile title / about 可访问，但 count 未稳定暴露；沿用最近一次已确认 `25 posts / 3 followers / 9 following` | 内容级链接仍不稳定；后台 impressions、profile visits、link clicks、视频观看时长需 X analytics |
| Instagram | 2026-07-09 `og:description` 仍可见 `0 Followers / 0 Following / 5 Posts` | 第 5 帖 shortcode 仍未稳定提取；reach、plays、saves、shares、profile visits、link clicks 需 Instagram Insights |

## 结论

- 2026-07-10 的最重要修复是：TikTok 不再只剩“2 条已知直链”，而是已经通过公开 `embed + 单条页` 补到 `14` 条历史可达帖文，其中 W27 新增补录 `4` 条、W28 新增补录 `3` 条。
- 当前 W28 已确认内容更新为 `3 条 YouTube Shorts + 5 条 TikTok 内容`；其中 `Haaland and Isabel's synastry`、`Rhaenyra`、`Venus in Virgo is receipt season` 都进入本周公开播放/互动第一梯队。
- TikTok 账号级 `46 likes` 目前已经能被这些历史可达帖文的内容级点赞数相互印证，但 profile `12 videos` 与直达帖文数仍冲突，不能直接当作完整发布总表。
- 这轮 YouTube 已按当前公开可见顺序把“最新 + 之前内容”重新核过一遍，旧条目里可确认上升的包括：`zOXKoYuHJnE` 到 `777 views`、`CHSfnHbuYtE` 到 `42 views`、`piNhQ8q2V4w` 到 `222 views`、`uHVola7E3-A` 到 `11 views`、`NtnkAVHBrwc` 到 `5 views`、`M_qy0N-agFA` 到 `4 views`。
- 如果要继续补缺口，优先顺序仍应是：TikTok profile `12 videos` 口径核对 -> Instagram 第 5 帖 permalink -> X 第 25 帖 status 链接 -> YouTube Studio / 后台点击与引流数据补证。
