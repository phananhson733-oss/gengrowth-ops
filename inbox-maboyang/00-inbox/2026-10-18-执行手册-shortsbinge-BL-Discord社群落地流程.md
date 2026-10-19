---
title: 执行手册 · shortsbinge BL 题材 Discord 社群落地流程
date: 2026-10-18
status: ready-to-execute
version: v1.0
依据: 2026-10-16-方案-shortsbinge-BL题材Discord社群试点方案.md；2026-08-20 Discord 社区搭建与启动 SOP v2；2026-08-20 Discord 社区 0→1 建设与运营 SOP
范围: 从开工前确认到试点第 6 周复盘的可执行动作；不重复论证"要不要做"，策略判断以原方案为准
---

# 执行手册 · shortsbinge BL Discord 社群落地流程

> 这份手册只回答一个问题：**明天开始，谁在什么时候做什么。**
> 原方案负责"为什么做、做成什么样"，本文负责"怎么落地、怎么验收"。

## 0. 一页总览

| 项目 | 设定 |
|------|------|
| 服务器名 | `ShortsBinge BL Lounge`（品牌确认后定稿） |
| 定位一句话 | Watch free BL episodes together, talk ships, and unlock what's next. |
| 试点剧目 | 1–2 部数据验证过的高表现剧（`[剧 A]` / `[剧 B]`） |
| 试点周期 | 6 周：W1–W2 建社群，W3–W6 验转化 |
| 种子目标 | W1 20–30 人；W4 100–150 人（不买量、不硬拉） |
| 核心指标 | 24h 激活率、首周留存率、分销链接点击 |
| 人力投入 | 搭建 6–8 小时；日常 30–45 分钟/天；更新日 2 小时 |
| 预算 | 0（可选：短链工具 / 剪辑素材） |

**四个角色（先定人，再开工）**

| 角色 | 职责 | 投入 |
|------|------|------|
| Owner / Community Manager | 搭建、欢迎、内容、活动、周报 | 每天 30–45 分钟 |
| Backup Admin | 备用最高权限、Owner 不在时接管 | 每周检查一次 |
| Moderator（1–2 人） | 违规处理、剧透区、夜间覆盖 | 轮班，每天 15 分钟 |
| 商务 / 版权对接 | 分销参数、素材授权、专属码 | 按节点 |

> **第一条纪律：服务器必须由公司长期可控的账号持有。** 不用个人小号，不用临时邮箱；Owner 和 Backup Admin 都开 2FA 并保存恢复码。

---

## 1. 开工前必须确认的 5 件事（D-7 前）

这 5 件事里，只有 C1 是真正的 blocker；其余不确认也能先搭，但会影响后续验收。

| 编号 | 事项 | 为什么卡 | 负责人 | 截止 | 未确认时的降级方案 |
|------|------|----------|--------|------|--------------------|
| C1 | 分销链接能否带子渠道参数（`?ref=discord` / `sub_id` / 专属短链） | 决定社群带来的点击能否被单独归因 | 商务 | D-5 | 用独立短链统计点击 + 入群问卷自报，接受"只能看间接信号" |
| C2 | 试点剧目、免费集数量、更新节奏（周几/几点，时区） | 决定频道、活动、内容日历 | 内容 | D-6 | 先按最近一部在更剧搭，第二部留 thread |
| C3 | 剧照/海报/预告的使用授权范围 | 避免版权投诉 | 版权 | D-6 | 只发官方公开物料并标注来源，不二次剪辑 |
| C4 | 品牌账号、备用 Admin、公司邮箱 | 账号安全与交接 | Owner | D-5 | 先用现有品牌账号，24h 内补备用 Admin |
| C5 | 版权方是否愿意发社群专属码 | 加分项，不是前提 | 商务 | D-10 | 不做承诺，转化只靠"免费集结束"这个自然节点 |

**C1 的核实话术（发给商务/版权对接）**

```text
我们在做 Discord 社群试点，需要确认两件事：
1. 现在的分销链接是否支持加来源参数（例如 ?ref=discord 或 sub_id），
   让社群带来的点击/成交能和 TikTok、自然流量区分开？
2. 如果不支持，能否给我们一条社群专用短链或专属落地页，用来单独统计？
这决定我们能不能证明社群对付费转化的价值，麻烦帮忙确认，谢谢。
```

