import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js edge middleware — protects /dashboard routes.
 *
 * Checks for the lightweight `sessionExists` cookie that the frontend
 * sets on login. The actual JWT validation happens in Express; this is
 * only a first-pass guard to avoid rendering protected pages for
 * definitely-unauthenticated users.
 */
export function middleware(request: NextRequest) {
  const sessionExists = request.cookies.get('sessionExists');

  if (!sessionExists) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('from', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
