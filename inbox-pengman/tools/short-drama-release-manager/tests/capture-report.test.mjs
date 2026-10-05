import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { JobStore } from '../src/job-store.mjs';
import { ALERT_TEXT_LIMIT, alertText, captureIncompleteLines, captureReportCutoff, pendingIntegrityIssues, recordDrainOutcome, recordIntegrityIssues } from '../src/pipeline-health.mjs';
import { buildCaptureReport, describeCaptureCode, summaryBelongsToJob } from '../src/capture-report.mjs';
import { captureReports, createDispatcher, createFeishuMessageSender, exitCodeFor, parseCommand, pipelineHealthAlerts } from '../shortdrama_ctl.mjs';
import { loadRuntimeConfig, loadRuntimeEnvironment } from '../src/config.mjs';

const job = (overrides = {}) => ({
  run_id: 'SDRUN-20260930-001248', trigger: 'schedule', state: 'partial',
  started_at: '2026-09-29T16:12:48.807Z', finished_at: '2026-09-29T18:47:17.000Z',
  counters: { accounts_updated: 18, capture_rows_upserted: 652, releases_linked: 3, manual_fields_changed_by_sync: 0, errors: 4 },
  error: { code: 'sync_partial', errors: [{ code: 'capture_partial', step: 'collector' }] },
  ...overrides,
});

const summary = (overrides = {}) => ({
  captured_at: '2026-09-29T16:13:05.000Z', capture_date: '2026-09-30',
  accounts_requested: Array.from({ length: 19 }, (_, i) => `acct${i}`),
  accounts_successful: Array.from({ length: 18 }, (_, i) => `acct${i}`),
  account_count: 18, post_count: 652, detail_complete_posts: 650, partial_posts: 2,
  errors: [
    { username: 'acct18', stage: 'account', code: 'account_unavailable', status_code: 10221 },
    { username: 'acct3', post_id: '1', stage: 'detail', code: 'detail_unavailable' },
    { username: 'acct3', post_id: '2', stage: 'detail', code: 'detail_unavailable' },
    { username: 'acct3', post_id: '3', stage: 'detail', code: 'detail_unavailable' },
  ],
  local_history: { unique_posts_total: 749, partial_count: 2, failed_count: 4 },
  ...overrides,
});

test('a finished capture is reported in plain Chinese with counts, updates and problems', () => {
  const text = buildCaptureReport({
    job: job(), summary: summary(), previousSummary: { local_history: { unique_posts_total: 737 } },
    drain: { consecutive_failures: 0, last_success_at: '2026-09-29T18:50:00.000Z' },
  });
  assert.match(text, /^【短剧数据采集日报】2026-09-30/);
  assert.match(text, /结果：部分成功/);
  assert.match(text, /00:12/);
  assert.match(text, /02:47/);
  assert.match(text, /2 小时 34 分/);
  assert.match(text, /18\/19/);
  assert.match(text, /652 条/);
  assert.match(text, /指标完整 650 条，不完整 2 条/);
  assert.match(text, /较昨日新增帖子：12 条/);
  assert.match(text, /采集数据表写入 652 行/);
  assert.match(text, /账号台账更新 18 个/);
  assert.match(text, /发布记录新关联 3 条/);
  // A drain that did not fail is no proof that the report tables are up to date.
  assert.doesNotMatch(text, /统计报表/);
  assert.match(text, /@acct18[:：]账号不可用/);
  assert.match(text, /帖子采集失败 3 条：帖子详情取不到（可能已删除或不可见）3 条/);
  assert.match(text, /指标不完整的帖子/);
  // The two blocks are separated so that the message can be scanned.
  assert.match(text, /\n\n数据更新\n/);
  assert.match(text, /SDRUN-20260930-001248$/);
  assert.ok(text.length <= ALERT_TEXT_LIMIT);
  // Readers of the group are not expected to know internal error codes.
  assert.doesNotMatch(text, /account_unavailable|detail_unavailable|sync_partial|capture_partial/);
});

test('a clean capture says that there were no problems', () => {
  const text = buildCaptureReport({
    job: job({ state: 'success', error: {}, counters: { accounts_updated: 19, capture_rows_upserted: 700, releases_linked: 0, manual_fields_changed_by_sync: 0, errors: 0 } }),
    summary: summary({ accounts_successful: Array.from({ length: 19 }, (_, i) => `acct${i}`), errors: [], partial_posts: 0, local_history: { unique_posts_total: 749, partial_count: 0 } }),
  });
  assert.match(text, /结果：成功/);
  assert.match(text, /19\/19/);
  assert.match(text, /问题：无/);
  // Without yesterday's summary the number of new posts is unknown, not zero.
  assert.doesNotMatch(text, /新增帖子/);
});

test('a failed capture says why and what the retry rule is', () => {
  const failed = job({ run_id: 'SDRUN-20260930-001000', state: 'failed', started_at: '2026-09-29T16:10:00Z', finished_at: '2026-09-29T16:20:00.000Z', counters: {}, error: { code: 'capture_failed' } });
  const again = buildCaptureReport({ job: failed, attempt: 1, maxAttempts: 3, retryDelayMinutes: 30 });
  assert.match(again, /结果：失败/);
  assert.match(again, /采集没有产出任何数据/);
  // The rule with its two limits; both are fixed when the run ends.
  assert.match(again, /后续：按规则自动补跑，最早 00:50、最晚 24:00 前开始（今日第 1 次尝试，最多 3 次）；补跑结果另发日报/);
  // A retry that would fall on the next day never happens: the next day starts its own run.
  const lateNight = job({ run_id: 'SDRUN-20260930-235000', state: 'failed', started_at: '2026-09-30T15:50:00Z', finished_at: '2026-09-30T15:55:00Z', error: { code: 'capture_failed' } });
  const tomorrow = buildCaptureReport({ job: lateNight, attempt: 1, maxAttempts: 3, retryDelayMinutes: 30 });
  assert.doesNotMatch(tomorrow, /自动补跑/);
  assert.match(tomorrow, /后续：今日不再补跑，下一次采集由下一次定时任务执行/);
  // So does a run that ended after midnight.
  const overnight = buildCaptureReport({ job: { ...lateNight, finished_at: '2026-09-30T16:20:00Z' }, attempt: 1 });
  assert.match(overnight, /后续：今日不再补跑/);
  const last = buildCaptureReport({ job: failed, attempt: 3, maxAttempts: 3 });
  assert.match(last, /后续：今日第 3 次仍失败，已达上限，不再自动补跑，需要人工处理/);
  // Runs that did not fail have nothing to retry.
  assert.doesNotMatch(buildCaptureReport({ job: job(), summary: summary() }), /后续/);
  // A code without a translation is shown as it is instead of being dropped.
  assert.match(buildCaptureReport({ job: job({ state: 'failed', error: { code: 'brand_new_code' } }) }), /brand_new_code/);
});

test('figures of another run are never shown as this run\'s result', () => {
  const stale = summary({ captured_at: '2026-09-29T10:00:00.000Z' });
  assert.equal(summaryBelongsToJob(stale, job()), false);
  assert.equal(summaryBelongsToJob(summary(), job()), true);
  assert.equal(summaryBelongsToJob(null, job()), false);
  assert.equal(summaryBelongsToJob(summary({ captured_at: 'not a date' }), job()), false);
  const text = buildCaptureReport({ job: job(), summary: stale });
  assert.doesNotMatch(text, /18\/19/);
  assert.match(text, /采集明细不可用/);
  // The Runner's own counters belong to the job and are still shown.
  assert.match(text, /采集数据表写入 652 行/);
});

test('counters that are missing are shown as unknown, not as zero', () => {
  const text = buildCaptureReport({ job: job({ counters: { capture_rows_upserted: 'x' } }), summary: summary() });
  assert.match(text, /采集数据表写入 未知/);
  assert.doesNotMatch(text, /写入 0 行/);
});

