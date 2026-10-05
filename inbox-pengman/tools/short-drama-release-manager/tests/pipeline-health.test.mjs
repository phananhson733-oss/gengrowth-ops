import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { JobStore } from '../src/job-store.mjs';
import { parseProfileListing, planCaptureTargets } from '../src/capture-policy.mjs';
import {
  ALERT_TEXT_LIMIT, boundedAlertText, captureIncompleteLines, describeIntegrityIssue, DRAIN_FAILURE_ALERT_THRESHOLD, ledgerIntegrityIssues,
  markIntegrityReported, pendingIntegrityIssues, readDrainHealth, recordDrainOutcome, recordIntegrityIssues,
} from '../src/pipeline-health.mjs';
import { createDispatcher, createFeishuMessageSender, parseCommand, pipelineHealthAlerts, shouldEnqueueSchedule, SCHEDULE_MAX_ATTEMPTS_PER_DAY } from '../shortdrama_ctl.mjs';

const cutoff = Date.parse('2026-08-30T00:00:00Z') / 1000;
const line = (id, ts, views = 1) => JSON.stringify({ id, timestamp: ts, view_count: views });

test('profile listing drops out-of-window posts and a timeout-truncated last line', () => {
  const stdout = [line('1', cutoff + 10, 5), line('2', cutoff - 10), line('1', cutoff + 10), '{"id": "3", "timest'].join('\n');
  const parsed = parseProfileListing(stdout, { limit: 300, cutoffSeconds: cutoff });
  assert.deepEqual(parsed.items, [{ id: '1', createTime: cutoff + 10, playCount: 5 }]);
  assert.equal(parsed.rows, 2);
  assert.equal(parsed.truncated, false);
});

test('profile listing flags a page cap that is still inside the window', () => {
  const full = Array.from({ length: 3 }, (_, i) => line(String(i + 1), cutoff + 100 - i)).join('\n');
  assert.equal(parseProfileListing(full, { limit: 3, cutoffSeconds: cutoff }).truncated, true);
  const reachedOld = [line('1', cutoff + 100), line('2', cutoff + 50), line('3', cutoff - 1)].join('\n');
  assert.equal(parseProfileListing(reachedOld, { limit: 3, cutoffSeconds: cutoff }).truncated, false);
  // A pinned old post first does not stop the listing: newer posts after it still count.
  const pinned = [line('9', cutoff - 999), line('1', cutoff + 100)].join('\n');
  assert.deepEqual(parseProfileListing(pinned, { limit: 300, cutoffSeconds: cutoff }).items.map((item) => item.id), ['1']);
});

test('profile listing never turns an unparseable count into zero', () => {
  const stdout = [JSON.stringify({ id: '1', timestamp: String(cutoff + 5), view_count: '1.2K' }), JSON.stringify({ id: '2', timestamp: null, view_count: -3 })].join('\n');
  assert.deepEqual(parseProfileListing(stdout, { limit: 300, cutoffSeconds: cutoff }).items, [{ id: '1', createTime: cutoff + 5 }, { id: '2' }]);
  assert.throws(() => parseProfileListing('', { limit: 0, cutoffSeconds: cutoff }), /bounds/);
});

test('listing extends embed discovery and an account without entry pages still targets known posts', () => {
  const now = '2026-09-20T00:00:00Z';
  const plan = planCaptureTargets({
    accounts: [
      { username: 'alice', embed: { videoList: [{ id: '10', createTime: Date.parse('2026-09-19T00:00:00Z') / 1000, playCount: 7 }] }, listing: [{ id: '10', playCount: 1 }, { id: '11', createTime: Date.parse('2026-09-18T00:00:00Z') / 1000 }] },
      { username: 'bob', profile: null, embed: null, listing: [] },
    ],
    knownPosts: [{ post_id: '20', username: 'bob', published_at: '2026-09-15T00:00:00Z', post_url: 'https://www.tiktok.com/@bob/video/20' }],
    now,
  });
  assert.deepEqual(plan.targets.map((t) => [t.username, t.id]).sort(), [['alice', '10'], ['alice', '11'], ['bob', '20']]);
  assert.equal(plan.targets.find((t) => t.id === '10').playCount, 7);
});

