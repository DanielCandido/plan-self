import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_ROUTES = ['/login', '/register', '/forgot-password'];
const PRIVATE_ROUTES = ['/dashboard', '/projects', '/settings'];
const DEFAULT_PRIVATE_ROUTE = '/dashboard';
const DEFAULT_PUBLIC_ROUTE = '/login';

/**
 * Edge middleware for route protection.
 * Access token lives in memory on the client, so middleware relies on a
 * `planself_session` cookie flag set by the backend (httpOnly refresh token
 * presence is used as a proxy for "has active session").
 *
 * This provides protection against unauthenticated users navigating directly
 * to private routes. The full auth state is validated client-side via /auth/me
 * in the bootstrap hook.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const sessionCookie = req.cookies.get('refresh_token')?.value;

  const isAuthenticated = Boolean(sessionCookie);
  const isPublicRoute = PUBLIC_ROUTES.some((r) => pathname.startsWith(r));
  const isPrivateRoute = PRIVATE_ROUTES.some((r) => pathname.startsWith(r));

  // Unauthenticated user trying to access a private route
  if (!isAuthenticated && isPrivateRoute) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = DEFAULT_PUBLIC_ROUTE;
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated user trying to access login/register
  if (isAuthenticated && isPublicRoute) {
    const dashboardUrl = req.nextUrl.clone();
    dashboardUrl.pathname = DEFAULT_PRIVATE_ROUTE;
    dashboardUrl.searchParams.delete('redirect');
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static, _next/image (Next.js internals)
     * - favicon, public files
     * - api routes
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?)$).*)',
  ],
};
