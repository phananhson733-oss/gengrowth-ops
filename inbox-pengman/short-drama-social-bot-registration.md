# Social Bot 注册清单（短剧 Runner）

**为什么需要这份清单**：2026-09-08 14:28 的实测证明，聊天里的授权无效。Social Bot 的原话：

> **拒绝来源：Social Bot 的预授权流程判断。** 当前固定权限仅允许通过 `terminal` 执行：
> `competitor-analysis`、`social-pipeline`。这条 `short-drama-release-manager` 命令不在上述范围内。
> 由于 Runner 未被调用，**没有 Runner error code，也没有 stdout**。
> 用户在对话中的授权不能覆盖 Social Bot 的固定工具权限边界。

拦截发生在 Bot 侧，Runner 根本没被调起。所以要打通链路，必须把短剧 Runner 加进 Social profile 的
预授权流程列表，和 `competitor-analysis` / `social-pipeline` 并列。

下面是 Runner 侧**已经在执行**的门禁，注册时照着写就是最小权限，不需要给 Bot 通用 terminal 权限。
每一条都来自 `shortdrama_ctl.mjs`，不是推测。

---

## 1. 可执行对象

```
/usr/bin/env node ~/gengrowth-ops/inbox-pengman/tools/short-drama-release-manager/shortdrama_ctl.mjs <args>
```

必须是 `node` 直接调起 Runner（`directNodeInvocation`），中间不能套 npm / npx / 包装脚本。

## 2. 固定配置路径（`assertSocialRuntimeConfig`）

`--config` 只接受 Runner 同目录下的 `shortdrama.runtime.json`，解析成绝对路径后逐字比对。
任何其它路径 → 拒绝。Bot 不需要、也不应该能选择配置文件。

## 3. 命令白名单（`resolveInvocationIdentity`）

| 允许 | 说明 |
| --- | --- |
| `account` / `capture` | 只读（list / get） |
| `pool` / `release` | 业务读写，写操作走 preview → apply 两段式 |
| `metrics` | 只读 |
| `sync start` | 触发同步 |

| 拒绝 | 返回 |
| --- | --- |
| `doctor` / `migrate` / `schedule` / `queue` | `social_command_denied` |
| 任何 internal 命令 | `social_command_denied` |
| 带 `--actor-id` / `--chat-id` | `session_identity_override` |

即使 Hermes 侧放开，这四组命令 Runner 自己也会拒。**不需要在配置里再列一遍黑名单。**

## 4. 必需环境变量（缺一即 `session_identity_invalid`）

```
HERMES_SESSION_PLATFORM=feishu
HERMES_SESSION_PROFILE=social      # 硬性；pm / ops 一律拒绝
HERMES_SESSION_USER_ID=<发起人 open_id>
HERMES_SESSION_CHAT_ID=<群 chat_id>
```

身份只从这四个变量取，Bot 不能通过命令行参数覆盖。

## 5. 进程祖先链（`inspectTrustedSocialInvoker`，已验证 ACCEPT）

```
Hermes gateway (profile=social)
  └─ bash -c   或   bash -l -c   ← 命令体必须正是第 1 节那条
       └─ /usr/bin/env node .../shortdrama_ctl.mjs <args>
```

`--payload` 至多出现一次，且值必须是 `-`（走 stdin，quoted-heredoc）。
**这条已用真实进程验证通过**（pid 63535/63529 → ACCEPT），Social Bot 现有的 terminal 调用形态是对的，
它只是不肯调。

---

## 0. 要改的确切位置（2026-09-08 14:36 实测得到）

`/reset` 后的新会话里，Bot 原样列出了它当前的 terminal 允许流程：

> 1. `§4.1 例外：竞品分析自动流程（预授权，直接执行）`
> 2. `§4.2 例外：社媒流水线 social-pipeline（预授权，直接执行）`
>
> 当前规则中没有 `short-drama-release-manager`。

所以规则住在 Social profile 的 **`SOUL.md` 第 4 章「例外」**，条目格式是
`§4.x 例外：<流程名>（预授权，直接执行）`。需要新增 §4.3。

