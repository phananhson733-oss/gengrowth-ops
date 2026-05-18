---
project: astrologywiki
type: sop
status: final
owner: Ma Boyang
updated: 2026-05-14
---

# 🚀 SEO 内容生产流水线 (v2.0 · 集群全案版)

> **核心哲学**：不靠灵感写作，只靠逻辑组装。将 Topic Cluster (主题集群) 架构与标准化零件生产深度结合，确保每一篇内容都具备“信息增益”并形成站点权重网络。

---

## 📊 第一部分：基础设施 - 选题登记表 (Topic Registry)

v2.0 严格对接 15 列标准表头，确保 Google Sheets 自动化公式 (ARRAYFORMULA/VLOOKUP) 直接生效。

### 1. 建模与集群预加工流程 (Clustering Workflow)
在正式生产前，需将《关键词研究主表》中的原始词库转化为《选题登记表》中的生产任务：
1. **主次拆分**：提取《关键词研究主表》中的“快速胜利词 (Quick Win Keywords)”，交给 AI 判定其在集群中的地位。AI 需区分出：
    * **主关键词 (Pillar)**：具备总览属性，作为集群核心。
    * **次级关键词 (Spoke)**：具备垂直属性，作为集群分支。
2. **长尾词分配**：将剩余的“长尾词 (Long-tail Keywords)”按语义相关性，全量分配至对应关键词行的 **Associated Keywords (B 列)**，形成 1+N 的嵌套结构。
3. **排版入库**：根据 AI 拆分结果，在《选题登记表》中按“主行-留空-次行”的格式排版，确保 A/B 列结构化清晰。

### 2. 标准表头定义
| 字段名称 (Header) | 填写时机 | 核心注释 (Notes) |
| :--- | :--- | :--- |
| **Target Keyword** | Step 1 | A列。本文核心词。通过“主行/留空/次行”的排版体现集群关系。 |
| **Associated Keywords**| Step 1 | B列。1+N 嵌套长尾词。上限 7 个，溢出需拆分为 `Part X/Y`。 |
| **月搜索量** | 自动 | C列。从主表自动同步。用于决策 Tier。 |
| **KD** | 自动 | D列。从主表自动同步。用于判断竞争难度。 |
| **Intent** | Step 1 | E列。搜索意图 (Info/Compare/Tutorial/Utility/Experience)。 |
| **Tier** | Step 1 | F列。定级 (T1 重装 / T2 标准 / T3 占位)。 |
| **Template** | Step 1 | G列。框架 (Definition/Comparison/Tutorial/Case Study/Programmatic)。 |
| **Entity** | Step 2 | H列。本文占据主权的专业术语（唯一性）。 |
| **Friction** | Step 3 | I列。真实痛点证据 (Reddit 抓取或行业矩阵)。 |
| **Logic** | Step 3 | J列。底层机制 (Mechanism) 与代价 (Trade-off)。 |
| **CTA** | Step 5 | K列。本文引导转化的 URL 链接。 |
| **GSC Keywords** | 维护期 | L列。发布后增补的 GSC 排名词，用于内容刷新。 |
| **Status** | 实时 | M列。执行状态 (待写/写作中/已发布)。 |
| **URL** | Step 5 | N列。正式发布的在线网址。 |
| **Last Audit** | 维护期 | O列。最后一次内容质量审计日期。 |

---

## 🧠 第二部分：核心判定决策矩阵 (Decision Matrix)

### 1. 文章角色判定 (通过 A 列位置判断)
| 角色 | 判定依据 | 核心写作动作 | 内部布线目标 |
| :--- | :--- | :--- | :--- |
| **Pillar (主)** | 集群的第一行 | **写广不写深**。总览下属的所有次级词主题。 | 每个次级话题结尾预留 `[Read More]` 链接。 |
| **Spoke (次)** | 集群留空行后的行 | **写深不写广**。针对该特定词进行极细致的机制拆解。 | 前 30% 必须有一句话链接回 Pillar 页面。 |
| **Standalone** | 处于独立文章区 | **深广兼顾**。采用 1+N 模式吃透一个孤立高权重词。 | 无强制回链，可自然引用。 |

### 2. 搜索意图判定 (Search Intent)
*   **模式 A：标题特征**：包含 "What is" -> **Info**; "Best/vs" -> **Compare**; "How to" -> **Tutorial**。
*   **模式 B：载体判定**：前 3 名是工具 -> **Utility**; 全是视频 -> **Visual**; 全是 Reddit -> **Experience**。

