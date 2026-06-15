---
type:
status: draft
owner: Pico
created:
---

## 目前已发现问题

1. Chrome 浏览器 切换成中文浏览的时候会有部分中文乱码
![[截屏2026-06-10 23.46.38.png]]

2. 无法保存星盘？
![[截屏2026-06-11 00.31.44.png]]

3. 从百科--文章点进作者会自动切到英文界面（from zh to en) 
![[截屏2026-06-11 01.08.20.png]]
![[截屏2026-06-11 01.08.25.png]]

4. 合盘的growth focus以下的内容都会显示: ai report unavailable
![[截屏2026-06-11 01.26.38.png]]

5. 部分内容切换成中文后还是没有翻译
   ![[截屏2026-06-11 01.30.31.png]]

6. 日记无法生成后续分析
![[Pasted image 20260612171033.png]]
## 个人体验流程
1. 进入 wiki
2. 看到try free birth chart 进行登陆，体验
3. 阅读本命盘解析
4. 查看行运盘
5. 查看合盘（暂时没找到能合盘的人所以没有进行下去，这个我理解其中一个用处从产品的角度可以鼓励用户进行分享以帮助推广）（虽然我后面又找到人来合盘了）
6. 体验星象问答
7. 体验CBT日记
8. 百科
	   个人看到页面上的精选文章有些看不懂（缺乏部分占星学知识）
	   点击了《读懂太阳回归盘这一年的主题线索》这一篇文章
	   点击作者Marcus Orion 意外发现了 《How to Read Your Birth Chart》文章 补充了一些星座知识

## 产品理解

- **本命盘是核心激活点**：免费排盘把公开访客转化为注册用户，也是后续行运、问答、日记和合盘的基础。
- **行运承担回访价值**：本命盘相对固定，行运随时间变化，更适合促成每日或周期性访问。
- **问答降低理解门槛**：用户不必掌握复杂术语，可以直接从现实问题出发。
- **CBT 日记负责长期留存**：它将“阅读结果”转化为持续记录和自我反思。
- **Wiki 同时承担 SEO 获客和用户教育**：文章既能从搜索引擎带来访客，也能帮助新用户理解盘面。

可以考虑一下合盘功能如何拉新。。。？
可以考虑在Wiki内容添加

---

## 🔧 工程分诊 / Backlog

> 来源：Claude Code 代码调查 + Codex 独立核查交叉验证，2026-06-15。仓库 oracle（`/Users/wzb/Code/oracle`），`文件:行号` 基于当日代码。以下为可落地任务，**尚未动代码**。Codex 纠正了初判 3 处（见 AW-3 / AW-4 / AW-7）。

### 总览

| ID | 优先级 | 问题 | 状态 |
|----|--------|------|------|
| AW-1 | ✅ 已修 | 保存星盘失败 | 06-13 已补建 `saved_readings` 表 |
| AW-2 | **P0** | CBT 日记"无法完成分析" | 待修（危机短路被误报成 AI 失败） |
| AW-3 | **P1** | 合盘正文不翻译 | 待修（AI 输出语言不校验） |
| AW-4 | **P1** | 合盘 Growth Focus 失败 | 待修（prompt 上下文不一致 + 无 schema 校验） |
| AW-5 | P2 | 作者页强制切英文 | 待修 |
| AW-6 | P3 | 保存接口日志薄弱 | 待修（主因已修，补可观测性） |
| AW-7 | P3 | 中文乱码 | 待实机确认（疑似字形缓存，非确定代码 bug） |
| **AW-X** | **P1 横切** | AI 响应契约层缺失 | 新增（一次根治 AW-2/3/4 + 防回归） |
| AW-P1 | 产品 | 合盘可分享摘要卡（拉新） | 待评估 |
| AW-P2 | 产品 | Wiki 内链强化 | 待评估 |

### AW-2 ·【P0】CBT 日记被误报"无法完成分析"

- **现象**：提交日记后显示"无法完成分析，请重试。"
- **根因**：后端 `backend/src/api/cbt.ts` 命中危机关键词时返回 `200 + {status:"crisis_detected", helpline, message_zh, message_en}`；前端 `services/cbt/deepseekService.ts:24` 只认 `result.content`，content 缺失即抛 "AI unavailable" → `CBTWizard` 误报。等于把"危机用户求助"误当系统故障。
- **附加风险**：危机检测把 `moods[].name` 也纳入关键词扫描，误伤面大于只扫日记正文（普通用户写"受不了了 / 想结束这一切"易误判）。
- **修复方向**：前端显式识别 `status === 'crisis_detected'` → 走危机提示 UI（显示 helpline）；或后端统一包成 `{lang, content:{kind:'crisis',...}}`。禁止 200 成功响应落到 `!content` 分支。
- **验收**：触发危机词→显示求助资源而非"分析失败"；普通日记正常出分析；单测覆盖 crisis + 正常两条路径。
- **成本**：低（前端几行 + 测试）

### AW-3 ·【P1】合盘正文中文界面下不翻译

