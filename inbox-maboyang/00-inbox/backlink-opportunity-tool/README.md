---
title: 外链机会发现工具
date: 2026-07-21
updated: 2026-07-21
type: note
tags:
  - backlink
  - seo
  - google-sheets
  - local-tool
aliases:
  - Backlink Opportunity Tool
  - 外链机会库
---

# 外链机会发现工具

一个本地运行的 HTML 工具，用于建立“广义外链机会库”，而不是自动评论器。

输入可以是：

- 关键词：通过自托管 SearXNG 搜索 Guest Post、资源页、工具目录、Link Insertion 和博客评论页等机会；
- 竞品域名或产品 URL：通过 SearXNG 找到提及竞品的候选页面，再在本地抓取页面确认是否真的链接到竞品。

每次发现都先保存到本地 CSV，再按状态同步到一个 Google Sheet 工作簿。自动规则通过仅表示 `qualified` 候选，不能表示一定可以获得链接；最终联系、提交和投放均由人工完成。

## 已实现边界

- 默认发现：自托管 SearXNG，无需购买第三方搜索 API；关键词默认组合 5 类搜索足迹。
- 竞品搜索线索：组合 4 类竞品搜索足迹。只有本地抓取确认存在指向竞品的链接后，才写入 `competitor_target_url` 和锚文本；未确认的线索强制进入 `review`。
- DR：免费链路不尝试伪造或推断 DR，统一写为“未提供 / unknown”。如日后接入有授权的数据源，可在人工审核时补充。
- 安全过滤：URL、标题、摘要和真实抓取页面正文均会检查成人、赌博、毒品、诈骗和恶意软件下载等明确高风险词。
- 页面抓取失败、被拦截或非 HTML 页面：自动标为 `review`，不会继续作为 `qualified`。
- Firecrawl：默认不运行。配置自托管 `FIRECRAWL_BASE_URL` 后，只有直接抓取失败时才请求它的 JS 渲染抓取接口。
- 去重：同一 canonical URL 只保留一条，多个关键词或竞品来源合并记录。
- 本地数据：`data/backlink-opportunities.csv` 和 `data/task-runs.csv`。
- Google Sheet：分流到 `外链资源库`、`排除记录`、`任务记录` 三个标签页。

不包含：自动评论、autoComment 回写、自动发邮件、自动填写表单、自动 Disavow、定时重验证、数据库或浏览器自动化。

## 本地启动

要求：Node.js 18 或更高版本。无第三方 npm 依赖。

```bash
cd /Users/wzb/Code/gengrowth-ops/inbox-maboyang/00-inbox/backlink-opportunity-tool
cp .env.example .env
```

编辑 `.env`，默认只需要保留本机 SearXNG 地址：

- `SEARXNG_BASE_URL`：默认 `http://127.0.0.1:8080`，对应下方 Docker 启动的本机 SearXNG。
- `SEARXNG_SECRET`：供 Docker Compose 设置 SearXNG 实例的随机密钥。
- `FIRECRAWL_BASE_URL` 与可选的 `FIRECRAWL_API_KEY`：仅当已部署 Firecrawl，并希望给 JS 重页面增加失败兜底时才填写。
- `GOOGLE_SHEET_WEBAPP_URL` 与 `GOOGLE_SHEET_SHARED_SECRET`：启用 Google Sheet 同步。

## 启动免费 SearXNG

本项目默认通过本机 SearXNG 的 JSON 搜索接口工作。首次启动前，在工具目录的 `.env` 中填入随机密钥：

```bash
openssl rand -hex 32
# 将输出粘贴为 .env 中的 SEARXNG_SECRET=...
docker compose -f docker-compose.searxng.yml up -d
```

如果你的环境使用独立的 Compose 二进制，则将命令中的 `docker compose` 替换为 `docker-compose`。

确认服务可用（应返回 JSON，而不是 HTML 错误页）：

