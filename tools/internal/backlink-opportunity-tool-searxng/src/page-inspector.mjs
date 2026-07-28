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

function attributeValue(tag, name) {
  return tag.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'))
    ?.slice(1)
    .find((value) => value !== undefined) ?? '';
}

function fieldIdentity(tag) {
  return ['name', 'id', 'placeholder']
    .map((name) => attributeValue(tag, name))
    .join(' ')
    .toLowerCase();
}

function usableField(tag) {
  const type = attributeValue(tag, 'type').toLowerCase();
  return type !== 'hidden' && !/\b(readonly|disabled|hidden)\b/i.test(tag);
}

function formBlocks(html) {
  return [...html.matchAll(/<form\b[^>]*>[\s\S]*?<\/form\s*>/gi)].map((match) => match[0]);
}

function formFields(form) {
  return [...form.matchAll(/<(?:input|textarea)\b[^>]*>/gi)].map((match) => match[0]);
}

function hasField(fields, pattern, requireUsable = false) {
  return fields.some((field) => pattern.test(fieldIdentity(field)) && (!requireUsable || usableField(field)));
}

function submissionKind(text) {
  if (/submit (?:your )?(?:ai )?(?:tool|app|product)|add (?:your )?(?:ai )?(?:tool|app|product)/i.test(text)) return 'tool_directory';
  if (/suggest (?:a )?resource|submit (?:a )?resource|add (?:a )?resource/i.test(text)) return 'resource_page';
  if (/write for us|submit (?:an? )?(?:article|post)|guest post|contribut/i.test(text)) return 'guest_post';
  if (/suggest (?:a )?link|add (?:a )?link|link insertion/i.test(text)) return 'link_insertion';
  return '';
}

