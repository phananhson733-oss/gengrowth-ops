import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { inspectDeploymentConfig } from '../scripts/deploy-preflight.mjs';

test('preflight reports only Sheet deployment variable names and never environment values', () => {
  const result = inspectDeploymentConfig({ env: { DATABASE_URL: 'postgres://user:secret@db.example/tool' } });

  assert.deepEqual(result.missing, [
    'BACKLINK_ACCESS_TOKEN',
    'BACKLINK_SESSION_SECRET',
    'SEARXNG_BASE_URL',
    'SEARXNG_SECRET',
    'GOOGLE_SHEET_WEBAPP_URL',
    'GOOGLE_SHEET_SHARED_SECRET',
  ]);
  assert.equal(result.ok, false);
  assert.equal(JSON.stringify(result).includes('postgres://user:secret@db.example/tool'), false);
});

test('preflight ignores a database URL when every Sheet deployment setting is present', () => {
  const result = inspectDeploymentConfig({
    env: {
      BACKLINK_ACCESS_TOKEN: 'access-token',
      BACKLINK_SESSION_SECRET: 'session-secret',
      DATABASE_URL: 'postgres://user:secret@db.example/tool',
      SEARXNG_BASE_URL: 'http://searxng:8080',
      SEARXNG_SECRET: 'searx-secret',
      GOOGLE_SHEET_WEBAPP_URL: 'https://script.google.com/macros/s/example/exec',
      GOOGLE_SHEET_SHARED_SECRET: 'sheet-secret',
    },
  });

  assert.deepEqual(result, { ok: true, missing: [] });
});

test('preflight does not require a database URL for a Sheet-only deployment', () => {
  const result = inspectDeploymentConfig({
    env: {
      BACKLINK_ACCESS_TOKEN: 'access-token',
      BACKLINK_SESSION_SECRET: 'session-secret',
      SEARXNG_BASE_URL: 'http://searxng:8080',
      SEARXNG_SECRET: 'searx-secret',
      GOOGLE_SHEET_WEBAPP_URL: 'https://script.google.com/macros/s/example/exec',
      GOOGLE_SHEET_SHARED_SECRET: 'sheet-secret',
    },
  });

  assert.deepEqual(result, { ok: true, missing: [] });
});