```bash
curl 'http://127.0.0.1:8080/search?q=AI%20writing%20tools&format=json'
```

SearXNG 只是搜索发现层，不是完整的 backlink index：竞品模式返回的是可验证的搜索线索，而非声称“竞品全部反链”。请遵守所选搜索引擎的使用政策，并适当控制运行频率。

## 可选：自托管 Firecrawl JS 兜底

Firecrawl 不参与默认发现，也不会主动抓取全部候选。仅在普通 HTTP 抓取失败时，它才用来获取一个候选页面的已渲染 HTML。按 [Firecrawl self-hosting 文档](https://docs.firecrawl.dev/self-hosting) 部署后，将其服务地址填入 `.env`：

```bash
FIRECRAWL_BASE_URL=http://127.0.0.1:3002
# 如果你的部署要求认证，再填写：
FIRECRAWL_API_KEY=...
```

未配置时，抓取失败的候选会安全地留在 `review`，不会因此变成合格资源。

在 zsh 中启动：

```bash
set -a
source .env
set +a
npm start
```

打开 <http://127.0.0.1:4318>。不要直接双击 `index.html`；该页面必须通过本地服务调用接口，浏览器永远不接触 API key。

启动前可先检查能力配置：

```bash
set -a
source .env
set +a
npm run check
```

检查命令只校验本地端点是否已配置，不会输出密钥值；它不替代上面的 SearXNG HTTP 连通性检查。

## 部署 Google Sheet 接收端

1. 创建一个 Google Sheet，并从 URL 中复制 Spreadsheet ID。
2. 打开“扩展程序 → Apps Script”，或访问 <https://script.google.com> 创建独立项目。
3. 将 `google-sheet-receiver.gs` 的完整内容粘贴进去。
4. 将文件顶部的两个占位符改为：

   - `SPREADSHEET_ID`：步骤 1 的 ID；
   - `SHEET_SHARED_SECRET`：随机长字符串。它必须与本机 `.env` 的 `GOOGLE_SHEET_SHARED_SECRET` 完全一致。

5. 部署 → 新建部署 → 网页应用：

   - 执行身份：部署账号；
   - 访问权限：允许本机 Node 服务请求的最小范围。若必须选“任何人”，共享密钥是写入保护门槛，不要把 Web App URL 或密钥发到公开渠道；
   - 复制以 `/exec` 结尾的部署 URL，填入 `.env` 的 `GOOGLE_SHEET_WEBAPP_URL`。

6. 在工具中点击“同步到 Google Sheet”。初次同步会自动创建三个标签页并写入表头。

接收端只接受含共享密钥的 JSON。即使 Web App URL 泄露，没有密钥也不能写入表格。

## 状态与筛选口径

| 状态 | 含义 | Google Sheet 去向 |
| --- | --- | --- |
| `qualified` | 已通过规则和页面检查，可人工评估联系/提交路径 | 外链资源库 |
| `review` | 页面抓取失败、被阻止或信号不足；禁止直接使用 | 外链资源库 |
| `rejected` | 明确命中黄赌毒、诈骗、恶意软件等硬规则 | 排除记录 |

`rejected` 不出现在可用资源表，但会保留在排除记录中，以避免同一有毒域名或 URL 在未来任务里被重复发现。

DR 只是质量信号，不是内容安全判断；在当前免费链路中它显示为“未提供”。建议在 Google Sheet 中结合 `external_link_count`、`opportunity_type`、主题相关性和人工审核作决定，不要仅按单一指标删除。

## 验证

```bash
npm test
```

测试覆盖 URL 归一、SearXNG 关键词与竞品线索归一、竞品链接本地验证、黄赌毒硬过滤、Firecrawl 失败兜底、抓取失败降级、CSV 往返和去重、本地存储、密钥不下发浏览器、HTML 输入模式、Google Sheet 三表分流与共享密钥传递。
