---
title: 外链机会发现工具
date: 2026-07-21
updated: 2026-07-23
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

> **⚠️ DEPRECATED（2026-07-24）**：本工具已被 skill `find-backlinks`（`.agents/skills/find-backlinks/`）取代。
> 新方案用 Ahrefs MCP,秒级到分钟级出结果,输出同款 7 列 CSV。SearXNG / Vercel / Mac mini Worker
> 待新 skill 用真实域名验证通过后停用;旧代码与旧 CSV 数据暂时保留,不删除。

一个可通过内部共享链接或本地服务使用的工具，用于发现广义外链机会，而不是自动评论器。

输入可以是：

- 关键词：通过自托管 SearXNG 搜索 Guest Post、资源页、工具目录和 Link Insertion 等可争取的外链机会；
- 竞品域名或产品 URL：通过 SearXNG 找到提及竞品的候选页面，再在本地抓取页面确认是否真的链接到竞品。

共享版的结果只保留在当前浏览器页面，用户需要点击“导出本次 CSV”保存到本地。Google Sheet 只承担 Vercel 与 Mac mini Worker 之间的临时任务和结果交接，不再作为用户结果库或备份库。自动规则通过仅表示 `qualified` 候选，不能表示一定可以获得链接；最终联系、提交和投放均由人工完成。

## 已实现边界

- 默认发现：自托管 SearXNG，无需购买第三方搜索 API；关键词默认组合 4 类搜索足迹，不搜索或导出博客评论页。
- 竞品搜索线索：组合 4 类竞品搜索足迹。只有本地抓取确认存在指向竞品的链接后，才写入 `competitor_target_url` 和锚文本；未确认的线索强制进入 `review`。
- DR：免费链路不尝试伪造或推断 DR，统一写为“未提供 / unknown”。如日后接入有授权的数据源，可在人工审核时补充。
- 安全过滤：URL、标题、摘要和真实抓取页面正文均会检查成人、赌博、毒品、诈骗和恶意软件下载等明确高风险词。
- 页面抓取失败、被拦截或非 HTML 页面：自动标为 `review`，不会继续作为 `qualified`。
- Firecrawl：默认不运行。配置自托管 `FIRECRAWL_BASE_URL` 后，只有直接抓取失败时才请求它的 JS 渲染抓取接口。
- 去重：同一 canonical URL 只保留一条，多个关键词或竞品来源合并记录。
- 旧本地版数据：`data/backlink-opportunities.csv` 和 `data/task-runs.csv`；共享版不读取这些文件。
- Google Sheet：新任务只使用 `任务记录` 和隐藏的 `_临时任务结果` 作为临时通道；既有 `外链资源库`、`排除记录` 和旧任务不会被删除或改写。

不包含：自动评论、autoComment 回写、自动发邮件、自动填写表单、自动 Disavow、定时重验证、数据库或浏览器自动化。

## 本地启动

要求：Node.js 18 或更高版本。无第三方 npm 依赖。

