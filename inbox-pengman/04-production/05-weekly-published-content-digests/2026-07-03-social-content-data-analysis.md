---
title: 2026-07-03 社媒内容数据阶段分析
type: social-content-data-analysis
project: AstrologyWiki
owner: pengman
updated: 2026-07-08
data_scope: archived public metrics from 2026-W25, 2026-W27, and early 2026-W28, including additional public account checks on 2026-07-05, 2026-07-06, 2026-07-07, and 2026-07-08 for X, TikTok, Instagram, and YouTube
status: draft
---

# 2026-07-03 社媒内容数据阶段分析

> 口径：基于 `2026-W25 已发布内容合集`、`2026-W27 本周已发布内容合集`、`2026-W28 本周已发布内容合集` 和 `公开账号抓取记录` 中已经归档的公开可见数据，并补入 2026-07-05、2026-07-06、2026-07-07、2026-07-08 的公开账号级检查。Instagram 数据含 2026-07-08 公开 web profile meta；X 数据以 2026-07-08 公开 page 可达性检查为最新；TikTok 数据含 2026-07-08 公开 profile JSON；YouTube 数据含 2026-07-08 公开 `shorts/videos` 列表页与新增 Shorts 单条公开页。  
> 当前不包含后台 analytics：X impressions / link clicks、TikTok 完播率 / 主页访问 / 链接点击、YouTube Studio 留存 / shown in feed / 点击数据、站内 referral / PV 变化。  
> 目标：判断哪些站外内容更可能支持 AstrologyWiki 的 SEO / PV / 站内主题页，而不是单纯比较粉丝增长。

相关文档：

- [[inbox-pengman/04-production/05-weekly-published-content-digests/2026-W25 已发布内容合集.md]]
- [[inbox-pengman/04-production/05-weekly-published-content-digests/2026-W27 本周已发布内容合集.md]]
- [[inbox-pengman/04-production/05-weekly-published-content-digests/2026-W28 本周已发布内容合集.md]]
- [[inbox-pengman/04-production/05-weekly-published-content-digests/public-account-crawl-log.md]]
- [[inbox-pengman/04-production/01-strategy-and-platform-research/content-direction-and-tools-research.md]]

## 0. 2026-07-06 增量更新

- YouTube：公开 RSS 现在是当前最稳定的公开补链来源。它一次性补齐了 W27 的 `Why You Don't Fully Feel Like Your Zodiac Sign` 长短视频、`Sports astrology without winner predictions.` Shorts，并确认 W28 新增 `Why Celebrity Birth Charts Get This Wrong So Often`。
- Instagram：公开 web profile API 已从 `3 posts` 变成 `4 posts`，并能稳定拿到 4 条内容 metadata。W27 新补录的 `DacR6dKPD2Z` 说明 Instagram 已不只是简单复用 birth chart CTA，也开始测试 celebrity chart 方法论内容。
- TikTok：账号级公开数从 `1 follower / 19 likes / 9 videos` 升到 `2 followers / 20 likes / 10 videos`，但内容级列表仍不稳定，说明 TikTok 适合看作“有发布但公开归档困难”的平台。
- X：账号级公开数从 `20 posts` 升到 `24 posts`，但未登录时间线仍空白，当前归档缺口依然主要在 X。
- 平台判断调整：
  - `YouTube Shorts` 继续保持 P0，因为公开数据链路最稳，而且 sports astrology / celebrity chart / birth chart tools 三类都能在这里被持续追踪。
  - `Instagram` 从“只有 2 条样本的极早期分发位”升级为“可稳定归档的轻量复用分发位”；仍不建议单独开复杂制作线，但值得持续纳入周报。
  - `TikTok` 仍是 P1 触达测试位，但若没有人工补链，自动化很难做全量内容级复盘。

## 0.1 2026-07-07 增量更新

- 2026-07-07 北京时间这次刷新未发现新的稳定公开内容链接，W28 仍只新增 1 条 YouTube Shorts：`Why Celebrity Birth Charts Get This Wrong So Often`。
- X / TikTok / Instagram 的账号级公开数字与 2026-07-06 一致，说明今天更像“确认无新增公开补链”的检查，而不是一轮新的平台扩量。
- YouTube 公开 feed URL 当前返回 404，但 `@AstrologyWiki/shorts` 和 `/videos` 列表页仍可确认现有 7 个 Shorts ID 与 2 个长视频 ID；因此 YouTube 仍是最稳的 public-only 补链来源，只是抓取入口要改成列表页优先。
- 这次更新不改变已有平台优先级判断：`YouTube Shorts` 仍是 P0，`TikTok` 仍是 P1 测试位，`Instagram` 仍是可稳定归档的轻量复用位，`X` 仍主要承担轻量同步分发。

