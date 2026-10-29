---
title: 拆解 · BL Drama Llamas 的社群运转方式与可学习点
date: 2026-10-21
status: teardown
scope: 基于公开元数据（Discord 公共 widget / 服务器发现页 / DBL / Deepcord），不含登录后频道内容
target: https://discord.com/channels/672425844798390273/673504300030492742
---

# BL Drama Llamas 拆解

> 说明：你给的那个频道 `673504300030492742` 不在公开 widget 的频道列表里，应该是登录后可见的讨论频道；我没有你的 Discord 登录态，读不到里面的消息。本文只基于公开可见的服务器信息、频道列表和榜单数据，**不是对频道内容的逐条观察**。

## 1. 公开数据快照

| 项目 | 数值 |
|------|------|
| 服务器名 | BL Drama Llamas |
| 建立时间 | 2020-01-30 |
| 成员数 | 6,262 |
| 当前在线 | 270–316（widget 显示 282 presence） |
| 近 7 天增长 | +15 人（Deepcord，10/11–10/18） |
| 在线率 | 约 4.3%–5.0% |
| 分类 | Books / Entertainment / Movies & TV |
| 语言 | English |
| 榜单 | Deepcord Books 类 #244 / 699；Entertainment 前 45% |
| 简介 | “A server for BL Lovers to come together, watch the latest episodes, read the latest books and bond over everything BL!” |

**先记住这个数字：6 年，6,262 人，每周 +15。** 这不是一个“六周起盘”的案例，是一个“长期在场”的案例。

## 2. 公开频道结构

Widget 只暴露 8 个公开频道：

| 频道 | 类型/用途 |
|------|-----------|
| Chitchat | 综合闲聊 |
| Chitchat#2 | 第二个闲聊频道（量大了之后克隆） |
| Music | 音乐/听歌 |
| More Music | 音乐扩容 |
| Even More Music! | 音乐再扩容 |
| Streamers | 直播/一起看 |
| Even More Streamers | 直播扩容 |
| AFK | 挂机 |

你给的那个频道不在这里，说明**真正的 BL 讨论/剧透/资源频道是登录后或身份组可见的**，公开层只留了“客厅”。

## 3. 从公开信息能看出的 8 件事

### 3.1 它是“BL 综合粉丝社区”，不是“一部剧的社群”

简介覆盖三件事：**看剧、看书、聊 BL**。这带来两个好处：

- 内容供给不依赖单部剧的更新周期；
- 成员身份是“BL 粉丝”，不是“某剧粉丝”，生命周期更长。

我们的试点是 1–2 部剧，风险是剧终/停更后仪式断掉。学习点：**至少把内容扩到“剧 + 原著/小说 + 同人/二创”**，不要只绑一部剧。

### 3.2 固定仪式：regular streaming sessions + regular news updates

公开简介明确写了：

- regular streaming sessions for the latest episodes；
- regular news updates for upcoming shows and controversial happenings；
- fan competitions；
- anime/manga reviews、fanfics、art。

这不是“有内容就发”，是**固定节奏的栏目化运营**。我们执行手册里的“更新日 Watch Party + 转化时刻”方向是对的，但还缺：

- 每周/每两天的“BL 新闻/更新速报”；
- 每月一次的低成本 fan competition（投票、二创征集、台词接龙）。

### 3.3 公开层是“客厅”，深度内容藏在身份组后面

公开频道是 Chitchat / Music / Streamers / AFK，**没有公开的剧透区、资源区、讨论区**。这说明他们很可能：

- 把剧透/资源/深度讨论放到登录后或角色门槛后；
- 公开层只负责“让人感觉这里有人、有氛围”。

学习点：我们的 #spoiler-corner 用身份组门槛是对的；但公开层不要全是“剧集讨论”，要留一个 **#chitchat / 客厅**，让不想聊剧的人也有地方待。

### 3.4 用“克隆频道”扩容，而不是把分类设计得很复杂

Chitchat → Chitchat#2；Music → More Music → Even More Music；Streamers → Even More Streamers。

这是很典型的“用量驱动结构”：一个频道刷得太快，就克隆一个，而不是一开始设计 20 个细分频道。

学习点：我们起手 7 个频道是对的；等 #chitchat 真的刷屏，再开第二个。**不要提前建一堆空频道。**

### 3.5 语音/直播/音乐是“氛围层”，不只是文字

Music、Streamers、AFK 这些频道说明：他们不只靠文字聊天，还靠**语音在场感**留人。音乐 bot、直播、挂机，都是“即使没人说话，这里也像有人”。

学习点：我们可以加一个 **Living Room 语音频道**（音乐/电台/挂机），但**不能整集转播**；看剧时用“各自在官方站看 + 语音讨论”的方式，避免版权风险。

### 3.6 他们的运营配置是“成熟社区”级别

从服务器 features 能看到：

```text
COMMUNITY · DISCOVERABLE · GUILD_ONBOARDING · GUILD_ONBOARDING_HAS_PROMPTS
GUILD_SERVER_GUIDE · WELCOME_SCREEN_ENABLED · AUTO_MODERATION
AGE_VERIFICATION_LARGE_GUILD · NEWS · THREADS_ENABLED
STAGE_CHANNEL_VIEWERS_150 · TEXT_IN_VOICE_ENABLED · SOUNDBOARD
ANIMATED_ICON · BANNER · INVITE_SPLASH · ROLE_ICONS
```

翻译成运营动作：

