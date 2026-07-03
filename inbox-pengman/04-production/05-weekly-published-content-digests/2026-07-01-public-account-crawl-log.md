---
title: 2026-07-01 公开账号抓取记录
type: crawl-log
project: AstrologyWiki
owner: pengman
updated: 2026-07-03
---

# 2026-07-01 公开账号抓取记录

## 抓取账号

- X: https://x.com/AstrologyWiki
- YouTube: https://www.youtube.com/@AstrologyWiki
- TikTok: https://www.tiktok.com/@astrologywiki
- Instagram: https://www.instagram.com/astrologywiki_/

## 已补录内容

| 周次 | 平台 | 链接 | 动作 |
|---|---|---|---|
| 2026-W27 | TikTok | https://www.tiktok.com/@astrologywiki/photo/7657187949590727950 | 新增 |
| 2026-W27 | X | https://x.com/AstrologyWiki/status/2071956969045279011 | 用户补充链接后新增 |
| 2026-W27 | X | https://x.com/AstrologyWiki/status/2071846176899379587 | 用户补充链接后刷新数据 |
| 2026-W27 | X | https://x.com/AstrologyWiki/status/2072628748848083433 | 登录后新增 |
| 2026-W27 | X | https://x.com/AstrologyWiki/status/2072304463671386523 | 登录后新增 |
| 2026-W27 | X | https://x.com/AstrologyWiki/status/2071846177830555763 | 登录后新增 |
| 2026-W27 | X | https://x.com/AstrologyWiki/status/2071802354911908252 | 登录后新增 |
| 2026-W27 | X | https://x.com/AstrologyWiki/status/2071802356740632704 | 登录后新增 |
| 2026-W27 | X | https://x.com/AstrologyWiki/status/2071536056323731464 | 登录后新增 |
| 2026-W25 | X | https://x.com/AstrologyWiki/status/2067167154529800294 | 登录后新增 |
| 2026-W25 | X | https://x.com/AstrologyWiki/status/2067183937655554078 | 登录后新增 |
| 2026-W27 | YouTube Shorts | https://www.youtube.com/shorts/piNhQ8q2V4w | 新增 |
| 2026-W27 | YouTube Video | https://www.youtube.com/watch?v=NxecDPhWeyA | 新增 |
| 2026-W27 | Instagram | https://www.instagram.com/p/DaSXupwhi57/ | 新增 |
| 2026-W27 | Instagram | https://www.instagram.com/p/DaUwtKjPvB5/ | 新增 |
| 2026-W25 | TikTok | https://www.tiktok.com/@astrologywiki/video/7652268013520948493 | 新增 |
| 2026-W27 / W25 | TikTok / YouTube | 已记录链接 | 刷新公开 views / likes / plays |

## 平台覆盖情况

| 平台 | 抓取结果 | 限制 |
|---|---|---|
| TikTok | 公开接口返回 5 条；已全部归档到 W25 / W27 | 后台完播率、主页访问、链接点击不可公开读取 |
| YouTube | 频道公开页返回 3 条 Shorts + 1 条长视频；已全部归档到 W25 / W27 | 评论数、留存、shown in feed / viewed vs swiped away 需 YouTube Studio |
| X | 登录后账号页显示 16 posts；主时间线滚动抓到 13 条可见 status，已分别归档到 W25 / W27，并刷新公开 views / likes / replies / reposts | 仍有 3 条需继续从 replies / media / analytics 导出核对；后台 impressions、profile visits、link clicks、视频观看时长需 X analytics |
| Instagram | 公开 profile meta 显示 0 followers、0 following、2 posts；web profile 接口返回 2 条 video post，已归档到 W27 | 后台 reach、plays、saves、shares、profile visits、link clicks 需 Instagram Insights；公开接口不稳定，后续需复查 |

## 结论

- TikTok、YouTube 和 Instagram 当前公开可见内容已经补齐。
- X 已通过登录态补录主时间线可见 status：账号页显示 16 posts，当前已归档 13 条。
- 下一步如果要补齐 X 剩余 3 条和后台效果：继续检查 replies / media / analytics，或从 X analytics 导出 impressions、profile visits、link clicks、视频观看时长。
