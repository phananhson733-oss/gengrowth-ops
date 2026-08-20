import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { DatabaseSync } from "node:sqlite";
import { createSign, randomUUID } from "node:crypto";

const SHEET_NAMES = ["accounts_latest", "account_history", "posts_latest", "post_history", "runs"];
const SQL = (lines) => lines.join("\n");

function initDatabase(db) {
  db.exec(SQL([
    "PRAGMA journal_mode = WAL;",
    "PRAGMA foreign_keys = ON;",
    "CREATE TABLE IF NOT EXISTS account_snapshots (",
    " snapshot_date TEXT NOT NULL, captured_at TEXT NOT NULL, username TEXT NOT NULL,",
    " account_url TEXT NOT NULL, nickname TEXT, followers INTEGER, following INTEGER,",
    " total_likes INTEGER, total_posts INTEGER, bio TEXT, collection_status TEXT NOT NULL,",
    " PRIMARY KEY (username, snapshot_date));",
    "CREATE TABLE IF NOT EXISTS posts (",
    " post_id TEXT PRIMARY KEY, username TEXT NOT NULL, post_url TEXT NOT NULL,",
    " content_type TEXT, published_at TEXT, caption TEXT,",
    " first_seen_at TEXT NOT NULL, last_seen_at TEXT NOT NULL);",
    "CREATE TABLE IF NOT EXISTS post_snapshots (",
    " snapshot_date TEXT NOT NULL, captured_at TEXT NOT NULL, post_id TEXT NOT NULL,",
    " username TEXT NOT NULL, views INTEGER, likes INTEGER, comments INTEGER,",
    " favorites INTEGER, shares INTEGER, collection_status TEXT NOT NULL,",
    " missing_fields TEXT NOT NULL, PRIMARY KEY (post_id, snapshot_date),",
    " FOREIGN KEY (post_id) REFERENCES posts(post_id));",
    "CREATE TABLE IF NOT EXISTS runs (",
    " run_id TEXT PRIMARY KEY, started_at TEXT NOT NULL, finished_at TEXT,",
    " accounts_total INTEGER NOT NULL, accounts_success INTEGER NOT NULL,",
    " posts_total INTEGER NOT NULL, partial_count INTEGER NOT NULL,",
    " failed_count INTEGER NOT NULL, status TEXT NOT NULL, error_summary TEXT,",
    " google_sheets_status TEXT NOT NULL DEFAULT 'pending',",
    " feishu_status TEXT NOT NULL DEFAULT 'pending', feishu_updated_count INTEGER NOT NULL DEFAULT 0,",
    " feishu_error_summary TEXT);",
    "CREATE INDEX IF NOT EXISTS idx_account_snapshots_date ON account_snapshots(snapshot_date);",
    "CREATE INDEX IF NOT EXISTS idx_post_snapshots_date ON post_snapshots(snapshot_date);",
    "CREATE INDEX IF NOT EXISTS idx_post_snapshots_username ON post_snapshots(username);"
  ]));
  const runColumns = new Set(db.prepare("PRAGMA table_info(runs)").all().map((column) => column.name));
  if (!runColumns.has("feishu_status")) db.exec("ALTER TABLE runs ADD COLUMN feishu_status TEXT NOT NULL DEFAULT 'pending'");
  if (!runColumns.has("feishu_updated_count")) db.exec("ALTER TABLE runs ADD COLUMN feishu_updated_count INTEGER NOT NULL DEFAULT 0");
  if (!runColumns.has("feishu_error_summary")) db.exec("ALTER TABLE runs ADD COLUMN feishu_error_summary TEXT");
}

function missingMetricFields(post) {
  return ["views", "likes", "comments", "favorites", "shares"]
    .filter((field) => post[field] === null || post[field] === undefined);
}

