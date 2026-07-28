import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { createPostgresDatabase } from '../src/postgres-adapter.mjs';

test('Postgres adapter upserts a canonical URL and its typed source without exposing values in SQL text', async () => {
  const calls = [];
  const sql = {
    async unsafe(statement, values) {
      calls.push({ statement, values });
      return statement.includes('returning id') ? [{ id: 'opportunity-1', created: true }] : [];
    },
  };
  const database = createPostgresDatabase({ sql });
  const opportunity = await database.upsertOpportunity({ referring_page_url: 'https://publisher.example/resources', sources: [] });
  await database.upsertSource(opportunity.id, { mode: 'keyword', input: 'astrology', language: 'en' });

  assert.deepEqual(opportunity, { id: 'opportunity-1', created: true });
  assert.equal(calls.length, 2);
  assert.match(calls[0].statement, /on conflict \(canonical_url\)/i);
  assert.match(calls[1].statement, /on conflict \(opportunity_id, mode, input\)/i);
  assert.equal(calls[0].statement.includes('publisher.example'), false);
  assert.deepEqual(calls[0].values.slice(0, 1), ['https://publisher.example/resources']);
});

test('Postgres adapter maps view and job lifecycle operations to parameterized statements', async () => {
  const calls = [];
  const sql = {
    async unsafe(statement, values) {
      calls.push({ statement, values });
      if (statement.includes('insert into discovery_jobs')) return [{ id: 'job-1', status: 'queued' }];
      if (statement.includes('select o.payload')) return [{ payload: { referring_page_url: 'https://publisher.example/resources' } }];
      if (statement.includes('select id, mode')) return [{ id: 'job-1', mode: 'keyword', input: 'astrology', status: 'queued', summary: {} }];
      return [];
    },
  };
  const database = createPostgresDatabase({ sql });

  assert.deepEqual(await database.createJob({ mode: 'keyword', input: 'astrology', language: 'en', region: 'us', requestedLimit: 200 }), { id: 'job-1', status: 'queued' });
  assert.deepEqual(await database.listOpportunities({ view: 'competitor' }), [{ referring_page_url: 'https://publisher.example/resources' }]);
  assert.deepEqual(await database.getJob('job-1'), { id: 'job-1', mode: 'keyword', input: 'astrology', status: 'queued', summary: {} });
  await database.completeJob('job-1', { retrieved: 1, deduplicated: 1, qualified: 1, rejected: 0, created: 1 });

  const listCall = calls.find((call) => /select o\.payload/.test(call.statement));
  assert.equal(listCall.statement.includes('competitor_search'), false);
  assert.deepEqual(listCall.values, ['competitor_search']);
  assert.equal(calls.some((call) => /update discovery_jobs/.test(call.statement)), true);
  assert.equal(calls.every((call) => !call.statement.includes('astrology')), true);
});
