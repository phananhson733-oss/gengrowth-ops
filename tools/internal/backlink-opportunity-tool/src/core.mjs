const TRACKING_PARAMETER = /^(utm_[a-z0-9_]+|gclid|fbclid|mc_[a-z0-9_]+)$/i;

const SAFETY_RULES = [
  { category: 'gambling', terms: ['casino', 'sportsbook', 'sports betting', 'betting', 'poker bonus', 'slot machine', '博彩', '赌场', '赌博'] },
  { category: 'adult', terms: ['porn', 'xxx', 'escort', 'onlyfans', '性爱', '色情', '成人影片'] },
  { category: 'drugs', terms: ['cocaine', 'heroin', 'methamphetamine', 'fentanyl', 'buy weed', '可卡因', '海洛因', '冰毒'] },
  { category: 'scam', terms: ['phishing', 'loan scam', 'fake passport', '诈骗', '钓鱼网站', '假护照'] },
  { category: 'malware', terms: ['free crack', 'keygen', 'ransomware', 'malware download', '勒索软件', '破解软件下载'] },
];

export const CSV_COLUMNS = [
  'id',
  'source_mode',
  'source_input',
  'sources',
  'referring_page_url',
  'referring_domain',
  'page_title',
  'snippet',
  'competitor_domain',
  'competitor_target_url',
  'anchor_text',
  'link_attribute',
  'external_link_count',
  'domain_dr',
  'dr_source',
  'spam_score',
  'opportunity_type',
  'topic_relevance',
  'safety_status',
  'safety_category',
  'exclude_reason',
  'machine_status',
  'human_status',
  'quality_priority',
  'inspection_status',
  'inspection_note',
  'discovered_at',
  'last_checked_at',
];

const NUMBER_COLUMNS = new Set(['external_link_count', 'domain_dr', 'spam_score']);
const JSON_COLUMNS = new Set(['sources']);

function asText(value) {
  return String(value ?? '').trim();
}

function normaliseInputUrl(value) {
  const text = asText(value);
  if (!text) {
    throw new Error('URL is required');
  }
  return /^[a-z][a-z0-9+.-]*:/i.test(text) ? text : `https://${text}`;
}

export function canonicalizeUrl(value) {
  const url = new URL(normaliseInputUrl(value));
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('Only HTTP and HTTPS URLs are supported');
  }

  url.hash = '';
  for (const key of [...url.searchParams.keys()]) {
    if (TRACKING_PARAMETER.test(key)) {
      url.searchParams.delete(key);
    }
  }
  url.searchParams.sort();

  if (url.pathname.length > 1) {
    url.pathname = url.pathname.replace(/\/+$/, '');
  }
  return url.toString().replace(/\/$/, (match, offset, whole) => (new URL(whole).pathname === '/' ? match : ''));
}

export function domainFromUrl(value) {
  return new URL(canonicalizeUrl(value)).hostname.replace(/^www\./i, '').toLowerCase();
}

export function evaluateSafety({ url = '', title = '', snippet = '' }) {
  const haystack = `${url}\n${title}\n${snippet}`.toLowerCase();
  for (const rule of SAFETY_RULES) {
    const term = rule.terms.find((candidate) => haystack.includes(candidate.toLowerCase()));
    if (term) {
      return {
        status: 'rejected',
        category: rule.category,
        reason: `matched:${term}`,
      };
    }
  }
  return { status: 'passed', category: '', reason: '' };
}

export function classifyOpportunity({ url = '', title = '', snippet = '' }) {
  const haystack = `${url}\n${title}\n${snippet}`.toLowerCase();
  if (/write for us|guest post|submit (an? )?(article|post)|contribute/.test(haystack)) {
    return 'guest_post';
  }
  if (/submit (your )?(tool|app|product)|add (your )?(tool|app|product)|tool directory|software directory/.test(haystack)) {
    return 'tool_directory';
  }
  if (/resources?|recommended (tools|websites|reading)|useful links|best (tools|websites)/.test(haystack)) {
    return 'resource_page';
  }
  if (/suggest (a )?(link|resource)|add (a )?link|link insertion/.test(haystack)) {
    return 'link_insertion';
  }
  if (/leave a (reply|comment)|post a comment|comment-form|comments?\//.test(haystack)) {
    return 'blog_comment';
  }
  return 'other';
}

function stableId(value) {
  let hash = 2166136261;
  for (const char of value) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return `bo_${(hash >>> 0).toString(36)}`;
}

function linkAttribute(backlink) {
  if (backlink.is_sponsored || backlink.sponsored) return 'sponsored';
  if (backlink.is_ugc || backlink.ugc) return 'ugc';
  if (backlink.nofollow || backlink.is_nofollow) return 'nofollow';
  return 'dofollow';
}

function sourceForKeyword({ keyword, language = '', region = '' }) {
  return {
    mode: 'keyword',
    input: asText(keyword),
    language: asText(language),
    region: asText(region),
  };
}

function sourceForCompetitor({ competitorDomain }) {
  return {
    mode: 'competitor',
    input: asText(competitorDomain).toLowerCase(),
    language: '',
    region: '',
  };
}

