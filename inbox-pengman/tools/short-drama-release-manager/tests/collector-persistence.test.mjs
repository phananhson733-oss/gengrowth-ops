import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { readViewHighWater, saveLocalHistory } from '../../tiktok-public-capture/persistence.mjs';

const post = (metrics) => ({ username: 'alice', post_id: '1', post_url: 'https://www.tiktok.com/@alice/video/1', content_type: 'video',
  published_at: '2026-09-20T00:00:00.000Z', caption: 'c', views: null, likes: null, comments: null, favorites: null, shares: null, ...metrics });
const save = (outputDir, snapshotDate, capturedAt, metrics) => saveLocalHistory({ outputDir, snapshotDate, capturedAt, usernames: ['alice'], accounts: [], posts: [post(metrics)], errors: [] });
const snapshot = (outputDir, snapshotDate) => {
  const db = new DatabaseSync(path.join(outputDir, 'tiktok_metrics.sqlite'), { readOnly: true });
  try { return { ...db.prepare('SELECT views,likes,comments,favorites,shares,collection_status,missing_fields,captured_at FROM post_snapshots WHERE post_id=? AND snapshot_date=?').get('1', snapshotDate) }; }
  finally { db.close(); }
};
const highWater = (outputDir, captureDate, capturedAt) => {
  const db = new DatabaseSync(path.join(outputDir, 'tiktok_metrics.sqlite'), { readOnly: true });
  try { return readViewHighWater(db, { captureDate, capturedAt }); } finally { db.close(); }
};
const full = { views: 1000, likes: 50, comments: 5, favorites: 4, shares: 3 };

test('a later same-day run that could not read a metric keeps the value the earlier run captured', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'collector-persistence-'));
  try {
    save(dir, '2026-09-29', '2026-09-29T01:00:00.000Z', full);
    const second = save(dir, '2026-09-29', '2026-09-29T05:00:00.000Z', { likes: 60 });
    const row = snapshot(dir, '2026-09-29');
    assert.deepEqual([row.views, row.likes, row.comments, row.favorites, row.shares], [1000, 60, 5, 4, 3]);
    // The Runner rejects a row whose status or missing list disagrees with its null metrics.
    assert.equal(row.collection_status, 'complete');
    assert.equal(row.missing_fields, '[]');
    assert.equal(row.captured_at, '2026-09-29T05:00:00.000Z');
    assert.equal(second.partial_count, 0);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('a new day never inherits the previous day metrics', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'collector-persistence-'));
  try {
    save(dir, '2026-09-28', '2026-09-28T01:00:00.000Z', full);
    const next = save(dir, '2026-09-29', '2026-09-29T01:00:00.000Z', { likes: 60 });
    const row = snapshot(dir, '2026-09-29');
    assert.deepEqual([row.views, row.likes, row.comments], [null, 60, null]);
    assert.equal(row.collection_status, 'partial');
    assert.deepEqual(JSON.parse(row.missing_fields), ['views', 'comments', 'favorites', 'shares']);
    assert.equal(next.partial_count, 1);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('view evidence is the highest value stored before this run, so an accepted zero cannot disarm the guard', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'collector-persistence-'));
  try {
    save(dir, '2026-09-26', '2026-09-26T01:00:00.000Z', { ...full, views: 900 });
    save(dir, '2026-09-27', '2026-09-27T01:00:00.000Z', { ...full, views: 0 });
    save(dir, '2026-09-29', '2026-09-29T01:00:00.000Z', { ...full, views: 1500 });
    assert.equal(highWater(dir, '2026-09-28', '2026-09-28T01:00:00.000Z').get('1'), 900);
    // An earlier run on the same Beijing day counts; this run's own row does not.
    assert.equal(highWater(dir, '2026-09-29', '2026-09-29T05:00:00.000Z').get('1'), 1500);
    assert.equal(highWater(dir, '2026-09-29', '2026-09-29T01:00:00.000Z').get('1'), 900);
    assert.equal(highWater(dir, '2026-09-26', '2026-09-26T01:00:00.000Z').has('1'), false);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('a run without a detail does not erase the media type already known for a post', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'collector-persistence-'));
  const type = () => {
    const db = new DatabaseSync(path.join(dir, 'tiktok_metrics.sqlite'), { readOnly: true });
    try { return db.prepare('SELECT content_type FROM posts WHERE post_id=?').get('1').content_type; } finally { db.close(); }
  };
  try {
    save(dir, '2026-09-28', '2026-09-28T01:00:00.000Z', full);
    assert.equal(type(), 'video');
    save(dir, '2026-09-29', '2026-09-29T01:00:00.000Z', { views: 1100, content_type: 'unknown' });
    assert.equal(type(), 'video');
    save(dir, '2026-09-30', '2026-09-30T01:00:00.000Z', { ...full, content_type: 'photo' });
    assert.equal(type(), 'photo');
  } finally { await rm(dir, { recursive: true, force: true }); }
});
