import { NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure:
      process.env.NODE_ENV === 'production' &&
      process.env.AUTH_COOKIE_INSECURE !== 'true',
    path: '/',
    maxAge: 0,
  });
  return res;
}
