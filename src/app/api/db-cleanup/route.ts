import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const { type } = await req.json();

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let result;
    const now = new Date();

    if (type === 'audit') {
      // Delete audit logs older than 60 days
      const thresholdDate = new Date(now.setDate(now.getDate() - 60)).toISOString();
      result = await supabase
        .from('audit_logs')
        .delete()
        .lt('created_at', thresholdDate);
    } else if (type === 'orders') {
      // Delete cancelled orders
      result = await supabase
        .from('orders')
        .delete()
        .eq('status', 'cancelled');
    } else if (type === 'sessions') {
      // Delete old sessions older than 365 days
      const thresholdDate = new Date(now.setFullYear(now.getFullYear() - 1)).toISOString();
      result = await supabase
        .from('sessions')
        .delete()
        .lt('ended_at', thresholdDate);
    } else {
      return NextResponse.json({ success: false, error: 'Invalid cleanup type' }, { status: 400 });
    }

    if (result.error) throw result.error;

    return NextResponse.json({ 
      success: true, 
      message: `تم تنظيف بيانات ${type} بنجاح`,
      count: result.count
    });

  } catch (error: any) {
    console.error('DB Cleanup Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
