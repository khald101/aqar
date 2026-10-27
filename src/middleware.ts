import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const COOKIE_NAME = 'amarah_session';

function parseJwtPayload(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonStr = atob(base64);
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;

  // 1. Static files & public assets
  const isStaticFile =
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/public') ||
    pathname.includes('.');

  if (isStaticFile) {
    return NextResponse.next();
  }

  // 2. Public auth endpoints
  const isAuthPage = pathname.startsWith('/login');
  const isPublicApi = pathname === '/api/auth/login';

  if (isPublicApi) {
    return NextResponse.next();
  }

  // If already authenticated and trying to visit login
  if (isAuthPage && token) {
    const user = parseJwtPayload(token);
    if (user?.roles?.includes('TENANT') && !user?.roles?.includes('ADMIN')) {
      return NextResponse.redirect(new URL('/portal/tenant', request.url));
    }
    if (user?.roles?.includes('OWNER') && !user?.roles?.includes('ADMIN')) {
      return NextResponse.redirect(new URL('/portal/owner', request.url));
    }
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Allow unauthenticated visits to login page
  if (isAuthPage) {
    return NextResponse.next();
  }

  // 3. Reject unauthenticated access to all app & API routes
  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'غير مصرح بالدخول' }, { status: 401 });
    }
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // 4. Role-based & Permission-based route gating
  const user = parseJwtPayload(token);
  if (!user || !user.roles) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'جلسة المستخدم غير صالحة' }, { status: 401 });
    }
    const res = NextResponse.redirect(new URL('/login', request.url));
    res.cookies.delete(COOKIE_NAME);
    return res;
  }

  // Skip page routing checks for API requests (API routes enforce permissions directly)
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  const roles: string[] = user.roles || [];
  const perms: string[] = user.permissions || [];
  const isAdmin = roles.includes('ADMIN');

  // Pure Tenant routing: strictly restricted to /portal/tenant
  const isTenantOnly = roles.includes('TENANT') && !isAdmin;
  if (isTenantOnly) {
    if (!pathname.startsWith('/portal/tenant')) {
      return NextResponse.redirect(new URL('/portal/tenant', request.url));
    }
    return NextResponse.next();
  }

  // Pure Owner routing: strictly restricted to /portal/owner
  const isOwnerOnly = roles.includes('OWNER') && !isAdmin;
  if (isOwnerOnly) {
    if (!pathname.startsWith('/portal/owner')) {
      return NextResponse.redirect(new URL('/portal/owner', request.url));
    }
    return NextResponse.next();
  }

  // Non-tenants cannot access /portal/tenant unless ADMIN
  if (pathname.startsWith('/portal/tenant') && !roles.includes('TENANT') && !isAdmin) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Non-owners cannot access /portal/owner unless ADMIN
  if (pathname.startsWith('/portal/owner') && !roles.includes('OWNER') && !isAdmin) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Staff Section Permission Checks
  if (pathname.startsWith('/users') && !isAdmin && !perms.includes('users:view')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  if (pathname.startsWith('/roles') && !isAdmin && !perms.includes('roles:view') && !perms.includes('roles:manage')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  if (pathname.startsWith('/audit-logs') && !isAdmin && !perms.includes('audit:view')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  if (
    pathname.startsWith('/accounting') &&
    !isAdmin &&
    !perms.includes('financial:journal') &&
    !perms.includes('financial:expenses') &&
    !perms.includes('owners:settlements')
  ) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  if (
    pathname.startsWith('/payments') &&
    !isAdmin &&
    !perms.includes('financial:payments') &&
    !perms.includes('financial:view')
  ) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  if (pathname.startsWith('/properties') && !isAdmin && !perms.includes('properties:view')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  if (pathname.startsWith('/contracts') && !isAdmin && !perms.includes('contracts:view')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  if (pathname.startsWith('/maintenance') && !isAdmin && !perms.includes('maintenance:view')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  if (pathname.startsWith('/owners') && !isAdmin && !perms.includes('owners:view')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  if (pathname.startsWith('/tenants') && !isAdmin && !perms.includes('tenants:view')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  if (pathname.startsWith('/ai-advisor') && !isAdmin && !perms.includes('ai:insights')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
