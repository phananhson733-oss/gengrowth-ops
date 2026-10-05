import { ShortDramaError } from './errors.mjs';

const ENDPOINT = 'https://gw-da5tlpem1hktoldq1bc0-w2wqzerrpavaetkkal-cn-beijing.alicloudapi.com/mcp-servers/beidou-matrix-publish';
const TOOL = 'get_api_fb_task_page';
const MAX_RESULTS = 2_000;

function fail(code, message) { throw new ShortDramaError(code, message); }

function cleanString(value) { return typeof value === 'string' ? value.trim() : ''; }

export function normalizeDramaTitle(value) {
  return cleanString(value).normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
}

function decodeToolResult(result) {
  if (result?.error || result?.result?.isError === true) fail('beidou_query_failed', 'Beidou title query failed');
  const content = result?.result?.content;
  if (!Array.isArray(content) || content.length !== 1 || content[0]?.type !== 'text')
    fail('beidou_response_invalid', 'Beidou tool response is malformed');
  const raw = content[0].text;
  if (typeof raw !== 'string') fail('beidou_response_invalid', 'Beidou tool text is missing');
  const payload = raw.includes('\n\n') ? raw.slice(raw.indexOf('\n\n') + 2) : raw;
  let decoded;
  try {
    decoded = JSON.parse(payload);
    if (typeof decoded === 'string') decoded = JSON.parse(decoded);
  } catch { fail('beidou_response_invalid', 'Beidou tool JSON is malformed'); }
  if (!decoded || typeof decoded !== 'object' || decoded.code !== 0 || !decoded.body || typeof decoded.body !== 'object')
    fail('beidou_query_failed', 'Beidou title query was not successful');
  return decoded.body;
}

function candidateFromRaw(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) fail('beidou_response_invalid', 'Beidou candidate is malformed');
  const platform = cleanString(raw.app_id).toLowerCase();
  const title = cleanString(raw.title);
  const serialId = typeof raw.serial_id === 'number' && Number.isSafeInteger(raw.serial_id) && raw.serial_id > 0
    ? String(raw.serial_id) : cleanString(raw.serial_id);
  const thirdSerialId = cleanString(raw.third_serial_id);
  const safeId = /^[A-Za-z0-9._-]{1,128}$/;
  if (!safeId.test(platform) || !title || !safeId.test(serialId) || thirdSerialId && !safeId.test(thirdSerialId))
    fail('beidou_response_invalid', 'Beidou candidate has no stable identity or title');
  const episodeCount = Number.isSafeInteger(raw.episode_count) && raw.episode_count > 0 ? raw.episode_count : null;
  const startChargePoint = Number.isSafeInteger(raw.start_charge_point) && raw.start_charge_point > 0 &&
    (episodeCount === null || raw.start_charge_point <= episodeCount) ? raw.start_charge_point : null;
  return Object.freeze({
    sourceId: `${platform}:${serialId}`,
    platform,
    serialId,
    thirdSerialId,
    title,
    titleCn: cleanString(raw.title_ch),
    languageId: Number.isSafeInteger(raw.language) ? raw.language : null,
    category: cleanString(raw.category),
    tag: cleanString(raw.tag),
    publishAt: cleanString(raw.publish_at),
    episodeCount,
    startChargePoint,
    freeEpisodeCount: startChargePoint === null ? null : startChargePoint - 1,
    finishStatusCode: Number.isSafeInteger(raw.finish_status) ? raw.finish_status : null,
    description: cleanString(raw.description).replace(/[\u0000-\u001f\u007f]/g, ' ').slice(0, 2_000),
  });
}

export async function findBeidouCandidates(title, { apiKey, fetchImpl = fetch, pageSize = 100 } = {}) {
  const query = cleanString(title);
  if (!query || query.length > 200 || /[\u0000-\u001f\u007f]/.test(query)) fail('beidou_title_invalid', 'Drama title is invalid');
  if (typeof apiKey !== 'string' || !apiKey.trim() || /[\r\n]/.test(apiKey)) fail('beidou_config_invalid', 'Beidou API key is unavailable');
  if (!Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > 100) fail('beidou_config_invalid', 'Beidou page size is invalid');
  const rows = [];
  let total = null;
  const seen = new Set();
  for (let page = 1; page <= Math.ceil(MAX_RESULTS / pageSize); page++) {
    const rpc = { jsonrpc: '2.0', id: page, method: 'tools/call', params: { name: TOOL,
      arguments: { title: query, page_num: page, page_size: pageSize } } };
    let response;
    try {
      response = await fetchImpl(ENDPOINT, { method: 'POST', headers: {
        'x-api-key': apiKey, 'content-type': 'application/json', accept: 'application/json, text/event-stream',
      }, body: JSON.stringify(rpc), signal: AbortSignal.timeout(20_000) });
    } catch { fail('beidou_query_failed', 'Beidou title query could not be completed'); }
    if (!response?.ok) fail('beidou_query_failed', 'Beidou title query returned an HTTP error');
    let result;
    try { result = await response.json(); }
    catch { fail('beidou_response_invalid', 'Beidou tool response is not JSON'); }
    const body = decodeToolResult(result);
    const meta = body.page;
    if (!meta || !Array.isArray(body.data) || meta.current_page !== page ||
        !Number.isSafeInteger(meta.total_count) || meta.total_count < 0 || meta.total_count > MAX_RESULTS ||
        (total !== null && meta.total_count !== total))
      fail('beidou_response_invalid', 'Beidou pagination metadata is invalid or changed');
    total = meta.total_count;
    if (body.data.length === 0 && rows.length < total) fail('beidou_response_incomplete', 'Beidou returned an incomplete candidate page');
    for (const raw of body.data) {
      const row = candidateFromRaw(raw);
      if (seen.has(row.sourceId)) fail('beidou_response_incomplete', 'Beidou candidate appeared on multiple pages');
      seen.add(row.sourceId);
      rows.push(row);
    }
    if (rows.length > total) fail('beidou_response_invalid', 'Beidou returned more candidates than total');
    if (rows.length === total) return rows;
  }
  fail('beidou_response_incomplete', 'Beidou candidate pagination did not finish');
}

export function chooseBeidouCandidate(title, rows) {
  if (!Array.isArray(rows)) fail('beidou_response_invalid', 'Beidou candidates are malformed');
  if (rows.length === 0) return { status: 'not_found', candidates: [] };
  const name = normalizeDramaTitle(title);
  const exact = rows.filter((row) => [row.title, row.titleCn].some((candidate) => normalizeDramaTitle(candidate) === name));
  if (exact.length === 1) return { status: 'selected', candidate: exact[0], candidates: rows };
  return { status: exact.length > 1 ? 'ambiguous' : 'needs_review', candidates: rows };
}
