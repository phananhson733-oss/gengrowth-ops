import { strict as assert } from 'node:assert';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

import { fromSerpResult } from '../src/core.mjs';
import { OpportunityRepository } from '../src/repository.mjs';

function candidate(keyword) {
  return fromSerpResult(
    { link: 'https://example.com/resources', title: 'Useful resources', snippet: '' },
    { keyword, language: 'en', region: 'us' }
  );
}

test('OpportunityRepository writes and reads the local master CSV', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'backlink-opportunity-'));
  const repository = new OpportunityRepository({ dataDirectory: directory, now: () => '2026-07-21T12:00:00.000Z' });

  const result = await repository.upsert([candidate('astrology resources')]);

  assert.equal(result.created, 1);
  const records = await repository.list();
  assert.equal(records.length, 1);
  assert.equal(records[0].discovered_at, '2026-07-21T12:00:00.000Z');
  assert.match(await readFile(join(directory, 'backlink-opportunities.csv'), 'utf8'), /referring_page_url/);
});

test('OpportunityRepository merges repeated URLs and retains each input source', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'backlink-opportunity-'));
  const repository = new OpportunityRepository({ dataDirectory: directory, now: () => '2026-07-21T12:00:00.000Z' });

  await repository.upsert([candidate('astrology resources')]);
  const result = await repository.upsert([candidate('spiritual resources')]);

  assert.equal(result.updated, 1);
  const [record] = await repository.list();
  assert.deepEqual(record.sources.map((source) => source.input), ['astrology resources', 'spiritual resources']);
});

test('OpportunityRepository logs a run with qualified and rejected counts', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'backlink-opportunity-'));
  const repository = new OpportunityRepository({ dataDirectory: directory, now: () => '2026-07-21T12:00:00.000Z' });

  await repository.logRun({
    mode: 'keyword',
    input: 'astrology resources',
    receivedCount: 12,
    qualifiedCount: 9,
    rejectedCount: 3,
  });

  const log = await readFile(join(directory, 'task-runs.csv'), 'utf8');
  assert.match(log, /keyword,astrology resources,12,9,3/);
});
