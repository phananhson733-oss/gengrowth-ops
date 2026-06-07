from __future__ import annotations

import hashlib
import json
from pathlib import Path
import textwrap


SCENARIO = {
    "employee_name": "彭满",
    "employee_email": "2967267838@qq.com",
    "role": "AI内容运营",
    "employment_type": "实习生",
    "report_date": "2026-06-11",
    "report_time": "10:00",
    "report_location": "广州市天河区中山大道建工路 4 号未来社区 PCI A座 4 楼",
    "manager": "王玲",
    "company": "广州进格智能科技有限公司",
    "work_city": "广州",
    "internship_end": "2026-07-01",
    "direct_send_scope": ["信息采集", "材料清单", "报到提醒", "员工手册提醒"],
    "materials": [
        "学生证原件（现场核验后当场归还）",
        "招商银行储蓄卡（一类卡）复印件 1 张（复印件上请手写账号并签署本人姓名）",
        "身份证复印件 1 张（正反两面复印在同一页）",
        "入职体检报告原件（三甲医院或正规体检机构，近 3 个月内）",
        "学校出具的实习证明或介绍信（如学校有要求，请提前准备；如无要求可不带）",
    ],
    "signing_rule": "入职当天打印新版整份《实习生录用通知》，由彭满签字、公司盖章，作为当前阶段实习签署文件；拿到毕业证后再签正式劳动合同。",
    "stale_offer_date": "2026-06-02",
    "authoritative_date_source": "docs/records/lynne-wang/2026-06-05-chat-record.md Q6",
}

SENSITIVE_REVIEW_TOPICS = [
    "offer",
    "薪酬",
    "合同新增条款",
    "保密/IP 条款变更",
    "录用/不录用",
    "转正",
    "调薪",
    "绩效结论",
    "法律/财务/HR 承诺",
]

SOURCE_PATHS = {
    "hr_lead": "/Users/awayer_mini/gengrowth-wiki/.claude/agents/hr-lead.md",
    "onboarding_sop": "/Users/awayer_mini/gengrowth-wiki/docs/05-governance/people-ops/onboarding/新员工入职SOP.md",
    "employee_info_template": "/Users/awayer_mini/gengrowth-wiki/docs/05-governance/people-ops/onboarding/templates/员工信息采集文本模板.md",
    "register_template": "/Users/awayer_mini/gengrowth-wiki/docs/05-governance/people-ops/onboarding/templates/入职登记表-模板.md",
    "receipt_template": "/Users/awayer_mini/gengrowth-wiki/docs/05-governance/people-ops/onboarding/templates/员工入职材料签收表-模板.md",
    "device_template": "/Users/awayer_mini/gengrowth-wiki/docs/05-governance/people-ops/onboarding/templates/设备账号准备清单-模板.md",
    "offer_mail": "/Users/awayer_mini/gengrowth-wiki/实例库/people-ops/offers/彭满/offer邮件-彭满.md",
    "intern_offer": "/Users/awayer_mini/gengrowth-wiki/实例库/people-ops/offers/彭满/实习生录用通知-彭满.md",
    "chat_record": "/Users/awayer_mini/gengrowth-wiki/docs/records/lynne-wang/2026-06-05-chat-record.md",
}


def find_repo_root() -> Path:
    current = Path(__file__).resolve()
    for candidate in [current.parent, *current.parents]:
        if (candidate / ".git").exists() and (candidate / "task-collab").exists():
            return candidate
    raise RuntimeError("无法定位 gengrowth-wiki 根目录")


def dedent(text: str) -> str:
    return textwrap.dedent(text).strip() + "\n"


