---
title: dramashortstv.com 演员图鉴内容生产清单
date: 2026-08-24
目的: 内容层博客优先铺的第一条线——演员图鉴（枢纽页+辐条页），本文档是可执行的生产清单
数据来源: (1) Semrush 关键词搜索——02-keyword-research/2026-08-20-dramashortstv选词-入口拓展.md 三节；(2) reelshort.com Organic Research 页面级真实流量（2026-08-23 为验证分类页拉取，本次复用整理）
关联: 00-inbox/2026-08-21-dramashortstv-网站架构-合并版.md 三节"演员内容"条目
---

# 演员图鉴生产清单

## 数据口径说明

原先只有 6 个演员是通过 Semrush 关键词搜索确认有独立搜索量的（mark vega、anna stadler、mark herrmann、lukas charles stafford、kingsley、asher bradshaw）。这次复用之前为验证分类页拉取的 reelshort.com Organic Research 页面数据（`/tags/movie-actors/*`、`/tags/movie-actresses/*`），发现这批数据里其实包含了更完整的演员真实流量榜单——是 reelshort.com 自己的演员页面**已经在拿到的真实流量**，比 Semrush 关键词搜索量更直接（关键词量是"有多少人搜"，页面流量是"reelshort 实际接住了多少"）。两个数据源不冲突，合并起来排优先级。

## 方法论教训（2026-08-24）：裸名字的 Semrush 搜索量不可信

第一批 12 人排优先级时只用了 reelshort.com 页面流量，用户追问"为什么没有 Semrush 数据"，补查之后发现**裸名字的 Semrush 搜索量普遍被同名人严重稀释，不能直接用**：

| 演员 | reelshort.com 页面流量/月 | 裸名字 Semrush 量/月 | [名字]+reelshort Semrush 量/月 | SERP 核查结论 |
|---|---:|---:|---:|---|
| Marc Herrmann | 1,100 | 6,600 | 不可用（太窄，查不到量） | **干净**——第一页全部指向同一个人（IMDb/Instagram/Rotten Tomatoes/Amazon/reelshort.com），没有同名撞车 |
| Evan Adams | 262 | 14,800 | 720 | **严重污染**——至少 3 个不同的人同名：我们要的短剧演员、1966年出生的加拿大演员/医生、雪城大学橄榄球运动员 |
| Ben Armstrong | 209 | 6,600 | 170 | **严重污染**——至少 4-5 个不同的人：MIT研究员、教会牧师、软件开发者作家，还有一个相当知名的加密货币 YouTuber"BitBoy" |
| Jesse Morales | 180 | 5,400 | 110 | 未逐一核查，但是常见姓名组合，大概率也有污染 |
| Luke Dodge | 178 | 5,400 | 50 | 未核查 |
| Richard Trotter | 170 | 880 | 170 | 未核查（裸名字和+reelshort量一致，污染程度可能较低） |
| 其余 6 人（Katherine Gibson、Haley Lohrli、Aaron Oberst、Jenna Gilmer、Jarred Harper、Tyler Johnson Ellis） | 各 133-219 | 各 880-5,400 | 全部查不到量（低于 Semrush 可测阈值） | 未核查 |

**结论**：三个数据源里，**reelshort.com 页面流量是唯一不受同名污染、且每个人都有数据的信号**——裸名字的量看着大，但可能大部分是同名的运动员/网红/学者；加"reelshort"限定词的量干净，但太窄，10 个里 7 个直接测不到。**继续用页面流量排优先级，不要在任何对外/对内文档里引用裸名字的 Semrush 搜索量当作"这个演员有多火"的证据**，容易误导——Evan Adams 14,800/月看着很唬人，实际能算到我们这个演员头上的可能只有一小部分。

## 枢纽页

**页面**：`/blog/reelshort-actors-guide/`（或并入 `/cast/` 首页，视最终 IA 定）
**目标词**：`reelshort actors`(1,300/月)、`cast reel`(880)、`reelshort cast`(210，KD 19 最低)、`reel short actors`(320)、`reelshort actresses`(260)、`reelshort actors male`(210) —— 六个母词累计 3,700+/月
**结构**：按性别/角色类型分组的演员目录（男演员/女演员两个板块），每人一张卡片（照片占位+姓名+代表剧+链接到辐条页），页面本身不展开个人信息
**内链**：每张卡片链到对应辐条页；辐条页也要反链回枢纽页

## 辐条页——第一批（按 reelshort.com 页面流量排序，前 12 个——排序依据见上方"方法论教训"，不用裸名字搜索量排序）

