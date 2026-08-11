---
title: AstrologyWiki KOC 建联与 Gmail 草稿闭环
created: 2026-08-04
status: planning
tags:
  - AstrologyWiki
  - KOC
  - Gmail
  - Outreach
  - Codex
---

## 一、当前目标

使用个人 Gmail 联系与 AstrologyWiki 匹配的 KOC，邀请他们成为早期种子用户：

- 体验 AstrologyWiki
- 免费获得一个月 Pro 使用权限
- 提供真实的产品使用反馈
- 当前没有付费推广预算
- 不要求对方必须发布内容
- 如果双方匹配，可以讨论未来合作

现阶段不购买 GMass、Mailmeteor、Mergo 或 Google Workspace。

## 二、完整流程

```text
我提供 KOC 名单和合作条件
↓
Codex 清洗、去重并核验 KOC 匹配度
↓
Codex 生成个性化标题、正文和跟进邮件
↓
我在 Excel 中审核并标记 Approved
↓
Python 只读取 Approved = Yes 的邮件
↓
通过 Google OAuth 连接对应 Gmail
↓
Codex 为每位 KOC 创建一封独立草稿
↓
我打开 Gmail 草稿箱检查
↓
我手动点击发送
↓
记录发送和回复状态
↓
Codex 生成跟进草稿并复盘结果
```

## 三、我需要提供什么

### 1. KOC 名单

最少需要：

- Handle 或姓名
- 公开商务邮箱
- TikTok、Instagram、YouTube 或其他主页链接

如果有，最好同时提供：

- 粉丝量
- 国家或地区
- 内容方向
- 近期相关内容
- 邮箱来源
- 是否已经联系过
- 备注

原则：

- 优先使用公开商务邮箱
- 不编造私人邮箱
- 不购买来源不明的邮箱名单
- 同一个 KOC 不使用两个 Gmail 重复联系

### 2. AstrologyWiki 产品信息

需要确认：

- 官网：<https://www.astrologywiki.com/>
- 一句话产品介绍
- 产品当前阶段
- 目标用户
- 希望 KOC 测试的功能
- 希望获得的反馈
- Pro 权限有效期
- 是否有 Affiliate
- 是否可能开展未来合作
- 发件人姓名和职位
- 邮件签名
- 不希望提及的内容

### 3. 当前合作条件

- 当前没有付费推广预算
- 邀请对方作为早期种子用户
- 可以提供一个月 Pro 权限
- 主要希望获得真实产品反馈
- 不要求对方发布内容
- 如果双方匹配，可以讨论未来合作
- 不承诺未来一定有付费合作

### 4. 推荐英文表达

> We’re currently inviting a small group of astrology creators to try AstrologyWiki as early users.
>
> We’d be happy to provide one month of Pro access in exchange for honest product feedback.
>
> There’s no posting requirement—we’re primarily hoping to learn from your experience.
>
> If the platform feels relevant to you and your audience, we’d also be happy to explore possible collaboration opportunities in the future.

### 5. Gmail 信息

每个账号需要确认：

- Gmail 地址
- 对应品牌
- 发件人显示名称
- 邮件签名
- 每日计划发送量

原则：

- 一个 Gmail 固定代表一个品牌
- 两个账号使用独立签名
- 不交叉联系同一个 KOC
- 不向 Codex 提供 Gmail 密码

## 四、必须由我操作的部分

### 1. Google OAuth 授权

第一次配置时需要我亲自：

1. 登录自己的 Google 账号
2. 创建 Google Cloud 项目
3. 启用 Gmail API
4. 配置 OAuth 同意页面
5. 创建 Desktop App 类型的 OAuth 客户端
6. 下载 `credentials.json`
7. 运行脚本时选择正确的 Gmail
8. 在 Google 页面确认授权

注意：

- Codex 可以指导每一步
- Codex 可以检查配置并排查错误
- Codex 不能代替我输入密码或验证码
- Codex 不能绕过 Google 授权
- 不需要向 Codex 提供 Gmail 密码
- Gmail API 标准使用预计免费

### 2. 审核邮件

发送前检查：

