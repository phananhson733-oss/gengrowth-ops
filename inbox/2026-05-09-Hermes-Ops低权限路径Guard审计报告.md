# Hermes / GenGrowth Ops 低权限路径 Guard 审计报告

生成时间：2026-05-09 15:01 CST
范围：Hermes agent 本机仓库与 Ops/博洋 profile 配置

## 结论

本次已完成低权限用户与文件工具的双层防护：

1. Slack 低权限用户（Ops/博洋）不能通过 default / ceo / pm 等高权限 profile 使用 Hermes。
2. 如未来给低权限 profile 开启文件工具，read/search/write/patch 会先检查 GenGrowth allowlist，越界路径会在真实 I/O 前被拒绝。
3. Ops profile 已配置独立读写根目录 allowlist。
4. 相关回归测试已通过，gateway 已重启生效。

## 已修改内容

### 1. Gateway 角色权限硬 guard

文件：`/Users/awayer_mini/.hermes/hermes-agent/gateway/run.py`

新增逻辑：
- 读取 `GENGROWTH_LOW_PRIVILEGE_USERS`
- 读取 `GENGROWTH_LOW_PRIVILEGE_ALLOWED_PROFILES`
- 对 Slack 来源的低权限用户，在普通 allowlist / allow-all / pairing 之前做拒绝判断
- 默认只允许低权限用户使用 `ops` profile

锁定的安全不变量：
- 即使未来误配 `SLACK_ALLOWED_USERS` 或 `SLACK_ALLOW_ALL_USERS=true`，低权限用户也不能进入 default / ceo / pm profile。

### 2. GenGrowth 文件工具路径 allowlist

文件：`/Users/awayer_mini/.hermes/hermes-agent/tools/file_tools.py`

新增环境变量：
- `GENGROWTH_FILE_READ_ALLOWED_ROOTS`
- `GENGROWTH_FILE_WRITE_ALLOWED_ROOTS`

覆盖工具：
- `read_file_tool`：读文件前检查 read roots
- `search_tool`：搜索前检查 read roots
- `write_file_tool`：写文件前检查 write roots
- `patch_tool`：patch 前检查 write roots

行为：
- 未配置 allowlist 时保持原有行为。
- 配置后，目标路径必须在 allowlist 根目录内，否则返回 `Access denied`，且不触发真实文件 I/O。

### 3. macOS 临时目录误杀修复

文件：`/Users/awayer_mini/.hermes/hermes-agent/tools/file_tools.py`

背景：
- macOS 会把 `/tmp`、`/var` 解析到 `/private/var/folders/...`。
- 原敏感路径 guard 会误把正常测试/运行时临时文件识别为 `/private/var/` 敏感路径。

处理：
- 显式允许 `/private/var/folders/`。
- 其他 `/private/var/` 路径仍然保持拒绝。

### 4. 安全 toolset 收敛

文件：`/Users/awayer_mini/.hermes/hermes-agent/toolsets.py`

新增：
- `gengrowth-ceo-slack-safe`
- `gengrowth-pm-slack-safe`
- `gengrowth-ops-slack-safe`

其中 Ops safe toolset 仅保留 `clarify`，不包含外部读取、文件、执行、memory、session_search、cron、delegate 等能力。

### 5. Ops / 博洋 profile allowlist 配置

文件：`/Users/awayer_mini/.hermes/profiles/ops/.env`

已配置：

```env
GENGROWTH_FILE_READ_ALLOWED_ROOTS=/Users/awayer_mini/gengrowth-ops,/Users/awayer_mini/.hermes/profiles/ops/workspace
GENGROWTH_FILE_WRITE_ALLOWED_ROOTS=/Users/awayer_mini/gengrowth-ops,/Users/awayer_mini/.hermes/profiles/ops/workspace
```

已确认目录存在：
- `/Users/awayer_mini/gengrowth-ops`
- `/Users/awayer_mini/.hermes/profiles/ops/workspace`

## 测试记录

### 语法检查

命令：

```bash
venv/bin/python -m py_compile tools/file_tools.py gateway/run.py
```

结果：通过，退出码 `0`。

### 回归测试

命令：

```bash
scripts/run_tests.sh tests/gateway/test_gengrowth_role_guard.py tests/tools/test_file_read_guards.py tests/tools/test_file_write_safety.py -v --tb=short
```

结果：

```text
61 passed in 0.99s
```

覆盖重点：
- 低权限 Slack 用户即使被 allowlist，也不能进入 default profile。
- 低权限 Slack 用户即使 `SLACK_ALLOW_ALL_USERS=true`，也不能进入 default profile。
- 低权限 Slack 用户在 ops profile 且 allowlist 正确时可用。
- 彪哥作为高权限用户在 default profile 且 allowlist 正确时可用。
- read/search 越界路径在 I/O 前被拒绝。
- write/patch 越界路径在 I/O 前被拒绝。
- allowlist 内路径正常放行。
- `/private/var/folders/` 临时路径放行，`/private/var/` 其他敏感路径仍拒绝。

## Gateway 重启记录

已重启 profile：
- default
- ceo
- pm
- ops

重启后状态：
- default gateway：已加载，PID `74608`
- ceo gateway：已加载，PID `74718`
- pm gateway：已加载，PID `74944`
- ops gateway：已加载，PID `74977`

说明：launchd 输出中 `LastExitStatus = 15` 是重启前终止旧进程的状态；当前服务已有新 PID，属于已加载运行状态。

## 影响评估

### 对现有设置的影响

低风险：
- GenGrowth 文件 allowlist 是 opt-in，只在设置 `GENGROWTH_FILE_READ_ALLOWED_ROOTS` / `GENGROWTH_FILE_WRITE_ALLOWED_ROOTS` 后启用。
- 未配置这些 env 的 profile 不受该文件路径 guard 影响。

中等影响：
- Ops profile 已配置 allowlist；如果后续给 Ops 开启文件工具，文件访问会被限制在配置根目录内。
- 当前 write allowlist 包含整个 `/Users/awayer_mini/gengrowth-ops`，比 `gengrowth-ops/AGENTS.md` 中“只写 inbox”更宽。若要严格执行 Ops 工作区规则，建议后续把 write allowlist 收窄为：
  - `/Users/awayer_mini/gengrowth-ops/inbox`
  - `/Users/awayer_mini/.hermes/profiles/ops/workspace`

高风险：
- 未发现会导致现有 default / ceo / pm 设置失效的改动。
- 新增 gateway 低权限 guard 会防止 Ops/博洋低权限用户误入高权限 profile，这是预期安全行为。

## 建议后续动作

1. 若要完全符合 Ops 工作区 `AGENTS.md`，建议将 Ops 写 allowlist 从整个 `gengrowth-ops` 收窄到 `gengrowth-ops/inbox`。
2. 若未来给 Ops profile 开启文件工具，应先确认 write allowlist 是否已收窄。
3. 高权限 profile 的 toolset 与 Slack 频道配置如需进一步收敛，应单独做一次配置审计，不和本次 guard 改动混在一起。

## 当前未提交变更清单

仓库：`/Users/awayer_mini/.hermes/hermes-agent`

变更文件：
- `gateway/run.py`
- `toolsets.py`
- `tools/file_tools.py`
- `tests/gateway/test_gengrowth_role_guard.py`
- `tests/tools/test_file_read_guards.py`
- `tests/tools/test_file_write_safety.py`

配置文件：
- `/Users/awayer_mini/.hermes/profiles/ops/.env`

报告文件：
- `/Users/awayer_mini/gengrowth-ops/inbox/2026-05-09-Hermes-Ops低权限路径Guard审计报告.md`
