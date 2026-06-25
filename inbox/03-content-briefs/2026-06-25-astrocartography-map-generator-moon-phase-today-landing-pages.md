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

## 2.2 ⚠️ 与Blog选题的蚕食检查（2026-06-25新增）

查了`选题登记表.csv`，发现真实冲突：`PG-CARTO-001`（target keyword: astrocartography interpretation，Pillar角色，状态待写，cluster_id: astrocartography_map）的Friction字段是"Beginners treat all astrocartography lines as equally potent because SERP beginner guides list all line types without establishing the angular line hierarchy (ASC/MC/IC/DSC)"——这跟下面原本设计的"线型说明"、"行星含义"两个H2内容高度重叠。

**处理方式：Pillar-Spoke分工，不是二选一**——工具页只做定向（一句话带过线型/行星），把"ASC/MC/IC/DSC层级原理+交叉点叠加效应"这个真正有差异化角度的深度内容让给PG-CARTO-001去承担，工具页内链过去。下面的页面结构已经按这个分工压缩。

## 2.3 页面结构

**H1：Astrocartography Map Generator**

副标题（H1下方一句话，非标题）：Enter your birth details to generate a world map showing where each planet's influence is strongest.

**工具表单**（复用现有astrocartography工具的计算逻辑，UI不变）：Birth Date / Time / Location → "Generate My Map" 按钮 → 输出地图

---

**H2：What Your Astrocartography Map Shows**
（120-150字）地图上每条线代表一颗行星在地球上某个经纬度恰好升起/落下/到达中天/下中天的位置；站在那条线附近，那颗行星的主题在你的生活里会被放大。这是出生盘的"空间版"——出生盘回答"我是谁"，astrocartography回答"我在哪里会感觉到不同"。

**H2：The Four Line Types, Briefly**
（**已压缩为1-2句定向**，不展开层级原理：地图上有四种线——MC/IC/ASC/DSC，分别对应事业、家庭、自我表达、关系。**接一句话+链接**："Want to know which lines matter most and how crossing points compound their effects? Read the full interpretation guide →"，链接到`/en/blog/astrocartography-interpretation`（PG-CARTO-001发布后的URL，待发布前用占位说明）)

**H2：What Each Planet Represents on Your Map**
（Sun/Moon/Venus/Mars/Jupiter/Saturn各1句话，**不展开成40-60字段落**，强动词：govern/modulate，依据blog创作要求清单_v4.0禁用is about/relates to——深度留给blog，工具页只做快速对照表）

**H2：Astrocartography Map Generator vs. the Full Astrocartography Guide**
（80字内，明确分工：这个页面是"生成工具"，完整方法论解释链接到 `/en/astrocartography`——一句话+一个链接，不重复内容）

**H2：Frequently Asked Questions**（FAQ schema与下面4题逐字一致，全部固定文本，不含会变化的数据）
1. Is this astrocartography map generator free?
2. Do I need my exact birth time to generate an accurate map?
3. What's the difference between this tool and the main Astrocartography page?
4. Can I download or share my generated map?

## 2.4 内链规划
- 向上链接：`/en/astrocartography`（母页，"了解完整方法论"）
- **深度内容链接（新增）**：`/en/blog/astrocartography-interpretation`（PG-CARTO-001发布后），承接"线型层级原理"这块被压缩掉的深度内容——**PG-CARTO-001发布时也要反向加一条链接指向这个工具页**（"Generate your map →"），双向互链
- 横向链接：`/en/birth-chart-calculator`（"先获取准确生辰数据"）、`/en/solar-return-calculator`（搬迁/旅行主题年份重叠）
- 面包屑：Home > Tools > Astrocartography > Map Generator
- 母页`/en/astrocartography`需要反向加一条链接指向这个新页面（"Generate your personal map →"），对应指南P1内链矩阵

---

# 三、Moon Phase Today

## 3.1 基本信息

| 项目 | 内容 |
|---|---|
| Target keyword | Moon Phase Today |
| 建议URL | `/en/moon-phase-today` |
| 跟现有页面关系 | **补充落地页，不替换** `/en/moon-phase-calculator`。现有页面是"查任意日期"（lookup型），新页面是"查今天"（实时型），意图不同不算蚕食 |
| Meta title | `Moon Phase Today – What Moon Phase Is It Right Now? \| AstrologyWiki` |
| Meta description | `See today's exact moon phase and illumination percentage, updated daily. Plus a quick guide to all 8 moon phases.` |

## 3.2 工程依赖（已简化，2026-06-25修订）

**原方案问题**：把"今日相位计算"（确定性数学公式，难度低）和"FAQ文字每日更新"（内容运维负担，难度高、风险高）混在一起了。两者拆开处理：

