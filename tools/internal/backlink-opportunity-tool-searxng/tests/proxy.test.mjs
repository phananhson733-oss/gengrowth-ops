import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { proxy } from '../proxy.mjs';

process.env.BACKLINK_ACCESS_TOKEN = 'test-access-token';
process.env.BACKLINK_SESSION_SECRET = 'test-session-secret';
process.env.GOOGLE_SHEET_WEBAPP_URL = 'https://script.google.com/macros/s/test/exec';
process.env.GOOGLE_SHEET_SHARED_SECRET = 'test-sheet-secret';

function anonymousRequest(pathname) {
  return {
    nextUrl: { pathname },
    cookies: { get() { return undefined; } },
  };
}

test('proxy permits anonymous page and API requests for the shared tool', async () => {
  const pageResponse = await proxy(anonymousRequest('/'));
  const apiResponse = await proxy(anonymousRequest('/api/discover/keyword'));

  assert.equal(pageResponse.status, 200);
  assert.equal(apiResponse.status, 200);
});
