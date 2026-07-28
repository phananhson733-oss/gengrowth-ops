import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { fromCompetitorSearchResult, fromSerpResult } from '../src/core.mjs';
import { inspectCandidatePage } from '../src/page-inspector.mjs';
import { evaluateOpportunity } from '../src/quality-ranker.mjs';

function candidate() {
  return fromSerpResult(
    { link: 'https://safe.example/resources', title: 'Safe resources', snippet: 'Useful tools' },
    { keyword: 'useful tools', language: 'en', region: 'us' }
  );
}

test('inspectCandidatePage rejects a candidate when toxic content only appears in the fetched page body', async () => {
  const result = await inspectCandidatePage(candidate(), {
    fetchFn: async () => new Response(`
      <html><head><title>Resource collection</title></head>
      <body><p>Browse the best casino bonus offers.</p><a href="/about">About</a><a href="https://partner.example/offer">Partner</a></body></html>
    `, { status: 200, headers: { 'content-type': 'text/html' } }),
  });

  assert.equal(result.machine_status, 'rejected');
  assert.equal(result.safety_category, 'gambling');
  assert.equal(result.external_link_count, 1);
  assert.equal(result.inspection_status, 'checked');
});

test('inspectCandidatePage moves an unavailable page to review instead of leaving it qualified', async () => {
  const result = await inspectCandidatePage(candidate(), {
    fetchFn: async () => {
      throw new Error('network unavailable');
    },
  });

  assert.equal(result.machine_status, 'review');
  assert.equal(result.quality_priority, 'review');
  assert.equal(result.inspection_status, 'unavailable');
  assert.match(result.inspection_note, /network unavailable/);
  assert.deepEqual(result.action_evidence, {
    comment_form: false,
    website_field: false,
    submission_form: false,
    submission_kind: '',
    explicit_submission_instructions: false,
    login_required: false,
    competitor_link_verified: false,
  });
});

test('inspectCandidatePage returns empty action evidence for a pre-rejected candidate', async () => {
  const result = await inspectCandidatePage({ ...candidate(), machine_status: 'rejected' });

  assert.deepEqual(result.action_evidence, {
    comment_form: false,
    website_field: false,
    submission_form: false,
    submission_kind: '',
    explicit_submission_instructions: false,
    login_required: false,
    competitor_link_verified: false,
  });
});

test('inspectCandidatePage verifies a competitor link found in the local page HTML', async () => {
  const candidateRecord = fromCompetitorSearchResult(
    { url: 'https://publisher.example.com/roundup', title: 'Tool roundup', content: '' },
    { competitorDomain: 'competitor.example.com', provider: 'searxng' }
  );

  const result = await inspectCandidatePage(candidateRecord, {
    fetchFn: async () => new Response(`
      <html><head><title>Tool roundup</title></head>
      <body><a href="https://competitor.example.com/product">Competitor Product</a></body></html>
    `, { status: 200, headers: { 'content-type': 'text/html' } }),
  });

  assert.equal(result.inspection_status, 'checked');
  assert.equal(result.competitor_target_url, 'https://competitor.example.com/product');
  assert.equal(result.anchor_text, 'Competitor Product');
  assert.equal(result.inspection_note, 'competitor_link_verified');
  assert.equal(result.action_evidence.competitor_link_verified, true);
});

test('inspectCandidatePage keeps a fetched competitor page inspectable when the target link is missing', async () => {
  const candidateRecord = fromCompetitorSearchResult(
    { url: 'https://publisher.example.com/roundup', title: 'Tool roundup', content: '' },
    { competitorDomain: 'competitor.example.com', provider: 'searxng' }
  );

  const result = await inspectCandidatePage(candidateRecord, {
    fetchFn: async () => new Response('<html><body><a href="https://other.example/tool">Other tool</a></body></html>', {
      status: 200,
      headers: { 'content-type': 'text/html' },
    }),
  });

  assert.equal(result.machine_status, 'review');
  assert.equal(result.quality_priority, 'review');
  assert.equal(result.inspection_status, 'checked');
  assert.equal(result.inspection_note, 'competitor_link_not_found');
});