export function saveLocalHistory({ outputDir, snapshotDate, capturedAt, usernames, accounts, posts, errors }) {
  const dbPath = path.join(outputDir, "tiktok_metrics.sqlite");
  const db = new DatabaseSync(dbPath);
  initDatabase(db);
  const runId = randomUUID();
  const accountByUsername = new Map(accounts.map((account) => [account.username, account]));
  const partialCount = posts.filter((post) => missingMetricFields(post).length > 0).length;
  const failedCount = errors.length;
  const errorSummary = errors.length ? JSON.stringify(errors) : "";

  const upsertAccount = db.prepare(SQL([
    "INSERT INTO account_snapshots (snapshot_date, captured_at, username, account_url, nickname,",
    " followers, following, total_likes, total_posts, bio, collection_status)",
    "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    "ON CONFLICT(username, snapshot_date) DO UPDATE SET",
    " captured_at=excluded.captured_at, account_url=excluded.account_url, nickname=excluded.nickname,",
    " followers=excluded.followers, following=excluded.following, total_likes=excluded.total_likes,",
    " total_posts=excluded.total_posts, bio=excluded.bio, collection_status=excluded.collection_status"
  ]));

  const upsertPost = db.prepare(SQL([
    "INSERT INTO posts (post_id, username, post_url, content_type, published_at, caption, first_seen_at, last_seen_at)",
    "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    "ON CONFLICT(post_id) DO UPDATE SET",
    " username=excluded.username, post_url=excluded.post_url, content_type=excluded.content_type,",
    " published_at=COALESCE(excluded.published_at, posts.published_at),",
    " caption=CASE WHEN excluded.caption IS NOT NULL AND excluded.caption <> '' THEN excluded.caption ELSE posts.caption END,",
    " last_seen_at=excluded.last_seen_at"
  ]));

  const upsertPostSnapshot = db.prepare(SQL([
    "INSERT INTO post_snapshots (snapshot_date, captured_at, post_id, username, views, likes, comments,",
    " favorites, shares, collection_status, missing_fields)",
    "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    "ON CONFLICT(post_id, snapshot_date) DO UPDATE SET",
    " captured_at=excluded.captured_at, username=excluded.username, views=excluded.views,",
    " likes=excluded.likes, comments=excluded.comments, favorites=excluded.favorites,",
    " shares=excluded.shares, collection_status=excluded.collection_status, missing_fields=excluded.missing_fields"
  ]));

  const insertRun = db.prepare(SQL([
    "INSERT INTO runs (run_id, started_at, finished_at, accounts_total, accounts_success, posts_total,",
    " partial_count, failed_count, status, error_summary, google_sheets_status)",
    "VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?)"
  ]));

  db.exec("BEGIN IMMEDIATE");
  try {
    for (const username of usernames) {
      const account = accountByUsername.get(username);
      if (account) {
        upsertAccount.run(snapshotDate, capturedAt, username, account.account_url, account.nickname ?? null,
          account.followers ?? null, account.following ?? null, account.total_likes ?? null,
          account.total_posts ?? null, account.bio ?? null, "complete");
      } else {
        upsertAccount.run(snapshotDate, capturedAt, username, "https://www.tiktok.com/@" + username,
          null, null, null, null, null, null, "failed");
      }
    }

    for (const post of posts) {
      const missingFields = missingMetricFields(post);
      const collectionStatus = missingFields.length ? "partial" : "complete";
      upsertPost.run(String(post.post_id), post.username, post.post_url, post.content_type ?? null,
        post.published_at ?? null, post.caption ?? null, capturedAt, capturedAt);
      upsertPostSnapshot.run(snapshotDate, capturedAt, String(post.post_id), post.username,
        post.views ?? null, post.likes ?? null, post.comments ?? null, post.favorites ?? null,
        post.shares ?? null, collectionStatus, JSON.stringify(missingFields));
    }

    insertRun.run(runId, capturedAt, usernames.length, accounts.length, posts.length,
      partialCount, failedCount, "local_saved", errorSummary, "pending");
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    db.close();
    throw error;
  }

  const accountCount = Number(db.prepare(
    "SELECT COUNT(*) AS count FROM account_snapshots WHERE snapshot_date=?"
  ).get(snapshotDate).count);
  const snapshotCount = Number(db.prepare(
    "SELECT COUNT(*) AS count FROM post_snapshots WHERE snapshot_date=?"
  ).get(snapshotDate).count);
  const postCount = Number(db.prepare("SELECT COUNT(*) AS count FROM posts").get().count);
  db.close();

  return {
    run_id: runId,
    database_path: dbPath,
    account_snapshot_rows_for_date: accountCount,
    post_snapshot_rows_for_date: snapshotCount,
    unique_posts_total: postCount,
    partial_count: partialCount,
    failed_count: failedCount
  };
}

