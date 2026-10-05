import { createHash } from "node:crypto";
import { ShortDramaError } from './errors.mjs';
import { parseQualifiedInstantMs } from './qualified-iso.mjs';

const DAY = 86_400_000;
const fail = (code, message) => { throw new ShortDramaError(code, message); };
const one = value => Array.isArray(value) && value.length === 1 && typeof value[0]?.id === 'string' ? value[0].id : null;
const plain = value => typeof value === 'string' ? value.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').trim() : '';
const normalized = value => plain(value).normalize('NFKC').toLowerCase().replace(/[’']/g, ' ').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const titleIn = (title, caption) => normalized(title).length >= 8 && ` ${normalized(caption)} `.includes(` ${normalized(title)} `);
const part = (text, release = false) => {
  const values = [...String(text ?? '').matchAll(release ? /第\s*(\d+)\s*条/g : /\bpart\s*(\d+)\b/gi)].map(x => Number(x[1]));
  return new Set(values).size === 1 ? values[0] : null;
};
function day(value) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const ms = Date.parse(`${value}T00:00:00Z`);
    return Number.isFinite(ms) && new Date(ms).toISOString().slice(0, 10) === value ? value : null;
  }
  const ms = parseQualifiedInstantMs(value);
  return ms === null ? null : new Date(ms + 8 * 3_600_000).toISOString().slice(0, 10);
}
function postIdentity(url) {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol) || !/(^|\.)tiktok\.com$/i.test(parsed.hostname)) return null;
    const m = parsed.pathname.match(/^\/@([^/]+)\/(?:video|photo)\/(\d+)\/?$/);
    return m ? { account: m[1].toLowerCase(), id: m[2], kind: parsed.pathname.includes('/photo/') ? 'photo' : 'video' } : null;
  } catch { return null; }
}

export function canonicalCapturePostUrl(value) {
  const identity = postIdentity(value);
  return identity ? `https://www.tiktok.com/@${identity.account}/${identity.kind}/${identity.id}` : null;
}

export function captureMatchVersion(record) {
  return createHash('sha256').update(JSON.stringify({ record_id: record.record_id,
    fields: Object.fromEntries(['Post ID', '账号', '视频链接', '发布时间'].map(name => [name, record.fields[name] ?? null]))
  })).digest('hex');
}

export function releaseMatchVersion(fields) {
  return createHash('sha256').update(JSON.stringify(Object.fromEntries(
    ['发布ID', '账号', '剧', '日期', '备注', '归档状态', 'Post ID', '视频链接', '采集记录'].map(name => [name, fields[name] ?? null])
  ))).digest('hex');
}

