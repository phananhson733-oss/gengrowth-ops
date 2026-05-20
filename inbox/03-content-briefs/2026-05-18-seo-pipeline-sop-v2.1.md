---
project: astrologywiki
type: sop
status: final
owner: Ma Boyang
updated: 2026-05-18
version: 2.1
---

# 🚀 SEO 内容生产流水线 (v2.1 · 傻瓜化实操全案版)

> **核心哲学**：去表格化、去机械化。通过“脚本闸门+意图折叠+结构化信息增益”，在单人审核的产能极限下，织密站点的主题权威网。
> **执行准则**：不靠灵感，只做填空。本规范内的所有操作步骤为**强约束**，未按步骤执行的文章在质检环节将直接拒收。

---

## 📊 第一部分：基础设施 - 选题登记表与数据解耦

本环节在 Google Sheets 中完成。严禁在《选题登记表》中手打搜索量数据。采用**三层数据模型**：数据层（Ahrefs原表） -> 架构层（主题集群表） -> 表现层（选题登记表 v2.1）。

### 1. 《选题登记表 v2.1》标准表头 (Schema)

| 列     | 字段名称 (Header)             | 填充性质      | 功能说明                                                |
| :---- | :------------------------ | :-------- | :-------------------------------------------------- |
| **A** | **`page_id`**             | 人工/递增     | 唯一 ID（如 `P-001`），全系统追踪主键。                           |
| **B** | **`cluster_id`**          | 下拉菜单      | 关联“主题集群表”，决定内链网归属。                                  |
| **C** | **`Track`**               | 下拉菜单      | 线别：量产线 (Mass) / 精修线 (Refine)。                       |
| **D** | **`Target Keyword`**      | 人工输入      | A列主排名词。**命中黑名单时该行自动标红。**                            |
| **E** | **`Associated Keywords`** | AI/人工     | B列变体词。1+N 折叠后的所有近义词/长尾词。                            |
| **F** | **`MSV (US)`**            | **公式自动**  | VLOOKUP 关键词主表，获取美国月搜索量。                             |
| **G** | **`KD`**                  | **公式自动**  | VLOOKUP 关键词主表，获取竞争难度。                               |
| **H** | **`Intent`**              | **公式自动**  | **四层漏斗判定**：Info / Compare / Tutorial / Utility。     |
| **I** | **`Tier`**                | 下拉菜单      | **产能定级**：T1 (重装) / T2 (标准) / T3 (占位)。               |
| **J** | **`page_role`**           | 下拉菜单      | **页面角色**：Pillar / Spoke / Tool / Wiki / Standalone。 |
| **K** | **`Template`**            | 下拉菜单      | 匹配附录 A 的五类页面结构模板。                                   |
| **L** | **`Content Angle`**       | AI/人工     | 精修线必填：一句话差异化创作视角。                                   |
| **M** | **`Psych Safety`**        | **公式自动**  | 安全开关：命中敏感词自动亮起 `Y`。                                 |
| **N** | **`Entity`**              | AI 提取     | 5 个核心专业术语，用于建立语义主权。                                 |
| **O** | **`Friction`**            | Reddit 搜证 | 真实用户痛点/抱怨证据。                                        |
| **P** | **`Logic`**               | AI/人工     | 机制拆解与 Trade-off 权衡逻辑。                               |
| **Q** | **`Primary CTA`**         | **公式映射**  | 自动匹配工具页链接或 Newsletter 订阅。                           |
| **R** | **`Status`**              | 下拉菜单      | 待写 / 写作中 / 审核中 / 已发布。                               |
| **S** | **`URL`**                 | 发布后填入     | 线上真实访问路径。                                           |
| **T** | **`Publish Date`**        | 实时        | 内容正式上线日期。                                           |
| **U** | **`Last Audit`**          | 维护期       | Day 14/30/60 质量与指标审计日期。                             |

### 2. 意图拆分与 1+N 语义折叠 (建卡前置动作)
当分配到一批关键词时，**严禁直接建卡写文章**。必须执行物理隔离与折叠：

