import { existsSync, readFileSync } from 'node:fs';
import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import vm from 'node:vm';

function loadSite(relativePath, siteName) {
  const siteHtmlUrl = new URL(relativePath, import.meta.url);
  assert.ok(existsSync(siteHtmlUrl), `${siteName} HTML must live in ${relativePath}`);
  const html = readFileSync(siteHtmlUrl, 'utf8');
  const script = html.match(/<script id="link-attribution-core">([\s\S]*?)<\/script>/);
  assert.ok(script, `${siteName} index.html must expose #link-attribution-core`);
  const allScripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map((item) => item[1]);

  const sandbox = {
    window: {},
    URL,
    encodeURIComponent,
  };

  vm.createContext(sandbox);
  vm.runInContext(script[1], sandbox);

  const core = sandbox.window.LinkAttributionCore;
  assert.ok(core, `${siteName} LinkAttributionCore must be attached to window`);
  return { html, allScripts, core };
}

const astrology = loadSite('../astrologywiki.com/index.html', 'AstrologyWiki');
const html = astrology.html;
const allScripts = astrology.allScripts;
const core = astrology.core;

test('页面脚本没有语法错误', () => {
  allScripts.forEach((source) => {
    assert.doesNotThrow(() => new Function(source));
  });
});

test('AstrologyWiki 站点工具：标题显示站点名字且默认落地页为主页', () => {
  assert.match(html, /<title>\s*AstrologyWiki\s+链接归因工具\s*<\/title>/);
  assert.match(html, /<h1>\s*AstrologyWiki\s+链接归因工具\s*<\/h1>/);
  assert.match(html, /id="landing-url"[^>]+value="https:\/\/www\.astrologywiki\.com\/"/);
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

test('生成长链接：所有 UTM 字段都允许为空，默认只保留落地页和非 UTM 参数', () => {
  const longUrl = core.buildLongUrl({
    landingUrl: 'https://www.astrologywiki.com/?utm_source=old&utm_medium=old&keep=1',
    source: '',
    medium: '',
    campaign: '',
    content: '',
  });

  assert.equal(longUrl, 'https://www.astrologywiki.com/?keep=1');
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
    uniqueSeed: 'x9k2p7',
  });
  assert.equal(
    shortLink,
    'https://www.astrologywiki.com/go/x9k2p7'
  );

  const mapping = core.buildRedirectMapping({ shortUrl: shortLink, longUrl });
  assert.equal(mapping.code, 'x9k2p7');
  assert.equal(
    mapping.short_url,
    'https://www.astrologywiki.com/go/x9k2p7'
  );
  assert.equal(mapping.clean_short_url, 'https://www.astrologywiki.com/go/x9k2p7');
  assert.equal(mapping.destination_url, longUrl);
  assert.equal(mapping.redirect_status, 302);
  assert.equal(core.toDisplayShortUrl(shortLink), 'astrologywiki.com/go/x9k2p7');
});

test('生成自有短链：默认短码包含时间戳片段和安全随机片段', () => {
  const seed = core.createUniqueSeed();

  assert.match(seed, /^[a-z0-9]{10,16}$/);
});

test('生成自有短链：忽略手动 shortCode，只使用本地随机码', () => {
  assert.equal(
    core.buildOwnedShortUrl({
      shortCode: 'Aura 01 / Summer',
      landingUrl: '/en/wiki/aura-colors-pillar',
      destinationUrl: 'https://www.astrologywiki.com/en/wiki/aura-colors-pillar',
      source: '',
      medium: '',
      campaign: '',
      content: '',
      uniqueSeed: 'x9k2p7',
    }),
    'https://www.astrologywiki.com/go/x9k2p7'
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
      uniqueSeed: 'x9k2p7',
      reservedCodes: [
        'x9k2p7',
        'x9k2p7-2',
      ],
    }),
    'https://www.astrologywiki.com/go/x9k2p7-3'
  );
});

