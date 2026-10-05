# `shortdrama_ctl.mjs` 是短剧发行管理 v5 唯一新生产入口

`sync_shortdrama_to_feishu.mjs` 与 `com.gengrowth.shortdrama-feishu-sync` 均为 **historical/disabled** 证据：保留、不删除、不运行，也不是 v5 或回滚入口。v5 只使用 `shortdrama_ctl.mjs`、`run_scheduled.sh` 和新 label `com.gengrowth.shortdrama-sync`。

## 数据边界与 source of truth

- Google 的账号台账、发布记录、选剧池三个人工 source sheet 只用于一次性 read-only migration；切换后不再作为人工入口，并且始终 **no Google writeback**。
- 本地 SQLite 是账号和帖子机器源。Base `采集数据`只投影按 `Post ID` 去重的 latest 帖子及最新指标；每日采集历史 stays in SQLite，不向 Base 追加日快照。
- 公司持有的 Feishu Base 是正式业务载体，固定四表：`账号台账`、`发布记录`、`选剧池`、`采集数据`。
- 自动化仍遵守 **Runner only writes** 和字段所有权：Social 命令受实名 allowlist 限制，采集同步只更新 machine 字段，derived 字段由 Base 公式/Lookup 计算。北斗选剧补资料是独立的受限例外，只在剧名唯一精确对应或同事于 Base 选定候选后，对空白的选剧池业务字段执行 Runner 写入并读回；不覆盖人工已有值与 `来源`。公司成员可按 2026-09-09 的授权直接在 Base UI 编辑；Skill 和其他自动化仍不得绕过 Runner 写 Base。
- `manifest_append` allowlist 仅限：账号台账.所属组、账号台账.表现形式、选剧池.剧分类、选剧池.生命周期、选剧池.RS Boost 分类（待确认）、选剧池.账号组、选剧池.语言、选剧池.来源；这些字段仅由 migration manifest 的实际数据追加，不把当前派生词表固化为永久 enum。选剧池.平台和选剧池.推荐人是固定闭集；MoboReels → 其他仅用于迁移；其他未知平台必须 blocked；record write 不隐式创建 options。
- 2026-09-09 起按管理员要求，组织内获得链接的成员可直接编辑四张表；Social Bot 继续提供受审计的业务命令。机器指标会由日常采集刷新，公式/Lookup 仍由飞书计算。每次 data apply 必须验证新鲜且绑定相同 manifest/Base/schema 的 schema receipt，并完成 data preflight；schema partial failure 必须 replan_reconfirm，不回滚；migration-plan-20260907-110158.json、schema-receipt-20260907-110617.json、canary-receipt-20260907-111102.json、permission-observations-20260907-112253.json 和 permission-attestation-20260907-112253.json 已过时且不可复用。
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

## 北斗选剧池补资料（2026-09-23）

资料仅来自北斗 MCP 的 `get_api_fb_task_page`。同事在飞书 `选剧池` 新行只填`剧名`；Runner 的既有 `queue drain` 每 300 秒最多处理 5 条启用时刻之后创建的记录，完整翻页查询北斗。只有全量候选中唯一精确剧名才自动选定；多条同名或仅模糊命中会写入`北斗候选`，由同事在同一行的`北斗选定ID`填入候选文字中的完整 ID，下一轮再补资料。查不到显示`北斗未找到候选`。旧记录不在默认扫描范围内。

运营通过 Social Bot 只问“查剧资料”时，固定 Runner 的 `pool beidou-search --payload -`（固定 heredoc JSON：`{"title":"完整剧名"}`）可在自动回填仍关闭时只读返回北斗完整候选数与至多 20 条展示结果、平台/语言/上线日期、集数/免费边界和有界简介；它不写 Base、不上传网站。Bot 须把“查到了资料”和“已写入飞书”分开，官网补充资料须另标来源。无候选是有效零；接口失败不是零。

程序只补空的`平台`、`语言`、`剧分类`、`上线日期`；`publish_at`按用户确认直接取前 10 位合法日历日期。平台、语言、分类只使用现场 Base 已有选项，未知值留空，不把未知剧场写成“其他”；`来源`、`剧名`、既有人工作值、已经处理后又被人工清空的值均不覆盖。`剧ID`仍是 Base 内部编号，`北斗选定ID`仅是外部候选键。选剧池只有两个额外文本字段：`北斗候选`由 Runner 写，`北斗选定ID`供同事选择；没有新的业务表。

这两个字段必须通过固定 Runner 的本地管理命令一次性建立。先在**独立的 macOS Terminal**中用已独立核对的 Base token 和真实 privileged actor 执行只读计划；检查 `create` 恰为这两列后，再用该计划返回的 `sha256` 执行受限 apply。Runner 拒绝 Codex/IDE/Social 代理此管理命令；超时或部分成功时重新读字段并重新计划，不盲目重发。

```bash
node shortdrama_ctl.mjs doctor --beidou-fields --config "$RUNTIME_CONFIG" --expected-base-token "$EXPECTED_BASE_TOKEN" --actor-id "$PRIVILEGED_ACTOR_ID"
node shortdrama_ctl.mjs doctor --beidou-fields --config "$RUNTIME_CONFIG" --expected-base-token "$EXPECTED_BASE_TOKEN" --actor-id "$PRIVILEGED_ACTOR_ID" --expected-sha256 "$PLAN_SHA256" --confirm apply-now
```

字段读回后，在配置的私有 0600 `.env` 中设置 `BEIDOU_API_KEY`；密钥不进 JSON、Git、命令参数或日志。将 `shortdrama.runtime.json` 的 `beidou` 设为 `{"enabled":true,"start_at":"<启用时刻的 UTC ISO>"}`，再按原有方式验证 `queue drain` 和 Base 读回。缺密钥或未启用时工作器不运行，字段尚未建立时返回 `schema_missing` 且不写 Base。源接口目前未公布频率限制，本轮固定最多 5 条新行/5 分钟；北斗查询错误与“查无结果”分开，不制造零候选。

以下示例均从本目录运行：

```bash
export RUNTIME_CONFIG="$PWD/shortdrama.runtime.json"
export EXPECTED_BASE_TOKEN="<动作时从正式 Base URL/资源信息独立核对的 token>"
node shortdrama_ctl.mjs doctor --config "$RUNTIME_CONFIG" --expected-base-token "$EXPECTED_BASE_TOKEN" --actor-id "$PRIVILEGED_ACTOR_ID"
```

## Public commands

普通查询和业务操作由 Feishu Social 会话调用。`HERMES_SESSION_*` actor/chat 由 gateway 注入；不得用`--actor-id`或`--chat-id`冒充。Runner 自身拒绝任何 Feishu Social 会话调用 doctor、migration、permission helper、schedule 或 queue。所有本地 doctor/migrate 管理命令只能由用户在独立 macOS Terminal/iTerm/WezTerm/kitty/Ghostty 真实 TTY 中直接执行；Runner 的有界进程检查是纯正向 allowlist：当前 Node 后只能出现固定 shell，随后必须到达已知 GUI Terminal 锚点并终止于 launchd/root。未知 Python/Node wrapper、IDE、Hermes gateway/run_agent、TUI/desktop backend、Codex task 或来源未知的间接 shell 即使清空全部`HERMES_*`变量也会被拒绝。Task 12/13 的管理员命令必须由用户动作时确认后亲自在独立 Terminal 执行，不能由 Social Bot/Codex 代跑。除 doctor 与迁移外，下面省略的 payload 内容都由 Hermes Skill 的严格 heredoc 生成。

