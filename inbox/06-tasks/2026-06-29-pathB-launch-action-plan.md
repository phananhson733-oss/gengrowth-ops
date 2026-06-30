---
title: Path B 两站上线后行动计划（含操作步骤）
date: 2026-06-29
sites: aistorygenerator.work / googledocsresumetemplate.com
status: 执行中
---

# Path B 两站上线后行动计划

## 站点现状

| 项目 | aistorygenerator.work | googledocsresumetemplate.com |
|---|---|---|
| 框架 | Next.js | Astro（静态） |
| Title | ✅ 含核心词 | ✅ 含核心词 |
| Description | ✅ 含 "no login" | ✅ 含 "No signup" |
| JSON-LD | ⚠️ 静态 HTML 无（待确认运行时） | ✅ ItemList schema 已存在 |
| Canonical | `aistorygenerator.work`（无尾斜杠，待统一） | `googledocsresumetemplate.com/google-docs-resume-template/`（无 www） |
| 内页数量 | 待确认 | 9 个模板独立页面 |

---

## 我的任务（SEO / 运营）

---

### 任务 1：Reddit 冷启动发帖

**原理：** Reddit 帖子会被 Google 快速抓取（通常 24 小时内），带外链同时引蜘蛛发现新站。

#### aistorygenerator.work

**目标板块（按优先级）：**
1. r/DnD（110万成员）
2. r/DMAcademy（35万成员，GM向）
3. r/rpg（25万成员）

**操作步骤：**
1. 登录 Reddit 账号，进入 r/DMAcademy
2. 点击 "Create Post"
3. 选择类型：Text（非 Link，Text 帖子存活率更高）
4. 标题（直接复制）：
   > I built a free AI story generator for GMs — no login, generates NPCs, quest hooks, and campaign openings instantly
5. 正文参考：
   > Been running campaigns for years and got tired of blank-page syndrome before sessions. Built this tool to generate story hooks, NPC backgrounds, and campaign openings on the fly.
   >
   > It's free, no login needed. Just describe your setting and it gives you usable content.
   >
   > Link: https://aistorygenerator.work
   >
   > Would love feedback from fellow GMs — what other generators would be useful?
6. 提交后在评论区补充一条具体使用场景（增加互动率，帮帖子存活）
7. 同样的帖子改写后发到 r/DnD 和 r/rpg（不能完全复制，Reddit 会检测）

---

#### googledocsresumetemplate.com

**目标板块（按优先级）：**
1. r/resumes（50万成员）
2. r/jobs（20万成员）
3. r/careerguidance（15万成员）

**操作步骤：**
1. 进入 r/resumes
2. 点击 "Create Post" → Text
3. 标题（直接复制）：
   > Made a free Google Docs resume template library — ATS-friendly, no signup, copy straight to your Drive
4. 正文参考：
   > I got frustrated with resume builders that lock templates behind paywalls or require you to export as PDF. Built a simple library of Google Docs templates you can copy directly to your Drive and edit however you want.
   >
   > 9 templates so far: ATS Classic, Bold Two-Column, Creative Portfolio, Software Engineer, Fresh Graduate, and more.
   >
   > Link: https://www.googledocsresumetemplate.com/google-docs-resume-template/
   >
   > All free, no signup. Feedback welcome — what formats are people looking for?
5. 同样内容改写后分发至 r/jobs 和 r/careerguidance

**注意：** 两站的帖子间隔至少 30 分钟发，同一天完成。

---

### 任务 2：Hacker News Show HN

**原理：** Show HN 帖子一旦上首页，外链权重极高；即便未上首页，HN 页面本身也会被快速收录。

#### 操作步骤（两站通用流程）：

1. 登录 news.ycombinator.com（需有账号，没有则注册）
2. 点击页面右上角 "submit"
3. 填写：
   - **url**：填你的站点主页
   - **title**：必须以 "Show HN:" 开头

**aistorygenerator.work 标题：**
> Show HN: Free AI story generator for D&D GMs – NPCs, quest hooks, campaign openings

**googledocsresumetemplate.com 标题：**
> Show HN: Free Google Docs resume templates – copy to Drive, no signup, ATS-ready

4. 提交后 **立刻** 在评论区写第一条评论，说明构建背景和技术栈（HN 社区重视这点）：

aistorygenerator.work 评论参考：
> Built this after years of running D&D campaigns. The blank-page problem before sessions is real — this generates usable story content in seconds. Stack: Next.js, OpenAI API. No login required. Happy to answer questions about how it works.

googledocsresumetemplate.com 评论参考：
> Built this because most resume template sites either lock content behind paywalls or force you into their proprietary editor. These are real Google Docs files — you copy them to your Drive and own the document. Stack: Astro. No signup, no tracking.

