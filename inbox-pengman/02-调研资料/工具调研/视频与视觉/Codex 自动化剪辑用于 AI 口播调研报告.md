---
title: Codex 自动化剪辑用于 AI 口播调研报告
project: astrologywiki
type: tool-workflow-research
status: draft
owner: Pengman
updated: 2026-07-22
target_account: "@miraaastrology"
---

# Codex 自动化剪辑用于 AI 口播调研报告

> **一句话结论：当前最稳妥的批量方案是“HeyGen API + Codex 批处理 + 人工质检”，因为固定 Miraa 人物、声音和一分钟连续口播已经跑通，约 `¥20.38/分钟`；若只追求最低现金成本且可接受手工操作，继续使用 HeyGen Creator 网页端。Kling Avatar API 可自动化但 Standard 约 `¥22.90/分钟`，暂时没有成本优势；Seedance、Grok、Veo、MiniMax 即使切段拼接，也更适合 Hook 和 B-roll，不适合作为固定 Miraa 主口播。**

## 1. 决策摘要

### 当前采用

```text
确认脚本
→ Codex 生成生产包
→ HeyGen 网页端固定 Mira 模板生成
→ Codex 自动生成动态字幕并检查文件
→ CapCut 少量调整
→ 人工完整播放质检
→ edited / scheduled
```

### 大批量生成 Miraa 视频用什么

**正式结论：大批量、低接触生产优先采用 `HeyGen API + Codex 批处理 + 人工质检`；预算优先且数量不大时继续使用 HeyGen Creator 网页端。**

判断依据：

- Miraa 需要长期固定同一人物、声音、背景和9:16规格，HeyGen当前最稳定；
- HeyGen API链路已经实测跑通，可以自动提交、轮询、下载、生成字幕、执行QC并按 `content_id` 保存；
- Kling Avatar V2虽有可调用API，但fal Standard约 `¥22.90/分钟`，略高于HeyGen Photo Avatar API约 `¥20.38/分钟`，目前不是降本方案；
- 短视频模型需要把一分钟脚本拆成4–10段，身份、声音、背景和动作更容易出现接缝；
- API节省的是操作时间，不保证画质提高，也不替代人工完整播放。

| 生产需求 | 最佳方案 | 约1分钟成本 | 判断 |
|---|---|---:|---|
| 每月1–30条、可手工操作 | **HeyGen Creator网页端 + Codex字幕/QC** | 额度充分使用约 `¥6.57` | 当前现金成本最低 |
| 每月30条以上、多账号或要求无人值守 | **HeyGen API + Codex批处理** | Photo Avatar约 `¥20.38` | 当前综合最优，已经跑通 |
| 想测试HeyGen替代品 | Kling Avatar V2 Standard API | 约 `¥22.90` | 可自动化，但现价没有成本优势 |
| 已有可复用Miraa底片 | Vidu Lip Sync | 对口型约 `¥8.15`，另加底片 | 可能是最低API路径，但依赖底片 |
| 需要视觉Hook或星座场景 | Grok、MiniMax或Seedance | 约 `¥13–124/60秒素材` | 只做短镜头，不做完整主播 |

推荐批量流程：

```text
一次确认3–5条脚本
→ 第一条先做8–12秒语速Canary
→ 检查批次预算
→ HeyGen API并发提交
→ Codex自动下载、对齐脚本、生成动态字幕和QC
→ 人工逐条完整播放
→ 仅通过项进入edited
```

只有当Kling、Vidu等方案完成同图同音频测试，并且把失败重试和人工修正计入后仍更便宜或质量明显更好，才替换HeyGen。Seedance、Grok、Veo、MiniMax和Higgsfield不承担固定Miraa批量主片。

### 当前不采用

- 不把 HeyGen 普通 API 作为日常小批量默认路径：约 `¥20.38/分钟`，比网页套餐贵，并与 Creator 套餐分开扣费；
- 不用 Seedance、Grok、Veo、MiniMax 拼接整条 Mira 口播；
- 不使用 Higgsfield 批量生成固定主播全片；
- 不自动发布，保留人工审核；
- 不开发易受 CapCut 版本影响的草稿文件生成器。

### 下一步

1. 继续使用已经购买的 HeyGen Creator；
2. 用同一 Mira 图、同一音频测试 Kling 数字人；
3. 有稳定 Mira 底片时测试 Vidu Lip Sync；
4. 每次只换一个工具，不同时改声音、主播、字幕和剪辑方式。

