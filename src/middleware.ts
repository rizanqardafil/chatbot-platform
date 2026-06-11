import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || '');

const PUBLIC_PATHS = ['/login', '/register'];
const AUTH_PATHS = ['/login', '/register'];

async function isValidToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value;

  const isPublicPath = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const isAuthPath = AUTH_PATHS.some((p) => pathname.startsWith(p));

  // Authenticated users visiting login/register → redirect to projects
  if (isAuthPath && token && (await isValidToken(token))) {
    return NextResponse.redirect(new URL('/projects', request.url));
  }

  // Unauthenticated users visiting protected routes → redirect to login
  if (!isPublicPath) {
    if (!token || !(await isValidToken(token))) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)/',
    '/',
    '/projects/:path*',
  ],
};
