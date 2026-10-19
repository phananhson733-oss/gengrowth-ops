# dramashortstv.com / shortsbinge.com：Bing 零曝光排查结论与优化需求

- 日期：2026-09-24
- 涉及站点：dramashortstv.com（老站）、shortsbinge.com（新站，约 9/20 提交 sitemap）
- 现象：dramashortstv 在 Bing 上已近一周 0 曝光 0 点击；shortsbinge 提交 sitemap 后一直 0 曝光

---

## 一、排查结论

### 已排除（不是原因）

| 怀疑点 | 验证方式 | 结果 |
|---|---|---|
| 页面未被收录 | Bing 站长后台 URL 检查（两站首页） | 两站首页均"已成功编制索引" |
| 防火墙挡住 Bingbot | shortsbinge 首页实时 URL 检查 | HTTP 200，Bingbot 可正常抓取（Vercel 放行了已验证爬虫） |
| robots / noindex / canonical 配置错误 | curl 抓取首页及样本页 | robots.txt 未屏蔽 Bingbot；页面为 `index, follow`；canonical 指向自身 |
| 服务器故障 | 同期 Google `site:` 检查 | Google 收录与展示正常 |

### 现状判断

**两个站都已收录，但被 Bing 压住不展示。** 证据：在 Bing 搜品牌词 `DramaShortsTV`、搜 `"The Boss Affair" DramaShortsTV`，都不出本站；而竞品 whichdrama.com、bestshortdrama.com、dramashorts.io 都能正常出现。

### 可能原因（按可能性排序）

1. **两个站剧目大体相同，形成跨域重复。** 新站 shortsbinge 上线（约 9/20）与老站掉零（约 9/17 前后）时间接近，可能被 Bing 识别为站群，两站一起被压。
2. **大量低信息量模板页。** dramashortstv 的 sitemap 共 **68,720 个 URL**：
   - `/drama/` 详情页 31,848 个，`/watch/.../1` 第 1 集页 31,840 个，**两类页面 1:1 对应**。分集页可见正文约 200 词，核心内容就是详情页里的同一段剧情简介。
   - 剧情简介直接使用 ReelShort / DramaBox 等平台的原文，同样的文字在多个竞品站也能找到。
   - 覆盖 21 种语言；其中 hi、tl 只有约 225 个 URL，内容明显不完整。
   - genre 分页页 1,318 个也放进了 sitemap。
3. **9 月 16 日的改版引入了跳转问题。** sitemap 中 33,829 个 URL 的 lastmod 都是 2026-09-16，说明当天有大规模改动：
   - `https://www.dramashortstv.com/video-play/49018` → 404（旧播放页没有跳转，Google 上仍收录着这类链接）
   - `https://dramashortstv.com/es/detail/40917` → 跳到了**意大利语**页面 `/it/drama/...`（语言丢失）
   - `https://dramashortstv.com/detail/40917` → 308 跳到新详情页（这一条正常）

### 未能确认的部分

- **Bing 是否对站点做了人工惩罚**：Bing 后台没有"人工处置"报告，只能通过官方支持工单确认（见需求 P0-1）。
- **shortsbinge 除首页外的页面状态**：Bing 搜 `site:shortsbinge.com` 时弹出人机验证，没有继续查询。

---

## 二、优化需求

### P0：本周完成

**P0-1 向 Bing 官方确认是否被惩罚**（负责：运营）
- Bing 站长后台 → 右上角帮助 → Contact Support，提交工单，写明两个域名，询问"是否因违反 Webmaster Guidelines 被降权或过滤"。
- 同时在"搜索效果"中导出最近 3 个月数据，确认是 9/16 前后**突然**清零（更像惩罚），还是**逐渐**下滑（更像质量评估生效）。
- 验收：拿到 Bing 支持的回复；数据截图存档。

**P0-2 两个站的内容分开**（负责：业务决策 + 开发）
需要先从下面选一个方案：
- A. 按语言或市场分开：例如 dramashortstv 只做英语，shortsbinge 只做其他语言（或反过来），同一语言的同一部剧只在一个站上可被收录。
- B. 暂停新站：shortsbinge 整站加 `noindex`，等 dramashortstv 恢复后再重新规划。
- C. 两站保留同一剧目，但另一站的对应页面 canonical 指向主站（这样新站自身几乎没有 SEO 价值）。
- 验收：任意抽 20 部剧，不存在两个站同一语言都 `index` 的情况。

**P0-3 修复改版跳转**（负责：开发）
- `/video-play/{旧ID}`（含 www 版本）→ 301 跳到对应剧目的 `/{lang}/watch/{slug}/{集数}`；找不到对应剧目时，跳到该剧的 `/drama/` 页或首页（不要跳到无关页面）。
- `/{lang}/detail/{旧ID}` → 跳转时保留原语言，不能落到其他语言页面。
- 验收：从 Google Search Console 或服务器日志导出旧 URL 抽样 100 条，全部一次跳转到同语言的正确页面，无 404。

### P1：两周内完成

**P1-1 分集页不参与收录**（负责：开发）
- 所有 `/{lang}/watch/...` 页面改为 `<meta name="robots" content="noindex, follow">`，并从 sitemap 中移除。
- `/drama/` 详情页继续保留收录，作为唯一可收录的剧目页。
- 验收：sitemap URL 数由 68,720 降到约 3.7 万；抽查 watch 页 robots 标签为 noindex。

**P1-2 收缩语言和分页**（负责：业务决策 + 开发）
- 按 Google Search Console 近 3 个月各语言的曝光数据，**没有曝光的语言**整体 noindex 并移出 sitemap；hi、tl 这类内容不完整的语言优先处理。
- genre 分页页（`/genre/.../page/N`）从 sitemap 中移除，页面本身保持 `noindex, follow`。
- 验收：sitemap 只包含保留语言的首页、详情页、genre 首页、blog 和静态页。

**P1-3 重点剧目重写简介**（负责：内容）
- 按 Google 曝光排序，取前 200 部英文剧，简介改为自己写的内容，不照搬平台原文。可以写剧情看点、主要角色关系、适合什么口味的观众等，而不是复述官方文案。
- 验收：抽查 20 部，用简介里的一句话去 Bing 精确搜索，本站之外没有完全相同的文字。

### P2：持续优化

**P2-1 接入 IndexNow**（负责：开发）
- 生成 key 文件放在站点根目录，内容更新（新剧、简介改写、noindex 变更）时自动推送 URL。
- 注意：这一条只解决"新页面被发现得慢"，**不是零曝光的原因**，排在 P0/P1 之后。

**P2-2 加快 sitemap 响应**（负责：开发）
- 目前 98 个子 sitemap 单个响应需要 1.4–16 秒。改为静态生成或加缓存，目标单个在 1 秒内。

**P2-3 定期复查**
- 每周一次：在 Bing 分别搜两个站的品牌词、5 个重点剧名 + 站名，记录本站是否出现，同时看 Bing 后台的曝光趋势。
- 判断收录状态以 Bing 后台 URL 检查为准。Bing 的 `site:` / `url:` 搜索运算符结果不稳定，不要用来下结论。

---

## 三、需要尽快拍板的决策

1. 两个站怎么分工（P0-2 选 A / B / C）
2. 保留哪些语言（P1-2）
3. 重写简介的人力安排（P1-3）
