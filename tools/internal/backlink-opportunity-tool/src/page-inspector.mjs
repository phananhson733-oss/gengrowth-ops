import { canonicalizeUrl, domainFromUrl, evaluateSafety } from './core.mjs';

function getFetch(fetchFn) {
  if (typeof fetchFn === 'function') return fetchFn;
  if (typeof globalThis.fetch === 'function') return globalThis.fetch;
  throw new Error('A fetch implementation is required');
}

function decodeEntities(value) {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

function extractTitle(html) {
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '';
  return decodeEntities(title.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
}

function visibleText(html) {
  return decodeEntities(html
    .replace(/<(script|style|noscript)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim())
    .slice(0, 8000);
}

function countExternalLinks(html, baseUrl) {
  const sourceDomain = domainFromUrl(baseUrl);
  const expression = /<a\b[^>]*?\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi;
  let count = 0;
  let match;
  while ((match = expression.exec(html))) {
    const rawUrl = match[1] ?? match[2] ?? match[3] ?? '';
    try {
      const url = new URL(rawUrl, baseUrl);
      if (['http:', 'https:'].includes(url.protocol) && domainFromUrl(url.toString()) !== sourceDomain) count += 1;
    } catch {
      // Relative fragments, mailto and malformed links are not external HTTP links.
    }
  }
  return count;
}

function unavailableRecord(record, error) {
  if (record.machine_status === 'rejected') return record;
  return {
    ...record,
    machine_status: 'review',
    quality_priority: 'review',
    inspection_status: 'unavailable',
    inspection_note: String(error?.message || error).slice(0, 240),
  };
}

export async function inspectCandidatePage(record, { fetchFn, timeoutMs = 10_000 } = {}) {
  if (record.machine_status === 'rejected') {
    return { ...record, inspection_status: 'skipped', inspection_note: record.inspection_note || 'rejected_from_search_data' };
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await getFetch(fetchFn)(record.referring_page_url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'user-agent': 'GenGrowthBacklinkResearch/1.0 (+https://gengrowth.ai)' },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const contentType = response.headers.get('content-type') || '';
    if (contentType && !/text\/html|application\/xhtml\+xml/i.test(contentType)) {
      throw new Error(`Unsupported content type: ${contentType}`);
    }
    const html = (await response.text()).slice(0, 1_500_000);
    const finalUrl = canonicalizeUrl(response.url || record.referring_page_url);
    const title = extractTitle(html) || record.page_title;
    const text = visibleText(html);
    const safety = evaluateSafety({ url: finalUrl, title, snippet: text });
    const rejected = safety.status === 'rejected';
    return {
      ...record,
      referring_page_url: finalUrl,
      referring_domain: domainFromUrl(finalUrl),
      page_title: title,
      snippet: text.slice(0, 500),
      external_link_count: countExternalLinks(html, finalUrl),
      safety_status: safety.status,
      safety_category: safety.category,
      exclude_reason: safety.reason,
      machine_status: rejected ? 'rejected' : record.machine_status,
      quality_priority: rejected ? 'excluded' : record.quality_priority,
      inspection_status: 'checked',
      inspection_note: '',
    };
  } catch (error) {
    return unavailableRecord(record, error);
  } finally {
    clearTimeout(timeout);
  }
}

export async function inspectCandidatePages(records, { fetchFn, concurrency = 4, timeoutMs } = {}) {
  const output = new Array(records.length);
  let index = 0;
  const workerCount = Math.max(1, Math.min(Number(concurrency) || 4, 10, records.length || 1));
  await Promise.all(Array.from({ length: workerCount }, async () => {
    while (index < records.length) {
      const currentIndex = index;
      index += 1;
      output[currentIndex] = await inspectCandidatePage(records[currentIndex], { fetchFn, timeoutMs });
    }
  }));
  return output;
}
