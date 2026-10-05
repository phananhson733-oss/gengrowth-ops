import assert from 'node:assert/strict';
import test from 'node:test';

import { candidatePatch, formatCandidateList, beidouLanguageName, beidouPlatformName, beidouDatePart } from '../src/beidou-enrichment.mjs';

const candidate = Object.freeze({ sourceId: 'reelshort:286520270568705', platform: 'reelshort', serialId: '286520270568705',
  thirdSerialId: '6a842cd5c76795cc8f0a8e32', title: 'Blood Moon Roommates', titleCn: '', languageId: 2,
  category: '狼人, 复仇', tag: '爱情', publishAt: '2026-08-21 13:55:09' });
const options = Object.freeze({ platforms: ['ReelShort', 'DramaBox', '其他'], languages: ['英语', '法语'], categories: ['狼人', '复仇', '爱情'] });

test('Bot 只读回复使用固定语言/平台名称与已验证日期，不让模型猜代码含义', () => {
  assert.equal(beidouLanguageName(2), '英语');
  assert.equal(beidouPlatformName('reelshort'), 'ReelShort');
  assert.equal(beidouDatePart('2026-09-23 09:50:00'), '2026-09-23');
  assert.equal(beidouLanguageName(999), null);
});

test('唯一候选只补空业务字段，北斗日期直接取合法日期部分，来源保持人工值', () => {
  const patch = candidatePatch(candidate, { 剧名: 'Blood Moon Roommates', 来源: ['鹊娱'], 平台: null, 语言: '', 剧分类: [], 上线日期: null }, options);
  assert.deepEqual(patch, { 平台: 'ReelShort', 语言: '英语', 剧分类: ['狼人', '复仇', '爱情'], 上线日期: '2026-08-21' });
  assert.ok(!Object.hasOwn(patch, '来源'));
  assert.ok(!Object.hasOwn(patch, '剧名'));
});

test('已有人工值与人工清空后的审计决定由调用方保留，不覆盖也不编造未知选项', () => {
  const patch = candidatePatch({ ...candidate, platform: 'stardusttv', languageId: 99, category: '未知分类', tag: '', publishAt: '2026-02-30' },
    { 平台: 'DramaBox', 语言: '法语', 剧分类: ['爱情'], 上线日期: '2026-09-01', 来源: ['Google Trends'] }, options);
  assert.deepEqual(patch, {});
  const unknown = candidatePatch({ ...candidate, platform: 'stardusttv', languageId: 99, category: '未知分类', tag: '', publishAt: '2026-02-30' },
    { 平台: null, 语言: null, 剧分类: [], 上线日期: null }, options);
  assert.deepEqual(unknown, {});
});

test('候选文本保留平台版本与稳定 ID，不能把同名候选压成第一条', () => {
  const lines = formatCandidateList([candidate, { ...candidate, sourceId: 'stardusttv:2', platform: 'stardusttv', serialId: '2' }]);
  assert.match(lines, /reelshort:286520270568705/);
  assert.match(lines, /stardusttv:2/);
  assert.equal(lines.split('\n').length, 2);
});

test('超过展示上限时明确标注未展示数量，精确候选优先且标题不能伪造另一行', () => {
  const rows = Array.from({ length: 51 }, (_unused, index) => ({ ...candidate,
    sourceId: `reelshort:${index}`, title: index === 50 ? 'Exact\n2. fake | ID wrong' : `Fuzzy ${index}` }));
  const text = formatCandidateList(rows, { prioritizeId: 'reelshort:50' });
  assert.match(text, /reelshort:50/);
  assert.match(text, /候选共 51 条，仅显示前 50 条/);
  assert.doesNotMatch(text, /\n2\. fake/);
});
