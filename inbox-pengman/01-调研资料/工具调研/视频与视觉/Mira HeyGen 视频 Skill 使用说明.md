---
title: Mira HeyGen 视频 Skill 使用说明
type: tool-guide
status: ready
tool: HeyGen API
skill: miraa-heygen-video
updated: 2026-07-22
---

# Mira HeyGen 视频 Skill 使用说明

## 1. 这版 Skill 能做什么

`$miraa-heygen-video` 用于把**已经确认的英文口播稿**生成 Mira 的 HeyGen Avatar IV 竖屏原始视频。

它会自动完成：

1. 检查脚本、API Key、Mira Look、音色、Avatar 引擎、钱包余额和本地质检工具；
2. 估算时长、基础费用和保守费用上限；
3. 把配置和费用展示给你，等待你明确确认；
4. 确认后提交 HeyGen、轮询状态并下载原始 MP4；
5. 记录实际生成时间、成片时长、理论费用、钱包前后差额和基础技术质检；
6. 停在 `production_pending_human_review`，等待人工完整观看。

本版明确不做：字幕生成、动态字幕、脚本改写、B-roll、CapCut 编辑、自动发布和自动修改内容生命周期。字幕稳定后再加入下一版。

## 2. 文件位置

Skill 可携带版本：

`inbox-pengman/skills/miraa-heygen-video/`

当前工作区权限不能直接写入 Codex 的全局 Skill 目录，因此先把完整包放在调研资料中。需要全局安装时，在终端运行：

```bash
mkdir -p ~/.codex/skills
cp -R "/Users/pengman/gengrowth-ops/inbox-pengman/skills/miraa-heygen-video" ~/.codex/skills/
```

安装后新开一个 Codex 任务，再用 `$miraa-heygen-video` 调用。

## 3. 最简单的使用方式

准备一份最终脚本 `.txt`，然后告诉 Codex：

```text
使用 $miraa-heygen-video，为 content_id AW-XXXX 预检这个已确认脚本：
/绝对路径/script.txt
先只做预检和费用估算，不要付费生成。
```

Codex 会给出一张生成卡，包括：

- 脚本词数和指纹；
- Look、音色、引擎、语速、分辨率和画幅；
- 预计时长、基础费用、保守上限和 API 钱包余额；
- 是否存在阻塞项。

确认这些信息后，再回复：

```text
确认按刚才的配置和费用上限生成。
```

如果在确认前修改了脚本、Look、音色、语速、引擎、分辨率或预算上限，必须重新预检和重新确认。

## 4. 当前 Mira 默认参数

| 项目 | 当前默认值 |
|---|---|
| Avatar group / identity | `79c2be66e29c41728668693fc334ca02` |
| 当前灰色上衣 Look ID | `8dabf36660d74afb9c65a52cf1bf20ab` |
| 当前 Voice ID | `154e13cce06c4452ba3b9865dcdf1434` |
| Avatar 类型 | `photo_avatar` |
| 引擎 | `avatar_iv` |
| 输出 | `1080p`、`9:16`、MP4 |
| 默认语速 | `1.0` |
| 默认表现力 | `low` |
| 默认单条费用上限 | `$3.50` |

注意：生成视频时传的是具体 **Look ID**，不是 Avatar group ID。Avatar group 表示 Mira 这个人物身份；Look 表示同一个人物的具体服装、背景和构图。

## 5. 如何更换 Avatar Look

### 临时测试一个 Look

不要先修改默认值，直接在任务里说明：

```text
使用 $miraa-heygen-video 预检同一脚本，把 avatar_id 临时改成 NEW_LOOK_ID。
只做预检，不要生成。
```

确认 Look 状态正常且支持 `avatar_iv` 后，先生成 8–12 秒 Canary。重点看脸型、头发、衣服、背景、裁切、眼睛、牙齿、嘴型和身体动作。Canary 通过后再生成完整视频。

### 长期替换默认 Look

修改 Skill 内的：

`references/miraa-defaults.json`

把 `avatar_id` 改成经过 Canary 和人工审核的新 Look ID。不要修改 `avatar_group_id`，除非你确认要换成另一个人物身份。

### Look 的成本

| 操作 | 额外成本判断 |
|---|---:|
| 使用已经存在的 Look | 没有单列的“切换费”；只支付成片生成费 |
| 网页端 Generate Look | 官方当前规则为 1 credit / Look |
| API 创建 Photo Avatar | 官方自助 API 价为 `$1.00/次` |
| 8–12 秒 Avatar IV Canary | 约 `$0.40–$0.60` |
| 1分钟 Photo Avatar IV 1080p | 约 `$3.00` |

