import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// ─── Publicly accessible paths (no auth needed) ───────────────────────────────
const PUBLIC_PATHS = new Set([
  '/auth/login',
  '/auth/register',
  '/auth/select-branch',
  '/auth/chain-login',
  '/welcome',
]);

// ─── API paths that require specific roles ────────────────────────────────────
const ADMIN_ONLY_API = [
  '/api/staff/create',
  '/api/db-backup',
  '/api/db-cleanup',
  '/api/db-usage',
  '/api/agent/execute',
];

const DEV_ONLY_PATHS = ['/dev'];

// ─── Rate limit store (edge-compatible — per-instance, resets on cold start) ──
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true; // allowed
  }
  if (entry.count >= limit) return false; // blocked
  entry.count++;
  return true;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

  // ── 1. Rate limit endpoints ──────────────────────────────────────────────
  if (pathname.startsWith('/api/')) {
    const isSensitive = ['/api/auth/', '/api/agent/'].some(r => pathname.startsWith(r));
    const limit = isSensitive ? 20 : 100;
    const windowMs = 60_000; // 1 minute

    const allowed = checkRateLimit(`${ip}:${pathname}`, limit, windowMs);
    if (!allowed) {
      return NextResponse.json(
        { error: `Too many requests. Resetting soon.` },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }
  }

  // ── 2. Skip public paths and static assets ─────────────────────────────────
  if (
    PUBLIC_PATHS.has(pathname) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth/') || // auth routes handle their own security
    pathname === '/api/health' || // health check is public
    pathname === '/favicon.ico' ||
    pathname === '/manifest.json' ||
    pathname.startsWith('/icons/')
  ) {
    return addSecurityHeaders(NextResponse.next());
  }

  // ── 3. Build Supabase server client using request cookies ──────────────────
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user }, error } = await supabase.auth.getUser();

  // ── 4. Redirect unauthenticated users ──────────────────────────────────────
  if (!user || error) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = user.user_metadata?.role as string | undefined;
  const pharmacyId = user.user_metadata?.pharmacy_id as string | undefined;

  // ── 5. Developer-only routes ───────────────────────────────────────────────
  if (DEV_ONLY_PATHS.some(p => pathname.startsWith(p))) {
    if (!role || !['admin', 'developer'].includes(role)) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // ── 6. Admin-only API routes ───────────────────────────────────────────────
  if (ADMIN_ONLY_API.some(p => pathname.startsWith(p))) {
    if (!role || !['admin', 'developer'].includes(role)) {
      return NextResponse.json({ error: 'Forbidden: admin role required' }, { status: 403 });
    }
  }

  // ── 7. Require pharmacy context for non-chain-admin users ──────────────────
  if (
    !pharmacyId &&
    role !== 'chain_admin' &&
    role !== 'developer' &&
    role !== 'admin' &&
    !pathname.startsWith('/api/') // API routes handle their own context
  ) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  return addSecurityHeaders(response);
}

/**
 * Adds security headers to every response.
 * These are defence-in-depth and supplement Vercel's built-in headers.
 */
function addSecurityHeaders(response: NextResponse): NextResponse {
  // Prevent MIME-type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');
  // XSS protection (legacy browsers)
  response.headers.set('X-XSS-Protection', '1; mode=block');
  // Strict referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Permissions policy — block sensitive APIs
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=()'
  );
  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // needed by Next.js
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      `connect-src 'self' ${process.env.NEXT_PUBLIC_SUPABASE_URL} wss://*.supabase.co https://generativelanguage.googleapis.com`,
      "img-src 'self' data: blob: https:",
      "frame-ancestors 'none'",
    ].join('; ')
  );
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|manifest.json).*)',
  ],
};
