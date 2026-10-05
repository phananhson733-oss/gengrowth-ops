import assert from 'node:assert/strict';
import test from 'node:test';
import { JobStore } from '../src/job-store.mjs';
import { captureSlots, retryDeadlineOfRun, slotAt, slotOfRun, nextCaptureAfter } from '../src/schedule-slots.mjs';
import { buildCaptureReport } from '../src/capture-report.mjs';
import { loadRuntimeConfig } from '../src/config.mjs';
import { startSyncJob } from '../src/sync-runner.mjs';
import { captureReports, createDispatcher, evaluateDailyHealth, evaluateDueSlots, exitCodeFor, parseCommand, shouldEnqueueSchedule } from '../shortdrama_ctl.mjs';

const once = { captureHour: 0, captureMinute: 10, healthHour: 2, healthMinute: 10 };
const twice = { ...once, extraCaptures: [{ hour: 16, minute: 8 }] };
// Beijing time of day on 2026-09-30, given as the instant it is.
const at = (time) => new Date(`2026-09-30T${time}:00+08:00`);
const scheduled = (runId, state, extra = {}) => ({ run_id: runId, trigger: 'schedule', state, beijing_date: '2026-09-30', ...extra });

test('a day has one capture slot, or more when extra captures are configured', () => {
  assert.deepEqual(captureSlots(once).map((slot) => [slot.index, slot.label, slot.minutes, slot.healthMinutes]), [[0, '00:10', 10, 130]]);
  assert.deepEqual(captureSlots(twice).map((slot) => [slot.index, slot.label, slot.minutes, slot.healthMinutes]), [[0, '00:10', 10, 130], [1, '16:08', 968, 1088]]);
  // Defaults of a config without a schedule.
  assert.deepEqual(captureSlots({}).map((slot) => [slot.label, slot.healthMinutes]), [['08:00', 600]]);
  assert.equal(slotAt(twice, 9), null);
  assert.equal(slotAt(twice, 10).index, 0);
  assert.equal(slotAt(twice, 967).index, 0);
  assert.equal(slotAt(twice, 968).index, 1);
  assert.equal(slotAt(twice, 1439).index, 1);
});

test('a run belongs to the slot it started in', () => {
  assert.equal(slotOfRun(twice, { run_id: 'SDRUN-20260930-001248' }).index, 0);
  assert.equal(slotOfRun(twice, { run_id: 'SDRUN-20260930-160759' }).index, 0);
  assert.equal(slotOfRun(twice, { run_id: 'SDRUN-20260930-160800' }).index, 1);
  // A run started before the first slot of its day (a manual state, a clock change) counts for the first one.
  assert.equal(slotOfRun(twice, { run_id: 'SDRUN-20260930-000500' }).index, 0);
  // Without a usable run id every run of the day counts for the first slot, as before.
  assert.equal(slotOfRun(twice, { state: 'failed' }).index, 0);
  assert.equal(slotOfRun(once, { run_id: 'SDRUN-20260930-230000' }).index, 0);
});

test('the capture after a run is the next slot of the day, or the first one of the next day', () => {
  const next = (schedule, iso) => new Date(nextCaptureAfter(schedule, Date.parse(iso))).toISOString();
  assert.equal(next(twice, '2026-09-30T00:20:00+08:00'), '2026-09-30T08:08:00.000Z');
  assert.equal(next(twice, '2026-09-30T16:08:00+08:00'), '2026-09-30T16:10:00.000Z');
  assert.equal(next(twice, '2026-09-30T23:59:00+08:00'), '2026-09-30T16:10:00.000Z');
  assert.equal(next(once, '2026-09-30T00:20:00+08:00'), '2026-09-30T16:10:00.000Z');
  assert.equal(next(once, '2026-09-30T00:05:00+08:00'), '2026-09-29T16:10:00.000Z');
});