async function loadEnv(envPath) {
  const values = { ...process.env };
  try {
    const text = await fs.readFile(envPath, "utf8");
    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const separator = line.indexOf("=");
      if (separator < 1) continue;
      const key = line.slice(0, separator).trim();
      let value = line.slice(separator + 1).trim();
      if ((value.startsWith("\"") && value.endsWith("\"")) ||
          (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
      values[key] = value;
    }
  } catch {}
  return values;
}

function expandHome(filePath) {
  if (!filePath) return filePath;
  return filePath === "~" || filePath.startsWith("~/") ? path.join(os.homedir(), filePath.slice(2)) : filePath;
}

function base64Url(value) {
  return (Buffer.isBuffer(value) ? value : Buffer.from(value)).toString("base64url");
}

async function getServiceAccountToken(serviceAccount) {
  const now = Math.floor(Date.now() / 1000);
  const tokenUri = serviceAccount.token_uri || "https://oauth2.googleapis.com/token";
  const unsigned = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" })) + "." +
    base64Url(JSON.stringify({
      iss: serviceAccount.client_email,
      scope: "https://www.googleapis.com/auth/spreadsheets",
      aud: tokenUri,
      iat: now,
      exp: now + 3600
    }));
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  signer.end();
  const assertion = unsigned + "." + base64Url(signer.sign(serviceAccount.private_key));
  const response = await fetch(tokenUri, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion
    })
  });
  const body = await response.json();
  if (!response.ok || !body.access_token) throw new Error("Google token request failed: " + JSON.stringify(body));
  return body.access_token;
}

async function googleRequest(url, token, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      authorization: "Bearer " + token,
      "content-type": "application/json",
      ...(options.headers || {})
    }
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : {};
  if (!response.ok) throw new Error("Google Sheets API " + response.status + ": " + JSON.stringify(body));
  return body;
}

function setRunStatus(db, runId, status, sheetsStatus, errorSummary) {
  const existing = db.prepare("SELECT error_summary FROM runs WHERE run_id=?").get(runId);
  db.prepare(SQL([
    "UPDATE runs SET finished_at=?, status=?, google_sheets_status=?, error_summary=? WHERE run_id=?"
  ])).run(new Date().toISOString(), status, sheetsStatus,
    errorSummary === undefined ? (existing?.error_summary || "") : errorSummary, runId);
}

