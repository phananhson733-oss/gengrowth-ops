# Frontmatter Template for gengrowth-wiki

Clipped documents follow this YAML frontmatter convention:

```yaml
---
title: "<page title - keep original, clean up extra whitespace>"
source: "<original URL>"
clipped: YYYY-MM-DD
updated: YYYY-MM-DD
type: reference
tags:
  - clipped
  - <topic tags: auto-detect 2-4 relevant tags from content>
aliases:
  - <short name or alternative title, if applicable>
---
```

## Field Rules

- `title`: Use the page's `<title>` or `<h1>`. Keep original language. Remove site name suffixes like " | Medium" or " - 知乎".
- `source`: The exact URL provided by the user.
- `clipped`: Today's date in YYYY-MM-DD format.
- `type`: Always `reference` for clipped content.
- `tags`: Always include `clipped`. Auto-detect 2-4 topic tags from content (e.g., `AI`, `marketing`, `tiktok`, `tutorial`). Use lowercase. Use user-provided tags if any.
- `aliases`: Optional. Add a short name if the title is very long.

## Filename Convention

- Chinese titles: keep Chinese characters, replace spaces and special chars with hyphens
- English titles: kebab-case
- Examples:
  - `AI-Agents-从零开始学习指南.md`
  - `TikTok-广告投放完整教程.md`
  - `how-to-build-a-landing-page.md`
