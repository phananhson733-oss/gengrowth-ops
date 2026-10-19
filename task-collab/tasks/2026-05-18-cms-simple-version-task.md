---
title: astrologywiki CMS 简化版（Markdown + front-matter 自动构建）
date: 2026-05-18
updated: 2026-05-18
type: note
priority: P1
status: todo
requester: Ma Boyang
reviewer: wzb
owner: wzb
project: astrologywiki
source: /Users/wzb/code/gengrowth-ops/inbox/08-reports-and-feedback/01-product-feedback/2026-05-14-astrologywiki-product-feedback.md
source_vault: gengrowth-ops
tags:
  - task
  - astrologywiki
  - cms
  - content-pipeline
  - P1
aliases:
  - cms-simple-version-task
---

# astrologywiki CMS 简化版（Markdown + front-matter 自动构建）

- [ ] [astrologywiki/oracle] 把文章从硬编码 .ts 改为 Markdown + front-matter，build 时自动构建 article index #task #astrologywiki #cms #owner/wzb 📅 2026-07-01 🔼

## 背景

来自 Ma Boyang 的产品反馈（2026-05-14）。原需求是「独立 Blog 发布与管理后台」，评审后**范围修正**：当前阶段不做完整 CMS（可视化编辑器 / 用户登录 / 权限 / 发布工作流），而是做**简化版** — 解决「运营写文章不用碰 TypeScript」这一核心痛点。

**判断依据**：
- 当前文章数 = 6，CMS 是为月产 30+ 准备的，提前做 = 过度工程
- 真正的瓶颈是「.ts 写作门槛」，不是「缺少 CMS UI」
- 改成 Markdown 后，配合已交付的 Obsidian 模板 `templates/草稿-SEO博客-AIO.md`，运营可以全程在 Obsidian 完成

## 目标

1. 运营写文章脱离 TypeScript，全流程用 Obsidian 完成
2. SEO 字段（title / description / focus_keyword / pillar_slug 等）通过 front-matter 配置
3. 与 Obsidian 模板 `templates/草稿-SEO博客-AIO.md` 字段对齐
4. 不引入新的依赖（CMS 平台 / 数据库 / 编辑器），不改变现有部署架构

## 验收标准

### 数据层迁移
- [ ] `data/articles/*.ts` 全部迁移成 `data/articles/*.md`
- [ ] front-matter 字段对齐 Obsidian 模板（title / slug / focus_keyword / pillar_slug / description / keywords / schema / lang / author / date 等）
- [ ] 正文 markdown 支持站内链接 `/wiki/...` 写法
- [ ] 现有 6 篇文章迁移完成，渲染输出与迁移前一致

### Build 链路
- [ ] 扩展或新写脚本（建议复用 `scripts/generate-seo-pages.mjs` 思路），build 时扫描 `data/articles/*.md` 自动构建 article object
- [ ] 自动生成 `data/articles/index.ts`（或等价的导出）
- [ ] front-matter 解析用 gray-matter 或同类轻量库
- [ ] Markdown → HTML 用 marked / unified（与现有 wiki 渲染保持一致）
- [ ] TypeScript 类型推断保持工作（article 类型不丢失）

### 预览
- [ ] `npm run dev` 本地预览 markdown 渲染结果
- [ ] 移动端预览：dev server + 浏览器 DevTools 设备模拟即可（不做独立预览站）

### 运营工作流闭环
- [ ] 运营在 Obsidian 用「草稿-SEO博客-AIO」模板写好 .md
- [ ] 拖到 oracle 仓库 `data/articles/` 下
- [ ] 本地 `npm run dev` 预览
- [ ] commit + push 即发布

## 不做的事（明确范围）

- ❌ 可视化编辑器（用 Obsidian 替代）
- ❌ 用户登录 / 权限管理
- ❌ 发布按钮 / 草稿/发布状态机
- ❌ Webhook / 自动构建触发
- ❌ CMS UI

## 技术要点

- gray-matter 解析 front-matter
- 现有 article schema（`types/wiki.ts` 之类）保持不变，markdown 解析后转 article object
- 注意 markdown 里的 `/wiki/...` 内链需要在渲染时保留为 React Router 链接（不是 `<a>`）
- 如果当前 article schema 含富格式字段（不只是 markdown），需要在 front-matter 里补充对应字段

## 来源链接

- 产品反馈原文（gengrowth-ops vault）：`/Users/wzb/code/gengrowth-ops/inbox/08-reports-and-feedback/01-product-feedback/2026-05-14-astrologywiki-product-feedback.md` — 需求 #1
- 评审决议：上述反馈文档「💡 评审反馈」段
- Obsidian 模板（gengrowth-ops vault）：`/Users/wzb/code/gengrowth-ops/templates/草稿-SEO博客-AIO.md`
- oracle 仓库：`/Users/wzb/code/oracle`
- 关联任务（本 vault）：[[2026-05-18-astrologywiki-landpage-task]] — 首页 Featured Articles 读取 .md 后的 article index

## 执行记录

- 2026-05-18：任务文档初始化（评审通过后落地）。
