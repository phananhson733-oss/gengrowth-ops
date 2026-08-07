---
title: 04-production 瘦身迁移提案
project: astrologywiki
type: workspace-reorganization-proposal
status: in-progress
owner: Pengman
updated: 2026-07-16
---

# 04-production 瘦身迁移提案

> 一句话结论：`04-production` 的主要问题是生产、SOP、策略、调研、历史资料共用入口，以及状态索引不完整；审查基线约 1.01 MiB，A、B 批次后约 770 KB，始终没有媒体大文件，因此不是明显的 Git 上传负担。

> 执行状态：A、B、C1 已完成。C1 当时采用“每日候选与单条生产分离”；该日级候选口径已在 2026-07-20 被滚动周机制替代。当前候选目录只用于周一研究、合格 Hot、确认补库或明确重排；其余状态归档和 D 批次仍待确认。

## A 批次执行记录（2026-07-16）

- 已建立 `inbox-pengman/02-调研资料/` 及平台与策略、方法论、工具调研、历史调研、历史流程五个入口。
- 已迁移视频与视觉工具调研、文字与社媒工具调研、三份历史调研、内容方向总览、通用运营框架、鱼骨图和根旧工作流，共 16 个原有文件。
- 已更新 `inbox-pengman` 内受影响的 wikilink 和硬编码路径；A 批次当时没有移动 `03-reference-accounts`，也没有修改 `AGENTS.md`。
- 仓库权限不允许创建 `.git/index.lock`，因此无法使用 `git mv`；实际使用文件系统移动，Git 可在差异阶段识别删除/新增或重命名。
- A 批次后 `04-production` 为 70 个文件、约 844.5 KB（其中 4 个为已忽略 `.DS_Store`）；迁移前为 86 个文件、1,055,213 B，当前生产区减少 16 个文件和约 20% 体积。
- 新 `02-调研资料` 为 21 个文件、224,054 B，其中 16 个为迁移文件、5 个为新建索引。仓库总体积没有因移动而下降，索引说明使文本量小幅增加。
- 迁移前完整目录树和数字继续保留为审查基线；当前结构以 `04-production/README.md` 和 `02-调研资料/README.md` 为准。

## B 批次执行记录（2026-07-16）

- 已把原 `04-production/03-reference-accounts/` 整体迁到 `02-调研资料/竞品研究/`，共 9 个原有文件，其中 1 个 `.DS_Store` 已被 Git 忽略。
- 4 个 CSV 保留并迁到 `02-调研资料/竞品研究/旧快照/2026-07-07/`；没有删除历史数据。
- 已新增旧快照两级 README，明确这些 CSV 不参与新 Brief、候选生成或当前数据判断。
- 已同步更新 `inbox-pengman/AGENTS.md`、Social Daily Skill、Daily SOP、四账号 Playbook、工作区 README、current-context 和所有竞品路径引用。
- B 批次先把 Social Daily Skill 升级为 `v0.9.1`，只更新研究路径和旧快照边界；Pengman 随后确认暂停 GSC，Skill 再升级为 `v0.9.2`，移除 GSC 的读取、权限检查和证据门槛。
- `04-production` 当前为 60 个文件、约 770 KB；Pengman 已确认同期删除的 GSC reports/README 不恢复，后续暂不读取 GSC。
- `02-调研资料` 当前为 32 个文件、约 303 KB；在线 Google Sheet 继续作为竞品数据唯一事实来源。

## C1 批次执行记录（2026-07-17）

- `06-daily-content-recommendations/` 当时被收窄为日级候选入口；自 2026-07-20 起，该口径被滚动周机制替代。当前只用于周一候选研究、合格 Hot、确认补库或明确重排，历史日级文件保留为快照。
- 新建 `07-content-production/`，迁入 9 份单条制作方案、4 份主生产记录、3 份 Messi × Yamal 实验附件、2 份已合并生产过程稿，以及 2 份名称虽为“内容包”但实际包含完整脚本/素材/发布设置的单条生产资产，共 20 个原文件；没有删除或合并正文。
- C1 完成后，`06` 为 17 个文件、211,809 B；`07` 为 22 个文件、325,080 B，其中 2 个是新建索引。整个 `04-production` 为 65 个文件、809,236 B；拆分主要改善职责和读取范围，不减少仓库总体积。
- 已同步更新工作区 README、AGENTS、current-context、主题入口、SOP、周报和迁移文件之间的路径引用。
- 本批次不按文件日期猜测状态，也不建立 `当前制作/待发布/已发布` 物理子目录；当前队列仅由 `07/README.md` 索引，缺 `content_stage` 的旧制作方案继续标为待确认。

## 原 `03-topic-ideas`（现 `02-topic-ideas`）退役与删除影响（2026-07-17）

