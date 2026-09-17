import assert from "node:assert/strict";
import { existsSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { DatabaseSync } from "node:sqlite";

import {
  normalizeAccountId,
  readLatestAccounts,
  readLatestPosts,
  toCaptureFields,
} from "../src/source-sqlite.mjs";
import { matchReleaseToCapture } from "../src/matcher.mjs";
import { planMigration } from "../src/migration.mjs";

const METRICS = ["views", "likes", "comments", "favorites", "shares"];

function sourcePath() {
  return join(mkdtempSync(join(tmpdir(), "shortdrama-source-")), "metrics.sqlite");
}

function createSourceDb({ accountTable = true, postTables = true } = {}) {
  const path = sourcePath();
  const db = new DatabaseSync(path);
  if (accountTable) {
    db.exec(`
      CREATE TABLE account_snapshots (
        snapshot_date TEXT NOT NULL, captured_at TEXT NOT NULL, username TEXT NOT NULL,
        account_url TEXT NOT NULL, nickname TEXT, followers INTEGER, following INTEGER,
        total_likes INTEGER, total_posts INTEGER, bio TEXT, collection_status TEXT NOT NULL,
        PRIMARY KEY (username, snapshot_date)
      );
    `);
  }
  if (postTables) {
    db.exec(`
      CREATE TABLE posts (
        post_id TEXT PRIMARY KEY, username TEXT NOT NULL, post_url TEXT NOT NULL,
        content_type TEXT, published_at TEXT, caption TEXT,
        first_seen_at TEXT NOT NULL, last_seen_at TEXT NOT NULL
      );
      CREATE TABLE post_snapshots (
        snapshot_date TEXT NOT NULL, captured_at TEXT NOT NULL, post_id TEXT NOT NULL,
        username TEXT NOT NULL, views INTEGER, likes INTEGER, comments INTEGER,
        favorites INTEGER, shares INTEGER, collection_status TEXT NOT NULL,
        missing_fields TEXT NOT NULL, PRIMARY KEY(post_id, snapshot_date),
        FOREIGN KEY (post_id) REFERENCES posts(post_id)
      );
    `);
  }
  return { path, db };
}

function insertAccount(db, {
  snapshotDate = "2026-09-01", capturedAt = "2026-09-01T13:00:00Z",
  username = "dramaexpedition", followers = 100, collectionStatus = "complete",
  accountUrl = `https://www.tiktok.com/@${username.replace(/^@/, "")}`,
} = {}) {
  db.prepare("INSERT INTO account_snapshots VALUES (?,?,?,?,?,?,?,?,?,?,?)").run(
    snapshotDate, capturedAt, username, accountUrl, "Drama", followers, 1, 2, 3, "bio", collectionStatus,
  );
}

function insertPost(db, {
  postId = "99", username = "dramaexpedition",
  postUrl = `https://www.tiktok.com/@${username.replace(/^@/, "")}/video/${postId}`,
  publishedAt = "2026-09-01T12:00:00Z",
  firstSeenAt = "2026-08-31T13:00:00Z", lastSeenAt = "2026-09-01T13:00:00Z",
} = {}) {
  db.prepare("INSERT INTO posts VALUES (?,?,?,?,?,?,?,?)").run(
    postId, username, postUrl, "video", publishedAt, "caption", firstSeenAt, lastSeenAt,
  );
}

function insertSnapshot(db, {
  snapshotDate = "2026-09-01", capturedAt = "2026-09-01T13:00:00Z",
  postId = "99", username = "dramaexpedition", views = 20, likes = 2,
  comments = 0, favorites = 1, shares = 0, collectionStatus = "complete", missingFields = "[]",
} = {}) {
  db.prepare("INSERT INTO post_snapshots VALUES (?,?,?,?,?,?,?,?,?,?,?)").run(
    snapshotDate, capturedAt, postId, username, views, likes, comments, favorites, shares,
    collectionStatus, missingFields,
  );
}

function capture(overrides = {}) {
  return {
    post_id: "99",
    username: "dramaexpedition",
    post_url: "https://www.tiktok.com/@dramaexpedition/video/99",
    published_at: "2026-09-01T12:00:00Z",
    ...overrides,
  };
}

test("account identity trims, strips exactly one leading @, and lowercases", () => {
  assert.equal(normalizeAccountId("  @DramaExpedition "), "dramaexpedition");
  assert.throws(() => normalizeAccountId("@@DramaExpedition"), (error) => error.code === "source_account_invalid");
  assert.throws(() => normalizeAccountId(" @ "), (error) => error.code === "source_account_invalid");
});

test("missing source database fails closed without creating a file", () => {
  const path = sourcePath();
  assert.equal(existsSync(path), false);
  assert.throws(() => readLatestPosts(path), (error) => error.code === "source_open_failed");
  assert.equal(existsSync(path), false);
});

test("partial source schemas fail closed instead of returning an empty result", () => {
  const { path, db } = createSourceDb({ accountTable: false, postTables: false });
  db.exec("CREATE TABLE posts (post_id TEXT)");
  db.close();
  assert.throws(() => readLatestPosts(path), (error) => error.code === "source_schema_invalid");
  assert.throws(() => readLatestAccounts(path), (error) => error.code === "source_schema_invalid");
});

test("an empty authoritative collector schema is a valid zero", () => {
  const { path, db } = createSourceDb();
  db.close();
  assert.deepEqual(readLatestAccounts(path), []);
  assert.deepEqual(readLatestPosts(path), []);
});

test("source schema validation rejects type, nullability, and key drift before returning zero", async (t) => {
  await t.test("all-BLOB columns without primary keys", () => {
    const path = sourcePath();
    const db = new DatabaseSync(path);
    db.exec(`
      CREATE TABLE account_snapshots (
        snapshot_date BLOB, captured_at BLOB, username BLOB, account_url BLOB,
        nickname BLOB, followers BLOB, following BLOB, total_likes BLOB,
        total_posts BLOB, bio BLOB, collection_status BLOB
      );
      CREATE TABLE posts (
        post_id BLOB, username BLOB, post_url BLOB, content_type BLOB,
        published_at BLOB, caption BLOB, first_seen_at BLOB, last_seen_at BLOB
      );
      CREATE TABLE post_snapshots (
        snapshot_date BLOB, captured_at BLOB, post_id BLOB, username BLOB,
        views BLOB, likes BLOB, comments BLOB, favorites BLOB, shares BLOB,
        collection_status BLOB, missing_fields BLOB
      );
    `);
    db.close();
    assert.throws(() => readLatestAccounts(path), (error) => error.code === "source_schema_invalid");
    assert.throws(() => readLatestPosts(path), (error) => error.code === "source_schema_invalid");
  });

  await t.test("view masquerading as posts table", () => {
    const path = sourcePath();
    const db = new DatabaseSync(path);
    db.exec(`
      CREATE TABLE posts_backing (
        post_id TEXT PRIMARY KEY, username TEXT NOT NULL, post_url TEXT NOT NULL,
        content_type TEXT, published_at TEXT, caption TEXT,
        first_seen_at TEXT NOT NULL, last_seen_at TEXT NOT NULL
      );
      CREATE VIEW posts AS SELECT * FROM posts_backing;
      CREATE TABLE post_snapshots (
        snapshot_date TEXT NOT NULL, captured_at TEXT NOT NULL, post_id TEXT NOT NULL,
        username TEXT NOT NULL, views INTEGER, likes INTEGER, comments INTEGER,
        favorites INTEGER, shares INTEGER, collection_status TEXT NOT NULL,
        missing_fields TEXT NOT NULL, PRIMARY KEY(post_id, snapshot_date),
        FOREIGN KEY (post_id) REFERENCES posts(post_id)
      );
    `);
    db.close();
    assert.throws(() => readLatestPosts(path), (error) => error.code === "source_schema_invalid");
  });

  const postsDdl = ({ postIdType = "TEXT", usernameNotNull = true } = {}) => `
    CREATE TABLE posts (
      post_id ${postIdType} PRIMARY KEY, username TEXT${usernameNotNull ? " NOT NULL" : ""},
      post_url TEXT NOT NULL, content_type TEXT, published_at TEXT, caption TEXT,
      first_seen_at TEXT NOT NULL, last_seen_at TEXT NOT NULL
    );
  `;
  for (const [name, ddl] of [
    ["wrong declared type", postsDdl({ postIdType: "BLOB" })],
    ["wrong NOT NULL flag", postsDdl({ usernameNotNull: false })],
  ]) {
    await t.test(name, () => {
      const path = sourcePath();
      const db = new DatabaseSync(path);
      db.exec(ddl);
      db.close();
      assert.throws(() => readLatestPosts(path), (error) => error.code === "source_schema_invalid");
    });
  }

  await t.test("wrong composite primary-key order", () => {
    const { path, db } = createSourceDb();
    db.exec(`
      DROP TABLE post_snapshots;
      CREATE TABLE post_snapshots (
        snapshot_date TEXT NOT NULL, captured_at TEXT NOT NULL, post_id TEXT NOT NULL,
        username TEXT NOT NULL, views INTEGER, likes INTEGER, comments INTEGER,
        favorites INTEGER, shares INTEGER, collection_status TEXT NOT NULL,
        missing_fields TEXT NOT NULL, PRIMARY KEY(snapshot_date, post_id),
        FOREIGN KEY (post_id) REFERENCES posts(post_id)
      );
    `);
    db.close();
    assert.throws(() => readLatestPosts(path), (error) => error.code === "source_schema_invalid");
  });
});

test("post snapshot schema requires the collector post foreign key", async (t) => {
  for (const [name, foreignKey] of [
    ["missing", ""],
    ["wrong target", ", FOREIGN KEY (post_id) REFERENCES posts(username)"],
  ]) {
    await t.test(name, () => {
      const { path, db } = createSourceDb();
      db.exec(`
        DROP TABLE post_snapshots;
        CREATE TABLE post_snapshots (
          snapshot_date TEXT NOT NULL, captured_at TEXT NOT NULL, post_id TEXT NOT NULL,
          username TEXT NOT NULL, views INTEGER, likes INTEGER, comments INTEGER,
          favorites INTEGER, shares INTEGER, collection_status TEXT NOT NULL,
          missing_fields TEXT NOT NULL, PRIMARY KEY(post_id, snapshot_date)
          ${foreignKey}
        );
      `);
      db.close();
      assert.throws(() => readLatestPosts(path), (error) => error.code === "source_schema_invalid");
    });
  }

  await t.test("composite foreign key cannot masquerade as the required single-column group", () => {
    const { path, db } = createSourceDb();
    db.exec(`
      DROP TABLE post_snapshots;
      CREATE UNIQUE INDEX posts_post_id_username ON posts(post_id, username);
      CREATE TABLE post_snapshots (
        snapshot_date TEXT NOT NULL, captured_at TEXT NOT NULL, post_id TEXT NOT NULL,
        username TEXT NOT NULL, views INTEGER, likes INTEGER, comments INTEGER,
        favorites INTEGER, shares INTEGER, collection_status TEXT NOT NULL,
        missing_fields TEXT NOT NULL, PRIMARY KEY(post_id, snapshot_date),
        FOREIGN KEY (post_id, username) REFERENCES posts(post_id, username)
      );
    `);
    db.close();
    assert.throws(() => readLatestPosts(path), (error) => error.code === "source_schema_invalid");
  });

  await t.test("unrelated additive foreign-key group remains safe", () => {
    const { path, db } = createSourceDb();
    db.exec(`
      DROP TABLE post_snapshots;
      CREATE UNIQUE INDEX posts_username ON posts(username);
      CREATE TABLE post_snapshots (
        snapshot_date TEXT NOT NULL, captured_at TEXT NOT NULL, post_id TEXT NOT NULL,
        username TEXT NOT NULL, views INTEGER, likes INTEGER, comments INTEGER,
        favorites INTEGER, shares INTEGER, collection_status TEXT NOT NULL,
        missing_fields TEXT NOT NULL, PRIMARY KEY(post_id, snapshot_date),
        FOREIGN KEY (post_id) REFERENCES posts(post_id),
        FOREIGN KEY (username) REFERENCES posts(username)
      );
    `);
    db.close();
    assert.deepEqual(readLatestPosts(path), []);
  });
});

test("latest accounts use the collector's successful non-null-follower semantics and canonical order", () => {
  const { path, db } = createSourceDb();
  insertAccount(db, { username: "Zed", snapshotDate: "2026-08-30", followers: 9 });
  insertAccount(db, { username: "Zed", snapshotDate: "2026-09-01", followers: null, collectionStatus: "complete" });
  insertAccount(db, { username: "Zed", snapshotDate: "2026-09-02", followers: 999, collectionStatus: "partial" });
  insertAccount(db, { username: "@Alpha", snapshotDate: "2026-09-01", followers: 5 });
  db.close();
  const rows = readLatestAccounts(path);
  assert.deepEqual(rows.map((row) => [row.username, row.snapshot_date, row.followers]), [
    ["alpha", "2026-09-01", 5],
    ["zed", "2026-08-30", 9],
  ]);
});

test("canonical collisions in latest account rows fail closed", () => {
  const { path, db } = createSourceDb();
  insertAccount(db, { username: "Drama", snapshotDate: "2026-09-01" });
  insertAccount(db, { username: "@drama", snapshotDate: "2026-09-02" });
  db.close();
  assert.throws(() => readLatestAccounts(path), (error) => error.code === "source_account_collision");
});

test("latest posts return one canonical row per Post ID and never project daily history", () => {
  const { path, db } = createSourceDb();
  insertPost(db, { username: "@DramaExpedition" });
  insertSnapshot(db, {
    snapshotDate: "2026-08-31", capturedAt: "2026-08-31T13:00:00Z",
    username: "dramaexpedition", views: 10,
  });
  insertSnapshot(db, { username: "DRAMAEXPEDITION", views: 20 });
  db.close();
  const rows = readLatestPosts(path);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].views, 20);
  assert.equal(rows[0].snapshot_date, "2026-09-01");
  assert.equal(rows[0].username, "dramaexpedition");
  assert.deepEqual(rows[0].missing_fields, []);
  assert.equal(typeof rows[0].missing_fields, "object");
});

