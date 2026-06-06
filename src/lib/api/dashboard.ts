import { supabase } from '../supabase';

export interface DashboardStats {
  todaySales: string;
  todayProfit: string;
  activeSessions: string;
  lowStockItems: string;
  expiringSoon: string;
  weeklyData: { name: string, sales: number, debts: number }[];
}

export interface RecentTransaction {
  id: string;
  created_at: string;
  total: number;
  payment_method: string;
}

/**
 * Uses the server-side get_dashboard_stats RPC to fetch all stats
 * in a single DB round-trip instead of 5 separate queries.
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const { data: { user } } = await supabase.auth.getUser();
  const pharmacyId = user?.user_metadata?.pharmacy_id;

  if (!pharmacyId) {
    return {
      todaySales: `ج.م 0`,
      todayProfit: `ج.م 0`,
      activeSessions: `0 موظف`,
      lowStockItems: "0",
      expiringSoon: "0",
      weeklyData: []
    };
  }

  const { data, error } = await supabase.rpc('get_dashboard_stats', {
    p_pharmacy_id: pharmacyId
  });

  if (error || !data) {
    console.error('Error fetching dashboard stats via RPC:', error);
    // Graceful fallback: return zeros
    return {
      todaySales: `ج.م 0`,
      todayProfit: `ج.م 0`,
      activeSessions: `0 موظف`,
      lowStockItems: "0",
      expiringSoon: "0",
      weeklyData: []
    };
  }

  // Map Arabic day names for weekly chart
  const arabicDays: Record<string, string> = {
    'Sunday':    'الأحد',
    'Monday':    'الاثنين',
    'Tuesday':   'الثلاثاء',
    'Wednesday': 'الأربعاء',
    'Thursday':  'الخميس',
    'Friday':    'الجمعة',
    'Saturday':  'السبت',
  };

  const weeklyData = (data.weekly_data || []).map((d: { name: string; sales: number; debts: number }) => ({
    name: arabicDays[d.name?.trim()] || d.name,
    sales: Number(d.sales || 0),
    debts: Number(d.debts || 0),
  }));

  return {
    todaySales:     `ج.م ${Number(data.today_sales || 0).toLocaleString()}`,
    todayProfit:    `ج.م ${Number(data.today_profit || 0).toLocaleString()}`,
    activeSessions: `${data.active_sessions || 0} موظف`,
    lowStockItems:  String(data.low_stock || 0),
    expiringSoon:   String(data.expiring_soon || 0),
    weeklyData,
  };
}

export async function getRecentTransactions(): Promise<RecentTransaction[]> {
  const { data: { user } } = await supabase.auth.getUser();
  const pharmacyId = user?.user_metadata?.pharmacy_id;
  if (!pharmacyId) return [];

  const { data, error } = await supabase
    .from('orders')
    .select('id, created_at, total, payment_method')
    .eq('pharmacy_id', pharmacyId)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) return [];
  return data || [];
}