- Pengman 已确认不再把原 `03-topic-ideas`（现 `02-topic-ideas`）作为人工入口；当前 AGENTS、Social Daily Skill、Daily SOP 和生产 README 已移除默认读取依赖，目录标记为 `deprecated`。
- 目录现有 29 个文件、18,009,367 B；其中 27 个被 Git 跟踪。18 张 Birth Chart 分镜 PNG 合计 17,936,445 B，占目录约 99.6%，且在 `inbox-pengman` 中没有相同哈希副本。
- 8 个 Markdown 合计仅 60,626 B，包括两份历史研究/选题库、Birth Chart 完整生产稿，以及 Messi、Haaland、Harry Kane 三份历史脚本/记录。
- `inbox-pengman` 外部仍有 19 个 Markdown 文件引用该目录，包括周报索引、历史周报、旧每日内容包和历史流程；物理删除前必须同批修复链接。
- 当前有 4 个已跟踪 Markdown 处于未提交修改状态，不能在未确认处理方式时直接删除或迁移。
- 仅把 PNG 移到其他目录不会降低仓库或工作区体积；若确认这些分镜不再复用，删除 18 张 PNG 才能让当前工作树减少约 17.9 MB。由于文件已经进入 Git 历史，普通删除提交不会缩小既有 `.git` 历史体积。

## 1. 审查范围与方法

审查范围：`inbox-pengman/04-production/**`，并读取以下上层规则和现有入口：

- `inbox-pengman/AGENTS.md`；
- `inbox-pengman/README.md`；
- `inbox-pengman/04-production/00-evergreen-workflows/ai-advisor/当前状态与决策记录.md`；
- `inbox-pengman/04-production/README.md`；
- `inbox-pengman/04-production/00-evergreen-workflows/**`；
- 各一级子目录 README；
- 本提案原版本。

盘点使用工作区文件、文件类型、大小、Git 跟踪状态、内容哈希、README 索引、wikilink 目标和路径引用检查。以下体积是 2026-07-16 低风险文档调整前的审查基线。

## 2. 迁移前完整目录树（审查基线）

