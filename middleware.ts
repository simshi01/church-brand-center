import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME, verifySessionCookieEdge } from '@/lib/authEdge';

const PUBLIC_PATHS = new Set<string>(['/login']);
const PUBLIC_PREFIXES = ['/api/auth/', '/fonts/'];

function isPublic(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (isPublic(pathname)) return NextResponse.next();

  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    return new NextResponse('AUTH_SECRET is not configured', { status: 500 });
  }

  const cookie = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  const session = await verifySessionCookieEdge(cookie, secret);

  if (!session) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.search = '';
    if (pathname !== '/') url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
