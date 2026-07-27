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

function stripTags(value) {
  return decodeEntities(String(value ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
}

function findLinkToDomain(html, baseUrl, targetDomain) {
  if (!targetDomain) return null;
  const expression = /<a\b[^>]*?\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))[^>]*>([\s\S]*?)<\/a\s*>/gi;
  let match;
  while ((match = expression.exec(html))) {
    const rawUrl = match[1] ?? match[2] ?? match[3] ?? '';
    try {
      const url = new URL(rawUrl, baseUrl);
      if (['http:', 'https:'].includes(url.protocol) && domainFromUrl(url.toString()) === targetDomain) {
        return { url: canonicalizeUrl(url.toString()), anchorText: stripTags(match[4]) };
      }
    } catch {
      // Ignore malformed and non-HTTP links.
    }
  }
  return null;
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

async function fetchDirectHtml(record, { fetchImpl, signal }) {
  const response = await fetchImpl(record.referring_page_url, {
    redirect: 'follow',
    signal,
    headers: { 'user-agent': 'GenGrowthBacklinkResearch/1.0 (+https://gengrowth.ai)' },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const contentType = response.headers.get('content-type') || '';
  if (contentType && !/text\/html|application\/xhtml\+xml/i.test(contentType)) {
    throw new Error(`Unsupported content type: ${contentType}`);
  }
  return {
    html: (await response.text()).slice(0, 1_500_000),
    finalUrl: canonicalizeUrl(response.url || record.referring_page_url),
    firecrawlFallback: false,
  };
}

async function fetchFirecrawlHtml(record, { baseUrl, apiKey, fetchImpl, signal }) {
  const url = new URL('/v2/scrape', baseUrl);
  const headers = { Accept: 'application/json', 'content-type': 'application/json' };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
  const response = await fetchImpl(url, {
    method: 'POST',
    signal,
    headers,
    body: JSON.stringify({ url: record.referring_page_url, formats: ['html'] }),
  });
  let body = {};
  try {
    body = await response.json();
  } catch {
    // The status below is still useful if a proxy returns non-JSON text.
  }
  if (!response.ok) throw new Error(`Firecrawl HTTP ${response.status}`);
  const html = body?.data?.html ?? body?.html;
  if (!html || typeof html !== 'string') throw new Error('Firecrawl response does not include rendered HTML');
  return {
    html: html.slice(0, 1_500_000),
    finalUrl: canonicalizeUrl(body?.data?.metadata?.sourceURL ?? body?.metadata?.sourceURL ?? record.referring_page_url),
    firecrawlFallback: true,
  };
}

export async function inspectCandidatePage(record, {
  fetchFn,
  firecrawlBaseUrl = '',
  firecrawlApiKey = '',
  firecrawlFetchFn,
  timeoutMs = 10_000,
} = {}) {
  if (record.machine_status === 'rejected') {
    return { ...record, inspection_status: 'skipped', inspection_note: record.inspection_note || 'rejected_from_search_data' };
  }
  const controller = new AbortController();
  let timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const fetchImpl = getFetch(fetchFn);
    let page;
    try {
      page = await fetchDirectHtml(record, { fetchImpl, signal: controller.signal });
    } catch (directError) {
      if (!String(firecrawlBaseUrl).trim()) throw directError;
      clearTimeout(timeout);
      const fallbackController = new AbortController();
      timeout = setTimeout(() => fallbackController.abort(), timeoutMs);
      try {
        page = await fetchFirecrawlHtml(record, {
          baseUrl: firecrawlBaseUrl,
          apiKey: String(firecrawlApiKey).trim(),
          fetchImpl: getFetch(firecrawlFetchFn || fetchFn),
          signal: fallbackController.signal,
        });
      } catch (fallbackError) {
        throw new Error(`Direct fetch failed: ${String(directError?.message || directError)}; Firecrawl fallback failed: ${String(fallbackError?.message || fallbackError)}`);
      }
    }
    const { html, finalUrl, firecrawlFallback } = page;
    const title = extractTitle(html) || record.page_title;
    const text = visibleText(html);
    const safety = evaluateSafety({ url: finalUrl, title, snippet: text });
    const rejected = safety.status === 'rejected';
    const competitorLink = findLinkToDomain(html, finalUrl, record.competitor_domain);
    const competitorEvidenceMissing = Boolean(record.competitor_domain) && !competitorLink;
    const inspectionNote = rejected
      ? ''
      : competitorEvidenceMissing
        ? 'competitor_link_not_found'
        : competitorLink
          ? 'competitor_link_verified'
          : '';
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
      competitor_target_url: competitorLink?.url || record.competitor_target_url,
      anchor_text: competitorLink?.anchorText || record.anchor_text,
      machine_status: rejected ? 'rejected' : competitorEvidenceMissing ? 'review' : record.machine_status,
      quality_priority: rejected ? 'excluded' : competitorEvidenceMissing ? 'review' : record.quality_priority,
      inspection_status: competitorEvidenceMissing ? 'target_not_found' : 'checked',
      inspection_note: [inspectionNote, firecrawlFallback ? 'firecrawl_fallback' : ''].filter(Boolean).join(';'),
    };
  } catch (error) {
    return unavailableRecord(record, error);
  } finally {
    clearTimeout(timeout);
  }
}

export async function inspectCandidatePages(records, {
  fetchFn,
  firecrawlBaseUrl,
  firecrawlApiKey,
  firecrawlFetchFn,
  concurrency = 4,
  timeoutMs,
} = {}) {
  const output = new Array(records.length);
  let index = 0;
  const workerCount = Math.max(1, Math.min(Number(concurrency) || 4, 10, records.length || 1));
  await Promise.all(Array.from({ length: workerCount }, async () => {
    while (index < records.length) {
      const currentIndex = index;
      index += 1;
      output[currentIndex] = await inspectCandidatePage(records[currentIndex], {
        fetchFn,
        firecrawlBaseUrl,
        firecrawlApiKey,
        firecrawlFetchFn,
        timeoutMs,
      });
    }
  }));
  return output;
}
