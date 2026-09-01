# `shortdrama_ctl.mjs` 是短剧发行管理 v5 唯一新生产入口

`sync_shortdrama_to_feishu.mjs` 与 `com.gengrowth.shortdrama-feishu-sync` 均为 **historical/disabled** 证据：保留、不删除、不运行，也不是 v5 或回滚入口。v5 只使用 `shortdrama_ctl.mjs`、`run_scheduled.sh` 和新 label `com.gengrowth.shortdrama-sync`。

## 数据边界与 source of truth

- Google 的账号台账、发布记录、选剧池三个人工 source sheet 只用于一次性 read-only migration；切换后不再作为人工入口，并且始终 **no Google writeback**。
- 本地 SQLite 是账号和帖子机器源。Base `采集数据`只投影按 `Post ID` 去重的 latest 帖子及最新指标；每日采集历史 stays in SQLite，不向 Base 追加日快照。
- 公司持有的 Feishu Base 是正式业务载体，固定四表：`账号台账`、`发布记录`、`选剧池`、`采集数据`。
- 字段所有权不可混用：human 字段只接受实名 allowlist 的 Social 操作；machine 字段只由同步写；derived 字段由 Base 公式/Lookup 计算。**Runner only writes**，不得由 Skill、脚本或人工绕过 Runner 直接调用 Base 写接口。
- 旧 Google 业务表、历史脚本、历史 plist 和试验 Base 都只保留为证据；旧的 TikTok Daily Metrics 及既有 Social OS 流程不变。

## 固定运行资产

- Node：目标机 doctor 验证过的 **Node 24+**。
- 正式配置文件名：`shortdrama.runtime.json`；从 `shortdrama.config.example.json`复制后仅在生产机安全配置，禁止提交。
- 凭证文件：配置中的相对路径`paths.env_file`，正式指向未提交的本地`.env`；Google service-account JSON 同样只允许当前用户持有的 0600 有界普通文件，拒绝文件/父目录 symlink、未知字段、非 service-account 邮箱/私钥以及非 allowlist HTTPS token URI。launchd/plist/argv只携带 config 与 capability 路径，不携带 secret。
- Job/Audit state DB：配置中的 `ops_sqlite`，正式约定为 `inbox-pengman/output/short-drama-release-manager/shortdrama_ops.sqlite`。
- payload 根目录：配置中的 `payload_root`；Social 写操作的 JSON payload heredoc 由 **Hermes Skill** 通过 stdin (`--payload -`) 提供，不在聊天里拼 shell。
- migration artifact 固定根目录：`inbox-pengman/output/short-drama-release-manager/migrations/`。文件名必须为该目录内不可覆盖的安全 JSON 文件名。
- launchd 内部 capability：当前用户 Application Support 下 `GenGrowth/shortdrama-sync/internal.capability`，0600、非 symlink、256-bit；值不得进入日志、聊天、plist 或 Git。
- 新 launchd label：`com.gengrowth.shortdrama-sync`，每 300 秒运行 ticker；历史 label 不得安装、kickstart 或用于回滚。

以下示例均从本目录运行：

```bash
export RUNTIME_CONFIG="$PWD/shortdrama.runtime.json"
export EXPECTED_BASE_TOKEN="<动作时从正式 Base URL/资源信息独立核对的 token>"
node shortdrama_ctl.mjs doctor --config "$RUNTIME_CONFIG" --expected-base-token "$EXPECTED_BASE_TOKEN" --actor-id "$PRIVILEGED_ACTOR_ID"
```

## Public commands

普通查询和业务操作由 Feishu Social 会话调用。`HERMES_SESSION_*` actor/chat 由 gateway 注入；不得用`--actor-id`或`--chat-id`冒充。Runner 自身拒绝任何 Feishu Social 会话调用 doctor、migration、permission helper、schedule 或 queue。所有本地 doctor/migrate 管理命令只能由用户在独立 macOS Terminal/iTerm/WezTerm/kitty/Ghostty 真实 TTY 中直接执行；Runner 的有界进程检查是纯正向 allowlist：当前 Node 后只能出现固定 shell，随后必须到达已知 GUI Terminal 锚点并终止于 launchd/root。未知 Python/Node wrapper、IDE、Hermes gateway/run_agent、TUI/desktop backend、Codex task 或来源未知的间接 shell 即使清空全部`HERMES_*`变量也会被拒绝。Task 12/13 的管理员命令必须由用户动作时确认后亲自在独立 Terminal 执行，不能由 Social Bot/Codex 代跑。除 doctor 与迁移外，下面省略的 payload 内容都由 Hermes Skill 的严格 heredoc 生成。

