import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// POST /api/chain/pharmacies — chain admins create a new branch in their chain
export async function POST(request: NextRequest) {
  try {
    const { name, address, phone } = await request.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: 'اسم الفرع مطلوب' }, { status: 400 });
    }

    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await adminSupabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'جلسة غير صالحة' }, { status: 401 });
    }

    const { data: profile, error: profileError } = await adminSupabase
      .from('user_profiles')
      .select('role, chain_id')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'لم يتم العثور على ملف المستخدم' }, { status: 403 });
    }
    if (profile.role !== 'admin') {
      return NextResponse.json({ error: 'هذا الإجراء مخصص لمدير السلسلة فقط' }, { status: 403 });
    }
    if (!profile.chain_id) {
      return NextResponse.json({ error: 'حساب المدير غير مرتبط بسلسلة' }, { status: 403 });
    }

    const { data: existing } = await adminSupabase
      .from('pharmacies')
      .select('id')
      .eq('chain_id', profile.chain_id)
      .ilike('name', name.trim())
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'يوجد فرع بهذا الاسم بالفعل في سلسلتك' }, { status: 409 });
    }

    const { data: pharmacy, error: insertError } = await adminSupabase
      .from('pharmacies')
      .insert({
        name:     name.trim(),
        address:  address?.trim() || null,
        phone:    phone?.trim()   || null,
        is_active: true,
        chain_id: profile.chain_id,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[chain/pharmacies] insert error:', insertError.message);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // ✅ التعديل هنا - استخدام upsert بدلاً من onConflict
    await adminSupabase
      .from('user_pharmacy_access')
      .upsert(
        { 
          user_id: user.id, 
          pharmacy_id: pharmacy.id, 
          role: 'admin', 
          is_primary: false 
        },
        { onConflict: 'user_id, pharmacy_id' }
      );

    return NextResponse.json({ success: true, pharmacy });
  } catch (err: any) {
    console.error('[chain/pharmacies] unexpected error:', err);
    return NextResponse.json({ error: 'حدث خطأ غير متوقع' }, { status: 500 });
  }
}

// GET /api/chain/pharmacies — list all branches in the caller's chain
export async function GET(request: NextRequest) {
  try {
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await adminSupabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'جلسة غير صالحة' }, { status: 401 });
    }

    const { data: profile } = await adminSupabase
      .from('user_profiles')
      .select('chain_id')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile?.chain_id) {
      return NextResponse.json({ pharmacies: [] });
    }

    const { data: pharmacies, error } = await adminSupabase
      .from('pharmacies')
      .select('id, name, address, phone, is_active, created_at')
      .eq('chain_id', profile.chain_id)
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ pharmacies: pharmacies ?? [] });
  } catch (err: any) {
    return NextResponse.json({ error: 'حدث خطأ غير متوقع' }, { status: 500 });
  }
}