function submitSignalledForm(form) {
  const action = attributeValue(form, 'action');
  return /submit|send|suggest|add|contribut|pitch|apply/i.test(action)
    || /<(?:button)\b[^>]*>[^<]*(?:submit|send|suggest|add|contribut|pitch|apply)[^<]*<\/button\s*>/i.test(form)
    || /<input\b[^>]*\b(?:type\s*=\s*(?:"submit"|'submit'|submit)|value\s*=\s*(?:"(?:submit|send|suggest|add|contribute|pitch|apply)[^"]*"|'(?:submit|send|suggest|add|contribute|pitch|apply)[^']*'|(?:submit|send|suggest|add|contribute|pitch|apply)[^\s>]*))[^>]*>/i.test(form);
}

function thirdPartyAttributedMethod(sentence) {
  if (/\baccording\s+to\b/i.test(sentence)) return true;
  return /\b(?:consultants?|coaches?|(?:industry\s+)?experts?|advisers?|advisors?|guides?|tutorials?|research|studies|articles?|publishers?)\b(?:\s+[\w-]+){0,5}\s+\b(?:advise|advises|recommend|recommends|say|says|said|suggest|suggests|teach|teaches|explain|explains|tell|tells)\b/i.test(sentence);
}

function negatedSubmissionMethod(sentence) {
  return /\b(?:(?:do|does)\s+not|don't|never)\s+(?:submit|send|pitch|email|apply|suggest|add)\b/i.test(sentence)
    || /\b(?:must|should|can|may)\s+not\s+(?:submit|send|pitch|email|apply|suggest|add)\b/i.test(sentence);
}

function firstPartySubmissionMethod(sentence) {
  return /\b(?:email|send|submit|pitch|apply|suggest|add)\b[\s\S]*\b(?:to|with|through|via|using|on)\s+(?:us|our\s+(?:editorial\s+team|editors?|submission\s+form)|this\s+(?:site|page|form))\b/i.test(sentence);
}

function imperativeSubmissionMethod(sentence) {
  return /^\s*(?:please\s+)?(?:(?:submit|send|pitch|email|apply|suggest|add)\b|to\s+(?:submit|send|pitch|email|apply|suggest|add)\b)/i.test(sentence);
}

function explicitSubmissionInstructions(text, kind) {
  const submissionObject = {
    tool_directory: /\b(?:tool|app|product)\b/i,
    resource_page: /\b(?:resource|url|link)\b/i,
    guest_post: /\b(?:article|post|pitch|submission|contribution)\b/i,
    link_insertion: /\b(?:link|url)\b/i,
  }[kind];
  if (!submissionObject) return false;
  return text.split(/[.!?]+/).some((sentence) => {
    const firstPartyMethod = firstPartySubmissionMethod(sentence);
    return !negatedSubmissionMethod(sentence)
      && !thirdPartyAttributedMethod(sentence)
      && (firstPartyMethod || imperativeSubmissionMethod(sentence))
      && submissionObject.test(sentence)
      && /\b(?:via|through|using|by|with|to|at|include|including|provide|providing|sending|guidelines?|requirements?|form|email|url|link|description)\b/i.test(sentence);
  });
}

function formSubmissionKind(form, fields) {
  const evidence = [
    attributeValue(form, 'action'),
    attributeValue(form, 'id'),
    attributeValue(form, 'name'),
    attributeValue(form, 'aria-label'),
    stripTags(form),
    ...fields.map(fieldIdentity),
  ].join(' ').replace(/[^\p{L}\p{N}]+/gu, ' ');
  return submissionKind(evidence);
}

function negatedAcceptanceKind(sentence) {
  const firstParty = String.raw`(?:we|our\s+(?:site|publication|blog|magazine|editors?|editorial team)|this\s+(?:site|publication|blog|magazine))`;
  const negatedRelation = new RegExp(
    String.raw`\b${firstParty}\s+(?:(?:do|does)\s+not\s+accept|(?:are|is)\s+not\s+accepting|no\s+longer\s+accept|accepts?\s+no)\b`,
    'i'
  );
  const bareRejection = /^\s*no\s+(?:guest|external|contributed)?\s*(?:articles?|posts?|submissions?|contributions?|pitches?)\b/i;
  if (!negatedRelation.test(sentence) && !bareRejection.test(sentence)) return '';
  if (/\b(?:resource\s+(?:suggestions?|submissions?)|suggested\s+resources?)\b/i.test(sentence)) return 'resource_page';
  if (/\b(?:tool\s+submissions?|submitted\s+tools?)\b/i.test(sentence)) return 'tool_directory';
  if (/\b(?:(?:guest|external|contributed)\s+(?:articles?|posts?)|(?:article|post|guest)\s+submissions?|contributions?|submissions?|pitches?)\b/i.test(sentence)) {
    return 'guest_post';
  }
  return '';
}

function hasNegatedAcceptance(text, kind) {
  return text.split(/[.!?]+/).some((sentence) => negatedAcceptanceKind(sentence) === kind);
}

function firstPartyPublisherAcceptanceKind(text) {
  const relation = /\b(?:we|our\s+(?:site|publication|blog|magazine|editors?|editorial team)|this\s+(?:site|publication|blog|magazine))\s+(?:not\s+only\s+)?(accepts?|publish(?:es)?|seeks?|welcomes?|invites?)\b/gi;
  for (const sentence of text.split(/[.!?]+/)) {
    if (negatedAcceptanceKind(sentence)) continue;
    relation.lastIndex = 0;
    let match;
    while ((match = relation.exec(sentence))) {
      const localObject = sentence
        .slice(match.index + match[0].length)
        .trim()
        .split(/\s+/)
        .slice(0, 6)
        .join(' ');
      if (match[1].toLowerCase().startsWith('publish')) {
        if (/\b(?:(?:guest|external|contributed)\s+(?:articles?|posts?)|(?:article|post|guest)\s+submissions?|contributions?|submissions?|pitches?)\b/i.test(localObject)) {
          return 'guest_post';
        }
        continue;
      }
      if (/\b(?:resource\s+(?:suggestions?|submissions?)|suggested\s+resources?)\b/i.test(localObject)) return 'resource_page';
      if (/\b(?:tool\s+submissions?|submitted\s+tools?)\b/i.test(localObject)) return 'tool_directory';
      if (/\b(?:(?:guest|external|contributed)\s+(?:articles?|posts?)|(?:article|post|guest)\s+submissions?|contributions?|submissions?|pitches?|writers?\s+to\s+(?:submit|pitch|contribute))\b/i.test(localObject)) {
        return 'guest_post';
      }
    }
  }
  return '';
}

function headingGuestPostConfirmed(text, kind, headingText) {
  if (kind !== 'guest_post') return false;
  if (/\b(?:how\s+to|guides?|templates?|build(?:ing)?|creat(?:e|ing))\b/i.test(headingText)) return false;
  if (hasNegatedAcceptance(text, 'guest_post')) return false;
  const firstPartyHeading = /^(?:write for us|contributor guidelines?|guest (?:post|article) guidelines?)$/i.test(headingText.trim());
  if (!firstPartyHeading && firstPartyPublisherAcceptanceKind(text) !== 'guest_post') return false;
  const hasTopicScope = /\b(?:publish|accept|seek|topics?|cover|focus|audience|articles?\s+(?:about|on))\b/i.test(text);
  const hasRequirements = /\b(?:outline|bio|guidelines?|requirements?|original|word count|samples?|draft)\b/i.test(text);
  return hasTopicScope && hasRequirements && explicitSubmissionInstructions(text, 'guest_post');
}

export function detectActionEvidence(html, { competitorLinkVerified = false } = {}) {
  const forms = formBlocks(html);
  const text = visibleText(html);
  const withoutHead = html.replace(/<head\b[^>]*>[\s\S]*?<\/head\s*>/gi, ' ');
  const headingText = [...withoutHead.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1\s*>/gi)]
    .map((match) => stripTags(match[1]))
    .join(' ');
  const headingKind = submissionKind(headingText);
  const bodyText = visibleText(withoutHead.replace(/<h[1-6]\b[^>]*>[\s\S]*?<\/h[1-6]\s*>/gi, ' '));
  const acceptanceKind = firstPartyPublisherAcceptanceKind(bodyText);
  const bodyKind = submissionKind(bodyText) || acceptanceKind;
  const bodyInstructions = Boolean(acceptanceKind)
    && !hasNegatedAcceptance(bodyText, acceptanceKind)
    && explicitSubmissionInstructions(bodyText, acceptanceKind);
  const headingInstructions = !bodyKind && headingGuestPostConfirmed(bodyText, headingKind, headingText);
  const explicitKind = bodyInstructions ? bodyKind : headingInstructions ? headingKind : '';
  const hasExplicitInstructions = Boolean(explicitKind);
  let commentForm = false;
  let websiteField = false;
  let submissionForm = false;
  let detectedKind = '';

  for (const form of forms) {
    const fields = formFields(form);
    const isComment = hasField(fields, /(?:^|\s)(?:name|author|commentauthor)(?:\s|$)/)
      && hasField(fields, /email|mail/)
      && hasField(fields, /comment|message|content/)
      && /comment|reply/i.test(form);
    if (isComment) {
      commentForm = true;
      if (hasField(fields, /url|website|link|homepage/, true)) websiteField = true;
    }
    const formKind = formSubmissionKind(form, fields);
    const kind = submitSignalledForm(form) ? formKind : '';
    if (kind && hasField(fields, /url|website|link|homepage|product|article|post/, true)) {
      submissionForm = true;
      detectedKind ||= kind;
    }
  }

  return {
    comment_form: commentForm,
    website_field: websiteField,
    submission_form: submissionForm,
    submission_kind: detectedKind || explicitKind,
    explicit_submission_instructions: hasExplicitInstructions,
    login_required: /log in to (?:leave|post)|sign in to (?:leave|post)|must be logged in/i.test(text),
    competitor_link_verified: Boolean(competitorLinkVerified),
  };
}

function emptyActionEvidence() {
  return {
    comment_form: false,
    website_field: false,
    submission_form: false,
    submission_kind: '',
    explicit_submission_instructions: false,
    login_required: false,
    competitor_link_verified: false,
  };
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
    action_evidence: emptyActionEvidence(),
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
    return {
      ...record,
      inspection_status: 'skipped',
      inspection_note: record.inspection_note || 'rejected_from_search_data',
      action_evidence: emptyActionEvidence(),
    };
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
    const actionEvidence = detectActionEvidence(html, {
      competitorLinkVerified: Boolean(competitorLink),
    });
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
      inspection_status: 'checked',
      inspection_note: [inspectionNote, firecrawlFallback ? 'firecrawl_fallback' : ''].filter(Boolean).join(';'),
      action_evidence: actionEvidence,
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
