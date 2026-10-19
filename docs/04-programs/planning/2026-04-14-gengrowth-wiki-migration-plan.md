---
title: GenGrowth Wiki 迁移实施计划
date: 2026-04-14
updated: 2026-04-16
type: plan
version: v1.0
status: draft
owner: Lynne
tags:
  - docs
  - migration
  - implementation-plan
  - governance
aliases:
  - wiki迁移实施计划
  - wiki-migration-plan
---

# GenGrowth Wiki 迁移实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在不打断现有工作流的前提下，完成 `gengrowth-wiki` 的目录重组，先统一正式文档、业务实例、过程材料与工具系统的边界，再分批迁移高冲突目录。

**Architecture:** 先冻结系统入口与低争议目录，再新增目标目录骨架，随后按“HR/法务/治理交叉区 -> 共享素材与内容草稿 -> 工具区与零散目录”三批迁移。迁移中始终遵守“一份文件一个主归属”和“实例不进 docs”的原则。

**Tech Stack:** Obsidian Markdown、目录迁移、README/索引维护、相对链接校验

---

### Task 1: 固化迁移规则与冻结清单

**Files:**
- Create: `/Users/lynne/gengrowth-wiki/docs/04-programs/planning/2026-04-14-gengrowth-wiki-information-architecture-design.md`
- Create: `/Users/lynne/gengrowth-wiki/docs/04-programs/planning/2026-04-14-gengrowth-wiki-migration-plan.md`
- Verify: `/Users/lynne/gengrowth-wiki/AGENTS.md`
- Verify: `/Users/lynne/gengrowth-wiki/docs/README.md`

**Step 1: 确认边界规则**

确认以下规则已经定稿：

1. `docs/` 只放当前正式基线
2. `实例库/` 只放真实业务实例
3. `docs/90-archive/` 只放旧版正式文档
4. `Clippings/`、`wzb-obsidian/` 本轮冻结不动

**Step 2: 确认第一批迁移范围**

第一批仅包含：

1. `法务财务/`
2. `人事行政/`
3. `docs/01-company/hr/`
4. `公司公共文档/`
5. `内容资产草稿/`

### Task 2: 新建目标目录骨架与索引

**Files:**
- Create: `/Users/lynne/gengrowth-wiki/实例库/README.md`
- Create: `/Users/lynne/gengrowth-wiki/工作台/README.md`
- Create: `/Users/lynne/gengrowth-wiki/docs/05-governance/people-ops/README.md`
- Modify: `/Users/lynne/gengrowth-wiki/docs/05-governance/README.md`
- Modify: `/Users/lynne/gengrowth-wiki/docs/06-shared/README.md`

**Step 1: 建立 `实例库/` 目录骨架**

建议创建：

```text
实例库/
├── contracts/
│   ├── employment/
│   └── commercial/
├── people-ops/
│   ├── resumes/
│   ├── candidate-evaluations/
│   ├── offers/
│   └── onboarding/
├── finance-payments/
└── corporate/
    ├── entity-documents/
    └── capital/
```

**Step 2: 建立 `工作台/` 目录骨架**

建议创建：

```text
工作台/
├── inbox/
├── content/
│   └── wechat/
├── people-ops/
├── legal-finance/
└── references/
```

**Step 3: 在 `docs/05-governance/` 下补全 `people-ops/`**

建议创建：

```text
docs/05-governance/people-ops/
├── recruiting/
│   ├── playbooks/
│   ├── templates/
│   └── role-specs/
├── onboarding/
│   ├── playbooks/
│   └── templates/
└── policies/
```

### Task 3: 迁移 `docs/01-company/hr/`

**Files:**
- Modify: `/Users/lynne/gengrowth-wiki/docs/01-company/hr/*.md`
- Create: `/Users/lynne/gengrowth-wiki/docs/05-governance/people-ops/...`
- Create: `/Users/lynne/gengrowth-wiki/docs/05-governance/contracts/...`
- Verify: `/Users/lynne/gengrowth-wiki/docs/01-company/README.md`

**Step 1: 将 HR 流程与制度文档迁入 `people-ops/`**

建议迁移：

| 当前文件 | 目标路径 |
|---|---|
| `docs/01-company/hr/offer发放邮件-模板.md` | `docs/05-governance/people-ops/recruiting/templates/offer-email-template.md` |
| `docs/01-company/hr/录用通知-模板.md` | `docs/05-governance/people-ops/recruiting/templates/full-time-offer-letter-template.md` |
| `docs/01-company/hr/实习生录用通知-模板.md` | `docs/05-governance/people-ops/recruiting/templates/intern-offer-letter-template.md` |
| `docs/01-company/hr/入职登记表-模板.md` | `docs/05-governance/people-ops/onboarding/templates/onboarding-registration-form-template.md` |
| `docs/01-company/hr/员工手册.md` | `docs/05-governance/people-ops/policies/employee-handbook.md` |
| `docs/01-company/hr/导出说明.md` | `docs/05-governance/people-ops/onboarding/playbooks/hr-export-guide.md` |

