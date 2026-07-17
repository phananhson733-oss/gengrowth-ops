---
project: gengrowth-ops
type: task
status: active
owner: wzb
updated: 2026-07-17
---

# inbox → inbox-maboyang 改名：跨仓库处理结果与待办

2026-07-17 把 ops 工作台 `inbox/` 改名为 `inbox-maboyang/`（与 `inbox-pengman/` 格式对齐）。这个改名牵动三个仓库，不只是 ops 内部的事。

## 一、已完成

### gengrowth-ops（已推送 main）
文件夹 `git mv` 改名（保留历史），约 100 个文件的路径与文字引用更新：AGENTS.md 写权限路径、README、onboarding、templates 的 `target:` frontmatter、`.github/workflows/dispatch.yml` 的触发路径、scripts/ 全套、本机 `.obsidian/app.json` 的新建笔记位置。脚本经 node/bash/YAML 语法校验。

### gengrowth-wiki（已推送 main，commit `2e09f1181`）
| 文件 | 改动 | 不改的后果 |
|---|---|---|
| `tools/scripts/_sync-core.sh` | rsync 源与目标改为 `inbox-maboyang/` | **ops→wiki 镜像直接断链** |
| `tools/scripts/obsidian-vault-git-sync.py` | claims ledger 的 union 合并路径 | 多机并发写 ledger 时合并失效 |
| `tools/internal/baoxiao/config/reimbursers.yaml` | `mby: inbox-maboyang/报销` | **马博洋报销投递扫描找不到目录** |
| `docs/repo/gengrowth-ops/inbox/` | 镜像目录随之改名 | 留下永不更新的僵尸目录 |
| `SYNC.md`、baoxiao README、两个 selftest | 同步更新 | — |

验证：`sync-core-selftest.sh` 通过、`obsidian-vault-git-sync-selftest.py` 通过、baoxiao drop-scan 测试 7 项通过；手动跑通一次真实同步，双向链路（ops→wiki 镜像、wiki→ops 的 tools 镜像）均确认正常。

### gengrowth-flow-mvp（PR #3，**待审核合并**）
https://github.com/xdawayer/gengrowth-flow-mvp/pull/3

SEO autopilot 全链路硬编码了 `~/gengrowth-ops/inbox/06-tasks/tasks/` 作为 claims ledger / plan / publish-log 位置。ops 改名后这些路径全部失效。

改动覆盖两种写法——第二种差点漏掉（正则匹配不到，靠改动前后的 baseline 测试对比才发现，`gg-seo-autopilot.mjs` 的 `PLAN_GLOB_DIR` 就在其中）：
- 路径字符串：`join(OPS, 'inbox/06-tasks/tasks/...')`
- 分段参数：`join(OPS, 'inbox', '06-tasks', 'tasks')`

测试：受影响的 smoke test 全绿（ledger-reconcile 32、seo-autopilot 28、batch-summary 34、readiness 24、backfill-tx 24 等）。`gg-seo-blog-launchd-tick` 的 1 个失败为改动前既有（plist 时间检查，与本次无关）。

## 二、待办（需要人工）

1. **合并 PR #3，然后到 awayer_mini 那台机器手动 `git pull` flow-mvp。**
   flow-mvp 不参与自动同步（wiki `tools/scripts/SYNC.md` 明确规定 dev 仓库人工管理），所以合并了也不会自动生效。**在那台机器 pull 之前，SEO autopilot 处于断链状态**——ops 已改名，它还在找旧路径。

2. **马博洋电脑的 Obsidian 设置**：「模板 → 文件夹位置」和「新建笔记位置」从 `inbox` 改为 `inbox-maboyang`。不改的话用模板新建笔记会凭空重建一个旧 `inbox/` 文件夹。wzb 本机已改好。

3. **OpenClaw 沙盒挂载**：AGENTS.md 里沙盒写路径已改为 `/workspace/inbox-maboyang/**`，需确认 OpenClaw 侧挂载配置同步（该配置不在这三个仓库内）。

4. **issue #44**（wiki-sync 警告）：本次批量改动触发的预期内告警，wiki 侧已处理完，可关闭。

## 三、刻意没做的

- **历史记录不改**：`docs/records/**` 的 chat-record、`.gg-bridge/reports/`、`docs/plans/` 的历史计划、W20 审计报告、历史日报里的 `inbox/` 引用保持原样。那是当时的事实快照，改了等于伪造历史；且 chat-record 是 `merge=union` 的并发追加文件，改动会引发冲突。这些文档里不少引用的 `inbox/内容创作/` 之类目录早就重构没了，改成新名反而制造"这个路径现在有效"的假象。
- **英文语义的 inbox 不改**：文章里的 "email inbox"、GTD 概念、baoxiao 工具自己的 `_inbox` 发票队列变量、app 路由 `/app/growth-actions/inbox`、`00-inbox` 子目录。
- **没顺带扩大同步范围**：`_sync-core.sh` 原本就只镜像 `inbox` 和 `onboarding`，没有镜像 `inbox-pengman`。这次只做改名，不改变同步行为。

## 四、附带发现（与改名无关，建议单独处理）

**Secret Scan 工作流长期失败**，在本次改动之前就是红的。gitleaks 扫到：
- `tools/browser-extensions/x-writer-extension/x-writer-extension.pem` —— **真实私钥入库**（2026-06-23 提交）
- `tools/scripts/obsidian-vault-git-sync-selftest.py:195` —— 测试用假密钥（误报）

建议：私钥轮换并从 git 历史清除，测试假密钥加 gitleaks allowlist。
