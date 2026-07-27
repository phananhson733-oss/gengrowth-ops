import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { fromCompetitorSearchResult, fromSerpResult } from '../src/core.mjs';
import { inspectCandidatePage } from '../src/page-inspector.mjs';

function candidate() {
  return fromSerpResult(
    { link: 'https://safe.example/resources', title: 'Safe resources', snippet: 'Useful tools' },
    { keyword: 'useful tools', language: 'en', region: 'us' }
  );
}

test('inspectCandidatePage rejects a candidate when toxic content only appears in the fetched page body', async () => {
  const result = await inspectCandidatePage(candidate(), {
    fetchFn: async () => new Response(`
      <html><head><title>Resource collection</title></head>
      <body><p>Browse the best casino bonus offers.</p><a href="/about">About</a><a href="https://partner.example/offer">Partner</a></body></html>
    `, { status: 200, headers: { 'content-type': 'text/html' } }),
  });

  assert.equal(result.machine_status, 'rejected');
  assert.equal(result.safety_category, 'gambling');
  assert.equal(result.external_link_count, 1);
  assert.equal(result.inspection_status, 'checked');
});

test('inspectCandidatePage moves an unavailable page to review instead of leaving it qualified', async () => {
  const result = await inspectCandidatePage(candidate(), {
    fetchFn: async () => {
      throw new Error('network unavailable');
    },
  });

  assert.equal(result.machine_status, 'review');
  assert.equal(result.quality_priority, 'review');
  assert.equal(result.inspection_status, 'unavailable');
  assert.match(result.inspection_note, /network unavailable/);
});

test('inspectCandidatePage verifies a competitor link found in the local page HTML', async () => {
  const candidateRecord = fromCompetitorSearchResult(
    { url: 'https://publisher.example.com/roundup', title: 'Tool roundup', content: '' },
    { competitorDomain: 'competitor.example.com', provider: 'searxng' }
  );

  const result = await inspectCandidatePage(candidateRecord, {
    fetchFn: async () => new Response(`
      <html><head><title>Tool roundup</title></head>
      <body><a href="https://competitor.example.com/product">Competitor Product</a></body></html>
    `, { status: 200, headers: { 'content-type': 'text/html' } }),
  });

  assert.equal(result.inspection_status, 'checked');
  assert.equal(result.competitor_target_url, 'https://competitor.example.com/product');
  assert.equal(result.anchor_text, 'Competitor Product');
  assert.equal(result.inspection_note, 'competitor_link_verified');
});

test('inspectCandidatePage routes unverified competitor-search leads to review', async () => {
  const candidateRecord = fromCompetitorSearchResult(
    { url: 'https://publisher.example.com/roundup', title: 'Tool roundup', content: '' },
    { competitorDomain: 'competitor.example.com', provider: 'searxng' }
  );

  const result = await inspectCandidatePage(candidateRecord, {
    fetchFn: async () => new Response('<html><body><a href="https://other.example/tool">Other tool</a></body></html>', {
      status: 200,
      headers: { 'content-type': 'text/html' },
    }),
  });

  assert.equal(result.machine_status, 'review');
  assert.equal(result.quality_priority, 'review');
  assert.equal(result.inspection_status, 'target_not_found');
  assert.equal(result.inspection_note, 'competitor_link_not_found');
});

test('inspectCandidatePage falls back to a configured Firecrawl instance only after direct fetching fails', async () => {
  const requests = [];
  const result = await inspectCandidatePage(candidate(), {
    firecrawlBaseUrl: 'http://firecrawl.test',
    fetchFn: async (url, options = {}) => {
      requests.push({ url: String(url), method: options.method || 'GET' });
      if (options.method !== 'POST') throw new Error('direct fetch unavailable');
      return new Response(JSON.stringify({
        data: {
          html: '<html><head><title>Rendered resources</title></head><body><a href="https://partner.example/tool">Partner</a></body></html>',
          metadata: { sourceURL: 'https://safe.example/resources' },
        },
      }), { status: 200, headers: { 'content-type': 'application/json' } });
    },
  });

  assert.deepEqual(requests, [
    { url: 'https://safe.example/resources', method: 'GET' },
    { url: 'http://firecrawl.test/v2/scrape', method: 'POST' },
  ]);
  assert.equal(result.inspection_status, 'checked');
  assert.equal(result.page_title, 'Rendered resources');
  assert.equal(result.external_link_count, 1);
  assert.equal(result.inspection_note, 'firecrawl_fallback');
});

test('inspectCandidatePage gives Firecrawl a fresh timeout signal after the direct request times out', async () => {
  const result = await inspectCandidatePage(candidate(), {
    firecrawlBaseUrl: 'http://firecrawl.test',
    timeoutMs: 1,
    fetchFn: async (url, options = {}) => {
      if (options.method !== 'POST') {
        await new Promise((resolve, reject) => options.signal.addEventListener('abort', () => reject(new Error('direct request timed out')), { once: true }));
        return resolve();
      }
      assert.equal(options.signal.aborted, false);
      return new Response(JSON.stringify({
        data: { html: '<html><body>Rendered fallback</body></html>' },
      }), { status: 200, headers: { 'content-type': 'application/json' } });
    },
  });

  assert.equal(result.inspection_status, 'checked');
  assert.equal(result.inspection_note, 'firecrawl_fallback');
});
