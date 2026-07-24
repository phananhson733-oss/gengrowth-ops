---
title: 2026-07-16 Messi × Yamal World Cup Final 双模型实验 Prompt
project: astrologywiki
type: dual-model-experiment-prompt
content_id: aw-worldcup-final-messi-yamal-20260716
experiment_id: aw-worldcup-final-messi-yamal-exp-01
package_version: v1
model: claude-or-gpt
status: ready-to-copy
owner: Pengman
updated: 2026-07-16
---

# Claude / GPT 双模型实验共享 Prompt

> 使用方法：从下一行“请作为”开始复制到文件结尾。把完全相同的内容分别发送到一个新的 Claude 对话和一个新的 GPT 对话。两个模型不要看到对方的回答。

请作为独立内容候选生成器。仅依据随附的冻结模型实验包生成一个候选。


严格要求：
- 只能依据下方冻结实验包创作，不得自行补充事实。
- 不读取、猜测或回应另一模型本轮答案。
- 不修改 confirmed_facts、series_constraints 或 prohibited_claims。
- 如认为 Brief 有问题，只能写在第 10 项《对 Brief 的异议》中。
- 输出必须标记为 candidate，不是最终稿。
- 不要修改主生产记录。


你的输出 YAML 必须使用以下规则：

- 如果你是 Claude：`model: claude`、`variant_id: claude-v1`、`suggested_output_filename: "2026-07-16 Messi × Yamal World Cup Final Claude Candidate.md"`。
- 如果你是 GPT：`model: gpt`、`variant_id: gpt-v1`、`suggested_output_filename: "2026-07-16 Messi × Yamal World Cup Final GPT Candidate.md"`。
- 其余字段完全相同：

```yaml
content_id: aw-worldcup-final-messi-yamal-20260716
experiment_id: aw-worldcup-final-messi-yamal-exp-01
model: claude / gpt
variant_id: claude-v1 / gpt-v1
candidate_status: candidate
package_version: v1
suggested_output_filename: "按当前模型使用对应的 Claude Candidate 或 GPT Candidate 文件名"
```

正文严格按照冻结包 `output_requirements` 的 10 项顺序输出。

## 冻结模型实验包

