# 短剧发行管理平台 — 交接状态（2026-09-08）

代码：`main` @ `7cfb6a72`，582/582 测试通过，`npm run check` / `node --check` / `diff --check` 全绿。
本轮改动：16 个 commit（9805b650..7cfb6a72，其中两处被 vault backup 进程抢先自动提交，
rationale 补在空提交 `3bc0824c`）。测试从 546 增至 582。

---

## 1. 落地进度

| 阶段 | 状态 | 证据 |
| --- | --- | --- |
| schema | ✅ 早前完成 | `schema-receipt-20260907-185244.json` |
| canary | ✅ 早前完成 | `canary-receipt-20260907-185520.json`（**一次性，不可再生**） |
| **data** | ✅ 完成并核验 | 472 行；`migrate verify` = `verified`；语义摘要 `b8d7ccc8…` |
| **sequences** | ✅ 完成 | `doctor: ready`，`drama_next=SD-000062` / `release_next=SR-000172` |
| **presentation** | ⚠️ 部分完成 | **15 个视图全部建好**；仪表盘 0 个，卡在 `800004011 no permission`（见 3.1） |
| Social Bot 端到端 | ⚠️ 链路已通，缺授权 | PM Bot 已真实拉起 Runner 并回传输出；卡在 Social Bot 预授权（见 3.2） |
| 七天验收 | ❌ 未开始 | 第一天尚未发生 |

生产 Base 现有：`账号台账` 11 / `选剧池` 61 / `采集数据` 229 / `发布记录` 171 = 472 行，引用完整性零悬空。

---

## 2. 本轮修复的 15 个缺陷

**读回解码（5 个）** — 全部是"对 vendor 返回形状的假设"错误，且全部只有在真实数据流过时才暴露：

1. `8ea3e335` datetime 只认 legacy `YYYY-MM-DD HH:mm:ss`，Base 实际返回带时区 ISO → 事故根因
2. `44332363` manifest 带亚秒精度，Base 只存到秒 → 会让 472 行里 98 个字段的读回比对必然失败
3. `5014615a` 空 multi_select / link：Base 可能返回 `null` / `""` / `[]` 三种，全部归一为 `[]`
4. `2575fe76` 数值 lookup 返回 `"0.00"` 而非整数字符串
5. `953934f9` 视图过滤器的 value-less 操作符被 Base 补了 `null` 第三元素

**死锁（3 个）** — 同一个模式：**门禁绑定了它并不依赖的东西**，然后在正常业务活动下把自己锁死：

6. `5014615a` 恢复门禁只认"仅账号表已写"这一种前缀 → 任何中途中断都无法恢复，而 canary 不可再生意味着只有一次机会
7. `e966dea1` source-drift 门禁作用于所有阶段 → 有人正常编辑 Google 表就锁死 sequences / presentation，而 Base 非空后无法 replan
8. `4f074fdb` Social 网关祖先链回归（`51234aa5` 引入）→ 每条聊天命令都被拒

**其它（4 个）**：

9. `1b7211fc` 批量写后读回没有可见性轮询，把 Base 的写入延迟当成丢失
10. `b5af0950` 已证明的表仍走 upsert（TOCTOU）
11. `ac672bab` / `0cd20920` / `de0aa874` 三处诊断为空：数值 lookup、视图形状、API 路由被二次脱敏
12. `7304a8ca` 飞书把真实错误嵌在 `data.error` 里，Runner 只报外层信封 `{"code":1,"status":200}`；
    现在会给出 `base_permission_denied` / `vendor_code:800004011` / 原始 message / `retryable:false`

**数据正确性与由它引出的第四个死锁（3 个）** —— 这三条是本轮最后修的，见 §2b：

13. `5e493da5` 两源合并时 SQLite 无条件覆盖 Google，采集器落后一天就让指标回退
14. `ee09f5c3` + `67612ecc`（rationale 在 `3bc0824c`）第 13 条引出的死锁：manifest 重放被绑到当前
    代码版本而非它自己声明的策略，会让已应用的生产 manifest 直接失效