```text
04-production/
├── .DS_Store                         # 已被 .gitignore 排除
├── .gitkeep                          # 已跟踪，目录已非空
├── README.md
├── astrologywiki-social-content-workflow.md
├── 00-evergreen-workflows/
│   ├── .DS_Store                     # 已忽略
│   ├── README.md
│   ├── Pengman 与 AI 内容润色协作说明.md
│   ├── ai-short-video-production-workflow.md
│   ├── daily-content-assistant-sop.md
│   ├── instagram-image-content-workflow.md
│   ├── social-account-warmup-and-launch-workflow.md
│   ├── 内容生产与学习记录模板.md
│   ├── 内容路由与规则调用说明.md
│   ├── 统一内容 Brief 模板.md
│   └── astrologywiki-social-workflow/
│       └── SKILL.md
├── 01-strategy-and-platform-research/
│   ├── .gitkeep
│   ├── README.md
│   ├── content-direction-and-tools-research.md
│   ├── AstrologyWiki 社媒账号定位与内容路由 Playbook.md
│   ├── social-seo-content-operations-framework.md
│   ├── social-seo-fishbone-map.md
│   └── 历史调研资料/
│       ├── README.md
│       ├── AstrologyWiki 站外内容平台调研与首轮运营方案初稿.md
│       ├── 各多媒体平台具体内容调研.md
│       └── 海外营销内容平台以及思考.md
├── 02-video-and-visual-tool-research/
│   ├── .gitkeep
│   ├── README.md
│   ├── golpo-video-workflow-research.md
│   ├── higgsfield-avatar-video-research.md
│   ├── higgsfield-video-workflow-research.md
│   └── remotion-video-template-research.md
├── 03-reference-accounts/
│   ├── .DS_Store                     # 已忽略
│   ├── .gitkeep
│   ├── README.md
│   ├── astrology-short-video-format-analysis.md
│   ├── reference-accounts.md
│   └── sheets-export/
│       ├── account_analysis.csv
│       ├── account_links.csv
│       ├── video_analysis.csv
│       └── video_links.csv
├── 04-text-and-social-tool-research/
│   ├── README.md
│   └── perplexity-tavily-x-content-workflow-research.md
├── 05-weekly-published-content-digests/
│   ├── README.md
│   ├── 2026-06-17-astrologywiki-messi-video-launch-report.md
│   ├── 2026-07-03-social-content-data-analysis.md
│   ├── 2026-07-06-social-content-data-analysis.md
│   ├── 2026-W25 已发布内容合集.md
│   ├── 2026-W27 本周已发布内容合集.md
│   ├── 2026-W28 本周已发布内容合集.md
│   ├── 2026-W29 本周已发布内容合集.md
│   └── public-account-crawl-log.md
├── 06-daily-content-recommendations/
│   ├── .DS_Store                     # 已忽略
│   ├── README.md
│   ├── 2026-07-01-daily-content-recommendation.md
│   ├── 2026-07-02 每日内容包.md
│   ├── 2026-07-03 AI Host Video 2 制作方案.md
│   ├── 2026-07-03 AI Host 视频内容包.md
│   ├── 2026-07-06 Celebrity Rising Sign 视频制作方案.md
│   ├── 2026-07-06 House of the Dragon Rhaenyra 视频制作方案.md
│   ├── 2026-07-06 每日内容推荐与内容包.md
│   ├── 2026-07-07 每日内容包.md
│   ├── 2026-07-08 每日选题池.md
│   ├── 2026-07-09 Moon Sign Toxic Traits 视频制作方案.md
│   ├── 2026-07-09 Venus enters Virgo 内容包.md
│   ├── 2026-07-09 每日选题池.md
│   ├── 2026-07-10 Fire Moon Toxic Traits 视频制作方案.md
│   ├── 2026-07-10 每日选题池.md
│   ├── 2026-07-13 Cancer New Moon 视频制作方案.md
│   ├── 2026-07-13 Dreaming About Your Ex 视频制作方案.md
│   ├── 2026-07-13 每日选题池.md
│   ├── 2026-07-14 Earth Moon Toxic Traits 视频制作方案.md
│   ├── 2026-07-14 France vs Spain Astrology Slideshow 制作方案.md
│   ├── 2026-07-14 每日选题池.md
│   ├── 2026-07-16 Messi × Yamal World Cup Final Claude Candidate.md
│   ├── 2026-07-16 Messi × Yamal World Cup Final GPT Candidate.md
│   ├── 2026-07-16 Messi × Yamal World Cup Final 内容生产记录.md
│   ├── 2026-07-16 Messi × Yamal World Cup Final 双模型实验 Prompt.md
│   ├── 2026-07-16 Moon Sign Toxic Traits 第4集 内容生产记录.md
│   ├── 2026-07-16 世界杯决赛图文选题池.md
│   └── 已合并旧稿/
│       ├── README.md
│       ├── 2026-07-02-daily-content-recommendation.md
│       ├── 2026-07-02-daily-topic-research.md
│       ├── 2026-07-02-social-daily-skill-plan.md
│       ├── 2026-07-03-ai-host-video1-production-guide.md
│       └── 2026-07-03-topic-to-ai-host-video-production-process.md
└── 07-gsc-exports/
    └── README.md
```

## 3. 数量、体积、最大文件和文件类型

### 3.1 总量

| 指标 | 审查结果 |
|---|---:|
| 文件总数 | 86 |
| Git 已跟踪 | 82 |
| Git 忽略 | 4 个 `.DS_Store` |
| 未跟踪且未忽略 | 0 |
| 总体积 | 1,055,213 B，约 1.01 MiB |
| 已跟踪内容体积 | 1,026,525 B，约 1002.5 KiB |
| Markdown | 74 个，1,003,802 B，约 980.3 KiB |
| CSV | 4 个，22,723 B，约 22.2 KiB |
| `.gitkeep` | 4 个，0 B |
| 忽略的 `.DS_Store` | 4 个，28,688 B，约 28.0 KiB |

### 3.2 各目录递归文件数与体积

| 目录 | 文件数 | 体积 | 占总量约比 |
|---|---:|---:|---:|
| 根目录直接文件 | 4 | 20,419 B / 19.9 KiB | 1.9% |
| `00-evergreen-workflows/` | 11 | 121,833 B / 119.0 KiB | 11.5% |
| `01-strategy-and-platform-research/` | 10 | 177,130 B / 173.0 KiB | 16.8% |
| `02-video-and-visual-tool-research/` | 6 | 35,746 B / 34.9 KiB | 3.4% |
| `03-reference-accounts/` | 9 | 77,500 B / 75.7 KiB | 7.3% |
| `04-text-and-social-tool-research/` | 2 | 11,001 B / 10.7 KiB | 1.0% |
| `05-weekly-published-content-digests/` | 9 | 112,600 B / 110.0 KiB | 10.7% |
| `06-daily-content-recommendations/` | 34 | 498,234 B / 486.6 KiB | 47.2% |
| `07-gsc-exports/` | 1 | 750 B / 0.7 KiB | 0.1% |

`06-daily-content-recommendations` 同时包含当前队列、已发布生产记录、早期内容包、候选附件和已合并旧稿，是当前人工和 AI 查找压力最大的目录。

### 3.3 最大文件

