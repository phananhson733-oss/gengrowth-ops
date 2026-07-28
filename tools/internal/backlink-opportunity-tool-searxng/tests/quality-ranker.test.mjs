import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import {
  QUALITY_RULE_VERSION,
  evaluateOpportunity,
  selectTopOpportunities,
} from '../src/quality-ranker.mjs';

function record(overrides = {}) {
  return {
    referring_page_url: 'https://example.com/ai-writing-tools',
    page_title: 'AI writing tools for editorial teams',
    snippet: 'Compare AI writing tools and practical editorial workflows.',
    external_link_count: 20,
    safety_status: 'passed',
    inspection_status: 'checked',
    machine_status: 'qualified',
    opportunity_type: 'other',
    action_evidence: {
      comment_form: false,
      website_field: false,
      submission_form: false,
      submission_kind: '',
      explicit_submission_instructions: false,
      login_required: false,
      competitor_link_verified: false,
    },
    ...overrides,
  };
}

test('quality rule version is fixed and explicit', () => {
  assert.equal(QUALITY_RULE_VERSION, 'quality-v1');
});

test('keyword-mode blog comments are excluded even when the comment form is writable', () => {
  const result = evaluateOpportunity(record({
    action_evidence: {
      ...record().action_evidence,
      comment_form: true,
      website_field: true,
    },
  }), { mode: 'keyword', input: 'AI writing tools' });

  assert.equal(result.machine_status, 'rejected');
  assert.equal(result.exclude_reason, 'quality:blog_comment_not_allowed');
  assert.equal(result.quality_components.actionability, 35);
});

test('keyword submission evidence wins over a coexisting comment form', () => {
  const result = evaluateOpportunity(record({
    action_evidence: {
      ...record().action_evidence,
      comment_form: true,
      website_field: true,
      submission_form: true,
      submission_kind: 'tool_directory',
    },
  }), { mode: 'keyword', input: 'AI writing tools' });

  assert.equal(result.machine_status, 'qualified');
  assert.equal(result.opportunity_type, 'tool_directory');
  assert.equal(result.quality_components.actionability, 35);
});

test('keyword editorial instructions win over a coexisting comment form', () => {
  const result = evaluateOpportunity(record({
    action_evidence: {
      ...record().action_evidence,
      comment_form: true,
      website_field: true,
      explicit_submission_instructions: true,
      submission_kind: 'guest_post',
    },
  }), { mode: 'keyword', input: 'AI writing tools' });

  assert.equal(result.machine_status, 'qualified');
  assert.equal(result.opportunity_type, 'guest_post');
  assert.equal(result.quality_components.actionability, 22);
});

test('a generic guest-post article without an action path is rejected', () => {
  const result = evaluateOpportunity(record({
    referring_page_url: 'https://example.com/guide-to-guest-posting',
    page_title: 'How to use AI tools for guest posting',
    snippet: 'A general article explaining guest-post outreach.',
  }), { mode: 'keyword', input: 'AI writing tools' });

  assert.equal(result.machine_status, 'rejected');
  assert.equal(result.exclude_reason, 'quality:actionability_below_15');
});

test('a relevant submission form remains qualified and is classified from page evidence', () => {
  const result = evaluateOpportunity(record({
    action_evidence: {
      ...record().action_evidence,
      submission_form: true,
      submission_kind: 'tool_directory',
    },
  }), { mode: 'keyword', input: 'AI writing tools' });

  assert.equal(result.machine_status, 'qualified');
  assert.equal(result.opportunity_type, 'tool_directory');
  assert.equal(result.quality_components.actionability, 35);
});

test('an off-topic page is rejected even when it has a submission form', () => {
  const result = evaluateOpportunity(record({
    referring_page_url: 'https://example.com/submit-recipe',
    page_title: 'Submit your favorite soup recipe',
    snippet: 'Share ingredients and cooking instructions with our food community.',
    action_evidence: {
      ...record().action_evidence,
      submission_form: true,
      submission_kind: 'resource_page',
    },
  }), { mode: 'keyword', input: 'AI writing tools' });

  assert.equal(result.machine_status, 'rejected');
  assert.equal(result.exclude_reason, 'quality:relevance_below_20');
});