test('the second capture of the day is enqueued at its time, whatever the first one did', () => {
  for (const state of ['success', 'partial', 'failed']) {
    const morning = [scheduled('SDRUN-20260930-001248', state, { finished_at: '2026-09-29T18:47:17Z' })];
    assert.equal(shouldEnqueueSchedule(at('16:07'), morning, twice), state === 'failed', state);
    assert.equal(shouldEnqueueSchedule(at('16:08'), morning, twice), true, state);
  }
  // Without the extra capture nothing changes for a day that has its run.
  assert.equal(shouldEnqueueSchedule(at('16:08'), [scheduled('SDRUN-20260930-001248', 'success')], once), false);
  assert.equal(shouldEnqueueSchedule(at('00:09'), [], twice), false);
  assert.equal(shouldEnqueueSchedule(at('00:10'), [], twice), true);
  // A machine that was off all morning runs once when it is back, not twice.
  assert.equal(shouldEnqueueSchedule(at('17:00'), [], twice), true);
  assert.equal(shouldEnqueueSchedule(at('17:05'), [scheduled('SDRUN-20260930-170000', 'running')], twice), false);
});

test('each slot has its own bounded retries', () => {
  const failed = (runId, finished) => scheduled(runId, 'failed', { finished_at: finished });
  const morning = [failed('SDRUN-20260930-001000', '2026-09-29T16:11:00Z'), failed('SDRUN-20260930-004500', '2026-09-29T16:46:00Z'), failed('SDRUN-20260930-012000', '2026-09-29T17:21:00Z')];
  // Three failures in the morning exhaust the morning, not the afternoon.
  assert.equal(shouldEnqueueSchedule(at('10:00'), morning, twice), false);
  assert.equal(shouldEnqueueSchedule(at('16:08'), morning, twice), true);
  const afternoon = [...morning, failed('SDRUN-20260930-160800', '2026-09-30T08:20:00Z')];
  assert.equal(shouldEnqueueSchedule(at('16:49'), afternoon, twice), false);
  assert.equal(shouldEnqueueSchedule(at('16:50'), afternoon, twice), true);
  const spent = [...afternoon, failed('SDRUN-20260930-165000', '2026-09-30T08:55:00Z'), failed('SDRUN-20260930-172500', '2026-09-30T09:30:00Z')];
  assert.equal(shouldEnqueueSchedule(at('20:00'), spent, twice), false);
  // A usable afternoon run ends the afternoon.
  assert.equal(shouldEnqueueSchedule(at('20:00'), [...afternoon, scheduled('SDRUN-20260930-165000', 'partial')], twice), false);
});

