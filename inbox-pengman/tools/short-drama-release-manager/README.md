# 短剧发行管理同步

> v5 Runner 说明：`shortdrama_ctl.mjs`、`run_scheduled.sh`和`com.gengrowth.shortdrama-sync`是新流程；下方`sync_shortdrama_to_feishu.mjs`及旧 label 仅保留为历史证据，不得用于 v5 正式同步。

## v5 内部调度安全边界

安装器在当前用户的`~/Library/Application Support/GenGrowth/shortdrama-sync/internal.capability`创建并保留 0600、256-bit 随机 capability。plist 只保存该固定文件路径；ticker 读取后仅通过子进程环境传给 CLI，仓库和 plist 均不保存 capability 值。CLI 会重新检查文件类型、symlink、权限、大小并进行常量时间比较，旧 marker 或手工伪造参数不能获得内部调度身份。

此机制的边界是 macOS 用户账户隔离：它防止 Social 会话、普通 CLI 和其他账户伪造 launchd 内部命令，不承诺防御已取得同一 macOS 用户权限的进程。安装、恢复或排障均不得复制 capability 到日志、聊天、plist 或版本库。

迁移 plan/schema receipt/verification 只读写固定的`inbox-pengman/output/short-drama-release-manager/migrations/`，输出文件不可覆盖。`migrate apply`必须同时提供独立 expected digest；data/presentation/sequences 还必须提供独立 schema receipt，sequences 另需独立 verification 文件字节 SHA-256。

Google Sheets 是唯一录入源；本工具把账号台账、发布记录和选剧池单向同步到飞书多维表格。飞书中的改动不会写回 Google。

## 运行方式

- `sync_shortdrama_to_feishu.mjs --google-canary`：Google 单格写入和读回验证，验证后恢复空白。
- `sync_shortdrama_to_feishu.mjs --setup-google`：把采集数据改为实时引用，并安装发布状态和账号粉丝公式。
- `sync_shortdrama_to_feishu.mjs --setup-feishu`：建立短剧发行管理多维表格和三张数据表。
- `sync_shortdrama_to_feishu.mjs --canary`：每张有数据的表写入一行、读回并删除。
- `sync_shortdrama_to_feishu.mjs --sync`：全量重建三张飞书表的数据。

首次启用 `IMPORTRANGE` 如果 Google 显示 `#REF!`，在短剧发行管理表的“采集数据”标签页点一次“允许访问”。

定时任务每天按 Mac 本地时间 10:30 运行。安装入口：`install_launchd.sh`。
