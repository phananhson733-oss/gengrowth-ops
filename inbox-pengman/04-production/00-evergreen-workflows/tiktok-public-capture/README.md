# TikTok Public Capture

基于现有公开 TikTok 采集器增加本地历史、Google Sheets 同步和 macOS 每日运行。采集器仍然使用公开 profile、creator embed 与单条公开页，不使用付费 API、代理或验证码绕过。

## 现有脚本检查结果

升级前的行为如下：

1. 同一天重复运行时，Excel、CSV、采集摘要和同名原始文件使用固定日期文件名，因此会覆盖当天文件；不会追加，也不会创建带运行序号的新文件。
2. 原脚本只有当前运行内的 detail Map，没有跨运行的 post_id 去重或历史数据库。升级后，当前结果先按 post_id 去重，SQLite 的 posts 以 post_id 为主键。
3. 默认运行会重新读取全部 4 个账号主页、creator embed 当前暴露的全部内容，并逐条重新读取详情。--from-raw 仅用于本地回放测试，不发起网络请求。
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
   cp "/Users/pengman/gengrowth-ops/inbox-pengman/04-production/00-evergreen-workflows/tiktok-public-capture/.env.example" "/Users/pengman/gengrowth-ops/inbox-pengman/04-production/00-evergreen-workflows/tiktok-public-capture/.env"
5. 在 .env 中填写 GOOGLE_SHEETS_SPREADSHEET_ID 和 GOOGLE_SERVICE_ACCOUNT_JSON。

.env 和 .env.* 已被仓库根 .gitignore 忽略；不要把 JSON 密钥放进仓库。

Google Sheets 会批量更新以下标签页：

- accounts_latest
- account_history
- posts_latest
- post_history
- runs

每次同步会根据 SQLite 重写这些表的已用数据，保证同日重复运行不会增加重复行。

## 命令

手动完整采集：

    '/Users/pengman/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node' '/Users/pengman/gengrowth-ops/inbox-pengman/04-production/00-evergreen-workflows/tiktok-public-capture/collect_tiktok_public_data.mjs'

只用已有原始数据回放并测试输出：

    '/Users/pengman/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node' '/Users/pengman/gengrowth-ops/inbox-pengman/04-production/00-evergreen-workflows/tiktok-public-capture/collect_tiktok_public_data.mjs' --from-raw

安装 launchd：

    '/Users/pengman/gengrowth-ops/inbox-pengman/04-production/00-evergreen-workflows/tiktok-public-capture/install_launchd.sh'

卸载 launchd：

    '/Users/pengman/gengrowth-ops/inbox-pengman/04-production/00-evergreen-workflows/tiktok-public-capture/uninstall_launchd.sh'

查看状态：

    launchctl print gui/$(id -u)/com.gengrowth.tiktok-public-capture

强制测试一次定时入口，不受当前时间限制：

    '/Users/pengman/gengrowth-ops/inbox-pengman/04-production/00-evergreen-workflows/tiktok-public-capture/run_scheduled.sh' --force

查看日志：

    tail -n 100 '/Users/pengman/gengrowth-ops/inbox-pengman/04-production/00-evergreen-workflows/tiktok-public-capture/logs/launchd.stdout.log'
    tail -n 100 '/Users/pengman/gengrowth-ops/inbox-pengman/04-production/00-evergreen-workflows/tiktok-public-capture/logs/launchd.stderr.log'

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
