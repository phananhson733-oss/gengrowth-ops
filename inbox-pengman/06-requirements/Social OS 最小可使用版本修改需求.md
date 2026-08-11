
本轮目标是先让 Social OS 能完整跑通一条真实内容，不追求一次把所有细节做完善。

现有表格和流程不需要重做，只修改以下内容。

## 1. 保留现有调试进度

当前工具里的进度可以继续保留：

```
drafted
selected
scripting
packaged
published
```

这些字段方便前期调试，可以看出工具具体运行到哪一步。

它们与正式内容进度的关系可以简单理解为：

|工具调试进度|对应内容状态|
|---|---|
|drafted，且尚未被选择|仍是候选，不写 `content_stage`|
|drafted，且已经被选择|producing|
|selected|selected|
|scripting|producing|
|packaged|producing|
|published|published|

也就是说：

- `stage` 继续记录工具运行到哪一步；
    
- `content_stage` 记录人类需要知道的内容进度；
    
- `drafted / scripting / packaged` 可以作为 `producing` 里面更详细的步骤保留。
    


## 2. 候选被选择后才继续生产

现有 `选题审批` 表可以继续作为候选池和选题确认入口，不需要新建表。

规则保持简单：

- AI 可以生成多个候选；
    
- 未选择的候选可以停留在 `drafted`；
    
- Pengman 在 `selection_status` 填写 `selected` 后，工具才继续写稿和打包；
    
- 未选择的候选不能自动生成完整文案包。
    

选中后继续使用同一个 `content_id`，从选题一直连接到脚本、制作、发布数据和复盘。

候选的 `week` 可以暂时保留。未来如果需要建立长期候选池，再考虑允许候选不填写周次。

---

## 3. 增加内容形式和生产工具判断

每条被选中的内容增加以下字段：

```
content_format
production_tool
route_reason
```

含义：

- `content_format`：这条内容准备做成什么形式；
    
- `production_tool`：建议使用什么工具制作；
    
- `route_reason`：AI 用一句话说明为什么这样选择。
    

第一版可以支持以下内容形式：

```
ai_host_single    单人 AI 口播
ai_host_dual      双人 AI 对话
screen_recording  录屏讲解
image_post        图文或 Carousel
mixed_video       视频混剪
other             其他形式
```

第一版可以支持以下生产工具：

```
HeyGen
Screen Studio
CapCut
图文生产流程
人工处理
其他工具
```

### AI 判断方式

AI 根据以下信息推荐内容形式和工具：

- 目标账号；
    
- 选题内容；
    
- 脚本结构；
    
- 是否需要人物；
    
- 是否需要展示产品页面；
    
- 是否需要素材、录屏或剪辑；
    
- 当前已经配置和可用的工具。
    

例如：

|   |   |   |
|---|---|---|
|内容|AI 推荐形式|AI 推荐工具|
|Scorpio 情绪解读|单人 AI 口播|HeyGen|
|朋友突然表白|双人 AI 对话|HeyGen|
|AstrologyWiki 使用教程|录屏讲解|Screen Studio + CapCut|
|多素材星座视频|视频混剪|CapCut|
|星座知识卡片|图文|图文生产流程|

AI 的判断是建议，Pengman 可以直接修改表格中的结果。

### 后续扩展

内容形式和生产工具不要写死在程序中。

建议使用一份可编辑的配置，让后续可以直接增加：

- 新的视频形式；
    
- 新的视频生成模型；
    
- 新的剪辑工具；
    
- 新的图文工具；
    
- 新的生产流程。
    

新增工具时，不需要重做选题、文案、数据和复盘部分。

---

## 4. 表格和工作区使用同一个内容编号

同一条内容在以下位置必须使用同一个 `content_id`：

- 选题审批；
    
- 口播稿；
    
- 文案包；
    
- 工作区生产记录；
    
- 数据回收；
    
- 复盘结论。
    

Social OS 可以继续生成工作区文件，但不要同时生成多份互相独立的主记录。

最小版本只需要做到：

- 每个 `content_id` 对应一份当前生产记录；
    
- 工具继续处理同一内容时更新这份记录；
    
- 不要每运行一步就创建一份新的 Prompt Package 文件；
    
- 人能够通过 `content_id` 找到这条内容的选题、稿件和数据。
    

---

# 本轮暂时不做

为了先跑通最小版本，这一轮暂时不要求：

- 增加 `hold / cancelled`；
    
- 修改脚本后自动取消批准；
    
- 完善脚本哈希机制；
    
- 改造定时发布逻辑；
    
- 改造发布时间和时区；
    
- 增加额外的形象授权检查；
    
- 调整当前周计划和发布数量；
    
- 自动发布内容；
    
- 自动调用付费视频生成；
    
- 重做数据回收和复盘表；
    
- 重做整张 Google Sheet。
    

---

# 最小验收方式

使用一条真实内容完成以下测试：

1. AI 生成候选，状态为 `drafted`；
    
2. 未被选择时，不继续生成完整文案包；
    
3. Pengman 将它设置为 `selected`；
    
4. AI 生成脚本，状态变为 `scripting`；
    
5. AI 判断适合的 `content_format` 和 `production_tool`；
    
6. AI 在 `route_reason` 中说明选择理由；
    
7. 文案包完成后，状态变为 `packaged`；
    
8. 表格和工作区全程使用同一个 `content_id`；
    
9. 能根据推荐结果进入 HeyGen、Screen Studio、CapCut 或其他人工生产流程。
    

完成这条测试，就可以认为 Social OS 的最小版本已经“能跑”。之后再根据实际使用中出现的问题补状态、审批、定时和其他细节。