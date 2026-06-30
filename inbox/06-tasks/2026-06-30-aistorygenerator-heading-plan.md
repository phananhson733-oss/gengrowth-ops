---
title: aistorygenerator.work 标题结构修改计划（H1/H2/H3）
date: 2026-06-30
status: 待实施
owner: 前端/后端同事
---

# aistorygenerator.work 标题结构修改计划

---

## 一、首页（/）修改

### 1.1 H2 修改

| 位置  | 当前 H2                                                    | 修改为                                         | 操作                                |
| --- | -------------------------------------------------------- | ------------------------------------------- | --------------------------------- |
| 第1个 | What can you generate?                                   | —                                           | **删除 H2 及其下方整个内容区块**（该区块列出的工具 H3 与"Free AI generators"完全重复，后者更完整，直接保留后者即可） |
| 第2个 | Start with a story, turn it into a campaign              | From AI story to full D&D campaign          | **修改**                            |
| 第3个 | Choose your path                                         | —                                           | **删除 H2 及其下方整个内容区块**（纯UI标签，无关键词价值，内容无需保留）              |
| 第4个 | Free AI generators                                       | Free AI story and RPG generators            | **修改**                            |
| 第5个 | Built for tabletop RPG sessions                          | Built for D&D and tabletop RPG Game Masters | **修改**                            |
| 第6个 | Example outputs                                          | Example AI story and NPC outputs            | **修改**                            |
| 第7个 | How it works                                             | How the AI story generator works            | **修改**                            |
| 第8个 | Why use AIStoryGenerator instead of a generic chat tool? | 不变                                          | **保留**                            |
| 第9个 | Frequently asked questions                               | 不变                                          | **保留**                            |

**修改逻辑：** H2 是 Google 判断页面主题的重要信号，当前 H2 中核心词 "ai story generator" 几乎没有出现。修改后，"ai story generator"、"D&D"、"tabletop RPG" 在 H2 层级多次出现，加强主题信号。

---

### 1.2 H3 修改（"Free AI story and RPG generators" 区块下）

| 当前 H3 | 操作 | 原因 |
|---|---|---|
| AI Story Generator | **删除** | 首页主词，子页 /ai-story-generator 与首页形成关键词蚕食，详见第三节 |
| Fantasy Story Generator | 保留 | — |
| Sci-Fi Story Generator | 保留 | — |
| Horror Story Generator | 保留 | — |
| Mystery Story Generator | 保留 | — |
| Romance Story Generator | 保留 | — |
| Long Story Generator | 保留 | — |
| Story Prompt Generator | 保留 | — |
| AI NPC Generator | **修改为 "NPC Generator"** | "npc generator" 月搜 2000、KD 3，是更优目标词；"ai npc generator" 月搜仅 30。H3 锚文本同步改为目标词，内链信号更强 |
| Character Backstory Generator | 保留 | — |
| D&D Name Generator | 保留 | — |
| Tavern Name Generator | 保留 | — |
| Campaign Plot Generator | 保留 | — |
| Quest Hook Generator | 保留 | — |
| Random Encounter Generator | 保留 | — |
| Magic Item Generator | 保留 | — |

---

## 二、子页标准 H2 模板（适用全部 15 个工具子页）

当前子页内容不足 500 词，缺少支撑排名所需的正文结构。每个子页需补充以下 H2 区块：

```
H1: [工具名]（保持现状）

[工具主体]（保持现状）

H2: What is [工具名]?
H2: How to use [工具名]
H2: [工具名] examples
H2: Who is [工具名] for?
H2: Frequently asked questions（现有FAQ保留，补充至5条以上）
H2: Related tools（横向内链至同类工具，见下方说明）
```

**Related tools 内链规则：**
- Story Generators 组各页：互相链接（Fantasy ↔ Horror ↔ Mystery ↔ Romance ↔ Sci-Fi）
- RPG Tools 组各页：互相链接（NPC ↔ Backstory ↔ Quest Hook ↔ Random Encounter ↔ Magic Item）
- 每个子页同时链接回对应分类页（/story-generators/ 或 /rpg-tools/）

---

## 三、技术修复：关键词蚕食

| 问题 | 详情 |
|---|---|
| 蚕食页面 | https://aistorygenerator.work/ai-story-generator |
| 与首页竞争的词 | ai story generator |
| 修复方案 | 对 /ai-story-generator 做 **301 永久重定向**至首页 / |
| 优先级 | **P0，优先处理** |

301 重定向后，/ai-story-generator 的权重全部并入首页，两页竞争问题消除。

---

## 四、重点子页 H1 调整建议

基于关键词数据，以下子页的目标词与当前 H1 有优化空间：

