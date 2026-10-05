import assert from 'node:assert/strict';
import test from 'node:test';
import { captureYieldedNothing, classifyListingResult, createDetailGate, isPhotoPost, metricCount, parseProfileListing, planCaptureTargets, rotateByDate, runDetailPasses } from '../src/capture-policy.mjs';

test('the detail breaker opens after the configured run of failures and a success resets it', () => {
  const gate = createDetailGate({ deadlineMs: 1000, maxConsecutiveFailures: 8 });
  for (let i = 0; i < 7; i += 1) gate.record(false);
  assert.equal(gate.check(0), null);
  gate.record(true);
  for (let i = 0; i < 7; i += 1) gate.record(false);
  assert.equal(gate.check(0), null);
  gate.record(false);
  assert.equal(gate.check(0), 'detail_circuit_open');
  // Once an account is stopped it stays stopped for the rest of the run.
  gate.record(true);
  assert.equal(gate.check(0), 'detail_circuit_open');
});

test('the detail budget stops work only after the deadline has passed', () => {
  const gate = createDetailGate({ deadlineMs: 1000, maxConsecutiveFailures: 8 });
  assert.equal(gate.check(1000), null);
  assert.equal(gate.check(1001), 'detail_budget_exhausted');
  assert.throws(() => createDetailGate({ deadlineMs: Number.NaN, maxConsecutiveFailures: 8 }));
  assert.throws(() => createDetailGate({ deadlineMs: 1000, maxConsecutiveFailures: 0 }));
});

const nothingPosted = (name) => `ERROR: [tiktok:user] ${name}: This account does not have any videos posted`;

test('every way a profile listing can fall short is named', () => {
  const cases = [
    [{ errorCode: 'ETIMEDOUT', status: null, rows: 40, truncated: false }, 'listing_timeout'],
    [{ errorCode: 'ENOBUFS', status: null, rows: 40, truncated: false }, 'listing_output_truncated'],
    [{ errorCode: 'ENOENT', status: null, rows: 0, truncated: false }, 'listing_failed'],
    [{ status: 1, rows: 0, truncated: false }, 'listing_failed'],
    [{ status: 1, rows: 30, truncated: false }, 'listing_incomplete'],
    [{ status: 0, rows: 300, truncated: true }, 'listing_limit_reached'],
    [{ status: 0, rows: 0, truncated: false, expectedPosts: 12 }, 'listing_empty'],
    [{ status: 0, rows: 0, truncated: false, expectedPosts: 0 }, null],
    [{ status: 0, rows: 0, truncated: false, expectedPosts: null }, null],
    [{ status: 0, rows: 25, truncated: false, expectedPosts: 25 }, null],
    // yt-dlp exits with an error for an account that has not posted yet. When
    // that is all it says and the profile page agrees, nothing is missing.
    [{ status: 1, rows: 0, truncated: false, expectedPosts: 0, username: 'newbie', stderr: nothingPosted('newbie') }, null],
    [{ status: 1, rows: 0, truncated: false, expectedPosts: 0, username: 'newbie', stderr: `\n${nothingPosted('newbie')}\n` }, null],
    [{ status: 1, rows: 0, truncated: false, expectedPosts: 3, username: 'newbie', stderr: nothingPosted('newbie') }, 'listing_failed'],
    [{ status: 1, rows: 0, truncated: false, expectedPosts: null, username: 'newbie', stderr: nothingPosted('newbie') }, 'listing_failed'],
    // Any other failure of the listing is a failure, also for an account without posts.
    [{ status: 1, rows: 0, truncated: false, expectedPosts: 0, username: 'newbie', stderr: 'ERROR: [tiktok:user] newbie: Unable to download webpage: HTTP Error 403: Forbidden' }, 'listing_failed'],
    [{ status: 1, rows: 0, truncated: false, expectedPosts: 0, username: 'newbie', stderr: `ERROR: unable to reach the network\n${nothingPosted('newbie')}` }, 'listing_failed'],
    [{ status: 1, rows: 0, truncated: false, expectedPosts: 0, username: 'newbie', stderr: nothingPosted('somebody_else') }, 'listing_failed'],
    [{ status: 1, rows: 0, truncated: false, expectedPosts: 0, username: 'newbie', stderr: '' }, 'listing_failed'],
    [{ status: 1, rows: 0, truncated: false, expectedPosts: 0 }, 'listing_failed'],
    [{ status: 2, rows: 0, truncated: false, expectedPosts: 0, username: 'newbie', stderr: nothingPosted('newbie') }, 'listing_failed'],
    [{ status: null, signal: 'SIGKILL', rows: 0, truncated: false, expectedPosts: 0, username: 'newbie', stderr: nothingPosted('newbie') }, 'listing_failed'],
    [{ errorCode: 'ENOENT', status: null, rows: 0, truncated: false, expectedPosts: 0, username: 'newbie', stderr: nothingPosted('newbie') }, 'listing_failed'],
    [{ errorCode: 'ETIMEDOUT', status: null, rows: 0, truncated: false, expectedPosts: 0, username: 'newbie', stderr: nothingPosted('newbie') }, 'listing_timeout'],
  ];
  for (const [input, want] of cases) assert.equal(classifyListingResult(input), want, JSON.stringify(input));
});