test('a page failing both actionability and relevance reports actionability first', () => {
  const candidate = record({
    referring_page_url: 'https://example.com/submit-recipe',
    page_title: 'Submit your favorite soup recipe',
    snippet: 'Share ingredients and cooking instructions with our food community.',
  });
  const result = evaluateOpportunity(candidate, { mode: 'keyword', input: 'AI writing tools' });
  const selection = selectTopOpportunities([candidate], {
    mode: 'keyword',
    input: 'AI writing tools',
    limit: 1,
  });

  assert.equal(result.machine_status, 'rejected');
  assert.equal(result.quality_components.relevance < 20, true);
  assert.equal(result.quality_components.actionability < 15, true);
  assert.equal(result.exclude_reason, 'quality:actionability_below_15');
  assert.equal(selection.diagnostics.exclusionCounts['quality:actionability_below_15'], 1);
  assert.equal(selection.diagnostics.exclusionCounts['quality:relevance_below_20'] ?? 0, 0);
});

test('competitor mode requires verified backlink evidence', () => {
  const result = evaluateOpportunity(record({
    competitor_domain: 'competitor.example',
    page_title: 'Competitor example product review',
    snippet: 'A review of competitor.example products.',
    action_evidence: {
      ...record().action_evidence,
      explicit_submission_instructions: true,
      submission_kind: 'guest_post',
      competitor_link_verified: false,
    },
  }), { mode: 'competitor', input: 'competitor.example' });

  assert.equal(result.machine_status, 'rejected');
  assert.equal(result.exclude_reason, 'quality:competitor_link_missing');
});

test('competitor relevance treats a domain and full URL input equivalently', () => {
  const candidate = record({
    page_title: 'Competitor.example product review',
    snippet: 'An independent review of Competitor.example for editorial teams.',
    action_evidence: {
      ...record().action_evidence,
      competitor_link_verified: true,
    },
  });
  const fromDomain = evaluateOpportunity(candidate, {
    mode: 'competitor',
    input: 'competitor.example',
  });
  const fromUrl = evaluateOpportunity(candidate, {
    mode: 'competitor',
    input: 'https://www.competitor.example/products?ref=research',
  });

  assert.equal(fromDomain.machine_status, 'qualified');
  assert.equal(fromUrl.machine_status, 'qualified');
  assert.equal(fromUrl.quality_components.relevance, fromDomain.quality_components.relevance);
});

test('competitor self-links and subdomains are excluded', () => {
  const evidence = {
    ...record().action_evidence,
    competitor_link_verified: true,
  };
  for (const referring_page_url of [
    'https://competitor.example/reviews',
    'https://blog.competitor.example/reviews',
  ]) {
    const result = evaluateOpportunity(record({
      referring_page_url,
      page_title: 'Competitor.example editorial review',
      snippet: 'Independent-looking Competitor.example editorial review.',
      action_evidence: evidence,
    }), { mode: 'competitor', input: 'https://competitor.example/products' });

    assert.equal(result.machine_status, 'rejected');
    assert.equal(result.exclude_reason, 'quality:competitor_self_link');
  }
});

test('independent competitor backlinks retain their qualified result', () => {
  const result = evaluateOpportunity(record({
    referring_page_url: 'https://publisher.example/competitor-review',
    page_title: 'Competitor.example editorial review',
    snippet: 'Competitor.example is reviewed by an independent publisher.',
    action_evidence: {
      ...record().action_evidence,
      competitor_link_verified: true,
    },
  }), { mode: 'competitor', input: 'competitor.example' });

  assert.equal(result.machine_status, 'qualified');
  assert.equal(result.opportunity_type, 'competitor_backlink');
});

