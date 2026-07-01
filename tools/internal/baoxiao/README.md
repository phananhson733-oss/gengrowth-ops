# baoxiao —— 报销流程自动化(v2.5)

内部工具:Lynne 邮箱收发票 → 自动拉附件 → 提取字段 → 命名归档进 git → wiki 月度账本自动追加 section → Lynne 在 Obsidian 点 task / 改类型 → 文件名 / dashboard 自动同步。

单一事实源 = git 仓库;无飞书表依赖。

## 状态(2026-06-02 v2.5)

14 模块 + 4 个 launchd plist(daily / monthly / watch / drop),**146 单测全绿**。已在 Lynne Gmail 账户跑通近 3 个月历史回填(11 张真发票),wzb 微信凭证补录 4 张 Anthropic SaaS。

**v2.5 核心变化**(详见底部 changelog):
- 文档归档逻辑:**提交月 / 结清月**(弃用开票月,文件夹跟着 row 走)
- 新字段:`invoice_type`(domestic/overseas)、`billed_to`(发票对象)、`settled_date`(结清时间)
- Dashboard 拆「📒 可报销 / 💼 备用金」按抬头 + 币种分组
- watch 自动填 settled_date(Lynne 在 Obsidian 点 [x] → 2s 内自动 `✓ 结清:YYYY-MM-DD HH:MM`)
- 跨月 carry A 方案:row + 文件都 mv 到下月
- 跨月跨人**总表** `报销/总表.md`(已结清/未结清 两表,主键 = 发票编号)
- id8 隐藏到 HTML 注释,H3 只显示 description(`### 仟佳食品 餐饮 员工`)
- `_drop/{人}/` 投递区(非邮件渠道发票拖进来,launchd 每分钟扫描搬到 `_inbox`)
- 批量 `cli.py settle --month --reimburser --ids ... | --all`
- `WATCH_ONLY=1 bash install.sh`(Lynne 本机只装 watch + drop,Mac Mini 独占 daily/monthly)

```bash
cd tools/internal/baoxiao && python3 -m unittest discover -s tests
```

## 自动化范围

| 步骤 | 自动 / 手动 |
|---|---|
| Gmail IMAP 拉附件 | 🤖 launchd daily 19:00 |
| 提取字段 / 分类 / 归档 / 写账本 | 🤖 `cli.py ingest` |
| 审批 + 打款合并为单一「已结清」task | 👤 Lynne 在 Obsidian 点 `- [ ]` toggle |
| 拿不准的「分类已确认」task | 👤 Lynne 看完点 ✓ → dashboard ⚠️ 消失 |
| 改类型字段 | 👤 改 `📂 类型:X` 行 + 🤖 watch ~1s 自动 rename 文件 + 同步 dashboard |
| 月末本月汇总(呈现给员工查验/结清,**不结转**) | 🤖 launchd month-end 最后一天 23:30 → `cli.py month-end` |
| 月初结转上月未结清 + 开新月 | 🤖 launchd month-start 每月 1 号 09:00 → `cli.py month-start` |

## 整体流程

```
  Gmail 邮箱(+ .ai 邮箱转发)
     │
     ▼  ① launchd daily 19:00  → fetch-mail
  _inbox/Lynne/*.pdf
     │
     ▼  ② cli.py ingest --fields-file ...
  docs/.../finance-payments/发票/{开票月}/{报销人}/{文件名}.{ext}
     │
     ▼  ③ 账本自动 append 一个 section(per-reimburser)
  docs/.../报销/{开票月 YYYY-MM}/{报销人}.md
     │
     ▼  ④ Lynne / wzb 在 Obsidian
        - 点 `- [ ] 已结清` → ✅
        - 改 `📂 类型:研发费用` → 福利费
     │
     ▼  ⑤ launchd watch StartInterval=2(每 2s 轮询,幂等)
        - dashboard 状态 + 类型同步
        - 文件名自动 rename(category 变化时)
     │
     ▼  ⑥ launchd month-end 23:30(月最后一天) → 刷新各人 dashboard + 跨月总表(本月汇总,不结转)
     │
     ▼  ⑦ launchd month-start 09:00(下月 1 号) → 上月未结清 carry-forward + 开新月
```

