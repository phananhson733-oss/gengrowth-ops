# 短剧发行管理平台 — 交接状态（2026-09-08）

代码：`main` @ `de0aa874`，568/568 测试通过，`npm run check` / `node --check` / `plutil -lint` / `diff --check` 全绿。
本轮改动：12 个 commit，1021 insertions / 113 deletions，10 个文件。

---

## 1. 落地进度

| 阶段 | 状态 | 证据 |
| --- | --- | --- |
| schema | ✅ 早前完成 | `schema-receipt-20260907-185244.json` |
| canary | ✅ 早前完成 | `canary-receipt-20260907-185520.json`（**一次性，不可再生**） |
| **data** | ✅ 完成并核验 | 472 行；`migrate verify` = `verified`；语义摘要 `b8d7ccc8…` |
| **sequences** | ✅ 完成 | `doctor: ready`，`drama_next=SD-000062` / `release_next=SR-000172` |
| **presentation** | ❌ 未完成 | 现卡在一个 Base API 调用：`base_request_failed`，HTTP 200 + vendor code 1 |
| Social Bot 端到端 | ❌ 从未执行 | ops 库 `jobs` 表 0 行 |
| 七天验收 | ❌ 未开始 | 第一天尚未发生 |

生产 Base 现有：`账号台账` 11 / `选剧池` 61 / `采集数据` 229 / `发布记录` 171 = 472 行，引用完整性零悬空。

---

## 2. 本轮修复的 12 个缺陷

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

---

## 3. 下一步（只能在 Ghostty 里执行）

**硬性前提**：必须 Ghostty，不能 Terminal.app（`login -pf` 形态不匹配白名单）；不要再跑 `doctor --canary`。

### 3.1 presentation

```
bash <scratchpad>/resume-run/finish.sh
```

上次失败：`{"code":"base_request_failed","details":{"code":1,"status":200,"attempts":1,"path":"[redacted]"}}`

`de0aa874` 之后 `path` 不再被抹掉，会显示形如 `open-apis/base/v3/bases/[redacted]/dashboards/[redacted]/blocks` 的路由，据此定位是哪个调用。

已提前体检：**15 个视图配置在 vendor 回显形状下全部可解码**，所以剩下的问题不在过滤器解码，而在某个 API 调用本身。

presentation 是幂等的（同名视图复用，不重复创建），重跑安全。

### 3.2 Social Bot 首次验证

在飞书里对 Social Bot 发 `pool list`。

本地已验证的门禁（用真实进程链 + 真实固定配置）：

- 网关祖先链：真实 pid 喂给 `inspectTrustedSocialInvoker` → ACCEPT
- 5 个读命令 + 5 个写命令（含 payload heredoc）→ 全部走到"连飞书前一步"
- 管理命令对 Social 正确关闭；身份缺失 / profile 错 / 非固定配置路径 → 全部正确拒绝

未验证的只剩真实网络调用。

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

- 76/87 条重叠采集与 10/10 个账号停在 2026-09-04：`reconcileCaptureSources` 把 Google 当 `historical`、SQLite 当 `latest` 无条件覆盖，而采集器停在 9/4、人工表更新到 9/7。净丢弃 10,124 次播放、802 个粉丝。跑一次采集器 + 同步可自愈其中 87 条。
- 142/229 条采集在 SQLite 里没有对应行，**永远不会被同步刷新**，指标永久冻结在迁移值。
- 13 个剧的 `是否已排期` 人工值在迁移中被静默丢弃（`src/migration.mjs:448` 剔除后由公式取代），Base 内无恢复路径，原值只在 `source_backup.formatted.dramas` 第 5 列。
- 16 条发布记录待人工关联；7 条曾被判为"未来排期"的记录（`2026-09-08`）今天已过期。
- `shirley527146` 是 stub 账号，4 个人工字段为空，其中 `状态` 是必填 single_select。

**代码层（不阻塞，建议排期）**

- `reconcileCaptureSources` / `reconcileAccounts` 应按 `snapshot_date` 取新，并在 Google 胜出时告警；目前没有任何测试覆盖两源日期分歧。
- `verifyMigration` 的 `details.source_union_verified` / `pending_release_warnings_verified` 是硬编码字面量；它证明的是"manifest 等于自己嵌入的快照"，不是"等于实时表格"。命名误导。
- `verificationDigest` 不含 `generated_at`，`assertVerificationProof` 没有时效上限。
- 写入重试没有幂等令牌，429/auth 重试在提交后重放理论上可产生重复行。

**已知架构限制（本次接受的前提）**

- Base v3 无跨表快照、无 CAS，门禁读取与写入之间的时间窗关不掉；所有写操作须在受控维护窗口内执行。
- `采集数据` 229 行分两批写入，批间无原子性。
- `shortdrama_ctl.mjs:1569` 对每个 phase 都无条件调 `readGoogle()`，presentation / sequences 也需要 Google 凭据可用。

---

## 5. 若最终要用最新数据重跑

Base 非空时 `migrate plan` 会 blocked（`base_not_empty`），所以重跑必须先**在 Base UI 手工清空四张表**（系统不提供业务数据删除）。清空后全套证据链要重做：manifest → schema receipt → canary receipt → permission attestation（需人工在 UI 读回）→ data → verify → presentation → sequences。

序列种子是 `MAX(last_value, excluded)` 单调不减，重跑不会重用 ID，只会留号段空洞。
