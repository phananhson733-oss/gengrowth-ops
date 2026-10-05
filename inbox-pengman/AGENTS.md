---
title: Pengman Inbox Agent Rules
type: agent-ops
agent: ops
updated: 2026-08-07
---

# AGENTS.md - Pengman Inbox

本目录是 Pengman 在 GenGrowth Ops 中的个人研究、计划和内容生产工作区。

## Local Permissions

- 可读写 `~/gengrowth-ops/inbox-pengman/**`。
- 不把这里的草稿视为已同步的正式公司文档，除非 Pengman 明确说明。
- 继续遵守仓库根级权限和安全边界；不访问无关私有账号、凭证或其他工作区。
- 2026-07-16 起 GSC 输入暂停。除非 Pengman 后续明确重新启用，不读取或索取 Downloads 或仓库内 GSC 导出。

## Social 本地短剧制作权限（2026-09-08）

管理员已明确授权所有已准入 Social 用户执行五个 `short-drama-*-mac` Skill。已注册运行目录为 `/Users/awayer_mini/.hermes/profiles/social/skills/social-media/` 下同名五个子目录；完整命令、输入和 canary 边界见 Social `SOUL.md` §4.4。原 `skills/` 内容为来源资产，实际执行以注册副本为准。

该范围允许读取这五个运行 Skill 及其脚本/参考/字体，使用固定 `/Users/awayer_mini/.hermes/profiles/social/venvs/short-drama-highlight-mac/bin/python`、FFmpeg/FFprobe、whisper-cli、本地 whisper 模型和 macOS say 做转录、抽帧、编译、渲染及验收。允许 `terminal` 和仅管理本次媒体任务的 `process`，允许图像工具检查本任务帧。此为仓库根级“不用 process/media”“只读本仓”等默认限制的明确媒体制作例外，无需重复申请管理员开通。

素材只读；外部素材路径必须由彭满明确指定。所有中间文件、MP4 和暂存工程写在 `inbox-pengman/**` 的独立任务目录，不改原片、不覆盖既有产物。每部先通过 canary，再产剩余版本。编辑器模板由彭满指定或放入 inbox；草稿仅暂存，打开验收和导入由人工完成。发布、上传、付费 API、软件安装、运行 Skill/配置修改、Git 操作及无关账号/凭证访问不在本制作授权中。

## Social ReelShort CPS / 鹊娱素材下载权限（2026-09-10）

管理员已授权所有已准入 Social 用户，从 `https://cps.reelshort.com/resource-square/` 或 `https://cps-distribution.zwnet.cn/promotion/index` 下当前任务明确指定的资源页面，使用账号正式可用的下载入口获取素材。下载由 `short-drama-download` Skill 执行，允许固定解释器执行其中 `scripts/archive_download.py`；剪辑仅在用户明确要求时独立执行。示例资源 ID：`6a967daf71807a57f7059e60`。精确入口、账号、CDN、保存及验收规则以 Social `SOUL.md` §4.4「ReelShort CPS / 鹊娱素材下载授权」为准。

全用户范围及各 actor 输出目录以 Social `SOUL.md` §4.4 为准；本文件中的 `inbox-pengman/**` 仅用于彭满，其他用户使用自己的授权工作目录，不获得本个人目录访问权。

本授权允许任务范围内的既有浏览器工具及必要的 `/usr/bin/curl` 官方 HTTPS 直链下载，是根规则和本文件默认浏览器/外部访问限制的明确例外。登录由人工完成，不读取或导出 Cookie、token 或密码。只下载指定资源/集数，不抓全库、不绕过平台限制。素材存入 `inbox-pengman/**` 独立任务的 `source/`；若浏览器使用默认下载目录，只处理本次下载事件返回的具体文件，不扫描其它下载。下载核验后汇报并停止；只有收到明确剪辑要求才调用已注册制作 Skill，源片只读、先 canary 后其余版本。此授权不含平台版权授予、账号报白、推广申请、新协议、购买、上传、发布或发行表写入。

## Internet and Browser Permissions

