# 每日工作驾驶舱

> **快速入口**：打开后知道今天该做什么、调用哪个 Skill、下一步是什么
>
> 完整系统说明 → 见 `00-inbox/系统使用说明.md`

---

## 📊 今天做什么？

| 星期 | 主要任务 | 调用 Skill | 说什么 |
|------|---------|-----------|--------|
| **周一** | 锁定全周选题（8 条） | `astrologywiki-social-workflow` Mode B | "按滚动周 SOP 建本周计划，我有 X 小时" |
| **周二** | 批量写脚本 | Mode A | "读本周计划，给我今天的执行卡，我有 X 小时" |
| **周三** | 轻形式制作（slideshow/photo） | Mode A | 同上 |
| **周四** | 重形式制作（AI 口播） | Mode A | 同上 |
| **周五** | 质检 + 排期 + 复盘 | Mode A + `social-media-analyzer` | 同上，复盘时切换 analyzer |
| **随时** | 热点评估 | Mode D | "评估这个热点：[链接]" |

---

## 🎯 Skill 快速触发

| 我想做什么 | 调用 | 怎么说 |
|-----------|------|--------|
| **周一生成选题** | `astrologywiki-social-workflow` Mode B | "按滚动周 SOP 建本周计划，我有 X 小时" |
| **每天推进内容** | `astrologywiki-social-workflow` Mode A | "读本周计划，给我今天的执行卡" |
| **评估热点** | `astrologywiki-social-workflow` Mode D | "评估这个热点：[链接/事件]" |
| **拆解竞品** | `gengrowth-social` | "拆解 [链接] 的 Hook、结构、话题" |
| **分析数据** | `social-media-analyzer` | "分析本周 8 条，输入：[粘贴数据]" |

---

## 💬 常用对话模板

### 周一生成选题
```
按滚动周 SOP 建本周计划。
本周可投入：X 小时
本周必须发布：无 / 具体内容
特别想做：无 / 具体方向
```

### 每天推进
```
读本周计划，给我今天的执行卡。
我今天可投入：X 小时。
```

### 写脚本
```
推进【content_id】。
先 Brief，再脚本。
```

### 确认脚本
```
确认采用这个版本，进入制作。
```

### 发布记录
```
已发布。
content_id：【ID】
链接：【真实链接】
```

### 热点评估
```
评估这个热点：【链接/事件】。
只告诉我是否值得进热点槽。
```

---

## 📁 文件位置速查

| 要找什么 | 去哪里 |
|---------|--------|
| 产品知识库 | `01-strategy-and-platform-research/` |
| 账号矩阵定位 | `four-account-playbook.md` |
| 本周计划 | `04-weekly-content-plans/2026-Www.md` |
| 单条内容主记录 | `07-content-production/YYYY-MM-DD/content_id.md` |
| 数据复盘 | `05-weekly-digests/YYYY-MM-DD.md` |
| 竞品数据 | Google Sheet `post_history` |
| 完整规则 | `weekly-rolling-sop.md` |

---

*最后更新: 2026-07-23*
"调用 gengrowth-social，
拆解这条领域爆款 [链接]：
- Hook / 结构 / 话题角度
- 目标受众
- 我们的产品可以如何切入这个话题"
```

---

### ③ 确定账号矩阵（首次设置，账号调整时）

**什么时候做**：新产品启动 / 账号策略调整时

**用什么 Skill**：`gengrowth-social`（账号策略设计）

**怎么和 AI 说**：
```
"基于产品 [产品名] 和竞品分析，
帮我设计 TikTok 账号矩阵策略。

背景：
- 产品定位：[从 product-context.md 复制]
- 竞品观察：[总结领域内账号类型和空白机会]
- 业务目标：品牌曝光 + 流量 + 转化

请设计：
- 需要几个账号（2-5 个）
- 每个账号的定位和差异化
- 内容支柱和禁止事项
- 每周产能分配
- 账号间如何互补

调用 gengrowth-social 的内容支柱框架"
```

**产出**：`four-account-playbook.md`（或 2-5 个账号）

---

### ④ 周一生成选题（批量生产起点）

**目标**：锁定全周 8 条选题 + 2 条机动库存

**用什么 Skill**：`astrologywiki-social-workflow` **Mode B**

**前置准备**（5 分钟）：
1. 查看竞品近 7 天爆款
2. 读最近一期 digest 的 `decision/next_test`
3. 确认本周可用时间

**怎么和 AI 说**：
```
"调用 astrologywiki-social-workflow Mode B，
生成本周选题池。

背景：
- 本周可用时间：20 小时
- 竞品观察：[填写爆款]
- 上周复盘：[从 digest 复制 next_test]
- 本周天象：[查日历]

