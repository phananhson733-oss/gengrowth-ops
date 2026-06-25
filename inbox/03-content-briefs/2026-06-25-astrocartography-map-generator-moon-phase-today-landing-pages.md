---
title: 落地页设计——Astrocartography Map Generator + Moon Phase Today
date: 2026-06-25
status: draft
依据: 2026-06-23-工具页词根挖掘与扩站指南.md（2.7/2.8/1.3.1节）
适用范围: 两个新工具子页面，路径A（老站加子页），标准②已验证KD达标
---

# 一、上线前必读：不要重复P-1渲染bug

指南2.3节"致命问题"——现有16个工具页的说明文字+FAQ全部被React组件hydration整体替换，对用户和Google都不可见。**这两个新页面的下面所有文案，工程实现时必须作为组件渲染输出的一部分持久显示，不能只在服务端预渲染快照里有。**

上线验收清单（两个页面都要过）：
- [ ] 浏览器打开页面，JS加载完成后，肉眼能看到下面设计的全部说明段落和FAQ文字（不止表单）
- [ ] GSC「网址检查」→「已抓取页面」截图，确认Google渲染引擎看到的内容跟浏览器一致
- [ ] FAQPage schema里的问题文本跟页面可见的H2/H3文字逐字一致（参照saturn-return-calculator，指南2.3节标注的唯一正确模板）
- [ ] BreadcrumbList schema已加（现有16个页面0/16有，新页面不要重复这个缺陷）

---

# 二、Astrocartography Map Generator

## 2.1 基本信息

| 项目 | 内容 |
|---|---|
| Target keyword | Astrocartography Map Generator |
| 建议URL | `/en/astrocartography-map-generator` |
| 跟现有页面关系 | **补充落地页，不替换** `/en/astrocartography`。现有页面定位"是什么"（探索型），新页面定位"生成我的地图"（动作型），避免内部关键词蚕食 |
| Meta title | `Astrocartography Map Generator – Free Relocation Astrology Tool \| AstrologyWiki` |
| Meta description | `Generate your personal astrocartography map free. Enter your birth date, time, and location to see which planetary lines run through any place on Earth.` |

## 2.2 页面结构

**H1：Astrocartography Map Generator**

副标题（H1下方一句话，非标题）：Enter your birth details to generate a world map showing where each planet's influence is strongest.

**工具表单**（复用现有astrocartography工具的计算逻辑，UI不变）：Birth Date / Time / Location → "Generate My Map" 按钮 → 输出地图

---

**H2：What Your Astrocartography Map Shows**
（120-150字）地图上每条线代表一颗行星在地球上某个经纬度恰好升起/落下/到达中天/下中天的位置；站在那条线附近，那颗行星的主题在你的生活里会被放大。这是出生盘的"空间版"——出生盘回答"我是谁"，astrocartography回答"我在哪里会感觉到不同"。

**H2：How to Read the Four Line Types**
（每种线一句话，共4条：MC线/IC线/AC线/DC线，各自对应的生活领域强度——事业曝光/家庭根基/自我表达/关系连接）

**H2：What Each Planet's Line Means When You Live or Travel There**
（Sun/Moon/Venus/Mars/Jupiter/Saturn各40-60字，强动词：govern本命太阳线掌管的领域、modulate月亮线调制的情绪基调，依据blog创作要求清单_v4.0禁用is about/relates to）

**H2：Astrocartography Map Generator vs. the Full Astrocartography Guide**
（80字内，明确分工：这个页面是"生成工具"，完整方法论解释链接到 `/en/astrocartography`——一句话+一个链接，不重复内容）

**H2：Frequently Asked Questions**（FAQ schema与下面4题逐字一致）
1. Is this astrocartography map generator free?
2. Do I need my exact birth time to generate an accurate map?
3. What's the difference between this tool and the main Astrocartography page?
4. Can I download or share my generated map?

