# 博客 Hero 图片线上可达性与映射 QA（待补充取证）

状态：阻塞，未部署、未推送、未改生产。

## 范围与证据等级

- 来源：Kanban 任务 `t_6770a4e8` 的任务描述。
- 已尝试的本任务工作区：`/Users/awayer_mini/.hermes/kanban/boards/feishu-multibot-acceptance-20260617/workspaces/t_6770a4e8`；当前为空，未提供产品仓库、分支或只读副本。
- 线上 URL 状态仅为任务描述中的“报告值”，尚未由 Ops 独立复核。
- 本文件为 inbox 草稿，不代表正式 QA 结论。

## 三段状态表

| 样本 | 本地 Hero 文件 | `blog_posts.hero_image` / seed / migration 映射 | 线上文章 / HTML/OG 图片路径 / 静态图 HTTP | 当前结论 |
|---|---|---|---|---|
| `best-ai-marketing-and-cmo-tools-for-saas-in-2026` | 待提供仓库只读路径核验 | 待提供数据库 schema、seed 或 migration 核验 | 任务报告：文章与 sitemap 可访问；`/images/blog/best-ai-marketing-and-cmo-tools-for-saas-in-2026.jpg` 返回 404；HTML/OG 路径待独立采样 | 线上静态资源缺失或路径不一致，待定位 |
| 样本 2 | 待取证 | 待取证 | 待取证 | 未完成 |
| 样本 3 | 待取证 | 待取证 | 待取证 | 未完成 |
| 样本 4 | 待取证 | 待取证 | 待取证 | 未完成 |
| 样本 5 | 待取证 | 待取证 | 待取证 | 未完成 |

## 当前根因分类

- 已报告问题：线上静态图 `404`。
- 未映射：未验证。
- 未部署：未验证。
- 路径错误：可能，未验证。
- 其他：需检查构建是否将本地图片纳入部署产物。

## 最小修复建议（待 PM/工程确认）

1. 工程在只读环境核对 40 个新增图片文件与 `blog_posts.hero_image`（或 seed/migration）的一一映射，统一文件名、大小写和扩展名。
2. 核对站点构建/静态资产拷贝规则是否包含 `images/blog/*.jpg`；对缺失产物补齐映射或修正 URL 后重新构建。
3. 在人工确认的部署 gate 后部署；部署后复测至少 5 篇文章的页面状态、HTML/OG 图片路径和静态图 HTTP 状态。

## 人工确认 Gate

- 需要 PM/工程提供产品仓库 `feat/blog-hero-batch` 的只读路径或导出清单（40 个文件名、hero_image 数据/seed/migration、最新 commit 与构建日志）。
- 需要具备已批准的线上只读取证路径，完成 5 篇样本的 HTML/OG 与 HTTP 复测。
- 任何 git push、Vercel 操作或生产变更均不在本任务执行范围内，须由有权限人员另行确认和执行。