test('inspectCandidatePage falls back to a configured Firecrawl instance only after direct fetching fails', async () => {
  const requests = [];
  const result = await inspectCandidatePage(candidate(), {
    firecrawlBaseUrl: 'http://firecrawl.test',
    fetchFn: async (url, options = {}) => {
      requests.push({ url: String(url), method: options.method || 'GET' });
      if (options.method !== 'POST') throw new Error('direct fetch unavailable');
      return new Response(JSON.stringify({
        data: {
          html: '<html><head><title>Rendered resources</title></head><body><a href="https://partner.example/tool">Partner</a></body></html>',
          metadata: { sourceURL: 'https://safe.example/resources' },
        },
      }), { status: 200, headers: { 'content-type': 'application/json' } });
    },
  });

  assert.deepEqual(requests, [
    { url: 'https://safe.example/resources', method: 'GET' },
    { url: 'http://firecrawl.test/v2/scrape', method: 'POST' },
  ]);
  assert.equal(result.inspection_status, 'checked');
  assert.equal(result.page_title, 'Rendered resources');
  assert.equal(result.external_link_count, 1);
  assert.equal(result.inspection_note, 'firecrawl_fallback');
});

test('inspectCandidatePage gives Firecrawl a fresh timeout signal after the direct request times out', async () => {
  const result = await inspectCandidatePage(candidate(), {
    firecrawlBaseUrl: 'http://firecrawl.test',
    timeoutMs: 1,
    fetchFn: async (url, options = {}) => {
      if (options.method !== 'POST') {
        await new Promise((resolve, reject) => options.signal.addEventListener('abort', () => reject(new Error('direct request timed out')), { once: true }));
        return resolve();
      }
      assert.equal(options.signal.aborted, false);
      return new Response(JSON.stringify({
        data: { html: '<html><body>Rendered fallback</body></html>' },
      }), { status: 200, headers: { 'content-type': 'application/json' } });
    },
  });

  assert.equal(result.inspection_status, 'checked');
  assert.equal(result.inspection_note, 'firecrawl_fallback');
});

test('inspectCandidatePage detects a complete comment form with a writable website field', async () => {
  const result = await inspectCandidatePage(candidate(), {
    fetchFn: async () => new Response(`
      <html><head><title>Useful tools for writers</title></head><body>
        <article>AI writing tools and practical workflows.</article>
        <form id="commentform">
          <input name="author" type="text">
          <input name="email" type="email">
          <input name="url" type="url">
          <textarea name="comment"></textarea>
        </form>
      </body></html>
    `, { status: 200, headers: { 'content-type': 'text/html' } }),
  });

  assert.equal(result.action_evidence.comment_form, true);
  assert.equal(result.action_evidence.website_field, true);
});

test('readonly website fields do not count as an actionable comment opportunity', async () => {
  const result = await inspectCandidatePage(candidate(), {
    fetchFn: async () => new Response(`
      <form id="commentform">
        <input name="author">
        <input name="email">
        <input name="url" readonly>
        <textarea name="comment"></textarea>
      </form>
    `, { status: 200, headers: { 'content-type': 'text/html' } }),
  });

  assert.equal(result.action_evidence.comment_form, true);
  assert.equal(result.action_evidence.website_field, false);
});

test('inspectCandidatePage distinguishes submission forms from generic contact pages', async () => {
  const submission = await inspectCandidatePage(candidate(), {
    fetchFn: async () => new Response(`
      <main><h1>Submit your AI tool</h1>
        <form action="/submit-tool"><input name="product_url"><textarea name="description"></textarea><button>Submit your tool</button></form>
      </main>
    `, { status: 200, headers: { 'content-type': 'text/html' } }),
  });
  const contact = await inspectCandidatePage(candidate(), {
    fetchFn: async () => new Response(`
      <main><h1>Contact us</h1><form action="/contact"><input name="email"><textarea name="message"></textarea></form></main>
    `, { status: 200, headers: { 'content-type': 'text/html' } }),
  });

  assert.equal(submission.action_evidence.submission_form, true);
  assert.equal(submission.action_evidence.submission_kind, 'tool_directory');
  assert.equal(contact.action_evidence.submission_form, false);
});