1. **自动意图判定 (四层漏斗)**：在登记表的 `E列 (Intent)` 中，配置以下 ARRAYFORMULA 自动计算意图。
   ```excel
   =ARRAYFORMULA(
     IF(ROW(D:D)=1, "Intent",
       IF(ISBLANK(D:D), "",
         IFS(
           REGEXMATCH(LOWER(D:D), "\b(test|quiz|calculator|generator|tool|app|software)\b"), "Utility",
           REGEXMATCH(LOWER(D:D), "\b(vs|versus|difference|best|review|top|alternative)\b"), "Compare",
           REGEXMATCH(LOWER(D:D), "\b(how to|guide|steps|read|find|process)\b"), "Tutorial",
           TRUE, "Info"
         )
       )
     )
   )
   ```
   > 💡 **注意纯专有名词（Head Terms）**：兜底为 `Info` 的纯名词（如 `nakshatra`），必须人工核实 SERP 前三名。如果全为工具，需在 `Intent Override` 列手动修正。

2. **1+N 绝对折叠（消灭同类相食）**：
   * 在同一 Intent 下（如 9 个 `purple aura` 相关词），保留搜索量最大、词义最宽的作为 `Target Keyword (D列)`。
   * 将其余变体词**无数量上限**全部放入 `Associated Keywords (E列)`。
   * **彻底删除多余行**。废除旧版“上限 7 个、溢出拆 Part”的错误规则。

---

## 🧠 第二部分：核心判定标准矩阵 (决策去黑箱化)

为消除单人审核的“黑箱操作”，以下判定必须严格对照标准矩阵执行，严禁凭直觉判断。

### 1. 补充模块 A：四层漏斗意图判定词典 (Intent Decision Matrix)
> **操作说明**：E列 (Intent) 虽由公式自动生成，但运营人员在遇到兜底词（Info）或需手动 Override 时，必须严格参照下表标准，严禁凭直觉判断意图。

| 意图层级 (Intent) | 用户真实心理描述 | 正则匹配词根库 (Regex Keywords) | 页面终极使命 | 禁忌动作 (Red Flags) |
| :--- | :--- | :--- | :--- | :--- |
| **1. 工具/交互 (Utility)** | “别废话，直接给我算出来/测出来。”<br>(漏斗极底，转化率最高) | `test`, `quiz`, `calculator`, `generator`, `tool`, `app`, `software` | 提供一个可交互的输入框/按钮。字数越少越好。 | ❌ 严禁写成 2000 字的长篇大论。<br>❌ 严禁与其他意图混入同一 URL。 |
| **2. 决策/横评 (Compare)** | “我已经知道想要什么了，但我不知道选哪个好，帮我做决定。” | `vs`, `versus`, `difference`, `best`, `review`, `top`, `alternative` | 帮助用户权衡利弊 (Trade-offs)。必须有胜出者。 | ❌ 严禁偏袒。必须有对比表格。<br>❌ 严禁只列举不比较。 |
| **3. 教程/实操 (Tutorial)** | “我已经有目标了，但我不知道第一步该干什么。” | `how to`, `guide`, `steps`, `read`, `find`, `process` | 提供一条清晰、带编号的行动路线图。 | ❌ 严禁缺乏 1. 2. 3. 的步骤说明。<br>❌ 严禁缺乏对常见报错 (Friction) 的提示。 |
| **4. 知识/认知 (Info)** | “我不懂，给我解释一下这个概念。”<br>(漏斗最顶层，流量最大) | `meaning`, `what is`, `definition`, `why`, `history`, `symbolism`<br>(包含所有无明显修饰词的专有名词) | 建立语义权威，解答 What 和 Why。 | ❌ 专有名词兜底警告：纯名词（如 12th house）被判定为 Info 时，必须人工核实 Google 前 3 名是否为工具。 |

### 2. 补充模块 B：产能定级与排期标准 (Tiering Decision Matrix)
> **操作说明**：在建卡 Step 1，运营人员必须对照下表，严格判定关键词的 Tier（T1/T2/T3）。Tier 决定了你能在这篇文章上花多少时间，它是保护单人产能的生命线。