```yaml
content_id: aw-worldcup-final-messi-yamal-20260716
experiment_id: aw-worldcup-final-messi-yamal-exp-01
package_version: v1
topic: "Argentina vs Spain — The Photo That Became a World Cup Final; Messi × Yamal full-circle story with a comparative astrology layer"
target_audience: "English-speaking World Cup viewers and Messi/Yamal/Barcelona fans who may not already follow astrology content"
account: "filestarsx — second TikTok account / hotspot astrology"
platform:
  - TikTok photo post / slideshow
  - Instagram carousel adaptation optional
content_format: "Vertical photo slideshow; page count must follow the content, expected range 5–9 pages, not fixed at 6 or 7"
content_goal: "Earn timely reach through the verified 2007-to-2026 public story, then guide interested viewers to AstrologyWiki's Yamal and Messi pages"
user_problem: "Why does this World Cup final feel like a generational full-circle moment rather than only another match?"
evidence:
  - source: "https://www.astrologywiki.com/en/wiki/lamine-yamal-zodiac-sign"
    supports: "Yamal Cancer Sun; Cancer Moon marked approximate; Cancer Mercury; Mars in Taurus; Jupiter in Sagittarius retrograde; Venus and Saturn in Leo; rising sign and houses unconfirmed"
    strength: "primary internal content reference supplied and approved by Pengman"
  - source: "https://www.astrologywiki.com/en/wiki/lionel-messi-zodiac-sign"
    supports: "Messi Cancer Sun; reported Capricorn Rising and Cancer–Capricorn axis must remain provisional; Jupiter in Cancer backdrop ended June 30, 2026"
    strength: "primary internal content reference supplied and approved by Pengman"
  - source: "https://apnews.com/article/argentina-messi-spain-yamal-world-cup-final-55077ce5c4728c4207a39cc4aa8a41a1"
    supports: "Argentina vs Spain final; Messi–Yamal 2007 UNICEF photo story; present-versus-future framing; both players' Barcelona and left-footed connection"
    strength: "current public news verification"
  - source: "https://apnews.com/article/afa13ed9fa933f8b75bd56eb16546031"
    supports: "Argentina beat England 2–1 and reached the final"
    strength: "current public news verification"
  - source: "https://inside.fifa.com/organisation/president/news/world-cup-2026-match-schedule-fixtures-ronaldo-infantino"
    supports: "Final scheduled for July 19, 2026 at 15:00 EDT in New York New Jersey"
    strength: "official schedule"
  - source: "GSC 2026-07-01 local export"
    supports: "is messi a cancer: 74 impressions, 0 clicks, position 7.59; lamine yamal birth chart: 20 impressions, 0 clicks, position 10.1"
    strength: "owned search-performance evidence"
competitor_references:
  - source: "https://www.tiktok.com/@shirley527105/photo/7662341959507332383"
    mechanism: "filestarsx-owned France vs Spain reference: strong matchup cover, large player image, placement labels, one short interpretation per player, swipe-to-reveal structure"
    evidence_strength: "directly inspected public post; 7 pages; 30 likes, 1 comment, 5 favorites, 1 share at inspection; views and completion unavailable"
    do_not_copy: "Do not copy its fixed 7-page count, exact white text boxes, wording, photos, unqualified Moon claims, or placement-to-performance causality"
old_draft_references:
  - "[[inbox-pengman/04-production/06-daily-content-recommendations/2026-07-16 世界杯决赛图文选题池]]"
  - "[[inbox-pengman/04-production/07-content-production/2026-07-14 France vs Spain Astrology Slideshow 制作方案]]"
series_constraints:
  - "Story first, astrology second"
  - "Start with the 2007 photo becoming the 2026 final; do not open with an astrology lesson, question, or disclaimer"
  - "Use shared Cancer Suns as the common theme, then show why the two charts are not identical"
  - "Include at least one useful verified non-Sun layer for each player; for Messi, a provisional axis/rising discussion counts only when clearly labeled"
  - "Page count follows verified content; expected 5–9 pages; one clear narrative or chart-reading job per page"
  - "Large football imagery and concise mobile-readable text; English public copy and Chinese production notes"
  - "Keep CTA light and specific; do not turn the last page into an advertisement"
confirmed_facts:
  - "Messi met baby Yamal during a 2007 UNICEF charity-calendar photo shoot; do not imply Messi selected, discovered, or mentored him"
  - "Argentina and Spain are the 2026 World Cup finalists"
  - "The final is July 19, 2026 at 15:00 EDT in New York New Jersey"
  - "Messi and Yamal are left-footed footballers with clear Barcelona connections"
  - "Messi was born June 24, 1987 and has a Cancer Sun"
  - "Yamal was born July 13, 2007 and has a Cancer Sun"
  - "Yamal's AstrologyWiki page gives Cancer Mercury, Mars in Taurus, Jupiter in Sagittarius retrograde, and Venus/Saturn in Leo"
  - "Yamal's Cancer Moon is approximate; his rising sign, houses, and chart angles are unconfirmed"
  - "Messi's Capricorn Rising is widely cited but not firmly confirmed; any Cancer–Capricorn axis reading must remain reported/provisional"
  - "Jupiter left Cancer for Leo on June 30, 2026; do not write as if Jupiter is still in Cancer at the July 19 final"
prohibited_claims:
  - "Any winner, score, Golden Boot, injury, luck, destiny, betting, or performance prediction"
  - "The universe planned this final; fated final; the stars favor; astrology saw it coming; Cancer will win"
  - "A placement caused football talent, goals, stamina, leadership, match results, or trophy outcomes"
  - "Any unverified Moon, Rising, house, exact degree, birth time, or exact aspect presented as settled fact"
  - "Any claim that two Cancer Suns are the same person or play the same way"
  - "Any direct reuse of copyrighted news photography unless licensed; visual plan must offer an original-graphic fallback"
cta: "Invite the viewer to compare legacy and arrival, then read both AstrologyWiki profiles through a light bio/shortlink prompt"
landing_page:
  - "https://www.astrologywiki.com/en/wiki/lamine-yamal-zodiac-sign"
  - "https://www.astrologywiki.com/en/wiki/lionel-messi-zodiac-sign"
length: "Complete slideshow package with 5–9 pages as justified by content; each page should be mobile-readable and concise"
language: "English publishable copy; Chinese rationale, production notes, and risk notes"
previous_decision: "Sports astrology remains 待观察; the method-led sports explainer had weak public interaction, while the Haaland photo post had 277 plays and 8 likes but lacked click data"
previous_next_test: "Test whether a specific visual full-circle story plus a light comparative chart layer improves completion, shares, comments, profile visits, and article interest versus a method-led sports astrology explainer"
output_requirements:
  - "Return candidate status only; do not call the copy final or approved"
  - "Use metadata: content_id, experiment_id, model, variant_id, candidate_status, package_version"
  - "Use exactly this order: 1 对选题的理解; 2 推荐的内容角度; 3 Hook; 4 完整内容初稿; 5 结构与节奏说明; 6 CTA; 7 使用了哪些证据; 8 风险和待确认事项; 9 对原选题的改进建议; 10 对 Brief 的异议"
  - "The complete draft must include page-by-page English copy plus Chinese visual/production notes"
  - "State the chosen page count and justify it from the content; do not add filler to hit a preset number"
  - "For every non-Sun placement used, show whether it is confirmed or provisional and cite the supplied AstrologyWiki page in the evidence section"
  - "Provide an original-graphic fallback if the 2007 photo cannot be licensed"
  - "Do not read, quote, infer, or respond to the other model's current candidate"
```
