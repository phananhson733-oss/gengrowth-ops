---
title: Codex 自动化剪辑用于 AstrologyWiki 天象 Pexels 15秒语音短视频调研报告
project: astrologywiki
type: tool-workflow-research
status: draft
owner: Pengman
updated: 2026-07-21
target_account: "@astrologywiki"
target_format: "9:16 非真人天象 + Pexels 素材 + 15秒语音短视频"
---

# Codex 自动化剪辑用于 AstrologyWiki 天象 Pexels 15秒语音短视频调研报告

> **一句话结论：这类 15 秒天象视频非常适合自动化，而且比 Miraa AI 口播更适合。当前可先采用“已确认天象脚本 → Higgsfield API 内的 Eleven v3 生成固定语音 → 本地 Whisper 对齐字幕 → Pexels API 检索 1–3 段竖屏素材 → FFmpeg 套固定 9:16 模板、字幕和品牌元素 → Codex 自动检查 → 人工完整播放”。已有 Higgsfield 套餐时新增现金支出可接近 `$0`，但必须另记 credits；若以后直连 ElevenLabs，单条 TTS 约 `$0.01–0.025`（约 `¥0.07–0.17`）。主要成本是首次模板开发和每条 2–5 分钟人工质检。**

## 1. 决策摘要

### 当前采用

先用半自动 Canary 验证三条，再进入批处理：

```text
周计划 selected 项目 + 已确认天象事实和脚本
→ Codex 生成 15 秒生产包
→ Higgsfield API 内 Eleven v3 生成固定语音
→ 本地 Whisper 生成字幕时间戳
→ Pexels API 搜索竖屏视频并保存来源
→ 人工从 3 个候选中确认 1–3 段素材
→ FFmpeg 自动裁切、拼接、字幕、混音和导出
→ Codex 自动 QC
→ 人工完整播放
→ edited / scheduled
```

Canary 通过后，素材选择也可提高自动化程度，但仍建议保留“候选缩略图确认”，因为 API 元数据无法判断素材是否俗套、是否出现错误星图、Logo、AI 伪文字或与天象含义冲突。

### 为什么适合自动化

- 不需要固定人物、对口型、牙齿和表情检查；
- 15 秒结构固定，通常只需要 1–3 段背景素材；
- 官方号已经确定为“天象事件 + 非真人视觉 + 大字幕 + 轻 CTA”；
- Pexels 支持视频搜索、竖屏方向和尺寸过滤；
- TTS 可以直接返回时间戳，字幕无需二次转录；
- FFmpeg 可以稳定处理裁切、缩放、淡入淡出、字幕、音量和导出；
- 失败通常只影响一段素材或一次渲染，不会像数字人一样整条重抽。

### 附件所述“爆款结构复刻”工作流适用于什么

附件中的原始工作流可以概括为：

```text
参考视频提供镜头结构和节奏
→ FFmpeg 拆镜头、关键帧、音轨和文案
→ 从分类素材库按颜色、亮度、构图匹配替换素材
→ TTS 按镜头生成语音并以真实音频时长校正节奏
→ 自动生成预览、字幕和剪映草稿
→ 人工补 BGM、音效、强调花字和最终审核
```

它的定位是**高产量自动生产**，不是精品原创导演系统。真正适合它的内容通常具有“结构可复刻、素材可替换、语义简单、允许人工最后微调”四个条件。

#### 适合的视频类型

| 视频类型 | 适配度 | 为什么适合 | 例子 |
|---|---|---|---|
| 电商带货、信息流广告、千川素材 | **高** | 镜头短、卖点明确、需要大量版本测试；产品素材可以反复重组 | 产品展示、使用场景、痛点/效果、促销信息 |
| 无人出镜带货/知识转化视频 | **高** | 不依赖演员连续表演；画面主要承载说明和节奏 | 图书带货、课程资料、工具介绍、榜单推荐 |
| 固定模板的 Faceless 科普 | **高** | Hook、解释、结论和 CTA 可以模板化；B-roll 可替换 | 15–30 秒天象、健康常识、历史冷知识、财经概念 |
| App/网站/工具功能推广 | **高** | 录屏、UI、使用场景和结果页都可以建立可检索素材库 | AstrologyWiki 星盘工具、Current Planets、Moon Phase |
| 简单节奏型混剪/Vlog | **中** | 可以复刻镜头长度和构图，但情绪与叙事连接不稳定 | 旅行氛围、日常记录、城市混剪 |
| 娱乐盘点、榜单和解说 | **中** | 结构标准，但版权、人物和语义匹配风险较高 | Top 3、影视盘点、明星事件摘要 |
| 复杂叙事、电影化原创、情绪表演 | **低** | 需要连续人物、镜头因果、细腻情绪和导演判断 | 微电影、剧情短片、人物纪录片、情感 Vlog |