> 若 C1 确认"不支持"：试点照做，但第 6 周的结论只能写成"社群活跃 + 点击趋势"，不能写成"带来 X 笔付费"。不要编数据。

---

## 2. 服务器搭建（D-6 ~ D-5，约 90 分钟）

### 2.1 基础设置

按顺序做，路径以当前客户端为准：

1. Mac 端 Discord 登录公司账号 → 左侧 `+` → **Create My Own** → 选 Community/Club；
2. 名称 `ShortsBinge BL Lounge`，上传 Logo；
3. **Server Settings → Overview**：简介填定位一句话，默认通知选 Only @mentions；
4. **Server Settings → Safety Setup**：开启 2FA 要求（Administrators）；
5. **Server Settings → Community**：开启 Community（Onboarding、Announcement、AutoMod 都依赖它）；
6. **Server Settings → Roles**：先建角色，再建频道（顺序反了会反复改权限）。

### 2.2 频道结构：7 个公开频道 + 1 个私密频道 + 1 个语音

不要建几十个频道，也不要按集数建频道；**剧集讨论用 thread**。

```text
📌 START HERE
├── #welcome-rules        只读：欢迎 + 规则 + 导航
└── #announcements        只读：更新、活动、维护通知

💬 THE LOUNGE
├── #introductions        自我介绍
└── #episode-talk         剧集讨论（每集开一个 thread）

🎬 SHOWS
├── #spoiler-corner       剧透区（需身份组）
└── #fan-art              同人图 / 二创（慢速模式）

🔗 WATCH & UNLOCK
└── #watch-and-unlock     只读：免费集入口 + 付费集分销入口 + FAQ

🔒 STAFF（私密）
└── #staff-ops            举报、违规、运营记录

🔊 VOICE
└── Watch Party           同步观看时的语音讨论（不转播画面）
```

| 频道 | 类型 | 用途 | 谁能发 |
|------|------|------|--------|
| #welcome-rules | 文字 | 欢迎、规则、导航 | 仅 Owner/Admin |
| #announcements | 公告 | 更新、活动、维护 | 仅 Owner/Admin |
| #introductions | 文字 | 新人介绍 | 所有人 |
| #episode-talk | 文字 | 每集一个 thread | 所有人 |
| #spoiler-corner | 文字 | 剧透讨论 | 仅 `Spoiler OK` |
| #fan-art | 文字 | 同人图、二创 | 所有人（60s 慢速） |
| #watch-and-unlock | 文字 | 官方观看/解锁入口 | 仅 Owner/Admin |
| #staff-ops | 文字 | 内部运营 | 仅 Mod/Admin |

**thread 命名规范**：`S01E05 · [剧 A] · 讨论`。更新日由值班人开 thread，首楼放一句讨论引子。

### 2.3 角色与权限

只建必要角色，别一上来做十层权限：

| 角色 | 颜色 | 权限要点 | 怎么获得 |
|------|------|----------|----------|
| `@everyone` | — | 看公开频道；不能发 #welcome-rules / #announcements / #watch-and-unlock | 默认 |
| `Spoiler OK` | 灰 | 额外可见 #spoiler-corner | Onboarding 第 3 问 |
| `Creator` | 紫 | 可在 #fan-art 发图；可申请 | 手动/申请 |
| `Moderator` | 蓝 | 删消息、禁言、管理 thread | 手动 |
| `Admin` | 红 | 管理服务器（1–2 人） | 手动 |
| `Bot` | — | 只给必要权限，不给 Administrator | 手动 |
| `源：TikTok / 站内 / 朋友` | 各自 | 仅用于统计，无额外权限 | Onboarding 第 1 问 |
| `剧：[剧 A] / [剧 B]` | 各自 | 仅用于身份与通知 | Onboarding 第 2 问 |

**权限矩阵（在分类上设置，频道继承）**

| 频道 | @everyone | Spoiler OK | Creator | Mod/Admin |
|------|-----------|------------|---------|-----------|
| #welcome-rules | 查看 | 查看 | 查看 | 管理 |
| #announcements | 查看 | 查看 | 查看 | 发言/管理 |
| #introductions | 查看/发言 | 查看/发言 | 查看/发言 | 管理 |
| #episode-talk | 查看/发言/建 thread | 查看/发言 | 查看/发言 | 管理 |
| #spoiler-corner | **禁止查看** | 查看/发言 | 查看/发言 | 管理 |
| #fan-art | 查看/发言 | 查看/发言 | 查看/发言 | 管理 |
| #watch-and-unlock | 查看 | 查看 | 查看 | 发言/管理 |
| #staff-ops | **禁止查看** | **禁止查看** | **禁止查看** | 查看/发言 |