5. 两站 **不要同一天发**，间隔至少 3 天，避免被 HN 算法降权

---

### 任务 3：Product Hunt 发布

**原理：** Product Hunt 页面 DR 高，且有专属社群会主动传播工具，适合获得第一批真实用户。

#### 操作步骤：

1. 登录 producthunt.com，点击右上角 "Submit" → "Submit a product"
2. 填写基本信息：

**aistorygenerator.work：**
- Product name: `AI Story Generator`
- Tagline（60字符内）: `Free AI story & NPC generator for D&D Game Masters`
- Website: `https://aistorygenerator.work`
- Description: 描述工具功能，强调免登录、免费、即用

**googledocsresumetemplate.com：**
- Product name: `ResumeDocs`
- Tagline: `Free Google Docs resume templates – copy & edit, no signup`
- Website: `https://www.googledocsresumetemplate.com/google-docs-resume-template/`

3. 上传产品截图（至少 3 张：首页、工具使用中、示例输出）
4. 选择发布日期：选择周二或周三发布（PH 流量最高）
5. 发布前一天在 Reddit / Twitter 预热，发布当天主动在评论区参与讨论
6. **两站不要同一天发布**，间隔至少 1 周

---

### 任务 4：GitHub Awesome List 提 PR

**原理：** Awesome List 是 GitHub 上的精选资源合集，任何人可以提 PR 加入自己的工具。合并后获得来自 github.com（DR ~100）的 dofollow 外链，是成本最低的高质量外链。

#### 操作步骤（全程网页端，无需技术权限）：

**第一步：找目标 repo**
1. 打开 github.com，在搜索框输入以下关键词并回车：
   - aistorygenerator.work 用：`awesome ai tools`、`awesome dnd`、`awesome rpg`
   - googledocsresumetemplate.com 用：`awesome resume`、`awesome job search`
2. 筛选条件：点击 "Repositories" 标签，按 Stars 排序，优先选 Star 数 500+ 的 repo

**第二步：找合适的分类位置**
1. 进入目标 repo，点击 README.md 查看结构
2. 找到与你工具最相关的分类（例如 "AI Writing Tools" 或 "Career Resources"）
3. 检查该分类下现有工具的格式，通常是：`- [工具名](链接) - 一句话描述`

**第三步：提交 PR**
1. 点击 README.md 右上角的铅笔图标（Edit this file）
2. 在对应分类末尾添加一行：
   - aistorygenerator.work：`- [AI Story Generator](https://aistorygenerator.work) - Free AI story and NPC generator for D&D Game Masters. No login required.`
   - googledocsresumetemplate.com：`- [ResumeDocs](https://www.googledocsresumetemplate.com/google-docs-resume-template/) - Free Google Docs resume templates, ATS-friendly. Copy to Drive, no signup.`
3. 页面底部选 "Create a new branch for this commit and start a pull request"
4. 点击 "Propose changes"
5. PR 标题写：`Add [工具名] to [分类名]`
6. PR 描述简述工具用途和为何适合该列表
7. 点击 "Create pull request"

**目标数量：** 每站至少提交 3 个 Awesome List 的 PR，提高至少 1 个被合并的概率。

---

### 任务 5：工具目录提交

**原理：** 工具目录是新站外链的快速来源，大多数免费提交，2-7 天内生效。

#### aistorygenerator.work 提交目录：

**There's An AI For That（theresanaiforthat.com）**
1. 打开 theresanaiforthat.com
2. 右上角点 "Submit a tool"
3. 填写：Tool name / URL / Description / Category（选 "Writing" 或 "Gaming"）
4. 提交后等待审核（通常 3-5 个工作日）

**Toolify.ai（toolify.ai）**
1. 打开 toolify.ai，点击 "Submit Tool"
2. 填写工具名、URL、描述、分类（AI Writing Tools）
3. 免费提交，审核 1-3 天

**Futurepedia（futurepedia.io）**
1. 打开 futurepedia.io，点击 "Submit a Tool"
2. 填写基本信息，Category 选 "Writing" 或 "Fun Tools"
3. 审核约 3-7 天

**AlternativeTo（alternativeto.net）**
1. 打开 alternativeto.net，右上角登录/注册
2. 点击 "Add Software" → 填写工具名和 URL
3. 描述中写清楚是什么工具、适合谁用
4. 添加 "Platform"：Web

---

#### googledocsresumetemplate.com 提交目录：

**AlternativeTo**（同上流程，Category 选 "Office & Productivity"）

**G2（g2.com）**
1. 打开 g2.com，点击右上角 "Get Listed"
2. 填写产品信息（免费版可提交）
3. Category 选 "Resume Builder" 或 "Document Templates"
4. 审核约 5-7 个工作日

