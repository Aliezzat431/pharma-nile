import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import { staffCreateSchema } from '@/lib/validations';

// ✅ إنشاء Supabase Admin Client باستخدام service_role key
const getSupabaseAdmin = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

export async function POST(request: NextRequest) {
  try {
    // 1. التحقق من جلسة المستخدم الحالي
    const supabase = await createSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'غير مصرح - يرجى تسجيل الدخول' },
        { status: 401 }
      );
    }

    // 2. جلب بيانات المستخدم الحالي والتحقق من أنه مدير
    const { data: currentUserProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('pharmacy_id, role')
      .eq('id', user.id)
      .single();

    if (profileError || !currentUserProfile) {
      return NextResponse.json(
        { error: 'لم يتم العثور على ملف المستخدم' },
        { status: 404 }
      );
    }

    if (currentUserProfile.role !== 'admin') {
      return NextResponse.json(
        { error: 'غير مصرح - يجب أن تكون مديراً لإضافة موظفين' },
        { status: 403 }
      );
    }

    const pharmacyId = currentUserProfile.pharmacy_id;
    if (!pharmacyId) {
      return NextResponse.json(
        { error: 'لم يتم العثور على معرف الصيدلية' },
        { status: 400 }
      );
    }

    // 3. قراءة وتحليل البيانات المرسلة
    const body = await request.json();
    const validation = staffCreateSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'بيانات غير صحيحة', 
          details: validation.error.flatten().fieldErrors 
        },
        { status: 400 }
      );
    }

    const { email, password, full_name, role, salary, incentives } = validation.data;

    // 4. إنشاء المستخدم الجديد في auth.users باستخدام service_role
    const supabaseAdmin = getSupabaseAdmin();
    
    const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
        pharmacy_id: pharmacyId,
        role
      }
    });

    if (createUserError || !newUser.user) {
      console.error('Create user error:', createUserError);
      
      if (createUserError?.message?.includes('already been registered')) {
        return NextResponse.json(
          { error: 'البريد الإلكتروني مسجل مسبقاً' },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { error: createUserError?.message || 'فشل إنشاء حساب المستخدم' },
        { status: 500 }
      );
    }

    const newUserId = newUser.user.id;

    // 5. إنشاء ملف المستخدم في user_profiles
    const { error: insertProfileError } = await supabase
      .from('user_profiles')
      .insert({
        id: newUserId,
        pharmacy_id: pharmacyId,
        full_name,
        role,
        salary: salary || 0,
        incentives: incentives || 0
      });

    if (insertProfileError) {
      console.error('Insert profile error:', insertProfileError);
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      
      return NextResponse.json(
        { error: 'فشل إنشاء ملف الموظف' },
        { status: 500 }
      );
    }

    // 6. إضافة صلاحية الوصول للصيدلية
    const { error: accessError } = await supabase
      .from('user_pharmacy_access')
      .insert({
        user_id: newUserId,
        pharmacy_id: pharmacyId,
        role,
        is_primary: false
      });

    if (accessError) {
      console.error('Access error:', accessError);
    }

    // 7. تسجيل العملية في audit_logs
    await supabase.from('audit_logs').insert({
      pharmacy_id: pharmacyId,
      user_id: user.id,
      action: 'staff_created',
      entity_type: 'user',
      entity_id: newUserId,
      new_data: {
        email,
        full_name,
        role,
        salary,
        incentives
      }
    });

    // 8. إرجاع الاستجابة الناجحة
    return NextResponse.json(
      { 
        success: true, 
        message: 'تم إضافة الموظف بنجاح',
        user: {
          id: newUserId,
          email,
          full_name,
          role
        }
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Staff creation error:', error);
    
    return NextResponse.json(
      { error: error.message || 'حدث خطأ داخلي في الخادم' },
      { status: 500 }
    );
  }
}