#### 适合的账号类型

| 账号类型 | 适配度 | 关键条件 |
|---|---|---|
| 电商店铺号、广告投放号 | **最高** | 需要日更多版本、允许用数据淘汰素材、有充足产品素材 |
| Faceless 垂类知识号 | **高** | 有稳定栏目、固定字幕/配音、内容可以拆成短信息块 |
| 官方品牌/产品教育账号 | **高** | 品牌规范固定，素材和事实可以提前审核，CTA 明确 |
| 多语言/多账号矩阵 | **高** | 同一视觉模板换文案、配音和 CTA，可批量本地化 |
| 热点解说/娱乐混剪号 | **中** | 素材供应快且授权清楚；仍需人工判断情绪和事实 |
| 强人格真人 IP、访谈、播客切片 | **低到中** | 如果只是字幕/切片可辅助；若依赖人物魅力和反应，不适合自动替换镜头 |
| 高审美作品号、导演/摄影账号 | **低** | 账号价值本身来自原创镜头语言，自动匹配会削弱差异化 |

最适合的账号通常还具有以下运营特征：

- 每周至少需要稳定生产多条内容；
- 同一栏目可以冻结画幅、字体、字幕、声音和 CTA；
- 有可持续增长、可分类、授权清楚的素材库；
- 成功依赖 Hook、卖点和完播，而不是单个演员的微表情；
- 能接受“80% 自动生成 + 20% 人工审核和精修”；
- 可以用数据筛选大量版本，而不是要求每条都成为精品。

#### 适合的素材类型

| 素材 | 适配度 | 使用要求 |
|---|---|---|
| 产品特写、功能演示、开箱、使用前后 | **高** | 单镜头独立、无关键步骤缺失、按功能和场景分类 |
| 星空、自然、城市、办公、生活方式 B-roll | **高** | 作为氛围和语义辅助，不承担精确事实证明 |
| App/网站录屏、界面截图、数据卡片 | **高** | 版本和文字必须准确，避免使用过期 UI |
| 自制图卡、SVG、品牌元素、图标 | **高** | 统一尺寸、透明背景、命名和授权清楚 |
| AI 生成的无文字氛围素材 | **中高** | 人工排除伪文字、错误结构和品牌不一致 |
| 真人连续表演、对话和剧情镜头 | **低** | 自动替换会破坏动作、视线和情绪连续性 |
| 新闻、赛事、影视和明星片段 | **低到中** | 版权和事实风险高，不能只因视觉相似就自动使用 |
| 精确星盘、行星位置和天文现象 | **低（对通用图库）** | 必须来自已核验星历、AstrologyWiki 工具或自制准确视觉 |

素材库越符合以下条件，自动化成功率越高：

- 每段 2–10 秒，能够独立使用；
- 竖屏或可安全裁成 9:16；
- 没有嵌入字幕、Logo和不明音乐；
- 文件名和标签能表达主体、动作、场景、情绪和授权；
- 同一语义有 3 个以上候选，避免反复使用同一镜头；
- 原文件只读，项目中始终“复制”而不是“移动”；
- 低置信度时允许缺素材，禁止用无关画面硬填。

#### 不适合直接自动化的情况

- 视频价值来自演员、采访对象或人物关系；
- 每条都需要全新的镜头语言和复杂转场；
- 画面必须精确对应事实、步骤或法律/医疗陈述；
- 素材库很小、没有分类或版权不清；
- 参考视频只能通过搬运其具体画面才能成立；
- 需要细腻喜剧节奏、情绪转折或跨镜头动作连续；
- 一条失败的品牌/事实表达会造成较高风险；
- 产量很低，搭建和维护脚本的时间超过手工制作。

### 对 AstrologyWiki 天象视频应如何改造原流程

AstrologyWiki 适合借用原工作流的工程框架，但不应原样复制“按颜色、亮度、构图复刻每条爆款”的核心匹配逻辑。

