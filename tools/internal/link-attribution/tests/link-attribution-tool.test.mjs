import { existsSync, readFileSync } from 'node:fs';
import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import vm from 'node:vm';

function loadTool() {
  const htmlUrl = new URL('../index.html', import.meta.url);
  assert.ok(existsSync(htmlUrl), '统一外链工具必须存在于 ../index.html');
  const html = readFileSync(htmlUrl, 'utf8');
  const script = html.match(/<script id="link-attribution-core">([\s\S]*?)<\/script>/);
  assert.ok(script, 'index.html 必须暴露 #link-attribution-core');
  const allScripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map((item) => item[1]);

  const sandbox = {
    window: {},
    URL,
    encodeURIComponent,
    crypto,
  };

  vm.createContext(sandbox);
  vm.runInContext(script[1], sandbox);

  const api = sandbox.window.LinkAttributionCore;
  assert.ok(api, 'LinkAttributionCore 必须挂在 window 上');
  return { html, allScripts, api };
}

const { html, allScripts, api } = loadTool();
const astrology = api.createSiteCore('astrologywiki');
const gengrowth = api.createSiteCore('gengrowth');
const aistorygenerator = api.createSiteCore('aistorygenerator');
const resumetemplate = api.createSiteCore('resumetemplate');

test('页面脚本没有语法错误', () => {
  allScripts.forEach((source) => {
    assert.doesNotThrow(() => new Function(source));
  });
});

test('统一工具：单个 HTML，站点用页签切换，配置驱动可扩展新增站点', () => {
  assert.match(html, /<title>\s*外链生成工具\s*<\/title>/);
  assert.equal(html.includes('id="site-tabs"'), true);
  assert.equal(html.includes('role="tablist"'), true);
  assert.equal(html.includes('createSiteCore'), true);
  assert.equal(html.includes("key: 'gengrowth'"), true);
  assert.equal(html.includes("key: 'astrologywiki'"), true);
  assert.equal(html.includes('gengrowth.ai'), true);
  assert.equal(html.includes('astrologywiki.com'), true);

  const keys = api.SITES.map((site) => site.key).join(',');
  assert.equal(keys, 'gengrowth,astrologywiki,aistorygenerator,resumetemplate');
  assert.equal(html.includes("key: 'aistorygenerator'"), true);
  assert.equal(html.includes("key: 'resumetemplate'"), true);
  assert.equal(html.includes('aistorygenerator.work'), true);
  assert.equal(html.includes('googledocsresumetemplate.com'), true);
});

