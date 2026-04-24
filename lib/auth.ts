import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export const AUTH_COOKIE_NAME = 'jem_session';
export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

const CODES_FILE = path.join(process.cwd(), 'data', 'access-codes.json');

export interface AccessCodeEntry {
  label: string;
  issuedAt?: string;
}

export type AccessCodesMap = Record<string, AccessCodeEntry>;

export function readAccessCodes(): AccessCodesMap {
  try {
    const raw = fs.readFileSync(CODES_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as AccessCodesMap;
    }
    return {};
  } catch {
    return {};
  }
}

export function isValidCode(code: string): boolean {
  if (!code) return false;
  return code in readAccessCodes();
}

function getSecret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) {
    throw new Error('AUTH_SECRET env var is required (min 16 chars)');
  }
  return s;
}

function base64url(buf: Buffer): string {
  return buf
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function fromBase64url(s: string): Buffer {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4));
  return Buffer.from(b64 + pad, 'base64');
}

export function signSessionCookie(code: string): string {
  const issuedAt = Math.floor(Date.now() / 1000);
  const payloadB64 = base64url(Buffer.from(`${code}:${issuedAt}`, 'utf8'));
  const sigB64 = base64url(
    crypto.createHmac('sha256', getSecret()).update(payloadB64).digest()
  );
  return `${payloadB64}.${sigB64}`;
}

export function verifySessionCookie(
  cookie: string | undefined
): { code: string; issuedAt: number } | null {
  if (!cookie) return null;
  const [payloadB64, sigB64] = cookie.split('.');
  if (!payloadB64 || !sigB64) return null;

  const expectedSigB64 = base64url(
    crypto.createHmac('sha256', getSecret()).update(payloadB64).digest()
  );

  const a = Buffer.from(expectedSigB64);
  const b = Buffer.from(sigB64);
  if (a.length !== b.length) return null;
  if (!crypto.timingSafeEqual(a, b)) return null;

  try {
    const payload = fromBase64url(payloadB64).toString('utf8');
    const [code, issuedAtStr] = payload.split(':');
    const issuedAt = parseInt(issuedAtStr, 10);
    if (!code || !Number.isFinite(issuedAt)) return null;
    if (Date.now() / 1000 - issuedAt > AUTH_COOKIE_MAX_AGE) return null;
    return { code, issuedAt };
  } catch {
    return null;
  }
}
