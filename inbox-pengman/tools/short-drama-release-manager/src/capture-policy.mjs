import { parseQualifiedInstantMs } from './qualified-iso.mjs';
export const DEFAULT_MAX_POST_AGE_DAYS = 30;
export function validateExcludedPostIds(value = []) {
  if (!Array.isArray(value) || value.length > 200 ||
      value.some(id => typeof id !== 'string' || !/^\d{1,32}$/.test(id)) ||
      new Set(value).size !== value.length) {
    throw new Error('excluded_post_ids must be a unique list of exact numeric Post IDs');
  }
  return Object.freeze([...value]);
}
export function validateMaxPostAgeDays(value = DEFAULT_MAX_POST_AGE_DAYS) {
  if (!Number.isSafeInteger(value) || value < 1 || value > 365) throw new Error('max_age_days must be an integer between 1 and 365');
  return value;
}
export function isExpiredPost(publishedAt, now, maxAgeDays = DEFAULT_MAX_POST_AGE_DAYS) {
  const days = validateMaxPostAgeDays(maxAgeDays);
  const end = parseQualifiedInstantMs(now instanceof Date ? now.toISOString() : now);
  if (end === null) throw new Error('Capture policy requires a qualified current timestamp');
  const published = parseQualifiedInstantMs(publishedAt);
  // Unknown dates remain eligible for discovery; never infer age from the drama's launch date.
  return published !== null && end - published > days * 86400000;
}
export function planCaptureTargets({ accounts, knownPosts, now, maxAgeDays = DEFAULT_MAX_POST_AGE_DAYS, excludedPostIds = [] }) {
  validateMaxPostAgeDays(maxAgeDays);
  const excluded = new Set(validateExcludedPostIds(excludedPostIds));
  const targets = [], skipped = [];
  for (const account of accounts) {
    const known = new Map(knownPosts.filter(post => post.username === account.username).map(post => [String(post.post_id), post]));
    // Paged profile listing extends the embed's ~10 newest posts. On overlap the
    // embed fields win, but the listing still supplies what the embed lacks (the date).
    // View counts only grow, so of two counts seen in this run the larger one
    // stands: a zero or unreadable embed count must not hide the listing's.
    const discovered = new Map();
    for (const item of [...(account.listing ?? []), ...(account.embed?.videoList ?? [])]) {
      const seen = discovered.get(String(item.id));
      const counts = [metricCount(seen?.playCount), metricCount(item.playCount)].filter(value => value !== null);
      discovered.set(String(item.id), { ...seen, ...item, ...(counts.length ? { playCount: Math.max(...counts) } : {}) });
    }
    for (const id of new Set([...discovered.keys(), ...known.keys()])) {
      if (!/^\d+$/.test(id) || !/^[a-z0-9._]+$/.test(account.username)) throw new Error('Invalid capture target identity');
      const old = known.get(id), item = discovered.get(id);
      if (excluded.has(id)) {
        skipped.push({ username: account.username, post_id: id, published_at: old?.published_at ?? null, reason: 'excluded_post_id' });
        continue;
      }
      const createTime = Number(item?.createTime);
      const publishedAt = old?.published_at ?? (Number.isFinite(createTime) && createTime > 0 ? new Date(createTime * 1000).toISOString() : null);
      if (isExpiredPost(publishedAt, now, maxAgeDays)) {
        skipped.push({ username: account.username, post_id: id, published_at: publishedAt, reason: 'older_than_capture_window' });
        continue;
      }
      // Only this run's embed or listing response can supply playCount. Never promote stored metrics.
      targets.push({ ...item, id, username: account.username, published_at: publishedAt, desc: item?.desc ?? old?.caption ?? '', known_url: old?.post_url ?? null });
    }
  }
  return { targets, skipped };
}
export function selectFreshPosts(posts, { capturedAt, now = capturedAt, maxAgeDays = DEFAULT_MAX_POST_AGE_DAYS, excludedPostIds = [] }) {
  const instant = parseQualifiedInstantMs(capturedAt);
  if (instant === null) throw new Error('Same-run capture timestamp is required');
  const excluded = new Set(validateExcludedPostIds(excludedPostIds));
  return posts.filter(post => !excluded.has(String(post.post_id)) && parseQualifiedInstantMs(post.captured_at) === instant && !isExpiredPost(post.published_at, now, maxAgeDays));
}