test('the job store applies the same rules per slot inside the enqueue', () => {
  const store = new JobStore(':memory:');
  const enqueue = (runId, now, slotStart) => store.enqueueIfIdle({ runId, trigger: 'schedule', now, ...(slotStart ? { slotStart } : {}) });
  const finish = (runId, state, finishedAt) => store.db.prepare('UPDATE jobs SET state=?, step=?, finished_at=? WHERE run_id=?').run(state, state, finishedAt, runId);
  assert.equal(enqueue('SDRUN-20260930-001000', '2026-09-29T16:10:00Z', '001000').created, true);
  finish('SDRUN-20260930-001000', 'partial', '2026-09-29T18:40:00Z');
  // Same slot: the day's usable run stands.
  const again = enqueue('SDRUN-20260930-100000', '2026-09-30T02:00:00Z', '001000');
  assert.equal(again.created, false);
  assert.equal(again.job.run_id, 'SDRUN-20260930-001000');
  // Next slot: a new run.
  assert.equal(enqueue('SDRUN-20260930-160800', '2026-09-30T08:08:00Z', '160800').created, true);
  assert.equal(enqueue('SDRUN-20260930-161300', '2026-09-30T08:13:00Z', '160800').created, false); // still active
  finish('SDRUN-20260930-160800', 'failed', '2026-09-30T08:20:00Z');
  assert.equal(enqueue('SDRUN-20260930-164900', '2026-09-30T08:49:00Z', '160800').created, false); // cooling down
  assert.equal(enqueue('SDRUN-20260930-165000', '2026-09-30T08:50:00Z', '160800').created, true);
  finish('SDRUN-20260930-165000', 'failed', '2026-09-30T08:55:00Z');
  assert.equal(enqueue('SDRUN-20260930-172500', '2026-09-30T09:25:00Z', '160800').created, true);
  finish('SDRUN-20260930-172500', 'failed', '2026-09-30T09:30:00Z');
  const capped = enqueue('SDRUN-20260930-180000', '2026-09-30T10:00:00Z', '160800');
  assert.equal(capped.created, false);
  assert.equal(capped.job.run_id, 'SDRUN-20260930-172500');
  // Without a slot the whole day is one slot, as before.
  assert.equal(enqueue('SDRUN-20260930-230000', '2026-09-30T15:00:00Z').created, false);
  for (const bad of ['1608', '246000', '16:08:00', 160800]) {
    assert.throws(() => store.enqueueIfIdle({ runId: 'SDRUN-20260930-233000', trigger: 'schedule', now: '2026-09-30T15:30:00Z', slotStart: bad }), (error) => error.code === 'state_store_input_invalid', String(bad));
  }
});

test('a scheduled start carries its slot to the job store', async () => {
  const seen = [];
  const context = { jobs: { enqueueIfIdle: (request) => { seen.push(request); return { created: true, job: { run_id: request.runId } }; } },
    makeRunId: () => 'SDRUN-20260930-160800', wakeWorker: async () => {}, now: () => at('16:08') };
  await startSyncJob(context, { trigger: 'schedule', chatId: 'oc_ops', beijingDate: '2026-09-30', slotStart: '160800' });
  assert.equal(seen[0].slotStart, '160800');
  await startSyncJob(context, { trigger: 'schedule', chatId: 'oc_ops', beijingDate: '2026-09-30' });
  assert.equal(Object.hasOwn(seen[1], 'slotStart'), false);
  await assert.rejects(startSyncJob(context, { trigger: 'schedule', chatId: 'oc_ops', beijingDate: '2026-09-30', slotStart: '16:08' }), (error) => error.code === 'sync_request_invalid');
  await assert.rejects(startSyncJob(context, { trigger: 'manual', actorId: 'ou_a', chatId: 'oc_ops', slotStart: '160800' }), (error) => error.code === 'sync_request_invalid');
});

test('schedule tick starts the afternoon capture in its own slot', async () => {
  const started = [];
  const store = { listByBeijingDate: () => [{ run_id: 'SDRUN-20260930-001248', trigger: 'schedule', state: 'partial' }],
    peekSequenceState: () => ({ seeded: true }) };
  const runtime = { jobs: store, now: () => at('16:08'), opsChatId: 'oc_ops', config: { schedule: twice }, assertRuntimeSchemaReady: async () => {},
    syncContext: { jobs: { enqueueIfIdle: (request) => { started.push(request); return { created: true, job: { run_id: request.runId } }; } },
      makeRunId: () => 'SDRUN-20260930-160800', wakeWorker: async () => {}, now: () => at('16:08') } };
  const result = await createDispatcher(runtime)(parseCommand(['schedule', 'tick']), { mode: 'internal' }, null);
  assert.equal(result.state, 'queued');
  assert.equal(started[0].slotStart, '160800');
  assert.equal(started[0].trigger, 'schedule');
  const before = await createDispatcher({ ...runtime, now: () => at('16:07') })(parseCommand(['schedule', 'tick']), { mode: 'internal' }, null);
  assert.equal(before.status, 'no_op');
  assert.equal(started.length, 1);
});

