---
title: AstrologyWiki 系列账号典型视频脚本存档
project: astrologywiki
type: account-script-archive
status: active
owner: Pengman
updated: 2026-07-22
data_source: Sheet2 / posts_latest
data_snapshot: 2026-07-22T02:25:21.524Z
actual_publish_verified_at: 2026-07-22
accounts:
  - astrologywiki
  - filestarsx
  - miraaastrology
excluded_account:
  - shirley527146 / Shirley777
related:
  - "[[inbox-pengman/04-production/01-strategy-and-platform-research/AstrologyWiki 社媒账号定位与内容路由 Playbook]]"
  - "[[inbox-pengman/05-account-assets/Google sheet curl]]"
---

# AstrologyWiki 系列账号典型视频脚本存档

> 用途：保存当前三个系列账号中“播放较高且最能代表账号打法”的已发布脚本，供后续 Brief、脚本对照和批量生产复用。本文不替代单条生产记录；脚本后续修改仍回到原生产记录。

## 选择口径

- 数据来源：`Sheet2 / posts_latest`，快照时间 `2026-07-22T02:25:21.524Z`。
- 已排除：`shirley527146`，昵称 `Shirley777`。
- 选择不是只按播放量机械排序，同时要求能代表账号当前栏目、形式或内容机制。
- `views` 是同一快照下的公开累计播放，不等于同观察窗口实验结果。
- 脚本和视觉以 TikTok 实际发布成片为第一证据，仓库已确认生产记录为第二证据，早期候选稿仅用于解释差异。
- 实际成片核验方式：公开 TikTok 页面、代表帧、媒体时长、画面内字幕；无法稳定读取的 slideshow 页会明确标注，不以生产方案冒充已核验画面。
- Sheet2 将 Cancer New Moon、Grand Alignment、Scorpio Tested You 标成 `photo`，但公开成片均可提取为带音轨的 MP4；下表已按实际发布形式修正为 `video`。

| 账号 | 入选内容 | 类型 | views | 入选理由 |
|---|---|---:|---:|---|
| `@astrologywiki` | Cancer New Moon | video | 1,012 | 当前账号播放最高；代表“时效天象 + 情绪问题 + 查盘承接” |
| `@astrologywiki` | Grand Alignment | video | 639 | 播放第二梯队且收藏 8；代表极短天象断言模板 |
| `@filestarsx` | Yamal 19 岁 / France vs Spain | photo | 1,902 | 三账号全部内容中播放最高；代表世界杯热点 + 球星占星 slideshow |
| `@filestarsx` | Messi × Yamal | photo | 591 | 账号第二高播放；代表人物故事 + 非 Sun placement 对照 |
| `@miraaastrology` | Scorpio：Stopped Letting You In | video | 736 | 账号播放最高且互动最强；代表固定 AI 主播 + 关系边界 Hook |
| `@miraaastrology` | Scorpio：Tested You | video | 426 | 播放不是第二高，但比 Mercury Rx 内容更能代表已连续验证的 Scorpio Psychology 系列 |

---

## 1. `@astrologywiki`：官方天象账号

### 1.1 Cancer New Moon — 情绪提问 + 查盘承接

- 发布链接：https://www.tiktok.com/@astrologywiki/video/7661912847693188365
- Sheet2：`1,012 views / 17 likes / 0 comments / 0 favorites / 0 shares`
- 原生产记录：[[inbox-pengman/04-production/07-content-production/2026-07-13 Cancer New Moon 视频制作方案]]
- 实际成片：`720 × 1280`，约 `15.14s`，文字视频；仓库 40 秒主版和 15 秒备用版都不是最终发布字幕。
- 典型机制：精确日期 + 情绪问题 → 现实生活场景 → AstrologyWiki 星盘截图 → 站点 CTA。

#### TikTok 实际发布字幕