test("real SQLite reader output is accepted by migration planning without shape translation", async () => {
  const { path, db } = createSourceDb();
  insertPost(db);
  insertSnapshot(db, {
    comments: null,
    collectionStatus: "partial",
    missingFields: '["comments"]',
  });
  db.close();
  const rows = readLatestPosts(path);
  assert.deepEqual(rows[0].missing_fields, ["comments"]);
  const baseSchema = {
    revision: "precreated-r1",
    tables: ["账号台账", "选剧池", "采集数据", "发布记录"].map((name, index) => ({
      name, table_id: `tbl-${index}`, record_count: 0,
      fields: [{ field_id: `fld-${index}`, name: "文本", type: "text", is_primary: true }],
    })),
  };
  const manifest = await planMigration({
    baseBindingSha256: "b".repeat(64),
    baseSchema,
    google: {
      revision: "google-r1",
      raw_backup: {},
      accounts: [{ 账号ID: "dramaexpedition", 账号名: "dramaexpedition", 主页链接: "https://www.tiktok.com/@dramaexpedition" }],
      dramas: [],
      releases: [],
      captures: [],
    },
    captures: rows,
  });
  assert.deepEqual(manifest.captures[0].缺失字段, ["comments"]);
  assert.equal(manifest.blocked.some((item) => item.code === "migration_source_invalid"), false);
});