## 2. Miraa 对口播工具的硬要求

Miraa 当前内容形式相对固定：同一主播、同一声音、深色背景、大字幕、9:16、约 55–60 秒，不使用口播 CTA。

合格工具必须做到：

- 输入最终脚本或最终音频；
- 准确对口型；
- 复用固定 Mira 人物和声音；
- 支持约 1 分钟输出，或不会因切段造成明显人物漂移；
- 可商用、无明显水印；
- 生成结果可进入现有 CapCut 模板；
- 实际扣费和失败重试可记录。

“能生成一个人在说话”不等于“能稳定生成 Mira 口播”。短视频生成模型如果不能接受指定音频、不能保持 60 秒身份一致，就只能作为素材工具。

## 3. 对口型/数字人方案总表

> 人民币按 2026-07-21 中间价 `1 USD = 6.7917 CNY` 折算。套餐单价假设额度全部用完；不含税费、失败重试和人工。网页优惠价、官方企业价与第三方API价必须分开看。

| 工具                               | 能做什么                               |                            约 1 分钟成本 | 主要问题                          | Miraa 可行性       |
| -------------------------------- | ---------------------------------- | ----------------------------------: | ----------------------------- | --------------- |
| **HeyGen Creator 网页端**           | 固定 Avatar + 脚本/声音；稳定生成约 1 分钟主播     | `$29/月`≈`¥197`；充分使用约 **`¥6.57/分钟`** | 用不完额度时单价上升；需要人工操作             | **P0，当前经济默认**   |
| **HeyGen Photo Avatar API**      | 自动提交、轮询、下载；已完成实测                   |                   **约 `¥20.38/分钟`** | 与 Creator 套餐分开计费；质量不会因API自动提高 | **P0，当前批量默认**   |
| **Kling 数字人网页/人民币活动价**           | 人物图 + 文字/音频，生成数字人口播                |              公开优惠最低约 **`¥7.20/分钟`** | 不是稳定API报价；不同账户和模式扣费可能不同       | **P1，低价手工测试**   |
| **Kling Avatar V2 API Standard** | 图片 + 固定音频，自动生成对口型视频                |       `$0.0562/秒`，约 **`¥22.90/分钟`** | fal合作方价格；尚未用Miraa实测           | **P1，可自动化备选**   |
| **Kling Avatar V2 API Pro**      | 同上，面部细节和口型质量更高                     |        `$0.115/秒`，约 **`¥46.86/分钟`** | 成本约为Standard两倍                | **P2，高质量测试**    |
| **Vidu Lip Sync**                | 已有视频 + 音频/文字；一次处理整条口播              |                    **约 `¥8.15/分钟`** | 只含对口型；需要稳定Miraa底片             | **P1，有底片时优先**   |
| **D-ID Launch**                  | Photo/Video Avatar + 脚本；网页/API共用余额 |              年付充分使用约 **`¥5.30/分钟`** | 需年付约 `¥2,853`；Launch有AI水印     | **P2，账面便宜但有硬伤** |
| **PixVerse Lip Sync**            | 已有视频 + 音频；专用对口型接口                  |             **约 `¥10.87–16.30/分钟`** | 单段最长30秒；至少切两段；不含底片            | **P2，Vidu备选**   |
| **Hedra Character-3**            | 人物图/固定角色 + 脚本或音频                   |            Creator约 **`¥13.58/分钟`** | credits不结转；模型费率不同             | **P2，按表现力测试**   |
| **Synthesia Starter**            | 企业型Avatar、声音克隆、多语言                 |                   约 **`¥19.70/分钟`** | `$29/月`仅10分钟；偏培训视频            | **P3，无明显优势**    |
| **Captions API**                 | AI Twin + 对口型 + 自动字幕/B-roll/编辑     |                   约 **`¥20.38/分钟`** | 自动编辑会同时改变多个变量                 | **P3，一键成片时再考虑** |
| **Tavus Starter**                | Replica + 异步视频/实时交互                |                   约 **`¥40.07/分钟`** | 当前场景过重                        | **不建议**         |
| **Higgsfield**                   | 图片/角色 + 声音，擅长电影化动作                 |                 当前套餐 `$59/月`；无法稳定折算 | credits消耗和返工波动大               | **只做特殊镜头**      |

