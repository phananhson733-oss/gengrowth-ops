import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import {
  emptyViewStates,
  exportFilename,
  groupResources,
  pollJob,
  replaceCompletedView,
} from '../app/client-logic.mjs';

const records = [
  { id: 'keyword-only', sources: [{ mode: 'keyword', input: 'astrology' }] },
  { id: 'competitor-only', sources: [{ mode: 'competitor_search', input: 'astro.com' }] },
  { id: 'dual-source', sources: [{ mode: 'keyword', input: 'astrology' }, { mode: 'competitor_search', input: 'astro.com' }] },
];

test('groupResources shows a dual-source record once in each matching view', () => {
  assert.deepEqual(groupResources(records, 'keyword').map((record) => record.id), ['keyword-only', 'dual-source']);
  assert.deepEqual(groupResources(records, 'competitor').map((record) => record.id), ['competitor-only', 'dual-source']);
});

test('pollJob stops at completion and returns the real task summary', async () => {
  const summary = { retrieved: 200, deduplicated: 190, qualified: 170, rejected: 20, created: 169 };
  const responses = [{ status: 'queued' }, { status: 'running' }, { status: 'completed', summary }];

  const result = await pollJob({ jobId: 'job_1', fetchJob: async () => responses.shift(), wait: async () => {} });

  assert.deepEqual(result, { status: 'completed', summary });
});

test('pollJob keeps polling when a newly created job is temporarily not visible', async () => {
  const summary = { retrieved: 100, deduplicated: 95, qualified: 50, rejected: 45, created: 50 };
  let attempts = 0;
  let waits = 0;

  const result = await pollJob({
    jobId: 'job_18',
    fetchJob: async () => {
      attempts += 1;
      if (attempts < 3) throw new Error('Job not found');
      return { status: 'completed', summary };
    },
    wait: async () => { waits += 1; },
  });

  assert.deepEqual(result, { status: 'completed', summary });
  assert.equal(waits, 2);
});

test('replaceCompletedView only replaces the selected mode result', () => {
  const initial = emptyViewStates();
  const keyword = replaceCompletedView(initial, 'keyword', {
    records: [{ 原URL: 'https://keyword.example/' }],
    summary: { qualified: 1 },
  });
  const both = replaceCompletedView(keyword, 'competitor', {
    records: [{ 原URL: 'https://competitor.example/' }],
    summary: { qualified: 1 },
  });

  assert.equal(both.keyword.records[0].原URL, 'https://keyword.example/');
  assert.equal(both.competitor.records[0].原URL, 'https://competitor.example/');
  assert.deepEqual(initial.keyword.records, []);
});

test('exportFilename contains the view, target domain and UTC timestamp', () => {
  assert.equal(
    exportFilename({
      view: 'keyword',
      targetDomain: 'target.example',
      now: new Date('2026-07-23T07:30:45Z'),
    }),
    'backlink-keyword-target.example-20260723-073045.csv',
  );
});