设置完必须用**普通测试账号**确认：看不到 #staff-ops、看不到 #spoiler-corner、不能在 #watch-and-unlock 发言。

### 2.4 Onboarding：3 个问题，别多

**Server Settings → Onboarding**：

| 问题 | 选项 | 绑定角色 |
|------|------|----------|
| How did you find us? | TikTok / shortsbinge.com / A friend / Other | 源：TikTok / 站内 / 朋友 |
| Which show are you here for? | [剧 A] / [剧 B] / Both | 剧：[剧 A] / [剧 B] |
| Do you want spoilers? | Yes, I'm caught up / No spoilers please | Spoiler OK |

- 欢迎屏标题：`ShortsBinge BL Lounge`
- 描述：`Watch free episodes together, talk ships, and unlock what's next.`
- 默认频道：`#welcome-rules`、`#announcements`、`#introductions`
- 不要超过 3 问；不要在 Onboarding 里问邮箱、年龄、性别。

### 2.5 AutoMod 与安全

在 **Server Settings → Safety Setup / AutoMod** 开启：

- [ ] 屏蔽 Discord 邀请链接（本服务器除外）；
- [ ] 屏蔽常见盗版域与网盘域名（`mega.nz`、`drive.google.com`、`dailymotion.com` 等，按实际补充）；
- [ ] 屏蔽"full episode / free unlock / download"类关键词，命中后进 #staff-ops 审核；
- [ ] 开启 Mention Spam、Spam Content、Slurs/Profanity 预设；
- [ ] 开启 DM 扫描?（可选，不做强依赖）；
- [ ] 管理员 2FA 要求；
- [ ] 举报入口指向 #staff-ops 或 Mod DM。

> AutoMod 只是第一道网；**盗版零容忍**，见第 10 节。

---

## 3. 公开文案（可直接粘贴）

### 3.1 #welcome-rules 首帖

```text
Welcome to the ShortsBinge BL Lounge 🎬

We watch free BL episodes together, talk ships, and count down to the
moments we can't stop thinking about.

Start here:
1. Read the rules below.
2. Pick your roles in #introductions — tell us which show brought you here.
3. Say hi and jump into #episode-talk.

Free episodes stream on shortsbinge.com. Paid episodes live on our
partner's app — the official links are always in #watch-and-unlock.

Be kind. No spoilers outside #spoiler-corner. No piracy. That's it.
```

### 3.2 规则（置顶 + 规则频道同文）

```text
1. Be decent. No harassment, hate, or personal attacks — ships are fun,
   people are not targets.

2. No piracy. No episode clips, full episodes, screen recordings,
   download links, mirrors, or "where can I watch free" requests.
   Only official links from the staff are allowed.

3. SFW only. No explicit content, nudity, or 18+ material.

4. Spoilers stay in #spoiler-corner. Mention the episode number in the
   first line, and keep titles spoiler-free.

5. No spam, ads, self-promo, or unsolicited DMs. Ask a mod before
   sharing anything promotional.

6. Official links only. Free episodes: shortsbinge.com. Paid episodes:
   the partner links in #watch-and-unlock. Do not share alternative
   "unlock methods" — they break the rules and can get the server shut down.

7. Keep personal info private. Don't post addresses, phone numbers,
   or anyone's private messages.

8. Mods have the final call. Warning → mute → ban. Appeals go to
   #staff-ops via DM.

By staying, you agree to follow these rules and Discord's Terms.
```

### 3.3 #watch-and-unlock 置顶三条

**Pin 1 — 免费集入口**

```text
▶ START HERE — Free episodes

Watch the free episodes on shortsbinge.com:
[official link + tracking parameter]

New episode drops: [day/time, timezone]
```

**Pin 2 — 付费集入口**

```text
🔓 Unlock the next episodes

Paid episodes are hosted by our licensing partner, not on ShortsBinge.
Unlock here: [distribution link + sub-id]

Heads up: this is a paid unlock on the partner's app. We don't host
or process the payment.
```

