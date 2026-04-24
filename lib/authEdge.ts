export const AUTH_COOKIE_NAME = 'jem_session';
export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

function base64urlToBytes(b64url: string): Uint8Array {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4));
  const bin = atob(b64 + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function bytesToBase64url(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function hmacSha256(secret: string, data: string): Promise<Uint8Array> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return new Uint8Array(sig);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function verifySessionCookieEdge(
  cookie: string | undefined,
  secret: string
): Promise<{ code: string; issuedAt: number } | null> {
  if (!cookie) return null;
  const [payloadB64, sigB64] = cookie.split('.');
  if (!payloadB64 || !sigB64) return null;

  const expected = await hmacSha256(secret, payloadB64);
  if (!timingSafeEqual(bytesToBase64url(expected), sigB64)) return null;

  try {
    const payload = new TextDecoder().decode(base64urlToBytes(payloadB64));
    const [code, issuedAtStr] = payload.split(':');
    const issuedAt = parseInt(issuedAtStr, 10);
    if (!code || !Number.isFinite(issuedAt)) return null;
    if (Date.now() / 1000 - issuedAt > AUTH_COOKIE_MAX_AGE) return null;
    return { code, issuedAt };
  } catch {
    return null;
  }
}