| 产能定级 (Tier) | 判定触发条件 (满足任一即可) | 核心战略目的 | 人工介入深度 (限时要求) | 必须包含的特殊组件 |
| :--- | :--- | :--- | :--- | :--- |
| **T1 (重装页)**<br>每周限额 $\le 3$ 篇 | 1. 核心商业词（主推的 Calculator/App 相关）。<br>2. 高危敏感词（包含 trauma/healing/anxiety）。<br>3. 集群的 Pillar (支柱) 页面。 | 建立不可撼动的品牌信任度 (EEAT) 和转化通道。 | **极深 (45-60 min)**<br>必须亲手去 Reddit 挖真实痛点；必须逐字校验医疗免责声明；人工打磨 H2。 | 1. Psych Safety 免责声明。<br>2. 真实的 Friction 痛点剖析。<br>3. 指向所有 Spoke 的目录锚点。 |
| **T2 (主力页)**<br>常规排期 | 1. 正常占星行业词/中长尾组合词。<br>2. 有明确搜索量，且竞争中等的 Spoke (支撑) 页面。<br>3. 常规的 Tutorial (教程) 词。 | 稳步收割行业中段流量，建立完整的集群知识树。 | **中等 (15-20 min)**<br>检查 AI 生成的结构是否拥挤；检查内链和 CTA 是否正确。 | 1. Answer Lock (AIO 饵块)。<br>2. 明确的 H2/H3 逻辑层级。<br>3. 准确的向上 Pillar 回链。 |
| **T3 (占位页)**<br>全站占比 $\le 60\%$ | 1. 搜索量极小的超长尾词。<br>2. 搜索结果极其杂乱、冷门的“边缘组合词”。<br>3. 为了 1+N 聚类而强行切出的零碎变体。 | 以最低成本实现话题广度覆盖，用排版换取“信息增益”。 | **极浅 (< 3 min)**<br>一扫违禁词；二扫标题；三看排版是否有表格。 | 1. 3行3列的 Markdown 对比表。<br>2. Blockquote 引用块。<br>3. 文末的 ## FAQ 折叠面板。 |

### 3. 补充模块 C：文章角色定义字典 (Page Role Matrix)
> **操作说明**：建卡时，page_role (J列) 决定了该页面在整个站点网络中的“地位”和“内链流向”。严禁凭感觉乱选。

| 页面角色 (page_role) | 角色定义与使命 | 内链责任 (Internal Linking) | 对应的典型 Tier |
| :--- | :--- | :--- | :--- |
| **Pillar (支柱)** | 统领一个集群（Cluster）的“总目录”。概念最宏大（如 Aura Colors Meaning）。 | 向下辐射：必须包含指向该集群内所有 Spoke 的链接（通常以列表或网格形式）。 | 必定是 T1 |
| **Spoke (支撑)** | 挂载在 Pillar 下的垂直细分话题（如 Purple Aura Meaning）。 | 向上进贡：正文前 30% 必须包含一句话，链接回其 Parent Pillar。 | 多为 T2/T3 |
| **Tool (工具)** | 承接 Utility 意图，提供交互。 | 流量黑洞：接受来自各处的导流，不强制向外链（除非是相关进阶服务）。 | 视重要性定 T1/T2 |
| **Wiki (知识)** | 承接纯粹的定义科普。 | 互相平行的知识网络，鼓励横向交叉互链。 | 多为 T2 |
| **Series (连载)** | 性质类似 Spoke，但具有强烈的序列性（如 1st House, 2nd House...）。 | 除了向上连 Pillar，还应该带有 Previous/Next 指向同系列兄弟篇。 | 多为 T2/T3 |
| **Standalone (独立卫星)** | 无法归入任何已知集群的高优流量词（全站 $\le 10\%$）。 | 自给自足：无强制内链负担，只做简单的相关阅读推荐。 | 视流量定 T1/T2 |

* **负向词系统报警**：若 `Target Keyword` 命中脚本黑名单（精准匹配实体，如 `miami dade`, `transit tracker`），该行变红。**直接删除整行**。（白名单如 `transit chart` 自动豁免）。

---

## 🛠 第三部分：五步标准化生产流程 (Day-to-Day Execution)

### STEP 1：准入建卡与开局 (耗时: 2 分钟)
1. **生成 ID**：在 `page_id` 列填入唯一 ID（如 `P-045`）。
2. **挂载集群**：下拉选择归属 `cluster_id`。
3. **心理安全红线**：若 `Psych Safety` 为 `Y`（命中 healing 等词），全篇严禁医疗诊断，语气转为“自我觉察 (Self-reflection)”。

### STEP 2：实体主权与 EEAT 搜证 (耗时: 5 分钟)
1. **提取 Entity**：利用 AI 搜排名前 3 的文章，提取 5 个最核心的专业术语填入 `Entity` 列。
2. **编辑透明度声明**：禁止虚假专家人设。文章页脚必须包含真实工作流声明（例：*Reviewed by AstrologyWiki Team | Combines traditional astrological texts with data-driven insights.*）。

### STEP 3：信息增益注入 (耗时: T1>20分 / T3<1分)
*   **【T1/T2 篇】-> 挖掘真实痛点 (Friction)**
    去 Reddit 搜索 `site:reddit.com "[Target Keyword]" (sucks | confused | myth | problem)`，提炼一句话真实痛点填入表格。