test('inspectCandidatePage records explicit resource instructions and login restrictions', async () => {
  const instructions = await inspectCandidatePage(candidate(), {
    fetchFn: async () => new Response(`
      <main><h1>AI writing resources</h1>
        <p>Our site accepts curated resource suggestions.</p>
        <p>Suggest a resource by sending its URL with a short description. Review our submission requirements first.</p>
      </main>
    `, { status: 200, headers: { 'content-type': 'text/html' } }),
  });
  const loginOnly = await inspectCandidatePage(candidate(), {
    fetchFn: async () => new Response(`
      <main><p>You must be logged in to post a comment.</p></main>
    `, { status: 200, headers: { 'content-type': 'text/html' } }),
  });

  assert.equal(instructions.action_evidence.explicit_submission_instructions, true);
  assert.equal(instructions.action_evidence.submission_kind, 'resource_page');
  assert.equal(loginOnly.action_evidence.login_required, true);
});

test('a Write for us heading is confirmed by topical scope, requirements and a concrete pitch method', async () => {
  const result = await inspectCandidatePage(candidate(), {
    fetchFn: async () => new Response(`
      <main>
        <h1>Write for us</h1>
        <p>We publish practical AI writing and editorial workflow articles.</p>
        <p>Send a pitch with an outline and author bio to editors@example.com.</p>
      </main>
    `, { status: 200, headers: { 'content-type': 'text/html' } }),
  });

  assert.equal(result.action_evidence.explicit_submission_instructions, true);
  assert.equal(result.action_evidence.submission_kind, 'guest_post');
});

test('a tutorial about building a Write for Us page is not actionable end to end', async () => {
  const inspected = await inspectCandidatePage(candidate(), {
    fetchFn: async () => new Response(`
      <html><head><title>How to build a Write for Us page</title></head><body>
        <main>
          <h1>How to build a Write for Us page</h1>
          <p>A strong page should explain that publishers accept articles about AI writing topics.</p>
          <p>This guide recommends listing submission requirements, an outline, and an author bio.</p>
          <p>The template should also give writers an email method such as editors@example.com.</p>
        </main>
      </body></html>
    `, { status: 200, headers: { 'content-type': 'text/html' } }),
  });
  const ranked = evaluateOpportunity(inspected, {
    mode: 'keyword',
    input: 'AI writing tools',
  });

  assert.equal(inspected.action_evidence.explicit_submission_instructions, false);
  assert.equal(inspected.action_evidence.submission_kind, '');
  assert.equal(ranked.machine_status, 'rejected');
  assert.equal(ranked.exclude_reason, 'quality:actionability_below_15');
});

test('a third-party Write for us best-practice article is not this site accepting submissions', async () => {
  const result = await inspectCandidatePage(candidate(), {
    fetchFn: async () => new Response(`
      <main>
        <h1>Write for us</h1>
        <p>Publishers commonly accept articles about AI writing and editorial workflows.</p>
        <p>Best practice is to require an outline and author bio, then provide editors@example.com for email pitches.</p>
      </main>
    `, { status: 200, headers: { 'content-type': 'text/html' } }),
  });

  assert.equal(result.action_evidence.explicit_submission_instructions, false);
  assert.equal(result.action_evidence.submission_kind, '');
});

test('a link building tutorial cannot turn generic email advice into a guest-post opportunity', async () => {
  const inspected = await inspectCandidatePage(candidate(), {
    fetchFn: async () => new Response(`
      <main>
        <h1>Link Building Best Practices</h1>
        <p>SEO consultants recommend writers submit an article via email with a draft and author bio.</p>
      </main>
    `, { status: 200, headers: { 'content-type': 'text/html' } }),
  });
  const ranked = evaluateOpportunity(inspected, {
    mode: 'keyword',
    input: 'useful tools',
  });

  assert.equal(inspected.action_evidence.explicit_submission_instructions, false);
  assert.equal(inspected.action_evidence.submission_kind, '');
  assert.equal(ranked.quality_components.actionability, 0);
  assert.equal(ranked.exclude_reason, 'quality:actionability_below_15');
});

test('a generic content tutorial without first-party acceptance does not create submission evidence', async () => {
  const result = await inspectCandidatePage(candidate(), {
    fetchFn: async () => new Response(`
      <main>
        <h1>Content Marketing Playbook</h1>
        <p>Editorial coaches advise contributors to submit a post by email including a writing sample and bio.</p>
      </main>
    `, { status: 200, headers: { 'content-type': 'text/html' } }),
  });

  assert.equal(result.action_evidence.explicit_submission_instructions, false);
  assert.equal(result.action_evidence.submission_kind, '');
});

