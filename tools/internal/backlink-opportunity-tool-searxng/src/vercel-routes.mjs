import { issueSession, verifyAccessToken } from './session.mjs';
import { normaliseTargetDomain } from './auto-register-export.mjs';

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
}

function allowedLimit(mode, value) {
  const limit = Number(value);
  const allowed = mode === 'keyword' ? [50, 100, 200] : [50, 100, 200, 500];
  return allowed.includes(limit) ? limit : null;
}

function domainOrUrl(value) {
  const input = String(value || '').trim();
  if (!input || /\s/.test(input)) return false;
  try { return Boolean(new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`).hostname.includes('.')); } catch { return false; }
}

export async function accessRoute({ token, accessToken, sessionSecret, now }) {
  if (!await verifyAccessToken({ candidate: token, accessToken })) return new Response('Not found', { status: 404 });
  const session = await issueSession({ sessionSecret, now });
  const html = '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>正在进入外链机会工具</title></head><body><p>正在建立安全会话…</p><p><a href="/">进入外链机会工具</a></p><script>location.replace("/")</script></body></html>';
  return new Response(html, { status: 200, headers: {
    'content-type': 'text/html; charset=utf-8',
    'set-cookie': `backlink_session=${session}; Path=/; Max-Age=2592000; HttpOnly; Secure; SameSite=Lax`,
    'cache-control': 'no-store',
  } });
}

export async function createDiscoveryRoute({ mode, request, gateway }) {
  if (mode !== 'keyword' && mode !== 'competitor') return json({ error: 'Not found' }, 404);
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Request body must be valid JSON' }, 400); }
  const requestedLimit = allowedLimit(mode, body.limit);
  if (!requestedLimit) return json({ error: 'Unsupported result limit' }, 400);
  let targetDomain;
  try {
    targetDomain = normaliseTargetDomain(body.targetDomain);
  } catch (error) {
    return json({ error: error.message }, 400);
  }
  const input = mode === 'keyword' ? String(body.keyword || '').trim() : String(body.competitorDomain || '').trim();
  if (!input) return json({ error: mode === 'keyword' ? 'keyword is required' : 'competitorDomain is required' }, 400);
  if (mode === 'competitor' && !domainOrUrl(input)) return json({ error: 'competitorDomain must be a domain or URL' }, 400);
  const job = await gateway.createJob({
    mode: mode === 'competitor' ? 'competitor_search' : 'keyword', input,
    language: String(body.language || 'en'), region: String(body.region || 'us'), requestedLimit, targetDomain,
  });
  return json({ jobId: job.id }, 202);
}

export async function jobRoute({ jobId, gateway }) {
  const job = await gateway.getJob({ jobId });
  return job ? json({ job }) : json({ error: 'Job not found' }, 404);
}

export async function jobResultRoute({ jobId, gateway }) {
  return json({ records: await gateway.getJobResult({ jobId }) });
}

export async function ackJobResultRoute({ jobId, gateway }) {
  return json(await gateway.ackJobResult({ jobId }));
}

export async function opportunitiesRoute({ request, gateway }) {
  const view = new URL(request.url).searchParams.get('view') || 'keyword';
  if (view !== 'keyword' && view !== 'competitor') return json({ error: 'Unsupported view' }, 400);
  return json({ records: await gateway.listResources({ view }) });
}
