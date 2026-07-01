---
title: AstrologyWiki 站外内容长期工作流
date: 2026-06-17
updated: 2026-06-17
owner: Pengman
project: astrologywiki
type: workflow
status: draft
source:
  - [[inbox-pengman/06-tasks/2026-06-16-astrologywiki-weekly-todo.md]]
  - [[inbox-pengman/07-account-assets/2026-06-17-astrologywiki-account-assets.md]]
  - [[inbox-pengman/02-conversation report/2026-06-17-astrologywiki-account-warmup-discussion.md]]
  - [[inbox-pengman/04-production/05-weekly-published-content-digests/2026-06-17-astrologywiki-messi-video-launch-report.md]]
  - [[inbox-pengman/03-topic-ideas/AstrologyWiki 站外内容选题库.md]]
---

# AstrologyWiki 站外内容长期工作流

> 这份文档只记录长期会重复发生的内容工作：怎么找题、怎么做内容、怎么发、怎么复盘、怎么把结果沉淀成下一轮输入。  
> 一次性的注册、账号资产、养号说明，已单独放在其他文档，不在这里重复。

---

## 2. 当前工作流总览

```text
主题输入
→ 选题库筛选
→ 平台判断
→ 脚本 / 文案生成
→ 视觉 / 视频制作
→ 发布到 X / YouTube / TikTok
→ 记录链接与结果
→ 复盘
→ 更新选题库 / 资产库 / 工作流
```

### 2.1 主题输入来源

当前可用的输入主要有 4 类：

1. **热点事件**
   - 例如 Messi + World Cup
   - 适合做时效性较强的入口内容

2. **站内内容 / 功能**
   - birth chart
   - houses
   - cancer sun
   - synastry
   - journal prompts

3. **用户问题 / 社区语言**
   - 来自 Reddit、X、评论区、搜索词
   - 适合做 FAQ、解释型内容、反误区内容

4. **内容支柱**
   - Astrology literacy
   - Birth chart basics
   - Current event hooks
   - Chart to journal
   - Self-understanding

---

## 2. 选题工作流

### 2.1 选题库入口

当前选题主入口：

[[AstrologyWiki 站外内容选题库]]

热点样例：

[[inbox-pengman/03-topic-ideas/Lionel Messi’s Cancer Sun.md]]

### 2.2 选题筛选逻辑

选题不是“看到就做”，而是先判断它属于哪一类：

| 类型 | 目的 | 是否适合首发 |
|---|---|---|
| 热点入口 | 抢时效、做曝光 | 适合 |
| 基础解释 | 建立品牌和搜索认知 | 适合 |
| 反误区 | 提升收藏和转发 | 适合 |
| 用户问题 | 收集真实语言和 FAQ | 适合 |
| 风险预测型 | 容易偏离品牌边界 | 谨慎 |

### 2.3 选题判断字段

每条选题至少记录：

- Topic
- Platform
- Theme
- Angle
- Entry Point
- Natural Next Step
- Risk
- Status

### 2.4 当前可复用的选题结构

```text
热点事件 / 用户问题
→ 为什么这个 moment 值得看
→ 占星解释
→ 关键术语
→ 自我理解角度
→ 软 CTA
```

---

## 3. 内容生成工作流

### 3.1 脚本与文案

目前已经验证的路径：

- 先用 Pictory 生成脚本初稿；
- 再用 GPT 进行润色与结构调整；
- 最后决定是否进入视频制作。

### 3.2 工具分工

| 环节 | 工具 | 当前结论 |
|---|---|---|
| 脚本初稿 | Pictory | 可做初稿，但不适合主流程 |
| 脚本润色 | GPT | 有效，继续使用 |
| 视频制作 | VEED | 当前主工具 |
| 后期剪辑 | CapCut / 剪映 | 备选 / 补充 |
| 素材下载 | yt-dlp | 可用，配合 ffmpeg 更好 |

### 3.3 内容资产沉淀

每次内容发布后都要保留：

- prompt
- 脚本
- 标题
- 简介
- 封面 / 图文文案
- 发布链接
- 结果记录

这样后面才能把一次发布变成一份模板。

### 3.4 AI 选题与出稿 Prompt 模板

下面这个 prompt 可以直接丢给 AI，用来让它基于我们已经整理好的文档，先想下一个选题，再写出适合发布的平台文案或脚本。