| 排名 | 文件 | 大小 | 类型 / 判断 |
|---:|---|---:|---|
| 1 | `历史调研资料/AstrologyWiki 站外内容平台调研与首轮运营方案初稿.md` | 70,764 B | Markdown 历史调研；也是当前最大 Git blob |
| 2 | `2026-07-16 Messi × Yamal...内容生产记录.md` | 47,521 B | Markdown 当前主生产记录；审查时有用户未提交改动 |
| 3 | `2026-07-16 Moon Sign Toxic Traits 第4集 内容生产记录.md` | 40,659 B | Markdown 当前生产记录 |
| 4 | `astrologywiki-social-workflow/SKILL.md` | 38,682 B | Markdown 当前执行规则 |
| 5 | `social-seo-content-operations-framework.md` | 29,375 B | Markdown 通用运营框架 |

没有单文件超过 100 KiB，更没有 Git LFS 级别的大文件。

### 3.4 二进制、媒体、缓存和导出

- 没有图片、视频、音频、PDF、压缩包、模型权重、临时帧或渲染输出。
- 仅有 4 个 macOS `.DS_Store` 二进制文件，均已被根 `.gitignore` 正确忽略。
- 没有发现 `.tmp`、`.bak`、`.swp`、备份副本、未命名文件或缓存目录。
- 4 个 CSV 是旧 Google Sheet 快照，总计 22.2 KiB，已被 README 明确标为落后且不参与新 Brief。
- `07-gsc-exports/` 当前只有 README，没有可用 CSV；不能把缺数据解释成指标为 0。

## 4. Git 与同步判断

### 已验证

- 82 个有效文件已被 Git 跟踪；4 个 `.DS_Store` 被忽略。
- 当前最大 Git blob 只有 70,764 B。
- 根 `.gitignore` 已覆盖 `.DS_Store`、`*.tmp`、`*.swp`、`*~`、`node_modules/` 等常见本地垃圾。
- 审查开始时，本范围唯一已有未提交改动是 `2026-07-16 Messi × Yamal World Cup Final 内容生产记录.md`，本轮未修改该文件。

### 结论

当前没有证据表明 `04-production` 会造成明显 Git 上传或仓库体积问题。Markdown 文件数量多会增加浏览、索引和 AI 选择成本，但 1 MiB 级文本不会形成显著网络同步负担。

把研究文件从 `04-production` 移到同一仓库的 `02-调研资料`，只会改善目录和 AI 路由，不会降低整个 Git 仓库体积。只有删除 Git 历史/跟踪文件、把未来大型媒体放外部存储，或不再跟踪可重建输出，才会真正减少仓库传输量。

### `.gitignore` 建议

本轮不需要修改根 `.gitignore`。如果以后开始把媒体制作放进工作区，再先确认影响后增加**目录级**规则，例如 `renders/`、`frames/`、`.cache/`、`model-output/`，并将 `.mp4/.mov/.wav` 等大型成品放外部存储，只在 Markdown 中保留来源链接、授权状态、生成参数和最终文件位置。不要现在用过宽的 `*.png` 或 `*.jpg` 规则，以免误排需要版本管理的小型品牌资产。

## 5. 已验证问题与推测问题

### 5.1 已验证问题

1. **职责混放**：8 个一级子目录同时承载生产、周报、SOP、平台策略、工具研究、竞品研究、旧快照和历史资料。
2. **生产目录占比最高且状态混排**：`06` 占总字节 47.2%，当前、已发布、待选择、过程附件和旧稿同层。
3. **README 曾遗漏当前文件**：审查时 `06/README.md` 未索引 5 个 2026-07-16 Messi/Yamal 相关文件和选题池；`01/README.md` 未索引四账号 Playbook。
4. **状态口径不统一**：新模板要求 `status` 只服务 dispatch、真实阶段写 `content_stage`，但旧文件仍使用 `ready-to-produce`、`awaiting-selection`、`consolidated`、`collecting`、`closed-public` 等自定义 `status`。这些值对 dispatch 只是未知/提示状态，不能稳定驱动生产队列。
5. **端到端规则重叠**：旧根工作流、通用运营框架、鱼骨图、Daily SOP 和 Social Daily Skill 都描述了选题—生产—发布—复盘的部分或全部流程。
6. **Daily SOP 有历史 MVP 残留**：其中仍写“之后再考虑正式 Skill”，但正式 Skill 已存在并持续更新；可复用 Prompt 与 Skill 输出要求存在重复。
7. **竞品本地快照已过期**：本地 CSV 只有旧数据，在线 Google Sheet 已被 README 定义为唯一事实来源。
8. **无效链接**：全量 wikilink 检查发现 1 个无目标链接 `social-media-operations`；本轮已移除失效 wikilink并保留待确认说明，未猜测目标。
9. **无实质重复文件**：内容哈希未发现相同文档；只有 4 个空 `.gitkeep` 内容相同。
10. **有意的过程重复**：Messi × Yamal 主记录与共享 Prompt 都保存冻结实验包，另有两个候选文件。这符合“长候选可以拆附件”的规则，但附件不应进入默认读取，也不应成为平行状态源。

