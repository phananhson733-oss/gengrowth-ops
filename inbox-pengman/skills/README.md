# GenGrowth 海外社媒 Skill 集成使用指南

> **Canonical source（单一源）：** `~/gengrowth-ops/inbox-pengman/skills/`
> **Claude Code：** `~/.claude/skills/gengrowth-*` → symlink 指向 canonical source
> **Codex：** `~/.codex/skills/gengrowth-*` → symlink 指向 canonical source
> **建议正式 canonical 路径：** `~/gengrowth-ops/tools/internal/skills/`（需 CEO 批准迁移）

### 架构原则

```
┌─────────────────────────────────────────────┐
│  Canonical Source (single truth)            │
│  ~/gengrowth-ops/inbox-pengman/             │
│    skills/gengrowth-*/              │
└───────────┬─────────────────┬───────────────┘
            │                 │
     symlink│          symlink│
            ▼                 ▼
   ~/.claude/skills/    ~/.codex/skills/
   gengrowth-*          gengrowth-*
```

- 编辑 canonical source 即可同时更新两个平台
- 不复制两套业务逻辑
- 平台差异通过 SKILL.md 末尾的 `## Platform Compatibility` 段落处理
- 无平台专属 fork 或 override 文件

---

## 概览

本目录集中维护通用社媒 Skill 与产品专项 Skill。通用 Skill 保持产品无关，AstrologyWiki 专项规则单独存放：

| Skill | 用途 | 来源 |
|-------|------|------|
| `gengrowth-social` | 多平台内容策略、内容支柱、日历、复用、Social Listening | coreyhaines31/marketingskills |
| `gengrowth-tiktok-strategist` | TikTok 平台原生化审查、Hook 优化、趋势参与 | msitarzewski/agency-agents |
| `gengrowth-social-media-analyzer` | 帖子/账号表现分析、指标计算、Benchmark 比对 | alirezarezvani/claude-skills |
| `astrologywiki-social-workflow` | AstrologyWiki 候选研究、Evidence Preflight、账号路由和表达边界 | Pengman 工作区现行规则 |
| `miraa-heygen-video` | Miraa AI Host 的 HeyGen 生成、QC 与交接边界 | Pengman 视频工作流研究与试验 |
| `weekly-content-plan` | 周计划结构与周级执行辅助 | Pengman 工作区维护 |
| `learn-content-preferences` | 用四选一训练偏好、积累证据并在人工确认后定点更新产品 Skill | Pengman 本地 Preference Studio |

三个 `gengrowth-*` Skill 保持产品无关，产品差异通过运行时 context 输入解决；`astrologywiki-social-workflow` 明确属于产品专项 Skill，不反向污染通用核心。

---

## A. 各 Skill 能力说明

### `gengrowth-social`

**适合用于：**

- 建立 3–5 个内容支柱（Content Pillars）
- 规划海外平台内容方向（LinkedIn、X、Instagram、TikTok、Facebook、YouTube）
- 将长内容复用为 TikTok、Reels、Shorts、LinkedIn、X 等版本
- 生成短视频 Hook 和脚本框架
- 制作内容日历
- 规划评论互动策略与 Social Listening
- 拆解竞品内容模式（Reverse Engineering）
- Carousel/轮播图内容架构

**不负责：**

- 直接读取真实账号后台数据
- 自动确认内容已经发布
- 自动发布、评论或私信
- 替代产品业务规则

**包含的参考文件：**

- `references/platforms.md` — 各平台策略指南
- `references/platform-limits.md` — 字符数、Hashtag 限制
- `references/short-form-video.md` — Hook 库、脚本模板、视频结构
- `references/carousel-frameworks.md` — 轮播图五种叙事架构
- `references/post-templates.md` — 各平台帖子模板
- `references/listening.md` — Social Listening 工作流
- `references/listening-sources-template.md` — Listening 来源配置模板
- `references/reverse-engineering.md` — 竞品内容拆解方法

---

### `gengrowth-tiktok-strategist`

**适合用于：**

