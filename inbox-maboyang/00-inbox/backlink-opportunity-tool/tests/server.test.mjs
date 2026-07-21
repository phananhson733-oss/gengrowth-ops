import { strict as assert } from 'node:assert';
import { once } from 'node:events';
import { test } from 'node:test';

import { createBacklinkServer } from '../server.mjs';

async function withServer(options, run) {
  const server = createBacklinkServer(options);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const { port } = server.address();
  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
}

function makeOptions() {
  return {
    config: {
      serpApiKey: 'serp-secret-must-never-reach-browser',
      ahrefsApiKey: 'ahrefs-secret-must-never-reach-browser',
      googleSheetWebAppUrl: '',
      googleSheetSharedSecret: '',
    },
    services: {
      discoverKeyword: async () => [],
      discoverCompetitor: async () => [],
      inspectPages: async ({ records }) => records,
      enrichDomainRatings: async ({ records }) => records,
      syncGoogleSheet: async () => ({ inserted: 0 }),
    },
    repository: {
      list: async () => [],
      listRuns: async () => [],
      upsert: async () => ({ records: [], created: 0, updated: 0 }),
      logRun: async () => {},
    },
  };
}

test('health endpoint reports configured capabilities but never raw API secrets', async () => {
  await withServer(makeOptions(), async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/health`);
    const body = await response.json();
    const serialized = JSON.stringify(body);

    assert.equal(response.status, 200);
    assert.deepEqual(body.capabilities, {
      keyword_discovery: true,
      competitor_discovery: true,
      google_sheet_sync: false,
    });
    assert.equal(serialized.includes('serp-secret-must-never-reach-browser'), false);
    assert.equal(serialized.includes('ahrefs-secret-must-never-reach-browser'), false);
  });
});

test('root endpoint serves a local interface with keyword and competitor input modes', async () => {
  await withServer(makeOptions(), async (baseUrl) => {
    const response = await fetch(`${baseUrl}/`);
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.match(html, /data-mode="keyword"/);
    assert.match(html, /data-mode="competitor"/);
    assert.match(html, /id="keyword"/);
    assert.match(html, /id="competitor-domain"/);
    assert.equal(html.includes('SERPAPI_API_KEY'), false);
    assert.equal(html.includes('AHREFS_API_KEY'), false);
  });
});

test('keyword discovery rejects an empty keyword before calling any provider', async () => {
  let called = false;
  const options = makeOptions();
  options.services.discoverKeyword = async () => {
    called = true;
    return [];
  };

  await withServer(options, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/discover/keyword`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ keyword: '  ' }),
    });

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: 'keyword is required' });
    assert.equal(called, false);
  });
});

test('competitor discovery rejects a product name and requires a resolvable domain', async () => {
  await withServer(makeOptions(), async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/discover/competitor`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ competitorDomain: 'Some Product Name' }),
    });

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: 'competitorDomain must be a domain or URL' });
  });
});

test('Google Sheet sync forwards opportunities and task runs without exposing any service key', async () => {
  let synced;
  const options = makeOptions();
  options.config.googleSheetWebAppUrl = 'https://script.google.com/macros/s/example/exec';
  options.config.googleSheetSharedSecret = 'sheet-shared-secret';
  options.repository.list = async () => [{ id: 'qualified', machine_status: 'qualified' }];
  options.repository.listRuns = async () => [{ run_id: 'run_1', mode: 'keyword' }];
  options.services.syncGoogleSheet = async (input) => {
    synced = input;
    return { ok: true, inserted: 2 };
  };

  await withServer(options, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/sync/google-sheet`, { method: 'POST' });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true, inserted: 2 });
  });

  assert.deepEqual(synced.records.map((record) => record.id), ['qualified']);
  assert.deepEqual(synced.runs.map((run) => run.run_id), ['run_1']);
  assert.equal(synced.sharedSecret, 'sheet-shared-secret');
  assert.equal(JSON.stringify(synced).includes('serp-secret-must-never-reach-browser'), false);
});
