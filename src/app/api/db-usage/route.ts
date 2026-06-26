import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const authHeader = req.headers.get('Authorization');
    const pharmacyId = req.headers.get('x-pharmacy-id');

    // Fallback to cookie/session auth if no header
    const { data: { user } } = await supabase.auth.getUser(authHeader?.replace('Bearer ', ''));
    const finalPharmacyId = pharmacyId || user?.user_metadata?.pharmacy_id;

    if (!finalPharmacyId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { data: statsData, error: rpcError } = await supabase.rpc('debug_system_stats', { p_pharmacy_id: finalPharmacyId });

    if (rpcError) {
      console.warn('RPC stats failed, falling back to manual counts');
    }

    const ordersQueryResult = await supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('pharmacy_id', finalPharmacyId)
      .eq('status', 'cancelled');


    if (ordersQueryResult.error) {
      console.error('Error fetching cancelled orders:', ordersQueryResult.error.message);
    }

    const cancelledCount = ordersQueryResult.count ?? 0;

    const totalRecords = Number(statsData?.total_records || 0);
    const ordersCount = Number(statsData?.orders || 0);
    const totalBytes = Number(statsData?.database_size_bytes || 0);

    const limitMB = Number(process.env.DATABASE_LIMIT_MB || 500);

    const mbUsedRaw = totalBytes / 1024 / 1024;
    const mbUsed = mbUsedRaw.toFixed(2);

    const sizePercentage = Math.min(100, Math.max(0, (mbUsedRaw / limitMB) * 100)).toFixed(1);

    return NextResponse.json({
      success: true,
      data: {
        totalRecords,
        extractedInvoices: ordersCount,
        pendingDeleted: cancelledCount,
        health: 100, // مؤشر افتراضي لسلامة النظام

        database: {
          bytes: totalBytes,
          mbUsed: Number(mbUsed),
          limitMB,
          sizePercentage: Number(sizePercentage)
        },

        tables: statsData || {},

        storageDetails: {
          label: 'قاعدة بيانات الصيدلية',
          percentage: Number(sizePercentage),
          mb: Number(mbUsed)
        }
      }
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0, must-revalidate' // حماية إضافية على مستوى المتصفح لمنع الكاش
      }
    });

  } catch (error: any) {
    console.error('DB Usage Route Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Unknown error occurred while fetching stats'
      },
      {
        status: 500
      }
    );
  }
}
