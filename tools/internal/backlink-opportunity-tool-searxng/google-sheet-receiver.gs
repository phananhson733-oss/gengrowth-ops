/**
 * 外链机会发现工具 — Google Sheet Gateway
 *
 * 将本文件完整粘贴到既有 Apps Script 项目，设置 SPREADSHEET_ID 与
 * SHEET_SHARED_SECRET 后以 Web App 部署。浏览器不能直接调用本接口；
 * 只有 Vercel 服务端和 Mac mini Worker 携带共享密钥调用它。
 */

var SPREADSHEET_ID = 'REPLACE_WITH_YOUR_GOOGLE_SHEET_ID';
var SHEET_SHARED_SECRET = 'SET_ME';

var RESOURCE_HEADERS = [
  'id', 'source_mode', 'source_input', 'sources', 'referring_page_url', 'referring_domain',
  'page_title', 'snippet', 'competitor_domain', 'competitor_target_url', 'anchor_text',
  'link_attribute', 'external_link_count', 'domain_dr', 'dr_source', 'spam_score',
  'opportunity_type', 'topic_relevance', 'safety_status', 'safety_category', 'exclude_reason',
  'machine_status', 'human_status', 'quality_priority', 'inspection_status', 'inspection_note',
  'discovered_at', 'last_checked_at'
];
var RUN_HEADERS = [
  'run_id', 'mode', 'input', 'language', 'region', 'requested_limit', 'status',
  'retrieved', 'deduplicated', 'qualified', 'rejected', 'created', 'error',
  'created_at', 'started_at', 'completed_at', 'target_domain', 'ephemeral', 'export_rejected'
];
var RESULT_HEADERS = [
  'job_id', 'row_index', 'expires_at',
  '页面AS', '原URL', 'URL对应域名', '目标域名', '类型', '外部链接数量', '自动评论运行结果'
];
var RESOURCE_TAB = '外链资源库';
var REJECTED_TAB = '排除记录';
var RUN_TAB = '任务记录';
var RESULT_TAB = '_临时任务结果';
var JOB_SEQUENCE_KEY = 'backlink-opportunity-job-sequence';
var RESULT_TTL_MS = 24 * 60 * 60 * 1000;

function doPost(e) {
  try {
    assertConfigured_();
    var payload = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    assertSecret_(payload.shared_secret);
    return withLock_(function () {
      var spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
      return json_(dispatch_(spreadsheet, payload));
    });
  } catch (error) {
    return json_({ ok: false, error: String(error && error.message ? error.message : error) });
  }
}

function doGet() {
  return json_({ ok: true, service: 'backlink-opportunity-sheet-gateway' });
}

function dispatch_(spreadsheet, payload) {
  cleanupExpired_(spreadsheet);
  var action = String(payload.action || '');
  if (action === 'createJob') return { ok: true, job: createJob_(spreadsheet, payload.job || {}) };
  if (action === 'claimJob') return { ok: true, job: claimJob_(spreadsheet) };
  if (action === 'completeJob') return { ok: true, job: completeJob_(spreadsheet, payload.jobId, payload.summary || {}, payload.resultRows || []) };
  if (action === 'failJob') return { ok: true, job: updateJob_(spreadsheet, payload.jobId, 'failed', { error: String(payload.message || 'Unknown worker error') }) };
  if (action === 'getJob') return { ok: true, job: getJob_(spreadsheet, payload.jobId) };
  if (action === 'getJobResult') return { ok: true, records: getJobResult_(spreadsheet, payload.jobId) };
  if (action === 'ackJobResult') return { ok: true, result: ackJobResult_(spreadsheet, payload.jobId) };
  if (action === 'listResources') return { ok: true, records: listResources_(spreadsheet, payload.view) };
  if (action === 'upsertResources') return { ok: true, result: upsertResources_(spreadsheet, payload.records || []) };
  if (action === 'importLegacyRuns') return { ok: true, result: importLegacyRuns_(spreadsheet, payload.records || [], payload.runs || []) };
  if (!action && (payload.resources || payload.rejected || payload.task_runs)) return legacySync_(spreadsheet, payload);
  throw new Error('Unsupported action');
}

