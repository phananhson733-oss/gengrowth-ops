import { existsSync, readFileSync } from 'node:fs';
import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import vm from 'node:vm';

const siteHtmlUrl = new URL('../astrologywiki.com/index.html', import.meta.url);
assert.ok(existsSync(siteHtmlUrl), 'AstrologyWiki HTML must live in link-attribution/astrologywiki.com/index.html');
const html = readFileSync(siteHtmlUrl, 'utf8');
const script = html.match(/<script id="link-attribution-core">([\s\S]*?)<\/script>/);
assert.ok(script, 'index.html must expose #link-attribution-core');
const allScripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map((item) => item[1]);

const sandbox = {
  window: {},
  URL,
  encodeURIComponent,
};

vm.createContext(sandbox);
vm.runInContext(script[1], sandbox);

const core = sandbox.window.LinkAttributionCore;
assert.ok(core, 'LinkAttributionCore must be attached to window');

test('页面脚本没有语法错误', () => {
  allScripts.forEach((source) => {
    assert.doesNotThrow(() => new Function(source));
  });
});

test('页面标题和首屏标题显示站点名字', () => {
  assert.match(html, /<title>\s*AstrologyWiki\s+链接归因工具\s*<\/title>/);
  assert.match(html, /<h1>\s*AstrologyWiki\s+链接归因工具\s*<\/h1>/);
});

test('生成长链接：相对路径自动归一到 astrologywiki 主站，并写入四个 UTM 参数', () => {
  const longUrl = core.buildLongUrl({
    landingUrl: '/en/wiki/aura-colors-pillar',
    source: 'theglobalhues.com',
    medium: 'backlink',
    campaign: 'aura_colors_1a',
    content: 'act_backlink_theglobalhues_20260623',
  });

  assert.equal(
    longUrl,
    'https://www.astrologywiki.com/en/wiki/aura-colors-pillar?utm_source=theglobalhues.com&utm_medium=backlink&utm_campaign=aura_colors_1a&utm_content=act_backlink_theglobalhues_20260623'
  );
});

test('生成长链接：保留原有 query/hash，并把 http 自动升级为 https', () => {
  const longUrl = core.buildLongUrl({
    landingUrl: 'http://astrologywiki.com/en/wiki/moon-sign?lang=en#meaning',
    source: 'newsletter',
    medium: 'newsletter',
    campaign: 'moon_signs',
    content: 'act_newsletter_moon_20260623',
  });

  assert.equal(
    longUrl,
    'https://astrologywiki.com/en/wiki/moon-sign?lang=en&utm_source=newsletter&utm_medium=newsletter&utm_campaign=moon_signs&utm_content=act_newsletter_moon_20260623#meaning'
  );
});

test('生成长链接：拒绝非 astrologywiki 目标站点', () => {
  assert.throws(
    () => core.buildLongUrl({
      landingUrl: 'https://example.com/en/wiki/aura-colors-pillar',
      source: 'reddit',
      medium: 'social',
      campaign: 'aura_colors_1a',
      content: 'act_reddit_aura_20260623',
    }),
    /astrologywiki\.com/
  );
});

test('生成长链接：UTM 参数允许为空，空值不写入且会清理旧 UTM', () => {
  const longUrl = core.buildLongUrl({
    landingUrl: 'https://www.astrologywiki.com/en/wiki/aura-colors-pillar?utm_source=old&keep=1',
    source: '',
    medium: 'backlink',
    campaign: '',
    content: 'act_backlink_20260623',
  });

  assert.equal(
    longUrl,
    'https://www.astrologywiki.com/en/wiki/aura-colors-pillar?keep=1&utm_medium=backlink&utm_content=act_backlink_20260623'
  );
});