- **现象**：界面中文，合盘"最终总结"标题中文、正文英文（"Person A and Person B share..."）。
- **根因**（Codex 纠正初判）：lang 链路完整、缓存键已含 lang（`ai.ts:1063` + `cache/strategy.ts:36`）。真因是 **AI 输出语言不被校验** —— `normalizeLocalizedContent`(`ai.ts:151`) 模型返回 `lang:"en"` 时即使请求 zh 也被接受并缓存进 zh key。铁证是"zh key 里存了英文"，非缓存串味。
- **修复方向**：生成后校验 `result.lang !== requestedLang`（或中文字段英文占比过高）→ 拒绝/重试/修复后再入缓存。
- **验收**：zh 请求稳定返回中文正文；清除已污染 zh 缓存；加测试。
- **成本**：中

### AW-4 ·【P1】合盘 Growth Focus 显示 "AI report unavailable"

- **现象**：合盘雷达模块正常，下方 Growth Focus 报错带 Retry。
- **根因**（Codex 核查）：所有 section 走同一路径（`SynastryPage.tsx:325` → `apiClient.ts:960` → `synastry.ts:904`），无前端特殊分支。growth_task 特殊在 prompt 要更复杂 JSON、默认 4096 token、**无 schema 校验/repair**；且 prompt 要求引用 composite aspects，但传入的 `buildSynastrySummaryContext`(`synastry.ts:764`) **不含 composite 数据** → LLM 输出不稳定，失败被前端吞成统一文案。
- **修复方向**：① section 级 catch 透传 reason + 结构化日志（section/user/timing）；② growth_task 加 schema 校验 + repair，或收窄 prompt（删 composite 要求或补 composite 上下文）。
- **验收**：Growth Focus 稳定出内容；失败时日志能区分 invalid_json / 502 / quota / prompt_missing。
- **成本**：中

### AW-5 ·【P2】中文文章点作者强制跳英文

- **现象**：zh 百科文章点作者 → 跳 `/en/`，界面变英文。
- **根因**：`components/wiki/AuthorByline.tsx:94` 硬编码 `/en/wiki/author/${id}`。注释称有意 SEO 契约，但 AuthorPage canonical/schema 收口到 `/en/`(`data/authors/schema.ts:13`)，zh 作者页内容为空。
- **修复方向**（Codex 推荐）：zh 文章 byline 作者名改**纯文本不链接** —— 既不强制切语言，也不违背 SEO 契约，最干净。
- **验收**：zh 文章作者名不可点击；en 文章保持链接。
- **成本**：低

### AW-6 ·【P3】保存接口可观测性

- **现象**：保存失败主因（缺表）已于 06-13 修复；接口日志偏薄。
- **根因**：`savedReadings.ts:108` 记 `{userId, toolType, error}`，依赖 logger 序列化 Error；Supabase 非原生 Error 可能漏 `message/code`。
- **修复方向**：显式记 `error.message / error.code / error.details`。
- **成本**：低

### AW-7 ·【P3】中文首页乱码

- **现象**：中文首页 hero 副标题整行渲染成 `∫▽ʈⓔ 巳 ʀMÜ` 装饰符号。
- **根因**（Codex 纠正初判）：字体栈 `Readex Pro` / `Cormorant` 排在 CJK 前（`tailwind.config.cjs:83` / `index.html:80`）确实不优；但"整行中文变 Unicode 符号"**超出正常字体回退能解释的范围** → 更像 webfont cmap / 浏览器字形缓存损坏，非确定代码 bug。
- **修复方向**：先实机确认 DOM 文本是否正确（正确=缓存问题，代码改不动）；顺手给 `:lang(zh)` CJK 字体优先、标题中文不先用 Cormorant 做防御。
- **成本**：低（确认为主）

### AW-X ·【P1 横切】AI 响应契约层（根治 AW-2/3/4）

- **背景**：AW-2/3/4 同源 —— synastry sections parse JSON 后直接信任，**无 schema 校验、无 lang 校验、无安全词 post-gen lint**（仅 natal/daily 有）。
- **证据**：截图合盘总结 "they **will** need to navigate" 用了 `will`，违反 CLAUDE.md AI 安全边界规则 2（禁 will/must/destined），prompt 约束没拦住。
- **修复方向**：抽一个生成后契约层 —— schema 校验 + repair、lang 一致校验、安全词 lint（命中绝对语气→重试/降级），所有 AI section 统一过。
- **价值**：一次根治三个 bug + 防未来回归，优于逐个打补丁。

### AW-P1 ·【产品】合盘可分享摘要卡（拉新）

- 合盘结果页加"可分享摘要卡"：只暴露 vibe tags / 兼容雷达 / growth task，**不暴露出生数据**；分享图 + 短链，比让用户复制整段报告有效。

### AW-P2 ·【产品】Wiki 内链强化

- 已有 `data/wiki-associations.ts` 做内链，hook 不缺。先去掉 zh 文章 EN-only 作者链接（见 AW-5），再强化相关条目 + 工具 CTA 内链。