### Doctor 与迁移

```bash
# 只读 doctor
node shortdrama_ctl.mjs doctor --config "$RUNTIME_CONFIG" --expected-base-token "$EXPECTED_BASE_TOKEN" --actor-id "$PRIVILEGED_ACTOR_ID"

# 首次初始化本地 state DB：local-only + privileged + 动作时确认
node shortdrama_ctl.mjs doctor --init-state --config "$RUNTIME_CONFIG" --actor-id "$PRIVILEGED_ACTOR_ID"

# Schema 完成后的四表 canary：privileged + 动作时确认
node shortdrama_ctl.mjs doctor --canary --config "$RUNTIME_CONFIG" \
  --manifest "$PLAN_FILE" --expected-sha256 "$MIGRATION_SHA256" \
  --expected-base-token "$EXPECTED_BASE_TOKEN" --output "$CANARY_RECEIPT_FILE" \
  --actor-id "$PRIVILEGED_ACTOR_ID"

# 只读 migration plan
node shortdrama_ctl.mjs migrate plan --config "$RUNTIME_CONFIG" \
  --expected-base-token "$EXPECTED_BASE_TOKEN" --output "$PLAN_FILE" --actor-id "$PRIVILEGED_ACTOR_ID"

# privileged apply；每次均需动作时确认、manifest digest 和对应 receipt 链
node shortdrama_ctl.mjs migrate apply --phase schema --config "$RUNTIME_CONFIG" \
  --manifest "$PLAN_FILE" --expected-sha256 "$MIGRATION_SHA256" \
  --expected-base-token "$EXPECTED_BASE_TOKEN" \
  --output "$SCHEMA_RECEIPT_FILE" --confirm apply-now --actor-id "$PRIVILEGED_ACTOR_ID"
node shortdrama_ctl.mjs migrate apply --phase data --config "$RUNTIME_CONFIG" \
  --manifest "$PLAN_FILE" --expected-sha256 "$MIGRATION_SHA256" \
  --schema-receipt "$SCHEMA_RECEIPT_FILE" \
  --expected-schema-receipt-sha256 "$SCHEMA_RECEIPT_SHA256" \
  --canary-receipt "$CANARY_RECEIPT_FILE" --expected-canary-sha256 "$CANARY_RECEIPT_SHA256" \
  --permission-attestation "$PERMISSION_ATTESTATION_FILE" \
  --expected-permission-attestation-sha256 "$PERMISSION_ATTESTATION_SHA256" \
  --expected-permission-attestation-file-sha256 "$PERMISSION_ATTESTATION_FILE_SHA256" \
  --expected-base-token "$EXPECTED_BASE_TOKEN" \
  --confirm apply-now --actor-id "$PRIVILEGED_ACTOR_ID"
node shortdrama_ctl.mjs migrate apply --phase presentation --config "$RUNTIME_CONFIG" \
  --manifest "$PLAN_FILE" --expected-sha256 "$MIGRATION_SHA256" \
  --schema-receipt "$SCHEMA_RECEIPT_FILE" \
  --expected-schema-receipt-sha256 "$SCHEMA_RECEIPT_SHA256" \
  --canary-receipt "$CANARY_RECEIPT_FILE" --expected-canary-sha256 "$CANARY_RECEIPT_SHA256" \
  --expected-base-token "$EXPECTED_BASE_TOKEN" \
  --confirm apply-now --actor-id "$PRIVILEGED_ACTOR_ID"
node shortdrama_ctl.mjs migrate verify --config "$RUNTIME_CONFIG" \
  --manifest "$PLAN_FILE" --output "$VERIFICATION_FILE" \
  --expected-base-token "$EXPECTED_BASE_TOKEN" --actor-id "$PRIVILEGED_ACTOR_ID"
node shortdrama_ctl.mjs migrate apply --phase sequences --config "$RUNTIME_CONFIG" \
  --manifest "$PLAN_FILE" --expected-sha256 "$MIGRATION_SHA256" \
  --schema-receipt "$SCHEMA_RECEIPT_FILE" \
  --expected-schema-receipt-sha256 "$SCHEMA_RECEIPT_SHA256" \
  --canary-receipt "$CANARY_RECEIPT_FILE" --expected-canary-sha256 "$CANARY_RECEIPT_SHA256" \
  --expected-base-token "$EXPECTED_BASE_TOKEN" \
  --verification "$VERIFICATION_FILE" \
  --expected-verification-sha256 "$VERIFICATION_SHA256" \
  --confirm apply-now --actor-id "$PRIVILEGED_ACTOR_ID"
```

