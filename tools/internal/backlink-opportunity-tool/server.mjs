import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  discoverSearxngCompetitorOpportunities,
  discoverSearxngKeywordOpportunities,
} from './src/providers.mjs';
import { syncGoogleSheet } from './src/google-sheet.mjs';
import { inspectCandidatePages } from './src/page-inspector.mjs';
import { OpportunityRepository } from './src/repository.mjs';

const APP_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const MAX_BODY_BYTES = 250_000;

function getConfig() {
  return {
    searxngBaseUrl: process.env.SEARXNG_BASE_URL ?? 'http://127.0.0.1:8080',
    firecrawlBaseUrl: process.env.FIRECRAWL_BASE_URL ?? '',
    firecrawlApiKey: process.env.FIRECRAWL_API_KEY ?? '',
    googleSheetWebAppUrl: process.env.GOOGLE_SHEET_WEBAPP_URL ?? '',
    googleSheetSharedSecret: process.env.GOOGLE_SHEET_SHARED_SECRET ?? '',
    dataDirectory: process.env.BACKLINK_DATA_DIR || join(APP_DIRECTORY, 'data'),
  };
}

function capabilities(config) {
  return {
    keyword_discovery: Boolean(String(config.searxngBaseUrl ?? '').trim()),
    competitor_discovery: Boolean(String(config.searxngBaseUrl ?? '').trim()),
    firecrawl_fallback: Boolean(String(config.firecrawlBaseUrl ?? '').trim()),
    google_sheet_sync: Boolean(config.googleSheetWebAppUrl && config.googleSheetSharedSecret),
  };
}

function json(response, status, body) {
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  });
  response.end(JSON.stringify(body));
}

function text(response, status, body, contentType = 'text/plain; charset=utf-8') {
  response.writeHead(status, { 'content-type': contentType, 'cache-control': 'no-store' });
  response.end(body);
}

async function parseBody(request) {
  let body = '';
  for await (const chunk of request) {
    body += chunk;
    if (Buffer.byteLength(body) > MAX_BODY_BYTES) {
      throw new Error('Request body is too large');
    }
  }
  if (!body) return {};
  try {
    return JSON.parse(body);
  } catch {
    throw new Error('Request body must be valid JSON');
  }
}

function normaliseLimit(value, fallback) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.max(1, Math.min(Math.floor(numeric), 1000)) : fallback;
}

