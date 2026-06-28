import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { staffCreateSchema } from '@/lib/validations';

// استخدام service role لتجاوز RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // مهم جداً!
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(request: NextRequest) {
  try {
    // التحقق من المصادقة
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: { headers: { Authorization: authHeader } }
      }
    );

    // التحقق من أن المستخدم هو مدير
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role, pharmacy_id')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Only admins can create staff' },
        { status: 403 }
      );
    }

    // التحقق من البيانات
    const body = await request.json();
    const validation = staffCreateSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { email, password, full_name, role, salary, incentives } = validation.data;

    // 1. إنشاء مستخدم جديد في auth.users (باستخدام service role)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
        pharmacy_id: profile.pharmacy_id
      }
    });

    if (authError) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { error: authError.message || 'Failed to create user' },
        { status: 400 }
      );
    }

    const newUserId = authData.user.id;

    // 2. إنشاء profile في user_profiles (باستخدام service role)
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        id: newUserId,
        pharmacy_id: profile.pharmacy_id,
        full_name,
        role: role || 'staff',
        salary: salary || 0,
        incentives: incentives || 0
      });

    if (profileError) {
      console.error('Profile error:', profileError);
      // حذف المستخدم من auth إذا فشل إنشاء profile
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      return NextResponse.json(
        { error: 'Failed to create profile' },
        { status: 500 }
      );
    }

    // 3. إنشاء access في user_pharmacy_access
    const { error: accessError } = await supabaseAdmin
      .from('user_pharmacy_access')
      .insert({
        user_id: newUserId,
        pharmacy_id: profile.pharmacy_id,
        role: role || 'staff',
        is_primary: false
      });

    if (accessError) {
      console.error('Access error:', accessError);
      // لا نحذف المستخدم هنا، يمكن إصلاحه لاحقاً
    }

    return NextResponse.json({
      success: true,
      user_id: newUserId,
      message: 'Staff member created successfully'
    });

  } catch (error: any) {
    console.error('Create staff error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