| 原流程步骤 | AstrologyWiki 是否保留 | 调整方式 |
|---|---|---|
| 每条拆解一个爆款参考视频 | **不作为日常步骤** | 只在建立模板时拆 1–3 条参考；之后复用固定 15 秒 recipe |
| 镜头切点和关键帧 | **保留一次** | 固化成栏目模板，不每条重新计算 |
| 按颜色/亮度/构图匹配 | **降为辅助** | 先按天象语义、准确性和授权过滤，再按颜色与构图排序 |
| 本地素材库 | **保留并扩展** | Pexels API 是外部候选源；通过审核的素材进入本地缓存库 |
| 低置信度标记缺素材 | **强制保留** | 语义或事实置信不足时停止，不能用通用银河画面硬凑 |
| TTS 真实时长校正 | **保留** | 暂用 Higgsfield Eleven v3；无时间戳时用本地 Whisper 对齐 |
| 自动预览和字幕 | **保留** | FFmpeg 直接生成成片和 SRT/ASS |
| 剪映草稿 | **第一阶段不做** | 简单 15 秒模板直接 FFmpeg 输出；异常项再进入 CapCut |
| 人工精修和审核 | **保留** | 核对天象事实、发音、素材误导、字幕和 CTA |
| 封装 Skill | **模板稳定后做** | Skill 在素材确认和最终播放处各停一次 |

因此，这套工作流对 AstrologyWiki 最合理的版本不是“每天找一条爆款再复刻”，而是：

```text
一次性研究爆款结构并冻结栏目模板
→ 每条读取已确认的天象脚本
→ 按语义从 Pexels + 已审核本地素材库找候选
→ Higgsfield Eleven v3 生成语音
→ FFmpeg 自动成片
→ 人工事实与视觉审核
```

### 当前不采用

- 不使用 HeyGen、Kling 数字人或其他对口型工具；本格式没有人物口型需求；
- 不用 Seedance、Veo、Grok、MiniMax Video 或 Higgsfield 生成日常背景；免费 Pexels 素材足以承担基线测试；
- 不把 Remotion 作为第一版；15 秒“背景 + 大字幕”用 FFmpeg 更轻、更便宜；
- 不自动决定或改写天象事实；事实、日期、角度和 CTA 必须先在主生产记录确认；
- 不自动发布 TikTok，保留人工观看和排期门。

### 建议试点

直接使用 W30 已选的三条官方号内容：

1. `Sun enters Leo`：深蓝星空 → 暖金光；
2. `Mercury Direct`：云层/夜空缓移 → 光线变清晰；
3. `Saturn Retrograde`：慢速深空/建筑阴影，测试更沉稳的视觉。

三条冻结同一声音、字体、字幕位置、转场、音量和 CTA 形式，只更换事实、脚本和素材标签。

## 2. 15 秒天象视频的硬要求

| 项目 | 固定要求 |
|---|---|
| 内容入口 | 只接受周计划中已 `selected`、已确认 Brief 和天象事实的 `content_id` |
| 时长 | 成片建议 14.5–15.5 秒；平台有其他要求时由生产记录覆盖 |
| 画幅 | 1080×1920，9:16，H.264 + AAC |
| 脚本 | 英文约 30–38 词；优先写出数字与日期的完整读法 |
| 结构 | Hook → 事件/日期 → 一句情绪或生活落点 → 画面 CTA |
| 视觉 | 1–3 段无人物或低风险 Pexels 素材；素材只负责氛围，不证明天象事实 |
| 声音 | 同一固定英语声音；清晰、自然、略有兴奋感，不做预言式戏剧腔 |
| 字幕 | 大字、手机可读；一次 1–2 行；不依赖素材内文字 |
| CTA | 15 秒内优先放画面 CTA，不强行塞入口播；例如 `Check where Leo falls in your chart` |
| 事实 | 精确日期、时区、星座和相位必须来自主生产记录的已核验来源 |
| 授权 | 保存 Pexels 页面、创作者、下载链接、抓取日期和使用片段 |
| 发布 | 自动化停在等待人工审核，不自动发布 |

建议时间结构：

| 时间 | 内容 | 视觉 |
|---|---|---|
| 0.0–2.5s | 6–8 词 Hook | 最强画面 + 大标题立即出现 |
| 2.5–6.5s | 天象事件与日期 | 星空/月亮/太阳/云层缓移 |
| 6.5–12.0s | 一句情绪或生活落点 | 第二段素材或同素材轻推镜 |
| 12.0–15.0s | 口播收束；CTA 以文字出现 | 画面停留，不再塞新事实 |

如果口播超过 15 秒，应先删词，不默认把 TTS 加速到不自然。建议语速最多调整到 `1.05–1.10`；仍超时时退回脚本确认。

## 3. Pexels 是否适合作为天象素材库

### 能力与成本

- Pexels API 和素材下载免费；
- 视频搜索端点支持 `query`、`orientation=portrait` 和尺寸过滤；
- 默认限额为 200 requests/小时、20,000 requests/月；
- 每页最多可返回 80 个结果；
- 官方建议缓存搜索响应约 24 小时；
- 对每条视频进行 2–4 个搜索请求，即使每月生产 100 条也远低于默认额度。

