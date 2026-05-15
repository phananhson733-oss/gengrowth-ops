---
project: astrologywiki
type: archive
status: archive
owner: Ma Boyang
updated: 2026-05-14
---

# 🚀 SEO 内容生产流水线 (v0.18 · 工业执行全案)

> **核心哲学**：不靠灵感写作，只靠逻辑组装。将 SEO 文章拆解为标准化零件，确保每一篇都具备“信息增益”。

---

## 📊 第一部分：基础设施 - [选题登记表](https://docs.google.com/spreadsheets/d/1JDaPu2llI9SOzISi2YsmkUELI0ArnZewFv_frQ_Wkfs/edit?usp=sharing) (Topic Registry)

在开始任何动作前，请确保你的协作表（Notion 或 Google Sheets）已建立以下字段。这些字段是 AI 组装的“燃料”。

| 字段名称 (Header) | 汉语翻译 | 填写时机 | 核心注释 (Notes) |
| :--- | :--- | :--- | :--- |
| **Keyword** | 目标词 | Step 1 | 文章要排名的核心主词。 |
| **Intent** | 搜索意图 | Step 1 | 用户搜索该词的真实目的 (Info/Compare/Tutorial 等)。 |
| **Tier** | 生产定级 | Step 1 | 决定投入成本的等级 (T1-T3)。 |
| **Template** | 模板模式 | Step 1 | 文章的结构框架 (Definition/Comparison/Tutorial 等)。 |
| **Entity** | 主权实体 | Step 2 | 本文占据主权的专业术语，防止站内内容内耗。 |
| **Friction** | 痛点证据 | Step 3 | 从 Reddit/论坛抓取的具体真实案例或报错。 |
| **Logic** | 底层逻辑 | Step 3 | 解释痛点的 Mechanism (机制) 与 Trade-off (权衡)。 |
| **CTA** | 转化出口 | Step 5 | 本文引导用户点击的产品链接或注册入口。 |
| **GSC Keywords** | GSC 增补词 | 发布 30 天后 | 从 Google Search Console 抓取的该页面已获得排名但正文中缺失的词，用于内容刷新。 |
| **Last Audit** | 审计日期 | 定期审计 | 该页面最后一次进行内容更新或质量检查的日期。 |
| **Status** | 执行状态 | 实时更新 | 记录流水线进度 (选题/搜证/初稿/质检/Published)。 |
| **URL** | 在线链接 | Step 5 | 文章发布后的正式在线网址。 |

---

## 🧠 第二部分：核心判定决策矩阵 (Decision Matrix)

在 Step 1 登记任务时，请严格对照下表进行勾选。**判定越准，AI 出稿的废话就越少。**

### 1. Search Intent (搜索意图判定)
| 选项             | 触发条件 (SERP 特征)                                | 选择原因 (User Psychology)             |
| :------------- | :-------------------------------------------- | :--------------------------------- |
| **Info**       | 标题多为 "What is...", "Meaning", "Definition"    | 用户处于认知阶段，需要**清晰的定义和 Snippet 答案**。  |
| **Compare**    | 标题多为 "Best...", "Top 10", "vs", "Review"      | 用户处于决策阶段，需要**横向对比和 Trade-off 权衡**。 |
| **Tutorial**   | 标题多为 "How to...", "Steps", "Guide", "Process" | 用户处于执行阶段，需要**具体的动作序列和避坑指南**。       |
| **Utility**    | 结果中出现大量计算器、查询工具、转换表                           | 用户想要**直接的结果值**，不想要阅读长篇大论。          |
| **Experience** | 结果前 5 名中 Reddit/Quora/论坛占 3 个以上               | 用户不相信官方博客，在寻找**真实用户的“血泪史”或非共识观点**。 |
| **BOFU**       | 标题包含 "Pricing", "Buy", "Login", "Register"    | 用户已准备转化，需要**极短的路径和明确的价值主张**。       |

### 2. Content Tier (生产定级)
| 选项 | 触发条件 | 资源分配策略 |
| :--- | :--- | :--- |
| **Tier 1 (重装)** | 核心商业词 或 Reddit 占比 > 30% | **精耕细作**：必须人工搜证 Reddit，必须有 2 个以上 Logic 零件，QA 严审。 |
| **Tier 2 (标准)** | 正常竞争的科普词/行业词 | **降本增效**：不强制搜 Reddit，可用 AI 专家模拟法搜证，标准 QA。 |
| **Tier 3 (占位)** | 搜索结果极其冷门 或 极其杂乱 | **极速覆盖**：不搜证，直接让 AI 组装，检查开头即可发布，工时控制在 10min 内。 |

### 3. Template Mode (模板模式)
| 选项               | 对应意图           | 结构核心 (Must-have)                               |
| :--------------- | :------------- | :--------------------------------------------- |
| **Definition**   | Info           | **Answer Lock** (开头 120 字加粗直给) + 机制解释。         |
| **Comparison**   | Compare        | **对比矩阵表** + 3 个以上的 Trade-off (代价) 权衡。          |
| **Tutorial**     | Tutorial       | **Step-by-Step 动作条** + 关键步骤的 Friction (报错) 提醒。 |
| **Programmatic** | Utility / BOFU | **极简文本** + 极其醒目的 CTA 按钮或数据计算框。                 |
| **Case Study**   | Experience     | **故事化叙述** + 真实截图/引用 + 最终结果数据。                  |