test('platform and Wikipedia pages are excluded as not actionable', () => {
  const evidence = {
    ...record().action_evidence,
    submission_form: true,
    submission_kind: 'tool_directory',
  };
  for (const referring_page_url of [
    'https://apps.apple.com/us/app/example/id123',
    'https://play.google.com/store/apps/details?id=com.example',
    'https://chromewebstore.google.com/detail/example/abcdefghijklmnop',
    'https://en.wikipedia.org/wiki/Example',
    'https://zh.wikipedia.org/wiki/Example',
    'https://www.wikipedia.org/wiki/Example',
  ]) {
    const result = evaluateOpportunity(record({ referring_page_url, action_evidence: evidence }), {
      mode: 'keyword',
      input: 'AI writing tools',
    });

    assert.equal(result.machine_status, 'rejected');
    assert.equal(result.exclude_reason, 'quality:platform_not_actionable');
  }
});

test('platform exclusion takes priority when the competitor input is a platform domain', () => {
  const result = evaluateOpportunity(record({
    referring_page_url: 'https://apps.apple.com/us/app/example/id123',
    page_title: 'Example product listing',
    snippet: 'Example product listing for writing teams.',
    action_evidence: {
      ...record().action_evidence,
      competitor_link_verified: true,
    },
  }), { mode: 'competitor', input: 'https://apps.apple.com/us/app/competitor/id987' });

  assert.equal(result.machine_status, 'rejected');
  assert.equal(result.exclude_reason, 'quality:platform_not_actionable');
});

test('competitor relevance uses the Grammarly brand rather than requiring the public suffix', () => {
  const candidate = record({
    referring_page_url: 'https://publisher.net/editorial-review',
    page_title: 'Grammarly review',
    snippet: 'Grammarly helps editorial teams improve their writing.',
    anchor_text: 'Grammarly',
    action_evidence: {
      ...record().action_evidence,
      competitor_link_verified: true,
    },
  });
  const fromDomain = evaluateOpportunity(candidate, {
    mode: 'competitor',
    input: 'grammarly.com',
  });
  const fromUrl = evaluateOpportunity(candidate, {
    mode: 'competitor',
    input: 'https://www.grammarly.com/business?ref=review',
  });

  assert.equal(fromDomain.machine_status, 'qualified');
  assert.equal(fromUrl.machine_status, 'qualified');
  assert.equal(fromUrl.quality_components.relevance, fromDomain.quality_components.relevance);
});

test('competitor relevance uses the Jasper brand rather than requiring the public suffix', () => {
  const candidate = record({
    referring_page_url: 'https://publisher.net/editorial-review',
    page_title: 'Jasper review',
    snippet: 'Jasper supports editorial teams with writing workflows.',
    anchor_text: 'Jasper',
    action_evidence: {
      ...record().action_evidence,
      competitor_link_verified: true,
    },
  });
  const fromDomain = evaluateOpportunity(candidate, {
    mode: 'competitor',
    input: 'jasper.ai',
  });
  const fromUrl = evaluateOpportunity(candidate, {
    mode: 'competitor',
    input: 'https://jasper.ai/features',
  });

  assert.equal(fromDomain.machine_status, 'qualified');
  assert.equal(fromUrl.machine_status, 'qualified');
  assert.equal(fromUrl.quality_components.relevance, fromDomain.quality_components.relevance);
});

test('competitor relevance ignores a common multi-level public suffix', () => {
  const candidate = record({
    referring_page_url: 'https://publisher.net/editorial-review',
    page_title: 'Writesonic review',
    snippet: 'Writesonic is compared with other editorial assistants.',
    anchor_text: 'Writesonic',
    action_evidence: {
      ...record().action_evidence,
      competitor_link_verified: true,
    },
  });
  const result = evaluateOpportunity(candidate, {
    mode: 'competitor',
    input: 'https://www.writesonic.co.uk/products',
  });

  assert.equal(result.machine_status, 'qualified');
  assert.equal(result.quality_components.relevance >= 20, true);
});

