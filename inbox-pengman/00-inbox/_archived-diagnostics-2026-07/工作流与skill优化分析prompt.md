---
title: 工作流与 Skill 优化分析 Prompt
created: 2026-07-23
purpose: 为 GenGrowth 社媒内容运营工作流梳理冗余、填补空白、规划通用化路径
---

# 工作流与 Skill 优化分析 Prompt

## 背景与目标

我是 GenGrowth 的内容运营，当前主要负责 AstrologyWiki 的 TikTok 四账号矩阵内容生产。我需要你帮我：

1. **梳理当前工作流与 skill 的冗余或重复**
2. **识别流程断点和数据缺口**
3. **设计可复用到其他产品的通用工作流**
4. **规划历史文稿库和竞品分析反哺机制**

## 我的理想工作流

```
了解产品
  ↓
了解竞品（持续更新的竞品爆款分析）
  ↓
确定产品账号对应 skill
  ↓
生成选题（基于竞品分析 + 产品定位 + 历史表现）
  ↓
制作内容
  ↓
数据复盘分析（反哺到竞品分析和选题生成）
  ↓
循环：继续制作
```

### 额外需求

- **历史文稿库**：有个地方能存放和查询我们的历史文稿，用于去重、参考和学习
- **竞品爆款分析库**：能持续收集竞品爆款内容，分析其表现，并反哺到我们的选题制作
- **通用化设计**：未来这套流程不止服务 AstrologyWiki，还要能复用到其他产品

## 当前资产清单

### 已安装的 Skills

**通用社媒 Skills（位于 `~/gengrowth-ops/inbox-pengman/skills-staging/`）：**
1. `gengrowth-social` - 多平台内容策略、内容支柱、日历、Social Listening、竞品拆解
2. `gengrowth-tiktok-strategist` - TikTok 平台原生化审查、Hook 优化、趋势参与
3. `gengrowth-social-media-analyzer` - 帖子/账号表现分析、指标计算、Benchmark 比对

**产品特定 Skill：**
4. `astrologywiki-social-workflow` - AstrologyWiki 每日选题生成、互联网调研门槛、内容路由

### 当前工作流程文档

**核心流程（`~/gengrowth-ops/inbox-pengman/04-production/`）：**
- `00-evergreen-workflows/weekly-rolling-content-production-sop.md` - 周度产能、内容池、Batch、热点插入规则
- `00-evergreen-workflows/daily-content-assistant-sop.md` - 日执行卡
- `00-evergreen-workflows/统一内容 Brief 模板.md` - 单条内容 Brief 标准
- `00-evergreen-workflows/内容路由与规则调用说明.md` - 账号路由规则
- `00-evergreen-workflows/Pengman 与 AI 内容润色协作说明.md` - 双模型实验协作

**策略文档：**
- `01-strategy-and-platform-research/four-account-tiktok-content-playbook.md` - 四账号定位、参考账号、内容方向、形式、钩子公式

**生产记录：**
- `04-weekly-content-plans/` - 周度计划（Publishing This Week / Producing for Next Week）
- `06-daily-content-recommendations/` - 临时候选、Hot 证据
- `07-content-production/` - 单条内容主生产记录（content_id, Brief, 脚本, 素材, content_stage）
- `05-weekly-published-content-digests/` - 发布链接、公开数据、decision / next_test

### 数据来源

**Google Sheets（通过 Apps Script Web App 访问）：**

1. **人工标注数据**
   - URL: `https://script.google.com/macros/s/AKfycbyBKT52vgqfnZN0opPL1z0aiB8gom3WlAGbuyyi2_bmSAF6a5khbLS_CYwUr0XseUxSOw/exec`
   - 工作表: `account_links`, `account_analysis`, `video_links`, `video_analysis`

2. **TikTok 自动抓取**
   - URL: `https://script.google.com/macros/s/AKfycbyKsZCN5G8Ik-9bbh26GHPxfPflusxUy-13hNy9h-sb3qVdqf7KUoJZYvPTApapbKFS/exec`
   - 工作表: `accounts_latest`, `account_history`, `posts_latest`, `post_history`, `runs`
   - **已知问题**: `posts_latest` 每行被截断在 200 字节，caption 后的列全部丢失，分析帖子表现必须用 `post_history`

