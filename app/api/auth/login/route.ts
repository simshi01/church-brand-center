import { NextRequest, NextResponse } from 'next/server';
import {
  AUTH_COOKIE_MAX_AGE,
  AUTH_COOKIE_NAME,
  isValidCode,
  signSessionCookie,
} from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const rawCode = typeof body?.code === 'string' ? body.code : '';
  const code = rawCode.trim();

  if (!code) {
    return NextResponse.json(
      { ok: false, error: 'Введите код' },
      { status: 400 }
    );
  }

  if (!isValidCode(code)) {
    return NextResponse.json(
      { ok: false, error: 'Код не распознан' },
      { status: 401 }
    );
  }

  const value = signSessionCookie(code);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE_NAME, value, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: AUTH_COOKIE_MAX_AGE,
  });
  return res;
}
