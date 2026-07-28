import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import {
  buildCompetitorQueryPlans,
  buildKeywordQueryPlans,
  discoverCompetitorOpportunities,
  discoverKeywordOpportunities,
  discoverSearxngCompetitorOpportunities,
  discoverSearxngKeywordOpportunities,
  enrichWithDomainRatings,
} from '../src/providers.mjs';

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

test('keyword query plans exclude blog comments and cover four link-acquisition families', () => {
  const plans = buildKeywordQueryPlans('AI writing tools');
  assert.deepEqual(
    [...new Set(plans.map((plan) => plan.family))],
    ['resource', 'tool_directory', 'guest_post', 'link_insertion']
  );
  assert.equal(plans.every((plan) => plan.query.includes('AI writing tools')), true);
  assert.equal(plans.every((plan) => !/\bcomment\b/i.test(plan.query)), true);
});

test('competitor query plans cover all four search-derived evidence families', () => {
  const plans = buildCompetitorQueryPlans('https://www.competitor.example/product');
  assert.deepEqual(
    [...new Set(plans.map((plan) => plan.family))],
    ['mention', 'resource', 'guest_post', 'review']
  );
  assert.equal(plans.every((plan) => plan.query.includes('competitor.example')), true);
});

test('keyword discovery completes one request per family before stopping at its candidate budget', async () => {
  const requests = [];
  const plans = buildKeywordQueryPlans('AI writing tools');
  const familyByQuery = new Map(plans.map((plan) => [plan.query, plan.family]));
  const opportunities = await discoverSearxngKeywordOpportunities({
    keyword: 'AI writing tools',
    limit: 20,
    baseUrl: 'http://searxng.test',
    fetchFn: async (url) => {
      const request = new URL(url);
      requests.push(request);
      const family = familyByQuery.get(request.searchParams.get('q'));
      return jsonResponse({
        results: Array.from({ length: 20 }, (_, index) => ({
          url: `https://${family}-${index}.example/post`,
          title: `${family} AI writing tools`,
          content: 'Actionable AI writing tools opportunity',
        })),
      });
    },
  });

  assert.deepEqual(
    [...new Set(requests.map((request) => familyByQuery.get(request.searchParams.get('q'))))],
    ['resource', 'tool_directory', 'guest_post', 'link_insertion']
  );
  assert.equal(opportunities.length, 20);
  assert.equal(opportunities.every((record) => record.sources[0].query_family), true);
  assert.equal(requests.some((request) => request.searchParams.has('gg_family')), false);
});

test('one failed query family is diagnosed while successful families continue', async () => {
  const plans = buildKeywordQueryPlans('AI writing tools');
  const familyByQuery = new Map(plans.map((plan) => [plan.query, plan.family]));
  let diagnostics;
  const opportunities = await discoverSearxngKeywordOpportunities({
    keyword: 'AI writing tools',
    limit: 20,
    baseUrl: 'http://searxng.test',
    onDiagnostics(value) { diagnostics = value; },
    fetchFn: async (url) => {
      const family = familyByQuery.get(new URL(url).searchParams.get('q'));
      if (family === 'guest_post') return jsonResponse({ error: 'temporary upstream failure' }, 503);
      return jsonResponse({
        results: [{
          url: `https://${family}.example/opportunity`,
          title: `${family} AI writing tools`,
          content: 'Actionable AI writing tools opportunity',
        }],
      });
    },
  });

  assert.equal(opportunities.length > 0, true);
  assert.equal(diagnostics.queryErrors.every((error) => error.family === 'guest_post'), true);
  assert.equal(diagnostics.familyRequestCounts.comment, undefined);
});

test('keyword discovery fails when every query request fails', async () => {
  await assert.rejects(
    discoverSearxngKeywordOpportunities({
      keyword: 'AI writing tools',
      limit: 20,
      baseUrl: 'http://searxng.test',
      fetchFn: async () => jsonResponse({ error: 'offline' }, 503),
    }),
    /SearXNG discovery failed for all query families/
  );
});

test('keyword discovery fails instead of completing with zero results when slow retries are exhausted', async () => {
  let diagnostics;

  await assert.rejects(
    discoverSearxngKeywordOpportunities({
      keyword: 'seo geo',
      limit: 20,
      baseUrl: 'http://searxng.test',
      maxUnavailableRetries: 0,
      waitFn: async () => {},
      onDiagnostics(value) { diagnostics = value; },
      fetchFn: async () => jsonResponse({
        results: [],
        unresponsive_engines: [['brave', 'Suspended: too many requests']],
      }),
    }),
    /SearXNG search engines remain unavailable after slow retries/
  );

  assert.deepEqual(diagnostics.unresponsiveEngines, [['brave', 'Suspended: too many requests']]);
});