function querySheetData(db) {
  return {
    accounts_latest: {
      headers: ["snapshot_date", "captured_at", "username", "account_url", "nickname", "followers",
        "following", "total_likes", "total_posts", "bio", "collection_status"],
      rows: db.prepare(SQL([
        "SELECT snapshot_date,captured_at,username,account_url,nickname,followers,following,total_likes,total_posts,bio,collection_status",
        "FROM account_snapshots a WHERE snapshot_date=(SELECT MAX(snapshot_date) FROM account_snapshots x WHERE x.username=a.username)",
        "ORDER BY username"
      ])).all()
    },
    account_history: {
      headers: ["snapshot_date", "captured_at", "username", "account_url", "nickname", "followers",
        "following", "total_likes", "total_posts", "bio", "collection_status"],
      rows: db.prepare(SQL([
        "SELECT snapshot_date,captured_at,username,account_url,nickname,followers,following,total_likes,total_posts,bio,collection_status",
        "FROM account_snapshots ORDER BY snapshot_date,username"
      ])).all()
    },
    posts_latest: {
      headers: ["post_id", "username", "post_url", "content_type", "published_at", "caption",
        "first_seen_at", "last_seen_at", "snapshot_date", "captured_at", "views", "likes",
        "comments", "favorites", "shares", "collection_status", "missing_fields"],
      rows: db.prepare(SQL([
        "SELECT p.post_id,p.username,p.post_url,p.content_type,p.published_at,p.caption,p.first_seen_at,p.last_seen_at,",
        "s.snapshot_date,s.captured_at,s.views,s.likes,s.comments,s.favorites,s.shares,s.collection_status,s.missing_fields",
        "FROM posts p JOIN post_snapshots s ON s.post_id=p.post_id",
        "WHERE s.snapshot_date=(SELECT MAX(snapshot_date) FROM post_snapshots x WHERE x.post_id=p.post_id)",
        "ORDER BY p.username,COALESCE(p.published_at,'') DESC,p.post_id"
      ])).all()
    },
    post_history: {
      headers: ["snapshot_date", "captured_at", "post_id", "username", "post_url", "content_type",
        "published_at", "caption", "views", "likes", "comments", "favorites", "shares",
        "collection_status", "missing_fields"],
      rows: db.prepare(SQL([
        "SELECT s.snapshot_date,s.captured_at,p.post_id,p.username,p.post_url,p.content_type,p.published_at,p.caption,",
        "s.views,s.likes,s.comments,s.favorites,s.shares,s.collection_status,s.missing_fields",
        "FROM post_snapshots s JOIN posts p ON p.post_id=s.post_id",
        "ORDER BY s.snapshot_date,p.username,p.post_id"
      ])).all()
    },
    runs: {
      headers: ["run_id", "started_at", "finished_at", "accounts_total", "accounts_success",
        "posts_total", "partial_count", "failed_count", "status", "error_summary",
        "feishu_status", "feishu_updated_count", "feishu_error_summary"],
      rows: db.prepare(SQL([
        "SELECT run_id,started_at,finished_at,accounts_total,accounts_success,posts_total,partial_count,failed_count,status,error_summary,",
        "feishu_status,feishu_updated_count,feishu_error_summary",
        "FROM runs ORDER BY started_at"
      ])).all()
    }
  };
}

function sheetValues(definition) {
  return [definition.headers, ...definition.rows.map((row) =>
    definition.headers.map((header) => row[header] === null || row[header] === undefined ? "" : row[header])
  )];
}

async function ensureSheets(spreadsheetId, token) {
  const base = "https://sheets.googleapis.com/v4/spreadsheets/" + encodeURIComponent(spreadsheetId);
  const readMetadata = () => googleRequest(base + "?fields=sheets.properties(sheetId,title)", token);
  let metadata = await readMetadata();
  const existing = new Set((metadata.sheets || []).map((sheet) => sheet.properties.title));
  const missing = SHEET_NAMES.filter((name) => !existing.has(name));
  if (missing.length) {
    await googleRequest(base + ":batchUpdate", token, {
      method: "POST",
      body: JSON.stringify({ requests: missing.map((title) => ({ addSheet: { properties: { title } } })) })
    });
    metadata = await readMetadata();
  }
  return new Map((metadata.sheets || []).map((sheet) => [sheet.properties.title, sheet.properties.sheetId]));
}