| 选项             | 触发条件 (SERP 特征)                                | 选择原因 (User Psychology)             |
| :------------- | :-------------------------------------------- | :--------------------------------- |
| **Info**       | 标题多为 "What is...", "Meaning", "Definition"    | 用户处于认知阶段，需要**清晰的定义和 Snippet 答案**。  |
| **Compare**    | 标题多为 "Best...", "Top 10", "vs", "Review"      | 用户处于决策阶段，需要**横向对比和 Trade-off 权衡**。 |
| **Tutorial**   | 标题多为 "How to...", "Steps", "Guide", "Process" | 用户处于执行阶段，需要**具体的动作序列和避坑指南**。       |
| **Utility**    | 结果中出现大量计算器、查询工具、转换表                           | 用户想要**直接的结果值**，不想要阅读长篇大论。          |
| **Experience** | 结果前 5 名中 Reddit/Quora/论坛占 3 个以上               | 用户不相信官方博客，在寻找**真实用户的“血泪史”或非共识观点**。 |
| **BOFU**       | 标题包含 "Pricing", "Buy", "Login", "Register"    | 用户已准备转化，需要**极短的路径和明确的价值主张**。       |

---

## 🛠 第三部分：五步标准化生产流程

### STEP 1：准入、排版与定级 (10 分钟)
1.  **领取任务**：根据《选题登记表》**的集群结构，将词复制到 A/B 列。
2.  **角色对齐**：观察该行位置。若上方有留空行，则本文为 `Spoke`；若是集群首行，则为 `Pillar`。
3.  **SERP 定级 (6:3:1 法则)**：
    *   **快败规则**：产品首页/注册页 > 6 个 -> **放弃**，改做落地页优化。
    *   **Tier 1**：Reddit/论坛 ≥ 3 个 -> 极品蓝海，必须人工深度搜证。
4.  **规格锁定**：填入 Intent, Tier, Template。

### STEP 2：实体主权搜证 (Entity)
1.  **术语提取**：利用 AI 分析前三名竞品，提取 5 个核心专业术语。
2.  **主权查重**：在表中 `Ctrl+F` 确保选中的 `Entity` 没被同集群的其他文章抢占。

### STEP 3：信息增益取证 (注入“灵魂零件”)
1.  **针对 Spoke/独立词**：去 Reddit 搜具体报错或抱怨。填入 `Friction`。
2.  **针对 Pillar (主词)**：找宏观层面的用户误区或认知差。
3.  **逻辑提炼**：填入 `Logic`，必须包含一个 Trade-off（如果要获得 X，必须接受 Y）。

### STEP 4：AI 组装生产 (自动化执行)
1.  **发送法典**：将 `SEO内容生产提示词_v0.19.md` 全文发给 AI。
2.  **发送燃料包**（根据 A 列排版判断填写 Parent）：
    ```markdown
    # Assembly v0.19
    Target: {A列词} | Parent: {若是Spoke填主行词，若是Pillar填A列词}
    Associated: {B列的那几个长尾词}
    Intent: {E列} | Tier: {F列} | Template: {G列}
    Entity: {H列} | Friction: {I列} | Logic: {J列} | CTA: {K列}
    ```

### STEP 5：双向语义布线 (发布环节)
1.  **内链挂载**：Spoke 文前 30% 插入链接指向 Pillar；Pillar 对应 H2 指向 Spoke。
2.  **资产化**：将 I/J 列素材存入《统一素材库》，更新 `Status` 为 `Published`。

---

## 📉 第四部分：红线机械质检 (不合格直接打回)

| 检查项 | 判定标准 | 失败动作 |
| :--- | :--- | :--- |
| **Answer Lock** | 开头 120 字是否加粗并直接回答了 Keyword 疑问？ | 重写开头 |
| **数字密度** | 全文是否包含至少 3 个具体数字（%, $, hours, degree）？ | 要求具象化细节 |
| **禁词清零** | `Ctrl+F` 检索 `synergy`, `leverage`, `unlock` 的结果是否为 0？ | 全量删除 |
| **1+N 完备性** | B 列的长尾词是否全部作为 H2/H3 或语义锚点出现？ | 补齐关键词 |

---
**版本**：v2.0 | **状态**：全员集群生产环境就绪 | **设计者**：Gemini CLI