正式 Base 必须先由公司用户在 UI 或动作时确认后的 **lark-cli v1.0.91** 中创建四张空表，名称精确为`账号台账 / 选剧池 / 采集数据 / 发布记录`，再把返回 `.data.id` 的真实 table ID 写入本地 env。Base 中不能残留第五张默认/未绑定表；Runner 不动态建表。任一绑定缺失会在写前返回`base_table_missing + next_step=create_four_empty_tables_and_bind_ids`，任一额外表返回 schema drift。Task 12 给出重命名默认首表、创建其余三表、精确四表/total=0 读回与 env 绑定的可执行命令。`migrate plan`只读 Google/SQLite/Base 元数据并写不可覆盖的计划证据，不写业务数据。doctor（除 init-state）、plan/apply/verify/canary 每次还必须用独立取得的`--expected-base-token`与配置做常量时间核对；manifest 和后续 receipt 都绑定非敏感 Base SHA-256。

首次 plan 还要求四张正式表的完整 record count 与 key-set 均证明为空；任一表非空、count 缺失或空集合证据缺失时返回`base_not_empty`且不产生可执行 schema/data action。manifest 和 canary 都绑定四表空集合证据，data 第一笔写入前再完整读取并比对，防止 plan/canary 后被提前写入。

`doctor --init-state`、`doctor --canary`、所有`migrate apply`、launchd install，以及首次迁移/部署产生的 live Base write，都必须在动作发生时由 privileged 操作者再次确认；切换后的日常人工业务写仍按 Social operator/privileged 字段权限和 preview/apply 契约执行。data/presentation/sequences 需要独立 manifest、schema receipt 和同 Base canary receipt；sequences 还需要 verification 文件字节 digest。data 另需公司用户通过 Base UI/`lark-cli`读回后形成显式 observations 文件，再用下方离线固定命令生成 permission attestation。Runner 只验证外部观察的结构、Base/schema/actor 绑定和 24 小时新鲜度，不宣称能独立验证 UI 字段保护。schema receipt 丢失或无法证明时必须停止，返回/遵循`replan_reconfirm`，重新 plan、重新确认，禁止猜测或补写 receipt。

```bash
export OBSERVATIONS_FILE="permission-observations-$(date +%Y%m%d-%H%M%S).json"
# 公司用户先在 UI/lark-cli 逐项读回；确认后生成 exact observations JSON。
umask 077
jq -n --arg actor "$PRIVILEGED_ACTOR_ID" --arg checked_at "$(date -u +%Y-%m-%dT%H:%M:%S.000Z)" \
  '{version:"shortdrama-permission-observations/v1",observed_via:"lark-cli-user-readback",advanced_permissions_enabled:true,primary_and_machine_fields_protected:true,company_user_access_verified:true,checked_by:$actor,checked_at:$checked_at}' \
  > "$MIGRATION_ROOT/$OBSERVATIONS_FILE"
export OBSERVATIONS_FILE_SHA256="$(shasum -a 256 "$MIGRATION_ROOT/$OBSERVATIONS_FILE" | awk '{print $1}')"
export PERMISSION_ATTESTATION_FILE="permission-attestation-$(date +%Y%m%d-%H%M%S).json"
node shortdrama_ctl.mjs migrate attest-permissions --config "$RUNTIME_CONFIG" \
  --manifest "$PLAN_FILE" --expected-sha256 "$MIGRATION_SHA256" \
  --schema-receipt "$SCHEMA_RECEIPT_FILE" --expected-schema-receipt-sha256 "$SCHEMA_RECEIPT_SHA256" \
  --observations "$OBSERVATIONS_FILE" --expected-observations-file-sha256 "$OBSERVATIONS_FILE_SHA256" \
  --output "$PERMISSION_ATTESTATION_FILE" --expected-base-token "$EXPECTED_BASE_TOKEN" --actor-id "$PRIVILEGED_ACTOR_ID"
export PERMISSION_ATTESTATION_SHA256="$(jq -er '.sha256' "$MIGRATION_ROOT/$PERMISSION_ATTESTATION_FILE")"
export PERMISSION_ATTESTATION_FILE_SHA256="$(shasum -a 256 "$MIGRATION_ROOT/$PERMISSION_ATTESTATION_FILE" | awk '{print $1}')"
# stdout 同时显示 artifact_file、semantic_sha256、file_sha256；不得重定向，否则会失去管理员 TTY 证明。
```

