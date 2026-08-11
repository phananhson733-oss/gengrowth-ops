---
product: astrologywiki
content_id: c-cd0769c0
account: "@astrologywiki"
platform: TikTok
language: en-US
market: "US primary; UK/CA/AU secondary"
status: draft_for_h4
humanization_review: "passed — reviewed with the humanizer checklist; spoken rhythm, concrete scene, repetition, abstract phrasing, and AI-style symmetry checked"
pronunciation_review: "complete"
script_hash: "PENDING_RUNNER"
duration_s: "PENDING_RUNNER"
---

# Prompt Package — Mercury isn't retrograde, you just sent that text

## A. Identity and goal

- Content ID: `c-cd0769c0`
- Account: `@astrologywiki`
- Platform / format: TikTok, 9:16, AI talking head with short message-screen B-roll
- Audience: English-speaking 18–35 astrology users who use transits to make sense of relationships and communication
- Situation: Someone sends an emotionally loaded late-night text, regrets it, then blames Mercury retrograde
- Core idea: Astrology can reveal patterns, but it should not become an excuse for avoidable communication choices
- Product bridge: Free birth chart / Big Three at AstrologyWiki
- Primary KPI: completion rate
- Observation windows: 24h, 72h, 7d, 30d
- Target duration: 35–60 seconds
- Hypothesis ID: Use the value linked to this content in the Sheet; the runner status view did not expose it
- Frozen variables: approved topic, `@astrologywiki`, English, direct anti-excuse tone, 9:16, one light product CTA
- Fact check: On 2026-08-11 Mercury is direct. CHANI lists the prior retrograde ending July 23, with the post-retrograde shadow ending August 6; Cafe Astrology lists the same dates.
- Sources:
  - https://www.chani.com/this-year/key-dates/2026-astrological-key-dates-mercury-retrogrades
  - https://cafeastrology.com/astrology-of-2026.html

## B. Paste-ready script

### Hook candidates considered

1. Mercury isn't retrograde. You just sent that text.
2. You sent a five-paragraph text at 1:47 a.m. Mercury had nothing to do with it.
3. If you have to blame a planet for that message, maybe don't hit send.
4. Mercury didn't make your text confusing. You were hoping they would read your mind.
5. Before you check the transit, reread what you actually sent.

Selected hook: #1. It preserves the approved title and gives the person, behavior, and conflict in the first sentence.

### Final voiceover

Mercury isn't retrograde. You just sent that text.

At 1:47 a.m.

After rereading it six times.

Then you saw "Read" and decided the universe was personally attacking you.

Astrology can help you spot a pattern. It can't unsend the paragraph you wrote because waiting felt worse than sending it.

We blame Mercury for typos, missed calls, and replies that land weird. Sometimes the explanation is much less dramatic: the timing was bad, the message was vague, or you expected them to know what you meant.

Before you blame the sky, read the text again.

Did you say what you wanted?

Did it need to go out tonight?

Or were you hoping their reply would calm you down?

Use astrology as a mirror, not an alibi.

Next time, save the draft. Go to sleep. Send it tomorrow.

### Delivery notes

- First line: dry, immediate, lightly amused
- Pause after “At 1:47 a.m.” and “After rereading it six times.”
- Stress: “you,” “waiting,” “read the text again,” “mirror,” “alibi”
- Do not sound angry or clinical; this is a friend calling out a behavior
- Internal note: Paste only the `script_text` cell from the Sheet’s `口播稿` tab into HeyGen. This document is for review, not the paste source.

### Pronunciation

- Mercury: `MER-kyuh-ree`
- retrograde: `RET-roh-grayd`
- AstrologyWiki: `uh-STROL-uh-jee WIK-ee`

## C. Scenes and visual direction

| Time | Voiceover beat | Visual |
|---|---|---|
| 0–4s | “Mercury isn't retrograde…” | Tight talking-head crop. Large first-frame text: `MERCURY DIDN'T SEND THAT TEXT.` |
| 4–11s | “At 1:47 a.m…” | Fictional phone-message B-roll. Show only generic text bubbles; do not use a real conversation or identifiable person. |
| 11–25s | “Astrology can help…” | Return to host. Add small lower-third: `pattern ≠ excuse` |
| 25–39s | “Before you blame the sky…” | Each question appears as one short centered subtitle card while the host remains visible. |
| 39–47s | “Use astrology as a mirror…” | Slow push-in. End card: `CHECK THE PATTERN. OWN THE TEXT.` + small `Free birth chart in bio` |

Visual rules:

- Use the current `@astrologywiki` avatar, voice, background, subtitle style, and template from the Sheet’s `账号与形象` row
- Avatar: center frame, chest-up, safe margins for TikTok UI
- Captions: on; keep each line short; do not cover the lower-right interaction area
- B-roll rights: generate or use internally licensed generic message UI; no competitor footage, real DMs, or scraped creator assets
- Music: optional low-volume licensed bed only; dialogue stays dominant
- Cover text: `MERCURY DIDN'T SEND THAT TEXT`

## D. HeyGen execution parameters

- Project name: `astrologywiki-c-cd0769c0`
- Adapter: `heygen_web_v1`
- Aspect ratio / resolution: 9:16, 1080×1920
- Avatar / voice / background / subtitle template: use the current values in the `@astrologywiki` Accounts row
- Voice speed: `1.0×` according to the runner’s account lookup
- Tone: conversational, dry, slightly teasing
- Estimated credits: 20
- Maximum credits: 40; stop rather than regenerate past the cap
- AIGC disclosure: must be enabled by a human before H4 can pass
- Current compliance blocker: the runner reports that `@astrologywiki.avatar_license_url` is empty

## E. Publishing package

Caption:

Mercury can take the night off. Check the text before you check the transit. Use astrology as a mirror, not an alibi. Free birth chart in bio.

Hashtags:

`#Astrology #MercuryRetrograde #SelfAwareness #CommunicationTips #AstrologyTok`

Pinned comment:

Be honest: what text did you blame on Mercury?

CTA:

- Spoken: none; keep the ending on “Send it tomorrow.”
- On-screen / caption: `Free birth chart in bio`
- URL: `https://astrologywiki.com/?utm_campaign=c-cd0769c0`

Scheduling:

- Use the next approved `@astrologywiki` slot in the weekly plan
- If a human supplies a time without a timezone, interpret it as `America/Chicago`
- Do not invent a new slot or publish automatically

## F. QA and approval

Machine-side review completed:

- Current Mercury status and relevant 2026 dates checked against CHANI and Cafe Astrology
- Hook names the behavior and conflict in the first 2–3 seconds
- Humanization pass completed; no classroom intro, corporate phrasing, clinical diagnosis, deterministic prediction, or copied competitor wording
- Pronunciation notes present
- Caption, hashtags, and tracked CTA prepared
- Script stays within the 35–60 second target after runner calculation: `PENDING_RUNNER`

Human actions still required:

1. Add and verify `avatar_license_url` in the `@astrologywiki` Accounts row
2. Review the Sheet’s `口播稿.script_text` cell, which is the only approved paste source
3. Set `approval_status=approved`
4. Copy the visible `script_hash` into `approved_script_hash`
5. Check `aigc_label_on`
6. Confirm `ready_to_paste=true` before using HeyGen
7. After publishing, fill `publish_url` and `published_at`
