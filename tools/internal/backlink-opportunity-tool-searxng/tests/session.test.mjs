import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { issueSession, verifyAccessToken, verifySession } from '../src/session.mjs';

test('verifyAccessToken accepts only the exact shared link token', async () => {
  assert.equal(await verifyAccessToken({ candidate: 'correct-token', accessToken: 'correct-token' }), true);
  assert.equal(await verifyAccessToken({ candidate: 'wrong-token', accessToken: 'correct-token' }), false);
});

test('issued session expires without embedding the access token', async () => {
  const value = await issueSession({ sessionSecret: 'session-secret', now: () => 1_000 });

  assert.equal(value.includes('correct-token'), false);
  assert.equal(await verifySession({ value, sessionSecret: 'session-secret', now: () => 2_000 }), true);
  assert.equal(await verifySession({ value, sessionSecret: 'session-secret', now: () => 1_000 + 31 * 24 * 60 * 60 * 1_000 }), false);
});
