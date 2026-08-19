# TikTok Public Capture

基于现有公开 TikTok 采集器增加本地历史、Google Sheets 同步、生产记录状态回写和 macOS 每日运行。采集器仍然使用公开 profile、creator embed 与单条公开页，不使用付费 API、代理或验证码绕过。

本工具位于 `inbox-pengman/tools/`，因为它是可运行的本地自动化，不属于 Evergreen SOP。运行输出继续写入 `inbox-pengman/output/`；生产记录同步只扫描当前 `02-生产/02-content-production/`，明确排除 `历史记录/`。

## 最近一次迁移验证

- `2026-08-09`：生产记录扫描路径已从迁移前的 `04-production/02-content-production/` 修正为当前 `02-生产/02-content-production/`；使用现有 SQLite 重跑后扫描 14 条当前主记录，安全匹配 11 条、实际补齐 4 条发布证据、保留 1 条未发布模糊项不写回。再次 dry-run 为 `changed=0`，确认结果可重复且不会反复改写。
- `2026-08-07`：完成目录迁移、Node 语法检查、生产记录 dry-run、真实公开采集和同日 `--from-raw` 回放。
- 真实采集与回放均读取 4 个账号、24 条帖子，`partial=0`、`errors=[]`；SQLite、Google Sheets 和生产记录同步成功。
- 生产记录扫描由历史结构下的 36 份收窄为 14 份当前主记录；历史生产记录明确不参与匹配。
- `--from-raw` 在没有可读原始文件时会明确报错并停止，不再继续生成空表或空快照。

## 当前自动化链路

```text
TikTok 公开账号
  → 每日采集
  → SQLite（同一份事实数据）
      ├→ Google Sheets：账号和帖子指标
      ├→ 飞书 tiktok资产表：粉丝数和粉丝同步时间
      └→ 主生产记录：published 状态、直链、post_id 和发布时间
          → Pengman 工作台 Calendar / Published Library
```

生产记录回写不再从 Google Sheet 反向读取，而是和 Sheet 同时消费本次 SQLite 数据。这样 Sheet API 暂时失败时，本地发布状态仍可更新；两端的数据来源仍然完全一致。

飞书同步同样直接读取 SQLite，不从 Google Sheet 反向读取。它按“现账号ID优先、为空时使用原账号ID”匹配 `tiktok资产表`，只更新数字字段 `粉丝` 和日期字段 `粉丝同步时间`。重复账号、缺少指标或没有飞书记录的账号会跳过并进入运行摘要；飞书失败不阻断 Google Sheets 或生产记录同步。

### Ready 的排期字段与 Published 是两段不同的信号

- TikTok 上尚未公开的定时帖不会出现在公开账号抓取或 Google Sheet 的 `posts_latest` 中，因此公开抓取只能自动确认 `published`，不能提前发现平台后台里的定时队列。
- 在 TikTok 完成定时的同时，主生产记录保持 `content_stage: ready` 并写入 `publish_date`；有确切时间时再写 `scheduled_at` 与 `scheduled_timezone`。
- Pengman 工作台会先按 `scheduled_at` 显示精确时间；暂时只有 `publish_date` 时也会显示在对应日期，标记为“仅日期”。
- 帖子真正公开后，本脚本再自动补齐 `published_url / platform_post_id / published_at`，并把 `content_stage` 确认为 `published`。

因此完整状态机是：

```text
制作完成
  → 生产记录 ready + TikTok 后台定时字段
  → 工作台 Calendar 提前可见
  → 帖子公开
  → 次次抓取自动确认 published
```

自动匹配按以下顺序执行：

1. 生产记录已有 `platform_post_id` 或 `published_url`：精确匹配并刷新指标。
2. 人工填了 `publish_match_post_id`：按指定帖子精确匹配，适合第一次接入或文案无法区分的帖子。
3. 其余记录只在“账号一致，并且发布时间或 Caption 与标题/Hook 高置信匹配”时自动回写。
4. 模糊匹配不改生产记录，只写入 `output/publish_sync_YYYY-MM-DD.json` 的 `ambiguous` 或 `unmatched`，避免把错误帖子标成已发布。