test("latest posts have deterministic account, published_at, Post ID order", () => {
  const { path, db } = createSourceDb();
  for (const row of [
    { postId: "100", username: "b", publishedAt: "2026-09-01T02:00:00Z" },
    { postId: "2", username: "A", publishedAt: "2026-09-01T03:00:00Z" },
    { postId: "1", username: "a", publishedAt: "2026-09-01T01:00:00Z" },
  ]) {
    insertPost(db, row);
    insertSnapshot(db, { postId: row.postId, username: row.username });
  }
  db.close();
  assert.deepEqual(readLatestPosts(path).map((row) => row.post_id), ["1", "2", "100"]);
});

test("source readers reject malformed rows and account disagreement", async (t) => {
  const cases = [
    ["non-numeric Post ID", ({ db }) => {
      insertPost(db, { postId: "not-a-number" });
      insertSnapshot(db, { postId: "not-a-number" });
    }, "source_post_invalid"],
    ["unsafe metric", ({ db }) => {
      insertPost(db);
      insertSnapshot(db, { views: Number.MAX_SAFE_INTEGER + 1 });
    }, "source_metric_invalid"],
    ["post/snapshot account disagreement", ({ db }) => {
      insertPost(db, { username: "one" });
      insertSnapshot(db, { username: "two" });
    }, "source_account_mismatch"],
  ];
  for (const [name, seed, code] of cases) {
    await t.test(name, () => {
      const source = createSourceDb();
      seed(source);
      source.db.close();
      assert.throws(() => readLatestPosts(source.path), (error) => error.code === code);
    });
  }
});