test('ordinary first-party publishing cannot combine with third-party submission advice', async () => {
  const inspected = await inspectCandidatePage(candidate(), {
    fetchFn: async () => new Response(`
      <main>
        <h1>Marketing Research</h1>
        <p>We publish weekly articles about marketing research.</p>
        <p>SEO consultants advise writers to submit an article by email with a draft and author bio.</p>
      </main>
    `, { status: 200, headers: { 'content-type': 'text/html' } }),
  });
  const ranked = evaluateOpportunity(inspected, {
    mode: 'keyword',
    input: 'useful tools',
  });

  assert.equal(inspected.action_evidence.explicit_submission_instructions, false);
  assert.equal(inspected.action_evidence.submission_kind, '');
  assert.equal(ranked.quality_components.actionability, 0);
  assert.equal(ranked.exclude_reason, 'quality:actionability_below_15');
});

test('a first-party article explaining third-party submission advice is not an invitation', async () => {
  const inspected = await inspectCandidatePage(candidate(), {
    fetchFn: async () => new Response(`
      <main>
        <h1>Marketing Research</h1>
        <p>We publish articles explaining how SEO consultants recommend writers submit an article by email with a draft and author bio.</p>
      </main>
    `, { status: 200, headers: { 'content-type': 'text/html' } }),
  });
  const ranked = evaluateOpportunity(inspected, {
    mode: 'keyword',
    input: 'useful tools',
  });

  assert.equal(inspected.action_evidence.explicit_submission_instructions, false);
  assert.equal(inspected.action_evidence.submission_kind, '');
  assert.equal(ranked.quality_components.actionability, 0);
});

test('first-party acceptance language must name a submission object instead of combining with tutorial advice', async () => {
  const cases = [
    'We accept cookies to improve analytics.',
    'We welcome feedback from readers.',
    'We seek analytics feedback from product teams.',
    'Our site accepts secure card payments.',
  ];

  for (const publisherStatement of cases) {
    const result = await inspectCandidatePage(candidate(), {
      fetchFn: async () => new Response(`
        <main>
          <h1>Content Marketing Playbook</h1>
          <p>${publisherStatement}</p>
          <p>SEO consultants recommend writers submit an article via email with a draft and author bio.</p>
        </main>
      `, { status: 200, headers: { 'content-type': 'text/html' } }),
    });

    assert.equal(result.action_evidence.explicit_submission_instructions, false, publisherStatement);
    assert.equal(result.action_evidence.submission_kind, '', publisherStatement);
  }
});

test('third-party advice cannot supply the method for a valid first-party acceptance statement', async () => {
  const result = await inspectCandidatePage(candidate(), {
    fetchFn: async () => new Response(`
      <main>
        <h1>Contributor Guidelines</h1>
        <p>We accept guest articles about AI writing and editorial workflows.</p>
        <p>SEO consultants recommend writers submit an article by email with a draft and author bio.</p>
      </main>
    `, { status: 200, headers: { 'content-type': 'text/html' } }),
  });

  assert.equal(result.action_evidence.explicit_submission_instructions, false);
  assert.equal(result.action_evidence.submission_kind, '');
});

test('attributed third-party methods cannot supply a valid first-party acceptance statement', async () => {
  const cases = [
    {
      acceptance: 'We accept guest articles about AI writing and editorial workflows.',
      method: 'According to SEO consultants, submit an article by email with a draft and author bio.',
    },
    {
      acceptance: 'Our editorial team welcomes submissions covering AI writing and editorial workflows.',
      method: 'Industry experts say writers should submit an article by email with a draft and author bio.',
    },
  ];

  for (const { acceptance, method } of cases) {
    const result = await inspectCandidatePage(candidate(), {
      fetchFn: async () => new Response(`
        <main>
          <h1>Contributor Guidelines</h1>
          <p>${acceptance}</p>
          <p>${method}</p>
        </main>
      `, { status: 200, headers: { 'content-type': 'text/html' } }),
    });

    assert.equal(result.action_evidence.explicit_submission_instructions, false, method);
    assert.equal(result.action_evidence.submission_kind, '', method);
  }
});