成功匹配后自动维护：

- `content_stage: published`
- `published_url`
- `platform_post_id`
- `published_at`、`published_date`
- `publish_sync_status / publish_sync_method / publish_sync_last_checked_at`

没有真实帖子链接时，不会自动进入 `published`。
播放、点赞、评论、收藏和分享等持续变化的指标仍以 Google Sheet / SQLite 为准，不每天改写主生产记录，避免历史笔记产生无意义的版本噪音。

## 现有脚本检查结果

升级前的行为如下：

1. 同一天重复运行时，Excel、CSV、采集摘要和同名原始文件使用固定日期文件名，因此会覆盖当天文件；不会追加，也不会创建带运行序号的新文件。
2. 原脚本只有当前运行内的 detail Map，没有跨运行的 post_id 去重或历史数据库。升级后，当前结果先按 post_id 去重，SQLite 的 posts 以 post_id 为主键。
3. 默认运行会重新读取 `collect_tiktok_public_data.mjs` 中配置的全部账号主页、creator embed 当前暴露的全部内容，并逐条重新读取详情，以保留指标连续性；进入采集清单不表示该账号仍在生产。--from-raw 仅用于本地回放测试，不发起网络请求。
4. 无法取得的数字字段保留为 null；CSV 中为空单元格，Excel 中为空值。真实的公开 0 保留为 0。SQLite 继续使用 NULL，不把缺失字段写成 0。
5. 输出目录：
   - 日期文件：/Users/pengman/gengrowth-ops/inbox-pengman/output/
   - 原始数据：/Users/pengman/gengrowth-ops/inbox-pengman/output/raw/tiktok_YYYY-MM-DD/
   - 历史数据库：/Users/pengman/gengrowth-ops/inbox-pengman/output/tiktok_metrics.sqlite
   - 定时日志：本目录 logs/

日期和 snapshot_date 默认使用 Asia/Shanghai（北京时间）。

## 本地历史规则

SQLite 数据库包含：

- account_snapshots：username + snapshot_date 唯一；同日更新，跨日追加。
- posts：post_id 唯一；保留 first_seen_at，并在再次看到时更新 last_seen_at。
- post_snapshots：post_id + snapshot_date 唯一；同日更新，跨日追加。
- runs：每次执行一行，包括本地写入和 Google Sheets 状态。

Photo 或其他公开页未提供的指标保存为 NULL。missing_fields 保存缺失字段名称的 JSON 数组。

## Google Sheets 最少配置

同步使用 Google Sheets API 的服务账号。缺少配置或同步失败时，SQLite、Excel、CSV 和原始文件仍会正常保存；下一次运行会从 SQLite 全量重建五个工作表，因此会自动补同步以前未写入的数据。

1. 在 Google Cloud 项目启用 Google Sheets API。
2. 创建服务账号并下载 JSON 密钥。把密钥放在仓库外，例如：
   ~/.config/gengrowth/tiktok-sheets-service-account.json
3. 创建一个空白 Google Sheet，并把该文件以 Editor 权限共享给 JSON 中的 client_email。
4. 复制配置模板并填写：
   cp "/Users/pengman/gengrowth-ops/inbox-pengman/tools/tiktok-public-capture/.env.example" "/Users/pengman/gengrowth-ops/inbox-pengman/tools/tiktok-public-capture/.env"
5. 在 .env 中填写 GOOGLE_SHEETS_SPREADSHEET_ID 和 GOOGLE_SERVICE_ACCOUNT_JSON。

.env 和 .env.* 已被仓库根 .gitignore 忽略；不要把 JSON 密钥放进仓库。

Google Sheets 会批量更新以下标签页：

- accounts_latest
- account_history
- posts_latest
- post_history
- runs

