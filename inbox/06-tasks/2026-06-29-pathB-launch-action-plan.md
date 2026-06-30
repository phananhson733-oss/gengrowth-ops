---
title: Path B 两站上线后行动计划
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

### 第一阶段：48小时内 — 收录冷启动

**冷启动发帖（引蜘蛛，同时带外链）**

| 平台 | aistorygenerator.work | googledocsresumetemplate.com |
|---|---|---|
| Reddit | r/DnD、r/DMAcademy、r/rpg | r/resumes、r/jobs、r/careerguidance |
| Hacker News | Show HN: Free AI story generator for D&D GMs | Show HN: Free Google Docs resume templates, no signup |
| Product Hunt | 正式发布帖 | 正式发布帖 |
| GitHub Awesome List | 搜 `awesome ai tools`、`awesome dnd`、`awesome rpg`，提 PR | 搜 `awesome resume`、`awesome job search`，提 PR |

> GitHub Awesome List 提 PR 不需要技术权限，在网页端即可操作：找到目标 repo → Edit → 在列表末尾加一行自己的工具链接 → 提交 PR。PR 合并后即获得 DR ~100 的 dofollow 外链。

---

### 第二阶段：第1-2周 — 外链目录提交

- [ ] 提交 aistorygenerator.work 到：theresanaiforthat.com、toolify.ai、futurepedia.io、alternativeto.net
- [ ] 提交 googledocsresumetemplate.com 到：alternativeto.net 及简历工具聚合目录
- [ ] 用 Ahrefs/SemRush 查竞品外链，筛出 DR 20-60 可接触站点，走现有外联 SOP

**竞品参考**
- aistorygenerator.work：查 ChatStoryGenerator.io、NovelAI 等同类工具
- googledocsresumetemplate.com：查 resumegenius.com、zety.com 的 google docs 相关页面

---

### 第三阶段：第2-4周 — 内页扩展规划

**aistorygenerator.work 建议内页方向：**
- `/ai-npc-generator/`
- `/rpg-quest-generator/`
- `/dnd-backstory-generator/`

**googledocsresumetemplate.com 建议内页方向（现有9个模板页基础上）：**
- `/google-docs-resume-template/2025/`（年份长尾）
- `/google-docs-resume-template/for-students/`
- `/google-docs-resume-template/for-software-engineer/`

> 内页方向确认后，需与后端同事对接开发。

---

### 持续监控

| 时间节点 | 检查内容 |
|---|---|
| 每周一 | GSC：impressions / clicks / Coverage |
| 第4周 | 确认两站是否已被收录（Coverage 有 Valid 页面） |
| 第8周 | 看自然流量是否起量，决定是否做多语言版本 |

---

## 后端同事的任务（技术修复 + 平台操作）

### 收录冷启动（需后台权限）

- [ ] **GSC 验证两个域名**（Add property → DNS 验证）
- [ ] **提交 Sitemap**：`aistorygenerator.work/sitemap.xml` 和 `googledocsresumetemplate.com/sitemap.xml`
- [ ] **GSC URL Inspection**：对两站核心页面点 "Request Indexing"
- [ ] **建立 GitHub 项目仓库**：为两站各创建一个 GitHub repo，README 写工具介绍并附正式站链接（获得 github.com DR ~100 外链）

---

### aistorygenerator.work

- [ ] **确认 JSON-LD 是否输出到首字节**
  用 `curl -s https://aistorygenerator.work/ | grep "application/ld+json"` 检查静态 HTML 是否有 schema
  如果只在 JS 运行时注入，需改为 SSR/SSG 阶段输出，确保 Google 首字节就能读到

- [ ] **统一 Canonical 格式**
  当前：`https://aistorygenerator.work`（无尾斜杠）
  确认全站 canonical 统一为有斜杠或无斜杠，保持一致即可，混用会造成重复内容信号

- [ ] **删除 `meta name="keywords"`**（可选，无害但属于过时标签）

- [ ] **补充 SoftwareApplication Schema**（如 JSON-LD 确认缺失）
  ```json
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "AI Story Generator",
    "applicationCategory": "GameApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  }
  ```

---

### googledocsresumetemplate.com

- [ ] **确认 www → non-www 301 重定向是否生效**
  访问 `https://www.googledocsresumetemplate.com/google-docs-resume-template/` 是否正确 301 到 `https://googledocsresumetemplate.com/google-docs-resume-template/`

- [ ] **确认根域名 `/` 的处理**
  访问 `https://googledocsresumetemplate.com/` 应该 301 到 `/google-docs-resume-template/`，不能返回 404 或空页面

- [ ] **（待我规划）新增内页路由**
  等我完成第三阶段内页关键词规划后，提供具体 URL slug 和内容结构，由后端实现页面模板

---

## 文件关联

- 关键词选词汇报：`inbox/02-keyword-research/2026-06-26-路径B选词汇报.md`
- 哥飞方法论参考：海外工具站SEO完全手册 + 月访问1M迷你游戏案例（用户归档）