Social 业务命令另有独立的 **direct Hermes gateway** 来源证明：只接受当前固定 Node → LocalEnvironment 单次 bash wrapper（wrapper 内唯一 eval 必须等于本次固定 Runner argv）→ `python -m hermes_cli.main --profile social gateway run --replace --external-supervisor` → 由 launchd 直接启动（ppid=1）的 `python -m hermes_cli.stderr_timestamp --error-log <social profile>/logs/gateway.error.log -- <上述 gateway argv>` supervisor 的真实短链。macOS wrapper 的 snapshot/cwd 元数据允许 Hermes 源码实际使用的规范系统 `$TMPDIR`（`/var/folders/.../T/hermes-{snap,cwd}-<session>`）或固定 Social cache basename/pattern；supervisor 是链路的 launchd 锚点，因此属于证明的一部分：它的 argv 必须逐 token 复述 gateway argv，`--error-log` 必须落在该 profile 的固定日志路径，且它本身的父进程必须是 launchd。wrapper 的 cwd 只做规范绝对路径/安全 shell 语法校验，不是权限锚点；实际值可以是 Social profile/session cwd，无需等于 Runner 目录。process registry/persistent shell、Python/Ruby/Perl/PHP/Lua/Node REPL、Codex/IDE、其他 profile、其他命令、多余 wrapper 行或解释器均在 env/config/payload/runtime/network 前拒绝。Social 还只能使用 Runner 同目录、resolved exact、无 symlink 的 **fixed production runtime config** `shortdrama.runtime.json`；`/tmp`或其他 alternate config 即使内容相同也拒绝。actor/chat 仍只来自 session，Hermes `actor_access`负责 reader 角色，Runner config 的 operator/privileged allowlist继续约束写操作。

带`--payload -`的 Social 命令只接受 Hermes `_wrap_command()`生成的固定 quoted heredoc：首行必须是从当前 process argv 重建的 direct command 加`<<'SHORTDRAMA_PAYLOAD'`，结束行必须紧邻 payload，UTF-8 JSON object body 不超过 64 KiB、无 NUL/命令替换/第二 heredoc。payload 中合法 ASCII apostrophe 只按 Hermes `command.replace("'", "'\\''")`产生的规范四字符 shell 序列做可逆反解，再进行 JSON/大小/shape 校验；其他 raw quote 或 backslash-quote 不会被宽松 unescape。未 quoted/其他 delimiter、尾随或额外命令均拒绝；不带 payload 的读命令仍要求精确单行 eval，并不得夹带 heredoc。后续`readPayload`还会重新执行完整 JSON/shape 校验。

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

正式 Base 必须先由公司用户在 UI 或动作时确认后的 **lark-cli v1.0.91** 中创建四张空表，名称精确为`账号台账 / 选剧池 / 采集数据 / 发布记录`，再把 create/update 返回 `.data.table.id` 的真实 table ID 写入本地 env。新建的三张表必须通过`--fields`显式创建`剧ID / Post ID / 发布ID`文本主字段。Base 中不能残留第五张默认/未绑定表；Runner 不动态建表。任一绑定缺失会在写前返回`base_table_missing + next_step=create_four_empty_tables_and_bind_ids`，任一额外表返回 schema drift。Task 12 给出重命名默认首表、创建其余三表、精确四表/total=0 读回与 env 绑定的 fake-lark-cli 行为测试命令。`migrate plan`只读 Google/SQLite/Base 元数据并写不可覆盖的计划证据，不写业务数据。doctor（除 init-state）、plan/apply/verify/canary 每次还必须用独立取得的`--expected-base-token`与配置做常量时间核对；manifest 和后续 receipt 都绑定非敏感 Base SHA-256。

首次 plan 还要求四张正式表的完整 record count 与 key-set 均证明为空；任一表非空、count 缺失或空集合证据缺失时返回`base_not_empty`且不产生可执行 schema/data action。manifest 和 canary 都绑定四表空集合证据，data 第一笔写入前再完整读取并比对，防止 plan/canary 后被提前写入。

`--phase data`默认要求四表全空。若 data 已部分写入（无论是某张表写完后中断，还是某张表写了一半），唯一允许的续跑是子集恢复：在原 data 命令上追加`--resume-partial-data manifest-subset`。

该模式的规则只有一条：**Base 里现存的每一行都必须是 manifest 里定义的行，并且逐字段完全一致**。写前完整读回四张表，要求每张表的现有主键集合是 manifest 主键集合的子集，且每个现存行在规范化解码后与 manifest 逐字段相同。任何 manifest 未定义的行、任何字段偏差、任何超出 manifest 行数的记录数，都返回`resume_prefix_mismatch`并保持零写入。缺失的行由既有的 upsert 补齐。

已经完整写完的表是**结构性零写入**：门禁证明它等于 manifest 之后就把它整个排除在 upsert 路径之外，只读取它的索引来解析下游表的关联 ID。因此即使门禁通过后该表发生漂移，续跑也不会改写它；漂移会在`migrate verify`阶段暴露而不是被静默覆盖。

这个子集规则同时覆盖两种情况：账号表已写完而下游全空（本次事故的状态），以及任意一次续跑自身中途失败后留下的状态——**后者是关键**：如果门禁只接受"下游必须全空"，那么写下游过程中的任何一次中断都会让续跑和普通 apply 双双拒绝，操作者将没有任何受支持的恢复路径。`采集数据`的 229 行要分两批写入，这个中断窗口是真实存在的。

该选项只接受`manifest-subset`一个值、只在`--phase data`可用，不放宽 digest、source revision、schema receipt、canary receipt、permission attestation 中的任何一道门禁。续跑成功后仍必须运行`migrate verify`完成 472 行全量核验。注意：Base v3 的读取接口不提供跨表快照或 CAS，门禁读取与后续写入之间存在无法消除的时间窗；因此续跑必须在受控维护窗口内执行（与 canary 的同一前提），最终由`migrate verify`给出一致性结论。

```bash
# data 已部分写入时使用；其余情况不得追加该选项
node shortdrama_ctl.mjs migrate apply --phase data --config "$RUNTIME_CONFIG" \
  --manifest "$PLAN_FILE" --expected-sha256 "$MIGRATION_SHA256" \
  --schema-receipt "$SCHEMA_RECEIPT_FILE" \
  --expected-schema-receipt-sha256 "$SCHEMA_RECEIPT_SHA256" \
  --canary-receipt "$CANARY_RECEIPT_FILE" --expected-canary-sha256 "$CANARY_RECEIPT_SHA256" \
  --permission-attestation "$PERMISSION_ATTESTATION_FILE" \
  --expected-permission-attestation-sha256 "$PERMISSION_ATTESTATION_SHA256" \
  --expected-permission-attestation-file-sha256 "$PERMISSION_ATTESTATION_FILE_SHA256" \
  --expected-base-token "$EXPECTED_BASE_TOKEN" \
  --resume-partial-data manifest-subset \
  --confirm apply-now --actor-id "$PRIVILEGED_ACTOR_ID"
```

Base 把空的 multi-select 与关联字段读回为`null`、`""`或`[]`三种形状中的任意一种，而 manifest 对空集合一律写`[]`。解码器把这三种形状统一规范化为`[]`，因此比对不依赖 vendor 当次返回哪一种；single-select 与标量字段的空值仍然是`null`，与 manifest 一致。

Base 的 datetime 单元格以 Asia/Shanghai 墙钟秒级精度写入，无法保存亚秒精度：来自采集时间戳的`指标同步时间`与`采集时间`在写入前即被规范化为整秒。migration 的写入、写后读回比对、accounts 前缀续跑校验和`migrate verify`统一使用同一个 Base 可存储值，因此不会出现"写进去和读回来不一致"的假不匹配；manifest 本身不因此改写，其 digest 与签名证据保持不变。

Base v3 的 record 读回把 datetime 单元格返回为带时区的 ISO（例如`2026-09-04T00:00:00.000+08:00`），URL 单元格可能返回`[目标](目标)`形式的 markdown。Runner 只接受这两种精确形状与既有的`YYYY-MM-DD HH:mm:ss`写回形状，并规范化为 Shanghai 日历日 / UTC ISO / 裸 URL；缺时区的时间戳、越界日历或偏移、以及 label 与目标不一致的 markdown 一律按`base_response_invalid`拒绝，不做宽松解析。

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

### manifest 重放自检（改动 reconciliation / validation / schema planning 后必跑）

`assertManifest` 会用 manifest 自带的 `source_backup` 重放一遍，再和已存的行逐字段比对；它是
`verifyMigration` 的第一条语句，在任何 Base 访问之前。所以只要重放结果变了，**该 manifest 的
所有剩余阶段都会被拒**——而 Base 非空时无法 replan，已应用的行就此搁浅。

```bash
node verify_manifest_replay.mjs "$MIGRATION_ROOT"/migration-plan-*.json
```

`REPLAY OK` 表示重放复现了每一行（它停在 base binding 检查，因为传的是空 context）；
`REPLAY FAIL` 表示这份 manifest 在当前代码下已经失效。**任何已经 apply 过的 manifest 出现
FAIL 都是发布阻断项**，未 apply 的旧计划 FAIL 属正常。只读，不碰 Base、网络和凭据。