输出：
- Evergreen 5 条 + Predictable 2 条 + Hot 1 条
- 每条包含：账号、形式、effort、batch_id、过期日"
```

**产出**：`04-production/04-weekly-content-plans/2026-W30 周度内容计划.md`

---

### ④ 周二写脚本（批量写稿）

**目标**：完成 Brief + 脚本

**用什么 Skill**：`astrologywiki-social-workflow` **Mode A**

**怎么和 AI 说**：
```
"调用 astrologywiki-social-workflow Mode A，
今天写本周 8 条内容的 Brief 和脚本。

按账号分组批量处理：
- @astrologywiki 2 条
- @ai.astrologer 2 条
- @casualastro 3 条

每条包含：Hook、核心承诺、要点、CTA、素材需求"
```

**产出**：单条主记录 `content_stage: scripted`

---

### ⑤ 周三-周四批量制作（按形式分 Batch）

**目标**：完成素材 + 剪辑

**用什么 Skill**：`astrologywiki-social-workflow` **Mode A**

**怎么和 AI 说**：

**周三 — 轻形式**（slideshow / photo）：
```
"调用 astrologywiki-social-workflow Mode A，
推进 batch-w30-slideshow 的 3 条内容。

AI 负责：
- 图片素材需求清单
- 字幕文件（SRT）
- 检查账号串号

我负责：制作、剪辑、封面"
```

**周四 — 重形式**（AI 口播）：
```
"调用 astrologywiki-social-workflow Mode A，
推进 batch-w30-voiceover 的 2 条 AI 口播。

AI 负责：
- AI 主播提示词
- B-roll 素材建议
- 事实核验

我负责：配音、剪辑、质检"
```

**产出**：单条主记录 `content_stage: edited`

---

### ⑥ 周五质检排期（最后检查）

**目标**：审核成片，确认发布时间

**用什么 Skill**：`astrologywiki-social-workflow` **Mode A**

**怎么和 AI 说**：
```
"调用 astrologywiki-social-workflow Mode A，
质检本周 8 条内容。

逐条检查：
✓ Hook 前 3 秒符合 TikTok 格式
✓ 账号语气无串号
✓ 事实准确
✓ CTA 自然
✓ 字幕关键词高亮

输出：
- 哪些 ready
- 哪些需要返工
- 库存是否达标"
```

**产出**：单条主记录 `content_stage: scheduled`

---

### ⑦ 发布 & 记录

**工具**：TikTok App（手动发布）

**用什么 Skill**：不需要

**怎么和 AI 说**（发布后）：
```
"今天发布了 2 条：
- scorpio-jealousy-001：[TikTok 链接]
- leo-new-moon-002：[TikTok 链接]

请更新主记录：
- content_stage: published
- 添加 published_url
- 记录发布时间"
```

---

### ⑧ 数据复盘（周五晚/周日）

**目标**：分析表现，写 `decision/next_test`

**数据在哪**：Google Sheet `post_history` 表

**用什么 Skill**：`social-media-analyzer`

**怎么和 AI 说**：

**步骤 1 — 获取数据**（手动 2 分钟）：
```
运行：curl -sL "https://script.google.com/.../exec?action=getData&sheet=post_history"
复制本周 8 条内容的数据
```

**步骤 2 — 分析**：
```
"调用 social-media-analyzer，
分析本周 8 条表现。

数据：[粘贴 JSON]

输出：
- 每条 engagement rate
- 账号平均表现
- TOP 3 和 BOTTOM 3
- 成功因素分析"
```

**步骤 3 — 写复盘**：
```
"基于分析，写 decision/next_test：
- 本周发现
- 下周测试方向
- 不再做的方向

保存到：05-weekly-published-content-digests/2026-07-21.md"
```

**产出**：Digest 文件（下周一 Mode B 会自动读取）

---

---

## 🎯 Skill 快速触发表

| 我想做什么 | 用什么 Skill | 说明 |
|-----------|------------|------|
| 拆解竞品视频 | `gengrowth-social` | 使用 reverse-engineering 框架 |
| 查 TikTok Hook 公式 | `gengrowth-social` | 读 references/short-form-video.md |
| 周一生成全周选题 | `astrologywiki-social-workflow` Mode B | 锁定 8+2 条 |
| 问"今天该做什么" | `astrologywiki-social-workflow` Mode A | 推进既定内容 |
| 写 Brief / 脚本 / 制作 | `astrologywiki-social-workflow` Mode A | 批量处理 |
| 评估突发热点 | `astrologywiki-social-workflow` Mode D | 10 分制评分 |
| 分析发布数据 | `social-media-analyzer` | 输入 post_history 数据 |

---

## 💡 常见场景 AI 协作示例

### 场景 1："竞品有条视频爆了，我要不要做类似的？"

**注意**：这里的"竞品"指领域内任何相关账号，不局限于产品竞品

```
第 1 步：拆解领域爆款
"调用 gengrowth-social，拆解 [链接] 的 Hook、结构、话题"