canary 是唯一允许物理清理的 **canary-only** 路径：在动作时确认的维护窗口内，只删除本次固定 canary record ID，并为四表记录 create/read/delete、前后 count 和 key-set hash，输出绑定 manifest/Base/table IDs/schema revision 的不可覆盖 receipt。Base API 没有为该删除提供 CAS；GET→delete 仍有并发窗口，因此 receipt 证明的是受控维护窗口与最终集合恢复，不是原子 CAS。业务路径不做物理删除；归档是逻辑状态变化，任何`canary_cleanup_failed`都按`manual_repair`停止。

### 四表读取与人工维护

```bash
node shortdrama_ctl.mjs account list --config "$RUNTIME_CONFIG"
node shortdrama_ctl.mjs account get --key "$ACCOUNT_ID" --config "$RUNTIME_CONFIG"
node shortdrama_ctl.mjs capture list --config "$RUNTIME_CONFIG"
node shortdrama_ctl.mjs capture get --key "$POST_ID" --config "$RUNTIME_CONFIG"

node shortdrama_ctl.mjs pool list --config "$RUNTIME_CONFIG" --payload -
node shortdrama_ctl.mjs pool get --key "$DRAMA_ID" --config "$RUNTIME_CONFIG" --payload -
node shortdrama_ctl.mjs pool create --config "$RUNTIME_CONFIG" --payload -
node shortdrama_ctl.mjs pool update-field --config "$RUNTIME_CONFIG" --payload -
node shortdrama_ctl.mjs pool preview-update --config "$RUNTIME_CONFIG" --payload -
node shortdrama_ctl.mjs pool preview-batch --config "$RUNTIME_CONFIG" --payload -
node shortdrama_ctl.mjs pool apply-update --config "$RUNTIME_CONFIG" --payload -
node shortdrama_ctl.mjs pool preview-archive --key "$DRAMA_ID" --config "$RUNTIME_CONFIG" --payload -
node shortdrama_ctl.mjs pool apply-archive --config "$RUNTIME_CONFIG" --payload -

node shortdrama_ctl.mjs release list --config "$RUNTIME_CONFIG" --payload -
node shortdrama_ctl.mjs release get --key "$RELEASE_ID" --config "$RUNTIME_CONFIG" --payload -
node shortdrama_ctl.mjs release schedule --config "$RUNTIME_CONFIG" --payload -
node shortdrama_ctl.mjs release update-field --config "$RUNTIME_CONFIG" --payload -
node shortdrama_ctl.mjs release preview-update --config "$RUNTIME_CONFIG" --payload -
node shortdrama_ctl.mjs release preview-batch --config "$RUNTIME_CONFIG" --payload -
node shortdrama_ctl.mjs release apply-update --config "$RUNTIME_CONFIG" --payload -
node shortdrama_ctl.mjs release attach-post --config "$RUNTIME_CONFIG" --payload -

node shortdrama_ctl.mjs metrics by-drama --config "$RUNTIME_CONFIG"
node shortdrama_ctl.mjs metrics by-account --config "$RUNTIME_CONFIG"
```

