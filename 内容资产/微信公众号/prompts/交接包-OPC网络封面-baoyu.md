---
title: 生图交接包 —— OPC网络封面（委托 baoyu）
date: 2026-07-15
author: Lynne
type: image-handoff
status: draft
publish: false
关联文章: 工作台/content/wechat/【草稿】AI没让一个人变成一家公司，它正在让公司变成一张网-人话版.md
关联prompt: 内容资产/微信公众号/prompts/配图提示词-OPC网络.md
---

# 生图交接包 —— OPC 网络封面

> 用途：在**已安装 baoyu skills** 的环境里，一次到位生成本篇封面（可选 1 张正文插图）。
> 本机（写作环境）未装 baoyu，故命令行参数请在目标环境 `--help` 复核，已标「⚠待确认」。

---

## 1. 交付目标

- **必出**：1 张封面，2.35:1，2560×1088，无任何文字。
- **可选**：1 张正文插图，16:9，1920×1080，无任何文字。
- **做法**：封面默认 **nano banana + GPT Image 双模型各出一版**，再按第 4 节验收标准选优。

## 2. GenGrowth 视觉预设（喂给 baoyu 的"风格锁"）

| 维度 | 值 |
|---|---|
| aspect（封面） | `2.35:1`（像素 2560×1088） |
| aspect（插图） | `16:9`（像素 1920×1080） |
| palette | 深石墨灰背景（dark graphite）；点缀低饱和青蓝 / 淡青绿 / 橙黄 / 米白；焦点琥珀金 / 暖白 |
| rendering | 高级手绘战略图（hand-drawn strategic diagram），米白线条为主 |
| text | `none`（一律无任何文字、不写任何字符） |
| mood | 克制、战略感 |

## 3. 封面 Prompt

### 3a. 中文版

```
微信公众号封面图，2.35:1比例，无任何文字。
延续GenGrowth成长笔记统一视觉风格（深石墨灰背景，高级手绘战略图风格，米白线条为主）。
构图：左侧一个僵硬的大块（占30%）→ 中央边界松动、解体成发光节点（占40%）→ 右侧一张成型的专业节点网络（占30%）。
左侧画面：手绘风格的一整块"大而全的组织"——密集堆叠、棱角僵硬的矩形群，像一座科层金字塔或一整面砖墙，线条厚重、内部拥挤没有缝隙。块体右缘开始出现细小裂缝。
中央焦点：那个大块向右解体——边缘的矩形脱落、变薄，化成一个个独立的圆形发光节点；多条米白细线从这些节点汇聚，向中心一个圆形漩涡收拢，漩涡内核是琥珀金/暖白发光效果，象征"一群独立专业个体围绕一个共同结果点亮协作"的瞬间，光晕清晰，在深色背景上形成强视觉焦点。
右侧输出：一张已经成型的网络——五六个大小相近、地位平等的独立圆形节点，用清晰的米白连线互相插接成网状（不是自上而下的树状层级），每个节点内嵌一个不同的手绘专业图标（一条上扬的增长曲线、一个放大镜、一个齿轮、一支画笔、一个终端光标）；节点之间留有充足间距，连线干净利落。
配色：背景始终深石墨灰；不同节点边框和图标用低饱和青蓝、淡青绿、橙黄、米白各自区分；中心汇聚焦点用琥珀金/暖白。
整体无任何文字，不写任何字符。
```

### 3b. English version（喂 Gemini / GPT Image 更稳）

```
WeChat article cover image, 2.35:1 aspect ratio, absolutely no text or characters anywhere.
GenGrowth visual language: dark graphite background, premium hand-drawn strategic-diagram style, off-white line work.
Composition, three zones left to right: a rigid monolithic block (~30%) -> the block loosening and dissolving into glowing nodes (~40%) -> a fully formed network of independent professional nodes (~30%).
Left: a single hand-drawn "big all-in-one organization" — a dense stack of rigid sharp-cornered rectangles, like a hierarchical pyramid or a brick wall, heavy crowded lines, no gaps inside; the right edge starting to show fine cracks.
Center (focal point): the block dissolving toward the right — edge rectangles detaching and thinning into individual round glowing nodes; multiple thin off-white lines converge from these nodes into a circular vortex whose core glows amber-gold / warm white, symbolizing a group of independent specialists lighting up collaboration around one shared outcome; clean halo, a strong focal point on the dark background.
Right: an already-formed network — five or six independent round nodes of similar size and equal standing, connected by clean off-white lines into a mesh (not a top-down tree hierarchy); each node holds a different hand-drawn professional icon (an upward growth curve, a magnifying glass, a gear, a paintbrush, a terminal cursor); generous spacing, crisp lines.
Colors: background always dark graphite; node borders and icons in low-saturation cyan-blue, pale teal, amber-yellow, off-white; central convergence point in amber-gold / warm white.
No text, no characters at all.
Overall: a big all-in-one organization, its boundary thinning and loosening, scattering into a network of independent professional nodes plugged together around a shared outcome.
```

## 4. baoyu 调用建议

### 路线一：`baoyu-cover-image`（自带封面维度系统，推荐先试）
按第 2 节预设映射维度：`aspect=2.35:1`、`palette=深石墨灰系`、`rendering=手绘`、`text=none`、`mood=克制/战略感`，prompt 用第 3 节。⚠待确认：该 skill 的确切 flag 名。

### 路线二：`baoyu-imagine` 双模型各出一版（封面权重高，建议双出选优）
skill 明确的用法是同一 prompt 换 provider/model：

```bash
# nano banana（Google）
baoyu-imagine --provider google --model gemini-3.1-flash-image-preview \
  --aspect 2.35:1 --prompt "<第3节 prompt>"        # ⚠ --aspect/--prompt 参数名待确认

# GPT Image（OpenAI）
baoyu-imagine --provider openai --model gpt-image-1.5 \
  --aspect 2.35:1 --prompt "<第3节 prompt>"
```

两版都拿到后，按第 5 节选更贴规范的那版。出图若超微信体积限制，用 `baoyu-compress-image` 压到合规。

## 5. 验收标准（选优/返工依据，来自 image-style.md）

- [ ] 背景是**深石墨灰**，不是纯黑/纯白？
- [ ] **无任何文字/字符**？（有字直接废）
- [ ] 手绘战略图质感、米白线条为主？
- [ ] 三段式成立：左"僵硬大块" → 中"解体+琥珀金汇聚焦点" → 右"平等节点组成的网"？
- [ ] 右侧是**网状**（去中心、节点平等），不是自上而下的树/金字塔？
- [ ] 焦点是琥珀金/暖白的**汇聚点**，视觉重心清楚？
- [ ] 点缀色只用低饱和青蓝/淡青绿/橙黄/米白，没有花哨高饱和色？

最多返工 1–2 轮：不满意就把问题写成优化 prompt 交回对应 baoyu skill，别进"生成→不满意→重描述"的死循环。

## 6. 可选正文插图

若要第 2 张图，prompt 见 `内容资产/微信公众号/prompts/配图提示词-OPC网络.md` 第 2 节（"大块 vs 网络"对比图，16:9），走 `baoyu-article-illustrator` 或 `baoyu-infographic`，同一套视觉预设。本文最多 1 封面 + 2 插图，宁缺毋滥。
