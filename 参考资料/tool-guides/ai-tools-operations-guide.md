# AI 终端工具使用指南

> 写给不写代码的创始人。三款工具：Claude Code、Codex、Gemini CLI。打开终端，照着做就行。
>
> 最后核对：2026-10-09（Claude Code 2.1.295 / Codex CLI 0.145.0 / Gemini CLI 0.52.0 / gstack 1.6.1.0）

---

## 零、先看这里：选哪个？

| 场景 | 推荐工具 | 理由 |
|------|----------|------|
| 产品定位、战略分析、深度思考 | **Claude Code** | gstack 技能包最完善，Opus 模型推理最强 |
| 代码编写、调试、已有 ChatGPT 订阅 | **Codex** | OpenAI 原生，同样支持 gstack 技能，ChatGPT Plus/Pro 账号直接用 |
| 大文件分析、需要联网搜索、Google 生态 | **Gemini CLI** | 100 万 token 上下文，内置 Google Search，Google 账号直接用 |
| 不知道选哪个 | **Claude Code** | 技能最丰富，最适合创始人工作场景 |

三个工具可以同时安装，互不干扰。**Claude Code 和 Codex 共享同一套 gstack 技能**，Gemini 暂不支持 gstack。

---

## 一、安装与启动

### 1.1 Claude Code

**快捷命令配置（首次一次性操作）：**
```bash
echo 'alias ccc="claude --dangerously-skip-permissions"' >> ~/.zshrc && source ~/.zshrc
```

**启动：**

| 操作       | 命令                 | 说明          |
| -------- | ------------------ | ----------- |
| 启动（推荐）   | `ccc`              | 跳过逐次确认，一气呵成 |
| 启动（安全模式） | `claude`           | 每个操作都会弹窗确认  |
| 继续上次对话   | `ccc -c`           | 恢复上次会话      |
| 带提示词启动   | `ccc "帮我分析一下竞品"`   | 直接带问题启动     |
| 退出       | `/exit` 或 `Ctrl+C` | 结束当前会话      |

> `ccc` 是 `claude --dangerously-skip-permissions` 的别名（用三个 c 避免与系统命令 `/usr/bin/cc` 冲突），省去每步确认弹窗。做产品定位和文档工作完全没问题；涉及生产环境代码部署建议用 `claude`。

---

### 1.2 Codex（OpenAI）

**安装（二选一）：**
```bash
npm install -g @openai/codex   # 方式一：npm
brew install --cask codex       # 方式二：Homebrew
```

**启动：**

| 操作 | 命令 | 说明 |
|------|------|------|
| 启动 | `codex` | 进入交互界面 |
| 继续上次 | `codex resume --last` | 恢复上次会话（不带 `--last` 会弹出会话列表） |
| 带提示词启动 | `codex "帮我看看这段代码"` | 直接带问题启动 |
| 自动执行模式 | `codex -s workspace-write -a on-request "修复所有 lint 错误"` | 可直接改当前项目文件，必要时才问你 |
| 非交互模式 | `codex exec "总结这个项目的结构"` | 跑完直接输出结果 |
| 联网搜索 | `codex --search` | 开启实时网页搜索 |

> 旧版的 `--full-auto` 参数已经移除，用上面的 `-s workspace-write -a on-request` 代替。

**认证：** 首次运行选 "Sign in with ChatGPT"，需要 ChatGPT Plus/Pro/Business 账号；或输入 OpenAI API Key。

---

### 1.3 Gemini CLI（Google）

**安装（三选一）：**
```bash
npx @google/gemini-cli          # 方式一：无需安装，直接运行
npm install -g @google/gemini-cli  # 方式二：全局安装
brew install gemini-cli          # 方式三：Homebrew
```

**启动：**

| 操作 | 命令 | 说明 |
|------|------|------|
| 启动 | `gemini` | 进入交互界面 |
| 继续上次 | `gemini --resume latest` | 恢复上次会话 |
| 非交互模式 | `gemini -p "解释这个项目的架构"` | 直接输出结果 |
| 只读分析 | `gemini --approval-mode plan` | 只分析不改文件 |
| 指定模型 | `gemini -m <模型名>` | 切换到指定模型 |
| 自动执行 | `gemini -y` | 自动批准所有操作（YOLO 模式），等同 `--approval-mode yolo` |

**认证：** 首次运行选 "Sign in with Google"，用 Google 账号登录（免费额度较多）；或输入 Google AI API Key。

---

## 二、进入项目文件夹

**无论使用哪个工具，启动前都先进入对应的文件夹：**

