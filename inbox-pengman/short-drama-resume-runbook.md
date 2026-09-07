# 短剧正式 Base 续跑执行清单

生成时间：2026-09-07（北京时间 19:5x）
适用代码版本：`main` @ `44332363`（含 decoder 修复、秒级精度修复、accounts-prefix 续跑）

> 这些命令**必须由你本人在独立的 macOS Terminal / iTerm / WezTerm / kitty / Ghostty 真实 TTY 中执行**。
> Runner 的 `isTrustedLocalInvoker` 会拒绝来自 IDE、Codex、Claude Code、Hermes gateway 的调用
> （实测返回 `local_invoker_untrusted`，连只读 `doctor` 都拒绝）。这是设计上的护栏，不要绕过。

## 0. 前置事实（已在本地独立核验）

| 项 | 值 |
| --- | --- |
| 正式 Base token | `OtnsbnRnwaLmnVsJByscTkFMntd`（执行时请从 Base URL 再独立核对一次） |
| privileged actor | `ou_a091570576859ad6cd5038f5e03903c2` |
| manifest | `migration-plan-20260907-184942-final.json` |
| manifest semantic SHA | `3008c3bc998bc1ce882653ae2253f7f55fd035429e7d6468d99b705785bfe8ff` |
| schema receipt | `schema-receipt-20260907-185244.json` / `a904168801248a3a6b5395001a319346178b170e4b2152dcf153ea3feec51f91` |
| canary receipt | `canary-receipt-20260907-185520.json` / `f5c03c916c885888ae1a4ea75b47fa3951b266a92edaeb5d18890c45e1e4152c` |
| permission attestation | `permission-attestation-20260907-183704.json` |
| attestation semantic SHA | `e7a5e12a6fa869e2023489365ea0e34f4835e5c62b85f7615a2d61bc7c4b7219` |
| attestation 文件 SHA | `2548435785dffb6567c033cf9ad3ede2c1a6c68c28c14071a9c695d30baa5119` |
| attestation 有效期 | `checked_at = 2026-09-07T10:37:04Z`，24 小时窗口 → **UTC 2026-09-08 10:37 / 北京时间 9/8 18:37 前有效** |
| 数据规模 | accounts 11 / dramas 61 / captures 229 / releases 171 = 472，blocked 0 |
| 凭据文件 | `inbox-pengman/tools/tiktok-public-capture/.env`（已存在） |

## 1. 环境变量

```bash
cd ~/gengrowth-ops/inbox-pengman/tools/short-drama-release-manager
export RUNTIME_CONFIG="$PWD/shortdrama.runtime.json"
export EXPECTED_BASE_TOKEN="<从正式 Base URL 独立核对后填入>"
export PRIVILEGED_ACTOR_ID="ou_a091570576859ad6cd5038f5e03903c2"
```

## 2. 只读状态确认（不写任何数据）

```bash
node shortdrama_ctl.mjs doctor --config "$RUNTIME_CONFIG" \
  --expected-base-token "$EXPECTED_BASE_TOKEN" --actor-id "$PRIVILEGED_ACTOR_ID"
```

期望：`"status":"ready"` 或 `"status":"sequence_unseeded"`（sequences 尚未播种是正常的）。
若返回 `schema_drift` / `base_table_missing`：**停止**，把完整输出发回。

## 3. 精确前缀续跑（唯一允许的续跑方式）

```bash
node shortdrama_ctl.mjs migrate apply --phase data --config "$RUNTIME_CONFIG" \
  --manifest migration-plan-20260907-184942-final.json \
  --expected-sha256 3008c3bc998bc1ce882653ae2253f7f55fd035429e7d6468d99b705785bfe8ff \
  --schema-receipt schema-receipt-20260907-185244.json \
  --expected-schema-receipt-sha256 a904168801248a3a6b5395001a319346178b170e4b2152dcf153ea3feec51f91 \
  --canary-receipt canary-receipt-20260907-185520.json \
  --expected-canary-sha256 f5c03c916c885888ae1a4ea75b47fa3951b266a92edaeb5d18890c45e1e4152c \
  --permission-attestation permission-attestation-20260907-183704.json \
  --expected-permission-attestation-sha256 e7a5e12a6fa869e2023489365ea0e34f4835e5c62b85f7615a2d61bc7c4b7219 \
  --expected-permission-attestation-file-sha256 2548435785dffb6567c033cf9ad3ede2c1a6c68c28c14071a9c695d30baa5119 \
  --expected-base-token "$EXPECTED_BASE_TOKEN" \
  --resume-partial-data accounts-prefix \
  --confirm apply-now --actor-id "$PRIVILEGED_ACTOR_ID"
```

期望：`{"status":"applied","phase":"data",...}`。
已存在的 11 条 `账号台账` 记录会被判定为 unchanged，不会被重写或删除。

## 4. 全量核验（presentation / sequences 之前必须通过）

```bash
node shortdrama_ctl.mjs migrate verify --config "$RUNTIME_CONFIG" \
  --manifest migration-plan-20260907-184942-final.json \
  --output "verification-$(date +%Y%m%d-%H%M%S).json" \
  --expected-base-token "$EXPECTED_BASE_TOKEN" --actor-id "$PRIVILEGED_ACTOR_ID"
```

期望：`"status":"verified"`，`counts` 为 `{accounts:11, dramas:61, captures:229, releases:171}`。

## 5. 失败处理

| 返回码 | 含义 | 动作 |
| --- | --- | --- |
| `resume_prefix_mismatch` | 正式 Base 已不是"仅账号表写入"的精确前缀 | **不要重试、不要删数据**。错误 details 会带上具体 table / key / field，把完整输出发回 |
| `base_not_empty` | 你漏了 `--resume-partial-data accounts-prefix` | 补上该参数重跑 |
| `migration_permission_attestation_required` | attestation 超过 24 小时或绑定漂移 | 按 README 的离线命令重新生成 observations + attestation |
| `source_revision_drift` | Google/SQLite 源在计划后发生变化 | 停止，需要重新 plan（注意：账号表已非空，replan 会 blocked，需先讨论） |
| `local_invoker_untrusted` | 你不在独立 Terminal 里 | 换到真实 TTY 终端执行 |
| `readback_mismatch` | 写入后读回与 manifest 不一致 | 停止，把 details 里的 table/key/field 发回 |

## 6. 续跑成功后的后续阶段

`migrate verify` 通过后，才能按 README 顺序执行 `--phase presentation` 与 `--phase sequences`
（sequences 还需要第 4 步产出的 verification 文件及其字节 digest）。
