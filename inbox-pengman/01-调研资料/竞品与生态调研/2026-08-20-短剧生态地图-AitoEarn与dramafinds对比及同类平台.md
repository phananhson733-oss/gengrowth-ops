---
title: 短剧生态地图 · AitoEarn vs dramafinds 对比与同类平台
project: gengrowth
type: competitor-platform-research
status: draft
owner: Pengman
created: 2026-08-20
scope: 短剧内容分发与商业化
related:
  - 2026-08-20-AitoEarn平台调研-短剧分销生态玩家
  - 2026-08-19-短剧推广职业调研-切片引流工作流
  - 2026-08-14-技术审计-dramafinds
---

# 短剧生态地图：AitoEarn vs dramafinds 对比与同类平台

> 来源：AitoEarn 官方文档（docs.aitoearn.ai）、dramafinds.com 各页面（/about /purchase /genre）、公开搜索摘要、此前 dramafinds 技术审计。
> 目的：说清两个平台的区别与关联，并列出两个赛道各自的同类玩家，供判断"我们该学谁、该和谁合作、该防谁"。

---

## 一、AitoEarn vs dramafinds：根本区别

| 维度 | AitoEarn | dramafinds.com |
|---|---|---|
| **角色定位** | 推广任务撮合平台 + AI 内容营销工具（连接创作者 ↔ 各短剧 App） | 短剧内容承载/观看网站（面向观众直接看剧） |
| **核心业务** | 接任务、剪片、发帖、按 CPS 分佣 | 托管/展示剧集，用户在线观看，订阅收费 |
| **变现模型** | CPS：用户**下载 App + 应用内付费/充值**后给创作者分佣（ReelShort 45% / DramaBox 60% 等） | **网站订阅**：周/月/年费，信用卡/PayPal，无虚拟币；自动续费、一般不退款 |
| **内容来源** | 不提供内容，聚合各短剧 App 的推广任务 | 自己托管剧集内容（首页图片素材来自 crazymaplestudios.com CDN = ReelShort 母公司 Crazy Maple Studio） |
| **面向对象** | 创作者/推广者（想赚钱的人） | 观众/用户（想看剧的人） |
| **运营主体** | 中方运营（京ICP 备案 京ICP备19059131号-15） | ShunGuang Technology Limited，香港（尖沙咀科学馆道 14 号） |
| **是否拥有账号** | 创作者自带账号（它提供云工作区做隔离） | 用户注册账号看剧/订阅 |
| **核心资产** | 任务市场、数据看板、自动化工具 | 剧集库、订阅支付链路、SEO 流量 |

**一句话**：AitoEarn 是**卖"如何把观众带过去"的能力**，dramafinds 是**承接观众并赚钱的地方**。一个在流量上游，一个在变现下游。

---

## 二、两者的关联（能不能连起来）

**理论上能连：** 如果 dramafinds 有 App 或支持订阅归因，它完全可以作为 AitoEarn 式任务的目标落地平台（创作者引流 → 用户注册/订阅 → 分成）。

**现实障碍：**
1. **结算模型不匹配**：AitoEarn 的 CPS 按"App 下载 + 应用内充值"触发；dramafinds 是**网站订阅制**，且明确"不提供虚拟货币/代币"——除非 dramafinds 自己建联盟系统或接入第三方联盟（如 Adscend/Armada 的 CPI/CPA），否则 AitoEarn 的现成结算链路套不上。
2. **不在任务清单里**：AitoEarn 的短剧任务和分成表覆盖的都是 App（ReelShort、DramaBox、ShortMax、TopShort 等），**没有 dramafinds**。
3. **版权链路存疑**：dramafinds 用的素材来自 Crazy Maple Studio CDN，但此前审计未确认它与版权方的正式分销/授权关系——这决定它能否合法地把剧给创作者做二次推广。

**对我们（帮 dramafinds 推广）的含义：** 我们做的正是"把观众带给 dramafinds"这层（视频端引流 → dramafinds 订阅/观看）。AitoEarn 的整套机制提醒我们：**要跑通，dramafinds 得先具备可归因的转化事件**（订阅成功、注册、有效观看时长），否则引流了也算不了你的业绩。

---

## 三、类似 AitoEarn 的平台（推广/分销任务侧）

| 平台/类型 | 形态 | 说明 |
|---|---|---|
| **DramaCPS** | 短剧 CPS 聚合联盟 | 聚合多家短剧 App 的分佣任务，创作者接入后选剧推广 |
| **shortdramapartner.com** | ReelShort 联盟教程/服务 | 教程站 + 邀请码服务，此前调研已接触（数字按运营说法处理） |
| **ReelShort RS Boost**（官方） | 官方 CPS 分销 | 邀请码制，官方素材区，最高约 30% + 二级下线提成（待官方协议确认） |
| **ShortMax / TopShort / MoboReels / GoodShort / DreameShort / Playlet**（各官方） | 官方联盟/分销 | 各平台自建分销后台，部分走邀请制；AitoEarn 表上 CPS 45–70% |
| **Adscend Media / Armada App** | 第三方 CPA/CPI 网络 | 有 ReelShort/DramaBox 等按安装付费 offer（约 $0.2–0.5/install 量级） |
| **点众/番茄/红果 分销系统**（国内） | 国内短剧分销 | 抖音/快手生态内的短剧 CPS，与海外模型同源 |
| **DataEye ADX / 抖查查** | 选剧/投流数据工具 | 非分销平台，但提供选剧数据（与 AitoEarn 数据选剧台同类） |
| **AitoEarn 本身** | 任务市场+AI 工具+云工作区 | 集大成者，已单独立档 |