15. `7cfb6a72` 没有任何手段检查"代码改动是否让已应用的 manifest 失效"；新增离线自检脚本

---

## 2b. 数据回退与第四个死锁（若要用最新数据重跑，这段必读）

**问题**：`reconcileCaptureSources` / `reconcileAccounts` 把 Google 当 `historical`、SQLite 当
`latest`，用 `{...historical, ...latest}` 让 SQLite 无条件胜出。9/7 迁移时采集器停在 9/4、人工表
更新到 9/7，于是 87 条重叠采集里的 76 条和全部 10 个账号被回退，净丢弃 10,124 次播放、802 个粉丝，
而 manifest 里没有任何记录。

**修复**：SQLite 仍是默认主源（机器采集），只有当 Google 的 `snapshot_date` **严格更新**时才让位，
并产生 `stale_sqlite_snapshot` 警告（带两个日期）。日期缺失或格式不合法一律保持 SQLite 主源——
门禁不能被畸形输入打开。指标回退改为对称：谁是主源，它的 null 字段就回退到另一方；Google 不带
`captured_at` / `published_at`，所以这两个字段也从 SQLite 回退，不会被抹成 null。

**由此引出的第四个死锁**：`assertManifest` 会用 manifest 自带的 `source_backup` 重放一遍再逐字段
比对，而它对**所有阶段**都跑，包括 presentation。改了合并逻辑后，用新代码重放已应用的生产 manifest
会得到 google-primary 的行、而 manifest 里是 sqlite-primary 的行 → `migration_manifest_invalid`。
Base 非空又无法 replan，**已写入的 472 行会被搁浅，presentation 永远做不完**。

这与本轮修的另外三个死锁是同一个模式：**门禁绑定了它并不依赖的东西**。

**解法**：重放策略取自 manifest 自己声明的 `source_evidence.policy`——`v1` = SQLite 无条件优先，
`v2` = 按 `snapshot_date` 取新，planner 只产出 `v2`。policy 参与 `source_revision` 哈希，而
`source_revision` 又嵌在每行的 `来源 run_id` 里，所以不能靠改标签挑选重放策略；未知 policy 是硬拒绝，
不会静默退化。

**已用真实生产 manifest 验证**：修复前 `migration_manifest_invalid`，修复后通过 `assertManifest`。
盘上 15 份 manifest 里，9/7 17:41 之后的 9 份（含生产用的 `20260907-184942-final`）全部 REPLAY OK；
失败的 6 份是 9/4 草稿和已标注废弃的 `20260907-110158`，都未曾 apply。

**以后改 reconciliation / validation / schema planning 必须跑**：

```bash
node verify_manifest_replay.mjs "$MIGRATION_ROOT"/migration-plan-*.json
```

已 apply 过的 manifest 出现 `REPLAY FAIL` 是发布阻断项。


---

## 3. 下一步（只能在 Ghostty 里执行）

**硬性前提**：必须 Ghostty，不能 Terminal.app（`login -pf` 形态不匹配白名单）；不要再跑 `doctor --canary`。

### 3.1 presentation

**已确认状态（只读查过真实 Base）：15 个视图全部建好。**

```
账号台账  在用账号 / 需处理账号                                       2
选剧池    未排期 / 已排期 / 按平台 / 按语言                            4
采集数据  完整 / 部分缺失 / 未关联发布                                 3
发布记录  已排期 / 待公开 / 已公开待回填 / 已回填 / 按账号表现 / 按剧表现   6
                                                                  ── 15
仪表盘                                                              0
```

**卡点：应用身份对该 Base 的仪表盘资源没有任何权限。** 实测（直接调 API 对比两种身份）：

| 调用 | 应用身份（tenant token） | 用户身份 |
| --- | --- | --- |
| `GET  /dashboards` | `code=0, count=0`（**不报错，但看不见**） | 正常返回 1 个 |
| `POST /dashboards` | `800004011 no permission to access this base`（`retryable:false`） | 创建成功 |