四个`list|get`族都返回统一的`table + rows/record + readback=complete + source=base_complete_index`，缺失精确返回`not_found`。`pool/release update-field`只接受精确`{key,field,value}`；`preview-batch`只接受精确`{items:[{key,patch},...]}`并固定 action/table/actor/chat，继续用`apply-update`的 receipt 落地；多字段/归档必须先 preview，再用 receipt apply，apply 结果回传被消费的`receipt_id`。`account/capture`严格只读。固定 select 字段的 options 属于 schema descriptor 并在每次 readiness/write 重验，匹配方式只允许`exact_post_id / manual_url / account_time`，不得写内部占位值`existing_relation`。所有成功写入必须有 write-after-readback；不完整分页、字段漂移或并发人工变化不能解释为成功或有效零。

每个普通 Base 查询/人工 mutation、`sync start`入队和 worker Collector/Base 副作用前都在该次 CLI 进程内重新读取并验证四表绑定和完整字段 descriptor，不跨进程缓存 doctor 结果。任一 schema drift/missing 均在业务副作用前失败。`Post ID`在全部发布记录中全局唯一，archived 记录同样保留 claim；同步不会写 archived，但会在 active inference 前预留其 Post。

### 异步同步

```bash
node shortdrama_ctl.mjs sync start --config "$RUNTIME_CONFIG"
node shortdrama_ctl.mjs sync status --run-id "$RUN_ID" --config "$RUNTIME_CONFIG"
```

- 新任务立即返回 `state=queued` 和 `run_id`；这只证明已持久化入队。
- 若已有 queued/running 任务，返回 `state=already_running` 和现有 `run_id`，不会启动第二轮。
- launchctl wakeup 失败时任务仍保持 queued，并返回 `worker_wakeup_failed`；300 秒 ticker 可继续领取。wakeup 或进程启动都不是同步成功。
- `started` 不等于成功。只有持久化的 `success|partial|failed`、步骤、计数、读回与错误摘要才是 terminal truth。
- `manual_repair` 必须明确转述并停止自动补写。数据 terminal 不因消息重试而改变。
- terminal dashboard 更新先读取当前完成时间；旧任务的通知重试仍可发送消息，但不得覆盖更新任务已经展示的终态。Base block GET→PATCH 没有 CAS，维护窗口内的并发残余不能描述成原子保护。
- 账号源成功的`complete`只映射为账号台账`同步状态=success`；采集不完整写`partial`。无法从 Collector 安全归因到单个账号的 failure 只进入 Job/错误摘要，不伪造账号行`failed`；所有实际写入值都属于 schema 单选枚举。
- 手动任务的 terminal 通知只发送到持久化的原始请求会话；调度健康通知只发到配置且 allowlisted 的 Ops chat，用户不能指定任意 chat。

## Internal commands

下列命令只供已安装的 launchd capability 调用，拒绝 Social/local actor 参数，不是人工运维入口：

```bash
node shortdrama_ctl.mjs schedule tick --config "$RUNTIME_CONFIG"
node shortdrama_ctl.mjs queue drain --config "$RUNTIME_CONFIG"
node shortdrama_ctl.mjs schedule health --config "$RUNTIME_CONFIG"
```

`schedule tick`只在北京时间 **08:00–08:09** 幂等入队当天任务；`queue drain`凭 SQLite lease 领取最多一项；`schedule health`在北京时间 **10:00** 后对当天缺少 success/partial terminal 的情况向固定 Ops chat 去重告警。安装命令是`./install_launchd.sh "$RUNTIME_CONFIG" "$EXPECTED_BASE_TOKEN" "$PRIVILEGED_ACTOR_ID"`；installer 继承用户 Terminal TTY运行 doctor，不用 command substitution 绕过来源证明。只有 doctor ready、生产动作时确认、备份和 readback 条件全部满足后才能执行。

验收必须观察至少一次真实北京时间 08:00 的**自然调度**，并记录 schedule run_id、Collector terminal、Base readback 和通知。手工 `sync start`、launchctl kickstart、服务 loaded 或进程存活不能替代自然调度证据。切换验收还要求**连续七天**全绿；失败后从新的连续成功日重新计数，不能拼接非连续日期。