| 子页 | 当前 H1 | 建议 H1 | 原因 |
|---|---|---|---|
| /rpg-tools/ai-npc-generator（URL 不变） | AI NPC Generator | NPC Generator for D&D and Tabletop RPGs | "npc generator" 月搜 2000、KD 3，KDROI 100；"ai npc generator" 月搜仅 30。URL 无需修改，H1/H2/首页H3 锚文本统一换为 "npc generator" 即可 |
| /story-generators/story-prompt-generator 或类似路径 | Story Prompt Generator | Story Prompt Generator for Writers and Game Masters | 补充使用场景，提升点击率 |

**其余 13 个子页 H1 保持不变。**

---

## 四-补充、词根对比分析：行2-12候选词处理结论

对 CSV 表格第2-12行候选词逐一与现有15个子页对比，得出以下结论：

### 需要操作（2项）

**① Character Backstory Generator 子页补充 H2**
- 候选词 `dnd backstory generator`：800vol、KD 1、CPC $0.1
- 现有子页目标词 `character backstory generator`：1200vol、KD 3——量更高，不替换 H1
- 操作：在子页补充内容时，增加一个 H2 `DnD Backstory Generator`，一页同时覆盖两个词

**② 新建子页 `/dnd-story-generator/`**
- 候选词 `dnd story generator`：250vol、KD 0、CPC $0.4
- 现有页面无直接对应（Fantasy/Horror 等为类型词，DnD 是游戏系统词，意图不同）
- 操作：新建独立子页，H1 为 `DnD Story Generator`，归入 Story Generators 分类

### 放入未来计划（DR 提升后再建，1项）

| 词 | 数据 | 原因 |
|---|---|---|
| story title generator | 1800vol、KD 14、CPC $0.25 | Top10 最低 DR 为 60，当前站 DR 0 无法竞争，待 DR 提升后再建页面 |

### 跳过（7项）

| 词 | 原因 |
|---|---|
| rpg story generator | KD 52、量仅 10，性价比极低 |
| dnd quest hook generator | 0 搜索量 |
| dnd campaign opening generator | 0 搜索量 |
| rpg character generator | 量 40、KD 26，KDROI 差 |
| rpg world building generator | 0 搜索量 |
| npc name generator | KD 46，新站无法竞争 |
| villain generator dnd | 0 搜索量 |

---

## 五、修改优先级汇总

| 优先级 | 任务 |
|---|---|
| P0 | /ai-story-generator 做 301 重定向至首页 |
| P1 | 首页 H2 按第一节表格修改 |
| P1 | 首页 H3 删除 "AI Story Generator" |
| P2 | 按 KDROI 顺序为子页补充内容（Magic Item → Tavern Name → Story Prompt → Character Backstory） |
| P3 | AI NPC Generator 子页 H1 调整 |
| P3 | Character Backstory Generator 子页补充 H2 `DnD Backstory Generator`（覆盖 800vol KD1 候选词） |
| P3 | 新建子页 `/dnd-story-generator/`（250vol、KD 0，DnD 专属意图，现有页面无对应） |
| P3 | 全部子页添加 Related tools 横向内链 |
| P3 | 确认 Hero 区块右侧工具（"Start with a rough idea" 输入框 + Genre/Tone 下拉）在移动端可见；当前桌面端可见，移动端是否折叠或隐藏需核实 |
| 未来 | 新建 `/story-title-generator/`（1800vol、KD 14），待站点 DR 提升至 20+ 后执行 |

---

## 六、子页内容补充优先顺序

基于 KDROI（月搜索量 × CPC ÷ KD）：

| 顺序 | 子页 | 月搜索量 | KD | CPC |
|---|---|---|---|---|
| 1 | Magic Item Generator | 300 | 3 | $3.00 |
| 2 | Tavern Name Generator | 2000 | 0 | $0.08 |
| 3 | Story Prompt Generator | 1600 | 21 | $0.90 |
| 4 | Character Backstory Generator | 1200 | 3 | $0.09 |
| 5 | D&D Name Generator | 2100 | 17 | $0.06 |
| 6 | Random Encounter Generator | 200 | 13 | N/A |
| 7 | Fantasy Story Generator | 250 | 0 | $0.40 |
| 8 | Horror Story Generator | 250 | 0 | $0.45 |
| 9 | Romance Story Generator | 90 | 0 | $0.40 |
| 暂缓 | Sci-Fi / Mystery / AI NPC / Campaign Plot / Quest Hook | 0-30 | — | — |

---

*文件关联：inbox/06-tasks/2026-06-29-pathB-launch-action-plan.md*
*关键词数据来源：aistorygenerator.work - 工作表1.csv（下载文件夹）*
