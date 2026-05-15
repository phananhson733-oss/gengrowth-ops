# 🚀 SEO 内容生产流水线 (v2.0 · 集群全案版)

> **核心哲学**：不靠灵感写作，只靠逻辑组装。将 Topic Cluster (主题集群) 架构与标准化零件生产深度结合，确保每一篇内容都具备“信息增益”并形成站点权重网络。

---

## 📊 第一部分：基础设施 - 选题登记表 (Topic Registry)

v2.0 强制要求对齐以下字段，这些是工业化组装的“燃料”。

| 字段名称 (Header) | 填写时机 | 核心注释 (Notes) |
| :--- | :--- | :--- |
| **Parent Pillar** | Step 1 | 本文所属的集群主词。独立文章填 `Standalone`。 |
| **Target Keyword** | Step 1 | 本文主攻词。若是总览页，则与 Parent Pillar 相同。 |
| **Associated Keywords**| Step 1 | 嵌套长尾词 (1+N 核心)。上限 7 个，溢出需拆分为 `Part X/Y`。 |
| **Spoke Topics** | Step 1 | **(仅 Pillar 适用)** 计划中的次级词列表，用于生成 H2 总览。 |
| **Intent** | Step 1 | 搜索意图 (Info/Compare/Tutorial/Utility/Experience)。 |
| **Tier** | Step 1 | 生产定级 (T1 重装 / T2 标准 / T3 占位)。 |
| **Template** | Step 1 | 结构框架 (Definition/Comparison/Tutorial/Case Study/Programmatic)。 |
| **Primary Entity** | Step 2 | 本文占据主权的专业术语，防止内部内容内耗。 |
| **Friction** | Step 3 | 真实痛点证据 (Reddit 抓取或行业矩阵)。 |
| **Logic (Mechanism)** | Step 3 | 痛点的底层机制与代价 (Trade-off)。 |
| **Status / URL** | 实时 | 进度追踪与正式在线网址。 |

---

## 🧠 第二部分：核心判定决策矩阵 (Decision Matrix)

### 1. 文章角色判定 (Role)
| 角色 | 触发条件 | 核心写作动作 | 内部布线目标 |
| :--- | :--- | :--- | :--- |
| **Pillar (主)** | Target = Parent | **写广不写深**。将 `Spoke Topics` 全部列为 H2 进行介绍。 | 每个 H2 预留 `[Read More]` 链接指向 Spoke。 |
| **Spoke (次)** | Target 属于 Pillar | **写深不写广**。针对该特定词进行极细致的机制拆解。 | 前 30% 必须有一句话链接回 Pillar 页面。 |
| **Standalone** | Pillar = Standalone | **深广兼顾**。采用 1+N 模式吃透一个孤立高权重词。 | 无强制回链，可自然引用。 |

### 2. 搜索意图判定 (Search Intent)
*   **模式 A：标题特征**：包含 "What is" -> **Info**; "Best/vs" -> **Compare**; "How to" -> **Tutorial**。
*   **模式 B：载体判定**：前 3 名是工具 -> **Utility**; 全是视频 -> **Visual**; 全是 Reddit -> **Experience**。

### 3. 生产定级 (Tier)
*   **Tier 1 (重装)**：核心商业词或 Reddit 讨论多。1800+ 字，必须人工搜证，严审。
*   **Tier 2 (标准)**：正常科普词。1000+ 字，标准 QA。
*   **Tier 3 (占位)**：冷门或杂乱词。600 字直给答案，10min 内完工。

---

## 🛠 第三部分：五步标准化生产流程

### STEP 1：准入、对齐与定级 (10 分钟)
1.  **防撞检查**：在《选题登记表》`Ctrl+F` 检查该词是否已被覆盖。
2.  **集群定位**：确定它是 `Pillar` 还是 `Spoke`。若是 Pillar，列出所有 `Spoke Topics`。
3.  **SERP 定级 (6:3:1 法则)**：
    *   **快败规则**：产品首页/注册页 > 6 个 -> **放弃**，该词非 Blog 意图。
    *   **Tier 1**：Reddit/论坛 ≥ 3 个 -> 极品蓝海，必须深挖。
4.  **规格锁定**：填入 Intent, Tier, Template。

### STEP 2：实体主权搜证 (Entity)
1.  **术语提取**：利用 AI 分析前三名竞品（文章/视频简介/论坛）。
    *   *AI 指令*：“分析以上素材，提取 5 个最能代表该话题专业性的核心术语。”
2.  **主权查重**：选出一个**从未被站内其他文章作为主词**的术语作为 `Primary Entity`。
    *   *原则*：Pillar 选广泛词（例：Aura），Spoke 选具体词（例：Throat Chakra）。

### STEP 3：信息增益取证 (注入“灵魂零件”)
1.  **真实痛点 (Friction)**：
    *   **动作**：搜索 `site:reddit.com "keyword" (sucks|problem|bad)`。
    *   **替代方案**：若无 Reddit，调用“**行业通用摩擦矩阵**”（如 SaaS 的数据孤岛、占星的时区偏移）。
2.  **底层逻辑 (Logic)**：
    *   **Mechanism (机制)**：为什么会有这个坑？（技术/理论解释）。
    *   **Trade-off (权衡)**：如果要获得 [优点]，就必须接受 [代价]。
    *   *取证技巧*：看竞品评论区的 "But" 或检查 Pricing 方案的限制脚注。

### STEP 4：AI 组装生产 (自动化执行)
1.  **发送法典**：将 `SEO内容生产提示词_v0.19.md` 全文发给 AI。
2.  **发送燃料包**：
    ```markdown
    # Assembly v0.19
    Target: {Target} | Parent: {Parent} | Associated: {N个长尾词}
    Spoke_Topics: {针对Pillar填次级词，Spoke留空}
    Intent: {Intent} | Tier: {T1-T3} | Template: {Template}
    Entity: {Entity} | Friction: {Friction} | Logic: {Logic} | CTA: {URL}
    ```

### STEP 5：双向语义布线 (发布环节)
1.  **Spoke 发布**：文章前 30% 插入链接指向 Pillar。末尾推荐同集群其他 Spoke。
2.  **Pillar 发布/更新**：在对应的 H2 小节，将占位符替换为指向 Spoke 的真实链接。
3.  **同步资产**：将搜到的 Friction 存入《统一素材库》，供未来复用。

---

## 📉 第四部分：红线机械质检 (不合格直接打回)

| 检查项 | 判定标准 | 失败动作 |
| :--- | :--- | :--- |
| **Answer Lock** | 开头 120 字是否加粗并直接回答了 Keyword 疑问？ | 重写开头 |
| **数字密度** | 全文是否包含至少 3 个具体数字（%, $, hours, degree）？ | 要求具象化细节 |
| **禁词清零** | `Ctrl+F` 检索 `synergy`, `leverage`, `unlock` 的结果是否为 0？ | 全量删除 |
| **1+N 完备性** | B 列的那 7 个长尾词是否全部作为 H2/H3 或语义锚点出现？ | 补齐关键词 |
| **Pillar 结构** | (若是Pillar) 是否为每个 Spoke Topic 生成了 H2 并带有内链接口？ | 补齐 H2 路由 |

---
**版本**：v2.0 | **状态**：全员集群生产环境就绪 | **设计者**：Gemini CLI
