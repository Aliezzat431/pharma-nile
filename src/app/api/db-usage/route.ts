import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Call the elegant SQL RPC that accurately counts DB size and row counts instantly!
    const { data: statsData, error: rpcError } = await supabase.rpc('debug_system_stats');

    if (rpcError) {
      throw rpcError;
    }

    const { count: cancelledOrders } = await supabase
      .from('orders')
      .select('id', { count: 'exact' })
      .limit(1)
      .eq('status', 'cancelled');

    const totalRecords = statsData?.total_records || 0;
    const ordersCount = statsData?.orders || 0;
    const totalBytes = Number(statsData?.database_size_bytes || 0);

    const limitMB = Number(process.env.DATABASE_LIMIT_MB || 500);

    const mbUsed = (totalBytes / 1024 / 1024).toFixed(2);
    const sizePercentage = Math.min(100, Math.max(0.1, (Number(mbUsed) / limitMB) * 100)).toFixed(1);

    return NextResponse.json({
      success: true,
      data: {
        totalRecords,
        extractedInvoices: ordersCount,
        pendingDeleted: cancelledOrders ?? 0,
        health: 100,

        database: {
          bytes: totalBytes,
          mbUsed,
          limitMB,
          sizePercentage
        },

        tables: statsData || {},

        storageDetails: {
          label: 'قاعدة بيانات الصيدلية',
          percentage: sizePercentage,
          mb: mbUsed
        }
      }
    });
  } catch (error: any) {
    console.error('DB Usage Route Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Unknown error'
      },
      {
        status: 500
      }
    );
  }
}