test('drain outcomes count consecutive failures and reset on success', () => {
  const store = new JobStore(':memory:');
  for (let i = 0; i < DRAIN_FAILURE_ALERT_THRESHOLD; i += 1) recordDrainOutcome(store.db, { ok: false, error: { code: 'analytics_invalid', message: 'x'.repeat(5000) }, now: new Date(Date.UTC(2026, 8, 20, 0, i * 5)) });
  let health = readDrainHealth(store.db);
  assert.equal(health.consecutive_failures, DRAIN_FAILURE_ALERT_THRESHOLD);
  assert.equal(health.first_failed_at, '2026-09-20T00:00:00.000Z');
  assert.ok(health.last_error_message.length <= 300);
  recordDrainOutcome(store.db, { ok: true, now: '2026-09-20T01:00:00Z' });
  health = readDrainHealth(store.db);
  assert.equal(health.consecutive_failures, 0);
  assert.equal(health.first_failed_at, null);
});

const ledger = {
  accounts: [{ record_id: 'a1', fields: { 账号ID: 'plottwistclips11' } }],
  captures: [
    { record_id: 'c1', fields: { 账号: [{ id: 'a1' }], 视频链接: '[https://www.tiktok.com/@shirley5276973/video/1](https://www.tiktok.com/@shirley5276973/video/1)' } },
    { record_id: 'c2', fields: { 账号: [{ id: 'a1' }], 视频链接: 'https://www.tiktok.com/@plottwistclips11/video/2' } },
    { record_id: 'c3', fields: { 账号: [{ id: 'gone' }], 视频链接: 'https://www.tiktok.com/@dramapenelope/video/3' } },
  ],
  releases: [{ record_id: 'r1', fields: { 账号: [{ id: 'gone' }] } }],
};

test('ledger integrity finds deleted account rows and reused account IDs', () => {
  const issues = ledgerIntegrityIssues(ledger, [{ release_id: 'SR-1', reason: 'release_account_missing' }, { release_id: 'SR-2', reason: 'missing_drama' }]);
  assert.deepEqual(issues.map((issue) => issue.key).sort(), ['account_deleted:gone', 'account_id_mismatch:a1:shirley5276973', 'release:release_account_missing:SR-1']);
  assert.deepEqual(issues.find((issue) => issue.kind === 'account_deleted').detail, { account_record_id: 'gone', captures: 1, releases: 1 });
});

test('existing integrity issues become a silent baseline; only new ones alert, and a recurrence alerts again', () => {
  const store = new JobStore(':memory:');
  const first = ledgerIntegrityIssues(ledger);
  assert.equal(recordIntegrityIssues(store.db, first, { now: '2026-09-29T00:00:00Z' }).baseline, true);
  assert.deepEqual(pendingIntegrityIssues(store.db), []);
  const fresh = { key: 'account_deleted:new', kind: 'account_deleted', detail: { account_record_id: 'new', captures: 2, releases: 0 } };
  assert.equal(recordIntegrityIssues(store.db, [...first, fresh]).pending, 1);
  markIntegrityReported(store.db, ['account_deleted:new']);
  assert.equal(recordIntegrityIssues(store.db, [...first, fresh]).pending, 0);
  recordIntegrityIssues(store.db, first); // resolved: forgotten
  assert.equal(recordIntegrityIssues(store.db, [...first, fresh]).pending, 1);
});

test('alert text always fits the Feishu sender limit and reports what was cut', () => {
  const lines = Array.from({ length: 500 }, (_, i) => `发布记录 SR-${String(i).padStart(6, '0')} 未进入统计：release_account_missing`);
  const text = boundedAlertText('header', lines);
  assert.ok(text.length <= ALERT_TEXT_LIMIT && ALERT_TEXT_LIMIT < 2000);
  const kept = text.split('\n').filter((l) => l.startsWith('发布记录')).length;
  assert.match(text, new RegExp(`另有 ${500 - kept} 项$`));
  assert.equal(boundedAlertText('h', ['a', 'b']), 'h\na\nb');
  assert.ok(boundedAlertText('h', ['x'.repeat(5000)]).length <= ALERT_TEXT_LIMIT);
});

