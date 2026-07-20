---
title: 近期 TikTok 视频思路与数据整理
project: astrologywiki
type: personal-reference
status: draft
owner: Pengman
updated: 2026-07-20
data_snapshot: 2026-07-20T06:37:10.383Z
---

# 近期 TikTok 视频思路与数据整理

> 用途：供 GenGrowth 团队快速查看近期 4 个 TikTok 账号每条内容的思路、验证项和公开数据。
>
> 数据源：[TikTok Daily Metrics](https://docs.google.com/spreadsheets/d/17NOiX9VGozHEgthpSbBN-2dyf4rJRsTQkmLubBwnICQ/edit?gid=2112705446#gid=2112705446)，统一使用 `posts_latest` 在 2026-07-20 的最新快照。

## 口径说明

- 当前范围：4 个账号、20 条公开内容，其中 18 条视频、2 条 Photo Post。
- 数据格式统一写作：`播放 / 点赞 / 评论 / 收藏 / 分享`。
- Photo Post 当前只稳定抓到播放，其他互动字段标为 `待补数据`。
- 公开播放只用于诊断，不能替代后台 reach、完播率、平均观看时长、主页访问、链接点击或 qualified UV。
- 有正式生产记录的内容，思路与验证项来自对应 Brief；没有正式 Brief 的内容明确标为“按发布表达归纳”。
- 不同内容的发布时间和观察窗口不同，当前只能形成阶段观察，不能直接升级为长期规则。

## 一、阶段观察

### 1. 热点 Photo Post 拿到最高播放，但还不能判断互动或转化

`filestarsx` 的 Yamal 世界杯内容达到 `1,902` 播放，是当前所有内容中最高的一条。但 Photo Post 的点赞、评论、收藏、分享和滑动完成率还没有补齐，因此只能确认触达，不能判断内容质量或站内承接。

### 2. 官方账号里，时效天象 Hook 明显强于元素分组

- `Cancer New Moon`：`973 / 15 / 0 / 0 / 0`，是官方账号当前播放最高的内容。
- `Grand Alignment`：`582 / 21 / 1 / 8 / 1`，播放不是最高，但早期互动与收藏更突出。
- `Earth Moon` 元素分组：`145 / 1 / 0 / 0 / 0`，当前明显偏弱。
- `Cancer / Libra / Aquarius Moon` 具体三星座分组：`322 / 5 / 1 / 0 / 0`，好于元素分组，但仍弱于天象提问式 Hook。

当前证据更支持继续测试“明确日期天象 + 具体问题”与“极简天象断言”，不支持继续原样批量复制宽泛元素分组。

### 3. AI 占星师账号的“强 Hook + 单一星座心理”有初步正向信号

- `Scorpio doesn't trust you until they've tested you`：`334 / 38 / 2 / 7 / 3`，简单公开互动率约 `15.0%`。
- `The biggest problem with Scorpio is they'll leave before you get the chance to`：`256 / 14 / 5 / 1 / 0`，简单公开互动率约 `7.8%`。

第二条保持账号、AI 形象、时长区间和总体形式基本不变，只把心理切口从“先离开”换成“通过测试确认信任”，播放和各项互动都更高。这个方向值得继续做同条件 canary，但两条样本仍不足以形成稳定结论。

### 4. “具体生活问题 + 天象解释”比泛知识更容易产生互动

- `Dreaming about your ex`：`386 / 24 / 0 / 1 / 0`。
- `Venus in Virgo / receipt season`：`350 / 19 / 1 / 4 / 0`。

两条都没有停留在天象百科，而是落到关系、情绪和日常行为。当前点赞、收藏信号支持继续测试这种包装。

### 5. UGC / 普通用户感账号仍处于基线期

`shirley527146` 的 4 条内容中，最高播放为 `184`。现阶段样本少、账号基数小，暂时只能看作早期基线，不能直接判定 UGC 方向无效。

## 二、逐条内容与验证项

### ① `@astrologywiki`｜官方账号

| 内容 | 思路 / 验证项 | 最新公开数据 | 阶段观察 |
|---|---|---:|---|
| [Haaland Birth Chart](https://www.tiktok.com/@astrologywiki/video/7657074482648993037) | 体育明星热点 + 出生盘概览；验证明星内容能否承接到站内人物 Birth Chart 页面。该思路按发布表达与既有归档归纳。 | `800 / 10 / 0 / 0 / 1` | 播放较高，但缺少页面点击和 qualified UV，不能判断承接。 |
| [Rhaenyra / House of the Dragon](https://www.tiktok.com/@astrologywiki/video/7659773834345647374) | 用影视人物冲突切入 10 宫地位与 8 宫权力；验证娱乐 IP + 角色占星解释。 | `361 / 14 / 0 / 0 / 0` | 互动好于同期明星合盘，但仍缺短链点击。 |
| [Haaland × Isabel Synastry](https://www.tiktok.com/@astrologywiki/video/7659748708950609165) | 明星情侣 + 合盘；验证体育热点能否带动 Relationship Chart 使用，并测试跨平台复用。 | `453 / 3 / 0 / 0 / 1` | 有播放与 1 次分享，但公开互动偏低，站内使用待补。 |
| [Venus in Virgo / Receipt Season](https://www.tiktok.com/@astrologywiki/video/7660401338701974798) | 不做百科解释，改成“关系、金钱和日常细节开始提供证据”的可执行观察框架；重点验证收藏价值。 | `350 / 19 / 1 / 4 / 0` | 点赞与收藏信号较强，支持继续测试生活化 transit。 |
| [Moon Sign Toxic Traits 第 1 条](https://www.tiktok.com/@astrologywiki/video/7660473423038041358) | Scorpio、Gemini、Pisces 三星座身份命中 + 扎心行为描述；验证多星座纯字幕短视频和 Moon Report CTA。 | `308 / 6 / 1 / 1 / 0` | 有初始播放；但 caption 误写为 `astrology.com`，不能作为 AstrologyWiki 站内承接样本。 |
| [Fire Moon Toxic Traits](https://www.tiktok.com/@astrologywiki/video/7660826807507094798) | 复用第 1 条的短时长、无口播、纯字幕结构，改测 Aries、Leo、Sagittarius 元素分组。 | `159 / 8 / 0 / 1 / 0` | 播放低，但互动密度不差；需后台留存判断是分发还是内容问题。 |
| [Cancer New Moon](https://www.tiktok.com/@astrologywiki/video/7661912847693188365) | 明确日期 + `What no longer feels like home?` 提问式 Hook；把兴趣承接到用户自己的 Cancer 宫位和 Birth Chart。 | `973 / 15 / 0 / 0 / 0` | 官方账号播放最高，是当前最值得补短链与站内承接数据的样本。 |
| [Earth Moon Toxic Traits](https://www.tiktok.com/@astrologywiki/video/7662283840634866957) | 继续验证 Moon Sign 系列，改成 Taurus、Virgo、Capricorn 元素分组。 | `145 / 1 / 0 / 0 / 0` | 当前系列中最弱；下一轮应改测单一身份或具体行为问题。 |
| [Cancer / Libra / Aquarius Moon](https://www.tiktok.com/@astrologywiki/video/7663039564482710798) | 从元素分组改成三个具体星座，并测试女性星座角色视觉，继续使用 Moon Report CTA。 | `322 / 5 / 1 / 0 / 0` | 好于 Earth Moon 元素分组，说明具体星座组合目前更容易拿到初始播放。 |
| [Grand Alignment](https://www.tiktok.com/@astrologywiki/video/7663445797949721869) | 极简天象断言：四颗行星都在 4°；测试“时效天象 + 极简强断言”。本条不放 CTA，先观察纯流量和收藏。 | `582 / 21 / 1 / 8 / 1` | 当前收藏和早期互动突出，但没有 CTA，不能与 Cancer New Moon 的站内承接直接比较。 |

### ② `@miraaastrology`｜AI 占星师账号

| 内容 | 思路 / 验证项 | 最新公开数据 | 阶段观察 |
|---|---|---:|---|
| [Dreaming About Your Ex](https://www.tiktok.com/@miraaastrology/video/7662239701184597261) | 从“梦到前任”这一具体情绪问题切入 Mercury Retrograde；验证生活问题 + 时效天象 + Birth Chart 承接。 | `386 / 24 / 0 / 1 / 0` | 互动信号较好，支持继续测试具体生活问题。 |
| [Scorpio Psychology：Leave Before You](https://www.tiktok.com/@miraaastrology/video/7663410404512566542) | 建立“单一星座心理机制 + 强 Hook + 55–60 秒 AI 口播”的首条基线；不放 CTA，优先测流量和观看。 | `256 / 14 / 5 / 1 / 0` | 评论信号明显，可作为系列首条基线。 |
| [Scorpio Psychology：Tested You](https://www.tiktok.com/@miraaastrology/video/7663472486893374734) | 保持 AI 形象、时长和形式不变，把心理切口从“先离开”改成“通过测试确认信任”；比较哪个行为更容易引发共鸣。 | `334 / 38 / 2 / 7 / 3` | 当前账号公开互动最强，值得继续在同条件下更换心理切口。 |

### ③ `@filestarsx`｜世界杯热点账号

| 内容 | 思路 / 验证项 | 最新公开数据 | 阶段观察 |
|---|---|---:|---|
| [Yamal 19 岁 / World Cup Semi](https://www.tiktok.com/@filestarsx/photo/7662341959507332383) | 生日节点 + 世界杯热点 + Cancer Season；测试明星热点 Photo Post 和球队选择互动。思路按发布表达归纳。 | `1,902 / 待补 / 待补 / 待补 / 待补` | 当前播放最高，但互动与滑动完成率缺失，不能判断内容质量。 |
| [Messi × Yamal / Two Cancer Suns](https://www.tiktok.com/@filestarsx/photo/7663333677438438686) | 从 2007 到 2026 的人物对照 + 比较占星；同时验证 Photo Post 是否比首次误发的视频形式更适合该内容。 | `395 / 待补 / 待补 / 待补 / 待补` | 需要原视频链接和相同观察窗口数据，才能验证形式差异。 |
| [Spain World Cup Win](https://www.tiktok.com/@filestarsx/video/7664487396867656991) | 不做占星分析、不放 CTA；只用轻量庆祝内容参与热点，让账号更像真人。 | `31 / 1 / 0 / 0 / 0` | 刚发布，观察窗口很短，暂不评价。 |

### ④ `@shirley527146`｜UGC / 普通用户感账号

以下 4 条没有对应的正式 Brief，思路均按发布表达归纳。

| 内容 | 思路 / 验证项 | 最新公开数据 | 阶段观察 |
|---|---|---:|---|
| [When Friends Ask Me for Astrology Advice](https://www.tiktok.com/@shirley527146/video/7662213851680738574) | 朋友场景 + “懂占星的人”身份共鸣。 | `135 / 0 / 0 / 0 / 0` | 没有公开互动，Hook 与具体冲突仍需加强。 |
| [Testing Synastry With My Boyfriend](https://www.tiktok.com/@shirley527146/video/7662319263247568141) | 普通用户发现并体验 AstrologyWiki 合盘功能；测试真实产品使用场景。 | `161 / 1 / 0 / 0 / 0` | 有初始播放，但产品结果和情绪回报不够明确。 |
| [Literally Me Right Now](https://www.tiktok.com/@shirley527146/video/7662650075671317774) | 测试轻量 reaction / meme 是否比直接产品介绍更自然。 | `184 / 3 / 0 / 0 / 0` | 当前账号播放和点赞最高，可继续细化“具体情绪 + 结果画面”。 |
| [Checking My Transit Before the Day Starts](https://www.tiktok.com/@shirley527146/video/7663456266794142990) | 把 AstrologyWiki 包装成每天查看 transit 的使用习惯。 | `0 / 0 / 0 / 0 / 0` | 暂无分发；单条结果不足以判断使用习惯方向。 |

## 三、下一轮建议继续验证

1. **官方账号**：继续做“具体日期天象 + 提问式 Hook”和“极简断言式 Hook”，但至少安排一条带可追踪 CTA，区分纯播放与站内承接。
2. **Moon Sign 系列**：减少宽泛元素分组，优先测试单一星座、具体行为问题或更强身份命中。
3. **AI 占星师**：保持 AI 形象、时长和字幕形式一致，继续更换 Scorpio 心理切口，避免一轮同时修改多个变量。
4. **filestarsx**：继续使用热点 Photo Post，但必须补点赞、评论、平均滑动页数、完成率和主页访问。
5. **UGC 账号**：继续测试真实生活场景，但前 2 秒需要给出更具体的冲突、惊讶点或产品结果。

## 四、仍待补的数据

- TikTok 后台 reach、3 秒留存、平均观看时长、完播率。
- 主页访问、关注转化、短链 / bio link 点击。
- qualified UV、assisted qualified UV、工具使用、注册和购买。
- 两条 filestarsx Photo Post 的点赞、评论、收藏、分享、平均滑动页数和完成率。
- 不同内容统一观察窗口的 24 / 72 小时数据。

在这些数据补齐前，以上内容均按“阶段观察”处理，不写成最终验证结论。
