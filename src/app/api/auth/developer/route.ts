import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    const devPassword = process.env.DEVELOPER_PASSWORD;
    const devEmail    = process.env.DEVELOPER_EMAIL;
    const devUserId   = process.env.DEVELOPER_USER_ID;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!devPassword || !devEmail) {
      return NextResponse.json(
        { error: 'تكوين حساب المطور غير مكتمل في النظام (DEVELOPER_EMAIL / DEVELOPER_PASSWORD)' },
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

    // --- Stamp role=developer via Admin API (no user-lookup needed if ID is set) ---
    const adminSupabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    if (devUserId) {
      // Fast path: use the UUID directly from env
      const { error: updateError } = await adminSupabase.auth.admin.updateUserById(
        devUserId,
        { user_metadata: { role: 'developer', pharmacy_id: null, chain_id: null } }
      );

      if (updateError) {
        console.error('[DevAuth] updateUserById error:', updateError);
        return NextResponse.json(
          { error: `فشل تهيئة صلاحيات المطور: ${updateError.message}` },
          { status: 500 }
        );
      }
    } else {
      // Fallback: use Supabase Auth REST API directly (bypasses PostgREST schema limitation)
      try {
        const resp = await fetch(
          `${supabaseUrl}/auth/v1/admin/users?page=1&per_page=1000`,
          {
            headers: {
              apikey: serviceKey,
              Authorization: `Bearer ${serviceKey}`,
            },
          }
        );

        if (!resp.ok) {
          const body = await resp.text();
          console.error('[DevAuth] Auth REST API error:', body);
          return NextResponse.json(
            { error: `فشل جلب حسابات المطورين: ${resp.status} — ${body}` },
            { status: 500 }
          );
        }

        const { users } = await resp.json();
        const devUser = (users as any[])?.find((u) => u.email === devEmail);

        if (!devUser) {
          return NextResponse.json(
            { error: `حساب المطور غير موجود في Supabase Auth — أنشئه أولاً أو أضف DEVELOPER_USER_ID=${devUserId || 'your-uuid-here'} في .env.local` },
            { status: 404 }
          );
        }

        const { error: updateError } = await adminSupabase.auth.admin.updateUserById(
          devUser.id,
          { user_metadata: { role: 'developer', pharmacy_id: null, chain_id: null } }
        );

        if (updateError) {
          console.error('[DevAuth] updateUserById error:', updateError);
          return NextResponse.json(
            { error: `فشل تهيئة صلاحيات المطور: ${updateError.message}` },
            { status: 500 }
          );
        }

        // Hint for next time
        console.info(`[DevAuth] TIP: Add DEVELOPER_USER_ID=${devUser.id} to .env.local to speed up login`);
      } catch (fetchError: any) {
        console.error('[DevAuth] Fetch error:', fetchError);
        return NextResponse.json(
          { error: `فشل الاتصال بـ Supabase Auth: ${fetchError?.message || String(fetchError)}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true, email: devEmail });

  } catch (error: any) {
    console.error('[DevAuth] Unexpected error:', error);
    return NextResponse.json(
      { error: `حدث خطأ غير متوقع: ${error?.message || String(error)}` },
      { status: 500 }
    );
  }
}