test('SearXNG discovery spaces requests by the configured interval', async () => {
  const waits = [];

  await discoverSearxngKeywordOpportunities({
    keyword: 'AI writing tools',
    limit: 20,
    baseUrl: 'http://searxng.test',
    requestIntervalMs: 5_000,
    waitFn: async (milliseconds) => waits.push(milliseconds),
    fetchFn: async () => jsonResponse({
      results: [{ url: 'https://example.test/resource', title: 'Resource', content: 'A resource' }],
    }),
  });

  assert.equal(waits.filter((milliseconds) => milliseconds === 5_000).length > 0, true);
});

test('SearXNG retries an unavailable page after cooldown before advancing it', async () => {
  const queries = [];
  const waits = [];
  let firstQuery;

  const records = await discoverSearxngKeywordOpportunities({
    keyword: 'seo geo',
    limit: 1,
    baseUrl: 'http://searxng.test',
    requestIntervalMs: 0,
    unavailableRetryDelayMs: 180_000,
    waitFn: async (milliseconds) => waits.push(milliseconds),
    fetchFn: async (url) => {
      const query = new URL(url).searchParams.get('q');
      queries.push(query);
      if (!firstQuery) {
        firstQuery = query;
        return jsonResponse({ results: [], unresponsive_engines: [['brave', 'Suspended']] });
      }
      if (query === firstQuery) {
        return jsonResponse({
          results: [{ url: 'https://example.test/submit', title: 'Submit', content: 'Submit your tool' }],
        });
      }
      return jsonResponse({ results: [], unresponsive_engines: [['brave', 'Suspended']] });
    },
  });

  assert.equal(records.length, 1);
  assert.equal(queries[0], queries[1]);
  assert.deepEqual(waits, [180_000]);
});

test('SearXNG slow retries stop at the configured retry limit', async () => {
  await assert.rejects(
    discoverSearxngKeywordOpportunities({
      keyword: 'seo geo',
      limit: 1,
      baseUrl: 'http://searxng.test',
      maxUnavailableRetries: 1,
      requestIntervalMs: 0,
      waitFn: async () => {},
      fetchFn: async () => jsonResponse({
        results: [],
        unresponsive_engines: [['brave', 'Suspended']],
      }),
    }),
    /SearXNG search engines remain unavailable after slow retries/
  );
});

test('discoverKeywordOpportunities uses a keyword footprint and normalises the SERP result', async () => {
  const requests = [];
  const opportunities = await discoverKeywordOpportunities({
    keyword: 'AI writing tools',
    language: 'en',
    region: 'us',
    limit: 10,
    apiKey: 'serp-secret',
    fetchFn: async (url) => {
      requests.push(new URL(url));
      return jsonResponse({
        organic_results: [
          {
            link: 'https://directory.example.com/submit-tool?utm_source=google',
            title: 'Submit your tool',
            snippet: 'Add a product to our curated directory.',
          },
        ],
      });
    },
  });

  assert.equal(requests.length, buildKeywordQueryPlans('AI writing tools').length);
  assert.match(requests[0].searchParams.get('q'), /AI writing tools/);
  assert.equal(requests[0].searchParams.get('engine'), 'google');
  assert.equal(requests[0].searchParams.get('api_key'), 'serp-secret');
  assert.equal(opportunities[0].referring_page_url, 'https://directory.example.com/submit-tool');
  assert.equal(opportunities[0].opportunity_type, 'tool_directory');
});

test('discoverSearxngKeywordOpportunities requests all footprints without an API key and normalises JSON results', async () => {
  const requests = [];
  const opportunities = await discoverSearxngKeywordOpportunities({
    keyword: 'AI writing tools',
    language: 'en',
    region: 'us',
    limit: 10,
    baseUrl: 'http://searxng.test',
    fetchFn: async (url) => {
      requests.push(new URL(url));
      return jsonResponse({
        results: [
          {
            url: 'https://directory.example.com/submit-tool?utm_source=searxng',
            title: 'Submit your tool',
            content: 'Add a product to our curated directory.',
          },
        ],
      });
    },
  });

  assert.equal(requests.length, Math.min(buildKeywordQueryPlans('AI writing tools').length, 10));
  assert.equal(requests[0].origin, 'http://searxng.test');
  assert.equal(requests[0].pathname, '/search');
  assert.equal(requests[0].searchParams.get('format'), 'json');
  assert.match(requests[0].searchParams.get('q'), /AI writing tools/);
  assert.equal(requests.some((request) => request.searchParams.has('api_key')), false);
  assert.equal(opportunities[0].referring_page_url, 'https://directory.example.com/submit-tool');
  assert.equal(opportunities[0].opportunity_type, 'tool_directory');
  assert.equal(opportunities[0].sources[0].provider, 'searxng');
});