## 0.2 2026-07-08 增量更新

- YouTube：W28 新补到 `Rhaenyra’s Fight for Power, Explained by Astrology`（`93ONQqwnsn8`）。这条公开页显示 `Jul 7, 2026 / No views / 0 likes`，描述里直接放了 AstrologyWiki 短链，说明当前 Shorts 不只在做 celebrity birth chart，也开始测试角色/剧情切口导回站内。
- YouTube：`@AstrologyWiki/shorts` 列表页本次还浮出 `CHSfnHbuYtE`，但单条页显示约 `7 days ago`，更像历史漏档而不是 W28 新增。判断上应把它看成归档缺口，而不是平台今天新发很多条。
- TikTok：公开 profile 已从 `20 likes / 10 videos` 升到 `28 likes / 11 videos`。这说明 TikTok 本周仍有内容活动，但自动化当前仍拿不到稳定内容级链接，因此只能确认“有新增”，暂不能做内容级比较。
- Instagram：公开 profile 已从 `4 posts` 升到 `5 posts`。这说明 Instagram 本周也有新增分发，但本次仍未稳定补出第 5 帖 shortcode。
- X：本次仅确认公开页面仍可访问，但结构化计数和内容级链接未稳定返回，因此不据此改写已有数量判断。
- 平台判断不变，但“公开链路稳定度”差距进一步拉大：YouTube 仍是唯一能稳定补到内容级链接的平台；TikTok / Instagram 目前只能稳定拿到账号级增量；X 仍最不稳定。

## 1. 阶段总览

> 说明：下表仍保留 2026-07-05 这一版阶段汇总基线，避免把每日自动化变成一次完整重算；2026-07-06 的新增账号级数字、补录链接和平台判断变化，以上一节 `2026-07-06 增量更新` 为准。

| 平台 | 已记录发布数量 | 总浏览/播放 | 总点赞 | 已知评论/回复 | 已知分享/转发 | 已知收藏/书签 | 已知公开互动 | 备注 |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| X / Twitter | 13 | 123 | 25 | 4 | 2 | 1 | 32 | 公开 profile meta 已更新到 20 posts / 3 followers / 9 following；当前只归档了 13 条可见 status |
| TikTok | 5 | 1150 | 15 | 0 | 0 | 1 | 16 | W27 photo post 触达最好；后台完播率和主页访问仍缺失 |
| Instagram | 2 | 11 | 3 | 0 | 待补 | 待补 | 3 + 待补 | 当前只识别到 2 条链接；2026-07-05 公开账号已显示 0 followers、0 following、3 posts |
| YouTube Shorts | 4 | 781 | 15 + 待补 | 待补 | 待补 | n/a | 15 + 待补 | 2026-07-05 新补录 1 条 2026-07-03 relationship astrology Shorts；旧 Shorts 仍有缺口 |
| YouTube Video | 1 | 1 | 1 | 待补 | 待补 | n/a | 1 + 待补 | Harry Kane 长视频刚发布，样本太小 |
| **合计** | **25** | **2066** | **59 + 待补** | **4 + YT待补** | **2 + IG/YT待补** | **2 + IG待补** | **67 + IG/YT待补** | 当前适合做方向判断，不适合做最终投放结论 |

阶段结论：

- 当前最有效的公开触达来自短视频 / 图文短内容，尤其是 YouTube Shorts 的 Messi 和 TikTok 的 Taylor / Haaland。
- TikTok 在 W27 的稳定性更好：4 条内容合计 1150 播放，且前三条都过 175 播放。
- Instagram 目前只是刚开始分发：已识别 2 条视频合计 11 views、3 likes；2026-07-05 公开账号仍是 0 followers，但已显示 3 posts。
- X 登录后补齐到 13 条可见 status，合计 123 views、25 likes；但 2026-07-05 公开账号级 meta 已到 20 posts，说明当前归档仍不完整。
- YouTube Shorts 有单条高峰，但波动大：Messi 772 views，Haaland 5 views，Harry Kane 2 views，新补录 relationship astrology Shorts 2 views。
- X 当前公开 view count 太低，适合做轻量分发和观点同步，不应作为首轮主制作平台。
- 站内支持价值目前只能看“是否有明确 CTA / 目标页面”，还不能证明真实 PV 贡献；必须补 link clicks / referral / 页面 PV。
- 2026-07-05 的账号级公开检查说明，当前更大的问题不是“平台完全没发”，而是本地归档仍落后于公开账号总量，后续复盘要先补档再下结论。

