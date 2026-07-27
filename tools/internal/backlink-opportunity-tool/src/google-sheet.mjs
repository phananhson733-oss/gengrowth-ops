function getFetch(fetchFn) {
  if (typeof fetchFn === 'function') return fetchFn;
  if (typeof globalThis.fetch === 'function') return globalThis.fetch;
  throw new Error('A fetch implementation is required');
}

function ensureWebAppUrl(value) {
  const url = new URL(String(value ?? '').trim());
  if (url.protocol !== 'https:' || !url.hostname.endsWith('script.google.com')) {
    throw new Error('GOOGLE_SHEET_WEBAPP_URL must be a deployed Google Apps Script HTTPS URL');
  }
  return url.toString();
}

export function buildGoogleSheetPayload({ records = [], runs = [] }) {
  return {
    resources: records.filter((record) => record.machine_status !== 'rejected'),
    rejected: records.filter((record) => record.machine_status === 'rejected'),
    task_runs: runs,
  };
}

export async function syncGoogleSheet({ url, sharedSecret, records, runs, fetchFn }) {
  if (!String(sharedSecret ?? '').trim()) {
    throw new Error('GOOGLE_SHEET_SHARED_SECRET is required');
  }
  const response = await getFetch(fetchFn)(ensureWebAppUrl(url), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      ...buildGoogleSheetPayload({ records, runs }),
      shared_secret: sharedSecret,
    }),
  });
  let body = {};
  try {
    body = await response.json();
  } catch {
    // Web App deployments normally return JSON, but keep a useful HTTP error if they do not.
  }
  if (!response.ok || body.ok === false) {
    throw new Error(`Google Sheet sync failed (${response.status}): ${body.error || response.statusText || 'Unknown error'}`);
  }
  return body;
}