test('a long problem list is cut to fit the sender limit and the run id is kept', () => {
  const errors = Array.from({ length: 300 }, (_, i) => ({ username: `account_with_a_long_name_${i}`, stage: 'listing', code: 'listing_timeout' }));
  const text = buildCaptureReport({ job: job(), summary: summary({ errors }) });
  assert.ok(text.length <= ALERT_TEXT_LIMIT, String(text.length));
  assert.match(text, /另有 \d+ 项/);
  assert.match(text, /SDRUN-20260930-001248$/);
});

test('a failing report sync is named in the report', () => {
  const text = buildCaptureReport({ job: job(), summary: summary(), drain: { consecutive_failures: 4, last_error_code: 'analytics_invalid' } });
  assert.match(text, /统计报表：同步失败/);
  assert.match(text, /连续 4 次/);
});

test('every known collector code has a translation and unknown codes pass through', () => {
  for (const code of ['account_unavailable', 'account_entry_failed', 'listing_timeout', 'listing_output_truncated', 'listing_failed',
    'listing_incomplete', 'listing_limit_reached', 'listing_empty', 'detail_budget_exhausted', 'detail_circuit_open',
    'detail_unavailable', 'metrics_zero_suspect', 'capture_identity_mismatch', 'capture_failed']) {
    assert.notEqual(describeCaptureCode(code), code, code);
    assert.match(describeCaptureCode(code), /[一-鿿]/, code);
  }
  assert.equal(describeCaptureCode('something_else'), 'something_else');
  assert.equal(describeCaptureCode(undefined), '未知错误');
});

test('problem lines keep their codes unless a translation is asked for', () => {
  const lines = captureIncompleteLines(summary());
  assert.ok(lines.includes('@acct18: account_unavailable'));
  const translated = captureIncompleteLines(summary(), { label: describeCaptureCode });
  assert.ok(translated.some((line) => /^@acct18：账号不可用/.test(line)), translated.join('|'));
  // A cause that does not end in a bracket is set off from its count by a space.
  const plain = captureIncompleteLines({ errors: [{ username: 'a', post_id: '1', stage: 'photo_detail' }] }, { label: describeCaptureCode });
  assert.deepEqual(plain, ['帖子采集失败 1 条：图文帖详情读取失败 1 条']);
});

async function withSummaries(files, run) {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'sd-report-'));
  try {
    for (const [date, body] of Object.entries(files)) await writeFile(path.join(dir, `capture_summary_${date}.json`), JSON.stringify(body));
    return await run(dir);
  } finally { await rm(dir, { recursive: true, force: true }); }
}

test('every finished scheduled run is reported once, whatever its state', async () => {
  await withSummaries({ '2026-09-30': summary(), '2026-09-29': { local_history: { unique_posts_total: 737 } } }, async (dir) => {
    const sent = [];
    const runtime = { jobs: new JobStore(':memory:'), opsChatId: 'oc_ops', reportChatId: 'oc_group', config: { paths: { collectorSummaryDir: dir } },
      sendOpsHealth: async (message) => { sent.push(message); } };
    const now = new Date('2026-09-29T18:50:00Z');
    const jobs = [
      job({ run_id: 'SDRUN-20260930-001000', state: 'failed', started_at: '2026-09-29T16:10:00Z', finished_at: '2026-09-29T16:11:00Z', error: { code: 'capture_failed' } }),
      job(),
      job({ run_id: 'SDRUN-20260930-030000', state: 'running', finished_at: null }),
      job({ run_id: 'SDRUN-20260930-020000', trigger: 'manual' }),
    ];
    const first = await captureReports(runtime, { now, jobs });
    assert.deepEqual(first.map((r) => [r.kind, r.run_id, r.status]), [
      ['capture-report', 'SDRUN-20260930-001000', 'sent'], ['capture-report', 'SDRUN-20260930-001248', 'sent']]);
    assert.deepEqual(sent.map((m) => m.chatId), ['oc_group', 'oc_group']);
    assert.match(sent[0].text, /结果：失败/);
    // The rule is stated whether or not the next attempt has started by now.
    assert.match(sent[0].text, /后续：按规则自动补跑，最早 00:41/);
    assert.match(sent[1].text, /较昨日新增帖子：12 条/);
    const second = await captureReports(runtime, { now, jobs });
    assert.deepEqual(second.map((r) => r.status), ['already_claimed', 'already_claimed']);
    assert.equal(sent.length, 2);
  });
});

test('a report that could not be delivered is sent on a later check', async () => {
  let healthy = false;
  const sent = [];
  const runtime = { jobs: new JobStore(':memory:'), opsChatId: 'oc_ops', config: {},
    sendOpsHealth: async (message) => { if (!healthy) throw Object.assign(new Error('down'), { code: 'notification_delivery_failed' }); sent.push(message); } };
  const at = { now: new Date('2026-09-29T18:50:00Z'), jobs: [job()] };
  assert.deepEqual((await captureReports(runtime, at)).map((r) => [r.status, r.error?.code]), [['failed', 'notification_delivery_failed']]);
  healthy = true;
  assert.deepEqual((await captureReports(runtime, at)).map((r) => r.status), ['sent']);
  // Without a dedicated report chat the ops chat receives the report.
  assert.equal(sent[0].chatId, 'oc_ops');
});

test('a run that finished long ago is not reported', async () => {
  const sent = [];
  const runtime = { jobs: new JobStore(':memory:'), opsChatId: 'oc_ops', config: {}, sendOpsHealth: async (message) => { sent.push(message); } };
  const old = job({ run_id: 'SDRUN-20260929-001013', started_at: '2026-09-28T16:10:13Z', finished_at: '2026-09-28T18:47:17Z' });
  assert.deepEqual(await captureReports(runtime, { now: new Date('2026-09-29T18:50:00Z'), jobs: [old] }), []);
  assert.equal(sent.length, 0);
});

test('the report of a failed run reads the same whenever it is written', async () => {
  const failed = (run_id, started_at, finished_at) => job({ run_id, state: 'failed', started_at, finished_at, error: { code: 'capture_failed' } });
  const one = failed('SDRUN-20260930-001000', '2026-09-29T16:10:00Z', '2026-09-29T16:11:00Z');
  const later = [one, failed('SDRUN-20260930-004500', '2026-09-29T16:45:00Z', '2026-09-29T16:46:00Z'),
    failed('SDRUN-20260930-012000', '2026-09-29T17:20:00Z', '2026-09-29T17:21:00Z')];
  const written = async (now, jobs) => {
    const sent = [];
    const runtime = { jobs: new JobStore(':memory:'), opsChatId: 'oc_ops', config: {}, sendOpsHealth: async (message) => { sent.push(message.text); } };
    await captureReports(runtime, { now: new Date(now), jobs });
    return sent;
  };
  const atOnce = await written('2026-09-29T16:12:00Z', [one]);
  assert.match(atOnce[0], /后续：按规则自动补跑，最早 00:41、最晚 24:00 前开始（今日第 1 次尝试，最多 3 次）/);
  // Hours later, with the retries over.
  const late = await written('2026-09-29T21:00:00Z', later);
  assert.equal(late[0], atOnce[0]);
  assert.match(late[1], /本次为补跑（今日第 2 次尝试）/);
  assert.match(late[2], /后续：今日第 3 次仍失败，已达上限，不再自动补跑，需要人工处理/);
});

test('the capture alert is not repeated once the report of that run went out', async () => {
  await withSummaries({ '2026-09-30': summary() }, async (dir) => {
    const sent = [];
    const runtime = { jobs: new JobStore(':memory:'), opsChatId: 'oc_ops', reportChatId: 'oc_group', config: { paths: { collectorSummaryDir: dir } },
      sendOpsHealth: async (message) => { sent.push(message); } };
    const now = new Date('2026-09-29T18:50:00Z');
    await captureReports(runtime, { now, jobs: [job()] });
    assert.deepEqual(await pipelineHealthAlerts(runtime, { now, date: '2026-09-30', jobs: [job()] }), []);
    assert.equal(sent.length, 1);
  });
});