### 授权边界

Pexels 通用许可允许个人与商业使用、修改素材，且不强制署名。但 API 使用规范要求显著链接 Pexels，并尽可能署名创作者。因此自动化流程至少要保存：

```text
pexels_video_id
creator_name
creator_url
pexels_page_url
download_url
downloaded_at
used_from / used_to
content_id
```

推荐在内部 `source_manifest.csv` 完整保存；公开 Caption 是否附 `Footage: creator / Pexels` 可按平台长度决定。**“通用许可不强制署名”和“API 指南鼓励/要求链接”是两个不同层次，不应把前者理解成无需保留来源。**

禁止或高风险用法包括：

- 把未实质修改的素材重新销售或放进图库；
- 暗示素材中的人物或品牌为 AstrologyWiki 背书；
- 把可识别人用于负面、冒犯或敏感占星判断；
- 使用明显 Logo、商标、受保护建筑或作品却未额外核验；
- 批量收集 Pexels 素材建立 AI 训练/评测数据集；
- 只保存直链、不保存素材页面和作者，导致以后无法追溯。

### 对天象内容的视觉限制

Pexels 适合：

- 星空、银河、夜空、月亮、日出、金色光线、云层、城市夜景；
- 用颜色和运动表达“收缩 → 展开”“混乱 → 清晰”“压力 → 复盘”；
- 极简背景，承载大字幕和 CTA。

Pexels 不适合直接证明：

- 某颗行星真实位置；
- 某个相位或星盘结构；
- 准确星座、星座图案或行星运行方向；
- 具体天文事件的真实观测画面。

如果视频需要准确星图，应使用 AstrologyWiki 工具截图、经核验的星历图或自制 SVG 动画；Pexels 只作为氛围层。

### 推荐搜索词映射

| 天象语义 | 主搜索词 | 备选词 | 避免 |
|---|---|---|---|
| Sun / Leo / 可见度 | `golden sunrise`, `sun glow dark`, `warm starfield` | `golden light clouds` | 太阳表面伪科学特写、明显 AI 文字 |
| Moon / New Moon / 情绪 | `moon clouds night`, `dark blue night sky` | `ocean moonlight` | 错误月相特写 |
| Mercury Direct / 清晰 | `clouds clearing sunlight`, `night sky timelapse` | `light through clouds` | 倒放镜头暗示真实行星逆行 |
| Saturn / 边界 / 复盘 | `deep space slow`, `shadow architecture` | `dark planet space` | 把不明行星称为 Saturn |
| Venus / 关系 | `soft pink sky`, `golden hour silhouettes` | `flowers wind close up` | 可识别人脸、情侣背书暗示 |

## 4. 工具方案对比

| 工具/路线 | 作用 | 单条 15 秒现金成本 | 自动化程度 | 主要问题 | 当前判断 |
|---|---|---:|---|---|---|
| **Pexels API** | 搜索和下载氛围视频 | `$0` | 高 | 搜索相关不等于审美合格；需保存来源 | **必选素材源** |
| **ElevenLabs Flash/Turbo API** | 固定声音、TTS、字符级时间戳 | 约 `$0.01–0.013` | 高 | 同文本也可能有轻微语气差异 | **P0 默认配音** |
| **ElevenLabs Multilingual/v3** | 更高质量或更强表现力 | 约 `$0.02–0.025` | 高 | 单价约为 Flash 两倍；天象短片未必需要 | **P1 质量备选** |
| **MiniMax Speech Turbo** | TTS、语速控制和时间戳 | 约 `$0.011–0.013` | 高 | 需重新测试声音是否符合现有品牌 | **P1 替代配音** |
| **MiniMax Speech HD** | 更高质量 TTS | 约 `$0.018–0.022` | 高 | 成本优势不明显 | **按声音效果选择** |
| **Higgsfield API / Eleven v3** | 复用当前已有 API 生成语音 | 已有套餐内新增现金可能接近 `$0` | 中高，待实测 | 需确认音频下载、voice 参数、并发/限流和 credits；若无时间戳需本地对齐 | **当前 P0 临时配音** |
| **FFmpeg / ffprobe** | 裁切、拼接、字幕、混音、导出和检查 | `$0` | 高 | 模板代码要先搭好；视觉变化有限 | **P0 默认渲染器** |
| **CapCut Desktop** | 样片搭建、异常修正和人工微调 | 免费版可用 | 低 | 不适合稳定的无人值守批量 | **Canary/例外路径** |
| **Remotion** | React 动画、复杂品牌模板和数据可视化 | ≤3人主体可免费；4人以上自动化许可最低约 `$100/月` | 高 | 对当前简单格式过重；存在组织规模授权成本 | **第二阶段** |
| **AI 视频生成模型** | 生成独特宇宙镜头 | 依模型约 `$0.05–0.40+/秒` | 中 | 抽卡、事实错误、成本和一致性不稳定 | **只做特殊镜头** |