manifest 的重放策略取自它自己声明的 `source_evidence.policy`，不取当前代码常量：
`v1` = SQLite 无条件优先，`v2` = 按 `snapshot_date` 取新，planner 只产出 `v2`。policy 参与
`source_revision` 哈希，而 `source_revision` 又嵌在每行的 `来源 run_id` 里，所以不能靠改标签
来挑选重放策略。

### 四表读取与人工维护

账号台账的 `接收时间/注册时间` 是人工维护的日期时间字段（北京时间 `Asia/Shanghai`，显示 `yyyy-MM-dd HH:mm`），填写账号注册或购买的实际时间。`始发时间` 同为人工日期时间字段，填写首次发布业务视频的实际时间；不以注册、购买、排期或建档时间推算。`备注`是人工维护的文本字段，用于账号运营记录。未知时留空，这三个字段均纳入 Runner schema 和人工字段保护，采集同步不得覆盖。Base 公式字段 `日均播放量` 自动按 `累计播放量 /（累计数据截至日期与始发时间的北京时间自然日差 + 1）` 计算；缺任一输入或截至日期早于始发日期时留空，真实零保留。运营在 Base 填写人工字段；`account list/get` 可读取，账号 CLI 保持只读。

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
- `账号台账.状态`与`选剧池.账号状态`使用两个独立 schema 枚举；账号台账当前保留`未发 / 重养 / 发布中 / 弃用 / 暂停 / 买粉中`，选剧池仍保留`未发 / 重养 / 发布中`，不能因“在用账号”视图只筛`发布中`而把字段选项缩成单值。`弃用 / 暂停 / 买粉中`是在线 Base 已有的业务选项；本次只同步 schema 契约，不改变采集纳入规则。
- 手动任务的 terminal 通知只发送到持久化的原始请求会话；调度健康通知与采集日报只发到配置且 allowlisted 的通知群（`SHORTDRAMA_REPORT_CHAT_ID`，未配置时为 Ops chat），用户不能指定任意 chat。
- 账号负责人和批次负责人的待处理提醒可通过 `batch_review.review_chat_id` 发到固定且 allowlisted 的运营群。`review_group_recipients` 非空时限定试运行收件人；留空时，只要该账号的真实负责人已在群里，就向群内真实艾特。每次调度进程读取当前群成员，未入群的负责人继续收私聊。群成员读取失败或群明确拒收时也继续私聊；群消息结果不明时不再转发私聊。原有去重、白天发送时段及提醒次数不变，采集日报和手动同步结果仍走各自原渠道。

## Internal commands

下列命令只供已安装的 launchd capability 调用，拒绝 Social/local actor 参数，不是人工运维入口：

```bash
node shortdrama_ctl.mjs schedule tick --config "$RUNTIME_CONFIG"
node shortdrama_ctl.mjs queue drain --config "$RUNTIME_CONFIG"
node shortdrama_ctl.mjs schedule health --config "$RUNTIME_CONFIG"
```

`schedule tick`从北京时间 **08:00** 起幂等入队当天任务；机器错过 08:00 时，在当天恢复运行后的下一个 tick 补跑；同日已有 success/partial/进行中的任务时不再入队，当日任务全部 failed 时最多补跑到 3 次、每次间隔至少 30 分钟；`queue drain`凭 SQLite lease 领取最多一项；`schedule health`在北京时间 **10:00** 后对当天缺少 success/partial terminal 的情况向固定 Ops chat 去重告警，并另外检查三项、每项每天最多告警一次：采集不完整（`capture-incomplete`，账号入口失败、帖子详情失败、指标缺失）、`queue drain`连续失败 6 次（`drain-failing`）、台账/发布记录新增数据问题（`ledger-integrity`，上线时已存在的问题记为基线不告警）。`schedule health`还负责采集日报（`capture-report`）：每个调度触发的采集任务结束后，不论成功、部分成功还是失败，都向通知群发一条中文日报，内容包括结果与用时、账号和帖子的采集数量、较昨日新增的帖子数、写入与关联的数据量、采集环节按账号列出的问题、以及同步环节（账号台账、采集数据、发布记录关联）按原因汇总的问题；统计报表只在同步失败时提示，不声明“已同步”；失败时写明原因、失败前已写入的数据量和补跑规则（最早与最晚的开始时间、本次是第几次尝试、上限几次）；日报里的内容都在任务结束时确定，不含随时间变化的预告，所以无论何时生成或送达，文字相同。日报不受 10:00 健康时段限制，任务结束后的下一次检查即发出，且先于告警发送；每个任务只发一次，发送请求带固定请求号，回包丢失后重发不会出现第二条；发送失败由后续检查持续重试，最长三天；通知群明确拒收时改发到 Ops chat 并注明；明确拒收只指飞书返回机器人不在群（230002）、没有发言权限（230035）、群已解散（232009），或会话不在 allowlist。改发过的消息固定走 Ops chat 直到送达，不会因为通知群恢复而切回去；只有 Ops chat 也明确拒收时，下一次检查才重新从通知群开始。超时、回包丢失、限流、5xx 和格式异常的回包都属于结果未知，不改发，由下一次检查向同一会话用同一请求号重试，避免两边各收到一条。每条日报和告警的正文在首次发送时留存，之后的重试发送同一份正文，同一个请求号不会对应两种内容；采集汇总按日期存一个文件，同一天后一次采集会覆盖它，留存保证迟发的日报仍是本次任务的数据。三项每日告警的正文带有发现时间，说明它描述的是哪个时刻的情况；台账告警送达后，只把送出的那份正文列出的问题记为已通知，之后新增的问题留到下一次告警。消息不因正文留存失败而扣发（此时发送当次生成的正文）；改发路线读不到或写不进时则不换会话，避免两边各收到一条：读不到时本次不发送，写不进时维持通知群的拒收结果，均由下一次检查重试。改发失败时记录的是 Ops chat 的应答。日报未送达、只送达 Ops chat、或无法生成时，本次`schedule health`结果记为`partial`（退出码 2），即使同时有其他告警发送成功。首次启用时只报告此前 12 小时内结束的任务，更早的历史不补发；已经开始但尚未送达的日报不受此限。某次任务的日报已送达时，当天不再为它另发`capture-incomplete`告警，日报未送达时该告警照常作为兜底。其余健康告警（含当天缺少可用结果的告警）同样带固定请求号，并在通知群拒收时改发到 Ops chat。手动触发的任务不发日报，仍只通知原始请求会话。一天可以配置多次采集：runtime config 的`schedule.extra_capture_times`是北京时间`HH:MM`列表（如`["16:08"]`，最多 4 个，必须晚于首次采集时间且依次递增，健康检查时刻不得跨日）。每个采集时间开启一个时段，持续到下一个采集时间为止；上面的规则全部按时段执行：每个时段入队一个任务，时段内任务全部 failed 时每个时段最多补跑到 3 次、间隔至少 30 分钟，到下一个采集时间后不再补跑上一时段；机器错过某个时段时不补该时段，只跑当前时段；上一时段的任务仍在运行时，下一时段的任务等它结束后才入队。健康检查对每个时段单独进行，时刻为该时段采集时间加上首次采集到首次健康检查的间隔，后续时段缺少可用结果的告警记为`missing-terminal:<日期>@<HHMM>`；每次检查会判断当天已到检查时刻的每个时段，较早时段没有送达的告警在后面的时段到期后仍会补发。补跑最晚须在所属时段结束前开始，即下一个采集时间之前、且不晚于当天 24:00（零点到首次采集时间之间不启动任务）；来不及的，日报不承诺补跑，只写明接下来是哪一次采集。配置了多次采集时，缺少可用结果的告警按时段标注采集时间，首个时段也标注，键仍是`missing-terminal:<日期>`；当天之后的采集已有可用结果时，不再为较早的时段告警，因为数据已经更新且该次采集的日报已发出。同一天的多次采集写入同一个日期的快照，后一次覆盖前一次的指标、不会用空值覆盖已采到的值；每日播放趋势以当天第一次成功入库的快照为准并冻结，不受后续采集影响。不配置`extra_capture_times`时行为与原来完全相同。安装命令是`./install_launchd.sh "$RUNTIME_CONFIG" "$EXPECTED_BASE_TOKEN" "$PRIVILEGED_ACTOR_ID"`；installer 继承用户 Terminal TTY运行 doctor，不用 command substitution 绕过来源证明。生产 installer 没有 test-mode 或 launchctl 路径注入；回滚测试只运行临时目录内的独立 fake executor harness。只有 doctor ready、生产动作时确认、备份和 readback 条件全部满足后才能执行。

