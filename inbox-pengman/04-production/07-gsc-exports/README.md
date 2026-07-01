---
title: GSC Exports
type: data-folder
status: active
updated: 2026-07-01
owner: Pengman
---

# GSC Exports

Put manual Google Search Console CSV exports here before asking Codex to generate daily content recommendations.

Recommended file naming:

```text
YYYY-MM-DD-gsc-queries.csv
YYYY-MM-DD-gsc-pages.csv
YYYY-MM-DD-gsc-query-page.csv
```

For the first MVP, CSV export is better than connecting the GSC API.

Useful columns:

- query
- page
- clicks
- impressions
- ctr
- position
- date range, either as a column or in the file name

Codex should prioritize:

- high impressions with low CTR
- positions around 8-30
- pages that already have impressions but need stronger offsite explanation
- queries that map naturally to an existing AstrologyWiki article
