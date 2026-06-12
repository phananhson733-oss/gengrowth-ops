# SOP：新增 Ops 个人工作台

新招一个人，在 `gengrowth-ops` 里给 TA 开一个独立工作台（形如 `inbox-pengman/`）：共用同一个仓库，各自有独立加工区。

分两步——**第一步建目录**（不需要 GitHub 账号，可提前做）；**第二步接自动化 + 授权**（账号到位后做）。
每个人情况可能不同，本文记录核心逻辑和关键约定，照着判断即可，不必逐字照搬。

参考样板：第一个工作台 `inbox/`（Ops / Ma Boyang）。新工作台沿用它的全套规则（status 语义、5 必填字段、wiki 目录只读），只改归属信息。

---

## 命名约定

- 工作台目录统一 `inbox-{slug}`（slug = 小写拼音/英文，人工指定，别自动音译）。
- 这个前缀是后续自动化识别工作台的依据，不要换别的命名。

---

## 第一步：建目录（无需 GitHub 账号）

1. 复制 `inbox/` 的目录骨架到 `inbox-{slug}/`（00–09 子目录，空目录放 `.gitkeep`）。
2. 复制 `inbox/README.md`，只改归属信息：owner、归档路径、brand-wrap 示例里的路径都换成本工作台；规则部分原样保留。
3. commit（个人工作台不在 CODEOWNERS，直接推 main 即可）。

**此时状态**：目录能当草稿区用，但 `dispatch` 还不认这个目录——走流程的状态（`ready_*` / `archived`）要等第二步才生效。

---

## 第二步：接自动化 + 授权（账号到位后）

1. **授权（唯一的真权限动作，需 owner 执行）**：把新人加为仓库协作者、给 **Write**。
   `gh api -X PUT repos/xdawayer/gengrowth-ops/collaborators/{github_user} -f permission=push`
   新人需在 GitHub 接受邀请。核对 username 是本人。没有 Write，TA 的 Obsidian Git 推不上来。

2. **让 dispatch 认新工作台**：现状 `scripts/dispatch-inbox.js` 和 `dispatch.yml` 把根目录写死成 `inbox/`。改造的核心是把"工作台根"从单个变成一份**清单**（推荐 `scripts/workspaces.json`，记 `slug / 显示名 / github 账号`），让脚本和 workflow 都读它。
   - 校验/分拣逻辑、必填字段、`ALLOWED_TARGETS` 等**所有共用规则不动**。
   - 只把"识别哪个目录、归档到哪、失败 @ 谁"改成按所属工作台推导。
   - 这次改造**做一次**；之后加人只往清单加一行，不再碰代码。

3. **失败通知分流**：dispatch 校验失败开的 issue，按工作台 @ 对应的人（`inbox/` → Ops，`inbox-{slug}/` → 新人）。

4. **新人本地环境**：用 `scripts/setup-workspace-local.sh` 给新人做首次设置——稀疏检出（sparse-checkout）让他本地**只看到自己的工作台目录**，碰不到别人的，又不影响自动同步。详见该脚本说明 + `onboarding/新人工作台上手指南.md`。

5. **验证**：用 `DRY_RUN=1` 干跑，确认新工作台的 `ready_*` 文件能进流程，且 `inbox/` 行为无回归。

---

## 关键提醒（让新人知道）

- **软隔离**：所有人共用一个仓库，拿到 Write 技术上能改任何文件。请只在自己的 `inbox-{slug}/` 里作业，别动别人的。
- **wiki 目录只读**：`docs/`、`✍️ 内容资产/`、`参考资料/`、`每日日报/`、`task-collab/` 是单向镜像，本地改了会被覆盖；要改去 wiki repo。
- **正式沉淀走流程**：产物转正式规则用 `ready_for_review` 开 PR，由 `@xdawayer` 审批。

---

## 终局（值得做成脚本时再做）

加一份 `scripts/workspaces.json` 当唯一事实来源，配两个脚本：建目录（第一步）、回填清单+自检（第二步非授权部分）；dispatch / workflow / 周报都读这份清单。做到后，加人 = 跑一条命令 + 一次授权。授权因涉及 admin 权限，始终人工确认。

---

## 实例登记

| 日期 | 工作台 | 显示名 | GitHub | 第一步 | 第二步 |
|---|---|---|---|---|---|
| 2026-06-10 | `inbox-pengman` | 彭满 | `Pmemmm` | ✅ | ⏳ 授权邀请已发，自动化改造待办 |

---
*最后更新：2026-06-12*