## 2. Top 内容

| 排名 | 内容 | 平台 | 浏览/播放 | 点赞 | 已知公开互动 | 判断 |
|---:|---|---|---:|---:|---:|---|
| 1 | Messi Cancer Sun / big night | YouTube Shorts | 772 | 11 | 11 + 待补 | 当前最强单条；体育热点 + 名人星座 + 站内文章 CTA 是优先复用模板 |
| 2 | Taylor Swift + Travis Kelce 婚礼传闻 / Cancer season | TikTok | 573 | 2 | 3 | 名人娱乐热点能拿到较高触达，但点赞率不高，需要更强互动问题或评论钩子 |
| 3 | Haaland World Cup / Cancer-Leo cusp | TikTok | 277 | 8 | 8 | 播放低于 Taylor，但点赞率更好，sports astrology 的受众质量可能更高 |
| 4 | Haaland birth chart CTA | TikTok | 175 | 3 | 3 | 更贴近 SEO/PV 目标，因为文案直接导向站内 Haaland 页面 |
| 5 | Cancer themes -> Leo shift | TikTok | 125 | 1 | 1 | evergreen transit 解释能跑，但当前弱于名人/体育热点 |

## 3. 内容类型判断

### 3.1 Sports astrology 是当前最值得继续测的主线

证据：

- Messi Shorts：772 views、11 likes，是当前最高单条。
- Haaland TikTok photo：277 views、8 likes，点赞率明显高于 Taylor / Travis。
- Haaland TikTok video：175 views、3 likes，并且直接导向站内 birth chart 页面。
- Harry Kane 目前 YouTube 数据还太早，不能判定失败，但 Shorts / 长视频都需要 24-48 小时后台数据再看。

建议：

- 下一个 3-5 条短内容优先继续 sports astrology，但不要只重复球员姓名。
- 模板用：`比赛 / 热点事件 -> 一个星盘特征 -> 对应站内页面`。
- 每条都要明确目标页，例如 birth chart、zodiac sign、Sun sign、Moon sign 或 celebrity chart 页面。

### 3.2 Celebrity entertainment 可以做流量钩子，但要补站内承接

证据：

- Taylor / Travis TikTok photo：573 views，是 TikTok 当前最高播放。
- 同主题 X：9 views、3 likes、1 reply，X 触达弱但互动密度高。

风险：

- 娱乐传闻容易拿播放，但如果没有明确落到 Birth Chart / Moon Sign / Venus Sign / compatibility 页面，就很难证明对 PV 有帮助。

建议：

- 后续同类内容不要只停在 gossip 解读。
- 结尾统一加一个轻 CTA：`Check your Moon / Venus / birth chart on AstrologyWiki`。
- 适合做成 TikTok photo post + X 精简观点，不必每次都做长视频。

### 3.3 Evergreen transit 适合补内容面，但不是当前最高优先级

证据：

- Cancer -> Leo shift TikTok：125 views、1 like。
- 同主题 X：5 views、1 like。

判断：

- evergreen 解释有长期内容价值，但在当前账号冷启动阶段，公开触达弱于名人 / 体育事件。
- 它更适合当作补充栏目，不适合占用首轮主要制作时间。

建议：

- 保留每周 1 条即可，用来承接季节性关键词和站内百科页面。
- 主题必须具体化，例如 `What Leo season changes in your birth chart`，不要只讲抽象氛围。

## 4. 平台判断

