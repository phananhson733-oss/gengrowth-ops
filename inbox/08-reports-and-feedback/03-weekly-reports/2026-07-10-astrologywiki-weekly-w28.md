---
project: astrologywiki + gengrowth
type: report
status: draft
owner: Ma Boyang
updated: 2026-07-10
---

# GenGrowth 运营周报 | 2026-W28

**项目：** AstrologyWiki 增长 + GenGrowth 内容策略 + CTA架构优化
**周期：** 2026-07-07 → 2026-07-10（周四截稿，本周仍在进行中）
**汇报人：** 马博洋

---

## 一句话摘要

W28以系统化设计文档建设为主轴：CTA架构从0到11个模块、完成UniFab全站对标、识别Emmy提名内容窗口、并完成GA4 PV<UV异常的技术根因定位。

---

## 本周数据

数据口径：GA4 页面和屏幕报告，7月1日–7月9日（含W27尾段，W28独立数据待周五完整提取）

### AstrologyWiki 本周页面数据（7/1–7/9混合口径）

| 页面 | PV | UV | 平均参与时长 | 异常标记 |
|---|---|---|---|---|
| /en/wiki（列表页）| 12 | 5 | 29s | 正常 |
| /en/wiki/arthur-fery-birth-chart | 1 | 5 | — | ⚠️ PV<<UV |
| /（首页）| 1 | 5 | — | ⚠️ PV<<UV |
| /dashboard | 5 | 3 | — | 正常 |
| /en/tools | 2 | 2 | 12s | 正常 |
| /en/wiki/erling-haaland-girlfriend-birth-chart | 0 | 2 | 15s | ⚠️ PV=0 |
| /en/wiki/vozinha-birth-chart | 0 | 2 | 0s | ⚠️ 事件数=0 |
| /onboarding | 4 | 2 | 1分03秒 | 正常 |
| /en/wiki/conjunction | 1 | 1 | — | 正常 |
| /en/wiki/england-vs-norway-astrology | 0 | 1 | 14s | ⚠️ PV=0 |
| **全站合计** | **30** | **19** | **1分20秒** | — |

**关键解读：**

W28流量规模明显低于W27（W27：76 UV，W28截至7/9仅19 UV）。主因是W27的世界杯流量高峰（Vozinha/Haaland/Kane/England WC合计48 UV）在W28已退潮，新内容尚未发布补位。Emmy提名内容（7/8发现窗口）、Yamal生日内容（7/13）尚未产出，是W28-W29流量断层的直接原因。

**⚠️ GA4 PV<<UV异常：本周完成根因定位**

W27周报标记的技术异常在W28完成系统性排查：

