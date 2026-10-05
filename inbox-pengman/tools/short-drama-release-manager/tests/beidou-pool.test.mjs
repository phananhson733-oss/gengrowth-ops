import assert from 'node:assert/strict';
import test from 'node:test';

import { JobStore } from '../src/job-store.mjs';
import { processBeidouPool } from '../src/beidou-pool.mjs';

const baseToken = 'base-test';
const tableId = 'tbl-test';
const fixedNow = new Date('2026-09-23T12:00:00.000Z');
const candidate = (platform, id, title) => ({ sourceId: `${platform}:${id}`, platform, serialId: id,
  thirdSerialId: id, title, titleCn: '', languageId: 2, category: '狼人', tag: '', publishAt: '2026-08-21 13:55:09' });

function fakeClient(records) {
  const byId = new Map(records.map((record) => [record.record_id, structuredClone(record)]));
  const updates = [];
  return {
    byId, updates,
    async listFields() { return { complete: true, items: [
      { name: '北斗候选', type: 'text' }, { name: '北斗选定ID', type: 'text' },
      { name: '平台', type: 'select', options: [{ name: 'ReelShort' }, { name: 'DramaBox' }] },
      { name: '语言', type: 'select', options: [{ name: '英语' }] },
      { name: '剧分类', type: 'select', options: [{ name: '狼人' }] },
      { name: '上线日期', type: 'datetime' },
    ] }; },
    async listRecords() { return { complete: true, items: [...byId.values()].map((record) => structuredClone(record)) }; },
    async getRecord(_base, _table, id) { return structuredClone(byId.get(id)); },
    async updateRecords(_base, _table, writes) {
      for (const write of writes) {
        updates.push(structuredClone(write));
        Object.assign(byId.get(write.record_id).fields, structuredClone(write.fields));
      }
      return writes.map((write) => ({ record_id: write.record_id }));
    },
  };
}

function row(id, title) { return { record_id: id, fields: { 剧ID: `SD-${id}`, 剧名: title,
  创建时间: '2026-09-23T10:00:00.000+08:00', 来源: ['Google Trends'], 平台: null, 语言: null,
  剧分类: [], 上线日期: null, 北斗候选: null, 北斗选定ID: null, 归档状态: 'active' } }; }

function deps(client, jobs, findCandidates) { return { client, jobs, baseToken, tableId, apiKey: 'test-key',
  startAt: '2026-09-22T00:00:00.000Z', now: () => fixedNow, findCandidates,
  withMutationLock: async (operation) => operation(async () => undefined), maxRows: 5 }; }

test('新行唯一精确候选自动只补空，读回与审计后下一轮不重复查询或写入', async () => {
  const client = fakeClient([row('1', 'Blood Moon Roommates')]);
  const jobs = new JobStore(':memory:');
  let calls = 0;
  const findCandidates = async () => { calls++; return [candidate('reelshort', '7', 'Blood Moon Roommates')]; };
  const first = await processBeidouPool(deps(client, jobs, findCandidates));
  assert.equal(first.updated, 1);
  assert.equal(client.byId.get('1').fields.平台, 'ReelShort');
  assert.equal(client.byId.get('1').fields.上线日期, '2026-08-21');
  assert.deepEqual(client.byId.get('1').fields.来源, ['Google Trends']);
  assert.equal(client.byId.get('1').fields.北斗选定ID, 'reelshort:7');
  const second = await processBeidouPool(deps(client, jobs, findCandidates));
  assert.equal(second.updated, 0);
  assert.equal(calls, 1);
  assert.equal(client.updates.length, 1);
  jobs.close();
});

test('多候选只写候选展示；同事在表内选定后才补业务字段', async () => {
  const client = fakeClient([row('2', 'Blood Moon Roommates')]);
  const jobs = new JobStore(':memory:');
  const findCandidates = async () => [candidate('reelshort', '7', 'Blood Moon Roommates'), candidate('dramabox', '8', 'Blood Moon Roommates')];
  const first = await processBeidouPool(deps(client, jobs, findCandidates));
  assert.equal(first.ambiguous, 1);
  assert.equal(client.byId.get('2').fields.平台, null);
  assert.match(client.byId.get('2').fields.北斗候选, /reelshort:7/);
  assert.match(client.byId.get('2').fields.北斗候选, /dramabox:8/);
  client.byId.get('2').fields.北斗选定ID = 'dramabox:8';
  const second = await processBeidouPool(deps(client, jobs, findCandidates));
  assert.equal(second.updated, 1);
  assert.equal(client.byId.get('2').fields.平台, 'DramaBox');
  assert.equal(client.byId.get('2').fields.北斗选定ID, 'dramabox:8');
  jobs.close();
});

test('填错北斗选定ID时在表内说明原因，不写业务字段', async () => {
  const current = row('9', 'Blood Moon Roommates'); current.fields.北斗选定ID = 'reelshort:wrong';
  const client = fakeClient([current]);
  const jobs = new JobStore(':memory:');
  await processBeidouPool(deps(client, jobs, async () => [candidate('reelshort', '7', 'Blood Moon Roommates')]));
  assert.match(client.byId.get('9').fields.北斗候选, /不在当前候选中/);
  assert.equal(client.byId.get('9').fields.平台, null);
  jobs.close();
});