async function writeGoogleSheets(spreadsheetId, token, definitions) {
  const base = "https://sheets.googleapis.com/v4/spreadsheets/" + encodeURIComponent(spreadsheetId);
  const sheetIds = await ensureSheets(spreadsheetId, token);
  await googleRequest(base + "/values:batchClear", token, {
    method: "POST",
    body: JSON.stringify({ ranges: SHEET_NAMES.map((name) => "'" + name + "'!A:Z") })
  });
  await googleRequest(base + "/values:batchUpdate", token, {
    method: "POST",
    body: JSON.stringify({
      valueInputOption: "RAW",
      data: SHEET_NAMES.map((name) => ({
        range: "'" + name + "'!A1",
        majorDimension: "ROWS",
        values: sheetValues(definitions[name])
      }))
    })
  });

  const requests = [];
  for (const name of SHEET_NAMES) {
    const sheetId = sheetIds.get(name);
    const columnCount = definitions[name].headers.length;
    requests.push(
      {
        repeatCell: {
          range: { sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: columnCount },
          cell: {
            userEnteredFormat: {
              backgroundColorStyle: { rgbColor: { red: 0.067, green: 0.094, blue: 0.153 } },
              textFormat: { bold: true, foregroundColorStyle: { rgbColor: { red: 1, green: 1, blue: 1 } } },
              wrapStrategy: "WRAP"
            }
          },
          fields: "userEnteredFormat(backgroundColorStyle,textFormat,wrapStrategy)"
        }
      },
      {
        updateSheetProperties: {
          properties: { sheetId, gridProperties: { frozenRowCount: 1 } },
          fields: "gridProperties.frozenRowCount"
        }
      },
      {
        autoResizeDimensions: {
          dimensions: { sheetId, dimension: "COLUMNS", startIndex: 0, endIndex: columnCount }
        }
      }
    );
  }
  await googleRequest(base + ":batchUpdate", token, {
    method: "POST",
    body: JSON.stringify({ requests })
  });
}

export async function syncGoogleSheets({ dbPath, runId, scriptDir }) {
  const db = new DatabaseSync(dbPath);
  initDatabase(db);
  const envPath = path.join(scriptDir, ".env");
  const env = await loadEnv(envPath);
  const enabled = String(env.GOOGLE_SHEETS_ENABLED || "true").toLowerCase() !== "false";
  const spreadsheetId = env.GOOGLE_SHEETS_SPREADSHEET_ID || "";
  const serviceAccountPath = expandHome(env.GOOGLE_SERVICE_ACCOUNT_JSON || "");

  if (!enabled) {
    setRunStatus(db, runId, "local_success_sheets_disabled", "disabled");
    db.close();
    return { status: "disabled", spreadsheet_id: spreadsheetId || null };
  }
  if (!spreadsheetId || !serviceAccountPath) {
    setRunStatus(db, runId, "local_success_sheets_skipped", "missing_credentials");
    db.close();
    return { status: "skipped_missing_credentials", spreadsheet_id: spreadsheetId || null, env_path: envPath };
  }

  try {
    const serviceAccount = JSON.parse(await fs.readFile(serviceAccountPath, "utf8"));
    if (!serviceAccount.client_email || !serviceAccount.private_key) {
      throw new Error("Service account JSON is missing client_email or private_key");
    }
    setRunStatus(db, runId, "success", "synced");
    const definitions = querySheetData(db);
    const token = await getServiceAccountToken(serviceAccount);
    await writeGoogleSheets(spreadsheetId, token, definitions);
    db.close();
    return {
      status: "success",
      spreadsheet_id: spreadsheetId,
      spreadsheet_url: "https://docs.google.com/spreadsheets/d/" + spreadsheetId
    };
  } catch (error) {
    const current = db.prepare("SELECT error_summary FROM runs WHERE run_id=?").get(runId);
    const message = error instanceof Error ? error.message : String(error);
    const combined = [current?.error_summary || "", "Google Sheets: " + message].filter(Boolean).join(" | ");
    setRunStatus(db, runId, "local_success_sheets_failed", "failed", combined);
    db.close();
    return { status: "failed", spreadsheet_id: spreadsheetId || null, error: message };
  }
}