const CAPTURE_USERNAME = /^[a-z0-9._]+$/;

export function captureAccountUsernames(accounts) {
  if (!Array.isArray(accounts) || accounts.length === 0 ||
      accounts.some(name => typeof name !== 'string' || !CAPTURE_USERNAME.test(name)) ||
      new Set(accounts).size !== accounts.length) {
    throw new Error('Capture requires a nonempty unique list of validated account IDs');
  }
  return [...accounts];
}

export function registeredCaptureAccounts(accounts) {
  const usernames = [], issues = [];
  for (const [name, row] of accounts) {
    let code = null;
    if (typeof name !== 'string' || !CAPTURE_USERNAME.test(name) || row.fields.账号ID !== name) {
      code = 'account_capture_identity_invalid';
    } else {
      try {
        const url = new URL(row.fields.主页链接);
        const match = url.pathname.match(/^\/@([a-z0-9._]+)\/?$/);
        if (url.protocol !== 'https:' || !['www.tiktok.com','tiktok.com'].includes(url.hostname) ||
            url.port || url.username || url.password || !match) {
          code = 'account_capture_homepage_invalid';
        } else if (match[1] !== name) code = 'account_capture_homepage_mismatch';
      } catch { code = 'account_capture_homepage_invalid'; }
    }
    if (code) issues.push({ account_id: name, code });
    else usernames.push(name);
  }
  return { accounts: usernames, issues };
}

export function registeredCaptureTargets({ accounts, captures, releases }) {
  const membership = registeredCaptureAccounts(accounts);
  const allowedAccounts = new Set(membership.accounts);
  const accountIds = new Map([...accounts].filter(([name]) => allowedAccounts.has(name)).map(([name, row]) => [row.record_id, name]));
  const captureByRecord = new Map([...captures].map(([id, row]) => [row.record_id, { id, fields: row.fields }]));
  const posts = new Map(), issues = [...membership.issues];
  const oneId = value => Array.isArray(value) && value.length === 1 ? value[0]?.id : null;
  for (const [releaseId, row] of releases) {
    const fields = row.fields;
    if (fields.归档状态 !== 'active') continue;
    const username = accountIds.get(oneId(fields.账号));
    if (!username || !/^[a-z0-9._]+$/.test(username)) { issues.push({release_id:releaseId,code:'release_account_invalid'}); continue; }
    let explicit = fields['Post ID'] || null, urlPost = null;
    if (fields.视频链接) {
      try {
        const url = new URL(fields.视频链接);
        const match = url.pathname.match(/^\/@([a-z0-9._]+)\/(video|photo)\/(\d+)\/?$/);
        if (url.protocol !== 'https:' || !['www.tiktok.com','tiktok.com'].includes(url.hostname) || !match || match[1] !== username) throw Error('identity');
        urlPost = match[3];
      } catch { issues.push({release_id:releaseId,code:'manual_url_invalid'}); continue; }
    }
    if (explicit && (!/^\d+$/.test(explicit) || urlPost && explicit !== urlPost)) { issues.push({release_id:releaseId,code:'manual_post_conflict'}); continue; }
    explicit ??= urlPost;
    const ids = new Set(explicit ? [explicit] : []);
    for (const ref of Array.isArray(fields.采集记录) ? fields.采集记录 : []) {
      const capture = captureByRecord.get(ref?.id);
      if (capture && accountIds.get(oneId(capture.fields.账号)) === username) ids.add(capture.id);
    }
    for (const id of ids) {
      const historical = captures.get(id)?.fields;
      if (historical && accountIds.get(oneId(historical.账号)) !== username) { issues.push({release_id:releaseId,code:'manual_post_account_mismatch'}); continue; }
      posts.set(`${username}:${id}`, {post_id:id,username,post_url:`https://www.tiktok.com/@${username}/video/${id}`,published_at:historical?.发布时间 ?? null});
    }
  }
  return {accounts: membership.accounts, posts:[...posts.values()],issues};
}