| 时间 | 实际屏幕文字 | 画面 |
|---|---|---|
| 0–3s | **Cancer New Moon / July 14**；**What no longer feels like home?** | 黑底，中央月亮特写；上、下两组白色粗体字 |
| 3–9s | **With Mercury still retrograde in Cancer, old feelings may get louder.**；**Notice where you keep adapting instead of feeling safe.** | 昏暗卧室 / 窗边室内 B-roll，人物缺席；两段文字居中 |
| 9–12s | **Check where ♋ Cancer lands in your chart.** | AstrologyWiki 深色星盘页面截图，标题置顶 |
| 12–15s | **Get your full birth chart analysis at astrologywiki.com ✨** | 回到昏暗模糊背景，纯文字 CTA |

#### 实际发布纯文本

```text
Cancer New Moon
July 14

What no longer feels like home?

With Mercury still retrograde in Cancer, old feelings may get louder.
Notice where you keep adapting instead of feeling safe.

Check where ♋ Cancer lands in your chart.

Get your full birth chart analysis at astrologywiki.com ✨
```

#### 实际视觉设计

- 9:16、整体低亮度，黑 / 深灰 / 暗绿为主，白色粗体无衬线字；不使用品牌边框或复杂动效。
- 首屏以月亮为唯一主体，标题在上、问题在下，形成“天象 + 人类问题”的两层信息。
- 中段用昏暗卧室和窗边画面承载“home / safe”，视觉直接对应情绪词，不解释星象术语。
- 产品承接只占约 3 秒：深色星盘圆盘居中，顶部一句指令；最后用模糊暗背景收 CTA。
- 成片没有采用原生产稿的三星合相动画、Venus–Uranus 段落或 40 秒口播。

### 1.2 Grand Alignment — 极短天象断言

- 发布链接：https://www.tiktok.com/@astrologywiki/video/7663445797949721869
- Sheet2：`639 views / 21 likes / 1 comment / 8 favorites / 1 share`
- 原生产记录：[[inbox-pengman/04-production/07-content-production/2026-07-17 Grand Alignment 视频制作方案]]
- 实际成片：`720 × 1280`，约 `14.91s`，AI / TTS 口播 + 固定标题 + 自动字幕。
- 典型机制：日期 + 数字异常点 + 行星名单 + 一句开放式情绪收束。

#### TikTok 实际发布口播

| 时间 | 字幕 / 口播 |
|---|---|
| 0–4s | **July 19th. Four planets, all at 4 degrees.** |
| 4–11s | **Jupiter, Pluto, Uranus, Neptune. Same degree. First time in decades.** |
| 11–15s | **Something is shifting.** |

```text
July 19th. Four planets, all at 4 degrees.

Jupiter, Pluto, Uranus, Neptune. Same degree. First time in decades.

Something is shifting.
```

#### 实际视觉设计

- 9:16，顶部固定白色标题 `July 19 / Grand Alignment`，全片保持不变。
- 前半段为太阳居中、行星围绕的深蓝绿色太阳系动画；画面缓慢推进，视觉负责解释“四颗行星”。
- 后半段切为高速旋转的星轨 / 星空隧道，配合 `First time in decades` 和 `Something is shifting` 提升事件感。
- TikTok 自动字幕位于底部，白色细体；没有单独品牌卡、产品截图或 CTA。
- 实际视觉不是原稿所写的“单一星空画面全程不切换”，至少存在太阳系 → 星轨两段明显变化。

---

## 2. `@filestarsx`：热点 / 球星占星账号

### 2.1 Yamal 19 岁 / France vs Spain — 世界杯热点 slideshow

- 发布链接：https://www.tiktok.com/@filestarsx/photo/7662341959507332383
- Sheet2：`1,902 views / 32 likes / 1 comment / 5 favorites / 1 share`
- 仓库对应生产稿：[[inbox-pengman/04-production/07-content-production/2026-07-14 France vs Spain Astrology Slideshow 制作方案]]
- 映射说明：仓库旧记录仍使用旧 handle，但 post ID 与 Sheet2 的 `filestarsx` 链接一致。
- 实际核验：公开播放器显示 photo slideshow；已提取封面及 Mbappé、Griezmann、Olise 页面，并在播放器中看到 Yamal、Pedri 页面。公开播放器未观察到原生产稿的 Rodri 和 CTA 页，因此本文不把它们列为已发布脚本。
- 典型机制：比赛窗口 + 当天人物节点 + 球星 placements；用 slideshow 让用户滑到自己关心的人。

