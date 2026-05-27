# 📥 GenGrowth SEO 工作台 (Ma Boyang)

本目录为个人工作区（加工区），遵循主管提出的“生产与发布分离”原则。所有正式沉淀规则需在评审后迁移至 `docs/`。

## 📂 目录索引与用途

| 目录编号   | 目录名称                      | 核心用途                            | 包含的主要文件                                            |
| :----- | :------------------------ | :------------------------------ | :------------------------------------------------- |
| **00** | `00-inbox`                | 临时输入、灵感草稿、未分类数据。                | -                                                  |
| **01** | `01-review-audit`         | 存放 Day 0 诊断记录、实验进度 Log、站点审计报告。  | `astrologywiki-growth-log-v2.md`                   |
| **02** | `02-keyword-research`     | 存放全量关键词库、1+N 集群执行表、长尾词聚类分析。     | `astrologywiki-keyword-cluster.md`                 |
| **03** | `03-content-briefs`       | 存放内容大纲、流量预测报告、SEO SOP 及提示词备份。   | `seo-pipeline-sop-v2.md`, `seo-cluster-prompts.md` |
| **04** | `04-production`           | 正在撰写或 AI 生成中的 Blog 初稿（成品发布后移出）。 | `aura-colors-tutorial.md`                          |
| **05** | `05-blog`                 | 已成型 / 待发布的 Blog 内容。              | -                                                  |
| **08** | `08-reports-and-feedback` | 所有的汇报、产品功能反馈、标准执行反馈。            | 详见下方子目录                                            |
| **09** | `09-archive`              | 历史版本（v0.18 等）、已废弃的旧逻辑、参考旧件。     | `pipeline-v019-old.md`                             |

### 📋 08 汇报与反馈细分
- `01-product-feedback`: 针对网站功能（如 CMS、工具页）的需求反馈。
- `02-standard-feedback`: 针对团队协作规范、SOP 流程的优化建议。
- `03-weekly-reports`: 每一周的工作进展总结。

## 🛠️ 文件管理规范

1. **命名规范**：`YYYY-MM-DD-主题-用途.md`。避免 `Untitled.md` / `未命名.md` 等占位名，会被自动校验拒绝。
2. **元数据要求**：所有 `.md` 文件头部必须包含 `project`, `type`, `status`, `owner`, `updated` 字段。
3. **Owner**：Ma Boyang。
4. **清理规则**：正式 SOP 确定后应提交至 `docs/`；已发布的 Blog 初稿定期归档至内容资产库。

## 🔄 status 字段语义（决定 dispatch 行为）

`scripts/dispatch-inbox.js` 根据 frontmatter 里的 `status` 字段决定怎么处理一个文件：

| status | 行为 | 适用场景 |
|---|---|---|
| `draft` (或无 frontmatter) | **留在 inbox/**，不动 | 草稿、半成品、思考记录。脚本不会骚扰。 |
| `ready_for_review` | **开 PR** 等审批 | 完成的内容，需要他人 review |
| `ready_to_move` | **直接搬运** 到 target | 已确认无需 review 的内容 |
| `archived` | **自动归档** 到 `inbox/09-archive/` | 老版本、废弃文件 |

> 写 `ready_for_review` / `ready_to_move` 时必须同时写 `target` 字段（允许值：`onboarding/`, `templates/`）。
> 所有 wiki 同步目录（`docs/`、`✍️ 内容资产/`、`参考资料/`、`每日日报/`、`task-collab/`）都是单向 rsync 镜像**只读**，dispatch 不能往里搬；要更新这些内容请改 wiki repo。

### Frontmatter 示例

```yaml
---
project: astrologywiki
type: blog-draft
status: draft           # 草稿阶段：脚本会忽略
owner: Ma Boyang
updated: 2026-05-18
---
```

完成后改成 ready 状态再触发 dispatch：

```yaml
---
project: astrologywiki
type: sop
status: ready_for_review
target: onboarding/
owner: Ma Boyang
updated: 2026-05-18
---
```

## 🛠️ 写文章的辅助工具：`brand-wrap`

用任何 AI（Gemini / Claude / ChatGPT）生成文章粘到 inbox 之后，跑一下规范化脚本：

```bash
# 预览（不改文件）
node scripts/brand-wrap.js inbox/04-production/my-new-blog.md

# 应用规范化（补 frontmatter + 加日期前缀 + AI 词警告 + blog 末尾追加品牌 CTA）
node scripts/brand-wrap.js inbox/04-production/my-new-blog.md --apply

# 扫描整个 inbox/，批量规范化所有缺 frontmatter 的文件
node scripts/brand-wrap.js --scan inbox/ --apply
```

脚本会自动做：

1. **补 frontmatter**：`project/type/status/owner/updated`（type 从 inbox 子目录推断）
2. **文件名加日期前缀**：`my-blog.md` → `2026-05-18-my-blog.md`
3. **AI 标志词扫描**：发现 `delve/crucial/robust/landscape/...` 等词 ≥ 3 个时警告，提示 SEO 降权风险
4. **品牌 CTA**：blog-draft 类型文章末尾自动追加 AstrologyWiki 链接（已有的不重复加）

> AI 警告是 advisory，不阻塞；frontmatter 缺失/文件名错误才会阻塞 dispatch。

## 🚨 校验失败怎么办

如果 dispatch 脚本拒绝了某个文件，会自动开一个 GitHub Issue 通知作者。在 Issue 里能看到：

- 哪个文件出了什么问题
- 怎么修

修复后在 Obsidian 里改完，按 F5 重新提交即可。

---
*最后更新：2026-05-18*
