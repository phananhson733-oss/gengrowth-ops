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

## 四、附带发现：私钥泄露到公开仓库（已止血，待轮换）

改名过程中顺带发现，与改名无关，但更要紧。

### 发生了什么
`gengrowth-ops` 是 **public 仓库**（经确认是有意公开）。Chrome 扩展打包私钥 `x-writer-extension.pem`（RSA，1704 bytes）从 **2026-06-23 起匿名可下载，持续 24 天**。已实测验证：未登录 `curl` 返回 HTTP 200。

### 泄露路径是系统性的，不是谁手滑
私钥本来安全地待在**私有**的 wiki 里。但 `_sync-core.sh` 每 60 秒把 `wiki/tools/` 整个 rsync 进 `ops/tools/`，而 ops 是公开的 —— **它就这样被自动搬上了公网，无人工确认**。下次若有人往 `wiki/tools/` 放真的 API key 或 `.env`，会在 60 秒内以同样方式公开。

### 为什么 24 天没人发现
防护其实存在，但有盲区叠加：
1. 同步引擎的密钥拦截（`SECRET_NAME_RE`）只检查 `dirty_paths()`（**未提交的改动**）→ 拦得住新放进来的，但这个 .pem 是 2026-06-23 **手动 git commit** 进去的，绕过了它；一旦提交成功文件就"干净"了，引擎再不会看它。
2. gitleaks（Secret Scan）**扫全历史，第一天就发现了并一直报红** —— 但它同时被自测假密钥常年触发，**红灯变成常态后就没人看了**，真信号被淹没。

### 已做（本次）
- **止血**：从公开仓库移除该 .pem（实测匿名下载已变 HTTP 404）。**原件保留在私有的 wiki**——重新打包扩展要靠它保持扩展 ID 一致，不能弄丢。
- **堵管道**：`_sync-core.sh` 的 wiki→ops 镜像加 `--exclude`（pem/key/p12/pfx/crt/cer/.env*）。rsync dry-run 对照验证：不加时该 .pem 会被推回公网，加了之后不再传输（wiki commit `aff251b03`）。
- **修报警器**：自测假密钥加进 `.gitleaks.toml` allowlist。告警从 3 个降到 **1 个，且是真问题**。

### 待办：轮换（需要人工）
**Secret Scan 仍会红**，因为 .pem 还在 git 历史里（commit `5edc426f`）。**在轮换之前，这个红灯是正确的**——它在报一个真实未解决的问题，别急着 allowlist 掉。

风险评估（实事求是，别过度恐慌）：**这把钥匙的实际危害很小**。
- 该扩展（X Writer — LynneBuilds，中文转 X 英文）**没上架 Chrome 商店**，只本地侧载 → 没有自动更新通道可被劫持。
- **不含 API key**：已核查，DeepSeek/Anthropic 的密钥是用户在扩展设置里自填、存本地，没进仓库。
- 攻击者最多能打包一个"扩展 ID 相同"的假扩展，但还得骗人手动安装。

因此**不建议重写 git 历史**（破坏性大、所有机器要重新同步，且撤销不了已泄露的事实）。建议：
1. 重新生成扩展密钥（删掉旧 .pem 后 Chrome 重新打包会生成新的；代价是扩展 ID 变化，需重装一次——内部工具成本很低）。
2. 轮换完成后，再把该历史 finding 加进 gitleaks allowlist 并注明"已轮换失效"，让 Secret Scan 恢复全绿、红灯重新可信。

## 五、附带发现：GitHub Actions 因账单停摆

flow-mvp 与 wiki 是**私有**仓库（消耗 Actions 额度），CI 全部无法启动，报错原文：
> "The job was not started because recent account payments have failed or your spending limit needs to be increased."

现象：job 0 步执行、2 秒即失败。**PR #3 上的红 CI 就是这个原因，与代码无关**；main 自身每次提交也同样红。ops 因为是公开仓库（Actions 免费）不受影响，所以 dispatch/secret-scan 仍在跑。

需要去 GitHub Billing & plans 结算，否则 flow-mvp / wiki 的测试与检查一直处于停摆状态。