- [ ] KOC 名字正确
- [ ] 收件邮箱正确
- [ ] 个性化赞美真实
- [ ] 没有张冠李戴
- [ ] 对方与 AstrologyWiki 匹配
- [ ] 没有暗示当前是付费推广
- [ ] 一个月 Pro 条件正确
- [ ] 没有要求对方必须发布内容
- [ ] 官网链接正确
- [ ] 发件人和签名正确
- [ ] 使用了正确的 Gmail
- [ ] 对方没有要求停止联系

重点检查高优先级、资料不足、邮箱存在冲突，以及被标记为需要人工复核的 KOC。

### 3. 最终发送

脚本只创建草稿，不自动发送。我需要：

1. 打开 Gmail 草稿箱
2. 检查收件人
3. 检查主题和第一句
4. 检查正文、链接及签名
5. 确认无误后点击发送
6. 不合适的草稿直接修改或删除
7. 更新发送日期和状态

### 4. 商业决定

由我决定：

- 是否提供 Pro 权限
- 是否继续跟进
- 是否接受 KOC 报价
- 是否开展付费合作
- 是否提供 Affiliate
- 是否接受合作条件
- 是否将某人标记为停止联系

## 五、Codex 可以完成的部分

### 1. 名单清洗

Codex 可以：

- 读取并整理 Excel
- 统一字段格式
- 检查邮箱格式
- 删除完全重复项
- 找出重复 Handle
- 找出同一个 KOC 的多个邮箱
- 优先保留公开商务邮箱
- 标记可疑或无效邮箱
- 标记已经联系过的人
- 防止两个品牌重复联系同一个人

### 2. KOC 研究和分级

Codex 可以：

- 查看公开主页和简介
- 核验近期公开内容
- 判断是否属于占星垂类
- 区分占星、塔罗、灵性、疗愈和无关领域
- 判断与 AstrologyWiki 的匹配原因
- 提取真实的个性化切入点
- 将 KOC 分为高、中、低优先级
- 将资料不足者标记为人工复核
- 避免根据用户名编造赞美

建议分类：

- `A`：直接占星垂类，高度匹配
- `B`：塔罗、灵性、疗愈等相邻垂类
- `C`：匹配度较低
- `D`：不相关、可疑或不建议联系
- `R`：资料不足，需要人工复核

### 3. 个性化邮件生成

Codex 可以为每位 KOC 生成：

- 个性化邮件标题
- 个性化第一句
- 完整建联信
- 一个月 Pro 体验说明
- 无发布义务说明
- 未来合作可能性
- 第一次跟进邮件
- 第二次跟进邮件
- 人工复核备注

要求：

- 一位 KOC 对应一封邮件
- 不使用 CC 或 BCC 群发
- 不编造对方的具体内容
- 不复制其他 KOC 的个性化信息
- 不夸大产品能力
- 不暗示已经确定付费合作
- 第一封邮件尽量不加附件
- 第一封邮件最多保留一个主要链接

### 4. Gmail 草稿工具

Codex 可以制作本地 Python 工具：

- 读取最终 Excel
- 只处理 `Approved = Yes`
- 按指定 Gmail 创建草稿
- 一位 KOC 创建一封独立草稿
- 不使用 CC 或 BCC
- 不包含自动发送功能
- 设置单次最大草稿数量
- 防止同一个 KOC 重复创建
- 记录创建成功或失败
- 将 Gmail Draft ID 写回记录
- 写回草稿创建时间
- 支持模拟运行
- 支持两个 Gmail 的独立授权文件

授权文件示例：

- `credentials.json`
- `token_astrologywiki.json`
- `token_gengrowth.json`

安全要求：

- `credentials.json` 不上传到公开位置
- Token 文件不发送给其他人
- Token 和凭据不提交到 Git
- 不把 Gmail 密码写进脚本
- 第一版不实现自动发送
- 只调用 Gmail 草稿创建功能

### 5. 回复和跟进管理

Codex 可以：

- 判断对方是否感兴趣
- 判断是否询价
- 判断是否拒绝
- 判断是否需要进一步说明
- 起草针对性回复
- 总结合作条件
- 提取下一步行动
- 设置跟进日期
- 生成跟进草稿
- 标记停止联系名单

建议的回复状态：

- `No Reply`
- `Interested`
- `Needs More Information`
- `Requested Payment`
- `Not Interested`
- `Do Not Contact`
- `Invalid Email`
- `Negotiating`
- `Collaboration Confirmed`