test('health checks the slot whose deadline has passed', () => {
  const morning = [scheduled('SDRUN-20260930-001248', 'partial')];
  assert.equal(evaluateDailyHealth(at('02:09'), [], twice).reason, 'before_health_window');
  assert.equal(evaluateDailyHealth(at('02:10'), [], twice).reason, 'missing_terminal');
  assert.deepEqual(evaluateDailyHealth(at('18:07'), morning, twice), { alert: false, reason: 'terminal_present' });
  // The morning's result does not stand in for the afternoon.
  const missing = evaluateDailyHealth(at('18:08'), morning, twice);
  assert.equal(missing.alert, true);
  assert.equal(missing.reason, 'missing_terminal');
  assert.equal(missing.slot, '16:08');
  assert.equal(evaluateDailyHealth(at('18:08'), [...morning, scheduled('SDRUN-20260930-160800', 'failed')], twice).reason, 'failed_terminal');
  assert.equal(evaluateDailyHealth(at('18:08'), [...morning, scheduled('SDRUN-20260930-160800', 'success')], twice).reason, 'terminal_present');
  // With one capture a day the result has no slot and the day is judged as a whole.
  assert.deepEqual(evaluateDailyHealth(at('18:08'), morning, once), { alert: false, reason: 'terminal_present' });
});

test('a missing afternoon capture is alerted once, separately from the morning', async () => {
  const store = new JobStore(':memory:');
  const sent = [];
  const jobs = { listByBeijingDate: (date) => (date === '2026-09-30' ? [{ run_id: 'SDRUN-20260930-001248', trigger: 'schedule', state: 'partial', finished_at: '2026-09-29T18:47:17Z', started_at: '2026-09-29T16:12:48Z' }] : []),
    claimHealthAlert: (...args) => store.claimHealthAlert(...args), markHealthAlert: (...args) => store.markHealthAlert(...args),
    isHealthAlertSent: (...args) => store.isHealthAlertSent(...args), healthAlertState: (...args) => store.healthAlertState(...args), db: store.db };
  store.claimHealthAlert('missing-terminal:2026-09-30', { ownerId: 'o', now: '2026-09-29T18:10:00Z' });
  store.markHealthAlert('missing-terminal:2026-09-30', 'sent', { ownerId: 'o', now: '2026-09-29T18:10:01Z' });
  store.claimHealthAlert('capture-report:SDRUN-20260930-001248', { ownerId: 'o', now: '2026-09-29T18:50:00Z' });
  store.markHealthAlert('capture-report:SDRUN-20260930-001248', 'sent', { ownerId: 'o', now: '2026-09-29T18:50:01Z' });
  const dispatch = createDispatcher({ jobs, now: () => at('18:10'), opsChatId: 'oc_ops', reportChatId: 'oc_group', config: { schedule: twice }, sendOpsHealth: async (message) => { sent.push(message); } });
  const result = await dispatch(parseCommand(['schedule', 'health']), { mode: 'internal' }, null);
  assert.equal(result.status, 'alerted');
  assert.equal(sent.length, 1);
  assert.match(sent[0].text, /^【短剧采集告警】2026-09-30 16:08 的采集还没有可用结果/);
  assert.equal(store.healthAlertState('missing-terminal:2026-09-30@1608'), 'sent');
  assert.equal((await dispatch(parseCommand(['schedule', 'health']), { mode: 'internal' }, null)).reason, 'alert_already_claimed');
  assert.equal(sent.length, 1);
  for (const key of ['missing-terminal:2026-09-30@16:08', 'missing-terminal:2026-09-30@160', 'drain-failing:2026-09-30@1608']) {
    assert.throws(() => store.claimHealthAlert(key, { ownerId: 'o', now: '2026-09-30T10:10:00Z' }), (error) => error.code === 'health_alert_key_invalid', key);
  }
});