#### Slideshow 脚本

**Page 1**

```text
France vs Spain
Birthchart Reading
```

**Page 2 — Mbappé**

```text
Mbappé ♐☉ ♑☽
Sagittarius Sun. Capricorn Moon.

Jupiter-ruled fire sign = born for big stages.
But that Capricorn Moon is why he never
celebrates too early.
Ice in the veins. Arrow already released.
```

**Page 3 — Griezmann**

```text
Griezmann ♈☉ ♊☽
Aries Sun — born on the exact spring equinox.
Gemini Moon.

0° Aries = pure cardinal fire ignition.
Gemini Moon gives him the adaptability
to play every role the team needs.
The brain moves as fast as the feet.
```

**Page 4 — Olise**

```text
Olise ♐☉ ♏☽
Sagittarius Sun. Scorpio Moon.

Sag vision sees the pass no one else does.
Scorpio Moon adds obsessive intensity —
this is someone who doesn't just play,
he locks in.
```

**Page 5 — Lamine Yamal**

```text
Lamine Yamal ♋☉ ♋☽
Cancer Sun. Cancer Moon.

Turned 19 YESTERDAY.
World Cup semifinal the day after his birthday,
in his own Cancer season,
with a double-Cancer emotional engine.

This kid runs on instinct and belonging. 🔋
```

**Page 6 — Pedri**

```text
Pedri ♐☉ ♌☽
Sagittarius Sun. Leo Moon.

Sag Sun = sees the game three passes ahead.
Leo Moon = lives for the big-stage moment.
The quiet architect who wants the spotlight
when it actually matters.
```

#### 实际视觉设计

- 9:16 photo slideshow。封面是 France 蓝 / Spain 红黄对半的高饱和海报，Mbappé 与 Yamal 背靠背，占据画面下方约 70%；主标题白 / 金超粗体，副标题黑字白底。
- 人物页统一使用全屏比赛照片，不再使用原方案的“深色星空底 + 剪影”。球员主体保持清晰，国家 / 球衣颜色自然承担页间区分。
- 每页两级白色圆角文字卡：中部小卡放球员名、Sun / Moon 和彩色星座 emoji；下部大卡放 3–4 行解读。黑字、字号大、没有额外装饰。
- 人物照片承担情绪：Mbappé 为持球动作、Griezmann 为亲吻球衣、Olise 为庆祝手势、Yamal 为吼叫庆祝、Pedri 为带球。
- 实际页面文字密度比封面高，且下方部分文字会被 TikTok 账号 / caption UI 遮挡；后续复用应把正文整体上移约 10%–15%。
- 未观察到独立 CTA 页；互动 CTA 主要留在帖子 caption：`Which team do you pick?`

### 2.2 Messi × Yamal — 人物故事 + 星盘对照

- 发布链接：https://www.tiktok.com/@filestarsx/photo/7663333677438438686
- Sheet2：`591 views / 26 likes / 0 comments / 1 favorite / 0 shares`
- 原生产记录：[[inbox-pengman/04-production/07-content-production/2026-07-16 Messi × Yamal World Cup Final 内容生产记录]]
- 典型机制：先用跨 19 年的人物故事获得停留，再用“同太阳星座、不同星盘”提供占星层；不拿 placement 预测赛果。
- 实际核验：公开播放器确认共 5 页；已提取实际封面。其余页面公开图片资源本轮没有稳定加载，正文以生产记录中 Pengman 已确认的 `Claude-based compressed v2` 为准，不声称逐页视觉已全部复核。

#### 5 页发布脚本

**Page 1**

