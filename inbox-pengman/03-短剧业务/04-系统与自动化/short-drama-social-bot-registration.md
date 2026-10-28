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
/usr/bin/env node /Users/awayer_mini/gengrowth-ops/inbox-pengman/tools/short-drama-release-manager/shortdrama_ctl.mjs <args>
```

必须是 `node` 直接调起 Runner（`directNodeInvocation`），中间不能套 npm / npx / 包装脚本。

**绝对路径，不能用 `~`。** Hermes 会把命令包成 `eval '<命令>'`，而 Runner 用
`resolve(runnerPath)` 拼出期望值再逐字比对（`exactHermesEval`）——`~` 不会在比对前展开，
所以写 `~/...` 一定不匹配。2026-09-08 实测：带 `cd` / 相对路径 / `$PWD` 的调用返回
`social_invoker_untrusted`。

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

## 000. 最容易漏的一步：改总数措辞（2026-09-08 实测踩中）

**§4.3 加进文件不等于生效。** 实际经过：`SOUL.md` 在 14:51 就加好了 §4.3，位置正确、命令形态正确，
但从 14:51 到 16:33 每一次 `/reset` 之后，Bot 都回答「当前允许的流程：§4.1、§4.2」。

原因是 §4.1 开头这句还在：

> 以下是 CEO 预授权的**两个**工具/写入例外之一（另一个见 §4.2）

Bot 读到了 §4.3，但把这句当权威，按「只有两个例外」执行。**一个半小时的排查全耗在这上面**——
而且它伪装得像「配置没生效」，让人一直去怀疑 `/reset`、profile 路径、会话缓存。

**通则**：往一份声明式权限文档里加条目时，凡是声明**总数**或**枚举**的句子都必须同步改，
否则读它的 LLM 会按旧的总数执行。加 §4.3 要同时改：

- §4.1 的「**两个**…（另一个见 §4.2）」→「**三个**…（另两个见 §4.2、§4.3）」
- §4.2 的「与 §4.1 是**两条**独立流程」→「与 §4.1、§4.3 是**三条**独立流程」

`patch_social_soul.py` 会自动处理这两处，并在 §4.3 已存在时单独修措辞
（这正是本次的修复动作）。它只打印结构，不打印文件内容。

---

## 00. 已经排除的（2026-09-08 实测，不用再查）

加 §4.3 之前，先把「加完还是不通」的可能性砍掉。下面三项都已用真实环境验证过：

| 项 | 结论 | 怎么验证的 |
| --- | --- | --- |
| 网关祖先链门禁 | ✅ **ACCEPT** | 抓到 live 网关真实生成的 wrapper（Bot 跑 §4.2 时用 `ps` 抓 bash 进程），只把 `eval` 里的命令换成短剧 Runner，喂给 `inspectTrustedSocialInvoker` → 接受。见 `verify_gateway_live.mjs` |
| Runner 应用的记录写权限 | ✅ **齐全** | 用 `.env` 里的 app 凭证换 tenant token，对不存在的 record/table 探测：`update` 失败于 `record not found`、`create` 失败于 `TableIdNotFound`、`delete` 成功——全部不是权限问题，零数据变更 |
| Runner 应用的仪表盘权限 | ❌ **确实缺** | 同一应用：`GET /dashboards` 返回 `code=0` 但 0 条（不报错也看不见），`POST` 返回嵌套 `800004011 no permission to access this base`、`retryable=false` |

**所以聊天链路只剩 §4.3 这一件事**。仪表盘是独立的、只影响 presentation 阶段，与 Bot 无关。

两个容易踩的坑，记下来免得重复：

- **`lark-cli --as bot` 用的不是 Runner 的应用。** lark-cli 是 `cli_aa8edad1…`，Runner 用 `.env` 的
  `FEISHU_APP_ID` = `cli_aace2f42…`（也就是 Social Bot 那个）。拿 lark-cli 测出来的权限结论对
  Runner 无效——我就这么误判过一次，`--as bot` 报「缺 `base:record:update`」，而 Runner 的应用其实有。
- **别用单条 `ps -o pid=,ppid=,comm=,args=` 验证门禁。** `comm` 会被截断到 16 字符，网关 basename
  变成 `awayer_mi`，产生假的 gateway REJECT。`readMacProcessRow` 是每列单独一次 `ps`，不截断。

---

## 0. 要改哪个文件（2026-09-08 14:47 Bot 原样确认）

```
/Users/awayer_mini/.hermes/profiles/social/SOUL.md
```

Bot 的原话：「如果管理员修改的是默认 profile 的 `~/.hermes/SOUL.md`、`~/.hermes/config.yaml`，
或者其他 profile，**不会改变** Social Bot 新会话注入的规则。」——上次改动没生效，最可能就是这里。

**同目录的 `config.yaml` 不用动。** 两者是交集关系，不是覆盖关系：

| 文件 | 管什么 |
| --- | --- |
| `config.yaml` | `terminal` 工具集**是否启用**、backend、审批模式 |
| `SOUL.md` | 业务上**允许在哪些流程**调用 `terminal` |

`config.yaml` 那层已经是开的（§4.1 / §4.2 正在用 terminal 跑 python 脚本），
所以只差 SOUL.md 里的一条例外。反过来只改 `config.yaml` 也没用——
挡住短剧的是 SOUL.md「只允许两个例外」这条硬规则。

### 要改两处，漏一处规则会自相矛盾

**(1) §4.1 和 §4.2 的开头措辞**。两条现在都写着：

> §4.1：以下是 CEO 预授权的**两个**工具/写入例外之一（另一个见 §4.2）
> §4.2：第二个 CEO 预授权例外。与 §4.1 是两条独立流程

加了第三条就得同步改成「三个」/「§4.2、§4.3」/「三条独立流程」。

**(2) 新增 §4.3**，下面这段按 §4.1 / §4.2 的原文结构写好了，可直接粘：

```markdown
## 4.3 例外：短剧发行管理 short-drama-release-manager（预授权，直接执行）