test("source readers reject malformed dates and URLs rather than guessing", () => {
  const { path, db } = createSourceDb();
  insertPost(db, { postUrl: "javascript:alert(1)", publishedAt: "2026-09-01 12:00" });
  insertSnapshot(db);
  db.close();
  assert.throws(() => readLatestPosts(path), (error) => ["source_url_invalid", "source_timestamp_invalid"].includes(error.code));
});

test("source timestamps reject calendar, clock, and timezone normalization", async (t) => {
  const invalidTimestamps = [
    "2026-02-30T00:00:00Z",
    "2026-02-29T00:00:00Z",
    "2026-01-01T24:00:00Z",
    "2026-01-01T00:60:00Z",
    "2026-01-01T00:00:60Z",
    "2026-01-01T00:00:00+14:01",
    "2026-01-01T00:00:00+15:00",
  ];
  for (const timestamp of invalidTimestamps) {
    await t.test(timestamp, () => {
      const { path, db } = createSourceDb();
      insertPost(db, { publishedAt: timestamp });
      insertSnapshot(db);
      db.close();
      assert.throws(() => readLatestPosts(path), (error) => error.code === "source_timestamp_invalid");
    });
  }

  const { path, db } = createSourceDb();
  insertPost(db, {
    publishedAt: "2024-02-29T23:59:59.123456789+14:00",
    firstSeenAt: "0099-01-01T00:00Z",
  });
  insertSnapshot(db);
  db.close();
  assert.equal(readLatestPosts(path)[0].published_at, "2024-02-29T23:59:59.123456789+14:00");
});

