---
title: 2026-07-01 公开账号抓取记录
type: crawl-log
project: AstrologyWiki
owner: pengman
updated: 2026-07-05
---

# 2026-07-01 公开账号抓取记录

## 2026-07-05 本次检查

- 检查范围：X、TikTok、Instagram、YouTube 公开账号页/公开视频页。
- 新确认内容：
  - YouTube Shorts：`https://www.youtube.com/shorts/NtnkAVHBrwc`
- 账号级公开变化：
  - X：公开 profile meta 显示 `20 posts / 3 followers / 9 following`；未登录公开时间线仍显示 “@AstrologyWiki hasn’t posted”。
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
| 2026-W27 | YouTube Shorts | https://www.youtube.com/shorts/NtnkAVHBrwc | 2026-07-05 公开页补录新增 |
| 2026-W27 | Instagram | https://www.instagram.com/p/DaSXupwhi57/ | 新增 |
| 2026-W27 | Instagram | https://www.instagram.com/p/DaUwtKjPvB5/ | 新增 |
| 2026-W25 | TikTok | https://www.tiktok.com/@astrologywiki/video/7652268013520948493 | 新增 |
| 2026-W27 / W25 | TikTok / YouTube | 已记录链接 | 刷新公开 views / likes / plays |
| 待补周次 | YouTube Shorts | https://www.youtube.com/shorts/M_qy0N-agFA | 2026-07-05 公开页发现，主题/日期待确认 |
| 待补周次 | YouTube Shorts | https://www.youtube.com/shorts/uHVola7E3-A | 2026-07-05 公开页发现，主题/日期待确认 |
| 待补周次 | YouTube Video | https://www.youtube.com/watch?v=NQvlUn_XpHI | 2026-07-05 公开页发现，主题/日期待确认 |

## 平台覆盖情况

| 平台 | 抓取结果 | 限制 |
|---|---|---|
| TikTok | 2026-07-05 公开 profile meta 可见 `1 follower / 0 following / 19 likes / 9 videos`；本地当前只识别到 5 条公开视频链接 | 公开页 `itemList` 为空，无法稳定枚举全部视频；后台完播率、主页访问、链接点击不可公开读取 |
| YouTube | 2026-07-05 `/shorts` 公开页可见 6 个 Shorts 链接，`/videos` 公开页可见 2 个长视频链接；新增补录 1 条 W27 Shorts | 仍有 2 条旧 Shorts + 1 条长视频未归档；评论数、留存、shown in feed / viewed vs swiped away 需 YouTube Studio |
| X | 2026-07-05 公开 profile meta 可见 `20 posts / 3 followers / 9 following` | 未登录公开时间线仍显示 “@AstrologyWiki hasn’t posted”；后台 impressions、profile visits、link clicks、视频观看时长需 X analytics |
| Instagram | 2026-07-05 公开 profile header 可见 `0 followers / 0 following / 3 posts`；当前稳定抽出 2 条 W27 链接 | 第三条帖文链接本次未稳定抽出；后台 reach、plays、saves、shares、profile visits、link clicks 需 Instagram Insights |

## 结论

- 本地归档仍然不是全量：2026-07-05 的公开账号级检查显示，X、TikTok、Instagram、YouTube 都还有历史或本周链接缺口。
- 本次稳定新增的是 1 条 2026-07-03 YouTube Shorts；其余新发现的公开视频链接暂未确认主题或日期，不直接并入周报明细。
- 如果要补齐剩余缺口，优先顺序应为：Instagram 第三条帖文链接 -> W27 / 更早 YouTube 未归档链接 -> X 剩余帖文 -> TikTok 历史视频全量清单。