### 完整口播成本与批量判断

- **最低现有现金成本：HeyGen Creator网页端**，约 `¥6.57/分钟`，但需要手工操作；
- **综合最好的批量API：HeyGen Photo Avatar API**，约 `¥20.38/分钟`，已经跑通；
- **最值得继续测试的替代API：Kling Avatar V2 Standard**，约 `¥22.90/分钟`，当前不比HeyGen API便宜；
- **有稳定底片时的潜在最低API：Vidu Lip Sync**，口型约 `¥8.15/分钟`，但必须另算底片制作与维护；
- D-ID账面单价低，但年付和水印使它不适合作为当前默认方案。

## 4. 短视频生成模型：分割脚本再拼接的成本

这些模型可以生成人物、对白或电影化画面，但不等于固定数字人口播。下表按60秒最终素材、`1 USD = 6.7917 CNY`计算；“含50%重做”表示有一半片段需要重新生成一次。

| 模型/API | 拆分方式 | 60秒一次成功 | 含50%片段重做 | 对Miraa口播的判断 |
|---|---:|---:|---:|---|
| **Kling 3.0 Audio On** | 4×15秒或6×10秒 | 约 `¥68.46` | 约 `¥102.69` | 没有人物元素时身份难固定 |
| **Kling 3.0 Voice Control** | 同上 | 约 `¥79.87` | 约 `¥119.81` | 可控声音，但加入人物Elements后约翻倍 |
| **Seedance 2.0 Fast 720p** | 4×15秒或6×10秒 | 约 `¥98.57` | 约 `¥147.86` | 支持对白和音频参考，但跨段一致性仍有风险 |
| **Seedance 2.0 Standard 720p** | 同上 | 约 `¥123.62` | 约 `¥185.43` | 价格高于数字人API，不适合整条日常口播 |
| **MiniMax Hailuo 2.3 Fast 768p** | 6×10秒 | 约 `¥13.04` | 约 `¥19.56` | 不含固定音频对口型；还要另接TTS/Lip Sync |
| **Grok Imagine 480p** | 4×15秒或6×10秒 | 约 `¥20.38` | 约 `¥30.57` | 文档无指定最终音频的专用Lip Sync，只做B-roll |
| **Grok Imagine 720p** | 同上 | 约 `¥28.52` | 约 `¥42.78` | 同上，分辨率提高但口播问题不变 |
| **Gemini/Veo 3.1 Fast 720p** | 8×8秒，实际生成64秒 | 约 `¥43.47` | 约 `¥65.21` | 拼接次数多，声音和人物难连续 |

拆分本身不会降低按秒计费模型的基础费用：4个15秒与6个10秒总生成时长相同。它的好处是某段失败时只重做该段；代价是人物脸型、服装、声音、背景和动作更容易跳变。Veo因固定8秒片段生成64秒，还会产生约6.7%的时长溢出。

因此，短视频模型的合理用途是生成5–15秒Hook、星座情绪镜头和B-roll；完整Miraa口播仍应由HeyGen、Kling Avatar或“稳定底片 + Lip Sync”完成。

## 5. 四种主要路径对比

| 维度 | HeyGen 网页端 | HeyGen API | Kling Avatar API | Higgsfield |
|---|---|---|---|---|
| 核心价值 | 低成本固定主播 | 无人值守、并发、批量记录 | 图片+固定音频自动对口型 | 电影化镜头和特殊视觉 |
| 约1分钟成本 | `¥6.57`（额度用满） | Photo Avatar `¥20.38` | Standard `¥22.90`；Pro `¥46.86` | 当前无法稳定预测 |
| 操作 | 手动粘贴、生成、下载 | 自动提交、轮询、下载 | API自动提交和下载 | 选择模型并反复试生成 |
| 当前证据 | 已稳定使用 | 已完成Miraa实测 | 有接口和报价，未做Miraa实测 | 已购套餐，但credits消耗过快 |
| 当前定位 | **默认经济路径** | **批量综合最优** | **下一API备选** | **特殊素材路径** |

HeyGen API和Kling Avatar API的购买理由都是节省人工、支持并发和形成可记录的生产链路，不是单分钟更便宜。按当前第三方报价，Kling Standard比HeyGen Photo Avatar API约贵12%，因此不能把Kling网页活动价当作API批量成本。Higgsfield不适合固定人物的一分钟连续口播。