test('the capture alert still goes out when the report could not be delivered', async () => {
  await withSummaries({ '2026-09-30': summary() }, async (dir) => {
    let calls = 0;
    const sent = [];
    // The first send times out: nobody knows whether the group got the report.
    const runtime = { jobs: new JobStore(':memory:'), opsChatId: 'oc_ops', reportChatId: 'oc_group', config: { paths: { collectorSummaryDir: dir } },
      sendOpsHealth: async (message) => { calls += 1; if (calls === 1) throw new Error('timeout'); sent.push(message); } };
    const now = new Date('2026-09-29T18:50:00Z');
    assert.deepEqual((await captureReports(runtime, { now, jobs: [job()] })).map((r) => r.status), ['failed']);
    const alerts = await pipelineHealthAlerts(runtime, { now, date: '2026-09-30', jobs: [job()] });
    assert.deepEqual(alerts.map((r) => [r.kind, r.status]), [['capture-incomplete', 'sent']]);
    // Alerts use the report chat as well.
    assert.equal(sent[0].chatId, 'oc_group');
  });
});

test('schedule health reports a finished run before the health window opens', async () => {
  const store = new JobStore(':memory:');
  const sent = [];
  const finished = job({ run_id: 'SDRUN-20260901-001000', started_at: '2026-08-31T16:10:00Z', finished_at: '2026-08-31T16:40:00Z' });
  const jobs = { listByBeijingDate: (date) => (date === '2026-09-01' ? [finished] : []),
    claimHealthAlert: (...args) => store.claimHealthAlert(...args), markHealthAlert: (...args) => store.markHealthAlert(...args),
    isHealthAlertSent: (...args) => store.isHealthAlertSent(...args), db: store.db };
  const dispatch = createDispatcher({ jobs, now: () => new Date('2026-08-31T16:45:00Z'), opsChatId: 'oc_ops', reportChatId: 'oc_group',
    config: { schedule: { captureHour: 0, captureMinute: 10, healthHour: 2, healthMinute: 10 } }, sendOpsHealth: async (message) => { sent.push(message); } });
  const result = await dispatch(parseCommand(['schedule', 'health']), { mode: 'internal' }, null);
  assert.equal(result.reason, 'before_health_window');
  assert.deepEqual(result.reports.map((r) => [r.run_id, r.status]), [['SDRUN-20260901-001000', 'sent']]);
  assert.equal(result.status, 'reported');
  assert.equal(sent.length, 1);
  assert.equal(sent[0].chatId, 'oc_group');
  const again = await dispatch(parseCommand(['schedule', 'health']), { mode: 'internal' }, null);
  assert.equal(again.status, 'no_op');
  assert.equal(sent.length, 1);
});

test('a run that finished just before midnight is still reported after midnight', async () => {
  const store = new JobStore(':memory:');
  const sent = [];
  const late = job({ run_id: 'SDRUN-20260901-233000', started_at: '2026-09-01T15:30:00Z', finished_at: '2026-09-01T15:58:00Z' });
  const jobs = { listByBeijingDate: (date) => (date === '2026-09-01' ? [late] : []),
    claimHealthAlert: (...args) => store.claimHealthAlert(...args), markHealthAlert: (...args) => store.markHealthAlert(...args),
    isHealthAlertSent: (...args) => store.isHealthAlertSent(...args), db: store.db };
  const dispatch = createDispatcher({ jobs, now: () => new Date('2026-09-01T16:03:00Z'), opsChatId: 'oc_ops',
    config: { schedule: { captureHour: 0, captureMinute: 10, healthHour: 2, healthMinute: 10 } }, sendOpsHealth: async (message) => { sent.push(message); } });
  const result = await dispatch(parseCommand(['schedule', 'health']), { mode: 'internal' }, null);
  assert.deepEqual(result.reports.map((r) => r.status), ['sent']);
  assert.match(sent[0].text, /2026-09-01/);
});

test('a broken report never suppresses the health alerts', async () => {
  const sent = [];
  const marks = [];
  const dispatch = createDispatcher({
    // Only the look back at yesterday's runs, which the report alone needs, is broken.
    jobs: { listByBeijingDate: (date) => { if (date !== '2026-09-01') throw new Error('disk'); return []; },
      claimHealthAlert: () => true, markHealthAlert: (key, state) => { marks.push([key, state]); } },
    now: () => new Date('2026-09-01T04:00:00Z'), opsChatId: 'oc', config: { schedule: { captureHour: 0, captureMinute: 10, healthHour: 2, healthMinute: 10 } },
    sendOpsHealth: async (m) => { sent.push(m.text); },
  });
  const result = await dispatch(parseCommand(['schedule', 'health']), { mode: 'internal' }, null);
  assert.deepEqual(marks, [['missing-terminal:2026-09-01', 'sent']]);
  assert.equal(result.reports_error?.code, 'capture_report_failed');
  // The alert went out, but the run is not healthy while reports cannot be produced.
  assert.equal(result.status, 'partial');
  assert.equal(exitCodeFor(result), 2);
});

test('report keys are accepted by the alert store and other kinds are still rejected', () => {
  const store = new JobStore(':memory:');
  const at = { ownerId: 'o', now: '2026-09-30T02:00:00Z' };
  assert.equal(store.isHealthAlertSent('capture-report:SDRUN-20260930-001248'), false);
  assert.equal(store.claimHealthAlert('capture-report:SDRUN-20260930-001248', at), true);
  assert.equal(store.isHealthAlertSent('capture-report:SDRUN-20260930-001248'), false);
  store.markHealthAlert('capture-report:SDRUN-20260930-001248', 'sent', at);
  assert.equal(store.isHealthAlertSent('capture-report:SDRUN-20260930-001248'), true);
  for (const key of ['capture-report:2026-09-30', 'capture-report:SDRUN-2026', 'capture-report:SDRUN-20260930-001248\nx', 'made-up:SDRUN-20260930-001248']) {
    assert.throws(() => store.claimHealthAlert(key, at), (error) => error.code === 'health_alert_key_invalid', key);
  }
});

const runtimeConfig = () => ({
  schema_version: 'shortdrama/v1', timezone: 'Asia/Shanghai', source_spreadsheet_id: 'sheet',
  paths: { env_file: '.env', metrics_sqlite: 'metrics.sqlite', collector: 'collector.mjs', collector_summary_dir: 'summaries', ops_sqlite: 'ops.sqlite', payload_root: 'payloads' },
  base: { url: 'https://base.company.test/base', app_token_env: 'BASE', table_id_envs: { accounts: 'TA', dramas: 'TD', captures: 'TC', releases: 'TR' } },
  auth: { feishu_app_id_env: 'APP', feishu_app_secret_env: 'SECRET', google_service_account_path_env: 'GOOGLE', operator_ids_env: 'OPS', privileged_ids_env: 'ADMINS', notification_chat_ids_env: 'CHATS' },
  acceptance: { privileged_actor_id: 'ou_admin' },
});
const runtimeEnv = (extra = {}) => ({ BASE: 'base', TA: 'tbl-accounts', TD: 'tbl-dramas', TC: 'tbl-captures', TR: 'tbl-releases',
  APP: 'app', SECRET: 'secret', GOOGLE: '/safe/google.json', OPS: 'ou_operator', ADMINS: 'ou_admin', CHATS: 'oc_ops,oc_group', SHORTDRAMA_OPS_CHAT_ID: 'oc_ops', ...extra });