验收必须观察至少一次真实北京时间 08:00 的**自然调度**，并记录 schedule run_id、Collector terminal、Base readback 和通知。手工 `sync start`、launchctl kickstart、服务 loaded 或进程存活不能替代自然调度证据。切换验收还要求**连续七天**全绿；失败后从新的连续成功日重新计数，不能拼接非连续日期。

## 环境变量契约

真实值只进入未提交的安全环境；`.env.example`仅列空 key。每次 launchd/manual CLI 都先读取 runtime JSON 的`paths.env_file`，从 config 起始目录开始逐级检查每个父目录和每个`..`跳转，再以`O_NOFOLLOW`单次打开该 0600（或同等无 group/other 权限）的普通文件；任何缺失、symlink/parent symlink、权限过宽、超限、重复或 malformed dotenv 都在网络前`config_invalid`。

dotenv 仅按严格`KEY=value`数据解析，绝不 shell source/eval/expand，也不执行变量、反引号或命令替换。Runner 只导入 runtime config 明确引用的下列 key 加固定`SHORTDRAMA_OPS_CHAT_ID`与可选的`SHORTDRAMA_REPORT_CHAT_ID`；其他 collector/legacy/任意 key 即使出现在共享`.env`也不会进入 Runner env。调用进程显式提供的同名值优先于文件值，供受控诊断覆盖；空覆盖仍按配置校验失败，不静默回退。