## 配置

`~/.config/gengrowth-baoxiao/.env`(chmod 600):

```env
GMAIL_USER=wl.ecwhu@gmail.com
GMAIL_APP_PASSWORD=xxxxxxxxxxxxxxxx          # 16 位应用专用密码,不是登录密码
# GMAIL_HOST=imap.gmail.com
# GMAIL_SUBJECT_KEYWORDS=发票,invoice,receipt
# OPENAI_API_KEY=sk-...                       # gpt 视觉路才需要
```

## CLI 子命令

```bash
cd tools/internal/baoxiao

python3 cli.py fetch-mail --filter-subject               # 拉新邮件 → _inbox/Lynne/
python3 cli.py list-inbox                                # 列待处理(JSON)
python3 cli.py plan --fields-file <fields.json>           # 干跑预览
python3 cli.py ingest --fields-file <fields.json>         # 归档 + 写账本
python3 cli.py ingest --provider gpt                      # unattended GPT 视觉路
python3 cli.py refresh-dashboard [--month 2026-05]        # 重生 dashboard + 同步文件名
python3 cli.py monthly-close [--month 2026-05]            # carry-forward + summary
```

## 部署到新机器(Mac Mini 等)

**部署策略**:**单台机器跑 launchd**(避免双拉邮件 / git 写冲突),其他机器只保留代码方便手动跑。推荐**永远开机的机器**(如 Mac Mini)跑 launchd,**笔记本**(Pro)关 launchd 只手动跑。

**Mac Mini 上 5 步部署**(假设 wiki 仓库已 `git clone` 到 `~/gengrowth-wiki`,跟 Pro 同一个 remote):

```bash
# 1. cd 到 baoxiao 目录 + 装唯一第三方依赖 PyYAML(config.py 读 yaml 配置需要)
cd ~/gengrowth-wiki/tools/internal/baoxiao
/usr/bin/python3 -m pip install --user PyYAML   # 系统 python3.9 自带 pip;launchd 用的就是 /usr/bin/python3

# 2. 装 .env(从 Pro 上 ~/.config/gengrowth-baoxiao/.env 拷过来,chmod 600 保证不泄密)
mkdir -p ~/.config/gengrowth-baoxiao
# 把 .env 内容粘贴进去 → 用 nano / vim 编辑
nano ~/.config/gengrowth-baoxiao/.env
chmod 600 ~/.config/gengrowth-baoxiao/.env
# 内容形如:
#   GMAIL_USER=wl.ecwhu@gmail.com
#   GMAIL_APP_PASSWORD=xxxxxxxxxxxxxxxx
#   GMAIL_USER_2=xdawayer@gmail.com
#   GMAIL_APP_PASSWORD_2=xxxxxxxxxxxxxxxx

# 3. 跑 130+ 单测确认环境 OK
python3 -m unittest discover -s tests

# 4. 装 launchd(3 个 plist:daily 19:00 / monthly 23:30 / watch 2s)
bash launchd/install.sh

# 5. 验证 + 看下次触发
launchctl list | grep baoxiao
tail -f logs/launchd-daily.log    # 等 19:00 自动跑 / 或手动跑 python3 cli.py fetch-mail --filter-subject 测试
```

**Pro 上**(已经 uninstall 过,不用动):
```bash
bash launchd/install.sh uninstall   # 如果以后想重新关
```

**git 自动同步**:Mac Mini 跑 ingest → Obsidian Git Plugin auto-commit + push → Pro `git pull` 看到。建议 Mac Mini 上 Obsidian Git Plugin 也开,或者加个 cron `*/10 * * * * cd ~/gengrowth-wiki && git pull --rebase --autostash`(每 10 分钟拉)防止 Pro 那边手动 push 后 Mac Mini 不知道。