test('capture summaries name unavailable accounts and post failure counts', () => {
  assert.equal(captureIncompleteLines({ errors: [] }), null);
  const lines = captureIncompleteLines({
    accounts_requested: ['a', 'b'], accounts_successful: ['a'],
    errors: [{ username: 'b', stage: 'account', code: 'account_unavailable' }, { username: 'a', post_id: '1', stage: 'detail', code: 'detail_unavailable' }, { username: 'a', post_id: '2', stage: 'photo_detail' }],
  });
  assert.deepEqual(lines, ['账号入口失败 1/2', '@b: account_unavailable', '帖子采集失败 2 条（detail_unavailable 1，photo_detail 1）']);
});

test('failed scheduled days retry a bounded number of times after a delay', () => {
  const at = new Date('2026-09-01T04:30:00Z'); // 12:30 Beijing
  const failed = (finished) => ({ trigger: 'schedule', state: 'failed', beijing_date: '2026-09-01', finished_at: finished });
  assert.equal(shouldEnqueueSchedule(at, [failed('2026-09-01T04:01:00Z')]), false);
  assert.equal(shouldEnqueueSchedule(at, [failed('2026-09-01T04:00:00Z')]), true);
  assert.equal(shouldEnqueueSchedule(at, [failed(null)]), false);
  assert.equal(shouldEnqueueSchedule(at, [failed('2026-09-01T01:00:00Z'), { ...failed('2026-09-01T02:00:00Z'), state: 'partial' }]), false);
  assert.equal(shouldEnqueueSchedule(at, Array.from({ length: SCHEDULE_MAX_ATTEMPTS_PER_DAY }, () => failed('2026-09-01T01:00:00Z'))), false);
});

