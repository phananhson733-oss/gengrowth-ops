---
project: gengrowth-ops
type: framework
status: active
owner: Ma Boyang
updated: 2026-05-27
---

# Task 协同模块（Ops 工作台版）

本目录用于 Ops 的日常任务管理与执行跟踪。

> **为什么从 `task-collab/` 迁到这里？**
> `task-collab/` 是 wiki → ops 的单向 `rsync --delete` 只读镜像，每次 wiki sync 都会用源头版本覆盖本地编辑。Ops 在那里改任务进度必然和 sync 冲突（Obsidian Git 每分钟自动 pull+merge）。
> `inbox/` 不在 sync 镜像里，是 Ops 专属可写工作台 —— 任务在这里编辑永远不会被覆盖、不会和 wiki sync 撞车。

## 目录结构

```text
inbox/06-tasks/
├── README.md
├── task-board.md          # 聚合看板入口
├── templates/
│   └── task-template.md
└── tasks/
    └── YYYY-MM-DD-<topic>-task.md
```

## 使用规则

1. 每个任务一个独立文档，放在 `inbox/06-tasks/tasks/`。
2. 文件命名 `YYYY-MM-DD-<topic>-task.md`。
3. 单任务文档内保留 1 条主任务行（`- [ ] ... #task`）和验收标准。
4. 统一在 `inbox/06-tasks/task-board.md` 查看聚合看板。

## 入口

- 看板入口：`inbox/06-tasks/task-board.md`
- 新任务模板：`inbox/06-tasks/templates/task-template.md`

> 注意：本目录在 inbox 下，按约定归 Ops 专属。其他人若要看任务，看这里即可；但不要在本地直接编辑（保持单一写手，零冲突）。
