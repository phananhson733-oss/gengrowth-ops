# GenGrowth Ops

团队运营协作仓库。

## 目录说明

### 从 wiki 自动同步（只读参考）

这些目录的内容从 `gengrowth-wiki` 自动同步过来，**不要直接修改**，改了也会被下次同步覆盖。

| 目录 | 说明 |
|---|---|
| `docs/03-marketing/` | 核心工作区：SEO、GEO、社媒策略、营销框架 |
| `内容资产/` | 已发布内容库，了解内容调性 |
| `docs/06-shared/assets/brand/` | 品牌素材，内容制作必用 |
| `参考资料/产品分析/` | 竞品分析、Ahrefs 数据 |
| `参考资料/tool-guides/` | 工具使用指南 |
| `docs/04-programs/` | 项目规划和执行计划 |
| `每日日报/` | 公开资料整理输出，行业信息参考 |
| `docs/05-governance/account-access/` | 账号注册 Playbook |
| `docs/05-governance/people-ops/policies/` | 公司政策、入职标准 |
| `task-collab/` | 任务协作 |

### 运营工作区

| 目录 | 用途 |
|---|---|
| `inbox/` | **所有写入的唯一入口**，提交后机器人自动分拣 |
| `onboarding/` | 入职引导文档 |
| `templates/` | Obsidian 模板（自动生成 frontmatter） |

## 提交流程

1. 打开 Obsidian → 用模板新建文件（写到 `inbox/`）
2. 写完按 **F5** 提交
3. 机器人自动搬运到目标目录（或开 PR 等审批）

## 多电脑同步

这是多人协作仓库，同一个人也可能在多台电脑上打开。每台电脑都应配置 Obsidian Git：

- 自动提交：1 分钟
- 自动 pull：1 分钟
- 自动 push：1 分钟
- 打开 Obsidian 时自动 pull

Obsidian 没打开时，插件不会运行；常用电脑建议加后台兜底：

```bash
bash scripts/obsidian-vault-git-sync.sh --verbose
```

这条命令会优先调用 sibling `gengrowth-wiki/tools/scripts/obsidian-vault-git-sync.py`，同步本机的 wiki / ops 仓库。

## 注意

- **只往 inbox/ 写文件**，不要直接改同步过来的目录
- 遇到同步冲突截图找 wzb
