import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as Blob | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    const text = await file.text();
    const backupData = JSON.parse(text);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const tablesToImport = [
      'pharmacies',
      'companies',
      'products',
      'batches',
      'customers',
      'orders',
      'order_items',
      'debt_payments'
    ];

    for (const table of tablesToImport) {
      if (backupData[table] && Array.isArray(backupData[table]) && backupData[table].length > 0) {
        const { error } = await supabase.from(table).upsert(backupData[table]);
        if (error) {
          console.error(`Error importing table ${table}:`, error);
          throw new Error(`Error importing ${table}: ${error.message}`);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Import Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
