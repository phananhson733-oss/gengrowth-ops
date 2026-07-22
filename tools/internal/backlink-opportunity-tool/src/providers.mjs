import {
  fromAhrefsBacklink,
  fromSerpResult,
  mergeOpportunities,
} from './core.mjs';

const SERPAPI_URL = 'https://serpapi.com/search.json';
const AHREFS_BACKLINKS_URL = 'https://api.ahrefs.com/v3/site-explorer/all-backlinks';
const AHREFS_DR_URL = 'https://api.ahrefs.com/v3/public/domain-rating-free';

const KEYWORD_FOOTPRINTS = [
  '"write for us" {keyword}',
  '"guest post" {keyword}',
  'inurl:resources {keyword}',
  '"submit your tool" {keyword}',
  '"leave a reply" {keyword}',
];

function requireValue(value, name) {
  if (!String(value ?? '').trim()) {
    throw new Error(`${name} is required`);
  }
  return String(value).trim();
}

function getFetch(fetchFn) {
  if (typeof fetchFn === 'function') return fetchFn;
  if (typeof globalThis.fetch === 'function') return globalThis.fetch;
  throw new Error('A fetch implementation is required');
}

async function readProviderResponse(response, provider) {
  let body = {};
  try {
    body = await response.json();
  } catch {
    // Keep the provider error useful even when it returns non-JSON text.
  }
  if (!response.ok) {
    const detail = typeof body.error === 'string' ? body.error : body.message || response.statusText || 'Unknown provider error';
    throw new Error(`${provider} request failed (${response.status}): ${detail}`);
  }
  return body;
}

export function buildKeywordQueries(keyword) {
  const value = requireValue(keyword, 'keyword');
  return KEYWORD_FOOTPRINTS.map((template) => template.replace('{keyword}', value));
}

export async function discoverKeywordOpportunities({
  keyword,
  language = 'en',
  region = 'us',
  limit = 50,
  apiKey,
  fetchFn,
}) {
  const key = requireValue(apiKey, 'SERPAPI_API_KEY');
  const fetchImpl = getFetch(fetchFn);
  const maxResults = Math.max(1, Math.min(Number(limit) || 50, 100));
  const candidates = [];

  for (const query of buildKeywordQueries(keyword)) {
    const url = new URL(SERPAPI_URL);
    url.searchParams.set('engine', 'google');
    url.searchParams.set('q', query);
    url.searchParams.set('hl', language);
    url.searchParams.set('gl', region);
    url.searchParams.set('num', String(Math.min(maxResults, 100)));
    url.searchParams.set('api_key', key);

    const body = await readProviderResponse(await fetchImpl(url), 'SerpApi');
    for (const item of body.organic_results ?? []) {
      if (item.link || item.url) {
        candidates.push(fromSerpResult(item, { keyword, language, region }));
      }
    }
  }
  return mergeOpportunities([], candidates).slice(0, maxResults);
}

export async function discoverCompetitorOpportunities({
  competitorDomain,
  limit = 100,
  apiKey,
  fetchFn,
}) {
  const target = requireValue(competitorDomain, 'competitorDomain').replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/.*$/, '');
  const key = requireValue(apiKey, 'AHREFS_API_KEY');
  const fetchImpl = getFetch(fetchFn);
  const url = new URL(AHREFS_BACKLINKS_URL);
  url.searchParams.set('target', target);
  url.searchParams.set('mode', 'domain');
  url.searchParams.set('aggregation', 'all');
  url.searchParams.set('limit', String(Math.max(1, Math.min(Number(limit) || 100, 1000))));
  url.searchParams.set('select', 'url_from,url_to,anchor,title,nofollow,is_ugc,is_sponsored,links_external,text_pre');

  const body = await readProviderResponse(await fetchImpl(url, {
    headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' },
  }), 'Ahrefs');

  return mergeOpportunities([], (body.backlinks ?? []).map((backlink) => fromAhrefsBacklink(backlink, { competitorDomain: target })));
}

export async function enrichWithDomainRatings({ records, apiKey, fetchFn }) {
  const key = requireValue(apiKey, 'AHREFS_API_KEY');
  const fetchImpl = getFetch(fetchFn);
  const domains = [...new Set(records.map((record) => record.referring_domain).filter(Boolean))];
  const ratings = new Map();

  for (const domain of domains) {
    const url = new URL(AHREFS_DR_URL);
    url.searchParams.set('target', domain);
    const body = await readProviderResponse(await fetchImpl(url, {
      headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' },
    }), 'Ahrefs DR');
    ratings.set(domain, Number(body.domain_rating?.domain_rating ?? 0));
  }

  return records.map((record) => ({
    ...record,
    domain_dr: ratings.get(record.referring_domain) ?? null,
    dr_source: 'ahrefs',
  }));
}