test('third-party attribution rejects methods even when they name our editorial recipients', async () => {
  const cases = [
    'According to SEO consultants, writers should submit an article to our editorial team with a draft and author bio.',
    'Industry experts recommend writers submit an article to our editors with a draft and author bio.',
  ];

  for (const method of cases) {
    const result = await inspectCandidatePage(candidate(), {
      fetchFn: async () => new Response(`
        <main>
          <h1>Contributor Guidelines</h1>
          <p>We accept guest articles about AI writing and editorial workflows.</p>
          <p>${method}</p>
        </main>
      `, { status: 200, headers: { 'content-type': 'text/html' } }),
    });

    assert.equal(result.action_evidence.explicit_submission_instructions, false, method);
    assert.equal(result.action_evidence.submission_kind, '', method);
  }
});

test('first-party guest-article acceptance and an editorial pitch instruction remain actionable', async () => {
  const result = await inspectCandidatePage(candidate(), {
    fetchFn: async () => new Response(`
      <main>
        <h1>Contributor Guidelines</h1>
        <p>We accept guest articles about AI writing and editorial workflows.</p>
        <p>Send your pitch to our editorial team at editors@example.com.</p>
        <p>Include an original outline, author bio, and two writing samples.</p>
      </main>
    `, { status: 200, headers: { 'content-type': 'text/html' } }),
  });

  assert.equal(result.action_evidence.explicit_submission_instructions, true);
  assert.equal(result.action_evidence.submission_kind, 'guest_post');
});

test('explicitly negative submission statements and methods are not actionable', async () => {
  const cases = [
    {
      rejection: 'We accept no guest articles.',
      companion: 'Submit an article by email with an original outline and author bio to editors@example.com.',
    },
    {
      rejection: 'We do not accept submissions.',
      companion: 'Submit an article by email with an original outline and author bio to editors@example.com.',
    },
    {
      rejection: 'No guest posts.',
      companion: 'Submit an article by email with an original outline and author bio to editors@example.com.',
    },
    {
      rejection: 'Do not send your pitch to our editorial team.',
      companion: 'We accept guest articles about AI writing and editorial workflows.',
    },
    {
      rejection: 'We are not accepting contributions.',
      companion: 'Submit an article by email with an original outline and author bio to editors@example.com.',
    },
    {
      rejection: 'We no longer accept guest posts.',
      companion: 'Submit an article by email with an original outline and author bio to editors@example.com.',
    },
  ];

  for (const { rejection, companion } of cases) {
    const result = await inspectCandidatePage(candidate(), {
      fetchFn: async () => new Response(`
        <main>
          <h1>Contributor Guidelines</h1>
          <p>${rejection}</p>
          <p>${companion}</p>
          <p>Topics include AI writing and editorial workflows; include an outline and author bio.</p>
        </main>
      `, { status: 200, headers: { 'content-type': 'text/html' } }),
    });

    assert.equal(result.action_evidence.explicit_submission_instructions, false, rejection);
    assert.equal(result.action_evidence.submission_kind, '', rejection);
  }
});

test('not only acceptance wording remains actionable', async () => {
  const result = await inspectCandidatePage(candidate(), {
    fetchFn: async () => new Response(`
      <main>
        <h1>Contributor Guidelines</h1>
        <p>We not only accept guest articles but also contributed research about AI writing.</p>
        <p>Send your pitch to our editorial team at editors@example.com with an outline and author bio.</p>
      </main>
    `, { status: 200, headers: { 'content-type': 'text/html' } }),
  });

  assert.equal(result.action_evidence.explicit_submission_instructions, true);
  assert.equal(result.action_evidence.submission_kind, 'guest_post');
});

test('a valid local submission form remains actionable beside a negative guest-post statement', async () => {
  const result = await inspectCandidatePage(candidate(), {
    fetchFn: async () => new Response(`
      <main>
        <h1>Submit your AI tool</h1>
        <p>We do not accept guest posts.</p>
        <form action="/submit-tool">
          <input name="product_url">
          <textarea name="description"></textarea>
          <button type="submit">Submit your tool</button>
        </form>
      </main>
    `, { status: 200, headers: { 'content-type': 'text/html' } }),
  });

  assert.equal(result.action_evidence.submission_form, true);
  assert.equal(result.action_evidence.submission_kind, 'tool_directory');
});

