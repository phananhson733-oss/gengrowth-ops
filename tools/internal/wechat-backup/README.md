---
title: 微信备份工具
date: 2026-04-16
updated: 2026-04-17
type: note
tags:
  - wechat
  - backup
  - tool
aliases:
  - wechat backup tool
  - 微信群聊备份工具
---

# 微信备份工具

这个工具不修改 `tools/external/wechat-cli/` 的源码，只在外面包一层本地备份脚本，把指定微信群聊按天导出到 `参考资料/微信备份/`。

## 固定路径

- 外部仓库：`tools/external/wechat-cli/`
- 工具目录：`tools/internal/wechat-backup/`
- 备份输出：`参考资料/微信备份/`

## 本轮包含

1. 指定群聊白名单
2. 每日 JSON 备份
3. 每日 Markdown 备份
4. 索引页 `index.md`
5. macOS `launchd` 自动定时
6. 每日规则总结
7. 可喂给终端 LLM 的 `summary-prompt.md`

## 本轮不包含

1. 自动重签名微信

## 初始化前提

先确认：

1. 终端已经开启“完全磁盘访问权限”
2. 已经准备好本地运行依赖
3. 按低风险顺序初始化

先安装 `wechat-cli` 的本地运行依赖：

```bash
bash tools/internal/wechat-backup/setup-wechat-cli.sh
```

推荐顺序：

```bash
sudo bash tools/internal/wechat-backup/run-wechat-cli.sh init
```

如果这里直接成功，就继续用，不做额外动作。

如果这里报 `task_for_pid`，停止，不自动继续。先确认是否接受重新签名微信。

初始化成功后，收紧密钥文件权限：

```bash
chmod 600 ~/.wechat-cli/all_keys.json
```

## 配置白名单

编辑：

`tools/internal/wechat-backup/groups.txt`

每行一个群聊名称，例如：

```text
项目群A
增长复盘群
```

## 执行备份

默认备份“今天”：

```bash
bash tools/internal/wechat-backup/run-backup.sh
```

指定日期：

```bash
bash tools/internal/wechat-backup/run-backup.sh --date 2026-04-16
```

如果只是想触发“今天”的备份 runner，也可以用：

```bash
bash tools/internal/wechat-backup/run-backup-today.sh
```

## 执行总结

基于某天已经备份好的 JSON，生成一份可直接查看的规则总结：

```bash
bash tools/internal/wechat-backup/run-summary.sh --date 2026-04-16
```

会在当天目录下额外生成：

1. `daily-summary.md`
2. `summary-prompt.md`

如果你后面想通过终端里的 LLM 再做一版更自然的总结，可以把 prompt 喂给任意命令行模型工具：

```bash
bash tools/internal/wechat-backup/run-summary.sh --date 2026-04-16 --llm-command 'your-llm-cli'
```

如果 `--llm-command` 成功返回文本，还会多生成：

3. `daily-summary-ai.md`

## 备份结果

输出目录：

`参考资料/微信备份/YYYY-MM-DD/`

包含：

1. `index.md`
2. `<群名>.md`
3. `<群名>.json`
4. `daily-summary.md`
5. `summary-prompt.md`
6. `daily-summary-ai.md`（仅在提供 `--llm-command` 时生成）

日志目录：

`参考资料/微信备份/logs/`

## 自动定时

推荐在 macOS 上用 `launchd`，比 `cron` 更稳，也更适合用户目录下的任务。

默认安装为每天 `01:30` 执行一次：

```bash
bash tools/internal/wechat-backup/install-launchd.sh
```

指定时间安装，例如每天 `08:15`：

```bash
bash tools/internal/wechat-backup/install-launchd.sh --time 08:15
```

安装后会写入：

`~/Library/LaunchAgents/com.gengrowth.wechat-backup.plist`

并把日志写到：

`参考资料/微信备份/logs/launchd.stdout.log`  
`参考资料/微信备份/logs/launchd.stderr.log`

如果你想立刻手动触发一次定时任务：

```bash
launchctl kickstart -k gui/$(id -u)/com.gengrowth.wechat-backup
```

如果你想移除自动定时：

```bash
bash tools/internal/wechat-backup/uninstall-launchd.sh
```

## 如果你想手动调用底层入口

可以直接这样跑：

```bash
bash tools/internal/wechat-backup/run-wechat-cli.sh --help
```