### 推荐工具组合

**当前零新增订阅组合**：

```text
Codex
+ Pexels API
+ Higgsfield API / Eleven v3
+ 本地 Whisper 字幕对齐
+ Python 3.9+
+ FFmpeg / ffprobe
+ 人工完整播放
```

若 Higgsfield 返回独立、可下载的音频文件并允许固定 voice/model/settings，就足以跑通 Canary。每次保存 API 响应、实际 credits、音频时长和 voice 参数；若接口不返回时间戳，则用本地 Whisper 对齐。

长期是否改为直连 ElevenLabs，再依据稳定性和实际 credits 决定。直连 ElevenLabs 的优势是：

- 当前官方 PAYG 价格清楚；
- 支持直接生成语音并返回字符级时间戳；
- 省掉 Whisper 二次转录；
- 可固定 Voice ID、速度和设置；
- 一条 15 秒视频的价格只有约一美分。

MiniMax 可使用同一脚本做一次声音对照。如果声音更符合 AstrologyWiki，成本差异小到不足以成为阻碍。

## 5. 推荐自动化工作流

### 5.1 脚本和事实确认门

Codex 读取唯一主生产记录，检查：

- `content_id`、目标账号和 `content_stage`；
- `script_status` 已确认；
- 天象事件、日期、时区和来源存在；
- 最终英语口播、屏幕 CTA 和 Caption 存在；
- 目标时长明确为约 15 秒；
- 本次允许使用的视觉语义标签存在。

未通过时不得自动缩写事实或猜测日期，只返回缺失项。

### 5.2 生成生产包

建议输出：

```text
output/transit-shorts/<content_id>/
├── input/
│   ├── narration.txt
│   ├── recipe.json
│   └── source_manifest.csv
├── candidates/
│   ├── contact-sheet.jpg
│   └── candidate-*.mp4
├── audio/
│   ├── voice.mp3
│   └── alignment.json
├── render/
│   ├── captions.ass
│   ├── preview.mp4
│   └── final.mp4
└── qc/
    ├── report.json
    └── checklist.md
```

`recipe.json` 至少包含：

```json
{
  "content_id": "aw-sun-enters-leo-2026",
  "duration_target": 15,
  "voice_provider": "elevenlabs",
  "voice_id": "fixed-astrologywiki-voice",
  "speech_speed": 1.0,
  "pexels_queries": ["golden sunrise", "warm starfield"],
  "visual_beats": [
    {"start": 0, "end": 6.5, "query": "dark blue starfield"},
    {"start": 6.5, "end": 15, "query": "golden sunrise"}
  ],
  "cta_text": "Check where Leo falls in your chart",
  "budget_usd": 0.10
}
```

### 5.3 配音与时长门

1. 使用固定 Voice ID 和固定设置生成语音；
2. 同时保存原文、音频和时间戳；
3. 用 ffprobe 读取真实时长；
4. 若语音为 11.5–14.5 秒，允许尾部留 CTA 停留；
5. 若超过约 15 秒，返回脚本缩短，不自动极端加速；
6. 如果天象术语或日期读错，修改发音词典或把数字写成完整单词后重试；
7. 同一条最多自动重试一次，避免无意义扣费。

### 5.4 Pexels 搜索与素材确认

1. 对每个视觉 beat 调用视频搜索；
2. 固定 `orientation=portrait`，优先 `size=medium/large`；
3. 过滤分辨率、时长、宽高比和重复素材；
4. 每个 beat 下载最多 3 个低码率候选；
5. 截取首、中、尾帧生成 contact sheet；
6. Codex/人工排除人物、Logo、错误星图、伪文字、闪烁和过度运动；
7. 选定后再下载最高可用分辨率文件；
8. 将搜索结果缓存 24 小时，相同 Batch 共用候选池；
9. 同一素材在近 10 条官方号视频中默认不重复。

### 5.5 FFmpeg 自动渲染

模板固定处理：

- 所有素材静音；
- 按 9:16 中心裁切并缩放到 1080×1920；
- 最多 2 次轻转场，避免模板感太重；
- 可做 1.00 → 1.04 的轻推镜，不做快速缩放；
- 优先使用供应商时间戳；Higgsfield 不返回时，用本地 Whisper 对齐后生成 ASS/SRT；
- 顶部保留事件名称/日期，中心放逐句大字幕，底部 CTA 避开 TikTok UI；
- 语音执行响度标准化，避免不同批次音量漂移；
- 不默认加 BGM，先建立“语音 + 画面”基线；需要 BGM 时必须使用有明确社媒许可的来源并单独记录。

