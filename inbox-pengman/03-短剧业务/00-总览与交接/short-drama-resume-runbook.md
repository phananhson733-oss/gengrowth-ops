# 短剧正式 Base 续跑执行清单

代码版本：`main` @ `5014615a`（decoder 修复 + 秒级精度 + 空集合规范化 + manifest-subset 续跑）
执行前审计：GO-WITH-CONDITIONS，四个条件均已处理（见 §6）

---

## 0. 三条硬性前提

**① 必须在 Ghostty 里执行，不能用 Terminal.app。**
Runner 的 `inspectTrustedLocalInvoker` 硬编码了这个 login 形态：

```
/usr/bin/login -flp awayer_mini /bin/bash --noprofile --norc -c exec -l /bin/zsh
```

Ghostty 正是这个形态；Terminal.app 用的是 `login -pf awayer_mini`，**不匹配**，会直接返回
`local_invoker_untrusted` 且零写入。IDE、Codex、Claude Code 同样被拒（进程链里多了一层）。

**② 绝对不要再跑 `doctor --canary`。**
canary 会在四张表各建一条真实记录再删除，并把 `count_before` 记成**当前**行数。
`账号台账` 现在有 11 行，所以新生成的 canary receipt 永远无法通过校验
（`assertCanaryReceipt` 要求 `count_before === 0`）。
**手上这份 canary receipt 是一次性的、不可再生的。** 执行前先备份：

```bash
cd ~/gengrowth-ops/inbox-pengman/output/short-drama-release-manager/migrations
cp canary-receipt-20260907-185520.json  ~/canary-receipt-BACKUP.json
cp schema-receipt-20260907-185244.json  ~/schema-receipt-BACKUP.json
```

**③ 执行期间不要有人在 Base UI 里改这四张表。**
Base v3 没有跨表快照也没有 CAS，门禁读取与写入之间的时间窗关不掉。这与 canary 是同一个前提。

---

## 1. 前置事实（已本地独立核验）

| 项 | 值 |
| --- | --- |
| 正式 Base token | `OtnsbnRnwaLmnVsJByscTkFMntd`（执行时请从 Base URL 再核对一次） |
| privileged actor | `ou_a091570576859ad6cd5038f5e03903c2` |
| manifest | `migration-plan-20260907-184942-final.json` / `3008c3bc998bc1ce882653ae2253f7f55fd035429e7d6468d99b705785bfe8ff` |
| schema receipt | `schema-receipt-20260907-185244.json` / `a904168801248a3a6b5395001a319346178b170e4b2152dcf153ea3feec51f91` |
| canary receipt | `canary-receipt-20260907-185520.json` / `f5c03c916c885888ae1a4ea75b47fa3951b266a92edaeb5d18890c45e1e4152c` |
| permission attestation | `permission-attestation-20260907-183704.json` |
| attestation 语义 SHA | `e7a5e12a6fa869e2023489365ea0e34f4835e5c62b85f7615a2d61bc7c4b7219` |
| attestation 文件 SHA | `2548435785dffb6567c033cf9ad3ede2c1a6c68c28c14071a9c695d30baa5119` |
| **attestation 有效期** | `checked_at = 2026-09-07T10:37:04Z` → **北京时间 9/8 18:37 到期** |
| 数据规模 | accounts 11 / dramas 61 / captures 229 / releases 171 = 472，blocked 0 |
| 当前 Base 状态 | `账号台账` 11 行已写入；其余三表最后观测为 0 |

---

## 2. 环境变量

```bash
cd ~/gengrowth-ops/inbox-pengman/tools/short-drama-release-manager
export RUNTIME_CONFIG="$PWD/shortdrama.runtime.json"
export EXPECTED_BASE_TOKEN="<从正式 Base URL 独立核对后填入>"
export PRIVILEGED_ACTOR_ID="ou_a091570576859ad6cd5038f5e03903c2"
```

---

## 3. 只读预检：用 `migrate verify`，不要用 `doctor`

`doctor` 不读取任何记录、不解码任何数据单元格（它调 `runtimeSchema()` 时没有
`includeRecordEvidence`），所以对行级漂移一律报 `ready`——它证明不了你关心的事。

`migrate verify` 是只读的（`assertRepoSet(..., {write:false})`），它会完整解码
`账号台账` 全部 11 行 × 11 字段——**正是 9/7 崩掉的那条路径**——然后在 `选剧池`
上因 0 ≠ 61 干净地失败。

```bash
node shortdrama_ctl.mjs migrate verify --config "$RUNTIME_CONFIG" \
  --manifest migration-plan-20260907-184942-final.json \
  --expected-base-token "$EXPECTED_BASE_TOKEN" --actor-id "$PRIVILEGED_ACTOR_ID"
```

**期望的"好"结果**（这是预检通过的样子，不是失败）：

```json
{"status":"failed","error":{"code":"readback_mismatch",
 "message":"Base primary-key set does not match the manifest",
 "details":{"table":"选剧池","expected":[…61 个剧ID…],"actual":[]}}}
```

- 报在 `选剧池` 且 `actual` 为空 → 账号表 11 行解码成功、主键集合匹配，下游仍空。**可以继续。**
- 报在 `账号台账` → 账号表本身已偏离，**停**，把输出发回。
- `actual` 非空 → 下游表已经有数据，**停**，把输出发回。

---

## 4. 续跑

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
  --resume-partial-data manifest-subset \
  --confirm apply-now --actor-id "$PRIVILEGED_ACTOR_ID"