**Mac Mini 切换的优势**:
- 永远在线,launchd 永不漏拉(Pro 关盖 / 睡眠 / 重启都会漏触发)
- watch StartInterval=2 持续跑,Lynne / wzb 在 Pro 改 ledger → git push → Mac Mini git pull(下次定时拉)→ watch 同步 dashboard

## launchd 5 个 plist

```bash
bash launchd/install.sh                # 装 5 个 plist
bash launchd/install.sh uninstall      # 卸载
launchctl list | grep baoxiao
tail -f logs/launchd-{daily,watch,month-end,month-start}.log
```

| Label | 触发 | 干什么 |
|---|---|---|
| `com.gengrowth.baoxiao-daily` | 每天 19:00 | `fetch-mail --filter-subject` |
| `com.gengrowth.baoxiao-watch` | `StartInterval=2`,每 2 秒轮询 | `refresh-dashboard`:同步 dashboard + 自动填 settled_date + 刷总表(全部幂等不变不写盘) |
| `com.gengrowth.baoxiao-month-end` | 每天 23:30 | wrapper 判断本月最后一天 → `month-end`(本月汇总,**不结转**) |
| `com.gengrowth.baoxiao-month-start` | 每天 09:00 | wrapper 判断每月 1 号 → `month-start`(结转上月未结清 + 开新月) |
| `com.gengrowth.baoxiao-drop` | `StartInterval=60`,每分钟 | `drop-scan`:扫 `_drop/{人}/` 搬到 `_inbox/{人}/`(非邮件渠道发票投递) |

> **v2.5.10 两段式月度流程**:月末(`month-end`)只做本月汇总呈现给员工查验/结清,**不结转、不建下月**;下月第一天(`month-start`)等上月所有结清结束后,才把仍未结清的 carry 到本月并开启新月。这样员工有完整的「最后一天」窗口结清,结转集合到月初才冻结,下月文件夹不提前出现。
>
> **本机未装 launchd 时手动跑**:月末 `python3 cli.py month-end`,月初 `python3 cli.py month-start`(默认 close 上月)。误结转可用 `python3 cli.py uncarry --month YYYY-MM`(默认 dry-run 预览,加 `--apply` 真撤回:文件移回上月、撤 ↗ 标记、删下月 row)。旧的一次性 `monthly-close` 仍保留向后兼容。

> v2.4 起 watch 从 `WatchPaths` 改成 `StartInterval=2` 轮询 —— 因为新结构 `报销/{月}/{人}.md` 是子目录,launchd `WatchPaths` 不监控子目录里的文件编辑,会丢事件。轮询 + 幂等(`_refresh_dashboard` 内容不变不写盘)能保证 ~2s 同步且无副作用。

**plist EnvironmentVariables 设了 `LANG=en_US.UTF-8` / `LC_ALL=en_US.UTF-8` / `PYTHONIOENCODING=utf-8`** —— 解决 launchd 子进程默认 encoding 不是 UTF-8 导致中文文件名截断的问题(2026-06-01 修复)。

## 账本 schema(section + Obsidian task + 底部 dashboard)

`docs/05-governance/finance-payments/报销/{开票月 YYYY-MM}/{报销人}.md`(v2.4 起每人一份):

```markdown
---
title: 报销账本 — 2026-05
month: 2026-05
type: 报销
---

# 报销账本 — 2026-05

[intro 文字]

### `4de6d849` Pockyt App Store iTunes US Gift Card($20)美区充值
$19.96 · 📎 [202605-研发费用-$19.96.pdf](/docs/.../202605-研发费用-$19.96.pdf) · 发票号 `0511...` · 报销人 Lynne · 提交 2026-06-01 15:00
- [ ] 已结清
- [ ] 分类已确认
📂 类型:研发费用

> ⚠️ 待核 / ↗ 延至 2026-06 / ← 自 2026-04 等 marker(blockquote,可选)

### `b82db58b` ...
...

<!-- DASHBOARD_START -->

## 📊 本月汇总

| 币种 | 总额 | ✅ 已结清 | ⬜ 待结清 |
|---|---:|---:|---:|
| ¥ CNY | 409.48 | 0 | 409.48 |
| $ USD | 547.42 | 547.42 | 0 |

## 📒 全部发票

| ID | 描述 | 类型 | 金额 | 状态 | 备注 |
|---|---|---|---|---|---|
| `4de6d849` | ⚠️ Pockyt App Store iTunes US Gift Card($20)美区充值 | 研发费用 | $19.96 | ⬜ |  |
...

<!-- DASHBOARD_END -->
```