test('health alerts a partial capture, a failing drain and new ledger issues once each', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'sd-health-'));
  try {
    const store = new JobStore(':memory:');
    await writeFile(path.join(dir, 'capture_summary_2026-09-29.json'), JSON.stringify({ accounts_requested: ['a', 'b'], accounts_successful: ['a'], errors: [{ username: 'b', stage: 'account', code: 'account_unavailable' }] }));
    for (let i = 0; i < DRAIN_FAILURE_ALERT_THRESHOLD; i += 1) recordDrainOutcome(store.db, { ok: false, error: { code: 'analytics_invalid', message: '发布账号缺失或不存在' } });
    recordIntegrityIssues(store.db, []);
    recordIntegrityIssues(store.db, [{ key: 'account_deleted:x', kind: 'account_deleted', detail: { account_record_id: 'x', captures: 1, releases: 0 } }]);
    const sent = [];
    const runtime = { jobs: store, opsChatId: 'oc_test', config: { paths: { collectorSummaryDir: dir } }, sendOpsHealth: async (message) => { sent.push(message.text); } };
    const jobs = [{ trigger: 'schedule', state: 'partial', run_id: 'SDRUN-20260929-001013' }];
    const now = new Date('2026-09-29T03:00:00Z');
    const first = await pipelineHealthAlerts(runtime, { now, date: '2026-09-29', jobs });
    assert.deepEqual(first.map((r) => [r.kind, r.status]), [['capture-incomplete', 'sent'], ['drain-failing', 'sent'], ['ledger-integrity', 'sent']]);
    assert.ok(sent.every((text) => text.length <= ALERT_TEXT_LIMIT));
    assert.match(sent[0], /@b: account_unavailable/);
    const second = await pipelineHealthAlerts(runtime, { now, date: '2026-09-29', jobs });
    assert.deepEqual(second.map((r) => r.status), ['already_claimed', 'already_claimed']);
    assert.equal(sent.length, 3);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('one failed alert delivery does not suppress the others and is retried later', async () => {
  const store = new JobStore(':memory:');
  for (let i = 0; i < DRAIN_FAILURE_ALERT_THRESHOLD; i += 1) recordDrainOutcome(store.db, { ok: false, error: { code: 'x' } });
  recordIntegrityIssues(store.db, []);
  recordIntegrityIssues(store.db, [{ key: 'account_deleted:y', kind: 'account_deleted', detail: {} }]);
  let calls = 0;
  const runtime = { jobs: store, opsChatId: 'oc', config: {}, sendOpsHealth: async () => { calls += 1; if (calls === 1) throw Object.assign(new Error('down'), { code: 'notification_delivery_failed' }); } };
  const now = new Date('2026-09-29T03:00:00Z');
  const first = await pipelineHealthAlerts(runtime, { now, date: '2026-09-29', jobs: [] });
  assert.deepEqual(first.map((r) => r.status), ['failed', 'sent']);
  const retry = await pipelineHealthAlerts(runtime, { now, date: '2026-09-29', jobs: [] });
  assert.deepEqual(retry.map((r) => [r.kind, r.status]), [['drain-failing', 'sent']]);
});

test('a failed scheduled day can be re-enqueued up to the attempt cap', () => {
  const store = new JobStore(':memory:');
  const enqueue = (runId) => store.enqueueIfIdle({ runId, trigger: 'schedule', now: '2026-09-01T06:00:00Z' });
  const fail = (runId) => store.db.prepare("UPDATE jobs SET state='failed', step='failed', finished_at='2026-09-01T00:05:00Z' WHERE run_id=?").run(runId);
  assert.equal(enqueue('SDRUN-20260901-081000').created, true);
  assert.equal(enqueue('SDRUN-20260901-081500').created, false); // still active
  fail('SDRUN-20260901-081000');
  assert.equal(enqueue('SDRUN-20260901-090000').created, true);
  fail('SDRUN-20260901-090000');
  assert.equal(enqueue('SDRUN-20260901-100000').created, true);
  fail('SDRUN-20260901-100000');
  const capped = enqueue('SDRUN-20260901-110000');
  assert.equal(capped.created, false);
  assert.equal(capped.job.run_id, 'SDRUN-20260901-100000');
  store.db.prepare("UPDATE jobs SET state='partial' WHERE run_id='SDRUN-20260901-090000'").run();
  assert.equal(enqueue('SDRUN-20260901-120000').job.run_id, 'SDRUN-20260901-090000');
});

test('a pinned old post at the top cannot hide a truncated listing', () => {
  const rows = [line('999999', cutoff - 999), ...Array.from({ length: 299 }, (_, i) => line(String(i + 1), cutoff + 1000 - i))].join('\n');
  assert.equal(parseProfileListing(rows, { limit: 300, cutoffSeconds: cutoff }).truncated, true);
});

test('partial metrics without error entries and table-level key problems still alert', () => {
  assert.deepEqual(captureIncompleteLines({ errors: [], local_history: { partial_count: 3 } }), ['指标不完整的帖子: 3']);
  const issues = ledgerIntegrityIssues({}, [{ table: '发布记录', record_id: 'rec1', reason: 'key_missing', field: '发布ID' }]);
  assert.deepEqual(issues.map((issue) => issue.key), ['row:key_missing:发布记录:rec1']);
});

test('drain and integrity alerts are still sent on a day whose scheduled runs failed', async () => {
  const store = new JobStore(':memory:');
  for (let i = 0; i < DRAIN_FAILURE_ALERT_THRESHOLD; i += 1) recordDrainOutcome(store.db, { ok: false, error: { code: 'x' } });
  const sent = [];
  const runtime = { jobs: store, opsChatId: 'oc', config: {}, sendOpsHealth: async (m) => { sent.push(m.text); } };
  const result = await pipelineHealthAlerts(runtime, { now: new Date('2026-09-29T03:00:00Z'), date: '2026-09-29', jobs: [{ trigger: 'schedule', state: 'failed' }] });
  assert.deepEqual(result.map((r) => [r.kind, r.status]), [['drain-failing', 'sent']]);
});

test('the retry cooldown is enforced inside the enqueue itself, not only by the caller', () => {
  const store = new JobStore(':memory:');
  const enqueue = (runId, now) => store.enqueueIfIdle({ runId, trigger: 'schedule', now });
  const fail = (runId, finishedAt) => store.db.prepare("UPDATE jobs SET state='failed', step='failed', finished_at=? WHERE run_id=?").run(finishedAt, runId);
  assert.equal(enqueue('SDRUN-20260901-081000', '2026-09-01T00:10:00Z').created, true);
  fail('SDRUN-20260901-081000', '2026-09-01T01:00:00Z');
  // A caller that decided from a stale job list must not start the retry early.
  const early = enqueue('SDRUN-20260901-092959', '2026-09-01T01:29:59Z');
  assert.equal(early.created, false);
  assert.equal(early.job.run_id, 'SDRUN-20260901-081000');
  assert.equal(enqueue('SDRUN-20260901-093000', '2026-09-01T01:30:00Z').created, true);
  // A failed run without a finish time gives no cooldown reference: no retry.
  store.db.prepare("UPDATE jobs SET state='failed', step='failed', finished_at=NULL WHERE run_id='SDRUN-20260901-093000'").run();
  assert.equal(enqueue('SDRUN-20260901-120000', '2026-09-01T04:00:00Z').created, false);
});

test('Feishu notification requests carry a deadline so a stalled response cannot hang the scheduler', async () => {
  const original = globalThis.fetch;
  let signal = null;
  globalThis.fetch = async (url, options) => { signal = options?.signal ?? null; return { ok: true, status: 200, json: async () => ({ code: 0 }) }; };
  try {
    const send = createFeishuMessageSender({ tokenProvider: async () => 'token', isChatAllowed: () => true });
    await send({ chatId: 'oc', text: 'x' });
  } finally { globalThis.fetch = original; }
  assert.ok(signal instanceof AbortSignal);
  assert.equal(signal.aborted, false);
});

test('an integrity alert that could not be delivered stays pending and is sent on a later check', async () => {
  const store = new JobStore(':memory:');
  recordIntegrityIssues(store.db, []);
  recordIntegrityIssues(store.db, [{ key: 'account_deleted:rec1', kind: 'account_deleted', detail: { account_record_id: 'rec1', captures: 1, releases: 0 } }]);
  const sent = [];
  let healthy = false;
  const runtime = { jobs: store, opsChatId: 'oc', config: {}, sendOpsHealth: async (m) => { if (!healthy) throw new Error('down'); sent.push(m.text); } };
  const now = new Date('2026-09-29T03:00:00Z');
  assert.deepEqual((await pipelineHealthAlerts(runtime, { now, date: '2026-09-29', jobs: [] })).map((r) => [r.kind, r.status]), [['ledger-integrity', 'failed']]);
  assert.equal(pendingIntegrityIssues(store.db).length, 1);
  healthy = true;
  assert.deepEqual((await pipelineHealthAlerts(runtime, { now, date: '2026-09-29', jobs: [] })).map((r) => [r.kind, r.status]), [['ledger-integrity', 'sent']]);
  assert.equal(pendingIntegrityIssues(store.db).length, 0);
  assert.equal(sent.length, 1);
});

test('a drain that failed fewer times than the threshold does not alert', async () => {
  const store = new JobStore(':memory:');
  for (let i = 0; i < DRAIN_FAILURE_ALERT_THRESHOLD - 1; i += 1) recordDrainOutcome(store.db, { ok: false, error: { code: 'x' } });
  const runtime = { jobs: store, opsChatId: 'oc', config: {}, sendOpsHealth: async () => {} };
  assert.deepEqual(await pipelineHealthAlerts(runtime, { now: new Date('2026-09-29T03:00:00Z'), date: '2026-09-29', jobs: [] }), []);
});

test('on a day with several scheduled runs the newest one decides the cooldown and the capture alert', async () => {
  const failed = (finished_at) => ({ trigger: 'schedule', state: 'failed', beijing_date: '2026-09-01', finished_at });
  const jobs = [failed('2026-09-01T01:00:00Z'), failed('2026-09-01T03:00:00Z')];
  assert.equal(shouldEnqueueSchedule(new Date('2026-09-01T03:29:59Z'), jobs, { captureHour: 0, captureMinute: 10 }), false);
  assert.equal(shouldEnqueueSchedule(new Date('2026-09-01T03:30:00Z'), jobs, { captureHour: 0, captureMinute: 10 }), true);
  const dir = await mkdtemp(path.join(os.tmpdir(), 'pipeline-health-'));
  try {
    await writeFile(path.join(dir, 'capture_summary_2026-09-29.json'), JSON.stringify({ errors: [{ username: 'a', stage: 'account', code: 'account_unavailable' }], accounts_requested: ['a'], accounts_successful: [] }));
    const sent = [];
    const runtime = { jobs: new JobStore(':memory:'), opsChatId: 'oc', config: { paths: { collectorSummaryDir: dir } }, sendOpsHealth: async (m) => { sent.push(m.text); } };
    const at = { now: new Date('2026-09-29T03:00:00Z'), date: '2026-09-29' };
    // The day ended in a clean success after an earlier partial run: nothing to report.
    assert.deepEqual(await pipelineHealthAlerts(runtime, { ...at, jobs: [{ run_id: 'r1', state: 'partial' }, { run_id: 'r2', state: 'success' }] }), []);
    const result = await pipelineHealthAlerts(runtime, { ...at, jobs: [{ run_id: 'r1', state: 'failed' }, { run_id: 'r2', state: 'partial' }] });
    assert.deepEqual(result.map((r) => [r.kind, r.status]), [['capture-incomplete', 'sent']]);
    assert.match(sent[0], /run_id=r2/);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('a day that already has a usable run is never retried, even below the attempt cap', () => {
  const store = new JobStore(':memory:');
  const enqueue = (runId, now) => store.enqueueIfIdle({ runId, trigger: 'schedule', now });
  assert.equal(enqueue('SDRUN-20260901-081000', '2026-09-01T00:10:00Z').created, true);
  store.db.prepare("UPDATE jobs SET state='failed', step='failed', finished_at='2026-09-01T01:00:00Z' WHERE run_id='SDRUN-20260901-081000'").run();
  assert.equal(enqueue('SDRUN-20260901-100000', '2026-09-01T02:00:00Z').created, true);
  store.db.prepare("UPDATE jobs SET state='partial', step='partial', finished_at='2026-09-01T03:00:00Z' WHERE run_id='SDRUN-20260901-100000'").run();
  const again = enqueue('SDRUN-20260901-120000', '2026-09-01T04:00:00Z');
  assert.equal(again.created, false);
  assert.equal(again.job.run_id, 'SDRUN-20260901-100000');
});

test('an unknown alert kind is rejected before it can be stored', () => {
  const store = new JobStore(':memory:');
  assert.throws(() => store.claimHealthAlert('made-up:2026-09-01', { ownerId: 'o', now: '2026-09-01T02:00:00Z' }), (error) => error.code === 'health_alert_key_invalid');
  assert.throws(() => store.claimHealthAlert('drain-failing:20260901', { ownerId: 'o', now: '2026-09-01T02:00:00Z' }), (error) => error.code === 'health_alert_key_invalid');
});

test('alert text is kept whole at the limit and cut only beyond it', () => {
  const header = 'h';
  const fits = 'x'.repeat(ALERT_TEXT_LIMIT - header.length - 1);
  assert.equal(boundedAlertText(header, [fits]), header + '\n' + fits);
  assert.equal(boundedAlertText(header, [fits]).length, ALERT_TEXT_LIMIT);
  const cut = boundedAlertText(header, [fits + 'x']);
  assert.ok(cut.length <= ALERT_TEXT_LIMIT);
  assert.match(cut, /另有 1 项/);
});

test('queue drain records its own outcome and a bookkeeping failure never fails a good drain', async () => {
  const store = new JobStore(':memory:');
  store.create({ runId: 'SDRUN-20260901-080000', trigger: 'schedule', chatId: 'oc', now: '2026-09-01T00:00:00Z' });
  const runtime = { jobs: store, workerPid: 9, now: () => new Date('2026-09-01T00:00:00Z'), notifier: { sendTerminal: async () => {} } };
  const failing = createDispatcher({ ...runtime, runWorker: async () => { throw Object.assign(new Error('lost'), { code: 'worker_claim_mismatch' }); } });
  await assert.rejects(failing(parseCommand(['queue', 'drain']), { mode: 'internal' }, null), (error) => error.code === 'worker_claim_mismatch');
  assert.equal(readDrainHealth(store.db).consecutive_failures, 1);
  assert.equal(readDrainHealth(store.db).last_error_code, 'worker_claim_mismatch');
  const idle = createDispatcher({ ...runtime, jobs: { claimNext: () => null, listUndeliveredTerminal: () => [], db: store.db }, runWorker: async () => ({ status: 'success' }) });
  assert.equal((await idle(parseCommand(['queue', 'drain']), { mode: 'internal' }, null)).status, 'no_op');
  assert.equal(readDrainHealth(store.db).consecutive_failures, 0);
  const broken = { exec() { throw new Error('disk'); }, prepare() { throw new Error('disk'); } };
  const unrecorded = createDispatcher({ ...runtime, jobs: { claimNext: () => null, listUndeliveredTerminal: () => [], db: broken }, runWorker: async () => ({ status: 'success' }) });
  assert.equal((await unrecorded(parseCommand(['queue', 'drain']), { mode: 'internal' }, null)).status, 'no_op');
});

test('a broken extra health check never suppresses the missing-run alert', async () => {
  const sent = [];
  const marks = [];
  const broken = { exec() { throw new Error('disk'); }, prepare() { throw new Error('disk'); } };
  const dispatch = createDispatcher({
    jobs: { listByBeijingDate: () => [], claimHealthAlert: () => true, markHealthAlert: (key, state) => { marks.push([key, state]); }, db: broken },
    now: () => new Date('2026-09-01T04:00:00Z'), opsChatId: 'oc', config: { schedule: { captureHour: 0, captureMinute: 10, healthHour: 2, healthMinute: 10 } },
    sendOpsHealth: async (m) => { sent.push(m.text); },
  });
  const result = await dispatch(parseCommand(['schedule', 'health']), { mode: 'internal' }, null);
  // The state database is broken, so capture reports cannot be produced either: the run is not healthy.
  assert.equal(result.status, 'partial');
  assert.deepEqual(marks, [['missing-terminal:2026-09-01', 'sent']]);
  assert.equal(sent.length, 1);
  assert.equal(result.alerts_error?.code, 'health_check_failed');
});

test('health reports alerted when an extra alert went out although the missing-run alert was already sent', async () => {
  const store = new JobStore(':memory:');
  store.claimHealthAlert('missing-terminal:2026-09-01', { ownerId: 'o', now: '2026-09-01T03:00:00Z' });
  store.markHealthAlert('missing-terminal:2026-09-01', 'sent', { ownerId: 'o', now: '2026-09-01T03:00:01Z' });
  for (let i = 0; i < DRAIN_FAILURE_ALERT_THRESHOLD; i += 1) recordDrainOutcome(store.db, { ok: false, error: { code: 'x' } });
  const dispatch = createDispatcher({
    jobs: store, now: () => new Date('2026-09-01T04:00:00Z'), opsChatId: 'oc',
    config: { schedule: { captureHour: 0, captureMinute: 10, healthHour: 2, healthMinute: 10 } }, sendOpsHealth: async () => {},
  });
  const result = await dispatch(parseCommand(['schedule', 'health']), { mode: 'internal' }, null);
  assert.equal(result.status, 'alerted');
  assert.deepEqual(result.alerts.map((a) => [a.kind, a.status]), [['drain-failing', 'sent']]);
});

test('an alert says what a release with an unusable account row still counts towards', () => {
  const issue = (detail) => ({ key: 'k', kind: 'release_skipped', detail });
  const partial = describeIntegrityIssue(issue({ release_id: 'SR-1', reason: 'release_account_missing', account_record_id: 'rec9' }));
  assert.match(partial, /SR-1/);
  assert.match(partial, /未计入账号累计/);
  assert.match(partial, /仍计入分剧/);
  assert.doesNotMatch(partial, /未进入统计/);
  // No account link at all: the release is left out of every report.
  assert.match(describeIntegrityIssue(issue({ release_id: 'SR-2', reason: 'release_account_missing', account_record_id: null })), /SR-2 未进入统计/);
  assert.match(describeIntegrityIssue(issue({ release_id: 'SR-3', reason: 'duplicate_post_claim' })), /SR-3 未进入统计：duplicate_post_claim/);
  const metric = describeIntegrityIssue(issue({ release_id: 'SR-4', reason: 'capture_metrics_invalid', post_id: '77' }));
  assert.match(metric, /SR-4/);
  assert.match(metric, /按缺失处理/);
  assert.doesNotMatch(metric, /未进入统计/);
});

test('a post that failed is counted once however many stages reported it', () => {
  const lines = captureIncompleteLines({ accounts_requested: ['a'], accounts_successful: ['a'], errors: [
    { username: 'a', post_id: '1', stage: 'photo_detail' }, { username: 'a', post_id: '1', stage: 'detail', code: 'detail_unavailable' },
    { username: 'a', post_id: '2', stage: 'detail', code: 'detail_unavailable' }] });
  assert.deepEqual(lines, ['帖子采集失败 2 条（detail_unavailable 2，photo_detail 1）']);
});

test('an account that produced no snapshot is reported even when the collector logged no error for it', () => {
  const lines = captureIncompleteLines({ accounts_requested: ['a', 'b'], accounts_successful: ['a'], errors: [], local_history: { partial_count: 0 } });
  assert.deepEqual(lines, ['账号入口失败 1/2', '@b: 未取得账号快照']);
});

test('only the issues an alert actually lists are marked as reported', async () => {
  const store = new JobStore(':memory:');
  recordIntegrityIssues(store.db, []);
  recordIntegrityIssues(store.db, Array.from({ length: 120 }, (_, i) => ({ key: `account_deleted:rec${String(i).padStart(3, '0')}`, kind: 'account_deleted',
    detail: { account_record_id: `rec${String(i).padStart(3, '0')}`, captures: 1, releases: 0 } })));
  const sent = [];
  const runtime = { jobs: store, opsChatId: 'oc', config: {}, sendOpsHealth: async (m) => { sent.push(m.text); } };
  await pipelineHealthAlerts(runtime, { now: new Date('2026-09-29T03:00:00Z'), date: '2026-09-29', jobs: [] });
  const listed = sent[0].split('\n').filter((line) => line.startsWith('账号台账行已删除')).length;
  const pending = pendingIntegrityIssues(store.db);
  assert.ok(listed > 0 && listed < 120);
  assert.equal(pending.length, 120 - listed);
  assert.match(sent[0], new RegExp(`另有 ${120 - listed} 项`));
  // The rest is reported by the next day's alert instead of being forgotten.
  await pipelineHealthAlerts(runtime, { now: new Date('2026-09-30T03:00:00Z'), date: '2026-09-30', jobs: [] });
  assert.equal(sent.length, 2);
  assert.ok(sent[1].includes(pending[0].detail.account_record_id));
});

test('an alert that was delivered is not sent again because recording the delivery failed', async () => {
  const store = new JobStore(':memory:');
  for (let i = 0; i < DRAIN_FAILURE_ALERT_THRESHOLD; i += 1) recordDrainOutcome(store.db, { ok: false, error: { code: 'x' } });
  let sent = 0;
  const jobs = { db: store.db, claimHealthAlert: (...args) => store.claimHealthAlert(...args), markHealthAlert: () => { throw new Error('disk'); } };
  const runtime = { jobs, opsChatId: 'oc', config: {}, sendOpsHealth: async () => { sent += 1; }, sleep: async () => {} };
  const result = await pipelineHealthAlerts(runtime, { now: new Date('2026-09-29T03:00:00Z'), date: '2026-09-29', jobs: [] });
  assert.deepEqual(result.map((r) => [r.kind, r.status]), [['drain-failing', 'sent']]);
  assert.equal(sent, 1);
});

test('recording a delivered alert is retried, so a brief lock does not lead to a second send', async () => {
  const store = new JobStore(':memory:');
  for (let i = 0; i < DRAIN_FAILURE_ALERT_THRESHOLD; i += 1) recordDrainOutcome(store.db, { ok: false, error: { code: 'x' } });
  let sent = 0, marks = 0;
  const jobs = { db: store.db, claimHealthAlert: (...args) => store.claimHealthAlert(...args),
    markHealthAlert: (...args) => { marks += 1; if (marks < 3) throw new Error('database is locked'); return store.markHealthAlert(...args); } };
  const runtime = { jobs, opsChatId: 'oc', config: {}, sendOpsHealth: async () => { sent += 1; }, sleep: async () => {} };
  await pipelineHealthAlerts(runtime, { now: new Date('2026-09-29T03:00:00Z'), date: '2026-09-29', jobs: [] });
  // Long after the claim lease has run out the alert is known as sent.
  const later = await pipelineHealthAlerts(runtime, { now: new Date('2026-09-29T09:00:00Z'), date: '2026-09-29', jobs: [] });
  assert.deepEqual(later.map((r) => [r.kind, r.status]), [['drain-failing', 'already_claimed']]);
  assert.equal(sent, 1);
  assert.equal(marks, 3);
});

test('the Feishu authentication request carries a deadline as well', async () => {
  const { createTenantTokenProvider } = await import('../src/feishu-client.mjs');
  let signal = null;
  const provider = createTenantTokenProvider({ appId: 'app', appSecret: 'secret',
    fetchJson: async (url, options) => { signal = options.signal ?? null; return { code: 0, tenant_access_token: 't', expire: 600 }; } });
  assert.equal(await provider(), 't');
  assert.ok(signal instanceof AbortSignal);
  assert.equal(signal.aborted, false);
});