第三个 CEO 预授权例外。与 §4.1、§4.2 是三条独立流程，别混用彼此的脚本、Sheet 和 Base。

**触发**：短剧业务的查看或修改请求——「选剧池有哪些 / 看一下账号台账 / 采集数据」
「把 SD-xxxxxx 的 X 改成 Y」「给 xxx 排期」「归档 xxx」「回填发布记录」。

**与 §4.1、§4.2 的一个结构差异**：这条例外的脚本不在 `~/.hermes/profiles/social/skills/` 下，
而在 `~/gengrowth-ops/` 内，解释器是 `node` 而不是 venv 里的 python。这是本例外明确允许的。

1. 允许用 `terminal` 跑**唯一入口** `shortdrama_ctl.mjs`。命令形态是**逐字校验**的，
   必须正好是下面这一行，多一个字符都会被 Runner 拒绝（`social_invoker_untrusted`）：

   ```
   /usr/bin/env node /Users/awayer_mini/gengrowth-ops/inbox-pengman/tools/short-drama-release-manager/shortdrama_ctl.mjs <子命令> <参数...> --config /Users/awayer_mini/gengrowth-ops/inbox-pengman/tools/short-drama-release-manager/shortdrama.runtime.json
   ```

   - 必须 `/usr/bin/env node` 开头，不能只写 `node`，不能套 npm / npx / 包装脚本。
   - Runner 和 `--config` 都必须是**完整绝对路径**。
   - **不能用 `~`**——Runner 比对的是绝对路径，`~` 不会在比对前展开。
   - **不能有 `cd`、`&&`、`;`、管道、`$PWD` 或任何变量替换**：整条命令必须是单条直接调用，
     参数里不允许出现空格和 `'"\;$&|<>`()` 这些字符。
   - 工作目录不用管，由 terminal 工具自己设置，不要写进命令里。
2. 允许的命令组：`account`、`capture`、`metrics`（只读）；`pool`、`release`（业务读写）；`sync start`。
3. **禁止**：`doctor`、`migrate`、`schedule`、`queue` 及任何 internal 命令。
   Runner 自己也会返回 `social_command_denied`，不要试图绕过它直连 Base API。
4. **写操作一律两段式**：先跑对应的 `preview-*`，把回执（含 `before` 快照）发到飞书，
   等人明确确认后才跑 `apply-*`。**不得跳过 preview 直接 apply**。
   飞书里的「确认 / 可以」只对本次预览有效，不能预先批准后续写入。
5. 不得用 `--actor-id` / `--chat-id` 覆盖会话身份；身份只从 Hermes 会话变量取，
   Runner 会拒绝任何覆盖（`session_identity_override`）。
6. 四张表里 `账号台账` 和 `采集数据` 对本流程是**只读**的（只有 list / get）。
7. 完成后在飞书回一句摘要（改了哪张表哪条记录 + 关键字段的前后值）。

**例外边界**：只允许上述这一个 Runner + 它固定配置指向的那一个 Base。
不借此例外访问其它 Base / Sheet / 凭证 / 目录，不做迁移、调度或物理删除类操作。
```

第 1–6 条**没有放宽任何东西**——每一条都是 `shortdrama_ctl.mjs` 已经在强制执行的门禁
（对应下面第 1–5 节），写进 SOUL.md 只是让 Bot 提前知道边界，少一次无谓的尝试。

改完发 `/reset`，然后让 Bot 复述一次允许列表——它会原样列出来，一眼看得出有没有生效。

---

## 0b. 上次为什么没生效（可能的三种）

1. **改错了文件**——最可能。Bot 明说改 `~/.hermes/SOUL.md`（默认 profile）或
   `~/.hermes/profiles/social/config.yaml` 都不会影响它。必须是
   `~/.hermes/profiles/social/SOUL.md`。
2. **改完没 `/reset`**——见 §5b，工具权限只在会话启动时注入。
3. **只加了 §4.3、没改 §4.1/§4.2 的「两个」**——这一条不一定导致失效，
   但会让规则自相矛盾，Bot 可能仍按「只有两个例外」执行。

核对方法：改完 `/reset` 后在群里问一句「你现在允许用 terminal 的流程有哪些」，
它会把条目原样列出来。

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
@Social 原样执行这一条，把完整 stdout 贴回（不要加 cd，不要改写）：
/usr/bin/env node /Users/awayer_mini/gengrowth-ops/inbox-pengman/tools/short-drama-release-manager/shortdrama_ctl.mjs pool list --config /Users/awayer_mini/gengrowth-ops/inbox-pengman/tools/short-drama-release-manager/shortdrama.runtime.json
```

期望 61 条选剧池记录。按错误分辨卡在哪一层：

| 现象 | 含义 |
| --- | --- |
| 「不在预授权流程」 | §4.3 没生效——改错文件，或改完没 `/reset`（见 §0b、§5b） |
| `social_invoker_untrusted` | §4.3 已生效、Runner 已被调起，但**命令形态不对**——多半带了 `cd`、相对路径或 `~` |
| 正常返回 61 条 | 读链路打通 |

**别只看 Bot 的自述。** 它能只读 `gengrowth-ops` 里的文件，包括 Runner 源码和 manifest，
所以它有能力编出一份格式完全正确的"执行结果"。要判定命令是否真的跑过，让它回报输出里的
`创建时间` / `最后修改时间`——这两个是飞书 Base 生成的，本地任何文件里都没有，
然后用 §6 第三步的 `lark-cli` 独立核对。

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