## 6. Codex 自动化工作流

### 输入

- 已确认的 `content_id` 和脚本；
- 固定 Mira Avatar、Voice、背景和输出规格；
- 可选 B-roll 标签；
- 单条预算上限。

### 自动处理

1. 检查脚本是否已确认；
2. 生成 `script.txt`、`recipe.json`、Caption 和质检表；
3. 网页路径：等待人工生成并放入成片；API路径：自动提交、轮询、下载；
4. Whisper 获取词级时间戳，但字幕文字仍以确认稿为准；
5. 生成 SRT/动态字幕并用 FFmpeg 编码；
6. 检查分辨率、时长、音轨、字幕结束时间、脚本对齐率和文件完整性；
7. 停在等待人工质检，不自动发布。

### 人工保留

- 最终脚本确认；
- 完整播放，检查口型、发音、眼神、牙齿、脸型、字幕遮挡和画面漂移；
- 少量 CapCut 调整；
- 发布、记录真实直链和复盘。

## 7. 已完成的 HeyGen API 实测

2026-07-22 使用已确认的132词 Scorpio 第三条脚本，跑通：

```text
HeyGen Avatar IV API
→ 自动下载
→ Whisper 词级对齐
→ 动态字幕
→ FFmpeg 成片
→ 自动 QC
```

| 指标 | 实测结果 |
|---|---:|
| 成片时长 | 49.58 秒 |
| API 钱包扣费 | `$2.45`，约 `¥16.64` |
| HeyGen 生成 | 3分40秒 |
| 实测端到端 | 6分56秒 |
| 自动化后预计计算时间 | 约5–6分钟 |
| 加人工完整质检 | 约8–12分钟/条 |
| 脚本/ASR词级匹配 | 98.1% |
| 技术状态 | `technical_pass` |
| 生产状态 | `production_pending_human_review` |

同一脚本的 API 成片比既有网页成片长 17.9%：网页约42.05秒，API为49.58秒。原因主要是语速和停顿差异，不是脚本不同。下一次只做8–12秒低成本 Canary 校准速度；不能假设 API 的 `speed: 1` 会复现网页端。

实测产物：`inbox-pengman/output/ai-host-automation/2026-07-22-scorpio-full-validation/`

## 8. 所需工具、脚本和 Skill

### 工具

| 工具 | 用途 | 费用/状态 |
|---|---|---|
| Codex | 生产包、调用流程、字幕、检查 | 使用现有套餐 |
| HeyGen Creator | 当前 Mira 主播 | `$29/月` |
| CapCut Desktop | 最终编辑和人工质检 | 免费版可用 |
| Python 3.11+ | 自动化脚本 | 免费 |
| FFmpeg / ffprobe | 编码、分段、音轨和文件检查 | 免费 |
| Whisper | 词级时间戳 | 本地运行，边际成本接近0 |

Python 依赖：`requests`、`python-dotenv`、`pydantic`、`Pillow`；只有分析参考视频时再安装 `opencv-python` 和 `numpy`。API Key 只放本地环境变量。

### 建议脚本

- `create_project.py`：按 `content_id` 创建目录；
- `build_recipe.py`：生成脚本、recipe和制作卡；
- `generate_avatar_video.py`：统一 HeyGen/Vidu/PixVerse 等 provider；
- `generate_captions.py`：生成SRT和动态字幕；
- `validate_output.py`：检查尺寸、音轨、字幕和脚本对齐；
- `batch_runner.py`：预算检查、并发、重试和结果记录。

### Skill 边界

建议最终封装为 `miraa-ai-host-production` Skill：从已确认 `content_id` 开始，自动生成和检查，最后停在“等待人工审核”。不允许 Skill 自动改脚本或发布 TikTok。

## 9. 试点与采购建议

### 近期试点

| 顺序 | 测试 | 预算 | 目的 |
|---:|---|---:|---|
| 1 | HeyGen 网页端继续生产 | 现有套餐 | 建立当前成本和质量基线 |
| 2 | Kling 数字人，同图同音频 | 只买2条样片所需最低额度 | 验证实际人民币扣费、口型和身份一致性 |
| 3 | Vidu，同一稳定底片 | `¥35`内 | 验证 `¥8.15/分钟` 的口型费能否形成可用成片 |
| 4 | PixVerse，同底片拆两段 | `¥35`内 | 检查30秒切段接缝和总成本 |
| 5 | Seedance | 最小 `¥196` 资源包 | 只测5/10/15秒扣费和B-roll，不生成整条口播 |

