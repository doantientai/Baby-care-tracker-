/**
 * Baby Care Tracker — Google Sheet backend (Google Apps Script)
 * =============================================================
 * This turns a Google Sheet into a tiny private API that the app (index.html)
 * reads from and writes to, so two parents share the same data — no server.
 *
 * SETUP
 *   1. Create a new Google Sheet.
 *   2. Extensions → Apps Script.
 *   3. Delete the sample code, paste THIS file, Save.
 *   4. (Optional but recommended) set a SECRET below and use the same value in
 *      the app's "Shared secret" field.
 *   5. Deploy → New deployment → Web app
 *        - Execute as: Me
 *        - Who has access: Anyone
 *      Authorize when prompted.
 *   6. Copy the Web app URL (ends in /exec) into the app's Settings → Cloud sync.
 *
 * The app talks to this over GET requests (avoids browser CORS/preflight issues):
 *   ?action=list                         → { ok, events:[...] }
 *   ?action=upsert&event=<json>          → { ok }
 *   ?action=delete&id=<id>&updatedAt=<n> → { ok }
 * Add &token=<SECRET> when a secret is set.
 */

// Leave '' to disable the check, or set a hard-to-guess string and use the same
// value in the app's "Shared secret" field.
var SECRET = '';

var SHEET_NAME = 'events';
var HEADERS = ['id', 'type', 'at', 'endAt', 'caregiver', 'note', 'data', 'createdAt', 'updatedAt', 'deleted'];

function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) { sh = ss.insertSheet(SHEET_NAME); sh.appendRow(HEADERS); }
  if (sh.getLastRow() === 0) sh.appendRow(HEADERS);
  return sh;
}

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function listEvents(sh) {
  var values = sh.getDataRange().getValues();
  var out = [];
  for (var i = 1; i < values.length; i++) {
    var r = values[i];
    if (r[0] === '' || r[0] == null) continue;
    out.push({
      id: String(r[0]),
      type: r[1],
      at: Number(r[2]),
      endAt: r[3] === '' || r[3] == null ? null : Number(r[3]),
      caregiver: r[4],
      note: r[5],
      data: r[6] ? JSON.parse(r[6]) : {},
      createdAt: Number(r[7]) || null,
      updatedAt: Number(r[8]) || 0,
      deleted: r[9] === true || r[9] === 'TRUE' || r[9] === 'true'
    });
  }
  return out;
}

function findRow(sh, id) {
  var last = sh.getLastRow();
  if (last < 2) return -1;
  var ids = sh.getRange(2, 1, last - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) return i + 2;
  }
  return -1;
}

function rowFromEvent(ev) {
  return [
    String(ev.id), ev.type, ev.at,
    ev.endAt == null ? '' : ev.endAt,
    ev.caregiver || '', ev.note || '',
    JSON.stringify(ev.data || {}),
    ev.createdAt || '', ev.updatedAt || Date.now(),
    ev.deleted ? true : false
  ];
}

function upsert(sh, ev) {
  var row = findRow(sh, ev.id);
  var data = rowFromEvent(ev);
  if (row > 0) {
    var existingUpdated = Number(sh.getRange(row, 9).getValue()) || 0;
    if ((Number(ev.updatedAt) || 0) >= existingUpdated) {
      sh.getRange(row, 1, 1, HEADERS.length).setValues([data]);
    }
  } else {
    sh.appendRow(data);
  }
}

function del(sh, id, updatedAt) {
  var row = findRow(sh, id);
  if (row > 0) {
    sh.getRange(row, 10).setValue(true);
    sh.getRange(row, 9).setValue(Number(updatedAt) || Date.now());
  }
}

function doGet(e) {
  var p = (e && e.parameter) || {};
  if (SECRET && p.token !== SECRET) return jsonOut({ ok: false, error: 'unauthorized' });
  var action = p.action || 'list';
  var sh = getSheet();

  if (action === 'list') return jsonOut({ ok: true, events: listEvents(sh) });

  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    if (action === 'upsert') { upsert(sh, JSON.parse(p.event)); return jsonOut({ ok: true }); }
    if (action === 'delete') { del(sh, p.id, p.updatedAt); return jsonOut({ ok: true }); }
    return jsonOut({ ok: false, error: 'unknown action: ' + action });
  } catch (err) {
    return jsonOut({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// Also accept POST (some setups prefer it); delegates to the same logic.
function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var params = { action: body.action, token: body.token };
    if (body.event) params.event = JSON.stringify(body.event);
    if (body.id) params.id = body.id;
    if (body.updatedAt) params.updatedAt = body.updatedAt;
    return doGet({ parameter: params });
  } catch (err) {
    return jsonOut({ ok: false, error: String(err) });
  }
}
