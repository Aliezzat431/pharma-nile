import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ── 1. Secure Authentication ─────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization');
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader?.replace('Bearer ', '')
    );

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // ── 2. Derive Pharmacy ID securely from DB ───────────────────────────────
    let pharmacyId: string | null = null;

    const { data: primaryAccess } = await supabase
      .from('user_pharmacy_access')
      .select('pharmacy_id')
      .eq('user_id', user.id)
      .eq('is_primary', true)
      .maybeSingle();

    if (primaryAccess?.pharmacy_id) {
      pharmacyId = primaryAccess.pharmacy_id;
    } else {
      const { data: anyAccess } = await supabase
        .from('user_pharmacy_access')
        .select('pharmacy_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();
      if (anyAccess?.pharmacy_id) pharmacyId = anyAccess.pharmacy_id;
    }

    if (!pharmacyId) {
      return NextResponse.json({ success: false, error: 'No pharmacy context found' }, { status: 401 });
    }

    // ── 3. Collect table row counts ──────────────────────────────────────────
    const tables = [
      'products', 'batches', 'customers', 'orders', 'order_items',
      'financial_transactions', 'debt_payments', 'sessions',
      'audit_logs', 'monthly_summaries', 'inventory_snapshots', 'stock_transfers'
    ];

    const tableCounts: Record<string, number> = {};
    let totalRecords = 0;

    await Promise.all(
      tables.map(async (table) => {
        const { count } = await supabase
          .from(table as any)
          .select('*', { count: 'exact', head: true })
          .eq('pharmacy_id', pharmacyId);
        const c = count ?? 0;
        tableCounts[table] = c;
        totalRecords += c;
      })
    );

    // ── 4. Count extracted invoices ──────────────────────────────────────────
    const { count: invoiceCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('pharmacy_id', pharmacyId)
      .eq('status', 'completed');

    // ── 5. Count pending-deleted (cancelled orders) ──────────────────────────
    const { count: cancelledCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('pharmacy_id', pharmacyId)
      .eq('status', 'cancelled');

    // ── 6. Compute estimated DB usage ────────────────────────────────────────
    // Rough estimate: ~900 bytes per record average across all tables
    const estimatedBytes = totalRecords * 900;
    const estimatedMB = estimatedBytes / (1024 * 1024);
    const limitMB = 500;
    const sizePercentage = Math.min(100, Math.round((estimatedMB / limitMB) * 100 * 10) / 10);

    // ── 7. System health score ────────────────────────────────────────────────
    const cleanableCount =
      (tableCounts['sessions'] ?? 0) +
      (tableCounts['audit_logs'] ?? 0) +
      (cancelledCount ?? 0);

    // Health degrades the closer we are to limit
    const health = Math.max(0, Math.round(100 - sizePercentage * 0.5));

    return NextResponse.json({
      success: true,
      data: {
        database: {
          mbUsed: Math.max(0.1, parseFloat(estimatedMB.toFixed(2))),
          limitMB,
          sizePercentage,
        },
        tables: tableCounts,
        totalRecords,
        extractedInvoices: invoiceCount ?? 0,
        pendingDeleted: cancelledCount ?? 0,
        cleanableCount,
        health,
      },
    });

  } catch (error: any) {
    console.error('[db-usage] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}