test('reports count attempts and promise retries within the slot of the run', async () => {
  const sent = [];
  const runtime = { jobs: new JobStore(':memory:'), opsChatId: 'oc_ops', config: { schedule: twice }, sendOpsHealth: async (message) => { sent.push(message.text); } };
  const morning = { run_id: 'SDRUN-20260930-001248', trigger: 'schedule', state: 'partial', started_at: '2026-09-29T16:12:48Z', finished_at: '2026-09-29T18:47:17Z', counters: {}, error: {} };
  const afternoon = { run_id: 'SDRUN-20260930-160800', trigger: 'schedule', state: 'failed', started_at: '2026-09-30T08:08:00Z', finished_at: '2026-09-30T08:20:00Z', counters: {}, error: { code: 'capture_failed' } };
  await captureReports(runtime, { now: at('16:25'), jobs: [morning, afternoon] });
  const report = sent.find((text) => /结果：失败/.test(text));
  // The first attempt of the afternoon, although it is the second run of the day.
  assert.doesNotMatch(report, /本次为补跑/);
  assert.match(report, /后续：按规则自动补跑，最早 16:50、最晚 24:00 前开始（本时段第 1 次尝试，最多 3 次）；补跑结果另发日报/);
});

test('a retry that could only start after its slot has ended is not announced', () => {
  const failed = { run_id: 'SDRUN-20260930-154500', trigger: 'schedule', state: 'failed', started_at: '2026-09-30T07:45:00Z', finished_at: '2026-09-30T07:50:00Z', counters: {}, error: { code: 'capture_failed' } };
  const limits = { retryDeadline: Date.parse('2026-09-30T08:08:00Z'), nextCaptureAt: Date.parse('2026-09-30T08:08:00Z'), scope: '本时段' };
  const text = buildCaptureReport({ job: failed, attempt: 2, ...limits });
  assert.match(text, /本次为补跑（本时段第 2 次尝试）/);
  assert.doesNotMatch(text, /自动补跑/);
  assert.match(text, /后续：本时段不再补跑，接下来是 16:08 的采集/);
  const room = buildCaptureReport({ job: { ...failed, run_id: 'SDRUN-20260930-001000', started_at: '2026-09-29T16:10:00Z', finished_at: '2026-09-29T16:20:00Z' }, attempt: 1, ...limits });
  assert.match(room, /后续：按规则自动补跑，最早 00:50、最晚 16:08 前开始（本时段第 1 次尝试，最多 3 次）/);
});

test('a retry has to start before the next capture time and before midnight', () => {
  const end = (schedule, runId) => new Date(retryDeadlineOfRun(schedule, { run_id: runId })).toISOString();
  assert.equal(end(twice, 'SDRUN-20260930-001248'), '2026-09-30T08:08:00.000Z');
  assert.equal(end(twice, 'SDRUN-20260930-150000'), '2026-09-30T08:08:00.000Z');
  // The last slot of the day ends with the day: no run is started between midnight and the first capture time.
  assert.equal(end(twice, 'SDRUN-20260930-160800'), '2026-09-30T16:00:00.000Z');
  assert.equal(end(once, 'SDRUN-20260930-001248'), '2026-09-30T16:00:00.000Z');
  assert.equal(retryDeadlineOfRun(twice, { state: 'failed' }), null);
});

