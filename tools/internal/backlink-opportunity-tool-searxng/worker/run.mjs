import { fileURLToPath } from 'node:url';

import { inspectCandidatePages } from '../src/page-inspector.mjs';
import { discoverSearxngCompetitorOpportunities, discoverSearxngKeywordOpportunities } from '../src/providers.mjs';
import { runDiscoveryJob } from '../src/discovery-job.mjs';
import { SheetGateway } from '../src/sheet-gateway.mjs';

const WAIT_MS = 2_000;
const INSPECTION_CONCURRENCY = 10;
const SEARXNG_REQUEST_INTERVAL_MS = 5_000;
const SEARXNG_UNAVAILABLE_RETRY_DELAY_MS = 180_000;
const MAX_SEARXNG_UNAVAILABLE_RETRIES = 10;
const MAX_SEARXNG_JOB_DURATION_MS = 45 * 60 * 1_000;
const slowSearchOptions = {
  requestIntervalMs: SEARXNG_REQUEST_INTERVAL_MS,
  unavailableRetryDelayMs: SEARXNG_UNAVAILABLE_RETRY_DELAY_MS,
  maxUnavailableRetries: MAX_SEARXNG_UNAVAILABLE_RETRIES,
  maxElapsedMs: MAX_SEARXNG_JOB_DURATION_MS,
};

function safeMessage(error) {
  return String(error?.message || error || 'Unknown worker error').slice(0, 500);
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export async function processOneJob({ gateway, runJob }) {
  const job = await gateway.claimJob();
  if (!job) return null;
  try {
    await runJob(job);
    return { id: job.id, status: 'completed' };
  } catch (error) {
    await gateway.failJob({ jobId: job.id, message: safeMessage(error) });
    return { id: job.id, status: 'failed' };
  }
}

export async function runLoop({ gateway, runJob, waitFn = wait, idleWaitMs = WAIT_MS }) {
  for (;;) {
    const result = await processOneJob({ gateway, runJob });
    if (!result) await waitFn(idleWaitMs);
  }
}

function required(name) {
  const value = String(process.env[name] || '').trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function createWorkerServices() {
  const searxngBaseUrl = required('SEARXNG_BASE_URL');
  const gateway = new SheetGateway({
    url: required('GOOGLE_SHEET_WEBAPP_URL'),
    sharedSecret: required('GOOGLE_SHEET_SHARED_SECRET'),
  });
  const inspectionOptions = {
    firecrawlBaseUrl: String(process.env.FIRECRAWL_BASE_URL || '').trim(),
    firecrawlApiKey: String(process.env.FIRECRAWL_API_KEY || '').trim(),
  };
  return {
    gateway,
    runJob: (job) => runDiscoveryJob({
      job,
      gateway,
      discoverKeyword: (input) => discoverSearxngKeywordOpportunities({ ...input, baseUrl: searxngBaseUrl, ...slowSearchOptions }),
      discoverCompetitor: (input) => discoverSearxngCompetitorOpportunities({ ...input, baseUrl: searxngBaseUrl, ...slowSearchOptions }),
      inspectPages: (records) => inspectCandidatePages(records, { ...inspectionOptions, concurrency: INSPECTION_CONCURRENCY }),
    }),
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { gateway, runJob } = createWorkerServices();
  runLoop({ gateway, runJob }).catch((error) => {
    process.stderr.write(`Backlink opportunity worker stopped: ${safeMessage(error)}\n`);
    process.exitCode = 1;
  });
}