### 替换 HeyGen 的门槛

新工具必须同时满足：

- 实际总扣费低于 HeyGen 至少20%，或质量明显更好；
- 第一版成功率稳定；
- 口型、脸型、声音和背景不漂移；
- 无水印和商业授权硬伤；
- 包含失败重试和人工修改后的总时间更低。

### 批量生产

**当前最优方案：HeyGen API + Codex批处理。** 先以3–5条为一批，每批第一条做8–12秒Canary，确认语速、形象和预算后再并发提交。人工逐条完整播放仍是主要瓶颈。

如果只做每月1–30条且人工操作可接受，继续使用HeyGen Creator网页端更省钱。Kling Avatar V2 Standard先做2条同图同音频测试；只有当人物稳定性或质量明显优于HeyGen，或者获得更低的人民币官方API报价时，才考虑迁移。Seedance、Grok、Veo和MiniMax不作为批量主口播引擎。

## 10. 主要风险

1. 脚本未经确认就批量生成，返工会被放大；
2. 官网理论单价不包含失败重试和额度浪费；
3. “只含对口型”或“只含素材生成”的价格容易被误当成完整成片成本；
4. API 与网页端可能双重付费；
5. 多段短视频拼接会造成身份、背景、动作和声音接缝；
6. 自动检查无法发现所有口型、眼神和语气问题；
7. 自动生成完成不等于可以发布。

## 11. 主要公开来源

- HeyGen 网页套餐：<https://www.heygen.com/pricing>
- HeyGen credits规则：<https://help.heygen.com/en/articles/15126059-how-to-use-credits-on-heygen>
- HeyGen API价格：<https://developers.heygen.com/docs/pricing>
- Kling数字人能力和人民币价格：<https://finance.people.com.cn/n1/2025/0919/c1004-40567753.html>
- 快手官方Kling 3.0能力：<https://ir.kuaishou.com/zh-hans/news-releases/news-release-details/keling30xiliemoxingquanmianshangxian?mobile=1>
- Kling Avatar V2 API与价格：<https://fal.ai/models/fal-ai/kling-video/ai-avatar/v2/standard>
- Kling Avatar V2 API文档：<https://fal.ai/docs/model-api-reference/video-generation-api/kling-video-ai-avatar-v2>
- Kling 3.0与Seedance 2.0 API价格对比：<https://fal.ai/learn/tools/seedance-2-0-vs-kling-3-0>
- Seedance 2.0 API价格：<https://fal.ai/models/bytedance/seedance-2.0/text-to-video>
- Seedance 2.0能力：<https://developer.volcengine.com/articles/7606009619928449070>
- Seedance 2.0资源包：<https://www.volcengine.com/activity/seedance2>
- Vidu Lip Sync：<https://platform.vidu.com/docs/lip-sync>
- Vidu价格：<https://platform.vidu.com/docs/pricing>
- PixVerse Lip Sync：<https://docs.platform.pixverse.ai/how-to-use-speechlip-sync-1268530m0>
- PixVerse价格：<https://docs.platform.pixverse.ai/pricing-796039m0>
- Hedra价格：<https://www.hedra.com/pricing>
- D-ID API价格：<https://www.d-id.com/pricing/api>
- Captions API价格：<https://help.captions.ai/api-reference/api>
- Synthesia价格：<https://www.synthesia.io/pricing>
- Tavus价格：<https://www.tavus.io/pricing>
- Grok视频能力与价格：<https://docs.x.ai/developers/model-capabilities/video/generation>
- Gemini/Veo能力：<https://ai.google.dev/gemini-api/docs/video>
- Gemini/Veo价格：<https://ai.google.dev/gemini-api/docs/pricing>
- MiniMax能力：<https://platform.minimax.io/docs/guides/video-generation>
- MiniMax价格：<https://platform.minimax.io/docs/guides/pricing-paygo>
- 2026-07-21美元兑人民币中间价：<https://www.jwview.com/jingwei/html/m/07-21/680201.shtml>

本报告中的价格是调研时点快照；采购前以账户充值页和实际 credits 扣费为准。
