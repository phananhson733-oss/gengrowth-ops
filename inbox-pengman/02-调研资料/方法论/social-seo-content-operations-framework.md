---
title: 通用社媒 SEO 内容运营 SOP
project: reusable-social-seo
product_case: AstrologyWiki
type: operations-sop
status: draft
owner: Pengman
updated: 2026-07-16
sources:
  - inbox-pengman/02-调研资料/历史流程/astrologywiki-social-content-workflow.md
  - inbox-pengman/04-production/00-evergreen-workflows/weekly-rolling-content-production-sop.md
  - inbox-pengman/04-production/00-evergreen-workflows/ai-short-video-production-workflow.md
  - inbox-pengman/04-production/00-evergreen-workflows/instagram-image-content-workflow.md
  - inbox-pengman/04-production/00-evergreen-workflows/social-account-warmup-and-launch-workflow.md
  - inbox-pengman/02-调研资料/平台与策略/content-direction-and-tools-research.md
  - inbox-pengman/04-production/00-evergreen-workflows/AstrologyWiki 社媒账号定位与内容路由 Playbook.md
  - inbox-pengman/02-调研资料/竞品研究/reference-accounts.md
  - inbox-pengman/02-调研资料/竞品研究/astrology-short-video-format-analysis.md
  - inbox-pengman/07-reports/
  - inbox-pengman/02-调研资料/候选与热点研究/
  - Google Sheet: social robot account_analysis / video_analysis
---

> **历史证据 / 方法论底稿，不作为当前执行入口**；当前规则以 AGENTS、滚动周 SOP、当前周计划和单条主生产记录为准。

# 通用社媒 SEO 内容运营 SOP

> 这份 SOP 用来描述一个产品从 0 到 1 建立站外社媒内容体系的完整流程。  
> 它不是只给 AstrologyWiki 使用，但当前案例和落地细节以 AstrologyWiki 为主。  
> 核心目标不是泛泛涨粉，而是为优先变现产品获取 qualified reach，保障 social→工具使用/注册/购买的转化路径，贡献 assisted qualified UV，并把增长实验沉淀为可复用 SOP。SEO/文章发现是承接路径，PV 只作页面与产品诊断。
>
> 鱼骨流程索引：[[inbox-pengman/02-调研资料/历史流程/social-seo-fishbone-map.md]]

---

## 0. 一句话框架

```text
了解产品
→ 调研产品 / 竞品 / 竞品社媒 / 领域内容
→ 选择平台、账号矩阵、人设、风格和频率
→ 用账号链接 / 视频链接沉淀可复用内容机制
→ 生成内容生产 skill / SOP / 模板
→ 生产图文 / 视频并发布
→ 抓取数据、复盘、回流到下一轮选题和 SEO
```

社媒 SEO 的关键不是“把站内文章复制到社媒”，而是：

```text
用户真实兴趣 / 平台高互动表达
→ 翻译成适合社媒的 Hook 和内容形式
→ 承接到产品页面、工具页、文章页或主题集群
→ 用平台数据反推哪些关键词、角度、问题值得继续做 SEO 或内容扩展
```

---

## 1. 适用范围

适用于以下场景：

- 新产品需要建立 TikTok / YouTube Shorts / Instagram / X / Pinterest 等站外内容渠道。
- 产品已有 SEO、内容页或工具页，希望用社媒内容获取 qualified reach、带来 assisted qualified UV，并验证工具使用、注册或购买。
- 需要调研竞品账号和爆款视频，并把它们转成可执行的内容模板。
- 需要多账号矩阵：官方号、专家/AI 人设号、热点号、普通创作者/测试号等。
- 需要把人工调研、AI 总结、Google Sheet、飞书机器人、Codex skill 串成可复用工作流。

不适用于：

- 纯品牌广告投放策略。
- 纯达人商务合作管理。
- 只追求粉丝数、播放量、站外声量，而不关心产品承接和内容回流的社媒运营。

---

## 2. 角色与产出物

### 2.1 Pengman / 内容运营负责人

