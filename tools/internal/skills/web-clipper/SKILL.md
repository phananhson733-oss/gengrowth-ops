---
name: web-clipper
description: Web page clipper that converts URLs into local Obsidian Markdown documents. Downloads images locally, preserves tables/links/formatting, and adds YAML frontmatter. Use this skill whenever the user wants to clip a web page, save a URL's content locally, archive an article, convert a web page to markdown, or sync online content to their local wiki/vault. Also use when user says "剪藏", "保存网页", "把这个链接内容存下来", "抓取网页内容", or similar.
---

# Web Clipper

将网页内容保存为本地 Obsidian Markdown 文档，图片下载到本地。

## 架构概览

三层抽取管线，根据 URL/页面类型自动选择：

| 页面类型 | 检测方式 | 抽取引擎 | 图片下载 |
|---|---|---|---|
| **通用网页** | 默认 | Playwright 渲染 → defuddle → Markdown | `page.request.get(url)` |
| **飞书/Lark 文档** | URL 包含 `larkoffice.com`/`feishu.cn` | API 拦截 → `lark_blocks_to_md.py` | Token 内部 API |
| **飞书回退** | Lark 页面但无 API 数据 | 虚拟滚动 + DOM 提取 | `page.request.get(url)` |

## 工作流程

```
URL → 第一步:抓取+下载 → 第二步:生成文档 → 第三步:验收检查 → 第四步:AI纠错 → 第五步:更新来源 → 完成
         (一条命令)      (存入来源笔记子目录)   (必须全部PASS)     (仅修正错误)    (wiki link)
```

## 第一步：抓取 + 下载图片

一条命令完成内容抓取、图片下载、路径替换：

```bash
python3 <skill-path>/scripts/fetch_with_cookies.py "<url>" \
  --mode profile --wait 8 \
  --download-images "<save-dir>/assets/<noteFileName>" \
  --note-name "<noteFileName>"
```

飞书文档加 `--save-api-data` 保存 API 数据（供第三步深度验证）：
```bash
python3 <skill-path>/scripts/fetch_with_cookies.py "<url>" \
  --mode profile --wait 8 \
  --download-images "<save-dir>/assets/<noteFileName>" \
  --note-name "<noteFileName>" \
  --save-api-data /tmp/lark_api_data.json
```

模式说明：
- `profile` — 复用 Chrome 登录会话（**Chrome 必须关闭**）
- `cookies` — 使用导出的 cookies JSON（`--cookies-file path.json`）
- `public` — 无需认证，通过 Playwright 渲染 JS

输出：JSON 格式。`content_markdown` 中的图片路径**已替换为本地路径**（如 `assets/noteName/image-001.png`）。

### 引擎详情

**通用页面（defuddle 模式）：**
- Playwright 渲染 → `defuddle_bridge.mjs` → Markdown
- 回退：markdownify
- 适用：文章、博客、文档、wiki、论坛

**飞书文档（lark_api 模式）：**
- 拦截 `/space/api/docx/pages/client_vars` API 响应
- `lark_blocks_to_md.py` 转换 block_map（Etherpad changeset）
- 图片：`internal-api-drive-stream-{region}.larkoffice.com`
- 覆盖率：100% 标题、100% 图片、99.4% 文本

**飞书回退（lark_virtual_scroll 模式）：**
- 滚动 `.bear-web-x-container`，`data-block-id` 去重
- API 拦截失败时使用

## 第二步：生成文档

从 JSON 输出中提取 `content_markdown` 和 `title`，拼接 frontmatter 后保存为 `.md` 文件。

### 文件存放规则

剪藏文档存放在**来源笔记的同名子目录**下，而非统一的参考资料目录：

1. 确定来源笔记：用户提供 URL 时，确认该 URL 来自哪个笔记（如用户说明或搜索 vault 中包含该 URL 的笔记）
2. 在来源笔记同级创建同名子目录，将剪藏文档和图片存放其中
3. 剪藏完成后，更新来源笔记中的链接为 wiki link，同时保留原文链接

```
示例：URL 来自 商务线索/Tiktok小游戏.md

商务线索/
├── Tiktok小游戏.md                          ← 来源笔记
└── Tiktok小游戏/                            ← 同名子目录
    ├── 全球休闲游戏用户画像及游戏趋势.md          ← 剪藏文档
    └── assets/
        └── 全球休闲游戏用户画像及游戏趋势/        ← 图片
```

来源笔记链接更新格式：
```markdown
# 更新前
4. 行业动态：<https://example.com/doc/xxx>

# 更新后
4. 行业动态：[[Tiktok小游戏/全球休闲游戏用户画像及游戏趋势|全球休闲游戏用户画像及游戏趋势]]（[原文](https://example.com/doc/xxx)）
```

**注意**：第一步中 `--download-images` 路径需对应子目录位置：
```bash
--download-images "<来源笔记目录>/<来源笔记名>/assets/<noteFileName>"
```

### Frontmatter

模板（见 `references/frontmatter-template.md`）：

```yaml
---
title: "<JSON 输出中的 title>"
source: "<原始 URL>"
clipped: YYYY-MM-DD
type: reference
tags:
  - clipped
  - <根据内容自动判断的主题标签>
---
```

### Obsidian 附件规范