### section 各部分

| 位置 | 内容 |
|---|---|
| H3 标题 | `` `{id8}` {description} ``(id8 是 sha256 前 8 位,description 是商家+用途) |
| metadata 行 | `金额 · 文件链接 · 发票号 · 报销人 · 提交时间`(**不含类型**) |
| `- [ ] 已结清` | 单一 task —— 审批 + 打款合并(审批通过即触发对公转账) |
| `- [ ] 分类已确认` | 仅 `needs_review=True` 时渲染(边界场景);Lynne 点 ✓ → dashboard 描述列 ⚠️ 消失 |
| `📂 类型:X` | **类型独立一行**,扫一眼找到;改这行即触发 watch → 自动 rename 文件 + 同步 dashboard |
| `> note` | 可选 blockquote,装 `⚠️ 待核 / ↗ 延至 / ← 自` 等 marker |

### Dashboard(底部)

- 顶部块:**月度汇总**按币种分组(总额 / 已结清 / 待结清),不同币种**不互通**
- 下方块:全量发票表格(ID / 描述 / 类型 / 金额 / 状态 / 备注)
- ⚠️ 前缀加在描述列,`needs_review=True` 且未点「分类已确认」的行才有

## 文件命名(对齐 task doc)

`{开票月}-{报销类目}-{币种符号}{金额}[-{发票号末4位}].{ext}`

例:`202605-研发费用-$19.96.pdf` / `202603-福利费-¥268.9.pdf`

- 发票文件路径:`<wiki>/docs/05-governance/finance-payments/发票/{开票月}/{报销人}/<文件名>`
- 撞名(同期同类同额)用发票号末 4 位区分(Ahrefs Invoice + Receipt 同 $129 → 后者加 `-1096`)
- **改类型字段时,watch 自动 rename**(只在通过容错防御时才动)

## Receipt skip 规则(财务硬规则)

**Receipt(付款收据)不能作报销凭证,只 invoice/发票才能入账**。

| 凭证 | 用途 | 入账? |
|---|---|---|
| Invoice / 发票 / 增值税普通/专用发票 | 报销 / 抵税 / 入账 | ✅ 是 |
| Receipt / 付款收据 / Payment confirmation | 证明已付款,**不能**报销 | ❌ skip |

实现:`extract.InvoiceFields.is_receipt: bool` 字段。ingest 时:
- `is_receipt=True` → 移到 `_inbox/_conflict/skipped-receipts/`,不归档不入账,Outcome `status="skipped"`
- `is_receipt=False`(默认)→ 正常 ingest

cowork JSON / GPT 视觉提取看到 `Receipt #` / `Paid {date}` / `Payment confirmation` 等关键词 → 标 `is_receipt=true`。

## invoice_type 识别规则(v2.5.6)

| 发票主标题文字 | invoice_type | 备注 |
|---|---|---|
| 「电子发票(普通发票)」/「增值税普通发票」 | `普票` | 国内普通增值税发票,不可抵进项税 |
| 「电子发票(专用发票)」/「增值税专用发票」 | `专票` | 国内专用增值税发票,**可抵扣进项税** |
| 海外 Invoice / Bill to(英文) | `invoice` | 非中国税务,走备用金 |
| 抓不准 | `""` | 让 Lynne 在 Obsidian 手动改 |