- **问题一（影响范围：大多数 /en/wiki/* 文章页）**：SPA客户端路由未触发 `page_view`。用户从 `/en/wiki` 列表页点击进入文章时为客户端跳转，GA4不感知路由变化，`page_view` 不发出。证据：列表页PV正常（12），直接访问的 `/en/wiki/conjunction`（1 UV→1 PV）正常，内部导航进入的文章页PV均为0或接近0。

- **问题二（仅影响 Vozinha 页面）**：该页面事件数=0、参与时长=0秒，GA4脚本未执行。与问题一独立，可能为页面级JS报错导致脚本中断。

**修复路径（待开发排期）：**
1. Vozinha页面：打开Console检查JS报错，定位脚本中断原因
2. 全站wiki文章页：在Next.js `router.events` 中手动触发 `page_view`，一次改动全站生效

---

## 本周工作重点

### 1. CTA架构：从0到11个模块的系统性设计

基于对UniFab全站的系统性爬取与对标，完成 `2026-07-09-astrologywiki-cta架构优化需求.md`，最终形成11个模块（A-K），覆盖AstrologyWiki所有页面的转化触点：

| 模块 | 内容 | 优先级 | 对标来源 |
|---|---|---|---|
| A：Nav固定按钮 | 全站顶部"Get Free Birth Chart" | P0 | UniFab层② |
| B：Scroll Sticky Nav | 文章页滚动400px触发引导条 | P0 | UniFab层③ |
| C：文章顶部工具卡 | H1后第一屏产品推荐卡 | P0 | UniFab层⑤ |
| D：文章中段CTA | 正文~50%处独立CTA区块 | P1 | UniFab层⑥ |
| E：工具页结果区延伸 | 星盘生成后分享/横向导流/Newsletter | P2 | UniFab层⑦适配 |
| F：底部Sticky条 | 首页+工具页兜底入口（不含Blog） | P2 | UniFab层① |
| G：右侧悬浮工具卡 | 桌面端Blog右侧持久工具入口 | P1 | UniFab层④ |
| H：右侧Sticky TOC | 桌面端文章目录，随阅读高亮 | P1 | UniFab SEO标配 |
| I：右侧相关内容推荐 | 桌面端5篇相关文章 | P2 | UniFab New Resource |
| J：右下角三联浮动按钮 | 返回顶部+AI助手+工具快速入口 | J-1/J-3 P1 | UniFab右下角 |
| K：左下角Ask AI面板 | 5个AI工具预填查询入口（GEO） | P1 | UniFab左下角 |

**本周修正的关键认知**：底部固定横条（模块F）在UniFab的Blog文章页不显示，仅首页和工具页有——已修正文档与洞察文档中的覆盖范围描述。

**前置条件（P0上线前必须完成）：**
- [ ] Haaland/Mbappé/Hakimi 内链bug修复（指向wrong page）
- [ ] 工具页P-1渲染bug修复（工具可正常加载）

### 2. Emmy提名内容机会：窗口已开，执行尚未启动

7月8日Emmy提名公布，内容机会已识别，但本周因文档建设工作优先，预处理尚未启动。

**推荐执行顺序（5人，Hub+Spoke结构）：**

| 优先级 | 人物 | 提名类别 | 理由 |
|---|---|---|---|
| T1 | Zendaya | Drama Lead Actress（Euphoria）| 全场搜索量天花板，Virgo Sun |
| T1 | Ayo Edebiri | Comedy Lead Actress（The Bear）| 三连提名，Cancer Sun，生日7/18近在眼前 |
| T2 | Quinta Brunson | Comedy Lead（Abbott Elementary）| 年轻女性受众，处女座边界 |
| T2 | Oscar Isaac | Limited Series Lead（BEEF）| Star Wars+MCU双粉丝群 |
| T2 | Mark Ruffalo | Drama Lead（Task）| MCU绿巨人基础，Scorpio/Sag边界 |

Hub页：2026 Emmy Nominees — Zodiac Signs & Birth Charts（列全部提名者星座）

**⚠️ 时间敏感**：Ayo Edebiri生日7/18，需在7/17前发布。Emmy搜索峰值已过72小时最高点，但到颁奖典礼（9/14）前维持中等热度，仍在窗口内。

### 3. AstrologyWiki CTA Map 完整化

`astrologywiki.com - CTA Map.csv` 从7行扩充至46行，完成全站URL注册表：

| 分类 | 行数 |
|---|---|
| 原有CTA行（已修正文案+target_url）| 7行 |
| Nav Tab URL（8个功能Tab）| 8行 |
| 工具页URL | 6行 |
| 其他站内页面（首页/用户页/功能页）| 7行 |
| Blog文章URL | 13行 |
| 外部AI链接（模块K）| 5行 |

原有7行CTA的两处系统性错误已修正：①中文文案→英文；②target_url从blog页改为对应功能Tab或工具页。

### 4. 趋势词查找

**AstrologyWiki（7/8 CSV）：** Lamine Yamal、Kylian Mbappé、Novak Djokovic、Coco Gauff、Mo Salah — 5个blog候选词，SERP预处理尚未执行

**GenGrowth.ai（7/8 CSV）：** GEO（Generative Engine Optimization）、GPT-5.6对SEO的影响 — 2个时效性blog词；7/9 CSV中gpt 5.6仅1,000+且2小时内结束，不适合再追

---

## 本周产出文件总览

| 日期 | 文件 | 类型 | 状态 |
|---|---|---|---|
| 07-08 | `02-keyword-research/2026-07-08-vercel子域名需求挖掘方法.md` | 方法论文档 | ✅ Final |
| 07-09 | `00-inbox/2026-07-09-工具站内容转化设计洞察.md` | 研究报告 | ✅ v1 |
| 07-09 | `00-inbox/2026-07-09-astrologywiki-cta架构优化需求.md` | 需求文档 | ✅ v1.3（11模块）|
| 07-09 | `00-inbox/astrologywiki-cta-map-updated.csv` | URL注册表 | ✅ 46行 |
| 07-07 | `00-inbox/2026-07-07-增长诊断功能评审报告.md` | 产品评审 | ✅ v1.4（删4+16，恢复8）|

**本周删除/未完成：**
- AstrologyWiki优化需求文档（基于SEO-SOP升级补丁）— 第一版被删除，尚未重新生成

---

## 本周暴露的业务问题

**内容发布节奏与窗口期错配。**
Emmy提名7/8公布，搜索峰值在72小时内，但本周因文档建设占用大量时间，相关内容尚未启动预处理。趋势内容的特点是"机会等人不等"，W28已损失部分Emmy首峰流量。需评估：是否需要专门的"快速响应"工作模式，将趋势内容预处理提速至发现后24小时内完成？

**GA4技术债务影响数据有效性。**
SPA路由问题导致大量wiki文章页PV不被记录，但UV已被计入。这使得实验二（趋势blog→工具转化漏斗）的数据从一开始就是失真的——分母（进入页面的用户数）是准的，但分子（页面内的行为追踪）是错的。P0模块上线前必须先修复GA4，否则CTA效果无法准确评估。

---

## 下周目标（W29，7/14–7/18）

### ⭐ W29 最高优先：CTA P0模块开发排期 + GA4修复

**GA4修复（前置条件）：**
- [ ] 开发检查Vozinha页面Console报错，修复脚本中断
- [ ] Next.js `router.events` 加 `page_view` 手动触发，覆盖全站wiki文章页
- [ ] 修复后用DebugView验证：从列表页点入文章，确认page_view正常发出

**CTA P0排期（前置依赖GA4修复）：**
- [ ] 确认Haaland/Mbappé/Hakimi内链bug修复状态
- [ ] 模块A（Nav按钮）+ 模块B（Scroll Sticky）+ 模块C（文章顶部卡）进入开发排期

### 内容执行

**Emmy提名（紧急）：**
- [ ] 预处理Ayo Edebiri（生日7/18，需在7/17前发布）
- [ ] 预处理Zendaya（搜索量最大，优先级T1）
- [ ] Hub页：2026 Emmy Nominees Zodiac Signs列表文章

**趋势blog（本周未完成）：**
- [ ] Yamal生日内容（7/13生日，需7/12前发布）
- [ ] 预处理Mbappé、Djokovic、Gauff、Salah

**待补文档：**
- [ ] 重新生成AstrologyWiki优化需求文档（基于SEO-SOP升级补丁8个补丁）

### 数据跟踪

**W29结束时需要回答：**
- GA4修复后，wiki文章页PV/UV比是否恢复正常（接近1:1）？
- 5篇W28 blog（若发布）合计UV是否回升至W27水平（48 UV）？
- Yamal生日当天（7/13）是否出现流量spike？
- Emmy内容在首周能带来多少UV？

---

*本报告基于W28（7/7–7/10）inbox文件与GA4截图回溯整理 | 撰写日期：2026-07-10 | 下次更新：W29（2026-07-17前后）*
