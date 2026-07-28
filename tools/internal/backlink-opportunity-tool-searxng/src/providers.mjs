import {
  fromAhrefsBacklink,
  fromCompetitorSearchResult,
  fromSerpResult,
  mergeOpportunities,
} from './core.mjs';

const SERPAPI_URL = 'https://serpapi.com/search.json';
const SEARXNG_SEARCH_PATH = '/search';
const AHREFS_BACKLINKS_URL = 'https://api.ahrefs.com/v3/site-explorer/all-backlinks';
const AHREFS_DR_URL = 'https://api.ahrefs.com/v3/public/domain-rating-free';
const SEARXNG_RESULTS_PER_PAGE = 10;
const MAX_SEARXNG_CANDIDATES = 2000;
const DEFAULT_SEARXNG_REQUEST_INTERVAL_MS = 0;
const DEFAULT_UNAVAILABLE_RETRY_DELAY_MS = 180_000;
const DEFAULT_MAX_UNAVAILABLE_RETRIES = 10;
const DEFAULT_MAX_ELAPSED_MS = 45 * 60 * 1_000;

const KEYWORD_QUERY_FAMILIES = [
  {
    family: 'resource',
    templates: [
      'inurl:resources {keyword}',
      '"suggest a resource" {keyword}',
    ],
  },
  {
    family: 'tool_directory',
    templates: [
      '"submit your tool" {keyword}',
      '"add your product" {keyword}',
    ],
  },
  {
    family: 'guest_post',
    templates: [
      '"write for us" {keyword}',
      '"guest post" {keyword}',
    ],
  },
  {
    family: 'link_insertion',
    templates: [
      '"add a link" {keyword}',
      '"useful links" {keyword}',
    ],
  },
];

const COMPETITOR_QUERY_FAMILIES = [
  { family: 'mention', templates: ['"{competitorDomain}" -site:{competitorDomain}'] },
  { family: 'resource', templates: ['"{competitorDomain}" "resources"'] },
  { family: 'guest_post', templates: ['"{competitorDomain}" "guest post"'] },
  { family: 'review', templates: ['"{competitorDomain}" "review"'] },
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

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
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

function expandQueryFamilies(families, placeholder, value) {
  return families.flatMap(({ family, templates }) => templates.map((template) => ({
    family,
    template,
    query: template.replaceAll(placeholder, value),
  })));
}

export function buildKeywordQueryPlans(keyword) {
  return expandQueryFamilies(KEYWORD_QUERY_FAMILIES, '{keyword}', requireValue(keyword, 'keyword'));
}

export function buildKeywordQueries(keyword) {
  return buildKeywordQueryPlans(keyword).map((plan) => plan.query);
}

function normaliseCompetitorDomain(value) {
  return requireValue(value, 'competitorDomain')
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/\/.*$/, '')
    .toLowerCase();
}

export function buildCompetitorQueryPlans(competitorDomain) {
  return expandQueryFamilies(
    COMPETITOR_QUERY_FAMILIES,
    '{competitorDomain}',
    normaliseCompetitorDomain(competitorDomain)
  );
}

export function buildCompetitorQueries(competitorDomain) {
  return buildCompetitorQueryPlans(competitorDomain).map((plan) => plan.query);
}

function queryStates(plans) {
  const grouped = new Map();
  for (const plan of plans) {
    if (!grouped.has(plan.family)) grouped.set(plan.family, []);
    grouped.get(plan.family).push({ ...plan, page: 1, active: true });
  }
  return [...grouped.entries()].map(([family, familyPlans]) => ({
    family,
    plans: familyPlans,
    cursor: 0,
  }));
}

function nextActivePlan(state) {
  for (let offset = 0; offset < state.plans.length; offset += 1) {
    const index = (state.cursor + offset) % state.plans.length;
    if (state.plans[index].active) {
      state.cursor = (index + 1) % state.plans.length;
      return state.plans[index];
    }
  }
  return null;
}

function interleaveFamilyCandidates(candidatesByFamily, limit) {
  const output = [];
  let index = 0;
  const families = [...candidatesByFamily.keys()];
  while (output.length < limit) {
    let added = false;
    for (const family of families) {
      const candidate = candidatesByFamily.get(family)[index];
      if (candidate) {
        output.push(candidate);
        added = true;
        if (output.length === limit) break;
      }
    }
    if (!added) break;
    index += 1;
  }
  return output;
}

