---
title: 2026-07-01 公开账号抓取记录
type: crawl-log
project: AstrologyWiki
owner: pengman
updated: 2026-07-07
---

# 2026-07-01 公开账号抓取记录

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
| TikTok | 2026-07-06 公开 profile meta 可见 `2 followers / 0 following / 20 likes / 10 videos`；本地当前只识别到少量公开视频链接 | 公开页内容级列表仍未稳定暴露；后台完播率、主页访问、链接点击不可公开读取 |
| YouTube | 2026-07-07 公开 `shorts/videos` 列表可继续确认 `7 Shorts + 2 长视频`；feed URL 当前返回 404 | comments、留存、shown in feed / viewed vs swiped away 需 YouTube Studio；自动化需接受 feed 失效时回退到列表页 |
| X | 2026-07-06 公开 profile 可见 `24 posts / 3 followers / 9 following` | 未登录公开时间线仍显示 `@AstrologyWiki hasn’t posted`；后台 impressions、profile visits、link clicks、视频观看时长需 X analytics |
| Instagram | 2026-07-06 公开 web profile API 可见 `0 followers / 0 following / 4 posts`，并可返回 4 条 post/reel metadata | reach、plays、saves、shares、profile visits、link clicks 需 Instagram Insights |

## 结论

- 本地归档在 YouTube / Instagram 上已明显补齐，但 X / TikTok 仍不是全量。
- 2026-07-07 的新增信息主要是：账号级公开数字未继续变化，说明今日未见新的稳定公开内容链接。
- YouTube 依然是当前最稳的公开补链来源，但要把 `feed 失效 -> 回退到 /shorts 与 /videos 列表页` 视为默认兜底路径。
- 如果要继续补缺口，优先顺序应为：X 剩余帖文 -> TikTok 历史视频全量清单 -> 后台点击/引流数据补证。
