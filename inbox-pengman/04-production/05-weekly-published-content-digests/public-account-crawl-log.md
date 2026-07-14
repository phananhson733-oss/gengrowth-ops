---
title: 公开账号抓取记录
type: crawl-log
project: AstrologyWiki
owner: pengman
updated: 2026-08-16
---

# 公开账号抓取记录

## 2026-08-16 本次检查

- 检查范围：YouTube 公开 `@AstrologyWiki/shorts` / `/videos` 列表、TikTok 公开 profile `yt-dlp --flat-playlist` / `https://www.tiktok.com/embed/@astrologywiki`、Instagram 公开 profile meta、X 公开 profile meta。
- 新确认内容：
  - 本次未新增 W33 内容级链接；当前最近一次新确认内容仍是 W29 TikTok `https://www.tiktok.com/@astrologywiki/video/7661912847693188365`
- 内容级公开刷新：
  - TikTok profile `yt-dlp` 本次稳定暴露 `9` 条内容，最新序列为 `7661912847693188365`、`7660826807507094798`、`7660473423038041358`、`7660401338701974798`、`7659748708950609165`、`7659773834345647374`、`7657074482648993037`、`7657029619991825678`、`7656756635062390029`
  - TikTok：最新条 `7661912847693188365` 当前仍为 `486 plays / 12 likes / 0 comments / 0 reposts / 0 saves`，时间戳折算为北京时间 `2026-07-13 23:30`
  - TikTok：`7660401338701974798` 当前 `347 plays / 19 likes / 1 comment / 0 reposts / 4 saves`
  - TikTok：`7659773834345647374` 当前 `355 plays / 14 likes / 0 comments / 0 reposts`
  - TikTok：`7659748708950609165` 当前 `398 plays / 3 likes / 0 comments / 1 repost`
  - YouTube Shorts：公开列表仍为已知 `9` 条；最新 3 条当前为 `ntnz_7FVvck = 30 views`、`93ONQqwnsn8 = 2 views`、`EFK0KPtyS4M = 1 view`
  - YouTube Video：公开列表仍只有 `NQvlUn_XpHI = 1 view`、`NxecDPhWeyA = 25 views`
- 账号级公开变化：
  - Instagram：公开 profile meta 仍可见 `0 Followers / 0 Following / 5 Posts`
  - X：公开 profile 页仍可访问 bio，但本次未稳定抽出 `posts / followers / following`
- 限制说明：
  - 本次最关键的公开结果是：截至 `2026-08-16`，未从公开来源补到 W30-W33 新链接；这不能替代后台发布记录。
  - TikTok 当前公开 profile 列表只稳定给出 `9` 条内容，且最新时间戳仍在 7 月中旬；若后台确有后续发布，需要 Pengman 提供发布列表或直链。
  - Instagram 仍未稳定暴露第 5 帖 shortcode。
  - X 仍无法稳定补内容级 `status` 链接与账号级 counts。
  - YouTube 当前仍适合做“有无新 ID + 基础 views”检查，不适合在自动化里稳定抓 likes、comments、retention。

## 2026-07-16 本次检查

- 检查范围：YouTube 公开 `@AstrologyWiki/shorts` / `/videos` 列表、TikTok 公开 profile / `https://www.tiktok.com/embed/@astrologywiki` / 单条公开页、Instagram 公开 profile meta、X 公开 profile 页可达性检查。
- 新确认内容：
  - TikTok W29：`https://www.tiktok.com/@astrologywiki/video/7661912847693188365`
- 内容级公开刷新：
  - TikTok `embed` 页本次稳定暴露 `9` 条内容 ID：`7661912847693188365`、`7660826807507094798`、`7660473423038041358`、`7660401338701974798`、`7659748708950609165`、`7659773834345647374`、`7657074482648993037`、`7657029619991825678`、`7656756635062390029`
  - TikTok：`7661912847693188365` 现可见 `486 plays / 12 likes / 0 comments / 0 shares`，`yt-dlp` 抽到上传日期 `2026-07-13`
  - TikTok：`7660826807507094798` 现可见 `153 plays / 8 likes / 0 comments / 0 shares / 1 save`
  - TikTok：`7660473423038041358` 现可见 `298 plays / 5 likes / 1 comment / 0 shares`
  - TikTok：`7659773834345647374` 现可见 `355 plays / 14 likes / 0 comments / 0 shares`
  - YouTube Shorts：公开列表仍为已知 `9` 条；前 5 条当前为 `ntnz_7FVvck = 30 views`、`93ONQqwnsn8 = 2 views`、`EFK0KPtyS4M = 1 view`、`uHVola7E3-A = 13 views`、`NtnkAVHBrwc = 5 views`
  - YouTube Video：公开列表仍只有 `NQvlUn_XpHI`、`NxecDPhWeyA`
- 账号级公开变化：
  - TikTok：公开 profile HTML 本次抽到 `2 followers / 0 following / 86 likes / 5 videos`
  - Instagram：公开 profile meta 仍可见 `0 Followers / 0 Following / 5 Posts`
  - X：公开 profile 页本次仍可访问；页面初始化数据与 meta 仍可确认最近一次账号级口径为 `25 posts / 3 followers / 9 following`
