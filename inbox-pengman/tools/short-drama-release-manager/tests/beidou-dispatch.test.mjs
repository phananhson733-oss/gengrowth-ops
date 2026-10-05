import assert from 'node:assert/strict';
import test from 'node:test';

import { createDispatcher, exitCodeFor, parseCommand } from '../shortdrama_ctl.mjs';

test('existing five-minute queue drain also runs the bounded Beidou pool worker', async () => {
  let calls = 0;
  const runtime = {
    jobs: { claimNext: () => null, listUndeliveredTerminal: () => [] },
    processBeidouPool: async () => { calls++; return { status: 'success', updated: 1, ambiguous: 0 }; },
    projectDailyViews: async () => ({ status: 'disabled' }),
    projectAnalytics: async () => ({ status: 'disabled' }),
  };
  const result = await createDispatcher(runtime)(parseCommand(['queue', 'drain', '--config', 'runtime.json']), {}, null);
  assert.equal(calls, 1);
  assert.equal(result.beidou_pool.updated, 1);
});

test('Beidou partial failures make the scheduled command visibly partial', async () => {
  const runtime = {
    jobs: { claimNext: () => null, listUndeliveredTerminal: () => [] },
    processBeidouPool: async () => ({ status: 'partial', errors: 1 }),
  };
  const result = await createDispatcher(runtime)(parseCommand(['queue', 'drain', '--config', 'runtime.json']), {}, null);
  assert.equal(result.status, 'partial');
  assert.equal(result.beidou_pool.errors, 1);
  assert.equal(exitCodeFor({ ...result, state: 'success' }), 2);
});

test('an unrelated analytics failure retains the Beidou tick result in its error details', async () => {
  const runtime = {
    jobs: { claimNext: () => null, listUndeliveredTerminal: () => [] },
    processBeidouPool: async () => ({ status: 'success', updated: 2 }),
    projectAnalytics: async () => { const error = new Error('unrelated'); error.code = 'analytics_invalid'; throw error; },
  };
  await assert.rejects(() => createDispatcher(runtime)(parseCommand(['queue', 'drain', '--config', 'runtime.json']), {}, null),
    (error) => error.details?.beidou_pool?.updated === 2);
});

test('Social Bot can request Beidou title candidates read-only without enabling Base writes', async () => {
  const command = parseCommand(['pool', 'beidou-search', '--config', 'runtime.json', '--payload', '-']);
  let title = null;
  const runtime = {
    assertRuntimeSchemaReady: async () => { throw new Error('Base schema must not gate external read'); },
    queryBeidouCandidates: async ({ title: input }) => { title = input; return { status: 'success', match_status: 'selected', source: 'beidou', total: 1,
      candidates: [{ title: input, platform: 'reelshort', publishAt: '2026-09-23 09:50:00' }] }; },
  };
  const result = await createDispatcher(runtime)(command, { mode: 'social', actorId: 'ou_reader', chatId: 'oc_chat' },
    { title: 'The Janitor Who Solved the Impossible' });
  assert.equal(title, 'The Janitor Who Solved the Impossible');
  assert.equal(result.candidates.length, 1);
  assert.equal(result.source, 'beidou');
  await assert.rejects(() => createDispatcher(runtime)(command, {}, { title: 'Example', extra: true }),
    (error) => error.code === 'input_invalid');
  assert.throws(() => parseCommand(['pool', 'beidou-search', '--config', 'runtime.json', '--title', 'Example']),
    (error) => error.code === 'input_invalid');
});