- **首屏数据块**：只是"输入=今天"的现有月相计算逻辑，跟moon-phase-calculator引擎一样，**工程难度低**，照常服务端渲染、避开P-1 hydration替换问题即可
- **FAQ schema和所有H2说明文字：改为100%固定文本，不引用任何会变化的具体数值**（如相位名称、百分比）。这样schema永远不会跟可见内容失步，**不需要每日内容更新机制**，原方案"8种月相模板文案+判断逻辑"整段删除，连带的风险一起消除

## 3.3 页面结构

**H1：What Moon Phase Is It Today?**

**首屏数据块**（服务端渲染，按访问日期自动计算，纯展示，不涉及文案）：
- 今日月相名称（如"Waning Gibbous"）+ 月相图标
- 月面照亮百分比（如"68% illuminated"）
- 距下次满月/新月天数倒计时

---

**H2：Why the Moon's Phase Changes Every Day**
（80-100字，固定文本，强动词：月亮绕地球公转 governs 8个月相周期，约29.5天一轮，不用is about）

**H2：The 8 Moon Phases at a Glance**
（固定文本，一个小表格/列表，8种相位各一句话定义，**不判断"今天是哪个"，只是科普全部8种**——跟首屏的动态数字分开，永远不用更新）

**H2：Need a Different Date Instead of Today?**
（一句话+链接：If you want to check the moon phase for a past or future date, use the → Moon Phase Calculator）

**H2：Frequently Asked Questions**（FAQ schema与下面4题逐字一致，全部固定文本）
1. What moon phase is it today?（答案：通用描述+引导看上方数据块，不写死具体相位名）
2. How often does the moon's phase change?
3. What's the difference between this page and the Moon Phase Calculator?
4. Where can I check the moon phase for a different date?

## 3.4 内容空缺机会——建议新开Blog选题，不塞进工具页（2026-06-25新增）

WebSearch实测验证：真实竞品 lunarguideapp.com 把关键词"moon phase today"和"spiritual meaning"绑在一起做（"Moon Phase Today Spiritual Meaning: What Today's Moon Means + Next Phases"），内容模式是"今日相位+精神含义+建议仪式行为"，证明这块需求是真实存在的。

但选题登记表里**目前没有任何月相相关的blog选题**——这不是冲突，是空缺。原方案想塞进工具页的"What Today's Phase Means Astrologically"（按相位动态换文案）应该**独立成一个新blog选题**，而不是留在工具页里：

- 建议target keyword候选：moon phase meaning today / what to do during each moon phase
- 内容角度：8种相位各自的精神含义+对应仪式建议（celebration/journaling/release等，参考lonerwolf.com、spiritualityhealth.com的内容结构）
- 这样工具页保持固定文本（解决3.2的工程复杂度问题），深度内容去blog发挥，两边都不互相牵制
- **是否要正式登记进选题登记表，需要你确认**——目前只是在这里提出候选，没有写入CSV

## 3.5 内链规划
- 横向链接：`/en/moon-phase-calculator`（查其他日期）、`/en/birth-chart-calculator`（"对比你出生时的月相"，可选延伸角度）
- **深度内容链接（新增）**：未来3.4节的新blog选题发布后，工具页加一条"Want to know what today's phase means for you? →"链接过去，blog页反向链接回工具页
- 面包屑：Home > Tools > Moon Phase > Today
- 母页`/en/moon-phase-calculator`需要反向加一条链接指向这个新页面（"Check today's phase instantly →"）

---

# 四、上线顺序建议

两个页面工程难度都不高（2026-06-25修订后）：Astrocartography Map Generator 复用现有计算逻辑+UI模式，没有额外依赖；Moon Phase Today 在去掉"每日动态FAQ/解读文案"那部分后，剩下的"今日相位数值展示"跟现有moon-phase-calculator引擎同等难度。**两个都可以先做**，不存在谁卡谁的工程瓶颈。唯一共同的风险点仍然是P-1：上线前都要单独跑一遍第一节的验收清单。

# 五、本轮研究方法说明（可追溯）

本简报的修订依据三类真实数据，不是凭经验设计：
1. `选题登记表.csv`（Downloads本地文件）—— 查出PG-CARTO-001跟Astrocartography Map Generator的内容重叠，发现真实蚕食风险
2. WebSearch实测——验证"moon phase today"+"spiritual meaning"组合需求真实存在（竞品lunarguideapp.com、lonerwolf.com、spiritualityhealth.com），但同时确认这块内容应该独立成blog而非塞进工具页
3. 指南`2026-06-23-工具页词根挖掘与扩站指南.md`2.3/2.7/2.8/1.3.1节——P-1渲染bug、FAQ schema匹配规则、标准②KD阈值，都是已有结论的延续应用
