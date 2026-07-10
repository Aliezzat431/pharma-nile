/**
 * @file api-guard.ts
 * @description Composable auth/role guard for API routes.
 *
 * Usage in any API route:
 *   import { requireAuth, requireAdmin } from '@/lib/api-guard';
 *
 *   export async function POST(req: NextRequest) {
 *     const { user, errorResponse } = await requireAdmin(req);
 *     if (errorResponse) return errorResponse;
 *     // user is guaranteed non-null + admin role here
 *   }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export type AuthedUser = {
  id: string;
  email: string;
  role: string;
  pharmacy_id: string | null;
  chain_id: string | null;
};

type GuardResult =
  | { user: AuthedUser; errorResponse: null }
  | { user: null; errorResponse: NextResponse };

const NULL_UUID = '00000000-0000-0000-0000-000000000000';

/**
 * Creates a Supabase server client from a NextRequest (reads cookies).
 * Returns a client + a response object for cookie propagation.
 */
function buildServerClient(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('[PharmaNile] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY env vars.');
  }

  const res = NextResponse.next();
  const client = createServerClient(url, key, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (cookiesToSet) =>
        cookiesToSet.forEach(({ name, value, options }) => {
          res.cookies.set(name, value, options);
        }),
    },
  });
  return { client, res };
}

/** Requires a valid authenticated session. Returns 401 otherwise. */
export async function requireAuth(req: NextRequest): Promise<GuardResult> {
  const { client } = buildServerClient(req);
  const { data: { user }, error } = await client.auth.getUser();

  if (error || !user) {
    return {
      user: null,
      errorResponse: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  return {
    user: {
      id: user.id,
      email: user.email ?? '',
      role: user.user_metadata?.role ?? 'staff',
      pharmacy_id: user.user_metadata?.pharmacy_id ?? null,
      chain_id: user.user_metadata?.chain_id ?? null,
    },
    errorResponse: null,
  };
}

/** Requires admin or developer role. Returns 403 otherwise. */
export async function requireAdmin(req: NextRequest): Promise<GuardResult> {
  const result = await requireAuth(req);
  if (result.errorResponse) return result;

  const { user } = result;
  if (!['admin', 'developer'].includes(user.role)) {
    return {
      user: null,
      errorResponse: NextResponse.json(
        { error: 'Forbidden: admin role required' },
        { status: 403 }
      ),
    };
  }
  return result;
}

/** Requires developer role only. Returns 403 otherwise. */
export async function requireDeveloper(req: NextRequest): Promise<GuardResult> {
  const result = await requireAuth(req);
  if (result.errorResponse) return result;

  const { user } = result;
  if (user.role !== 'developer') {
    return {
      user: null,
      errorResponse: NextResponse.json(
        { error: 'Forbidden: developer role required' },
        { status: 403 }
      ),
    };
  }
  return result;
}

/**
 * Returns a safe pharmacy_id for queries.
 * Falls back to NULL_UUID if user has no pharmacy (developer / chain_admin).
 * This prevents PostgreSQL UUID type mismatch errors on empty strings.
 */
export function safePharmacyId(user: AuthedUser): string {
  return user.pharmacy_id ?? NULL_UUID;
}

/**
 * Parses and validates a JSON request body using a Zod schema.
 * Returns { data } on success or { errorResponse } on validation failure.
 */
export async function parseBody<T>(
  req: NextRequest,
  schema: { safeParse: (input: unknown) => { success: boolean; data?: T; error?: any } }
): Promise<{ data: T; errorResponse: null } | { data: null; errorResponse: NextResponse }> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return {
      data: null,
      errorResponse: NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }),
    };
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    return {
      data: null,
      errorResponse: NextResponse.json(
        { error: 'Validation failed', details: result.error?.issues },
        { status: 422 }
      ),
    };
  }
  return { data: result.data as T, errorResponse: null };
}
