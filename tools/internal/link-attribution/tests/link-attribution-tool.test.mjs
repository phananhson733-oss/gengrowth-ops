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

test('AstrologyWiki 站点工具：标题显示站点名字、外链生成工具名且默认落地页为主页', () => {
  assert.match(html, /<title>\s*AstrologyWiki\s+外链生成工具\s*<\/title>/);
  assert.match(html, /<h1>\s*AstrologyWiki\s+外链生成工具\s*<\/h1>/);
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
  assert.match(shortLink, /^https:\/\/www\.astrologywiki\.com\/[a-z0-9]*[0-9][a-z0-9-]*$/);

  const mapping = core.buildRedirectMapping({ shortUrl: shortLink, longUrl });
  assert.equal(mapping.short_url, shortLink);
  assert.equal(mapping.clean_short_url, shortLink);
  assert.equal(mapping.destination_url, longUrl);
  assert.equal(mapping.redirect_status, 302);
  assert.equal(core.toDisplayShortUrl(shortLink), `astrologywiki.com/${mapping.code}`);
  assert.equal(core.toDisplayShortUrl(`https://www.astrologywiki.com/go/${mapping.code}`), `astrologywiki.com/${mapping.code}`);
});

test('生成自有短链：同一个长链接稳定得到同一个短链', () => {
  const longUrl = core.buildLongUrl({
    landingUrl: '/en/wiki/aura-colors-pillar',
    source: 'abc.com',
    medium: 'backlink',
    campaign: '',
    content: '',
  });

  const first = core.buildOwnedShortUrl({
    landingUrl: '/en/wiki/aura-colors-pillar',
    destinationUrl: longUrl,
    uniqueSeed: 'first111',
  });
  const second = core.buildOwnedShortUrl({
    landingUrl: '/en/wiki/aura-colors-pillar',
    destinationUrl: longUrl,
    uniqueSeed: 'second222',
    reservedCodes: core.parseReservedCodes(first),
  });

  assert.equal(second, first);
});

test('生成自有短链：不同长链接得到不同短链', () => {
  const firstLongUrl = core.buildLongUrl({
    landingUrl: '/en/wiki/aura-colors-pillar',
    source: 'abc.com',
    medium: 'backlink',
    campaign: '',
    content: '',
  });
  const secondLongUrl = core.buildLongUrl({
    landingUrl: '/en/wiki/aura-colors-pillar',
    source: 'reddit',
    medium: 'social',
    campaign: '',
    content: '',
  });

  assert.notEqual(
    core.buildOwnedShortUrl({
      landingUrl: '/en/wiki/aura-colors-pillar',
      destinationUrl: firstLongUrl,
    }),
    core.buildOwnedShortUrl({
      landingUrl: '/en/wiki/aura-colors-pillar',
      destinationUrl: secondLongUrl,
    })
  );
});

test('生成自有短链：忽略手动 shortCode 和随机 seed，只按长链接生成', () => {
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
    core.buildOwnedShortUrl({
      shortCode: '',
      landingUrl: '/en/wiki/aura-colors-pillar',
      destinationUrl: 'https://www.astrologywiki.com/en/wiki/aura-colors-pillar',
      source: '',
      medium: '',
      campaign: '',
      content: '',
      uniqueSeed: 'another9',
    })
  );
});

test('生成自有短链：已有 code 记录不让同一个长链接变成新短链', () => {
  const destinationUrl = 'https://www.astrologywiki.com/en/wiki/aura-colors-pillar';
  const first = core.buildOwnedShortUrl({
    shortCode: '',
    landingUrl: '/en/wiki/aura-colors-pillar',
    destinationUrl,
    source: 'maximum.fm',
    medium: 'backlink',
    campaign: 'aura_colors_1a',
    content: 'act_backlink_maximum_20260623',
    uniqueSeed: 'x9k2p7',
  });
  const second = core.buildOwnedShortUrl({
    shortCode: '',
    landingUrl: '/en/wiki/aura-colors-pillar',
    destinationUrl,
    source: 'maximum.fm',
    medium: 'backlink',
    campaign: 'aura_colors_1a',
    content: 'act_backlink_maximum_20260623',
    uniqueSeed: 'newseed9',
    reservedCodes: core.parseReservedCodes(first),
  });

  assert.equal(second, first);
});

test('生成自有短链：可从短链接和映射文本解析已占用 code', () => {
  const reservedCodes = core.parseReservedCodes(`
    https://www.astrologywiki.com/go/aura-01
    https://www.astrologywiki.com/moon-03
    {"code":"aura-01-2","short_url":"https://www.astrologywiki.com/go/moon-01"}
    aura-01-3
    ["aura-01-4", "moon-02"]
  `);

  assert.equal(reservedCodes.has('aura-01'), true);
  assert.equal(reservedCodes.has('aura-01-2'), true);
  assert.equal(reservedCodes.has('moon-01'), true);
  assert.equal(reservedCodes.has('moon-03'), true);
  assert.equal(reservedCodes.has('aura-01-3'), true);
  assert.equal(reservedCodes.has('aura-01-4'), true);
  assert.equal(reservedCodes.has('moon-02'), true);
});