**Capterra（capterra.com）**
1. 打开 capterra.com，搜索栏旁边找 "List Your Software"
2. 填写产品信息，Category 选 "Resume Builder"
3. 免费 listing 可提交，审核约 1 周

---

### 任务 6：竞品外链抄作业

**原理：** 竞品已经获得的外链，大概率对你也有效。找到这些来源并主动联系，是最精准的外链建设路径。

#### 操作步骤：

**第一步：找竞品外链来源**
1. 打开 Ahrefs（app.ahrefs.com）或 SemRush
2. 在 Site Explorer 输入竞品域名：
   - aistorygenerator.work 竞品：`chatgpt.com/g/...`（GPT store）、`novelai.net`、`storygenerator.ai`
   - googledocsresumetemplate.com 竞品：`resumegenius.com`、`resumeworded.com`
3. 点击左侧 "Backlinks" → 筛选条件：
   - DR：20-70（太低无效，太高联系不上）
   - Link type：Dofollow
   - 排除：社交媒体、论坛（已有 Reddit / HN 覆盖）
4. 导出前 50 条结果

**第二步：筛选可接触站点**
逐条看 referring page，筛出：
- 资源推荐页（"Best AI tools for X"类）
- 博客文章（"Top 10 tools for Y"类）
- 工具目录（未提交过的）

**第三步：联系**
- 邮件模板：说明你的工具，请求加入对方的推荐列表
- 走现有外联 SOP（参考 `inbox/03-content-briefs/2026-06-05-backlink-outreach-sop-v1.1.md`）

---

### 任务 7：内页关键词规划

**原理：** 哥飞方法论要求持续发布内页，每个内页针对一个长尾词，形成词根集群，整体提升主词排名。

#### 操作步骤：

**第一步：找长尾词**
1. 打开 Ahrefs Keywords Explorer
2. 输入核心词：`ai story generator` / `google docs resume template`
3. 点击左侧 "Matching terms" → 筛选 KD ≤ 15，Volume ≥ 100
4. 记录前 20 个词

**第二步：验证意图**
1. 把每个词 Google 一下，看 SERP 是工具页还是文章页
2. 工具意图（搜索结果以工具站为主）→ 做工具子页
3. 信息意图（搜索结果以博客为主）→ 做文章页

**第三步：确认后移交后端同事**
整理成表格，格式：

| URL Slug | 目标关键词 | 搜索量 | KD | 页面类型 |
|---|---|---|---|---|
| /ai-npc-generator/ | ai npc generator | 500 | 3 | 工具子页 |

交给后端同事实现路由和页面模板。

---

### 任务 8：持续监控

#### 每周一检查 GSC（由后端同事开放权限后执行）：

1. 打开 search.google.com/search-console
2. 左侧点击 "Performance" → 看 Total impressions / Total clicks
3. 点击 "Coverage" → 确认 Valid 页面数量在增加，Error 数量为 0
4. 点击 "URL Inspection" → 输入首页 URL，看 "Last crawl" 日期

#### 第4周确认收录：
- Coverage 里应出现 Valid 页面，否则检查 robots.txt 和 sitemap 是否正确

#### 第8周判断多语言：
- 打开 GSC → "Performance" → 点击 "Countries" 标签
- 如果某个非英语国家流量占比 > 15%，考虑做该语言版本

---

## 后端同事的任务（技术修复 + 平台操作）

---

### 任务 A：GSC 验证两个域名

**操作步骤：**
1. 打开 search.google.com/search-console，登录 Google 账号
2. 点击左上角下拉 → "Add property"
3. 选择 "Domain"（不是 URL prefix），输入 `aistorygenerator.work`
4. 选择验证方式：**DNS record**（推荐）
5. 复制 Google 提供的 TXT 记录值（格式类似 `google-site-verification=xxxxx`）
6. 登录域名注册商后台（Cloudflare / Namecheap 等），进入 DNS 管理
7. 添加 TXT 记录：Type = TXT，Name = @，Value = 粘贴上一步的值
8. 回到 GSC 点击 "Verify"（DNS 生效可能需要 5-30 分钟）
9. 对 `googledocsresumetemplate.com` 重复以上步骤

---

### 任务 B：提交 Sitemap

**前提：** 确认以下 URL 可访问（浏览器打开不报 404）：
- `https://aistorygenerator.work/sitemap.xml`
- `https://googledocsresumetemplate.com/sitemap.xml`

如果 sitemap 不存在，需先生成（Next.js 用 `next-sitemap` 包，Astro 用内置 sitemap 集成）。

