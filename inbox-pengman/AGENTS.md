---
title: Pengman Inbox Agent Rules
type: agent-ops
agent: ops
updated: 2026-07-21
---

# AGENTS.md - Pengman Inbox

本目录是 Pengman 在 GenGrowth Ops 中的个人研究、计划和内容生产工作区。

## Local Permissions

- 可读写 `~/gengrowth-ops/inbox-pengman/**`。
- 不把这里的草稿视为已同步的正式公司文档，除非 Pengman 明确说明。
- 继续遵守仓库根级权限和安全边界；不访问无关私有账号、凭证或其他工作区。
- 2026-07-16 起 GSC 输入暂停。除非 Pengman 后续明确重新启用，不读取或索取 Downloads 或仓库内 GSC 导出。

## Internet and Browser Permissions

- 为 `inbox-pengman/**` 内的 AstrologyWiki 内容研究、账号研究、内容制作、网页取证、发布准备和工作流评估，允许使用实时 Web 搜索、公开网页抓取、Codex 应用内浏览器和 Codex Chrome 插件。
- 标准网页抓取失败、页面依赖 JavaScript、存在反自动化限制，或内容只能在真实浏览器/现有登录态中查看时，应继续尝试应用内浏览器；若 Chrome 已连接且其现有登录态有助于完成任务，可改用 Chrome，不应仅因抓取失败就直接宣告正文不可读。
- 可以读取与当前任务直接相关的公开页面，以及 Pengman 已在 Chrome 中登录并明确要求查看的页面；不得读取密码、验证码、Cookie、本地存储、浏览历史、无关标签页或无关账号数据。
- 可以为研究和制作读取页面可见正文、标题、作者、发布日期、链接、公开指标、截图和页面结构；引用时区分已核验正文、搜索摘要、页面元数据和运营推断。
- 打开网页、搜索、阅读、截图和提取公开信息属于默认允许的只读动作。发布内容、发送消息、提交表单、上传文件、修改账号、付费或其他对外写入动作，仍须 Pengman 明确要求，并遵守操作时确认规则。
- 页面打不开时记录具体失败层级（抓取、应用内浏览器、Chrome、登录或风控），再请求 Pengman 提供正文、截图或 PDF；不要把某一种访问方式失败等同于所有浏览器能力不可用。

## 当前内容生产权威

按以下顺序判断：

1. [[inbox-pengman/04-production/00-evergreen-workflows/weekly-rolling-content-production-sop]]
2. 当前文件：`04-production/04-weekly-content-plans/YYYY-Www 周度内容计划.md`
3. 涉及内容的 `07-content-production` 单条主生产记录
4. 对应周的 `05-weekly-published-content-digests`
5. 四账号 Playbook 和专项制作 SOP

默认机制是：本周发布上周库存，本周生产下周内容。周一锁定产能、选题、账号、形式、排期和 Batch；周二至周四批量生产；周五质检、排期、库存和复盘；每天只执行计划并有限检查热点。

普通周二至周五不得：

- 每天从零生成四账号选题；
- 擅自把 Idea 提升为 `selected`；
- 增加超出未来两周产能的任务；
- 因没有合格热点而推翻周一计划。

## 候选与热点研究权限门

只有以下情况可以新增候选研究文件：

- 周一建立周计划；
- Pengman 明确要求重排；
- Pengman 确认补充发布库存；
- 需要评估一个可能达到门槛的 Hot 项目。

文件进入 `04-production/06-daily-content-recommendations/`，但该目录名仅为兼容旧链接；不再作为每日默认入口。

### Evidence Preflight

正式的周一候选研究或 Hot 评估在写文件前必须确认可以读取：

- Weekly Rolling SOP 和当前周计划；
- 最近发布周报；
- 当前生产队列；
- 四账号 Playbook；
- 与本次候选相关的竞品/来源文件；
- Hot 或时效候选所需的当前公开来源；
- 固定参考账号 CSV：`https://script.google.com/macros/s/AKfycbyunRIRkIyxEFRUIPstyKFPebAE2rBZB8CBFmoTWzJkhBl-ugAsakxHwZipbT4hTOgANg/exec`；
- Apps Script Library 入口：`https://script.google.com/macros/library/d/1XrKVy_7L_IJl_1Zc-9puY03e8RbvwDi7CQMEAL1uzaafW9Cfa32lRshg/3`。

生成任何新候选（包括 Evergreen、Predictable、Hot、补库和替换）前必须完成实时互联网调研。固定 CSV 必须成功读取并记录 `checked_at`；还需查看至少 2 个与目标账号/候选直接相关的当前公开来源。CSV 只是参考账号索引，不能替代查看账号或话题的当前内容。Library 入口每次都要尝试；若跳转登录页，必须记录 `login_required` 和“未读取内部内容”，不得声称已参考其内部信息。新增两个入口不替代原有本地参考项。

固定 CSV 不可读时，不生成正式候选。Library 仅需登录时，只要固定 CSV 和其他实时来源均成功，可以继续并披露限制。

如果本次输出包含 Hot/Route B 候选，正式文件至少记录：

- 3 个相关本地路径；
- 4 个当前公开来源；
- 至少 2 个不同候选对应的 3 个直接来源链接；
- 无法访问的输入。

纯 Evergreen/Predictable 周一补库不强制做 Hot 的 4 来源配额，但仍须成功读取固定 CSV 并核验至少 2 个相关当前公开来源；所有事实、日期、人物和天象仍需核验。执行已经 `selected` 的内容不重复 Evidence Preflight。

输入不足时，不写猜测版文件；在对话中说明缺什么、为什么重要、Pengman 能提供什么，以及是否可以给聊天版 provisional 建议。

## Write Rules

- Pengman 的研究、工作计划、主生产记录和个人 SOP 可直接写入 `inbox-pengman/**`。
- 不修改与当前请求无关的内容。
- 历史日级候选、旧流程、旧脚本和已发布数据保留原始证据；只加历史声明或修正当前引用，不追溯性改写成新流程。
- 当前规则冲突时，合并到一个权威文件；不要通过不断增加“覆盖条款”维持两套同时生效的规则。
- `content_stage` 是内容生命周期唯一真相源；仓库 `status` 只服务文件/dispatch。
- 候选证据在 `06`，已选内容在 `07`，周度组合在 `04-weekly-content-plans`，发布数据和复盘在 `05-weekly-published-content-digests`。

## Operating Style

- 先读现有入口和主记录，再行动。
- 输出以当前状态、风险、建议和下一步为主。
- 对热点区分已核验事实、运营推断和待确认项。
- 保持方案适合单人执行，优先消除账号切换和任务切换。
