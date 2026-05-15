# 🚀 SEO 内容生产流水线 (v0.19 · 集群执行全案)

> **核心哲学**：不靠灵感写作，只靠逻辑组装。采用 **Topic Cluster (主题集群)** 架构，通过 1 个 Pillar 页面带动 N 个 Spoke 页面，实现语义全覆盖。

---

## 📊 第一部分：基础设施 - 选题登记表 (Topic Registry)

v0.19 必须包含以下字段，以支持三级架构及 1+N 嵌套。

| 字段名称 (Header) | 汉语翻译 | 填写时机 | 核心注释 (Notes) |
| :--- | :--- | :--- | :--- |
| **Parent Pillar** | 所属主词 | Step 1 | 本文属于哪个集群？（如：Aura Colors）。用于内链布线。 |
| **Target Keyword** | 目标词 | Step 1 | 本文要排名的核心词（可能是 Pillar 或 Spoke）。 |
| **Associated Keywords**| 关联长尾词 | Step 1 | **1+N 核心**：嵌套在本文中的 3-7 个长尾词。 |
| **Intent** | 搜索意图 | Step 1 | 用户搜索该词的真实目的。 |
| **Tier** | 生产定级 | Step 1 | 决定投入成本 (T1-T3)。 |
| **Template** | 模板模式 | Step 1 | 文章的结构框架 (Definition/Comparison/Tutorial 等)。 |
| **Entity** | 主权实体 | Step 2 | 本文占据主权的专业术语。 |
| **Friction** | 痛点证据 | Step 3 | 从 Reddit/论坛抓取的具体真实案例。 |
| **Logic** | 底层逻辑 | Step 3 | 解释痛点的 Mechanism 与 Trade-off。 |
| **Status / URL** | 进度追踪 | 实时 | 发布后的正式在线网址。 |

---

## 🧠 第二部分：核心判定决策矩阵 (Decision Matrix)

### 1. 文章类型判定 (v0.19 新增)
| 类型 | 目标 | 核心动作 |
| :--- | :--- | :--- |
| **Pillar (主)** | 建立权威，覆盖泛词 | 写总览，嵌套泛长尾词，**大量链接指向下属 Spoke**。 |
| **Spoke (次)** | 收割流量，转化用户 | 深挖 Friction，嵌套精准长尾词，**链接回指 Pillar**。 |

---

## 🛠 第三部分：五步标准化生产流程

### STEP 1：集群对齐与规格锁定
1.  **确定集群**：检查 `Parent Pillar` 字段。若属于某个未完工集群，优先执行该集群。
2.  **长尾检查**：确认 `Associated Keywords` 数量。
    *   **熔断**：若 > 7 个，检查是否已在计划中拆分为 `Part X/Y`。
3.  **定级**：根据主词重要性分配 Tier。

### STEP 2：实体主权搜证
1.  **防止内耗**：确保本文的 `Entity` 不与同集群内其他文章冲突。
2.  **Pillar 特权**：Pillar 文章通常拥有该集群最基础、最通用的 Entity 解释权。

### STEP 3：信息增益搜证
1.  **Friction 差异化**：
    *   Pillar 文采用“全景式痛点”（一句话概括多个坑）。
    *   Spoke 文采用“深蹲式痛点”（深挖一个具体的血泪史）。

### STEP 4：AI 组装生产 (v0.19 变量升级)
1.  **发送变量包**：
    ```markdown
    # Assembly v0.19
    Target: {Target Keyword} | Parent: {Parent Pillar}
    Associated: {Associated Keywords (N个)}
    Intent: {Intent} | Template: {Template}
    Entity: {Entity} | Friction: {Friction} | Logic: {Logic}
    ```
2.  **嵌套质检**：检查 B 列的那 7 个长尾词是否已作为 H2/H3 或语义锚点自然出现。

### STEP 5：双向语义布线 (集群核心)
1.  **向上布线**：Spoke 文前 30% 必须带链接指向 Pillar。
2.  **向下布线**：Pillar 文在对应章节必须带链接指向 Spoke。
3.  **横向布线**：在 Spoke 文末尾推荐同集群的其他 Spoke（“Read More about [Other Color]”）。

---
**版本**：v0.19 | **状态**：集群生产环境就绪 | **设计者**：Gemini CLI