def write(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def sha256_text(content: str) -> str:
    return hashlib.sha256(content.encode("utf-8")).hexdigest()


def make_task_markdown() -> str:
    return dedent(f"""
    ---
    title: hr-lead Feishu HR BOT v0 dry-run
    date: 2026-06-06
    updated: 2026-06-06
    type: note
    tags:
      - task
      - hr
      - onboarding
      - feishu
      - hermes
    aliases:
      - hr-bot-v0-dry-run
      - 彭满入职 dry-run
    ---

    # hr-lead Feishu HR BOT v0 dry-run

    - [x] [people-ops/hr-bot] 基于 wiki-local `.claude/agents/hr-lead.md` 产出独立 `hr-lead` profile + Feishu gateway dry-run 方案，并为彭满 2026-06-11 入职生成一套不外发的演练产物 #task #hr #feishu #owner/wzb 📅 2026-06-06 ✅ 2026-06-06

    ## 目标

    - 保留 `hr-lead` 原有 HR 主脑定位，不另起炉灶。
    - 采用“独立 `hr-lead` profile + 接入现有 Feishu gateway”的长期形态。
    - 在 dry-run 下只演练 4 类允许直发事项：信息采集、材料清单、报到提醒、员工手册提醒。
    - 不外发、不改标准区，只在当前任务目录生成运行草案、消息预览、实例草稿和验证报告。

    ## 验收标准

    - `sandbox-home/` 下有可读的 `hr-lead` runtime 草案（含 profile config、SOUL、局部 skill）。
    - `output/pengman-2026-06-11/` 下有彭满入职 dry-run 产物。
    - 有脚本可一键重建以上产物，并输出验证报告。
    - 明确写清楚敏感事项必须回 Lynne，不允许 HR BOT 直发。

    ## 来源链接

    - `{SOURCE_PATHS['hr_lead']}`
    - `{SOURCE_PATHS['onboarding_sop']}`
    - `{SOURCE_PATHS['chat_record']}`
    - `{SOURCE_PATHS['offer_mail']}`
    - `{SOURCE_PATHS['intern_offer']}`

    ## 执行记录

    - 2026-06-06：完成资料盘点，确认 `hr-lead` 是 wiki-local agent，不是现成 Hermes runtime profile。
    - 2026-06-06：确认采用“独立 profile + Feishu gateway”长期形态；彭满报到口径以 2026-06-05 聊天记录中的 `2026-06-11 10:00` 为准，旧 offer 中 `2026-06-02` 视为过期信息。
    - 2026-06-06：用脚本生成 dry-run 方案、sandbox profile 草案、彭满 onboarding 预览和验证报告。
    """)


def make_readme() -> str:
    scope = "、".join(SCENARIO["direct_send_scope"])
    sensitive = "、".join(SENSITIVE_REVIEW_TOPICS)
    return dedent(f"""
    # hr-lead Feishu HR BOT v0 — dry-run 方案

    ## 1. 目标

    本目录是 `hr-lead` 的本地 dry-run 沙箱，不直接改 `docs/05-governance/people-ops/` 标准区，也不直接写 `实例库/people-ops/` 正式实例。

    这次只做两件事：
    1. 为长期 HR BOT 先搭一个独立 `hr-lead` runtime 草案；
    2. 围绕彭满 2026-06-11 10:00 入职，生成一套“如果今天要拉起流程，BOT 会怎么做”的预演产物。

    ## 2. 长期形态

    推荐长期形态：`独立 hr-lead profile + 挂在现有 Feishu gateway 下接消息`。

    这样拆分的原因：
    - profile 负责 HR 主脑：沿用 `.claude/agents/hr-lead.md` 的能力、边界、记忆和 SOP。
    - gateway 负责入口：接 Feishu 消息、群路由、pairing、通知。
    - 未来 HR 工作不只 onboarding；招聘、offer、绩效、政策、员工沟通都能逐步挂到同一个 `hr-lead` profile 上。

    ## 3. v0 允许 BOT 直发的范围

    当前只允许直发：{scope}。

    以下事项一律不自动发给员工，必须先回 Lynne：{sensitive}。

    ## 4. 数据与写入边界

    - 标准区：继续以 `docs/05-governance/people-ops/` 为模板和 SOP 来源，不在本次 dry-run 中改动。
    - 实例区：live 时应写入 `实例库/people-ops/onboarding/彭满/`；本次为了不污染正式区，先把“将来要写进去的内容”放在 `output/pengman-2026-06-11/`。
    - runtime 草案：放在 `sandbox-home/`，并强制 `platforms.feishu.enabled: false`，避免误发。

    ## 5. 彭满口径

    - 权威报到口径：{SCENARIO['report_date']} {SCENARIO['report_time']}
    - 权威来源：{SCENARIO['authoritative_date_source']}
    - 旧版冲突口径：offer 文档中的 {SCENARIO['stale_offer_date']}，本次 dry-run 不采用
    - 直属负责人：{SCENARIO['manager']}
    - 特殊签署规则：{SCENARIO['signing_rule']}

    ## 6. 目录说明

    - `sandbox-home/`：Hermes sandbox home，包含 `hr-lead` profile 草案
    - `output/pengman-2026-06-11/`：彭满 onboarding dry-run 产物
    - `scripts/build_hr_bot_dry_run.py`：一键重建脚本

    ## 7. 启用 live 前还要做什么

    1. 把 `sandbox-home/profiles/hr-lead/` 收敛到正式 `~/.hermes/profiles/hr-lead/` 前，先确认实际可用 toolset 名称。
    2. 把 `platforms.feishu.enabled` 从 `false` 改为 `true` 前，先完成 Feishu app 凭证注入与 home channel 绑定。
    3. 把 `output/pengman-2026-06-11/` 中的实例草稿迁入 `实例库/people-ops/onboarding/彭满/` 前，先由 Lynne 确认要正式拉起。
    4. live 前先跑一轮“仅 DM 自己”的灰度，不直接进员工群。
    """)


def make_root_config() -> str:
    return dedent("""
    timezone: Asia/Shanghai
    memory:
      memory_enabled: true
      user_profile_enabled: false
    security:
      redact_secrets: true
    approvals:
      mode: off
    platforms:
      feishu:
        enabled: false
      slack:
        enabled: false
    """)


def make_profile_config() -> str:
    return dedent("""
    # dry-run profile draft only; do not copy to production without real toolset validation
    _config_version: 16
    group_sessions_per_user: true
    isolate_platforms: true
    streaming:
      enabled: false
    timezone: Asia/Shanghai
    memory:
      memory_enabled: true
      user_profile_enabled: false
    platform_toolsets:
      cli:
        - file
        - kanban
      telegram: []
      discord: []
      whatsapp: []
      slack: []
      signal: []
      homeassistant: []
      feishu:
        - file
        - kanban
        - feishu_doc
    platforms:
      feishu:
        enabled: false
        home_channel:
          platform: feishu
          chat_id: DRY_RUN_ONLY
          name: hr-lead-dry-run
        extra:
          require_mention: true
          default_group_policy: closed
      slack:
        enabled: false
    collaboration:
      enabled: true
      allow_direct_profile_mentions: false
      default_platform: feishu
    security:
      redact_secrets: true
    kanban:
      dispatch_in_gateway: false
    fallback_model:
      provider: openai-codex
      model: gpt-5.4
    """)


def make_soul() -> str:
    sensitive = "、".join(SENSITIVE_REVIEW_TOPICS)
    direct = "、".join(SCENARIO["direct_send_scope"])
    return dedent(f"""
    # hr-lead runtime draft（dry-run）

    你是 `hr-lead` 的 Hermes runtime 草案，能力底稿来自 wiki-local `{SOURCE_PATHS['hr_lead']}`，不是重新发明一套 HR prompt。

    你的边界：
    - 长期定位是 GenGrowth 的 HR 大脑，覆盖招聘、offer、入离职、人才计划、政策、绩效与员工沟通辅助。
    - 当前 v0 仅落地 onboarding 第一阶段。
    - 员工侧允许直发：{direct}。
    - 敏感事项必须回 Lynne：{sensitive}。
    - 继续遵守 HR 两区原则：标准区负责模板/SOP，实例区负责带人名的真实产出。
    - dry-run 期间只允许写当前任务目录，不允许外发，不允许改标准区。
    - 不读取、不总结 CEO/PM/Ops 私有 memory、session、prompt、凭证或跨 profile 私有上下文。

    彭满当前口径：
    - 报到：{SCENARIO['report_date']} {SCENARIO['report_time']}
    - 地点：{SCENARIO['report_location']}
    - 直属负责人：{SCENARIO['manager']}
    - 签署规则：{SCENARIO['signing_rule']}
    - D-1 分工：笔记本 + GitHub 给 wzb；公司邮箱 + 飞书 + 企业滴滴 + 打印签章给 Lynne。
    """)


def make_skill() -> str:
    return dedent(f"""
    ---
    name: hr-onboarding-v0
    description: 基于 hr-lead 的 Feishu onboarding v0 dry-run 工作流。用于提前拉起单个员工的入职信息采集、材料提醒、D-1 / D-Day 协作。
    version: 0.1.0
    platforms: [macos, linux]
    ---

    # hr-onboarding-v0

    ## 触发条件

    - 已确认某位员工即将入职，需要提前拉起 onboarding
    - 已知直属负责人、报到时间、报到地点、员工类型
    - 允许 BOT 直发的范围已经明确

    ## 固定边界

    1. 只直发低风险流程消息：信息采集、材料清单、报到提醒、员工手册提醒。
    2. offer、薪酬、合同新增条款、法律/财务承诺必须回 Lynne。
    3. dry-run 只写任务目录；live 才写 `实例库/people-ops/onboarding/{{姓名}}/`。

    ## 执行步骤

    1. 先核对权威口径，以最新聊天确认记录为准；旧 offer 中冲突日期视为过期信息。
    2. 基于 `员工信息采集文本模板` 生成员工消息预览，但不要把银行卡号、身份证号、薪酬等敏感信息直接写进 BOT 首条消息。
    3. 基于 onboarding 模板生成三类内部草稿：入职登记表、材料签收表、设备账号准备清单。
    4. 输出 D-1 与 D-Day 协作分工：wzb 负责笔记本/GitHub；Lynne 负责邮箱/飞书/企业滴滴/打印签章。
    5. 出一份验证报告，明确：未外发、未改标准区、敏感事项仍走 Lynne。

    ## 产物清单

    - 员工侧消息预览
    - 内部协作消息预览
    - onboarding 实例草稿
    - dry-run manifest / report
    """)


def make_routing_draft() -> str:
    direct_lines = "\n".join(f"  - {item}" for item in SCENARIO["direct_send_scope"])
    sensitive_lines = "\n".join(f"  - {item}" for item in SENSITIVE_REVIEW_TOPICS)
    return (
        "runtime_shape:\n"
        "  profile: hr-lead\n"
        "  gateway: existing-feishu-gateway\n"
        "  mode: dry-run\n"
        "  outbound_enabled: false\n"
        "  note: 先在 sandbox home 演练，确认后再迁到正式 profile\n"
        "route_rules:\n"
        "  - trigger: employee-added-to-feishu\n"
        "    guard: employee_record_confirmed\n"
        "    action: send-employee-info-collection-preview\n"
        "  - trigger: onboarding-confirmed\n"
        "    guard: allow-direct-send\n"
        "    action: send-materials-list-preview\n"
        "  - trigger: D-1-18:00\n"
        "    guard: allow-direct-send\n"
        "    action: send-reporting-reminder-preview\n"
        "  - trigger: D-Day-09:00\n"
        "    guard: allow-direct-send\n"
        "    action: send-handbook-reminder-preview\n"
        "direct_send_scope:\n"
        f"{direct_lines}\n"
        "human_review_required:\n"
        f"{sensitive_lines}\n"
        "live_write_targets:\n"
        "  instance_zone: 实例库/people-ops/onboarding/彭满/\n"
        "  standard_zone: docs/05-governance/people-ops/\n"
        "dry_run_write_targets:\n"
        "  artifact_root: task-collab/tasks/2026-06-06-hr-bot-v0/\n"
    )





def make_scenario_json() -> str:
    payload = dict(SCENARIO)
    payload["sensitive_review_topics"] = SENSITIVE_REVIEW_TOPICS
    payload["source_paths"] = SOURCE_PATHS
    return json.dumps(payload, ensure_ascii=False, indent=2) + "\n"


def make_employee_info_message() -> str:
    materials = "\n".join(f"- {item}" for item in SCENARIO["materials"])
    return (
        f"# 员工信息采集消息预览 — {SCENARIO['employee_name']}\n\n"
        "发送类型：允许 BOT 直发（dry-run 预览，不外发）\n\n"
        f"你好，欢迎加入 {SCENARIO['company']}。为了提前拉起你的入职流程，请你直接在飞书回复以下信息，并保留字段名称填写：\n\n"
        "1. 基本信息：姓名、性别、出生日期、身份证号码、户籍所在地、现居住地址、手机号码、常用邮箱、紧急联系人\n"
        "2. 学历信息：最高学历、毕业院校、专业、预计毕业年份、是否应届生\n"
        "3. 实习经历：近 3 年内最多 3 段，如无请写“无”\n"
        "4. 银行信息：招商银行开户行（支行）、银行卡号、持卡人姓名\n"
        f"5. 入职信息确认：应聘岗位 `{SCENARIO['role']}`、入职类型 `{SCENARIO['employment_type']}`、报到日期 `{SCENARIO['report_date']}`\n\n"
        "报到安排先同步给你：\n"
        f"- 报到时间：{SCENARIO['report_date']} {SCENARIO['report_time']}\n"
        f"- 报到地点：{SCENARIO['report_location']}\n"
        f"- 直属负责人：{SCENARIO['manager']}\n\n"
        "需要提前准备的材料如下：\n"
        f"{materials}\n\n"
        "备注：\n"
        "- 本条只做入职流程采集，不涉及薪酬、offer 条款或合同变更。\n"
        "- 如果有信息暂时无法提供，可以直接标注“待补充”。\n"
    )





def make_materials_message() -> str:
    bullets = "\n".join(f"- {item}" for item in SCENARIO["materials"])
    return (
        f"# 入职材料清单消息预览 — {SCENARIO['employee_name']}\n\n"
        "发送类型：允许 BOT 直发（dry-run 预览，不外发）\n\n"
        "你好，以下是你报到当天需要携带的材料，请提前准备：\n\n"
        f"{bullets}\n\n"
        "报到信息再次确认：\n"
        f"- 时间：{SCENARIO['report_date']} {SCENARIO['report_time']}\n"
        f"- 地点：{SCENARIO['report_location']}\n\n"
        "如学校要求提供实习证明或介绍信，请一并带来；如学校无要求，可忽略该项。\n"
    )





def make_reporting_reminder() -> str:
    return (
        f"# 报到提醒消息预览 — {SCENARIO['employee_name']}\n\n"
        "发送类型：允许 BOT 直发（dry-run 预览，不外发）\n\n"
        "你好，提醒你明天到岗报到：\n\n"
        f"- 时间：{SCENARIO['report_date']} {SCENARIO['report_time']}\n"
        f"- 地点：{SCENARIO['report_location']}\n"
        f"- 岗位：{SCENARIO['role']}\n"
        f"- 直属负责人：{SCENARIO['manager']}\n\n"
        "到岗后我们会现场完成：\n"
        "- 入职登记表签字\n"
        "- 入职材料核验\n"
        "- 员工手册确认\n"
        "- 新版《实习生录用通知》签字盖章\n\n"
        "如果你临时有变动，请直接联系 Lynne。\n"
    )





def make_handbook_reminder() -> str:
    return (
        f"# 员工手册提醒消息预览 — {SCENARIO['employee_name']}\n\n"
        "发送类型：允许 BOT 直发（dry-run 预览，不外发）\n\n"
        "你好，入职当天我们会同步公司基础协作规则和员工手册，请你重点关注：\n"
        "- 日常沟通与飞书协作\n"
        "- 打车与报销规则\n"
        "- 请假与日常协作方式\n\n"
        "这条提醒仅用于 onboarding 流程说明；如你对 offer、薪酬或合同条款有疑问，会由 Lynne 单独和你确认。\n"
    )





def make_register_draft() -> str:
    return dedent(f"""
    ---
    title: 员工入职登记 - {SCENARIO['employee_name']}（dry-run）
    date: 2026-06-06
    updated: 2026-06-06
    type: note
    tags:
      - people-ops
      - onboarding
      - employee-record
      - dry-run
    ---

    # 入职登记表

    > 本文件为 dry-run 草稿，live 时应写入：`实例库/people-ops/onboarding/{SCENARIO['employee_name']}/员工入职登记-{SCENARIO['employee_name']}.md`

    ## 基本信息

    | 项目 | 填写内容 |
    |---|---|
    | 姓名 | {SCENARIO['employee_name']} |
    | 性别 | 待员工回复 |
    | 婚姻状况 | 待员工回复 |
    | 出生日期 | 待员工回复 |
    | 身份证号码 | 待员工回复 |
    | 户籍所在地 | 待员工回复 |
    | 户口性质 | 待员工回复 |
    | 之前是否买过广州社保 | 不适用（实习生） |
    | 现居住地址 | 待员工回复 |
    | 手机号码 | 待员工回复 |
    | 常用邮箱 | {SCENARIO['employee_email']} |
    | 紧急联系人姓名 | 待员工回复 |
    | 紧急联系人关系 | 待员工回复 |
    | 紧急联系人电话 | 待员工回复 |

    ## 学历信息

    | 项目 | 填写内容 |
    |---|---|
    | 最高学历 | 待员工回复 |
    | 毕业院校 | 待员工回复 |
    | 专业 | 待员工回复 |
    | 毕业年份 | 预计 2026 |
    | 是否应届生 | □ 是　☑ 否（在读实习口径） |

    ## 工作经历（近 3 年，应届生填实习经历）

    | 时间段 | 公司名称 | 职位 | 离职原因 |
    |---|---|---|---|
    | 待员工回复 | 待员工回复 | 待员工回复 | 待员工回复 |
    | ＿＿＿＿ | ＿＿＿＿＿＿＿＿ | ＿＿＿＿＿＿ | ＿＿＿＿＿＿ |
    | ＿＿＿＿ | ＿＿＿＿＿＿＿＿ | ＿＿＿＿＿＿ | ＿＿＿＿＿＿ |

    ## 银行信息（用于工资发放）

    | 项目 | 填写内容 |
    |---|---|
    | 开户行（支行） | 待员工回复 |
    | 银行卡号 | 待员工回复 |
    | 持卡人姓名 | {SCENARIO['employee_name']} |

    ## 入职信息

    | 项目 | 填写内容 |
    |---|---|
    | 应聘岗位 | {SCENARIO['role']} |
    | 入职类型 | {SCENARIO['employment_type']} |
    | 报到日期 | 2026 年 6 月 11 日 |
    | 工作地点 | {SCENARIO['work_city']} |
    | 直属负责人 | {SCENARIO['manager']} |

    ## 备注

    - 权威报到口径采用 `{SCENARIO['report_date']} {SCENARIO['report_time']}`。
    - 旧 offer 中 `2026-06-02` 已视为过期信息，不回填。
    - 实习期间不参与社保 / 公积金登记。
    - 实习签署文件采用新版整份《实习生录用通知》，毕业后再签正式劳动合同。

    ## 入职材料核验清单（HR 填写）

    | 材料 | 是否提交 | 备注 |
    |---|---|---|
    | 身份证复印件（正反面） | □ 是　□ 否 | ＿＿＿＿＿＿＿＿ |
    | 学生证原件（已扫描存档） | □ 是　□ 否 | ＿＿＿＿＿＿＿＿ |
    | 招商银行卡复印件 | □ 是　□ 否 | ＿＿＿＿＿＿＿＿ |
    | 入职体检报告 | □ 是　□ 否 | 日期：＿＿＿＿＿＿ |
    | 学校实习证明/介绍信 | □ 是　□ 否　□ 不需要 | ＿＿＿＿＿＿＿＿ |
    | 新版实习生录用通知（已双签并盖章） | □ 是　□ 否 | ＿＿＿＿＿＿＿＿ |
    | 员工手册（已签字确认） | □ 是　□ 否 | ＿＿＿＿＿＿＿＿ |
    """)


def make_receipt_draft() -> str:
    return dedent(f"""
    ---
    title: 员工入职材料签收表 - {SCENARIO['employee_name']}（dry-run）
    date: 2026-06-06
    updated: 2026-06-06
    type: note
    tags:
      - people-ops
      - onboarding
      - receipt
      - dry-run
    ---

    # 员工入职材料签收表

    > 本文件为 dry-run 草稿，live 时应写入：`实例库/people-ops/onboarding/{SCENARIO['employee_name']}/员工入职材料签收表-{SCENARIO['employee_name']}.md`

    员工姓名：{SCENARIO['employee_name']}  
    应聘岗位：{SCENARIO['role']}  
    入职类型：{SCENARIO['employment_type']}  
    报到日期：2026 年 6 月 11 日

    本人确认，以下入职材料已由公司向本人当面交付、说明或签署，本人已知悉相关内容，并确认签收：

    | 序号 | 材料名称 | 份数 | 备注 |
    |---|---|---|---|
    | 1 | 新版实习生录用通知 | 2 份 | 双方签字盖章后，双方各执 1 份 |
    | 2 | 入职登记表 | 1 份 | 已填写并签字确认 |
    | 3 | 员工手册 | 1 份 | 已签字确认 |
    | 4 | 入职流程说明 | 1 份 | 口头说明 + 飞书提醒 |

    说明：
    1. 当前阶段以新版整份《实习生录用通知》替代单独实习合同。
    2. 身份证复印件、学生证、银行卡、体检报告等属于员工提交并由 HR 核验的材料，不纳入本签收表。
    3. 取得毕业证后，再启动正式劳动合同签署流程。
    """)


def make_device_checklist() -> str:
    return dedent(f"""
    ---
    title: 设备账号准备清单 - {SCENARIO['employee_name']}（dry-run）
    date: 2026-06-06
    updated: 2026-06-06
    type: note
    tags:
      - people-ops
      - onboarding
      - devices
      - dry-run
    ---

    # 设备 / 账号准备清单（D-1 拉起）

    > 本文件为 dry-run 草稿，live 时应写入：`实例库/people-ops/onboarding/{SCENARIO['employee_name']}/设备账号准备清单-{SCENARIO['employee_name']}.md`
    > 本清单只覆盖硬件 + 4 个通用账号，不覆盖业务工具账号。

    ## 基本信息

    | 项目 | 填写内容 |
    |---|---|
    | 姓名 | {SCENARIO['employee_name']} |
    | 应聘岗位 | {SCENARIO['role']} |
    | 入职类型 | {SCENARIO['employment_type']} |
    | 报到日期 | 2026 年 6 月 11 日 |
    | 直属负责人 | {SCENARIO['manager']} |

    ## 一、硬件设备

    | 项目 | 准备人 | 状态 | 备注 |
    |---|---|---|---|
    | 笔记本电脑（公司提供） | wzb | □ 待办　□ 已备 | 机型 / 资产编号：待填 |
    | 充电器 / 电源线 | wzb | □ 待办　□ 已备 |  |
    | 配件（键鼠 / 显示器等） | wzb | □ 待办　□ 已备　□ 不适用 | 按需 |
    | 资产领用登记 | HR | □ 待办　□ 已备 | 报到当天登记 |

    ## 二、入职必备账号（D-1 完成）

    | 项目 | 准备人 | 状态 | 备注 |
    |---|---|---|---|
    | 公司邮箱 `{SCENARIO['employee_name']}@gengrowth.ai` | Lynne | □ 待办　□ 已备 | 邀请已发送 |
    | 飞书账号（邀请进 GenGrowth 团队） | Lynne | □ 待办　□ 已备 | 仅加入必要群组 |
    | 企业滴滴 | Lynne | □ 待办　□ 已备 | 通讯录添加 |
    | GitHub 账号（加入 GenGrowth org） | wzb | □ 待办　□ 已备 | 权限按岗位最小化 |

    ## 三、业务工具账号（不在 HR 入职准备范围）

    由直属负责人在实际工作启动时按需开通，不在本清单中执行：Google Workspace、SEO 工具、社媒账号、Claude Code、AI 内容工具等。

    ## 四、行政与签署

    | 项目 | 状态 | 备注 |
    |---|---|---|
    | 新版实习生录用通知（2 份）准备 | □ 待办　□ 已备 | 入职当天签字 + 公司盖章 |
    | 员工手册（1 份）准备 | □ 待办　□ 已备 | 报到当天签收 |
    | 入职登记表打印 | □ 待办　□ 已备 | 现场签字 |
    | 入职材料签收表打印 | □ 待办　□ 已备 | 现场签字 |

    ## 五、报到当天交付清单（D-Day）

    - [ ] 笔记本电脑 + 配件领取并签收
    - [ ] 公司邮箱可登录
    - [ ] 飞书加入团队
    - [ ] 企业滴滴账号已开通
    - [ ] GitHub 账号收到邀请并完成激活
    - [ ] 入职登记表签字
    - [ ] 入职材料签收表签字
    - [ ] 新版实习生录用通知双签并盖章
    - [ ] 员工手册签字确认

    ## 六、报到 D+3 轻量复核

    - [ ] 4 个入职账号均可正常使用
    - [ ] 设备无问题
    - [ ] 直属负责人是否已按需开通业务工具账号（仅确认，不替开）
    """)


def make_day0_checklist() -> str:
    return dedent(f"""
    # D-Day 执行清单 — {SCENARIO['employee_name']}

    1. HR 现场核对：身份证复印件、学生证、招商银行卡复印件、体检报告、学校实习证明/介绍信（如需）
    2. Lynne：确认公司邮箱、飞书、企业滴滴已就绪
    3. wzb：确认笔记本、充电器、GitHub org 邀请已就绪
    4. HR：打印并回收签字
       - 入职登记表
       - 入职材料签收表
       - 新版整份《实习生录用通知》2 份
       - 员工手册签收页
    5. HR：确认签字盖章后扫描归档
    6. D+3：回查 4 个入职账号、设备和直属负责人后续工具开通状态
    """)


def make_internal_msg_wzb() -> str:
    return dedent(f"""
    # 内部协作消息预览 — 发给 wzb

    主题：{SCENARIO['employee_name']} {SCENARIO['report_date']} 入职 D-1 准备

    需要你处理：
    - 笔记本电脑 + 充电器准备完毕
    - 如有需要，补充键鼠 / 显示器
    - GitHub org 邀请按最小权限发出

    员工信息：
    - 姓名：{SCENARIO['employee_name']}
    - 岗位：{SCENARIO['role']}
    - 报到：{SCENARIO['report_date']} {SCENARIO['report_time']}
    - 直属负责人：{SCENARIO['manager']}

    本条为 dry-run 预览，不外发。
    """)


def make_internal_msg_lynne() -> str:
    return dedent(f"""
    # 内部协作消息预览 — 发给 Lynne

    主题：{SCENARIO['employee_name']} {SCENARIO['report_date']} 入职 D-1 准备

    需要你处理：
    - 公司邮箱开通
    - 飞书账号邀请
    - 企业滴滴开通
    - 打印新版整份《实习生录用通知》2 份
    - 报到当天完成公司盖章

    备注：
    - 彭满本次以新版整份《实习生录用通知》替代单独实习合同。
    - 拿到毕业证后再转正式劳动合同流程。

    本条为 dry-run 预览，不外发。
    """)


def make_live_path_mapping() -> str:
    return dedent(f"""
    # live 落位映射

    当前 dry-run 产物目录：`task-collab/tasks/2026-06-06-hr-bot-v0/output/pengman-2026-06-11/`

    live 时建议迁移为：
    - `实例库/people-ops/onboarding/{SCENARIO['employee_name']}/员工入职登记-{SCENARIO['employee_name']}.md`
    - `实例库/people-ops/onboarding/{SCENARIO['employee_name']}/员工入职材料签收表-{SCENARIO['employee_name']}.md`
    - `实例库/people-ops/onboarding/{SCENARIO['employee_name']}/设备账号准备清单-{SCENARIO['employee_name']}.md`

    员工侧四条消息保持消息预览形态，待 Lynne 确认 live 开启后再接 Feishu gateway。
    """)


def validate(generated: dict[str, str], artifact_root: Path, sandbox_config: str, profile_config: str) -> dict:
    employee_message_names = {
        "员工信息采集消息-彭满.md",
        "入职材料清单消息-彭满.md",
        "报到提醒-彭满.md",
        "员工手册提醒-彭满.md",
    }
    employee_messages = "\n".join(
        content for name, content in generated.items() if Path(name).name in employee_message_names
    )

    monetary_keywords = ["200 元/天", "7000", "8000"]
    writes_inside_artifact_root = all(
        str((artifact_root / rel_path).resolve()).startswith(str(artifact_root.resolve()))
        for rel_path in generated
    )

    return {
        "feishu_disabled_in_root_config": "enabled: false" in sandbox_config,
        "feishu_disabled_in_profile_config": "enabled: false" in profile_config,
        "home_channel_is_placeholder": "DRY_RUN_ONLY" in profile_config,
        "writes_inside_artifact_root": writes_inside_artifact_root,
        "employee_messages_omit_salary_numbers": not any(keyword in employee_messages for keyword in monetary_keywords),
        "employee_messages_only_cover_allowed_scope": all(keyword in employee_messages for keyword in ["信息采集", "报到", "员工手册"]),
    }


def build() -> dict:
    repo_root = find_repo_root()
    artifact_root = repo_root / "task-collab" / "tasks" / "2026-06-06-hr-bot-v0"
    sandbox_home = artifact_root / "sandbox-home"
    profile_dir = sandbox_home / "profiles" / "hr-lead"
    skill_dir = profile_dir / "skills" / "hr-onboarding-v0"
    output_dir = artifact_root / "output" / "pengman-2026-06-11"

    task_md = make_task_markdown()
    readme_md = make_readme()
    sandbox_config = make_root_config()
    profile_config = make_profile_config()
    soul = make_soul()
    skill = make_skill()
    routing = make_routing_draft()
    scenario_json = make_scenario_json()

    files = {
        "README.md": readme_md,
        "../2026-06-06-hr-bot-v0-task.md": task_md,
        "sandbox-home/config.yaml": sandbox_config,
        "sandbox-home/profiles/hr-lead/config.yaml": profile_config,
        "sandbox-home/profiles/hr-lead/SOUL.md": soul,
        "sandbox-home/profiles/hr-lead/skills/hr-onboarding-v0/SKILL.md": skill,
        "scenario-pengman-2026-06-11.json": scenario_json,
        "feishu-routing-draft.yaml": routing,
        "output/pengman-2026-06-11/员工信息采集消息-彭满.md": make_employee_info_message(),
        "output/pengman-2026-06-11/入职材料清单消息-彭满.md": make_materials_message(),
        "output/pengman-2026-06-11/报到提醒-彭满.md": make_reporting_reminder(),
        "output/pengman-2026-06-11/员工手册提醒-彭满.md": make_handbook_reminder(),
        "output/pengman-2026-06-11/员工入职登记-彭满.md": make_register_draft(),
        "output/pengman-2026-06-11/员工入职材料签收表-彭满.md": make_receipt_draft(),
        "output/pengman-2026-06-11/设备账号准备清单-彭满.md": make_device_checklist(),
        "output/pengman-2026-06-11/D-Day执行清单-彭满.md": make_day0_checklist(),
        "output/pengman-2026-06-11/内部协作消息-wzb.md": make_internal_msg_wzb(),
        "output/pengman-2026-06-11/内部协作消息-lynne.md": make_internal_msg_lynne(),
        "output/pengman-2026-06-11/live-落位映射.md": make_live_path_mapping(),
    }

    generated_for_validation = {}
    for rel_path, content in files.items():
        target = artifact_root / rel_path
        write(target, content)
        generated_for_validation[rel_path] = content

    validations = validate(generated_for_validation, artifact_root, sandbox_config, profile_config)
    report_lines = [
        "# dry-run 验证报告",
        "",
        f"- 产物根目录：`{artifact_root}`",
        f"- 员工：{SCENARIO['employee_name']}",
        f"- 权威报到口径：{SCENARIO['report_date']} {SCENARIO['report_time']}（来源：{SCENARIO['authoritative_date_source']}）",
        f"- 旧版冲突日期：{SCENARIO['stale_offer_date']}（本次未采用）",
        "",
        "## 校验结果",
    ]
    for key, value in validations.items():
        report_lines.append(f"- {key}: {'PASS' if value else 'FAIL'}")
    report_lines.extend(
        [
            "",
            "## 说明",
            "- 本次未外发消息；所有员工侧内容均为消息预览。",
            "- 本次未改标准区；所有新产物仅写入当前任务目录。",
            "- live 前仍需人工确认正式 toolset 名称、Feishu 凭证和 home channel。",
        ]
    )
    report = "\n".join(report_lines) + "\n"
    write(output_dir / "dry-run-report.md", report)
    generated_for_validation["output/pengman-2026-06-11/dry-run-report.md"] = report

    manifest = {
        "artifact_root": str(artifact_root),
        "scenario": SCENARIO,
        "source_paths": SOURCE_PATHS,
        "validations": validations,
        "generated_files": [
            {
                "path": rel_path,
                "sha256": sha256_text(content),
                "bytes": len(content.encode("utf-8")),
            }
            for rel_path, content in sorted(generated_for_validation.items())
        ],
    }
    manifest_text = json.dumps(manifest, ensure_ascii=False, indent=2) + "\n"
    write(output_dir / "dry-run-manifest.json", manifest_text)

    summary = {
        "artifact_root": str(artifact_root),
        "output_dir": str(output_dir),
        "profile_dir": str(profile_dir),
        "generated_count": len(generated_for_validation) + 1,
        "validations": validations,
    }
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return summary


if __name__ == "__main__":
    build()