每次同步会根据 SQLite 重写这些表的已用数据，保证同日重复运行不会增加重复行。

## 飞书粉丝同步配置

同步使用飞书企业自建应用。应用需开通“查看、评论、编辑和管理多维表格”及 Wiki 只读权限，并作为可编辑文档应用加入目标多维表格。

在 `.env` 中配置：

    FEISHU_SYNC_ENABLED=true
    FEISHU_APP_ID=
    FEISHU_APP_SECRET=
    FEISHU_WIKI_NODE_TOKEN=QCigwFYMCiuQu1k8q94cXy7PnZd
    FEISHU_TABLE_ID=tbl1LkOftGc2aHis

凭证只保存在被 Git 忽略的 `.env` 中，文件权限应为 `600`。只读连接测试使用 `test_feishu_connection.mjs`；单行真实写入验证使用 `canary_feishu_follower_sync.mjs`。

## 命令

手动完整采集：

    '/Users/pengman/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node' '/Users/pengman/gengrowth-ops/inbox-pengman/tools/tiktok-public-capture/collect_tiktok_public_data.mjs'

只用已有原始数据回放并测试输出：

    '/Users/pengman/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node' '/Users/pengman/gengrowth-ops/inbox-pengman/tools/tiktok-public-capture/collect_tiktok_public_data.mjs' --from-raw

只预览生产记录匹配、不写回：

    '/Users/pengman/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node' '/Users/pengman/gengrowth-ops/inbox-pengman/tools/tiktok-public-capture/reconcile_published_content.mjs' --dry-run

用现有 SQLite 立即执行一次生产记录回写：

    '/Users/pengman/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node' '/Users/pengman/gengrowth-ops/inbox-pengman/tools/tiktok-public-capture/reconcile_published_content.mjs'

安装 launchd：

    '/Users/pengman/gengrowth-ops/inbox-pengman/tools/tiktok-public-capture/install_launchd.sh'

卸载 launchd：

    '/Users/pengman/gengrowth-ops/inbox-pengman/tools/tiktok-public-capture/uninstall_launchd.sh'

查看状态：

    launchctl print gui/$(id -u)/com.gengrowth.tiktok-public-capture

强制测试一次定时入口，不受当前时间限制：

    '/Users/pengman/gengrowth-ops/inbox-pengman/tools/tiktok-public-capture/run_scheduled.sh' --force

查看日志：

    tail -n 100 '/Users/pengman/gengrowth-ops/inbox-pengman/tools/tiktok-public-capture/logs/launchd.stdout.log'
    tail -n 100 '/Users/pengman/gengrowth-ops/inbox-pengman/tools/tiktok-public-capture/logs/launchd.stderr.log'

SQLite 查询示例：

    sqlite3 '/Users/pengman/gengrowth-ops/inbox-pengman/output/tiktok_metrics.sqlite' 'SELECT snapshot_date, username, followers, total_likes FROM account_snapshots ORDER BY snapshot_date, username;'
    sqlite3 '/Users/pengman/gengrowth-ops/inbox-pengman/output/tiktok_metrics.sqlite' 'SELECT snapshot_date, username, post_id, views, likes, missing_fields FROM post_snapshots ORDER BY snapshot_date, username, post_id;'

## 定时机制

launchd 每 15 分钟唤醒轻量检查脚本；检查脚本只在北京时间达到 SCHEDULE_TIME_BJ 且当天尚未执行时运行采集器。默认是 10:00，修改 .env 中的 SCHEDULE_TIME_BJ 即可，不需要重装 plist。

这样可避免 Mac 本地时区和夏令时影响北京时间。每个北京时间自然日只自动尝试一次；如需重试，使用 --force。

注意：

- Mac 必须保持开机并联网。
- 电脑休眠时无法保证 10:00 准时开始；唤醒后 launchd 通常会再次触发检查并补跑当天任务。
- 定时任务不依赖终端窗口保持打开。
- 单个账号失败不会中断其他账号；失败会记录到 runs、summary 和错误日志。