负责：

- 明确产品目标和阶段优先级。
- 判断哪些平台、账号、人设、内容形式值得测试。
- 筛选竞品账号和视频链接，输入给飞书 social 机器人。
- 审核 AI 产出的账号分析、视频拆解、内容模板和发布文案。
- 记录发布结果，推动复盘和下一轮测试。

### 2.2 AI / Codex / 内容助手

负责：

- 读取已有产品资料、SEO 资料、竞品调研、发布记录和数据复盘。
- 总结产品定位、内容方向、平台适配、账号矩阵和生产流程。
- 生成每日选题、脚本、图文方案、Canva prompt、短视频结构、X 文案等。
- 根据数据复盘更新 SOP、skill、模板和选题库。

### 2.3 飞书 social 机器人

负责把外部账号链接和视频链接结构化入库，并给出可执行拆解。

当前数据记录位置：

```text
Google Sheet:
https://docs.google.com/spreadsheets/d/1zJJqSxRxRH9s5PeiT25RP4sRgXpl3tKqfB5nSdrU0bA/edit

主要表：
- account_analysis
- video_analysis
```

所有抓不到的数据必须标为 `待补数据 / 待确认`，不要猜测或编造。

---

## 3. Stage 1：了解产品本身

### 3.1 目标

先弄清楚产品是什么、解决谁的问题、当前增长目标是什么，再决定社媒内容怎么做。

社媒内容必须回答：

```text
这条内容能怎样帮助用户理解产品？
这条内容能怎样支持搜索需求、页面访问、工具使用或内容发现？
这条内容产出的评论 / 收藏 / 点击能怎样反哺下一轮内容或 SEO？
```

### 3.2 必读信息

每个新产品至少整理以下信息：

| 字段                  | 说明                      |
| ------------------- | ----------------------- |
| Product             | 产品名称、URL、核心功能           |
| Audience            | 目标用户、地区、语言、使用场景         |
| Core value          | 用户为什么需要这个产品             |
| SEO assets          | 已有文章、工具页、专题页、关键词表       |
| Conversion assets   | 可承接的页面、工具、注册入口、短链       |
| Brand boundary      | 可以怎么说、不能怎么说             |
| Current growth goal | reach、assisted qualified UV、social→工具使用/注册/购买、增长点探索与 SOP 沉淀 |

### 3.3 AstrologyWiki 当前案例

AstrologyWiki 当前社媒内容不是泛星座娱乐号，核心是支持：

- AstrologyWiki 文章发现。
- Birth chart / transit / astrology calendar 等工具使用。
- 美国目标用户 qualified UV 增长。
- 用户真实问题和平台表达回流到 SEO。
- 现代、解释型、心理学、自我认知、grounded in real astronomy 的品牌边界。

当前不建议：

- 把 AstrologyWiki 做成宿命预测号。
- 每条内容都硬导流。
- 只追播放量，不记录能否承接到站内页面。
- 直接照搬 tarot、oracle、crypto、财富暗示、强预测类账号打法。

---

## 4. Stage 2：调研产品、竞品和平台内容

### 4.1 调研目标

调研不是为了堆资料，而是为了回答 5 个问题：

1. 用户在平台上已经为什么内容停留、点赞、评论、收藏？
2. 竞品账号靠什么内容机制获得互动？
3. 哪些机制可借鉴，哪些只是账号历史、真人 IP、投放或素材版权带来的结果？
4. 这些机制能否改写成适合本产品的 Hook、结构和 CTA？
5. 这些内容能否承接到产品页、工具页、文章页或 SEO 主题？

### 4.2 调研对象

至少包括四类：

| 类型     | 例子                                              | 目的                |
| ------ | ----------------------------------------------- | ----------------- |
| 产品竞品   | 同类工具、同类 App、同类网站                                | 看产品卖点、承接路径和品牌表达   |
| 竞品社媒账号 | TikTok / YouTube / X / Instagram / Pinterest 账号 | 看账号定位、栏目、爆款结构     |
| 领域内容账号 | 不一定是直接竞品，但在同领域有高互动                              | 学 Hook、画面、节奏、用户语言 |
| 平台原生内容 | 热门话题、搜索结果、推荐流、评论区                               | 学平台语境和真实用户表达      |