function isDomainOrUrl(value) {
  const input = String(value ?? '').trim();
  if (!input || /\s/.test(input)) return false;
  try {
    const url = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`);
    return Boolean(url.hostname.includes('.'));
  } catch {
    return false;
  }
}

function counts(records) {
  return records.reduce((summary, record) => {
    summary.received += 1;
    if (record.machine_status === 'rejected') summary.rejected += 1;
    if (record.machine_status === 'qualified') summary.qualified += 1;
    return summary;
  }, { received: 0, qualified: 0, rejected: 0 });
}

async function serveIndex(response) {
  try {
    const html = await readFile(join(APP_DIRECTORY, 'public', 'index.html'), 'utf8');
    text(response, 200, html, 'text/html; charset=utf-8');
  } catch {
    text(response, 503, 'The HTML interface has not been installed yet.');
  }
}

function defaultServices(config) {
  return {
    discoverKeyword: (input) => discoverSearxngKeywordOpportunities({ ...input, baseUrl: config.searxngBaseUrl }),
    discoverCompetitor: (input) => discoverSearxngCompetitorOpportunities({ ...input, baseUrl: config.searxngBaseUrl }),
    inspectPages: ({ records }) => inspectCandidatePages(records, {
      firecrawlBaseUrl: config.firecrawlBaseUrl,
      firecrawlApiKey: config.firecrawlApiKey,
    }),
    syncGoogleSheet: ({ url, sharedSecret, records, runs }) => syncGoogleSheet({ url, sharedSecret, records, runs }),
  };
}

async function storeRun({ repository, mode, input, records }) {
  const result = await repository.upsert(records);
  const summary = counts(records);
  await repository.logRun({
    mode,
    input,
    receivedCount: summary.received,
    qualifiedCount: summary.qualified,
    rejectedCount: summary.rejected,
  });
  return { ...result, ...summary };
}

export function createBacklinkServer({ config = getConfig(), services = defaultServices(config), repository = new OpportunityRepository({ dataDirectory: config.dataDirectory }) } = {}) {
  return createServer(async (request, response) => {
    const url = new URL(request.url, 'http://127.0.0.1');
    try {
      if (request.method === 'GET' && url.pathname === '/') {
        await serveIndex(response);
        return;
      }
      if (request.method === 'GET' && url.pathname === '/api/health') {
        json(response, 200, { capabilities: capabilities(config) });
        return;
      }
      if (request.method === 'GET' && url.pathname === '/api/opportunities') {
        const status = url.searchParams.get('status');
        const records = await repository.list();
        json(response, 200, { records: status ? records.filter((record) => record.machine_status === status) : records });
        return;
      }
      if (request.method === 'POST' && url.pathname === '/api/discover/keyword') {
        const input = await parseBody(request);
        const keyword = String(input.keyword ?? '').trim();
        if (!keyword) {
          json(response, 400, { error: 'keyword is required' });
          return;
        }
        if (!String(config.searxngBaseUrl ?? '').trim()) {
          json(response, 409, { error: 'SEARXNG_BASE_URL is not configured' });
          return;
        }
        const records = await services.discoverKeyword({
          keyword,
          language: String(input.language ?? 'en'),
          region: String(input.region ?? 'us'),
          limit: normaliseLimit(input.limit, 50),
        });
        const inspected = await services.inspectPages({ records });
        const result = await storeRun({ repository, mode: 'keyword', input: keyword, records: inspected });
        json(response, 200, result);
        return;
      }
      if (request.method === 'POST' && url.pathname === '/api/discover/competitor') {
        const input = await parseBody(request);
        const competitorDomain = String(input.competitorDomain ?? '').trim();
        if (!isDomainOrUrl(competitorDomain)) {
          json(response, 400, { error: 'competitorDomain must be a domain or URL' });
          return;
        }
        if (!String(config.searxngBaseUrl ?? '').trim()) {
          json(response, 409, { error: 'SEARXNG_BASE_URL is not configured' });
          return;
        }
        const records = await services.discoverCompetitor({
          competitorDomain,
          limit: normaliseLimit(input.limit, 100),
        });
        const inspected = await services.inspectPages({ records });
        const result = await storeRun({ repository, mode: 'competitor_search', input: competitorDomain, records: inspected });
        json(response, 200, result);
        return;
      }
      if (request.method === 'POST' && url.pathname === '/api/sync/google-sheet') {
        if (!config.googleSheetWebAppUrl || !config.googleSheetSharedSecret) {
          json(response, 409, { error: 'GOOGLE_SHEET_WEBAPP_URL and GOOGLE_SHEET_SHARED_SECRET must be configured' });
          return;
        }
        const records = await repository.list();
        const runs = await repository.listRuns();
        json(response, 200, await services.syncGoogleSheet({
          url: config.googleSheetWebAppUrl,
          sharedSecret: config.googleSheetSharedSecret,
          records,
          runs,
        }));
        return;
      }
      json(response, 404, { error: 'Not found' });
    } catch (error) {
      json(response, 500, { error: error.message || 'Unexpected server error' });
    }
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const config = getConfig();
  if (process.argv.includes('--check')) {
    process.stdout.write(`${JSON.stringify({ capabilities: capabilities(config) })}\n`);
    process.exitCode = String(config.searxngBaseUrl ?? '').trim() ? 0 : 1;
  } else {
    const port = Number(process.env.PORT || 4318);
    createBacklinkServer({ config }).listen(port, '127.0.0.1', () => {
      process.stdout.write(`Backlink Opportunity Tool is running at http://127.0.0.1:${port}\n`);
    });
  }
}