## 六、Excel 主表结构

| 字段 | 用途 |
|---|---|
| Handle | KOC 账号 |
| Name | KOC 称呼 |
| Email | 收件邮箱 |
| Email Source | 邮箱来源 |
| Platform | 平台 |
| Profile URL | 主页链接 |
| Followers | 粉丝量 |
| Country | 国家或地区 |
| Category | 占星、塔罗、灵性等 |
| Priority | 高、中、低 |
| Fit Reason | 与 AstrologyWiki 的匹配原因 |
| Recent Content | 近期相关内容 |
| Personalization | 个性化切入点 |
| Subject | 邮件标题 |
| Email Body | 建联信正文 |
| Follow-up 1 | 第一次跟进邮件 |
| Follow-up 2 | 第二次跟进邮件 |
| Review Notes | 人工复核备注 |
| Approved | 是否批准创建草稿 |
| Gmail Account | 使用哪个发件账号 |
| Draft Status | 草稿创建状态 |
| Draft ID | Gmail 草稿 ID |
| Draft Created At | 草稿创建时间 |
| Sent Date | 实际发送日期 |
| Follow-up Date | 下次跟进时间 |
| Reply Status | 回复结果 |
| Reply Summary | 回复摘要 |
| Next Action | 下一步 |
| Do Not Contact | 是否停止联系 |
| Notes | 其他备注 |

我主要维护：

- `Approved`
- `Sent Date`
- `Reply Status`
- `Do Not Contact`
- `Next Action`

`Approved` 状态：

- `Yes`：允许创建 Gmail 草稿
- `No`：暂不处理
- `Review`：需要进一步审核
- `Reject`：不联系

`Draft Status` 状态：

- `Not Created`
- `Created`
- `Failed`
- `Skipped`
- `Duplicate`

## 七、具体实施阶段

### 阶段一：完成 KOC Excel

- [ ] 读取现有 KOC 记录
- [ ] 清理重复联系人
- [ ] 处理邮箱冲突
- [ ] 核验公开主页
- [ ] 判断垂类匹配度
- [ ] 设置优先级
- [ ] 提取个性化切入点
- [ ] 生成邮件标题
- [ ] 生成建联信
- [ ] 生成跟进邮件
- [ ] 输出最终 Excel

### 阶段二：人工审核

第一轮只批准 5 封：`Approved = Yes`。

其他邮件暂时设置：`Approved = No`。

审核重点：

- [ ] 名字
- [ ] 邮箱
- [ ] 个性化第一句
- [ ] 合作条件
- [ ] Pro 权限
- [ ] 邮件签名
- [ ] 官网链接

### 阶段三：配置 Gmail API

- [ ] 创建 Google Cloud 项目
- [ ] 启用 Gmail API
- [ ] 配置 OAuth
- [ ] 下载 `credentials.json`
- [ ] 授权 AstrologyWiki Gmail
- [ ] 保存独立 Token
- [ ] 如有需要，授权第二个 Gmail
- [ ] 确认两个账号不会混用

预计费用：

- Google Cloud 项目：`$0`
- Gmail API 标准使用：`$0`
- Python 脚本：`$0`
- 第三方插件：不需要

### 阶段四：草稿测试

1. 创建一封发给自己的测试草稿
2. 检查主题
3. 检查换行和段落
4. 检查链接
5. 检查签名
6. 检查发件账号
7. 创建 3–5 封真实 KOC 草稿
8. 人工检查并发送
9. 确认没有重复或错配
10. 再导入剩余批准邮件

### 阶段五：日常发送

```text
打开 Gmail 草稿箱
↓
检查当天计划发送的草稿
↓
确认名字、邮箱和个性化首句
↓
手动点击发送
↓
更新 Sent Date
↓
处理真实回复
↓
将结果交给 Codex 更新
```

### 阶段六：跟进与复盘

- 首次发送后约 4–7 天考虑第一次跟进
- 第一次跟进后约 5–7 天考虑第二次跟进
- 第二次跟进后仍未回复，通常停止联系
- 对方明确拒绝后立即标记 `Do Not Contact`
- 不换另一个 Gmail 重复联系

## 八、每日发送原则

