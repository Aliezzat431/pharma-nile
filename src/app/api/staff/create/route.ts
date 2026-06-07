import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, password, full_name, role } = await request.json();

    if (!email || !password || !full_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. إنشاء عميل Supabase عادي للتحقق من جلسة وصلاحيات المستخدم الحالي الذي أطلق الطلب
    const supabaseUserClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // جلب الـ Token من ترويسة الطلب (Authorization Header)
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseUserClient.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
    }

    // 2. التحقق من قاعدة البيانات للتأكد من أن المستخدم الحالي هو "admin" فعلاً وليس موظف عادي
    const { data: currentUserProfile, error: profileCheckError } = await supabaseUserClient
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileCheckError || currentUserProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Only administrators can create staff accounts' }, { status: 403 });
    }

    // 3. إنشاء كائن الـ Admin الآمن بعد تخطي حواجز الحماية بنجاح
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // 4. إنشاء المستخدم في نظام الحماية (Supabase Auth)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name }
    });

    if (authError) throw authError;

    // 5. تعيين الصلاحية بأمان (لو طلب الأدمن تعيين دور معين، يتم اختياره، وإلا فالافتراضي هو staff)
    const finalRole = role === 'admin' ? 'admin' : 'staff';

    // حفظ ملف الموظف الجديد في جدول التوصيف
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .upsert({
        id: authData.user.id,
        full_name,
        role: finalRole // حماية حتمية ضد الـ Privilege Escalation
      });

    if (profileError) throw profileError;

    return NextResponse.json({ success: true, user: authData.user });

  } catch (error: any) {
    console.error('Error creating staff:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}