```text
你是 AstrologyWiki 的站外内容策划与文案助手。请先阅读并只基于以下文档，帮我生成下一个可执行的选题，并写出对应的英文脚本 / 帖子文案。

必须参考的上下文：
- [[inbox-pengman/03-topic-ideas/AstrologyWiki 站外内容选题库.md]]
- [[inbox-pengman/04-production/2026-06-17-astrologywiki-social-content-workflow.md]]
- [[inbox-pengman/04-production/05-weekly-published-content-digests/2026-06-17-astrologywiki-messi-video-launch-report.md]]
- [[inbox-pengman/02-conversation report/2026-06-17-astrologywiki-account-warmup-discussion.md]]
- [[inbox-pengman/07-account-assets/2026-06-17-astrologywiki-account-assets.md]]
- [[inbox-pengman/06-tasks/0615AstrologyWiki 内容运营与增长任务梳理.md]]
- [[inbox-pengman/04-production/01-strategy-and-platform-research/0616AstrologyWiki 站外内容平台调研与首轮运营方案初稿.md]]

工作要求：
1. 优先从最近的选题、已发布内容和长期主题支柱里找下一步最适合做的题。
2. 选题要符合 AstrologyWiki 的品牌边界：现代、解释型、以自我理解为主，不做宿命化或恐吓式表达。
3. 如果适合热点，就给出热点切入；如果适合基础内容，就给出基础解释切入。
4. 先判断最适合的平台，再分别给出 X / YouTube Shorts / TikTok 版本中最合适的一个或两个。
5. 文案要简洁、自然、像真人写的，不要太 AI 化。
6. 如果是 X 帖子，避免过度否定句、避免堆砌免责声明、避免太长。
7. 避免使用 “is...not...” / “不是...而是...” 这类对照句式；需要表达边界时，优先改成正向表达，比如 “Use it as...”, “Think of it as...”, “It works best as...”。
8. 如果是视频脚本，控制在适合短视频或轻量解释视频的长度。
9. 如果涉及链接，请优先放可自然承接的 AstrologyWiki 页面或主页。

输出格式：
A. Next Topic
- Topic:
- Why now:
- Best platform:
- Risk note:

B. Script / Post Copy
- English version:

C. Optional Variations
- X version:
- YouTube Shorts version:
- TikTok version:

D. Suggested CTA
- Primary CTA:
- Secondary CTA:
```

> 如果输入里已经包含足够上下文，也可以直接跳过解释，优先给我可发布的版本。

---

## 4. 发布工作流

### 4.1 当前发布平台

- X
- YouTube Shorts
- TikTok

### 4.2 当前发布方式

已验证的内容形式包括：

- X 图文帖
- X birth chart 图片帖
- YouTube Shorts
- TikTok 复用短视频

### 4.3 发布时的原则

1. 先发原生感强、可理解的内容；
2. 先用热点或清晰解释做入口；
3. 文案尽量短；
4. 避免太多否定句和 AI 味结尾；
5. 链接尽量自然放入简介、评论或后续补充帖；
6. 发布前先确认图文 / 视频是否符合品牌边界。

### 4.4 当前较有效的内容表达

- World Cup night + Messi’s chart
- Cancer Sun + 5th house + expressiveness
- birth chart 截图 + 短分析
- 热点事件 + self-understanding

---

## 5. 复盘工作流

### 5.1 复盘记录入口

当前主要复盘文档：

[[inbox-pengman/04-production/05-weekly-published-content-digests/2026-06-17-astrologywiki-messi-video-launch-report.md]]

### 5.2 复盘要记录什么

每条内容至少记录：

- 平台
- 链接
- 内容类型
- 主题
- 发布时间
- 工具链
- 结果
- 是否值得复用

### 5.3 复盘判断

重点不是单看播放量，而是看：

- 曝光
- 主页访问
- 收藏 / 评论 / 转发
- 链接点击
- 是否适合继续扩展成系列

---

## 6. 目前已经跑通的执行模板

### 模板 A：热点入口型

```text
热点事件
→ 现实时刻值得关注
→ 占星解释
→ 轻量结论
→ 软 CTA
```

案例：Messi / World Cup / Cancer Sun

### 模板 B：birth chart 分析型

```text
birth chart 截图
→ 短标题
→ 1 句分析
→ 1 句事件连接
→ 软 CTA
```

案例：Messi chart + World Cup night

### 模板 C：解释型内容

```text
一个占星概念
→ 关键含义
→ 和用户体验的关系
→ 引导阅读完整文章
```

---

## 7. 长期维护点

以下事项会长期重复出现，建议保留在这里，作为每周检查项：

- 选题库是否持续补充；
- 内容模板是否过时；
- 发布平台是否需要调整优先级；
- 文案 / 视觉 / 视频工具是否仍然高效；
- 复盘字段是否足够解释结果；
- 是否需要新增新的内容支柱或热点入口；
- 是否有某类内容可以固定成系列。

---

## 8. 当前待补的工作流节点

- [ ] 账号内容标签体系建立
- [ ] 平台分析字段标准化
- [ ] 周报 / 复盘节奏固定化
- [ ] 选题库与发布记录之间建立统一 ID
- [ ] 形成稳定的系列栏目命名方式
- [ ] 明确哪些内容适合长期复用，哪些只做一次性热点测试

---

## 9. 下一步建议

1. 继续把“选题库 → 脚本 → 发布 → 复盘”这条链路固定下来。
2. 每条内容都留下 prompt、标题、链接、结果。
3. 继续把热点内容和基础内容分成两个子流。
4. 以后所有新内容都按照同一套模板记录。
5. 再逐步把这个工作流拆成 SOP。
