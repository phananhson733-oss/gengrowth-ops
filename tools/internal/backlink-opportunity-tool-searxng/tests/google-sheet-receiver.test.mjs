import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';

const RECEIVER_PATH = new URL('../google-sheet-receiver.gs', import.meta.url);

function makeSheet(initialRows = [], stats = { setValuesCalls: [] }) {
  const rows = initialRows.map((row) => [...row]);
  return {
    getLastRow: () => rows.length,
    getLastColumn: () => Math.max(0, ...rows.map((row) => row.length)),
    deleteRow(rowNumber) { rows.splice(rowNumber - 1, 1); },
    hideSheet() { return this; },
    getRange(row, column, height = 1, width = 1) {
      return {
        getValues: () => Array.from({ length: height }, (_, rowOffset) => Array.from({ length: width }, (_, columnOffset) => rows[row - 1 + rowOffset]?.[column - 1 + columnOffset] ?? '')),
        setValues(values) {
          stats.setValuesCalls.push({ row, column, height, width });
          values.forEach((valueRow, rowOffset) => {
            const target = rows[row - 1 + rowOffset] || [];
            valueRow.forEach((value, columnOffset) => { target[column - 1 + columnOffset] = value; });
            rows[row - 1 + rowOffset] = target;
          });
        },
      };
    },
  };
}

function loadReceiver({ taskRows = [], resultRows = [] } = {}) {
  const sheets = new Map();
  const sheetStats = new Map();
  const createSheet = (name, rows = []) => {
    const stats = { setValuesCalls: [] };
    sheetStats.set(name, stats);
    const sheet = makeSheet(rows, stats);
    sheets.set(name, sheet);
    return sheet;
  };
  if (taskRows.length) createSheet('任务记录', taskRows);
  if (resultRows.length) createSheet('_临时任务结果', resultRows);
  const properties = new Map();
  const context = {
    JSON,
    Date,
    String,
    Array,
    Object,
    Math,
    SpreadsheetApp: {
      openById: () => ({
        getSheetByName: (name) => sheets.get(name) || null,
        insertSheet: (name) => createSheet(name),
      }),
    },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    PropertiesService: { getScriptProperties: () => ({ getProperty: (key) => properties.get(key) || null, setProperty: (key, value) => properties.set(key, String(value)) }) },
    ContentService: { MimeType: { JSON: 'application/json' }, createTextOutput: (content) => ({ content, setMimeType() { return this; } }) },
  };
  vm.runInNewContext(readFileSync(RECEIVER_PATH, 'utf8'), context, { filename: 'google-sheet-receiver.gs' });
  context.SPREADSHEET_ID = 'test-sheet-id';
  context.SHEET_SHARED_SECRET = 'test-secret';
  return {
    post(payload) {
      const output = context.doPost({ postData: { contents: JSON.stringify(payload) } });
      return JSON.parse(output.content);
    },
    stats(name) {
      return sheetStats.get(name) || { setValuesCalls: [] };
    },
  };
}

const keywordJob = {
  mode: 'keyword',
  input: 'astrology',
  language: 'en',
  region: 'us',
  requestedLimit: 200,
  targetDomain: 'target.example',
};
const keywordRecord = { id: 'keyword-record', referring_page_url: 'https://example.com/opportunity', machine_status: 'qualified', sources: [{ mode: 'keyword', input: 'astrology', language: 'en', region: 'us' }] };
const competitorRecord = { id: 'competitor-record', referring_page_url: 'https://example.com/opportunity', machine_status: 'qualified', sources: [{ mode: 'competitor_search', input: 'astro.com' }] };

test('claimJob atomically returns one queued job and marks it running', () => {
  const receiver = loadReceiver();

  const created = receiver.post({ action: 'createJob', shared_secret: 'test-secret', job: keywordJob });
  const first = receiver.post({ action: 'claimJob', shared_secret: 'test-secret' });
  const second = receiver.post({ action: 'claimJob', shared_secret: 'test-secret' });

  assert.equal(created.ok, true);
  assert.equal(first.job.status, 'running');
  assert.equal(second.job, null);
});

test('createJob remains readable when the task sheet starts with legacy headers', () => {
  const receiver = loadReceiver({
    taskRows: [
      ['任务 ID', '模式', '输入', '接收数量', '可用数量', '淘汰数量', '创建时间'],
      ['run_legacy', 'keyword', 'astrologywiki', '100', '82', '3', '2026-07-22T08:45:07.258Z'],
    ],
  });

  const created = receiver.post({ action: 'createJob', shared_secret: 'test-secret', job: keywordJob });
  const fetched = receiver.post({ action: 'getJob', shared_secret: 'test-secret', jobId: created.job.id });

  assert.equal(created.ok, true);
  assert.equal(fetched.job.id, created.job.id);
  assert.equal(fetched.job.input, keywordJob.input);
});

