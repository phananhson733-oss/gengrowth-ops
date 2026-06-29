---
title: Golpo 视频生成工具调研
project: astrologywiki
type: tool-research
status: draft
owner: Pengman
updated: 2026-06-29
---
https://video.golpoai.com/share/cdf1e4d0-9563-4ffc-bcbe-0e88f9999848?version=0
# Golpo 视频生成工具调研

> 本文根据目前收集到的 Golpo 调研结果整理。当前重点判断：Golpo 是否适合 AstrologyWiki 的短视频 / 科普解释视频，以及是否值得用 Codex 自动化。

## 1. Golpo 是什么

Golpo 是一个 AI 白板动画 / 解释型视频生成工具，可以把 prompt、脚本、PDF、DOCX、PPTX、TXT、音频等内容转成视频。

它更接近：

> 自动生成信息图动画、白板动画、科普解释视频的工具。

而不是 Kling / Runway 那类真实感视频生成工具。

它主打：

- 白板动画 / 手绘线稿风格；
- editorial / minimal / technical / playful 等解释型风格；
- 自动生成脚本、配音、字幕、画面和时间轴；
- 输出 MP4；
- 支持 16:9 长视频和 9:16 竖屏短视频。

## 2. 它和 Claude Code / Codex 的关系

Danny Why 视频里使用的是 Golpo AI + Claude Code Skill。

本质流程是：

```text
用户输入自然语言需求
→ Claude Code 理解需求
→ Golpo Skill 转成 API 参数
→ Golpo 后端生成脚本 / 配音 / 画面 / 动画 / 时间轴
→ 下载 MP4
```

Claude Code 不是自己做动画，而是在调用 Golpo。

根据调研，Golpo 的插件 / skill 底层是 Python helper，负责：

- 检查 Python 和 requests；
- 保存 API Key；
- 上传文件；
- 提交生成任务；
- 轮询任务状态；
- 下载 MP4 到本地目录。

## 3. 能否用 Codex 代替 Claude Code

可以。

调研结果显示，Golpo 官方 GitHub 仓库写的是：

> Golpo Plugin for Claude Code and Codex

也就是说，同一个插件理论上支持 Claude Code 和 Codex。

Codex 路线大概是：

```text
安装 Golpo Codex 插件
→ 配置 Golpo API Key
→ 用 Codex 提交 prompt / 脚本 / 文件
→ Golpo 生成视频
→ Codex 轮询并下载 MP4
```

所以没有 Claude 会员不是致命问题。但关键限制是：仍然需要 Golpo API Key 和 API 额度。

## 4. 成本判断

> 以下是本次调研记录的价格和积分估算，后续实际付款前仍需以 Golpo 官网当时的套餐和账单为准。

Golpo 的核心计费逻辑比较清楚：

> **1 credit = 1 分钟视频。**

这意味着它比 Higgsfield 简笔画素材路线更贵，但比高精真人数字人路线更省事，适合直接生成白板动画 / 解释型视频成品。

### 4.1 订阅套餐

| 套餐 | 月费 | 包含积分 / 时长 | 折合单价 | 主要限制 / 权限 |
|---|---:|---:|---:|---|
| Free | $0 | 1 credit / 1 分钟 | $0 | 有水印，无法下载，仅试用。 |
| Starter | $39.99 | 20 credits / 20 分钟 | 约 $2.00 / 分钟 | 无水印，单支最长 2 分钟；功能限制较多。 |
| Creator | $99.99 | 60 credits / 60 分钟 | 约 $1.66 / 分钟 | 支持竖屏短视频、多语言变体。 |
| Growth | $199.99 | 150 credits / 150 分钟 | 约 $1.33 / 分钟 | 支持彩色视频、更多手绘风格、单支最长 4 分钟、可修改脚本。 |
| Business | $499.99 | 390 credits / 390 分钟 | 约 $1.28 / 分钟 | 支持声音克隆、上传自有配音、单支最长 10 分钟、团队协作。 |
| Scale | $999.99 | 800 credits / 800 分钟 | 约 $1.25 / 分钟 | 原生包含 API 权限、角色一致性、支持更大团队。 |

避坑：如果要做竖屏短视频矩阵，至少需要关注 Creator；如果要彩色、多风格、可改脚本，可能要到 Growth。

### 4.2 Pay-As-You-Go 零售积分

如果不想按月订阅，可以单买积分包：

| 积分数量 | 单价 | 说明 |
|---|---:|---|
| 1–19 credits | $5.99 / credit | 偶尔测试成本较高。 |
| 20–99 credits | $4.99 / credit | 临时加量。 |
| 100+ credits | $3.99 / credit | 仍不包含 API access。 |

Pay-As-You-Go 适合偶尔测试，但单分钟成本高于订阅。

### 4.3 API 自动化价格

如果要用 Codex / Claude Code 插件做自动化批量生成，需要 API access。

调研到的三种路径：

| API 路径 | 成本 | 说明 |
|---|---:|---|
| Scale 套餐 | $999.99 / 月 | 直接包含 API，内含 800 分钟额度。 |
| Business + API 插件 | $499.99 / 月 + $200 / 月 | 在 Business 基础上加购 API。 |
| API Only | $200 / 月起 | 不用网页端后台，按量阶梯计费。 |

