/**
 * Link Attribution 备份 — Google Apps Script Web App
 *
 * 作用：接收外链工具「导入Google」按钮 POST 过来的记录，追加到共享 Google Sheet。
 * 部署步骤见同目录 README-google-sheet.md。
 *
 * 目标表：https://docs.google.com/spreadsheets/d/1WVTg7zFAlkvO_CL6epaOTYpn6lVooTUpjxlcjZVBReI/edit
 */

var SHEET_ID = '1WVTg7zFAlkvO_CL6epaOTYpn6lVooTUpjxlcjZVBReI';
var HEADERS = [
  'imported_at',
  'site',
  'landing_url',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'long_url',
  'short_url',
  'short_code',
];

// Each website gets its own sheet tab; rows are routed by their `site` value.
function doPost(e) {
  try {
    var body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    var rows = Array.isArray(body.rows) ? body.rows : [];
    var ss = SpreadsheetApp.openById(SHEET_ID);

    // Group incoming rows by site so each site writes to its own tab.
    var bySite = {};
    rows.forEach(function (row) {
      var site = tabNameForSite_(row && row.site);
      (bySite[site] = bySite[site] || []).push(row);
    });

    var inserted = 0;
    Object.keys(bySite).forEach(function (site) {
      var sheet = getOrCreateSheet_(ss, site);
      var values = bySite[site].map(toRow_);
      if (values.length) {
        sheet
          .getRange(sheet.getLastRow() + 1, 1, values.length, HEADERS.length)
          .setValues(values);
        inserted += values.length;
      }
    });
    return json_({ ok: true, inserted: inserted });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function doGet() {
  return json_({ ok: true, service: 'link-attribution-backup' });
}

// Google Sheet tab names can't contain : \ / ? * [ ] and max 100 chars.
function tabNameForSite_(rawSite) {
  var name = String(rawSite == null ? '' : rawSite).trim();
  if (!name) return 'Unknown';
  return name.replace(/[:\\/?*\[\]]/g, ' ').slice(0, 100);
}

function getOrCreateSheet_(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  ensureHeaders_(sheet);
  return sheet;
}

function ensureHeaders_(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  }
}

function toRow_(record) {
  record = record || {};
  return HEADERS.map(function (key) {
    return record[key] == null ? '' : String(record[key]);
  });
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
