import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { buildGoogleSheetPayload, syncGoogleSheet } from '../src/google-sheet.mjs';

test('buildGoogleSheetPayload routes usable candidates, excluded candidates, and task runs to separate tabs', () => {
  const payload = buildGoogleSheetPayload({
    records: [
      { id: '1', machine_status: 'qualified', referring_page_url: 'https://good.example/' },
      { id: '2', machine_status: 'review', referring_page_url: 'https://review.example/' },
      { id: '3', machine_status: 'rejected', referring_page_url: 'https://bad.example/', exclude_reason: 'matched:casino' },
    ],
    runs: [{ run_id: 'run_1', mode: 'keyword', input: 'AI tools' }],
  });

  assert.deepEqual(payload.resources.map((record) => record.id), ['1', '2']);
  assert.deepEqual(payload.rejected.map((record) => record.id), ['3']);
  assert.deepEqual(payload.task_runs.map((run) => run.run_id), ['run_1']);
});

test('syncGoogleSheet posts only the typed resource payload to the configured Web App', async () => {
  let request;
  const result = await syncGoogleSheet({
    url: 'https://script.google.com/macros/s/example/exec',
    sharedSecret: 'sheet-shared-secret',
    records: [{ id: '1', machine_status: 'qualified', referring_page_url: 'https://good.example/' }],
    runs: [],
    fetchFn: async (url, options) => {
      request = { url, options };
      return new Response(JSON.stringify({ ok: true, inserted: 1 }), { status: 200, headers: { 'content-type': 'application/json' } });
    },
  });

  assert.equal(request.url, 'https://script.google.com/macros/s/example/exec');
  assert.equal(request.options.headers['content-type'], 'application/json');
  assert.deepEqual(JSON.parse(request.options.body).resources.map((record) => record.id), ['1']);
  assert.equal(JSON.parse(request.options.body).shared_secret, 'sheet-shared-secret');
  assert.deepEqual(result, { ok: true, inserted: 1 });
});