Base Adapter 固定按 lark-cli v1.0.91 vendor contract 解码：record list/batch_get 使用 matrix；官方最小 list 只要求`fields / record_id_list / data / total`，`field_id_list / field_type_list / timezone / rev / query_context`均可缺省，但一旦出现就严格验证。每个 optional metadata key 使用本次分页的 first-seen baseline：中间缺失页不会清除基线，之后再次出现必须 deep-equal；字段名矩阵与 total 始终必须一致。`rev`的 undefined/null 都视为缺省，非空时只接受非负安全整数。完整性由 matrix+total/offset/limit 和独立 schema readiness 共同证明；显式 writable projection 仍发送固定字段集合，若返回 scope 则必须是`all_records + selected_fields`。批量创建为`create_records`，批量更新为`update_records`映射；select 使用数组 cell，datetime 在`Asia/Shanghai`原始值与严格 ISO/date-only canonical value 间转换，link 只接受精确`[{id}]`。数字 Lookup 只把安全十进制字符串或 null 转为 number/null。视图 readback 必须通过完整 field index 把 filter/sort/group/visible field ID 规范成字段名；filter 同时接受严格 tuple 与官方`{field_name,operator,value}`对象并规范成 tuple，畸形/混合键失败。select options 只按 name 做语义比较，但 server option ID 缺失/重复和重名仍失败。非预期`ignored_fields`、矛盾 scope/metadata 或分页不完整都不能返回 complete；写响应缺少 record ID 时只以完整索引读回证明成功。

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
SHORTDRAMA_REPORT_CHAT_ID
```

actor/chat allowlist 使用逗号分隔 ID；`SHORTDRAMA_OPS_CHAT_ID`必须同时属于 `SHORTDRAMA_NOTIFICATION_CHAT_IDS`。`SHORTDRAMA_REPORT_CHAT_ID`可选，是采集日报与健康告警的通知群，同样必须属于该 allowlist，且 Runner 使用的飞书应用机器人必须是群成员；留空或不设时日报与告警发到 Ops chat。app secret、token、授权头、真实 table/base ID、actor/chat ID、凭证路径不得写入 Git、日志、审计正文或聊天回复。

迁移 artifact 目录必须由当前用户持有并保持 0700，文件用 0600、`O_EXCL|O_NOFOLLOW`不可覆盖写入并做 inode/hash 读回。Node 当前没有 dirfd/openat 路径绑定能力，因此目录检查到 pathname open 之间仍存在极小的同用户本地 TOCTOU 残余；这不是原子 openat 保证，正式操作需保持目标机同用户会话受控。

## 单写者切换、恢复与回滚

1. 切换前备份旧采集机的 SQLite、凭证、launchd 定义和最近 terminal，记录 checksum/readback；正式 Base 与 Google 也保留不可变迁移证据。
2. 先暂停旧采集机写入口并证明它已停止，再启用 Mac mini 的新 Collector/Runner。任何时刻只能有一个 writer；禁止两台主机重叠运行。
3. 安装器会备份新 label 的既有 plist；安装失败按原 loaded 状态恢复并 read back。若出现 `rollback_verification_failed`，保持停止并人工修复，不能声称恢复完成。
4. 观察期故障时暂停新 Runner/launchd 写入，导出并保存 Base 人工变化和 Job/Audit，再按审计恢复旧入口。保留 Base、SQLite、旧 Google、plist、脚本及错误证据，不删除、不清空。
5. 连续七天验收通过后，旧 Google 三张人工业务表仅 archived/read-only；TikTok Daily Metrics 继续保留。

任何无法证明 schema、receipt、readback、单写者状态或回滚结果的情况都 fail closed，并转入 `manual_repair`。

### 一次性 Google 增量对齐（非空 Base）

`migrate reconcile-plan` / `migrate reconcile-apply` 用于初次迁移完成后、Google 仍有新增时的一次性切换补齐。它保留已有业务 ID、记录 ID、关联和归档状态，不删除记录，不回写 Google，不建立持续双写。源表缺少剧名的新发布行保留空关联，不猜测剧名；原有“是否已排期”仍由 Base 关联公式计算，Google 人工标记保存在计划的源备份。

两个命令均沿用本地管理员来源校验，Social Bot 不可调用。计划包含完整源/目标快照、原迁移基线哈希、schema 和逐字段变更。应用时重新读取 Google 与 Base，任一变化均停止；计划 30 分钟有效。只追加源数据需要的 manifest-append 选项，写后读回并记入现有审计，不重放未知结果的写操作。

```bash
node shortdrama_ctl.mjs migrate reconcile-plan --config "$RUNTIME_CONFIG" --expected-base-token "$EXPECTED_BASE_TOKEN" --actor-id "$PRIVILEGED_ACTOR_ID" --baseline "<original-migration-plan.json>" --expected-baseline-sha256 "<original-manifest-sha256>" --output "<new-reconciliation-plan.json>"
node shortdrama_ctl.mjs migrate reconcile-apply --config "$RUNTIME_CONFIG" --expected-base-token "$EXPECTED_BASE_TOKEN" --actor-id "$PRIVILEGED_ACTOR_ID" --baseline "<original-migration-plan.json>" --expected-baseline-sha256 "<original-manifest-sha256>" --manifest "<new-reconciliation-plan.json>" --expected-sha256 "<reconciliation-sha256>" --confirm apply-now --output "<new-reconciliation-result.json>"
```

操作前备份 SQLite/Job/Audit，并保持采集任务停止。现有发布记录须仍对应原迁移基线，原有源行删除、改动或目标已有新增发布时停止，不能凭行号猜测。部分应用失败后保留所有写入和审计，先核对回执与当前数据；不自动回滚、不盲目重跑。成功后的计划也不可重复应用。

未知写结果会在现有审计库保留 `reconcile_intent`；它未被读回确认前，禁止重新生成计划或重新应用。可用原计划执行仅核验恢复的命令：

```bash
node shortdrama_ctl.mjs migrate reconcile-recover --config "$RUNTIME_CONFIG" --expected-base-token "$EXPECTED_BASE_TOKEN" --actor-id "$PRIVILEGED_ACTOR_ID" --baseline "<original-migration-plan.json>" --expected-baseline-sha256 "<original-manifest-sha256>" --manifest "<original-reconciliation-plan.json>" --expected-sha256 "<original-reconciliation-sha256>"
```

恢复只在全部目标值与原计划一致时补齐审计并解除待核验状态；它不向 Base 重发写入，也不因暂时查不到新行就判定创建没有发生。无法完全验证时保留待核验状态，必须人工检查，不能盲目重跑。

对齐计划 v2 将“证据文件完整性”与“业务新鲜度”分开：原计划完整 SHA256 仍必须匹配；申请写入前按规范化的源数据、目标可写字段、记录身份、完整字段定义、原迁移基线、实际变更和 ID 分配重新核验。飞书接口返回表/字段的顺序、派生值和系统时间不再误判为业务漂移；字段类型、公式、选项、关联定义或业务值变化仍停止，并在 `changed_components` 中指出变化类别。v1 计划需重新生成，不能手改旧 hash。

部分操作已生效时，可使用 `migrate reconcile-checkpoint-plan`，参数与 reconcile-apply 的计划输入相同但不含 `--confirm`，并指定新的 `--output`。它只接受与原计划逐项匹配、当前已全部可见的审计意图批次；未计划的目标数据变化、部分可见的批次、未知字段定义和预留序号变化均停止。生成新计划时可纳入最新 Google 数据，但历史发布行及已经创建的追加发布行必须与原源签名一致；应用时源数据必须与这份新计划一致。新计划只包含未完成部分，保留原待创建 ID，并复用已创建发布行的审计映射。普通 reconcile-apply 会先对原操作做只读恢复并补齐审计，再校验和应用剩余数据；不扩大 Social 权限或跳过本地管理员来源校验。选项写后的已知旧值最多重读 5 次，未知选项集合仍立即停止。

批量更新回执按完整唯一 ID 集合核验，不要求服务器保持请求顺序；客户端向下游仍返回原请求顺序。缺失、多出、重复或错误的回执 ID 仍拒绝，成功仍必须有独立写后读回。

写后分页读回如果仅观察到 `rev` 或 `total` 跨页变化，会丢弃整个本轮结果并从第一页有限重读，不重发写操作。字段名、字段 ID 与类型以对齐的对应关系比较，单纯列顺序变化可接受；真实映射、类型、时区或作用域变化仍立即停止。若多项同时变化，优先报告不可重试的结构变化，不能让总数变化掩盖它。

新增发布行的 URL、Post ID 和账号需相互一致且未被其他发布行占用；能匹配 Google 采集数据时，在采集行创建并读回后绑定实际记录 ID。缺少采集数据时保留发布证据并标记待采集，不编造指标。


### 每日新增播放量与使用指南（2026-09-09）

左侧“Social Bot 使用指南”提供查询、选剧维护、排期、补链接、收益、预览确认和同步进度的中文示例。四张业务表不扩展机器/人工字段；可选分析表“每日播放趋势”通过 runtime config 的 `base.daily_views_table_id` 独立绑定。未知的额外表仍拒绝，业务表身份和迁移基线不变。

现有 `queue drain` 在没有活动同步任务时刷新每日汇总；SQLite 历史内容未变时不重写。增量只比较相邻北京时间日期的快照，包含同帖差值以及可以证明在上次采集后发布的新帖；首次观察的旧帖和缺失值不按零处理。首日、前日断档或无可比值时结果为空，图表过滤空值；回调保留负差值。此为采集时点之间的可观测增量，并非平台官方自然日全量统计。具体覆盖、未纳入和缺失帖子数保存在分析表。

分析投影由已安装的 Runner 内部调度执行，写前检查固定表名、主字段和字段类型，写后完整读回。未知写结果保留审计意图；后续只在既有结果完全可见时恢复，不盲目重发创建。该表不复制明细历史，不回写 Google，不更改四张业务表。


### 同步读回精度与可见性（2026-09-09 修复）

Runner 的 datetime 写入编码精确到秒，Repository 用同一编码/解码规则规范化期望值，避免毫秒丢失造成成功写入却报 `readback_mismatch`；普通文本中的 ISO 字符串不参与时间归一化。批量同步在写后只对已知写前旧值、暂未出现的行、跨页 rev/total 可见性变化做有限重读，不重发写入。未知新值、记录身份改变和真实字段结构变化仍立即停止。失败终态的计数可能尚未增加，判断实际写入必须独立读回，不能把计数 0 当作无写入。


### 历史发布关联校验（2026-09-09 修复）

SQLite 未包含的 Google-only 历史 Post，可以用 Base 已保存的采集记录校验明确 Post ID/URL 或既有采集关系；仍验证账号、Post ID、URL 一致性及全局占用冲突。已正确关联的历史行保持不动，不把旧指标时间改成“本次更新”；历史候选不参与未确认的按日期推断。无链接、匹配歧义、失效账号关系和真正缺少可验证采集数据的记录仍明确报告待处理，不压成成功。发布证据的写后旧值有限重读仍严格保护人工输入和采集关系，不重发写操作。

### 2026-09-11 运行时字段与编号兼容

运行时允许四张业务表存在额外字段（例如选剧池的 `Parent items`），但 Runner 不使用它们作为业务输入，也不写入它们。必需字段、主字段身份、类型和关联仍按固定 descriptor 校验；重复字段名仍拒绝。真正缺字段时 `schema_missing` 会返回 `missing_fields` 和 `extra_fields`，类型或关联变化仍返回 `base_schema_drift`。迁移的 schema/receipt 约束保持原样。

新增选剧及发布记录的预览先完整读取已有编号（含 archived），再在同一 SQLite 事务中按 `MAX(已有预览保留序列, 表内最大编号) + 1` 分配，避免人工管理恢复后本地序列落后造成撞号。已保留编号不回退；预览后的并发业务键冲突仍由 apply 的新鲜读回拦截。

### 2026-09-11 采集覆盖与30天窗口

`shortdrama.runtime.json` 的 `capture.max_age_days` 默认30，允许1–365的整数。固定 Runner 将它传给固定采集器。窗口以视频真实 `published_at` 和本轮 `captured_at` 的绝对时刻计算，严格超过30天停止采集；恰好边界继续。未知发布时间先保留为采集目标，详情返回过期日期后不写新快照。选剧池上线日期不作为视频发布时间。

`capture.excluded_post_ids` 是最多200个、无重复的精确数字 Post ID 名单。固定 Runner 将它传给采集器并核验回执：名单中的视频不再请求详情、不写新 SQLite 快照或 Base 机器字段，也不进入批次自动匹配、Caption 自动关联和自动核对提醒。旧采集行、历史快照与审计记录保留；移除名单项后才会重新按正常规则处理。`capture_policy` 回执记录名单与本轮跳过数量。

采集目标是每个授权账号的当前主页视频、SQLite 已知视频身份及 Base 活跃发布记录中明确登记/已关联视频的并集，按30天过滤。历史记录只提供ID、账号、日期、文案与URL，不作为本次播放量回退来源。原历史快照、Base记录与链接保留；只把与本轮 `captured_at` 相同且未过期的快照回写为本轮指标。`capture_summary_<日期>.json` 的 `capture_policy` 记录窗口、详情请求目标数、过期跳过清单及未知日期数量。

同步使用独立的存储字段 repository 索引，不加载显示用的数值 lookup。多条采集关联按 `release_capture_relation_conflict` 逐条报告，不因为逗号分隔显示值阻塞其他记录；不自动拆分或汇总人工关联。普通人工查询仍读取完整字段。

Base 登记目标由固定 Runner 只读完整账号/采集/发布索引，校验账号与显式视频ID/URL的一致性后，通过有1 MiB上限的 stdin JSON 传给采集器；不把文本字段当命令，不推断计划发布日期为真实发布时间。详情返回的作者与Post ID必须匹配目标；未获取详情且不在新鲜主页列表中的视频记录为 `detail_unavailable`，不制造空指标记录。Base 的冲突目标仍由同步逐条报告，不猜配。

首次查明某视频已过期时，只把真实发布时间写入 SQLite 视频身份元数据，保留旧指标且不创建当日指标快照；下一轮由该日期直接跳过，避免每天重复查询同一个未知日期的旧视频。

导出XLSX仍包含全部记录；QA PNG只渲染表头及前20条记录，防止记录数量增加后超大位图分配失败并阻断采集回执。

### 2026-09-11 已确认的日采集口径

用户确认每日采集数据以北京时间为准：采集日、快照文件日期、日指标统计和调度使用 `Asia/Shanghai`。平台原始发布时间保留精确时刻；确认补录的发布记录写入真实发布时间并由 Base 按北京时间展示，不用纯日期推测具体视频身份。

HumanOps 的日期预览与写后核验使用同一 Base canonical codec：北京时间午夜统一为 date-only，其他时刻统一秒级精度。保留平台实际时刻，避免午夜和亚秒导致的 readback_mismatch；无实际变化时返回 unchanged + verified。


### 选剧台累计与趋势扩展（2026-09-20）

用户确认：账号累计仅来自有发布证据的《发布记录》，超过30天的帖子保留最后采集值；所属平台取选剧池的平台，平台取帖子的发布平台。账号后台全历史总量和主页访问量不属于当前统计。

`base.analytics_table_ids` 必须同时绑定 `accountDaily`（每日播放趋势-分账号）、`dramas`（短剧播放数据汇总）、`releaseDays`（短剧发布趋势）、`firstDays`（短剧新发趋势-按日去重）。已绑定的四张分析表加入schema许可，业务表的必需字段/关联契约不变，未绑定的额外表仍拒绝。累计字段由分析投影单独管理，不允许HumanOps借此扩展任意字段写权限。

`每日播放趋势-分账号.负责人` 是 Base 查找引用字段：按本行 `账号ID` 精确匹配 `账号台账.账号ID`，显示台账中的 `负责人`。台账负责人由人工维护；未匹配账号或未分配负责人时保持空白。统计投影校验该字段存在且类型为 lookup，只写统计字段，不回填或覆盖负责人；Social Bot 的 `metrics daily-by-account` 读取 Base 当前值。

既有 queue drain 顺序刷新每日播放趋势和新分析投影；无新的定时器和采集窗口变更。新增互动趋势与原播放趋势使用同一批采集帖子，按相邻北京时间日期的快照计算；这两张每日趋势仍是采集间隔增长，不是账号后台自然日统计，也不限定已关联发布记录。账号累计和三个剧/发布报表限定发布记录。

互动率为（新增点赞+新增评论+新增收藏）/新增播放量，不含转发；分母非正或分子覆盖不完整时为空，回调差值仍保留。新增四项指标不会将首次发现的旧帖全部累计当作日增量。

累计只取每个已登记帖子的Base当前采集值，不累加历史快照；字段缺失时对应累计指标为空，真实零保留。发布记录缺剧时仍进入账号与发布日统计，但不猜测剧身份；发布日期缺失时仍进入账号和剧累计，不能进入发布日组，该剧首次发布日期保持未知，直到补齐。各组说明明确统计时区为北京时间 `Asia/Shanghai`，并显示指标时间范围、停止刷新规则与缺项。重复Post ID、关联冲突等问题只跳过对应的发布记录并在结果的`issues`中逐条列出，其余记录照常统计，不修改源记录；账号台账行被删除或账号ID重复时，对应发布仍计入分剧与按日统计，只不计入账号累计；某剧有发布被跳过时，其统计说明注明未计入条数，全部被跳过时指标留空而不写 0。

短剧播放数据汇总按剧ID去重且展示剧名；首次发布日期取本剧所有实际发布记录的最早日期。短剧发布趋势按每条记录的发布日期归组，统计其最后采集的累计值。短剧新发趋势把同一剧的所有发布记录统一归到该剧首次发布日期。

每次投影按稳定键查找既有行，仅更新差异；同表串行，200条一批。写前记审计意图、写后全量回读，丢失响应只在已写结果可验证时恢复，不盲目重建；源记录移组时清零旧统计行并标明无符合条件的数据，不删除业务记录。

内部维护命令 `queue project --config <runtime>` 复用安装好的内部 capability，只刷新分析投影，不启动采集，也不重试历史通知；仍拒绝Social会话及actor/chat覆盖。


### Social Bot 统计查询与源数据完整性（2026-09-20 补充）

Bot的metrics by-account/by-drama读取与Base一致的统计报表，支持--key；daily、daily-by-account、release-trend、first-release-trend支持--date YYYY-MM-DD（北京时间），daily-by-account同时支持--key账号ID；quality读取当前源记录的归属缺项。这些接口均为只读，保留真实Social会话、固定Runner/config与角色校验。累计字段不可手工写入；数据维护仍修改源记录并执行同步。

业务索引跳过完全空白的新建草稿；任何已经填入业务字段但缺ID的行仍报错，避免掩盖有效输入。空白排期不进入累计；精确Post ID关联必须校验账号一致。


### 自然日归档切换（2026-09-20）

从daily_reporting.start_date（2026-09-20）开始，mode=calendar_day以北京时间自然日归档，日期D取D与D+1快照差，于次日采集后结算。每天计划北京时间00:00和16:10采集，实际启动受300秒轮询影响；不是平台精确到零点的官方事件日统计。当天的行保持空值并写待结算；缺少任一边界快照不跨天分摊；切换首日的基线不是零点，明确标记部分覆盖。

切换日之前保留旧采集间隔数据和说明。SQLite原始快照日期仍为实际采集日期，不重命名旧快照。总体与分账号趋势通过同一日期映射计算，30天停止刷新策略不变。

配置：schedule.capture_hour/capture_minute=0/10，health_hour/health_minute=2/10；仍由原300秒launchd轮询执行（同日一次；当日全部 failed 时按上文规则有限补跑），不另建采集器。未配置时保持原08:00/10:00行为以兼容旧环境。

用户确认的base.external_tables只登记表ID与表名用于库存校验。Runner不读取其字段和记录，不向其写入；未登记的新表仍触发schema_drift。三张收益表由外部流程管理。

自然日结算快照按日期首次保留到既有audit_events，包含源行哈希并由跨进程锁保护。后续日内手动同步仍更新最新累计值，但不覆盖已保留的日报边界快照。只读metrics查询只能读取这些快照，不创建审计快照或写入锁。


### 当前 Base 自动编号契约（2026-09-20）

运行时遵循现有飞书表：`选剧池.剧ID` 可为 `SD-` 加六位递增数字的 `auto_number` 主字段，`发布记录.发布ID` 可为 `SR-` 加六位递增数字的 `auto_number` 主字段；历史文本主字段仍兼容。推荐人包含彭满、高璇、马博洋、张凯风。其余类型、关联、主字段身份、公式及字段归属校验保留；漂移错误包含 `mismatches / expected_type / actual_type`。

自动编号表的新建预览返回 `record_id: null` 与 `id_generation: base_auto_number`，编号由 Base 在确认写入后分配。Runner 不提交或预占该主字段，必须根据创建回执的真实 record ID 读回字段和业务编号，再返回及审计实际 `SD-/SR-` 编号。缺少创建 record ID 或读回不一致均失败且不自动重放。编号模式改变后，旧新建预览必须重新生成。现有记录更新及关联仍执行原 preview/apply 和并发校验。本次适配不更改飞书表结构或已有业务记录。

## 人工候选确认（2026-09-21）

`release candidates` 在正常 schema/provenance 门禁后只读查询最近七个已结束的北京时间日期；可用 `--key <发布ID>` 或 `--date YYYY-MM-DD`。候选来自完整 Base 索引和现有 SQLite 文案，按同账号、±2个日期、剧名/Part 证据排序。无内容证据的同账号候选明确为 `content_unverified`，不能自动视为通过。已有 URL、Post ID、采集关联（含归档占用和反向关联）均保留；不存在后台自动应用候选。

选定视频后使用 `release preview-match --payload -`，正文精确为 `{"key":"SR-000001","postId":"7460123456789012345"}`。命令重新核对候选并生成标准15分钟 actor/chat-bound 回执；用户下一轮确认后使用原有 `release apply-update` + `{"receiptId":"..."}`。回执保存双方身份版本；应用登记精确 URL/Post ID、立即关联采集记录，并重新核对原人工字段、采集身份和全局占用后审计。必须返回 `capture_linked=true`、`readback=verified` 才算完成。

`capture_confirmation_partial` 说明回执已消费且可能只完成部分写入，要求先读回再修复，不自动重试、回滚或宣称成功。新流程不改人工日期、账号、剧、备注，不改变现有采集定时或自动匹配算法，不增加 Base 字段。默认列表每行最多5个候选，单条查询最多50个；通过 `candidate_count/candidates_truncated` 保留截断语义。


### 2026-09-21 剧源平台契约同步

现有 Base 的选剧池.平台已使用 `MoboReels`，Runner 固定选项同步为 ReelShort、DramaBox、ShortMax、TopShort、其他、MoboReels。保留当前 Base 选项及已有记录，不将当前 MoboReels 记录改成其他；仍拒绝未批准的新平台。旧 Google 迁移与对齐逻辑的 `MoboReels → 其他` 仅用于历史迁移重放，不改写历史清单。业务维护继续使用原 Runner 预览/确认流程，字段所有权和来源校验不变。


### 2026-09-21 账号台账自动纳入采集

正式 Runner 每轮采集前完整读取账号台账，将通过校验的全部账号经既有有界 stdin 通道交给采集器。新增账号只需在台账填写唯一 `账号ID`（TikTok小写用户名，不带@）和对应的HTTPS TikTok `主页链接`，下一轮采集自动纳入，无需修改采集器固定名单。账号名可以留空，未发/重养/发布中均不影响纳入；这三个状态不是停采开关。

主页无效或与账号ID不一致的记录跳过并报告 `account_capture_*`，该轮记为partial；全表读取失败、重复主键、没有有效账号或传输名单无效则停止，不回退到旧名单。完全空白草稿按原Repository规则跳过，已填业务信息但主键缺失仍由原完整性校验阻断。采集回执的 `accounts_requested` 必须与输入名单逐项一致，否则报 `capture_membership_mismatch`；`accounts_successful`才表示实际成功采集的账号。`capture_policy.account_source=base_account_ledger`标明来源。

仅历史独立脚本的无stdin调用保留旧静态名单；现有正式launchd→Runner路径始终采用台账。每轮使用当轮快照，运行中新增账号在下一轮纳入。保留30天视频窗口、原自然日调度、历史快照、人工字段及既有发布记录匹配保护。加入名单不等于已经采集成功，也不会自动修复重复发布关联。

## 显式发布批次与负责人通知（2026-09-22）

`release batch-schedule` 用 account/drama/plannedAt/count 一次预览生成 1–30 条发布名额，负责人从账号台账继承；可传 ownerId/notes。`release batches [--key SB-...]`只读查看批次及候选，`release batch-preview`接受 batchId 和可选 postIds，实际帖子按发布时间排序分配剩余名额。两种预览均由 `release batch-apply` 的 receiptId 在下一轮确认后应用，15分钟、actor/chat/Base-bound。内部子回执不向用户暴露。部分失败消耗父回执并返回已完成清单，必须先读回，不重放；已确认的关系不重排。

`release match-direct --payload -` 接收明确的 `{ "key": "SR-...", "postId": "..." }`，`release batch-match-direct --payload -` 接收明确的 `{ "batchId": "SB-...", "postIds": ["..."] }`。两者只在授权写入者明确要求登记所选视频时使用；批次命令按实际发布时间把所选 Post ID 分配给当前空位，若人明确指定逐条对应关系，应逐条使用单条命令；Runner 在同一次调用内重新核验候选、绑定当前 actor/chat、取得人工 Base 写入租约、生成并应用现有回执、读回采集关联。租约取得前的 `mutation_busy` 最多短暂重试四次；进入租约后不重放。候选已变、映射不明确、部分或未知写入一律停下并报告已核实结果；查看/预览仍走只读或旧预览命令，已有旧回执不自动重放。

`release batch-schedule-direct` 是完整且明确的新排期指令的单次登记入口，payload 与 `batch-schedule` 相同，只接受发布业务时区的今天或未来日期和已验证的 Base 自动编号发布表；旧文本 ID 表返回 `batch_direct_requires_generated_ids`，保留人工预览入口。它仍在 Runner 内生成同一套 actor/chat/Base 绑定的回执，并在持久 Base 租约内校验后应用；Bot 不自行组合 `batch-schedule` 与 `batch-apply` 绕过下一轮确认。写前完整查重以账号记录、剧记录和计划日为键：同条件且完整的活动批次、条数/负责人/备注均相同则返回 `already_scheduled`，不创建新行；旧单条、归档、不完整、数量等不同，或同账号/剧同日已有归属不完整的记录，均返回 `batch_schedule_conflict`。不同剧可在同账号同日分别排期。正式成功必须返回真实批次 ID、发布 ID 和 `readback=verified`；部分或未知写入返回原父回执 ID、已核实子集和审计，不自动重发。若前一次同条件请求已经进入写阶段，而 Base 仍未显示完整排期，返回 `batch_schedule_prior_attempt` 并要求独立核验，不因再次收到相同消息就重发 POST。跨日请求按日顺序调用并逐日报告，遇冲突或部分结果立即停止。只要求查看/预览的消息继续使用原预览入口。

首版全部关联需确认。后台 queue drain 根据 `batch_review.enabled` 更新状态并发送 Social 私信，不自动匹配。配置 wait_hours/reminder_hours 默认24，提醒至多一次；owner_aliases 只映射已经授权的同一人，不改变原权限等级。生产别名通过同一 Base 人员记录的不同应用读回及通讯录稳定身份核实。通知发送保存 message_id、UUID 和发送状态；超时/无回执标记 uncertain，不盲重试。负责人缺失、权限不足和未知投递进入 batch_review.errors；终态日志不是送达证明。

新增发布字段：批次ID、计划序号、批次计划条数、计划发布时间、处理负责人（人工输入与预览生成）；批次处理状态、待处理原因、候选视频、最近通知时间（机器）；实际发布时间（采集记录查找引用）。caption直接从现有SQLite读取展示在候选中。原日期不覆盖，显式批次报表以采集实际时间归组。普通 account_time 不处理显式批次。

通知链接打开 Base 批次首条记录，可查看候选；负责人在 Social 会话回复“查看批次 SB-...”整批预览确认。没有新增独立Web页或卡片回调。已有历史记录不自动填批次，不发送历史复核消息。源码和 schema 需一起部署，新增字段后再部署新代码；不得仅开启开关而跳过字段、身份、Skill和通知验证。

## 高确定性批次自动回填（2026-09-22，用户明确授权）

`batch_review.publication_timezone` 和 `publication_timezone_since` 定义发行当地日口径及生效日。生产从 2026-09-24 起用 `America/Chicago`；IANA 时区自动处理夏令时。可用 `publication_timezones` 按稳定账号 ID 覆盖，未配置的新账号继承统一时区。采集日期与每日指标仍按北京时间。当地日结束、采集覆盖边界后才核对缺片；相邻业务日的同账号同剧按真实发布时间分开。

已授权且信息完整的日常人工写入使用 `pool apply-direct` 或 `release apply-direct`，payload 保留原 `action/key/patch/items` 形状，动作限选剧池 `create|update|batch_update|archive` 与发布记录 `update|batch_update|archive`。Runner 在同一共享租约内生成内部回执、校验、写入并读回，不要求用户在 15 分钟内再次确认。选剧池同名创建直接阻断；发布排期和已选定 Post ID 的关联仍走各自专用 direct 命令。仅明确要求预览时使用旧 preview/apply；部分或未知写入保留原回执并先读回，不盲目重试。

`batch_review.auto_match=true` 且设置 `auto_match_since` 后，内部 queue drain 在提醒之前执行自动匹配。仅处理 rollout 日期起的显式批次，不把旧无批次记录重新组批。原有精确剧名路径要求候选与剩余空位数量相等、caption 明确命中唯一剧名、采集新鲜且无竞争计划或矛盾备注。已有真实关联必须是连续前缀，剩余候选发布时间必须晚于已关联视频；生效日后的批次限对应美国业务日内，旧批次仍限计划日北京时间 00:00 至次日 12:00。符合条件时按实际发布时间顺序只填剩余空位的 Post ID、视频链接及采集关联；不覆盖人工值或重排已关联名额。

`batch_review.count_only_since` 独立启用无剧名文案的批次数量匹配，生产从 2026-09-28 发行当地日起生效。仅当同账号当地日只有这一个有效排期批次、SQLite 与 Base 当日帖子合并去重后恰好等于批次计划条数、每条候选均存在于最新 SQLite 源、候选完整且无相反剧名证据时，允许文案不写剧名或 Part，按实际发布时间依次填空位。错剧、其他排期、额外帖子、数量不足、采集未覆盖当天结束时仍转人工；旧批次不追溯套用。该路径在既有 `匹配方式` 选项中记为 `account_time`，审计日志的规则记为 `exclusive_account_day_count_sequence`，以区分精确剧名匹配；不覆盖已有链接或已有采集关联。

`caption_backfill` 是一次性历史回填：先用 `mode=plan` 从完整 Base 视图生成带原始行快照的固定计划，核对摘要后才可用 `mode=apply` 与 `expected_plan_sha256` 分段写入。只有账号台账 `表现形式=AI真人剧`，且 Post ID、账号、链接、发布时间与采集来源一致的短剧视频参与；已有发布行优先填空，没有对应行才新增。caption 唯一命中选剧池时关联该剧；未命中、同名歧义或无 caption 时允许新建发布行但“剧”留空、`待处理原因=剧名待人工匹配`。同账号同日已有可能对应的空发布位时不另建。每条写入前重查、写后核对双向关系，未知结果持久标记并停止，不重放。`max_actions_per_run` 使大批计划只在已验证的行之后安全暂停和恢复。

`caption_auto` 在历史回填终态完成后处理新采集：旧模式以 SQLite `first_seen_at >= start_at` 为入口；完整模式启用后扫描 Base 中尚未关联的采集记录，兼顾晚同步到表里的旧视频。`recognize_dramas=true` 启用完整流程，必须同时关闭旧的 `lead_review_only`；`observe_only=true` 只输出并审计只读计划，绝不创建选剧或发布记录。

完整识别支持 Part 剧名开头、片段标题后的括号剧名、连写剧名标签、末尾剧名标签，以及按平台区分的核验推广码。大小写、标点、空格和 Markdown 展示链接不影响剧名查重。通用标签与剧情标题不作为新剧名；同名多记录、疑似拼写差异、平台或推广码冲突进入人工核对。`verified_codes` 的每项为 `{platform,code,drama_id}`，只能登记已核对的对应关系；也可从选剧池纯推广码备注、以及文案明确剧名与所选剧独立一致的已关联视频中学习对应关系，不盲目信任旧关联。没有已核验对应关系的代码不会凭空生成剧名。

先按 Post ID、视频 URL、采集关联检查已有发布记录，再识别剧。唯一匹配复用选剧；明确的新剧名通过 `caption_pool` 限定角色仅创建剧名、文案明确提供的平台及 active 状态。选剧创建在共享 Base 锁内二次查重，`caption_drama_creations` 在 POST 前保存意图；未知结果不重发。已有非空人工剧关联不覆盖，冲突写待处理原因；原剧为空且识别唯一时可补剧。

已知账号、剧、发行当地日唯一对应的空发布位优先复用。默认仍保留既有 Part 与排期序号的保守核对；仅对 runtime config 的 `caption_auto.time_order_targets` 精确指定的账号和剧，才把 Caption 的 Part 当内容序号，按真实发布时间顺序填入尚未关联的现有发布记录。此时已有关联必须早于待关联视频，且现有空位不能插在已关联序号之前；否则保留待核对。负责人已在 Base 双向关联采集记录、但发布记录仍缺 Post ID 或视频链接时，仅对 `caption_auto.partial_link_post_ids` 明确列出的 Post ID，在账号、剧、链接及双向关系全部一致的前提下补齐该行，不新建重复记录；名单之外的历史半关联保持原状。时间顺序、竞争排期和身份冲突持久记录在 `caption_auto_reviews`。没有对应发布记录才创建，无法识别的剧和缺失的实际发布时间保持空白，禁止猜值。每条发布写入后验证 Post ID、链接和采集反向关联；已完成或未知的 Post ID 不盲目重放，安全暂停计划的已完成部分保持不变。

无法自动处理的记录通知当前账号负责人；已建立的记录只要求补剧或核对冲突，不要求重新确认视频链接。通知按北京时间 09:00–20:00 发送，未发送的待办会在无新视频的后续调度中继续检查；消息结果未知不自动重发。`caption_owner_notifications` 和 `caption_held_notifications` 记录去重及投递回执。

写入使用与 HumanOps 相同的 Base mutation lease；`batch_match`仅允许五个证据字段，专用Repository方法验证空值、人工作用域、采集身份和全局占用，在同一次记录更新中写URL/PostID/关联并读回。不会伪造actor、聊天或人工回执。`batch_auto_matches`在副作用前保存计划，逐条审计`system:batch-auto`；超时/部分成功/未知结果持久标记uncertain，后续不自动重放，即使人后来清空链接也不会再次抢写。

成功批次保持安静，只投影完成状态。歧义提醒仅在北京时间 09:00–20:00 发送；夜间继续更新状态，白天发送前重新查询，已自动完成则不提醒。提醒展示前5条候选的时间、链接和文案，可直接回复所选候选；超过5条明确提示截断并提供表内入口。收到提醒后回复不限15分钟；回复后生成的人工预览回执仍有效15分钟，过期可重新核验。人工回复仍走真实actor/chat下的预览和下一轮确认。历史9条彭满候选不属于本次自动授权批次，保留人工核验。

`batch_review.silent_batch_ids` 只停发列出的历史计划提醒，仍更新表内状态；不删除原计划、采集或审计记录。用于同事明确改按真实视频核对、旧计划不再是其处理入口的情形。

## 排期空值与部分创建修复（2026-09-22）

飞书存储空文本时返回null。HumanOps将可空text字段的空字符串在生成预览前统一为null；不放宽非空值、剧名、日期或身份校验。旧预览的存储形态不一致时重新预览，不重放已消费回执。

`batch_review.schedule_repairs`为维护人员在明确授权后填写的一次性修复请求，每项精确包含batch_id、原已消费parent_receipt_id、inspectScheduleRepair读出的expected_version。内部queue drain先执行修复再进行自动匹配及通知。仅根据已确认排期补从未执行的缺失序号，保留已存在记录；任何字段偏差、重复序号、缺失但曾消费的创建尝试、快照变化都停止。batch_schedule_repairs日志在写前保留计划，未知/部分写入不自动重放。原父子回执不修改、不再次使用；系统审计actor为system:batch-repair。修复成功后撤下配置中的请求。

通知按动作分支：排期不完整提示维护补齐；关联冲突提示检查原关联；0候选不出现“采用候选”；有候选才给实际存在的序号。未来正常排期不显示缺采集/漏发提示。修复不会新增实际发布证据或猜测链接。

彭满真实Social会话使用user_id 65c7c6a1，映射到同一人的Social open_id；仅修复负责人比较，不扩大其已有操作权限。

## 读取稳定性与具名缺失核验（2026-09-22）

完整索引读取遇到且仅遇到rev/total分页变化时，从第一页重新读取，最多3次；真实字段、身份或时区变化仍立即拒绝。写请求不重试。自动编号创建的失败结果保留write_attempted、phase、已知record_id；批次部分结果及审计保留cause_message、分页元数据键，避免只剩错误码。

默认修复仍拒绝缺失但已消费的创建回执。两类证据可消歧：原审计明确为generated_create_preflight且write_attempted=false，或管理员独立完整读回确认缺失后，在该次schedule_repairs请求附settled_absence={receipt_ids:[原已消费子回执ID],verified_at:UTC时间}。后者仅允许原批次的具名回执，原尝试需至少过去5分钟，核验有效期15分钟，并与expected_version一起绑定当前快照；不是重放回执，不清除used_at，其他未知尝试仍阻断。

2026-09-22高璇批次SB-d9aaaada-4a63-4c1f-962b-6755cdcf8262的第2条旧错误未保留底层消息，不能断言原因为分页变化。修复依据是多次独立完整缺失核验及管理员本次明确的补齐指令；保留SR-000476和原计划，只补缺少的2/3/4。


## 排期写入可靠性修复（2026-09-22）

现用自动编号表的 `release batch-apply`：整批取得 HumanOps 同一持久 Base 租约，校验父子回执、身份、计划快照、关系和字段后，一次 batch_create 提交最多30条排期。父子回执在客户端所有只读检查完成后、实际POST之前，以一个SQLite事务消费。写前失败返回receipt_consumed=false，仍有效的原回执可重试；过期或计划有变化仍需新预览。普通单条自动编号创建也使用同一写前门槛。

写后按返回record ID逐条读取主键及本次请求字段，按实际批次/序号/字段绑定原计划，不依赖响应顺序，不因无关统计lookup报错而中断。全部通过才报告success。一次请求不是飞书事务保证：未知响应、部分落地或回查失败仍停止，保留acknowledged record_ids、已核实verified_records及阶段，原回执不可重放。不通过清除used_at、伪造确认或自动重发POST来恢复。

批次状态投影、人工整批操作、同步的Base读写阶段共用持久租约；采集器运行期间不占此租约，仍独立保持job心跳。整批写前校验的完整索引只在当前只读检查内复用，副作用前清除缓存。外部手工编辑不受本地租约约束，原有快照与字段回查仍保留。