`is_reimbursable` 规则:`invoice_type ∈ {普票, 专票}` AND `billed_to == 广州进格智能科技有限公司` → 可报销(进 dashboard 📒 块);其他 → 备用金(💼 块)。

cowork extractor 必须从 PDF/PNG 上**肉眼可见的发票标题**抓 `普通发票` / `专用发票` 字样,**不要靠猜**。仟佳食品 PNG / 沃尔玛 PDF / 柠檬茶 PDF 的发票主标题都明确写「电子发票(普通发票)」,直接读出即可。

## 容错防御(2026-06-01 加固)

`_canonical_filename_for` 计算新文件名时,以下场景**拒绝 rename**(留旧名):

| 防御 | 触发条件 |
|---|---|
| category 白名单 | `row.category` 不在 9 项(差旅/交通/业务招待/商务送礼/福利/研发/办公/营销/其他费用) |
| currency 白名单 | `row.currency` 不在 6 币种(CNY/USD/HKD/EUR/GBP/JPY) |
| period 格式 | 不是 6 位数字 |
| amount 范围 | ≤ 0 |
| **encoding 校验** | 新名不含完整 category 中文字符串(launchd LANG 没设导致中文丢字符的兜底) |
| 路径分隔符 / 长度 | 新名含 `/ \ \x00` 或长度 > 200 |
| OSError | rename 抛异常,log 到 stderr,不影响其他 row |

## 模块清单

| 模块 | 职责 |
|---|---|
| `identity.py` | content_sha256 + 发票号归一化 |
| `naming.py` | 期间 / 货币 / 金额 / 文件名构造(task doc 风格) |
| `archive.py` | content-hash dedup + 原子写 + 撞名 suffix |
| `classify.py` | hint → 9 项费用类型(fallback 其他费用) |
| `extract.py` | InvoiceFields(含 description / currency)+ cowork JSON 解析 + gpt 视觉 |
| `mailbox.py` | Gmail IMAP 增量拉附件 → _inbox/{报销人}/ |
| `ledger.py` | section + task + 底部 dashboard 读写;parse 兼容加粗 / 不加粗类型行 |
| `transfer.py` | carry-forward(B 方案账本迁移) |
| `summary.py` | 跨月总表 `write_total`;per-人 `write_summary` 已废弃(v2.5.10 费用类型分布并进 dashboard) |
| `sync.py` | inbox → 提取 → 分类 → 归档 → 写【开票月】账本 编排 |
| `cli.py` | list-inbox / plan / ingest / fetch-mail / refresh-dashboard / monthly-close |
| `config.py` | .env / yaml 读取 |
| `lock.py` | flock 防并发 |

## 路径速查

| 角色 | 位置 |
|---|---|
| 业务输入(git) | `config/category-map.yaml` / `config/reimbursers.yaml` |
| 凭证(仓库外 chmod 600) | `~/.config/gengrowth-baoxiao/.env` |
| 运行时(本目录 .gitignore) | `_inbox/` / `_conflict/` / `logs/` / `*.lock` |
| 发票存档(git) | `<wiki>/docs/05-governance/finance-payments/发票/{开票月}/{报销人}/*` |
| 账本(git) | `<wiki>/docs/05-governance/finance-payments/报销/{YYYY-MM}/{报销人}.md` |
| 费用类型分布 | 账本底部 dashboard 内(实时刷新,v2.5.10 起取代独立 `-summary.md`) |

## 崩溃恢复

| 崩在哪 | 重跑动作 |
|---|---|
| fetch-mail 网络断 | UID 未保存 → 下次重拉;archive 内容 dedup |
| 归档后、账本前 | archive 命中已归档 → 账本 append 新 section → 删 inbox |
| 账本 append 后、删 inbox 前 | archive 命中 + 账本 append=False(同 id8 已存在)→ 删 inbox(幂等) |
| watch fire 死循环 | `_refresh_dashboard` idempotent 写入(内容不变不写) + `_sync_filenames` 防御拒绝坏 rename |
| monthly-close 中崩 | 已标 ↗ 的源月 row 重跑跳过(skipped_already);下月已 append 的同 id8 不重复 |