**Pin 3 — FAQ**

```text
Why does it leave ShortsBinge?
Paid episodes are distributed by our partner. The link above is the
official route — using it supports the shows you love.

Is there a discount code?
[有就写；没有就写 "Not right now — we'll announce it here first if one drops."]

Can I share the link?
Share the official link, not screen recordings or re-uploads.
```

### 3.4 #introductions 引导帖

```text
Say hi 👋

Tell us:
• Which show brought you here?
• Who's your favorite character — and why?
• One scene you can't stop thinking about?

No spoilers outside #spoiler-corner, please.
```

### 3.5 #spoiler-corner 引导

```text
Spoiler zone ⚠️

Only for members who are caught up. Start every post with:
[Show] S01E05 — spoilers

Keep thread titles vague. If someone asks for no spoilers, respect it.
```

---

## 4. 内容预埋（D-3 ~ D-1）

**邀请任何人之前，先让服务器看起来"有人住"。** 目标：15+ 条真实消息、3 个 thread、1 个 poll、2 条 fan-art 引子。

| 时间 | 频道 | 内容 | 目的 |
|------|------|------|------|
| D-3 | #welcome-rules | 欢迎帖 + 规则置顶 | 合规基线 |
| D-3 | #watch-and-unlock | 三条置顶（免费/付费/FAQ） | 转化路径 |
| D-3 | #introductions | 运营者自己的示例介绍 | 降低发言门槛 |
| D-2 | #episode-talk | `S01E01 · [剧 A] · 讨论` thread + 引子 | 教会用法 |
| D-2 | #episode-talk | `S01E01 · [剧 B] · 讨论` thread + 引子 | 同上 |
| D-2 | #episode-talk | Poll：`Which duo lives rent-free in your head?` | 激活 |
| D-1 | #fan-art | 官方剧照 2 张（标注来源）+ "share your edits" | 内容密度 |
| D-1 | #announcements | 开服预告 + 首场 Watch Party 时间 | 仪式感 |
| D-1 | #spoiler-corner | 一条示例剧透（打码/标注） | 教会分区 |

**预埋内容的三条标准**

1. 每条都像真人说话，不像运营公告；
2. 每条都留一个"可接的话头"（问句、二选一、求推荐）；
3. 不刷屏：每天 3–5 条，分散在不同时段。

---

## 5. 种子成员（D0 ~ D+7）

### 5.1 来源优先级

1. **TikTok 高互动评论/点赞用户**（已验证的高意愿人群，最优先）；
2. **站内 BL 剧目老用户 / 高频访问者**（有数据就筛，没有就放弹窗）；
3. **KOC / 同人作者 / 朋友**（愿意帮你暖场的人）。

> 原则：**先提供价值，再邀请；说明理由，允许忽略。** 不群发、不买粉、不拉无关的人凑数。

### 5.2 邀请链接：一条渠道一条，别用通用链接

**Server Settings → Invites → Create Invite**，建议 5 条：

| 标签 | 投放在哪 | 建议设置 | 用途 |
|------|----------|----------|------|
| `tiktok-bio` | TikTok 主页简介 | 永不过期 | 长期入口 |
| `tiktok-comment` | 评论区回复/置顶 | 30 天 | 内容引流 |
| `site-popup` | shortsbinge 站内弹窗 | 永不过期 | 站内转化 |
| `email` | 老用户邮件 | 30 天 | 唤醒 |
| `koc-dm` | 一对一私信 | 7 天 / 50 次 | 种子邀请 |

记录每个 code 的 `invite_source`；每周在 Discord Invites 页面抄一次"uses"。

### 5.3 私信 / 评论 / 邮件脚本

**TikTok 评论回复（公开、短）**

```text
We just opened a small Discord for [剧 A] fans — free-episode watch
parties and ship talk. Want the link?
```

**TikTok 私信（一对一，先问再发）**

```text
Hey! Saw your comment on the [剧 A] edit — that scene wrecked me too 😭

We're putting together a small Discord for BL drama fans: free-episode
watch parties, episode threads, and fan art. No spam, no leaks.

Want me to send the invite?
```

**邮件（站内老用户）**

```text
Subject: A small Discord for [剧 A] fans

Hi [Name],

You've been watching [剧 A] on ShortsBinge — thank you.

We just opened a small Discord community for BL drama fans:
• watch free episodes together on drop day
• episode threads and ship talk
• fan art and recommendations

If you'd like to join: [invite link]

No pressure — you can leave anytime.
```

