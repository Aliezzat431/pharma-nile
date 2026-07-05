import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    const devPassword = process.env.DEVELOPER_PASSWORD;
    const devEmail    = process.env.DEVELOPER_EMAIL;

    if (!devPassword || !devEmail) {
      return NextResponse.json(
        { error: 'تكوين حساب المطور غير مكتمل في النظام' },
        { status: 500 }
      );
    }

    // --- Timing-safe password comparison ---
    const inputBuf  = Buffer.from(password  ?? '');
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
      console.error('[DevAuth] listUsers error:', listError.message);
      return NextResponse.json(
        { error: 'خطأ داخلي أثناء التحقق من حساب المطور' },
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
      console.error('[DevAuth] updateUserById error:', updateError.message);
      return NextResponse.json(
        { error: 'فشل تهيئة صلاحيات المطور' },
        { status: 500 }
      );
    }

    // Return only the email — never return the password
    return NextResponse.json({ success: true, email: devEmail });

  } catch (error: any) {
    console.error('[DevAuth] Unexpected error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ غير متوقع' },
      { status: 500 }
    );
  }
}