**手工建仪表盘解决不了问题。** 我用用户身份建了 `短剧发行管理仪表盘`（`blkEtDTg3msqlX97`），
应用身份 `listDashboards` 仍然返回 0 个。所以 `applyPresentation` 的"存在即复用"分支
（`src/migration.mjs:2060`）永远走不到，它会再次尝试创建并再次被拒。

**唯一解法：在飞书开放平台给应用 `cli_aa8edad1a6785bea` 补仪表盘的读写权限。**

补权限后重跑 `finish.sh`，会直接复用已存在的 `blkEtDTg3msqlX97`，把 6 个 block 建完。
若要清掉它：`lark-cli base +dashboard-delete --as user --base-token <base> --dashboard-id blkEtDTg3msqlX97`

**顺带暴露的代码问题（建议排期）**：`listDashboards` 在无权限时返回空列表而非错误，
使 `applyPresentation` 把"没权限看"误判成"还没建"。与今晚另外四处"空 details"同类——
失败被伪装成正常的空状态。

建好仪表盘后重跑（presentation 幂等，同名视图复用，重跑安全）：

```
bash <scratchpad>/resume-run/finish.sh
```

### 3.2 Social Bot —— 链路已验证到最后一步

**飞书聊天 → Bot → terminal → Runner → 响应回群，这条链路是通的。** PM Assistant 真的拉起了
Runner 并回传了它的输出：`{"status":"failed","error":{"code":"session_identity_invalid"}}`。

卡点是一个死结，两个 Bot 各有一半条件：

| | terminal 执行权 | HERMES_SESSION_PROFILE |
| --- | --- | --- |
| Social Bot | ❌ 短剧不在其预授权流程（competitor-analysis / social-pipeline） | ✅ social |
| PM Assistant | ✅ 已证实 | ❌ pm |
| Ops Assistant | ❌ 不在其 SEO 数据流程 | ❌ ops |
| Hermes Bot | — | — （provider 认证失败，Bot 自身故障） |

Runner 硬性要求 `HERMES_SESSION_PROFILE === "social"`（`resolveInvocationIdentity`），
且随后校验 gateway 祖先链必须是 social profile 的。所以只有 Social Bot 能成功，它只差授权。

**解法：由 privileged actor 本人在 `# social assistant` 群里授权 Social Bot 执行短剧 Runner，
或在 Hermes Social profile 配置中正式注册为预授权流程。**

### 3.2b 首次验证话术

在 `# social assistant`（`oc_a4dae18b4ffeedc2877fe21dc58633c7`）里 @Social 发：

```
@Social 我是王志彪，本 Base 的 privileged actor。现在正式授权：
短剧发行管理 Runner（~/gengrowth-ops/inbox-pengman/tools/short-drama-release-manager/shortdrama_ctl.mjs）
纳入你的可执行范围，等同于已预授权流程。

先跑这条只读的验证链路：
cd ~/gengrowth-ops/inbox-pengman/tools/short-drama-release-manager && node shortdrama_ctl.mjs pool list --config "$PWD/shortdrama.runtime.json"

期望 61 条选剧池记录。
```

通了之后试写入（走完整 preview → 确认 → apply）：

```
@Social 用 shortdrama_ctl.mjs 把 SD-000001 的备注改成「链路验证」。
先跑 pool preview-update 拿回执给我看，我确认后你再执行 apply-update。
```

Runner 侧已验证的门禁（真实进程链 + 真实固定配置 + 真实生产 Base）：

- 网关祖先链：真实 pid 63535/63529 喂给 `inspectTrustedSocialInvoker` → ACCEPT
- 读四张表：真实 Base 返回 61 / 11 / 171 / 229
- 写前半程：`pool preview-update`、`pool preview-archive`、`release preview-update` 在真实 Base 生成真实回执（含 `before` 快照，未改任何数据）
- 管理命令对 Social 正确关闭；身份缺失 / profile 错 / 非固定配置路径 → 全部正确拒绝