/** Pure projection over complete Base indexes and existing source captions; never writes. */
export async function queryReleaseCandidates({ repos, readPosts, now = new Date(), key, date } = {}) {
  if (key !== undefined && (typeof key !== 'string' || !key || key.trim() !== key) ||
      date !== undefined && (typeof date !== 'string' || day(date) !== date) || key !== undefined && date !== undefined) {
    fail('candidate_query_invalid', 'Use one normalized key or a real YYYY-MM-DD date');
  }
  if (!(now instanceof Date) || !Number.isFinite(now.getTime())) fail('candidate_query_invalid', 'Clock is invalid');
  const [accounts, dramas, captures, releases] = await Promise.all(['accounts', 'dramas', 'captures', 'releases'].map(name => repos[name].loadIndex()));
  for (const index of [accounts, dramas, captures, releases]) if (!(index instanceof Map)) fail('base_response_incomplete', 'Complete indexes are required');
  const posts = await readPosts();
  if (!Array.isArray(posts)) fail('candidate_source_invalid', 'Source posts are unavailable');
  const source = new Map();
  for (const post of posts) {
    if (!post || typeof post.post_id !== 'string' || source.has(post.post_id)) fail('candidate_source_invalid', 'Source identity is malformed or duplicated');
    source.set(post.post_id, post);
  }
  const accountByRecord = new Map([...accounts].map(([id, record]) => [record.record_id, { id, ...record.fields }]));
  const dramaByRecord = new Map([...dramas.values()].map(record => [record.record_id, record.fields]));
  const captureByRecord = new Map([...captures].map(([id, record]) => [record.record_id, id]));
  const owners = new Map();
  const reserve = (id, release) => { if (id) { if (!owners.has(id)) owners.set(id, new Set()); owners.get(id).add(release); } };
  for (const [id, record] of releases) {
    const f = record.fields;
    reserve(f['Post ID'], id); reserve(postIdentity(f.视频链接)?.id, id);
    for (const relation of Array.isArray(f.采集记录) ? f.采集记录 : []) reserve(captureByRecord.get(relation.id), id);
  }
  for (const [id, record] of captures) for (const link of record.fields.关联发布记录 ?? []) reserve(id, link.id);
  const today = day(now.toISOString());
  const from = new Date(Date.parse(`${today}T00:00:00Z`) - 7 * DAY).toISOString().slice(0, 10);
  const until = new Date(Date.parse(`${today}T00:00:00Z`) - DAY).toISOString().slice(0, 10);
  if (key && !releases.has(key)) fail('base_record_not_found', 'Release was not found');
  const all = [];
  for (const [id, record] of releases) {
    const f = record.fields;
    const account = accountByRecord.get(one(f.账号));
    const drama = dramaByRecord.get(one(f.剧));
    const releaseDay = day(f.日期);
    const result = { release_id: id, account_id: account?.id ?? null, account_name: account?.账号名 || account?.id || null,
      drama_id: drama?.剧ID ?? null, drama_name: plain(drama?.剧名), planned_date: releaseDay,
      release_version: releaseMatchVersion(f), part: part(f.备注, true), notes: f.备注 ?? null, state: 'needs_confirmation', candidates: [] };
    if (f.归档状态 !== 'active') result.state = 'inactive';
    else if (f.采集记录 && (!Array.isArray(f.采集记录) || f.采集记录.length) || f['Post ID'] || f.视频链接) result.state = 'already_claimed';
    else if (!account || !drama || !result.drama_name || !releaseDay) result.state = 'missing_metadata';
    else {
      for (const [postId, capture] of captures) {
        if (owners.get(postId)?.size || one(capture.fields.账号) !== one(f.账号)) continue;
        const post = source.get(postId);
        const url = capture.fields.视频链接;
        const identity = postIdentity(url);
        if (!identity || identity.id !== postId || identity.account !== account.id) continue;
        const publishedDay = day(capture.fields.发布时间);
        if (!publishedDay) continue;
        const delta = (Date.parse(publishedDay) - Date.parse(releaseDay)) / DAY;
        if (Math.abs(delta) > 2) continue;
        if (post && (post.username !== account.id || postIdentity(post.post_url)?.id !== postId ||
            post.published_at && parseQualifiedInstantMs(post.published_at) !== parseQualifiedInstantMs(capture.fields.发布时间))) continue;
        const caption = typeof post?.caption === 'string' ? post.caption : '';
        const exactTitle = titleIn(result.drama_name, caption), postPart = part(caption);
        if (!exactTitle && [...dramas.values()].some(d => titleIn(d.fields.剧名, caption))) continue;
        if (result.part !== null && postPart !== null && result.part !== postPart) continue;
        const evidence = [];
        if (exactTitle) evidence.push('title_exact');
        if (result.part !== null && postPart === result.part) evidence.push('part_exact');
        const warnings = [];
        if (!exactTitle) warnings.push('content_unverified');
        if (!caption) warnings.push('caption_unavailable');
        if (result.part === null || postPart === null) warnings.push('version_unresolved');
        if (delta) warnings.push('date_differs');
        if (String(f.备注 ?? '').includes('未发布')) warnings.push('notes_say_unpublished');
        result.candidates.push({ candidate_id: `${id}:${postId}`, capture_version: captureMatchVersion(capture), post_id: postId, video_url: canonicalCapturePostUrl(url),
          published_at: capture.fields.发布时间, caption: caption.slice(0, 1200), caption_truncated: caption.length > 1200,
          part: postPart, date_delta_days: delta, evidence, warnings, competing_release_ids: [],
          data_as_of: post?.captured_at ?? capture.fields.采集时间 ?? null });
      }
      result.candidates.sort((a, b) => b.evidence.length - a.evidence.length || Math.abs(a.date_delta_days) - Math.abs(b.date_delta_days) || a.post_id.localeCompare(b.post_id));
      if (!result.candidates.length) result.state = 'no_candidate';
    }
    all.push(result);
  }
  const contenders = new Map();
  for (const row of all) for (const c of row.candidates) {
    if (!contenders.has(c.post_id)) contenders.set(c.post_id, []);
    contenders.get(c.post_id).push(row.release_id);
  }
  const rows = all.filter(r => key ? r.release_id === key : date ? r.planned_date === date :
    r.planned_date >= from && r.planned_date <= until && !['already_claimed', 'inactive'].includes(r.state));
  rows.sort((a, b) => (a.planned_date ?? '').localeCompare(b.planned_date ?? '') || a.release_id.localeCompare(b.release_id));
  for (const row of rows) {
    row.candidate_count = row.candidates.length;
    const cap = key ? 50 : 5;
    row.candidates_truncated = row.candidates.length > cap;
    row.candidates = row.candidates.slice(0, cap).map(c => ({ ...c, competing_release_ids: contenders.get(c.post_id).filter(id => id !== row.release_id) }));
  }
  return { status: 'success', mutations: 0, readback: 'complete', source: 'base_complete_index+sqlite',
    scope: { timezone: 'Asia/Shanghai', key: key ?? null, from: date ?? (key ? null : from), through: date ?? (key ? null : until), tolerance_days: 2 },
    counts: { releases: rows.length, needs_confirmation: rows.filter(r => r.state === 'needs_confirmation').length,
      no_candidate: rows.filter(r => r.state === 'no_candidate').length, missing_metadata: rows.filter(r => r.state === 'missing_metadata').length }, rows };
}