test('first-party editorial submissions and a direct email path remain actionable', async () => {
  const result = await inspectCandidatePage(candidate(), {
    fetchFn: async () => new Response(`
      <main>
        <h1>Contributor Guidelines</h1>
        <p>Our editorial team welcomes submissions covering AI writing and editorial workflows.</p>
        <p>Email your pitch to editors@example.com.</p>
        <p>Include an original outline, author bio, and two writing samples.</p>
      </main>
    `, { status: 200, headers: { 'content-type': 'text/html' } }),
  });

  assert.equal(result.action_evidence.explicit_submission_instructions, true);
  assert.equal(result.action_evidence.submission_kind, 'guest_post');
});

test('first-party guest-article acceptance remains actionable with scope requirements and email submission', async () => {
  const result = await inspectCandidatePage(candidate(), {
    fetchFn: async () => new Response(`
      <main>
        <h1>Contributor Guidelines</h1>
        <p>We accept guest articles about AI writing and editorial workflows.</p>
        <p>Submit an article by email with an original outline, author bio, and two writing samples to editors@example.com.</p>
      </main>
    `, { status: 200, headers: { 'content-type': 'text/html' } }),
  });

  assert.equal(result.action_evidence.explicit_submission_instructions, true);
  assert.equal(result.action_evidence.submission_kind, 'guest_post');
});

test('first-party editorial submissions remain actionable with scope requirements and email submission', async () => {
  const result = await inspectCandidatePage(candidate(), {
    fetchFn: async () => new Response(`
      <main>
        <h1>Contributor Guidelines</h1>
        <p>Our editorial team welcomes submissions covering AI writing and editorial workflows.</p>
        <p>Submit an article by email with an original outline, author bio, and two writing samples to editors@example.com.</p>
      </main>
    `, { status: 200, headers: { 'content-type': 'text/html' } }),
  });

  assert.equal(result.action_evidence.explicit_submission_instructions, true);
  assert.equal(result.action_evidence.submission_kind, 'guest_post');
});

test('inspectCandidatePage does not treat a submission tutorial title as actionable instructions', async () => {
  const result = await inspectCandidatePage(candidate(), {
    fetchFn: async () => new Response(`
      <main><h1>How to submit your tool via email</h1>
        <p>This tutorial explains why product directories review submissions.</p>
      </main>
    `, { status: 200, headers: { 'content-type': 'text/html' } }),
  });

  assert.equal(result.action_evidence.explicit_submission_instructions, false);
});

test('inspectCandidatePage ignores head and heading tutorial text for page-level submission evidence', async () => {
  const result = await inspectCandidatePage(candidate(), {
    fetchFn: async () => new Response(`
      <html><head><title>How to submit your tool via email</title></head><body>
        <article>This tutorial explains why product directories review submissions.</article>
      </body></html>
    `, { status: 200, headers: { 'content-type': 'text/html' } }),
  });

  assert.equal(result.action_evidence.explicit_submission_instructions, false);
  assert.equal(result.action_evidence.submission_kind, '');
});

test('inspectCandidatePage derives submission kind from the form action and writable fields', async () => {
  const result = await inspectCandidatePage(candidate(), {
    fetchFn: async () => new Response(`
      <main><h1>Submit your AI tool</h1>
        <form action="/submit-tool">
          <input name="product_url">
          <textarea name="description"></textarea>
          <button type="submit">Submit</button>
        </form>
      </main>
    `, { status: 200, headers: { 'content-type': 'text/html' } }),
  });

  assert.equal(result.action_evidence.submission_form, true);
  assert.equal(result.action_evidence.submission_kind, 'tool_directory');
});

test('a generic website form does not inherit a submission kind from a tutorial page', async () => {
  const result = await inspectCandidatePage(candidate(), {
    fetchFn: async () => new Response(`
      <html><head><title>Guest post directory submission tutorial</title></head><body>
        <main>
          <h1>How to submit a guest post to directories</h1>
          <p>This tutorial compares common outreach workflows.</p>
          <form action="/send">
            <input name="website">
            <button type="submit">Submit</button>
          </form>
        </main>
      </body></html>
    `, { status: 200, headers: { 'content-type': 'text/html' } }),
  });

  assert.equal(result.action_evidence.submission_form, false);
  assert.equal(result.action_evidence.submission_kind, '');
});
