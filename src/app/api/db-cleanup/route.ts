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

    const authHeader = req.headers.get('Authorization');
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader?.replace('Bearer ', ''));
    
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Authentication required' }, { status: 401 });
    }

    // ── Derive Pharmacy ID securely from Database (never trust client headers/metadata) ──
    const { data: accessData } = await supabase
      .from('user_pharmacy_access')
      .select('pharmacy_id')
      .eq('user_id', user.id)
      .eq('is_primary', true)
      .maybeSingle(); // Safe selection - prevents PGRST116 exceptions

    const pharmacyId = accessData?.pharmacy_id;

    if (!pharmacyId) {
      return NextResponse.json({ success: false, error: 'Unauthorized: No primary pharmacy context found' }, { status: 401 });
    }

    let deletedCount = 0;

    if (type === 'audit') {
      // Delete audit logs older than 60 days
      const auditThreshold = new Date();
      auditThreshold.setDate(auditThreshold.getDate() - 60);
      
      // Get count first
      const { count } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })
        .eq('pharmacy_id', pharmacyId)
        .lt('created_at', auditThreshold.toISOString());

      if (count && count > 0) {
          const { error } = await supabase
            .from('audit_logs')
            .delete()
            .eq('pharmacy_id', pharmacyId)
            .lt('created_at', auditThreshold.toISOString());
          
          if (error) throw error;
          deletedCount = count;
      }

    } else if (type === 'orders') {
      // Delete cancelled orders
      const { count } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('pharmacy_id', pharmacyId)
        .eq('status', 'cancelled');

      if (count && count > 0) {
          const { error } = await supabase
            .from('orders')
            .delete()
            .eq('pharmacy_id', pharmacyId)
            .eq('status', 'cancelled');
          
          if (error) throw error;
          deletedCount = count;
      }

    } else if (type === 'sessions') {
      // Delete old sessions (older than 1 year)
      const sessionThreshold = new Date();
      sessionThreshold.setFullYear(sessionThreshold.getFullYear() - 1);
      
      // Note: Column name is 'logout_time' in our schema, not 'ended_at'
      const { count } = await supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .eq('pharmacy_id', pharmacyId)
        .not('logout_time', 'is', null) // Only delete sessions that have an end time
        .lt('logout_time', sessionThreshold.toISOString());

      if (count && count > 0) {
          const { error } = await supabase
            .from('sessions')
            .delete()
            .eq('pharmacy_id', pharmacyId)
            .not('logout_time', 'is', null)
            .lt('logout_time', sessionThreshold.toISOString());
          
          if (error) throw error;
          deletedCount = count;
      }

    } else {
      return NextResponse.json({ success: false, error: 'نوع التنظيف غير مدعوم بالنظام' }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `تم تنظيف بيانات ${type} بنجاح.`,
      count: deletedCount
    });

  } catch (error: any) {
    console.error('DB Cleanup Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'حدث خطأ أثناء تنظيف قاعدة البيانات' }, 
      { status: 500 }
    );
  }
}