## 历史 / 决策记录

- **v1 飞书表 sink → v2 wiki markdown 账本**:Lynne 不想填表;sink 收敛到 git 单一事实源
- **transfer 选 B(账本 carry-forward,文件不动)**:文件路径稳定反映开票月
- **IMAP + App Password 而非 OAuth**:长期有效,无 7 天 refresh token 过期
- **v2.1 账本按开票月 + 备注 + 币种 + 文件夹归位**:观感优化
- **v2.2 markdown 表格 → section + Obsidian task**:状态可点 toggle(原生 widget)
- **v2.3**:
  - 审批 / 打款 合并为单一「已结清」task(审批通过即触发对公转账)
  - 分类拿不准 → `- [ ] 分类已确认` task + dashboard 描述列 ⚠️ 前缀
  - Dashboard 移到**底部** + 加月度汇总(按币种)
  - 类型字段独立成 `📂 类型:X` 行(metadata 不再含)
  - 改类型 → launchd watch ~1s 自动 rename 文件 + 同步 dashboard
  - 容错防御加固(2026-06-01 修复 launchd encoding 截断问题)
- **v2.4**(2026-06-01):
  - 账本按报销人分账:`报销/{YYYY-MM}/{报销人}.md`(原来全月一份混着)
  - dashboard / monthly-close / summary 全部 per-reimburser
  - launchd watch:`WatchPaths` → `StartInterval=2`(子目录监控不可靠,改成 2 秒轮询 + 幂等)
  - 财务规则固化:**receipt(付款收据)不能作报销凭证**,extractor 标 `is_receipt=true` 的文件 ingest 时跳过(移到 `_inbox/_conflict/skipped-receipts/`),只 invoice 入账。Lynne 之前手动入的 Ahrefs Receipt 同步清掉
- **v2.5**(2026-06-02):
  - **归档逻辑改**:从「开票月」改成「提交月 / 结清月」(归集月)—— 文件夹跟着 row 走,会计视角(待处理 vs 已结清)而非凭证视角
  - **跨月 carry A 方案**:row + 物理文件都挪到下月(B 方案 → A 方案);transfer.relocate_file 通用 helper
  - **新字段**:`invoice_type`(domestic/overseas)、`billed_to`(发票对象)、`settled_date`(结清时间)、`invoice_date`(开票日期,仅元数据)
  - **Dashboard 重构**:拆「📒 可报销(gengrowth 抬头国内发票)」+「💼 备用金(海外 invoice / 个人抬头)」两块,按「抬头 × 币种」聚合。表格表头 ID 列改用 invoice_number(不再 id8)
  - **id8 隐藏**:从 H3 标题挪到 HTML 注释 `<!-- id8: xxx -->`(Obsidian Live Preview 不渲染),H3 只 `### {description}`
  - **settled_date 自动写**:watch 检测 `- [x] 已结清` 但 settled_date='' → 自动填当前时间(分钟精度)。section 渲染 `✓ 结清:YYYY-MM-DD HH:MM` 一行
  - **批量 settle CLI**:`python3 cli.py settle --month --reimburser --ids ... | --all`(替代 Obsidian 一张张点)
  - **跨月跨人总表**:`报销/总表.md` 拆「✅ 已结清」+「⬜ 未结清」两表,主键 = 发票编号。已结清表多「报销打款时间」列。watch 一并刷新(幂等)
  - **投递区 + drop-scan**:`docs/.../finance-payments/_drop/{Lynne|wzb}/` 拖发票 → launchd 每分钟扫 → 搬到 `_inbox/{人}/` 等 cowork ingest
  - **WATCH_ONLY 模式**:`WATCH_ONLY=1 bash launchd/install.sh` 只装 watch + drop(Lynne 本机用,Mac Mini 独占 daily/monthly 避免双拉)
  - 6 个现有账本物理迁移到 v2.5 新格式