### 5.2 推测问题 / 需要确认

1. **AI 是否每次真的全量扫描**取决于调用方式和工具实现；目录混乱会提高误扫概率，但不能仅凭文件数证明每次都读了全部 980 KiB Markdown。
2. **哪些旧制作方案已暂停或淘汰**不能只看日期判断；没有 `content_stage` 和周报回链的文件需要 Pengman 确认。
3. **旧根工作流与通用运营框架能否合并**需要逐段人工确认，它们不是完全重复文件。
4. **模型实验 Prompt 能否删除**取决于是否还需要复现实验；当前更稳妥的是移入同一内容的附件区，而不是删除。
5. **CSV 旧快照是否必须保留**取决于审计需求；它们体积很小，删除对仓库几乎没有收益。

## 6. README、链接和规则入口审查

### 6.1 路径引用风险

下表是 `inbox-pengman` 中包含对应路径字符串的文件数，不是链接出现次数：

| 路径 | 引用文件数 | 迁移风险 |
|---|---:|---|
| `05-weekly-published-content-digests` | 50 | 高 |
| `06-daily-content-recommendations` | 49 | 高 |
| `00-evergreen-workflows` | 43 | 高 |
| `01-strategy-and-platform-research` | 26 | 中高 |
| `03-reference-accounts` | 23 | 高；还写在 `AGENTS.md` 中 |
| `07-gsc-exports` | 12 | 中 |
| `02-video-and-visual-tool-research` | 9 | 中 |
| 根旧工作流文件 | 9 | 中 |
| `04-text-and-social-tool-research` | 5 | 低 |

因此第一阶段不建议为了中文目录名而重命名 `00/05/06/07` 四个高引用核心目录。先通过 README 和迁出调研目录获得大部分收益，路径改名可作为单独二期。

### 6.2 唯一事实来源收敛

| 规则 / 数据 | 唯一或主要来源 | 需要降权的重复 |
|---|---|---|
| 当前内容状态与最终稿 | 单条主生产记录 | 候选、共享 Prompt、README 只回链 |
| 发布链接、周数据、`decision / next_test` | 对应 weekly digest | 生产记录不维护第二套周级数据 |
| 公共表达、品牌安全、CTA | `astrologywiki-social-workflow/SKILL.md` | Daily SOP、旧工作流不再复制文风 |
| 账号定位与形式路由 | `AstrologyWiki 社媒账号定位与内容路由 Playbook.md` | 策略总览只解释背景 |
| 选题输入、站内承接、去重 | Daily SOP + Skill 强制执行边界 | Daily SOP 的旧可复用 Prompt 后续删除或改为链接 |
| 双模型实验、人工反馈、L1–L5 | `Pengman 与 AI 内容润色协作说明.md` | Skill 只保留边界，生产模板只定义字段 |
| 竞品数据 | 在线 Google Sheet | 本地 CSV 与研究稿只作历史证据 |
| GSC | 暂停，不设当前事实来源 | 不读取、不索取、不因缺失阻塞；历史记录不回写 |

## 7. `04-production` 的建议范围

### 应保留

- 正在制作、待发布、已发布和等待复盘的单条内容；
- 单条内容主生产记录、脚本、视觉方案、制作记录和必要实验附件；
- 当前周报、发布链接、公开数据和 `decision / next_test`；
- 统一 Brief、生产记录模板、人工润色协作、已验证制作 SOP；
- Social Daily Skill 与四账号内容路由 Playbook；
- 当前生产直接使用的公开 AstrologyWiki 页面、SEO 主题参考和业务优先级入口。

### 应迁出或降权

- 平台与账号策略研究，四账号生产 Playbook 除外；
- 视频、图片、动画、文本和搜索工具调研；
- 竞品账号和视频研究、本地表格旧快照；
- 已完成的早期平台调研；
- 根旧工作流和通用运营框架等背景/方法论文档；
- 账号养号与启动流程，它属于账号运营而非单条内容生产；
- 已合并旧稿和候选附件保留，但默认不读。

## 8. 逐目录建议

