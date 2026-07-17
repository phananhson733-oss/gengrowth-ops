---
project: gengrowth-ops
type: task
status: draft
owner: wzb
updated: 2026-07-17
---

# inbox → inbox-maboyang 改名：wiki 侧待办交接

2026-07-17 已在 gengrowth-ops 完成：文件夹 `inbox/` 改名为 `inbox-maboyang/`（与 `inbox-pengman/` 格式一致），并更新了 ops 自有文件里的全部路径与文字引用（AGENTS.md、README、onboarding、templates、.github workflows、scripts/、docs/05-governance/people-ops/perf-feedback、inbox-maboyang 内部文档等）。

以下改动 **不在 ops 权限内 / 会被 wiki 同步覆盖**，需要在 `gengrowth-wiki` 源头完成。

## A. wiki 的 tools/（镜像到 ops/tools，源头必改）

| 文件 | 位置 | 改动 |
|---|---|---|
| `tools/scripts/_sync-core.sh` | 第 69 行 | `rsync "$OPS_REPO/inbox/" "$OPS_DEST/inbox/"` → 两侧都改为 `inbox-maboyang/`。**不改的话 ops→wiki 的 inbox 镜像会断** |
| `tools/scripts/SYNC.md` | 第 11 行 | 文案 `ops/inbox` → `ops/inbox-maboyang` |
| `tools/scripts/sync-core-selftest.sh` | 第 30 行 | `"$ops/inbox"` → `"$ops/inbox-maboyang"` |
| `tools/scripts/obsidian-vault-git-sync.py` | 第 43 行 | 例外清单 `inbox/06-tasks/tasks/.autopilot-claims.json` → `inbox-maboyang/...` |
| `tools/scripts/obsidian-vault-git-sync-selftest.py` | 第 84 行 | 同上 |
| `tools/internal/baoxiao/config/reimbursers.yaml` | 第 35 行 | `mby: inbox/报销` → `mby: inbox-maboyang/报销`。**不改的话马博洋的 ops 报销投递扫描找不到目录** |
| `tools/internal/baoxiao/README.md` | 第 19 行 | 文档里 `mby=inbox/报销` 同步更新 |

另外：`wiki/docs/repo/gengrowth-ops/inbox/` 旧镜像目录需手动删除或改名为 `inbox-maboyang/`（改 `_sync-core.sh` 后 rsync 只会往新目录写，不会清旧目录）。

## B. wiki 镜像目录的源头文档（ops 侧已改，但下次 wiki 同步会覆盖回旧引用）

在 wiki 中找到以下文档的源头，做同样替换（对应 ops 路径）：

1. `docs/03-marketing/2026-06-05-keyword-sheet-v3.3-migration-collaboration.md`
2. `docs/04-programs/planning/2026-04-14-gengrowth-wiki-information-architecture-design.md`
3. `docs/04-programs/planning/2026-04-14-gengrowth-wiki-migration-plan.md`
4. `docs/05-governance/people-ops/team-collaboration/2026-Q3-growth-goal-breakdown.md`
5. `task-collab/tasks/2026-05-18-astrologywiki-landpage-task.md`
6. `task-collab/tasks/2026-05-18-birth-chart-calculator-task.md`
7. `task-collab/tasks/2026-05-18-cms-simple-version-task.md`
8. `每日日报/2026-05-13-1001-research-report.md`
9. `内容资产/astrologywiki/v8-drafts-2026-05-22/README.md`

对应 GitHub issue：gengrowth-ops #44（wiki-sync 警告，本次批量改动触发，处理完可关闭）。

## C. wiki 全库自查

在 wiki 仓库根目录跑（只改指向 ops inbox 文件夹的引用，跳过 `inbox-pengman`、`00-inbox`、`_inbox`、英文泛指 inbox）：

```bash
rg -nP '(?<![-\w])inbox(?![-\w])' --hidden -g '!.git' .
```

逐条确认后替换为 `inbox-maboyang`。

## D. 环境 / 机器侧

- **马博洋电脑的 Obsidian**：设置里「模板 → 文件夹位置」和「新建笔记位置」从 `inbox` 改为 `inbox-maboyang`（onboarding/README.md 已更新说明；已装好的机器需手动改一次）。wzb 本机已改好。
- **OpenClaw 沙盒映射**：AGENTS.md 中沙盒写路径已从 `/workspace/inbox/**` 改为 `/workspace/inbox-maboyang/**`，需确认 OpenClaw 侧挂载配置同步（该配置不在 ops 仓库内）。
- **Secret Scan 持续失败**（与本次改名无关，历史遗留）：gitleaks 扫到 `tools/scripts/obsidian-vault-git-sync-selftest.py` 的测试假密钥和 `tools/browser-extensions/x-writer-extension/x-writer-extension.pem` 私钥（6/23 提交）。建议：私钥轮换并从历史清除，测试假密钥加 gitleaks allowlist。
