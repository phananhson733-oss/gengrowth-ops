import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import {
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

  assert.equal(requests.length, 5);
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

  assert.equal(requests.length, 5);
  assert.equal(requests[0].origin, 'http://searxng.test');
  assert.equal(requests[0].pathname, '/search');
  assert.equal(requests[0].searchParams.get('format'), 'json');
  assert.match(requests[0].searchParams.get('q'), /AI writing tools/);
  assert.equal(requests.some((request) => request.searchParams.has('api_key')), false);
  assert.equal(opportunities[0].referring_page_url, 'https://directory.example.com/submit-tool');
  assert.equal(opportunities[0].opportunity_type, 'tool_directory');
  assert.equal(opportunities[0].sources[0].provider, 'searxng');
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

  assert.equal(requests.length, 4);
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