3. **固定参考账号 CSV**
   - URL: `https://script.google.com/macros/s/AKfycbyunRIRkIyxEFRUIPstyKFPebAE2rBZB8CBFmoTWzJkhBl-ugAsakxHwZipbT4hTOgANg/exec`

### 本地工作目录

- **工作文件根目录**: `~/gengrowth-ops/inbox-pengman/`
- **历史参考**: `~/gengrowth-ops/inbox-pengman/00-inbox/近期 TikTok 视频思路与数据整理.md`
- **调研资料**: `~/gengrowth-ops/inbox-pengman/05-调研资料/`

## 分析维度

请从以下角度分析当前配置：

### 1. 冗余识别
- 哪些 skill 的功能有重叠？
- 哪些工作流文档在记录相似的规则？
- `astrologywiki-social-workflow` 与三个通用 skill 的边界是否清晰？

### 2. 断点识别
- 从"了解竞品"到"生成选题"之间缺少什么？
- 从"数据复盘"到"反哺选题"的循环是否闭合？
- 历史文稿库在哪里？如何查询和去重？
- 竞品爆款分析的持续更新机制在哪里？

### 3. 数据流诊断
- Google Sheets 的三个数据源分别服务什么环节？
- `post_history` 的数据如何流入 `gengrowth-social-media-analyzer`？
- 分析结果的 `decision / next_test` 如何反哺到下一轮选题？
- 竞品数据（人工标注 + 固定参考 CSV）如何被 `gengrowth-social` 的竞品拆解功能使用？

### 4. 通用化设计
- 如果要为新产品（如健身 App、教育产品）复用这套流程，需要：
  - 哪些 skill 保持通用？
  - 哪些部分需要产品特定配置？
  - 如何通过 `product_context` / `account_context` / `analysis_context` 注入差异？

### 5. 优化建议
- 应该合并哪些 skill 或文档？
- 应该新增哪些 skill 来填补断点？
- 历史文稿库的理想形态是什么？（文件系统 / 数据库 / Google Sheets / Memory？）
- 竞品爆款分析反哺的理想工作流是什么？

## 输出要求

请输出：

### A. 当前状态诊断
- 工作流程图（Mermaid 格式）
- 冗余清单（列出重复功能和建议处理方式）
- 断点清单（列出缺失环节和影响）
- 数据流图（展示 Google Sheets → Skills → 工作流 → 产出 的流动）

### B. 优化方案
- 推荐的 skill 架构（保留 / 合并 / 新增）
- 历史文稿库方案（存储位置、查询接口、去重逻辑）
- 竞品分析反哺机制（数据采集 → 分析 → 反哺选题的闭环）
- 通用化改造路径（如何让这套流程服务多个产品）

### C. 实施步骤
- 优先级排序（P0 必须修复的断点 / P1 高价值优化 / P2 长期改进）
- 每个步骤的具体行动（文件迁移 / skill 创建 / 工作流调整）
- 风险提示（可能影响现有 AstrologyWiki 生产的改动）

## 约束条件

1. **不破坏现有生产**：AstrologyWiki 的四账号矩阵正在运行，任何改动不能打断当前周度生产
2. **遵循单一源原则**：canonical source 在 `~/gengrowth-ops/inbox-pengman/skills-staging/`，不复制业务逻辑
3. **保持产品无关**：通用 skill 不包含产品信息，产品差异通过运行时 context 输入
4. **写权限边界**：只能写入 `~/gengrowth-ops/inbox-pengman/**`，正式迁移到 `~/gengrowth-ops/tools/internal/skills/` 需要 CEO 批准
5. **数据质量边界**：`posts_latest` 有截断问题，分析必须用 `post_history`；`account_history` 目前只有单日快照，不能判断增长趋势

## 示例问题

请在分析中回答：

1. 我现在想查"上个月我们发过哪些关于 Scorpio 的内容"，应该去哪里查？流程是什么？
2. 我发现竞品账号 @curatedastrology 有条视频爆了（500 万播放），我想分析它并生成类似选题，完整流程是什么？
3. 我要为新产品"健身 App"的 Instagram 账号复用这套流程，需要改动哪些文件？哪些可以直接继承？
4. 从"数据复盘"到"下周选题"的循环，目前哪些是人工判断、哪些是自动化、哪些完全断掉了？

## 补充说明

- 可以使用 MCP、Skills、Agent、Memory 等工具
- 倾向于文件系统 + Markdown 的轻量方案，而不是重数据库
- 希望流程文档化、可追溯、可审计