test('every slot whose deadline has passed is judged, not only the latest', () => {
  const morning = [scheduled('SDRUN-20260930-001248', 'partial')];
  assert.deepEqual(evaluateDueSlots(at('02:09'), [], twice), []);
  // With several captures a day every gap is named after its slot, the first one too.
  assert.deepEqual(evaluateDueSlots(at('02:10'), [], twice), [{ alert: true, reason: 'missing_terminal', slot: '00:10' }]);
  assert.deepEqual(evaluateDueSlots(at('18:08'), morning, twice), [
    { alert: false, reason: 'terminal_present' }, { alert: true, reason: 'missing_terminal', slot: '16:08' }]);
  assert.deepEqual(evaluateDueSlots(at('18:08'), [], twice), [
    { alert: true, reason: 'missing_terminal', slot: '00:10' }, { alert: true, reason: 'missing_terminal', slot: '16:08' }]);
  // A later capture that delivered makes up for an earlier one that did not:
  // the data is fresh, there is nothing left to warn about.
  for (const state of ['success', 'partial']) {
    assert.deepEqual(evaluateDueSlots(at('18:08'), [scheduled('SDRUN-20260930-160800', state)], twice), [
      { alert: false, reason: 'superseded', slot: '00:10' }, { alert: false, reason: 'terminal_present' }], state);
    // Also before the check of the later slot is due.
    assert.deepEqual(evaluateDueSlots(at('17:30'), [scheduled('SDRUN-20260930-160800', state)], twice), [{ alert: false, reason: 'superseded', slot: '00:10' }], state);
  }
  assert.deepEqual(evaluateDueSlots(at('18:08'), [scheduled('SDRUN-20260930-160800', 'failed')], twice), [
    { alert: true, reason: 'missing_terminal', slot: '00:10' }, { alert: true, reason: 'failed_terminal', slot: '16:08' }]);
  // With one capture a day nothing is labelled.
  assert.deepEqual(evaluateDueSlots(at('18:08'), morning, once), [{ alert: false, reason: 'terminal_present' }]);
  assert.deepEqual(evaluateDueSlots(at('18:08'), [], once), [{ alert: true, reason: 'missing_terminal' }]);
});

const healthStore = (listed = []) => {
  const store = new JobStore(':memory:');
  return { store, jobs: { listByBeijingDate: (date) => (date === '2026-09-30' ? listed : []),
    claimHealthAlert: (...args) => store.claimHealthAlert(...args), markHealthAlert: (...args) => store.markHealthAlert(...args),
    isHealthAlertSent: (...args) => store.isHealthAlertSent(...args), healthAlertState: (...args) => store.healthAlertState(...args), db: store.db } };
};

test('a morning alert that could not be sent is still owed after the afternoon deadline', async () => {
  const { store, jobs } = healthStore();
  const sent = [];
  let healthy = false;
  const runtime = { jobs, opsChatId: 'oc_ops', config: { schedule: twice }, sleep: async () => {},
    sendOpsHealth: async (message) => { if (!healthy) throw Object.assign(new Error('down'), { code: 'notification_delivery_failed' }); sent.push(message); } };
  await assert.rejects(createDispatcher({ ...runtime, now: () => at('18:05') })(parseCommand(['schedule', 'health']), { mode: 'internal' }, null));
  assert.equal(store.healthAlertState('missing-terminal:2026-09-30'), 'failed');
  healthy = true;
  const result = await createDispatcher({ ...runtime, now: () => at('18:10') })(parseCommand(['schedule', 'health']), { mode: 'internal' }, null);
  assert.equal(store.healthAlertState('missing-terminal:2026-09-30'), 'sent');
  assert.equal(store.healthAlertState('missing-terminal:2026-09-30@1608'), 'sent');
  assert.equal(sent.length, 2);
  assert.match(sent[0].text, /^【短剧采集告警】2026-09-30 00:10 的采集还没有可用结果\n原因：这个时段没有启动采集任务/);
  assert.match(sent[1].text, /^【短剧采集告警】2026-09-30 16:08 的采集还没有可用结果/);
  assert.deepEqual(result.alerts.filter((alert) => alert.kind === 'missing-terminal').map((alert) => alert.status), ['sent']);
  // Nothing is repeated afterwards.
  await createDispatcher({ ...runtime, now: () => at('18:15') })(parseCommand(['schedule', 'health']), { mode: 'internal' }, null);
  assert.equal(sent.length, 2);
});

