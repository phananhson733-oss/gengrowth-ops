import assert from 'node:assert/strict';
import test from 'node:test';

import { JobStore } from '../src/job-store.mjs';
import { planBeidouFields, applyBeidouFields } from '../src/beidou-schema.mjs';

function clientWithFields() {
  const fields = [{ field_id: 'fld-name', name: '剧名', type: 'text' }];
  let createCalls = 0;
  return {
    fields,
    get createCalls() { return createCalls; },
    async listFields() { return { complete: true, items: fields.map((field) => ({ ...field })) }; },
    async createField(_base, _table, _name, fieldName) {
      createCalls++;
      const field = { field_id: `fld-new-${createCalls}`, name: fieldName, type: 'text' };
      fields.push(field);
      return field;
    },
  };
}

test('字段计划只读；带同一快照摘要的执行仅新增缺失字段并逐个读回', async () => {
  const client = clientWithFields();
  const jobs = new JobStore(':memory:');
  const plan = await planBeidouFields({ client, baseToken: 'base', tableId: 'tbl' });
  assert.deepEqual(plan.create, ['北斗候选', '北斗选定ID']);
  assert.equal(client.createCalls, 0);
  const applied = await applyBeidouFields({ client, jobs, baseToken: 'base', tableId: 'tbl',
    expectedSha256: plan.sha256, actorId: 'ou_admin' });
  assert.equal(applied.status, 'verified');
  assert.equal(client.createCalls, 2);
  assert.deepEqual((await planBeidouFields({ client, baseToken: 'base', tableId: 'tbl' })).create, []);
  assert.equal(jobs.db.prepare("SELECT count(*) AS n FROM audit_events WHERE action='beidou_schema_result'").get().n, 2);
  jobs.close();
});

test('字段计划过期或已有同名异型字段时拒绝写入', async () => {
  const client = clientWithFields();
  const jobs = new JobStore(':memory:');
  await assert.rejects(() => applyBeidouFields({ client, jobs, baseToken: 'base', tableId: 'tbl',
    expectedSha256: '0'.repeat(64), actorId: 'ou_admin' }), (error) => error.code === 'beidou_schema_stale');
  assert.equal(client.createCalls, 0);
  client.fields.push({ field_id: 'fld-bad', name: '北斗候选', type: 'number' });
  await assert.rejects(() => planBeidouFields({ client, baseToken: 'base', tableId: 'tbl' }),
    (error) => error.code === 'beidou_schema_invalid');
  jobs.close();
});