function assertConfigured_() {
  if (SPREADSHEET_ID === 'REPLACE_WITH_YOUR_GOOGLE_SHEET_ID') throw new Error('Set SPREADSHEET_ID before deploying this Web App');
  if (SHEET_SHARED_SECRET === 'SET_ME') throw new Error('Set SHEET_SHARED_SECRET before deploying this Web App');
}

function assertSecret_(candidate) {
  if (String(candidate || '') !== String(SHEET_SHARED_SECRET)) throw new Error('Invalid shared secret');
}

function withLock_(callback) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try { return callback(); } finally { lock.releaseLock(); }
}

function ensureSheet_(spreadsheet, tabName, headers) {
  var sheet = spreadsheet.getSheetByName(tabName) || spreadsheet.insertSheet(tabName);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    return sheet;
  }
  var width = Math.max(sheet.getLastColumn(), 1);
  var existing = sheet.getRange(1, 1, 1, width).getValues()[0];
  var missing = headers.filter(function (header) { return existing.indexOf(header) === -1; });
  if (missing.length) sheet.getRange(1, existing.length + 1, 1, missing.length).setValues([missing]);
  return sheet;
}

function readRows_(sheet) {
  if (sheet.getLastRow() < 2) return [];
  var width = sheet.getLastColumn();
  var headers = sheet.getRange(1, 1, 1, width).getValues()[0];
  var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, width).getValues();
  return values.map(function (row, index) {
    var record = { __rowNumber: index + 2 };
    headers.forEach(function (header, column) { record[header] = parseCell_(header, row[column]); });
    return record;
  });
}

function parseCell_(header, value) {
  if (header === 'sources' || header === 'summary') {
    if (!value) return header === 'sources' ? [] : {};
    try { return JSON.parse(String(value)); } catch (_) { return header === 'sources' ? [] : {}; }
  }
  return value == null ? '' : value;
}

function writeRecord_(sheet, headers, rowNumber, record) {
  var row = rowNumber || sheet.getLastRow() + 1;
  var width = sheet.getLastColumn();
  var sheetHeaders = sheet.getRange(1, 1, 1, width).getValues()[0];
  var values = rowNumber ? sheet.getRange(row, 1, 1, width).getValues()[0] : [];
  while (values.length < width) values.push('');
  headers.forEach(function (header) {
    var column = sheetHeaders.indexOf(header);
    if (column === -1) throw new Error('Missing sheet header: ' + header);
    values[column] = serialiseCell_(record[header]);
  });
  sheet.getRange(row, 1, 1, width).setValues([values]);
  return row;
}

function appendRecords_(sheet, headers, records) {
  if (!records.length) return;
  var width = sheet.getLastColumn();
  var sheetHeaders = sheet.getRange(1, 1, 1, width).getValues()[0];
  var values = records.map(function (record) {
    var row = Array(width).fill('');
    headers.forEach(function (header) {
      var column = sheetHeaders.indexOf(header);
      if (column === -1) throw new Error('Missing sheet header: ' + header);
      row[column] = serialiseCell_(record[header]);
    });
    return row;
  });
  sheet.getRange(sheet.getLastRow() + 1, 1, values.length, width).setValues(values);
}

function serialiseCell_(value) {
  if (Array.isArray(value) || (value && typeof value === 'object')) return JSON.stringify(value);
  return value == null ? '' : String(value);
}

function now_() { return new Date().toISOString(); }

function sourceKey_(source) {
  return [source.mode || '', source.input || '', source.language || '', source.region || '', source.provider || ''].join('\u0001');
}