test('匹配成功但业务字段早已由同事填写时，更新计数保持零', async () => {
  const current = row('10', 'Blood Moon Roommates');
  Object.assign(current.fields, { 平台: 'DramaBox', 语言: '英语', 剧分类: ['狼人'], 上线日期: '2026-09-01' });
  const client = fakeClient([current]); const jobs = new JobStore(':memory:');
  const result = await processBeidouPool(deps(client, jobs, async () => [candidate('reelshort', '7', 'Blood Moon Roommates')]));
  assert.equal(result.updated, 0);
  assert.equal(result.matched, 1);
  assert.equal(client.byId.get('10').fields.平台, 'DramaBox');
  jobs.close();
});

test('启用日期之前的旧行与缺北斗字段的表都不产生写入', async () => {
  const old = row('3', 'Old drama'); old.fields.创建时间 = '2026-09-01T10:00:00.000+08:00';
  const client = fakeClient([old]);
  const jobs = new JobStore(':memory:');
  const oldResult = await processBeidouPool(deps(client, jobs, async () => { throw new Error('must not query'); }));
  assert.equal(oldResult.updated, 0);
  client.listFields = async () => ({ complete: true, items: [{ name: '北斗候选', type: 'text' }] });
  const missing = await processBeidouPool(deps(client, jobs, async () => { throw new Error('must not query'); }));
  assert.equal(missing.status, 'schema_missing');
  assert.equal(client.updates.length, 0);
  jobs.close();
});

test('写入回执不确定时先读回，不因选定ID已写入就重查或重写', async () => {
  const client = fakeClient([row('4', 'Blood Moon Roommates')]);
  const jobs = new JobStore(':memory:');
  const originalUpdate = client.updateRecords;
  let writes = 0;
  client.updateRecords = async (...args) => {
    writes++;
    await originalUpdate(...args);
    throw new Error('timeout after commit');
  };
  let queries = 0;
  const findCandidates = async () => { queries++; return [candidate('reelshort', '7', 'Blood Moon Roommates')]; };
  const first = await processBeidouPool(deps(client, jobs, findCandidates));
  assert.equal(first.status, 'partial');
  const second = await processBeidouPool(deps(client, jobs, findCandidates));
  assert.equal(second.updated, 0);
  assert.equal(writes, 1);
  assert.equal(queries, 1);
  jobs.close();
});

test('一条查询失败会退避，不让它每五分钟占满全部扫描名额', async () => {
  const client = fakeClient([row('5', 'Bad title'), row('6', 'Good title')]);
  const jobs = new JobStore(':memory:');
  const queried = [];
  const findCandidates = async (title) => {
    queried.push(title);
    if (title === 'Bad title') throw new Error('source unavailable');
    return [candidate('reelshort', '9', title)];
  };
  const first = await processBeidouPool({ ...deps(client, jobs, findCandidates), maxRows: 1 });
  assert.equal(first.errors, 1);
  const second = await processBeidouPool({ ...deps(client, jobs, findCandidates), maxRows: 1 });
  assert.equal(second.updated, 1);
  assert.deepEqual(queried, ['Bad title', 'Good title']);
  jobs.close();
});

test('歧义候选写入回执丢失后，同事新选的ID仍会在下一轮触发补齐', async () => {
  const client = fakeClient([row('7', 'Blood Moon Roommates')]);
  const jobs = new JobStore(':memory:');
  const originalUpdate = client.updateRecords;
  client.updateRecords = async (...args) => { await originalUpdate(...args); throw new Error('timeout after commit'); };
  const findCandidates = async () => [candidate('reelshort', '7', 'Blood Moon Roommates'),
    candidate('dramabox', '8', 'Blood Moon Roommates')];
  assert.equal((await processBeidouPool(deps(client, jobs, findCandidates))).status, 'partial');
  client.byId.get('7').fields.北斗选定ID = 'dramabox:8';
  await processBeidouPool(deps(client, jobs, findCandidates)); // settle old candidate-list intent
  client.updateRecords = originalUpdate;
  const final = await processBeidouPool(deps(client, jobs, findCandidates));
  assert.equal(final.updated, 1);
  assert.equal(client.byId.get('7').fields.平台, 'DramaBox');
  jobs.close();
});

test('同事在写入窗口把选定ID从A改为B时不能把A的资料记成B已补齐', async () => {
  const client = fakeClient([row('8', 'Blood Moon Roommates')]);
  const jobs = new JobStore(':memory:');
  const findCandidates = async () => [candidate('reelshort', '7', 'Blood Moon Roommates'),
    candidate('dramabox', '8', 'Blood Moon Roommates')];
  await processBeidouPool(deps(client, jobs, findCandidates));
  client.byId.get('8').fields.北斗选定ID = 'reelshort:7';
  const originalUpdate = client.updateRecords;
  client.updateRecords = async (...args) => {
    const result = await originalUpdate(...args);
    client.byId.get('8').fields.北斗选定ID = 'dramabox:8';
    return result;
  };
  assert.equal((await processBeidouPool(deps(client, jobs, findCandidates))).status, 'partial');
  const latest = jobs.db.prepare("SELECT action FROM audit_events WHERE target_key='8' ORDER BY event_id DESC LIMIT 1").get();
  assert.equal(latest.action, 'beidou_intent');
  assert.equal((await processBeidouPool(deps(client, jobs, findCandidates))).status, 'partial');
  jobs.close();
});