`obsidian-custom-attachment-location` 插件：
- 图片目录：`./assets/${noteFileName}/`
- 引用格式：`![alt](assets/<noteFileName>/image-001.png)`

## 第三步：验收检查

### 3.1 通用文档验证（每次必须运行）

```bash
python3 <skill-path>/scripts/verify_doc.py <clipped.md> --strict
```

6 项检查：基本指标、frontmatter、图片引用完整性（文件存在+非空+编号连续）、链接有效性、Markdown 语法、内容结构。

**FAIL 项必须修复后重新验证。**

### 3.2 深度验证（飞书文档专用，需 API 数据）

```bash
python3 <skill-path>/scripts/deep_verify.py <clipped.md> <api_data.json> [--img-dir <path>]
```

8 项检查：

| # | 检查项 | 标准 | 级别 |
|---|---|---|---|
| 1 | 元素数量 | 各类型 >=90% | FAIL |
| 2 | 文本覆盖率 | >=99% | FAIL |
| 3a | 图片顺序 | image-001 到 image-N 连续 | FAIL |
| 3b | Token→文件映射 | 每个引用指向不同文件 | FAIL |
| 3c | 图片标题 | 有标题的图片保留标题 | WARN |
| 3d | 图片文件 | 无空文件、数量匹配 | FAIL |
| 4 | 标题顺序 | 与转换器输出一致 | WARN |
| 5 | 表格维度+内容 | 维度匹配，内容覆盖 >=95% | FAIL |
| 6 | 文本格式 | 粗体/斜体/链接 >=80% | WARN |
| 7 | 列表嵌套 | 缩进深度一致 | WARN |
| 8 | Markdown 语法 | 无未闭合标记 | WARN |

**FAIL 项必须修复后重新验证。**

### 3.3 回归测试（修改代码后运行）

```bash
python3 <skill-path>/scripts/acceptance_test.py --public-only  # 快速
python3 <skill-path>/scripts/acceptance_test.py               # 完整（Chrome 必须关闭）
```

## 第四步：AI 纠错

验证通过后，对文档做最终纠错。详细规则见 `references/ai-cleanup-rules.md`。

### 修正范围

| 修正 | 示例 |
|---|---|
| 无意义字符 | 零宽空格 `\u200b`、装饰性文本如 `♪(*^^)o∀ - 到底了` |
| 错别字 | 「己经」→「已经」 |
| 标点错误 | 中文语境用英文逗号 |
| 未闭合格式 | `**粗体` → `**粗体**` 或移除 |
| 空引用 | `[文本]()` → `文本` |
| 排版 | 中英文间加空格、多余空行合并 |

### 禁止修改

- **不改原文语义**：不改写、不润色、不换说法
- **不改数据**：数字、百分比、统计数据
- **不改专有名词**：产品名、品牌名、技术术语
- **不改引用**：引号内容、代码块、表格数据
- **不改路径**：图片引用路径、链接 URL、frontmatter

### 操作流程

1. 读取完整文档
2. 逐段检查，仅标记明确的错误
3. 用 Edit 工具逐个修正（最小改动范围）
4. **不确定是否为错误时，不改**
5. 修正完成后，再次运行 `verify_doc.py --strict` 确认未引入新问题

**注意**：AI 纠错后不再运行 `deep_verify.py`。deep_verify 检查原始内容保留率，AI 纠错会故意改动文本（修正错字、删除无意义字符），导致 deep_verify 的文本覆盖率下降，这是预期行为。

## 第五步：更新来源笔记

将来源笔记中的原始 URL 替换为 wiki link + 原文链接：

1. 找到来源笔记中对应的 URL
2. 替换为：`[[子目录/文档名|显示名]]（[原文](URL)）`
3. 确认 Obsidian 中 wiki link 可正常跳转

## 处理新的特殊网站

详见 `references/special-site-handling.md`。

```
标准抽取失败？
├── 有内部 API？ → 拦截 API 响应（参照飞书方案）
├── SPA/JS 渲染？ → Playwright + defuddle，增加 --wait
├── 虚拟滚动？ → 滚动收集 + 去重（参照 virtual_scroll）
└── 需要认证？ → --mode profile（Chrome 关闭）或 --mode cookies
```

## 文件列表

| 文件 | 用途 |
|---|---|
| `scripts/fetch_with_cookies.py` | 主入口：抓取+图片下载+路径替换 |
| `scripts/lark_blocks_to_md.py` | 飞书 block_map → Markdown 转换器 |
| `scripts/defuddle_bridge.mjs` | Node.js defuddle HTML→Markdown 桥接 |
| `scripts/download_images.py` | 独立图片下载器（无认证场景） |
| `scripts/verify_doc.py` | 通用文档完整性验证 |
| `scripts/deep_verify.py` | 飞书深度验证（元素级对比） |
| `scripts/acceptance_test.py` | 回归测试套件 |
| `scripts/compress_images.py` | 图片压缩（PNG→WebP/JPG，自动更新 markdown 引用） |
| `references/frontmatter-template.md` | YAML frontmatter 规范 |
| `references/special-site-handling.md` | 特殊网站处理方法论 |
| `references/ai-cleanup-rules.md` | AI 纠错详细规则 |
| `package.json` | Node.js 依赖（defuddle, jsdom） |