function mergeSources_(left, right) {
  var seen = {};
  return (Array.isArray(left) ? left : []).concat(Array.isArray(right) ? right : []).filter(function (source) {
    var key = sourceKey_(source || {});
    if (seen[key]) return false;
    seen[key] = true;
    return true;
  });
}

function mergeResource_(existing, incoming) {
  var result = {};
  RESOURCE_HEADERS.forEach(function (header) { result[header] = existing[header] || ''; });
  RESOURCE_HEADERS.forEach(function (header) {
    if (header === 'sources') return;
    if (incoming[header] !== undefined && incoming[header] !== null && incoming[header] !== '') result[header] = incoming[header];
  });
  result.id = existing.id || incoming.id || ('resource_' + new Date().getTime());
  result.referring_page_url = existing.referring_page_url || incoming.referring_page_url;
  result.sources = mergeSources_(existing.sources, incoming.sources);
  if (result.sources.length) {
    result.source_mode = result.sources[0].mode || result.source_mode;
    result.source_input = result.sources[0].input || result.source_input;
  }
  result.last_checked_at = incoming.last_checked_at || now_();
  return result;
}

function upsertResources_(spreadsheet, records) {
  var normal = ensureSheet_(spreadsheet, RESOURCE_TAB, RESOURCE_HEADERS);
  var rejected = ensureSheet_(spreadsheet, REJECTED_TAB, RESOURCE_HEADERS);
  var normalRows = readRows_(normal);
  var rejectedRows = readRows_(rejected);
  var normalByUrl = indexBy_(normalRows, 'referring_page_url');
  var rejectedByUrl = indexBy_(rejectedRows, 'referring_page_url');
  var result = { created: 0, updated: 0, rejected: 0 };
  records.forEach(function (record) {
    var url = String(record && record.referring_page_url || '').trim();
    if (!url) throw new Error('referring_page_url is required');
    var targetSheet = record.machine_status === 'rejected' ? rejected : normal;
    var targetRows = record.machine_status === 'rejected' ? rejectedRows : normalRows;
    var targetIndex = record.machine_status === 'rejected' ? rejectedByUrl : normalByUrl;
    var existing = targetIndex[url];
    var merged = mergeResource_(existing || {}, record);
    if (existing) {
      writeRecord_(targetSheet, RESOURCE_HEADERS, existing.__rowNumber, merged);
      existing = Object.assign(existing, merged);
      result.updated += 1;
    } else {
      var rowNumber = writeRecord_(targetSheet, RESOURCE_HEADERS, null, merged);
      merged.__rowNumber = rowNumber;
      targetRows.push(merged);
      targetIndex[url] = merged;
      result.created += 1;
    }
    if (record.machine_status === 'rejected') result.rejected += 1;
  });
  return result;
}

function indexBy_(rows, key) {
  return rows.reduce(function (index, row) { if (row[key]) index[row[key]] = row; return index; }, {});
}

function listResources_(spreadsheet, view) {
  var sheet = ensureSheet_(spreadsheet, RESOURCE_TAB, RESOURCE_HEADERS);
  var mode = view === 'competitor' ? 'competitor_search' : view === 'keyword' ? 'keyword' : '';
  return readRows_(sheet).map(stripInternal_).filter(function (record) {
    return !mode || (record.sources || []).some(function (source) { return source.mode === mode; });
  });
}

function resultSheet_(spreadsheet) {
  var sheet = ensureSheet_(spreadsheet, RESULT_TAB, RESULT_HEADERS);
  if (sheet.hideSheet) sheet.hideSheet();
  return sheet;
}

function deleteRows_(sheet, rowNumbers) {
  rowNumbers.slice().sort(function (left, right) { return right - left; }).forEach(function (rowNumber) {
    sheet.deleteRow(rowNumber);
  });
}

function isEphemeral_(value) {
  return value === true || String(value || '').toLowerCase() === 'true';
}