**提交步骤：**
1. GSC 左侧点击 "Sitemaps"
2. 在输入框填入 `sitemap.xml`，点击 "Submit"
3. 状态显示 "Success" 即完成
4. 两个域名分别操作

---

### 任务 C：GSC URL Inspection 请求收录

**操作步骤：**
1. GSC 左侧点击 "URL Inspection"
2. 输入核心页面 URL：
   - `https://aistorygenerator.work/`
   - `https://www.googledocsresumetemplate.com/google-docs-resume-template/`
3. 等待检测完成（约 10 秒）
4. 点击 "Request Indexing"
5. 对每个工具子页重复操作（优先处理首页和核心内页）

---

### 任务 D：建立 GitHub 项目仓库

**操作步骤：**

1. 登录 github.com，点击右上角 "+" → "New repository"
2. 填写：
   - Repository name: `ai-story-generator`（或 `resume-docs`）
   - Description: 工具的一句话介绍
   - Public（必须公开，才能被搜索引擎收录）
   - 勾选 "Add a README file"
3. 点击 "Create repository"
4. 编辑 README.md，内容结构：

```markdown
# AI Story Generator

Free AI story and NPC generator for D&D Game Masters.

**Live tool:** https://aistorygenerator.work

## Features
- Generate campaign openings, quest hooks, NPC backstories
- No login required
- Free to use

## Tech Stack
Next.js / OpenAI API
```

5. 对 googledocsresumetemplate.com 重复，repo 名用 `resume-docs`

**目的：** 获得来自 github.com（DR ~100）的 dofollow 外链，同时建立产品可信度。

---

### 任务 E：aistorygenerator.work — 确认 JSON-LD 输出

**检查命令：**
```bash
curl -s https://aistorygenerator.work/ | grep "application/ld+json"
```

**如果无输出（确认缺失）：** 在 Next.js 的 `app/layout.tsx` 或 `pages/_document.tsx` 的 `<head>` 中添加：

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "AI Story Generator",
  "url": "https://aistorygenerator.work",
  "applicationCategory": "GameApplication",
  "operatingSystem": "Web",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  }
}
</script>
```

**要求：** 必须在 SSR/SSG 阶段输出到 HTML，不能只在客户端 JS 中注入（Google 首字节必须能读到）。

---

### 任务 F：aistorygenerator.work — 统一 Canonical 格式

**当前问题：** Canonical 为 `https://aistorygenerator.work`（无尾斜杠），需确认全站统一。

**操作：**
1. 检查 `next.config.js` 或 `app/layout.tsx` 中 canonical 的生成逻辑
2. 统一选择有尾斜杠（`https://aistorygenerator.work/`）或无尾斜杠，全站保持一致
3. 确认 `https://aistorygenerator.work` 和 `https://aistorygenerator.work/` 之间有 301 重定向（不能两个都返回 200）

---

### 任务 G：googledocsresumetemplate.com — 确认重定向链

**需确认的两条重定向：**

**① www → non-www**
```bash
curl -I https://www.googledocsresumetemplate.com/google-docs-resume-template/
```
期望返回：`HTTP/2 301` + `Location: https://googledocsresumetemplate.com/google-docs-resume-template/`

**② 根域名跳转**
```bash
curl -I https://googledocsresumetemplate.com/
```
期望返回：`HTTP/2 301` + `Location: https://googledocsresumetemplate.com/google-docs-resume-template/`

如果返回 404 或 200 空页面，需在 Astro 的 `vercel.json` 或 `netlify.toml` 中配置 redirect 规则。

---

### 任务 H：新增内页路由（待我规划后移交）

等我完成任务 7（内页关键词规划）后，提供具体 URL slug 列表和内容结构，届时再对接实现页面模板。

---

## 时间线总览

| 时间 | 我的任务 | 后端同事任务 |
|---|---|---|
| 今天（D0） | Reddit 发帖（两站） | GSC 验证 + Sitemap 提交 |
| D1 | HN Show HN（第一站） | URL Inspection 请求收录 |
| D3 | HN Show HN（第二站） | GitHub 仓库创建 |
| D1-D7 | GitHub Awesome List 提 PR | JSON-LD / Canonical / 重定向修复 |
| 第1-2周 | 工具目录提交 + 竞品外链抄作业 | — |
| 第2-4周 | 内页关键词规划 → 移交 | 内页路由开发 |
| 每周一 | GSC 监控 | — |

---

## 文件关联

- 关键词选词汇报：`inbox/02-keyword-research/2026-06-26-路径B选词汇报.md`
- 外联 SOP：`inbox/03-content-briefs/2026-06-05-backlink-outreach-sop-v1.1.md`
- 哥飞方法论参考：海外工具站SEO完全手册 + 月访问1M迷你游戏案例（用户归档）
