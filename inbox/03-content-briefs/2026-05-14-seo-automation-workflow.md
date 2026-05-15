---
project: astrologywiki
type: report
status: draft
owner: Ma Boyang
updated: 2026-05-14
---


# Make.com 自动化工作流解析：SEO 竞品分析与大纲生成

## 工作流概览
**场景名称：** Integration Google Sheets, HTTP
**核心功能：** 自动监控 Google 表格中的新关键词，通过 SerpApi 抓取 Google 搜索结果，利用 Jina AI 提取竞品网页正文，最后调用 Gemini AI 生成结构化 SEO 大纲并回写至表格。

---

## 模块节点拆解

### 1. 触发器：Google Sheets - 监控新行 (Watch Rows)
* **模块 ID：** `1`
* **功能描述：** 监控指定 Google 表格的新增数据行，提取目标关键词。
* **核心参数：**
    * `Spreadsheet ID`: `...VNEvd7UMu2o2w` (项目：SEO自动化流水线)
    * `Sheet Name`: `工作表1`
    * `Limit`: `2` (单次最大处理 2 行数据)
    * 包含表头 (`A1:Z1`)：A列为“目标关键词”，B列为“生成的竞品大纲”。

### 2. 搜索引擎调用：HTTP - 发送请求 (Make a request)
* **模块 ID：** `2`
* **功能描述：** 将关键词发送至 SerpApi，获取 Google 搜索的竞品链接。
* **API 端点：** `https://serpapi.com/search.json`
* **参数映射：**
    * `q` (搜索词): `{{1.\`0\`}}` (提取自模块 1 的 A 列数据)
    * `engine`: `google`
    * `parseResponse`: `true` (将返回结果解析为结构化数据)

### 3. 数据迭代器：Flow Control - Iterator
* **模块 ID：** `3`
* **功能描述：** 解析 SerpApi 返回的复杂 JSON，将多个竞品结果拆分为单条处理通道。
* **数据源映射：** `{{2.data.organic_results}}` (提取模块 2 返回的自然搜索结果数组)

### 4. 网页正文抓取：HTTP - 发送请求 (Make a request)
* **模块 ID：** `4`
* **功能描述：** 利用 Jina AI 的网页解析能力，穿透反爬提取纯净网页正文。
* **API 端点：** `https://r.jina.ai/{{3.link}}` (`{{3.link}}` 提取自迭代器拆分出的目标网址)
* **异常处理策略 (Error Handler)：**
    * 挂载了 `Ignore` 模块 (ID: 12)。若网页抓取失败 (如 404 或拦截)，自动忽略并继续执行下一条链接。

### 5. 文本聚合器：Text Aggregator
* **模块 ID：** `6`
* **功能描述：** 等待迭代器 (ID: 3) 循环结束，将多篇竞品的正文合并为一个文本包。
* **聚合内容模板：** `以下是 3 篇竞品文章的正文内容，请作为参考：{{4.data}}` (汇总模块 4 抓取的正文)

### 6. 过渡逻辑：JSON - Create JSON
* **模块 ID：** `8`
* **功能描述：** 此节点用于构建给大模型的初步提示词框架结构。

### 7. AI 大脑处理：Google Gemini AI - 简单文本提示
* **模块 ID：** `10`
* **功能描述：** 根据目标关键词和抓取到的竞品资料，生成 SEO 大纲。
* **核心参数：**
    * `Model`: `gemini-3.1-pro-preview`
* **提示词 (Prompt) 结构：**
  > 你是一位顶级 SEO 专家。请根据以下参考内容，为 **{{1.\`0\`}}** (A列关键词) 生成一份深度 SEO 文章大纲。
  > 
  > 要求：
  > 结构清晰，包含 H2/H3 标签。
  > 提取竞品的共性关键词。
  > 寻找差异化机会，补充竞品未提及的深度内容。
  > 
  > 参考资料如下：
  > **{{6.text}}** (聚合后的竞品正文)

### 8. 数据回写：Google Sheets - 更新行 (Update a Row)
* **模块 ID：** `11`
* **功能描述：** 将 Gemini 生成的大纲精准写入目标表格。
* **参数映射：**
    * `Row number`: `{{1.\`__ROW_NUMBER__\`}}` (匹配模块 1 触发时的原始行号)
    * `Values (Column B)`: `{{10.result}}` (写入模块 10 输出的文本结果)