### 4.3 调研方法

当前建议组合：

```text
人工搜索筛选
+ AI 关键词扩展
+ AI 总结归纳
+ 飞书机器人结构化拆解
+ Google Sheet 留档
+ Codex / 文档沉淀成 SOP 或 skill
```

人工负责判断“这条值不值得研究”；AI 和机器人负责把链接拆成结构化信息。

### 4.4 输入飞书机器人的链接类型

#### 账号链接

示例：

```text
https://www.tiktok.com/@xxx
```

机器人写入 `account_analysis`，字段包括：

| 字段 | 说明 |
| --- | --- |
| 账号定位与主要内容主题 | 这个账号主要讲什么，服务什么用户 |
| 最近内容数量、主要视频形式 | 近期活跃度和形式判断 |
| 可见粉丝 / 视频数 / bio | 抓不到就标 `待补数据` |
| 是否值得持续追踪 | 是 / 否 / 观察 |
| 对当前产品的参考价值 | 可借鉴点和适配度 |
| 适合借鉴的内容机制 | Hook、结构、CTA、账号语气、视觉形式等 |
| 不建议照搬的表达、素材或风险 | 版权、夸大、宿命化、品牌不符等 |
| 建议适配账号 | 官方 / AI 人设 / 热点 / 测试号等 |

机器人同时发送飞书账号分析卡片，内容为简版结论和 Sheet 行号。

#### 视频链接

示例：

```text
https://www.tiktok.com/@xxx/video/xxx
```

机器人写入 `video_analysis`，字段包括：

| 字段 | 说明 |
| --- | --- |
| 发布时间、时长、播放、赞、评、转发 | 抓不到标 `待补数据 / 待确认` |
| Caption | 原始文案 |
| 首屏文字与前 3 秒 Hook | 判断停留原因 |
| 视频形式 | 真人口播、AI 主播、录屏、绿幕、slideshow、产品演示等 |
| 结构 | Hook → 内容推进 → 结果 / CTA |
| 可见 CTA | 链接、评论、bio、App、工具等 |
| 可借鉴元素 | 具体到 Hook、结构、画面、节奏、互动机制 |
| 不可照搬元素 | 素材、版权、语气、风险表达等 |
| 具体改编方案 | 针对当前产品如何重写，而不是照抄 |
| 风险 | 品牌、版权、宿命化、夸大承诺等 |
| 分析置信度 | 高 / 中 / 低，说明原因 |

机器人同时发送飞书视频拆解卡片，重点回答：

```text
这条为什么能吸引人？
哪个 Hook / 结构值得学？
应该给哪个账号发？
当前产品具体应怎么改，而不是照抄？
```

#### 多条链接

一次输入多条时，机器人逐条入表和发卡后，需要再给横向结论：

- 哪条最适合测试号的录屏形式。
- 哪条最适合 AI 人设号。
- 哪条只适合借 Hook，不适合借表达。
- 可以抽出来测试的统一模板。
- 下一条最值得立刻制作的内容方向。

### 4.5 调研输出沉淀

调研结束后不要只停留在 Sheet，应沉淀成以下资产：

| 资产                       | 用途                 |
| ------------------------ | ------------------ |
| reference account list   | 长期追踪账号库            |
| video format analysis    | 爆款视频结构拆解           |
| platform playbook        | 平台机制和发布建议          |
| account matrix playbook  | 多账号定位和分工           |
| content generation skill | 把调研结论变成可复用 AI 生产规则 |
| topic library            | 可持续生产的选题库          |

AstrologyWiki 当前对应文件包括：

