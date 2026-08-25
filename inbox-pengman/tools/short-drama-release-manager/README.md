# 短剧发行管理同步

Google Sheets 是唯一录入源；本工具把账号台账、发布记录和选剧池单向同步到飞书多维表格。飞书中的改动不会写回 Google。

## 运行方式

- `sync_shortdrama_to_feishu.mjs --google-canary`：Google 单格写入和读回验证，验证后恢复空白。
- `sync_shortdrama_to_feishu.mjs --setup-google`：把采集数据改为实时引用，并安装发布状态和账号粉丝公式。
- `sync_shortdrama_to_feishu.mjs --setup-feishu`：建立短剧发行管理多维表格和三张数据表。
- `sync_shortdrama_to_feishu.mjs --canary`：每张有数据的表写入一行、读回并删除。
- `sync_shortdrama_to_feishu.mjs --sync`：全量重建三张飞书表的数据。

首次启用 `IMPORTRANGE` 如果 Google 显示 `#REF!`，在短剧发行管理表的“采集数据”标签页点一次“允许访问”。

定时任务每天按 Mac 本地时间 10:30 运行。安装入口：`install_launchd.sh`。