test("source URL handles use the same canonical account boundary", async (t) => {
  await t.test("account URL mismatch", () => {
    const { path, db } = createSourceDb();
    insertAccount(db, { username: "drama", accountUrl: "https://www.tiktok.com/@other" });
    db.close();
    assert.throws(() => readLatestAccounts(path), (error) => error.code === "source_account_mismatch");
  });
  await t.test("post URL mismatch", () => {
    const { path, db } = createSourceDb();
    insertPost(db, { username: "drama", postUrl: "https://www.tiktok.com/@other/video/99" });
    insertSnapshot(db, { username: "drama" });
    db.close();
    assert.throws(() => readLatestPosts(path), (error) => error.code === "source_account_mismatch");
  });
});

test("capture mapping emits only writable v3 fields and preserves zero versus null", () => {
  const fields = toCaptureFields({
    post_id: "99", username: "dramaexpedition",
    post_url: "https://www.tiktok.com/@dramaexpedition/video/99",
    snapshot_date: "2026-09-01", captured_at: "2026-09-01T13:00:00Z", published_at: null,
    views: 20, likes: 0, comments: null, favorites: 1, shares: 0,
    collection_status: "partial", missing_fields: ["comments"],
  }, " run-1 ", " rec-account ");
  assert.deepEqual(fields, {
    "Post ID": "99", "快照日期": "2026-09-01", "采集时间": "2026-09-01T13:00:00Z",
    "账号": [{ id: "rec-account" }], "视频链接": "https://www.tiktok.com/@dramaexpedition/video/99",
    "发布时间": null, "播放量": 20, "点赞": 0, "评论": null, "收藏": 1, "转发": 0,
    "业务": "short-drama", "采集状态": "partial", "缺失字段": ["comments"], "来源 run_id": "run-1",
  });
  assert.equal(Object.hasOwn(fields, "Base 同步时间"), false);
  assert.equal(Object.hasOwn(fields, "账号名"), false);
  assert.equal(Object.hasOwn(fields, "关联发布记录"), false);
});