- `inbox-pengman/02-调研资料/竞品研究/reference-accounts.md`
- `inbox-pengman/02-调研资料/竞品研究/astrology-short-video-format-analysis.md`
- `inbox-pengman/04-production/00-evergreen-workflows/AstrologyWiki 社媒账号定位与内容路由 Playbook.md`
- `inbox-pengman/skills/astrologywiki-social-workflow/SKILL.md`

---

## 5. Stage 3：选择平台、账号矩阵、人设、风格和频率

### 5.1 平台选择原则

不要一开始全平台重投入。先判断每个平台在当前阶段承担什么任务。

| 平台 | 典型作用 | 判断重点 |
| --- | --- | --- |
| TikTok | 爆款测试、Hook 测试、短视频分发 | 完播、互动、评论、主页访问 |
| YouTube Shorts | 搜索 + 推荐混合、视频资产沉淀 | 标题关键词、留存、频道长期资产 |
| Instagram Reels / Carousel | 图文品牌感、视觉复用、轻内容 | 封面、收藏、主页点击 |
| X | 观点测试、热点互动、快速分发 | 回复、转发、链接点击、话题参与 |
| Pinterest | 图文长尾搜索和外链潜力 | pin 点击、保存、长期曝光 |
| Reddit | 用户问题观察、话题验证 | 社区规则、真实问题、不能硬广 |

平台选择要和产能匹配。一个人运营时，建议先做：

```text
1 个主视频平台
+ 1 个复用平台
+ 1 个轻量文字 / 图文平台
+ 1 个用户问题观察渠道
```

### 5.2 账号数量选择

账号数量不是越多越好。多账号只有在“定位、内容形式、测试目标”不同的时候才有意义。

建议从以下问题判断：

- 是否需要官方可信账号？
- 是否需要更像创作者的人设账号？
- 是否需要热点/名人/事件账号？
- 是否需要低成本测试 Hook 的普通账号？
- 是否有足够内容产能让多个账号差异化，而不是重复发同一条广告？

### 5.3 通用账号矩阵模板

| 账号类型 | 定位 | 适合内容 | 风险 |
| --- | --- | --- | --- |
| 官方账号 | 稳定、可信、品牌解释 | 产品功能、工具演示、主题栏目、官方内容 | 太像广告，互动弱 |
| 专家 / AI 人设号 | 专业解释、心理机制、知识人格 | 短口播、AI 主播、栏目化解读 | 绝对化、AI 味、信任问题 |
| 热点号 | 追热点、名人、事件、流行文化 | 名人案例、影视娱乐、体育事件、社交话题 | 事实错误、预测过度、版权风险 |
| 普通创作者 / 测试号 | 低成本测 Hook、语气、评论互动 | 自拍、slideshow、meme、榜单、评论互动 | 品牌不稳定、低质内容过多 |
| 产品体验号 | 用用户视角展示产品怎么用 | 录屏、教程、before/after、案例 | 过度营销、演示太长 |

### 5.4 AstrologyWiki 账号路由案例

下表是 2026-07 的历史四账号探索，不是当前生产配额：

| 账号 | 定位 | 主要内容 |
| --- | --- | --- |
| ① AstrologyWiki 官方 | 品牌账号，栏目化 | 天象事件 + 心理/关系落点 + 非真人视觉 + 工具承接 |
| ② AI 占星师人设 | 占星 × 心理机制 | 固定 AI 主播，大字幕，Moon/Venus/Rising/house 解释 |
| ③ 热点占星测试 | 明星 / 情侣 / 事件流量 | 名人图、星盘截图、热点事件解释，不做预测 |
| ④ 普通占星爱好者 | 低成本测试号 | slideshow、榜单、星座梗、评论互动、trend 音频 |

自 2026-08-04 起，当前只启用 `@astrologywiki` 与 `@miraaastrology`；热点号暂停，普通爱好者号退役。实时账号角色和未来启用门以 [[inbox-pengman/04-production/00-evergreen-workflows/AstrologyWiki 社媒账号定位与内容路由 Playbook]] 为准。

### 5.5 内容输出频率

频率要跟生产能力、账号阶段和平台容忍度匹配。

启动阶段建议：

