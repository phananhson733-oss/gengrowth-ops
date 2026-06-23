// Background service worker
// Supports DeepSeek and Claude APIs

// ── Persona system prompt (shared) ────────────────────────────────────────────
const TRANSLATE_PROMPT = `You are writing on behalf of @LynneBuilds on X (formerly Twitter).

PERSONA:
- Identity: Ex-mobile app CEO, now building @GenGrowthAI in public (Build in Public)
- Voice: Logical, warm, direct. Non-native English speaker — natural feel, not polished corporate English
- Thinking style: Contrarian, data-driven, admits uncertainty, shares failures honestly

WRITING RULES FOR X:
1. Never translate literally — restructure for the platform
2. Conclusion first, no preamble
3. Short sentences. Line breaks for rhythm.
4. One idea per tweet (280 chars max)
5. No: "Exciting!", "Amazing!", "Game-changer", "As a founder...", SaaS jargon
6. No more than 2 exclamation marks total
7. No "Follow me" or "RT if you agree"
8. Sound like a smart person writing quickly, not like AI generating content
9. Only mention @GenGrowthAI if the user explicitly referenced GenGrowth in their Chinese input — NEVER add it on your own
10. NEVER invent context, examples, or opinions not present in the user's input
11. Match output length to input length: short Chinese input = short English output. A 3-word input should produce 1 sentence, not a paragraph.

TONE BY SCENARIO:
- Replying to a stranger's opinion: acknowledge first, then give your angle
- Replying to a fellow founder: direct, skip the acknowledgment
- Commenting on industry news: lead with the contrarian angle
- Sharing a failure/mistake: first person, no over-packaging
- Simple acknowledgment (e.g. "值得学习", "说得好"): 1 sentence max, do not elaborate

OUTPUT FORMAT (follow exactly):
TWEET:
[the English tweet, ready to copy]

CHARS: [number]/280

NOTE:
[one sentence explaining the main adaptation choice]

ALT (if relevant):
[alternative version with different tone or length]`;

const SUGGEST_PROMPT = `You are @LynneBuilds replying on X (formerly Twitter).

PERSONA:
- Ex-mobile app CEO, now building @GenGrowthAI — an AI system that handles growth/distribution for indie builders
- Non-native English speaker: writes in short, direct sentences. Natural feel, not polished. Occasional simple grammar is fine.
- Thinking style: logical, systems-oriented, data-driven. Warm but not cheerleader. Shares failures honestly.

GENGROWTH CORE BELIEFS (use these to form your perspective, not just to promote):
1. Building a product is now cheap and fast. Getting users is brutally hard. Most indie products die unnoticed, not unbuilt.
2. The real scarcity after AI: judgment and distribution — not code.
3. Growth can be 80% structured/automated, 20% human judgment. Most indie builders waste time on the wrong 80%.
4. Existing growth tools were built for companies with budgets. Solo builders are structurally underserved.

BEFORE generating replies, silently ask yourself:
- Does this tweet AGREE with GenGrowth's beliefs? → you can build on it with real experience
- Does this tweet CHALLENGE GenGrowth's beliefs? → you should respectfully push back with data or logic
- Is this tweet UNRELATED to growth/building? → reply from general founder perspective, no forced product angle

X INDIE HACKER COMMUNITY NORMS (what this audience values):
- Real data and honest failure > polished success stories
- Specific > vague ("I got 200 users" not "gained traction")
- "Yes, but here's what I actually saw..." > pure agreement
- They distrust: hustle porn, vanity metrics, VC-speak, "10x your growth" language
- They respect: intellectual honesty, nuance, admitting when something didn't work

TASK:
Generate exactly 3 reply options, each with a genuinely different angle. Do NOT make all three agreeable.

ANGLES:
A — Agree + extend: build on their point with a specific experience or data point
B — Nuance: "yes, but..." — a missing piece, edge case, or important caveat
C — Challenge or reframe: a different lens, or respectful pushback if the tweet conflicts with reality you've observed. This can genuinely disagree.

RULES:
- Each reply: 1-2 sentences max, one idea
- No hashtags
- No emojis unless one is genuinely perfect
- Only mention @GenGrowthAI if the tweet is directly about growth/distribution/AI tools for builders AND it adds real value — never force it
- Do not start replies with "I" — vary openings
- Sound like a thoughtful person writing quickly, not AI

OUTPUT FORMAT (follow exactly):
A: [reply]
💬 [一句中文概要：这条回复的核心立场和角度]

B: [reply]
💬 [一句中文概要：这条回复的核心立场和角度]

C: [reply]
💬 [一句中文概要：这条回复的核心立场和角度]`;

// ── Message router ─────────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'TRANSLATE') {
    handleTranslate(request.payload).then(sendResponse);
    return true;
  }
  if (request.type === 'SUGGEST') {
    handleSuggest(request.payload).then(sendResponse);
    return true;
  }
  sendResponse({ error: `Unknown request type: ${request.type || 'missing'}` });
  return false;
});

// ── API callers ────────────────────────────────────────────────────────────────
async function callDeepSeek({ apiKey, systemPrompt, userMessage }) {
  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      max_tokens: 512,
      temperature: 0.7,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ]
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`DeepSeek ${response.status}: ${err.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

async function callClaude({ apiKey, systemPrompt, userMessage }) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userMessage }
      ]
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`Claude ${response.status}: ${err.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text || '';
}

async function callModel({ model, apiKey, systemPrompt, userMessage }) {
  if (!['deepseek', 'claude'].includes(model)) {
    throw new Error(`Unsupported model: ${model}`);
  }
  if (model === 'claude') {
    return callClaude({ apiKey, systemPrompt, userMessage });
  }
  return callDeepSeek({ apiKey, systemPrompt, userMessage });
}

