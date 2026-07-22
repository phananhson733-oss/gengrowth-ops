import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { fromSerpResult } from '../src/core.mjs';
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
