import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const { type } = await req.json();
    
    if (!type) {
      return NextResponse.json({ success: false, error: 'نوع التنظيف غير محدد' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Authentication & Context
    const authHeader = req.headers.get('Authorization');
    const headerPharmacyId = req.headers.get('x-pharmacy-id');
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader?.replace('Bearer ', ''));
    
    let pharmacyId = headerPharmacyId || user?.user_metadata?.pharmacy_id;
    if (!pharmacyId && user?.id) {
        const { data: accessData } = await supabase
            .from('user_pharmacy_access')
            .select('pharmacy_id')
            .eq('user_id', user.id)
            .eq('is_primary', true)
            .single();
        if (accessData) pharmacyId = accessData.pharmacy_id;
    }

    if (!pharmacyId || authError) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    let deletedCount = 0;
    const now = new Date();

    // 2. Cleanup Logic (Safe Only)
    if (type === 'audit') {
      // مسح سجلات التدقيق أقدم من 60 يوم
      const threshold = new Date(now);
      threshold.setDate(threshold.getDate() - 60);
      
      const { count } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })
        .eq('pharmacy_id', pharmacyId)
        .lt('created_at', threshold.toISOString());

      if (count && count > 0) {
          await supabase.from('audit_logs').delete().eq('pharmacy_id', pharmacyId).lt('created_at', threshold.toISOString());
          deletedCount = count;
      }

    } else if (type === 'sessions') {
      // مسح الجلسات المنتهية أقدم من سنة
      const threshold = new Date(now);
      threshold.setFullYear(threshold.getFullYear() - 1);
      
      const { count } = await supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .eq('pharmacy_id', pharmacyId)
        .not('logout_time', 'is', null)
        .lt('logout_time', threshold.toISOString());

      if (count && count > 0) {
          await supabase.from('sessions').delete().eq('pharmacy_id', pharmacyId).not('logout_time', 'is', null).lt('logout_time', threshold.toISOString());
          deletedCount = count;
      }

    } else if (type === 'cancelled_orders') {
      // مسح الطلبات الملغاة فقط (آمن تماماً)
      const { count } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('pharmacy_id', pharmacyId)
        .eq('status', 'cancelled');

      if (count && count > 0) {
          await supabase.from('orders').delete().eq('pharmacy_id', pharmacyId).eq('status', 'cancelled');
          deletedCount = count;
      }

    } else {
      return NextResponse.json({ success: false, error: 'نوع التنظيف غير مدعوم أو غير آمن' }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `تم تنظيف بيانات ${type} بنجاح.`,
      count: deletedCount 
    });

  } catch (error: any) {
    console.error('DB Cleanup Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'حدث خطأ أثناء التنظيف' }, 
      { status: 500 }
    );
  }
}