test('upsertResources stores one canonical URL and exposes its sources in both views', () => {
  const receiver = loadReceiver();

  const result = receiver.post({ action: 'upsertResources', shared_secret: 'test-secret', records: [keywordRecord, competitorRecord] });
  const keyword = receiver.post({ action: 'listResources', shared_secret: 'test-secret', view: 'keyword' });
  const competitor = receiver.post({ action: 'listResources', shared_secret: 'test-secret', view: 'competitor' });

  assert.deepEqual(result.result, { created: 1, updated: 1, rejected: 0 });
  assert.equal(keyword.records.length, 1);
  assert.equal(competitor.records.length, 1);
  assert.equal(keyword.records[0].sources.length, 2);
});

test('importLegacyRuns writes a completed timestamp when a legacy run has none', () => {
  const receiver = loadReceiver();

  const imported = receiver.post({ action: 'importLegacyRuns', shared_secret: 'test-secret', records: [], runs: [{ run_id: 'legacy-run', mode: 'keyword', input: 'astrology', received_count: 3 }] });
  const job = receiver.post({ action: 'getJob', shared_secret: 'test-secret', jobId: 'legacy-run' });

  assert.equal(imported.result.importedRuns, 1);
  assert.match(job.job.completedAt, /^\d{4}-\d{2}-\d{2}T/);
});

test('new jobs retain a target domain and are marked ephemeral', () => {
  const receiver = loadReceiver();

  const created = receiver.post({
    action: 'createJob',
    shared_secret: 'test-secret',
    job: { ...keywordJob, targetDomain: 'target.example' },
  });

  assert.equal(created.ok, true);
  assert.equal(created.job.targetDomain, 'target.example');
  assert.equal(created.job.ephemeral, true);
});

test('temporary job results remain readable until ack and then disappear', () => {
  const receiver = loadReceiver();
  const created = receiver.post({
    action: 'createJob',
    shared_secret: 'test-secret',
    job: { ...keywordJob, targetDomain: 'target.example' },
  });
  receiver.post({ action: 'claimJob', shared_secret: 'test-secret' });
  receiver.post({
    action: 'completeJob',
    shared_secret: 'test-secret',
    jobId: created.job.id,
    summary: { retrieved: 1, deduplicated: 1, qualified: 1, rejected: 0, created: 1, exportRejected: 0 },
    resultRows: [{
      页面AS: '',
      原URL: 'https://source.example/post',
      URL对应域名: 'source.example',
      目标域名: 'target.example',
      类型: 'resource_page',
      外部链接数量: 0,
      自动评论运行结果: '',
    }],
  });

  const first = receiver.post({ action: 'getJobResult', shared_secret: 'test-secret', jobId: created.job.id });
  const second = receiver.post({ action: 'getJobResult', shared_secret: 'test-secret', jobId: created.job.id });
  assert.equal(first.records.length, 1);
  assert.deepEqual(second.records, first.records);

  const acknowledged = receiver.post({ action: 'ackJobResult', shared_secret: 'test-secret', jobId: created.job.id });
  assert.deepEqual(acknowledged.result, { deleted: 1 });
  assert.deepEqual(
    receiver.post({ action: 'getJobResult', shared_secret: 'test-secret', jobId: created.job.id }).records,
    [],
  );
});

test('completeJob writes all result rows in one Sheet operation', () => {
  const receiver = loadReceiver();
  const created = receiver.post({
    action: 'createJob',
    shared_secret: 'test-secret',
    job: { ...keywordJob, requestedLimit: 50 },
  });
  receiver.post({ action: 'claimJob', shared_secret: 'test-secret' });
  const rows = Array.from({ length: 50 }, (_, index) => ({
    页面AS: '',
    原URL: `https://source.example/post-${index}`,
    URL对应域名: 'source.example',
    目标域名: 'target.example',
    类型: 'resource_page',
    外部链接数量: index,
    自动评论运行结果: '',
  }));
  const before = receiver.stats('_临时任务结果').setValuesCalls.length;

  receiver.post({
    action: 'completeJob',
    shared_secret: 'test-secret',
    jobId: created.job.id,
    summary: { retrieved: 50, deduplicated: 50, qualified: 50, rejected: 0, created: 50, exportRejected: 0 },
    resultRows: rows,
  });

  const writes = receiver.stats('_临时任务结果').setValuesCalls.slice(before);
  assert.equal(writes.length, 1);
  assert.equal(writes[0].height, 50);
});

test('expired temporary results are cleaned without changing legacy resources', () => {
  const receiver = loadReceiver({
    resultRows: [
      ['job_id', 'row_index', 'expires_at', '页面AS', '原URL', 'URL对应域名', '目标域名', '类型', '外部链接数量', '自动评论运行结果'],
      ['job_expired', 0, '2000-01-01T00:00:00.000Z', '', 'https://expired.example/', 'expired.example', 'target.example', '', '', ''],
    ],
  });
  receiver.post({ action: 'upsertResources', shared_secret: 'test-secret', records: [keywordRecord] });

  assert.deepEqual(
    receiver.post({ action: 'getJobResult', shared_secret: 'test-secret', jobId: 'job_expired' }).records,
    [],
  );
  assert.equal(
    receiver.post({ action: 'listResources', shared_secret: 'test-secret', view: 'keyword' }).records.length,
    1,
  );
});
