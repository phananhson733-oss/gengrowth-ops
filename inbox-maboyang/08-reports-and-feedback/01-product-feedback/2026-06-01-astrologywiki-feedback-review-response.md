---
project: astrologywiki
type: product-feedback-review
status: draft
owner: wzb
reviewers: Claude (Opus 4.8) + Codex (OpenAI)
source: 2026-05-31-astrologywiki-product-feedback.md
updated: 2026-06-01
---

# 需求评审反馈：2026-05-31 SEO 技术需求文档

> 本文档是对 `2026-05-31-astrologywiki-product-feedback.md`（SEO 团队的「提升 DR 的产品与技术需求」）的评审回复。
> 由两个独立 AI 模型（Claude Opus 4.8 + OpenAI Codex）分别盲评后交叉比对，三个核心结论两边完全一致。
> 这是评审意见，不是否决；最终取舍取决于团队掌握的领域背景（为何选虚拟作者、是否有真人资源等）。

---

## 一句话结论（给 PM）

> 这份文档把"权威"当成可以靠 CMS 功能伪装出来的东西。一个 DR=0、收录停滞的新站，真正瓶颈几乎肯定是**内容权威 + 真实外链动作 + 真实可信实体**，不是缺作者页或 Indexing API。照单全做，大概率工程资源投进去、指标纹丝不动——因为治的不是病根；而虚构作者这条路，做得越深，合规和声誉的尾部风险越大。

**建议三个动作：**
1. **暂停**需求1（作者页），先做"作者真实性"根决策；
2. **砍掉**需求2 里的 Google Indexing API（不合规、对普通文章无效），只保留 sitemap 自动化；
3. **最先做**需求5（封面图 + OG）——它是全文档唯一零风险、低成本的一项，但要把它的定位从"DR 杠杆"改成"分享/CTR 优化"。

---

## 二、三个地基级问题（被表层需求盖住的根）

### 问题 1：DR 公式因果倒置

文档开篇 `DR 提升 = 外链质量 × 外链数量 × 站点技术健康度` **不成立**。

DR 是 **Ahrefs 的第三方链接指标**，本质衡量反向链接图谱的相对强弱，**不是 Google 指标、不参与排名**。它由 referring domains 的强度与数量决定——技术健康度、收录速度、OG 卡片、内链规范**对 DR 数值没有直接贡献**。

- 作者页、sitemap、Indexing API、OG 卡片 → 都**不直接提升 DR**
- 内链 → 只传递**站内**权重，**不增加 referring domains**
- 嵌入工具 → 只有外站**真实、自愿、可见、编辑性**地链接回来时，才**可能间接**影响 DR

文档把"支持外链获取的基础设施"写成了"DR 提升功能"。6 个需求里只有需求4（嵌入工具回链）真正触及外链数量，其余全是"使能器"不是"驱动器"。

**更深一层：DR 本身是虚荣指标。** 把全部资源对准 Ahrefs 的第三方分数，而不是收录数 / 关键词排名 / 自然点击，是目标设错了。
来源：https://help.ahrefs.com/en/articles/1409408-what-is-domain-rating-dr

### 问题 2：虚构作者 + 作者页 = 最大合规雷区，且方向反了

E-E-A-T 的第一个 E 是 **Experience（真实亲身经验）**。给 4 个**虚构 persona** 编头像、资质、专长、经历，并用于 Guest Post / Digital PR 外展，本质是**制造可验证身份的假象**——不是补 E-E-A-T，是把虚假信号系统化、固化、可被审计。

- 作者页写"占星师 / 研究经历 / 认证资质"而人不存在 = **虚假作者凭证**
- 用 persona 给媒体 / 站长发 PR pitch = **对外展对象的身份误导**
- 只为拿 dofollow + 优化锚文本 = 进入 **Google link spam 风险区**

**作者页一旦上线，不是"可信度资产"，而是"审查证据"。** 手动审查、媒体核验、竞品举报、搜索质量系统都可能据此判定为虚假权威包装。

**最低合规线：** 若坚持用虚拟作者，必须明确披露为 **editorial / fictional persona**，**不得**声明真实学历、证书、从业年限、客户经验、媒体经历、地理位置。更稳妥：用真实 editorial team / 真实审稿人 / "AstrologyWiki Editorial Team"。
来源：https://developers.google.com/search/docs/fundamentals/creating-helpful-content ｜ https://developers.google.com/search/docs/essentials/spam-policies

### 问题 3：Google Indexing API 用于普通内容页——不合规、且无效

Google 官方明确：**Indexing API 只支持 `JobPosting` 或含 `BroadcastEvent`（直播）的页面**（招聘页、直播页）。普通占星文章 / wiki 页 / 博客**不在范围**。

- 它**不是**普通内容页的官方提交通道
- 它**不是**绕过 GSC 配额的合法后门
- 它**不保证**收录
- 提交会经过 **spam detection**；滥用、多账号绕配额可能导致 **API 访问权限被撤销**