async function discoverSearxngByFamilies({
  plans,
  limit,
  searchBaseUrl,
  language,
  fetchImpl,
  fromResult,
  onDiagnostics,
  waitFn = wait,
  now = Date.now,
  requestIntervalMs = DEFAULT_SEARXNG_REQUEST_INTERVAL_MS,
  unavailableRetryDelayMs = DEFAULT_UNAVAILABLE_RETRY_DELAY_MS,
  maxUnavailableRetries = DEFAULT_MAX_UNAVAILABLE_RETRIES,
  maxElapsedMs = DEFAULT_MAX_ELAPSED_MS,
}) {
  const states = queryStates(plans);
  const candidatesByFamily = new Map(states.map((state) => [state.family, []]));
  const diagnostics = {
    familyRequestCounts: Object.fromEntries(states.map((state) => [state.family, 0])),
    familyCandidateCounts: Object.fromEntries(states.map((state) => [state.family, 0])),
    queryErrors: [],
    unresponsiveEngines: [],
  };
  const unresponsiveEngineKeys = new Set();
  let rawCount = 0;
  let successfulRequests = 0;
  let requestCount = 0;
  let unavailableRetries = 0;
  let retryState = null;
  const startedAt = now();

  while (states.some((state) => state.plans.some((plan) => plan.active)) && rawCount < limit) {
    if (now() - startedAt >= maxElapsedMs) {
      if (typeof onDiagnostics === 'function') onDiagnostics(diagnostics);
      throw new Error('SearXNG search engines remain unavailable after slow retries');
    }
    const statesToQuery = retryState ? [retryState] : states;
    for (const state of statesToQuery) {
      const plan = retryState === state ? state.retryPlan : nextActivePlan(state);
      if (!plan) continue;
      if (requestCount > 0 && requestIntervalMs > 0) await waitFn(requestIntervalMs);
      const url = new URL(SEARXNG_SEARCH_PATH, searchBaseUrl);
      url.searchParams.set('q', plan.query);
      url.searchParams.set('format', 'json');
      url.searchParams.set('categories', 'general');
      url.searchParams.set('language', language);
      url.searchParams.set('pageno', String(plan.page));
      diagnostics.familyRequestCounts[state.family] += 1;
      requestCount += 1;
      let body;
      try {
        body = await readProviderResponse(await fetchImpl(url), 'SearXNG');
        successfulRequests += 1;
      } catch (error) {
        diagnostics.queryErrors.push({
          family: state.family,
          template: plan.template,
          message: String(error?.message || error).slice(0, 240),
        });
        plan.active = false;
        continue;
      }
      for (const engine of body.unresponsive_engines || []) {
        const key = JSON.stringify(engine);
        if (!unresponsiveEngineKeys.has(key)) {
          unresponsiveEngineKeys.add(key);
          diagnostics.unresponsiveEngines.push(engine);
        }
      }
      const results = body.results ?? [];
      if (results.length === 0 && (body.unresponsive_engines || []).length) {
        unavailableRetries += 1;
        if (unavailableRetries > maxUnavailableRetries) {
          if (typeof onDiagnostics === 'function') onDiagnostics(diagnostics);
          throw new Error('SearXNG search engines remain unavailable after slow retries');
        }
        retryState = state;
        state.retryPlan = plan;
        await waitFn(unavailableRetryDelayMs);
        break;
      }
      retryState = null;
      delete state.retryPlan;
      for (const item of results) {
        if (item.url) candidatesByFamily.get(state.family).push(fromResult(item, plan));
      }
      diagnostics.familyCandidateCounts[state.family] += results.filter((item) => item.url).length;
      rawCount += results.length;
      if (results.length >= SEARXNG_RESULTS_PER_PAGE) plan.page += 1;
      else plan.active = false;
    }
  }

  if (typeof onDiagnostics === 'function') onDiagnostics(diagnostics);
  if (successfulRequests === 0) {
    throw new Error('SearXNG discovery failed for all query families');
  }
  if (rawCount === 0 && diagnostics.unresponsiveEngines.length) {
    throw new Error('SearXNG search engines are temporarily unavailable');
  }
  return mergeOpportunities([], interleaveFamilyCandidates(candidatesByFamily, limit));
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

export async function discoverSearxngKeywordOpportunities({
  keyword,
  language = 'en',
  region = 'us',
  limit = 50,
  baseUrl = 'http://127.0.0.1:8080',
  fetchFn,
  onDiagnostics,
  waitFn,
  now,
  requestIntervalMs,
  unavailableRetryDelayMs,
  maxUnavailableRetries,
  maxElapsedMs,
}) {
  const searchBaseUrl = new URL(requireValue(baseUrl, 'SEARXNG_BASE_URL'));
  const fetchImpl = getFetch(fetchFn);
  const maxResults = Math.max(1, Math.min(Number(limit) || 50, MAX_SEARXNG_CANDIDATES));

  return discoverSearxngByFamilies({
    plans: buildKeywordQueryPlans(keyword),
    limit: maxResults,
    searchBaseUrl,
    language,
    fetchImpl,
    onDiagnostics,
    waitFn,
    now,
    requestIntervalMs,
    unavailableRetryDelayMs,
    maxUnavailableRetries,
    maxElapsedMs,
    fromResult: (item, plan) => fromSerpResult({
      link: item.url,
      title: item.title,
      snippet: item.content,
    }, {
      keyword,
      language,
      region,
      provider: 'searxng',
      queryFamily: plan.family,
      queryTemplate: plan.template,
    }),
  });
}

export async function discoverSearxngCompetitorOpportunities({
  competitorDomain,
  language = 'en',
  limit = 50,
  baseUrl = 'http://127.0.0.1:8080',
  fetchFn,
  onDiagnostics,
  waitFn,
  now,
  requestIntervalMs,
  unavailableRetryDelayMs,
  maxUnavailableRetries,
  maxElapsedMs,
}) {
  const target = normaliseCompetitorDomain(competitorDomain);
  const searchBaseUrl = new URL(requireValue(baseUrl, 'SEARXNG_BASE_URL'));
  const fetchImpl = getFetch(fetchFn);
  const maxResults = Math.max(1, Math.min(Number(limit) || 50, MAX_SEARXNG_CANDIDATES));

  return discoverSearxngByFamilies({
    plans: buildCompetitorQueryPlans(target),
    limit: maxResults,
    searchBaseUrl,
    language,
    fetchImpl,
    onDiagnostics,
    waitFn,
    now,
    requestIntervalMs,
    unavailableRetryDelayMs,
    maxUnavailableRetries,
    maxElapsedMs,
    fromResult: (item, plan) => fromCompetitorSearchResult(item, {
      competitorDomain: target,
      provider: 'searxng',
      queryFamily: plan.family,
      queryTemplate: plan.template,
    }),
  });
}

export async function discoverCompetitorOpportunities({
  competitorDomain,
  limit = 100,
  apiKey,
  fetchFn,
}) {
  const target = normaliseCompetitorDomain(competitorDomain);
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
