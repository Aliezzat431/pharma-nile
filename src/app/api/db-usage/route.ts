import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// إجبار Next.js على جلب البيانات بشكل حي دائماً وعدم تخزين الرد (No Caching)
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. استدعاء الدالة المخزنة RPC لجلب إحصائيات النظام الفورية
    const { data: statsData, error: rpcError } = await supabase.rpc('debug_system_stats');

    if (rpcError) {
      throw rpcError;
    }

    // 2. إصلاح استعلام الفواتير الملغاة وقراءة الـ count بشكل صحيح وامن
    const ordersQueryResult = await supabase
      .from('orders')
      .select('id', { count: 'exact', head: true }) // استخدام head: true يسرع الاستعلام لأنه لا يجلب السجلات نفسها بل العدد فقط
      .eq('status', 'cancelled');

    if (ordersQueryResult.error) {
      console.error('Error fetching cancelled orders:', ordersQueryResult.error.message);
    }

    const cancelledCount = ordersQueryResult.count ?? 0;

    // 3. تأمين معالجة الأرقام وتحويلها بدقة
    const totalRecords = Number(statsData?.total_records || 0);
    const ordersCount = Number(statsData?.orders || 0);
    const totalBytes = Number(statsData?.database_size_bytes || 0);

    const limitMB = Number(process.env.DATABASE_LIMIT_MB || 500);

    // حساب الحجم بالميجابايت والنسبة المئوية للاستهلاك
    const mbUsedRaw = totalBytes / 1024 / 1024;
    const mbUsed = mbUsedRaw.toFixed(2);
    
    // منع حدوث أخطاء حسابية في النسبة وتحديد سقفها بين 0% و 100%
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