test('生成长链接：相对路径自动归一到 astrologywiki 主站，并写入四个 UTM 参数', () => {
  const longUrl = astrology.buildLongUrl({
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
  const longUrl = astrology.buildLongUrl({
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
    () => astrology.buildLongUrl({
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
  const longUrl = astrology.buildLongUrl({
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
  const longUrl = astrology.buildLongUrl({
    landingUrl: 'https://www.astrologywiki.com/?utm_source=old&utm_medium=old&keep=1',
    source: '',
    medium: '',
    campaign: '',
    content: '',
  });

  assert.equal(longUrl, 'https://www.astrologywiki.com/?keep=1');
});

test('生成自有短链：使用 astrologywiki 主站短路径，并输出映射关系', () => {
  const longUrl = astrology.buildLongUrl({
    landingUrl: 'www.astrologywiki.com/en/wiki/aura-colors-pillar',
    source: 'maximum.fm',
    medium: 'backlink',
    campaign: 'aura_colors_1a',
    content: 'act_backlink_maximum_20260623',
  });

  const shortLink = astrology.buildOwnedShortUrl({
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

  const mapping = astrology.buildRedirectMapping({ shortUrl: shortLink, longUrl });
  assert.equal(mapping.short_url, shortLink);
  assert.equal(mapping.clean_short_url, shortLink);
  assert.equal(mapping.destination_url, longUrl);
  assert.equal(mapping.redirect_status, 302);
  assert.equal(astrology.toDisplayShortUrl(shortLink), `astrologywiki.com/${mapping.code}`);
  assert.equal(astrology.toDisplayShortUrl(`https://www.astrologywiki.com/go/${mapping.code}`), `astrologywiki.com/${mapping.code}`);
});

test('生成自有短链：同一个长链接稳定得到同一个短链', () => {
  const longUrl = astrology.buildLongUrl({
    landingUrl: '/en/wiki/aura-colors-pillar',
    source: 'abc.com',
    medium: 'backlink',
    campaign: '',
    content: '',
  });

  const first = astrology.buildOwnedShortUrl({
    landingUrl: '/en/wiki/aura-colors-pillar',
    destinationUrl: longUrl,
    uniqueSeed: 'first111',
  });
  const second = astrology.buildOwnedShortUrl({
    landingUrl: '/en/wiki/aura-colors-pillar',
    destinationUrl: longUrl,
    uniqueSeed: 'second222',
    reservedCodes: astrology.parseReservedCodes(first),
  });

  assert.equal(second, first);
});

test('生成自有短链：不同长链接得到不同短链', () => {
  const firstLongUrl = astrology.buildLongUrl({
    landingUrl: '/en/wiki/aura-colors-pillar',
    source: 'abc.com',
    medium: 'backlink',
    campaign: '',
    content: '',
  });
  const secondLongUrl = astrology.buildLongUrl({
    landingUrl: '/en/wiki/aura-colors-pillar',
    source: 'reddit',
    medium: 'social',
    campaign: '',
    content: '',
  });

  assert.notEqual(
    astrology.buildOwnedShortUrl({
      landingUrl: '/en/wiki/aura-colors-pillar',
      destinationUrl: firstLongUrl,
    }),
    astrology.buildOwnedShortUrl({
      landingUrl: '/en/wiki/aura-colors-pillar',
      destinationUrl: secondLongUrl,
    })
  );
});

test('生成自有短链：忽略手动 shortCode 和随机 seed，只按长链接生成', () => {
  assert.equal(
    astrology.buildOwnedShortUrl({
      shortCode: 'Aura 01 / Summer',
      landingUrl: '/en/wiki/aura-colors-pillar',
      destinationUrl: 'https://www.astrologywiki.com/en/wiki/aura-colors-pillar',
      source: '',
      medium: '',
      campaign: '',
      content: '',
      uniqueSeed: 'x9k2p7',
    }),
    astrology.buildOwnedShortUrl({
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
  const first = astrology.buildOwnedShortUrl({
    shortCode: '',
    landingUrl: '/en/wiki/aura-colors-pillar',
    destinationUrl,
    source: 'maximum.fm',
    medium: 'backlink',
    campaign: 'aura_colors_1a',
    content: 'act_backlink_maximum_20260623',
    uniqueSeed: 'x9k2p7',
  });
  const second = astrology.buildOwnedShortUrl({
    shortCode: '',
    landingUrl: '/en/wiki/aura-colors-pillar',
    destinationUrl,
    source: 'maximum.fm',
    medium: 'backlink',
    campaign: 'aura_colors_1a',
    content: 'act_backlink_maximum_20260623',
    uniqueSeed: 'newseed9',
    reservedCodes: astrology.parseReservedCodes(first),
  });

  assert.equal(second, first);
});

test('生成自有短链：可从短链接和映射文本解析已占用 code', () => {
  const reservedCodes = astrology.parseReservedCodes(`
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
  const stable = astrology.buildOwnedShortUrl({
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
    astrology.buildOwnedShortUrl({
      shortCode: 'Aura 01',
      landingUrl: '/en/wiki/aura-colors-pillar',
      destinationUrl,
      source: '',
      medium: '',
      campaign: '',
      content: '',
      uniqueSeed: 'different9',
      reservedCodes: astrology.parseReservedCodes(stable),
    }),
    stable
  );
});

test('生成自有短链：拒绝把登记目标指向非 astrologywiki 站点', () => {
  assert.throws(
    () => astrology.buildOwnedShortUrl({
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

test('GenGrowth 页签：只允许 gengrowth.ai 域名并生成长短链', () => {
  const longUrl = gengrowth.buildLongUrl({
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
    gengrowth.buildOwnedShortUrl({
      shortCode: '',
      landingUrl: '/en/wiki/seo-automation',
      destinationUrl: longUrl,
      uniqueSeed: 'g9n2th',
    }),
    gengrowth.buildOwnedShortUrl({
      shortCode: '',
      landingUrl: '/en/wiki/seo-automation',
      destinationUrl: longUrl,
      uniqueSeed: 'another9',
    })
  );

  const shortUrl = gengrowth.buildOwnedShortUrl({
    landingUrl: '/en/wiki/seo-automation',
    destinationUrl: longUrl,
  });
  const shortCode = new URL(shortUrl).pathname.slice(1);
  assert.equal(gengrowth.toDisplayShortUrl(shortUrl), `gengrowth.ai/${shortCode}`);
  assert.equal(gengrowth.toDisplayShortUrl(`https://www.gengrowth.ai/go/${shortCode}`), `gengrowth.ai/${shortCode}`);

  assert.throws(
    () => gengrowth.buildLongUrl({
      landingUrl: 'https://www.astrologywiki.com/en/wiki/aura-colors-pillar',
      source: 'partner.example',
      medium: 'backlink',
      campaign: 'seo_automation',
      content: 'act_backlink_partner_20260623',
    }),
    /gengrowth\.ai/
  );
});

test('GenGrowth 页签：注册端点带版本号，AstrologyWiki 端点为裸路径', () => {
  assert.equal(gengrowth.site.endpoint.includes('/api/link-attribution/redirects?v=20260623'), true);
  assert.equal(astrology.site.endpoint.endsWith('/api/link-attribution/redirects'), true);
});

test('两个站点的短链 code 一一对应，互不串域', () => {
  assert.throws(
    () => gengrowth.buildOwnedShortUrl({
      landingUrl: '/en/wiki/seo-automation',
      destinationUrl: 'https://www.astrologywiki.com/en/wiki/aura-colors-pillar',
    }),
    /gengrowth\.ai/
  );
  assert.throws(
    () => astrology.buildOwnedShortUrl({
      landingUrl: '/en/wiki/aura-colors-pillar',
      destinationUrl: 'https://www.gengrowth.ai/en/wiki/seo-automation',
    }),
    /astrologywiki\.com/
  );
});

test('AI Story Generator 页签：归一到 aistorygenerator.work 并生成长短链', () => {
  const longUrl = aistorygenerator.buildLongUrl({
    landingUrl: '/story/dragon-quest',
    source: 'reddit',
    medium: 'social',
    campaign: 'ai_story_launch',
    content: 'act_social_reddit_20260630',
  });

  assert.equal(
    longUrl,
    'https://aistorygenerator.work/story/dragon-quest?utm_source=reddit&utm_medium=social&utm_campaign=ai_story_launch&utm_content=act_social_reddit_20260630'
  );

  const shortUrl = aistorygenerator.buildOwnedShortUrl({
    landingUrl: '/story/dragon-quest',
    destinationUrl: longUrl,
  });
  const shortCode = new URL(shortUrl).pathname.slice(1);
  assert.equal(aistorygenerator.toDisplayShortUrl(shortUrl), `aistorygenerator.work/${shortCode}`);

  assert.throws(
    () => aistorygenerator.buildLongUrl({
      landingUrl: 'https://www.gengrowth.ai/en/wiki/seo-automation',
      source: 'reddit',
      medium: 'social',
      campaign: '',
      content: '',
    }),
    /aistorygenerator\.work/
  );
});

test('Resume Template 页签：归一到 googledocsresumetemplate.com 并生成长短链', () => {
  const longUrl = resumetemplate.buildLongUrl({
    landingUrl: '/templates/modern-resume',
    source: 'pinterest',
    medium: 'social',
    campaign: 'resume_q3',
    content: 'act_social_pinterest_20260630',
  });

  assert.equal(
    longUrl,
    'https://www.googledocsresumetemplate.com/templates/modern-resume?utm_source=pinterest&utm_medium=social&utm_campaign=resume_q3&utm_content=act_social_pinterest_20260630'
  );

  const shortUrl = resumetemplate.buildOwnedShortUrl({
    landingUrl: '/templates/modern-resume',
    destinationUrl: longUrl,
  });
  const shortCode = new URL(shortUrl).pathname.slice(1);
  assert.equal(resumetemplate.toDisplayShortUrl(shortUrl), `googledocsresumetemplate.com/${shortCode}`);

  assert.throws(
    () => resumetemplate.buildOwnedShortUrl({
      landingUrl: '/templates/modern-resume',
      destinationUrl: 'https://www.aistorygenerator.work/story/dragon-quest',
    }),
    /googledocsresumetemplate\.com/
  );
});

test('底部「导入Google」备份入口齐全：按钮、webapp 地址输入、本会话累积', () => {
  assert.equal(html.includes('id="import-google"'), true);
  assert.equal(html.includes('导入Google'), true);
  assert.equal(html.includes('id="sheet-webapp-url"'), true);
  assert.equal(html.includes('link-attribution-session-records-v1'), true);
  assert.equal(html.includes("mode: 'no-cors'"), true);
  assert.equal(html.includes('recordSession'), true);
  assert.equal(html.includes('imported_at'), true);
});