补充：文档说的"每天约 10 个配额"是 GSC **"请求编入索引"按钮**的限制，**sitemap 提交本身没有这个上限**——两件事被混为一谈了。合规替代：sitemap 自动更新 + 正确 `lastmod` + robots.txt 声明 sitemap + **IndexNow**（Bing/Yandex）+ 服务器日志分析。
来源：https://developers.google.com/search/apis/indexing-api/v3/quickstart ｜ https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl

**"sitemap 7 周未读"是症状不是根因。** 23 页、DR=0、低外部信号的新站，Google 抓取优先级低很正常。根因更可能在站点权威 / 内容价值 / 内部发现弱，Indexing API 治不了抓取预算。

---

## 三、逐条需求裁决

| 需求 | 裁决 | 理由（一句话） |
|---|---|---|
| 需求1 作者页系统 | **暂停** | 建在"虚构作者"这个有合规风险的前提上；先决策作者真实性，否则越做越固化风险 |
| 需求2 sitemap 自动更新 | **保留（P0）** | sitemap 自动化 + 正确 lastmod 是真问题、该做 |
| 需求2 Google Indexing API | **砍掉** | 只支持招聘/直播页，对普通文章不合规、无效，滥用还可能被撤权 |
| 需求5 封面图 + OG | **保留，最先做** | 全文档唯一零风险、低成本项；但定位改成"分享/CTR"，不是 DR 杠杆 |
| 需求4 可嵌入工具 | **有条件保留（P1）** | 唯一真正制造外链的需求，但"自带 dofollow 回链"写法本身是 widget link scheme 风险 |
| 需求6 内链管理 | **保留（P1）** | 合理优化，但解决不了外部权威；需补 topic clusters 等架构 |

### 需求4 的修正（重要）

原文"嵌入代码自带 dofollow 回链"——Google 明确把"嵌在 widgets 中、跨站分发的链接"列为 **link spam 示例**。正确做法：

- 工具**先得真有用**，不是为了链接而存在
- 回链**可见 + 品牌化 + 自然锚文本**（如 "Powered by AstrologyWiki"）
- **不强制 dofollow**，给嵌入方选择权
- **不用**关键词锚文本（如 "free birth chart calculator astrology compatibility"）
- **不藏** footer / template

否则这不是 link bait，是可规模化识别的 widget link scheme。
来源：https://developers.google.com/search/docs/essentials/spam-policies

---

## 四、文档缺失的（比已有需求更关键）

- **外链获取的具体动作计划**——没有它，所有"为外链做准备"的需求都没有落点
- **内容护城河 / 关键词地图**——每篇内容的 unique value 是什么？凭什么比现有 astrology 站更值得收录排名
- **Programmatic SEO 的 scaled content abuse 边界**——若批量生成星座/宫位/相位/兼容性页，如何避免被判规模化低质内容
- **真实信任页**——About / Editorial policy / Correction policy / Methodology / AI disclosure / Contact
- **AI 内容披露 + 人工编辑流程**
- **外链合规策略**——哪些接受 nofollow/sponsored，哪些是 editorial links，哪些拒绝
- **技术 SEO audit**——indexability / canonical / schema / Core Web Vitals / rendering / logs / 404/redirect
- **结构化数据（Article / FAQ schema）**——文档提到需求7却没展开，对收录和富结果的作用可能比作者页更直接
- **成功指标重定义**——DR 不该是核心 KPI；应看 referring domains 质量、收录的有价值页面数、非品牌曝光、排名分布、自然点击

---

## 五、立即可做的诊断动作（零成本，先做）

在动任何产品功能前，先把收录问题诊断清楚：

1. 确认 sitemap 返回 200、XML 合法、canonical 一致、URL 绝对路径、无 noindex/robots 阻挡
2. 在 `robots.txt` 声明 sitemap，并在 GSC 重新提交
3. 查服务器日志：Googlebot 到底有没有抓 sitemap 和新 URL
4. 查 GSC Page indexing：是 **`Discovered - currently not indexed`** 还是 **`Crawled - currently not indexed`**——两者病因完全不同，决定下一步该修内容还是修链接发现
5. 建立首页 / 分类页 / hub 页到新内容的可爬内链路径

---

## 附：官方依据链接汇总

- Ahrefs DR 定义：https://help.ahrefs.com/en/articles/1409408-what-is-domain-rating-dr
- Google Helpful Content / Who-How-Why：https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- Google Spam Policies（link spam / 虚假权威）：https://developers.google.com/search/docs/essentials/spam-policies
- Google Indexing API（仅 JobPosting / BroadcastEvent）：https://developers.google.com/search/apis/indexing-api/v3/quickstart
- Google Ask to Recrawl（不保证收录）：https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl
- GSC Sitemap 帮助：https://support.google.com/webmasters/answer/7451001

---

_评审方式：Claude Opus 4.8 与 OpenAI Codex 独立盲评 + 交叉比对。三个地基级问题（DR 因果倒置、虚构作者合规风险、Indexing API 不合规）两个模型完全一致。状态：draft，待团队评审。_