```bash
cd /Users/wzb/gengrowth-wiki/tools/internal/backlink-opportunity-tool
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

SearXNG 只是搜索发现层，不是完整的 backlink index：竞品模式返回的是可验证的搜索线索，而非声称“竞品全部反链”。请遵守所选搜索引擎的使用政策，并适当控制运行频率。免费 SearXNG 任务会将搜索请求间隔限制为 5 秒；上游限流或 CAPTCHA 时会等待 180 秒后重试同一查询页，单任务最长 45 分钟。处理中请保持页面打开，完成后再导出本次 CSV。

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

## 共享版部署预检

共享版使用 Vercel、既有 Google Sheet 和 Mac mini 私有 SearXNG Worker；Google Sheet 只是临时任务和结果交接通道，不是用户结果存储。部署前在工具目录运行：

```bash
node scripts/deploy-preflight.mjs
```

该命令只输出缺失的环境变量名称，不会输出任何值。缺少已授权的 Vercel 项目、Google Sheet Web App 或 Mac mini Worker 运行环境时应停止部署；不要自行创建外部付费资源。仓库中遗留的 `db/` 和 `src/postgres-*` 实验文件不参与共享版运行或部署。

共享版的服务端变量为 `BACKLINK_ACCESS_TOKEN`、`BACKLINK_SESSION_SECRET`、`SEARXNG_BASE_URL`、`SEARXNG_SECRET`、`GOOGLE_SHEET_WEBAPP_URL` 与 `GOOGLE_SHEET_SHARED_SECRET`。访问令牌和会话密钥仅保留给兼容入口；正式根链接已公开，不以 Cookie 或令牌拦截页面和 API。SearXNG 和 Sheet 变量配置到 Mac mini Worker；Sheet 变量也配置到 Vercel。不要将任何值写入 Git、页面脚本或部署日志。

Vercel 的项目根目录必须设为本工具目录。先部署 Preview，验证根链接、关键词/竞品内存切换、任务轮询和本地 CSV 下载后，再提升为 Production。生产共享链接格式为：

```text
https://<vercel-production-domain>/
```

任意设备可直接打开根链接。`/access/<BACKLINK_ACCESS_TOKEN>` 仅为历史兼容入口；轮换令牌不会限制公开根链接。

Mac mini Worker 不开放端口。合并到正式目录并完成 `.env` 后，加载 plist：

```bash
PLIST_PATH=/Users/awayer_mini/gengrowth-wiki/tools/internal/backlink-opportunity-tool-searxng/launchd/com.gengrowth.backlink-opportunity-worker.plist
launchctl bootstrap "gui/$(id -u)" "$PLIST_PATH"
launchctl kickstart -k "gui/$(id -u)/com.gengrowth.backlink-opportunity-worker"
```

Worker 只从 Google Sheet 领取任务、访问私有 SearXNG，并将统计和本次合格结果写入临时结果页。页面成功接收后发送 ack 清理结果；异常遗留最长保留 24 小时。停止或卸载 Worker 前，应先确认 `任务记录` 没有 `running` 任务。

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

6. 将更新后的 Apps Script 版本部署为 Web App。首次由 Vercel 或 Worker 调用时会自动扩展 `任务记录` 并创建隐藏的 `_临时任务结果` 标签页；既有 `外链资源库`、`排除记录` 和旧任务不会被覆盖或删除。

接收端只接受含共享密钥的 JSON。即使 Web App URL 泄露，没有密钥也不能写入表格。

## 共享版即时结果与 CSV

- 页面首次打开时关键词和竞品结果均为空，不读取 `/api/opportunities` 或历史 Sheet 数据。
- 顶部“关键词 / 竞品”只切换当前页面内存，不触发网络请求；两个模式分别保留本次输入、进度和结果。
- 两个模式都要求填写“目标域名”，可输入裸域名或 URL；服务端会规范化为小写 hostname。
- 任务完成后，结果标题右侧显示“导出本次 CSV”。下载由浏览器直接生成，不再次调用 Google Sheet。
- 刷新或重新打开页面后结果清空，但 HttpOnly 登录会话保持有效。
- 页面成功收到任务结果后调用 ack 清理临时 Sheet 行；ack 失败不阻塞导出，24 小时 TTL 会清理遗留数据。

CSV 使用 UTF-8 BOM、CRLF 和标准 CSV 转义，只允许以下七列及顺序：

```csv
页面AS,原URL,URL对应域名,目标域名,类型,外部链接数量,自动评论运行结果
```

字段规则：

- `页面AS`：当前没有真实页面级 AS 数据源，始终留空；不得使用域名 DR 代填。
- `原URL`：合格机会的来源页面 URL。
- `URL对应域名`：来源 URL 的 hostname。
- `目标域名`：用户输入并规范化后的目标域名。
- `类型`：机会类型。
- `外部链接数量`：检测到数值时输出；未知时留空，零值保留为 `0`。
- `自动评论运行结果`：本工具不执行自动评论，始终留空。

### 外链地址质量筛选（quality-v1）

- “最多保留线索”表示最终合格输出上限；Worker 内部最多召回
  `min(最终上限 × 3, 600)` 条候选。
- 关键词模式按资源页、工具目录、投稿页和链接补充页四个查询族公平轮询；博客评论页不搜索也不导出。
  竞品模式按提及、资源页、投稿页和评测页公平轮询。
- 搜索词只表示发现来源。页面抓取后必须根据真实提交表单、明确投稿说明或竞品链接证据重新分类；关键词模式中的评论表单一律不导出。
- 通用提交按钮或表单不能从整页标题或教程正文继承类型；标题为 `Write for us`
  时，正文必须同时给出主题范围、投稿要求和具体提交方式。
- 竞品输入的裸域名与完整 URL 按同一 hostname 评分。相关性只取实际页面标题、
  URL、摘要或正文、锚文本等证据，不使用注入的目标字段或链接存在本身。
- 仅有真实竞品链接、没有其他页面行动证据时，最终类型为中性的
  `competitor_backlink`；明确投稿说明仍至少 25 分，行动表单可到 35 分。
- 成功抓取但缺少真实竞品链接的页面计为 `quality:competitor_link_missing`，
  不计为 `quality:page_unavailable`。
- `quality-v1` 使用固定 100 分规则：主题相关性 50、获链可执行性 35、
  页面质量 15。只有通用联系方式、泛化 Guest Post 教程或无竞品链接证据的页面不导出。
- 外部链接数 501–2000 降权，超过 2000 直接排除。
- 本工具不导入历史结果、不自动学习，也不将质量分写入七列 CSV。

## 旧本地版状态与筛选口径

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

测试覆盖 URL 归一、SearXNG 关键词与竞品线索归一、竞品链接本地验证、黄赌毒硬过滤、Firecrawl 失败兜底、抓取失败降级、严格七列 CSV、目标域名、双模式内存状态、临时结果 get/ack/TTL、密钥不下发浏览器和旧资源回归。