### 5.4 站内入口

- 位置：免费集播放页结束卡 / 剧目详情页 / 站内弹窗（不要首页首屏强推）；
- 文案：`Finished the free episodes? Join the community to talk ships and catch the next drop.`；
- 链接：`site-popup` invite；
- 频率：每个用户每天最多一次。

### 5.5 禁止事项

- ❌ 批量 DM 陌生人、复制粘贴同一句话；
- ❌ 在别人的 Discord/群组里发邀请；
- ❌ 用"免费解锁付费集"当诱饵；
- ❌ 买成员、买互动；
- ❌ 未经同意把用户拉进服务器。

---

## 6. 上线日 Runbook（D0）

| 时间 | 动作 | 负责人 | 验收 |
|------|------|--------|------|
| T-2h | 测试账号复查权限；检查 3 条置顶；测试所有链接 | Owner | 无 403/404 |
| T-0 | 发 #announcements 开服帖；TikTok 简介挂 `tiktok-bio`；置顶评论 | Owner | 链接可点 |
| T+0 | 站内弹窗上线（如已排期） | 前端 | 有曝光 |
| T+0~2h | 每来一个人，引用其介绍手动欢迎 | Owner | 24h 内回复率 100% |
| T+2h | 发第一条 poll（"你为哪部剧来的？"） | Owner | ≥3 票 |
| T+6h | 看激活率；沉默的新人私信一句"需要推荐从哪集开始吗" | Owner | 记录 |
| T+24h | 第一场 Watch Party（见 6.1） | Owner + Mod | ≥5 人进语音 |

### 6.1 首场 Watch Party（30–40 分钟）

**红线：不共享屏幕播放剧集，不转播、不录屏。** 语音频道只用于倒计时和讨论，大家各自在 shortsbinge 看。

```text
T-10 min  语音频道开房，文字频道发倒计时
T-5 min   说明流程：一起点播放，结束后回语音聊 10 分钟
T-0       发"开始"；大家在 shortsbinge 看免费集
T+片长    回语音讨论：最喜欢的一场戏 / 最想吐槽的一句台词
T+片长+10 转化时刻（见 7.3），然后散场
```

**首场目标不是人多，是跑通流程**：有人进语音、有人发言、链接有人点。

---

## 7. 首 4 周运营节奏

### 7.1 每周模板

| 时间 | 内容 | 频道 | 目标 |
|------|------|------|------|
| 更新日 T-1 | 预告 + 倒计时 + poll | #announcements / #episode-talk | 召回 |
| 更新日 T-0 | 同步观看 + 直播 thread + 转化时刻 | 语音 / #episode-talk / #watch-and-unlock | 核心仪式 |
| 更新日 T+1 | "昨晚那集"讨论 + 最佳台词 | #episode-talk | 二次激活 |
| 周中 | 角色 poll / 二选一 / 冷知识 | #episode-talk | 维持活跃 |
| 周末 | fan-art 征集 / 推荐接龙 | #fan-art | 内容供给 |
| 每天 | 欢迎所有新人、回所有问题、抛一个话题 | 全站 | 留存 |

**更新日是最重要的固定仪式**：时间一旦定下，不要随意改。成员会记住"周几几点有得聊"。

### 7.2 转化时刻脚本（免费集结束后的 10 分钟）

**三步：信号 → 入口 → 社会证明。**

```text
1) 信号（免费集刚结束，情绪最高点）
"That ending 😳 Episode [N] picks up right there."

2) 入口（明确、唯一、可追踪）
"Paid episodes are on [Partner App] — official unlock link is pinned
in #watch-and-unlock: [link]"

3) 社会证明（降低犹豫，不造假）
"I'm unlocking now — drop a 🔥 in #episode-talk when you're in."
```

**执行细节**

- 链接置顶在 #watch-and-unlock，不在聊天里反复刷；
- 15 分钟后补一句："Still thinking? The next episode is where [不剧透的钩子]."
- 不承诺"免费解锁"、不虚构折扣、不制造假倒计时；
- 每次转化时刻记录：在线人数、链接点击（短链后台）、🔥 数。

### 7.3 每日 30 分钟清单

