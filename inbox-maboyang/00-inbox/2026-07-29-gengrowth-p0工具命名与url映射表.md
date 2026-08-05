---
title: GenGrowth P0五个工具——命名与溯源表 + URL/关键词映射表（转录）
date: 2026-07-29
来源: 桌面截图 img_v3_02142_9ca2ea22-3421-415b-8c3a-6df59a1aaeag.jpg（11.1节 命名与溯源表）+ img_v3_02142_7d765c89-1599-4f7a-bfc1-1cd5bcbca7bg.jpg（URL与关键词映射表），原文档未知来源/章节11，图片本身不在gengrowth-ops版本管理范围内，转录进来以便后续引用
状态: 已确认P0-1对外命名以《2026-07-28-gengrowth-seo工具化产品-执行计划-v1.md》3.0节七轮查证结论为准（SEO Quick Wins），本文档11.1原图的"Striking Distance Keywords Finder"外部名与之冲突，未采用，详见下方"命名冲突说明"
---

# P0五个工具——命名与溯源表 + URL映射表（转录自截图）

## 一、命名与溯源表（11.1，原图转录）

命名规则：产品内正式名沿用原矩阵（除非原名被验证不可搜索），对外页面名服从用户搜索表达，两者的中英文含义必须一一对应。

| 优先级 | 矩阵编号·原名 | 产品内正式名（中） | 产品内正式名（英） | 对外页面名（中） | 对外页面名（英，原图） |
|---|---|---|---|---|---|
| P0-1 | #71 GSC Quick Wins Finder | 临界排名机会发现器 | Striking Distance Opportunity Finder | 临界排名关键词发现器 | ~~Striking Distance Keywords Finder~~ **→ 已改为 SEO Quick Wins，见下方冲突说明** |
| P0-2 | #50 内链关系图·#51 孤岛页面发现器 | 内链关系图 | Internal Link Map | 内链检查器/孤岛页面检查器 | Internal Link Checker / Orphan Page Checker |
| P0-3 | #76 流量下降根因树 | 流量下降根因树 | Traffic Drop Root Cause Tree | 自然流量下降诊断 | Organic Traffic Drop Diagnosis |
| P0-4 | #37 单页SEO审计·#38 全站技术审计 | 网站健康地图 | Website Health Map | 免费SEO审计 | Free SEO Audit |
| P0-5 | 旗舰原名：关键词+Prompt机会地图 | 关键词+Prompt机会地图 | Keyword + Prompt Opportunity Map | 免费关键词研究工具 | Free Keyword Research Tool |

**命名冲突说明（2026-07-29）**：P0-1对外名原图写的是"Striking Distance Keywords Finder"，但执行计划v1的3.0节记录过七轮关键词查证，第5轮已明确测试过"striking distance keywords"，结论是"行业黑话，非大众搜索习惯"、无搜索量数据，因此最终定名"SEO Quick Wins"。这张11.1表本身也标注该词"量级待补测"（即这次同样未证实有搜索量）。跟团队确认后，**以执行计划v1的七轮查证结论为准，P0-1对外名保持"SEO Quick Wins"，URL保持`/tools/seo-quick-wins`**，本表的"Striking Distance Keywords Finder"/`/tools/striking-distance-keywords`不采用。如果11.1/11.2这份原文档另有新证据支持改名，需要单独重新走查证流程，不能仅凭这张表覆盖已有结论。

## 二、URL与关键词映射表（原图转录）

| 优先级 | 页面URL | 主要目标搜索词 | 主词一一对应 | 同页承接的其他词 |
|---|---|---|---|---|
| P0-1 | ~~/tools/striking-distance-keywords~~ **→ /tools/seo-quick-wins**（见上方冲突说明，未采用原图URL） | striking distance keywords（量级待补测） | ✅（原图标注，但因上述冲突未采用） | google search console tool (390)、search console tool (~8,100)；不用 gsc quick wins（量0/零补全） |
| P0-2a | /tools/internal-link-checker | internal link checker（seodata 140 / google_us 450） | ✅ | internal link checker free / tool / extension、broken internal link checker（补全10/10） |
| P0-2b | /tools/orphan-page-checker | orphan pages checker | ⚠️单复数差异（Google可归一，不改） | orphan pages finder、orphan pages screaming frog |
| P0-3 | /tools/traffic-drop-diagnosis | why is my website traffic dropping | ❌问题词不做slug，由H1承接 | why is my organic traffic down、why is my website getting no traffic、traffic drop after google update；不用 seo traffic drop（量0）、my rankings dropped（零补全） |
| P0-4 | /tools/seo-audit | seo audit（约8,100） | ✅ | website audit tool (2,400)、website audit (约6,600，重合不可相加)、free seo audit tool、free seo audit report generator |
| P0-5a | /tools/keyword-research-tool | keyword research tool (12,100) | ✅ | keyword research tool free (约9,900) |
| P0-5b | /tools/keyword-clustering-tool | keyword clustering tool (720) | ✅ | best keyword clustering tool (170, CPC $42.70)、keyword clustering tool free |
| P0-5c | /tools/topic-cluster-tool | topic cluster tool (50) | ✅ | free topic cluster tool、ai topic cluster tool generator |

## 三、与此前架构文档的差异（2026-07-29核对）

对照 `2026-07-29-gengrowth-ai-网站架构与页面模版设计-v1.md` 里原来的5工具假设（来自需求洞察报告3.1排序：①SEO Quick Wins→②内链孤岛→③GEO快照→④关键词+Prompt→⑤立项画布），这份新P0清单有实质变化：

- **移出P0**：SEO+GEO可见度快照、SEO立项画布——不在这次的5个P0里，暂时不清楚是否降级到第二阶段还是取消，需要团队确认
- **新增P0**：流量下降根因树（Traffic Drop Root Cause Tree / 对外 Organic Traffic Drop Diagnosis）、网站健康地图（Website Health Map / 对外 Free SEO Audit）
- **拆页面**：原来"内链关系图+孤岛检查"算一个工具一个页面，现在拆成 `/tools/internal-link-checker` 和 `/tools/orphan-page-checker` 两个独立URL；原来"关键词+Prompt机会地图"一个页面，现在拆成 `/tools/keyword-research-tool`、`/tools/keyword-clustering-tool`、`/tools/topic-cluster-tool` 三个独立URL——都是为了让每个页面主词一一对应，不是产品功能拆分
- **P0-4（Free SEO Audit）机制不同于其他工具**：不需要验证网站所有权，用户输入任意URL即可跑（爬取公开可访问页面），不像其他工具需要GSC OAuth读取用户私有数据——这个机制差异直接影响它可以摩擦最低地被放在主页

*本文档为转录+差异核对记录，原始截图不在gengrowth-ops版本管理范围内，如需图片原文请找Ma Boyang要桌面文件。*
