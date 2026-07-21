import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import {
  canonicalizeUrl,
  classifyOpportunity,
  evaluateSafety,
  fromAhrefsBacklink,
  fromCompetitorSearchResult,
  fromSerpResult,
  mergeOpportunities,
  parseCsv,
  toCsv,
} from '../src/core.mjs';

test('canonicalizeUrl lowercases the host and removes fragments and tracking parameters', () => {
  assert.equal(
    canonicalizeUrl('HTTPS://Example.COM/Resources/?utm_source=google&keep=1#section'),
    'https://example.com/Resources?keep=1'
  );
});

test('evaluateSafety rejects explicit gambling content before it can enter the resource library', () => {
  const result = evaluateSafety({
    url: 'https://example.com/best-casino-bonus',
    title: 'Best casino bonus',
    snippet: 'A gaming guide',
  });

  assert.deepEqual(result, {
    status: 'rejected',
    category: 'gambling',
    reason: 'matched:casino',
  });
});

test('classifyOpportunity identifies broad backlink opportunities instead of assuming every page is a blog comment page', () => {
  assert.equal(
    classifyOpportunity({
      url: 'https://example.com/write-for-us',
      title: 'Write for Us — Submit a Guest Post',
      snippet: '',
    }),
    'guest_post'
  );
  assert.equal(
    classifyOpportunity({
      url: 'https://example.com/resources/astrology-tools',
      title: 'Recommended astrology resources',
      snippet: '',
    }),
    'resource_page'
  );
});

test('fromSerpResult creates a keyword-sourced candidate with an auditable source', () => {
  const result = fromSerpResult(
    {
      link: 'https://Example.com/submit-tool?utm_source=ignored',
      title: 'Submit your tool',
      snippet: 'Add your AI tool to our directory.',
    },
    { keyword: 'AI writing tools', language: 'en', region: 'us' }
  );

  assert.equal(result.referring_page_url, 'https://example.com/submit-tool');
  assert.equal(result.source_mode, 'keyword');
  assert.equal(result.sources[0].input, 'AI writing tools');
  assert.equal(result.opportunity_type, 'tool_directory');
  assert.equal(result.machine_status, 'qualified');
  assert.equal(result.domain_dr, null);
  assert.equal(result.dr_source, 'unknown');
});

test('fromAhrefsBacklink retains the competitor target page, anchor text, and link relation', () => {
  const result = fromAhrefsBacklink(
    {
      url_from: 'https://publisher.example.com/best-tools',
      url_to: 'https://competitor.example.com/product',
      anchor: 'Competitor Product',
      nofollow: false,
      is_ugc: false,
      is_sponsored: false,
      title: 'Best tools for creators',
      links_external: 22,
    },
    { competitorDomain: 'competitor.example.com' }
  );

  assert.equal(result.source_mode, 'competitor');
  assert.equal(result.competitor_domain, 'competitor.example.com');
  assert.equal(result.competitor_target_url, 'https://competitor.example.com/product');
  assert.equal(result.anchor_text, 'Competitor Product');
  assert.equal(result.link_attribute, 'dofollow');
  assert.equal(result.external_link_count, 22);
});

test('fromCompetitorSearchResult keeps competitor search evidence without inventing link metrics', () => {
  const result = fromCompetitorSearchResult(
    {
      url: 'https://publisher.example.com/best-ai-tools?utm_source=searxng',
      title: 'Best AI tools for teams',
      content: 'A comparison that mentions Competitor Product.',
    },
    { competitorDomain: 'competitor.example.com', provider: 'searxng' }
  );

  assert.equal(result.source_mode, 'competitor_search');
  assert.equal(result.competitor_domain, 'competitor.example.com');
  assert.equal(result.domain_dr, null);
  assert.equal(result.dr_source, 'unknown');
  assert.equal(result.sources[0].provider, 'searxng');
  assert.equal(result.referring_page_url, 'https://publisher.example.com/best-ai-tools');
});

test('mergeOpportunities keeps one page record and preserves all discovery sources', () => {
  const existing = fromSerpResult(
    { link: 'https://example.com/resources', title: 'Resources', snippet: '' },
    { keyword: 'astrology resources', language: 'en', region: 'us' }
  );
  const duplicate = fromSerpResult(
    { link: 'https://EXAMPLE.com/resources/', title: 'Resources', snippet: '' },
    { keyword: 'spiritual resources', language: 'en', region: 'us' }
  );

  const merged = mergeOpportunities([existing], [duplicate]);

  assert.equal(merged.length, 1);
  assert.deepEqual(
    merged[0].sources.map((source) => source.input),
    ['astrology resources', 'spiritual resources']
  );
});

test('CSV output round-trips a quoted title and multiple sources', () => {
  const record = fromSerpResult(
    { link: 'https://example.com/resources', title: 'Tools, "guides" and resources', snippet: '' },
    { keyword: 'astrology resources', language: 'en', region: 'us' }
  );

  assert.deepEqual(parseCsv(toCsv([record])), [record]);
});
