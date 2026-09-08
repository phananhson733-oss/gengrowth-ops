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