test('discoverSearxngKeywordOpportunities paginates after completing a fair first pass', async () => {
  const requests = [];
  const opportunities = await discoverSearxngKeywordOpportunities({
    keyword: 'astrology',
    limit: 600,
    baseUrl: 'http://searxng.test',
    fetchFn: async (url) => {
      const request = new URL(url);
      requests.push(request);
      const page = Number(request.searchParams.get('pageno'));
      const query = request.searchParams.get('q').replace(/[^a-z]/gi, '').slice(0, 12);
      return jsonResponse({
        results: Array.from({ length: 20 }, (_, index) => ({
          url: `https://${query}-${page}-${index}.example/resources`,
          title: `Resource ${page}-${index}`,
          content: 'Useful astrology resources',
        })),
      });
    },
  });

  assert.equal(opportunities.length, 600);
  assert.equal(requests.some((request) => request.searchParams.get('pageno') === '2'), true);
  assert.equal(requests.some((request) => request.searchParams.has('api_key')), false);
});

test('discoverSearxngKeywordOpportunities does not stop when SearXNG returns ten results per page', async () => {
  const requests = [];
  const opportunities = await discoverSearxngKeywordOpportunities({
    keyword: 'seo geo',
    limit: 81,
    baseUrl: 'http://searxng.test',
    fetchFn: async (url) => {
      const request = new URL(url);
      requests.push(request);
      const page = request.searchParams.get('pageno');
      const query = request.searchParams.get('q').replace(/[^a-z]/gi, '').slice(0, 14);
      return jsonResponse({
        results: Array.from({ length: 10 }, (_, index) => ({
          url: `https://${query}-${page}-${index}.example/opportunity`,
          title: `SEO GEO opportunity ${page}-${index}`,
          content: 'Actionable SEO GEO opportunity',
        })),
      });
    },
  });

  assert.equal(opportunities.length, 81);
  assert.equal(requests.some((request) => request.searchParams.get('pageno') === '2'), true);
});

test('discoverSearxngCompetitorOpportunities returns verifiable competitor-search leads without an API key', async () => {
  const requests = [];
  const opportunities = await discoverSearxngCompetitorOpportunities({
    competitorDomain: 'competitor.example.com',
    limit: 10,
    baseUrl: 'http://searxng.test',
    fetchFn: async (url) => {
      requests.push(new URL(url));
      return jsonResponse({
        results: [{
          url: 'https://publisher.example.com/roundup?utm_source=searxng',
          title: 'AI product roundup',
          content: 'A list that includes Competitor Product.',
        }],
      });
    },
  });

  assert.equal(requests.length, buildCompetitorQueryPlans('competitor.example.com').length);
  assert.equal(requests[0].searchParams.get('format'), 'json');
  assert.match(requests[0].searchParams.get('q'), /competitor\.example\.com/);
  assert.equal(opportunities[0].source_mode, 'competitor_search');
  assert.equal(opportunities[0].competitor_domain, 'competitor.example.com');
  assert.equal(opportunities[0].domain_dr, null);
  assert.equal(opportunities[0].dr_source, 'unknown');
});

test('discoverCompetitorOpportunities sends credentials server-side and retains backlink evidence', async () => {
  let request;
  const opportunities = await discoverCompetitorOpportunities({
    competitorDomain: 'competitor.example.com',
    limit: 25,
    apiKey: 'ahrefs-secret',
    fetchFn: async (url, options) => {
      request = { url: new URL(url), options };
      return jsonResponse({
        backlinks: [
          {
            url_from: 'https://publisher.example.com/recommended-tools',
            url_to: 'https://competitor.example.com/product',
            anchor: 'Competitor Product',
            title: 'Recommended tools',
            nofollow: false,
            links_external: 31,
          },
        ],
      });
    },
  });

  assert.equal(request.url.searchParams.get('target'), 'competitor.example.com');
  assert.equal(request.url.searchParams.get('limit'), '25');
  assert.equal(request.options.headers.Authorization, 'Bearer ahrefs-secret');
  assert.equal(opportunities[0].competitor_target_url, 'https://competitor.example.com/product');
  assert.equal(opportunities[0].anchor_text, 'Competitor Product');
});

test('enrichWithDomainRatings requests each domain once and records Ahrefs as the metric source', async () => {
  const requests = [];
  const enriched = await enrichWithDomainRatings({
    records: [
      { referring_domain: 'example.com' },
      { referring_domain: 'example.com' },
      { referring_domain: 'second.example' },
    ],
    apiKey: 'ahrefs-secret',
    fetchFn: async (url, options) => {
      requests.push({ url: new URL(url), options });
      return jsonResponse({ domain_rating: { domain_rating: 42.7 } });
    },
  });

  assert.equal(requests.length, 2);
  assert.equal(requests[0].options.headers.Authorization, 'Bearer ahrefs-secret');
  assert.deepEqual(
    enriched.map((record) => [record.domain_dr, record.dr_source]),
    [[42.7, 'ahrefs'], [42.7, 'ahrefs'], [42.7, 'ahrefs']]
  );
});

test('provider failures state the provider and response details without including the API key', async () => {
  await assert.rejects(
    discoverKeywordOpportunities({
      keyword: 'AI tools',
      apiKey: 'never-show-this',
      fetchFn: async () => jsonResponse({ error: 'Bad request' }, 400),
    }),
    /SerpApi request failed \(400\): Bad request/
  );
});