test("capture mapping validates missing fields, status, metrics, and identifiers exactly", async (t) => {
  const base = {
    post_id: "99", username: "a", post_url: "https://www.tiktok.com/@a/video/99",
    snapshot_date: "2026-09-01", captured_at: "2026-09-01T13:00:00Z", published_at: null,
    views: 1, likes: 2, comments: 3, favorites: 4, shares: 5,
    collection_status: "complete", missing_fields: [],
  };
  const cases = [
    [{ ...base, comments: null, missing_fields: [], collection_status: "partial" }, "source_missing_fields_invalid"],
    [{ ...base, comments: null, missing_fields: ["comments", "comments"], collection_status: "partial" }, "source_missing_fields_invalid"],
    [{ ...base, missing_fields: ["unknown"], collection_status: "partial" }, "source_missing_fields_invalid"],
    [{ ...base, missing_fields: "not-json" }, "source_missing_fields_invalid"],
    [{ ...base, collection_status: "partial" }, "source_collection_status_invalid"],
    [{ ...base, views: -1 }, "source_metric_invalid"],
  ];
  for (const [post, code] of cases) {
    await t.test(code, () => {
      assert.throws(() => toCaptureFields(post, "run", "rec"), (error) => error.code === code);
    });
  }
  assert.throws(() => toCaptureFields(base, " ", "rec"), (error) => error.code === "source_identifier_invalid");
  assert.throws(() => toCaptureFields(base, "run", " rec\naccount "), (error) => error.code === "source_identifier_invalid");
  assert.deepEqual(METRICS, ["views", "likes", "comments", "favorites", "shares"]);
});

test("manual URL exact match outranks time matching and accepts photo paths", () => {
  const captures = [
    capture({ post_id: "98", post_url: "https://www.tiktok.com/@dramaexpedition/video/98", published_at: "2026-09-03T00:00:00+08:00" }),
    capture({ post_url: "https://m.tiktok.com/@DramaExpedition/photo/99?lang=en" }),
  ];
  const result = matchReleaseToCapture(
    { 发布ID: "SR-1", 账号ID: "@DramaExpedition", 视频链接: captures[1].post_url, 日期: "2026-09-03T00:00:00+08:00" },
    captures,
    new Set(),
  );
  assert.deepEqual({ status: result.status, method: result.method, reason: result.reason, id: result.post.post_id }, {
    status: "matched", method: "manual_url", reason: "manual_url_exact", id: "99",
  });
  assert.equal(Object.hasOwn(result, "confidence"), false);
});

test("explicit Post ID exact match is account-bound and does not time-fallback", async (t) => {
  const captures = [capture(), capture({ post_id: "100", username: "other", post_url: "https://www.tiktok.com/@other/video/100" })];
  const matched = matchReleaseToCapture({ 账号ID: "dramaexpedition", "Post ID": "99" }, captures, new Set());
  assert.equal(matched.method, "exact_post_id");
  assert.equal(Object.hasOwn(matched, "confidence"), false);
  for (const [name, release, claimed, reason] of [
    ["missing", { 账号ID: "dramaexpedition", "Post ID": "101", 日期: "2026-09-01" }, new Set(), "manual_post_not_found"],
    ["wrong account", { 账号ID: "dramaexpedition", "Post ID": "100", 日期: "2026-09-01" }, new Set(), "manual_post_account_mismatch"],
    ["claimed", { 账号ID: "dramaexpedition", "Post ID": "99", 日期: "2026-09-01" }, new Set(["99"]), "manual_post_claimed"],
    ["invalid", { 账号ID: "dramaexpedition", "Post ID": " 99 ", 日期: "2026-09-01" }, new Set(), "manual_post_invalid"],
  ]) {
    await t.test(name, () => {
      const result = matchReleaseToCapture(release, captures, claimed);
      assert.equal(result.status, "unmatched");
      assert.equal(result.reason, reason);
      assert.equal(result.method, undefined);
      assert.equal(result.post, undefined);
    });
  }
});