test('生成自有短链：可从短链接和映射文本解析已占用 code', () => {
  const reservedCodes = core.parseReservedCodes(`
    https://www.astrologywiki.com/go/aura-01
    {"code":"aura-01-2","short_url":"https://www.astrologywiki.com/go/moon-01"}
    aura-01-3
    ["aura-01-4", "moon-02"]
  `);

  assert.equal(reservedCodes.has('aura-01'), true);
  assert.equal(reservedCodes.has('aura-01-2'), true);
  assert.equal(reservedCodes.has('moon-01'), true);
  assert.equal(reservedCodes.has('aura-01-3'), true);
  assert.equal(reservedCodes.has('aura-01-4'), true);
  assert.equal(reservedCodes.has('moon-02'), true);
});

test('生成自有短链：随机 shortCode 冲突时也会自动避让', () => {
  assert.equal(
    core.buildOwnedShortUrl({
      shortCode: 'Aura 01',
      landingUrl: '/en/wiki/aura-colors-pillar',
      destinationUrl: 'https://www.astrologywiki.com/en/wiki/aura-colors-pillar',
      source: '',
      medium: '',
      campaign: '',
      content: '',
      uniqueSeed: 'x9k2p7',
      reservedCodes: core.parseReservedCodes('x9k2p7'),
    }),
    'https://www.astrologywiki.com/go/x9k2p7-2'
  );
});

test('生成自有短链：拒绝把登记目标指向非 astrologywiki 站点', () => {
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
  assert.equal(html.includes('id="fill-action"'), false);
  assert.equal(html.includes('补 action_id'), false);
  assert.equal(html.includes('/api/link-attribution/redirects'), true);
});

test('页面把短链存储未配置显示为明确的生成失败提示', () => {
  assert.equal(html.includes('storage_unconfigured'), true);
  assert.equal(html.includes('短链存储未配置'), true);
  assert.equal(html.includes('生成失败'), true);
});

test('页面隐藏工程映射，但保留复制和打开链接操作', () => {
  assert.equal(html.includes('Redirect 映射'), false);
  assert.equal(html.includes('id="redirect-map"'), false);
  assert.equal(html.includes('复制映射'), false);
  assert.equal(html.includes('常用来源'), false);
  assert.equal(html.includes('class="preset"'), false);
  assert.equal(html.includes('复制长链接'), true);
  assert.equal(html.includes('复制短链接'), true);
  assert.equal(html.includes('data-open="long-url"'), true);
  assert.equal(html.includes('data-open="short-url"'), true);
  assert.equal(html.includes('打开长链接'), true);
  assert.equal(html.includes('打开短链接'), true);
  assert.equal(html.includes('生成链接'), true);
});

test('页面显示和复制 domain/go/code 短链接，打开短链接使用完整 URL', () => {
  assert.equal(html.includes('toDisplayShortUrl'), true);
  assert.equal(html.includes('dataset.fullUrl'), true);
  assert.equal(html.includes('data-copy="short-url"'), true);
  assert.equal(html.includes('data-copy-url="short-url"'), false);
  assert.equal(html.includes('复制短码'), false);
  assert.equal(html.includes('valueForCopy'), true);
  assert.equal(html.includes('valueForOpen'), true);
});

test('页面不暴露短链 code 输入，短链 code 由本地随机生成', () => {
  assert.equal(html.includes('id="short-code"'), false);
  assert.equal(html.includes('name="shortCode"'), false);
  assert.equal(html.includes('短链 code'), false);
  assert.equal(html.includes('多人使用时建议留空'), false);
});

test('页面不暴露本机 code 状态，重复 code 交给线上注册接口全局处理', () => {
  assert.equal(html.includes('本机已用短链 code'), false);
  assert.equal(html.includes('id="reserved-codes"'), false);
  assert.equal(html.includes('name="reservedCodes"'), false);
  assert.equal(html.includes('code_conflict'), true);
});

test('页面保留隐藏同步 code registry，用作线上注册前的预防层', () => {
  assert.equal(html.includes('id="reserved-code-registry"'), true);
  assert.equal(html.includes('type="application/json"'), true);
  assert.equal(html.includes('hidden'), true);
  assert.equal(html.includes('appendReservedCodeToRegistry'), true);
});