### 3.3 四个动词的能力对照

| 动词 | 命令 | 状态 |
| --- | --- | --- |
| 填充 / 改 | `pool update-field` / `release update-field`（单字段）、`preview-update` + `apply-update`（预览后应用）、`preview-batch` | 可用 |
| 增 | `pool create`（新剧）、`release schedule`（排期） | sequences 已种子，可用 |
| 删 | **不支持物理删除**。`选剧池` 用 `preview-archive` + `apply-archive`；`发布记录` 改 `归档状态` 字段 | 需与预期对齐 |

`账号台账` 和 `采集数据` 对 Bot 是**只读**（只有 list / get），账号的人工列目前无法从聊天填写。

---

## 4. 未解决的问题

**数据层**

- 76/87 条重叠采集与 10/10 个账号停在 2026-09-04。**根因已修**（见 §2b），但生产 Base 里的既有行不会自愈：跑一次采集器 + 同步可修复其中 87 条。
- 142/229 条采集在 SQLite 里没有对应行，**永远不会被同步刷新**，指标永久冻结在迁移值。
- 13 个剧的 `是否已排期` 人工值在迁移中被静默丢弃（`src/migration.mjs:448` 剔除后由公式取代），Base 内无恢复路径，原值只在 `source_backup.formatted.dramas` 第 5 列。
- 16 条发布记录待人工关联；7 条曾被判为"未来排期"的记录（`2026-09-08`）今天已过期。
- `shirley527146` 是 stub 账号，4 个人工字段为空，其中 `状态` 是必填 single_select。

**代码层（不阻塞，建议排期）**

- `verifyMigration` 的 `details.source_union_verified` / `pending_release_warnings_verified` 是硬编码字面量；它证明的是"manifest 等于自己嵌入的快照"，不是"等于实时表格"。命名误导。
- `verificationDigest` 不含 `generated_at`，`assertVerificationProof` 没有时效上限。
- 写入重试没有幂等令牌，429/auth 重试在提交后重放理论上可产生重复行。

**顺带发现的运维问题（与短剧无关，但你可能不知道）**

- Hermes Bot（`cli_a909cb3dacf89cb3`）回复 `Provider authentication failed. Check the configured credentials` —— 它的 LLM provider 认证失败，连不上模型。
- PM Assistant 会话 24 小时不活动自动重置（`gpt-5.6-terra` / `openai-codex`）。

**已知架构限制（本次接受的前提）**

- Base v3 无跨表快照、无 CAS，门禁读取与写入之间的时间窗关不掉；所有写操作须在受控维护窗口内执行。
- `采集数据` 229 行分两批写入，批间无原子性。
- `shortdrama_ctl.mjs:1569` 对每个 phase 都无条件调 `readGoogle()`，presentation / sequences 也需要 Google 凭据可用。

---

## 5. 若最终要用最新数据重跑

Base 非空时 `migrate plan` 会 blocked（`base_not_empty`），所以重跑必须先**在 Base UI 手工清空四张表**（系统不提供业务数据删除）。清空后全套证据链要重做：manifest → schema receipt → canary receipt → permission attestation（需人工在 UI 读回）→ data → verify → presentation → sequences。

序列种子是 `MAX(last_value, excluded)` 单调不减，重跑不会重用 ID，只会留号段空洞。

新 manifest 会带 `policy = shortdrama-source-reconciliation/v2`，即按 `snapshot_date` 取新。
所以**重跑前先跑一次采集器**：只要 SQLite 追平或超过人工表，两源一致，不会出现 §2b 的回退；
若采集器仍落后，Google 侧的较新值会胜出并在 manifest 的 `warnings` 里逐条列出
`stale_sqlite_snapshot`（带两个日期）——plan 之后先看这批警告再决定要不要继续。

注意 142 条只存在于 Google、SQLite 里没有对应行的采集，无论怎么重跑都不会被后续同步刷新。