**Step 2: 将员工合同类文档迁入 `contracts/employment/`**

建议迁移：

| 当前文件 | 目标路径 |
|---|---|
| `docs/01-company/hr/劳动合同-模板.md` | `docs/05-governance/contracts/employment/templates/labor-contract-template.md` |
| `docs/01-company/hr/保密与竞业限制协议-模板.md` | `docs/05-governance/contracts/employment/templates/nda-non-compete-template.md` |

**Step 3: 将导出脚本与生成件分离**

建议处理：

1. `docs/01-company/hr/export/` 下具体导出件迁入 `实例库/people-ops/offers/` 或 `实例库/contracts/employment/`
2. `hr-export.sh`、`一键导出全部Word.command`、`setup_reference.py` 迁入 `tools/internal/hr-doc-export/`
3. `reference.docx` 作为工具依赖，与导出脚本放在同一工具目录

### Task 4: 拆分 `法务财务/`

**Files:**
- Modify: `/Users/lynne/gengrowth-wiki/法务财务/**`
- Create: `/Users/lynne/gengrowth-wiki/docs/05-governance/contracts/...`
- Create: `/Users/lynne/gengrowth-wiki/docs/05-governance/finance-payments/...`
- Create: `/Users/lynne/gengrowth-wiki/实例库/contracts/...`
- Create: `/Users/lynne/gengrowth-wiki/实例库/corporate/...`
- Create: `/Users/lynne/gengrowth-wiki/参考资料/contracts/...`

**Step 1: 外部参考模板迁入 `参考资料/`**

建议迁移：

| 当前文件 | 目标路径 |
|---|---|
| `法务财务/合同范本/广州劳动合同（示范文本）.doc` | `参考资料/contracts/employment/广州劳动合同（示范文本）.doc` |
| `法务财务/合同范本/保密、竞业限制及工作成果协议.docx` | `参考资料/contracts/employment/保密、竞业限制及工作成果协议.docx` |
| `法务财务/合同范本/顾问服务合同-clear.docx` | `参考资料/contracts/commercial/顾问服务合同-clear.docx` |
| `法务财务/合同范本/技术服务协议.docx` | `参考资料/contracts/commercial/技术服务协议.docx` |

**Step 2: 已采用的正式模板迁入 `docs/`**

只有已经确定为当前正式基线的模板，才迁入：

1. `docs/05-governance/contracts/employment/templates/`
2. `docs/05-governance/contracts/commercial/templates/`
3. `docs/05-governance/finance-payments/templates/`

**Step 3: 已签合同与公司法务文件迁入 `实例库/`**

建议迁移：

| 当前文件 | 目标路径 |
|---|---|
| `法务财务/签署合同/*.pdf` | `实例库/contracts/commercial/` |
| `法务财务/至真增资协议/*` | `实例库/corporate/capital/` |
| `法务财务/准予变更登记（备案）通知书.pdf` | `实例库/corporate/entity-documents/` |

### Task 5: 拆分 `人事行政/`

**Files:**
- Modify: `/Users/lynne/gengrowth-wiki/人事行政/**`
- Create: `/Users/lynne/gengrowth-wiki/docs/05-governance/people-ops/...`
- Create: `/Users/lynne/gengrowth-wiki/实例库/people-ops/...`
- Create: `/Users/lynne/gengrowth-wiki/工作台/people-ops/...`

**Step 1: 业务实例迁入 `实例库/people-ops/`**

建议迁移：

| 当前文件 | 目标路径 |
|---|---|
| `人事行政/简历/*.pdf` | `实例库/people-ops/resumes/` |
| `人事行政/候选人评估总表.md` | `实例库/people-ops/candidate-evaluations/2026-candidate-evaluations.md` |

**Step 2: 招聘正式基线迁入 `docs/05-governance/people-ops/recruiting/`**

只有定稿后的招聘流程、模板、正式 JD 才进入这里。

建议目标子目录：

1. `playbooks/`
2. `templates/`
3. `role-specs/`

**Step 3: 执行性和讨论性材料迁入 `工作台/people-ops/`**

建议迁移：

| 当前文件 | 目标路径 |
|---|---|
| `人事行政/招聘岗位.md` | `工作台/people-ops/recruiting/open-role-jds.md` |
| `人事行政/招聘岗位-精选5岗-JD摘要.md` | `工作台/people-ops/recruiting/jd-summary.md` |
| `人事行政/招聘对标公司.md` | `工作台/people-ops/recruiting/benchmark-companies.md` |
| `人事行政/SEO顾问合作.md` | `工作台/legal-finance/commercial/seo-consultant-cooperation.md` |

### Task 6: 拆分 `公司公共文档/` 与 `内容资产草稿/`