所以，如果只是从现有 Look 切到另一个现有 Look，成本不高；真正增加的主要是 Canary 和后续成片费用。频繁创建新 Look 也不算特别贵，但会增加人工筛选和身份一致性质检。

## 6. 如何更换音色或语速

### 临时更换现有音色

```text
使用 $miraa-heygen-video 预检这个脚本，把 voice_id 临时改成 NEW_VOICE_ID，语速保持 1.0。
只做预检，不要生成。
```

也可以只测试语速：

```text
使用 $miraa-heygen-video 预检同一脚本，音色不变，把 speed 临时改成 1.05。
```

当前同一份 132 词脚本，API `speed: 1.0` 的成片为 49.58 秒，而旧网页样片约为 42.05 秒。不能直接假设两个入口的 `1.0` 完全一致。任何新语速都先跑短 Canary；`1.18` 只能作为待验证候选，不能直接设为生产默认值。

### 长期替换默认音色

在 `references/miraa-defaults.json` 中修改：

- `voice_id`：新音色 ID；
- `voice_settings.speed`：语速，建议小步调整；
- `voice_settings.pitch`：音高；
- `voice_settings.volume`：音量。

### 音色的成本

- 使用另一个已经存在的公开或私有 Voice ID，没有单列的“换音色费”；Avatar 成片仍按正常视频时长收费。
- 调整语速、音高、音量没有单列设置费，但语速会改变最终时长，从而影响成片费用。
- HeyGen Creator 网页套餐包含 Voice Cloning 功能；官方自助 API 价格表目前没有单列一个明确的“克隆音色每次价格”，创建新克隆音色前应以当时产品页面显示为准。
- 独立 Starfish TTS 的官方 API 价约为 `$0.04/分钟`，但本 Skill 不单独生成音频，也不会额外调用这项服务。

因此，**切换现有音色成本低；训练/克隆全新音色的直接价格需要临时核对，但更大的实际成本仍是试听、发音检查和重新建立稳定参数。**

## 7. 一条约1分钟视频的成本和时间

官方自助 API 当前对 Photo Avatar IV/V 的 720p/1080p 报价为 `$0.05/输出秒`，即约 `$3.00/输出分钟`。

我们的 Mira 实测：

| 指标 | 实测值 |
|---|---:|
| 脚本 | 132词 |
| 成片时长 | 49.5804秒 |
| 理论时长费用 | `$2.48` |
| 钱包实际差额 | `$2.45` |
| HeyGen 提交到完成 | 220秒，约3分40秒 |
| 含下载、字幕和旧版完整流程 | 416秒，约6分56秒 |

本版 Skill 不做字幕，正常情况下从提交到下载和基础 QC 预计约 5–6 分钟；加上人工完整观看，总操作时间建议按 8–12 分钟/条预留。

费用随**最终输出时长**变化，不是按脚本字数直接计费。Skill 的字数估算和 15% 安全系数只用于生成前预算闸门。

## 8. 批量生产怎么用

HeyGen 自助 API 支持并发任务，但 V1 Skill 故意保持“一次调用生成一条”，避免同一脚本重复扣费或批量失控。

批量前必须先得到：

1. 每条都已确认的 `content_id + script.txt`；
2. 每条费用上限；
3. 全批预计费用和安全上限；
4. 足够的钱包余额；
5. 你对整批总费用的明确确认。

按 1 分钟 `$3` 粗算：10 条约 `$30`，30 条约 `$90`，尚未计入失败重做和 Canary。建议先用 3 条小批次验证 Look、音色、速度和失败率，再扩大并发。

## 9. 安全规则

- API Key 只从 `HEYGEN_API_KEY` 或 macOS Keychain 读取，不写入 Skill、脚本、日志或聊天。
- 预检只做读取，不扣费。
- 未显示最新费用卡并得到明确确认，不提交付费生成。
- 同一个输出目录会复用已记录的 `video_id` 继续轮询，避免重复生成。
- 原始成片必须人工完整观看；技术通过不等于内容或视觉通过。
- 本版输出没有字幕，也不自动发布。

## 10. 官方参考

- [HeyGen Create Video API](https://developers.heygen.com/reference/create-video)
- [HeyGen Get Video API](https://developers.heygen.com/reference/get-video)
- [HeyGen List Voices API](https://developers.heygen.com/reference/list-voices)
- [HeyGen Self-Serve API Pricing](https://developers.heygen.com/docs/pricing)
- [HeyGen Credit-Based Pricing](https://help.heygen.com/en/articles/15125761-heygen-credit-based-pricing-plans-explained)
