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

    for (const table of tablesToExport) {
      const { data, error } = await supabase.from(table).select('*');
      if (error) {
        throw error;
      }
      backupData[table] = data;
    }

    backupData.exported_at = new Date().toISOString();

    const json = JSON.stringify(backupData);

    const blob = new Blob([json], { type: 'application/json' });

    return new NextResponse(blob, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="pharmacy_backup_${new Date().toISOString().split('T')[0]}.json"`
      }
    });
  } catch (error: any) {
    console.error('Export Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
