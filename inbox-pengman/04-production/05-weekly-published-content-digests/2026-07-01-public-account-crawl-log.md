---
title: 2026-07-01 公开账号抓取记录
type: crawl-log
project: AstrologyWiki
owner: pengman
updated: 2026-07-01
---

# 2026-07-01 公开账号抓取记录

## 抓取账号

- X: https://x.com/AstrologyWiki
- YouTube: https://www.youtube.com/@AstrologyWiki
- TikTok: https://www.tiktok.com/@astrologywiki

## 已补录内容

| 周次 | 平台 | 链接 | 动作 |
|---|---|---|---|
| 2026-W27 | TikTok | https://www.tiktok.com/@astrologywiki/photo/7657187949590727950 | 新增 |
| 2026-W27 | X | https://x.com/AstrologyWiki/status/2071956969045279011 | 用户补充链接后新增 |
| 2026-W27 | X | https://x.com/AstrologyWiki/status/2071846176899379587 | 用户补充链接后刷新数据 |
| 2026-W27 | YouTube Shorts | https://www.youtube.com/shorts/piNhQ8q2V4w | 新增 |
| 2026-W27 | YouTube Video | https://www.youtube.com/watch?v=NxecDPhWeyA | 新增 |
| 2026-W25 | TikTok | https://www.tiktok.com/@astrologywiki/video/7652268013520948493 | 新增 |
| 2026-W27 / W25 | TikTok / YouTube | 已记录链接 | 刷新公开 views / likes / plays |

## 平台覆盖情况

| 平台 | 抓取结果 | 限制 |
|---|---|---|
| TikTok | 公开接口返回 5 条；已全部归档到 W25 / W27 | 后台完播率、主页访问、链接点击不可公开读取 |
| YouTube | 频道公开页返回 3 条 Shorts + 1 条长视频；已全部归档到 W25 / W27 | 评论数、留存、shown in feed / viewed vs swiped away 需 YouTube Studio |
| X | 主页公开结构显示账号有 13 tweets；未登录 timeline 请求返回空，仅能刷新已知单帖 | 如需全量 X，需登录态、X analytics 导出或手动提供剩余 tweet 链接 |

## 结论

- TikTok 和 YouTube 当前公开可见内容已经补齐。
- X 还有潜在遗漏：公开主页能看到 tweet count，但未登录无法稳定列出所有 tweet id。
- 下一步如果要补齐 X：请提供登录态可访问方式，或直接从 X 主页/analytics 导出剩余链接。
