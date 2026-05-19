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

### 1. 意图拆分与 1+N 语义折叠 (建卡前置动作)
当分配到一批关键词时，**严禁直接建卡写文章**。必须执行物理隔离与折叠：

1. **自动意图判定 (四层漏斗)**：在登记表的 `E列 (Intent)` 中，配置以下 ARRAYFORMULA 自动计算意图，并基于此通过**筛选视图 (Filter Views)**隔离处理任务。
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

## 🧠 第二部分：核心判定与产能模型 (The 1-Person Filter)

建卡时，必须根据以下标准锁定产能定级，保护单人审核的精力。

| 角色设定 (J列)        | 产能定级 (I列)  | 操作员必做核对表 (Checklist)                                | 审核限时          |
| :--------------- | :--------- | :-------------------------------------------------- | :------------ |
| **Pillar (支柱)**  | **下拉选 T1** | ▢ 确认每周 T1 任务 $\le 3$ 篇<br>▢ 确认 `Psych Safety` 是否需开启 | **45-60 min** |
| **Series (主力)**  | **下拉选 T2** | ▢ 确认是否有同集群的 Pillar 存在                               | **15 min**    |
| **Support (长尾)** | **下拉选 T3** | ▢ 确认全站 T3 占比未超 60%<br>▢ 准备生成强制表格和 FAQ               | **< 3 min**   |
| **Standalone**   | 视流量定 T1/T2 | ▢ 确认该词无法归入任何已知集群 (占比 $\le 10\%$)                    | 视定级而定         |

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