test('生成自有短链：reserved code 不改变长链接的一对一短码', () => {
  const destinationUrl = 'https://www.astrologywiki.com/en/wiki/aura-colors-pillar';
  const stable = core.buildOwnedShortUrl({
    shortCode: 'Aura 01',
    landingUrl: '/en/wiki/aura-colors-pillar',
    destinationUrl,
    source: '',
    medium: '',
    campaign: '',
    content: '',
    uniqueSeed: 'x9k2p7',
  });

  assert.equal(
    core.buildOwnedShortUrl({
      shortCode: 'Aura 01',
      landingUrl: '/en/wiki/aura-colors-pillar',
      destinationUrl,
      source: '',
      medium: '',
      campaign: '',
      content: '',
      uniqueSeed: 'different9',
      reservedCodes: core.parseReservedCodes(stable),
    }),
    stable
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

test('页面在参数卡下方只展示 UTM 字段填写备注和默认留空提示', () => {
  assert.equal(html.includes('class="input-stack"'), true);
  assert.equal(html.includes('id="usage-note-title"'), true);
  assert.equal(html.includes('备注'), true);
  assert.equal(html.includes('未填写会默认留空'), true);
  assert.equal(html.includes('utm_source</code> 填具体平台。如社交媒体用 reddit / pinterest / x / tiktok等；KOL 用 <code>kol-{红人}</code>；外链用主域名，比如：abc.com。注意：统一用小写字母，同一个来源不能有两种写法！'), true);
  assert.equal(html.includes('utm_source'), true);
  assert.equal(html.includes('utm_medium'), true);
  assert.equal(html.includes('utm_campaign / cluster_id'), true);
  assert.equal(html.includes('utm_content / action_id'), true);
  assert.equal(html.includes('唯一数据脊柱'), false);
  assert.equal(html.includes('page_id'), false);
  assert.equal(html.includes('帖子 id，不是文章 id'), false);
});

test('页面显示和复制 domain/code 短链接，打开短链接使用完整 URL', () => {
  assert.equal(html.includes('toDisplayShortUrl'), true);
  assert.equal(html.includes('dataset.fullUrl'), true);
  assert.equal(html.includes('data-copy="short-url"'), true);
  assert.equal(html.includes('data-copy-url="short-url"'), false);
  assert.equal(html.includes('复制短码'), false);
  assert.equal(html.includes('valueForCopy'), true);
  assert.equal(html.includes('valueForOpen'), true);
});

test('页面不暴露短链 code 输入，短链 code 由长链接稳定生成', () => {
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

  assert.match(gengrowth.html, /<title>\s*GenGrowth\s+外链生成工具\s*<\/title>/);
  assert.match(gengrowth.html, /<h1>\s*GenGrowth\s+外链生成工具\s*<\/h1>/);
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
  assert.equal(gengrowth.html.includes('class="input-stack"'), true);
  assert.equal(gengrowth.html.includes('id="usage-note-title"'), true);
  assert.equal(gengrowth.html.includes('未填写会默认留空'), true);
  assert.equal(gengrowth.html.includes('utm_source</code> 填具体平台。如社交媒体用 reddit / pinterest / x / tiktok等；KOL 用 <code>kol-{红人}</code>；外链用主域名，比如：abc.com。注意：统一用小写字母，同一个来源不能有两种写法！'), true);
  assert.equal(gengrowth.html.includes('唯一数据脊柱'), false);
  assert.equal(gengrowth.html.includes('page_id'), false);
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
    gengrowth.core.buildOwnedShortUrl({
      shortCode: '',
      landingUrl: '/en/wiki/seo-automation',
      destinationUrl: longUrl,
      source: 'partner.example',
      medium: 'backlink',
      campaign: 'seo_automation',
      content: 'act_backlink_partner_20260623',
      uniqueSeed: 'another9',
    })
  );
  const shortUrl = gengrowth.core.buildOwnedShortUrl({
    landingUrl: '/en/wiki/seo-automation',
    destinationUrl: longUrl,
  });
  const shortCode = new URL(shortUrl).pathname.slice(1);
  assert.equal(gengrowth.core.toDisplayShortUrl(shortUrl), `gengrowth.ai/${shortCode}`);
  assert.equal(gengrowth.core.toDisplayShortUrl(`https://www.gengrowth.ai/go/${shortCode}`), `gengrowth.ai/${shortCode}`);

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