```text
MESSI × YAMAL
2007 → 2026 FINAL
```

**Page 2**

```text
A charity photo in 2007.
A World Cup final in 2026.

Both Cancer Suns ♋
Same sign. Different charts.
```

**Page 3 — Messi**

```text
MESSI ♋☀️

Cancer Sun — protective, memory-led leadership.
Reported Capricorn Rising — structure and mastery.

That Rising sign is provisional,
not firmly confirmed.
```

**Page 4 — Yamal**

```text
YAMAL ♋☀️

Cancer Mercury — communicates through instinct.
Mars in Taurus — steady, persistent drive.
Venus + Saturn in Leo — expression meets discipline.
```

**Page 5**

```text
Same Cancer Sun.
Different ways of carrying the moment.

Legacy meets arrival on July 19.
Who are you watching for? 🇦🇷 🇪🇸

Read both profiles via our bio.
```

#### 实际视觉设计

- 已核验封面：直接使用 2007 年 Messi 抱 baby Yamal 的竖版照片；人物占画面约 75%，保留 Messi 低头看婴儿的自然视线。
- 顶部右侧是 `♋ Astrology Reading` 白色栏目标签，背景为暗红；底部约 25% 使用黄色实心信息卡、暗红边框和暗红超粗体标题。
- 实际封面没有采用生产稿备选的 Argentina / Spain 细线或宇宙特效，重点完全放在真实人物关系和时间跨度。
- 公开播放器确认 5 页结构；Page 2–5 的设计按已确认生产记录执行：人物大图 + placement 标签，Messi / Yamal 分页，对比与 CTA 合并到最后一页。
- 待补证据：Page 2–5 的 TikTok 原图本轮未稳定加载，颜色、具体排版与生产记录是否存在发布后微调仍待后台或原图确认。

---

## 3. `@miraaastrology`：AI 占星师心理机制账号

### 3.1 Scorpio：Stopped Letting You In — 关系边界 Hook

- 发布链接：https://www.tiktok.com/@miraaastrology/video/7664501951190600973
- Sheet2：`736 views / 82 likes / 10 comments / 20 favorites / 6 shares`
- 原生产记录：[[inbox-pengman/04-production/07-content-production/2026-07-20 Scorpio Psychology AI口播 第三条 内容生产记录]]
- 实际成片：`720 × 1280`，约 `42.05s`；实际时长短于生产记录预估的 55–57 秒，但抽帧显示正文顺序与已确认稿一致。
- 典型机制：首帧完整关系冲突判断 → 三个生活化变化 → “inner circle / reclassify”概念命名 → 冷静短句收束；固定 AI 主播、深色背景、大字幕、无口播 CTA。

#### 已确认配音稿

```text
A Scorpio won't always tell you something changed. They'll just quietly move you to the outside.

They don't blow up. They don't give you the fight you're expecting. They just… stop giving you the version of them you used to get.

The late-night conversations get shorter. The things they used to share without thinking, they now keep to themselves. You're still in their life. But you're no longer in the inner circle.

And the hardest part? They won't explain it. Because in their mind, you already know what you did. And the fact that you're not addressing it is confirmation enough.

So they don't remove you. They just reclassify you. You went from someone who had full access… to someone who gets the surface.

And they'll be perfectly polite the entire time.
```

#### 实际视觉设计

- 固定 AI 女主播：黑色卷发、深灰 T-shirt，坐在深色播客桌前；右侧黑色电容麦克风进入画面。
- 暖色低照度录音棚：琥珀色台灯 / 烛光和背景散景，人物面部光柔和；全片保持同一中近景，无 B-roll、无星空或星座图。
- 主播通过视线、轻微前倾和手势制造节奏，镜头基本不切换，形成稳定账号识别。
- 烧录字幕位于下三分之一：白色粗体、黑色描边；当前关键词用红色矩形底 + 白字逐词强调，例如 `changed`、`inner circle`、`confirmation`、`reclassify`。
- 没有片头 logo、产品画面或口播 CTA；最后靠主播停顿和表情收束。