**与 AitoEarn 的差异：** 官方联盟（RS Boost 等）只推自家剧；聚合平台（DramaCPS/AitoEarn）可跨多家选剧，但结算走平台渠道、佣金被平台抽一层；第三方 CPA 网络按安装付费、无长线分成。

---

## 四、类似 dramafinds 的网站（内容承载/观看侧）

| 网站/平台 | 形态 | 与 dramafinds 的异同 |
|---|---|---|
| **Anyreel.app** | 短剧+电影网页站 + App（Next.js） | 结构最像：首页剧集流、Browse/Tags/Genre、App 引流（onelink）；素材走自己的 OSS（oss.tallflix.com / anyoss.anyreel.app），非 ReelShort CDN |
| **DramaWave（dramawave.live）** | 中文免费短剧站 | 登录免费看，靠"分享/点赞/评价"解锁全集；有邀请码裂变、WhatsApp/Telegram/微信分享——**裂变玩法可借鉴** |
| **爱短剧** | 中文短剧聚合站 | 2 万多部、每日更新、全网热剧排行榜 |
| **ShortDramaX / ShortDrama（YouTube 频道）** | YouTube 上架全集 | 短剧出海主流承载方式之一（视频平台承载，非自有站） |
| **红果短剧**（字节系） | App | 看广告解锁免费集，字节系流量+广告变现 |
| **爱奇艺微短剧频道** | 长视频平台内置频道 | 大厂入局，版权正规化路径的参照 |
| **ReelShort / DramaBox 官方站** | App+官网 | 一手版权方，独占内容 |
| **FlexTV / 短剧天堂 / 更多小站** | 网页/App | 大量同类小站（与前审计"约 300 个小 App"观察一致） |

**模式规律**：网页承载站（dramafinds/Anyreel/DramaWave）靠 SEO + 站内订阅/广告变现；App 承载站（红果/ReelShort）靠 App 内购/广告变现；视频平台承载（YouTube 频道）靠视频广告+评论区/描述导流。**dramafinds 属于第一种，也是我们推广时要打交道的形态。**

---

## 五、结论：生态里我们站在哪、该怎么做

**生态位置：**
```
短剧版权方/制作方（ReelShort/COL Group 等）
   ↓ 授权/分销
短剧平台（App：ReelShort/DramaBox/ShortMax…；网站：dramafinds/Anyreel…）
   ↓ 推广渠道
分销联盟（RS Boost / DramaCPS / AitoEarn…）
   ↓ 推广动作
创作者/推广者（我们：8 个账号剪切片引流）
   ↓ 转化
用户下载/订阅/观看 → 分佣
```

**我们实际在"创作者/推广者"这一层，服务对象是"网站型平台（dramafinds）"这一层。**

**动作建议：**
1. **学 AitoEarn 的数据选剧 + 运营方法论**（已归档），但账号/发布层自己掌握，不授权第三方。
2. **向 dramafinds 确认三件事**：①内容授权/版权链路是否书面可查；②是否有可归因的转化事件（订阅/注册/观看）用于结算；③是否愿意建自己的分销/联盟（或接入现有联盟）。
3. **盯同类网站玩法**：Anyreel（结构参考）、DramaWave（裂变解锁玩法参考）、红果（广告变现参考），用于反哺我们对 dramafinds 的推广设计。
4. **用 AitoEarn 分成表当谈判基准**，别被单一渠道的口头比例框住。

---

## 六、关键词（人工继续调研用）

1. 短剧分销平台 有哪些 对比
2. 短剧 CPS 联盟 DramaCPS
3. 短剧 官网 网页版 观看 网站 免费
4. 短剧 裂变 解锁 分享 玩法
5. 短剧 App 官方 分销 邀请码
6. ReelShort RS Boost 协议
7. dramafinds alternative sites
8. short drama web viewer website list
9. micro drama affiliate aggregator platform
10. short drama subscription website monetization model
11. 红果短剧 商业模式 广告解锁
12. 短剧 出海 承载渠道 对比

---

## 附：来源清单

- docs.aitoearn.ai（短剧任务指南/数据选剧台/分成规则/云工作区）
- dramafinds.com（首页 / about / purchase / genre；运营商 ShunGuang Technology Limited，香港）
- 2026-08-14 技术审计-dramafinds.md（本仓库 inbox-maboyang/01-review-audit）
- anyreel.app、dramawave.live（同类网页承载站）
- 知乎"一文盘点市面 10+ 主流短剧平台"等公开搜索摘要（仅定位参考）

*调研执行 2026-08-20。*