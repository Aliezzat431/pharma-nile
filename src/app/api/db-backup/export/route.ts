import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Authentication & Context
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ success: false, error: 'Missing Authorization Header' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Invalid Token' }, { status: 401 });
    }

    // Get Pharmacy ID from Header or User Metadata
    let pharmacyId = req.headers.get('x-pharmacy-id') || user?.user_metadata?.pharmacy_id;

    if (!pharmacyId) {
      // Fallback: Try to fetch primary pharmacy from user_pharmacy_access if not in metadata
      const { data: accessData } = await supabase
        .from('user_pharmacy_access')
        .select('pharmacy_id')
        .eq('user_id', user.id)
        .eq('is_primary', true)
        .single();
      
      if (accessData?.pharmacy_id) {
        pharmacyId = accessData.pharmacy_id;
      }
    }

    if (!pharmacyId) {
      return NextResponse.json({ success: false, error: 'Unauthorized: No pharmacy context found' }, { status: 401 });
    }

    // 2. Define Tables based on the provided SQL Schema
    // All these tables have a direct 'pharmacy_id' column in your schema
    const tablesToExport = [
      'products',
      'batches',
      'customers',
      'orders',
      'order_items', // Now has pharmacy_id in your schema
      'stock_transfers',
      'pharmacy_settings',
      'financial_transactions',
      'debt_payments', // Now has pharmacy_id in your schema
      'audit_logs',
      'sessions',
      'monthly_summaries',
      'inventory_snapshots',
      'user_profiles', // Filtered by user_id usually, but we'll include if needed or skip if sensitive
      'user_pharmacy_access' // Filtered by user_id
    ];

    const backupData: Record<string, any[]> = {};
    const BATCH_SIZE = 1000;

    // 3. Export Data
    for (const table of tablesToExport) {
      let allRows: any[] = [];
      let page = 0;
      let hasMore = true;

      // Special handling for user-specific tables to ensure privacy even with Service Role
      let query = supabase.from(table).select('*');

      if (table === 'user_profiles' || table === 'user_pharmacy_access') {
        // For these tables, filter by user_id instead of pharmacy_id primarily, 
        // or both if you want only users linked to this pharmacy.
        // Let's filter by pharmacy_id as per your RLS logic context
        query = query.eq('pharmacy_id', pharmacyId);
      } else {
        // Standard tables filtered by pharmacy_id
        query = query.eq('pharmacy_id', pharmacyId);
      }

      while (hasMore) {
        const from = page * BATCH_SIZE;
        const to = from + BATCH_SIZE - 1;

        const { data, error } = await query.range(from, to);

        if (error) {
          console.error(`Error exporting table ${table}:`, error.message);
          // Don't break, just mark this table as empty/failed and continue
          backupData[table] = []; 
          hasMore = false;
          break;
        }

        if (data && data.length > 0) {
          allRows = [...allRows, ...data];
          hasMore = data.length === BATCH_SIZE;
          page++;
        } else {
          hasMore = false;
        }
      }

      backupData[table] = allRows;
    }

    // 4. Prepare Response
    const meta = {
      exported_at: new Date().toISOString(),
      pharmacy_id: pharmacyId,
      user_id: user.id,
      version: '2.1', // Updated version
      tables_count: Object.keys(backupData).length,
      total_records: Object.values(backupData).reduce((acc, curr) => acc + curr.length, 0)
    };

    const output = { meta, data: backupData }; // Wrapped in 'data' key for cleaner structure
    const jsonString = JSON.stringify(output, null, 2);

    const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD

    return new NextResponse(jsonString, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="pharma_nile_backup_${todayStr}.json"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    });

  } catch (error: any) {
    console.error('Export Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate database backup' },
      { status: 500 }
    );
  }
}