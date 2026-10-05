import assert from 'node:assert/strict';
import test from 'node:test';

import { findBeidouCandidates, chooseBeidouCandidate } from '../src/beidou-catalog.mjs';

function page(data, currentPage, totalCount) {
  const body = { code: 0, message: 'ok', body: { data, page: { current_page: currentPage, page_size: 1, total_count: totalCount } } };
  return { id: currentPage, jsonrpc: '2.0', result: { content: [{ type: 'text', text: `# 查询\n\n${JSON.stringify(JSON.stringify(body))}` }], isError: false } };
}

function candidate(appId, serialId, title) {
  return { app_id: appId, serial_id: serialId, third_serial_id: String(serialId), title, title_ch: '', language: 2,
    category: '', tag: '', publish_at: '2026-08-24 23:35:02' };
}

test('北斗按剧名完整翻页，同名不同平台保留为两条待确认候选', async () => {
  const requests = [];
  const responses = [page([candidate('stardusttv', 1, 'BLOOD MOON ROOMMATES')], 1, 2),
    page([candidate('reelshort', 2, 'Blood Moon Roommates')], 2, 2)];
  const fetchImpl = async (_url, options) => {
    requests.push({ headers: options.headers, rpc: JSON.parse(options.body) });
    return { ok: true, status: 200, json: async () => responses[requests.length - 1] };
  };
  const rows = await findBeidouCandidates('Blood Moon Roommates', { apiKey: 'test-key', fetchImpl, pageSize: 1 });
  assert.equal(rows.length, 2);
  assert.deepEqual(rows.map((row) => row.platform), ['stardusttv', 'reelshort']);
  assert.equal(chooseBeidouCandidate('Blood Moon Roommates', rows).status, 'ambiguous');
  assert.deepEqual(requests.map((request) => request.rpc.params.arguments.page_num), [1, 2]);
  assert.ok(requests.every((request) => request.headers['x-api-key'] === 'test-key'));
  assert.ok(requests.every((request) => request.rpc.params.name === 'get_api_fb_task_page'));
});

test('仅有一条精确剧名时才自动选定，模糊命中与零结果均不猜', () => {
  const exact = candidate('reelshort', 2, 'Blood Moon Roommates');
  const fuzzy = candidate('dramabox', 3, 'Blood Moon Roommates Again');
  const rows = [exact, fuzzy].map((row) => ({ ...row, platform: row.app_id, sourceId: `${row.app_id}:${row.serial_id}` }));
  assert.equal(chooseBeidouCandidate('Blood Moon Roommates', rows).candidate.sourceId, 'reelshort:2');
  assert.equal(chooseBeidouCandidate('Unrelated Drama', rows).status, 'needs_review');
  assert.equal(chooseBeidouCandidate('Unrelated Drama', []).status, 'not_found');
});

test('北斗返回不完整分页时拒绝把第一页当成全部候选', async () => {
  const fetchImpl = async () => ({ ok: true, status: 200, json: async () => page([], 1, 2) });
  await assert.rejects(() => findBeidouCandidates('Blood Moon Roommates', { apiKey: 'test-key', fetchImpl, pageSize: 1 }),
    (error) => error.code === 'beidou_response_incomplete');
});

test('未配置密钥时不发请求', async () => {
  let calls = 0;
  await assert.rejects(() => findBeidouCandidates('Blood Moon Roommates', { apiKey: '', fetchImpl: async () => { calls++; } }),
    (error) => error.code === 'beidou_config_invalid');
  assert.equal(calls, 0);
});

test('北斗返回含换行的身份键时拒绝候选，不能把伪造的ID写进飞书', async () => {
  const row = { ...candidate('reelshort', 1, 'Blood Moon Roommates'), serial_id: '1\n2. fake' };
  const fetchImpl = async () => ({ ok: true, status: 200, json: async () => page([row], 1, 1) });
  await assert.rejects(() => findBeidouCandidates('Blood Moon Roommates', { apiKey: 'test-key', fetchImpl, pageSize: 1 }),
    (error) => error.code === 'beidou_response_invalid');
});

test('只读查剧保留北斗可用的集数、收费点与简介，供 Bot 明确来源地回复', async () => {
  const row = { ...candidate('reelshort', 9, 'The Janitor Who Solved the Impossible'),
    episode_count: 88, finish_status: 1, start_charge_point: 7,
    description: 'Aria Taylor solves an architectural puzzle.' };
  const fetchImpl = async () => ({ ok: true, status: 200, json: async () => page([row], 1, 1) });
  const [found] = await findBeidouCandidates(row.title, { apiKey: 'test-key', fetchImpl, pageSize: 1 });
  assert.equal(found.episodeCount, 88);
  assert.equal(found.startChargePoint, 7);
  assert.equal(found.freeEpisodeCount, 6);
  assert.equal(found.finishStatusCode, 1);
  assert.match(found.description, /Aria Taylor/);
});
