# Preference Packet Schema

Use version 3 JSON for the local Preference Studio.

~~~json
{
  "version": 3,
  "updatedAt": "ISO-8601 timestamp",
  "signals": [
    {
      "id": "stable identifier",
      "polarity": "positive | negative",
      "label": "specific preference rule",
      "scope": "topic | hook | script",
      "category": "expression | selection | account_rule | current_only",
      "applicability": "where this signal applies",
      "evidence": 1,
      "reasonedEvidence": 1,
      "status": "candidate | testing | proposed | confirmed",
      "sourceReasons": ["verbatim user reason"],
      "sourceSessionIds": ["unique training session id"],
      "confidenceNote": "why the extraction is appropriately scoped",
      "targetFile": "canonical workspace file",
      "targetSection": "mapped heading"
    }
  ],
  "sessions": [
    {
      "id": "session identifier",
      "createdAt": "ISO-8601 timestamp",
      "mode": "topic | hook | script",
      "brief": "training task",
      "bestId": "A",
      "worstId": "D",
      "bestReason": "verbatim reason",
      "worstReason": "verbatim reason",
      "candidates": [
        {
          "id": "A",
          "title": "candidate label",
          "angle": "tested mechanism",
          "copy": "candidate content"
        }
      ],
      "contextReceipt": [{ "id": "product_skill", "readable": true }],
      "learningSummary": "conservative AI summary"
    }
  ],
  "skillUpdates": []
}
~~~

## Validation

- Require exactly one positive and one negative choice per completed session.
- Require bestId and worstId to differ.
- Allow reasons to be empty, but mark reason-free selections as low-confidence and prevent them from independently reaching `proposed`.
- Require four candidates labeled A–D.
- Treat sourceReasons and sourceSessionIds as immutable evidence.
- Count a signal at most once per unique session.
- Use AI semantic matching only when polarity, scope, and rule meaning agree.
- Reject automatic promotion to confirmed.
- Keep topic-selection judgments separate from personal expression rules.
- Keep current-only requirements and account rules out of the personal style layer.