- **Server Guide + Onboarding prompts**：新人进来有引导，不是一片空白；
- **Age verification**：BL 内容可能涉及成熟题材，他们做了年龄门槛；
- **AutoMod**：有自动审核；
- **News 频道**：有专门的公告/新闻流；
- **Threads**：剧集讨论可以按 thread 开，不刷屏；
- **Stage 150 人**：可以办访谈/AMA/一起看；
- **Soundboard / 音乐/直播**：氛围工具；
- **Discoverable**：已经进了 Discord 官方发现页（需要 1,000+ 成员和留存）。

学习点：我们的 Onboarding 3 问、AutoMod、announcement 方向对；可以补 **Server Guide**、**News 频道**、**Stage 活动**。年龄门槛看我们的内容尺度：如果坚持 SFW，可以不做；如果放开成熟话题，必须做。

### 3.7 他们有“身份/梗”——llama cult

简介里直接写 “A llama cult ready to welcome you with open arms”。这是一个**社区身份**，不是品牌口号：

- 有吉祥物（llama）；
- 有内部梗（cult/family）；
- 有归属感（“you are one of us”）。

学习点：ShortsBinge BL Lounge 现在只是一个“品牌名 + 功能”，缺少可传播的社区身份。可以给社区一个**自己的名字/吉祥物/内部称呼**（不必复制 llama），让成员自我介绍时愿意说“我是 XX 的一员”。

### 3.8 增长很慢，但在线率健康

6,262 人、每周 +15（约 0.24%/周）、在线 270–316（4.3%–5%）。

这说明：

- 它不是靠一次活动爆起来的；
- 6,000 人是六年积累；
- 在线率 4%–5% 对大社区算健康，但也不是“天天沸腾”。

学习点：**不要用“六周做到几千人”做预期**。我们的试点目标是 30 个种子、100–150 人以内，先把激活/留存跑出来。

## 4. 可以直接学的 6 件事

| 学习点 | 我们的动作 |
|--------|------------|
| 内容不绑单剧 | 内容支柱扩到“剧 + 原著/小说 + 二创/同人” |
| 固定栏目 | 更新日 Watch Party + 每周新闻速报 + 每月 fan competition |
| 公开客厅 | 加 #chitchat，不要只做剧集讨论 |
| 身份组门槛 | 剧透/资源/深度讨论放角色后面 |
| 用量驱动扩容 | 先 7 个频道；刷屏了再克隆 |
| 氛围层 | Living Room 语音（音乐/挂机），不做整集转播 |

## 5. 不能照搬的 3 件事

1. **整集 streaming**：他们的 “regular streaming sessions” 如果涉及整集转播，我们不能复制；我们只做“官方链接 + 语音讨论/倒计时”。
2. **纯 hangout、无转化**：他们是 fan-run，不承担付费转化；我们必须保留“免费集结束 → 官方解锁”的转化时刻和追踪。
3. **六年时间尺度**：6,262 人是 2020 年至今的积累；六周试点只能验证“有没有可能”，不能复制规模。

## 6. 我们还缺什么（需要登录/内部观察）

你给的那个频道 `673504300030492742` 是登录后可见的。要真正学“怎么运转”，需要补 7 天的观察：

| 观察项 | 记录什么 |
|--------|----------|
| 频道列表 | 公开/身份组/私密各有哪些，命名逻辑 |
| 规则 | 盗版、剧透、NSFW、自我推广、DM 规则 |
| 欢迎流程 | 欢迎语、Onboarding 问题、默认角色、Server Guide |
| 日常节奏 | 每天多少条、什么时段、谁在说话 |
| 更新日 | 新集上线时怎么组织、用什么话术、有没有语音 |
| 剧透/资源 | 怎么分区、怎么处理盗版链接 |
| 转化 | 有没有官方链接/联盟链接/付费引导（大概率没有） |
| 管理 | Mod 数量、响应速度、处罚方式 |
| 活动 | 多久一次、什么形式、参与人数 |

**最省事的办法**：如果你在服务器里，发我几张截图——频道列表、规则页、Server Guide、`673504300030492742` 频道的日常一屏、更新日的一屏。我就能把“公开结构拆解”升级成“实际运营拆解”。

## 7. 对我们试点的直接调整

1. **频道**：加一个 `#chitchat`（客厅）；保留 `#episode-talk`、`#spoiler-corner`、`#fan-art`、`#watch-and-unlock`；不要提前加音乐/直播频道，等有需求再克隆。
2. **栏目**：更新日 Watch Party + 周中“BL 新闻/更新速报” + 每月一次 fan competition（投票/二创/台词接龙）。
3. **内容支柱**：剧集 + 原著/小说 + 二创；不要只绑 1–2 部剧。
4. **身份**：给社区一个可传播的名字/吉祥物/内部称呼；在欢迎语和自我介绍模板里用起来。
5. **配置**：补 Server Guide、Onboarding prompts、News 频道；如果内容尺度需要，加年龄门槛。
6. **预期**：W1 20–30 种子、W4 60–100 人；核心看激活率 ≥50%、首周留存 ≥25%，不看“几千人”。

## 8. 一句话

**BL Drama Llamas 值得学的是“运营系统”：综合 BL 内容、固定栏目、客厅+氛围、身份组门槛、六年持续在场。**  
**不值得学的是“规模”和“整集转播”**——前者是时间堆出来的，后者是版权红线。

## 数据出处

- Discord 公共 widget：`https://discord.com/api/guilds/672425844798390273/widget.json`
- Discord 服务器发现页：`https://discord.com/servers/bl-drama-llamas-672425844798390273`
- DiscordBotList：`https://discordbotlist.com/servers/bl-drama-llamas-672425844798390273`
- Deepcord：`https://www.deepcord.com/server/pgqvkv9kqa`
- 抓取时间：2026-10-21