API Only 阶梯：

| 月消费 | 单价 |
|---|---:|
| $0–$1,000 | $2.00 / 分钟 |
| $1,001–$5,000 | $1.50 / 分钟 |
| $5,001+ | $1.20 / 分钟 |

结论：API 单分钟不算离谱，但**最低 $200 起步**，不适合第一阶段只做 2–3 条小样。

### 4.4 扣费暗坑

需要注意两点：

1. **按目标时长扣费**  
   生成前指定 4 分钟，即使最终视频是 3 分 50 秒，也按 4 credits 扣。

2. **二次编辑扣费**  
   如果对已生成视频做 frame-by-frame 修改，同一版本内改 1 帧和改 10 帧都可能按整条视频时长重新扣一次。比如 3 分钟视频改一下，可能再次扣 3 credits。

所以自动化脚本不能无限试错，prompt、时长和脚本结构要先稳定。

### 4.5 成本结论

当前建议：

- 第一阶段不要直接走 API；
- 先用 Free / Pay-As-You-Go / 低档网页端测试 2–3 条；
- 如果需要竖屏短视频，关注 Creator 起步；
- 如果需要彩色、多风格和脚本修改，关注 Growth；
- 只有在视频质量稳定、确定要批量生产后，再考虑 API 自动化。

一句话：

> Golpo 的成本介于 Higgsfield 简笔画素材和 Higgsfield 数字人之间：比简笔画贵，但省掉大量剪辑和画面生成步骤；比数字人便宜，也更适合解释型科普内容。

## 5. 难易度判断

| 使用方式 | 难度 | 适合阶段 |
|---|---|---|
| Golpo 网页端手动生成 | 低 | 第一阶段验证质量 |
| Codex + Golpo Plugin | 中等 | 第二 / 第三阶段自动化 |
| 大规模 API 自动化 | 中到高 | 质量稳定后再考虑 |

对当前工作来说，最大难点不是安装，而是：

- API 成本和门槛；
- prompt 不稳定导致返工；
- 返工 / 编辑可能继续消耗 credits；
- 生成结果是否符合 AstrologyWiki 品牌调性；
- 是否能稳定做英文短视频、字幕和配音。

## 6. 对 AstrologyWiki 的适配判断

Golpo 非常适合解释型、科普型、白板型、概念图解型视频。

适合主题：

- What is a birth chart?
- Sun, Moon, Rising 有什么区别？
- 为什么同一个星座的人差异很大？
- 用 60 秒解释 Mercury Retrograde
- Birth chart is not a destiny verdict
- Patterns, not predictions

不太适合：

- 高级品牌感大片；
- 复杂人物肖像；
- 强视觉冲击型热点视频；
- 需要精确星盘截图和符号位置的内容；
- 需要大量后期风格控制的视频。

更准确的定位是：

> Golpo = 解释型短视频一站式生成工具；CapCut / Canva = 后期修正和品牌统一工具。

## 7. 和 Higgsfield 的区别

| 工具 | 更适合做什么 | 当前定位 |
|---|---|---|
| Higgsfield | 单张或多张视觉素材、插画、简笔画、抽象画面 | 视频素材生成工具 |
| Golpo | 从脚本直接生成解释型 / 白板动画 MP4 | 一站式解释视频生成工具 |
| CapCut | 剪辑、字幕、节奏、二次包装 | 成片修正工具 |
| Canva | 图文、封面、品牌模板 | 品牌视觉工具 |

简单理解：

- Higgsfield 更像“帮我生成画面素材”；
- Golpo 更像“帮我直接生成一条解释视频”。

## 8. 推荐测试顺序

不建议一上来走 Codex + API 自动化路线。

更适合的测试顺序是：

```text
第一阶段：网页端手动测试 2–3 条
→ 第二阶段：总结稳定 prompt 模板
→ 第三阶段：如果效果稳定，再考虑 Codex + API 自动化
```

### 第一阶段测试建议

先做 2–3 条 15–30 秒视频：

1. What is a birth chart?
2. Sun, Moon, Rising explained in 30 seconds
3. Astrology is for self-understanding, not prediction

每条测试关注：

- 英文配音是否自然；
- 字幕是否准确；
- 画面是否清楚；
- 节奏是否适合 Shorts / TikTok；
- 是否需要大量 CapCut 二次修改；
- 是否比 Canva + CapCut 手工制作更省时间。

## 9. 初步结论

Golpo 可行，尤其适合 AstrologyWiki 的基础科普、占星 + 自我认知、解释型短视频。

但当前建议是：

- **先用网页端测试，不要直接买 API；**
- **先测试 2–3 条 15–30 秒视频；**
- **确认效果稳定后，再考虑 Codex 插件自动化；**
- **即使使用 Golpo，也要保留 CapCut / Canva 做后期统一和品牌修正。**

一句话结论：

> Golpo 比 Higgsfield 更像“自动做完整解释视频”的工具，适合先小规模试水；Codex 路线可行，但 API 起步成本偏高，不适合第一步就上。
