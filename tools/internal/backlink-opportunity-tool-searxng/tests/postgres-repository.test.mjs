import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { PostgresRepository } from '../src/postgres-repository.mjs';

function createDatabase() {
  const opportunities = new Map();
  const sources = new Map();
  return {
    opportunities,
    sources,
    async upsertOpportunity(record) {
      const existed = opportunities.has(record.referring_page_url);
      opportunities.set(record.referring_page_url, record);
      return { id: record.referring_page_url, created: !existed };
    },
    async upsertSource(opportunityId, source) {
      sources.set(`${opportunityId}:${source.mode}:${source.input}`, { opportunityId, ...source });
    },
    async listOpportunities({ view }) {
      const mode = view === 'competitor' ? 'competitor_search' : 'keyword';
      const ids = new Set([...sources.values()].filter((source) => source.mode === mode).map((source) => source.opportunityId));
      return [...opportunities.entries()].filter(([id]) => ids.has(id)).map(([, record]) => record);
    },
  };
}

test('repository stores a canonical resource once and exposes it in both source views', async () => {
  const database = createDatabase();
  const repository = new PostgresRepository({ database });
  const sharedUrl = 'https://publisher.example/resources';

  const result = await repository.upsertOpportunities([
    { referring_page_url: sharedUrl, sources: [{ mode: 'keyword', input: 'astrology', language: 'en', region: 'us' }] },
    { referring_page_url: sharedUrl, sources: [{ mode: 'competitor_search', input: 'astro.com', provider: 'searxng' }] },
  ]);

  assert.deepEqual(result, { created: 1, updated: 1 });
  assert.equal(database.opportunities.size, 1);
  assert.equal(database.sources.size, 2);
  assert.equal((await repository.listOpportunities({ view: 'keyword' })).length, 1);
  assert.equal((await repository.listOpportunities({ view: 'competitor' })).length, 1);
});

test('repository creates, completes, and retrieves a discovery job', async () => {
  const jobs = new Map();
  const database = {
    async upsertOpportunity() {},
    async upsertSource() {},
    async listOpportunities() { return []; },
    async createJob(input) {
      const job = { id: 'job-1', status: 'queued', ...input };
      jobs.set(job.id, job);
      return job;
    },
    async getJob(jobId) { return jobs.get(jobId) ?? null; },
    async completeJob(jobId, summary) {
      jobs.set(jobId, { ...jobs.get(jobId), status: 'completed', summary });
    },
  };
  const repository = new PostgresRepository({ database });

  const job = await repository.createJob({ mode: 'keyword', input: 'astrology', language: 'en', region: 'us', requestedLimit: 200 });
  await repository.completeJob(job.id, { retrieved: 200, deduplicated: 180, qualified: 160, rejected: 20, created: 160 });

  assert.deepEqual(await repository.getJob(job.id), {
    id: 'job-1',
    status: 'completed',
    mode: 'keyword',
    input: 'astrology',
    language: 'en',
    region: 'us',
    requestedLimit: 200,
    summary: { retrieved: 200, deduplicated: 180, qualified: 160, rejected: 20, created: 160 },
  });
});