- [ ] 欢迎所有新成员，引用他们的介绍回一句（不要只发 Welcome）；
- [ ] 回所有 @ 和 DM；
- [ ] 在 #episode-talk 抛一个轻问题；
- [ ] 检查 #staff-ops 举报与 AutoMod 命中；
- [ ] 记录当天新增、发言人数、链接点击。

---

## 8. 指标与复盘

### 8.1 漏斗定义

```text
邀请链接点击 → 加入 → 24h 内首次发言/互动（激活）
→ 第 7 天仍活跃（首周留存）→ 点分销链接 → 付费解锁（若可追踪）
```

| 指标 | 公式 | 数据源 | 备注 |
|------|------|--------|------|
| 加入数 | 各 invite 的 uses 之和 | Discord → Invites | 按来源分开记 |
| 激活率 | 24h 内发过消息的新成员 / 加入数 | 人工抽查 + Bot/Insights | Discord 无逐人明细时，用"频道发言人数"估算并标注 |
| 首周留存 | 加入后第 7–13 天发过消息的人 / 同批加入数 | 人工 cohort 表 | 每周固定一天回看 |
| DAU / MAU | 日活 / 月活 | Server Insights | 看趋势，不看单日 |
| 链接点击 | 短链后台 clicks | Bitly/GA | 必须独立短链 |
| 解锁/付费 | partner 后台 / sub-id | 商务 | C1 不成立时只能看点击 |

> 目标值先当**假设**，跑两周后用自己的 baseline 修正：
> 激活率 ≥ 50%；首周留存 25–30%（原方案：<20% 偏低，30–40% 健康）；链接点击率 ≥ 15% 活跃成员。

### 8.2 周报表（每周一填）

| 字段 | 说明 |
|------|------|
| week | W1 / W2 … |
| joins_tiktok / site / email / koc | 分来源加入 |
| activation_24h | 激活人数 / 加入数 |
| w1_retention | 同批 cohort |
| dau / mau | Server Insights |
| messages | 总消息数、非团队发言人数 |
| link_clicks | 短链后台 |
| unlocks | 有则填，没有写 N/A |
| mod_actions | 警告/删除/禁言次数 |
| notes | 本周发生了什么、下周改什么 |

### 8.3 判定线与决策门

| 时间 | 看什么 | 判定 | 动作 |
|------|--------|------|------|
| D+14 | 激活率 | < 35% | 先修 onboarding：频道再减、欢迎语更具体、对沉默新人一对一私信；暂停扩量 |
| D+14 | 首周留存 | < 20% | 加固定活动频率；检查新人进来是否 24h 内被回应 |
| D+28 | 首周留存 | 20–30% | 保持节奏，微调内容；不急着加频道 |
| D+28 | 首周留存 | ≥ 30% | 可以开始小规模扩量（TikTok 评论区常态化入口） |
| D+42 | 留存 + 点击 + 人力 | 留存 ≥25%、点击趋势向上、Mod 每天 <1h | 继续，评估扩到更多剧目 |
| D+42 | 任一不达标 | 留存 <20% 或 点击无趋势 或 人力扛不住 | 缩减为"1 部剧 + 1 个更新日活动"，或停 |

**不要用"入群人数"做唯一判断。** 人涨得快但激活低，说明在硬拉人头。

---

## 9. 第 6 周复盘模板

```text
一、数字
- 加入 / 激活 / 首周留存 / DAU / 链接点击 / 解锁
- 分来源：TikTok / 站内 / 邮件 / KOC

二、发生了什么
- 最活跃的 3 个帖子/活动
- 新人最常问的 3 个问题
- 最常被点的链接

三、没成立的部分
- 哪个假设错了（来源、时间、话术、频道结构）
- 哪些是执行问题，哪些是平台/版权约束

四、结论
- 继续 / 缩量 / 停止
- 如果继续：下一步只改 1–2 件事，不全面翻新

五、证据
- 截图、原话、链接点击、partner 数据（如有）
```

---

## 10. 风险与合规红线

