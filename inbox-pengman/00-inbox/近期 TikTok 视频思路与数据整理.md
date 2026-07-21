---
title: 近期 TikTok 视频思路与数据整理
project: astrologywiki
type: personal-reference
status: draft
owner: Pengman
updated: 2026-07-20
data_snapshot: 2026-07-20T06:48:58.046Z
---

# 近期 TikTok 视频思路与数据整理

> 用途：供 GenGrowth 团队快速查看近期 4 个 TikTok 账号每条内容的思路、验证项和公开数据。
>
> 数据源：[TikTok Daily Metrics](https://docs.google.com/spreadsheets/d/17NOiX9VGozHEgthpSbBN-2dyf4rJRsTQkmLubBwnICQ/edit?gid=2112705446#gid=2112705446)，统一使用 `accounts_latest` 与 `posts_latest` 在 2026-07-20 的最新快照。

## 口径说明

- 当前范围：4 个账号、20 条公开内容，其中 18 条视频、2 条 Photo Post。
- 数据格式统一写作：`播放 / 点赞 / 评论 / 收藏 / 分享`。
- 最新采集运行覆盖 4/4 个账号和 20 条内容，`partial_count = 0`、`failed_count = 0`；两条 Photo Post 的公开互动字段也已补齐。
- 公开播放只用于诊断，不能替代后台 reach、完播率、平均观看时长、主页访问、链接点击或 qualified UV。
- 有正式生产记录的内容，思路与验证项来自对应 Brief；没有正式 Brief 的内容明确标为“按发布表达归纳”。
- 不同内容的发布时间和观察窗口不同，当前只能形成阶段观察，不能直接升级为长期规则。

## 一、Pengman 近期工作回顾

最初使用第一版 Skill 选题时，流程还比较粗糙，很多选题仍由 Pengman 人工确定。这个阶段主要在 AstrologyWiki 官方账号尝试不同内容方向、视频形式和制作工具，先快速认识平台并寻找可行方向。

目前主要把 TikTok 作为实验平台，因为它适合快速测试短视频、AI 口播、纯字幕和 Photo Post；星座、关系、情绪与热点内容也更容易通过强 Hook 获得早期播放和互动信号。TikTok 是当前的主要测试场，不代表未来只做 TikTok。

上周把原有 Skill 与网上找到的内容生产 SOP 重新结合，补充了近期内容检查、账号分配、统一 Brief、制作记录和发布复盘，提高了内容产出效率，也开始形成更明确的系列实验。

目前仍处于探索阶段。相比早期的广泛尝试，现在正逐步转向多账号分工、记录验证项和尽量控制变量；下一步需要继续积累可比较样本，并补齐观看与站内转化数据。

## 二、四个账号的当前状态

### 账号总览

> “简单公开互动率”统一按 `(点赞 + 评论 + 收藏 + 分享) ÷ 播放` 计算，仅用于比较当前公开内容的互动密度，不等于后台 engagement rate，也不代表转化。

| 账号                | 账号公开快照                                              | 本表采集到的内容表现                                               | 当前状态                                                               |
| ----------------- | --------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------ |
| `@astrologywiki`  | 3 followers / 117 total likes / profile 显示 10 posts | 10 条；4,454 播放；123 次公开互动；平均 445 播放；中位数 356；简单公开互动率 2.8%   | 内容组合和发布记录最完整，已经出现“时效天象”“人物占星”“Moon Sign 系列”三个方向；有播放，但关注和站内转化尚未被证明。 |
| `@filestarsx`     | 1 follower / 45 total likes / profile 显示 3 posts    | 3 条；2,335 播放；54 次公开互动；平均 778 播放；中位数 396；简单公开互动率 2.3%     | 有热点爆发能力，但 81.5% 的播放来自单条 Yamal 内容，账号尚未证明可重复性。                       |
| `@miraaastrology` | 8 followers / 76 total likes / profile 显示 1 post    | 实际采集到 3 条；976 播放；95 次公开互动；平均 325 播放；中位数 334；简单公开互动率 9.7% | 当前互动密度最高、followers 也最高；“强 Hook + 单一星座心理 + AI 口播”已出现正向信号，但样本仍少。     |
| `@shirley527146`  | 0 followers / 4 total likes / profile 显示 2 posts    | 实际采集到 4 条；480 播放；4 次公开互动；平均 120 播放；中位数 148；简单公开互动率 0.8%  | 尚未形成账号定位或内容分发基线，当前不适合扩大投入。                                         |
|                   |                                                     |                                                          |                                                                    |

四个账号合计采集到 20 条内容、8,245 次播放和 276 次公开互动。这个总量只能反映当前被采集内容的公开表现，不能当成账号后台总 reach 或完整生命周期数据。

### ① `@astrologywiki`：内容供给已成形，转化链仍未验证

**当前状态**

- 10 条内容累计 `4,454` 播放，平均 `445`、中位数 `356`，说明账号已经不是只靠一条内容支撑全部结果。
- 播放前三是 `Cancer New Moon 973`、`Haaland Birth Chart 801`、`Grand Alignment 582`，合计占账号当前播放约 `52.9%`。表现集中但没有达到单条完全主导。
- `Cancer New Moon` 证明明确日期 + 具体问题可以拿到播放；`Grand Alignment` 证明极简断言式天象内容更容易获得点赞和收藏；`Venus in Virgo` 说明生活化观察框架也有保存价值。
- 账号简介已有 `Free Birth Chart`、官网域名和互动邀请，承接入口在形式上是存在的。

**风险**

- 3 followers 与 4,454 次已采集播放之间不能直接计算关注转化，但至少说明“有播放”还没有转化成可见的账号增长证据。
- 当前没有主页访问、bio link clicks、qualified UV、工具使用和注册数据，无法证明哪一类内容真的服务 AstrologyWiki。
- Moon Sign 系列波动明显：`Earth Moon 145`、`Fire Moon 159`、具体三星座组合 `322`。如果继续原样批量复制元素分组，边际收益可能较低。

**建议**

- 继续把账号主轴放在 `时效天象 + 用户具体问题 + 可追踪落地页`，这是当前同时兼顾播放与 AstrologyWiki 承接潜力的方向。
- 下一轮安排可比实验：一条提问式天象 Hook、一条极简断言式天象 Hook，尽量保持时长、视觉和发布时间接近，并给两条都配置可追踪 CTA。
- Moon Sign 系列从元素合集转向单一星座、单一行为或更强身份命中，不再只换三个星座机械续集。

### ② `@filestarsx`：有热点触达能力，但结果高度依赖单条内容

**当前状态**

- 3 条内容累计 `2,335` 播放，其中 Yamal 世界杯 Photo Post 单条 `1,902`，占账号当前播放约 `81.5%`。
- Yamal 内容数据为 `1,902 / 32 / 1 / 5 / 1`，说明它不只是被动播放，也产生了收藏与分享；但简单公开互动率约 `2.1%`，并不高于 AI 占星师账号。
- Messi × Yamal Photo Post 为 `396 / 13 / 0 / 1 / 0`，说明 Photo Post 不一定天然获得高播放，热点强度、发布时间和人物叙事仍是关键变量。

**风险**

- 当前平均播放 `778` 被单条热点明显抬高，中位数只有 `396`，账号尚未证明稳定产出能力。
- 账号 bio 为空，没有明确的内容承诺或下一步入口；即使热点获得播放，也很难判断用户为什么要关注或进入 AstrologyWiki。
- 世界杯结束后，如果没有新的明星/赛事窗口，当前流量来源可能迅速衰减。

**建议**

- 保留“赛事节点 + 明星 + 占星关系”的热点定位，但用连续 3–5 条同类内容验证可重复性，不以单条 Yamal 爆点宣布方向成立。
- 补一个简短、非广告感的账号承诺和可归因 bio 入口；纯庆祝帖仍可作为真人感特例，不要求每条都带 CTA。
- 后续 Photo Post 固定补平均滑动页数、完成率、主页访问和关注转化，否则只能判断播放，不能判断内容深度。

### ③ `@miraaastrology`：当前最强的互动账号，适合继续做受控实验

**当前状态**

- 3 条内容播放分布为 `256 / 334 / 386`，中位数 `334`，没有单条极端拉高平均值，当前表现相对稳定。
- 3 条累计 976 播放、95 次公开互动，简单公开互动率约 `9.7%`，明显高于其他三个账号。
- `Scorpio tested you` 达到 `334 / 38 / 2 / 7 / 3`，公开互动率约 `15.0%`；相比 `leave before you` 的约 `7.8%`，说明“关系测试 / 信任证据”切口目前更能触发点赞、收藏和分享。
- followers 为 8，是四个账号中最高；bio 已有人设和互动邀请，说明 persona 比其他测试账号更清楚。

**风险**

- 只有 3 条样本，且两条集中在 Scorpio，可能是星座题材本身而不一定是 AI 口播形式带来的结果。
- bio 没有 AstrologyWiki 链接；当前更像互动与人设测试账号，还没有建立站内承接链。
- 账号级 `total_posts = 1`，但 `posts_latest` 实际采集到 3 条，说明 TikTok profile 元数据存在口径异常，不能用该字段判断真实发布量。

**建议**

- 继续用 5–7 条受控样本建立基线：保持 AI 形象、视频长度、字幕和发布节奏，逐次只更换星座或心理机制。
- 下一阶段至少加入一个非 Scorpio placement，区分“Scorpio 题材红利”和“AI 心理口播形式红利”。
- 先完成观看与互动基线，再测试轻量 CTA；不要现在同时更换人设、时长、Hook 和落地方式。

### ④ `@shirley527146`：仍是低成本 canary，不适合正常扩量

**当前状态**

- 4 条累计 `480` 播放、4 次公开互动，简单公开互动率约 `0.8%`。
- 当前最高内容是 `Literally me right now`：`184 / 3 / 0 / 0 / 0`；比直接介绍合盘或 daily transit 更接近自然 UGC，但优势仍很弱。
- 最新 `Checking my transit` 为 0 播放，说明当前内容没有形成稳定分发。

**风险**

- 0 followers、空 bio、泛化 caption，让用户很难理解账号角色和关注理由。
- 当前视频主要表达“我在用占星”，但没有把具体结果、惊讶点或情绪回报放到前 2 秒。
- 账号级 `total_posts = 2`，但实际采集到 4 条，同样存在 profile 元数据口径异常。

**建议**

- 暂时只做 3 条低成本 canary，不扩大常规产能。
- 每条只测试一个更具体的产品场景，例如“我和男友的合盘最意外的一点”“今天 transit 提醒我不要做什么”，开头先给结果再展示工具。
- 如果 3 条在相近观察窗口仍没有改善播放、互动或主页访问，再决定暂停账号，而不是无限继续泛 UGC。

### 当前资源优先级

1. **P0：`@miraaastrology` 的受控 AI 口播实验**——当前互动密度最高，最适合继续积累同条件样本。
2. **P0：`@astrologywiki` 的时效天象 + 可追踪站内承接**——这是离业务目标最近的主账号路径。
3. **P1：`@filestarsx` 的机会型热点内容**——有热点时快速跟进，但不按稳定日更账号配置固定重产能。
4. **P2：`@shirley527146` 的低成本 canary**——先证明 Hook 和账号角色，再决定是否扩量。

### 数据质量边界

- `account_history` 当前只有 2026-07-20 一天的快照，因此不能判断 followers、likes 或 posts 的日增长趋势。
- `miraaastrology` 的 profile 显示 1 post，但实际采集到 3 条；`shirley527146` 显示 2 posts，但实际采集到 4 条。账号级 `total_posts` 暂不作为发布量事实来源。
- 最新运行已完整采集 20 条内容，但公开数据仍不包含后台 reach、留存、平均观看时长、完播率、主页访问和链接点击。
- 因账号体量、发布时间、内容格式和观察窗口不同，跨账号互动率只用于找下一步实验优先级，不用于做账号绩效排名。

## 三、内容层面的阶段观察

### 1. 热点 Photo Post 拿到最高播放，但结果高度集中

`filestarsx` 的 Yamal 世界杯内容达到 `1,902 / 32 / 1 / 5 / 1`，是当前所有内容中播放最高的一条。它证明热点 Photo Post 能拿到触达，但简单公开互动率约 `2.1%`，且占账号播放约 `81.5%`；当前更像单条热点成功，尚未证明账号方向稳定成立。

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

## 四、逐条内容与验证项

### ① `@astrologywiki`｜官方账号

| 内容 | 思路 / 验证项 | 最新公开数据 | 阶段观察 |
|---|---|---:|---|
| [Haaland Birth Chart](https://www.tiktok.com/@astrologywiki/video/7657074482648993037) | 体育明星热点 + 出生盘概览；验证明星内容能否承接到站内人物 Birth Chart 页面。该思路按发布表达与既有归档归纳。 | `801 / 10 / 0 / 0 / 1` | 播放较高，但缺少页面点击和 qualified UV，不能判断承接。 |
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
| [Yamal 19 岁 / World Cup Semi](https://www.tiktok.com/@filestarsx/photo/7662341959507332383) | 生日节点 + 世界杯热点 + Cancer Season；测试明星热点 Photo Post 和球队选择互动。思路按发布表达归纳。 | `1,902 / 32 / 1 / 5 / 1` | 当前播放最高并产生收藏、分享，但结果高度依赖热点；滑动完成率和主页访问仍待补。 |
| [Messi × Yamal / Two Cancer Suns](https://www.tiktok.com/@filestarsx/photo/7663333677438438686) | 从 2007 到 2026 的人物对照 + 比较占星；同时验证 Photo Post 是否比首次误发的视频形式更适合该内容。 | `396 / 13 / 0 / 1 / 0` | 需要原视频链接和相同观察窗口数据，才能验证形式差异。 |
| [Spain World Cup Win](https://www.tiktok.com/@filestarsx/video/7664487396867656991) | 不做占星分析、不放 CTA；只用轻量庆祝内容参与热点，让账号更像真人。 | `37 / 1 / 0 / 0 / 0` | 刚发布，观察窗口很短，暂不评价。 |

### ④ `@shirley527146`｜UGC / 普通用户感账号

以下 4 条没有对应的正式 Brief，思路均按发布表达归纳。

| 内容 | 思路 / 验证项 | 最新公开数据 | 阶段观察 |
|---|---|---:|---|
| [When Friends Ask Me for Astrology Advice](https://www.tiktok.com/@shirley527146/video/7662213851680738574) | 朋友场景 + “懂占星的人”身份共鸣。 | `135 / 0 / 0 / 0 / 0` | 没有公开互动，Hook 与具体冲突仍需加强。 |
| [Testing Synastry With My Boyfriend](https://www.tiktok.com/@shirley527146/video/7662319263247568141) | 普通用户发现并体验 AstrologyWiki 合盘功能；测试真实产品使用场景。 | `161 / 1 / 0 / 0 / 0` | 有初始播放，但产品结果和情绪回报不够明确。 |
| [Literally Me Right Now](https://www.tiktok.com/@shirley527146/video/7662650075671317774) | 测试轻量 reaction / meme 是否比直接产品介绍更自然。 | `184 / 3 / 0 / 0 / 0` | 当前账号播放和点赞最高，可继续细化“具体情绪 + 结果画面”。 |
| [Checking My Transit Before the Day Starts](https://www.tiktok.com/@shirley527146/video/7663456266794142990) | 把 AstrologyWiki 包装成每天查看 transit 的使用习惯。 | `0 / 0 / 0 / 0 / 0` | 暂无分发；单条结果不足以判断使用习惯方向。 |

## 五、下一轮建议继续验证

1. **官方账号**：继续做“具体日期天象 + 提问式 Hook”和“极简断言式 Hook”，但至少安排一条带可追踪 CTA，区分纯播放与站内承接。
2. **Moon Sign 系列**：减少宽泛元素分组，优先测试单一星座、具体行为问题或更强身份命中。
3. **AI 占星师**：保持 AI 形象、时长和字幕形式一致，继续更换 Scorpio 心理切口，避免一轮同时修改多个变量。
4. **filestarsx**：继续使用热点 Photo Post，但必须补点赞、评论、平均滑动页数、完成率和主页访问。
5. **UGC 账号**：继续测试真实生活场景，但前 2 秒需要给出更具体的冲突、惊讶点或产品结果。

## 六、仍待补的数据

- TikTok 后台 reach、3 秒留存、平均观看时长、完播率。
- 主页访问、关注转化、短链 / bio link 点击。
- qualified UV、assisted qualified UV、工具使用、注册和购买。
- 两条 filestarsx Photo Post 的平均滑动页数、完成率、主页访问和关注转化。
- 不同内容统一观察窗口的 24 / 72 小时数据。

在这些数据补齐前，以上内容均按“阶段观察”处理，不写成最终验证结论。