- 限制说明：
  - TikTok 本轮公开 profile 的 `5 videos` 与同轮 `embed` 可见 `9` 条内容、以及 2026-07-13 记录的 `12 videos` 明显冲突；不能把任一单一来源当成完整发布总表。
  - `7660826807507094798` 的 `yt-dlp` upload_date 继续是 `2026-07-10`，因此现在改记为 W28/W29 边界冲突，不再直接算作 W29 新发布。
  - TikTok 新条 `7661912847693188365` 的标题正文里含 `July 14, 2026 · Cancer New Moon`，但 `yt-dlp` upload_date 为 `2026-07-13`；如需精确落北京时间，仍需后台发布时间或人工核对。
  - Instagram 仍未稳定暴露第 5 帖 shortcode。
  - X 公开 profile 可达，但内容级 `status` 仍无法公开补齐。
  - YouTube 当前仍适合做“有无新 ID + 基础 views”检查，不适合在自动化里稳定抓 likes、comments、retention。

## 2026-07-13 周一收口与 W29 新开

- 检查范围：YouTube 公开 `@AstrologyWiki/shorts` / `/videos` 列表、TikTok 公开 profile / `https://www.tiktok.com/embed/@astrologywiki` / 新单条页、Instagram 公开 profile meta、X 公开 profile meta。
- 新确认内容：
  - TikTok W29：`https://www.tiktok.com/@astrologywiki/video/7660826807507094798`
- 内容级公开刷新：
  - TikTok `embed` 页本次稳定暴露最近 `10` 条内容 ID：`7660826807507094798`、`7660473423038041358`、`7660401338701974798`、`7659748708950609165`、`7659773834345647374`、`7659399399533055246`、`7658533089202670862`、`7658301493862272270`、`7657873666830503182`、`7657544067898772749`
  - TikTok：`7660826807507094798` 现可见 `153 plays / 8 likes / 0 comments / 0 shares`，`yt-dlp` 抽到上传日期 `2026-07-10`
  - TikTok：`7660473423038041358` 现可见 `294 plays`
  - TikTok：`7660401338701974798` 现可见 `310 plays`
  - TikTok：`7659748708950609165` 现可见 `373 plays`
  - TikTok：`7659773834345647374` 现可见 `320 plays`
  - TikTok：`7659399399533055246` 现可见 `113 plays`
  - YouTube Shorts：公开列表仍为已知 9 条；W28 相关 `ntnz_7FVvck` 现为 `29 views`、`93ONQqwnsn8` 仍为 `2 views`、`EFK0KPtyS4M` 仍为 `1 view`
  - YouTube Video：公开列表仍只有 `NQvlUn_XpHI`、`NxecDPhWeyA`；`NxecDPhWeyA` 现为 `20 views`，`NQvlUn_XpHI` 仍为 `1 view`
- 账号级公开变化：
  - TikTok：公开 profile 当前可见 `1 follower / 0 following / 64 likes / 12 videos`
  - Instagram：公开 profile meta 仍可见 `0 Followers / 0 Following / 5 Posts`
  - X：公开 profile meta 可见 `25 posts / 3 followers / 9 following`
- 限制说明：
  - TikTok profile `12 videos` 与公开 `embed` 可见的内容序列仍有口径冲突；followers 从 2 到 1 也可能是公开页口径波动或真实变化，需后台核对。
  - TikTok 新条目 `7660826807507094798` 的公开上传日期为 `2026-07-10`，但本次作为 W29 新发现内容先归入 W29；需要后台或人工发布时间确认最终周归属。
  - Instagram 仍未稳定暴露第 5 帖 shortcode。
  - X 未登录 timeline 仍不吐内容级 status。
  - YouTube 频道 RSS 的旧 channel_id 返回 404；本次改用公开频道页 + `yt-dlp --flat-playlist` 抽取列表。

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
| 2026-W29 | TikTok | https://www.tiktok.com/@astrologywiki/video/7661912847693188365 | 2026-07-15 公开 embed + 单条页新增 |
| 2026-W29 | TikTok | https://www.tiktok.com/@astrologywiki/video/7660826807507094798 | 2026-07-13 公开 embed + 单条页新增 |
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
| TikTok | 2026-08-16 公开 profile `yt-dlp` 仍只稳定给出 `9` 条内容，最新确认内容仍停在 W29 `7661912847693188365` | 当前无法从公开源确认 W30-W33 新内容；后台完播率、主页访问、链接点击不可公开读取 |
| YouTube | 2026-08-16 公开频道页仍确认 `9 Shorts + 2 长视频`；未发现 W30-W33 新视频 | likes、comments、留存、shown in feed / viewed vs swiped away 仍需 YouTube Studio |
| X | 2026-08-16 公开 profile 页可达，但账号级数字与内容级链接都未稳定抽出 | 内容级链接仍不稳定；后台 impressions、profile visits、link clicks、视频观看时长需 X analytics |
| Instagram | 2026-08-16 `og:description` 仍可见 `0 Followers / 0 Following / 5 Posts` | 第 5 帖 shortcode 仍未稳定提取；reach、plays、saves、shares、profile visits、link clicks 需 Instagram Insights |

## 结论

- 截至 2026-08-16，公开来源没有补出 W30-W33 的新链接；当前最近一次稳定确认的新内容仍停在 W29 的 TikTok `Cancer New Moon`。
- 当前公开层面最有价值的平台仍是 TikTok，因为它还能给内容级播放和互动；但如果后台在 7 月中旬后仍有发布，现有公开链路已经不足以覆盖完整发布总表。
- YouTube 仍停在 `9 Shorts + 2 长视频` 的旧列表，说明公开视频层面没有新的可归档增量。
- Instagram 和 X 这轮继续只能做账号级或可达性检查，不能可靠补内容级链接。
- 如果要继续补缺口，优先顺序应改为：后台发布列表或手动链接 -> Instagram 第 5 帖 permalink -> X 内容级 status 链接 -> YouTube Studio / TikTok 后台点击与引流数据补证。