| 内容类型                     | 建议频率             |
| ------------------------ | ---------------- |
| 主短视频                     | 每周 3-5 条，稳定后再提高  |
| X 短帖 / 图文                | 每天 1-3 条，根据质量调整  |
| Instagram / Pinterest 图文 | 每周 2-4 条，可复用核心内容 |
| 热点内容                     | 有明显热点再做，不强行每天追   |
| 测试号轻内容                   | 可更高频，但必须记录结果     |

原则：

- 先稳定模板，再提高频率。
- 先小规模 canary，再放大。
- 不要多个账号同一时间发高度相似内容。
- 不要每条内容都带强营销 CTA。

---

## 6. Stage 4：把调研链接转成内容生成 skill / SOP / 模板

### 6.1 为什么要生成 skill

调研的最终价值不是“知道哪个账号做得好”，而是把可复制机制写成规则，让 AI 和人下次能稳定生产。

一个有效的内容生成 skill 应该包括：

- 什么时候触发。
- 必读本地文件。
- 输入材料。
- 禁止事项。
- 选题规则。
- 平台分发规则。
- Hook 模板。
- 输出格式。
- 数据记录和复盘要求。

### 6.2 从 Sheet 到 skill 的转换流程

```text
飞书机器人写入 account_analysis / video_analysis
→ Pengman 筛选值得复用的账号和视频
→ 汇总可借鉴机制
→ 分类：Hook / 视频结构 / 视觉形式 / CTA / 账号适配 / 风险
→ 写入 reference account 或 video format analysis
→ 抽象成 content generation skill
→ 用 3-5 条真实内容测试
→ 根据发布结果更新 skill
```

### 6.3 模板提炼口径

不要写成“模仿某账号”，要写成可执行结构。

差的写法：

```text
参考 Co-Star 的风格。
```

好的写法：

```text
Placement mood card:
- 开头：直接点名一个 placement / sign
- 画面：低成本移动背景 + 居中文字
- 文案：一句强情绪状态，不解释定义
- 结尾：轻 CTA 到 birth chart / placement page
- 风险：不要只做纯 meme，要能承接到工具或文章
```

### 6.4 Skill 更新原则

- 只有验证过或强相关的机制才写入 skill。
- 抓不到数据的地方保留 `待补数据 / 待确认`。
- 不要因为单条爆款就把它当成长期规则。
- 如果某机制来自真人 IP、投放、版权素材、账号历史，要明确写出不可复制原因。
- 每 1-2 周根据发布复盘更新一次规则。

---

## 7. Stage 5：内容生产与发布

### 7.1 内容生产主流程

```text
选题输入
→ 平台 / 账号适配判断
→ Hook 和内容结构
→ 文案 / 脚本
→ 视觉 / 视频资产
→ 剪辑 / 设计
→ 发布前检查
→ 分平台发布
→ 记录链接
```

### 7.2 选题输入来源

| 来源            | 说明                                |
| ------------- | --------------------------------- |
| 产品页面 / 工具页    | 最容易承接，适合长期内容                      |
| SEO 关键词 / GSC | 高 impression、低 CTR、8-30 位 query 等 |
| 竞品爆款结构        | 借机制，不照搬表达                         |
| 当前热点          | 娱乐、体育、名人、节日、社交话题、平台趋势             |
| 用户问题          | 评论区、Reddit、X 回复、搜索问题              |
| 内容支柱          | 品牌长期要占住的主题                        |

### 7.3 生产包最低标准

每条正式发布内容至少应保留：

- Topic
- Platform
- Account
- Hook
- Script / Caption
- Visual idea / asset source
- Landing page
- Shortlink placeholder or final link
- Publish date
- Published URL
- Early metrics
- 是否值得复用

### 7.4 短视频生产模板

```text
3 秒 Hook
→ 具体生活场景 / 热点画面 / 用户问题
→ 产品相关知识点或解释
→ 轻 CTA：查工具、读文章、看完整页面、评论互动
```

发布前检查：