| 优先级 | 演员                  | reelshort.com 页面流量/月 | 写作时同名污染提醒 |
| --- | ------------------- | -------------------: | --- |
| 1   | Marc Herrmann       |                1,100 | 干净，已 SERP 核查 |
| 2   | Evan Adams          |                  262 | ⚠️ 同名严重，写作时要明确用"ReelShort actor"限定，避免读者搜到加拿大演员/医生或橄榄球运动员那个 Evan Adams |
| 3   | Katherine Gibson    |                  219 | 未核查，写作前建议先查一遍真实 SERP |
| 4   | Ben Armstrong       |                  209 | ⚠️ 同名严重（含知名加密货币网红"BitBoy"），标题/首段必须明确限定"ReelShort" |
| 5   | Haley Lohrli        |                  190 | 未核查 |
| 6   | Jesse Morales       |                  180 | 常见姓名组合，未核查，建议写作前查 |
| 7   | Luke Dodge          |                  178 | 未核查 |
| 8   | Richard Trotter     |                  170 | 未核查，但裸名字/+reelshort 量一致，污染程度可能较低 |
| 9   | Aaron Oberst        |                  141 | 未核查 |
| 10  | Jenna Gilmer        |                  140 | 未核查 |
| 11  | Jarred Harper       |                  139 | 未核查 |
| 12  | Tyler Johnson Ellis |                  133 | 三段式人名，同名概率相对低，未核查 |

## 辐条页——第二批（次优先，流量 80-130/月，共 9 个）

Nicole Mattox(123)、Seth Edeen(112)、Savannah Coffee(88)、Nikki Leigh(80)、Meg Bush(80)、Tim Stein(79)、Noah Fearnley(74)、Maria Barseghian(48)、J.T. Garcia(48)

## 原 6 人清单里流量较低但仍建议保留的

Mark Vega(27)、Anna Stadler(19)、Lukas Charles Stafford(21)——流量比第一批低很多，但已经是双重验证（Semrush 关键词 + 页面流量都命中），排在第二批之后、第三批之前

## 特殊信号：Rebecca Stoughton

页面主排词是 `rebecca stoughton age`——不是"这人是谁"，是"这人多大"，粉丝好奇的是年龄这个具体点。写这一篇时标题/H1 要把年龄信息放前面，不要写成通用人物介绍模板。这个信号提醒：**每个辐条页写之前都应该看一眼该演员页面的真实主排词是什么，不能全部套同一个模板**，有的人是"是谁"，有的人是"多大"，有的可能是"演了什么剧"。

## 每篇辐条页要写什么（模板，逐人按真实主排词微调）

- 姓名 + 代表作（在 reelshort.com 演过的剧，从其 `/tags/movie-actors/[slug]` 页面抓真实剧目列表）
- 公开资料整理：出身、年龄（如果该演员主排词像 Rebecca Stoughton 一样带 "age"，这条要前置）
- 配图：用 reelshort.com 页面上的官方剧照/海报（需确认使用权限，或改用文字描述+链接跳转，不直接盗图）
- 内链：反链回枢纽页 `/blog/reelshort-actors-guide/`，以及该演员参演剧目对应的 `/drama/[剧名]/` 详情页（如果已上线）
- Schema：Person

## 生产前必须做的事（还没做，不是可以跳过的步骤）

1. **逐人查证公开资料**——目前只有"演过哪些剧"和"流量/关键词数字"，没有查过任何一个演员的真实背景信息（年龄、出身地、其他作品）。这一步没做之前不能直接写稿，写清单不等于写稿。
2. **确认图片使用权限**——reelshort.com 的剧照/演员照是否可以直接引用，还是需要自己找替代图源，这个还没查。
3. **第一批 12 人的每个人主排词**目前只抓了 Marc Herrmann 和 Rebecca Stoughton（不在第一批里，作为特殊信号单独提了），其余 11 人还需要各自确认主排词是不是也符合"是谁/多大/演了什么"里的某一种，再决定标题怎么写。

## 下一步

批准这份清单后，先做 Marc Herrmann 一篇（流量断层第一，值得第一个测试选题+写作+发布的完整流程），跑通之后再批量推第一批剩下 11 人。

**2026-08-24 更新**：Marc Herrmann 草稿已完成，见 `00-inbox/2026-08-24-dramashortstv-blog-marc-herrmann.md`。写作过程中发现并纠正了 ReelShort 官方简介里的一个事实错误（妻子姓名写错），草稿里已用交叉核实过的正确信息，细节见该文件末尾"内容团队备注"。图片使用权限仍未确认，发布前必须解决。跑通后可以照这个流程推进第一批剩下的 11 人。
