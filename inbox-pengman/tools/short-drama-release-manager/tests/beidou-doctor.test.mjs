import assert from 'node:assert/strict';
import test from 'node:test';

import { createDispatcher, jobStoreReadOnly, parseCommand } from '../shortdrama_ctl.mjs';

test('Beidou 字段维护走现有本地 doctor 的计划与摘要确认，不成为 Social 业务命令', async () => {
  const plan = parseCommand(['doctor', '--beidou-fields', '--config', 'runtime.json', '--expected-base-token', 'base', '--actor-id', 'ou_admin']);
  assert.equal(plan.options.beidouFields, true);
  assert.equal(plan.options.confirm, undefined);
  const apply = parseCommand(['doctor', '--beidou-fields', '--config', 'runtime.json', '--expected-base-token', 'base',
    '--actor-id', 'ou_admin', '--expected-sha256', 'a'.repeat(64), '--confirm', 'apply-now']);
  assert.equal(apply.options.expectedSha256, 'a'.repeat(64));
  assert.equal(apply.options.confirm, 'apply-now');
  assert.equal(jobStoreReadOnly(plan), true);
  assert.equal(jobStoreReadOnly(apply), false);
  assert.throws(() => parseCommand(['doctor', '--beidou-fields', '--config', 'runtime.json', '--confirm', 'apply-now']),
    (error) => error.code === 'input_invalid');
  let calls = 0;
  const dispatch = createDispatcher({ config: { auth: { isPrivilegedAllowed: (id) => id === 'ou_admin' } },
    doctor: ({ beidouFields }) => { calls++; return { status: beidouFields ? 'planned' : 'unexpected' }; } });
  assert.deepEqual(await dispatch(plan, { actorId: 'ou_admin' }, null), { status: 'planned' });
  assert.equal(calls, 1);
  await assert.rejects(() => dispatch(plan, { actorId: 'ou_reader' }, null), (error) => error.code === 'privileged_required');
});