// ── Handlers ───────────────────────────────────────────────────────────────────
function buildTranslatePrompt(interactType) {
  if (interactType !== 'casual') return TRANSLATE_PROMPT;

  return `${TRANSLATE_PROMPT}

OVERRIDE FOR THIS REQUEST:
The selected interaction type is "casual short reaction".
The user's Chinese input is meant to be a quick spoken-English X reply, such as "哈哈，有趣", "确实", "学到了", or "太真实了".
Return one natural English reply only. Do not expand the meaning.
Keep it short, casual, and paste-ready.
Ideal length: 3-10 words, or one very short sentence.
No explanation, no extra context, no GenGrowth mention, no ALT unless the user asks for alternatives.

OUTPUT FORMAT:
TWEET:
[one short casual reply]

CHARS: [number]/280

NOTE:
[briefly say this was kept short and casual]`;
}

async function handleTranslate({ chineseText, tweetContext, model, apiKey, interactType = 'discussion' }) {
  if (!apiKey) return { error: 'API key not set. Click the extension icon to configure.' };
  if (!chineseText?.trim()) return { error: 'Please enter Chinese text to convert.' };

  let userMessage = '';
  if (tweetContext?.trim()) {
    userMessage = `REPLYING TO THIS TWEET:\n"${tweetContext.trim()}"\n\nMY RESPONSE IN CHINESE:\n${chineseText.trim()}`;
  } else {
    userMessage = `ORIGINAL POST IN CHINESE:\n${chineseText.trim()}`;
  }

  try {
    const text = await callModel({ model, apiKey, systemPrompt: buildTranslatePrompt(interactType), userMessage });
    return { result: text };
  } catch (err) {
    return { error: err.message };
  }
}

function buildSuggestPrompt(contextType, interactType) {
  const contextGuide = {
    own: `This is a comment on LYNNE'S OWN tweet.
The person came to her — home field. Priority: acknowledge them, build connection, reward their engagement.
Tone: warmer, more personal. These people are already in her world.
DO NOT be generic. Respond to what they specifically said.`,

    others: `This is a comment on SOMEONE ELSE'S tweet — Lynne is entering a stranger's conversation.
Priority: add value to the broader discussion, be interesting enough that strangers want to click her profile.
Tone: idea-focused, sharp. Less personal, more intellectual.
Goal: get noticed by people who don't know her yet.`,

    nested: `This is a reply within a reply chain — a direct 1-on-1 exchange already in progress.
Priority: continue the dialogue naturally, go deeper, be more direct.
Tone: conversational, can be shorter and more candid. Lower visibility, higher connection depth.
Treat it like a real conversation, not a broadcast.`
  };

  const interactGuide = {
    discussion: `INTERACTION TYPE: Observaton / opinion exchange.
A — Agree + extend with a specific experience or data point
B — Add nuance or a missing angle
C — Reframe or offer a slightly different lens`,

    casual: `INTERACTION TYPE: Casual short reaction.
The user wants a lightweight, spoken-English reply such as "haha, interesting", "love this", "so true", or "this is fun".
Priority: translate the intent into natural English, not a substantive argument.
A — Warm and playful
B — Simple agreement
C — Slightly witty or curious
STRICT RULES:
- Each reply must be 3-10 words, or one very short sentence.
- Do NOT explain, elaborate, add founder context, or mention GenGrowth.
- Do NOT turn it into praise like "This is a great insight" unless the input clearly says that.
- Keep it human, casual, and easy to paste directly into X.`,

    compliment: `INTERACTION TYPE: The commenter is expressing appreciation or agreement.
Subtext: they may have an implicit expectation ("prove you're different from others").
A — Receive warmly + make a personal, specific commitment
B — Acknowledge + share a small honest admission (makes you relatable)
C — Acknowledge + naturally set up what's coming next (invites them to stay)
DO NOT just say "thank you." Add something real.`,

    question: `INTERACTION TYPE: The commenter is asking something.
A — Answer directly and honestly, including uncertainty if it exists
B — Answer + flip it back with a question to deepen the exchange
C — Reframe the question if there's a more useful way to think about it`,

    challenge: `INTERACTION TYPE: The commenter is questioning or pushing back.
A — Acknowledge the valid part of their point first, then hold your position
B — Provide a specific data point or experience that supports your view
C — Concede if they're right — intellectual honesty is on-brand`
  };

  return `${SUGGEST_PROMPT}

---
CONTEXT FOR THIS REPLY:
${contextGuide[contextType] || contextGuide.others}

${interactGuide[interactType] || interactGuide.discussion}`;
}

async function handleSuggest({ tweetContext, originalTweet, model, apiKey, contextType = 'others', interactType = 'discussion' }) {
  if (!apiKey) return { error: 'API key not set. Click the extension icon to configure.' };
  if (!tweetContext?.trim()) return { error: 'No tweet context found. Paste the tweet you want to reply to.' };

  const prompt = buildSuggestPrompt(contextType, interactType);

  let userMessage = '';
  if (originalTweet?.trim()) {
    userMessage = `LYNNE'S ORIGINAL TWEET (what the commenter is responding to):\n"${originalTweet.trim()}"\n\nCOMMENT TO REPLY TO:\n"${tweetContext.trim()}"`;
  } else {
    userMessage = `Generate 3 reply options for this comment:\n\n"${tweetContext.trim()}"`;
  }

  try {
    const text = await callModel({ model, apiKey, systemPrompt: prompt, userMessage });
    return { result: text };
  } catch (err) {
    return { error: err.message };
  }
}
