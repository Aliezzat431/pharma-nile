import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const authHeader = req.headers.get('Authorization');

    
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader?.replace('Bearer ', ''));
    
    if (authError || !user) {
        return NextResponse.json({ success: false, error: 'Invalid Token' }, { status: 401 });
    }

    
    let pharmacyId = null;

    const { data: accessData } = await supabase
        .from('user_pharmacy_access')
        .select('pharmacy_id')
        .eq('user_id', user.id)
        .eq('is_primary', true)
        .maybeSingle();
    
    if (accessData?.pharmacy_id) {
        pharmacyId = accessData.pharmacy_id;
    } else {
         
         const { data: anyAccess } = await supabase
            .from('user_pharmacy_access')
            .select('pharmacy_id')
            .eq('user_id', user.id)
            .limit(1)
            .maybeSingle();
         if (anyAccess) pharmacyId = anyAccess.pharmacy_id;
    }

    if (!pharmacyId) {
      return NextResponse.json({ success: false, error: 'Could not determine Pharmacy ID' }, { status: 401 });
    }

    
    const tablesToExport = [
      'products', 'batches', 'customers', 'orders', 'order_items', 
      'stock_transfers', 'pharmacy_settings', 'financial_transactions', 
      'debt_payments', 'audit_logs', 'sessions', 'monthly_summaries', 
      'inventory_snapshots'
    ];

    const backupData: Record<string, any[]> = {};
    let totalRecords = 0;

    
    for (const table of tablesToExport) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('pharmacy_id', pharmacyId);

      if (error) {
        console.error(`Error fetching ${table}:`, error.message);
        backupData[table] = [];
      } else {
        backupData[table] = data || [];
        totalRecords += (data || []).length;
      }
    }

    
    const { data: profiles } = await supabase.from('user_profiles').select('*').eq('id', user.id);
    backupData['user_profiles'] = profiles || [];
    totalRecords += (profiles || []).length;

    const { data: accesses } = await supabase.from('user_pharmacy_access').select('*').eq('user_id', user.id);
    backupData['user_pharmacy_access'] = accesses || [];
    totalRecords += (accesses || []).length;

    const meta = {
      exported_at: new Date().toISOString(),
      pharmacy_id: pharmacyId,
      user_id: user.id,
      version: '2.2',
      tables_count: Object.keys(backupData).length,
      total_records: totalRecords
    };

    return new NextResponse(JSON.stringify({ meta, data: backupData }, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="backup_${pharmacyId.slice(0,8)}.json"`,
      },
    });

  } catch (error: any) {
    console.error('Export Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}