| 当前目录 / 文件 | 主要内容 | 建议 | 建议位置 | 理由 | 迁移风险 | 需要修复的链接 |
|---|---|---|---|---|---|---|
| `README.md` | 工作区入口 | 保留并已优化 | 原位 | 作为人和 AI 的唯一总入口 | 低 | 已补任务路由、默认不扫描和 SSOT |
| 根 `astrologywiki-social-content-workflow.md` | 早期端到端流程 | 归档，不直接合并 | `02-调研资料/历史流程/` | 已被根 README 定义为历史背景 | 中 | 9 个引用文件；迁移时加旧路径映射 |
| `00-evergreen-workflows/` | SOP、模板、Skill | 保留 | 原路径，第一阶段不改名 | 43 个引用文件，直接控制生产 | 高 | README、AGENTS、主生产记录和 current-context |
| `00/.../social-account-warmup-and-launch-workflow.md` | 账号启动/养号 | 迁移 | `07-account-assets/账号运营SOP/` | 不属于单条内容生产 | 中 | 00 README 及可能的任务文档 |
| `00/.../daily-content-assistant-sop.md` | 输入、站内承接、去重、旧 Prompt | 合并/降权 | 仍在 `00`；删去已被 Skill 替代的 Prompt 前需确认 | 决策逻辑仍有用，但执行说明重复 | 高 | Skill、README、AGENTS |
| `01.../AstrologyWiki 社媒账号定位与内容路由 Playbook.md` | 四账号路由 | 保留并迁入 SOP | `00-evergreen-workflows/` | 生产时直接调用的唯一账号路由 | 高 | Skill、路由说明、制作记录 |
| `01.../content-direction-and-tools-research.md` | 平台/工具综合研究 | 迁移 | `02-调研资料/平台与策略/` | 决策证据，不是当前生产状态 | 中 | 04 README、鱼骨图、任务文档 |
| `01.../social-seo-content-operations-framework.md` | 通用端到端运营框架 | 迁移并降权 | `02-调研资料/方法论/` | `status: draft`，与现行 Skill/SOP 重叠 | 中高 | 26 个路径引用集合中的一部分 |
| `01.../social-seo-fishbone-map.md` | 总流程索引 | 合并后归档 | 根 README 已承担当前路由；原文移 `02-调研资料/历史流程/` | 避免两个总入口 | 中 | 04 README、周报 README、任务文档 |
| `01.../历史调研资料/` | 早期平台研究 | 迁移/归档 | `02-调研资料/历史调研/` | 仅用于追溯 | 中 | current-context、旧 workflow；1 个失效链接已处理 |
| `02-video-and-visual-tool-research/` | 视频/视觉工具调研 | 整体迁移 | `02-调研资料/工具调研/视频与视觉/` | 工具证据不应占生产入口 | 中 | 9 个引用文件 |
| `03-reference-accounts/` | 竞品研究与旧快照 | 整体迁移 | `02-调研资料/竞品研究/` | 在线 Sheet 才是事实源 | 高 | 23 个引用文件，含 `AGENTS.md` 和 Skill |
| `03.../sheets-export/` | 2026-07-07 左右旧 CSV | 归档，不参与生成 | `02-调研资料/竞品研究/旧快照/2026-07-07/` | 仅 22.2 KiB；保留追溯比删除更稳妥 | 中 | README 需明确停用；无直接 wikilink |
| `04-text-and-social-tool-research/` | 文本/X/搜索工具研究 | 整体迁移 | `02-调研资料/工具调研/文字与社媒/` | 与 02 同类 | 低 | 5 个引用文件 |
| `05-weekly-published-content-digests/` | 发布、数据、复盘 | 保留 | 原路径，第一阶段不改名 | 发布事实来源 | 高 | 50 个引用文件 |
| `06-daily-content-recommendations/` | 历史日级候选；当前周一候选/Hot/重排证据 | 保留但再次收窄 | 原路径 | 不作为普通日执行入口，不维护单条状态 | 高，已完成 | 现行规则以 Weekly Rolling SOP 为准 |
| `06.../已合并旧稿/` | 已合并的日级过程稿 | 保留但默认不读 | 原路径 | 仍有来源追溯价值，且与日级内容包同类 | 低 | README 已收口 |
| `07-content-production/` | 单条 Brief、脚本、制作方案、主生产记录和实验附件 | 新建并已迁入 | 当前路径 | 被选中内容需要独立于每日候选继续流转 | 高，已完成 C1 | 周报、SOP、AGENTS、主题入口和内部互链已更新 |
| Messi × Yamal Prompt/候选 | 双模型过程附件 | 随主记录迁移，不删 | `07-content-production/`，由 README 降权 | 候选不重复维护状态 | 中，已完成 | 主记录中的 3 个附件引用已更新 |
| `07-gsc-exports/` | 已删除的 GSC 数据入口 | 不恢复；暂停 | 无 | Pengman 已确认暂不看 GSC；当前规则已移除路径依赖 | 低 | 当前入口已修复；历史引用保留 |
| `.DS_Store` | macOS 元数据 | 本地清理可选，不进 Git | 不保留 | 已正确忽略，对仓库无影响 | 低 | 无 |
| 4 个 `.gitkeep` | 空目录占位 | 删除前确认 | 目录已有真实文件时不需要 | 只减少文件数，不减体积 | 低 | 无 |