## 2.3 内链规划
- 向上链接：`/en/astrocartography`（母页，"了解完整方法论"）
- 横向链接：`/en/birth-chart-calculator`（"先获取准确生辰数据"）、`/en/solar-return-calculator`（搬迁/旅行主题年份重叠）
- 面包屑：Home > Tools > Astrocartography > Map Generator
- 母页`/en/astrocartography`需要反向加一条链接指向这个新页面（"Generate your personal map →"），双向互链，对应指南P1内链矩阵

---

# 三、Moon Phase Today

## 3.1 基本信息

| 项目 | 内容 |
|---|---|
| Target keyword | Moon Phase Today |
| 建议URL | `/en/moon-phase-today` |
| 跟现有页面关系 | **补充落地页，不替换** `/en/moon-phase-calculator`。现有页面是"查任意日期"（lookup型），新页面是"查今天"（实时型），意图不同不算蚕食 |
| Meta title | `Moon Phase Today – What Moon Phase Is It Right Now? \| AstrologyWiki` |
| Meta description | `See today's exact moon phase, illumination percentage, and what it means astrologically. Updated daily.` |

## 3.2 ⚠️ 工程依赖（不是纯内容问题）

这个页面的核心卖点是"今天"的实时月相，**这部分内容需要后端每日自动计算并更新，不是一次性写好的静态文案**。需要：
- 月相计算逻辑（现有moon-phase-calculator的计算引擎应该可以直接复用，只是默认输入=今天而非用户输入）
- 这块动态数据**同样必须避开P-1的hydration替换问题**——服务端渲染今天的月相数据，JS加载后不能把它替换掉，这是这个页面最容易踩雷的地方，比静态说明文字风险更高

## 3.3 页面结构

**H1：What Moon Phase Is It Today?**

**首屏动态数据块**（服务端渲染，按访问日期自动计算，不需要用户输入）：
- 今日月相名称（如"Waning Gibbous"）+ 月相图标
- 月面照亮百分比（如"68% illuminated"）
- 距下次满月/新月天数倒计时

---

**H2：Why the Moon's Phase Changes Every Day**
（80-100字，强动词：月亮绕地球公转 governs 8个月相周期，约29.5天一轮，不用is about）

**H2：What Today's Phase Means Astrologically**
（150-200字，按8种月相分别准备一段模板文案，根据当日月相动态插入对应段落——这部分需要8份预写文案+1个判断逻辑，不是单一固定文案）

**H2：Full Moon Phase Calendar for This Month**
（嵌入当月8个关键月相日期的小日历，或链接到完整日历页若已存在）

**H2：Need a Different Date Instead of Today?**
（一句话+链接：If you want to check the moon phase for a past or future date, use the → Moon Phase Calculator）

**H2：Frequently Asked Questions**（FAQ schema与下面4题逐字一致）
1. What moon phase is it today?
2. How often does the moon's phase change?
3. What does today's moon phase mean spiritually?
4. Where can I check the moon phase for a different date?

> 注意：FAQ第1题"What moon phase is it today"的schema答案文本如果包含具体相位名称，会随每日数据变化——结构化数据需要支持动态更新，不能写死成上线当天的相位，否则几天后就会出现schema内容跟可见内容不一致（重复指南2.3节那个P0级错误）。

## 3.4 内链规划
- 横向链接：`/en/moon-phase-calculator`（查其他日期）、`/en/birth-chart-calculator`（"对比你出生时的月相"，可选延伸角度）
- 面包屑：Home > Tools > Moon Phase > Today
- 母页`/en/moon-phase-calculator`需要反向加一条链接指向这个新页面（"Check today's phase instantly →"）

---

# 四、上线顺序建议

Astrocartography Map Generator 没有工程依赖（复用现有计算逻辑+UI模式），可以先做；Moon Phase Today 需要新增"今日自动计算+动态展示"的工程支持，建议排在后面，且上线前必须单独跑一遍P-1验收清单（第一节），因为动态数据块比静态文字更容易在hydration阶段被替换掉。
