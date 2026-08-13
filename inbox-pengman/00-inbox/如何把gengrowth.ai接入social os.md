要把 GenGrowth AI（gengrowth.ai） 接入 Social OS，不能直接复用 AstrologyWiki 的配置或 Sheet。正确方式是：

｜ 新产品独立建一张 Social OS Sheet、一份产品配置、一个产品入口 Skill、一份产品内容规则，然后从 H0 产品定位开始冷启动。

当前我只知道产品名和 URL。Social 工作区里还没有经过授权的 GenGrowth AI 产品定位、ICP、账号策略和内容规则，因此不能根据域名自行猜测。

――――――

一、你需要先完成的产品输入

1. 确定产品标识

建议使用：

・展示名称：GenGrowth AI

・产品短名：gengrowth-ai

・ID 前缀：ggai

・产品网址：[https://gengrowth.ai/](https://gengrowth.ai/)

・Social OS 名称：Social OS — GenGrowth AI

・产品入口：social-pipeline-gengrowth-ai

不要把产品短名写成带点号的 gengrowth.ai，避免目录名、ID 和命令参数出现歧义。

――――――

2. 填写 H0 产品 Brief

这是最重要的一步。至少需要明确以下内容。

产品定位

1）一句话定位

◦ GenGrowth AI 是什么？

◦ 面向谁？

◦ 解决什么问题？

◦ 与其他 AI 产品有什么区别？

2）核心问题

◦ 用户现在最痛的是什么？

◦ 这个痛点是效率、增长、内容、获客、自动化，还是其他问题？

3）目标市场

◦ 中国还是海外？

◦ 重点国家或地区？

◦ 主要语言是中文还是英文？

4）当前增长目标

◦ 曝光

◦ 关注

◦ 网站访问

◦ Waitlist

◦ 注册

◦ Demo 预约

◦ 付费

◦ 需求验证

5）目标指标

例如：

◦ 每周带来 50 个网站访问

◦ 每月获得 20 个 Waitlist 注册

◦ 每周获得 5 个 Demo 预约

◦ 验证某类内容能否带来有效注册

6）目标用户动作

◦ 访问官网

◦ 注册账号

◦ 加入 Waitlist

◦ 预约 Demo

◦ 订阅 Newsletter

◦ 下载资料

◦ 试用某个工具

7）落地页

◦ 官网首页

◦ 注册页

◦ Waitlist 页面

◦ Demo 页面

◦ 具体工具页

◦ Newsletter 页面

品牌表达

还需要确定：

・品牌语气关键词

・可以做的表达

・禁止表达

・事实边界

・哪些数据必须有来源

・是否允许对竞争产品做公开比较

・是否允许使用客户案例

・是否允许提收入、ROI、增长倍数

・哪些表述涉及隐私、商业秘密或未经验证的能力

例如禁止项可能包括：

・未经证实的效果承诺

・“保证增长”“保证获客”

・伪造用户案例

・伪造客户 Logo

・伪造收入、转化率和使用量

・把尚未上线的功能描述为已上线

・未授权披露内部数据

・冒充用户评价

・没有证据的竞品贬损

这些需要 CEO/PM 明确，Social 不能自己决定。

――――――

二、定义 GenGrowth AI 的 ICP

至少要有一个完整用户画像，建议先写一到两个，不要一开始覆盖所有人。

每个 ICP 需要：

・persona_id

・用户名称

・年龄或职业阶段

・身份与工作环境

・核心痛点

・触发时刻

・当前替代方案

・付费意愿

・优先级

例如需要回答：

```text
用户是谁？
他在什么情况下会意识到自己需要 GenGrowth AI？
他现在用什么方法解决？
现有方法为什么不够？
他为什么会停下来看我们的内容？
他看完后最可能执行什么动作？
```

可能的 ICP 类型只能由产品事实决定，例如：

・独立创业者

・小型 SaaS 创始人

・增长负责人

・内容营销人员

・海外获客团队

・AI 工具开发者

・需要自动化运营的小团队

目前这些都只是可能性，不能直接当成 GenGrowth AI 的真实 ICP。

――――――

三、确定社媒账号策略

1. 先决定使用哪些平台

需要明确：

・TikTok

・YouTube Shorts

・LinkedIn

・X

・小红书

・视频号

・Instagram Reels

・其他渠道

Social OS 中一行代表一个具体账号，不是 “所有平台统一发”。

2. 每个账号需要配置

・Handle

・平台

・状态：active /paused/retired

・内容方向

・每周发布槽位

・Avatar

・Voice

・语速

・背景

・字幕样式

・画幅

・HeyGen 模板

・Avatar 商用授权证据

3. 建议先少账号启动

Social OS 的硬规则是：

｜ 启用账号数不能超过实际周产能能够稳定支持的数量，每个启用账号至少按每周三条估算。

如果一周只能做 6 条，建议最多先启用两个账号；如果一周只能做 3 条，先跑一个账号。

不要一开始同时启用 TikTok、YouTube、LinkedIn、X 和小红书，然后每个平台都断更。

――――――

四、编写 GenGrowth AI 的产品内容规则

这是新产品接入时非常关键、也最容易被遗漏的一部分。

系统要求有一份独立的 GenGrowth AI Social Workflow / Product Rules，至少包含三个可被机器精确读取的部分。

1. 研究与选题规则

需要定义：

・选题来源

・竞品范围

・用户声音来源

・候选内容池

・实时研究要求

・什么证据可以引用

・什么证据不够

・如何去重

・什么情况可以新增候选

・什么情况只是执行已有计划

・Hot 内容如何评分

2. Hook、事实、安全和文风规则

需要定义：

・Hook 应该如何写

・前 2–3 秒要表达什么

・使用中文还是英文

・是创始人语气、专家语气、产品经理语气，还是 AI Host 人设

・哪些事实必须核验

・哪些表达不能出现

・是否允许使用收入、客户、增长数字

・产品能力如何描述

・如何避免 AI 味

・如何处理竞品对比

・口播稿时长和结构

3. Caption、Hashtag、CTA 和检查规则

需要定义：

・Caption 的长度与风格

・Hashtag 数量和类型

・是否使用品牌标签

・哪些内容必须带链接

・CTA 指向什么页面

・UTM 命名规则

・是否每条都要 CTA

・发布前检查项目

・AIGC 标签规则

・是否需要免责声明

缺少这份 Product Rules 时，research、script 和 package 都应该直接阻塞，不能退化成通用 AI 写作。

――――――

五、创建独立的 Google Sheet

需要新建：

```text
Social OS — GenGrowth AI
```

不能使用 AstrologyWiki 的 Social OS Sheet。

这张表会包含十个 Tab：

1）产品定位

2）账号与形象

3）选题审批

4）文案包

5）口播稿

6）数据回收

7）复盘结论

8）内部_证据池

9）内部_假设

10）内部_对标基线

前三张与生产最相关：

・「产品定位」承载 H0

・「选题审批」承载 H3

・「文案包」承载 H4

另外三张内部表默认隐藏，但不能删除。

――――――

六、建议建立独立飞书群

建议建立类似：

```text
# social-gengrowth-ai
```

原因是 runner 的产品路由优先看当前聊天对应哪个产品。

如果 AstrologyWiki 和 GenGrowth AI 共用同一个群，每条消息都必须明确写产品名，例如：

・“跑 GenGrowth AI 本周选题”

・“把 GenGrowth AI 的 c-xxxx 做成文案包”

・“将这个竞品并入 GenGrowth AI 池”

使用独立群可以减少误写到错误 Sheet 的风险。

需要把群的 chat_id 配置为：

• runtime.notification_chat_id

人工门提醒会发到这个群。

――――――

七、创建产品入口与配置

技术上由 PM/Ops/Hermes 负责人执行。Social 不应自行修改正式 Skill 或配置。

建议命令为：

```bash
PY=/Users/awayer_mini/hermes-agent/.venv/bin/python
R=~/.hermes/profiles/social/skills/social-media/social-pipeline-core/scripts/social_pipeline.py

$PY "$R" new-product \
  --name gengrowth-ai \
  --spreadsheet-id <新建Sheet的ID> \
  --chat <GenGrowth-AI飞书群chat_id>
```

它会建立薄产品入口和配置骨架，但不会自动猜产品规则。

随后需要补齐：

```text
social-pipeline-gengrowth-ai/
├── SKILL.md
└── product-config.yaml
```

其中配置至少要补：

• product

• skill_manifest.entry

• skill_manifest.product_rules

• runtime

• approvers

• positioning

• icp

• accounts

• data_sources

• candidate_pools

• production_routing

• metrics

• compliance

• docs

缺失项必须保持 null 或 []，不能填：

・未知

・待补

・TBD

・稍后确认

因为这些字符串会假装满足 “非空” 校验，最终污染生成内容。

在所有前置条件满足前：

```yaml
setup:
  status: blocked
```

――――――

八、配置 Skill Manifest

GenGrowth AI 需要声明本轮模型实际要读取哪些 Skill 和规则。

至少包括：

产品入口

```yaml
entry:
  name: social-pipeline-gengrowth-ai
  path: SKILL.md
```

通用 Core

```yaml
core:
  name: social-pipeline-core
  path: ../social-pipeline-core/SKILL.md
```

产品规则

```yaml
product_rules:
  name: gengrowth-ai-social-workflow
  path: <产品规则文件路径>
```

并分别配置：

・research 读取哪些章节

・script 读取哪些章节

・package 读取哪些章节

章节标题必须：

・实际存在

・唯一

・能被读取

・与配置中的版本匹配

否则 prepare-context 会 fail closed。

这可以避免模型在新产品没有规则时，仍然用 AstrologyWiki 的内容习惯或通用写作经验生成稿件。

――――――

九、初始化 Sheet 并建立人工保护区

配置完成后由 PM/Ops 运行：

```bash
$PY "$R" validate \
  --config ~/.hermes/profiles/social/skills/social-media/social-pipeline-gengrowth-ai/product-config.yaml
```

然后：

```bash
$PY "$R" init \
  --config ~/.hermes/profiles/social/skills/social-media/social-pipeline-gengrowth-ai/product-config.yaml
```

init 会：

・创建十个 Tab

・创建表头

・写字段说明

・建下拉选项

・写派生公式

・隐藏内部表

・隐藏审计列

・返回人工保护区设置说明

为什么保护区必须人工设置

Google Sheets 的限制决定了 service account 不能建立一个 “把自己排除在编辑者之外” 的保护区。

因此：

1）runner 给出要保护的列

2）人工在 Google Sheets UI 中建立保护区

3）保护区编辑者只保留指定人工负责人

4）排除 service account

5）再运行验证

6）runner 用真实写入探针确认 service account 被拒绝

这一步不能跳过。否则看起来有 H0–H5，实际上机器人仍然能写审批列。

――――――

十、完成 H0：人工锁定产品 Brief

初始化后，负责人需要在「产品定位」填写并批准：

・产品名称

・产品网址

・一句话定位

・目标用户

・核心痛点

・目标市场

・CTA

・品牌语气

・禁止表达

・种子竞品

・周产能

・审批人

・审批时间

H0 没过时，不能开始正式候选研究。

飞书里说 “定位没问题” 不算通过，必须在 Sheet 填审批字段。

――――――

十一、建立第一批证据池

冷启动阶段建议准备：

竞品种子

至少三类：

・直接产品竞品

・内容竞品

・目标用户当前关注的替代方案

不要只看同类 SaaS，也要看：

・同类创始人账号

・增长教育账号

・用户正在使用的工作流

・替代产品的教学内容

・目标用户的抱怨和需求表达

用户声音

需要真实公开来源，例如：

・Reddit 讨论

・X 帖子

・YouTube 评论

・产品社区

・SaaS/AI 社群公开讨论

・Product Hunt 评论

・G2/Capterra 等评价

・公开访谈或用户反馈

用户声音支撑正式假设时，建议至少：

・5 个独立直接 URL

・横跨至少 2 个平台

搜索摘要、登录墙和只看到标题的页面不能支撑正式结论。

H1 冷启动要求

新产品第一次建证据池时，所有来源应当人工全量复核，而不是只抽检。

之后进入稳定运行，才可以改为运行期抽检。

――――――

十二、建立对标基线和内容假设

证据入池后，系统会生成：

对标基线

例如：

・参考账号 30 天播放中位数

・样本量

・账号发布频率

・我方初始目标

冷启动时没有内部数据，就用公开可比指标作为相对基线。不能编造：

・完播率

・点击率

・注册率

・转化率

可验证假设

例如可以是：

```text
面向独立创业者的“真实增长流程拆解”，
是否比泛 AI 工具盘点获得更高的完整观看率和主页访问？
```

但正式假设必须来自真实产品定位和已核验证据，而不是这个示例本身。

每条假设需要：

・明确可证伪

・回链证据 ID

・成功指标

・观察窗口

――――――

十三、完成 H2：锁定账号与内容方向

人工在「账号与形象」确认：

・哪些账号 active

・每个账号负责什么

・每周发几条

・哪些题材不能发

・Avatar 和声音

・背景与字幕

・制作工具

・商用授权证据

这一步通过后，系统才能把选题路由给具体账号。

如果还没有账号，可以先配置为 not_activated 或保持不启用，不能为了通过校验假装 active。

――――――

十四、跑第一周选题

H0、H1、H2 都完成后，才进入 Mode B 候选研究。

系统会根据：

・产品定位

・ICP

・已核验证据

・对标基线

・内容假设

・账号定位

・周产能

・当前库存

・实时来源

・去重结果

生成有限数量的候选，写入「选题审批」。

每条包含：

・content_id

・账号

・Title

・Hook

・Angle

・Why now

・分数

・假设回链

・建议制作形式

然后停在 H3，等待人工选择。

――――――

十五、走完第一条端到端验收

选中第一条后，按下面的链路验收：

```text
H3 selected
→ prepare-context(script)
→ 生成唯一口播稿
→ stage=scripting
→ prepare-context(package)
→ 生成文案包
→ checks=ok
→ H4 人工批准
→ ready_to_paste=TRUE
→ 人工制作
→ 人工发布
→ 回填 publish_url/published_at
→ 24h 数据快照
→ status=ok
→ 生成首条 L1 复盘结论
```

新产品接入的完成标准不是 “Sheet 建好了”，而是：

｜ 至少一条真实内容从选题走到发布，并产生一个有效的 24 小时数据快照，所有记录可以沿 content_id 回链。

――――――

十六、你现在最需要提供的信息

可以直接按下面模板回复：

```text
【GenGrowth AI 产品信息】

1. 一句话定位：
2. 解决的核心问题：
3. 产品当前已上线的主要功能：
4. 产品当前不能对外承诺的功能：
5. 目标市场：
6. 内容语言：
7. 当前增长目标：
8. 目标指标：
9. 用户看完内容后的目标动作：
10. 主要落地页：

【ICP 1】
- 用户名称：
- 年龄/职业阶段：
- 身份与工作环境：
- 核心痛点：
- 触发时刻：
- 当前替代方案：
- 付费意愿：

【ICP 2，可选】
- 用户名称：
- 年龄/职业阶段：
- 身份与工作环境：
- 核心痛点：
- 触发时刻：
- 当前替代方案：
- 付费意愿：

【品牌规则】
- 品牌语气：
- 禁止表达：
- 必须核验的事实：
- 是否允许竞品比较：
- 是否允许使用客户案例：
- 是否允许公开收入/增长数字：

【社媒执行】
- 目标平台：
- 已有账号及 Handle：
- 每周可投入时间：
- 每周计划产量：
- 可用制作工具：
- 是否使用 AI Avatar：
- Avatar/Voice 是否有商用授权：

【审批人】
- H0 产品定位：
- H2 账号策略：
- H3 选题：
- H4 文案包：
- H5 复盘结论：

【基础设施】
- 新 Google Sheet ID：
- GenGrowth AI 飞书群 chat_id：
- 初始竞品 URL（至少 3 个）：
- 已有用户调研或反馈来源：
```

收到这些输入后，下一步应由 PM/Ops：

1）建独立 Sheet 和飞书群

2）创建产品入口与配置骨架

3）编写并审批 GenGrowth AI Product Rules

4）初始化 Sheet、设置人工保护区

5）完成 H0

6）再由 Social 开始证据池和首周候选研究

这样可以确保 GenGrowth AI 不会误用 AstrologyWiki 的 ICP、账号逻辑、占星文风、竞品证据或安全规则。 