test('media type comes from the detail and an untyped fallback payload keeps the known link type', () => {
  const photoUrl = 'https://www.tiktok.com/@a/photo/1', videoUrl = 'https://www.tiktok.com/@a/video/1';
  assert.equal(isPhotoPost({ extractor: 'TikTok' }, photoUrl), false);
  assert.equal(isPhotoPost({ extractor: 'tikwm-photo-fallback', content_type: 'video' }, photoUrl), false);
  assert.equal(isPhotoPost({ extractor: 'tikwm-photo-fallback', content_type: 'photo' }, videoUrl), true);
  // Payloads saved before the type was recorded say nothing about the media.
  assert.equal(isPhotoPost({ extractor: 'tikwm-photo-fallback' }, photoUrl), true);
  assert.equal(isPhotoPost({ extractor: 'tikwm-photo-fallback' }, videoUrl), false);
  assert.equal(isPhotoPost(null, photoUrl), true);
  assert.equal(isPhotoPost(undefined, null), false);
});

test('only a non-negative whole number is a metric; everything else is missing, never zero', () => {
  for (const [value, want] of [[0, 0], ['0', 0], [' 12 ', 12], [9007199254740991, 9007199254740991]]) assert.equal(metricCount(value), want);
  for (const value of [null, undefined, '', ' ', '1.2K', '1,234', '1e3', -1, 1.5, 9007199254740992, false, true, [], {}, Number.NaN]) {
    assert.equal(metricCount(value), null, String(value));
  }
});

test('a post published exactly at the cutoff is inside the window', () => {
  const entry = (id, timestamp) => JSON.stringify({ id, timestamp, view_count: 1 });
  const parsed = parseProfileListing([entry('1', 1000), entry('2', 999)].join('\n'), { limit: 2, cutoffSeconds: 1000 });
  assert.deepEqual(parsed.items.map((item) => item.id), ['1']);
  // The cap was reached and the last listed post is already outside the window.
  assert.equal(parsed.truncated, false);
  assert.equal(parseProfileListing([entry('1', 1001), entry('2', 1000)].join('\n'), { limit: 2, cutoffSeconds: 1000 }).truncated, true);
  // A last row without a date cannot prove the window was covered.
  assert.equal(parseProfileListing([entry('1', 1001), JSON.stringify({ id: '2' })].join('\n'), { limit: 2, cutoffSeconds: 1000 }).truncated, true);
});

const targets = (count) => Array.from({ length: count }, (_, i) => ({ id: String(i + 1) }));

test('posts skipped by a tripped breaker get one more pass, so a short outage costs a delay and not the account', async () => {
  const attempted = [];
  // Three posts succeed, the network is gone for the next eight, then it is back.
  const fetchDetail = async (account, item) => { attempted.push(item.id); return !(attempted.length >= 4 && attempted.length <= 11); };
  const skipped = await runDetailPasses({ accounts: [{ username: 'a', captureTargets: targets(20) }], deadlineMs: 1000, maxConsecutiveFailures: 8, now: () => 0, fetchDetail });
  assert.deepEqual(skipped, []);
  assert.deepEqual(attempted.slice(11), ['12', '13', '14', '15', '16', '17', '18', '19', '20']);
  assert.equal(attempted.length, 20);
});