test('the report chat is read from the env file and must be allowlisted', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'sd-report-env-'));
  try {
    const configPath = path.join(root, 'runtime.json');
    await writeFile(configPath, JSON.stringify(runtimeConfig()));
    await writeFile(path.join(root, '.env'), Object.entries(runtimeEnv({ SHORTDRAMA_REPORT_CHAT_ID: 'oc_group' })).map(([k, v]) => `${k}=${v}`).join('\n') + '\n', { mode: 0o600 });
    const effective = await loadRuntimeEnvironment({ configPath, env: {} });
    assert.equal(effective.SHORTDRAMA_REPORT_CHAT_ID, 'oc_group');
    const configured = loadRuntimeConfig({ configPath, env: effective, notificationChatId: 'oc_ops' });
    assert.equal(configured.notifications.getReportChatId(), 'oc_group');
    // Chat ids must not end up in anything that serialises the config.
    assert.equal(JSON.stringify(configured).includes('oc_group'), false);
    // Not configured, or left blank: reports and alerts stay in the ops chat.
    assert.equal(loadRuntimeConfig({ configPath, env: runtimeEnv(), notificationChatId: 'oc_ops' }).notifications.getReportChatId(), 'oc_ops');
    assert.equal(loadRuntimeConfig({ configPath, env: runtimeEnv({ SHORTDRAMA_REPORT_CHAT_ID: '' }), notificationChatId: 'oc_ops' }).notifications.getReportChatId(), 'oc_ops');
    assert.throws(() => loadRuntimeConfig({ configPath, env: runtimeEnv({ SHORTDRAMA_REPORT_CHAT_ID: 'oc_elsewhere' }), notificationChatId: 'oc_ops' }),
      (error) => error.code === 'notification_target_denied');
    assert.throws(() => loadRuntimeConfig({ configPath, env: runtimeEnv({ SHORTDRAMA_REPORT_CHAT_ID: ' oc_group' }), notificationChatId: 'oc_ops' }),
      (error) => error.code === 'notification_target_denied' || error.code === 'config_invalid');
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('the missing-run alert says in plain words what is wrong and goes to the report chat', async () => {
  const cases = [
    [[], /今日没有启动采集任务/],
    [[{ trigger: 'schedule', state: 'failed', run_id: 'x', finished_at: '2026-08-01T00:00:00Z' }], /今日采集全部失败/],
    [[{ trigger: 'schedule', state: 'running', step: 'collector', run_id: 'x' }], /采集任务仍在运行.*collector/],
  ];
  for (const [today, expected] of cases) {
    const sent = [];
    const store = new JobStore(':memory:');
    const jobs = { listByBeijingDate: (date) => (date === '2026-09-01' ? today : []),
      claimHealthAlert: (...args) => store.claimHealthAlert(...args), markHealthAlert: (...args) => store.markHealthAlert(...args),
      isHealthAlertSent: (...args) => store.isHealthAlertSent(...args), db: store.db };
    const dispatch = createDispatcher({ jobs, now: () => new Date('2026-09-01T04:00:00Z'), opsChatId: 'oc_ops', reportChatId: 'oc_group',
      config: { schedule: { captureHour: 0, captureMinute: 10, healthHour: 2, healthMinute: 10 } }, sendOpsHealth: async (message) => { sent.push(message); } });
    const result = await dispatch(parseCommand(['schedule', 'health']), { mode: 'internal' }, null);
    assert.equal(result.status, 'alerted');
    assert.equal(sent.length, 1);
    assert.equal(sent[0].chatId, 'oc_group');
    assert.match(sent[0].text, /^【短剧采集告警】2026-09-01/);
    assert.match(sent[0].text, expected);
  }
});

test('the runtime sends reports to the configured report chat and to the ops chat without one', async () => {
  const { buildRuntime } = await import('../shortdrama_ctl.mjs');
  const root = await mkdtemp(path.join(os.tmpdir(), 'sd-report-runtime-'));
  try {
    const configPath = path.join(root, 'runtime.json');
    await writeFile(configPath, JSON.stringify(runtimeConfig()));
    class HumanOpsFixture {}
    class NotifierFixture {}
    const build = async (extra) => {
      const runtime = await buildRuntime({ configPath, command: parseCommand(['doctor', '--init-state', '--actor-id', 'ou_admin']),
        env: runtimeEnv({ GOOGLE: path.join(root, 'google.json'), ...extra }), services: { HumanOpsService: HumanOpsFixture, ShortDramaNotifier: NotifierFixture } });
      const chats = { ops: runtime.opsChatId, report: runtime.reportChatId };
      runtime.close();
      return chats;
    };
    assert.deepEqual(await build({ SHORTDRAMA_REPORT_CHAT_ID: 'oc_group' }), { ops: 'oc_ops', report: 'oc_group' });
    assert.deepEqual(await build({}), { ops: 'oc_ops', report: 'oc_ops' });
    await assert.rejects(build({ SHORTDRAMA_REPORT_CHAT_ID: 'oc_elsewhere' }), (error) => error.code === 'notification_target_denied');
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('causes that overlap on the same posts are marked as overlapping', () => {
  const errors = [
    { username: 'a', post_id: '1', stage: 'photo_detail' }, { username: 'a', post_id: '1', stage: 'detail', code: 'detail_unavailable' },
    { username: 'b', post_id: '2', stage: 'photo_detail' }, { username: 'b', post_id: '2', stage: 'detail', code: 'detail_unavailable' },
  ];
  const overlapping = captureIncompleteLines(summary({ errors, local_history: { partial_count: 0 } }), { label: describeCaptureCode });
  assert.equal(overlapping.at(-1), '帖子采集失败 2 条：帖子详情取不到（可能已删除或不可见）2 条；图文帖详情读取失败 2 条（同一条帖子可能有多个原因）');
  // Causes that add up to the number of posts need no remark.
  const apart = captureIncompleteLines(summary({ errors: [errors[1], errors[2]], local_history: { partial_count: 0 } }), { label: describeCaptureCode });
  assert.equal(apart.at(-1), '帖子采集失败 2 条：帖子详情取不到（可能已删除或不可见）1 条；图文帖详情读取失败 1 条');
});

test('problems the Runner hit while writing are listed by kind with their counts', () => {
  const errors = [
    { step: 'collector', code: 'capture_partial' },
    ...Array.from({ length: 30 }, (_, i) => ({ step: 'release_links', code: 'no_account_time_candidate', target: `SR-${i}` })),
    ...Array.from({ length: 12 }, (_, i) => ({ step: 'release_links', code: 'ambiguous_post_match', target: `SR-A${i}` })),
    { step: 'accounts', code: 'readback_mismatch', target: 'acct1' },
    { step: 'captures', code: 'capture_partial', target: '1' },
  ];
  const text = buildCaptureReport({ job: job({ error: { code: 'sync_partial', errors } }), summary: summary() });
  assert.match(text, /发布记录关联问题 42 条：.*没有采到帖子 30 条；.*无法确定.* 12 条/);
  assert.match(text, /账号台账写入问题 1 条：写入飞书后回读不一致 1 条/);
  // Posts with incomplete metrics are already counted from the capture summary.
  assert.doesNotMatch(text, /采集数据写入问题/);
  assert.doesNotMatch(text, /no_account_time_candidate|ambiguous_post_match|readback_mismatch/);
});

test('a run that is not a clean success never claims to be free of problems', () => {
  const clean = summary({ accounts_successful: Array.from({ length: 19 }, (_, i) => `acct${i}`), errors: [], partial_posts: 0, local_history: { unique_posts_total: 749, partial_count: 0 } });
  const onlySync = buildCaptureReport({ job: job({ error: { code: 'sync_partial', errors: [{ step: 'release_links', code: 'release_claim_conflict', target: 'SR-1' }] } }), summary: clean });
  assert.doesNotMatch(onlySync, /问题：无/);
  assert.match(onlySync, /发布记录关联问题 1 条/);
  const unexplained = buildCaptureReport({ job: job({ error: {} }), summary: clean });
  assert.doesNotMatch(unexplained, /问题：无/);
  assert.match(unexplained, /没有记录具体原因/);
  // Without a capture summary the collector's own errors are the only account of the capture.
  const noSummary = buildCaptureReport({ job: job({ error: { code: 'sync_partial', errors: [{ step: 'collector', code: 'detail_unavailable' }] } }) });
  assert.match(noSummary, /采集问题 1 条：帖子详情取不到/);
});

test('a failed run still shows what had been written before it failed', () => {
  const text = buildCaptureReport({ job: job({ state: 'failed', error: { code: 'readback_mismatch', errors: [{ step: 'accounts', code: 'readback_mismatch' }] },
    counters: { accounts_updated: 3, capture_rows_upserted: 10, releases_linked: 0, manual_fields_changed_by_sync: 0, errors: 1 } }), summary: summary() });
  assert.match(text, /数据更新（失败前已完成的部分）/);
  assert.match(text, /采集数据表写入 10 行/);
  assert.match(text, /失败原因：写入飞书后回读不一致/);
});

test('complete and incomplete posts are counted the way the stored snapshot counts them', () => {
  // The collector's top-level figures only look at likes; the snapshot checks every metric.
  const text = buildCaptureReport({ job: job(), summary: summary({ post_count: 10, detail_complete_posts: 10, partial_posts: 0, local_history: { unique_posts_total: 749, partial_count: 1 } }) });
  assert.match(text, /采到 10 条（指标完整 9 条，不完整 1 条）/);
  const unknown = buildCaptureReport({ job: job(), summary: summary({ post_count: 10, local_history: { unique_posts_total: 749 } }) });
  assert.match(unknown, /采到 10 条\n/);
  assert.doesNotMatch(unknown, /指标完整/);
});

test('reporting starts with the runs of the last half day and then never drops a run for being late', async () => {
  const sent = [];
  let healthy = true;
  const store = new JobStore(':memory:');
  const runtime = { jobs: store, opsChatId: 'oc_ops', config: {}, sendOpsHealth: async (message) => { if (!healthy) throw new Error('down'); sent.push(message.text); } };
  const old = job({ run_id: 'SDRUN-20260929-001013', started_at: '2026-09-28T16:10:13Z', finished_at: '2026-09-28T18:47:17Z' });
  const recent = job();
  const enabled = new Date('2026-09-29T19:00:00Z');
  assert.deepEqual((await captureReports(runtime, { now: enabled, jobs: [old, recent] })).map((r) => [r.run_id, r.status]), [['SDRUN-20260930-001248', 'sent']]);
  assert.equal(captureReportCutoff(store.db, { now: new Date('2026-10-05T00:00:00Z') }), '2026-09-29T07:00:00.000Z');
  // The next run finished at 02:40 but no check ran until 20 hours later.
  const next = job({ run_id: 'SDRUN-20261001-001000', started_at: '2026-09-30T16:10:00Z', finished_at: '2026-09-30T18:40:00Z' });
  assert.deepEqual((await captureReports(runtime, { now: new Date('2026-10-01T14:40:00Z'), jobs: [next] })).map((r) => r.status), ['sent']);
  // A delivery that failed is retried although the run ended more than half a day ago.
  const third = job({ run_id: 'SDRUN-20261002-001000', started_at: '2026-10-01T16:10:00Z', finished_at: '2026-10-01T18:40:00Z' });
  healthy = false;
  assert.deepEqual((await captureReports(runtime, { now: new Date('2026-10-01T18:45:00Z'), jobs: [third] })).map((r) => r.status), ['failed']);
  healthy = true;
  assert.deepEqual((await captureReports(runtime, { now: new Date('2026-10-02T08:45:00Z'), jobs: [third] })).map((r) => r.status), ['sent']);
  // After three days a report is no longer news.
  const stale = job({ run_id: 'SDRUN-20261003-001000', started_at: '2026-10-02T16:10:00Z', finished_at: '2026-10-02T18:40:00Z' });
  assert.deepEqual(await captureReports(runtime, { now: new Date('2026-10-05T18:41:00Z'), jobs: [stale] }), []);
  assert.equal(sent.length, 3);
});

async function healthDispatch({ dir, today, now, send, reportChatId = 'oc_group' }) {
  const store = new JobStore(':memory:');
  const jobs = { listByBeijingDate: (date) => today[date] ?? [],
    claimHealthAlert: (...args) => store.claimHealthAlert(...args), markHealthAlert: (...args) => store.markHealthAlert(...args),
    isHealthAlertSent: (...args) => store.isHealthAlertSent(...args), db: store.db };
  const dispatch = createDispatcher({ jobs, now: () => new Date(now), opsChatId: 'oc_ops', reportChatId, sleep: async () => {},
    config: { schedule: { captureHour: 0, captureMinute: 10, healthHour: 2, healthMinute: 10 }, paths: { collectorSummaryDir: dir } }, sendOpsHealth: send });
  return () => dispatch(parseCommand(['schedule', 'health']), { mode: 'internal' }, null);
}

test('a partial run inside the health window produces one message, the report', async () => {
  await withSummaries({ '2026-09-30': summary() }, async (dir) => {
    const sent = [];
    const run = await healthDispatch({ dir, today: { '2026-09-30': [job()] }, now: '2026-09-29T18:50:00Z', send: async (message) => { sent.push(message); } });
    const result = await run();
    assert.equal(sent.length, 1);
    assert.match(sent[0].text, /^【短剧数据采集日报】/);
    assert.deepEqual(result.reports.map((r) => r.status), ['sent']);
    assert.equal(result.alerts, undefined);
    assert.equal(result.status, 'reported');
  });
});

test('health looks back far enough to find every run that ended within three days', async () => {
  const asked = [];
  const store = new JobStore(':memory:');
  const dispatch = createDispatcher({ jobs: { listByBeijingDate: (date) => { asked.push(date); return []; },
    claimHealthAlert: (...args) => store.claimHealthAlert(...args), markHealthAlert: (...args) => store.markHealthAlert(...args), db: store.db },
    now: () => new Date('2026-08-31T16:45:00Z'), opsChatId: 'oc_ops', config: { schedule: { captureHour: 0, captureMinute: 10, healthHour: 2, healthMinute: 10 } }, sendOpsHealth: async () => {} });
  await dispatch(parseCommand(['schedule', 'health']), { mode: 'internal' }, null);
  // A run is named after the day it started on and can end on the next one.
  assert.deepEqual([...new Set(asked)].sort(), ['2026-08-28', '2026-08-29', '2026-08-30', '2026-08-31', '2026-09-01']);
});

test('a report the group cannot receive is delivered to the ops chat with a note', async () => {
  await withSummaries({ '2026-09-30': summary() }, async (dir) => {
    const sent = [];
    const run = await healthDispatch({ dir, today: { '2026-09-30': [job()] }, now: '2026-09-29T18:50:00Z',
      send: async (message) => { if (message.chatId === 'oc_group') throw Object.assign(new Error('not in chat'), { code: 'notification_target_refused' }); sent.push(message); } });
    const result = await run();
    assert.deepEqual(result.reports.map((r) => [r.status, r.fallback]), [['sent', true]]);
    assert.equal(sent.length, 1);
    assert.equal(sent[0].chatId, 'oc_ops');
    assert.match(sent[0].text, /^（通知群发送失败，改发到本会话）\n【短剧数据采集日报】/);
    assert.ok(sent[0].text.length <= 2000);
    // The fallback is reported as a problem of the health run although the report was delivered.
    assert.equal(result.status, 'partial');
    assert.equal(exitCodeFor(result), 2);
    assert.equal((await run()).status, 'no_op');
    assert.equal(sent.length, 1);
  });
});

test('a report that reached nobody makes the health run partial and is retried', async () => {
  await withSummaries({ '2026-09-30': summary() }, async (dir) => {
    let healthy = false;
    const sent = [];
    const run = await healthDispatch({ dir, today: { '2026-09-30': [job()] }, now: '2026-09-29T18:50:00Z',
      send: async (message) => { if (!healthy) throw Object.assign(new Error('down'), { code: 'notification_delivery_failed' }); sent.push(message); } });
    const failed = await run();
    assert.deepEqual(failed.reports.map((r) => r.status), ['failed']);
    assert.equal(failed.status, 'partial');
    assert.equal(exitCodeFor(failed), 2);
    // The alert is the fallback for an undelivered report; it failed for the same reason.
    assert.deepEqual(failed.alerts.map((a) => [a.kind, a.status]), [['capture-incomplete', 'failed']]);
    healthy = true;
    const retried = await run();
    assert.deepEqual(retried.reports.map((r) => r.status), ['sent']);
    assert.equal(sent.filter((m) => /采集日报/.test(m.text)).length, 1);
  });
});

test('every send of one report or alert carries the same request id, so a lost reply cannot duplicate it', async () => {
  const seen = [];
  let healthy = false;
  const store = new JobStore(':memory:');
  const runtime = { jobs: store, opsChatId: 'oc_ops', reportChatId: 'oc_group', config: {}, sleep: async () => {},
    sendOpsHealth: async (message) => { seen.push(message); if (!healthy && message.chatId === 'oc_group') throw new Error('reply lost'); } };
  const at = { now: new Date('2026-09-29T18:50:00Z'), jobs: [job()] };
  assert.deepEqual((await captureReports(runtime, at)).map((r) => r.status), ['failed']);
  // The group may have the message although the reply got lost: nothing is sent elsewhere.
  assert.deepEqual(seen.map((m) => m.chatId), ['oc_group']);
  healthy = true;
  assert.deepEqual((await captureReports(runtime, at)).map((r) => r.status), ['sent']);
  const group = seen.filter((m) => m.chatId === 'oc_group').map((m) => m.idempotencyKey);
  assert.equal(group.length, 2);
  assert.equal(group[0], group[1]);
  assert.match(group[0], /^[0-9a-f]{40}$/);
});

test('only a refusal is rerouted to the ops chat, under a request id of its own', async () => {
  for (const code of ['notification_target_refused', 'notification_target_denied']) {
    const seen = [];
    const runtime = { jobs: new JobStore(':memory:'), opsChatId: 'oc_ops', reportChatId: 'oc_group', config: {}, sleep: async () => {},
      sendOpsHealth: async (message) => { seen.push(message); if (message.chatId === 'oc_group') throw Object.assign(new Error('refused'), { code }); } };
    const result = await captureReports(runtime, { now: new Date('2026-09-29T18:50:00Z'), jobs: [job()] });
    assert.deepEqual(result.map((r) => [r.status, r.fallback]), [['sent', true]], code);
    assert.deepEqual(seen.map((m) => m.chatId), ['oc_group', 'oc_ops']);
    assert.notEqual(seen[0].idempotencyKey, seen[1].idempotencyKey);
    assert.match(seen[1].idempotencyKey, /^[0-9a-f]{40}$/);
  }
});

test('a report that is sent late keeps its figures although a later capture replaced the summary', async () => {
  await withSummaries({ '2026-09-30': summary() }, async (dir) => {
    const seen = [];
    let healthy = false;
    const runtime = { jobs: new JobStore(':memory:'), opsChatId: 'oc_ops', config: { paths: { collectorSummaryDir: dir } }, sleep: async () => {},
      sendOpsHealth: async (message) => { seen.push(message.text); if (!healthy) throw Object.assign(new Error('down'), { code: 'notification_delivery_failed' }); } };
    const at = { now: new Date('2026-09-29T18:50:00Z'), jobs: [job()] };
    assert.deepEqual((await captureReports(runtime, at)).map((r) => r.status), ['failed']);
    assert.match(seen[0], /帖子：采到 652 条/);
    // The second capture of the day writes the summary of the same date.
    await writeFile(path.join(dir, 'capture_summary_2026-09-30.json'), JSON.stringify(summary({ captured_at: '2026-09-30T08:09:00.000Z', post_count: 700 })));
    healthy = true;
    assert.deepEqual((await captureReports(runtime, { ...at, now: new Date('2026-09-30T10:30:00Z') })).map((r) => r.status), ['sent']);
    assert.equal(seen[1], seen[0]);
  });
});

test('a report that was attempted keeps its text, whatever turns up later', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'sd-report-'));
  try {
    const seen = [];
    const runtime = { jobs: new JobStore(':memory:'), opsChatId: 'oc_ops', config: { paths: { collectorSummaryDir: dir } }, sleep: async () => {},
      sendOpsHealth: async (message) => { seen.push(message.text); if (seen.length === 1) throw new Error('reply lost'); } };
    const at = { now: new Date('2026-09-29T18:50:00Z'), jobs: [job()] };
    await captureReports(runtime, at);
    assert.match(seen[0], /采集明细不可用/);
    await writeFile(path.join(dir, 'capture_summary_2026-09-30.json'), JSON.stringify(summary()));
    await captureReports(runtime, at);
    // The first attempt may have arrived: the same request id must carry the same text.
    assert.equal(seen[1], seen[0]);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

const refusal = () => Object.assign(new Error('refused'), { code: 'notification_target_refused' });
const unanswered = () => Object.assign(new Error('gateway'), { code: 'notification_delivery_failed' });

test('the text of an alert is the one of its first attempt', () => {
  const { db } = new JobStore(':memory:');
  const key = 'drain-failing:2026-09-30';
  assert.deepEqual(alertText(db, key, 'first', { payload: ['a'] }), { text: 'first', payload: ['a'] });
  assert.deepEqual(alertText(db, key, 'second', { payload: ['b'] }), { text: 'first', payload: ['a'] });
  assert.deepEqual(alertText(db, 'drain-failing:2026-10-01', 'other'), { text: 'other', payload: null });
});

test('a health alert that is sent again carries the text of its first attempt', async () => {
  const store = new JobStore(':memory:');
  for (let i = 0; i < 6; i += 1) recordDrainOutcome(store.db, { ok: false, error: { code: 'x' } });
  const seen = [];
  let healthy = false;
  const runtime = { jobs: store, opsChatId: 'oc_ops', config: {}, sleep: async () => {},
    sendOpsHealth: async (message) => { seen.push(message); if (!healthy) throw new Error('reply lost'); } };
  const at = { date: '2026-09-30', jobs: [] };
  assert.deepEqual((await pipelineHealthAlerts(runtime, { ...at, now: new Date('2026-09-30T02:00:00Z') })).map((a) => [a.kind, a.status]), [['drain-failing', 'failed']]);
  recordDrainOutcome(store.db, { ok: false, error: { code: 'x' } });
  healthy = true;
  assert.deepEqual((await pipelineHealthAlerts(runtime, { ...at, now: new Date('2026-09-30T02:05:00Z') })).map((a) => [a.kind, a.status]), [['drain-failing', 'sent']]);
  assert.match(seen[0].text, /连续失败 6 次/);
  // The same request id must never stand for two different messages.
  assert.equal(seen[1].text, seen[0].text);
  assert.equal(seen[1].idempotencyKey, seen[0].idempotencyKey);
});

// A state database in which everything works except one table.
const without = (db, table) => ({
  exec: (sql) => { if (sql.includes(table)) throw new Error('disk'); return db.exec(sql); },
  prepare: (sql) => { if (sql.includes(table)) throw new Error('disk'); return db.prepare(sql); },
});
const storeWithout = (table) => {
  const store = new JobStore(':memory:');
  return { store, jobs: { claimHealthAlert: (...args) => store.claimHealthAlert(...args), markHealthAlert: (...args) => store.markHealthAlert(...args),
    healthAlertState: (...args) => store.healthAlertState(...args), isHealthAlertSent: (...args) => store.isHealthAlertSent(...args), db: without(store.db, table) } };
};

test('a text that cannot be kept does not hold the message back', async () => {
  const { jobs } = storeWithout('alert_texts');
  const seen = [];
  const runtime = { jobs, opsChatId: 'oc_ops', reportChatId: 'oc_group', config: {}, sleep: async () => {}, sendOpsHealth: async (message) => { seen.push(message); } };
  assert.deepEqual((await captureReports(runtime, { now: new Date('2026-09-29T18:50:00Z'), jobs: [job()] })).map((r) => r.status), ['sent']);
  assert.match(seen[0].text, /^【短剧数据采集日报】/);
});

test('no other chat is tried unless the reroute is on record', async () => {
  const { store, jobs } = storeWithout('alert_routes');
  const seen = [];
  let refusing = true;
  const runtime = { jobs, opsChatId: 'oc_ops', reportChatId: 'oc_group', config: {}, sleep: async () => {},
    sendOpsHealth: async (message) => { seen.push(message); if (refusing && message.chatId === 'oc_group') throw refusal(); } };
  const at = { now: new Date('2026-09-29T18:50:00Z'), jobs: [job()] };
  // Whether the message was rerouted before cannot be read, so it is not sent anywhere.
  assert.deepEqual((await captureReports(runtime, at)).map((r) => [r.status, r.error?.code]), [['failed', 'alert_route_unavailable']]);
  assert.deepEqual(seen, []);
  // The route can be read but not written: the refusal stands and the ops chat is not tried.
  jobs.db = { exec: (sql) => store.db.exec(sql), prepare: (sql) => { if (/INSERT INTO alert_routes/.test(sql)) throw new Error('disk'); return store.db.prepare(sql); } };
  assert.deepEqual((await captureReports(runtime, { ...at, now: new Date('2026-09-29T18:55:00Z') })).map((r) => [r.status, r.error?.code]), [['failed', 'notification_target_refused']]);
  assert.deepEqual(seen.map((m) => m.chatId), ['oc_group']);
  refusing = false;
  assert.deepEqual((await captureReports(runtime, { ...at, now: new Date('2026-09-29T19:00:00Z') })).map((r) => [r.status, r.fallback]), [['sent', undefined]]);
  assert.deepEqual(seen.map((m) => m.chatId), ['oc_group', 'oc_group']);
});

test('only the issues the delivered alert listed are marked as reported', async () => {
  const store = new JobStore(':memory:');
  const issue = (id) => ({ key: `account_deleted:${id}`, kind: 'account_deleted', detail: { account_record_id: id, captures: 2, releases: 1 } });
  recordIntegrityIssues(store.db, [], { now: '2026-09-29T00:00:00Z' });
  recordIntegrityIssues(store.db, [issue('recA')], { now: '2026-09-30T01:00:00Z' });
  const seen = [];
  let healthy = false;
  const runtime = { jobs: store, opsChatId: 'oc_ops', config: {}, sleep: async () => {},
    sendOpsHealth: async (message) => { seen.push(message.text); if (!healthy) throw new Error('reply lost'); } };
  const check = (now, date) => pipelineHealthAlerts(runtime, { now: new Date(now), date, jobs: [] });
  assert.deepEqual((await check('2026-09-30T02:00:00Z', '2026-09-30')).map((a) => [a.kind, a.status]), [['ledger-integrity', 'failed']]);
  // Before the alert is sent again the first issue is repaired and another one turns up.
  recordIntegrityIssues(store.db, [issue('recB')], { now: '2026-09-30T02:03:00Z' });
  healthy = true;
  assert.deepEqual((await check('2026-09-30T02:05:00Z', '2026-09-30')).map((a) => [a.kind, a.status]), [['ledger-integrity', 'sent']]);
  assert.equal(seen[1], seen[0]);
  assert.match(seen[1], /recA/);
  // What went out named the first issue only; the new one is still owed.
  assert.deepEqual(pendingIntegrityIssues(store.db).map((pending) => pending.key), ['account_deleted:recB']);
  assert.deepEqual((await check('2026-10-01T02:05:00Z', '2026-10-01')).map((a) => [a.kind, a.status]), [['ledger-integrity', 'sent']]);
  assert.match(seen[2], /recB/);
  assert.deepEqual(pendingIntegrityIssues(store.db), []);
});

test('an alert that is kept for a later attempt says when it was written', async () => {
  await withSummaries({ '2026-09-30': summary() }, async (dir) => {
    const store = new JobStore(':memory:');
    for (let i = 0; i < 6; i += 1) recordDrainOutcome(store.db, { ok: false, error: { code: 'x' } });
    recordIntegrityIssues(store.db, [], { now: '2026-09-29T00:00:00Z' });
    recordIntegrityIssues(store.db, [{ key: 'account_deleted:recA', kind: 'account_deleted', detail: { account_record_id: 'recA', captures: 2, releases: 1 } }], { now: '2026-09-30T01:00:00Z' });
    const seen = [];
    const runtime = { jobs: store, opsChatId: 'oc_ops', config: { paths: { collectorSummaryDir: dir } }, sleep: async () => {}, sendOpsHealth: async (message) => { seen.push(message.text); } };
    const sent = await pipelineHealthAlerts(runtime, { now: new Date('2026-09-30T02:00:00Z'), date: '2026-09-30', jobs: [job()] });
    assert.deepEqual(sent.map((a) => [a.kind, a.status]), [['capture-incomplete', 'sent'], ['drain-failing', 'sent'], ['ledger-integrity', 'sent']]);
    for (const text of seen) assert.match(text, /\n发现时间：2026-09-30 10:00（北京时间）(\n|$)/, text.split('\n')[0]);
  });
});

test('a reroute that fails is recorded with what the ops chat answered', async () => {
  for (const [ops, expected] of [[unanswered, 'notification_delivery_failed'], [refusal, 'notification_target_refused']]) {
    const runtime = { jobs: new JobStore(':memory:'), opsChatId: 'oc_ops', reportChatId: 'oc_group', config: {}, sleep: async () => {},
      sendOpsHealth: async (message) => { throw message.chatId === 'oc_group' ? Object.assign(new Error('denied'), { code: 'notification_target_denied' }) : ops(); } };
    const result = await captureReports(runtime, { now: new Date('2026-09-29T18:50:00Z'), jobs: [job()] });
    assert.deepEqual(result.map((r) => [r.status, r.error?.code]), [['failed', expected]]);
  }
});



test('an answer that does not prove a refusal is retried on the same chat', async () => {
  const seen = [];
  let healthy = false;
  const runtime = { jobs: new JobStore(':memory:'), opsChatId: 'oc_ops', reportChatId: 'oc_group', config: {}, sleep: async () => {},
    sendOpsHealth: async (message) => { seen.push(message); if (!healthy) throw unanswered(); } };
  const at = { now: new Date('2026-09-29T18:50:00Z'), jobs: [job()] };
  assert.deepEqual((await captureReports(runtime, at)).map((r) => [r.status, r.error?.code]), [['failed', 'notification_delivery_failed']]);
  healthy = true;
  assert.deepEqual((await captureReports(runtime, at)).map((r) => [r.status, r.fallback]), [['sent', undefined]]);
  assert.deepEqual(seen.map((m) => m.chatId), ['oc_group', 'oc_group']);
  assert.equal(seen[0].idempotencyKey, seen[1].idempotencyKey);
});

test('a rerouted message stays with the ops chat until its delivery is known', async () => {
  const seen = [];
  let opsAnswers = false;
  const runtime = { jobs: new JobStore(':memory:'), opsChatId: 'oc_ops', reportChatId: 'oc_group', config: {}, sleep: async () => {},
    sendOpsHealth: async (message) => {
      seen.push(message);
      // The group refuses once and works again afterwards.
      if (message.chatId === 'oc_group' && seen.length === 1) throw refusal();
      if (message.chatId === 'oc_ops' && !opsAnswers) throw new Error('reply lost');
    } };
  const at = { now: new Date('2026-09-29T18:50:00Z'), jobs: [job()] };
  assert.deepEqual((await captureReports(runtime, at)).map((r) => r.status), ['failed']);
  opsAnswers = true;
  assert.deepEqual((await captureReports(runtime, { ...at, now: new Date('2026-09-29T18:55:00Z') })).map((r) => [r.status, r.fallback]), [['sent', true]]);
  // The ops chat may already have the message, so the group must not get it as well.
  assert.deepEqual(seen.map((m) => m.chatId), ['oc_group', 'oc_ops', 'oc_ops']);
  assert.equal(seen[1].idempotencyKey, seen[2].idempotencyKey);
  assert.equal(seen[1].text, seen[2].text);
});

test('a reroute the ops chat refuses as well starts over with the group', async () => {
  const seen = [];
  let healthy = false;
  const runtime = { jobs: new JobStore(':memory:'), opsChatId: 'oc_ops', reportChatId: 'oc_group', config: {}, sleep: async () => {},
    sendOpsHealth: async (message) => { seen.push(message); if (!healthy) throw refusal(); } };
  const at = { now: new Date('2026-09-29T18:50:00Z'), jobs: [job()] };
  assert.deepEqual((await captureReports(runtime, at)).map((r) => r.status), ['failed']);
  healthy = true;
  assert.deepEqual((await captureReports(runtime, { ...at, now: new Date('2026-09-29T18:55:00Z') })).map((r) => [r.status, r.fallback]), [['sent', undefined]]);
  assert.deepEqual(seen.map((m) => m.chatId), ['oc_group', 'oc_ops', 'oc_group']);
});

test('the Feishu sender tells a chat that refuses the message from an answer that proves nothing', async (t) => {
  const answers = [];
  t.mock.method(globalThis, 'fetch', async () => { const { status, body } = answers.shift(); return new Response(JSON.stringify(body), { status }); });
  const send = createFeishuMessageSender({ tokenProvider: async () => 'token', isChatAllowed: () => true });
  const codeOf = async (status, body) => {
    answers.push({ status, body });
    try { await send({ chatId: 'oc', text: 'x' }); return 'delivered'; } catch (error) { return error.code; }
  };
  // The bot is not in the chat, may not speak there, or the chat was dissolved.
  for (const code of [230002, 230035, 232009]) assert.equal(await codeOf(400, { code }), 'notification_target_refused', String(code));
  // Rate limits, server errors and malformed answers leave the outcome open.
  assert.equal(await codeOf(400, { code: 230020 }), 'notification_delivery_failed');
  assert.equal(await codeOf(429, { code: 99991400 }), 'notification_delivery_failed');
  assert.equal(await codeOf(429, { code: 230002 }), 'notification_delivery_failed');
  for (const status of [500, 502, 504]) assert.equal(await codeOf(status, { code: 230002 }), 'notification_delivery_failed', String(status));
  assert.equal(await codeOf(200, {}), 'notification_delivery_failed');
  assert.equal(await codeOf(200, { code: '230002' }), 'notification_delivery_failed');
  assert.equal(await codeOf(200, { code: 0 }), 'delivered');
});

test('the Feishu sender classifies the answer of an injected transport the same way', async () => {
  const codeOf = async (result) => {
    const send = createFeishuMessageSender({ tokenProvider: async () => 'token', isChatAllowed: () => true, fetchJson: async () => result });
    try { await send({ chatId: 'oc', text: 'x' }); return 'delivered'; } catch (error) { return error.code; }
  };
  assert.equal(await codeOf({ code: 230002 }), 'notification_target_refused');
  assert.equal(await codeOf({ code: 230020 }), 'notification_delivery_failed');
  assert.equal(await codeOf(null), 'notification_delivery_failed');
});

test('a delivery that is still open is finished even for a run from before reporting was switched on', async () => {
  const sent = [];
  const store = new JobStore(':memory:');
  const key = 'capture-report:SDRUN-20260930-001248';
  store.claimHealthAlert(key, { ownerId: 'o', now: '2026-09-29T18:50:00Z' });
  store.markHealthAlert(key, 'failed', { ownerId: 'o', now: '2026-09-29T18:50:01Z', error: 'notification_delivery_failed' });
  assert.equal(store.healthAlertState(key), 'failed');
  assert.equal(store.healthAlertState('capture-report:SDRUN-20260930-999999'), null);
  const runtime = { jobs: store, opsChatId: 'oc_ops', config: {}, sendOpsHealth: async (message) => { sent.push(message); } };
  // First check 14 hours after the run ended: older than the grace period, but owed.
  assert.deepEqual((await captureReports(runtime, { now: new Date('2026-09-30T08:47:17Z'), jobs: [job()] })).map((r) => r.status), ['sent']);
  assert.equal(store.healthAlertState(key), 'sent');
});

test('the missing-run alert is rerouted like every other alert and reported as trouble', async () => {
  const sent = [];
  const store = new JobStore(':memory:');
  const jobs = { listByBeijingDate: () => [], claimHealthAlert: (...args) => store.claimHealthAlert(...args), markHealthAlert: (...args) => store.markHealthAlert(...args),
    isHealthAlertSent: (...args) => store.isHealthAlertSent(...args), healthAlertState: (...args) => store.healthAlertState(...args), db: store.db };
  const dispatch = createDispatcher({ jobs, now: () => new Date('2026-09-01T04:00:00Z'), opsChatId: 'oc_ops', reportChatId: 'oc_group',
    config: { schedule: { captureHour: 0, captureMinute: 10, healthHour: 2, healthMinute: 10 } },
    sendOpsHealth: async (message) => { if (message.chatId === 'oc_group') throw Object.assign(new Error('refused'), { code: 'notification_target_refused' }); sent.push(message); } });
  const result = await dispatch(parseCommand(['schedule', 'health']), { mode: 'internal' }, null);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].chatId, 'oc_ops');
  assert.match(sent[0].text, /^（通知群发送失败，改发到本会话）\n【短剧采集告警】/);
  assert.match(sent[0].idempotencyKey, /^[0-9a-f]{40}$/);
  assert.equal(store.healthAlertState('missing-terminal:2026-09-01'), 'sent');
  assert.equal(result.status, 'partial');
});

test('a sent alert does not hide a report that failed', async () => {
  await withSummaries({ '2026-09-30': summary() }, async (dir) => {
    const store = new JobStore(':memory:');
    for (let i = 0; i < 6; i += 1) recordDrainOutcome(store.db, { ok: false, error: { code: 'x' } });
    const jobs = { listByBeijingDate: (date) => (date === '2026-09-30' ? [job()] : []),
      claimHealthAlert: (...args) => store.claimHealthAlert(...args), markHealthAlert: (...args) => store.markHealthAlert(...args),
      isHealthAlertSent: (...args) => store.isHealthAlertSent(...args), healthAlertState: (...args) => store.healthAlertState(...args), db: store.db };
    const dispatch = createDispatcher({ jobs, now: () => new Date('2026-09-29T18:50:00Z'), opsChatId: 'oc_ops', sleep: async () => {},
      config: { schedule: { captureHour: 0, captureMinute: 10, healthHour: 2, healthMinute: 10 }, paths: { collectorSummaryDir: dir } },
      sendOpsHealth: async (message) => { if (/采集日报/.test(message.text)) throw new Error('timeout'); } });
    const result = await dispatch(parseCommand(['schedule', 'health']), { mode: 'internal' }, null);
    assert.deepEqual(result.reports.map((r) => r.status), ['failed']);
    assert.ok(result.alerts.some((a) => a.kind === 'drain-failing' && a.status === 'sent'));
    assert.equal(result.status, 'partial');
    assert.equal(exitCodeFor(result), 2);
  });
});

test('a step with very many different causes names the main ones and sums up the rest', () => {
  const errors = Array.from({ length: 40 }, (_, i) => Array.from({ length: 40 - i }, () => ({ step: 'release_links', code: `cause_${String(i).padStart(2, '0')}` }))).flat();
  const text = buildCaptureReport({ job: job({ error: { code: 'sync_partial', errors } }), summary: summary() });
  assert.match(text, /发布记录关联问题 820 条：cause_00 40 条；cause_01 39 条；/);
  assert.match(text, /cause_05 35 条；其余 34 种原因共 595 条/);
  assert.doesNotMatch(text, /cause_06/);
});

test('the Feishu sender passes the request id on and leaves it out when there is none', async () => {
  const bodies = [];
  const send = createFeishuMessageSender({ tokenProvider: async () => 'token', isChatAllowed: () => true,
    fetchJson: async (url, options) => { bodies.push(JSON.parse(options.body)); return { code: 0 }; } });
  await send({ chatId: 'oc', text: 'x', idempotencyKey: 'a'.repeat(40) });
  await send({ chatId: 'oc', text: 'x' });
  assert.equal(bodies[0].uuid, 'a'.repeat(40));
  assert.equal(Object.hasOwn(bodies[1], 'uuid'), false);
  await assert.rejects(send({ chatId: 'oc', text: 'x', idempotencyKey: 'x'.repeat(51) }), (error) => error.code === 'notification_target_denied');
});