- 从 TikTok 原生视角审查选题和脚本
- 检查前 3 秒 Hook（视觉、口播、文字三层）
- 判断内容适合短视频、Photo 还是 Carousel
- 规划趋势参与方式（Trending Sound、效果、挑战）
- 设计评论、Duet、Stitch 和 UGC 方向
- 将内容改造成 TikTok-native（不是机械跨平台搬运）
- 提出需要测试的形式和表达
- Cross-platform 差异化建议（vs Reels/Shorts）

**重要说明：**

- 不能仅凭通用经验判断某个账号一定会增长
- 平台算法、趋势和 Benchmark 必须实时核验
- 上游固定数值（8%互动率、70%完播率、15%月增长等）是**上游参考默认值**，不能直接成为账号 KPI
- 不自动发布、不修改外部账号

**文件结构：**

- `SKILL.md` — 封装后的标准 Skill 文件
- `UPSTREAM.md` — 未修改的上游原文（来源标注见 PROVENANCE.md）

---

### `gengrowth-social-media-analyzer`

**适合用于：**

- 分析帖子和账号表现（engagement rate, CTR, shares, saves）
- 计算 ROI（需提供 ad spend）
- 找出 Top/Bottom 内容
- 比较不同主题、形式和账号
- 对比平台 Benchmark
- 输出有证据的优化建议
- 为后续内容策略提供数据输入

**重要说明：**

- 只能分析实际提供的数据（不连接账号后台）
- 公开数据不能替代后台完播率、平均观看时长、主页访问和点击
- 不应对不同观察窗口的数据做不公平比较
- 内置行业 Benchmark（`references/platform-benchmarks.md`）标注为"2024-2025"，实际来源未经独立核验，仅作参考
- Engagement Value Estimation 中的美元估值无引用来源，仅作说明性示意

**包含的文件：**

- `SKILL.md` — 主指令
- `HOW_TO_USE.md` — 调用示例
- `references/platform-benchmarks.md` — 平台 Benchmark（已加注时效性标注）
- `scripts/analyze_performance.py` — 性能分析类（纯计算，无网络）
- `scripts/calculate_metrics.py` — 指标计算类（纯计算，无网络）
- `assets/sample_input.json` — 示例输入
- `assets/expected_output.json` — 示例输出

---

## B. 推荐调用顺序

```
social-media-analyzer
→ 找出账号真实表现和内容模式（需提供实际数据）

social
→ 根据目标、受众和已验证模式设计内容支柱与内容组合

tiktok-strategist
→ 对准备投放 TikTok 的内容进行平台原生化审查

人工确认
→ 决定是否进入正式生产和发布

发布后重新进入 social-media-analyzer
→ 形成下一轮 decision / next_test
```

---

## C. 通用运行时输入契约

这三个 Skill 不包含任何产品信息。使用时必须提供以下 context：

```yaml
product_context:
  product_name: ""        # 例: AstrologyWiki
  product_description: "" # 一句话描述
  target_market: ""       # 例: 北美英语占星爱好者
  target_audience: ""     # 细分人群
  primary_conversion_goal: "" # 例: 工具页使用
  approved_landing_pages: [] # 可挂链接的页面
  brand_voice: ""         # 品牌调性
  prohibited_claims: []   # 不允许的表述
  compliance_constraints: [] # 合规限制

account_context:
  platform: ""            # instagram / tiktok / x / linkedin / youtube
  account_name: ""        # @handle
  account_role: ""        # 该账号在矩阵中的定位
  current_positioning: "" # 当前定位描述
  current_followers: 0    # 当前粉丝数
  content_formats: []     # 当前使用的内容形式
  posting_capacity: ""    # 每周可发布数量
  production_resources: "" # 团队能力
  timezone: ""            # 发布时区

analysis_context:
  date_range: ""          # 分析时间范围
  historical_posts: []    # 实际帖子数据
  metrics_available: []   # 可获取的指标
  metrics_missing: []     # 无法获取的指标
  competitor_accounts: [] # 竞品账号
  current_goal: ""        # 本次分析目标
  decision_required: ""   # 需要做出的决策
```

**规则：**