**下面这段可以直接粘进去**，它就是 Runner 已经在执行的边界（第 1–5 节逐条对应），
所以不是额外放权，只是把 Runner 自己的门禁在 Bot 侧声明一遍：

```markdown
### §4.3 例外：短剧发行管理 short-drama-release-manager（预授权，直接执行）

可执行对象（node 直接调起，中间不套 npm/npx/包装脚本）：
  /usr/bin/env node ~/gengrowth-ops/inbox-pengman/tools/short-drama-release-manager/shortdrama_ctl.mjs

配置固定为 Runner 同目录的 shortdrama.runtime.json，不接受任何其它 --config 路径。

允许的命令组：account、capture、pool、release、metrics、sync start
禁止的命令组：doctor、migrate、schedule、queue（Runner 自身也会拒绝，无需重复把关）

写操作一律两段式：先 pool/release preview-*，把回执贴给用户，用户确认后才执行 apply-*。
不得跳过 preview 直接 apply，不得使用 --actor-id / --chat-id 覆盖会话身份。
```

改完记得按 §5b 发 `/reset`，否则当前会话看不到。

---

## 5b. 改完配置必须重置会话（否则看不到新配置）

**这是最容易踩的坑。** Social Bot 的工具权限来自会话启动时注入的 `SOUL.md`/权限规则，
**会话中途不会重新加载**。2026-09-08 14:33 Bot 自己的说明：

> 1. **会话启动时加载一次。** 我刚才依据的是本会话启动时注入的 Social `SOUL.md`/权限规则，
>    不是 `terminal` 每次调用时实时读取的 Runner 白名单。现有会话不会中途替换系统提示词或工具权限，
>    以保持上下文与提示缓存一致。
> 2. **在当前群执行 `/reset` 或 `/new`，开启新会话即可重新加载配置。** 不需要新建群。
>    `/reload` 只刷新 `.env`，`/reload-skills` 只刷新技能，都不会刷新 `SOUL.md` 或工具权限。
>    若新会话仍看到旧配置，再由管理员执行网关 `/restart`，之后再次 `/reset`。

所以改完配置的顺序是：**改配置 → 在群里发 `/reset` → 再验证**。
跳过 `/reset` 会看到「配置明明改了却毫无变化」，实际是旧会话在答话。

---

## 6. 注册后怎么验证

**第一步 · 只读**，在 `# social assistant`（`oc_a4dae18b4ffeedc2877fe21dc58633c7`）里发：

```
@Social 原样执行并把完整 stdout 贴回：
cd ~/gengrowth-ops/inbox-pengman/tools/short-drama-release-manager && node shortdrama_ctl.mjs pool list --config "$PWD/shortdrama.runtime.json"
```

期望 61 条选剧池记录。若仍被拒且理由还是"不在预授权流程"，说明配置改动没有被当前会话加载——
Bot 的权限列表是会话级的，需要重启会话或新建会话再试。

**第二步 · 写**（`选剧池.SD-000001` 的备注当前为空，改它不覆盖任何真实数据）：

```
@Social 用 shortdrama_ctl.mjs 把 SD-000001 的备注改成「链路验证」。
先跑 pool preview-update 把回执贴给我，我确认后你再执行 apply-update。
```

回执应含 `before` 快照（备注为空）。确认后再让它 apply。

**第三步 · 独立核验**（不经 Runner，直接读 Base）：

```bash
lark-cli base +record-get --base-token OtnsbnRnwaLmnVsJByscTkFMntd \
  --table-id tbl4efRfwhJRqryA --record-id recvuxwd57tfNf --as user
```

看到 `备注: 链路验证` 即为端到端打通。验证完记得改回空值。

---

## 7. 已知不受此影响的两件事

- **仪表盘**：应用 `cli_aa8edad1a6785bea` 对该 Base 的仪表盘资源无任何权限
  （`GET /dashboards` 返回空且不报错，`POST` 返回 `800004011`，`retryable:false`）。
  这是飞书开放平台的应用权限，和 Social Bot 注册无关，手工建仪表盘也没用。
- **数据新鲜度**：需要跑一次采集器 + 同步。与本清单无关。
