function requireFetch(fetchFn) {
  if (typeof fetchFn !== 'function') throw new Error('A fetch implementation is required');
  return fetchFn;
}

function requireSecret(value) {
  const secret = String(value ?? '').trim();
  if (!secret) throw new Error('GOOGLE_SHEET_SHARED_SECRET is required');
  return secret;
}

function ensureWebAppUrl(value) {
  const url = new URL(String(value ?? '').trim());
  if (url.protocol !== 'https:' || !url.hostname.endsWith('script.google.com')) {
    throw new Error('GOOGLE_SHEET_WEBAPP_URL must be a deployed Google Apps Script HTTPS URL');
  }
  return url.toString();
}

function redactedMessage(value, secret) {
  return String(value || 'Unknown error').split(secret).join('[redacted]');
}

export class SheetGateway {
  constructor({ url, sharedSecret, fetchFn = globalThis.fetch } = {}) {
    this.url = ensureWebAppUrl(url);
    this.sharedSecret = requireSecret(sharedSecret);
    this.fetchFn = requireFetch(fetchFn);
  }

  async request(action, payload = {}) {
    const response = await this.fetchFn(this.url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action, ...payload, shared_secret: this.sharedSecret }),
    });
    let body = {};
    try {
      body = await response.json();
    } catch {
      // Preserve the HTTP status without trying to parse an HTML Apps Script error page.
    }
    if (!response.ok || body.ok === false) {
      throw new Error(`Sheet Gateway failed (${response.status}): ${redactedMessage(body.error || response.statusText, this.sharedSecret)}`);
    }
    return body;
  }

  async createJob(job) { return (await this.request('createJob', { job })).job; }
  async claimJob() { return (await this.request('claimJob')).job; }
  async completeJob({ jobId, summary, resultRows }) {
    return (await this.request('completeJob', { jobId, summary, resultRows })).job;
  }
  async failJob({ jobId, message }) { return (await this.request('failJob', { jobId, message })).job; }
  async getJob({ jobId }) { return (await this.request('getJob', { jobId })).job; }
  async getJobResult({ jobId }) { return (await this.request('getJobResult', { jobId })).records; }
  async ackJobResult({ jobId }) { return (await this.request('ackJobResult', { jobId })).result; }
  async listResources({ view } = {}) { return (await this.request('listResources', { view })).records; }
  async upsertResources({ records }) { return (await this.request('upsertResources', { records })).result; }
  async importLegacyRuns({ records, runs }) { return (await this.request('importLegacyRuns', { records, runs })).result; }
}