| 平台 | 当前作用 | 继续策略 | 不建议做的事 |
|---|---|---|---|
| YouTube Shorts | P0 测试平台；有最高单条表现，也更接近搜索 / 长尾内容承接 | 继续首发 sports / birth chart / 页面录屏类 Shorts；重点补 Studio 数据 | 不要只看公开 views；没有留存和 shown-in-feed 前不要判定选题失败 |
| TikTok | P1 复用与 Hook 测试平台；W27 触达更稳定 | 继续复用 Shorts 或做 photo post；观察完播率、主页访问、收藏 | 不要为 TikTok 单独开复杂制作线 |
| Instagram | P2 复用分发位；当前账号刚启动，公开数据太早 | 先复用 birth chart / relationship astrology 短视频；重点先补第三条帖文链接，再看 profile visits、link clicks、saves | 不要为了 Instagram 单独开制作线，也不要用 0 粉冷启动数据否定主题 |
| X / Twitter | 轻量分发、观点同步、thread / link follow-up 测试 | 保留同步，但文案要完整，避免只剩短链；link card follow-up 可以继续小测 | 不要把 X 当主增长平台；2026-07-05 公开 profile meta 已到 20 posts，当前归档仍明显不全 |
| YouTube Video | 当前样本不足 | 只在已有 Shorts 脚本可自然扩展时同步发 | 不要为了长视频单独增加制作复杂度 |

## 5. 对 AstrologyWiki PV 的支持价值

当前最接近 PV 支持的内容：

| 内容 | 目标页 / 方向 | 价值判断 | 下一步验证 |
|---|---|---|---|
| Messi Cancer Sun Shorts | `lionel-messi-zodiac-sign` | 公开触达最高，且描述导向站内文章 | 查 2026-06-17 前后该页面 PV / referral / YouTube 来源 |
| Haaland birth chart TikTok / Shorts / X | `erling-haaland-birth-chart` | 多平台同步，主题和站内页强绑定；X 多条 follow-up 合计 55 views | 查 2026-06-29 至 2026-07-01 页面 PV、TikTok / X profile visits、link clicks |
| Harry Kane Shorts / Video | `harry-kane-birth-chart` | 站内已有内容，但公开数据极早期 | 等 24-48 小时补 Studio，再决定是否 TikTok / X follow-up |
| Taylor / Travis Cancer season | Moon sign / Venus sign / compatibility / celebrity astrology | 流量钩子强，但站内承接尚不够明确 | 下次明确 CTA 到 Birth Chart / Moon Sign / Venus Sign |
| Instagram birth chart CTA | birth chart / short-link CTA | 已有 1 条明确导向 AstrologyWiki 短链的视频，公开 11 views、3 likes | 查 Instagram Insights 的 profile visits / link clicks；确认短链在 GA 里是否有访问 |

## 6. 立即可执行建议

1. 下一个制作批次按 `3 条 sports astrology + 1 条 celebrity entertainment + 1 条 evergreen transit` 分配。
2. 每条内容都绑定一个站内目标页，不发没有承接页的热点。
3. Shorts 继续作为主版本，TikTok / Instagram 复用或轻改；TikTok photo post 可以保留，因为 W27 表现稳定。
4. Instagram 暂按 P2 处理：只复用已做素材，优先测 relationship astrology / birth chart CTA，不单独增加制作复杂度。
5. X 只做同步分发：完整观点 + 站内 CTA，避免只放短链。
6. 每周复盘时新增一个字段：`目标页 / CTA`，否则无法判断是否支持 SEO / PV。
7. 补后台数据优先级：YouTube Studio -> TikTok / Instagram profile visits 与 link clicks -> X link clicks -> GA / GSC 目标页 PV。

## 7. 待补数据清单

- [ ] YouTube Studio：Messi / Haaland / Harry Kane Shorts 的 shown in feed、viewed vs swiped away、平均观看时长、comments、subscribers gained。
- [ ] TikTok：每条内容的完播率、平均观看时长、主页访问、链接点击、关注转化。
- [ ] Instagram：两条视频的 reach、plays、saves、shares、profile visits、link clicks。
- [ ] X：已知单帖 impressions、profile visits、link clicks、视频观看时长。
- [ ] GA / GSC：`lionel-messi-zodiac-sign`、`erling-haaland-birth-chart`、`harry-kane-birth-chart` 在对应发布日期前后的 PV / referral / query 变化。
- [ ] X：2026-07-05 公开 profile meta 已显示 20 posts；当前已归档 13 条可见 status，仍需继续从 replies / media / analytics 导出核对。
- [ ] Instagram：2026-07-05 公开 profile header 显示 3 posts；第三条帖文链接、发布时间和公开指标待补。
- [ ] TikTok：2026-07-05 公开 profile meta 显示 9 videos；当前仅识别到 5 条公开视频链接。
- [ ] YouTube：2026-07-05 `/shorts` 公开页显示 6 个 Shorts 链接、`/videos` 公开页显示 2 个长视频链接；当前仍有 2 条 Shorts + 1 条长视频未归档。