- 前 3 秒是否足够明确。
- 画面是否适合 9:16。
- 字幕是否手机可读。
- 是否有事实错误、时间错误、夸大承诺。
- 是否使用了可能侵权的素材。
- CTA 是否自然，不像硬广。

### 7.5 图文 / Carousel 生产模板

单图：

```text
Label / Date
Main title
One-line insight
3 short action lines or prompts
Handle / light CTA
```

Carousel：

```text
Slide 1: 强 Hook
Slide 2-4: 每页一个观点
Slide 5: 工具 / 页面 / 互动 CTA
```

原则：

- 图上少字，解释放 caption。
- 一页一个重点。
- 不要把文章段落塞进图片。
- 不要让 AI 生成图片里的可读文字，文字应在 Canva / CapCut 中编辑。

### 7.6 X / 文字平台模板

```text
Hook / timely observation
1-2 句解释
开放问题或轻 CTA
链接放主帖、回复或 bio，按平台策略决定
```

X 更适合：

- 快速测试观点。
- 跟热点。
- 提问互动。
- 链接到工具或文章。
- 把短视频主题改成短帖。

---

## 8. Stage 6：发布记录、数据抓取和复盘

### 8.1 复盘目标

复盘不是只看播放量，而是判断内容机制是否值得继续投入。

核心问题：

```text
这条内容为什么有 / 没有表现？
是 Hook、题材、平台、账号、人设、视觉、发布时间、CTA 哪个因素影响最大？
它是否带来了站内访问、工具使用、评论问题或可复用模板？
下一轮应该复制、改写、暂停还是放弃？
```

### 8.2 数据字段

每条内容至少记录：

| 字段                                | 说明                                      |
| --------------------------------- | --------------------------------------- |
| 平台                                | TikTok / YouTube / IG / X / Pinterest 等 |
| 账号                                | 哪个账号矩阵                                  |
| URL                               | 发布链接                                    |
| 主题                                | 内容主题                                    |
| 内容类型                              | 视频 / 图文 / carousel / thread / 录屏等       |
| 发布时间                              | 日期和时区                                   |
| Hook                              | 前 3 秒或主标题                               |
| Landing page                      | 承接页面                                    |
| Views / Impressions               | 曝光或播放                                   |
| Likes / Comments / Shares / Saves | 互动                                      |
| Profile visits / Link clicks      | 有则记录                                    |
| 站内同步数据                            | GA4 / GSC / shortlink 点击等，有则记录          |
| 结果判断                              | 复用 / 改写 / 暂停 / 放弃                       |
| 备注                                | 数据缺失、异常、账号问题等                           |

### 8.3 当前数据抓取现实

当前已有 Codex 半自动化每天抓取数据，但经常抓不到。

因此复盘口径应分三层：

| 层级 | 数据来源 | 处理方式 |
| --- | --- | --- |
| P0 内容记录 | 平台链接、发布时间、主题、格式、landing page、CTA/短链 | 必须记录 |
| P0 目标追踪 | reach、主页访问、短链/链接点击、social→工具使用/注册/购买、assisted qualified UV | 需要后台、短链或 GA4；拿不到必须标 `待补数据 / 待确认`，不得省略字段 |
| P1 诊断 | impressions/views、播放、赞、评、转、收藏、完播率、caption | 用于解释 reach 与转化差异，不能替代主指标 |

不要因为自动抓取失败就停止复盘。抓不到的数据要明确标记，先保留人工判断。

### 8.4 每日 / 每周复盘节奏

每日轻记录：

- 今天发了什么。
- 链接是什么。
- 哪些数据可见。
- 有无异常账号 / 0 播放 / 下架 / 链接失效。

每周复盘：

- 哪些主题表现最好。
- 哪些 Hook 可复用。
- 哪些账号适合继续投产。
- 哪些内容带来评论问题或站内承接机会。
- 哪些模板应该写回 skill。
- 哪些平台或账号需要暂停、换风格或重养号。

### 8.5 复盘输出

每周至少产出：

