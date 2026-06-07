import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const { type } = await req.json();

    if (!type) {
      return NextResponse.json({ success: false, error: 'Missing cleanup type' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let result;

    if (type === 'audit') {
      // إصلاح البج: حساب تاريخ مستقل تماماً دون تعديل الوقت الحالي
      const auditThreshold = new Date();
      auditThreshold.setDate(auditThreshold.getDate() - 60);
      
      result = await supabase
        .from('audit_logs')
        .delete({ count: 'exact' }) // تفعيل الميزة ليرجع عدد السجلات المحذوفة بدقة
        .lt('created_at', auditThreshold.toISOString());

    } else if (type === 'orders') {
      // حذف الفواتير الملغاة مع تفعيل كاونتر الإحصاء
      result = await supabase
        .from('orders')
        .delete({ count: 'exact' })
        .eq('status', 'cancelled');

    } else if (type === 'sessions') {
      // إصلاح البج: حساب تاريخ مستقل تماماً نطرح منه سنة كاملة (365 يوماً) بأمان
      const sessionThreshold = new Date();
      sessionThreshold.setFullYear(sessionThreshold.getFullYear() - 1);
      
      result = await supabase
        .from('sessions')
        .delete({ count: 'exact' })
        .lt('ended_at', sessionThreshold.toISOString());

    } else {
      return NextResponse.json({ success: false, error: 'نوع التنظيف غير مدعوم بالنظام' }, { status: 400 });
    }

    // التحقق من وجود أخطاء في استعلام Supabase
    if (result.error) throw result.error;

    return NextResponse.json({ 
      success: true, 
      message: `تم تنظيف بيانات ${type} بنجاح من قاعدة البيانات.`,
      count: result.count ?? 0 // سيعود الآن بالرقم الحقيقي للأسطر المحذوفة
    });

  } catch (error: any) {
    console.error('DB Cleanup Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'حدث خطأ أثناء تنظيف قاعدة البيانات' }, 
      { status: 500 }
    );
  }
}