test('生成自有短链：使用 astrologywiki 主站短路径，并输出映射关系', () => {
  const longUrl = core.buildLongUrl({
    landingUrl: 'www.astrologywiki.com/en/wiki/aura-colors-pillar',
    source: 'maximum.fm',
    medium: 'backlink',
    campaign: 'aura_colors_1a',
    content: 'act_backlink_maximum_20260623',
  });

  const shortLink = core.buildOwnedShortUrl({
    shortCode: '',
    landingUrl: 'www.astrologywiki.com/en/wiki/aura-colors-pillar',
    destinationUrl: longUrl,
    source: 'maximum.fm',
    medium: 'backlink',
    campaign: 'aura_colors_1a',
    content: 'act_backlink_maximum_20260623',
  });
  assert.equal(
    shortLink,
    `https://www.astrologywiki.com/go/act-backlink-maximum-20260623?to=${encodeURIComponent(longUrl)}`
  );

  const mapping = core.buildRedirectMapping({ shortUrl: shortLink, longUrl });
  assert.equal(mapping.code, 'act-backlink-maximum-20260623');
  assert.equal(
    mapping.short_url,
    `https://www.astrologywiki.com/go/act-backlink-maximum-20260623?to=${encodeURIComponent(longUrl)}`
  );
  assert.equal(mapping.clean_short_url, 'https://www.astrologywiki.com/go/act-backlink-maximum-20260623');
  assert.equal(mapping.destination_url, longUrl);
  assert.equal(mapping.redirect_status, 302);
});

test('生成自有短链：手动 shortCode 优先，并清理非法字符', () => {
  assert.equal(
    core.buildOwnedShortUrl({
      shortCode: 'Aura 01 / Summer',
      landingUrl: '/en/wiki/aura-colors-pillar',
      destinationUrl: 'https://www.astrologywiki.com/en/wiki/aura-colors-pillar',
      source: '',
      medium: '',
      campaign: '',
      content: '',
    }),
    `https://www.astrologywiki.com/go/aura-01-summer?to=${encodeURIComponent('https://www.astrologywiki.com/en/wiki/aura-colors-pillar')}`
  );
});

test('生成自有短链：已有 code 冲突时自动追加数字后缀', () => {
  const destinationUrl = 'https://www.astrologywiki.com/en/wiki/aura-colors-pillar';
  assert.equal(
    core.buildOwnedShortUrl({
      shortCode: '',
      landingUrl: '/en/wiki/aura-colors-pillar',
      destinationUrl,
      source: 'maximum.fm',
      medium: 'backlink',
      campaign: 'aura_colors_1a',
      content: 'act_backlink_maximum_20260623',
      reservedCodes: [
        'act-backlink-maximum-20260623',
        'act-backlink-maximum-20260623-2',
      ],
    }),
    `https://www.astrologywiki.com/go/act-backlink-maximum-20260623-3?to=${encodeURIComponent(destinationUrl)}`
  );
});

test('生成自有短链：可从短链接和映射文本解析已占用 code', () => {
  const reservedCodes = core.parseReservedCodes(`
    https://www.astrologywiki.com/go/aura-01
    {"code":"aura-01-2","short_url":"https://www.astrologywiki.com/go/moon-01"}
    aura-01-3
  `);

  assert.equal(reservedCodes.has('aura-01'), true);
  assert.equal(reservedCodes.has('aura-01-2'), true);
  assert.equal(reservedCodes.has('moon-01'), true);
  assert.equal(reservedCodes.has('aura-01-3'), true);
});

test('生成自有短链：手动 shortCode 冲突时也会自动避让', () => {
  assert.equal(
    core.buildOwnedShortUrl({
      shortCode: 'Aura 01',
      landingUrl: '/en/wiki/aura-colors-pillar',
      destinationUrl: 'https://www.astrologywiki.com/en/wiki/aura-colors-pillar',
      source: '',
      medium: '',
      campaign: '',
      content: '',
      reservedCodes: core.parseReservedCodes('aura-01'),
    }),
    `https://www.astrologywiki.com/go/aura-01-2?to=${encodeURIComponent('https://www.astrologywiki.com/en/wiki/aura-colors-pillar')}`
  );
});

test('生成自有短链：拒绝把短链 to 参数指向非 astrologywiki 站点', () => {
  assert.throws(
    () => core.buildOwnedShortUrl({
      shortCode: 'bad-link',
      landingUrl: '/en/wiki/aura-colors-pillar',
      destinationUrl: 'https://example.com/phishing',
      source: '',
      medium: '',
      campaign: '',
      content: '',
    }),
    /astrologywiki\.com/
  );
});

test('页面不再依赖第三方 TinyURL 中转', () => {
  assert.equal(html.toLowerCase().includes('tinyurl'), false);
});

test('页面一次生成长链接、短链接和映射，不保留二次生成短链按钮', () => {
  assert.equal(html.includes('id="shorten"'), false);
  assert.equal(html.includes('生成自有短链'), false);
});
