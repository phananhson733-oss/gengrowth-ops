import { strict as assert } from 'node:assert';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

import { toCsv } from '../src/core.mjs';
import { migrateCsv } from '../scripts/migrate-csv-to-postgres.mjs';

test('CSV migration sends resources and task runs once to the repository', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'backlink-csv-migration-'));
  const opportunitiesPath = join(directory, 'backlink-opportunities.csv');
  const runsPath = join(directory, 'task-runs.csv');
  const resources = [];
  const runs = [];
  const repository = {
    async upsertOpportunities(records) {
      resources.push(...records);
      return { created: records.length, updated: 0 };
    },
    async importRun(run) {
      runs.push(run);
      return { created: true };
    },
  };

  try {
    await writeFile(opportunitiesPath, toCsv([{
      id: 'lead-1',
      referring_page_url: 'https://publisher.example/resources',
      referring_domain: 'publisher.example',
      page_title: 'Resources',
      snippet: '',
      source_mode: 'keyword',
      source_input: 'astrology',
      sources: [{ mode: 'keyword', input: 'astrology', language: 'en', region: 'us' }],
      discovered_at: '2026-07-22T00:00:00.000Z',
      last_checked_at: '2026-07-22T00:00:00.000Z',
      machine_status: 'qualified',
      opportunity_type: 'resource_page',
      domain_dr: null,
      dr_source: 'unknown',
      safety_category: 'passed',
      quality_priority: 'normal',
      exclude_reason: '',
      competitor_domain: '',
      competitor_target_url: '',
      anchor_text: '',
      link_attribute: '',
      external_link_count: null,
    }]), 'utf8');
    await writeFile(runsPath, [
      'run_id,mode,input,received_count,qualified_count,rejected_count,created_at',
      'run_1,keyword,astrology,1,1,0,2026-07-22T00:00:00.000Z',
      '',
    ].join('\n'), 'utf8');

    const result = await migrateCsv({ repository, opportunitiesPath, runsPath });

    assert.deepEqual(result, { resources: { created: 1, updated: 0 }, runs: { created: 1, skipped: 0 } });
    assert.equal(resources.length, 1);
    assert.deepEqual(runs, [{ run_id: 'run_1', mode: 'keyword', input: 'astrology', received_count: 1, qualified_count: 1, rejected_count: 0, created_at: '2026-07-22T00:00:00.000Z' }]);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
