# DramaShortTV｜Short Drama App Safety Guide 线上 QA 修复 Proposal

## 来源与范围

- 来源：马博洋在当前对话提供的线上 QA 结果。
- 本文不代表 Ops 已访问线上页面、代码仓或 GSC；所有抓取比例、页面状态与原稿事实均待对应工程/内容负责人复核。
- 目标页面：`Are Short Drama Apps Safe? What to Check Before You Pay`。

## P0：立即下线正文中的编辑指令

线上读者不应看到以下类型的内部文案：

- `Before publication, this section should cite...`
- `Do not describe a complaint pattern...`
- `Evidence review required`
- `Low until sources are reviewed`

### 处理规则

1. 已完成证据核实：替换为面向读者的、附可访问来源链接与核查日期的正文。
2. 未完成证据核实：不要用编辑指令代替内容；删除该品牌的事实判断，或将该 App 从对比表移至发布前内部备注。
3. 发布稿中不保留 `Sources to verify`、`Content honesty boundary`、`system_audit_log` 等内部质检区块。

## P0：恢复 ReelShort / DramaBox 品牌段落的读者价值

### ReelShort 建议替换文案（发布前补原始链接与核查日期）

```md
### Is ReelShort safe to download and pay for?

ReelShort is listed in the major mobile app stores. Before you pay, confirm the developer name shown in the current listing, read the in-app purchase labels, and check whether the option in front of you is a coin bundle, a recurring plan, or both.

The public feedback pattern documented for this guide is mainly about pricing clarity. Some reviewers say they expected a coin bundle to unlock more of a story than it ultimately did, especially as episode costs increased. That can feel frustrating, but a pricing complaint is not, by itself, proof of fraud.

The useful check is concrete: compare the coins in the bundle with the coins required for the next episodes you want to watch. Take a screenshot before checkout, and keep the store receipt if you make a purchase.
```

### DramaBox 建议替换文案（发布前补原始链接与核查日期）

```md
### Is DramaBox safe to download and pay for?

DramaBox is also available through major mobile app stores. Check the current developer information in the official listing, review the purchase labels, and confirm the cancellation terms before starting any recurring plan.

The public feedback reviewed for this guide points more often to ad load and unlock pace than to a single, universal pricing complaint. Some readers may find the time required to unlock a short episode through ads more frustrating than expected. That is a usability and value question, not automatically a safety problem.

Before spending, decide whether you prefer waiting through ads, using coins, or choosing a subscription. Then check the exact terms of that option rather than relying on the general pricing page.
```

### 品牌段落上线前证据要求

- 每段至少附 2 条可访问的原始公开评论或商店页证据，并标注核查日期。
- 开发商名以发布当日 Apple App Store / Google Play 的实际字段为准。QA 报告提及的 `Crazy Maple Studio` / `StoryMatrix` 不应在未复核时直接写死。
- 不写“无未经授权扣费证据”“不是诈骗”“所有用户都遇到”等无法由当前样本证明的绝对化结论。

## P1：对比表改为读者版，而非内部状态版

| App | Verdict | Key Risk | Confidence |
|---|---|---|---|
| ReelShort | Check the exact coin and renewal terms before paying | Episode unlock costs may be harder to judge from the bundle price alone | Based on dated public-store and review-source checks |
| DramaBox | Check ads, unlock pace, and renewal terms before paying | The time or cost needed to continue a story may not match reader expectations | Based on dated public-store and review-source checks |
| GoodShort | Apply the same store, pricing, and renewal checks | Not enough verified public evidence in this guide for a broad complaint pattern | Limited evidence |
| ShortMax | Apply the same store, pricing, and renewal checks | Not enough verified public evidence in this guide for a broad complaint pattern | Limited evidence |
| NetShort | Apply the same store, pricing, and renewal checks | Not enough verified public evidence in this guide for a broad complaint pattern | Limited evidence |
| FlickReels | Apply the same store, pricing, and renewal checks | Not enough verified public evidence in this guide for a broad complaint pattern | Limited evidence |

> 表格中的 `Based on...` 仅在真实来源、链接与日期已部署到页面后使用；若不能完成，则将该格改为 `Limited evidence`，并避免在正文声称已完成深度核实。

## P1：补自然关键词 `is drama box safe`

在 FAQ 中新增一条；不改动现有自然的 `Is the ReelShort app safe to use?` 与 `Is the DramaBox app safe to use?`。

```md
### Is Drama Box safe?

Check the official store listing, the exact purchase option, and any renewal terms before you pay. A clear price screen, a visible developer identity, and a platform receipt give you more useful information than a broad safety label alone.
```

## P0：技术修复任务（转交工程负责人）

### 问题

- QA 报告称：8 次抓取中 7 次缺失 `title`、`canonical`、`description`、`og`，而正文每次均存在。
- 该页未进入 sitemap。
- 页面有 8 条可见 FAQ，但没有 `FAQPage` schema。

### 验收标准

1. 连续 8 次独立抓取中，`<title>`、唯一 canonical、meta description、`og:title`、`og:description`、`og:image` 均存在且内容一致；不能只验证单次成功。
2. canonical 是该页最终可索引 URL，不含测试参数，不指向首页或其他文章。
3. 页面进入正确的 XML sitemap；sitemap 返回 200，URL 使用 canonical URL，并可被 Search Console 读取。
4. FAQPage JSON-LD 与页面中可见 FAQ 逐字一致；仅包含页面真实可见的 8 条问答。
5. JSON-LD、title、canonical、description、OG 标签在服务端首字节 HTML 中可见，不依赖客户端渲染后才注入。
6. 修复后重新跑 8 次抓取并保存结果，附页面 URL、时间、HTTP 状态和抓到的各 metadata 字段。

## 负责人与下一步

- 内容负责人：恢复品牌段落、补原始评论/商店页来源、按发布当天数据复核开发者字段。
- 工程负责人：修复 head metadata、sitemap 与 FAQPage schema，并提供 8 次抓取验证记录。
- Ops：待收到已核验来源与技术验收结果后，生成最终发布版 Markdown；不直接修改线上页面。