test('an account that keeps failing is stopped in both passes and the posts left out are reported', async () => {
  let calls = 0;
  const skipped = await runDetailPasses({ accounts: [{ username: 'a', captureTargets: targets(30) }, { username: 'b', captureTargets: targets(2) }],
    deadlineMs: 1000, maxConsecutiveFailures: 8, now: () => 0, fetchDetail: async (account) => { calls += 1; return account.username === 'b'; } });
  assert.deepEqual(skipped, [{ username: 'a', code: 'detail_circuit_open', skipped: 14 }]);
  assert.equal(calls, 8 + 2 + 8);
});

test('nothing is attempted once the run budget is spent', async () => {
  let clock = 0;
  const attempted = [];
  const skipped = await runDetailPasses({ accounts: [{ username: 'a', captureTargets: targets(2) }, { username: 'b', captureTargets: targets(3) }],
    deadlineMs: 1000, maxConsecutiveFailures: 8, now: () => clock, fetchDetail: async (account, item) => { attempted.push(account.username + item.id); clock += 600; return true; } });
  assert.deepEqual(attempted, ['a1', 'a2']);
  assert.deepEqual(skipped, [{ username: 'b', code: 'detail_budget_exhausted', skipped: 3 }]);
});

test('the account that runs last changes from day to day', () => {
  const list = ['a', 'b', 'c'];
  const days = ['2026-09-29', '2026-09-30', '2026-10-01'].map((date) => rotateByDate(list, date));
  assert.equal(new Set(days.map((order) => order.at(-1))).size, 3);
  for (const order of days) assert.deepEqual([...order].sort(), list);
  assert.deepEqual(list, ['a', 'b', 'c']);
  assert.deepEqual(rotateByDate([], '2026-09-29'), []);
  assert.throws(() => rotateByDate(list, 'not-a-date'));
});

test('a capture that reached no account and no post is a failed capture, not a partial one', () => {
  assert.equal(captureYieldedNothing({ accounts_requested: ['a', 'b'], account_count: 0, post_count: 0, errors: [{}] }), true);
  assert.equal(captureYieldedNothing({ accounts_requested: ['a'], account_count: 0, post_count: 3, errors: [{}] }), false);
  assert.equal(captureYieldedNothing({ accounts_requested: ['a'], account_count: 1, post_count: 0, errors: [{}] }), false);
  assert.equal(captureYieldedNothing({ accounts_requested: [], account_count: 0, post_count: 0, errors: [] }), false);
  // A summary written before these counters existed is left as it was.
  assert.equal(captureYieldedNothing({ accounts_requested: ['a'], errors: [{}] }), false);
  // Every account is confirmed gone: trying again today cannot change that.
  const gone = (username) => ({ username, stage: 'account', code: 'account_unavailable', status_code: 10222 });
  assert.equal(captureYieldedNothing({ accounts_requested: ['a', 'b'], account_count: 0, post_count: 0, errors: [gone('a'), gone('b')] }), false);
  assert.equal(captureYieldedNothing({ accounts_requested: ['a', 'b'], account_count: 0, post_count: 0, errors: [gone('a'), { username: 'b', stage: 'account', code: 'account_entry_failed' }] }), true);
});

test('a post found by both the listing and the embed keeps the listing date and the embed details', () => {
  const plan = planCaptureTargets({ now: '2026-09-29T00:00:00Z', maxAgeDays: 30, knownPosts: [], accounts: [{ username: 'alice',
    listing: [{ id: '1', createTime: 1790000000, playCount: 5 }], embed: { videoList: [{ id: '1', playCount: 9, desc: 'from embed' }] } }] });
  assert.equal(plan.targets.length, 1);
  assert.equal(plan.targets[0].playCount, 9);
  assert.equal(plan.targets[0].desc, 'from embed');
  assert.equal(plan.targets[0].published_at, new Date(1790000000 * 1000).toISOString());
});

test('a zero or absent embed count never hides the positive count the listing saw for the same post', () => {
  const plan = (embedItem) => planCaptureTargets({ now: '2026-09-29T00:00:00Z', maxAgeDays: 30, knownPosts: [], accounts: [{ username: 'alice',
    listing: [{ id: '1', createTime: 1790000000, playCount: 1000 }], embed: { videoList: [embedItem] } }] }).targets[0];
  assert.equal(plan({ id: '1', playCount: 0 }).playCount, 1000);
  assert.equal(plan({ id: '1' }).playCount, 1000);
  assert.equal(plan({ id: '1', playCount: '1.2K' }).playCount, 1000);
  assert.equal(plan({ id: '1', playCount: 1500 }).playCount, 1500);
});