第 2 步：Hot 评估
"调用 astrologywiki-social-workflow Mode D，
评估这个话题的 Hot 得分（10 分制）"

第 3 步：去重检查
在 07-content-production/ 搜索关键词，看 30 天内是否做过

第 4 步：生成差异化选题（如果 Hot ≥8 且未重复）
"调用 astrologywiki-social-workflow Mode C，
基于拆解 + 我们产品的独特角度生成差异化选题"
```

### 场景 2："新产品要做社媒，从零开始怎么做？"

```
第 1 步：了解产品
"我有新产品 [产品名]，产品信息：[介绍/功能/用户/卖点]，
帮我整理成产品知识库"

第 2 步：建立竞品账号库
"帮我建立 [领域] 的竞品账号库，
包括所有相关的社媒账号（不限产品）"

第 3 步：设计账号矩阵
"调用 gengrowth-social，
基于产品定位和竞品分析，设计 2-5 个账号的矩阵策略"

第 4 步：测试工作流
"创建新的 [product]-social-daily Skill，
测试周一选题生成流程"

通用 Skill 直接复用：
✓ gengrowth-social
✓ social-media-analyzer
```

### 场景 3："上周内容表现怎么样？"

```
第 1 步：获取数据（手动 2 分钟）
curl Google Sheet post_history

第 2 步：分析
"调用 social-media-analyzer，
分析上周 8 条，输出 TOP 3 成功因素"

第 3 步：写复盘
"基于分析写 decision/next_test，
明确下周测试方向"
```

### 场景 3："新增 Instagram 账号怎么复用流程？"

```
第 1 步：定义账号
"帮我设计 Instagram @astrowiki.ig 的：
- 目标受众
- 内容支柱
- 与 TikTok 的差异
- 每周配额"

第 2 步：测试路由
"调用 astrologywiki-social-workflow Mode B，
测试新账号的选题路由"

通用 Skill 无需修改：
✓ gengrowth-social
✓ social-media-analyzer
```

---

## 📁 文件位置速查

| 我要找什么 | 去哪里 |
|-----------|--------|
| 产品定位和账号矩阵 | `04-production/01-strategy-and-platform-research/four-account-playbook.md` |
| 周度内容计划 | `04-production/04-weekly-content-plans/2026-Www.md` |
| 单条内容主记录 | `07-content-production/YYYY-MM-DD/content_id.md` |
| 数据复盘和 next_test | `05-weekly-published-content-digests/YYYY-MM-DD.md` |
| 竞品数据 | Google Sheet `post_history` 表 |
| 工作流详细规则 | `04-production/00-evergreen-workflows/weekly-rolling-sop.md` |

---

## ⚙️ 手动操作速查（这些暂时不自动化）

| 操作 | 怎么做 | 耗时 |
|------|--------|------|
| 查竞品爆款 | 打开 Google Sheet `post_history` → 按 views 降序 | 2 分钟 |
| 去重检查 | 在 `07-content-production/` 搜索关键词 | 10 秒 |
| 获取数据分析 | `curl -sL "https://script.google.com/.../exec?action=getData&sheet=post_history"` | 2 分钟 |

---

## ✅ 已有的反哺机制（不要被原方案误导）

你的工作流**已经有完整反哺**：

| 反哺路径 | 现状 | 证据 |
|---------|------|------|
| **数据复盘 → 选题** | ✅ 每周写 `decision/next_test`<br>✅ Mode B 强制读取 | `weekly-rolling-sop.md` § 4.周一第 90 行 |
| **竞品研究 → 选题** | ✅ Mode B 强制 Mandatory Internet Research Gate<br>✅ 读固定 CSV + 至少 2 个当前公开来源 | `astrologywiki-social-workflow` SKILL.md § 3 |
| **历史去重** | ✅ Mode B 强制检查 7-14 天去重 | SKILL.md § 7 |
| **滚动库存** | ✅ Publishing This Week / Producing for Next Week 分离 | SOP § 1 |

---

## 🔧 下一步优化（可选，不强求）

1. **合并 tiktok-strategist**：把 Hook 评估合并到 `gengrowth-social`（30 分钟）
2. **账号配置文件**：创建 `accounts.yaml` 统一管理配额（15 分钟）
3. **状态查询脚本**：写 `check-week-status.sh` 避免手动查（1 小时）

详见：`工作流与skill诊断优化方案.md` § C 实施步骤

---

*最后更新: 2026-07-23*
