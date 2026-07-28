import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { fromCompetitorSearchResult } from '../src/core.mjs';
import { runDiscoveryJob } from '../src/discovery-job.mjs';
import { inspectCandidatePages } from '../src/page-inspector.mjs';

const job = {
  id: 'job_1',
  mode: 'keyword',
  input: 'astrology',
  language: 'en',
  region: 'us',
  requestedLimit: 200,
  targetDomain: 'target.example',
};
const candidates = [
  { id: 'one', referring_page_url: 'https://example.com/one', machine_status: 'qualified', sources: [{ mode: 'keyword', input: 'astrology' }] },
  { id: 'one-duplicate', referring_page_url: 'https://example.com/one', machine_status: 'qualified', sources: [{ mode: 'keyword', input: 'astrology' }] },
  { id: 'two', referring_page_url: 'https://example.com/two', machine_status: 'qualified', sources: [{ mode: 'keyword', input: 'astrology' }] },
  { id: 'three', referring_page_url: 'https://example.com/three', machine_status: 'qualified', sources: [{ mode: 'keyword', input: 'astrology' }] },
];
const inspectedEvidence = {
  comment_form: false,
  website_field: false,
  submission_form: true,
  submission_kind: 'resource_page',
  explicit_submission_instructions: false,
  login_required: false,
  competitor_link_verified: false,
};

test('runDiscoveryJob completes with qualified export rows and never upserts resources', async () => {
  const completed = [];
  const gateway = {
    async upsertResources() { throw new Error('must not persist resources'); },
    async completeJob(value) { completed.push(value); },
  };
  const summary = await runDiscoveryJob({
    job,
    gateway,
    discoverKeyword: async () => candidates,
    discoverCompetitor: async () => { throw new Error('competitor discovery should not run'); },
    inspectPages: async (records) => records.map((record, index) => ({
      ...record,
      referring_domain: 'example.com',
      opportunity_type: 'resource_page',
      external_link_count: index,
      machine_status: index === 2 ? 'rejected' : 'qualified',
      page_title: 'Astrology resources',
      snippet: 'Useful astrology resources and chart references.',
      safety_status: 'passed',
      inspection_status: 'checked',
      action_evidence: index === 2 ? {
        comment_form: false,
        website_field: false,
        submission_form: false,
        submission_kind: '',
        explicit_submission_instructions: false,
        login_required: false,
        competitor_link_verified: false,
      } : inspectedEvidence,
    })),
  });

  assert.deepEqual(summary, {
    retrieved: 4,
    deduplicated: 3,
    qualified: 2,
    rejected: 1,
    created: 2,
    exportRejected: 0,
    qualityRuleVersion: 'quality-v1',
    exclusionCounts: { 'quality:actionability_below_15': 1 },
    finalTypeCounts: { resource_page: 2 },
    discoveryDiagnostics: {
      familyRequestCounts: {},
      familyCandidateCounts: {},
      queryErrors: [],
    },
  });
  assert.equal(completed[0].resultRows.length, 2);
  assert.deepEqual(completed[0].resultRows.map((row) => row.目标域名), ['target.example', 'target.example']);
  assert.deepEqual(completed[0].resultRows.map((row) => row.页面AS), ['', '']);
});

test('runDiscoveryJob gives a 50-result target a 1000-candidate retrieval budget before ranking', async () => {
  const calls = [];
  const completed = [];
  const smallJob = { ...job, requestedLimit: 50 };
  const discovered = Array.from({ length: 150 }, (_, index) => ({
    id: `candidate-${index}`,
    referring_page_url: `https://example.com/${index}`,
    referring_domain: 'example.com',
    page_title: `Astrology resource ${index}`,
    snippet: 'Astrology charts, signs and interpretation.',
    external_link_count: index,
    safety_status: 'passed',
    inspection_status: 'checked',
    machine_status: 'qualified',
    opportunity_type: 'other',
    action_evidence: {
      comment_form: false,
      website_field: false,
      submission_form: true,
      submission_kind: 'resource_page',
      explicit_submission_instructions: false,
      login_required: false,
      competitor_link_verified: false,
    },
    sources: [{ mode: 'keyword', input: 'astrology' }],
  }));

  const summary = await runDiscoveryJob({
    job: smallJob,
    gateway: { async completeJob(value) { completed.push(value); } },
    discoverKeyword: async (input) => {
      calls.push(input);
      input.onDiagnostics({
        familyRequestCounts: {
          resource: 1,
          tool_directory: 1,
          guest_post: 1,
          link_insertion: 1,
        },
        familyCandidateCounts: {
          resource: 38,
          tool_directory: 38,
          guest_post: 37,
          link_insertion: 37,
        },
        queryErrors: [],
      });
      return discovered;
    },
    discoverCompetitor: async () => { throw new Error('not used'); },
    inspectPages: async (records) => records,
  });

  assert.equal(calls[0].limit, 1000);
  assert.equal(completed[0].resultRows.length, 50);
  assert.equal(summary.retrieved, 150);
  assert.equal(summary.created, 50);
  assert.equal(summary.qualityRuleVersion, 'quality-v1');
  assert.equal(summary.discoveryDiagnostics.familyRequestCounts.comment, undefined);
});

test('runDiscoveryJob never asks providers for more than 2000 raw candidates', async () => {
  let providerLimit;
  await runDiscoveryJob({
    job: { ...job, mode: 'keyword', requestedLimit: 500 },
    gateway: { async completeJob() {} },
    discoverKeyword: async ({ limit }) => {
      providerLimit = limit;
      return [];
    },
    discoverCompetitor: async () => [],
    inspectPages: async (records) => records,
  });
  assert.equal(providerLimit, 2000);
});

test('a checked competitor page without the backlink is counted as competitor_link_missing end to end', async () => {
  const completed = [];
  const competitorJob = {
    ...job,
    id: 'job_competitor_missing',
    mode: 'competitor',
    input: 'https://competitor.example/products',
    requestedLimit: 10,
  };
  const candidate = fromCompetitorSearchResult(
    {
      url: 'https://publisher.example/review',
      title: 'Competitor.example product review',
      content: 'Independent coverage of Competitor.example.',
    },
    {
      competitorDomain: 'competitor.example',
      provider: 'searxng',
    },
  );

  const summary = await runDiscoveryJob({
    job: competitorJob,
    gateway: { async completeJob(value) { completed.push(value); } },
    discoverKeyword: async () => { throw new Error('keyword discovery should not run'); },
    discoverCompetitor: async () => [candidate],
    inspectPages: async (records) => inspectCandidatePages(records, {
      fetchFn: async () => new Response(`
        <html><head><title>Competitor.example product review</title></head>
          <body>
            <p>Independent coverage of Competitor.example for editorial teams.</p>
            <a href="https://other.example/product">Other product</a>
          </body>
        </html>
      `, { status: 200, headers: { 'content-type': 'text/html' } }),
    }),
  });

  assert.equal(summary.rejected, 1);
  assert.deepEqual(summary.exclusionCounts, {
    'quality:competitor_link_missing': 1,
  });
  assert.equal(completed[0].resultRows.length, 0);
});
