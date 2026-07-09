---
title: 2026-07-01 公开账号抓取记录
type: crawl-log
project: AstrologyWiki
owner: pengman
updated: 2026-07-08
---

# 2026-07-01 公开账号抓取记录

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
| 2026-W28 | YouTube Shorts | https://www.youtube.com/shorts/EFK0KPtyS4M | 2026-07-06 RSS 新增 |
| 2026-W28 | YouTube Shorts | https://www.youtube.com/shorts/93ONQqwnsn8 | 2026-07-08 公开列表页 + 单条页新增 |
| 2026-W28 | TikTok | https://www.tiktok.com/@astrologywiki/video/7659773834345647374 | 用户补充链接后新增 |
| 2026-W28 | TikTok | https://www.tiktok.com/@astrologywiki/video/7659748708950609165 | 用户补充链接后新增 |
| 2026-W27 | Instagram | https://www.instagram.com/p/DacR6dKPD2Z/ | 2026-07-06 API 补录新增 |
| 2026-W27 | Instagram | https://www.instagram.com/p/DaU8gleFI-2/ | 2026-07-06 API 补录新增 |
| 2026-W27 | YouTube Shorts | https://www.youtube.com/shorts/uHVola7E3-A | 2026-07-06 RSS 补录新增 |
| 2026-W27 | YouTube Shorts | https://www.youtube.com/shorts/M_qy0N-agFA | 2026-07-06 RSS 补录新增 |
| 2026-W27 | YouTube Video | https://www.youtube.com/watch?v=NQvlUn_XpHI | 2026-07-06 RSS 补录新增 |
| 2026-W27 | TikTok | https://www.tiktok.com/@astrologywiki/photo/7657187949590727950 | 新增 |
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
| TikTok | 2026-07-08/09 公开 profile 已可见 `2 followers / 0 following / 30 likes / 11 videos`；2 条 W28 直链可刷新到 `294 plays / 4 likes` 与 `233 plays / 2 likes / 1 share` | 公开页内容级列表仍未稳定暴露；后台完播率、主页访问、链接点击不可公开读取 |
| YouTube | 2026-07-08/09 公开 `shorts/videos` 列表仍可确认至少 `9 Shorts + 2 长视频`；未再补到新的稳定 W28 链接 | comments、留存、shown in feed / viewed vs swiped away 需 YouTube Studio；当前 Shorts 单条页不适合稳定抓公开播放/点赞 |
| X | 2026-07-08/09 公开 profile meta 仍可确认 `25 posts / 3 followers / 9 following`，但未登录 timeline 仍为空 | 内容级链接仍不稳定；后台 impressions、profile visits、link clicks、视频观看时长需 X analytics |
| Instagram | 2026-07-08/09 公开 profile meta 仍可见 `0 followers / 0 following / 5 posts` | 第 5 帖 shortcode 仍未稳定提取；reach、plays、saves、shares、profile visits、link clicks 需 Instagram Insights |

## 结论

- 本地归档在 YouTube / Instagram 上已明显补齐，但 X / TikTok 仍不是全量。
- 2026-07-08/09 的新增信息主要是：TikTok 账号级总赞继续上涨到 `30`，并且两条 W28 直链都已能刷新到新的公开播放数；其余平台仍以账号级增量为主。
- YouTube 依然是当前最稳的公开补链来源，而且已验证 `列表页 + 单条页` 可以覆盖 feed 失效的情况。
- 如果要继续补缺口，优先顺序应为：Instagram 第 5 帖 shortcode -> TikTok 剩余新视频链接 -> X 剩余帖文 -> YouTube Studio / 后台点击与引流数据补证。