test('GenGrowth 站点工具：独立目录、标题和脚本可用', () => {
  const gengrowth = loadSite('../gengrowth.ai/index.html', 'GenGrowth');

  assert.match(gengrowth.html, /<title>\s*GenGrowth\s+链接归因工具\s*<\/title>/);
  assert.match(gengrowth.html, /<h1>\s*GenGrowth\s+链接归因工具\s*<\/h1>/);
  assert.match(gengrowth.html, /id="landing-url"[^>]+value="https:\/\/www\.gengrowth\.ai\/"/);
  assert.equal(gengrowth.html.includes('data-open="long-url"'), true);
  assert.equal(gengrowth.html.includes('data-open="short-url"'), true);
  assert.equal(gengrowth.html.includes('id="fill-action"'), false);
  assert.equal(gengrowth.html.includes('补 action_id'), false);
  assert.equal(gengrowth.html.includes('/api/link-attribution/redirects'), true);
  assert.equal(gengrowth.html.includes('/api/link-attribution/redirects?v=20260623'), true);
  assert.equal(gengrowth.html.includes('storage_unconfigured'), true);
  assert.equal(gengrowth.html.includes('短链存储未配置'), true);
  assert.equal(gengrowth.html.includes('生成失败'), true);
  assert.equal(gengrowth.html.includes('id="short-code"'), false);
  assert.equal(gengrowth.html.includes('name="shortCode"'), false);
  assert.equal(gengrowth.html.includes('短链 code'), false);
  assert.equal(gengrowth.html.includes('多人使用时建议留空'), false);
  assert.equal(gengrowth.html.includes('本机已用短链 code'), false);
  assert.equal(gengrowth.html.includes('id="reserved-codes"'), false);
  assert.equal(gengrowth.html.includes('name="reservedCodes"'), false);
  assert.equal(gengrowth.html.includes('code_conflict'), true);
  assert.equal(gengrowth.html.includes('id="reserved-code-registry"'), true);
  assert.equal(gengrowth.html.includes('appendReservedCodeToRegistry'), true);
  assert.equal(gengrowth.html.includes('toDisplayShortUrl'), true);
  assert.equal(gengrowth.html.includes('dataset.fullUrl'), true);
  assert.equal(gengrowth.html.includes('data-copy="short-url"'), true);
  assert.equal(gengrowth.html.includes('data-copy-url="short-url"'), false);
  assert.equal(gengrowth.html.includes('复制短码'), false);
  assert.equal(gengrowth.html.includes('valueForCopy'), true);
  assert.equal(gengrowth.html.includes('valueForOpen'), true);
  gengrowth.allScripts.forEach((source) => {
    assert.doesNotThrow(() => new Function(source));
  });
});

test('GenGrowth 站点工具：只允许 gengrowth.ai 域名并生成长短链', () => {
  const gengrowth = loadSite('../gengrowth.ai/index.html', 'GenGrowth');
  const longUrl = gengrowth.core.buildLongUrl({
    landingUrl: '/en/wiki/seo-automation',
    source: 'partner.example',
    medium: 'backlink',
    campaign: 'seo_automation',
    content: 'act_backlink_partner_20260623',
  });

  assert.equal(
    longUrl,
    'https://www.gengrowth.ai/en/wiki/seo-automation?utm_source=partner.example&utm_medium=backlink&utm_campaign=seo_automation&utm_content=act_backlink_partner_20260623'
  );

  assert.equal(
    gengrowth.core.buildOwnedShortUrl({
      shortCode: '',
      landingUrl: '/en/wiki/seo-automation',
      destinationUrl: longUrl,
      source: 'partner.example',
      medium: 'backlink',
      campaign: 'seo_automation',
      content: 'act_backlink_partner_20260623',
      uniqueSeed: 'g9n2th',
    }),
    'https://www.gengrowth.ai/go/g9n2th'
  );
  assert.equal(gengrowth.core.toDisplayShortUrl('https://www.gengrowth.ai/go/g9n2th'), 'gengrowth.ai/go/g9n2th');

  assert.throws(
    () => gengrowth.core.buildLongUrl({
      landingUrl: 'https://www.astrologywiki.com/en/wiki/aura-colors-pillar',
      source: 'partner.example',
      medium: 'backlink',
      campaign: 'seo_automation',
      content: 'act_backlink_partner_20260623',
    }),
    /gengrowth\.ai/
  );
});
