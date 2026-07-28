import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { SheetGateway } from '../src/sheet-gateway.mjs';

const WEB_APP_URL = 'https://script.google.com/macros/s/example/exec';
const keywordJob = {
  mode: 'keyword',
  input: 'astrology',
  language: 'en',
  region: 'us',
  requestedLimit: 200,
  targetDomain: 'target.example',
};

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

test('createJob sends one typed action payload to Apps Script', async () => {
  const calls = [];
  const gateway = new SheetGateway({
    url: WEB_APP_URL,
    sharedSecret: 'sheet-secret',
    fetchFn: async (url, options) => {
      calls.push({ url, options });
      return jsonResponse({ ok: true, job: { id: 'job_1', status: 'queued' } });
    },
  });

  assert.deepEqual(await gateway.createJob(keywordJob), { id: 'job_1', status: 'queued' });
  assert.equal(calls[0].url, WEB_APP_URL);
  assert.deepEqual(JSON.parse(calls[0].options.body), { action: 'createJob', job: keywordJob, shared_secret: 'sheet-secret' });
});

test('Gateway errors redact the shared secret', async () => {
  const gateway = new SheetGateway({
    url: WEB_APP_URL,
    sharedSecret: 'sheet-secret',
    fetchFn: async () => jsonResponse({ ok: false, error: 'Invalid shared secret: sheet-secret' }, 403),
  });

  await assert.rejects(() => gateway.listResources({ view: 'keyword' }), (error) => {
    assert.match(error.message, /Sheet Gateway failed \(403\): Invalid shared secret: \[redacted\]/);
    assert.equal(error.message.includes('sheet-secret'), false);
    return true;
  });
});

test('completeJob sends result rows and exposes result read and ack actions', async () => {
  const actions = [];
  const gateway = new SheetGateway({
    url: WEB_APP_URL,
    sharedSecret: 'sheet-secret',
    fetchFn: async (_url, options) => {
      const payload = JSON.parse(options.body);
      actions.push(payload);
      if (payload.action === 'getJobResult') {
        return jsonResponse({ ok: true, records: [{ 原URL: 'https://source.example/' }] });
      }
      if (payload.action === 'ackJobResult') {
        return jsonResponse({ ok: true, result: { deleted: 1 } });
      }
      return jsonResponse({ ok: true, job: { id: 'job_1', status: 'completed' } });
    },
  });

  await gateway.completeJob({
    jobId: 'job_1',
    summary: { qualified: 1 },
    resultRows: [{ 原URL: 'https://source.example/' }],
  });
  assert.deepEqual(await gateway.getJobResult({ jobId: 'job_1' }), [{ 原URL: 'https://source.example/' }]);
  assert.deepEqual(await gateway.ackJobResult({ jobId: 'job_1' }), { deleted: 1 });
  assert.deepEqual(actions.map((payload) => payload.action), ['completeJob', 'getJobResult', 'ackJobResult']);
  assert.deepEqual(actions[0].resultRows, [{ 原URL: 'https://source.example/' }]);
});