```bash
cd ~/gengrowth-wiki   # 进入 gengrowth-wiki
# 然后启动
ccc       # Claude Code（跳过确认）
codex     # Codex
gemini    # Gemini CLI
```

不确定当前位置时输入 `pwd` 查看。

---

## 三、对话中的常用命令

### Claude Code

| 命令 | 说明 |
|------|------|
| `/model opus` | 切换到 Opus（最强，适合深度分析） |
| `/model sonnet` | 切换到 Sonnet（均衡，日常推荐） |
| `/model haiku` | 切换到 Haiku（最快，简单问答） |
| `/fast` | 快速模式开关 |
| `/clear` | 清空对话上下文 |
| `/compact` | 压缩历史，释放上下文空间 |
| `/status` | 查看当前模型和权限 |
| `/help` | 帮助 |

**Claude Code 键盘快捷键：**

| 按键 | 说明 |
|------|------|
| `Esc` | 打断 Claude 当前的动作 |
| `Esc` `Esc` | 回到历史消息，从那里重新编辑 |
| `Shift+Tab` | 切换权限模式（普通 / 自动接受编辑 / Plan 模式） |
| `\` + `Enter` | 输入框内换行（Mac 终端也可用 `Option+Enter`） |
| `Ctrl+V` | 粘贴剪贴板里的图片 |
| `Ctrl+C` | 取消输入；连按两次退出 |

> 完整列表见官方文档：https://code.claude.com/docs/en/interactive-mode ；自定义键位在 `~/.claude/keybindings.json`。

### Codex

| 命令 | 说明 |
|------|------|
| `/model` | 切换模型（当前可选 gpt-5.6-sol / gpt-5.6-terra / gpt-5.6-luna / gpt-5.5 等，默认 gpt-5.6-sol） |
| `Ctrl+C` | 退出 |

### Gemini CLI

| 命令 | 说明 |
|------|------|
| `/help` | 查看帮助和所有命令 |
| `/stats model` | 查看 token 用量和配额 |
| `/tools` | 查看当前可用工具 |
| `Ctrl+C` | 退出 |

---

## 四、gstack 技能一览

> gstack 技能同时支持 **Claude Code** 和 **Codex**。Claude Code 42 个，Codex 40 个（两者共享 40 个核心技能；`/codex` 和 `/connect-chrome` 只在 Claude Code 里有）。Gemini CLI 暂不支持。
>
> 另外 Claude Code 还装了 29 个飞书技能（`lark-*`），可以直接让它查日历、发消息、读写飞书文档和多维表格。
>
> 调用方式：在对话中输入 `/技能名`，或直接描述你想做的事，工具会自动匹配。

### 4.1 创始人高频技能

#### 产品方向与战略

| 调用命令 | 做什么 | 什么时候用 |
|------|------|------|
| `/office-hours` | 模拟 YC 合伙人追问 6 个问题，把产品想法问清楚、逼出具体 | 有新想法、方向不确定时 |
| `/plan-ceo-review` | 从创始人视角审视方案：范围是否够大 / 够聚焦 | 方案出来之后 |
| `/autoplan` | 自动跑完 CEO → 设计 → 工程 → DX 四轮 plan review | 大方案一次性批量评审时 |

**`/office-hours` 用法：**
```
/office-hours
我想做一个给中小企业用的 AI 增长工具，核心是帮他们做内容营销和获客
```
会逐一问你 6 个问题，追问到你说出具体的人、公司、证据，最终输出设计文档。

**`/plan-ceo-review` 用法：**
```
/plan-ceo-review
看看 gengrowth 的方案是否够有野心，有没有更大的机会
```
选模式：扩大范围 / 选择性扩展 / 保持现有 / 缩减到核心。

---

#### 品牌与设计

| 调用命令 | 做什么 | 什么时候用 |
|------|------|------|
| `/design-consultation` | 搭建完整品牌设计系统（配色、字体、风格定调） | 品牌视觉从零开始时 |
| `/design-shotgun` | 快速生成多个设计方向，打开对比看板 | 想要几个风格方案时 |
| `/design-review` | 用设计师视角检查 UI/UX 细节（间距、层级、一致性） | 有设计稿需要意见时 |
| `/design-html` | 把确认好的设计转成可用的 HTML/CSS 页面 | 确定设计方向后 |
| `/plan-design-review` | 互动式设计方案评审 | 设计方案大方向讨论时 |

**`/design-consultation` 示例：**
```
/design-consultation
gengrowth 是面向中小企业主的AI增长工具，竞品有 HubSpot、Jasper，目标调性是专业但不冰冷
```
产出：DESIGN.md 设计规范文档 + 配色/字体预览页。

---

#### 竞品与市场调研

| 调用命令 | 做什么 | 什么时候用 |
|------|------|------|
| `/browse` | 打开任意网站、截图、点击、对比多个页面 | 看竞品、验证页面效果 |
| `/open-gstack-browser` | 打开一个看得见的浏览器窗口，实时看 AI 操作 | 想盯着它操作网页时 |

```
/browse
截图对比 HubSpot、Jasper、Copy.ai 的首页，分析各自的定位语言和视觉风格
```

---

#### 内容与文档

| 调用命令 | 做什么 | 什么时候用 |
|------|------|------|
| `/make-pdf` | 把任意 Markdown 文件转成排版精良的 PDF | 输出正式文档、提案时 |
| `/document-release` | 发布后自动更新所有相关文档，对齐版本 | 上线新功能后 |
| `/learn` | 管理项目学习记录：查看、搜索、整理、导出 | 整理工作洞察时 |

---

#### 上下文与会话管理

| 调用命令 | 做什么 | 什么时候用 |
|------|------|------|
| `/context-save` | 保存当前工作状态（git 状态、决策、待办） | 要暂时离开、切换任务前 |
| `/context-restore` | 恢复之前保存的工作状态 | 回来继续上次工作时 |

---

#### 回顾与复盘

| 调用命令 | 做什么 | 什么时候用 |
|------|------|------|
| `/retro` | 分析 commit 历史和工作模式，生成周复盘报告 | 每周一次 |

---

### 4.2 工程团队技能（了解即可）

不需要直接调用，知道它们存在便于和团队沟通：

| 调用命令 | 做什么 |
|------|------|
| `/review` | PR 代码审查（SQL 安全、LLM 信任边界、迁移安全等） |
| `/qa` | 自动 QA 测试 + 修复 Bug |
| `/qa-only` | 只测试不修复，输出报告 |
| `/investigate` | 系统性调试，分四阶段找 Bug 根因 |
| `/health` | 代码质量看板（类型检查、Lint、测试覆盖率） |
| `/ship` | 完整发布流程：测试 → 审查 → 更新版本 → 创建 PR |
| `/land-and-deploy` | 合并 PR → 等 CI → 部署 → 监控 |
| `/canary` | 部署后自动监控线上异常 |
| `/cso` | 安全审计（密钥泄漏、OWASP Top 10） |
| `/benchmark` | 性能基准测试 |
| `/benchmark-models` | 跨模型（Claude / Codex / Gemini）效果对比 |
| `/plan-eng-review` | 工程方案评审，锁定架构和执行计划 |
| `/plan-devex-review` | 开发者体验方案评审 |
| `/devex-review` | 实测开发者体验（用 browse 真实操作） |
| `/careful` | 执行危险命令前发出警告（rm -rf、DROP TABLE 等） |
| `/guard` | 全安全模式：危险命令警告 + 限制编辑目录 |
| `/freeze` | 限制本次会话只能编辑指定目录 |
| `/unfreeze` | 解除 /freeze 的限制 |
| `/setup-deploy` | 配置 /land-and-deploy 的部署参数 |
| `/setup-browser-cookies` | 把真实浏览器的 Cookie 导入 browse 无头会话 |
| `/gstack-upgrade` | 升级 gstack 到最新版本 |
| `/codex` | 让 Codex 给方案或代码做第二意见评审（仅 Claude Code） |
| `/pair-agent` | 把浏览器共享给另一个 AI 智能体使用 |
| `/plan-tune` | 调整 plan review 系列技能的提问偏好 |

---

## 五、推荐工作流

### 5.1 产品定位（从零开始）

```
第一步：/office-hours → 想清楚做什么、为谁做、凭什么
第二步：/plan-ceo-review → 审视方案是否够大或需要聚焦
第三步：/design-consultation → 确定品牌视觉系统
第四步：/design-shotgun → 快速探索几个视觉方向
```

### 5.2 竞品分析

```
第一步：/browse → 截图对比竞品页面
第二步：Gemini → 提炼定位语言、卖点和语气差别（可联网搜最新数据）
第三步：整理成一页内部结论文档
```

### 5.3 品牌和官网

```
第一步：Gemini → 先给 2-3 个品牌方向（轻量讨论）
第二步：/design-consultation → 固化成完整视觉系统
第三步：/design-shotgun → 生成多版视觉稿对比
第四步：/design-html → 选定方向后转为可用页面
```

### 5.4 大文件分析

```
推荐用 Gemini（100 万 token 上下文，不会截断）：
gemini -p "分析这个项目的整体架构，列出主要模块和依赖关系"
```

### 5.5 快速代码修复

```
推荐用 Codex（有 ChatGPT 账号时）：
codex --full-auto "修复所有 TypeScript 类型错误"
```

### 5.6 周复盘

```
第一步：/retro → 拉出本周工作重点
第二步：Gemini → 改成更适合汇报的版本
```

---

## 五·五、项目专属技能（仅限 Claude Code + gengrowth-wiki）

> 以下技能存放在 `gengrowth-wiki` 项目本地，**只在该项目目录下启动 Claude Code 时可用**，Codex 和 Gemini 不支持。

| 调用命令 | 做什么 | 什么时候用 |
|------|------|------|
| `/production-survey` | 产品竞品分析专家。覆盖 11 种产品品类，自动搜索并生成投资级深度报告，保存到 `参考资料/产品分析/` | "帮我调研 HubSpot 这个产品" |
| `/company-survey` | 公司调研专家。McKinsey/BCG 框架，覆盖商业模式、竞争格局、财务估算，保存到 `参考资料/公司分析/` | "帮我分析一下 HubSpot 这家公司" |
| `/web-clipper` | 网页剪藏。把任意 URL 转成带图片的本地 Obsidian Markdown，自动下载图片、更新 wiki link | "把这个链接内容存下来" / "剪藏" |
| `/wechat-writing` | 多平台内容生产：公众号 + 创始人 X + LinkedIn，从选题到成稿，内置多模型评审 | "写一篇公众号" / "把这个想法写成内容" |
| `/humanizer-zh` | 去掉文本里的 AI 腔，让文字更像人写的 | 稿子写完后润色 |
| `/social-daily` | astrologywiki.com 社媒日更：追热点 → 提炼爆款钩子 → 批量出 10+ 条各平台内容 | "社媒日更" / "出 10 条内容" |
| `/baoxiao` | 报销助手：拉发票、识别、查重、归档、同步飞书 | "处理本月报销" / "拉发票" |

### 竞品增长情报档案（结合 Ahrefs 报告使用）

模板位置：`参考资料/产品分析/competitor-dossiers/TEMPLATE-competitor-growth-intelligence.md`

已有档案示例：`okara-ai-cmo.md`、`blaze-ai.md`、`babylovegrowth.md`、`hirehelena.md`、`kana.md`。

**目前没有专门处理 Ahrefs 报告的技能**，但可以直接用 Claude Code 完成：

```
把这份 Ahrefs 报告的数据填进竞品档案的第 4 节（流量与品牌需求信号）：
[粘贴 Ahrefs 导出的 CSV 或截图内容]
竞品是 HubSpot，档案路径：参考资料/产品分析/competitor-dossiers/hubspot.md
```

或者从头做一份新档案：

```
参考 TEMPLATE-competitor-growth-intelligence.md，
结合以下 Ahrefs 数据帮我做一份 HubSpot 的增长情报档案：
[Ahrefs 数据]
```

`/production-survey` 可以补充 Ahrefs 没有的维度（商业模式、定位、用户结构），两者配合使用效果最好。

---

## 六、常见问题

**Q: 三个工具哪个有免费额度？**
- Gemini CLI：Google 账号登录有免费额度（具体额度以 Google 官方为准，可用 `/stats model` 查看）
- Codex：需要 ChatGPT Plus/Pro 订阅（$20-200/月），或 OpenAI API Key
- Claude Code：需要 Anthropic 订阅或 API Key

**Q: Claude Code 和 Codex 的技能调用名一样吗？**
是的，两者都用同一套 gstack 技能，调用名相同（如 `/office-hours`）。Claude Code 的技能装在 `~/.claude/skills/`，Codex 的装在 `~/.codex/skills/`（Codex 那边的文件夹名带 `gstack-` 前缀，如 `gstack-office-hours`，但调用时不用带）。

**Q: 技能没反应 / 找不到？**
重启工具后再试。技能调用名是 SKILL.md 的 `name:` 字段（如 `/office-hours`），不含 `gstack-` 前缀。

**Q: Claude Code 输出太长被截断了？**
输入 `/compact` 压缩上下文，或 `/clear` 清空后重新开始。

**Q: 怎么更新 gstack？**
在 Claude Code 或 Codex 对话中输入 `/gstack-upgrade`。

**Q: Gemini 能读取本地文件吗？**
可以，启动后直接描述需求即可，会自动读取当前目录。`--include-directories` 参数可扩展读取范围。