test("manual URL parser rejects non-TikTok, loose paths, account mismatch, and claimed posts without fallback", async (t) => {
  const captures = [capture()];
  const cases = [
    ["wrong host", "https://example.com/@dramaexpedition/video/99", new Set(), "manual_url_invalid"],
    ["deceptive host", "https://tiktok.com.evil.example/@dramaexpedition/video/99", new Set(), "manual_url_invalid"],
    ["loose path", "https://www.tiktok.com/x/@dramaexpedition/video/99/more", new Set(), "manual_url_invalid"],
    ["account mismatch", "https://www.tiktok.com/@other/video/99", new Set(), "manual_account_mismatch"],
    ["claimed", "https://www.tiktok.com/@dramaexpedition/video/99", new Set(["99"]), "manual_post_claimed"],
  ];
  for (const [name, url, claimed, reason] of cases) {
    await t.test(name, () => {
      const result = matchReleaseToCapture({ 账号ID: "dramaexpedition", 视频链接: url, 日期: "2026-09-01" }, captures, claimed);
      assert.equal(result.status, "unmatched");
      assert.equal(result.reason, reason);
    });
  }
});

test("disagreeing manual URL and Post ID is ambiguous and never falls back", () => {
  const result = matchReleaseToCapture({
    账号ID: "dramaexpedition", "Post ID": "100",
    视频链接: "https://www.tiktok.com/@dramaexpedition/video/99", 日期: "2026-09-01",
  }, [capture(), capture({ post_id: "100", post_url: "https://www.tiktok.com/@dramaexpedition/video/100" })], new Set());
  assert.deepEqual(result, { status: "ambiguous", reason: "manual_identifier_conflict", candidates: [] });
});

test("timezone-qualified datetime matches exactly one same-account unclaimed post in inclusive six hours", () => {
  const captures = [
    capture({ post_id: "1", published_at: "2026-09-01T00:00:00Z" }),
    capture({ post_id: "2", post_url: "https://www.tiktok.com/@dramaexpedition/video/2", published_at: "2026-09-01T12:00:01Z" }),
    capture({ post_id: "3", username: "other", post_url: "https://www.tiktok.com/@other/video/3", published_at: "2026-09-01T06:00:00Z" }),
  ];
  const result = matchReleaseToCapture(
    { 账号ID: "dramaexpedition", 日期: "2026-09-01T06:00:00Z" }, captures, new Set(["2"]),
  );
  assert.equal(result.status, "matched");
  assert.equal(result.method, "account_time");
  assert.equal(result.post.post_id, "1");
});

test("qualified datetime parsing is calendar-exact and shared by release and capture validation", async (t) => {
  const invalid = [
    "2026-02-30T00:00:00Z",
    "2026-02-29T00:00:00Z",
    "2026-01-01T24:00:00Z",
    "2026-01-01T00:60:00Z",
    "2026-01-01T00:00:60Z",
    "2026-01-01T00:00:00-14:01",
    "2026-01-01T00:00:00-15:00",
  ];
  for (const timestamp of invalid) {
    await t.test(`release ${timestamp}`, () => {
      const result = matchReleaseToCapture(
        { 账号ID: "dramaexpedition", 日期: timestamp },
        [capture({ published_at: "2026-03-02T00:00:00Z" })],
        new Set(),
      );
      assert.deepEqual(result, { status: "unmatched", reason: "release_datetime_invalid", candidates: [] });
    });
    await t.test(`capture ${timestamp}`, () => {
      assert.throws(
        () => matchReleaseToCapture(
          { 账号ID: "dramaexpedition", 日期: "2026-03-02T00:00:00Z" },
          [capture({ published_at: timestamp })],
          new Set(),
        ),
        (error) => error.code === "matcher_capture_invalid",
      );
    });
  }

  for (const timestamp of [
    "2024-02-29T12:34Z",
    "0099-01-01T00:00:00Z",
    "2026-01-01T14:00:00+14:00",
    "2026-01-01T00:00:00.123456789Z",
  ]) {
    await t.test(`valid ${timestamp}`, () => {
      const result = matchReleaseToCapture(
        { 账号ID: "dramaexpedition", 日期: timestamp },
        [capture({ published_at: timestamp })],
        new Set(),
      );
      assert.equal(result.status, "matched");
      assert.equal(result.post.post_id, "99");
    });
  }
});

