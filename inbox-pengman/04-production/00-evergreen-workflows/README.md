---
title: Evergreen Production Workflows
project: astrologywiki
type: workflow-index
status: active
owner: Pengman
updated: 2026-07-16
---

# Evergreen Production Workflows

This folder stores reusable production workflows that should not be mixed into dated research notes or one-off daily recommendation outputs.

## Current Workflows

- [[inbox-pengman/04-production/00-evergreen-workflows/内容路由与规则调用说明.md]] — 先判断任务需要调用哪一份规则，不从本目录全量读取
- [[inbox-pengman/04-production/00-evergreen-workflows/统一内容 Brief 模板.md]] — 单条内容字段和 `content_id` 口径
- [[inbox-pengman/04-production/00-evergreen-workflows/Pengman 与 AI 内容润色协作说明.md]] — 人工反馈、双模型内容实验、版本选择、L1–L5 和规则升级的唯一详细规范
- [[inbox-pengman/04-production/00-evergreen-workflows/内容生产与学习记录模板.md]] — 主生产记录结构；不单独维护另一份状态
- [[inbox-pengman/04-production/00-evergreen-workflows/astrologywiki-social-daily/SKILL.md]] — 当前每日内容执行与公共表达的唯一来源
- [[inbox-pengman/04-production/00-evergreen-workflows/daily-content-assistant-sop.md]] — 网站承接、近期发布、竞品和去重逻辑；其中可复用 Prompt 是历史 MVP，实际执行以 Skill 为准
- [[inbox-pengman/04-production/00-evergreen-workflows/ai-short-video-production-workflow.md]] — 只在短视频进入制作时读取
- [[inbox-pengman/04-production/00-evergreen-workflows/instagram-image-content-workflow.md]] — 只在图文/Carousel 进入制作时读取
- [[inbox-pengman/04-production/00-evergreen-workflows/social-account-warmup-and-launch-workflow.md]]
  - 社媒账号从零起号养号流程（IP/手机/账号配置、养号操作、异常处理）；不是单条内容生产必读，待瘦身迁移时评估移到账号运营区域。

规则不要在 README 中重复维护。模型分工和人工选择看协作说明；每条内容的实验字段、候选版本和比较结果写入内容生产与学习记录模板。默认先读路由说明，再只打开与当前任务有关的 1–3 份 SOP；不要整目录扫描。

## Related Working Areas

- Historical Social SEO fishbone map: [[inbox-pengman/05-调研资料/历史流程/social-seo-fishbone-map.md]]
- Daily topic recommendations: [[inbox-pengman/04-production/06-daily-content-recommendations/README.md]]
- Selected-topic production records: [[inbox-pengman/04-production/07-content-production/README.md]]
- Daily content assistant SOP: [[inbox-pengman/04-production/00-evergreen-workflows/daily-content-assistant-sop.md]]
- Video and visual tool research: [[inbox-pengman/05-调研资料/工具调研/视频与视觉/README.md]]
- Weekly published content digests: [[inbox-pengman/04-production/05-weekly-published-content-digests/README.md]]