**Files:**
- Modify: `/Users/lynne/gengrowth-wiki/公司公共文档/*`
- Modify: `/Users/lynne/gengrowth-wiki/内容资产草稿/**`
- Create: `/Users/lynne/gengrowth-wiki/docs/06-shared/assets/...`
- Create: `/Users/lynne/gengrowth-wiki/实例库/corporate/entity-documents/...`
- Create: `/Users/lynne/gengrowth-wiki/工作台/content/...`

**Step 1: 品牌素材迁入 `docs/06-shared/assets/brand/`**

建议迁移：

| 当前文件 | 目标路径 |
|---|---|
| `公司公共文档/web logo-250*100.png` | `docs/06-shared/assets/brand/web-logo-250x100.png` |
| `公司公共文档/公司logo合集.jpg` | `docs/06-shared/assets/brand/company-logo-collection.jpg` |
| `公司公共文档/圆形logo.png` | `docs/06-shared/assets/brand/round-logo.png` |
| `公司公共文档/方形logo-500*500.jpg` | `docs/06-shared/assets/brand/square-logo-500x500.jpg` |

**Step 2: 公司证照迁入 `实例库/corporate/`**

建议迁移：

| 当前文件 | 目标路径 |
|---|---|
| `公司公共文档/营业执照-进格.jpg` | `实例库/corporate/entity-documents/营业执照-进格.jpg` |

**Step 3: 内容草稿迁入 `工作台/content/`**

建议迁移：

| 当前文件 | 目标路径 |
|---|---|
| `内容资产草稿/微信/*` | `工作台/content/wechat/` |

### Task 7: 重整工具区，但不破坏现有自动化

**Files:**
- Modify: `/Users/lynne/gengrowth-wiki/tools/**`
- Modify: `/Users/lynne/gengrowth-wiki/tools/external/wechat-cli/**`
- Modify: `/Users/lynne/gengrowth-wiki/Skills 安装包及终端操作/**`
- Verify: `/Users/lynne/gengrowth-wiki/Clippings/`

**Step 1: 扩容 `tools/`**

建议结构：

```text
tools/
├── browser-extensions/
│   └── x-writer-extension/
├── external/
│   └── wechat-cli/
├── internal/
│   ├── hr-doc-export/
│   └── skills/
└── docs/
```

**Step 2: 将 `wechat-cli/` 收口到 `tools/external/wechat-cli/`**

保留其代码仓结构，不做内容级修改。

**Step 3: 拆分 `Skills 安装包及终端操作/`**

建议迁移：

1. `.skill` 包与 `web-clipper/` 代码 -> `tools/internal/skills/`
2. `claude-code-guide.md`、`gstack-analysis.md` -> `参考资料/tool-guides/` 或 `工作台/references/`

**Step 4: 保持 `Clippings/` 冻结**

本轮不改名、不迁移、不吸入 `tools/`。

### Task 8: 验证

**Files:**
- Verify: `/Users/lynne/gengrowth-wiki/docs/**`
- Verify: `/Users/lynne/gengrowth-wiki/实例库/**`
- Verify: `/Users/lynne/gengrowth-wiki/工作台/**`
- Verify: `/Users/lynne/gengrowth-wiki/参考资料/**`
- Verify: `/Users/lynne/gengrowth-wiki/Clippings/**`

**Step 1: 检查相对链接**

重点检查：

1. `docs/` 内部相对链接是否仍可打开
2. 计划文档引用路径是否更新
3. 记录与 README 中是否保留旧路径

**Step 2: 检查自动化入口**

必须确认：

1. `Clippings/` 仍能自动落盘
2. `task-collab/` 不受影响
3. `tools/` 下扩展与脚本路径无明显断裂

**Step 3: 检查实例与正式文档是否混放**

人工抽检：

1. `docs/` 中不再存放已签合同、简历、回单
2. `实例库/` 中不再存放正式规则和制度
3. `工作台/` 中不再长期留存已定稿正式文档

---

## 推荐执行节奏

### 第一轮

1. 新建目录骨架
2. 迁移 `docs/01-company/hr/`
3. 拆分 `法务财务/`
4. 拆分 `人事行政/`

### 第二轮

1. 迁移 `公司公共文档/`
2. 迁移 `内容资产草稿/`
3. 迁移 Vertex AI 临时笔记到 `工作台/inbox/2026-04-14-vertex-ai-aio-notes.md`

### 第三轮

1. 扩容 `tools/`
2. 整理 `tools/external/wechat-cli/`
3. 拆分 `Skills 安装包及终端操作/`
4. 处理剩余根目录零散文件

---

## 风险控制

1. `Clippings/` 在未改插件配置前禁止迁移。
2. `wzb-obsidian/` 作为独立系统，本轮只标注边界，不做实质移动。
3. 任何已签合同、简历、证照迁移时，应优先保证文件名和历史可检索性。
4. 对路径敏感的脚本与 README，应在迁移后逐一修正引用。
