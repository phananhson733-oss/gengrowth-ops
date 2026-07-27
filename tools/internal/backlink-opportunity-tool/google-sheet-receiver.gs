/**
 * 外链机会发现工具 — Google Sheet 接收端
 *
 * 将此文件粘贴到 Google Apps Script 项目中，设置 SPREADSHEET_ID，部署为 Web App。
 * 具体部署步骤见 README.md。
 */

var SPREADSHEET_ID = 'REPLACE_WITH_YOUR_GOOGLE_SHEET_ID';
var SHEET_SHARED_SECRET = 'REPLACE_WITH_A_RANDOM_SHARED_SECRET';

var RESOURCE_HEADERS = [
  'id', 'source_mode', 'source_input', 'sources', 'referring_page_url', 'referring_domain',
  'page_title', 'snippet', 'competitor_domain', 'competitor_target_url', 'anchor_text',
  'link_attribute', 'external_link_count', 'domain_dr', 'dr_source', 'spam_score',
  'opportunity_type', 'topic_relevance', 'safety_status', 'safety_category', 'exclude_reason',
  'machine_status', 'human_status', 'quality_priority', 'inspection_status', 'inspection_note',
  'discovered_at', 'last_checked_at'
];
var RUN_HEADERS = ['run_id', 'mode', 'input', 'received_count', 'qualified_count', 'rejected_count', 'created_at'];

function doPost(e) {
  try {
    if (SPREADSHEET_ID === 'REPLACE_WITH_YOUR_GOOGLE_SHEET_ID') {
      throw new Error('Set SPREADSHEET_ID before deploying this Web App');
    }
    var payload = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (SHEET_SHARED_SECRET === 'REPLACE_WITH_A_RANDOM_SHARED_SECRET' || payload.shared_secret !== SHEET_SHARED_SECRET) {
      throw new Error('Invalid shared secret');
    }
    var spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    var inserted = 0;
    inserted += appendRows_(spreadsheet, '外链资源库', RESOURCE_HEADERS, payload.resources || []);
    inserted += appendRows_(spreadsheet, '排除记录', RESOURCE_HEADERS, payload.rejected || []);
    inserted += appendRows_(spreadsheet, '任务记录', RUN_HEADERS, payload.task_runs || []);
    return json_({ ok: true, inserted: inserted });
  } catch (error) {
    return json_({ ok: false, error: String(error) });
  }
}

function doGet() {
  return json_({ ok: true, service: 'backlink-opportunity-sheet-receiver' });
}

function appendRows_(spreadsheet, tabName, headers, records) {
  if (!records.length) return 0;
  var sheet = spreadsheet.getSheetByName(tabName) || spreadsheet.insertSheet(tabName);
  if (sheet.getLastRow() === 0) sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  var values = records.map(function (record) {
    return headers.map(function (header) {
      var value = record && record[header];
      return Array.isArray(value) || (value && typeof value === 'object') ? JSON.stringify(value) : (value == null ? '' : String(value));
    });
  });
  sheet.getRange(sheet.getLastRow() + 1, 1, values.length, headers.length).setValues(values);
  return values.length;
}

function json_(body) {
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(ContentService.MimeType.JSON);
}