## 9. 推荐目标结构

### 9.1 第一阶段：最小路径扰动，推荐先做

```text
inbox-pengman/
├── 04-production/
│   ├── README.md
│   ├── 00-evergreen-workflows/              # 生产 SOP、模板、Skill、四账号 Playbook
│   ├── 05-weekly-published-content-digests/  # 发布与复盘
│   ├── 06-daily-content-recommendations/     # 周一候选、Hot/重排证据；日级旧稿为历史
│   │   ├── README.md
│   │   └── 已合并旧稿/                      # 只放日级过程稿
│   └── 07-content-production/               # 被选中后的单条内容生产
│       ├── README.md                        # 当前队列与状态索引
│       └── 已合并旧稿/                      # 只放生产过程稿
├── 02-调研资料/
│   ├── README.md
│   ├── 平台与策略/
│   ├── 方法论/
│   ├── 工具调研/
│   │   ├── 视频与视觉/
│   │   └── 文字与社媒/
│   ├── 竞品研究/
│   │   └── 旧快照/
│   │       └── 2026-07-07/
│   ├── 历史调研/
│   └── 历史流程/
└── 07-account-assets/
    └── 账号运营SOP/
```

当前保留 `00/05/06/07-content-production`：`06` 只回答“今天考虑做什么”，`07` 回答“选中后如何制作和当前做到哪一步”。GSC 入口不恢复；历史生产记录仍保留原始证据说明。

### 9.2 单条内容的文件粒度

- 普通内容：一份主生产记录，保持扁平。
- 当一条内容出现 3 个以上附件，才建立以人能识别的主题子目录；主记录仍是入口。
- 候选、共享 Prompt、素材清单只放附件区，不维护 `content_stage`、发布数据或最终决策。
- 不按每个日期机械建立空目录，避免目录数量反向膨胀。

## 10. 人工与 AI 阅读规则

### 状态区分

| 状态 | 判断方式 | README 展示 | AI 默认行为 |
|---|---|---|---|
| 当前使用 | `content_stage` 为 Brief/初稿/等待润色/待制作 | 当前制作 | 读取主记录 |
| 待确认 | 缺 `content_stage`，或旧自定义 `status` | 状态待确认 | 不自动推进 |
| 待发布 | `content_stage: 待发布`，可有排期但未回填 permalink | 待发布 | 核对是否实际发布 |
| 已发布 | 有平台 permalink，`content_stage: published` | 已发布 / 等待复盘 | 读取对应周报 |
| 历史归档 | 已复盘、已合并或明确只供追溯 | 历史生产记录 | 默认不读 |
| 已废弃 | 明确 `暂停` 或已复盘 `decision: 淘汰` | 已废弃/暂停及原因 | 不删除；用户要求时追溯 |

### AI 最小读取路径

实际任务路由已写入 [[inbox-pengman/04-production/README.md]]。默认每次只读入口 README 和 3–6 个任务相关文件；历史调研、旧快照、已合并旧稿、关闭周报和模型候选附件不进入默认上下文。

## 11. 预计优化效果

### 11.1 仅迁移，不删除

建议第一阶段迁出 27 个已跟踪文件：策略/调研/工具/竞品/旧工作流 26 个，加账号养号 SOP 1 个。

| 指标 | 当前基线 | 第一阶段目标 | 变化 |
|---|---:|---:|---:|
| `04-production` 已跟踪文件 | 82 | 约 55 | 减少约 33% |
| `04-production` 已跟踪体积 | 1,026,525 B / 1002.5 KiB | 约 719,730 B / 702.9 KiB | 减少约 30% |
| 整个 Git 仓库体积 | 不变 | 基本不变 | 文件只是移到 `02-调研资料` |
| 默认 AI 候选文件 | 74 个 Markdown | 通常 4–8 个 | 按任务减少约 89%–95% |
| 默认上下文文本量 | 最坏接近 980 KiB | 通常约 50–150 KiB | 预计减少约 85%–95%，取决于任务 |

以上 AI 阅读收益来自入口和默认排除规则，不代表工具层保证；执行时仍要遵循 README 路由。

### 11.2 若以后获批删除