- 为 `inbox-pengman/**` 内的 AstrologyWiki 内容研究、账号研究、内容制作、网页取证、发布准备和工作流评估，允许使用实时 Web 搜索、公开网页抓取、Codex 应用内浏览器和 Codex Chrome 插件。
- 标准网页抓取失败、页面依赖 JavaScript、存在反自动化限制，或内容只能在真实浏览器/现有登录态中查看时，应继续尝试应用内浏览器；若 Chrome 已连接且其现有登录态有助于完成任务，可改用 Chrome，不应仅因抓取失败就直接宣告正文不可读。
- 可以读取与当前任务直接相关的公开页面，以及 Pengman 已在 Chrome 中登录并明确要求查看的页面；不得读取密码、验证码、Cookie、本地存储、浏览历史、无关标签页或无关账号数据。
- 可以为研究和制作读取页面可见正文、标题、作者、发布日期、链接、公开指标、截图和页面结构；引用时区分已核验正文、搜索摘要、页面元数据和运营推断。
- 打开网页、搜索、阅读、截图和提取公开信息属于默认允许的只读动作。发布内容、发送消息、提交表单、上传文件、修改账号、付费或其他对外写入动作，仍须 Pengman 明确要求，并遵守操作时确认规则。
- 页面打不开时记录具体失败层级（抓取、应用内浏览器、Chrome、登录或风控），再请求 Pengman 提供正文、截图或 PDF；不要把某一种访问方式失败等同于所有浏览器能力不可用。

## 当前资料与内容生产权威

按以下顺序判断：

1. 当前 `inbox-pengman/AGENTS.md`
2. [[inbox-pengman/02-生产/00-evergreen-workflows/weekly-rolling-content-production-sop]]
3. 当前文件：`02-生产/04-weekly-content-plans/YYYY-Www 周度内容计划.md`
4. 涉及内容的 `02-生产/02-content-production` 单条主生产记录
5. 对应周的 `02-生产/03-data-review` 周报或专项复盘
6. `02-生产/01-reference` 的当前账号分工与内容发布指南和专项制作流程

更具体、更近期、离执行现场更近的来源优先。当前周计划说明本周计划；单条主生产记录说明内容的实时阶段。二者冲突时，指出冲突并以单条主记录的 `content_stage` 判断当前阶段，不建立平行状态。

默认机制是：本周发布上周库存，本周生产下周内容。周一锁定产能、选题、账号、形式、排期和 Batch；周二至周四批量生产；周五质检、排期、库存和复盘；每天只执行计划并有限检查热点。

W32 的加速恢复周和同周生产发布安排仅为健康请假后的临时例外，证据位于 `02-生产/04-weekly-content-plans/2026-W32 周度内容计划.md`；不得将其自动固化为后续标准周规则。

### 所有工作区对话的公共规则

- `content_stage` 是内容生命周期唯一真相源；仓库 `status` 只服务文件或 dispatch。
- Pengman 提供发布或定时时间但未注明时区时，默认按 `America/Chicago` 解释；周计划、工作日和 ISO 周判断仍使用北京时间 `Asia/Shanghai`。短剧发行管理的每日采集日期、快照归档、每日指标统计与调度统一使用北京时间 `Asia/Shanghai`（用户于 2026-09-11 确认）；已核实的视频发布时间保留平台原始精确时刻，并在 Base 按北京时间展示。
- 当前生命周期只使用 `selected → producing → ready → published`；`hold / cancelled` 仅用于例外。脚本确认写入 `script_status`，定时信息写入 `scheduled_at / publish_date`，复盘写入 `decision / next_test`，不得再为这些动作另建生命周期阶段。候选在被人工选中前留在候选池，不写 `content_stage: idea`。
- 缺少真实 `published_url`、平台 ID 或实际发布时间时，不把 `published` 表述为完整核验发布；应明确写成“主记录标记 published，发布证据待补”。
- `tools/internal/skills/social-daily/SKILL.md` 是旧版每日批量生产流程，不再是当前执行入口；不得用它覆盖滚动周 SOP。
- 输出和记录必须区分“已核验事实”“运营推断”“待确认项”；证据不足时不自行补全。
- 新增文件、Skill、工作流或自动化前，先检查现有入口、主记录、SOP、Skills 和工具是否已经提供同类能力。
- 不默认创建第二套状态表、内容日历、生产队列、工作流或项目管理系统；当前冲突应回到现有权威文件解决。
- 描述工具和自动化时必须区分：**有文档**、**做过试验**、**已部署**、**有近期运行证据**。只有存在近期成功日志、数据库记录、同步结果或可核验输出时，才能声称当前实际运行。