*   **【T3 篇】-> 强制格式化增益**
    跳过深度搜证，但在心中预留排版指令：强制生成对比表、引言块和结构化 FAQ。

### STEP 4：AI 组装生产 (1+N 语义消化法则)
严禁 AI 在正文机械堆砌变体词。将以下燃料包发给大模型（如 Gemini）：

```text
# 🟢 开始组装任务
请根据法典规范生成文章。
[输入参数]
Target Keyword: {D列词} | Associated Keywords: {E列全量长尾词}
Intent: {H列} | Tier: {I列} | Content Angle: {L列}
Entity: {H列术语} | Friction: {I列痛点} | Psych Safety: {M列}

[强制结构化指令]
1. H2 映射：严禁生硬堆砌 Associated Keywords。选出 2-3 个最有信息量的变体词作为 H2 标题。
2. FAQ 黑洞：将其余琐碎的长尾搜索串转化为自然疑问句，集中放入文末 `## Frequently Asked Questions`。对于 T3 文章，这是必选项。
3. AIO 饵块首段：正文必须以 `## TL;DR` 开头，用 100 字加粗解答 What，但对 How 必须用 "This requires 3 crucial steps..." 留存悬念。
4. T3 格式增益 (仅T3)：文章内部必含 1 个 3列3行 的 Markdown 对比表，及 1 个 Blockquote。
```

### STEP 5：双向语义布线 (SOP 分离执行)
1. **日常发布 (向上回链)**：Spoke 文前 30% 插入链接指向 Pillar；Pillar 对应 H2 指向 Spoke。
2. **Day 30 扫荡 (横向/跨簇编织)**：每月 1 次，利用 Obsidian 全局搜索（如搜 "vedic"），批量为前 10 篇不属于该集群的文章打上指向 Pillar 的锚文本。效率远高于单篇思考。

---

## 📉 第四部分：红线机械质检 (10 秒 Pass/Fail 标准)
QA 仅需预览扫描 5 个特征。1 项不符即打回重写：
1. ▢ **饵块存在否？** 顶部有 `## TL;DR`，有加粗，有留悬念。
2. ▢ **视觉拥挤否？** 没有超过 4 行的纯文本段落（用 Bullet points 拆分）。
3. ▢ **增益零件存在否？** T3 必须有 `|对比表|` 和 `## FAQ` 块。
4. ▢ **安全合规否？** (Psych Safety=Y 时) 搜 `cure, diagnose, treat`，有则打回。
5. ▢ **AI 幻觉词否？** 搜 `synergy, leverage, unlock, delve`，有则修改。

---

## 🔄 第五部分：Changelog (相较于 v2.0 的核心更新)
*本次 v2.1 更新直接响应 2026-W21 内部 SEO 评审所暴露的架构与执行缺陷。*

1. **解决“同类相食”与机械拆分**：废除了 v2.0 中“相关词上限 7 个、溢出拆 Part”的规则。引入“1+N 绝对折叠”，无论多少变体词（如 42 个 Calculator 词）强制合并为 1 个独立页面，多余词汇转入 H2 结构和 FAQ 黑洞进行语义消化。
2. **解决意图混淆**：引入四层漏斗意图拆分系统。告别人工盲猜，通过 `.gs` 正则公式强制剥离 Utility（工具）、Compare、Tutorial 和 Info 词汇，从建卡端掐断“百科与计算器混杂”的可能。
3. **解决单人审核产能瓶颈**：明确确立 The 1-Person Filter 产能模型。限制高耗能 T1 页面（每周 $\le 3$ 篇）；为 T3 占位内容引入“格式化信息增益”（强制表格+FAQ），规避 Google 对薄 AI 内容的打压，同时将单篇审核压缩至 3 分钟以内。
4. **引入 AIO/GEO 饵块策略**：响应 AI 概览时代的搜索特征。设立 `TL;DR` 强制区块（提供直接答案吸引 AI 抓取），并加入悬念设定（防止零点击困境，吸引用户入站）。
5. **升级负向词与心理安全防火墙**：将垃圾词拦截从单字（如 `transit`）升级为精确实体词组，避免误杀星象词；对 YMYL 边缘内容强化 Editorial Policy 透明度和语气约束。
6. **优化内链流**：废弃耗时的单篇横向互链要求，改为“平时垂直链，Day 30 批量扫荡横向链”的敏捷内链策略。
7. **新增 Standalone 角色**：解决独立高优词无法归簇的问题，允许 $\le 10\%$ 的流量卫星页存在，彻底取缔杂乱的 `Independent Posts`。