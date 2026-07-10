import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    const devPassword = process.env.DEVELOPER_PASSWORD;
    const devEmail    = process.env.DEVELOPER_EMAIL;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!devPassword || !devEmail) {
      return NextResponse.json(
        { error: 'تكوين حساب المطور غير مكتمل في النظام' },
        { status: 500 }
      );
    }

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { error: 'متغيرات بيئة Supabase غير مكتملة' },
        { status: 500 }
      );
    }

    // --- Timing-safe password comparison ---
    const inputBuf  = Buffer.from(password ?? '');
    const secretBuf = Buffer.from(devPassword);
    const isMatch   =
      inputBuf.length === secretBuf.length &&
      crypto.timingSafeEqual(inputBuf, secretBuf);

    if (!isMatch) {
      return NextResponse.json(
        { error: 'كلمة مرور المطور غير صحيحة' },
        { status: 401 }
      );
    }

    const adminSupabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // --- Find user by querying auth.users directly (avoids the flaky listUsers Admin endpoint) ---
    const { data: authUser, error: findError } = await adminSupabase
      .schema('auth')
      .from('users')
      .select('id, email')
      .eq('email', devEmail)
      .maybeSingle();

    if (findError) {
      console.error('[DevAuth] auth.users query error:', findError);
      return NextResponse.json(
        { error: `خطأ أثناء البحث عن حساب المطور: ${findError.message}` },
        { status: 500 }
      );
    }

    if (!authUser) {
      console.error('[DevAuth] Developer account not found in auth.users:', devEmail);
      return NextResponse.json(
        { error: 'حساب المطور غير موجود — أنشئه يدوياً في Supabase Auth ثم أضف بريده في DEVELOPER_EMAIL' },
        { status: 404 }
      );
    }

    // --- Stamp role=developer in metadata BEFORE the client signs in ---
    const { error: updateError } = await adminSupabase.auth.admin.updateUserById(
      authUser.id,
      { user_metadata: { role: 'developer', pharmacy_id: null, chain_id: null } }
    );

    if (updateError) {
      console.error('[DevAuth] updateUserById error:', updateError);
      return NextResponse.json(
        { error: `فشل تهيئة صلاحيات المطور: ${updateError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, email: devEmail });

  } catch (error: any) {
    console.error('[DevAuth] Unexpected error:', error);
    return NextResponse.json(
      { error: `حدث خطأ غير متوقع: ${error?.message ?? String(error)}` },
      { status: 500 }
    );
  }
}