### 5.6 自动检查与人工质检

自动检查：

- 1080×1920、9:16、帧率、编码；
- 时长 14.5–15.5 秒或生产记录允许范围；
- 存在 AAC 音轨且不是静音；
- 字幕最后时间不超过视频；
- 字幕、事件名和 CTA 不越安全区；
- 口播文本与确认稿一致；
- 每个使用素材都有来源记录；
- 预算未超出；
- 输出文件可完整解码。

人工仍需完整播放，检查：

- 天象日期、读音和字幕是否正确；
- Pexels 画面是否只是氛围，而没有暗示错误天文事实；
- 字幕是否可读、是否太快；
- 镜头是否有 Logo、人物、伪文字或突兀跳切；
- 语气是否像轻量分享，而不是绝对预测；
- CTA 是否自然且链接目标正确。

人工通过后才进入 `edited`。

## 6. 建议开发的脚本和 Skill

### 6.1 第一阶段脚本

| 脚本 | 作用 |
|---|---|
| `create_transit_project.py` | 按 `content_id` 建立目录并复制确认输入 |
| `build_transit_recipe.py` | 生成 15 秒 beat、查询词、字幕和预算 |
| `generate_tts.py` | Higgsfield/ElevenLabs/MiniMax provider、时间戳或 Whisper 对齐、重试和时长门 |
| `fetch_pexels_candidates.py` | 搜索、缓存、过滤、下载候选和保存来源 |
| `build_contact_sheet.py` | 提取候选首中尾帧供确认 |
| `render_transit_short.py` | 调用 FFmpeg 套模板导出预览和成片 |
| `validate_transit_short.py` | 检查视频、音频、字幕、来源和预算 |
| `batch_transit_shorts.py` | 对 3–5 条确认稿批量运行并停在人工审核 |

建议 Python 依赖：

```text
requests
python-dotenv
pydantic
Pillow
```

本地当前已确认：Python `3.9.6`、FFmpeg `7.1`、ffprobe `8.1.2`、Node `24.18.0` 可用。第一版可兼容 Python 3.9，不需要为了本任务先升级到 3.11。

### 6.2 Skill 边界

建议稳定后建立 `astrologywiki-transit-short-production` Skill：

1. 接收已确认的 `content_id`；
2. 检查事实、脚本和状态；
3. 生成生产包、配音和 Pexels 候选；
4. 第一次停在“等待素材确认”；
5. 确认后自动渲染和执行 QC；
6. 第二次停在“等待人工完整播放”；
7. 人工确认后才允许更新为 `edited`；
8. 不自动改天象事实、不自动决定 CTA、不自动发布。

第一阶段无需额外 Codex 插件；Pexels、Higgsfield/ElevenLabs/MiniMax 通过普通 REST API 即可。

## 7. 金钱成本

> 以下用 15 秒英文脚本约 180–220 个字符计算；人民币沿用 AI 口播报告的 `1 USD = 6.7917 CNY` 参考汇率。实际按脚本字符、重试、税费和账户价格为准。

### 单条边际成本

| 成本项 | 推荐方案 | 单条美元 | 约人民币 |
|---|---|---:|---:|
| Pexels 素材/API | 免费 | `$0` | `¥0` |
| 当前 TTS | Higgsfield API / Eleven v3 | 新增现金可能接近 `$0`；credits 待实测 | 按套餐折算 |
| TTS | ElevenLabs Flash | `$0.009–0.013` | `¥0.06–0.09` |
| TTS 高质量备选 | ElevenLabs Multilingual/v3 | `$0.018–0.025` | `¥0.12–0.17` |
| MiniMax 备选 | Turbo / HD | `$0.011–0.022` | `¥0.07–0.15` |
| FFmpeg 本地渲染 | 本机 | `$0`* | `¥0`* |
| 字幕时间戳 | ElevenLabs TTS 同次返回 | `$0` 额外费 | `¥0` |
| 存储/下载 | 本地小规模 | 接近 `$0` | 接近 `¥0` |
| **默认合计** | Pexels + Eleven Flash + FFmpeg | **约 `$0.01–0.013`** | **约 `¥0.07–0.09`** |
| **质量档合计** | Pexels + 高质量 TTS + FFmpeg | **约 `$0.02–0.025`** | **约 `¥0.14–0.17`** |

