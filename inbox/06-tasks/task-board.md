---
title: Task 协同看板
date: 2026-03-06
updated: 2026-05-27
type: plan
version: v2.0
status: active
owner: Ma Boyang
tags:
  - task
  - kanban
  - tasks-plugin
aliases:
  - 任务看板
  - task-board
---

# Task 协同看板

> 本看板聚合 `inbox/06-tasks/tasks/` 下的所有任务。
> （v2.0：从只读镜像目录 `task-collab/` 迁入 `inbox/`，避免 wiki sync 覆盖导致的冲突。）

## 状态约定

- `[ ]`：待开始（Todo）
- `[/]`：进行中（In Progress）
- `[x]`：已完成（Done）
- `[-]`：已取消（Cancelled）

## 待开始

```tasks
folder includes inbox/06-tasks/tasks
status.type is TODO
sort by due
sort by priority reverse
```

## 进行中

```tasks
folder includes inbox/06-tasks/tasks
status.type is IN_PROGRESS
sort by due
```

## 已逾期

```tasks
folder includes inbox/06-tasks/tasks
not done
due before today
sort by due
```

## 未来 7 天到期

```tasks
folder includes inbox/06-tasks/tasks
not done
due before in 7 days
sort by due
```

## 本周完成

```tasks
folder includes inbox/06-tasks/tasks
done
done after start of this week
sort by done reverse
```
