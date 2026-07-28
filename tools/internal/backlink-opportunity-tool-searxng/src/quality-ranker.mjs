import { domainFromUrl } from './core.mjs';

export const QUALITY_RULE_VERSION = 'quality-v1';

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'for', 'in', 'of', 'on', 'or', 'the', 'to', 'with',
  'write', 'guest', 'post', 'resources', 'submit', 'tool',
]);

const COMMON_SECOND_LEVEL_PUBLIC_SUFFIXES = new Set([
  'ac', 'co', 'com', 'edu', 'gov', 'net', 'org', 'sch',
]);

function text(value) {
  return String(value ?? '').trim().toLowerCase();
}

function tokens(value) {
  return [...new Set(text(value)
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token)))];
}

function competitorHostname(input) {
  try {
    return domainFromUrl(input);
  } catch {
    return text(input)
      .replace(/^https?:\/\//i, '')
      .replace(/^www\./i, '')
      .replace(/\/.*$/, '');
  }
}

function pageHostname(record) {
  try {
    return domainFromUrl(record.referring_page_url);
  } catch {
    return text(record.referring_domain);
  }
}

function isCompetitorSelfLink(record, input) {
  const competitor = competitorHostname(input);
  const referring = pageHostname(record);
  return Boolean(competitor && referring && (referring === competitor || referring.endsWith(`.${competitor}`)));
}

function isPlatformPage(record) {
  const hostname = pageHostname(record);
  return hostname === 'apps.apple.com'
    || hostname === 'play.google.com'
    || hostname === 'chromewebstore.google.com'
    || hostname === 'wikipedia.org'
    || hostname.endsWith('.wikipedia.org');
}

function registrableSubject(hostname) {
  const labels = text(hostname).split('.').filter(Boolean);
  if (labels.length < 2) return labels[0] || '';
  const suffixLength = labels.at(-1).length === 2
    && COMMON_SECOND_LEVEL_PUBLIC_SUFFIXES.has(labels.at(-2))
    ? 2
    : 1;
  return labels.at(-(suffixLength + 1)) || labels[0];
}

function relevanceScore(record, input, mode) {
  const hostname = mode === 'competitor' ? competitorHostname(input) : '';
  const phrase = mode === 'competitor' ? registrableSubject(hostname) : text(input);
  const titleAndUrl = [
    record.page_title,
    record.referring_page_url,
  ].map(text).join(' ');
  const body = text(record.snippet);
  const anchor = mode === 'competitor' ? text(record.anchor_text) : '';
  const inputTokens = tokens(phrase);
  const combined = `${titleAndUrl} ${body} ${anchor}`;
  const hostnameEvidence = mode === 'competitor'
    && hostname !== phrase
    && combined.includes(hostname)
    ? 5
    : 0;
  const coverage = inputTokens.length
    ? inputTokens.filter((token) => combined.includes(token)).length / inputTokens.length
    : 0;
  const bodyCoverage = inputTokens.length
    ? inputTokens.filter((token) => body.includes(token)).length / inputTokens.length
    : 0;
  return Math.min(
    50,
    (phrase && titleAndUrl.includes(phrase) ? 25 : 0)
      + Math.round(coverage * 15)
      + Math.round(bodyCoverage * 10)
      + hostnameEvidence,
  );
}

function actionability(record, mode) {
  const evidence = record.action_evidence ?? {};
  if (evidence.submission_form) return { score: 35, type: evidence.submission_kind || 'link_insertion' };
  if (evidence.explicit_submission_instructions) {
    return {
      score: mode === 'competitor' && evidence.competitor_link_verified ? 25 : 22,
      type: evidence.submission_kind || 'guest_post',
    };
  }
  if (evidence.comment_form && evidence.website_field) return { score: 35, type: 'blog_comment' };
  if (mode === 'competitor' && evidence.competitor_link_verified) return { score: 25, type: 'competitor_backlink' };
  return { score: 0, type: 'other' };
}

function pageQuality(record) {
  const count = record.external_link_count;
  const accessible = record.inspection_status === 'checked' ? 5 : 0;
  if (count === null || count === undefined || count === '') return accessible + 5;
  if (Number(count) <= 500) return accessible + 10;
  if (Number(count) <= 2000) return accessible + 3;
  return 0;
}

function rejected(record, reason, components = {}) {
  return {
    ...record,
    machine_status: 'rejected',
    quality_priority: 'excluded',
    exclude_reason: reason,
    quality_rule_version: QUALITY_RULE_VERSION,
    quality_score: Object.values(components).reduce((sum, value) => sum + Number(value || 0), 0),
    quality_components: components,
  };
}

export function evaluateOpportunity(record, { mode, input }) {
  const relevance = relevanceScore(record, input, mode);
  const action = actionability(record, mode);
  const quality = pageQuality(record);
  const components = {
    relevance,
    actionability: action.score,
    pageQuality: quality,
  };

  if (record.safety_status === 'rejected') return rejected(record, record.exclude_reason || 'quality:safety_rejected', components);
  if (isPlatformPage(record)) return rejected(record, 'quality:platform_not_actionable', components);
  if (mode === 'competitor' && isCompetitorSelfLink(record, input)) {
    return rejected(record, 'quality:competitor_self_link', components);
  }
  if (mode === 'keyword' && action.type === 'blog_comment') {
    return rejected(record, 'quality:blog_comment_not_allowed', components);
  }
  if (record.inspection_status !== 'checked') return rejected(record, 'quality:page_unavailable', components);
  if (Number(record.external_link_count) > 2000) return rejected(record, 'quality:external_links_above_2000', components);
  if (mode === 'competitor' && !record.action_evidence?.competitor_link_verified) {
    return rejected(record, 'quality:competitor_link_missing', components);
  }
  if (action.score < 15) return rejected(record, 'quality:actionability_below_15', components);
  if (relevance < 20) return rejected(record, 'quality:relevance_below_20', components);
  if (record.action_evidence?.login_required
    && !record.action_evidence?.submission_form
    && !(record.action_evidence?.comment_form && record.action_evidence?.website_field)) {
    return rejected(record, 'quality:login_required', components);
  }
  return {
    ...record,
    opportunity_type: action.type,
    machine_status: 'qualified',
    quality_priority: 'normal',
    exclude_reason: '',
    quality_rule_version: QUALITY_RULE_VERSION,
    quality_score: relevance + action.score + quality,
    quality_components: components,
  };
}

function externalLinkSortValue(record) {
  const value = record.external_link_count;
  return value === null || value === undefined || value === '' ? Number.POSITIVE_INFINITY : Number(value);
}

function compareQuality(left, right) {
  return right.quality_score - left.quality_score
    || right.quality_components.actionability - left.quality_components.actionability
    || right.quality_components.relevance - left.quality_components.relevance
    || externalLinkSortValue(left) - externalLinkSortValue(right)
    || String(left.referring_page_url).localeCompare(String(right.referring_page_url));
}

export function selectTopOpportunities(records, { mode, input, limit }) {
  const evaluated = records.map((record) => evaluateOpportunity(record, { mode, input }));
  const qualified = evaluated.filter((record) => record.machine_status === 'qualified').sort(compareQuality);
  const rejectedRecords = evaluated.filter((record) => record.machine_status !== 'qualified');
  const exclusionCounts = {};
  for (const record of rejectedRecords) {
    exclusionCounts[record.exclude_reason] = (exclusionCounts[record.exclude_reason] || 0) + 1;
  }
  const finalTypeCounts = {};
  for (const record of qualified.slice(0, limit)) {
    finalTypeCounts[record.opportunity_type] = (finalTypeCounts[record.opportunity_type] || 0) + 1;
  }
  return {
    selected: qualified.slice(0, Math.max(1, Number(limit) || 1)),
    rejected: rejectedRecords,
    diagnostics: {
      ruleVersion: QUALITY_RULE_VERSION,
      qualifiedBeforeLimit: qualified.length,
      exclusionCounts,
      finalTypeCounts,
    },
  };
}