test('an earlier slot whose alert fails again is trouble of the health run', async () => {
  const { store, jobs } = healthStore([{ run_id: 'SDRUN-20260930-160800', trigger: 'schedule', state: 'running', step: 'collector', started_at: '2026-09-30T08:08:00Z' }]);
  const sent = [];
  const runtime = { jobs, opsChatId: 'oc_ops', config: { schedule: twice }, sleep: async () => {}, now: () => at('18:10'),
    sendOpsHealth: async (message) => { if (/00:10 的采集/.test(message.text)) throw Object.assign(new Error('down'), { code: 'notification_delivery_failed' }); sent.push(message); } };
  const result = await createDispatcher(runtime)(parseCommand(['schedule', 'health']), { mode: 'internal' }, null);
  assert.equal(store.healthAlertState('missing-terminal:2026-09-30'), 'failed');
  assert.equal(store.healthAlertState('missing-terminal:2026-09-30@1608'), 'sent');
  assert.match(sent[0].text, /采集任务仍在运行/);
  assert.equal(result.status, 'partial');
  assert.equal(exitCodeFor(result), 2);
});

test('a run that failed after its slot had ended promises no retry', async () => {
  const sent = [];
  const runtime = { jobs: new JobStore(':memory:'), opsChatId: 'oc_ops', config: { schedule: twice }, sendOpsHealth: async (message) => { sent.push(message.text); } };
  const late = { run_id: 'SDRUN-20260930-150000', trigger: 'schedule', state: 'failed', started_at: '2026-09-30T07:00:00Z', finished_at: '2026-09-30T09:00:00Z', counters: {}, error: { code: 'capture_failed' } };
  await captureReports(runtime, { now: at('17:01'), jobs: [late] });
  assert.equal(sent.length, 1);
  assert.doesNotMatch(sent[0], /自动补跑/);
  assert.match(sent[0], /后续：本时段不再补跑，接下来是 16:08 的采集/);
});

test('the report of a run reads the same before and after its slot has ended', async () => {
  const failed = { run_id: 'SDRUN-20260930-140000', trigger: 'schedule', state: 'failed', started_at: '2026-09-30T06:00:00Z', finished_at: '2026-09-30T07:00:00Z', counters: {}, error: { code: 'capture_failed' } };
  const afternoon = { run_id: 'SDRUN-20260930-160800', trigger: 'schedule', state: 'success', started_at: '2026-09-30T08:08:00Z', finished_at: '2026-09-30T09:00:00Z', counters: {}, error: {} };
  const written = async (now, jobs) => {
    const sent = [];
    const runtime = { jobs: new JobStore(':memory:'), opsChatId: 'oc_ops', config: { schedule: twice }, sendOpsHealth: async (message) => { sent.push(message.text); } };
    await captureReports(runtime, { now, jobs });
    return sent[0];
  };
  const atOnce = await written(at('15:01'), [failed]);
  assert.match(atOnce, /后续：按规则自动补跑，最早 15:30、最晚 16:08 前开始（本时段第 1 次尝试，最多 3 次）/);
  assert.equal(await written(at('17:01'), [failed, afternoon]), atOnce);
});

test('the first slot of several is named in its alert, under the key it always had', async () => {
  const { store, jobs } = healthStore();
  const sent = [];
  const runtime = { jobs, opsChatId: 'oc_ops', config: { schedule: twice }, sleep: async () => {}, now: () => at('02:10'), sendOpsHealth: async (message) => { sent.push(message); } };
  const result = await createDispatcher(runtime)(parseCommand(['schedule', 'health']), { mode: 'internal' }, null);
  assert.equal(result.status, 'alerted');
  assert.match(sent[0].text, /^【短剧采集告警】2026-09-30 00:10 的采集还没有可用结果\n原因：这个时段没有启动采集任务\n数据表里还是上一次采集的数据，请留意。$/);
  assert.equal(store.healthAlertState('missing-terminal:2026-09-30'), 'sent');
  // One capture a day keeps the wording of the whole day.
  const single = [];
  const daily = healthStore();
  await createDispatcher({ ...runtime, jobs: daily.jobs, config: { schedule: once }, sendOpsHealth: async (message) => { single.push(message); } })(parseCommand(['schedule', 'health']), { mode: 'internal' }, null);
  assert.match(single[0].text, /^【短剧采集告警】2026-09-30 今日采集还没有可用结果\n原因：今日没有启动采集任务/);
});

