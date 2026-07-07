---
title: gzh-design-skill：把 Markdown 一键排成可直接粘进公众号的 HTML
date: 2026-07-07
updated: 2026-07-07
type: knowledge-note
source: https://github.com/isjiamu/gzh-design-skill
author: isjiamu
publisher: GitHub
tags:
  - ai-builder
  - wechat
  - wechat-publishing
  - markdown
  - html
  - skill
  - content-workflow
  - gengrowth
aliases:
  - gzh-design-skill
  - 公众号排版 Skill
---

# gzh-design-skill：把 Markdown 一键排成可直接粘进公众号的 HTML

## 来源

- 仓库：<https://github.com/isjiamu/gzh-design-skill>
- 作者：isjiamu
- 抓取时间：2026-07-07
- 证据等级：direct-content（README、SKILL.md、仓库结构、语言占比、License、快速开始都直接可见）

## 一句话结论

这是一个面向 AI Agent 的**公众号排版引擎型 Skill**：不是帮你写文章，而是把 Markdown / docx / PDF / 纯文本长文，转成**可直接粘进微信公众号编辑器且不掉格式**的 HTML，并且它把公众号平台限制做成了脚本级硬校验，而不是靠模型记忆。

## 我直接拿到的内容

### 1. 它到底解决什么问题

仓库首页讲得很清楚：

> 把 Markdown 一键排成可直接粘贴进微信公众号编辑器的精致 HTML

它面向的不是普通网页，也不是 PPT，而是**微信公众号编辑器这个极度挑剔的发布面**。核心目标是：

- 粘进去不掉格式
- 代码块 / 图片 / GIF / 引言卡 / 目录都能处理
- 自动章节编号
- 自动关键词下划线标记
- 作者签名去重合并
- 最终产物通过公众号约束校验

### 2. 它的核心卖点

我直接核到的几个强点：

1. **6 套内置主题**  
   摸鱼绿、红白、石墨极简、留白禅意、摸鱼票据、橄榄手记。

2. **主题生成器**  
   不只给你固定皮肤，还支持根据一句描述或参考图，生成一套新的公众号主题组件库。

3. **双关卡校验**  
   - `scripts/component_lint.py`：组件库源头检查
   - `scripts/validate_gzh_html.py`：最终 HTML 合规检查

4. **强平台兜底**  
   README 和 SKILL.md 都反复强调：
   - 样式全内联
   - 文字 `<span leaf="">` 包裹
   - 禁用 `style/script/div/class/grid/position` 等公众号高风险写法

5. **Agent 友好**  
   明确支持 Claude Code / Codex / Cursor 等 Agent 工作流，而不是只给人类手工排版。

### 3. 它怎么装

README 里给了 3 条路径：

- 一行安装：`npx skills add https://github.com/isjiamu/gzh-design-skill`
- 让 AI 自己安装
- 手动 clone 到 skills 目录

这说明它明显是按“可复用 Skill 分发件”来设计的，不只是一个脚本仓库。

### 4. 它的工作流不是 prompt，而是系统

从 `SKILL.md` 可以看出，这个项目真正值钱的不是一段提示词，而是完整流程：

1. 输入归一化：支持 Markdown / docx / PDF / 纯文本
2. 自动推荐主题
3. 读取主题组件库 + 通用增量库
4. 解析内容结构
5. 按配方装配 HTML
6. 跑校验脚本
7. 输出正文 HTML + 带“复制到公众号”按钮的预览页

也就是说，它已经不是“帮模型排版”，而是在做一个**公众号发布 runtime**。

### 5. 仓库形态

我直接看到的仓库目录包括：

- `SKILL.md`
- `references/`
- `scripts/`
- `assets/`
- `docs/`
- `archive/`
- `.github/`

语言占比：

- HTML 95.9%
- Python 4.1%

License：

- **AGPL-3.0**

这一点很关键：如果后续要深改、内嵌、SaaS 化，这个协议不能忽略。

## 高可信事实

1. 这是一个**公众号排版 Skill**，不是写作 Skill。
2. 它把“公众号平台约束”下沉成了脚本校验，不是靠模型自觉。
3. 它同时提供现成主题和主题生成器，说明目标不是单篇文章，而是长期发布体系。
4. 它明确面向 Agent 使用，适合 Claude Code / Codex / Cursor 这类工作流。
5. 它采用 AGPL-3.0，商用接入和闭源改造要特别留意协议边界。

## 这条内容大概率为什么值得你看

对 GenGrowth 来说，它的价值不只是“排版好看”，而是它代表了一类很实用的 AI Builder 思路：

> **把一个平台的脆弱规则，做成 Agent 可调用、可验证、可复用的技能系统。**

公众号发布就是典型高摩擦场景：

- 编辑器兼容差
- 手工排版耗时
- 粘贴容易塌样式
- 规则隐蔽，出错很烦

这个仓库的处理方式很成熟：

- 用主题组件库承载风格
- 用脚本承载死规则
- 用 Skill 承载工作流

这比“给模型一句 prompt 让它排版”高一个层级。

## 对 GenGrowth / Hermes 的启发

### 1. 它很适合接到内容发布链路后段

如果我们后面要做：

- AI 日报转公众号长文
- 研究报告转公众号版面
- 飞书文档 / Markdown 一键转公众号发布稿

这种仓库很值得参考，甚至可以直接试接。

### 2. 它的关键不是主题，而是“规则脚本化”

真正可复用的方法论是：

- 风格组件化
- 发布约束脚本化
- 生成与校验拆开
- 交付面向最终平台，而不是浏览器

这条思路也可以迁移到：

- 飞书卡片
- Slack 长消息模板
- HTML 报告模板
- 知识海报 / 社交卡片

### 3. 需要留意协议

AGPL-3.0 决定了：

- 可以学习、试用、二开
- 但如果要深度集成到闭源产品或对外服务，必须先评估协议影响

这不是不能用，而是不能当成 MIT/Apache 那样随手拿来就商闭源。

## 归档 / 同步建议

这条我判断为**值得进知识库**，因为它不是普通模板仓库，而是一个“Agent × 内容发布 × 平台约束工程化”的典型案例。

建议后续可分两步：

1. **先做轻试用**  
   找一篇现成 Markdown，实际跑一遍，验证输出 HTML 粘进公众号是否稳定。

2. **再做兼容性评估**  
   重点看：
   - AGPL 对我们使用方式的约束
   - 是否能只借鉴结构、不直接嵌入代码
   - 是否值得做一版 GenGrowth 自己的发布 Skill

## 如需更准，下一步怎么补证

如果你要，我下一步最值得做的是其中一个：

1. 直接把这个 repo clone 下来，拿一篇真实 Markdown 跑一遍，验证它对公众号编辑器是否真稳。
2. 专门给你做一版“这个仓库对 GenGrowth 内容发布链路有什么可复用 / 不可复用”的评估。
3. 对照我们的日报 / 研究报告格式，判断它是否值得做成 Hermes 本地发布技能。
