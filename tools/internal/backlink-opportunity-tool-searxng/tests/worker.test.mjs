import { strict as assert } from 'node:assert';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

import { processOneJob } from '../worker/run.mjs';

const workerPath = new URL('../worker/run.mjs', import.meta.url);

test('processOneJob marks a claimed job failed when discovery throws', async () => {
  const failed = [];
  const gateway = {
    async claimJob() { return { id: 'job_1', mode: 'keyword' }; },
    async failJob(value) { failed.push(value); },
  };

  const result = await processOneJob({
    gateway,
    runJob: async () => { throw new Error('SearXNG unavailable'); },
  });

  assert.deepEqual(result, { id: 'job_1', status: 'failed' });
  assert.deepEqual(failed, [{ jobId: 'job_1', message: 'SearXNG unavailable' }]);
});

test('processOneJob leaves the queue untouched when no job is available', async () => {
  const result = await processOneJob({ gateway: { async claimJob() { return null; } }, runJob: async () => {} });

  assert.equal(result, null);
});

test('worker inspects expanded candidate pools with ten concurrent page requests', async () => {
  const source = await readFile(workerPath, 'utf8');

  assert.match(source, /const INSPECTION_CONCURRENCY = 10/);
  assert.match(source, /inspectCandidatePages\(records, \{ \.\.\.inspectionOptions, concurrency: INSPECTION_CONCURRENCY \}\)/);
});

test('worker applies the slow-search rate limit and retry bounds', async () => {
  const source = await readFile(workerPath, 'utf8');

  assert.match(source, /const SEARXNG_REQUEST_INTERVAL_MS = 5_000/);
  assert.match(source, /const SEARXNG_UNAVAILABLE_RETRY_DELAY_MS = 180_000/);
  assert.match(source, /const MAX_SEARXNG_UNAVAILABLE_RETRIES = 10/);
  assert.match(source, /const MAX_SEARXNG_JOB_DURATION_MS = 45 \* 60 \* 1_000/);
  assert.match(source, /unavailableRetryDelayMs: SEARXNG_UNAVAILABLE_RETRY_DELAY_MS/);
  assert.match(source, /maxUnavailableRetries: MAX_SEARXNG_UNAVAILABLE_RETRIES/);
  assert.match(source, /maxElapsedMs: MAX_SEARXNG_JOB_DURATION_MS/);
});