```

期望：`{"status":"applied","phase":"data",…}`

规则只有一条：**Base 里现存的每一行都必须是 manifest 定义的行，且逐字段一致。**
已完整的表（现在是 `账号台账`）结构性零写入——门禁证明它等于 manifest 后就把它整个排除在
写入路径外，只读它的索引解析下游关联 ID。缺失的行由 upsert 补齐。

---

## 5. 全量核验

```bash
node shortdrama_ctl.mjs migrate verify --config "$RUNTIME_CONFIG" \
  --manifest migration-plan-20260907-184942-final.json \
  --output "verification-$(date +%Y%m%d-%H%M%S).json" \
  --expected-base-token "$EXPECTED_BASE_TOKEN" --actor-id "$PRIVILEGED_ACTOR_ID"
```

期望 `"status":"verified"`，counts 为 `{accounts:11, dramas:61, captures:229, releases:171}`。
这一步通过之前，不要执行 `--phase presentation` 或 `--phase sequences`。

---

## 6. 失败处置表

**先记住最重要的一条**：第 4 步现在用的是 manifest-subset 门禁，**任何中途失败之后，
重跑第 4 步那条一模一样的命令就是正确的恢复动作**。它会跳过已写完的表、补齐缺的行。
在此之前先跑一次第 3 步的只读 verify 看清落地情况。

| 错误码 | 是否已写入 | 处置 |
| --- | --- | --- |
| `base_request_failed` / `base_rate_limited` / `base_auth_failed` | **可能已写入** | 传输层失败,可能发生在行提交之后。先跑 §3 verify 看落地情况,再原样重跑 §4 |
| `base_response_invalid` | **可能已写入** | 与 9/7 事故同类,发生在写后读回。先跑 §3 verify,再原样重跑 §4 |
| `readback_mismatch`（在 §4 中出现） | **已写入** | data 阶段的这个码一定意味着对应表已经写了行。先跑 §3 verify,再原样重跑 §4 |
| `resume_prefix_mismatch` | 否，零写入 | Base 里有 manifest 未定义的行,或某行字段与 manifest 不一致。details 带 table / key / field / extra。**停,不要删数据**,把输出发回 |
| `duplicate_base_key` / `duplicate_record_id` | **已写入** | 出现了重复主键或重复 record_id（重试在提交后重放会造成）。**停,不要手工删除任何行**,先把 record_id 记下来,把输出发回 |
| `base_not_empty` | 否 | 你漏了 `--resume-partial-data manifest-subset` |
| `schema_revision_drift` | 否，Base 未被修改 | schema receipt 已过期（有人动过表结构）。**停**,不要用旧摘要重试 |
| `base_schema_drift` | 看消息 | `Complete live Base schema is required before data writes` = 写前门禁,未写入；出现在表之间则可能已部分写入。先跑 §3 verify |
| `base_response_incomplete` | 否 | 行清单被截断,**不能据此判断某张表为空**。重跑该只读命令即可 |
| `migration_evidence_mismatch` 及其它 digest/evidence 族 | 否，未接触 Base | 命令行的文件名或摘要写错了。对照 §1 改正后原样重跑 |
| `migration_permission_attestation_required` | 否 | attestation 超过 24 小时或绑定漂移。按 README 的离线命令重新生成 observations + attestation |
| `local_invoker_untrusted` | 否 | 你不在 Ghostty 里（见 §0 ①） |
| `source_revision_drift` | 否 | Google/SQLite 源在计划后变了。**停**——注意账号表已非空,重新 plan 会被 `base_not_empty` 挡住,需要先讨论 |

---

## 7. 已知限制（不是缺陷,是这次接受的前提）

- Base v3 的读取接口不提供跨表快照或 CAS,门禁读取与写入之间的时间窗无法消除。因此本次
  必须在受控维护窗口内执行,最终一致性由 §5 的 `migrate verify` 给出结论。
- `采集数据` 的 229 行分两批写入（200 + 29）,批与批之间没有原子性。中断后按 §6 首条处理。
- 迁移写入（`migrate apply`）不走预览回执,没有幂等令牌。重试只在 429 与 auth 失败时发生,
  这两种情况请求都未被服务端执行,所以重试本身不会重复提交；真正的窗口是响应丢失后由人重跑,
  此时由 `--resume-partial-data manifest-subset` 门禁兜底（已完整的表零写入）。
  若仍出现重复,按 `duplicate_base_key` 一行处理。
  **业务写（`preview-*` → `apply-*`）不在此列,它已经是幂等的**,见 §7b。
- `verifyMigration` 顺序读取四张表,不绑定统一 revision,所以它证明的是"读取期间各表分别
  与 manifest 一致",不是一个跨表原子快照。

---

## 7b. 业务写路径已经是幂等的（2026-09-08 核实）

Bot 走的 `preview-*` → `apply-*` 这条路,`consumePreview` 有四重防护:

| 防护 | 拒绝码 |
| --- | --- |
| 回执一次性,用过即废 | `preview_used` |
| 回执有效期 | `preview_expired` |
| 目标行必须与预览时逐字段一致（CAS 语义） | `preview_stale` |
| SQL `UPDATE ... WHERE used_at IS NULL` 原子标记 | — |

外加 `#withMutationLock` 持久租约。`tests/ids-job-lease.test.mjs` 有跨进程并发测试:
两个进程同时消费同一回执,恰好一个成功、一个拿到 `preview_used`。

所以人重跑一次 `apply-update` 不会写两遍,而是被 `preview_used` 干净拒绝;
预览之后目标被别人改过,则被 `preview_stale` 拒绝,需要重新预览。

**飞书 Base API 不提供可用的幂等键。** 实测 `client_token` 放 query 或 body 都被静默忽略
（三种写法对同一个不存在的表返回完全相同的 `TableIdNotFound`）,所以不能靠它,
也不要为了"看起来更安全"把它加进请求——那只会制造虚假保证。