## 环境变量契约

真实值只进入未提交的安全环境；`.env.example`仅列空 key。每次 launchd/manual CLI 都先读取 runtime JSON 的`paths.env_file`，从 config 起始目录开始逐级检查每个父目录和每个`..`跳转，再以`O_NOFOLLOW`单次打开该 0600（或同等无 group/other 权限）的普通文件；任何缺失、symlink/parent symlink、权限过宽、超限、重复或 malformed dotenv 都在网络前`config_invalid`。

dotenv 仅按严格`KEY=value`数据解析，绝不 shell source/eval/expand，也不执行变量、反引号或命令替换。Runner 只导入 runtime config 明确引用的下列 key 加固定`SHORTDRAMA_OPS_CHAT_ID`；其他 collector/legacy/任意 key 即使出现在共享`.env`也不会进入 Runner env。调用进程显式提供的同名值优先于文件值，供受控诊断覆盖；空覆盖仍按配置校验失败，不静默回退。

Base Adapter 固定按 lark-cli v1.0.91 vendor contract 解码：record list/batch_get 使用 matrix，批量创建为`create_records`，批量更新为`update_records`映射；select 使用数组 cell，datetime 在`Asia/Shanghai`原始值与严格 ISO/date-only canonical value 间转换，link 只接受精确`[{id}]`。`ignored_fields`、不完整 query context/分页或 field type 漂移都不能返回 complete；写响应缺少 record ID 时只以完整索引读回证明成功。

`shortdrama.runtime.json`选择的固定 key 名为：

```text
FEISHU_APP_ID
FEISHU_APP_SECRET
FEISHU_SHORTDRAMA_APP_TOKEN
FEISHU_SHORTDRAMA_ACCOUNTS_TABLE_ID
FEISHU_SHORTDRAMA_POOL_TABLE_ID
FEISHU_SHORTDRAMA_CAPTURES_TABLE_ID
FEISHU_SHORTDRAMA_RELEASES_TABLE_ID
GOOGLE_SERVICE_ACCOUNT_JSON
SHORTDRAMA_OPERATOR_IDS
SHORTDRAMA_PRIVILEGED_IDS
SHORTDRAMA_NOTIFICATION_CHAT_IDS
SHORTDRAMA_OPS_CHAT_ID
```

actor/chat allowlist 使用逗号分隔 ID；`SHORTDRAMA_OPS_CHAT_ID`必须同时属于 `SHORTDRAMA_NOTIFICATION_CHAT_IDS`。app secret、token、授权头、真实 table/base ID、actor/chat ID、凭证路径不得写入 Git、日志、审计正文或聊天回复。

迁移 artifact 目录必须由当前用户持有并保持 0700，文件用 0600、`O_EXCL|O_NOFOLLOW`不可覆盖写入并做 inode/hash 读回。Node 当前没有 dirfd/openat 路径绑定能力，因此目录检查到 pathname open 之间仍存在极小的同用户本地 TOCTOU 残余；这不是原子 openat 保证，正式操作需保持目标机同用户会话受控。

## 单写者切换、恢复与回滚

1. 切换前备份旧采集机的 SQLite、凭证、launchd 定义和最近 terminal，记录 checksum/readback；正式 Base 与 Google 也保留不可变迁移证据。
2. 先暂停旧采集机写入口并证明它已停止，再启用 Mac mini 的新 Collector/Runner。任何时刻只能有一个 writer；禁止两台主机重叠运行。
3. 安装器会备份新 label 的既有 plist；安装失败按原 loaded 状态恢复并 read back。若出现 `rollback_verification_failed`，保持停止并人工修复，不能声称恢复完成。
4. 观察期故障时暂停新 Runner/launchd 写入，导出并保存 Base 人工变化和 Job/Audit，再按审计恢复旧入口。保留 Base、SQLite、旧 Google、plist、脚本及错误证据，不删除、不清空。
5. 连续七天验收通过后，旧 Google 三张人工业务表仅 archived/read-only；TikTok Daily Metrics 继续保留。

任何无法证明 schema、receipt、readback、单写者状态或回滚结果的情况都 fail closed，并转入 `manual_repair`。
