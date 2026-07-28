import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import {
  accessRoute,
  ackJobResultRoute,
  createDiscoveryRoute,
  jobResultRoute,
  opportunitiesRoute,
} from '../src/vercel-routes.mjs';

function jsonRequest(body) {
  return new Request('https://tool.example/api/discover/keyword', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
}

test('valid access link returns a session bridge without placing the token in its cookie', async () => {
  const response = await accessRoute({ token: 'correct-token', accessToken: 'correct-token', sessionSecret: 'session-secret', now: () => 1_000 });

  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /text\/html/);
  assert.match(response.headers.get('set-cookie'), /HttpOnly; Secure; SameSite=Lax/);
  assert.equal(response.headers.get('set-cookie').includes('correct-token'), false);
  const html = await response.text();
  assert.match(html, /location\.replace\(['"]\/['"]\)/);
  assert.match(html, /href="\/"/);
});

test('discover rejects an invalid mode without creating a task', async () => {
  const jobs = [];
  const response = await createDiscoveryRoute({ mode: 'invalid', request: jsonRequest({}), gateway: { async createJob(job) { jobs.push(job); } } });

  assert.equal(response.status, 404);
  assert.deepEqual(jobs, []);
});

test('opportunities selects the requested Sheet source view', async () => {
  const requested = [];
  const response = await opportunitiesRoute({ request: new Request('https://tool.example/api/opportunities?view=competitor'), gateway: { async listResources(value) { requested.push(value); return [{ id: 'dual-source' }]; } } });

  assert.deepEqual(await response.json(), { records: [{ id: 'dual-source' }] });
  assert.deepEqual(requested, [{ view: 'competitor' }]);
});

test('discover normalises targetDomain before creating the task', async () => {
  const jobs = [];
  const response = await createDiscoveryRoute({
    mode: 'keyword',
    request: jsonRequest({
      keyword: 'astrology',
      targetDomain: 'https://Target.Example/path',
      limit: 50,
    }),
    gateway: { async createJob(value) { jobs.push(value); return { id: 'job_1' }; } },
  });

  assert.equal(response.status, 202);
  assert.equal(jobs[0].targetDomain, 'target.example');
});

test('discover rejects a missing targetDomain without creating a task', async () => {
  const jobs = [];
  const response = await createDiscoveryRoute({
    mode: 'keyword',
    request: jsonRequest({ keyword: 'astrology', limit: 50 }),
    gateway: { async createJob(value) { jobs.push(value); } },
  });

  assert.equal(response.status, 400);
  assert.deepEqual(jobs, []);
  assert.match((await response.json()).error, /目标域名格式不正确/);
});

test('job result routes read and acknowledge one job only', async () => {
  const calls = [];
  const gateway = {
    async getJobResult(value) {
      calls.push(['get', value]);
      return [{ 原URL: 'https://source.example/' }];
    },
    async ackJobResult(value) {
      calls.push(['ack', value]);
      return { deleted: 1 };
    },
  };

  assert.deepEqual(await (await jobResultRoute({ jobId: 'job_1', gateway })).json(), {
    records: [{ 原URL: 'https://source.example/' }],
  });
  assert.deepEqual(await (await ackJobResultRoute({ jobId: 'job_1', gateway })).json(), { deleted: 1 });
  assert.deepEqual(calls, [['get', { jobId: 'job_1' }], ['ack', { jobId: 'job_1' }]]);
});