// A metric is a non-negative whole number, given as a number or as plain
// digits. Anything else ("1.2K", blank, booleans, lists) is missing (null),
// never zero: a missing metric keeps the last good Base value, a fake 0 overwrites it.
export function metricCount(value) {
  if (typeof value === 'string' && /^\s*\d+\s*$/.test(value)) value = Number(value);
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : null;
}
const listingCount = metricCount;
// Parses `yt-dlp --flat-playlist -O '%(.{id,timestamp,view_count})j'` output.
// Posts older than the cutoff are dropped here so they never bloat the plan.
// `truncated` means the page cap was hit while the last (oldest non-pinned)
// listed post is still inside the window. Pinned old posts sit at the top, so
// the minimum over all rows would hide a truncation. The cap applies to the
// entries yt-dlp printed, so a repeated id still counts towards it.
export function parseProfileListing(stdout, { limit, cutoffSeconds }) {
  if (!Number.isSafeInteger(limit) || limit < 1 || !Number.isFinite(cutoffSeconds)) throw new Error('Profile listing bounds are invalid');
  const items = [], seen = new Set();
  let rows = 0, entries = 0, last = null;
  for (const line of String(stdout ?? '').split('\n')) {
    if (!line.trim()) continue;
    let entry;
    // A timeout can cut the final line; drop it instead of failing the account.
    try { entry = JSON.parse(line); } catch { continue; }
    const id = String(entry?.id ?? '');
    if (!/^\d{1,32}$/.test(id)) continue;
    entries += 1;
    const timestamp = listingCount(entry.timestamp);
    last = timestamp;
    if (seen.has(id)) continue;
    seen.add(id); rows += 1;
    if (timestamp !== null && timestamp < cutoffSeconds) continue;
    const views = listingCount(entry.view_count);
    items.push({ id, ...(timestamp === null ? {} : { createTime: timestamp }), ...(views === null ? {} : { playCount: views }) });
  }
  return { items, rows, truncated: entries >= limit && (last === null || last >= cutoffSeconds) };
}
// The listing tool reports an account without posts as an error. It is not
// one when that is the only thing the tool says, about this account.
function saysNothingPosted(stderr, username) {
  const lines = String(stderr ?? '').split('\n').map((line) => line.trim()).filter(Boolean);
  const expected = `ERROR: [tiktok:user] ${username}: This account does not have any videos posted`;
  return typeof username === 'string' && username.length > 0 && lines.length > 0 && lines.every((line) => line === expected);
}
// Names the way a profile listing fell short, or null when it is complete.
// `expectedPosts` is the post count the profile page reported for the account.
export function classifyListingResult({ errorCode = null, status = 0, signal = null, stderr = '', username = null, rows, truncated, expectedPosts = null }) {
  if (errorCode === 'ETIMEDOUT') return 'listing_timeout';
  if (errorCode === 'ENOBUFS') return 'listing_output_truncated';
  if (errorCode) return 'listing_failed';
  if (status !== 0 && rows === 0) {
    // Nothing is missing when the profile page reports no posts either.
    const nothingPosted = status === 1 && !signal && expectedPosts === 0 && saysNothingPosted(stderr, username);
    return nothingPosted ? null : 'listing_failed';
  }
  // Some pages arrived, then a later page failed: discovery is incomplete.
  if (status !== 0) return 'listing_incomplete';
  if (truncated) return 'listing_limit_reached';
  // A clean exit without a single post, for an account that has posts.
  if (rows === 0 && Number.isSafeInteger(expectedPosts) && expectedPosts > 0) return 'listing_empty';
  return null;
}
// Each detail can cost about two minutes when every fallback times out. The
// run-wide deadline and the per-account breaker keep a broken account or a
// blocked network from pushing a run past the day. check() returns null to go
// on, or the reason this account's remaining posts are skipped.
export function createDetailGate({ deadlineMs, maxConsecutiveFailures }) {
  if (!Number.isFinite(deadlineMs) || !Number.isSafeInteger(maxConsecutiveFailures) || maxConsecutiveFailures < 1) throw new Error('Detail gate bounds are invalid');
  let failures = 0, stopped = null;
  return {
    check(nowMs) {
      if (!stopped && nowMs > deadlineMs) stopped = 'detail_budget_exhausted';
      if (!stopped && failures >= maxConsecutiveFailures) stopped = 'detail_circuit_open';
      return stopped;
    },
    record(ok) { failures = ok ? 0 : failures + 1; },
  };
}
// A tripped breaker is often a short network blip, so the posts it skipped get
// one more pass after every account had its turn. What is still skipped then is
// returned per account. `fetchDetail(account, item)` resolves to whether a detail
// was obtained.
export async function runDetailPasses({ accounts, deadlineMs, maxConsecutiveFailures, now = Date.now, fetchDetail }) {
  const pass = async (work) => {
    const left = [];
    for (const { account, items } of work) {
      const gate = createDetailGate({ deadlineMs, maxConsecutiveFailures });
      const skipped = [];
      let code = null;
      for (const item of items) {
        code = gate.check(now());
        if (code) { skipped.push(item); continue; }
        gate.record(await fetchDetail(account, item));
      }
      if (skipped.length) left.push({ account, items: skipped, code });
    }
    return left;
  };
  const afterFirst = await pass(accounts.map(account => ({ account, items: account.captureTargets ?? [] })));
  return (await pass(afterFirst)).map(({ account, items, code }) => ({ username: account.username, code, skipped: items.length }));
}
// When the budget runs out the accounts at the end go without details. Starting
// at a different account each day keeps that from always hitting the same ones.
export function rotateByDate(list, date) {
  const day = Date.parse(`${date}T00:00:00Z`) / 86400000;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date)) || !Number.isSafeInteger(day)) throw new Error('Rotation date is invalid');
  if (list.length === 0) return [];
  const start = day % list.length;
  return [...list.slice(start), ...list.slice(0, start)];
}
// TikTok unreachable: the collector still exits cleanly, but with no account
// snapshot and no post there is nothing to write. That is a failed capture.
export function captureYieldedNothing(summary) {
  if (!Array.isArray(summary?.accounts_requested) || summary.accounts_requested.length === 0 ||
      summary.account_count !== 0 || summary.post_count !== 0) return false;
  // Accounts TikTok reports as gone stay gone: that is not an outage to retry.
  const gone = new Set((Array.isArray(summary.errors) ? summary.errors : []).filter(error => error?.code === 'account_unavailable').map(error => error.username));
  return !summary.accounts_requested.every(name => gone.has(name));
}
// Media type comes from the detail payload. yt-dlp details are videos; the
// fallback reports its own type. A fallback payload saved before the type was
// recorded, or no detail at all, keeps the type of the already known link.
export function isPhotoPost(detail, knownUrl) {
  const known = String(knownUrl ?? '').includes('/photo/');
  if (!detail) return known;
  if (detail.content_type === 'photo' || detail.content_type === 'video') return detail.content_type === 'photo';
  return detail.extractor === 'tikwm-photo-fallback' ? known : false;
}
// TikTok reports these on the profile page when the account itself is gone:
// 10202 does not exist, 10221 banned, 10222 private. Any other non-zero code
// (verification wall, server error) is not a verdict on the account, so
// discovery through the embed page and the listing is still attempted.
const ACCOUNT_UNAVAILABLE_STATUS = new Set([10202, 10221, 10222]);
export function classifyProfileStatus(statusCode) {
  if (statusCode === null || statusCode === undefined || statusCode === '') return 'ok';
  const code = Number(statusCode);
  if (code === 0) return 'ok';
  return ACCOUNT_UNAVAILABLE_STATUS.has(code) ? 'unavailable' : 'unknown';
}
const METRIC_KEYS = ['views', 'likes', 'comments', 'favorites', 'shares'];
// Public view counts never fall back to zero. A zero detail for a post that
// has shown views before (any earlier snapshot, or this run's own listing) is
// an upstream placeholder: its zeros are stored as missing so Base keeps the
// last good value. A count listed in this same run is a real observation and
// is kept. Without positive evidence a zero is a genuine new post.
export function guardZeroMetrics(metrics, { previousMaxViews = null, listedViews = null } = {}) {
  const positive = value => Number.isSafeInteger(value) && value > 0;
  if (metrics.views !== 0 || !(positive(previousMaxViews) || positive(listedViews))) return { metrics, suspect: false };
  const allZero = METRIC_KEYS.every(key => metrics[key] === 0);
  const guarded = allZero ? Object.fromEntries(METRIC_KEYS.map(key => [key, null])) : { ...metrics };
  guarded.views = positive(listedViews) ? listedViews : null;
  return { metrics: guarded, suspect: true };
}
export function detailMatchesTarget(detail, target) {
  const author = detail?.author_username ?? detail?.uploader;
  return String(detail?.id) === target.id && typeof author === 'string' && author.replace(/^@/, '').toLowerCase() === target.username;
}