function cleanupExpired_(spreadsheet) {
  var now = new Date(now_()).getTime();
  var results = resultSheet_(spreadsheet);
  var expiredResults = readRows_(results).filter(function (row) {
    var expiresAt = new Date(String(row.expires_at || '')).getTime();
    return Number.isFinite(expiresAt) && expiresAt <= now;
  });
  deleteRows_(results, expiredResults.map(function (row) { return row.__rowNumber; }));

  var runs = ensureSheet_(spreadsheet, RUN_TAB, RUN_HEADERS);
  var expiredRuns = readRows_(runs).filter(function (row) {
    var createdAt = new Date(String(row.created_at || '')).getTime();
    return isEphemeral_(row.ephemeral) && Number.isFinite(createdAt) && createdAt + RESULT_TTL_MS <= now;
  });
  deleteRows_(runs, expiredRuns.map(function (row) { return row.__rowNumber; }));
}

function completeJob_(spreadsheet, jobId, summary, resultRows) {
  var sheet = resultSheet_(spreadsheet);
  var expiresAt = new Date(new Date(now_()).getTime() + RESULT_TTL_MS).toISOString();
  var records = resultRows.map(function (row, index) {
    var record = { job_id: jobId, row_index: index, expires_at: expiresAt };
    RESULT_HEADERS.slice(3).forEach(function (header) { record[header] = row[header]; });
    return record;
  });
  appendRecords_(sheet, RESULT_HEADERS, records);
  return updateJob_(spreadsheet, jobId, 'completed', summary);
}

function getJobResult_(spreadsheet, jobId) {
  return readRows_(resultSheet_(spreadsheet))
    .filter(function (row) { return row.job_id === jobId; })
    .sort(function (left, right) { return Number(left.row_index) - Number(right.row_index); })
    .map(function (row) {
      var result = {};
      RESULT_HEADERS.slice(3).forEach(function (header) { result[header] = row[header]; });
      return result;
    });
}

function ackJobResult_(spreadsheet, jobId) {
  var sheet = resultSheet_(spreadsheet);
  var rows = readRows_(sheet).filter(function (row) { return row.job_id === jobId; });
  deleteRows_(sheet, rows.map(function (row) { return row.__rowNumber; }));
  return { deleted: rows.length };
}

function normaliseJob_(job) {
  var mode = String(job.mode || '');
  if (mode !== 'keyword' && mode !== 'competitor_search') throw new Error('Unsupported job mode');
  var input = String(job.input || '').trim();
  if (!input) throw new Error('Job input is required');
  var targetDomain = String(job.targetDomain || '').trim().toLowerCase();
  if (!targetDomain || targetDomain.indexOf('.') === -1 || /\s/.test(targetDomain)) throw new Error('Target domain is required');
  var limit = Number(job.requestedLimit);
  var allowed = mode === 'keyword' ? [50, 100, 200] : [50, 100, 200, 500];
  if (allowed.indexOf(limit) === -1) throw new Error('Unsupported requested limit');
  return {
    mode: mode, input: input, language: String(job.language || 'en'), region: String(job.region || 'us'),
    requested_limit: limit, target_domain: targetDomain, ephemeral: true,
  };
}

function nextJobId_() {
  var properties = PropertiesService.getScriptProperties();
  var sequence = Number(properties.getProperty(JOB_SEQUENCE_KEY) || '0') + 1;
  properties.setProperty(JOB_SEQUENCE_KEY, String(sequence));
  return 'job_' + sequence;
}

function createJob_(spreadsheet, job) {
  var sheet = ensureSheet_(spreadsheet, RUN_TAB, RUN_HEADERS);
  var record = normaliseJob_(job);
  record.run_id = nextJobId_();
  record.status = 'queued';
  record.created_at = now_();
  writeRecord_(sheet, RUN_HEADERS, null, record);
  return jobFromRun_(record);
}

