import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    const devPassword = process.env.DEVELOPER_PASSWORD;
    const devEmail = process.env.DEVELOPER_EMAIL;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // DEBUG: log env vars presence (never log actual key values)
    console.log('[DevAuth DEBUG] env check:', {
      hasDevPassword: !!devPassword,
      hasDevEmail: !!devEmail,
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceRoleKey: !!serviceRoleKey,
      supabaseUrlValue: supabaseUrl,        // OK to log URL
      devEmailValue: devEmail,              // OK to log email
    });

    if (!devPassword || !devEmail) {
      return NextResponse.json(
        { error: `[DEBUG] DEVELOPER_PASSWORD=${devPassword ? 'set' : 'MISSING'} | DEVELOPER_EMAIL=${devEmail ? 'set' : 'MISSING'}` },
        { status: 500 }
      );
    }

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: `[DEBUG] NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl ? 'set' : 'MISSING'} | SUPABASE_SERVICE_ROLE_KEY=${serviceRoleKey ? 'set' : 'MISSING'}` },
        { status: 500 }
      );
    }

    // --- Timing-safe password comparison ---
    const inputBuf = Buffer.from(password ?? '');
    const secretBuf = Buffer.from(devPassword);

    const isMatch =
      inputBuf.length === secretBuf.length &&
      crypto.timingSafeEqual(inputBuf, secretBuf);

    if (!isMatch) {
      return NextResponse.json(
        { error: 'كلمة مرور المطور غير صحيحة' },
        { status: 401 }
      );
    }

    // --- Ensure the Supabase user has role=developer stamped in metadata ---
    // This is done BEFORE the client calls signInWithPassword so that the
    // JWT issued at login already carries the correct role claim.
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: { users }, error: listError } =
      await adminSupabase.auth.admin.listUsers({ perPage: 1000 });

    if (listError) {
      console.error('[DevAuth] listUsers error:', listError);
      return NextResponse.json(
        { error: `[DEBUG] listUsers failed: ${listError.message} | status: ${(listError as any)?.status ?? 'n/a'}` },
        { status: 500 }
      );
    }

    const devUser = users.find((u) => u.email === devEmail);

    if (!devUser) {
      console.error('[DevAuth] Developer Supabase account not found:', devEmail);
      return NextResponse.json(
        { error: 'حساب المطور غير موجود في قاعدة البيانات — أنشئه يدوياً في Supabase Auth' },
        { status: 404 }
      );
    }

    // Stamp role before the client signs in
    const { error: updateError } = await adminSupabase.auth.admin.updateUserById(
      devUser.id,
      { user_metadata: { role: 'developer', pharmacy_id: null, chain_id: null } }
    );

    if (updateError) {
      console.error('[DevAuth] updateUserById error:', updateError);
      return NextResponse.json(
        { error: `[DEBUG] updateUserById failed: ${updateError.message}` },
        { status: 500 }
      );
    }

    // Return only the email — never return the password
    return NextResponse.json({ success: true, email: devEmail });

  } catch (error: any) {
    console.error('[DevAuth] Unexpected error:', error);
    return NextResponse.json(
      { error: `[DEBUG] Unexpected: ${error?.message ?? String(error)}` },
      { status: 500 }
    );
  }
}
