# 🚀 SEO 内容生产流水线 (v0.19 · 集群执行全案)

> **核心哲学**：不靠灵感写作，只靠逻辑组装。采用 **Topic Cluster (主题集群)** 架构，通过 1 个 Pillar (主) 页面带动 N 个 Spoke (次) 页面，实现语义和流量全覆盖。

---

## 📊 第一部分：基础设施 - 选题登记表 (Topic Registry)

v0.19 必须包含以下字段，以支持三级架构及嵌套操作。

| 字段名称 (Header) | 填写时机 | 核心注释 (Notes) |
| :--- | :--- | :--- |
| **Parent Pillar** | Step 1 | 本文所属的集群主词（如：Aura Colors）。如果是独立文章，填 `Standalone`。 |
| **Target Keyword** | Step 1 | 本文要排名的核心词。如果本文是总览页，此词与 Parent Pillar 相同。 |
| **Associated Keywords**| Step 1 | 嵌套长尾词。上限 7 个，溢出需拆分。 |
| **Spoke Topics** | Step 1 | **(仅 Pillar 适用)** 下属的次级关键词列表，将生成 H2 并在日后加内链。 |
| **Intent** | Step 1 | 用户搜索该词的真实目的 (Info/Compare/Tutorial 等)。 |
| **Tier** | Step 1 | 决定投入成本 (T1-T3)。Pillar 通常必为 Tier 1。 |
| **Template** | Step 1 | 文章的结构框架 (Definition/Comparison/Tutorial 等)。 |
| **Entity** | Step 2 | 本文占据主权的专业术语 (如 SPS 代替 HSP)。 |
| **Friction** | Step 3 | 从 Reddit/论坛抓取的具体真实痛点/血泪史。 |
| **Logic** | Step 3 | 解释痛点的底层机制 (Mechanism) 与代价 (Trade-off)。 |
| **Status / URL** | 实时 | 进度追踪与正式发布的在线网址。 |

---

## 🧠 第二部分：核心判定决策矩阵 (Decision Matrix)

### 文章角色判定与动作指南
| 角色 | 触发条件 | 核心写作动作 | 内部布线目标 |
| :--- | :--- | :--- | :--- |
| **Pillar (主 Blog)** | Target Keyword = Parent Pillar | **写广不写深**。必须将 `Spoke Topics` 全部列为 H2 进行总览介绍。 | 成为枢纽。每个 H2 结束处必须留下 `[Read full guide on X]` 的链接口。 |
| **Spoke (次 Blog)** | Target Keyword 属于某个 Pillar | **写深不写广**。只针对该特定词进行极度细致的机制拆解。 | 输送权重。前 30% 必须有一句引导回 Pillar 页面的话和链接。 |
| **Standalone (独立)** | Parent Pillar = Standalone | **深广兼顾**。采用 1+N 模式吃透一个孤立高权重词。 | 无强制内链要求，可自然外链。 |

---

## 🛠 第三部分：五步标准化生产流程 (SOP 详批)

### STEP 1：集群定调与参数提取
**操作者：SEO 策划 / 运营人员**
1. **领取任务**：打开《选题登记表》，选定一行处于“未开始”的词。
2. **角色识别**：
   * **如果是 Pillar**：将同集群下的次级关键词填入 `Spoke Topics` 变量。准备好承载宏大叙事。
   * **如果是 Spoke**：将 `Spoke Topics` 留空，专注于该词本身的 `Associated Keywords`。
3. **熔断检查**：检查 B 列 `Associated Keywords`，若多于 7 个，立即拆分成两行 (Part 1, Part 2)。

### STEP 2：实体主权搜证 (Entity)
**操作者：SEO 策划**
1. **防止内耗**：确保同一集群内的 Spoke 文章不要抢同一个 Entity。
   * *例：Pillar 抢 `Human Energy Field`，Spoke(Blue) 抢 `Throat Chakra Connection`。*
2. **填入表格**：将选定的高逼格/科学词汇填入 `Entity` 字段。

### STEP 3：信息增益搜证 (Friction & Logic)
**操作者：SEO 策划 (最关键的 10 分钟)**
1. **针对 Pillar (主)**：
   * **Friction**：找宏观痛点。如“人们做测试后只知道颜色，却不知道颜色是动态变化的。”
   * **Logic**：给系统级解决方案。
2. **针对 Spoke (次/独立)**：
   * **Friction**：去 Reddit 搜具体抱怨。如“我测出蓝色光环，但为什么我经常感到喉咙痛无法表达？”
   * **Logic**：给出具体的机制和代价 (Trade-off)。

### STEP 4：AI 组装生产
**操作者：执行人员 / AI 代理**
1. **发送系统法典**：在一个全新的对话中，将 `SEO内容生产提示词_v0.19.md` 的全文发给 AI (如 Claude/GPT)。
2. **AI 会停止并要求变量**。
3. **发送变量包**：根据 Step 1-3 的结果，拼装并发送：
    ```markdown
    # Assembly v0.19
    - Target_Keyword: {Target}
    - Parent_Pillar: {Pillar 词或 Standalone}
    - Associated_Keywords: {那几个长尾词}
    - Spoke_Topics: {针对 Pillar 填次级词，Spoke 留空}
    - Intent: {意图}
    - Tier: {T1/T2/T3}
    - Template: {模式}
    - Primary_Entity: {Entity}
    - Friction_Case: {痛点}
    - Logic_Mechanism: {机制与代价}
    - CTA_URL: {转化链接}
    ```
4. **红线质检**：AI 出稿后检查：
   * 是 Pillar？检查是否每个 Spoke 都有 H2 小节。
   * 包含禁词 (synergy, leverage)？打回重写。
   * 是否有加粗的直接答案在开头？

### STEP 5：双向语义布线 (发布时)
**操作者：网站编辑 / CMS 操作员**
1. **如果是 Spoke 文章上线**：
   * 在正文前两段，插入一句引导语并带上链接指向 Pillar。*(例："While this guide covers Blue Auras, you can learn about the full spectrum in our [Aura Colors Guide]." )*
   * 返回 Pillar 页面，找到 Blue Aura 的 H2 小节，将占位符替换为指向本文的真实链接。
2. **状态更新**：在表格中将 `Status` 改为 `Published`，填入 `URL`。

---
**版本**：v0.19 | **状态**：全员执行就绪 | 