test('a morning that was missed is not alerted once the afternoon has delivered', async () => {
  const { store, jobs } = healthStore([{ run_id: 'SDRUN-20260930-160800', trigger: 'schedule', state: 'success', started_at: '2026-09-30T08:08:00Z', finished_at: '2026-09-30T09:00:00Z', counters: {}, error: {} }]);
  const sent = [];
  const runtime = { jobs, opsChatId: 'oc_ops', config: { schedule: twice }, sleep: async () => {}, now: () => at('18:10'), sendOpsHealth: async (message) => { sent.push(message.text); } };
  const result = await createDispatcher(runtime)(parseCommand(['schedule', 'health']), { mode: 'internal' }, null);
  assert.deepEqual(sent.filter((text) => /采集告警/.test(text)), []);
  assert.equal(sent.filter((text) => /采集日报/.test(text)).length, 1);
  assert.equal(store.healthAlertState('missing-terminal:2026-09-30'), null);
  assert.equal(result.status, 'reported');
});

const fixture = () => ({
  config: { schema_version: 'shortdrama/v1', timezone: 'Asia/Shanghai', source_spreadsheet_id: 'sheet',
    paths: { env_file: '.env', metrics_sqlite: 'metrics.sqlite', collector: 'collector.mjs', collector_summary_dir: 'summaries', ops_sqlite: 'ops.sqlite', payload_root: 'payloads' },
    base: { url: 'https://base.company.test/base', app_token_env: 'BASE', table_id_envs: { accounts: 'TA', dramas: 'TD', captures: 'TC', releases: 'TR' } },
    auth: { feishu_app_id_env: 'APP', feishu_app_secret_env: 'SECRET', google_service_account_path_env: 'GOOGLE', operator_ids_env: 'OPS', privileged_ids_env: 'ADMINS', notification_chat_ids_env: 'CHATS' },
    acceptance: { privileged_actor_id: 'ou_admin' }, schedule: { capture_hour: 0, capture_minute: 10, health_hour: 2, health_minute: 10 } },
  env: { BASE: 'base', TA: 'tbl-accounts', TD: 'tbl-dramas', TC: 'tbl-captures', TR: 'tbl-releases', APP: 'app', SECRET: 'secret', GOOGLE: '/safe/google.json', OPS: 'ou_operator', ADMINS: 'ou_admin', CHATS: 'oc_ops' },
});

test('extra capture times are configured as Beijing clock times after the first capture', () => {
  const { config, env } = fixture();
  assert.deepEqual(loadRuntimeConfig({ config, env }).schedule.extraCaptures, []);
  config.schedule.extra_capture_times = ['16:08'];
  assert.deepEqual(loadRuntimeConfig({ config, env }).schedule.extraCaptures, [{ hour: 16, minute: 8 }]);
  config.schedule.extra_capture_times = ['08:00', '16:08'];
  assert.deepEqual(loadRuntimeConfig({ config, env }).schedule.extraCaptures, [{ hour: 8, minute: 0 }, { hour: 16, minute: 8 }]);
  for (const bad of [['16:8'], ['24:00'], ['16:60'], ['16:08', '16:08'], ['16:08', '08:00'], ['00:10'], ['00:05'], '16:08', [1608], ['23:00'], ['01:00', '02:00', '03:00', '04:00', '05:00']]) {
    config.schedule.extra_capture_times = bad;
    assert.throws(() => loadRuntimeConfig({ config, env }), (error) => error.code === 'config_invalid', JSON.stringify(bad));
  }
});