```text
本周发布内容列表
→ 最好内容 Top 3
→ 最差 / 异常内容
→ 可复用 Hook / 模板
→ 对 SEO / 站内内容的反馈
→ 下周测试建议
```

AstrologyWiki 当前复盘入口：

- `inbox-pengman/07-reports/`
- `inbox-pengman/07-reports/历史发布记录/public-account-crawl-log.md`

---

## 9. SEO 回流机制

### 9.1 社媒数据如何反哺 SEO

社媒内容对 SEO 的价值不只在外链或直接点击，还包括：

- 发现用户真实表达。
- 验证标题和 Hook。
- 找到适合扩写的 FAQ。
- 判断哪些概念需要更基础的解释页。
- 判断哪些热点值得写成站内文章或更新旧文。
- 判断哪些工具页需要更清晰的使用场景。

### 9.2 回流字段

从社媒复盘回流到 SEO / 内容生产时，建议记录：

| 字段 | 说明 |
| --- | --- |
| Social topic | 社媒主题 |
| User language | 评论区或平台常用表达 |
| Search intent | 对应搜索意图 |
| Existing page | 已有承接页面 |
| Content gap | 站内缺什么解释 |
| Suggested SEO action | 新文章 / 更新旧文 / FAQ / 内链 / 工具说明 |
| Priority | 高 / 中 / 低 |

### 9.3 AstrologyWiki 当前回流示例

| 社媒信号 | 可回流方向 |
| --- | --- |
| 用户喜欢 Moon / Venus / Rising 性格 callout | 补充 birth chart guide、Moon sign、Venus sign 解释 |
| 名人星盘内容有互动 | 建立 celebrity chart 主题集群或页面更新 |
| Transit 内容收藏高 | 更新 astrology calendar、Today's Sky、transit explainer |
| 评论反复问“怎么查自己的配置” | 强化 birth chart calculator 的使用说明和 CTA |
| 关系 / compatibility 内容互动高 | 补 synastry、compatibility、Venus/Mars 相关页面 |

---

## 10. 风险与边界

### 10.1 内容风险

| 风险 | 处理原则 |
| --- | --- |
| 事实错误 | 时间、人物、事件、天象必须核对 |
| 版权风险 | 不直接搬运影视、明星图、竞品素材；需要记录来源 |
| 过度预测 | 不预测关系结果、财富、健康、比赛结果等 |
| 宿命化表达 | 用 self-understanding、patterns、reflection 替代绝对断言 |
| 硬广过多 | 大多数内容先 value first，CTA 轻量 |
| AI 味过重 | 少用模板化免责声明和机械转折，保持自然语气 |

### 10.2 多账号风险

- 不要多个账号同一时间发同素材、同 caption、同 CTA。
- 不要用多个账号伪装成真实用户互相刷量。
- 不要频繁切换设备、IP、账号组合。
- 不要在异常账号上持续投入高产能。
- 对买号、代理 IP、多账号矩阵等做法要保守处理，优先真实、透明、长期可运营。

### 10.3 数据风险

- 抓不到数据就标 `待补数据 / 待确认`。
- 第三方公开接口数据视为 best-effort，不当作绝对后台数据。
- 单条爆款不能证明机制稳定。
- 有投放标签、账号历史、真人 IP 或版权素材的视频，要单独标注不可复制因素。

---

## 11. 通用执行检查清单

### 11.1 新产品启动前

- [ ] 产品核心功能和目标用户已整理。
- [ ] 已列出可承接页面 / 工具 / 文章。
- [ ] 已明确社媒目标：reach、social conversion、assisted qualified UV、增长点探索和 SOP 沉淀。
- [ ] 已明确品牌边界和禁用表达。
- [ ] 已选定首轮 1-3 个平台。
- [ ] 已决定账号数量和账号定位。
- [ ] 已建立发布记录和复盘表。

### 11.2 竞品调研阶段