---

## 🛠 第三部分：五步标准化生产流程

### STEP 1：准入预检与规格锁定 (决定“做不做”)
> **SEO 价值**：防止在无法排名的词（如纯产品词）上浪费工时，确保每一分投入都有回报。

1.  **SERP 扫描**：在 Google 无痕模式搜索关键词。
    *   **快败红线 (Fail Fast)**：若搜索结果前 10 名中，产品首页或注册页占了 6 个以上，**立即放弃**，将该词移交给“落地页优化组”。
2.  **意图判定 (Search Intent)**：
    *   **标题特征**：包含 "What is" (Info), "Best" (Compare), "How to" (Tutorial)。
    *   **载体判定**：若全是视频 -> 用户想看 Demo；若全是 Reddit -> 用户想听真话。
3.  **定级与选模**：
    *   **Tier 1**：Reddit 讨论多或商业价值高。
    *   **Template**：根据意图选模式（Definition / Comparison / Tutorial / Programmatic）。

**✍️ 登记动作**：在表中填入 `Keyword`, `Intent`, `Tier`, `Template`。
> **💡 避坑指南**：不要凭直觉定意图，必须看 Google 现在排在前面的页面长什么样。

---

### STEP 2：实体主权搜证 (决定“独特性”)
> **SEO 价值**：告诉 Google 你的文章拥有某个专业领域的“解释权”，避免与站内已有内容发生内耗（Cannibalization）。

1.  **竞品术语提取**：
    *   利用 AI 分析前三名竞品（文章、视频简介或论坛摘要）。
    * **AI 提取指令**：“分析以上素材，提取出出现频率最高、且最能代表该话题专业性的 5 个核心术语（Entities）。”
    *   提取出 5 个代表该话题专业性的术语（Entities）。
2.  **主权查重**：在登记表中 `Ctrl+F` 搜索这些术语。
    *   **原则**：选出一个**从未被其他文章作为“主词”**的术语。

**✍️ 登记动作**：选定一个核心术语填入 `Entity`。
> **💡 避坑指南**：主权实体越具体越好，不要选“Astrology”这种大词，要选“Midheaven”这种细分词。可以是适当参考其在ahrefs上的数据

---

### STEP 3：信息增益搜证 (注入“灵魂零件”)
> **SEO 价值**：这是对抗 AI 同质化的核心。通过真实世界的案例（Friction）和逻辑（Logic），提升页面的“专家度 (E-E-A-T)”。

1.  **真实痛点挖掘 (Friction Mining)**：
    *   **动作**：搜索 `site:reddit.com "keyword" (sucks|problem|bad)`。
    *   **目标**：找一个带数字或具体报错的“血泪史”。
2.  **逻辑提炼 (Logic)**：
    *   **Mechanism (机制)**：为什么用户会遇到这个坑？（技术/科学解释）。
    *   **Trade-off (权衡)**：如果用户想获得 A，必须牺牲 B（例如：免费版通常牺牲隐私）。

**✍️ 登记动作**：填入 `Friction` 案例和 `Logic` 结论。
> **💡 避坑指南**：严禁在 Friction 栏填形容词（如“很难用”），必须填具体事实（如“API 权限未开导致 403 报错”）。

---

### STEP 4：AI 组装生产 (自动化执行)
> **SEO 价值**：通过结构化的指令包，强制 AI 输出高密度、低废话的内容。

1.  **发送燃料包**：先发送[系统提示词](obsidian://open?vault=gengrowth-ops&file=inbox%2F%E5%86%85%E5%AE%B9%E5%88%9B%E4%BD%9C%2FSEO%E5%86%85%E5%AE%B9%E7%94%9F%E4%BA%A7%E6%8F%90%E7%A4%BA%E8%AF%8D_v0.18)，再发送变量包：
    ```markdown
    # Assembly v0.18
    Keyword: {Keyword} | Intent: {Intent} | Template: {Template}
    Primary Entity: {Entity}
    Friction Case: {Friction}
    Logic: {Logic}
    ```
2.  **红线质检**：
    *   开头前 120 字是否**加粗并直接回答**了用户疑问？
    *   全文数字密度（%, $, hours）是否丰富？
    *   是否清理了 AI 禁词（synergy, leverage 等）？

**✍️ 登记动作**：更新 `Status` 为“初稿完成/质检中”。

---

### STEP 5：发布与语义布线 (商业闭环)
> **SEO 价值**：通过内链构建 Topic Cluster，通过 CTA 实现流量转金。

1.  **向上链接**：前 30% 必须包含一个指向 **Pillar Page** 的链接。
2.  **场景化转化**：在 Step 3 提到的痛点下方 20 字内，植入你的 `CTA` 链接。
3.  **全量同步**：将搜到的 Friction 存入《统一素材库》，作为公司资产。

**✍️ 登记动作**：填写正式 `URL`，将 `Status` 改为 `Published`。

---

## 📉 三大执行红线 (Zero Tolerance)

1.  **字段空缺红线**：只要 `Friction` 或 `Logic` 是空的，该任务自动作废，严禁出稿。
2.  **禁词红线**：出现一个 AI 禁词，整段重写。
3.  **资产库优先红线**：如果《统一素材库》里已有同类素材，严禁重新去 Reddit 搜索，直接复用。