function claimJob_(spreadsheet) {
  var sheet = ensureSheet_(spreadsheet, RUN_TAB, RUN_HEADERS);
  var queued = readRows_(sheet).filter(function (record) { return record.status === 'queued'; })[0];
  if (!queued) return null;
  queued.status = 'running';
  queued.started_at = now_();
  writeRecord_(sheet, RUN_HEADERS, queued.__rowNumber, queued);
  return jobFromRun_(queued);
}

function getJob_(spreadsheet, jobId) {
  var sheet = ensureSheet_(spreadsheet, RUN_TAB, RUN_HEADERS);
  var record = readRows_(sheet).filter(function (row) { return row.run_id === jobId; })[0];
  return record ? jobFromRun_(record) : null;
}

function updateJob_(spreadsheet, jobId, status, summary) {
  var sheet = ensureSheet_(spreadsheet, RUN_TAB, RUN_HEADERS);
  var record = readRows_(sheet).filter(function (row) { return row.run_id === jobId; })[0];
  if (!record) throw new Error('Job not found');
  if (record.status !== 'running') throw new Error('Job is not running');
  record.status = status;
  ['retrieved', 'deduplicated', 'qualified', 'rejected', 'created'].forEach(function (field) {
    if (summary[field] !== undefined) record[field] = Number(summary[field]);
  });
  if (summary.exportRejected !== undefined) record.export_rejected = Number(summary.exportRejected);
  if (summary.error) record.error = String(summary.error);
  record.completed_at = now_();
  writeRecord_(sheet, RUN_HEADERS, record.__rowNumber, record);
  return jobFromRun_(record);
}

function jobFromRun_(record) {
  return {
    id: record.run_id,
    mode: record.mode,
    input: record.input,
    language: record.language || 'en',
    region: record.region || 'us',
    requestedLimit: Number(record.requested_limit),
    targetDomain: record.target_domain || '',
    ephemeral: isEphemeral_(record.ephemeral),
    status: record.status,
    summary: {
      retrieved: Number(record.retrieved || 0), deduplicated: Number(record.deduplicated || 0),
      qualified: Number(record.qualified || 0), rejected: Number(record.rejected || 0), created: Number(record.created || 0),
      exportRejected: Number(record.export_rejected || 0),
    },
    error: record.error || '', createdAt: record.created_at || '', startedAt: record.started_at || '', completedAt: record.completed_at || '',
  };
}

function importLegacyRuns_(spreadsheet, records, runs) {
  var resources = upsertResources_(spreadsheet, records);
  var sheet = ensureSheet_(spreadsheet, RUN_TAB, RUN_HEADERS);
  var byRunId = indexBy_(readRows_(sheet), 'run_id');
  var imported = 0;
  runs.forEach(function (run) {
    if (byRunId[run.run_id]) return;
    var record = {
      run_id: String(run.run_id || nextJobId_()), mode: String(run.mode || 'keyword'), input: String(run.input || ''),
      language: String(run.language || 'en'), region: String(run.region || 'us'), requested_limit: Number(run.requested_limit || 50),
      status: 'completed', retrieved: Number(run.received_count || 0), qualified: Number(run.qualified_count || 0),
      rejected: Number(run.rejected_count || 0), created_at: String(run.created_at || now_()), completed_at: String(run.created_at || now_()),
    };
    writeRecord_(sheet, RUN_HEADERS, null, record);
    imported += 1;
  });
  return { resources: resources, importedRuns: imported };
}

function legacySync_(spreadsheet, payload) {
  var records = (payload.resources || []).concat(payload.rejected || []);
  var result = importLegacyRuns_(spreadsheet, records, payload.task_runs || []);
  return { ok: true, inserted: result.resources.created + result.importedRuns };
}

function stripInternal_(record) {
  var result = {};
  Object.keys(record).forEach(function (key) { if (key !== '__rowNumber') result[key] = record[key]; });
  return result;
}

function json_(body) {
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(ContentService.MimeType.JSON);
}