- [ ] 已收集直接竞品账号。
- [ ] 已收集领域高互动账号。
- [ ] 已输入账号链接给飞书机器人。
- [ ] 已输入代表视频链接给飞书机器人。
- [ ] Sheet 中 `待补数据 / 待确认` 已保留。
- [ ] 已提炼可借鉴机制和不可照搬风险。
- [ ] 已沉淀到 reference account / video format analysis。

### 11.3 内容生产阶段

- [ ] 每条内容有明确账号和平台。
- [ ] 每条内容有前 3 秒 Hook。
- [ ] 每条内容有承接页面或明确不放链接的理由。
- [ ] 文案符合品牌边界。
- [ ] 视觉 / 视频适合平台尺寸。
- [ ] 发布前检查版权、事实、CTA 和字幕。
- [ ] 发布后记录链接。

### 11.4 复盘阶段

- [ ] 已记录每条内容链接。
- [ ] 已记录可见平台数据。
- [ ] 抓不到的数据已标 `待补数据 / 待确认`。
- [ ] 已判断内容结果：复用 / 改写 / 暂停 / 放弃。
- [ ] 已提炼可复用 Hook 或模板。
- [ ] 已把有效机制写回 skill / SOP。
- [ ] 已把用户问题和高互动角度回流到 SEO / 内容库。

---

## 12. 当前 AstrologyWiki 落地路径

### 12.1 已有基础

AstrologyWiki 已经具备：

- 基础站外内容工作流。
- Daily Content Assistant SOP。
- AI short video workflow。
- Instagram image content workflow。
- 账号定位与内容路由 Playbook（旧四账号探索已转为历史背景）。
- reference account 和视频结构调研。
- weekly published content digests。
- social-daily skill。
- 飞书机器人 + Google Sheet 账号 / 视频拆解链路。
- 半自动数据抓取，但稳定性不足。

### 12.2 当前优先级

短期最重要的是把链路跑稳：

```text
每日/每周选题
→ 选 1-3 条 P0 内容
→ 按账号矩阵分配
→ 生产短视频 / 图文 / X 文案
→ 发布
→ 记录链接和可见数据
→ 周复盘
→ 更新 skill 和选题库
```

### 12.3 当前不建议马上做

- 不建议重新写一套完全独立于现有文档的新体系。
- 不建议上来追求全平台重投产。
- 不建议把全部产能押在高成本 AI 数字人。
- 不建议忽略 weekly digest，只看机器人分析。
- 不建议在数据抓取不稳定时假装已有完整自动化。

### 12.4 推荐下一步

1. 继续用飞书机器人扩充 `account_analysis` 和 `video_analysis`。
2. 每周从 Sheet 里选 5-10 条最有价值的视频，写入 reference account / format analysis。
3. 把表现好的机制更新到 `astrologywiki-social-workflow/SKILL.md` 或对应 evergreen workflow。
4. 每周固定更新 published content digest，标记 `待补数据 / 待确认`。
5. 建一个“社媒信号 → SEO 回流”的轻量表或小节，避免社媒和站内内容割裂。

---

## 13. 给上司 / 同事讨论时的简版口径

这套 SOP 的核心不是“做社媒账号”，而是建立一个可复用的站外内容增长循环：

```text
产品和 SEO 资产
→ 平台与竞品调研
→ 多账号内容测试
→ AI/机器人结构化拆解
→ 内容模板和 skill 沉淀
→ 发布与数据复盘
→ 反哺 SEO、页面、工具和下一轮内容
```

对 AstrologyWiki 来说，社媒内容的主目标是获取目标用户 reach，保障 social→工具使用/注册/购买的转化路径，贡献 assisted qualified UV，并通过实验找到可复制增长点。文章发现、用户问题收集和 SEO 回流是重要支持路径；PV、粉丝和播放是诊断或过程指标，不是主 KPI。

当前最大短板不是没有想法，而是需要把账号 / 视频拆解、内容生产、发布记录、数据复盘、SEO 回流这几步连接得更稳定。自动抓取暂时不稳定，所以 SOP 中必须保留人工记录和 `待补数据 / 待确认` 口径。