### 3.2 Scorpio：Tested You — 信任测试 Hook

- 发布链接：https://www.tiktok.com/@miraaastrology/video/7663472486893374734
- Sheet2：`426 views / 49 likes / 3 comments / 8 favorites / 5 shares`
- 原生产记录：[[inbox-pengman/04-production/07-content-production/2026-07-17 Scorpio Psychology AI口播 第二条 内容生产记录]]
- 实际成片：公开链接可提取为 `720 × 1280` MP4，约 `60.82s`；Sheet2 的 `photo` 类型为采集误判。
- 映射说明：原生产记录缺发布直链，但标题、Hook、发布时间、口播和成片均与本链接对应。
- 典型机制：反常识断言 → 三种可识别测试行为 → 从被测试者翻转到测试者 → Pluto 象征解释 → 无 CTA 收束。

#### 已确认配音稿

```text
Scorpio doesn't trust you until they've tested you. And you won't even know it's happening.

They'll say something provocative just to see how you react. They'll pull back to see if you stay. They'll share something vulnerable and watch what you do with it.

And if you think that sounds exhausting — imagine being the one who can't stop doing it.

For people with strong Scorpio placements, trust isn't given. It's built through evidence. They need to know — can this person handle the real me? Will they stay when it gets heavy?

It's not manipulation. It's closer to a survival instinct around intimacy. They've learned that openness without proof of safety tends to end badly.

This connects to Pluto — Scorpio's ruling planet. Pluto deals in trust and betrayal, vulnerability and control. It doesn't allow half-measures. You're either fully in or fully out.

So the testing isn't about power. It's about finding out if it's safe to stop protecting themselves.

But if you've felt tested by someone with heavy Scorpio energy — this might be what's underneath.
```

#### 实际视觉设计

- 与 `Stopped Letting You In` 使用同一 AI 女主播、黑色麦克风、暖色暗调播客棚和固定中近景，确保系列一致性。
- 服装变量改为砖红 / 铁锈红衬衫，背景和人物不变；这是两条视频最明显的视觉差异。
- 下三分之一烧录字幕保持白色粗体 + 黑描边；单个关键词以红底白字高亮，例如 `you`、`react`、`evidence`、`stay`、`survival instinct`、`badly`。
- 无 B-roll、星座图、Pluto 画面或产品 CTA；所有信息由主播表演、口播与逐词字幕承担。
- 60.82 秒版本比第三条更长，字幕密度更高，但视觉系统完全一致，可作为 AI 主播系列模板基准。

---

## 当前可复用的三种账号模板

| 账号 | 默认 Hook | 正文推进 | 默认形式 | CTA |
|---|---|---|---|---|
| `@astrologywiki` | 日期 + 天象异常点 | 天象事实 → 情绪问题 → 用户星盘落点 | 极简星空 / 月相 + 大字幕 | 查星盘或读完整 guide；纯 reach 测试可不放 |
| `@filestarsx` | 当天热点 + 明星人物张力 | 故事事实 → placements 对照 → 评论问题 | 5–6 页 photo slideshow；真实人物大图 + 白色圆角文字卡 | CTA 可放 caption 或最后一页，不预测输赢 |
| `@miraaastrology` | 完整的关系冲突判断 | 可识别行为 → 心理机制命名 → 占星象征 → 短句收束 | 固定 AI 女主播 + 暖暗播客棚 + 红色关键词字幕 | 当前 canary 默认无口播 CTA |

## 使用边界

- 这是“已发布高表现样本存档”，不是下一条内容可以逐句改写的模板库。
- 复用的是 Hook 结构、信息顺序、时长和视觉规则，不复制具体句子或把单条成绩当成稳定结论。
- 球员 Moon / Rising、宫位或出生时间不确定时，必须继续标注 `reported / provisional / unconfirmed`。
- `@miraaastrology` 的 Scorpio 系列表现优于账号内其他样本，但当前样本量仍不足以永久锁死单一星座题材。