`*` 本地渲染没有按次工具费，但仍存在电脑、电力和存储成本，当前产量可忽略不计。

### 月度成本情景

| 月产量 | Eleven Flash | 高质量 TTS | Pexels + FFmpeg | 预计总边际现金 |
|---:|---:|---:|---:|---:|
| 12 条 | `$0.11–0.16` | `$0.22–0.30` | `$0` | 约 `$0.11–0.30` |
| 30 条 | `$0.27–0.39` | `$0.54–0.75` | `$0` | 约 `$0.27–0.75` |
| 100 条 | `$0.90–1.30` | `$1.80–2.50` | `$0` | 约 `$0.90–2.50` |

当前数量级下，配音差价几乎不会影响采购决策，应优先选择声音效果和时间戳稳定性。

### Remotion 成本边界

- 个人或不超过 3 人的主体可以免费商业使用；
- 4 人以上营利组织需要 Company License；
- 自动化视频生成器当前公开价为 `$0.01/render`，但最低 `$100/月`；
- 公司内部低量 Creator 方案为 `$25/月/seat`，仍受最低金额和具体许可选择影响。

因此在当前简单格式和产量下，没有理由为了渲染改用 Remotion。只有当字幕、星盘、行星轨道、数据和品牌动画复杂到 FFmpeg 模板难维护时，才重新评估。

## 8. 时间成本

### 一次性搭建

| 阶段 | 内部估算 | 交付 |
|---|---:|---|
| 半自动 Canary | 2–4 小时 | 固定字幕/颜色/音量模板，手工确认素材 |
| Pexels + TTS + FFmpeg MVP | 6–12 小时 | 单条从生产包到预览可跑通 |
| 批处理、缓存、去重和完整 QC | 追加 4–8 小时 | 3–5 条批次、安全重试、来源记录 |

### 稳定后的单条时间

| 环节 | 机器时间估算 | 人工时间估算 |
|---|---:|---:|
| 生产包与 TTS | 数秒至 1 分钟 | 0–1 分钟 |
| Pexels 搜索、下载和 contact sheet | 1–3 分钟 | 1–2 分钟确认 |
| FFmpeg 渲染与 QC | 1–3 分钟 | 0–1 分钟 |
| 完整播放和异常修正 | — | 1–3 分钟 |
| **合计** | **约 2–7 分钟** | **约 2–5 分钟** |

厂商没有为 Pexels 下载和 TTS 组合提供端到端 SLA，上表是当前本地小批量的运营估算。网络、4K 素材、下载失败或重选镜头会增加时间。

对比预期：

- 当前手工 Pexels + Higgsfield Voice + CapCut：约 10–25 分钟/条；
- 半自动模板：约 6–12 分钟/条；
- 稳定 API + FFmpeg：人工约 2–5 分钟/条。

真正节省的是找素材、重复排字幕和导出操作，不是脚本核验和最终观看。

## 9. 试点与放大条件

### 三条 Canary

| 测试 | 固定项 | 只变化项 | 记录指标 |
|---|---|---|---|
| Sun enters Leo | 声音、字体、模板、15秒 | 暖色素材和脚本 | 总时间、TTS时长、字幕可读性、素材匹配 |
| Mercury Direct | 同上 | “混乱→清晰”素材 | 搜索词命中率、是否出现误导性逆行视觉 |
| Saturn Retrograde | 同上 | 深色慢镜头 | 模板能否承载更沉稳内容、留存是否受影响 |

每条记录：

- Pexels 查询次数、候选数量、最终素材和来源；
- TTS 字符数、实际扣费、音频时长和重试次数；
- 机器处理时间、人工确认和修改时间；
- 自动 QC 结果；
- 发布后的 3 秒留存、平均观看时长、完播、收藏、评论和主页/链接行为；
- 是否因固定 15 秒而牺牲关键事实。

### 放大到批处理的门槛

满足全部条件才从 3 条扩大到每批 3–5 条：

- 第一版成片成功率 ≥80%；
- 单条人工时间稳定 ≤5 分钟；
- 没有素材授权和来源缺失；
- 字幕、日期和发音连续 3 条无严重错误；
- Pexels 至少 70% 的搜索能在 3 个候选内找到可用素材；
- 自动版的完播/平均观看时长不明显弱于手工模板；
- 15 秒确实适合该条内容，不把所有 Transit Explainer 强行缩短。

### 何时继续使用 CapCut

- 当前内容是第一次试新视觉；
- 需要手工 Mask、复杂调色、关键帧或特殊音效；
- Pexels 素材无法通过简单裁切形成自然画面；
- 需要平台内置且授权明确的音乐；
- 自动模板连续两次无法通过人工审核。

