import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const tablesToExport = [
      'pharmacies',
      'companies',
      'products',
      'batches',
      'customers',
      'orders',
      'order_items',
      'debt_payments'
    ];

    const backupData: any = {};
    const BATCH_SIZE = 1000; // حجم الدفعة الواحدة لتفادي سقف الـ 1000 سجل واستهلاك الذاكرة

    for (const table of tablesToExport) {
      let allRows: any[] = [];
      let page = 0;
      let hasMore = true;

      while (hasMore) {
        const from = page * BATCH_SIZE;
        const to = from + BATCH_SIZE - 1;

        const { data, error } = await supabase
          .from(table)
          .select('*')
          .range(from, to)
          .order('created_at', { ascending: true }); // ترتيب ثابت لضمان سلامة الـ Range الفني

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
