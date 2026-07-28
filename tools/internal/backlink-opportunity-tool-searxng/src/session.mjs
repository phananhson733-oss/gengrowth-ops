const encoder = new TextEncoder();

function base64Url(bytes) {
  let text = '';
  for (const byte of bytes) text += String.fromCharCode(byte);
  return btoa(text).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

async function sign(value, secret) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(String(secret)), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return base64Url(new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(value))));
}

function constantTimeEqual(leftValue, rightValue) {
  const left = encoder.encode(String(leftValue));
  const right = encoder.encode(String(rightValue));
  const length = Math.max(left.length, right.length);
  let difference = left.length ^ right.length;
  for (let index = 0; index < length; index += 1) difference |= (left[index] || 0) ^ (right[index] || 0);
  return difference === 0;
}

export async function verifyAccessToken({ candidate, accessToken }) {
  return constantTimeEqual(candidate, accessToken);
}

export async function issueSession({ sessionSecret, now = Date.now }) {
  const expiresAt = String(now() + 30 * 24 * 60 * 60 * 1_000);
  return `${expiresAt}.${await sign(expiresAt, sessionSecret)}`;
}

export async function verifySession({ value, sessionSecret, now = Date.now }) {
  const [expiresAt, signature, extra] = String(value || '').split('.');
  if (!expiresAt || !signature || extra || !/^\d+$/.test(expiresAt) || Number(expiresAt) <= now()) return false;
  return constantTimeEqual(signature, await sign(expiresAt, sessionSecret));
}
