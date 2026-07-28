import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import {
  AUTO_REGISTER_HEADERS,
  normaliseTargetDomain,
  toAutoRegisterCsv,
  toAutoRegisterRows,
} from '../src/auto-register-export.mjs';

test('normaliseTargetDomain returns a lowercase hostname and rejects invalid values', () => {
  assert.equal(normaliseTargetDomain('https://WWW.Example.com/path?q=1'), 'www.example.com');
  assert.equal(normaliseTargetDomain('example.com'), 'example.com');
  assert.throws(() => normaliseTargetDomain('not a domain'), /目标域名格式不正确/);
  assert.throws(() => normaliseTargetDomain('localhost'), /目标域名格式不正确/);
});

test('toAutoRegisterRows exports only qualified records with the exact seven columns', () => {
  const rows = toAutoRegisterRows([
    {
      referring_page_url: 'https://source.example/post',
      referring_domain: 'source.example',
      opportunity_type: 'resource_page',
      external_link_count: 0,
      machine_status: 'qualified',
      domain_dr: 91,
    },
    { referring_page_url: 'https://rejected.example/', machine_status: 'rejected' },
  ], { targetDomain: 'https://Target.Example/path' });

  assert.deepEqual(Object.keys(rows[0]), AUTO_REGISTER_HEADERS);
  assert.deepEqual(rows, [{
    页面AS: '',
    原URL: 'https://source.example/post',
    URL对应域名: 'source.example',
    目标域名: 'target.example',
    类型: 'resource_page',
    外部链接数量: 0,
    自动评论运行结果: '',
  }]);
});

test('toAutoRegisterRows derives the source domain and leaves unknown counts empty', () => {
  const rows = toAutoRegisterRows([
    {
      referring_page_url: 'https://Source.Example/path',
      referring_domain: '',
      external_link_count: null,
      machine_status: 'qualified',
    },
    { referring_page_url: '', referring_domain: '', machine_status: 'qualified' },
  ], { targetDomain: 'target.example' });

  assert.equal(rows.length, 1);
  assert.equal(rows[0].URL对应域名, 'source.example');
  assert.equal(rows[0].外部链接数量, '');
});

test('toAutoRegisterCsv emits BOM, exact headers, CRLF and RFC 4180 escaping', () => {
  const csv = toAutoRegisterCsv([{
    页面AS: '',
    原URL: 'https://example.com/a,b',
    URL对应域名: 'example.com',
    目标域名: 'target.example',
    类型: '目录"页',
    外部链接数量: '',
    自动评论运行结果: '',
  }]);

  assert.equal(csv.charCodeAt(0), 0xfeff);
  assert.equal(
    csv.slice(1),
    `${AUTO_REGISTER_HEADERS.join(',')}\r\n,"https://example.com/a,b",example.com,target.example,"目录""页",,\r\n`,
  );
});