- 缺少数据时必须标注 `待补数据` / `待确认`
- 不能根据文件名、排期或计划日期推断已经发布
- 不能把小样本方向性信号写成长期结论
- 账号分析至少区分：已核验事实 / 运营推断 / 待确认
- 不同产品只需更换 context，不复制 Skill

## D. AstrologyWiki 使用说明

AstrologyWiki 仅作为使用案例，**不写入 Skill 本体**。

### 使用前置条件

调用这三个 Skill 处理 AstrologyWiki 内容时，必须先读取以下权威文件：

1. 当前周计划：`inbox-pengman/02-生产/04-weekly-content-plans/`
2. 单条内容主生产记录：`inbox-pengman/02-生产/02-content-production/`
3. 最近发布合集：`inbox-pengman/02-生产/03-data-review/`
4. 当前账号分工与内容发布指南（当前只启用官号与 Miraa）
5. 当前有效的 AstrologyWiki 社媒 Skill/SOP（`astrologywiki-social-workflow` 与滚动周 SOP）
6. TikTok 抓取数据和实际后台数据
7. 当前公开来源和竞品证据

### 权威顺序

```
AstrologyWiki 现有业务规则和周计划
> 单条内容真实状态
> 当前数据和证据
> 新安装的通用 Skill 建议
```

### 新 Skill 不可以：

- 自动将 Idea 提升为 `selected`
- 修改已经锁定的周计划
- 强迫所有历史账号每天发布或自行恢复暂停账号
- 根据通用内容比例覆盖当前账号定位和实际产能
- 根据固定 Benchmark 判断成功或失败
- 自动发布内容

---

## E. AstrologyWiki 使用示例

### 示例 1：账号内容方向分析

```
请使用 gengrowth-social-media-analyzer 和 gengrowth-social 分析以下账号表现。

product_context:
  product_name: AstrologyWiki
  target_market: 北美英语占星爱好者
  primary_conversion_goal: 工具页使用
  brand_voice: 反玄学、心理学+真实天文
  prohibited_claims: ["算命", "转运", "保证准确"]

account_context:
  platform: tiktok
  account_name: @astrologywiki
  current_followers: [当前粉丝数]
  posting_capacity: 每周3-5条

analysis_context:
  date_range: 2026-07-01 至 2026-07-21
  historical_posts: [通过 curl 获取，见下方数据获取方式]
  metrics_available: [views, likes, comments, favorites, shares]
  metrics_missing: [完播率, 主页访问, 点击]
  current_goal: 找出有效内容模式

数据获取方式：
  # 帖子指标（必须用 post_history，posts_latest 有截断 bug）
  curl -sL "https://script.google.com/macros/s/AKfycbyKsZCN5G8Ik-9bbh26GHPxfPflusxUy-13hNy9h-sb3qVdqf7KUoJZYvPTApapbKFS/exec?action=getData&sheet=post_history"
  # 账号概况
  curl -sL "https://script.google.com/macros/s/AKfycbyKsZCN5G8Ik-9bbh26GHPxfPflusxUy-13hNy9h-sb3qVdqf7KUoJZYvPTApapbKFS/exec?action=getData&sheet=accounts_latest"

请输出：
1. 当前账号定位判断
2. 有效主题 / 有效形式 / 有效 Hook
3. 评论需求分析
4. Do More / Do Less
5. 3-5 个内容支柱建议
6. 下一轮实验建议
7. 置信度和数据缺口
```

### 示例 2：TikTok 内容原生化审查

```
请使用 gengrowth-tiktok-strategist 审查以下已确认选题。

product_context:
  product_name: AstrologyWiki
  brand_voice: 反玄学、心理学+真实天文

account_context:
  platform: tiktok
  account_name: @astrologywiki

选题/脚本：
[粘贴选题或脚本内容]

请输出：
1. 目标受众判断
2. 前3秒问题诊断
3. 视觉、口播和文字三层 Hook 建议
4. 推荐形式（短视频/Photo/Carousel）
5. 节奏建议
6. CTA 建议
7. 评论触发点
8. 与 Reels/Shorts 版本的区别
9. 风险提示
10. 建议修改（不自动修改正式稿）
```

