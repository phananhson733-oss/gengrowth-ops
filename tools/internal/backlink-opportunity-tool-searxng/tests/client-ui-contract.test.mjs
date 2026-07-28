import { strict as assert } from 'node:assert';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const clientPath = new URL('../app/client.mjs', import.meta.url);
const layoutPath = new URL('../app/layout.mjs', import.meta.url);

test('client uses current-job result APIs and never reads accumulated opportunities', async () => {
  const source = await readFile(clientPath, 'utf8');

  assert.equal(source.includes('/api/opportunities'), false);
  assert.equal(source.includes('useEffect'), false);
  assert.match(source, /\/api\/jobs\/\$\{[^}]+\}\/result/);
  assert.match(source, /\/api\/jobs\/\$\{[^}]+\}\/result\/ack/);
  assert.match(source, /const JOB_POLL_INTERVAL_MS = 5_000/);
  assert.match(source, /pollIntervalMs: JOB_POLL_INTERVAL_MS/);
});

test('mode controls are accessible tabs and styles expose a 48px click target', async () => {
  const client = await readFile(clientPath, 'utf8');
  const layout = await readFile(layoutPath, 'utf8');

  assert.match(client, /role="tablist"/);
  assert.match(client, /role="tab"/);
  assert.match(client, /aria-selected=/);
  assert.match(layout, /min-height:48px/);
  assert.match(layout, /grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(layout, /grid-template-columns:minmax\(220px,1fr\) minmax\(220px,1fr\) minmax\(180px,1fr\) auto/);
  assert.match(layout, /grid-column:1\/-1/);
  assert.match(layout, /\.panel input,.panel select,.panel>button\{min-height:45px\}/);
});

test('client exposes the target domain and local strict CSV export controls', async () => {
  const source = await readFile(clientPath, 'utf8');

  assert.match(source, /我方目标域名/);
  assert.match(source, /填写希望获得外链的站点/);
  assert.match(source, /不是竞品域名/);
  assert.match(source, /例如：gengrowth\.ai/);
  assert.doesNotMatch(source, /gengrowth\.com/);
  assert.match(source, /<p id="target-domain-help" className="field-help">/);
  assert.doesNotMatch(source, /<label className="target-domain-field">[\s\S]*?<small/);
  assert.match(source, /导出本次 CSV/);
  assert.match(source, /AUTO_REGISTER_HEADERS/);
  assert.match(source, /toAutoRegisterCsv/);
  assert.match(source, /new Blob/);
});
