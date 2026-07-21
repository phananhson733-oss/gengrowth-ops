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

- 关键词：搜索 Guest Post、资源页、工具目录、Link Insertion 和博客评论页等机会；
- 竞品域名或产品 URL：拉取指向竞品的来源页面，保留锚文本、链接属性和目标 URL。

每次发现都先保存到本地 CSV，再按状态同步到一个 Google Sheet 工作簿。自动规则通过仅表示 `qualified` 候选，不能表示一定可以获得链接；最终联系、提交和投放均由人工完成。

## 已实现边界

- 关键词 SERP 发现：SerpApi，默认组合 5 类搜索足迹。
- 竞品反链发现：Ahrefs API，保留 referring page、competitor target URL、锚文本、dofollow/nofollow/ugc/sponsored 和页面外链数。
- DR：使用 Ahrefs 官方 Domain Rating 接口补充根域名 DR。
- 安全过滤：URL、标题、摘要和真实抓取页面正文均会检查成人、赌博、毒品、诈骗和恶意软件下载等明确高风险词。
- 页面抓取失败、被拦截或非 HTML 页面：自动标为 `review`，不会继续作为 `qualified`。
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

编辑 `.env`，填入至少一种发现能力所需的密钥：

- `SERPAPI_API_KEY`：启用关键词发现。
- `AHREFS_API_KEY`：启用竞品反链发现，也为 DR 补充提供认证。Ahrefs 免费 DR 接口可以返回 DR；竞品反链明细仍取决于 Ahrefs API 计划与 units。
- `GOOGLE_SHEET_WEBAPP_URL` 与 `GOOGLE_SHEET_SHARED_SECRET`：启用 Google Sheet 同步。

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

若没有配置任何发现 API，检查命令会返回非零状态；这是正常的配置提示，不会输出密钥值。

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

DR 只是质量信号，不是内容安全判断；建议在 Google Sheet 中结合 `domain_dr`、`external_link_count`、`opportunity_type`、主题相关性和人工审核作决定，不要只按 DR 删除。

## 验证

```bash
npm test
```

测试覆盖 URL 归一、关键词与竞品来源归一、黄赌毒硬过滤、正文复核、抓取失败降级、CSV 往返和去重、DR 批量补充、本地存储、密钥不下发浏览器、HTML 输入模式、Google Sheet 三表分流与共享密钥传递。
