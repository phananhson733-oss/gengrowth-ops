# GenGrowth 多机 Git 同步 — Setup & Onboarding

> 一页搞定：多台电脑/多人如何安全地自动同步 wiki / ops，以及为什么某些仓库
> **绝不能**自动同步。新机器上手照第 3 节两条命令即可。

---

## 1. 架构（设计如此，不是 bug）

- 多台电脑 / 多人，同时存在 **wiki** 和 **ops** 两个 Obsidian 库，都自动 git 同步。
- **wiki → ops 单向镜像**：`wiki/tools` 覆盖到 `ops/tools`；`ops/inbox`、`ops/onboarding`
  与 `agents` 内容镜像进 `wiki/docs/repo/`（这些是**镜像目标，别手改**，会被 `rsync --delete` 吞）。
- 所有机器推同一个 `origin/main`。冲突安全靠三件套（见第 5 节），不是靠"只让一台推"。

## 2. 哪些仓库能自动同步，哪些绝对不能

| 仓库 | 自动同步？ | 说明 |
|---|---|---|
| **gengrowth-wiki** | ✅ 是 | 笔记/文档库，py 引擎经 launchd 每 60s 安全同步 |
| **gengrowth-ops** | ✅ 是 | 下游镜像库，同上（installer 自动探测 `~/code` 等路径） |
| **gengrowth-flow-mvp** | ❌ **否** | **代码 dev 仓库**，有真实未提交工作，必须人工 commit |
| **gengrowth-agents** | ❌ **否** | **代码 dev 仓库**，常在 feature 分支 + 未提交改动 |

> ⚠️ **血的教训**：dev 代码仓库被 Obsidian Git 插件自动 backup，会每分钟刷一条
> "vault backup" 空提交、推不上去越积越多（曾积到 3346 条空提交、与远端深度分叉）。
> **dev 仓库一律关掉插件自动 backup，用正常 git 工作流手动提交。**

## 3. 新机器上手（每台跑一次）

```bash
cd <该机 gengrowth-wiki>
git pull                                          # 先拉到全套修复
python3 tools/scripts/set-obsidian-git-safe-config.py   # 关插件裸推，改走 py 引擎
bash tools/scripts/install-sync-launchd.sh              # 装 launchd，py 引擎每 60s 安全推送
```

- installer 自动探测 ops（`~/code/gengrowth-ops` 等），并**自动排除 dev 仓库**（agents 仅在
  显式 `GENGROWTH_AGENTS=` 时才纳入）。
- ops 在非默认路径时：`GENGROWTH_OPS=/你的/ops bash tools/scripts/install-sync-launchd.sh`
- **flow-mvp / agents 不要跑上面的接入**；它们用普通 `git add/commit/push` 手动管理。

## 4. 为什么用 py 引擎而不是 Obsidian 插件推送

Obsidian Git 插件桌面端默认用 **isomorphic-git**，**不支持** `.gitattributes` 的 `union`
合并驱动、也没有 push 重试。多机并发下它自己 commit+push 不 rebase，就是 non-fast-forward
和记录被打回的根源。加固过的 `obsidian-vault-git-sync.py` 用 **system git**，天然遵守
union + 自带重试，所以由它统一推送。

## 5. 冲突安全三件套（已在仓库层，全 clone 生效）

1. **`.gitattributes` `*-chat-record.md merge=union`**：追加型对话记录并发追加时
   自动保留双方全部条目，rebase 不再 abort，记录永不被打回。
2. **`obsidian-vault-git-sync.py` push 重试**：撞 non-fast-forward 时自动
   fetch→rebase→push 重试（至多 3 次），**绝不 `--force`**。
3. **`_sync-core.sh` mkdir 原子锁**：串行化 wiki→ops 的 `rsync --delete` 镜像阶段，
   陈旧锁（>10min）自动接管，防崩溃死锁。

## 6. 排错 & 回滚

```bash
# 看状态 / 日志
bash tools/scripts/install-sync-launchd.sh --status
tail -f ~/Library/Logs/gengrowth-frequent-sync.log

# 卸载 launchd（停止自动同步）
bash tools/scripts/install-sync-launchd.sh --uninstall

# 陈旧锁卡住（每轮都"另一个同步正在运行，跳过"）→ 手动清一次
rmdir ~/.cache/gengrowth-sync-shell.lock.d

# 插件配置回滚：改前有 data.json.bak.<时间戳> 备份
```

**深度分叉恢复**（本地积压大量 backup、与远端分叉）：先 `set-obsidian-git-safe-config.py`
止血，`git tag pre-reconcile-backup HEAD` 保命，确认本地净内容 `git diff --stat <merge-base> HEAD`；
若本地提交是空 backup（净差异为 0），可 `git reset --hard origin/main` 对齐远端（远端不受影响），
再恢复真正的未提交工作。**动手前务必备份未提交文件 + 打 tag。**