## 10. 主要风险

1. **把氛围素材当事实证据**：Pexels 星空不能证明具体行星位置或相位。
2. **15 秒压缩过度**：复杂外行星换座和多相位内容仍应使用 20–35 秒或更长格式。
3. **素材同质化**：长期只用银河和月亮会降低账号辨识度；稳定后应加入 AstrologyWiki 星图、SVG 和录屏资产。
4. **搜索词误导**：`retrograde` 可能返回倒放或科幻画面，不能暗示真实行星运动。
5. **来源记录缺失**：直链可能变化，必须同时保存素材页和作者。
6. **第三方权利**：Pexels 许可不自动解决 Logo、人物、建筑和作品的全部第三方权利。
7. **TTS 读音错误**：日期、星座、行星和度数要写成可朗读文本，并保留一次发音重试。
8. **模板感过强**：固定模板应冻结字体和布局，但素材颜色和节奏要按天象语义变化。
9. **自动化越过内容门**：脚本和事实未确认时不得自动生产。
10. **错误采购 Remotion**：团队规模和使用方式可能触发最低 `$100/月` 的公司许可。
11. **FFmpeg 合规**：本地内部使用的工具成本为零；若以后把 FFmpeg 嵌入并分发为产品，需重新检查 LGPL/GPL 和编解码器许可。
12. **自动完成不等于可发布**：人工完整播放和发布记录仍是硬门。

## 11. 最终判断

**适配，而且应优先于 AI 主播路线实现。**

推荐落地顺序：

```text
第1阶段：3条 CapCut 或现有模板 Canary，冻结视觉规范
→ 第2阶段：Pexels API + Higgsfield Eleven v3 + Whisper + FFmpeg 跑通单条
→ 第3阶段：补 contact sheet、来源 manifest、自动 QC
→ 第4阶段：3–5条 Batch
→ 数据证明模板有效后，再开发 AstrologyWiki 星图/SVG 资产层
```

这套流程的关键优势不是“AI 帮忙生成更炫的宇宙画面”，而是把免费合规素材、固定声音、大字幕和 15 秒结构变成可追溯、可重复、低边际成本的生产系统。

## 12. 主要公开来源

- Pexels API 文档、视频搜索、限额和链接规范：<https://www.pexels.com/api/documentation/>
- Pexels API 缓存和限额建议：<https://help.pexels.com/hc/en-us/articles/900006470063-What-steps-can-I-take-to-avoid-hitting-the-rate-limit>
- Pexels 素材许可：<https://www.pexels.com/legal-pages/license/>
- Pexels API 条款：<https://help.pexels.com/hc/en-us/articles/900005880463-What-are-the-Terms-and-Conditions>
- ElevenLabs API TTS 价格：<https://elevenlabs.io/pricing/api?price.platform=api>
- ElevenLabs TTS 模型、延迟和语言：<https://elevenlabs.io/docs/overview/capabilities/text-to-speech>
- ElevenLabs 带时间戳 TTS：<https://elevenlabs.io/docs/api-reference/text-to-speech/convert-with-timestamps>
- ElevenLabs Forced Alignment：<https://elevenlabs.io/docs/overview/capabilities/forced-alignment>
- MiniMax TTS 按量价格：<https://platform.minimax.io/docs/guides/pricing-paygo>
- MiniMax API 能力和时间戳：<https://platform.minimax.io/docs/api-reference/api-overview>
- MiniMax TTS API：<https://platform.minimax.io/docs/api-reference/speech-t2a-http>
- MiniMax rate limits：<https://platform.minimax.io/docs/guides/rate-limits>
- Remotion 公司许可和定价：<https://www.remotion.pro/license>
- FFmpeg 功能和工具：<https://ffmpeg.org/doxygen/6.1/md_README.html>
- FFmpeg 许可：<https://www.ffmpeg.org/legal.html>
- AstrologyWiki 当前 AI 短视频流程：[[inbox-pengman/04-production/00-evergreen-workflows/ai-short-video-production-workflow]]
- AstrologyWiki 四账号打法：[[inbox-pengman/04-production/01-strategy-and-platform-research/four-account-tiktok-content-playbook]]
- W30 周度计划：[[inbox-pengman/04-production/04-weekly-content-plans/2026-W30 周度内容计划]]
- Sun enters Leo 当前制作方案：[[inbox-pengman/04-production/07-content-production/2026-07-21 Sun Enters Leo 视频制作方案]]
- 对照参考：[[inbox-pengman/05-调研资料/工具调研/视频与视觉/Codex 自动化剪辑用于 AI 口播调研报告]]