### 示例 3：周度内容策略复盘

```
请使用 gengrowth-social-media-analyzer 和 gengrowth-social 复盘本周发布表现。

product_context:
  product_name: AstrologyWiki
  primary_conversion_goal: 工具页使用

account_context:
  platform: tiktok
  account_name: @astrologywiki
  posting_capacity: 每周3-5条

analysis_context:
  date_range: 2026-W30
  historical_posts: [通过 curl post_history 获取]
  metrics_available: [views, likes, comments, favorites, shares]
  metrics_missing: [完播率, 点击率]
  current_goal: 下周内容方向决策

请输出：
1. 已核验结果（有数据支撑）
2. 方向性信号（样本小但值得关注）
3. 暂不能判断（数据不足）
4. 应保持的内容模式
5. 应减少的内容模式
6. 下周 2-4 个实验
7. 每个实验的假设、冻结变量、成功阈值和失败阈值
```

---

## F. 未来其他产品接入方式

当 GenGrowth 新增产品需要使用这三个 Skill 时：

1. **不复制 Skill** — 三个 Skill 保持单一实例
2. **新建产品 context** — 为该产品编写 `product_context`
3. **新建账号 context** — 为每个社媒账号编写 `account_context`
4. **提供真实历史数据** — 通过 `analysis_context.historical_posts` 输入
5. **产品业务规则在产品层定义** — Skill 只提供建议，产品规则决定执行
6. **保持三层分离**：Skill 层（通用能力）/ 产品规则层（业务逻辑）/ 数据层（真实指标）

---

## G. 供应链与安全信息

详见 `PROVENANCE.md`。

### 安全审查结论

| Skill | 越权指令 | 凭证请求 | 自动发布 | 破坏性命令 | 网络访问 | 风险等级 |
|-------|---------|---------|---------|-----------|---------|---------|
| gengrowth-social | 无 | 无 | 无 | 无 | 无 | 低 |
| gengrowth-tiktok-strategist | 无 | 无 | 无 | 无 | 无 | 低 |
| gengrowth-social-media-analyzer | 无 | 无 | 无 | 无 | 无（scripts 纯计算） | 低 |

### 注意事项

- `gengrowth-social` 的 `references/listening.md` 描述了通过 dev-browser 读取社交平台的工作流，但这是用户手动操作指南，Skill 本身不会自动执行
- `gengrowth-social-media-analyzer` 的 Python scripts 仅导入 `typing` 标准库，无外部依赖
- 所有 Benchmark 数据标注为上游参考默认值，使用前需独立核验

---

## H. 安装迁移说明

当前 canonical source 在 `inbox-pengman/skills/`（受限于写权限）。两个平台已通过 symlink 注册：

```
~/.claude/skills/gengrowth-social → ~/gengrowth-ops/inbox-pengman/skills/gengrowth-social
~/.claude/skills/gengrowth-tiktok-strategist → ~/gengrowth-ops/inbox-pengman/skills/gengrowth-tiktok-strategist
~/.claude/skills/gengrowth-social-media-analyzer → ~/gengrowth-ops/inbox-pengman/skills/gengrowth-social-media-analyzer

~/.codex/skills/gengrowth-social → (同上)
~/.codex/skills/gengrowth-tiktok-strategist → (同上)
~/.codex/skills/gengrowth-social-media-analyzer → (同上)
```

**迁移到正式路径时只需：**

1. CEO 审批
2. `mv skills/gengrowth-* ~/gengrowth-ops/tools/internal/skills/`
3. 更新 symlinks：
   ```bash
   for s in gengrowth-social gengrowth-tiktok-strategist gengrowth-social-media-analyzer; do
     ln -sfn ~/gengrowth-ops/tools/internal/skills/$s ~/.claude/skills/$s
     ln -sfn ~/gengrowth-ops/tools/internal/skills/$s ~/.codex/skills/$s
   done
   ```
4. 两个平台无需额外注册步骤（symlink 即注册）

**需要由谁完成：** 具有 `tools/internal/skills/` 写权限的人员（CEO / 仓库管理员）