test("an invalid normalized release timestamp never auto-matches the normalized later-day post", () => {
  const result = matchReleaseToCapture(
    { 账号ID: "dramaexpedition", 日期: "2026-02-30T00:00:00Z" },
    [capture({ published_at: "2026-03-02T00:00:00Z" })],
    new Set(),
  );
  assert.deepEqual(result, { status: "unmatched", reason: "release_datetime_invalid", candidates: [] });
});

test("multiple datetime candidates are ambiguous and deterministically sorted", () => {
  const result = matchReleaseToCapture(
    { 账号ID: "dramaexpedition", 日期: "2026-09-01T06:00:00Z" },
    [capture({ post_id: "100", published_at: "2026-09-01T02:00:00Z" }), capture({ post_id: "99", published_at: "2026-09-01T01:00:00Z" })],
    new Set(),
  );
  assert.equal(result.status, "ambiguous");
  assert.equal(result.reason, "ambiguous_post_match");
  assert.deepEqual(result.candidates.map((row) => row.post_id), ["99", "100"]);
});

test("date-only matching uses the Beijing natural date", () => {
  const result = matchReleaseToCapture(
    { 账号ID: "dramaexpedition", 日期: "2026-09-02" },
    [capture({ published_at: "2026-09-01T16:01:00Z" })],
    new Set(),
  );
  assert.equal(result.status, "matched");
  assert.equal(result.post.post_id, "99");
});

test("naive datetimes and blank accounts are safe unmatched results", () => {
  const naive = matchReleaseToCapture({ 账号ID: "dramaexpedition", 日期: "2026-09-01T12:00:00" }, [capture()], new Set());
  assert.deepEqual(naive, { status: "unmatched", reason: "release_datetime_invalid", candidates: [] });
  const blank = matchReleaseToCapture({ 账号ID: " @ ", 日期: "2026-09-01" }, [capture()], new Set());
  assert.deepEqual(blank, { status: "unmatched", reason: "release_account_invalid", candidates: [] });
});

test("other unmatched cases return sorted candidates and never claim or mutate inputs", () => {
  const releases = { 账号ID: "DRAMAEXPEDITION" };
  const captures = [capture({ post_id: "100", published_at: "2026-09-02T00:00:00Z" }), capture({ post_id: "99", published_at: "2026-09-01T00:00:00Z" })];
  const claimed = new Set(["100"]);
  const before = structuredClone({ releases, captures });
  const result = matchReleaseToCapture(releases, captures, claimed);
  assert.deepEqual(result, { status: "unmatched", reason: "release_date_missing", candidates: [captures[1]] });
  assert.deepEqual({ releases, captures }, before);
  assert.deepEqual([...claimed], ["100"]);
  result.candidates[0].username = "mutated output";
  assert.equal(captures[1].username, "dramaexpedition");
});

test("matcher rejects malformed captures, duplicate Post IDs, and invalid claimed sets", async (t) => {
  const release = { 账号ID: "dramaexpedition", 日期: "2026-09-01" };
  const cases = [
    [null, new Set(), "matcher_captures_invalid"],
    [[capture({ post_id: "x" })], new Set(), "matcher_capture_invalid"],
    [[capture(), capture()], new Set(), "matcher_capture_duplicate"],
    [[capture()], ["99"], "matcher_claimed_invalid"],
    [[capture()], new Set([" 99 "]), "matcher_claimed_invalid"],
  ];
  for (const [captures, claimed, code] of cases) {
    await t.test(code, () => {
      assert.throws(() => matchReleaseToCapture(release, captures, claimed), (error) => error.code === code);
    });
  }
});