| 风险 | 红线 | 处理 |
|------|------|------|
| 盗版 | 不发片段、全集、录屏、网盘、镜像；不共享屏幕播剧 | AutoMod + 人工审核；首次警告，二次禁言，三次封禁 |
| 版权 | 只用官方公开物料，标注来源；不二次剪辑传播 | 版权确认后再发；收到投诉立即下架 |
| 内容分级 | SFW；无露骨/成人内容 | 违规即删；屡犯封禁 |
| 年龄 | Discord 最低 13 岁；不收集年龄/身份信息 | 不做年龄问卷 |
| 隐私 | 不收集邮箱/地址/电话；不公开私信 | 违规删除 |
| 伙伴关系 | 不承诺折扣、不贬低版权方、不暗示绕过付费 | 统一话术，商务确认后发布 |
| 账号安全 | Owner/Admin 2FA；备用 Admin；恢复码离线保存 | 每月检查权限 |
| 归因 | 没有数据就说没有，不编转化 | 复盘只写可验证指标 |

**升级路径**：Mod 处理 → 争议/合作问题交 Owner → 涉及版权/法务交商务/法务。所有处理记录在 #staff-ops。

---

## 11. 交付清单

### D-7 ~ D-5：准备

- [ ] C1 分销参数已问、有明确答复（或降级方案）
- [ ] 试点剧目与更新时间确定
- [ ] 品牌账号、备用 Admin、2FA 就绪
- [ ] 剧照授权范围确认

### D-3 ~ D-1：搭建与预埋

- [ ] 服务器、频道、角色、权限完成
- [ ] Onboarding 3 问配置完成
- [ ] AutoMod 规则开启
- [ ] #welcome-rules / #announcements / #watch-and-unlock 三条置顶发布
- [ ] #introductions 示例、2 个剧集 thread、1 个 poll、2 张剧照
- [ ] 5 条邀请链接创建并记录
- [ ] 普通测试账号验收：看不到私密频道、不能在只读频道发言
- [ ] 手机端复查一遍

### D0：上线

- [ ] 公告发布
- [ ] TikTok 简介/评论、站内弹窗上线
- [ ] 前 20 人人工欢迎
- [ ] 首场 Watch Party 完成
- [ ] 当天数据记录

### W1 ~ W6：运营

- [ ] 每周固定更新日仪式
- [ ] 每周一填周报
- [ ] D+14 / D+28 / D+42 三次判定
- [ ] 第 6 周复盘文档

---

## 12. 如果只有 3 天

优先级从高到低，砍掉一切非必要：

1. **Day 1**：建服务器 → 7 个频道 → 权限 → 2 条置顶（欢迎/规则 + 观看入口）；
2. **Day 2**：写 3 条种子内容 + 2 个 thread + 1 个 poll → 建 3 条邀请链接 → 测试账号验收；
3. **Day 3**：邀请 10–15 个 TikTok 高互动用户 → 人工欢迎 → 当晚首场 Watch Party。

暂缓：AutoMod 精细规则、fan-art 区、专属码、邮件、KOC 扩量。**先跑通"进来有人理、更新日有活动、链接有人点"这条最小闭环。**

---

## 13. 附：英文模板速查

| 场景 | 一句话 |
|------|--------|
| 欢迎 | Welcome! Which show brought you here? |
| 引导发言 | Drop your favorite scene in #episode-talk — spoiler-free titles, please. |
| 更新预告 | New episode drops [day] at [time]. Watch Party in voice 10 minutes before. |
| 转化 | Paid episodes are on [Partner App] — official link pinned in #watch-and-unlock. |
| 催激活 | Haven't jumped in yet? Tell us your favorite character — we'll recommend an episode. |
| 处理剧透 | Heads up: that's a spoiler. Please move it to #spoiler-corner with the episode tag. |
| 处理盗版 | We can't allow clips or re-uploads here — official links only. Thanks for understanding. |
| 结束语 | That's a wrap for tonight. Next drop: [day]. See you in #episode-talk. |

---

## 14. 与原方案/SOP 的关系

- 策略、盈利模式、冷启动判断、追踪前提：以 `2026-10-16-方案-shortsbinge-BL题材Discord社群试点方案.md` 为准；
- 通用搭建步骤、权限、安全、SLA：沿用 `2026-08-20-gengrowth-discord社区搭建与启动SOP-v2.md`；
- 本文只补 BL 题材与 shortsbinge 商业模式下的**执行差异**：免费集站内 / 付费集跳转、TikTok 种子、转化时刻、归因限制。

> Discord 界面名称可能随客户端版本变化；本文按 2026-10 的常见路径写，找不到时以实际菜单为准。
