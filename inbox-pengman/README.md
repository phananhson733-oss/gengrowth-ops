# 📥 GenGrowth SEO 工作台 (彭满)

本目录为**彭满的个人工作区（加工区）**，遵循主管提出的"生产与发布分离"原则。所有正式沉淀规则需在评审后迁移至 `docs/`（由 wiki 同步，单向只读）。

> 本工作台与 Ops（`inbox/`）共用同一个 `gengrowth-ops` 仓库，但各自独立：彭满只在 `inbox-pengman/` 下作业，dispatch 自动化对两个工作台分别处理、互不干扰。

## 📂 目录索引与用途

| 目录编号   | 目录名称                      | 核心用途                            |
| :----- | :------------------------ | :------------------------------ |
| **00** | `00-inbox`                | 临时输入、灵感草稿、未分类数据。                |
| **02** | `02-conversation report`  | 跨对话协作上下文、已确认决定、职责边界和待确认事项。 |
| **03** | `03-topic-ideas`          | 站外内容选题库、单条选题草稿、主题包灵感。          |
| **04** | `04-production`           | 内容创作工作区：平台/内容方向、图文视频工具调研、生产工作流。 |
| **05** | `05-media report`         | 已发布内容、媒体素材或单次发布复盘。              |
| **06** | `06-tasks`                | 任务管理、周计划、执行跟踪、职责边界文档。          |
| **07** | `07-account-assets`       | 账号资料、头像、banner、品牌展示资产。           |


### 🎬 04 内容创作工作区细分
- `01-strategy-and-platform-research`: 内容方向、平台机制、平台样本、首轮方案。
- `02-video-and-visual-tool-research`: 图文/视频/动画/自动化工具调研。
- `03-reference-accounts`: 可学习账号与内容样式。
- 入口文档：[[inbox-pengman/04-production/README.md]]


### 🧹 已精简的复制型目录

以下目录目前没有实际内容，已先删除：`01-review-audit`、`08-reports-and-feedback`、`09-archive`。如果后续真的需要审计、汇报反馈或归档，再按实际用法新建即可。

## 🛠️ 文件管理规范

1. **命名规范**：`YYYY-MM-DD-主题-用途.md`。`Untitled.md` / `未命名.md` 等占位名只会收到 advisory 提示（不阻塞），但**走流程**（`ready_*`）时会被拒绝。
2. **元数据要求**：`.md` 文件头部建议包含 `project`, `type`, `status`, `owner`, `updated` 字段；草稿可以不写，**走流程时这 5 个字段必填**。
3. **Owner**：彭满。`inbox-pengman/` 是彭满专属工作台，其他人请勿直接修改。
4. **清理规则**：正式 SOP 确定后应提交至 `docs/`；已发布的 Blog 初稿定期归档至内容资产库。

## 🔄 status 字段语义（决定 dispatch 行为）

`scripts/dispatch-inbox.js` 根据 frontmatter 里的 `status` 字段决定怎么处理一个文件。**默认（非流程状态）只发提示、绝不阻塞、不开 issue** —— Obsidian Git 自动备份不会被骚扰。只有显式声明流程状态时，才会严格校验并搬运：

| status | 行为 | 适用场景 |
|---|---|---|
| `draft` / `active` / `final` / `in-progress` / 无 frontmatter / 无法识别 | **留在 inbox-pengman/**，不动，仅 advisory 提示 | 草稿、半成品、思考记录。脚本不会骚扰。 |
| `ready_for_review` | 严格校验后**开 PR** 等审批 | 完成的内容，需要他人 review |
| `ready_to_move` | 严格校验后**直接搬运** 到 target | 已确认无需 review 的内容 |

> 只有 `ready_for_review` / `ready_to_move` 会触发校验失败开 issue；草稿状态永远静默。
> 写 `ready_for_review` / `ready_to_move` 时必须同时写 `target` 字段（允许值：`onboarding/`, `templates/`）。
> 所有 wiki 同步目录（`docs/`、`✍️ 内容资产/`、`参考资料/`、`每日日报/`、`task-collab/`）都是单向 rsync 镜像**只读**，dispatch 不能往里搬；要更新这些内容请改 wiki repo。

### Frontmatter 示例

```yaml
---
project: astrologywiki
type: blog-draft
status: draft           # 草稿阶段：脚本会忽略
owner: 彭满
updated: 2026-06-10
---
```

完成后改成 ready 状态再触发 dispatch：

```yaml
---
project: astrologywiki
type: sop
status: ready_for_review
target: onboarding/
owner: 彭满
updated: 2026-06-10
---
```

## 🛠️ 写文章的辅助工具：`brand-wrap`

用任何 AI（Gemini / Claude / ChatGPT）生成文章粘到工作台之后，跑一下规范化脚本：

```bash
# 预览（不改文件）
node scripts/brand-wrap.js inbox-pengman/04-production/my-new-blog.md

# 应用规范化（补 frontmatter + 加日期前缀 + AI 词警告 + blog 末尾追加品牌 CTA）
node scripts/brand-wrap.js inbox-pengman/04-production/my-new-blog.md --apply

# 扫描整个 inbox-pengman/，批量规范化所有缺 frontmatter 的文件
node scripts/brand-wrap.js --scan inbox-pengman/ --apply
```

脚本会自动做：

1. **补 frontmatter**：`project/type/status/owner/updated`（type 从子目录推断）
2. **文件名加日期前缀**：`my-blog.md` → `2026-06-10-my-blog.md`
3. **AI 标志词扫描**：发现 `delve/crucial/robust/landscape/...` 等词 ≥ 3 个时警告，提示 SEO 降权风险
4. **品牌 CTA**：blog-draft 类型文章末尾自动追加 AstrologyWiki 链接（已有的不重复加）

> AI 警告是 advisory，不阻塞；frontmatter 缺失/文件名错误才会阻塞 dispatch。

## 🚨 校验失败怎么办

如果 dispatch 脚本拒绝了某个文件，会自动开一个 GitHub Issue 通知作者。在 Issue 里能看到：

- 哪个文件出了什么问题
- 怎么修

修复后在 Obsidian 里改完，按 F5 重新提交即可。

---
*最后更新：2026-06-10*
