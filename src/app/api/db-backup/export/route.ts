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
    const pharmacyId = user?.user_metadata?.pharmacy_id;

    if (!pharmacyId || authError) {
      return NextResponse.json({ success: false, error: 'Unauthorized: No pharmacy context' }, { status: 401 });
    }

    const tablesToExport = [
      'companies',
      'products',
      'batches',
      'customers',
      'orders',
      'order_items',
      'debt_payments',
      'pharmacy_settings',
      'audit_logs',
      'financial_transactions'
    ];

    const backupData: any = {};
    const BATCH_SIZE = 1000;

    for (const table of tablesToExport) {
      let allRows: any[] = [];
      let page = 0;
      let hasMore = true;

      while (hasMore) {
        const from = page * BATCH_SIZE;
        const to = from + BATCH_SIZE - 1;

        const query = supabase
          .from(table)
          .select('*')
          .eq('pharmacy_id', pharmacyId)
          .range(from, to);

        const { data, error } = await query;


        if (error) {

          if (error.message.includes('"created_at" does not exist')) {
            const { data: fallbackData, error: fallbackError } = await supabase
              .from(table)
              .select('*')
              .range(from, to);

            if (fallbackError) throw fallbackError;
            
            if (fallbackData && fallbackData.length > 0) {
              allRows = [...allRows, ...fallbackData];
              hasMore = fallbackData.length === BATCH_SIZE;
              page++;
              continue;
            }
          }
          throw error;
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

    backupData.exported_at = new Date().toISOString();
    const jsonString = JSON.stringify(backupData);

    const todayStr = new Date().toLocaleDateString('en-CA'); // صيغة تضمن الحصول على YYYY-MM-DD بشكل ناصع

    return new NextResponse(jsonString, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="pharmacy_backup_${todayStr}.json"`,
        'Cache-Control': 'no-store, max-age=0' // منع الكاش لضمان جلب بيانات حية دائماً
      }
    });

  } catch (error: any) {
    console.error('Export Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate database backup' }, 
      { status: 500 }
    );
  }
}