test('a verified competitor link alone does not make an unrelated page topically relevant', () => {
  const result = evaluateOpportunity(record({
    referring_page_url: 'https://publisher.example/soup-recipes',
    page_title: 'Classic soup recipes for winter',
    snippet: 'Ingredients, cooking times and serving suggestions.',
    competitor_domain: 'competitor.example',
    competitor_target_url: 'https://competitor.example/products',
    anchor_text: 'Visit website',
    action_evidence: {
      ...record().action_evidence,
      competitor_link_verified: true,
    },
  }), { mode: 'competitor', input: 'https://competitor.example' });

  assert.equal(result.quality_components.actionability, 25);
  assert.equal(result.quality_components.relevance < 20, true);
  assert.equal(result.machine_status, 'rejected');
  assert.equal(result.exclude_reason, 'quality:relevance_below_20');
});

test('a verified competitor link uses neutral page evidence instead of the search-stage type', () => {
  const result = evaluateOpportunity(record({
    page_title: 'Competitor.example product review',
    snippet: 'Independent coverage of Competitor.example.',
    opportunity_type: 'guest_post',
    action_evidence: {
      ...record().action_evidence,
      competitor_link_verified: true,
    },
  }), { mode: 'competitor', input: 'competitor.example' });

  assert.equal(result.machine_status, 'qualified');
  assert.equal(result.quality_components.actionability, 25);
  assert.equal(result.opportunity_type, 'competitor_backlink');
});

test('verified competitor links keep at least 25 actionability with explicit submission instructions', () => {
  const result = evaluateOpportunity(record({
    page_title: 'Competitor.example editorial review',
    snippet: 'A Competitor.example review with contributor guidelines.',
    action_evidence: {
      ...record().action_evidence,
      explicit_submission_instructions: true,
      submission_kind: 'guest_post',
      competitor_link_verified: true,
    },
  }), { mode: 'competitor', input: 'competitor.example' });

  assert.equal(result.machine_status, 'qualified');
  assert.equal(result.quality_components.actionability, 25);
  assert.equal(result.opportunity_type, 'guest_post');
});

test('a verified competitor page with a submission form reaches 35 actionability', () => {
  const result = evaluateOpportunity(record({
    page_title: 'Competitor.example tools directory',
    snippet: 'Competitor.example appears in this tools directory.',
    action_evidence: {
      ...record().action_evidence,
      submission_form: true,
      submission_kind: 'tool_directory',
      competitor_link_verified: true,
    },
  }), { mode: 'competitor', input: 'competitor.example' });

  assert.equal(result.machine_status, 'qualified');
  assert.equal(result.quality_components.actionability, 35);
  assert.equal(result.opportunity_type, 'tool_directory');
});

test('external link thresholds downgrade or reject otherwise identical pages', () => {
  const evidence = {
    ...record().action_evidence,
    submission_form: true,
    submission_kind: 'tool_directory',
  };
  const normal = evaluateOpportunity(record({ external_link_count: 500, action_evidence: evidence }), {
    mode: 'keyword',
    input: 'AI writing tools',
  });
  const diluted = evaluateOpportunity(record({ external_link_count: 501, action_evidence: evidence }), {
    mode: 'keyword',
    input: 'AI writing tools',
  });
  const rejected = evaluateOpportunity(record({ external_link_count: 2001, action_evidence: evidence }), {
    mode: 'keyword',
    input: 'AI writing tools',
  });

  assert.equal(normal.quality_components.pageQuality, 15);
  assert.equal(diluted.quality_components.pageQuality, 8);
  assert.equal(rejected.exclude_reason, 'quality:external_links_above_2000');
});

test('selection is deterministic and applies the final limit after scoring', () => {
  const evidence = {
    ...record().action_evidence,
    submission_form: true,
    submission_kind: 'tool_directory',
  };
  const input = [
    record({ referring_page_url: 'https://b.example/post', external_link_count: 20, action_evidence: evidence }),
    record({ referring_page_url: 'https://a.example/post', external_link_count: 10, action_evidence: evidence }),
  ];
  const result = selectTopOpportunities(input, { mode: 'keyword', input: 'AI writing tools', limit: 1 });

  assert.deepEqual(result.selected.map((item) => item.referring_page_url), ['https://a.example/post']);
  assert.equal(result.diagnostics.ruleVersion, 'quality-v1');
});
