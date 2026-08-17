# HN 文本帖初稿 v1

**格式**：Ask HN 文本帖，不带 URL，不提 GenGrowth
**发布前必做**：见文末数字核对清单

---

## 标题（三选一）

1. `27% of the AI citations to my site pointed at URLs that 404`
2. `AI search cites your site, but Search Console won't tell you what it sent`
3. `Ask HN: has anyone found a way to attribute traffic from AI citations?`

> 建议 1。具体、可证伪、没有评价性措辞。
> 如果想要更高的回复率用 3，Ask HN 天然带提问属性，但曝光通常低一些。

---

## 正文

We migrated a site to new URLs a few months back. 308s on every old path, canonicals updated, hreflang updated, legacy sitemap left in place — the whole checklist Google publishes. I went through all six items twice and they were all correct.

Then I pulled the citation data. 51 of 186 AI citations were pointing at seven URLs that redirect into a 404. The single most-cited URL on the site was one of them. And 68.9% of our impressions were still landing on the deprecated paths, weeks after the redirects went in.

That part is at least fixable. The part I don't have an answer for is measurement.

Search Console's AI Features report gives impressions. It does not give clicks. I can see citations went from 0 in May, to 8 in June, to 85 in July, to 93 in the first twelve days of August — and I cannot tell you whether a single one of them sent a human to the site. I haven't found a way to separate it from direct traffic in analytics either.

The regular search numbers I'm still chewing on. Pages ranking 7–10 took 3,206 impressions and returned 17 clicks, so 0.53%. I originally flagged that as catastrophic because I was measuring against a 2% benchmark — which turned out to be a pre-AI-Overview number. Current figures for that position band with an AI Overview present are somewhere around 0.65–0.78%, so we're maybe 20–30% under, not 4x under. I spent two days on the wrong baseline before I checked where the number came from.

Nine queries I went through by hand: six were answered completely inside the AI Overview. One of those we rank 5th for. Zero clicks.

Pages ranking in the top 6 are fine — 5.54% CTR, above benchmark. The damage is concentrated in exactly the band where an AI Overview eats the answer before anyone scrolls.

Two things I'd like to hear from anyone who has looked at this more carefully than I have:

- Has anyone found a reliable way to attribute traffic from AI citations? Referrer, UTM, log analysis, anything that survives contact with reality.
- Is there a known lag on models picking up 308s? Mine had been live for weeks and the old paths were still being cited.

---

## 发布前的数字核对清单

发之前每一条都要能拿出截图，**HN 上一定会有人追问方法论**，答不上来比不发更糟。

| 数字 | 出处 | 状态 |
|---|---|---|
| 51 / 186 条 AI 引用落在 7 个死链 | 待确认是哪个站 | ⬜ |
| 引用量 5月 0 / 6月 8 / 7月 85 / 8月前12天 93 | 同上 | ⬜ |
| 68.9% 曝光滞留废弃 URL | GSC | ⬜ |
| 7–10 名：3,206 曝光 / 17 点击 | GSC | ⬜ |
| 前 6 名 CTR 5.54% | GSC | ⬜ |
| 9 个查询里 6 个被 AIO 完整回答 | 人工核查 | ⬜ |
| 0.65–0.78% 基准 | 需能说出来源 | ⬜ |

**两个站的数据不要混在一篇里说。** 现在这版正文默认全部来自同一个站，如果实际是跨站的，要么拆开写，要么删掉不属于主站的那几条。

---

## 发帖后

立刻用**无痕**打开 `/newest` 确认可见。不要看 `*`。