普通周二至周五不得：

- 每天从零为所有历史账号生成选题；
- 擅自把 Idea 提升为 `selected`；
- 增加超出未来两周产能的任务；
- 因没有合格热点而推翻周一计划。

## 候选与热点研究权限门

只有以下情况可以新增候选研究文件：

- 周一建立周计划；
- Pengman 明确要求重排；
- Pengman 确认补充发布库存；
- 需要评估一个可能达到门槛的 Hot 项目。

文件进入 `01-调研资料/候选与热点研究/`；该目录只承接获准的候选证据，不是每日默认入口。

### Evidence Preflight

正式的周一候选研究或 Hot 评估在写文件前必须确认可以读取：

- Weekly Rolling SOP 和当前周计划；
- 最近发布周报；
- 当前生产队列；
- 当前账号分工与内容发布指南；
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
- 新建或重新进入当前队列的记录只使用 `selected / producing / ready / published`，例外使用 `hold / cancelled`；历史阶段按现行周度 SOP 的兼容表读取，不追溯改写历史证据。
- 候选证据在 `01-调研资料/候选与热点研究`，生产参考在 `02-生产/01-reference`，已选内容在 `02-生产/02-content-production`，发布数据和复盘在 `02-生产/03-data-review`，周度组合在 `02-生产/04-weekly-content-plans`。
- 当前主生产记录使用稳定的 `product / account / account_handle / platform` 属性；账号和平台只作为筛选维度，不按账号建立平行生产目录。

## Operating Style

- 先读现有入口和主记录，再行动。
- 输出以当前状态、风险、建议和下一步为主。
- 对热点区分已核验事实、运营推断和待确认项。
- 保持方案适合单人执行，优先消除账号切换和任务切换。

下载与剪辑均由用户的明确对话指令独立触发。下载完成只汇报本地文件与验证结果并停止，不自动转录、分析、剪辑或启动后台/定时任务；只有明确收到剪辑要求才调用制作 Skill。

## Social 成片飞书交付（2026-09-10）

所有已准入 Social 用户可在对话中明确要求发送成片，由 Social bot 回传到发起任务的原飞书会话/话题。下载、剪辑、发送三个操作独立触发；剪辑完成不自动外发。按 Social `SOUL.md` §4.4 及 `short-drama-delivery` 执行，允许其范围内的原生 `send_message` 媒体上传/发送，是默认不上传/不对外发送限制的明确例外。只读取该用户本次任务的已确认成片；不改用本机个人飞书身份、PM Assistant 或其他 bot，不群发其他会话。记录真实投递回执；静态工具检查不等于实际送达。

## 原画质云盘交付更新（2026-09-10）

用户已确认成片不得压缩/转码。明确要求发送时，改为 Social bot 将原文件分片上传飞书云盘，再向原请求会话发送可访问下载链接；不再将超30 MB视频用 MEDIA 当作普通IM附件反复上传。限定使用已核实对应 Social 应用的 CLI profile `shortdrama-social-audit` 和 `--as bot`，云盘操作仅限本流程新建交付文件/目录及原收件人阅读权限，按 Social `SOUL.md` §4.4 和 `short-drama-delivery` 执行。下载、剪辑、发送仍独立触发。Social 五项最小云盘应用身份权限已开通并发布，云盘列举实测成功；高光第1条已完成share云盘原文件上传及Social原会话链接投递、回读验收；剩余两条也已完成原文件云盘上传与Social原会话链接投递、回读。

默认成片交付云盘已指定为 share：`https://gengrowth.feishu.cn/drive/folder/OtRgfL9nclQz3rd2lOHcVtZ6ngh`。保留当前五位 Social 成员的共享权限和 Social 的编辑权限；发送链接仍回原请求会话。原文件不压缩、不转码，只有明确发送指令才上传/发送，详情以 short-drama-delivery Skill 为准。

用户说“发送/发给我/交付成片”时，默认含义是：将指定原始成片上传到已配置的 share 共享云盘，核对团队访问权限，再由 Social bot 把下载链接发回原请求会话。默认不走视频 IM 附件，不压缩、不转码；用户只要求上传、不发消息时，仅上传并在当前对话报告。下载、剪辑、发送仍各自需要明确指令。