- 删除 4 个已忽略 `.DS_Store`：只减少本机约 28.0 KiB，不影响 Git。
- 删除 4 个多余 `.gitkeep`：减少 4 个文件，体积几乎不变。
- 删除旧 CSV：最多减少约 22.2 KiB，但会失去历史快照；不建议仅为瘦身删除。
- 删除或合并模型实验附件：最多减少约 31 KiB，但会损失可复现实验和原始候选；当前不建议。

## 12. 本轮已完成的低风险调整

1. 更新 `04-production/README.md`：改成四个主入口、任务路由、AI 最小读取路径、唯一事实来源和默认不扫描清单。
2. 已更新 `06-daily-content-recommendations/README.md`：当前只保留周一候选、Hot/重排证据入口；普通日执行改读当前周计划，制作队列仍在 `07-content-production/README.md`。
3. 更新 `00-evergreen-workflows/README.md`：标明各 SOP 的调用条件，明确 Skill 与 Daily SOP 的分工。
4. 更新 `01-strategy-and-platform-research/README.md`：补上四账号 Playbook，并标明其余研究不是每日生产入口。
5. 更新 `inbox-pengman/README.md`：把 04 的口径收窄为生产闭环，标明研究目录待迁移且默认不扫描。
6. 处理历史文档中的 1 个失效 wikilink：保留原目标名和待确认说明，不猜测替换。
7. 更新本提案：补齐实测数据、Git 判断、目录清单、链接风险、目标结构和迁移批次。

## 13. 需要 Pengman 确认后才能执行的清单

### A. 推荐先确认：低路径风险迁出

- [x] 建立 `02-调研资料/` 及唯一 README。
- [x] 整体迁移 `02-video-and-visual-tool-research/`。
- [x] 整体迁移 `04-text-and-social-tool-research/`。
- [x] 迁移 `01/.../历史调研资料/`、`content-direction-and-tools-research.md`、通用框架和鱼骨图。
- [x] 将根旧工作流移到 `02-调研资料/历史流程/`，不合并正文。

### B. 需同步改规则：竞品目录

- [x] 把 `03-reference-accounts/` 迁到 `02-调研资料/竞品研究/`。
- [x] 同批更新 `inbox-pengman/AGENTS.md`、Social Daily Skill、Daily SOP、Playbook 和所有 wikilink。
- [x] 将 `sheets-export` 明确命名为 `旧快照/2026-07-07/`；本轮决定保留，不删除。

### C. 高引用生产路径：建议二期

- [ ] 将四账号 Playbook 移入 `00-evergreen-workflows/`。
- [x] 将 `06` 的每日候选与单条制作拆分；单条生产统一进入 `07-content-production/`。
- [ ] 是否进一步在 `07` 下按状态建立物理子目录；当前优先用 README 队列，避免移动状态不明文件。
- [ ] 对没有 `content_stage` 的旧制作方案逐条确认：继续、暂停、已发布或历史。
- [ ] 决定是否把 3 个以上附件的内容改成主题子目录。
- [ ] 决定 Daily SOP 是否删除旧可复用 Prompt，仅保留输入与选择逻辑。

### D. 删除、合并和根配置

- [ ] 是否删除 4 个多余 `.gitkeep`。
- [ ] 是否清理本机 `.DS_Store`；它们未进入 Git。
- [ ] 是否保留 4 个旧 CSV 快照。
- [ ] 是否逐段合并旧根工作流、通用框架和鱼骨图；未经确认只归档，不合并。
- [ ] 是否在未来引入媒体后调整根 `.gitignore`；本轮不改。

## 14. 建议执行顺序与验证门

1. A 批次已完成；验证 `02-调研资料/README.md`、路径映射、wikilink 和硬编码路径。
2. B 批次已完成；`AGENTS.md`、Skill、Daily SOP、Playbook 和路径引用已同步更新。
3. C1 已完成；下一步若继续 C 批次，先逐条确认旧制作方案状态，再决定是否建立物理状态子目录。
4. 每批迁移独立验证 README 能从根入口到达全部当前文件；默认扫描清单不再包含研究和历史目录。
5. 最后才讨论删除、正文合并或根 `.gitignore`。

## 15. 验收标准

- 从 `04-production/README.md` 最多两次点击可以到达每日选题、当前制作、当前周报和生产 SOP。
- AI 执行日更、润色、制作或复盘时都有明确最小读取集合，不需要 `rg --files` 全目录遍历。
- 每条当前内容只有一份主生产记录；候选和 Prompt 不维护第二套状态。
- `status` 和 `content_stage` 不再混用；旧文件缺状态时明确标为待确认。
- 全部 wikilink 和本地路径通过检查；`AGENTS.md`、Skill、README 与实际目录一致。
- Git 中没有视频、临时帧、缓存、模型输出或未说明的本地导出。
- 迁移前后仓库文件总数/体积变化与“移动不等于减小 Git”判断一致。
