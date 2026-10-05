import assert from 'node:assert/strict';
import test from 'node:test';

import { BASE_FIELD_SPECS, OPTIONAL_POOL_FIELDS } from '../src/schema.mjs';
import { fixedFieldDescriptor } from '../src/feishu-client.mjs';

test('北斗候选和选定字段有固定文本合同，但不改动原迁移字段集合', () => {
  assert.deepEqual(OPTIONAL_POOL_FIELDS.map((field) => field.name), ['北斗候选', '北斗选定ID']);
  assert.ok(OPTIONAL_POOL_FIELDS.every((field) => field.kind === 'text'));
  assert.ok(OPTIONAL_POOL_FIELDS.every((field) =>
    !BASE_FIELD_SPECS['选剧池'].some((old) => old.name === field.name)));
  assert.deepEqual(fixedFieldDescriptor('选剧池', '北斗候选'), { name: '北斗候选', type: 'text' });
  assert.deepEqual(fixedFieldDescriptor('选剧池', '北斗选定ID'), { name: '北斗选定ID', type: 'text' });
});