function buildRecord({
  sourceMode,
  sourceInput,
  source,
  url,
  title = '',
  snippet = '',
  competitorDomain = '',
  competitorTargetUrl = '',
  anchorText = '',
  linkAttributeValue = 'unknown',
  externalLinkCount = null,
}) {
  const referringPageUrl = canonicalizeUrl(url);
  const safety = evaluateSafety({ url: referringPageUrl, title, snippet });
  return {
    id: stableId(referringPageUrl),
    source_mode: sourceMode,
    source_input: sourceInput,
    sources: [source],
    referring_page_url: referringPageUrl,
    referring_domain: domainFromUrl(referringPageUrl),
    page_title: asText(title),
    snippet: asText(snippet),
    competitor_domain: asText(competitorDomain).toLowerCase(),
    competitor_target_url: competitorTargetUrl ? canonicalizeUrl(competitorTargetUrl) : '',
    anchor_text: asText(anchorText),
    link_attribute: linkAttributeValue,
    external_link_count: Number.isFinite(Number(externalLinkCount)) && externalLinkCount !== '' ? Number(externalLinkCount) : null,
    domain_dr: null,
    dr_source: '',
    spam_score: null,
    opportunity_type: classifyOpportunity({ url: referringPageUrl, title, snippet }),
    topic_relevance: 'unknown',
    safety_status: safety.status,
    safety_category: safety.category,
    exclude_reason: safety.reason,
    machine_status: safety.status === 'rejected' ? 'rejected' : 'qualified',
    human_status: 'pending',
    quality_priority: safety.status === 'rejected' ? 'excluded' : 'normal',
    inspection_status: safety.status === 'rejected' ? 'skipped' : 'not_checked',
    inspection_note: safety.status === 'rejected' ? 'rejected_from_search_data' : '',
    discovered_at: '',
    last_checked_at: '',
  };
}

export function fromSerpResult(result, context) {
  const source = sourceForKeyword(context);
  return buildRecord({
    sourceMode: 'keyword',
    sourceInput: source.input,
    source,
    url: result.link ?? result.url,
    title: result.title,
    snippet: result.snippet ?? result.description,
  });
}

export function fromAhrefsBacklink(backlink, context) {
  const source = sourceForCompetitor(context);
  return buildRecord({
    sourceMode: 'competitor',
    sourceInput: source.input,
    source,
    url: backlink.url_from ?? backlink.referring_page_url,
    title: backlink.title ?? backlink.page_title,
    snippet: backlink.snippet ?? backlink.text_pre,
    competitorDomain: source.input,
    competitorTargetUrl: backlink.url_to,
    anchorText: backlink.anchor,
    linkAttributeValue: linkAttribute(backlink),
    externalLinkCount: backlink.links_external ?? backlink.page_from_external_links,
  });
}

function sourceKey(source) {
  return JSON.stringify(source);
}

function mergeRecord(existing, incoming) {
  const sources = [...existing.sources];
  const known = new Set(sources.map(sourceKey));
  for (const source of incoming.sources) {
    if (!known.has(sourceKey(source))) {
      sources.push(source);
    }
  }
  const merged = { ...existing, sources };
  for (const key of ['page_title', 'snippet', 'competitor_domain', 'competitor_target_url', 'anchor_text']) {
    if (!merged[key] && incoming[key]) merged[key] = incoming[key];
  }
  if (merged.external_link_count === null && incoming.external_link_count !== null) {
    merged.external_link_count = incoming.external_link_count;
  }
  return merged;
}

export function mergeOpportunities(existingRecords = [], incomingRecords = []) {
  const records = new Map();
  for (const record of [...existingRecords, ...incomingRecords]) {
    const key = canonicalizeUrl(record.referring_page_url);
    records.set(key, records.has(key) ? mergeRecord(records.get(key), record) : { ...record, sources: [...record.sources] });
  }
  return [...records.values()];
}

function escapeCsv(value) {
  const text = String(value ?? '');
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function parseCsvRows(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      row.push(cell);
      cell = '';
    } else if (char === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else if (char !== '\r') {
      cell += char;
    }
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

export function toCsv(records = []) {
  const lines = [CSV_COLUMNS.join(',')];
  for (const record of records) {
    lines.push(CSV_COLUMNS.map((column) => escapeCsv(JSON_COLUMNS.has(column) ? JSON.stringify(record[column] ?? []) : record[column])).join(','));
  }
  return `${lines.join('\n')}\n`;
}

export function parseCsv(text) {
  const [header = [], ...rows] = parseCsvRows(asText(text));
  if (header.join(',') !== CSV_COLUMNS.join(',')) {
    throw new Error('CSV headers do not match the backlink opportunity schema');
  }
  return rows.filter((row) => row.some(Boolean)).map((row) => Object.fromEntries(CSV_COLUMNS.map((column, index) => {
    const value = row[index] ?? '';
    if (JSON_COLUMNS.has(column)) return [column, value ? JSON.parse(value) : []];
    if (NUMBER_COLUMNS.has(column)) return [column, value === '' ? null : Number(value)];
    return [column, value];
  })));
}