推荐：

- 一封邮件只发送给一个 KOC
- 每封邮件包含真实个性化内容
- 由我人工点击发送
- 分散在正常工作时间内发送
- 保留时间处理真实回复
- 出现异常退信或账号警告时暂停

不推荐：

- CC 或 BCC 多个陌生 KOC
- 同时发送多封完全相同的邮件
- 固定机械间隔批量发送
- 新账号突然发送大量陌生开发信
- 两个 Gmail 联系同一个人
- 使用多个追踪链接
- 使用网址缩短器
- 第一封邮件添加大型附件
- 对未回复者连续多次催促
- 对拒绝者更换邮箱重新联系

创建草稿并人工发送可以降低错名和错配风险、保留最终人工审核、避免脚本直接误发，并减少对第三方插件的依赖。

但不能保证：

- 100% 进入主收件箱
- 绝对不会被标记为垃圾邮件
- Gmail 账号绝对不会受到限制
- 所有 KOC 都会回复

## 九、每周复盘指标

记录：

- 总发送数量
- 成功送达数量
- 退信数量
- 回复数量
- 正向回复数量
- 询价数量
- 愿意体验产品的人数
- 已激活 Pro 的人数
- 提供有效反馈的人数
- 潜在未来合作人数
- 停止联系人数

计算：

- 回复率 = 回复人数 ÷ 成功送达人数
- 正向回复率 = 正向回复人数 ÷ 成功送达人数
- 退信率 = 退信数量 ÷ 总发送数量
- 体验转化率 = 同意体验人数 ÷ 正向回复人数
- 反馈完成率 = 提供反馈人数 ÷ 已激活 Pro 人数

分析：

- 哪类 KOC 回复率最高
- 占星与塔罗 KOC 的表现差异
- 哪种标题效果更好
- 哪种个性化切入点更自然
- 哪个国家或地区回复率更高
- 邮件是否过长
- 一个月 Pro 是否有吸引力
- 是否需要调整合作表达

## 十、需要暂停发送的情况

- [ ] Gmail 出现发送限制
- [ ] Gmail 出现异常登录警告
- [ ] 多个邮箱连续退信
- [ ] 名单来源存在问题
- [ ] 个性化内容频繁错配
- [ ] 同一个人被重复联系
- [ ] 收到垃圾邮件投诉
- [ ] 无法及时处理停止联系请求
- [ ] 无法及时处理真实回复
- [ ] 发件账号或品牌身份配置错误

## 十一、最终职责分工

### 我负责

- 提供 KOC 名单
- 确认产品和合作条件
- 完成 Google OAuth 授权
- 审核关键邮件
- 批准是否创建草稿
- 在 Gmail 中手动发送
- 处理商业决定
- 告诉 Codex 回复和合作结果
- 决定是否停止联系

### Codex 负责

- 清洗和整理 Excel
- 去重和检查邮箱
- 研究 KOC 公开内容
- 判断匹配度和优先级
- 生成个性化标题和正文
- 生成跟进邮件
- 创建 Gmail 草稿导入工具
- 将批准邮件写入草稿箱
- 防止重复创建
- 记录草稿状态
- 分类回复
- 起草回复
- 安排跟进
- 更新数据
- 复盘建联效果

## 十二、最终日常操作

系统建立完成后，我每天只需要：

```text
打开 Gmail
↓
检查当天草稿
↓
点击发送
↓
处理回复
↓
把结果交给 Codex
```

Codex 继续完成：

```text
更新状态
↓
生成跟进草稿
↓
分类回复
↓
整理下一步行动
↓
复盘回复率和合作结果
```

## 十三、下一步

- [ ] 等待 Codex 完成 KOC 核验和建联信 Excel
- [ ] 检查最终 Excel
- [ ] 第一轮批准 5 封邮件
- [ ] 创建 Google Cloud 项目
- [ ] 启用 Gmail API
- [ ] 下载 `credentials.json`
- [ ] 让 Codex 创建只写入草稿、不自动发送的 Python 工具
- [ ] 创建一封自测草稿
- [ ] 测试 3–5 封真实 KOC 草稿
- [ ] 确认无误后导入剩余草稿
- [ ] 开始每日人工检查和发送
- [ ] 每周复盘效果
